/**
 * Wormhole XR - Stage 2: Event Horizon [VR Profile]
 * Calibrated for WebXR Immersive VR Headset (6-DOF Motion Controllers, Stereoscopic Comfort Profile)
 * Database Stage Level: 2 | Environment: Event Horizon Amber
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 * Calm Chess Computers 2026
 */
import * as THREE from 'three';

export const stageConfig = {
  stage_level: 2,
  stage_name: 'Event Horizon',
  stage_slug: 'event_horizon',
  environment_theme: 'Event Horizon Amber',
  device: 'vr',
  xr_mode: 'desktop-vr',
  events_within_level: 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert',
  end_level_event: 'Singularity Perimeter Breach',
  mission_objectives: 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.',
  required_enemy_kills: 15,
  warp_target_distance: 35000,
  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 15,
    "title": "Destroy 15 Threats",
    "description": "Neutralize 15 hostile units traversing the event horizon",
    "requiredForWarp": true
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 35000,
    "title": "Wormhole Proximity < 35,000 KM",
    "description": "Close distance to < 35,000 KM of gravitational threshold",
    "requiredForWarp": true
  }
],
  description: 'High-velocity relativistic light-horizon boundary with intense magnetic shear.',
  par_score: 12000,

  visual: {
    themeName: 'Event Horizon Amber',
    primaryColor: '#ffd166',
    glowColor: 'rgba(255, 209, 102, 0.45)',
    panelBg: 'rgba(24, 14, 2, 0.88)',
    panelBorder: 'rgba(255, 209, 102, 0.40)',
    uniforms: {
      uColorEdge: 0x663300,
      uColorCore: 0xff9900,
      uColorHot: 0xfff4d6,
      uHaloColor: 0xffaa00
    },
    lights: {
      ambient: 0x331a00,
      center: 0xffaa00
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
    "id": "tachyon_lance",
    "name": "Tachyon Lance",
    "icon": "⚡",
    "color": "#ffd166",
    "damage": 3,
    "bullet_speed": 850,
    "energy_drain_pct": 20,
    "can_overheat": 1,
    "cooldown_seconds": 7,
    "acquire_event": "warp_horizon_jump",
    "description": "Superluminal phase particle array unlocked after horizon traversal."
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
      "acquire_event": "default_start"
    }
  ]
},

  enemies: [
  {
    "id": "tachyon_cruiser",
    "name": "Horizon Tachyon Cruiser",
    "enemy_class": "Heavy Cruiser",
    "model_3d_type": "cruiser",
    "model_3d_url": "",
    "scale": 1.4,
    "length": 4,
    "height": 2.8,
    "depth": 6,
    "circumference": 12,
    "icon": "🛰️",
    "color": "#ffd166",
    "hits": 8,
    "armor": 50,
    "shield": 4,
    "speed": 180,
    "attack_damage": 20,
    "weapon_name": "Tachyon Lance Cannon",
    "weapon_damage": 14,
    "weapon_speed": 580,
    "weapon_color": "#ffd166",
    "fire_rate": 3.2,
    "score": 500,
    "threat": "High",
    "piercing": "tachyon_lance"
  },
  {
    "id": "phase_interceptor",
    "name": "Phase Interceptor",
    "enemy_class": "Fast Interceptor",
    "model_3d_type": "interceptor",
    "model_3d_url": "",
    "scale": 1.15,
    "length": 4.5,
    "height": 1.4,
    "depth": 3.6,
    "circumference": 5.4,
    "icon": "🚀",
    "color": "#f59e0b",
    "hits": 4,
    "armor": 28,
    "shield": 2,
    "speed": 370,
    "attack_damage": 11,
    "weapon_name": "Dual Ion Cannon",
    "weapon_damage": 9,
    "weapon_speed": 530,
    "weapon_color": "#f59e0b",
    "fire_rate": 2,
    "score": 275,
    "threat": "Medium",
    "piercing": "red_laser"
  }
],

  controls: {
    inputMode: '6dof_controllers',
    showVirtualJoysticks: false,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'Dual 6-DOF VR motion controllers, Trigger primary fire, Grip boost thrust'
  }
};

