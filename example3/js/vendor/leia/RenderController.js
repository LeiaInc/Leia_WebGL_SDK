import { V_SHADER } from "./shaders/VertexShader.js";
import { FRAG_SHADER } from "./shaders/FragmentShader.js";
import { VIEWSHARPENING_SHADER } from "./shaders/ViewSharpeningShader.js";
import ConfigController from "./ConfigController.js";
import BackLightController from "./BackLightController.js";

var CAMCOUNT = 4;
var positionBuffer = null;
var texcoordBuffer = null;
var gl = null;
var nativeMode;
var enableViewSharpening = true;
var maxAttribs = 16;

export default {
  initialize(canvas, _gl, window, _nativeMode, _maxAttribs, _enableViewSharpening) {

    nativeMode = _nativeMode;
    gl = _gl;
    maxAttribs = _maxAttribs;
    enableViewSharpening = _enableViewSharpening;

    //
    BackLightController.initialise(window, navigator);

    // On device use ConfigController.getDisplayConfig() instead
    this.displayConfig = ConfigController.getDisplayConfig();
    if (!this.displayConfig)
      this.displayConfig = ConfigController.getDisplayConfigForDevice("H1A1000");

    // Display Config
    CAMCOUNT = this.displayConfig.intParams[1].Collection[0];
    this.screenWidth = this.displayConfig.intParams[0].Collection[0];
    this.screenHeight = this.displayConfig.intParams[0].Collection[1];
    this.rtWidth = this.displayConfig.intParams[3].Collection[0];
    this.rtHeight = this.displayConfig.intParams[3].Collection[1];
    this.aspectRatio = this.screenWidth / this.screenHeight;
    this.interlacingMatrixLandscape = this.displayConfig.floatParams[1].Collection;
    this.interlacingVector = this.displayConfig.floatParams[5].Collection;

    //
    this.canvas = canvas;
    this.gl = gl;
    this.window = window;
    this.textures = [];
    this.renderTargets = [];
    this.imgs = [];
    this.cameraPositions = [];
    this.projectionMats = [];
    this.near = 1.0;
    this.far = 1000;
    this.baseline = 1;
    this.convergenceDistance = 20;
    let offset = calculateGridOffset(CAMCOUNT);
    this.calculateCameraPositions(offset, CAMCOUNT);
    this.stagingFrameBuffer;
    this.stagingFrameBufferTexture;
    this.program = -1;
    this.program2 = -1;

    //
    this.saveWebGLState(16);

    // Create staging fullscreen render-target (no-depth) for interlacing output.
    {
      var ret = createTexture(this.screenWidth, this.screenHeight, true, false);
      this.stagingFrameBufferTexture = ret.texture;
      this.stagingFrameBuffer = ret.rt;
    }

    // Create per-view [render-target, texture, depthbuffer] for native mode, or just [texture] for legacy mode.
    for (var i = 0; i < CAMCOUNT; ++i) {
      var ret = createTexture(this.rtWidth, this.rtHeight, nativeMode, nativeMode);
      this.renderTargets.push(ret.rt);
      this.textures.push(ret.texture);
    }

    // Create shaders.
    this.program = gl.createProgram();
    this.program2 = gl.createProgram();
    var vertexShader = createShader(gl, V_SHADER, gl.VERTEX_SHADER);
    var fragShader = createShader(gl, FRAG_SHADER, gl.FRAGMENT_SHADER);
    var viewSharpeningShader = createShader(gl, VIEWSHARPENING_SHADER, gl.FRAGMENT_SHADER);
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragShader);
    gl.attachShader(this.program2, vertexShader);
    gl.attachShader(this.program2, viewSharpeningShader);
    gl.linkProgram(this.program);
    gl.linkProgram(this.program2);
  
    // Create a buffer for fullscreen rectangle vertices.
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, this.screenWidth, this.screenHeight);
    
    // Create buffer for fullscreen rectangle texture coordinates.
    texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    setRectangle(gl, 0, 0, 1, 1);

    //
    this.restoreWebGLState(16);
  },

  adaptToOrientation(type) {
    if (type == 'landscape-primary') {

      this.canvas.width = this.screenWidth;
      this.canvas.height = this.screenHeight;
      this.canvas.style.width = (this.screenWidth) + "px";
      this.canvas.style.height = (this.screenHeight) + "px";

      this.aspectRatio = this.screenWidth / this.screenHeight;
      this.interlacingMatrixLandscape = this.displayConfig.floatParams[1].Collection;
      this.interlacingVector = this.displayConfig.floatParams[5].Collection;

    } else if (type == 'landscape-secondary') {

      this.canvas.width = this.screenWidth;
      this.canvas.height = this.screenHeight;
      this.canvas.style.width = (this.screenWidth) + "px";
      this.canvas.style.height = (this.screenHeight) + "px";

      this.aspectRatio = this.screenWidth / this.screenHeight;
      this.interlacingMatrixLandscape = this.displayConfig.floatParams[2].Collection;
      this.interlacingVector = this.displayConfig.floatParams[6].Collection;
    }
    else if (type == 'portrait-secondary') {
      this.canvas.height = this.screenWidth;
      this.canvas.width = this.screenHeight;
      this.canvas.style.height = (this.screenWidth) + "px";
      this.canvas.style.width = (this.screenHeight) + "px";

      this.aspectRatio = this.screenHeight / this.screenWidth;
      this.interlacingMatrixLandscape = this.displayConfig.floatParams[4].Collection;
      this.interlacingVector = this.displayConfig.floatParams[8].Collection;
    }
    else //portrait primary 
    {
      this.canvas.height = this.screenWidth;
      this.canvas.width = this.screenHeight;
      this.canvas.style.height = (this.screenWidth) + "px";
      this.canvas.style.width = (this.screenHeight) + "px";

      this.aspectRatio = this.screenHeight / this.screenWidth;
      this.interlacingMatrixLandscape = this.displayConfig.floatParams[3].Collection;
      this.interlacingVector = this.displayConfig.floatParams[7].Collection;
    }
  },

  bindRenderTarget(index)
  {
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTargets[index]);
  },

  setConvergence(value) {
    this.convergenceDistance = value;
  },

  setBaseline(value) {
    if(value >= 0.001)
      this.baseline = value;
  },

  setNear(value) {
    this.near = value;
  },

  setFar(value) {
    this.far = value;
  },

  getRenderTextureWidth() {
    return this.rtWidth;
  },

  getRenderTextureHeight() {
    return this.rtHeight;
  },

  calculateCameraPositions(wOffset, camCount, camType) {
    for (let i = 0; i < camCount; i++) {
      let xPosition = this.baseline * (i - wOffset);
      this.cameraPositions.push(xPosition);
      let projectionMat = calculateProjectionMatrix
      (
        camType,
        45,
        this.convergenceDistance,
        xPosition,
        this.near,
        this.far,
        this.aspectRatio
      );
      this.projectionMats.push(projectionMat);
    }
  },

  getCameraPositions() {
    return this.cameraPositions;
  },

  getProjectionMatrices(camType) {
    this.cameraPositions.length = 0;
    this.projectionMats.length = 0;
    let offset = calculateGridOffset(CAMCOUNT);

    this.calculateCameraPositions(offset, CAMCOUNT, camType);
    return this.projectionMats;
  },

  saveWebGLState()
  {
    this.prevWidth = gl.canvas.width;
    this.prevHeight = gl.canvas.height;
    this.prevArrayBufferBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    this.prevFrameBufferBinding = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    this.prevBlendEnable = gl.isEnabled(gl.BLEND);
    this.prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB);
    this.prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB);
    this.prevClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    this.prevViewport = gl.getParameter(gl.VIEWPORT);
    this.prevProgram = gl.getParameter(gl.CURRENT_PROGRAM)
    this.prevActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE0);
    this.prevTex0Binding = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.activeTexture(gl.TEXTURE1);
    this.prevTex1Binding = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.activeTexture(gl.TEXTURE2);
    this.prevTex2Binding = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.activeTexture(gl.TEXTURE3);
    this.prevTex3Binding = gl.getParameter(gl.TEXTURE_BINDING_2D);
    this.prevAttribsEnabled = [];
    this.prevAttribsBoundBuffers = [];
    this.prevAttribsOffset = [];
    this.prevAttribsSize = [];
    this.prevAttribsStride = [];
    this.prevAttribsType = [];
    this.prevAttribsNormalized = [];
    this.prevAttribsOffset = [];
    for(var i=0; i<maxAttribs; i++)
    {
        var enabled = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        this.prevAttribsEnabled.push(enabled);
        
        var buffer = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
        this.prevAttribsBoundBuffers.push(buffer);

        var size = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_SIZE);
        this.prevAttribsSize.push(size);

        var stride = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
        this.prevAttribsStride.push(stride);

        var type = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_TYPE);
        this.prevAttribsType.push(type);
        
        var normalized = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
        this.prevAttribsNormalized.push(normalized);

        var offset = gl.getVertexAttribOffset(i, gl.VERTEX_ATTRIB_ARRAY_POINTER);
        this.prevAttribsOffset.push(offset);
    }
  },

  restoreWebGLState()
  {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex0Binding);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex1Binding);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex2Binding);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex3Binding);
    gl.useProgram(this.prevProgram)
    gl.activeTexture(this.prevActiveTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.prevFrameBufferBinding);
    gl.blendFunc(this.prevBlendSrc, this.prevBlendDst);
    if(this.prevBlendEnable)
      gl.enable(gl.BLEND);
    else 
      gl.disable(gl.BLEND);
    gl.clearColor( this.prevClearColor[0],this.prevClearColor[1],this.prevClearColor[2],this.prevClearColor[3]);
    gl.canvas.width = this.prevWidth;
    gl.canvas.height = this.prevHeight;
    gl.viewport(this.prevViewport[0],this.prevViewport[1],this.prevViewport[2],this.prevViewport[3]);
    for(var i=0; i<maxAttribs; i++)
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.prevAttribsBoundBuffers[i]);      
      gl.vertexAttribPointer(i, this.prevAttribsSize[i], this.prevAttribsType[i], this.prevAttribsNormalized[i], this.prevAttribsStride[i], this.prevAttribsOffset[i]);
      if(this.prevAttribsEnabled[i])
        gl.enableVertexAttribArray(i);
      else
        gl.disableVertexAttribArray(i);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.prevArrayBufferBinding);
  },

  saveTexture(tempBuffer, index, rtWidth, rtHeight, gl) {
    gl.bindTexture(gl.TEXTURE_2D, this.textures[index]);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, rtWidth, rtHeight, gl.RGBA, gl.UNSIGNED_BYTE, tempBuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
  },

  firstPass() {

    // Windowing.
    {
      var newWidth = this.screenWidth;
      var newHeight = this.screenHeight;

      //if(window.innerWidth < window.innerHeight)
      {
        //newWidth = this.screenHeight;
        //newHeight = this.screenWidth;
      }
      
      gl.canvas.width = newWidth;//window.innerWidth;
      gl.canvas.height = newHeight;

      gl.viewport(0, 0, newWidth, newHeight);
    }

    // Select interlacing program.   
    gl.useProgram(this.program);

    // Set vertex shader inputs.
    {
      // Disable all inputs.
      for(var i=0; i<3; i++)
        gl.disableVertexAttribArray(i);

      // Get attribute locations.
      var a_positionLocation = gl.getAttribLocation(this.program, "a_position");
      var a_texcoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
  
      // Set position buffer attribute.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(a_positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_positionLocation);

      // Set texcoord buffer attribute.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.vertexAttribPointer(a_texcoordLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_texcoordLocation);
    }

    // Set uniform shader inputs.
    {
      var u_texture0Location = gl.getUniformLocation(this.program, "_texture_0");
      var u_texture1Location = gl.getUniformLocation(this.program, "_texture_1");
      var u_texture2Location = gl.getUniformLocation(this.program, "_texture_2");
      var u_texture3Location = gl.getUniformLocation(this.program, "_texture_3");
      var u_widthLocation = gl.getUniformLocation(this.program, "_width");
      var u_heightLocation = gl.getUniformLocation(this.program, "_height");
      var u_viewWidthLocation = gl.getUniformLocation(this.program, "_viewResX");
      var u_viewHeightLocation = gl.getUniformLocation(this.program, "_viewResY");
      var u_viewXLocation = gl.getUniformLocation(this.program, "_viewsX");
      var u_viewYLocation = gl.getUniformLocation(this.program, "_viewsY");
      var u_interlaceMatLocation = gl.getUniformLocation(this.program, "_interlace_matrix");
      var u_interlaceVecLocation = gl.getUniformLocation(this.program, "_interlace_vector");
      var u_resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
  
      gl.uniform1i(u_texture0Location, 0);
      gl.uniform1i(u_texture1Location, 1);
      gl.uniform1i(u_texture2Location, 2);
      gl.uniform1i(u_texture3Location, 3);
      gl.uniform1f(u_widthLocation, this.screenWidth);
      gl.uniform1f(u_heightLocation, this.screenHeight);
      gl.uniform1f(u_viewWidthLocation, this.rtWidth);
      gl.uniform1f(u_viewHeightLocation, this.rtHeight);
      gl.uniform1f(u_viewXLocation, CAMCOUNT);
      gl.uniform1f(u_viewYLocation, 1.0);
      gl.uniformMatrix4fv(u_interlaceMatLocation, false, this.interlacingMatrixLandscape);
      gl.uniform4f(u_interlaceVecLocation, this.interlacingVector[0], this.interlacingVector[1], this.interlacingVector[2], this.interlacingVector[3]);
      gl.uniform2f(u_resolutionLocation, this.screenWidth, this.screenHeight);
    }

    // Set texture units.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[3]);

    // Draw rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Disable texture units.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, null);
  },

  mainPass() {

    // Windowing.
    {
      var newWidth = this.screenWidth;
      var newHeight = this.screenHeight;

      if (window.innerWidth < window.innerHeight) {
        newWidth = this.screenHeight;
        newHeight = this.screenWidth;
      }

      gl.canvas.width = newWidth;//window.innerWidth;
      gl.canvas.height = newHeight;

      gl.viewport(0, 0, newWidth, newHeight);
    }

    // Select sharpening program
    gl.useProgram(this.program2);

    // Set vertex shader inputs.
    {
      // Disable all inputs.
      for(var i=0; i<3; i++)
        gl.disableVertexAttribArray(i);

      // Get attribute locations.
      var a_positionLocation = gl.getAttribLocation(this.program2, "a_position");
      var a_texcoordLocation = gl.getAttribLocation(this.program2, "a_texCoord");
  
      // Set position buffer attribute.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(a_positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_positionLocation);

      // Set texcoord buffer attribute.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.vertexAttribPointer(a_texcoordLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_texcoordLocation);
    }

    // Set uniform shader inputs.
    {
      var u_resolutionLocation = gl.getUniformLocation(this.program2, "u_resolution");
      var u_imageLocation = gl.getUniformLocation(this.program2, "u_image");
  
      gl.uniform2f(u_resolutionLocation, this.screenWidth, this.screenHeight);
      gl.uniform1i(u_imageLocation, 0);
    }

    // Set texture units.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.stagingFrameBufferTexture);

    // Draw rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Disable texture units.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  },

  update() {

    // Save WebGL state.
    this.saveWebGLState(16);

    // Enable blending.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    // First pass: Interlace render-targets into staging buffer.
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, enableViewSharpening ? this.stagingFrameBuffer : null);
    this.firstPass();

    // Second pass: Apply view sharpening from staging buffer into frame buffer.
    if(enableViewSharpening) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.mainPass();
    }

    // Restore WebGL state.
    this.restoreWebGLState(16);
  }
};

