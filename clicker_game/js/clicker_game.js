/**
 * Calm Chess Computers & Games — Kawaii 7-Row Mechanical Clicker XR
 * Modeled after collectible kawaii chibi mechanical keyboard clickers in a pink silicone case:
 *  - 7 Distinct Pastel Rows x 5 Columns (35 tactile mechanical clickers!)
 *  - Thick soft-touch Pink Silicone Protective Case with molded hearts, stars & swinging pastel charm
 *  - 14 Adorable Cartoonish Kawaii Chibi Keycaps (modeled directly on clickers0.jpg!)
 *    with puffy cushion geometry, glossy anime eyes, 3D ears/bows/glasses/flowers/swirls
 *  - Authentic Mechanical Keyboard Switch Travel (press down -> bottom-out thock -> spring-up clack!)
 *  - Drag/glide strumming across rows, physical keyboard support, & Rainbow Wave procedural XR animations
 *  - Full WebXR (immersive-vr + passthrough immersive-ar) with dual controllers & hand-tracking fingertip poke!
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { createClickerAudioEngine } from './clicker_audio.js';

(function initKawaiiClickerBoardXR() {
  'use strict';

  const STORAGE_KEY = 'calmchess_kawaii_7row_clicker_v1';
  const NUM_ROWS = 7;
  const NUM_COLS = 5;
  const KEY_PITCH = 1.12;

  // 7 Vivid Pastel Row Themes (matching the interlocking pastel switch bases in clickers0.jpg!)
  const ROW_THEMES = [
    { name: 'Sunny Yellow',  housingHex: 0xffd43b, ledHex: 0xffe066, stemHex: 0xff8c1a },
    { name: 'Mint Lime',     housingHex: 0xa6e84f, ledHex: 0x6ee7b7, stemHex: 0x10b981 },
    { name: 'Bubblegum',     housingHex: 0xff75bc, ledHex: 0xff4da6, stemHex: 0xe61c7c },
    { name: 'Sky Aqua',      housingHex: 0x6cd8eb, ledHex: 0x38bdf8, stemHex: 0x0ea5e9 },
    { name: 'Lavender',      housingHex: 0xc084fc, ledHex: 0xa855f7, stemHex: 0x9333ea },
    { name: 'Peach Sorbet',  housingHex: 0xffa366, ledHex: 0xfb923c, stemHex: 0xf43f5e },
    { name: 'Cotton Rose',   housingHex: 0xff85c0, ledHex: 0xf472b6, stemHex: 0xec4899 }
  ];

  // 14 Adorable Kawaii Chibi Characters modeled directly on clickers0.jpg + 7-year-old favorites!
  const CHARACTER_CATALOG = [
    {
      id: 'candyPup',
      base: '#ff9636', hex: 0xff9636, accent: '#22b8f0', cheek: '#ff6699',
      eyeColor: '#69203f', eyeRim: '#ff3d8b', style: 'candyPup', topper: 'roundEarsBlueDots'
    },
    {
      id: 'mintOwl',
      base: '#72d6e0', hex: 0x72d6e0, accent: '#1ea377', cheek: '#ff70a6',
      eyeColor: '#1f6e55', eyeRim: '#e6428e', style: 'mintOwl', topper: 'owlTufts'
    },
    {
      id: 'caramelBow',
      base: '#f28c38', hex: 0xf28c38, accent: '#ffffff', cheek: '#ff6399',
      eyeColor: '#7a1f4b', eyeRim: '#ff4d94', style: 'caramelBow', topper: 'bowPuppy'
    },
    {
      id: 'pinkLamb',
      base: '#ff9ed2', hex: 0xff9ed2, accent: '#ff5cad', cheek: '#ff6ca8',
      eyeColor: '#85338f', eyeRim: '#e655a8', style: 'pinkLamb', topper: 'lambCurls'
    },
    {
      id: 'sakuraKitty',
      base: '#ffb8df', hex: 0xffb8df, accent: '#ff4ca6', cheek: '#ff6ba6',
      eyeColor: '#7a1c82', eyeRim: '#eb3d94', style: 'sakuraKitty', topper: 'kittyBlossom'
    },
    {
      id: 'glassesBerry',
      base: '#ffa8d4', hex: 0xffa8d4, accent: '#36c97a', cheek: '#ff66a3',
      eyeColor: '#1f945c', eyeRim: '#ff4c98', style: 'glassesBerry', topper: 'glassesSprout'
    },
    {
      id: 'starOcto',
      base: '#2ca4f5', hex: 0x2ca4f5, accent: '#ff5eb5', cheek: '#6bd0ff',
      eyeColor: '#363b96', eyeRim: '#8a73ff', style: 'starOcto', topper: 'octoSwirls'
    },
    {
      id: 'lilacCat',
      base: '#c496f2', hex: 0xc496f2, accent: '#ff63b8', cheek: '#ff78c4',
      eyeColor: '#5c208c', eyeRim: '#c94cff', style: 'lilacCat', topper: 'spikyTufts'
    },
    {
      id: 'milkCub',
      base: '#fff4eb', hex: 0xfff4eb, accent: '#b33c2e', cheek: '#ff80ab',
      eyeColor: '#692a1e', eyeRim: '#cc5252', style: 'milkCub', topper: 'hoodCub'
    },
    {
      id: 'strawberryBunny',
      base: '#ff75aa', hex: 0xff75aa, accent: '#39c770', cheek: '#ff4d88',
      eyeColor: '#5e173d', eyeRim: '#f5367c', style: 'strawberryBunny', topper: 'bunnyLeaf'
    },
    {
      id: 'sunnyChick',
      base: '#ffd84d', hex: 0xffd84d, accent: '#ff7347', cheek: '#ff7a7a',
      eyeColor: '#5c3116', eyeRim: '#eb8800', style: 'sunnyChick', topper: 'chickTuft'
    },
    {
      id: 'unicornDream',
      base: '#d9b5ff', hex: 0xd9b5ff, accent: '#ffcb2e', cheek: '#ff78bd',
      eyeColor: '#5b2899', eyeRim: '#b366ff', style: 'unicornDream', topper: 'unicornHorn'
    },
    {
      id: 'mintAxolotl',
      base: '#7ae8b8', hex: 0x7ae8b8, accent: '#ff5ca8', cheek: '#ff73b8',
      eyeColor: '#1a4d3d', eyeRim: '#22a6e6', style: 'mintAxolotl', topper: 'axolotlGills'
    },
    {
      id: 'cottonBear',
      base: '#8fd4ff', hex: 0x8fd4ff, accent: '#ff5eb5', cheek: '#ff78b8',
      eyeColor: '#2d3b7a', eyeRim: '#4a8ef5', style: 'cottonBear', topper: 'teddyCrown'
    }
  ];

  // Physical Keyboard Layout mapping across the 7 rows x 5 columns (35 keys!)
  const KEYBOARD_GRID_CODES = [
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB'],
    ['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'],
    ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
    ['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']
  ];
  const codeToKeyEntry = new Map();

  // HUD elements
  const canvas = document.getElementById('xr-canvas');
  const clicksPill = document.getElementById('clicks-pill');
  const statClicksEl = document.getElementById('stat-clicks');
  const btnSoundMode = document.getElementById('btn-sound-mode');
  const btnWave = document.getElementById('btn-wave');
  const btnEnterVr = document.getElementById('btn-enter-vr');
  const btnEnterAr = document.getElementById('btn-enter-ar');

  const audio = createClickerAudioEngine();

  const state = {
    totalClicks: 0,
    comboCount: 0,
    lastClickTime: 0,
    isInXR: false,
    xrMode: null,
    vrSupported: false,
    arSupported: false,
    webglReady: false,
    paused: false,
    waveActiveCount: 0
  };

  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed.totalClicks) && parsed.totalClicks >= 0) {
        state.totalClicks = Math.floor(parsed.totalClicks);
      }
    } catch (_) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalClicks: state.totalClicks }));
    } catch (_) {}
  }

  function syncHud(pop = false) {
    if (statClicksEl) statClicksEl.textContent = state.totalClicks.toLocaleString('en-US');
    if (pop && clicksPill) {
      clicksPill.classList.remove('is-pop');
      void clicksPill.offsetWidth;
      clicksPill.classList.add('is-pop');
    }
  }

  loadStats();
  syncHud(false);

  // ---------------------------------------------------------------------------
  // WebGL / Three.js + WebXR Renderer Setup
  // ---------------------------------------------------------------------------
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    state.webglReady = true;
  } catch (err) {
    console.warn('[KawaiiClickerXR] WebGL unavailable:', err);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 120);
  camera.position.set(0, 9.6, 9.8);

  const cameraRig = new THREE.Group();
  cameraRig.name = 'XRCameraRig';
  cameraRig.add(camera);
  scene.add(cameraRig);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 5.5;
  controls.maxDistance = 24.0;
  controls.minPolarAngle = Math.PI * 0.06;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 0.2, 0.1);

  // Balanced Toy-Studio Lighting (crisp depth, vivid candy colors & velvety hot-pink silicone!)
  const hemiLight = new THREE.HemisphereLight(0xfff5fb, 0x8b6bb8, 0.68);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf2, 1.25);
  keyLight.position.set(6.0, 14.0, 7.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 32;
  keyLight.shadow.camera.left = -8.5;
  keyLight.shadow.camera.right = 8.5;
  keyLight.shadow.camera.top = 9.5;
  keyLight.shadow.camera.bottom = -9.5;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const pinkFill = new THREE.DirectionalLight(0xff80c8, 0.36);
  pinkFill.position.set(-7.5, 6.5, 4.0);
  scene.add(pinkFill);

  const aquaRim = new THREE.DirectionalLight(0x7dd3fc, 0.38);
  aquaRim.position.set(7.0, 5.5, -6.5);
  scene.add(aquaRim);

  // Procedural Softbox Studio Environment Map (balanced contrast for glossy keycap shine!)
  {
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ectx = envCanvas.getContext('2d');
    const eg = ectx.createLinearGradient(0, 0, 0, 256);
    eg.addColorStop(0.0, '#d8c2ff');
    eg.addColorStop(0.35, '#f0d9ff');
    eg.addColorStop(0.68, '#b8a8e8');
    eg.addColorStop(1.0, '#6d549e');
    ectx.fillStyle = eg;
    ectx.fillRect(0, 0, 512, 256);

    ectx.fillStyle = '#ffffff';
    ectx.fillRect(56, 26, 130, 50);
    ectx.fillRect(320, 34, 130, 52);

    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(envTex).texture;
    envTex.dispose();
    pmrem.dispose();
  }

  // ---------------------------------------------------------------------------
  // Dreamy Pastel Room Environment (automatically hidden in AR Passthrough!)
  // ---------------------------------------------------------------------------
  const environmentGroup = new THREE.Group();
  scene.add(environmentGroup);

  const skyUniforms = { uTime: { value: 0 } };
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(62, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPos;
        void main() {
          vec3 d = normalize(vPos);
          float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 bottom = vec3(0.99, 0.87, 0.96);
          vec3 mid    = vec3(0.93, 0.84, 1.00);
          vec3 top    = vec3(0.76, 0.88, 1.00);
          vec3 col = mix(bottom, mid, smoothstep(0.28, 0.60, h));
          col = mix(col, top, smoothstep(0.60, 0.96, h));

          float wave = sin(d.x * 3.8 + uTime * 0.35) * cos(d.z * 3.2 - uTime * 0.25);
          vec3 glow = mix(vec3(1.0, 0.72, 0.90), vec3(0.72, 0.94, 1.0), wave * 0.5 + 0.5);
          col = mix(col, glow, 0.14);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  environmentGroup.add(skyDome);

  // Soft Pastel Lavender Desk Mat underneath the Hot-Pink Silicone Case (great visual contrast!)
  function createPastelDeskTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
    g.addColorStop(0, '#dfd0ff');
    g.addColorStop(0.55, '#cbb6f7');
    g.addColorStop(1, '#a991e6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    // Cute soft polka-dot pastel pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let y = 24; y < 512; y += 48) {
      for (let x = 24; x < 512; x += 48) {
        const off = ((y / 48) % 2) * 24;
        ctx.beginPath();
        ctx.arc((x + off) % 512, y, 7.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  const deskMesh = new THREE.Mesh(
    new THREE.CircleGeometry(24, 64),
    new THREE.MeshStandardMaterial({
      map: createPastelDeskTexture(),
      roughness: 0.72,
      metalness: 0.02
    })
  );
  deskMesh.rotation.x = -Math.PI / 2;
  deskMesh.position.y = -0.58;
  deskMesh.receiveShadow = true;
  environmentGroup.add(deskMesh);

  // Cute Floating Pastel Clouds & Twinkling Sparkles around the play area!
  const cloudGroup = new THREE.Group();
  environmentGroup.add(cloudGroup);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.0,
    emissive: 0xffe6f7,
    emissiveIntensity: 0.25
  });
  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const cg = new THREE.Group();
    const ang = (i / 8) * Math.PI * 2;
    const rad = 19.5 + (i % 2) * 3.0;
    cg.position.set(Math.cos(ang) * rad, 3.6 + (i % 3) * 1.5, Math.sin(ang) * rad - 3.5);
    [[-0.8, 0, 0, 0.72], [0, 0.22, 0, 0.95], [0.85, 0.02, 0, 0.70], [0.25, -0.1, 0.35, 0.65]].forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat);
      puff.position.set(x, y, z);
      cg.add(puff);
    });
    cg.scale.setScalar(1.0 + (i % 3) * 0.25);
    cloudGroup.add(cg);
    clouds.push({ group: cg, baseY: cg.position.y, phase: i * 0.9 });
  }

  // Floating Pastel 4-Point Sparkles
  function createSparkleTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 58);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,190,235,0.65)');
    g.addColorStop(1.0, 'rgba(255,190,235,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(64, 12);
    ctx.quadraticCurveTo(68, 60, 116, 64);
    ctx.quadraticCurveTo(68, 68, 64, 116);
    ctx.quadraticCurveTo(60, 68, 12, 64);
    ctx.quadraticCurveTo(60, 60, 64, 12);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const sparkleTex = createSparkleTexture();
  const ambientStarCount = 90;
  const starPos = new Float32Array(ambientStarCount * 3);
  const starSeed = new Float32Array(ambientStarCount);
  for (let i = 0; i < ambientStarCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4.2 + Math.random() * 8.5;
    starPos[i * 3] = Math.cos(a) * r;
    starPos[i * 3 + 1] = 0.2 + Math.random() * 6.5;
    starPos[i * 3 + 2] = Math.sin(a) * r;
    starSeed[i] = Math.random() * Math.PI * 2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starPoints = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      map: sparkleTex,
      size: 0.34,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    })
  );
  environmentGroup.add(starPoints);

  // ---------------------------------------------------------------------------
  // Procedural 512x512 Kawaii Character Face Texture Generator (modeled on clickers0.jpg!)
  // ---------------------------------------------------------------------------
  const faceTexCache = new Map();

  function drawStar(ctx, cx, cy, outerR, innerR, points, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(ctx, cx, cy, size, fill) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.35);
    ctx.bezierCurveTo(-size * 0.9, -size * 0.35, -size * 0.55, -size * 0.95, 0, -size * 0.42);
    ctx.bezierCurveTo(size * 0.55, -size * 0.95, size * 0.9, -size * 0.35, 0, size * 0.35);
    ctx.fill();
    ctx.restore();
  }

  function drawFlower(ctx, cx, cy, r, petalCol, centerCol) {
    ctx.fillStyle = petalCol;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * 0.65, cy + Math.sin(a) * r * 0.65, r * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = centerCol;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }

  function createKawaiiFaceTexture(def) {
    if (faceTexCache.has(def.id)) return faceTexCache.get(def.id);

    const S = 512;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');

    // Soft glossy pastel base with delicate lighter cheek-center glow
    const bgGrad = ctx.createRadialGradient(S * 0.5, S * 0.45, 30, S * 0.5, S * 0.5, S * 0.62);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.18, def.base);
    bgGrad.addColorStop(1, def.base);
    ctx.fillStyle = def.base;
    ctx.fillRect(0, 0, S, S);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, S, S);
    ctx.globalAlpha = 1;

    // Character-specific painted markings (modeled directly on clickers0.jpg!)
    if (def.style === 'candyPup') {
      // Cream white rounded face patch (like top-left orange puppy in clickers0.jpg)
      ctx.fillStyle = '#fff9f2';
      ctx.beginPath();
      ctx.ellipse(256, 295, 165, 138, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cute turquoise ear-dots & colorful candy spots on cheeks!
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(162, 118, 22, 0, Math.PI * 2);
      ctx.arc(350, 118, 22, 0, Math.PI * 2);
      ctx.fill();
      // Colorful candy speckles on lower cheeks
      [
        [108, 355, 22, '#38bdf8'], [138, 396, 18, '#fde047'], [98, 405, 14, '#fb7185'],
        [404, 355, 22, '#86efac'], [376, 396, 18, '#fde047'], [414, 405, 14, '#f472b6']
      ].forEach(([x, y, r, col]) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (def.style === 'mintOwl') {
      // Cream owl belly/face mask + teal leafy botanical markings (top-right in clickers0.jpg)
      ctx.fillStyle = '#e4fbfc';
      ctx.beginPath();
      ctx.ellipse(256, 330, 150, 112, 0, 0, Math.PI * 2);
      ctx.fill();
      // Teal leafy sprigs on forehead & sides
      ctx.fillStyle = '#259e83';
      [
        [120, 140, -0.5], [154, 116, -0.2], [392, 140, 0.5], [358, 116, 0.2],
        [104, 330, -0.7], [408, 330, 0.7]
      ].forEach(([lx, ly, rot]) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      drawFlower(ctx, 256, 112, 22, '#ff9ec9', '#ffe066');
      drawFlower(ctx, 112, 376, 18, '#ff9ec9', '#fff3a1');
      drawFlower(ctx, 400, 376, 18, '#ff9ec9', '#fff3a1');
    } else if (def.style === 'caramelBow') {
      // Caramel spotted puppy/bunny with cute freckles & big white bow (2nd-left in clickers0.jpg)
      ctx.fillStyle = '#fff5e8';
      ctx.beginPath();
      ctx.ellipse(256, 326, 142, 108, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cute cocoa spots across forehead and cheeks
      ctx.fillStyle = '#9c4e24';
      [
        [120, 122, 14], [156, 104, 11], [198, 128, 9], [314, 128, 9], [356, 104, 11], [392, 122, 14],
        [104, 214, 10], [408, 214, 10], [256, 110, 12]
      ].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      // Crisp painted white bow under smile
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d98cb3';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(212, 404, 44, 28, -0.18, 0, Math.PI * 2);
      ctx.ellipse(300, 404, 44, 28, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(256, 404, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (def.style === 'pinkLamb') {
      // Fluffy pink lamb wool scallop fringe on forehead (3rd-left in clickers0.jpg)
      ctx.fillStyle = '#ffe8f5';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(136 + i * 60, 118 + (i % 2) * 10, 36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#ff94cb';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, 126, 22, 0.2, Math.PI * 1.7);
      ctx.stroke();
    } else if (def.style === 'sakuraKitty') {
      // Blush pink sakura kitty with cherry blossoms on cheeks (3rd-right in clickers0.jpg)
      drawFlower(ctx, 118, 378, 26, '#ffffff', '#ff85c0');
      drawFlower(ctx, 394, 378, 26, '#ffffff', '#ff85c0');
      drawFlower(ctx, 256, 108, 20, '#ffffff', '#ffe066');
      // Subtle pink whiskers
      ctx.strokeStyle = '#d96ba8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      [[72, 276, 126, 286], [68, 314, 124, 312], [440, 276, 386, 286], [444, 314, 388, 312]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    } else if (def.style === 'glassesBerry') {
      // Mint leafy collar dots + forehead pink heart (4th-left in clickers0.jpg)
      drawHeart(ctx, 256, 116, 26, '#ff6ba8');
      ctx.fillStyle = '#62d695';
      [154, 206, 256, 306, 358].forEach((cx) => {
        ctx.beginPath();
        ctx.arc(cx, 418, 22, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (def.style === 'starOcto') {
      // Cerulean starry octopus with glowing pink pearl & white wave swirls (4th-right in clickers0.jpg)
      ctx.fillStyle = '#9ee4ff';
      ctx.beginPath();
      ctx.ellipse(256, 122, 34, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      drawHeart(ctx, 256, 124, 24, '#ff7cc3');
      // White spiral sea-swirls on lower cheeks
      ctx.strokeStyle = '#e0f7ff';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      [122, 390].forEach((sx, idx) => {
        ctx.beginPath();
        ctx.arc(sx, 378, 30, idx === 0 ? 0.2 : Math.PI - 0.2, idx === 0 ? Math.PI * 1.85 : Math.PI * 2.8);
        ctx.stroke();
      });
      drawStar(ctx, 130, 132, 18, 8, 4, '#ffffff');
      drawStar(ctx, 382, 132, 18, 8, 4, '#ffffff');
    } else if (def.style === 'lilacCat') {
      // Lavender spiky cat with golden star & pink hearts (5th-left in clickers0.jpg)
      drawStar(ctx, 256, 116, 28, 12, 5, '#ffe066');
      drawHeart(ctx, 118, 372, 24, '#ff85c8');
      drawHeart(ctx, 394, 372, 24, '#ff85c8');
      drawStar(ctx, 128, 146, 16, 7, 4, '#ffffff');
      drawStar(ctx, 384, 146, 16, 7, 4, '#ffffff');
    } else if (def.style === 'milkCub') {
      // Milky white cub with cute cocoa/berry hood swoop on one side (5th-right in clickers0.jpg)
      ctx.fillStyle = '#b84c3e';
      ctx.beginPath();
      ctx.moveTo(256, 0);
      ctx.lineTo(512, 0);
      ctx.lineTo(512, 210);
      ctx.quadraticCurveTo(380, 175, 256, 125);
      ctx.closePath();
      ctx.fill();
      drawStar(ctx, 382, 92, 22, 9, 4, '#ffe680');
      drawStar(ctx, 124, 124, 18, 8, 4, '#ff9ec9');
    } else if (def.style === 'strawberryBunny') {
      // Golden strawberry seeds + green berry calyx along top!
      ctx.fillStyle = '#56d687';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(60 + i * 95, 0);
        ctx.lineTo(110 + i * 95, 92);
        ctx.lineTo(160 + i * 95, 0);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe588';
      [[105, 150], [407, 150], [92, 365], [420, 365], [160, 412], [352, 412]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.ellipse(sx, sy, 8, 13, 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (def.style === 'sunnyChick') {
      // Soft sunny glow ring + tiny daisy flowers
      drawFlower(ctx, 114, 132, 22, '#ffffff', '#ff8866');
      drawFlower(ctx, 398, 132, 22, '#ffffff', '#ff8866');
    } else if (def.style === 'unicornDream') {
      // Pastel rainbow bangs arc across top forehead!
      const rainbow = ['#ff7cc3', '#ffe066', '#86efac', '#7dd3fc'];
      rainbow.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(256, 175, 155 - i * 20, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();
      });
      drawStar(ctx, 116, 376, 20, 9, 4, '#ffe066');
      drawStar(ctx, 396, 376, 20, 9, 4, '#ffe066');
    } else if (def.style === 'mintAxolotl') {
      // Soft cream belly curve + tiny pastel bubbles
      ctx.fillStyle = '#e8fff4';
      ctx.beginPath();
      ctx.ellipse(256, 355, 155, 92, 0, 0, Math.PI * 2);
      ctx.fill();
      [[112, 132, 16], [142, 108, 10], [398, 132, 16], [368, 108, 10]].forEach(([x, y, r]) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else if (def.style === 'cottonBear') {
      // Cotton candy pink-to-blue gradient + cream snout!
      const ccg = ctx.createLinearGradient(0, 0, S, S);
      ccg.addColorStop(0, '#ffb8e0');
      ccg.addColorStop(0.5, '#d8c7ff');
      ccg.addColorStop(1, '#9be5ff');
      ctx.fillStyle = ccg;
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#fff8fc';
      ctx.beginPath();
      ctx.ellipse(256, 344, 88, 62, 0, 0, Math.PI * 2);
      ctx.fill();
      drawHeart(ctx, 124, 126, 20, '#ffffff');
      drawHeart(ctx, 388, 126, 20, '#ffffff');
    }

    // ---- HUGE SPARKLY KAWAII ANIME EYES (Signature look of clickers0.jpg!) ----
    const eyeY = 252;
    const drawKawaiiEye = (ex, ey, isLeft) => {
      // Outer glossy colored iris rim
      ctx.fillStyle = def.eyeRim;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 50, 58, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep cute pupil body
      ctx.fillStyle = def.eyeColor;
      ctx.beginPath();
      ctx.ellipse(ex, ey + 2, 40, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft bright lower-iris pastel crescent glow (signature anime shine!)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 24, 24, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big bright white top-left sparkle catchlight
      ctx.fillStyle = '#ffffff';
      if (def.style === 'starOcto' || def.style === 'unicornDream') {
        drawStar(ctx, ex - 10, ey - 14, 22, 9, 4, '#ffffff');
      } else if (def.style === 'strawberryBunny' || def.style === 'cottonBear') {
        drawHeart(ctx, ex - 10, ey - 8, 20, '#ffffff');
      } else {
        ctx.beginPath();
        ctx.ellipse(ex - 13, ey - 17, 17, 20, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Mini second sparkle dot!
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + 16, ey + 15, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Adorable curled cartoon eyelashes!
      ctx.strokeStyle = def.eyeColor;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey, 52, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();

      const side = isLeft ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(ex + side * 44, ey - 26);
      ctx.quadraticCurveTo(ex + side * 62, ey - 36, ex + side * 66, ey - 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex + side * 49, ey - 10);
      ctx.quadraticCurveTo(ex + side * 64, ey - 14, ex + side * 68, ey - 24);
      ctx.stroke();
    };

    drawKawaiiEye(164, eyeY, true);
    drawKawaiiEye(348, eyeY, false);

    // Cute round painted glasses rim for glassesBerry!
    if (def.style === 'glassesBerry') {
      ctx.strokeStyle = '#ff63a5';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(164, eyeY, 64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(348, eyeY, 64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(228, eyeY);
      ctx.quadraticCurveTo(256, eyeY - 12, 284, eyeY);
      ctx.stroke();
    }

    // Soft Rosy Kawaii Oval Blush Cheeks
    ctx.fillStyle = def.cheek;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(98, eyeY + 64, 38, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(414, eyeY + 64, 38, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Tiny glossy blush-shine dashes
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    [[86, eyeY + 58, 96, eyeY + 52], [404, eyeY + 58, 414, eyeY + 52]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // ---- TINY CUTE CARTOON NOSE & SMILE ----
    if (def.style === 'mintOwl' || def.style === 'sunnyChick') {
      // Cute little pink/orange triangular beak
      ctx.fillStyle = def.style === 'mintOwl' ? '#ff6ba8' : '#ff8c42';
      ctx.strokeStyle = def.eyeColor;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(234, 294);
      ctx.lineTo(278, 294);
      ctx.lineTo(256, 330);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (def.style === 'mintAxolotl') {
      // Wide sweet happy smile
      ctx.strokeStyle = def.eyeColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(256, 304, 46, 0.18, Math.PI - 0.18);
      ctx.stroke();
    } else {
      // Tiny heart/oval button nose + adorable ":3" kawaii cat/puppy mouth!
      ctx.fillStyle = '#ff639e';
      ctx.beginPath();
      ctx.ellipse(256, 296, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = def.eyeColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(234, 322, 22, 0.12, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(278, 322, 22, 0.15, Math.PI - 0.12);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    faceTexCache.set(def.id, tex);
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Custom Sculpted Puffy Kawaii Cushion Keycap Geometry (like clickers0.jpg!)
  // ---------------------------------------------------------------------------
  function createRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  // Sculpted chunky rounded cushion body (MOA / puffy chibi toy keycap profile!)
  function createPuffyKeycapGeometry() {
    const geo = new THREE.BoxGeometry(0.92, 0.50, 0.92, 16, 10, 16);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const nx = v.x / 0.46; // -1..1
      const ny = v.y / 0.25; // -1..1
      const nz = v.z / 0.46; // -1..1

      // Superellipse corner rounding so edges are plush & chubby like clickers0.jpg!
      const rSq = nx * nx + nz * nz;
      const maxEdge = Math.max(Math.abs(nx), Math.abs(nz));
      let sx = v.x;
      let sz = v.z;
      if (maxEdge > 0.001) {
        const cornerRound = Math.pow(Math.pow(Math.abs(nx), 4.2) + Math.pow(Math.abs(nz), 4.2), 1 / 4.2);
        const factor = maxEdge / Math.max(cornerRound, 0.001);
        sx *= factor;
        sz *= factor;
      }

      // Gentle upward taper like a real mechanical keycap + puffy dome top!
      const taper = 1.0 - Math.max(0, ny) * 0.095;
      sx *= taper;
      sz *= taper;

      // Soft pillowy cushion dome on the top surface
      let sy = v.y;
      if (ny > 0) {
        const radial = Math.min(1, Math.sqrt(rSq) * 0.72);
        const dome = Math.cos(radial * Math.PI * 0.5) * 0.085 * ny;
        const edgeRoll = (1 - Math.pow(maxEdge, 3.2)) * 0.03 * ny;
        sy += dome + edgeRoll;
      } else {
        // Subtle beveled underside skirt
        const skirt = 1.0 - Math.abs(ny) * 0.03;
        sx *= skirt;
        sz *= skirt;
      }

      pos.setXYZ(i, sx, sy, sz);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Softly domed top face cap that hugs the puffy cushion contour seamlessly!
  function createDomedFaceCapGeometry() {
    const geo = new THREE.PlaneGeometry(0.84, 0.84, 14, 14);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const nx = x / 0.42;
      const nz = z / 0.42;
      const maxEdge = Math.max(Math.abs(nx), Math.abs(nz));
      let sx = x;
      let sz = z;
      if (maxEdge > 0.001) {
        const cornerRound = Math.pow(Math.pow(Math.abs(nx), 4.2) + Math.pow(Math.abs(nz), 4.2), 1 / 4.2);
        const factor = maxEdge / Math.max(cornerRound, 0.001);
        sx *= factor;
        sz *= factor;
      }
      const rSq = (sx / 0.46) * (sx / 0.46) + (sz / 0.46) * (sz / 0.46);
      const radial = Math.min(1, Math.sqrt(rSq) * 0.72);
      const dome = Math.cos(radial * Math.PI * 0.5) * 0.085;
      const edgeRoll = (1 - Math.pow(maxEdge, 3.2)) * 0.03;
      // Sit 0.008 above the keycap dome so there is zero z-fighting
      pos.setXYZ(i, sx * 0.905, 0.258 + dome + edgeRoll, sz * 0.905);
    }
    geo.computeVertexNormals();
    return geo;
  }

  const puffyKeycapGeo = createPuffyKeycapGeometry();
  const domedFaceGeo = createDomedFaceCapGeometry();

  // Interlocking Mechanical Switch Housing Base (matches the colorful puzzle-tab bases in clickers0.jpg!)
  const switchBaseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.96, 0.96, 0.14), {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3
  });
  switchBaseGeo.rotateX(-Math.PI / 2);
  switchBaseGeo.center();

  const switchCrystalCollarGeo = new THREE.BoxGeometry(0.68, 0.22, 0.68);
  const puzzleTabGeo = new THREE.BoxGeometry(0.11, 0.16, 0.20);
  const stemArmAGeo = new THREE.BoxGeometry(0.28, 0.30, 0.085);
  const stemArmBGeo = new THREE.BoxGeometry(0.085, 0.30, 0.28);

  const clearCrystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.52,
    transparent: true,
    opacity: 0.78
  });

  const whiteGlossMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.22,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18
  });

  const goldGlossMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd74a,
    roughness: 0.20,
    metalness: 0.65,
    clearcoat: 0.8
  });

  // ---------------------------------------------------------------------------
  // Board Master Container + THICK PINK SILICONE PROTECTIVE CASE!
  // ---------------------------------------------------------------------------
  const boardAssembly = new THREE.Group();
  boardAssembly.name = 'Kawaii7RowClickerBoard';
  scene.add(boardAssembly);

  const innerW = NUM_COLS * KEY_PITCH + 0.28; // ~5.88
  const innerD = NUM_ROWS * KEY_PITCH + 0.28; // ~8.12
  const wallThickness = 0.56;
  const outerW = innerW + wallThickness * 2;  // ~7.00
  const outerD = innerD + wallThickness * 2;  // ~9.24

  // Rich Soft-Touch Velvety Hot-Bubblegum Pink Silicone Materials (modeled on clickers0.jpg pink case!)
  const pinkSiliconeMainMat = new THREE.MeshPhysicalMaterial({
    color: 0xff3b9d,
    roughness: 0.56,
    metalness: 0.0,
    sheen: 0.9,
    sheenRoughness: 0.52,
    sheenColor: new THREE.Color(0xffb8de),
    envMapIntensity: 0.42
  });

  const pinkSiliconeLipMat = new THREE.MeshPhysicalMaterial({
    color: 0xff52a8,
    roughness: 0.50,
    metalness: 0.0,
    sheen: 0.95,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0xffd6ec),
    envMapIntensity: 0.45
  });

  const pinkSiliconeInnerMat = new THREE.MeshStandardMaterial({
    color: 0xb81d6d,
    roughness: 0.68,
    metalness: 0.02
  });

  const pinkSiliconeEmbossMat = new THREE.MeshPhysicalMaterial({
    color: 0xff94cb,
    roughness: 0.42,
    sheen: 0.85,
    sheenColor: new THREE.Color(0xffffff),
    envMapIntensity: 0.5
  });

  const siliconeCaseGroup = new THREE.Group();
  siliconeCaseGroup.name = 'PinkSiliconeCase';
  boardAssembly.add(siliconeCaseGroup);

  // 1. Thick Rounded Pink Silicone Bottom Tray
  const trayBaseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(outerW, outerD, 0.72), {
    depth: 0.36,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.10,
    bevelSegments: 5
  });
  trayBaseGeo.rotateX(-Math.PI / 2);
  trayBaseGeo.translate(0, -0.34, 0);
  const trayBaseMesh = new THREE.Mesh(trayBaseGeo, pinkSiliconeMainMat);
  trayBaseMesh.castShadow = true;
  trayBaseMesh.receiveShadow = true;
  siliconeCaseGroup.add(trayBaseMesh);

  // 2. Thick Raised Pillowy Pink Silicone Surrounding Bumper Frame (with inner cutout for the 7 rows!)
  const bumperShape = createRoundedRectShape(outerW, outerD, 0.72);
  const innerCutout = createRoundedRectShape(innerW, innerD, 0.34);
  bumperShape.holes.push(innerCutout);

  const bumperGeo = new THREE.ExtrudeGeometry(bumperShape, {
    depth: 0.62,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.12,
    bevelSegments: 6
  });
  bumperGeo.rotateX(-Math.PI / 2);
  bumperGeo.translate(0, -0.02, 0);
  const bumperMesh = new THREE.Mesh(bumperGeo, pinkSiliconeLipMat);
  bumperMesh.castShadow = true;
  bumperMesh.receiveShadow = true;
  siliconeCaseGroup.add(bumperMesh);

  // 3. Recessed Berry-Pink Silicone Floor Liner inside the case well
  const wellFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(innerW + 0.08, innerD + 0.08),
    pinkSiliconeInnerMat
  );
  wellFloor.rotation.x = -Math.PI / 2;
  wellFloor.position.y = 0.025;
  wellFloor.receiveShadow = true;
  siliconeCaseGroup.add(wellFloor);

  // 4. Cute Molded Silicone Hearts & Stars embossed along the pink silicone border!
  function createHeart3DGeometry(scale = 0.15) {
    const hs = new THREE.Shape();
    hs.moveTo(0, -0.35 * scale);
    hs.bezierCurveTo(-0.9 * scale, 0.25 * scale, -0.55 * scale, 0.9 * scale, 0, 0.42 * scale);
    hs.bezierCurveTo(0.55 * scale, 0.9 * scale, 0.9 * scale, 0.25 * scale, 0, -0.35 * scale);
    const g = new THREE.ExtrudeGeometry(hs, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 3
    });
    g.rotateX(-Math.PI / 2);
    g.center();
    return g;
  }

  const miniHeartGeo = createHeart3DGeometry(0.18);
  const miniBeadGeo = new THREE.SphereGeometry(0.085, 12, 10);

  // Molded hearts on top and bottom pink silicone rims
  [-1.6, 0, 1.6].forEach((hx, idx) => {
    [-1, 1].forEach((sideZ) => {
      const hMesh = new THREE.Mesh(idx === 1 ? miniHeartGeo : miniBeadGeo, pinkSiliconeEmbossMat);
      hMesh.position.set(hx, 0.745, sideZ * (innerD * 0.5 + wallThickness * 0.52));
      if (idx !== 1) hMesh.scale.set(1.2, 0.45, 1.2);
      siliconeCaseGroup.add(hMesh);
    });
  });

  // Molded tiny pastel row-marker silicone hearts along the left & right edges (1 for each of the 7 rows!)
  for (let r = 0; r < NUM_ROWS; r++) {
    const rz = (r - (NUM_ROWS - 1) / 2) * KEY_PITCH;
    const rowDotMat = new THREE.MeshPhysicalMaterial({
      color: ROW_THEMES[r].housingHex,
      roughness: 0.35,
      sheen: 0.6,
      emissive: new THREE.Color(ROW_THEMES[r].ledHex),
      emissiveIntensity: 0.12
    });
    [-1, 1].forEach((sideX) => {
      const dot = new THREE.Mesh(miniBeadGeo, rowDotMat);
      dot.scale.set(0.95, 0.42, 0.95);
      dot.position.set(sideX * (innerW * 0.5 + wallThickness * 0.52), 0.74, rz);
      siliconeCaseGroup.add(dot);
    });
  }

  // 5. Cute Molded Pink Silicone Corner Carry Loop + Swinging 3D Pastel Heart Charm!
  const carryLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.11, 12, 24, Math.PI * 1.4),
    pinkSiliconeMainMat
  );
  carryLoop.position.set(outerW * 0.5 - 0.15, 0.28, -outerD * 0.5 + 0.15);
  carryLoop.rotation.x = Math.PI / 2;
  carryLoop.rotation.z = -Math.PI * 0.42;
  carryLoop.castShadow = true;
  siliconeCaseGroup.add(carryLoop);

  const charmPivot = new THREE.Group();
  charmPivot.position.set(outerW * 0.5 + 0.15, 0.28, -outerD * 0.5 - 0.15);
  siliconeCaseGroup.add(charmPivot);

  const charmRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 10, 20), goldGlossMat);
  charmRing.rotation.y = Math.PI * 0.25;
  charmPivot.add(charmRing);

  const beadColors = [0xffe066, 0x99e9f2, 0xd8b4fe];
  beadColors.forEach((col, i) => {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 14, 12),
      new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.2, clearcoat: 0.85 })
    );
    bead.position.set(0.18 + i * 0.24, -0.04, -0.18 - i * 0.24);
    bead.castShadow = true;
    charmPivot.add(bead);
  });

  const bigHeartCharm = new THREE.Mesh(
    createHeart3DGeometry(0.46),
    new THREE.MeshPhysicalMaterial({
      color: 0xff5ca8,
      roughness: 0.18,
      clearcoat: 0.9,
      emissive: 0xff4da6,
      emissiveIntensity: 0.16
    })
  );
  bigHeartCharm.position.set(0.98, -0.02, -0.98);
  bigHeartCharm.rotation.y = -Math.PI * 0.25;
  bigHeartCharm.castShadow = true;
  charmPivot.add(bigHeartCharm);

  let charmAngle = 0;
  let charmVel = 0;

  // ---------------------------------------------------------------------------
  // 3D Sculpted Cartoon Character Toppers Builder (makes each clicker pop in 3D!)
  // ---------------------------------------------------------------------------
  function addCharacter3DTopper(capPivot, def, capMat) {
    const accentMat = new THREE.MeshPhysicalMaterial({
      color: def.accent,
      roughness: 0.24,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2
    });
    const cheekMat = new THREE.MeshPhysicalMaterial({
      color: def.cheek,
      roughness: 0.28,
      clearcoat: 0.65
    });

    switch (def.topper) {
      case 'roundEarsBlueDots': {
        // Candy Puppy/Hamster rounded corner ears + tiny blue bows/dots!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), capMat);
          ear.scale.set(1.05, 0.78, 0.9);
          ear.position.set(s * 0.34, 0.30, -0.34);
          capPivot.add(ear);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), accentMat);
          dot.position.set(s * 0.34, 0.36, -0.29);
          capPivot.add(dot);
        });
        break;
      }
      case 'owlTufts': {
        // Mint Owl cute feathered ear tufts + tiny pink flower on forehead!
        [-1, 1].forEach((s) => {
          const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 8), capMat);
          tuft.position.set(s * 0.31, 0.35, -0.32);
          tuft.rotation.z = -s * 0.38;
          capPivot.add(tuft);
        });
        const crownDot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), cheekMat);
        crownDot.scale.set(1.2, 0.55, 1.2);
        crownDot.position.set(0, 0.35, -0.32);
        capPivot.add(crownDot);
        break;
      }
      case 'bowPuppy': {
        // Caramel Puppy rounded ears + sculpted 3D white bow on front edge!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), capMat);
          ear.scale.set(1.1, 0.7, 0.85);
          ear.position.set(s * 0.35, 0.30, -0.33);
          capPivot.add(ear);
          const bowLoop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), whiteGlossMat);
          bowLoop.scale.set(1.3, 0.65, 0.8);
          bowLoop.position.set(s * 0.09, 0.32, 0.33);
          capPivot.add(bowLoop);
        });
        const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), whiteGlossMat);
        bowKnot.position.set(0, 0.33, 0.33);
        capPivot.add(bowKnot);
        break;
      }
      case 'lambCurls': {
        // Fluffy Pink Lamb 3D scalloped wool puffs on both sides (just like 3rd-left in clickers0.jpg!)
        [-1, 1].forEach((s) => {
          [-0.22, 0.0, 0.22].forEach((zOff, idx) => {
            const puff = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), capMat);
            puff.position.set(s * 0.44, 0.14 + (idx === 1 ? 0.03 : 0), zOff);
            capPivot.add(puff);
          });
        });
        break;
      }
      case 'kittyBlossom': {
        // Sakura Pink Kitty sculpted pointed ears + tiny 3D pink cherry blossom!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.145, 0.26, 4), capMat);
          ear.position.set(s * 0.29, 0.36, -0.30);
          ear.rotation.z = -s * 0.24;
          ear.rotation.y = Math.PI / 4;
          capPivot.add(ear);
          const inner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), accentMat);
          inner.position.set(s * 0.29, 0.35, -0.26);
          inner.rotation.z = -s * 0.24;
          inner.rotation.y = Math.PI / 4;
          capPivot.add(inner);
        });
        break;
      }
      case 'glassesSprout': {
        // Cute round pink glasses frames & little green top sprout!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10), capMat);
          ear.position.set(s * 0.33, 0.31, -0.32);
          capPivot.add(ear);
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), accentMat);
          leaf.scale.set(1.4, 0.5, 0.75);
          leaf.position.set(s * 0.08, 0.37, -0.30);
          leaf.rotation.z = -s * 0.35;
          capPivot.add(leaf);
        });
        break;
      }
      case 'octoSwirls': {
        // Cerulean Octopus 3D curly tentacle nubs at front corners + glowing forehead pearl!
        [-1, 1].forEach((s) => {
          const nub = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), capMat);
          nub.scale.set(1.15, 0.75, 1.15);
          nub.position.set(s * 0.39, 0.12, 0.34);
          capPivot.add(nub);
        });
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), accentMat);
        pearl.scale.set(1.1, 0.65, 1.1);
        pearl.position.set(0, 0.36, -0.27);
        capPivot.add(pearl);
        break;
      }
      case 'spikyTufts': {
        // Lavender Cat cute spiky corner tufts & golden star!
        [-1, 1].forEach((s) => {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 6), capMat);
          spike.position.set(s * 0.30, 0.36, -0.30);
          spike.rotation.z = -s * 0.32;
          capPivot.add(spike);
        });
        const starGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), goldGlossMat);
        starGem.scale.set(1, 0.6, 1);
        starGem.position.set(0, 0.36, -0.29);
        capPivot.add(starGem);
        break;
      }
      case 'hoodCub': {
        // Milk Cub tiny round cocoa/white ears!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), s > 0 ? accentMat : capMat);
          ear.position.set(s * 0.32, 0.32, -0.32);
          capPivot.add(ear);
        });
        break;
      }
      case 'bunnyLeaf': {
        // Strawberry Bunny tall cute 3D bunny ears + tiny green leaf!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.22, 6, 10), capMat);
          ear.position.set(s * 0.22, 0.42, -0.30);
          ear.rotation.z = -s * 0.2;
          ear.rotation.x = -0.22;
          capPivot.add(ear);
        });
        const berryLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.14, 5), accentMat);
        berryLeaf.position.set(0, 0.37, -0.30);
        capPivot.add(berryLeaf);
        break;
      }
      case 'chickTuft': {
        // Sunny Chick cute bouncy 3D feather curl on top + tiny side wings!
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), capMat);
        tuft.scale.set(0.85, 1.35, 0.85);
        tuft.position.set(0, 0.38, -0.28);
        capPivot.add(tuft);
        [-1, 1].forEach((s) => {
          const wing = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), capMat);
          wing.scale.set(0.7, 0.65, 1.35);
          wing.position.set(s * 0.44, 0.14, 0.04);
          capPivot.add(wing);
        });
        break;
      }
      case 'unicornHorn': {
        // Pastel Unicorn golden spiral horn + little ears!
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 12), goldGlossMat);
        horn.position.set(0, 0.44, -0.28);
        horn.rotation.x = 0.22;
        capPivot.add(horn);
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.20, 6), capMat);
          ear.position.set(s * 0.30, 0.34, -0.31);
          ear.rotation.z = -s * 0.34;
          capPivot.add(ear);
        });
        break;
      }
      case 'axolotlGills': {
        // Mint Axolotl cute 3D pink frilly side gills!
        [-1, 1].forEach((s) => {
          [-0.14, 0.04, 0.20].forEach((zOff, i) => {
            const gill = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.12, 6, 8), accentMat);
            gill.position.set(s * 0.46, 0.18 + (i === 1 ? 0.04 : 0), zOff - 0.04);
            gill.rotation.z = s * 1.15;
            capPivot.add(gill);
          });
        });
        break;
      }
      case 'teddyCrown':
      default: {
        // Cotton-Candy Bear round 3D ears + tiny golden crown!
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), capMat);
          ear.position.set(s * 0.32, 0.32, -0.31);
          capPivot.add(ear);
        });
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.15, 6), goldGlossMat);
        crown.position.set(0, 0.38, -0.29);
        capPivot.add(crown);
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Build ALL 7 ROWS x 5 COLUMNS = 35 Mechanical Kawaii Clickers!
  // ---------------------------------------------------------------------------
  const clickers = [];
  const clickerGrid = Array.from({ length: NUM_ROWS }, () => []);
  const interactiveHitMeshes = [];
  const rowClickedMask = Array.from({ length: NUM_ROWS }, () => new Set());

  const clickersContainer = new THREE.Group();
  clickersContainer.name = 'SevenRowsOfClickers';
  boardAssembly.add(clickersContainer);

  // Curated row-by-row layout so every row looks balanced, colorful, and directly showcases clickers0.jpg!
  const GRID_CHAR_IDS = [
    ['candyPup', 'mintOwl', 'caramelBow', 'sunnyChick', 'candyPup'],
    ['mintOwl', 'mintAxolotl', 'sunnyChick', 'candyPup', 'caramelBow'],
    ['pinkLamb', 'sakuraKitty', 'strawberryBunny', 'pinkLamb', 'glassesBerry'],
    ['starOcto', 'cottonBear', 'milkCub', 'starOcto', 'mintOwl'],
    ['lilacCat', 'unicornDream', 'pinkLamb', 'lilacCat', 'sakuraKitty'],
    ['caramelBow', 'candyPup', 'strawberryBunny', 'sunnyChick', 'milkCub'],
    ['glassesBerry', 'sakuraKitty', 'unicornDream', 'cottonBear', 'strawberryBunny']
  ];

  const charById = new Map(CHARACTER_CATALOG.map((c) => [c.id, c]));

  for (let row = 0; row < NUM_ROWS; row++) {
    const rowTheme = ROW_THEMES[row];
    const z = (row - (NUM_ROWS - 1) / 2) * KEY_PITCH;

    const housingMat = new THREE.MeshPhysicalMaterial({
      color: rowTheme.housingHex,
      roughness: 0.32,
      metalness: 0.04,
      clearcoat: 0.35
    });

    for (let col = 0; col < NUM_COLS; col++) {
      const x = (col - (NUM_COLS - 1) / 2) * KEY_PITCH;
      const charId = GRID_CHAR_IDS[row][col];
      const def = charById.get(charId) || CHARACTER_CATALOG[(row * NUM_COLS + col) % CHARACTER_CATALOG.length];

      const unit = new THREE.Group();
      unit.position.set(x, 0.04, z);
      clickersContainer.add(unit);

      // 1. Pastel Interlocking Mechanical Switch Base (stays seated in pink silicone case!)
      const baseMesh = new THREE.Mesh(switchBaseGeo, housingMat);
      baseMesh.position.y = 0.16;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      unit.add(baseMesh);

      // Interlocking puzzle tabs along right/front sides (signature detail from clickers0.jpg!)
      if (col < NUM_COLS - 1) {
        const tabR = new THREE.Mesh(puzzleTabGeo, housingMat);
        tabR.position.set(0.51, 0.15, -0.18);
        unit.add(tabR);
        const tabR2 = new THREE.Mesh(puzzleTabGeo, housingMat);
        tabR2.position.set(0.51, 0.15, 0.18);
        unit.add(tabR2);
      }

      // 2. Translucent Crystal Switch Collar + RGB Pastel Underglow LED!
      const ledMat = new THREE.MeshBasicMaterial({
        color: rowTheme.ledHex,
        transparent: true,
        opacity: 0.22
      });
      const ledGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.76), ledMat);
      ledGlow.rotation.x = -Math.PI / 2;
      ledGlow.position.y = 0.335;
      unit.add(ledGlow);

      const collar = new THREE.Mesh(switchCrystalCollarGeo, clearCrystalMat);
      collar.position.y = 0.40;
      unit.add(collar);

      // 3. Moving Mechanical Switch Stem + Puffy Kawaii Keycap Group!
      const capPivot = new THREE.Group();
      const restY = 0.72;
      capPivot.position.y = restY;
      unit.add(capPivot);

      // Visible MX Cross-Stem attached to the underside of the keycap (slides down into the housing!)
      const stemMat = new THREE.MeshStandardMaterial({
        color: rowTheme.stemHex,
        emissive: new THREE.Color(rowTheme.stemHex),
        emissiveIntensity: 0.25,
        roughness: 0.25
      });
      const stemA = new THREE.Mesh(stemArmAGeo, stemMat);
      stemA.position.y = -0.30;
      capPivot.add(stemA);
      const stemB = new THREE.Mesh(stemArmBGeo, stemMat);
      stemB.position.y = -0.30;
      capPivot.add(stemB);

      // Glossy Puffy Cushion Keycap Body
      const capMat = new THREE.MeshPhysicalMaterial({
        color: def.hex,
        roughness: 0.24,
        metalness: 0.0,
        clearcoat: 0.72,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.62,
        emissive: new THREE.Color(def.hex),
        emissiveIntensity: 0.02
      });
      const capMesh = new THREE.Mesh(puffyKeycapGeo, capMat);
      capMesh.castShadow = true;
      capMesh.receiveShadow = true;
      capPivot.add(capMesh);

      // Domed Glossy Kawaii Cartoon Face seamlessly hugging the top cushion!
      const faceMat = new THREE.MeshPhysicalMaterial({
        map: createKawaiiFaceTexture(def),
        roughness: 0.22,
        metalness: 0.0,
        clearcoat: 0.78,
        clearcoatRoughness: 0.16,
        envMapIntensity: 0.58
      });
      const faceCap = new THREE.Mesh(domedFaceGeo, faceMat);
      capPivot.add(faceCap);

      // Sculpted 3D Character Topper (ears, bows, curls, glasses, swirls, horns!)
      addCharacter3DTopper(capPivot, def, capMat);

      // Generous Clickable Hitbox so taps & glides ALWAYS register effortlessly!
      const hitMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.04, 1.10, 1.04),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.position.y = 0.68;
      unit.add(hitMesh);

      const entry = {
        index: row * NUM_COLS + col,
        row,
        col,
        def,
        rowTheme,
        unit,
        capPivot,
        capMat,
        ledMat,
        hitMesh,
        restY,
        isHeld: false,
        pressDepth: 0,
        pressVel: 0,
        targetDepth: 0,
        ledGlowEnergy: 0,
        wigglePhase: 0,
        wiggleAmp: 0,
        hovered: false,
        idleSeed: Math.random() * Math.PI * 2,
        waveDelay: -1,
        xrPokeCooldown: 0
      };

      hitMesh.userData = { clicker: entry };
      interactiveHitMeshes.push(hitMesh);
      clickers.push(entry);
      clickerGrid[row][col] = entry;

      const keyCode = KEYBOARD_GRID_CODES[row]?.[col];
      if (keyCode) {
        codeToKeyEntry.set(keyCode, entry);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3D Procedural Sparkle / Heart / Star Particle Burst on Every Click!
  // ---------------------------------------------------------------------------
  const activeParticles = [];
  const particleHeartGeo = createHeart3DGeometry(0.24);
  const particleStarGeo = new THREE.OctahedronGeometry(0.085, 0);
  const particlePalette = [0xff6fb5, 0xffe066, 0x7dd3fc, 0x86efac, 0xd8b4fe, 0xffffff];

  function spawnClickBurst(entry, count = 7) {
    const origin = new THREE.Vector3();
    entry.capPivot.getWorldPosition(origin);
    origin.y += 0.36;

    for (let i = 0; i < count; i++) {
      const col = i === 0 ? entry.rowTheme.ledHex : particlePalette[Math.floor(Math.random() * particlePalette.length)];
      const isHeart = i % 2 === 0;
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(isHeart ? particleHeartGeo : particleStarGeo, mat);
      mesh.position.copy(origin);
      mesh.scale.setScalar(0.55 + Math.random() * 0.55);
      scene.add(mesh);

      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = 1.0 + Math.random() * 1.9;
      activeParticles.push({
        mesh,
        mat,
        vel: new THREE.Vector3(Math.cos(ang) * spd, 2.2 + Math.random() * 2.2, Math.sin(ang) * spd),
        spin: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9),
        age: 0,
        maxAge: 0.65 + Math.random() * 0.35
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Procedural Silicone Case Shockwave & Mechanical Key Press / Release Engine!
  // ---------------------------------------------------------------------------
  let caseBounceY = 0;
  let caseBounceVel = 0;
  let caseTiltX = 0;
  let caseTiltZ = 0;

  function triggerRainbowWave(originRow = 3, originCol = 2) {
    audio.unlock();
    audio.playRainbowWaveChime();
    state.waveActiveCount += 1;
    charmVel += 6.5;

    for (let i = 0; i < clickers.length; i++) {
      const k = clickers[i];
      const dist = Math.hypot(k.row - originRow, k.col - originCol);
      k.waveDelay = dist * 0.055;
    }
  }

  function pressClicker(entry, { silentWave = false, hold = true } = {}) {
    if (!entry) return;
    audio.unlock();

    // Already held down? Don't double-fire!
    if (hold && entry.isHeld) return;

    if (hold) {
      entry.isHeld = true;
      entry.targetDepth = 0.23; // Crisp mechanical bottom-out travel!
    } else {
      entry.targetDepth = 0;
    }

    // Immediate snappy downward mechanical impulse
    entry.pressDepth = Math.max(entry.pressDepth, 0.14);
    entry.pressVel = 2.6;
    entry.ledGlowEnergy = 1.0;
    entry.wiggleAmp = 0.11;
    entry.wigglePhase = 0;

    // Tactile sound!
    audio.playKeyDown(entry.row, entry.col, NUM_COLS, silentWave);

    // Subtle mobile haptics!
    if (!silentWave && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch (_) {}
    }

    // Soft Pink Silicone Case tactile micro-cushion recoil & tilt!
    caseBounceVel -= silentWave ? 0.18 : 0.72;
    caseTiltX += ((entry.row - 3) / 3) * (silentWave ? 0.002 : 0.011);
    caseTiltZ -= ((entry.col - 2) / 2) * (silentWave ? 0.002 : 0.011);
    charmVel += (Math.random() > 0.5 ? 1 : -1) * (silentWave ? 0.9 : 3.2);

    // Sympathy ripple into neighboring keys!
    const neighbors = [
      [entry.row - 1, entry.col],
      [entry.row + 1, entry.col],
      [entry.row, entry.col - 1],
      [entry.row, entry.col + 1]
    ];
    neighbors.forEach(([nr, nc]) => {
      const nb = clickerGrid[nr]?.[nc];
      if (nb && !nb.isHeld) {
        nb.pressVel += 0.45;
        nb.wiggleAmp = Math.max(nb.wiggleAmp, 0.035);
      }
    });

    spawnClickBurst(entry, silentWave ? 3 : 7);

    if (!silentWave) {
      state.totalClicks += 1;
      const nowMs = performance.now();
      state.comboCount = nowMs - state.lastClickTime < 1500 ? state.comboCount + 1 : 1;
      state.lastClickTime = nowMs;

      saveStats();
      syncHud(true);

      // Track row completion -> celebratory Rainbow Wave across the 7 rows!
      const rowSet = rowClickedMask[entry.row];
      rowSet.add(entry.col);
      if (rowSet.size === NUM_COLS) {
        rowSet.clear();
        triggerRainbowWave(entry.row, entry.col);
      }
    }
  }

  function releaseClicker(entry) {
    if (!entry || !entry.isHeld) return;
    entry.isHeld = false;
    entry.targetDepth = 0;
    entry.pressVel = -2.8; // Snappy mechanical spring return!
    audio.playKeyUp(entry.row, entry.col, NUM_COLS);
  }

  // ---------------------------------------------------------------------------
  // Pointer / Multi-Touch Drag-Strumming + OrbitControls Smart Separation!
  // Clicking/dragging ON a clicker presses & strums across keys; dragging OUTSIDE orbits!
  // ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const activePointerKeys = new Map(); // pointerId -> currently held clicker entry
  let hoveredClicker = null;

  function setPointerNdc(e) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  }

  function pickClickerAtEvent(e) {
    setPointerNdc(e);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
    if (hits.length > 0 && hits[0].object.userData.clicker) {
      return hits[0].object.userData.clicker;
    }
    return null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (state.isInXR) return;
    audio.unlock();
    const hit = pickClickerAtEvent(e);
    if (hit) {
      // Lock camera orbit while pressing/strumming across the 7 rows of clickers!
      controls.enabled = false;
      activePointerKeys.set(e.pointerId, hit);
      pressClicker(hit, { hold: true });
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    } else {
      controls.enabled = true;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (state.isInXR) return;
    const hit = pickClickerAtEvent(e);
    canvas.classList.toggle('is-hovering-target', Boolean(hit));

    if (hit !== hoveredClicker) {
      if (hoveredClicker) hoveredClicker.hovered = false;
      hoveredClicker = hit;
      if (hoveredClicker) hoveredClicker.hovered = true;
    }

    // Drag / Glide-Strumming across keys!
    if (activePointerKeys.has(e.pointerId)) {
      const prev = activePointerKeys.get(e.pointerId);
      if (hit !== prev) {
        if (prev) releaseClicker(prev);
        activePointerKeys.set(e.pointerId, hit);
        if (hit) pressClicker(hit, { hold: true });
      }
    }
  });

  function endPointer(e) {
    if (activePointerKeys.has(e.pointerId)) {
      const prev = activePointerKeys.get(e.pointerId);
      if (prev) releaseClicker(prev);
      activePointerKeys.delete(e.pointerId);
      if (activePointerKeys.size === 0 && !state.isInXR) {
        controls.enabled = true;
      }
    }
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('lostpointercapture', endPointer);

  // Physical Keyboard Support (type right on the 35 kawaii clickers + Spacebar for Rainbow Wave!)
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      triggerRainbowWave(3, 2);
      return;
    }
    const entry = codeToKeyEntry.get(e.code);
    if (entry) {
      e.preventDefault();
      pressClicker(entry, { hold: true });
    }
  });

  window.addEventListener('keyup', (e) => {
    const entry = codeToKeyEntry.get(e.code);
    if (entry) {
      releaseClicker(entry);
    }
  });

  // Top Bar Cute Buttons (Sound Mode toggle & Rainbow Wave!)
  if (btnSoundMode) {
    btnSoundMode.addEventListener('click', () => {
      audio.unlock();
      const next = !audio.getMusicalChimes();
      audio.setMusicalChimes(next);
      btnSoundMode.setAttribute('aria-pressed', String(next));
      btnSoundMode.textContent = next ? '🎵' : '⌨️';
      btnSoundMode.title = next ? 'Sparkle Thock Mode' : 'Pure Mechanical Thock Mode';
      audio.playKeyDown(3, 2, NUM_COLS, false);
    });
  }

  if (btnWave) {
    btnWave.addEventListener('click', () => {
      triggerRainbowWave(3, 2);
    });
  }

  // ---------------------------------------------------------------------------
  // Responsive Framing (All 7 Rows + Full Pink Silicone Case framed cleanly on EVERY screen!)
  // ---------------------------------------------------------------------------
  function updateResponsiveFraming() {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    const aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;

    if (!state.isInXR) {
      boardAssembly.position.set(0, 0, 0);
      boardAssembly.rotation.set(0.22, 0, 0);
      boardAssembly.scale.setScalar(1.0);

      // Dynamically calculate exact camera distance so BOTH outerW (with charm!) and outerD fit with margin
      const fovDeg = aspect < 0.75 ? 44 : 42;
      camera.fov = fovDeg;
      const vFovRad = THREE.MathUtils.degToRad(fovDeg);
      const tanHalfV = Math.tan(vFovRad / 2);
      const tanHalfH = tanHalfV * aspect;

      const reqDistH = (outerW * 0.58) / Math.max(tanHalfH, 0.12);
      const reqDistV = (outerD * 0.62) / Math.max(tanHalfV, 0.12);
      const dist = Math.max(reqDistH, reqDistV, 12.2);

      // Elevated slight-isometric viewing angle showing 3D keycap depth + all 7 rows clearly!
      const elevRad = aspect < 0.75 ? 0.96 : 0.86; // steeper on narrow phone so all 7 rows stay big
      camera.position.set(0, Math.sin(elevRad) * dist, Math.cos(elevRad) * dist);
      controls.target.set(0, 0.12, 0.05);
      camera.updateProjectionMatrix();
      controls.update();
    } else {
      camera.updateProjectionMatrix();
    }
  }

  window.addEventListener('resize', updateResponsiveFraming);
  updateResponsiveFraming();

  // ---------------------------------------------------------------------------
  // WebXR Session Management + Dual Controllers + Hand-Tracking Fingertip Poke!
  // ---------------------------------------------------------------------------
  const controllerModelFactory = new XRControllerModelFactory();
  const handModelFactory = new XRHandModelFactory();
  const xrControllers = [];
  const xrHands = [];
  const tempMatrix = new THREE.Matrix4();
  const tempFingerPos = new THREE.Vector3();
  const tempKeyPos = new THREE.Vector3();

  function raycastFromXRController(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
    return hits.length > 0 ? hits[0] : null;
  }

  function setupXRInput(slot) {
    const controller = renderer.xr.getController(slot);
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -6)
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0xff6fb5, transparent: true, opacity: 0.9 });
    controller.add(new THREE.Line(rayGeo, rayMat));

    const reticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    reticle.visible = false;
    controller.add(reticle);

    let heldKey = null;
    controller.addEventListener('selectstart', () => {
      audio.unlock();
      rayMat.color.setHex(0xffe066);
      const hit = raycastFromXRController(controller);
      if (hit && hit.object.userData.clicker) {
        heldKey = hit.object.userData.clicker;
        pressClicker(heldKey, { hold: true });
      }
    });
    controller.addEventListener('selectend', () => {
      rayMat.color.setHex(0xff6fb5);
      if (heldKey) {
        releaseClicker(heldKey);
        heldKey = null;
      }
    });

    cameraRig.add(controller);
    const grip = renderer.xr.getControllerGrip(slot);
    grip.add(controllerModelFactory.createControllerModel(grip));
    cameraRig.add(grip);

    // WebXR Hand-Tracking for physical index-finger poking of the 7 rows!
    const hand = renderer.xr.getHand(slot);
    hand.add(handModelFactory.createHandModel(hand, 'mesh'));
    cameraRig.add(hand);

    xrControllers.push({ controller, reticle });
    xrHands.push(hand);
  }

  setupXRInput(0);
  setupXRInput(1);

  let activeXrSession = null;
  async function startXRSession(mode) {
    if (!navigator.xr) return;
    audio.unlock();
    if (activeXrSession) {
      await activeXrSession.end().catch(() => {});
      return;
    }
    try {
      const session = await navigator.xr.requestSession(mode, {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });
      activeXrSession = session;
      state.isInXR = true;
      state.xrMode = mode === 'immersive-ar' ? 'ar' : 'vr';
      controls.enabled = false;

      if (state.xrMode === 'ar') {
        environmentGroup.visible = false;
        renderer.setClearAlpha(0);
      } else {
        environmentGroup.visible = true;
        renderer.setClearAlpha(1);
      }

      // Place the pink silicone 7-row clicker tray right at comfortable tabletop height in XR!
      boardAssembly.scale.setScalar(0.085);
      boardAssembly.position.set(0, 1.05, -0.52);
      boardAssembly.rotation.set(0.42, 0, 0);

      session.addEventListener('end', () => {
        activeXrSession = null;
        state.isInXR = false;
        state.xrMode = null;
        controls.enabled = true;
        environmentGroup.visible = true;
        renderer.setClearAlpha(1);
        updateResponsiveFraming();
      });

      await renderer.xr.setSession(session);
    } catch (err) {
      console.warn('[KawaiiClickerXR] XR start error:', err);
    }
  }

  async function detectWebXRSupport() {
    let vrOk = false;
    let arOk = false;
    if (navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
      [vrOk, arOk] = await Promise.all([
        navigator.xr.isSessionSupported('immersive-vr').catch(() => false),
        navigator.xr.isSessionSupported('immersive-ar').catch(() => false)
      ]);
    }
    state.vrSupported = vrOk;
    state.arSupported = arOk;
    if (btnEnterVr) btnEnterVr.hidden = !vrOk;
    if (btnEnterAr) btnEnterAr.hidden = !arOk;
  }

  if (btnEnterVr) btnEnterVr.addEventListener('click', () => startXRSession('immersive-vr'));
  if (btnEnterAr) btnEnterAr.addEventListener('click', () => startXRSession('immersive-ar'));
  detectWebXRSupport();

  // ---------------------------------------------------------------------------
  // Modern Web Guidance: Pause background WebGL loop when tab hidden or skipped
  // ---------------------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    state.paused = document.hidden && !state.isInXR;
  });

  const stageEl = document.querySelector('main.xr-stage');
  if (stageEl) {
    stageEl.addEventListener('contentvisibilityautostatechange', (event) => {
      state.paused = Boolean(event.skipped) && !state.isInXR;
    });
  }

  // Diagnostic handle for verification
  window.CalmChessClickerXR = {
    rows: NUM_ROWS,
    cols: NUM_COLS,
    clickKey: (r = 0, c = 0) => {
      const k = clickerGrid[r]?.[c];
      if (!k) return false;
      pressClicker(k, { hold: true });
      setTimeout(() => releaseClicker(k), 120);
      return true;
    },
    triggerWave: () => triggerRainbowWave(3, 2),
    getState: () => ({
      rows: NUM_ROWS,
      cols: NUM_COLS,
      totalClickers: clickers.length,
      totalClicks: state.totalClicks,
      musicalChimes: audio.getMusicalChimes(),
      waveActiveCount: state.waveActiveCount,
      webglReady: state.webglReady,
      audioState: audio.getContextState(),
      isInXR: state.isInXR
    })
  };

  // ---------------------------------------------------------------------------
  // Master XR Procedural Animation Loop
  // ---------------------------------------------------------------------------
  let simTime = 0;
  let lastTs = 0;
  let nextAutonomousWiggle = 1.8;

  renderer.setAnimationLoop((timestamp) => {
    if (state.paused) {
      lastTs = timestamp;
      return;
    }

    const rawDt = lastTs ? (timestamp - lastTs) * 0.001 : 0.016;
    lastTs = timestamp;
    const dt = Math.min(rawDt, 0.05);
    simTime += dt;

    // 1. Living Pastel Sky, Floating Clouds & Twinkling Stars
    skyUniforms.uTime.value = simTime;
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      cl.group.position.y = cl.baseY + Math.sin(simTime * 0.65 + cl.phase) * 0.28;
    }
    const sArr = starGeo.attributes.position.array;
    for (let i = 0; i < ambientStarCount; i++) {
      sArr[i * 3 + 1] += dt * 0.14;
      sArr[i * 3] += Math.sin(simTime * 0.8 + starSeed[i]) * dt * 0.07;
      if (sArr[i * 3 + 1] > 6.8) sArr[i * 3 + 1] = 0.2;
    }
    starGeo.attributes.position.needsUpdate = true;

    // 2. Soft Pink Silicone Case Procedural Cushion Physics & Swinging Charm!
    const caseForce = -110 * caseBounceY - 12 * caseBounceVel;
    caseBounceVel += caseForce * dt;
    caseBounceY += caseBounceVel * dt;
    caseTiltX += (0 - caseTiltX) * Math.min(1, dt * 10);
    caseTiltZ += (0 - caseTiltZ) * Math.min(1, dt * 10);

    const baseRotX = state.isInXR ? 0.42 : 0.24;
    const idleFloatY = state.isInXR ? 1.05 : 0.0;
    boardAssembly.position.y = idleFloatY + caseBounceY + Math.sin(simTime * 1.4) * (state.isInXR ? 0.005 : 0.04);
    boardAssembly.rotation.x = baseRotX + caseTiltX;
    boardAssembly.rotation.z = caseTiltZ + Math.sin(simTime * 0.9) * 0.008;

    // Dangling 3D heart-bead charm pendulum physics!
    const charmAcc = -28 * charmAngle - 3.6 * charmVel + Math.sin(simTime * 1.8) * 0.35;
    charmVel += charmAcc * dt;
    charmAngle += charmVel * dt;
    charmPivot.rotation.y = charmAngle;
    charmPivot.rotation.z = charmAngle * 0.28;

    // 3. Cute Autonomous Toy Wiggle so the 7 rows feel playfully alive!
    nextAutonomousWiggle -= dt;
    if (nextAutonomousWiggle <= 0) {
      nextAutonomousWiggle = 1.6 + Math.random() * 1.8;
      const lucky = clickers[Math.floor(Math.random() * clickers.length)];
      if (lucky && !lucky.isHeld) {
        lucky.wiggleAmp = Math.max(lucky.wiggleAmp, 0.085);
        lucky.ledGlowEnergy = Math.max(lucky.ledGlowEnergy, 0.45);
      }
    }

    // 4. Mechanical Switch Spring-Damper + Cartoon Squash-and-Stretch on All 35 Clickers!
    for (let i = 0; i < clickers.length; i++) {
      const k = clickers[i];

      // Scheduled Rainbow Wave bounce!
      if (k.waveDelay >= 0) {
        k.waveDelay -= dt;
        if (k.waveDelay < 0) {
          pressClicker(k, { silentWave: true, hold: false });
        }
      }

      if (k.xrPokeCooldown > 0) k.xrPokeCooldown -= dt;

      // Authentic snappy mechanical keyboard switch spring-damper physics
      const stiffness = k.isHeld ? 260 : 210;
      const damping = k.isHeld ? 22 : 14;
      const err = k.pressDepth - k.targetDepth;
      const acc = -stiffness * err - damping * k.pressVel;
      k.pressVel += acc * dt;
      k.pressDepth += k.pressVel * dt;

      const clamped = Math.max(-0.045, Math.min(0.25, k.pressDepth));
      const hoverLift = k.hovered && !k.isHeld ? 0.025 : 0;
      const idleBob = Math.sin(simTime * 2.1 + k.idleSeed) * 0.006;

      k.capPivot.position.y = k.restY - clamped + hoverLift + idleBob;

      // Playful cartoon squash-and-stretch on mechanical press & rebound!
      const squashXZ = 1.0 + clamped * 0.28;
      const squashY = 1.0 - clamped * 0.24;
      k.capPivot.scale.set(squashXZ, squashY, squashXZ);

      // Cute happy character wiggle!
      if (k.wiggleAmp > 0.002) {
        k.wigglePhase += dt * 26;
        k.capPivot.rotation.z = Math.sin(k.wigglePhase) * k.wiggleAmp;
        k.capPivot.rotation.x = Math.cos(k.wigglePhase * 0.8) * k.wiggleAmp * 0.45;
        k.wiggleAmp = Math.max(0, k.wiggleAmp - dt * 0.26);
      } else {
        k.capPivot.rotation.z *= 0.85;
        k.capPivot.rotation.x *= 0.85;
      }

      // Pastel RGB Mechanical Switch Underglow Decay
      if (k.ledGlowEnergy > 0.005) {
        k.ledGlowEnergy = Math.max(0, k.ledGlowEnergy - dt * 1.9);
      }
      const baseGlow = k.hovered ? 0.42 : 0.18;
      k.ledMat.opacity = Math.min(0.95, baseGlow + k.ledGlowEnergy * 0.78);
      k.capMat.emissiveIntensity = 0.03 + k.ledGlowEnergy * 0.24 + (k.hovered ? 0.06 : 0);
    }

    // 5. Floating 3D Sparkles & Hearts Particles
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        scene.remove(p.mesh);
        p.mat.dispose();
        activeParticles.splice(i, 1);
      } else {
        p.vel.y -= 5.2 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += p.spin.x * dt;
        p.mesh.rotation.y += p.spin.y * dt;
        p.mesh.rotation.z += p.spin.z * dt;
        const life = 1 - p.age / p.maxAge;
        p.mat.opacity = Math.min(1, life * 1.4);
        p.mesh.scale.setScalar(Math.max(0.01, life * 0.95));
      }
    }

    // 6. XR Controllers + Hand-Tracking Fingertip Physical Poke Detection!
    if (state.isInXR) {
      for (let i = 0; i < xrControllers.length; i++) {
        const xc = xrControllers[i];
        const hit = raycastFromXRController(xc.controller);
        if (hit) {
          xc.reticle.visible = true;
          xc.reticle.position.set(0, 0, -hit.distance);
        } else {
          xc.reticle.visible = false;
        }
      }

      // Check WebXR hand-tracking index fingertip poking keys directly in 3D space!
      for (let h = 0; h < xrHands.length; h++) {
        const hand = xrHands[h];
        const indexTip = hand.joints && hand.joints['index-finger-tip'];
        if (indexTip && indexTip.visible) {
          indexTip.getWorldPosition(tempFingerPos);
          for (let k = 0; k < clickers.length; k++) {
            const entry = clickers[k];
            if (entry.xrPokeCooldown > 0) continue;
            entry.capPivot.getWorldPosition(tempKeyPos);
            if (tempFingerPos.distanceTo(tempKeyPos) < 0.055) {
              entry.xrPokeCooldown = 0.28;
              pressClicker(entry, { hold: false });
              setTimeout(() => audio.playKeyUp(entry.row, entry.col, NUM_COLS), 70);
            }
          }
        }
      }
    } else {
      controls.update();
    }

    renderer.render(scene, camera);
  });
})();
