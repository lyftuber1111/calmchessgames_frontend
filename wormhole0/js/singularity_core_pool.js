import * as THREE from 'three';
import {
  MeshPool,
  StageObjectPool,
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  setupCockpitOverlayHierarchy,
  fitCockpitCracksToCamera,
  fitCockpitOverlayToCamera,
  loadCockpitCracksGlbAsset,
  loadCockpitCracksAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay,
  toggleRandomWeaponDecal,
  toggleBrokenCoreDecal,
  toggleGameOverDecals,
  resetCockpitOverlayDecals,
  triggerCockpitCracksHit,
  triggerShieldDepletedCockpitCracks,
  triggerGameOverCockpitCracks,
  hideCockpitCracks
} from './object_pool.js';

export const STAGE_COCKPIT_CRACKS_GLB_URL = 'scene_images/screen_decals_spider_web_overlay_4.glb';
export const STAGE_COCKPIT_CRACKS_ASSET_URL = 'scene_images/screen_decals_spider_web_overlay_4.glb';
export const STAGE_COCKPIT_CRACKS_ASSET_TYPE = '3d_model';

export {
  COCKPIT_CRACKS_GLB_URL,
  setupCockpitCracksHierarchy,
  setupCockpitOverlayHierarchy,
  fitCockpitCracksToCamera,
  fitCockpitOverlayToCamera,
  loadCockpitCracksGlbAsset,
  loadCockpitCracksAsset,
  flashCockpitCracksOverlay,
  showGameOverCockpitCracksOverlay,
  toggleRandomWeaponDecal,
  toggleBrokenCoreDecal,
  toggleGameOverDecals,
  resetCockpitOverlayDecals,
  triggerCockpitCracksHit,
  triggerShieldDepletedCockpitCracks,
  triggerGameOverCockpitCracks,
  hideCockpitCracks
};

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
            cockpit_overlay_object: {
        model_3d_url: 'scene_images/screen_decals_spider_web_overlay_4.glb',
        model_url: 'scene_images/screen_decals_spider_web_overlay_4.glb',
        asset_type: '3d_model'
      },
      cockpit_overlay_asset: 'scene_images/screen_decals_spider_web_overlay_4.glb',
      cockpit_overlay: {
        model_3d_url: 'scene_images/screen_decals_spider_web_overlay_4.glb',
        model_url: 'scene_images/screen_decals_spider_web_overlay_4.glb',
        asset_type: '3d_model'
      },
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
        "id": "plasma_torpedo",
        "name": "Plasma Torpedo",
        "icon": "💣",
        "color": "#f59e0b",
        "damage": 5,
        "bullet_speed": 450,
        "energy_drain_pct": 40,
        "can_overheat": 0,
        "cooldown_seconds": 0,
        "acquire_event": "singularity_core_probe",
        "description": "Heavy magnetic payload causing massive kinetic shockwave without overheating.",
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
        "id": "void_guardian",
        "enemy_id": "void_guardian",
        "name": "Singularity Void Guardian (Universal)",
        "enemy_class": "Guardian Frigate",
        "icon": "👾",
        "model_3d_type": "singularity_probe",
        "model_3d_url": "",
        "scale": 1.2,
        "length": 3.8,
        "height": 3.8,
        "depth": 3.8,
        "circumference": 11.94,
        "color": "#a855f7",
        "hits": 15,
        "armor": 70,
        "shield": 6,
        "speed": 150,
        "attack_damage": 35,
        "weapon_name": "Void Disruptor",
        "weapon_damage": 35,
        "weapon_speed": 400,
        "weapon_color": "#a855f7",
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
        "fire_rate": 2.2,
        "fire_rate_seconds": 2.2,
        "fire_rate_ms": 2200,
        "fire_rate_times_per_sec": 0.455,
        "weapons": [
            {
                "id": "ew_void_guardian",
                "name": "Void Disruptor",
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
                "fire_rate_times_per_sec": 0.455,
                "fire_interval_ms": 2200,
                "fire_rate_seconds": 2.2,
                "damage": 35,
                "speed": 400,
                "color": "#a855f7",
                "is_enabled": 1
            }
        ],
        "score": 1000,
        "threat": "High",
        "piercing": "plasma_torpedo",
        "pool_size": 30,
        "quick_effect_primary": "gravitational_vortex",
        "quick_effect_secondary": "arc_lightning",
        "quick_effect_color": "#a855f7",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_quantum_implosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 80,
        "destruction_particle_color": "#a855f7",
        "destruction_particle_scale": 1
    }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[SingularityCoreObjectPool] Pre-allocated graphics object pool for Stage 3: Singularity Core`);
  }

    async initCockpitCracksPool() {
    try {
      const glbUrl = (this.stageConfig && (
        (this.stageConfig.cockpit_overlay_object && (this.stageConfig.cockpit_overlay_object.model_3d_url || this.stageConfig.cockpit_overlay_object.model_url || this.stageConfig.cockpit_overlay_object.url))
        || (this.stageConfig.cockpit_overlay && (this.stageConfig.cockpit_overlay.model_3d_url || this.stageConfig.cockpit_overlay.model_url))
        || this.stageConfig.cockpit_overlay_asset
        || (typeof this.stageConfig.cockpit_overlay_object === 'string' && this.stageConfig.cockpit_overlay_object)
        || this.stageConfig.cockpit_cracks_asset
      ))
      || STAGE_COCKPIT_CRACKS_ASSET_URL
      || STAGE_COCKPIT_CRACKS_GLB_URL
      || COCKPIT_CRACKS_GLB_URL
      || 'wormhole0/scene_images/screen_decals_spider_web_overlay_4.glb';

      const loadFn = typeof loadCockpitCracksAsset === 'function' ? loadCockpitCracksAsset : loadCockpitCracksGlbAsset;
      const loadedMesh = await loadFn(glbUrl);
      if (loadedMesh) {
        setupCockpitCracksHierarchy(loadedMesh);
        this.cockpitCracksMesh = loadedMesh;
        this.cockpitCracksOverlayPool = new MeshPool(
          this.scene,
          null,
          null,
          1,
          () => {
            const clone = loadedMesh.clone(true);
            setupCockpitCracksHierarchy(clone);
            return clone;
          }
        );
        console.log(`[SingularityCoreObjectPool] Pre-allocated Cockpit Overlay pool from: ${glbUrl}`);
        const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
        if (cam) {
          this.getCockpitCracksOverlay(cam);
        }
      }
    } catch (err) {
      console.warn('[SingularityCoreObjectPool] Cockpit overlay pooling warning:', err);
    }
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new SingularityCoreObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
