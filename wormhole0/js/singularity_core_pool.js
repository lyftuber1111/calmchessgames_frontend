import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 3: Singularity Core Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Void Guardians, Singularity Drones)
 * and weapons (Tachyon Lance, Heavy Plasma, Singularity Waves, Heavy Beams).
 * Holds inactive objects in pool at -1000 with visibility false,
 * movement logic, physics, and weapons actions inactive.
 * Controls wave pulls: Wave 1 (5 enemies), Wave 2 (10 enemies).
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
        initial: { id: 'tachyon_lance',
          enemy_id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 300 },
        acquirable: [
          { id: 'heavy_plasma',
          enemy_id: 'heavy_plasma', name: 'Heavy Plasma', color: '#a855f7', pool_size: 300 },
          { id: 'blue_laser',
          enemy_id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 300 }
        ]
      },
      enemies: [
        {
          id: 'void_guardian',
          enemy_id: 'void_guardian',
          name: 'Singularity Void Guardian',
          model_3d_type: 'dreadnought',
          color: '#a855f7',
          scale: 1.6,
          length: 6.2,
          height: 3.2,
          depth: 6.0,
          pool_size: 100
        },
        {
          id: 'quantum_singularity_drone',
          enemy_id: 'quantum_singularity_drone',
          name: 'Quantum Singularity Drone',
          model_3d_type: 'drone',
          color: '#c084fc',
          scale: 1.2,
          length: 3.2,
          height: 2.0,
          depth: 3.2,
          pool_size: 100
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[SingularityCoreObjectPool] Pre-allocated graphics object pool for Stage 3: Singularity Core (100 each enemy, 300 weapons, 2 waves: 5 & 10)`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new SingularityCoreObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
