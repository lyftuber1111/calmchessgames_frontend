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

export const COCKPIT_CRACKS_GLB_URL = 'mobile/warp_origin_images/cockpit_cracks.glb';

let activeFlashTimer = null;
let activeFadeRaf = null;

/**
 * Traverses and configures the Cockpit Cracks 3D mesh hierarchy as a transparent overlay.
 */
export function setupCockpitCracksHierarchy(root) {
  if (!root) return;
  root.name = 'cockpit_cracks_overlay';
  root.visible = false;
  root.userData = root.userData || {};
  root.userData.isCockpitCracks = true;
  root.userData.isOverlay = true;

  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;
      child.renderOrder = 9999;
      if (child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.0;
        child.material.depthTest = false;
        child.material.depthWrite = false;
        child.material.side = THREE.DoubleSide;
        child.material.blending = THREE.NormalBlending;
        child.material.needsUpdate = true;
      }
    }
  });
}

/**
 * Loads the Cockpit Cracks 3D GLB model asset with multi-path fallbacks.
 */
export async function loadCockpitCracksGlbAsset(glbUrl = COCKPIT_CRACKS_GLB_URL) {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.load3DAssetModel === 'function') {
      window.load3DAssetModel(
        glbUrl,
        (cloned) => {
          if (cloned) {
            setupCockpitCracksHierarchy(cloned);
            resolve(cloned);
            return;
          }
          fallbackLoader();
        },
        () => fallbackLoader()
      );
      return;
    }

    fallbackLoader();

    function fallbackLoader() {
      import('three/addons/loaders/GLTFLoader.js')
        .then(({ GLTFLoader }) => {
          const loader = new GLTFLoader();
          loader.load(
            glbUrl,
            (gltf) => {
              const scene = gltf.scene || gltf.scenes[0] || gltf;
              setupCockpitCracksHierarchy(scene);
              resolve(scene);
            },
            undefined,
            (err) => {
              const altUrl = 'wormhole0/' + glbUrl;
              loader.load(
                altUrl,
                (gltf2) => {
                  const scene2 = gltf2.scene || gltf2.scenes[0] || gltf2;
                  setupCockpitCracksHierarchy(scene2);
                  resolve(scene2);
                },
                undefined,
                (err2) => {
                  console.warn('[CockpitCracks] Failed to load GLB from both paths:', err, err2);
                  resolve(null);
                }
              );
            }
          );
        })
        .catch((e) => {
          console.warn('[CockpitCracks] Failed to import GLTFLoader:', e);
          resolve(null);
        });
    }
  });
}

/**
 * Triggers an instant flash of the Cockpit Cracks transparent overlay, then smoothly returns to invisible.
 */
export function flashCockpitCracksOverlay(mesh, durationMs = 280) {
  if (!mesh) return;

  if (activeFlashTimer) {
    clearTimeout(activeFlashTimer);
    activeFlashTimer = null;
  }
  if (activeFadeRaf) {
    cancelAnimationFrame(activeFadeRaf);
    activeFadeRaf = null;
  }

  mesh.visible = true;
  mesh.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.transparent = true;
      child.material.opacity = 0.95;
      child.material.needsUpdate = true;
    }
  });

  activeFlashTimer = setTimeout(() => {
    const startTime = performance.now();
    const fadeDuration = 100;

    function fade(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / fadeDuration);
      const curOpacity = 0.95 * (1.0 - progress);

      mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = curOpacity;
          child.material.needsUpdate = true;
        }
      });

      if (progress < 1.0) {
        activeFadeRaf = requestAnimationFrame(fade);
      } else {
        mesh.visible = false;
        mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = 0.0;
            child.material.needsUpdate = true;
          }
        });
      }
    }
    activeFadeRaf = requestAnimationFrame(fade);
  }, durationMs);
}

