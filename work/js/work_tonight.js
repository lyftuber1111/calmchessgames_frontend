/**
 * Calm Chess Games — Target Night Shift XR (work_tonight.html)
 * End-to-End Interactive WebXR + Xbox Gamepad + Desktop/Touch Procedural 3D Game
 *  - Employee: Addyson ("Hello, my name is Addyson")
 *  - Shift: 8:30 PM -> 9:00 PM Interactive Lunch Break -> 3:00 AM Go Home!
 *  - Restock: Jumbo Squishies, NeeDoh Squishies, Clickers, Large VRs, Small VRs
 *  - Lost Kids + Big Red Phone PA ("Attention shoppers, we have found <Kid's Name>!")
 *  - First-class Xbox Gamepad API support with dual-rumble haptics + Zero instructional badges
 */

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { createWorkAudioEngine } from './work_audio.js';
import {
  ITEM_TYPES,
  ITEM_META,
  LOST_KID_NAMES,
  createStoreEnvironment,
  createStoreWallClock,
  createStockCart,
  createShelfBay,
  createRestockItem,
  createBigRedPhoneStation,
  createPersonCharacter,
  createBreakroomArea,
  createNameBadgeTexture,
  createNameTagSprite
} from './work_models.js';

(function initTargetNightShiftXR() {
  'use strict';

  const canvas = document.getElementById('xr-canvas');
  const clockEl = document.getElementById('hud-clock');
  const stockedEl = document.getElementById('hud-stocked');
  const kidsEl = document.getElementById('hud-kids');
  const reticleEl = document.getElementById('reticle');
  const paBannerEl = document.getElementById('pa-banner');
  const paTextEl = document.getElementById('pa-text');
  const btnMute = document.getElementById('btn-mute');
  const btnEnterVr = document.getElementById('btn-enter-vr');
  const btnEnterAr = document.getElementById('btn-enter-ar');
  const shiftDialog = document.getElementById('shift-complete-dialog');
  const summaryStockedEl = document.getElementById('summary-stocked');
  const summaryKidsEl = document.getElementById('summary-kids');
  const btnPlayAgain = document.getElementById('btn-play-again');

  // Mobile Touch Control Elements (Lower-Left Move + Upper-Right Look/Tap + Lower-Right Actions)
  const mobileTouchControlsEl = document.getElementById('mobile-touch-controls');
  const touchMoveZone = document.getElementById('touch-move-zone');
  const touchMoveKnob = document.getElementById('touch-move-knob');
  const touchLookZone = document.getElementById('touch-look-zone');
  const touchLookKnob = document.getElementById('touch-look-knob');
  const touchBtnInteract = document.getElementById('touch-btn-interact');
  const touchBtnSquish = document.getElementById('touch-btn-squish');
  const touchBtnTurn180 = document.getElementById('touch-btn-turn180');

  const audio = createWorkAudioEngine();

  // ---------------------------------------------------------------------------
  // Mobile Device Detection (wormhole0-style UA + pointer/hover + touch checks)
  // ---------------------------------------------------------------------------
  let hasTouchInteraction = false;

  function isVrHeadsetUA() {
    const ua = navigator.userAgent || '';
    return /Quest|Oculus|Vision|Pico|Vive|Wolvic/i.test(ua);
  }

  function detectMobileInUse() {
    if (state.isInXR || isVrHeadsetUA()) return false;

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mobile') === '1') return true;
      if (params.get('mobile') === '0') return false;
    } catch (_) {}

    const ua = navigator.userAgent || '';
    const isMobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      Boolean(navigator.userAgentData && navigator.userAgentData.mobile);

    if (isMobileUA) return true;

    const hasCoarsePointer = Boolean(
      window.matchMedia && window.matchMedia('(pointer: coarse), (hover: none)').matches
    );
    if (hasCoarsePointer) return true;

    const hasTouchPoints = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (hasTouchPoints && (hasTouchInteraction || Math.min(window.innerWidth, window.innerHeight) <= 1024)) {
      return true;
    }

    return hasTouchInteraction;
  }

  function updateMobileTouchVisibility() {
    const isMobile = detectMobileInUse();
    state.isMobile = isMobile;
    document.body.classList.toggle('show-touch-controls', isMobile);
    document.body.classList.toggle('is-mobile-device', isMobile);
    document.body.classList.toggle('hide-touch-controls', !isMobile);
    if (!isMobile) {
      resetTouchControls();
    }
    return isMobile;
  }

  // ---------------------------------------------------------------------------
  // Shift State & Timeline Constants
  // 0 min = 8:30 PM | 30 min = 9:00 PM (Lunch!) | 60 min = 9:30 PM | 390 min = 3:00 AM (Go Home!)
  // ---------------------------------------------------------------------------
  const SHIFT_START_HOUR_MIN = 20 * 60 + 30; // 8:30 PM (1230 mins)
  const LUNCH_START_MIN = 30;  // 9:00 PM
  const LUNCH_END_MIN = 60;    // 9:30 PM
  const SHIFT_END_MIN = 390;   // 3:00 AM

  const state = {
    shiftMinutes: 0,
    phase: 'shift_early', // 'shift_early' | 'lunch' | 'shift_late' | 'clock_out_ready' | 'complete'
    lunchTriggered: false,
    lunchCompleted: false,
    lunchTimer: 0,
    stockedCount: 0,
    kidsReunited: 0,
    combo: 0,
    lastStockTime: 0,
    heldItem: null,        // { mesh, itemType, label, squishPhase, squishVel, clickPhase }
    cartItems: [],         // Array of { mesh, itemType, slotIndex, homePos, squishPhase }
    activeLostKid: null,   // { char, name, following, paged, state, spawnPos, walkTimer }
    activeParent: null,    // { char, targetKid, state }
    nextKidShiftMin: 11,   // First lost kid wanders in around 8:41 PM!
    kidSeedCounter: 0,
    phoneActiveTimer: 0,
    paBannerTimer: 0,
    doorOpenAmount: 0,
    isInXR: false,
    xrMode: null,
    vrSupported: false,
    arSupported: false,
    isMobile: false,
    touchMove: { x: 0, y: 0 },
    touchLook: { x: 0, y: 0 },
    quickTurnRemaining: 0,
    moveTarget: null,      // Click-to-walk floor target (desktop/touch convenience)
    footstepAccum: 0,
    celebrationFireworks: 0
  };

  function formatShiftClock(minsFromStart) {
    const clamped = Math.min(SHIFT_END_MIN, Math.max(0, Math.floor(minsFromStart)));
    const totalMins = (SHIFT_START_HOUR_MIN + clamped) % (24 * 60);
    const h24 = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function updateHudCounters() {
    if (stockedEl) stockedEl.textContent = String(state.stockedCount);
    if (kidsEl) kidsEl.textContent = String(state.kidsReunited);
  }

  function showPaBanner(text, duration = 5.2) {
    if (!paBannerEl || !paTextEl) return;
    paTextEl.textContent = text;
    paBannerEl.hidden = false;
    state.paBannerTimer = duration;
  }

  // ---------------------------------------------------------------------------
  // Three.js Renderer, Scene & Lighting
  // ---------------------------------------------------------------------------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.error('[WorkTonightXR] WebGL unavailable:', err);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1022);
  scene.fog = new THREE.FogExp2(0x161c2e, 0.014);

  // Player Rig (holds Camera + Hand Item Anchor + WebXR Controllers)
  const playerRig = new THREE.Group();
  playerRig.position.set(0, 0, 3.6);
  scene.add(playerRig);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.05, 80);
  camera.position.set(0, 1.56, 0);
  playerRig.add(camera);

  // Held item anchor gently positioned in lower-right view of camera (or right controller in XR)
  const heldAnchorDesktop = new THREE.Group();
  heldAnchorDesktop.position.set(0.36, -0.26, -0.64);
  camera.add(heldAnchorDesktop);

  // Lighting — Bright cheerful Target store interior!
  const hemiLight = new THREE.HemisphereLight(0xfffaf5, 0xdbeafe, 0.92);
  scene.add(hemiLight);

  const mainStoreLight = new THREE.DirectionalLight(0xffffff, 1.25);
  mainStoreLight.position.set(4, 9.5, 4);
  mainStoreLight.castShadow = true;
  mainStoreLight.shadow.mapSize.set(1024, 1024);
  mainStoreLight.shadow.camera.near = 1;
  mainStoreLight.shadow.camera.far = 26;
  mainStoreLight.shadow.camera.left = -11;
  mainStoreLight.shadow.camera.right = 11;
  mainStoreLight.shadow.camera.top = 11;
  mainStoreLight.shadow.camera.bottom = -11;
  scene.add(mainStoreLight);

  const warmAisleFill = new THREE.PointLight(0xfff1e6, 0.95, 22);
  warmAisleFill.position.set(0, 4.4, -2.5);
  scene.add(warmAisleFill);

  const lunchSpotLight = new THREE.PointLight(0xfef08a, 0.3, 9);
  lunchSpotLight.position.set(-5.8, 3.4, 5.2);
  scene.add(lunchSpotLight);

  const exitGlowLight = new THREE.PointLight(0x4ade80, 0.0, 10);
  exitGlowLight.position.set(0, 2.8, 8.6);
  scene.add(exitGlowLight);

  // ---------------------------------------------------------------------------
  // Build Target Store World!
  // ---------------------------------------------------------------------------
  const storeEnv = createStoreEnvironment();
  scene.add(storeEnv.group);

  // Digital Store Wall Clock centered prominently on back wall
  const wallClock = createStoreWallClock();
  wallClock.group.position.set(0, 3.55, -9.02);
  scene.add(wallClock.group);

  // 5 Restocking Gondola Bays arranged in an inviting semi-open Target showroom!
  const allShelfSlots = [];
  const shelfBayConfigs = [
    { type: ITEM_TYPES.JUMBO_SQUISHY, title: 'JUMBO SQUISHIES', sub: 'SOFT & GIANT', pos: [-5.6, 0, -5.0], rotY: Math.PI / 2 },
    { type: ITEM_TYPES.NEEDOH,        title: 'NEEDOH SQUISHIES', sub: 'NICE CUBES & BALLS', pos: [-5.6, 0, -1.3], rotY: Math.PI / 2 },
    { type: ITEM_TYPES.CLICKER,       title: 'CLICKERS', sub: 'KAWAII FIDGETS', pos: [0.0, 0, -7.8], rotY: 0 },
    { type: ITEM_TYPES.VR_LARGE,      title: 'LARGE VRs', sub: 'PRO XR HEADSETS', pos: [5.6, 0, -5.0], rotY: -Math.PI / 2 },
    { type: ITEM_TYPES.VR_SMALL,      title: 'SMALL VRs', sub: 'MINI XR GOGGLES', pos: [5.6, 0, -1.3], rotY: -Math.PI / 2 }
  ];

  const shelfBays = shelfBayConfigs.map((cfg) => {
    const bay = createShelfBay(cfg.type, cfg.title, cfg.sub);
    bay.group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    bay.group.rotation.y = cfg.rotY;
    scene.add(bay.group);
    allShelfSlots.push(...bay.slots);
    return bay;
  });

  // Red Target Stock Cart right in the center aisle!
  const stockCart = createStockCart();
  stockCart.group.position.set(0, 0, -2.0);
  scene.add(stockCart.group);

  // BIG RED PHONE Station — super prominent right in front-right view of the main aisle!
  const bigRedPhone = createBigRedPhoneStation();
  bigRedPhone.group.position.set(2.95, 0, -6.9);
  bigRedPhone.group.rotation.y = -0.35;
  scene.add(bigRedPhone.group);

  // 9:00 PM Breakroom & Lunch Table — front-left alcove!
  const breakroom = createBreakroomArea();
  breakroom.group.position.set(-5.6, 0, 4.6);
  breakroom.group.rotation.y = Math.PI * 0.25;
  scene.add(breakroom.group);

  // ---------------------------------------------------------------------------
  // Particle FX Pool (Hearts, Stars, Confetti!)
  // ---------------------------------------------------------------------------
  const particles = [];
  const particleGeo = new THREE.OctahedronGeometry(0.065, 0);

  function spawnSparkleBurst(worldPos, colors = [0xff5ca8, 0xffe066, 0x38bdf8, 0xa6e84f], count = 16) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(particleGeo, mat);
      mesh.position.copy(worldPos);
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.4;
      const vel = new THREE.Vector3(
        Math.cos(angle) * spd,
        1.6 + Math.random() * 2.4,
        Math.sin(angle) * spd
      );
      scene.add(mesh);
      particles.push({ mesh, vel, life: 0.7 + Math.random() * 0.5, maxLife: 1.2 });
    }
  }

  // ---------------------------------------------------------------------------
  // Stock Cart Replenishment Logic
  // ---------------------------------------------------------------------------
  let itemVariantCounter = 0;
  const ALL_TYPES = [
    ITEM_TYPES.JUMBO_SQUISHY,
    ITEM_TYPES.NEEDOH,
    ITEM_TYPES.CLICKER,
    ITEM_TYPES.VR_LARGE,
    ITEM_TYPES.VR_SMALL
  ];

  function populateStockCart() {
    // Clear any stale entries
    for (const entry of state.cartItems) {
      if (entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
    }
    state.cartItems = [];

    // Ensure every wave always includes all 5 item categories + 1 random bonus!
    const batch = [...ALL_TYPES, ALL_TYPES[itemVariantCounter % ALL_TYPES.length]];
    // Shuffle slightly for variety
    for (let i = batch.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [batch[i], batch[j]] = [batch[j], batch[i]];
    }

    batch.forEach((itemType, idx) => {
      const mesh = createRestockItem(itemType, itemVariantCounter++);
      const localPos = stockCart.slotLocalPositions[idx];
      mesh.position.copy(localPos);
      mesh.userData.interactType = 'cart_item';
      mesh.userData.cartSlotIndex = idx;
      stockCart.group.add(mesh);

      state.cartItems.push({
        mesh,
        itemType,
        slotIndex: idx,
        homePos: localPos.clone(),
        squishPhase: Math.random() * Math.PI * 2
      });
    });

    const cartWorld = new THREE.Vector3();
    stockCart.group.getWorldPosition(cartWorld);
    cartWorld.y += 1.2;
    spawnSparkleBurst(cartWorld, [0xcc0000, 0xffffff, 0xffe066], 14);
  }

  populateStockCart();

  // ---------------------------------------------------------------------------
  // Lost Kid & Parent Reunion System
  // ---------------------------------------------------------------------------
  function spawnLostKid() {
    if (state.activeLostKid || state.phase === 'complete') return;

    const name = LOST_KID_NAMES[state.kidSeedCounter % LOST_KID_NAMES.length];
    const kidChar = createPersonCharacter({ isKid: true, name, seed: state.kidSeedCounter++ });

    // Pick a cute aisle spot so Addyson immediately spots them!
    const spots = [
      new THREE.Vector3(-2.6, 0, 1.5),
      new THREE.Vector3(2.4, 0, -4.6),
      new THREE.Vector3(-2.4, 0, -4.2),
      new THREE.Vector3(2.2, 0, 1.8)
    ];
    const spawnPos = spots[(state.kidSeedCounter - 1) % spots.length].clone();
    kidChar.group.position.copy(spawnPos);
    scene.add(kidChar.group);

    state.activeLostKid = {
      char: kidChar,
      name,
      following: false,
      paged: false,
      reunited: false,
      walkTimer: 0
    };

    audio.playLostKidCue();
    spawnSparkleBurst(spawnPos.clone().add(new THREE.Vector3(0, 1.2, 0)), [0xffd43b, 0xff5ca8], 10);
  }

  function triggerBigRedPhone() {
    audio.unlock();
    vibrateGamepad(120, 0.35, 0.6);
    state.phoneActiveTimer = 3.2;

    if (state.activeLostKid && !state.activeLostKid.paged) {
      const kid = state.activeLostKid;
      kid.paged = true;

      // Update floating kid bubble to excited heart!
      if (kid.char.nameSprite) {
        kid.char.group.remove(kid.char.nameSprite);
      }
      kid.char.nameSprite = createNameTagSprite(`${kid.name}! ♥`, '#ecfdf5', '#10b981', '#047857');
      kid.char.nameSprite.position.set(0, 1.85, 0);
      kid.char.group.add(kid.char.nameSprite);

      const message = `Attention shoppers, we have found ${kid.name}!`;
      showPaBanner(message, 5.5);
      audio.playBigRedPhoneAnnouncement(kid.name);

      // Spawn the kid's Parent rushing in from the front aisle!
      const parentChar = createPersonCharacter({ isKid: false, name: 'Parent', seed: state.kidSeedCounter + 2 });
      parentChar.group.position.set(0.4, 0, 8.2);
      scene.add(parentChar.group);

      state.activeParent = {
        char: parentChar,
        state: 'approaching', // 'approaching' | 'hugging' | 'leaving'
        hugTimer: 0
      };
    } else {
      // Even when no kid is lost, picking up the Big Red Phone is still fun & interactive!
      const msg = 'Attention shoppers, fresh squishies & VRs are ready!';
      showPaBanner(msg, 3.6);
      audio.playBigRedPhoneAnnouncement(null);
    }

    const phoneWorld = new THREE.Vector3();
    bigRedPhone.group.getWorldPosition(phoneWorld);
    phoneWorld.y += 2.3;
    spawnSparkleBurst(phoneWorld, [0xff2222, 0xffe066, 0xffffff], 14);
  }

  // ---------------------------------------------------------------------------
  // Grab, Squish/Click & Restock Logic
  // ---------------------------------------------------------------------------
  function grabCartItem(cartEntry) {
    if (state.heldItem) return false;
    audio.unlock();

    const idx = state.cartItems.indexOf(cartEntry);
    if (idx !== -1) state.cartItems.splice(idx, 1);

    const mesh = cartEntry.mesh;
    mesh.userData.interactType = 'held_item';
    mesh.position.set(0, -0.08, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(1);

    const parentAnchor = state.isInXR ? xrRightHoldAnchor : heldAnchorDesktop;
    parentAnchor.add(mesh);

    state.heldItem = {
      mesh,
      itemType: cartEntry.itemType,
      label: mesh.userData.label || ITEM_META[cartEntry.itemType].label,
      squishTime: 0.45,
      clickTime: 0
    };

    audio.playPickup(cartEntry.itemType);
    vibrateGamepad(65, 0.25, 0.45);
    return true;
  }

  function playWithHeldItem() {
    if (!state.heldItem) return;
    audio.unlock();
    const { itemType } = state.heldItem;
    state.heldItem.squishTime = 0.5;
    state.heldItem.clickTime = 0.3;

    if (itemType === ITEM_TYPES.JUMBO_SQUISHY) audio.playSquish(true);
    else if (itemType === ITEM_TYPES.NEEDOH) audio.playSquish(false);
    else if (itemType === ITEM_TYPES.CLICKER) audio.playClicker();
    else if (itemType === ITEM_TYPES.VR_LARGE) audio.playVrTech(true);
    else audio.playVrTech(false);

    vibrateGamepad(55, 0.2, 0.5);
  }

  function returnHeldItemToCart() {
    if (!state.heldItem) return;
    // Find an unused cart slot index
    const used = new Set(state.cartItems.map((c) => c.slotIndex));
    let slotIdx = 0;
    while (used.has(slotIdx) && slotIdx < stockCart.slotLocalPositions.length - 1) slotIdx++;

    const mesh = state.heldItem.mesh;
    const itemType = state.heldItem.itemType;
    mesh.userData.interactType = 'cart_item';
    mesh.scale.setScalar(1);
    const localPos = stockCart.slotLocalPositions[slotIdx];
    mesh.position.copy(localPos);
    mesh.rotation.set(0, 0, 0);
    stockCart.group.add(mesh);

    state.cartItems.push({
      mesh,
      itemType,
      slotIndex: slotIdx,
      homePos: localPos.clone(),
      squishPhase: 0
    });
    state.heldItem = null;
    audio.playPickup(itemType);
  }

  function clearBayIfFull(itemType) {
    const baySlots = allShelfSlots.filter((s) => s.itemType === itemType);
    if (baySlots.every((s) => s.occupied)) {
      // Celebratory shelf clear after a brief moment so players can keep restocking endlessly!
      setTimeout(() => {
        baySlots.forEach((s) => {
          if (s.itemMesh && s.itemMesh.parent) s.itemMesh.parent.remove(s.itemMesh);
          s.itemMesh = null;
          s.occupied = false;
        });
      }, 950);
    }
  }

  function placeHeldItemOnSlot(slot) {
    if (!state.heldItem) return false;
    if (slot.itemType !== state.heldItem.itemType) {
      audio.playErrorBump();
      vibrateGamepad(90, 0.6, 0.15);
      return false;
    }

    const mesh = state.heldItem.mesh;
    const itemType = state.heldItem.itemType;
    mesh.userData.interactType = 'stocked_item';
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1.22, 0.76, 1.22); // bouncy squash on landing!
    mesh.userData.landingPop = 0.45;
    slot.anchor.add(mesh);

    slot.occupied = true;
    slot.itemMesh = mesh;
    state.heldItem = null;

    // Combo & Score
    const now = performance.now();
    state.combo = (now - state.lastStockTime < 9000) ? Math.min(state.combo + 1, 6) : 1;
    state.lastStockTime = now;
    state.stockedCount++;
    updateHudCounters();

    // Gently nudge shift clock forward on productive restocking!
    if (state.phase === 'shift_early') {
      state.shiftMinutes = Math.min(LUNCH_START_MIN, state.shiftMinutes + 4.5);
    } else if (state.phase === 'shift_late') {
      state.shiftMinutes = Math.min(SHIFT_END_MIN, state.shiftMinutes + 15);
    }

    audio.playRestockSuccess(state.combo);
    vibrateGamepad(85, 0.3, 0.7);

    const worldPos = new THREE.Vector3();
    slot.anchor.getWorldPosition(worldPos);
    worldPos.y += 0.25;
    spawnSparkleBurst(worldPos, [ITEM_META[itemType].colorHex, 0xffe066, 0xffffff], 18);

    clearBayIfFull(itemType);

    // Automatically replenish the rolling Red Stock Cart whenever it empties!
    if (state.cartItems.length === 0) {
      setTimeout(() => {
        if (state.cartItems.length === 0 && state.phase !== 'complete') {
          populateStockCart();
        }
      }, 650);
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // 9:00 PM Lunch Break & 3:00 AM Clock-Out Interactions
  // ---------------------------------------------------------------------------
  function resetLunchTray() {
    breakroom.foodItems.forEach((food) => {
      food.visible = true;
      food.scale.setScalar(1);
      food.userData.bitesLeft = food.userData.maxBites;
    });
  }

  function finishLunchBreak() {
    if (state.lunchCompleted) return;
    state.lunchCompleted = true;
    state.phase = 'shift_late';
    state.shiftMinutes = Math.max(state.shiftMinutes, LUNCH_END_MIN);
    audio.playRestockSuccess(5);
    vibrateGamepad(120, 0.35, 0.55);

    const tableWorld = new THREE.Vector3();
    breakroom.group.getWorldPosition(tableWorld);
    tableWorld.y += 1.3;
    spawnSparkleBurst(tableWorld, [0x22c55e, 0xffe066, 0xff5ca8], 24);
  }

  function interactLunchFood(foodMesh) {
    audio.unlock();
    if (!foodMesh.visible || foodMesh.userData.bitesLeft <= 0) return;

    foodMesh.userData.bitesLeft--;
    audio.playEatBite(Boolean(foodMesh.userData.isDrink));
    vibrateGamepad(65, 0.2, 0.4);

    const worldPos = new THREE.Vector3();
    foodMesh.getWorldPosition(worldPos);
    spawnSparkleBurst(worldPos, [0xfbbf24, 0xff6bbd, 0xffffff], 10);

    if (foodMesh.userData.bitesLeft <= 0) {
      foodMesh.visible = false;
    } else {
      const ratio = 0.45 + 0.55 * (foodMesh.userData.bitesLeft / foodMesh.userData.maxBites);
      foodMesh.scale.setScalar(ratio);
    }

    // Advance 9:00 PM -> 9:30 PM lunch clock!
    if (state.phase === 'lunch') {
      state.shiftMinutes = Math.min(LUNCH_END_MIN, state.shiftMinutes + 5);
      const anyLeft = breakroom.foodItems.some((f) => f.visible);
      if (!anyLeft || state.shiftMinutes >= LUNCH_END_MIN) {
        finishLunchBreak();
      }
    }
  }

  function triggerShiftComplete() {
    if (state.phase === 'complete') return;
    state.phase = 'complete';
    state.shiftMinutes = SHIFT_END_MIN;
    state.celebrationFireworks = 5.0;
    audio.playClockOutFanfare();
    vibrateGamepad(260, 0.5, 0.85);

    const exitWorld = new THREE.Vector3(0, 1.8, 8.8);
    spawnSparkleBurst(exitWorld, [0xff5ca8, 0xffe066, 0x38bdf8, 0x4ade80], 34);

    if (summaryStockedEl) summaryStockedEl.textContent = String(state.stockedCount);
    if (summaryKidsEl) summaryKidsEl.textContent = String(state.kidsReunited);
    resetTouchControls();

    if (shiftDialog && !shiftDialog.open) {
      if (state.isInXR && renderer.xr.getSession()) {
        try { renderer.xr.getSession().end(); } catch (_) {}
      }
      if (document.pointerLockElement) {
        try { document.exitPointerLock(); } catch (_) {}
      }
      try { shiftDialog.showModal(); } catch (_) {}
    }
  }

  function restartNewShift() {
    if (shiftDialog && shiftDialog.open) {
      shiftDialog.close();
    }

    // Clear stocked shelf items
    allShelfSlots.forEach((s) => {
      if (s.itemMesh && s.itemMesh.parent) s.itemMesh.parent.remove(s.itemMesh);
      s.itemMesh = null;
      s.occupied = false;
    });

    // Clear held item
    if (state.heldItem && state.heldItem.mesh.parent) {
      state.heldItem.mesh.parent.remove(state.heldItem.mesh);
    }
    state.heldItem = null;

    // Clear lost kid & parent
    if (state.activeLostKid) {
      scene.remove(state.activeLostKid.char.group);
      state.activeLostKid = null;
    }
    if (state.activeParent) {
      scene.remove(state.activeParent.char.group);
      state.activeParent = null;
    }

    state.shiftMinutes = 0;
    state.phase = 'shift_early';
    state.lunchTriggered = false;
    state.lunchCompleted = false;
    state.lunchTimer = 0;
    state.stockedCount = 0;
    state.kidsReunited = 0;
    state.combo = 0;
    state.nextKidShiftMin = 11;
    state.doorOpenAmount = 0;
    state.moveTarget = null;
    state.quickTurnRemaining = 0;
    resetTouchControls();

    playerRig.position.set(0, 0, 3.6);
    lookYaw = 0;
    lookPitch = -0.05;

    resetLunchTray();
    populateStockCart();
    updateHudCounters();
    audio.unlock();
    audio.playRestockSuccess(2);
  }

  // ---------------------------------------------------------------------------
  // Universal Context-Aware Interaction Resolver (Ray + Proximity Auto-Assist!)
  // Makes Xbox Controller, Mouse, Touch, and WebXR feel effortless without hints!
  // ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const tempVec = new THREE.Vector3();
  const tempVec2 = new THREE.Vector3();

  function findOwnerInteractable(obj) {
    let cur = obj;
    while (cur && cur !== scene) {
      if (cur.userData && cur.userData.interactType) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function findOpenSlotForType(itemType, refWorldPos = null) {
    const candidates = allShelfSlots.filter((s) => s.itemType === itemType && !s.occupied);
    if (!candidates.length) return null;
    if (!refWorldPos) return candidates[0];
    let best = candidates[0];
    let bestDist = Infinity;
    for (const s of candidates) {
      s.anchor.getWorldPosition(tempVec);
      const d = tempVec.distanceTo(refWorldPos);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  }

  function performPrimaryInteraction(customRay = null, clickFloorAllowed = false) {
    audio.unlock();
    if (state.phase === 'complete') {
      restartNewShift();
      return;
    }

    if (customRay) {
      raycaster.ray.copy(customRay);
    } else {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    }

    const hits = raycaster.intersectObjects(scene.children, true);
    const playerWorldPos = new THREE.Vector3();
    camera.getWorldPosition(playerWorldPos);

    // 1. Check direct raycast hits within comfortable reach (5.5m)
    for (const hit of hits) {
      if (hit.distance > 6.0) break;

      const interactObj = findOwnerInteractable(hit.object);
      if (interactObj) {
        const iType = interactObj.userData.interactType;

        if (iType === 'big_red_phone' && hit.distance < 4.8) {
          triggerBigRedPhone();
          return;
        }
        if (iType === 'lost_kid' && state.activeLostKid && hit.distance < 4.8) {
          state.activeLostKid.following = true;
          audio.playLostKidCue();
          vibrateGamepad(60, 0.2, 0.4);
          spawnSparkleBurst(hit.point, [0xffd43b, 0xff5ca8], 10);
          return;
        }
        if (iType === 'lunch_food' && hit.distance < 4.0) {
          interactLunchFood(interactObj);
          return;
        }
        if (iType === 'time_clock' && hit.distance < 4.2) {
          if (state.phase === 'lunch') {
            finishLunchBreak();
            return;
          }
          if (state.phase === 'clock_out_ready') {
            triggerShiftComplete();
            return;
          }
          audio.playRestockSuccess(1);
          return;
        }
        if (iType === 'exit_home' && state.phase === 'clock_out_ready' && hit.distance < 6.0) {
          triggerShiftComplete();
          return;
        }
        if (iType === 'cart_item' && !state.heldItem && hit.distance < 4.6) {
          const entry = state.cartItems.find((c) => c.mesh === interactObj);
          if (entry) {
            grabCartItem(entry);
            return;
          }
        }
      }

      // Check if hitting a shelf bay while holding an item!
      if (state.heldItem && hit.distance < 5.0) {
        for (const bay of shelfBays) {
          let p = hit.object;
          let inBay = false;
          while (p) {
            if (p === bay.group) { inBay = true; break; }
            p = p.parent;
          }
          if (inBay) {
            const bayType = bay.slots[0].itemType;
            if (bayType === state.heldItem.itemType) {
              const slot = findOpenSlotForType(bayType, hit.point);
              if (slot) {
                placeHeldItemOnSlot(slot);
                return;
              }
            } else {
              audio.playErrorBump();
              vibrateGamepad(85, 0.5, 0.15);
              return;
            }
          }
        }
      }
    }

    // 2. Generous Proximity Auto-Assist (especially awesome for Xbox controller!)
    // Standing right next to Big Red Phone?
    bigRedPhone.group.getWorldPosition(tempVec);
    if (tempVec.distanceTo(playerWorldPos) < 2.6) {
      triggerBigRedPhone();
      return;
    }

    // Standing right at the 3:00 AM Exit?
    if (state.phase === 'clock_out_ready' && playerRig.position.z > 6.5) {
      triggerShiftComplete();
      return;
    }

    // Standing near the Lunch Table while on lunch?
    breakroom.group.getWorldPosition(tempVec);
    if (tempVec.distanceTo(playerWorldPos) < 2.75) {
      const nextFood = breakroom.foodItems.find((f) => f.visible);
      if (nextFood) {
        interactLunchFood(nextFood);
        return;
      }
      if (state.phase === 'lunch') {
        finishLunchBreak();
        return;
      }
    }

    // Holding an item near its matching shelf bay?
    if (state.heldItem) {
      const slot = findOpenSlotForType(state.heldItem.itemType, playerWorldPos);
      if (slot) {
        slot.anchor.getWorldPosition(tempVec);
        if (tempVec.distanceTo(playerWorldPos) < 3.4) {
          placeHeldItemOnSlot(slot);
          return;
        }
      }
    } else {
      // Empty-handed near the Stock Cart? Grab the closest item!
      let closestEntry = null;
      let closestDist = 3.0;
      for (const entry of state.cartItems) {
        entry.mesh.getWorldPosition(tempVec);
        const d = tempVec.distanceTo(playerWorldPos);
        if (d < closestDist) {
          closestDist = d;
          closestEntry = entry;
        }
      }
      if (closestEntry) {
        grabCartItem(closestEntry);
        return;
      }
    }

    // Near a lost kid? Have them follow Addyson!
    if (state.activeLostKid && !state.activeLostKid.following) {
      state.activeLostKid.char.group.getWorldPosition(tempVec);
      if (tempVec.distanceTo(playerWorldPos) < 3.0) {
        state.activeLostKid.following = true;
        audio.playLostKidCue();
        vibrateGamepad(60, 0.2, 0.4);
        return;
      }
    }

    // If holding an item and pressed Interact in open space -> fun squish/click!
    if (state.heldItem && !clickFloorAllowed) {
      playWithHeldItem();
      return;
    }

    // Click/tap floor to walk smoothly (Desktop/Mobile touch convenience!)
    if (clickFloorAllowed) {
      const floorHit = hits.find((h) => h.object.userData && h.object.userData.isFloor && h.distance < 16);
      if (floorHit) {
        state.moveTarget = new THREE.Vector3(floorHit.point.x, 0, floorHit.point.z);
        spawnSparkleBurst(floorHit.point.clone().add(new THREE.Vector3(0, 0.08, 0)), [0xcc0000, 0xffffff], 5);
      } else if (state.heldItem) {
        playWithHeldItem();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Xbox Game Controller (Standard Gamepad API) + Dual-Rumble Haptics!
  // ---------------------------------------------------------------------------
  const prevGamepadButtons = new Array(18).fill(false);
  let activeGamepadIndex = null;

  window.addEventListener('gamepadconnected', (e) => {
    activeGamepadIndex = e.gamepad.index;
  });

  window.addEventListener('gamepaddisconnected', (e) => {
    if (activeGamepadIndex === e.gamepad.index) {
      activeGamepadIndex = null;
    }
  });

  function getActiveGamepad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    if (!pads) return null;
    if (activeGamepadIndex !== null && pads[activeGamepadIndex] && pads[activeGamepadIndex].connected) {
      return pads[activeGamepadIndex];
    }
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].connected) {
        activeGamepadIndex = i;
        return pads[i];
      }
    }
    return null;
  }

  function vibrateGamepad(duration = 70, strong = 0.25, weak = 0.45) {
    const pad = getActiveGamepad();
    if (!pad || !pad.vibrationActuator || typeof pad.vibrationActuator.playEffect !== 'function') return;
    try {
      pad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration,
        strongMagnitude: strong,
        weakMagnitude: weak
      }).catch(() => {});
    } catch (_) {}
  }

  function applyDeadzone(val, dz = 0.16) {
    if (Math.abs(val) < dz) return 0;
    const sign = Math.sign(val);
    return sign * ((Math.abs(val) - dz) / (1 - dz));
  }

  // ---------------------------------------------------------------------------
  // Player Locomotion & Camera Look (Xbox Stick + Keyboard + Mouse/Touch Drag)
  // ---------------------------------------------------------------------------
  let lookYaw = 0;
  let lookPitch = -0.05;
  const keysPressed = new Set();

  window.addEventListener('keydown', (e) => {
    keysPressed.add(e.code);
    if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
      if (state.phase === 'complete') {
        restartNewShift();
      } else if (e.code !== 'Enter') {
        performPrimaryInteraction(null, false);
      }
    } else if (e.code === 'KeyQ' || e.code === 'KeyF') {
      if (state.heldItem) playWithHeldItem();
    } else if (e.code === 'KeyR') {
      if (state.heldItem) returnHeldItemToCart();
    }
  });

  window.addEventListener('keyup', (e) => {
    keysPressed.delete(e.code);
  });

  // Smooth Pointer Drag-to-Look + Tap/Click-to-Interact (Multi-touch safe!)
  let activeCanvasPointerId = null;
  let pointerDragged = false;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    if (e.pointerType === 'touch' && !hasTouchInteraction && !isVrHeadsetUA()) {
      hasTouchInteraction = true;
      updateMobileTouchVisibility();
    }
    if (activeCanvasPointerId !== null) return;
    activeCanvasPointerId = e.pointerId;
    pointerDragged = false;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeCanvasPointerId || state.isInXR) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 7) {
      pointerDragged = true;
      state.moveTarget = null;
      state.quickTurnRemaining = 0;
    }

    lookYaw -= dx * 0.0042;
    lookPitch = Math.max(-0.95, Math.min(0.85, lookPitch - dy * 0.0036));
  });

  function endCanvasPointer(e, isCancel) {
    if (e.pointerId !== activeCanvasPointerId) return;
    activeCanvasPointerId = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}

    if (!isCancel && !pointerDragged && !state.isInXR) {
      // Cast ray from exact tapped/clicked screen coordinate!
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      performPrimaryInteraction(raycaster.ray.clone(), true);
    }
  }

  canvas.addEventListener('pointerup', (e) => endCanvasPointer(e, false));
  canvas.addEventListener('pointercancel', (e) => endCanvasPointer(e, true));

  // ---------------------------------------------------------------------------
  // Mobile Virtual Touch Joysticks (Wormhole0-style: Lower-Left Move + Upper-Right Look/Tap)
  // ---------------------------------------------------------------------------
  let moveStickPointerId = null;
  let moveStickCenter = { x: 0, y: 0 };
  let moveStickMaxRadius = 36;

  let lookStickPointerId = null;
  let lookStickCenter = { x: 0, y: 0 };
  let lookStickMaxRadius = 36;
  let lookStickStartX = 0;
  let lookStickStartY = 0;
  let lookStickStartTime = 0;
  let lookStickMoved = false;
  let lookTapFlashTimer = null;

  function resetTouchControls() {
    moveStickPointerId = null;
    lookStickPointerId = null;
    if (state) {
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      state.touchLook.x = 0;
      state.touchLook.y = 0;
    }
    if (touchMoveKnob) touchMoveKnob.style.transform = 'translate(0px, 0px)';
    if (touchLookKnob) touchLookKnob.style.transform = 'translate(0px, 0px)';
    if (touchMoveZone) touchMoveZone.classList.remove('is-active');
    if (touchLookZone) touchLookZone.classList.remove('is-active');
  }

  function updateMoveStick(clientX, clientY) {
    const dx = clientX - moveStickCenter.x;
    const dy = clientY - moveStickCenter.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, moveStickMaxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (touchMoveKnob) {
      touchMoveKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    const deadzonePx = moveStickMaxRadius * 0.14;
    if (clampedDist < deadzonePx) {
      state.touchMove.x = 0;
      state.touchMove.y = 0;
    } else {
      const normMag = (clampedDist - deadzonePx) / (moveStickMaxRadius - deadzonePx);
      state.touchMove.x = Math.cos(angle) * normMag;
      state.touchMove.y = Math.sin(angle) * normMag;
      state.moveTarget = null;
    }
  }

  function updateLookStick(clientX, clientY) {
    const dx = clientX - lookStickCenter.x;
    const dy = clientY - lookStickCenter.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, lookStickMaxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (touchLookKnob) {
      touchLookKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    if (Math.hypot(clientX - lookStickStartX, clientY - lookStickStartY) > 14) {
      lookStickMoved = true;
    }

    const deadzonePx = lookStickMaxRadius * 0.16;
    if (clampedDist < deadzonePx) {
      state.touchLook.x = 0;
      state.touchLook.y = 0;
    } else {
      const normMag = (clampedDist - deadzonePx) / (lookStickMaxRadius - deadzonePx);
      state.touchLook.x = Math.cos(angle) * normMag;
      state.touchLook.y = Math.sin(angle) * normMag;
      state.quickTurnRemaining = 0;
    }
  }

  function flashLookStickTap() {
    if (!touchLookZone) return;
    touchLookZone.classList.add('tap-flash');
    if (lookTapFlashTimer) clearTimeout(lookTapFlashTimer);
    lookTapFlashTimer = setTimeout(() => {
      touchLookZone.classList.remove('tap-flash');
    }, 180);
  }

  if (touchMoveZone) {
    touchMoveZone.addEventListener('contextmenu', (e) => e.preventDefault());
    touchMoveZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audio.unlock();
      if (moveStickPointerId !== null) return;
      const rect = touchMoveZone.getBoundingClientRect();
      moveStickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      moveStickMaxRadius = Math.max(26, rect.width * 0.34);
      moveStickPointerId = e.pointerId;
      touchMoveZone.classList.add('is-active');
      try { touchMoveZone.setPointerCapture(e.pointerId); } catch (_) {}
      updateMoveStick(e.clientX, e.clientY);
    });

    touchMoveZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== moveStickPointerId) return;
      e.preventDefault();
      e.stopPropagation();
      updateMoveStick(e.clientX, e.clientY);
    });

    const releaseMoveStick = (e) => {
      if (e.pointerId !== moveStickPointerId) return;
      e.stopPropagation();
      moveStickPointerId = null;
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      touchMoveZone.classList.remove('is-active');
      if (touchMoveKnob) touchMoveKnob.style.transform = 'translate(0px, 0px)';
      try { touchMoveZone.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    touchMoveZone.addEventListener('pointerup', releaseMoveStick);
    touchMoveZone.addEventListener('pointercancel', releaseMoveStick);
  }

  if (touchLookZone) {
    touchLookZone.addEventListener('contextmenu', (e) => e.preventDefault());
    touchLookZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audio.unlock();
      if (lookStickPointerId !== null) return;
      const rect = touchLookZone.getBoundingClientRect();
      lookStickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      lookStickMaxRadius = Math.max(26, rect.width * 0.34);
      lookStickPointerId = e.pointerId;
      lookStickStartX = e.clientX;
      lookStickStartY = e.clientY;
      lookStickStartTime = performance.now();
      lookStickMoved = false;
      touchLookZone.classList.add('is-active');
      try { touchLookZone.setPointerCapture(e.pointerId); } catch (_) {}
      updateLookStick(e.clientX, e.clientY);
    });

    touchLookZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== lookStickPointerId) return;
      e.preventDefault();
      e.stopPropagation();
      updateLookStick(e.clientX, e.clientY);
    });

    const releaseLookStick = (e, isCancel) => {
      if (e.pointerId !== lookStickPointerId) return;
      e.stopPropagation();
      const duration = performance.now() - lookStickStartTime;
      const dragDelta = Math.hypot(e.clientX - lookStickStartX, e.clientY - lookStickStartY);
      const wasQuickTap = !isCancel && !lookStickMoved && duration < 360 && dragDelta < 24;

      lookStickPointerId = null;
      state.touchLook.x = 0;
      state.touchLook.y = 0;
      touchLookZone.classList.remove('is-active');
      if (touchLookKnob) touchLookKnob.style.transform = 'translate(0px, 0px)';
      try { touchLookZone.releasePointerCapture(e.pointerId); } catch (_) {}

      // Quick tap on upper-right joystick performs primary interact (just like wormhole0 tap-to-fire!)
      if (wasQuickTap) {
        flashLookStickTap();
        performPrimaryInteraction(null, false);
      }
    };

    touchLookZone.addEventListener('pointerup', (e) => releaseLookStick(e, false));
    touchLookZone.addEventListener('pointercancel', (e) => releaseLookStick(e, true));
  }

  function bindTouchActionButton(btn, onPress) {
    if (!btn) return;
    let lastTriggerAt = 0;
    const trigger = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (now - lastTriggerAt < 120) return;
      lastTriggerAt = now;
      audio.unlock();
      btn.classList.add('is-pressed');
      setTimeout(() => btn.classList.remove('is-pressed'), 140);
      onPress();
    };
    btn.addEventListener('pointerdown', trigger);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (performance.now() - lastTriggerAt > 250) trigger(e);
    });
  }

  bindTouchActionButton(touchBtnInteract, () => {
    performPrimaryInteraction(null, false);
  });

  bindTouchActionButton(touchBtnSquish, () => {
    if (state.heldItem) {
      playWithHeldItem();
    }
  });

  bindTouchActionButton(touchBtnTurn180, () => {
    if (state.isInXR) {
      playerRig.rotation.y += Math.PI;
    } else {
      state.quickTurnRemaining += Math.PI;
    }
  });

  // Dynamic Mobile Detection Listeners (also reacts to Chrome DevTools device emulation & touch)
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && !hasTouchInteraction && !isVrHeadsetUA()) {
      hasTouchInteraction = true;
      updateMobileTouchVisibility();
    }
  }, { passive: true });

  if (window.matchMedia) {
    const mobileMQ = window.matchMedia('(pointer: coarse), (hover: none)');
    const onMQChange = () => updateMobileTouchVisibility();
    if (typeof mobileMQ.addEventListener === 'function') {
      mobileMQ.addEventListener('change', onMQChange);
    } else if (typeof mobileMQ.addListener === 'function') {
      mobileMQ.addListener(onMQChange);
    }
  }

  window.addEventListener('orientationchange', () => {
    resetTouchControls();
    setTimeout(updateMobileTouchVisibility, 120);
  });
  window.addEventListener('blur', resetTouchControls);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetTouchControls();
  });

  updateMobileTouchVisibility();

  function clampPlayerPosition() {
    const maxZ = state.phase === 'clock_out_ready' ? 10.2 : 8.5;
    playerRig.position.x = Math.max(-8.4, Math.min(8.4, playerRig.position.x));
    playerRig.position.z = Math.max(-6.4, Math.min(maxZ, playerRig.position.z));

    // Soft collision around center stock cart so you walk around it smoothly
    const cartDx = playerRig.position.x - stockCart.group.position.x;
    const cartDz = playerRig.position.z - stockCart.group.position.z;
    if (Math.abs(cartDx) < 1.32 && Math.abs(cartDz) < 0.92) {
      if (Math.abs(cartDx) / 1.32 > Math.abs(cartDz) / 0.92) {
        playerRig.position.x = stockCart.group.position.x + Math.sign(cartDx || 1) * 1.32;
      } else {
        playerRig.position.z = stockCart.group.position.z + Math.sign(cartDz || 1) * 0.92;
      }
    }

    // Soft collision around Breakroom Bistro Table
    const brDx = playerRig.position.x - breakroom.group.position.x;
    const brDz = playerRig.position.z - breakroom.group.position.z;
    const brDist = Math.hypot(brDx, brDz);
    if (brDist < 1.25 && brDist > 0.001) {
      playerRig.position.x = breakroom.group.position.x + (brDx / brDist) * 1.25;
      playerRig.position.z = breakroom.group.position.z + (brDz / brDist) * 1.25;
    }

    // Walking right through the open 3:00 AM Exit Doors automatically clocks out & goes home!
    if (state.phase === 'clock_out_ready' && playerRig.position.z > 9.1 && Math.abs(playerRig.position.x) < 2.2) {
      triggerShiftComplete();
    }
  }

  // ---------------------------------------------------------------------------
  // WebXR Controllers + Wrist Name Badge ("Hello, my name is Addyson")
  // ---------------------------------------------------------------------------
  const controllerModelFactory = new XRControllerModelFactory();
  const xrControllers = [];
  const xrRightHoldAnchor = new THREE.Group();
  xrRightHoldAnchor.position.set(0, 0.02, -0.18);

  const laserGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -4.5)
  ]);

  for (let i = 0; i < 2; i++) {
    const ctrl = renderer.xr.getController(i);
    const grip = renderer.xr.getControllerGrip(i);
    grip.add(controllerModelFactory.createControllerModel(grip));

    const laser = new THREE.Line(
      laserGeo,
      new THREE.LineBasicMaterial({ color: i === 1 ? 0xff4d4d : 0x38bdf8, transparent: true, opacity: 0.72 })
    );
    ctrl.add(laser);

    // Attach Addyson's wearable 3D Name Badge to the left controller wrist in XR!
    if (i === 0) {
      const wristBadge = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.09, 0.008),
        new THREE.MeshBasicMaterial({ map: createNameBadgeTexture() })
      );
      wristBadge.position.set(0, 0.06, 0.04);
      wristBadge.rotation.x = -0.65;
      ctrl.add(wristBadge);
    } else {
      ctrl.add(xrRightHoldAnchor);
    }

    ctrl.addEventListener('selectstart', () => {
      const origin = new THREE.Vector3();
      const dir = new THREE.Vector3(0, 0, -1);
      const rotMat = new THREE.Matrix4().extractRotation(ctrl.matrixWorld);
      origin.setFromMatrixPosition(ctrl.matrixWorld);
      dir.applyMatrix4(rotMat).normalize();
      performPrimaryInteraction(new THREE.Ray(origin, dir), false);
    });

    ctrl.addEventListener('squeezestart', () => {
      if (state.heldItem) playWithHeldItem();
    });

    playerRig.add(ctrl);
    playerRig.add(grip);
    xrControllers.push(ctrl);
  }

  // WebXR Feature Detection
  async function checkXRSupport() {
    if (!navigator.xr) return;
    try {
      state.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
      if (state.vrSupported && btnEnterVr) btnEnterVr.hidden = false;
    } catch (_) {}
    try {
      state.arSupported = await navigator.xr.isSessionSupported('immersive-ar');
      if (state.arSupported && btnEnterAr) btnEnterAr.hidden = false;
    } catch (_) {}
  }
  checkXRSupport();

  async function startXR(mode) {
    if (!navigator.xr) return;
    audio.unlock();
    try {
      const session = await navigator.xr.requestSession(mode, {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });
      state.isInXR = true;
      state.xrMode = mode;
      document.body.classList.add('in-xr-session');
      resetTouchControls();
      if (mode === 'immersive-ar') {
        scene.background = null;
        scene.fog = null;
      }
      session.addEventListener('end', () => {
        state.isInXR = false;
        state.xrMode = null;
        document.body.classList.remove('in-xr-session');
        updateMobileTouchVisibility();
        scene.background = new THREE.Color(0x0b1022);
        scene.fog = new THREE.FogExp2(0x161c2e, 0.014);
        if (state.heldItem) {
          heldAnchorDesktop.add(state.heldItem.mesh);
        }
      });
      await renderer.xr.setSession(session);
      if (state.heldItem) {
        xrRightHoldAnchor.add(state.heldItem.mesh);
      }
    } catch (err) {
      console.warn('[WorkTonightXR] Could not start XR:', err);
    }
  }

  if (btnEnterVr) btnEnterVr.addEventListener('click', () => startXR('immersive-vr'));
  if (btnEnterAr) btnEnterAr.addEventListener('click', () => startXR('immersive-ar'));
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      audio.unlock();
      const next = audio.setMuted(!audio.isMuted());
      btnMute.textContent = next ? '🔇' : '🔊';
      btnMute.setAttribute('aria-pressed', String(!next));
    });
  }
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', restartNewShift);
  }
  if (shiftDialog) {
    shiftDialog.addEventListener('close', () => {
      const val = shiftDialog.returnValue;
      shiftDialog.returnValue = '';
      if (val === 'again') restartNewShift();
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    updateMobileTouchVisibility();
  });

  // ---------------------------------------------------------------------------
  // Main Frame Loop (Game Logic, Xbox Controller, Animations, Particles, WebXR)
  // ---------------------------------------------------------------------------
  let prevTime = performance.now();
  let lastClockStr = '';
  let xrSnapCooldown = 0;

  function updateGamepadAndMovement(dt) {
    let moveX = 0;
    let moveZ = 0;

    // Keyboard WASD / Arrows
    if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveZ -= 1;
    if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveZ += 1;
    if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveX -= 1;
    if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveX += 1;

    // Mobile Virtual Touch Joysticks (Lower-Left Move + Upper-Right Look)
    if (!state.isInXR) {
      moveX += state.touchMove.x;
      moveZ += state.touchMove.y;

      if (Math.abs(state.touchLook.x) > 0.001 || Math.abs(state.touchLook.y) > 0.001) {
        lookYaw -= state.touchLook.x * 2.15 * dt;
        lookPitch = Math.max(-0.95, Math.min(0.85, lookPitch - state.touchLook.y * 1.45 * dt));
      }

      if (state.quickTurnRemaining > 0.001) {
        const turnStep = Math.min(state.quickTurnRemaining, Math.PI * 3.2 * dt);
        lookYaw += turnStep;
        state.quickTurnRemaining -= turnStep;
      }
    }

    // Xbox Gamepad Polling!
    const pad = getActiveGamepad();
    if (pad) {
      const lx = applyDeadzone(pad.axes[0] || 0, 0.16);
      const ly = applyDeadzone(pad.axes[1] || 0, 0.16);
      const rx = applyDeadzone(pad.axes[2] || 0, 0.16);
      const ry = applyDeadzone(pad.axes[3] || 0, 0.16);

      moveX += lx;
      moveZ += ly;

      // D-Pad support too!
      if (pad.buttons[12]?.pressed) moveZ -= 1; // Up
      if (pad.buttons[13]?.pressed) moveZ += 1; // Down
      if (pad.buttons[14]?.pressed) lookYaw += 2.1 * dt; // Left
      if (pad.buttons[15]?.pressed) lookYaw -= 2.1 * dt; // Right

      // Right stick smooth look!
      if (!state.isInXR) {
        lookYaw -= rx * 2.35 * dt;
        lookPitch = Math.max(-0.95, Math.min(0.85, lookPitch - ry * 1.75 * dt));
      } else if (Math.abs(rx) > 0.5 && xrSnapCooldown <= 0) {
        playerRig.rotation.y -= Math.sign(rx) * (Math.PI / 4);
        xrSnapCooldown = 0.28;
      }

      // Edge-triggered Xbox buttons
      const pressedNow = (idx) => {
        const b = pad.buttons[idx];
        return Boolean(b && (b.pressed || b.value > 0.55));
      };
      const justPressed = (idx) => pressedNow(idx) && !prevGamepadButtons[idx];

      // A (0), X (2), RT (7) -> Primary Interact / Grab / Restock / Big Red Phone / Eat / Play Again!
      if (justPressed(0) || justPressed(2) || justPressed(7)) {
        performPrimaryInteraction(null, false);
      }
      // B (1), LT (6), Y (3) -> Squish / Click held item, or return to cart if close to cart on B
      if (justPressed(1) || justPressed(6) || justPressed(3)) {
        if (state.heldItem) {
          stockCart.group.getWorldPosition(tempVec);
          if (justPressed(1) && tempVec.distanceTo(playerRig.position) < 2.5) {
            returnHeldItemToCart();
          } else {
            playWithHeldItem();
          }
        }
      }
      // LB (4) / RB (5) -> Crisp 45° snap-turn!
      if (justPressed(4)) {
        if (state.isInXR) playerRig.rotation.y += Math.PI / 4;
        else lookYaw += Math.PI / 4;
      }
      if (justPressed(5)) {
        if (state.isInXR) playerRig.rotation.y -= Math.PI / 4;
        else lookYaw -= Math.PI / 4;
      }
      // Start (9) -> Play again on Shift Complete
      if (justPressed(9) && state.phase === 'complete') {
        restartNewShift();
      }

      for (let i = 0; i < prevGamepadButtons.length; i++) {
        prevGamepadButtons[i] = pressedNow(i);
      }
    }

    // WebXR Controller Thumbstick Locomotion
    const session = renderer.xr.getSession();
    if (state.isInXR && session) {
      for (const source of session.inputSources) {
        if (!source.gamepad) continue;
        const axes = source.gamepad.axes;
        const axX = applyDeadzone(axes[2] ?? axes[0] ?? 0, 0.2);
        const axY = applyDeadzone(axes[3] ?? axes[1] ?? 0, 0.2);
        if (source.handedness === 'left') {
          moveX += axX;
          moveZ += axY;
        } else if (source.handedness === 'right' && Math.abs(axX) > 0.55 && xrSnapCooldown <= 0) {
          playerRig.rotation.y -= Math.sign(axX) * (Math.PI / 4);
          xrSnapCooldown = 0.3;
        }
      }
    }
    if (xrSnapCooldown > 0) xrSnapCooldown -= dt;

    // Apply Desktop Camera Orientation
    if (!state.isInXR) {
      camera.rotation.order = 'YXZ';
      camera.rotation.y = lookYaw;
      camera.rotation.x = lookPitch;
    }

    // Apply Walking Velocity
    const moveMag = Math.hypot(moveX, moveZ);
    const speed = state.lunchCompleted ? 4.35 : 3.85;
    if (moveMag > 0.01) {
      state.moveTarget = null;
      const norm = moveMag > 1 ? 1 / moveMag : 1;
      const fx = moveX * norm;
      const fz = moveZ * norm;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0.0001) forward.normalize();
      else forward.set(0, 0, -1);

      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      playerRig.position.addScaledVector(right, fx * speed * dt);
      playerRig.position.addScaledVector(forward, -fz * speed * dt);
      clampPlayerPosition();

      state.footstepAccum += dt * moveMag;
      if (state.footstepAccum > 0.48) {
        state.footstepAccum = 0;
        audio.playFootstep();
      }
    } else if (state.moveTarget) {
      const toTarget = tempVec.copy(state.moveTarget).sub(playerRig.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 0.2) {
        state.moveTarget = null;
      } else {
        toTarget.normalize();
        playerRig.position.addScaledVector(toTarget, Math.min(dist, speed * dt));
        clampPlayerPosition();
      }
    }
  }

  function updateShiftTimeline(dt) {
    if (state.phase === 'complete') return;

    if (state.phase === 'shift_early') {
      state.shiftMinutes += dt * 1.05;
      if (state.shiftMinutes >= state.nextKidShiftMin && !state.activeLostKid) {
        spawnLostKid();
        state.nextKidShiftMin = 105; // Next lost kid around 10:15 PM!
      }
      if (state.shiftMinutes >= LUNCH_START_MIN && !state.lunchTriggered) {
        state.lunchTriggered = true;
        state.phase = 'lunch';
        state.shiftMinutes = LUNCH_START_MIN;
        state.lunchTimer = 0;
        audio.playLunchBell();
        vibrateGamepad(140, 0.3, 0.5);
        showPaBanner('9:00 PM — Lunch Break in the Breakroom!', 4.5);
      }
    } else if (state.phase === 'lunch') {
      state.lunchTimer += dt;
      // Gently tick through 9:00 PM -> 9:30 PM lunch (or finish immediately when Addyson eats her lunch!)
      state.shiftMinutes = Math.min(LUNCH_END_MIN, state.shiftMinutes + dt * 0.72);
      if (state.shiftMinutes >= LUNCH_END_MIN) {
        finishLunchBreak();
      }
    } else if (state.phase === 'shift_late') {
      state.shiftMinutes += dt * 1.85;
      if (state.shiftMinutes >= state.nextKidShiftMin && !state.activeLostKid) {
        spawnLostKid();
        state.nextKidShiftMin += 95;
      }
      if (state.shiftMinutes >= SHIFT_END_MIN) {
        state.shiftMinutes = SHIFT_END_MIN;
        state.phase = 'clock_out_ready';
        audio.playClockOutFanfare();
        vibrateGamepad(180, 0.35, 0.7);
        showPaBanner('3:00 AM — Shift Over! Time to go home, Addyson!', 6.0);
      }
    }

    // Sync HUD & 3D Store Wall Clock
    const clockStr = formatShiftClock(state.shiftMinutes);
    if (clockStr !== lastClockStr) {
      lastClockStr = clockStr;
      if (clockEl) clockEl.textContent = clockStr;

      let statusTag = 'ADDYSON • 8:30 PM – 3:00 AM';
      let color = '#ff4444';
      if (state.phase === 'lunch') {
        statusTag = '9:00 PM LUNCH BREAK';
        color = '#facc15';
      } else if (state.phase === 'clock_out_ready' || state.phase === 'complete') {
        statusTag = '3:00 AM • GO HOME!';
        color = '#4ade80';
      }
      wallClock.update(clockStr, statusTag, color);
    }
  }

  function updateCharactersAndProps(dt, elapsed) {
    // 1. Animate Stock Cart items gentle float & shine
    for (const entry of state.cartItems) {
      entry.squishPhase += dt * 2.6;
      const bob = Math.sin(entry.squishPhase) * 0.018;
      entry.mesh.position.y = entry.homePos.y + bob;
      entry.mesh.rotation.y = Math.sin(entry.squishPhase * 0.5) * 0.14;
    }

    // 2. Animate Held Item squishy spring & clicker depression!
    if (state.heldItem) {
      const h = state.heldItem;
      if (h.squishTime > 0) {
        h.squishTime = Math.max(0, h.squishTime - dt);
        const s = Math.sin(h.squishTime * 28) * (h.squishTime * 0.45);
        h.mesh.scale.set(1 + s, Math.max(0.65, 1 - s * 1.15), 1 + s);
      } else {
        h.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 12));
      }
      if (h.clickTime > 0 && h.mesh.userData.keys) {
        h.clickTime = Math.max(0, h.clickTime - dt);
        const dip = Math.sin(h.clickTime * Math.PI / 0.3) * 0.032;
        h.mesh.userData.keys.forEach((k) => { k.position.y = 0.155 - dip; });
      }
      h.mesh.rotation.y = Math.sin(elapsed * 2.0) * 0.12;
    }

    // 3. Animate Shelf Slots glow & newly stocked bouncy landing!
    for (const slot of allShelfSlots) {
      if (slot.occupied && slot.itemMesh) {
        slot.pad.material.opacity = 0.12;
        slot.dot.material.opacity = 0.05;
        if (slot.itemMesh.userData.landingPop > 0) {
          slot.itemMesh.userData.landingPop = Math.max(0, slot.itemMesh.userData.landingPop - dt);
          slot.itemMesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 14));
        }
      } else {
        const isMatchingHeld = state.heldItem && state.heldItem.itemType === slot.itemType;
        const pulse = isMatchingHeld ? (0.65 + 0.35 * Math.sin(elapsed * 7.5)) : 0.35;
        slot.pad.material.opacity = pulse;
        slot.dot.material.opacity = isMatchingHeld ? 0.42 : 0.14;
        const sc = isMatchingHeld ? (1.06 + 0.08 * Math.sin(elapsed * 7.5)) : 1.0;
        slot.pad.scale.setScalar(sc);
      }
    }

    // 4. Big Red Phone Beacon, Handset Lift & Sound Wave Rings!
    const kidNeedsPaging = Boolean(state.activeLostKid && !state.activeLostKid.paged);
    if (kidNeedsPaging || state.phoneActiveTimer > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 10);
      bigRedPhone.beaconMat.emissiveIntensity = 0.8 + pulse * 1.6;
      bigRedPhone.beaconLight.intensity = 1.2 + pulse * 2.2;
    } else {
      bigRedPhone.beaconMat.emissiveIntensity = 0.25;
      bigRedPhone.beaconLight.intensity = 0.3;
    }

    if (state.phoneActiveTimer > 0) {
      state.phoneActiveTimer = Math.max(0, state.phoneActiveTimer - dt);
      // Handset lifts off cradle enthusiastically!
      const liftY = bigRedPhone.handsetRestPos.y + 0.28 + Math.sin(elapsed * 8) * 0.04;
      const liftZ = bigRedPhone.handsetRestPos.z + 0.24;
      bigRedPhone.handset.position.lerp(new THREE.Vector3(-0.08, liftY, liftZ), Math.min(1, dt * 10));
      bigRedPhone.handset.rotation.z = THREE.MathUtils.lerp(bigRedPhone.handset.rotation.z, 0.72, dt * 8);

      // Expanding PA speaker sound wave rings
      bigRedPhone.soundRings.forEach((ring, i) => {
        const phase = ((elapsed * 1.6 + i * 0.33) % 1);
        ring.scale.setScalar(0.5 + phase * 2.4);
        ring.material.opacity = (1 - phase) * 0.85;
      });
    } else {
      bigRedPhone.handset.position.lerp(bigRedPhone.handsetRestPos, Math.min(1, dt * 8));
      bigRedPhone.handset.rotation.z = THREE.MathUtils.lerp(bigRedPhone.handset.rotation.z, 0.08, dt * 8);
      bigRedPhone.soundRings.forEach((ring) => { ring.material.opacity = 0; });
    }

    // 5. Lost Kid & Parent Reunion Choreography!
    if (state.activeLostKid) {
      const kid = state.activeLostKid;
      const kPos = kid.char.group.position;
      kid.walkTimer += dt;

      if (kid.following && !kid.reunited) {
        const toPlayer = tempVec.copy(playerRig.position).sub(kPos);
        toPlayer.y = 0;
        const d = toPlayer.length();
        if (d > 1.55) {
          toPlayer.normalize();
          kPos.addScaledVector(toPlayer, Math.min(d - 1.5, 2.7 * dt));
          kid.char.group.lookAt(playerRig.position.x, 0, playerRig.position.z);
          kid.char.leftLeg.rotation.x = Math.sin(kid.walkTimer * 10) * 0.5;
          kid.char.rightLeg.rotation.x = -Math.sin(kid.walkTimer * 10) * 0.5;
        } else {
          kid.char.leftLeg.rotation.x *= 0.85;
          kid.char.rightLeg.rotation.x *= 0.85;
        }
      } else if (!kid.reunited) {
        // Cute waving & hopping to get Addyson's attention!
        kid.char.group.lookAt(playerRig.position.x, 0, playerRig.position.z);
        kid.char.rightArm.rotation.z = -2.3 + Math.sin(elapsed * 8) * 0.45;
        kPos.y = Math.abs(Math.sin(elapsed * 4.5)) * 0.09;
      }
    }

    if (state.activeParent && state.activeLostKid) {
      const parent = state.activeParent;
      const kid = state.activeLostKid;
      const pPos = parent.char.group.position;
      const kPos = kid.char.group.position;

      if (parent.state === 'approaching') {
        const toKid = tempVec.copy(kPos).sub(pPos);
        toKid.y = 0;
        const d = toKid.length();
        if (d > 0.95) {
          toKid.normalize();
          pPos.addScaledVector(toKid, 3.6 * dt);
          parent.char.group.lookAt(kPos.x, 0, kPos.z);
          parent.char.leftLeg.rotation.x = Math.sin(elapsed * 11) * 0.55;
          parent.char.rightLeg.rotation.x = -Math.sin(elapsed * 11) * 0.55;
        } else {
          parent.state = 'hugging';
          parent.hugTimer = 1.6;
          kid.reunited = true;
          state.kidsReunited++;
          updateHudCounters();
          audio.playReunionCheer();
          vibrateGamepad(140, 0.35, 0.65);

          // Reward clock boost for helping a lost kid!
          if (state.phase === 'shift_early') {
            state.shiftMinutes = Math.min(LUNCH_START_MIN, state.shiftMinutes + 8);
          } else if (state.phase === 'shift_late') {
            state.shiftMinutes = Math.min(SHIFT_END_MIN, state.shiftMinutes + 28);
          }

          spawnSparkleBurst(kPos.clone().add(new THREE.Vector3(0, 1.3, 0)), [0xff5ca8, 0xffe066, 0x4ade80, 0x38bdf8], 26);
        }
      } else if (parent.state === 'hugging') {
        parent.hugTimer -= dt;
        kid.char.group.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.16;
        if (parent.hugTimer <= 0) {
          parent.state = 'leaving';
        }
      } else if (parent.state === 'leaving') {
        const exitTarget = tempVec.set(0.3, 0, 8.8);
        const dirP = tempVec2.copy(exitTarget).sub(pPos);
        dirP.y = 0;
        if (dirP.length() < 0.7) {
          scene.remove(parent.char.group);
          scene.remove(kid.char.group);
          state.activeParent = null;
          state.activeLostKid = null;
        } else {
          dirP.normalize();
          pPos.addScaledVector(dirP, 3.1 * dt);
          kPos.copy(pPos).add(new THREE.Vector3(-0.65, 0, 0.2));
          parent.char.group.lookAt(exitTarget.x, 0, exitTarget.z);
          kid.char.group.lookAt(exitTarget.x, 0, exitTarget.z);
          parent.char.leftLeg.rotation.x = Math.sin(elapsed * 9) * 0.45;
          parent.char.rightLeg.rotation.x = -Math.sin(elapsed * 9) * 0.45;
          kid.char.leftLeg.rotation.x = Math.sin(elapsed * 11) * 0.5;
          kid.char.rightLeg.rotation.x = -Math.sin(elapsed * 11) * 0.5;
        }
      }
    }

    // 6. 9:00 PM Breakroom Glow & Bobbing Lunch Food!
    const isLunch = state.phase === 'lunch';
    lunchSpotLight.intensity = THREE.MathUtils.lerp(lunchSpotLight.intensity, isLunch ? 2.4 : 0.35, dt * 3);
    breakroom.lunchRingMat.opacity = isLunch ? (0.48 + 0.35 * Math.sin(elapsed * 5.5)) : 0.1;
    breakroom.foodItems.forEach((food, idx) => {
      if (food.visible && isLunch) {
        food.rotation.y = elapsed * 0.9 + idx;
      }
    });

    // 7. 3:00 AM Sliding Glass Exit Doors & Twinkling Car!
    const doorsShouldOpen = state.phase === 'clock_out_ready' || state.phase === 'complete';
    state.doorOpenAmount = THREE.MathUtils.lerp(state.doorOpenAmount, doorsShouldOpen ? 1.35 : 0, dt * 2.6);
    storeEnv.leftDoor.position.x = -0.74 - state.doorOpenAmount;
    storeEnv.rightDoor.position.x = 0.74 + state.doorOpenAmount;
    storeEnv.exitPadMat.opacity = doorsShouldOpen ? (0.45 + 0.3 * Math.sin(elapsed * 5)) : 0;
    exitGlowLight.intensity = doorsShouldOpen ? (1.8 + 0.8 * Math.sin(elapsed * 5)) : 0;

    // 8. PA Banner timer
    if (state.paBannerTimer > 0) {
      state.paBannerTimer -= dt;
      if (state.paBannerTimer <= 0 && paBannerEl) {
        paBannerEl.hidden = true;
      }
    }

    // 9. Update Particle Bursts
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        particles.splice(i, 1);
      } else {
        p.vel.y -= 5.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += 5 * dt;
        p.mesh.rotation.y += 6 * dt;
        p.mesh.material.opacity = Math.min(1, p.life / p.maxLife);
      }
    }

    // 10. Subtle Reticle Glow when aiming at an interactable!
    if (reticleEl && !state.isInXR) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hitList = raycaster.intersectObjects(scene.children, true);
      let isTarget = false;
      for (const h of hitList) {
        if (h.distance > 5.5) break;
        if (findOwnerInteractable(h.object)) {
          isTarget = true;
          break;
        }
        if (state.heldItem) {
          for (const bay of shelfBays) {
            if (bay.slots[0].itemType === state.heldItem.itemType) {
              let p = h.object;
              while (p) {
                if (p === bay.group) { isTarget = true; break; }
                p = p.parent;
              }
            }
          }
          if (isTarget) break;
        }
      }
      reticleEl.classList.toggle('is-active', isTarget);
      if (touchBtnInteract) {
        touchBtnInteract.classList.toggle('is-ready', isTarget);
      }
    }
    if (touchBtnSquish) {
      touchBtnSquish.hidden = !state.heldItem;
    }
  }

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - prevTime) / 1000);
    prevTime = now;
    const elapsed = now * 0.001;

    updateGamepadAndMovement(dt);
    updateShiftTimeline(dt);
    updateCharactersAndProps(dt, elapsed);

    renderer.render(scene, camera);
  });
})();
