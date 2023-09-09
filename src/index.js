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
  resizeCanvas: false,
};
const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.type = "text/css";
linkElement.href = "index.css"; // Replace with the path to your CSS file

// Append the <link> element to the <head> section of the document
document.head.appendChild(linkElement);
const sketch = ({ context, canvas }) => {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  const gui = new GUI();

  const options = {
    enableSwoopingCamera: false,
    enableRotation: true,
    transmission: 1,
    thickness: 0.5,
    roughness: 0,
    envMapIntensity: 0,
  };
  const mouse = new THREE.Vector2();
  canvas.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / canvas.width) * 2 - 1;
    mouse.y = -(event.clientY / canvas.height) * 2 + 1;
  });
  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false,
  });
  renderer.setClearColor(0x000000, 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 2.7);

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
  video.src = "assets/VIDEO-2023-09-04-15-43-42.mp4";
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
  bgMesh.position.set(0, 0, -10);
  // bgMesh.position.set(0, 0, -8);
  scene.add(bgMesh);

  let isAnimating = false;

  let isShrinking = false;
  let isExpanding = false;
  let isStarted = false;

  function animateShrink() {
    if (isShrinking) return;
    isShrinking = true;

    const animationDuration = 700;
    const startTime = Date.now();
    const startScale = meshes[0].scale.x;
    const targetScale = 1;
    const startRotationX = meshes[0].rotation.x; // Initial X-axis rotation
    const targetRotationX = Math.PI * 0.1; // Target X-axis rotation

    // z to X for the multi diretion cube rotation
    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Apply easing for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const scale = THREE.MathUtils.lerp(
        startScale,
        targetScale,
        easedProgress
      );
      const rotationY = progress * Math.PI * 1;
      const rotationX = THREE.MathUtils.lerp(
        startRotationX,
        targetRotationX,
        easedProgress
      ); // Update X-axis rotation

      meshes.forEach((mesh) => {
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.y = rotationY;
        mesh.rotation.x = rotationX; // Apply X-axis rotation
      });
      bgMesh.scale.set(scale, scale, 0);

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
    const targetScale = 5;

    // Keep track of the current rotation state from the last animation
    const startRotationY = meshes[0].rotation.y;
    const startRotationX = meshes[0].rotation.x;

    // Calculate the target rotation state for the expansion
    const targetRotationY = startRotationY + Math.PI * 1; // For example, rotate by 90 degrees
    const targetRotationX = startRotationX + Math.PI * 0.1; // Adjust the X-axis rotation as needed

    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Apply easing for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const scale = THREE.MathUtils.lerp(
        startScale,
        targetScale,
        easedProgress
      );

      // Interpolate rotation values for smooth rotation
      const rotationY = THREE.MathUtils.lerp(
        startRotationY,
        targetRotationY,
        easedProgress
      );
      const rotationX = THREE.MathUtils.lerp(
        startRotationX,
        targetRotationX,
        easedProgress
      );

      meshes.forEach((mesh) => {
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.y = rotationY;
        mesh.rotation.x = rotationX; // Apply X-axis rotation
      });
      bgMesh.scale.set(scale, scale, 0);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isExpanding = false;
      }
    }

    animate();
  }

  const arrowButtonStyle = document.createElement("style");
  arrowButtonStyle.textContent = `
  .arrow-button {
    display: none;
  }
`;
  document.head.appendChild(arrowButtonStyle);
  const startButton = createStartButton("Start");
  document.body.appendChild(startButton); // Add the button to the DOM

  // ... (rest of the code)
  function toggleArrowButtonsVisibility(show) {
    const arrowButtons = document.querySelectorAll(".arrow-button");
    arrowButtons.forEach((button) => {
      button.style.display = show ? "block" : "none";
    });
  }
  function createStartButton(text) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.fontSize = "24px";
    button.style.padding = "15px";
    button.style.margin = "5px";
    button.style.border = "none";
    button.style.color = "white";
    button.style.borderRadius = "10px";
    button.style.background = "#1e2c53";
    button.style.cursor = "pointer";
    button.style.position = "absolute"; // Position the button absolutely
    button.style.bottom = "50px";
    button.style.alignItems = "center"; // Adjust the position as needed
    button.addEventListener("click", () => {
      if (!isStarted) {
        expandCubeWithSpin();
        toggleArrowButtonsVisibility(true); // Show arrow buttons
        button.style.display = "none"; // Hide the "Start" button after clicking
        isStarted = true;
        textElement.style.display = "block";
      }
    });

    return button;
  }

  function expandCubeWithSpin() {
    const initialScale = meshes[0].scale.clone();
    const targetScale = new THREE.Vector3(5, 5, 5); // Adjust as needed
    const rotationAmount = Math.PI / 0.5; // Adjust the rotation amount
    const videoInitialScale = bgMesh.scale.clone();
    const videoTargetScale = new THREE.Vector3(2, 2, 1); // Adjust as needed
    const animationDuration = 3500; // Duration of animation in milliseconds

    const startTime = Date.now();
    const initialRotation = meshes[0].rotation.y;

    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3); // Apply easing for smoother animation

      meshes[0].scale.lerpVectors(initialScale, targetScale, easedProgress);
      meshes[0].rotation.y = initialRotation + rotationAmount * easedProgress;

      bgMesh.scale.lerpVectors(
        videoInitialScale,
        videoTargetScale,
        easedProgress
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  //background change
  const videoUrls = [
    "assets/VIDEO-2023-09-04-15-43-42.mp4",
    "assets/VIDEO-2023-09-04-15-43-42.mp4",
    "assets/VIDEO-2023-09-04-15-43-42.mp4",
    "assets/VIDEO-2023-09-04-15-43-42.mp4",
    "assets/VIDEO-2023-09-04-15-43-42.mp4",
    "assets/VIDEO-2023-09-04-15-43-42.mp4",
  ];
  let currentVideoIndex = 0;
  const videoTexts = [
    "Lorem ipsum is placeholder ",
    "Lorem ipsum is placeholder text commonly",
    "Lorem ipsum is ",
    "Lorem ipsum ",
    "Lorem ipsum is placeholder text ",
    "Lorem ipsum is placeholder",
  ];
  const textContainer = document.createElement("div");
  textContainer.style.position = "absolute";
  textContainer.style.bottom = "50px"; // Adjust the vertical position as needed
  textContainer.style.left = "20px"; // Adjust the horizontal position as needed
  textContainer.style.color = "white"; // Adjust the text color
  textContainer.style.fontSize = "18px"; // Adjust the font size
  textContainer.style.zIndex = "999"; // Ensure the text appears above other content
  textContainer.style.fontFamily = "Courier";

  textContainer.textContent = "Powered by -"; // Initial text content

  const textOGContainer = document.createElement("div");
  textOGContainer.style.position = "absolute";
  textOGContainer.style.bottom = "20px"; // Adjust the vertical position as needed
  textOGContainer.style.left = "50px"; // Adjust the horizontal position as needed
  textOGContainer.style.color = "white"; // Adjust the text color
  textOGContainer.style.fontSize = "20px"; // Adjust the font size
  textOGContainer.style.zIndex = "999"; // Ensure the text appears above other content
  textOGContainer.style.fontFamily = "Courier";
  textOGContainer.style.fontWeight = "900";
  textOGContainer.textContent = "ONE WAY GLORY INDUSTRIES"; // Initial text content

  // Append the text container to the document body
  document.body.appendChild(textContainer);
  document.body.appendChild(textOGContainer);
  // Create an HTML element to display the text
  const textElement = document.createElement("div");
  textElement.style.position = "absolute";
  textElement.style.top = "50%"; // Vertically centered
  textElement.style.left = "50%"; // Horizontally centered
  textElement.style.transform = "translate(-50%, -50%)";
  textElement.style.fontSize = "24px";
  textElement.style.color = "#fff";
  textElement.style.fontSize = "44px";
  textElement.style.backgroundColor = "#1e2c53";
  textElement.style.fontWeight = "900";
  textElement.style.fontFamily = "Courier";
  textElement.style.borderRadius = "10px";
  textElement.style.display = "none";

  // Initialize with the first video's text
  document.body.appendChild(textElement);

  const leftButton = createArrowButton("←", -3, 3, true);
  const rightButton = createArrowButton("→", 3, -3, false);

  const buttonContainer = document.createElement("div");

  buttonContainer.style.display = "flex";
  buttonContainer.style.flexDirection = "column";
  buttonContainer.style.alignItems = "center";

  buttonContainer.appendChild(leftButton);
  buttonContainer.appendChild(rightButton);
  document.body.appendChild(buttonContainer);

  const bottomCenterButton = document.createElement("button");
  bottomCenterButton.textContent = "Explore More";
  bottomCenterButton.style.position = "absolute";
  bottomCenterButton.style.bottom = "20px";
  bottomCenterButton.style.left = "50%";
  bottomCenterButton.style.transform = "translateX(-50%)";
  bottomCenterButton.style.fontSize = "24px";
  bottomCenterButton.style.padding = "20px 50px 50px 50px";
  bottomCenterButton.style.border = "none";
  bottomCenterButton.style.background = "none";
  bottomCenterButton.style.color='white';
  bottomCenterButton.style.fontWeight="900";
  bottomCenterButton.style.fontFamily="Courier"
  bottomCenterButton.style.cursor = "pointer";
  bottomCenterButton.style.display = "none";
  
  bottomCenterButton.style.transition = "background-color 0.3s ease-in-out"; // Smooth transition

    // Set initial background color to transparent
    bottomCenterButton.style.backgroundColor = "transparent";

  bottomCenterButton.addEventListener("mouseenter", () => {
    bottomCenterButton.style.backgroundColor = "#1e2c53"; // Light white background on hover
    bottomCenterButton.style.borderRadius = "50px 50px 0px 0px";

  });

  bottomCenterButton.addEventListener("mouseleave", () => {
    bottomCenterButton.style.backgroundColor = "transparent";
    bottomCenterButton.style.color = "white"; // Reset background on mouse leave
  });

  document.body.appendChild(bottomCenterButton)
  startButton.addEventListener("click", () => {
    // Show the bottom center button
    bottomCenterButton.style.display = "block";
    // Add any additional actions you want to perform when the start button is clicked
  });

  function createArrowButton(text, rotationAmount, zoomAmount, isLeft) {
    const button = document.createElement("button");
    button.className = "arrow-button";
    button.textContent = text;
    button.style.fontSize = "50px";
    button.style.padding = "50px";
    button.style.fontWeight = "1900";
    button.style.textAlign = "center";
    button.style.border = "none";
    button.style.background = "none";
    button.style.color = "white";
    button.style.cursor = "pointer";
    button.style.transition = "background-color 0.3s ease-in-out"; // Smooth transition

    // Set initial background color to transparent
    button.style.backgroundColor = "transparent";

    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "rgba(255, 255, 255)"; // Light white background on hover
      button.style.borderRadius = "50%";
      button.style.color = "black";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "transparent"; // Reset background on mouse leave
    });

    if (isLeft) {
      button.style.position = "absolute";
      button.style.top = "50%";
      button.style.left = "20px";
      button.style.transform = "translateY(-50%)";
    } else {
      button.style.position = "absolute";
      button.style.top = "50%";
      button.style.right = "20px";
      button.style.transform = "translateY(-50%)";
    }

    button.addEventListener("click", () => {
      if (!isShrinking && !isExpanding) {
        if (isLeft) {
          // Go to the previous video
          currentVideoIndex =
            (currentVideoIndex - 1 + videoUrls.length) % videoUrls.length;
        } else {
          // Go to the next video
          currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
        }

        // Set the new video source
        video.src = videoUrls[currentVideoIndex];
        video.play();

        // Update the video texture
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBFormat;
        bgMaterial.map = videoTexture;

        // Adjust the scale of the bgMesh based on your desired scale factor
        const scaleFactor = 2; // Adjust as needed
        bgMesh.scale.set(scaleFactor, scaleFactor, 1);

        // Adjust the position of the bgMesh to keep it centered
        bgMesh.position.set(0, -0.1, -9);

        animateShrink();

        // Update the text content and show it
        textElement.classList.remove("active");

        // Delay the text update and adding the active class to trigger the sliding-in effect
        setTimeout(() => {
          textElement.textContent = videoTexts[currentVideoIndex];
          textElement.classList.add("active");
          textElement.style.padding = "10px";
        }, 250);
      }
    });

    return button;
  }

// ... (previous code)

let isCubeSpinActive = false; // Track if the cube spin effect is active

// Function to shrink the cube
// Function to shrink the cube with spin effect
function shrinkCube() {
  const initialScale = meshes[0].scale.clone();
  const targetShrinkScale = new THREE.Vector3(1, 1, 1); // Adjust as needed
  const animationDuration = 2500; // Duration of the shrinking animation in milliseconds
  const rotationAmount = Math.PI * 2; // Amount to rotate during the animation

  const startTime = Date.now();
  textElement.style.display = 'none';

  function animateShrink() {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);

    const easedProgress = 1 - Math.pow(1 - progress, 3); // Apply easing for smoother animation

    // Calculate the scale for the shrinking animation
    const scale = new THREE.Vector3().lerpVectors(
      initialScale,
      targetShrinkScale,
      easedProgress
    );

    // Calculate the rotation for the spin effect
    const rotation = progress * rotationAmount;

    meshes[0].scale.copy(scale);
    meshes[0].rotation.x = rotation; // Apply rotation

    // Adjust the background mesh size based on the scale
    bgMesh.scale.copy(scale);

    if (progress < 1) {
      requestAnimationFrame(animateShrink);
    } else {
      expandCube(); // Call the expandCube function when the shrinking animation is complete
    }
  }

  animateShrink();
}

// Function to expand the cube back to its original state with spin effect
function expandCube() {
  const targetExpandScale = new THREE.Vector3(5, 5, 5); // Original scale of the cube
  const animationDuration = 2000; // Duration of the expanding animation in milliseconds
  const rotationAmount = Math.PI * 2; // Amount to rotate during the animation

  const startTime = Date.now();

  function animateExpand() {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);

    const easedProgress = 1 - Math.pow(1 - progress, 2); // Apply easing for smoother animation

    // Calculate the scale for the expanding animation
    const scale = new THREE.Vector3().lerpVectors(
      meshes[0].scale,
      targetExpandScale,
      easedProgress
    );

    // Calculate the rotation for the spin effect
    const rotation = progress * rotationAmount;

    meshes[0].scale.copy(scale);
    meshes[0].rotation.x = rotation; // Apply rotation

    // Adjust the background mesh size based on the scale
    bgMesh.scale.copy(scale);

    if (progress < 1) {
      requestAnimationFrame(animateExpand);
    }
  }

  animateExpand();
}

// Event listener for the bottom center button click
bottomCenterButton.addEventListener("click", () => {
  shrinkCube(); // Start the shrinking animation on button click
});






// ... (rest of your code)


  const positions = [[0, 0, 0]];

  const geometries = [new THREE.RoundedBoxGeometry(1.12, 1.12, 1.12, 16, 0.1)];

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
    envMap: hdrEquirect,
  });

  const meshes = geometries.map(
    (geometry) => new THREE.Mesh(geometry, material)
  );

  meshes.forEach((mesh, i) => {
    scene.add(mesh);
    mesh.position.set(...positions[i]);
  });

  // Add dragon GLTF model

  // Discard the model

  // GUI
  // ---

  // Update
  // ------
  const hoveringAmplitudeX = 0.03; // Adjust this value to control the X-axis hovering amplitude
  const hoveringAmplitudeY = 0.03; // Adjust this value to control the Y-axis hovering amplitude
  const hoveringAmplitudeZ = 0.03; // Adjust this value to control the Z-axis hovering amplitude
  const hoveringSpeedX = 0.5; // Adjust this value to control the X-axis hovering speed
  const hoveringSpeedY = 0.5; // Adjust this value to control the Y-axis hovering speed
  const hoveringSpeedZ = 0.5; // Adjust this value to control the Z-axis hovering speed
  const rotationSpeed = 0.02;

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
    const hoveringOffsetX =
      Math.sin(time * hoveringSpeedX) * hoveringAmplitudeX;
    const hoveringOffsetY =
      Math.sin(time * hoveringSpeedY) * hoveringAmplitudeY;
    const hoveringOffsetZ =
      Math.sin(time * hoveringSpeedZ) * hoveringAmplitudeZ;

    const rotationOffset = time * rotationSpeed;

    // Apply hovering offsets to all three axes and add rotation effect
    const cubePosition = initialCubePosition
      .clone()
      .add(
        new THREE.Vector3(hoveringOffsetX, hoveringOffsetY, hoveringOffsetZ)
      );

    cubePosition.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationOffset);
    cubePosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationOffset);
    cubePosition.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotationOffset);

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
    },
  };
};

canvasSketch(sketch, settings);