/**
 * Wormhole XR - Stage 6: Nebula Outpost [ARCore Profile]
 * Calibrated for WebXR Immersive-AR in Passthrough Space
 * Database Stage Level: 6 | Environment: Emerald Nebula Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  warp_target_distance: 5000,
  required_enemy_kills: 25,
  mission_objectives: "Neutralize 25 Nebula hostiles and secure orbital relay outpost perimeter.",
  stage_level: 6,
  stage_name: 'Nebula Outpost',
  stage_slug: 'nebula_outpost',
  environment_theme: 'Emerald Nebula Corridor',
  device: 'arcore',
  xr_mode: 'mobile-ar',
  events_within_level: 'Asteroid Storm, EMP Pulse Drones, Shield Recharge Waves',
  end_level_event: 'Ancient Cyber Dreadnought Gate Collapse',
  description: 'Dense emerald asteroid field guarding the outer sector perimeter.',
  par_score: 7500,

  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 25,
    "current": 0,
    "title": "Neutralize 25 Nebula Defense Sentries",
    "description": "Clear 25 defensive sentries patrolling emerald nebula corridor",
    "requiredForWarp": true,
    "actionText": "🎯 Target Threat",
    "actionId": "target_enemy"
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 5000,
    "title": "Command Relay Proximity < 5,000 KM",
    "description": "Navigate dense asteroid corridor to within < 5,000 KM of outpost command relay",
    "requiredForWarp": true,
    "actionText": "🛰️ Lock Vector",
    "actionId": "lock_vector"
  }
],
  visual: {
    themeName: 'Emerald Nebula Corridor',
    primaryColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    panelBg: 'rgba(2, 22, 14, 0.88)',
    panelBorder: 'rgba(16, 185, 129, 0.40)',
    uniforms: {
      uColorEdge: 0x004d26,
      uColorCore: 0x10b981,
      uColorHot: 0xd1fae5,
      uHaloColor: 0x10b981
    },
    lights: {
      ambient: 0x002613,
      center: 0x10b981
    },
    particles: {
      count: 1800,
      starCount: 600,
      dustCount: 200,
      speed: 0.85
    },
    flight: {
      speed: 40,
      boostMultiplier: 1.9,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
  "initial": {
    "id": "nebula_ion_blaster",
    "name": "Nebula Ion Blaster",
    "icon": "\u26a1",
    "color": "#00ff88",
    "damage": 4,
    "bullet_speed": 800,
    "energy_drain_pct": 12.0,
    "can_overheat": 1,
    "cooldown_seconds": 4.5,
    "scale": 1.2,
    "scale_x": 1.1,
    "scale_y": 1.1,
    "scale_z": 1.4,
    "size_x": 1.2,
    "size_y": 1.2,
    "size_z": 1.8,
    "dimensions": {
      "x": 1.2,
      "y": 1.2,
      "z": 1.8
    },
    "description": "High-velocity ion stream stabilized for heavy nebula interference."
  },
  "acquirable": []
},
  enemies: [
  {
    "id": "nebula_sentry_drone",
    "enemy_id": "nebula_sentry_drone",
    "name": "Nebula Defense Sentry",
    "enemy_class": "Defense Sentry",
    "icon": "\ud83d\udef8",
    "model_3d_type": "custom_glb",
    "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
    "color": "#10b981",
    "scale": 0.85,
    "length": 3.0,
    "height": 3.0,
    "depth": 3.0,
    "circumference": 9.0,
    "hits": 5,
    "armor": 25,
    "shield": 2,
    "speed": 200,
    "attack_damage": 12,
    "weapon_name": "Ion Emerald Burst",
    "weapon_damage": 12,
    "weapon_speed": 500,
    "weapon_color": "#10b981",
    "weapon_scale": 1.1,
    "weapon_scale_x": 1.0,
    "weapon_scale_y": 1.0,
    "weapon_scale_z": 1.3,
    "weapon_size_x": 0.8,
    "weapon_size_y": 0.8,
    "weapon_size_z": 1.6,
    "weapon_dimensions": {
      "x": 0.8,
      "y": 0.8,
      "z": 1.6
    },
    "fire_rate": 2.2,
    "fire_rate_seconds": 2.2,
    "fire_rate_ms": 2200,
    "fire_rate_times_per_sec": 0.455,
    "weapons": [
      {
        "id": "ew_nebula_burst",
        "name": "Ion Emerald Burst",
        "type": "beam",
        "mount": "dual_wingtip",
        "model_url": "",
        "model_type": "",
        "fire_point_x": 0.0,
        "fire_point_y": -0.15,
        "fire_point_z": 1.5,
        "scale": 1.1,
        "scale_x": 1.0,
        "scale_y": 1.0,
        "scale_z": 1.3,
        "size_x": 0.8,
        "size_y": 0.8,
        "size_z": 1.6,
        "dimensions": {
          "x": 0.8,
          "y": 0.8,
          "z": 1.6
        },
        "fire_rate_times_per_sec": 0.455,
        "fire_interval_ms": 2200,
        "fire_rate_seconds": 2.2,
        "damage": 12,
        "speed": 500,
        "color": "#10b981",
        "is_enabled": 1
      }
    ],
    "score": 400,
    "threat": "Medium",
    "piercing": "any",
    "pool_size": 40
  }
],
  controlscontrols: {
    "inputMode": "ar_touch_flight",
    "showVirtualJoysticks": true,
    "enablePointerLock": false,
    "description": "6-DOF AR device pose tracking, Screen tap targeting, Virtual touch thrust, On-screen warp button"
}
};


/**
 * Stage Multi-Weapon Firing Handler:
 * Supports multiple weapons per enemy, distinct firing cadences (times/sec and ms),
 * custom projectile colors, velocities, and mount points (dual wingtip, nose, turret).
 */
