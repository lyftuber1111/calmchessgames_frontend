import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage 6: Nebula Outpost Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class NebulaOutpostObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 6,
      stage_name: 'Nebula Outpost',
      stage_slug: 'nebula_outpost',
      environment_theme: 'Nebula Emerald Green',
      initial_weapon_pool_size: 300,
      initial_enemy_pool_size: 100,
      waves: [
        {
          wave_number: 1,
          enemy_count: 5,
          interval_seconds: 0,
          delay_ms: 0,
          description: 'Wave 1: Outpost Recon Vanguard (5 Enemies)'
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
          color: '#10b981',
          damage: 5,
          bullet_speed: 600,
          energy_drain_pct: 20.0,
          can_overheat: 0,
          cooldown_seconds: 0.0,
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
          id: 'nebula_scout',
          enemy_id: 'nebula_scout',
          name: 'Nebula Recon Scout',
          enemy_class: 'Scout Drone',
          icon: '🛸',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/recon_drone_2.8m.glb',
          color: '#10b981',
          scale: 1.00,
          length: 2.80,
          height: 2.80,
          depth: 2.80,
          circumference: 8.80,
          hits: 3,
          armor: 15,
          shield: 2,
          speed: 230,
          attack_damage: 8,
          weapon_name: 'Emerald Plasma Pulse',
          weapon_damage: 8,
          weapon_speed: 460,
          weapon_color: '#10b981',
          fire_rate_seconds: 2.0,
          fire_rate_ms: 2000,
          fire_rate_times_per_sec: 0.5,
          weapons: [
            {
              id: 'ew_emerald_pulse',
              name: 'Emerald Plasma Pulse',
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
              damage: 8,
              speed: 460,
              color: '#10b981',
              is_enabled: 1
            }
          ],
          score: 200,
          threat: 'Low',
          piercing: 'any',
          pool_size: 30
        },
        {
          id: 'nebula_interceptor',
          enemy_id: 'nebula_interceptor',
          name: 'Nebula Heavy Interceptor',
          enemy_class: 'Fast Interceptor',
          icon: '🚀',
          model_3d_type: 'custom_glb',
          model_3d_url: 'desktop/warp_origin_images/drone_phase_interceptor_3.glb',
          color: '#34d399',
          scale: 1.15,
          length: 4.20,
          height: 1.30,
          depth: 3.40,
          circumference: 5.00,
          hits: 6,
          armor: 30,
          shield: 4,
          speed: 250,
          attack_damage: 15,
          weapon_name: 'Emerald Ion Cannon',
          weapon_damage: 15,
          weapon_speed: 550,
          weapon_color: '#34d399',
          fire_rate_seconds: 2.4,
          fire_rate_ms: 2400,
          fire_rate_times_per_sec: 0.417,
          weapons: [
            {
              id: 'ew_emerald_ion',
              name: 'Emerald Ion Cannon',
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
              fire_rate_times_per_sec: 0.417,
              fire_interval_ms: 2400,
              fire_rate_seconds: 2.4,
              damage: 15,
              speed: 550,
              color: '#34d399',
              is_enabled: 1
            }
          ],
          score: 450,
          threat: 'Medium',
          piercing: 'any',
          pool_size: 40
        }
      ],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[NebulaOutpostObjectPool] Pre-allocated graphics object pool for Stage 6: Nebula Outpost`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new NebulaOutpostObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
