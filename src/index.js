const canvasSketch = require("canvas-sketch");

// Import ThreeJS and assign it to global scope
// This way examples/ folder can use it too
const THREE = require("three");
global.THREE = THREE;

// Import extra THREE plugins
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/geometries/RoundedBoxGeometry.js");
require("three/examples/js/loaders/GLTFLoader.js");
require("three/examples/js/loaders/RGBELoader.js");

const Stats = require("stats-js");
const { GUI } = require("dat.gui");

const settings = {
  animate: true,
  context: "webgl",
  resizeCanvas: false
};

const sketch = ({ context, canvas }) => {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  const gui = new GUI();
 
  const options = {
    enableSwoopingCamera: false,
    enableRotation: true,
    transmission: 1,
    thickness: 1.5,
    roughness: 0.07,
    envMapIntensity: 1.5
  };
  const mouse = new THREE.Vector2();
  canvas.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / canvas.width) * 2 - 1;
    mouse.y = -(event.clientY / canvas.height) * 2 + 1;
  });
  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false
  });
  renderer.setClearColor(0x000000, 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 3);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enabled = false;

  const scene = new THREE.Scene();

  const container = document.createElement("div");
  container.style.position = "relative";
  container.appendChild(canvas);
  document.body.appendChild(container);

  // Content
  // -------
  const video = document.createElement("video");
  video.src = "src/ecloset_video.mp4";
  video.loop = true;
  video.muted = true;
  video.play();
  video.style.display = "none";
  document.body.appendChild(video);

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;

  const bgGeometry = new THREE.PlaneGeometry(5, 5);
  const bgMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.set(0, 0, -23);
  // bgMesh.position.set(0, 0, -8);
  scene.add(bgMesh);
 
  let isAnimating = false;

  let isShrinking = false;
  let isExpanding = false;
  let isStarted = false;


  function animateShrink() {
    if (isShrinking) return;
    isShrinking = true;

    const animationDuration = 1200;
    const startTime = Date.now();
    const startScale = meshes[0].scale.x;
    const targetScale = 1;

    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const scale = THREE.MathUtils.lerp(startScale, targetScale, progress);
      const rotation = progress * Math.PI * 1; 
      meshes.forEach((mesh) => {
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.y = rotation;
      });
      bgMesh.scale.set(scale, scale, 1);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isShrinking = false;
        animateExpand();
      }
    }

    animate();
  }

  function animateExpand() {
    if (isExpanding) return;
    isExpanding = true;

    const animationDuration = 2000;
    const startTime = Date.now();
    const startScale = meshes[0].scale.x;
    const targetScale = 7;

    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const scale = THREE.MathUtils.lerp(startScale, targetScale, progress);
      const rotation = progress * Math.PI * 1; 
      meshes.forEach((mesh) => {
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.y = rotation;
      });
      bgMesh.scale.set(scale, scale, 1);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isExpanding = false;
      }
    }

    animate();
  }
  const startButton = createStartButton("Start");
  document.body.appendChild(startButton); // Add the button to the DOM

  // ... (rest of the code)

  function createStartButton(text) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.fontSize = "24px";
    button.style.padding = "5px 10px";
    button.style.margin = "5px";
    button.style.border = "none";
    button.style.background = "rgba(255, 255, 255, 0.5)";
    button.style.cursor = "pointer";
    button.style.position = "absolute"; // Position the button absolutely
    button.style.top = "20px";
    button.style.left = "120px"; // Adjust the position as needed
    button.addEventListener("click", () => {
      if (!isStarted) {
        expandCubeWithSpin();
        button.style.display = "none"; // Hide the button after clicking
        isStarted = true;
      }
    });

    return button;
  }

  function expandCubeWithSpin() {
    const initialScale = meshes[0].scale.clone();
    const targetScale = new THREE.Vector3(6,6,6); // Adjust as needed
    const rotationAmount = Math.PI / 0.5; // Adjust the rotation amount
    const animationDuration = 4500; // Duration of animation in milliseconds

    const startTime = Date.now();
    const initialRotation = meshes[0].rotation.y;

    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3); // Apply easing for smoother animation

      meshes[0].scale.lerpVectors(initialScale, targetScale, easedProgress);
      meshes[0].rotation.y = initialRotation + rotationAmount * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }


  const leftButton = createArrowButton("←", -3, 3);
  const rightButton = createArrowButton("→", 3, -3);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.position = "absolute";
  buttonContainer.style.top = "50%";
  buttonContainer.style.transform = "translateY(-50%)";
  buttonContainer.style.left = "20px";
  buttonContainer.style.display = "flex";
  buttonContainer.style.flexDirection = "column";
  buttonContainer.style.alignItems = "center";
  buttonContainer.appendChild(leftButton);
  buttonContainer.appendChild(rightButton);
  document.body.appendChild(buttonContainer);

  function createArrowButton(text, rotationAmount, zoomAmount) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.fontSize = "24px";
    button.style.padding = "5px 10px";
    button.style.margin = "5px";
    button.style.border = "none";
    button.style.background = "rgba(255, 255, 255, 0.5)";
    button.style.cursor = "pointer";
    button.addEventListener("click", () => {
      if (!isShrinking && !isExpanding) {
        animateShrink();
      }
    });
        return button;
  }

  function rotateCube(amount) {
    meshes.forEach((mesh) => {
      mesh.rotateY(amount);
      // Scale the mesh on one side
      mesh.scale.x += amount * 0.1;
    });
  }

  const positions = [[0, 0, 0]];

  const geometries = [new THREE.RoundedBoxGeometry(1.12, 1.12, 1.12, 16, 0.2 )];

  const hdrEquirect = new THREE.RGBELoader().load(
    "src/empty_warehouse_01_2k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  const material = new THREE.MeshPhysicalMaterial({
    transmission: options.transmission,
    thickness: options.thickness,
    roughness: options.roughness,
    envMap: hdrEquirect
  });

  const meshes = geometries.map((geometry) => new THREE.Mesh(geometry, material));

  meshes.forEach((mesh, i) => {
    scene.add(mesh);
    mesh.position.set(...positions[i]);
  });

  
  // Add dragon GLTF model

  // Discard the model

  // GUI
  // ---

  gui.add(options, "enableSwoopingCamera").onChange((val) => {
    controls.enabled = !val;
    controls.reset();
  });

  gui.add(options, "enableRotation").onChange(() => {
    meshes.forEach((mesh) => mesh.rotation.set(0, 0, 0));
  });

  gui.add(options, "transmission", 0, 1, 0.01).onChange((val) => {
    material.transmission = val;
  });

  gui.add(options, "thickness", 0, 5, 0.1).onChange((val) => {
    material.thickness = val;
  });

  gui.add(options, "roughness", 0, 1, 0.01).onChange((val) => {
    material.roughness = val;
  });

  gui.add(options, "envMapIntensity", 0, 3, 0.1).onChange((val) => {
    material.envMapIntensity = val;
  });

  // Update
  // ------
  const hoveringAmplitude = 0.05; // Adjust this value to control the hovering amplitude
  const hoveringSpeed = 0.5;
  const attractionStrength = 0.5; // Adjust this value to control the strength of attraction
  const hoveringDistance = 0.2; // Adjust this value to control the hovering distance
  const initialCubePosition = new THREE.Vector3(0, 0, 0); // Set your desired original position
  let isAttracted = false;
  
  const update = (time, deltaTime) => {
    const ROTATE_TIME = 10; // Time in seconds for a full rotation
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const rotateX = (deltaTime / ROTATE_TIME) * Math.PI * 2;
    const rotateY = (deltaTime / ROTATE_TIME) * Math.PI * 2;


    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hoveringOffset = Math.sin(time * hoveringSpeed) * hoveringAmplitude;
    const cubePosition = initialCubePosition.clone().add(new THREE.Vector3(0, hoveringOffset, 0));
    meshes[0].position.copy(cubePosition);

    const intersects = raycaster.intersectObjects([bgMesh]); // Only check intersection with the background plane
    if (intersects.length > 0) {
      isAttracted = true;
    } else {
      isAttracted = false;
    }
    if (videoTexture.image instanceof HTMLVideoElement) {
      videoTexture.needsUpdate = true;
    }

    if (options.enableSwoopingCamera) {
      camera.position.x = Math.sin((time / 10) * Math.PI * 2) * 2;
      camera.position.y = Math.cos((time / 10) * Math.PI * 2) * 2;
      camera.position.z = 4;
      camera.lookAt(scene.position);
    }
  };

  // Lifecycle
  // ---------

  return {
    resize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
      const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      canvas.style.width = viewportWidth + "px";
      canvas.style.height = viewportHeight + "px";

      renderer.setPixelRatio(dpr);
      renderer.setSize(viewportWidth, viewportHeight);

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time, deltaTime }) {
      stats.begin();
      controls.update();
      update(time, deltaTime);
      renderer.render(scene, camera);
      stats.end();
    },
    unload() {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      hdrEquirect.dispose();
      controls.dispose();
      renderer.dispose();
      gui.destroy();
      document.body.removeChild(stats.dom);
    }
  };
};

canvasSketch(sketch, settings);
