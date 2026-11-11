/**
 * Wormhole XR - Stage 1: Warp Origin [ARCore Profile]
 * Calibrated for WebXR Immersive ARCore / Passthrough (Real-World Anchored, Low Jitter Profile)
 * Database Stage Level: 1 | Environment: Warp Cyan Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 * Calm Chess Computers 2026
 */
import * as THREE from 'three';

export const stageConfig = {
  stage_level: 1,
  stage_name: 'Warp Origin',
  stage_slug: 'warp_origin',
  environment_theme: 'Warp Cyan Corridor',
  device: 'arcore',
  xr_mode: 'mobile-ar',
  events_within_level: 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert',
  end_level_event: 'Warp Horizon Jump Gate Initialized',
  mission_objectives: 'Destroy 10 hostiles and close within 50,000 KM of wormhole singularity to authorize warp jump.',
  required_enemy_kills: 10,
  warp_target_distance: 50000,
  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 10,
    "title": "Destroy 10 Hostiles",
    "description": "Neutralize 10 hostiles emerging from the wormhole",
    "requiredForWarp": true
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 50000,
    "title": "Wormhole Proximity < 50,000 KM",
    "description": "Approach within 50,000 KM of singularity entry",
    "requiredForWarp": true
  },
  {
    "id": "scan",
    "type": "scan",
    "target": 1,
    "title": "Anomaly Resonance Scan",
    "description": "Calibrate directional sensor on wormhole anomaly",
    "requiredForWarp": false
  },
  {
    "id": "coils",
    "type": "coils",
    "target": 3,
    "title": "Tachyon Warp Coils",
    "description": "Charge all 3 electromagnetic stabilization coils",
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
      ambient: 0x002233,
      center: 0x00f0ff
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
    "id": "red_laser",
    "name": "Neon Red Laser",
    "icon": "🔴",
    "color": "#ff0033",
    "damage": 2,
    "bullet_speed": 550,
    "energy_drain_pct": 10,
    "can_overheat": 1,
    "cooldown_seconds": 5,
    "description": "Standard directed neon plasma pulse. Initial weapon for Stage 1."
  },
  "acquirable": [
    {
      "id": "blue_laser",
      "name": "Cobalt Blue Laser",
      "icon": "🔵",
      "color": "#0088ff",
      "damage": 1,
      "bullet_speed": 700,
      "energy_drain_pct": 30,
      "can_overheat": 1,
      "cooldown_seconds": 10,
      "acquire_event": "default_start",
      "description": "High-density quantum particle beam."
    }
  ]
},

  enemies: [
  {
    "id": "void_recon_drone",
    "name": "Void Recon Drone",
    "enemy_class": "Scout Drone",
    "model_3d_type": "scout_drone",
    "model_3d_url": "",
    "scale": 0.85,
    "length": 2.4,
    "height": 2.4,
    "depth": 2.4,
    "circumference": 7.5,
    "icon": "🛸",
    "color": "#00f0ff",
    "hits": 1,
    "armor": 8,
    "shield": 0,
    "speed": 210,
    "attack_damage": 4,
    "weapon_name": "Plasma Pulse",
    "weapon_damage": 4,
    "weapon_speed": 360,
    "weapon_color": "#00f0ff",
    "fire_rate": 3,
    "score": 100,
    "threat": "Low",
    "piercing": "any"
  },
  {
    "id": "phase_interceptor",
    "name": "Phase Interceptor",
    "enemy_class": "Fast Interceptor",
    "model_3d_type": "interceptor",
    "model_3d_url": "",
    "scale": 0.9,
    "length": 3.6,
    "height": 1.1,
    "depth": 2.9,
    "circumference": 4.4,
    "icon": "🚀",
    "color": "#38bdf8",
    "hits": 3,
    "armor": 18,
    "shield": 1,
    "speed": 270,
    "attack_damage": 8,
    "weapon_name": "Twin Ion Blasters",
    "weapon_damage": 7,
    "weapon_speed": 430,
    "weapon_color": "#38bdf8",
    "fire_rate": 2.4,
    "score": 250,
    "threat": "Medium",
    "piercing": "red_laser"
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

// =============================================================================
// DECOUPLED STAGE ENEMY MOVEMENT LOGIC (ARCORE PROFILE)
// =============================================================================
export function updateEnemyMovement(enemyObj, delta, context) {
  if (!enemyObj || !enemyObj.mesh) return false;
  const T = (typeof THREE !== 'undefined' ? THREE : (context && context.THREE) || (window && window.THREE));
  if (!T) return false;

  const now = (context && context.now) || performance.now();
  const playerPos = (context && context.playerPos) || { x: 0, y: 0, z: 0 };
  const laserBolts = (context && context.laserBolts) || [];
  const activeEnemies = (context && context.activeEnemies) || [];
  const enemyIndex = (context && context.enemyIndex !== undefined) ? context.enemyIndex : -1;
  const distToPlayer = enemyObj.mesh.position.distanceTo(playerPos);

  // 1. Dynamic scale lerp from wormhole mouth (-6.5 to -20 Z) up to base scale at standoff distance
  const spawnZ = (enemyObj.spawnPos && typeof enemyObj.spawnPos.z === 'number') ? enemyObj.spawnPos.z : -6.5;
  const distTraveled = enemyObj.mesh.position.z - spawnZ;
  const totalDist = Math.max(30, (playerPos.z - (enemyObj.targetStopDist || 23.8)) - spawnZ);
  const progress = Math.max(0, Math.min(1.0, distTraveled / totalDist));
  const curScale = T.MathUtils.lerp(0.1, enemyObj.baseScale || 1.0, progress);
  enemyObj.mesh.scale.set(curScale, curScale, curScale);

  if (enemyObj.phase === 'RUSH_OUT') {
    // High-speed outward corridor charge along Z axis towards player
    enemyObj.mesh.position.z += (enemyObj.speed || 40) * delta;
    enemyObj.mesh.position.x += (playerPos.x + (enemyObj.targetScatterX || 0) * 0.25 - enemyObj.mesh.position.x) * delta * 0.45;
    enemyObj.mesh.position.y += (playerPos.y + (enemyObj.targetScatterY || 0) * 0.25 - enemyObj.mesh.position.y) * delta * 0.45;

    // Standoff threshold reached: Stop ~10,000 km (23.8 units) away from player
    if (distToPlayer <= (enemyObj.targetStopDist || 23.8) || enemyObj.mesh.position.z >= (playerPos.z - (enemyObj.targetStopDist || 23.8))) {
      enemyObj.phase = 'SCATTER_AND_EVADE';
      enemyObj.stoppedTime = now;
    }
  } else {
    // SCATTER_AND_EVADE Phase
    // 1. Maintain standoff distance along Z
    const desiredZ = playerPos.z - (enemyObj.targetStopDist || 23.8);
    enemyObj.mesh.position.z += (desiredZ - enemyObj.mesh.position.z) * delta * 2.8;

    // 2. Viewport screen scatter with periodic re-targeting
    const screenTargetX = playerPos.x + (enemyObj.targetScatterX || 0);
    const screenTargetY = playerPos.y + (enemyObj.targetScatterY || 0);
    enemyObj.mesh.position.x += (screenTargetX - enemyObj.mesh.position.x) * delta * 2.4;
    enemyObj.mesh.position.y += (screenTargetY - enemyObj.mesh.position.y) * delta * 2.4;

    if (now > (enemyObj.scatterRetargetTime || 0)) {
      enemyObj.scatterRetargetTime = now + 4200 + Math.random() * 4500;
      const newAng = Math.random() * Math.PI * 2;
      const newRad = 7.5 + Math.random() * 16.5;
      enemyObj.targetScatterX = Math.cos(newAng) * newRad;
      enemyObj.targetScatterY = Math.sin(newAng) * (newRad * 0.75);
    }

    // 3. Multi-harmonic evasive oscillations
    const t = (now - (enemyObj.stoppedTime || now)) * 0.001;
    const evaVx = Math.sin(t * (enemyObj.evaFreqX || 1.8) + (enemyObj.evaPhaseX || 0)) * (enemyObj.evaAmpX || 3.0) * 0.7;
    const evaVy = Math.cos(t * (enemyObj.evaFreqY || 1.6) + (enemyObj.evaPhaseY || 0)) * (enemyObj.evaAmpY || 2.5) * 0.7;
    const evaVz = Math.sin(t * (enemyObj.evaFreqZ || 1.2) + (enemyObj.evaPhaseZ || 0)) * (enemyObj.evaAmpZ || 1.8) * 0.7;
    enemyObj.mesh.position.x += evaVx * delta;
    enemyObj.mesh.position.y += evaVy * delta;
    enemyObj.mesh.position.z += evaVz * delta;

    // 4. Sudden lateral jukes & thruster dodges
    if (now >= (enemyObj.nextJukeTime || 0)) {
      enemyObj.nextJukeTime = now + 1200 + Math.random() * 2000;
      enemyObj.jukeEndTime = now + 350 + Math.random() * 350;
      if (!enemyObj.jukeVelocity) enemyObj.jukeVelocity = new T.Vector3();
      enemyObj.jukeVelocity.set(
        (Math.random() - 0.5) * 18.0,
        (Math.random() - 0.5) * 14.0,
        (Math.random() - 0.5) * 5.0
      );
    }
    if (enemyObj.jukeVelocity) {
      if (now < enemyObj.jukeEndTime) {
        enemyObj.mesh.position.addScaledVector(enemyObj.jukeVelocity, delta);
      } else {
        enemyObj.jukeVelocity.multiplyScalar(Math.max(0, 1.0 - delta * 4.5));
      }
    }

    // 5. Reactive dodge against incoming player laser bolts
    for (let li = 0; li < laserBolts.length; li++) {
      const lbolt = laserBolts[li];
      if (!lbolt || !lbolt.mesh) continue;
      const ldist = lbolt.mesh.position.distanceTo(enemyObj.mesh.position);
      if (ldist < 6.8) {
        const dodgeDir = new T.Vector3().subVectors(enemyObj.mesh.position, lbolt.mesh.position);
        dodgeDir.z = 0;
        if (dodgeDir.lengthSq() > 0.001) {
          dodgeDir.normalize();
          enemyObj.mesh.position.addScaledVector(dodgeDir, 12.0 * delta);
        }
        break;
      }
    }

    // 6. Dynamic Banking, Roll, Pitch, and Attitude Control
    const jukeVx = enemyObj.jukeVelocity ? enemyObj.jukeVelocity.x : 0;
    const jukeVy = enemyObj.jukeVelocity ? enemyObj.jukeVelocity.y : 0;
    const netVx = (screenTargetX - enemyObj.mesh.position.x) * 1.2 + jukeVx;
    const netVy = (screenTargetY - enemyObj.mesh.position.y) * 1.2 + jukeVy;
    enemyObj.mesh.rotation.z = -T.MathUtils.clamp(netVx * 0.05, -0.4, 0.4);
    enemyObj.mesh.rotation.x = T.MathUtils.clamp(netVy * 0.05, -0.3, 0.3);
    enemyObj.mesh.rotation.y = T.MathUtils.clamp(-netVx * 0.03, -0.4, 0.4);
    if (enemyObj.mesh.userData && enemyObj.mesh.userData.spinRing) {
      enemyObj.mesh.userData.spinRing.rotation.z += 6.0 * delta;
    }
  }

  // 7. Proximity Detection: Anti-collision avoidance between active enemies
  for (let j = 0; j < activeEnemies.length; j++) {
    if (j === enemyIndex) continue;
    const other = activeEnemies[j];
    if (!other || !other.mesh) continue;
    const sepVec = new T.Vector3().subVectors(enemyObj.mesh.position, other.mesh.position);
    const sepDist = sepVec.length();
    const otherScale = (other.mesh.scale && typeof other.mesh.scale.x === 'number') ? other.mesh.scale.x : 1.0;
    const curScaleX = (enemyObj.mesh.scale && typeof enemyObj.mesh.scale.x === 'number') ? enemyObj.mesh.scale.x : 1.0;
    const minSafeSep = Math.max(5.0, (curScaleX + otherScale) * 2.4);
    if (sepDist < minSafeSep && sepDist > 0.01) {
      const overlapFactor = (minSafeSep - sepDist) / minSafeSep;
      const repulse = sepVec.normalize().multiplyScalar(overlapFactor * 16.0 * delta);
      enemyObj.mesh.position.add(repulse);
    }
  }

  return true;
}

// =============================================================================
// DECOUPLED STAGE ENEMY WEAPONS LOGIC (ARCORE PROFILE)
// =============================================================================
export function fireEnemyWeapon(enemyObj, context) {
  if (!enemyObj || !enemyObj.mesh) return false;
  const scene = (context && context.scene) || (window.scene);
  if (!scene) return false;
  const T = (typeof THREE !== 'undefined' ? THREE : (context && context.THREE) || (window && window.THREE));
  if (!T) return false;

  const cfg = enemyObj.config || {};
  const wpnName = (cfg.weapon_name || enemyObj.weaponName || '').toLowerCase();
  const modelType = (cfg.model_3d_type || '').toLowerCase();
  const isMissile = /missile|torpedo|disruptor|annihilator|rocket/i.test(wpnName)
    || modelType === 'cruiser'
    || modelType === 'dreadnought'
    || (modelType === 'singularity_probe' && Math.random() > 0.45);

  const spawnOrigin = enemyObj.mesh.position.clone();
  const playerPos = (context && context.playerPos) || { x: 0, y: 0, z: 0 };
  const direction = new T.Vector3().subVectors(playerPos, spawnOrigin).normalize();
  const weaponBoltColor = enemyObj.weaponColor || cfg.weapon_color || '#ff0055';
  const boltColorHex = parseInt(weaponBoltColor.replace('#', '0x'), 16) || 0xff0055;

  let mesh;
  let geometryList = [];
  let materialList = [];
  let boltSpeed;
  let weaponType;

  if (isMissile) {
    weaponType = 'missile';
    const missileGroup = new T.Group();

    // Fuselage
    const bodyGeom = new T.CylinderGeometry(0.24, 0.4, 2.8, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new T.MeshStandardMaterial({ color: 0x2a2d34, metalness: 0.8, roughness: 0.3 });
    const bodyMesh = new T.Mesh(bodyGeom, bodyMat);
    missileGroup.add(bodyMesh);

    // Warhead Cone Tip
    const tipGeom = new T.ConeGeometry(0.44, 1.1, 8);
    tipGeom.rotateX(-Math.PI / 2);
    tipGeom.translate(0, 0, -1.9);
    const tipMat = new T.MeshBasicMaterial({ color: boltColorHex, transparent: true, opacity: 0.95 });
    const tipMesh = new T.Mesh(tipGeom, tipMat);
    missileGroup.add(tipMesh);

    // 4 Stabilizer Fins
    const finGeom = new T.BoxGeometry(0.08, 1.4, 0.6);
    finGeom.translate(0, 0, 0.9);
    const finMat = new T.MeshStandardMaterial({ color: 0x475569 });
    const finH = new T.Mesh(finGeom, finMat);
    const finV = new T.Mesh(finGeom, finMat);
    finV.rotation.z = Math.PI / 2;
    missileGroup.add(finH, finV);

    // Exhaust Plume
    const plumeGeom = new T.ConeGeometry(0.34, 1.3, 8);
    plumeGeom.rotateX(Math.PI / 2);
    plumeGeom.translate(0, 0, 2.0);
    const plumeMat = new T.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.95, blending: T.AdditiveBlending });
    const plumeMesh = new T.Mesh(plumeGeom, plumeMat);
    missileGroup.add(plumeMesh);

    // Radiant Point Light
    const light = new T.PointLight(boltColorHex, 4.0, 32);
    missileGroup.add(light);

    missileGroup.position.copy(spawnOrigin);
    missileGroup.quaternion.setFromUnitVectors(new T.Vector3(0, 0, -1), direction);
    scene.add(missileGroup);
    mesh = missileGroup;

    geometryList = [bodyGeom, tipGeom, finGeom, plumeGeom];
    materialList = [bodyMat, tipMat, finMat, plumeMat];
    boltSpeed = Math.max(22, Math.min(34, (enemyObj.weaponSpeed || cfg.weapon_speed || 480) * 0.065));

    const audioMgr = (context && context.audioMgr) || (context && context.engineApi && context.engineApi.audioMgr) || window.audioMgr;
    if (audioMgr && typeof audioMgr.playEnemyMissile === 'function') {
      audioMgr.playEnemyMissile();
    } else if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  } else {
    weaponType = 'beam';
    const beamGroup = new T.Group();

    // Outer Plasma Sheath
    const sheathGeom = new T.CylinderGeometry(0.44, 0.58, 8.2, 8);
    sheathGeom.rotateX(Math.PI / 2);
    const sheathMat = new T.MeshBasicMaterial({ color: boltColorHex, transparent: true, opacity: 0.92, blending: T.AdditiveBlending });
    const sheathMesh = new T.Mesh(sheathGeom, sheathMat);
    beamGroup.add(sheathMesh);

    // Inner Laser Core
    const coreGeom = new T.CylinderGeometry(0.18, 0.28, 7.5, 8);
    coreGeom.rotateX(Math.PI / 2);
    const coreMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.96 });
    const coreMesh = new T.Mesh(coreGeom, coreMat);
    beamGroup.add(coreMesh);

    // Radiant Point Light
    const light = new T.PointLight(boltColorHex, 4.0, 36);
    beamGroup.add(light);

    beamGroup.position.copy(spawnOrigin);
    beamGroup.quaternion.setFromUnitVectors(new T.Vector3(0, 0, -1), direction);
    scene.add(beamGroup);
    mesh = beamGroup;

    geometryList = [sheathGeom, coreGeom];
    materialList = [sheathMat, coreMat];
    boltSpeed = Math.max(28, Math.min(42, (enemyObj.weaponSpeed || cfg.weapon_speed || 480) * 0.075));

    const audioMgr = (context && context.audioMgr) || (context && context.engineApi && context.engineApi.audioMgr) || window.audioMgr;
    if (audioMgr && typeof audioMgr.playEnemyLaser === 'function') {
      audioMgr.playEnemyLaser();
    }
  }

  const boltsArray = (context && context.enemyBolts) || (context && context.engineApi && context.engineApi.getEnemyBolts && context.engineApi.getEnemyBolts());
  if (boltsArray) {
    boltsArray.push({
      mesh,
      geometryList,
      materialList,
      direction,
      speed: boltSpeed,
      damage: enemyObj.weaponDmg || cfg.weapon_damage || 6,
      type: weaponType,
      spiralTime: Math.random() * Math.PI * 2,
      spawnTime: performance.now(),
      lifetime: 4.8
    });
  }

  return true;
}