export function fireEnemyWeapon(enemy, playerPos, activeEnemyBolts, scene) {
  if (!enemy || !enemy.mesh || !activeEnemyBolts || !scene) return false;

  const enemyBolts = typeof activeEnemyBolts === 'function' ? activeEnemyBolts() : activeEnemyBolts;
  if (!enemyBolts || enemyBolts.length > 80) return false;

  const primaryW = (enemy.weapons && enemy.weapons[0]) || {};
  const wScale = Number(enemy.weapon_scale ?? primaryW.scale ?? 1.0);
  const wScaleX = Number(enemy.weapon_scale_x ?? primaryW.scale_x ?? 1.0);
  const wScaleY = Number(enemy.weapon_scale_y ?? primaryW.scale_y ?? 1.0);
  const wScaleZ = Number(enemy.weapon_scale_z ?? primaryW.scale_z ?? 1.0);
  const wSizeX = Number(enemy.weapon_size_x ?? primaryW.size_x ?? (primaryW.dimensions && primaryW.dimensions.x) ?? 1.0);
  const wSizeY = Number(enemy.weapon_size_y ?? primaryW.size_y ?? (primaryW.dimensions && primaryW.dimensions.y) ?? 1.0);
  const wSizeZ = Number(enemy.weapon_size_z ?? primaryW.size_z ?? (primaryW.dimensions && primaryW.dimensions.z) ?? 1.0);

  const boltGeom = new THREE.CylinderGeometry(0.08 * wSizeX, 0.08 * wSizeY, 1.6 * wSizeZ, 6);
  boltGeom.rotateX(Math.PI / 2);
  const boltMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(enemy.weaponColor || enemy.weapon_color || '#10b981'),
    wireframe: false
  });

  const mesh = new THREE.Mesh(boltGeom, boltMat);
  mesh.scale.set(wScale * wScaleX, wScale * wScaleY, wScale * wScaleZ);
  mesh.position.copy(enemy.mesh.position);

  const target = (playerPos && playerPos.isVector3) ? playerPos : new THREE.Vector3(0, 0, 220);
  const direction = new THREE.Vector3().subVectors(target, enemy.mesh.position).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

  const geometryList = [boltGeom];
  const materialList = [boltMat];

  const isMissile = (enemy.weaponType === 'missile' || (enemy.weaponName && enemy.weaponName.toLowerCase().includes('missile')));
  const boltSpeed = enemy.weaponSpeed || enemy.weapon_speed || 420;
  const boltDamage = enemy.weaponDamage || enemy.weapon_damage || 5;

  scene.add(mesh);

  enemyBolts.push({
    mesh,
    geometryList,
    materialList,
    direction,
    speed: boltSpeed,
    damage: boltDamage,
    scale: wScale,
    scale_x: wScaleX,
    scale_y: wScaleY,
    scale_z: wScaleZ,
    size_x: wSizeX,
    size_y: wSizeY,
    size_z: wSizeZ,
    dimensions: { x: wSizeX, y: wSizeY, z: wSizeZ },
    type: isMissile ? 'missile' : 'beam',
    spiralTime: Math.random() * Math.PI * 2,
    spawnTime: performance.now(),
    lifetime: 4.8
  });

  return true;
}


// =========================================================================
// COCKPIT CRACKS TRANSPARENT OVERLAY POOL & GAME OVER MANAGEMENT
// Model: mobile/warp_origin_images/cockpit_cracks.glb
// Transparent overlay positioned across the cockpit window;
// flashes visible for an instant on enemy hit and stays visible for 1 second
// before game over screen appears. Loaded with the stage object pool.
// =========================================================================

let activeCockpitCracksMesh = null;
let activeCockpitCracksPool = null;

export async function setupCockpitCracksOverlay(camera, pool = null, scene = null) {
  if (!camera) {
    camera = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
  }
  if (!scene) {
    scene = (typeof window !== 'undefined' && window.scene) ? window.scene : null;
  }

  if (camera) {
    const existing = camera.getObjectByName('cockpit_cracks_overlay');
    if (existing) {
      camera.remove(existing);
    }
  }

  if (pool && typeof pool.getCockpitCracksOverlay === 'function') {
    activeCockpitCracksPool = pool;
    activeCockpitCracksMesh = pool.getCockpitCracksOverlay(camera);
    if (activeCockpitCracksMesh) {
      fitCockpitCracksToCamera(activeCockpitCracksMesh, camera);
      return activeCockpitCracksMesh;
    }
  }

  try {
    const glbUrl = (stageConfig.cockpit_overlay && stageConfig.cockpit_overlay.model_3d_url)
      || COCKPIT_CRACKS_GLB_URL
      || 'mobile/warp_origin_images/cockpit_cracks.glb';

    const loadedMesh = await loadCockpitCracksGlbAsset(glbUrl);
    if (loadedMesh) {
      setupCockpitCracksHierarchy(loadedMesh);

      activeCockpitCracksPool = new MeshPool(
        scene,
        null,
        null,
        1,
        () => loadedMesh.clone(true)
      );

      activeCockpitCracksMesh = activeCockpitCracksPool.spawn();
      setupCockpitCracksHierarchy(activeCockpitCracksMesh);

      if (camera) {
        camera.add(activeCockpitCracksMesh);
        fitCockpitCracksToCamera(activeCockpitCracksMesh, camera);
      }
      console.log(`[Stage 6: Nebula Outpost] Cockpit cracks GLB loaded with pool and mounted across cockpit view`);
    }
  } catch (err) {
    console.warn(`[Stage 6: Nebula Outpost] Error setting up cockpit cracks overlay:`, err);
  }

  return activeCockpitCracksMesh;
}

export function fitCockpitCracksToCamera(mesh, camera) {
  if (!mesh || !camera) return;
  mesh.position.set(0, 0, -1.0);
  mesh.rotation.set(0, 0, 0);

  const aspect = camera.aspect || (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9);
  const vFovRad = ((camera.fov || 65) * Math.PI) / 180;
  const dist = 1.0;
  const visibleH = 2 * Math.tan(vFovRad / 2) * dist;
  const visibleW = visibleH * aspect;

  const scale = Math.max((visibleW / 1.90) * 1.08, (visibleH / 1.41) * 1.08);
  mesh.scale.set(scale, scale, 1.0);
}

export function triggerCockpitCracksHit(durationMs = 280) {
  if (activeCockpitCracksPool && typeof activeCockpitCracksPool.flashCockpitCracks === 'function') {
    activeCockpitCracksPool.flashCockpitCracks(durationMs);
  } else if (activeCockpitCracksMesh) {
    flashCockpitCracksOverlay(activeCockpitCracksMesh, durationMs);
  }

  if (typeof document !== 'undefined') {
    const redEdges = document.getElementById('cockpit-edges-red');
    if (redEdges) {
      redEdges.style.opacity = '1.0';
      setTimeout(() => {
        redEdges.style.opacity = '0';
      }, durationMs);
    }
  }
}

export function triggerGameOverCockpitCracks(durationMs = 1000) {
  if (activeCockpitCracksPool && typeof activeCockpitCracksPool.showGameOverCockpitCracks === 'function') {
    activeCockpitCracksPool.showGameOverCockpitCracks(durationMs);
  } else if (activeCockpitCracksMesh) {
    showGameOverCockpitCracksOverlay(activeCockpitCracksMesh, durationMs);
  }
  if (typeof document !== 'undefined') {
    const redEdges = document.getElementById('cockpit-edges-red');
    if (redEdges) {
      redEdges.style.opacity = '1.0';
    }
  }
}

export function hideCockpitCracks() {
  if (activeCockpitCracksPool && typeof activeCockpitCracksPool.hideCockpitCracks === 'function') {
    activeCockpitCracksPool.hideCockpitCracks();
  } else if (activeCockpitCracksMesh) {
    activeCockpitCracksMesh.visible = false;
    activeCockpitCracksMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = 0.0;
        child.material.needsUpdate = true;
      }
    });
  }
  if (typeof document !== 'undefined') {
    const redEdges = document.getElementById('cockpit-edges-red');
    if (redEdges) {
      redEdges.style.opacity = '0';
    }
  }
}

export function getActiveCockpitCracksOverlay() {
  return activeCockpitCracksMesh;
}

export function applyStage(engineApi) {
  if (typeof engineApi.setStageObjectives === 'function') {
    engineApi.setStageObjectives(stageConfig.objectives || []);
  }
  if (!engineApi) return stageConfig;
  console.log(`[Stage 6: Nebula Outpost] Applying ARCore Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 6: NEBULA OUTPOST [ARCORE]');
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
  if (typeof engineApi.setWaves === 'function') {
    engineApi.setWaves(stageConfig.waves, {
      total_waves: stageConfig.total_waves,
      wave_interval_seconds: stageConfig.wave_interval_seconds
    });
  }
  if (typeof engineApi.setEnemyWeaponHandler === 'function') {
    engineApi.setEnemyWeaponHandler(fireEnemyWeapon);
  }
  if (typeof engineApi.setDeviceControls === 'function') {
    engineApi.setDeviceControls(stageConfig.controls);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 STAGE 6: NEBULA OUTPOST [ARCORE] LOADED');
  }
  // --- Mount Cockpit Cracks Overlay Across Cockpit Window via Pool ---
  const camera = (engineApi && engineApi.camera) || (typeof window !== 'undefined' && window.camera);
  const scene = (engineApi && engineApi.scene) || (typeof window !== 'undefined' && window.scene);
  const pool = (engineApi && typeof engineApi.getObjectPool === 'function' ? engineApi.getObjectPool() : null)
    || (typeof window !== 'undefined' && window.stageObjectPool)
    || null;

  setupCockpitCracksOverlay(camera, pool, scene);

  // Resize handler to maintain perfect cockpit fit
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      const cam = (engineApi && engineApi.camera) || window.camera;
      if (activeCockpitCracksMesh && cam) {
        fitCockpitCracksToCamera(activeCockpitCracksMesh, cam);
      }
    });

    // Hook enemy hit detection:
    if (typeof window.applyDamageToPlayer === 'function' && !window.applyDamageToPlayer._cockpitCracksHooked) {
      const prevDamage = window.applyDamageToPlayer;
      window.applyDamageToPlayer = function(dmg, ...args) {
        const ret = prevDamage.apply(this, [dmg, ...args]);
        triggerCockpitCracksHit();
        return ret;
      };
      window.applyDamageToPlayer._cockpitCracksHooked = true;
    }

    window.addEventListener('cockpitHit', () => triggerCockpitCracksHit());
    window.addEventListener('playerDamage', () => triggerCockpitCracksHit());
    window.addEventListener('cockpitImpact', () => triggerCockpitCracksHit());
    window.addEventListener('gameOverCracks', () => triggerGameOverCockpitCracks(1000));

    const prevCustomFx = window.executeCustomWeaponImpactFx;
    window.executeCustomWeaponImpactFx = function(bolt, normX, normY, canvas) {
      if (typeof prevCustomFx === 'function') {
        try { prevCustomFx(bolt, normX, normY, canvas); } catch (e) {}
      }
      triggerCockpitCracksHit();
    };

    window.triggerCockpitCracksHit = triggerCockpitCracksHit;
    window.flashCockpitCracks = triggerCockpitCracksHit;
    window.triggerGameOverCockpitCracks = triggerGameOverCockpitCracks;
    window.hideCockpitCracks = hideCockpitCracks;
    window.setupCockpitCracksOverlay = setupCockpitCracksOverlay;
    window.getActiveCockpitCracksOverlay = getActiveCockpitCracksOverlay;
  }



  return stageConfig;
}

/**
 * Stage Wave Management: Controls pulling specific number of enemies from the pool
 * for each wave, tracking how many waves and how often a wave happens.
 */
export function getStageWaves() {
  return stageConfig.waves;
}


export function updateStageWaves(engineApi, context = {}) {
  if (!engineApi) return null;
  const currentWave = typeof engineApi.getCurrentWave === 'function' ? engineApi.getCurrentWave() : 0;
  const totalWaves = stageConfig.total_waves || 2;
  const now = (context && context.now) || performance.now();
  const waveStartTime = typeof engineApi.getWaveStartTime === 'function' ? engineApi.getWaveStartTime() : 0;
  const activeEnemies = (context && context.activeEnemies) || [];

  // Wave 1: Pull 5 enemies from the pool at the start of stage engagement
  if (currentWave === 0) {
    return pullEnemyWave(1, engineApi, context);
  }

  // Wave 2: Pull 10 enemies from the pool when the 15-second wave interval has elapsed
  if (currentWave === 1 && totalWaves >= 2) {
    const elapsed = now - waveStartTime;
    const waveIntervalMs = (stageConfig.wave_interval_seconds || 15) * 1000;
    const wave1EnemiesRemaining = activeEnemies.filter(e => e.isActive && e.waveNumber === 1).length;

    // Strict timing: Wave 2 occurs after the 15-second interval (or if wave 1 defeated and at least 5s elapsed)
    if (elapsed >= waveIntervalMs || (wave1EnemiesRemaining === 0 && elapsed >= 5000)) {
      return pullEnemyWave(2, engineApi, context);
    }
  }

  return null;
}

export function pullEnemyWave(waveNumber, engineApi, context = {}) {
  const waves = stageConfig.waves || [];
  const wave = waves.find(w => w.wave_number === waveNumber) || waves[waveNumber - 1];
  if (!wave) return [];
  const count = wave.enemy_count || (waveNumber === 1 ? 5 : 10);
  if (engineApi && typeof engineApi.spawnWaveEnemies === 'function') {
    return engineApi.spawnWaveEnemies(count, wave, stageConfig.enemies);
  }
  return [];
}

export default { stageConfig, applyStage, fireEnemyWeapon, getStageWaves, updateStageWaves, pullEnemyWave };;