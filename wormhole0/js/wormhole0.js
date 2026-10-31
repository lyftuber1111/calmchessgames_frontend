/**
 * Wormhole XR - Stage 1: The Distant Neon Cyan Wormhole
 * Multi-Platform XR Experience with Hardware Validation Telemetry,
 * Closeable Incompatibility Badge, Mode Switcher, Game Controller Support,
 * and Collapsible Left-Hand Objectives Drawer.
 * 
 * Calm Chess Games / Brian Berry (C) 2026
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

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
  
  // Panel state
  autoClose: true,
  
  // Player Position & Dynamics
  position: new THREE.Vector3(0, 2.5, CONFIG.wormholeDistance),
  velocity: new THREE.Vector3(0, 0, 0),
  pitch: 0,
  yaw: 0,
  isPointerLocked: false,
  isMouseDown: false,
  lastMouseX: 0,
  lastMouseY: 0,
  
  // Virtual Touch Joystick input (Left Thumb Flight)
  touchMove: { x: 0, y: 0 },
  touchActive: false,
  
  // Virtual Aim Joystick input & Crosshair Reticle (Right Thumb Aim)
  aimMove: { x: 0, y: 0 },
  aimActive: false,
  crosshair: {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
  },
  lastLaserShotTime: 0,

  // Left Joystick Flight Lockout Timer (3s on touch, 1s resetting on fire tap)
  flightLockoutUntil: 0,

  // Crosshair Aim speed multiplier (default 2.90)
  crosshairSpeedMultiplier: 2.90,

  // Wormhole Nav Lock State
  isAligningToWormhole: false,
  targetYaw: 0,
  targetPitch: 0,

  // Left-Handed Touch Control Layout
  leftHandedMode: false,
  
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

// WebGL Capability Probe
function checkWebGLSupport() {
  try {
    if (!window.WebGLRenderingContext) {
      return { supported: false, reason: 'WebGL is not supported by this browser.' };
    }
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      return { supported: false, reason: 'Unable to initialize WebGL graphics context. Hardware acceleration may be disabled.' };
    }
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'void main(){gl_Position=vec4(0.0,0.0,0.0,1.0);}');
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      return { supported: false, reason: 'GPU shader compilation failed.' };
    }
    return { supported: true, gl };
  } catch (err) {
    return { supported: false, reason: 'WebGL error: ' + (err.message || 'unknown error') };
  }
}

// =============================================================================
// THREE.JS CORE SCENE INITIALIZATION
// =============================================================================
let container = document.getElementById('webgl-container');
let scene = null;
let camera = null;
let renderer = null;
let vrBtn = null;
let webglInitError = null;

const controllers = [];

try {
  const probe = checkWebGLSupport();
  if (!probe.supported) {
    webglInitError = new Error(probe.reason);
  } else {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01050a, 0.0006);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2500);
    camera.position.copy(state.position);
    window.camera = camera;
    window.scene = scene;

    renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: true,
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.xr.enabled = true;
    if (container) container.appendChild(renderer.domElement);

    // WebXR Button - Never show 'VR NOT SUPPORTED' badge during game play
    try {
      vrBtn = VRButton.createButton(renderer);
      vrBtn.id = 'xr-enter-btn';
      vrBtn.style.display = 'none';
      if (vrBtn && vrBtn.textContent && !vrBtn.textContent.includes('NOT SUPPORTED')) {
        document.body.appendChild(vrBtn);
      }
    } catch (e) {}

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
    try {
      const controllerModelFactory = new XRControllerModelFactory();
      for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        scene.add(controller);
        
        const grip = renderer.xr.getControllerGrip(i);
        if (controllerModelFactory) {
          try {
            grip.add(controllerModelFactory.createControllerModel(grip));
          } catch (e) {}
        }
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
    } catch (e) {}
  }
} catch (err) {
  console.warn('[Wormhole XR] WebGL renderer creation caught error:', err);
  webglInitError = err;
}

// Fallback dummy scene & camera so shaders and materials instantiate safely without throwing
if (!scene) scene = new THREE.Scene();
if (!camera) camera = new THREE.PerspectiveCamera(65, 1.0, 0.1, 1000);

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
  depthWrite: false,
  fog: false
});

const diskGeom = new THREE.RingGeometry(
  CONFIG.eventHorizonRadius * 0.85,
  CONFIG.accretionDiskRadius,
  96,
  16
);
const accretionDiskMesh = new THREE.Mesh(diskGeom, accretionDiskMaterial);
accretionDiskMesh.rotation.x = Math.PI / 3.4;
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
accretionDiskMesh2.rotation.x = -Math.PI / 3.8;
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
  depthWrite: false,
  fog: false
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

// Full-Screen Starfield & Celestial Singularity Glow
function createStarTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  g.addColorStop(0.25, 'rgba(215, 245, 255, 0.95)');
  g.addColorStop(0.55, 'rgba(0, 210, 255, 0.45)');
  g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function createStarfield() {
  const starGeom = new THREE.BufferGeometry();
  const starCount = 12000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starPalette = [
    new THREE.Color(0xffffff), // Pure white
    new THREE.Color(0xaae7ff), // Cyan shimmer
    new THREE.Color(0x76b6ff), // Deep celestial blue
    new THREE.Color(0xd0eaff), // Soft blue-white
    new THREE.Color(0xffe2a0), // Warm amber star
    new THREE.Color(0x00f0ff)  // Neon cyan
  ];

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    // Distribute in concentric volume shells: near, mid, and distant celestial sphere
    let r;
    const roll = Math.random();
    if (roll < 0.25) {
      r = 50 + Math.random() * 250; // Near ambient space around flight path
    } else if (roll < 0.65) {
      r = 300 + Math.random() * 500; // Mid celestial volume
    } else {
      r = 800 + Math.random() * 1200; // Deep cosmos background
    }

    starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);

    const baseColor = starPalette[Math.floor(Math.random() * starPalette.length)];
    const lum = 0.6 + Math.random() * 0.7;
    starColors[i * 3 + 0] = Math.min(1.0, baseColor.r * lum);
    starColors[i * 3 + 1] = Math.min(1.0, baseColor.g * lum);
    starColors[i * 3 + 2] = Math.min(1.0, baseColor.b * lum);
  }

  starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 4.2,
    map: createStarTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    fog: false // Crucial: ensures stars fill the entire screen brilliantly without fog dimming
  });

  return new THREE.Points(starGeom, starMat);
}
const starfield = createStarfield();
scene.add(starfield);

// Distant Wormhole Singularity Corona & Celestial Beacon
function createWormholeDistantCorona() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.12, 'rgba(0, 240, 255, 0.95)');
  grad.addColorStop(0.35, 'rgba(0, 160, 255, 0.65)');
  grad.addColorStop(0.65, 'rgba(0, 80, 220, 0.25)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: 0x00f0ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    fog: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(160, 160, 1);
  sprite.position.set(0, 0, 0);
  return sprite;
}
const wormholeCorona = createWormholeDistantCorona();
scene.add(wormholeCorona);

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
  try {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let rtType = THREE.UnsignedByteType;
    try {
      const gl = renderer.getContext();
      if (renderer.capabilities.isWebGL2 || gl.getExtension('OES_texture_half_float')) {
        rtType = THREE.HalfFloatType;
      }
    } catch (e) {
      rtType = THREE.UnsignedByteType;
    }

    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: rtType
    };

    sceneRenderTarget = new THREE.WebGLRenderTarget(w * dpr, h * dpr, rtOptions);
    renderTargetA = new THREE.WebGLRenderTarget(Math.max(128, w * 0.5), Math.max(128, h * 0.5), rtOptions);
    renderTargetB = new THREE.WebGLRenderTarget(Math.max(128, w * 0.5), Math.max(128, h * 0.5), rtOptions);
  } catch (err) {
    console.warn('[Wormhole XR] Post-processing initialization failed, falling back to direct render:', err);
    state.postProcessingEnabled = false;
  }
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

  playLaser() {
    if (CONFIG.audioMuted) return;
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      // Punchy sci-fi laser blast frequency drop
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.16);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('[Audio] Laser sound error:', e);
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
// COLLAPSIBLE PANELS: LEFT (MISSION), TOP (TELEMETRY), BOTTOM (TACTICAL)
// Panels toggle open/closed ONLY when tab handle is selected (never auto-pinned).
// All open panels automatically close when the flight controller is used,
// unless the 'Auto close' checkbox is toggled off (unchecked).
// =============================================================================
const leftDrawer = document.getElementById('left-drawer-container');
const drawerTab = document.getElementById('drawer-tab');
const btnToggleDrawer = document.getElementById('btn-toggle-drawer');

const topDrawer = document.getElementById('top-drawer-container');
const topDrawerTab = document.getElementById('top-drawer-tab');
const btnToggleHeader = document.getElementById('btn-toggle-header');

const bottomDrawer = document.getElementById('bottom-drawer-container');
const bottomDrawerTab = document.getElementById('bottom-drawer-tab');

function closeAllPanels() {
  if (leftDrawer) leftDrawer.classList.remove('open');
  if (topDrawer) topDrawer.classList.remove('open');
  if (bottomDrawer) bottomDrawer.classList.remove('open');
  if (btnToggleDrawer) btnToggleDrawer.classList.remove('active');
  if (btnToggleHeader) btnToggleHeader.classList.remove('active');
}

function handleFlightActivity() {
  if (state.autoClose) {
    const wasAnyOpen = (leftDrawer && leftDrawer.classList.contains('open')) ||
                       (topDrawer && topDrawer.classList.contains('open')) ||
                       (bottomDrawer && bottomDrawer.classList.contains('open'));
    if (wasAnyOpen) {
      closeAllPanels();
    }
  }
}

function toggleLeftPanel(e) {
  if (e) e.stopPropagation();
  if (!leftDrawer) return;
  const willOpen = !leftDrawer.classList.contains('open');
  leftDrawer.classList.toggle('open', willOpen);
  if (btnToggleDrawer) btnToggleDrawer.classList.toggle('active', willOpen);
  showToast(willOpen ? 'OBJECTIVES PANEL OPEN' : 'OBJECTIVES PANEL CLOSED');
}

function toggleTopPanel(e) {
  if (e) e.stopPropagation();
  if (!topDrawer) return;
  const willOpen = !topDrawer.classList.contains('open');
  topDrawer.classList.toggle('open', willOpen);
  if (btnToggleHeader) btnToggleHeader.classList.toggle('active', willOpen);
  showToast(willOpen ? 'TELEMETRY HEADER OPEN' : 'TELEMETRY HEADER CLOSED');
}

function toggleBottomPanel(e) {
  if (e) e.stopPropagation();
  if (!bottomDrawer) return;
  const willOpen = !bottomDrawer.classList.contains('open');
  bottomDrawer.classList.toggle('open', willOpen);
  showToast(willOpen ? 'TACTICAL CONTROLS OPEN' : 'TACTICAL CONTROLS CLOSED');
}

// Panel tab handles toggle open and closed when selected
if (drawerTab) {
  drawerTab.addEventListener('click', toggleLeftPanel);
}
if (btnToggleDrawer) {
  btnToggleDrawer.addEventListener('click', toggleLeftPanel);
}

if (topDrawerTab) {
  topDrawerTab.addEventListener('click', toggleTopPanel);
}
if (btnToggleHeader) {
  btnToggleHeader.addEventListener('click', toggleTopPanel);
}

if (bottomDrawerTab) {
  bottomDrawerTab.addEventListener('click', toggleBottomPanel);
}

// Synchronize all Auto Close checkboxes across panels
function setAutoClose(val) {
  state.autoClose = val;
  document.querySelectorAll('.chk-auto-close').forEach(chk => {
    chk.checked = val;
  });
  showToast(val ? 'AUTO CLOSE: ON (CLOSES DURING FLIGHT)' : 'AUTO CLOSE: OFF (PANELS REMAIN OPEN)');
}

document.querySelectorAll('.chk-auto-close').forEach(chk => {
  chk.addEventListener('change', (e) => {
    setAutoClose(e.target.checked);
  });
});

// Keyboard shortcuts for toggling panels
window.addEventListener('keydown', (e) => {
  if (e.code === 'Tab' || e.code === 'KeyM') {
    e.preventDefault();
    toggleLeftPanel();
  } else if (e.code === 'KeyH') {
    e.preventDefault();
    toggleTopPanel();
  } else if (e.code === 'KeyB') {
    e.preventDefault();
    toggleBottomPanel();
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

function getDescriptiveDeviceName() {
  const ua = navigator.userAgent;
  let model = '';
  let os = '';

  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s+([0-9.]+)/i);
    os = m ? `Android ${m[1]}` : 'Android';
    if (/Pixel\s+([0-9a-zA-Z\s]+)/i.test(ua)) {
      const pm = ua.match(/Pixel\s+([0-9a-zA-Z\s]+)/i);
      model = `Google Pixel ${pm[1].trim()}`;
    } else if (/SM-([A-Z0-9]+)/i.test(ua)) {
      const sm = ua.match(/SM-([A-Z0-9]+)/i);
      model = `Samsung Galaxy (SM-${sm[1]})`;
    } else if (/(Moto[^\s;)]+|Motorola[^\s;)]+)/i.test(ua)) {
      const mm = ua.match(/(Moto[^\s;)]+|Motorola[^\s;)]+)/i);
      model = mm[1];
    } else if (/(Redmi[^\s;)]+|Xiaomi[^\s;)]+)/i.test(ua)) {
      const xm = ua.match(/(Redmi[^\s;)]+|Xiaomi[^\s;)]+)/i);
      model = xm[1];
    } else if (/OnePlus[^\s;)]*/i.test(ua)) {
      model = 'OnePlus Device';
    } else {
      const am = ua.match(/Android[^;]+;\s*([^;)]+)\s*(?:Build|\))/i);
      if (am && am[1] && !/K/i.test(am[1].trim())) {
        model = am[1].trim();
      } else {
        model = 'Android Smartphone';
      }
    }
  } else if (/iPhone/i.test(ua)) {
    const im = ua.match(/OS\s+([0-9_]+)/i);
    os = im ? `iOS ${im[1].replace(/_/g, '.')}` : 'iOS';
    model = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    const im = ua.match(/OS\s+([0-9_]+)/i);
    os = im ? `iPadOS ${im[1].replace(/_/g, '.')}` : 'iPadOS';
    model = 'Apple iPad';
  } else if (/Quest|Oculus/i.test(ua)) {
    if (/Quest\s*3/i.test(ua)) model = 'Meta Quest 3';
    else if (/Quest\s*Pro/i.test(ua)) model = 'Meta Quest Pro';
    else if (/Quest\s*2/i.test(ua)) model = 'Meta Quest 2';
    else model = 'Meta Quest VR Headset';
    os = 'Meta Horizon OS';
  } else if (/Vision/i.test(ua)) {
    model = 'Apple Vision Pro';
    os = 'visionOS';
  } else if (/Windows/i.test(ua)) {
    model = 'Windows PC';
    os = 'Windows 10/11';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    model = 'Apple Mac';
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    model = 'Linux Desktop';
    os = 'Linux';
  } else {
    model = (detectedHardware.type === 'mobile') ? 'Mobile Device' : 'Desktop PC';
    os = detectedHardware.os || 'Unknown OS';
  }

  let gpu = detectedHardware.gpu || '';
  let gpuShort = '';
  if (gpu) {
    if (/Adreno\s*(?:\(TM\))?\s*([0-9]+)/i.test(gpu)) {
      gpuShort = 'Adreno ' + gpu.match(/Adreno\s*(?:\(TM\))?\s*([0-9]+)/i)[1];
    } else if (/Mali-([A-Z0-9]+)/i.test(gpu)) {
      gpuShort = 'Mali-' + gpu.match(/Mali-([A-Z0-9]+)/i)[1];
    } else if (/Apple\s*GPU/i.test(gpu)) {
      gpuShort = 'Apple GPU';
    } else if (/RTX\s*([0-9]+)/i.test(gpu)) {
      gpuShort = 'GeForce RTX ' + gpu.match(/RTX\s*([0-9]+)/i)[1];
    } else if (/GTX\s*([0-9]+)/i.test(gpu)) {
      gpuShort = 'GeForce GTX ' + gpu.match(/GTX\s*([0-9]+)/i)[1];
    } else if (/Radeon/i.test(gpu)) {
      gpuShort = 'AMD Radeon';
    } else if (/Intel/i.test(gpu)) {
      gpuShort = 'Intel Graphics';
    }
  }

  const details = [];
  if (os) details.push(os);
  if (gpuShort) details.push(gpuShort);
  if (details.length > 0) {
    return `${model} (${details.join(', ')})`;
  }
  return model;
}

async function detectHardwareDiagnostics() {
  try {
    let gl = null;
    try {
      if (typeof renderer !== 'undefined' && renderer && renderer.getContext) {
        gl = renderer.getContext();
      } else {
        const testCanvas = document.createElement('canvas');
        gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      }
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          detectedHardware.gpu = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {}

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

    detectedHardware.descriptiveName = getDescriptiveDeviceName();
  } catch (err) {
    console.warn('[Hardware Detection] Detection warning:', err);
  }
}

async function reportUnsupportedDeviceTelemetry(descriptiveName, reason) {
  const payload = {
    action: 'report_unsupported',
    device_name: descriptiveName,
    device_type: detectedHardware.type,
    os_platform: detectedHardware.os,
    browser: detectedHardware.browser,
    gpu_renderer: detectedHardware.gpu,
    is_supported: 0,
    reason: reason,
    immersive_vr: detectedHardware.vrSupported,
    immersive_ar: detectedHardware.arSupported,
    has_touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  };

  const endpoints = [
    'https://api.calmchessgames.com/wormhole_device_api.php?action=report_unsupported',
    'https://api.calmchessgames.com/admin/wormhole_device_api.php?action=report_unsupported',
    'wormhole_device_api.php?action=report_unsupported',
    '../wormhole_device_api.php?action=report_unsupported',
    '../admin/wormhole_device_api.php?action=report_unsupported',
    'admin/wormhole_device_api.php?action=report_unsupported',
    '/wormhole_device_api.php?action=report_unsupported'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res && res.ok) {
        console.log('[Wormhole XR] Successfully recorded unsupported device in database:', descriptiveName);
        break;
      }
    } catch (e) {}
  }
}

function showUnsupportedBadge(mode, reason, recommendedMode = 'desktop-xr', isFatal = false) {
  state.pendingRecommendedMode = recommendedMode;

  const modeTitles = {
    'desktop-xr': 'DESKTOP XR (6-DOF FLIGHT)',
    'desktop-vr': 'DESKTOP VR (PCVR / HMD)',
    'mobile-xr': 'MOBILE XR (WebXR / VR VIEWER)',
    'mobile-ar': 'MOBILE AR (ARCore CAMERA PASSTHROUGH)'
  };

  if (modalModeName) {
    modalModeName.textContent = isFatal ? 'UNSUPPORTED HARDWARE' : (modeTitles[mode] || mode.toUpperCase());
  }
  if (modalSupportFlag) {
    modalSupportFlag.textContent = isFatal ? 'DEVICE CANNOT RUN WORMHOLE XR' : 'INCOMPATIBLE / NOT SUPPORTED';
  }
  if (modalReasonText) {
    modalReasonText.textContent = reason || 'Hardware or browser capabilities do not meet the minimum requirements for this operating mode.';
  }

  const devDisplayName = detectedHardware.descriptiveName || detectedHardware.activeDeviceName || detectedHardware.name;
  if (specDevName) specDevName.textContent = devDisplayName;
  if (specOs) specOs.textContent = detectedHardware.os;
  if (specBrowser) specBrowser.textContent = detectedHardware.browser;
  if (specGpu) specGpu.textContent = detectedHardware.gpu;

  const specWebglStatus = document.getElementById('spec-webgl-status');
  if (specWebglStatus) {
    const glOk = checkWebGLSupport().supported;
    specWebglStatus.textContent = glOk ? '✓ ACCELERATED' : '✗ DISABLED / UNAVAILABLE';
    specWebglStatus.style.color = glOk ? 'var(--accent-green)' : 'var(--accent-alert)';
  }

  const vrReady = (detectedHardware.activeDeviceType === 'vr_hmd') || detectedHardware.vrSupported;
  const arReady = (detectedHardware.activeDeviceType === 'vr_hmd' || detectedHardware.activeDeviceName?.includes('ARCore') || detectedHardware.activeDeviceName?.includes('ARKit')) || detectedHardware.arSupported;

  if (specVrStatus) {
    specVrStatus.textContent = vrReady ? '✓ READY / SUPPORTED' : '✗ NOT CONNECTED / UNSUPPORTED';
    specVrStatus.style.color = vrReady ? 'var(--accent-green)' : 'var(--accent-alert)';
  }
  if (specArStatus) {
    specArStatus.textContent = arReady ? '✓ PASSTHROUGH CERTIFIED' : '✗ ARCore NOT AVAILABLE';
    specArStatus.style.color = arReady ? 'var(--accent-green)' : 'var(--accent-alert)';
  }

  if (modalRecText) {
    const recName = modeTitles[recommendedMode] || recommendedMode.toUpperCase();
    modalRecText.textContent = `Switch to ${recName}. This mode is fully accelerated and validated for your hardware profile.`;
  }

  if (btnSwitchRec) btnSwitchRec.style.display = isFatal ? 'none' : 'inline-flex';
  if (btnForceContinue) btnForceContinue.style.display = isFatal ? 'none' : 'inline-flex';

  const btnReturnCalmChess = document.getElementById('btn-return-calmchess');
  if (btnReturnCalmChess) {
    btnReturnCalmChess.style.display = 'inline-flex';
  }

  if (modalOverlay) modalOverlay.style.display = 'flex';
}

function hideUnsupportedBadge() {
  if (modalOverlay) modalOverlay.style.display = 'none';
}

if (btnCloseModal) {
  btnCloseModal.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'https://calmchessgames.com';
  });
}
if (btnDismissModal) btnDismissModal.addEventListener('click', hideUnsupportedBadge);

// Dismiss rotate advisory prompt
const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
const landscapePrompt = document.getElementById('landscape-rotate-prompt');
if (btnDismissRotate && landscapePrompt) {
  btnDismissRotate.addEventListener('click', () => {
    landscapePrompt.style.display = 'none';
  });
}

// Close on backdrop overlay click or ESC key
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      window.location.href = 'https://calmchessgames.com';
    }
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
    window.location.href = 'https://calmchessgames.com';
  }
});

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

// Specific Hardware Device Profiles & Compatibility Evaluator
const DEVICE_PROFILES = {
  'auto': { name: 'Auto-Detected System', type: 'auto' },
  'desktop-pc': { name: 'Standard Desktop PC (Mouse & Keyboard)', type: 'desktop', vrSupported: false, arSupported: false, touch: false },
  'desktop-vr-hmd': { name: 'PCVR Tethered HMD (SteamVR / Quest Link / Vive)', type: 'vr_hmd', vrSupported: true, arSupported: false, touch: false },
  'meta-quest': { name: 'Meta Quest 2 / 3 / Pro (Meta Horizon OS)', type: 'vr_hmd', vrSupported: true, arSupported: true, touch: true },
  'apple-vision-pro': { name: 'Apple Vision Pro (visionOS)', type: 'vr_hmd', vrSupported: true, arSupported: true, touch: true },
  'android-arcore': { name: 'Android Smartphone (ARCore Certified / Gyro)', type: 'mobile', vrSupported: false, arSupported: true, touch: true },
  'android-basic': { name: 'Android Smartphone (Basic / No ARCore)', type: 'mobile', vrSupported: false, arSupported: false, touch: true },
  'iphone-arkit': { name: 'Apple iPhone 15/16 Pro (LiDAR ARKit)', type: 'mobile', vrSupported: false, arSupported: true, touch: true },
  'tablet': { name: 'Apple iPad / Android Tablet Device', type: 'tablet', vrSupported: false, arSupported: false, touch: true }
};

let selectedDeviceKey = 'auto';

const selectDeviceEl = document.getElementById('select-device');
if (selectDeviceEl) {
  selectDeviceEl.addEventListener('change', (e) => {
    selectedDeviceKey = e.target.value;
    console.log(`[Wormhole XR] Switched active device profile to: ${selectedDeviceKey}`);
    evaluateSpecificDeviceCompatibility(state.xrMode, false, true);
  });
}

const btnInspectDeviceEl = document.getElementById('btn-inspect-device');
if (btnInspectDeviceEl) {
  btnInspectDeviceEl.addEventListener('click', () => {
    evaluateSpecificDeviceCompatibility(state.xrMode, false, true);
  });
}

async function handleModeChange(mode, bypassCheck = false) {
  state.xrMode = mode;
  await evaluateSpecificDeviceCompatibility(mode, bypassCheck, false);
}

async function evaluateSpecificDeviceCompatibility(mode, bypassCheck = false, forceShowValidation = false) {
  console.log(`[Wormhole XR] Evaluating specific device compatibility for Mode: '${mode}', Device: '${selectedDeviceKey}'`);
  await detectHardwareDiagnostics();

  // Determine effective device parameters based on selection or auto-detection
  let effDevName = detectedHardware.name;
  let effDevType = detectedHardware.type;
  let effVrSupported = detectedHardware.vrSupported;
  let effArSupported = detectedHardware.arSupported;
  let effTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  if (selectedDeviceKey !== 'auto' && DEVICE_PROFILES[selectedDeviceKey]) {
    const prof = DEVICE_PROFILES[selectedDeviceKey];
    effDevName = prof.name;
    effDevType = prof.type;
    effVrSupported = prof.vrSupported;
    effArSupported = prof.arSupported;
    effTouch = prof.touch;
  }

  // Update hardware diagnostics display fields
  detectedHardware.activeDeviceName = effDevName;
  detectedHardware.activeDeviceType = effDevType;

  if (!bypassCheck) {
    let localSupported = true;
    let localReason = '';
    let localRecMode = 'desktop-xr';

    // 1. SPECIFIC CHECK: DESKTOP VR (PCVR / HMD)
    if (mode === 'desktop-vr') {
      if (!effVrSupported || effDevType === 'desktop' || effDevType === 'tablet') {
        localSupported = false;
        localReason = `DESKTOP VR REQUIRES AN ACTIVE VR HEADSET (HMD): Selected device '${effDevName}' has no active 6-DOF OpenXR/PCVR headset connected. WebXR 'immersive-vr' session cannot be started without physical HMD hardware (Meta Quest Link, Valve Index, or HTC Vive).`;
        localRecMode = 'desktop-xr';
      } else if (effDevType === 'mobile') {
        localSupported = false;
        localReason = `DESKTOP VR IS NOT DESIGNED FOR SMARTPHONES: Target mode 'DESKTOP VR' requires a tethered PCVR headset or standalone HMD browser. Mobile devices must use 'MOBILE XR' mode with a Google Cardboard viewer.`;
        localRecMode = 'mobile-xr';
      }
    }

    // 2. SPECIFIC CHECK: MOBILE AR (ARCore Camera Passthrough)
    else if (mode === 'mobile-ar') {
      if (!effArSupported || effDevType === 'desktop') {
        localSupported = false;
        localReason = `MOBILE AR REQUIRES ARCore CAMERA PASSTHROUGH: Selected device '${effDevName}' lacks spatial environmental tracking sensors. Desktop displays and basic phones without Google Play Services for AR (ARCore) or Apple ARKit cannot project holographic passthrough into physical space.`;
        localRecMode = 'desktop-xr';
      }
    }

    // 3. SPECIFIC CHECK: DESKTOP XR (6-DOF Flight)
    else if (mode === 'desktop-xr') {
      if (effDevType === 'mobile' && window.innerHeight > window.innerWidth) {
        localSupported = false;
        localReason = `DESKTOP XR INPUT & ORIENTATION NOTICE: Desktop XR is calibrated for horizontal monitors with keyboard (WASD) and mouse targeting. On smartphones, rotate to horizontal landscape or switch to 'MOBILE XR' for on-screen touch thumbstick controls.`;
        localRecMode = 'mobile-xr';
      }
    }

    // 4. Remote database telemetry check & registration (ALWAYS recorded in database)
    const payload = {
      mode: mode,
      device_name: effDevName,
      device_type: effDevType,
      os_platform: detectedHardware.os,
      browser: detectedHardware.browser,
      gpu_renderer: detectedHardware.gpu,
      immersive_vr: effVrSupported,
      immersive_ar: effArSupported,
      has_touch: effTouch,
      has_gamepad: (typeof navigator.getGamepads === 'function'),
      is_supported: localSupported ? 1 : 0,
      reason: localReason
    };

    let checkResult = null;
    const checkEndpoints = [
      'https://api.calmchessgames.com/wormhole_device_api.php?action=check',
      'https://api.calmchessgames.com/admin/wormhole_device_api.php?action=check',
      'wormhole_device_api.php?action=check',
      '../wormhole_device_api.php?action=check',
      '../admin/wormhole_device_api.php?action=check',
      'admin/wormhole_device_api.php?action=check',
      '/wormhole_device_api.php?action=check'
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
      } catch (e) {}
    }

    // If database marked it unsupported OR local capability check failed
    if ((checkResult && checkResult.supported === false) || !localSupported) {
      const finalReason = (checkResult && checkResult.reason) ? checkResult.reason : localReason;
      showToast(`⚠️ ${mode.toUpperCase()} NOT SUPPORTED: ${finalReason}`);
      return;
    }
  }

  // All checks passed: hide warning modal
  hideUnsupportedBadge();

  // If user explicitly ran "Test Device" or validation succeeded, show positive notification
  if (forceShowValidation || mode === 'desktop-xr') {
    const gpuInfo = detectedHardware.gpu ? ` [${detectedHardware.gpu.split('/')[0].trim()}]` : '';
    showToast(`âœ“ HARDWARE VALIDATED: ${effDevName}${gpuInfo} ready for ${mode.toUpperCase()}`);
    if (audioMgr && audioMgr.playScan) audioMgr.playScan();
  }

  activateModeParameters(mode);
}

