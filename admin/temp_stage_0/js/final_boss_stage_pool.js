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
  cockpit_overlay: {
    model_3d_url: 'mobile/warp_origin_images/cockpit_cracks.glb',
    model_url: 'mobile/warp_origin_images/cockpit_cracks.glb',
    asset_type: '3d_model'
  },
  cockpit_overlay_asset: 'mobile/warp_origin_images/cockpit_cracks.glb',
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
                "id": "quantum_disruptor",
                "name": "Quantum Disruptor",
                "icon": "\u26a1",
                "color": "#ff00aa",
                "damage": 5,
                "bullet_speed": 1050,
                "energy_drain_pct": 18.0,
                "can_overheat": 1,
                "cooldown_seconds": 5.5,
                "scale": 1.6,
                "scale_x": 1.4,
                "scale_y": 1.4,
                "scale_z": 2.0,
                "size_x": 1.5,
                "size_y": 1.5,
                "size_z": 2.5,
                "dimensions": {
                        "x": 1.5,
                        "y": 1.5,
                        "z": 2.5
                },
                "description": "Heavy antimatter pulse array piercing dark matter shields."
        },
        "acquirable": []
},
      enemies: [
        {
                "id": "final_boss_titan",
                "enemy_id": "final_boss_titan",
                "name": "Singularity Overlord Titan (Stage 5 Boss)",
                "enemy_class": "Boss Dreadnought",
                "icon": "\ud83d\udc80",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
                "color": "#ef4444",
                "scale": 2.2,
                "length": 9.0,
                "height": 4.8,
                "depth": 9.0,
                "circumference": 25.0,
                "hits": 45,
                "armor": 100,
                "shield": 20,
                "speed": 85,
                "attack_damage": 75,
                "weapon_name": "Overlord Annihilator",
                "weapon_damage": 75,
                "weapon_speed": 650,
                "weapon_color": "#ef4444",
                "weapon_scale": 1.8,
                "weapon_scale_x": 1.6,
                "weapon_scale_y": 1.6,
                "weapon_scale_z": 2.2,
                "weapon_size_x": 1.8,
                "weapon_size_y": 1.8,
                "weapon_size_z": 3.2,
                "weapon_dimensions": {
                        "x": 1.8,
                        "y": 1.8,
                        "z": 3.2
                },
                "fire_rate": 1.2,
                "fire_rate_seconds": 1.2,
                "fire_rate_ms": 1200,
                "fire_rate_times_per_sec": 0.833,
                "weapons": [
                        {
                                "id": "ew_boss_beam",
                                "name": "Overlord Annihilator",
                                "type": "beam",
                                "mount": "center",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 0.0,
                                "fire_point_y": -0.2,
                                "fire_point_z": 2.0,
                                "scale": 1.8,
                                "scale_x": 1.6,
                                "scale_y": 1.6,
                                "scale_z": 2.2,
                                "size_x": 1.8,
                                "size_y": 1.8,
                                "size_z": 3.2,
                                "dimensions": {
                                        "x": 1.8,
                                        "y": 1.8,
                                        "z": 3.2
                                },
                                "fire_rate_times_per_sec": 0.833,
                                "fire_interval_ms": 1200,
                                "fire_rate_seconds": 1.2,
                                "damage": 75,
                                "speed": 650,
                                "color": "#ef4444",
                                "is_enabled": 1
                        },
                        {
                                "id": "ew_boss_torpedo",
                                "name": "Gravitational Torpedo",
                                "type": "missile",
                                "mount": "dual_wingtip",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 2.5,
                                "fire_point_y": 0.0,
                                "fire_point_z": 1.0,
                                "scale": 1.5,
                                "scale_x": 1.3,
                                "scale_y": 1.3,
                                "scale_z": 1.8,
                                "size_x": 1.4,
                                "size_y": 1.4,
                                "size_z": 2.6,
                                "dimensions": {
                                        "x": 1.4,
                                        "y": 1.4,
                                        "z": 2.6
                                },
                                "fire_rate_times_per_sec": 0.4,
                                "fire_interval_ms": 2500,
                                "fire_rate_seconds": 2.5,
                                "damage": 50,
                                "speed": 450,
                                "color": "#ff0055",
                                "is_enabled": 1
                        }
                ],
                "score": 10000,
                "threat": "Extreme",
                "piercing": "quantum_disruptor",
                "pool_size": 100
        }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[FinalBossStageObjectPool] Pre-allocated graphics object pool for Stage 5: Final Boss Stage`);
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
  return new FinalBossStageObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
