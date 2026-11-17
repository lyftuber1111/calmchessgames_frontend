import * as THREE from 'three';
import {
  MeshPool,
  StageObjectPool,
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  fitCockpitCracksToCamera,
  loadCockpitCracksGlbAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay
} from './object_pool.js';

export const STAGE_COCKPIT_CRACKS_GLB_URL = 'scene_images/cockpit_cracks.glb';

export {
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  fitCockpitCracksToCamera,
  loadCockpitCracksGlbAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay
};

/**
 * Wormhole XR - Stage 1: Warp Origin Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class WarpOriginObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 1,
      stage_name: 'Warp Origin',
      stage_slug: 'warp_origin',
      environment_theme: 'Warp Cyan Corridor',
      cockpit_overlay: {
        model_3d_url: 'scene_images/cockpit_cracks.glb',
        model_url: 'scene_images/cockpit_cracks.glb',
        asset_type: '3d_model'
      },
      cockpit_overlay_asset: 'scene_images/cockpit_cracks.glb',
      initial_weapon_pool_size: 300,
      initial_enemy_pool_size: 100,
      waves: [
        {
          wave_number: 1,
          enemy_count: 5,
          interval_seconds: 0,
          delay_ms: 0,
          description: 'Wave 1: Recon Vanguard (5 Enemies)'
        },
        {
          wave_number: 2,
          enemy_count: 10,
          interval_seconds: 15,
          delay_ms: 15000,
          description: 'Wave 2: Full Assault Swarm (10 Enemies)'
        }
      ],
      total_waves: 2,
      wave_interval_seconds: 15,
      weapons: {
    "initial": {
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
        "special_fx": "cockpit_cracks_red_edges",
        "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
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
            "special_fx": "cockpit_cracks_red_edges",
            "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
            "special_fx_type": "overlay"
        }
    ]
},
      enemies: [
    {
        "id": "phase_interceptor",
        "enemy_id": "phase_interceptor",
        "name": "Phase Interceptor (Universal)",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 0.5,
        "length": 4.2,
        "height": 1.3,
        "depth": 3.4,
        "circumference": 5,
        "color": "#38bdf8",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Dual Ion Cannon",
        "weapon_damage": 1,
        "weapon_speed": 550,
        "weapon_color": "#38bdf8",
        "weapon_scale": 0.5,
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
        "fire_rate": 3,
        "fire_rate_seconds": 3,
        "fire_rate_ms": 3000,
        "fire_rate_times_per_sec": 0.333,
        "weapons": [
            {
                "id": "ew_phase_interceptor_0",
                "name": "Dual Ion Cannon",
                "type": "beam",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
                "scale": 0.5,
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
                "color": "#38bdf8",
                "special_fx": "cockpit_cracks_red_edges",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 250,
        "threat": "Medium",
        "piercing": "red_laser",
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
        "id": "void_recon_drone_mobile",
        "enemy_id": "void_recon_drone_mobile",
        "name": "Void Recon Drone (Mobile)",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 0.75,
        "length": 2.8,
        "height": 2.8,
        "depth": 2.8,
        "circumference": 8.8,
        "color": "#00f0ff",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 1,
        "weapon_speed": 450,
        "weapon_color": "#00f0ff",
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
        "weapon_special_fx_file": "mobile/warp_origin_images/cockpit_cracks_overlay.png",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 2,
        "fire_rate_seconds": 2,
        "fire_rate_ms": 2000,
        "fire_rate_times_per_sec": 0.5,
        "weapons": [
            {
                "id": "ew_0_fzo0",
                "name": "Plasma Pulse",
                "type": "custom_model",
                "mount": "center",
                "model_url": "mobile/warp_origin_images/cyan_laser_rod.glb",
                "model_type": "custom_glb",
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
                "damage": 1,
                "speed": 450,
                "color": "#00f0ff",
                "special_fx": "none",
                "special_fx_file": "mobile/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 100,
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
        "id": "phase_interceptor_all",
        "enemy_id": "phase_interceptor_all",
        "name": "Phase Interceptor (Universal)",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 0.75,
        "length": 4.2,
        "height": 1.3,
        "depth": 3.4,
        "circumference": 5,
        "color": "#38bdf8",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Dual Ion Cannon",
        "weapon_damage": 1,
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
        "weapon_special_fx": "none",
        "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 3,
        "fire_rate_seconds": 3,
        "fire_rate_ms": 3003,
        "fire_rate_times_per_sec": 0.333,
        "weapons": [
            {
                "id": "ew_0_jerr",
                "name": "Dual Ion Cannon",
                "type": "custom_model",
                "mount": "center",
                "model_url": "mobile/warp_origin_images/cyan_laser_rod.glb",
                "model_type": "custom_glb",
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
                "fire_interval_ms": 3003,
                "fire_rate_seconds": 3.003,
                "damage": 1,
                "speed": 550,
                "color": "#38bdf8",
                "special_fx": "none",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 250,
        "threat": "Medium",
        "piercing": "red_laser",
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
        "id": "void_recon_drone",
        "enemy_id": "void_recon_drone",
        "name": "Void Recon Drone (Desktop)",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 1,
        "length": 3,
        "height": 1.5,
        "depth": 3,
        "circumference": 6,
        "color": "#ef476f",
        "hits": 2,
        "armor": 10,
        "shield": 0,
        "speed": 250,
        "attack_damage": 5,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 5,
        "weapon_speed": 450,
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
        "weapon_special_fx": "cockpit_cracks_red_edges",
        "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 3,
        "fire_rate_seconds": 3,
        "fire_rate_ms": 3000,
        "fire_rate_times_per_sec": 0.333,
        "weapons": [
            {
                "id": "ew_void_recon_drone_0",
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
                "fire_rate_times_per_sec": 0.333,
                "fire_interval_ms": 3000,
                "fire_rate_seconds": 3,
                "damage": 5,
                "speed": 450,
                "color": "#ff2255",
                "special_fx": "cockpit_cracks_red_edges",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 100,
        "threat": "Low",
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
        "destruction_particle_color": "#ef476f",
        "destruction_particle_scale": 1
    }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[WarpOriginObjectPool] Pre-allocated graphics object pool for Stage 1: Warp Origin`);
  }

  async initCockpitCracksPool() {
    try {
      const glbUrl = (this.stageConfig && this.stageConfig.cockpit_overlay && (this.stageConfig.cockpit_overlay.model_3d_url || this.stageConfig.cockpit_overlay.model_url))
        || (this.stageConfig && this.stageConfig.cockpit_overlay_asset)
        || 'scene_images/cockpit_cracks.glb'
        || COCKPIT_CRACKS_GLB_URL;

      const loadedMesh = await loadCockpitCracksGlbAsset(glbUrl);
      if (loadedMesh) {
        this.cockpitCracksMesh = loadedMesh;
        this.cockpitCracksOverlayPool = new MeshPool(
          this.scene,
          null,
          null,
          1,
          () => loadedMesh.clone(true)
        );
        console.log(`[WarpOriginObjectPool] Pre-allocated Cockpit Cracks 3D GLB/GLTF overlay pool from: ${glbUrl}`);
      }
    } catch (err) {
      console.warn('[WarpOriginObjectPool] Cockpit cracks pooling warning:', err);
    }
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new WarpOriginObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };