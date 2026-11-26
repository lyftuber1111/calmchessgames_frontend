/**
 * Calm Chess Computers & Games — Tall Mystery Box XR Clicker
 * 100% Procedural 3D & WebXR (immersive-vr + immersive-ar) Game
 *
 * Features:
 *  - 5 Towering Procedural Tall Mystery Box Vaults (3.7m - 5.1m tall) with hinged lids,
 *    glowing procedural '?' rune PBR textures, rotating beacon crystals & hidden Golden Cow
 *  - 5 Tall Spring-Loaded Mechanical Clicker Columns (2.15m - 2.75m tall) with dynamic
 *    3D helical coil springs, 10-segment LED charge ladders, glossy plungers & pneumatic tubes
 *  - Hear a MOO -> Win $1,000! Triggers procedural 3D Golden Crowned Cow pop-out,
 *    fluttering 3D "$1,000" bills, golden fireworks, Web Audio cow moo + cash fanfare
 *  - Full WebXR controller raycasting, AR passthrough transparency, 3D holographic HUD,
 *    Desktop OrbitControls + keyboard shortcuts, and Mobile responsive portrait framing
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { createClickerAudioEngine } from './clicker_audio.js';

(function initTallMysteryClickerXR() {
  'use strict';

  const STORAGE_STATS_KEY = 'calmchess_clicker_stats_v1';
  const JACKPOT_PRIZE = 1000;

  // 5 Towering Tall Mystery Boxes paired with 5 Tall Spring-Loaded Clickers
  const PILLAR_CONFIGS = [
    { name: 'Crimson Spire',    accent: '#fb7185', accentHex: 0xfb7185, darkHex: 0x3b0b19, angleDeg: -42, boxHeight: 3.70, clickerHeight: 2.15, pan: -0.75 },
    { name: 'Sapphire Obelisk', accent: '#38bdf8', accentHex: 0x38bdf8, darkHex: 0x08233c, angleDeg: -21, boxHeight: 4.35, clickerHeight: 2.45, pan: -0.38 },
    { name: 'Solar Sovereign',  accent: '#ffd700', accentHex: 0xffd700, darkHex: 0x332404, angleDeg:   0, boxHeight: 5.10, clickerHeight: 2.75, pan:  0.00 },
    { name: 'Emerald Monolith', accent: '#34d399', accentHex: 0x34d399, darkHex: 0x062d22, angleDeg:  21, boxHeight: 4.35, clickerHeight: 2.45, pan:  0.38 },
    { name: 'Amethyst Citadel', accent: '#c084fc', accentHex: 0xc084fc, darkHex: 0x260d3d, angleDeg:  42, boxHeight: 3.70, clickerHeight: 2.15, pan:  0.75 }
  ];

  // DOM References
  const canvas = document.getElementById('xr-canvas');
  const cashCard = document.getElementById('cash-card');
  const statBankrollEl = document.getElementById('stat-bankroll');
  const statWinsEl = document.getElementById('stat-wins');
  const statClicksEl = document.getElementById('stat-clicks');
  const soundCalloutEl = document.getElementById('sound-callout');
  const targetHintEl = document.getElementById('target-hint');
  const xrBadgeEl = document.getElementById('xr-status-badge');
  const btnEnterVr = document.getElementById('btn-enter-vr');
  const btnEnterAr = document.getElementById('btn-enter-ar');
  const btnNewRound = document.getElementById('btn-new-round');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const volumeSlider = document.getElementById('volume-slider');
  const btnHowToPlay = document.getElementById('btn-how-to-play');
  const winDialog = document.getElementById('win-dialog');
  const winBoxSummaryEl = document.getElementById('win-box-summary');
  const winTotalCashEl = document.getElementById('win-total-cash');
  const winRoundClicksEl = document.getElementById('win-round-clicks');
  const winTotalMoosEl = document.getElementById('win-total-moos');
  const btnReplayMoo = document.getElementById('btn-replay-moo');
  const rulesDialog = document.getElementById('rules-dialog');
  const btnResetStats = document.getElementById('btn-reset-stats');
  const webglFallback = document.getElementById('webgl-fallback');
  const btnDismissFallback = document.getElementById('btn-dismiss-fallback');
  const quickButtons = Array.from(document.querySelectorAll('.pillar-btn[data-pillar]'));

  const audio = createClickerAudioEngine();

  // Persistent Player State
  const state = {
    bankroll: 0,
    displayedBankroll: 0,
    mooWins: 0,
    totalClicks: 0,
    roundClicks: 0,
    roundNumber: 1,
    winningIndex: Math.floor(Math.random() * PILLAR_CONFIGS.length),
    roundWon: false,
    lastWonIndex: -1,
    lastSoundLabel: 'Listening...',
    lastHeardMoo: false,
    decoyCursor: Math.floor(Math.random() * audio.DECOY_SOUNDS.length),
    isInXR: false,
    xrMode: null,
    vrSupported: false,
    arSupported: false,
    webglReady: false
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
      if (Number.isFinite(parsed.mooWins) && parsed.mooWins >= 0) {
        state.mooWins = parsed.mooWins;
      }
      if (Number.isFinite(parsed.totalClicks) && parsed.totalClicks >= 0) {
        state.totalClicks = parsed.totalClicks;
      }
    } catch (_) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(
        STORAGE_STATS_KEY,
        JSON.stringify({
          bankroll: state.bankroll,
          mooWins: state.mooWins,
          totalClicks: state.totalClicks
        })
      );
    } catch (_) {}
  }

  function formatDollars(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
  }

  function syncHudStats() {
    if (statBankrollEl) statBankrollEl.textContent = formatDollars(state.displayedBankroll);
    if (statWinsEl) statWinsEl.textContent = String(state.mooWins);
    if (statClicksEl) statClicksEl.textContent = String(state.totalClicks);
  }

  function setCallout(message, isWin = false) {
    if (!soundCalloutEl) return;
    soundCalloutEl.textContent = message;
    soundCalloutEl.classList.toggle('is-moo-win', isWin);
  }

  function syncAudioUi() {
    const muted = audio.isMuted();
    if (btnSoundToggle) {
      btnSoundToggle.setAttribute('aria-pressed', String(muted));
      btnSoundToggle.textContent = muted ? 'Muted' : 'Sound On';
    }
    if (volumeSlider) {
      volumeSlider.value = String(Math.round(audio.getVolume() * 100));
    }
  }

  // Modern Web Guidance: closedby="any" light-dismiss fallback for browsers without native closedBy
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  loadStats();
  syncHudStats();
  syncAudioUi();

  // ---------------------------------------------------------------------------
  // WebGL / Three.js WebXR Initialization
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
    console.warn('[ClickerXR] WebGL unavailable, running audio/HUD fallback mode:', err);
    if (webglFallback) webglFallback.hidden = false;
  }

  if (btnDismissFallback && webglFallback) {
    btnDismissFallback.addEventListener('click', () => {
      audio.unlock();
      webglFallback.hidden = true;
    });
  }

  // Forward declarations for 3D update hooks (no-ops if WebGL unavailable)
  let updateHoloBoard = () => {};
  let animatePillarClick3D = () => {};
  let animatePillarWin3D = () => {};
  let resetPillars3D = () => {};
  let startXRSession = async () => {};

  // ---------------------------------------------------------------------------
  // Core Game Logic (works in 3D, WebXR, and Audio Fallback)
  // ---------------------------------------------------------------------------
  const pillarClickCounts = PILLAR_CONFIGS.map(() => 0);

  function pickNextWinningIndex(previousIndex) {
    const candidates = PILLAR_CONFIGS.map((_, i) => i).filter((i) => i !== previousIndex);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function startNewRound(silent = false) {
    audio.unlock();
    const prevWin = state.winningIndex;
    state.winningIndex = pickNextWinningIndex(prevWin);
    state.roundWon = false;
    state.roundClicks = 0;
    state.roundNumber += 1;
    state.lastHeardMoo = false;
    state.lastSoundLabel = 'Boxes Shuffled — Listen for the Moo!';
    for (let i = 0; i < pillarClickCounts.length; i++) {
      pillarClickCounts[i] = 0;
    }

    if (!silent) {
      audio.playRoundReset();
    }
    resetPillars3D();
    updateHoloBoard('NEW MYSTERY ROUND', 'Click a Tall Clicker — Hear a MOO to win $1,000!', false);
    setCallout('Round ' + state.roundNumber + ': 5 Tall Mystery Boxes armed! Click & listen for a MOO!', false);
  }

  function triggerMooJackpot(pillarIndex) {
    const cfg = PILLAR_CONFIGS[pillarIndex];
    state.roundWon = true;
    state.lastWonIndex = pillarIndex;
    state.lastHeardMoo = true;
    state.mooWins += 1;
    state.bankroll += JACKPOT_PRIZE;
    state.lastSoundLabel = 'MOOOOOOO! (+$1,000)';
    saveStats();

    // Unmistakable Cow MOO + Wide Lid Creak + $1,000 Cash Fanfare!
    audio.playLidCreak(true, cfg.pan);
    audio.playMoo(cfg.pan);
    audio.playJackpotFanfare();

    // Flash cash badge
    if (cashCard) {
      cashCard.classList.remove('is-jackpot-flash');
      void cashCard.offsetWidth;
      cashCard.classList.add('is-jackpot-flash');
    }

    setCallout('MOOOOOOO! ' + cfg.name + ' mooed — YOU WON $1,000!', true);
    updateHoloBoard('MOOOOOOO! +$1,000 WON!', cfg.name + ' revealed the Golden Cow!', true);
    animatePillarWin3D(pillarIndex);

    // Show accessible native modal dialog when not inside immersive XR headset
    if (!state.isInXR && winDialog && !winDialog.open) {
      if (winBoxSummaryEl) {
        winBoxSummaryEl.textContent = 'You heard the golden MOO from ' + cfg.name + '!';
      }
      if (winTotalCashEl) winTotalCashEl.textContent = formatDollars(state.bankroll);
      if (winRoundClicksEl) winRoundClicksEl.textContent = String(state.roundClicks);
      if (winTotalMoosEl) winTotalMoosEl.textContent = String(state.mooWins);

      setTimeout(() => {
        if (state.roundWon && !state.isInXR && winDialog && !winDialog.open) {
          winDialog.showModal();
        }
      }, 1900);
    }
  }

  function handlePillarPress(pillarIndex) {
    if (pillarIndex < 0 || pillarIndex >= PILLAR_CONFIGS.length) return;
    audio.unlock();

    // If round was already won, clicking another pillar starts a fresh round automatically
    if (state.roundWon) {
      startNewRound(true);
    }

    const cfg = PILLAR_CONFIGS[pillarIndex];
    pillarClickCounts[pillarIndex] += 1;
    state.totalClicks += 1;
    state.roundClicks += 1;
    saveStats();

    const localClicks = pillarClickCounts[pillarIndex];
    const chargeRatio = Math.min(1, localClicks / 4);
    audio.playClickerPress(pillarIndex, chargeRatio, cfg.pan);

    // Determine whether THIS click unleashes the MOO!
    // - Clicking the secret Moo Box has a thrilling 60% instant chance on click 1,
    //   and 100% guaranteed on its 2nd click (or if 3+ clicks have already happened this round).
    // - Clicking 8 times in a round without finding it magnetically lures the Golden Cow into
    //   your current tall mystery box so you're always rewarded with a hilarious MOO!
    let shouldMoo = false;
    if (pillarIndex === state.winningIndex) {
      if (localClicks >= 2 || state.roundClicks >= 3 || Math.random() < 0.6) {
        shouldMoo = true;
      }
    } else if (state.roundClicks >= 8) {
      state.winningIndex = pillarIndex;
      shouldMoo = true;
    }

    animatePillarClick3D(pillarIndex, localClicks, shouldMoo);

    if (shouldMoo) {
      triggerMooJackpot(pillarIndex);
    } else {
      audio.playLidCreak(false, cfg.pan);
      const decoyMeta = audio.playDecoySound(state.decoyCursor++, cfg.pan);
      const isHotHint = pillarIndex === state.winningIndex;
      state.lastSoundLabel = decoyMeta.label;
      const hintTail = isHotHint
        ? ' Wait... something golden stirred inside ' + cfg.name + '! Click again!'
        : '';
      setCallout(decoyMeta.emoji + ' ' + cfg.name + ': ' + decoyMeta.caption + hintTail, false);
      updateHoloBoard(
        decoyMeta.label.toUpperCase() + ' — NO MOO YET',
        isHotHint ? cfg.name + ' is rumbling with gold!' : 'Try another Tall Clicker!',
        false
      );
    }

    syncHudStats();
  }

  // Bind HUD buttons & dialogs
  quickButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.pillar);
      handlePillarPress(idx);
    });
  });

  if (btnNewRound) {
    btnNewRound.addEventListener('click', () => startNewRound(false));
  }

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      audio.unlock();
      audio.setMuted(!audio.isMuted());
      syncAudioUi();
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      audio.unlock();
      audio.setVolume(Number(volumeSlider.value) / 100);
      syncAudioUi();
    });
  }

  if (btnHowToPlay && rulesDialog) {
    btnHowToPlay.addEventListener('click', () => {
      audio.unlock();
      if (!rulesDialog.open) rulesDialog.showModal();
    });
  }

  if (btnReplayMoo) {
    btnReplayMoo.addEventListener('click', () => {
      audio.unlock();
      const pan = state.lastWonIndex >= 0 ? PILLAR_CONFIGS[state.lastWonIndex].pan : 0;
      audio.playMoo(pan);
    });
  }

  if (btnResetStats) {
    btnResetStats.addEventListener('click', () => {
      state.bankroll = 0;
      state.displayedBankroll = 0;
      state.mooWins = 0;
      state.totalClicks = 0;
      saveStats();
      syncHudStats();
      updateHoloBoard('STATS RESET', 'Click a Tall Clicker — Hear a MOO to win $1,000!', false);
      if (rulesDialog && rulesDialog.open) rulesDialog.close();
    });
  }

  if (winDialog) {
    winDialog.addEventListener('close', () => {
      const choice = winDialog.returnValue;
      winDialog.returnValue = '';
      if (choice === 'next') {
        startNewRound(false);
      }
    });
  }

  if (rulesDialog) {
    rulesDialog.addEventListener('close', () => {
      rulesDialog.returnValue = '';
    });
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (winDialog && winDialog.open) return;
    if (rulesDialog && rulesDialog.open) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if (e.key >= '1' && e.key <= '5') {
      handlePillarPress(Number(e.key) - 1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      handlePillarPress(Math.floor(Math.random() * PILLAR_CONFIGS.length));
    } else if (e.key === 'r' || e.key === 'R') {
      startNewRound(false);
    } else if (e.key === 'm' || e.key === 'M') {
      audio.unlock();
      audio.setMuted(!audio.isMuted());
      syncAudioUi();
    }
  });

  // Expose public diagnostic / control API even if WebGL failed
  window.CalmChessClickerXR = {
    clickPillar: (idx) => handlePillarPress(idx),
    startNewRound: () => startNewRound(false),
    replayMoo: () => {
      audio.unlock();
      return audio.playMoo(0);
    },
    startXR: (mode) => startXRSession(mode),
    getState: () => ({
      ...state,
      pillarClickCounts: [...pillarClickCounts],
      audioState: audio.getContextState(),
      muted: audio.isMuted()
    })
  };

  if (!renderer) {
    return;
  }

  // ---------------------------------------------------------------------------
  // Three.js Procedural 3D & WebXR Scene Construction
  // ---------------------------------------------------------------------------
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
  const baseFog = new THREE.FogExp2(0x070c1c, 0.022);
  scene.fog = baseFog;

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 140);
  camera.position.set(0, 3.2, 8.8);

  const cameraRig = new THREE.Group();
  cameraRig.name = 'XRCameraRig';
  cameraRig.add(camera);
  scene.add(cameraRig);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 4.2;
  controls.maxDistance = 20.0;
  controls.minPolarAngle = Math.PI * 0.14;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 2.35, -3.4);

  // Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0x9cc9ff, 0x161229, 0.78);
  scene.add(hemiLight);

  const keySpot = new THREE.DirectionalLight(0xfff4d6, 1.35);
  keySpot.position.set(6, 13, 8);
  keySpot.castShadow = true;
  keySpot.shadow.mapSize.set(1024, 1024);
  keySpot.shadow.camera.near = 1;
  keySpot.shadow.camera.far = 32;
  keySpot.shadow.camera.left = -9;
  keySpot.shadow.camera.right = 9;
  keySpot.shadow.camera.top = 9;
  keySpot.shadow.camera.bottom = -9;
  keySpot.shadow.bias = -0.0005;
  scene.add(keySpot);

  const rimCyan = new THREE.DirectionalLight(0x38bdf8, 0.65);
  rimCyan.position.set(-9, 8, -8);
  scene.add(rimCyan);

  const rimGold = new THREE.PointLight(0xffcf56, 2.2, 24, 1.35);
  rimGold.position.set(0, 6.2, -1.8);
  scene.add(rimGold);

  const frontFill = new THREE.DirectionalLight(0xdbeafe, 0.72);
  frontFill.position.set(-4, 5, 10);
  scene.add(frontFill);

  const jackpotLight = new THREE.PointLight(0xffe066, 0, 14, 1.3);
  jackpotLight.position.set(0, 4.5, -4.5);
  scene.add(jackpotLight);

  // ---------------------------------------------------------------------------
  // Procedural Texture Generators
  // ---------------------------------------------------------------------------
  function createGlowTexture(inner, mid, outer = 'rgba(0,0,0,0)') {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.0, inner);
    g.addColorStop(0.32, mid);
    g.addColorStop(0.75, outer);
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createFloorTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#0c1326';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle luxury checkerboard tiles
    const tile = 64;
    for (let y = 0; y < 512; y += tile) {
      for (let x = 0; x < 512; x += tile) {
        const alt = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = alt ? '#111b34' : '#0b1224';
        ctx.fillRect(x, y, tile, tile);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }

  function createMysteryBoxTextures(accentColor, darkColorHex) {
    const w = 512;
    const h = 1024;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const ctx = diffCanvas.getContext('2d');

    const emisCanvas = document.createElement('canvas');
    emisCanvas.width = w;
    emisCanvas.height = h;
    const ectx = emisCanvas.getContext('2d');
    ectx.fillStyle = '#000000';
    ectx.fillRect(0, 0, w, h);

    // Deep lacquered vault background gradient
    const baseHexStr = '#' + darkColorHex.toString(16).padStart(6, '0');
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.5, baseHexStr);
    bgGrad.addColorStop(1, '#090d1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle diagonal diamond lattice pattern
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.moveTo(i + h, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }

    // Ornate gilded outer & inner frames
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 16;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(38, 38, w - 76, h - 76);

    ectx.strokeStyle = accentColor;
    ectx.lineWidth = 7;
    ectx.strokeRect(38, 38, w - 76, h - 76);

    // Horizontal architectural ribs dividing the tall mystery vault into 3 stacked tiers
    [340, 684].forEach((y) => {
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(24, y - 10, w - 48, 20);
      ctx.fillStyle = accentColor;
      ctx.fillRect(40, y - 3, w - 80, 6);
      ectx.fillStyle = accentColor;
      ectx.fillRect(40, y - 3, w - 80, 6);
    });

    // Large glowing Mystery '?' Emblems stacked vertically along the tall face
    const centers = [190, 512, 834];
    centers.forEach((cy, idx) => {
      const r = idx === 1 ? 116 : 92;
      // Medallion disc
      const mg = ctx.createRadialGradient(w / 2, cy, 8, w / 2, cy, r);
      mg.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
      mg.addColorStop(0.75, 'rgba(15, 23, 42, 0.85)');
      mg.addColorStop(1, '#ffd700');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(w / 2, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffd700';
      ctx.stroke();

      // '?' Glyph on both diffuse & emissive
      const fontSize = idx === 1 ? 168 : 132;
      ctx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fffbeb';
      ctx.fillText('?', w / 2, cy + 8);

      ectx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
      ectx.textAlign = 'center';
      ectx.textBaseline = 'middle';
      ectx.fillStyle = idx === 1 ? '#ffd700' : accentColor;
      ectx.fillText('?', w / 2, cy + 8);
    });

    // Brass rivets on corners
    const rivetXs = [58, w - 58];
    const rivetYs = [58, 320, 360, 664, 704, h - 58];
    ctx.fillStyle = '#fde68a';
    rivetYs.forEach((ry) => {
      rivetXs.forEach((rx) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    const map = new THREE.CanvasTexture(diffCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;

    const emissiveMap = new THREE.CanvasTexture(emisCanvas);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.anisotropy = 4;

    return { map, emissiveMap };
  }

  function createDollarBillTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 224;
    const ctx = c.getContext('2d');

    // Crisp emerald-cream banknote paper
    const g = ctx.createLinearGradient(0, 0, 512, 224);
    g.addColorStop(0, '#d1fae5');
    g.addColorStop(0.5, '#ecfdf5');
    g.addColorStop(1, '#a7f3d0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 224);

    // Ornate emerald border
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 492, 204);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 464, 176);

    // Center golden cow seal medallion
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(256, 112, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 42px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$1000', 256, 100);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = '800 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('MOO NOTE', 256, 136);

    // Corner denominations
    ctx.fillStyle = '#064e3b';
    ctx.font = '900 28px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('$1,000', 34, 52);
    ctx.fillText('$1,000', 34, 176);
    ctx.textAlign = 'right';
    ctx.fillText('$1,000', 478, 52);
    ctx.fillText('$1,000', 478, 176);

    // Top/Bottom motto
    ctx.textAlign = 'center';
    ctx.font = '800 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('CALM CHESS MYSTERY VAULT RESERVE', 256, 40);
    ctx.fillText('ONE THOUSAND MOO DOLLARS', 256, 186);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Environment: Procedural Twilight Dome, Stage Floor & Floating Bokeh Dust
  // ---------------------------------------------------------------------------
  const environmentGroup = new THREE.Group();
  environmentGroup.name = 'EnvironmentGroup';
  scene.add(environmentGroup);

  // Sky Dome Shader
  const skyUniforms = { uTime: { value: 0 } };
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(65, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 bottom = vec3(0.03, 0.05, 0.12);
          vec3 mid = vec3(0.06, 0.10, 0.24);
          vec3 top = vec3(0.02, 0.03, 0.09);
          vec3 col = mix(bottom, mid, smoothstep(0.35, 0.62, h));
          col = mix(col, top, smoothstep(0.62, 0.96, h));

          // Subtle shimmering emerald-gold aurora curtain overhead
          float wave = sin(dir.x * 5.0 + uTime * 0.35) * cos(dir.z * 4.0 - uTime * 0.25);
          float band = smoothstep(0.15, 0.55, dir.y) * smoothstep(0.88, 0.42, dir.y);
          vec3 aurora = mix(vec3(0.06, 0.72, 0.55), vec3(0.95, 0.78, 0.20), wave * 0.5 + 0.5);
          col += aurora * band * (0.14 + 0.07 * wave);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  environmentGroup.add(skyDome);

  // Reflective Vault Stage Floor
  const floorTex = createFloorTexture();
  const floorMesh = new THREE.Mesh(
    new THREE.CircleGeometry(26, 64),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.36,
      metalness: 0.42
    })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  environmentGroup.add(floorMesh);

  // Concentric glowing golden floor inlay rings framing the arena
  [2.6, 5.2, 7.6].forEach((radius, idx) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.04, radius + 0.04, 72),
      new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0xffd700 : 0x38bdf8,
        transparent: true,
        opacity: idx === 1 ? 0.45 : 0.22,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    environmentGroup.add(ring);
  });

  // Floating Ambient Golden Dust Motes
  const dustCount = 160;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 1.5 + Math.random() * 12;
    dustPos[i * 3] = Math.cos(ang) * rad;
    dustPos[i * 3 + 1] = 0.6 + Math.random() * 7.8;
    dustPos[i * 3 + 2] = Math.sin(ang) * rad - 2.5;
    dustSeed[i] = Math.random() * Math.PI * 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const glowSpriteTex = createGlowTexture('rgba(255,250,210,1)', 'rgba(255,210,80,0.45)');
  const dustPoints = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      map: glowSpriteTex,
      size: 0.16,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(dustPoints);

  // ---------------------------------------------------------------------------
  // Procedural 3D Golden Prize Cow Factory (pops out of the winning Tall Box!)
  // ---------------------------------------------------------------------------
  function buildGoldenCow() {
    const cow = new THREE.Group();
    cow.name = 'GoldenPrizeCow';

    const creamMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e7,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x332200,
      emissiveIntensity: 0.25
    });
    const goldSpotMat = new THREE.MeshStandardMaterial({
      color: 0xffc824,
      roughness: 0.22,
      metalness: 0.78,
      emissive: 0xffaa00,
      emissiveIntensity: 0.35
    });
    const snoutMat = new THREE.MeshStandardMaterial({
      color: 0xf9a8d4,
      roughness: 0.45,
      metalness: 0.05
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b24,
      roughness: 0.3,
      metalness: 0.3
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4,
      metalness: 0.2
    });

    // Plump adorable torso
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.36, 10, 18), creamMat);
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.44, 0);
    cow.add(body);

    // Golden dairy spots hugging torso
    const spotOffsets = [
      { x: -0.1, y: 0.54, z: 0.17, r: 0.10 },
      { x: 0.12, y: 0.48, z: -0.17, r: 0.11 },
      { x: 0.02, y: 0.62, z: 0.04, r: 0.09 }
    ];
    spotOffsets.forEach((s) => {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(s.r, 12, 10), goldSpotMat);
      sp.position.set(s.x, s.y, s.z);
      sp.scale.set(1.2, 0.85, 0.7);
      cow.add(sp);
    });

    // 4 cute legs with dark hooves
    [
      [-0.18, 0.11], [-0.18, -0.11],
      [0.18, 0.11],  [0.18, -0.11]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.34, 10), creamMat);
      leg.position.set(lx, 0.21, lz);
      cow.add(leg);
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.07, 10), darkMat);
      hoof.position.set(lx, 0.035, lz);
      cow.add(hoof);
    });

    // Articulated Head Group facing +Z (toward player)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.66, 0.26);
    cow.add(headGroup);

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.20, 16, 14), creamMat);
    cranium.scale.set(0.95, 1.0, 1.08);
    headGroup.add(cranium);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.16), snoutMat);
    snout.position.set(0, -0.05, 0.17);
    headGroup.add(snout);

    // Nostrils & Eyes
    [-0.06, 0.06].forEach((nx) => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), darkMat);
      nostril.position.set(nx, -0.03, 0.25);
      headGroup.add(nostril);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), darkMat);
      eye.position.set(nx * 1.45, 0.06, 0.17);
      headGroup.add(eye);
    });

    // Ears
    const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), goldSpotMat);
    leftEar.scale.set(1.5, 0.55, 0.65);
    leftEar.position.set(-0.22, 0.08, 0.0);
    leftEar.rotation.z = 0.25;
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = 0.22;
    rightEar.rotation.z = -0.25;
    headGroup.add(rightEar);

    // Curved Golden Horns
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.17, 10), goldSpotMat);
      horn.position.set(side * 0.12, 0.20, 0.02);
      horn.rotation.z = -side * 0.42;
      horn.rotation.x = 0.15;
      headGroup.add(horn);
    });

    // Tiny Royal Golden Crown atop head!
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.11, 6, 1, false), goldSpotMat);
    crown.position.set(0, 0.24, 0.02);
    headGroup.add(crown);

    // Red Collar + Hanging Golden Cowbell
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 8, 18), collarMat);
    collar.position.set(0, 0.50, 0.20);
    collar.rotation.x = Math.PI * 0.35;
    cow.add(collar);

    const cowbell = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.12, 10), goldSpotMat);
    cowbell.position.set(0, 0.36, 0.31);
    cow.add(cowbell);

    // Rotating Golden Halo behind cow
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.028, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9 })
    );
    halo.position.set(0, 0.58, -0.10);
    cow.add(halo);

    // Rotate body slightly so the cow looks squarely at the player
    body.rotation.y = Math.PI / 2;
    cow.userData = { headGroup, leftEar, rightEar, halo, cowbell };
    return cow;
  }

  // ---------------------------------------------------------------------------
  // Custom 3D Helical Spring Curve for Tall Clickers
  // ---------------------------------------------------------------------------
  class HelixCurve extends THREE.Curve {
    constructor(radius = 0.16, height = 0.44, turns = 5.5) {
      super();
      this.radius = radius;
      this.height = height;
      this.turns = turns;
    }
    getPoint(t, optionalTarget = new THREE.Vector3()) {
      const angle = t * Math.PI * 2 * this.turns;
      return optionalTarget.set(
        Math.cos(angle) * this.radius,
        t * this.height,
        Math.sin(angle) * this.radius
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Build the 5 Tall Mystery Boxes + 5 Tall Clickers in a Grand Semicircle
  // ---------------------------------------------------------------------------
  const interactiveMeshes = [];
  const pillars = [];
  const activeEnergyPulses = [];
  const activeSonicRings = [];
  const activeBills = [];
  const activeFireworks = [];

  const arenaGroup = new THREE.Group();
  arenaGroup.name = 'TallMysteryArena';
  scene.add(arenaGroup);

  const brassMatShared = new THREE.MeshStandardMaterial({
    color: 0xe6b93d,
    roughness: 0.28,
    metalness: 0.85
  });
  const steelMatShared = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.34,
    metalness: 0.78
  });
  const springMatShared = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.92
  });

  const ARC_RADIUS = 5.75;
  const ARC_CENTER_Z = 0.65;

  PILLAR_CONFIGS.forEach((cfg, index) => {
    const rad = THREE.MathUtils.degToRad(cfg.angleDeg);
    const boxX = Math.sin(rad) * ARC_RADIUS;
    const boxZ = ARC_CENTER_Z - Math.cos(rad) * ARC_RADIUS;

    const unitGroup = new THREE.Group();
    unitGroup.name = 'TallMysteryUnit_' + index;
    unitGroup.position.set(boxX, 0, boxZ);
    // Face inward toward the player at (0, 0, ARC_CENTER_Z)
    unitGroup.lookAt(0, 0, ARC_CENTER_Z + 1.8);
    arenaGroup.add(unitGroup);

    // 1. Stepped Octagonal Pedestal for the Tall Mystery Box
    const pedBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.84, 0.96, 0.24, 8),
      steelMatShared
    );
    pedBase.position.y = 0.12;
    pedBase.receiveShadow = true;
    pedBase.castShadow = true;
    unitGroup.add(pedBase);

    const pedGlowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.032, 10, 32),
      new THREE.MeshBasicMaterial({ color: cfg.accentHex })
    );
    pedGlowRing.rotation.x = Math.PI / 2;
    pedGlowRing.position.y = 0.24;
    unitGroup.add(pedGlowRing);

    // 2. THE TALL MYSTERY BOX MONOLITH (3.7m - 5.1m tall!)
    const boxPivot = new THREE.Group();
    boxPivot.position.set(0, 0.24, 0);
    unitGroup.add(boxPivot);

    const boxH = cfg.boxHeight;
    const boxW = 1.08;
    const boxD = 1.08;
    const boxTex = createMysteryBoxTextures(cfg.accent, cfg.darkHex);

    const boxSideMat = new THREE.MeshStandardMaterial({
      map: boxTex.map,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: boxTex.emissiveMap,
      emissiveIntensity: 0.65,
      roughness: 0.34,
      metalness: 0.45
    });

    const boxBody = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), boxSideMat);
    boxBody.position.y = boxH * 0.5;
    boxBody.castShadow = true;
    boxBody.receiveShadow = true;
    boxBody.userData = { pillarIndex: index, part: 'mysteryBox', label: cfg.name + ' (Tall Mystery Box)' };
    boxPivot.add(boxBody);
    interactiveMeshes.push(boxBody);

    // Tall corner brass pilasters emphasizing vertical height
    [
      [-boxW * 0.5, -boxD * 0.5],
      [ boxW * 0.5, -boxD * 0.5],
      [-boxW * 0.5,  boxD * 0.5],
      [ boxW * 0.5,  boxD * 0.5]
    ].forEach(([cx, cz]) => {
      const cornerBar = new THREE.Mesh(new THREE.BoxGeometry(0.085, boxH + 0.04, 0.085), brassMatShared);
      cornerBar.position.set(cx, boxH * 0.5, cz);
      boxPivot.add(cornerBar);
    });

    // Glowing inner vault light plane right beneath the lid
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffea80,
      transparent: true,
      opacity: 0.35
    });
    const innerGlowTop = new THREE.Mesh(new THREE.PlaneGeometry(boxW * 0.86, boxD * 0.86), innerGlowMat);
    innerGlowTop.rotation.x = -Math.PI / 2;
    innerGlowTop.position.y = boxH + 0.006;
    boxPivot.add(innerGlowTop);

    // Hinged Tall Mystery Box Lid (hinged at back edge z = -boxD/2 so it flips open toward back!)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, boxH, -boxD * 0.5);
    boxPivot.add(lidPivot);

    const lidSlab = new THREE.Mesh(new THREE.BoxGeometry(boxW + 0.14, 0.22, boxD + 0.14), brassMatShared);
    lidSlab.position.set(0, 0.11, boxD * 0.5);
    lidSlab.castShadow = true;
    lidSlab.userData = { pillarIndex: index, part: 'mysteryBox', label: cfg.name + ' Lid' };
    lidPivot.add(lidSlab);
    interactiveMeshes.push(lidSlab);

    const lidCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.56, 0.28, 4),
      new THREE.MeshStandardMaterial({
        color: cfg.accentHex,
        roughness: 0.26,
        metalness: 0.65,
        emissive: new THREE.Color(cfg.accentHex),
        emissiveIntensity: 0.32
      })
    );
    lidCrown.rotation.y = Math.PI / 4;
    lidCrown.position.set(0, 0.34, boxD * 0.5);
    lidPivot.add(lidCrown);

    // Floating spinning golden diamond beacon above the tall mystery box
    const beaconCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffe46b,
        emissive: new THREE.Color(cfg.accentHex),
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.8
      })
    );
    beaconCrystal.position.set(0, boxH + 0.92, 0);
    boxPivot.add(beaconCrystal);

    // Golden Prize Cow tucked inside the top of the tall mystery box (rises out on MOO!)
    const cowGroup = buildGoldenCow();
    cowGroup.position.set(0, boxH - 0.55, 0);
    cowGroup.scale.setScalar(1.18);
    cowGroup.visible = false;
    boxPivot.add(cowGroup);

    // Volumetric Golden Jackpot Beam shooting from the open tall mystery box
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const jackpotBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.42, 4.2, 20, 1, true), beamMat);
    jackpotBeam.position.set(0, boxH + 2.1, 0);
    jackpotBeam.visible = false;
    boxPivot.add(jackpotBeam);

    // 3. THE TALL SPRING-LOADED CLICKER COLUMN (2.15m - 2.75m tall, standing right in front!)
    const clickerZ = 1.34;
    const clickerH = cfg.clickerHeight;
    const clickerGroup = new THREE.Group();
    clickerGroup.position.set(0, 0, clickerZ);
    unitGroup.add(clickerGroup);

    // Clicker Base Flange
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.18, 16), steelMatShared);
    cBase.position.y = 0.09;
    cBase.castShadow = true;
    cBase.receiveShadow = true;
    clickerGroup.add(cBase);

    const cBaseRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.026, 8, 24),
      new THREE.MeshBasicMaterial({ color: cfg.accentHex })
    );
    cBaseRing.rotation.x = Math.PI / 2;
    cBaseRing.position.y = 0.18;
    clickerGroup.add(cBaseRing);

    // Tall Fluted Mechanical Clicker Shaft
    const shaftH = clickerH - 0.62;
    const cShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.21, shaftH, 16),
      steelMatShared
    );
    cShaft.position.y = 0.18 + shaftH * 0.5;
    cShaft.castShadow = true;
    cShaft.userData = { pillarIndex: index, part: 'clicker', label: 'Tall Clicker #' + (index + 1) + ' (' + cfg.name + ')' };
    clickerGroup.add(cShaft);
    interactiveMeshes.push(cShaft);

    // 10 Stacked Glowing LED Charge Rings climbing up the tall clicker column!
    const ledRings = [];
    const ledCount = 10;
    for (let k = 0; k < ledCount; k++) {
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: new THREE.Color(cfg.accentHex),
        emissiveIntensity: 0.12,
        roughness: 0.25,
        metalness: 0.5
      });
      const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.022, 8, 20), ledMat);
      ledRing.rotation.x = Math.PI / 2;
      ledRing.position.y = 0.34 + (k / (ledCount - 1)) * (shaftH - 0.34);
      clickerGroup.add(ledRing);
      ledRings.push(ledMat);
    }

    // Upper Brass Collar
    const collarY = 0.18 + shaftH;
    const cCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.14, 16), brassMatShared);
    cCollar.position.y = collarY + 0.05;
    clickerGroup.add(cCollar);

    // Visible 3D Procedural Helical Coil Spring (dynamically compresses on click!)
    const springBaseY = collarY + 0.11;
    const springRestHeight = 0.38;
    const springGeo = new THREE.TubeGeometry(new HelixCurve(0.15, springRestHeight, 5.5), 72, 0.022, 8, false);
    const springMesh = new THREE.Mesh(springGeo, springMatShared);
    springMesh.position.y = springBaseY;
    clickerGroup.add(springMesh);

    // Plunger Piston & Oversized Glowing Clicker Button Cap!
    const plungerGroup = new THREE.Group();
    const plungerRestY = springBaseY + springRestHeight;
    plungerGroup.position.y = plungerRestY;
    clickerGroup.add(plungerGroup);

    const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.44, 12), brassMatShared);
    pistonRod.position.y = -0.20;
    plungerGroup.add(pistonRod);

    const capBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.12, 24), brassMatShared);
    capBezel.position.y = 0.05;
    capBezel.castShadow = true;
    plungerGroup.add(capBezel);

    const capMat = new THREE.MeshStandardMaterial({
      color: cfg.accentHex,
      emissive: new THREE.Color(cfg.accentHex),
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.25
    });
    const capButton = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.34, 0.15, 24), capMat);
    capButton.position.y = 0.15;
    capButton.castShadow = true;
    capButton.userData = { pillarIndex: index, part: 'clicker', label: 'Press Tall Clicker #' + (index + 1) + ' (' + cfg.name + ')' };
    plungerGroup.add(capButton);
    interactiveMeshes.push(capButton);

    // Glossy Dome Top on the Tall Clicker Plunger
    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.30, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
      capMat
    );
    capDome.position.y = 0.20;
    capDome.userData = { pillarIndex: index, part: 'clicker', label: 'Press Tall Clicker #' + (index + 1) + ' (' + cfg.name + ')' };
    plungerGroup.add(capDome);
    interactiveMeshes.push(capDome);

    // Invisible slightly generous touch/raycast hit cylinder around the top of the tall clicker
    const hitProxy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.40, 0.72, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitProxy.position.y = 0.05;
    hitProxy.userData = { pillarIndex: index, part: 'clicker', label: 'Press Tall Clicker #' + (index + 1) + ' (' + cfg.name + ')' };
    plungerGroup.add(hitProxy);
    interactiveMeshes.push(hitProxy);

    // 4. Curved Glowing Pneumatic Energy Conduit Tube connecting Tall Clicker -> Tall Mystery Box
    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, collarY, clickerZ - 0.12),
      new THREE.Vector3(0, collarY - 0.18, clickerZ * 0.62),
      new THREE.Vector3(0, boxH * 0.58, boxD * 0.62),
      new THREE.Vector3(0, boxH * 0.78, boxD * 0.48)
    ]);
    const conduitMesh = new THREE.Mesh(
      new THREE.TubeGeometry(tubeCurve, 28, 0.042, 10, false),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        emissive: new THREE.Color(cfg.accentHex),
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.7
      })
    );
    unitGroup.add(conduitMesh);

    pillars.push({
      index,
      cfg,
      unitGroup,
      boxPivot,
      boxSideMat,
      lidPivot,
      beaconCrystal,
      innerGlowMat,
      cowGroup,
      jackpotBeam,
      beamMat,
      plungerGroup,
      plungerRestY,
      springMesh,
      springRestHeight,
      capMat,
      ledRings,
      tubeCurve,
      boxHeight: boxH,
      // Dynamic Animation State
      pressOffset: 0,
      pressVel: 0,
      shakeIntensity: 0,
      lidAngle: 0,
      lidTarget: 0,
      lidPeekTimer: 0,
      chargeLevel: 0,
      hovered: false,
      cowRise: 0,
      wonActive: false
    });
  });

  // ---------------------------------------------------------------------------
  // 3D Floating Holographic Scoreboard & In-XR "NEXT ROUND" Button
  // ---------------------------------------------------------------------------
  const holoCanvas = document.createElement('canvas');
  holoCanvas.width = 1024;
  holoCanvas.height = 256;
  const holoCtx = holoCanvas.getContext('2d');
  const holoTexture = new THREE.CanvasTexture(holoCanvas);
  holoTexture.colorSpace = THREE.SRGBColorSpace;

  const holoBoardGroup = new THREE.Group();
  holoBoardGroup.position.set(0, 7.15, -5.4);
  holoBoardGroup.scale.setScalar(0.84);
  scene.add(holoBoardGroup);

  const holoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.4),
    new THREE.MeshBasicMaterial({
      map: holoTexture,
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  holoBoardGroup.add(holoMesh);

  // 3D Clickable XR "NEXT ROUND" Pill (visible in XR after a win so VR/AR players stay immersed!)
  const xrNextCanvas = document.createElement('canvas');
  xrNextCanvas.width = 512;
  xrNextCanvas.height = 128;
  const xnc = xrNextCanvas.getContext('2d');
  xnc.fillStyle = '#059669';
  xnc.beginPath();
  xnc.roundRect(10, 10, 492, 108, 34);
  xnc.fill();
  xnc.lineWidth = 6;
  xnc.strokeStyle = '#ffd700';
  xnc.stroke();
  xnc.fillStyle = '#ffffff';
  xnc.font = '900 44px "Segoe UI", system-ui, sans-serif';
  xnc.textAlign = 'center';
  xnc.textBaseline = 'middle';
  xnc.fillText('NEXT MYSTERY ROUND', 256, 66);

  const xrNextTex = new THREE.CanvasTexture(xrNextCanvas);
  xrNextTex.colorSpace = THREE.SRGBColorSpace;
  const xrNextBtnMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.52),
    new THREE.MeshBasicMaterial({ map: xrNextTex, transparent: true, side: THREE.DoubleSide })
  );
  xrNextBtnMesh.position.set(0, 1.45, -2.55);
  xrNextBtnMesh.visible = false;
  xrNextBtnMesh.userData = { action: 'nextRound', label: 'Start Next Mystery Round' };
  scene.add(xrNextBtnMesh);
  interactiveMeshes.push(xrNextBtnMesh);

  let holoHeadline = 'TALL MYSTERY BOX XR CLICKER';
  let holoSubtitle = 'Click a Tall Clicker — Hear a MOO to win $1,000!';
  let holoWinHighlight = false;

  updateHoloBoard = function drawHoloBoard(headline, subtitle, isWin) {
    if (headline !== undefined) holoHeadline = headline;
    if (subtitle !== undefined) holoSubtitle = subtitle;
    if (isWin !== undefined) holoWinHighlight = isWin;

    const w = holoCanvas.width;
    const h = holoCanvas.height;
    holoCtx.clearRect(0, 0, w, h);

    const bgGrad = holoCtx.createLinearGradient(0, 0, w, h);
    if (holoWinHighlight) {
      bgGrad.addColorStop(0, 'rgba(6, 95, 70, 0.94)');
      bgGrad.addColorStop(0.5, 'rgba(180, 83, 9, 0.92)');
      bgGrad.addColorStop(1, 'rgba(6, 78, 59, 0.94)');
    } else {
      bgGrad.addColorStop(0, 'rgba(10, 18, 40, 0.90)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
    }

    holoCtx.fillStyle = bgGrad;
    holoCtx.beginPath();
    holoCtx.roundRect(10, 10, w - 20, h - 20, 28);
    holoCtx.fill();

    holoCtx.lineWidth = 6;
    holoCtx.strokeStyle = holoWinHighlight ? '#ffd700' : 'rgba(255, 215, 0, 0.65)';
    holoCtx.stroke();

    // Top cash & stats strip
    holoCtx.fillStyle = '#34d399';
    holoCtx.font = '900 42px "Segoe UI", system-ui, sans-serif';
    holoCtx.textAlign = 'left';
    holoCtx.textBaseline = 'middle';
    holoCtx.fillText('WON: ' + formatDollars(state.bankroll), 46, 62);

    holoCtx.fillStyle = '#fde68a';
    holoCtx.font = '800 32px "Segoe UI", system-ui, sans-serif';
    holoCtx.textAlign = 'right';
    holoCtx.fillText('MOO WINS: ' + state.mooWins + '   |   CLICKS: ' + state.totalClicks, w - 46, 62);

    // Center headline
    holoCtx.fillStyle = holoWinHighlight ? '#ffffff' : '#ffd700';
    holoCtx.font = '900 48px "Segoe UI", system-ui, sans-serif';
    holoCtx.textAlign = 'center';
    holoCtx.fillText(holoHeadline, w / 2, 138);

    // Subtitle
    holoCtx.fillStyle = '#e2e8f0';
    holoCtx.font = '700 30px "Segoe UI", system-ui, sans-serif';
    holoCtx.fillText(holoSubtitle, w / 2, 202);

    holoTexture.needsUpdate = true;
  };

  updateHoloBoard();

  // ---------------------------------------------------------------------------
  // Dynamic 3D VFX Spawners: Energy Pulses, Sonic Rings, $1,000 Bills, Fireworks
  // ---------------------------------------------------------------------------
  const billTex = createDollarBillTexture();
  const billGeo = new THREE.PlaneGeometry(0.56, 0.25, 6, 1);
  // Subtle crisp banknote wave bend
  const bPos = billGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const bx = bPos.getX(i);
    bPos.setZ(i, Math.sin(bx * 6.5) * 0.025);
  }
  billGeo.computeVertexNormals();
  const billMat = new THREE.MeshStandardMaterial({
    map: billTex,
    roughness: 0.42,
    metalness: 0.12,
    side: THREE.DoubleSide
  });

  function spawnEnergyPulse(pillar, isWin) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(isWin ? 0.13 : 0.09, 12, 10),
      new THREE.MeshBasicMaterial({ color: isWin ? 0xffe066 : pillar.cfg.accentHex })
    );
    pillar.unitGroup.add(orb);
    activeEnergyPulses.push({
      mesh: orb,
      pillar,
      t: 0,
      speed: isWin ? 2.8 : 2.3
    });
  }

  function spawnSonicRing(pillar, isMoo) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: isMoo ? 0xffd700 : pillar.cfg.accentHex,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, isMoo ? 0.54 : 0.44, 36), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, pillar.boxHeight + 0.35, 0);
    pillar.boxPivot.add(ring);

    activeSonicRings.push({
      mesh: ring,
      mat: ringMat,
      parent: pillar.boxPivot,
      age: 0,
      maxAge: isMoo ? 1.45 : 0.72,
      growSpeed: isMoo ? 4.8 : 2.8,
      riseSpeed: isMoo ? 1.8 : 1.1
    });
  }

  function spawnDollarBillShower(worldOrigin, count = 56) {
    for (let i = 0; i < count; i++) {
      const bill = new THREE.Mesh(billGeo, billMat);
      bill.position.copy(worldOrigin);
      bill.position.x += (Math.random() - 0.5) * 0.65;
      bill.position.z += (Math.random() - 0.5) * 0.65;
      bill.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(bill);

      const angle = Math.random() * Math.PI * 2;
      const spread = 1.6 + Math.random() * 3.8;
      activeBills.push({
        mesh: bill,
        vel: new THREE.Vector3(
          Math.cos(angle) * spread,
          3.2 + Math.random() * 4.4,
          Math.sin(angle) * spread
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ),
        flutterPhase: Math.random() * Math.PI * 2,
        age: 0,
        maxAge: 5.5 + Math.random() * 2.5
      });
    }
  }

  function spawnJackpotFirework(worldCenter, hexColor) {
    const count = 64;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = worldCenter.x;
      positions[i * 3 + 1] = worldCenter.y;
      positions[i * 3 + 2] = worldCenter.z;

      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const speed = 2.0 + Math.random() * 3.4;
      velocities.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 1.0,
          Math.sin(phi) * Math.sin(theta) * speed
        )
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: hexColor,
      map: glowSpriteTex,
      size: 0.28,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    activeFireworks.push({ points, geo, mat, velocities, age: 0, maxAge: 1.85 });
  }

  // Wire 3D animation callbacks for the core game logic
  animatePillarClick3D = function (index, localClicks, isMoo) {
    const p = pillars[index];
    if (!p) return;
    p.pressOffset = 0.30;
    p.pressVel = -0.9;
    p.shakeIntensity = isMoo ? 0.14 : 0.085;
    p.chargeLevel = Math.min(10, localClicks * 3);
    if (!isMoo) {
      p.lidTarget = 0.42;
      p.lidPeekTimer = 0.55;
    }
    spawnEnergyPulse(p, isMoo);
    spawnSonicRing(p, isMoo);
  };

  animatePillarWin3D = function (index) {
    const p = pillars[index];
    if (!p) return;
    p.wonActive = true;
    p.chargeLevel = 10;
    p.lidTarget = 2.05; // Wide open lid!
    p.lidPeekTimer = 999;
    p.cowGroup.visible = true;
    p.jackpotBeam.visible = true;

    const topWorld = new THREE.Vector3(0, p.boxHeight + 0.55, 0);
    p.boxPivot.localToWorld(topWorld);

    jackpotLight.position.set(topWorld.x, topWorld.y + 0.8, topWorld.z + 0.8);
    jackpotLight.intensity = 6.0;

    // Triple expanding golden moo soundwaves
    spawnSonicRing(p, true);
    setTimeout(() => { if (p.wonActive) spawnSonicRing(p, true); }, 240);
    setTimeout(() => { if (p.wonActive) spawnSonicRing(p, true); }, 500);

    // Rain of 3D $1,000 bills & golden fireworks!
    spawnDollarBillShower(topWorld, 60);
    spawnJackpotFirework(topWorld.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xffd700);
    setTimeout(() => {
      spawnJackpotFirework(topWorld.clone().add(new THREE.Vector3(-1.1, 1.7, 0.2)), 0x34d399);
      spawnJackpotFirework(topWorld.clone().add(new THREE.Vector3(1.1, 1.6, 0.2)), 0xffe066);
    }, 320);

    if (state.isInXR) {
      xrNextBtnMesh.visible = true;
    }
  };

  resetPillars3D = function () {
    pillars.forEach((p) => {
      p.wonActive = false;
      p.chargeLevel = 0;
      p.lidTarget = 0;
      p.lidPeekTimer = 0;
      p.cowRise = 0;
      p.cowGroup.visible = false;
      p.jackpotBeam.visible = false;
      p.beamMat.opacity = 0;
      p.shakeIntensity = 0.04;
    });
    jackpotLight.intensity = 0;
    xrNextBtnMesh.visible = false;
  };

  // ---------------------------------------------------------------------------
  // Desktop & Mobile Pointer Raycasting + Responsive Camera Framing
  // ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  let hoveredPillarIndex = -1;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let pointerDownTime = 0;

  function setPointerFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  }

  function pickInteractiveAtPointer() {
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].object.visible) {
        return hits[i].object;
      }
    }
    return null;
  }

  canvas.addEventListener('pointermove', (e) => {
    if (state.isInXR) return;
    setPointerFromEvent(e);
    const hit = pickInteractiveAtPointer();
    const nextHover = hit && typeof hit.userData.pillarIndex === 'number' ? hit.userData.pillarIndex : -1;
    if (nextHover !== hoveredPillarIndex) {
      if (hoveredPillarIndex >= 0) pillars[hoveredPillarIndex].hovered = false;
      hoveredPillarIndex = nextHover;
      if (hoveredPillarIndex >= 0) pillars[hoveredPillarIndex].hovered = true;
    }
    canvas.classList.toggle('is-hovering-target', !!hit);
    if (targetHintEl) {
      targetHintEl.textContent = hit && hit.userData.label ? hit.userData.label : '';
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    pointerDownTime = performance.now();
  });

  canvas.addEventListener('pointerup', (e) => {
    if (state.isInXR) return;
    const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
    const elapsed = performance.now() - pointerDownTime;
    // Only register tap/click if user did not orbit-drag the camera
    if (dist > 14 || elapsed > 550) return;

    setPointerFromEvent(e);
    const hit = pickInteractiveAtPointer();
    if (!hit) return;

    if (hit.userData.action === 'nextRound') {
      startNewRound(false);
    } else if (typeof hit.userData.pillarIndex === 'number') {
      handlePillarPress(hit.userData.pillarIndex);
    }
  });

  function updateResponsiveFraming() {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    const aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;

    if (!state.isInXR) {
      if (aspect < 0.72) {
        // Tall portrait phones: wide & pulled back so all 5 tall mystery boxes fit edge-to-edge
        camera.fov = 62;
        camera.position.set(0, 3.8, 15.2);
        controls.target.set(0, 2.5, -3.4);
      } else if (aspect < 1.15) {
        // Square / small tablet viewports
        camera.fov = 54;
        camera.position.set(0, 3.55, 12.2);
        controls.target.set(0, 2.55, -3.4);
      } else {
        // Desktop widescreen: frames all 5 towering boxes, tall clickers & overhead holo board cleanly between HUD bars
        camera.fov = 50;
        camera.position.set(0, 3.5, 11.4);
        controls.target.set(0, 2.95, -3.5);
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
  // WebXR Session Management + Dual Controller Laser Raycasting
  // ---------------------------------------------------------------------------
  const controllerModelFactory = new XRControllerModelFactory();
  const xrControllers = [];
  const tempMatrix = new THREE.Matrix4();

  function setupXRController(slot) {
    const controller = renderer.xr.getController(slot);

    // Visible glowing laser beam
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -10)
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const rayLine = new THREE.Line(rayGeo, rayMat);
    rayLine.name = 'XRControllerRay';
    controller.add(rayLine);

    // Laser hit reticle dot
    const reticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd700 })
    );
    reticle.visible = false;
    controller.add(reticle);

    controller.addEventListener('selectstart', () => {
      audio.unlock();
      rayMat.color.setHex(0xffd700);
      const hit = raycastFromXRController(controller);
      if (!hit) return;
      if (hit.object.userData.action === 'nextRound') {
        startNewRound(false);
      } else if (typeof hit.object.userData.pillarIndex === 'number') {
        handlePillarPress(hit.object.userData.pillarIndex);
      }
    });

    controller.addEventListener('selectend', () => {
      rayMat.color.setHex(0x38bdf8);
    });

    cameraRig.add(controller);

    const grip = renderer.xr.getControllerGrip(slot);
    grip.add(controllerModelFactory.createControllerModel(grip));
    cameraRig.add(grip);

    xrControllers.push({ controller, rayLine, reticle });
  }

  setupXRController(0);
  setupXRController(1);

  function raycastFromXRController(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].object.visible) return hits[i];
    }
    return null;
  }

  let activeXrSession = null;

  startXRSession = async function (mode) {
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
        // Transparent passthrough in AR so the towering mystery boxes stand in your real room!
        environmentGroup.visible = false;
        scene.fog = null;
        renderer.setClearAlpha(0);
      } else {
        environmentGroup.visible = true;
        scene.fog = baseFog;
        renderer.setClearAlpha(1);
      }

      // Stand user cleanly at floor level in the center of the tall mystery arc
      cameraRig.position.set(0, 0, 1.35);
      holoBoardGroup.position.set(0, 7.05, -5.2);
      xrNextBtnMesh.visible = state.roundWon;

      session.addEventListener('end', () => {
        activeXrSession = null;
        state.isInXR = false;
        state.xrMode = null;
        controls.enabled = true;
        environmentGroup.visible = true;
        scene.fog = baseFog;
        renderer.setClearAlpha(1);
        cameraRig.position.set(0, 0, 0);
        holoBoardGroup.position.set(0, 7.15, -5.4);
        xrNextBtnMesh.visible = false;
        updateResponsiveFraming();
      });

      await renderer.xr.setSession(session);
    } catch (err) {
      console.warn('[ClickerXR] Failed to start ' + mode + ':', err);
    }
  };

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
    if (xrBadgeEl) {
      xrBadgeEl.textContent = vrOk || arOk ? 'WebXR Ready' : '3D WebXR';
    }
  }

  if (btnEnterVr) btnEnterVr.addEventListener('click', () => startXRSession('immersive-vr'));
  if (btnEnterAr) btnEnterAr.addEventListener('click', () => startXRSession('immersive-ar'));
  detectWebXRSupport();

  // WebGL context loss resilience
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
  });

  // ---------------------------------------------------------------------------
  // Master WebXR Procedural Animation Loop
  // ---------------------------------------------------------------------------
  let simTime = 0;
  let lastTs = 0;

  renderer.setAnimationLoop((timestamp) => {
    const rawDt = lastTs ? (timestamp - lastTs) * 0.001 : 0.016;
    lastTs = timestamp;
    const dt = Math.min(rawDt, 0.05);
    simTime += dt;

    // Smooth rolling bankroll counter animation
    if (state.displayedBankroll < state.bankroll) {
      const diff = state.bankroll - state.displayedBankroll;
      state.displayedBankroll = Math.min(state.bankroll, state.displayedBankroll + Math.max(25, diff * 7.5 * dt));
      syncHudStats();
    }

    // Update sky shader & floating dust motes
    skyUniforms.uTime.value = simTime;
    const dArr = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      dArr[i * 3 + 1] += dt * 0.16;
      dArr[i * 3] += Math.sin(simTime * 0.8 + dustSeed[i]) * dt * 0.08;
      if (dArr[i * 3 + 1] > 8.6) dArr[i * 3 + 1] = 0.4;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // Subtle floating motion for holographic scoreboard
    holoBoardGroup.position.y = (state.isInXR ? 7.05 : 7.15) + Math.sin(simTime * 1.4) * 0.08;
    if (xrNextBtnMesh.visible) {
      xrNextBtnMesh.position.y = 1.45 + Math.sin(simTime * 2.5) * 0.05;
    }

    // Animate all 5 Tall Mystery Boxes & Tall Clickers
    for (let i = 0; i < pillars.length; i++) {
      const p = pillars[i];

      // 1. Tall Clicker plunger spring-damper physics
      const stiffness = 135;
      const damping = 13;
      const springForce = -stiffness * p.pressOffset - damping * p.pressVel;
      p.pressVel += springForce * dt;
      p.pressOffset += p.pressVel * dt;
      if (Math.abs(p.pressOffset) < 0.0008 && Math.abs(p.pressVel) < 0.005) {
        p.pressOffset = 0;
        p.pressVel = 0;
      }
      const clampedPress = Math.max(-0.04, Math.min(0.32, p.pressOffset));
      p.plungerGroup.position.y = p.plungerRestY - clampedPress;

      // Dynamically compress & stretch the 3D helical spring!
      const springScaleY = Math.max(0.24, (p.springRestHeight - clampedPress) / p.springRestHeight);
      p.springMesh.scale.set(1 + clampedPress * 0.25, springScaleY, 1 + clampedPress * 0.25);

      // Cap hover & active glow
      const capPulse = 0.50 + 0.25 * Math.sin(simTime * 3.0 + i * 1.1);
      p.capMat.emissiveIntensity = p.wonActive ? 1.4 : p.hovered ? 1.05 : capPulse;

      // 10-segment LED ladder up the tall clicker column
      for (let k = 0; k < p.ledRings.length; k++) {
        const lit = k < p.chargeLevel;
        const wave = 0.55 + 0.45 * Math.sin(simTime * 6.0 - k * 0.65 + i);
        p.ledRings[k].emissiveIntensity = p.wonActive
          ? 1.5 * wave
          : lit
            ? 0.95 + 0.35 * wave
            : p.hovered
              ? 0.26
              : 0.08;
      }

      // 2. Tall Mystery Box shake & lid hinge animation
      if (p.shakeIntensity > 0.001) {
        p.boxPivot.rotation.z = Math.sin(simTime * 48) * p.shakeIntensity;
        p.boxPivot.rotation.x = Math.cos(simTime * 42) * p.shakeIntensity * 0.6;
        p.shakeIntensity = Math.max(0, p.shakeIntensity - dt * 0.24);
      } else {
        p.boxPivot.rotation.z *= 0.85;
        p.boxPivot.rotation.x *= 0.85;
      }

      if (!p.wonActive && p.lidPeekTimer > 0) {
        p.lidPeekTimer -= dt;
        if (p.lidPeekTimer <= 0) {
          p.lidTarget = 0;
        }
      }
      p.lidAngle += (p.lidTarget - p.lidAngle) * Math.min(1, dt * 8.5);
      p.lidPivot.rotation.x = -p.lidAngle;

      // Emissive '?' glow pulse
      const isWarmSecret = !state.roundWon && i === state.winningIndex && state.roundClicks >= 2;
      const boxGlowBase = p.wonActive ? 1.35 : p.hovered ? 0.95 : isWarmSecret ? 0.82 : 0.58;
      p.boxSideMat.emissiveIntensity = boxGlowBase + Math.sin(simTime * 2.6 + i) * 0.14;
      p.innerGlowMat.opacity = p.wonActive ? 0.95 : 0.25 + p.lidAngle * 0.5;

      // Rotating beacon crystal
      p.beaconCrystal.rotation.y = simTime * 1.4 + i;
      p.beaconCrystal.position.y = p.boxHeight + (p.wonActive ? 2.45 : 0.92) + Math.sin(simTime * 2.4 + i) * 0.14;

      // 3. Golden Prize Cow triumph animation when this Tall Mystery Box mooed!
      if (p.wonActive) {
        p.cowRise = Math.min(1, p.cowRise + dt * 2.1);
        const easeOutBack = 1 + 1.4 * Math.pow(p.cowRise - 1, 3) + 0.6 * Math.pow(p.cowRise - 1, 2);
        p.cowGroup.position.y = p.boxHeight - 0.45 + easeOutBack * 0.95 + Math.sin(simTime * 5.2) * 0.08;
        p.cowGroup.rotation.y = Math.sin(simTime * 2.4) * 0.28;
        p.cowGroup.userData.headGroup.rotation.x = Math.sin(simTime * 6.5) * 0.16;
        p.cowGroup.userData.leftEar.rotation.z = 0.25 + Math.sin(simTime * 11) * 0.22;
        p.cowGroup.userData.rightEar.rotation.z = -0.25 - Math.sin(simTime * 11) * 0.22;
        p.cowGroup.userData.halo.rotation.z = simTime * 1.8;
        p.cowGroup.userData.cowbell.rotation.z = Math.sin(simTime * 12) * 0.35;

        p.beamMat.opacity = 0.24 + 0.10 * Math.sin(simTime * 4.5);
        p.jackpotBeam.rotation.y = simTime * 0.9;
      }
    }

    // Energy pulses racing up the pneumatic tubes
    for (let i = activeEnergyPulses.length - 1; i >= 0; i--) {
      const ep = activeEnergyPulses[i];
      ep.t += dt * ep.speed;
      if (ep.t >= 1) {
        ep.pillar.unitGroup.remove(ep.mesh);
        ep.mesh.geometry.dispose();
        ep.mesh.material.dispose();
        activeEnergyPulses.splice(i, 1);
      } else {
        ep.pillar.tubeCurve.getPointAt(ep.t, ep.mesh.position);
      }
    }

    // Expanding 3D sonic rings
    for (let i = activeSonicRings.length - 1; i >= 0; i--) {
      const sr = activeSonicRings[i];
      sr.age += dt;
      if (sr.age >= sr.maxAge) {
        sr.parent.remove(sr.mesh);
        sr.mesh.geometry.dispose();
        sr.mat.dispose();
        activeSonicRings.splice(i, 1);
      } else {
        const frac = sr.age / sr.maxAge;
        const sc = 1 + frac * sr.growSpeed;
        sr.mesh.scale.set(sc, sc, 1);
        sr.mesh.position.y += dt * sr.riseSpeed;
        sr.mat.opacity = (1 - frac) * 0.88;
      }
    }

    // Fluttering 3D $1,000 Dollar Bills
    for (let i = activeBills.length - 1; i >= 0; i--) {
      const b = activeBills[i];
      b.age += dt;
      if (b.age >= b.maxAge) {
        scene.remove(b.mesh);
        activeBills.splice(i, 1);
        continue;
      }
      b.vel.y -= 2.4 * dt;
      // Aerodynamic fluttering drag
      b.vel.x *= 0.985;
      b.vel.z *= 0.985;
      if (b.vel.y < -1.1) b.vel.y = -1.1;

      b.mesh.position.x += (b.vel.x + Math.sin(simTime * 4.2 + b.flutterPhase) * 0.45) * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += (b.vel.z + Math.cos(simTime * 3.6 + b.flutterPhase) * 0.45) * dt;

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

    // Golden Fireworks
    for (let i = activeFireworks.length - 1; i >= 0; i--) {
      const fw = activeFireworks[i];
      fw.age += dt;
      if (fw.age >= fw.maxAge) {
        scene.remove(fw.points);
        fw.geo.dispose();
        fw.mat.dispose();
        activeFireworks.splice(i, 1);
        continue;
      }
      const posAttr = fw.geo.attributes.position;
      for (let k = 0; k < fw.velocities.length; k++) {
        const vel = fw.velocities[k];
        vel.multiplyScalar(0.975);
        vel.y -= 2.2 * dt;
        posAttr.setXYZ(
          k,
          posAttr.getX(k) + vel.x * dt,
          posAttr.getY(k) + vel.y * dt,
          posAttr.getZ(k) + vel.z * dt
        );
      }
      posAttr.needsUpdate = true;
      fw.mat.opacity = Math.max(0, 1 - fw.age / fw.maxAge);
    }

    // XR Controller hover laser reticles
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
