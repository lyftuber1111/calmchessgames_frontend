import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 5: Final Boss Stage Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Final Boss Dreadnought, Boss Escort Drones)
 * and weapons (Arsenal, Boss Megabeam, Swarm Missiles).
 * Holds inactive objects in pool at -1000 with visibility false,
 * movement logic, physics, and weapons actions inactive.
 * Controls wave pulls: Wave 1 (5 enemies), Wave 2 (10 enemies).
 */

export class FinalBossStageObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 5,
      stage_name: 'Final Boss Stage',
      stage_slug: 'final_boss_stage',
      environment_theme: 'Event Horizon Crimson',
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
        initial: { id: 'quantum_disruptor', name: 'Quantum Disruptor', color: '#ff00aa', pool_size: 300 },
        acquirable: [
          { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 300 },
          { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 300 },
          { id: 'red_laser', name: 'Red Laser', color: '#ff2244', pool_size: 300 }
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
          pool_size: 100
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
          pool_size: 100
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[FinalBossStageObjectPool] Pre-allocated graphics object pool for Stage 5: Final Boss Stage (100 each enemy, 300 weapons, 2 waves: 5 & 10)`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new FinalBossStageObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