async function handleModeChange_old(mode, bypassCheck = false) {
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
      'https://api.calmchessgames.com/wormhole_device_api.php?action=check',
      'https://api.calmchessgames.com/admin/wormhole_device_api.php?action=check',
      'wormhole_device_api.php?action=check',
      '../wormhole_device_api.php?action=check',
      '../admin/wormhole_device_api.php?action=check',
      'admin/wormhole_device_api.php?action=check',
      '/wormhole_device_api.php?action=check'
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

    btnToggleController.textContent = `ðŸŽ® Controller: ${state.gamepadMode.toUpperCase()}`;
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
// MOBILE TOUCH VIRTUAL JOYSTICKS (LEFT: FIRE & FLIGHT, RIGHT: AIM RETICLE)
// =============================================================================
const touchStickZone = document.getElementById('touch-stick-zone');
const touchStickKnob = document.getElementById('touch-stick-knob');
const aimStickZone = document.getElementById('aim-stick-zone');
const aimStickKnob = document.getElementById('aim-stick-knob');
const touchBtnScan = document.getElementById('touch-btn-scan');
const touchBtnWarp = document.getElementById('touch-btn-warp');

let stickCenter = { x: 0, y: 0 };
let aimStickCenter = { x: 0, y: 0 };
const maxStickRadius = 38;

let flightTouchId = null;
let aimTouchId = null;
let flightTouchStartX = 0;
let flightTouchStartY = 0;
let flightTapStartTime = 0;
let isMouseFlight = false;
let mouseFlightStartX = 0;
let mouseFlightStartY = 0;
let mouseFlightStartTime = 0;

// 1. LEFT THUMB JOYSTICK (TAP TO FIRE LASER / HOLD FOR FLIGHT)
if (touchStickZone) {
  touchStickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = touchStickZone.getBoundingClientRect();
    stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.target === touchStickZone || touchStickZone.contains(touch.target)) {
        flightTouchId = touch.identifier;
        flightTouchStartX = touch.clientX;
        flightTouchStartY = touch.clientY;
        flightTapStartTime = performance.now();
        state.touchActive = true;
        // Lock out joystick from activating as flight control for 3 seconds when touched
        state.flightLockoutUntil = flightTapStartTime + 3000;
        updateStickPos(touch.clientX, touch.clientY);
        handleFlightActivity(); // Closes panels if open
        break;
      }
    }
    if (!audioMgr.isInitialized) audioMgr.init();
    lockLandscape();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!state.touchActive) return;
    const touchList = (e.touches && e.touches.length > 0) ? e.touches : e.changedTouches;
    if (touchList) {
      for (let i = 0; i < touchList.length; i++) {
        const touch = touchList[i];
        if (touch.identifier === flightTouchId || touch.target === touchStickZone || touchStickZone.contains(touch.target)) {
          updateStickPos(touch.clientX, touch.clientY);
          handleFlightActivity();

          // Active flight steering check: if user deflects stick > 0.25 and holds > 350ms,
          // release initial touch lockout immediately so flight navigation engages!
          const stickDeflection = Math.hypot(state.touchMove.x, state.touchMove.y);
          const holdDuration = performance.now() - flightTapStartTime;
          if (stickDeflection > 0.25 && holdDuration > 350) {
            if (state.flightLockoutUntil > performance.now()) {
              state.flightLockoutUntil = 0;
            }
          }
          break;
        }
      }
    }
  }, { passive: true });

  const endFlightTouch = (e) => {
    if (!state.touchActive) return;
    let ended = false;
    let endClientX = flightTouchStartX;
    let endClientY = flightTouchStartY;

    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === flightTouchId || (e.touches && e.touches.length === 0)) {
          ended = true;
          endClientX = e.changedTouches[i].clientX;
          endClientY = e.changedTouches[i].clientY;
          break;
        }
      }
    } else {
      ended = true;
    }

    if (ended) {
      const duration = performance.now() - flightTapStartTime;
      const dragDelta = Math.hypot(endClientX - flightTouchStartX, endClientY - flightTouchStartY);
      const wasTap = (duration < 550 && dragDelta < 35);

      state.touchActive = false;
      flightTouchId = null;
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      if (touchStickKnob) touchStickKnob.style.transform = 'translate(0px, 0px)';

      // Switched fire button to left hand joystick:
      // If fire is being tapped, lockout flight control for 1 second resetting each time fire tapped
      if (wasTap) {
        fireLaserBeam();
        state.flightLockoutUntil = performance.now() + 1000;
      }
    }
  };

  window.addEventListener('touchend', endFlightTouch);
  window.addEventListener('touchcancel', endFlightTouch);

  // Mouse interaction for left joystick
  touchStickZone.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = touchStickZone.getBoundingClientRect();
    stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    isMouseFlight = true;
    state.touchActive = true;
    mouseFlightStartX = e.clientX;
    mouseFlightStartY = e.clientY;
    mouseFlightStartTime = performance.now();
    // Lock out for 3 seconds when touched
    state.flightLockoutUntil = mouseFlightStartTime + 3000;
    updateStickPos(e.clientX, e.clientY);
    handleFlightActivity();
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseFlight) {
      updateStickPos(e.clientX, e.clientY);
      handleFlightActivity();

      const stickDeflection = Math.hypot(state.touchMove.x, state.touchMove.y);
      const holdDuration = performance.now() - mouseFlightStartTime;
      if (stickDeflection > 0.25 && holdDuration > 350) {
        if (state.flightLockoutUntil > performance.now()) {
          state.flightLockoutUntil = 0;
        }
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isMouseFlight) {
      const duration = performance.now() - mouseFlightStartTime;
      const dragDelta = Math.hypot(e.clientX - mouseFlightStartX, e.clientY - mouseFlightStartY);
      const wasTap = (duration < 550 && dragDelta < 30);
      isMouseFlight = false;
      state.touchActive = false;
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      if (touchStickKnob) touchStickKnob.style.transform = 'translate(0px, 0px)';
      if (wasTap) {
        fireLaserBeam();
        state.flightLockoutUntil = performance.now() + 1000;
      }
    }
  });

  // Direct click / tap backup on left stick to fire laser and lockout for 1s
  touchStickZone.addEventListener('click', (e) => {
    e.preventDefault();
    handleFlightActivity();
    fireLaserBeam();
    state.flightLockoutUntil = performance.now() + 1000;
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

  // Dead zone
  if (clampedDist < 8) {
    state.touchMove.x = 0;
    state.touchMove.y = 0;
  } else {
    state.touchMove.x = (knobX / maxStickRadius);
    state.touchMove.y = (knobY / maxStickRadius);
  }
}

// 2. RIGHT THUMB AIM JOYSTICK (RAPIDLY MOVES CROSSHAIR RETICLE)
if (aimStickZone) {
  aimStickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = aimStickZone.getBoundingClientRect();
    aimStickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.target === aimStickZone || aimStickZone.contains(touch.target)) {
        aimTouchId = touch.identifier;
        state.aimActive = true;
        updateAimStickPos(touch.clientX, touch.clientY);
        handleFlightActivity(); // Closes all panels if open!
        break;
      }
    }
    if (!audioMgr.isInitialized) audioMgr.init();
    lockLandscape();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!state.aimActive) return;
    const touchList = (e.touches && e.touches.length > 0) ? e.touches : e.changedTouches;
    if (touchList) {
      for (let i = 0; i < touchList.length; i++) {
        const touch = touchList[i];
        if (touch.identifier === aimTouchId || touch.target === aimStickZone || (aimStickZone && aimStickZone.contains(touch.target))) {
          updateAimStickPos(touch.clientX, touch.clientY);
          handleFlightActivity(); // Closes all panels if open!
          break;
        }
      }
    }
  }, { passive: true });

  const endAimTouch = (e) => {
    if (!state.aimActive) return;
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === aimTouchId || e.touches.length === 0) {
          state.aimActive = false;
          aimTouchId = null;
          state.aimMove.x = 0;
          state.aimMove.y = 0;
          if (aimStickKnob) aimStickKnob.style.transform = 'translate(0px, 0px)';
          break;
        }
      }
    } else {
      state.aimActive = false;
      aimTouchId = null;
      state.aimMove.x = 0;
      state.aimMove.y = 0;
      if (aimStickKnob) aimStickKnob.style.transform = 'translate(0px, 0px)';
    }
  };

  window.addEventListener('touchend', endAimTouch);
  window.addEventListener('touchcancel', endAimTouch);

  // Mouse interaction for Aim stick (desktop testing and dragging aim)
  let isMouseAim = false;
  aimStickZone.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = aimStickZone.getBoundingClientRect();
    aimStickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    isMouseAim = true;
    state.aimActive = true;
    updateAimStickPos(e.clientX, e.clientY);
    handleFlightActivity(); // Closes all panels if open!
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseAim) {
      updateAimStickPos(e.clientX, e.clientY);
      handleFlightActivity(); // Closes all panels if open!
    }
  });

  window.addEventListener('mouseup', () => {
    if (isMouseAim) {
      isMouseAim = false;
      state.aimActive = false;
      state.aimMove.x = 0;
      state.aimMove.y = 0;
      if (aimStickKnob) aimStickKnob.style.transform = 'translate(0px, 0px)';
    }
  });

  aimStickZone.addEventListener('click', (e) => {
    e.preventDefault();
    handleFlightActivity();
  });
}

function updateAimStickPos(clientX, clientY) {
  const dx = clientX - aimStickCenter.x;
  const dy = clientY - aimStickCenter.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const clampedDist = Math.min(dist, maxStickRadius);

  const knobX = Math.cos(angle) * clampedDist;
  const knobY = Math.sin(angle) * clampedDist;

  if (aimStickKnob) {
    aimStickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }

  // Velocity factor: -1.0 to 1.0
  state.aimMove.x = knobX / maxStickRadius;
  state.aimMove.y = knobY / maxStickRadius;
}

// 3. NEON RED LASER CANNON SYSTEM & CROSSHAIR RETICLE TRACKER
const laserBolts = [];

function fireLaserBeam() {
  if (!scene || !camera) return;
  const now = performance.now();
  if (now - state.lastLaserShotTime < 110) return; // Shot rate throttling
  state.lastLaserShotTime = now;

  // Sound synthesis
  if (!audioMgr.isInitialized) audioMgr.init();
  audioMgr.playLaser();

  // Crosshair visual blast animation
  const crosshairEl = document.getElementById('center-crosshair');
  if (crosshairEl) {
    crosshairEl.classList.remove('laser-firing');
    void crosshairEl.offsetWidth; // Reflow
    crosshairEl.classList.add('laser-firing');
    setTimeout(() => {
      crosshairEl.classList.remove('laser-firing');
    }, 180);
  }

  // 3D Direction raycast from dynamic crosshair screen coordinates
  const ndcX = (state.crosshair.x / window.innerWidth) * 2 - 1;
  const ndcY = -(state.crosshair.y / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  // Target point 1200 units deep into cosmos
  const targetPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(1200));

  // Ship blaster cannons (alternating left / right wingtips)
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();

  if (typeof fireLaserBeam.cannonSide === 'undefined') fireLaserBeam.cannonSide = 1;
  fireLaserBeam.cannonSide = -fireLaserBeam.cannonSide;
  const sideOffset = fireLaserBeam.cannonSide * 0.45;

  const spawnOrigin = camera.position.clone()
    .addScaledVector(forward, 0.8)
    .addScaledVector(right, sideOffset)
    .addScaledVector(up, -0.25);

  const direction = new THREE.Vector3().subVectors(targetPoint, spawnOrigin).normalize();

  // Glowing Neon Red Laser Beam Geometry
  const boltLength = 7.5;
  const boltRadius = 0.14;
  const geometry = new THREE.CylinderGeometry(boltRadius * 0.35, boltRadius, boltLength, 8);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: 0xff0033,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(spawnOrigin);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

  // White-hot plasma core
  const coreGeom = new THREE.CylinderGeometry(boltRadius * 0.15, boltRadius * 0.35, boltLength * 0.92, 6);
  coreGeom.rotateX(Math.PI / 2);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  mesh.add(coreMesh);

  // Dynamic laser point light glow
  const light = new THREE.PointLight(0xff0033, 3.5, 35);
  light.position.set(0, 0, 0);
  mesh.add(light);

  scene.add(mesh);

  laserBolts.push({
    mesh,
    geometry,
    material,
    coreGeom,
    coreMat,
    light,
    direction,
    speed: 550, // units per second
    spawnTime: now,
    lifetime: 2.2 // seconds
  });
}

