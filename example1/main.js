/* via https://codepen.io/ogames/pen/rNmYpdo */
// test
import {
  CameraHelper,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
  PerspectiveCamera,
  MeshStandardMaterial,
  // DirectionalLight,
  // HemisphereLight,

  // BoxGeometry,
  // SphereGeometry,
  // MeshBasicMaterial,
  // GridHelper,
  // MeshMatcapMaterial,
  // MeshNormalMaterial,
  Mesh,
  Color,
  MathUtils,
  // TextureLoader,
  LoadingManager,
  AmbientLight,
  PointLight,
  AxesHelper,
  // HemisphereLight,
  // BoxHelper,
  // eslint-disable-next-line no-unused-vars
  Box3,
  BoxGeometry,
  Fog,
  // Raycaster,
  Vector3,
  // PlaneGeometry,
  // PlaneBufferGeometry,
  // Float32BufferAttribute,
  // BufferGeometry,
  Group,
  // eslint-disable-next-line no-unused-vars
  Line3,
  // eslint-disable-next-line no-unused-vars
  Matrix4,
  Clock,
  FrontSide,
  GridHelper,
  SphereGeometry,
  MeshNormalMaterial,
  // eslint-disable-next-line no-unused-vars
} from "three"

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import Stats from 'three/examples/jsm/libs/stats.module.js';
import RenderController from '../leiawebglsdk/RenderController.js';
import BackLightController from "../leiawebglsdk/BackLightController.js";
import { BacklightMode } from '../leiawebglsdk/Constants.js';

// ADD FULLSCREEN OPTION

let button = document.getElementById('button');
button.onclick = function openFullscreen() {
  var elem = document.getElementById("canvas2");//document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }

}

// TURN BACKLIGHT

let button2 = document.getElementById('button2');
button2.onclick = function openFullscreen() {
  BackLightController.requestBacklightMode(BacklightMode.ON);
};

// vars
let fwdValue = 0;
let bkdValue = 0;
let rgtValue = 0;
let lftValue = 0;
let tempVector = new Vector3();
let upVector = new Vector3(0, 1, 0);
let joyManager;

var width = window.innerWidth,
    height = window.innerHeight;

/* 
    INIT LEIA RENDER CONTROLLER
*/
// Get A WebGL context
/** @type {HTMLCanvasElement} */
var canvas = document.querySelector("#canvas");
var canvaswgl = document.querySelector("#canvas2");
var gl = canvaswgl.getContext("webgl",{preserveDrawingBuffer : true}) ;
if (!gl) {
  throw Error("webgl context missing");
}

const controller = RenderController;

controller.initialize(canvaswgl,gl,window,20);

const rtWidth = controller.getRenderTextureWidth();
const rtHeight = controller.getRenderTextureHeight();


let helpers = [];

// Create a THREE renderer.
var renderer = new WebGLRenderer({
  preserveDrawingBuffer: true,
  canvas
});
renderer.setSize(width, height);

// Create the scene 
var scene = new Scene();
// Create a camera
var camera = new PerspectiveCamera(45, width / height, 0.1, 10000);
camera.position.z = 50;
camera.position.y = 50;

scene.add(camera);

// Create a light, set its position, and add it to the scene.
var light = new PointLight(0xffffff);
light.position.set(-100,200,100);
scene.add(light);

// Add OrbitControls so that we can pan around with the mouse.
var controls = new OrbitControls(camera, canvaswgl);
controls.maxDistance = 100;
controls.minDistance = 100;
      //controls.maxPolarAngle = (Math.PI / 4) * 3;
      controls.maxPolarAngle = Math.PI/2 ;
      controls.minPolarAngle = 0;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0;
      controls.rotateSpeed = 0.4;
      controls.enableDamping = false;
      controls.dampingFactor = 0.1;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minAzimuthAngle = - Math.PI/2; // radians
      controls.maxAzimuthAngle = Math.PI/4 // radians

// Add axes
var axes = new AxesHelper(50);
scene.add( axes );

// Add grid
const size = 500;
const divisions = 30;

const gridHelper = new GridHelper( size, divisions );
scene.add( gridHelper );

var geometry = new BoxGeometry(5,5,5);
var cubeMaterial = new MeshNormalMaterial(); 

var mesh = new Mesh( geometry, cubeMaterial );
scene.add( mesh );

//var ground = new Object3D()
let size_floor =100
var geometry_floor = new BoxGeometry(size_floor, 1, size_floor)
var material_floor = new MeshNormalMaterial();

var floor = new Mesh(geometry_floor, material_floor);
floor.position.y = -5;
//ground.add(floor)
scene.add(floor)
//floor.rotation.x = -Math.PI / 2

