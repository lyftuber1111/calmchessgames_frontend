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
 * Wormhole XR - Stage 4: Quantum Realm Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, weapons, powerups,
 * and cosmic environment attributes pulled dynamically from the Game Manager admin database.
 */

export class QuantumRealmObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 4,
      stage_name: "Quantum Realm",
      stage_slug: "quantum_realm",
      environment_theme: "Quantum Phasor Magenta",
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
        "id": "quantum_phaser",
        "name": "Quantum Phaser",
        "icon": "✨",
        "color": "#10b981",
        "damage": 4,
        "bullet_speed": 950,
        "energy_drain_pct": 15,
        "can_overheat": 1,
        "cooldown_seconds": 6,
        "acquire_event": "deep_core_breakthrough",
        "description": "Sub-atomic pulse rifle optimized for deep singularity warfare.",
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
        "id": "quantum_dreadnought",
        "enemy_id": "quantum_dreadnought",
        "name": "Quantum Omega Dreadnought (Universal)",
        "device_type": "all",
        "enemy_class": "Boss Dreadnought",
        "icon": "💀",
        "model_3d_type": "dreadnought",
        "model_3d_url": "",
        "scale": 1.6,
        "length": 7,
        "height": 3.2,
        "depth": 6,
        "circumference": 15,
        "color": "#ef476f",
        "hits": 35,
        "armor": 90,
        "has_force_field": 1,
        "shield": 15,
        "speed": 90,
        "attack_damage": 60,
        "weapon_name": "Quantum Annihilator",
        "weapon_damage": 60,
        "weapon_speed": 650,
        "weapon_color": "#ef476f",
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
        "fire_rate": 1.2,
        "fire_rate_seconds": 1.2,
        "fire_rate_ms": 1200,
        "fire_rate_times_per_sec": 0.833,
        "weapons": [
            {
                "id": "ew_quantum_dreadnought_0",
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
                "size_x": 1,
                "size_y": 1,
                "size_z": 1,
                "dimensions": {
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "fire_rate_times_per_sec": 0.833,
                "fire_interval_ms": 1200,
                "fire_rate_seconds": 1.2,
                "damage": 5,
                "speed": 450,
                "color": "#ff2255",
                "special_fx": "cockpit_overlay_decals",
                "special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 5000,
        "threat": "Extreme",
        "piercing": "quantum_phaser",
        "pool_size": 100,
        "quick_effect_primary": "quantum_phase_glow",
        "quick_effect_secondary": "energy_shield_pulse",
        "quick_effect_color": "#ef476f",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 120,
        "destruction_particle_color": "#ef476f",
        "destruction_particle_scale": 1
    }
],
      powerups: [
    {
        "id": 7,
        "powerup_id": "health_pack_s4",
        "powerup_name": "Quantum Regenerative Core",
        "powerup_type": "health",
        "restore_both": 0,
        "icon": "💖",
        "model_3d_type": "icosahedron",
        "model_3d_url": "",
        "color_hex": "#ec4899",
        "scale": 1.1,
        "length": 2.8,
        "height": 2.8,
        "depth": 2.8,
        "circumference": 7,
        "stage_level": 4,
        "device_type": "all",
        "trigger_events": "Phase-Shift Anomalies, Quantum Dreadnought Confrontation",
        "drop_on_enemy_kill": 1,
        "drop_chance_pct": 60,
        "enemy_id": "quantum_dreadnought",
        "boost_percentage": 50,
        "description": "Sub-atomic phase reconstructor restoring vessel structural integrity by +50%.",
        "is_enabled": 1
    },
    {
        "id": 8,
        "powerup_id": "shield_cell_s4",
        "powerup_name": "Omni-Phase Deflector Matrix",
        "powerup_type": "shield",
        "restore_both": 0,
        "icon": "🛡️",
        "model_3d_type": "octahedron",
        "model_3d_url": "",
        "color_hex": "#00f0ff",
        "scale": 1.2,
        "length": 3.2,
        "height": 3.2,
        "depth": 3.2,
        "circumference": 8,
        "stage_level": 4,
        "device_type": "all",
        "trigger_events": "Multi-Dimensional Phasing, Antimatter Vortex",
        "drop_on_enemy_kill": 1,
        "drop_chance_pct": 80,
        "enemy_id": "all",
        "boost_percentage": 60,
        "description": "Multi-frequency quantum deflector battery. Restores +60% deflector shield power.",
        "is_enabled": 1
    }
],
      environment: {
    "id": 4,
    "env_id": "quantum_singularity_s4",
    "env_name": "Quantum Phasor Magenta Singularity",
    "env_category": "wormhole_singularity",
    "stage_level": 4,
    "device_type": "all",
    "model_3d_type": "procedural_wormhole",
    "model_3d_url": "",
    "image_asset_url": "desktop/quantum_realm_images/singularity_corona.png",
    "image_asset_type": "corona_sprite",
    "scale": "1.45",
    "event_horizon_radius": "10.00",
    "accretion_disk_radius": "50.00",
    "length": "380.00",
    "height": "100.00",
    "depth": "380.00",
    "circumference": "62.83",
    "color_primary": "#f43f5e",
    "color_edge": "#660022",
    "color_core": "#ff0055",
    "color_hot": "#ffd6e6",
    "color_halo": "#ff0066",
    "ambient_light": "#330011",
    "center_light": "#ff1166",
    "rotation_speed": "1.350",
    "distortion_intensity": "2.00",
    "particle_count": 6800,
    "quick_effect_primary": "quantum_phase_glow",
    "quick_effect_secondary": "energy_shield_pulse",
    "quick_effect_color": "#f43f5e",
    "quick_effect_intensity": "1.60",
    "quick_effect_speed": "1.50",
    "description": "Sub-quantum realm boundary with multidimensional reality fractures, energetic magenta plasma bursts, and quantum phase oscillations.",
    "is_enabled": 1,
    "created_at": "2026-11-10 04:03:56",
    "updated_at": "2026-11-23 02:51:36"
},
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[QuantumRealmObjectPool] Pre-allocated graphics object pool for Stage 4:`, configWithDefaults.stage_name);
  }

  async initCockpitCracksPool() {
    return super.initCockpitCracksPool();
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new QuantumRealmObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool, StageObjectPool };