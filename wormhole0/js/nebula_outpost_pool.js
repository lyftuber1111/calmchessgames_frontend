import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 6: Nebula Outpost Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Nebula Raiders, Corsair Frigates)
 * and weapons (Arsenal, Plasma Cannons, EMP Bursts).
 * Holds inactive objects in pool at -1000 with visibility false,
 * movement logic, physics, and weapons actions inactive.
 * Controls wave pulls: Wave 1 (5 enemies), Wave 2 (10 enemies).
 */

export class NebulaOutpostObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 6,
      stage_name: 'Nebula Outpost',
      stage_slug: 'nebula_outpost',
      environment_theme: 'Nebula Plasma Green',
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
        initial: { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 300 },
        acquirable: [
          { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 300 },
          { id: 'quantum_disruptor', name: 'Quantum Disruptor', color: '#ff00aa', pool_size: 300 }
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
          pool_size: 100
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
          pool_size: 100
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[NebulaOutpostObjectPool] Pre-allocated graphics object pool for Stage 6: Nebula Outpost (100 each enemy, 300 weapons, 2 waves: 5 & 10)`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new NebulaOutpostObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