function updateLaserBolts(delta) {
  const now = performance.now();
  for (let i = laserBolts.length - 1; i >= 0; i--) {
    const bolt = laserBolts[i];
    bolt.mesh.position.addScaledVector(bolt.direction, bolt.speed * delta);
    if ((now - bolt.spawnTime) * 0.001 > bolt.lifetime) {
      scene.remove(bolt.mesh);
      bolt.geometry.dispose();
      bolt.material.dispose();
      bolt.coreGeom.dispose();
      bolt.coreMat.dispose();
      if (bolt.light) bolt.mesh.remove(bolt.light);
      laserBolts.splice(i, 1);
    }
  }
}

function updateCrosshairPosition(delta) {
  // Move crosshair quickly when aim stick is tilted (speed scaled by slider multiplier)
  if (state.aimActive && (state.aimMove.x !== 0 || state.aimMove.y !== 0)) {
    const baseSpeed = Math.max(window.innerWidth, window.innerHeight);
    const speed = baseSpeed * (state.crosshairSpeedMultiplier || 2.90);
    state.crosshair.x += state.aimMove.x * speed * delta;
    state.crosshair.y += state.aimMove.y * speed * delta;

    const margin = 20;
    state.crosshair.x = Math.max(margin, Math.min(window.innerWidth - margin, state.crosshair.x));
    state.crosshair.y = Math.max(margin, Math.min(window.innerHeight - margin, state.crosshair.y));
  }

  const crosshairEl = document.getElementById('center-crosshair');
  if (crosshairEl) {
    crosshairEl.style.left = `${state.crosshair.x}px`;
    crosshairEl.style.top = `${state.crosshair.y}px`;
  }
  const vectorRing = document.getElementById('vector-alignment-ring');
  if (vectorRing) {
    vectorRing.style.left = `${state.crosshair.x}px`;
    vectorRing.style.top = `${state.crosshair.y}px`;
  }
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

  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    handleFlightActivity();
  }

  if (e.code === 'KeyF') {
    triggerWarpJump();
  }
  if (e.code === 'KeyX') {
    fireLaserBeam();
  }
  if (e.code === 'KeyZ' || e.code === 'KeyN') {
    alignToWormhole();
  }
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'].includes(e.code)) {
    state.isAligningToWormhole = false;
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
    mouseLockBtn.textContent = state.isPointerLocked ? 'ðŸŽ¯ MOUSE LOCKED (ESC)' : 'ðŸŽ¯ Flight Mouse';
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

// Auto-Align View to Wormhole Singularity (Smooth shortest-arc alignment with zero swinging)
function alignToWormhole() {
  if (!camera) return;

  // If inside or dangerously close to event horizon, place safely at observation distance
  if (camera.position.length() < 15.0) {
    camera.position.set(0, 2.5, CONFIG.wormholeDistance);
    state.position.copy(camera.position);
  }

  // Dampen translation drift so view stabilization doesn't fight centrifugal motion
  state.velocity.multiplyScalar(0.25);

  const toWormhole = new THREE.Vector3(0, 0, 0).sub(camera.position);
  if (toWormhole.lengthSq() < 0.001) {
    toWormhole.set(0, 0, -1);
  } else {
    toWormhole.normalize();
  }

  const rawTargetYaw = Math.atan2(-toWormhole.x, -toWormhole.z);
  const rawTargetPitch = Math.asin(Math.max(-0.95, Math.min(0.95, toWormhole.y)));

  // Calculate shortest angular path from current state.yaw (avoids 360-degree swing / modulo glitches)
  let diff = (rawTargetYaw - state.yaw) % (Math.PI * 2);
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  state.targetYaw = state.yaw + diff;
  state.targetPitch = rawTargetPitch;
  state.isAligningToWormhole = true;
  showToast('🧭 ALIGNING VIEW WITH WORMHOLE SINGULARITY');
}

// Mobile Touch Drag Camera Look / Rotate Controls
let touchLookId = null;
let touchLookLastX = 0;
let touchLookLastY = 0;

window.addEventListener('touchstart', (e) => {
  if (state.isXR) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    // Ignore touches starting inside interactive controls, joysticks, drawer panels, or buttons
    if (t.target.closest('#mobile-touch-controls, .virtual-stick-zone, .drawer-panel, .drawer-tab-handle, .top-strip-handle, .bottom-strip-handle, .hud-btn, button, input, select, .center-crosshair')) {
      continue;
    }
    if (touchLookId === null) {
      touchLookId = t.identifier;
      touchLookLastX = t.clientX;
      touchLookLastY = t.clientY;
      state.isAligningToWormhole = false;
      break;
    }
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (touchLookId === null) return;
  const touchList = (e.touches && e.touches.length > 0) ? e.touches : e.changedTouches;
  if (!touchList) return;
  for (let i = 0; i < touchList.length; i++) {
    const t = touchList[i];
    if (t.identifier === touchLookId) {
      const deltaX = t.clientX - touchLookLastX;
      const deltaY = t.clientY - touchLookLastY;
      touchLookLastX = t.clientX;
      touchLookLastY = t.clientY;
      state.yaw -= deltaX * CONFIG.yawSpeed * 1.6;
      state.pitch -= deltaY * CONFIG.pitchSpeed * 1.6;
      state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));
      state.isAligningToWormhole = false;
      break;
    }
  }
}, { passive: true });

const endTouchLook = (e) => {
  if (touchLookId === null) return;
  if (e.changedTouches) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchLookId || (e.touches && e.touches.length === 0)) {
        touchLookId = null;
        break;
      }
    }
  } else {
    touchLookId = null;
  }
};
window.addEventListener('touchend', endTouchLook);
window.addEventListener('touchcancel', endTouchLook);

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
        btnScan.textContent = 'âœ“ Scanned';
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
      warpBtn.innerHTML = 'âš¡ ENGAGE WARP JUMP [F]';
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

// Crosshair Speed Slider in Flight Control Panel & Bottom Drawer
const crosshairSpeedSlider = document.getElementById('slider-crosshair-speed');
const crosshairSpeedValDisplay = document.getElementById('val-crosshair-speed');
const crosshairSpeedSliderBottom = document.getElementById('slider-crosshair-speed-bottom');
const crosshairSpeedValDisplayBottom = document.getElementById('val-crosshair-speed-bottom');

function updateCrosshairSpeedMultiplier(val) {
  const num = parseFloat(val);
  state.crosshairSpeedMultiplier = num;
  const formatted = num.toFixed(2) + 'x';
  if (crosshairSpeedSlider) crosshairSpeedSlider.value = num;
  if (crosshairSpeedValDisplay) crosshairSpeedValDisplay.textContent = formatted;
  if (crosshairSpeedSliderBottom) crosshairSpeedSliderBottom.value = num;
  if (crosshairSpeedValDisplayBottom) crosshairSpeedValDisplayBottom.textContent = formatted;
}

if (crosshairSpeedSlider) {
  crosshairSpeedSlider.addEventListener('input', (e) => {
    updateCrosshairSpeedMultiplier(e.target.value);
  });
}
if (crosshairSpeedSliderBottom) {
  crosshairSpeedSliderBottom.addEventListener('input', (e) => {
    updateCrosshairSpeedMultiplier(e.target.value);
  });
}