/*
    LEIA RENDER CONTROLLER: SETUP CANVAS
*/
RenderController.setupCanvas(gl);
const renderTarget = new WebGLRenderTarget(rtWidth,rtHeight);
//Setting up rendering targets
  const fov = 45;
  const aspect = 1;  // the canvas default
  const near = 0.1;
  const far = 1000;

  var cameraPositions  = [
    new Vector3(1.0,1.0,0.0),
    new Vector3(-1.0,1.0,0.0),
    new Vector3(0.0,1.0,0.0),
    new Vector3(0.0,1.0,1.0)
  ];

  const cameras = [];

  const debugCamera = new PerspectiveCamera(45,1,near,far);
  // debugCamera.zoom = 0.1;
  debugCamera.position.set(20.0,20.0,-10.0);
  debugCamera.lookAt(0,0,0);

  function updateProjMats(camType = 'perspective'){
    let projectionMatrices  = controller.getProjectionMatrices(camType);
    for(let i = 0;i<projectionMatrices.length;i++) {
      let matrix = new Matrix4();
      matrix.elements = projectionMatrices[i];
      cameras[i].projectionMatrix = matrix.clone();//.elements = projectionMatrices[i];
      cameras[i].projectionMatrixInverse = matrix.clone().invert();

      helpers.forEach(helper => {
        helper.update();
      });
    }
  }

  screen.orientation.addEventListener("change", function(e) {
    controller.adaptToOrientation(screen.orientation.type);
    updateProjMats();
    
  }, false);


cameraPositions = controller.getCameraPositions();


for(var i = 0 ; i < cameraPositions.length ; i++)
{
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(cameraPositions[i],4,20);
  cameras.push(camera);

  let helper = new CameraHelper(camera); 
  scene.add( helper );
  helpers.push(helper);
  scene.add(camera);
}

updateProjMats();

RenderController.setupTextures(gl, rtWidth, rtHeight);


const tempBuffer = new Uint8Array(rtWidth * rtHeight * 4);

// added joystick + movement
addJoystick();

function resize(){
  let w = window.innerWidth;
  let h = window.innerHeight;
  
  renderer.setSize(w,h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// Renders the scene
function animate(time) {
  stats.begin();

  updatePlayer();
  renderer.render( scene, camera );
  controls.update();


  cameras.forEach((camera,index) =>
  {
    renderer.clear();
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene,camera);

    renderer.readRenderTargetPixels(renderTarget,0,0,rtWidth,rtHeight,tempBuffer);

    RenderController.saveTexture(tempBuffer, index, rtWidth, rtHeight, gl);
    
  });

  // if(cameraTypeChanged)
  // {
  //   updateProjMats(camType);
  //   cameraTypeChanged = false;
  // }

  RenderController.update(gl);
   renderer.setRenderTarget(null);
   renderer.render(scene,debugCamera);
    
  
  try{
    stats.update();
    stats.end();
  } catch(e){console.log(e);}

  requestAnimationFrame( animate );
}


function updatePlayer(){
  // move the player
  const angle = controls.getAzimuthalAngle()
  
    if (fwdValue > 0) {
        tempVector
          .set(0, 0, -fwdValue)
          .applyAxisAngle(upVector, angle)
        mesh.position.addScaledVector(
          tempVector,
          1
        )
      }
  
      if (bkdValue > 0) {
        tempVector
          .set(0, 0, bkdValue)
          .applyAxisAngle(upVector, angle)
        mesh.position.addScaledVector(
          tempVector,
          1
        )
      }

      if (lftValue > 0) {
        tempVector
          .set(-lftValue, 0, 0)
          .applyAxisAngle(upVector, angle)
        mesh.position.addScaledVector(
          tempVector,
          1
        )
      }

      if (rgtValue > 0) {
        tempVector
          .set(rgtValue, 0, 0)
          .applyAxisAngle(upVector, angle)
        mesh.position.addScaledVector(
          tempVector,
          1
        )
      }
  
  mesh.updateMatrixWorld()
  
  //controls.target.set( mesh.position.x, mesh.position.y, mesh.position.z );
  // reposition camera
  camera.position.sub(controls.target)
  controls.target.copy(mesh.position)
  camera.position.add(mesh.position)
  
  
};

function addJoystick(){
   const options = {
        zone: document.getElementById('joystickWrapper1'),
        size: 240,
        multitouch: true,
        maxNumberOfNipples: 2,
        mode: 'static',
        restJoystick: true,
        shape: 'circle',
        // position: { top: 20, left: 20 },
        position: { top: '60px', left: '60px' },
        dynamicPage: true,
      }
   
   
  joyManager = nipplejs.create(options);
  
  joyManager['0'].on('move', function (evt, data) {
        const forward = data.vector.y
        const turn = data.vector.x

        if (forward > 0) {
          fwdValue = Math.abs(forward)
          bkdValue = 0
        } else if (forward < 0) {
          fwdValue = 0
          bkdValue = Math.abs(forward)
        }

        if (turn > 0) {
          lftValue = 0
          rgtValue = Math.abs(turn)
        } else if (turn < 0) {
          lftValue = Math.abs(turn)
          rgtValue = 0
        }
  })

   joyManager['0'].on('end', function (evt) {
      bkdValue = 0
      fwdValue = 0
      lftValue = 0
      rgtValue = 0
    })
  
}

/* 


    STATS


*/
var stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

renderer.setClearColor(0.0,0.0,0.0,1.0);
RenderController.glClearColor(gl);


/*

    INIT

*/
resize();
animate();
window.addEventListener('resize',resize);