// =============================================================================
// STAGE EVENTS & OBJECTIVES SYSTEM (EXTENSIBLE FOR DATABASE & ADMIN GAME MANAGER)
// =============================================================================
export function onSubspaceEntry(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌌 Sub-Space Entry: Wormhole anomaly vector established.');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN - SUB-SPACE ENTRY');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Sub-space Entry');
  }
  return { event: 'Sub-space Entry', handled: true, timestamp: Date.now() };
}

export function onNavBeaconCalibration(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('📡 Nav-Beacon Calibration: Aligning trajectory with singularity axis.');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: NAV-BEACON CALIBRATION');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Nav-Beacon Calibration');
  }
  return { event: 'Nav-Beacon Calibration', handled: true, timestamp: Date.now() };
}

export function onAsteroidDebrisBelt(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('⚠️ Asteroid Debris Belt: High particle turbulence detected!');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: ASTEROID DEBRIS BELT');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Asteroid Debris Belt');
  }
  return { event: 'Asteroid Debris Belt', handled: true, timestamp: Date.now() };
}

export function onAnomalyAlphaSpike(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('⚡ Anomaly Alpha Spike: Tachyon distortion surge incoming!');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: ANOMALY ALPHA SPIKE');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Anomaly Alpha Spike');
  }
  return { event: 'Anomaly Alpha Spike', handled: true, timestamp: Date.now() };
}

