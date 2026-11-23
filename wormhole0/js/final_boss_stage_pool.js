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
 * Wormhole XR - Stage 5: Final Boss Stage Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, weapons, powerups,
 * and cosmic environment attributes pulled dynamically from the Game Manager admin database.
 */

export class FinalBossStageObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 5,
      stage_name: "Final Boss Stage",
      stage_slug: "final_boss_stage",
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
        "id": "quantum_disruptor",
        "name": "Quantum Disruptor",
        "icon": "⚡",
        "color": "#ff00aa",
        "damage": 5,
        "bullet_speed": 1050,
        "energy_drain_pct": 18,
        "can_overheat": 1,
        "cooldown_seconds": 5.5,
        "acquire_event": "default_start",
        "description": "Heavy antimatter pulse array piercing dark matter shields.",
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
        "id": "boss_escort_fighter",
        "enemy_id": "boss_escort_fighter",
        "name": "Overlord Heavy Escort Fighter (Universal)",
        "device_type": "all",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 1.25,
        "length": 4.2,
        "height": 1.5,
        "depth": 3.5,
        "circumference": 9,
        "color": "#f87171",
        "hits": 5,
        "armor": 25,
        "has_force_field": 1,
        "shield": 5,
        "speed": 220,
        "attack_damage": 15,
        "weapon_name": "Heavy Plasma Pulse",
        "weapon_damage": 15,
        "weapon_speed": 550,
        "weapon_color": "#f87171",
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
        "fire_rate": 2,
        "fire_rate_seconds": 2,
        "fire_rate_ms": 2000,
        "fire_rate_times_per_sec": 0.5,
        "weapons": [
            {
                "id": "ew_escort_pulse",
                "name": "Heavy Plasma Pulse",
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
                "fire_rate_times_per_sec": 0.5,
                "fire_interval_ms": 2000,
                "fire_rate_seconds": 2,
                "damage": 15,
                "speed": 550,
                "color": "#f87171",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 500,
        "threat": "High",
        "piercing": "any",
        "pool_size": 30,
        "quick_effect_primary": "engine_ion_thrust",
        "quick_effect_secondary": "energy_shield_pulse",
        "quick_effect_color": "#f87171",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 50,
        "destruction_particle_color": "#f87171",
        "destruction_particle_scale": 1.2
    },
    {
        "id": "final_boss_titan",
        "enemy_id": "final_boss_titan",
        "name": "Singularity Overlord Titan (Stage 5 Boss) (Universal)",
        "device_type": "all",
        "enemy_class": "Boss Dreadnought",
        "icon": "💀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 2.2,
        "length": 9,
        "height": 4.8,
        "depth": 9,
        "circumference": 25,
        "color": "#ef4444",
        "hits": 45,
        "armor": 100,
        "has_force_field": 1,
        "shield": 20,
        "speed": 85,
        "attack_damage": 75,
        "weapon_name": "Overlord Annihilator",
        "weapon_damage": 75,
        "weapon_speed": 650,
        "weapon_color": "#ef4444",
        "weapon_scale": 1.5,
        "weapon_scale_x": 1,
        "weapon_scale_y": 1,
        "weapon_scale_z": 1,
        "weapon_size_x": 1.5,
        "weapon_size_y": 1.5,
        "weapon_size_z": 2,
        "weapon_dimensions": {
            "x": 1.5,
            "y": 1.5,
            "z": 2
        },
        "weapon_special_fx": "cockpit_overlay_decals",
        "weapon_special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 1.2,
        "fire_rate_seconds": 1.2,
        "fire_rate_ms": 1200,
        "fire_rate_times_per_sec": 0.833,
        "weapons": [
            {
                "id": "ew_boss_beam",
                "name": "Overlord Annihilator",
                "type": "beam",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.2,
                "fire_point_z": 2,
                "scale": 1.5,
                "scale_x": 1,
                "scale_y": 1,
                "scale_z": 1,
                "size_x": 1.5,
                "size_y": 1.5,
                "size_z": 2,
                "dimensions": {
                    "x": 1.5,
                    "y": 1.5,
                    "z": 2
                },
                "fire_rate_times_per_sec": 0.833,
                "fire_interval_ms": 1200,
                "fire_rate_seconds": 1.2,
                "damage": 75,
                "speed": 650,
                "color": "#ef4444",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            },
            {
                "id": "ew_boss_torpedo",
                "name": "Gravitational Torpedo",
                "type": "missile",
                "mount": "dual_wingtip",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 2.5,
                "fire_point_y": 0,
                "fire_point_z": 1,
                "scale": 1.2,
                "scale_x": 1,
                "scale_y": 1,
                "scale_z": 1,
                "size_x": 1,
                "size_y": 1,
                "size_z": 1.8,
                "dimensions": {
                    "x": 1,
                    "y": 1,
                    "z": 1.8
                },
                "fire_rate_times_per_sec": 0.4,
                "fire_interval_ms": 2500,
                "fire_rate_seconds": 2.5,
                "damage": 50,
                "speed": 450,
                "color": "#ff0055",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 10000,
        "threat": "Extreme",
        "piercing": "quantum_disruptor",
        "pool_size": 100,
        "quick_effect_primary": "gravitational_vortex",
        "quick_effect_secondary": "quantum_phase_glow",
        "quick_effect_color": "#ef4444",
        "quick_effect_intensity": 1.5,
        "quick_effect_speed": 1.2,
        "destruction_particle_type": "procedural_quantum_implosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 150,
        "destruction_particle_color": "#ef4444",
        "destruction_particle_scale": 2
    }
],
      powerups: [],
      environment: {
    "id": 9,
    "env_id": "final_boss_singularity_s5",
    "env_name": "Singularity Overlord Crimson Epicenter",
    "env_category": "wormhole_singularity",
    "stage_level": 5,
    "device_type": "all",
    "model_3d_type": "procedural_wormhole",
    "model_3d_url": "",
    "image_asset_url": "desktop/final_boss_stage_images/singularity_corona.png",
    "image_asset_type": "corona_sprite",
    "scale": "1.60",
    "event_horizon_radius": "11.50",
    "accretion_disk_radius": "55.00",
    "length": "420.00",
    "height": "110.00",
    "depth": "420.00",
    "circumference": "72.26",
    "color_primary": "#ef4444",
    "color_edge": "#660011",
    "color_core": "#ff0033",
    "color_hot": "#ffe0e6",
    "color_halo": "#ef4444",
    "ambient_light": "#2b0008",
    "center_light": "#ef4444",
    "rotation_speed": "1.500",
    "distortion_intensity": "2.25",
    "particle_count": 7500,
    "quick_effect_primary": "gravitational_vortex",
    "quick_effect_secondary": "quantum_phase_glow",
    "quick_effect_color": "#ef4444",
    "quick_effect_intensity": "1.80",
    "quick_effect_speed": "1.50",
    "description": "Crimson singularity epicenter commanded by the Overlord Titan dreadnought flagship.",
    "is_enabled": 1,
    "created_at": "2026-11-23 02:51:36",
    "updated_at": "2026-11-23 02:59:00"
},
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[FinalBossStageObjectPool] Pre-allocated graphics object pool for Stage 5:`, configWithDefaults.stage_name);
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new FinalBossStageObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };