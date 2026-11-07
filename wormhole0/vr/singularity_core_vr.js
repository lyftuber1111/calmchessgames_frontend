/**
 * Wormhole XR - Stage 3: Singularity Core [VR Headset & Immersive Web Emulator Profile]
 * Calibrated for WebXR Immersive-VR & Desktop Immersive Web Emulator
 * Configures VR Graphics, Spatial Aspect, Perspective (65° FOV / CameraRig @ 220), and Cockpit HUD
 * Database Stage Level: 3 | Environment: Singularity Violet Vortex
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 3,
  stage_name: 'Singularity Core',
  stage_slug: 'singularity_core',
  environment_theme: 'Singularity Violet Vortex',
  device: 'vr',
  xr_mode: 'desktop-vr',
  events_within_level: 'Spacetime Curvature Collapse, Tachyon Storm Front, Gravity Well Resonance, Core Harmonic Lock, Hawking Radiation Burst',
  end_level_event: 'Singularity Core Stabilized & Traversed',
  description: 'Deep inside the Einstein-Rosen bridge throat. Crushing gravitational gradients and tachyon turbulence.',
  par_score: 25000,

  
  mission_objectives: 'Eliminate 20 heavy void cruisers and penetrate within < 20,000 KM of gravitational core.',
  required_enemy_kills: 20,
  warp_target_distance: 20000,
  objectives: [
      {
          "id": "kills",
          "type": "kills",
          "target": 20,
          "title": "Eliminate 20 Void Cruisers",
          "description": "Destroy 20 heavily armored singularity combatants",
          "requiredForWarp": true
      },
      {
          "id": "distance",
          "type": "distance",
          "target": 20000,
          "title": "Gravitational Core Proximity < 20,000 KM",
          "description": "Penetrate deep gravity well to within < 20,000 KM",
          "requiredForWarp": true
      }
  ],
visual: {
    themeName: 'Singularity Violet Vortex',
    primaryColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.50)',
    panelBg: 'rgba(18, 5, 32, 0.88)',
    panelBorder: 'rgba(168, 85, 247, 0.45)',
    uniforms: {
      uColorEdge: 0x3b0764,
      uColorCore: 0xa855f7,
      uColorHot: 0xf3e8ff,
      uHaloColor: 0xc084fc
    },
    lights: {
      ambient: 0x1e0536,
      center: 0xa855f7
    },
    particles: {
      count: 9000,
      starCount: 12000,
      dustCount: 1800,
      speed: 1.65
    },
    flight: {
      speed: 65.0,
      boostMultiplier: 2.8,
      pitchSpeed: 0.0026,
      yawSpeed: 0.0026
    }
  },

  vrConfig: {
    graphics: {
      postProcessingEnabled: true,
      bloomStrength: 1.65,
      bloomRadius: 1.5,
      bloomThreshold: 0.35,
      lensingStrength: 1.4,
      chromaticAberration: 0.0035,
      toneMappingExposure: 1.2,
      starfieldSize: 2.0,
      starfieldOpacity: 0.95,
      coronaScale: 82.0,
      photonRingIntensity: 4.5,
      hideRawControllerMeshes: true
    },
    spatialAspect: {
      referenceSpaceType: 'local',
      standoffDistance: 220.0,
      compensateHmdHeightOffset: true,
      lockStarfieldToShipOrigin: true,
      autoMatchViewportAspect: true
    },
    perspective: {
      fov: 65,
      near: 0.1,
      far: 8000,
      syncXrCameraProjection: true,
      centerWormholeOnEntry: true
    },
    cockpit: {
      showHudOverlay: true,
      showLeftDrawer: true,
      showTopDrawer: true,
      showBottomDrawer: true,
      showDistanceBadge: true,
      showWeaponPills: true,
      showCrosshairAndAlignmentRing: true,
      showCornerReticles: true,
      emulatorToolbarOffsetTopPx: 42
    }
  },

  weapons: {
    initial: {
      id: 'tachyon_lance',
      name: 'Tachyon Pulse Lance',
      icon: '⚡',
      color: '#ffd166',
      damage: 3,
      bullet_speed: 950,
      energy_drain_pct: 20.0,
      can_overheat: 1,
      cooldown_seconds: 7.0,
      description: 'VR room-scale tachyon beam cannon.'
    },
    acquirable: [
      {
        id: 'singularity_cannon',
        name: 'Singularity Vortex Cannon',
        icon: '🟣',
        color: '#a855f7',
        damage: 5,
        bullet_speed: 620,
        energy_drain_pct: 35.0,
        can_overheat: 1,
        cooldown_seconds: 9.0,
        acquire_event: 'singularity_core_probe'
      }
    ]
  },

  enemies: [
      {
          "id": "singularity_probe",
          "name": "Singularity Void Probe",
          "enemy_class": "Probe Sentinel",
          "model_3d_type": "singularity_probe",
          "model_3d_url": "",
          "icon": "👁️",
          "color": "#c084fc",
          "hits": 6,
          "armor": 40,
          "shield": 3,
          "speed": 380,
          "attack_damage": 15,
          "weapon_name": "Graviton Beam",
          "weapon_damage": 12,
          "weapon_speed": 620,
          "weapon_color": "#c084fc",
          "fire_rate": 2,
          "score": 450,
          "threat": "High",
          "piercing": "plasma_torpedo"
      },
      {
          "id": "void_cruiser",
          "name": "Void Battlecruiser",
          "enemy_class": "Heavy Cruiser",
          "model_3d_type": "cruiser",
          "model_3d_url": "",
          "icon": "🛸",
          "color": "#a855f7",
          "hits": 12,
          "armor": 65,
          "shield": 6,
          "speed": 220,
          "attack_damage": 25,
          "weapon_name": "Antimatter Torpedo",
          "weapon_damage": 18,
          "weapon_speed": 640,
          "weapon_color": "#a855f7",
          "fire_rate": 2.8,
          "score": 750,
          "threat": "Extreme",
          "piercing": "plasma_torpedo"
      }
  ],

  controls: {
    inputMode: 'webxr_controllers',
    showVirtualJoysticks: false,
    enablePointerLock: true,
    vrRayLength: 7.0
  }
};

const vrControllerButtonState = {
  left: {},
  right: {}
};

export function configureVRGraphics(engineApi) {
  if (!engineApi) return;
  const g = stageConfig.vrConfig.graphics;

  if (engineApi.state) {
    engineApi.state.postProcessingEnabled = g.postProcessingEnabled !== false;
  }
  if (engineApi.CONFIG) {
    engineApi.CONFIG.bloomStrength = g.bloomStrength;
    engineApi.CONFIG.bloomRadius = g.bloomRadius;
    engineApi.CONFIG.bloomThreshold = g.bloomThreshold;
    engineApi.CONFIG.lensingStrength = g.lensingStrength;
    engineApi.CONFIG.chromaticAberration = g.chromaticAberration;
  }
  if (engineApi.compositeShader && engineApi.compositeShader.uniforms) {
    if (engineApi.compositeShader.uniforms.uBloomStrength) {
      engineApi.compositeShader.uniforms.uBloomStrength.value = g.bloomStrength;
    }
    if (engineApi.compositeShader.uniforms.uLensingStrength) {
      engineApi.compositeShader.uniforms.uLensingStrength.value = g.lensingStrength;
    }
    if (engineApi.compositeShader.uniforms.uChromaticAberration) {
      engineApi.compositeShader.uniforms.uChromaticAberration.value = g.chromaticAberration;
    }
  }
  if (engineApi.renderer) {
    engineApi.renderer.toneMappingExposure = g.toneMappingExposure || 1.2;
  }
  if (engineApi.photonRingUniforms && engineApi.photonRingUniforms.uIntensity) {
    engineApi.photonRingUniforms.uIntensity.value = g.photonRingIntensity || 4.5;
  }
  if (engineApi.starfield && engineApi.starfield.material) {
    engineApi.starfield.material.size = g.starfieldSize || 2.0;
    engineApi.starfield.material.opacity = g.starfieldOpacity || 0.95;
  }

  if (g.hideRawControllerMeshes) {
    if (Array.isArray(engineApi.controllers)) {
      engineApi.controllers.forEach(c => { if (c) c.visible = false; });
    }
    if (Array.isArray(engineApi.controllerGrips)) {
      engineApi.controllerGrips.forEach(cg => { if (cg) cg.visible = false; });
    }
    if (Array.isArray(engineApi.controllerLasers)) {
      engineApi.controllerLasers.forEach(cl => { if (cl) cl.visible = false; });
    }
  }
}

export function configureVRCockpit(engineApi) {
  if (typeof document === 'undefined') return;
  const c = stageConfig.vrConfig.cockpit;
  const topOffset = c.emulatorToolbarOffsetTopPx || 44;

  let styleEl = document.getElementById('wormhole-vr-cockpit-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'wormhole-vr-cockpit-style';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    body.in-xr-session div[data-webxr_runtime] {
      z-index: 5 !important;
    }
    body.in-xr-session canvas[data-webxr-visibility-mask],
    body.in-xr-session #mobile-touch-controls,
    body.in-xr-session #landscape-rotate-prompt,
    body.in-xr-session #wormhole-splash-screen {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    body.in-xr-session #hud-layer {
      display: ${c.showHudOverlay ? 'flex' : 'none'} !important;
      position: fixed !important;
      inset: 0 !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 10010 !important;
      pointer-events: none !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    body.in-xr-session #center-crosshair {
      display: ${c.showCrosshairAndAlignmentRing ? 'flex' : 'none'} !important;
      z-index: 10025 !important;
      visibility: visible !important;
      opacity: 0.92 !important;
      pointer-events: none !important;
    }
    body.in-xr-session #vector-alignment-ring {
      display: ${c.showCrosshairAndAlignmentRing ? 'block' : 'none'} !important;
      z-index: 10024 !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: none !important;
    }
    body.in-xr-session .hud-reticle {
      display: ${c.showCornerReticles ? 'block' : 'none'} !important;
      z-index: 10015 !important;
      visibility: visible !important;
      opacity: 0.65 !important;
      pointer-events: none !important;
    }
    body.in-xr-session #toast-msg {
      z-index: 10100 !important;
    }
    body.in-xr-session .hud-pause-icon-btn,
    body.in-xr-session .hud-quick-pause-btn {
      display: flex !important;
      position: fixed !important;
      top: 8px !important;
      left: 8px !important;
      z-index: 10060 !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    body.in-xr-session #left-drawer-container {
      display: ${c.showLeftDrawer ? 'flex' : 'none'} !important;
      position: fixed !important;
      top: ${topOffset}px !important;
      left: 0 !important;
      z-index: 10050 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    body.in-xr-session #laser-pct-badge-wrap,
    body.in-xr-session #hud-weapon-pill,
    body.in-xr-session #hud-weapon-cycle-badge {
      display: ${c.showWeaponPills !== false ? 'flex' : 'none'} !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    body.in-xr-session #top-drawer-container {
      display: ${c.showTopDrawer ? 'flex' : 'none'} !important;
      position: fixed !important;
      top: ${topOffset}px !important;
      left: 50% !important;
      z-index: 10055 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    body.in-xr-session #top-drawer-container:not(.open) .hud-header {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    body.in-xr-session #top-drawer-container.open .hud-header {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    body.in-xr-session #wormhole-dist-badge-wrap,
    body.in-xr-session #wormhole-distance-badge {
      display: ${c.showDistanceBadge ? 'inline-flex' : 'none'} !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    body.in-xr-session #bottom-drawer-container {
      display: ${c.showBottomDrawer ? 'flex' : 'none'} !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 50% !important;
      z-index: 10055 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    body.in-xr-session #bottom-drawer-container:not(.open) .hud-footer {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    body.in-xr-session #bottom-drawer-container.open .hud-footer {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    body.in-xr-session .weapon-wheel-overlay,
    body.in-xr-session #weapon-wheel-overlay {
      z-index: 10200 !important;
    }
    body.in-xr-session #unsupported-device-modal {
      z-index: 10300 !important;
    }
  `;

  if (engineApi && engineApi.state) {
    engineApi.state.hudVisible = true;
  }

  const xrRuntimeContainer = document.querySelector('div[data-webxr_runtime]');
  if (xrRuntimeContainer) {
    xrRuntimeContainer.style.zIndex = '5';
  }
  const maskCanvas = document.querySelector('canvas[data-webxr-visibility-mask]');
  if (maskCanvas) {
    maskCanvas.style.display = 'none';
  }

  const hudLayer = document.getElementById('hud-layer');
  if (hudLayer && c.showHudOverlay) {
    hudLayer.style.display = 'flex';
    hudLayer.style.zIndex = '10010';
  }
  const chEl = document.getElementById('center-crosshair');
  if (chEl && c.showCrosshairAndAlignmentRing) {
    chEl.style.display = 'flex';
    chEl.style.zIndex = '10025';
  }
  const vrEl = document.getElementById('vector-alignment-ring');
  if (vrEl && c.showCrosshairAndAlignmentRing) {
    vrEl.style.display = 'block';
    vrEl.style.zIndex = '10024';
  }
  if (engineApi && engineApi.weaponsSystem && typeof engineApi.weaponsSystem.updateCrosshairWeaponRing === 'function') {
    engineApi.weaponsSystem.updateCrosshairWeaponRing();
  }
}

function pollVRControllers(delta, engineApi) {
  if (!engineApi || !engineApi.renderer || !engineApi.renderer.xr) return;
  const session = engineApi.renderer.xr.getSession ? engineApi.renderer.xr.getSession() : null;
  if (!session || !session.inputSources) return;

  const state = engineApi.state;
  const CONFIG = engineApi.CONFIG;
  const deadzone = (CONFIG && CONFIG.gamepadDeadzone) || 0.15;

  for (const source of session.inputSources) {
    if (!source || !source.gamepad) continue;
    const gp = source.gamepad;
    const hand = source.handedness === 'left' ? 'left' : 'right';
    const prev = vrControllerButtonState[hand] || {};

    const triggerPressed = gp.buttons[0] ? (gp.buttons[0].pressed || gp.buttons[0].value > 0.4) : false;
    const gripPressed = gp.buttons[1] ? (gp.buttons[1].pressed || gp.buttons[1].value > 0.5) : false;
    const stickPressed = gp.buttons[3] ? gp.buttons[3].pressed : false;
    const btnAPressed = gp.buttons[4] ? gp.buttons[4].pressed : false;
    const btnBPressed = gp.buttons[5] ? gp.buttons[5].pressed : false;

    if (triggerPressed && !prev[0]) {
      if (typeof engineApi.fireLaserBeam === 'function') engineApi.fireLaserBeam();
    }
    if (gripPressed && !prev[1]) {
      if (engineApi.weaponsSystem && typeof engineApi.weaponsSystem.cycleWeapon === 'function') {
        engineApi.weaponsSystem.cycleWeapon();
      }
    }
    if (stickPressed && !prev[3]) {
      if (typeof engineApi.alignToWormhole === 'function') engineApi.alignToWormhole();
    }

    if (hand === 'right') {
      if (btnAPressed && !prev[4]) {
        if (typeof engineApi.fireLaserBeam === 'function') engineApi.fireLaserBeam();
      }
      if (btnBPressed) {
        if (typeof engineApi.fireLaserBeam === 'function') engineApi.fireLaserBeam();
      }
    } else {
      if (btnAPressed && !prev[4]) {
        if (state && state.scanProgress < 1.0 && !state.isScanning) {
          const scanBtn = document.getElementById('btn-do-scan');
          if (scanBtn) scanBtn.click();
        } else if (state && Array.isArray(state.coils)) {
          const idx = state.coils.findIndex(c => !c);
          if (idx !== -1) {
            const coilBtn = document.getElementById(`btn-coil-${idx + 1}`);
            if (coilBtn) coilBtn.click();
          }
        }
      }
      if (btnBPressed && !prev[5]) {
        if (typeof engineApi.triggerWarpJump === 'function') engineApi.triggerWarpJump();
      }
    }

    const rawX = gp.axes.length >= 4 ? gp.axes[2] : (gp.axes[0] || 0);
    const rawY = gp.axes.length >= 4 ? gp.axes[3] : (gp.axes[1] || 0);
    const ax = Math.abs(rawX) > deadzone ? rawX : 0;
    const ay = Math.abs(rawY) > deadzone ? rawY : 0;

    if (hand === 'left') {
      if (state) {
        if (ax !== 0 || ay !== 0) {
          state.aimMove.x = ax;
          state.aimMove.y = ay;
          state.aimActive = true;
          vrControllerButtonState.leftAimWasActive = true;
        } else if (vrControllerButtonState.leftAimWasActive) {
          state.aimActive = false;
          state.aimMove.x = 0;
          state.aimMove.y = 0;
          vrControllerButtonState.leftAimWasActive = false;
        }
      }
    } else if (hand === 'right' && state && CONFIG) {
      if (ax !== 0) {
        state.yaw -= ax * CONFIG.yawSpeed * 22.0 * (delta * 60);
      }
      if (ay !== 0 && engineApi.camera) {
        const fwd = engineApi.camera.getWorldDirection
          ? engineApi.camera.getWorldDirection(engineApi.xrBaseHmdPos.clone().set(0, 0, -1))
          : null;
        if (fwd) {
          state.velocity.addScaledVector(fwd, -ay * CONFIG.flightSpeed * delta * 3.5);
        }
      }
    }

    vrControllerButtonState[hand] = {
      0: triggerPressed,
      1: gripPressed,
      3: stickPressed,
      4: btnAPressed,
      5: btnBPressed
    };
  }
}

export function configureVRSpatialAspectAndPerspective(engineApi) {
  if (!engineApi) return;
  const sp = stageConfig.vrConfig.spatialAspect;
  const p = stageConfig.vrConfig.perspective;

  if (engineApi.renderer && engineApi.renderer.xr && !engineApi.renderer.xr.isPresenting) {
    if (typeof engineApi.renderer.xr.setReferenceSpaceType === 'function') {
      engineApi.renderer.xr.setReferenceSpaceType(sp.referenceSpaceType || 'local');
    }
  }

  if (engineApi.state && engineApi.state.position.length() < 15.0) {
    engineApi.state.position.set(0, 0, sp.standoffDistance || 220.0);
  }

  if (engineApi.camera) {
    engineApi.camera.fov = p.fov || 65;
    engineApi.camera.near = p.near || 0.1;
    engineApi.camera.far = p.far || 8000;
    engineApi.camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    engineApi.camera.updateProjectionMatrix();
  }

  if (engineApi.state && engineApi.state.isXR && engineApi.cameraRig) {
    engineApi.camera.position.set(0, 0, 0);
    engineApi.camera.rotation.set(0, 0, 0);
    engineApi.camera.quaternion.identity();
    engineApi.cameraRig.position.copy(engineApi.state.position);
    engineApi.cameraRig.rotation.order = 'YXZ';
    engineApi.cameraRig.rotation.y = engineApi.state.yaw;
    engineApi.cameraRig.rotation.x = engineApi.state.pitch;
    engineApi.cameraRig.updateMatrixWorld(true);
  }

  if (typeof engineApi.registerVrFrameHook === 'function') {
    engineApi.registerVrFrameHook((delta, api) => {
      if (!api || !api.state || !api.state.isXR) return;

      if (typeof document !== 'undefined') {
        const xrRuntimeDiv = document.querySelector('div[data-webxr_runtime]') ||
          (api.renderer && api.renderer.domElement && api.renderer.domElement.parentElement && api.renderer.domElement.parentElement.id !== 'webgl-container'
            ? api.renderer.domElement.parentElement
            : null);
        if (xrRuntimeDiv && xrRuntimeDiv !== document.body && xrRuntimeDiv.style.zIndex !== '5') {
          xrRuntimeDiv.style.zIndex = '5';
        }
        const maskCanvas = document.querySelector('canvas[data-webxr-visibility-mask]');
        if (maskCanvas && maskCanvas.style.display !== 'none') {
          maskCanvas.style.display = 'none';
        }
      }

      const xrMgr = api.renderer && api.renderer.xr;
      if (xrMgr && xrMgr.isPresenting && api.cameraRig) {
        const xrCam = xrMgr.getCamera ? xrMgr.getCamera() : null;
        const subCameras = (xrCam && Array.isArray(xrCam.cameras)) ? xrCam.cameras : [];

        if (sp.compensateHmdHeightOffset && subCameras.length > 0) {
          const cam0Pos = subCameras[0].position;
          if (!api.isXrBasePoseCaptured() && cam0Pos) {
            if (subCameras.length >= 2 && subCameras[1].position) {
              api.xrBaseHmdPos.copy(cam0Pos).add(subCameras[1].position).multiplyScalar(0.5);
            } else {
              api.xrBaseHmdPos.copy(cam0Pos);
            }
            api.setXrBasePoseCaptured(true);
          }
          if (api.isXrBasePoseCaptured()) {
            const worldOffset = api.xrBaseHmdPos.clone().applyQuaternion(api.cameraRig.quaternion);
            api.cameraRig.position.copy(api.state.position).sub(worldOffset);
            api.cameraRig.updateMatrixWorld(true);
          }
        }

        if (typeof xrMgr.updateCamera === 'function' && api.camera) {
          xrMgr.updateCamera(api.camera);
        }

        if (p.syncXrCameraProjection && xrCam) {
          const targetFov = api.state.isHyperWarping ? 110 : (p.fov || 65);
          const near = p.near || 0.1;
          const far = p.far || 8000;
          const fY = 1.0 / Math.tan((targetFov * Math.PI) / 360.0);
          const fallbackAspect = window.innerWidth / Math.max(1, window.innerHeight);

          for (let i = 0; i < subCameras.length; i++) {
            const subCam = subCameras[i];
            if (!subCam || !subCam.projectionMatrix) continue;
            subCam.matrixWorldAutoUpdate = false;
            const vp = subCam.viewport;
            const aspect = (vp && vp.width > 0 && vp.height > 0) ? (vp.width / vp.height) : fallbackAspect;
            const top = near / fY;
            const bottom = -top;
            const right = top * aspect;
            const left = -right;
            subCam.near = near;
            subCam.far = far;
            subCam.projectionMatrix.makePerspective(left, right, top, bottom, near, far);
            if (subCam.projectionMatrixInverse) {
              subCam.projectionMatrixInverse.copy(subCam.projectionMatrix).invert();
            }
          }

          if (subCameras.length > 0 && xrCam.projectionMatrix) {
            xrCam.projectionMatrix.copy(subCameras[0].projectionMatrix);
            if (xrCam.projectionMatrixInverse) {
              xrCam.projectionMatrixInverse.copy(xrCam.projectionMatrix).invert();
            }
            if (api.camera && api.camera.projectionMatrix) {
              api.camera.projectionMatrix.copy(subCameras[0].projectionMatrix);
              if (api.camera.projectionMatrixInverse) {
                api.camera.projectionMatrixInverse.copy(subCameras[0].projectionMatrixInverse);
              }
            }
          }
        }
      }

      pollVRControllers(delta, api);
    });
  }
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 3: Singularity Core] Applying VR Headset & Emulator profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 3: SINGULARITY CORE [VR HMD]');
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
  if (typeof engineApi.setStageObjectives === 'function') {
    engineApi.setStageObjectives(stageConfig.objectives || []);
  }
  if (typeof engineApi.setDeviceControls === 'function') {
    engineApi.setDeviceControls(stageConfig.controls);
  }

  configureVRGraphics(engineApi);
  configureVRSpatialAspectAndPerspective(engineApi);
  configureVRCockpit(engineApi);

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🥽 STAGE 3: SINGULARITY CORE [VR] LOADED');
  }
  return stageConfig;
}

export default {
  stageConfig,
  configureVRGraphics,
  configureVRSpatialAspectAndPerspective,
  configureVRCockpit,
  applyStage
};
