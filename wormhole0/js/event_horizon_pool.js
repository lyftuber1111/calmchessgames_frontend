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
  createRelativisticEnemyShip,
  weaponDecalNames as RELATIVISTIC_MODULE_WEAPON_DECAL_NAMES,
  metadata as RELATIVISTIC_SHIP_METADATA
} from '../desktop/event_horizon_images/relativistic_enemy_ship.js';

export const STAGE_COCKPIT_CRACKS_GLB_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_TYPE = "3d_model";

export const RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES = (
  Array.isArray(RELATIVISTIC_MODULE_WEAPON_DECAL_NAMES) && RELATIVISTIC_MODULE_WEAPON_DECAL_NAMES.length >= 4
)
  ? [...RELATIVISTIC_MODULE_WEAPON_DECAL_NAMES]
  : [
      'Decal_MissileStrike_Port_Upper_TachyonLance',
      'Decal_MissileStrike_Port_Lower_TachyonLance',
      'Decal_MissileStrike_Starboard_Upper_TachyonLance',
      'Decal_MissileStrike_Starboard_Lower_TachyonLance'
    ];

export const RELATIVISTIC_SHIP_EMITTER_KEYS = [
  'portUpper',
  'portLower',
  'starboardUpper',
  'starboardLower'
];

// Diagonal quad-barrel firing order matching relativistic_enemy_ship.js EMITTER_STAGGER:
// Port Upper (0) -> Starboard Lower (3) -> Port Lower (1) -> Starboard Upper (2)
export const RELATIVISTIC_SHIP_STAGGER_ORDER = [0, 3, 1, 2];
export const RELATIVISTIC_SHIP_STAGGER_STEP_SEC = 0.25;
export const RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_MS = 5000;
export const RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_SEC = 5.0;
export const RELATIVISTIC_SHIP_MISSILE_DAMAGE_PCT = 2;
export const RELATIVISTIC_SHIP_MISSILE_DAMAGE = 2;
export const RELATIVISTIC_SHIP_MISSILE_SALVO_INTERVAL_SEC = 1.5;
export const RELATIVISTIC_SHIP_SALVOS_PER_EMITTER = 3;
export const RELATIVISTIC_ENEMY_SHIP_SCALE = 1.0;

// Dedicated separate procedural enemy pool name (strictly isolated from other graphics asset pools)
export const PROCEDURAL_ENEMY_POOL_NAME = 'event_horizon_procedural_enemy_relativistic_ship';

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
 * Deduplicates deterministic static SVG CanvasTextures across pooled procedural
 * Relativistic Enemy Ship instances so pre-allocating the separate procedural enemy
 * pool keeps GPU texture memory lightweight across mobile, desktop, VR, and ARCore.
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
 * Resolves all 4 Tachyon Lance missile weapon decal meshes on a Relativistic Enemy Ship
 * enemy object or Three.js mesh root:
 *   [0] portUpper:      Decal_MissileStrike_Port_Upper_TachyonLance
 *   [1] portLower:      Decal_MissileStrike_Port_Lower_TachyonLance
 *   [2] starboardUpper: Decal_MissileStrike_Starboard_Upper_TachyonLance
 *   [3] starboardLower: Decal_MissileStrike_Starboard_Lower_TachyonLance
 */
export function getRelativisticShipWeaponDecals(enemyOrMesh) {
  const mesh = (enemyOrMesh && enemyOrMesh.mesh) ? enemyOrMesh.mesh : enemyOrMesh;
  const empty = {
    list: [null, null, null, null],
    portUpper: null,
    portLower: null,
    starboardUpper: null,
    starboardLower: null
  };
  if (!mesh) return empty;

  const ud = mesh.userData || null;
  if (ud && ud.relativisticWeaponDecals && Array.isArray(ud.relativisticWeaponDecals.list) && ud.relativisticWeaponDecals.list.some(Boolean)) {
    return ud.relativisticWeaponDecals;
  }

  const list = [null, null, null, null];
  const shipObj = ud && ud.relativisticEnemyShip && ud.relativisticEnemyShip.object
    ? ud.relativisticEnemyShip.object
    : null;
  const shipDecals = shipObj && shipObj.userData && shipObj.userData.decals
    ? shipObj.userData.decals
    : null;

  for (let i = 0; i < RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES.length; i++) {
    const key = RELATIVISTIC_SHIP_EMITTER_KEYS[i];
    const decalName = RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES[i];
    let found = (shipDecals && shipDecals[key]) || null;
    if (!found && shipObj && shipObj.userData && Array.isArray(shipObj.userData.weaponDecalMeshes)) {
      found = shipObj.userData.weaponDecalMeshes[i] || null;
    }
    if (!found && typeof mesh.getObjectByName === 'function') {
      found = mesh.getObjectByName(decalName) || null;
    }
    list[i] = found;
  }

  const resolved = {
    list,
    portUpper: list[0],
    portLower: list[1],
    starboardUpper: list[2],
    starboardLower: list[3]
  };

  if (ud && list.some(Boolean)) {
    ud.relativisticWeaponDecals = resolved;
    ud.weaponDecalMeshes = list;
  }
  return resolved;
}

