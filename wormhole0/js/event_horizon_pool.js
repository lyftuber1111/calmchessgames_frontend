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
 * Wormhole XR - Stage 2: Event Horizon Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, weapons, powerups,
 * and cosmic environment attributes pulled dynamically from the Game Manager admin database.
 */

export class EventHorizonObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
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
    "acquirable": []
},
      enemies: [
    {
        "id": "tachyon_cruiser",
        "enemy_id": "tachyon_cruiser",
        "name": "Horizon Tachyon Cruiser (Universal)",
        "device_type": "all",
        "enemy_class": "Heavy Cruiser",
        "icon": "🛰️",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/event_horizon_images/relativistic_reinforced_hull.glb",
        "scale": 3,
        "length": 2.19,
        "height": 2.63,
        "depth": 0.75,
        "circumference": 7.59,
        "color": "#ffd166",
        "hits": 2,
        "armor": 2,
        "has_force_field": 1,
        "shield": 1,
        "speed": 200,
        "attack_damage": 2,
        "weapon_name": "Tachyon Beam",
        "weapon_damage": 2,
        "weapon_speed": 600,
        "weapon_color": "#ffd166",
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
                "id": "ew_tachyon_cruiser_0",
                "name": "Tachyon Beam",
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
                "fire_rate_times_per_sec": 0.333,
                "fire_interval_ms": 3000,
                "fire_rate_seconds": 3,
                "damage": 2,
                "speed": 600,
                "color": "#ffd166",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 500,
        "threat": "High",
        "piercing": "tachyon_lance",
        "pool_size": 30,
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
    }
],
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
        "enemy_id": "phase_interceptor",
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
    "updated_at": "2026-11-23 02:51:36"
},
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[EventHorizonObjectPool] Pre-allocated graphics object pool for Stage 2:`, configWithDefaults.stage_name);
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