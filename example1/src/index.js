import * as THREE from 'three';
import RenderController from 'leiawebglsdk/src/RenderController.js';
import BackLightController from 'leiawebglsdk/src/BackLightController.js';
import { BacklightMode } from 'leiawebglsdk/src/Constants.js';

function main() {
    // ensure pixel perfect scaling for different display settings
    document.querySelector("meta[name=viewport]").
        setAttribute('content', 'initial-scale=' +
            (1.0/window.devicePixelRatio) + ', minimum-scale=0.01, user-scalable=0');

    // setup:
    const mainCanvas = document.querySelector("#myCanvas"); // for leia webgl sdk
    var clickCount = 0
    mainCanvas.onclick = () => {
        if (clickCount++ == 0) {
            BackLightController.requestBacklightMode(BacklightMode.ON);
        } else {
            //canvas.requestFullscreen();
        }
    }
    var gl = mainCanvas.getContext("webgl", { preserveDrawingBuffer : true });
    const controller = RenderController;
    var convergenceDistance = 20; // distance from camera to the focus point
    controller.initialize(mainCanvas, gl, window, false, 16, true);
    controller.setConvergence(convergenceDistance);
    const renderer = new THREE.WebGLRenderer({mainCanvas});
    const fov = 60, aspect = 1.6, near = 0.1, far = 100;
    //const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const scene = new THREE.Scene();
    const rtWidth = controller.getRenderTextureWidth();
    const rtHeight = controller.getRenderTextureHeight();
    const renderTarget = new THREE.WebGLRenderTarget(rtWidth,rtHeight);
    var cameras = []
    function updateProjMats() {
        let projectionMatrices = controller.getProjectionMatrices("perspective");
        for (let i = 0; i < projectionMatrices.length; i++) {
          let matrix = new THREE.Matrix4();
          matrix.elements = projectionMatrices[i];
          cameras[i].projectionMatrix = matrix.clone();
          cameras[i].projectionMatrixInverse = matrix.clone().invert();
        }
    }
    var cameraPositions = controller.getCameraPositions();
    for (var i = 0 ; i < cameraPositions.length ; i++) {
        // note, fov, aspect, near, far will be ignored,
        // you need to set them through controller:
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
         // all cameras centered around zero:
         camera.position.set(cameraPositions[i], 0, 0);
         cameras.push(camera);
         scene.add(camera);
    }
    screen.orientation.addEventListener("change", function(e) {
        controller.adaptToOrientation(screen.orientation.type);
        updateProjMats();
    }, false);
    controller.adaptToOrientation(screen.orientation.type);
    updateProjMats();

    scene.background = new THREE.Color("rgb(0, 128, 256)");

    // creating example textured cube
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshBasicMaterial({
        map: loader.load('texture.jpg'),
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.z = -20; // important, cube and camera must not be at same place
    scene.add(cube);

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
    }

    // render loop
    function render(time) {
        // if (resizeRendererToDisplaySize(renderer)) {
        //   const canvas = renderer.domElement;
        //   camera.aspect = canvas.clientWidth / canvas.clientHeight;
        //   camera.updateProjectionMatrix();
        // }
        // rotation animation:
        cube.rotation.x = time * 0.001;
        cube.rotation.y = time * 0.003;

        // actual rendering:
        //renderer.render(scene, camera);
        const tempBuffer = new Uint8Array(rtWidth * rtHeight * 4);
        cameras.forEach((camera,index) => {
          renderer.clear();
          renderer.setRenderTarget(renderTarget);
          renderer.render(scene, camera);
          renderer.readRenderTargetPixels(renderTarget, 0, 0, rtWidth, rtHeight, tempBuffer);
          controller.saveTexture(tempBuffer, index, rtWidth, rtHeight, gl);
        });

        controller.update(gl);

        // asking for next frame:
        requestAnimationFrame(render);
    }

    // asking for initial frame:
    requestAnimationFrame(render);
}

window.onload = main