export function onPlasmaSurgeAlert(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🔥 Plasma Surge Alert: Deflector shields under thermal excitation!');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: PLASMA SURGE ALERT');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Plasma Surge Alert');
  }
  return { event: 'Plasma Surge Alert', handled: true, timestamp: Date.now() };
}

export function onWarpHorizonJumpGateInitialized(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌀 Warp Horizon Jump Gate Initialized! Authorizing jump sequence.');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP HORIZON JUMP GATE INITIALIZED');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Warp Horizon Jump Gate Initialized');
  }
  return { event: 'Warp Horizon Jump Gate Initialized', handled: true, timestamp: Date.now() };
}

export function onStageQuarterApproach(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌌 Corridor Quarter Ingress: 75,000 KM threshold breached.');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('stage_quarter_approach');
  }
  return { event: 'stage_quarter_approach', handled: true, timestamp: Date.now() };
}

export function onHalfwayApproach(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('⚡ Halfway Approach: 50,000 KM reached, singularity grav-well accelerating.');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('halfway_approach');
  }
  return { event: 'halfway_approach', handled: true, timestamp: Date.now() };
}

export function onResonanceAlignment(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('📡 Resonance Alignment Achieved: Sensor array locked.');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('resonance_alignment_achieved');
  }
  return { event: 'resonance_alignment_achieved', handled: true, timestamp: Date.now() };
}

