import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 2: Event Horizon Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Tachyon Cruisers, Singularity Probes)
 * and weapons (Red Laser, Blue Laser, Tachyon Lance, Tachyon Beams, Proton Torpedoes).
 * Holds inactive objects in pool at -1000 with visibility false,
 * movement logic, physics, and weapons actions inactive.
 * Controls wave pulls: Wave 1 (5 enemies), Wave 2 (10 enemies).
 */

export class EventHorizonObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 2,
      stage_name: 'Event Horizon',
      stage_slug: 'event_horizon',
      environment_theme: 'Event Horizon Amber',
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
          { id: 'red_laser', name: 'Red Laser', color: '#ff2244', pool_size: 300 }
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
          pool_size: 100
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
          pool_size: 100
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[EventHorizonObjectPool] Pre-allocated graphics object pool for Stage 2: Event Horizon (100 each enemy, 300 weapons, 2 waves: 5 & 10)`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new EventHorizonObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
