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

export const STAGE_COCKPIT_CRACKS_GLB_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_URL = "scene_images/screen_decals_spider_web_overlay_4.glb";
export const STAGE_COCKPIT_CRACKS_ASSET_TYPE = "3d_model";

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
 * Wormhole XR - Stage 6: Nebula Outpost Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, weapons, powerups,
 * and cosmic environment attributes pulled dynamically from the Game Manager admin database.
 */

export class NebulaOutpostObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 6,
      stage_name: "Nebula Outpost",
      stage_slug: "nebula_outpost",
      environment_theme: "Ion Nebula Emerald",
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
      initial_enemy_pool_size: 100,
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
        "enemy_count": 9,
        "interval_seconds": 15,
        "delay_ms": 30000,
        "description": "Wave 3: Sector Assault (9 Enemies)"
    }
],
      total_waves: 3,
      wave_interval_seconds: 15,
      weapons: {
    "initial": {
        "id": "stage_6_laser",
        "name": "Stage 6 Laser",
        "icon": "⚡",
        "color": "#00f0ff",
        "damage": 2,
        "bullet_speed": 600,
        "energy_drain_pct": 10,
        "can_overheat": 1,
        "cooldown_seconds": 5,
        "acquire_event": "default_start",
        "description": "Standard directed plasma emitter for Stage 6.",
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
    "acquirable": []
},
      enemies: [
    {
        "id": "stage_6_recon_drone",
        "enemy_id": "stage_6_recon_drone",
        "name": "Sector 6 Recon Drone (Universal)",
        "device_type": "all",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 1,
        "length": 2.8,
        "height": 2.8,
        "depth": 2.8,
        "circumference": 8.8,
        "color": "#00f0ff",
        "hits": 2,
        "armor": 10,
        "has_force_field": 0,
        "shield": 0,
        "speed": 220,
        "attack_damage": 5,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 5,
        "weapon_speed": 450,
        "weapon_color": "#00f0ff",
        "weapon_scale": 1,
        "weapon_scale_x": 1,
        "weapon_scale_y": 1,
        "weapon_scale_z": 1,
        "weapon_size_x": 0.5,
        "weapon_size_y": 0.5,
        "weapon_size_z": 1,
        "weapon_dimensions": {
            "x": 0.5,
            "y": 0.5,
            "z": 1
        },
        "weapon_special_fx": "cockpit_overlay_decals",
        "weapon_special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 2,
        "fire_rate_seconds": 2,
        "fire_rate_ms": 2000,
        "fire_rate_times_per_sec": 0.5,
        "weapons": [
            {
                "id": "ew_pulse",
                "name": "Plasma Pulse",
                "type": "beam",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
                "scale": 1,
                "scale_x": 1,
                "scale_y": 1,
                "scale_z": 1,
                "size_x": 0.5,
                "size_y": 0.5,
                "size_z": 1,
                "dimensions": {
                    "x": 0.5,
                    "y": 0.5,
                    "z": 1
                },
                "fire_rate_times_per_sec": 0.5,
                "fire_interval_ms": 2000,
                "fire_rate_seconds": 2,
                "damage": 5,
                "speed": 450,
                "color": "#00f0ff",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 150,
        "threat": "Low",
        "piercing": "any",
        "pool_size": 30,
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
        "id": "stage_6_interceptor",
        "enemy_id": "stage_6_interceptor",
        "name": "Sector 6 Interceptor (Universal)",
        "device_type": "all",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 1.1,
        "length": 4.2,
        "height": 1.3,
        "depth": 3.4,
        "circumference": 5,
        "color": "#38bdf8",
        "hits": 4,
        "armor": 20,
        "has_force_field": 0,
        "shield": 0,
        "speed": 250,
        "attack_damage": 10,
        "weapon_name": "Dual Ion Cannon",
        "weapon_damage": 10,
        "weapon_speed": 550,
        "weapon_color": "#38bdf8",
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
        "fire_rate": 2.5,
        "fire_rate_seconds": 2.5,
        "fire_rate_ms": 2500,
        "fire_rate_times_per_sec": 0.4,
        "weapons": [
            {
                "id": "ew_ion",
                "name": "Dual Ion Cannon",
                "type": "beam",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
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
                "fire_rate_times_per_sec": 0.4,
                "fire_interval_ms": 2500,
                "fire_rate_seconds": 2.5,
                "damage": 10,
                "speed": 550,
                "color": "#38bdf8",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 300,
        "threat": "Medium",
        "piercing": "any",
        "pool_size": 30,
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
    },
    {
        "id": "e2e_test_enemy",
        "enemy_id": "e2e_test_enemy",
        "name": "E2E Void Destroyer (VR Headset)",
        "device_type": "vr",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/event_horizon_images/relativistic_reinforced_hull.glb",
        "scale": 1.5,
        "length": 4.5,
        "height": 2,
        "depth": 4.5,
        "circumference": 12,
        "color": "#ff3366",
        "hits": 12,
        "armor": 50,
        "has_force_field": 1,
        "shield": 80,
        "speed": 320,
        "attack_damage": 18,
        "weapon_name": "Primary Beam",
        "weapon_damage": 9,
        "weapon_speed": 620,
        "weapon_color": "#ff2255",
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
        "weapon_special_fx": "none",
        "weapon_special_fx_file": "",
        "weapon_special_fx_type": "none",
        "fire_rate": 2,
        "fire_rate_seconds": 2,
        "fire_rate_ms": 2000,
        "fire_rate_times_per_sec": 0.5,
        "weapons": [
            {
                "id": "ew_0",
                "name": "Primary Beam",
                "type": "beam",
                "mount": "dual_wingtip",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
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
                "fire_rate_times_per_sec": 0.5,
                "fire_interval_ms": 2000,
                "fire_rate_seconds": 2,
                "damage": 9,
                "speed": 620,
                "color": "#ff2255",
                "special_fx": "none",
                "special_fx_file": "",
                "special_fx_type": "none",
                "is_enabled": 1
            }
        ],
        "score": 750,
        "threat": "High",
        "piercing": "any",
        "pool_size": 30,
        "quick_effect_primary": "none",
        "quick_effect_secondary": "none",
        "quick_effect_color": "#00f0ff",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_sparks_explosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 40,
        "destruction_particle_color": "#ff3366",
        "destruction_particle_scale": 1
    }
],
      powerups: [],
      environment: {
    "id": 10,
    "env_id": "nebula_outpost_s6",
    "env_name": "Ion Nebula Emerald Staging Perimeter",
    "env_category": "nebula_cloud",
    "stage_level": 6,
    "device_type": "all",
    "model_3d_type": "procedural_wormhole",
    "model_3d_url": "",
    "image_asset_url": "desktop/nebula_outpost_images/singularity_corona.png",
    "image_asset_type": "corona_sprite",
    "scale": "1.25",
    "event_horizon_radius": "8.50",
    "accretion_disk_radius": "44.00",
    "length": "340.00",
    "height": "95.00",
    "depth": "340.00",
    "circumference": "53.41",
    "color_primary": "#10b981",
    "color_edge": "#003322",
    "color_core": "#00ff88",
    "color_hot": "#d6fff0",
    "color_halo": "#10b981",
    "ambient_light": "#002211",
    "center_light": "#10b981",
    "rotation_speed": "0.900",
    "distortion_intensity": "1.40",
    "particle_count": 5800,
    "quick_effect_primary": "plasma_aura",
    "quick_effect_secondary": "arc_lightning",
    "quick_effect_color": "#10b981",
    "quick_effect_intensity": "1.25",
    "quick_effect_speed": "1.20",
    "description": "Dense electromagnetic emerald ion nebula corridor harboring outpost command relays.",
    "is_enabled": 1,
    "created_at": "2026-11-23 02:51:36",
    "updated_at": "2026-11-23 02:51:36"
},
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[NebulaOutpostObjectPool] Pre-allocated graphics object pool for Stage 6:`, configWithDefaults.stage_name);
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new NebulaOutpostObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };