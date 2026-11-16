import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 2: Event Horizon Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class EventHorizonObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 2,
      stage_name: 'Event Horizon',
      stage_slug: 'event_horizon',
      environment_theme: 'Event Horizon Amber',
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
        "id": "tachyon_lance",
        "name": "Tachyon Lance",
        "icon": "⚡",
        "color": "#a855f7",
        "damage": 3,
        "bullet_speed": 850,
        "energy_drain_pct": 25,
        "can_overheat": 1,
        "cooldown_seconds": 7,
        "acquire_event": "warp_horizon_jump",
        "description": "Superluminal phase particle array unlocked after horizon traversal."
    },
    "acquirable": []
},
      enemies: [
    {
        "id": "tachyon_cruiser",
        "enemy_id": "tachyon_cruiser",
        "name": "Horizon Tachyon Cruiser (Universal)",
        "enemy_class": "Heavy Cruiser",
        "icon": "🛰️",
        "model_3d_type": "cruiser",
        "model_3d_url": "",
        "scale": 1.25,
        "length": 3.5,
        "height": 2.5,
        "depth": 5.5,
        "circumference": 10.5,
        "color": "#ffd166",
        "hits": 8,
        "armor": 50,
        "shield": 4,
        "speed": 200,
        "attack_damage": 20,
        "weapon_name": "Tachyon Beam",
        "weapon_damage": 20,
        "weapon_speed": 600,
        "weapon_color": "#ffd166",
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
                "size_x": 1,
                "size_y": 1,
                "size_z": 1,
                "fire_rate_times_per_sec": 0.333,
                "fire_interval_ms": 3000,
                "fire_rate_seconds": 3,
                "damage": 20,
                "speed": 600,
                "color": "#ffd166",
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
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[EventHorizonObjectPool] Pre-allocated graphics object pool for Stage 2: Event Horizon`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new EventHorizonObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };