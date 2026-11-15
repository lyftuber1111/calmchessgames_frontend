import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 3: Singularity Core Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
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
        initial: {
          id: 'plasma_torpedo',
          name: 'Plasma Torpedo',
          icon: '💣',
          color: '#f59e0b',
          damage: 5,
          bullet_speed: 450,
          energy_drain_pct: 40.0,
          can_overheat: 0,
          cooldown_seconds: 0.0,
          pool_size: 300
        },
        acquirable: [
          {
            id: 'tachyon_lance',
            name: 'Tachyon Lance',
            icon: '⚡',
            color: '#a855f7',
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
          id: 'void_guardian',
          enemy_id: 'void_guardian',
          name: 'Singularity Void Guardian',
          enemy_class: 'Guardian Frigate',
          icon: '👾',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#a855f7',
          scale: 1.20,
          length: 3.80,
          height: 3.80,
          depth: 3.80,
          circumference: 11.94,
          hits: 15,
          armor: 70,
          shield: 6,
          speed: 150,
          attack_damage: 35,
          weapon_name: 'Void Disruptor',
          weapon_damage: 35,
          weapon_speed: 400,
          weapon_color: '#a855f7',
          fire_rate_seconds: 2.2,
          fire_rate_ms: 2200,
          fire_rate_times_per_sec: 0.455,
          weapons: [
            {
              id: 'ew_void_disruptor',
              name: 'Void Disruptor',
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
              fire_rate_times_per_sec: 0.455,
              fire_interval_ms: 2200,
              fire_rate_seconds: 2.2,
              damage: 35,
              speed: 400,
              color: '#a855f7',
              is_enabled: 1
            }
          ],
          score: 1000,
          threat: 'High',
          piercing: 'plasma_torpedo',
          pool_size: 100
        },
        {
          id: 'core_swarmer',
          enemy_id: 'core_swarmer',
          name: 'Core Swarm Drone',
          enemy_class: 'Scout Drone',
          icon: '🛸',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#c084fc',
          scale: 0.90,
          length: 2.80,
          height: 2.80,
          depth: 2.80,
          circumference: 8.80,
          hits: 3,
          armor: 20,
          shield: 2,
          speed: 260,
          attack_damage: 12,
          weapon_name: 'Violet Pulse',
          weapon_damage: 12,
          weapon_speed: 480,
          weapon_color: '#c084fc',
          fire_rate_seconds: 1.8,
          fire_rate_ms: 1800,
          fire_rate_times_per_sec: 0.556,
          weapons: [
            {
              id: 'ew_violet_pulse',
              name: 'Violet Pulse',
              type: 'beam',
              mount: 'center',
              model_url: '',
              model_type: '',
              fire_point_x: 0,
              fire_point_y: -0.15,
              fire_point_z: 1.5,
              scale: 1.0,
              size_x: 0.5,
              size_y: 0.5,
              size_z: 1.0,
              fire_rate_times_per_sec: 0.556,
              fire_interval_ms: 1800,
              fire_rate_seconds: 1.8,
              damage: 12,
              speed: 480,
              color: '#c084fc',
              is_enabled: 1
            }
          ],
          score: 300,
          threat: 'Medium',
          piercing: 'any',
          pool_size: 50
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