// =============================================================================
// DECOUPLED STAGE ENEMY MOVEMENT LOGIC (VR PROFILE)
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
    const evaVx = Math.sin(t * (enemyObj.evaFreqX || 1.8) + (enemyObj.evaPhaseX || 0)) * (enemyObj.evaAmpX || 3.0) * 0.85;
    const evaVy = Math.cos(t * (enemyObj.evaFreqY || 1.6) + (enemyObj.evaPhaseY || 0)) * (enemyObj.evaAmpY || 2.5) * 0.85;
    const evaVz = Math.sin(t * (enemyObj.evaFreqZ || 1.2) + (enemyObj.evaPhaseZ || 0)) * (enemyObj.evaAmpZ || 1.8) * 0.85;
    enemyObj.mesh.position.x += evaVx * delta;
    enemyObj.mesh.position.y += evaVy * delta;
    enemyObj.mesh.position.z += evaVz * delta;

    // 4. Sudden lateral jukes & thruster dodges
    if (now >= (enemyObj.nextJukeTime || 0)) {
      enemyObj.nextJukeTime = now + 1200 + Math.random() * 2000;
      enemyObj.jukeEndTime = now + 350 + Math.random() * 350;
      if (!enemyObj.jukeVelocity) enemyObj.jukeVelocity = new T.Vector3();
      enemyObj.jukeVelocity.set(
        (Math.random() - 0.5) * 25.0,
        (Math.random() - 0.5) * 18.0,
        (Math.random() - 0.5) * 6.0
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
          enemyObj.mesh.position.addScaledVector(dodgeDir, 15.0 * delta);
        }
        break;
      }
    }

    // 6. Dynamic Banking, Roll, Pitch, and Attitude Control
    const jukeVx = enemyObj.jukeVelocity ? enemyObj.jukeVelocity.x : 0;
    const jukeVy = enemyObj.jukeVelocity ? enemyObj.jukeVelocity.y : 0;
    const netVx = (screenTargetX - enemyObj.mesh.position.x) * 1.2 + jukeVx;
    const netVy = (screenTargetY - enemyObj.mesh.position.y) * 1.2 + jukeVy;
    enemyObj.mesh.rotation.z = -T.MathUtils.clamp(netVx * 0.05, -0.52, 0.52);
    enemyObj.mesh.rotation.x = T.MathUtils.clamp(netVy * 0.05, -0.38, 0.38);
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
// DECOUPLED STAGE ENEMY WEAPONS LOGIC (VR PROFILE)
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
export function onTachyonFluxDistortions(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('⚡ Tachyon Flux Distortions: Relativistic space-time compression active.');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON - TACHYON FLUX DISTORTIONS');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Tachyon Flux Distortions');
  }
  return { event: 'Tachyon Flux Distortions', handled: true, timestamp: Date.now() };
}

export function onIonCloudInterference(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌩️ Ion Cloud Interference: Sensor telemetry experiencing magnetic shear.');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: ION CLOUD INTERFERENCE');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Ion Cloud Interference');
  }
  return { event: 'Ion Cloud Interference', handled: true, timestamp: Date.now() };
}

export function onInterceptorAmbushWave(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚨 Interceptor Ambush Wave: Hostile phase interceptors emerging from horizon!');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: INTERCEPTOR AMBUSH WAVE');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Interceptor Ambush Wave');
  }
  return { event: 'Interceptor Ambush Wave', handled: true, timestamp: Date.now() };
}

export function onWormholeCoilResonanceAlert(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🔊 Wormhole Coil Resonance Alert: Singularity acoustic frequencies peaking.');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: WORMHOLE COIL RESONANCE ALERT');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Wormhole Coil Resonance Alert');
  }
  return { event: 'Wormhole Coil Resonance Alert', handled: true, timestamp: Date.now() };
}

export function onSingularityPerimeterBreach(engineApi, eventData) {
  if (engineApi && typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌀 Singularity Perimeter Breach: Light-horizon penetrated, singularity core ahead!');
  }
  if (engineApi && typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: SINGULARITY PERIMETER BREACH');
  }
  if (engineApi && typeof engineApi.checkEventPowerupAppearance === 'function') {
    engineApi.checkEventPowerupAppearance('Singularity Perimeter Breach');
  }
  return { event: 'Singularity Perimeter Breach', handled: true, timestamp: Date.now() };
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

export const stageEvents = {
  'Tachyon Flux Distortions': onTachyonFluxDistortions,
  'tachyon flux distortions': onTachyonFluxDistortions,
  'tachyonfluxdistortions': onTachyonFluxDistortions,
  'Ion Cloud Interference': onIonCloudInterference,
  'ion cloud interference': onIonCloudInterference,
  'ioncloudinterference': onIonCloudInterference,
  'Interceptor Ambush Wave': onInterceptorAmbushWave,
  'interceptor ambush wave': onInterceptorAmbushWave,
  'interceptorambushwave': onInterceptorAmbushWave,
  'Wormhole Coil Resonance Alert': onWormholeCoilResonanceAlert,
  'wormhole coil resonance alert': onWormholeCoilResonanceAlert,
  'wormholecoilresonancealert': onWormholeCoilResonanceAlert,
  'Singularity Perimeter Breach': onSingularityPerimeterBreach,
  'singularity perimeter breach': onSingularityPerimeterBreach,
  'singularityperimeterbreach': onSingularityPerimeterBreach,
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
  console.log(`[Stage 2: Event Horizon] Applying VR Profile configuration & decoupled systems...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON [VR]');
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
    engineApi.showToast('🚀 STAGE 2: EVENT HORIZON [VR] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
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
  handleStageEvent('Tachyon Flux Distortions', engineApi);

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
