/**
 * Wormhole XR - Stage 1: Warp Origin [Mobile Profile]
 * Calibrated for Mobile Smartphones & Tablets (Dual Touch Joysticks, Gyroscope, Mobile Shaders)
 * Database Stage Level: 1 | Environment: Warp Cyan Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 1,
  stage_name: 'Warp Origin',
  stage_slug: 'warp_origin',
  environment_theme: 'Warp Cyan Corridor',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert',
  end_level_event: 'Warp Horizon Jump Gate Initialized',
  description: 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.',
  par_score: 5000,

  visual: {
    themeName: 'Warp Cyan Corridor',
    primaryColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    panelBg: 'rgba(2, 14, 26, 0.90)',
    panelBorder: 'rgba(0, 240, 255, 0.35)',
    uniforms: {
      uColorEdge: 0x003366,
      uColorCore: 0x00f0ff,
      uColorHot: 0xd6ffff,
      uHaloColor: 0x00f0ff
    },
    lights: {
      ambient: 0x002233,
      center: 0x00f0ff
    },
    particles: {
      count: 2200,
      starCount: 1200,
      dustCount: 300,
      speed: 0.85
    },
    flight: {
      speed: 42.0,
      boostMultiplier: 2.1,
      pitchSpeed: 0.0020,
      yawSpeed: 0.0020
    }
  },

  weapons: {
    initial: {
      id: 'red_laser',
      name: 'Neon Red Laser',
      icon: '🔴',
      color: '#ff0033',
      damage: 2,
      bullet_speed: 550,
      energy_drain_pct: 10.0,
      can_overheat: 1,
      cooldown_seconds: 5.0,
      description: 'Standard directed neon plasma pulse. Mobile auto-assist targeting.'
    },
    acquirable: [
      {
        id: 'blue_laser',
        name: 'Cobalt Blue Laser',
        icon: '🔵',
        color: '#0088ff',
        damage: 1,
        bullet_speed: 700,
        energy_drain_pct: 30.0,
        can_overheat: 1,
        cooldown_seconds: 10.0,
        acquire_event: 'default_start'
      }
    ]
  },

  enemies: [
    {
      id: 'void_recon_drone',
      name: 'Void Recon Drone',
      enemy_class: 'Scout Drone',
      icon: '🛸',
      color: '#00f0ff',
      hits: 2,
      armor: 10,
      shield: 0,
      speed: 300,
      attack_damage: 5,
      fire_rate: 2.50,
      score: 100,
      threat: 'Low',
      piercing: 'any'
    },
    {
      id: 'phase_interceptor',
      name: 'Phase Interceptor',
      enemy_class: 'Fast Interceptor',
      icon: '🚀',
      color: '#38bdf8',
      hits: 4,
      armor: 25,
      shield: 2,
      speed: 400,
      attack_damage: 10,
      fire_rate: 1.80,
      score: 250,
      threat: 'Medium',
      piercing: 'red_laser'
    }
  ],

  controls: {
    inputMode: 'touch_dual_stick',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: true,
    allowScreenSwipe: false,
    enableSwipeLook: false,
    preventScreenScroll: true,
    description: 'Flight executed ONLY via thumb controllers, 180, 360, and fwd/rev slider. Screen swipe flight disabled.'
  }
};

/**
 * Ensures swiping across the screen with a finger does not execute flight.
 * Flight is strictly restricted to thumb controllers (touchStickZone), 180 (touchBtnSpin180),
 * 360 (touchBtnSpin360), and Fwd/Rev slider (throttleSlider). All custom controls remain active.
 */
function setupScreenSwipeLock(engineApi) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Inject CSS touch-action and overscroll prevention
  let styleEl = document.getElementById('stage1-warp-origin-touch-lock');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'stage1-warp-origin-touch-lock';
    styleEl.textContent = `
      html, body, #webgl-container, #webgl-container canvas {
        touch-action: none !important;
        overscroll-behavior: none !important;
        -webkit-overflow-scrolling: auto !important;
        overflow: hidden !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // 2. Prevent duplicate handler registrations
  if (window.__stage1WarpOriginSwipeLockInstalled) return;
  window.__stage1WarpOriginSwipeLockInstalled = true;

  // Checks if a touch event landed on an interactive thumb/custom control
  const isInteractiveControl = (target) => {
    if (!target || !target.closest) return false;
    return Boolean(target.closest(
      '#aim-stick-zone, #touch-stick-zone, .virtual-stick-zone, .virtual-stick-knob, ' +
      '#touch-btn-spin-180, #touch-btn-spin-360, #touch-btn-warp, .mobile-touch-actions, .touch-btn, ' +
      '#throttle-slider-container, #custom-throttle-slider, #throttle-slider-wrapper, ' +
      '#btn-throttle-rev, #btn-throttle-fwd, #btn-throttle-stop, .throttle-label-dir, .btn-throttle-stop, ' +
      '.drawer-content, .hud-drawer, #left-drawer-tab, #mission-panel, .drawer-tab-handle, ' +
      '.hud-header, .hud-footer, .hud-header *, .hud-footer *, ' +
      '.hud-select, .hud-action-pill, .hud-weapon-pill, ' +
      'button, input, select, a, textarea'
    ));
  };

  // Intercept and stop screen swipes from triggering flight or viewport scroll
  const blockScreenSwipe = (e) => {
    if (!isInteractiveControl(e.target)) {
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  // Register capture-phase listeners on all target layers
  const container = document.getElementById('webgl-container');
  const canvas = (engineApi && engineApi.renderer && engineApi.renderer.domElement) ||
                 (container ? container.querySelector('canvas') : null) ||
                 document.querySelector('canvas');
  const hudLayer = document.getElementById('hud-layer');

  const elementsToHook = [window, document];
  if (container) elementsToHook.push(container);
  if (canvas) elementsToHook.push(canvas);
  if (hudLayer) elementsToHook.push(hudLayer);

  elementsToHook.forEach((elem) => {
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((evt) => {
      elem.addEventListener(evt, blockScreenSwipe, { capture: true, passive: false });
    });
  });

  // Disallow gesture zooming or navigation swipes
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
    window.addEventListener(evt, (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 1: Warp Origin] Applying Mobile profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN [MOBILE TOUCH]');
  }
  if (typeof engineApi.setFlightConfig === 'function') {
    engineApi.setFlightConfig(stageConfig.visual.flight);
  }
  if (typeof engineApi.setWeapons === 'function') {
    engineApi.setWeapons(stageConfig.weapons);
  }
  if (typeof engineApi.setEnemies === 'function') {
    engineApi.setEnemies(stageConfig.enemies);
  }
  if (typeof engineApi.setDeviceControls === 'function') {
    engineApi.setDeviceControls(stageConfig.controls);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('📱 STAGE 1: WARP ORIGIN [MOBILE] LOADED');
  }

  // Ensure flight only executes via thumb controllers, 180, 360, and throttle slider
  setupScreenSwipeLock(engineApi);

  return stageConfig;
}

export default { stageConfig, applyStage };
