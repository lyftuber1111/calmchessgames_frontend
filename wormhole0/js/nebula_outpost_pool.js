import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 6: Nebula Outpost Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class NebulaOutpostObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 6,
      stage_name: 'Nebula Outpost',
      stage_slug: 'nebula_outpost',
      environment_theme: 'Ion Nebula Emerald',
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
                "id": "nebula_ion_blaster",
                "name": "Nebula Ion Blaster",
                "icon": "\u26a1",
                "color": "#00ff88",
                "damage": 4,
                "bullet_speed": 800,
                "energy_drain_pct": 12.0,
                "can_overheat": 1,
                "cooldown_seconds": 4.5,
                "scale": 1.2,
                "scale_x": 1.1,
                "scale_y": 1.1,
                "scale_z": 1.4,
                "size_x": 1.2,
                "size_y": 1.2,
                "size_z": 1.8,
                "dimensions": {
                        "x": 1.2,
                        "y": 1.2,
                        "z": 1.8
                },
                "description": "High-velocity ion stream stabilized for heavy nebula interference."
        },
        "acquirable": []
},
      enemies: [
        {
                "id": "nebula_sentry_drone",
                "enemy_id": "nebula_sentry_drone",
                "name": "Nebula Defense Sentry",
                "enemy_class": "Defense Sentry",
                "icon": "\ud83d\udef8",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
                "color": "#10b981",
                "scale": 0.85,
                "length": 3.0,
                "height": 3.0,
                "depth": 3.0,
                "circumference": 9.0,
                "hits": 5,
                "armor": 25,
                "shield": 2,
                "speed": 200,
                "attack_damage": 12,
                "weapon_name": "Ion Emerald Burst",
                "weapon_damage": 12,
                "weapon_speed": 500,
                "weapon_color": "#10b981",
                "weapon_scale": 1.1,
                "weapon_scale_x": 1.0,
                "weapon_scale_y": 1.0,
                "weapon_scale_z": 1.3,
                "weapon_size_x": 0.8,
                "weapon_size_y": 0.8,
                "weapon_size_z": 1.6,
                "weapon_dimensions": {
                        "x": 0.8,
                        "y": 0.8,
                        "z": 1.6
                },
                "fire_rate": 2.2,
                "fire_rate_seconds": 2.2,
                "fire_rate_ms": 2200,
                "fire_rate_times_per_sec": 0.455,
                "weapons": [
                        {
                                "id": "ew_nebula_burst",
                                "name": "Ion Emerald Burst",
                                "type": "beam",
                                "mount": "dual_wingtip",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 0.0,
                                "fire_point_y": -0.15,
                                "fire_point_z": 1.5,
                                "scale": 1.1,
                                "scale_x": 1.0,
                                "scale_y": 1.0,
                                "scale_z": 1.3,
                                "size_x": 0.8,
                                "size_y": 0.8,
                                "size_z": 1.6,
                                "dimensions": {
                                        "x": 0.8,
                                        "y": 0.8,
                                        "z": 1.6
                                },
                                "fire_rate_times_per_sec": 0.455,
                                "fire_interval_ms": 2200,
                                "fire_rate_seconds": 2.2,
                                "damage": 12,
                                "speed": 500,
                                "color": "#10b981",
                                "is_enabled": 1
                        }
                ],
                "score": 400,
                "threat": "Medium",
                "piercing": "any",
                "pool_size": 40
        }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[NebulaOutpostObjectPool] Pre-allocated graphics object pool for Stage 6: Nebula Outpost`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new NebulaOutpostObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
