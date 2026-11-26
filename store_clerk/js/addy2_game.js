/**
 * Calm Chess Games — Addy's Walmart Store Clerk XR (Meshy 3D Edition — store_clerk/addy2.html)
 * Duplicated from addy_game.js and upgraded to use 25 Meshy-generated 3D GLB & PBR Texture Assets!
 *  - Employee: Addy ("HELLO my name is Addy")
 *  - Start outside in the Walmart Parking Lot -> Walk through automatic doors at 11:30 AM!
 *  - 10 Stockable Walmart Aisles: NeeDohs, Squishies, Clickers, Cups, Kids & Adult Sweatshirts (Meshy 3D!)
 *  - Interactive Checkout Aisle (Lane #1): Walk behind counter as Clerk to scan & bag shoppers' items!
 *  - Lost Kids (with Names) -> Go on PA Mic -> Parent arrives -> $100,000.00 Tip + Addy gives Free Food!
 *  - 11:00 PM Lunch Break in Addy's Breakroom -> 11:46 AM Go Home & Lock the Doors with Addy's Keys!
 *  - All Meshy 3D assets pre-loaded in parallel and pooled in WalmartObjectPool for smooth 60 FPS WebXR
 *  - First-class Xbox Gamepad API support with dual-rumble haptics + ZERO instructional badges
 */

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createAddy2AudioEngine } from './addy2_audio.js';
import {
  ITEM_LIST,
  ITEM_META,
  LOST_KID_NAMES,
  AISLE_CONFIGS,
  preloadMeshyAssets,
  getMeshyAssetStatus,
  createWalmartEnvironment,
  createStoreWallClock,
  createWalmartAisleBay,
  createStockCart,
  createPaMicStation,
  createCheckoutAisle,
  createBreakroomArea,
  createStoreKeysModel,
  createNameBadgeTexture
} from './addy2_models.js';
import {
  createWalmartObjectPool,
  deduplicateStaticProceduralTextures
} from './addy2_pool.js';

