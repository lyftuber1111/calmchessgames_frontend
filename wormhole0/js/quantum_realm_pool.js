import * as THREE from 'three';
import {
  MeshPool,
  StageObjectPool,
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  fitCockpitCracksToCamera,
  loadCockpitCracksGlbAsset,
  loadCockpitCracksAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay
} from './object_pool.js';

export const STAGE_COCKPIT_CRACKS_GLB_URL = 'mobile/warp_origin_images/cockpit_cracks.glb';
export const STAGE_COCKPIT_CRACKS_ASSET_URL = 'mobile/warp_origin_images/cockpit_cracks.glb';
export const STAGE_COCKPIT_CRACKS_ASSET_TYPE = '3d_model';

export {
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  fitCockpitCracksToCamera,
  loadCockpitCracksGlbAsset,
  loadCockpitCracksAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay
};

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
        "id": "quantum_phaser",
        "name": "Quantum Phaser",
        "icon": "✨",
        "color": "#10b981",
        "damage": 4,
        "bullet_speed": 950,
        "energy_drain_pct": 15,
        "can_overheat": 1,
        "cooldown_seconds": 6,
        "acquire_event": "deep_core_breakthrough",
        "description": "Sub-atomic pulse rifle optimized for deep singularity warfare.",
        "scale": 1,
        "scale_x": 1,
        "scale_y": 1,
        "scale_z": 1,
        "size_x": 1,
        "size_y": 1,
        "size_z": 1,
        "dimensions": {
            "x": 1,
            "y": 1,
            "z": 1
        },
        "special_fx": "cockpit_cracks_red_edges",
        "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
        "special_fx_type": "overlay"
    },
    "acquirable": []
},
      enemies: [
    {
        "id": "quantum_dreadnought",
        "enemy_id": "quantum_dreadnought",
        "name": "Quantum Omega Dreadnought (Universal)",
        "enemy_class": "Boss Dreadnought",
        "icon": "💀",
        "model_3d_type": "dreadnought",
        "model_3d_url": "",
        "scale": 1.6,
        "length": 7,
        "height": 3.2,
        "depth": 6,
        "circumference": 15,
        "color": "#ef476f",
        "hits": 35,
        "armor": 90,
        "shield": 15,
        "speed": 90,
        "attack_damage": 60,
        "weapon_name": "Quantum Annihilator",
        "weapon_damage": 60,
        "weapon_speed": 650,
        "weapon_color": "#ef476f",
        "weapon_scale": 1,
        "weapon_scale_x": 1,
        "weapon_scale_y": 1,
        "weapon_scale_z": 1,
        "weapon_size_x": 1,
        "weapon_size_y": 1,
        "weapon_size_z": 1,
        "weapon_dimensions": {
            "x": 1,
            "y": 1,
            "z": 1
        },
        "weapon_special_fx": "cockpit_cracks_red_edges",
        "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 1.2,
        "fire_rate_seconds": 1.2,
        "fire_rate_ms": 1200,
        "fire_rate_times_per_sec": 0.833,
        "weapons": [
            {
                "id": "ew_quantum_dreadnought",
                "name": "Quantum Annihilator",
                "type": "beam",
                "mount": "dual_wingtip",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
                "scale": 1,
                "size_x": 1,
                "size_y": 1,
                "size_z": 1,
                "fire_rate_times_per_sec": 0.833,
                "fire_interval_ms": 1200,
                "fire_rate_seconds": 1.2,
                "damage": 60,
                "speed": 650,
                "color": "#ef476f",
                "is_enabled": 1
            }
        ],
        "score": 5000,
        "threat": "Extreme",
        "piercing": "quantum_phaser",
        "pool_size": 100,
        "quick_effect_primary": "quantum_phase_glow",
        "quick_effect_secondary": "energy_shield_pulse",
        "quick_effect_color": "#ef476f",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 120,
        "destruction_particle_color": "#ef476f",
        "destruction_particle_scale": 1
    }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[QuantumRealmObjectPool] Pre-allocated graphics object pool for Stage 4: Quantum Realm`);
  }

  async initCockpitCracksPool() {
    try {
      const glbUrl = (this.stageConfig && this.stageConfig.cockpit_overlay && (this.stageConfig.cockpit_overlay.model_3d_url || this.stageConfig.cockpit_overlay.model_url))
        || (this.stageConfig && this.stageConfig.cockpit_overlay_asset)
        || 'mobile/warp_origin_images/cockpit_cracks.glb'
        || COCKPIT_CRACKS_GLB_URL;

      const loadedMesh = (typeof loadCockpitCracksAsset === 'function' ? await loadCockpitCracksAsset(glbUrl) : await loadCockpitCracksGlbAsset(glbUrl));
      if (loadedMesh) {
        this.cockpitCracksMesh = loadedMesh;
        this.cockpitCracksOverlayPool = new MeshPool(
          this.scene,
          null,
          null,
          1,
          () => loadedMesh.clone(true)
        );
        console.log(`[QuantumRealmObjectPool] Pre-allocated Cockpit Cracks 3D GLB/GLTF overlay pool from: ${glbUrl}`);
      }
    } catch (err) {
      console.warn('[QuantumRealmObjectPool] Cockpit cracks pooling warning:', err);
    }
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new QuantumRealmObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };