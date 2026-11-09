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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

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

// Dynamic Multi-Stage Device System Configuration
const STAGE_REGISTRY = {
  1: { level: 1, name: 'Warp Origin', slug: 'warp_origin' },
  2: { level: 2, name: 'Event Horizon', slug: 'event_horizon' },
  3: { level: 3, name: 'Singularity Core', slug: 'singularity_core' },
  4: { level: 4, name: 'Quantum Realm', slug: 'quantum_realm' }
};

let currentActiveStage = 1;
let currentActiveDeviceType = 'desktop';
let activeStageModule = null;

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
  hasStarted: false,
  isPaused: false,
  isCountdownActive: false,
  
  // Panel state
  autoClose: true,
  
  // Player Position & Dynamics
  position: new THREE.Vector3(0, 0, CONFIG.wormholeDistance),
  velocity: new THREE.Vector3(0, 0, 0),
  pitch: 0,
  yaw: 0,
  isPointerLocked: false,
  isMouseDown: false,
  isLeftMouseDown: false,
  isRightMouseDown: false,
  lastPointerLockExitTime: 0,
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

  // Right Joystick Flight Lockout Timer (3s on touch before navigating, 3s resetting on fire tap)
  flightLockoutUntil: 0,

  // Crosshair Aim speed multiplier (default 4.00, max 10.00)
  crosshairSpeedMultiplier: 4.00,

  // Mobile Crosshair Movement Controls Auto-Hiding State
  mobileControlsHidden: false,

  // Wormhole Nav Lock State
  isAligningToWormhole: false,
  targetYaw: 0,
  targetPitch: 0,

  // Custom Cruise Throttle Slider State (-1.0 reverse to +1.0 forward, default 0 in center)
  throttleValue: 0,
  throttleLocked: false,
  throttleLockoutUntil: 0,

  // Automated Thruster Rotation State (180° and 360°)
  isExecuting360Turn: false,
  isExecuting180Turn: false,
  activeTurnType: null, // '180' or '360'
  turn360Accumulated: 0,
  turn360Target: Math.PI * 2,
  turnRotationAccumulated: 0,
  turnRotationTarget: Math.PI * 2,

  // Laser Engine Halt Notification State
  laserEngineHaltNotified: false,

  // Left-Handed Touch Control Layout
  leftHandedMode: false,

  // Mobile Invisible Full-Screen Targeting Snap Grid
  showTargetGrid: false,
  
  // Gamepad State
  gamepadIndex: null,
  gamepadMode: 'auto', // 'auto', 'enabled', 'disabled'
  lastPadButtons: {},
  
  // Mission Objectives & Combat Defense State
  playerShield: 100,
  playerHealth: 100,
  maxShield: 100,
  maxHealth: 100,
  isGameOver: false,
  stagePowerups: [],
  score: 0,
  stageKills: 0,
  stageRequiredKills: 10,
  stageTargetDistance: 50000,
  stageMissionBriefing: '',
  activeStageObjectives: [],
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
let cameraRig = null;
let activeVrFrameHook = null;
let xrBasePoseCaptured = false;
const xrBaseHmdPos = new THREE.Vector3();

const controllers = [];
const controllerGrips = [];
const controllerLasers = [];

try {
  const probe = checkWebGLSupport();
  if (!probe.supported) {
    webglInitError = new Error(probe.reason);
  } else {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01050a, 0.0006);

    cameraRig = new THREE.Group();
    cameraRig.name = 'vr-camera-rig';
    scene.add(cameraRig);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 8000);
    camera.position.copy(state.position);
    cameraRig.add(camera);
    window.camera = camera;
    window.cameraRig = cameraRig;
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
    if (typeof renderer.xr.setReferenceSpaceType === 'function') {
      renderer.xr.setReferenceSpaceType('local');
    }
    if (container) container.appendChild(renderer.domElement);

    // WebXR Button - Configure sessionInit for XRWebGLLayer (no 'layers' projection override) + DOM Overlay
    try {
      if (navigator.xr) {
        const normalizeXrSessionInit = (mode, init) => {
          const base = init ? Object.assign({}, init) : {};
          const opt = Array.isArray(base.optionalFeatures)
            ? base.optionalFeatures.filter(f => f !== 'layers')
            : ['local-floor', 'bounded-floor', 'hand-tracking'];
          if (!opt.includes('dom-overlay')) opt.push('dom-overlay');
          base.optionalFeatures = opt;
          if (!base.domOverlay && typeof document !== 'undefined' && document.body) {
            base.domOverlay = { root: document.body };
          }
          return base;
        };
        if (typeof navigator.xr.requestSession === 'function' && !navigator.xr.__wormholePatched) {
          const origReq = navigator.xr.requestSession.bind(navigator.xr);
          navigator.xr.requestSession = async function (mode, init) {
            const patchedInit = normalizeXrSessionInit(mode, init);
            try {
              return await origReq(mode, patchedInit);
            } catch (err) {
              const fallbackInit = init ? Object.assign({}, init) : {};
              if (Array.isArray(fallbackInit.optionalFeatures)) {
                fallbackInit.optionalFeatures = fallbackInit.optionalFeatures.filter(f => f !== 'layers' && f !== 'dom-overlay');
              }
              delete fallbackInit.domOverlay;
              return await origReq(mode, fallbackInit);
            }
          };
          if (typeof navigator.xr.offerSession === 'function') {
            const origOffer = navigator.xr.offerSession.bind(navigator.xr);
            navigator.xr.offerSession = async function (mode, init) {
              const patchedInit = normalizeXrSessionInit(mode, init);
              try {
                return await origOffer(mode, patchedInit);
              } catch (err) {
                const fallbackInit = init ? Object.assign({}, init) : {};
                if (Array.isArray(fallbackInit.optionalFeatures)) {
                  fallbackInit.optionalFeatures = fallbackInit.optionalFeatures.filter(f => f !== 'layers' && f !== 'dom-overlay');
                }
                delete fallbackInit.domOverlay;
                return await origOffer(mode, fallbackInit);
              }
            };
          }
          navigator.xr.__wormholePatched = true;
        }
      }
      vrBtn = VRButton.createButton(renderer);
      vrBtn.id = 'xr-enter-btn';
      vrBtn.style.display = 'none';
      if (vrBtn && (!vrBtn.textContent || !vrBtn.textContent.includes('NOT SUPPORTED'))) {
        document.body.appendChild(vrBtn);
      }
    } catch (e) {}

    renderer.xr.addEventListener('sessionstart', () => {
      state.isXR = true;
      state.hasStarted = true;
      state.hudVisible = true;
      xrBasePoseCaptured = false;
      xrBaseHmdPos.set(0, 0, 0);
      document.body.classList.add('in-xr-session');

      if (document.pointerLockElement) {
        try { document.exitPointerLock(); } catch (e) {}
      }
      state.isPointerLocked = false;

      const splashEl = document.getElementById('wormhole-splash-screen');
      if (splashEl) {
        splashEl.classList.add('splash-fade-out');
        splashEl.style.display = 'none';
      }

      if (state.position.length() < 15.0) {
        state.position.set(0, 0, CONFIG.wormholeDistance);
      }
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);
      camera.quaternion.identity();

      if (cameraRig) {
        cameraRig.position.copy(state.position);
        cameraRig.rotation.order = 'YXZ';
        cameraRig.rotation.y = state.yaw;
        cameraRig.rotation.x = state.pitch;
        cameraRig.updateMatrixWorld(true);
      }

      if (typeof centerWormholeOnScreen === 'function') {
        centerWormholeOnScreen(true);
      }
      if (typeof weaponsSystem !== 'undefined' && weaponsSystem && typeof weaponsSystem.updateCrosshairWeaponRing === 'function') {
        weaponsSystem.updateCrosshairWeaponRing();
      }

      state.xrMode = 'desktop-vr';
      currentActiveDeviceType = 'vr';
      const selMode = document.getElementById('select-mode');
      if (selMode) selMode.value = 'desktop-vr';
      activateModeParameters('desktop-vr');
      loadStageDeviceModule(currentActiveStage, 'vr');

      console.log('[Wormhole XR] WebXR session started. CameraRig locked at:', state.position.toArray());
    });
    renderer.xr.addEventListener('sessionend', () => {
      state.isXR = false;
      xrBasePoseCaptured = false;
      document.body.classList.remove('in-xr-session');

      if (cameraRig) {
        cameraRig.position.set(0, 0, 0);
        cameraRig.rotation.set(0, 0, 0);
        cameraRig.quaternion.identity();
        cameraRig.updateMatrixWorld(true);
      }

      camera.fov = 65;
      camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
      camera.position.copy(state.position);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = state.yaw;
      camera.rotation.x = state.pitch;
      camera.updateProjectionMatrix();

      if (sceneRenderTarget) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        sceneRenderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
      }

      console.log('[Wormhole XR] WebXR session exited.');
    });

    // XR Hand Controllers (parented to cameraRig; hidden by default in cockpit view unless enabled by VR stage config)
    try {
      const controllerModelFactory = new XRControllerModelFactory();
      for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        controller.visible = false;
        cameraRig.add(controller);
        
        const grip = renderer.xr.getControllerGrip(i);
        grip.visible = false;
        if (controllerModelFactory) {
          try {
            grip.add(controllerModelFactory.createControllerModel(grip));
          } catch (e) {}
        }
        cameraRig.add(grip);

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
        laser.visible = false;
        controller.add(laser);
        controllers.push(controller);
        controllerGrips.push(grip);
        controllerLasers.push(laser);
      }
    } catch (e) {}
  }
} catch (err) {
  console.warn('[Wormhole XR] WebGL renderer creation caught error:', err);
  webglInitError = err;
}

