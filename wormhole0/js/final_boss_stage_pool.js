import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 5: Final Boss Stage Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Final Boss Dreadnought, Boss Escort Drones)
 * and weapons (Arsenal, Boss Megabeam, Swarm Missiles).
 */

export class FinalBossStageObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 5,
      stage_name: 'Final Boss Stage',
      stage_slug: 'final_boss_stage',
      environment_theme: 'Event Horizon Crimson',
      weapons: {
        initial: { id: 'quantum_disruptor', name: 'Quantum Disruptor', color: '#ff00aa', pool_size: 50 },
        acquirable: [
          { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 50 },
          { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 50 },
          { id: 'red_laser', name: 'Red Laser', color: '#ff2244', pool_size: 50 }
        ]
      },
      enemies: [
        {
          id: 'final_boss',
          name: 'Singularity Overlord Titan',
          model_3d_type: 'boss',
          color: '#ef4444',
          scale: 2.2,
          length: 9.0,
          height: 4.8,
          depth: 9.0,
          pool_size: 5
        },
        {
          id: 'escort_fighter',
          name: 'Overlord Heavy Escort',
          model_3d_type: 'cruiser',
          color: '#f87171',
          scale: 1.35,
          length: 4.5,
          height: 2.0,
          depth: 4.5,
          pool_size: 20
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[FinalBossStageObjectPool] Pre-allocated graphics object pool for Stage 5: Final Boss Stage`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new FinalBossStageObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
