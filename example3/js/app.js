//import RenderController from '../../src/RenderController.js';
//import BackLightController from '../../src/BackLightController.js';
//import { BacklightMode } from '../../src/Constants.js';

import RenderController from './vendor/leia/RenderController.js';
import BackLightController from './vendor/leia/BackLightController.js';
import { BacklightMode } from './vendor/leia/Constants.js';

var gl;
var canvas;
var Pmatrix;
var Vmatrix;
var Mmatrix;
var inLightfieldMode = false;
var proj_matrix;
var mov_matrix;
var view_matrix;
var view_matrix_lightfield;
var index_buffer;
var color_buffer;
var vertex_buffer;
var controller;
var rtWidth;
var rtHeight;
var shaderProgram;
var timeOld = 0;
var nativeMode = true;
var nonNativeBuffer;
var nonNativeOffscreenRT;

// Index buffer data.
const indices = [
    0,1,2, 0,2,3, 4,5,6, 4,6,7,
    8,9,10, 8,10,11, 12,13,14, 12,14,15,
    16,17,18, 16,18,19, 20,21,22, 20,22,23 
];

function main()
{
    // ensure pixel perfect scaling for different display settings
    var vp = document.querySelector("meta[name=viewport]");
    vp.setAttribute('content', 'initial-scale=' + (1.0/window.devicePixelRatio) + ', minimum-scale=0.01, user-scalable=0');

    // Get canvas.
     canvas = document.querySelector("#myCanvas");

    // Get WebGL context.
    gl = canvas.getContext("webgl", { preserveDrawingBuffer : true });

    // Initialize Leia render controller.
    controller = RenderController;
    controller.initialize(canvas, gl, window, nativeMode, 16, true);
    rtWidth = controller.getRenderTextureWidth();
    rtHeight = controller.getRenderTextureHeight();
    controller.setConvergence(20);
    controller.adaptToOrientation(screen.orientation.type);

    // Add handler for clicking in the canvas.
    canvas.addEventListener("click", onMouseDown, false);

    // Add handler for rotating the display.
    screen.orientation.addEventListener("change", function(e) {
        controller.adaptToOrientation(screen.orientation.type);
    }, false);

    // Create vertex shader input buffers.
    {
        const vertices = [
            -2.5,-2.5,-2.5,  2.5,-2.5,-2.5,  2.5, 2.5,-2.5, -2.5, 2.5,-2.5,
            -2.5,-2.5, 2.5,  2.5,-2.5, 2.5,  2.5, 2.5, 2.5, -2.5, 2.5, 2.5,
            -2.5,-2.5,-2.5, -2.5, 2.5,-2.5, -2.5, 2.5, 2.5, -2.5,-2.5, 2.5,
             2.5,-2.5,-2.5,  2.5, 2.5,-2.5,  2.5, 2.5, 2.5,  2.5,-2.5, 2.5,
            -2.5,-2.5,-2.5, -2.5,-2.5, 2.5,  2.5,-2.5, 2.5,  2.5,-2.5,-2.5,
            -2.5, 2.5,-2.5, -2.5, 2.5, 2.5,  2.5, 2.5, 2.5,  2.5, 2.5,-2.5, 
        ];
        
        // Create and store data into vertex buffer
        vertex_buffer = gl.createBuffer ();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const colors = [
            1,0,0, 1,0,0, 1,0,0, 1,0,0, // Red
            0,1,0, 0,1,0, 0,1,0, 0,1,0, // Green
            0,0,1, 0,0,1, 0,0,1, 0,0,1, // Blue
            1,1,0, 1,1,0, 1,1,0, 1,1,0, // Yellow
            1,0,1, 1,0,1, 1,0,1, 1,0,1, // Magenta
            0,1,1, 0,1,1, 0,1,1, 0,1,1, // Cyan
        ];
        
        // Create and store data into color buffer
        color_buffer = gl.createBuffer ();
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // Create and store data into index buffer
        index_buffer = gl.createBuffer ();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    // Create shaders.
    {
        var vertCode = 'attribute vec3 position;'+
        'uniform mat4 Pmatrix;'+
        'uniform mat4 Vmatrix;'+
        'uniform mat4 Mmatrix;'+
        'attribute vec3 color;'+//the color of the point
        'varying vec3 vColor;'+

        'void main(void) { '+//pre-built function
            'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);'+
            'vColor = color;'+
        '}';

        var fragCode = 'precision mediump float;'+
        'varying vec3 vColor;'+
        'void main(void) {'+
            'gl_FragColor = vec4(vColor, 1.);'+
        '}';

        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
    }

    // Get shader tranform matrix locations.
    Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
    Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
    Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

    // Attach vertex buffer to shader input attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var position = gl.getAttribLocation(shaderProgram, "position");
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(position);

    // Attach color buffer to shader input attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);    
    var color = gl.getAttribLocation(shaderProgram, "color");
    gl.vertexAttribPointer(color, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(color);

    // Initialize matrices.
    proj_matrix = get_projection(60.0, canvas.width/canvas.height, 0.1, 100);
    mov_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-20,1];
    view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    view_matrix_lightfield = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    
    // In non-native mode, we have to create a staging render-target to render each view, and also 
    // a temporary buffer to copy the pixels into before sending it to the Leia render controller.    
    if(!nativeMode)
    {
        nonNativeBuffer = new Uint8Array(rtWidth * rtHeight * 4);

        // Create texture.
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture); // todo: restore previous bound texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rtWidth, rtHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      
        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          
        // Create render-target and bind texture to it.
        nonNativeOffscreenRT = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, nonNativeOffscreenRT);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
        // create a depth renderbuffer and bind to render-target.
        var depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rtWidth, rtHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
      
        // Check rendertarget is ok.
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
          console.error("Leia WebGL SDK: createTexture() Initialization error")
      
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // todo: restore previous frame buffer.
    }
}