// Left-Handed Mode (Flip On-Screen Touch Controls)
function setLeftHandedMode(enabled) {
  state.leftHandedMode = !!enabled;
  document.body.classList.toggle('left-handed-controls', state.leftHandedMode);
  const touchControls = document.getElementById('mobile-touch-controls');
  if (touchControls) {
    touchControls.classList.toggle('left-handed', state.leftHandedMode);
  }
  const chkLeft = document.getElementById('chk-left-handed');
  if (chkLeft) chkLeft.checked = state.leftHandedMode;
  const chkLeftBottom = document.getElementById('chk-left-handed-bottom');
  if (chkLeftBottom) chkLeftBottom.checked = state.leftHandedMode;

  try {
    localStorage.setItem('wormhole_left_handed', state.leftHandedMode ? '1' : '0');
  } catch (e) {}

  showToast(state.leftHandedMode ? 'LEFT-HANDED LAYOUT ACTIVATED' : 'STANDARD LAYOUT ACTIVATED');
}

const chkLeftHanded = document.getElementById('chk-left-handed');
if (chkLeftHanded) {
  chkLeftHanded.addEventListener('change', (e) => {
    setLeftHandedMode(e.target.checked);
  });
}
const chkLeftHandedBottom = document.getElementById('chk-left-handed-bottom');
if (chkLeftHandedBottom) {
  chkLeftHandedBottom.addEventListener('change', (e) => {
    setLeftHandedMode(e.target.checked);
  });
}

try {
  if (localStorage.getItem('wormhole_left_handed') === '1') {
    setLeftHandedMode(true);
  }
} catch (e) {}

const toggleAudioBtn = document.getElementById('btn-toggle-audio');
if (toggleAudioBtn) {
  toggleAudioBtn.addEventListener('click', () => {
    audioMgr.init();
    CONFIG.audioMuted = !CONFIG.audioMuted;
    if (CONFIG.audioMuted) {
      audioMgr.stopDrone();
      toggleAudioBtn.innerHTML = '<span class="icon">ðŸ”‡</span> Audio: OFF';
      toggleAudioBtn.classList.remove('active');
    } else {
      audioMgr.playDrone();
      toggleAudioBtn.innerHTML = '<span class="icon">ðŸ”Š</span> Audio: ON (.wav)';
      toggleAudioBtn.classList.add('active');
    }
  });
}

const toggleHudBtn = document.getElementById('btn-toggle-hud');
const flightPanel = document.getElementById('flight-panel');
if (toggleHudBtn) {
  toggleHudBtn.addEventListener('click', () => {
    state.hudVisible = !state.hudVisible;
    const hudLayer = document.getElementById('hud-layer');
    if (hudLayer) hudLayer.style.display = state.hudVisible ? 'block' : 'none';
    if (!state.hudVisible) {
      closeAllPanels();
      showToast('HUD DISPLAY: MINIMIZED');
    } else {
      showToast('HUD DISPLAY: ON');
    }
  });
}

// =============================================================================
// ANIMATION & RENDER PIPELINE
// =============================================================================
const tempVec = new THREE.Vector3();
const wormholeScreenVec = new THREE.Vector3();

function renderPostProcessing() {
  if (!state.postProcessingEnabled || !sceneRenderTarget) {
    renderer.render(scene, camera);
    return;
  }
  try {
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
  } catch (err) {
    console.warn('[Wormhole XR] Post-processing render failed, disabling:', err);
    state.postProcessingEnabled = false;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }
}

function updateFlight(delta) {
  if (state.isAligningToWormhole) {
    const yawStep = state.targetYaw - state.yaw;
    const pitchStep = state.targetPitch - state.pitch;
    const factor = Math.min(1.0, delta * 7.5);
    state.yaw += yawStep * factor;
    state.pitch += pitchStep * factor;

    if (Math.abs(yawStep) < 0.005 && Math.abs(pitchStep) < 0.005) {
      state.yaw = state.targetYaw;
      state.pitch = state.targetPitch;
      state.isAligningToWormhole = false;
      showToast('🎯 WORMHOLE SINGULARITY CENTERED IN SIGHT');
    }
  }

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

  // Active flight steering check: if user deflects stick > 0.25 and holds > 350ms,
  // release initial touch lockout immediately so flight navigation engages!
  if (state.touchActive) {
    const stickDeflection = Math.hypot(state.touchMove.x, state.touchMove.y);
    const holdDuration = performance.now() - (isMouseFlight ? mouseFlightStartTime : flightTapStartTime);
    if (stickDeflection > 0.25 && holdDuration > 350) {
      if (state.flightLockoutUntil > performance.now()) {
        state.flightLockoutUntil = 0;
      }
    }
  }

  // Left joystick flight control lockout check (3s on initial touch, 1s resetting on fire tap)
  const isFlightLockedOut = performance.now() < state.flightLockoutUntil;
  if (touchStickZone) {
    if (isFlightLockedOut && state.touchActive) {
      touchStickZone.classList.add('flight-locked');
    } else {
      touchStickZone.classList.remove('flight-locked');
    }
  }

  if (state.touchActive && !isFlightLockedOut) {
    // Top of stick (touchMove.y < 0): move forward AND move down in 3D space
    accel.addScaledVector(forward, -state.touchMove.y);
    accel.addScaledVector(up, state.touchMove.y); // Negative when at top -> dives/moves down
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
      showToast('⚡ SINGULARITY TRANSIT ACHIEVED - STAGE 2 UNLOCKED');
      state.position.set(0, 2.5, CONFIG.wormholeDistance);
      camera.position.copy(state.position);
      state.velocity.set(0, 0, 0);
      state.yaw = 0;
      state.pitch = 0;
      state.isHyperWarping = false;
    }
  } else {
    if (accel.lengthSq() > 0) {
      accel.normalize();
      state.velocity.addScaledVector(accel, speed * delta * 4.0);
    }
    state.velocity.multiplyScalar(0.92);
    camera.position.addScaledVector(state.velocity, delta);

    // Sublight navigation: allow flying right up to the accretion disk and event horizon
    // Hold safe standoff radius outside event horizon so the player can orbit and look around
    const distToCenter = camera.position.length();
    const minSafeDist = CONFIG.eventHorizonRadius * 1.35;
    if (distToCenter < minSafeDist) {
      camera.position.normalize().multiplyScalar(minSafeDist);
      state.velocity.multiplyScalar(0.5);
    }
  }

  state.position.copy(camera.position);

  const distLength = state.position.length();
  const distKm = Math.round(distLength * 420);
  if (hudDistEl) hudDistEl.textContent = `${distKm.toLocaleString()} KM`;

  const toWormhole = distLength > 0.01
    ? new THREE.Vector3(0, 0, 0).sub(state.position).normalize()
    : new THREE.Vector3(0, 0, -1);
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

// Nav Lock and Align Button Wiring
const btnAlignWormhole = document.getElementById('btn-align-wormhole');
if (btnAlignWormhole) {
  btnAlignWormhole.addEventListener('click', (e) => {
    e.preventDefault();
    alignToWormhole();
  });
}
const btnDrawerAlign = document.getElementById('btn-drawer-align');
if (btnDrawerAlign) {
  btnDrawerAlign.addEventListener('click', (e) => {
    e.preventDefault();
    alignToWormhole();
  });
}

// Main Animation Loop
if (renderer) {
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

  updateCrosshairPosition(delta);
  updateLaserBolts(delta);

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
  if (wormholeCorona) {
    const pulseScale = 82.0 + Math.sin(state.time * 2.2) * 6.0;
    wormholeCorona.scale.set(pulseScale, pulseScale, 1.0);
  }

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

}

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

  state.crosshair.x = Math.max(20, Math.min(w - 20, state.crosshair.x));
  state.crosshair.y = Math.max(20, Math.min(h - 20, state.crosshair.y));
});

// Splash Screen & Multi-Platform Runtime Verification Runner
// Physical Gamepad Detection for Splash Screen & HUD
function updateSplashGamepadStatus() {
  const badge = document.getElementById('state-badge-controller');
  if (!badge) return;
  const gamepads = (typeof navigator.getGamepads === 'function') ? navigator.getGamepads() : [];
  let foundPad = null;
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].connected) {
      foundPad = gamepads[i];
      break;
    }
  }
  if (foundPad) {
    const padName = foundPad.id.length > 16 ? foundPad.id.slice(0, 16) + '...' : foundPad.id;
    badge.textContent = `✓ ${padName} DETECTED`;
    badge.className = 'splash-mode-pill pill-supported';
    const cell = document.getElementById('splash-controller-cell');
    if (cell) cell.style.borderColor = 'rgba(6, 214, 160, 0.6)';
  } else {
    badge.textContent = 'STANDBY (TOUCH / KB)';
    badge.className = 'splash-mode-pill pill-checking';
  }
}
window.addEventListener('gamepadconnected', (e) => {
  updateSplashGamepadStatus();
  showToast(`🎮 GAMEPAD CONNECTED: ${e.gamepad.id.slice(0, 18)}`);
});
window.addEventListener('gamepaddisconnected', () => {
  updateSplashGamepadStatus();
});

