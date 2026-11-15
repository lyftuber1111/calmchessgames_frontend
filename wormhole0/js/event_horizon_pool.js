import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 2: Event Horizon Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
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
        initial: {
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
        acquirable: [
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
          id: 'tachyon_cruiser',
          enemy_id: 'tachyon_cruiser',
          name: 'Tachyon Heavy Cruiser',
          enemy_class: 'Heavy Cruiser',
          icon: '🛸',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#ffd166',
          scale: 1.25,
          length: 5.50,
          height: 2.50,
          depth: 5.50,
          circumference: 10.50,
          hits: 8,
          armor: 45,
          shield: 3,
          speed: 180,
          attack_damage: 20,
          weapon_name: 'Tachyon Beam',
          weapon_damage: 20,
          weapon_speed: 600,
          weapon_color: '#ffd166',
          fire_rate_seconds: 3.0,
          fire_rate_ms: 3000,
          fire_rate_times_per_sec: 0.333,
          weapons: [
            {
              id: 'ew_tachyon_beam',
              name: 'Tachyon Beam',
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
              damage: 20,
              speed: 600,
              color: '#ffd166',
              is_enabled: 1
            }
          ],
          score: 500,
          threat: 'High',
          piercing: 'tachyon_lance',
          pool_size: 100
        },
        {
          id: 'singularity_probe',
          enemy_id: 'singularity_probe',
          name: 'Singularity Probe',
          enemy_class: 'Scout Drone',
          icon: '🛸',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#f59e0b',
          scale: 1.10,
          length: 2.80,
          height: 2.80,
          depth: 2.80,
          circumference: 8.80,
          hits: 3,
          armor: 15,
          shield: 0,
          speed: 240,
          attack_damage: 10,
          weapon_name: 'Amber Plasma Pulse',
          weapon_damage: 10,
          weapon_speed: 480,
          weapon_color: '#f59e0b',
          fire_rate_seconds: 2.2,
          fire_rate_ms: 2200,
          fire_rate_times_per_sec: 0.455,
          weapons: [
            {
              id: 'ew_amber_pulse',
              name: 'Amber Plasma Pulse',
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
              fire_rate_times_per_sec: 0.455,
              fire_interval_ms: 2200,
              fire_rate_seconds: 2.2,
              damage: 10,
              speed: 480,
              color: '#f59e0b',
              is_enabled: 1
            }
          ],
          score: 250,
          threat: 'Medium',
          piercing: 'any',
          pool_size: 50
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[EventHorizonObjectPool] Pre-allocated graphics object pool for Stage 2: Event Horizon`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new EventHorizonObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
