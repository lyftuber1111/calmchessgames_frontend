import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 4: Quantum Realm Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class QuantumRealmObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 4,
      stage_name: 'Quantum Realm',
      stage_slug: 'quantum_realm',
      environment_theme: 'Quantum Phasor Magenta',
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
        initial: {
          id: 'quantum_phaser',
          name: 'Quantum Phaser',
          icon: '✨',
          color: '#10b981',
          damage: 4,
          bullet_speed: 950,
          energy_drain_pct: 15.0,
          can_overheat: 1,
          cooldown_seconds: 6.0,
          pool_size: 300
        },
        acquirable: [
          {
            id: 'tachyon_lance',
            name: 'Tachyon Lance',
            icon: '⚡',
            color: '#ffd166',
            damage: 3,
            bullet_speed: 850,
            energy_drain_pct: 25.0,
            can_overheat: 1,
            cooldown_seconds: 7.0,
            pool_size: 300
          }
        ]
      },
      enemies: [
        {
          id: 'quantum_dreadnought',
          enemy_id: 'quantum_dreadnought',
          name: 'Quantum Omega Dreadnought',
          enemy_class: 'Boss Dreadnought',
          icon: '💀',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#ef476f',
          scale: 1.60,
          length: 7.00,
          height: 3.20,
          depth: 6.00,
          circumference: 15.00,
          hits: 35,
          armor: 90,
          shield: 15,
          speed: 90,
          attack_damage: 60,
          weapon_name: 'Quantum Annihilator',
          weapon_damage: 60,
          weapon_speed: 650,
          weapon_color: '#ef476f',
          fire_rate_seconds: 1.2,
          fire_rate_ms: 1200,
          fire_rate_times_per_sec: 0.833,
          weapons: [
            {
              id: 'ew_quantum_annihilator',
              name: 'Quantum Annihilator',
              type: 'beam',
              mount: 'dual_wingtip',
              model_url: '',
              model_type: '',
              fire_point_x: 0,
              fire_point_y: -0.15,
              fire_point_z: 1.5,
              scale: 1.0,
              size_x: 1.0,
              size_y: 1.0,
              size_z: 1.0,
              fire_rate_times_per_sec: 0.833,
              fire_interval_ms: 1200,
              fire_rate_seconds: 1.2,
              damage: 60,
              speed: 650,
              color: '#ef476f',
              is_enabled: 1
            }
          ],
          score: 5000,
          threat: 'Extreme',
          piercing: 'quantum_phaser',
          pool_size: 100
        },
        {
          id: 'quantum_infiltrator',
          enemy_id: 'quantum_infiltrator',
          name: 'Quantum Infiltrator Drone',
          enemy_class: 'Fast Interceptor',
          icon: '🚀',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#f43f5e',
          scale: 1.05,
          length: 3.50,
          height: 1.40,
          depth: 3.20,
          circumference: 7.50,
          hits: 4,
          armor: 25,
          shield: 4,
          speed: 240,
          attack_damage: 15,
          weapon_name: 'Phase Pulse',
          weapon_damage: 15,
          weapon_speed: 520,
          weapon_color: '#f43f5e',
          fire_rate_seconds: 1.6,
          fire_rate_ms: 1600,
          fire_rate_times_per_sec: 0.625,
          weapons: [
            {
              id: 'ew_phase_pulse',
              name: 'Phase Pulse',
              type: 'beam',
              mount: 'center',
              model_url: '',
              model_type: '',
              fire_point_x: 0,
              fire_point_y: -0.15,
              fire_point_z: 1.5,
              scale: 1.0,
              size_x: 0.6,
              size_y: 0.6,
              size_z: 1.0,
              fire_rate_times_per_sec: 0.625,
              fire_interval_ms: 1600,
              fire_rate_seconds: 1.6,
              damage: 15,
              speed: 520,
              color: '#f43f5e',
              is_enabled: 1
            }
          ],
          score: 400,
          threat: 'Medium',
          piercing: 'any',
          pool_size: 50
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
