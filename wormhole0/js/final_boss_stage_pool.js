import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 5: Final Boss Stage Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class FinalBossStageObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 5,
      stage_name: 'Final Boss Stage',
      stage_slug: 'final_boss_stage',
      environment_theme: 'Singularity Overlord Crimson',
      initial_weapon_pool_size: 300,
      initial_enemy_pool_size: 100,
      waves: [
        {
          wave_number: 1,
          enemy_count: 5,
          interval_seconds: 0,
          delay_ms: 0,
          description: 'Wave 1: Overlord Recon Vanguard (5 Enemies)'
        },
        {
          wave_number: 2,
          enemy_count: 10,
          interval_seconds: 15,
          delay_ms: 15000,
          description: 'Wave 2: Full Assault Swarm & Titan Overlord (10 Enemies)'
        }
      ],
      total_waves: 2,
      wave_interval_seconds: 15,
      weapons: {
        initial: {
          id: 'quantum_disruptor',
          name: 'Quantum Disruptor',
          icon: '⚡',
          color: '#ff00aa',
          damage: 5,
          bullet_speed: 1050,
          energy_drain_pct: 18.0,
          can_overheat: 1,
          cooldown_seconds: 5.5,
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
          },
          {
            id: 'blue_laser',
            name: 'Blue Laser',
            icon: '🔵',
            color: '#00d4ff',
            damage: 3,
            bullet_speed: 700,
            energy_drain_pct: 5.0,
            can_overheat: 1,
            cooldown_seconds: 10.0,
            pool_size: 300
          },
          {
            id: 'red_laser',
            name: 'Red Laser',
            icon: '🔴',
            color: '#ff2244',
            damage: 2,
            bullet_speed: 550,
            energy_drain_pct: 1.0,
            can_overheat: 1,
            cooldown_seconds: 5.0,
            pool_size: 300
          }
        ]
      },
      enemies: [
        {
          id: 'final_boss_titan',
          enemy_id: 'final_boss_titan',
          name: 'Singularity Overlord Titan',
          enemy_class: 'Boss Dreadnought',
          icon: '💀',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#ef4444',
          scale: 2.20,
          length: 9.00,
          height: 4.80,
          depth: 9.00,
          circumference: 25.00,
          hits: 45,
          armor: 100,
          shield: 20,
          speed: 85,
          attack_damage: 75,
          weapon_name: 'Overlord Annihilator',
          weapon_damage: 75,
          weapon_speed: 650,
          weapon_color: '#ef4444',
          fire_rate_seconds: 1.2,
          fire_rate_ms: 1200,
          fire_rate_times_per_sec: 0.833,
          weapons: [
            {
              id: 'ew_boss_beam',
              name: 'Overlord Annihilator',
              type: 'beam',
              mount: 'center',
              model_url: '',
              model_type: '',
              fire_point_x: 0,
              fire_point_y: -0.2,
              fire_point_z: 2.0,
              scale: 1.5,
              size_x: 1.5,
              size_y: 1.5,
              size_z: 2.0,
              fire_rate_times_per_sec: 0.833,
              fire_interval_ms: 1200,
              fire_rate_seconds: 1.2,
              damage: 75,
              speed: 650,
              color: '#ef4444',
              is_enabled: 1
            },
            {
              id: 'ew_boss_torpedo',
              name: 'Gravitational Torpedo',
              type: 'missile',
              mount: 'dual_wingtip',
              model_url: '',
              model_type: '',
              fire_point_x: 2.5,
              fire_point_y: 0.0,
              fire_point_z: 1.0,
              scale: 1.2,
              size_x: 1.0,
              size_y: 1.0,
              size_z: 1.8,
              fire_rate_times_per_sec: 0.4,
              fire_interval_ms: 2500,
              fire_rate_seconds: 2.5,
              damage: 50,
              speed: 450,
              color: '#ff0055',
              is_enabled: 1
            }
          ],
          score: 10000,
          threat: 'Extreme',
          piercing: 'quantum_disruptor',
          pool_size: 100
        },
        {
          id: 'boss_escort_fighter',
          enemy_id: 'boss_escort_fighter',
          name: 'Overlord Heavy Escort Fighter',
          enemy_class: 'Fast Interceptor',
          icon: '🚀',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#f87171',
          scale: 1.25,
          length: 4.20,
          height: 1.50,
          depth: 3.50,
          circumference: 9.00,
          hits: 5,
          armor: 25,
          shield: 5,
          speed: 220,
          attack_damage: 15,
          weapon_name: 'Heavy Plasma Pulse',
          weapon_damage: 15,
          weapon_speed: 550,
          weapon_color: '#f87171',
          fire_rate_seconds: 2.0,
          fire_rate_ms: 2000,
          fire_rate_times_per_sec: 0.5,
          weapons: [
            {
              id: 'ew_escort_pulse',
              name: 'Heavy Plasma Pulse',
              type: 'beam',
              mount: 'center',
              model_url: '',
              model_type: '',
              fire_point_x: 0,
              fire_point_y: -0.15,
              fire_point_z: 1.5,
              scale: 1.0,
              size_x: 1.0,
              size_y: 1.0,
              size_z: 1.0,
              fire_rate_times_per_sec: 0.5,
              fire_interval_ms: 2000,
              fire_rate_seconds: 2.0,
              damage: 15,
              speed: 550,
              color: '#f87171',
              is_enabled: 1
            }
          ],
          score: 500,
          threat: 'High',
          piercing: 'any',
          pool_size: 50
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