/**
 * Turns one (index 0..3 or emitter key/decal name) or all ('all') of the 4 Relativistic Enemy Ship
 * Tachyon Lance missile weapon decals ON or OFF.
 */
export function setRelativisticShipWeaponDecalEnabled(enemyOrMesh, emitterIndexOrKey, enabled) {
  const decals = getRelativisticShipWeaponDecals(enemyOrMesh);
  const flag = Boolean(enabled);
  let changed = false;

  if (emitterIndexOrKey === 'all' || emitterIndexOrKey === null || emitterIndexOrKey === undefined) {
    for (let i = 0; i < decals.list.length; i++) {
      const dm = decals.list[i];
      if (dm) {
        dm.visible = flag;
        changed = true;
      }
    }
    return changed;
  }

  let idx = -1;
  if (typeof emitterIndexOrKey === 'number' && emitterIndexOrKey >= 0 && emitterIndexOrKey < decals.list.length) {
    idx = emitterIndexOrKey;
  } else if (typeof emitterIndexOrKey === 'string') {
    const lower = emitterIndexOrKey.toLowerCase();
    const lookup = {
      '0': 0,
      portupper: 0,
      port_upper: 0,
      decal_missilestrike_port_upper_tachyonlance: 0,
      '1': 1,
      portlower: 1,
      port_lower: 1,
      decal_missilestrike_port_lower_tachyonlance: 1,
      '2': 2,
      starboardupper: 2,
      starboard_upper: 2,
      decal_missilestrike_starboard_upper_tachyonlance: 2,
      '3': 3,
      starboardlower: 3,
      starboard_lower: 3,
      decal_missilestrike_starboard_lower_tachyonlance: 3
    };
    if (lower in lookup) {
      idx = lookup[lower];
    }
  }

  if (idx >= 0 && decals.list[idx]) {
    decals.list[idx].visible = flag;
    changed = true;
  }
  return changed;
}

/**
 * Turns OFF all 4 Relativistic Enemy Ship weapon decals and resets weapon firing timers/schedules.
 */
export function resetRelativisticShipWeaponDecals(enemyOrMesh) {
  const mesh = (enemyOrMesh && enemyOrMesh.mesh) ? enemyOrMesh.mesh : enemyOrMesh;
  if (!mesh) return;

  setRelativisticShipWeaponDecalEnabled(mesh, 'all', false);

  const ud = mesh.userData;
  if (ud) {
    ud._missileWeaponFiring = false;
    ud._missileWeaponFireElapsed = 0;
    ud._missileWeaponFireRemaining = 0;
    ud._missileWeaponFireEndTime = 0;
    ud._emitterSchedules = null;
  }
}

/**
 * Builds a centered procedural Relativistic Enemy Ship mesh instance from
 * relativistic_enemy_ship.js with all 4 Tachyon Lance missile weapon decals initialized OFF.
 */
