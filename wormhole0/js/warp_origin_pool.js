import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 1: Warp Origin Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Phase Interceptors, Void Recon Drones)
 * and weapons (Red Laser, Blue Laser, Dual Ion Cannons, Plasma Pulses).
 */

export class WarpOriginObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 1,
      stage_name: 'Warp Origin',
      stage_slug: 'warp_origin',
      environment_theme: 'Warp Cyan Corridor',
      weapons: {
        initial: { id: 'red_laser', name: 'Red Laser', color: '#ff2244', pool_size: 200 },
        acquirable: [
          { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 200 }
        ]
      },
      enemies: [
        {
          id: 'phase_interceptor',
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
          name: 'Void Recon Drone',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#ef476f',
          scale: 1.25,
          length: 3.0,
          height: 1.5,
          depth: 3.0,
          pool_size: 200
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[WarpOriginObjectPool] Pre-allocated graphics object pool for Stage 1: Warp Origin`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new WarpOriginObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