function render(time) {

   var dt = time-timeOld;
   rotateZ(mov_matrix, dt*0.001);
   rotateY(mov_matrix, dt*0.001);
   rotateX(mov_matrix, dt*0.001);
   timeOld = time;

    if(inLightfieldMode)
    {
        let projectionMatrices = controller.getProjectionMatrices("perspective");
        let cameraOffsets  = controller.getCameraPositions();
        
        cameraOffsets.forEach((camOfs,i) => 
        {
            // Set per-view render target (fast path) or single staging render-target (slow path).
            if(nativeMode)
                controller.bindRenderTarget(i);
            else
                gl.bindFramebuffer(gl.FRAMEBUFFER, nonNativeOffscreenRT);

            // Adjust the view according to the Leia camera offsets. Note the negative value beacuse the view matrix is inverted.
            view_matrix_lightfield[12] = -camOfs;

            gl.useProgram(shaderProgram);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clearColor(0.0, 0.36, 0.73, 1.0);
            gl.clearDepth(1.0);
            gl.viewport(0.0, 0.0, rtWidth, rtHeight);//canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniformMatrix4fv(Pmatrix, false, projectionMatrices[i]);
            gl.uniformMatrix4fv(Vmatrix, false, view_matrix_lightfield);
            gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

            // For non-native mode, read pixels from render-target and send to contoller (slow-path).
            if(!nativeMode)
            {
                gl.readPixels(0, 0, rtWidth, rtHeight, gl.RGBA, gl.UNSIGNED_BYTE, nonNativeBuffer);
                controller.saveTexture(nonNativeBuffer, i, rtWidth, rtHeight, gl);
            }
        });
        
        // Performs interlacing and sharpening.
        controller.update();
    }
    else
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.useProgram(shaderProgram);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearColor(0.0, 0.36, 0.73, 1.0);
        gl.clearDepth(1.0);
        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
        gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
        gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    window.requestAnimationFrame(render);
}

function onWindowResize() 
{
    /*var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (canvas.width != width ||
        canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
            
      // in this case just render when the window is resized.
      render();
    }*/ 
}

function onMouseDown()
{
    if(!inLightfieldMode)
    {
        // Enable lightfield mode (for Windows testing, disable the following line until there is support).
        BackLightController.requestBacklightMode(BacklightMode.ON);
        inLightfieldMode = true;
    }
    else
    {
        // Disable lightfield mode (for Windows testing, disable the following line until there is support).
        BackLightController.requestBacklightMode(BacklightMode.OFF);
        inLightfieldMode = false;
    }
}

function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle*.5)*Math.PI/180);
    return [
       0.5/ang, 0 , 0, 0,
       0, 0.5*a/ang, 0, 0,
       0, 0, -(zMax+zMin)/(zMax-zMin), -1,
       0, 0, (-2*zMax*zMin)/(zMax-zMin), 0 
    ];
 }
 
function rotateZ(m, angle) {

   var c = Math.cos(angle);
   var s = Math.sin(angle);

   var mv0 = m[0];
   var mv4 = m[4];
   var mv8 = m[8];

   m[0] = c * m[0] - s * m[1];
   m[4] = c * m[4] - s * m[5];
   m[8] = c * m[8] - s * m[9];
   m[1] = c * m[1] + s * mv0;
   m[5] = c * m[5] + s * mv4;
   m[9] = c * m[9] + s * mv8;
}

function rotateX(m, angle) {

   var c = Math.cos(angle);
   var s = Math.sin(angle);

   var mv1 = m[1];
   var mv5 = m[5];
   var mv9 = m[9];

   m[1]  = c * m[1]  - s * m[2];
   m[5]  = c * m[5]  - s * m[6];
   m[9]  = c * m[9]  - s * m[10];
   m[2]  = c * m[2]  + s * mv1;
   m[6]  = c * m[6]  + s * mv5;
   m[10] = c * m[10] + s * mv9;
}

function rotateY(m, angle) {

   var c = Math.cos(angle);
   var s = Math.sin(angle);

   var mv0 = m[0];
   var mv4 = m[4];
   var mv8 = m[8];

   m[0]  = c * m[0]  + s * m[2];
   m[4]  = c * m[4]  + s * m[6];
   m[8]  = c * m[8]  + s * m[10];
   m[2]  = c * m[2]  - s * mv0;
   m[6]  = c * m[6]  - s * mv4;
   m[10] = c * m[10] - s * mv8;
}

// Hook entry point
window.onload = main;
window.addEventListener('resize', onWindowResize);
window.requestAnimationFrame(render);