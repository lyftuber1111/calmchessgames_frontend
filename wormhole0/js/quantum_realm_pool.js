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
        "initial": {
                "id": "quantum_phaser",
                "name": "Quantum Phaser",
                "icon": "\u2728",
                "color": "#10b981",
                "damage": 4,
                "bullet_speed": 950,
                "energy_drain_pct": 15.0,
                "can_overheat": 1,
                "cooldown_seconds": 6.0,
                "scale": 1.4,
                "scale_x": 1.2,
                "scale_y": 1.2,
                "scale_z": 1.5,
                "size_x": 1.1,
                "size_y": 1.1,
                "size_z": 1.8,
                "dimensions": {
                        "x": 1.1,
                        "y": 1.1,
                        "z": 1.8
                },
                "description": "Sub-atomic pulse rifle optimized for deep singularity warfare."
        },
        "acquirable": []
},
      enemies: [
        {
                "id": "quantum_dreadnought",
                "enemy_id": "quantum_dreadnought",
                "name": "Quantum Realm Dreadnought",
                "enemy_class": "Dreadnought",
                "icon": "\ud83d\udc80",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
                "color": "#f43f5e",
                "scale": 1.8,
                "length": 8.0,
                "height": 3.5,
                "depth": 7.5,
                "circumference": 20.0,
                "hits": 18,
                "armor": 80,
                "shield": 3,
                "speed": 140,
                "attack_damage": 40,
                "weapon_name": "Quantum Annihilator Cannon",
                "weapon_damage": 40,
                "weapon_speed": 600,
                "weapon_color": "#f43f5e",
                "weapon_scale": 1.6,
                "weapon_scale_x": 1.5,
                "weapon_scale_y": 1.5,
                "weapon_scale_z": 2.0,
                "weapon_size_x": 1.4,
                "weapon_size_y": 1.4,
                "weapon_size_z": 2.8,
                "weapon_dimensions": {
                        "x": 1.4,
                        "y": 1.4,
                        "z": 2.8
                },
                "fire_rate": 1.8,
                "fire_rate_seconds": 1.8,
                "fire_rate_ms": 1800,
                "fire_rate_times_per_sec": 0.556,
                "weapons": [
                        {
                                "id": "ew_quantum_annihilator",
                                "name": "Quantum Annihilator Cannon",
                                "type": "beam",
                                "mount": "center",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 0.0,
                                "fire_point_y": -0.2,
                                "fire_point_z": 2.0,
                                "scale": 1.6,
                                "scale_x": 1.5,
                                "scale_y": 1.5,
                                "scale_z": 2.0,
                                "size_x": 1.4,
                                "size_y": 1.4,
                                "size_z": 2.8,
                                "dimensions": {
                                        "x": 1.4,
                                        "y": 1.4,
                                        "z": 2.8
                                },
                                "fire_rate_times_per_sec": 0.556,
                                "fire_interval_ms": 1800,
                                "fire_rate_seconds": 1.8,
                                "damage": 40,
                                "speed": 600,
                                "color": "#f43f5e",
                                "is_enabled": 1
                        }
                ],
                "score": 1500,
                "threat": "Extreme",
                "piercing": "any",
                "pool_size": 40
        }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[QuantumRealmObjectPool] Pre-allocated graphics object pool for Stage 4: Quantum Realm`);
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
  return new QuantumRealmObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
