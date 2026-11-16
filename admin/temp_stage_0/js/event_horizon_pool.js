export {
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  fitCockpitCracksToCamera,
  loadCockpitCracksGlbAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay
} from './object_pool.js';

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
        "initial": {
                "id": "tachyon_lance",
                "name": "Tachyon Lance",
                "icon": "\u26a1",
                "color": "#a855f7",
                "damage": 3,
                "bullet_speed": 850,
                "energy_drain_pct": 20.0,
                "can_overheat": 1,
                "cooldown_seconds": 7.0,
                "scale": 1.2,
                "scale_x": 1.0,
                "scale_y": 1.0,
                "scale_z": 1.4,
                "size_x": 1.2,
                "size_y": 1.2,
                "size_z": 1.6,
                "dimensions": {
                        "x": 1.2,
                        "y": 1.2,
                        "z": 1.6
                },
                "description": "Superluminal phase particle array unlocked after horizon traversal."
        },
        "acquirable": [
                {
                        "id": "blue_laser",
                        "name": "Blue Laser",
                        "icon": "\ud83d\udd35",
                        "color": "#00d4ff",
                        "damage": 3,
                        "bullet_speed": 700,
                        "energy_drain_pct": 25.0,
                        "can_overheat": 1,
                        "cooldown_seconds": 7.0,
                        "scale": 1.0,
                        "scale_x": 1.0,
                        "scale_y": 1.0,
                        "scale_z": 1.0,
                        "size_x": 1.0,
                        "size_y": 1.0,
                        "size_z": 1.0,
                        "dimensions": {
                                "x": 1.0,
                                "y": 1.0,
                                "z": 1.0
                        }
                }
        ]
},
      enemies: [
        {
                "id": "tachyon_cruiser",
                "enemy_id": "tachyon_cruiser",
                "name": "Tachyon Heavy Cruiser",
                "enemy_class": "Heavy Cruiser",
                "icon": "\ud83d\udef8",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
                "color": "#f59e0b",
                "scale": 1.1,
                "length": 5.2,
                "height": 2.1,
                "depth": 4.6,
                "circumference": 9.5,
                "hits": 6,
                "armor": 30,
                "shield": 1,
                "speed": 210,
                "attack_damage": 15,
                "weapon_name": "Tachyon Torpedo",
                "weapon_damage": 15,
                "weapon_speed": 480,
                "weapon_color": "#f59e0b",
                "weapon_scale": 1.2,
                "weapon_scale_x": 1.2,
                "weapon_scale_y": 1.2,
                "weapon_scale_z": 1.5,
                "weapon_size_x": 1.0,
                "weapon_size_y": 1.0,
                "weapon_size_z": 2.0,
                "weapon_dimensions": {
                        "x": 1.0,
                        "y": 1.0,
                        "z": 2.0
                },
                "fire_rate": 2.5,
                "fire_rate_seconds": 2.5,
                "fire_rate_ms": 2500,
                "fire_rate_times_per_sec": 0.4,
                "weapons": [
                        {
                                "id": "ew_tachyon_torp",
                                "name": "Tachyon Torpedo",
                                "type": "missile",
                                "mount": "dual_wingtip",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 1.8,
                                "fire_point_y": -0.1,
                                "fire_point_z": 1.2,
                                "scale": 1.2,
                                "scale_x": 1.2,
                                "scale_y": 1.2,
                                "scale_z": 1.5,
                                "size_x": 1.0,
                                "size_y": 1.0,
                                "size_z": 2.0,
                                "dimensions": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 2.0
                                },
                                "fire_rate_times_per_sec": 0.4,
                                "fire_interval_ms": 2500,
                                "fire_rate_seconds": 2.5,
                                "damage": 15,
                                "speed": 480,
                                "color": "#f59e0b",
                                "is_enabled": 1
                        }
                ],
                "score": 350,
                "threat": "High",
                "piercing": "any",
                "pool_size": 40
        }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[EventHorizonObjectPool] Pre-allocated graphics object pool for Stage 2: Event Horizon`);
  }
}

  showGameOverCockpitCracks(durationMs = 1000) {
    if (this.cockpitCracksMesh) {
      showGameOverCockpitCracksOverlay(this.cockpitCracksMesh, durationMs);
    }
  }

  hideCockpitCracks() {
    if (this.cockpitCracksMesh) {
      this.cockpitCracksMesh.visible = false;
      this.cockpitCracksMesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = 0.0;
          child.material.needsUpdate = true;
        }
      });
    }
  }

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new EventHorizonObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
