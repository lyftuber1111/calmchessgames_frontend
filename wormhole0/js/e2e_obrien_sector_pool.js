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
 * Wormhole XR - Stage 99: E2E O'Brien Sector Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, weapons, powerups,
 * and cosmic environment attributes pulled dynamically from the Game Manager admin database.
 */

export class E2eObrienSectorObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 99,
      stage_name: "E2E O'Brien Sector",
      stage_slug: "e2e_obrien_sector",
      environment_theme: "Quantum Nebula",
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
        "id": "stage_99_laser",
        "name": "Stage 99 Laser",
        "icon": "⚡",
        "color": "#00f0ff",
        "damage": 2,
        "bullet_speed": 600,
        "energy_drain_pct": 10,
        "can_overheat": 1,
        "cooldown_seconds": 5,
        "acquire_event": "default_start",
        "description": "Standard directed plasma emitter for Stage 99.",
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
        "special_fx": "cockpit_cracks_red_edges",
        "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
        "special_fx_type": "overlay"
    },
    "acquirable": []
},
      enemies: [
    {
        "id": "stage_99_recon_drone",
        "enemy_id": "stage_99_recon_drone",
        "name": "Sector 99 Recon Drone",
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
        "weapon_special_fx": "cockpit_cracks_red_edges",
        "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
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
                "special_fx": "cockpit_cracks_red_edges",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
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
        "id": "stage_99_interceptor",
        "enemy_id": "stage_99_interceptor",
        "name": "Sector 99 Interceptor",
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
        "weapon_special_fx": "cockpit_cracks_red_edges",
        "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
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
                "special_fx": "cockpit_cracks_red_edges",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
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
    }
],
      powerups: [],
      environment: [],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[E2eObrienSectorObjectPool] Pre-allocated graphics object pool for Stage 99:`, configWithDefaults.stage_name);
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new E2eObrienSectorObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };