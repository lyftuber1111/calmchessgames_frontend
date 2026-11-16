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
                "icon": "\ud83d\udd34",
                "color": "#ff2244",
                "damage": 2,
                "bullet_speed": 550,
                "energy_drain_pct": 10.0,
                "can_overheat": 1,
                "cooldown_seconds": 5.0,
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
                },
                "description": "Standard high-cadence plasma emitter with twin focus beams."
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
                        "acquire_event": "default_start",
                        "scale": 1.2,
                        "scale_x": 1.0,
                        "scale_y": 1.0,
                        "scale_z": 1.2,
                        "size_x": 1.2,
                        "size_y": 1.2,
                        "size_z": 1.5,
                        "dimensions": {
                                "x": 1.2,
                                "y": 1.2,
                                "z": 1.5
                        },
                        "description": "High-impact coherent photon beam with deep penetration."
                }
        ]
},
      enemies: [
        {
                "id": "phase_interceptor",
                "enemy_id": "phase_interceptor",
                "name": "Phase Interceptor",
                "enemy_class": "Fast Interceptor",
                "icon": "\ud83d\ude80",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/drone_phase_interceptor_3.glb",
                "color": "#38bdf8",
                "scale": 0.5,
                "length": 4.2,
                "height": 1.3,
                "depth": 3.4,
                "circumference": 5.0,
                "hits": 1,
                "armor": 1,
                "shield": 0,
                "speed": 220,
                "attack_damage": 1,
                "weapon_name": "Dual Ion Cannon",
                "weapon_damage": 1,
                "weapon_speed": 550,
                "weapon_color": "#38bdf8",
                "weapon_scale": 1.0,
                "weapon_scale_x": 1.0,
                "weapon_scale_y": 1.0,
                "weapon_scale_z": 1.0,
                "weapon_size_x": 1.0,
                "weapon_size_y": 1.0,
                "weapon_size_z": 1.0,
                "weapon_dimensions": {
                        "x": 1.0,
                        "y": 1.0,
                        "z": 1.0
                },
                "weapon_special_fx": "cockpit_cracks_red_edges",
                "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "weapon_special_fx_type": "overlay",
                "fire_rate": 3.0,
                "fire_rate_seconds": 3.0,
                "fire_rate_ms": 3000,
                "fire_rate_times_per_sec": 0.333,
                "weapons": [
                        {
                                "id": "ew_phase_ion",
                                "name": "Dual Ion Cannon",
                                "type": "beam",
                                "mount": "dual_wingtip",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 0.0,
                                "fire_point_y": -0.15,
                                "fire_point_z": 1.5,
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
                                },
                                "special_fx": "cockpit_cracks_red_edges",
                                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                                "special_fx_type": "overlay",
                                "fire_rate_times_per_sec": 0.333,
                                "fire_interval_ms": 3000,
                                "fire_rate_seconds": 3.0,
                                "damage": 1,
                                "speed": 550,
                                "color": "#38bdf8",
                                "is_enabled": 1
                        }
                ],
                "score": 150,
                "threat": "Medium",
                "piercing": "any",
                "pool_size": 40
        },
        {
                "id": "recon_drone",
                "enemy_id": "recon_drone",
                "name": "Recon Drone",
                "enemy_class": "Scout Drone",
                "icon": "\ud83d\udef8",
                "model_3d_type": "custom_glb",
                "model_3d_url": "desktop/warp_origin_images/recon_drone_2.8m.glb",
                "color": "#00f0ff",
                "scale": 0.4,
                "length": 2.8,
                "height": 2.8,
                "depth": 2.8,
                "circumference": 8.8,
                "hits": 1,
                "armor": 0,
                "shield": 0,
                "speed": 180,
                "attack_damage": 1,
                "weapon_name": "Plasma Pulse",
                "weapon_damage": 1,
                "weapon_speed": 450,
                "weapon_color": "#00f0ff",
                "weapon_scale": 0.8,
                "weapon_scale_x": 0.8,
                "weapon_scale_y": 0.8,
                "weapon_scale_z": 1.0,
                "weapon_size_x": 0.5,
                "weapon_size_y": 0.5,
                "weapon_size_z": 1.0,
                "weapon_dimensions": {
                        "x": 0.5,
                        "y": 0.5,
                        "z": 1.0
                },
                "weapon_special_fx": "cockpit_cracks_red_edges",
                "weapon_special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                "weapon_special_fx_type": "overlay",
                "fire_rate": 2.5,
                "fire_rate_seconds": 2.5,
                "fire_rate_ms": 2500,
                "fire_rate_times_per_sec": 0.4,
                "weapons": [
                        {
                                "id": "ew_recon_pulse",
                                "name": "Plasma Pulse",
                                "type": "beam",
                                "mount": "center",
                                "model_url": "",
                                "model_type": "",
                                "fire_point_x": 0.0,
                                "fire_point_y": -0.15,
                                "fire_point_z": 1.5,
                                "scale": 0.8,
                                "scale_x": 0.8,
                                "scale_y": 0.8,
                                "scale_z": 1.0,
                                "size_x": 0.5,
                                "size_y": 0.5,
                                "size_z": 1.0,
                                "dimensions": {
                                        "x": 0.5,
                                        "y": 0.5,
                                        "z": 1.0
                                },
                                "special_fx": "cockpit_cracks_red_edges",
                                "special_fx_file": "desktop/warp_origin_images/cockpit_cracks_overlay.png",
                                "special_fx_type": "overlay",
                                "fire_rate_times_per_sec": 0.4,
                                "fire_interval_ms": 2500,
                                "fire_rate_seconds": 2.5,
                                "damage": 1,
                                "speed": 450,
                                "color": "#00f0ff",
                                "is_enabled": 1
                        }
                ],
                "score": 100,
                "threat": "Low",
                "piercing": "any",
                "pool_size": 40
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
