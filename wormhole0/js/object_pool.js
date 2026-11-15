import * as THREE from 'three';

/**
 * Wormhole XR - Universal Three.js Object Pool
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 *
 * Pre-allocates graphics objects for enemies and weapons at stage load time
 * to prevent frame drops, Garbage Collection pauses, and scene graph thrashing.
 */

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

    mesh.visible = false; // Keep in scene graph, just hidden
    mesh.frustumCulled = true;

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
      }
    } else {
      mesh.scale.set(1, 1, 1);
    }
    
    mesh.visible = true;
    this.active.add(mesh);
    return mesh;
  }

  despawn(mesh) {
    if (!mesh || !this.active.has(mesh)) return;

    mesh.visible = false;
    this.active.delete(mesh);
    this.pool.push(mesh);
  }

  despawnAll() {
    for (const mesh of this.active) {
      mesh.visible = false;
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
  }

  initPools() {
    this.initPlayerWeaponPools();
    this.initEnemyWeaponPools();
    this.initEnemyPools();
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
        wpn.pool_size || 50,
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
    // 1. Enemy Beam / Plasma Pulse Pool (Size = 50)
    const beamPool = new MeshPool(
      this.scene,
      null,
      null,
      50,
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
        return mesh;
      }
    );
    this.enemyWeaponPools.set('beam', beamPool);

    // 2. Enemy Missile / Torpedo Pool (Size = 25)
    const missilePool = new MeshPool(
      this.scene,
      null,
      null,
      25,
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
        return group;
      }
    );
    this.enemyWeaponPools.set('missile', missilePool);
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
            color: '#00f0ff'
          }
        ];

    for (const enemyCfg of enemies) {
      const enemyKey = enemyCfg.id || enemyCfg.enemy_id || enemyCfg.model_3d_type || 'enemy_default';
      if (this.enemyPools.has(enemyKey)) continue;

      const poolSize = enemyCfg.pool_size || 15;
      const pool = new MeshPool(
        this.scene,
        null,
        null,
        poolSize,
        () => {
          if (typeof this.options.createEnemyMeshFn === 'function') {
            const mesh = this.options.createEnemyMeshFn(enemyCfg);
            mesh.userData.pooledEnemyKey = enemyKey;
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

          group.name = `pooled_enemy_${enemyKey}`;
          group.userData.pooledEnemyKey = enemyKey;
          group.userData.isEnemyGraphic = true;
          return group;
        }
      );

      this.enemyPools.set(enemyKey, pool);
    }
  }

  // --- SPAWN METHODS ---

  spawnEnemy(enemyConfig, position, quaternion = null, scale = null) {
    const enemyKey = (enemyConfig && (enemyConfig.id || enemyConfig.enemy_id || enemyConfig.model_3d_type)) || 'enemy_default';
    let pool = this.enemyPools.get(enemyKey);
    if (!pool && this.enemyPools.size > 0) {
      // Pick first available enemy pool
      pool = this.enemyPools.values().next().value;
    }
    if (!pool) return null;

    const mesh = pool.spawn(position, quaternion, scale);
    mesh.userData.fromPool = true;
    mesh.userData.poolKey = enemyKey;
    return mesh;
  }

  despawnEnemy(mesh, enemyConfig = null) {
    if (!mesh) return;
    const enemyKey = (enemyConfig && (enemyConfig.id || enemyConfig.enemy_id || enemyConfig.model_3d_type)) || mesh.userData.poolKey;
    const pool = this.enemyPools.get(enemyKey);
    if (pool) {
      pool.despawn(mesh);
    } else {
      // Search all enemy pools
      for (const p of this.enemyPools.values()) {
        if (p.active.has(mesh)) {
          p.despawn(mesh);
          return;
        }
      }
      mesh.visible = false;
    }
  }

  spawnPlayerLaser(weaponConfig, position, quaternion = null) {
    const wpnId = (weaponConfig && weaponConfig.id) || 'red_laser';
    let pool = this.playerWeaponPools.get(wpnId);
    if (!pool && this.playerWeaponPools.size > 0) {
      pool = this.playerWeaponPools.values().next().value;
    }
    if (!pool) return null;

    const mesh = pool.spawn(position, quaternion);
    mesh.userData.fromPool = true;
    mesh.userData.weaponId = wpnId;
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
      mesh.visible = false;
    }
  }

  spawnEnemyWeapon(weaponConfig, enemyConfig, position, quaternion = null, typeOverride = null) {
    const wpn = weaponConfig || {};
    const wpnType = (typeOverride || wpn.type || (/missile|torpedo/i.test(wpn.name || '') ? 'missile' : 'beam')).toLowerCase();
    const poolKey = wpnType === 'missile' ? 'missile' : 'beam';
    const pool = this.enemyWeaponPools.get(poolKey) || this.enemyWeaponPools.get('beam');
    if (!pool) return null;

    const mesh = pool.spawn(position, quaternion);
    mesh.userData.fromPool = true;
    mesh.userData.weaponType = poolKey;
    return mesh;
  }

  despawnEnemyWeapon(mesh, weaponType = null) {
    if (!mesh) return;
    const poolKey = (weaponType === 'missile' || mesh.userData.weaponType === 'missile') ? 'missile' : 'beam';
    const pool = this.enemyWeaponPools.get(poolKey);
    if (pool) {
      pool.despawn(mesh);
    } else {
      for (const p of this.enemyWeaponPools.values()) {
        if (p.active.has(mesh)) {
          p.despawn(mesh);
          return;
        }
      }
      mesh.visible = false;
    }
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
}
