/**
 * Calm Chess Games — Addy's Walmart Store Clerk XR (Meshy 3D Edition) Object Pool
 * Duplicated from addy_pool.js for store_clerk/addy2.html
 *
 * Pre-allocates all Meshy 3D GLB cloned instances after preloadMeshyAssets() completes,
 * sharing GPU geometries & PBR textures so the scene runs with zero runtime GC pauses
 * or shader stalls during restocking, checkout, lost-kid reunions, and VFX!
 */

import * as THREE from 'three';
import {
  ITEM_LIST,
  createRestockItem,
  createPersonCharacter,
  createFreeFoodTray,
  createHundredKTipModel,
  createShoppingBagModel,
  updateNameTagSprite
} from './addy2_models.js';

const OFFSCREEN_PARK_Y = -1000;

/**
 * Deduplicates deterministic static textures across pooled instances so VRAM stays lean.
 */
export function deduplicateStaticProceduralTextures(rootObj, categoryKey, sharedTexMap) {
  if (!rootObj || !sharedTexMap || typeof rootObj.traverse !== 'function') return;
  const slots = ['map', 'bumpMap', 'roughnessMap', 'emissiveMap'];
  const redundant = new Set();

  rootObj.traverse((child) => {
    if (!child || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (let i = 0; i < mats.length; i++) {
      const m = mats[i];
      if (!m) continue;
      for (let s = 0; s < slots.length; s++) {
        const slot = slots[s];
        const tex = m[slot];
        if (!tex || !tex.isTexture || !tex.name) continue;
        // Do not dispose shared GLB template textures
        if (m.userData && m.userData.meshyAsset) continue;
        const key = `${categoryKey}::${tex.name}`;
        if (sharedTexMap.has(key)) {
          const canonical = sharedTexMap.get(key);
          if (canonical && canonical !== tex) {
            m[slot] = canonical;
            redundant.add(tex);
          }
        } else {
          tex.userData = tex.userData || {};
          tex.userData._isSharedAsset = true;
          sharedTexMap.set(key, tex);
        }
      }
    }
  });

  for (const dupTex of redundant) {
    try { dupTex.dispose(); } catch (_) {}
  }
}

/**
 * Generic Pre-Allocated Three.js Object Pool
 */
export class ProceduralMeshPool {
  constructor(scene, poolName, initialSize, factoryFn, sharedTexMap = null) {
    this.scene = scene;
    this.poolName = poolName;
    this.factoryFn = factoryFn;
    this.sharedTexMap = sharedTexMap;
    this.available = [];
    this.active = new Set();
    this.createdCount = 0;

    for (let i = 0; i < initialSize; i++) {
      const obj = this._createInstance(i);
      this._park(obj);
      this.available.push(obj);
    }
  }

  _createInstance(index) {
    const obj = this.factoryFn(index);
    const root = obj && obj.group ? obj.group : obj;
    if (this.sharedTexMap && root) {
      deduplicateStaticProceduralTextures(root, this.poolName, this.sharedTexMap);
    }
    if (root) {
      root.userData = root.userData || {};
      root.userData.fromPool = true;
      root.userData.poolName = this.poolName;
      root.userData._poolWrapper = obj;
      if (this.scene && root.parent !== this.scene) {
        this.scene.add(root);
      }
    }
    this.createdCount++;
    return obj;
  }

  _park(obj) {
    const root = obj && obj.group ? obj.group : obj;
    if (!root) return;
    if (this.scene && root.parent !== this.scene) {
      this.scene.add(root);
    }
    root.visible = false;
    root.position.set(0, OFFSCREEN_PARK_Y, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.userData.inPool = true;
    root.userData.isActive = false;
  }

  spawn(position = null, targetParent = null) {
    let obj = this.available.pop();
    if (!obj) {
      obj = this._createInstance(this.createdCount);
    }
    const root = obj && obj.group ? obj.group : obj;
    if (root) {
      const host = targetParent || this.scene;
      if (host && root.parent !== host) {
        host.add(root);
      }
      root.visible = true;
      root.rotation.set(0, 0, 0);
      root.scale.set(1, 1, 1);
      if (position) {
        root.position.copy(position);
      } else {
        root.position.set(0, 0, 0);
      }
      root.userData.inPool = false;
      root.userData.isActive = true;
    }
    this.active.add(obj);
    return obj;
  }

  despawn(obj) {
    if (!obj) return;
    if (this.active.has(obj)) {
      this.active.delete(obj);
    }
    if (!this.available.includes(obj)) {
      this._park(obj);
      this.available.push(obj);
    }
  }

  despawnAll() {
    const activeCopy = Array.from(this.active);
    for (const obj of activeCopy) {
      this.despawn(obj);
    }
  }
}

/**
 * WalmartObjectPool — Dedicated Pre-Allocated Meshy 3D Pools for Addy2's Walmart XR
 */
export class WalmartObjectPool {
  constructor(scene) {
    this.scene = scene;
    this.sharedTextures = new Map();
    this.itemPools = new Map();

    // 1. Pre-allocate 6 dedicated Meshy item pools (14 instances each = 84 ready items!)
    for (const itemType of ITEM_LIST) {
      const pool = new ProceduralMeshPool(
        scene,
        `walmart_meshy_item_${itemType}`,
        14,
        (idx) => createRestockItem(itemType, idx),
        this.sharedTextures
      );
      this.itemPools.set(itemType, pool);
    }

    // 2. Pre-allocate Meshy Lost Kid Pool
    this.lostKidPool = new ProceduralMeshPool(
      scene,
      'walmart_meshy_lost_kid',
      3,
      (idx) => createPersonCharacter({ isKid: true, name: 'Kid', seed: idx + 1 }),
      this.sharedTextures
    );

    // 3. Pre-allocate Meshy Parent Pool
    this.parentPool = new ProceduralMeshPool(
      scene,
      'walmart_meshy_parent',
      3,
      (idx) => createPersonCharacter({ isKid: false, isParent: true, name: 'Parent', seed: idx + 5 }),
      this.sharedTextures
    );

    // 4. Pre-allocate Meshy Checkout Shopper Pool
    this.shopperPool = new ProceduralMeshPool(
      scene,
      'walmart_meshy_shopper',
      5,
      (idx) => createPersonCharacter({ isKid: false, name: '', seed: idx + 11 }),
      this.sharedTextures
    );

    // 5. Pre-allocate Meshy Free Food Gift Trays & $100,000.00 Tip Bundles
    this.freeFoodPool = new ProceduralMeshPool(
      scene,
      'walmart_free_food',
      3,
      () => createFreeFoodTray(),
      this.sharedTextures
    );

    this.tipBundlePool = new ProceduralMeshPool(
      scene,
      'walmart_tip_100k',
      3,
      () => createHundredKTipModel(),
      this.sharedTextures
    );

    // 6. Pre-allocate Meshy Filled Blue Walmart Shopping Bags for Checked-out Shoppers
    this.shoppingBagPool = new ProceduralMeshPool(
      scene,
      'walmart_shopping_bag',
      5,
      () => createShoppingBagModel(),
      this.sharedTextures
    );

    // 7. Pre-allocate 120 Sparkle / Confetti / Money-Rain Particle Pool
    this.sharedParticleGeo = new THREE.OctahedronGeometry(0.068, 0);
    this.particlePool = new ProceduralMeshPool(
      scene,
      'walmart_particles',
      120,
      () => {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffc220, transparent: true, opacity: 1 });
        return new THREE.Mesh(this.sharedParticleGeo, mat);
      },
      null
    );
  }

  spawnItem(itemType, position = null, targetParent = null) {
    const pool = this.itemPools.get(itemType);
    if (!pool) return null;
    const mesh = pool.spawn(position, targetParent);
    mesh.userData.itemType = itemType;
    mesh.userData.landingPop = 0;
    return mesh;
  }

  despawnItem(mesh) {
    if (!mesh) return;
    const itemType = mesh.userData && mesh.userData.itemType;
    const pool = itemType ? this.itemPools.get(itemType) : null;
    if (pool) {
      delete mesh.userData.interactable;
      delete mesh.userData.kind;
      delete mesh.userData.cartEntry;
      delete mesh.userData.checkoutItem;
      pool.despawn(mesh);
    }
  }

  _resetCharacterPose(charObj) {
    if (!charObj) return;
    if (charObj.modelRoot) {
      charObj.modelRoot.position.y = 0;
      charObj.modelRoot.rotation.set(0, 0, 0);
    }
    charObj.leftLeg.rotation.set(0, 0, 0);
    charObj.rightLeg.rotation.set(0, 0, 0);
    charObj.leftArm.rotation.set(0, 0, 0);
    charObj.rightArm.rotation.set(0, 0, 0);
  }

  spawnLostKid(name, position) {
    const kidChar = this.lostKidPool.spawn(position);
    if (kidChar.nameSprite) {
      updateNameTagSprite(kidChar.nameSprite, name, '#ffc220', '#0f172a');
    }
    this._resetCharacterPose(kidChar);
    return kidChar;
  }

  despawnLostKid(kidChar) {
    if (!kidChar) return;
    this._clearCharacterHandAnchor(kidChar);
    this.lostKidPool.despawn(kidChar);
  }

  spawnParent(kidName, position) {
    const parentChar = this.parentPool.spawn(position);
    if (parentChar.nameSprite) {
      updateNameTagSprite(parentChar.nameSprite, `${kidName}'s Parent`, '#0071ce', '#ffffff');
    }
    this._resetCharacterPose(parentChar);
    return parentChar;
  }

  despawnParent(parentChar) {
    if (!parentChar) return;
    this._clearCharacterHandAnchor(parentChar);
    this.parentPool.despawn(parentChar);
  }

  spawnShopper(position) {
    const shopperChar = this.shopperPool.spawn(position);
    this._resetCharacterPose(shopperChar);
    return shopperChar;
  }

  despawnShopper(shopperChar) {
    if (!shopperChar) return;
    this._clearCharacterHandAnchor(shopperChar);
    this.shopperPool.despawn(shopperChar);
  }

  _clearCharacterHandAnchor(charObj) {
    if (!charObj || !charObj.handAnchor) return;
    const children = [...charObj.handAnchor.children];
    for (const c of children) {
      const pName = c.userData && c.userData.poolName;
      if (pName === 'walmart_free_food') this.freeFoodPool.despawn(c);
      else if (pName === 'walmart_tip_100k') this.tipBundlePool.despawn(c);
      else if (pName === 'walmart_shopping_bag') this.shoppingBagPool.despawn(c);
      else charObj.handAnchor.remove(c);
    }
  }

  spawnParticle(position, colorHex) {
    const mesh = this.particlePool.spawn(position);
    if (mesh && mesh.material) {
      mesh.material.color.setHex(colorHex);
      mesh.material.opacity = 1;
    }
    return mesh;
  }

  despawnParticle(mesh) {
    if (mesh) this.particlePool.despawn(mesh);
  }

  getStats() {
    const itemStats = {};
    for (const [k, pool] of this.itemPools.entries()) {
      itemStats[k] = { active: pool.active.size, available: pool.available.length };
    }
    return {
      items: itemStats,
      lostKids: { active: this.lostKidPool.active.size, available: this.lostKidPool.available.length },
      parents: { active: this.parentPool.active.size, available: this.parentPool.available.length },
      shoppers: { active: this.shopperPool.active.size, available: this.shopperPool.available.length },
      particles: { active: this.particlePool.active.size, available: this.particlePool.available.length },
      sharedTextureCount: this.sharedTextures.size
    };
  }
}

export function createWalmartObjectPool(scene) {
  return new WalmartObjectPool(scene);
}
