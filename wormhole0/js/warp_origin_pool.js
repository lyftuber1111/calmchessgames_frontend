import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 1: Warp Origin Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Phase Interceptors, Void Recon Drones)
 * and weapons (Red Laser, Blue Laser, Dual Ion Cannons, Plasma Pulses).
 * Holds inactive objects in pool at -1000 with visibility false,
 * movement logic, physics, and weapons actions inactive.
 * Controls wave pulls: Wave 1 (5 enemies), Wave 2 (10 enemies).
 */

export class WarpOriginObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 1,
      stage_name: 'Warp Origin',
      stage_slug: 'warp_origin',
      environment_theme: 'Warp Cyan Corridor',
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
        initial: { id: 'red_laser',
          enemy_id: 'red_laser', name: 'Red Laser', color: '#ff2244', pool_size: 300 },
        acquirable: [
          { id: 'blue_laser',
          enemy_id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 300 }
        ]
      },
      enemies: [
        {
          id: 'phase_interceptor',
          enemy_id: 'phase_interceptor',
          name: 'Phase Interceptor',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#38bdf8',
          scale: 1.15,
          length: 4.2,
          height: 1.3,
          depth: 3.4,
          pool_size: 100
        },
        {
          id: 'void_recon_drone',
          enemy_id: 'void_recon_drone',
          name: 'Void Recon Drone',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#ef476f',
          scale: 1.25,
          length: 3.0,
          height: 1.5,
          depth: 3.0,
          pool_size: 100
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[WarpOriginObjectPool] Pre-allocated graphics object pool for Stage 1: Warp Origin (100 each enemy, 300 weapons, 2 waves: 5 & 10)`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new WarpOriginObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