async function yieldToMain() {
  if (typeof window !== 'undefined' && 'scheduler' in window && typeof window.scheduler.yield === 'function') {
    return window.scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

(async function initAddy2WalmartXR() {
  'use strict';

  const canvas = document.getElementById('xr-canvas');
  const loaderEl = document.getElementById('meshy-loader');
  const loaderBarEl = document.getElementById('meshy-loader-bar');
  const loaderStatusEl = document.getElementById('meshy-loader-status');

  const clockEl = document.getElementById('hud-clock');
  const tipsEl = document.getElementById('hud-tips');
  const tipsPillEl = document.getElementById('hud-tips-pill');
  const stockedEl = document.getElementById('hud-stocked');
  const checkoutsEl = document.getElementById('hud-checkouts');
  const kidsEl = document.getElementById('hud-kids');
  const reticleEl = document.getElementById('reticle');
  const paBannerEl = document.getElementById('pa-banner');
  const paTextEl = document.getElementById('pa-text');
  const btnMute = document.getElementById('btn-mute');
  const btnEnterVr = document.getElementById('btn-enter-vr');
  const btnEnterAr = document.getElementById('btn-enter-ar');
  const shiftDialog = document.getElementById('shift-complete-dialog');
  const summaryTipsEl = document.getElementById('summary-tips');
  const summaryStockedEl = document.getElementById('summary-stocked');
  const summaryCheckoutsEl = document.getElementById('summary-checkouts');
  const summaryKidsEl = document.getElementById('summary-kids');
  const summaryFoodEl = document.getElementById('summary-food');
  const btnPlayAgain = document.getElementById('btn-play-again');

  // Mobile Touch Controls
  const touchMoveZone = document.getElementById('touch-move-zone');
  const touchMoveKnob = document.getElementById('touch-move-knob');
  const touchLookZone = document.getElementById('touch-look-zone');
  const touchLookKnob = document.getElementById('touch-look-knob');
  const touchBtnInteract = document.getElementById('touch-btn-interact');
  const touchBtnSquish = document.getElementById('touch-btn-squish');
  const touchBtnTurn180 = document.getElementById('touch-btn-turn180');

  const audio = createAddy2AudioEngine();

  // ---------------------------------------------------------------------------
  // Shift Timeline Constants
  // ---------------------------------------------------------------------------
  const SHIFT_START_HOUR_MIN = 11 * 60 + 30; // 11:30 AM
  const LUNCH_START_MIN = 690;               // 11:00 PM
  const LUNCH_END_MIN = 720;                 // 11:30 PM
  const SHIFT_END_MIN = 1456;                // 11:46 AM

  const state = {
    shiftMinutes: 0,
    hasEnteredStore: false,
    phase: 'arriving',
    lunchTriggered: false,
    lunchCompleted: false,
    doorsLocked: false,
    lockAnimTimer: 0,
    tipsEarned: 0,
    stockedCount: 0,
    checkoutsCount: 0,
    kidsReunited: 0,
    freeFoodGiven: 0,
    combo: 0,
    lastStockTime: 0,
    heldItem: null,
    holdingKeys: false,
    cartEntries: [],
    activeLostKid: null,
    activeParent: null,
    flyingTipAnim: null,
    nextKidShiftMin: 75,
    kidSeedCounter: 0,
    announcementToken: 0,
    announcementPlaying: false,
    micActiveTimer: 0,
    paBannerTimer: 0,
    doorOpenAmount: 0,
    doorsWereOpen: false,
    laserFlashTimer: 0,
    cashDrawerTimer: 0,
    isInXR: false,
    xrMode: null,
    vrSupported: false,
    arSupported: false,
    isMobile: false,
    touchMove: { x: 0, y: 0 },
    touchLook: { x: 0, y: 0 },
    quickTurnRemaining: 0,
    moveTarget: null,
    footstepAccum: 0,
    checkoutShoppers: [],
    beltItems: [],
    scanningAnims: [],
    checkoutRunningTotal: 0,
    nextShopperSpawnTimer: 1.5
  };

  // ---------------------------------------------------------------------------
  // Preload All 25 Meshy 3D GLB Models & PBR Textures Before Building World
  // ---------------------------------------------------------------------------
  const meshyPreloadResult = await preloadMeshyAssets((done, total) => {
    const pct = Math.round((done / Math.max(1, total)) * 92);
    if (loaderBarEl) loaderBarEl.style.width = `${pct}%`;
    if (loaderStatusEl) loaderStatusEl.textContent = `Loading 3D Store Assets... ${pct}% (${done}/${total})`;
  });

  if (loaderBarEl) loaderBarEl.style.width = '96%';
  if (loaderStatusEl) loaderStatusEl.textContent = 'Setting up Walmart aisles... 96%';
  await yieldToMain();

  // ---------------------------------------------------------------------------
  // Mobile Device Detection (auto-hide touch controls on Desktop & VR)
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
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      Boolean(navigator.userAgentData && navigator.userAgentData.mobile)) {
      return true;
    }
    if (window.matchMedia && window.matchMedia('(pointer: coarse), (hover: none)').matches) {
      return true;
    }
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (hasTouch && (hasTouchInteraction || Math.min(window.innerWidth, window.innerHeight) <= 1024)) {
      return true;
    }
    return hasTouchInteraction;
  }

  function updateMobileTouchVisibility() {
    const isMobile = detectMobileInUse();
    state.isMobile = isMobile;
    document.body.classList.toggle('show-touch-controls', isMobile);
    if (!isMobile) resetTouchControls();
    return isMobile;
  }

  // ---------------------------------------------------------------------------
  // Formatting & HUD Helpers
  // ---------------------------------------------------------------------------
  function formatMoney(amount) {
    return '$' + Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatShiftClock(minsFromStart) {
    const clamped = Math.min(SHIFT_END_MIN, Math.max(0, Math.floor(minsFromStart)));
    const totalMins = (SHIFT_START_HOUR_MIN + clamped) % (24 * 60);
    const h24 = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function updateHudCounters(popTip = false) {
    if (tipsEl) tipsEl.textContent = formatMoney(state.tipsEarned);
    if (stockedEl) stockedEl.textContent = String(state.stockedCount);
    if (checkoutsEl) checkoutsEl.textContent = String(state.checkoutsCount);
    if (kidsEl) kidsEl.textContent = String(state.kidsReunited);
    if (popTip && tipsPillEl) {
      tipsPillEl.classList.remove('is-pop');
      void tipsPillEl.offsetWidth;
      tipsPillEl.classList.add('is-pop');
    }
  }

  function showPaBanner(text, duration = 5.4) {
    if (!paBannerEl || !paTextEl) return;
    paTextEl.textContent = text;
    paBannerEl.hidden = false;
    state.paBannerTimer = duration;
  }

  // ---------------------------------------------------------------------------
  // Three.js Renderer, PBR RoomEnvironment, Scene & Lighting
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
    console.error('[Addy2WalmartXR] WebGL unavailable:', err);
    if (loaderStatusEl) loaderStatusEl.textContent = 'WebGL unavailable in this browser.';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;

  const scene = new THREE.Scene();

  // Soft studio IBL environment so Meshy PBR metallic & glossy textures look vibrant!
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmrem.dispose();
  } catch (err) {
    console.warn('[Addy2WalmartXR] PMREM RoomEnvironment skipped:', err);
  }

  const skyColorDay = new THREE.Color(0x7dd3fc);
  const skyColorSunset = new THREE.Color(0xf97316);
  const skyColorNight = new THREE.Color(0x0b1530);
  const skyColorDawn = new THREE.Color(0xfda4af);
  const activeSkyColor = skyColorDay.clone();
  scene.background = activeSkyColor;
  scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0085);

  // Player Rig — Starts outside in the Walmart Parking Lot facing the Walmart Storefront!
  const playerRig = new THREE.Group();
  playerRig.position.set(0, 0, 25.5);
  scene.add(playerRig);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.05, 110);
  camera.position.set(0, 1.56, 0);
  playerRig.add(camera);

  // Hand Hold Anchors (Desktop lower-right & WebXR right controller)
  const heldAnchorDesktop = new THREE.Group();
  heldAnchorDesktop.position.set(0.36, -0.26, -0.62);
  camera.add(heldAnchorDesktop);

  // Meshy 3D Store Keys Model (attached to player hand at 11:46 AM!)
  const storeKeysMesh = createStoreKeysModel();
  storeKeysMesh.visible = false;
  storeKeysMesh.position.set(-0.02, 0.04, 0.0);
  heldAnchorDesktop.add(storeKeysMesh);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xfffdf5, 0xcbd5e1, 1.05);
  scene.add(hemiLight);

  const sunDirLight = new THREE.DirectionalLight(0xffffff, 1.35);
  sunDirLight.position.set(12, 18, 16);
  sunDirLight.castShadow = true;
  sunDirLight.shadow.mapSize.set(1024, 1024);
  sunDirLight.shadow.camera.near = 1;
  sunDirLight.shadow.camera.far = 55;
  sunDirLight.shadow.camera.left = -22;
  sunDirLight.shadow.camera.right = 22;
  sunDirLight.shadow.camera.top = 22;
  sunDirLight.shadow.camera.bottom = -22;
  scene.add(sunDirLight);

  // Bright Interior Walmart Overhead Fill Lights
  const interiorLight1 = new THREE.PointLight(0xfffaf0, 1.25, 28);
  interiorLight1.position.set(0, 5.2, 2);
  scene.add(interiorLight1);

  const interiorLight2 = new THREE.PointLight(0xfffaf0, 1.2, 28);
  interiorLight2.position.set(0, 5.2, -10);
  scene.add(interiorLight2);

  const lunchSpotLight = new THREE.PointLight(0xfef08a, 0.4, 10);
  lunchSpotLight.position.set(-14.6, 3.8, 7.6);
  scene.add(lunchSpotLight);

  const lockGlowLight = new THREE.PointLight(0xffc220, 0.0, 8);
  lockGlowLight.position.set(2.26, 2.0, 13.0);
  scene.add(lockGlowLight);

  // ---------------------------------------------------------------------------
  // Pre-Allocate ALL Meshy 3D Graphics Objects in WalmartObjectPool!
  // ---------------------------------------------------------------------------
  const pool = createWalmartObjectPool(scene);
  if (typeof window !== 'undefined') {
    window.__walmartPool = pool;
  }
  await yieldToMain();

  // ---------------------------------------------------------------------------
  // Build Walmart World (Parking Lot, Storefront, 10 Aisles, PA Mic, Checkout, Breakroom)
  // ---------------------------------------------------------------------------
  const env = createWalmartEnvironment();
  scene.add(env.group);

  const backClock = createStoreWallClock();
  backClock.group.position.set(0, 4.45, -17.62);
  scene.add(backClock.group);

  const frontClock = createStoreWallClock();
  frontClock.group.position.set(0, 4.35, 11.65);
  frontClock.group.rotation.y = Math.PI;
  scene.add(frontClock.group);

  // Build All 10 Stockable Walmart Aisles!
  const aisleBays = [];
  const allShelfSlots = [];
  for (const cfg of AISLE_CONFIGS) {
    const bay = createWalmartAisleBay(cfg);
    deduplicateStaticProceduralTextures(bay.group, 'walmart_aisle_deco', pool.sharedTextures);
    scene.add(bay.group);
    aisleBays.push(bay);
    for (const slot of bay.slots) {
      allShelfSlots.push(slot);
    }
  }

  // 3 Rolling Blue Meshy Walmart Stock Carts down Action Alley (x = 0)
  const cartZPositions = [1.6, -5.6, -12.6];
  const stockCarts = cartZPositions.map((cz, idx) => {
    const cart = createStockCart(idx);
    cart.group.position.set(0, 0, cz);
    scene.add(cart.group);
    return cart;
  });

  // Customer Service PA Microphone + Free Food Snack Bar (Meshy 3D)
  const paMic = createPaMicStation();
  scene.add(paMic.group);

  // Interactive Checkout Aisle (Lane #1 — Meshy POS & Shopping Bags)
  const checkout = createCheckoutAisle();
  scene.add(checkout.group);

  // 11:00 PM Employee Breakroom (Meshy Bistro Table, Stools & 4 Lunch Foods)
  const breakroom = createBreakroomArea();
  scene.add(breakroom.group);

  // ---------------------------------------------------------------------------
  // Pooled Particle Burst Helper (ZERO runtime mesh/material allocations!)
  // ---------------------------------------------------------------------------
  const activeParticles = [];

  function spawnSparkleBurst(worldPos, colors = [0xffc220, 0x0071ce, 0x4ade80], count = 16) {
    for (let i = 0; i < count; i++) {
      const col = colors[i % colors.length];
      const mesh = pool.spawnParticle(worldPos, col);
      if (!mesh) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      const maxLife = 0.55 + Math.random() * 0.55;
      activeParticles.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 1.8 + Math.random() * 2.8, Math.sin(angle) * speed),
        life: maxLife,
        maxLife
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Populate Stock Carts from WalmartObjectPool (Meshy 3D Items)
  // ---------------------------------------------------------------------------
  function populateCart(cartIndex) {
    const cart = stockCarts[cartIndex];
    if (!cart) return;

    const usedSlots = new Set(
      state.cartEntries.filter((e) => e.cartIndex === cartIndex).map((e) => e.slotIndex)
    );

    for (let s = 0; s < cart.slotPositions.length; s++) {
      if (usedSlots.has(s)) continue;
      const itemType = ITEM_LIST[(s + cartIndex * 2) % ITEM_LIST.length];
      const homePos = cart.slotPositions[s].clone();
      const mesh = pool.spawnItem(itemType, homePos, cart.group);
      if (!mesh) continue;

      const entry = {
        mesh,
        itemType,
        cartIndex,
        slotIndex: s,
        homePos,
        bobPhase: Math.random() * Math.PI * 2
      };
      mesh.userData.interactable = true;
      mesh.userData.kind = 'cart_item';
      mesh.userData.cartEntry = entry;
      state.cartEntries.push(entry);
    }
  }

  function populateAllCarts() {
    for (let i = 0; i < stockCarts.length; i++) {
      populateCart(i);
    }
  }
  populateAllCarts();

  // ---------------------------------------------------------------------------
  // Meshy Character Lively Procedural Locomotion Helpers
  // ---------------------------------------------------------------------------
  function animateMeshyCharacterWalk(charObj, phase, intensity = 1.0) {
    if (!charObj) return;
    if (charObj.modelRoot) {
      charObj.modelRoot.position.y = Math.abs(Math.sin(phase)) * 0.055 * intensity;
      charObj.modelRoot.rotation.z = Math.sin(phase) * 0.045 * intensity;
      charObj.modelRoot.rotation.x = 0.035 * intensity;
    }
  }

  function animateMeshyCharacterIdle(charObj) {
    if (!charObj || !charObj.modelRoot) return;
    charObj.modelRoot.position.y *= 0.82;
    charObj.modelRoot.rotation.z *= 0.82;
    charObj.modelRoot.rotation.x *= 0.82;
  }

  // ---------------------------------------------------------------------------
  // Holding, Playing With & Restocking Items
  // ---------------------------------------------------------------------------
  function getActiveHoldAnchor() {
    return state.isInXR ? xrRightHoldAnchor : heldAnchorDesktop;
  }

  function grabCartItem(entry) {
    if (!entry || state.heldItem || state.doorsLocked) return;
    const idx = state.cartEntries.indexOf(entry);
    if (idx !== -1) state.cartEntries.splice(idx, 1);

    const mesh = entry.mesh;
    mesh.userData.interactable = false;
    delete mesh.userData.kind;
    delete mesh.userData.cartEntry;

    const anchor = getActiveHoldAnchor();
    anchor.add(mesh);
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);

    state.heldItem = {
      mesh,
      itemType: entry.itemType,
      squishTime: 0.35,
      clickTime: entry.itemType === 'clicker' ? 0.3 : 0
    };

    audio.playPickup(entry.itemType);
    vibrateGamepad(65, 0.2, 0.4);

    const remainingOnCart = state.cartEntries.filter((e) => e.cartIndex === entry.cartIndex).length;
    if (remainingOnCart <= 2) {
      setTimeout(() => populateCart(entry.cartIndex), 850);
    }
  }

  function returnHeldItemToCart() {
    if (!state.heldItem) return;
    pool.despawnItem(state.heldItem.mesh);
    state.heldItem = null;
    audio.playErrorBump();
    populateAllCarts();
  }

  function playWithHeldItem() {
    if (!state.heldItem) return;
    const h = state.heldItem;
    h.squishTime = 0.42;
    if (h.itemType === 'clicker') {
      h.clickTime = 0.3;
      audio.playClicker();
      vibrateGamepad(45, 0.35, 0.6);
    } else if (h.itemType === 'needoh' || h.itemType === 'squishy') {
      audio.playSquish(h.itemType === 'squishy');
      vibrateGamepad(65, 0.25, 0.35);
    } else if (h.itemType === 'cup') {
      audio.playCupClink();
      vibrateGamepad(45, 0.15, 0.4);
    } else {
      audio.playFabricRustle(h.itemType === 'sweatshirt_adult');
      vibrateGamepad(50, 0.15, 0.25);
    }
  }

  function placeHeldItemOnSlot(slot) {
    if (!state.heldItem || !slot || slot.occupied) return false;
    if (slot.itemType !== state.heldItem.itemType) {
      audio.playErrorBump();
      vibrateGamepad(70, 0.4, 0.2);
      return false;
    }

    const mesh = state.heldItem.mesh;
    state.heldItem = null;

    slot.parentBay.add(mesh);
    mesh.position.copy(slot.localPos);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1.3, 0.72, 1.3);
    mesh.userData.landingPop = 0.42;
    slot.occupied = true;
    slot.itemMesh = mesh;

    state.stockedCount++;
    const nowSec = performance.now() * 0.001;
    state.combo = (nowSec - state.lastStockTime < 9.0) ? Math.min(state.combo + 1, 6) : 1;
    state.lastStockTime = nowSec;
    updateHudCounters();

    audio.playRestockSuccess(state.combo);
    vibrateGamepad(85, 0.25, 0.55);

    const worldSlotPos = slot.localPos.clone().applyMatrix4(slot.parentBay.matrixWorld);
    spawnSparkleBurst(worldSlotPos.add(new THREE.Vector3(0, 0.25, 0)), [ITEM_META[slot.itemType].colorHex, 0xffc220, 0xffffff], 14);

    advanceShiftProgress(16);

    const emptyCount = allShelfSlots.filter((s) => !s.occupied).length;
    if (emptyCount <= 4) {
      let cleared = 0;
      for (const s of allShelfSlots) {
        if (s.occupied && s !== slot && cleared < 10) {
          pool.despawnItem(s.itemMesh);
          s.itemMesh = null;
          s.occupied = false;
          cleared++;
        }
      }
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Checkout Aisle (Lane #1) — Shopper Line & Clerk Scanning Loop!
  // ---------------------------------------------------------------------------
  const QUEUE_POSITIONS = [
    new THREE.Vector3(5.05, 0, 6.95),
    new THREE.Vector3(5.05, 0, 5.2),
    new THREE.Vector3(5.05, 0, 3.5)
  ];

  function spawnCheckoutShopper() {
    if (state.doorsLocked || state.checkoutShoppers.length >= 3) return;
    const spawnPos = new THREE.Vector3(3.8, 0, 1.6);
    const char = pool.spawnShopper(spawnPos);
    if (!char) return;
    const queueIdx = state.checkoutShoppers.length;
    const itemCount = 2 + (Math.floor(Math.random() * 3));
    const shopper = {
      char,
      state: 'walking_to_line',
      queueIndex: queueIdx,
      itemCount,
      beltLoaded: false,
      bagMesh: null,
      walkPhase: Math.random() * 6
    };
    state.checkoutShoppers.push(shopper);
  }

  function loadShopperItemsOntoBelt(shopper) {
    if (!shopper || shopper.beltLoaded) return;
    shopper.beltLoaded = true;
    state.checkoutRunningTotal = 0;

    for (let i = 0; i < shopper.itemCount; i++) {
      const type = ITEM_LIST[Math.floor(Math.random() * ITEM_LIST.length)];
      const localPos = new THREE.Vector3(0, 1.0, -1.75 + i * 0.52);
      const mesh = pool.spawnItem(type, localPos, checkout.group);
      if (!mesh) continue;
      mesh.userData.interactable = true;
      mesh.userData.kind = 'checkout_scan';
      mesh.userData.checkoutItem = true;
      state.beltItems.push({
        mesh,
        itemType: type,
        targetZ: -0.3 - (shopper.itemCount - 1 - i) * 0.48
      });
    }
    checkout.updatePosScreen(
      `${shopper.itemCount} Items Waiting`,
      '',
      '$0.00',
      'CLERK: ADDY'
    );
  }

  function scanNextCheckoutItem() {
    const frontShopper = state.checkoutShoppers[0];
    if (!frontShopper || frontShopper.state !== 'at_counter' || state.beltItems.length === 0) {
      return false;
    }

    const entry = state.beltItems.pop();
    const meta = ITEM_META[entry.itemType];
    state.checkoutRunningTotal += meta.price;

    state.laserFlashTimer = 0.28;
    audio.playBarcodeBeep();
    vibrateGamepad(55, 0.2, 0.55);

    checkout.updatePosScreen(
      meta.label,
      formatMoney(meta.price),
      formatMoney(state.checkoutRunningTotal),
      state.beltItems.length > 0 ? 'SCANNED!' : 'PAID • THANK YOU!'
    );

    const worldScannerPos = checkout.scannerLocal.clone().applyMatrix4(checkout.group.matrixWorld);
    spawnSparkleBurst(worldScannerPos.add(new THREE.Vector3(0, 0.25, 0)), [0xff2244, 0xffc220, 0xffffff], 8);

    state.scanningAnims.push({
      mesh: entry.mesh,
      startPos: entry.mesh.position.clone(),
      progress: 0
    });

    if (state.beltItems.length === 0) {
      state.checkoutsCount++;
      updateHudCounters();
      state.cashDrawerTimer = 0.9;
      audio.playCashRegisterKaChing();
      vibrateGamepad(110, 0.3, 0.6);

      const bag = pool.shoppingBagPool.spawn(new THREE.Vector3(0, -0.15, 0), frontShopper.char.handAnchor);
      frontShopper.bagMesh = bag;
      frontShopper.state = 'leaving';

      spawnSparkleBurst(
        checkout.group.position.clone().add(new THREE.Vector3(0, 1.5, 1.5)),
        [0x4ade80, 0xffc220, 0x0071ce],
        16
      );

      advanceShiftProgress(20);

      state.checkoutShoppers.shift();
      state.checkoutShoppers.forEach((s, idx) => {
        s.queueIndex = idx;
        if (s.state !== 'leaving') s.state = 'walking_to_line';
      });
      leavingShoppers.push(frontShopper);
    }
    return true;
  }

  const leavingShoppers = [];

  // ---------------------------------------------------------------------------
  // Lost Kids (with Names!) + PA Microphone + $100,000 Tip + Free Food!
  // ---------------------------------------------------------------------------
  const KID_SPAWN_SPOTS = [
    new THREE.Vector3(-4.8, 0, -0.2),
    new THREE.Vector3(4.8, 0, -4.2),
    new THREE.Vector3(-4.8, 0, -8.2),
    new THREE.Vector3(4.8, 0, -12.2),
    new THREE.Vector3(-4.8, 0, -12.2),
    new THREE.Vector3(4.8, 0, -0.2)
  ];

  function spawnLostKid() {
    if (state.activeLostKid || state.doorsLocked) return;
    const name = LOST_KID_NAMES[state.kidSeedCounter % LOST_KID_NAMES.length];
    const spot = KID_SPAWN_SPOTS[state.kidSeedCounter % KID_SPAWN_SPOTS.length].clone();
    state.kidSeedCounter++;

    const char = pool.spawnLostKid(name, spot);
    if (!char) return;
    char.group.userData.interactable = true;
    char.group.userData.kind = 'lost_kid';

    state.activeLostKid = {
      char,
      name,
      following: false,
      paged: false,
      reunited: false,
      walkTimer: 0
    };

    audio.playLostKidCue();
    showPaBanner(`${name} is lost in the aisles!`, 4.2);
  }

  function usePaMicrophone() {
    state.micActiveTimer = 6.5;
    vibrateGamepad(95, 0.25, 0.55);

    if (state.activeLostKid && !state.activeLostKid.paged) {
      const kid = state.activeLostKid;
      kid.paged = true;
      kid.following = true;
      const myToken = ++state.announcementToken;
      state.announcementPlaying = true;
      showPaBanner(`"Attention Walmart shoppers, we have found ${kid.name}! Please come meet Addy!"`, 7.5);

      // Play the entire PA chime + full announcement audio clip BEFORE the parent arrives to pick up their kid!
      audio.playMicAnnouncement(kid.name, () => {
        if (state.announcementToken !== myToken) return;
        state.announcementPlaying = false;
        state.micActiveTimer = Math.min(state.micActiveTimer, 0.4);
        if (!state.activeLostKid || state.activeLostKid !== kid || state.activeParent || state.doorsLocked) return;

        const parentChar = pool.spawnParent(kid.name, new THREE.Vector3(0, 0, 15.2));
        const tipMesh = pool.tipBundlePool.spawn(new THREE.Vector3(0, 0.08, 0), parentChar.handAnchor);

        state.activeParent = {
          char: parentChar,
          state: 'approaching',
          hugTimer: 0,
          tipMesh,
          foodMesh: null
        };
      });
    } else if (!state.announcementPlaying) {
      audio.playMicAnnouncement(null);
      showPaBanner('Welcome to Walmart! Fresh stock in all 10 aisles!', 3.6);
    }
  }

  // ---------------------------------------------------------------------------
  // 11:00 PM Breakroom Lunch & 11:46 AM Lock Doors with Addy's Keys!
  // ---------------------------------------------------------------------------
  function eatLunchItem(foodObj) {
    if (!foodObj || !foodObj.visible) return;
    foodObj.visible = false;
    audio.playEatBite(Boolean(foodObj.userData.isDrink));
    vibrateGamepad(65, 0.2, 0.45);

    const worldPos = new THREE.Vector3();
    foodObj.getWorldPosition(worldPos);
    spawnSparkleBurst(worldPos, [0xffc220, 0xf472b6, 0x4ade80], 12);

    const remaining = breakroom.foodItems.filter((f) => f.visible).length;
    if (remaining === 0 && state.phase === 'lunch') {
      finishLunchBreak();
    }
  }

  function finishLunchBreak() {
    if (state.lunchCompleted) return;
    state.lunchCompleted = true;
    state.phase = 'shift_night';
    state.shiftMinutes = Math.max(state.shiftMinutes, LUNCH_END_MIN);
    audio.playRestockSuccess(4);
    showPaBanner('11:30 PM — Break Over! Great energy, Addy!', 4.0);
  }

  function equipAddyKeys() {
    if (state.holdingKeys) return;
    if (state.heldItem) {
      pool.despawnItem(state.heldItem.mesh);
      state.heldItem = null;
    }
    state.holdingKeys = true;
    const anchor = getActiveHoldAnchor();
    anchor.add(storeKeysMesh);
    storeKeysMesh.visible = true;
  }

  function lockDoorsAndGoHome() {
    if (state.doorsLocked) return;
    if (playerRig.position.z < 12.15) {
      playerRig.position.z = 13.0;
    }
    state.doorsLocked = true;
    state.phase = 'complete';
    state.lockAnimTimer = 1.65;

    audio.playKeyLockDoors();
    vibrateGamepad(220, 0.55, 0.85);

    env.lockIndicatorMat.color.setHex(0xef4444);
    env.lockIndicatorMat.emissive.setHex(0xef4444);
    env.updateStoreMarquee('CLOSED • LOCKED BY ADDY!', '#b91c1c', '#ffc220');
    showPaBanner('11:46 AM — Doors Locked! Heading Home, Addy!', 5.0);

    spawnSparkleBurst(new THREE.Vector3(2.26, 1.5, 12.6), [0xffc220, 0x0071ce, 0x4ade80, 0xffffff], 32);
    spawnSparkleBurst(new THREE.Vector3(0, 2.2, 12.6), [0xffc220, 0x38bdf8, 0xf472b6], 28);

    setTimeout(() => {
      if (state.phase === 'complete') {
        openShiftCompleteDialog();
      }
    }, 1650);
  }

  function openShiftCompleteDialog() {
    if (summaryTipsEl) summaryTipsEl.textContent = formatMoney(state.tipsEarned);
    if (summaryStockedEl) summaryStockedEl.textContent = String(state.stockedCount);
    if (summaryCheckoutsEl) summaryCheckoutsEl.textContent = String(state.checkoutsCount);
    if (summaryKidsEl) summaryKidsEl.textContent = String(state.kidsReunited);
    if (summaryFoodEl) summaryFoodEl.textContent = String(state.freeFoodGiven);
    if (shiftDialog && !shiftDialog.open) {
      try { shiftDialog.showModal(); } catch (_) {}
    }
  }

  function restartNewShift() {
    if (shiftDialog && shiftDialog.open) {
      try { shiftDialog.close(); } catch (_) {}
    }

    if (state.heldItem) {
      pool.despawnItem(state.heldItem.mesh);
      state.heldItem = null;
    }
    state.holdingKeys = false;
    storeKeysMesh.visible = false;

    for (const e of state.cartEntries) pool.despawnItem(e.mesh);
    state.cartEntries = [];

    for (const s of allShelfSlots) {
      if (s.itemMesh) pool.despawnItem(s.itemMesh);
      s.itemMesh = null;
      s.occupied = false;
    }

    for (const b of state.beltItems) pool.despawnItem(b.mesh);
    state.beltItems = [];
    for (const a of state.scanningAnims) pool.despawnItem(a.mesh);
    state.scanningAnims = [];
    for (const s of state.checkoutShoppers) pool.despawnShopper(s.char);
    state.checkoutShoppers = [];
    for (const s of leavingShoppers) pool.despawnShopper(s.char);
    leavingShoppers.length = 0;

    if (state.activeLostKid) {
      pool.despawnLostKid(state.activeLostKid.char);
      state.activeLostKid = null;
    }
    if (state.activeParent) {
      pool.despawnParent(state.activeParent.char);
      state.activeParent = null;
    }
    if (state.flyingTipAnim) {
      pool.tipBundlePool.despawn(state.flyingTipAnim.mesh);
      state.flyingTipAnim = null;
    }

    breakroom.foodItems.forEach((f) => { f.visible = true; });

    state.shiftMinutes = 0;
    state.hasEnteredStore = false;
    state.phase = 'arriving';
    state.lunchTriggered = false;
    state.lunchCompleted = false;
    state.doorsLocked = false;
    state.tipsEarned = 0;
    state.stockedCount = 0;
    state.checkoutsCount = 0;
    state.kidsReunited = 0;
    state.freeFoodGiven = 0;
    state.combo = 0;
    state.nextKidShiftMin = 75;
    state.announcementToken++;
    state.announcementPlaying = false;
    state.checkoutRunningTotal = 0;
    state.moveTarget = null;

    env.lockIndicatorMat.color.setHex(0x22c55e);
    env.lockIndicatorMat.emissive.setHex(0x22c55e);
    env.lockCylinder.rotation.z = 0;
    env.updateStoreMarquee('OPEN 11:30 AM • WELCOME!', '#15803d', '#fef08a');
    checkout.updatePosScreen('Walmart Register', '', '$0.00', 'CLERK: ADDY');

    playerRig.position.set(0, 0, 25.5);
    lookYaw = 0;
    lookPitch = -0.04;

    populateAllCarts();
    updateHudCounters();
    lastClockStr = '';
  }

  function advanceShiftProgress(bonusMinutes) {
    if (state.phase === 'shift_day') {
      state.shiftMinutes = Math.min(LUNCH_START_MIN - 2, state.shiftMinutes + bonusMinutes);
    } else if (state.phase === 'shift_night') {
      state.shiftMinutes = Math.min(SHIFT_END_MIN - 2, state.shiftMinutes + bonusMinutes);
    }
  }

  // ---------------------------------------------------------------------------
  // Primary Interaction Raycast & Smart Proximity Resolver
  // ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const tempVec = new THREE.Vector3();
  const tempVec2 = new THREE.Vector3();

  function findOwnerInteractable(obj) {
    let cur = obj;
    while (cur) {
      if (cur.userData && cur.userData.interactable) return cur;
      cur = cur.parent;
    }
    return null;
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

    const playerWorldPos = new THREE.Vector3();
    playerRig.getWorldPosition(playerWorldPos);

    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
      if (hit.distance > 5.8) break;
      const owner = findOwnerInteractable(hit.object);
      if (!owner) continue;
      const kind = owner.userData.kind;

      if (kind === 'door_lock' && state.phase === 'lock_up_ready') {
        lockDoorsAndGoHome();
        return;
      }
      if (kind === 'pa_mic') {
        usePaMicrophone();
        return;
      }
      if (kind === 'checkout_scan') {
        if (scanNextCheckoutItem()) return;
      }
      if (kind === 'lost_kid' && state.activeLostKid) {
        if (!state.activeLostKid.following) {
          state.activeLostKid.following = true;
          audio.playLostKidCue();
          vibrateGamepad(65, 0.2, 0.45);
          showPaBanner(`${state.activeLostKid.name} is following Addy to the PA Mic!`, 3.6);
        }
        return;
      }
      if (kind === 'lunch_food' && owner.visible) {
        eatLunchItem(owner);
        return;
      }
      if (kind === 'cart_item' && !state.heldItem && !state.holdingKeys) {
        grabCartItem(owner.userData.cartEntry);
        return;
      }
      if (kind === 'shelf_slot' && state.heldItem) {
        if (placeHeldItemOnSlot(owner.userData.slot)) return;
      }
    }

    // Smart Proximity Fallbacks
    if (state.phase === 'lock_up_ready') {
      env.doorLockGroup.getWorldPosition(tempVec);
      if (tempVec.distanceTo(playerWorldPos) < 4.5) {
        lockDoorsAndGoHome();
        return;
      }
    }

    checkout.group.getWorldPosition(tempVec);
    if (tempVec.distanceTo(playerWorldPos) < 4.2 && state.beltItems.length > 0) {
      if (scanNextCheckoutItem()) return;
    }

    paMic.group.getWorldPosition(tempVec);
    if (tempVec.distanceTo(playerWorldPos) < 3.6) {
      usePaMicrophone();
      return;
    }

    if (state.activeLostKid && !state.activeLostKid.following) {
      state.activeLostKid.char.group.getWorldPosition(tempVec);
      if (tempVec.distanceTo(playerWorldPos) < 3.4) {
        state.activeLostKid.following = true;
        audio.playLostKidCue();
        vibrateGamepad(65, 0.2, 0.45);
        showPaBanner(`${state.activeLostKid.name} is following Addy to the PA Mic!`, 3.6);
        return;
      }
    }

    breakroom.group.getWorldPosition(tempVec);
    if (tempVec.distanceTo(playerWorldPos) < 3.2) {
      const nextFood = breakroom.foodItems.find((f) => f.visible);
      if (nextFood) {
        eatLunchItem(nextFood);
        return;
      }
    }

    if (state.heldItem) {
      let bestSlot = null;
      let bestDist = 3.4;
      for (const slot of allShelfSlots) {
        if (slot.occupied || slot.itemType !== state.heldItem.itemType) continue;
        tempVec.copy(slot.localPos).applyMatrix4(slot.parentBay.matrixWorld);
        const d = tempVec.distanceTo(playerWorldPos);
        if (d < bestDist) {
          bestDist = d;
          bestSlot = slot;
        }
      }
      if (bestSlot) {
        placeHeldItemOnSlot(bestSlot);
        return;
      }
    } else if (!state.holdingKeys) {
      let bestEntry = null;
      let bestDist = 3.0;
      for (const entry of state.cartEntries) {
        entry.mesh.getWorldPosition(tempVec);
        const d = tempVec.distanceTo(playerWorldPos);
        if (d < bestDist) {
          bestDist = d;
          bestEntry = entry;
        }
      }
      if (bestEntry) {
        grabCartItem(bestEntry);
        return;
      }
    }

    if (state.heldItem && !clickFloorAllowed) {
      playWithHeldItem();
      return;
    }

    if (clickFloorAllowed) {
      const floorHit = hits.find((h) => h.object.userData && h.object.userData.isFloor && h.distance < 22);
      if (floorHit) {
        state.moveTarget = new THREE.Vector3(floorHit.point.x, 0, floorHit.point.z);
        spawnSparkleBurst(floorHit.point.clone().add(new THREE.Vector3(0, 0.08, 0)), [0x0071ce, 0xffc220], 5);
      } else if (state.heldItem) {
        playWithHeldItem();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Xbox Controller (Standard Gamepad API) + Dual-Rumble Haptics!
  // ---------------------------------------------------------------------------
  const prevGamepadButtons = new Array(18).fill(false);
  let activeGamepadIndex = null;

  window.addEventListener('gamepadconnected', (e) => {
    activeGamepadIndex = e.gamepad.index;
  });
  window.addEventListener('gamepaddisconnected', (e) => {
    if (activeGamepadIndex === e.gamepad.index) activeGamepadIndex = null;
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
    return Math.sign(val) * ((Math.abs(val) - dz) / (1 - dz));
  }

  // ---------------------------------------------------------------------------
  // Keyboard, Mouse Drag & Mobile Dual Virtual Touch Joysticks
  // ---------------------------------------------------------------------------
  let lookYaw = 0;
  let lookPitch = -0.04;
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

  // Mobile Virtual Touch Joysticks
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
    state.touchMove.x = 0;
    state.touchMove.y = 0;
    state.touchLook.x = 0;
    state.touchLook.y = 0;
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
    const clamped = Math.min(dist, moveStickMaxRadius);
    if (touchMoveKnob) {
      touchMoveKnob.style.transform = `translate(${Math.cos(angle) * clamped}px, ${Math.sin(angle) * clamped}px)`;
    }
    const dz = moveStickMaxRadius * 0.14;
    if (clamped < dz) {
      state.touchMove.x = 0;
      state.touchMove.y = 0;
    } else {
      const mag = (clamped - dz) / (moveStickMaxRadius - dz);
      state.touchMove.x = Math.cos(angle) * mag;
      state.touchMove.y = Math.sin(angle) * mag;
      state.moveTarget = null;
    }
  }

  function updateLookStick(clientX, clientY) {
    const dx = clientX - lookStickCenter.x;
    const dy = clientY - lookStickCenter.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clamped = Math.min(dist, lookStickMaxRadius);
    if (touchLookKnob) {
      touchLookKnob.style.transform = `translate(${Math.cos(angle) * clamped}px, ${Math.sin(angle) * clamped}px)`;
    }
    if (Math.hypot(clientX - lookStickStartX, clientY - lookStickStartY) > 14) {
      lookStickMoved = true;
    }
    const dz = lookStickMaxRadius * 0.16;
    if (clamped < dz) {
      state.touchLook.x = 0;
      state.touchLook.y = 0;
    } else {
      const mag = (clamped - dz) / (lookStickMaxRadius - dz);
      state.touchLook.x = Math.cos(angle) * mag;
      state.touchLook.y = Math.sin(angle) * mag;
      state.quickTurnRemaining = 0;
    }
  }

  if (touchMoveZone) {
    touchMoveZone.addEventListener('contextmenu', (e) => e.preventDefault());
    touchMoveZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audio.unlock();
      if (moveStickPointerId !== null) return;
      const r = touchMoveZone.getBoundingClientRect();
      moveStickCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      moveStickMaxRadius = Math.max(26, r.width * 0.34);
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
    const relMove = (e) => {
      if (e.pointerId !== moveStickPointerId) return;
      moveStickPointerId = null;
      state.touchMove.x = 0;
      state.touchMove.y = 0;
      touchMoveZone.classList.remove('is-active');
      if (touchMoveKnob) touchMoveKnob.style.transform = 'translate(0px, 0px)';
      try { touchMoveZone.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    touchMoveZone.addEventListener('pointerup', relMove);
    touchMoveZone.addEventListener('pointercancel', relMove);
  }

  if (touchLookZone) {
    touchLookZone.addEventListener('contextmenu', (e) => e.preventDefault());
    touchLookZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audio.unlock();
      if (lookStickPointerId !== null) return;
      const r = touchLookZone.getBoundingClientRect();
      lookStickCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      lookStickMaxRadius = Math.max(26, r.width * 0.34);
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
    const relLook = (e, isCancel) => {
      if (e.pointerId !== lookStickPointerId) return;
      const dur = performance.now() - lookStickStartTime;
      const delta = Math.hypot(e.clientX - lookStickStartX, e.clientY - lookStickStartY);
      const wasTap = !isCancel && !lookStickMoved && dur < 360 && delta < 24;
      lookStickPointerId = null;
      state.touchLook.x = 0;
      state.touchLook.y = 0;
      touchLookZone.classList.remove('is-active');
      if (touchLookKnob) touchLookKnob.style.transform = 'translate(0px, 0px)';
      try { touchLookZone.releasePointerCapture(e.pointerId); } catch (_) {}
      if (wasTap) {
        touchLookZone.classList.add('tap-flash');
        if (lookTapFlashTimer) clearTimeout(lookTapFlashTimer);
        lookTapFlashTimer = setTimeout(() => touchLookZone.classList.remove('tap-flash'), 180);
        performPrimaryInteraction(null, false);
      }
    };
    touchLookZone.addEventListener('pointerup', (e) => relLook(e, false));
    touchLookZone.addEventListener('pointercancel', (e) => relLook(e, true));
  }

  function bindTouchBtn(btn, fn) {
    if (!btn) return;
    let lastAt = 0;
    const fire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (now - lastAt < 120) return;
      lastAt = now;
      audio.unlock();
      btn.classList.add('is-pressed');
      setTimeout(() => btn.classList.remove('is-pressed'), 140);
      fn();
    };
    btn.addEventListener('pointerdown', fire);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (performance.now() - lastAt > 250) fire(e);
    });
  }

  bindTouchBtn(touchBtnInteract, () => performPrimaryInteraction(null, false));
  bindTouchBtn(touchBtnSquish, () => { if (state.heldItem) playWithHeldItem(); });
  bindTouchBtn(touchBtnTurn180, () => {
    if (state.isInXR) playerRig.rotation.y += Math.PI;
    else state.quickTurnRemaining += Math.PI;
  });

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && !hasTouchInteraction && !isVrHeadsetUA()) {
      hasTouchInteraction = true;
      updateMobileTouchVisibility();
    }
  }, { passive: true });
  window.addEventListener('blur', resetTouchControls);
  updateMobileTouchVisibility();

  // ---------------------------------------------------------------------------
  // Smooth World Collision & Doorway Clamping
  // ---------------------------------------------------------------------------
  function resolveBoxCollision(cx, cz, halfW, halfD) {
    const dx = playerRig.position.x - cx;
    const dz = playerRig.position.z - cz;
    if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
      if (Math.abs(dx) / halfW > Math.abs(dz) / halfD) {
        playerRig.position.x = cx + Math.sign(dx || 1) * halfW;
      } else {
        playerRig.position.z = cz + Math.sign(dz || 1) * halfD;
      }
    }
  }

  function clampPlayerPosition() {
    playerRig.position.x = Math.max(-18.1, Math.min(18.1, playerRig.position.x));
    playerRig.position.z = Math.max(-17.1, Math.min(28.5, playerRig.position.z));

    const inDoorwayX = Math.abs(playerRig.position.x) < 1.8 && !state.doorsLocked;
    if (!inDoorwayX) {
      const dzWall = playerRig.position.z - 12.0;
      if (Math.abs(dzWall) < 0.72) {
        playerRig.position.z = 12.0 + Math.sign(dzWall || 1) * 0.72;
      }
    }

    for (const bay of aisleBays) {
      resolveBoxCollision(bay.group.position.x, bay.group.position.z, 2.8, 0.92);
    }

    for (const cart of stockCarts) {
      resolveBoxCollision(cart.group.position.x, cart.group.position.z, 1.25, 0.85);
    }

    resolveBoxCollision(paMic.group.position.x, paMic.group.position.z, 2.05, 0.98);
    resolveBoxCollision(checkout.group.position.x, checkout.group.position.z, 0.95, 2.62);

    const brDx = playerRig.position.x - breakroom.group.position.x;
    const brDz = playerRig.position.z - breakroom.group.position.z;
    const brDist = Math.hypot(brDx, brDz);
    if (brDist < 1.3 && brDist > 0.001) {
      playerRig.position.x = breakroom.group.position.x + (brDx / brDist) * 1.3;
      playerRig.position.z = breakroom.group.position.z + (brDz / brDist) * 1.3;
    }

    if (!state.hasEnteredStore && playerRig.position.z < 10.8) {
      state.hasEnteredStore = true;
      state.phase = 'shift_day';
      showPaBanner('11:30 AM — Welcome to Walmart, Addy! Store is Open!', 4.2);
      audio.playRestockSuccess(2);
    }
  }

  // ---------------------------------------------------------------------------
  // WebXR VR & AR Controllers + Addy's 3D Wrist Name Badge!
  // ---------------------------------------------------------------------------
  const controllerModelFactory = new XRControllerModelFactory();
  const xrRightHoldAnchor = new THREE.Group();
  xrRightHoldAnchor.position.set(0, 0.02, -0.18);

  const laserGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -5.0)
  ]);

  for (let i = 0; i < 2; i++) {
    const ctrl = renderer.xr.getController(i);
    const grip = renderer.xr.getControllerGrip(i);
    grip.add(controllerModelFactory.createControllerModel(grip));

    const laser = new THREE.Line(
      laserGeo,
      new THREE.LineBasicMaterial({ color: i === 1 ? 0xffc220 : 0x38bdf8, transparent: true, opacity: 0.75 })
    );
    ctrl.add(laser);

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
  }

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
        scene.background = activeSkyColor;
        scene.fog = new THREE.FogExp2(activeSkyColor.getHex(), 0.0085);
        if (state.heldItem) heldAnchorDesktop.add(state.heldItem.mesh);
        if (state.holdingKeys) heldAnchorDesktop.add(storeKeysMesh);
      });
      await renderer.xr.setSession(session);
      if (state.heldItem) xrRightHoldAnchor.add(state.heldItem.mesh);
      if (state.holdingKeys) xrRightHoldAnchor.add(storeKeysMesh);
    } catch (err) {
      console.warn('[Addy2WalmartXR] Could not start XR:', err);
    }
  }

  if (btnEnterVr) btnEnterVr.addEventListener('click', () => startXR('immersive-vr'));
  if (btnEnterAr) btnEnterAr.addEventListener('click', () => startXR('immersive-ar'));
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      audio.unlock();
      const next = audio.setMuted(!audio.isMuted());
      btnMute.textContent = next ? '\uD83D\uDD07' : '\uD83D\uDD0A';
      btnMute.setAttribute('aria-pressed', String(!next));
    });
  }
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', restartNewShift);
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
  // Main Frame Loop (Xbox Gamepad, Timeline, Sky, Checkout, Kids, Particles)
  // ---------------------------------------------------------------------------
  let prevTime = performance.now();
  let lastClockStr = '';
  let xrSnapCooldown = 0;

  function updateGamepadAndMovement(dt) {
    let moveX = 0;
    let moveZ = 0;

    if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveZ -= 1;
    if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveZ += 1;
    if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveX -= 1;
    if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveX += 1;

    if (!state.isInXR) {
      moveX += state.touchMove.x;
      moveZ += state.touchMove.y;
      if (Math.abs(state.touchLook.x) > 0.001 || Math.abs(state.touchLook.y) > 0.001) {
        lookYaw -= state.touchLook.x * 2.15 * dt;
        lookPitch = Math.max(-0.95, Math.min(0.85, lookPitch - state.touchLook.y * 1.45 * dt));
      }
      if (state.quickTurnRemaining > 0.001) {
        const step = Math.min(state.quickTurnRemaining, Math.PI * 3.2 * dt);
        lookYaw += step;
        state.quickTurnRemaining -= step;
      }
    }

    const pad = getActiveGamepad();
    if (pad) {
      const lx = applyDeadzone(pad.axes[0] || 0, 0.16);
      const ly = applyDeadzone(pad.axes[1] || 0, 0.16);
      const rx = applyDeadzone(pad.axes[2] || 0, 0.16);
      const ry = applyDeadzone(pad.axes[3] || 0, 0.16);

      moveX += lx;
      moveZ += ly;

      if (pad.buttons[12]?.pressed) moveZ -= 1;
      if (pad.buttons[13]?.pressed) moveZ += 1;
      if (pad.buttons[14]?.pressed) lookYaw += 2.2 * dt;
      if (pad.buttons[15]?.pressed) lookYaw -= 2.2 * dt;

      if (!state.isInXR) {
        lookYaw -= rx * 2.4 * dt;
        lookPitch = Math.max(-0.95, Math.min(0.85, lookPitch - ry * 1.75 * dt));
      } else if (Math.abs(rx) > 0.5 && xrSnapCooldown <= 0) {
        playerRig.rotation.y -= Math.sign(rx) * (Math.PI / 4);
        xrSnapCooldown = 0.28;
      }

      const pressedNow = (idx) => {
        const b = pad.buttons[idx];
        return Boolean(b && (b.pressed || b.value > 0.55));
      };
      const justPressed = (idx) => pressedNow(idx) && !prevGamepadButtons[idx];

      if (justPressed(0) || justPressed(2) || justPressed(7)) {
        performPrimaryInteraction(null, false);
      }
      if (justPressed(1) || justPressed(6) || justPressed(3)) {
        if (state.heldItem) {
          let nearCart = false;
          for (const cart of stockCarts) {
            if (cart.group.position.distanceTo(playerRig.position) < 2.6) {
              nearCart = true;
              break;
            }
          }
          if (justPressed(1) && nearCart) returnHeldItemToCart();
          else playWithHeldItem();
        }
      }
      if (justPressed(4)) {
        if (state.isInXR) playerRig.rotation.y += Math.PI / 4;
        else lookYaw += Math.PI / 4;
      }
      if (justPressed(5)) {
        if (state.isInXR) playerRig.rotation.y -= Math.PI / 4;
        else lookYaw -= Math.PI / 4;
      }
      if (justPressed(9) && state.phase === 'complete') {
        restartNewShift();
      }

      for (let i = 0; i < prevGamepadButtons.length; i++) {
        prevGamepadButtons[i] = pressedNow(i);
      }
    }

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

    if (!state.isInXR) {
      camera.rotation.order = 'YXZ';
      camera.rotation.y = lookYaw;
      camera.rotation.x = lookPitch;
    }

    const moveMag = Math.hypot(moveX, moveZ);
    const speed = state.lunchCompleted ? 4.9 : 4.4;
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
      if (state.footstepAccum > 0.44) {
        state.footstepAccum = 0;
        audio.playFootstep(playerRig.position.z > 12.2);
      }
    } else if (state.moveTarget) {
      const toTarget = tempVec.copy(state.moveTarget).sub(playerRig.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < 0.22) {
        state.moveTarget = null;
      } else {
        toTarget.normalize();
        playerRig.position.addScaledVector(toTarget, Math.min(dist, speed * dt));
        clampPlayerPosition();
      }
    }
  }

  function updateSkyAndLighting(dt) {
    if (state.isInXR && state.xrMode === 'immersive-ar') return;

    const dayFraction = (state.shiftMinutes % 1440) / 1440;
    const sunElev = Math.cos(dayFraction * Math.PI * 2);

    if (sunElev > 0.25) {
      activeSkyColor.copy(skyColorDay);
    } else if (sunElev > -0.15) {
      const t = (sunElev + 0.15) / 0.4;
      const horizonCol = dayFraction < 0.5 ? skyColorSunset : skyColorDawn;
      activeSkyColor.copy(horizonCol).lerp(skyColorDay, t);
    } else {
      const t = Math.min(1, (-0.15 - sunElev) / 0.35);
      const horizonCol = dayFraction < 0.5 ? skyColorSunset : skyColorDawn;
      activeSkyColor.copy(horizonCol).lerp(skyColorNight, t);
    }

    scene.background = activeSkyColor;
    if (scene.fog) scene.fog.color.copy(activeSkyColor);

    env.sunMesh.position.set(Math.sin(dayFraction * Math.PI * 2) * 32, sunElev * 30, 38);
    env.moonMesh.position.set(-Math.sin(dayFraction * Math.PI * 2) * 32, -sunElev * 28, 38);

    const nightFactor = Math.max(0, Math.min(1, (-sunElev + 0.1) * 1.4));
    env.starMat.opacity = nightFactor * 0.92;
    env.cloudGroup.children.forEach((c, idx) => {
      c.position.x += dt * (0.28 + (idx % 3) * 0.12);
      if (c.position.x > 42) c.position.x = -42;
    });

    env.streetLampBulbs.forEach((m) => { m.emissiveIntensity = 0.15 + nightFactor * 1.6; });
    env.streetLampLights.forEach((l) => { l.intensity = nightFactor * 2.2; });
    sunDirLight.intensity = 0.45 + Math.max(0, sunElev) * 0.95;
  }

  function updateShiftTimeline(dt) {
    if (state.phase === 'complete') return;

    if (state.phase === 'shift_day') {
      state.shiftMinutes += dt * 5.8;
      if (state.shiftMinutes >= state.nextKidShiftMin && !state.activeLostKid) {
        spawnLostKid();
        state.nextKidShiftMin += 240;
      }
      if (state.shiftMinutes >= LUNCH_START_MIN && !state.lunchTriggered) {
        state.lunchTriggered = true;
        state.phase = 'lunch';
        state.shiftMinutes = LUNCH_START_MIN;
        audio.playLunchBell();
        vibrateGamepad(140, 0.3, 0.55);
        showPaBanner("11:00 PM — Lunch Break in Addy's Breakroom!", 4.8);
      }
    } else if (state.phase === 'lunch') {
      state.shiftMinutes = Math.min(LUNCH_END_MIN, state.shiftMinutes + dt * 1.35);
      if (state.shiftMinutes >= LUNCH_END_MIN) {
        finishLunchBreak();
      }
    } else if (state.phase === 'shift_night') {
      state.shiftMinutes += dt * 6.4;
      if (state.shiftMinutes >= state.nextKidShiftMin && !state.activeLostKid) {
        spawnLostKid();
        state.nextKidShiftMin += 240;
      }
      if (state.shiftMinutes >= SHIFT_END_MIN) {
        state.shiftMinutes = SHIFT_END_MIN;
        state.phase = 'lock_up_ready';
        equipAddyKeys();
        audio.playShiftReadyBell();
        vibrateGamepad(180, 0.35, 0.7);
        showPaBanner('11:46 AM — Time to go home! Lock the front doors with your keys, Addy!', 6.5);
      }
    }

    const clockStr = formatShiftClock(state.shiftMinutes);
    if (clockStr !== lastClockStr) {
      lastClockStr = clockStr;
      if (clockEl) clockEl.textContent = clockStr;

      let sub = 'WALMART • 11:30 AM – 11:46 AM';
      let col = '#ffc220';
      if (state.phase === 'lunch') {
        sub = '11:00 PM • LUNCH BREAK!';
        col = '#4ade80';
      } else if (state.phase === 'lock_up_ready' || state.phase === 'complete') {
        sub = '11:46 AM • LOCK DOORS & GO HOME!';
        col = '#38bdf8';
      }
      backClock.update(clockStr, sub, col);
      frontClock.update(clockStr, sub, col);
    }
  }

  function updateWorldAnimations(dt, elapsed) {
    // 1. Automatic Sliding Glass Entrance Doors
    let someoneAtDoor = false;
    if (!state.doorsLocked) {
      if (Math.abs(playerRig.position.x) < 3.6 && playerRig.position.z > 8.0 && playerRig.position.z < 16.5) {
        someoneAtDoor = true;
      }
      if (state.activeParent && state.activeParent.char.group.position.z > 8.5 && state.activeParent.char.group.position.z < 16.0) {
        someoneAtDoor = true;
      }
      for (const ls of leavingShoppers) {
        if (ls.char.group.position.z > 8.5 && ls.char.group.position.z < 16.0) {
          someoneAtDoor = true;
          break;
        }
      }
    }
    if (someoneAtDoor && !state.doorsWereOpen) {
      audio.playDoorSlide();
    }
    state.doorsWereOpen = someoneAtDoor;

    const targetOpen = someoneAtDoor ? 1.65 : 0;
    state.doorOpenAmount = THREE.MathUtils.lerp(state.doorOpenAmount, targetOpen, Math.min(1, dt * 4.5));
    env.leftDoor.position.x = -0.98 - state.doorOpenAmount;
    env.rightDoor.position.x = 0.98 + state.doorOpenAmount;

    // 11:46 AM Door Lock Glow & Addy's Meshy Keys Animation
    const lockReady = state.phase === 'lock_up_ready';
    env.lockRingMat.opacity = lockReady ? (0.45 + 0.4 * Math.sin(elapsed * 7)) : 0;
    env.exitPadMat.opacity = lockReady ? (0.4 + 0.35 * Math.sin(elapsed * 5.5)) : 0;
    lockGlowLight.intensity = lockReady ? (1.8 + 0.8 * Math.sin(elapsed * 6)) : 0;
    if (state.holdingKeys && storeKeysMesh.visible) {
      storeKeysMesh.rotation.z = Math.sin(elapsed * 4.2) * 0.14;
      storeKeysMesh.rotation.y = Math.sin(elapsed * 2.5) * 0.25;
    }
    if (state.doorsLocked) {
      env.lockCylinder.rotation.z = THREE.MathUtils.lerp(env.lockCylinder.rotation.z, Math.PI / 2, dt * 8);
    }

    // 2. Cart Items Float & Held Meshy Item Squish / Click Animation
    for (const entry of state.cartEntries) {
      entry.bobPhase += dt * 2.5;
      entry.mesh.position.y = entry.homePos.y + Math.sin(entry.bobPhase) * 0.018;
      entry.mesh.rotation.y = Math.sin(entry.bobPhase * 0.5) * 0.16;
    }

    if (state.heldItem) {
      const h = state.heldItem;
      if (h.squishTime > 0) {
        h.squishTime = Math.max(0, h.squishTime - dt);
        const s = Math.sin(h.squishTime * 28) * (h.squishTime * 0.45);
        h.mesh.scale.set(1 + s, Math.max(0.65, 1 - s * 1.15), 1 + s);
      } else {
        h.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 12));
      }
      if (h.clickTime > 0) {
        h.clickTime = Math.max(0, h.clickTime - dt);
        const dip = Math.sin((h.clickTime * Math.PI) / 0.3) * 0.14;
        h.mesh.scale.y = Math.max(0.75, 1 - dip);
      }
      h.mesh.rotation.y = Math.sin(elapsed * 2.0) * 0.12;
    }

    // 3. 10-Aisle Shelf Slots Pulse when Holding Matching Item!
    for (const slot of allShelfSlots) {
      if (slot.occupied && slot.itemMesh) {
        slot.pad.material.opacity = 0.08;
        slot.dot.material.opacity = 0.03;
        if (slot.itemMesh.userData.landingPop > 0) {
          slot.itemMesh.userData.landingPop = Math.max(0, slot.itemMesh.userData.landingPop - dt);
          slot.itemMesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 14));
        }
      } else {
        const match = state.heldItem && state.heldItem.itemType === slot.itemType;
        slot.pad.material.opacity = match ? (0.68 + 0.32 * Math.sin(elapsed * 8)) : 0.32;
        slot.dot.material.opacity = match ? 0.45 : 0.12;
        slot.pad.scale.setScalar(match ? (1.08 + 0.1 * Math.sin(elapsed * 8)) : 1.0);
      }
    }

    // 4. Checkout Aisle Belt, Laser Scanner Flash, Meshy Shoppers & Bagging Animation!
    if (state.hasEnteredStore && !state.doorsLocked) {
      state.nextShopperSpawnTimer -= dt;
      if (state.nextShopperSpawnTimer <= 0 && state.checkoutShoppers.length < 3) {
        spawnCheckoutShopper();
        state.nextShopperSpawnTimer = 5.5;
      }
    }

    if (state.beltItems.length > 0) {
      checkout.beltTex.offset.y -= dt * 0.55;
      for (const b of state.beltItems) {
        b.mesh.position.z = THREE.MathUtils.lerp(b.mesh.position.z, b.targetZ, Math.min(1, dt * 3.5));
      }
    }

    if (state.laserFlashTimer > 0) {
      state.laserFlashTimer = Math.max(0, state.laserFlashTimer - dt);
      checkout.laserBeamMat.opacity = (state.laserFlashTimer / 0.28) * 0.78;
      checkout.laserGlassMat.emissiveIntensity = 2.8;
    } else {
      checkout.laserBeamMat.opacity = 0;
      checkout.laserGlassMat.emissiveIntensity = 0.85;
    }

    if (state.cashDrawerTimer > 0) {
      state.cashDrawerTimer = Math.max(0, state.cashDrawerTimer - dt);
      checkout.cashDrawer.position.x = THREE.MathUtils.lerp(checkout.cashDrawer.position.x, 0.72, dt * 14);
    } else {
      checkout.cashDrawer.position.x = THREE.MathUtils.lerp(checkout.cashDrawer.position.x, 0.38, dt * 10);
    }

    checkout.laneBoxMat.emissiveIntensity = state.beltItems.length > 0 ? (0.65 + 0.45 * Math.sin(elapsed * 6)) : 0.25;
    checkout.clerkRingMat.opacity = state.beltItems.length > 0 ? (0.45 + 0.35 * Math.sin(elapsed * 6)) : 0.18;

    for (let i = state.scanningAnims.length - 1; i >= 0; i--) {
      const anim = state.scanningAnims[i];
      anim.progress += dt * 3.2;
      if (anim.progress >= 1) {
        pool.despawnItem(anim.mesh);
        state.scanningAnims.splice(i, 1);
      } else {
        const t = anim.progress;
        anim.mesh.position.lerpVectors(anim.startPos, checkout.bagLocal, t);
        anim.mesh.position.y += Math.sin(t * Math.PI) * 0.38;
        anim.mesh.rotation.y += dt * 8;
        anim.mesh.scale.setScalar(1 - t * 0.45);
      }
    }

    for (const shopper of state.checkoutShoppers) {
      const targetPos = QUEUE_POSITIONS[Math.min(shopper.queueIndex, QUEUE_POSITIONS.length - 1)];
      const pos = shopper.char.group.position;
      const toT = tempVec.copy(targetPos).sub(pos);
      toT.y = 0;
      const d = toT.length();
      if (d > 0.15) {
        toT.normalize();
        pos.addScaledVector(toT, Math.min(d, 2.5 * dt));
        shopper.char.group.lookAt(targetPos.x, 0, targetPos.z);
        shopper.walkPhase += dt * 9;
        animateMeshyCharacterWalk(shopper.char, shopper.walkPhase, 1.0);
      } else {
        shopper.char.group.lookAt(checkout.group.position.x, 0, checkout.group.position.z);
        animateMeshyCharacterIdle(shopper.char);
        if (shopper.queueIndex === 0) {
          shopper.state = 'at_counter';
          if (!shopper.beltLoaded) loadShopperItemsOntoBelt(shopper);
        }
      }
    }

    for (let i = leavingShoppers.length - 1; i >= 0; i--) {
      const ls = leavingShoppers[i];
      const pos = ls.char.group.position;
      const waypoint = pos.z < 11.2 ? tempVec.set(0.3, 0, 11.8) : tempVec.set(0.3, 0, 18.5);
      const dir = tempVec2.copy(waypoint).sub(pos);
      dir.y = 0;
      if (pos.z > 17.5) {
        pool.despawnShopper(ls.char);
        leavingShoppers.splice(i, 1);
      } else {
        dir.normalize();
        pos.addScaledVector(dir, 2.9 * dt);
        ls.char.group.lookAt(waypoint.x, 0, waypoint.z);
        ls.walkPhase += dt * 9.5;
        animateMeshyCharacterWalk(ls.char, ls.walkPhase, 1.1);
      }
    }

    // 5. PA Microphone Beacon & Expanding Sound Wave Rings!
    const kidWaitingForMic = Boolean(state.activeLostKid && !state.activeLostKid.paged);
    if (kidWaitingForMic || state.micActiveTimer > 0 || state.announcementPlaying) {
      const p = 0.5 + 0.5 * Math.sin(elapsed * 9);
      paMic.beaconMat.emissiveIntensity = 0.85 + p * 1.6;
      paMic.beaconLight.intensity = 1.4 + p * 2.2;
    } else {
      paMic.beaconMat.emissiveIntensity = 0.3;
      paMic.beaconLight.intensity = 0.35;
    }

    if (state.micActiveTimer > 0 || state.announcementPlaying) {
      if (state.micActiveTimer > 0) state.micActiveTimer = Math.max(0, state.micActiveTimer - dt);
      paMic.soundRings.forEach((ring, idx) => {
        const ph = (elapsed * 1.7 + idx * 0.33) % 1;
        ring.scale.setScalar(0.5 + ph * 2.6);
        ring.material.opacity = (1 - ph) * 0.85;
      });
    } else {
      paMic.soundRings.forEach((ring) => { ring.material.opacity = 0; });
    }

    // 6. Lost Kid & Parent Reunion -> $100,000.00 Tip + Free Food!
    if (state.activeLostKid) {
      const kid = state.activeLostKid;
      const kPos = kid.char.group.position;
      kid.walkTimer += dt;

      if (kid.following && !kid.reunited) {
        const toP = tempVec.copy(playerRig.position).sub(kPos);
        toP.y = 0;
        const d = toP.length();
        if (d > 1.75) {
          toP.normalize();
          kPos.addScaledVector(toP, Math.min(d - 1.6, 3.1 * dt));
          kid.char.group.lookAt(playerRig.position.x, 0, playerRig.position.z);
          animateMeshyCharacterWalk(kid.char, kid.walkTimer * 10, 1.15);
        } else {
          animateMeshyCharacterIdle(kid.char);
        }
      } else if (!kid.reunited) {
        kid.char.group.lookAt(playerRig.position.x, 0, playerRig.position.z);
        kPos.y = Math.abs(Math.sin(elapsed * 4.8)) * 0.12;
        if (kid.char.modelRoot) {
          kid.char.modelRoot.rotation.z = Math.sin(elapsed * 7.5) * 0.1;
        }
      }
    }

    if (state.activeParent && state.activeLostKid) {
      const parent = state.activeParent;
      const kid = state.activeLostKid;
      const pPos = parent.char.group.position;
      const kPos = kid.char.group.position;

      if (parent.state === 'approaching') {
        const toK = tempVec.copy(kPos).sub(pPos);
        toK.y = 0;
        const d = toK.length();
        if (d > 1.05) {
          toK.normalize();
          pPos.addScaledVector(toK, 4.1 * dt);
          parent.char.group.lookAt(kPos.x, 0, kPos.z);
          animateMeshyCharacterWalk(parent.char, elapsed * 11, 1.25);
        } else {
          parent.state = 'rewarding';
          parent.hugTimer = 2.0;
          kid.reunited = true;
          animateMeshyCharacterIdle(parent.char);

          state.kidsReunited++;
          state.tipsEarned += 100000;
          state.freeFoodGiven++;
          updateHudCounters(true);

          audio.playBigTipAndFreeFood(kid.name);
          vibrateGamepad(200, 0.45, 0.85);
          showPaBanner(`+$100,000.00 Tip from ${kid.name}'s Parent! Addy gave them Free Food!`, 5.8);

          if (parent.tipMesh) {
            const tipWorld = new THREE.Vector3();
            parent.tipMesh.getWorldPosition(tipWorld);
            scene.add(parent.tipMesh);
            parent.tipMesh.position.copy(tipWorld);
            state.flyingTipAnim = {
              mesh: parent.tipMesh,
              startPos: tipWorld.clone(),
              progress: 0
            };
            parent.tipMesh = null;
          }

          parent.foodMesh = pool.freeFoodPool.spawn(new THREE.Vector3(0, 0.04, 0.06), parent.char.handAnchor);
          spawnSparkleBurst(kPos.clone().add(new THREE.Vector3(0, 1.4, 0)), [0x22c55e, 0xffd700, 0xffc220, 0x38bdf8, 0xf472b6], 34);
          advanceShiftProgress(45);
        }
      } else if (parent.state === 'rewarding') {
        parent.hugTimer -= dt;
        kid.char.group.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.18;
        if (parent.hugTimer <= 0) {
          kid.char.group.position.y = 0;
          parent.state = 'leaving';
        }
      } else if (parent.state === 'leaving') {
        const target = pPos.z < 11.2 ? tempVec.set(-0.2, 0, 11.8) : tempVec.set(-0.2, 0, 18.8);
        const dir = tempVec2.copy(target).sub(pPos);
        dir.y = 0;
        if (pPos.z > 17.8) {
          pool.despawnParent(parent.char);
          pool.despawnLostKid(kid.char);
          state.activeParent = null;
          state.activeLostKid = null;
        } else {
          dir.normalize();
          pPos.addScaledVector(dir, 3.2 * dt);
          kPos.copy(pPos).add(new THREE.Vector3(-0.7, 0, 0.2));
          parent.char.group.lookAt(target.x, 0, target.z);
          kid.char.group.lookAt(target.x, 0, target.z);
          animateMeshyCharacterWalk(parent.char, elapsed * 9, 1.0);
          animateMeshyCharacterWalk(kid.char, elapsed * 11, 1.1);
        }
      }
    }

    if (state.flyingTipAnim) {
      const f = state.flyingTipAnim;
      f.progress += dt * 1.15;
      if (f.progress >= 1) {
        pool.tipBundlePool.despawn(f.mesh);
        state.flyingTipAnim = null;
      } else {
        const dest = playerRig.position.clone().add(new THREE.Vector3(0, 1.35, 0));
        f.mesh.position.lerpVectors(f.startPos, dest, f.progress);
        f.mesh.position.y += Math.sin(f.progress * Math.PI) * 1.1;
        f.mesh.rotation.y += dt * 7;
      }
    }

    // 7. 11:00 PM Breakroom Glow & Bobbing Meshy Lunch Food!
    const isLunch = state.phase === 'lunch';
    lunchSpotLight.intensity = THREE.MathUtils.lerp(lunchSpotLight.intensity, isLunch ? 2.6 : 0.4, dt * 3);
    breakroom.lunchRingMat.opacity = isLunch ? (0.48 + 0.38 * Math.sin(elapsed * 5.5)) : 0.1;
    breakroom.foodItems.forEach((food, idx) => {
      if (food.visible && isLunch) food.rotation.y = elapsed * 0.9 + idx;
    });

    // 8. PA Banner auto-hide
    if (state.paBannerTimer > 0) {
      state.paBannerTimer -= dt;
      if (state.paBannerTimer <= 0 && paBannerEl) paBannerEl.hidden = true;
    }

    // 9. Update Pooled Sparkle / Cash Particles
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        pool.despawnParticle(p.mesh);
        activeParticles.splice(i, 1);
      } else {
        p.vel.y -= 5.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += 5 * dt;
        p.mesh.rotation.y += 6 * dt;
        p.mesh.material.opacity = Math.min(1, p.life / p.maxLife);
      }
    }

    // 10. Subtle Reticle Glow
    if (reticleEl && !state.isInXR) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hitList = raycaster.intersectObjects(scene.children, true);
      let isTarget = false;
      for (const h of hitList) {
        if (h.distance > 5.8) break;
        if (findOwnerInteractable(h.object)) {
          isTarget = true;
          break;
        }
      }
      reticleEl.classList.toggle('is-active', isTarget);
      if (touchBtnInteract) touchBtnInteract.classList.toggle('is-ready', isTarget);
    }
    if (touchBtnSquish) {
      touchBtnSquish.hidden = !state.heldItem;
    }
  }

  // Expose runtime inspection hook for automated verification
  if (typeof window !== 'undefined') {
    window.__addy2WalmartDebug = {
      state,
      pool,
      playerRig,
      camera,
      setLook: (yaw, pitch = -0.08) => { lookYaw = yaw; lookPitch = pitch; },
      spawnLostKid,
      spawnCheckoutShopper,
      usePaMicrophone,
      meshyPreloadResult,
      meshyStatus: getMeshyAssetStatus(),
      aisleCount: aisleBays.length,
      shelfSlotCount: allShelfSlots.length
    };
  }

  // Dismiss Meshy asset loader cleanly
  if (loaderBarEl) loaderBarEl.style.width = '100%';
  if (loaderStatusEl) loaderStatusEl.textContent = 'Ready!';
  if (loaderEl) {
    loaderEl.classList.add('is-done');
    setTimeout(() => { loaderEl.hidden = true; }, 450);
  }

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - prevTime) / 1000);
    prevTime = now;
    const elapsed = now * 0.001;

    updateGamepadAndMovement(dt);
    updateShiftTimeline(dt);
    updateSkyAndLighting(dt);
    updateWorldAnimations(dt, elapsed);

    renderer.render(scene, camera);
  });
})();
