import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 4: Quantum Realm Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies (Quantum Dreadnoughts, Quantum Wraiths, Anomaly Strikers)
 * and weapons (Quantum Disruptors, Tachyon Lances, Quantum Bolts, Flux Cannons).
 */

export class QuantumRealmObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 4,
      stage_name: 'Quantum Realm',
      stage_slug: 'quantum_realm',
      environment_theme: 'Quantum Phasor Magenta',
      weapons: {
        initial: { id: 'quantum_disruptor', name: 'Quantum Disruptor', color: '#ff00aa', pool_size: 50 },
        acquirable: [
          { id: 'tachyon_lance', name: 'Tachyon Lance', color: '#ffd166', pool_size: 50 },
          { id: 'blue_laser', name: 'Blue Laser', color: '#00d4ff', pool_size: 50 }
        ]
      },
      enemies: [
        {
          id: 'quantum_dreadnought',
          name: 'Quantum Omega Dreadnought',
          model_3d_type: 'dreadnought',
          color: '#ec4899',
          scale: 1.7,
          length: 7.0,
          height: 3.5,
          depth: 7.0,
          pool_size: 10
        },
        {
          id: 'quantum_wraith',
          name: 'Quantum Wraith Interceptor',
          model_3d_type: 'cruiser',
          color: '#f43f5e',
          scale: 1.25,
          length: 4.0,
          height: 1.8,
          depth: 4.0,
          pool_size: 20
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[QuantumRealmObjectPool] Pre-allocated graphics object pool for Stage 4: Quantum Realm`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new QuantumRealmObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