// Fallback dummy scene & camera so shaders and materials instantiate safely without throwing
if (!scene) scene = new THREE.Scene();
if (!cameraRig) {
  cameraRig = new THREE.Group();
  cameraRig.name = 'vr-camera-rig';
  scene.add(cameraRig);
}
if (!camera) {
  camera = new THREE.PerspectiveCamera(65, 1.0, 0.1, 8000);
  cameraRig.add(camera);
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
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
  g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  g.addColorStop(0.2, 'rgba(230, 248, 255, 0.95)');
  g.addColorStop(0.45, 'rgba(100, 215, 255, 0.50)');
  g.addColorStop(0.8, 'rgba(0, 160, 255, 0.12)');
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
    
    // Distribute on deep celestial sphere far away from the ship's flight path (r = 1200 to 2400)
    // Clearing near flight volume so stars never crowd the ship or blow up in foreground
    const r = 1200 + Math.random() * 1200;

    starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);

    const baseColor = starPalette[Math.floor(Math.random() * starPalette.length)];
    const lum = 0.5 + Math.random() * 0.5;
    starColors[i * 3 + 0] = Math.min(1.0, baseColor.r * lum);
    starColors[i * 3 + 1] = Math.min(1.0, baseColor.g * lum);
    starColors[i * 3 + 2] = Math.min(1.0, baseColor.b * lum);
  }

  starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2.0,
    map: createStarTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: false, // Ensures stars remain crisp, tiny pinpoints at all distances without blowing up into large blurry blobs
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
    size: 1.0,
    map: createStarTexture(),
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false
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
        if (r < 0.45) {
          float deflection = (rE * rE) / (r + 0.015);
          vec2 dir = (r > 0.0001) ? (d / r) : vec2(0.0, 1.0);
          vec2 offset = dir * deflection;
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
    this.spinAudioEnabled = true;
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
      this.synthOsc.type = 'sine';
      this.synthOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.synthGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, this.ctx.currentTime);

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

  setStageDeviceAudio(stageSlug, deviceType) {
    try {
      const droneSrc = `${deviceType}/audio/${stageSlug}/wormhole_drone.wav`;
      const warpSrc = `${deviceType}/audio/${stageSlug}/warp_engage.wav`;
      const scanSrc = `${deviceType}/audio/${stageSlug}/scanner_ping.wav`;
      const coilSrc = `${deviceType}/audio/${stageSlug}/coil_calibrate.wav`;

      const wasPlaying = this.droneAudio && !this.droneAudio.paused;
      if (this.droneAudio) {
        this.droneAudio.src = droneSrc;
        this.droneAudio.load();
        if (wasPlaying && !CONFIG.audioMuted) {
          this.droneAudio.play().catch(() => {});
        }
      }
      if (this.warpAudio) {
        this.warpAudio.src = warpSrc;
        this.warpAudio.load();
      }
      if (this.scanAudio) {
        this.scanAudio.src = scanSrc;
        this.scanAudio.load();
      }
      if (this.spinAudioEnabled) {
        if (this.coilAudio) {
          this.coilAudio.src = coilSrc;
          this.coilAudio.load();
        } else {
          this.coilAudio = new Audio(coilSrc);
          this.coilAudio.volume = 0.75;
        }
      }
    } catch (e) {
      console.warn('[Audio] setStageDeviceAudio error:', e);
    }
  }

  setSpinAudioEnabled(enabled) {
    this.spinAudioEnabled = !!enabled;
    if (!enabled) {
      if (this.coilAudio) {
        try {
          this.coilAudio.pause();
          this.coilAudio.currentTime = 0;
        } catch (e) {}
      }
    } else {
      const devType = currentActiveDeviceType || 'desktop';
      const stageSlug = (STAGE_REGISTRY[currentActiveStage] && STAGE_REGISTRY[currentActiveStage].slug) || 'warp_origin';
      const coilSrc = `${devType}/audio/${stageSlug}/coil_calibrate.wav`;
      if (!this.coilAudio) {
        this.coilAudio = new Audio(coilSrc);
        this.coilAudio.volume = 0.75;
      } else {
        this.coilAudio.src = coilSrc;
        this.coilAudio.load();
      }
    }
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
    if (CONFIG.audioMuted || !this.spinAudioEnabled) return;
    if (!this.coilAudio) {
      const devType = currentActiveDeviceType || 'desktop';
      const stageSlug = (STAGE_REGISTRY[currentActiveStage] && STAGE_REGISTRY[currentActiveStage].slug) || 'warp_origin';
      this.coilAudio = new Audio(`${devType}/audio/${stageSlug}/coil_calibrate.wav`);
      this.coilAudio.volume = 0.75;
    }
    if (this.coilAudio) {
      this.coilAudio.currentTime = 0;
      this.coilAudio.play().catch(e => console.warn(e));
    }
  }

  playLaser(weaponType = 'red_laser') {
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
      if (weaponType === 'tachyon_lance') {
        // Piercing tachyon singularity lance: high resonant sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1650, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.25);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (weaponType === 'blue_laser') {
        // High-energy quantum blue laser: dual resonant sweep with heavy snap
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(1380, now);
        osc1.frequency.exponentialRampToValueAtTime(130, now + 0.22);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(690, now);
        osc2.frequency.exponentialRampToValueAtTime(65, now + 0.22);
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.24);
        osc2.stop(now + 0.24);
      } else {
        // Neon Red Laser: punchy sci-fi laser blast frequency drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (e) {
      console.warn('[Audio] Laser sound error:', e);
    }
  }

  playOverheatAlert() {
    if (CONFIG.audioMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.setValueAtTime(240, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playWeaponSwitch() {
    if (CONFIG.audioMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.09);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playHit() {
    if (!state.hasStarted || CONFIG.audioMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  }

  playExplosion() {
    if (!state.hasStarted || CONFIG.audioMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.45);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playEnemyLaser() {
    if (!state.hasStarted || CONFIG.audioMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playEnemyMissile() {
    if (!state.hasStarted || CONFIG.audioMuted) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.38);
      gain.gain.setValueAtTime(0.36, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  updateProximity(distKm) {
    if (!this.droneAudio || CONFIG.audioMuted) return;
    const norm = Math.max(0.0, Math.min(1.0, 1.0 - (distKm / 90000)));
    this.droneAudio.volume = 0.35 + norm * 0.45;
  }
}

const audioMgr = new AudioManager();

// =============================================================================
// WEAPONS ARSENAL & OVERHEAT SYSTEM (STAGE 1 & FUTURE STAGE / MISSION EXTENSIBLE)
// =============================================================================
class WeaponsSystem {
  constructor() {
    this.weapons = {};
    this.activeWeaponId = 'red_laser';
    this.listeners = [];

    // Stage 1 Initial Weapon: Neon Red Laser (Default fallback before database sync)
    this.registerWeapon({
      id: 'red_laser',
      name: 'Neon Red Laser',
      shortName: 'RED LASER',
      icon: '🔴',
      colorHex: 0xff0033,
      cssColor: '#ff0033',
      glowColor: 'rgba(255, 0, 51, 0.55)',
      energyCost: 10,         // Drain % / shot
      canOverheat: true,      // Can overheat
      cooldownDurationSec: 5, // Cool off time
      damagePerHit: 2,        // Damage hits
      bulletSpeed: 550,
      boltLength: 7.5,
      boltRadius: 0.14,
      bulletLifetime: 2.2,
      bulletLightIntensity: 3.5,
      description: 'Directed neon plasma pulse. Standard Stage 1 initial weapon.',
      stageUnlocked: 1,
      isInitialWeapon: true,
      isAcquirable: true,
      acquireEvent: 'default_start',
      acquired: true,
      isAvailable: true
    });

    this.registerWeapon({
      id: 'blue_laser',
      name: 'Cobalt Blue Laser',
      shortName: 'BLUE LASER',
      icon: '🔵',
      colorHex: 0x00d4ff,
      cssColor: '#00d4ff',
      glowColor: 'rgba(0, 212, 255, 0.65)',
      energyCost: 30,
      canOverheat: true,
      cooldownDurationSec: 10,
      damagePerHit: 1,
      bulletSpeed: 700,
      boltLength: 9.0,
      boltRadius: 0.18,
      bulletLifetime: 2.5,
      bulletLightIntensity: 4.5,
      description: 'High-density quantum particle beam.',
      stageUnlocked: 1,
      isInitialWeapon: false,
      isAcquirable: true,
      acquireEvent: 'default_start',
      acquired: true,
      isAvailable: true
    });

    // Stage 2 Initial Weapon: Tachyon Lance
    this.registerWeapon({
      id: 'tachyon_lance',
      name: 'Tachyon Lance',
      shortName: 'TACHYON LANCE',
      icon: '⚡',
      colorHex: 0xffd166,
      cssColor: '#ffd166',
      glowColor: 'rgba(255, 209, 102, 0.65)',
      energyCost: 20,
      canOverheat: true,
      cooldownDurationSec: 7,
      damagePerHit: 3,
      bulletSpeed: 850,
      boltLength: 12.0,
      boltRadius: 0.20,
      bulletLifetime: 2.8,
      bulletLightIntensity: 5.0,
      description: 'Piercing tachyon singularity lance. Initial weapon for Stage 2.',
      stageUnlocked: 2,
      isInitialWeapon: true,
      isAcquirable: true,
      acquireEvent: 'warp_horizon_jump',
      acquired: false,
      isAvailable: false
    });

    // Stage 3 Weapon: Quantum Plasma Torpedo
    this.registerWeapon({
      id: 'plasma_torpedo',
      name: 'Quantum Plasma Torpedo',
      shortName: 'PLASMA TORPEDO',
      icon: '💣',
      colorHex: 0xf59e0b,
      cssColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.65)',
      energyCost: 40,
      canOverheat: false, // NON-OVERHEATING
      cooldownDurationSec: 0,
      damagePerHit: 5,
      bulletSpeed: 450,
      boltLength: 14.0,
      boltRadius: 0.28,
      bulletLifetime: 3.0,
      bulletLightIntensity: 6.0,
      description: 'Heavy matter/antimatter explosive ordinance. Non-overheating heavy weapon.',
      stageUnlocked: 3,
      isInitialWeapon: false,
      isAcquirable: true,
      acquireEvent: 'singularity_core_probe',
      acquired: false,
      isAvailable: false
    });

    // Stage 4 Initial Weapon: Quantum Phaser Cannon
    this.registerWeapon({
      id: 'quantum_phaser',
      name: 'Quantum Phaser Cannon',
      shortName: 'QUANTUM PHASER',
      icon: '✨',
      colorHex: 0x10b981,
      cssColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.65)',
      energyCost: 15,
      canOverheat: true,
      cooldownDurationSec: 6,
      damagePerHit: 4,
      bulletSpeed: 950,
      boltLength: 10.0,
      boltRadius: 0.20,
      bulletLifetime: 2.6,
      bulletLightIntensity: 5.0,
      description: 'Multi-phase singularity beam emitter. Initial weapon for Stage 4 deep core.',
      stageUnlocked: 4,
      isInitialWeapon: true,
      isAcquirable: true,
      acquireEvent: 'deep_core_breakthrough',
      acquired: false,
      isAvailable: false
    });
  }

  registerWeapon(config) {
    const id = config.id;
    this.weapons[id] = {
      id: id,
      name: config.name || id,
      shortName: config.shortName || config.name || id,
      icon: config.icon || '🔫',
      colorHex: config.colorHex !== undefined ? config.colorHex : 0x00f0ff,
      cssColor: config.cssColor || '#00f0ff',
      glowColor: config.glowColor || 'rgba(0, 240, 255, 0.4)',
      energyCost: config.energyCost !== undefined ? parseFloat(config.energyCost) : 10,
      canOverheat: config.canOverheat !== undefined ? Boolean(config.canOverheat) : true,
      cooldownDurationSec: config.cooldownDurationSec !== undefined ? parseFloat(config.cooldownDurationSec) : 5,
      damagePerHit: config.damagePerHit !== undefined ? parseInt(config.damagePerHit) : (config.damage || 1),
      bulletSpeed: config.bulletSpeed || 600,
      boltLength: config.boltLength || 8,
      boltRadius: config.boltRadius || 0.15,
      bulletLifetime: config.bulletLifetime || 2.2,
      bulletLightIntensity: config.bulletLightIntensity || 3.5,
      description: config.description || '',
      stageUnlocked: config.stageUnlocked || 1,
      isInitialWeapon: Boolean(config.isInitialWeapon),
      isAcquirable: config.isAcquirable !== undefined ? Boolean(config.isAcquirable) : true,
      acquireEvent: config.acquireEvent || 'default_start',
      acquired: config.acquired !== undefined ? Boolean(config.acquired) : true,
      isAvailable: config.isAvailable !== undefined ? Boolean(config.isAvailable) : true,
      rechargeRate: config.rechargeRate || 35,

      // Live runtime state
      energy: 100, // 100%
      isOverheated: false,
      overheatRemainingMs: 0
    };
    this.notify();
    return this.weapons[id];
  }

  unlockWeapon(id) {
    if (this.weapons[id]) {
      this.weapons[id].isAvailable = true;
      this.weapons[id].acquired = true;
      this.notify();
    }
  }

  acquireWeapon(id) {
    this.unlockWeapon(id);
  }

  equipWeapon(id) {
    if (this.weapons[id]) {
      this.weapons[id].acquired = true;
      this.weapons[id].isAvailable = true;
    }
    return this.selectWeapon(id);
  }

  selectWeapon(id) {
    if (state.isPaused && typeof isWeaponWheelOpen === 'function' && !isWeaponWheelOpen()) {
      return false;
    }
    const target = this.weapons[id];
    if (!target) {
      console.warn(`[WeaponsSystem] Weapon ${id} not found.`);
      return false;
    }
    if (!target.isAvailable || !target.acquired) {
      showToast(`🔒 ${target.name.toUpperCase()} LOCKED: COMPLETE EVENT [${target.acquireEvent || 'STAGE'}] TO UNLOCK`);
      return false;
    }
    this.activeWeaponId = id;
    if (audioMgr && audioMgr.playWeaponSwitch) {
      audioMgr.playWeaponSwitch();
    }
    this.updateCrosshairWeaponRing();
    this.notify();
    return true;
  }

  cycleWeapon() {
    if (state.isPaused && typeof isWeaponWheelOpen === 'function' && !isWeaponWheelOpen()) {
      return false;
    }
    const available = Object.values(this.weapons).filter(w => w.isAvailable && w.acquired);
    if (available.length <= 1) return false;
    const idx = available.findIndex(w => w.id === this.activeWeaponId);
    const nextIdx = (idx + 1) % available.length;
    return this.selectWeapon(available[nextIdx].id);
  }

  getActiveWeapon() {
    return this.weapons[this.activeWeaponId] || this.weapons['red_laser'] || Object.values(this.weapons)[0];
  }

  canFire() {
    if (state.isPaused) return false;
    const w = this.getActiveWeapon();
    if (!w) return false;
    if (w.isOverheated) {
      return false;
    }
    if (!w.canOverheat && w.energy < w.energyCost) {
      return false; // Non-overheating weapon requires enough charge for shot drain
    }
    return true;
  }

  consumeEnergyOnFire() {
    const w = this.getActiveWeapon();
    if (!w) return false;

    // Deduct percentage (drain % per shot from database)
    w.energy = Math.max(0, w.energy - w.energyCost);

    // If reaches 0% and weapon CAN overheat, overheat and disable until cool off
    if (w.canOverheat) {
      if (w.energy <= 0) {
        w.energy = 0;
        w.isOverheated = true;
        w.overheatRemainingMs = w.cooldownDurationSec * 1000;
        if (audioMgr && audioMgr.playOverheatAlert) {
          audioMgr.playOverheatAlert();
        }
      }
    } else {
      // Weapon CANNOT overheat (e.g. Plasma Torpedo)
      w.isOverheated = false;
      w.overheatRemainingMs = 0;
    }
    this.notify();
    return true;
  }

  update(delta) {
    if (state.isPaused) return; // Simulation paused: cooldown timers hold
    let changed = false;
    for (const id in this.weapons) {
      const w = this.weapons[id];
      if (w.isOverheated) {
        w.overheatRemainingMs -= delta * 1000;
        if (w.overheatRemainingMs <= 0) {
          w.overheatRemainingMs = 0;
          w.isOverheated = false;
          w.energy = 100; // Cooled off and restored to 100%
          changed = true;
        } else {
          changed = true;
        }
      } else if (!w.canOverheat && w.energy < 100) {
        // Continuous energy regeneration for non-overheating weapons
        w.energy = Math.min(100, w.energy + (delta * (w.rechargeRate || 35)));
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  notify() {
    this.updateHUD();
    this.updateWeaponsTabUI();
    for (const cb of this.listeners) {
      try { cb(this); } catch(e) { console.error(e); }
    }
  }

  updateHUD() {
    const active = this.getActiveWeapon();
    if (!active) return;

    // 1. Update Joystick Knob Icon & Glow
    const knob = document.getElementById('touch-stick-knob');
    if (knob) {
      if (active.isOverheated) {
        knob.textContent = '🔥';
        knob.style.boxShadow = '0 0 18px #ef476f';
      } else {
        knob.textContent = active.icon;
        knob.style.boxShadow = `0 0 14px ${active.cssColor}`;
      }
    }

    // 2. Update HUD Weapon Pill
    const pill = document.getElementById('hud-weapon-indicator');
    const iconEl = document.getElementById('hud-wpn-icon');
    const nameEl = document.getElementById('hud-wpn-name');
    const energyEl = document.getElementById('hud-wpn-energy-text');
    const meterFillEl = document.getElementById('hud-wpn-meter-fill');

    if (pill) {
      pill.classList.toggle('is-overheated', active.isOverheated);
      if (iconEl) iconEl.textContent = active.isOverheated ? '🔥' : active.icon;
      if (nameEl) nameEl.textContent = active.shortName;
      if (energyEl) {
        if (active.isOverheated) {
          const remSec = (active.overheatRemainingMs / 1000).toFixed(1);
          energyEl.textContent = `${remSec}s`;
          energyEl.style.color = '#ff85a1';
        } else {
          energyEl.textContent = `${active.energy}%`;
          energyEl.style.color = 'var(--cyan-neon)';
        }
      }
      if (meterFillEl) {
        meterFillEl.className = 'hud-wpn-meter-fill';
        if (active.isOverheated) {
          meterFillEl.classList.add('overheated');
          const coolFraction = 1.0 - (active.overheatRemainingMs / (active.cooldownDurationSec * 1000));
          meterFillEl.style.width = `${Math.round(Math.max(0, Math.min(100, coolFraction * 100)))}%`;
        } else {
          meterFillEl.classList.add(active.id === 'blue_laser' ? 'blue' : (active.id === 'tachyon_lance' ? 'tachyon' : 'red'));
          meterFillEl.style.width = `${active.energy}%`;
        }
      }
    }

    // 3. Update Outside Ring of Crosshair to Selected Weapon Color
    this.updateCrosshairWeaponRing();
  }

  updateCrosshairWeaponRing() {
    const active = this.getActiveWeapon();
    const vectorRing = document.getElementById('vector-alignment-ring');
    if (!vectorRing || !active) return;

    const ringColor = active.cssColor || '#00f0ff';
    const glowColor = active.glowColor || ringColor;

    vectorRing.style.setProperty('--weapon-ring-color', ringColor);
    vectorRing.style.setProperty('--weapon-ring-glow', glowColor);

    // Update weapon-specific CSS class on outside crosshair ring
    vectorRing.classList.remove('wpn-ring-red_laser', 'wpn-ring-blue_laser', 'wpn-ring-tachyon_lance');
    vectorRing.classList.add(`wpn-ring-${active.id}`);

    // If not actively locked to wormhole vector, apply weapon color & glow directly
    if (!vectorRing.classList.contains('locked')) {
      vectorRing.style.borderColor = ringColor;
      vectorRing.style.boxShadow = `0 0 12px ${glowColor}, inset 0 0 6px ${glowColor}`;
    }
  }

  updateWeaponsTabUI() {
    const active = this.getActiveWeapon();
    if (!active) return;
    const curStage = (typeof currentActiveStage !== 'undefined') ? currentActiveStage : 1;

    // Active weapon telemetry box
    const activeTitle = document.getElementById('wpn-active-title');
    const activeBadgeStatus = document.getElementById('wpn-active-badge-status');
    const activeEnergyVal = document.getElementById('wpn-active-energy-val');
    const activeEnergyBar = document.getElementById('wpn-active-energy-bar');
    const activeCooldownText = document.getElementById('wpn-active-cooldown-text');
    const activeCooldownTimer = document.getElementById('wpn-active-cooldown-timer');
    const activeDesc = document.getElementById('wpn-active-desc');

    if (activeTitle) activeTitle.textContent = `${active.icon} ${active.name.toUpperCase()}`;
    if (activeDesc) activeDesc.textContent = active.description;

    if (active.isOverheated) {
      const remSec = (active.overheatRemainingMs / 1000).toFixed(1);
      if (activeBadgeStatus) {
        activeBadgeStatus.textContent = 'OVERHEATED';
        activeBadgeStatus.style.color = '#ff85a1';
      }
      if (activeEnergyVal) {
        activeEnergyVal.textContent = `0% [COOLING: ${remSec}s]`;
        activeEnergyVal.style.color = '#ff85a1';
      }
      if (activeEnergyBar) {
        activeEnergyBar.className = 'wpn-energy-bar-fill overheated';
        const coolFraction = 1.0 - (active.overheatRemainingMs / (active.cooldownDurationSec * 1000));
        activeEnergyBar.style.width = `${Math.round(Math.max(0, Math.min(100, coolFraction * 100)))}%`;
      }
      if (activeCooldownText) activeCooldownText.style.display = 'flex';
      if (activeCooldownTimer) activeCooldownTimer.textContent = `COOLING OFF: ${remSec}s`;
    } else {
      if (activeBadgeStatus) {
        activeBadgeStatus.textContent = active.energy === 100 ? 'READY' : 'CHARGING';
        activeBadgeStatus.style.color = 'var(--accent-green)';
      }
      if (activeEnergyVal) {
        activeEnergyVal.textContent = `${active.energy}%`;
        activeEnergyVal.style.color = 'var(--cyan-neon)';
      }
      if (activeEnergyBar) {
        activeEnergyBar.className = `wpn-energy-bar-fill ${active.id === 'blue_laser' ? 'blue-laser' : (active.id === 'tachyon_lance' ? 'tachyon-lance' : 'red-laser')}`;
        activeEnergyBar.style.width = `${active.energy}%`;
      }
      if (activeCooldownText) activeCooldownText.style.display = 'none';
    }

    // Per-weapon card updates
    const arsenalBox = document.querySelector('#tab-pane-weapons .drawer-controls-box:nth-of-type(2)');

    for (const id in this.weapons) {
      const w = this.weapons[id];
      let card = document.getElementById(`card-wpn-${id}`);
      const isEquipped = (this.activeWeaponId === id);

      if (!card && arsenalBox) {
        card = document.createElement('div');
        card.className = `weapon-card ${isEquipped ? 'active-equipped' : ''}`;
        card.id = `card-wpn-${id}`;
        card.dataset.weaponId = id;
        card.innerHTML = `
          <div class="wpn-header-row">
            <span class="wpn-title">${w.icon} ${w.name.toUpperCase()}</span>
            <span class="wpn-badge" id="badge-wpn-${id}">STANDBY</span>
          </div>
          <div class="wpn-specs-grid">
            <div class="wpn-spec-item">
              <span>Drain / Shot:</span>
              <span class="wpn-spec-val" style="color:${w.cssColor};">-${w.energyCost}%</span>
            </div>
            <div class="wpn-spec-item">
              <span>Overheat Cool-off:</span>
              <span class="wpn-spec-val">${w.canOverheat ? `${w.cooldownDurationSec.toFixed(1)}s` : 'NONE'}</span>
            </div>
            <div class="wpn-spec-item">
              <span>Damage Hits:</span>
              <span class="wpn-spec-val" style="color:#06d6a0;">${w.damagePerHit || 1} HITS</span>
            </div>
            <div class="wpn-spec-item">
              <span>Beam Speed:</span>
              <span class="wpn-spec-val">${w.bulletSpeed} KM/S</span>
            </div>
          </div>
          <div class="wpn-energy-bar-wrap">
            <div class="wpn-energy-bar-fill" id="bar-wpn-${id}" style="width: ${w.energy}%; background-color: ${w.cssColor};"></div>
          </div>
          <div class="wpn-cooldown-text" id="cd-text-${id}" style="display:none;">
            <span>OVERHEATED (0%)</span>
            <span id="cd-val-${id}">${w.cooldownDurationSec.toFixed(1)}s</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
            <span id="status-wpn-${id}" class="obj-status" style="color:${isEquipped ? 'var(--accent-green)' : 'var(--cyan-neon)'}; font-size:0.64rem;">READY (${w.energy}%)</span>
            <button type="button" class="btn-action wpn-select-btn" id="btn-select-${id}">EQUIP ${w.shortName}</button>
          </div>
        `;
        arsenalBox.appendChild(card);
        const newBtn = card.querySelector(`#btn-select-${id}`);
        if (newBtn) {
          newBtn.addEventListener('click', () => {
            weaponsSystem.selectWeapon(id);
          });
        }
      }

      if (card) {
        card.classList.toggle('active-equipped', isEquipped);
        card.classList.toggle('is-overheated', w.isOverheated);
        card.classList.toggle('weapon-locked', !w.isAvailable || !w.acquired);

        // Update specs grid with live values
        const specsGrid = card.querySelector('.wpn-specs-grid');
        if (specsGrid) {
          specsGrid.innerHTML = `
            <div class="wpn-spec-item">
              <span>Drain / Shot:</span>
              <span class="wpn-spec-val" style="color:${w.cssColor};">-${w.energyCost}%</span>
            </div>
            <div class="wpn-spec-item">
              <span>Overheat Cool-off:</span>
              <span class="wpn-spec-val">${w.canOverheat ? `${w.cooldownDurationSec.toFixed(1)}s` : 'NONE (NO OVERHEAT)'}</span>
            </div>
            <div class="wpn-spec-item">
              <span>Damage Hits:</span>
              <span class="wpn-spec-val" style="color:#06d6a0;">${w.damagePerHit || 1} HITS</span>
            </div>
            <div class="wpn-spec-item">
              <span>Beam Speed:</span>
              <span class="wpn-spec-val">${w.bulletSpeed} KM/S</span>
            </div>
          `;
        }

        const titleEl = card.querySelector('.wpn-title');
        if (titleEl) {
          const initTag = (w.isInitialWeapon && w.stageUnlocked === curStage) ? ' <small style="color:var(--accent-gold); font-size:0.65rem;">[INITIAL]</small>' : '';
          titleEl.innerHTML = `${w.icon} ${w.name.toUpperCase()}${initTag}`;
        }
      }

      const badge = document.getElementById(`badge-wpn-${id}`);
      const bar = document.getElementById(`bar-wpn-${id}`);
      const cdText = document.getElementById(`cd-text-${id}`);
      const cdVal = document.getElementById(`cd-val-${id}`);
      const status = document.getElementById(`status-wpn-${id}`);
      const btn = document.getElementById(`btn-select-${id}`);

      if (badge) {
        if (!w.isAvailable || !w.acquired) {
          badge.className = 'wpn-badge';
          badge.style.color = '#888';
          badge.style.borderColor = '#555';
          badge.textContent = w.acquireEvent && w.acquireEvent !== 'default_start' ? `EVENT: ${w.acquireEvent.toUpperCase()}` : 'LOCKED';
        } else if (w.isOverheated) {
          badge.className = 'wpn-badge overheated';
          badge.textContent = 'OVERHEATED';
          badge.style.color = '';
          badge.style.borderColor = '';
        } else if (isEquipped) {
          badge.className = 'wpn-badge equipped';
          badge.textContent = (w.isInitialWeapon && w.stageUnlocked === curStage) ? 'INITIAL &bull; EQUIPPED' : 'EQUIPPED';
          badge.style.color = '';
          badge.style.borderColor = '';
        } else if (w.isInitialWeapon && w.stageUnlocked === curStage) {
          badge.className = 'wpn-badge';
          badge.style.color = 'var(--accent-gold)';
          badge.style.borderColor = 'var(--accent-gold)';
          badge.textContent = 'INITIAL WEAPON';
        } else {
          badge.className = 'wpn-badge';
          badge.textContent = 'STANDBY';
          badge.style.color = '';
          badge.style.borderColor = '';
        }
      }
      if (bar) {
        if (w.isOverheated) {
          bar.className = 'wpn-energy-bar-fill overheated';
          const coolFraction = 1.0 - (w.overheatRemainingMs / (w.cooldownDurationSec * 1000));
          bar.style.width = `${Math.round(Math.max(0, Math.min(100, coolFraction * 100)))}%`;
        } else {
          bar.className = 'wpn-energy-bar-fill';
          bar.style.backgroundColor = w.cssColor;
          bar.style.boxShadow = `0 0 8px ${w.glowColor}`;
          bar.style.width = `${w.energy}%`;
        }
      }
      if (cdText && cdVal) {
        if (w.isOverheated) {
          cdText.style.display = 'flex';
          cdVal.textContent = `${(w.overheatRemainingMs / 1000).toFixed(1)}s`;
        } else {
          cdText.style.display = 'none';
        }
      }
      if (status) {
        if (!w.isAvailable || !w.acquired) {
          status.textContent = `LOCKED (${w.acquireEvent || 'STAGE EVENT'})`;
          status.style.color = '#888';
        } else if (w.isOverheated) {
          status.textContent = `OVERHEATED (COOLING: ${(w.overheatRemainingMs / 1000).toFixed(1)}s)`;
          status.style.color = '#ff85a1';
        } else {
          status.textContent = `READY (${Math.round(w.energy)}%) &bull; DMG: ${w.damagePerHit || 1}`;
          status.style.color = isEquipped ? 'var(--accent-green)' : 'var(--cyan-neon)';
        }
      }
      if (btn) {
        if (!w.isAvailable || !w.acquired) {
          btn.textContent = 'LOCKED';
          btn.disabled = true;
          btn.style.opacity = '0.5';
        } else if (isEquipped) {
          btn.textContent = 'EQUIPPED';
          btn.disabled = true;
          btn.style.opacity = '0.85';
        } else {
          btn.textContent = `EQUIP ${w.shortName}`;
          btn.disabled = false;
          btn.style.opacity = '1.0';
        }
      }
    }
  }
}

const weaponsSystem = new WeaponsSystem();
weaponsSystem.updateCrosshairWeaponRing();

function updateWeaponsTabUI() {
  if (weaponsSystem && typeof weaponsSystem.updateWeaponsTabUI === 'function') {
    weaponsSystem.updateWeaponsTabUI();
  }
}

// =============================================================================
// GAME MANAGER DATABASE LIVE SYNCHRONIZATION SYSTEM
// Checks and integrates all Admin Console Game Manager values:
// - Weapons (Initial weapon, acquirable & events, drain %/shot, can overheat, cool-off time, damage hits, bullet speed)
// - Stages (Level, name, theme, events within level, end level event, description, par score)
// - Enemies (Hits to destroy, piercing weapon needed, armor strength, force fields, speed, damage, score, threat level)
// =============================================================================
let lastGameManagerData = null;
let isGameManagerSyncing = false;

function hexToRgbaString(hex, alpha = 0.65) {
  if (!hex) return `rgba(0, 240, 255, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 240;
  const b = parseInt(clean.substring(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const DEFAULT_STAGE_POWERUPS = [
  { id: 1, powerup_id: 'health_pack_s1', powerup_name: 'Sub-Space Nanite Repair Kit', powerup_type: 'health', icon: '💖', model_3d_type: 'capsule', model_3d_url: '', color_hex: '#00ff88', scale: 1.0, length: 2.5, height: 2.5, depth: 2.5, circumference: 6.0, stage_level: 1, device_type: 'all', trigger_events: 'Asteroid Debris Belt, Anomaly Alpha Spike', drop_on_enemy_kill: 1, drop_chance_pct: 70, enemy_id: 'void_recon_drone', boost_percentage: 25, is_enabled: 1 },
  { id: 2, powerup_id: 'shield_cell_s1', powerup_name: 'Deflector Shield Overcharger', powerup_type: 'shield', icon: '🛡️', model_3d_type: 'octahedron', model_3d_url: '', color_hex: '#00f0ff', scale: 1.0, length: 2.5, height: 2.5, depth: 2.5, circumference: 6.0, stage_level: 1, device_type: 'all', trigger_events: 'Nav-Beacon Calibration, Plasma Surge Alert', drop_on_enemy_kill: 1, drop_chance_pct: 80, enemy_id: 'all', boost_percentage: 30, is_enabled: 1 },
  { id: 3, powerup_id: 'health_pack_s2', powerup_name: 'Tachyon Infused Hull Matrix', powerup_type: 'health', icon: '💚', model_3d_type: 'dodecahedron', model_3d_url: '', color_hex: '#10b981', scale: 1.0, length: 2.5, height: 2.5, depth: 2.5, circumference: 6.0, stage_level: 2, device_type: 'all', trigger_events: 'Tachyon Flux Distortions, Interceptor Ambush Wave', drop_on_enemy_kill: 1, drop_chance_pct: 65, enemy_id: 'phase_interceptor', boost_percentage: 35, is_enabled: 1 },
  { id: 4, powerup_id: 'shield_cell_s2', powerup_name: 'Ion Shield Harmonizer', powerup_type: 'shield', icon: '🔰', model_3d_type: 'torus', model_3d_url: '', color_hex: '#38bdf8', scale: 1.0, length: 2.8, height: 2.8, depth: 2.8, circumference: 7.0, stage_level: 2, device_type: 'all', trigger_events: 'Ion Cloud Interference, Wormhole Coil Resonance Alert', drop_on_enemy_kill: 1, drop_chance_pct: 75, enemy_id: 'all', boost_percentage: 40, is_enabled: 1 },
  { id: 5, powerup_id: 'health_pack_s3', powerup_name: 'Graviton Integrity Restorer', powerup_type: 'health', icon: '🧪', model_3d_type: 'icosahedron', model_3d_url: '', color_hex: '#a855f7', scale: 1.0, length: 2.5, height: 2.5, depth: 2.5, circumference: 6.0, stage_level: 3, device_type: 'all', trigger_events: 'Gravitational Tidal Waves, Core Guardian Awakening', drop_on_enemy_kill: 1, drop_chance_pct: 60, enemy_id: 'tachyon_cruiser', boost_percentage: 45, is_enabled: 1 },
  { id: 6, powerup_id: 'shield_cell_s3', powerup_name: 'Singularity Void Barrier', powerup_type: 'shield', icon: '🔷', model_3d_type: 'sphere', model_3d_url: '', color_hex: '#6366f1', scale: 1.0, length: 3.0, height: 3.0, depth: 3.0, circumference: 7.5, stage_level: 3, device_type: 'all', trigger_events: 'Singularity Probe Deployment, Heavy Antimatter Eruptions', drop_on_enemy_kill: 1, drop_chance_pct: 70, enemy_id: 'void_guardian', boost_percentage: 50, is_enabled: 1 },
  { id: 7, powerup_id: 'health_pack_s4', powerup_name: 'Quantum Regenerative Core', powerup_type: 'health', icon: '💖', model_3d_type: 'icosahedron', model_3d_url: '', color_hex: '#ec4899', scale: 1.1, length: 2.8, height: 2.8, depth: 2.8, circumference: 7.0, stage_level: 4, device_type: 'all', trigger_events: 'Phase-Shift Anomalies, Quantum Dreadnought Confrontation', drop_on_enemy_kill: 1, drop_chance_pct: 65, enemy_id: 'quantum_dreadnought', boost_percentage: 50, is_enabled: 1 },
  { id: 8, powerup_id: 'shield_cell_s4', powerup_name: 'Omni-Phase Deflector Matrix', powerup_type: 'shield', icon: '🛡️', model_3d_type: 'octahedron', model_3d_url: '', color_hex: '#00f0ff', scale: 1.2, length: 3.2, height: 3.2, depth: 3.2, circumference: 8.0, stage_level: 4, device_type: 'all', trigger_events: 'Multi-Dimensional Phasing, Antimatter Vortex', drop_on_enemy_kill: 1, drop_chance_pct: 85, enemy_id: 'all', boost_percentage: 60, is_enabled: 1 }
];

async function fetchGameManagerDatabaseValues(stageLevel = null, deviceType = null) {
  const dev = deviceType || currentActiveDeviceType || 'desktop';
  const queryParam = (stageLevel ? `&stage_level=${stageLevel}` : '') + (dev ? `&device_type=${dev}` : '');

  // 1. First attempt: Query primary individual endpoints in parallel (guaranteed on live server)
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2800);
    const baseW = `https://api.calmchessgames.com/admin/wormhole_device_api.php?action=get_game_weapons${stageLevel ? `&stage_level=${stageLevel}` : ''}`;
    const baseS = `https://api.calmchessgames.com/admin/wormhole_device_api.php?action=get_game_stages`;
    const baseE = `https://api.calmchessgames.com/admin/wormhole_device_api.php?action=get_game_enemies${queryParam}`;
    const baseP = `https://api.calmchessgames.com/admin/wormhole_device_api.php?action=get_game_powerups${queryParam}`;

    const [rW, rS, rE, rP] = await Promise.all([
      fetch(baseW, { cache: 'no-cache', signal: ctrl.signal }).then(r => r.json()).catch(() => null),
      fetch(baseS, { cache: 'no-cache', signal: ctrl.signal }).then(r => r.json()).catch(() => null),
      fetch(baseE, { cache: 'no-cache', signal: ctrl.signal }).then(r => r.json()).catch(() => null),
      fetch(baseP, { cache: 'no-cache', signal: ctrl.signal }).then(r => r.json()).catch(() => null)
    ]);
    clearTimeout(tid);

    if (rW && rW.weapons && rW.weapons.length > 0) {
      console.log(`[GameManagerSync] Fetched ${rW.weapons.length} weapons, ${(rS && rS.stages) ? rS.stages.length : 0} stages, ${(rE && rE.enemies) ? rE.enemies.length : 0} threats, ${(rP && rP.powerups) ? rP.powerups.length : 0} powerups for [${dev.toUpperCase()}]`);
      return {
        success: true,
        weapons: (rW && rW.weapons) || [],
        stages: (rS && rS.stages) || [],
        enemies: (rE && rE.enemies) || [],
        powerups: (rP && rP.powerups) || []
      };
    }
  } catch (errIndiv) {
    console.warn('[GameManagerSync] Parallel individual query failed:', errIndiv);
  }

  // 2. Secondary attempt: Unified get_game_manager endpoint
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`https://api.calmchessgames.com/admin/wormhole_device_api.php?action=get_game_manager${queryParam}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache',
      signal: ctrl.signal
    });
    clearTimeout(tid);
    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && (json.weapons || json.stages || json.enemies || json.powerups)) {
        console.log(`[GameManagerSync] Fetched Game Manager database records via unified endpoint for [${dev.toUpperCase()}]`);
        return json;
      }
    }
  } catch (e) {}

  return null;
}

function applyGameManagerValues(data, stageLevel = 1, deviceType = null) {
  if (!data) return false;
  lastGameManagerData = data;
  const currentStage = stageLevel || currentActiveStage || 1;
  const currentDev = (deviceType || currentActiveDeviceType || 'desktop').toLowerCase();

  console.log(`[GameManagerSync] 🔄 Analyzing & integrating Game Manager database values for Stage ${currentStage} on [${currentDev.toUpperCase()}]...`);

  // ---------------------------------------------------------------------------
  // 1. INTEGRATE WEAPONS (INITIAL WEAPON, ACQUIRABLE & EVENT, DRAIN %/SHOT, CAN OVERHEAT, COOL OFF TIME, DAMAGE HITS)
  // ---------------------------------------------------------------------------
  let initialWeaponForStage = null;
  const dbWeapons = Array.isArray(data.weapons) ? data.weapons : [];

  if (dbWeapons.length > 0 && weaponsSystem) {
    for (const rawW of dbWeapons) {
      const wid = rawW.weapon_id;
      if (!wid) continue;

      const wStage = parseInt(rawW.stage_level) || 1;
      const isInit = (rawW.is_initial_weapon == 1 || rawW.is_initial_weapon === true || rawW.is_initial_weapon === '1');
      const isAcq = (rawW.is_acquirable == 1 || rawW.is_acquirable === true || rawW.is_acquirable === '1' || rawW.is_acquirable === undefined);
      const acqEvent = rawW.acquire_event || 'default_start';
      const drainPct = parseFloat(rawW.energy_drain_pct) !== undefined && !isNaN(parseFloat(rawW.energy_drain_pct)) ? parseFloat(rawW.energy_drain_pct) : 10.0;
      const canHeat = (rawW.can_overheat == 1 || rawW.can_overheat === true || rawW.can_overheat === '1' || rawW.can_overheat === undefined);
      const coolSec = parseFloat(rawW.cooldown_seconds) !== undefined && !isNaN(parseFloat(rawW.cooldown_seconds)) ? parseFloat(rawW.cooldown_seconds) : 5.0;
      const dmgHits = parseInt(rawW.damage_per_hit) || 1;
      const bSpeed = parseInt(rawW.bullet_speed) || 600;

      // Color computation
      const rawHex = rawW.color_hex || '#00f0ff';
      const parsedHex = parseInt(rawHex.replace('#', '0x'), 16) || 0x00f0ff;
      const glowRgba = hexToRgbaString(rawHex, 0.65);

      // Determine acquisition & availability for current stage level
      let isAcquired = false;
      let isAvailable = false;

      if (isInit && wStage === currentStage) {
        // Initial weapon for current stage is immediately acquired and available
        isAcquired = true;
        isAvailable = true;
        initialWeaponForStage = wid;
      } else if (wStage < currentStage) {
        // Weapons from earlier stages that were acquired remain available
        isAcquired = true;
        isAvailable = true;
      } else if (wStage === currentStage && acqEvent === 'default_start' && isAcq) {
        // Default start weapons for current stage are available
        isAcquired = true;
        isAvailable = true;
      } else if (state.unlockedEvents && state.unlockedEvents[acqEvent]) {
        // Event already triggered in gameplay
        isAcquired = true;
        isAvailable = true;
      } else {
        // Future/extensible or event-locked weapon
        isAcquired = false;
        isAvailable = false;
      }

      // Track acquirable event trigger
      if (acqEvent && acqEvent !== 'default_start') {
        if (!state.acquirableEvents) state.acquirableEvents = {};
        state.acquirableEvents[acqEvent] = wid;
      }

      if (weaponsSystem.weapons[wid]) {
        // Update existing weapon with live database values
        const existing = weaponsSystem.weapons[wid];
        existing.name = rawW.weapon_name || existing.name;
        existing.shortName = (rawW.weapon_name || existing.shortName || wid).toUpperCase();
        existing.icon = rawW.icon || existing.icon;
        existing.colorHex = parsedHex;
        existing.cssColor = rawHex;
        existing.glowColor = glowRgba;
        existing.energyCost = drainPct;                   // DRAIN % / SHOT
        existing.canOverheat = canHeat;                   // CAN OVERHEAT
        existing.cooldownDurationSec = coolSec;           // COOL OFF TIME
        existing.damagePerHit = dmgHits;                  // DAMAGE HITS FOR WEAPONS
        existing.bulletSpeed = bSpeed;
        existing.stageUnlocked = wStage;
        existing.isInitialWeapon = isInit;                // INITIAL WEAPON
        existing.isAcquirable = isAcq;                    // ACQUIRABLE
        existing.acquireEvent = acqEvent;                 // EVENT
        existing.description = rawW.description || existing.description;
        existing.isAvailable = isAvailable || existing.isAvailable;
        existing.acquired = isAcquired || existing.acquired;
      } else {
        // Register new weapon from database
        weaponsSystem.registerWeapon({
          id: wid,
          name: rawW.weapon_name || wid,
          shortName: (rawW.weapon_name || wid).toUpperCase(),
          icon: rawW.icon || '⚡',
          colorHex: parsedHex,
          cssColor: rawHex,
          glowColor: glowRgba,
          energyCost: drainPct,                           // DRAIN % / SHOT
          canOverheat: canHeat,                           // CAN OVERHEAT
          cooldownDurationSec: coolSec,                   // COOL OFF TIME
          damagePerHit: dmgHits,                          // DAMAGE HITS FOR WEAPONS
          bulletSpeed: bSpeed,
          stageUnlocked: wStage,
          isInitialWeapon: isInit,                        // INITIAL WEAPON
          isAcquirable: isAcq,                            // ACQUIRABLE
          acquireEvent: acqEvent,                         // EVENT
          description: rawW.description || '',
          acquired: isAcquired,
          isAvailable: isAvailable
        });
      }
    }

    // Auto-equip the initial weapon for this stage!
    if (initialWeaponForStage && weaponsSystem.weapons[initialWeaponForStage]) {
      console.log(`[GameManagerSync] 🎯 Equipped Stage ${currentStage} initial weapon from database: ${initialWeaponForStage}`);
      weaponsSystem.equipWeapon(initialWeaponForStage);
    } else {
      // Fallback: equip first available weapon for this stage
      const stageWpns = Object.values(weaponsSystem.weapons).filter(w => w.stageUnlocked === currentStage && w.isAvailable && w.acquired);
      if (stageWpns.length > 0) {
        weaponsSystem.equipWeapon(stageWpns[0].id);
      }
    }

    // Refresh UI
    weaponsSystem.updateCrosshairWeaponRing();
    weaponsSystem.notify();
    if (typeof renderWeaponWheel === 'function') {
      renderWeaponWheel();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. INTEGRATE STAGES (STAGE LEVEL, NAME, THEME, EVENTS WITHIN LEVEL, END LEVEL EVENT, PAR SCORE, DESCRIPTION)
  // ---------------------------------------------------------------------------
  const dbStages = Array.isArray(data.stages) ? data.stages : [];
  if (dbStages.length > 0) {
    for (const s of dbStages) {
      const lvl = parseInt(s.stage_level) || 1;
      if (!STAGE_REGISTRY[lvl]) {
        STAGE_REGISTRY[lvl] = {
          level: lvl,
          name: s.stage_name,
          slug: s.stage_name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
        };
      }
      STAGE_REGISTRY[lvl].name = s.stage_name;
      STAGE_REGISTRY[lvl].theme = s.environment_theme;
      STAGE_REGISTRY[lvl].eventsWithin = s.events_within_level;
      STAGE_REGISTRY[lvl].endLevelEvent = s.end_level_event;
      STAGE_REGISTRY[lvl].description = s.description;
      STAGE_REGISTRY[lvl].parScore = parseInt(s.par_score) || 5000;
    }

    const currentStageRecord = dbStages.find(s => parseInt(s.stage_level) === currentStage);
    if (currentStageRecord) {
      if (currentStageRecord.mission_objectives) {
        state.stageMissionBriefing = currentStageRecord.mission_objectives;
      }
      if (currentStageRecord.required_enemy_kills !== undefined && currentStageRecord.required_enemy_kills !== null) {
        state.stageRequiredKills = Math.max(1, parseInt(currentStageRecord.required_enemy_kills) || 10);
      }
      if (currentStageRecord.warp_target_distance !== undefined && currentStageRecord.warp_target_distance !== null) {
        state.stageTargetDistance = Math.max(1000, parseInt(currentStageRecord.warp_target_distance) || 50000);
      }

      // Update HUD status & subtitle
      const hudStatus = document.getElementById('hud-status');
      if (hudStatus) {
        hudStatus.textContent = `STAGE ${currentStage}: ${currentStageRecord.stage_name.toUpperCase()}`;
      }
      const splashSub = document.querySelector('.splash-game-sub');
      if (splashSub) {
        splashSub.textContent = `STAGE ${currentStage}: ${currentStageRecord.stage_name.toUpperCase()}`;
      }

      // Update in-game events & dynamic stage objectives
      updateMissionObjectivesUI(currentStageRecord);
      if (typeof renderStageObjectivesUI === 'function') {
        renderStageObjectivesUI();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. INTEGRATE ENEMIES & THREAT REGISTRY (SEPARATED VALUES FOR CURRENT DEVICE)
  // ---------------------------------------------------------------------------
  const dbEnemies = Array.isArray(data.enemies) ? data.enemies : [];
  if (dbEnemies.length > 0) {
    const stageEnemies = dbEnemies.filter(e => {
      const matchStage = parseInt(e.stage_level) === currentStage;
      const enemyDev = (e.device_type || 'all').toLowerCase();
      const matchDevice = (enemyDev === 'all' || enemyDev === currentDev || !e.device_type);
      return matchStage && matchDevice;
    });

    window.activeStageEnemies = stageEnemies.length > 0 ? stageEnemies : dbEnemies.filter(e => parseInt(e.stage_level) === currentStage);
    state.stageEnemies = window.activeStageEnemies;

    console.log(`[GameManagerSync] ✅ Verified ${window.activeStageEnemies.length} threat enemy profiles from database for Stage ${currentStage} on device [${currentDev.toUpperCase()}]`);
    updateTacticalEnemiesUI(window.activeStageEnemies);
  }

  // ---------------------------------------------------------------------------
  // 4. INTEGRATE POWER UPS (HEALTH & SHIELD BOOSTS, MULTI-EVENTS, ENEMY DROPS)
  // ---------------------------------------------------------------------------
  const dbPowerups = Array.isArray(data.powerups) ? data.powerups : [];
  const rawList = dbPowerups.length > 0 ? dbPowerups : (typeof DEFAULT_STAGE_POWERUPS !== 'undefined' ? DEFAULT_STAGE_POWERUPS : []);
  if (rawList.length > 0) {
    const stagePowerups = rawList.filter(p => {
      const pStage = parseInt(p.stage_level) || 0;
      const matchStage = (pStage === 0 || pStage === currentStage);
      const pDev = (p.device_type || 'all').toLowerCase();
      const matchDevice = (pDev === 'all' || pDev === currentDev || !p.device_type);
      const isEnabled = (p.is_enabled === undefined || p.is_enabled == 1 || p.is_enabled === true || p.is_enabled === '1')
        && (p.is_active === undefined || p.is_active == 1 || p.is_active === true || p.is_active === '1');
      return matchStage && matchDevice && isEnabled;
    }).map(p => ({
      ...p,
      powerup_id: p.powerup_id || p.id,
      powerup_name: p.powerup_name || p.name || 'Power Up',
      boost_percentage: p.boost_percentage !== undefined ? parseFloat(p.boost_percentage) : (p.boost_pct !== undefined ? parseFloat(p.boost_pct) : 25),
      boost_pct: p.boost_pct !== undefined ? parseFloat(p.boost_pct) : (p.boost_percentage !== undefined ? parseFloat(p.boost_percentage) : 25),
      enemy_id: p.enemy_id || p.drop_enemy_type || 'all',
      drop_enemy_type: p.drop_enemy_type || p.enemy_id || 'all',
      drop_on_enemy_kill: (p.drop_on_enemy_kill == 1 || p.drop_on_enemy_kill === true || p.drop_on_enemy_kill === '1') ? 1 : 0,
      drop_chance_pct: p.drop_chance_pct !== undefined ? parseFloat(p.drop_chance_pct) : 65,
      model_3d_type: p.model_3d_type || ((p.powerup_type || '').toLowerCase() === 'shield' ? 'octahedron' : 'capsule'),
      model_3d_url: p.model_3d_url || '',
      scale: parseFloat(p.scale || 1.0),
      length: parseFloat(p.length || 2.5),
      height: parseFloat(p.height || 2.5),
      depth: parseFloat(p.depth || 2.5),
      circumference: parseFloat(p.circumference || 6.0)
    }));

    window.activeStagePowerups = stagePowerups;
    state.stagePowerups = window.activeStagePowerups;
    console.log(`[GameManagerSync] 🔋 Integrated ${window.activeStagePowerups.length} active powerups for Stage ${currentStage} on [${currentDev.toUpperCase()}]`);
  }

  return true;
}

async function syncGameManagerFromDatabase(stageLevel = null, deviceType = null) {
  const targetLvl = stageLevel || currentActiveStage || 1;
  const dev = deviceType || currentActiveDeviceType || 'desktop';
  try {
    const data = await fetchGameManagerDatabaseValues(targetLvl, dev);
    if (data) {
      applyGameManagerValues(data, targetLvl, dev);
      return true;
    }
  } catch (err) {
    console.warn('[GameManagerSync] Error synchronizing Game Manager database values:', err);
  }
  return false;
}

function triggerAcquireEvent(eventName) {
  if (!eventName) return;
  if (!state.unlockedEvents) state.unlockedEvents = {};
  state.unlockedEvents[eventName] = true;

  if (state.acquirableEvents && state.acquirableEvents[eventName]) {
    const wid = state.acquirableEvents[eventName];
    if (weaponsSystem && weaponsSystem.weapons[wid]) {
      weaponsSystem.weapons[wid].acquired = true;
      weaponsSystem.weapons[wid].isAvailable = true;
      weaponsSystem.notify();
      if (typeof renderWeaponWheel === 'function') {
        renderWeaponWheel();
      }
    }
  }

  // Trigger any powerups configured to appear on this event
  if (typeof checkEventPowerupAppearance === 'function') {
    checkEventPowerupAppearance(eventName);
  }
}

function updateMissionObjectivesUI(stageRecord) {
  if (!stageRecord) return;
  const eventsBox = document.getElementById('tab-pane-missions');
  if (!eventsBox) return;

  let dbEventsContainer = document.getElementById('mission-database-events-box');
  if (!dbEventsContainer) {
    dbEventsContainer = document.createElement('div');
    dbEventsContainer.id = 'mission-database-events-box';
    dbEventsContainer.className = 'drawer-controls-box';
    eventsBox.appendChild(dbEventsContainer);
  }

  const eventsList = (stageRecord.events_within_level || '')
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  const eventsHtml = eventsList.map((evt, i) => `
    <div class="key-row" style="margin-bottom: 4px;">
      <span>Phase ${i + 1}: ${evt}</span>
      <span class="badge-val" style="color:var(--cyan-neon); font-size:0.68rem;">ACTIVE</span>
    </div>
  `).join('');

  dbEventsContainer.innerHTML = `
    <div class="section-subheading">
      <span>🛰️ LEVEL PROGRESSION &amp; MISSION EVENTS</span>
      <span style="font-size:0.65rem; color:var(--accent-gold); font-weight:bold;">PAR: ${(parseInt(stageRecord.par_score) || 5000).toLocaleString()} PTS</span>
    </div>
    <div style="font-size:0.64rem; color:var(--text-dim); margin-bottom:8px;">
      ${stageRecord.description || 'Navigate through hyperspace corridor and complete navigation objectives.'}
    </div>
    <div style="display:flex; flex-direction:column; gap:2px; margin-bottom:8px;">
      ${eventsHtml}
    </div>
    <div class="key-row" style="border-top:1px solid rgba(0,240,255,0.25); padding-top:6px; margin-top:4px;">
      <span style="color:var(--accent-gold); font-weight:bold;">🏁 LEVEL EXIT EVENT:</span>
      <span class="badge-val" style="color:var(--accent-green); font-size:0.68rem;">${stageRecord.end_level_event || 'Jump Gate Initialized'}</span>
    </div>
  `;
}

function updateTacticalEnemiesUI(enemiesList) {
  if (!Array.isArray(enemiesList) || enemiesList.length === 0) return;
  const missionsPane = document.getElementById('tab-pane-missions');
  if (!missionsPane) return;

  let threatsContainer = document.getElementById('mission-threat-registry-box');
  if (!threatsContainer) {
    threatsContainer = document.createElement('div');
    threatsContainer.id = 'mission-threat-registry-box';
    threatsContainer.className = 'drawer-controls-box';
    missionsPane.appendChild(threatsContainer);
  }

  const threatsHtml = enemiesList.map(e => `
    <div style="background:rgba(239,68,111,0.08); border:1px solid rgba(239,68,111,0.3); border-radius:6px; padding:8px 10px; margin-bottom:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-weight:bold; font-size:0.75rem; color:#fff;">${e.icon || '🛸'} ${(e.enemy_name || e.id).toUpperCase()}</span>
        <span style="font-size:0.65rem; padding:1px 6px; border-radius:3px; background:rgba(239,68,111,0.25); color:#ff85a1;">${e.threat_level || 'THREAT'}</span>
      </div>
      <div class="wpn-specs-grid" style="grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 0.65rem;">
        <div><span style="color:var(--text-dim);">3D Graphic:</span> <strong style="color:var(--cyan-neon);">${(e.model_3d_type || 'scout_drone').toUpperCase()}</strong></div>
        <div><span style="color:var(--text-dim);">Weapon:</span> <strong style="color:#ff6b8b;">${e.weapon_name || 'Plasma'} (${e.weapon_damage || 5} Dmg)</strong></div>
        <div><span style="color:var(--text-dim);">Hits to Destroy:</span> <strong style="color:#06d6a0;">${e.hits_to_destroy || e.hits || 2} HITS</strong></div>
        <div><span style="color:var(--text-dim);">Piercing:</span> <strong style="color:var(--cyan-neon);">${(e.piercing_weapon_id || e.piercing || 'any').toUpperCase()}</strong></div>
        <div><span style="color:var(--text-dim);">Armor:</span> <strong>${e.armor_strength || e.armor || 10}%</strong></div>
        <div><span style="color:var(--text-dim);">Bounty:</span> <strong style="color:var(--accent-gold);">${e.score_value || e.score || 100} PTS</strong></div>
      </div>
    </div>
  `).join('');

  threatsContainer.innerHTML = `
    <div class="section-subheading">
      <span>👾 ENEMY THREAT REGISTRY &amp; ARMOR SPECS</span>
      <span style="font-size:0.65rem; color:#ff85a1; font-weight:bold;">${enemiesList.length} UNITS</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:4px; margin-top:6px;">
      ${threatsHtml}
    </div>
  `;
}

// =============================================================================
// COLLAPSIBLE PANELS: LEFT (MISSION), TOP (TELEMETRY), BOTTOM (TACTICAL)
// Panels toggle open/closed ONLY when tab handle is selected (never auto-pinned).
// All open panels automatically close when the left hand joystick or flight
// controller is focused/used, unless the 'Auto hide' checkbox is unchecked.
// Only one panel open at a time unless auto hide is unchecked.
// =============================================================================
const leftDrawer = document.getElementById('left-drawer-container');
const drawerTab = document.getElementById('drawer-tab');
const btnToggleDrawer = document.getElementById('btn-toggle-drawer');

const topDrawer = document.getElementById('top-drawer-container');
const topDrawerTab = document.getElementById('top-drawer-tab');
const wormholeDistBadge = document.getElementById('wormhole-distance-badge');
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

// Close other open panels when a panel opens (enforces only one panel open unless auto hide is unchecked)
function closeOtherPanels(exceptPanel) {
  if (exceptPanel !== 'left' && leftDrawer && leftDrawer.classList.contains('open')) {
    leftDrawer.classList.remove('open');
    if (btnToggleDrawer) btnToggleDrawer.classList.remove('active');
  }
  if (exceptPanel !== 'top' && topDrawer && topDrawer.classList.contains('open')) {
    topDrawer.classList.remove('open');
    if (btnToggleHeader) btnToggleHeader.classList.remove('active');
  }
  if (exceptPanel !== 'bottom' && bottomDrawer && bottomDrawer.classList.contains('open')) {
    bottomDrawer.classList.remove('open');
  }
}

function handleFlightActivity() {
  if (state.isPaused) return;
  if (state.autoClose) {
    const wasAnyOpen = (leftDrawer && leftDrawer.classList.contains('open')) ||
                       (topDrawer && topDrawer.classList.contains('open')) ||
                       (bottomDrawer && bottomDrawer.classList.contains('open'));
    if (wasAnyOpen) {
      closeAllPanels();
    }
  }
}

// When the left hand joystick (or whichever joystick is focused) is focused or engaged,
// all open panels close except when auto hide is unchecked.
function handleLeftJoystickFocus(e) {
  handleFlightActivity();
}

function toggleLeftPanel(e) {
  if (e) e.stopPropagation();
  if (!leftDrawer) return;
  const willOpen = !leftDrawer.classList.contains('open');
  if (willOpen) {
    setCockpitTab('weapons'); // Default tab when the panel opens!
    if (state.autoClose && !state.isPaused) {
      closeOtherPanels('left');
    }
  }
  leftDrawer.classList.toggle('open', willOpen);
  if (btnToggleDrawer) btnToggleDrawer.classList.toggle('active', willOpen);
  updateLockoutHighlights();
}

function toggleTopPanel(e) {
  if (e) e.stopPropagation();
  if (!topDrawer) return;
  const willOpen = !topDrawer.classList.contains('open');
  if (willOpen && state.autoClose && !state.isPaused) {
    closeOtherPanels('top');
  }
  topDrawer.classList.toggle('open', willOpen);
  if (btnToggleHeader) btnToggleHeader.classList.toggle('active', willOpen);
  updateLockoutHighlights();
}

function toggleBottomPanel(e) {
  if (e) e.stopPropagation();
  if (!bottomDrawer) return;
  const willOpen = !bottomDrawer.classList.contains('open');
  if (willOpen && state.autoClose && !state.isPaused) {
    closeOtherPanels('bottom');
  }
  bottomDrawer.classList.toggle('open', willOpen);
  updateLockoutHighlights();
}

// Panel tab handles toggle open and closed when selected
if (drawerTab) {
  drawerTab.addEventListener('click', toggleLeftPanel);
}
if (btnToggleDrawer) {
  btnToggleDrawer.addEventListener('click', toggleLeftPanel);
}

// =============================================================================
// COCKPIT CONTROLS & MISSIONS PANEL TAB SWITCHER (WEAPONS DEFAULT, INFO, MISSIONS)
// =============================================================================
const tabBtnWeapons = document.getElementById('tab-btn-weapons');
const tabBtnInfo = document.getElementById('tab-btn-info');
const tabBtnMissions = document.getElementById('tab-btn-missions');
const tabPaneWeapons = document.getElementById('tab-pane-weapons');
const tabPaneInfo = document.getElementById('tab-pane-info');
const tabPaneMissions = document.getElementById('tab-pane-missions');

const drawerTabsList = [
  { id: 'weapons', btn: tabBtnWeapons, pane: tabPaneWeapons },
  { id: 'info', btn: tabBtnInfo, pane: tabPaneInfo },
  { id: 'missions', btn: tabBtnMissions, pane: tabPaneMissions }
];

function setCockpitTab(tabName) {
  drawerTabsList.forEach(t => {
    const isActive = (t.id === tabName);
    if (t.btn) {
      t.btn.classList.toggle('active', isActive);
      t.btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    if (t.pane) {
      t.pane.classList.toggle('active', isActive);
    }
  });

  updateLockoutHighlights();
}

// Attach Tab Click Listeners
if (tabBtnWeapons) {
  tabBtnWeapons.addEventListener('click', (e) => {
    e.stopPropagation();
    setCockpitTab('weapons');
  });
}
if (tabBtnInfo) {
  tabBtnInfo.addEventListener('click', (e) => {
    e.stopPropagation();
    setCockpitTab('info');
  });
}
if (tabBtnMissions) {
  tabBtnMissions.addEventListener('click', (e) => {
    e.stopPropagation();
    setCockpitTab('missions');
  });
}

// Support keyboard arrow navigation between all 3 tabs (Weapons <-> Info <-> Missions)
const tabButtonsArray = [tabBtnWeapons, tabBtnInfo, tabBtnMissions].filter(Boolean);
tabButtonsArray.forEach((btn, idx) => {
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (idx + 1) % tabButtonsArray.length;
      const nextTab = drawerTabsList[nextIdx].id;
      setCockpitTab(nextTab);
      tabButtonsArray[nextIdx].focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (idx - 1 + tabButtonsArray.length) % tabButtonsArray.length;
      const prevTab = drawerTabsList[prevIdx].id;
      setCockpitTab(prevTab);
      tabButtonsArray[prevIdx].focus();
    }
  });
});

// Centralized Control Lockout Verification Functions (for current & all future controls)
function isControlLockedOut() {
  return !!state.isPaused;
}
function assertNotPaused(controlName = 'Control') {
  if (state.isPaused) {
    return false;
  }
  return true;
}
window.isControlLockedOut = isControlLockedOut;
window.assertNotPaused = assertNotPaused;

// =============================================================================
// PAUSE / UN-PAUSE SIMULATION & LOCKOUT CONTROLLER
// Pauses all game animations, physics, audio drones, and weapons cooldown,
// opens Cockpit Controls & Missions panel with WEAPONS tab selected by default,
// locks out current and future gameplay controls with red highlight styling,
// and returns all controls to normal when unpaused.
// =============================================================================
const btnQuickPause = document.getElementById('btn-quick-pause');
const btnDrawerPause = document.getElementById('btn-drawer-pause');
const btnTogglePause = document.getElementById('btn-toggle-pause');
const weaponsLockedBanner = document.getElementById('weapons-locked-banner');
const missionsLockedBanner = document.getElementById('missions-locked-banner');
const infoLockedBanner = document.getElementById('info-locked-banner');
const topLockedBanner = document.getElementById('top-locked-banner');

function updateLockoutHighlights() {
  const isPaused = !!state.isPaused;

  // 1. Tab lockout: Weapons tab
  const isWeaponsActive = tabPaneWeapons && tabPaneWeapons.classList.contains('active');
  if (tabPaneWeapons) {
    tabPaneWeapons.classList.toggle('locked-out-red', isPaused && isWeaponsActive);
    tabPaneWeapons.querySelectorAll('button, .wpn-select-btn').forEach(btn => {
      btn.disabled = (isPaused && isWeaponsActive);
    });
  }
  if (weaponsLockedBanner) {
    weaponsLockedBanner.style.display = (isPaused && isWeaponsActive) ? 'block' : 'none';
  }

  // 2. Tab lockout: Missions tab
  const isMissionsActive = tabPaneMissions && tabPaneMissions.classList.contains('active');
  if (tabPaneMissions) {
    tabPaneMissions.classList.toggle('locked-out-red', isPaused && isMissionsActive);
    tabPaneMissions.querySelectorAll('.btn-action, button').forEach(btn => {
      btn.disabled = (isPaused && isMissionsActive);
    });
  }
  if (missionsLockedBanner) {
    missionsLockedBanner.style.display = (isPaused && isMissionsActive) ? 'block' : 'none';
  }

  // 3. Tab lockout: Info tab
  const isInfoActive = tabPaneInfo && tabPaneInfo.classList.contains('active');
  if (tabPaneInfo) {
    tabPaneInfo.classList.toggle('locked-out-red', isPaused && isInfoActive);
    tabPaneInfo.querySelectorAll('input, button').forEach(el => {
      el.disabled = (isPaused && isInfoActive);
    });
  }
  if (infoLockedBanner) {
    infoLockedBanner.style.display = (isPaused && isInfoActive) ? 'block' : 'none';
  }

  // 4. HUD Weapon Selector Pill lockout
  const hudWpnPill = document.getElementById('hud-weapon-indicator');
  if (hudWpnPill) {
    if (isPaused) {
      hudWpnPill.style.pointerEvents = 'none';
      hudWpnPill.style.opacity = '0.6';
    } else {
      hudWpnPill.style.pointerEvents = '';
      hudWpnPill.style.opacity = '';
    }
  }

  // 5. Panel lockout: Top Drawer (Telemetry & Modes Header)
  const isTopOpen = topDrawer && topDrawer.classList.contains('open');
  const topHeader = topDrawer ? topDrawer.querySelector('.hud-header') : null;
  if (topHeader) {
    topHeader.classList.toggle('panel-locked-red', isPaused && isTopOpen);
    topHeader.querySelectorAll('select, button:not(#btn-drawer-pause):not(#btn-quick-pause)').forEach(el => {
      el.disabled = (isPaused && isTopOpen);
    });
  }
  if (topDrawerTab) {
    topDrawerTab.classList.toggle('panel-locked-red', isPaused && isTopOpen);
  }
  if (topLockedBanner) {
    topLockedBanner.style.display = (isPaused && isTopOpen) ? 'block' : 'none';
  }

  // 6. Panel lockout: Bottom Drawer (Tactical Controls HUD)
  const isBottomOpen = bottomDrawer && bottomDrawer.classList.contains('open');
  const bottomFooter = bottomDrawer ? bottomDrawer.querySelector('#hud-panel') : null;
  if (bottomFooter) {
    bottomFooter.classList.toggle('panel-locked-red', isPaused && isBottomOpen);
    bottomFooter.querySelectorAll('button:not(#btn-toggle-pause), input').forEach(el => {
      el.disabled = (isPaused && isBottomOpen);
    });
  }
  if (bottomDrawerTab) {
    bottomDrawerTab.classList.toggle('panel-locked-red', isPaused && isBottomOpen);
  }
}

function setGamePaused(paused, skipDrawer = false) {
  state.isPaused = !!paused;

  const pauseBtns = [btnQuickPause, btnDrawerPause, btnTogglePause];
  pauseBtns.forEach(btn => {
    if (!btn) return;
    btn.classList.toggle('is-paused', state.isPaused);
    const iconEl = btn.querySelector('.pause-icon');
    const textEl = btn.querySelector('.pause-text');
    if (iconEl) iconEl.textContent = state.isPaused ? '▶' : '⏸';
    if (textEl) {
      if (btn.id === 'btn-toggle-pause') {
        textEl.textContent = state.isPaused ? 'Resume' : 'Pause';
      } else {
        textEl.textContent = state.isPaused ? 'RESUME' : 'PAUSE';
      }
    }
  });

  if (state.isPaused) {
    // If mobile controls were hidden due to crosshair movement, unhide them upon pause
    if (state.mobileControlsHidden || document.body.classList.contains('mobile-crosshair-moving')) {
      state.mobileControlsHidden = false;
      document.body.classList.remove('mobile-crosshair-moving');
    }
    state.aimActive = false;
    state.aimMove.x = 0;
    state.aimMove.y = 0;
    if (aimStickKnob) aimStickKnob.style.transform = 'translate(0px, 0px)';

    document.body.classList.add('game-paused');

    // Release pointer lock if active
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch(e) {}
    }
    state.isPointerLocked = false;
    state.isMouseDown = false;

    // Clear any held movement keys
    Object.keys(keys).forEach(k => { keys[k] = false; });
    state.velocity.set(0, 0, 0);

    // Open Cockpit Controls & Missions panel with WEAPONS tab selected by default (unless paused by modal selector)
    if (!skipDrawer) {
      if (leftDrawer) {
        leftDrawer.classList.add('open');
      }
      if (btnToggleDrawer) {
        btnToggleDrawer.classList.add('active');
      }
      setCockpitTab('weapons'); // Weapons is the default tab when panel opens!
    }

    // Suspend audio drone while paused
    if (audioMgr && audioMgr.droneAudio && !audioMgr.droneAudio.paused) {
      try { audioMgr.droneAudio.pause(); } catch(e) {}
    }

    updateLockoutHighlights();
  } else {
    document.body.classList.remove('game-paused');

    // Synchronize lastFrameTime so no time delta jump occurs on unpause
    state.lastFrameTime = performance.now();

    // Clear all red lockout highlights and re-enable controls
    updateLockoutHighlights();

    // Resume audio drone if sound is enabled
    if (!CONFIG.audioMuted && audioMgr && audioMgr.droneAudio) {
      try { audioMgr.droneAudio.play(); } catch(e) {}
    }
  }
}

// Attach Weapon Click & Selector Event Handlers
function initWeaponsInteractions() {
  const redBtn = document.getElementById('btn-select-red_laser');
  const redCard = document.getElementById('card-wpn-red_laser');
  if (redBtn) {
    redBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!assertNotPaused('Weapon Selection')) return;
      weaponsSystem.selectWeapon('red_laser');
    });
  }
  if (redCard) {
    redCard.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (!assertNotPaused('Weapon Selection')) return;
      weaponsSystem.selectWeapon('red_laser');
    });
  }

  const blueBtn = document.getElementById('btn-select-blue_laser');
  const blueCard = document.getElementById('card-wpn-blue_laser');
  if (blueBtn) {
    blueBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!assertNotPaused('Weapon Selection')) return;
      weaponsSystem.selectWeapon('blue_laser');
    });
  }
  if (blueCard) {
    blueCard.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (!assertNotPaused('Weapon Selection')) return;
      weaponsSystem.selectWeapon('blue_laser');
    });
  }

  const tachyonBtn = document.getElementById('btn-select-tachyon_lance');
  const tachyonCard = document.getElementById('card-wpn-tachyon_lance');
  if (tachyonBtn) {
    tachyonBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!assertNotPaused('Weapon Selection')) return;
      weaponsSystem.selectWeapon('tachyon_lance');
    });
  }
  if (tachyonCard) {
    tachyonCard.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (!assertNotPaused('Weapon Selection')) return;
      weaponsSystem.selectWeapon('tachyon_lance');
    });
  }

  const hudPill = document.getElementById('hud-weapon-indicator');
  if (hudPill) {
    hudPill.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!assertNotPaused('Weapon Switch')) return;
      weaponsSystem.cycleWeapon();
    });
    hudPill.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  // Wire Weapons Selector Badge (Under the overheat badge, same size, toggles weapon wheel)
  const hudCycleBadge = document.getElementById('hud-weapon-cycle-badge');
  if (hudCycleBadge) {
    hudCycleBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWeaponWheel();
    });
    hudCycleBadge.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  // Wire Weapon Wheel Close Buttons & Backdrop
  const closeBtn = document.getElementById('weapon-wheel-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWeaponWheel();
    });
  }
  const centerHub = document.getElementById('weaponCenterHub') || document.getElementById('weaponCenterLogo');
  if (centerHub) {
    centerHub.addEventListener('click', (e) => {
      e.stopPropagation();
      playWheelSciFiLaser();
      closeWeaponWheel();
    });
    centerHub.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      playWheelSciFiLaser();
      closeWeaponWheel();
    }, { passive: true });
  }
  const backdrop = document.getElementById('weapon-wheel-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWeaponWheel();
    });
  }

  // Keyboard navigation & selection when Weapon Wheel is open
  window.addEventListener('keydown', (e) => {
    if (isWeaponWheelOpen()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeWeaponWheel();
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        selectHighlightedWheelSegment();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        cycleWheelSegment(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        cycleWheelSegment(-1);
      }
    }
  });

  // Mouse wheel scroll cycles weapon wheel segments when open
  window.addEventListener('wheel', (e) => {
    if (isWeaponWheelOpen()) {
      e.preventDefault();
      cycleWheelSegment(e.deltaY > 0 ? 1 : -1);
    }
  }, { passive: false });

  // Live real-time update of Weapon Wheel on system notify (overheat ticks, weapon equip)
  weaponsSystem.listeners.push(() => {
    if (isWeaponWheelOpen()) {
      renderWeaponWheel();
    }
  });

  // Initial UI refresh
  weaponsSystem.notify();
}
initWeaponsInteractions();

// ==========================================================================
// SEGMENTED CIRCLE WEAPON SELECTOR WHEEL (CALM CHESS GAMES STYLE)
// ==========================================================================
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z'
  ].join(' ');
}

function describeTextPath(cx, cy, radius, startAngle, endAngle, sweepClockwise) {
  const pStart = polarToCartesian(cx, cy, radius, sweepClockwise ? startAngle : endAngle);
  const pEnd = polarToCartesian(cx, cy, radius, sweepClockwise ? endAngle : startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
  const sweepFlag = sweepClockwise ? '1' : '0';
  return `M ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${pEnd.x} ${pEnd.y}`;
}

let wheelLaserAudioCtx = null;
function playWheelSciFiLaser() {
  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;
    if (!wheelLaserAudioCtx) wheelLaserAudioCtx = new AudioCtxClass();
    if (wheelLaserAudioCtx.state === 'suspended') wheelLaserAudioCtx.resume();

    const now = wheelLaserAudioCtx.currentTime;
    const oscPrimary = wheelLaserAudioCtx.createOscillator();
    oscPrimary.type = 'sawtooth';
    oscPrimary.frequency.setValueAtTime(1550, now);
    oscPrimary.frequency.exponentialRampToValueAtTime(70, now + 0.17);

    const oscSecondary = wheelLaserAudioCtx.createOscillator();
    oscSecondary.type = 'sine';
    oscSecondary.frequency.setValueAtTime(900, now);
    oscSecondary.frequency.exponentialRampToValueAtTime(110, now + 0.14);

    const biquadFilter = wheelLaserAudioCtx.createBiquadFilter();
    biquadFilter.type = 'bandpass';
    biquadFilter.Q.setValueAtTime(3.8, now);
    biquadFilter.frequency.setValueAtTime(2400, now);
    biquadFilter.frequency.exponentialRampToValueAtTime(240, now + 0.17);

    const gainEnvelope = wheelLaserAudioCtx.createGain();
    gainEnvelope.gain.setValueAtTime(0.35, now);
    gainEnvelope.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    oscPrimary.connect(biquadFilter);
    oscSecondary.connect(biquadFilter);
    biquadFilter.connect(gainEnvelope);
    gainEnvelope.connect(wheelLaserAudioCtx.destination);

    oscPrimary.start(now);
    oscSecondary.start(now);
    oscPrimary.stop(now + 0.2);
    oscSecondary.stop(now + 0.2);
  } catch (err) {
    console.warn('Wheel laser audio synthesis error:', err);
  }
}

let weaponWheelSegments = [];
let activeWheelSegmentIndex = 0;

function isWeaponWheelOpen() {
  const overlay = document.getElementById('weapon-wheel-overlay');
  return overlay && overlay.style.display !== 'none';
}

function updateWheelSegmentHighlight() {
  if (!weaponWheelSegments || weaponWheelSegments.length === 0) return;
  if (activeWheelSegmentIndex < 0) activeWheelSegmentIndex = 0;
  if (activeWheelSegmentIndex >= weaponWheelSegments.length) activeWheelSegmentIndex = 0;

  weaponWheelSegments.forEach((seg, idx) => {
    if (seg.element) {
      if (idx === activeWheelSegmentIndex) {
        seg.element.classList.add('controller-highlighted');
      } else {
        seg.element.classList.remove('controller-highlighted');
      }
    }
  });

  const cur = weaponWheelSegments[activeWheelSegmentIndex];
  const hintEl = document.querySelector('.weapon-wheel-footer-hint');
  if (hintEl && cur) {
    const isWpn = cur.type === 'weapon';
    const isOver = isWpn && cur.isOverheated && cur.isOverheated();
    let statusText = '';
    if (isOver) {
      statusText = ' <span style="color:#ff3366;font-weight:bold;">[🔥 OVERHEATED]</span>';
    } else if (isWpn && cur.isEquipped && cur.isEquipped()) {
      statusText = ' <span style="color:#00f0ff;font-weight:bold;">[ACTIVE]</span>';
    }
    hintEl.innerHTML = '<span style="color:#00f0ff;font-weight:700;">[LB]</span> SELECT SEGMENT: <strong style="color:#ffd700;">' + (cur.name || cur.shortName) + '</strong>' + statusText + ' &bull; <span style="color:#00f0ff;font-weight:700;">[A]</span> ' + (isWpn ? 'EQUIP WEAPON' : 'CONFIRM');
  }
}

function cycleWheelSegment(direction = 1) {
  if (!weaponWheelSegments || weaponWheelSegments.length === 0) return;
  activeWheelSegmentIndex = (activeWheelSegmentIndex + direction + weaponWheelSegments.length) % weaponWheelSegments.length;
  updateWheelSegmentHighlight();
  playWheelSciFiLaser();
}

function selectHighlightedWheelSegment() {
  if (!weaponWheelSegments || weaponWheelSegments.length === 0) return;
  const cur = weaponWheelSegments[activeWheelSegmentIndex];
  if (cur && typeof cur.action === 'function') {
    try {
      cur.action({ preventDefault: () => {}, stopPropagation: () => {} });
    } catch (err) {
      console.error('[Arsenal] Error selecting segment:', err);
      closeWeaponWheel();
    }
  }
}

function openWeaponWheel() {
  const overlay = document.getElementById('weapon-wheel-overlay');
  const cycleBadge = document.getElementById('hud-weapon-cycle-badge');
  const cycleText = document.getElementById('hud-cycle-badge-text');
  const cycleIcon = document.getElementById('hud-cycle-badge-icon');
  if (!overlay) return;

  renderWeaponWheel();
  overlay.style.display = 'flex';

  if (cycleBadge) cycleBadge.classList.add('is-open');
  if (cycleText) cycleText.textContent = 'CLOSE';
  if (cycleIcon) cycleIcon.textContent = '✕';

  // Highlight active equipped weapon or first segment initially
  let initIdx = weaponWheelSegments.findIndex(s => s.type === 'weapon' && s.id === weaponsSystem.activeWeaponId);
  if (initIdx === -1) initIdx = 0;
  activeWheelSegmentIndex = initIdx;
  updateWheelSegmentHighlight();

  playWheelSciFiLaser();

  // Pause game when weapon wheel is opened
  if (!state.isPaused) {
    setGamePaused(true, true);
  }
}

function closeWeaponWheel() {
  const overlay = document.getElementById('weapon-wheel-overlay');
  const cycleBadge = document.getElementById('hud-weapon-cycle-badge');
  const cycleText = document.getElementById('hud-cycle-badge-text');
  const cycleIcon = document.getElementById('hud-cycle-badge-icon');
  if (overlay) {
    overlay.style.display = 'none';
  }

  if (cycleBadge) cycleBadge.classList.remove('is-open');
  if (cycleText) cycleText.textContent = 'Weapons';
  if (cycleIcon) cycleIcon.textContent = '🔄';

  if (weaponWheelSegments) {
    weaponWheelSegments.forEach(s => {
      if (s.element) s.element.classList.remove('controller-highlighted');
    });
  }

  const hintEl = document.querySelector('.weapon-wheel-footer-hint');
  if (hintEl) {
    hintEl.textContent = 'TAP A SEGMENT TO EQUIP WEAPON • OVERHEATED WEAPONS CANNOT BE SELECTED';
  }

  if (document.activeElement && document.activeElement.blur) {
    try { document.activeElement.blur(); } catch (e) {}
  }

  // Unpause game when weapons segmented selector closes
  if (state.isPaused) {
    setGamePaused(false);
  }
}

function toggleWeaponWheel() {
  if (isWeaponWheelOpen()) {
    closeWeaponWheel();
  } else {
    openWeaponWheel();
  }
}

function renderWeaponWheel() {
  const svg = document.getElementById('weaponRingSvg');
  if (!svg) return;
  svg.innerHTML = '';
  weaponWheelSegments = [];
  const cx = 250, cy = 250;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  // 1. Fetch all weapons currently available or acquired for this level / event
  let availableWeapons = Object.values(weaponsSystem.weapons).filter(w => w.isAvailable && w.acquired);
  if (availableWeapons.length === 0) {
    const act = weaponsSystem.getActiveWeapon();
    if (act) availableWeapons = [act];
  }

  const numWeapons = availableWeapons.length;
  // If only 1 weapon, draw two half arcs (180deg) to avoid SVG arc collapse at 360deg
  const segmentsOuter = numWeapons === 1 ? [availableWeapons[0], availableWeapons[0]] : availableWeapons;
  const numOuter = segmentsOuter.length;
  const angleStepOuter = 360 / numOuter;

  // 2. Render Outer Ring Segments
  segmentsOuter.forEach((w, i) => {
    const startAngle = i * angleStepOuter;
    const endAngle = (i + 1) * angleStepOuter;
    const midAngle = startAngle + (angleStepOuter / 2);
    const pathData = describeArc(cx, cy, 135, 215, startAngle + 1.5, endAngle - 1.5);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);

    const isEquipped = (w.id === weaponsSystem.activeWeaponId);
    let fill = '#ffe066';
    if (w.isOverheated) {
      fill = '#44111d';
    } else if (isEquipped) {
      fill = '#fff8cc';
    }
    path.setAttribute('fill', fill);

    let pathClass = 'ring-segment';
    if (isEquipped) pathClass += ' is-active-wpn';
    if (w.isOverheated) pathClass += ' is-overheated';
    path.setAttribute('class', pathClass);
    path.setAttribute('role', 'button');
    path.setAttribute('tabindex', '0');
    path.setAttribute('aria-label', `${w.name}${w.isOverheated ? ' - OVERHEATED' : (isEquipped ? ' - ACTIVE' : '')}`);

    const onSelect = (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (path.blur) path.blur();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      // OVERHEAT CHECK: unavailable to select when overheated!
      if (w.isOverheated) {
        if (audioMgr && audioMgr.playOverheatAlert) audioMgr.playOverheatAlert();
        showToast(`⚠️ ${w.shortName} OVERHEATED: UNAVAILABLE TO SELECT (${(w.overheatRemainingMs / 1000).toFixed(1)}s)`);
        return;
      }
      weaponsSystem.selectWeapon(w.id);
      playWheelSciFiLaser();
      closeWeaponWheel();
    };

    path.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (path.blur) path.blur();
      if (!w.isOverheated) playWheelSciFiLaser();
    };
    path.onclick = onSelect;
    path.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') onSelect(e);
    };
    path.onmouseenter = () => {
      const idx = weaponWheelSegments.findIndex(s => s.element === path);
      if (idx !== -1) {
        activeWheelSegmentIndex = idx;
        updateWheelSegmentHighlight();
      }
    };
    svg.appendChild(path);

    weaponWheelSegments.push({
      type: 'weapon',
      id: w.id,
      name: w.name,
      shortName: w.shortName,
      element: path,
      action: onSelect,
      isOverheated: () => w.isOverheated,
      isEquipped: () => (w.id === weaponsSystem.activeWeaponId)
    });

    // Curved Text along outer arc
    const sweepClockwise = !(midAngle > 100 && midAngle < 250);
    const textPathId = `outer-wpn-textpath-${i}`;
    const textRadius = 192;

    const textArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    textArc.setAttribute('id', textPathId);
    textArc.setAttribute('d', describeTextPath(cx, cy, textRadius, startAngle + 2, endAngle - 2, sweepClockwise));
    textArc.setAttribute('fill', 'none');
    defs.appendChild(textArc);

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('class', `ring-text ${w.isOverheated ? 'is-overheated-text' : ''}`);
    textEl.setAttribute('dominant-baseline', 'central');

    const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    textPath.setAttribute('href', '#' + textPathId);
    textPath.setAttribute('startOffset', '50%');
    textPath.setAttribute('text-anchor', 'middle');

    if (w.isOverheated) {
      textPath.textContent = `🔥 OVERHEATED (${(w.overheatRemainingMs / 1000).toFixed(1)}s)`;
    } else if (isEquipped) {
      textPath.textContent = `★ ${w.shortName} [ACTIVE]`;
    } else {
      textPath.textContent = w.shortName;
    }
    textEl.appendChild(textPath);
    svg.appendChild(textEl);

    // Big Icon at center of segment arc (radius ~156)
    // NOTE: When overheated, icon changes to 🔥 (flame) and indicates unavailable!
    const iconPos = polarToCartesian(cx, cy, 156, midAngle);
    const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    iconText.setAttribute('x', iconPos.x);
    iconText.setAttribute('y', iconPos.y);
    iconText.setAttribute('class', `ring-icon-symbol ${w.isOverheated ? 'is-overheated-icon' : ''}`);
    iconText.textContent = w.isOverheated ? '🔥' : (w.icon || '🔫');
    svg.appendChild(iconText);
  });

  // 3. Render Inner Ring Segments (Action / Utility / Cycling)
  const innerDefs = [
    { id: 'cycle', title: '🔄 CYCLE NEXT', icon: '🔄', action: () => { weaponsSystem.cycleWeapon(); closeWeaponWheel(); } },
    { id: 'close', title: '✕ CLOSE', icon: '✕', action: () => { closeWeaponWheel(); } }
  ];
  if (numWeapons >= 3) {
    const act = weaponsSystem.getActiveWeapon();
    innerDefs.push({
      id: 'active_status',
      title: act ? `⚡ ${act.energy}% ENERGY` : '⚡ ENERGY',
      icon: '⚡',
      action: () => { closeWeaponWheel(); }
    });
    innerDefs.push({
      id: 'specs',
      title: '🛡️ ARSENAL',
      icon: '🛡️',
      action: () => { closeWeaponWheel(); }
    });
  }

  const numInner = innerDefs.length;
  const angleStepInner = 360 / numInner;

  innerDefs.forEach((seg, i) => {
    const startAngle = i * angleStepInner;
    const endAngle = (i + 1) * angleStepInner;
    const midAngle = startAngle + (angleStepInner / 2);
    const pathData = describeArc(cx, cy, 75, 125, startAngle + 1.5, endAngle - 1.5);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', '#ffd700');
    path.setAttribute('class', 'ring-segment');
    path.setAttribute('role', 'button');
    path.setAttribute('tabindex', '0');
    path.setAttribute('aria-label', seg.title);

    const onAction = (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (path.blur) path.blur();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      playWheelSciFiLaser();
      seg.action();
    };
    path.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (path.blur) path.blur();
      playWheelSciFiLaser();
    };
    path.onclick = onAction;
    path.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') onAction(e);
    };
    path.onmouseenter = () => {
      const idx = weaponWheelSegments.findIndex(s => s.element === path);
      if (idx !== -1) {
        activeWheelSegmentIndex = idx;
        updateWheelSegmentHighlight();
      }
    };
    svg.appendChild(path);

    weaponWheelSegments.push({
      type: 'action',
      id: seg.id,
      name: seg.title,
      shortName: seg.title,
      element: path,
      action: onAction,
      isOverheated: () => false,
      isEquipped: () => false
    });

    const textRadius = 100;
    const sweepClockwise = !(midAngle > 90 && midAngle < 270);
    const textPathId = `inner-util-textpath-${i}`;

    const textArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    textArc.setAttribute('id', textPathId);
    textArc.setAttribute('d', describeTextPath(cx, cy, textRadius, startAngle + 2, endAngle - 2, sweepClockwise));
    textArc.setAttribute('fill', 'none');
    defs.appendChild(textArc);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'ring-text');
    text.setAttribute('dominant-baseline', 'central');

    const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    textPath.setAttribute('href', '#' + textPathId);
    textPath.setAttribute('startOffset', '50%');
    textPath.setAttribute('text-anchor', 'middle');
    textPath.textContent = seg.title;

    text.appendChild(textPath);
    svg.appendChild(text);
  });
}

// Global scope bindings for debug or external callers
window.openWeaponWheel = openWeaponWheel;
window.closeWeaponWheel = closeWeaponWheel;
window.toggleWeaponWheel = toggleWeaponWheel;
window.renderWeaponWheel = renderWeaponWheel;
window.cycleWheelSegment = cycleWheelSegment;
window.selectHighlightedWheelSegment = selectHighlightedWheelSegment;


// Wire Pause Button Click & Touch Handlers
let lastPauseToggleTime = 0;
[btnQuickPause, btnDrawerPause, btnTogglePause].forEach(btn => {
  if (btn) {
    const handlePauseToggle = (e) => {
      e.stopPropagation();
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      const now = performance.now();
      if (now - lastPauseToggleTime < 250) return;
      lastPauseToggleTime = now;
      setGamePaused(!state.isPaused);
    };
    btn.addEventListener('click', handlePauseToggle);
    btn.addEventListener('touchstart', handlePauseToggle, { passive: false });
  }
});

if (topDrawerTab) {
  topDrawerTab.addEventListener('click', toggleTopPanel);
}
if (wormholeDistBadge) {
  wormholeDistBadge.addEventListener('click', toggleTopPanel);
}
if (btnToggleHeader) {
  btnToggleHeader.addEventListener('click', toggleTopPanel);
}

if (bottomDrawerTab) {
  bottomDrawerTab.addEventListener('click', toggleBottomPanel);
}

// Synchronize all Auto Close / Auto Hide checkboxes across panels
function setAutoClose(val) {
  state.autoClose = val;
  document.querySelectorAll('.chk-auto-close').forEach(chk => {
    chk.checked = val;
  });
  if (val) {
    // If auto hide is checked and multiple panels are open, enforce single open panel
    let openCount = 0;
    if (leftDrawer && leftDrawer.classList.contains('open')) openCount++;
    if (topDrawer && topDrawer.classList.contains('open')) openCount++;
    if (bottomDrawer && bottomDrawer.classList.contains('open')) openCount++;
    if (openCount > 1) {
      if (leftDrawer && leftDrawer.classList.contains('open')) {
        closeOtherPanels('left');
      } else if (topDrawer && topDrawer.classList.contains('open')) {
        closeOtherPanels('top');
      }
    }
  }
}

document.querySelectorAll('.chk-auto-close').forEach(chk => {
  chk.addEventListener('change', (e) => {
    setAutoClose(e.target.checked);
  });
});

// Keyboard shortcuts for toggling panels & pause
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    // 1. If crosshair is captured or was just released by Esc via browser native pointerlock exit, release capture and do NOT toggle pause
    if (state.isPointerLocked || document.pointerLockElement || (performance.now() - state.lastPointerLockExitTime < 250)) {
      e.preventDefault();
      e.stopPropagation();
      if (document.pointerLockElement) {
        try { document.exitPointerLock(); } catch(err) {}
      }
      state.isPointerLocked = false;
      state.isLeftMouseDown = false;
      state.isRightMouseDown = false;
      return;
    }
    // 2. If weapon wheel is open, close it
    if (typeof isWeaponWheelOpen === 'function' && isWeaponWheelOpen()) {
      e.preventDefault();
      closeWeaponWheel();
      return;
    }
    // 3. If modal overlay is open, close it
    if (modalOverlay && modalOverlay.style.display === 'flex') {
      e.preventDefault();
      closeUnsupportedModal();
      return;
    }
    // 4. Otherwise toggle pause
    e.preventDefault();
    setGamePaused(!state.isPaused);
    return;
  }
  if (e.code === 'KeyP') {
    e.preventDefault();
    setGamePaused(!state.isPaused);
    return;
  }
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

// Helpers for orientation detection across mobile browsers & APIs
function isDeviceInPortrait() {
  if (screen.orientation && screen.orientation.type) {
    if (screen.orientation.type.startsWith('portrait')) return true;
    if (screen.orientation.type.startsWith('landscape')) return false;
  }
  if (typeof window.orientation === 'number') {
    if (window.orientation === 0 || window.orientation === 180) return true;
    if (Math.abs(window.orientation) === 90) return false;
  }
  if (window.matchMedia) {
    if (window.matchMedia('(orientation: portrait)').matches) return true;
    if (window.matchMedia('(orientation: landscape)').matches) return false;
  }
  return window.innerWidth < window.innerHeight;
}

function isDeviceInLandscape() {
  if (screen.orientation && screen.orientation.type) {
    if (screen.orientation.type.startsWith('landscape')) return true;
    if (screen.orientation.type.startsWith('portrait')) return false;
  }
  if (typeof window.orientation === 'number') {
    if (Math.abs(window.orientation) === 90) return true;
    if (window.orientation === 0 || window.orientation === 180) return false;
  }
  if (window.matchMedia) {
    if (window.matchMedia('(orientation: landscape)').matches) return true;
    if (window.matchMedia('(orientation: portrait)').matches) return false;
  }
  return window.innerWidth >= window.innerHeight;
}

// Dismiss or manage mobile fullscreen rotate advisory prompt
const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
const btnCloseRotateTop = document.getElementById('btn-close-rotate-top');
const landscapePrompt = document.getElementById('landscape-rotate-prompt');

function dismissRotatePrompt() {
  if (landscapePrompt) {
    landscapePrompt.classList.remove('active');
    landscapePrompt.classList.add('dismissed');
    landscapePrompt.style.display = 'none';
  }
  document.body.classList.add('portrait-dismissed');
}

if (btnDismissRotate) {
  btnDismissRotate.addEventListener('click', dismissRotatePrompt);
}
if (btnCloseRotateTop) {
  btnCloseRotateTop.addEventListener('click', dismissRotatePrompt);
}

function handleOrientationPromptUpdate() {
  const isLandscape = isDeviceInLandscape();
  if (isLandscape) {
    if (landscapePrompt) {
      landscapePrompt.classList.remove('active');
      landscapePrompt.style.display = 'none';
    }
    document.body.classList.remove('portrait-dismissed');
    if (state.hasStarted) {
      centerWormholeOnScreen();
    }
  } else {
    // If during active gameplay flight the user rotates back to portrait, show rotate prompt unless dismissed
    if (state.hasStarted && landscapePrompt && !landscapePrompt.classList.contains('dismissed')) {
      landscapePrompt.classList.add('active');
      landscapePrompt.style.display = 'flex';
    }
  }
}

window.addEventListener('resize', handleOrientationPromptUpdate);
window.addEventListener('orientationchange', handleOrientationPromptUpdate);
if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
  screen.orientation.addEventListener('change', handleOrientationPromptUpdate);
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
  });
}
// =============================================================================
// =============================================================================
// STAGE & DEVICE LEVEL PROGRESSION & CUSTOMIZATION MANAGER
// =============================================================================

function getDeviceTypeFromMode(mode) {
  if (mode === 'desktop-vr') return 'vr';
  if (mode === 'mobile-ar') return 'arcore';
  if (mode === 'mobile-xr') return 'mobile';
  return 'desktop';
}

function getEngineApi() {
  return {
    state,
    CONFIG,
    scene,
    camera,
    cameraRig,
    controllers,
    controllerGrips,
    controllerLasers,
    renderer,
    audioMgr,
    weaponsSystem,
    starfield,
    floatingDust,
    wormholeCorona,
    accretionDiskMesh,
    accretionDiskMesh2,
    accretionUniforms,
    secondaryDiskMaterial,
    photonSphere,
    photonRingMaterial,
    photonRingUniforms,
    horizonMesh,
    shockwaves,
    particleSystem,
    particleMaterial,
    ambientLight,
    wormholeCoreLight,
    secondaryLight,
    compositeShader,
    centerWormholeOnScreen,
    alignToWormhole,
    fireLaserBeam,
    triggerWarpJump,
    execute180Turn,
    execute360Turn,
    cancelTurn,
    showToast,
    xrBaseHmdPos,
    isXrBasePoseCaptured: () => xrBasePoseCaptured,
    setXrBasePoseCaptured: (val) => { xrBasePoseCaptured = !!val; },
    resetXrBasePose: () => {
      xrBasePoseCaptured = false;
      xrBaseHmdPos.set(0, 0, 0);
    },
    registerVrFrameHook: (hookFn) => {
      activeVrFrameHook = typeof hookFn === 'function' ? hookFn : null;
    },
    setHudStatus: (statusText) => {
      const hudStatus = document.getElementById('hud-status');
      if (hudStatus) hudStatus.textContent = statusText;
    },
    setThemeColors: (visual) => {
      if (!visual) return;
      if (visual.primaryColor) {
        document.documentElement.style.setProperty('--cyan-neon', visual.primaryColor);
        document.documentElement.style.setProperty('--cyan-glow', visual.glowColor || 'rgba(0, 240, 255, 0.45)');
      }
      if (visual.panelBg) {
        document.documentElement.style.setProperty('--panel-bg', visual.panelBg);
      }
      if (visual.panelBorder) {
        document.documentElement.style.setProperty('--panel-border', visual.panelBorder);
      }
      if (visual.uniforms) {
        if (typeof accretionUniforms !== 'undefined' && accretionUniforms) {
          if (accretionUniforms.uColorEdge && visual.uniforms.uColorEdge) {
            accretionUniforms.uColorEdge.value.setHex(visual.uniforms.uColorEdge);
          }
          if (accretionUniforms.uColorCore && visual.uniforms.uColorCore) {
            accretionUniforms.uColorCore.value.setHex(visual.uniforms.uColorCore);
          }
          if (accretionUniforms.uColorHot && visual.uniforms.uColorHot) {
            accretionUniforms.uColorHot.value.setHex(visual.uniforms.uColorHot);
          }
        }
        if (typeof secondaryDiskMaterial !== 'undefined' && secondaryDiskMaterial && secondaryDiskMaterial.uniforms && visual.uniforms.uColorEdge) {
          secondaryDiskMaterial.uniforms.uColorEdge.value.setHex(visual.uniforms.uColorEdge);
        }
        if (typeof photonRingMaterial !== 'undefined' && photonRingMaterial && photonRingMaterial.uniforms && photonRingMaterial.uniforms.uHaloColor && visual.uniforms.uHaloColor) {
          photonRingMaterial.uniforms.uHaloColor.value.setHex(visual.uniforms.uHaloColor);
        }
      }
      if (visual.lights) {
        if (typeof ambientLight !== 'undefined' && ambientLight && visual.lights.ambient) {
          ambientLight.color.setHex(visual.lights.ambient);
        }
        if (typeof wormholeCoreLight !== 'undefined' && wormholeCoreLight && visual.lights.center) {
          wormholeCoreLight.color.setHex(visual.lights.center);
        }
        if (typeof wormholeCenterLight !== 'undefined' && wormholeCenterLight && visual.lights.center) {
          wormholeCenterLight.color.setHex(visual.lights.center);
        }
        if (typeof secondaryLight !== 'undefined' && secondaryLight && visual.lights.center) {
          secondaryLight.color.setHex(visual.lights.center);
        }
      }
    },
    setFlightConfig: (flight) => {
      if (!flight) return;
      if (flight.speed) CONFIG.flightSpeed = flight.speed;
      if (flight.boostMultiplier) CONFIG.boostMultiplier = flight.boostMultiplier;
      if (flight.pitchSpeed) CONFIG.pitchSpeed = flight.pitchSpeed;
      if (flight.yawSpeed) CONFIG.yawSpeed = flight.yawSpeed;
    },
    setWeapons: (weaponsConfig) => {
      if (!weaponsConfig || !weaponsSystem) return;
      if (weaponsConfig.initial) {
        const initWpn = weaponsConfig.initial;
        const initData = {
          id: initWpn.id,
          name: initWpn.name,
          shortName: (initWpn.name || initWpn.id).toUpperCase(),
          icon: initWpn.icon || '⚡',
          colorHex: initWpn.color ? parseInt(initWpn.color.replace('#', '0x'), 16) : 0xffd166,
          cssColor: initWpn.color || '#ffd166',
          glowColor: initWpn.glowColor || hexToRgbaString(initWpn.color || '#ffd166', 0.65),
          energyCost: initWpn.energy_drain_pct !== undefined ? parseFloat(initWpn.energy_drain_pct) : 15,
          canOverheat: initWpn.can_overheat !== undefined ? (parseInt(initWpn.can_overheat) !== 0) : true,
          cooldownDurationSec: initWpn.cooldown_seconds !== undefined ? parseFloat(initWpn.cooldown_seconds) : 6,
          damagePerHit: initWpn.damage_per_hit || initWpn.damage || 1,
          bulletSpeed: initWpn.bullet_speed || 800,
          boltLength: 12.0,
          boltRadius: 0.20,
          bulletLifetime: 2.8,
          bulletLightIntensity: 5.0,
          description: initWpn.description || '',
          stageUnlocked: currentActiveStage,
          isInitialWeapon: true,
          acquired: true,
          isAvailable: true
        };
        if (!weaponsSystem.weapons[initWpn.id]) {
          weaponsSystem.registerWeapon(initData);
        } else {
          Object.assign(weaponsSystem.weapons[initWpn.id], initData);
        }
        if (typeof weaponsSystem.equipWeapon === 'function') {
          weaponsSystem.equipWeapon(initWpn.id);
        }
      }
      if (Array.isArray(weaponsConfig.acquirable) && weaponsSystem) {
        for (const acq of weaponsConfig.acquirable) {
          const isAcq = acq.acquire_event === 'default_start' || (state.unlockedEvents && state.unlockedEvents[acq.acquire_event]);
          const acqData = {
            id: acq.id,
            name: acq.name,
            shortName: (acq.name || acq.id).toUpperCase(),
            icon: acq.icon || '🔫',
            colorHex: acq.color ? parseInt(acq.color.replace('#', '0x'), 16) : 0x00f0ff,
            cssColor: acq.color || '#00f0ff',
            glowColor: acq.glowColor || hexToRgbaString(acq.color || '#00f0ff', 0.65),
            energyCost: acq.energy_drain_pct !== undefined ? parseFloat(acq.energy_drain_pct) : 15,
            canOverheat: acq.can_overheat !== undefined ? (parseInt(acq.can_overheat) !== 0) : true,
            cooldownDurationSec: acq.cooldown_seconds !== undefined ? parseFloat(acq.cooldown_seconds) : 6,
            damagePerHit: acq.damage_per_hit || acq.damage || 1,
            bulletSpeed: acq.bullet_speed || 700,
            boltLength: 10.0,
            boltRadius: 0.18,
            bulletLifetime: 2.5,
            bulletLightIntensity: 4.0,
            description: acq.description || '',
            stageUnlocked: currentActiveStage,
            isAcquirable: true,
            acquireEvent: acq.acquire_event,
            acquired: !!isAcq,
            isAvailable: !!isAcq
          };
          if (!weaponsSystem.weapons[acq.id]) {
            weaponsSystem.registerWeapon(acqData);
          } else {
            Object.assign(weaponsSystem.weapons[acq.id], acqData);
          }
        }
      }
      weaponsSystem.updateCrosshairWeaponRing();
      weaponsSystem.notify();
      if (typeof renderWeaponWheel === 'function') {
        renderWeaponWheel();
      }
      if (weaponsSystem && typeof weaponsSystem.updateWeaponsTabUI === 'function') {
        weaponsSystem.updateWeaponsTabUI();
      }
    },
    setEnemies: (enemiesConfig) => {
      window.activeStageEnemies = enemiesConfig;
    },
    setStageObjectives: (objectives) => {
      state.activeStageObjectives = Array.isArray(objectives) ? objectives : [];
      if (typeof renderStageObjectivesUI === 'function') {
        renderStageObjectivesUI();
      }
    },
    setDeviceControls: (controls) => {
      if (!controls) return;
      const aimStick = document.getElementById('aim-stick-zone');
      const touchThrottle = document.getElementById('touch-throttle-zone');
      if (aimStick) aimStick.style.display = controls.showVirtualJoysticks ? 'flex' : 'none';
      if (touchThrottle) touchThrottle.style.display = controls.showVirtualJoysticks ? 'flex' : 'none';
    },
    setSpinAudioEnabled: (enabled) => {
      if (audioMgr && typeof audioMgr.setSpinAudioEnabled === 'function') {
        audioMgr.setSpinAudioEnabled(enabled);
      }
    },
    setAudioConfig: (audioConfig) => {
      if (!audioConfig) {
        if (audioMgr) audioMgr.setSpinAudioEnabled(true);
        return;
      }
      const enabled = audioConfig.enableCoilAudio !== false && audioConfig.spin180Sound !== null;
      if (audioMgr) audioMgr.setSpinAudioEnabled(enabled);
    }
  };
}

async function loadStageDeviceModule(stageLevel = 1, deviceType = 'desktop') {
  const stage = STAGE_REGISTRY[stageLevel] || {
    level: stageLevel,
    name: `Stage ${stageLevel}`,
    slug: `stage_${stageLevel}`
  };
  currentActiveStage = stage.level;
  currentActiveDeviceType = deviceType;

  // Dynamic cache-busting timestamp guarantees browser fetches & executes fresh stage JS on every switch/reload
  const timestamp = Date.now();
  const scriptRelative = `../${deviceType}/${stage.slug}_${deviceType}.js?t=${timestamp}`;
  const directPath = `./${deviceType}/${stage.slug}_${deviceType}.js?t=${timestamp}`;
  console.log(`[Wormhole XR Engine] Dynamically loading stage device script: ${scriptRelative}`);

  try {
    let mod = null;
    try {
      mod = await import(scriptRelative);
    } catch (e1) {
      try {
        mod = await import(directPath);
      } catch (e2) {
        console.warn(`[Wormhole XR Engine] Dynamic import fallback for ${stage.slug}:`, e2);
      }
    }
    activeStageModule = mod;
    activeVrFrameHook = null;
    const api = getEngineApi();
    if (mod && typeof mod.applyStage === 'function') {
      mod.applyStage(api);
    } else if (mod && mod.default && typeof mod.default.applyStage === 'function') {
      mod.default.applyStage(api);
    }

    // At level change: check all admin console game manager database values and update the game values
    try {
      await syncGameManagerFromDatabase(stage.level, deviceType);
    } catch (syncErr) {
      console.warn('[Wormhole XR Engine] Game Manager database sync error on level change:', syncErr);
    }

    // Keep DOM script tag synchronized for DevTools Elements panel inspection
    try {
      let stageScriptEl = document.getElementById('active-stage-script');
      if (!stageScriptEl) {
        stageScriptEl = document.createElement('script');
        stageScriptEl.id = 'active-stage-script';
        stageScriptEl.type = 'module';
        document.head.appendChild(stageScriptEl);
      }
      stageScriptEl.src = `${deviceType}/${stage.slug}_${deviceType}.js?t=${timestamp}`;
      stageScriptEl.dataset.stageLevel = stage.level;
      stageScriptEl.dataset.deviceType = deviceType;
    } catch (domErr) {
      console.warn('[Wormhole XR Engine] Could not update active-stage-script tag:', domErr);
    }

    // Synchronize UI headers and selectors
    const jumpSelect = document.getElementById('select-stage-jump');
    if (jumpSelect && parseInt(jumpSelect.value) !== currentActiveStage) {
      jumpSelect.value = currentActiveStage.toString();
    }

    const splashSub = document.querySelector('.splash-game-sub');
    if (splashSub) {
      splashSub.textContent = `STAGE ${stage.level}: ${stage.name.toUpperCase()}`;
    }

    const missionHeading = document.querySelector('#tab-pane-missions .section-subheading span:first-child');
    if (missionHeading) {
      missionHeading.textContent = `🎯 STAGE ${stage.level} OBJECTIVES`;
    }

    // Synchronize spin audio configuration: Stage 1 disables spin audio; Stage 2, 3, 4 enable it
    const stageAudioConfig = (mod.stageConfig && mod.stageConfig.audio) || (mod.default && mod.default.stageConfig && mod.default.stageConfig.audio);
    if (stageAudioConfig) {
      api.setAudioConfig(stageAudioConfig);
    } else {
      api.setSpinAudioEnabled(stage.level !== 1);
    }

    if (audioMgr && typeof audioMgr.setStageDeviceAudio === 'function') {
      audioMgr.setStageDeviceAudio(stage.slug, deviceType);
    }

    // Reset stage combat counters and apply stage objectives
    state.stageKills = 0;
    state.isWarpReady = false;
    if (typeof despawnAllActiveEnemies === 'function') {
      despawnAllActiveEnemies();
    }
    const activeCfg = (mod && mod.stageConfig) ? mod.stageConfig : (mod && mod.default && mod.default.stageConfig) ? mod.default.stageConfig : null;
    if (activeCfg) {
      if (activeCfg.required_enemy_kills) state.stageRequiredKills = parseInt(activeCfg.required_enemy_kills) || 10;
      if (activeCfg.warp_target_distance) state.stageTargetDistance = parseInt(activeCfg.warp_target_distance) || 50000;
      if (activeCfg.mission_objectives) state.stageMissionBriefing = activeCfg.mission_objectives;
      if (activeCfg.objectives) state.activeStageObjectives = activeCfg.objectives;
    }
    if (typeof renderStageObjectivesUI === 'function') {
      renderStageObjectivesUI();
    }

    window.dispatchEvent(new CustomEvent('wormholeStageChanged', {
      detail: { stageLevel: currentActiveStage, stageName: stage.name, deviceType, scriptPath: scriptRelative }
    }));

    return mod;
  } catch (err) {
    console.error(`[Wormhole XR Engine] Failed to load stage module: ${scriptRelative}`, err);
    return null;
  }
}

// MULTI-PLATFORM & XR MODE SWITCHER
// =============================================================================
const selectModeEl = document.getElementById('select-mode');
if (selectModeEl) {
  selectModeEl.addEventListener('change', (e) => {
    state.xrMode = e.target.value;
    handleModeChange(state.xrMode);
    const devType = getDeviceTypeFromMode(state.xrMode);
    loadStageDeviceModule(currentActiveStage, devType);
  });
}

// Stage Jump Debug Selector & Live Sync Button
const selectStageJumpEl = document.getElementById('select-stage-jump');
if (selectStageJumpEl) {
  selectStageJumpEl.addEventListener('change', (e) => {
    const targetStage = parseInt(e.target.value) || 1;
    console.log(`[Wormhole XR Debug] Stage jump selected: Stage ${targetStage}`);
    loadStageDeviceModule(targetStage, currentActiveDeviceType);
  });
  // Check for any newly created stages when dropdown is opened/focused
  selectStageJumpEl.addEventListener('focus', () => {
    if (typeof syncStagesDropdownFromDatabase === 'function') {
      syncStagesDropdownFromDatabase(false);
    }
  });
}

const btnRefreshStagesEl = document.getElementById('btn-refresh-stages');
if (btnRefreshStagesEl) {
  btnRefreshStagesEl.addEventListener('click', () => {
    if (typeof syncStagesDropdownFromDatabase === 'function') {
      syncStagesDropdownFromDatabase(true);
    }
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

    // 1. SPECIFIC CHECK: DESKTOP VR (PCVR / HMD / Immersive Web Emulator)
    if (mode === 'desktop-vr') {
      if (!effVrSupported || effDevType === 'tablet') {
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
      return;
    }
  }

  // All checks passed: hide warning modal
  hideUnsupportedBadge();

  // If user explicitly ran "Test Device" or validation succeeded, show positive notification
  if (forceShowValidation || mode === 'desktop-xr') {
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
  } else if (mode === 'desktop-vr') {
    state.postProcessingEnabled = true;
    scene.background = null;
  } else if (mode === 'mobile-xr') {
    state.postProcessingEnabled = false;
    requestDeviceOrientation();
  } else if (mode === 'mobile-ar') {
    state.postProcessingEnabled = false;
    scene.background = null;
  }
}

let baseAlpha = null;
let lastDeviceAlpha = null;
let lastGyroYaw = 0;
let lastGyroPitch = 0;
let touchLookYaw = 0;
let touchLookPitch = 0;
let startCalibrationFrames = 0;

function requestDeviceOrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(res => {
        if (res === 'granted') {
          window.removeEventListener('deviceorientation', handleOrientation);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      })
      .catch(console.warn);
  } else if (typeof window !== 'undefined') {
    window.removeEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

// Calibrates and centers the wormhole directly in the viewport
function centerWormholeOnScreen(immediate = true) {
  if (!camera) return;

  state.position.set(0, 0, CONFIG.wormholeDistance);
  state.velocity.set(0, 0, 0);

  if (lastDeviceAlpha !== null) {
    baseAlpha = lastDeviceAlpha;
  } else {
    baseAlpha = null;
  }
  startCalibrationFrames = 5;
  touchLookYaw = 0;
  touchLookPitch = 0;
  lastGyroYaw = 0;
  lastGyroPitch = 0;

  state.yaw = 0;
  state.pitch = 0;
  state.targetYaw = 0;
  state.targetPitch = 0;
  state.isAligningToWormhole = false;

  if (state.isXR && cameraRig) {
    xrBasePoseCaptured = false;
    xrBaseHmdPos.set(0, 0, 0);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    camera.quaternion.identity();
    cameraRig.position.copy(state.position);
    cameraRig.rotation.order = 'YXZ';
    cameraRig.rotation.set(0, 0, 0);
    cameraRig.quaternion.identity();
    cameraRig.updateMatrixWorld(true);
  } else {
    if (cameraRig) {
      cameraRig.position.set(0, 0, 0);
      cameraRig.rotation.set(0, 0, 0);
      cameraRig.quaternion.identity();
      cameraRig.updateMatrixWorld(true);
    }
    camera.position.copy(state.position);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(0, 0, 0);
    camera.quaternion.identity();
  }

  state.crosshair.x = window.innerWidth / 2;
  state.crosshair.y = window.innerHeight / 2;
  if (typeof snapGrid !== 'undefined' && snapGrid.cellWidth > 0 && snapGrid.cellHeight > 0) {
    snapGrid.currentCol = Math.floor(snapGrid.cols / 2);
    snapGrid.currentRow = Math.floor(snapGrid.rows / 2);
    snapGrid.virtualX = (snapGrid.currentCol + 0.5) * snapGrid.cellWidth;
    snapGrid.virtualY = (snapGrid.currentRow + 0.5) * snapGrid.cellHeight;
    state.crosshair.x = snapGrid.virtualX;
    state.crosshair.y = snapGrid.virtualY;
    if (typeof highlightActiveGridBox === 'function') {
      highlightActiveGridBox(snapGrid.currentCol, snapGrid.currentRow);
    }
  }
  const centerCrosshairEl = document.getElementById('center-crosshair');
  if (centerCrosshairEl) {
    centerCrosshairEl.style.left = '50%';
    centerCrosshairEl.style.top = '50%';
    centerCrosshairEl.style.transform = 'translate(-50%, -50%)';
  }
  const vectorRing = document.getElementById('vector-alignment-ring');
  if (vectorRing) {
    vectorRing.style.left = '50%';
    vectorRing.style.top = '50%';
    vectorRing.style.transform = 'translate(-50%, -50%)';
  }
}

// Device Orientation Handler calibrated for landscape mode held vertically (0-25 deg or 90-120 deg)
function handleOrientation(e) {
  if (state.isXR) return;
  if (e.beta === null || e.gamma === null) return;

  if (e.alpha !== null && e.alpha !== undefined) {
    lastDeviceAlpha = e.alpha;
    if (baseAlpha === null || startCalibrationFrames > 0) {
      baseAlpha = e.alpha;
      if (startCalibrationFrames > 0) startCalibrationFrames--;
    }
  }

  // Determine current screen orientation angle (0, 90, 180, 270)
  let screenAngle = 0;
  if (screen.orientation && typeof screen.orientation.angle === 'number') {
    screenAngle = screen.orientation.angle;
  } else if (typeof window.orientation === 'number') {
    screenAngle = window.orientation;
  }

  const isLandscape = (window.innerWidth > window.innerHeight) ||
                      (screen.orientation && screen.orientation.type && screen.orientation.type.includes('landscape')) ||
                      (Math.abs(screenAngle) === 90 || Math.abs(screenAngle) === 270);

  // If viewport is landscape (width > height) but reporting 0 deg, infer from gamma
  if (isLandscape && screenAngle === 0) {
    screenAngle = (e.gamma < 0) ? 270 : 90;
  }

  // Device orientation angles in radians
  const b = THREE.MathUtils.degToRad(e.beta || 0);
  const g = THREE.MathUtils.degToRad(e.gamma || 0);

  // Up/Gravity vector in device coordinate frame:
  // In portrait, +Y is up, +X is right, +Z is out of screen.
  // In landscape 90 (rotated CCW), +X is up, -Y is right.
  const dx = Math.sin(g) * Math.cos(b);
  const dy = -Math.sin(b);
  const dz = Math.cos(g) * Math.cos(b);

  // Map device axes into screen frame according to screen orientation
  let screenUpX, screenUpY, screenUpZ = dz;
  if (screenAngle === 90) {
    screenUpX = -dy;
    screenUpY = dx;
  } else if (screenAngle === 270 || screenAngle === -90) {
    screenUpX = dy;
    screenUpY = -dx;
  } else if (screenAngle === 180) {
    screenUpX = -dx;
    screenUpY = -dy;
  } else {
    // 0 deg: portrait
    screenUpX = dx;
    screenUpY = -dy;
  }

  // Calculate tilt angle from vertical in screen frame
  // When device is held vertically upright, screenUpY > 0 and screenUpZ = 0.
  // Tilt is positive when tilted back towards player's face (screenUpZ > 0).
  const rawTiltRad = Math.atan2(screenUpZ, screenUpY);
  const rawTiltDeg = THREE.MathUtils.radToDeg(rawTiltRad);
  let tiltDeg = rawTiltDeg;

  const TILT_EPSILON = 1.0; // 1 degree tolerance to absorb sensor noise at boundaries

  // Check second conditional: if phone is between 90-120 degrees
  const isBetween90And120 = (
    (tiltDeg >= (90 - TILT_EPSILON) && tiltDeg <= (120 + TILT_EPSILON)) ||
    (rawTiltDeg >= (90 - TILT_EPSILON) && rawTiltDeg <= (120 + TILT_EPSILON)) ||
    (Math.abs(e.gamma) >= (90 - TILT_EPSILON) && Math.abs(e.gamma) <= (120 + TILT_EPSILON)) ||
    (Math.abs(e.beta) >= (90 - TILT_EPSILON) && Math.abs(e.beta) <= (120 + TILT_EPSILON))
  );

  // Gimbal lock / quadrant check for landscape mode:
  // When held in landscape, the front-to-back tilt is fundamentally (90 - |gamma|)
  if (isLandscape) {
    if (!isBetween90And120 && (Math.abs(tiltDeg - 180) < 45 || Math.abs(tiltDeg) > 85)) {
      tiltDeg = 90 - Math.abs(e.gamma);
    }
  }

  let gyroPitch = 0;
  if (isLandscape) {
    // Conditional 1: Primary vertical holding between 0 and 25 degrees (reverted last change)
    const MIN_VERTICAL_TILT = 0;
    const MAX_VERTICAL_TILT = 25;
    const isPrimaryTiltCentered = (tiltDeg >= (MIN_VERTICAL_TILT - TILT_EPSILON) && tiltDeg <= (MAX_VERTICAL_TILT + TILT_EPSILON));

    // Conditional 2: If phone is between 90-120 degrees, the wormhole is in the center of the screen
    const isSecondaryTiltCentered = isBetween90And120;

    if (isPrimaryTiltCentered || isSecondaryTiltCentered) {
      gyroPitch = 0;
    } else if (tiltDeg > (120 + TILT_EPSILON)) {
      // Tilting past 120 degrees pitches upward
      gyroPitch = THREE.MathUtils.degToRad(tiltDeg - (120 + TILT_EPSILON));
    } else if (tiltDeg > (MAX_VERTICAL_TILT + TILT_EPSILON) && tiltDeg < (90 - TILT_EPSILON)) {
      // Tilting back past 25 degrees smoothly pitches the view upward
      gyroPitch = THREE.MathUtils.degToRad(tiltDeg - (MAX_VERTICAL_TILT + TILT_EPSILON));
    } else if (tiltDeg < (MIN_VERTICAL_TILT - TILT_EPSILON)) {
      // Tilting forward past 0 degrees smoothly pitches the view downward
      gyroPitch = THREE.MathUtils.degToRad(tiltDeg - (MIN_VERTICAL_TILT - TILT_EPSILON));
    }
  } else {
    // Portrait mode fallback
    gyroPitch = rawTiltRad;
  }
  gyroPitch = Math.max(-Math.PI * 0.47, Math.min(Math.PI * 0.47, gyroPitch));

  // Yaw relative to calibrated reference heading
  let gyroYaw = 0;
  if (baseAlpha !== null && e.alpha !== null && e.alpha !== undefined) {
    let deltaAlpha = e.alpha - baseAlpha;
    while (deltaAlpha < -180) deltaAlpha += 360;
    while (deltaAlpha > 180) deltaAlpha -= 360;
    gyroYaw = THREE.MathUtils.degToRad(deltaAlpha);
  }

  lastGyroYaw = gyroYaw;
  lastGyroPitch = gyroPitch;

  // Apply to camera view when not animating in alignToWormhole
  if (!state.isAligningToWormhole) {
    state.pitch = gyroPitch + touchLookPitch;
    state.yaw = gyroYaw + touchLookYaw;
    state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));
  }
}

// =============================================================================
// GAMEPAD CONTROLLER API INTEGRATION
// =============================================================================
const gamepadPill = document.getElementById('gamepad-status-pill');
const gamepadNameText = document.getElementById('gamepad-name-text');
const btnToggleController = document.getElementById('btn-toggle-controller');

if (btnToggleController) {
  btnToggleController.setAttribute('tabindex', '-1');
  btnToggleController.addEventListener('focus', () => {
    btnToggleController.blur();
  });
  btnToggleController.addEventListener('click', () => {
    if (state.gamepadMode === 'auto') state.gamepadMode = 'enabled';
    else if (state.gamepadMode === 'enabled') state.gamepadMode = 'disabled';
    else state.gamepadMode = 'auto';

    btnToggleController.textContent = `🎮 Controller: ${state.gamepadMode.toUpperCase()}`;
    updateGamepadUI();
    btnToggleController.blur();
  });
}

window.addEventListener('gamepadconnected', (e) => {
  console.log('[Gamepad] Controller connected:', e.gamepad.id);
  state.gamepadIndex = e.gamepad.index;
  updateGamepadUI(e.gamepad);
  if (!audioMgr.isInitialized) audioMgr.init();
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log('[Gamepad] Controller disconnected:', e.gamepad.id);
  if (state.gamepadIndex === e.gamepad.index) {
    state.gamepadIndex = null;
  }
  updateGamepadUI(null);
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

function checkGamepadPauseOnly() {
  pollGamepad(0);
}

function pollGamepad(delta) {
  if (state.gamepadMode === 'disabled') return;
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (!gamepads) return;

  for (let i = 0; i < gamepads.length; i++) {
    const pad = gamepads[i];
    if (!pad) continue;

    const isWheelOpen = typeof isWeaponWheelOpen === 'function' && isWeaponWheelOpen();

    // Start / Select button: Toggle pause or close weapon wheel
    const btnStart = pad.buttons[9] ? pad.buttons[9].pressed : false;
    const btnSelect = pad.buttons[8] ? pad.buttons[8].pressed : false;
    if ((btnStart && !state.lastPadButtons[9]) || (btnSelect && !state.lastPadButtons[8])) {
      if (isWheelOpen) {
        closeWeaponWheel();
      } else {
        setGamePaused(!state.isPaused);
      }
      vibratePad(pad, 100);
      state.lastPadButtons[9] = btnStart;
      state.lastPadButtons[8] = btnSelect;
      break;
    }

    if (state.isPaused) {
      if (isWheelOpen) {
        // When weapons arsenal is open:
        // Left Button (LB - Button 4): Select segments (cycle next segment)
        const btnLB = pad.buttons[4] ? pad.buttons[4].pressed : false;
        if (btnLB && !state.lastPadButtons[4]) {
          cycleWheelSegment();
          vibratePad(pad, 70);
        }

        // A Button (Button 0): Select / Equip the highlighted segment
        const btnA = pad.buttons[0] ? (pad.buttons[0].pressed || pad.buttons[0].value > 0.4) : false;
        if (btnA && !state.lastPadButtons[0]) {
          selectHighlightedWheelSegment();
          vibratePad(pad, 120);
        }

        // B Button (Button 1): Close / Cancel Arsenal
        const btnB = pad.buttons[1] ? pad.buttons[1].pressed : false;
        if (btnB && !state.lastPadButtons[1]) {
          closeWeaponWheel();
          vibratePad(pad, 70);
        }

        state.lastPadButtons = {
          0: btnA,
          1: btnB,
          2: pad.buttons[2] ? pad.buttons[2].pressed : false,
          3: pad.buttons[3] ? pad.buttons[3].pressed : false,
          4: btnLB,
          5: pad.buttons[5] ? pad.buttons[5].pressed : false,
          6: pad.buttons[6] ? (pad.buttons[6].pressed || pad.buttons[6].value > 0.4) : false,
          7: pad.buttons[7] ? (pad.buttons[7].pressed || pad.buttons[7].value > 0.4) : false,
          8: btnSelect,
          9: btnStart
        };
      } else {
        state.lastPadButtons = {
          0: pad.buttons[0] ? (pad.buttons[0].pressed || pad.buttons[0].value > 0.4) : false,
          1: pad.buttons[1] ? pad.buttons[1].pressed : false,
          2: pad.buttons[2] ? pad.buttons[2].pressed : false,
          3: pad.buttons[3] ? pad.buttons[3].pressed : false,
          4: pad.buttons[4] ? pad.buttons[4].pressed : false,
          5: pad.buttons[5] ? pad.buttons[5].pressed : false,
          6: pad.buttons[6] ? (pad.buttons[6].pressed || pad.buttons[6].value > 0.4) : false,
          7: pad.buttons[7] ? (pad.buttons[7].pressed || pad.buttons[7].value > 0.4) : false,
          8: btnSelect,
          9: btnStart
        };
      }
      break; // Lock out analog flight sticks & combat buttons while paused
    }

    const lx = Math.abs(pad.axes[0]) > CONFIG.gamepadDeadzone ? pad.axes[0] : 0;
    const ly = Math.abs(pad.axes[1]) > CONFIG.gamepadDeadzone ? pad.axes[1] : 0;
    const rx = Math.abs(pad.axes[2]) > CONFIG.gamepadDeadzone ? pad.axes[2] : 0;
    const ry = Math.abs(pad.axes[3]) > CONFIG.gamepadDeadzone ? pad.axes[3] : 0;

    // Crosshair joystick (Left stick): ONLY controls crosshair - NO flight control
    if (lx !== 0 || ly !== 0) {
      if (!aimTouchId && !isMouseAim) {
        state.aimMove.x = lx;
        state.aimMove.y = ly;
        state.aimActive = true;
      }
      handleLeftJoystickFocus();
    } else if (!aimTouchId && !isMouseAim) {
      if (state.aimActive) {
        state.aimActive = false;
        state.aimMove.x = 0;
        state.aimMove.y = 0;
      }
    }

    // Right stick (rx, ry): Pitch & Yaw Look
    state.yaw -= rx * CONFIG.yawSpeed * 22.0;
    state.pitch -= ry * CONFIG.pitchSpeed * 22.0;

    // D-Pad flight steering (Pitch & Yaw)
    if (pad.buttons[14] && pad.buttons[14].pressed) state.yaw += CONFIG.yawSpeed * 22.0 * delta * 60;
    if (pad.buttons[15] && pad.buttons[15].pressed) state.yaw -= CONFIG.yawSpeed * 22.0 * delta * 60;
    if (pad.buttons[12] && pad.buttons[12].pressed) state.pitch += CONFIG.pitchSpeed * 22.0 * delta * 60;
    if (pad.buttons[13] && pad.buttons[13].pressed) state.pitch -= CONFIG.pitchSpeed * 22.0 * delta * 60;
    state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));

    // Left Trigger (LT - Button 6): Sub-light brake / reverse deceleration
    const l2 = pad.buttons[6] ? pad.buttons[6].value : 0;
    if (l2 > 0.1) state.velocity.multiplyScalar(0.85);

    // Left Button (LB - Button 4): Open The Weapons (Arsenal)
    const btnLB = pad.buttons[4] ? pad.buttons[4].pressed : false;
    if (btnLB && !state.lastPadButtons[4]) {
      openWeaponWheel();
      vibratePad(pad, 120);
    }

    // Right Button (RB - Button 5): Cycle the weapons
    const btnRB = pad.buttons[5] ? pad.buttons[5].pressed : false;
    if (btnRB && !state.lastPadButtons[5]) {
      weaponsSystem.cycleWeapon();
      vibratePad(pad, 80);
    }

    // Right Trigger (RT - Button 7) or A Button (Button 0): Fire weapon ONE SHOT at a time
    const btnRT = pad.buttons[7] ? (pad.buttons[7].pressed || pad.buttons[7].value > 0.4) : false;
    const btnA = pad.buttons[0] ? (pad.buttons[0].pressed || pad.buttons[0].value > 0.4) : false;

    if ((btnRT && !state.lastPadButtons[7]) || (btnA && !state.lastPadButtons[0])) {
      fireLaserBeam();
      state.flightLockoutUntil = performance.now() + 3000;
      vibratePad(pad, 100);
    }

    // B Button (Button 1): Rapid fire weapon continuously while held
    const btnB = pad.buttons[1] ? pad.buttons[1].pressed : false;
    if (btnB) {
      fireLaserBeam();
    }

    // X Button (Button 2): Calibrate Warp Coils
    if (pad.buttons[2] && pad.buttons[2].pressed && !state.lastPadButtons[2]) {
      const uncalibrated = state.coils.findIndex(c => !c);
      if (uncalibrated !== -1) {
        const cBtn = document.getElementById(`btn-coil-${uncalibrated + 1}`);
        if (cBtn) cBtn.click();
        vibratePad(pad, 200);
      }
    }

    // Y Button (Button 3): Warp Jump Trigger
    if (pad.buttons[3] && pad.buttons[3].pressed && !state.lastPadButtons[3]) {
      triggerWarpJump();
      vibratePad(pad, 400);
    }

    state.lastPadButtons = {
      0: btnA,
      1: btnB,
      2: pad.buttons[2] ? pad.buttons[2].pressed : false,
      3: pad.buttons[3] ? pad.buttons[3].pressed : false,
      4: btnLB,
      5: btnRB,
      6: pad.buttons[6] ? (pad.buttons[6].pressed || pad.buttons[6].value > 0.4) : false,
      7: btnRT,
      8: btnSelect,
      9: btnStart
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
// MOBILE TOUCH VIRTUAL JOYSTICKS (LEFT: CROSSHAIR AIM ONLY, RIGHT: FIRE & FLIGHT)
// =============================================================================
const touchStickZone = document.getElementById('touch-stick-zone');
const touchStickKnob = document.getElementById('touch-stick-knob');
const aimStickZone = document.getElementById('aim-stick-zone');
const aimStickKnob = document.getElementById('aim-stick-knob');
const touchBtnScan = document.getElementById('touch-btn-scan');
const touchBtnWarp = document.getElementById('touch-btn-warp');
const throttleSliderContainer = document.getElementById('throttle-slider-container');
const throttleSliderWrapper = document.getElementById('throttle-slider-wrapper');
const customThrottleSlider = document.getElementById('custom-throttle-slider');
const throttleValueBadge = document.getElementById('throttle-value-badge');
const btnThrottleStop = document.getElementById('btn-throttle-stop');
const btnThrottleRev = document.getElementById('btn-throttle-rev');
const btnThrottleFwd = document.getElementById('btn-throttle-fwd');

function setThrottleLockout(locked) {
  const isTimeLocked = performance.now() < state.throttleLockoutUntil;
  const shouldBeLocked = !!locked || isTimeLocked;
  state.throttleLocked = shouldBeLocked;
  if (customThrottleSlider) {
    customThrottleSlider.disabled = shouldBeLocked;
  }
  if (btnThrottleRev) {
    btnThrottleRev.disabled = shouldBeLocked;
  }
  if (btnThrottleFwd) {
    btnThrottleFwd.disabled = shouldBeLocked;
  }
  if (btnThrottleStop) {
    btnThrottleStop.disabled = shouldBeLocked;
  }
  if (throttleSliderContainer) {
    throttleSliderContainer.classList.toggle('throttle-locked', shouldBeLocked);
  }
}

function stopThrottle(reason = null) {
  if (customThrottleSlider) {
    customThrottleSlider.value = 0;
  }
  state.throttleValue = 0;
  state.velocity.set(0, 0, 0); // Immediate all stop
  if (throttleValueBadge) {
    throttleValueBadge.classList.remove('forward', 'reverse');
    throttleValueBadge.textContent = '0% [STOP]';
  }
  if (btnThrottleRev) btnThrottleRev.classList.remove('active');
  if (btnThrottleFwd) btnThrottleFwd.classList.remove('active');
  handleFlightActivity();
}

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
let isMouseAim = false;
let lastFireTapTime = 0;

// 1. RIGHT THUMB JOYSTICK (TAP TO FIRE LASER / HOLD FOR FLIGHT NAVIGATION)
if (touchStickZone) {
  touchStickZone.setAttribute('tabindex', '0');
  ['focus', 'focusin', 'pointerdown'].forEach(evt => {
    touchStickZone.addEventListener(evt, () => {
      handleFlightActivity();
    });
  });
  if (touchStickKnob) {
    touchStickKnob.setAttribute('tabindex', '0');
    ['focus', 'focusin', 'pointerdown'].forEach(evt => {
      touchStickKnob.addEventListener(evt, () => {
        handleFlightActivity();
      });
    });
  }

  touchStickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        setThrottleLockout(true);
        // Wait 3 seconds before flight navigation (was 1 second)
        state.flightLockoutUntil = performance.now() + 3000;
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
      setThrottleLockout(false);
      flightTouchId = null;
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      if (touchStickKnob) touchStickKnob.style.transform = 'translate(0px, 0px)';

      // Switched fire button to right hand joystick:
      // Each time fire button is tapped, fire laser and reset the 3-second lockout timer
      if (wasTap) {
        lastFireTapTime = performance.now();
        fireLaserBeam();
        state.flightLockoutUntil = performance.now() + 3000;
      }
    }
  };

  window.addEventListener('touchend', endFlightTouch);
  window.addEventListener('touchcancel', endFlightTouch);

  // Mouse interaction for right joystick
  touchStickZone.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = touchStickZone.getBoundingClientRect();
    stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    isMouseFlight = true;
    state.touchActive = true;
    setThrottleLockout(true);
    mouseFlightStartX = e.clientX;
    mouseFlightStartY = e.clientY;
    mouseFlightStartTime = performance.now();
    // Wait 3 seconds before flight navigation (was 1 second)
    state.flightLockoutUntil = performance.now() + 3000;
    updateStickPos(e.clientX, e.clientY);
    handleFlightActivity();
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseFlight) {
      updateStickPos(e.clientX, e.clientY);
      handleFlightActivity();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isMouseFlight) {
      const duration = performance.now() - mouseFlightStartTime;
      const dragDelta = Math.hypot(e.clientX - mouseFlightStartX, e.clientY - mouseFlightStartY);
      const wasTap = (duration < 550 && dragDelta < 30);
      isMouseFlight = false;
      state.touchActive = false;
      setThrottleLockout(false);
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      if (touchStickKnob) touchStickKnob.style.transform = 'translate(0px, 0px)';
      if (wasTap) {
        lastFireTapTime = performance.now();
        fireLaserBeam();
        state.flightLockoutUntil = performance.now() + 3000;
      }
    }
  });

  // Direct click / tap backup on right stick to fire laser and lockout for 3s
  touchStickZone.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (performance.now() - lastFireTapTime < 250) return;
    lastFireTapTime = performance.now();
    handleFlightActivity();
    fireLaserBeam();
    state.flightLockoutUntil = performance.now() + 3000;
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

// 2. LEFT THUMB AIM JOYSTICK (RAPIDLY MOVES CROSSHAIR RETICLE - NO FLIGHT CONTROL)
if (aimStickZone) {
  aimStickZone.setAttribute('tabindex', '0');
  ['focus', 'focusin', 'pointerdown'].forEach(evt => {
    aimStickZone.addEventListener(evt, (e) => {
      handleLeftJoystickFocus(e);
    });
  });
  if (aimStickKnob) {
    aimStickKnob.setAttribute('tabindex', '0');
    ['focus', 'focusin', 'pointerdown'].forEach(evt => {
      aimStickKnob.addEventListener(evt, (e) => {
        handleLeftJoystickFocus(e);
      });
    });
  }

  aimStickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLeftJoystickFocus(e);
    const rect = aimStickZone.getBoundingClientRect();
    aimStickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.target === aimStickZone || aimStickZone.contains(touch.target)) {
        aimTouchId = touch.identifier;
        state.aimActive = true;
        updateAimStickPos(touch.clientX, touch.clientY);
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
          handleLeftJoystickFocus();
          updateAimStickPos(touch.clientX, touch.clientY);
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
          snapCrosshairToCurrentGridCenter();
          updateMobileControlsVisibility();
          break;
        }
      }
    } else {
      state.aimActive = false;
      aimTouchId = null;
      state.aimMove.x = 0;
      state.aimMove.y = 0;
      if (aimStickKnob) aimStickKnob.style.transform = 'translate(0px, 0px)';
      snapCrosshairToCurrentGridCenter();
      updateMobileControlsVisibility();
    }
  };

  window.addEventListener('touchend', endAimTouch);
  window.addEventListener('touchcancel', endAimTouch);

  // Mouse interaction for Aim stick (desktop testing and dragging crosshair aim - NO flight control)
  aimStickZone.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLeftJoystickFocus(e);
    state.isMouseDown = false;
    const rect = aimStickZone.getBoundingClientRect();
    aimStickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    isMouseAim = true;
    state.aimActive = true;
    updateAimStickPos(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isMouseAim) {
      handleLeftJoystickFocus();
      state.isMouseDown = false;
      updateAimStickPos(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isMouseAim) {
      isMouseAim = false;
      state.aimActive = false;
      state.aimMove.x = 0;
      state.aimMove.y = 0;
      if (aimStickKnob) aimStickKnob.style.transform = 'translate(0px, 0px)';
      snapCrosshairToCurrentGridCenter();
      updateMobileControlsVisibility();
    }
  });

  aimStickZone.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
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
  updateMobileControlsVisibility();
}

// =============================================================================
// CUSTOM CRUISE THROTTLE SLIDER & REVERSE TOGGLE
// =============================================================================
function updateThrottleFromSlider(rawVal) {
  if (state.throttleLocked || performance.now() < state.throttleLockoutUntil) return;
  const val = parseFloat(rawVal) || 0;
  // Maps -100..100 to -1.0 (reverse) to +1.0 (forward)
  state.throttleValue = val / 100;
  if (Math.abs(state.throttleValue) > 0.005) {
    state.laserEngineHaltNotified = false; // Engines are actively thrusting again
  }

  if (throttleValueBadge) {
    throttleValueBadge.classList.remove('forward', 'reverse');
    if (btnThrottleRev) btnThrottleRev.classList.remove('active');
    if (btnThrottleFwd) btnThrottleFwd.classList.remove('active');

    if (val > 0) {
      throttleValueBadge.textContent = `+${Math.round(val)}% FWD`;
      throttleValueBadge.classList.add('forward');
      if (btnThrottleFwd) btnThrottleFwd.classList.add('active');
    } else if (val < 0) {
      throttleValueBadge.textContent = `${Math.round(val)}% REV`;
      throttleValueBadge.classList.add('reverse');
      if (btnThrottleRev) btnThrottleRev.classList.add('active');
    } else {
      throttleValueBadge.textContent = '0% [STOP]';
    }
  }
  handleFlightActivity();
}

function setSliderFromPointerX(clientX) {
  if (state.throttleLocked || performance.now() < state.throttleLockoutUntil || !customThrottleSlider) return;
  const rect = customThrottleSlider.getBoundingClientRect();
  if (rect.width <= 0) return;
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  // Maps 0..1 to -100..100
  let val = Math.round((ratio - 0.5) * 200);
  if (Math.abs(val) < 6) val = 0; // Snap to center Neutral/Stop
  customThrottleSlider.value = val;
  updateThrottleFromSlider(val);
}

function toggleReverseThrottle() {
  if (state.throttleLocked || performance.now() < state.throttleLockoutUntil) return;
  // If moving forward, invert to reverse at the same speed
  if (state.throttleValue > 0.005) {
    const targetVal = -Math.round(state.throttleValue * 100);
    if (customThrottleSlider) customThrottleSlider.value = targetVal;
    updateThrottleFromSlider(targetVal);
  } else if (state.throttleValue < -0.005) {
    // If already in reverse, toggle back to forward
    const targetVal = Math.abs(Math.round(state.throttleValue * 100));
    if (customThrottleSlider) customThrottleSlider.value = targetVal;
    updateThrottleFromSlider(targetVal);
  } else {
    // If currently stopped, engage reverse cruise at -50%
    const targetVal = -50;
    if (customThrottleSlider) customThrottleSlider.value = targetVal;
    updateThrottleFromSlider(targetVal);
  }
}

function toggleForwardThrottle() {
  if (state.throttleLocked || performance.now() < state.throttleLockoutUntil) return;
  if (state.throttleValue < -0.005) {
    const targetVal = Math.abs(Math.round(state.throttleValue * 100));
    if (customThrottleSlider) customThrottleSlider.value = targetVal;
    updateThrottleFromSlider(targetVal);
  } else if (state.throttleValue > 0.005) {
    const targetVal = 100;
    if (customThrottleSlider) customThrottleSlider.value = targetVal;
    updateThrottleFromSlider(targetVal);
  } else {
    const targetVal = 50;
    if (customThrottleSlider) customThrottleSlider.value = targetVal;
    updateThrottleFromSlider(targetVal);
  }
}

let sliderInteracting = false;
let touchTriggeredStop = false;

function onSliderTouchOrPointerDown(e) {
  if (state.isPaused) return;
  if (state.throttleLocked || performance.now() < state.throttleLockoutUntil) {
    if (e.cancelable) e.preventDefault();
    return;
  }
  e.stopPropagation();

  // If engine is actively thrusting, touching the slider immediately stops all thrust and locks out / delays for 0.3 seconds!
  const isCurrentlyThrusting = Math.abs(state.throttleValue) > 0.005;
  if (isCurrentlyThrusting) {
    stopThrottle('CRUISE ENGINES STOPPED (0%)');
    state.throttleLockoutUntil = performance.now() + 300; // 0.3-second lockout / delay
    setThrottleLockout(true);
    touchTriggeredStop = true;
    sliderInteracting = true;
    if (e.cancelable) e.preventDefault();
    return;
  }

  touchTriggeredStop = false;
  sliderInteracting = true;
  const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
  if (clientX !== undefined) {
    setSliderFromPointerX(clientX);
  }
  if (e.cancelable) e.preventDefault();
}

function onSliderTouchOrPointerMove(e) {
  if (!sliderInteracting || state.throttleLocked || performance.now() < state.throttleLockoutUntil) return;
  e.stopPropagation();

  // If this touch initiated an emergency stop while thrusting, ignore dragging on the same touch
  if (touchTriggeredStop) {
    if (e.cancelable) e.preventDefault();
    return;
  }

  const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
  if (clientX !== undefined) {
    setSliderFromPointerX(clientX);
  }
  if (e.cancelable) e.preventDefault();
}

function onSliderTouchOrPointerUp(e) {
  if (sliderInteracting) {
    sliderInteracting = false;
    touchTriggeredStop = false;
  }
}

if (throttleSliderWrapper) {
  throttleSliderWrapper.addEventListener('pointerdown', onSliderTouchOrPointerDown);
  throttleSliderWrapper.addEventListener('touchstart', onSliderTouchOrPointerDown, { passive: false });
}

if (customThrottleSlider) {
  customThrottleSlider.addEventListener('pointerdown', onSliderTouchOrPointerDown);
  customThrottleSlider.addEventListener('touchstart', onSliderTouchOrPointerDown, { passive: false });
  customThrottleSlider.addEventListener('input', (e) => {
    updateThrottleFromSlider(e.target.value);
  });
  customThrottleSlider.addEventListener('change', (e) => {
    updateThrottleFromSlider(e.target.value);
  });
}

window.addEventListener('pointermove', onSliderTouchOrPointerMove);
window.addEventListener('pointerup', onSliderTouchOrPointerUp);
window.addEventListener('pointercancel', onSliderTouchOrPointerUp);

window.addEventListener('touchmove', onSliderTouchOrPointerMove, { passive: false });
window.addEventListener('touchend', onSliderTouchOrPointerUp, { passive: false });
window.addEventListener('touchcancel', onSliderTouchOrPointerUp, { passive: false });

if (btnThrottleRev) {
  btnThrottleRev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleReverseThrottle();
  });
  btnThrottleRev.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleReverseThrottle();
  }, { passive: false });
}

if (btnThrottleFwd) {
  btnThrottleFwd.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleForwardThrottle();
  });
  btnThrottleFwd.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleForwardThrottle();
  }, { passive: false });
}

if (btnThrottleStop) {
  btnThrottleStop.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopThrottle('CRUISE ENGINES STOPPED (0%)');
  });
  btnThrottleStop.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopThrottle('CRUISE ENGINES STOPPED (0%)');
  }, { passive: false });
}

// =============================================================================
// AUTOMATED 180-DEGREE & 360-DEGREE THRUSTER ROTATION
// =============================================================================
const touchBtnSpin180 = document.getElementById('touch-btn-spin-180');
const btnSpin180 = document.getElementById('btn-spin-180');
const touchBtnSpin360 = document.getElementById('touch-btn-spin-360');
const btnSpin360 = document.getElementById('btn-spin-360');

function execute180Turn() {
  if (state.isPaused) return;
  if (state.isExecuting180Turn || state.activeTurnType === '180') {
    cancelTurn();
    return;
  }
  if (state.isExecuting360Turn || state.activeTurnType === '360') {
    cancelTurn();
  }
  state.isExecuting180Turn = true;
  state.isExecuting360Turn = false;
  state.activeTurnType = '180';
  state.turnRotationAccumulated = 0;
  state.turnRotationTarget = Math.PI; // 180 degrees (π radians)

  if (touchBtnSpin180) touchBtnSpin180.classList.add('active-spin');
  if (btnSpin180) btnSpin180.classList.add('active');

  if (!audioMgr.isInitialized) audioMgr.init();
  audioMgr.playCoil();
  handleFlightActivity();
}

function execute360Turn() {
  if (state.isPaused) return;
  if (state.isExecuting360Turn || state.activeTurnType === '360') {
    cancelTurn();
    return;
  }
  if (state.isExecuting180Turn || state.activeTurnType === '180') {
    cancelTurn();
  }
  state.isExecuting360Turn = true;
  state.isExecuting180Turn = false;
  state.activeTurnType = '360';
  state.turnRotationAccumulated = 0;
  state.turnRotationTarget = Math.PI * 2; // Full 360 degrees (2π radians)
  state.turn360Accumulated = 0;
  state.turn360Target = Math.PI * 2;

  if (touchBtnSpin360) touchBtnSpin360.classList.add('active-spin');
  if (btnSpin360) btnSpin360.classList.add('active');

  if (!audioMgr.isInitialized) audioMgr.init();
  audioMgr.playCoil();
  handleFlightActivity();
}

function cancelTurn() {
  const previousType = state.activeTurnType || (state.isExecuting180Turn ? '180' : (state.isExecuting360Turn ? '360' : null));
  state.isExecuting360Turn = false;
  state.isExecuting180Turn = false;
  state.activeTurnType = null;
  state.turnRotationAccumulated = 0;
  state.turn360Accumulated = 0;

  if (touchBtnSpin180) touchBtnSpin180.classList.remove('active-spin');
  if (btnSpin180) btnSpin180.classList.remove('active');
  if (touchBtnSpin360) touchBtnSpin360.classList.remove('active-spin');
  if (btnSpin360) btnSpin360.classList.remove('active');
}

function cancel360Turn() {
  cancelTurn();
}

function cancel180Turn() {
  cancelTurn();
}

if (touchBtnSpin180) {
  touchBtnSpin180.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    execute180Turn();
  });
  touchBtnSpin180.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    execute180Turn();
  }, { passive: false });
}

if (btnSpin180) {
  btnSpin180.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    execute180Turn();
  });
}

if (touchBtnSpin360) {
  touchBtnSpin360.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    execute360Turn();
  });
  touchBtnSpin360.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    execute360Turn();
  }, { passive: false });
}

if (btnSpin360) {
  btnSpin360.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    execute360Turn();
  });
}

// 3. SELECTABLE LASER CANNON SYSTEM & CROSSHAIR RETICLE TRACKER
const laserBolts = [];

function fireLaserBeam() {
  if (state.isPaused) return;
  if (!scene || !camera) return;

  const activeWpn = weaponsSystem.getActiveWeapon();
  if (!weaponsSystem.canFire()) {
    if (activeWpn && activeWpn.isOverheated) {
      if (audioMgr && audioMgr.playOverheatAlert) audioMgr.playOverheatAlert();
    }
    return;
  }

  const now = performance.now();
  if (now - state.lastLaserShotTime < 110) return; // Shot rate throttling
  state.lastLaserShotTime = now;

  // Consume weapon energy (Red laser: 10%, Blue laser: 30%; overheats at 0%)
  weaponsSystem.consumeEnergyOnFire();

  // Lock out right-hand flight for 3 seconds when fire is triggered
  state.flightLockoutUntil = now + 3000;

  // If cruise engine is actively thrusting, halt engine and show notification once.
  // Do not show again on subsequent shots until the engine starts thrusting again.
  const isEngineThrusting = Math.abs(state.throttleValue) > 0.005;
  if (isEngineThrusting && !state.laserEngineHaltNotified) {
    state.laserEngineHaltNotified = true;
    stopThrottle('LASER FIRED: ENGINES ALL STOP (0%)');
  } else {
    stopThrottle(null);
  }

  // Cancel any active automated turns on laser fire
  if (state.activeTurnType || state.isExecuting360Turn || state.isExecuting180Turn) {
    cancelTurn();
  }

  // Sound synthesis based on active weapon
  if (!audioMgr.isInitialized) audioMgr.init();
  audioMgr.playLaser(activeWpn.id);

  // Crosshair visual blast animation
  const crosshairEl = document.getElementById('center-crosshair');
  if (crosshairEl) {
    let fireClass = 'laser-firing';
    if (activeWpn.id === 'blue_laser') fireClass = 'laser-firing-blue';
    else if (activeWpn.id === 'tachyon_lance') fireClass = 'laser-firing-amber';
    crosshairEl.classList.remove('laser-firing', 'laser-firing-blue', 'laser-firing-amber');
    void crosshairEl.offsetWidth; // Reflow
    crosshairEl.classList.add(fireClass);
    setTimeout(() => {
      crosshairEl.classList.remove('laser-firing', 'laser-firing-blue', 'laser-firing-amber');
    }, 180);
  }

  // 3D Direction raycast from dynamic crosshair screen coordinates
  camera.updateMatrixWorld(true);
  const camWorldPos = new THREE.Vector3();
  const camWorldQuat = new THREE.Quaternion();
  camera.getWorldPosition(camWorldPos);
  camera.getWorldQuaternion(camWorldQuat);

  const ndcX = (state.crosshair.x / window.innerWidth) * 2 - 1;
  const ndcY = -(state.crosshair.y / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  // Target point 1200 units deep into cosmos
  const targetPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(1200));

  // Ship blaster cannons (alternating left / right wingtips)
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camWorldQuat).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camWorldQuat).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camWorldQuat).normalize();

  if (typeof fireLaserBeam.cannonSide === 'undefined') fireLaserBeam.cannonSide = 1;
  fireLaserBeam.cannonSide = -fireLaserBeam.cannonSide;
  const sideOffset = fireLaserBeam.cannonSide * 0.45;

  const spawnOrigin = camWorldPos.clone()
    .addScaledVector(forward, 0.8)
    .addScaledVector(right, sideOffset)
    .addScaledVector(up, -0.25);

  const direction = new THREE.Vector3().subVectors(targetPoint, spawnOrigin).normalize();

  // Glowing Laser Beam Geometry based on active weapon configuration
  const boltLength = activeWpn.boltLength || 7.5;
  const boltRadius = activeWpn.boltRadius || 0.14;
  const geometry = new THREE.CylinderGeometry(boltRadius * 0.35, boltRadius, boltLength, 8);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: activeWpn.colorHex,
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
    color: activeWpn.id === 'blue_laser' ? 0xe0ffff : (activeWpn.id === 'tachyon_lance' ? 0xfff4d6 : 0xffffff),
    transparent: true,
    opacity: 0.95
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  mesh.add(coreMesh);

  // Dynamic laser point light glow
  const light = new THREE.PointLight(activeWpn.colorHex, activeWpn.bulletLightIntensity || 3.5, 35);
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
    speed: activeWpn.bulletSpeed || 550, // units per second
    damage: activeWpn.damagePerHit || 1, // Damage hits for weapons from Game Manager
    weaponId: activeWpn.id,
    canOverheat: activeWpn.canOverheat,
    drainPct: activeWpn.energyCost,
    spawnTime: now,
    lifetime: activeWpn.bulletLifetime || 2.2 // seconds
  });
}

function updateLaserBolts(delta) {
  const now = performance.now();
  for (let i = laserBolts.length - 1; i >= 0; i--) {
    const bolt = laserBolts[i];
    bolt.mesh.position.addScaledVector(bolt.direction, bolt.speed * delta);

    // Requirement: Allow collecting powerups by shooting them!
    let boltConsumed = false;
    if (typeof active3DPowerups !== 'undefined' && Array.isArray(active3DPowerups) && active3DPowerups.length > 0) {
      for (let pi = active3DPowerups.length - 1; pi >= 0; pi--) {
        const p = active3DPowerups[pi];
        if (!p || p.collected || !p.mesh) continue;

        const hitRadius = Math.max(4.2, (p.config && p.config.scale ? p.config.scale * 3.8 : 4.2));
        const dist = bolt.mesh.position.distanceTo(p.mesh.position);

        if (dist < hitRadius) {
          boltConsumed = true;
          p.collected = true;

          applyPowerupEffect(p);
          triggerPowerupCollectFx(p.mesh.position, p.colorHex);

          scene.remove(p.mesh);
          disposeMeshHierarchy(p.mesh);
          active3DPowerups.splice(pi, 1);

          if (typeof pruneUncollectedPowerupsByEnergyState === 'function') {
            pruneUncollectedPowerupsByEnergyState();
          }
          break;
        }
      }
    }

    if (boltConsumed) {
      scene.remove(bolt.mesh);
      if (bolt.geometry) bolt.geometry.dispose();
      if (bolt.material) bolt.material.dispose();
      if (bolt.coreGeom) bolt.coreGeom.dispose();
      if (bolt.coreMat) bolt.coreMat.dispose();
      if (bolt.light) bolt.mesh.remove(bolt.light);
      laserBolts.splice(i, 1);
      continue;
    }

    if ((now - bolt.spawnTime) * 0.001 > bolt.lifetime) {
      scene.remove(bolt.mesh);
      if (bolt.geometry) bolt.geometry.dispose();
      if (bolt.material) bolt.material.dispose();
      if (bolt.coreGeom) bolt.coreGeom.dispose();
      if (bolt.coreMat) bolt.coreMat.dispose();
      if (bolt.light) bolt.mesh.remove(bolt.light);
      laserBolts.splice(i, 1);
    }
  }
}

// =============================================================================
// MOBILE INVISIBLE FULL-SCREEN SNAP GRID SYSTEM
// =============================================================================
// Calculates snap pause duration based on crosshair speed multiplier.
// At speeds above 4.0x, the delay lowers progressively so the crosshair transitions between grid boxes more quickly.
function calculateSnapPauseDuration(speedMult) {
  const mult = typeof speedMult === 'number' ? speedMult : (state.crosshairSpeedMultiplier || 4.00);
  if (mult <= 4.00) {
    // Scales smoothly from ~280ms at lowest speed down to 180ms at default 4.0x
    const factor = Math.max(0, Math.min(1, (mult - 0.4) / (4.0 - 0.4)));
    return Math.round(280 - factor * (280 - 180));
  } else {
    // Progressively lowers the pause delay at speeds above 4.0x down to 50ms at 10.0x
    const factor = Math.max(0, Math.min(1, (mult - 4.0) / (10.0 - 4.0)));
    return Math.round(180 - factor * (180 - 50));
  }
}

const snapGrid = {
  cols: 15,
  rows: 7,
  cellWidth: 0,
  cellHeight: 0,
  currentCol: -1,
  currentRow: -1,
  pauseUntil: 0,
  pauseDuration: 180, // dynamically scaled based on crosshairSpeedMultiplier (180ms at default 4.0x)
  virtualX: 0,
  virtualY: 0,
  initialized: false
};

function updateMobileSnapGrid() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Compute odd number of columns & rows around 55px - 65px per box
  let cols = Math.round(w / 60);
  if (cols % 2 === 0) cols += 1; // Ensure odd count for exact screen-center alignment
  if (cols < 3) cols = 3;

  let rows = Math.round(h / 60);
  if (rows % 2 === 0) rows += 1; // Ensure odd count for exact screen-center alignment
  if (rows < 3) rows = 3;

  snapGrid.cols = cols;
  snapGrid.rows = rows;
  snapGrid.cellWidth = w / cols;
  snapGrid.cellHeight = h / rows;

  const gridEl = document.getElementById('mobile-fullscreen-grid');
  if (gridEl) {
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Only rebuild DOM grid boxes if count changed
    if (gridEl.children.length !== cols * rows) {
      gridEl.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const box = document.createElement('div');
          box.className = 'grid-box';
          box.dataset.col = String(c);
          box.dataset.row = String(r);
          fragment.appendChild(box);
        }
      }
      gridEl.appendChild(fragment);
    }
  }

  // If not initialized, initialize center box and virtual position
  if (!snapGrid.initialized) {
    snapGrid.currentCol = Math.floor(cols / 2);
    snapGrid.currentRow = Math.floor(rows / 2);
    snapGrid.virtualX = (snapGrid.currentCol + 0.5) * snapGrid.cellWidth;
    snapGrid.virtualY = (snapGrid.currentRow + 0.5) * snapGrid.cellHeight;
    state.crosshair.x = snapGrid.virtualX;
    state.crosshair.y = snapGrid.virtualY;
    snapGrid.initialized = true;
    highlightActiveGridBox(snapGrid.currentCol, snapGrid.currentRow);
  } else {
    // Keep col/row within bounds on resize and align
    snapGrid.currentCol = Math.min(cols - 1, Math.max(0, snapGrid.currentCol));
    snapGrid.currentRow = Math.min(rows - 1, Math.max(0, snapGrid.currentRow));
    const boxCenterX = (snapGrid.currentCol + 0.5) * snapGrid.cellWidth;
    const boxCenterY = (snapGrid.currentRow + 0.5) * snapGrid.cellHeight;
    snapGrid.virtualX = boxCenterX;
    snapGrid.virtualY = boxCenterY;
    state.crosshair.x = boxCenterX;
    state.crosshair.y = boxCenterY;
    highlightActiveGridBox(snapGrid.currentCol, snapGrid.currentRow);
  }
}

function highlightActiveGridBox(col, row) {
  const gridEl = document.getElementById('mobile-fullscreen-grid');
  if (!gridEl) return;
  const prevActive = gridEl.querySelector('.grid-box.active-snap');
  if (prevActive) prevActive.classList.remove('active-snap');
  const targetIndex = row * snapGrid.cols + col;
  if (gridEl.children[targetIndex]) {
    gridEl.children[targetIndex].classList.add('active-snap');
  }
}

function snapCrosshairToCurrentGridCenter() {
  if (snapGrid.cellWidth > 0 && snapGrid.cellHeight > 0) {
    if (snapGrid.currentCol >= 0 && snapGrid.currentRow >= 0) {
      const boxCenterX = (snapGrid.currentCol + 0.5) * snapGrid.cellWidth;
      const boxCenterY = (snapGrid.currentRow + 0.5) * snapGrid.cellHeight;
      state.crosshair.x = boxCenterX;
      state.crosshair.y = boxCenterY;
      snapGrid.virtualX = boxCenterX;
      snapGrid.virtualY = boxCenterY;
      highlightActiveGridBox(snapGrid.currentCol, snapGrid.currentRow);
    }
  }
}

function setShowTargetGrid(val) {
  state.showTargetGrid = !!val;
  const gridEl = document.getElementById('mobile-fullscreen-grid');
  if (gridEl) {
    gridEl.classList.toggle('show-debug-grid', state.showTargetGrid);
  }
  document.querySelectorAll('.chk-show-grid').forEach(chk => {
    chk.checked = state.showTargetGrid;
  });
}

// =============================================================================
// MOBILE CONTROLS AUTO-HIDING & DEFENSE HIT MONITOR
// Requirements:
// 1. Only hide controls if mobile is in use!
// 2. When mobile is in use, if crosshair is moving, hide all controls except:
//    - Left crosshair controller (#aim-stick-zone)
//    - Right fire and flight controller (#touch-stick-zone)
//    - Pause button (#btn-quick-pause)
// 3. If pause button is pressed and hidden controls are hidden, unhide those
//    controls but keep usual pause logic that locks out controls.
// 4. If crosshair stops moving, unhide all the hidden controls.
// 5. Make shield and health appear for 1 second each time player takes a hit.
// =============================================================================
let shieldHealthHitTimer = null;

function isMobileInUse() {
  if (currentActiveDeviceType === 'mobile' || currentActiveDeviceType === 'arcore') return true;
  if (state.xrMode === 'mobile-xr' || state.xrMode === 'mobile-ar') return true;
  if (detectedHardware && (detectedHardware.type === 'mobile' || detectedHardware.type === 'tablet')) return true;
  if (typeof window !== 'undefined') {
    if (window.matchMedia && window.matchMedia('(max-width: 1024px), (pointer: coarse), (hover: none)').matches) {
      return true;
    }
    const touchControls = document.getElementById('mobile-touch-controls');
    if (touchControls && window.getComputedStyle(touchControls).display !== 'none') {
      return true;
    }
  }
  return false;
}

function updateMobileControlsVisibility() {
  // Requirement: ONLY hide the controls if mobile is in use
  if (!isMobileInUse()) {
    if (state.mobileControlsHidden || document.body.classList.contains('mobile-crosshair-moving')) {
      state.mobileControlsHidden = false;
      document.body.classList.remove('mobile-crosshair-moving');
    }
    return;
  }

  // Requirement: If pause button is pressed and controls are hidden, unhide them (keeping usual pause lockout)
  if (state.isPaused) {
    if (state.mobileControlsHidden || document.body.classList.contains('mobile-crosshair-moving')) {
      state.mobileControlsHidden = false;
      document.body.classList.remove('mobile-crosshair-moving');
    }
    return;
  }

  // Check if crosshair is actively moving (virtual joystick active & deflected)
  const isMoving = !!(state.aimActive && (Math.abs(state.aimMove.x) > 0.02 || Math.abs(state.aimMove.y) > 0.02));

  if (isMoving) {
    if (!state.mobileControlsHidden) {
      state.mobileControlsHidden = true;
      document.body.classList.add('mobile-crosshair-moving');
    }
  } else {
    // Requirement: If the crosshair stops moving then unhide all the hidden controls
    if (state.mobileControlsHidden) {
      state.mobileControlsHidden = false;
      document.body.classList.remove('mobile-crosshair-moving');
    }
  }
}

function showShieldAndHealthOnHit(durationMs = 1000) {
  const defenseIndicator = document.getElementById('hud-defense-indicator');
  const badgeWrap = document.getElementById('laser-pct-badge-wrap');
  if (!defenseIndicator) return;

  defenseIndicator.classList.add('hit-showing');
  if (badgeWrap) badgeWrap.classList.add('hit-showing-defense');

  if (shieldHealthHitTimer) {
    clearTimeout(shieldHealthHitTimer);
    shieldHealthHitTimer = null;
  }

  shieldHealthHitTimer = setTimeout(() => {
    defenseIndicator.classList.remove('hit-showing');
    if (badgeWrap) badgeWrap.classList.remove('hit-showing-defense');
    shieldHealthHitTimer = null;
  }, durationMs);
}

function updateCrosshairPosition(delta) {
  const now = performance.now();
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (snapGrid.cellWidth === 0 || snapGrid.cellHeight === 0) {
    updateMobileSnapGrid();
  }

  // Move crosshair when aim stick or gamepad is tilted
  if (state.aimActive && (state.aimMove.x !== 0 || state.aimMove.y !== 0)) {
    // Hold at center during the short snap pause (0.5 seconds)
    if (now < snapGrid.pauseUntil) {
      if (snapGrid.currentCol >= 0 && snapGrid.currentRow >= 0) {
        state.crosshair.x = (snapGrid.currentCol + 0.5) * snapGrid.cellWidth;
        state.crosshair.y = (snapGrid.currentRow + 0.5) * snapGrid.cellHeight;
        snapGrid.virtualX = state.crosshair.x;
        snapGrid.virtualY = state.crosshair.y;
      }
    } else {
      const baseSpeed = Math.max(w, h);
      const speed = baseSpeed * (state.crosshairSpeedMultiplier || 4.00);

      // Move virtual coordinate across the screen
      snapGrid.virtualX += state.aimMove.x * speed * delta;
      snapGrid.virtualY += state.aimMove.y * speed * delta;

      const margin = 10;
      snapGrid.virtualX = Math.max(margin, Math.min(w - margin, snapGrid.virtualX));
      snapGrid.virtualY = Math.max(margin, Math.min(h - margin, snapGrid.virtualY));

      // Calculate which box of the grid the center is entering
      const newCol = Math.min(snapGrid.cols - 1, Math.max(0, Math.floor(snapGrid.virtualX / snapGrid.cellWidth)));
      const newRow = Math.min(snapGrid.rows - 1, Math.max(0, Math.floor(snapGrid.virtualY / snapGrid.cellHeight)));

      // When the center of the crosshair crosses into each box of the grid:
      // The crosshair snaps to the center of the grid box and pauses
      if (newCol !== snapGrid.currentCol || newRow !== snapGrid.currentRow) {
        snapGrid.currentCol = newCol;
        snapGrid.currentRow = newRow;

        const boxCenterX = (newCol + 0.5) * snapGrid.cellWidth;
        const boxCenterY = (newRow + 0.5) * snapGrid.cellHeight;

        state.crosshair.x = boxCenterX;
        state.crosshair.y = boxCenterY;

        // Sync virtual coordinate to snapped box center
        snapGrid.virtualX = boxCenterX;
        snapGrid.virtualY = boxCenterY;

        // Pause duration scales with speed: lowered delay at speeds above 4.0x allows rapid box transitions
        const snapPause = typeof snapGrid.pauseDuration === 'number' ? snapGrid.pauseDuration : calculateSnapPauseDuration(state.crosshairSpeedMultiplier);
        snapGrid.pauseUntil = now + snapPause;

        highlightActiveGridBox(newCol, newRow);
      } else {
        state.crosshair.x = snapGrid.virtualX;
        state.crosshair.y = snapGrid.virtualY;
      }
    }
  } else if (!state.aimActive && !state.isPointerLocked && snapGrid.currentCol >= 0 && snapGrid.currentRow >= 0) {
    // When aim stick is released, ensure crosshair is snapped at the center of the grid box
    const boxCenterX = (snapGrid.currentCol + 0.5) * snapGrid.cellWidth;
    const boxCenterY = (snapGrid.currentRow + 0.5) * snapGrid.cellHeight;
    if (Math.abs(state.crosshair.x - boxCenterX) > 0.5 || Math.abs(state.crosshair.y - boxCenterY) > 0.5) {
      state.crosshair.x = boxCenterX;
      state.crosshair.y = boxCenterY;
      snapGrid.virtualX = boxCenterX;
      snapGrid.virtualY = boxCenterY;
      highlightActiveGridBox(snapGrid.currentCol, snapGrid.currentRow);
    }
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

  // Monitor mobile crosshair movement and auto-hide/unhide controls
  updateMobileControlsVisibility();
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
  // If game is paused or game over, lock out all flight, combat, and weapon controls!
  if (state.isPaused || state.isGameOver) return;

  keys[e.code] = true;
  if (!audioMgr.isInitialized) audioMgr.init();

  // Weapon Selection Hotkeys: 1 (Red Laser), 2 (Blue Laser), Q (Cycle Weapons)
  if (e.code === 'Digit1') {
    weaponsSystem.selectWeapon('red_laser');
    return;
  }
  if (e.code === 'Digit2') {
    weaponsSystem.selectWeapon('blue_laser');
    return;
  }
  if (e.code === 'Digit3') {
    weaponsSystem.selectWeapon('tachyon_lance');
    return;
  }
  if (e.code === 'KeyQ') {
    weaponsSystem.cycleWeapon();
    return;
  }

  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    handleFlightActivity();
  }

  if (e.code === 'KeyF') {
    triggerWarpJump();
  }
  if (e.code === 'KeyT') {
    e.preventDefault();
    execute180Turn();
  }
  if (e.code === 'KeyR') {
    e.preventDefault();
    execute360Turn();
  }
  if (e.code === 'KeyX') {
    fireLaserBeam();
    state.flightLockoutUntil = performance.now() + 3000;
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
  mouseLockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!audioMgr.isInitialized) audioMgr.init();
    if (document.pointerLockElement === container) {
      document.exitPointerLock();
    } else {
      requestCrosshairCapture(true);
    }
  });
}

document.addEventListener('pointerlockchange', () => {
  if (state.isGameOver && document.pointerLockElement) {
    try {
      document.exitPointerLock();
    } catch (e) {}
    state.isPointerLocked = false;
    return;
  }
  const wasLocked = state.isPointerLocked;
  state.isPointerLocked = (document.pointerLockElement === container);
  if (wasLocked && !state.isPointerLocked) {
    state.lastPointerLockExitTime = performance.now();
    state.isLeftMouseDown = false;
    state.isRightMouseDown = false;
  }
  if (mouseLockBtn) {
    mouseLockBtn.classList.toggle('active', state.isPointerLocked);
    mouseLockBtn.textContent = state.isPointerLocked ? '🎯 CROSSHAIR CAPTURED (ESC)' : '🎯 Capture Crosshair';
  }
});

function isInteractiveUiElement(target, event = null) {
  const selector =
    '#game-over-modal, .device-modal-overlay, ' +
    '#left-drawer-container, #top-drawer-container, #bottom-drawer-container, ' +
    '#mobile-touch-controls, #unsupported-device-modal, .weapon-wheel-overlay, ' +
    '#wormhole-splash-screen, ' +
    '.hud-weapon-pill, .hud-btn, .drawer-pause-btn, .hud-pause-icon-btn, ' +
    'button, input, select, textarea, a, [role="button"], [role="tab"]';

  if (event && typeof event.composedPath === 'function') {
    const path = event.composedPath();
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      if (!node || node === window || node === document || node === document.documentElement || node === document.body) {
        continue;
      }
      if (node.shadowRoot) return true;
      if (typeof node.matches === 'function' && node.matches(selector)) {
        return true;
      }
    }
  }
  if (!target) return false;
  if (target.shadowRoot) return true;
  if (target.closest && target.closest('[data-webxr_runtime]') && target.tagName !== 'CANVAS') {
    return true;
  }
  return !!(target.closest && target.closest(selector));
}

function requestCrosshairCapture(forceInXr = false) {
  if (state.isPaused || state.isGameOver || !container) return;
  if (state.isXR && !forceInXr) return;
  if (document.pointerLockElement !== container) {
    try {
      const p = container.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch (err) {}
  }
}

// Window focus event captures crosshair when focusing into the window
window.addEventListener('focus', () => {
  if (!state.isXR && !state.isGameOver && !state.isPaused) {
    requestCrosshairCapture();
  }
});

// Window mouse interaction: captures crosshair and fires active weapon on left click
window.addEventListener('mousedown', (e) => {
  if (state.isGameOver) return;
  if (e.pointerType === 'touch' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;

  // Middle mouse wheel click (button 1): Open weapons arsenal
  if (e.button === 1) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    const splashEl = document.getElementById('wormhole-splash-screen');
    if (splashEl && splashEl.parentNode && splashEl.style.display !== 'none') {
      return;
    }
    e.preventDefault();
    if (!audioMgr.isInitialized) audioMgr.init();
    if (typeof isWeaponWheelOpen === 'function' && isWeaponWheelOpen()) {
      closeWeaponWheel();
    } else if (typeof openWeaponWheel === 'function') {
      openWeaponWheel();
    }
    return;
  }

  // If clicking on an interactive UI element (including Immersive Web Emulator Shadow DOM controls), let it handle the event
  if (isInteractiveUiElement(e.target, e)) return;

  // In WebXR / Immersive Web Emulator mode, let clicks on the emulator gizmo canvas pass through without moving the centered crosshair
  if (state.isXR && !state.isPointerLocked) return;

  if (!audioMgr.isInitialized) audioMgr.init();

  // If crosshair is not currently captured, capture it and snap crosshair to click
  if (!state.isPointerLocked) {
    state.crosshair.x = Math.max(10, Math.min(window.innerWidth - 10, e.clientX));
    state.crosshair.y = Math.max(10, Math.min(window.innerHeight - 10, e.clientY));
    if (typeof snapGrid !== 'undefined' && snapGrid.cellWidth > 0 && snapGrid.cellHeight > 0) {
      snapGrid.virtualX = state.crosshair.x;
      snapGrid.virtualY = state.crosshair.y;
      snapGrid.currentCol = Math.min(snapGrid.cols - 1, Math.max(0, Math.floor(state.crosshair.x / snapGrid.cellWidth)));
      snapGrid.currentRow = Math.min(snapGrid.rows - 1, Math.max(0, Math.floor(state.crosshair.y / snapGrid.cellHeight)));
      highlightActiveGridBox(snapGrid.currentCol, snapGrid.currentRow);
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

    requestCrosshairCapture();
  }

  // When left mouse button is pressed, fire active weapon ONE SHOT at a time
  if (e.button === 0) {
    state.isLeftMouseDown = true;
    fireLaserBeam();
    state.flightLockoutUntil = performance.now() + 3000;
  } else if (e.button === 2) {
    // When right mouse button is pressed, rapid fire active weapon
    state.isRightMouseDown = true;
    fireLaserBeam();
    state.flightLockoutUntil = performance.now() + 3000;
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    state.isLeftMouseDown = false;
  }
  if (e.button === 1) {
    e.preventDefault();
  }
  if (e.button === 2) {
    state.isRightMouseDown = false;
  }
  state.isMouseDown = false;
});

// Prevent middle click autoscroll icon in browsers
window.addEventListener('auxclick', (e) => {
  if (e.button === 1) {
    e.preventDefault();
  }
});

// Prevent context menu on right click during gameplay to allow RMB rapid fire
window.addEventListener('contextmenu', (e) => {
  if (!isInteractiveUiElement(e.target)) {
    e.preventDefault();
  }
});

window.addEventListener('blur', () => {
  state.isLeftMouseDown = false;
  state.isRightMouseDown = false;
});

// Full 360-degree Touch Screen Swipe Look on Background Canvas
let canvasLookTouchId = null;
let lastCanvasTouchX = 0;
let lastCanvasTouchY = 0;

if (container) {
  container.addEventListener('touchstart', (e) => {
    if (!audioMgr.isInitialized) audioMgr.init();
    if (canvasLookTouchId !== null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const targetEl = document.elementFromPoint(t.clientX, t.clientY);
      if (!targetEl || targetEl === container || targetEl.id === 'hud-layer' || targetEl.tagName === 'CANVAS') {
        canvasLookTouchId = t.identifier;
        lastCanvasTouchX = t.clientX;
        lastCanvasTouchY = t.clientY;
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (canvasLookTouchId === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.identifier === canvasLookTouchId) {
        const dx = t.clientX - lastCanvasTouchX;
        const dy = t.clientY - lastCanvasTouchY;
        lastCanvasTouchX = t.clientX;
        lastCanvasTouchY = t.clientY;

        touchLookYaw -= dx * CONFIG.yawSpeed * 1.6;
        touchLookPitch -= dy * CONFIG.pitchSpeed * 1.6;
        touchLookPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, touchLookPitch));
        state.yaw = lastGyroYaw + touchLookYaw;
        state.pitch = lastGyroPitch + touchLookPitch;
        state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));
        break;
      }
    }
  }, { passive: true });

  const endCanvasLookTouch = (e) => {
    if (canvasLookTouchId === null) return;
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === canvasLookTouchId) {
          canvasLookTouchId = null;
          break;
        }
      }
    } else {
      canvasLookTouchId = null;
    }
  };
  window.addEventListener('touchend', endCanvasLookTouch, { passive: true });
  window.addEventListener('touchcancel', endCanvasLookTouch, { passive: true });
}

// Auto-Align View to Wormhole Singularity (Smooth shortest-arc alignment with zero swinging)
function alignToWormhole() {
  if (state.isPaused) return;
  if (!camera) return;

  // If inside or dangerously close to event horizon, place safely at observation distance
  if (state.position.length() < 15.0) {
    state.position.set(0, 0, CONFIG.wormholeDistance);
    if (!state.isXR) {
      camera.position.copy(state.position);
    } else if (cameraRig) {
      cameraRig.position.copy(state.position);
    }
  }

  // Dampen translation drift so view stabilization doesn't fight centrifugal motion
  state.velocity.multiplyScalar(0.25);

  const toWormhole = new THREE.Vector3(0, 0, 0).sub(state.position);
  if (toWormhole.lengthSq() < 0.001) {
    toWormhole.set(0, 0, -1);
  } else {
    toWormhole.normalize();
  }

  let rawTargetYaw = Math.atan2(-toWormhole.x, -toWormhole.z);
  let rawTargetPitch = Math.asin(Math.max(-0.95, Math.min(0.95, toWormhole.y)));

  if (state.isXR && camera) {
    const hmdEuler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(camera.quaternion, 'YXZ');
    rawTargetYaw -= hmdEuler.y;
    rawTargetPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, rawTargetPitch - hmdEuler.x));
  }

  // Calculate shortest angular path from current state.yaw (avoids 360-degree swing / modulo glitches)
  let diff = (rawTargetYaw - state.yaw) % (Math.PI * 2);
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  state.targetYaw = state.yaw + diff;
  state.targetPitch = rawTargetPitch;
  state.isAligningToWormhole = true;

  // Recalibrate orientation reference so current phone pose locks onto the wormhole
  if (lastDeviceAlpha !== null) {
    baseAlpha = lastDeviceAlpha;
  }
  touchLookYaw = 0;
  touchLookPitch = 0;
}

// Prevent browser viewport scrolling/bouncing unless inside a dedicated scrollable panel
window.addEventListener('touchmove', (e) => {
  if (!e.target.closest('.drawer-content, .hud-header, .hud-footer, #landscape-rotate-prompt, .throttle-slider-container')) {
    if (e.cancelable) e.preventDefault();
  }
}, { passive: false });

// Isolate Cockpit Controls & Missions drawer scroll so dragging inside never moves the screen or leaks touch events
const missionDrawerContent = document.getElementById('mission-panel');
if (missionDrawerContent) {
  missionDrawerContent.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  }, { passive: true });
  missionDrawerContent.addEventListener('touchmove', (e) => {
    e.stopPropagation();
  }, { passive: true });
}
const leftDrawerTabHandle = document.getElementById('left-drawer-tab');
if (leftDrawerTabHandle) {
  leftDrawerTabHandle.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  }, { passive: true });
}

window.addEventListener('mousemove', (e) => {
  if (state.isPointerLocked) {
    const speedScale = (state.crosshairSpeedMultiplier || 4.00) / 4.00;
    state.crosshair.x += e.movementX * speedScale;
    state.crosshair.y += e.movementY * speedScale;

    // Clamp crosshair to viewport bounds
    const margin = 10;
    state.crosshair.x = Math.max(margin, Math.min(window.innerWidth - margin, state.crosshair.x));
    state.crosshair.y = Math.max(margin, Math.min(window.innerHeight - margin, state.crosshair.y));

    // Update snap grid position and active box
    if (typeof snapGrid !== 'undefined' && snapGrid.cellWidth > 0 && snapGrid.cellHeight > 0) {
      snapGrid.virtualX = state.crosshair.x;
      snapGrid.virtualY = state.crosshair.y;
      const newCol = Math.min(snapGrid.cols - 1, Math.max(0, Math.floor(state.crosshair.x / snapGrid.cellWidth)));
      const newRow = Math.min(snapGrid.rows - 1, Math.max(0, Math.floor(state.crosshair.y / snapGrid.cellHeight)));
      if (newCol !== snapGrid.currentCol || newRow !== snapGrid.currentRow) {
        snapGrid.currentCol = newCol;
        snapGrid.currentRow = newRow;
        highlightActiveGridBox(newCol, newRow);
      }
    }

    // Update DOM crosshair element immediately
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
  } else if (state.isMouseDown && !isMouseAim) {
    const deltaX = e.clientX - state.lastMouseX;
    const deltaY = e.clientY - state.lastMouseY;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;

    touchLookYaw -= deltaX * CONFIG.yawSpeed;
    touchLookPitch -= deltaY * CONFIG.pitchSpeed;
    touchLookPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, touchLookPitch));
    state.yaw = lastGyroYaw + touchLookYaw;
    state.pitch = lastGyroPitch + touchLookPitch;
    state.pitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, state.pitch));
  }
});

// =============================================================================
// MISSION OBJECTIVES & INTERACTIVE CALIBRATION SYSTEM
// =============================================================================
const hudDistEl = document.getElementById('hud-distance');
const hudVectorEl = document.getElementById('hud-vector');

function updateWormholeDistanceBadge(distKm) {
  if (typeof distKm !== 'number') {
    const curPos = state.isXR ? state.position : ((camera && camera.position) ? camera.position : state.position);
    distKm = Math.round(curPos.length() * 420);
  }
  const formatted = `${distKm.toLocaleString()} KM`;
  if (hudDistEl) hudDistEl.textContent = formatted;

  if (wormholeDistBadge) {
    if (distKm < 6000) {
      wormholeDistBadge.classList.add('proximity-critical');
      wormholeDistBadge.classList.remove('proximity-close');
    } else if (distKm < 20000) {
      wormholeDistBadge.classList.add('proximity-close');
      wormholeDistBadge.classList.remove('proximity-critical');
    } else {
      wormholeDistBadge.classList.remove('proximity-close', 'proximity-critical');
    }
  }
}
updateWormholeDistanceBadge();
const hudFluxEl = document.getElementById('hud-flux');
const hudFpsEl = document.getElementById('hud-fps');
const toastEl = document.getElementById('toast-msg');
const vectorRingEl = document.getElementById('vector-alignment-ring');
const warpBtn = document.getElementById('btn-warp');
const objTotalProgressEl = document.getElementById('obj-total-progress');

let toastTimer = null;
function showToast(msg, duration = 2500) {
  if (!toastEl || !msg) return;
  const str = String(msg).toUpperCase();
  // Strictly enforce: No messages except WARP UNAVAILABLE
  if (!str.includes('WARP') || !str.includes('UNAVAILABLE')) {
    return;
  }
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = 'WARP UNAVAILABLE';
  toastEl.style.display = 'block';
  toastTimer = setTimeout(() => {
    toastEl.style.display = 'none';
    toastTimer = null;
  }, duration);
}

// =============================================================================
// 3D POWER UP PICKUP SYSTEM (HEALTH & SHIELD BOOSTERS, MULTI-EVENTS, ENEMY DROPS)
// =============================================================================
const active3DPowerups = [];
const triggeredPowerupEventSet = new Set();

function createPowerupSprite(icon, boostPct, colorHex, restoreBoth = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Radial glow background
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, colorHex || '#00f0ff');
  grad.addColorStop(0.55, 'rgba(0, 240, 255, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  // Draw Emoji icon
  ctx.font = '52px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon || '⚡', 64, 56);

  // Boost percentage badge
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = colorHex || '#00f0ff';
  ctx.shadowBlur = 8;
  if (restoreBoth) {
    ctx.fillText('100% DUAL', 64, 106);
  } else if (boostPct) {
    ctx.fillText(`+${Math.round(boostPct)}%`, 64, 106);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(10, 10, 1);
  return sprite;
}

function create3DPowerupMesh(pConfig) {
  const group = new THREE.Group();
  const isHealth = (pConfig.powerup_type || '').toLowerCase() === 'health';
  const boostPct = parseFloat(pConfig.boost_pct !== undefined ? pConfig.boost_pct : pConfig.boost_percentage) || 25.0;
  const colorHexStr = pConfig.color_hex || (isHealth ? '#10b981' : '#00f0ff');
  const colorHexInt = parseInt(colorHexStr.replace('#', '0x'), 16) || (isHealth ? 0x10b981 : 0x00f0ff);
  const icon = pConfig.icon || (isHealth ? '💖' : '🛡️');
  const modelType = (pConfig.model_3d_type || (isHealth ? 'capsule' : 'octahedron')).toLowerCase();

  // Sizing & Dimensions
  const userScale = Math.max(0.1, Math.min(20.0, parseFloat(pConfig.scale !== undefined && pConfig.scale !== null ? pConfig.scale : 1.0) || 1.0));
  const userLength = Math.max(0.2, Math.min(50.0, parseFloat(pConfig.length !== undefined && pConfig.length !== null ? pConfig.length : 2.5) || 2.5));
  const userHeight = Math.max(0.2, Math.min(50.0, parseFloat(pConfig.height !== undefined && pConfig.height !== null ? pConfig.height : 2.5) || 2.5));
  const userDepth = Math.max(0.2, Math.min(50.0, parseFloat(pConfig.depth !== undefined && pConfig.depth !== null ? pConfig.depth : 2.5) || 2.5));
  const userCircumference = Math.max(0.5, Math.min(100.0, parseFloat(pConfig.circumference !== undefined && pConfig.circumference !== null ? pConfig.circumference : 6.0) || 6.0));
  const userRadius = Math.max(0.1, userCircumference / (2 * Math.PI));

  const wireMat = new THREE.MeshBasicMaterial({
    color: colorHexInt,
    wireframe: true,
    transparent: true,
    opacity: 0.85
  });

  const solidMat = new THREE.MeshStandardMaterial({
    color: colorHexInt,
    metalness: 0.8,
    roughness: 0.2,
    emissive: colorHexInt,
    emissiveIntensity: 0.4
  });

  const coreGlowMat = new THREE.MeshBasicMaterial({
    color: colorHexInt,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });

  let meshBody = null;
  let coreMesh = null;
  let spinRing = null;

  if (modelType === 'icosahedron') {
    meshBody = new THREE.Mesh(new THREE.IcosahedronGeometry(userRadius, 0), wireMat);
    coreMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(userRadius * 0.5), coreGlowMat);
    group.add(meshBody);
    group.add(coreMesh);
  } else if (modelType === 'dodecahedron') {
    meshBody = new THREE.Mesh(new THREE.DodecahedronGeometry(userRadius), solidMat);
    const wireCage = new THREE.Mesh(new THREE.DodecahedronGeometry(userRadius * 1.25), wireMat);
    coreMesh = new THREE.Mesh(new THREE.SphereGeometry(userRadius * 0.4, 12, 12), coreGlowMat);
    group.add(meshBody);
    group.add(wireCage);
    group.add(coreMesh);
  } else if (modelType === 'torus') {
    meshBody = new THREE.Mesh(new THREE.TorusGeometry(userRadius, Math.max(0.15, userRadius * 0.25), 12, 32), solidMat);
    spinRing = new THREE.Mesh(new THREE.TorusGeometry(userRadius * 1.35, Math.max(0.05, userRadius * 0.08), 8, 24), wireMat);
    coreMesh = new THREE.Mesh(new THREE.SphereGeometry(userRadius * 0.5, 16, 16), coreGlowMat);
    group.add(meshBody);
    group.add(spinRing);
    group.add(coreMesh);
  } else if (modelType === 'sphere') {
    meshBody = new THREE.Mesh(new THREE.SphereGeometry(userRadius, 16, 16), coreGlowMat);
    spinRing = new THREE.Mesh(new THREE.TorusGeometry(userRadius * 1.4, Math.max(0.05, userRadius * 0.08), 8, 24), wireMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(userRadius * 1.4, Math.max(0.05, userRadius * 0.08), 8, 24), wireMat);
    ring2.rotation.x = Math.PI / 2;
    spinRing.add(ring2);
    group.add(meshBody);
    group.add(spinRing);
  } else if (modelType === 'capsule') {
    // Bio-nanite cylinder capsule with rounded ends
    const capHeight = Math.max(0.6, userHeight);
    const capRadius = Math.max(0.3, userRadius * 0.6);
    meshBody = new THREE.Mesh(new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16), solidMat);
    const topCap = new THREE.Mesh(new THREE.SphereGeometry(capRadius, 12, 12), solidMat);
    topCap.position.y = capHeight * 0.5;
    const botCap = new THREE.Mesh(new THREE.SphereGeometry(capRadius, 12, 12), solidMat);
    botCap.position.y = -capHeight * 0.5;
    meshBody.add(topCap);
    meshBody.add(botCap);

    coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(capRadius * 0.45, capRadius * 0.45, capHeight * 0.85, 8), coreGlowMat);
    group.add(meshBody);
    group.add(coreMesh);
  } else if (modelType === 'custom' || modelType === 'gltf') {
    const gltfUrl = (pConfig.model_3d_url || '').trim();
    if (gltfUrl && typeof gltfLoader !== 'undefined') {
      gltfLoader.load(
        gltfUrl,
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(userScale, userScale, userScale);
          group.add(model);
        },
        undefined,
        (err) => {
          console.warn('[PowerUp] GLTF loading failed for:', gltfUrl, err);
          const fb = new THREE.Mesh(new THREE.OctahedronGeometry(userRadius, 0), solidMat);
          group.add(fb);
        }
      );
    } else {
      meshBody = new THREE.Mesh(new THREE.OctahedronGeometry(userRadius, 0), solidMat);
      coreMesh = new THREE.Mesh(new THREE.SphereGeometry(userRadius * 0.4, 12, 12), coreGlowMat);
      group.add(meshBody);
      group.add(coreMesh);
    }
  } else if (modelType === 'icon_sprite') {
    // Icon sprite billboard only
  } else {
    // Default: 'octahedron' Diamond Energy Cage
    meshBody = new THREE.Mesh(new THREE.OctahedronGeometry(userRadius, 0), wireMat);
    const innerCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(userRadius * 0.65, 0), solidMat);
    coreMesh = new THREE.Mesh(new THREE.SphereGeometry(userRadius * 0.35, 12, 12), coreGlowMat);
    group.add(meshBody);
    group.add(innerCrystal);
    group.add(coreMesh);
  }

  // Scale the whole group by userScale
  group.scale.set(userScale, userScale, userScale);

  const isDual = pConfig.restore_both == 1 || pConfig.restoreBoth == 1;

  // 2D Billboard Sprite showing the Power Up Icon and boost percentage
  const sprite = createPowerupSprite(icon, boostPct, colorHexStr, isDual);
  sprite.position.y = (modelType === 'icon_sprite') ? 0 : (userRadius * 1.35 + 1.2);
  group.add(sprite);

  // Point light for spatial glow
  const light = new THREE.PointLight(colorHexInt, 2.5, 28);
  group.add(light);

  return {
    group,
    meshBody,
    coreMesh,
    spinRing,
    sprite
  };
}

function spawn3DPowerUp(pConfig, spawnPos = null) {
  if (!scene || !pConfig) return null;

  const isDualRestore = pConfig.restore_both == 1 || pConfig.restoreBoth == 1;
  const isHealth = (pConfig.powerup_type || '').toLowerCase() === 'health';
  const isShield = (pConfig.powerup_type || '').toLowerCase() === 'shield';

  if (isDualRestore) {
    // Only spawn dual restore if player is not already at 100% health AND 100% shield
    if ((state.playerHealth || 0) >= (state.maxHealth || 100) && (state.playerShield || 0) >= (state.maxShield || 100)) {
      return null;
    }
  } else {
    // Requirement: Don't make health powerups until shield has depleted to 0%
    if (isHealth && (state.playerShield || 0) > 0) return null;

    // Requirement: Don't make shield power ups if health is not 100%
    if (isShield && (state.playerHealth || 0) < (state.maxHealth || 100)) return null;
  }

  const boostPct = parseFloat(pConfig.boost_pct !== undefined ? pConfig.boost_pct : pConfig.boost_percentage) || 25.0;
  const colorHexStr = pConfig.color_hex || (isDualRestore ? '#f59e0b' : (isHealth ? '#10b981' : '#00f0ff'));

  const { group, meshBody, coreMesh, spinRing, sprite } = create3DPowerupMesh(pConfig);

  // Position within tunnel
  if (spawnPos) {
    group.position.copy(spawnPos);
  } else {
    // Spawn ahead of player along tunnel toward wormhole with proximity detection
    const playerZ = (state.position && state.position.z) ? state.position.z : (CONFIG.wormholeDistance || 220);
    let chosenPos = null;
    let bestClearance = -1;
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = (attempt / 24) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 10 + Math.random() * 14;
      const candZ = Math.max(18, playerZ - (45 + Math.random() * 55));
      const cand = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, candZ);

      let minEnemyDist = Infinity;
      if (Array.isArray(active3DEnemies) && active3DEnemies.length > 0) {
        for (let j = 0; j < active3DEnemies.length; j++) {
          const enemy = active3DEnemies[j];
          if (enemy && enemy.mesh) {
            const d = cand.distanceTo(enemy.mesh.position);
            if (d < minEnemyDist) minEnemyDist = d;
          }
        }
      } else {
        minEnemyDist = 999.0;
      }

      if (minEnemyDist >= 16.0) {
        chosenPos = cand;
        break;
      }
      if (minEnemyDist > bestClearance) {
        bestClearance = minEnemyDist;
        chosenPos = cand;
      }
    }
    group.position.copy(chosenPos || new THREE.Vector3(0, 6, Math.max(18, playerZ - 50)));
  }

  scene.add(group);

  const powerupInstance = {
    mesh: group,
    meshBody: meshBody,
    core: coreMesh,
    spinRing: spinRing,
    sprite: sprite,
    config: pConfig,
    powerupType: isHealth ? 'health' : 'shield',
    restore_both: isDualRestore ? 1 : 0,
    boostPct: boostPct,
    colorHex: colorHexStr,
    spawnTime: performance.now(),
    rotSpeedX: (Math.random() - 0.5) * 2.5 + 1.2,
    rotSpeedY: (Math.random() - 0.5) * 2.5 + 1.2,
    rotSpeedZ: (Math.random() - 0.5) * 2.0,
    collected: false
  };

  active3DPowerups.push(powerupInstance);
  return powerupInstance;
}

/**
 * Automatically cleans up uncollected powerups based on player's current health and shield status:
 * - If health energy is below 99%, any uncollected shield powerups automatically disappear.
 * - If shield energy is above 1%, any uncollected health powerups automatically disappear.
 * - If both shield and health are at or above 99%, dual restore powerups automatically disappear.
 * Ensures complete disposal of geometries and materials to avoid memory leaks.
 */
function pruneUncollectedPowerupsByEnergyState() {
  if (!scene || !Array.isArray(active3DPowerups) || active3DPowerups.length === 0) return;
  const maxH = state.maxHealth || 100;
  const maxS = state.maxShield || 100;
  const healthPct = ((state.playerHealth || 0) / maxH) * 100;
  const shieldPct = ((state.playerShield || 0) / maxS) * 100;

  for (let i = active3DPowerups.length - 1; i >= 0; i--) {
    const p = active3DPowerups[i];
    if (!p || p.collected) continue;

    const isDual = p.restore_both == 1 || (p.config && (p.config.restore_both == 1 || p.config.restoreBoth == 1));

    if (isDual) {
      if (healthPct >= 99.0 && shieldPct >= 99.0) {
        if (p.mesh && scene) scene.remove(p.mesh);
        disposeMeshHierarchy(p.mesh);
        active3DPowerups.splice(i, 1);
      }
      continue;
    }

    // Requirement: if health energy is below 99% then any uncollected shield powerups should automatically disappear
    if (p.powerupType === 'shield' && healthPct < 99.0) {
      if (p.mesh && scene) scene.remove(p.mesh);
      disposeMeshHierarchy(p.mesh);
      active3DPowerups.splice(i, 1);
      continue;
    }

    // Requirement: if shield energy is above 1% then any uncollected health powerups should automatically disappear
    if (p.powerupType === 'health' && shieldPct > 1.0) {
      if (p.mesh && scene) scene.remove(p.mesh);
      disposeMeshHierarchy(p.mesh);
      active3DPowerups.splice(i, 1);
      continue;
    }
  }
}

function update3DPowerups(delta) {
  if (!scene) return;
  if (state.isGameOver) {
    despawnAllActivePowerups();
    return;
  }

  // Requirement: Auto-disappear uncollected shield or health powerups when energy constraints trigger
  pruneUncollectedPowerupsByEnergyState();

  const now = performance.now();
  const playerPos = (state.isXR && cameraRig) ? cameraRig.position : (state.position || new THREE.Vector3(0, 0, CONFIG.wormholeDistance || 220));

  for (let i = active3DPowerups.length - 1; i >= 0; i--) {
    const p = active3DPowerups[i];
    if (p.collected) continue;

    // Rotation and pulsing animation
    if (p.meshBody) {
      p.meshBody.rotation.x += p.rotSpeedX * delta;
      p.meshBody.rotation.y += p.rotSpeedY * delta;
      p.meshBody.rotation.z += (p.rotSpeedZ || 0.8) * delta;
    }
    if (p.spinRing) {
      p.spinRing.rotation.x += 1.8 * delta;
      p.spinRing.rotation.y += 1.2 * delta;
    }
    const pulse = 1.0 + Math.sin((now - p.spawnTime) * 0.005) * 0.12;
    if (p.core) {
      p.core.scale.set(pulse, pulse, pulse);
    }

    // Gentle hovering bob in place
    const hoverOffset = Math.sin((now - p.spawnTime) * 0.003) * 0.08;
    p.mesh.position.y += hoverOffset * delta * 15.0;

    // Requirement: Proximity detection so it doesn't collide with other undestroyed enemies
    if (Array.isArray(active3DEnemies) && active3DEnemies.length > 0) {
      for (let j = 0; j < active3DEnemies.length; j++) {
        const enemy = active3DEnemies[j];
        if (!enemy || !enemy.mesh) continue;
        const sepVec = new THREE.Vector3().subVectors(p.mesh.position, enemy.mesh.position);
        const sepDist = sepVec.length();
        const minSafeSep = Math.max(12.0, (enemy.mesh.scale.x * 3.0) + 4.0);
        if (sepDist < minSafeSep && sepDist > 0.001) {
          // Smoothly repel the powerup away from the undestroyed enemy
          sepVec.normalize().multiplyScalar((minSafeSep - sepDist) * 10.0 * delta);
          p.mesh.position.add(sepVec);
        }
      }
    }

    // Check distance to player
    const distToPlayer = p.mesh.position.distanceTo(playerPos);

    // Magnetic tractor beam homing: when player is within 45 units, pull powerup smoothly toward player
    if (distToPlayer < 45.0) {
      const pullDir = new THREE.Vector3().subVectors(playerPos, p.mesh.position).normalize();
      const pullSpeed = Math.max(35.0, 75.0 * (1.0 - distToPlayer / 45.0));
      p.mesh.position.addScaledVector(pullDir, pullSpeed * delta);
    }

    // Collection check - expanded radius for smooth pickup
    if (distToPlayer < 14.0) {
      // COLLECTED!
      p.collected = true;
      applyPowerupEffect(p);
      triggerPowerupCollectFx(p.mesh.position, p.colorHex);

      scene.remove(p.mesh);
      disposeMeshHierarchy(p.mesh);
      active3DPowerups.splice(i, 1);
      pruneUncollectedPowerupsByEnergyState();
      continue;
    }

    // Despawn if passed far away or expired (90 seconds)
    if (distToPlayer > 260 || (now - p.spawnTime) > 90000) {
      scene.remove(p.mesh);
      disposeMeshHierarchy(p.mesh);
      active3DPowerups.splice(i, 1);
    }
  }
}

function disposeMeshHierarchy(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m => {
        if (!m) return;
        if (m.map && typeof m.map.dispose === 'function') m.map.dispose();
        if (m.alphaMap && typeof m.alphaMap.dispose === 'function') m.alphaMap.dispose();
        if (m.lightMap && typeof m.lightMap.dispose === 'function') m.lightMap.dispose();
        if (m.normalMap && typeof m.normalMap.dispose === 'function') m.normalMap.dispose();
        if (m.roughnessMap && typeof m.roughnessMap.dispose === 'function') m.roughnessMap.dispose();
        if (m.metalnessMap && typeof m.metalnessMap.dispose === 'function') m.metalnessMap.dispose();
        m.dispose();
      });
    }
    if (typeof child.dispose === 'function') {
      try { child.dispose(); } catch (e) {}
    }
  });
}

function applyPowerupEffect(powerupInstance) {
  const isDualRestore = powerupInstance.restore_both == 1 || (powerupInstance.config && (powerupInstance.config.restore_both == 1 || powerupInstance.config.restoreBoth == 1));

  if (isDualRestore) {
    // 100% restoration for both shield and health simultaneously
    state.playerHealth = 100;
    state.playerShield = 100;
  } else {
    const isHealth = powerupInstance.powerupType === 'health';
    const boost = powerupInstance.boostPct || 25.0;

    if (isHealth) {
      state.playerHealth = Math.min(state.maxHealth || 100, (state.playerHealth || 0) + boost);
    } else {
      state.playerShield = Math.min(state.maxShield || 100, (state.playerShield || 0) + boost);
    }
  }

  // Flash Defense HUD on hit / gain
  showShieldAndHealthOnHit(1200);
  updatePlayerDefenseHUD();

  // Prune any uncollected powerups that become invalid following the energy boost
  pruneUncollectedPowerupsByEnergyState();

  if (audioMgr && typeof audioMgr.playLaserBolt === 'function') {
    audioMgr.playLaserBolt();
  }
}

function triggerPowerupCollectFx(position, colorHexStr) {
  if (!scene) return;
  const colorHexInt = parseInt((colorHexStr || '#00f0ff').replace('#', '0x'), 16) || 0x00f0ff;
  const count = 30;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 35,
      (Math.random() - 0.5) * 35,
      (Math.random() - 0.5) * 35
    ));
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: colorHexInt,
    size: 2.8,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geom, mat);
  scene.add(points);

  const startTime = performance.now();
  const interval = setInterval(() => {
    const elapsed = (performance.now() - startTime) * 0.001;
    const posAttr = geom.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.setXYZ(
        i,
        posAttr.getX(i) + velocities[i].x * 0.025,
        posAttr.getY(i) + velocities[i].y * 0.025,
        posAttr.getZ(i) + velocities[i].z * 0.025
      );
    }
    posAttr.needsUpdate = true;
    mat.opacity = Math.max(0, 1.0 - elapsed * 2.0);

    if (elapsed > 0.5) {
      clearInterval(interval);
      scene.remove(points);
      geom.dispose();
      mat.dispose();
    }
  }, 25);
}

function despawnAllActivePowerups() {
  for (let i = active3DPowerups.length - 1; i >= 0; i--) {
    const p = active3DPowerups[i];
    if (p.mesh && scene) {
      scene.remove(p.mesh);
      disposeMeshHierarchy(p.mesh);
    }
    active3DPowerups.splice(i, 1);
  }
}

/**
 * Calculates a display/spawn position for dropped powerups that is:
 * 1. Far away from where the enemy was destroyed (deathPos).
 * 2. Positioned with proximity detection so it doesn't collide with any other undestroyed enemies.
 * 3. Safely situated within visible tunnel/corridor flight bounds.
 */
function calculateSafeFarPowerupSpawnPos(deathPos) {
  const dPos = (deathPos && deathPos.isVector3) ? deathPos : new THREE.Vector3(deathPos ? deathPos.x : 0, deathPos ? deathPos.y : 0, deathPos ? deathPos.z : 100);
  const playerZ = (state.position && typeof state.position.z === 'number') ? state.position.z : (CONFIG.wormholeDistance || 220);

  // Target separation distance from where enemy was destroyed (at least 48 to 76 units away)
  const minDistanceFromDeath = 48.0;
  const maxDistanceFromDeath = 76.0;

  let bestPos = null;
  let maxClearance = -1;

  // Undestroyed enemies currently active in scene
  const undestroyedEnemies = Array.isArray(active3DEnemies) ? active3DEnemies : [];

  // Helper to measure distance to closest undestroyed enemy
  const getMinClearanceToEnemies = (pos) => {
    if (!undestroyedEnemies.length) return 999.0;
    let minD = Infinity;
    for (let k = 0; k < undestroyedEnemies.length; k++) {
      const u = undestroyedEnemies[k];
      if (!u || !u.mesh) continue;
      const d = pos.distanceTo(u.mesh.position);
      if (d < minD) minD = d;
    }
    return minD;
  };

  // Generate candidates across radial angles, corridor radii, and forward & rear corridor offsets
  const candidateOffsets = [];
  const angleSteps = 16;
  for (let a = 0; a < angleSteps; a++) {
    const angle = (a / angleSteps) * Math.PI * 2;
    // Radial distance from corridor center axis (between 10 and 22 units)
    const rad = 10.0 + (a % 4) * 3.5;
    const candX = Math.cos(angle) * rad;
    const candY = Math.sin(angle) * (rad * 0.85);

    // Test forward (toward player), backward (toward wormhole), and lateral deep offsets
    const zOffsets = [
      minDistanceFromDeath + Math.random() * (maxDistanceFromDeath - minDistanceFromDeath),
      -(minDistanceFromDeath + Math.random() * (maxDistanceFromDeath - minDistanceFromDeath)),
      (minDistanceFromDeath * 0.75),
      -(minDistanceFromDeath * 0.75)
    ];

    for (const zOff of zOffsets) {
      let candZ = dPos.z + zOff;
      // Clamp candZ inside playable visible flight corridor
      candZ = Math.max(18.0, Math.min(playerZ - 12.0, candZ));

      const cand = new THREE.Vector3(candX, candY, candZ);
      const distFromDeath = cand.distanceTo(dPos);

      // Verify it is indeed far away from the enemy's destruction point
      if (distFromDeath >= minDistanceFromDeath) {
        candidateOffsets.push(cand);
      }
    }
  }

  // Minimum required safe proximity distance to consider a position collision-free from undestroyed enemies
  const minSafeEnemyClearance = 16.0;

  for (let i = 0; i < candidateOffsets.length; i++) {
    const cand = candidateOffsets[i];
    const clearance = getMinClearanceToEnemies(cand);

    // If clearance exceeds safe threshold, this position is collision-free!
    if (clearance >= minSafeEnemyClearance) {
      if (clearance > maxClearance) {
        maxClearance = clearance;
        bestPos = cand;
      }
    } else if (!bestPos && clearance > maxClearance) {
      maxClearance = clearance;
      bestPos = cand;
    }
  }

  // Fallback: If no candidate was accepted, compute safe position away from death point
  if (!bestPos) {
    const fallbackAngle = Math.random() * Math.PI * 2;
    const fallbackZ = Math.max(18.0, Math.min(playerZ - 15.0, dPos.z > 80 ? dPos.z - 52.0 : dPos.z + 52.0));
    bestPos = new THREE.Vector3(Math.cos(fallbackAngle) * 14.0, Math.sin(fallbackAngle) * 12.0, fallbackZ);
  }

  return bestPos;
}

function checkEnemyPowerupDrop(enemyConfig, position) {
  if (!enemyConfig || !position) return;
  const powerupList = window.activeStagePowerups || state.stagePowerups || DEFAULT_STAGE_POWERUPS || [];
  if (!powerupList.length) return;

  const currentDev = (currentActiveDeviceType || 'desktop').toLowerCase();
  const currentStage = currentActiveStage || 1;

  for (const p of powerupList) {
    if (p.is_active === 0 || p.is_active === '0' || p.is_active === false) continue;
    if (parseInt(p.stage_level) !== currentStage && parseInt(p.stage_level) !== 0) continue;

    const pDev = (p.device_type || 'all').toLowerCase();
    if (pDev !== 'all' && pDev !== currentDev) continue;

    const dropOnKill = (p.drop_on_enemy_kill == 1 || p.drop_on_enemy_kill === true || p.drop_on_enemy_kill === '1');
    if (!dropOnKill) continue;

    const isHealth = (p.powerup_type || '').toLowerCase() === 'health';
    const isShield = (p.powerup_type || '').toLowerCase() === 'shield';

    // Requirement: Don't make health powerups until shield has depleted to 0%
    if (isHealth && (state.playerShield || 0) > 0) continue;

    // Requirement: Don't make shield power ups if health is not 100%
    if (isShield && (state.playerHealth || 0) < (state.maxHealth || 100)) continue;

    // Check target enemy type (match against all identifier fields)
    const targetEnemy = (p.drop_enemy_type || p.enemy_id || 'all').trim().toLowerCase();
    const enemyId = (enemyConfig.enemy_id || enemyConfig.id || '').toLowerCase();
    const enemyName = (enemyConfig.name || enemyConfig.enemy_name || '').toLowerCase();
    const enemyModel = (enemyConfig.model_3d_type || '').toLowerCase();

    const enemyMatches = (targetEnemy === 'all' ||
      targetEnemy === enemyId ||
      targetEnemy === enemyName ||
      targetEnemy === enemyModel ||
      enemyId.includes(targetEnemy) ||
      enemyName.includes(targetEnemy) ||
      targetEnemy.includes(enemyId));

    if (!enemyMatches) continue;

    // Check drop chance percentage
    const chance = parseFloat(p.drop_chance_pct) !== undefined && !isNaN(parseFloat(p.drop_chance_pct))
      ? parseFloat(p.drop_chance_pct)
      : 75.0;
    const roll = Math.random() * 100;
    if (roll <= chance) {
      // Requirement: When a power up displays make it display far away from where the enemy was destroyed
      // but give it proximity detection so it doesn't collide with other un destroyed enemies
      const dropSpawn = calculateSafeFarPowerupSpawnPos(position);
      spawn3DPowerUp(p, dropSpawn);
      break; // Drop one powerup per enemy kill
    }
  }
}

function checkEventPowerupAppearance(eventName) {
  if (!eventName) return;
  const powerupList = window.activeStagePowerups || state.stagePowerups || DEFAULT_STAGE_POWERUPS || [];
  if (!powerupList.length) return;

  const currentDev = (currentActiveDeviceType || 'desktop').toLowerCase();
  const currentStage = currentActiveStage || 1;
  const normalizedEvent = eventName.trim().toLowerCase();

  for (const p of powerupList) {
    if (p.is_active === 0 || p.is_active === '0' || p.is_active === false) continue;
    if (parseInt(p.stage_level) !== currentStage) continue;

    const pDev = (p.device_type || 'all').toLowerCase();
    if (pDev !== 'all' && pDev !== currentDev) continue;

    const isHealth = (p.powerup_type || '').toLowerCase() === 'health';
    const isShield = (p.powerup_type || '').toLowerCase() === 'shield';

    // Requirement: Don't make health powerups until shield has depleted to 0%
    if (isHealth && (state.playerShield || 0) > 0) continue;

    // Requirement: Don't make shield power ups if health is not 100%
    if (isShield && (state.playerHealth || 0) < (state.maxHealth || 100)) continue;

    const rawEvents = (p.trigger_events || '').toLowerCase().split(',').map(s => s.trim());
    if (rawEvents.includes(normalizedEvent)) {
      // Event matches!
      const eventKey = `${currentStage}_${p.powerup_id || p.id}_${normalizedEvent}`;
      if (!triggeredPowerupEventSet.has(eventKey)) {
        triggeredPowerupEventSet.add(eventKey);
        spawn3DPowerUp(p);
      }
    }
  }
}

let lastCheckedDistMilestone = 100000;
function checkDistanceStageEvents(distKm) {
  if (!state.hasStarted || state.isGameOver) return;
  if (distKm <= 75000 && lastCheckedDistMilestone > 75000) {
    triggerAcquireEvent('stage_quarter_approach');
  }
  if (distKm <= 50000 && lastCheckedDistMilestone > 50000) {
    triggerAcquireEvent('halfway_approach');
    triggerAcquireEvent('resonance_alignment_achieved');
  }
  if (distKm <= 25000 && lastCheckedDistMilestone > 25000) {
    triggerAcquireEvent('singularity_proximity');
    triggerAcquireEvent('singularity_approach');
  }
  if (distKm <= 10000 && lastCheckedDistMilestone > 10000) {
    triggerAcquireEvent('warp_gate_contact');
    triggerAcquireEvent('gravitational_well_ingress');
  }
  lastCheckedDistMilestone = distKm;
}

// =============================================================================
// 3D ENEMY COMBAT SYSTEM (PROCEDURAL 3D GRAPHICS, SCALING WORMHOLE RUSH, WEAPONS)
// =============================================================================
const active3DEnemies = [];
const enemyBolts = [];
let lastEnemySpawnCheckTime = 0;

function despawnAllActiveEnemies() {
  for (let i = active3DEnemies.length - 1; i >= 0; i--) {
    const e = active3DEnemies[i];
    if (e && e.mesh && scene) {
      scene.remove(e.mesh);
      disposeMeshHierarchy(e.mesh);
    }
    active3DEnemies.splice(i, 1);
  }
  for (let i = enemyBolts.length - 1; i >= 0; i--) {
    const b = enemyBolts[i];
    if (b && b.mesh && scene) {
      scene.remove(b.mesh);
      if (b.geometryList) b.geometryList.forEach(g => { if (g && g.dispose) g.dispose(); });
      if (b.materialList) b.materialList.forEach(m => { if (m && m.dispose) m.dispose(); });
      if (b.geometry && b.geometry.dispose) b.geometry.dispose();
      if (b.material && b.material.dispose) b.material.dispose();
      disposeMeshHierarchy(b.mesh);
    }
    enemyBolts.splice(i, 1);
  }
}

function create3DEnemyMesh(config) {
  const group = new THREE.Group();
  const modelType = (config.model_3d_type || 'scout_drone').toLowerCase();
  const rawColor = config.color_hex || config.color || '#00f0ff';
  const colorHex = parseInt(rawColor.replace('#', '0x'), 16) || 0x00f0ff;

  // Extract configured 3D dimensions (Overall Scale, Length X, Height Y, Depth Z, Circumference)
  const userScale = Math.max(0.05, Math.min(20.0, parseFloat(config.scale !== undefined && config.scale !== null ? config.scale : 1.0) || 1.0));
  const userLength = Math.max(0.2, Math.min(100.0, parseFloat(config.length !== undefined && config.length !== null ? config.length : 3.0) || 3.0));
  const userHeight = Math.max(0.2, Math.min(100.0, parseFloat(config.height !== undefined && config.height !== null ? config.height : 1.5) || 1.5));
  const userDepth = Math.max(0.2, Math.min(100.0, parseFloat(config.depth !== undefined && config.depth !== null ? config.depth : 3.0) || 3.0));
  const userCircumference = Math.max(0.5, Math.min(200.0, parseFloat(config.circumference !== undefined && config.circumference !== null ? config.circumference : 6.0) || 6.0));
  // Radius derived from circumference: C = 2 * PI * r => r = C / (2 * PI)
  const userRadius = Math.max(0.1, userCircumference / (2 * Math.PI));

  const hullMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.85,
    roughness: 0.28,
    emissive: colorHex,
    emissiveIntensity: 0.35
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending
  });

  const weaponBoltColor = config.weapon_color || '#ff0055';
  const weaponBoltHex = parseInt(weaponBoltColor.replace('#', '0x'), 16) || 0xff0055;
  const weaponGlowMat = new THREE.MeshBasicMaterial({
    color: weaponBoltHex,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });

  if (modelType === 'interceptor') {
    // 3D Delta-Wing Fighter using configured length (wingspan), height, depth, circumference
    const bodyGeom = new THREE.ConeGeometry(Math.max(0.25, userRadius * 0.7), userDepth, 4);
    bodyGeom.rotateX(-Math.PI / 2);
    const body = new THREE.Mesh(bodyGeom, hullMat);
    group.add(body);

    const wingGeom = new THREE.BoxGeometry(userLength, Math.max(0.04, userHeight * 0.08), Math.max(0.5, userDepth * 0.45));
    const wings = new THREE.Mesh(wingGeom, hullMat);
    wings.position.set(0, 0, userDepth * 0.08);
    group.add(wings);

    const engRadius = Math.max(0.1, userRadius * 0.18);
    const engGeom = new THREE.CylinderGeometry(engRadius, engRadius * 1.6, Math.max(0.3, userDepth * 0.28), 8);
    engGeom.rotateX(Math.PI / 2);
    const engL = new THREE.Mesh(engGeom, glowMat);
    engL.position.set(-userLength * 0.18, 0, userDepth * 0.42);
    const engR = new THREE.Mesh(engGeom, glowMat);
    engR.position.set(userLength * 0.18, 0, userDepth * 0.42);
    group.add(engL, engR);

    // Twin Wingtip Weapon Emitters
    const gunGeom = new THREE.CylinderGeometry(0.08, 0.12, Math.max(0.4, userDepth * 0.32), 6);
    gunGeom.rotateX(Math.PI / 2);
    const gunL = new THREE.Mesh(gunGeom, weaponGlowMat);
    gunL.position.set(-userLength * 0.42, -0.05, -userDepth * 0.08);
    const gunR = new THREE.Mesh(gunGeom, weaponGlowMat);
    gunR.position.set(userLength * 0.42, -0.05, -userDepth * 0.08);
    group.add(gunL, gunR);
  } else if (modelType === 'cruiser') {
    // 3D Heavy Hexagonal Battlecruiser using configured depth, height, length, circumference
    const hullGeom = new THREE.CylinderGeometry(Math.max(0.4, userRadius * 0.8), Math.max(0.6, userRadius * 1.15), userDepth, 6);
    hullGeom.rotateX(-Math.PI / 2);
    const hull = new THREE.Mesh(hullGeom, hullMat);
    group.add(hull);

    const bridgeGeom = new THREE.BoxGeometry(Math.max(0.4, userLength * 0.35), Math.max(0.3, userHeight * 0.4), Math.max(0.6, userDepth * 0.32));
    const bridge = new THREE.Mesh(bridgeGeom, hullMat);
    bridge.position.set(0, userHeight * 0.45, userDepth * 0.12);
    group.add(bridge);

    const coreGeom = new THREE.SphereGeometry(Math.max(0.3, userRadius * 0.5), 12, 12);
    const core = new THREE.Mesh(coreGeom, glowMat);
    group.add(core);

    const gunFront = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, Math.max(0.8, userDepth * 0.4), 8), weaponGlowMat);
    gunFront.geometry.rotateX(Math.PI / 2);
    gunFront.position.set(0, -userHeight * 0.2, -userDepth * 0.48);
    group.add(gunFront);
  } else if (modelType === 'dreadnought') {
    // 3D Massive Capital Dreadnought using configured dimensions
    const citGeom = new THREE.DodecahedronGeometry(Math.max(0.7, userRadius));
    const citadel = new THREE.Mesh(citGeom, hullMat);
    group.add(citadel);

    const wingGeom = new THREE.BoxGeometry(userLength, Math.max(0.08, userHeight * 0.12), Math.max(0.8, userDepth * 0.42));
    const wings = new THREE.Mesh(wingGeom, hullMat);
    group.add(wings);

    const orbGeom = new THREE.SphereGeometry(Math.max(0.4, userRadius * 0.55), 16, 16);
    const orb = new THREE.Mesh(orbGeom, glowMat);
    group.add(orb);

    const turretGeom = new THREE.ConeGeometry(Math.max(0.15, userRadius * 0.18), Math.max(0.5, userDepth * 0.25), 6);
    turretGeom.rotateX(-Math.PI / 2);
    const turret1 = new THREE.Mesh(turretGeom, weaponGlowMat);
    turret1.position.set(-userLength * 0.32, userHeight * 0.12, -userDepth * 0.2);
    const turret2 = new THREE.Mesh(turretGeom, weaponGlowMat);
    turret2.position.set(userLength * 0.32, userHeight * 0.12, -userDepth * 0.2);
    group.add(turret1, turret2);
  } else if (modelType === 'singularity_probe') {
    // 3D Spherical Probe with Orbiting Stabilizers using circumference & depth
    const sphereGeom = new THREE.SphereGeometry(userRadius, 16, 16);
    const sphere = new THREE.Mesh(sphereGeom, hullMat);
    group.add(sphere);

    const eyeGeom = new THREE.SphereGeometry(Math.max(0.2, userRadius * 0.5), 12, 12);
    const eye = new THREE.Mesh(eyeGeom, glowMat);
    eye.position.set(0, 0, -userRadius * 0.75);
    group.add(eye);

    const ringGeom = new THREE.TorusGeometry(userRadius * 1.45, Math.max(0.04, userRadius * 0.07), 8, 24);
    const ring = new THREE.Mesh(ringGeom, glowMat);
    group.add(ring);
    group.userData.spinRing = ring;

    const probeEmitter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, Math.max(0.6, userDepth * 0.55), 8), weaponGlowMat);
    probeEmitter.geometry.rotateX(Math.PI / 2);
    probeEmitter.position.set(0, 0, -userRadius - userDepth * 0.25);
    group.add(probeEmitter);
  } else {
    // Scout Drone (Default 3D Mesh) using configured circumference & dimensions
    const hullGeom = new THREE.OctahedronGeometry(userRadius);
    const hull = new THREE.Mesh(hullGeom, hullMat);
    group.add(hull);

    const coreGeom = new THREE.SphereGeometry(Math.max(0.2, userRadius * 0.4), 12, 12);
    const core = new THREE.Mesh(coreGeom, glowMat);
    group.add(core);

    const ringGeom = new THREE.TorusGeometry(userRadius * 1.4, Math.max(0.03, userRadius * 0.06), 6, 24);
    const ring = new THREE.Mesh(ringGeom, glowMat);
    group.add(ring);
    group.userData.spinRing = ring;

    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, Math.max(0.5, userDepth * 0.45), 6), weaponGlowMat);
    gun.geometry.rotateX(Math.PI / 2);
    gun.position.set(0, 0, -userRadius - 0.2);
    group.add(gun);
  }

  // Dynamic point light for atmospheric radiance
  const light = new THREE.PointLight(colorHex, 2.6, 32);
  group.add(light);

  group.userData.config = config;
  group.userData.dimensions = {
    scale: userScale,
    length: userLength,
    height: userHeight,
    depth: userDepth,
    circumference: userCircumference,
    radius: userRadius
  };
  return group;
}

function spawnEnemySwarmFromWormhole(forcedCount = null) {
  if (!state.hasStarted || state.isPaused || state.isGameOver || state.isHyperWarping) return;
  if (!scene || !camera) return;

  const enemyPool = (Array.isArray(window.activeStageEnemies) && window.activeStageEnemies.length > 0)
    ? window.activeStageEnemies
    : (Array.isArray(state.stageEnemies) && state.stageEnemies.length > 0)
      ? state.stageEnemies
      : [
          {
            enemy_id: 'scout_drone',
            enemy_name: 'Void Recon Drone',
            model_3d_type: 'scout_drone',
            scale: 1.0,
            length: 2.8,
            height: 2.8,
            depth: 2.8,
            circumference: 8.8,
            weapon_name: 'Plasma Pulse',
            weapon_damage: 6,
            weapon_speed: 480,
            weapon_color: '#00f0ff',
            hits_to_destroy: 2,
            movement_speed: 260,
            score_value: 100
          }
        ];

  // Swarm size: 5 to 10 enemies per swarm
  const swarmCount = forcedCount || (Math.floor(Math.random() * 6) + 5);
  const swarmId = 'swarm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  for (let idx = 0; idx < swarmCount; idx++) {
    const cfg = enemyPool[idx % enemyPool.length];
    const mesh = create3DEnemyMesh(cfg);

    // Emerge in formation from the mouth/throat of the wormhole (origin 0,0,0, -Z throat)
    const angle = (idx / swarmCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
    const spawnRad = 1.8 + (idx % 3) * 2.2 + Math.random() * 1.5;
    const spawnX = Math.cos(angle) * spawnRad;
    const spawnY = Math.sin(angle) * (spawnRad * 0.75);
    const spawnZ = -6.5 - (idx * 1.6) - Math.random() * 2.5;
    mesh.position.set(spawnX, spawnY, spawnZ);

    // Fly out of wormhole starting small and scaling dynamically up as they travel
    mesh.scale.set(0.1, 0.1, 0.1);

    const userScale = parseFloat(cfg.scale !== undefined && cfg.scale !== null ? cfg.scale : 1.0) || 1.0;
    const isHeavy = cfg.model_3d_type === 'cruiser' || cfg.model_3d_type === 'dreadnought';
    const baseScale = (isHeavy ? (1.55 + Math.random() * 0.35) : (1.3 + Math.random() * 0.3)) * userScale;
    const rawSpeed = parseInt(cfg.movement_speed || cfg.speed || 260);
    const speed = Math.max(34, Math.min(62, rawSpeed * 0.13)); // outward corridor rush speed

    // Target stop distance: 10,000 KM from player (at 420 km/unit = 23.81 units, with slight tactical depth spread)
    const targetStopDist = 23.8 + (Math.random() - 0.5) * 3.6;

    // Scatter angle and spread across viewport display screen
    const scatterAngle = (idx / swarmCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.65;
    const scatterRadius = 8.0 + (idx % 4) * 4.2 + Math.random() * 2.8; // 8 to ~22 units screen span
    const targetScatterX = Math.cos(scatterAngle) * scatterRadius;
    const targetScatterY = Math.sin(scatterAngle) * (scatterRadius * 0.75);

    const hits = parseInt(cfg.hits_to_destroy || cfg.hits || 2);
    const weaponDmg = parseInt(cfg.weapon_damage || cfg.attack_damage || 6);
    const weaponSpeed = parseInt(cfg.weapon_speed || 480);
    const weaponColor = cfg.weapon_color || '#ff0055';
    const fireRate = parseFloat(cfg.fire_rate_seconds || cfg.fire_rate || 2.4);

    const enemyObj = {
      mesh,
      config: cfg,
      swarmId,
      swarmIndex: idx,
      swarmCount,
      spawnPos: new THREE.Vector3(spawnX, spawnY, spawnZ),
      baseScale,
      speed,
      targetStopDist,
      targetScatterX,
      targetScatterY,
      currentHits: hits,
      maxHits: hits,
      weaponDmg,
      weaponSpeed,
      weaponColor,
      fireRate,
      nextShotTime: performance.now() + 1200 + Math.random() * 2200,
      evaFreqX: 1.6 + Math.random() * 1.8,
      evaFreqY: 1.4 + Math.random() * 1.8,
      evaFreqZ: 1.0 + Math.random() * 1.4,
      evaAmpX: 3.2 + Math.random() * 3.2,
      evaAmpY: 2.5 + Math.random() * 2.8,
      evaAmpZ: 1.8 + Math.random() * 2.2,
      evaPhaseX: Math.random() * Math.PI * 2,
      evaPhaseY: Math.random() * Math.PI * 2,
      evaPhaseZ: Math.random() * Math.PI * 2,
      jukeVelocity: new THREE.Vector3(0, 0, 0),
      nextJukeTime: performance.now() + 800 + Math.random() * 1600,
      jukeEndTime: 0,
      scatterRetargetTime: performance.now() + 4500 + Math.random() * 4500,
      phase: 'RUSH_OUT',
      stoppedTime: 0,
      rotSpeedX: (Math.random() - 0.5) * 1.2,
      rotSpeedY: (Math.random() - 0.5) * 1.5
    };

    scene.add(mesh);
    active3DEnemies.push(enemyObj);
  }
}

function spawnEnemyFromWormhole() {
  if (!state.hasStarted || state.isPaused || state.isGameOver) return;
  spawnEnemySwarmFromWormhole();
}

function updateEnemiesCombat(delta) {
  if (!state.hasStarted || state.isPaused || state.isGameOver) return;
  const now = performance.now();
  const playerPos = (state.isXR && cameraRig) ? cameraRig.position : state.position;

  // 1. Spawning check: maintain active 5-10 enemy swarms until stage required kills fulfilled
  if (active3DEnemies.length === 0 && state.stageKills < state.stageRequiredKills + 8) {
    if (now > lastEnemySpawnCheckTime + 600) {
      lastEnemySpawnCheckTime = now;
      spawnEnemySwarmFromWormhole();
    }
  } else if (active3DEnemies.length <= 2 && state.stageKills < state.stageRequiredKills + 8) {
    if (now > lastEnemySpawnCheckTime + 3800) {
      lastEnemySpawnCheckTime = now;
      spawnEnemySwarmFromWormhole();
    }
  }

  // 2. Update active 3D enemies
  for (let i = active3DEnemies.length - 1; i >= 0; i--) {
    const e = active3DEnemies[i];
    const distToPlayer = e.mesh.position.distanceTo(playerPos);

    // Scale dynamically from small (0.1) at wormhole mouth up to baseScale as they traverse corridor
    const distTraveled = e.mesh.position.z - e.spawnPos.z;
    const totalDist = Math.max(30, (playerPos.z - e.targetStopDist) - e.spawnPos.z);
    const progress = Math.max(0, Math.min(1.0, distTraveled / totalDist));
    const curScale = THREE.MathUtils.lerp(0.1, e.baseScale, progress);
    e.mesh.scale.set(curScale, curScale, curScale);

    if (e.phase === 'RUSH_OUT') {
      // Rush out from wormhole mouth along Z axis towards player
      e.mesh.position.z += e.speed * delta;
      e.mesh.position.x += (playerPos.x + e.targetScatterX * 0.25 - e.mesh.position.x) * delta * 0.45;
      e.mesh.position.y += (playerPos.y + e.targetScatterY * 0.25 - e.mesh.position.y) * delta * 0.45;

      // Stop condition: Stop exactly 10,000 km away from the player
      if (distToPlayer <= e.targetStopDist || e.mesh.position.z >= (playerPos.z - e.targetStopDist)) {
        e.phase = 'SCATTER_AND_EVADE';
        e.stoppedTime = now;
      }
    } else {
      // Phase: 'SCATTER_AND_EVADE'
      // 1. Maintain standoff distance 10,000 km away from player along Z
      const desiredZ = playerPos.z - e.targetStopDist;
      e.mesh.position.z += (desiredZ - e.mesh.position.z) * delta * 2.8;

      // 2. Scatter randomly all over the screen (top, bottom, left, right, quadrants)
      const screenTargetX = playerPos.x + e.targetScatterX;
      const screenTargetY = playerPos.y + e.targetScatterY;
      e.mesh.position.x += (screenTargetX - e.mesh.position.x) * delta * 2.4;
      e.mesh.position.y += (screenTargetY - e.mesh.position.y) * delta * 2.4;

      // Periodically re-scatter across screen to keep combat field unpredictable
      if (now > e.scatterRetargetTime) {
        e.scatterRetargetTime = now + 4200 + Math.random() * 4500;
        const newAng = Math.random() * Math.PI * 2;
        const newRad = 7.5 + Math.random() * 16.5;
        e.targetScatterX = Math.cos(newAng) * newRad;
        e.targetScatterY = Math.sin(newAng) * (newRad * 0.75);
      }

      // 3. Random Evasive Maneuvers (Multi-harmonic oscillations so they can't be destroyed the instant they stop)
      const t = (now - e.stoppedTime) * 0.001;
      const evaVx = Math.sin(t * e.evaFreqX + e.evaPhaseX) * e.evaAmpX;
      const evaVy = Math.cos(t * e.evaFreqY + e.evaPhaseY) * e.evaAmpY;
      const evaVz = Math.sin(t * e.evaFreqZ + e.evaPhaseZ) * e.evaAmpZ;
      e.mesh.position.x += evaVx * delta;
      e.mesh.position.y += evaVy * delta;
      e.mesh.position.z += evaVz * delta;

      // 4. Sudden lateral jukes & thruster dodges
      if (now >= e.nextJukeTime) {
        e.nextJukeTime = now + 1200 + Math.random() * 2000;
        e.jukeEndTime = now + 350 + Math.random() * 350;
        e.jukeVelocity.set(
          (Math.random() - 0.5) * 32,
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 8
        );
      }
      if (now < e.jukeEndTime) {
        e.mesh.position.addScaledVector(e.jukeVelocity, delta);
      } else {
        e.jukeVelocity.multiplyScalar(Math.max(0, 1.0 - delta * 4.5));
      }

      // 5. Reactive dodge against incoming player laser bolts
      for (let li = 0; li < laserBolts.length; li++) {
        const lbolt = laserBolts[li];
        const ldist = lbolt.mesh.position.distanceTo(e.mesh.position);
        if (ldist < 6.8) {
          const dodgeDir = new THREE.Vector3().subVectors(e.mesh.position, lbolt.mesh.position);
          dodgeDir.z = 0;
          if (dodgeDir.lengthSq() > 0.001) {
            dodgeDir.normalize();
            e.mesh.position.addScaledVector(dodgeDir, 18.0 * delta);
          }
          break;
        }
      }

      // 6. Dynamic Banking and Attitude Control
      const netVx = (screenTargetX - e.mesh.position.x) * 1.2 + e.jukeVelocity.x;
      const netVy = (screenTargetY - e.mesh.position.y) * 1.2 + e.jukeVelocity.y;
      e.mesh.rotation.z = -THREE.MathUtils.clamp(netVx * 0.05, -0.65, 0.65);
      e.mesh.rotation.x = THREE.MathUtils.clamp(netVy * 0.05, -0.45, 0.45);
      e.mesh.rotation.y = THREE.MathUtils.clamp(-netVx * 0.03, -0.4, 0.4);
      if (e.mesh.userData && e.mesh.userData.spinRing) {
        e.mesh.userData.spinRing.rotation.z += 6.0 * delta;
      }
    }

    // 7. Proximity Detection: Anti-collision avoidance so enemies don't run into each other
    for (let j = 0; j < active3DEnemies.length; j++) {
      if (j === i) continue;
      const other = active3DEnemies[j];
      const sepVec = new THREE.Vector3().subVectors(e.mesh.position, other.mesh.position);
      const sepDist = sepVec.length();
      const minSafeSep = Math.max(5.0, (e.mesh.scale.x + other.mesh.scale.x) * 2.4);
      if (sepDist < minSafeSep && sepDist > 0.01) {
        const overlapFactor = (minSafeSep - sepDist) / minSafeSep;
        const repulse = sepVec.normalize().multiplyScalar(overlapFactor * 16.0 * delta);
        e.mesh.position.add(repulse);
      }
    }

    // Enemy Weapon Firing: when timer expires
    if (now >= e.nextShotTime) {
      e.nextShotTime = now + (e.fireRate * 1000) * (0.85 + Math.random() * 0.5);
      fireEnemyWeaponBolt(e);
    }

    // Despawn safeguard if pushed far behind player (and dispose mesh hierarchy to prevent leaks)
    if (e.mesh.position.z > playerPos.z + 30 || distToPlayer > 400) {
      scene.remove(e.mesh);
      disposeMeshHierarchy(e.mesh);
      active3DEnemies.splice(i, 1);
    }
  }

  // 3. Update Enemy Weapon Beams and Missiles & Test Player Collision
  for (let i = enemyBolts.length - 1; i >= 0; i--) {
    const b = enemyBolts[i];

    // Trajectory movement
    b.mesh.position.addScaledVector(b.direction, b.speed * delta);

    // Dynamic missile weaving / spiral homing
    if (b.type === 'missile') {
      b.spiralTime = (b.spiralTime || 0) + delta * 8.5;
      b.mesh.position.x += Math.sin(b.spiralTime) * 1.5 * delta;
      b.mesh.position.y += Math.cos(b.spiralTime) * 1.5 * delta;
    }
    b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), b.direction);

    // Test collision against player cockpit
    const distToPlayer = b.mesh.position.distanceTo(playerPos);
    if (distToPlayer < 4.8) {
      // Direct enemy weapon impact on player!
      applyDamageToPlayer(b.damage);
      scene.remove(b.mesh);
      if (b.geometryList) b.geometryList.forEach(g => { if (g && g.dispose) g.dispose(); });
      if (b.materialList) b.materialList.forEach(m => { if (m && m.dispose) m.dispose(); });
      if (b.geometry && b.geometry.dispose) b.geometry.dispose();
      if (b.material && b.material.dispose) b.material.dispose();
      disposeMeshHierarchy(b.mesh);
      enemyBolts.splice(i, 1);
      continue;
    }

    // Lifetime expiration or passed far behind player
    if ((now - b.spawnTime) * 0.001 > b.lifetime || b.mesh.position.z > playerPos.z + 30) {
      scene.remove(b.mesh);
      if (b.geometryList) b.geometryList.forEach(g => { if (g && g.dispose) g.dispose(); });
      if (b.materialList) b.materialList.forEach(m => { if (m && m.dispose) m.dispose(); });
      if (b.geometry && b.geometry.dispose) b.geometry.dispose();
      if (b.material && b.material.dispose) b.material.dispose();
      disposeMeshHierarchy(b.mesh);
      enemyBolts.splice(i, 1);
    }
  }

  // 4. Test Player Lasers against 3D Enemy Meshes
  for (let bi = laserBolts.length - 1; bi >= 0; bi--) {
    const bolt = laserBolts[bi];
    let boltConsumed = false;

    for (let ei = active3DEnemies.length - 1; ei >= 0; ei--) {
      const e = active3DEnemies[ei];
      const dims = e.mesh.userData && e.mesh.userData.dimensions;
      const maxDim = dims ? Math.max(dims.length, dims.height, dims.depth, dims.radius * 2) : 3.0;
      const collisionRadius = Math.max(2.8, (e.mesh.scale.x / (dims ? dims.scale : 1.0)) * maxDim * 0.65);
      const dist = bolt.mesh.position.distanceTo(e.mesh.position);

      if (dist < collisionRadius) {
        // Laser impact!
        boltConsumed = true;
        const activeWpn = weaponsSystem.getActiveWeapon();
        const dmgDealt = (activeWpn && activeWpn.damagePerHit) ? activeWpn.damagePerHit : 2;
        e.currentHits -= dmgDealt;

        // Enemy Destroyed
        if (e.currentHits <= 0) {
          const deathPos = e.mesh.position.clone();
          const deathCfg = e.config;
          triggerEnemyExplosion(deathPos, deathCfg);
          scene.remove(e.mesh);
          disposeMeshHierarchy(e.mesh);
          active3DEnemies.splice(ei, 1);

          state.stageKills++;
          const bounty = parseInt(deathCfg.score_value || deathCfg.score || 100);
          state.score += bounty;

          // Check powerup drop on enemy kill (drop_on_enemy_kill, drop_chance_pct, drop_enemy_type)
          if (typeof checkEnemyPowerupDrop === 'function') {
            checkEnemyPowerupDrop(deathCfg, deathPos);
          }

          evaluateWarpReadiness();
          renderStageObjectivesUI();
        } else {
          // Flash enemy hull white briefly
          e.mesh.scale.multiplyScalar(1.15);
        }
        break;
      }
    }

    if (boltConsumed) {
      scene.remove(bolt.mesh);
      if (bolt.geometry) bolt.geometry.dispose();
      if (bolt.material) bolt.material.dispose();
      if (bolt.coreGeom) bolt.coreGeom.dispose();
      if (bolt.coreMat) bolt.coreMat.dispose();
      if (bolt.light) bolt.mesh.remove(bolt.light);
      laserBolts.splice(bi, 1);
    }
  }
}

function fireEnemyWeaponBolt(enemyObj) {
  if (!state.hasStarted || state.isPaused || state.isGameOver || !scene) return;
  const cfg = enemyObj.config || {};
  const wpnName = (cfg.weapon_name || enemyObj.weaponName || '').toLowerCase();
  const modelType = (cfg.model_3d_type || '').toLowerCase();
  const isMissile = /missile|torpedo|disruptor|annihilator|rocket/i.test(wpnName)
    || modelType === 'cruiser'
    || modelType === 'dreadnought'
    || (modelType === 'singularity_probe' && Math.random() > 0.45);

  const spawnOrigin = enemyObj.mesh.position.clone();
  const playerPos = (state.isXR && cameraRig) ? cameraRig.position : state.position;
  const direction = new THREE.Vector3().subVectors(playerPos, spawnOrigin).normalize();
  const weaponBoltColor = enemyObj.weaponColor || '#ff0055';
  const boltColorHex = parseInt(weaponBoltColor.replace('#', '0x'), 16) || 0xff0055;

  let mesh;
  let geometryList = [];
  let materialList = [];
  let boltSpeed;
  let weaponType;

  if (isMissile) {
    weaponType = 'missile';
    // 3D Guided Missile / Torpedo assembly
    const missileGroup = new THREE.Group();

    // Missile Fuselage
    const bodyGeom = new THREE.CylinderGeometry(0.24, 0.4, 2.8, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d34,
      metalness: 0.8,
      roughness: 0.3
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    missileGroup.add(bodyMesh);

    // Warhead Tip (Bright glowing plasma cone)
    const tipGeom = new THREE.ConeGeometry(0.44, 1.1, 8);
    tipGeom.rotateX(-Math.PI / 2);
    tipGeom.translate(0, 0, -1.9);
    const tipMat = new THREE.MeshBasicMaterial({
      color: boltColorHex,
      transparent: true,
      opacity: 0.95
    });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    missileGroup.add(tipMesh);

    // 4 Stabilizer / Steering Fins
    const finGeom = new THREE.BoxGeometry(0.08, 1.4, 0.6);
    finGeom.translate(0, 0, 0.9);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const finH = new THREE.Mesh(finGeom, finMat);
    const finV = new THREE.Mesh(finGeom, finMat);
    finV.rotation.z = Math.PI / 2;
    missileGroup.add(finH, finV);

    // Rocket Exhaust Thruster Plume
    const plumeGeom = new THREE.ConeGeometry(0.34, 1.3, 8);
    plumeGeom.rotateX(Math.PI / 2);
    plumeGeom.translate(0, 0, 2.0);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const plumeMesh = new THREE.Mesh(plumeGeom, plumeMat);
    missileGroup.add(plumeMesh);

    // Radiant point light
    const light = new THREE.PointLight(boltColorHex, 4.0, 32);
    light.position.set(0, 0, 0);
    missileGroup.add(light);

    missileGroup.position.copy(spawnOrigin);
    missileGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    scene.add(missileGroup);
    mesh = missileGroup;

    geometryList = [bodyGeom, tipGeom, finGeom, plumeGeom];
    materialList = [bodyMat, tipMat, finMat, plumeMat];

    // Visible flight speed: travels across ~24 units in ~1.0 second
    boltSpeed = Math.max(22, Math.min(34, (enemyObj.weaponSpeed || 480) * 0.065));

    if (audioMgr && typeof audioMgr.playEnemyMissile === 'function') {
      audioMgr.playEnemyMissile();
    } else if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  } else {
    weaponType = 'beam';
    // High-Intensity Dual-Layer Laser Beam
    const beamGroup = new THREE.Group();

    // Outer Glowing Plasma Sheath
    const sheathGeom = new THREE.CylinderGeometry(0.44, 0.58, 8.2, 8);
    sheathGeom.rotateX(Math.PI / 2);
    const sheathMat = new THREE.MeshBasicMaterial({
      color: boltColorHex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    const sheathMesh = new THREE.Mesh(sheathGeom, sheathMat);
    beamGroup.add(sheathMesh);

    // Inner White-Hot Laser Core
    const coreGeom = new THREE.CylinderGeometry(0.18, 0.28, 7.5, 8);
    coreGeom.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.96
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    beamGroup.add(coreMesh);

    // Radiant point light
    const light = new THREE.PointLight(boltColorHex, 4.0, 36);
    light.position.set(0, 0, 0);
    beamGroup.add(light);

    beamGroup.position.copy(spawnOrigin);
    beamGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    scene.add(beamGroup);
    mesh = beamGroup;

    geometryList = [sheathGeom, coreGeom];
    materialList = [sheathMat, coreMat];

    // Visible flight speed: travels across ~24 units in ~0.8 second
    boltSpeed = Math.max(28, Math.min(42, (enemyObj.weaponSpeed || 480) * 0.075));

    if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  }

  enemyBolts.push({
    mesh,
    geometryList,
    materialList,
    direction,
    speed: boltSpeed,
    damage: enemyObj.weaponDmg || 6,
    type: weaponType,
    spiralTime: Math.random() * Math.PI * 2,
    spawnTime: performance.now(),
    lifetime: 4.8
  });
}

function applyDamageToPlayer(rawDamage) {
  if (!state.hasStarted || state.isHyperWarping || state.isInvulnerable || state.isGameOver) return;
  const dmg = rawDamage || 8;

  // Requirement: Health does NOT deplete until the shield reaches 0%.
  // Deflector shield absorbs 100% of incoming damage first.
  if (state.playerShield > 0) {
    if (state.playerShield >= dmg) {
      state.playerShield -= dmg;
    } else {
      const leftover = dmg - state.playerShield;
      state.playerShield = 0;
      state.playerHealth = Math.max(0, state.playerHealth - leftover);
    }
  } else {
    // Shield is depleted (0%): Direct hull damage depletes health
    state.playerHealth = Math.max(0, state.playerHealth - dmg);
  }

  // Red damage vignette hit flash
  const vignette = document.getElementById('damage-vignette');
  if (vignette) {
    vignette.style.opacity = '0.88';
    setTimeout(() => {
      vignette.style.opacity = '0';
    }, 180);
  }

  // Make the shield and health appear for one second each time the player takes a hit
  showShieldAndHealthOnHit(1000);

  // Cockpit camera shudder
  state.position.x += (Math.random() - 0.5) * 0.35;
  state.position.y += (Math.random() - 0.5) * 0.35;

  if (audioMgr && typeof audioMgr.playHit === 'function') {
    audioMgr.playHit();
  }

  updatePlayerDefenseHUD();

  // Requirement: if health energy is below 99% then uncollected shield powerups automatically disappear,
  // and if shield energy is above 1% then uncollected health powerups automatically disappear.
  if (typeof pruneUncollectedPowerupsByEnergyState === 'function') {
    pruneUncollectedPowerupsByEnergyState();
  }

  // Requirement: Game over when health reaches 0% with option to restart
  if (state.playerHealth <= 0) {
    triggerGameOver();
  }
}

function triggerGameOver() {
  if (state.isGameOver) return;
  state.isGameOver = true;
  state.playerHealth = 0;
  state.playerShield = 0;
  updatePlayerDefenseHUD();

  // Requirement: when the game is over any remaining enemies should be cleaned up and stop firing
  despawnAllActiveEnemies();
  despawnAllActivePowerups();

  // Clean up all active player laser bolts to prevent lingering effects and memory leaks
  for (let i = laserBolts.length - 1; i >= 0; i--) {
    const bolt = laserBolts[i];
    if (bolt && bolt.mesh && scene) {
      scene.remove(bolt.mesh);
      if (bolt.geometry) bolt.geometry.dispose();
      if (bolt.material) bolt.material.dispose();
      if (bolt.coreGeom) bolt.coreGeom.dispose();
      if (bolt.coreMat) bolt.coreMat.dispose();
      if (bolt.light) bolt.mesh.remove(bolt.light);
    }
    laserBolts.splice(i, 1);
  }

  // Requirement: when the game over screen appears if the crosshair has captured the mouse pointer automatically un capture it
  if (document.pointerLockElement) {
    try {
      document.exitPointerLock();
    } catch (e) {}
  }
  state.isPointerLocked = false;
  state.isLeftMouseDown = false;
  state.isRightMouseDown = false;
  state.isMouseDown = false;
  state.aimActive = false;

  const mouseLockBtn = document.getElementById('btn-mouse-lock');
  if (mouseLockBtn) {
    mouseLockBtn.classList.remove('active');
    mouseLockBtn.textContent = '🎯 Capture Crosshair';
  }

  // Show Game Over modal overlay
  const modal = document.getElementById('game-over-modal');
  if (modal) {
    const scoreEl = document.getElementById('game-over-score');
    const stageEl = document.getElementById('game-over-stage');
    const killsEl = document.getElementById('game-over-kills');
    if (scoreEl) scoreEl.textContent = state.score.toLocaleString();
    if (stageEl) stageEl.textContent = `Stage ${currentActiveStage}`;
    if (killsEl) killsEl.textContent = String(state.totalKills ? state.totalKills + state.stageKills : state.stageKills);
    modal.style.display = 'flex';
  }

  if (audioMgr && typeof audioMgr.playOverheatAlert === 'function') {
    audioMgr.playOverheatAlert();
  }
}

let countdownTimerInterval = null;

/**
 * Handles Game Start & Restart countdown sequencing:
 * 1. Dismisses the beginning splash screen immediately.
 * 2. If phone is in portrait mode, displays the fullscreen rotate phone screen and waits for rotation to landscape.
 * 3. Once rotated to landscape (or if already in landscape), launches the 5-second countdown timer before engaging gameplay.
 */
function startCountdownAndLaunchGame(isRestart = false) {
  if (countdownTimerInterval) {
    clearInterval(countdownTimerInterval);
    countdownTimerInterval = null;
  }

  // Pre-countdown state normalization
  state.isPaused = false;
  state.isGameOver = false;
  state.hasStarted = false;
  document.body.classList.remove('game-paused');
  document.body.classList.remove('game-in-flight');
  const btnQuickPause = document.getElementById('btn-quick-pause');
  if (btnQuickPause) btnQuickPause.classList.remove('is-paused');

  // Dismiss beginning splash screen immediately so it doesn't block the rotate prompt or game
  const splashEl = document.getElementById('wormhole-splash-screen');
  if (splashEl && splashEl.parentNode) {
    splashEl.classList.add('splash-fade-out');
    setTimeout(() => {
      if (splashEl.parentNode) splashEl.remove();
    }, 400);
  }

  // Determine if on mobile/touch device in portrait mode
  const isPortraitMobile = isDeviceInPortrait() && (
    /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (window.innerWidth < window.innerHeight)
  );

  const rotatePrompt = document.getElementById('landscape-rotate-prompt');

  if (isPortraitMobile) {
    // Display the rotate phone screen
    if (rotatePrompt) {
      rotatePrompt.classList.remove('dismissed');
      rotatePrompt.classList.add('active');
      rotatePrompt.style.display = 'flex';
    }
    document.body.classList.remove('portrait-dismissed');

    let hasLaunched = false;
    const launchAfterRotate = () => {
      if (hasLaunched) return;
      hasLaunched = true;

      window.removeEventListener('resize', checkOrientationWithDelays);
      window.removeEventListener('orientationchange', checkOrientationWithDelays);
      if (screen.orientation && typeof screen.orientation.removeEventListener === 'function') {
        screen.orientation.removeEventListener('change', checkOrientationWithDelays);
      }

      if (rotatePrompt) {
        rotatePrompt.classList.remove('active');
        rotatePrompt.classList.add('dismissed');
        rotatePrompt.style.display = 'none';
      }
      document.body.classList.add('portrait-dismissed');

      // Start the 5-second mission countdown timer after rotating to landscape
      executeMissionCountdown(isRestart);
    };

    const checkOrientation = () => {
      if (isDeviceInLandscape()) {
        launchAfterRotate();
      }
    };

    const checkOrientationWithDelays = () => {
      checkOrientation();
      setTimeout(checkOrientation, 100);
      setTimeout(checkOrientation, 250);
      setTimeout(checkOrientation, 500);
    };

    window.addEventListener('resize', checkOrientationWithDelays);
    window.addEventListener('orientationchange', checkOrientationWithDelays);
    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
      screen.orientation.addEventListener('change', checkOrientationWithDelays);
    }

    // If player taps 'Continue in Portrait' or 'X', dismiss prompt and start 5-second countdown
    const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
    const btnCloseRotateTop = document.getElementById('btn-close-rotate-top');
    if (btnDismissRotate) {
      btnDismissRotate.onclick = (e) => {
        if (e) e.preventDefault();
        launchAfterRotate();
      };
    }
    if (btnCloseRotateTop) {
      btnCloseRotateTop.onclick = (e) => {
        if (e) e.preventDefault();
        launchAfterRotate();
      };
    }
    return;
  }

  // If already in landscape or on desktop, proceed directly to 5-second countdown
  executeMissionCountdown(isRestart);
}

function executeMissionCountdown(isRestart = false) {
  state.isCountdownActive = true;
  state.hasStarted = false; // Enemies and flight hold until countdown concludes
  state.lastFrameTime = performance.now();

  // Dismiss splash screen if active
  const splashEl = document.getElementById('wormhole-splash-screen');
  if (splashEl && splashEl.parentNode) {
    splashEl.classList.add('splash-fade-out');
    setTimeout(() => {
      if (splashEl.parentNode) splashEl.remove();
    }, 750);
  }

  if (audioMgr && !audioMgr.isInitialized) {
    try { audioMgr.init(); } catch (e) {}
  }
  lockLandscape();
  requestDeviceOrientation();
  centerWormholeOnScreen(true);

  const countdownOverlay = document.getElementById('game-countdown-overlay');
  const countdownText = document.getElementById('countdown-text-num');
  const ringBar = document.getElementById('countdown-ring-bar');
  const headerLabel = document.getElementById('countdown-header-label');
  const tipLabel = document.getElementById('countdown-tip-label');

  if (countdownOverlay) {
    countdownOverlay.classList.add('active');
  }

  let remaining = 5;
  const totalSeconds = 5;
  const circumference = 408;

  const updateCountdownDisplay = () => {
    if (countdownText) {
      countdownText.textContent = remaining > 0 ? String(remaining) : 'GO!';
    }
    if (ringBar) {
      const progress = (totalSeconds - remaining) / totalSeconds;
      ringBar.style.strokeDashoffset = String(circumference * (1 - progress));
    }
    if (headerLabel) {
      headerLabel.textContent = isRestart ? 'MISSION RE-ENGAGEMENT' : 'MISSION LAUNCH IMMINENT';
    }
    if (tipLabel) {
      tipLabel.textContent = remaining > 2 ? 'CALIBRATING QUANTUM CORE' : 'ENGAGING THRUSTERS';
    }

    if (audioMgr && typeof audioMgr.playLaserBolt === 'function') {
      try { audioMgr.playLaserBolt(); } catch (e) {}
    }
  };

  updateCountdownDisplay();

  countdownTimerInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      updateCountdownDisplay();
    } else if (remaining === 0) {
      updateCountdownDisplay();
      setTimeout(() => {
        clearInterval(countdownTimerInterval);
        countdownTimerInterval = null;
        if (countdownOverlay) {
          countdownOverlay.classList.remove('active');
        }
        state.isCountdownActive = false;
        state.hasStarted = true;
        document.body.classList.add('game-in-flight');
        state.lastFrameTime = performance.now();
        centerWormholeOnScreen(true);
      }, 500);
    }
  }, 1000);
}

function restartGame() {
  const modal = document.getElementById('game-over-modal');
  if (modal) modal.style.display = 'none';

  // Completely reset pause & game over states across entire game
  state.isGameOver = false;
  state.isPaused = false;
  state.hasStarted = false;
  state.isCountdownActive = false;
  document.body.classList.remove('game-paused');
  document.body.classList.remove('game-in-flight');
  const btnQuickPause = document.getElementById('btn-quick-pause');
  if (btnQuickPause) btnQuickPause.classList.remove('is-paused');

  // Reset desktop keyboard and mouse capture states
  state.keys = {};
  state.isPointerLocked = false;
  state.isLeftMouseDown = false;
  state.isRightMouseDown = false;
  state.isMouseDown = false;
  state.aimActive = false;
  const mouseLockBtn = document.getElementById('btn-mouse-lock');
  if (mouseLockBtn) {
    mouseLockBtn.classList.remove('active');
    mouseLockBtn.textContent = '🎯 Capture Crosshair';
  }

  // Reset mobile touch controls & virtual sticks
  state.touchActive = false;
  state.touchMove = { x: 0, y: 0 };
  state.aimMove = { x: 0, y: 0 };
  flightTouchId = null;
  aimTouchId = null;
  touchLookPitch = 0;
  touchLookYaw = 0;
  const flightKnob = document.getElementById('flight-stick-knob');
  if (flightKnob) flightKnob.style.transform = 'translate(-50%, -50%)';
  const aimKnob = document.getElementById('aim-stick-knob');
  if (aimKnob) aimKnob.style.transform = 'translate(-50%, -50%)';

  // Reset player stats
  state.playerShield = 100;
  state.playerHealth = 100;
  state.score = 0;
  state.stageKills = 0;
  state.isWarpReady = false;
  state.isHyperWarping = false;
  state.distance = 0;

  // Reset vessel position to safe distance away from wormhole singularity
  const respawnDistance = CONFIG.wormholeDistance || 220;
  state.position.set(0, 0, respawnDistance);
  if (!state.isXR && camera) {
    camera.position.set(0, 0, respawnDistance);
    camera.rotation.set(0, 0, 0);
  } else if (cameraRig) {
    cameraRig.position.set(0, 0, respawnDistance);
    cameraRig.rotation.set(0, 0, 0);
  }
  state.velocity.set(0, 0, 0);
  state.pitch = 0;
  state.yaw = 0;
  state.roll = 0;
  stopThrottle();

  // Despawn combat entities
  despawnAllActiveEnemies();
  despawnAllActivePowerups();
  if (typeof triggeredPowerupEventSet !== 'undefined') {
    triggeredPowerupEventSet.clear();
  }

  // Reset to Stage 1 and re-sync
  currentActiveStage = 1;
  syncGameManagerFromDatabase(1, currentActiveDeviceType);

  updatePlayerDefenseHUD();
  renderStageObjectivesUI();
  centerWormholeOnScreen(true);

  // Reset frame timestamp to prevent delta time explosion
  state.lastFrameTime = performance.now();

  // Launch the 5-second countdown to prepare the player before hostiles spawn
  startCountdownAndLaunchGame(true);
}

function quitGame() {
  window.location.href = 'https://calmchessgames.com';
}

function triggerEnemyExplosion(position, config) {
  if (!scene) return;
  const colorHex = parseInt((config.color_hex || config.color || '#00f0ff').replace('#', '0x'), 16) || 0x00f0ff;

  const count = 40;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 45,
      (Math.random() - 0.5) * 45,
      (Math.random() - 0.5) * 45
    ));
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: colorHex,
    size: 2.2,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geom, mat);
  scene.add(points);

  const startTime = performance.now();
  const interval = setInterval(() => {
    const elapsed = (performance.now() - startTime) * 0.001;
    const posAttr = points.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += velocities[i].x * 0.04;
      posAttr.array[i * 3 + 1] += velocities[i].y * 0.04;
      posAttr.array[i * 3 + 2] += velocities[i].z * 0.04;
    }
    posAttr.needsUpdate = true;
    points.material.opacity = Math.max(0, 1.0 - elapsed * 1.6);

    if (elapsed > 0.65) {
      clearInterval(interval);
      scene.remove(points);
      geom.dispose();
      mat.dispose();
    }
  }, 25);

  if (audioMgr && typeof audioMgr.playExplosion === 'function') {
    audioMgr.playExplosion();
  }
}

function updatePlayerDefenseHUD() {
  const shieldPct = Math.round(state.playerShield);
  const healthPct = Math.round(state.playerHealth);

  const shieldFill = document.getElementById('hud-shield-fill');
  const shieldText = document.getElementById('hud-shield-text');
  if (shieldFill) {
    shieldFill.style.width = `${shieldPct}%`;
    shieldFill.style.background = 'linear-gradient(90deg, #0088ff, #00f0ff)';
    shieldFill.style.boxShadow = '0 0 8px #00f0ff';
  }
  if (shieldText) shieldText.textContent = `${shieldPct}%`;

  const healthFill = document.getElementById('hud-health-fill');
  const healthText = document.getElementById('hud-health-text');
  const healthTitle = document.getElementById('hud-health-title');
  if (healthFill) {
    healthFill.style.width = `${healthPct}%`;
    if (healthPct < 30) {
      healthFill.style.background = 'linear-gradient(90deg, #ef476f, #ff6b8b)';
      healthFill.style.boxShadow = '0 0 10px #ef476f';
      if (healthTitle) {
        healthTitle.textContent = 'CRITICAL';
        healthTitle.style.color = '#ef476f';
      }
      if (healthText) healthText.style.color = '#ef476f';
    } else {
      // Orange-ish yellow health indicator
      healthFill.style.background = 'linear-gradient(90deg, #d97706, #fbbf24)';
      healthFill.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.75)';
      if (healthTitle) {
        healthTitle.textContent = 'HEALTH';
        healthTitle.style.color = '#f59e0b';
      }
      if (healthText) healthText.style.color = '#fbbf24';
    }
  }
  if (healthText) healthText.textContent = `${healthPct}%`;

  const telemShield = document.getElementById('telemetry-shield-val');
  if (telemShield) telemShield.textContent = `${shieldPct}%`;
  const telemHealth = document.getElementById('telemetry-health-val');
  if (telemHealth) telemHealth.textContent = `${healthPct}%`;
  const telemKills = document.getElementById('telemetry-kills-val');
  if (telemKills) telemKills.textContent = `${state.stageKills} / ${state.stageRequiredKills}`;
}

// =============================================================================
// DYNAMIC DECOUPLED STAGE OBJECTIVES ENGINE
// =============================================================================
function renderStageObjectivesUI() {
  const heading = document.getElementById('stage-objectives-heading');
  const progressBadge = document.getElementById('obj-total-progress');
  const briefingBox = document.getElementById('stage-mission-briefing');
  const listContainer = document.getElementById('stage-objectives-list');
  const authStatusText = document.getElementById('warp-auth-status-text');
  const authBox = document.getElementById('warp-gate-authorization-box');
  if (!listContainer) return;

  const stageName = (STAGE_REGISTRY[currentActiveStage] && STAGE_REGISTRY[currentActiveStage].name) || `Stage ${currentActiveStage}`;
  if (heading) heading.textContent = `🎯 STAGE ${currentActiveStage}: ${stageName.toUpperCase()} OBJECTIVES`;

  const briefing = state.stageMissionBriefing || `Neutralize ${state.stageRequiredKills} hostile units and close within < ${state.stageTargetDistance.toLocaleString()} KM of wormhole singularity to authorize jump gate.`;
  if (briefingBox) briefingBox.textContent = briefing;

  const distKm = Math.round((state.position.length() / CONFIG.wormholeDistance) * 100000);
  const killsProgress = Math.min(1.0, state.stageKills / Math.max(1, state.stageRequiredKills));
  const distProgress = distKm <= state.stageTargetDistance ? 1.0 : Math.max(0, 1.0 - (distKm - state.stageTargetDistance) / 100000);

  const killsCompleted = state.stageKills >= state.stageRequiredKills;
  const distCompleted = distKm <= state.stageTargetDistance;

  let totalObjectives = 2;
  let completedObjectives = (killsCompleted ? 1 : 0) + (distCompleted ? 1 : 0);

  let html = `
    <!-- Objective: Neutralize Hostiles -->
    <div class="objective-item ${killsCompleted ? 'completed' : ''}" id="obj-kills">
      <div class="obj-header">
        <span>1. Destroy ${state.stageRequiredKills} Hostile Units</span>
        <span class="obj-status" style="color:${killsCompleted ? '#10b981' : '#f59e0b'}; font-weight:bold;">${killsCompleted ? '✓ COMPLETED' : `${state.stageKills} / ${state.stageRequiredKills} KILLS`}</span>
      </div>
      <div class="obj-bar-wrap">
        <div class="obj-bar" style="width:${Math.round(killsProgress * 100)}%; background:${killsCompleted ? '#10b981' : '#f59e0b'};"></div>
      </div>
      <div style="font-size:0.64rem; color:var(--text-dim); margin-top:2px;">
        Shoot down 3D enemies emerging from the wormhole with ship lasers.
      </div>
    </div>

    <!-- Objective: Proximity to Wormhole -->
    <div class="objective-item ${distCompleted ? 'completed' : ''}" id="obj-distance">
      <div class="obj-header">
        <span>2. Wormhole Proximity &lt; ${state.stageTargetDistance.toLocaleString()} KM</span>
        <span class="obj-status" style="color:${distCompleted ? '#10b981' : '#00f0ff'}; font-weight:bold;">${distCompleted ? '✓ IN RANGE' : `${distKm.toLocaleString()} KM`}</span>
      </div>
      <div class="obj-bar-wrap">
        <div class="obj-bar" style="width:${Math.round(distProgress * 100)}%; background:${distCompleted ? '#10b981' : '#00f0ff'};"></div>
      </div>
      <div style="font-size:0.64rem; color:var(--text-dim); margin-top:2px;">
        Fly toward cyan singularity core (<span class="kbd">WASD</span> / Throttle slider).
      </div>
    </div>
  `;

  // Stage 1 Extra Objectives (Scan & Coils)
  if (currentActiveStage === 1) {
    totalObjectives += 2;
    const scanCompleted = state.scanProgress >= 1.0;
    const calibratedCoilsCount = state.coils.filter(c => c).length;
    const coilsCompleted = calibratedCoilsCount === 3;
    if (scanCompleted) completedObjectives++;
    if (coilsCompleted) completedObjectives++;

    html += `
      <!-- Objective 3: Resonance Scanner -->
      <div class="objective-item ${scanCompleted ? 'completed' : ''}" id="obj-scan">
        <div class="obj-header">
          <span>3. Singularity Harmonic Scan</span>
          <span class="obj-status" id="status-scan" style="color:${scanCompleted ? '#10b981' : 'var(--cyan-neon)'}; font-weight:bold;">${scanCompleted ? '✓ LOCKED (432.8 THz)' : 'PENDING'}</span>
        </div>
        <div class="obj-bar-wrap">
          <div class="obj-bar" id="bar-scan" style="width:${Math.round(state.scanProgress * 100)}%;"></div>
        </div>
        <div class="obj-actions" style="margin-top:4px;">
          <button class="btn-action" id="btn-do-scan" ${scanCompleted ? 'disabled style="background:#10b981; color:#000;"' : ''}>${scanCompleted ? '✓ Scanned' : '📡 Scan Singularity'}</button>
        </div>
      </div>

      <!-- Objective 4: Tachyon Warp Coils -->
      <div class="objective-item ${coilsCompleted ? 'completed' : ''}" id="obj-coils">
        <div class="obj-header">
          <span>4. Tachyon Warp Coils Calibration</span>
          <span class="obj-status" id="status-coils" style="color:${coilsCompleted ? '#10b981' : 'var(--cyan-neon)'}; font-weight:bold;">${coilsCompleted ? '✓ 3/3 SYNCHRONIZED' : `${calibratedCoilsCount}/3 CALIBRATED`}</span>
        </div>
        <div class="obj-bar-wrap">
          <div class="obj-bar" id="bar-coils" style="width:${Math.round((calibratedCoilsCount / 3) * 100)}%;"></div>
        </div>
        <div class="obj-actions" style="margin-top:4px; display:flex; gap:4px;">
          <button class="btn-action" id="btn-coil-1" ${state.coils[0] ? 'disabled style="background:#10b981; color:#000;"' : ''}>Coil α</button>
          <button class="btn-action" id="btn-coil-2" ${state.coils[1] ? 'disabled style="background:#10b981; color:#000;"' : ''}>Coil β</button>
          <button class="btn-action" id="btn-coil-3" ${state.coils[2] ? 'disabled style="background:#10b981; color:#000;"' : ''}>Coil γ</button>
        </div>
      </div>
    `;
  }

  listContainer.innerHTML = html;
  if (progressBadge) progressBadge.textContent = `${completedObjectives}/${totalObjectives} COMPLETE`;

  // Attach Stage 1 scan & coil listeners dynamically if elements exist
  const scanBtn = document.getElementById('btn-do-scan');
  if (scanBtn && !scanBtn.dataset.bound) {
    scanBtn.dataset.bound = 'true';
    scanBtn.addEventListener('click', () => {
      if (state.isScanning || state.scanProgress >= 1.0) return;
      if (audioMgr) { audioMgr.init(); audioMgr.playScan(); }
      state.isScanning = true;
      scanBtn.disabled = true;
      scanBtn.textContent = 'Scanning...';
      let p = 0;
      const interval = setInterval(() => {
        p += 0.08;
        state.scanProgress = Math.min(1.0, p);
        const bar = document.getElementById('bar-scan');
        if (bar) bar.style.width = `${Math.round(state.scanProgress * 100)}%`;
        if (state.scanProgress >= 1.0) {
          clearInterval(interval);
          state.isScanning = false;
          evaluateWarpReadiness();
          renderStageObjectivesUI();
        }
      }, 100);
    });
  }

  [1, 2, 3].forEach(idx => {
    const cBtn = document.getElementById(`btn-coil-${idx}`);
    if (cBtn && !cBtn.dataset.bound) {
      cBtn.dataset.bound = 'true';
      cBtn.addEventListener('click', () => {
        if (audioMgr) { audioMgr.init(); audioMgr.playCoil(); }
        state.coils[idx - 1] = true;
        evaluateWarpReadiness();
        renderStageObjectivesUI();
      });
    }
  });

  if (authStatusText && authBox) {
    if (state.isWarpReady) {
      authBox.style.background = 'rgba(16,185,129,0.18)';
      authBox.style.borderColor = '#10b981';
      authStatusText.style.color = '#10b981';
      authStatusText.textContent = '✅ HYPER-WARP GATE AUTHORIZED: READY FOR JUMP!';
    } else {
      authBox.style.background = 'rgba(239,68,111,0.12)';
      authBox.style.borderColor = 'rgba(239,68,111,0.4)';
      authStatusText.style.color = '#ff6b8b';
      authStatusText.textContent = '⛔ HYPER-WARP LOCKED: OBJECTIVES INCOMPLETE';
    }
  }
}

function evaluateWarpReadiness() {
  const distKm = Math.round((state.position.length() / CONFIG.wormholeDistance) * 100000);
  const killsMet = state.stageKills >= state.stageRequiredKills;
  const distMet = distKm <= state.stageTargetDistance;
  const stage1ExtraMet = (currentActiveStage !== 1) || (state.scanProgress >= 1.0 && state.coils.every(c => c));

  const isReady = killsMet && distMet && stage1ExtraMet;
  state.isWarpReady = isReady;

  if (warpBtn) {
    if (isReady) {
      warpBtn.classList.add('btn-ready');
      warpBtn.innerHTML = '⚡ ENGAGE WARP JUMP [F]';
      warpBtn.style.boxShadow = '0 0 18px rgba(16,185,129,0.85)';
      warpBtn.style.borderColor = '#10b981';
    } else {
      warpBtn.classList.remove('btn-ready');
      warpBtn.innerHTML = '🚀 Engage Warp';
      warpBtn.style.boxShadow = '';
      warpBtn.style.borderColor = '';
    }
  }
}

function triggerWarpJump() {
  if (state.isPaused || state.isHyperWarping) return;
  if (audioMgr) audioMgr.init();

  const distKm = Math.round((state.position.length() / CONFIG.wormholeDistance) * 100000);
  evaluateWarpReadiness();

  if (!state.isWarpReady) {
    const missing = [];
    if (state.stageKills < state.stageRequiredKills) {
      missing.push(`${state.stageRequiredKills - state.stageKills} MORE KILLS`);
    }
    if (distKm > state.stageTargetDistance) {
      missing.push(`APPROACH < ${state.stageTargetDistance.toLocaleString()} KM (CURRENT: ${distKm.toLocaleString()} KM)`);
    }
    if (currentActiveStage === 1) {
      if (state.scanProgress < 1.0) missing.push('RESONANCE SCAN');
      if (!state.coils.every(c => c)) missing.push('3 COILS CALIBRATION');
    }
    showToast('WARP UNAVAILABLE', 2500);
    return;
  }

  // Objectives satisfied: Authorize and launch hyper-warp jump sequence!
  state.isHyperWarping = true;
  if (audioMgr && typeof audioMgr.playWarp === 'function') {
    audioMgr.playWarp();
  }

  renderStageObjectivesUI();
}

async function syncStagesDropdownFromDatabase(showNotification = false) {
  const jumpSelect = document.getElementById('select-stage-jump');
  if (!jumpSelect) return;

  try {
    const res = await fetch('https://api.calmchessgames.com/admin/wormhole_device_api.php?action=get_game_stages');
    const json = await res.json();
    if (json && json.success && Array.isArray(json.stages) && json.stages.length > 0) {
      const activeStages = json.stages.filter(s => parseInt(s.is_enabled) === 1);
      const stageList = activeStages.length > 0 ? activeStages : json.stages;

      const currentVal = jumpSelect.value;
      jumpSelect.innerHTML = stageList.map(s => {
        const lvl = parseInt(s.stage_level) || 1;
        const icon = lvl === 1 ? '🚀' : (lvl === 2 ? '🌌' : (lvl === 3 ? '🕳️' : '⚛️'));
        return `<option value="${lvl}">${icon} Stage ${lvl}: ${s.stage_name}</option>`;
      }).join('');

      jumpSelect.value = currentVal;
    }
  } catch (err) {
    console.warn('[Wormhole XR] Sync stages error:', err);
  }
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

// Crosshair Speed Slider (Adjusts Crosshair Aim Speed, Default 4.0x, Max 10.0x)
const crosshairSpeedSlider = document.getElementById('slider-crosshair-speed');
const crosshairSpeedValDisplay = document.getElementById('val-crosshair-speed');
const crosshairSpeedSliderBottom = document.getElementById('slider-crosshair-speed-bottom');
const crosshairSpeedValDisplayBottom = document.getElementById('val-crosshair-speed-bottom');

function updateCrosshairSpeedMultiplier(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return;
  state.crosshairSpeedMultiplier = num;
  if (typeof snapGrid !== 'undefined') {
    snapGrid.pauseDuration = calculateSnapPauseDuration(num);
  }
  const formatted = num.toFixed(1) + 'x';
  if (crosshairSpeedSlider && crosshairSpeedSlider.value !== String(num)) crosshairSpeedSlider.value = num;
  if (crosshairSpeedValDisplay) crosshairSpeedValDisplay.textContent = formatted;
  if (crosshairSpeedSliderBottom && crosshairSpeedSliderBottom.value !== String(num)) crosshairSpeedSliderBottom.value = num;
  if (crosshairSpeedValDisplayBottom) crosshairSpeedValDisplayBottom.textContent = formatted;
}

if (crosshairSpeedSlider) {
  crosshairSpeedSlider.addEventListener('input', (e) => {
    updateCrosshairSpeedMultiplier(e.target.value);
  });
  crosshairSpeedSlider.addEventListener('change', (e) => {
    updateCrosshairSpeedMultiplier(e.target.value);
  });
}
if (crosshairSpeedSliderBottom) {
  crosshairSpeedSliderBottom.addEventListener('input', (e) => {
    updateCrosshairSpeedMultiplier(e.target.value);
  });
  crosshairSpeedSliderBottom.addEventListener('change', (e) => {
    updateCrosshairSpeedMultiplier(e.target.value);
  });
}

// Initialize crosshair speed sliders
updateCrosshairSpeedMultiplier(state.crosshairSpeedMultiplier || 4.00);

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

// Target Grid Visibility Toggle
const chkShowGridBottom = document.getElementById('chk-show-grid-bottom');
if (chkShowGridBottom) {
  chkShowGridBottom.addEventListener('change', (e) => {
    setShowTargetGrid(e.target.checked);
  });
}
document.querySelectorAll('.chk-show-grid').forEach(chk => {
  chk.addEventListener('change', (e) => {
    setShowTargetGrid(e.target.checked);
  });
});

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
    if (state.isXR && renderer.xr && renderer.xr.isPresenting) {
      const xrOutputTarget = renderer.getRenderTarget();
      const xrCam = renderer.xr.getCamera();
      const subCameras = (xrCam && Array.isArray(xrCam.cameras) && xrCam.cameras.length > 0)
        ? xrCam.cameras.filter(c => c && c.viewport && c.viewport.width > 0 && c.viewport.height > 0)
        : [];

      if (xrOutputTarget && subCameras.length > 0) {
        const prevXrEnabled = renderer.xr.enabled;
        const prevAutoClear = renderer.autoClear;
        renderer.xr.enabled = false;
        try {
          for (let i = 0; i < subCameras.length; i++) {
            const subCam = subCameras[i];
            subCam.matrixWorldAutoUpdate = false;
            const vp = subCam.viewport;
            const vpW = Math.max(1, Math.floor(vp.width));
            const vpH = Math.max(1, Math.floor(vp.height));

            if (sceneRenderTarget.width !== vpW || sceneRenderTarget.height !== vpH) {
              sceneRenderTarget.setSize(vpW, vpH);
              const halfW = Math.max(128, Math.floor(vpW * 0.5));
              const halfH = Math.max(128, Math.floor(vpH * 0.5));
              renderTargetA.setSize(halfW, halfH);
              renderTargetB.setSize(halfW, halfH);
              blurShader.uniforms.uResolution.value.set(halfW, halfH);
            }

            tempVec.set(0, 0, 0);
            tempVec.project(subCam);
            const isBehind = tempVec.z > 1.0 ? 1.0 : 0.0;
            wormholeScreenVec.x = (tempVec.x * 0.5) + 0.5;
            wormholeScreenVec.y = (tempVec.y * 0.5) + 0.5;

            compositeShader.uniforms.uWormholeScreenPos.value.copy(wormholeScreenVec);
            compositeShader.uniforms.uIsBehind.value = isBehind;
            compositeShader.uniforms.uAspect.value = vpW / vpH;

            renderer.autoClear = true;
            renderer.setScissorTest(false);
            renderer.setRenderTarget(sceneRenderTarget);
            renderer.setViewport(0, 0, vpW, vpH);
            renderer.render(scene, subCam);

            highPassMaterial.uniforms.tDiffuse.value = sceneRenderTarget.texture;
            highPassMaterial.uniforms.uThreshold.value = CONFIG.bloomThreshold;
            postScene.clear();
            postScene.add(highPassQuad);
            renderer.setRenderTarget(renderTargetA);
            renderer.setViewport(0, 0, renderTargetA.width, renderTargetA.height);
            renderer.render(postScene, postCamera);

            blurMaterial.uniforms.tDiffuse.value = renderTargetA.texture;
            blurMaterial.uniforms.uDirection.value.set(1.0, 0.0);
            blurMaterial.uniforms.uRadius.value = CONFIG.bloomRadius;
            postScene.clear();
            postScene.add(blurQuad);
            renderer.setRenderTarget(renderTargetB);
            renderer.setViewport(0, 0, renderTargetB.width, renderTargetB.height);
            renderer.render(postScene, postCamera);

            blurMaterial.uniforms.tDiffuse.value = renderTargetB.texture;
            blurMaterial.uniforms.uDirection.value.set(0.0, 1.0);
            blurMaterial.uniforms.uRadius.value = CONFIG.bloomRadius;
            renderer.setRenderTarget(renderTargetA);
            renderer.setViewport(0, 0, renderTargetA.width, renderTargetA.height);
            renderer.render(postScene, postCamera);

            compositeMaterial.uniforms.tScene.value = sceneRenderTarget.texture;
            compositeMaterial.uniforms.tBloom.value = renderTargetA.texture;
            compositeMaterial.uniforms.uBloomStrength.value = CONFIG.bloomStrength;
            compositeMaterial.uniforms.uLensingStrength.value = CONFIG.lensingStrength;
            compositeMaterial.uniforms.uChromaticAberration.value = CONFIG.chromaticAberration;
            postScene.clear();
            postScene.add(compositeQuad);

            renderer.setRenderTarget(xrOutputTarget);
            renderer.setViewport(vp.x, vp.y, vp.width, vp.height);
            renderer.setScissor(vp.x, vp.y, vp.width, vp.height);
            renderer.setScissorTest(true);
            renderer.autoClear = (i === 0);
            renderer.render(postScene, postCamera);
          }
          renderer.setScissorTest(false);
          renderer.setViewport(0, 0, xrOutputTarget.width, xrOutputTarget.height);
        } finally {
          renderer.autoClear = prevAutoClear;
          renderer.xr.enabled = prevXrEnabled;
        }
        return;
      }
    }

    tempVec.set(0, 0, 0);
    tempVec.project(camera);

    const isBehind = tempVec.z > 1.0 ? 1.0 : 0.0;
    wormholeScreenVec.x = (tempVec.x * 0.5) + 0.5;
    wormholeScreenVec.y = (tempVec.y * 0.5) + 0.5;

    compositeShader.uniforms.uWormholeScreenPos.value.copy(wormholeScreenVec);
    compositeShader.uniforms.uIsBehind.value = isBehind;
    compositeShader.uniforms.uAspect.value = window.innerWidth / Math.max(1, window.innerHeight);

    renderer.setRenderTarget(sceneRenderTarget);
    renderer.render(scene, camera);

    const prevXrEnabled = renderer.xr.enabled;
    renderer.xr.enabled = false;
    try {
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
    } finally {
      renderer.xr.enabled = prevXrEnabled;
    }
  } catch (err) {
    console.warn('[Wormhole XR] Post-processing render failed, disabling:', err);
    state.postProcessingEnabled = false;
    if (!state.isXR) {
      renderer.setRenderTarget(null);
    }
    renderer.render(scene, camera);
  }
}

function updateFlight(delta) {
  if (state.isPaused) return;
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
    }
  }

  if (state.isXR && cameraRig) {
    cameraRig.rotation.order = 'YXZ';
    cameraRig.rotation.y = state.yaw;
    cameraRig.rotation.x = state.pitch;
    cameraRig.updateMatrixWorld(true);
  } else {
    if (cameraRig) {
      cameraRig.position.set(0, 0, 0);
      cameraRig.rotation.set(0, 0, 0);
      cameraRig.quaternion.identity();
      cameraRig.updateMatrixWorld(true);
    }
    camera.rotation.order = 'YXZ';
    camera.rotation.y = state.yaw;
    camera.rotation.x = state.pitch;
  }

  const activeViewQuat = new THREE.Quaternion();
  if (state.isXR && camera) {
    camera.updateMatrixWorld(true);
    camera.getWorldQuaternion(activeViewQuat);
  } else {
    activeViewQuat.copy(camera.quaternion);
  }

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(activeViewQuat);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(activeViewQuat);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(activeViewQuat);

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

  // Right joystick flight control lockout check (disabled for 3s after tapping fire or before navigating)
  const isFlightLockedOut = performance.now() < state.flightLockoutUntil;
  if (touchStickZone) {
    if (isFlightLockedOut && state.touchActive) {
      touchStickZone.classList.add('flight-locked');
    } else {
      touchStickZone.classList.remove('flight-locked');
    }
  }

  // Lock out throttle slider whenever right-hand flight joystick is active
  setThrottleLockout(state.touchActive);

  // 1. Custom Cruise Throttle Slider (Forward / Reverse speed cruise)
  if (Math.abs(state.throttleValue) > 0.005) {
    accel.addScaledVector(forward, state.throttleValue);
    state.laserEngineHaltNotified = false; // Engines are actively thrusting
  }

  // 2. Right Joystick Flight: Up & Down Elevation + 360-degree Yaw Steering
  if (state.touchActive && !isFlightLockedOut) {
    // Pushing stick up (-y): flies ship UP (ascend / climb)
    // Pulling stick down (+y): flies ship DOWN (descend / dive)
    accel.addScaledVector(up, -state.touchMove.y);

    // Deflecting stick left/right: smooth 360-degree horizontal yaw steering
    if (Math.abs(state.touchMove.x) > 0.06) {
      touchLookYaw -= state.touchMove.x * CONFIG.yawSpeed * 2.8 * (delta * 60);
      state.yaw = lastGyroYaw + touchLookYaw;
    }
    // Lateral strafe thrusters
    accel.addScaledVector(right, state.touchMove.x * 0.5);

    // Manual joystick movement overrides automated rotation
    if ((state.activeTurnType || state.isExecuting360Turn || state.isExecuting180Turn) && (Math.abs(state.touchMove.x) > 0.1 || Math.abs(state.touchMove.y) > 0.1)) {
      cancelTurn();
    }
  }

  // 3. Automated Thruster Rotation (180° or 360°)
  if (state.activeTurnType || state.isExecuting360Turn || state.isExecuting180Turn) {
    // Uniform angular velocity: 360° in ~2.8s, 180° in ~1.4s
    const turnRate = (Math.PI * 2) / 2.8;
    const step = turnRate * delta;
    const remaining = state.turnRotationTarget - state.turnRotationAccumulated;
    const actualStep = Math.min(step, remaining);

    touchLookYaw -= actualStep;
    state.yaw = lastGyroYaw + touchLookYaw;
    state.turnRotationAccumulated += actualStep;
    state.turn360Accumulated = state.turnRotationAccumulated;

    // Thruster stabilizer impulse while rotating
    accel.addScaledVector(right, 0.2);

    if (state.turnRotationAccumulated >= state.turnRotationTarget - 0.001) {
      const completedType = state.activeTurnType || (state.isExecuting180Turn ? '180' : '360');
      state.isExecuting360Turn = false;
      state.isExecuting180Turn = false;
      state.activeTurnType = null;
      state.turnRotationAccumulated = 0;
      state.turn360Accumulated = 0;

      if (touchBtnSpin180) touchBtnSpin180.classList.remove('active-spin');
      if (btnSpin180) btnSpin180.classList.remove('active');
      if (touchBtnSpin360) touchBtnSpin360.classList.remove('active-spin');
      if (btnSpin360) btnSpin360.classList.remove('active');
    }
  }

  pollGamepad(delta);

  if (state.isHyperWarping) {
    state.warpJumpTimer += delta;
    const targetWarpDir = new THREE.Vector3(0, 0, 0).sub(state.position).normalize();
    state.position.addScaledVector(targetWarpDir, delta * 320.0);
    if (!state.isXR) {
      camera.position.copy(state.position);
      camera.fov = THREE.MathUtils.lerp(camera.fov, 125, 0.05);
      camera.updateProjectionMatrix();
    } else if (cameraRig) {
      cameraRig.position.copy(state.position);
    }

    if (state.position.length() < CONFIG.eventHorizonRadius * 1.2) {
      state.position.set(0, 0, CONFIG.wormholeDistance);
      if (!state.isXR) {
        camera.position.copy(state.position);
      } else if (cameraRig) {
        cameraRig.position.copy(state.position);
      }
      state.velocity.set(0, 0, 0);
      stopThrottle();
      state.yaw = 0;
      state.pitch = 0;
      state.isHyperWarping = false;

      // Advance stage level and trigger level change update from Game Manager database
      const nextStage = (currentActiveStage % 4) + 1;
      console.log(`[Wormhole XR Engine] Warp traversal complete. Advancing to Stage ${nextStage}...`);
      triggerAcquireEvent('warp_horizon_jump');
      triggerAcquireEvent('core_collapse_breakthrough');

      // Replenish shields & hull for victorious arrival into next stage
      state.playerShield = 100;
      state.playerHealth = 100;
      state.stageKills = 0;
      state.isWarpReady = false;
      if (typeof updatePlayerDefenseHUD === 'function') {
        updatePlayerDefenseHUD();
      }
      if (typeof despawnAllActivePowerups === 'function') {
        despawnAllActivePowerups();
      }
      loadStageDeviceModule(nextStage, currentActiveDeviceType);
    }
  } else {
    if (accel.lengthSq() > 0) {
      const mag = Math.min(1.0, accel.length());
      accel.normalize();
      state.velocity.addScaledVector(accel, speed * delta * 4.0 * mag);
    }
    state.velocity.multiplyScalar(0.92);
    state.position.addScaledVector(state.velocity, delta);

    // Sublight navigation: allow flying right up to the accretion disk and event horizon
    // Hold safe standoff radius outside event horizon so the player can orbit and look around
    const distToCenter = state.position.length();
    const minSafeDist = CONFIG.eventHorizonRadius * 1.35;
    if (distToCenter < minSafeDist) {
      state.position.normalize().multiplyScalar(minSafeDist);
      state.velocity.multiplyScalar(0.5);
    }

    if (!state.isXR) {
      camera.position.copy(state.position);
    } else if (cameraRig) {
      cameraRig.position.copy(state.position);
      cameraRig.updateMatrixWorld(true);
    }
  }

  // Run stage-specific VR frame hook (calibrates HMD height offset, XR FOV/aspect, and VR controller inputs)
  if (typeof activeVrFrameHook === 'function') {
    try {
      activeVrFrameHook(delta, getEngineApi());
    } catch (vrHookErr) {
      console.warn('[Wormhole XR] VR frame hook warning:', vrHookErr);
    }
  }

  const distLength = state.position.length();
  const distKm = Math.round(distLength * 420);
  updateWormholeDistanceBadge(distKm);

  const toWormhole = distLength > 0.01
    ? new THREE.Vector3(0, 0, 0).sub(state.position).normalize()
    : new THREE.Vector3(0, 0, -1);
  const currentViewQuat = new THREE.Quaternion();
  if (state.isXR && camera) {
    camera.updateMatrixWorld(true);
    camera.getWorldQuaternion(currentViewQuat);
  } else {
    currentViewQuat.copy(camera.quaternion);
  }
  const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(currentViewQuat);
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
    if (vectorRingEl) {
      vectorRingEl.classList.add('locked');
      vectorRingEl.style.borderColor = '';
      vectorRingEl.style.boxShadow = '';
    }
  } else {
    if (objVector) objVector.classList.remove('completed');
    if (statusVector) statusVector.textContent = `${angleDeg.toFixed(1)}° / ${distKm.toLocaleString()} KM`;
    if (vectorRingEl) {
      const wasLocked = vectorRingEl.classList.contains('locked');
      vectorRingEl.classList.remove('locked');
      if (wasLocked && typeof weaponsSystem !== 'undefined' && weaponsSystem.updateCrosshairWeaponRing) {
        weaponsSystem.updateCrosshairWeaponRing();
      }
    }
  }

function checkObjectives() {
  if (typeof evaluateWarpReadiness === 'function') {
    evaluateWarpReadiness();
  }
  if (typeof checkDistanceStageEvents === 'function') {
    checkDistanceStageEvents(distKm);
  }
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
    if (state.isPaused) {
      state.lastFrameTime = timestamp;
      checkGamepadPauseOnly();
      if (state.isXR && typeof activeVrFrameHook === 'function') {
        try {
          activeVrFrameHook(0, getEngineApi());
        } catch (e) {}
      }
      if (!state.postProcessingEnabled) {
        renderer.render(scene, camera);
      } else {
        renderPostProcessing();
      }
      return;
    }

    // Clamp delta to prevent simulation spikes during tab changes or pauses
    const delta = Math.min(0.1, (timestamp - state.lastFrameTime) * 0.001);
    state.lastFrameTime = timestamp;
    state.time += delta;

    // During 5-second countdown, render the scene smoothly while holding combat and flight
    if (state.isCountdownActive) {
      centerWormholeOnScreen();
      updateCrosshairPosition(delta);
      if (!state.postProcessingEnabled) {
        renderer.render(scene, camera);
      } else {
        renderPostProcessing();
      }
      return;
    }

  state.frameCount++;
  if (timestamp - state.lastFpsUpdate >= 500) {
    state.fps = Math.round((state.frameCount * 1000) / (timestamp - state.lastFpsUpdate));
    state.frameCount = 0;
    state.lastFpsUpdate = timestamp;
    if (hudFpsEl) hudFpsEl.textContent = `${state.fps} FPS`;
  }

  updateFlight(delta);

  // Continuous rapid fire while right mouse button is held down with crosshair captured
  if (state.isRightMouseDown && state.isPointerLocked) {
    fireLaserBeam();
  }

  updateCrosshairPosition(delta);
  updateLaserBolts(delta);
  if (state.hasStarted && typeof updateEnemiesCombat === 'function') {
    updateEnemiesCombat(delta);
  }
  if (state.hasStarted && typeof update3DPowerups === 'function') {
    update3DPowerups(delta);
  }
  if (typeof updatePlayerDefenseHUD === 'function') {
    updatePlayerDefenseHUD();
  }
  if (typeof evaluateWarpReadiness === 'function') {
    evaluateWarpReadiness();
  }
  weaponsSystem.update(delta);

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

  // Dynamic Celestial Starfield: Keep stars tiny and push them more distant as ship approaches the wormhole
  const distToWormhole = state.position.length();
  const safeStandoff = (CONFIG.eventHorizonRadius || 7.2) * 1.35;
  const maxApproachDist = Math.max(1.0, CONFIG.wormholeDistance - safeStandoff);
  const approachProgress = Math.max(0.0, Math.min(1.0, (CONFIG.wormholeDistance - distToWormhole) / maxApproachDist));

  // 1. Keep celestial starfield centered on ship position so ship never flies into stars (skybox / infinite cosmic distance)
  starfield.position.copy(state.position);

  // 2. Outward celestial recession: As ship flies closer to the wormhole, push the stars further out into deep cosmos
  const starDistanceScale = 1.0 + approachProgress * 1.6;
  starfield.scale.set(starDistanceScale, starDistanceScale, starDistanceScale);

  // 3. Keep stars tiny: dynamically scale star material size so stars stay pinpoints and become even tinier near the singularity
  if (starfield.material) {
    starfield.material.size = Math.max(1.0, 2.0 - approachProgress * 0.8);
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

  if (!state.postProcessingEnabled) {
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

  updateMobileSnapGrid();

  const isLandscape = (w > h);
  if (isLandscape && state.hasStarted) {
    centerWormholeOnScreen();
  } else {
    state.crosshair.x = Math.max(20, Math.min(w - 20, state.crosshair.x));
    state.crosshair.y = Math.max(20, Math.min(h - 20, state.crosshair.y));
  }
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
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch('https://api.calmchessgames.com/admin/wormhole_device_api.php?action=check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(dbPayload),
        signal: ctrl.signal
      });
      clearTimeout(tid);
      if (res && res.ok) {
        dbResult = await res.json().catch(() => null);
      }
    } catch (e) {}

    if (splashBar) splashBar.style.width = '100%';

    // 4. Verify whether device is runnable on current mobile, desktop, vr, or arcore
    // Any browser with active WebGL hardware acceleration is fully runnable
    const isRunnable = isWebglRunnable;

    if (!isRunnable) {
      const failureReason = webglCheck.reason || 'Hardware graphics acceleration (WebGL) is unavailable on this device.';

      if (splashStatus) splashStatus.textContent = 'HARDWARE INCOMPATIBLE - WEBGL UNAVAILABLE';

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

    const detectedDevType = getDeviceTypeFromMode(initialMode);
    currentActiveDeviceType = detectedDevType;

    // At startup: check all admin console game manager database values and update the game values
    if (splashStatus) splashStatus.textContent = 'CHECKING ARSENAL & GAME MANAGER DATABASE...';
    try {
      await syncGameManagerFromDatabase(1);
    } catch (startupSyncErr) {
      console.warn('[Wormhole XR Engine] Startup Game Manager sync error:', startupSyncErr);
    }

    try {
      await loadStageDeviceModule(1, detectedDevType);
    } catch (stageErr) {
      console.warn('[Wormhole XR Engine] loadStageDeviceModule error:', stageErr);
    }

    if (splashStatus) splashStatus.textContent = 'SYSTEMS NOMINAL - READY TO ENTER COCKPIT';

    const startBtn = document.getElementById('btn-splash-start');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '🚀 START MISSION / ENTER COCKPIT';
      startBtn.title = 'Click or press Enter/Space to launch mission';
      startBtn.classList.add('btn-ready');

      const launchGame = () => {
        if (startBtn.dataset.launched) return;
        startBtn.dataset.launched = 'true';
        startCountdownAndLaunchGame(false);
      };

      startBtn.addEventListener('click', launchGame);
      window.addEventListener('keydown', (e) => {
        if ((e.code === 'Enter' || e.code === 'Space') && splashEl && splashEl.parentNode) {
          launchGame();
        }
      });
    }

    centerWormholeOnScreen();
    return true;
  } catch (err) {
    console.error('[Wormhole XR] Startup verification exception:', err);
    // Emergency Fallback: If WebGL is present, never lock user out - enable Start button!
    const startBtn = document.getElementById('btn-splash-start');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '🚀 START MISSION / ENTER COCKPIT';
      startBtn.title = 'Click or press Enter/Space to launch mission';
      startBtn.classList.add('btn-ready');
      const emergencyLaunch = () => {
        startCountdownAndLaunchGame(false);
      };
      startBtn.onclick = emergencyLaunch;
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') emergencyLaunch();
      });
    }
    return false;
  }
}

// Window exports for verification & diagnostics
if (typeof window !== 'undefined') {
  window.state = state;
  window.weaponsSystem = weaponsSystem;
  window.setCockpitTab = setCockpitTab;
  window.isControlLockedOut = isControlLockedOut;
  window.assertNotPaused = assertNotPaused;
  window.laserBolts = laserBolts;
  window.fireLaserBeam = fireLaserBeam;
  window.updateCrosshairPosition = updateCrosshairPosition;
  window.isFlightControlLocked = () => performance.now() < state.flightLockoutUntil;
  window.updateCrosshairSpeedMultiplier = updateCrosshairSpeedMultiplier;
  window.alignToWormhole = alignToWormhole;
  window.centerWormholeOnScreen = centerWormholeOnScreen;
  window.handleOrientation = handleOrientation;
  window.setLeftHandedMode = setLeftHandedMode;
  window.updateSplashGamepadStatus = updateSplashGamepadStatus;
  window.snapGrid = snapGrid;
  window.updateMobileSnapGrid = updateMobileSnapGrid;
  window.setShowTargetGrid = setShowTargetGrid;
  window.execute180Turn = execute180Turn;
  window.cancel180Turn = cancel180Turn;
  window.execute360Turn = execute360Turn;
  window.cancel360Turn = cancel360Turn;
  window.cancelTurn = cancelTurn;
  window.audioMgr = audioMgr;
  window.jumpToStage = (level) => loadStageDeviceModule(level, currentActiveDeviceType);
  window.loadStageDeviceModule = loadStageDeviceModule;
  window.reloadActiveStage = () => loadStageDeviceModule(currentActiveStage, currentActiveDeviceType);
  window.currentActiveStage = () => currentActiveStage;
  window.currentActiveDeviceType = () => currentActiveDeviceType;
  window.syncGameManagerFromDatabase = syncGameManagerFromDatabase;
  window.fetchGameManagerDatabaseValues = fetchGameManagerDatabaseValues;
  window.applyGameManagerValues = applyGameManagerValues;
  window.triggerAcquireEvent = triggerAcquireEvent;
  window.lastGameManagerData = () => lastGameManagerData;
  window.active3DEnemies = () => active3DEnemies;
  window.enemyBolts = () => enemyBolts;
  window.spawnEnemyFromWormhole = spawnEnemyFromWormhole;
  window.spawnEnemySwarmFromWormhole = spawnEnemySwarmFromWormhole;
  window.despawnAllActiveEnemies = despawnAllActiveEnemies;
  window.applyDamageToPlayer = applyDamageToPlayer;
  window.evaluateWarpReadiness = evaluateWarpReadiness;
  window.renderStageObjectivesUI = renderStageObjectivesUI;
  window.syncStagesDropdownFromDatabase = syncStagesDropdownFromDatabase;
  window.isMobileInUse = isMobileInUse;
  window.updateMobileControlsVisibility = updateMobileControlsVisibility;
  window.showShieldAndHealthOnHit = showShieldAndHealthOnHit;
  window.active3DPowerups = () => active3DPowerups;
  window.spawn3DPowerUp = spawn3DPowerUp;
  window.despawnAllActivePowerups = despawnAllActivePowerups;
  window.checkEnemyPowerupDrop = checkEnemyPowerupDrop;
  window.calculateSafeFarPowerupSpawnPos = calculateSafeFarPowerupSpawnPos;
  window.pruneUncollectedPowerupsByEnergyState = pruneUncollectedPowerupsByEnergyState;
  window.checkEventPowerupAppearance = checkEventPowerupAppearance;
  window.triggerGameOver = triggerGameOver;
  window.restartGame = restartGame;
  window.quitGame = quitGame;
  window.applyPowerupEffect = applyPowerupEffect;
  window.startCountdownAndLaunchGame = startCountdownAndLaunchGame;
}

// Quick Red X Exit buttons (HUD and Splash) -> returns to calmchessgames.com
const btnQuickExit = document.getElementById('btn-quick-exit');
if (btnQuickExit) {
  btnQuickExit.addEventListener('click', (e) => {
    e.preventDefault();
    quitGame();
  });
}
const btnSplashExit = document.getElementById('btn-splash-exit');
if (btnSplashExit) {
  btnSplashExit.addEventListener('click', (e) => {
    e.preventDefault();
    quitGame();
  });
}

// Restart button & keyboard shortcut listener for Game Over screen
const btnRestartGame = document.getElementById('btn-restart-game');
if (btnRestartGame) {
  btnRestartGame.addEventListener('click', (e) => {
    e.preventDefault();
    restartGame();
  });
}

// Quit button listener for Game Over screen (returns to calmchessgames.com)
const btnQuitGame = document.getElementById('btn-quit-game');
if (btnQuitGame) {
  btnQuitGame.addEventListener('click', (e) => {
    e.preventDefault();
    quitGame();
  });
}

window.addEventListener('keydown', (e) => {
  if (state.isGameOver) {
    if (e.code === 'KeyR' || e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      restartGame();
    } else if (e.code === 'Escape' || e.code === 'KeyQ') {
      e.preventDefault();
      quitGame();
    }
  }
});

// Initial mobile snap grid calculation
updateMobileSnapGrid();

runStartupDiagnosticsAndSplashScreen();
