import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 2: Event Horizon Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Tachyon Cruisers, Singularity Probes)
 * and weapons (Red Laser, Blue Laser, Tachyon Lance, Tachyon Beams, Proton Torpedoes).
 */

export class EventHorizonObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 2,
      stage_name: 'Event Horizon',
      stage_slug: 'event_horizon',
      environment_theme: 'Event Horizon Amber',
      weapons: {
        initial: { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 50 },
        acquirable: [
          { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 50 },
          { id: 'red_laser', name: 'Red Laser', color: '#ff2244', pool_size: 50 }
        ]
      },
      enemies: [
        {
          id: 'tachyon_cruiser',
          name: 'Tachyon Heavy Cruiser',
          model_3d_type: 'cruiser',
          color: '#ffd166',
          scale: 1.45,
          length: 5.5,
          height: 2.5,
          depth: 5.5,
          pool_size: 15
        },
        {
          id: 'singularity_probe',
          name: 'Singularity Probe',
          model_3d_type: 'singularity_probe',
          color: '#f59e0b',
          scale: 1.1,
          length: 2.6,
          height: 2.6,
          depth: 2.6,
          pool_size: 20
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
