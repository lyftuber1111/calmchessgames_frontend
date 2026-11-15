import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 6: Nebula Outpost Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Nebula Raiders, Corsair Frigates)
 * and weapons (Arsenal, Plasma Cannons, EMP Bursts).
 */

export class NebulaOutpostObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 6,
      stage_name: 'Nebula Outpost',
      stage_slug: 'nebula_outpost',
      environment_theme: 'Nebula Plasma Green',
      weapons: {
        initial: { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 50 },
        acquirable: [
          { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 50 },
          { id: 'quantum_disruptor', name: 'Quantum Disruptor', color: '#ff00aa', pool_size: 50 }
        ]
      },
      enemies: [
        {
          id: 'nebula_raider',
          name: 'Nebula Corsair Raider',
          model_3d_type: 'cruiser',
          color: '#10b981',
          scale: 1.3,
          length: 4.8,
          height: 2.2,
          depth: 4.8,
          pool_size: 15
        },
        {
          id: 'corsair_frigate',
          name: 'Nebula Patrol Frigate',
          model_3d_type: 'drone',
          color: '#34d399',
          scale: 1.15,
          length: 3.5,
          height: 1.8,
          depth: 3.5,
          pool_size: 20
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