export function createRelativisticEnemyShipMesh(config = {}, factoryFn = createRelativisticEnemyShip, sharedTexMap = null) {
  const buildFn = (typeof factoryFn === 'function') ? factoryFn : createRelativisticEnemyShip;
  const ship = buildFn({ THREE });
  const rootObj = ship && ship.object ? ship.object : new THREE.Group();

  const dimsMeta = (ship && ship.metadata && ship.metadata.dimensions)
    || (RELATIVISTIC_SHIP_METADATA && RELATIVISTIC_SHIP_METADATA.dimensions)
    || { width: 4.64, height: 2.52, depth: 6.00 };
  const width = Number(dimsMeta.width) || 4.64;
  const height = Number(dimsMeta.height) || 2.52;
  const depth = Number(dimsMeta.depth) || 6.00;
  const halfHeight = height * 0.5;

  // Center the 4.64m x 2.52m x 6.00m gunship around local origin (0, 0, 0) for 3D flight & hit detection
  rootObj.position.set(0, -halfHeight, 0);

  // Disable per-enemy dynamic PointLights to avoid WebGL shader recompilation stutters across waves;
  // wormhole0 scene already provides directional, hemisphere, ambient, and cockpit headlight illumination.
  rootObj.traverse((child) => {
    if (child.isLight) {
      child.visible = false;
    } else if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  if (sharedTexMap) {
    deduplicateStaticProceduralTextures(rootObj, 'relativistic_enemy_ship', sharedTexMap);
  }

  // All 4 Tachyon Lance missile weapon decals start OFF until weapon firing activates them for 5 seconds
  if (ship && typeof ship.setWeaponsEnabled === 'function') {
    ship.setWeaponsEnabled(false);
  } else {
    for (let i = 0; i < RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES.length; i++) {
      const dm = typeof rootObj.getObjectByName === 'function'
        ? rootObj.getObjectByName(RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES[i])
        : null;
      if (dm) dm.visible = false;
    }
  }

  const initialElapsed = Math.random() * ((ship && ship.duration) || 6.0);
  if (ship && typeof ship.update === 'function') {
    ship.update(0, initialElapsed);
  }

  const group = new THREE.Group();
  group.name = 'RelativisticEnemyShip_Enemy';
  group.add(rootObj);

  const userScale = Math.max(
    0.05,
    Math.min(
      20.0,
      parseFloat(config && config.scale !== undefined && config.scale !== null ? config.scale : RELATIVISTIC_ENEMY_SHIP_SCALE) || RELATIVISTIC_ENEMY_SHIP_SCALE
    )
  );
  group.scale.set(userScale, userScale, userScale);

  const circumference = (ship && ship.metadata && ship.metadata.circumference)
    || Number((Math.PI * ((width + depth) * 0.5)).toFixed(2));
  const radius = Math.max(width, height, depth) * 0.5;

  group.userData = group.userData || {};
  group.userData.isRelativisticEnemyShip = true;
  group.userData.isProceduralEnemyGraphic = true;
  group.userData.isProceduralEventHorizonEnemy = true;
  group.userData.proceduralEnemyKind = 'relativistic_enemy_ship';
  group.userData.relativisticEnemyShip = ship;
  group.userData.proceduralController = ship;
  group.userData.proceduralCenterOffsetY = -halfHeight;
  group.userData.weaponDecalNames = [...RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES];
  group.userData.proceduralElapsed = initialElapsed;
  group.userData._missileWeaponFiring = false;
  group.userData._missileWeaponFireElapsed = 0;
  group.userData._missileWeaponFireRemaining = 0;
  group.userData._missileWeaponFireEndTime = 0;
  group.userData._emitterSchedules = null;
  group.userData.config = { ...(config || {}), scale: userScale };
  group.userData.dimensions = {
    scale: userScale,
    length: width,
    height,
    depth,
    circumference,
    radius
  };

  // Pre-cache all 4 weapon decal handles on userData and guarantee OFF state
  getRelativisticShipWeaponDecals(group);
  resetRelativisticShipWeaponDecals(group);

  return group;
}

export const RELATIVISTIC_ENEMY_SHIP_TEMPLATE = {
  "id": "relativistic_enemy_ship",
  "enemy_id": "relativistic_enemy_ship",
  "name": "Relativistic Enemy Ship",
  "enemy_name": "Relativistic Enemy Ship",
  "device_type": "all",
  "enemy_class": "Quad-Tachyon Stealth Gunship",
  "icon": "🛰️",
  "model_3d_type": "relativistic_enemy_ship",
  "model_3d_url": "",
  "procedural_model_url": "desktop/event_horizon_images/relativistic_enemy_ship.js",
  "scale": RELATIVISTIC_ENEMY_SHIP_SCALE,
  "length": 4.64,
  "height": 2.52,
  "depth": 6.0,
  "circumference": 16.71,
  "color": "#ffd166",
  "hits": 2,
  "hits_to_destroy": 2,
  "armor": 2,
  "armor_strength": 2,
  "has_force_field": 1,
  "shield": 1,
  "speed": 200,
  "attack_damage": RELATIVISTIC_SHIP_MISSILE_DAMAGE,
  "weapon_name": "Quad Tachyon Lance Missiles",
  "weapon_damage": RELATIVISTIC_SHIP_MISSILE_DAMAGE,
  "weapon_damage_pct": RELATIVISTIC_SHIP_MISSILE_DAMAGE_PCT,
  "weapon_speed": 480,
  "weapon_color": "#ff1ea8",
  "weapon_decal_names": [...RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES],
  "weapon_fire_duration_ms": RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_MS,
  "weapon_fire_duration_seconds": RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_SEC,
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
  "fire_rate": 7.5,
  "fire_rate_seconds": 7.5,
  "fire_rate_ms": 7500,
  "fire_rate_times_per_sec": 0.133,
  "weapons": [
    {
      "id": "ew_relativistic_enemy_ship_0",
      "name": "Quad Tachyon Lance Missiles",
      "type": "missile",
      "mount": "quad_ventral_pods",
      "model_url": "",
      "model_type": "decal_quad_tachyon_missile_weapon",
      "weapon_decal_names": [...RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES],
      "fire_duration_ms": RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_MS,
      "fire_duration_seconds": RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_SEC,
      "fire_point_x": 0,
      "fire_point_y": -0.74,
      "fire_point_z": 1.42,
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
      "fire_rate_times_per_sec": 0.133,
      "fire_interval_ms": 7500,
      "fire_rate_seconds": 7.5,
      "damage": RELATIVISTIC_SHIP_MISSILE_DAMAGE,
      "damage_pct": RELATIVISTIC_SHIP_MISSILE_DAMAGE_PCT,
      "speed": 480,
      "color": "#ff1ea8",
      "special_fx": "cockpit_overlay_decals",
      "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
      "special_fx_type": "overlay",
      "is_enabled": 1
    }
  ],
  "score": 500,
  "score_value": 500,
  "threat": "High",
  "threat_level": "High",
  "piercing": "tachyon_lance",
  "piercing_weapon_id": "tachyon_lance",
  "pool_size": 16,
  "quick_effect_primary": "tachyon_trail",
  "quick_effect_secondary": "sparks_burst",
  "quick_effect_color": "#ffd166",
  "quick_effect_intensity": 1,
  "quick_effect_speed": 1,
  "destruction_particle_type": "procedural_debris_cloud",
  "destruction_particle_url": "",
  "destruction_particle_count": 60,
  "destruction_particle_color": "#ffd166",
  "destruction_particle_scale": 1
};

function normalizeStage2EnemyConfig(incomingConfig = {}) {
  const normalized = {
    ...RELATIVISTIC_ENEMY_SHIP_TEMPLATE,
    ...(incomingConfig || {})
  };
  normalized.id = 'relativistic_enemy_ship';
  normalized.enemy_id = 'relativistic_enemy_ship';
  normalized.model_3d_type = 'relativistic_enemy_ship';
  normalized.model_3d_url = '';
  normalized.scale = RELATIVISTIC_ENEMY_SHIP_SCALE;
  normalized.length = 4.64;
  normalized.height = 2.52;
  normalized.depth = 6.0;
  normalized.circumference = 16.71;
  normalized.attack_damage = RELATIVISTIC_SHIP_MISSILE_DAMAGE;
  normalized.weapon_damage = RELATIVISTIC_SHIP_MISSILE_DAMAGE;
  normalized.weapon_damage_pct = RELATIVISTIC_SHIP_MISSILE_DAMAGE_PCT;
  normalized.weapon_decal_names = [...RELATIVISTIC_SHIP_WEAPON_DECAL_NAMES];
  normalized.weapon_fire_duration_ms = RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_MS;
  normalized.weapon_fire_duration_seconds = RELATIVISTIC_SHIP_WEAPON_FIRE_DURATION_SEC;
  normalized.pool_size = Math.max(15, Math.min(Number(normalized.pool_size) || 16, 20));
  return normalized;
}

/**
 * Dedicated Separate Procedural Enemy Graphics Pool for Stage 2: Event Horizon.
 * Strictly isolated from all other graphics asset pools (player weapons, enemy weapons,
 * cockpit cracks overlay GLB, and standard StageObjectPool.enemyPools).
 */
export class RelativisticEnemyShipProceduralEnemyPool extends MeshPool {
  constructor(scene, enemyConfig = {}, options = {}) {
    const normalizedEnemyConfig = normalizeStage2EnemyConfig(enemyConfig);
    const defaultScale = RELATIVISTIC_ENEMY_SHIP_SCALE;

    // Pre-allocate 16 instances so Wave 1 (5) + Wave 2 (10) = 15 active enemies are served
    // exclusively from this dedicated separate procedural enemy pool without runtime allocations.
    const initialSize = Math.max(
      15,
      Math.min(Number(options.initialSize || normalizedEnemyConfig.pool_size) || 16, 20)
    );
    const poolName = options.poolName || PROCEDURAL_ENEMY_POOL_NAME;
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
          : createRelativisticEnemyShipMesh(cfgCopy, options.factoryFn || createRelativisticEnemyShip, sharedTextures);

        if (mesh) {
          mesh.userData = mesh.userData || {};
          mesh.userData.pooledEnemyKey = 'relativistic_enemy_ship';
          mesh.userData.poolKey = 'relativistic_enemy_ship';
          mesh.userData.isEnemyGraphic = true;
          mesh.userData.isProceduralEnemyGraphic = true;
          mesh.userData.isProceduralEventHorizonEnemy = true;
          mesh.userData.isRelativisticEnemyShip = true;
          mesh.userData.proceduralEnemyKind = 'relativistic_enemy_ship';
          mesh.userData.poolCategory = 'procedural_enemy';
          mesh.userData.proceduralPoolName = poolName;
          mesh.userData.fromProceduralEnemyPool = true;
          resetRelativisticShipWeaponDecals(mesh);
        }
        return mesh;
      }
    );

    this._disposed = false;
    this.enemyKind = 'relativistic_enemy_ship';
    this.enemyType = 'relativistic_enemy_ship';
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
      `[RelativisticEnemyShipProceduralEnemyPool] Pre-allocated separate procedural enemy pool (${this.pool.length} instances, scale=${this.defaultScale}): ${this.poolName}`
    );
  }

  spawn(position = null, quaternion = null, scale = null) {
    const resolvedScale = (scale !== null && scale !== undefined) ? scale : this.defaultScale;
    const mesh = super.spawn(position, quaternion, resolvedScale);
    if (mesh) {
      resetRelativisticShipWeaponDecals(mesh);
      mesh.userData = mesh.userData || {};
      mesh.userData.fromPool = true;
      mesh.userData.fromProceduralEnemyPool = true;
      mesh.userData.isProceduralEnemyGraphic = true;
      mesh.userData.isProceduralEventHorizonEnemy = true;
      mesh.userData.isRelativisticEnemyShip = true;
      mesh.userData.proceduralEnemyKind = 'relativistic_enemy_ship';
      mesh.userData.poolCategory = 'procedural_enemy';
      mesh.userData.proceduralPoolName = this.poolName;
      mesh.userData.pooledEnemyKey = 'relativistic_enemy_ship';
      mesh.userData.poolKey = 'relativistic_enemy_ship';
      const ctrl = mesh.userData.proceduralController || mesh.userData.relativisticEnemyShip;
      if (ctrl && typeof ctrl.update === 'function') {
        ctrl.update(0, mesh.userData.proceduralElapsed || 0);
      }
    }
    return mesh;
  }

  despawn(mesh) {
    if (!mesh) return;
    const isOwned = Boolean(
      (this.active && this.active.has(mesh)) ||
      (mesh.userData && (
        mesh.userData.isRelativisticEnemyShip ||
        mesh.userData.proceduralEnemyKind === 'relativistic_enemy_ship' ||
        mesh.userData.proceduralPoolName === this.poolName
      ))
    );
    if (!isOwned) return;
    resetRelativisticShipWeaponDecals(mesh);
    super.despawn(mesh);
  }

  despawnAll() {
    if (this.active) {
      for (const mesh of this.active) {
        resetRelativisticShipWeaponDecals(mesh);
      }
    }
    super.despawnAll();
  }

  dispose() {
    this._disposed = true;
    const allMeshes = [...(this.pool || []), ...(this.active ? Array.from(this.active) : [])];
    for (const mesh of allMeshes) {
      if (!mesh) continue;
      resetRelativisticShipWeaponDecals(mesh);
      const ctrl = mesh.userData && (mesh.userData.proceduralController || mesh.userData.relativisticEnemyShip);
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

export const EventHorizonProceduralEnemyPool = RelativisticEnemyShipProceduralEnemyPool;
export const ProceduralEnemyPool = RelativisticEnemyShipProceduralEnemyPool;

export function createRelativisticEnemyShipProceduralEnemyPool(scene, enemyConfig = {}, options = {}) {
  return new RelativisticEnemyShipProceduralEnemyPool(scene, enemyConfig, options);
}

export function createProceduralEnemyPool(scene, enemyConfig = {}, options = {}) {
  return new RelativisticEnemyShipProceduralEnemyPool(scene, enemyConfig, options);
}

/**
 * Wormhole XR - Stage 2: Event Horizon Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Manages graphics asset pools for Stage 2: Event Horizon, keeping the procedural
 * Relativistic Enemy Ship pool strictly separate from all other graphics asset pools
 * (player weapons, enemy weapons, cockpit overlay, and standard StageObjectPool.enemyPools).
 */

export class EventHorizonObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const incomingPrimary = (
      stageConfig &&
      Array.isArray(stageConfig.enemies) &&
      stageConfig.enemies.length > 0
    )
      ? stageConfig.enemies[0]
      : {};
    const primaryStageEnemy = normalizeStage2EnemyConfig(incomingPrimary);

    const configWithDefaults = {
      stage_level: 2,
      stage_name: "Event Horizon",
      stage_slug: "event_horizon",
      environment_theme: "Event Horizon Amber",
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
      initial_enemy_pool_size: 16,
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
          "id": "tachyon_lance",
          "name": "Tachyon Lance",
          "icon": "⚡",
          "color": "#a855f7",
          "damage": 3,
          "bullet_speed": 850,
          "energy_drain_pct": 2,
          "can_overheat": 1,
          "cooldown_seconds": 7,
          "acquire_event": "warp_horizon_jump",
          "description": "Superluminal phase particle array unlocked after horizon traversal.",
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
            "id": "tachyon_lance",
            "name": "Tachyon Lance",
            "icon": "⚡",
            "color": "#a855f7",
            "damage": 3,
            "bullet_speed": 850,
            "energy_drain_pct": 2,
            "can_overheat": 1,
            "cooldown_seconds": 7,
            "acquire_event": "warp_horizon_jump",
            "description": "Superluminal phase particle array unlocked after horizon traversal.",
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
          "id": 3,
          "powerup_id": "health_pack_s2",
          "powerup_name": "Tachyon Infused Hull Matrix",
          "powerup_type": "health",
          "restore_both": 0,
          "icon": "💚",
          "model_3d_type": "dodecahedron",
          "model_3d_url": "",
          "color_hex": "#10b981",
          "scale": 1,
          "length": 2.5,
          "height": 2.5,
          "depth": 2.5,
          "circumference": 6,
          "stage_level": 2,
          "device_type": "all",
          "trigger_events": "Tachyon Flux Distortions, Interceptor Ambush Wave",
          "drop_on_enemy_kill": 1,
          "drop_chance_pct": 50,
          "enemy_id": "all",
          "boost_percentage": 35,
          "description": "Tachyon-stabilized cellular lattice repairing kinetic hull fissures. Restores 35% hull integrity.",
          "is_enabled": 1
        },
        {
          "id": 4,
          "powerup_id": "shield_cell_s2",
          "powerup_name": "Ion Shield Harmonizer",
          "powerup_type": "shield",
          "restore_both": 0,
          "icon": "🔰",
          "model_3d_type": "torus",
          "model_3d_url": "",
          "color_hex": "#38bdf8",
          "scale": 1,
          "length": 2.8,
          "height": 2.8,
          "depth": 2.8,
          "circumference": 7,
          "stage_level": 2,
          "device_type": "all",
          "trigger_events": "Ion Cloud Interference, Wormhole Coil Resonance Alert",
          "drop_on_enemy_kill": 1,
          "drop_chance_pct": 70,
          "enemy_id": "all",
          "boost_percentage": 40,
          "description": "Re-polarizes phase deflector shields against relativistic radiation. Boosts shield capacity by +40%.",
          "is_enabled": 1
        }
      ],
      environment: {
        "id": 2,
        "env_id": "event_horizon_singularity_s2",
        "env_name": "Amber Event Horizon Relativistic Singularity",
        "env_category": "wormhole_singularity",
        "stage_level": 2,
        "device_type": "all",
        "model_3d_type": "procedural_wormhole",
        "model_3d_url": "",
        "image_asset_url": "desktop/event_horizon_images/singularity_corona.png",
        "image_asset_type": "corona_sprite",
        "scale": "1.15",
        "event_horizon_radius": "8.20",
        "accretion_disk_radius": "42.00",
        "length": "320.00",
        "height": "85.00",
        "depth": "320.00",
        "circumference": "51.52",
        "color_primary": "#ffd166",
        "color_edge": "#663300",
        "color_core": "#ff9900",
        "color_hot": "#fff4d6",
        "color_halo": "#ffaa00",
        "ambient_light": "#331a00",
        "center_light": "#ffaa00",
        "rotation_speed": "0.850",
        "distortion_intensity": "1.35",
        "particle_count": 5200,
        "quick_effect_primary": "tachyon_trail",
        "quick_effect_secondary": "plasma_aura",
        "quick_effect_color": "#ffd166",
        "quick_effect_intensity": "1.20",
        "quick_effect_speed": "1.15",
        "description": "High-velocity light-horizon boundary enveloped in incandescent amber relativistic shear and tachyon streaming emission.",
        "is_enabled": 1,
        "created_at": "2026-11-10 04:03:56",
        "updated_at": "2026-11-23 02:59:00"
      },
      ...stageConfig,
      enemies: [primaryStageEnemy]
    };

    // Other graphics asset pools (player weapons, enemy weapons, cockpit cracks overlay)
    // are initialized by StageObjectPool via super(); procedural enemy graphics are NOT
    // mixed into StageObjectPool.enemyPools.
    const otherAssetPoolOptions = {
      ...options
    };
    delete otherAssetPoolOptions.createEnemyMeshFn;

    super(scene, configWithDefaults, otherAssetPoolOptions);

    // Strictly separate pool dedicated ONLY to Stage 2 procedural Relativistic Enemy Ship graphics
    this.hasSeparateProceduralEnemyPool = true;
    this.proceduralEnemyPools = new Map();
    this._sharedProceduralTextures = new Map();

    const shipMeshBuilder = (stageConfig && typeof stageConfig.createProceduralEnemyMeshFn === 'function')
      ? stageConfig.createProceduralEnemyMeshFn
      : (stageConfig && typeof stageConfig.createEnemyMeshFn === 'function')
        ? stageConfig.createEnemyMeshFn
        : (cfg, sharedTexMap) => createRelativisticEnemyShipMesh(cfg, createRelativisticEnemyShip, sharedTexMap);

    const proceduralPoolCfg = (stageConfig && stageConfig.proceduralEnemyPoolConfig && typeof stageConfig.proceduralEnemyPoolConfig === 'object')
      ? stageConfig.proceduralEnemyPoolConfig
      : {};

    this.proceduralEnemyPool = this.initProceduralEnemyPool(primaryStageEnemy, {
      poolName: proceduralPoolCfg.poolName || PROCEDURAL_ENEMY_POOL_NAME,
      initialSize: proceduralPoolCfg.initialSize || primaryStageEnemy.pool_size || 16,
      createProceduralEnemyMeshFn: (cfg, sharedTexMap) => shipMeshBuilder({ ...primaryStageEnemy, ...(cfg || {}) }, sharedTexMap),
      sharedTextures: this._sharedProceduralTextures
    });
    this.relativisticEnemyShipPool = this.proceduralEnemyPool;

    // Expose explicit separation between other graphics assets and procedural enemy graphics
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
      `[EventHorizonObjectPool] Initialized Stage 2 pools (separate procedural enemy pool: ${this.proceduralEnemyPool.poolName}, size=${this.proceduralEnemyPool.pool.length}; standard enemyPools=${this.enemyPools.size}) for:`,
      configWithDefaults.stage_name
    );
  }

  /**
   * Overrides StageObjectPool.initEnemyPools() so procedural Stage 2 enemies are NEVER
   * mixed into the generic StageObjectPool.enemyPools asset map.
   */
  initEnemyPools() {
    this.enemyPools = new Map();
  }

  /**
   * Pre-allocates the separate procedural enemy graphics pool for Stage 2.
   */
  initProceduralEnemyPool(enemyConfig = RELATIVISTIC_ENEMY_SHIP_TEMPLATE, poolOptions = {}) {
    const procPool = new RelativisticEnemyShipProceduralEnemyPool(this.scene, enemyConfig, poolOptions);
    this.proceduralEnemyPools.set('relativistic_enemy_ship', procPool);
    this.proceduralEnemyPools.set('tachyon_cruiser', procPool);
    this.proceduralEnemyPools.set('tachyon_cruiser_lego', procPool);
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

  getRelativisticEnemyShipProceduralEnemyPool() {
    return this.relativisticEnemyShipPool || this.proceduralEnemyPool || this.proceduralEnemyPools.get('relativistic_enemy_ship') || null;
  }

  /**
   * Returns the dedicated separate procedural enemy graphics pool.
   */
  getProceduralEnemyPool(enemyConfig = null) {
    if (this.proceduralEnemyPools && enemyConfig) {
      if (typeof enemyConfig === 'string' && this.proceduralEnemyPools.has(enemyConfig)) {
        return this.proceduralEnemyPools.get(enemyConfig);
      }
      if (enemyConfig.model_3d_type && this.proceduralEnemyPools.has(enemyConfig.model_3d_type)) {
        return this.proceduralEnemyPools.get(enemyConfig.model_3d_type);
      }
      if (enemyConfig.enemy_id && this.proceduralEnemyPools.has(enemyConfig.enemy_id)) {
        return this.proceduralEnemyPools.get(enemyConfig.enemy_id);
      }
      if (enemyConfig.id && this.proceduralEnemyPools.has(enemyConfig.id)) {
        return this.proceduralEnemyPools.get(enemyConfig.id);
      }
    }
    return this.proceduralEnemyPool
      || this.relativisticEnemyShipPool
      || (this.proceduralEnemyPools && (
        this.proceduralEnemyPools.get('relativistic_enemy_ship')
        || this.proceduralEnemyPools.values().next().value
      ))
      || null;
  }

  getEnemyPool(enemyConfig = null) {
    // Stage 2: Event Horizon strictly routes enemy pool lookups to its separate procedural enemy pool
    return this.getProceduralEnemyPool(enemyConfig);
  }

  /**
   * Spawns a pre-allocated procedural Relativistic Enemy Ship graphic from
   * Stage 2's separate procedural enemy pool.
   */
  spawnProceduralEnemy(enemyConfig = null, position = null, quaternion = null, scale = null) {
    const procPool = this.getProceduralEnemyPool(enemyConfig);
    if (!procPool) return null;

    const mesh = procPool.spawn(position, quaternion, scale);
    if (mesh) {
      resetRelativisticShipWeaponDecals(mesh);
      mesh.userData = mesh.userData || {};
      mesh.userData.fromPool = true;
      mesh.userData.fromProceduralEnemyPool = true;
      mesh.userData.isProceduralEnemyGraphic = true;
      mesh.userData.isProceduralEventHorizonEnemy = true;
      mesh.userData.isRelativisticEnemyShip = true;
      mesh.userData.poolCategory = 'procedural_enemy';
      mesh.userData.proceduralPoolName = procPool.poolName || PROCEDURAL_ENEMY_POOL_NAME;
      mesh.userData.pooledEnemyKey = 'relativistic_enemy_ship';
      mesh.userData.poolKey = 'relativistic_enemy_ship';
    }
    return mesh;
  }

  spawnEnemy(enemyConfig, position, quaternion = null, scale = null) {
    return this.spawnProceduralEnemy(enemyConfig, position, quaternion, scale);
  }

  /**
   * Returns a procedural Relativistic Enemy Ship graphic back to Stage 2's
   * separate procedural enemy pool.
   */
  despawnProceduralEnemy(mesh, enemyConfig = null) {
    if (!mesh) return false;
    resetRelativisticShipWeaponDecals(mesh);

    const targetPool = this.getProceduralEnemyPool(enemyConfig);
    if (targetPool && targetPool.active && targetPool.active.has(mesh)) {
      targetPool.despawn(mesh);
      return true;
    }

    const uniqueProcPools = new Set([
      this.proceduralEnemyPool,
      this.relativisticEnemyShipPool,
      ...(this.proceduralEnemyPools ? this.proceduralEnemyPools.values() : [])
    ].filter(Boolean));
    for (const pool of uniqueProcPools) {
      if (pool.active && pool.active.has(mesh)) {
        pool.despawn(mesh);
        return true;
      }
    }

    const isRelativisticMesh = Boolean(
      mesh.userData && (
        mesh.userData.isRelativisticEnemyShip ||
        mesh.userData.proceduralEnemyKind === 'relativistic_enemy_ship' ||
        (targetPool && mesh.userData.proceduralPoolName === targetPool.poolName)
      )
    );
    if (targetPool && isRelativisticMesh) {
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
      this.proceduralEnemyPool,
      this.relativisticEnemyShipPool,
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
      this.proceduralEnemyPool,
      this.relativisticEnemyShipPool,
      ...(this.proceduralEnemyPools ? this.proceduralEnemyPools.values() : [])
    ].filter(Boolean));

    if (typeof window !== 'undefined') {
      if (window.stageProceduralEnemyPool && uniqueProcPools.has(window.stageProceduralEnemyPool)) {
        window.stageProceduralEnemyPool = null;
      }
      if (window.stageRelativisticEnemyShipPool && uniqueProcPools.has(window.stageRelativisticEnemyShipPool)) {
        window.stageRelativisticEnemyShipPool = null;
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
    this.proceduralEnemyPool = null;
    this.relativisticEnemyShipPool = null;

    if (this._sharedProceduralTextures) {
      for (const tex of this._sharedProceduralTextures.values()) {
        try { tex.dispose(); } catch (_) {}
      }
      this._sharedProceduralTextures.clear();
    }

    super.dispose();
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new EventHorizonObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };
