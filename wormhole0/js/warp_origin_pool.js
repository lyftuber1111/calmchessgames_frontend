import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 1: Warp Origin Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class WarpOriginObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 1,
      stage_name: 'Warp Origin',
      stage_slug: 'warp_origin',
      environment_theme: 'Warp Cyan Corridor',
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
        },
        acquirable: [
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
          }
        ]
      },
      enemies: [
        {
          id: 'phase_interceptor',
          enemy_id: 'phase_interceptor',
          name: 'Phase Interceptor',
          enemy_class: 'Fast Interceptor',
          icon: '🚀',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#38bdf8',
          scale: 0.50,
          length: 4.20,
          height: 1.30,
          depth: 3.40,
          circumference: 5.00,
          hits: 1,
          armor: 1,
          shield: 0,
          speed: 220,
          attack_damage: 1,
          weapon_name: 'Dual Ion Cannon',
          weapon_damage: 1,
          weapon_speed: 550,
          weapon_color: '#38bdf8',
          fire_rate_seconds: 3.0,
          fire_rate_ms: 3000,
          fire_rate_times_per_sec: 0.333,
          weapons: [
            {
              id: 'ew_phase_ion',
              name: 'Dual Ion Cannon',
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
              fire_rate_times_per_sec: 0.333,
              fire_interval_ms: 3000,
              fire_rate_seconds: 3.0,
              damage: 1,
              speed: 550,
              color: '#38bdf8',
              is_enabled: 1
            }
          ],
          score: 250,
          threat: 'Medium',
          piercing: 'red_laser',
          pool_size: 30
        },
        {
          id: 'void_recon_drone',
          enemy_id: 'void_recon_drone',
          name: 'Void Recon Drone',
          enemy_class: 'Scout Drone',
          icon: '🛸',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#00f0ff',
          scale: 0.75,
          length: 2.80,
          height: 2.80,
          depth: 2.80,
          circumference: 8.80,
          hits: 1,
          armor: 1,
          shield: 0,
          speed: 220,
          attack_damage: 1,
          weapon_name: 'Plasma Pulse',
          weapon_damage: 1,
          weapon_speed: 450,
          weapon_color: '#00f0ff',
          fire_rate_seconds: 2.0,
          fire_rate_ms: 2000,
          fire_rate_times_per_sec: 0.5,
          weapons: [
            {
              id: 'ew_recon_pulse',
              name: 'Plasma Pulse',
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
              fire_rate_times_per_sec: 0.5,
              fire_interval_ms: 2000,
              fire_rate_seconds: 2.0,
              damage: 1,
              speed: 450,
              color: '#00f0ff',
              is_enabled: 1
            }
          ],
          score: 100,
          threat: 'Low',
          piercing: 'any',
          pool_size: 30
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[WarpOriginObjectPool] Pre-allocated graphics object pool for Stage 1: Warp Origin`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new WarpOriginObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