async function runStartupDiagnosticsAndSplashScreen() {
  const splashEl = document.getElementById('wormhole-splash-screen');
  const splashStatus = document.getElementById('splash-status-text');
  const splashBar = document.getElementById('splash-progress-bar');
  const stateDesktop = document.getElementById('state-badge-desktop');
  const stateMobile = document.getElementById('state-badge-mobile');
  const stateVr = document.getElementById('state-badge-vr');
  const stateAr = document.getElementById('state-badge-ar');

  try {
    if (splashStatus) splashStatus.textContent = 'PROBING GRAPHICS HARDWARE ACCELERATION...';
    if (splashBar) splashBar.style.width = '25%';

    // 1. Test WebGL Runnable Capability
    const webglCheck = checkWebGLSupport();
    const isWebglRunnable = webglCheck.supported && !webglInitError;

    // 2. Hardware profile detection
    await detectHardwareDiagnostics();
    const descriptiveName = detectedHardware.descriptiveName || getDescriptiveDeviceName();
    detectedHardware.descriptiveName = descriptiveName;

    if (splashBar) splashBar.style.width = '50%';
    if (splashStatus) splashStatus.textContent = 'TESTING RUNTIME CAPABILITIES (MOBILE, DESKTOP, VR, ARCORE)...';

    const isVrSupported = detectedHardware.vrSupported;
    const isArSupported = detectedHardware.arSupported;
    const isMobileDevice = detectedHardware.type === 'mobile' || detectedHardware.type === 'tablet';
    const isDesktopDevice = detectedHardware.type === 'desktop';

    // Update Splash Capability Badges
    if (stateDesktop) {
      if (isDesktopDevice && isWebglRunnable) {
        stateDesktop.textContent = 'READY';
        stateDesktop.className = 'splash-mode-pill pill-supported';
      } else {
        stateDesktop.textContent = isWebglRunnable ? 'COMPATIBLE' : 'UNSUPPORTED';
        stateDesktop.className = `splash-mode-pill ${isWebglRunnable ? 'pill-checking' : 'pill-unsupported'}`;
      }
    }

    if (stateMobile) {
      if (isMobileDevice && isWebglRunnable) {
        stateMobile.textContent = 'READY';
        stateMobile.className = 'splash-mode-pill pill-supported';
      } else {
        stateMobile.textContent = isWebglRunnable ? 'STANDBY' : 'UNSUPPORTED';
        stateMobile.className = `splash-mode-pill ${isWebglRunnable ? 'pill-checking' : 'pill-unsupported'}`;
      }
    }

    if (stateVr) {
      stateVr.textContent = isVrSupported ? 'READY' : 'UNAVAILABLE';
      stateVr.className = `splash-mode-pill ${isVrSupported ? 'pill-supported' : 'pill-unsupported'}`;
    }

    if (stateAr) {
      stateAr.textContent = isArSupported ? 'ARCore READY' : 'UNAVAILABLE';
      stateAr.className = `splash-mode-pill ${isArSupported ? 'pill-supported' : 'pill-unsupported'}`;
    }

    if (splashBar) splashBar.style.width = '75%';
    if (splashStatus) splashStatus.textContent = 'SYNCING WORMHOLE DEVICE DATABASE REGISTRY...';

    // 3. Remote Telemetry Check with database
    const initialMode = isMobileDevice ? 'mobile-xr' : (detectedHardware.type === 'vr_hmd' ? 'desktop-vr' : 'desktop-xr');
    const dbPayload = {
      action: 'check',
      mode: initialMode,
      device_name: descriptiveName,
      device_type: detectedHardware.type,
      os_platform: detectedHardware.os,
      browser: detectedHardware.browser,
      gpu_renderer: detectedHardware.gpu,
      immersive_vr: isVrSupported,
      immersive_ar: isArSupported,
      has_touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
      has_gamepad: (typeof navigator.getGamepads === 'function'),
      is_supported: isWebglRunnable ? 1 : 0,
      reason: isWebglRunnable ? '' : webglCheck.reason
    };

    let dbResult = null;
    const endpoints = [
      'https://api.calmchessgames.com/wormhole_device_api.php?action=check',
      'https://api.calmchessgames.com/admin/wormhole_device_api.php?action=check',
      'wormhole_device_api.php?action=check',
      '../wormhole_device_api.php?action=check',
      '../admin/wormhole_device_api.php?action=check',
      'admin/wormhole_device_api.php?action=check',
      '/wormhole_device_api.php?action=check'
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(dbPayload)
        });
        if (res && res.ok) {
          dbResult = await res.json().catch(() => null);
          if (dbResult) break;
        }
      } catch (e) {}
    }

    if (splashBar) splashBar.style.width = '100%';

    // 4. Verify whether device is runnable on current mobile, desktop, vr, or arcore
    const isBlacklisted = (dbResult && dbResult.supported === false && dbResult.reason && dbResult.reason.includes('incompatible'));
    const isRunnable = isWebglRunnable && !isBlacklisted;

    if (!isRunnable) {
      const failureReason = !isWebglRunnable 
        ? (webglCheck.reason || 'Hardware graphics acceleration (WebGL) is unavailable on this device.')
        : (dbResult && dbResult.reason ? dbResult.reason : 'Device flagged as unsupported in system database.');

      if (splashStatus) splashStatus.textContent = 'HARDWARE INCOMPATIBLE - DISPLAYING UNSUPPORTED BADGE';

      // Record device as unsupported in database
      await reportUnsupportedDeviceTelemetry(descriptiveName, failureReason);

      setTimeout(() => {
        if (splashEl) {
          splashEl.classList.add('splash-fade-out');
          setTimeout(() => splashEl.remove(), 750);
        }
        showUnsupportedBadge(initialMode, failureReason, 'desktop-xr', true);
      }, 500);
      return false;
    }

    // 5. Device is RUNNABLE! Enable Start Game Button
    updateSplashGamepadStatus();
    if (splashStatus) splashStatus.textContent = 'SYSTEMS NOMINAL - READY TO ENTER COCKPIT';

    state.xrMode = initialMode;
    const selectModeEl = document.getElementById('select-mode');
    if (selectModeEl) selectModeEl.value = initialMode;
    activateModeParameters(state.xrMode);

    const startBtn = document.getElementById('btn-splash-start');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '🚀 START MISSION / ENTER COCKPIT';
      startBtn.title = 'Click or press Enter/Space to launch mission';
      startBtn.classList.add('btn-ready');

      const launchGame = () => {
        if (startBtn.dataset.launched) return;
        startBtn.dataset.launched = 'true';
        if (!audioMgr.isInitialized) audioMgr.init();
        lockLandscape();
        if (splashEl) {
          splashEl.classList.add('splash-fade-out');
          setTimeout(() => splashEl.remove(), 750);
        }
        showToast(`✓ FLIGHT ACTIVE: ${descriptiveName}`);
      };

      startBtn.addEventListener('click', launchGame);
      window.addEventListener('keydown', (e) => {
        if ((e.code === 'Enter' || e.code === 'Space') && splashEl && splashEl.parentNode) {
          launchGame();
        }
      });
    }

    return true;
  } catch (err) {
    console.error('[Wormhole XR] Startup verification exception:', err);
    const descriptiveName = getDescriptiveDeviceName();
    await reportUnsupportedDeviceTelemetry(descriptiveName, 'Startup runtime error: ' + err.message);
    showUnsupportedBadge('mobile-xr', 'Hardware error during startup: ' + err.message, 'desktop-xr', true);
    if (splashEl) splashEl.remove();
    return false;
  }
}

// Window exports for verification & diagnostics
if (typeof window !== 'undefined') {
  window.state = state;
  window.laserBolts = laserBolts;
  window.fireLaserBeam = fireLaserBeam;
  window.updateCrosshairPosition = updateCrosshairPosition;
  window.isFlightControlLocked = () => performance.now() < state.flightLockoutUntil;
  window.updateCrosshairSpeedMultiplier = updateCrosshairSpeedMultiplier;
  window.alignToWormhole = alignToWormhole;
  window.setLeftHandedMode = setLeftHandedMode;
  window.updateSplashGamepadStatus = updateSplashGamepadStatus;
}

runStartupDiagnosticsAndSplashScreen();
