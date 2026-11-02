/**
 * Wormhole XR - Stage 1: Warp Origin [Mobile Profile] (stage_1_warp_origin_mobile.js)
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
    description: 'Flight executed ONLY via thumb controllers, 180, 360, and fwd/rev slider. Screen swipe flight disabled; all sliding panels, tabbed panels, and custom controls active.'
  }
};

/**
 * Ensures all tabbed panels (Weapons, Info, Missions) remain fully enabled,
 * clickable, touchable, and scrollable on mobile devices.
 */
function enableTabbedPanels() {
  if (typeof document === 'undefined') return;

  const tabDefs = [
    { id: 'weapons', btnId: 'tab-btn-weapons', paneId: 'tab-pane-weapons' },
    { id: 'info', btnId: 'tab-btn-info', paneId: 'tab-pane-info' },
    { id: 'missions', btnId: 'tab-btn-missions', paneId: 'tab-pane-missions' }
  ];

  tabDefs.forEach((tab) => {
    const btn = document.getElementById(tab.btnId);
    const pane = document.getElementById(tab.paneId);

    if (btn) {
      btn.disabled = false;
      btn.removeAttribute('disabled');
      btn.style.pointerEvents = 'auto';
      btn.style.cursor = 'pointer';

      if (!btn.__stage1TabBound) {
        btn.__stage1TabBound = true;
        let lastTabSwitchTime = 0;

        const handleTabSwitch = (e) => {
          const now = Date.now();
          if (now - lastTabSwitchTime < 250) {
            if (e && e.cancelable) e.preventDefault();
            if (e) e.stopPropagation();
            return;
          }
          lastTabSwitchTime = now;

          if (e) {
            e.stopPropagation();
            if (e.type === 'touchend' && e.cancelable) e.preventDefault();
          }

          if (typeof window.setCockpitTab === 'function') {
            window.setCockpitTab(tab.id);
          } else {
            tabDefs.forEach((other) => {
              const isSelected = (other.id === tab.id);
              const otherBtn = document.getElementById(other.btnId);
              const otherPane = document.getElementById(other.paneId);
              if (otherBtn) {
                otherBtn.classList.toggle('active', isSelected);
                otherBtn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
              }
              if (otherPane) {
                otherPane.classList.toggle('active', isSelected);
              }
            });
          }
        };

        btn.addEventListener('click', handleTabSwitch);
        btn.addEventListener('touchend', handleTabSwitch);
      }
    }

    if (pane) {
      pane.style.pointerEvents = 'auto';
      pane.style.display = '';
      pane.querySelectorAll('button, input, select, .wpn-select-btn, .btn-action').forEach((el) => {
        el.disabled = false;
        el.removeAttribute('disabled');
        el.style.pointerEvents = 'auto';
      });
    }
  });

  const missionPanel = document.getElementById('mission-panel');
  if (missionPanel) {
    missionPanel.style.pointerEvents = 'auto';
    missionPanel.style.touchAction = 'pan-y';
    missionPanel.style.overflowY = 'auto';
    missionPanel.style.webkitOverflowScrolling = 'touch';
  }

  const leftDrawerContainer = document.getElementById('left-drawer-container');
  if (leftDrawerContainer) {
    leftDrawerContainer.style.pointerEvents = 'auto';
  }
}

/**
 * Ensures drawer handles on mobile touch devices slide smoothly on tap or touch,
 * expanding reliably without flashing or double-toggling.
 */
function setupDrawerSliding() {
  if (typeof document === 'undefined') return;

  const handleIds = [
    'drawer-tab',
    'top-drawer-tab',
    'bottom-drawer-tab',
    'btn-toggle-drawer',
    'btn-toggle-header'
  ];

  handleIds.forEach((id) => {
    const handle = document.getElementById(id);
    if (!handle || handle.__stage1TouchSlideBound) return;
    handle.__stage1TouchSlideBound = true;

    handle.style.pointerEvents = 'auto';
    handle.style.cursor = 'pointer';

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    // Track touch start coordinates and isolate from background canvas
    handle.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: false });

    // Touch tap handler: detect clean tap, toggle panel once, and prevent duplicate clicks
    handle.addEventListener('touchend', (e) => {
      e.stopPropagation();
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);
      const dt = Date.now() - touchStartTime;

      // Deliberate tap threshold (not a scroll or drag)
      if (dx < 20 && dy < 20 && dt < 600) {
        if (e.cancelable) e.preventDefault();

        const now = Date.now();
        if (now - (handle.__lastToggleTime || 0) < 350) {
          return; // Debounce rapid spamming
        }
        handle.__lastToggleTime = now;
        handle.__syntheticTouchClick = true;

        // Programmatically trigger the panel toggle
        handle.click();
      }
    });

    // Capture phase click listener: deduplicate synthetic vs native browser clicks
    handle.addEventListener('click', (e) => {
      if (handle.__syntheticTouchClick) {
        // Our programmatic click from touchend: permit it to bubble to wormhole0.js!
        handle.__syntheticTouchClick = false;
        handle.__suppressNextClickUntil = Date.now() + 450;
        return;
      }

      // If the browser generates its own native simulated click following touchend, drop it!
      if (Date.now() < (handle.__suppressNextClickUntil || 0)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      // Genuine desktop mouse click or non-touch event
      const now = Date.now();
      if (now - (handle.__lastToggleTime || 0) < 350) {
        // Debounce rapid double-clicks
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }
      handle.__lastToggleTime = now;
    }, { capture: true });
  });
}

