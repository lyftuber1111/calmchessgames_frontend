/**
 * Wormhole XR - Stage 1: Warp Origin [VR Headset & Immersive Web Emulator Profile]
 * Calibrated for WebXR Immersive-VR & Desktop Immersive Web Emulator
 * Configures VR Graphics, Spatial Aspect, Perspective (65° FOV / CameraRig @ 220), and Cockpit HUD
 * Database Stage Level: 1 | Environment: Warp Cyan Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 1,
  stage_name: 'Warp Origin',
  stage_slug: 'warp_origin',
  environment_theme: 'Warp Cyan Corridor',
  device: 'vr',
  xr_mode: 'desktop-vr',
  events_within_level: 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert',
  end_level_event: 'Warp Horizon Jump Gate Initialized',
  description: 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.',
  par_score: 5000,

  visual: {
    themeName: 'Warp Cyan Corridor',
    primaryColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    panelBg: 'rgba(2, 14, 26, 0.88)',
    panelBorder: 'rgba(0, 240, 255, 0.40)',
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
      count: 9000,
      starCount: 12000,
      dustCount: 1800,
      speed: 0.85
    },
    flight: {
      speed: 45.0,
      boostMultiplier: 2.2,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
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
      id: 'red_laser',
      name: 'Neon Red Laser',
      icon: '🔴',
      color: '#ff0033',
      damage: 2,
      bullet_speed: 550,
      energy_drain_pct: 10.0,
      can_overheat: 1,
      cooldown_seconds: 5.0,
      description: 'Dual VR hand-tracked pulse emitter. Trigger-actuated plasma bolts.'
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
      speed: 320,
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
      speed: 440,
      attack_damage: 10,
      fire_rate: 1.80,
      score: 250,
      threat: 'Medium',
      piercing: 'red_laser'
    }
  ],

  controls: {
    inputMode: 'webxr_controllers',
    showVirtualJoysticks: false,
    enablePointerLock: true,
    vrRayLength: 5.0
  },

  audio: {
    spin180Sound: null,
    spin360Sound: null,
    enableCoilAudio: false
  }
};

const vrControllerButtonState = {
  left: {},
  right: {}
};

/**
 * Configures VR graphics (Bloom, Gravitational Lensing, Exposure, Starfield, and hiding obstructive raw controller meshes).
 */
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

  // Hide raw WebXR controller 3D models & lines in cockpit view so they never block the wormhole viewport
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

/**
 * Configures VR Cockpit HUD visibility and layout so the VR view in the Immersive Web Emulator
 * retains the full interactive cockpit HUD matching XR_Desktop_0.mp4.
 */
export function configureVRCockpit(engineApi) {
  if (typeof document === 'undefined') return;
  const c = stageConfig.vrConfig.cockpit;

  let styleEl = document.getElementById('wormhole-vr-cockpit-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'wormhole-vr-cockpit-style';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    body.in-xr-session #hud-layer {
      display: ${c.showHudOverlay ? 'flex' : 'none'} !important;
      z-index: 10 !important;
    }
    body.in-xr-session #left-drawer-container {
      display: ${c.showLeftDrawer ? 'flex' : 'none'} !important;
      top: ${(c.emulatorToolbarOffsetTopPx || 42) + 32}px !important;
    }
    body.in-xr-session #top-drawer-container {
      display: ${c.showTopDrawer ? 'flex' : 'none'} !important;
    }
    body.in-xr-session #bottom-drawer-container {
      display: ${c.showBottomDrawer ? 'flex' : 'none'} !important;
    }
    body.in-xr-session .hud-pause-icon-btn,
    body.in-xr-session .hud-quick-pause-btn {
      display: flex !important;
      top: ${c.emulatorToolbarOffsetTopPx || 42}px !important;
      left: 8px !important;
    }
    body.in-xr-session #wormhole-dist-badge-wrap,
    body.in-xr-session #wormhole-distance-badge {
      display: ${c.showDistanceBadge ? 'inline-flex' : 'none'} !important;
    }
    body.in-xr-session #center-crosshair,
    body.in-xr-session #vector-alignment-ring {
      display: ${c.showCrosshairAndAlignmentRing ? 'flex' : 'none'} !important;
    }
    body.in-xr-session .hud-reticle {
      display: ${c.showCornerReticles ? 'block' : 'none'} !important;
    }
    body.in-xr-session #mobile-touch-controls,
    body.in-xr-session #landscape-rotate-prompt {
      display: none !important;
    }
  `;

  const hudLayer = document.getElementById('hud-layer');
  if (hudLayer && c.showHudOverlay) {
    hudLayer.style.display = 'flex';
  }
}

/**
 * Polls WebXR Controller (R) and Controller (L) inputs from the Immersive Web Emulator or physical VR controllers.
 */
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

    // Trigger (Button 0): Fire active laser cannon
    if (triggerPressed && !prev[0]) {
      if (typeof engineApi.fireLaserBeam === 'function') engineApi.fireLaserBeam();
    }

    // Grip (Button 1): Cycle weapons
    if (gripPressed && !prev[1]) {
      if (engineApi.weaponsSystem && typeof engineApi.weaponsSystem.cycleWeapon === 'function') {
        engineApi.weaponsSystem.cycleWeapon();
      }
    }

    // Thumbstick Press (Button 3): Nav Lock / Align to Wormhole
    if (stickPressed && !prev[3]) {
      if (typeof engineApi.alignToWormhole === 'function') engineApi.alignToWormhole();
    }

    if (hand === 'right') {
      // Right A Button (Button 4): Single shot laser fire
      if (btnAPressed && !prev[4]) {
        if (typeof engineApi.fireLaserBeam === 'function') engineApi.fireLaserBeam();
      }
      // Right B Button (Button 5): Continuous rapid fire while held
      if (btnBPressed) {
        if (typeof engineApi.fireLaserBeam === 'function') engineApi.fireLaserBeam();
      }
    } else {
      // Left X Button (Button 4): Trigger Scan or Calibrate next Warp Coil
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
      // Left Y Button (Button 5): Engage Warp Jump
      if (btnBPressed && !prev[5]) {
        if (typeof engineApi.triggerWarpJump === 'function') engineApi.triggerWarpJump();
      }
    }

    // Thumbstick axes (xr-standard uses axes[2], axes[3]; fallback to axes[0], axes[1])
    const rawX = gp.axes.length >= 4 ? gp.axes[2] : (gp.axes[0] || 0);
    const rawY = gp.axes.length >= 4 ? gp.axes[3] : (gp.axes[1] || 0);
    const ax = Math.abs(rawX) > deadzone ? rawX : 0;
    const ay = Math.abs(rawY) > deadzone ? rawY : 0;

    if (hand === 'left') {
      // Left thumbstick: Aim crosshair on screen
      if ((ax !== 0 || ay !== 0) && state && state.crosshair) {
        const speed = 380 * (state.crosshairSpeedMultiplier || 4.0) * 0.25;
        state.crosshair.x = Math.max(15, Math.min(window.innerWidth - 15, state.crosshair.x + ax * speed * delta));
        state.crosshair.y = Math.max(15, Math.min(window.innerHeight - 15, state.crosshair.y + ay * speed * delta));
        const chEl = document.getElementById('center-crosshair');
        if (chEl) {
          chEl.style.left = `${state.crosshair.x}px`;
          chEl.style.top = `${state.crosshair.y}px`;
        }
        const vrEl = document.getElementById('vector-alignment-ring');
        if (vrEl) {
          vrEl.style.left = `${state.crosshair.x}px`;
          vrEl.style.top = `${state.crosshair.y}px`;
        }
      }
    } else if (hand === 'right' && state && CONFIG) {
      // Right thumbstick: Yaw steering (X) and Forward/Reverse thrust (Y)
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

/**
 * Configures VR Spatial Aspect & Perspective (CameraRig @ (0, 0, 220), HMD standing-height offset compensation,
 * and 65° FOV / viewport aspect calibration for WebXR & Desktop Immersive Web Emulator).
 */
export function configureVRSpatialAspectAndPerspective(engineApi) {
  if (!engineApi) return;
  const sp = stageConfig.vrConfig.spatialAspect;
  const p = stageConfig.vrConfig.perspective;

  if (engineApi.renderer && engineApi.renderer.xr && !engineApi.renderer.xr.isPresenting) {
    if (typeof engineApi.renderer.xr.setReferenceSpaceType === 'function') {
      engineApi.renderer.xr.setReferenceSpaceType(sp.referenceSpaceType || 'local');
    }
  }

  // Ensure ship standoff distance starts at 220 (92,400 KM) looking straight at (0, 0, 0)
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

  // Register per-frame VR hook for HMD height offset compensation, XR camera FOV/aspect sync, and controller polling
  if (typeof engineApi.registerVrFrameHook === 'function') {
    engineApi.registerVrFrameHook((delta, api) => {
      if (!api || !api.state || !api.state.isXR) return;

      const xrMgr = api.renderer && api.renderer.xr;
      if (xrMgr && xrMgr.isPresenting && api.cameraRig) {
        const xrCam = xrMgr.getCamera ? xrMgr.getCamera() : null;
        const subCameras = (xrCam && Array.isArray(xrCam.cameras)) ? xrCam.cameras : [];

        // 1. Capture resting HMD local offset (e.g., (0, 1.6, 0) in Immersive Web Emulator) and compensate on cameraRig
        // so that at rest pose the world camera sits at exact state.position (0, 0, 220) looking at (0, 0, 0)
        if (sp.compensateHmdHeightOffset && subCameras.length > 0) {
          const cam0Pos = subCameras[0].position;
          if (!api.isXrBasePoseCaptured() && cam0Pos && cam0Pos.lengthSq() > 0.00001) {
            api.xrBaseHmdPos.copy(cam0Pos);
            api.setXrBasePoseCaptured(true);
          }
          if (api.isXrBasePoseCaptured()) {
            const worldOffset = api.xrBaseHmdPos.clone().applyQuaternion(api.cameraRig.quaternion);
            api.cameraRig.position.copy(api.state.position).sub(worldOffset);
            api.cameraRig.updateMatrixWorld(true);
          }
        }

        // 2. Calibrate XR eye camera projection matrices to match Desktop 65° FOV and exact viewport aspect ratio
        if (p.syncXrCameraProjection && xrCam) {
          const targetFov = api.state.isHyperWarping ? 110 : (p.fov || 65);
          const near = p.near || 0.1;
          const far = p.far || 8000;
          const fY = 1.0 / Math.tan((targetFov * Math.PI) / 360.0);
          const fallbackAspect = window.innerWidth / Math.max(1, window.innerHeight);

          for (let i = 0; i < subCameras.length; i++) {
            const subCam = subCameras[i];
            if (!subCam || !subCam.projectionMatrix) continue;
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
          }
        }
      }

      // 3. Poll WebXR controllers (Immersive Web Emulator Controller (R) & Controller (L))
      pollVRControllers(delta, api);
    });
  }
}

/**
 * Silences audio for the 180° and 360° turn buttons cleanly while in Stage 1.
 */
function disableSpinAudio(engineApi) {
  if (engineApi && typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(false);
  } else {
    const mgr = (engineApi && engineApi.audioMgr) || (typeof window !== 'undefined' ? window.audioMgr : null);
    if (mgr && typeof mgr.setSpinAudioEnabled === 'function') {
      mgr.setSpinAudioEnabled(false);
    } else if (mgr) {
      mgr.spinAudioEnabled = false;
      if (mgr.coilAudio) {
        try { mgr.coilAudio.pause(); } catch (e) {}
      }
    }
  }
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 1: Warp Origin] Applying VR Headset & Emulator profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN [VR HMD]');
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

  // Configure VR Graphics, Spatial Aspect, Perspective, and Cockpit HUD
  configureVRGraphics(engineApi);
  configureVRSpatialAspectAndPerspective(engineApi);
  configureVRCockpit(engineApi);

  // Stage 1 disables 180° and 360° spin audio
  disableSpinAudio(engineApi);

  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🥽 STAGE 1: WARP ORIGIN [VR] LOADED');
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
