/**
 * Wormhole XR - Stage 1: Warp Origin [Mobile Profile]
 * Calibrated for Mobile Handheld (Touch Virtual Joysticks, Gyroscope / Landscape Mode)
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
  mission_objectives: 'Destroy 10 Void Recon Drones and pilot vessel to within < 50,000 KM of singularity core to unlock warp.',
  required_enemy_kills: 10,
  warp_target_distance: 50000,
  objectives: [
    {
      "id": "kills",
      "type": "kills",
      "target": 10,
      "current": 0,
      "title": "Destroy 10 Threats",
      "description": "Destroy 10 hostile 3D units emerging from the wormhole",
      "requiredForWarp": true
    },
    {
      "id": "distance",
      "type": "distance",
      "target": 50000,
      "title": "Wormhole Proximity < 50,000 KM",
      "description": "Navigate vessel to within < 50,000 KM of singularity core",
      "requiredForWarp": true
    },
    {
      "id": "scan",
      "type": "scan",
      "target": 1,
      "title": "Resonance Anomaly Scan",
      "description": "Scan singularity anomaly to map gravitational shear",
      "requiredForWarp": false
    },
    {
      "id": "coils",
      "type": "coils",
      "target": 3,
      "title": "Tachyon Warp Coils",
      "description": "Calibrate all 3 coils for hyperspace stability",
      "requiredForWarp": false
    }
  ],
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
      ambient: 0xa0c8e0,
      center: 0x00f0ff,
      sunlight: 0xffffff,
      headlight: 0xe0f8ff
    },
    particles: {
      count: 3200,
      starCount: 1800,
      dustCount: 450,
      speed: 0.85
    },
    flight: {
      speed: 42,
      boostMultiplier: 2.0,
      pitchSpeed: 0.0024,
      yawSpeed: 0.0024
    }
  },

  weapons: {
    "initial": {
      "id": "red_laser",
      "name": "Red Laser",
      "icon": "🔴",
      "color": "#ff2244",
      "damage": 2,
      "bullet_speed": 550,
      "energy_drain_pct": 1,
      "can_overheat": 1,
      "cooldown_seconds": 5,
      "acquire_event": "default_start",
      "description": "Standard high-cadence plasma emitter with twin focus beams."
    },
    "acquirable": [
      {
        "id": "blue_laser",
        "name": "Blue Laser",
        "icon": "🔵",
        "color": "#00d4ff",
        "damage": 3,
        "bullet_speed": 700,
        "energy_drain_pct": 5,
        "can_overheat": 1,
        "cooldown_seconds": 10,
        "acquire_event": "default_start",
        "description": "High-impact coherent photon beam with deep penetration."
      }
    ]
  },

  enemies: [
    {
      "id": "void_recon_drone_mobile",
      "device_type": "mobile",
      "name": "Void Recon Drone (Mobile)",
      "enemy_class": "Scout Drone",
      "icon": "🛸",
      "model_3d_type": "custom_glb",
      "model_3d_url": "mobile/warp_origin_images/recon_drone_2.8m.glb",
      "scale": 1.35,
      "length": 2.8,
      "height": 2.8,
      "depth": 2.8,
      "circumference": 8.8,
      "color": "#00f0ff",
      "hits": 1,
      "armor": 1,
      "shield": 0,
      "speed": 220,
      "attack_damage": 1,
      "weapon_name": "Plasma Pulse",
      "weapon_damage": 1,
      "weapon_speed": 450,
      "weapon_color": "#00f0ff",
      "fire_rate": 2.5,
      "score": 100,
      "threat": "Low",
      "piercing": "any",
      "quick_effect_primary": "plasma_aura",
      "quick_effect_secondary": "sparks_burst",
      "quick_effect_color": "#00f0ff",
      "quick_effect_intensity": 1,
      "quick_effect_speed": 1,
      "destruction_particle_type": "procedural_sparks_explosion",
      "destruction_particle_url": "",
      "destruction_particle_count": 30,
      "destruction_particle_color": "#00f0ff",
      "destruction_particle_scale": 1
    },
    {
      "id": "phase_interceptor_all",
      "device_type": "mobile",
      "name": "Phase Interceptor (Universal)",
      "enemy_class": "Fast Interceptor",
      "icon": "🚀",
      "model_3d_type": "custom_glb",
      "model_3d_url": "mobile/warp_origin_images/drone_phase_interceptor_3.glb",
      "scale": 1.30,
      "length": 4.2,
      "height": 1.3,
      "depth": 3.4,
      "circumference": 5,
      "color": "#38bdf8",
      "hits": 1,
      "armor": 1,
      "shield": 0,
      "speed": 220,
      "attack_damage": 1,
      "weapon_name": "Dual Ion Cannon",
      "weapon_damage": 1,
      "weapon_speed": 550,
      "weapon_color": "#38bdf8",
      "fire_rate": 1.8,
      "score": 250,
      "threat": "Medium",
      "piercing": "red_laser",
      "quick_effect_primary": "engine_ion_thrust",
      "quick_effect_secondary": "plasma_aura",
      "quick_effect_color": "#38bdf8",
      "quick_effect_intensity": 1,
      "quick_effect_speed": 1,
      "destruction_particle_type": "procedural_plasma_shatter",
      "destruction_particle_url": "",
      "destruction_particle_count": 45,
      "destruction_particle_color": "#38bdf8",
      "destruction_particle_scale": 1
    }
  ],

  controls: {
    inputMode: 'virtual_joysticks',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: true,
    description: 'Virtual dual-touch joysticks: Left Thumb Flight Thrust, Right Thumb Aim & Auto-Fire'
  }
};

export function updateEnemyMovement(e, delta, context) {
  if (!e || !e.mesh) return false;
  const THREE = (context && context.THREE) || window.THREE;
  if (!THREE) return false;

  const now = (context && context.now) || performance.now();
  const playerPos = (context && context.playerPos) || { x: 0, y: 0, z: 0 };
  const laserBolts = (context && context.laserBolts) || [];
  const activeEnemies = (context && context.activeEnemies) || [];
  const enemyIndex = (context && context.enemyIndex !== undefined) ? context.enemyIndex : -1;
  const distToPlayer = e.mesh.position.distanceTo(playerPos);

  const stopDist = 10000 / 420; // 23.8095
  const targetStopDist = e.targetStopDist || stopDist;
  const targetZ = playerPos.z - targetStopDist;
  const spawnZ = (e.spawnPos && typeof e.spawnPos.z === 'number') ? e.spawnPos.z : -6.5;

  const totalDist = Math.max(10, targetZ - spawnZ);
  const distTraveled = e.mesh.position.z - spawnZ;
  const progress = THREE.MathUtils.clamp(distTraveled / totalDist, 0.0, 1.0);
  const curScale = THREE.MathUtils.lerp(0.12, e.baseScale || 1.3, progress);
  e.mesh.scale.set(curScale, curScale, curScale);

  // Requirement: Rotate custom 3D model asset clockwise 90 degrees around Y so front natively faces the player (+Z)
  if (e.mesh.userData && e.mesh.userData.loadedAsset) {
    if (e.mesh.userData.loadedAsset.rotation.y !== -Math.PI / 2) {
      e.mesh.userData.loadedAsset.rotation.y = -Math.PI / 2;
    }
  }

  const basePitchDown = 0.22;

  if (e.phase === 'RUSH_OUT') {
    e.mesh.position.z += (e.speed || 42) * delta;
    e.mesh.position.x += (playerPos.x + (e.targetScatterX || 0) * 0.25 - e.mesh.position.x) * delta * 0.55;
    e.mesh.position.y += (playerPos.y + (e.targetScatterY || 0) * 0.25 - e.mesh.position.y) * delta * 0.55;

    e.mesh.rotation.set(basePitchDown, 0, 0);

    if (e.mesh.position.z >= targetZ || distToPlayer <= targetStopDist) {
      e.mesh.position.z = targetZ;
      e.phase = 'SCATTER_AND_EVADE';
      e.stoppedTime = now;
    }
  } else {
    e.mesh.position.z += (targetZ - e.mesh.position.z) * delta * 3.2;

    const screenTargetX = playerPos.x + (e.targetScatterX || 0);
    const screenTargetY = playerPos.y + (e.targetScatterY || 0);
    e.mesh.position.x += (screenTargetX - e.mesh.position.x) * delta * 2.2;
    e.mesh.position.y += (screenTargetY - e.mesh.position.y) * delta * 2.2;

    if (now > (e.scatterRetargetTime || 0)) {
      e.scatterRetargetTime = now + 4000 + Math.random() * 4000;
      const newAng = Math.random() * Math.PI * 2;
      const newRad = 6.0 + Math.random() * 14.0;
      e.targetScatterX = Math.cos(newAng) * newRad;
      e.targetScatterY = Math.sin(newAng) * (newRad * 0.72);
    }

    const t = (now - (e.stoppedTime || now)) * 0.001;
    const evaVx = Math.sin(t * (e.evaFreqX || 1.8) + (e.evaPhaseX || 0)) * (e.evaAmpX || 2.8);
    const evaVy = Math.cos(t * (e.evaFreqY || 1.6) + (e.evaPhaseY || 0)) * (e.evaAmpY || 2.2);
    const evaVz = Math.sin(t * (e.evaFreqZ || 1.2) + (e.evaPhaseZ || 0)) * (e.evaAmpZ || 1.5);
    e.mesh.position.x += evaVx * delta;
    e.mesh.position.y += evaVy * delta;
    e.mesh.position.z += evaVz * delta;

    if (now >= (e.nextJukeTime || 0)) {
      e.nextJukeTime = now + 1500 + Math.random() * 2000;
      e.jukeEndTime = now + 350 + Math.random() * 350;
      if (e.jukeVelocity && typeof e.jukeVelocity.set === 'function') {
        e.jukeVelocity.set(
          (Math.random() - 0.5) * 28,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 6
        );
      }
    }
    if (e.jukeVelocity) {
      if (now < e.jukeEndTime) {
        e.mesh.position.addScaledVector(e.jukeVelocity, delta);
      } else {
        e.jukeVelocity.multiplyScalar(Math.max(0, 1.0 - delta * 4.5));
      }
    }

    for (let li = 0; li < laserBolts.length; li++) {
      const lbolt = laserBolts[li];
      if (!lbolt || !lbolt.mesh) continue;
      const ldist = lbolt.mesh.position.distanceTo(e.mesh.position);
      if (ldist < 7.2) {
        const dodgeDir = new THREE.Vector3().subVectors(e.mesh.position, lbolt.mesh.position);
        dodgeDir.z = 0;
        if (dodgeDir.lengthSq() > 0.001) {
          dodgeDir.normalize();
          e.mesh.position.addScaledVector(dodgeDir, 20.0 * delta);
        }
        break;
      }
    }

    const jukeVx = e.jukeVelocity ? e.jukeVelocity.x : 0;
    const jukeVy = e.jukeVelocity ? e.jukeVelocity.y : 0;
    const netVx = (screenTargetX - e.mesh.position.x) * 1.1 + jukeVx + evaVx;
    const netVy = (screenTargetY - e.mesh.position.y) * 1.1 + jukeVy + evaVy;

    const roll = -THREE.MathUtils.clamp(netVx * 0.045, -0.65, 0.65);
    const yaw = THREE.MathUtils.clamp(-netVx * 0.025, -0.35, 0.35);
    const pitch = basePitchDown + THREE.MathUtils.clamp(netVy * 0.04, -0.22, 0.22);
    e.mesh.rotation.set(pitch, yaw, roll, 'YXZ');

    if (e.mesh.userData && e.mesh.userData.spinRing) {
      e.mesh.userData.spinRing.rotation.z += 6.0 * delta;
    }
  }

  for (let j = 0; j < activeEnemies.length; j++) {
    if (j === enemyIndex) continue;
    const other = activeEnemies[j];
    if (!other || !other.mesh) continue;
    const sepVec = new THREE.Vector3().subVectors(e.mesh.position, other.mesh.position);
    const sepDist = sepVec.length();
    const otherScale = (other.mesh.scale && typeof other.mesh.scale.x === 'number') ? other.mesh.scale.x : 1.0;
    const curScaleX = (e.mesh.scale && typeof e.mesh.scale.x === 'number') ? e.mesh.scale.x : 1.0;
    const minSafeSep = Math.max(5.5, (curScaleX + otherScale) * 2.8);
    if (sepDist < minSafeSep && sepDist > 0.001) {
      const overlapFactor = (minSafeSep - sepDist) / minSafeSep;
      const repulse = sepVec.normalize().multiplyScalar(overlapFactor * 20.0 * delta);
      e.mesh.position.add(repulse);
    }
  }

  return true;
}

export function fireEnemyWeapon(enemyObj, context) {
  if (!enemyObj || !enemyObj.mesh) return false;
  const THREE = (context && context.THREE) || window.THREE;
  const scene = (context && context.scene) || window.scene;
  const state = (context && context.state) || window.state;
  const cameraRig = (context && context.cameraRig) || window.cameraRig;
  const enemyBolts = (context && context.enemyBolts) || window.enemyBolts;
  const audioMgr = (context && context.audioMgr) || window.audioMgr;
  if (!THREE || !scene || !enemyBolts) return false;

  const cfg = enemyObj.config || {};
  const wpnName = (cfg.weapon_name || enemyObj.weaponName || 'Plasma Pulse').toLowerCase();
  const isMissile = /missile|torpedo|disruptor|annihilator|rocket/i.test(wpnName);

  const shipScale = (enemyObj.mesh.scale && typeof enemyObj.mesh.scale.x === 'number') ? enemyObj.mesh.scale.x : 1.0;
  const cfgDepth = (parseFloat(cfg.depth) || 3.0) * shipScale;
  const cfgLength = (parseFloat(cfg.length) || 3.0) * shipScale;

  enemyObj.lastGunSide = (enemyObj.lastGunSide === 1) ? -1 : 1;
  const isDualCannon = /dual|twin|interceptor/i.test(wpnName) || /interceptor/i.test(cfg.enemy_id || '');
  const lateralOffset = isDualCannon ? (enemyObj.lastGunSide * cfgLength * 0.32) : 0;
  const forwardOffset = cfgDepth * 0.48;
  const verticalOffset = -0.15 * shipScale;

  const localMuzzle = new THREE.Vector3(lateralOffset, verticalOffset, forwardOffset);
  const spawnOrigin = enemyObj.mesh.position.clone().add(localMuzzle.applyQuaternion(enemyObj.mesh.quaternion));

  const playerPos = (state && state.isXR && cameraRig) ? cameraRig.position : ((state && state.position) ? state.position : new THREE.Vector3(0, 0, 220));
  const direction = new THREE.Vector3().subVectors(playerPos, spawnOrigin).normalize();
  const weaponBoltColor = cfg.weapon_color || enemyObj.weaponColor || '#00f0ff';
  const boltColorHex = parseInt(weaponBoltColor.replace('#', '0x'), 16) || 0x00f0ff;

  const boltScale = THREE.MathUtils.clamp(shipScale * 0.85, 0.6, 2.5);

  let mesh;
  let geometryList = [];
  let materialList = [];
  let boltSpeed;
  let weaponType;

  if (isMissile) {
    weaponType = 'missile';
    const missileGroup = new THREE.Group();

    const bodyGeom = new THREE.CylinderGeometry(0.24, 0.4, 2.8, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2d34, metalness: 0.8, roughness: 0.3 });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    missileGroup.add(bodyMesh);

    const tipGeom = new THREE.ConeGeometry(0.44, 1.1, 8);
    tipGeom.rotateX(-Math.PI / 2);
    tipGeom.translate(0, 0, -1.9);
    const tipMat = new THREE.MeshBasicMaterial({ color: boltColorHex, transparent: true, opacity: 0.95 });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    missileGroup.add(tipMesh);

    const plumeGeom = new THREE.ConeGeometry(0.34, 1.3, 8);
    plumeGeom.rotateX(Math.PI / 2);
    plumeGeom.translate(0, 0, 2.0);
    const plumeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
    const plumeMesh = new THREE.Mesh(plumeGeom, plumeMat);
    missileGroup.add(plumeMesh);

    const light = new THREE.PointLight(boltColorHex, 4.0 * boltScale, 32 * boltScale);
    missileGroup.add(light);

    missileGroup.scale.set(boltScale, boltScale, boltScale);
    missileGroup.position.copy(spawnOrigin);
    missileGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    scene.add(missileGroup);
    mesh = missileGroup;

    geometryList = [bodyGeom, tipGeom, plumeGeom];
    materialList = [bodyMat, tipMat, plumeMat];
    boltSpeed = Math.max(22, Math.min(36, (parseInt(cfg.weapon_speed || enemyObj.weaponSpeed || 450)) * 0.065));

    if (audioMgr && typeof audioMgr.playEnemyMissile === 'function') {
      audioMgr.playEnemyMissile();
    } else if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  } else {
    weaponType = 'beam';
    const beamGroup = new THREE.Group();

    const sheathGeom = new THREE.CylinderGeometry(0.44, 0.58, 8.2, 8);
    sheathGeom.rotateX(Math.PI / 2);
    const sheathMat = new THREE.MeshBasicMaterial({
      color: boltColorHex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    const sheathMesh = new THREE.Mesh(sheathGeom, sheathMat);
    beamGroup.add(sheathMesh);

    const coreGeom = new THREE.CylinderGeometry(0.18, 0.28, 7.5, 8);
    coreGeom.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.96 });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    beamGroup.add(coreMesh);

    const light = new THREE.PointLight(boltColorHex, 4.0 * boltScale, 36 * boltScale);
    beamGroup.add(light);

    beamGroup.scale.set(boltScale, boltScale, boltScale);
    beamGroup.position.copy(spawnOrigin);
    beamGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    scene.add(beamGroup);
    mesh = beamGroup;

    geometryList = [sheathGeom, coreGeom];
    materialList = [sheathMat, coreMat];
    boltSpeed = Math.max(28, Math.min(44, (parseInt(cfg.weapon_speed || enemyObj.weaponSpeed || 450)) * 0.075));

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
    damage: parseInt(cfg.weapon_damage || cfg.attack_damage || enemyObj.weaponDmg || 1),
    type: weaponType,
    spiralTime: Math.random() * Math.PI * 2,
    spawnTime: performance.now(),
    lifetime: 4.8
  });

  return true;
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 1: Warp Origin] Applying Mobile Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN [MOBILE]');
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

  if (typeof engineApi.setEnemyMovementHandler === 'function') {
    engineApi.setEnemyMovementHandler(updateEnemyMovement);
  }
  if (typeof engineApi.setEnemyWeaponHandler === 'function') {
    engineApi.setEnemyWeaponHandler(fireEnemyWeapon);
  }

  const THREE = window.THREE;
  if (THREE && engineApi.scene) {
    if (engineApi.ambientLight) {
      engineApi.ambientLight.color.setHex(0xa0c8e0);
      engineApi.ambientLight.intensity = 1.4;
    }
    let sunLight = engineApi.scene.getObjectByName('stage1_sunlight');
    if (!sunLight) {
      sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
      sunLight.name = 'stage1_sunlight';
      sunLight.position.set(30, 50, 60);
      engineApi.scene.add(sunLight);
    } else {
      sunLight.intensity = 2.0;
    }
    let headLight = (engineApi.camera || engineApi.cameraRig)?.getObjectByName('stage1_headlight');
    if (!headLight && engineApi.camera) {
      headLight = new THREE.DirectionalLight(0xe0f8ff, 1.8);
      headLight.name = 'stage1_headlight';
      headLight.position.set(0, 1.5, 4);
      engineApi.camera.add(headLight);
    } else if (headLight) {
      headLight.intensity = 1.8;
    }
    let hemiLight = engineApi.scene.getObjectByName('stage1_hemilight');
    if (!hemiLight) {
      hemiLight = new THREE.HemisphereLight(0xaad8ff, 0x112233, 1.25);
      hemiLight.name = 'stage1_hemilight';
      engineApi.scene.add(hemiLight);
    }
  }

  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 STAGE 1: WARP ORIGIN [MOBILE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage, updateEnemyMovement, fireEnemyWeapon };
