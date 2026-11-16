import * as THREE from 'three';

/**
 * Wormhole XR - Universal Three.js Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates graphics objects for enemies and weapons at stage load time
 * to prevent frame drops, Garbage Collection pauses, and scene graph thrashing.
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
 * Fits the Cockpit Cracks 3D mesh across the camera frustum so it covers the entire cockpit window.
 */
export function fitCockpitCracksToCamera(mesh, camera) {
  if (!mesh || !camera) return;
  mesh.position.set(0, 0, -1.0);
  mesh.rotation.set(0, 0, 0);

  const aspect = camera.aspect || (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9);
  const vFovRad = ((camera.fov || 65) * Math.PI) / 180;
  const dist = 1.0;
  const visibleH = 2 * Math.tan(vFovRad / 2) * dist;
  const visibleW = visibleH * aspect;

  // Base model bounds: width ~1.90, height ~1.41
  const scale = Math.max((visibleW / 1.90) * 1.08, (visibleH / 1.41) * 1.08);
  mesh.scale.set(scale, scale, 1.0);
}

/**
 * Loads the Cockpit Cracks 3D GLB model asset with multi-path fallbacks.
 */
export async function loadCockpitCracksGlbAsset(glbUrl = COCKPIT_CRACKS_GLB_URL) {
  return new Promise((resolve) => {
    const candidateUrls = [
      glbUrl,
      'mobile/warp_origin_images/cockpit_cracks.glb',
      'wormhole0/mobile/warp_origin_images/cockpit_cracks.glb',
      'worm_hole0/mobile/warp_origin_images/cockpit_cracks.glb',
      '/wormhole0/mobile/warp_origin_images/cockpit_cracks.glb',
      'warp_origin_images/cockpit_cracks.glb',
      'wormhole0/warp_origin_images/cockpit_cracks.glb'
    ];

    if (typeof window !== 'undefined' && typeof window.load3DAssetModel === 'function') {
      window.load3DAssetModel(
        glbUrl,
        (cloned) => {
          if (cloned) {
            setupCockpitCracksHierarchy(cloned);
            resolve(cloned);
            return;
          }
          fallbackLoader(0);
        },
        () => fallbackLoader(0)
      );
      return;
    }

    fallbackLoader(0);

    function fallbackLoader(index = 0) {
      if (index >= candidateUrls.length) {
        console.warn('[CockpitCracks] Failed to load GLB from all candidate paths');
        resolve(null);
        return;
      }
      const curUrl = candidateUrls[index];

      import('three/addons/loaders/GLTFLoader.js')
        .then(({ GLTFLoader }) => {
          const loader = new GLTFLoader();
          loader.load(
            curUrl,
            (gltf) => {
              const scene = gltf.scene || gltf.scenes[0] || gltf;
              setupCockpitCracksHierarchy(scene);
              resolve(scene);
            },
            undefined,
            () => {
              fallbackLoader(index + 1);
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
      child.material.depthTest = false;
      child.material.depthWrite = false;
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

/**
 * Sets the Cockpit Cracks overlay across the cockpit view for 1 second before game over screen.
 */
export function showGameOverCockpitCracksOverlay(mesh, durationMs = 1000) {
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
      child.material.opacity = 1.0;
      child.material.depthTest = false;
      child.material.depthWrite = false;
      child.material.needsUpdate = true;
    }
  });
}

export class MeshPool {
  constructor(scene, geometry, material, initialSize = 50, createFn = null) {
    this.scene = scene;
    this.geometry = geometry;
    this.material = material;
    this.initialSize = initialSize;
    this.createFn = createFn;
    this.pool = [];
    this.active = new Set();

    // 1. Pre-allocate during load time
    for (let i = 0; i < initialSize; i++) {
      this.createObject();
    }
  }

  createObject() {
    let mesh;
    if (typeof this.createFn === 'function') {
      mesh = this.createFn(this.geometry, this.material);
    } else {
      mesh = new THREE.Mesh(this.geometry, this.material);
    }

    // Inactive objects in the pool held at -1000 and visibility set to false
    mesh.position.set(0, -1000, 0);
    mesh.visible = false; // Keep in scene graph, just hidden
    mesh.frustumCulled = true;

    // Movement logic, physics, weapons actions set to be inactive
    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = true;
    mesh.userData.isActive = false;
    mesh.userData.movementActive = false;
    mesh.userData.physicsActive = false;
    mesh.userData.weaponsActive = false;

    if (this.scene && mesh.parent !== this.scene) {
      this.scene.add(mesh);
    }

    this.pool.push(mesh);
    return mesh;
  }

  spawn(position, quaternion, scale = null) {
    // Grab from pool or expand if empty
    const mesh = this.pool.length > 0 ? this.pool.pop() : this.createObject();

    // Reset transform without allocating new vectors
    if (position) mesh.position.copy(position);
    if (quaternion) mesh.quaternion.copy(quaternion);

    if (scale !== null && scale !== undefined) {
      if (typeof scale === 'number') {
        mesh.scale.set(scale, scale, scale);
      } else if (scale.isVector3) {
        mesh.scale.copy(scale);
      } else if (typeof scale === 'object') {
        mesh.scale.set(
          scale.x !== undefined ? scale.x : 1,
          scale.y !== undefined ? scale.y : 1,
          scale.z !== undefined ? scale.z : 1
        );
      }
    } else {
      mesh.scale.set(1, 1, 1);
    }
    
    // Only becomes active when pulled from the pool
    mesh.visible = true;
    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = false;
    mesh.userData.isActive = true;
    mesh.userData.movementActive = true;
    mesh.userData.physicsActive = true;
    mesh.userData.weaponsActive = true;
    this.active.add(mesh);
    return mesh;
  }

  despawn(mesh) {
    if (!mesh) return;

    // Return to pool: held at -1000, visibility false, movement/physics/weapons inactive
    mesh.position.set(0, -1000, 0);
    mesh.visible = false;
    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = true;
    mesh.userData.isActive = false;
    mesh.userData.movementActive = false;
    mesh.userData.physicsActive = false;
    mesh.userData.weaponsActive = false;

    this.active.delete(mesh);
    if (!this.pool.includes(mesh)) {
      this.pool.push(mesh);
    }
  }

  despawnAll() {
    for (const mesh of this.active) {
      mesh.position.set(0, -1000, 0);
      mesh.visible = false;
      mesh.userData = mesh.userData || {};
      mesh.userData.inPool = true;
      mesh.userData.isActive = false;
      mesh.userData.movementActive = false;
      mesh.userData.physicsActive = false;
      mesh.userData.weaponsActive = false;
      this.pool.push(mesh);
    }
    this.active.clear();
  }

  dispose() {
    this.despawnAll();
    for (const mesh of this.pool) {
      if (this.scene && mesh.parent === this.scene) {
        this.scene.remove(mesh);
      }
      if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m && typeof m.dispose === 'function' && m.dispose());
        } else if (typeof mesh.material.dispose === 'function') {
          mesh.material.dispose();
        }
      }
    }
    this.pool = [];
  }
}

/**
 * Base Stage Object Pool
 * Coordinates enemy and weapon graphic object pools for an individual stage.
 */
export class StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    this.scene = scene;
    this.stageConfig = stageConfig;
    this.options = options;
    this.stageLevel = stageConfig.stage_level || 1;
    this.stageSlug = stageConfig.stage_slug || 'stage_' + this.stageLevel;

    // Separate pool maps for enemies and weapon graphics objects
    this.enemyPools = new Map();
    this.playerWeaponPools = new Map();
    this.enemyWeaponPools = new Map();

    // Pre-allocate when stage loads
    this.initPools();

    // Pre-allocate Cockpit Cracks 3D GLB Overlay Pool
    this.cockpitCracksOverlayPool = null;
    this.cockpitCracksMesh = null;
    this.initCockpitCracksPool();
  }

  initPools() {
    this.initPlayerWeaponPools();
    this.initEnemyWeaponPools();
    this.initEnemyPools();
    this.initWaves();
  }

  initWaves() {
    this.waves = (this.stageConfig && Array.isArray(this.stageConfig.waves) && this.stageConfig.waves.length > 0)
      ? this.stageConfig.waves
      : [
          {
            wave_number: 1,
            enemy_count: 5,
            interval_seconds: 0,
            description: 'Wave 1: Recon Vanguard (5 Enemies)'
          },
          {
            wave_number: 2,
            enemy_count: 10,
            interval_seconds: 15,
            description: 'Wave 2: Full Assault Swarm (10 Enemies)'
          }
        ];
    this.totalWaves = (this.stageConfig && this.stageConfig.total_waves) || this.waves.length || 2;
    this.waveIntervalSeconds = (this.stageConfig && this.stageConfig.wave_interval_seconds) || 15;
    this.currentWave = 0;
  }

  getWaveConfig(waveIndex = 1) {
    if (!this.waves) this.initWaves();
    return this.waves.find(w => w.wave_number === waveIndex) || this.waves[waveIndex - 1] || null;
  }

  pullEnemiesForWave(waveNumber = 1) {
    const waveCfg = this.getWaveConfig(waveNumber);
    return waveCfg ? waveCfg.enemy_count : (waveNumber === 1 ? 5 : 10);
  }

  initPlayerWeaponPools() {
    const weaponsCfg = this.stageConfig.weapons || {};
    const weaponList = [];
    if (weaponsCfg.initial) weaponList.push(weaponsCfg.initial);
    if (Array.isArray(weaponsCfg.acquirable)) weaponList.push(...weaponsCfg.acquirable);

    // Default player weapon types fallback
    if (weaponList.length === 0) {
      weaponList.push(
        { id: 'red_laser', color: '#ff2244', boltRadius: 0.14, boltLength: 7.5 },
        { id: 'blue_laser', color: '#00d4ff', boltRadius: 0.18, boltLength: 9.0 },
        { id: 'tachyon_lance', color: '#ffd166', boltRadius: 0.22, boltLength: 12.0 }
      );
    }

    for (const wpn of weaponList) {
      const wpnId = wpn.id || 'red_laser';
      if (this.playerWeaponPools.has(wpnId)) continue;

      const rawColor = wpn.color || '#ff2244';
      const colorHex = parseInt(rawColor.replace('#', '0x'), 16) || 0xff2244;
      const boltRadius = wpn.boltRadius || 0.14;
      const boltLength = wpn.boltLength || 7.5;

      const pool = new MeshPool(
        this.scene,
        null,
        null,
        wpn.pool_size || 300,
        () => {
          if (typeof this.options.createPlayerLaserMeshFn === 'function') {
            return this.options.createPlayerLaserMeshFn(wpn);
          }
          // Default high-performance player laser bolt graphic object
          const geom = new THREE.CylinderGeometry(boltRadius * 0.35, boltRadius, boltLength, 8);
          geom.rotateX(Math.PI / 2);
          const mat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
          });
          const bolt = new THREE.Mesh(geom, mat);

          // White-hot plasma core
          const coreGeom = new THREE.CylinderGeometry(boltRadius * 0.15, boltRadius * 0.35, boltLength * 0.92, 6);
          coreGeom.rotateX(Math.PI / 2);
          const coreMat = new THREE.MeshBasicMaterial({
            color: wpnId === 'blue_laser' ? 0xe0ffff : (wpnId === 'tachyon_lance' ? 0xfff4d6 : 0xffffff),
            transparent: true,
            opacity: 0.95
          });
          const coreMesh = new THREE.Mesh(coreGeom, coreMat);
          bolt.add(coreMesh);

          // Dynamic light
          const light = new THREE.PointLight(colorHex, wpn.bulletLightIntensity || 3.5, 35);
          bolt.add(light);

          bolt.name = `pooled_laser_${wpnId}`;
          bolt.userData.isLaserBolt = true;
          bolt.userData.isWeapon = true;
          bolt.userData.isCombatGraphic = true;
          bolt.userData.weaponId = wpnId;
          return bolt;
        }
      );

      this.playerWeaponPools.set(wpnId, pool);
    }
  }

  initEnemyWeaponPools() {
    // 1. Enemy Beam / Plasma Pulse Pool (Size = 300)
    const beamPool = new MeshPool(
      this.scene,
      null,
      null,
      300,
      () => {
        if (typeof this.options.createEnemyWeaponMeshFn === 'function') {
          return this.options.createEnemyWeaponMeshFn({ type: 'beam' }, {});
        }
        const geom = new THREE.CylinderGeometry(0.12, 0.12, 6.0, 6);
        geom.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(geom, mat);
        const light = new THREE.PointLight(0x38bdf8, 2.5, 20);
        mesh.add(light);
        mesh.name = 'pooled_enemy_beam';
        mesh.userData.isEnemyBolt = true;
        mesh.userData.isWeapon = true;
        mesh.userData.isCombatGraphic = true;
        mesh.userData.weaponType = 'beam';
        mesh.userData.poolKey = 'beam';
        return mesh;
      }
    );
    this.enemyWeaponPools.set('beam', beamPool);

    // 2. Enemy Missile / Torpedo Pool (Size = 300)
    const missilePool = new MeshPool(
      this.scene,
      null,
      null,
      300,
      () => {
        if (typeof this.options.createEnemyWeaponMeshFn === 'function') {
          return this.options.createEnemyWeaponMeshFn({ type: 'missile' }, {});
        }
        const group = new THREE.Group();
        const bodyGeom = new THREE.CylinderGeometry(0.2, 0.25, 2.8, 8);
        bodyGeom.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0xef476f,
          metalness: 0.8,
          roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);

        const noseGeom = new THREE.ConeGeometry(0.25, 1.0, 8);
        noseGeom.rotateX(-Math.PI / 2);
        noseGeom.translate(0, 0, 1.9);
        const noseMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        group.add(nose);

        const thruster = new THREE.PointLight(0xff0055, 3.0, 25);
        thruster.position.set(0, 0, -1.5);
        group.add(thruster);

        group.name = 'pooled_enemy_missile';
        group.userData.isEnemyBolt = true;
        group.userData.isWeapon = true;
        group.userData.isCombatGraphic = true;
        group.userData.weaponType = 'missile';
        group.userData.poolKey = 'missile';
        return group;
      }
    );
    this.enemyWeaponPools.set('missile', missilePool);

    // 3. Pre-allocate dedicated weapon pools for all enemy weapon graphics objects in this stage
    const enemies = Array.isArray(this.stageConfig.enemies) ? this.stageConfig.enemies : [];
    for (const enemyCfg of enemies) {
      const weaponList = Array.isArray(enemyCfg.weapons) && enemyCfg.weapons.length > 0
        ? enemyCfg.weapons
        : [{
            id: enemyCfg.weapon_name ? 'ew_' + enemyCfg.weapon_name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'ew_primary',
            name: enemyCfg.weapon_name || 'Plasma Pulse',
            type: enemyCfg.weaponType || 'beam',
            color: enemyCfg.weapon_color || enemyCfg.weaponColor || '#ff0055',
            model_url: enemyCfg.weapon_model_url || enemyCfg.weaponModelUrl || '',
            scale: enemyCfg.weapon_scale || 1.0,
            scale_x: enemyCfg.weapon_scale_x || 1.0,
            scale_y: enemyCfg.weapon_scale_y || 1.0,
            scale_z: enemyCfg.weapon_scale_z || 1.0,
            size_x: enemyCfg.weapon_size_x || 1.0,
            size_y: enemyCfg.weapon_size_y || 1.0,
            size_z: enemyCfg.weapon_size_z || 1.0,
            special_fx: enemyCfg.weapon_special_fx || 'cockpit_cracks_red_edges',
            special_fx_file: enemyCfg.weapon_special_fx_file || 'desktop/warp_origin_images/cockpit_cracks_overlay.png',
            special_fx_type: enemyCfg.weapon_special_fx_type || 'overlay'
          }];

      for (const wpn of weaponList) {
        const wpnKey = wpn.id || wpn.name || 'ew_primary';
        if (this.enemyWeaponPools.has(wpnKey)) continue;

        const wpnPool = new MeshPool(
          this.scene,
          null,
          null,
          wpn.pool_size || 60,
          () => {
            if (typeof this.options.createEnemyWeaponMeshFn === 'function') {
              const customMesh = this.options.createEnemyWeaponMeshFn(wpn, enemyCfg);
              if (customMesh) {
                customMesh.userData.poolKey = wpnKey;
                customMesh.userData.weaponId = wpnKey;
                return customMesh;
              }
            }
            const isMiss = (wpn.type === 'missile' || /missile|torpedo/i.test(wpn.name || ''));
            const rawCol = wpn.color || enemyCfg.weapon_color || '#ff0055';
            const colHex = parseInt(rawCol.replace('#', '0x'), 16) || 0xff0055;
            const geom = new THREE.CylinderGeometry(0.1 * (wpn.size_x || 1.0), 0.1 * (wpn.size_y || 1.0), 2.2 * (wpn.size_z || 1.0), 6);
            geom.rotateX(Math.PI / 2);
            const mat = new THREE.MeshBasicMaterial({ color: colHex, transparent: true, opacity: 0.95 });
            const m = new THREE.Mesh(geom, mat);
            const pLight = new THREE.PointLight(colHex, 3.0, 25);
            m.add(pLight);
            m.name = `pooled_enemy_wpn_${wpnKey}`;
            m.userData.isEnemyBolt = true;
            m.userData.isWeapon = true;
            m.userData.isCombatGraphic = true;
            m.userData.weaponType = isMiss ? 'missile' : 'beam';
            m.userData.poolKey = wpnKey;
            m.userData.weaponId = wpnKey;
            return m;
          }
        );
        this.enemyWeaponPools.set(wpnKey, wpnPool);
        if (wpn.model_url) {
          this.enemyWeaponPools.set(wpn.model_url, wpnPool);
        }
      }
    }
  }

  initEnemyPools() {
    const enemies = Array.isArray(this.stageConfig.enemies) && this.stageConfig.enemies.length > 0
      ? this.stageConfig.enemies
      : [
          {
            id: 'scout_drone',
            enemy_id: 'scout_drone',
            name: 'Void Recon Drone',
            model_3d_type: 'scout_drone',
            scale: 1.0,
            length: 2.8,
            height: 2.8,
            depth: 2.8,
            color: '#00f0ff',
            pool_size: 100
          }
        ];

    for (const enemyCfg of enemies) {
      // Prioritize semantic string slug (e.g. 'phase_interceptor', 'void_recon_drone') over numeric DB IDs
      const primaryKey = (enemyCfg.enemy_id && isNaN(enemyCfg.enemy_id))
        ? enemyCfg.enemy_id
        : (enemyCfg.id && isNaN(enemyCfg.id))
          ? enemyCfg.id
          : (enemyCfg.enemy_id || enemyCfg.id || enemyCfg.model_3d_type || 'enemy_default');

      if (this.enemyPools.has(primaryKey)) continue;

      const poolSize = Math.max(15, Math.min(enemyCfg.pool_size || 30, 35));
      const pool = new MeshPool(
        this.scene,
        null,
        null,
        poolSize,
        () => {
          if (typeof this.options.createEnemyMeshFn === 'function') {
            const mesh = this.options.createEnemyMeshFn(enemyCfg);
            mesh.userData.pooledEnemyKey = primaryKey;
            mesh.userData.isEnemyGraphic = true;
            return mesh;
          }

          // Fallback procedural enemy ship graphic object
          const rawColor = enemyCfg.color_hex || enemyCfg.color || '#00f0ff';
          const colorHex = parseInt(rawColor.replace('#', '0x'), 16) || 0x00f0ff;
          const group = new THREE.Group();
          const hullGeom = new THREE.OctahedronGeometry(1.6);
          const hullMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.85,
            roughness: 0.3,
            emissive: colorHex,
            emissiveIntensity: 0.35
          });
          const hull = new THREE.Mesh(hullGeom, hullMat);
          group.add(hull);

          const coreGeom = new THREE.SphereGeometry(0.7, 12, 12);
          const coreMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
          });
          const core = new THREE.Mesh(coreGeom, coreMat);
          group.add(core);

          group.name = `pooled_enemy_${primaryKey}`;
          group.userData.pooledEnemyKey = primaryKey;
          group.userData.isEnemyGraphic = true;
          return group;
        }
      );

      this.enemyPools.set(primaryKey, pool);
      if (enemyCfg.id !== undefined && enemyCfg.id !== null) {
        this.enemyPools.set(String(enemyCfg.id), pool);
        this.enemyPools.set(enemyCfg.id, pool);
      }
      if (enemyCfg.enemy_id !== undefined && enemyCfg.enemy_id !== null) {
        this.enemyPools.set(String(enemyCfg.enemy_id), pool);
        this.enemyPools.set(enemyCfg.enemy_id, pool);
      }
      if (typeof primaryKey === 'string') {
        const stripped = primaryKey.replace(/_(mobile|desktop|vr|arcore|all)$/i, '');
        if (!this.enemyPools.has(stripped)) {
          this.enemyPools.set(stripped, pool);
        }
      }
    }
  }

  // --- SPAWN METHODS ---

  getEnemyPool(enemyConfig) {
    if (!enemyConfig) return this.enemyPools.values().next().value || null;

    // 1. Direct match by enemy_id (slug like 'phase_interceptor' or 'void_recon_drone')
    if (enemyConfig.enemy_id) {
      if (this.enemyPools.has(enemyConfig.enemy_id)) return this.enemyPools.get(enemyConfig.enemy_id);
      if (this.enemyPools.has(String(enemyConfig.enemy_id))) return this.enemyPools.get(String(enemyConfig.enemy_id));
    }

    // 2. Direct match by id
    if (enemyConfig.id) {
      if (this.enemyPools.has(enemyConfig.id)) return this.enemyPools.get(enemyConfig.id);
      if (this.enemyPools.has(String(enemyConfig.id))) return this.enemyPools.get(String(enemyConfig.id));
    }

    // 3. Match without device suffix (e.g. 'void_recon_drone_mobile' -> 'void_recon_drone')
    const candidates = [enemyConfig.enemy_id, enemyConfig.id, enemyConfig.enemy_name, enemyConfig.name]
      .filter(k => typeof k === 'string' && k.trim());
    for (const cand of candidates) {
      const stripped = cand.replace(/_(mobile|desktop|vr|arcore|all)$/i, '');
      if (this.enemyPools.has(stripped)) return this.enemyPools.get(stripped);
    }

    // 4. Match by model 3D asset URL keywords
    if (enemyConfig.model_3d_url) {
      const urlLower = enemyConfig.model_3d_url.toLowerCase();
      if (urlLower.includes('interceptor') && (this.enemyPools.has('phase_interceptor') || this.enemyPools.has('phase_interceptor_all'))) {
        return this.enemyPools.get('phase_interceptor') || this.enemyPools.get('phase_interceptor_all');
      }
      if (urlLower.includes('recon') && (this.enemyPools.has('void_recon_drone') || this.enemyPools.has('void_recon_drone_mobile'))) {
        return this.enemyPools.get('void_recon_drone') || this.enemyPools.get('void_recon_drone_mobile');
      }
    }

    // 5. Substring match
    for (const cand of candidates) {
      const lower = cand.toLowerCase();
      for (const [key, pool] of this.enemyPools.entries()) {
        const keyLower = String(key).toLowerCase();
        if (lower.includes(keyLower) || keyLower.includes(lower)) {
          return pool;
        }
      }
    }

    // 6. Match by model_3d_type
    if (enemyConfig.model_3d_type && this.enemyPools.has(enemyConfig.model_3d_type)) {
      return this.enemyPools.get(enemyConfig.model_3d_type);
    }

    // Fallback: pick first available pool
    return this.enemyPools.values().next().value || null;
  }

  spawnEnemy(enemyConfig, position, quaternion = null, scale = null) {
    const pool = this.getEnemyPool(enemyConfig);
    if (!pool) return null;

    const mesh = pool.spawn(position, quaternion, scale);
    mesh.userData.fromPool = true;
    mesh.userData.poolKey = mesh.userData.pooledEnemyKey || (enemyConfig && (enemyConfig.enemy_id || enemyConfig.id)) || 'enemy';
    return mesh;
  }

  despawnEnemy(mesh, enemyConfig = null) {
    if (!mesh) return;
    let pool = null;
    if (enemyConfig) {
      pool = this.getEnemyPool(enemyConfig);
    }
    if (!pool && mesh.userData && mesh.userData.pooledEnemyKey) {
      pool = this.enemyPools.get(mesh.userData.pooledEnemyKey);
    }
    if (!pool && mesh.userData && mesh.userData.poolKey) {
      pool = this.enemyPools.get(mesh.userData.poolKey);
    }
    if (pool && pool.active && pool.active.has(mesh)) {
      pool.despawn(mesh);
      return;
    }
    // Search all enemy pools
    for (const p of this.enemyPools.values()) {
      if (p.active.has(mesh)) {
        p.despawn(mesh);
        return;
      }
    }
    mesh.position.set(0, -1000, 0);
    mesh.visible = false;
    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = true;
    mesh.userData.isActive = false;
    mesh.userData.movementActive = false;
    mesh.userData.physicsActive = false;
    mesh.userData.weaponsActive = false;
  }

  spawnPlayerLaser(weaponConfig, position, quaternion = null) {
    const wpn = weaponConfig || {};
    const wpnId = wpn.id || 'red_laser';
    let pool = this.playerWeaponPools.get(wpnId);
    if (!pool && this.playerWeaponPools.size > 0) {
      pool = this.playerWeaponPools.values().next().value;
    }
    if (!pool) return null;

    const baseScale = Number(wpn.scale ?? 1.0);
    const scaleX = Number(wpn.scale_x ?? 1.0);
    const scaleY = Number(wpn.scale_y ?? 1.0);
    const scaleZ = Number(wpn.scale_z ?? 1.0);
    const sizeX = Number(wpn.size_x ?? (wpn.dimensions && wpn.dimensions.x) ?? 1.0);
    const sizeY = Number(wpn.size_y ?? (wpn.dimensions && wpn.dimensions.y) ?? 1.0);
    const sizeZ = Number(wpn.size_z ?? (wpn.dimensions && wpn.dimensions.z) ?? 1.0);

    const finalScaleX = baseScale * scaleX * sizeX;
    const finalScaleY = baseScale * scaleY * sizeY;
    const finalScaleZ = baseScale * scaleZ * sizeZ;

    const mesh = pool.spawn(position, quaternion, { x: finalScaleX, y: finalScaleY, z: finalScaleZ });
    mesh.scale.set(finalScaleX, finalScaleY, finalScaleZ);
    mesh.userData.fromPool = true;
    mesh.userData.weaponId = wpnId;
    mesh.userData.scale = baseScale;
    mesh.userData.scale_x = scaleX;
    mesh.userData.scale_y = scaleY;
    mesh.userData.scale_z = scaleZ;
    mesh.userData.size_x = sizeX;
    mesh.userData.size_y = sizeY;
    mesh.userData.size_z = sizeZ;
    mesh.userData.dimensions = { x: sizeX, y: sizeY, z: sizeZ };
    return mesh;
  }

  despawnPlayerLaser(mesh, weaponId = null) {
    if (!mesh) return;
    const wpnId = weaponId || mesh.userData.weaponId || 'red_laser';
    const pool = this.playerWeaponPools.get(wpnId);
    if (pool) {
      pool.despawn(mesh);
    } else {
      for (const p of this.playerWeaponPools.values()) {
        if (p.active.has(mesh)) {
          p.despawn(mesh);
          return;
        }
      }
      mesh.position.set(0, -1000, 0);
      mesh.visible = false;
      mesh.userData = mesh.userData || {};
      mesh.userData.inPool = true;
      mesh.userData.isActive = false;
      mesh.userData.movementActive = false;
      mesh.userData.physicsActive = false;
      mesh.userData.weaponsActive = false;
    }
  }

  spawnEnemyWeapon(weaponConfig, enemyConfig, position, quaternion = null, typeOverride = null) {
    const wpn = weaponConfig || {};
    const wpnType = (typeOverride || wpn.type || (/missile|torpedo/i.test(wpn.name || '') ? 'missile' : 'beam')).toLowerCase();
    const poolKey = wpnType === 'missile' ? 'missile' : 'beam';
    const wpnId = wpn.id || wpn.name || '';
    const pool = (wpn.model_url && this.enemyWeaponPools.get(wpn.model_url))
      || (wpnId && this.enemyWeaponPools.get(wpnId))
      || this.enemyWeaponPools.get(poolKey)
      || this.enemyWeaponPools.get('beam')
      || (this.enemyWeaponPools.size > 0 ? this.enemyWeaponPools.values().next().value : null);
    if (!pool) return null;

    const baseScale = Number(wpn.scale ?? (enemyConfig && enemyConfig.weapon_scale) ?? 1.0);
    const scaleX = Number(wpn.scale_x ?? (enemyConfig && enemyConfig.weapon_scale_x) ?? 1.0);
    const scaleY = Number(wpn.scale_y ?? (enemyConfig && enemyConfig.weapon_scale_y) ?? 1.0);
    const scaleZ = Number(wpn.scale_z ?? (enemyConfig && enemyConfig.weapon_scale_z) ?? 1.0);
    const sizeX = Number(wpn.size_x ?? (wpn.dimensions && wpn.dimensions.x) ?? (enemyConfig && (enemyConfig.weapon_size_x ?? (enemyConfig.weapon_dimensions && enemyConfig.weapon_dimensions.x))) ?? 1.0);
    const sizeY = Number(wpn.size_y ?? (wpn.dimensions && wpn.dimensions.y) ?? (enemyConfig && (enemyConfig.weapon_size_y ?? (enemyConfig.weapon_dimensions && enemyConfig.weapon_dimensions.y))) ?? 1.0);
    const sizeZ = Number(wpn.size_z ?? (wpn.dimensions && wpn.dimensions.z) ?? (enemyConfig && (enemyConfig.weapon_size_z ?? (enemyConfig.weapon_dimensions && enemyConfig.weapon_dimensions.z))) ?? 1.0);

    const finalScaleX = baseScale * scaleX * sizeX;
    const finalScaleY = baseScale * scaleY * sizeY;
    const finalScaleZ = baseScale * scaleZ * sizeZ;

    const mesh = pool.spawn(position, quaternion, { x: finalScaleX, y: finalScaleY, z: finalScaleZ });
    mesh.scale.set(finalScaleX, finalScaleY, finalScaleZ);
    mesh.userData.fromPool = true;
    mesh.userData.weaponType = poolKey;
    mesh.userData.weaponId = wpnId || poolKey;
    mesh.userData.poolKey = (wpn.model_url && this.enemyWeaponPools.has(wpn.model_url)) ? wpn.model_url : (wpnId && this.enemyWeaponPools.has(wpnId)) ? wpnId : poolKey;
    mesh.userData.scale = baseScale;
    mesh.userData.scale_x = scaleX;
    mesh.userData.scale_y = scaleY;
    mesh.userData.scale_z = scaleZ;
    mesh.userData.size_x = sizeX;
    mesh.userData.size_y = sizeY;
    mesh.userData.size_z = sizeZ;
    mesh.userData.dimensions = { x: sizeX, y: sizeY, z: sizeZ };
    mesh.userData.special_fx = wpn.special_fx || (enemyConfig && enemyConfig.weapon_special_fx) || 'cockpit_cracks_red_edges';
    mesh.userData.special_fx_file = wpn.special_fx_file || (enemyConfig && enemyConfig.weapon_special_fx_file) || 'desktop/warp_origin_images/cockpit_cracks_overlay.png';
    mesh.userData.special_fx_type = wpn.special_fx_type || (enemyConfig && enemyConfig.weapon_special_fx_type) || 'overlay';
    return mesh;
  }

  despawnEnemyWeapon(mesh, weaponType = null) {
    if (!mesh) return;
    const poolKey = mesh.userData.poolKey || mesh.userData.weaponId || ((weaponType === 'missile' || mesh.userData.weaponType === 'missile') ? 'missile' : 'beam');
    const pool = this.enemyWeaponPools.get(poolKey);
    if (pool && pool.active && pool.active.has(mesh)) {
      pool.despawn(mesh);
      return;
    }
    // Search across all pools
    for (const p of this.enemyWeaponPools.values()) {
      if (p.active.has(mesh)) {
        p.despawn(mesh);
        return;
      }
    }
    mesh.position.set(0, -1000, 0);
    mesh.visible = false;
    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = true;
    mesh.userData.isActive = false;
    mesh.userData.movementActive = false;
    mesh.userData.physicsActive = false;
    mesh.userData.weaponsActive = false;
  }

  // --- CLEANUP METHODS ---

  despawnAllEnemies() {
    for (const pool of this.enemyPools.values()) {
      pool.despawnAll();
    }
  }

  despawnAllWeapons() {
    for (const pool of this.playerWeaponPools.values()) {
      pool.despawnAll();
    }
    for (const pool of this.enemyWeaponPools.values()) {
      pool.despawnAll();
    }
  }

  despawnAll() {
    this.despawnAllEnemies();
    this.despawnAllWeapons();
  }

  dispose() {
    for (const pool of this.enemyPools.values()) {
      pool.dispose();
    }
    this.enemyPools.clear();

    for (const pool of this.playerWeaponPools.values()) {
      pool.dispose();
    }
    this.playerWeaponPools.clear();

    for (const pool of this.enemyWeaponPools.values()) {
      pool.dispose();
    }
    this.enemyWeaponPools.clear();
  }

  // --- COCKPIT CRACKS OVERLAY POOL METHODS ---

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
        console.log(`[StageObjectPool] Pre-allocated Cockpit Cracks 3D GLB overlay pool from: ${glbUrl}`);
      }
    } catch (err) {
      console.warn('[StageObjectPool] Cockpit cracks pooling warning:', err);
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
      fitCockpitCracksToCamera(this.cockpitCracksMesh, camera);
    }
    return this.cockpitCracksMesh;
  }

  flashCockpitCracks(durationMs = 280) {
    if (this.cockpitCracksMesh) {
      flashCockpitCracksOverlay(this.cockpitCracksMesh, durationMs);
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
}
