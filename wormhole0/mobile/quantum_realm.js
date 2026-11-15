/**
 * Wormhole XR - Stage 4: Quantum Realm [Mobile Profile]
 * Calibrated for Mobile Smartphones & Tablets (Dual Touch Joysticks, Gyroscope, Mobile Shaders)
 * Database Stage Level: 4 | Environment: Quantum Phasor Magenta
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 4,
  stage_name: 'Quantum Realm',
  stage_slug: 'quantum_realm',
  environment_theme: 'Quantum Phasor Magenta',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation',
  end_level_event: 'Quantum Conduit Realignment & Safe Extraction',
  mission_objectives: 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.',
  required_enemy_kills: 25,
  warp_target_distance: 10000,
  objectives: [
    {
        "id": "kills",
        "type": "kills",
        "target": 25,
        "current": 0,
        "title": "Destroy 25 Threats",
        "description": "Destroy 25 hostile 3D units emerging from the wormhole",
        "requiredForWarp": true
    },
    {
        "id": "distance",
        "type": "distance",
        "target": 10000,
        "title": "Wormhole Proximity < 10,000 KM",
        "description": "Navigate vessel to within < 10,000 KM of singularity core",
        "requiredForWarp": true
    }
],
  description: 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.',
  par_score: 50000,

  visual: {
    themeName: 'Quantum Phasor Magenta',
    primaryColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    panelBg: 'rgba(26, 4, 12, 0.88)',
    panelBorder: 'rgba(244, 63, 94, 0.40)',
    uniforms: {
      uColorEdge: 0x660022,
      uColorCore: 0xff0055,
      uColorHot: 0xffd6e6,
      uHaloColor: 0xff0066
    },
    lights: {
      ambient: 0x330011,
      center: 0xff1166
    },
    particles: {
      count: 2200,
      starCount: 1200,
      dustCount: 300,
      speed: 0.85
    },
    flight: {
      speed: 42,
      boostMultiplier: 2.2,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
    "initial": {
        "id": "quantum_phaser",
        "name": "Quantum Phaser",
        "icon": "✨",
        "color": "#10b981",
        "damage": 4,
        "bullet_speed": 950,
        "energy_drain_pct": 15,
        "can_overheat": 1,
        "cooldown_seconds": 6,
        "acquire_event": "deep_core_breakthrough",
        "description": "Sub-atomic pulse rifle optimized for deep singularity warfare."
    },
    "acquirable": []
},

  enemies: [
    {
        "id": "quantum_dreadnought",
        "device_type": "all",
        "name": "Quantum Omega Dreadnought (Universal)",
        "enemy_class": "Boss Dreadnought",
        "icon": "💀",
        "model_3d_type": "dreadnought",
        "model_3d_url": "",
        "scale": 1.6,
        "length": 7,
        "height": 3.2,
        "depth": 6,
        "circumference": 15,
        "color": "#ef476f",
        "hits": 35,
        "armor": 90,
        "shield": 15,
        "speed": 90,
        "attack_damage": 60,
        "weapon_name": "Quantum Annihilator",
        "weapon_damage": 60,
        "weapon_speed": 650,
        "weapon_color": "#ef476f",
        "fire_rate": 1.2,
        "score": 5000,
        "threat": "Extreme",
        "piercing": "quantum_phaser",
        "quick_effect_primary": "quantum_phase_glow",
        "quick_effect_secondary": "energy_shield_pulse",
        "quick_effect_color": "#ef476f",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 120,
        "destruction_particle_color": "#ef476f",
        "destruction_particle_scale": 1,
        "fire_rate_seconds": 1.2,
        "fire_rate_ms": 1200,
        "fire_rate_times_per_sec": 0.833,
        "weapons": [
            {
                "name": "Quantum Annihilator",
                "type": "beam",
                "mount": "dual_wingtip",
                "fire_rate_times_per_sec": 0.833,
                "fire_interval_ms": 1200,
                "fire_rate_seconds": 1.2,
                "damage": 60,
                "speed": 650,
                "color": "#ef476f",
                "is_enabled": 1
            }
        ]
    }
],

  controls: {
    inputMode: 'touch_virtual_joysticks',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'Left virtual joystick for pitch/yaw, Right slider for thrust/throttle, On-screen fire button'
  }
};


/**
 * Stage Multi-Weapon Firing Handler:
 * Supports multiple weapons per enemy, distinct firing cadences (times/sec and ms),
 * custom projectile colors, velocities, and mount points (dual wingtip, nose, turret).
 */
