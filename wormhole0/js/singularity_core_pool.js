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
  createSingularityGuardian,
  weaponDecalName as SINGULARITY_WEAPON_DECAL_NAME,
  metadata as SINGULARITY_GUARDIAN_METADATA
} from '../desktop/singularity_core_images/singularity_guardian.js';

export const STAGE_COCKPIT_CRACKS_GLB_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_TYPE = "3d_model";

export const SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME = SINGULARITY_WEAPON_DECAL_NAME || 'Decal_LaserBurn_Central_Weapon';
export const SINGULARITY_WEAPON_FIRE_DURATION_MS = 1000;

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
 * Resolves the burn central weapon decal mesh (Decal_LaserBurn_Central_Weapon)
 * on a Singularity Guardian enemy object or Three.js mesh root.
 */
export function getSingularityWeaponDecal(enemyOrMesh) {
  const mesh = (enemyOrMesh && enemyOrMesh.mesh) ? enemyOrMesh.mesh : enemyOrMesh;
  if (!mesh) return null;

  if (mesh.userData && mesh.userData.weaponDecalMesh) {
    return mesh.userData.weaponDecalMesh;
  }
  if (mesh.userData && mesh.userData.singularityGuardian) {
    const sg = mesh.userData.singularityGuardian;
    if (sg.weaponDecalMesh) return sg.weaponDecalMesh;
    if (sg.object && sg.object.userData && sg.object.userData.singularityGuardian && sg.object.userData.singularityGuardian.weaponDecalMesh) {
      return sg.object.userData.singularityGuardian.weaponDecalMesh;
    }
  }
  if (typeof mesh.getObjectByName === 'function') {
    const found = mesh.getObjectByName(SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME);
    if (found) {
      if (mesh.userData) mesh.userData.weaponDecalMesh = found;
      return found;
    }
  }
  return null;
}

/**
 * Turns the Singularity Guardian burn central weapon decal ON or OFF.
 */
export function setSingularityWeaponDecalEnabled(enemyOrMesh, enabled) {
  const decalMesh = getSingularityWeaponDecal(enemyOrMesh);
  if (!decalMesh) return false;
  decalMesh.visible = Boolean(enabled);
  return true;
}

/**
 * Builds a centered procedural Singularity Guardian enemy mesh instance from
 * singularity_guardian.js with Decal_LaserBurn_Central_Weapon initialized OFF.
 */
export function createSingularityGuardianMesh(config = {}, factoryFn = createSingularityGuardian) {
  const buildFn = (typeof factoryFn === 'function') ? factoryFn : createSingularityGuardian;
  const guardian = buildFn({ THREE });
  const rootObj = guardian && guardian.object ? guardian.object : new THREE.Group();

  const dimsMeta = (guardian && guardian.metadata && guardian.metadata.dimensions)
    || (SINGULARITY_GUARDIAN_METADATA && SINGULARITY_GUARDIAN_METADATA.dimensions)
    || { width: 3.80, height: 3.80, depth: 3.80 };
  const halfHeight = (Number(dimsMeta.height) || 3.80) * 0.5;

  // Center the 3.80m cube around local origin (0, 0, 0) for 3D flight rotation and hit detection
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

  const weaponDecalMesh = (
    rootObj.userData &&
    rootObj.userData.singularityGuardian &&
    rootObj.userData.singularityGuardian.weaponDecalMesh
  ) || (typeof rootObj.getObjectByName === 'function' ? rootObj.getObjectByName(SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME) : null);

  // Burn central weapon decal starts OFF until weapon firing triggers it for 1 second
  if (weaponDecalMesh) {
    weaponDecalMesh.visible = false;
  }

  const initialElapsed = Math.random() * ((guardian && guardian.duration) || 6.0);
  if (guardian && typeof guardian.update === 'function') {
    guardian.update(0, initialElapsed);
  }

  const group = new THREE.Group();
  group.name = 'SingularityGuardian_Enemy';
  group.add(rootObj);

  const userScale = Math.max(0.05, Math.min(20.0, parseFloat(config && config.scale !== undefined && config.scale !== null ? config.scale : 1.2) || 1.2));
  const length = Number(dimsMeta.width) || 3.80;
  const height = Number(dimsMeta.height) || 3.80;
  const depth = Number(dimsMeta.depth) || 3.80;
  const circumference = (guardian && guardian.metadata && guardian.metadata.circumferenceOval) || 11.94;

  group.userData = group.userData || {};
  group.userData.isSingularityGuardian = true;
  group.userData.singularityGuardian = guardian;
  group.userData.weaponDecalName = SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME;
  group.userData.weaponDecalMesh = weaponDecalMesh;
  group.userData.proceduralElapsed = initialElapsed;
  group.userData._centralWeaponFiring = false;
  group.userData._centralWeaponFireRemaining = 0;
  group.userData._centralWeaponFireEndTime = 0;
  group.userData.config = config || {};
  group.userData.dimensions = {
    scale: userScale,
    length,
    height,
    depth,
    circumference,
    radius: halfHeight
  };

  return group;
}

export const SINGULARITY_GUARDIAN_ENEMY_TEMPLATE = {
  "id": "void_guardian",
  "enemy_id": "void_guardian",
  "name": "Singularity Guardian",
  "enemy_name": "Singularity Guardian",
  "device_type": "all",
  "enemy_class": "Ancient Anomaly Automaton",
  "icon": "👾",
  "model_3d_type": "singularity_guardian",
  "model_3d_url": "",
  "procedural_model_url": "desktop/singularity_core_images/singularity_guardian.js",
  "scale": 1.2,
  "length": 3.8,
  "height": 3.8,
  "depth": 3.8,
  "circumference": 11.94,
  "color": "#a855f7",
  "hits": 15,
  "hits_to_destroy": 15,
  "armor": 70,
  "armor_strength": 70,
  "has_force_field": 1,
  "shield": 6,
  "speed": 150,
  "attack_damage": 35,
  "weapon_name": "Void Disruptor",
  "weapon_damage": 35,
  "weapon_speed": 400,
  "weapon_color": "#a855f7",
  "weapon_decal_name": SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME,
  "weapon_fire_duration_ms": SINGULARITY_WEAPON_FIRE_DURATION_MS,
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
  "fire_rate": 2.2,
  "fire_rate_seconds": 2.2,
  "fire_rate_ms": 2200,
  "fire_rate_times_per_sec": 0.455,
  "weapons": [
    {
      "id": "ew_void_guardian_0",
      "name": "Plasma Pulse",
      "type": "beam",
      "mount": "center",
      "model_url": "",
      "model_type": "decal_central_weapon",
      "weapon_decal_name": SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME,
      "fire_duration_ms": SINGULARITY_WEAPON_FIRE_DURATION_MS,
      "fire_duration_seconds": 1.0,
      "fire_point_x": 0,
      "fire_point_y": 0,
      "fire_point_z": 0,
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
      "fire_rate_times_per_sec": 0.455,
      "fire_interval_ms": 2200,
      "fire_rate_seconds": 2.2,
      "damage": 5,
      "speed": 450,
      "color": "#ff2255",
      "special_fx": "cockpit_overlay_decals",
      "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
      "special_fx_type": "overlay",
      "is_enabled": 1
    }
  ],
  "score": 1000,
  "score_value": 1000,
  "threat": "High",
  "threat_level": "High",
  "piercing": "plasma_torpedo",
  "piercing_weapon_id": "plasma_torpedo",
  "pool_size": 12,
  "quick_effect_primary": "gravitational_vortex",
  "quick_effect_secondary": "arc_lightning",
  "quick_effect_color": "#a855f7",
  "quick_effect_intensity": 1,
  "quick_effect_speed": 1,
  "destruction_particle_type": "procedural_quantum_implosion",
  "destruction_particle_url": "",
  "destruction_particle_count": 80,
  "destruction_particle_color": "#a855f7",
  "destruction_particle_scale": 1
};

/**
 * Wormhole XR - Stage 3: Singularity Core Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates Singularity Guardian procedural 3D enemies and weapons graphic objects
 * for Stage 3: Singularity Core.
 */

