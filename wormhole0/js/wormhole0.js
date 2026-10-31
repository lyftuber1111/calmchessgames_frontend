/**
 * Wormhole XR - Stage 1: The Distant Neon Cyan Wormhole
 * Multi-Platform XR Experience with Hardware Validation Telemetry,
 * Closeable Incompatibility Badge, Mode Switcher, Game Controller Support,
 * and Collapsible Left-Hand Objectives Drawer.
 * 
 * Calm Chess Games / Brian Berry (C) 2026
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
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
  lensingStrength: 1.0,
  chromaticAberration: 0.0035,
  audioMuted: false,
  flightSpeed: 45.0,
  boostMultiplier: 2.2,
  pitchSpeed: 0.0022,
  yawSpeed: 0.0022,
  gamepadDeadzone: 0.14
};

// Application & Flight state
const state = {
  time: 0,
  lastFrameTime: performance.now(),
  fps: 60,
  frameCount: 0,
  lastFpsUpdate: performance.now(),
  isXR: false,
  xrMode: 'desktop-xr', // 'desktop-xr', 'desktop-vr', 'mobile-xr', 'mobile-ar'
  hudVisible: true,
  postProcessingEnabled: true,
  
  // Drawer state
  isDrawerPinned: false,
  isDrawerAutoHide: true,
  
  // Player Position & Dynamics
  position: new THREE.Vector3(0, 2.5, CONFIG.wormholeDistance),
  velocity: new THREE.Vector3(0, 0, 0),
  pitch: 0,
  yaw: 0,
  isPointerLocked: false,
  isMouseDown: false,
  lastMouseX: 0,
  lastMouseY: 0,
  
  // Virtual Touch Joystick input
  touchMove: { x: 0, y: 0 },
  touchActive: false,
  
  // Gamepad State
  gamepadIndex: null,
  gamepadMode: 'auto', // 'auto', 'enabled', 'disabled'
  lastPadButtons: {},
  
  // Mission Objectives State
  scanProgress: 0.0,
  isScanning: false,
  coils: [false, false, false],
  isVectorAligned: false,
  isInRange: false,
  isWarpReady: false,
  isHyperWarping: false,
  warpJumpTimer: 0.0,

  // Hardware Diagnostics & Mode Recommendation
  pendingRecommendedMode: 'desktop-xr'
};

const keys = {};

// Hardware Diagnostics Cache
const detectedHardware = {
  name: 'Desktop PC / Mac',
  type: 'desktop',
  os: 'Windows 11',
  browser: 'Google Chrome',
  gpu: 'Generic Hardware Accelerator',
  vrSupported: false,
  arSupported: false
};

// =============================================================================
// THREE.JS CORE SCENE INITIALIZATION
// =============================================================================
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x01050a, 0.0016);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2500);
camera.position.copy(state.position);

const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance',
  antialias: false,
  alpha: true,
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

renderer.xr.addEventListener('sessionstart', () => {
  state.isXR = true;
  document.body.classList.add('in-xr-session');
  console.log('[Wormhole XR] WebXR session started.');
  showToast('XR IMMERSIVE SESSION ACTIVE');
});
renderer.xr.addEventListener('sessionend', () => {
  state.isXR = false;
  document.body.classList.remove('in-xr-session');
  console.log('[Wormhole XR] WebXR session exited.');
});

// XR Hand Controllers
const controllerModelFactory = new XRControllerModelFactory();
const controllers = [];
for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  scene.add(controller);
  
  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  const laserGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -5)
  ]);
  const laserMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const laser = new THREE.Line(laserGeom, laserMat);
  controller.add(laser);
  controllers.push(controller);
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x02111c, 0.4);
scene.add(ambientLight);

const wormholeCoreLight = new THREE.PointLight(0x00f0ff, 4.5, 500, 1.2);
wormholeCoreLight.position.set(0, 0, 0);
scene.add(wormholeCoreLight);

const secondaryLight = new THREE.PointLight(0x0066aa, 2.5, 300, 1.5);
secondaryLight.position.set(0, 0, -20);
scene.add(secondaryLight);

// =============================================================================
// CUSTOM GLSL SHADERS - ACCRETION DISK & EVENT HORIZON
// =============================================================================

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
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float angle = atan(p.y, p.x);

    if (r < 0.22 || r > 0.98) {
      discard;
    }

    float spiral = angle * 2.0 + 8.0 * log(r + 0.001) - uTime * uSpeed;
    vec2 uvSwirl = vec2(cos(spiral) * r, sin(spiral) * r) * uNoiseScale;

    float n1 = fbm(uvSwirl + vec2(uTime * 0.15, -uTime * 0.25));
    float n2 = fbm(uvSwirl * 2.0 - vec2(-uTime * 0.2, uTime * 0.1));
    float plasma = clamp(n1 * 0.6 + n2 * 0.4 + 0.5, 0.0, 1.0);

    float doppler = 1.0 + 0.45 * sin(angle + 0.8);
    float innerEdge = smoothstep(0.22, 0.35, r);
    float outerEdge = smoothstep(0.98, 0.65, r);
    float radialIntensity = innerEdge * outerEdge;

    float photonRing = exp(-pow((r - 0.26) * 22.0, 2.0)) * 2.8;

    vec3 baseColor = mix(uColorEdge, uColorCore, pow(plasma, 1.8));
    baseColor = mix(baseColor, uColorHot, photonRing * 0.85);

    vec3 finalColor = baseColor * (radialIntensity * 2.4 + photonRing * 3.5) * doppler;
    float alpha = radialIntensity * (0.65 + plasma * 0.35);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const accretionUniforms = {
  uTime: { value: 0 },
  uSpeed: { value: CONFIG.rotationSpeed },
  uNoiseScale: { value: 3.2 },
  uColorEdge: { value: new THREE.Color(0x003366) },
  uColorCore: { value: new THREE.Color(0x00f0ff) },
  uColorHot: { value: new THREE.Color(0xd6ffff) }
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

const diskGeom = new THREE.RingGeometry(
  CONFIG.eventHorizonRadius * 0.85,
  CONFIG.accretionDiskRadius,
  96,
  16
);
const accretionDiskMesh = new THREE.Mesh(diskGeom, accretionDiskMaterial);
accretionDiskMesh.rotation.x = Math.PI / 2.3;
scene.add(accretionDiskMesh);

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

// Event Horizon Singularity Core
const horizonGeom = new THREE.SphereGeometry(CONFIG.eventHorizonRadius, 64, 64);
const horizonMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  reflectivity: 0.0,
  roughness: 1.0
});
const horizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
scene.add(horizonMesh);

// Photon Ring Halo Shader
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

    float fresnel = 1.0 - abs(dot(normal, viewDir));
    fresnel = pow(fresnel, 2.5);

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

// Gravitational Expanding Shockwaves
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

// Particle Vortex System
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(CONFIG.particleCount * 3);
const particleColors = new Float32Array(CONFIG.particleCount * 3);
const particleParams = new Float32Array(CONFIG.particleCount * 4);

const baseCyan = new THREE.Color(0x00f0ff);
const deepCyan = new THREE.Color(0x0077aa);
const brightWhite = new THREE.Color(0xf0ffff);

for (let i = 0; i < CONFIG.particleCount; i++) {
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

const particleVertexShader = `
  attribute vec4 params;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    float radius = params.x;
    float baseAngle = params.y;
    float speed = params.z;
    float height = params.w;

    float currentAngle = baseAngle + uTime * speed;
    float drop = -exp(-pow((radius - 7.5) * 0.35, 2.0)) * 6.0;

    vec3 pos = vec3(
      cos(currentAngle) * radius,
      height + drop,
      sin(currentAngle) * radius
    );

    float tiltX = 1.365;
    float cosT = cos(tiltX);
    float sinT = sin(tiltX);
    vec3 tiltedPos = vec3(
      pos.x,
      pos.y * cosT - pos.z * sinT,
      pos.y * sinT + pos.z * cosT
    );

    vec4 mvPosition = modelViewMatrix * vec4(tiltedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (24.0 / -mvPosition.z) * (1.2 + sin(uTime * 4.0 + baseAngle) * 0.4);
    vAlpha = smoothstep(50.0, 35.0, radius) * 0.95;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
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
  uniforms: { uTime: { value: 0 } },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexColors: true
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// Starfield & Interstellar Dust
function createStarfield() {
  const starGeom = new THREE.BufferGeometry();
  const starPositions = new Float32Array(CONFIG.starCount * 3);
  const starColors = new Float32Array(CONFIG.starCount * 3);

  const starPalette = [
    new THREE.Color(0xaae7ff),
    new THREE.Color(0xffffff),
    new THREE.Color(0x76b6ff),
    new THREE.Color(0xd0eaff)
  ];

  for (let i = 0; i < CONFIG.starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 900 + Math.random() * 400;

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

function createFloatingDust() {
  const dustGeom = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(CONFIG.dustCount * 3);

  for (let i = 0; i < CONFIG.dustCount; i++) {
    dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 160;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 300;
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
// CUSTOM POST-PROCESSING PIPELINE: BLOOM & REAL-TIME GRAVITATIONAL LENSING
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

  sceneRenderTarget = new THREE.WebGLRenderTarget(w * dpr, h * dpr, rtOptions);
  renderTargetA = new THREE.WebGLRenderTarget(w * 0.5, h * 0.5, rtOptions);
  renderTargetB = new THREE.WebGLRenderTarget(w * 0.5, h * 0.5, rtOptions);
}
initPostProcessing();

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
      float luma = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
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

// 2. Separable Blur Shader
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

// 3. Composite Shader: Real-Time Gravitational Lensing + Bloom + Chromatic Aberration
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
    uniform vec2 uWormholeScreenPos;
    uniform float uLensingStrength;
    uniform float uAspect;
    uniform float uIsBehind;

    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      vec2 lensedUv = uv;
      if (uIsBehind < 0.5 && uLensingStrength > 0.01) {
        vec2 d = uv - uWormholeScreenPos;
        d.x *= uAspect;
        float r = length(d);

        float rE = 0.075 * uLensingStrength;
        if (r > 0.008 && r < 0.45) {
          float deflection = (rE * rE) / (r + 0.015);
          vec2 offset = normalize(d) * deflection;
          offset.x /= uAspect;
          lensedUv = clamp(uv - offset, 0.0, 1.0);
        }
      }

      vec2 center = vec2(0.5);
      vec2 dir = lensedUv - center;
      float dist = length(dir);

      vec2 redUv   = lensedUv + dir * (uChromaticAberration * dist);
      vec2 greenUv = lensedUv;
      vec2 blueUv  = lensedUv - dir * (uChromaticAberration * dist);

      vec3 sceneColor;
      sceneColor.r = texture2D(tScene, redUv).r;
      sceneColor.g = texture2D(tScene, greenUv).g;
      sceneColor.b = texture2D(tScene, blueUv).b;

      vec3 bloomColor = texture2D(tBloom, lensedUv).rgb * uBloomStrength;
      vec3 finalColor = sceneColor + bloomColor;

      float vignette = smoothstep(1.3, 0.4, dist);
      finalColor *= vignette;

      float scanline = sin(uv.y * 900.0) * 0.018;
      finalColor -= scanline;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  uniforms: {
    tScene: { value: null },
    tBloom: { value: null },
    uBloomStrength: { value: CONFIG.bloomStrength },
    uChromaticAberration: { value: CONFIG.chromaticAberration },
    uWormholeScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    uLensingStrength: { value: CONFIG.lensingStrength },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uIsBehind: { value: 0.0 }
  }
};
const compositeMaterial = new THREE.ShaderMaterial(compositeShader);
const compositeQuad = new THREE.Mesh(quadGeom, compositeMaterial);
const postScene = new THREE.Scene();

// =============================================================================
// AUDIO ENGINE (.WAV FILES + WEB AUDIO API SYNTHESIZER FALLBACK)
// =============================================================================
class AudioManager {
  constructor() {
    this.ctx = null;
    this.droneAudio = null;
    this.warpAudio = null;
    this.scanAudio = null;
    this.coilAudio = null;
    this.isInitialized = false;
    this.synthOsc = null;
    this.synthGain = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.droneAudio = new Audio('audio/wormhole_drone.wav');
      this.droneAudio.loop = true;
      this.droneAudio.volume = 0.55;

      this.warpAudio = new Audio('audio/warp_engage.wav');
      this.warpAudio.volume = 0.85;

      this.scanAudio = new Audio('audio/scanner_ping.wav');
      this.scanAudio.volume = 0.7;

      this.coilAudio = new Audio('audio/coil_calibrate.wav');
      this.coilAudio.volume = 0.75;

      this.synthOsc = this.ctx.createOscillator();
      this.synthGain = this.ctx.createGain();
      this.synthOsc.type = 'sawtooth';
      this.synthOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.synthGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.synthOsc.connect(filter);
      filter.connect(this.synthGain);
      this.synthGain.connect(this.ctx.destination);
      this.synthOsc.start();

      this.isInitialized = true;
      if (!CONFIG.audioMuted) {
        this.playDrone();
      }
    } catch (e) {
      console.warn('[Audio] Audio initialization error:', e);
    }
  }

  playDrone() {
    if (this.droneAudio && !CONFIG.audioMuted) {
      this.droneAudio.play().catch(() => {
        if (this.synthGain) this.synthGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      });
    }
  }

  stopDrone() {
    if (this.droneAudio) this.droneAudio.pause();
    if (this.synthGain && this.ctx) this.synthGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
  }

  playWarp() {
    if (CONFIG.audioMuted) return;
    if (this.warpAudio) {
      this.warpAudio.currentTime = 0;
      this.warpAudio.play().catch(e => console.warn(e));
    }
  }

  playScan() {
    if (CONFIG.audioMuted) return;
    if (this.scanAudio) {
      this.scanAudio.currentTime = 0;
      this.scanAudio.play().catch(e => console.warn(e));
    }
  }

  playCoil() {
    if (CONFIG.audioMuted) return;
    if (this.coilAudio) {
      this.coilAudio.currentTime = 0;
      this.coilAudio.play().catch(e => console.warn(e));
    }
  }

  updateProximity(distKm) {
    if (!this.droneAudio || CONFIG.audioMuted) return;
    const norm = Math.max(0.0, Math.min(1.0, 1.0 - (distKm / 90000)));
    this.droneAudio.volume = 0.35 + norm * 0.45;
  }
}

const audioMgr = new AudioManager();

// =============================================================================
// COLLAPSIBLE LEFT DRAWER (HOVER, PIN & AUTO-HIDE CONTROLS)
// =============================================================================
const leftDrawer = document.getElementById('left-drawer-container');
const drawerTab = document.getElementById('drawer-tab');
const chkAutoHide = document.getElementById('chk-autohide');
const btnToggleDrawer = document.getElementById('btn-toggle-drawer');

function toggleDrawerPin() {
  state.isDrawerPinned = !state.isDrawerPinned;
  if (leftDrawer) {
    leftDrawer.classList.toggle('pinned', state.isDrawerPinned);
  }
  if (btnToggleDrawer) {
    btnToggleDrawer.classList.toggle('active', state.isDrawerPinned);
  }
}

if (drawerTab) {
  drawerTab.addEventListener('click', toggleDrawerPin);
}

if (btnToggleDrawer) {
  btnToggleDrawer.addEventListener('click', toggleDrawerPin);
}

if (chkAutoHide) {
  chkAutoHide.addEventListener('change', (e) => {
    state.isDrawerAutoHide = e.target.checked;
    if (!state.isDrawerAutoHide) {
      state.isDrawerPinned = true;
      if (leftDrawer) leftDrawer.classList.add('pinned');
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Tab' || e.code === 'KeyM') {
    e.preventDefault();
    toggleDrawerPin();
  }
});

// =============================================================================
// HARDWARE DETECTION & UNSUPPORTED DEVICE MODAL / BADGE
// =============================================================================
const modalOverlay = document.getElementById('unsupported-device-modal');
const modalModeName = document.getElementById('modal-mode-name');
const modalSupportFlag = document.getElementById('modal-support-flag');
const modalReasonText = document.getElementById('modal-reason-text');
const specDevName = document.getElementById('spec-device-name');
const specOs = document.getElementById('spec-os-platform');
const specBrowser = document.getElementById('spec-browser');
const specGpu = document.getElementById('spec-gpu');
const specVrStatus = document.getElementById('spec-vr-status');
const specArStatus = document.getElementById('spec-ar-status');
const modalRecText = document.getElementById('modal-recommendation-text');

const btnCloseModal = document.getElementById('btn-close-device-modal');
const btnDismissModal = document.getElementById('btn-dismiss-modal');
const btnSwitchRec = document.getElementById('btn-switch-recommended');
const btnForceContinue = document.getElementById('btn-force-continue');

async function detectHardwareDiagnostics() {
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      detectedHardware.gpu = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    }

    const ua = navigator.userAgent;
    if (/Quest|Oculus/i.test(ua)) {
      detectedHardware.type = 'vr_hmd';
      detectedHardware.name = 'Meta Quest VR Headset';
      detectedHardware.os = 'Meta Horizon OS';
    } else if (/Vision/i.test(ua)) {
      detectedHardware.type = 'vr_hmd';
      detectedHardware.name = 'Apple Vision Pro';
      detectedHardware.os = 'visionOS';
    } else if (/Mobi|Android/i.test(ua)) {
      detectedHardware.type = 'mobile';
      detectedHardware.name = 'Android Smartphone';
      detectedHardware.os = 'Android';
      if (/Pixel/i.test(ua)) detectedHardware.name = 'Google Pixel';
      else if (/Samsung|SM-/i.test(ua)) detectedHardware.name = 'Samsung Galaxy';
    } else if (/iPhone|iPad/i.test(ua)) {
      detectedHardware.type = /iPad/i.test(ua) ? 'tablet' : 'mobile';
      detectedHardware.name = /iPad/i.test(ua) ? 'Apple iPad' : 'Apple iPhone';
      detectedHardware.os = 'iOS';
    } else {
      detectedHardware.type = 'desktop';
      detectedHardware.name = 'Desktop PC / Workstation';
      if (/Windows/i.test(ua)) detectedHardware.os = 'Windows 10/11';
      else if (/Macintosh/i.test(ua)) detectedHardware.os = 'macOS';
      else if (/Linux/i.test(ua)) detectedHardware.os = 'Linux';
    }

    if (/Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) detectedHardware.browser = 'Google Chrome';
    else if (/Edg/i.test(ua)) detectedHardware.browser = 'Microsoft Edge';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) detectedHardware.browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) detectedHardware.browser = 'Mozilla Firefox';

    if (navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
      detectedHardware.vrSupported = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
      detectedHardware.arSupported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
    }
  } catch (err) {
    console.warn('[Hardware Detection] Detection warning:', err);
  }
}

function showUnsupportedBadge(mode, reason, recommendedMode = 'desktop-xr') {
  state.pendingRecommendedMode = recommendedMode;

  const modeTitles = {
    'desktop-xr': 'DESKTOP XR (6-DOF FLIGHT)',
    'desktop-vr': 'DESKTOP VR (PCVR / HMD)',
    'mobile-xr': 'MOBILE XR (WebXR / VR VIEWER)',
    'mobile-ar': 'MOBILE AR (ARCore CAMERA PASSTHROUGH)'
  };

  if (modalModeName) modalModeName.textContent = modeTitles[mode] || mode.toUpperCase();
  if (modalSupportFlag) modalSupportFlag.textContent = 'INCOMPATIBLE / NOT SUPPORTED';
  if (modalReasonText) modalReasonText.textContent = reason || 'Hardware or browser capabilities do not meet the minimum requirements for this operating mode.';

  if (specDevName) specDevName.textContent = detectedHardware.name;
  if (specOs) specOs.textContent = detectedHardware.os;
  if (specBrowser) specBrowser.textContent = detectedHardware.browser;
  if (specGpu) specGpu.textContent = detectedHardware.gpu;
  if (specVrStatus) {
    specVrStatus.textContent = detectedHardware.vrSupported ? '✓ SUPPORTED' : '✗ UNSUPPORTED';
    specVrStatus.style.color = detectedHardware.vrSupported ? 'var(--accent-green)' : 'var(--accent-alert)';
  }
  if (specArStatus) {
    specArStatus.textContent = detectedHardware.arSupported ? '✓ SUPPORTED' : '✗ UNSUPPORTED';
    specArStatus.style.color = detectedHardware.arSupported ? 'var(--accent-green)' : 'var(--accent-alert)';
  }

  if (modalRecText) {
    const recName = modeTitles[recommendedMode] || recommendedMode.toUpperCase();
    modalRecText.textContent = `Switch to ${recName}. This mode is fully accelerated and validated for your hardware profile.`;
  }

  if (modalOverlay) modalOverlay.style.display = 'flex';
}

function hideUnsupportedBadge() {
  if (modalOverlay) modalOverlay.style.display = 'none';
}

if (btnCloseModal) btnCloseModal.addEventListener('click', hideUnsupportedBadge);
if (btnDismissModal) btnDismissModal.addEventListener('click', hideUnsupportedBadge);

if (btnSwitchRec) {
  btnSwitchRec.addEventListener('click', () => {
    hideUnsupportedBadge();
    const sel = document.getElementById('select-mode');
    if (sel) {
      sel.value = state.pendingRecommendedMode;
      handleModeChange(state.pendingRecommendedMode, true);
    }
  });
}

if (btnForceContinue) {
  btnForceContinue.addEventListener('click', () => {
    hideUnsupportedBadge();
    activateModeParameters(state.xrMode);
    showToast(`FORCING MODE: ${state.xrMode.toUpperCase()}`);
  });
}

// =============================================================================
// MULTI-PLATFORM & XR MODE SWITCHER
// =============================================================================
const selectModeEl = document.getElementById('select-mode');
if (selectModeEl) {
  selectModeEl.addEventListener('change', (e) => {
    state.xrMode = e.target.value;
    handleModeChange(state.xrMode);
  });
}

async function handleModeChange(mode, bypassCheck = false) {
  console.log(`[Wormhole XR] Testing device compatibility for: ${mode}`);
  await detectHardwareDiagnostics();

  if (!bypassCheck) {
    const payload = {
      mode: mode,
      device_name: detectedHardware.name,
      device_type: detectedHardware.type,
      os_platform: detectedHardware.os,
      browser: detectedHardware.browser,
      gpu_renderer: detectedHardware.gpu,
      immersive_vr: detectedHardware.vrSupported,
      immersive_ar: detectedHardware.arSupported,
      has_touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
      has_gamepad: (typeof navigator.getGamepads === 'function')
    };

    let checkResult = null;
    const checkEndpoints = [
      '../wormhole_device_api.php?action=check',
      '/wormhole_device_api.php?action=check',
      'https://api.calmchessgames.com/wormhole_device_api.php?action=check',
      'wormhole_device_api.php?action=check'
    ];
    for (const ep of checkEndpoints) {
      try {
        const r = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (r && r.ok) {
          checkResult = await r.json().catch(() => null);
          if (checkResult) break;
        }
      } catch (e) {
        // try next endpoint
      }
    }

    if (checkResult && checkResult.supported === false) {
      showUnsupportedBadge(mode, checkResult.reason, checkResult.recommended_mode || 'desktop-xr');
      return;
    } else if (checkResult && checkResult.supported === true) {
      hideUnsupportedBadge();
    } else {
      // Local hardware capability check fallback when API is offline
      if (mode === 'desktop-vr' && !detectedHardware.vrSupported) {
        showUnsupportedBadge(mode, "Hardware / Browser does not support WebXR 'immersive-vr' session. Connect an OpenXR/PCVR headset.", 'desktop-xr');
        return;
      } else if (mode === 'mobile-ar' && !detectedHardware.arSupported) {
        showUnsupportedBadge(mode, "Hardware / Browser does not support WebXR 'immersive-ar' (ARCore / ARKit session).", 'desktop-xr');
        return;
      } else {
        hideUnsupportedBadge();
      }
    }
  }

  activateModeParameters(mode);
}

function activateModeParameters(mode) {
  if (mode === 'desktop-xr') {
    state.postProcessingEnabled = true;
    scene.background = null;
    showToast('MODE: DESKTOP XR (6-DOF FLIGHT & CUSTOM SHADERS)');
  } else if (mode === 'desktop-vr') {
    state.postProcessingEnabled = false;
    showToast('MODE: DESKTOP VR (CLICK ENTER VR FOR HMD)');
  } else if (mode === 'mobile-xr') {
    state.postProcessingEnabled = false;
    requestDeviceOrientation();
    showToast('MODE: MOBILE XR (ROTATE LANDSCAPE FOR DUAL-STICK TOUCH)');
  } else if (mode === 'mobile-ar') {
    state.postProcessingEnabled = false;
    scene.background = null;
    showToast('MODE: MOBILE AR (ARCORE PASSTHROUGH ACTIVE)');
  }
}

function requestDeviceOrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(res => {
        if (res === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      })
      .catch(console.warn);
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

function handleOrientation(e) {
  if (state.isXR || state.xrMode !== 'mobile-xr') return;
  if (e.gamma !== null && e.beta !== null) {
    state.yaw = THREE.MathUtils.degToRad(-e.alpha || 0);
    state.pitch = THREE.MathUtils.degToRad(e.gamma || 0);
  }
}

// =============================================================================
// GAMEPAD CONTROLLER API INTEGRATION
// =============================================================================
const gamepadPill = document.getElementById('gamepad-status-pill');
const gamepadNameText = document.getElementById('gamepad-name-text');
const btnToggleController = document.getElementById('btn-toggle-controller');

if (btnToggleController) {
  btnToggleController.addEventListener('click', () => {
    if (state.gamepadMode === 'auto') state.gamepadMode = 'enabled';
    else if (state.gamepadMode === 'enabled') state.gamepadMode = 'disabled';
    else state.gamepadMode = 'auto';

    btnToggleController.textContent = `🎮 Controller: ${state.gamepadMode.toUpperCase()}`;
    showToast(`GAMEPAD POLLING: ${state.gamepadMode.toUpperCase()}`);
    updateGamepadUI();
  });
}

window.addEventListener('gamepadconnected', (e) => {
  console.log('[Gamepad] Controller connected:', e.gamepad.id);
  state.gamepadIndex = e.gamepad.index;
  updateGamepadUI(e.gamepad);
  showToast(`CONTROLLER CONNECTED: ${e.gamepad.id.slice(0, 24)}...`);
  if (!audioMgr.isInitialized) audioMgr.init();
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log('[Gamepad] Controller disconnected:', e.gamepad.id);
  if (state.gamepadIndex === e.gamepad.index) {
    state.gamepadIndex = null;
  }
  updateGamepadUI(null);
  showToast('CONTROLLER DISCONNECTED');
});

function updateGamepadUI(pad = null) {
  if (!pad && state.gamepadIndex !== null) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    pad = pads[state.gamepadIndex];
  }

  if (pad && state.gamepadMode !== 'disabled') {
    if (gamepadPill) gamepadPill.classList.add('connected');
    const simpleName = pad.id.includes('Xbox') ? 'XBOX' : (pad.id.includes('Dual') ? 'PS5/4' : 'PAD');
    if (gamepadNameText) gamepadNameText.textContent = `${simpleName}: ON`;
  } else {
    if (gamepadPill) gamepadPill.classList.remove('connected');
    if (gamepadNameText) gamepadNameText.textContent = `PAD: ${state.gamepadMode === 'disabled' ? 'OFF' : 'AUTO'}`;
  }
}

function pollGamepad(delta) {
  if (state.gamepadMode === 'disabled') return;
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (!gamepads) return;

  for (let i = 0; i < gamepads.length; i++) {
    const pad = gamepads[i];
    if (!pad) continue;

    const lx = Math.abs(pad.axes[0]) > CONFIG.gamepadDeadzone ? pad.axes[0] : 0;
    const ly = Math.abs(pad.axes[1]) > CONFIG.gamepadDeadzone ? pad.axes[1] : 0;
    const rx = Math.abs(pad.axes[2]) > CONFIG.gamepadDeadzone ? pad.axes[2] : 0;
    const ry = Math.abs(pad.axes[3]) > CONFIG.gamepadDeadzone ? pad.axes[3] : 0;

    state.yaw -= rx * CONFIG.yawSpeed * 22.0;
    state.pitch -= ry * CONFIG.pitchSpeed * 22.0;
    state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    if (ly !== 0) state.velocity.addScaledVector(forward, -ly * CONFIG.flightSpeed * delta * 4.0);
    if (lx !== 0) state.velocity.addScaledVector(right, lx * CONFIG.flightSpeed * delta * 4.0);

    const r2 = pad.buttons[7] ? pad.buttons[7].value : 0;
    const l2 = pad.buttons[6] ? pad.buttons[6].value : 0;
    if (r2 > 0.1) state.velocity.addScaledVector(forward, r2 * CONFIG.flightSpeed * CONFIG.boostMultiplier * delta * 3.5);
    if (l2 > 0.1) state.velocity.multiplyScalar(0.85);

    if (pad.buttons[0] && pad.buttons[0].pressed && !state.lastPadButtons[0]) {
      const btnScan = document.getElementById('btn-do-scan');
      if (btnScan) btnScan.click();
      vibratePad(pad, 150);
    }
    if (pad.buttons[2] && pad.buttons[2].pressed && !state.lastPadButtons[2]) {
      const uncalibrated = state.coils.findIndex(c => !c);
      if (uncalibrated !== -1) {
        const cBtn = document.getElementById(`btn-coil-${uncalibrated + 1}`);
        if (cBtn) cBtn.click();
        vibratePad(pad, 200);
      }
    }
    if (pad.buttons[3] && pad.buttons[3].pressed && !state.lastPadButtons[3]) {
      triggerWarpJump();
      vibratePad(pad, 400);
    }

    state.lastPadButtons = {
      0: pad.buttons[0] ? pad.buttons[0].pressed : false,
      2: pad.buttons[2] ? pad.buttons[2].pressed : false,
      3: pad.buttons[3] ? pad.buttons[3].pressed : false
    };

    break;
  }
}

function vibratePad(pad, durationMs) {
  if (pad && pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
    pad.vibrationActuator.playEffect('dual-rumble', {
      startDelay: 0,
      duration: durationMs,
      weakMagnitude: 0.6,
      strongMagnitude: 0.9
    }).catch(() => {});
  }
}

// =============================================================================
// MOBILE TOUCH VIRTUAL JOYSTICK & TOUCH BUTTONS
// =============================================================================
const touchStickZone = document.getElementById('touch-stick-zone');
const touchStickKnob = document.getElementById('touch-stick-knob');
const touchBtnScan = document.getElementById('touch-btn-scan');
const touchBtnWarp = document.getElementById('touch-btn-warp');

let stickCenter = { x: 0, y: 0 };
const maxStickRadius = 38;

if (touchStickZone) {
  touchStickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = touchStickZone.getBoundingClientRect();
    stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    state.touchActive = true;
    updateStickPos(e.touches[0].clientX, e.touches[0].clientY);
    if (!audioMgr.isInitialized) audioMgr.init();
    lockLandscape();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!state.touchActive) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.target === touchStickZone || touchStickZone.contains(touch.target)) {
        updateStickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (state.touchActive) {
      state.touchActive = false;
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      if (touchStickKnob) touchStickKnob.style.transform = 'translate(0px, 0px)';
    }
  });
}

function updateStickPos(clientX, clientY) {
  const dx = clientX - stickCenter.x;
  const dy = clientY - stickCenter.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const clampedDist = Math.min(dist, maxStickRadius);

  const knobX = Math.cos(angle) * clampedDist;
  const knobY = Math.sin(angle) * clampedDist;

  if (touchStickKnob) {
    touchStickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }

  state.touchMove.x = knobX / maxStickRadius;
  state.touchMove.y = knobY / maxStickRadius;
}

if (touchBtnScan) {
  touchBtnScan.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const btnScan = document.getElementById('btn-do-scan');
    if (btnScan) btnScan.click();
  });
}

if (touchBtnWarp) {
  touchBtnWarp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    triggerWarpJump();
  });
}

function lockLandscape() {
  if (screen.orientation && typeof screen.orientation.lock === 'function') {
    screen.orientation.lock('landscape').catch(() => {});
  }
}

// =============================================================================
// DESKTOP 6-DOF FLIGHT CONTROLS & POINTER LOCK
// =============================================================================
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!audioMgr.isInitialized) audioMgr.init();

  if (e.code === 'KeyF') {
    triggerWarpJump();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

const mouseLockBtn = document.getElementById('btn-mouse-lock');
if (mouseLockBtn) {
  mouseLockBtn.addEventListener('click', () => {
    if (!audioMgr.isInitialized) audioMgr.init();
    if (document.pointerLockElement === container) {
      document.exitPointerLock();
    } else {
      container.requestPointerLock();
    }
  });
}

document.addEventListener('pointerlockchange', () => {
  state.isPointerLocked = (document.pointerLockElement === container);
  if (mouseLockBtn) {
    mouseLockBtn.classList.toggle('active', state.isPointerLocked);
    mouseLockBtn.textContent = state.isPointerLocked ? '🎯 MOUSE LOCKED (ESC)' : '🎯 Flight Mouse';
  }
});

container.addEventListener('mousedown', (e) => {
  if (!audioMgr.isInitialized) audioMgr.init();
  if (!state.isPointerLocked) {
    state.isMouseDown = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  state.isMouseDown = false;
});

window.addEventListener('mousemove', (e) => {
  if (state.isPointerLocked) {
    state.yaw   -= e.movementX * CONFIG.yawSpeed;
    state.pitch -= e.movementY * CONFIG.pitchSpeed;
    state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));
  } else if (state.isMouseDown) {
    const deltaX = e.clientX - state.lastMouseX;
    const deltaY = e.clientY - state.lastMouseY;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;

    state.yaw   -= deltaX * CONFIG.yawSpeed;
    state.pitch -= deltaY * CONFIG.pitchSpeed;
    state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));
  }
});

// =============================================================================
// MISSION OBJECTIVES & INTERACTIVE CALIBRATION SYSTEM
// =============================================================================
const hudDistEl = document.getElementById('hud-distance');
const hudVectorEl = document.getElementById('hud-vector');
const hudFluxEl = document.getElementById('hud-flux');
const hudFpsEl = document.getElementById('hud-fps');
const toastEl = document.getElementById('toast-msg');
const vectorRingEl = document.getElementById('vector-alignment-ring');
const warpBtn = document.getElementById('btn-warp');
const objTotalProgressEl = document.getElementById('obj-total-progress');

function showToast(msg, duration = 3200) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  setTimeout(() => {
    toastEl.style.display = 'none';
  }, duration);
}

// Objective 1: Resonance Scanner
const btnScan = document.getElementById('btn-do-scan');
const barScan = document.getElementById('bar-scan');
const statusScan = document.getElementById('status-scan');
const objScan = document.getElementById('obj-scan');

if (btnScan) {
  btnScan.addEventListener('click', () => {
    if (state.isScanning || state.scanProgress >= 1.0) return;
    audioMgr.init();
    audioMgr.playScan();
    state.isScanning = true;
    btnScan.disabled = true;
    btnScan.textContent = 'Scanning...';
    statusScan.textContent = 'ANALYZING HARMONICS';

    let progress = 0;
    const scanInterval = setInterval(() => {
      progress += 0.05;
      state.scanProgress = Math.min(1.0, progress);
      barScan.style.width = `${Math.round(state.scanProgress * 100)}%`;

      if (state.scanProgress >= 1.0) {
        clearInterval(scanInterval);
        state.isScanning = false;
        objScan.classList.add('completed');
        statusScan.textContent = 'LOCKED (432.8 THz)';
        btnScan.textContent = '✓ Scanned';
        showToast('OBJECTIVE 1: RESONANCE SCAN COMPLETE');
        checkObjectives();
      }
    }, 120);
  });
}

// Objective 2: Warp Coils
const coilBtns = [
  document.getElementById('btn-coil-1'),
  document.getElementById('btn-coil-2'),
  document.getElementById('btn-coil-3')
];
const barCoils = document.getElementById('bar-coils');
const statusCoils = document.getElementById('status-coils');
const objCoils = document.getElementById('obj-coils');

coilBtns.forEach((btn, idx) => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    audioMgr.init();
    audioMgr.playCoil();
    state.coils[idx] = true;
    btn.disabled = true;
    btn.style.background = '#06d6a0';
    btn.style.color = '#000';
    btn.style.borderColor = '#fff';

    const calibratedCount = state.coils.filter(c => c).length;
    barCoils.style.width = `${Math.round((calibratedCount / 3) * 100)}%`;
    statusCoils.textContent = `${calibratedCount}/3 CALIBRATED`;

    if (calibratedCount === 3) {
      objCoils.classList.add('completed');
      statusCoils.textContent = '3/3 SYNCHRONIZED';
      showToast('OBJECTIVE 2: ALL WARP COILS SYNCHRONIZED');
    }
    checkObjectives();
  });
});

function checkObjectives() {
  let completed = 0;
  if (state.scanProgress >= 1.0) completed++;
  if (state.coils.every(c => c)) completed++;
  if (state.isVectorAligned && state.isInRange) completed++;

  if (objTotalProgressEl) objTotalProgressEl.textContent = `${completed}/4 COMPLETE`;

  if (completed === 3 && !state.isWarpReady) {
    state.isWarpReady = true;
    const objJump = document.getElementById('obj-jump');
    const statusJump = document.getElementById('status-jump');
    if (objJump) objJump.classList.add('active');
    if (statusJump) {
      statusJump.textContent = 'READY FOR INSERTION';
      statusJump.style.color = 'var(--cyan-neon)';
    }

    if (warpBtn) {
      warpBtn.classList.add('btn-ready');
      warpBtn.innerHTML = '⚡ ENGAGE WARP JUMP [F]';
    }
    showToast('ALL SYSTEMS GREEN: WARP HORIZON JUMP AUTHORIZED');
  }
}

function triggerWarpJump() {
  if (state.isHyperWarping) return;
  audioMgr.init();

  if (!state.isWarpReady) {
    showToast('WARNING: COMPLETE SCAN & COIL CALIBRATION FIRST!');
    return;
  }

  state.isHyperWarping = true;
  audioMgr.playWarp();
  showToast('WARP JUMP INITIATED: PLUNGING THROUGH SINGULARITY...');

  const objJump = document.getElementById('obj-jump');
  const barJump = document.getElementById('bar-jump');
  const statusJump = document.getElementById('status-jump');
  if (objJump) objJump.classList.add('completed');
  if (statusJump) statusJump.textContent = 'PASSING EVENT HORIZON';
  if (barJump) barJump.style.width = '100%';
  if (objTotalProgressEl) objTotalProgressEl.textContent = '4/4 COMPLETE';
}

if (warpBtn) {
  warpBtn.addEventListener('click', triggerWarpJump);
}

// Sliders and Audio Toggle
const bloomSlider = document.getElementById('slider-bloom');
const bloomValDisplay = document.getElementById('val-bloom');
if (bloomSlider) {
  bloomSlider.addEventListener('input', (e) => {
    CONFIG.bloomStrength = parseFloat(e.target.value);
    compositeShader.uniforms.uBloomStrength.value = CONFIG.bloomStrength;
    if (bloomValDisplay) bloomValDisplay.textContent = CONFIG.bloomStrength.toFixed(2);
  });
}

const lensingSlider = document.getElementById('slider-lensing');
const lensingValDisplay = document.getElementById('val-lensing');
if (lensingSlider) {
  lensingSlider.addEventListener('input', (e) => {
    CONFIG.lensingStrength = parseFloat(e.target.value);
    compositeShader.uniforms.uLensingStrength.value = CONFIG.lensingStrength;
    if (lensingValDisplay) lensingValDisplay.textContent = CONFIG.lensingStrength.toFixed(1);
  });
}

const toggleAudioBtn = document.getElementById('btn-toggle-audio');
if (toggleAudioBtn) {
  toggleAudioBtn.addEventListener('click', () => {
    audioMgr.init();
    CONFIG.audioMuted = !CONFIG.audioMuted;
    if (CONFIG.audioMuted) {
      audioMgr.stopDrone();
      toggleAudioBtn.innerHTML = '<span class="icon">🔇</span> Audio: OFF';
      toggleAudioBtn.classList.remove('active');
    } else {
      audioMgr.playDrone();
      toggleAudioBtn.innerHTML = '<span class="icon">🔊</span> Audio: ON (.wav)';
      toggleAudioBtn.classList.add('active');
    }
  });
}

const toggleHudBtn = document.getElementById('btn-toggle-hud');
const hudPanel = document.getElementById('hud-panel');
const flightPanel = document.getElementById('flight-panel');
if (toggleHudBtn) {
  toggleHudBtn.addEventListener('click', () => {
    state.hudVisible = !state.hudVisible;
    const disp = state.hudVisible ? 'flex' : 'none';
    const blockDisp = state.hudVisible ? 'block' : 'none';
    if (hudPanel) hudPanel.style.display = disp;
    if (flightPanel) flightPanel.style.display = blockDisp;
  });
}

// =============================================================================
// ANIMATION & RENDER PIPELINE
// =============================================================================
const tempVec = new THREE.Vector3();
const wormholeScreenVec = new THREE.Vector3();

function renderPostProcessing() {
  tempVec.set(0, 0, 0);
  tempVec.project(camera);

  const isBehind = tempVec.z > 1.0 ? 1.0 : 0.0;
  wormholeScreenVec.x = (tempVec.x * 0.5) + 0.5;
  wormholeScreenVec.y = (tempVec.y * 0.5) + 0.5;

  compositeShader.uniforms.uWormholeScreenPos.value.copy(wormholeScreenVec);
  compositeShader.uniforms.uIsBehind.value = isBehind;
  compositeShader.uniforms.uAspect.value = window.innerWidth / window.innerHeight;

  renderer.setRenderTarget(sceneRenderTarget);
  renderer.render(scene, camera);

  highPassMaterial.uniforms.tDiffuse.value = sceneRenderTarget.texture;
  highPassMaterial.uniforms.uThreshold.value = CONFIG.bloomThreshold;
  postScene.clear();
  postScene.add(highPassQuad);
  renderer.setRenderTarget(renderTargetA);
  renderer.render(postScene, postCamera);

  blurMaterial.uniforms.tDiffuse.value = renderTargetA.texture;
  blurMaterial.uniforms.uDirection.value.set(1.0, 0.0);
  blurMaterial.uniforms.uRadius.value = CONFIG.bloomRadius;
  postScene.clear();
  postScene.add(blurQuad);
  renderer.setRenderTarget(renderTargetB);
  renderer.render(postScene, postCamera);

  blurMaterial.uniforms.tDiffuse.value = renderTargetB.texture;
  blurMaterial.uniforms.uDirection.value.set(0.0, 1.0);
  blurMaterial.uniforms.uRadius.value = CONFIG.bloomRadius;
  renderer.setRenderTarget(renderTargetA);
  renderer.render(postScene, postCamera);

  compositeMaterial.uniforms.tScene.value = sceneRenderTarget.texture;
  compositeMaterial.uniforms.tBloom.value = renderTargetA.texture;
  compositeMaterial.uniforms.uBloomStrength.value = CONFIG.bloomStrength;
  compositeMaterial.uniforms.uLensingStrength.value = CONFIG.lensingStrength;
  compositeMaterial.uniforms.uChromaticAberration.value = CONFIG.chromaticAberration;
  postScene.clear();
  postScene.add(compositeQuad);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCamera);
}

function updateFlight(delta) {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = state.yaw;
  camera.rotation.x = state.pitch;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

  const accel = new THREE.Vector3(0, 0, 0);
  const speed = CONFIG.flightSpeed * (keys['ShiftLeft'] || keys['ShiftRight'] ? CONFIG.boostMultiplier : 1.0);

  if (keys['KeyW'] || keys['ArrowUp']) accel.add(forward);
  if (keys['KeyS'] || keys['ArrowDown']) accel.sub(forward);
  if (keys['KeyD'] || keys['ArrowRight']) accel.add(right);
  if (keys['KeyA'] || keys['ArrowLeft']) accel.sub(right);
  if (keys['Space']) accel.add(up);
  if (keys['ControlLeft'] || keys['KeyC']) accel.sub(up);

  if (keys['KeyQ']) state.yaw += 0.02;
  if (keys['KeyE']) state.yaw -= 0.02;

  if (state.touchActive) {
    accel.addScaledVector(forward, -state.touchMove.y);
    accel.addScaledVector(right, state.touchMove.x);
  }

  pollGamepad(delta);

  if (state.isHyperWarping) {
    state.warpJumpTimer += delta;
    const targetWarpDir = new THREE.Vector3(0, 0, 0).sub(state.position).normalize();
    camera.position.addScaledVector(targetWarpDir, delta * 320.0);

    camera.fov = THREE.MathUtils.lerp(camera.fov, 125, 0.05);
    camera.updateProjectionMatrix();

    if (camera.position.length() < CONFIG.eventHorizonRadius * 1.2) {
      camera.position.set(0, 0, 0);
      showToast('WORMHOLE TRANSIT COMPLETE - STAGE 2 UNLOCKED');
    }
  } else {
    if (accel.lengthSq() > 0) {
      accel.normalize();
      state.velocity.addScaledVector(accel, speed * delta * 4.0);
    }
    state.velocity.multiplyScalar(0.92);
    camera.position.addScaledVector(state.velocity, delta);
  }

  state.position.copy(camera.position);

  const distKm = Math.round(state.position.length() * 420);
  if (hudDistEl) hudDistEl.textContent = `${distKm.toLocaleString()} KM`;

  const toWormhole = new THREE.Vector3(0, 0, 0).sub(state.position).normalize();
  const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const angleDeg = THREE.MathUtils.radToDeg(forwardDir.angleTo(toWormhole));

  if (hudVectorEl) hudVectorEl.textContent = `${angleDeg.toFixed(1)}°`;

  state.isVectorAligned = (angleDeg < 7.0);
  state.isInRange = (distKm < 50000);

  const objVector = document.getElementById('obj-vector');
  const barVector = document.getElementById('bar-vector');
  const statusVector = document.getElementById('status-vector');

  if (barVector) {
    const rangePct = Math.max(0, Math.min(100, Math.round((1.0 - (distKm / 120000)) * 100)));
    barVector.style.width = `${rangePct}%`;
  }

  if (state.isVectorAligned && state.isInRange) {
    if (objVector) objVector.classList.add('completed');
    if (statusVector) statusVector.textContent = 'VECTOR LOCKED & IN RANGE';
    if (vectorRingEl) vectorRingEl.classList.add('locked');
  } else {
    if (objVector) objVector.classList.remove('completed');
    if (statusVector) statusVector.textContent = `${angleDeg.toFixed(1)}° / ${distKm.toLocaleString()} KM`;
    if (vectorRingEl) vectorRingEl.classList.remove('locked');
  }

  checkObjectives();
  audioMgr.updateProximity(distKm);
}

// Main Animation Loop
renderer.setAnimationLoop((timestamp) => {
  const delta = (timestamp - state.lastFrameTime) * 0.001;
  state.lastFrameTime = timestamp;
  state.time += delta;

  state.frameCount++;
  if (timestamp - state.lastFpsUpdate >= 500) {
    state.fps = Math.round((state.frameCount * 1000) / (timestamp - state.lastFpsUpdate));
    state.frameCount = 0;
    state.lastFpsUpdate = timestamp;
    if (hudFpsEl) hudFpsEl.textContent = `${state.fps} FPS`;
  }

  if (!state.isXR) {
    updateFlight(delta);
  }

  accretionUniforms.uTime.value = state.time;
  secondaryDiskMaterial.uniforms.uTime.value = state.time;
  photonRingUniforms.uTime.value = state.time;
  particleMaterial.uniforms.uTime.value = state.time;

  for (let i = 0; i < shockwaves.length; i++) {
    const sw = shockwaves[i];
    let prog = sw.mesh.material.uniforms.uProgress.value + delta * sw.speed;
    if (prog > 1.0) prog = 0.22;
    sw.mesh.material.uniforms.uProgress.value = prog;
  }

  starfield.rotation.y = state.time * 0.0025;
  floatingDust.rotation.y = state.time * 0.006;

  if (hudFluxEl) {
    const flux = (14.2 + Math.sin(state.time * 4.0) * 1.8 + (state.isHyperWarping ? 18.0 : 0)).toFixed(1);
    hudFluxEl.textContent = `${flux} TeV`;
  }

  if (state.isXR || !state.postProcessingEnabled) {
    renderer.render(scene, camera);
  } else {
    renderPostProcessing();
  }
});

// Resize Handler
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio, 2.0);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  renderer.setPixelRatio(dpr);

  sceneRenderTarget.setSize(w * dpr, h * dpr);
  renderTargetA.setSize(w * 0.5, h * 0.5);
  renderTargetB.setSize(w * 0.5, h * 0.5);

  blurShader.uniforms.uResolution.value.set(w * 0.5, h * 0.5);
  compositeShader.uniforms.uAspect.value = w / h;
});

// Initial startup hardware detection
detectHardwareDiagnostics().then(() => {
  console.log('[Wormhole XR] Hardware profile detected:', detectedHardware);
});
