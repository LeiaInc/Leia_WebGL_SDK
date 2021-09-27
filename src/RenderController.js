import { m4 } from "twgl.js";
import { V_SHADER } from "./shaders/VertexShader.js";
import { FRAG_SHADER } from "./shaders/FragmentShader.js";
import { VIEWSHARPENING_SHADER } from "./shaders/ViewSharpeningShader.js";
import ConfigController from "./ConfigController.js";
import BackLightController from "./BackLightController.js";

console.log('render controller.js', m4);

var CAMCOUNT = 4;

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

export default {
  initialize(canvas, gl, window) {

    // On device use ConfigController.getDisplayConfig() instead
    BackLightController.initialise(window, navigator);
    this.displayConfig = ConfigController.getDisplayConfig();
    if (!this.displayConfig) {
      this.displayConfig = ConfigController.getDisplayConfigForDevice("H1A1000");
    }
    // Display Config
    CAMCOUNT = this.displayConfig.intParams[1].Collection[0];
    this.screenWidth = this.displayConfig.intParams[0].Collection[0];
    this.screenHeight = this.displayConfig.intParams[0].Collection[1];
    this.rtWidth = this.displayConfig.intParams[3].Collection[0];
    this.rtHeight = this.displayConfig.intParams[3].Collection[1];
    this.aspectRatio = this.screenWidth / this.screenHeight;
    this.interlacingMatrixLandscape = this.displayConfig.floatParams[1].Collection;
    this.interlacingVector = this.displayConfig.floatParams[5].Collection;

    this.canvas = canvas;

    this.adaptToOrientation("portrait-primary");

    this.gl = gl;
    this.window = window;
    this.textures = [];
    this.imgs = [];
    this.cameraPositions = [];
    this.projectionMats = [];
    this.near = 1.0;
    this.far = 1000;
    this.baseline = 1;
    this.convergenceDistance = 20;
    let offset = this.calculateGridOffset(CAMCOUNT);
    this.calculateCameraPositions(offset, CAMCOUNT);

    // this.firstPassFBOID = ;
    // this.firstPassOutputTexture = any;
    this.program = -1;
    this.program2 = -1;
    this.initFramebuffer(this.gl);

  },

  initFramebuffer(gl) {
    const targetTextureWidth = this.screenWidth;
    const targetTextureHeight = this.screenHeight;
    const targetTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        targetTextureWidth, targetTextureHeight, border,
        format, type, data);

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


      this.firstPassOutputTexture = targetTexture;
    }

    this.firstPassFBOID = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.firstPassFBOID);


    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, level);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
      console.error("ERROR::FRAMEBUFFER:: Framebuffer is not complete! ")

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


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
  setupCanvas(gl) {

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0.4, 1);

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


    {
      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(this.program, "a_position");
      var texcoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

      // Create a buffer to put three 2d clip space points in
      var positionBuffer = gl.createBuffer();

      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Set a rectangle the same size as the image.
      setRectangle(gl, 0, 0, this.screenWidth, this.screenHeight);

      // provide texture coordinates for the rectangle.
      var texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
      ]), gl.STATIC_DRAW);


      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2;          // 2 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

      // Turn on the texcoord attribute
      gl.enableVertexAttribArray(texcoordLocation);

      // bind the texcoord buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
      var size = 2;          // 2 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);
    }

    {
      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(this.program2, "a_position");
      var texcoordLocation = gl.getAttribLocation(this.program2, "a_texCoord");

      // Create a buffer to put three 2d clip space points in
      var positionBuffer = gl.createBuffer();

      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Set a rectangle the same size as the image.
      setRectangle(gl, 0, 0, this.screenWidth, this.screenHeight);

      // provide texture coordinates for the rectangle.
      var texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
      ]), gl.STATIC_DRAW);


      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2;          // 2 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

      // Turn on the texcoord attribute
      gl.enableVertexAttribArray(texcoordLocation);

      // bind the texcoord buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
      var size = 2;          // 2 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);
    }


  },
  setupTextures(gl, rtWidth, rtHeight) {
    this.textures = [];
    for (var ii = 0; ii < 4; ++ii) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rtWidth, rtHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rtWidth * rtHeight * 4));

      // add the texture to the array of textures.
      this.textures.push(texture);
    }

    gl.useProgram(this.program);
    // lookup the sampler locations.
    var u_image0Location = gl.getUniformLocation(this.program, "_texture_0");
    var u_image1Location = gl.getUniformLocation(this.program, "_texture_1");
    var u_image2Location = gl.getUniformLocation(this.program, "_texture_2");
    var u_image3Location = gl.getUniformLocation(this.program, "_texture_3");
    var u_widthLocation = gl.getUniformLocation(this.program, "_width");
    var u_heightLocation = gl.getUniformLocation(this.program, "_height");
    var u_viewWidthLocation = gl.getUniformLocation(this.program, "_viewResX");
    var u_viewHeightLocation = gl.getUniformLocation(this.program, "_viewResY");
    var u_viewXLocation = gl.getUniformLocation(this.program, "_viewsX");
    var u_viewYLocation = gl.getUniformLocation(this.program, "_viewsY");
    var u_interlaceMatLocation = gl.getUniformLocation(this.program, "_interlace_matrix");
    var u_interlaceVecLocation = gl.getUniformLocation(this.program, "_interlace_vector");

    gl.uniform1i(u_image0Location, 0);  // texture unit 0
    gl.uniform1i(u_image1Location, 1);  // texture unit 1F
    gl.uniform1i(u_image2Location, 2);  // texture unit 2
    gl.uniform1i(u_image3Location, 3); // texture unit 3
    gl.uniform1f(u_widthLocation, this.screenWidth);
    gl.uniform1f(u_heightLocation, this.screenHeight);
    gl.uniform1f(u_viewWidthLocation, this.rtWidth);
    gl.uniform1f(u_viewHeightLocation, this.rtHeight);
    gl.uniform1f(u_viewXLocation, CAMCOUNT);
    gl.uniform1f(u_viewYLocation, 1.0);
    gl.uniformMatrix4fv(u_interlaceMatLocation, false, this.interlacingMatrixLandscape);
    gl.uniform4f(u_interlaceVecLocation, this.interlacingVector[0], this.interlacingVector[1],
      this.interlacingVector[2], this.interlacingVector[3]);
  },
  glClearColor(gl) {
    // gl.colorMask(1, 1, 1, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  },
  setConvergence(value) {
    this.convergenceDistance = value;
  },
  setBaseline(value) {
    this.baseline = value;
  },
  setNear(value) {
    this.near = value;
  },
  SetFar(value) {
    this.far = value;
  },
  getRenderTextureWidth() {
    return this.rtWidth;
  },
  getRenderTextureHeight() {
    return this.rtHeight;
  },

  // OnLandscapeMode()
  // {

  // },

  // OnPortraitMode()
  // {

  // },

  calculateCameraPositions(wOffset, camCount, camType) {
    for (let i = 0; i < camCount; i++) {
      let xPosition = this.baseline * (i - wOffset);
      this.cameraPositions.push(xPosition);

      //   currentOrientation = 

      let projectionMat = this.calculateProjectionMatrix(camCount, "LandscapeRight", { width: this.rtWidth, height: this.rtHeight },
        camType, 45, this.convergenceDistance, xPosition, this.near, this.far);
      this.projectionMats.push(projectionMat);
    }
  },
  calculateGridOffset(camCount) {
    let offset = camCount % 2 == 0 ? (camCount - 1) * 0.5 : Math.floor(camCount * 0.5);
    return offset;
  },
  calculateProjectionMatrix(camCount, orientation, renderTextureResolution, camType,
    fov, convergenceDistance, localCamPosition, near, far) {
    let projectionMatrix = m4.identity;
    if (camType == "perspective") {
      projectionMatrix = m4.perspective(fov, this.aspectRatio, near, far);
    } else {
      projectionMatrix = m4.ortho(-20, 20, -20, 20, near, far);
    }
    let shearY = projectionMatrix[0] * localCamPosition / convergenceDistance;
    projectionMatrix[8] = -shearY;
    return projectionMatrix;
  },
  getCameraPositions() {
    return this.cameraPositions;
  },
  getProjectionMatrices(camType) {
    this.cameraPositions.length = 0;
    this.projectionMats.length = 0;
    let offset = this.calculateGridOffset(CAMCOUNT);

    this.calculateCameraPositions(offset, CAMCOUNT, camType);
    return this.projectionMats;
  },
  saveTexture(tempBuffer, index, rtWidth, rtHeight, gl) {
    gl.bindTexture(gl.TEXTURE_2D, this.textures[index]);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, rtWidth, rtHeight, gl.RGBA, gl.UNSIGNED_BYTE, tempBuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
  },

  firstPass(gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.firstPassFBOID);

    var newWidth = this.screenWidth;
    var newHeight = this.screenHeight;

    // if(window.innerWidth < window.innerHeight)
    // {
    //   newWidth = this.screenHeight;
    //   newHeight = this.screenWidth;
    // }

    gl.canvas.width = newWidth;//window.innerWidth;
    gl.canvas.height = newHeight;


    gl.viewport(0, 0, newWidth, newHeight);

    this.glClearColor(gl);

    gl.useProgram(this.program);

    var u_interlaceMatLocation = gl.getUniformLocation(this.program, "_interlace_matrix");
    var u_interlaceVecLocation = gl.getUniformLocation(this.program, "_interlace_vector");
    gl.uniformMatrix4fv(u_interlaceMatLocation, false, this.interlacingMatrixLandscape);
    gl.uniform4f(u_interlaceVecLocation, this.interlacingVector[0], this.interlacingVector[1],
      this.interlacingVector[2], this.interlacingVector[3]);

    // Tell it to use our program (pair of shaders)

    var resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");

    // Turn on the position attribute
    gl.enableVertexAttribArray(this.positionLocation);

    // Bind the position buffer.
    // set the resolution

    gl.uniform2f(resolutionLocation, this.screenWidth, this.screenHeight);

    // set which texture units to render with.

    // Set each texture unit to use a particular texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[3]);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  },

  mainPass(gl) {
    var newWidth = this.screenWidth;
    var newHeight = this.screenHeight;

    if (window.innerWidth < window.innerHeight) {
      newWidth = this.screenHeight;
      newHeight = this.screenWidth;
    }

    gl.canvas.width = newWidth;//window.innerWidth;
    gl.canvas.height = newHeight;


    gl.viewport(0, 0, newWidth, newHeight);

    this.glClearColor(gl);


    // Tell it to use our program (pair of shaders)
    gl.useProgram(this.program2);

    // Turn on the position attribute
    gl.enableVertexAttribArray(this.positionLocation);

    // Bind the position buffer.
    // set the resolution
    var resolutionLocation = gl.getUniformLocation(this.program2, "u_resolution");
    gl.uniform2f(resolutionLocation, this.screenWidth, this.screenHeight);
    var u_image = gl.getUniformLocation(this.program2, "u_image");
    gl.uniform1i(u_image, 0);

    // set which texture units to render with.

    // Set each texture unit to use a particular texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.firstPassOutputTexture);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);

  },

  update(gl) {
    this.firstPass(gl);
    this.mainPass(gl);
  }

};

function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, convergenceDistance, posX) {
  let dst = [];

  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
  var rangeInv = 1.0 / (zNear - zFar);

  dst = [f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (zNear + zFar) * rangeInv, -1,
    0, 0, zNear * zFar * rangeInv * 2, 0];
  return dst;
}

// Converts from degrees to radians.
function degreeToRadians(degrees) {
  return degrees * Math.PI / 180.0;
};

// Converts from radians to degrees.
function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
};


function createShader(gl, sourceCode, type) {
  // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
  var shader = gl.createShader(type);
  gl.shaderSource(shader, sourceCode);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var info = gl.getShaderInfoLog(shader);
    throw 'Could not compile WebGL program. \n\n' + info;
  }
  return shader;
}