export function fireEnemyWeapon(enemyObj, context, weaponOverride = null) {
  if (!enemyObj || !enemyObj.mesh) return false;
  const THREE = (context && context.THREE) || window.THREE;
  const scene = (context && context.scene) || window.scene;
  const state = (context && context.state) || window.state;
  const cameraRig = (context && context.cameraRig) || window.cameraRig;
  const enemyBolts = (context && context.enemyBolts) || window.enemyBolts;
  const audioMgr = (context && context.audioMgr) || window.audioMgr;
  if (!THREE || !scene || !enemyBolts) return false;

  const playerPos = (state && state.isXR && cameraRig) ? cameraRig.position : ((state && state.position) ? state.position : new THREE.Vector3(0, 0, 220));
  const cfg = enemyObj.config || {};
  const activeWpn = weaponOverride || (Array.isArray(enemyObj.weapons) && enemyObj.weapons.length > 0 ? enemyObj.weapons[0] : null);

  const wpnName = (activeWpn && activeWpn.name) ? activeWpn.name : (cfg.weapon_name || enemyObj.weaponName || 'Plasma Pulse');
  const wpnType = (activeWpn && activeWpn.type) ? activeWpn.type : (/missile|torpedo/i.test(wpnName) ? 'missile' : 'beam');
  const isMissile = (wpnType === 'missile');

  const shipScale = (enemyObj.mesh.scale && typeof enemyObj.mesh.scale.x === 'number') ? enemyObj.mesh.scale.x : 1.0;
  const cfgDepth = (parseFloat(cfg.depth) || 3.0) * shipScale;
  const cfgLength = (parseFloat(cfg.length) || 3.0) * shipScale;

  const mount = (activeWpn && activeWpn.mount) ? activeWpn.mount : 'dual_wingtip';
  let lateralOffset = 0;
  let verticalOffset = -0.15 * shipScale;
  if (mount === 'dual_wingtip') {
    enemyObj.lastGunSide = (enemyObj.lastGunSide === 1) ? -1 : 1;
    lateralOffset = enemyObj.lastGunSide * cfgLength * 0.32;
  } else if (mount === 'left') {
    lateralOffset = -cfgLength * 0.32;
  } else if (mount === 'right') {
    lateralOffset = cfgLength * 0.32;
  } else if (mount === 'turret') {
    verticalOffset = 0.45 * shipScale;
    lateralOffset = 0;
  }
  const forwardOffset = cfgDepth * 0.48;

  const localMuzzle = new THREE.Vector3(lateralOffset, verticalOffset, forwardOffset);
  const spawnOrigin = enemyObj.mesh.position.clone().add(localMuzzle.applyQuaternion(enemyObj.mesh.quaternion));
  const direction = new THREE.Vector3().subVectors(playerPos, spawnOrigin).normalize();

  const weaponBoltColor = (activeWpn && activeWpn.color) ? activeWpn.color : (cfg.weapon_color || enemyObj.weaponColor || '#ff0055');
  const boltColorHex = parseInt(weaponBoltColor.replace('#', '0x'), 16) || 0xff0055;
  const boltScale = THREE.MathUtils.clamp(shipScale * 0.85, 0.6, 2.5);

  let mesh;
  let geometryList = [];
  let materialList = [];
  const rawSpd = parseInt((activeWpn && activeWpn.speed) ? activeWpn.speed : (cfg.weapon_speed || enemyObj.weaponSpeed || 450));
  let boltSpeed = Math.max(24, Math.min(48, rawSpd * 0.075));
  const boltDamage = parseInt((activeWpn && activeWpn.damage) ? activeWpn.damage : (cfg.weapon_damage || cfg.attack_damage || enemyObj.weaponDmg || 5));

  if (isMissile) {
    const missileGroup = new THREE.Group();
    const bodyGeom = new THREE.CylinderGeometry(0.24, 0.4, 2.8, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2d34, metalness: 0.8, roughness: 0.3 });
    const tipGeom = new THREE.ConeGeometry(0.44, 1.1, 8);
    tipGeom.rotateX(-Math.PI / 2);
    tipGeom.translate(0, 0, -1.9);
    const tipMat = new THREE.MeshBasicMaterial({ color: boltColorHex, transparent: true, opacity: 0.95 });
    missileGroup.add(new THREE.Mesh(bodyGeom, bodyMat));
    missileGroup.add(new THREE.Mesh(tipGeom, tipMat));

    const light = new THREE.PointLight(boltColorHex, 4.0 * boltScale, 32 * boltScale);
    missileGroup.add(light);
    missileGroup.scale.set(boltScale, boltScale, boltScale);
    missileGroup.position.copy(spawnOrigin);
    missileGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    scene.add(missileGroup);
    mesh = missileGroup;
    geometryList = [bodyGeom, tipGeom];
    materialList = [bodyMat, tipMat];
    boltSpeed = Math.max(20, Math.min(36, rawSpd * 0.065));

    if (audioMgr && typeof audioMgr.playEnemyMissile === 'function') {
      audioMgr.playEnemyMissile();
    } else if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  } else {
    const beamGroup = new THREE.Group();
    const sheathGeom = new THREE.CylinderGeometry(0.44, 0.58, 8.2, 8);
    sheathGeom.rotateX(Math.PI / 2);
    const sheathMat = new THREE.MeshBasicMaterial({ color: boltColorHex, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending });
    const coreGeom = new THREE.CylinderGeometry(0.18, 0.28, 7.5, 8);
    coreGeom.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.96 });
    beamGroup.add(new THREE.Mesh(sheathGeom, sheathMat));
    beamGroup.add(new THREE.Mesh(coreGeom, coreMat));

    const light = new THREE.PointLight(boltColorHex, 4.0 * boltScale, 36 * boltScale);
    beamGroup.add(light);
    beamGroup.scale.set(boltScale, boltScale, boltScale);
    beamGroup.position.copy(spawnOrigin);
    beamGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    scene.add(beamGroup);
    mesh = beamGroup;
    geometryList = [sheathGeom, coreGeom];
    materialList = [sheathMat, coreMat];

    if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  }

  enemyBolts.push({
    mesh,
    geometryList,
    materialList,
    direction,
    speed: boltSpeed,
    damage: boltDamage,
    type: isMissile ? 'missile' : 'beam',
    spiralTime: Math.random() * Math.PI * 2,
    spawnTime: performance.now(),
    lifetime: 4.8
  });

  return true;
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 4: Quantum Realm] Applying Mobile Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 4: QUANTUM REALM [MOBILE]');
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
  if (typeof engineApi.setEnemyWeaponHandler === 'function') {
    engineApi.setEnemyWeaponHandler(fireEnemyWeapon);
  }
  if (typeof engineApi.setStageObjectives === 'function') {
    engineApi.setStageObjectives(stageConfig.objectives || []);
  }
  if (typeof engineApi.setDeviceControls === 'function') {
    engineApi.setDeviceControls(stageConfig.controls);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 STAGE 4: QUANTUM REALM [MOBILE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage, fireEnemyWeapon };;