export function onSingularityProximity(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌀 Singularity Proximity: Approaching < 25,000 KM boundary!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('singularity_proximity');
  }
  return { event: 'singularity_proximity', handled: true, timestamp: Date.now() };
}

export function onWarpGateContact(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 Warp Gate Contact: Close approach within 10,000 KM!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('warp_gate_contact');
  }
  return { event: 'warp_gate_contact', handled: true, timestamp: Date.now() };
}

export function onObjectiveKills(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🎯 OBJECTIVE COMPLETE: Neutralized stage hostile quota!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('objective_kills_complete');
  }
  return { event: 'objective_kills_complete', objective: 'kills', status: 'completed', timestamp: Date.now() };
}

export function onObjectiveDistance(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🎯 OBJECTIVE COMPLETE: Singularity proximity threshold achieved!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('objective_distance_complete');
  }
  return { event: 'objective_distance_complete', objective: 'distance', status: 'completed', timestamp: Date.now() };
}

export function onAllObjectivesComplete(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 ALL STAGE OBJECTIVES COMPLETE: Hyper-Warp authorization granted!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('all_required_objectives_complete');
  }
  return { event: 'all_required_objectives_complete', objective: 'all_required_objectives_complete', status: 'completed', timestamp: Date.now() };
}

export function onObjectiveScan(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('📡 OBJECTIVE MET: Anomaly resonance lock verified (432.8 THz)!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('objective_scan_complete');
  }
  return { event: 'objective_scan_complete', objective: 'scan', status: 'completed', timestamp: Date.now() };
}