export class WarpOriginObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: 1,
      stage_name: 'Warp Origin',
      stage_slug: 'warp_origin',
      environment_theme: 'Warp Cyan Corridor',
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
        "id": "red_laser",
        "name": "Red Laser",
        "icon": "🔴",
        "color": "#ff2244",
        "damage": 2,
        "bullet_speed": 550,
        "energy_drain_pct": 1,
        "can_overheat": 1,
        "cooldown_seconds": 5,
        "acquire_event": "default_start",
        "description": "Standard high-cadence plasma emitter with twin focus beams.",
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
    "acquirable": [
        {
            "id": "blue_laser",
            "name": "Blue Laser",
            "icon": "🔵",
            "color": "#00d4ff",
            "damage": 3,
            "bullet_speed": 700,
            "energy_drain_pct": 5,
            "can_overheat": 1,
            "cooldown_seconds": 10,
            "acquire_event": "default_start",
            "description": "High-impact coherent photon beam with deep penetration.",
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
        }
    ]
},
      enemies: [
    {
        "id": "phase_interceptor",
        "enemy_id": "phase_interceptor",
        "name": "Phase Interceptor (Universal)",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 0.5,
        "length": 4.2,
        "height": 1.3,
        "depth": 3.4,
        "circumference": 5,
        "color": "#38bdf8",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Dual Ion Cannon",
        "weapon_damage": 1,
        "weapon_speed": 550,
        "weapon_color": "#38bdf8",
        "weapon_scale": 0.5,
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
        "fire_rate": 3,
        "fire_rate_seconds": 3,
        "fire_rate_ms": 3000,
        "fire_rate_times_per_sec": 0.333,
        "weapons": [
            {
                "id": "ew_phase_interceptor_0",
                "name": "Dual Ion Cannon",
                "type": "beam",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
                "scale": 0.5,
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
                "fire_rate_times_per_sec": 0.333,
                "fire_interval_ms": 3000,
                "fire_rate_seconds": 3,
                "damage": 1,
                "speed": 550,
                "color": "#38bdf8",
                "special_fx": "cockpit_cracks_red_edges",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 250,
        "threat": "Medium",
        "piercing": "red_laser",
        "pool_size": 30,
        "quick_effect_primary": "engine_ion_thrust",
        "quick_effect_secondary": "plasma_aura",
        "quick_effect_color": "#38bdf8",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 45,
        "destruction_particle_color": "#38bdf8",
        "destruction_particle_scale": 1
    },
    {
        "id": "void_recon_drone_mobile",
        "enemy_id": "void_recon_drone_mobile",
        "name": "Void Recon Drone (Mobile)",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 0.75,
        "length": 2.8,
        "height": 2.8,
        "depth": 2.8,
        "circumference": 8.8,
        "color": "#00f0ff",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 1,
        "weapon_speed": 450,
        "weapon_color": "#00f0ff",
        "weapon_scale": 1,
        "weapon_scale_x": 0.5,
        "weapon_scale_y": 0.5,
        "weapon_scale_z": 1,
        "weapon_size_x": 1,
        "weapon_size_y": 1,
        "weapon_size_z": 1,
        "weapon_dimensions": {
            "x": 1,
            "y": 1,
            "z": 1
        },
        "weapon_special_fx": "none",
        "weapon_special_fx_file": "mobile/warp_origin_images/cockpit_cracks_overlay.png",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 2,
        "fire_rate_seconds": 2,
        "fire_rate_ms": 2000,
        "fire_rate_times_per_sec": 0.5,
        "weapons": [
            {
                "id": "ew_0_fzo0",
                "name": "Plasma Pulse",
                "type": "missile",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
                "scale": 1,
                "scale_x": 0.5,
                "scale_y": 0.5,
                "scale_z": 1,
                "size_x": 1,
                "size_y": 1,
                "size_z": 1,
                "dimensions": {
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "fire_rate_times_per_sec": 0.5,
                "fire_interval_ms": 2000,
                "fire_rate_seconds": 2,
                "damage": 1,
                "speed": 450,
                "color": "#00f0ff",
                "special_fx": "none",
                "special_fx_file": "mobile/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 100,
        "threat": "Low",
        "piercing": "any",
        "pool_size": 30,
        "quick_effect_primary": "plasma_aura",
        "quick_effect_secondary": "sparks_burst",
        "quick_effect_color": "#00f0ff",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_sparks_explosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 30,
        "destruction_particle_color": "#00f0ff",
        "destruction_particle_scale": 1
    },
    {
        "id": "phase_interceptor_all",
        "enemy_id": "phase_interceptor_all",
        "name": "Phase Interceptor (Universal)",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 0.75,
        "length": 4.2,
        "height": 1.3,
        "depth": 3.4,
        "circumference": 5,
        "color": "#38bdf8",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Dual Ion Cannon",
        "weapon_damage": 1,
        "weapon_speed": 550,
        "weapon_color": "#38bdf8",
        "weapon_scale": 1,
        "weapon_scale_x": 0.5,
        "weapon_scale_y": 0.5,
        "weapon_scale_z": 1,
        "weapon_size_x": 1,
        "weapon_size_y": 1,
        "weapon_size_z": 1,
        "weapon_dimensions": {
            "x": 1,
            "y": 1,
            "z": 1
        },
        "weapon_special_fx": "none",
        "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
        "weapon_special_fx_type": "overlay",
        "fire_rate": 3,
        "fire_rate_seconds": 3,
        "fire_rate_ms": 3003,
        "fire_rate_times_per_sec": 0.333,
        "weapons": [
            {
                "id": "ew_0_jerr",
                "name": "Dual Ion Cannon",
                "type": "missile",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
                "scale": 1,
                "scale_x": 0.5,
                "scale_y": 0.5,
                "scale_z": 1,
                "size_x": 1,
                "size_y": 1,
                "size_z": 1,
                "dimensions": {
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "fire_rate_times_per_sec": 0.333,
                "fire_interval_ms": 3003,
                "fire_rate_seconds": 3.003,
                "damage": 1,
                "speed": 550,
                "color": "#38bdf8",
                "special_fx": "none",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 250,
        "threat": "Medium",
        "piercing": "red_laser",
        "pool_size": 30,
        "quick_effect_primary": "engine_ion_thrust",
        "quick_effect_secondary": "plasma_aura",
        "quick_effect_color": "#38bdf8",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 45,
        "destruction_particle_color": "#38bdf8",
        "destruction_particle_scale": 1
    },
    {
        "id": "void_recon_drone",
        "enemy_id": "void_recon_drone",
        "name": "Void Recon Drone (Desktop)",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 1,
        "length": 3,
        "height": 1.5,
        "depth": 3,
        "circumference": 6,
        "color": "#ef476f",
        "hits": 2,
        "armor": 10,
        "shield": 0,
        "speed": 250,
        "attack_damage": 5,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 5,
        "weapon_speed": 450,
        "weapon_color": "#ff2255",
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
        "fire_rate": 3,
        "fire_rate_seconds": 3,
        "fire_rate_ms": 3000,
        "fire_rate_times_per_sec": 0.333,
        "weapons": [
            {
                "id": "ew_void_recon_drone_0",
                "name": "Plasma Pulse",
                "type": "beam",
                "mount": "center",
                "model_url": "",
                "model_type": "",
                "fire_point_x": 0,
                "fire_point_y": -0.15,
                "fire_point_z": 1.5,
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
                "fire_rate_times_per_sec": 0.333,
                "fire_interval_ms": 3000,
                "fire_rate_seconds": 3,
                "damage": 5,
                "speed": 450,
                "color": "#ff2255",
                "special_fx": "cockpit_cracks_red_edges",
                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "special_fx_type": "overlay",
                "is_enabled": 1
            }
        ],
        "score": 100,
        "threat": "Low",
        "piercing": "any",
        "pool_size": 30,
        "quick_effect_primary": "none",
        "quick_effect_secondary": "none",
        "quick_effect_color": "#00f0ff",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_sparks_explosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 40,
        "destruction_particle_color": "#ef476f",
        "destruction_particle_scale": 1
    }
],
      ...stageConfig
    };

    super(scene, configWithDefaults, options);

    // Pre-allocate Cockpit Cracks 3D GLB Overlay Pool
    this.cockpitCracksOverlayPool = null;
    this.cockpitCracksMesh = null;
    this.initCockpitCracksPool();

    console.log(`[WarpOriginObjectPool] Pre-allocated graphics object pool for Stage 1: Warp Origin`);
  }

  async initCockpitCracksPool() {
    try {
      const glbUrl = (this.stageConfig && this.stageConfig.cockpit_overlay && this.stageConfig.cockpit_overlay.model_3d_url)
        || (this.stageConfig && this.stageConfig.cockpit_overlay && this.stageConfig.cockpit_overlay.model_url)
        || COCKPIT_CRACKS_GLB_URL;

      const loadedMesh = await loadCockpitCracksGlbAsset(glbUrl);
      if (loadedMesh) {
        this.cockpitCracksMesh = loadedMesh;
        this.cockpitCracksOverlayPool = new MeshPool(
          this.scene,
          null,
          null,
          1,
          () => loadedMesh.clone(true)
        );
        console.log(`[WarpOriginObjectPool] Pre-allocated Cockpit Cracks 3D GLB overlay pool from: ${glbUrl}`);
      }
    } catch (err) {
      console.warn('[WarpOriginObjectPool] Cockpit cracks pooling warning:', err);
    }
  }

  getCockpitCracksOverlay(camera = null) {
    if (!this.cockpitCracksMesh && this.cockpitCracksOverlayPool) {
      this.cockpitCracksMesh = this.cockpitCracksOverlayPool.spawn();
    }
    if (this.cockpitCracksMesh && camera && this.cockpitCracksMesh.parent !== camera) {
      const existing = camera.getObjectByName('cockpit_cracks_overlay');
      if (existing && existing !== this.cockpitCracksMesh) {
        camera.remove(existing);
      }
      camera.add(this.cockpitCracksMesh);
      this.cockpitCracksMesh.position.set(0, 0, -1.0);
      this.cockpitCracksMesh.rotation.set(0, 0, 0);

      const aspect = camera.aspect || (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9);
      const vFovRad = ((camera.fov || 65) * Math.PI) / 180;
      const visibleH = 2 * Math.tan(vFovRad / 2) * 1.0;
      const visibleW = visibleH * aspect;
      const scale = Math.max((visibleW / 1.90) * 1.08, (visibleH / 1.41) * 1.08);
      this.cockpitCracksMesh.scale.set(scale, scale, 1.0);
    }
    return this.cockpitCracksMesh;
  }

  flashCockpitCracks(durationMs = 280) {
    if (this.cockpitCracksMesh) {
      flashCockpitCracksOverlay(this.cockpitCracksMesh, durationMs);
    }
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
  return new WarpOriginObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };