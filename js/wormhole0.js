/**
 * Wormhole XR - Stage 1: The Distant Neon Cyan Wormhole
 * Built with Three.js, WebXR API, Custom GLSL Shaders, and Custom Post-Processing Bloom Pipeline.
 * 
 * Calm Chess Games / Brian Berry (C) 2026
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js';

// =============================================================================
// STATE & CONFIGURATION
// =============================================================================
const CONFIG = {
  wormholeDistance: 220,
  wormholeRadius: 18.0,
  eventHorizonRadius: 7.2,
  accretionDiskRadius: 36.0,
  rotationSpeed: 0.85,
  particleCount: 5500,
  starCount: 3000,
  dustCount: 800,
  bloomStrength: 1.85,
  bloomThreshold: 0.35,
  bloomRadius: 1.25,
  chromaticAberration: 0.0035,
  warpSpeed: 0.0,
  maxWarpSpeed: 25.0,
  audioMuted: true
};

// Application state
const state = {
  time: 0,
  lastFrameTime: performance.now(),
  fps: 60,
  frameCount: 0,
  lastFpsUpdate: performance.now(),
  cameraDistance: CONFIG.wormholeDistance,
  isWarping: false,
  isXR: false,
  hudVisible: true,
  postProcessingEnabled: true
};

// =============================================================================
// THREE.JS CORE SCENE INITIALIZATION
// =============================================================================
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x01050a, 0.0018);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 2.5, CONFIG.wormholeDistance);

const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance',
  antialias: false, // Turned off for post-processing render targets
  alpha: false,
  stencil: false,
  depth: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

// WebXR Button
const vrBtn = VRButton.createButton(renderer);
vrBtn.id = 'xr-enter-btn';
document.body.appendChild(vrBtn);

// XR Event Handlers
renderer.xr.addEventListener('sessionstart', () => {
  state.isXR = true;
  document.body.classList.add('in-xr-session');
  console.log('[Wormhole XR] Session started.');
  if (hudStatusEl) hudStatusEl.textContent = 'XR SESSION ACTIVE (HMD MODE)';
});
renderer.xr.addEventListener('sessionend', () => {
  state.isXR = false;
  document.body.classList.remove('in-xr-session');
  console.log('[Wormhole XR] Session ended.');
  if (hudStatusEl) hudStatusEl.textContent = 'STAGE 1: DISTANT ANOMALY MONITOR';
});

// XR Controllers
const controllerModelFactory = new XRControllerModelFactory();
const controllers = [];
for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  scene.add(controller);
  
  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  // Laser Pointer for XR Controllers
  const laserGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -5)
  ]);
  const laserMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  const laser = new THREE.Line(laserGeom, laserMat);
  controller.add(laser);
  controllers.push(controller);
}

// Orbit Controls (Desktop / Touch Fallback)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 0.85;
controls.minDistance = 15;
controls.maxDistance = 600;
controls.target.set(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0x02111c, 0.4);
scene.add(ambientLight);

const wormholeCoreLight = new THREE.PointLight(0x00f0ff, 4.0, 400, 1.2);
wormholeCoreLight.position.set(0, 0, 0);
scene.add(wormholeCoreLight);

const secondaryLight = new THREE.PointLight(0x0066aa, 2.5, 300, 1.5);
secondaryLight.position.set(0, 0, -20);
scene.add(secondaryLight);

// =============================================================================
// CUSTOM GLSL SHADERS - WORMHOLE ACCRETION DISK & EVENT HORIZON
// =============================================================================

// Accretion Disk Custom Shader Material
const accretionDiskVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const accretionDiskFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorCore;
  uniform vec3 uColorEdge;
  uniform vec3 uColorHot;
  uniform float uNoiseScale;
  uniform float uSpeed;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  // 2D Simplex Noise Function
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractal Brownian Motion (FBM)
  float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 4; i++) {
      f += w * snoise(p);
      p *= 2.05;
      w *= 0.5;
    }
    return f;
  }

  void main() {
    // Polar coordinates from center (0.5, 0.5)
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float angle = atan(p.y, p.x);

    // Discard inner event horizon and outer edge
    if (r < 0.22 || r > 0.98) {
      discard;
    }

    // Swirling logarithmic vortex mapping
    float spiral = angle * 2.0 + 8.0 * log(r + 0.001) - uTime * uSpeed;
    vec2 uvSwirl = vec2(cos(spiral) * r, sin(spiral) * r) * uNoiseScale;

    // Multi-octave plasma turbulence
    float n1 = fbm(uvSwirl + vec2(uTime * 0.15, -uTime * 0.25));
    float n2 = fbm(uvSwirl * 2.0 - vec2(-uTime * 0.2, uTime * 0.1));
    float plasma = clamp(n1 * 0.6 + n2 * 0.4 + 0.5, 0.0, 1.0);

    // Relativistic Doppler Beaming: disk rotating towards observer appears brighter on one side
    float doppler = 1.0 + 0.45 * sin(angle + 0.8);

    // Radial intensity falloff and photon sphere peak
    float innerEdge = smoothstep(0.22, 0.35, r);
    float outerEdge = smoothstep(0.98, 0.65, r);
    float radialIntensity = innerEdge * outerEdge;

    // Glowing photon ring intensity peak near the boundary
    float photonRing = exp(-pow((r - 0.26) * 22.0, 2.0)) * 2.8;

    // Color gradient mixing
    vec3 baseColor = mix(uColorEdge, uColorCore, pow(plasma, 1.8));
    baseColor = mix(baseColor, uColorHot, photonRing * 0.85);

    // Final color with emissive HDR boost for bloom
    vec3 finalColor = baseColor * (radialIntensity * 2.4 + photonRing * 3.5) * doppler;

    float alpha = radialIntensity * (0.65 + plasma * 0.35);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Uniforms for Accretion Disk
const accretionUniforms = {
  uTime: { value: 0 },
  uSpeed: { value: CONFIG.rotationSpeed },
  uNoiseScale: { value: 3.2 },
  uColorEdge: { value: new THREE.Color(0x003366) },  // Deep indigo/navy
  uColorCore: { value: new THREE.Color(0x00f0ff) },  // Electric neon cyan
  uColorHot: { value: new THREE.Color(0xd6ffff) }    // Ultra-bright white-cyan
};

const accretionDiskMaterial = new THREE.ShaderMaterial({
  vertexShader: accretionDiskVertexShader,
  fragmentShader: accretionDiskFragmentShader,
  uniforms: accretionUniforms,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

// Geometry: High-resolution ring disk
const diskGeom = new THREE.RingGeometry(
  CONFIG.eventHorizonRadius * 0.85,
  CONFIG.accretionDiskRadius,
  96,
  16
);
const accretionDiskMesh = new THREE.Mesh(diskGeom, accretionDiskMaterial);
accretionDiskMesh.rotation.x = Math.PI / 2.3;
scene.add(accretionDiskMesh);

// Secondary inclined counter-rotating gravitational disk (lensing illusion)
const diskGeomSecondary = new THREE.RingGeometry(
  CONFIG.eventHorizonRadius * 0.9,
  CONFIG.accretionDiskRadius * 0.85,
  80,
  12
);
const secondaryDiskMaterial = accretionDiskMaterial.clone();
secondaryDiskMaterial.uniforms.uSpeed = { value: -CONFIG.rotationSpeed * 0.6 };
secondaryDiskMaterial.uniforms.uColorEdge = { value: new THREE.Color(0x001f3f) };
const accretionDiskMesh2 = new THREE.Mesh(diskGeomSecondary, secondaryDiskMaterial);
accretionDiskMesh2.rotation.x = -Math.PI / 2.7;
accretionDiskMesh2.rotation.y = Math.PI / 6;
scene.add(accretionDiskMesh2);

// =============================================================================
// BLACK HOLE / WORMHOLE SINGULARITY EVENT HORIZON
// =============================================================================

// Pure pitch-black event horizon core
const horizonGeom = new THREE.SphereGeometry(CONFIG.eventHorizonRadius, 64, 64);
const horizonMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  reflectivity: 0.0,
  roughness: 1.0
});
const horizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
scene.add(horizonMesh);

// Gravitational Lensing Fresnel Halo / Photon Ring
const photonRingVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const photonRingFragmentShader = `
  uniform float uTime;
  uniform vec3 uHaloColor;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel glow along sphere silhouette
    float fresnel = 1.0 - abs(dot(normal, viewDir));
    fresnel = pow(fresnel, 2.5);

    // Pulsing energy resonance
    float pulse = 0.85 + 0.15 * sin(uTime * 3.5);
    vec3 glowColor = uHaloColor * fresnel * uIntensity * pulse;

    gl_FragColor = vec4(glowColor, fresnel * 0.9);
  }
`;

const photonRingUniforms = {
  uTime: { value: 0 },
  uHaloColor: { value: new THREE.Color(0x00f0ff) },
  uIntensity: { value: 4.5 }
};

const photonRingMaterial = new THREE.ShaderMaterial({
  vertexShader: photonRingVertexShader,
  fragmentShader: photonRingFragmentShader,
  uniforms: photonRingUniforms,
  transparent: true,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  depthWrite: false
});

const photonSphere = new THREE.Mesh(
  new THREE.SphereGeometry(CONFIG.eventHorizonRadius * 1.06, 64, 64),
  photonRingMaterial
);
scene.add(photonSphere);

// Gravitational Shockwave Expanding Waves
const shockwaveCount = 3;
const shockwaves = [];
for (let i = 0; i < shockwaveCount; i++) {
  const swGeom = new THREE.RingGeometry(CONFIG.eventHorizonRadius, CONFIG.accretionDiskRadius * 1.3, 64);
  const swMat = new THREE.ShaderMaterial({
    vertexShader: accretionDiskVertexShader,
    fragmentShader: `
      uniform float uProgress;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float ring = exp(-pow((r - uProgress) * 12.0, 2.0));
        float fade = 1.0 - uProgress;
        gl_FragColor = vec4(uColor * ring * 2.5 * fade, ring * fade * 0.7);
      }
    `,
    uniforms: {
      uProgress: { value: (i / shockwaveCount) },
      uColor: { value: new THREE.Color(0x00e5ff) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const swMesh = new THREE.Mesh(swGeom, swMat);
  swMesh.rotation.x = Math.PI / 2.3;
  scene.add(swMesh);
  shockwaves.push({ mesh: swMesh, speed: 0.15 + i * 0.05 });
}

// =============================================================================
// HIGH-VELOCITY SPIRALING PARTICLE VORTEX
// =============================================================================
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(CONFIG.particleCount * 3);
const particleColors = new Float32Array(CONFIG.particleCount * 3);
const particleParams = new Float32Array(CONFIG.particleCount * 4); // [radius, angle, speed, heightOffset]

const baseCyan = new THREE.Color(0x00f0ff);
const deepCyan = new THREE.Color(0x0077aa);
const brightWhite = new THREE.Color(0xf0ffff);

for (let i = 0; i < CONFIG.particleCount; i++) {
  // Radius distribution concentrated near the vortex
  const rNorm = Math.pow(Math.random(), 1.7);
  const radius = CONFIG.eventHorizonRadius * 1.05 + rNorm * (CONFIG.accretionDiskRadius * 1.4);
  const angle = Math.random() * Math.PI * 2;
  const speed = (0.4 + (1.0 - rNorm) * 1.8) * CONFIG.rotationSpeed;
  const heightOffset = (Math.random() - 0.5) * (radius * 0.15);

  particleParams[i * 4 + 0] = radius;
  particleParams[i * 4 + 1] = angle;
  particleParams[i * 4 + 2] = speed;
  particleParams[i * 4 + 3] = heightOffset;

  particlePositions[i * 3 + 0] = Math.cos(angle) * radius;
  particlePositions[i * 3 + 1] = heightOffset;
  particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

  // Color gradient
  const tempCol = new THREE.Color();
  if (rNorm < 0.25) {
    tempCol.lerpColors(baseCyan, brightWhite, Math.random());
  } else {
    tempCol.lerpColors(deepCyan, baseCyan, Math.random());
  }
  particleColors[i * 3 + 0] = tempCol.r;
  particleColors[i * 3 + 1] = tempCol.g;
  particleColors[i * 3 + 2] = tempCol.b;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
particleGeometry.setAttribute('params', new THREE.BufferAttribute(particleParams, 4));

// Custom Particle Shader
const particleVertexShader = `
  attribute vec4 params; // [radius, angle, speed, heightOffset]
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;

    float radius = params.x;
    float baseAngle = params.y;
    float speed = params.z;
    float height = params.w;

    // Spiraling inward calculation
    float currentAngle = baseAngle + uTime * speed;
    
    // Funnel gravitation drop near the horizon
    float drop = -exp(-pow((radius - 7.5) * 0.35, 2.0)) * 6.0;

    vec3 pos = vec3(
      cos(currentAngle) * radius,
      height + drop,
      sin(currentAngle) * radius
    );

    // Rotate disk orientation to match accretion disk tilt
    float tiltX = 1.365; // ~PI / 2.3
    float cosT = cos(tiltX);
    float sinT = sin(tiltX);
    vec3 tiltedPos = vec3(
      pos.x,
      pos.y * cosT - pos.z * sinT,
      pos.y * sinT + pos.z * cosT
    );

    vec4 mvPosition = modelViewMatrix * vec4(tiltedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = (24.0 / -mvPosition.z) * (1.2 + sin(uTime * 4.0 + baseAngle) * 0.4);

    // Alpha fade near extreme outer edges
    vAlpha = smoothstep(50.0, 35.0, radius) * 0.95;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft circular point texture
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float glow = exp(-dist * 6.0);
    gl_FragColor = vec4(vColor * 2.2, glow * vAlpha);
  }
`;

const particleMaterial = new THREE.ShaderMaterial({
  vertexShader: particleVertexShader,
  fragmentShader: particleFragmentShader,
  uniforms: {
    uTime: { value: 0 }
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexColors: true
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// =============================================================================
// DEEP SPACE COSMIC STARFIELD & PARALLAX DUST
// =============================================================================
function createStarfield() {
  const starGeom = new THREE.BufferGeometry();
  const starPositions = new Float32Array(CONFIG.starCount * 3);
  const starColors = new Float32Array(CONFIG.starCount * 3);

  const starPalette = [
    new THREE.Color(0xaae7ff), // Cyan-tinted hot star
    new THREE.Color(0xffffff), // White star
    new THREE.Color(0x76b6ff), // Blue giant
    new THREE.Color(0xd0eaff)  // Pale electric
  ];

  for (let i = 0; i < CONFIG.starCount; i++) {
    // Distribute on large outer celestial sphere
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 800 + Math.random() * 400;

    starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);

    const color = starPalette[Math.floor(Math.random() * starPalette.length)];
    starColors[i * 3 + 0] = color.r;
    starColors[i * 3 + 1] = color.g;
    starColors[i * 3 + 2] = color.b;
  }

  starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  });

  return new THREE.Points(starGeom, starMat);
}
const starfield = createStarfield();
scene.add(starfield);

// Interstellar floating micro-dust (provides immediate parallax in VR)
function createFloatingDust() {
  const dustGeom = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(CONFIG.dustCount * 3);

  for (let i = 0; i < CONFIG.dustCount; i++) {
    dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 120;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    dustPositions[i * 3 + 2] = CONFIG.wormholeDistance - 40 + (Math.random() - 0.5) * 100;
  }

  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

  const dustMat = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 1.2,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(dustGeom, dustMat);
}
const floatingDust = createFloatingDust();
scene.add(floatingDust);

// =============================================================================
// CUSTOM POST-PROCESSING PIPELINE: GLOW & BLOOM SHADERS
// =============================================================================
let renderTargetA, renderTargetB, sceneRenderTarget;

function initPostProcessing() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio, 2.0);

  const rtOptions = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType
  };

  // Full scene beauty buffer
  sceneRenderTarget = new THREE.WebGLRenderTarget(w * dpr, h * dpr, rtOptions);

  // Half-resolution blur buffers for optimal bloom performance
  renderTargetA = new THREE.WebGLRenderTarget(w * 0.5, h * 0.5, rtOptions);
  renderTargetB = new THREE.WebGLRenderTarget(w * 0.5, h * 0.5, rtOptions);
}
initPostProcessing();

// Fullscreen Quad Utility
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeom = new THREE.PlaneGeometry(2, 2);

// 1. High-Pass Luminance Extraction Shader
const highPassShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uThreshold;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      // Perceptual brightness with extra weight on cyan/blue channels
      float luma = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
      
      // Isolate bright neon cyan components
      float factor = clamp((luma - uThreshold) / (1.0 - uThreshold), 0.0, 1.0);
      gl_FragColor = vec4(texel.rgb * factor, 1.0);
    }
  `,
  uniforms: {
    tDiffuse: { value: null },
    uThreshold: { value: CONFIG.bloomThreshold }
  }
};
const highPassMaterial = new THREE.ShaderMaterial(highPassShader);
const highPassQuad = new THREE.Mesh(quadGeom, highPassMaterial);

// 2. Separable Gaussian / Kawase Blur Shader
const blurShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uDirection;
    uniform vec2 uResolution;
    uniform float uRadius;
    varying vec2 vUv;

    void main() {
      vec2 off = (uDirection * uRadius) / uResolution;
      vec4 sum = vec4(0.0);

      // 9-tap Gaussian distribution
      sum += texture2D(tDiffuse, vUv - 4.0 * off) * 0.051;
      sum += texture2D(tDiffuse, vUv - 3.0 * off) * 0.0918;
      sum += texture2D(tDiffuse, vUv - 2.0 * off) * 0.12245;
      sum += texture2D(tDiffuse, vUv - 1.0 * off) * 0.1531;
      sum += texture2D(tDiffuse, vUv)             * 0.1633;
      sum += texture2D(tDiffuse, vUv + 1.0 * off) * 0.1531;
      sum += texture2D(tDiffuse, vUv + 2.0 * off) * 0.12245;
      sum += texture2D(tDiffuse, vUv + 3.0 * off) * 0.0918;
      sum += texture2D(tDiffuse, vUv + 4.0 * off) * 0.051;

      gl_FragColor = sum;
    }
  `,
  uniforms: {
    tDiffuse: { value: null },
    uDirection: { value: new THREE.Vector2(1.0, 0.0) },
    uResolution: { value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5) },
    uRadius: { value: CONFIG.bloomRadius }
  }
};
const blurMaterial = new THREE.ShaderMaterial(blurShader);
const blurQuad = new THREE.Mesh(quadGeom, blurMaterial);

// 3. Composite Shader: Additive Blend + Tone Mapping + Chromatic Aberration + Vignette
const compositeShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tScene;
    uniform sampler2D tBloom;
    uniform float uBloomStrength;
    uniform float uChromaticAberration;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      vec2 dir = uv - center;
      float dist = length(dir);

      // Chromatic Aberration (RGB shift radiating outward from center)
      vec2 redUv   = uv + dir * (uChromaticAberration * dist);
      vec2 greenUv = uv;
      vec2 blueUv  = uv - dir * (uChromaticAberration * dist);

      vec3 sceneColor;
      sceneColor.r = texture2D(tScene, redUv).r;
      sceneColor.g = texture2D(tScene, greenUv).g;
      sceneColor.b = texture2D(tScene, blueUv).b;

      vec3 bloomColor = texture2D(tBloom, uv).rgb * uBloomStrength;

      // Additive Glow
      vec3 finalColor = sceneColor + bloomColor;

      // Cinematic Vignette
      float vignette = smoothstep(1.2, 0.35, dist);
      finalColor *= vignette;

      // Subtle Sci-Fi CRT scanline texture
      float scanline = sin(uv.y * 800.0) * 0.02;
      finalColor -= scanline;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  uniforms: {
    tScene: { value: null },
    tBloom: { value: null },
    uBloomStrength: { value: CONFIG.bloomStrength },
    uChromaticAberration: { value: CONFIG.chromaticAberration }
  }
};
const compositeMaterial = new THREE.ShaderMaterial(compositeShader);
const compositeQuad = new THREE.Mesh(quadGeom, compositeMaterial);

const postScene = new THREE.Scene();

// =============================================================================
// PROCEDURAL SCI-FI AUDIO SYNTHESIZER (WEB AUDIO API)
// =============================================================================
let audioCtx = null;
let spaceDroneGain = null;
let tachyonOscillator = null;

function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Deep cosmic rumble (binaural low frequency drone)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    spaceDroneGain = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, audioCtx.currentTime); // 55Hz (A1)

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(57.5, audioCtx.currentTime); // 2.5Hz beat frequency

    // Low pass filter to remove harshness
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, audioCtx.currentTime);

    // High frequency shimmering tachyon pulse
    tachyonOscillator = audioCtx.createOscillator();
    const tachyonGain = audioCtx.createGain();
    tachyonOscillator.type = 'sine';
    tachyonOscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    tachyonGain.gain.setValueAtTime(0.02, audioCtx.currentTime);

    spaceDroneGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(spaceDroneGain);
    spaceDroneGain.connect(audioCtx.destination);

    tachyonOscillator.connect(tachyonGain);
    tachyonGain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    tachyonOscillator.start();

    CONFIG.audioMuted = false;
    updateAudioBtn();
  } catch (err) {
    console.warn('[Audio] Web Audio initialization deferred:', err);
  }
}

function toggleAudio() {
  if (!audioCtx) {
    initAudio();
    return;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    CONFIG.audioMuted = false;
  } else if (audioCtx.state === 'running') {
    if (CONFIG.audioMuted) {
      spaceDroneGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      CONFIG.audioMuted = false;
    } else {
      spaceDroneGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
      CONFIG.audioMuted = true;
    }
  }
  updateAudioBtn();
}

function updateAudioBtn() {
  const btn = document.getElementById('btn-toggle-audio');
  if (btn) {
    btn.innerHTML = CONFIG.audioMuted
      ? '<span class="icon">🔇</span> Synth Audio: OFF'
      : '<span class="icon">🔊</span> Synth Audio: ON';
    btn.classList.toggle('active', !CONFIG.audioMuted);
  }
}

// =============================================================================
// UI HUD & INTERACTIVE CONTROLS
// =============================================================================
const hudStatusEl = document.getElementById('hud-status');
const hudDistEl = document.getElementById('hud-distance');
const hudFluxEl = document.getElementById('hud-flux');
const hudFpsEl = document.getElementById('hud-fps');
const warpBtn = document.getElementById('btn-warp');
const bloomSlider = document.getElementById('slider-bloom');
const bloomValDisplay = document.getElementById('val-bloom');
const hudPanel = document.getElementById('hud-panel');

if (warpBtn) {
  warpBtn.addEventListener('click', () => {
    state.isWarping = !state.isWarping;
    warpBtn.classList.toggle('active', state.isWarping);
    warpBtn.textContent = state.isWarping ? 'WARP DRIVE: ENGAGED' : 'ENGAGE WARP DRIVE';
    if (!audioCtx) initAudio();
  });
}

if (bloomSlider) {
  bloomSlider.addEventListener('input', (e) => {
    CONFIG.bloomStrength = parseFloat(e.target.value);
    compositeShader.uniforms.uBloomStrength.value = CONFIG.bloomStrength;
    if (bloomValDisplay) bloomValDisplay.textContent = CONFIG.bloomStrength.toFixed(2);
  });
}

const toggleAudioBtn = document.getElementById('btn-toggle-audio');
if (toggleAudioBtn) {
  toggleAudioBtn.addEventListener('click', toggleAudio);
}

const toggleHudBtn = document.getElementById('btn-toggle-hud');
if (toggleHudBtn) {
  toggleHudBtn.addEventListener('click', () => {
    state.hudVisible = !state.hudVisible;
    if (hudPanel) hudPanel.style.display = state.hudVisible ? 'flex' : 'none';
  });
}

// =============================================================================
// ANIMATION & RENDER PIPELINE
// =============================================================================
function renderPostProcessing() {
  // 1. Render Scene into beauty HDR target
  renderer.setRenderTarget(sceneRenderTarget);
  renderer.render(scene, camera);

  // 2. High-pass filter pass: Scene -> renderTargetA
  highPassMaterial.uniforms.tDiffuse.value = sceneRenderTarget.texture;
  highPassMaterial.uniforms.uThreshold.value = CONFIG.bloomThreshold;
  postScene.clear();
  postScene.add(highPassQuad);
  renderer.setRenderTarget(renderTargetA);
  renderer.render(postScene, postCamera);

  // 3. Separable Horizontal Blur: renderTargetA -> renderTargetB
  blurMaterial.uniforms.tDiffuse.value = renderTargetA.texture;
  blurMaterial.uniforms.uDirection.value.set(1.0, 0.0);
  blurMaterial.uniforms.uRadius.value = CONFIG.bloomRadius;
  postScene.clear();
  postScene.add(blurQuad);
  renderer.setRenderTarget(renderTargetB);
  renderer.render(postScene, postCamera);

  // 4. Separable Vertical Blur: renderTargetB -> renderTargetA
  blurMaterial.uniforms.tDiffuse.value = renderTargetB.texture;
  blurMaterial.uniforms.uDirection.value.set(0.0, 1.0);
  blurMaterial.uniforms.uRadius.value = CONFIG.bloomRadius;
  renderer.setRenderTarget(renderTargetA);
  renderer.render(postScene, postCamera);

  // 5. Final Composite Pass to Screen: Scene + Bloom + Aberration
  compositeMaterial.uniforms.tScene.value = sceneRenderTarget.texture;
  compositeMaterial.uniforms.tBloom.value = renderTargetA.texture;
  compositeMaterial.uniforms.uBloomStrength.value = CONFIG.bloomStrength;
  compositeMaterial.uniforms.uChromaticAberration.value = CONFIG.chromaticAberration;
  postScene.clear();
  postScene.add(compositeQuad);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCamera);
}

// Main Render Loop (WebXR Compatible)
renderer.setAnimationLoop((timestamp) => {
  const delta = (timestamp - state.lastFrameTime) * 0.001;
  state.lastFrameTime = timestamp;
  state.time += delta;

  // FPS calculation
  state.frameCount++;
  if (timestamp - state.lastFpsUpdate >= 500) {
    state.fps = Math.round((state.frameCount * 1000) / (timestamp - state.lastFpsUpdate));
    state.frameCount = 0;
    state.lastFpsUpdate = timestamp;
    if (hudFpsEl) hudFpsEl.textContent = `${state.fps} FPS`;
  }

  // Update Shader Uniforms
  accretionUniforms.uTime.value = state.time;
  secondaryDiskMaterial.uniforms.uTime.value = state.time;
  photonRingUniforms.uTime.value = state.time;
  particleMaterial.uniforms.uTime.value = state.time;

  // Expanding Gravitational Shockwaves
  for (let i = 0; i < shockwaves.length; i++) {
    const sw = shockwaves[i];
    let prog = sw.mesh.material.uniforms.uProgress.value + delta * sw.speed;
    if (prog > 1.0) prog = 0.22;
    sw.mesh.material.uniforms.uProgress.value = prog;
  }

  // Subtle slow celestial drift
  starfield.rotation.y = state.time * 0.003;
  floatingDust.rotation.y = state.time * 0.008;

  // Warp Cruise Simulation
  if (state.isWarping) {
    CONFIG.warpSpeed = THREE.MathUtils.lerp(CONFIG.warpSpeed, CONFIG.maxWarpSpeed, 0.04);
    camera.position.z -= CONFIG.warpSpeed * delta * 5.0;
    if (camera.position.z < 28.0) {
      camera.position.z = 28.0; // Orbit boundary near event horizon
    }
  } else {
    CONFIG.warpSpeed = THREE.MathUtils.lerp(CONFIG.warpSpeed, 0.0, 0.06);
  }

  // Update HUD telemetry
  const currentDistKm = Math.round(camera.position.distanceTo(horizonMesh.position) * 420);
  if (hudDistEl) hudDistEl.textContent = `${currentDistKm.toLocaleString()} KM`;
  if (hudFluxEl) {
    const flux = (14.2 + Math.sin(state.time * 4.0) * 1.8 + (CONFIG.warpSpeed * 2.5)).toFixed(1);
    hudFluxEl.textContent = `${flux} TeV`;
  }

  // Audio modulation based on distance to wormhole
  if (tachyonOscillator && !CONFIG.audioMuted) {
    const proximity = 1.0 - Math.min(1.0, currentDistKm / 90000);
    tachyonOscillator.frequency.setValueAtTime(440 + proximity * 380, audioCtx.currentTime);
  }

  // Update controls when not presenting in VR
  if (!state.isXR) {
    controls.update();
  }

  // Render Path Selection:
  // When in WebXR presentation, Three.js renders stereoscopically directly to the headset framebuffer.
  // When on desktop/mobile 2D screen, execute the custom multi-pass glow/bloom pipeline.
  if (state.isXR || !state.postProcessingEnabled) {
    renderer.render(scene, camera);
  } else {
    renderPostProcessing();
  }
});

// =============================================================================
// WINDOW RESIZE HANDLER
// =============================================================================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio, 2.0);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  renderer.setPixelRatio(dpr);

  // Resize Render Targets
  sceneRenderTarget.setSize(w * dpr, h * dpr);
  renderTargetA.setSize(w * 0.5, h * 0.5);
  renderTargetB.setSize(w * 0.5, h * 0.5);

  blurShader.uniforms.uResolution.value.set(w * 0.5, h * 0.5);
});