function perspective(fieldOfViewYInRadians, aspect, zNear, zFar) {//}, convergenceDistance, posX) {
    let dst = [];

    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    var rangeInv = 1.0 / (zNear - zFar);

    dst = [f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (zNear + zFar) * rangeInv, -1,
      0, 0, zNear * zFar * rangeInv * 2, 0];

    return dst;
}

function ortho(left, right, bottom, top, near, far) {
  let dst = [];

  dst = 
  [
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, 2 / (near - far), 0,
    (right + left) / (left - right), (top + bottom) / (bottom - top), (far + near) / (near - far), 1
  ];

  return dst;
}

function createShader(gl, sourceCode, type) {
  // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
  var shader = gl.createShader(type);
  gl.shaderSource(shader, sourceCode);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var info = gl.getShaderInfoLog(shader);
    throw 'Leia WebGL SDK: Could not compile WebGL program. \n\n' + info;
  }

  return shader;
}

function createTexture(width, height, includeRenderTarget, includeDepthBuffer) {
  // Create texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture); // todo: restore previous bound texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
  // Bind texture to rendertarget.
  var rt = null;
  if(includeRenderTarget)
  {
    rt = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }

  // create a depth renderbuffer and bind to framebuffer.'
  var depthBuffer = null;
  if(includeDepthBuffer) {
    depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  }

  // Check rendertarget is ok.
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
    console.error("Leia WebGL SDK: createTexture() Initialization error")

  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // todo: restore previous frame buffer.

  return {texture, rt, depthBuffer};
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

function calculateGridOffset(camCount) {
  let offset = camCount % 2 == 0 ? (camCount - 1) * 0.5 : Math.floor(camCount * 0.5);
  return offset;
}

function calculateProjectionMatrix(camType, fov, convergenceDistance, localCamPosition, near, far, aspectRatio) {
  var projectionMatrix;
  if (camType == "perspective") {
    projectionMatrix = perspective(fov, aspectRatio, near, far);
  } else {
    projectionMatrix = ortho(-20, 20, -20, 20, near, far);
  }
  let shearY = projectionMatrix[0] * localCamPosition / convergenceDistance;
  projectionMatrix[8] = -shearY;
  return projectionMatrix;
}