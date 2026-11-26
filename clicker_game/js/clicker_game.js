/**
 * Calm Chess Computers & Games — Cartoonish Mystery Box XR Clicker
 * Designed for pure playful discovery (no instructional badges, no footer controls):
 *  - 5 Tall Cartoonish Candy-Pastel Mystery Boxes
 *  - Click a Tall Mystery Box -> lid flips open and a crinkly metallic SILVER FOIL PACKAGE pops out!
 *  - Click (or swipe!) the Silver Package to RIP it open (half-rip crinkle -> full rip burst!)
 *  - If the ripped silver package says "MOOOOOOO!":
 *      * You win $1,000 (fluttering 3D $1,000 bills + pastel stars & hearts!)
 *      * You win a SUPER CUTE CARTOONISH 3D KEYBOARD CLICKER KEY (mounted on a working mechanical switch!)
 *      * Click the cartoonish keyboard clicker key (while celebrating OR anytime on your foreground shelf!)
 *        to press the keycap down with tactile mechanical CLICK-CLACK + cute character sounds!
 *  - Full WebXR (immersive-vr + passthrough immersive-ar), Desktop & Mobile touch support.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { createClickerAudioEngine } from './clicker_audio.js';

(function initCartoonMysteryBoxXR() {
  'use strict';

  const STORAGE_STATS_KEY = 'calmchess_cartoon_clicker_v2';
  const JACKPOT_PRIZE = 1000;

  // 5 Tall Candy-Pastel Mystery Boxes arranged in a semi-circular arc
  const BOX_CONFIGS = [
    { name: 'Pink',     color: '#ff6fb5', hex: 0xff6fb5, stripe: '#fff0f7', ribbon: '#ffe066', angleDeg: -42, height: 3.55, pan: -0.72 },
    { name: 'Aqua',     color: '#4cc9f0', hex: 0x4cc9f0, stripe: '#e8f9ff', ribbon: '#ff7cc3', angleDeg: -21, height: 4.15, pan: -0.36 },
    { name: 'Sunny',    color: '#ffd166', hex: 0xffd166, stripe: '#fffbeb', ribbon: '#ff6fb5', angleDeg:   0, height: 4.75, pan:  0.00 },
    { name: 'Mint',     color: '#52e5a8', hex: 0x52e5a8, stripe: '#ecfdf5', ribbon: '#c084fc', angleDeg:  21, height: 4.15, pan:  0.36 },
    { name: 'Lavender', color: '#c084fc', hex: 0xc084fc, stripe: '#f5f3ff', ribbon: '#52e5a8', angleDeg:  42, height: 3.55, pan:  0.72 }
  ];

  // 8 Adorable Cartoonish Keyboard Clicker Keycap Prizes! (First Moo win ALWAYS awards Moo Cow!)
  const CARTOON_KEY_CATALOG = [
    { id: 'cow',     base: '#fffaf0', hex: 0xfffaf0, accent: '#ff8ec7', stem: 0xff8ec7, cheek: '#ff9ec9', topper: 'cow' },
    { id: 'kitty',   base: '#ffb3de', hex: 0xffb3de, accent: '#ff5ca8', stem: 0xff5ca8, cheek: '#ff6ba8', topper: 'kitty' },
    { id: 'unicorn', base: '#e4c7ff', hex: 0xe4c7ff, accent: '#ffd700', stem: 0xc084fc, cheek: '#ff99cc', topper: 'unicorn' },
    { id: 'bunny',   base: '#ffd8be', hex: 0xffd8be, accent: '#ff8fa3', stem: 0xff9f68, cheek: '#ff88a8', topper: 'bunny' },
    { id: 'froggy',  base: '#9ef0b8', hex: 0x9ef0b8, accent: '#34d399', stem: 0x34d399, cheek: '#ff94b8', topper: 'froggy' },
    { id: 'teddy',   base: '#ffd98e', hex: 0xffd98e, accent: '#c08242', stem: 0xf59e0b, cheek: '#ff8da1', topper: 'teddy' },
    { id: 'crown',   base: '#fff08a', hex: 0xfff08a, accent: '#ff6fb5', stem: 0xffd700, cheek: '#ff8ac0', topper: 'crown' },
    { id: 'rainbow', base: '#a5e8ff', hex: 0xa5e8ff, accent: '#ff6fb5', stem: 0x38bdf8, cheek: '#ff8ec7', topper: 'rainbow' }
  ];

  // Minimal HUD references (only cash + won keys count + hidden WebXR buttons)
  const canvas = document.getElementById('xr-canvas');
  const cashPill = document.getElementById('cash-pill');
  const keysPill = document.getElementById('keys-pill');
  const statBankrollEl = document.getElementById('stat-bankroll');
  const statKeysEl = document.getElementById('stat-keys');
  const btnEnterVr = document.getElementById('btn-enter-vr');
  const btnEnterAr = document.getElementById('btn-enter-ar');

  const audio = createClickerAudioEngine();

  // Game State
  const state = {
    bankroll: 0,
    displayedBankroll: 0,
    wonKeys: [], // array of catalog ids
    roundNumber: 1,
    boxesOpenedThisRound: 0,
    winningBoxIndex: Math.floor(Math.random() * BOX_CONFIGS.length),
    activePackage: null, // { boxIndex, ripStage: 0|1|2, isMoo, group, topStrip, bodyGroup, ... }
    celebrationKey: null, // active big cartoonish keycap floating right after winning!
    decoyCursor: Math.floor(Math.random() * audio.DECOY_SOUNDS.length),
    isInXR: false,
    xrMode: null,
    vrSupported: false,
    arSupported: false,
    webglReady: false,
    lastHeardMoo: false,
    totalRips: 0,
    totalKeyClicks: 0
  };

  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_STATS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed.bankroll) && parsed.bankroll >= 0) {
        state.bankroll = parsed.bankroll;
        state.displayedBankroll = parsed.bankroll;
      }
      if (Array.isArray(parsed.wonKeys)) {
        state.wonKeys = parsed.wonKeys.filter((id) => CARTOON_KEY_CATALOG.some((c) => c.id === id)).slice(0, 24);
      }
    } catch (_) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(
        STORAGE_STATS_KEY,
        JSON.stringify({
          bankroll: state.bankroll,
          wonKeys: state.wonKeys
        })
      );
    } catch (_) {}
  }

  function formatDollars(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function syncTopHud(popCash = false, popKeys = false) {
    if (statBankrollEl) statBankrollEl.textContent = formatDollars(state.displayedBankroll);
    if (statKeysEl) statKeysEl.textContent = String(state.wonKeys.length);
    if (popCash && cashPill) {
      cashPill.classList.remove('is-pop');
      void cashPill.offsetWidth;
      cashPill.classList.add('is-pop');
    }
    if (popKeys && keysPill) {
      keysPill.classList.remove('is-pop');
      void keysPill.offsetWidth;
      keysPill.classList.add('is-pop');
    }
  }

  loadStats();
  syncTopHud(false, false);

  // ---------------------------------------------------------------------------
  // WebGL / Three.js WebXR Setup
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
    console.warn('[CartoonClickerXR] WebGL unavailable:', err);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  const scene = new THREE.Scene();
  const baseFog = new THREE.FogExp2(0x1e1342, 0.016);
  scene.fog = baseFog;

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 140);
  camera.position.set(0, 3.0, 9.8);

  const cameraRig = new THREE.Group();
  cameraRig.name = 'XRCameraRig';
  cameraRig.add(camera);
  scene.add(cameraRig);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 5.0;
  controls.maxDistance = 18.0;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.target.set(0, 2.15, -3.2);

  // Bright, dreamy candy-studio lighting (makes silver foil glint & pastel cartoon keys shine!)
  const hemiLight = new THREE.HemisphereLight(0xffe9fb, 0x3b2670, 1.05);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.55);
  keyLight.position.set(5, 12, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9;
  keyLight.shadow.camera.bottom = -9;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const pinkRim = new THREE.DirectionalLight(0xff8ed4, 0.78);
  pinkRim.position.set(-8, 7, 5);
  scene.add(pinkRim);

  const aquaRim = new THREE.DirectionalLight(0x7dd3fc, 0.72);
  aquaRim.position.set(8, 6, -6);
  scene.add(aquaRim);

  // Crisp studio reflections for the shiny SILVER FOIL package!
  const foilSpecLight = new THREE.PointLight(0xffffff, 2.8, 20, 1.1);
  foilSpecLight.position.set(1.8, 4.4, 4.2);
  scene.add(foilSpecLight);

  // Procedural Bright Studio Environment Map so metallic silver foil & gold chrome gleam brightly!
  {
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ectx = envCanvas.getContext('2d');
    const eg = ectx.createLinearGradient(0, 0, 0, 256);
    eg.addColorStop(0.0, '#ffffff');
    eg.addColorStop(0.32, '#e8f4ff');
    eg.addColorStop(0.55, '#ffe8f7');
    eg.addColorStop(0.82, '#c8d6f5');
    eg.addColorStop(1.0, '#7c65b8');
    ectx.fillStyle = eg;
    ectx.fillRect(0, 0, 512, 256);
    // Bright specular studio softbox panels for crisp foil highlights
    ectx.fillStyle = '#ffffff';
    ectx.fillRect(60, 28, 120, 68);
    ectx.fillRect(310, 36, 140, 74);
    ectx.fillStyle = '#fff5d6';
    ectx.fillRect(190, 118, 130, 44);

    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(envTex).texture;
    envTex.dispose();
    pmrem.dispose();
  }

  // ---------------------------------------------------------------------------
  // Procedural Texture Generators (Cartoon Toy Aesthetic + Crinkly Silver Foil)
  // ---------------------------------------------------------------------------
  function createSparkleTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,220,245,0.55)') {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    g.addColorStop(0.0, inner);
    g.addColorStop(0.35, mid);
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    // Cute 4-point star glimmer
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.quadraticCurveTo(68, 60, 114, 64);
    ctx.quadraticCurveTo(68, 68, 64, 114);
    ctx.quadraticCurveTo(60, 68, 14, 64);
    ctx.quadraticCurveTo(60, 60, 64, 14);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createPastelFloorTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    const tile = 64;
    for (let y = 0; y < 512; y += tile) {
      for (let x = 0; x < 512; x += tile) {
        const alt = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = alt ? '#2a1b54' : '#211445';
        ctx.fillRect(x, y, tile, tile);
        ctx.strokeStyle = 'rgba(255, 182, 232, 0.16)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7, 7);
    return tex;
  }

  /**
   * Tall Cartoonish Mystery Gift Box texture: polka dots, vertical pastel ribbon, bubbly '?'
   */
  function createCartoonBoxTexture(baseColor, stripeColor, ribbonColor) {
    const w = 512;
    const h = 1024;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');

    // Candy pastel gradient fill
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, baseColor);
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle glossy vertical stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let x = 0; x < w; x += 64) {
      ctx.fillRect(x, 0, 26, h);
    }

    // Playful scattered polka dots & mini stars
    ctx.fillStyle = stripeColor;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = 48 + col * 104 + (row % 2 === 0 ? 0 : 48);
        const cy = 44 + row * 84;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Vertical glossy satin gift ribbon stripe down the middle
    ctx.fillStyle = ribbonColor;
    ctx.fillRect(w / 2 - 42, 0, 84, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(w / 2 - 42, -6, 84, h + 12);

    // Cute cartoon border outline
    ctx.strokeStyle = '#3b1d5e';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    // Two bubbly cartoon '?' sticker medallions stacked on the tall box (aspect-compensated to stay perfectly round!)
    [310, 715].forEach((cy) => {
      ctx.save();
      ctx.translate(w / 2, cy);
      ctx.scale(1.36, 0.72);
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath();
      ctx.arc(0, 0, 108, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#3b1d5e';
      ctx.stroke();

      ctx.lineWidth = 6;
      ctx.strokeStyle = ribbonColor;
      ctx.beginPath();
      ctx.arc(0, 0, 94, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '900 156px "Comic Sans MS", "Chalkboard SE", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#3b1d5e';
      ctx.strokeText('?', 0, 10);
      ctx.fillStyle = baseColor;
      ctx.fillText('?', 0, 10);
      ctx.restore();
    });

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  /**
   * Shiny Metallic Silver Blind-Bag Foil Pouch Textures (Diffuse + Crinkle Bump)
   */
  function createSilverFoilTextures() {
    const w = 512;
    const h = 640;
    const diff = document.createElement('canvas');
    diff.width = w;
    diff.height = h;
    const ctx = diff.getContext('2d');

    const bump = document.createElement('canvas');
    bump.width = w;
    bump.height = h;
    const bctx = bump.getContext('2d');

    // Mirror-like silver foil metallic gradient with gentle holographic shimmer
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0.0, '#e2e8f0');
    g.addColorStop(0.22, '#ffffff');
    g.addColorStop(0.45, '#cbd5e1');
    g.addColorStop(0.66, '#f8fafc');
    g.addColorStop(0.84, '#b8c4d4');
    g.addColorStop(1.0, '#f1f5f9');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Subtle pastel holographic foil sheen strips
    const holo = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8);
    holo.addColorStop(0.0, 'rgba(255, 160, 220, 0.14)');
    holo.addColorStop(0.35, 'rgba(160, 235, 255, 0.16)');
    holo.addColorStop(0.7, 'rgba(255, 240, 150, 0.14)');
    holo.addColorStop(1.0, 'rgba(205, 170, 255, 0.16)');
    ctx.fillStyle = holo;
    ctx.fillRect(0, 0, w, h);

    // Organic crinkle reflections on both diffuse and bump
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 48; i++) {
      const x1 = Math.random() * w;
      const y1 = Math.random() * h;
      const x2 = x1 + (Math.random() - 0.5) * 220;
      const y2 = y1 + (Math.random() - 0.5) * 220;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(100,116,139,0.16)';
      ctx.lineWidth = 3 + Math.random() * 8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      bctx.strokeStyle = i % 2 === 0 ? '#c8c8c8' : '#404040';
      bctx.lineWidth = 5 + Math.random() * 10;
      bctx.beginPath();
      bctx.moveTo(x1, y1);
      bctx.lineTo(x2, y2);
      bctx.stroke();
    }

    // Crimped vertical metallic ridges along top & bottom foil heat-seals
    [0, h - 68].forEach((sy) => {
      for (let x = 0; x < w; x += 14) {
        ctx.fillStyle = (x / 14) % 2 === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(100,116,139,0.4)';
        ctx.fillRect(x, sy, 7, 68);
        bctx.fillStyle = (x / 14) % 2 === 0 ? '#ffffff' : '#181818';
        bctx.fillRect(x, sy, 7, 68);
      }
    });

    // Subtle tear-seam dashed line near top (visual affordance only — zero text!)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
    ctx.lineWidth = 5;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(16, 84);
    ctx.lineTo(w - 16, 84);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cute embossed metallic sparkle '?' emblem in center of silver bag
    ctx.save();
    ctx.translate(w / 2, h * 0.52);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 114, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute star sparkles around circle
    [[-125, -85], [128, -70], [-115, 95], [122, 85]].forEach(([sx, sy]) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = '900 165px "Comic Sans MS", "Chalkboard SE", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#64748b';
    ctx.strokeText('?', 0, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('?', 0, 10);
    ctx.restore();

    const map = new THREE.CanvasTexture(diff);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;

    const bumpMap = new THREE.CanvasTexture(bump);
    bumpMap.anisotropy = 4;
    return { map, bumpMap };
  }

  /**
   * Cute Cartoon Kawaii Face Texture for the top of each Cartoonish Keyboard Clicker Keycap!
   */
  function createCartoonKeyFaceTexture(def) {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    // Glossy candy fill
    ctx.fillStyle = def.base;
    ctx.fillRect(0, 0, size, size);

    // Extra cute dairy cow spots for the Cow keycap!
    if (def.id === 'cow') {
      ctx.fillStyle = '#5c4033';
      [
        { x: 96, y: 92, rx: 72, ry: 54, rot: -0.35 },
        { x: 422, y: 108, rx: 64, ry: 48, rot: 0.4 },
        { x: 82, y: 416, rx: 58, ry: 42, rot: 0.3 },
        { x: 434, y: 406, rx: 68, ry: 48, rot: -0.25 }
      ].forEach((sp) => {
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, sp.rx, sp.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    } else if (def.id === 'rainbow') {
      // Cute pastel rainbow stripes along top
      const bands = ['#ff6fb5', '#ffd166', '#52e5a8', '#4cc9f0', '#c084fc'];
      bands.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.arc(256, 200, 175 - i * 24, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      });
    } else if (def.id === 'unicorn') {
      // Tiny sparkly pastel stars in corners
      ctx.fillStyle = '#ffd700';
      [[90, 96], [422, 96], [96, 420], [418, 420]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Soft glossy comic highlight frame
    ctx.strokeStyle = '#3b1d5e';
    ctx.lineWidth = 20;
    ctx.strokeRect(18, 18, size - 36, size - 36);

    // Big shiny cartoon eyes with dual sparkle dots!
    const drawEye = (ex, ey, wink = false) => {
      if (wink) {
        ctx.strokeStyle = '#2d1447';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ex, ey + 10, 34, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        return;
      }
      ctx.fillStyle = '#2d1447';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 36, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      // Main sparkle dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 12, ey - 14, 15, 0, Math.PI * 2);
      ctx.fill();
      // Mini bottom sparkle
      ctx.beginPath();
      ctx.arc(ex + 12, ey + 14, 7, 0, Math.PI * 2);
      ctx.fill();
    };

    const eyeY = def.id === 'cow' ? 215 : 235;
    drawEye(172, eyeY, false);
    drawEye(340, eyeY, def.id === 'kitty' || def.id === 'crown');

    // Rosy pastel cheeks
    ctx.fillStyle = def.cheek;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.ellipse(112, eyeY + 62, 38, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(400, eyeY + 62, 38, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Adorable character snout / mouth!
    if (def.id === 'cow') {
      // Big pink smiling cow snout!
      ctx.fillStyle = '#ffb5d8';
      ctx.strokeStyle = '#3b1d5e';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.ellipse(256, 336, 118, 72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = '#8b3a62';
      ctx.beginPath();
      ctx.ellipse(212, 322, 16, 12, -0.2, 0, Math.PI * 2);
      ctx.ellipse(300, 322, 16, 12, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Happy smile
      ctx.strokeStyle = '#3b1d5e';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(256, 344, 34, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (def.id === 'kitty' || def.id === 'bunny') {
      // Whiskers for kitty
      if (def.id === 'kitty') {
        ctx.strokeStyle = '#3b1d5e';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        [[64, 274, 122, 286], [60, 316, 120, 312], [448, 274, 390, 286], [452, 316, 392, 312]].forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
      }
      // Cute pink triangle nose + ":3" cat/bunny smile
      ctx.fillStyle = '#ff5ca8';
      ctx.beginPath();
      ctx.moveTo(240, 286);
      ctx.lineTo(272, 286);
      ctx.lineTo(256, 306);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#3b1d5e';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(232, 318, 24, 0.1, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(280, 318, 24, 0.15, Math.PI - 0.1);
      ctx.stroke();
    } else if (def.id === 'teddy') {
      ctx.fillStyle = '#fff3d6';
      ctx.strokeStyle = '#3b1d5e';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(256, 326, 76, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.ellipse(256, 304, 24, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3b1d5e';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(256, 326, 26, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else {
      // Big cheerful cartoon grin!
      ctx.fillStyle = '#ff6b9d';
      ctx.strokeStyle = '#3b1d5e';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(256, 294, 48, 0.12, Math.PI - 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  /**
   * Playful Cartoon Comic Pop Bubble ("MOO!" + "$1,000!")
   */
  function createMooBurstTexture() {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 384;
    const ctx = c.getContext('2d');

    // Spiky cartoon comic burst star behind text
    ctx.save();
    ctx.translate(384, 192);
    ctx.fillStyle = '#fff59d';
    ctx.strokeStyle = '#ff4da6';
    ctx.lineWidth = 14;
    ctx.beginPath();
    const spikes = 16;
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (i * Math.PI) / spikes;
      const rx = i % 2 === 0 ? 350 : 275;
      const ry = i % 2 === 0 ? 170 : 124;
      const x = Math.cos(ang) * rx;
      const y = Math.sin(ang) * ry;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Big bubbly "MOO!"
    ctx.font = '900 132px "Comic Sans MS", "Chalkboard SE", sans-serif';
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#3b1d5e';
    ctx.strokeText('MOO!', 384, 142);
    ctx.fillStyle = '#ff5ca8';
    ctx.fillText('MOO!', 384, 142);

    // Sparkling "+$1,000!"
    ctx.font = '900 84px "Comic Sans MS", "Chalkboard SE", sans-serif';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#064e3b';
    ctx.strokeText('+$1,000!', 384, 266);
    ctx.fillStyle = '#34d399';
    ctx.fillText('+$1,000!', 384, 266);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createDollarBillTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 224;
    const ctx = c.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, 512, 224);
    g.addColorStop(0, '#bbf7d0');
    g.addColorStop(0.5, '#f0fdf4');
    g.addColorStop(1, '#86efac');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 224);

    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 16;
    ctx.strokeRect(10, 10, 492, 204);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(256, 112, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = '#fffbeb';
    ctx.font = '900 48px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$1000', 256, 114);

    ctx.fillStyle = '#065f46';
    ctx.font = '900 32px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('$1000', 30, 52);
    ctx.fillText('$1000', 30, 174);
    ctx.textAlign = 'right';
    ctx.fillText('$1000', 482, 52);
    ctx.fillText('$1000', 482, 174);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Dreamy Starry Pastel Environment (hidden in AR passthrough!)
  // ---------------------------------------------------------------------------
  const environmentGroup = new THREE.Group();
  scene.add(environmentGroup);

  const skyUniforms = { uTime: { value: 0 } };
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(65, 32, 24),
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
          vec3 low = vec3(0.14, 0.08, 0.28);
          vec3 mid = vec3(0.24, 0.13, 0.44);
          vec3 hi  = vec3(0.10, 0.07, 0.24);
          vec3 col = mix(low, mid, smoothstep(0.35, 0.62, h));
          col = mix(col, hi, smoothstep(0.62, 0.96, h));

          float wave = sin(d.x * 4.5 + uTime * 0.35) * cos(d.z * 3.5 - uTime * 0.28);
          float band = smoothstep(0.12, 0.52, d.y) * smoothstep(0.88, 0.40, d.y);
          vec3 rainbow = mix(vec3(1.0, 0.48, 0.78), vec3(0.45, 0.88, 1.0), wave * 0.5 + 0.5);
          col += rainbow * band * (0.20 + 0.08 * wave);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  environmentGroup.add(skyDome);

  const floorMesh = new THREE.Mesh(
    new THREE.CircleGeometry(26, 64),
    new THREE.MeshStandardMaterial({
      map: createPastelFloorTexture(),
      roughness: 0.42,
      metalness: 0.18
    })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  environmentGroup.add(floorMesh);

  // Glowing pastel floor rings
  [
    { r: 2.8, col: 0xff8ed4, op: 0.42 },
    { r: 5.4, col: 0xffe066, op: 0.48 },
    { r: 7.4, col: 0x7dd3fc, op: 0.28 }
  ].forEach((rg) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(rg.r - 0.045, rg.r + 0.045, 72),
      new THREE.MeshBasicMaterial({ color: rg.col, transparent: true, opacity: rg.op, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    environmentGroup.add(ring);
  });

  // Floating Pastel Star Sparkles
  const sparkleTex = createSparkleTexture();
  const starCount = 150;
  const starPos = new Float32Array(starCount * 3);
  const starSeed = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 2.0 + Math.random() * 12;
    starPos[i * 3] = Math.cos(a) * rad;
    starPos[i * 3 + 1] = 0.5 + Math.random() * 8.0;
    starPos[i * 3 + 2] = Math.sin(a) * rad - 2.4;
    starSeed[i] = Math.random() * Math.PI * 2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starPoints = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      map: sparkleTex,
      size: 0.22,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(starPoints);

  // ---------------------------------------------------------------------------
  // Cartoonish 3D Keyboard Clicker Key Factory!
  // Builds a real mechanical switch base + translucent crystal housing + stem +
  // chunky rounded pastel keycap + cute kawaii face + 3D character ears/horn/crown!
  // ---------------------------------------------------------------------------
  const keyFaceCache = new Map();
  function getKeyFaceTexture(def) {
    if (!keyFaceCache.has(def.id)) {
      keyFaceCache.set(def.id, createCartoonKeyFaceTexture(def));
    }
    return keyFaceCache.get(def.id);
  }

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

  const keycapCapGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.86, 0.86, 0.20), {
    depth: 0.36,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.08,
    bevelSegments: 5
  });
  keycapCapGeo.rotateX(-Math.PI / 2);
  keycapCapGeo.center();

  const switchBaseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.92, 0.92, 0.16), {
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
  });
  switchBaseGeo.rotateX(-Math.PI / 2);
  switchBaseGeo.center();

  const cartoonOutlineMat = new THREE.MeshStandardMaterial({ color: 0x3b1d5e, roughness: 0.45, metalness: 0.1 });
  const goldToyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.22, metalness: 0.75 });
  const clearSwitchMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.55,
    transparent: true,
    opacity: 0.72
  });

  function buildCartoonKeyboardKey(def, interactiveMeta) {
    const root = new THREE.Group();
    root.name = 'CartoonKey_' + def.id;

    // 1. Translucent Mechanical Switch Housing Base (stays stationary when keycap presses down!)
    const housing = new THREE.Mesh(switchBaseGeo, clearSwitchMat);
    housing.position.y = 0.20;
    housing.castShadow = true;
    housing.receiveShadow = true;
    root.add(housing);

    // Cute colorful bottom trim plate
    const bottomPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.09, 0.96),
      new THREE.MeshStandardMaterial({ color: def.stem, roughness: 0.32, metalness: 0.15 })
    );
    bottomPlate.position.y = 0.045;
    root.add(bottomPlate);

    // Gold Keychain Loop on the corner (like real collectible fidget clicker keychains!)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 10, 22), goldToyMat);
    ring.position.set(0.56, 0.18, -0.34);
    ring.rotation.y = Math.PI * 0.25;
    root.add(ring);

    // Visible bright MX Cross-Stem peeking underneath the keycap!
    const stemMat = new THREE.MeshStandardMaterial({
      color: def.stem,
      emissive: new THREE.Color(def.stem),
      emissiveIntensity: 0.35,
      roughness: 0.25
    });
    const stemA = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.08), stemMat);
    stemA.position.y = 0.44;
    root.add(stemA);
    const stemB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.26), stemMat);
    stemB.position.y = 0.44;
    root.add(stemB);

    // 2. Pressable Cartoon Keycap Moving Group!
    const capPivot = new THREE.Group();
    const restY = 0.66;
    capPivot.position.y = restY;
    root.add(capPivot);

    const capMat = new THREE.MeshStandardMaterial({
      color: def.hex,
      roughness: 0.26,
      metalness: 0.06
    });
    const capMesh = new THREE.Mesh(keycapCapGeo, capMat);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    capPivot.add(capMesh);

    // Glossy Kawaii Cartoon Face Plate sitting flush on the top of the keycap
    const facePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.84),
      new THREE.MeshBasicMaterial({ map: getKeyFaceTexture(def) })
    );
    facePlane.rotation.x = -Math.PI / 2;
    facePlane.position.y = 0.278;
    capPivot.add(facePlane);

    // Adorable 3D Sculpted Cartoon Toppers!
    const accentMat = new THREE.MeshStandardMaterial({ color: def.accent, roughness: 0.3, metalness: 0.12 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28 });

    if (def.topper === 'cow') {
      // Cute 3D Cow Ears + Tiny Golden Horns!
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), accentMat);
        ear.scale.set(1.3, 0.55, 0.7);
        ear.position.set(side * 0.46, 0.24, -0.34);
        ear.rotation.z = -side * 0.35;
        capPivot.add(ear);

        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 10), goldToyMat);
        horn.position.set(side * 0.26, 0.37, -0.34);
        horn.rotation.z = -side * 0.32;
        capPivot.add(horn);
      });
    } else if (def.topper === 'kitty') {
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.30, 4), capMat);
        ear.position.set(side * 0.30, 0.36, -0.30);
        ear.rotation.z = -side * 0.22;
        ear.rotation.y = Math.PI / 4;
        capPivot.add(ear);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.18, 4), accentMat);
        inner.position.set(side * 0.30, 0.35, -0.25);
        inner.rotation.z = -side * 0.22;
        inner.rotation.y = Math.PI / 4;
        capPivot.add(inner);
      });
    } else if (def.topper === 'unicorn') {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.46, 12), goldToyMat);
      horn.position.set(0, 0.46, -0.28);
      horn.rotation.x = 0.2;
      capPivot.add(horn);
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 8), capMat);
        ear.position.set(side * 0.32, 0.35, -0.30);
        ear.rotation.z = -side * 0.35;
        capPivot.add(ear);
      });
    } else if (def.topper === 'bunny') {
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 8, 12), capMat);
        ear.position.set(side * 0.23, 0.48, -0.28);
        ear.rotation.z = -side * 0.18;
        ear.rotation.x = -0.15;
        capPivot.add(ear);
        const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.24, 6, 10), accentMat);
        inner.position.set(side * 0.23, 0.48, -0.22);
        inner.rotation.z = -side * 0.18;
        inner.rotation.x = -0.15;
        capPivot.add(inner);
      });
    } else if (def.topper === 'froggy') {
      [-1, 1].forEach((side) => {
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), capMat);
        bump.position.set(side * 0.27, 0.34, -0.28);
        capPivot.add(bump);
        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), whiteMat);
        sclera.position.set(side * 0.27, 0.37, -0.18);
        capPivot.add(sclera);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), cartoonOutlineMat);
        pupil.position.set(side * 0.27, 0.38, -0.10);
        capPivot.add(pupil);
      });
    } else if (def.topper === 'teddy') {
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), capMat);
        ear.position.set(side * 0.34, 0.35, -0.30);
        capPivot.add(ear);
        const inEar = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), accentMat);
        inEar.position.set(side * 0.34, 0.35, -0.21);
        capPivot.add(inEar);
      });
    } else if (def.topper === 'crown') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.24, 6), goldToyMat);
      crown.position.set(0, 0.38, -0.24);
      capPivot.add(crown);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), accentMat);
      gem.position.set(0, 0.42, -0.06);
      capPivot.add(gem);
    } else {
      // Puffy 3D Rainbow Arch topper!
      const archColors = [0xff6fb5, 0xffd166, 0x52e5a8, 0x4cc9f0];
      archColors.forEach((col, i) => {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(0.32 - i * 0.05, 0.032, 8, 20, Math.PI),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.25 })
        );
        arc.position.set(0, 0.26, -0.26);
        capPivot.add(arc);
      });
    }

    // Generous invisible click hitbox so 7-year-old clicks ALWAYS register cleanly!
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 1.15, 1.18),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.y = 0.55;
    hitBox.userData = interactiveMeta;
    root.add(hitBox);

    root.userData = {
      def,
      capPivot,
      restY,
      hitBox,
      pressOffset: 0,
      pressVel: 0
    };

    return root;
  }

  // ---------------------------------------------------------------------------
  // 3D Crinkly Shiny Silver Foil Package Factory (pops out of the Tall Box!)
  // ---------------------------------------------------------------------------
  const silverFoilTex = createSilverFoilTextures();
  const silverFoilMat = new THREE.MeshStandardMaterial({
    map: silverFoilTex.map,
    bumpMap: silverFoilTex.bumpMap,
    bumpScale: 0.04,
    color: 0xffffff,
    metalness: 0.72,
    roughness: 0.22,
    envMapIntensity: 1.45,
    emissive: new THREE.Color(0xc8d4e6),
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide
  });

  function createInflatedFoilPillowGeometry(w, h, bulge) {
    const geo = new THREE.BoxGeometry(w, h, 0.08, 14, 18, 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const nx = x / (w * 0.5);
      const ny = y / (h * 0.5);
      // Smooth pillow puff in center, pinched flat at top/bottom crimp seals & sides!
      const puff = Math.max(0, Math.cos(nx * Math.PI * 0.48) * Math.cos(ny * Math.PI * 0.48));
      const crinkle = Math.sin(x * 13 + y * 9) * 0.012 + Math.cos(y * 17 - x * 7) * 0.009;
      const signZ = z >= 0 ? 1 : -1;
      pos.setZ(i, z + signZ * (puff * bulge + crinkle));
    }
    geo.computeVertexNormals();
    return geo;
  }

  const pouchBodyGeo = createInflatedFoilPillowGeometry(1.28, 1.46, 0.28);
  const tearStripGeo = new THREE.BoxGeometry(1.32, 0.28, 0.08, 12, 3, 1);
  // Subtle serrated zigzag notches on left/right edges of top tear strip
  {
    const tp = tearStripGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i);
      const y = tp.getY(i);
      if (Math.abs(y) > 0.10) {
        tp.setY(i, y + Math.sin(x * 38) * 0.022);
      }
    }
    tearStripGeo.computeVertexNormals();
  }

  function buildSilverPackageMesh(boxIndex, isMoo) {
    const group = new THREE.Group();
    group.name = 'SilverFoilPackage';

    const bodyMesh = new THREE.Mesh(pouchBodyGeo, silverFoilMat);
    bodyMesh.position.y = -0.12;
    bodyMesh.castShadow = true;
    bodyMesh.userData = { action: 'ripPackage' };
    group.add(bodyMesh);

    // Inner bright golden/pastel mystery light glow hidden inside the top of the pouch!
    const peekGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 0.22),
      new THREE.MeshBasicMaterial({
        color: isMoo ? 0xffe066 : 0xff9de2,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      })
    );
    peekGlow.position.set(0, 0.62, 0.04);
    group.add(peekGlow);

    // Top Silver Foil Tear Strip (hinged on right side so first click rips left->right!)
    const topStripPivot = new THREE.Group();
    topStripPivot.position.set(0.64, 0.62, 0);
    group.add(topStripPivot);

    const topStripMesh = new THREE.Mesh(tearStripGeo, silverFoilMat);
    topStripMesh.position.set(-0.64, 0.12, 0);
    topStripMesh.castShadow = true;
    topStripMesh.userData = { action: 'ripPackage' };
    topStripPivot.add(topStripMesh);

    // Generous invisible hitbox covering the whole silver package for effortless clicking/swiping
    const hitProxy = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 2.15, 0.95),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitProxy.position.y = 0.05;
    hitProxy.userData = { action: 'ripPackage' };
    group.add(hitProxy);

    return {
      boxIndex,
      isMoo,
      ripStage: 0, // 0 = sealed, 1 = half-ripped, 2 = ripped open!
      group,
      bodyMesh,
      topStripPivot,
      topStripMesh,
      peekGlow,
      hitProxy,
      interactiveList: [bodyMesh, topStripMesh, hitProxy],
      popProgress: 0,
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      shake: 0,
      stripFlyVel: new THREE.Vector3(),
      stripDetached: false,
      dismissTimer: -1
    };
  }

  // ---------------------------------------------------------------------------
  // Build the 5 Tall Cartoonish Mystery Boxes!
  // ---------------------------------------------------------------------------
  const interactiveMeshes = [];
  const boxes = [];
  const activeBills = [];
  const activeConfetti = [];
  const activeDecoyPops = [];
  const activeSpeechPopups = [];
  const shelfKeyObjects = [];

  const arenaGroup = new THREE.Group();
  scene.add(arenaGroup);

  const ARC_RADIUS = 5.6;
  const ARC_CENTER_Z = 0.55;

  BOX_CONFIGS.forEach((cfg, index) => {
    const rad = THREE.MathUtils.degToRad(cfg.angleDeg);
    const bx = Math.sin(rad) * ARC_RADIUS;
    const bz = ARC_CENTER_Z - Math.cos(rad) * ARC_RADIUS;

    const unit = new THREE.Group();
    unit.position.set(bx, 0, bz);
    unit.lookAt(0, 0, ARC_CENTER_Z + 1.8);
    arenaGroup.add(unit);

    // Cute Pastel Pedestal Cushion
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.84, 0.96, 0.24, 16),
      new THREE.MeshStandardMaterial({ color: 0xfff5fb, roughness: 0.35, metalness: 0.1 })
    );
    ped.position.y = 0.12;
    ped.receiveShadow = true;
    ped.castShadow = true;
    unit.add(ped);

    const pedTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.90, 0.04, 10, 32),
      new THREE.MeshBasicMaterial({ color: cfg.hex })
    );
    pedTrim.rotation.x = Math.PI / 2;
    pedTrim.position.y = 0.24;
    unit.add(pedTrim);

    // TALL CARTOON MYSTERY BOX BODY
    const boxPivot = new THREE.Group();
    boxPivot.position.y = 0.24;
    unit.add(boxPivot);

    const boxH = cfg.height;
    const boxW = 1.14;
    const boxD = 1.14;
    const boxTex = createCartoonBoxTexture(cfg.color, cfg.stripe, cfg.ribbon);

    const boxMat = new THREE.MeshStandardMaterial({
      map: boxTex,
      roughness: 0.32,
      metalness: 0.08,
      emissive: new THREE.Color(cfg.hex),
      emissiveIntensity: 0.06
    });
    const boxBody = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), boxMat);
    boxBody.position.y = boxH * 0.5;
    boxBody.castShadow = true;
    boxBody.receiveShadow = true;
    boxBody.userData = { action: 'openBox', boxIndex: index };
    boxPivot.add(boxBody);
    interactiveMeshes.push(boxBody);

    // Soft glowing interior top plane (shines out when lid pops open!)
    const innerGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff5b8, transparent: true, opacity: 0.2 });
    const innerGlow = new THREE.Mesh(new THREE.PlaneGeometry(boxW * 0.86, boxD * 0.86), innerGlowMat);
    innerGlow.rotation.x = -Math.PI / 2;
    innerGlow.position.y = boxH + 0.008;
    boxPivot.add(innerGlow);

    // Hinged Gift Box Lid + Big Cute Cartoon Satin Bow on top!
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, boxH, -boxD * 0.5);
    boxPivot.add(lidPivot);

    const lidMat = new THREE.MeshStandardMaterial({
      color: cfg.hex,
      roughness: 0.28,
      metalness: 0.08
    });
    const lidSlab = new THREE.Mesh(new THREE.BoxGeometry(boxW + 0.16, 0.26, boxD + 0.16), lidMat);
    lidSlab.position.set(0, 0.13, boxD * 0.5);
    lidSlab.castShadow = true;
    lidSlab.userData = { action: 'openBox', boxIndex: index };
    lidPivot.add(lidSlab);
    interactiveMeshes.push(lidSlab);

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: cfg.ribbon,
      roughness: 0.25,
      metalness: 0.22
    });
    // Cross ribbons on lid
    const rStripA = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, boxD + 0.18), ribbonMat);
    rStripA.position.set(0, 0.135, boxD * 0.5);
    lidPivot.add(rStripA);
    const rStripB = new THREE.Mesh(new THREE.BoxGeometry(boxW + 0.18, 0.28, 0.24), ribbonMat);
    rStripB.position.set(0, 0.135, boxD * 0.5);
    lidPivot.add(rStripB);

    // Big Puffy Cartoon Gift Bow Loops!
    [-1, 1].forEach((side) => {
      const bowLoop = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.075, 10, 20), ribbonMat);
      bowLoop.position.set(side * 0.21, 0.42, boxD * 0.5);
      bowLoop.rotation.z = -side * 0.45;
      bowLoop.scale.set(1.15, 0.8, 0.8);
      lidPivot.add(bowLoop);
    });
    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), ribbonMat);
    bowKnot.position.set(0, 0.34, boxD * 0.5);
    lidPivot.add(bowKnot);

    boxes.push({
      index,
      cfg,
      unit,
      boxPivot,
      boxMat,
      lidPivot,
      innerGlowMat,
      boxHeight: boxH,
      lidAngle: 0,
      lidTarget: 0,
      shake: 0,
      hovered: false,
      openedThisRound: false
    });
  });

  // ---------------------------------------------------------------------------
  // Foreground 3D Collectible Cartoonish Clicker Key Display Shelf!
  // Every won Cartoonish Keyboard Clicker Key lands here and stays clickable forever!
  // ---------------------------------------------------------------------------
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(0, 0.22, 1.35);
  scene.add(shelfGroup);

  const shelfBase = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 0.16, 1.25),
    new THREE.MeshStandardMaterial({
      color: 0x3b2475,
      roughness: 0.32,
      metalness: 0.25,
      emissive: 0x24124d,
      emissiveIntensity: 0.4
    })
  );
  shelfBase.position.y = -0.08;
  shelfBase.receiveShadow = true;
  shelfBase.visible = false; // Appears automatically the moment she wins her first key!
  shelfGroup.add(shelfBase);

  function addKeyToForegroundShelf(keyId, animateIn = false) {
    const def = CARTOON_KEY_CATALOG.find((c) => c.id === keyId) || CARTOON_KEY_CATALOG[0];
    shelfBase.visible = true;

    const slotCount = shelfKeyObjects.length;
    if (slotCount >= 8) {
      // If she already filled all 8 shelf slots, replace the oldest slot with sparkles
      const old = shelfKeyObjects.shift();
      shelfGroup.remove(old.mesh);
      const hitIdx = interactiveMeshes.indexOf(old.mesh.userData.hitBox);
      if (hitIdx >= 0) interactiveMeshes.splice(hitIdx, 1);
    }

    const slotMeta = { action: 'pressShelfKey', keyRef: null };
    const keyMesh = buildCartoonKeyboardKey(def, slotMeta);
    keyMesh.scale.setScalar(0.72);
    // Tilt nicely toward the player so every adorable cartoon face beams right out!
    keyMesh.rotation.x = 0.64;

    const entry = {
      id: def.id,
      mesh: keyMesh,
      targetX: 0,
      popScale: animateIn ? 0.1 : 0.68
    };
    slotMeta.keyRef = entry;
    shelfGroup.add(keyMesh);
    interactiveMeshes.push(keyMesh.userData.hitBox);
    shelfKeyObjects.push(entry);

    // Re-center all won cartoon keys gracefully across the foreground shelf
    const total = shelfKeyObjects.length;
    const spacing = 0.84;
    shelfKeyObjects.forEach((item, idx) => {
      item.targetX = (idx - (total - 1) / 2) * spacing;
      if (!animateIn || item !== entry) {
        item.mesh.position.set(item.targetX, 0.02, 0);
      } else {
        item.mesh.position.set(item.targetX, 1.35, -1.2);
      }
    });
  }

  // Restore any previously won cartoon keys onto the shelf on load
  state.wonKeys.slice(-8).forEach((id) => addKeyToForegroundShelf(id, false));

  // ---------------------------------------------------------------------------
  // 3D VFX Spawners: Silver Foil Shreds, Pastel Confetti, $1,000 Bills, Decoy Puffs, "MOO!" Burst
  // ---------------------------------------------------------------------------
  const billTex = createDollarBillTexture();
  const billGeo = new THREE.PlaneGeometry(0.56, 0.25, 6, 1);
  {
    const bp = billGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      bp.setZ(i, Math.sin(bp.getX(i) * 6.5) * 0.024);
    }
    billGeo.computeVertexNormals();
  }
  const billMat = new THREE.MeshStandardMaterial({ map: billTex, roughness: 0.4, side: THREE.DoubleSide });
  const mooBurstTex = createMooBurstTexture();

  function spawnConfettiBurst(origin, count = 36, silverMode = false) {
    const pastelPalette = silverMode
      ? [0xffffff, 0xe2e8f0, 0xcbd5e1, 0xf8fafc]
      : [0xff6fb5, 0xffe066, 0x52e5a8, 0x4cc9f0, 0xc084fc, 0xffffff];

    for (let i = 0; i < count; i++) {
      const col = pastelPalette[i % pastelPalette.length];
      const mesh = new THREE.Mesh(
        silverMode ? new THREE.PlaneGeometry(0.16, 0.09) : new THREE.OctahedronGeometry(0.085, 0),
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: silverMode ? 0.9 : 0.2,
          roughness: silverMode ? 0.18 : 0.3,
          emissive: new THREE.Color(col),
          emissiveIntensity: silverMode ? 0.1 : 0.35,
          side: THREE.DoubleSide
        })
      );
      mesh.position.copy(origin);
      scene.add(mesh);

      const ang = Math.random() * Math.PI * 2;
      const spd = 1.4 + Math.random() * 3.4;
      activeConfetti.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(ang) * spd, 2.0 + Math.random() * 3.6, Math.sin(ang) * spd),
        spin: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9),
        age: 0,
        maxAge: 1.4 + Math.random() * 0.9
      });
    }
  }

  function spawnDollarBills(origin, count = 56) {
    for (let i = 0; i < count; i++) {
      const bill = new THREE.Mesh(billGeo, billMat);
      bill.position.copy(origin);
      bill.position.x += (Math.random() - 0.5) * 0.7;
      bill.position.z += (Math.random() - 0.5) * 0.7;
      bill.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(bill);

      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.8;
      activeBills.push({
        mesh: bill,
        vel: new THREE.Vector3(Math.cos(ang) * spd, 2.8 + Math.random() * 4.2, Math.sin(ang) * spd),
        spin: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
        phase: Math.random() * Math.PI * 2,
        age: 0,
        maxAge: 5.0 + Math.random() * 2.2
      });
    }
  }

  function spawnMooComicPopup(origin) {
    const mat = new THREE.MeshBasicMaterial({ map: mooBurstTex, transparent: true, opacity: 1, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), mat);
    plane.position.copy(origin).add(new THREE.Vector3(0, 1.45, 0.25));
    plane.scale.setScalar(0.1);
    scene.add(plane);
    activeSpeechPopups.push({ mesh: plane, mat, age: 0, maxAge: 2.75 });
  }

  function spawnPlayfulDecoyPop(origin) {
    // Cute bouncing pastel star-cloud toy that pops out of non-moo silver packages!
    const grp = new THREE.Group();
    grp.position.copy(origin);
    const colors = [0x4cc9f0, 0xff8ed4, 0xffe066, 0x9ef0b8];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const core = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.42, 0),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.28, emissive: new THREE.Color(col), emissiveIntensity: 0.25 })
    );
    grp.add(core);
    // Cute cartoon eyes on the decoy puff!
    [-0.14, 0.14].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), cartoonOutlineMat);
      eye.position.set(ex, 0.08, 0.36);
      grp.add(eye);
    });
    scene.add(grp);
    activeDecoyPops.push({ mesh: grp, age: 0, maxAge: 1.35, startY: origin.y });
  }

  // ---------------------------------------------------------------------------
  // Core Unboxing & Ripping Flow (Zero Text Tutorials — Pure Interactive Joy!)
  // ---------------------------------------------------------------------------
  function cleanupActivePackage() {
    const pkg = state.activePackage;
    if (!pkg) return;
    pkg.interactiveList.forEach((m) => {
      const idx = interactiveMeshes.indexOf(m);
      if (idx >= 0) interactiveMeshes.splice(idx, 1);
    });
    scene.remove(pkg.group);
    state.activePackage = null;
  }

  function dockCelebrationKeyToShelf() {
    const ck = state.celebrationKey;
    if (!ck) return;
    const hitIdx = interactiveMeshes.indexOf(ck.mesh.userData.hitBox);
    if (hitIdx >= 0) interactiveMeshes.splice(hitIdx, 1);
    scene.remove(ck.mesh);
    addKeyToForegroundShelf(ck.def.id, true);
    state.celebrationKey = null;
  }

  function resetRoundBoxes(prevWinIdx) {
    const candidates = BOX_CONFIGS.map((_, i) => i).filter((i) => i !== prevWinIdx);
    state.winningBoxIndex = candidates[Math.floor(Math.random() * candidates.length)];
    state.boxesOpenedThisRound = 0;
    state.roundNumber += 1;
    boxes.forEach((b) => {
      b.openedThisRound = false;
      b.lidTarget = 0;
    });
  }

  function openTallMysteryBox(boxIndex) {
    if (boxIndex < 0 || boxIndex >= boxes.length) return;
    audio.unlock();

    // If a celebration key is still floating, dock it happily onto the foreground shelf!
    if (state.celebrationKey) {
      dockCelebrationKeyToShelf();
    }
    // If an old package is floating, close its box & remove it cleanly
    if (state.activePackage) {
      const prevBox = boxes[state.activePackage.boxIndex];
      if (prevBox) prevBox.lidTarget = 0;
      cleanupActivePackage();
    }

    const box = boxes[boxIndex];
    box.lidTarget = 2.05;
    box.shake = 0.11;

    // Decide whether the silver package inside this tall box holds the MOO!
    // Guarantees a Moo within 3 boxes at most so a 7-year-old always wins frequently!
    let isMoo = boxIndex === state.winningBoxIndex;
    if (!isMoo && !box.openedThisRound) {
      state.boxesOpenedThisRound += 1;
      if (state.boxesOpenedThisRound >= 3) {
        state.winningBoxIndex = boxIndex;
        isMoo = true;
      }
    }
    box.openedThisRound = true;

    audio.playBoxPopOpen(box.cfg.pan);

    // Spawn the Shiny Metallic Silver Foil Package rising out of the tall mystery box!
    const pkg = buildSilverPackageMesh(boxIndex, isMoo);
    const boxTopWorld = new THREE.Vector3(0, box.boxHeight + 0.1, 0);
    box.boxPivot.localToWorld(boxTopWorld);
    pkg.startPos.copy(boxTopWorld);
    pkg.group.position.copy(boxTopWorld);
    pkg.group.scale.setScalar(0.25);

    // Float right in front of the player so it's super big, shiny & fun to rip!
    pkg.targetPos.set(0, state.isInXR ? 1.55 : 2.35, state.isInXR ? -1.9 : 1.9);

    scene.add(pkg.group);
    pkg.interactiveList.forEach((m) => interactiveMeshes.push(m));
    state.activePackage = pkg;

    spawnConfettiBurst(boxTopWorld, 16, true);
  }

  function ripActiveSilverPackage(instantFullRip = false) {
    const pkg = state.activePackage;
    if (!pkg || pkg.ripStage >= 2) return;
    audio.unlock();

    const box = boxes[pkg.boxIndex];
    const pan = box ? box.cfg.pan : 0;

    if (pkg.ripStage === 0 && !instantFullRip) {
      // STAGE 1: Half-Rip! Silver top strip peels back with metallic crinkle & sparkles peek out!
      pkg.ripStage = 1;
      pkg.shake = 0.22;
      pkg.peekGlow.material.opacity = 0.85;
      audio.playFoilRip(1, pan);
      spawnConfettiBurst(pkg.group.position.clone().add(new THREE.Vector3(0, 0.72, 0.1)), 18, true);
      return;
    }

    // STAGE 2: FULL RIP OPEN! Top strip rips completely off & flies away!
    pkg.ripStage = 2;
    pkg.stripDetached = true;
    pkg.stripFlyVel.set(2.4, 3.6, 1.2);
    pkg.shake = 0.28;
    pkg.peekGlow.material.opacity = 1.0;
    state.totalRips += 1;

    audio.playFoilRip(2, pan);
    spawnConfettiBurst(pkg.group.position.clone().add(new THREE.Vector3(0, 0.65, 0.15)), 28, true);

    const revealOrigin = pkg.group.position.clone();

    if (pkg.isMoo) {
      // MOO WIN! Award a Cartoonish Keyboard Clicker Key + $1,000!
      state.lastHeardMoo = true;
      state.bankroll += JACKPOT_PRIZE;
      const nextKeyDef = CARTOON_KEY_CATALOG[state.wonKeys.length % CARTOON_KEY_CATALOG.length];
      state.wonKeys.push(nextKeyDef.id);
      saveStats();

      audio.playMoo(pan, false);
      audio.playJackpotFanfare();

      // Pop the big adorable Cartoonish Keyboard Clicker Key right out of the ripped silver pouch!
      const keyMeta = { action: 'pressCelebrationKey' };
      const bigKey = buildCartoonKeyboardKey(nextKeyDef, keyMeta);
      bigKey.position.copy(revealOrigin).add(new THREE.Vector3(0, 0.12, 0.35));
      bigKey.scale.setScalar(0.15);
      // Tilt proudly toward player so the big sparkly cartoon face beams right at her!
      bigKey.rotation.x = 0.88;
      scene.add(bigKey);
      interactiveMeshes.push(bigKey.userData.hitBox);

      state.celebrationKey = {
        def: nextKeyDef,
        mesh: bigKey,
        age: 0,
        targetScale: state.isInXR ? 0.95 : 1.48,
        clicks: 0
      };

      // Burst of $1,000 bills + pastel sparkles + comic "MOO! +$1,000!" pop!
      spawnDollarBills(revealOrigin.clone().add(new THREE.Vector3(0, 0.4, 0)), 58);
      spawnConfettiBurst(revealOrigin.clone().add(new THREE.Vector3(0, 0.35, 0)), 44, false);
      spawnMooComicPopup(revealOrigin);
      syncTopHud(true, true);

      // Ripped silver pouch drops away after 0.55s so the giant cartoonish keycap takes center stage!
      pkg.dismissTimer = 0.55;
      resetRoundBoxes(pkg.boxIndex);
    } else {
      // Non-Moo Silver Package -> playful cartoon decoy sound & cute bouncing puff!
      state.lastHeardMoo = false;
      audio.playDecoySound(state.decoyCursor++, pan);
      spawnPlayfulDecoyPop(revealOrigin.clone().add(new THREE.Vector3(0, 0.5, 0.1)));
      spawnConfettiBurst(revealOrigin.clone().add(new THREE.Vector3(0, 0.4, 0)), 22, false);
      pkg.dismissTimer = 0.95;
    }
  }

  function pressCartoonKey(keyMesh, isCelebration = false) {
    if (!keyMesh || !keyMesh.userData) return;
    audio.unlock();
    const ud = keyMesh.userData;
    ud.pressOffset = 0.22;
    ud.pressVel = -0.8;
    state.totalKeyClicks += 1;

    const slotIndex = CARTOON_KEY_CATALOG.findIndex((c) => c.id === ud.def.id);
    audio.playKeyboardKeyClick(ud.def.id, slotIndex);
    if (ud.def.id === 'cow') {
      // Pressing the won Moo Cow keyboard key gives a cute happy mini-moo!
      audio.playMoo(0, true);
    }

    const worldPos = new THREE.Vector3();
    keyMesh.getWorldPosition(worldPos);
    spawnConfettiBurst(worldPos.add(new THREE.Vector3(0, 0.55, 0)), 10, false);

    if (isCelebration && state.celebrationKey) {
      state.celebrationKey.clicks += 1;
    }
  }

  // ---------------------------------------------------------------------------
  // Pointer / Touch Raycasting (Supports Click AND Swipe-to-Rip on Silver Package!)
  // ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  let pointerDownX = 0;
  let pointerDownY = 0;
  let pointerDownTime = 0;
  let pointerStartedOnPackage = false;
  let hoveredBoxIdx = -1;

  function setPointerFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  }

  function pickInteractiveAtPointer() {
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].object.visible || hits[i].object.material?.visible === false) {
        return hits[i].object;
      }
    }
    return null;
  }

  canvas.addEventListener('pointermove', (e) => {
    if (state.isInXR) return;
    setPointerFromEvent(e);

    // Swipe-to-rip! Dragging across the shiny silver foil package rips it right open!
    if (pointerStartedOnPackage && state.activePackage && state.activePackage.ripStage < 2) {
      const swipeDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (swipeDist > 38) {
        pointerStartedOnPackage = false;
        ripActiveSilverPackage(true);
        return;
      }
    }

    const hit = pickInteractiveAtPointer();
    canvas.classList.toggle('is-hovering-target', !!hit);

    const nextHoverBox = hit && hit.userData.action === 'openBox' ? hit.userData.boxIndex : -1;
    if (nextHoverBox !== hoveredBoxIdx) {
      if (hoveredBoxIdx >= 0) boxes[hoveredBoxIdx].hovered = false;
      hoveredBoxIdx = nextHoverBox;
      if (hoveredBoxIdx >= 0) boxes[hoveredBoxIdx].hovered = true;
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    pointerDownTime = performance.now();
    setPointerFromEvent(e);
    const hit = pickInteractiveAtPointer();
    pointerStartedOnPackage = Boolean(hit && hit.userData.action === 'ripPackage');
    if (pointerStartedOnPackage) {
      // Prevent camera orbit from stealing a swipe-to-rip gesture on the silver foil package!
      controls.enabled = false;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (state.isInXR) return;
    if (!state.isInXR) controls.enabled = true;
    const wasOnPkg = pointerStartedOnPackage;
    pointerStartedOnPackage = false;

    const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
    const elapsed = performance.now() - pointerDownTime;
    if (dist > 18 && !wasOnPkg) return;
    if (elapsed > 650 && !wasOnPkg) return;

    setPointerFromEvent(e);
    const hit = pickInteractiveAtPointer();
    if (!hit) return;

    const act = hit.userData.action;
    if (act === 'ripPackage') {
      ripActiveSilverPackage(false);
    } else if (act === 'pressCelebrationKey') {
      if (state.celebrationKey) pressCartoonKey(state.celebrationKey.mesh, true);
    } else if (act === 'pressShelfKey' && hit.userData.keyRef) {
      pressCartoonKey(hit.userData.keyRef.mesh, false);
    } else if (act === 'openBox') {
      openTallMysteryBox(hit.userData.boxIndex);
    }
  });

  // Responsive Framing (Desktop & Mobile Portrait)
  function updateResponsiveFraming() {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    const aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;

    if (!state.isInXR) {
      if (aspect < 0.72) {
        camera.fov = 60;
        camera.position.set(0, 3.3, 14.2);
        controls.target.set(0, 2.2, -3.2);
      } else if (aspect < 1.15) {
        camera.fov = 52;
        camera.position.set(0, 3.1, 11.4);
        controls.target.set(0, 2.2, -3.2);
      } else {
        camera.fov = 48;
        camera.position.set(0, 2.95, 9.8);
        controls.target.set(0, 2.15, -3.2);
      }
      camera.updateProjectionMatrix();
      controls.update();
    } else {
      camera.updateProjectionMatrix();
    }
  }

  window.addEventListener('resize', updateResponsiveFraming);
  updateResponsiveFraming();

  // ---------------------------------------------------------------------------
  // WebXR Session Management & Dual Controller Raycasting
  // ---------------------------------------------------------------------------
  const controllerModelFactory = new XRControllerModelFactory();
  const xrControllers = [];
  const tempMatrix = new THREE.Matrix4();

  function raycastFromXRController(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    return hits.length > 0 ? hits[0] : null;
  }

  function setupXRController(slot) {
    const controller = renderer.xr.getController(slot);
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -10)
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0xff8ed4, transparent: true, opacity: 0.9 });
    const rayLine = new THREE.Line(rayGeo, rayMat);
    controller.add(rayLine);

    const reticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    reticle.visible = false;
    controller.add(reticle);

    controller.addEventListener('selectstart', () => {
      audio.unlock();
      rayMat.color.setHex(0xffe066);
      const hit = raycastFromXRController(controller);
      if (!hit) return;
      const act = hit.object.userData.action;
      if (act === 'ripPackage') {
        ripActiveSilverPackage(false);
      } else if (act === 'pressCelebrationKey') {
        if (state.celebrationKey) pressCartoonKey(state.celebrationKey.mesh, true);
      } else if (act === 'pressShelfKey' && hit.object.userData.keyRef) {
        pressCartoonKey(hit.object.userData.keyRef.mesh, false);
      } else if (act === 'openBox') {
        openTallMysteryBox(hit.object.userData.boxIndex);
      }
    });

    controller.addEventListener('selectend', () => {
      rayMat.color.setHex(0xff8ed4);
    });

    cameraRig.add(controller);
    const grip = renderer.xr.getControllerGrip(slot);
    grip.add(controllerModelFactory.createControllerModel(grip));
    cameraRig.add(grip);

    xrControllers.push({ controller, reticle });
  }

  setupXRController(0);
  setupXRController(1);

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
        scene.fog = null;
        renderer.setClearAlpha(0);
      } else {
        environmentGroup.visible = true;
        scene.fog = baseFog;
        renderer.setClearAlpha(1);
      }

      cameraRig.position.set(0, 0, 1.45);
      shelfGroup.position.set(0, 0.88, -0.35);

      session.addEventListener('end', () => {
        activeXrSession = null;
        state.isInXR = false;
        state.xrMode = null;
        controls.enabled = true;
        environmentGroup.visible = true;
        scene.fog = baseFog;
        renderer.setClearAlpha(1);
        cameraRig.position.set(0, 0, 0);
        shelfGroup.position.set(0, 0.22, 1.35);
        updateResponsiveFraming();
      });

      await renderer.xr.setSession(session);
    } catch (err) {
      console.warn('[CartoonClickerXR] XR start error:', err);
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

  // Diagnostic handle for automated verification
  window.CalmChessClickerXR = {
    openBox: (idx) => openTallMysteryBox(idx),
    ripPackage: (instant = false) => ripActiveSilverPackage(instant),
    pressCelebrationKey: () => state.celebrationKey && pressCartoonKey(state.celebrationKey.mesh, true),
    pressShelfKey: (i = 0) => shelfKeyObjects[i] && pressCartoonKey(shelfKeyObjects[i].mesh, false),
    dockKey: () => dockCelebrationKeyToShelf(),
    getState: () => ({
      bankroll: state.bankroll,
      displayedBankroll: state.displayedBankroll,
      wonKeys: [...state.wonKeys],
      winningBoxIndex: state.winningBoxIndex,
      hasActivePackage: Boolean(state.activePackage),
      packageRipStage: state.activePackage ? state.activePackage.ripStage : -1,
      hasCelebrationKey: Boolean(state.celebrationKey),
      shelfKeyCount: shelfKeyObjects.length,
      lastHeardMoo: state.lastHeardMoo,
      totalRips: state.totalRips,
      totalKeyClicks: state.totalKeyClicks,
      webglReady: state.webglReady,
      audioState: audio.getContextState()
    })
  };

  // ---------------------------------------------------------------------------
  // Master Animation Loop
  // ---------------------------------------------------------------------------
  let simTime = 0;
  let lastTs = 0;

  function stepKeySpringPhysics(keyMesh, dt) {
    const ud = keyMesh.userData;
    const force = -160 * ud.pressOffset - 15 * ud.pressVel;
    ud.pressVel += force * dt;
    ud.pressOffset += ud.pressVel * dt;
    if (Math.abs(ud.pressOffset) < 0.0008 && Math.abs(ud.pressVel) < 0.005) {
      ud.pressOffset = 0;
      ud.pressVel = 0;
    }
    const clamped = Math.max(-0.04, Math.min(0.24, ud.pressOffset));
    ud.capPivot.position.y = ud.restY - clamped;
    // Playful cartoon squash-and-stretch on click!
    const squash = 1 + clamped * 0.35;
    ud.capPivot.scale.set(squash, 1 - clamped * 0.28, squash);
  }

  renderer.setAnimationLoop((timestamp) => {
    const rawDt = lastTs ? (timestamp - lastTs) * 0.001 : 0.016;
    lastTs = timestamp;
    const dt = Math.min(rawDt, 0.05);
    simTime += dt;

    // Smooth cash counter roll-up
    if (state.displayedBankroll < state.bankroll) {
      const diff = state.bankroll - state.displayedBankroll;
      state.displayedBankroll = Math.min(state.bankroll, state.displayedBankroll + Math.max(30, diff * 7.5 * dt));
      syncTopHud(false, false);
    }

    // Sky aurora & drifting pastel stars
    skyUniforms.uTime.value = simTime;
    const sArr = starGeo.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      sArr[i * 3 + 1] += dt * 0.14;
      sArr[i * 3] += Math.sin(simTime * 0.7 + starSeed[i]) * dt * 0.08;
      if (sArr[i * 3 + 1] > 8.6) sArr[i * 3 + 1] = 0.5;
    }
    starGeo.attributes.position.needsUpdate = true;

    // Animate 5 Tall Cartoon Mystery Boxes
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      b.lidAngle += (b.lidTarget - b.lidAngle) * Math.min(1, dt * 8.5);
      b.lidPivot.rotation.x = -b.lidAngle;

      if (b.shake > 0.001) {
        b.boxPivot.rotation.z = Math.sin(simTime * 42) * b.shake;
        b.shake = Math.max(0, b.shake - dt * 0.25);
      } else {
        // Subtle playful idle wiggle when hovered
        const targetRot = b.hovered ? Math.sin(simTime * 8.5) * 0.032 : Math.sin(simTime * 1.4 + i) * 0.008;
        b.boxPivot.rotation.z += (targetRot - b.boxPivot.rotation.z) * Math.min(1, dt * 10);
      }

      const targetEmissive = b.hovered ? 0.26 : 0.06;
      b.boxMat.emissiveIntensity += (targetEmissive - b.boxMat.emissiveIntensity) * Math.min(1, dt * 10);
      b.innerGlowMat.opacity = 0.16 + b.lidAngle * 0.42;
    }

    // Animate Floating Shiny Silver Foil Package!
    const pkg = state.activePackage;
    if (pkg) {
      pkg.popProgress = Math.min(1, pkg.popProgress + dt * 2.6);
      const ease = 1 - Math.pow(1 - pkg.popProgress, 3);
      pkg.group.position.lerpVectors(pkg.startPos, pkg.targetPos, ease);
      pkg.group.position.y += Math.sin(simTime * 3.2) * 0.08 * ease;

      const targetSc = state.isInXR ? 0.78 : 1.05;
      const sc = 0.25 + (targetSc - 0.25) * ease;
      pkg.group.scale.setScalar(sc);

      // Tempting glint rotation so metallic silver foil catches studio light!
      if (pkg.shake > 0.001) {
        pkg.group.rotation.z = Math.sin(simTime * 55) * pkg.shake;
        pkg.shake = Math.max(0, pkg.shake - dt * 0.6);
      } else {
        pkg.group.rotation.z = Math.sin(simTime * 2.2) * 0.05;
      }
      pkg.group.rotation.y = Math.sin(simTime * 1.55) * 0.24;

      // Top Silver Tear Strip Ripping Animation!
      if (pkg.ripStage === 1 && !pkg.stripDetached) {
        // Peels partway open like a real foil blind-bag tear strip!
        pkg.topStripPivot.rotation.z += (-0.62 - pkg.topStripPivot.rotation.z) * Math.min(1, dt * 11);
        pkg.topStripPivot.rotation.x += (0.28 - pkg.topStripPivot.rotation.x) * Math.min(1, dt * 11);
      } else if (pkg.stripDetached) {
        pkg.topStripPivot.position.addScaledVector(pkg.stripFlyVel, dt);
        pkg.stripFlyVel.y -= 9.5 * dt;
        pkg.topStripPivot.rotation.z -= 8.0 * dt;
        pkg.topStripPivot.rotation.x += 5.5 * dt;
      }

      if (pkg.dismissTimer > 0) {
        pkg.dismissTimer -= dt;
        pkg.bodyMesh.scale.y = Math.max(0.05, pkg.bodyMesh.scale.y - dt * 1.1);
        if (pkg.dismissTimer <= 0) {
          const parentBox = boxes[pkg.boxIndex];
          if (parentBox) parentBox.lidTarget = 0;
          cleanupActivePackage();
        }
      }
    }

    // Animate Big Newly-Won Cartoonish Keyboard Clicker Key!
    const ck = state.celebrationKey;
    if (ck) {
      ck.age += dt;
      const curScale = ck.mesh.scale.x;
      const nextScale = curScale + (ck.targetScale - curScale) * Math.min(1, dt * 8.5);
      ck.mesh.scale.setScalar(nextScale);
      ck.mesh.position.y = (state.isInXR ? 1.55 : 2.38) + Math.sin(simTime * 3.0) * 0.09;
      ck.mesh.rotation.y = Math.sin(simTime * 1.4) * 0.26;
      stepKeySpringPhysics(ck.mesh, dt);

      // Automatically glide down onto her foreground clickable shelf after 5.5s (or earlier when opening a new box!)
      if (ck.age > 5.8) {
        dockCelebrationKeyToShelf();
      }
    }

    // Animate All Won Cartoonish Keys Sitting on the Foreground Clickable Shelf!
    for (let i = 0; i < shelfKeyObjects.length; i++) {
      const sk = shelfKeyObjects[i];
      sk.mesh.position.x += (sk.targetX - sk.mesh.position.x) * Math.min(1, dt * 7);
      sk.mesh.position.y += (0.04 - sk.mesh.position.y) * Math.min(1, dt * 7);
      sk.mesh.position.z += (0 - sk.mesh.position.z) * Math.min(1, dt * 7);
      sk.popScale += (0.72 - sk.popScale) * Math.min(1, dt * 7);
      sk.mesh.scale.setScalar(sk.popScale);
      stepKeySpringPhysics(sk.mesh, dt);
    }

    // Animate "MOO! +$1,000!" Comic Speech Burst
    for (let i = activeSpeechPopups.length - 1; i >= 0; i--) {
      const sp = activeSpeechPopups[i];
      sp.age += dt;
      if (sp.age >= sp.maxAge) {
        scene.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mat.dispose();
        activeSpeechPopups.splice(i, 1);
      } else {
        const popT = Math.min(1, sp.age * 5.2);
        const overshoot = 1 + 1.1 * Math.pow(popT - 1, 3) + 0.5 * Math.pow(popT - 1, 2);
        sp.mesh.scale.setScalar(Math.max(0.01, overshoot));
        sp.mesh.position.y += dt * 0.35;
        sp.mesh.lookAt(camera.position);
        if (sp.age > sp.maxAge - 0.6) {
          sp.mat.opacity = Math.max(0, (sp.maxAge - sp.age) / 0.6);
        }
      }
    }

    // Animate Playful Decoy Puffs
    for (let i = activeDecoyPops.length - 1; i >= 0; i--) {
      const dp = activeDecoyPops[i];
      dp.age += dt;
      if (dp.age >= dp.maxAge) {
        scene.remove(dp.mesh);
        activeDecoyPops.splice(i, 1);
      } else {
        const frac = dp.age / dp.maxAge;
        dp.mesh.position.y = dp.startY + Math.sin(frac * Math.PI) * 1.25;
        dp.mesh.rotation.y += dt * 5.5;
        dp.mesh.scale.setScalar(Math.sin(frac * Math.PI));
      }
    }

    // Animate Confetti & Silver Foil Shreds
    for (let i = activeConfetti.length - 1; i >= 0; i--) {
      const cf = activeConfetti[i];
      cf.age += dt;
      if (cf.age >= cf.maxAge) {
        scene.remove(cf.mesh);
        cf.mesh.geometry.dispose();
        cf.mesh.material.dispose();
        activeConfetti.splice(i, 1);
      } else {
        cf.vel.y -= 5.4 * dt;
        cf.mesh.position.addScaledVector(cf.vel, dt);
        cf.mesh.rotation.x += cf.spin.x * dt;
        cf.mesh.rotation.y += cf.spin.y * dt;
        cf.mesh.rotation.z += cf.spin.z * dt;
        const fade = 1 - cf.age / cf.maxAge;
        cf.mesh.scale.setScalar(Math.max(0.01, fade));
      }
    }

    // Animate Fluttering $1,000 Dollar Bills
    for (let i = activeBills.length - 1; i >= 0; i--) {
      const b = activeBills[i];
      b.age += dt;
      if (b.age >= b.maxAge) {
        scene.remove(b.mesh);
        activeBills.splice(i, 1);
      } else {
        b.vel.y = Math.max(-1.15, b.vel.y - 2.3 * dt);
        b.vel.x *= 0.985;
        b.vel.z *= 0.985;
        b.mesh.position.x += (b.vel.x + Math.sin(simTime * 4.2 + b.phase) * 0.45) * dt;
        b.mesh.position.y += b.vel.y * dt;
        b.mesh.position.z += (b.vel.z + Math.cos(simTime * 3.6 + b.phase) * 0.45) * dt;
        if (b.mesh.position.y < 0.04) {
          b.mesh.position.y = 0.04;
          b.vel.set(0, 0, 0);
          b.spin.multiplyScalar(0.8);
        } else {
          b.mesh.rotation.x += b.spin.x * dt;
          b.mesh.rotation.y += b.spin.y * dt;
          b.mesh.rotation.z += b.spin.z * dt;
        }
      }
    }

    // XR Controller reticles or Desktop OrbitControls
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
    } else {
      controls.update();
    }

    renderer.render(scene, camera);
  });
})();
