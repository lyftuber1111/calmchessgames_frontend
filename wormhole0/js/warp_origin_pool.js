import * as THREE from 'three';
import {
  MeshPool,
  StageObjectPool,
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  setupCockpitOverlayHierarchy,
  fitCockpitCracksToCamera,
  fitCockpitOverlayToCamera,
  loadCockpitCracksGlbAsset,
  loadCockpitCracksAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay,
  toggleRandomWeaponDecal,
  toggleBrokenCoreDecal,
  toggleGameOverDecals,
  resetCockpitOverlayDecals,
  triggerCockpitCracksHit,
  triggerShieldDepletedCockpitCracks,
  triggerGameOverCockpitCracks,
  hideCockpitCracks
} from './object_pool.js';
import {
  createDronePhaseInterceptor3,
  weaponDecalName as INTERCEPTOR_MODULE_WEAPON_DECAL_NAME,
  metadata as INTERCEPTOR_METADATA
} from '../desktop/warp_origin_images/drone_phase_interceptor_3.js';
import {
  createReconDrone,
  weaponDecalNames as RECON_MODULE_WEAPON_DECAL_NAMES,
  metadata as RECON_DRONE_METADATA
} from '../desktop/warp_origin_images/recon_drone_2.8m.js';

export const STAGE_COCKPIT_CRACKS_GLB_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_TYPE = "3d_model";

export const INTERCEPTOR_WEAPON_DECAL_NAME = INTERCEPTOR_MODULE_WEAPON_DECAL_NAME || 'Decal_LaserBurn_Tip_Laser_Weapon';
export const INTERCEPTOR_WEAPON_FIRE_DURATION_MS = 1000;

export const RECON_DRONE_PORT_WEAPON_DECAL_NAME =
  (Array.isArray(RECON_MODULE_WEAPON_DECAL_NAMES) && RECON_MODULE_WEAPON_DECAL_NAMES[0])
  || 'Decal_MissileStrike_Port_Weapon';
export const RECON_DRONE_STARBOARD_WEAPON_DECAL_NAME =
  (Array.isArray(RECON_MODULE_WEAPON_DECAL_NAMES) && RECON_MODULE_WEAPON_DECAL_NAMES[1])
  || 'Decal_MissileStrike_Starboard_Weapon';
export const RECON_DRONE_WEAPON_DECAL_NAMES = [
  RECON_DRONE_PORT_WEAPON_DECAL_NAME,
  RECON_DRONE_STARBOARD_WEAPON_DECAL_NAME
];
export const RECON_DRONE_WEAPON_FIRE_DURATION_MS = 2000;
export const RECON_DRONE_MISSILE_DAMAGE = 0.25;
export const RECON_DRONE_MISSILE_SALVO_INTERVAL_SEC = 1.0;

// Dedicated separate procedural enemy pool names (isolated from other graphics asset pools
// and strictly separate for each of Stage 1's two enemy types)
export const INTERCEPTOR_PROCEDURAL_ENEMY_POOL_NAME = 'warp_origin_procedural_enemy_drone_phase_interceptor_3';
export const RECON_DRONE_PROCEDURAL_ENEMY_POOL_NAME = 'warp_origin_procedural_enemy_recon_drone_2_8m';
export const PROCEDURAL_ENEMY_POOL_NAMES = {
  'drone_phase_interceptor_3': INTERCEPTOR_PROCEDURAL_ENEMY_POOL_NAME,
  'recon_drone_2.8m': RECON_DRONE_PROCEDURAL_ENEMY_POOL_NAME
};

// Stage 1 enemy scales increased by +0.25 (from 1.0 to 1.25)
export const WARP_ORIGIN_ENEMY_SCALE_INCREMENT = 0.25;
export const PHASE_INTERCEPTOR_ENEMY_SCALE = 1.25;
export const RECON_DRONE_ENEMY_SCALE = 1.25;
export const WARP_ORIGIN_ENEMY_SCALE = 1.25;

export {
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  setupCockpitOverlayHierarchy,
  fitCockpitCracksToCamera,
  fitCockpitOverlayToCamera,
  loadCockpitCracksGlbAsset,
  loadCockpitCracksAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay,
  toggleRandomWeaponDecal,
  toggleBrokenCoreDecal,
  toggleGameOverDecals,
  resetCockpitOverlayDecals,
  triggerCockpitCracksHit,
  triggerShieldDepletedCockpitCracks,
  triggerGameOverCockpitCracks,
  hideCockpitCracks
};

/**
 * Classifies a Stage 1 Warp Origin enemy instance, mesh, string key, or config object
 * into one of the two procedural Stage 1 enemy models:
 *   - 'drone_phase_interceptor_3'
 *   - 'recon_drone_2.8m'
 */
export function resolveWarpOriginEnemyKind(enemyOrConfig) {
  if (!enemyOrConfig) return 'recon_drone_2.8m';

  if (typeof enemyOrConfig === 'string') {
    const s = enemyOrConfig.toLowerCase();
    if (s.includes('interceptor') || s.includes('phase_interceptor') || s.includes('drone_phase')) {
      return 'drone_phase_interceptor_3';
    }
    return 'recon_drone_2.8m';
  }

  const mesh = enemyOrConfig.mesh ? enemyOrConfig.mesh : enemyOrConfig;
  const ud = mesh && mesh.userData ? mesh.userData : null;
  if (ud) {
    if (ud.isDronePhaseInterceptor3 || ud.proceduralEnemyKind === 'drone_phase_interceptor_3') {
      return 'drone_phase_interceptor_3';
    }
    if (ud.isReconDrone28m || ud.proceduralEnemyKind === 'recon_drone_2.8m') {
      return 'recon_drone_2.8m';
    }
  }

  const cfg = (enemyOrConfig.config && typeof enemyOrConfig.config === 'object')
    ? enemyOrConfig.config
    : (ud && ud.config && typeof ud.config === 'object')
      ? ud.config
      : enemyOrConfig;

  const combined = [
    cfg.model_3d_type,
    cfg.enemy_id,
    cfg.id,
    cfg.procedural_model_url,
    cfg.model_3d_url,
    cfg.enemy_name,
    cfg.name,
    mesh && mesh.name
  ].filter(v => typeof v === 'string' && v.length > 0).join(' ').toLowerCase();

  if (combined.includes('interceptor') || combined.includes('phase_interceptor') || combined.includes('drone_phase')) {
    return 'drone_phase_interceptor_3';
  }
  return 'recon_drone_2.8m';
}

/**
 * Deduplicates deterministic static CanvasTextures across pooled procedural instances
 * of the same enemy kind so pre-allocating a full Stage 1 pool stays lightweight on GPU VRAM.
 */