export class SingularityCoreObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const primaryStageEnemy = (
      stageConfig &&
      Array.isArray(stageConfig.enemies) &&
      stageConfig.enemies.length > 0
    )
      ? { ...SINGULARITY_GUARDIAN_ENEMY_TEMPLATE, ...stageConfig.enemies[0] }
      : { ...SINGULARITY_GUARDIAN_ENEMY_TEMPLATE };

    // Ensure Stage 3 only pre-allocates the Singularity Guardian procedural enemy
    primaryStageEnemy.model_3d_type = 'singularity_guardian';
    primaryStageEnemy.model_3d_url = '';
    primaryStageEnemy.weapon_decal_name = SINGULARITY_GUARDIAN_WEAPON_DECAL_NAME;
    primaryStageEnemy.weapon_fire_duration_ms = SINGULARITY_WEAPON_FIRE_DURATION_MS;
    primaryStageEnemy.pool_size = Math.max(12, Math.min(Number(primaryStageEnemy.pool_size) || 12, 16));

    const configWithDefaults = {
      stage_level: 3,
      stage_name: "Singularity Core",
      stage_slug: "singularity_core",
      environment_theme: "Singularity Void Violet",
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
      initial_enemy_pool_size: 12,
      waves: [
        {
          "wave_number": 1,
          "enemy_count": 6,
          "interval_seconds": 0,
          "delay_ms": 0,
          "description": "Wave 1: Sector Assault (6 Enemies)"
        },
        {
          "wave_number": 2,
          "enemy_count": 10,
          "interval_seconds": 15,
          "delay_ms": 15000,
          "description": "Wave 2: Sector Assault (10 Enemies)"
        },
        {
          "wave_number": 3,
          "enemy_count": 4,
          "interval_seconds": 15,
          "delay_ms": 30000,
          "description": "Wave 3: Sector Assault (4 Enemies)"
        }
      ],
      total_waves: 3,
      wave_interval_seconds: 15,
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
          "description": "Heavy magnetic payload causing massive kinetic shockwave without overheating.",
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
            "description": "Heavy magnetic payload causing massive kinetic shockwave without overheating.",
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
          "id": 5,
          "powerup_id": "health_pack_s3",
          "powerup_name": "Graviton Integrity Restorer",
          "powerup_type": "health",
          "restore_both": 0,
          "icon": "🧪",
          "model_3d_type": "icosahedron",
          "model_3d_url": "",
          "color_hex": "#a855f7",
          "scale": 1,
          "length": 2.5,
          "height": 2.5,
          "depth": 2.5,
          "circumference": 6,
          "stage_level": 3,
          "device_type": "all",
          "trigger_events": "Gravitational Tidal Waves, Core Guardian Awakening",
          "drop_on_enemy_kill": 1,
          "drop_chance_pct": 50,
          "enemy_id": "tachyon_cruiser",
          "boost_percentage": 45,
          "description": "High-density graviton canister neutralizing gravitational shear. Restores 45% hull armor.",
          "is_enabled": 1
        },
        {
          "id": 6,
          "powerup_id": "shield_cell_s3",
          "powerup_name": "Singularity Void Barrier",
          "powerup_type": "shield",
          "restore_both": 0,
          "icon": "🔷",
          "model_3d_type": "sphere",
          "model_3d_url": "",
          "color_hex": "#6366f1",
          "scale": 1,
          "length": 3,
          "height": 3,
          "depth": 3,
          "circumference": 7.5,
          "stage_level": 3,
          "device_type": "all",
          "trigger_events": "Singularity Probe Deployment, Heavy Antimatter Eruptions",
          "drop_on_enemy_kill": 1,
          "drop_chance_pct": 65,
          "enemy_id": "void_guardian",
          "boost_percentage": 50,
          "description": "Generates temporary singularity deflection field. Recharges shields by +50%.",
          "is_enabled": 1
        }
      ],
      environment: {
        "id": 3,
        "env_id": "singularity_core_s3",
        "env_name": "Void Violet Gravitational Collapse Singularity",
        "env_category": "wormhole_singularity",
        "stage_level": 3,
        "device_type": "all",
        "model_3d_type": "procedural_wormhole",
        "model_3d_url": "",
        "image_asset_url": "desktop/singularity_core_images/singularity_corona.png",
        "image_asset_type": "corona_sprite",
        "scale": "1.30",
        "event_horizon_radius": "9.00",
        "accretion_disk_radius": "46.00",
        "length": "350.00",
        "height": "90.00",
        "depth": "350.00",
        "circumference": "56.55",
        "color_primary": "#c084fc",
        "color_edge": "#330066",
        "color_core": "#9933ff",
        "color_hot": "#f5e6ff",
        "color_halo": "#a855f7",
        "ambient_light": "#1a0033",
        "center_light": "#a855f7",
        "rotation_speed": "1.100",
        "distortion_intensity": "1.65",
        "particle_count": 6000,
        "quick_effect_primary": "gravitational_vortex",
        "quick_effect_secondary": "arc_lightning",
        "quick_effect_color": "#c084fc",
        "quick_effect_intensity": "1.40",
        "quick_effect_speed": "1.30",
        "description": "Extreme gravitational collapse boundary with violent space-time tearing, dark void violet accretion flow, and deep gravitational vortex.",
        "is_enabled": 1,
        "created_at": "2026-11-10 04:03:56",
        "updated_at": "2026-11-23 02:59:00"
      },
      ...stageConfig,
      enemies: [primaryStageEnemy]
    };

    const guardianMeshBuilder = (stageConfig && typeof stageConfig.createEnemyMeshFn === 'function')
      ? stageConfig.createEnemyMeshFn
      : (cfg) => createSingularityGuardianMesh(cfg, createSingularityGuardian);

    const poolOptions = {
      ...options,
      createEnemyMeshFn: (cfg) => guardianMeshBuilder({ ...primaryStageEnemy, ...(cfg || {}) })
    };

    super(scene, configWithDefaults, poolOptions);

    // Ensure alias lookup keys ('singularity_guardian', 'void_guardian') always point to the single guardian pool
    const guardianPool = this.enemyPools.values().next().value || null;
    if (guardianPool) {
      this.enemyPools.set('singularity_guardian', guardianPool);
      this.enemyPools.set('void_guardian', guardianPool);
      this.enemyPools.set('singularity_probe', guardianPool);
    }

    console.log(`[SingularityCoreObjectPool] Pre-allocated Singularity Guardian graphics object pool for Stage 3:`, configWithDefaults.stage_name);
  }

  getEnemyPool(enemyConfig) {
    // Stage 3: Singularity Core strictly uses Singularity Guardian as its sole enemy
    return this.enemyPools.get('singularity_guardian')
      || this.enemyPools.get('void_guardian')
      || this.enemyPools.values().next().value
      || null;
  }

  spawnEnemy(enemyConfig, position, quaternion = null, scale = null) {
    const mesh = super.spawnEnemy(enemyConfig, position, quaternion, scale);
    if (mesh) {
      setSingularityWeaponDecalEnabled(mesh, false);
      if (mesh.userData) {
        mesh.userData._centralWeaponFiring = false;
        mesh.userData._centralWeaponFireRemaining = 0;
        mesh.userData._centralWeaponFireEndTime = 0;
        const sg = mesh.userData.singularityGuardian;
        if (sg && typeof sg.update === 'function') {
          sg.update(0, mesh.userData.proceduralElapsed || 0);
        }
      }
    }
    return mesh;
  }

  despawnEnemy(mesh, enemyConfig = null) {
    if (mesh) {
      setSingularityWeaponDecalEnabled(mesh, false);
      if (mesh.userData) {
        mesh.userData._centralWeaponFiring = false;
        mesh.userData._centralWeaponFireRemaining = 0;
        mesh.userData._centralWeaponFireEndTime = 0;
      }
    }
    super.despawnEnemy(mesh, enemyConfig);
  }

  despawnAllEnemies() {
    const uniquePools = new Set(this.enemyPools.values());
    for (const pool of uniquePools) {
      if (pool && pool.active) {
        for (const mesh of pool.active) {
          setSingularityWeaponDecalEnabled(mesh, false);
          if (mesh && mesh.userData) {
            mesh.userData._centralWeaponFiring = false;
            mesh.userData._centralWeaponFireRemaining = 0;
            mesh.userData._centralWeaponFireEndTime = 0;
          }
        }
      }
    }
    super.despawnAllEnemies();
  }

  dispose() {
    const uniquePools = new Set(this.enemyPools.values());
    for (const pool of uniquePools) {
      if (!pool) continue;
      const allMeshes = [...(pool.pool || []), ...(pool.active ? Array.from(pool.active) : [])];
      for (const mesh of allMeshes) {
        if (mesh && mesh.userData && mesh.userData.singularityGuardian && typeof mesh.userData.singularityGuardian.dispose === 'function') {
          try {
            setSingularityWeaponDecalEnabled(mesh, false);
            mesh.userData.singularityGuardian.dispose();
          } catch (_) {}
        }
      }
    }
    super.dispose();
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new SingularityCoreObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };
