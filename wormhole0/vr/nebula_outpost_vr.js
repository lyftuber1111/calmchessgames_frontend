/**
 * Wormhole XR - Stage 6: Nebula Outpost [VR Headset Profile]
 * Calibrated for WebXR Immersive-VR (6-DOF Spatial Motion Controllers, Stereo Rendering)
 * Database Stage Level: 6 | Environment: Emerald Nebula Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 6,
  stage_name: 'Nebula Outpost',
  stage_slug: 'nebula_outpost',
  environment_theme: 'Emerald Nebula Corridor',
  device: 'vr',
  xr_mode: 'desktop-vr',
  events_within_level: 'Asteroid Storm, EMP Pulse Drones, Shield Recharge Waves',
  end_level_event: 'Ancient Cyber Dreadnought Gate Collapse',
  description: 'Dense emerald asteroid field guarding the outer sector perimeter.',
  par_score: 7500,

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
      count: 3800,
      starCount: 2200,
      dustCount: 500,
      speed: 0.85
    },
    flight: {
      speed: 50,
      boostMultiplier: 2.3,
      pitchSpeed: 0.0024,
      yawSpeed: 0.0024
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
    inputMode: '6dof_controllers',
    showVirtualJoysticks: false,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'Dual 6-DOF VR motion controllers, Trigger primary fire, Grip boost thrust'
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

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 6: Nebula Outpost] Applying VR Headset Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 6: NEBULA OUTPOST [VR]');
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
    engineApi.showToast('🚀 STAGE 6: NEBULA OUTPOST [VR] LOADED');
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