export function onObjectiveCoils(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('⚡ OBJECTIVE MET: 3/3 Tachyon warp coils synchronized!');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('objective_coils_complete');
  }
  return { event: 'objective_coils_complete', objective: 'coils', status: 'completed', timestamp: Date.now() };
}

export const stageEvents = {
  'Sub-space Entry': onSubspaceEntry,
  'sub-space entry': onSubspaceEntry,
  'subspaceentry': onSubspaceEntry,
  'Nav-Beacon Calibration': onNavBeaconCalibration,
  'nav-beacon calibration': onNavBeaconCalibration,
  'navbeaconcalibration': onNavBeaconCalibration,
  'Asteroid Debris Belt': onAsteroidDebrisBelt,
  'asteroid debris belt': onAsteroidDebrisBelt,
  'asteroiddebrisbelt': onAsteroidDebrisBelt,
  'Anomaly Alpha Spike': onAnomalyAlphaSpike,
  'anomaly alpha spike': onAnomalyAlphaSpike,
  'anomalyalphaspike': onAnomalyAlphaSpike,
  'Plasma Surge Alert': onPlasmaSurgeAlert,
  'plasma surge alert': onPlasmaSurgeAlert,
  'plasmasurgealert': onPlasmaSurgeAlert,
  'Warp Horizon Jump Gate Initialized': onWarpHorizonJumpGateInitialized,
  'warp horizon jump gate initialized': onWarpHorizonJumpGateInitialized,
  'warphorizonjumpgateinitialized': onWarpHorizonJumpGateInitialized,
  'stage_quarter_approach': onStageQuarterApproach,
  'halfway_approach': onHalfwayApproach,
  'resonance_alignment_achieved': onResonanceAlignment,
  'singularity_proximity': onSingularityProximity,
  'warp_gate_contact': onWarpGateContact,
  'objective_kills_complete': onObjectiveKills,
  'kills': onObjectiveKills,
  'objective_distance_complete': onObjectiveDistance,
  'distance': onObjectiveDistance,
  'all_required_objectives_complete': onAllObjectivesComplete,
  'objective_scan_complete': onObjectiveScan,
  'scan': onObjectiveScan,
  'objective_coils_complete': onObjectiveCoils,
  'coils': onObjectiveCoils,
};