/**
 * Ensures swiping across the background 3D canvas with a finger does not execute flight.
 * Blocks touches directly on #webgl-container and its canvas, leaving all
 * sliding drawer panels, tabbed panels, thumb controllers, 180/360 spin buttons,
 * and throttle sliders 100% active.
 */
function setupScreenSwipeLock(engineApi) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Inject styling: lock canvas touch-action, keep panels sliding, and ensure high z-index
  let styleEl = document.getElementById('stage1-warp-origin-touch-lock');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'stage1-warp-origin-touch-lock';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    #webgl-container, #webgl-container canvas {
      touch-action: none !important;
      overscroll-behavior: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    /* Ensure all 3 drawers are always visible, rendered, and able to slide in all orientations */
    body:not(.portrait-dismissed) #left-drawer-container,
    body:not(.portrait-dismissed) #top-drawer-container,
    body:not(.portrait-dismissed) #bottom-drawer-container,
    #left-drawer-container, #top-drawer-container, #bottom-drawer-container {
      display: flex !important;
      z-index: 120 !important;
    }
    #left-drawer-container {
      pointer-events: auto !important;
    }
    #left-drawer-container.open {
      transform: translateX(0) !important;
    }
    #top-drawer-container.open {
      transform: translateX(-50%) translateY(0) !important;
    }
    #bottom-drawer-container.open {
      transform: translateX(-50%) translateY(0) !important;
    }
    #drawer-tab, #top-drawer-tab, #bottom-drawer-tab {
      pointer-events: auto !important;
      cursor: pointer !important;
      z-index: 125 !important;
      touch-action: manipulation !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    #drawer-tab *, #top-drawer-tab *, #bottom-drawer-tab * {
      pointer-events: none !important;
    }
    #top-drawer-container.open,
    #bottom-drawer-container.open,
    #top-drawer-container.open .hud-header,
    #bottom-drawer-container.open .hud-footer {
      pointer-events: auto !important;
    }
    /* Full-screen wrapper must not block handle taps */
    #mobile-touch-controls {
      pointer-events: none !important;
    }
    /* Explicitly keep all virtual thumb controls, slider, and buttons fully interactive */
    #mobile-touch-controls .virtual-stick-zone,
    #mobile-touch-controls .throttle-slider-container,
    #mobile-touch-controls .touch-btn,
    #mobile-touch-controls #aim-stick-zone,
    #mobile-touch-controls #touch-stick-zone,
    #mobile-touch-controls #custom-throttle-slider,
    #mobile-touch-controls #touch-btn-spin-180,
    #mobile-touch-controls #touch-btn-spin-360,
    #mobile-touch-controls #touch-btn-warp {
      pointer-events: auto !important;
    }
    .drawer-content, .drawer-tab-pane {
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch !important;
      overflow-y: auto !important;
    }
    #left-drawer-container, .drawer-content, .drawer-tabs-bar, .drawer-tab-btn, .drawer-tab-pane {
      pointer-events: auto !important;
    }
  `;

  // 2. Prevent duplicate handler registrations
  if (window.__stage1WarpOriginSwipeLockInstalled) {
    enableTabbedPanels();
    setupDrawerSliding();
    return;
  }
  window.__stage1WarpOriginSwipeLockInstalled = true;

  // Intercept touches that land DIRECTLY on the background 3D container or canvas
  const container = document.getElementById('webgl-container');
  const canvas = (engineApi && engineApi.renderer && engineApi.renderer.domElement) ||
                 (container ? container.querySelector('canvas') : null) ||
                 document.querySelector('canvas');

  const blockCanvasOnly = (e) => {
    // Only intercept if the touch originated directly on the 3D canvas or background container
    if (e.target === container || e.target === canvas || (container && container.contains(e.target))) {
      e.stopImmediatePropagation();
      if (e.cancelable) e.preventDefault();
    }
  };

  if (container) {
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((evt) => {
      container.addEventListener(evt, blockCanvasOnly, { capture: true, passive: false });
    });
  }
  if (canvas) {
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((evt) => {
      canvas.addEventListener(evt, blockCanvasOnly, { capture: true, passive: false });
    });
  }

  // Ensure touchmove never drags the viewport if touching canvas
  window.addEventListener('touchmove', (e) => {
    if (e.target === container || e.target === canvas || (container && container.contains(e.target))) {
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, { capture: true, passive: false });

  // 3. Enable all tabbed panels and sliding drawers
  enableTabbedPanels();
  setupDrawerSliding();

  // Re-enable tabs whenever left drawer is toggled
  const drawerTab = document.getElementById('drawer-tab');
  if (drawerTab) {
    drawerTab.addEventListener('click', () => setTimeout(enableTabbedPanels, 50));
  }
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

  // Ensure background canvas swipe flight is blocked while sliding drawers and tabs remain active
  setupScreenSwipeLock(engineApi);

  return stageConfig;
}

export default { stageConfig, applyStage };
