import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 3: Singularity Core Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class SingularityCoreObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 3,
      stage_name: 'Singularity Core',
      stage_slug: 'singularity_core',
      environment_theme: 'Singularity Void Violet',
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
                "id": "plasma_torpedo",
                "name": "Plasma Torpedo",
                "icon": "\ud83d\udca3",
                "color": "#f59e0b",
                "damage": 5,
                "bullet_speed": 450,
                "energy_drain_pct": 30.0,
                "can_overheat": 0,
                "cooldown_seconds": 0.0,
                "scale": 1.5,
                "scale_x": 1.3,
                "scale_y": 1.3,
                "scale_z": 1.8,
                "size_x": 1.2,
                "size_y": 1.2,
                "size_z": 2.2,
                "dimensions": {
                        "x": 1.2,
                        "y": 1.2,
                        "z": 2.2
                },
                "description": "Heavy magnetic payload causing massive kinetic shockwave without overheating."
        },
        "acquirable": []
},
      enemies: [
        {
                "id": "void_singularity_probe",
                "enemy_id": "void_singularity_probe",
                "name": "Singularity Void Probe",
                "enemy_class": "Gravitational Probe",
                "icon": "\ud83d\udef8",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
                "color": "#c084fc",
                "scale": 0.95,
                "length": 3.2,
                "height": 3.2,
                "depth": 3.2,
                "circumference": 9.8,
                "hits": 8,
                "armor": 40,
                "shield": 2,
                "speed": 230,
                "attack_damage": 20,
                "weapon_name": "Graviton Beam",
                "weapon_damage": 20,
                "weapon_speed": 520,
                "weapon_color": "#c084fc",
                "weapon_scale": 1.3,
                "weapon_scale_x": 1.2,
                "weapon_scale_y": 1.2,
                "weapon_scale_z": 1.6,
                "weapon_size_x": 1.1,
                "weapon_size_y": 1.1,
                "weapon_size_z": 2.4,
                "weapon_dimensions": {
                        "x": 1.1,
                        "y": 1.1,
                        "z": 2.4
                },
                "fire_rate": 2.0,
                "fire_rate_seconds": 2.0,
                "fire_rate_ms": 2000,
                "fire_rate_times_per_sec": 0.5,
                "weapons": [
                        {
                                "id": "ew_graviton_beam",
                                "name": "Graviton Beam",
                                "type": "beam",
                                "mount": "center",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 0.0,
                                "fire_point_y": -0.15,
                                "fire_point_z": 1.6,
                                "scale": 1.3,
                                "scale_x": 1.2,
                                "scale_y": 1.2,
                                "scale_z": 1.6,
                                "size_x": 1.1,
                                "size_y": 1.1,
                                "size_z": 2.4,
                                "dimensions": {
                                        "x": 1.1,
                                        "y": 1.1,
                                        "z": 2.4
                                },
                                "fire_rate_times_per_sec": 0.5,
                                "fire_interval_ms": 2000,
                                "fire_rate_seconds": 2.0,
                                "damage": 20,
                                "speed": 520,
                                "color": "#c084fc",
                                "is_enabled": 1
                        }
                ],
                "score": 500,
                "threat": "High",
                "piercing": "any",
                "pool_size": 40
        }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[SingularityCoreObjectPool] Pre-allocated graphics object pool for Stage 3: Singularity Core`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new SingularityCoreObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
