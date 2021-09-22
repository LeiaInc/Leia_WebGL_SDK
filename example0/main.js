import * as THREE from 'three';
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


//switching b/w perspective and ortho camera

let cameraTypeChanged = false;
let camType = 'perspective';
let orthoCam = document.getElementById('btnOrtho');
orthoCam.onclick = function changeCamToOrtho() {
  camType = 'ortho';
  cameraTypeChanged = true;
};

let btnPerspective = document.getElementById('btnPerspective');
btnPerspective.onclick = function changeCamToPerspective() {
  camType = 'perspective';
  cameraTypeChanged = true;
};





function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var canvaswgl = document.querySelector("#canvas2");
  var gl = canvaswgl.getContext("webgl",{preserveDrawingBuffer : true}) ;
  if (!gl) {
    return;
  }

  const controller = RenderController;

  controller.initialize(canvaswgl,gl,window,20);
 
  const rtWidth = controller.getRenderTextureWidth();
  const rtHeight = controller.getRenderTextureHeight();


  let helpers = [];

 
  const renderer = new THREE.WebGLRenderer(
    {
      preserveDrawingBuffer : true,
      canvas
    });

  const scene = new THREE.Scene();
  const debugScene = new THREE.Scene();

  {
    const planeSize = 40;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);
  //  debugScene.add(mesh);
  }
  {
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({color: '#8AC'});
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(0,0,-20);
    mesh.scale.set(10,10,10);
    scene.add(mesh);
  }
  {
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
   scene.add(light.target);
  }

  RenderController.setupCanvas(gl);
 

  const renderTarget = new THREE.WebGLRenderTarget(rtWidth,rtHeight);
 
  //Setting up rendering targets
  const fov = 45;
  const aspect = 1;  // the canvas default
  const near = 0.1;
  const far = 1000;

  var cameraPositions  = [
    new THREE.Vector3(1.0,1.0,0.0),
    new THREE.Vector3(-1.0,1.0,0.0),
    new THREE.Vector3(0.0,1.0,0.0),
    new THREE.Vector3(0.0,1.0,1.0)
  ];

  const cameras = [];

  const debugCamera = new THREE.PerspectiveCamera(45,1,near,far);
 // debugCamera.zoom = 0.1;
  debugCamera.position.set(20.0,20.0,-10.0);
  debugCamera.lookAt(0,0,0);

  function updateProjMats(camType = 'perspective'){
    let projectionMatrices  = controller.getProjectionMatrices(camType);
    for(let i = 0;i<projectionMatrices.length;i++) {
      let matrix = new THREE.Matrix4();
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
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(cameraPositions[i],4,20);
    cameras.push(camera);

    let helper = new THREE.CameraHelper(camera); 
    scene.add( helper );
    helpers.push(helper);
    scene.add(camera);
    
  }

  updateProjMats();

  RenderController.setupTextures(gl, rtWidth, rtHeight);
 
  const tempBuffer = new Uint8Array(rtWidth * rtHeight * 4);

  var stats = new Stats();
  stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );

  renderer.setClearColor(0.0,0.0,0.0,1.0);

  RenderController.glClearColor(gl);

  function render(time)
  {
    stats.begin();

    cameras.forEach((camera,index) =>
    {
      renderer.clear();
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene,camera);

      renderer.readRenderTargetPixels(renderTarget,0,0,rtWidth,rtHeight,tempBuffer);

      RenderController.saveTexture(tempBuffer, index, rtWidth, rtHeight, gl);
      
    });

    if(cameraTypeChanged)
    {
      updateProjMats(camType);
      cameraTypeChanged = false;
    }

    RenderController.update(gl);
    renderer.setRenderTarget(null);
    renderer.render(scene,debugCamera);
    
    requestAnimationFrame(render);

    try{
      stats.update();
    stats.end();
    
    } catch(e){console.log(e);}
  };

    
  requestAnimationFrame(render);
    
}

main();

