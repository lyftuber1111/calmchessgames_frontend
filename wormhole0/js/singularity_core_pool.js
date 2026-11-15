import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 3: Singularity Core Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Void Guardians, Singularity Drones)
 * and weapons (Tachyon Lance, Heavy Plasma, Singularity Waves, Heavy Beams).
 */

export class SingularityCoreObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 3,
      stage_name: 'Singularity Core',
      stage_slug: 'singularity_core',
      environment_theme: 'Singularity Void Violet',
      weapons: {
        initial: { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 50 },
        acquirable: [
          { id: 'heavy_plasma', name: 'Heavy Plasma', color: '#a855f7', pool_size: 50 },
          { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 50 }
        ]
      },
      enemies: [
        {
          id: 'void_guardian',
          name: 'Singularity Void Guardian',
          model_3d_type: 'dreadnought',
          color: '#a855f7',
          scale: 1.6,
          length: 6.2,
          height: 3.2,
          depth: 6.0,
          pool_size: 12
        },
        {
          id: 'quantum_singularity_drone',
          name: 'Quantum Singularity Drone',
          model_3d_type: 'drone',
          color: '#c084fc',
          scale: 1.2,
          length: 3.2,
          height: 2.0,
          depth: 3.2,
          pool_size: 20
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
