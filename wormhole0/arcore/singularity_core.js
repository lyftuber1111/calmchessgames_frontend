/**
 * Wormhole XR - Stage 3: Singularity Core [ARCore Profile]
 * Calibrated for WebXR Immersive-AR in Passthrough Space
 * Database Stage Level: 3 | Environment: Singularity Void Violet
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 3,
  stage_name: 'Singularity Core',
  stage_slug: 'singularity_core',
  environment_theme: 'Singularity Void Violet',
  device: 'arcore',
  xr_mode: 'mobile-ar',
  events_within_level: 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening',
  end_level_event: 'Core Collapse Breakthrough',
  mission_objectives: 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.',
  required_enemy_kills: 20,
  warp_target_distance: 20000,
  objectives: [
    {
        "id": "kills",
        "type": "kills",
        "target": 20,
        "current": 0,
        "title": "Destroy 20 Threats",
        "description": "Destroy 20 hostile 3D units emerging from the wormhole",
        "requiredForWarp": true
    },
    {
        "id": "distance",
        "type": "distance",
        "target": 20000,
        "title": "Wormhole Proximity < 20,000 KM",
        "description": "Navigate vessel to within < 20,000 KM of singularity core",
        "requiredForWarp": true
    }
],
  description: 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.',
  par_score: 25000,

  visual: {
    themeName: 'Singularity Void Violet',
    primaryColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    panelBg: 'rgba(18, 6, 28, 0.88)',
    panelBorder: 'rgba(192, 132, 252, 0.40)',
    uniforms: {
      uColorEdge: 0x330066,
      uColorCore: 0x9933ff,
      uColorHot: 0xf5e6ff,
      uHaloColor: 0xa855f7
    },
    lights: {
      ambient: 0x1a0033,
      center: 0xa855f7
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
        "id": "plasma_torpedo",
        "name": "Plasma Torpedo",
        "icon": "💣",
        "color": "#f59e0b",
        "damage": 5,
        "bullet_speed": 450,
        "energy_drain_pct": 40,
        "can_overheat": 0,
        "cooldown_seconds": 0,
        "acquire_event": "singularity_core_probe",
        "description": "Heavy magnetic payload causing massive kinetic shockwave without overheating."
    },
    "acquirable": []
},

  enemies: [
    {
        "id": "void_guardian",
        "device_type": "all",
        "name": "Singularity Void Guardian (Universal)",
        "enemy_class": "Guardian Frigate",
        "icon": "👾",
        "model_3d_type": "singularity_probe",
        "model_3d_url": "",
        "scale": 1.2,
        "length": 3.8,
        "height": 3.8,
        "depth": 3.8,
        "circumference": 11.94,
        "color": "#a855f7",
        "hits": 15,
        "armor": 70,
        "shield": 6,
        "speed": 150,
        "attack_damage": 35,
        "weapon_name": "Void Disruptor",
        "weapon_damage": 35,
        "weapon_speed": 400,
        "weapon_color": "#a855f7",
        "fire_rate": 2.2,
        "score": 1000,
        "threat": "High",
        "piercing": "plasma_torpedo",
        "quick_effect_primary": "gravitational_vortex",
        "quick_effect_secondary": "arc_lightning",
        "quick_effect_color": "#a855f7",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_quantum_implosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 80,
        "destruction_particle_color": "#a855f7",
        "destruction_particle_scale": 1,
        "fire_rate_seconds": 2.2,
        "fire_rate_ms": 2200,
        "fire_rate_times_per_sec": 0.455,
        "weapons": [
            {
                "name": "Void Disruptor",
                "type": "beam",
                "mount": "dual_wingtip",
                "fire_rate_times_per_sec": 0.455,
                "fire_interval_ms": 2200,
                "fire_rate_seconds": 2.2,
                "damage": 35,
                "speed": 400,
                "color": "#a855f7",
                "is_enabled": 1
            }
        ]
    }
],

  controls: {
    inputMode: 'ar_touch_flight',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: false,
    description: '6-DOF AR device pose tracking, Screen tap targeting, Virtual touch thrust'
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

  // 1. Precise X, Y, Z firing origin point on model (relative to enemy mesh)
  let localMuzzle;
  const hasCustomFirePoint = activeWpn && (
    activeWpn.fire_point_x !== undefined || 
    activeWpn.fire_point_y !== undefined || 
    activeWpn.fire_point_z !== undefined ||
    cfg.fire_point_x !== undefined ||
    cfg.fire_point_y !== undefined ||
    cfg.fire_point_z !== undefined
  );

  if (hasCustomFirePoint) {
    const fx = parseFloat(activeWpn?.fire_point_x !== undefined ? activeWpn.fire_point_x : (cfg.fire_point_x !== undefined ? cfg.fire_point_x : 0.0)) || 0.0;
    const fy = parseFloat(activeWpn?.fire_point_y !== undefined ? activeWpn.fire_point_y : (cfg.fire_point_y !== undefined ? cfg.fire_point_y : -0.15)) || 0.0;
    const fz = parseFloat(activeWpn?.fire_point_z !== undefined ? activeWpn.fire_point_z : (cfg.fire_point_z !== undefined ? cfg.fire_point_z : 1.5)) || 0.0;
    localMuzzle = new THREE.Vector3(fx * shipScale, fy * shipScale, fz * shipScale);
  } else {
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
    localMuzzle = new THREE.Vector3(lateralOffset, verticalOffset, forwardOffset);
  }

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

  // 2. Weapon Graphic Object (.glb / .obj / .gltf) handling with scale and size
  const wpnModelUrl = (activeWpn && (activeWpn.model_url || activeWpn.graphic_object || activeWpn.model_3d_url)) ? (activeWpn.model_url || activeWpn.graphic_object || activeWpn.model_3d_url).trim() : '';

  if (wpnModelUrl && (typeof window.load3DAssetModel === 'function' || typeof load3DAssetModel === 'function')) {
    const loaderFn = (typeof window.load3DAssetModel === 'function') ? window.load3DAssetModel : load3DAssetModel;
    const weaponGroup = new THREE.Group();
    const wScale = (parseFloat(activeWpn.scale) || 1.0) * boltScale;
    const wSizeX = parseFloat(activeWpn.size_x) || 1.0;
    const wSizeY = parseFloat(activeWpn.size_y) || 1.0;
    const wSizeZ = parseFloat(activeWpn.size_z) || 1.0;

    const light = new THREE.PointLight(boltColorHex, 4.0 * boltScale, 36 * boltScale);
    weaponGroup.add(light);
    weaponGroup.scale.set(wScale * wSizeX, wScale * wSizeY, wScale * wSizeZ);
    weaponGroup.position.copy(spawnOrigin);
    weaponGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

    loaderFn(wpnModelUrl, (clonedMesh) => {
      if (clonedMesh) {
        weaponGroup.add(clonedMesh);
      }
    });

    scene.add(weaponGroup);
    mesh = weaponGroup;
    boltSpeed = Math.max(20, Math.min(44, rawSpd * 0.07));

    if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  } else if (isMissile) {
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
    type: wpnModelUrl ? 'custom_model' : (isMissile ? 'missile' : 'beam'),
    spiralTime: Math.random() * Math.PI * 2,
    spawnTime: performance.now(),
    lifetime: 4.8
  });

  return true;
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 3: Singularity Core] Applying ARCore Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 3: SINGULARITY CORE [ARCORE]');
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
    engineApi.showToast('🚀 STAGE 3: SINGULARITY CORE [ARCORE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage, fireEnemyWeapon };;