export function registerStageEvent(eventName, handlerFn) {
  if (!eventName || typeof handlerFn !== 'function') return false;
  stageEvents[eventName] = handlerFn;
  stageEvents[eventName.toLowerCase()] = handlerFn;
  stageEvents[eventName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = handlerFn;
  return true;
}

export function handleStageEvent(eventName, engineApi, eventData = null) {
  if (!eventName) return false;
  const key = eventName.trim();
  const normKey = key.toLowerCase();
  const stripKey = normKey.replace(/[^a-zA-Z0-9]/g, '');
  const handler = stageEvents[key] || stageEvents[normKey] || stageEvents[stripKey];
  if (typeof handler === 'function') {
    try {
      return handler(engineApi, eventData);
    } catch (err) {
      console.warn(`[StageEvent Error] Execution failed for '${eventName}':`, err);
    }
  }
  return false;
}

// =============================================================================
// APPLY STAGE & ENGINE INITIALIZATION
// =============================================================================
export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 1: Warp Origin] Applying ARCore Profile configuration & decoupled systems...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN [ARCORE]');
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
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 STAGE 1: WARP ORIGIN [ARCORE] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(false);
  }

  // Register decoupled systems
  if (typeof engineApi.setEnemyMovementHandler === 'function') {
    engineApi.setEnemyMovementHandler(updateEnemyMovement);
  }
  if (typeof engineApi.setEnemyWeaponHandler === 'function') {
    engineApi.setEnemyWeaponHandler(fireEnemyWeapon);
  }
  if (typeof engineApi.setStageEventHandlers === 'function') {
    engineApi.setStageEventHandlers(stageEvents);
  }
  if (typeof engineApi.setStageEventHandler === 'function') {
    engineApi.setStageEventHandler(handleStageEvent);
  }

  // Trigger initial stage entry event
  handleStageEvent('Sub-space Entry', engineApi);

  return stageConfig;
}

export default {
  stageConfig,
  updateEnemyMovement,
  fireEnemyWeapon,
  stageEvents,
  registerStageEvent,
  handleStageEvent,
  applyStage
};