function deduplicateStaticProceduralTextures(rootObj, enemyKind, sharedTexMap) {
  if (!rootObj || !sharedTexMap || typeof rootObj.traverse !== 'function') return;
  const slots = ['map', 'bumpMap', 'roughnessMap', 'emissiveMap'];
  const redundant = new Set();

  rootObj.traverse((child) => {
    if (!child || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (let i = 0; i < mats.length; i++) {
      const m = mats[i];
      if (!m) continue;
      for (let s = 0; s < slots.length; s++) {
        const slot = slots[s];
        const tex = m[slot];
        if (!tex || !tex.isTexture || !tex.name) continue;
        const key = `${enemyKind}::${tex.name}`;
        if (sharedTexMap.has(key)) {
          const canonical = sharedTexMap.get(key);
          if (canonical && canonical !== tex) {
            m[slot] = canonical;
            redundant.add(tex);
          }
        } else {
          tex.userData = tex.userData || {};
          tex.userData._isSharedAsset = true;
          sharedTexMap.set(key, tex);
        }
      }
    }
  });

  for (const dupTex of redundant) {
    try { dupTex.dispose(); } catch (_) {}
  }
}

/**
 * Resolves the burn tip laser weapon decal mesh (Decal_LaserBurn_Tip_Laser_Weapon)
 * on a Drone Phase Interceptor Mk.III enemy object or Three.js mesh root.
 */
export function getInterceptorWeaponDecal(enemyOrMesh) {
  const mesh = (enemyOrMesh && enemyOrMesh.mesh) ? enemyOrMesh.mesh : enemyOrMesh;
  if (!mesh) return null;

  if (mesh.userData && mesh.userData.weaponDecalMesh) {
    return mesh.userData.weaponDecalMesh;
  }
  if (mesh.userData && mesh.userData.dronePhaseInterceptor3) {
    const dpi = mesh.userData.dronePhaseInterceptor3;
    if (dpi.weaponDecalMesh) return dpi.weaponDecalMesh;
    if (dpi.object && dpi.object.userData && dpi.object.userData.weaponDecalMesh) {
      return dpi.object.userData.weaponDecalMesh;
    }
  }
  if (typeof mesh.getObjectByName === 'function') {
    const found = mesh.getObjectByName(INTERCEPTOR_WEAPON_DECAL_NAME);
    if (found) {
      if (mesh.userData) mesh.userData.weaponDecalMesh = found;
      return found;
    }
  }
  return null;
}

/**
 * Turns the Drone Phase Interceptor burn tip laser weapon decal ON or OFF.
 */
export function setInterceptorWeaponDecalEnabled(enemyOrMesh, enabled) {
  const decalMesh = getInterceptorWeaponDecal(enemyOrMesh);
  if (!decalMesh) return false;
  decalMesh.visible = Boolean(enabled);
  return true;
}

/**
 * Resolves both missile strike weapon decal meshes on a Void Recon Drone (2.8m):
 *   - port:      Decal_MissileStrike_Port_Weapon
 *   - starboard: Decal_MissileStrike_Starboard_Weapon
 */
export function getReconDroneWeaponDecals(enemyOrMesh) {
  const mesh = (enemyOrMesh && enemyOrMesh.mesh) ? enemyOrMesh.mesh : enemyOrMesh;
  if (!mesh) return { port: null, starboard: null };

  if (mesh.userData && mesh.userData.reconWeaponDecals) {
    const cached = mesh.userData.reconWeaponDecals;
    if (cached.port || cached.starboard) {
      return cached;
    }
  }

  let port = null;
  let starboard = null;
  if (typeof mesh.getObjectByName === 'function') {
    port = mesh.getObjectByName(RECON_DRONE_PORT_WEAPON_DECAL_NAME) || null;
    starboard = mesh.getObjectByName(RECON_DRONE_STARBOARD_WEAPON_DECAL_NAME) || null;
  }
  if ((!port || !starboard) && mesh.userData && mesh.userData.reconDrone && mesh.userData.reconDrone.object) {
    const rdObj = mesh.userData.reconDrone.object;
    const dec = rdObj.userData && rdObj.userData.decals;
    if (dec) {
      if (!port && dec.portWeapon) port = dec.portWeapon;
      if (!starboard && dec.starboardWeapon) starboard = dec.starboardWeapon;
    }
  }

  const resolved = { port, starboard };
  if (mesh.userData && (port || starboard)) {
    mesh.userData.reconWeaponDecals = resolved;
  }
  return resolved;
}

/**
 * Turns the Void Recon Drone (2.8m) strike port and/or strike starboard weapon decals ON or OFF.
 * @param {object} enemyOrMesh
 * @param {'port'|'starboard'|'both'} mount
 * @param {boolean} enabled
 */
export function setReconDroneWeaponDecalEnabled(enemyOrMesh, mount, enabled) {
  const decals = getReconDroneWeaponDecals(enemyOrMesh);
  const flag = Boolean(enabled);
  let changed = false;

  if ((mount === 'port' || mount === 'both') && decals.port) {
    decals.port.visible = flag;
    changed = true;
  }
  if ((mount === 'starboard' || mount === 'both') && decals.starboard) {
    decals.starboard.visible = flag;
    changed = true;
  }
  return changed;
}

/**
 * Turns OFF all procedural weapon decals and clears weapon timer flags on any Stage 1 enemy mesh.
 */
export function resetWarpOriginEnemyWeaponDecals(enemyOrMesh) {
  const mesh = (enemyOrMesh && enemyOrMesh.mesh) ? enemyOrMesh.mesh : enemyOrMesh;
  if (!mesh) return;

  const kind = resolveWarpOriginEnemyKind(enemyOrMesh);
  if (kind === 'drone_phase_interceptor_3') {
    setInterceptorWeaponDecalEnabled(mesh, false);
  } else {
    setReconDroneWeaponDecalEnabled(mesh, 'both', false);
  }

  const ud = mesh.userData;
  if (ud) {
    ud._tipLaserFiring = false;
    ud._tipLaserFireRemaining = 0;
    ud._tipLaserFireEndTime = 0;
    ud._portMissileFiring = false;
    ud._portMissileFireRemaining = 0;
    ud._portMissileFireEndTime = 0;
    ud._portSecondSalvoPending = false;
    ud._starboardMissileFiring = false;
    ud._starboardMissileFireRemaining = 0;
    ud._starboardMissileFireEndTime = 0;
    ud._starboardSecondSalvoPending = false;
  }
}

/**
 * Builds a centered procedural Drone Phase Interceptor Mk.III enemy mesh instance from
 * drone_phase_interceptor_3.js with Decal_LaserBurn_Tip_Laser_Weapon initialized OFF.
 */
export function createDronePhaseInterceptor3Mesh(config = {}, factoryFn = createDronePhaseInterceptor3, sharedTexMap = null) {
  const buildFn = (typeof factoryFn === 'function') ? factoryFn : createDronePhaseInterceptor3;
  const interceptor = buildFn({ THREE });
  const rootObj = interceptor && interceptor.object ? interceptor.object : new THREE.Group();

  const dimsMeta = (interceptor && interceptor.metadata && interceptor.metadata.dimensions)
    || (INTERCEPTOR_METADATA && INTERCEPTOR_METADATA.dimensions)
    || { width: 2.11, height: 0.98, depth: 2.63 };
  const width = Number(dimsMeta.width) || 2.11;
  const height = Number(dimsMeta.height) || 0.98;
  const depth = Number(dimsMeta.depth) || 2.63;
  const halfHeight = height * 0.5;

  // Center around local origin (0, 0, 0) for 3D flight rotation and hit detection
  rootObj.position.set(0, -halfHeight, 0);

  // Disable per-enemy dynamic PointLights to avoid WebGL shader recompilation stutters across waves
  rootObj.traverse((child) => {
    if (child.isLight) {
      child.visible = false;
    } else if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  if (sharedTexMap) {
    deduplicateStaticProceduralTextures(rootObj, 'drone_phase_interceptor_3', sharedTexMap);
  }

  const weaponDecalMesh = (
    rootObj.userData &&
    rootObj.userData.dronePhaseInterceptor3 &&
    rootObj.userData.dronePhaseInterceptor3.weaponDecalMesh
  ) || (typeof rootObj.getObjectByName === 'function' ? rootObj.getObjectByName(INTERCEPTOR_WEAPON_DECAL_NAME) : null);

  // Burn tip laser weapon decal starts OFF until weapon firing turns it ON for 1 second
  if (weaponDecalMesh) {
    weaponDecalMesh.visible = false;
  }

  const initialElapsed = Math.random() * ((interceptor && interceptor.duration) || 6.0);
  if (interceptor && typeof interceptor.update === 'function') {
    interceptor.update(0, initialElapsed);
  }

  const group = new THREE.Group();
  group.name = 'DronePhaseInterceptor3_Enemy';
  group.add(rootObj);

  const userScale = Math.max(
    0.05,
    Math.min(
      20.0,
      parseFloat(config && config.scale !== undefined && config.scale !== null ? config.scale : PHASE_INTERCEPTOR_ENEMY_SCALE) || PHASE_INTERCEPTOR_ENEMY_SCALE
    )
  );
  group.scale.set(userScale, userScale, userScale);

  const circumference = Number((Math.PI * width).toFixed(2));
  const radius = Math.max(width, height, depth) * 0.5;

  group.userData = group.userData || {};
  group.userData.isDronePhaseInterceptor3 = true;
  group.userData.isProceduralEnemyGraphic = true;
  group.userData.isProceduralWarpOriginEnemy = true;
  group.userData.proceduralEnemyKind = 'drone_phase_interceptor_3';
  group.userData.dronePhaseInterceptor3 = interceptor;
  group.userData.proceduralController = interceptor;
  group.userData.proceduralCenterOffsetY = -halfHeight;
  group.userData.weaponDecalName = INTERCEPTOR_WEAPON_DECAL_NAME;
  group.userData.weaponDecalMesh = weaponDecalMesh;
  group.userData.proceduralElapsed = initialElapsed;
  group.userData._tipLaserFiring = false;
  group.userData._tipLaserFireRemaining = 0;
  group.userData._tipLaserFireEndTime = 0;
  group.userData.config = { ...(config || {}), scale: userScale };
  group.userData.dimensions = {
    scale: userScale,
    length: width,
    height,
    depth,
    circumference,
    radius
  };

  return group;
}

/**
 * Builds a centered procedural Void Recon Drone (2.8m) enemy mesh instance from
 * recon_drone_2.8m.js with both strike port and strike starboard weapon decals initialized OFF.
 */
export function createReconDroneMesh(config = {}, factoryFn = createReconDrone, sharedTexMap = null) {
  const buildFn = (typeof factoryFn === 'function') ? factoryFn : createReconDrone;
  const reconDrone = buildFn({ THREE });
  const rootObj = reconDrone && reconDrone.object ? reconDrone.object : new THREE.Group();

  const dimsMeta = (reconDrone && reconDrone.metadata && reconDrone.metadata.dimensions)
    || (RECON_DRONE_METADATA && RECON_DRONE_METADATA.dimensions)
    || { width: 2.80, height: 2.80, depth: 2.80 };
  const width = Number(dimsMeta.width) || 2.80;
  const height = Number(dimsMeta.height) || 2.80;
  const depth = Number(dimsMeta.depth) || 2.80;
  const halfHeight = height * 0.5;

  // Center the 2.80m drone around local origin (0, 0, 0) for 3D flight rotation and hit detection
  rootObj.position.set(0, -halfHeight, 0);

  // Disable per-enemy dynamic PointLights to avoid WebGL shader recompilation stutters across waves
  rootObj.traverse((child) => {
    if (child.isLight) {
      child.visible = false;
    } else if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  if (sharedTexMap) {
    deduplicateStaticProceduralTextures(rootObj, 'recon_drone_2.8m', sharedTexMap);
  }

  const portDecalMesh = (
    rootObj.userData &&
    rootObj.userData.decals &&
    rootObj.userData.decals.portWeapon
  ) || (typeof rootObj.getObjectByName === 'function' ? rootObj.getObjectByName(RECON_DRONE_PORT_WEAPON_DECAL_NAME) : null);

  const starboardDecalMesh = (
    rootObj.userData &&
    rootObj.userData.decals &&
    rootObj.userData.decals.starboardWeapon
  ) || (typeof rootObj.getObjectByName === 'function' ? rootObj.getObjectByName(RECON_DRONE_STARBOARD_WEAPON_DECAL_NAME) : null);

  // Both strike port and strike starboard weapon decals start OFF until weapon firing activates them for 2 seconds
  if (portDecalMesh) portDecalMesh.visible = false;
  if (starboardDecalMesh) starboardDecalMesh.visible = false;

  const initialElapsed = Math.random() * ((reconDrone && reconDrone.duration) || 6.0);
  if (reconDrone && typeof reconDrone.update === 'function') {
    reconDrone.update(0, initialElapsed);
  }

  const group = new THREE.Group();
  group.name = 'ReconDrone28m_Enemy';
  group.add(rootObj);

  const userScale = Math.max(
    0.05,
    Math.min(
      20.0,
      parseFloat(config && config.scale !== undefined && config.scale !== null ? config.scale : RECON_DRONE_ENEMY_SCALE) || RECON_DRONE_ENEMY_SCALE
    )
  );
  group.scale.set(userScale, userScale, userScale);

  const circumference = (reconDrone && reconDrone.metadata && reconDrone.metadata.circumference) || 8.80;

  group.userData = group.userData || {};
  group.userData.isReconDrone28m = true;
  group.userData.isProceduralEnemyGraphic = true;
  group.userData.isProceduralWarpOriginEnemy = true;
  group.userData.proceduralEnemyKind = 'recon_drone_2.8m';
  group.userData.reconDrone = reconDrone;
  group.userData.proceduralController = reconDrone;
  group.userData.proceduralCenterOffsetY = -halfHeight;
  group.userData.weaponDecalNames = [...RECON_DRONE_WEAPON_DECAL_NAMES];
  group.userData.reconWeaponDecals = {
    port: portDecalMesh,
    starboard: starboardDecalMesh
  };
  group.userData.proceduralElapsed = initialElapsed;
  group.userData._portMissileFiring = false;
  group.userData._portMissileFireRemaining = 0;
  group.userData._portMissileFireEndTime = 0;
  group.userData._portSecondSalvoPending = false;
  group.userData._starboardMissileFiring = false;
  group.userData._starboardMissileFireRemaining = 0;
  group.userData._starboardMissileFireEndTime = 0;
  group.userData._starboardSecondSalvoPending = false;
  group.userData.config = { ...(config || {}), scale: userScale };
  group.userData.dimensions = {
    scale: userScale,
    length: width,
    height,
    depth,
    circumference,
    radius: halfHeight
  };

  return group;
}

/**
 * Dispatcher building either Drone Phase Interceptor Mk.III or Void Recon Drone (2.8m)
 * procedural enemy mesh for Stage 1: Warp Origin.
 */
export function createWarpOriginEnemyMesh(config = {}, factories = {}, sharedTexMap = null) {
  const kind = resolveWarpOriginEnemyKind(config);
  if (kind === 'drone_phase_interceptor_3') {
    const fn = (factories && typeof factories.createDronePhaseInterceptor3 === 'function')
      ? factories.createDronePhaseInterceptor3
      : createDronePhaseInterceptor3;
    return createDronePhaseInterceptor3Mesh(config, fn, sharedTexMap);
  }
  const fn = (factories && typeof factories.createReconDrone === 'function')
    ? factories.createReconDrone
    : createReconDrone;
  return createReconDroneMesh(config, fn, sharedTexMap);
}

export const PHASE_INTERCEPTOR_ENEMY_TEMPLATE = {
  "id": "phase_interceptor",
  "enemy_id": "phase_interceptor",
  "name": "Phase Interceptor (Mk.III)",
  "enemy_name": "Phase Interceptor (Mk.III)",
  "device_type": "all",
  "enemy_class": "Fast Interceptor",
  "icon": "🚀",
  "model_3d_type": "drone_phase_interceptor_3",
  "model_3d_url": "",
  "procedural_model_url": "desktop/warp_origin_images/drone_phase_interceptor_3.js",
  "scale": PHASE_INTERCEPTOR_ENEMY_SCALE,
  "length": 2.11,
  "height": 0.98,
  "depth": 2.63,
  "circumference": 6.63,
  "color": "#38bdf8",
  "hits": 1,
  "hits_to_destroy": 1,
  "armor": 1,
  "armor_strength": 1,
  "has_force_field": 0,
  "shield": 0,
  "speed": 220,
  "attack_damage": 1,
  "weapon_name": "Tip Laser Disruptor",
  "weapon_damage": 1,
  "weapon_speed": 550,
  "weapon_color": "#ff1a2b",
  "weapon_decal_name": INTERCEPTOR_WEAPON_DECAL_NAME,
  "weapon_fire_duration_ms": INTERCEPTOR_WEAPON_FIRE_DURATION_MS,
  "weapon_fire_duration_seconds": 1.0,
  "weapon_scale": 1,
  "weapon_scale_x": 1,
  "weapon_scale_y": 1,
  "weapon_scale_z": 1,
  "weapon_size_x": 1,
  "weapon_size_y": 1,
  "weapon_size_z": 1,
  "weapon_dimensions": {
    "x": 1,
    "y": 1,
    "z": 1
  },
  "weapon_special_fx": "cockpit_overlay_decals",
  "weapon_special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
  "weapon_special_fx_type": "overlay",
  "fire_rate": 3,
  "fire_rate_seconds": 3,
  "fire_rate_ms": 3000,
  "fire_rate_times_per_sec": 0.333,
  "weapons": [
    {
      "id": "ew_phase_interceptor_0",
      "name": "Tip Laser Disruptor",
      "type": "beam",
      "mount": "center",
      "model_url": "",
      "model_type": "decal_tip_laser_weapon",
      "weapon_decal_name": INTERCEPTOR_WEAPON_DECAL_NAME,
      "fire_duration_ms": INTERCEPTOR_WEAPON_FIRE_DURATION_MS,
      "fire_duration_seconds": 1.0,
      "fire_point_x": 0,
      "fire_point_y": 0,
      "fire_point_z": 1.315,
      "scale": 1,
      "scale_x": 1,
      "scale_y": 1,
      "scale_z": 1,
      "size_x": 1,
      "size_y": 1,
      "size_z": 1,
      "dimensions": {
        "x": 1,
        "y": 1,
        "z": 1
      },
      "fire_rate_times_per_sec": 0.333,
      "fire_interval_ms": 3000,
      "fire_rate_seconds": 3,
      "damage": 1,
      "speed": 550,
      "color": "#ff1a2b",
      "special_fx": "cockpit_overlay_decals",
      "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
      "special_fx_type": "overlay",
      "is_enabled": 1
    }
  ],
  "score": 250,
  "score_value": 250,
  "threat": "Medium",
  "threat_level": "Medium",
  "piercing": "red_laser",
  "piercing_weapon_id": "red_laser",
  "pool_size": 12,
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
};

export const RECON_DRONE_ENEMY_TEMPLATE = {
  "id": "void_recon_drone",
  "enemy_id": "void_recon_drone",
  "name": "Void Recon Drone (2.8m)",
  "enemy_name": "Void Recon Drone (2.8m)",
  "device_type": "all",
  "enemy_class": "Scout Drone",
  "icon": "🛸",
  "model_3d_type": "recon_drone_2.8m",
  "model_3d_url": "",
  "procedural_model_url": "desktop/warp_origin_images/recon_drone_2.8m.js",
  "scale": RECON_DRONE_ENEMY_SCALE,
  "length": 2.8,
  "height": 2.8,
  "depth": 2.8,
  "circumference": 8.8,
  "color": "#ef476f",
  "hits": 2,
  "hits_to_destroy": 2,
  "armor": 10,
  "armor_strength": 10,
  "has_force_field": 0,
  "shield": 0,
  "speed": 250,
  "attack_damage": RECON_DRONE_MISSILE_DAMAGE,
  "weapon_name": "Twin Strike Missiles",
  "weapon_damage": RECON_DRONE_MISSILE_DAMAGE,
  "weapon_speed": 450,
  "weapon_color": "#ff1e2d",
  "weapon_decal_names": [...RECON_DRONE_WEAPON_DECAL_NAMES],
  "weapon_fire_duration_ms": RECON_DRONE_WEAPON_FIRE_DURATION_MS,
  "weapon_fire_duration_seconds": 2.0,
  "weapon_scale": 1,
  "weapon_scale_x": 1,
  "weapon_scale_y": 1,
  "weapon_scale_z": 1,
  "weapon_size_x": 1,
  "weapon_size_y": 1,
  "weapon_size_z": 1,
  "weapon_dimensions": {
    "x": 1,
    "y": 1,
    "z": 1
  },
  "weapon_special_fx": "cockpit_overlay_decals",
  "weapon_special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
  "weapon_special_fx_type": "overlay",
  "fire_rate": 3,
  "fire_rate_seconds": 3,
  "fire_rate_ms": 3000,
  "fire_rate_times_per_sec": 0.333,
  "weapons": [
    {
      "id": "ew_void_recon_drone_0",
      "name": "Twin Strike Missiles",
      "type": "missile",
      "mount": "dual_forward",
      "model_url": "",
      "model_type": "decal_twin_missile_weapon",
      "weapon_decal_names": [...RECON_DRONE_WEAPON_DECAL_NAMES],
      "fire_duration_ms": RECON_DRONE_WEAPON_FIRE_DURATION_MS,
      "fire_duration_seconds": 2.0,
      "fire_point_x": 0,
      "fire_point_y": -0.08,
      "fire_point_z": 1.4,
      "scale": 1,
      "scale_x": 1,
      "scale_y": 1,
      "scale_z": 1,
      "size_x": 1,
      "size_y": 1,
      "size_z": 1,
      "dimensions": {
        "x": 1,
        "y": 1,
        "z": 1
      },
      "fire_rate_times_per_sec": 0.333,
      "fire_interval_ms": 3000,
      "fire_rate_seconds": 3,
      "damage": RECON_DRONE_MISSILE_DAMAGE,
      "speed": 450,
      "color": "#ff1e2d",
      "special_fx": "cockpit_overlay_decals",
      "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
      "special_fx_type": "overlay",
      "is_enabled": 1
    }
  ],
  "score": 100,
  "score_value": 100,
  "threat": "Low",
  "threat_level": "Low",
  "piercing": "any",
  "piercing_weapon_id": "any",
  "pool_size": 12,
  "quick_effect_primary": "none",
  "quick_effect_secondary": "none",
  "quick_effect_color": "#00f0ff",
  "quick_effect_intensity": 1,
  "quick_effect_speed": 1,
  "destruction_particle_type": "procedural_sparks_explosion",
  "destruction_particle_url": "",
  "destruction_particle_count": 40,
  "destruction_particle_color": "#ef476f",
  "destruction_particle_scale": 1
};

function normalizeStage1EnemyConfig(enemyKind, incomingConfig = {}) {
  const isInterceptor = enemyKind === 'drone_phase_interceptor_3';
  const baseTemplate = isInterceptor ? PHASE_INTERCEPTOR_ENEMY_TEMPLATE : RECON_DRONE_ENEMY_TEMPLATE;
  const defaultScale = isInterceptor ? PHASE_INTERCEPTOR_ENEMY_SCALE : RECON_DRONE_ENEMY_SCALE;

  const normalized = {
    ...baseTemplate,
    ...(incomingConfig || {})
  };
  normalized.id = normalized.id || baseTemplate.id;
  normalized.enemy_id = normalized.enemy_id || baseTemplate.enemy_id;
  normalized.model_3d_type = isInterceptor ? 'drone_phase_interceptor_3' : 'recon_drone_2.8m';
  normalized.model_3d_url = '';
  normalized.scale = defaultScale;
  normalized.pool_size = Math.max(12, Math.min(Number(normalized.pool_size) || 12, 16));

  if (isInterceptor) {
    normalized.weapon_decal_name = INTERCEPTOR_WEAPON_DECAL_NAME;
    normalized.weapon_fire_duration_ms = INTERCEPTOR_WEAPON_FIRE_DURATION_MS;
  } else {
    normalized.attack_damage = RECON_DRONE_MISSILE_DAMAGE;
    normalized.weapon_damage = RECON_DRONE_MISSILE_DAMAGE;
    normalized.weapon_decal_names = [...RECON_DRONE_WEAPON_DECAL_NAMES];
    normalized.weapon_fire_duration_ms = RECON_DRONE_WEAPON_FIRE_DURATION_MS;
  }
  return normalized;
}

/**
 * Dedicated Separate Procedural Enemy Graphics Pool for a single Stage 1: Warp Origin enemy type.
 * Strictly isolated from other graphics asset pools (player weapons, enemy weapons,
 * cockpit cracks overlay GLB, standard StageObjectPool.enemyPools) AND strictly isolated
 * from the other Stage 1 enemy type's pool.
 */
export class WarpOriginProceduralEnemyPool extends MeshPool {
  constructor(scene, enemyKind = 'recon_drone_2.8m', enemyConfig = {}, options = {}) {
    const resolvedKind = (enemyKind === 'drone_phase_interceptor_3' || resolveWarpOriginEnemyKind(enemyKind) === 'drone_phase_interceptor_3')
      ? 'drone_phase_interceptor_3'
      : 'recon_drone_2.8m';
    const isInterceptor = resolvedKind === 'drone_phase_interceptor_3';
    const normalizedEnemyConfig = normalizeStage1EnemyConfig(resolvedKind, enemyConfig);
    const defaultScale = isInterceptor ? PHASE_INTERCEPTOR_ENEMY_SCALE : RECON_DRONE_ENEMY_SCALE;

    const initialSize = Math.max(
      12,
      Math.min(Number(options.initialSize || normalizedEnemyConfig.pool_size) || 12, 16)
    );
    const poolName = options.poolName || (isInterceptor
      ? INTERCEPTOR_PROCEDURAL_ENEMY_POOL_NAME
      : RECON_DRONE_PROCEDURAL_ENEMY_POOL_NAME);
    const ownsSharedTextures = !options.sharedTextures;
    const sharedTextures = options.sharedTextures || new Map();

    const customBuilder = (typeof options.createProceduralEnemyMeshFn === 'function')
      ? options.createProceduralEnemyMeshFn
      : (typeof options.createEnemyMeshFn === 'function')
        ? options.createEnemyMeshFn
        : null;

    super(
      scene,
      null,
      null,
      initialSize,
      () => {
        const cfgCopy = { ...normalizedEnemyConfig };
        const mesh = customBuilder
          ? customBuilder(cfgCopy, sharedTextures)
          : (isInterceptor
            ? createDronePhaseInterceptor3Mesh(cfgCopy, options.factoryFn || createDronePhaseInterceptor3, sharedTextures)
            : createReconDroneMesh(cfgCopy, options.factoryFn || createReconDrone, sharedTextures));

        if (mesh) {
          mesh.userData = mesh.userData || {};
          mesh.userData.pooledEnemyKey = resolvedKind;
          mesh.userData.poolKey = resolvedKind;
          mesh.userData.isEnemyGraphic = true;
          mesh.userData.isProceduralEnemyGraphic = true;
          mesh.userData.isProceduralWarpOriginEnemy = true;
          mesh.userData.proceduralEnemyKind = resolvedKind;
          mesh.userData.poolCategory = 'procedural_enemy';
          mesh.userData.proceduralPoolName = poolName;
          mesh.userData.fromProceduralEnemyPool = true;
          resetWarpOriginEnemyWeaponDecals(mesh);
        }
        return mesh;
      }
    );

    this._disposed = false;
    this.enemyKind = resolvedKind;
    this.enemyType = normalizedEnemyConfig.enemy_id || (isInterceptor ? 'phase_interceptor' : 'void_recon_drone');
    this.defaultScale = defaultScale;
    this.poolName = poolName;
    this.poolCategory = 'procedural_enemy';
    this.isProceduralEnemyPool = true;
    this.isSeparateFromAssetPools = true;
    this.isDedicatedEnemyTypePool = true;
    this.enemyConfig = normalizedEnemyConfig;
    this._sharedProceduralTextures = sharedTextures;
    this._ownsSharedTextures = ownsSharedTextures;

    console.log(
      `[WarpOriginProceduralEnemyPool] Pre-allocated separate procedural enemy pool for ${this.enemyKind} (${this.pool.length} instances, scale=${this.defaultScale}): ${this.poolName}`
    );
  }

  spawn(position = null, quaternion = null, scale = null) {
    const resolvedScale = (scale !== null && scale !== undefined) ? scale : this.defaultScale;
    const mesh = super.spawn(position, quaternion, resolvedScale);
    if (mesh) {
      resetWarpOriginEnemyWeaponDecals(mesh);
      mesh.userData = mesh.userData || {};
      mesh.userData.fromPool = true;
      mesh.userData.fromProceduralEnemyPool = true;
      mesh.userData.isProceduralEnemyGraphic = true;
      mesh.userData.isProceduralWarpOriginEnemy = true;
      mesh.userData.proceduralEnemyKind = this.enemyKind;
      mesh.userData.poolCategory = 'procedural_enemy';
      mesh.userData.proceduralPoolName = this.poolName;
      mesh.userData.pooledEnemyKey = this.enemyKind;
      mesh.userData.poolKey = this.enemyKind;
      const ctrl = mesh.userData.proceduralController || mesh.userData.dronePhaseInterceptor3 || mesh.userData.reconDrone;
      if (ctrl && typeof ctrl.update === 'function') {
        ctrl.update(0, mesh.userData.proceduralElapsed || 0);
      }
    }
    return mesh;
  }

  despawn(mesh) {
    if (!mesh) return;
    resetWarpOriginEnemyWeaponDecals(mesh);
    super.despawn(mesh);
  }

  despawnAll() {
    if (this.active) {
      for (const mesh of this.active) {
        resetWarpOriginEnemyWeaponDecals(mesh);
      }
    }
    super.despawnAll();
  }

  dispose() {
    this._disposed = true;
    const allMeshes = [...(this.pool || []), ...(this.active ? Array.from(this.active) : [])];
    for (const mesh of allMeshes) {
      if (!mesh) continue;
      resetWarpOriginEnemyWeaponDecals(mesh);
      const ctrl = mesh.userData && (mesh.userData.proceduralController || mesh.userData.dronePhaseInterceptor3 || mesh.userData.reconDrone);
      if (ctrl && typeof ctrl.dispose === 'function') {
        try { ctrl.dispose(); } catch (_) {}
      }
    }
    if (this._ownsSharedTextures && this._sharedProceduralTextures) {
      for (const tex of this._sharedProceduralTextures.values()) {
        try { tex.dispose(); } catch (_) {}
      }
      this._sharedProceduralTextures.clear();
    }
    super.dispose();
  }
}

/**
 * Dedicated Separate Procedural Enemy Pool exclusively for Drone Phase Interceptor Mk.III.
 */
export class DronePhaseInterceptorProceduralEnemyPool extends WarpOriginProceduralEnemyPool {
  constructor(scene, enemyConfig = {}, options = {}) {
    super(scene, 'drone_phase_interceptor_3', enemyConfig, {
      poolName: INTERCEPTOR_PROCEDURAL_ENEMY_POOL_NAME,
      ...options
    });
  }
}

/**
 * Dedicated Separate Procedural Enemy Pool exclusively for Void Recon Drone (2.8m).
 */
export class ReconDroneProceduralEnemyPool extends WarpOriginProceduralEnemyPool {
  constructor(scene, enemyConfig = {}, options = {}) {
    super(scene, 'recon_drone_2.8m', enemyConfig, {
      poolName: RECON_DRONE_PROCEDURAL_ENEMY_POOL_NAME,
      ...options
    });
  }
}

export function createDronePhaseInterceptorProceduralEnemyPool(scene, enemyConfig = {}, options = {}) {
  return new DronePhaseInterceptorProceduralEnemyPool(scene, enemyConfig, options);
}

export const PhaseInterceptorProceduralEnemyPool = DronePhaseInterceptorProceduralEnemyPool;
export const createPhaseInterceptorProceduralEnemyPool = createDronePhaseInterceptorProceduralEnemyPool;

export function createReconDroneProceduralEnemyPool(scene, enemyConfig = {}, options = {}) {
  return new ReconDroneProceduralEnemyPool(scene, enemyConfig, options);
}

export function createProceduralEnemyPool(scene, enemyConfig = {}, options = {}) {
  const kind = resolveWarpOriginEnemyKind(options.enemyKind || enemyConfig);
  if (kind === 'drone_phase_interceptor_3') {
    return new DronePhaseInterceptorProceduralEnemyPool(scene, enemyConfig, options);
  }
  return new ReconDroneProceduralEnemyPool(scene, enemyConfig, options);
}

export function createProceduralEnemyPools(scene, stageConfig = {}, options = {}) {
  const incomingEnemies = (stageConfig && Array.isArray(stageConfig.enemies)) ? stageConfig.enemies : [];
  const incomingInterceptor = incomingEnemies.find(e => resolveWarpOriginEnemyKind(e) === 'drone_phase_interceptor_3') || {};
  const incomingRecon = incomingEnemies.find(e => resolveWarpOriginEnemyKind(e) === 'recon_drone_2.8m') || {};

  const interceptorOpts = (options && options.interceptorOptions) ? options.interceptorOptions : {};
  const reconOpts = (options && options.reconOptions) ? options.reconOptions : {};

  const interceptorPool = createDronePhaseInterceptorProceduralEnemyPool(scene, incomingInterceptor, interceptorOpts);
  const reconDronePool = createReconDroneProceduralEnemyPool(scene, incomingRecon, reconOpts);

  return {
    interceptorPool,
    reconDronePool,
    'drone_phase_interceptor_3': interceptorPool,
    'recon_drone_2.8m': reconDronePool,
    phase_interceptor: interceptorPool,
    void_recon_drone: reconDronePool
  };
}

/**
 * Wormhole XR - Stage 1: Warp Origin Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Manages graphics asset pools for Stage 1: Warp Origin, keeping procedural enemies in
 * TWO strictly separate dedicated pools — one exclusively for Drone Phase Interceptor Mk.III
 * and one exclusively for Void Recon Drone (2.8m) — completely isolated from all other
 * graphics asset pools (player weapons, enemy weapons, cockpit overlay, and StageObjectPool.enemyPools).
 */

export class WarpOriginObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const incomingEnemies = (stageConfig && Array.isArray(stageConfig.enemies)) ? stageConfig.enemies : [];
    const incomingInterceptor = incomingEnemies.find(e => resolveWarpOriginEnemyKind(e) === 'drone_phase_interceptor_3');
    const incomingRecon = incomingEnemies.find(e => resolveWarpOriginEnemyKind(e) === 'recon_drone_2.8m');

    const interceptorEnemy = normalizeStage1EnemyConfig('drone_phase_interceptor_3', incomingInterceptor);
    const reconEnemy = normalizeStage1EnemyConfig('recon_drone_2.8m', incomingRecon);
    const normalizedStageEnemies = [interceptorEnemy, reconEnemy];

    const configWithDefaults = {
      stage_level: 1,
      stage_name: "Warp Origin",
      stage_slug: "warp_origin",
      environment_theme: "Warp Cyan Corridor",
      cockpit_overlay_object: {
        model_3d_url: "scene_images/screen_decals_spider_web_overlay_4.glb",
        model_url: "scene_images/screen_decals_spider_web_overlay_4.glb",
        asset_type: "3d_model"
      },
      cockpit_overlay_asset: "scene_images/screen_decals_spider_web_overlay_4.glb",
      cockpit_overlay: {
        model_3d_url: "scene_images/screen_decals_spider_web_overlay_4.glb",
        model_url: "scene_images/screen_decals_spider_web_overlay_4.glb",
        asset_type: "3d_model"
      },
      initial_weapon_pool_size: 300,
      initial_enemy_pool_size: 24,
      waves: [
        {
          "wave_number": 1,
          "enemy_count": 5,
          "interval_seconds": 0,
          "delay_ms": 0,
          "description": "Wave 1: Recon Vanguard (5 Enemies)"
        },
        {
          "wave_number": 2,
          "enemy_count": 10,
          "interval_seconds": 15,
          "delay_ms": 15000,
          "description": "Wave 2: Full Assault Swarm (10 Enemies)"
        }
      ],
      total_waves: 2,
      wave_interval_seconds: 15,
      weapons: {
        "initial": {
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
          "description": "High-impact coherent photon beam with deep penetration.",
          "scale": 1,
          "scale_x": 1,
          "scale_y": 1,
          "scale_z": 1,
          "size_x": 1,
          "size_y": 1,
          "size_z": 1,
          "dimensions": {
            "x": 1,
            "y": 1,
            "z": 1
          },
          "special_fx": "cockpit_overlay_decals",
          "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
          "special_fx_type": "overlay"
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
            "description": "High-impact coherent photon beam with deep penetration.",
            "scale": 1,
            "scale_x": 1,
            "scale_y": 1,
            "scale_z": 1,
            "size_x": 1,
            "size_y": 1,
            "size_z": 1,
            "dimensions": {
              "x": 1,
              "y": 1,
              "z": 1
            },
            "special_fx": "cockpit_overlay_decals",
            "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
            "special_fx_type": "overlay"
          },
          {
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
            "description": "Standard high-cadence plasma emitter with twin focus beams.",
            "scale": 1,
            "scale_x": 1,
            "scale_y": 1,
            "scale_z": 1,
            "size_x": 1,
            "size_y": 1,
            "size_z": 1,
            "dimensions": {
              "x": 1,
              "y": 1,
              "z": 1
            },
            "special_fx": "cockpit_overlay_decals",
            "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
            "special_fx_type": "overlay"
          }
        ]
      },
      powerups: [
        {
          "id": 1,
          "powerup_id": "health_pack_s1",
          "powerup_name": "Sub-Space Nanite Repair Kit",
          "powerup_type": "health",
          "restore_both": 0,
          "icon": "💖",
          "model_3d_type": "capsule",
          "model_3d_url": "",
          "color_hex": "#00ff88",
          "scale": 1.5,
          "length": 2.5,
          "height": 2.5,
          "depth": 2.5,
          "circumference": 6,
          "stage_level": 1,
          "device_type": "all",
          "trigger_events": "Asteroid Debris Belt, Anomaly Alpha Spike",
          "drop_on_enemy_kill": 1,
          "drop_chance_pct": 60,
          "enemy_id": "void_recon_drone",
          "boost_percentage": 25,
          "description": "Rapid nano-repair canister synthesized during debris fields and scout incursions. Restores 25% hull integrity.",
          "is_enabled": 1
        },
        {
          "id": 2,
          "powerup_id": "shield_cell_s1",
          "powerup_name": "Deflector Shield Overcharger",
          "powerup_type": "shield",
          "restore_both": 0,
          "icon": "🛡️",
          "model_3d_type": "octahedron",
          "model_3d_url": "",
          "color_hex": "#00f0ff",
          "scale": 1.5,
          "length": 2.5,
          "height": 2.5,
          "depth": 2.5,
          "circumference": 6,
          "stage_level": 1,
          "device_type": "all",
          "trigger_events": "Nav-Beacon Calibration, Plasma Surge Alert",
          "drop_on_enemy_kill": 1,
          "drop_chance_pct": 75,
          "enemy_id": "all",
          "boost_percentage": 30,
          "description": "High-frequency deflector charge harmonic. Overcharges magnetic shield buffer by +30%.",
          "is_enabled": 1
        }
      ],
      environment: {
        "id": 1,
        "env_id": "env_warp_origin_desktop",
        "env_name": "Warp Origin (Cyan Relativistic Flow)",
        "env_category": "wormhole_singularity",
        "stage_level": 1,
        "device_type": "desktop",
        "model_3d_type": "custom_glb",
        "model_3d_url": "/meshy_test_0/models/recon_drone_2.8m.glb",
        "image_asset_url": "mobile/event_horizon_images/singularity_corona.png",
        "image_asset_type": "corona_sprite",
        "scale": "1.00",
        "event_horizon_radius": "7.50",
        "accretion_disk_radius": "38.00",
        "length": "300.00",
        "height": "80.00",
        "depth": "300.00",
        "circumference": "47.12",
        "color_primary": "#00f0ff",
        "color_edge": "#003366",
        "color_core": "#00f0ff",
        "color_hot": "#d6ffff",
        "color_halo": "#00f0ff",
        "ambient_light": "#002233",
        "center_light": "#00f0ff",
        "rotation_speed": "0.650",
        "distortion_intensity": "1.00",
        "particle_count": 4500,
        "quick_effect_primary": "none",
        "quick_effect_secondary": "none",
        "quick_effect_color": "#00f0ff",
        "quick_effect_intensity": "1.00",
        "quick_effect_speed": "1.00",
        "description": "",
        "is_enabled": 1,
        "created_at": "2026-11-10 04:03:56",
        "updated_at": "2026-11-10 23:17:00"
      },
      ...stageConfig,
      enemies: normalizedStageEnemies
    };

    // Other graphics asset pools (player weapons, enemy weapons, cockpit cracks overlay)
    // are initialized by StageObjectPool via super(); procedural enemy graphics are NOT
    // mixed into StageObjectPool.enemyPools.
    const otherAssetPoolOptions = {
      ...options
    };
    delete otherAssetPoolOptions.createEnemyMeshFn;

    super(scene, configWithDefaults, otherAssetPoolOptions);

    // Strictly separate pools dedicated ONLY to Stage 1 procedural enemy graphics:
    // ONE dedicated pool for Drone Phase Interceptor Mk.III and ONE dedicated pool for Void Recon Drone (2.8m).
    this.hasSeparateProceduralEnemyPool = true;
    this.hasSeparateProceduralEnemyPools = true;
    this.hasSeparateEnemyTypeProceduralPools = true;
    this.proceduralEnemyPools = new Map();

    const procPoolCfg = (stageConfig && stageConfig.proceduralEnemyPoolConfig && typeof stageConfig.proceduralEnemyPoolConfig === 'object')
      ? stageConfig.proceduralEnemyPoolConfig
      : {};
    const interceptorPoolCfg = (procPoolCfg.pools && procPoolCfg.pools.drone_phase_interceptor_3) || {};
    const reconPoolCfg = (procPoolCfg.pools && (procPoolCfg.pools['recon_drone_2.8m'] || procPoolCfg.pools.recon_drone_2_8m)) || {};

    const interceptorMeshBuilder = (stageConfig && typeof stageConfig.createInterceptorEnemyMeshFn === 'function')
      ? stageConfig.createInterceptorEnemyMeshFn
      : (stageConfig && typeof stageConfig.createPhaseInterceptorMeshFn === 'function')
        ? stageConfig.createPhaseInterceptorMeshFn
        : (stageConfig && typeof stageConfig.createProceduralEnemyMeshFn === 'function')
          ? stageConfig.createProceduralEnemyMeshFn
          : (stageConfig && typeof stageConfig.createEnemyMeshFn === 'function')
            ? stageConfig.createEnemyMeshFn
            : (cfg, sharedTexMap) => createDronePhaseInterceptor3Mesh(cfg, createDronePhaseInterceptor3, sharedTexMap);

    const reconMeshBuilder = (stageConfig && typeof stageConfig.createReconDroneEnemyMeshFn === 'function')
      ? stageConfig.createReconDroneEnemyMeshFn
      : (stageConfig && typeof stageConfig.createReconDroneMeshFn === 'function')
        ? stageConfig.createReconDroneMeshFn
        : (stageConfig && typeof stageConfig.createProceduralEnemyMeshFn === 'function')
          ? stageConfig.createProceduralEnemyMeshFn
          : (stageConfig && typeof stageConfig.createEnemyMeshFn === 'function')
            ? stageConfig.createEnemyMeshFn
            : (cfg, sharedTexMap) => createReconDroneMesh(cfg, createReconDrone, sharedTexMap);

    this.interceptorProceduralEnemyPool = this.initInterceptorProceduralEnemyPool(interceptorEnemy, {
      poolName: interceptorPoolCfg.poolName || INTERCEPTOR_PROCEDURAL_ENEMY_POOL_NAME,
      initialSize: interceptorPoolCfg.initialSize || interceptorEnemy.pool_size || 12,
      createProceduralEnemyMeshFn: (cfg, sharedTexMap) => interceptorMeshBuilder({ ...interceptorEnemy, ...(cfg || {}) }, sharedTexMap)
    });
    this.phaseInterceptorProceduralEnemyPool = this.interceptorProceduralEnemyPool;

    this.reconDroneProceduralEnemyPool = this.initReconDroneProceduralEnemyPool(reconEnemy, {
      poolName: reconPoolCfg.poolName || RECON_DRONE_PROCEDURAL_ENEMY_POOL_NAME,
      initialSize: reconPoolCfg.initialSize || reconEnemy.pool_size || 12,
      createProceduralEnemyMeshFn: (cfg, sharedTexMap) => reconMeshBuilder({ ...reconEnemy, ...(cfg || {}) }, sharedTexMap)
    });

    this.proceduralEnemyPoolMap = {
      'drone_phase_interceptor_3': this.interceptorProceduralEnemyPool,
      'recon_drone_2.8m': this.reconDroneProceduralEnemyPool,
      phase_interceptor: this.interceptorProceduralEnemyPool,
      void_recon_drone: this.reconDroneProceduralEnemyPool
    };
    this.proceduralEnemyPoolsByType = this.proceduralEnemyPoolMap;

    // Expose explicit separation between other graphics assets and the two procedural enemy pools
    this.assetPools = {
      playerWeapons: this.playerWeaponPools,
      enemyWeapons: this.enemyWeaponPools,
      standardEnemies: this.enemyPools,
      get cockpitOverlay() {
        return null;
      }
    };
    Object.defineProperty(this.assetPools, 'cockpitOverlay', {
      enumerable: true,
      configurable: true,
      get: () => this.cockpitCracksOverlayPool
    });

    console.log(
      `[WarpOriginObjectPool] Initialized Stage 1 separate procedural enemy pools (` +
      `interceptor=${this.interceptorProceduralEnemyPool.poolName}[${this.interceptorProceduralEnemyPool.pool.length}], ` +
      `recon=${this.reconDroneProceduralEnemyPool.poolName}[${this.reconDroneProceduralEnemyPool.pool.length}], ` +
      `scale=${WARP_ORIGIN_ENEMY_SCALE}; standard enemyPools=${this.enemyPools.size}) for:`,
      configWithDefaults.stage_name
    );
  }

  /**
   * Overrides StageObjectPool.initEnemyPools() so procedural Stage 1 enemies are NEVER
   * mixed into the generic StageObjectPool.enemyPools graphics asset map.
   */
  initEnemyPools() {
    this.enemyPools = new Map();
  }

  /**
   * Pre-allocates the dedicated separate procedural enemy pool for Drone Phase Interceptor Mk.III.
   */
  initInterceptorProceduralEnemyPool(enemyConfig = PHASE_INTERCEPTOR_ENEMY_TEMPLATE, poolOptions = {}) {
    const procPool = new DronePhaseInterceptorProceduralEnemyPool(this.scene, enemyConfig, poolOptions);
    this.proceduralEnemyPools.set('drone_phase_interceptor_3', procPool);
    this.proceduralEnemyPools.set('phase_interceptor', procPool);
    this.proceduralEnemyPools.set('phase_interceptor_all', procPool);
    this.proceduralEnemyPools.set('interceptor', procPool);
    if (enemyConfig && enemyConfig.enemy_id !== undefined && enemyConfig.enemy_id !== null) {
      this.proceduralEnemyPools.set(enemyConfig.enemy_id, procPool);
      this.proceduralEnemyPools.set(String(enemyConfig.enemy_id), procPool);
    }
    if (enemyConfig && enemyConfig.id !== undefined && enemyConfig.id !== null) {
      this.proceduralEnemyPools.set(enemyConfig.id, procPool);
      this.proceduralEnemyPools.set(String(enemyConfig.id), procPool);
    }
    return procPool;
  }

  /**
   * Pre-allocates the dedicated separate procedural enemy pool for Void Recon Drone (2.8m).
   */
  initReconDroneProceduralEnemyPool(enemyConfig = RECON_DRONE_ENEMY_TEMPLATE, poolOptions = {}) {
    const procPool = new ReconDroneProceduralEnemyPool(this.scene, enemyConfig, poolOptions);
    this.proceduralEnemyPools.set('recon_drone_2.8m', procPool);
    this.proceduralEnemyPools.set('void_recon_drone', procPool);
    this.proceduralEnemyPools.set('void_recon_drone_mobile', procPool);
    this.proceduralEnemyPools.set('recon_drone', procPool);
    this.proceduralEnemyPools.set('scout_drone', procPool);
    if (enemyConfig && enemyConfig.enemy_id !== undefined && enemyConfig.enemy_id !== null) {
      this.proceduralEnemyPools.set(enemyConfig.enemy_id, procPool);
      this.proceduralEnemyPools.set(String(enemyConfig.enemy_id), procPool);
    }
    if (enemyConfig && enemyConfig.id !== undefined && enemyConfig.id !== null) {
      this.proceduralEnemyPools.set(enemyConfig.id, procPool);
      this.proceduralEnemyPools.set(String(enemyConfig.id), procPool);
    }
    return procPool;
  }

  getInterceptorProceduralEnemyPool() {
    return this.interceptorProceduralEnemyPool || this.proceduralEnemyPools.get('drone_phase_interceptor_3') || null;
  }

  getPhaseInterceptorProceduralEnemyPool() {
    return this.getInterceptorProceduralEnemyPool();
  }

  getReconDroneProceduralEnemyPool() {
    return this.reconDroneProceduralEnemyPool || this.proceduralEnemyPools.get('recon_drone_2.8m') || null;
  }

  /**
   * Returns both dedicated separate procedural enemy pools keyed by enemy type.
   */
  getProceduralEnemyPools() {
    return {
      'drone_phase_interceptor_3': this.getInterceptorProceduralEnemyPool(),
      'recon_drone_2.8m': this.getReconDroneProceduralEnemyPool(),
      phase_interceptor: this.getInterceptorProceduralEnemyPool(),
      void_recon_drone: this.getReconDroneProceduralEnemyPool()
    };
  }

  /**
   * Returns the dedicated separate procedural enemy pool matching the given enemy config/kind.
   */
  getProceduralEnemyPool(enemyConfig = null) {
    if (enemyConfig === null || enemyConfig === undefined) {
      return this.getInterceptorProceduralEnemyPool() || this.getReconDroneProceduralEnemyPool() || null;
    }
    const kind = resolveWarpOriginEnemyKind(enemyConfig);
    if (kind === 'drone_phase_interceptor_3') {
      return this.getInterceptorProceduralEnemyPool();
    }
    return this.getReconDroneProceduralEnemyPool();
  }

  getEnemyPool(enemyConfig = null) {
    // Stage 1: Warp Origin strictly routes enemy pool lookups to the matching enemy type's
    // dedicated separate procedural enemy pool.
    return this.getProceduralEnemyPool(enemyConfig);
  }

  /**
   * Spawns a pre-allocated procedural Stage 1 enemy graphic from the dedicated separate
   * procedural pool for that exact enemy type (Drone Phase Interceptor Mk.III or Void Recon Drone 2.8m).
   */
  spawnProceduralEnemy(enemyConfig = null, position = null, quaternion = null, scale = null) {
    const procPool = this.getProceduralEnemyPool(enemyConfig);
    if (!procPool) return null;

    const mesh = procPool.spawn(position, quaternion, scale);
    if (mesh) {
      resetWarpOriginEnemyWeaponDecals(mesh);
      mesh.userData = mesh.userData || {};
      mesh.userData.fromPool = true;
      mesh.userData.fromProceduralEnemyPool = true;
      mesh.userData.isProceduralEnemyGraphic = true;
      mesh.userData.isProceduralWarpOriginEnemy = true;
      mesh.userData.proceduralEnemyKind = procPool.enemyKind;
      mesh.userData.poolCategory = 'procedural_enemy';
      mesh.userData.proceduralPoolName = procPool.poolName;
      mesh.userData.pooledEnemyKey = procPool.enemyKind;
      mesh.userData.poolKey = procPool.enemyKind;
      const ctrl = mesh.userData.proceduralController || mesh.userData.dronePhaseInterceptor3 || mesh.userData.reconDrone;
      if (ctrl && typeof ctrl.update === 'function') {
        ctrl.update(0, mesh.userData.proceduralElapsed || 0);
      }
    }
    return mesh;
  }

  spawnInterceptorProceduralEnemy(position = null, quaternion = null, scale = null) {
    return this.spawnProceduralEnemy('drone_phase_interceptor_3', position, quaternion, scale);
  }

  spawnReconDroneProceduralEnemy(position = null, quaternion = null, scale = null) {
    return this.spawnProceduralEnemy('recon_drone_2.8m', position, quaternion, scale);
  }

  spawnEnemy(enemyConfig, position, quaternion = null, scale = null) {
    return this.spawnProceduralEnemy(enemyConfig, position, quaternion, scale);
  }

  /**
   * Returns a procedural Stage 1 enemy graphic back to its own enemy type's dedicated separate pool.
   */
  despawnProceduralEnemy(mesh, enemyConfig = null) {
    if (!mesh) return false;
    resetWarpOriginEnemyWeaponDecals(mesh);

    const uniqueProcPools = new Set([
      this.interceptorProceduralEnemyPool,
      this.reconDroneProceduralEnemyPool,
      ...(this.proceduralEnemyPools ? this.proceduralEnemyPools.values() : [])
    ].filter(Boolean));

    // 1. Prefer the exact pool that currently owns this active mesh (prevents cross-pool mixing)
    for (const pool of uniqueProcPools) {
      if (pool.active && pool.active.has(mesh)) {
        pool.despawn(mesh);
        return true;
      }
    }

    // 2. Fallback: route strictly by the mesh's own enemy kind (before enemyConfig)
    const meshKind = resolveWarpOriginEnemyKind(mesh || enemyConfig);
    const targetPool = (meshKind === 'drone_phase_interceptor_3')
      ? this.getInterceptorProceduralEnemyPool()
      : this.getReconDroneProceduralEnemyPool();

    if (targetPool && mesh.userData && (mesh.userData.fromProceduralEnemyPool || mesh.userData.isProceduralWarpOriginEnemy)) {
      targetPool.despawn(mesh);
      return true;
    }
    return false;
  }

  despawnEnemy(mesh, enemyConfig = null) {
    if (!mesh) return;
    if (this.despawnProceduralEnemy(mesh, enemyConfig)) {
      return;
    }
    super.despawnEnemy(mesh, enemyConfig);
  }

  despawnAllProceduralEnemies() {
    const uniqueProcPools = new Set([
      this.interceptorProceduralEnemyPool,
      this.reconDroneProceduralEnemyPool,
      ...(this.proceduralEnemyPools ? this.proceduralEnemyPools.values() : [])
    ].filter(Boolean));
    for (const pool of uniqueProcPools) {
      if (typeof pool.despawnAll === 'function') {
        pool.despawnAll();
      }
    }
  }

  despawnAllEnemies() {
    this.despawnAllProceduralEnemies();
    super.despawnAllEnemies();
  }

  dispose() {
    const uniqueProcPools = new Set([
      this.interceptorProceduralEnemyPool,
      this.reconDroneProceduralEnemyPool,
      ...(this.proceduralEnemyPools ? this.proceduralEnemyPools.values() : [])
    ].filter(Boolean));

    if (typeof window !== 'undefined') {
      if (window.stageProceduralEnemyPool && uniqueProcPools.has(window.stageProceduralEnemyPool)) {
        window.stageProceduralEnemyPool = null;
      }
      if (window.stageInterceptorProceduralEnemyPool && uniqueProcPools.has(window.stageInterceptorProceduralEnemyPool)) {
        window.stageInterceptorProceduralEnemyPool = null;
      }
      if (window.stagePhaseInterceptorEnemyPool && uniqueProcPools.has(window.stagePhaseInterceptorEnemyPool)) {
        window.stagePhaseInterceptorEnemyPool = null;
      }
      if (window.stageReconDroneProceduralEnemyPool && uniqueProcPools.has(window.stageReconDroneProceduralEnemyPool)) {
        window.stageReconDroneProceduralEnemyPool = null;
      }
      if (window.stageReconDroneEnemyPool && uniqueProcPools.has(window.stageReconDroneEnemyPool)) {
        window.stageReconDroneEnemyPool = null;
      }
      if (
        window.stageProceduralEnemyPools &&
        (
          uniqueProcPools.has(window.stageProceduralEnemyPools.drone_phase_interceptor_3) ||
          uniqueProcPools.has(window.stageProceduralEnemyPools['recon_drone_2.8m'])
        )
      ) {
        if (window.stageProceduralEnemyPool === window.stageProceduralEnemyPools) {
          window.stageProceduralEnemyPool = null;
        }
        window.stageProceduralEnemyPools = null;
      }
      if (
        window.stageProceduralEnemyPool &&
        (
          uniqueProcPools.has(window.stageProceduralEnemyPool.drone_phase_interceptor_3) ||
          uniqueProcPools.has(window.stageProceduralEnemyPool['recon_drone_2.8m'])
        )
      ) {
        window.stageProceduralEnemyPool = null;
      }
    }

    for (const pool of uniqueProcPools) {
      if (pool && typeof pool.dispose === 'function') {
        pool.dispose();
      }
    }
    if (this.proceduralEnemyPools) {
      this.proceduralEnemyPools.clear();
    }
    this.interceptorProceduralEnemyPool = null;
    this.phaseInterceptorProceduralEnemyPool = null;
    this.reconDroneProceduralEnemyPool = null;
    this.proceduralEnemyPoolMap = null;
    this.proceduralEnemyPoolsByType = null;

    super.dispose();
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new WarpOriginObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };
