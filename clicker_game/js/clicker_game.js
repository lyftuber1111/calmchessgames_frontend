/**
 * Calm Chess Computers & Games — Kawaii 7-Row Mechanical Clicker XR
 * Modeled after collectible kawaii chibi mechanical keyboard clickers in a pink silicone case:
 *  - 7 Distinct Pastel Rows x 5 Columns (35 tactile mechanical clickers!)
 *  - Thick soft-touch Pink Silicone Protective Case with molded hearts, stars & swinging pastel charm
 *  - 14 Adorable Cartoonish Kawaii Chibi Keycaps (modeled directly on clickers0.jpg!)
 *    with puffy cushion geometry, glossy anime eyes, 3D ears/bows/glasses/flowers/swirls
 *  - Dedicated Procedural Graphics Asset Pooling Architecture (modeled on wormhole0/js/warp_origin_pool.js):
 *    pre-allocated isolated pools per procedural asset type (14 character keycap pools,
 *    7 pastel row switch housing pools, pink silicone case pool, environment/cloud/starfield pools,
 *    heart & star burst particle pools, and XR controller ray/reticle pools) with static
 *    procedural CanvasTexture deduplication and zero per-click GPU/mesh allocations!
 *  - Authentic Mechanical Keyboard Switch Travel (press down -> bottom-out thock -> spring-up clack!)
 *  - Drag/glide strumming across rows, physical keyboard support, & Rainbow Wave procedural XR animations
 *  - Full WebXR (immersive-vr + passthrough immersive-ar) with dual controllers & hand-tracking fingertip poke!
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { createClickerAudioEngine } from './clicker_audio.js';

// ---------------------------------------------------------------------------
// Constants & Board Configuration
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'calmchess_kawaii_7row_clicker_v1';
const NUM_ROWS = 7;
const NUM_COLS = 5;
const KEY_PITCH = 1.12;

// 7 Vivid Pastel Row Themes (matching the interlocking pastel switch bases in clickers0.jpg!)
const ROW_THEMES = [
  { name: 'Sunny Yellow',  housingHex: 0xffd43b, ledHex: 0xffe066, stemHex: 0xff8c1a },
  { name: 'Mint Lime',     housingHex: 0xa6e84f, ledHex: 0x6ee7b7, stemHex: 0x10b981 },
  { name: 'Bubblegum',     housingHex: 0xff75bc, ledHex: 0xff4da6, stemHex: 0xe61c7c },
  { name: 'Sky Aqua',      housingHex: 0x6cd8eb, ledHex: 0x38bdf8, stemHex: 0x0ea5e9 },
  { name: 'Lavender',      housingHex: 0xc084fc, ledHex: 0xa855f7, stemHex: 0x9333ea },
  { name: 'Peach Sorbet',  housingHex: 0xffa366, ledHex: 0xfb923c, stemHex: 0xf43f5e },
  { name: 'Cotton Rose',   housingHex: 0xff85c0, ledHex: 0xf472b6, stemHex: 0xec4899 }
];

// 14 Adorable Kawaii Chibi Characters modeled directly on clickers0.jpg + 7-year-old favorites!
const CHARACTER_CATALOG = [
  {
    id: 'candyPup',
    base: '#ff9636', hex: 0xff9636, accent: '#22b8f0', cheek: '#ff6699',
    eyeColor: '#69203f', eyeRim: '#ff3d8b', style: 'candyPup', topper: 'roundEarsBlueDots'
  },
  {
    id: 'mintOwl',
    base: '#72d6e0', hex: 0x72d6e0, accent: '#1ea377', cheek: '#ff70a6',
    eyeColor: '#1f6e55', eyeRim: '#e6428e', style: 'mintOwl', topper: 'owlTufts'
  },
  {
    id: 'caramelBow',
    base: '#f28c38', hex: 0xf28c38, accent: '#ffffff', cheek: '#ff6399',
    eyeColor: '#7a1f4b', eyeRim: '#ff4d94', style: 'caramelBow', topper: 'bowPuppy'
  },
  {
    id: 'pinkLamb',
    base: '#ff9ed2', hex: 0xff9ed2, accent: '#ff5cad', cheek: '#ff6ca8',
    eyeColor: '#85338f', eyeRim: '#e655a8', style: 'pinkLamb', topper: 'lambCurls'
  },
  {
    id: 'sakuraKitty',
    base: '#ffb8df', hex: 0xffb8df, accent: '#ff4ca6', cheek: '#ff6ba6',
    eyeColor: '#7a1c82', eyeRim: '#eb3d94', style: 'sakuraKitty', topper: 'kittyBlossom'
  },
  {
    id: 'glassesBerry',
    base: '#ffa8d4', hex: 0xffa8d4, accent: '#36c97a', cheek: '#ff66a3',
    eyeColor: '#1f945c', eyeRim: '#ff4c98', style: 'glassesBerry', topper: 'glassesSprout'
  },
  {
    id: 'starOcto',
    base: '#2ca4f5', hex: 0x2ca4f5, accent: '#ff5eb5', cheek: '#6bd0ff',
    eyeColor: '#363b96', eyeRim: '#8a73ff', style: 'starOcto', topper: 'octoSwirls'
  },
  {
    id: 'lilacCat',
    base: '#c496f2', hex: 0xc496f2, accent: '#ff63b8', cheek: '#ff78c4',
    eyeColor: '#5c208c', eyeRim: '#c94cff', style: 'lilacCat', topper: 'spikyTufts'
  },
  {
    id: 'milkCub',
    base: '#fff4eb', hex: 0xfff4eb, accent: '#b33c2e', cheek: '#ff80ab',
    eyeColor: '#692a1e', eyeRim: '#cc5252', style: 'milkCub', topper: 'hoodCub'
  },
  {
    id: 'strawberryBunny',
    base: '#ff75aa', hex: 0xff75aa, accent: '#39c770', cheek: '#ff4d88',
    eyeColor: '#5e173d', eyeRim: '#f5367c', style: 'strawberryBunny', topper: 'bunnyLeaf'
  },
  {
    id: 'sunnyChick',
    base: '#ffd84d', hex: 0xffd84d, accent: '#ff7347', cheek: '#ff7a7a',
    eyeColor: '#5c3116', eyeRim: '#eb8800', style: 'sunnyChick', topper: 'chickTuft'
  },
  {
    id: 'unicornDream',
    base: '#d9b5ff', hex: 0xd9b5ff, accent: '#ffcb2e', cheek: '#ff78bd',
    eyeColor: '#5b2899', eyeRim: '#b366ff', style: 'unicornDream', topper: 'unicornHorn'
  },
  {
    id: 'mintAxolotl',
    base: '#7ae8b8', hex: 0x7ae8b8, accent: '#ff5ca8', cheek: '#ff73b8',
    eyeColor: '#1a4d3d', eyeRim: '#22a6e6', style: 'mintAxolotl', topper: 'axolotlGills'
  },
  {
    id: 'cottonBear',
    base: '#8fd4ff', hex: 0x8fd4ff, accent: '#ff5eb5', cheek: '#ff78b8',
    eyeColor: '#2d3b7a', eyeRim: '#4a8ef5', style: 'cottonBear', topper: 'teddyCrown'
  }
];

// Curated row-by-row layout so every row looks balanced, colorful, and directly showcases clickers0.jpg!
const GRID_CHAR_IDS = [
  ['candyPup', 'mintOwl', 'caramelBow', 'sunnyChick', 'candyPup'],
  ['mintOwl', 'mintAxolotl', 'sunnyChick', 'candyPup', 'caramelBow'],
  ['pinkLamb', 'sakuraKitty', 'strawberryBunny', 'pinkLamb', 'glassesBerry'],
  ['starOcto', 'cottonBear', 'milkCub', 'starOcto', 'mintOwl'],
  ['lilacCat', 'unicornDream', 'pinkLamb', 'lilacCat', 'sakuraKitty'],
  ['caramelBow', 'candyPup', 'strawberryBunny', 'sunnyChick', 'milkCub'],
  ['glassesBerry', 'sakuraKitty', 'unicornDream', 'cottonBear', 'strawberryBunny']
];

// Physical Keyboard Layout mapping across the 7 rows x 5 columns (35 keys!)
const KEYBOARD_GRID_CODES = [
  ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'],
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB'],
  ['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'],
  ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
  ['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']
];

const PARTICLE_PALETTE = [0xff6fb5, 0xffe066, 0x7dd3fc, 0x86efac, 0xd8b4fe, 0xffffff];

// Dedicated separate procedural graphics asset pool names (modeled on wormhole0/js/warp_origin_pool.js)
export const PROCEDURAL_KEYCAP_POOL_NAMES = Object.fromEntries(
  CHARACTER_CATALOG.map((c) => [c.id, `clicker_procedural_keycap_${c.id}`])
);
export const PROCEDURAL_SWITCH_POOL_NAMES = Object.fromEntries(
  ROW_THEMES.map((_, row) => [`row_${row}`, `clicker_procedural_switch_row_${row}`])
);
export const PROCEDURAL_PARTICLE_POOL_NAMES = {
  heart: 'clicker_procedural_particle_heart',
  star: 'clicker_procedural_particle_star'
};
export const PROCEDURAL_ENVIRONMENT_POOL_NAMES = {
  sky_dome: 'clicker_procedural_env_sky_dome',
  desk_mat: 'clicker_procedural_env_desk_mat',
  pastel_cloud: 'clicker_procedural_env_pastel_cloud',
  ambient_stars: 'clicker_procedural_env_ambient_stars'
};
export const PROCEDURAL_CASE_POOL_NAME = 'clicker_procedural_case_pink_silicone';
export const PROCEDURAL_XR_POOL_NAMES = {
  xr_ray: 'clicker_procedural_xr_ray',
  xr_reticle: 'clicker_procedural_xr_reticle'
};

// ---------------------------------------------------------------------------
// Static Procedural Texture Deduplication (modeled on wormhole0/js/warp_origin_pool.js)
// ---------------------------------------------------------------------------
export function deduplicateStaticProceduralTextures(rootObj, assetKind, sharedTexMap) {
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
        const key = sharedTexMap.has(tex.name) ? tex.name : `${assetKind}::${tex.name}`;
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

function markSharedAsset(asset, name = '') {
  if (!asset) return asset;
  if (name && !asset.name) asset.name = name;
  asset.userData = asset.userData || {};
  asset.userData._isSharedAsset = true;
  return asset;
}

// ---------------------------------------------------------------------------
// Universal Three.js Procedural MeshPool (modeled on wormhole0/js/object_pool.js)
// ---------------------------------------------------------------------------
export class ClickerMeshPool {
  constructor(parentContainer, geometry, material, initialSize = 8, createFn = null, options = {}) {
    this.parent = parentContainer;
    this.geometry = geometry;
    this.material = material;
    this.initialSize = Math.max(0, Number(initialSize) || 0);
    this.createFn = createFn;
    this.poolName = options.poolName || 'clicker_mesh_pool';
    this.poolCategory = options.poolCategory || 'procedural_graphics';
    this.poolKey = options.poolKey || this.poolName;
    this.pool = [];
    this.active = new Set();
    this._disposed = false;

    // 1. Pre-allocate during load time
    for (let i = 0; i < this.initialSize; i++) {
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

    // Inactive objects in the pool held at -1000 with visibility false (zero scene graph thrashing!)
    mesh.position.set(0, -1000, 0);
    mesh.visible = false;
    mesh.frustumCulled = true;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;

    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = true;
    mesh.userData.isActive = false;
    mesh.userData.movementActive = false;
    mesh.userData.physicsActive = false;
    mesh.userData.fromPool = true;
    mesh.userData.isProceduralGraphic = true;
    mesh.userData.poolName = this.poolName;
    mesh.userData.poolCategory = this.poolCategory;
    mesh.userData.poolKey = this.poolKey;

    if (this.parent && mesh.parent !== this.parent) {
      this.parent.add(mesh);
    }

    this.pool.push(mesh);
    return mesh;
  }

  spawn(position = null, quaternion = null, scale = null, targetParent = null) {
    const mesh = this.pool.length > 0 ? this.pool.pop() : this.createObject();

    if (targetParent && mesh.parent !== targetParent) {
      targetParent.add(mesh);
    } else if (!targetParent && this.parent && mesh.parent !== this.parent) {
      this.parent.add(mesh);
    }

    mesh.matrixAutoUpdate = true;

    if (position) {
      if (position.isVector3) {
        mesh.position.copy(position);
      } else {
        mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
      }
    } else {
      mesh.position.set(0, 0, 0);
    }

    if (quaternion) {
      mesh.quaternion.copy(quaternion);
    } else {
      mesh.quaternion.identity();
    }

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

    mesh.visible = true;
    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = false;
    mesh.userData.isActive = true;
    mesh.userData.movementActive = true;
    mesh.userData.physicsActive = true;
    mesh.userData.fromPool = true;
    mesh.userData.poolName = this.poolName;
    mesh.userData.poolCategory = this.poolCategory;
    mesh.userData.poolKey = this.poolKey;
    this.active.add(mesh);
    return mesh;
  }

  despawn(mesh) {
    if (!mesh) return;

    if (this.parent && mesh.parent !== this.parent) {
      this.parent.add(mesh);
    }

    mesh.position.set(0, -1000, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.visible = false;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;

    mesh.userData = mesh.userData || {};
    mesh.userData.inPool = true;
    mesh.userData.isActive = false;
    mesh.userData.movementActive = false;
    mesh.userData.physicsActive = false;

    this.active.delete(mesh);
    if (!this.pool.includes(mesh)) {
      this.pool.push(mesh);
    }
  }

  despawnAll() {
    for (const mesh of Array.from(this.active)) {
      this.despawn(mesh);
    }
    this.active.clear();
  }

  getStats() {
    return {
      poolName: this.poolName,
      poolCategory: this.poolCategory,
      poolKey: this.poolKey,
      initialSize: this.initialSize,
      available: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size
    };
  }

  dispose() {
    this._disposed = true;
    this.despawnAll();

    const geometriesToDispose = new Set();
    const materialsToDispose = new Set();

    const collectDisposables = (node) => {
      if (!node) return;
      if (node.geometry && !(node.geometry.userData && node.geometry.userData._isSharedAsset) && typeof node.geometry.dispose === 'function') {
        geometriesToDispose.add(node.geometry);
      }
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach((m) => {
            if (m && !(m.userData && m.userData._isSharedAsset) && typeof m.dispose === 'function') {
              materialsToDispose.add(m);
            }
          });
        } else if (!(node.material.userData && node.material.userData._isSharedAsset) && typeof node.material.dispose === 'function') {
          materialsToDispose.add(node.material);
        }
      }
    };

    for (const mesh of this.pool) {
      if (!mesh) continue;
      if (typeof mesh.traverse === 'function') {
        mesh.traverse(collectDisposables);
      } else {
        collectDisposables(mesh);
      }
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    }

    for (const geom of geometriesToDispose) {
      try { geom.dispose(); } catch (_) {}
    }
    for (const mat of materialsToDispose) {
      try { mat.dispose(); } catch (_) {}
    }
    this.pool = [];
  }
}

// ---------------------------------------------------------------------------
// Dedicated Procedural Graphics Asset Pool (modeled on WarpOriginProceduralEnemyPool)
// ---------------------------------------------------------------------------
export class ClickerProceduralAssetPool extends ClickerMeshPool {
  constructor(parentContainer, assetKind, options = {}) {
    const initialSize = Math.max(1, Number(options.initialSize) || 1);
    const poolName = options.poolName || `clicker_procedural_${assetKind}`;
    const poolCategory = options.poolCategory || 'procedural_asset';
    const ownsSharedTextures = !options.sharedTextures;
    const sharedTextures = options.sharedTextures || new Map();
    const builderFn = options.createAssetFn;
    const resetFn = typeof options.resetAssetFn === 'function' ? options.resetAssetFn : null;

    super(
      parentContainer,
      null,
      null,
      initialSize,
      () => {
        const obj = typeof builderFn === 'function'
          ? builderFn(sharedTextures)
          : new THREE.Group();
        if (obj) {
          deduplicateStaticProceduralTextures(obj, assetKind, sharedTextures);
          obj.userData = obj.userData || {};
          obj.userData.isProceduralAssetGraphic = true;
          obj.userData.fromProceduralAssetPool = true;
          obj.userData.proceduralAssetKind = assetKind;
          obj.userData.proceduralPoolName = poolName;
          obj.userData.poolCategory = poolCategory;
          obj.userData.poolKey = assetKind;
          if (resetFn) resetFn(obj);
        }
        return obj;
      },
      { poolName, poolCategory, poolKey: assetKind }
    );

    this.assetKind = assetKind;
    this.defaultScale = options.defaultScale !== undefined ? options.defaultScale : 1.0;
    this.isProceduralAssetPool = true;
    this.isDedicatedAssetTypePool = true;
    this._sharedProceduralTextures = sharedTextures;
    this._ownsSharedTextures = ownsSharedTextures;
    this._resetAssetFn = resetFn;
  }

  spawn(position = null, quaternion = null, scale = null, targetParent = null) {
    const resolvedScale = (scale !== null && scale !== undefined) ? scale : this.defaultScale;
    const obj = super.spawn(position, quaternion, resolvedScale, targetParent);
    if (obj) {
      if (this._resetAssetFn) this._resetAssetFn(obj);
      obj.userData.fromProceduralAssetPool = true;
      obj.userData.isProceduralAssetGraphic = true;
      obj.userData.proceduralAssetKind = this.assetKind;
      obj.userData.proceduralPoolName = this.poolName;
    }
    return obj;
  }

  despawn(obj) {
    if (!obj) return;
    if (this._resetAssetFn) this._resetAssetFn(obj);
    super.despawn(obj);
  }

  dispose() {
    if (this._ownsSharedTextures && this._sharedProceduralTextures) {
      for (const tex of this._sharedProceduralTextures.values()) {
        try { tex.dispose(); } catch (_) {}
      }
      this._sharedProceduralTextures.clear();
    }
    super.dispose();
  }
}

// ---------------------------------------------------------------------------
// Procedural Texture, Shape & Geometry Builders (used by Shared Asset Registry)
// ---------------------------------------------------------------------------
function drawStar(ctx, cx, cy, outerR, innerR, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx, cx, cy, size, fill) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size * 0.9, -size * 0.35, -size * 0.55, -size * 0.95, 0, -size * 0.42);
  ctx.bezierCurveTo(size * 0.55, -size * 0.95, size * 0.9, -size * 0.35, 0, size * 0.35);
  ctx.fill();
  ctx.restore();
}

function drawFlower(ctx, cx, cy, r, petalCol, centerCol) {
  ctx.fillStyle = petalCol;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.65, cy + Math.sin(a) * r * 0.65, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centerCol;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
}

function createStudioEnvironmentMap(renderer) {
  const envCanvas = document.createElement('canvas');
  envCanvas.width = 512;
  envCanvas.height = 256;
  const ectx = envCanvas.getContext('2d');
  const eg = ectx.createLinearGradient(0, 0, 0, 256);
  eg.addColorStop(0.0, '#d8c2ff');
  eg.addColorStop(0.35, '#f0d9ff');
  eg.addColorStop(0.68, '#b8a8e8');
  eg.addColorStop(1.0, '#6d549e');
  ectx.fillStyle = eg;
  ectx.fillRect(0, 0, 512, 256);

  ectx.fillStyle = '#ffffff';
  ectx.fillRect(56, 26, 130, 50);
  ectx.fillRect(320, 34, 130, 52);

  const envTex = new THREE.CanvasTexture(envCanvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();
  pmrem.dispose();
  return markSharedAsset(envMap, 'studio_env_pmrem');
}

function createPastelDeskTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
  g.addColorStop(0, '#dfd0ff');
  g.addColorStop(0.55, '#cbb6f7');
  g.addColorStop(1, '#a991e6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Cute soft polka-dot pastel pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let y = 24; y < 512; y += 48) {
    for (let x = 24; x < 512; x += 48) {
      const off = ((y / 48) % 2) * 24;
      ctx.beginPath();
      ctx.arc((x + off) % 512, y, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return markSharedAsset(tex, 'pastel_desk_mat');
}

function createSparkleTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 58);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,190,235,0.65)');
  g.addColorStop(1.0, 'rgba(255,190,235,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 12);
  ctx.quadraticCurveTo(68, 60, 116, 64);
  ctx.quadraticCurveTo(68, 68, 64, 116);
  ctx.quadraticCurveTo(60, 68, 12, 64);
  ctx.quadraticCurveTo(60, 60, 64, 12);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return markSharedAsset(tex, 'sparkle_4pt');
}

function createKawaiiFaceTexture(def) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');

  // Soft glossy pastel base with delicate lighter cheek-center glow
  const bgGrad = ctx.createRadialGradient(S * 0.5, S * 0.45, 30, S * 0.5, S * 0.5, S * 0.62);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.18, def.base);
  bgGrad.addColorStop(1, def.base);
  ctx.fillStyle = def.base;
  ctx.fillRect(0, 0, S, S);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, S, S);
  ctx.globalAlpha = 1;

  // Character-specific painted markings (modeled directly on clickers0.jpg!)
  if (def.style === 'candyPup') {
    ctx.fillStyle = '#fff9f2';
    ctx.beginPath();
    ctx.ellipse(256, 295, 165, 138, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(162, 118, 22, 0, Math.PI * 2);
    ctx.arc(350, 118, 22, 0, Math.PI * 2);
    ctx.fill();
    [
      [108, 355, 22, '#38bdf8'], [138, 396, 18, '#fde047'], [98, 405, 14, '#fb7185'],
      [404, 355, 22, '#86efac'], [376, 396, 18, '#fde047'], [414, 405, 14, '#f472b6']
    ].forEach(([x, y, r, col]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (def.style === 'mintOwl') {
    ctx.fillStyle = '#e4fbfc';
    ctx.beginPath();
    ctx.ellipse(256, 330, 150, 112, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#259e83';
    [
      [120, 140, -0.5], [154, 116, -0.2], [392, 140, 0.5], [358, 116, 0.2],
      [104, 330, -0.7], [408, 330, 0.7]
    ].forEach(([lx, ly, rot]) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    drawFlower(ctx, 256, 112, 22, '#ff9ec9', '#ffe066');
    drawFlower(ctx, 112, 376, 18, '#ff9ec9', '#fff3a1');
    drawFlower(ctx, 400, 376, 18, '#ff9ec9', '#fff3a1');
  } else if (def.style === 'caramelBow') {
    ctx.fillStyle = '#fff5e8';
    ctx.beginPath();
    ctx.ellipse(256, 326, 142, 108, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9c4e24';
    [
      [120, 122, 14], [156, 104, 11], [198, 128, 9], [314, 128, 9], [356, 104, 11], [392, 122, 14],
      [104, 214, 10], [408, 214, 10], [256, 110, 12]
    ].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d98cb3';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(212, 404, 44, 28, -0.18, 0, Math.PI * 2);
    ctx.ellipse(300, 404, 44, 28, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 404, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (def.style === 'pinkLamb') {
    ctx.fillStyle = '#ffe8f5';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(136 + i * 60, 118 + (i % 2) * 10, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#ff94cb';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 126, 22, 0.2, Math.PI * 1.7);
    ctx.stroke();
  } else if (def.style === 'sakuraKitty') {
    drawFlower(ctx, 118, 378, 26, '#ffffff', '#ff85c0');
    drawFlower(ctx, 394, 378, 26, '#ffffff', '#ff85c0');
    drawFlower(ctx, 256, 108, 20, '#ffffff', '#ffe066');
    ctx.strokeStyle = '#d96ba8';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    [[72, 276, 126, 286], [68, 314, 124, 312], [440, 276, 386, 286], [444, 314, 388, 312]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  } else if (def.style === 'glassesBerry') {
    drawHeart(ctx, 256, 116, 26, '#ff6ba8');
    ctx.fillStyle = '#62d695';
    [154, 206, 256, 306, 358].forEach((cx) => {
      ctx.beginPath();
      ctx.arc(cx, 418, 22, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (def.style === 'starOcto') {
    ctx.fillStyle = '#9ee4ff';
    ctx.beginPath();
    ctx.ellipse(256, 122, 34, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    drawHeart(ctx, 256, 124, 24, '#ff7cc3');
    ctx.strokeStyle = '#e0f7ff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    [122, 390].forEach((sx, idx) => {
      ctx.beginPath();
      ctx.arc(sx, 378, 30, idx === 0 ? 0.2 : Math.PI - 0.2, idx === 0 ? Math.PI * 1.85 : Math.PI * 2.8);
      ctx.stroke();
    });
    drawStar(ctx, 130, 132, 18, 8, 4, '#ffffff');
    drawStar(ctx, 382, 132, 18, 8, 4, '#ffffff');
  } else if (def.style === 'lilacCat') {
    drawStar(ctx, 256, 116, 28, 12, 5, '#ffe066');
    drawHeart(ctx, 118, 372, 24, '#ff85c8');
    drawHeart(ctx, 394, 372, 24, '#ff85c8');
    drawStar(ctx, 128, 146, 16, 7, 4, '#ffffff');
    drawStar(ctx, 384, 146, 16, 7, 4, '#ffffff');
  } else if (def.style === 'milkCub') {
    ctx.fillStyle = '#b84c3e';
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(512, 0);
    ctx.lineTo(512, 210);
    ctx.quadraticCurveTo(380, 175, 256, 125);
    ctx.closePath();
    ctx.fill();
    drawStar(ctx, 382, 92, 22, 9, 4, '#ffe680');
    drawStar(ctx, 124, 124, 18, 8, 4, '#ff9ec9');
  } else if (def.style === 'strawberryBunny') {
    ctx.fillStyle = '#56d687';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(60 + i * 95, 0);
      ctx.lineTo(110 + i * 95, 92);
      ctx.lineTo(160 + i * 95, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe588';
    [[105, 150], [407, 150], [92, 365], [420, 365], [160, 412], [352, 412]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 8, 13, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (def.style === 'sunnyChick') {
    drawFlower(ctx, 114, 132, 22, '#ffffff', '#ff8866');
    drawFlower(ctx, 398, 132, 22, '#ffffff', '#ff8866');
  } else if (def.style === 'unicornDream') {
    const rainbow = ['#ff7cc3', '#ffe066', '#86efac', '#7dd3fc'];
    rainbow.forEach((col, i) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(256, 175, 155 - i * 20, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
    });
    drawStar(ctx, 116, 376, 20, 9, 4, '#ffe066');
    drawStar(ctx, 396, 376, 20, 9, 4, '#ffe066');
  } else if (def.style === 'mintAxolotl') {
    ctx.fillStyle = '#e8fff4';
    ctx.beginPath();
    ctx.ellipse(256, 355, 155, 92, 0, 0, Math.PI * 2);
    ctx.fill();
    [[112, 132, 16], [142, 108, 10], [398, 132, 16], [368, 108, 10]].forEach(([x, y, r]) => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (def.style === 'cottonBear') {
    const ccg = ctx.createLinearGradient(0, 0, S, S);
    ccg.addColorStop(0, '#ffb8e0');
    ccg.addColorStop(0.5, '#d8c7ff');
    ccg.addColorStop(1, '#9be5ff');
    ctx.fillStyle = ccg;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#fff8fc';
    ctx.beginPath();
    ctx.ellipse(256, 344, 88, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    drawHeart(ctx, 124, 126, 20, '#ffffff');
    drawHeart(ctx, 388, 126, 20, '#ffffff');
  }

  // ---- HUGE SPARKLY KAWAII ANIME EYES ----
  const eyeY = 252;
  const drawKawaiiEye = (ex, ey, isLeft) => {
    ctx.fillStyle = def.eyeRim;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 50, 58, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = def.eyeColor;
    ctx.beginPath();
    ctx.ellipse(ex, ey + 2, 40, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(ex, ey + 24, 24, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    if (def.style === 'starOcto' || def.style === 'unicornDream') {
      drawStar(ctx, ex - 10, ey - 14, 22, 9, 4, '#ffffff');
    } else if (def.style === 'strawberryBunny' || def.style === 'cottonBear') {
      drawHeart(ctx, ex - 10, ey - 8, 20, '#ffffff');
    } else {
      ctx.beginPath();
      ctx.ellipse(ex - 13, ey - 17, 17, 20, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 16, ey + 15, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = def.eyeColor;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ex, ey, 52, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();

    const side = isLeft ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(ex + side * 44, ey - 26);
    ctx.quadraticCurveTo(ex + side * 62, ey - 36, ex + side * 66, ey - 48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex + side * 49, ey - 10);
    ctx.quadraticCurveTo(ex + side * 64, ey - 14, ex + side * 68, ey - 24);
    ctx.stroke();
  };

  drawKawaiiEye(164, eyeY, true);
  drawKawaiiEye(348, eyeY, false);

  if (def.style === 'glassesBerry') {
    ctx.strokeStyle = '#ff63a5';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(164, eyeY, 64, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(348, eyeY, 64, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(228, eyeY);
    ctx.quadraticCurveTo(256, eyeY - 12, 284, eyeY);
    ctx.stroke();
  }

  // Soft Rosy Kawaii Oval Blush Cheeks
  ctx.fillStyle = def.cheek;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.ellipse(98, eyeY + 64, 38, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(414, eyeY + 64, 38, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  [[86, eyeY + 58, 96, eyeY + 52], [404, eyeY + 58, 414, eyeY + 52]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  // ---- TINY CUTE CARTOON NOSE & SMILE ----
  if (def.style === 'mintOwl' || def.style === 'sunnyChick') {
    ctx.fillStyle = def.style === 'mintOwl' ? '#ff6ba8' : '#ff8c42';
    ctx.strokeStyle = def.eyeColor;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(234, 294);
    ctx.lineTo(278, 294);
    ctx.lineTo(256, 330);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (def.style === 'mintAxolotl') {
    ctx.strokeStyle = def.eyeColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(256, 304, 46, 0.18, Math.PI - 0.18);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ff639e';
    ctx.beginPath();
    ctx.ellipse(256, 296, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = def.eyeColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(234, 322, 22, 0.12, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(278, 322, 22, 0.15, Math.PI - 0.12);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return markSharedAsset(tex, `kawaii_face_${def.id}`);
}

function createRoundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function createPuffyKeycapGeometry() {
  const geo = new THREE.BoxGeometry(0.92, 0.50, 0.92, 16, 10, 16);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / 0.46;
    const ny = v.y / 0.25;
    const nz = v.z / 0.46;

    const rSq = nx * nx + nz * nz;
    const maxEdge = Math.max(Math.abs(nx), Math.abs(nz));
    let sx = v.x;
    let sz = v.z;
    if (maxEdge > 0.001) {
      const cornerRound = Math.pow(Math.pow(Math.abs(nx), 4.2) + Math.pow(Math.abs(nz), 4.2), 1 / 4.2);
      const factor = maxEdge / Math.max(cornerRound, 0.001);
      sx *= factor;
      sz *= factor;
    }

    const taper = 1.0 - Math.max(0, ny) * 0.095;
    sx *= taper;
    sz *= taper;

    let sy = v.y;
    if (ny > 0) {
      const radial = Math.min(1, Math.sqrt(rSq) * 0.72);
      const dome = Math.cos(radial * Math.PI * 0.5) * 0.085 * ny;
      const edgeRoll = (1 - Math.pow(maxEdge, 3.2)) * 0.03 * ny;
      sy += dome + edgeRoll;
    } else {
      const skirt = 1.0 - Math.abs(ny) * 0.03;
      sx *= skirt;
      sz *= skirt;
    }

    pos.setXYZ(i, sx, sy, sz);
  }
  geo.computeVertexNormals();
  return markSharedAsset(geo, 'puffy_keycap_geo');
}

function createDomedFaceCapGeometry() {
  const geo = new THREE.PlaneGeometry(0.84, 0.84, 14, 14);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / 0.42;
    const nz = z / 0.42;
    const maxEdge = Math.max(Math.abs(nx), Math.abs(nz));
    let sx = x;
    let sz = z;
    if (maxEdge > 0.001) {
      const cornerRound = Math.pow(Math.pow(Math.abs(nx), 4.2) + Math.pow(Math.abs(nz), 4.2), 1 / 4.2);
      const factor = maxEdge / Math.max(cornerRound, 0.001);
      sx *= factor;
      sz *= factor;
    }
    const rSq = (sx / 0.46) * (sx / 0.46) + (sz / 0.46) * (sz / 0.46);
    const radial = Math.min(1, Math.sqrt(rSq) * 0.72);
    const dome = Math.cos(radial * Math.PI * 0.5) * 0.085;
    const edgeRoll = (1 - Math.pow(maxEdge, 3.2)) * 0.03;
    pos.setXYZ(i, sx * 0.905, 0.258 + dome + edgeRoll, sz * 0.905);
  }
  geo.computeVertexNormals();
  return markSharedAsset(geo, 'domed_face_cap_geo');
}

function createHeart3DGeometry(scale = 0.15, name = '') {
  const hs = new THREE.Shape();
  hs.moveTo(0, -0.35 * scale);
  hs.bezierCurveTo(-0.9 * scale, 0.25 * scale, -0.55 * scale, 0.9 * scale, 0, 0.42 * scale);
  hs.bezierCurveTo(0.55 * scale, 0.9 * scale, 0.9 * scale, 0.25 * scale, 0, -0.35 * scale);
  const g = new THREE.ExtrudeGeometry(hs, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3
  });
  g.rotateX(-Math.PI / 2);
  g.center();
  return markSharedAsset(g, name || `heart_3d_${scale}`);
}

// ---------------------------------------------------------------------------
// Kawaii Clicker Game Object Pool (modeled on WarpOriginObjectPool!)
// Coordinates strictly separate dedicated procedural graphics asset pools:
//  - 14 dedicated per-character procedural keycap pools
//  - 7 dedicated per-row procedural mechanical switch housing pools
//  - Dedicated pink silicone case pool (with embossed hearts & swinging charm)
//  - Dedicated environment pools (sky dome, desk mat, floating clouds, ambient stars)
//  - 2 dedicated burst particle pools (3D hearts & 3D stars — zero GC on click!)
//  - Dedicated XR controller ray & reticle pools
// ---------------------------------------------------------------------------
export class ClickerGameObjectPool {
  constructor(scene, containers = {}, options = {}) {
    this._disposed = false;
    this.scene = scene;
    this.renderer = options.renderer || null;
    this.environmentGroup = containers.environmentGroup || scene;
    this.boardAssembly = containers.boardAssembly || scene;
    this.clickersContainer = containers.clickersContainer || scene;
    this.cameraRig = containers.cameraRig || scene;
    this.options = options;

    this.innerW = NUM_COLS * KEY_PITCH + 0.28;
    this.innerD = NUM_ROWS * KEY_PITCH + 0.28;
    this.wallThickness = 0.56;
    this.outerW = this.innerW + this.wallThickness * 2;
    this.outerD = this.innerD + this.wallThickness * 2;

    // Shared deduplicated procedural assets (geometries, materials, textures)
    this.sharedGeometries = new Map();
    this.sharedMaterials = new Map();
    this.sharedTextures = new Map();
    this.charById = new Map(CHARACTER_CATALOG.map((c) => [c.id, c]));

    // Strictly separate dedicated procedural asset pool registries
    this.hasSeparateProceduralPools = true;
    this.environmentPools = new Map();
    this.siliconeCasePools = new Map();
    this.proceduralSwitchPools = new Map();
    this.proceduralKeycapPools = new Map();
    this.proceduralParticlePools = new Map();
    this.proceduralXRPools = new Map();

    // Build shared procedural assets first, then pre-allocate every pool at load time
    this.initSharedProceduralAssets();
    this.initEnvironmentPools();
    this.initSiliconeCasePool();
    this.initProceduralSwitchPools();
    this.initProceduralKeycapPools();
    this.initProceduralParticlePools();
    this.initProceduralXRPools();

    // Expose structured pool map mirroring WarpOriginObjectPool.assetPools
    this.assetPools = {
      environment: this.environmentPools,
      siliconeCase: this.siliconeCasePools,
      switches: this.proceduralSwitchPools,
      keycaps: this.proceduralKeycapPools,
      particles: this.proceduralParticlePools,
      xr: this.proceduralXRPools
    };

    const stats = this.getPoolStats();
    console.log(
      `[ClickerGameObjectPool] Pre-allocated procedural graphics asset pools (` +
      `keycapPools=${Object.keys(stats.keycaps).length}, switchPools=${Object.keys(stats.switches).length}, ` +
      `particlePools=${Object.keys(stats.particles).length}, envPools=${Object.keys(stats.environment).length}, ` +
      `totalPreAllocated=${stats.summary.totalInstances}, sharedTextures=${stats.summary.sharedTextures})`
    );
  }

  getSharedGeometry(key, factoryFn) {
    if (this.sharedGeometries.has(key)) return this.sharedGeometries.get(key);
    const geo = markSharedAsset(factoryFn(), key);
    this.sharedGeometries.set(key, geo);
    return geo;
  }

  getSharedMaterial(key, factoryFn) {
    if (this.sharedMaterials.has(key)) return this.sharedMaterials.get(key);
    const mat = markSharedAsset(factoryFn(), key);
    this.sharedMaterials.set(key, mat);
    return mat;
  }

  getSharedTexture(key, factoryFn) {
    if (this.sharedTextures.has(key)) return this.sharedTextures.get(key);
    const tex = markSharedAsset(factoryFn(), key);
    this.sharedTextures.set(key, tex);
    return tex;
  }

  initSharedProceduralAssets() {
    // 1. Procedural Studio Softbox Environment Map
    if (this.renderer) {
      this.studioEnvMap = this.getSharedTexture('studio_env_pmrem', () => createStudioEnvironmentMap(this.renderer));
    } else {
      this.studioEnvMap = null;
    }

    // 2. Shared Procedural Textures (deduplicated across all pools)
    this.getSharedTexture('pastel_desk_mat', () => createPastelDeskTexture());
    this.getSharedTexture('sparkle_4pt', () => createSparkleTexture());
    for (const def of CHARACTER_CATALOG) {
      this.getSharedTexture(`kawaii_face_${def.id}`, () => createKawaiiFaceTexture(def));
    }

    // 3. Shared Sculpted Keycap, Switch, Silicone Case, Environment & Particle Geometries
    this.getSharedGeometry('puffy_keycap', () => createPuffyKeycapGeometry());
    this.getSharedGeometry('domed_face_cap', () => createDomedFaceCapGeometry());
    this.getSharedGeometry('switch_base', () => {
      const geo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.96, 0.96, 0.14), {
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.035,
        bevelSegments: 3
      });
      geo.rotateX(-Math.PI / 2);
      geo.center();
      return geo;
    });
    this.getSharedGeometry('switch_crystal_collar', () => new THREE.BoxGeometry(0.68, 0.22, 0.68));
    this.getSharedGeometry('puzzle_tab', () => new THREE.BoxGeometry(0.11, 0.16, 0.20));
    this.getSharedGeometry('stem_arm_a', () => new THREE.BoxGeometry(0.28, 0.30, 0.085));
    this.getSharedGeometry('stem_arm_b', () => new THREE.BoxGeometry(0.085, 0.30, 0.28));
    this.getSharedGeometry('led_glow_plane', () => new THREE.PlaneGeometry(0.76, 0.76));
    this.getSharedGeometry('hit_box', () => new THREE.BoxGeometry(1.04, 1.10, 1.04));

    this.getSharedGeometry('sky_dome', () => new THREE.SphereGeometry(62, 32, 24));
    this.getSharedGeometry('desk_mat', () => new THREE.CircleGeometry(24, 64));
    this.getSharedGeometry('cloud_puff_0.72', () => new THREE.SphereGeometry(0.72, 12, 10));
    this.getSharedGeometry('cloud_puff_0.95', () => new THREE.SphereGeometry(0.95, 12, 10));
    this.getSharedGeometry('cloud_puff_0.70', () => new THREE.SphereGeometry(0.70, 12, 10));
    this.getSharedGeometry('cloud_puff_0.65', () => new THREE.SphereGeometry(0.65, 12, 10));

    this.getSharedGeometry('case_tray_base', () => {
      const geo = new THREE.ExtrudeGeometry(createRoundedRectShape(this.outerW, this.outerD, 0.72), {
        depth: 0.36,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.10,
        bevelSegments: 5
      });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, -0.34, 0);
      return geo;
    });
    this.getSharedGeometry('case_bumper', () => {
      const bumperShape = createRoundedRectShape(this.outerW, this.outerD, 0.72);
      bumperShape.holes.push(createRoundedRectShape(this.innerW, this.innerD, 0.34));
      const geo = new THREE.ExtrudeGeometry(bumperShape, {
        depth: 0.62,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.12,
        bevelSegments: 6
      });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, -0.02, 0);
      return geo;
    });
    this.getSharedGeometry('case_well_floor', () => new THREE.PlaneGeometry(this.innerW + 0.08, this.innerD + 0.08));
    this.getSharedGeometry('case_mini_heart', () => createHeart3DGeometry(0.18, 'case_mini_heart'));
    this.getSharedGeometry('case_mini_bead', () => new THREE.SphereGeometry(0.085, 12, 10));
    this.getSharedGeometry('case_carry_loop', () => new THREE.TorusGeometry(0.36, 0.11, 12, 24, Math.PI * 1.4));
    this.getSharedGeometry('case_charm_ring', () => new THREE.TorusGeometry(0.14, 0.032, 10, 20));
    this.getSharedGeometry('case_charm_bead', () => new THREE.SphereGeometry(0.13, 14, 12));
    this.getSharedGeometry('case_big_heart_charm', () => createHeart3DGeometry(0.46, 'case_big_heart_charm'));

    this.getSharedGeometry('particle_heart', () => createHeart3DGeometry(0.24, 'particle_heart'));
    this.getSharedGeometry('particle_star', () => new THREE.OctahedronGeometry(0.085, 0));

    this.getSharedGeometry('xr_ray_line', () => new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -6)
    ]));
    this.getSharedGeometry('xr_reticle_sphere', () => new THREE.SphereGeometry(0.025, 10, 10));

    // 4. Shared Procedural Materials
    this.getSharedMaterial('clear_crystal', () => new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.05,
      transmission: 0.52,
      transparent: true,
      opacity: 0.78
    }));
    this.getSharedMaterial('white_gloss', () => new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.22,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18
    }));
    this.getSharedMaterial('gold_gloss', () => new THREE.MeshPhysicalMaterial({
      color: 0xffd74a,
      roughness: 0.20,
      metalness: 0.65,
      clearcoat: 0.8
    }));
    this.getSharedMaterial('invisible_hit', () => new THREE.MeshBasicMaterial({ visible: false }));
    this.getSharedMaterial('cloud_pastel', () => new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.0,
      emissive: 0xffe6f7,
      emissiveIntensity: 0.25
    }));
    this.getSharedMaterial('desk_mat', () => new THREE.MeshStandardMaterial({
      map: this.sharedTextures.get('pastel_desk_mat'),
      roughness: 0.72,
      metalness: 0.02
    }));
    this.getSharedMaterial('ambient_stars', () => new THREE.PointsMaterial({
      map: this.sharedTextures.get('sparkle_4pt'),
      size: 0.34,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    }));

    this.getSharedMaterial('pink_silicone_main', () => new THREE.MeshPhysicalMaterial({
      color: 0xff3b9d,
      roughness: 0.56,
      metalness: 0.0,
      sheen: 0.9,
      sheenRoughness: 0.52,
      sheenColor: new THREE.Color(0xffb8de),
      envMapIntensity: 0.42
    }));
    this.getSharedMaterial('pink_silicone_lip', () => new THREE.MeshPhysicalMaterial({
      color: 0xff52a8,
      roughness: 0.50,
      metalness: 0.0,
      sheen: 0.95,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(0xffd6ec),
      envMapIntensity: 0.45
    }));
    this.getSharedMaterial('pink_silicone_inner', () => new THREE.MeshStandardMaterial({
      color: 0xb81d6d,
      roughness: 0.68,
      metalness: 0.02
    }));
    this.getSharedMaterial('pink_silicone_emboss', () => new THREE.MeshPhysicalMaterial({
      color: 0xff94cb,
      roughness: 0.42,
      sheen: 0.85,
      sheenColor: new THREE.Color(0xffffff),
      envMapIntensity: 0.5
    }));
    this.getSharedMaterial('big_heart_charm', () => new THREE.MeshPhysicalMaterial({
      color: 0xff5ca8,
      roughness: 0.18,
      clearcoat: 0.9,
      emissive: 0xff4da6,
      emissiveIntensity: 0.16
    }));
    this.getSharedMaterial('xr_reticle', () => new THREE.MeshBasicMaterial({ color: 0xffe066 }));

    // Per-row shared housing, stem & silicone row-marker dot materials
    ROW_THEMES.forEach((rowTheme, row) => {
      this.getSharedMaterial(`row_housing_${row}`, () => new THREE.MeshPhysicalMaterial({
        color: rowTheme.housingHex,
        roughness: 0.32,
        metalness: 0.04,
        clearcoat: 0.35
      }));
      this.getSharedMaterial(`row_stem_${row}`, () => new THREE.MeshStandardMaterial({
        color: rowTheme.stemHex,
        emissive: new THREE.Color(rowTheme.stemHex),
        emissiveIntensity: 0.25,
        roughness: 0.25
      }));
      this.getSharedMaterial(`row_dot_${row}`, () => new THREE.MeshPhysicalMaterial({
        color: rowTheme.housingHex,
        roughness: 0.35,
        sheen: 0.6,
        emissive: new THREE.Color(rowTheme.ledHex),
        emissiveIntensity: 0.12
      }));
    });

    // Per-character shared face, accent & cheek materials
    CHARACTER_CATALOG.forEach((def) => {
      this.getSharedMaterial(`char_face_${def.id}`, () => new THREE.MeshPhysicalMaterial({
        map: this.sharedTextures.get(`kawaii_face_${def.id}`),
        roughness: 0.22,
        metalness: 0.0,
        clearcoat: 0.78,
        clearcoatRoughness: 0.16,
        envMapIntensity: 0.58
      }));
      this.getSharedMaterial(`char_accent_${def.id}`, () => new THREE.MeshPhysicalMaterial({
        color: def.accent,
        roughness: 0.24,
        clearcoat: 0.72,
        clearcoatRoughness: 0.2
      }));
      this.getSharedMaterial(`char_cheek_${def.id}`, () => new THREE.MeshPhysicalMaterial({
        color: def.cheek,
        roughness: 0.28,
        clearcoat: 0.65
      }));
    });
  }

  buildCharacter3DTopper(capPivot, def, capMat) {
    const accentMat = this.sharedMaterials.get(`char_accent_${def.id}`);
    const cheekMat = this.sharedMaterials.get(`char_cheek_${def.id}`);
    const whiteGlossMat = this.sharedMaterials.get('white_gloss');
    const goldGlossMat = this.sharedMaterials.get('gold_gloss');

    switch (def.topper) {
      case 'roundEarsBlueDots': {
        const earGeo = this.getSharedGeometry('topper_sphere_0.15_14_12', () => new THREE.SphereGeometry(0.15, 14, 12));
        const dotGeo = this.getSharedGeometry('topper_sphere_0.068_10_10', () => new THREE.SphereGeometry(0.068, 10, 10));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.scale.set(1.05, 0.78, 0.9);
          ear.position.set(s * 0.34, 0.30, -0.34);
          capPivot.add(ear);
          const dot = new THREE.Mesh(dotGeo, accentMat);
          dot.position.set(s * 0.34, 0.36, -0.29);
          capPivot.add(dot);
        });
        break;
      }
      case 'owlTufts': {
        const tuftGeo = this.getSharedGeometry('topper_cone_0.11_0.22_8', () => new THREE.ConeGeometry(0.11, 0.22, 8));
        const crownDotGeo = this.getSharedGeometry('topper_sphere_0.075_10_10', () => new THREE.SphereGeometry(0.075, 10, 10));
        [-1, 1].forEach((s) => {
          const tuft = new THREE.Mesh(tuftGeo, capMat);
          tuft.position.set(s * 0.31, 0.35, -0.32);
          tuft.rotation.z = -s * 0.38;
          capPivot.add(tuft);
        });
        const crownDot = new THREE.Mesh(crownDotGeo, cheekMat);
        crownDot.scale.set(1.2, 0.55, 1.2);
        crownDot.position.set(0, 0.35, -0.32);
        capPivot.add(crownDot);
        break;
      }
      case 'bowPuppy': {
        const earGeo = this.getSharedGeometry('topper_sphere_0.14_12_10', () => new THREE.SphereGeometry(0.14, 12, 10));
        const bowLoopGeo = this.getSharedGeometry('topper_sphere_0.08_10_10', () => new THREE.SphereGeometry(0.08, 10, 10));
        const bowKnotGeo = this.getSharedGeometry('topper_sphere_0.055_10_10', () => new THREE.SphereGeometry(0.055, 10, 10));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.scale.set(1.1, 0.7, 0.85);
          ear.position.set(s * 0.35, 0.30, -0.33);
          capPivot.add(ear);
          const bowLoop = new THREE.Mesh(bowLoopGeo, whiteGlossMat);
          bowLoop.scale.set(1.3, 0.65, 0.8);
          bowLoop.position.set(s * 0.09, 0.32, 0.33);
          capPivot.add(bowLoop);
        });
        const bowKnot = new THREE.Mesh(bowKnotGeo, whiteGlossMat);
        bowKnot.position.set(0, 0.33, 0.33);
        capPivot.add(bowKnot);
        break;
      }
      case 'lambCurls': {
        const puffGeo = this.getSharedGeometry('topper_sphere_0.115_12_10', () => new THREE.SphereGeometry(0.115, 12, 10));
        [-1, 1].forEach((s) => {
          [-0.22, 0.0, 0.22].forEach((zOff, idx) => {
            const puff = new THREE.Mesh(puffGeo, capMat);
            puff.position.set(s * 0.44, 0.14 + (idx === 1 ? 0.03 : 0), zOff);
            capPivot.add(puff);
          });
        });
        break;
      }
      case 'kittyBlossom': {
        const earGeo = this.getSharedGeometry('topper_cone_0.145_0.26_4', () => new THREE.ConeGeometry(0.145, 0.26, 4));
        const innerGeo = this.getSharedGeometry('topper_cone_0.08_0.16_4', () => new THREE.ConeGeometry(0.08, 0.16, 4));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.position.set(s * 0.29, 0.36, -0.30);
          ear.rotation.z = -s * 0.24;
          ear.rotation.y = Math.PI / 4;
          capPivot.add(ear);
          const inner = new THREE.Mesh(innerGeo, accentMat);
          inner.position.set(s * 0.29, 0.35, -0.26);
          inner.rotation.z = -s * 0.24;
          inner.rotation.y = Math.PI / 4;
          capPivot.add(inner);
        });
        break;
      }
      case 'glassesSprout': {
        const earGeo = this.getSharedGeometry('topper_sphere_0.125_12_10', () => new THREE.SphereGeometry(0.125, 12, 10));
        const leafGeo = this.getSharedGeometry('topper_sphere_0.075_10_8', () => new THREE.SphereGeometry(0.075, 10, 8));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.position.set(s * 0.33, 0.31, -0.32);
          capPivot.add(ear);
          const leaf = new THREE.Mesh(leafGeo, accentMat);
          leaf.scale.set(1.4, 0.5, 0.75);
          leaf.position.set(s * 0.08, 0.37, -0.30);
          leaf.rotation.z = -s * 0.35;
          capPivot.add(leaf);
        });
        break;
      }
      case 'octoSwirls': {
        const nubGeo = this.getSharedGeometry('topper_sphere_0.115_12_10', () => new THREE.SphereGeometry(0.115, 12, 10));
        const pearlGeo = this.getSharedGeometry('topper_sphere_0.075_12_10', () => new THREE.SphereGeometry(0.075, 12, 10));
        [-1, 1].forEach((s) => {
          const nub = new THREE.Mesh(nubGeo, capMat);
          nub.scale.set(1.15, 0.75, 1.15);
          nub.position.set(s * 0.39, 0.12, 0.34);
          capPivot.add(nub);
        });
        const pearl = new THREE.Mesh(pearlGeo, accentMat);
        pearl.scale.set(1.1, 0.65, 1.1);
        pearl.position.set(0, 0.36, -0.27);
        capPivot.add(pearl);
        break;
      }
      case 'spikyTufts': {
        const spikeGeo = this.getSharedGeometry('topper_cone_0.12_0.25_6', () => new THREE.ConeGeometry(0.12, 0.25, 6));
        const gemGeo = this.getSharedGeometry('topper_octa_0.075_0', () => new THREE.OctahedronGeometry(0.075, 0));
        [-1, 1].forEach((s) => {
          const spike = new THREE.Mesh(spikeGeo, capMat);
          spike.position.set(s * 0.30, 0.36, -0.30);
          spike.rotation.z = -s * 0.32;
          capPivot.add(spike);
        });
        const starGem = new THREE.Mesh(gemGeo, goldGlossMat);
        starGem.scale.set(1, 0.6, 1);
        starGem.position.set(0, 0.36, -0.29);
        capPivot.add(starGem);
        break;
      }
      case 'hoodCub': {
        const earGeo = this.getSharedGeometry('topper_sphere_0.13_12_10', () => new THREE.SphereGeometry(0.13, 12, 10));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, s > 0 ? accentMat : capMat);
          ear.position.set(s * 0.32, 0.32, -0.32);
          capPivot.add(ear);
        });
        break;
      }
      case 'bunnyLeaf': {
        const earGeo = this.getSharedGeometry('topper_capsule_0.078_0.22_6_10', () => new THREE.CapsuleGeometry(0.078, 0.22, 6, 10));
        const leafGeo = this.getSharedGeometry('topper_cone_0.10_0.14_5', () => new THREE.ConeGeometry(0.10, 0.14, 5));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.position.set(s * 0.22, 0.42, -0.30);
          ear.rotation.z = -s * 0.2;
          ear.rotation.x = -0.22;
          capPivot.add(ear);
        });
        const berryLeaf = new THREE.Mesh(leafGeo, accentMat);
        berryLeaf.position.set(0, 0.37, -0.30);
        capPivot.add(berryLeaf);
        break;
      }
      case 'chickTuft': {
        const tuftGeo = this.getSharedGeometry('topper_sphere_0.095_10_10', () => new THREE.SphereGeometry(0.095, 10, 10));
        const wingGeo = this.getSharedGeometry('topper_sphere_0.11_10_8', () => new THREE.SphereGeometry(0.11, 10, 8));
        const tuft = new THREE.Mesh(tuftGeo, capMat);
        tuft.scale.set(0.85, 1.35, 0.85);
        tuft.position.set(0, 0.38, -0.28);
        capPivot.add(tuft);
        [-1, 1].forEach((s) => {
          const wing = new THREE.Mesh(wingGeo, capMat);
          wing.scale.set(0.7, 0.65, 1.35);
          wing.position.set(s * 0.44, 0.14, 0.04);
          capPivot.add(wing);
        });
        break;
      }
      case 'unicornHorn': {
        const hornGeo = this.getSharedGeometry('topper_cone_0.09_0.34_12', () => new THREE.ConeGeometry(0.09, 0.34, 12));
        const earGeo = this.getSharedGeometry('topper_cone_0.10_0.20_6', () => new THREE.ConeGeometry(0.10, 0.20, 6));
        const horn = new THREE.Mesh(hornGeo, goldGlossMat);
        horn.position.set(0, 0.44, -0.28);
        horn.rotation.x = 0.22;
        capPivot.add(horn);
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.position.set(s * 0.30, 0.34, -0.31);
          ear.rotation.z = -s * 0.34;
          capPivot.add(ear);
        });
        break;
      }
      case 'axolotlGills': {
        const gillGeo = this.getSharedGeometry('topper_capsule_0.048_0.12_6_8', () => new THREE.CapsuleGeometry(0.048, 0.12, 6, 8));
        [-1, 1].forEach((s) => {
          [-0.14, 0.04, 0.20].forEach((zOff, i) => {
            const gill = new THREE.Mesh(gillGeo, accentMat);
            gill.position.set(s * 0.46, 0.18 + (i === 1 ? 0.04 : 0), zOff - 0.04);
            gill.rotation.z = s * 1.15;
            capPivot.add(gill);
          });
        });
        break;
      }
      case 'teddyCrown':
      default: {
        const earGeo = this.getSharedGeometry('topper_sphere_0.135_12_10', () => new THREE.SphereGeometry(0.135, 12, 10));
        const crownGeo = this.getSharedGeometry('topper_cyl_0.14_0.10_0.15_6', () => new THREE.CylinderGeometry(0.14, 0.10, 0.15, 6));
        [-1, 1].forEach((s) => {
          const ear = new THREE.Mesh(earGeo, capMat);
          ear.position.set(s * 0.32, 0.32, -0.31);
          capPivot.add(ear);
        });
        const crown = new THREE.Mesh(crownGeo, goldGlossMat);
        crown.position.set(0, 0.38, -0.29);
        capPivot.add(crown);
        break;
      }
    }
  }

  initEnvironmentPools() {
    // 1. Dreamy Pastel Procedural Sky Dome Pool
    const skyDomePool = new ClickerProceduralAssetPool(this.environmentGroup, 'sky_dome', {
      poolName: PROCEDURAL_ENVIRONMENT_POOL_NAMES.sky_dome,
      poolCategory: 'procedural_environment',
      initialSize: 1,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const skyUniforms = { uTime: { value: 0 } };
        const mesh = new THREE.Mesh(
          this.sharedGeometries.get('sky_dome'),
          new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: skyUniforms,
            vertexShader: `
              varying vec3 vPos;
              void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vPos = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
              }
            `,
            fragmentShader: `
              uniform float uTime;
              varying vec3 vPos;
              void main() {
                vec3 d = normalize(vPos);
                float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
                vec3 bottom = vec3(0.99, 0.87, 0.96);
                vec3 mid    = vec3(0.93, 0.84, 1.00);
                vec3 top    = vec3(0.76, 0.88, 1.00);
                vec3 col = mix(bottom, mid, smoothstep(0.28, 0.60, h));
                col = mix(col, top, smoothstep(0.60, 0.96, h));

                float wave = sin(d.x * 3.8 + uTime * 0.35) * cos(d.z * 3.2 - uTime * 0.25);
                vec3 glow = mix(vec3(1.0, 0.72, 0.90), vec3(0.72, 0.94, 1.0), wave * 0.5 + 0.5);
                col = mix(col, glow, 0.14);
                gl_FragColor = vec4(col, 1.0);
              }
            `
          })
        );
        mesh.name = 'PooledPastelSkyDome';
        mesh.userData.skyUniforms = skyUniforms;
        return mesh;
      }
    });
    this.environmentPools.set('sky_dome', skyDomePool);

    // 2. Soft Pastel Lavender Polka-Dot Desk Mat Pool
    const deskMatPool = new ClickerProceduralAssetPool(this.environmentGroup, 'desk_mat', {
      poolName: PROCEDURAL_ENVIRONMENT_POOL_NAMES.desk_mat,
      poolCategory: 'procedural_environment',
      initialSize: 1,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const mesh = new THREE.Mesh(
          this.sharedGeometries.get('desk_mat'),
          this.sharedMaterials.get('desk_mat')
        );
        mesh.name = 'PooledPastelDeskMat';
        mesh.receiveShadow = true;
        return mesh;
      }
    });
    this.environmentPools.set('desk_mat', deskMatPool);

    // 3. Floating Pastel Clouds Pool (8 pre-allocated cloud assemblies using shared puff geometries!)
    const cloudMat = this.sharedMaterials.get('cloud_pastel');
    const puffSpecs = [
      [-0.8, 0, 0, 'cloud_puff_0.72'],
      [0, 0.22, 0, 'cloud_puff_0.95'],
      [0.85, 0.02, 0, 'cloud_puff_0.70'],
      [0.25, -0.1, 0.35, 'cloud_puff_0.65']
    ];
    const cloudPool = new ClickerProceduralAssetPool(this.environmentGroup, 'pastel_cloud', {
      poolName: PROCEDURAL_ENVIRONMENT_POOL_NAMES.pastel_cloud,
      poolCategory: 'procedural_environment',
      initialSize: 8,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const cg = new THREE.Group();
        cg.name = 'PooledPastelCloud';
        for (let p = 0; p < puffSpecs.length; p++) {
          const [x, y, z, geoKey] = puffSpecs[p];
          const puff = new THREE.Mesh(this.sharedGeometries.get(geoKey), cloudMat);
          puff.position.set(x, y, z);
          cg.add(puff);
        }
        return cg;
      }
    });
    this.environmentPools.set('pastel_cloud', cloudPool);

    // 4. Floating Pastel 4-Point Sparkle Starfield Pool
    const ambientStarsPool = new ClickerProceduralAssetPool(this.environmentGroup, 'ambient_stars', {
      poolName: PROCEDURAL_ENVIRONMENT_POOL_NAMES.ambient_stars,
      poolCategory: 'procedural_environment',
      initialSize: 1,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const ambientStarCount = 90;
        const starPos = new Float32Array(ambientStarCount * 3);
        const starSeed = new Float32Array(ambientStarCount);
        for (let i = 0; i < ambientStarCount; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 4.2 + Math.random() * 8.5;
          starPos[i * 3] = Math.cos(a) * r;
          starPos[i * 3 + 1] = 0.2 + Math.random() * 6.5;
          starPos[i * 3 + 2] = Math.sin(a) * r;
          starSeed[i] = Math.random() * Math.PI * 2;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const points = new THREE.Points(starGeo, this.sharedMaterials.get('ambient_stars'));
        points.name = 'PooledAmbientSparkles';
        points.userData.starGeo = starGeo;
        points.userData.starSeed = starSeed;
        points.userData.ambientStarCount = ambientStarCount;
        return points;
      }
    });
    this.environmentPools.set('ambient_stars', ambientStarsPool);
  }

  initSiliconeCasePool() {
    const pinkSiliconeMainMat = this.sharedMaterials.get('pink_silicone_main');
    const pinkSiliconeLipMat = this.sharedMaterials.get('pink_silicone_lip');
    const pinkSiliconeInnerMat = this.sharedMaterials.get('pink_silicone_inner');
    const pinkSiliconeEmbossMat = this.sharedMaterials.get('pink_silicone_emboss');
    const goldGlossMat = this.sharedMaterials.get('gold_gloss');
    const bigHeartCharmMat = this.sharedMaterials.get('big_heart_charm');
    const miniHeartGeo = this.sharedGeometries.get('case_mini_heart');
    const miniBeadGeo = this.sharedGeometries.get('case_mini_bead');
    const charmBeadGeo = this.sharedGeometries.get('case_charm_bead');

    const beadColors = [0xffe066, 0x99e9f2, 0xd8b4fe];
    const beadMats = beadColors.map((col, idx) =>
      this.getSharedMaterial(`charm_bead_mat_${idx}`, () => new THREE.MeshPhysicalMaterial({
        color: col,
        roughness: 0.2,
        clearcoat: 0.85
      }))
    );

    const casePool = new ClickerProceduralAssetPool(this.boardAssembly, 'pink_silicone_case', {
      poolName: PROCEDURAL_CASE_POOL_NAME,
      poolCategory: 'procedural_silicone_case',
      initialSize: 1,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const siliconeCaseGroup = new THREE.Group();
        siliconeCaseGroup.name = 'PinkSiliconeCase';

        // 1. Thick Rounded Pink Silicone Bottom Tray
        const trayBaseMesh = new THREE.Mesh(this.sharedGeometries.get('case_tray_base'), pinkSiliconeMainMat);
        trayBaseMesh.castShadow = true;
        trayBaseMesh.receiveShadow = true;
        siliconeCaseGroup.add(trayBaseMesh);

        // 2. Thick Raised Pillowy Pink Silicone Surrounding Bumper Frame
        const bumperMesh = new THREE.Mesh(this.sharedGeometries.get('case_bumper'), pinkSiliconeLipMat);
        bumperMesh.castShadow = true;
        bumperMesh.receiveShadow = true;
        siliconeCaseGroup.add(bumperMesh);

        // 3. Recessed Berry-Pink Silicone Floor Liner inside the case well
        const wellFloor = new THREE.Mesh(this.sharedGeometries.get('case_well_floor'), pinkSiliconeInnerMat);
        wellFloor.rotation.x = -Math.PI / 2;
        wellFloor.position.y = 0.025;
        wellFloor.receiveShadow = true;
        siliconeCaseGroup.add(wellFloor);

        // 4. Molded hearts & beads on top and bottom pink silicone rims
        [-1.6, 0, 1.6].forEach((hx, idx) => {
          [-1, 1].forEach((sideZ) => {
            const hMesh = new THREE.Mesh(idx === 1 ? miniHeartGeo : miniBeadGeo, pinkSiliconeEmbossMat);
            hMesh.position.set(hx, 0.745, sideZ * (this.innerD * 0.5 + this.wallThickness * 0.52));
            if (idx !== 1) hMesh.scale.set(1.2, 0.45, 1.2);
            siliconeCaseGroup.add(hMesh);
          });
        });

        // Molded tiny pastel row-marker silicone dots along the left & right edges (1 per row!)
        for (let r = 0; r < NUM_ROWS; r++) {
          const rz = (r - (NUM_ROWS - 1) / 2) * KEY_PITCH;
          const rowDotMat = this.sharedMaterials.get(`row_dot_${r}`);
          [-1, 1].forEach((sideX) => {
            const dot = new THREE.Mesh(miniBeadGeo, rowDotMat);
            dot.scale.set(0.95, 0.42, 0.95);
            dot.position.set(sideX * (this.innerW * 0.5 + this.wallThickness * 0.52), 0.74, rz);
            siliconeCaseGroup.add(dot);
          });
        }

        // 5. Molded Pink Silicone Corner Carry Loop + Swinging 3D Pastel Heart Charm!
        const carryLoop = new THREE.Mesh(this.sharedGeometries.get('case_carry_loop'), pinkSiliconeMainMat);
        carryLoop.position.set(this.outerW * 0.5 - 0.15, 0.28, -this.outerD * 0.5 + 0.15);
        carryLoop.rotation.x = Math.PI / 2;
        carryLoop.rotation.z = -Math.PI * 0.42;
        carryLoop.castShadow = true;
        siliconeCaseGroup.add(carryLoop);

        const charmPivot = new THREE.Group();
        charmPivot.position.set(this.outerW * 0.5 + 0.15, 0.28, -this.outerD * 0.5 - 0.15);
        siliconeCaseGroup.add(charmPivot);

        const charmRing = new THREE.Mesh(this.sharedGeometries.get('case_charm_ring'), goldGlossMat);
        charmRing.rotation.y = Math.PI * 0.25;
        charmPivot.add(charmRing);

        beadMats.forEach((bMat, i) => {
          const bead = new THREE.Mesh(charmBeadGeo, bMat);
          bead.position.set(0.18 + i * 0.24, -0.04, -0.18 - i * 0.24);
          bead.castShadow = true;
          charmPivot.add(bead);
        });

        const bigHeartCharm = new THREE.Mesh(this.sharedGeometries.get('case_big_heart_charm'), bigHeartCharmMat);
        bigHeartCharm.position.set(0.98, -0.02, -0.98);
        bigHeartCharm.rotation.y = -Math.PI * 0.25;
        bigHeartCharm.castShadow = true;
        charmPivot.add(bigHeartCharm);

        siliconeCaseGroup.userData.charmPivot = charmPivot;
        return siliconeCaseGroup;
      }
    });

    this.siliconeCasePools.set('pink_silicone_case', casePool);
  }

  initProceduralSwitchPools() {
    const switchBaseGeo = this.sharedGeometries.get('switch_base');
    const puzzleTabGeo = this.sharedGeometries.get('puzzle_tab');
    const ledGlowPlaneGeo = this.sharedGeometries.get('led_glow_plane');
    const switchCrystalCollarGeo = this.sharedGeometries.get('switch_crystal_collar');
    const hitBoxGeo = this.sharedGeometries.get('hit_box');
    const clearCrystalMat = this.sharedMaterials.get('clear_crystal');
    const invisibleHitMat = this.sharedMaterials.get('invisible_hit');

    for (let row = 0; row < NUM_ROWS; row++) {
      const rowTheme = ROW_THEMES[row];
      const housingMat = this.sharedMaterials.get(`row_housing_${row}`);
      const rowKey = `row_${row}`;

      const switchPool = new ClickerProceduralAssetPool(this.clickersContainer, rowKey, {
        poolName: PROCEDURAL_SWITCH_POOL_NAMES[rowKey],
        poolCategory: 'procedural_switch_housing',
        initialSize: NUM_COLS,
        sharedTextures: this.sharedTextures,
        createAssetFn: () => {
          const unit = new THREE.Group();
          unit.name = `PooledSwitchHousing_Row${row}`;

          const baseMesh = new THREE.Mesh(switchBaseGeo, housingMat);
          baseMesh.position.y = 0.16;
          baseMesh.castShadow = true;
          baseMesh.receiveShadow = true;
          unit.add(baseMesh);

          const tabR = new THREE.Mesh(puzzleTabGeo, housingMat);
          tabR.position.set(0.51, 0.15, -0.18);
          unit.add(tabR);
          const tabR2 = new THREE.Mesh(puzzleTabGeo, housingMat);
          tabR2.position.set(0.51, 0.15, 0.18);
          unit.add(tabR2);

          // Per-instance LED material so each switch glows independently without reallocating
          const ledMat = new THREE.MeshBasicMaterial({
            color: rowTheme.ledHex,
            transparent: true,
            opacity: 0.22
          });
          const ledGlow = new THREE.Mesh(ledGlowPlaneGeo, ledMat);
          ledGlow.rotation.x = -Math.PI / 2;
          ledGlow.position.y = 0.335;
          unit.add(ledGlow);

          const collar = new THREE.Mesh(switchCrystalCollarGeo, clearCrystalMat);
          collar.position.y = 0.40;
          unit.add(collar);

          const hitMesh = new THREE.Mesh(hitBoxGeo, invisibleHitMat);
          hitMesh.position.y = 0.68;
          unit.add(hitMesh);

          unit.userData.rowThemeIndex = row;
          unit.userData.tabR = tabR;
          unit.userData.tabR2 = tabR2;
          unit.userData.ledMat = ledMat;
          unit.userData.hitMesh = hitMesh;
          return unit;
        },
        resetAssetFn: (unit) => {
          if (unit.userData && unit.userData.ledMat) {
            unit.userData.ledMat.opacity = 0.22;
          }
          if (unit.userData && unit.userData.hitMesh) {
            unit.userData.hitMesh.userData.clicker = null;
          }
        }
      });

      this.proceduralSwitchPools.set(row, switchPool);
      this.proceduralSwitchPools.set(rowKey, switchPool);
    }
  }

  initProceduralKeycapPools() {
    // Count exact board demand per character type so pre-allocation covers 100% of the 7x5 board
    const charDemand = new Map();
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        const id = GRID_CHAR_IDS[r][c];
        charDemand.set(id, (charDemand.get(id) || 0) + 1);
      }
    }

    const puffyKeycapGeo = this.sharedGeometries.get('puffy_keycap');
    const domedFaceGeo = this.sharedGeometries.get('domed_face_cap');
    const stemArmAGeo = this.sharedGeometries.get('stem_arm_a');
    const stemArmBGeo = this.sharedGeometries.get('stem_arm_b');
    const defaultStemMat = this.sharedMaterials.get('row_stem_0');

    for (const def of CHARACTER_CATALOG) {
      const initialSize = Math.max(2, charDemand.get(def.id) || 2);
      const faceMat = this.sharedMaterials.get(`char_face_${def.id}`);

      const charPool = new ClickerProceduralAssetPool(this.clickersContainer, def.id, {
        poolName: PROCEDURAL_KEYCAP_POOL_NAMES[def.id],
        poolCategory: 'procedural_character_keycap',
        initialSize,
        sharedTextures: this.sharedTextures,
        createAssetFn: () => {
          const capPivot = new THREE.Group();
          capPivot.name = `PooledKeycap_${def.id}`;

          // Visible MX Cross-Stem (material swapped to row's shared stemMat on spawn)
          const stemA = new THREE.Mesh(stemArmAGeo, defaultStemMat);
          stemA.position.y = -0.30;
          capPivot.add(stemA);
          const stemB = new THREE.Mesh(stemArmBGeo, defaultStemMat);
          stemB.position.y = -0.30;
          capPivot.add(stemB);

          // Glossy Puffy Cushion Keycap Body (per-instance capMat for independent press/hover glow)
          const capMat = new THREE.MeshPhysicalMaterial({
            color: def.hex,
            roughness: 0.24,
            metalness: 0.0,
            clearcoat: 0.72,
            clearcoatRoughness: 0.18,
            envMapIntensity: 0.62,
            emissive: new THREE.Color(def.hex),
            emissiveIntensity: 0.02
          });
          const capMesh = new THREE.Mesh(puffyKeycapGeo, capMat);
          capMesh.castShadow = true;
          capMesh.receiveShadow = true;
          capPivot.add(capMesh);

          // Domed Glossy Kawaii Cartoon Face using shared faceMat & deduplicated CanvasTexture
          const faceCap = new THREE.Mesh(domedFaceGeo, faceMat);
          capPivot.add(faceCap);

          // Sculpted 3D Character Topper using shared geometries & accent/cheek materials
          this.buildCharacter3DTopper(capPivot, def, capMat);

          capPivot.userData.characterId = def.id;
          capPivot.userData.capMat = capMat;
          capPivot.userData.stemA = stemA;
          capPivot.userData.stemB = stemB;
          return capPivot;
        },
        resetAssetFn: (capPivot) => {
          capPivot.rotation.set(0, 0, 0);
          capPivot.scale.set(1, 1, 1);
          if (capPivot.userData && capPivot.userData.capMat) {
            capPivot.userData.capMat.emissiveIntensity = 0.02;
          }
        }
      });

      this.proceduralKeycapPools.set(def.id, charPool);
    }
  }

  initProceduralParticlePools() {
    const particleHeartGeo = this.sharedGeometries.get('particle_heart');
    const particleStarGeo = this.sharedGeometries.get('particle_star');

    const createParticleFactory = (geo, kind) => () => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `PooledParticle_${kind}`;
      mesh.userData.particleKind = kind;
      mesh.userData.mat = mat;
      mesh.userData.vel = new THREE.Vector3();
      mesh.userData.spin = new THREE.Vector3();
      mesh.userData.age = 0;
      mesh.userData.maxAge = 0.75;
      return mesh;
    };

    const resetParticle = (mesh) => {
      if (mesh.userData) {
        mesh.userData.age = 0;
        if (mesh.userData.mat) mesh.userData.mat.opacity = 1.0;
        if (mesh.userData.vel) mesh.userData.vel.set(0, 0, 0);
        if (mesh.userData.spin) mesh.userData.spin.set(0, 0, 0);
      }
    };

    const heartPool = new ClickerProceduralAssetPool(this.scene, 'heart', {
      poolName: PROCEDURAL_PARTICLE_POOL_NAMES.heart,
      poolCategory: 'procedural_particle',
      initialSize: 96,
      sharedTextures: this.sharedTextures,
      createAssetFn: createParticleFactory(particleHeartGeo, 'heart'),
      resetAssetFn: resetParticle
    });

    const starPool = new ClickerProceduralAssetPool(this.scene, 'star', {
      poolName: PROCEDURAL_PARTICLE_POOL_NAMES.star,
      poolCategory: 'procedural_particle',
      initialSize: 96,
      sharedTextures: this.sharedTextures,
      createAssetFn: createParticleFactory(particleStarGeo, 'star'),
      resetAssetFn: resetParticle
    });

    this.proceduralParticlePools.set('heart', heartPool);
    this.proceduralParticlePools.set('star', starPool);
  }

  initProceduralXRPools() {
    const rayGeo = this.sharedGeometries.get('xr_ray_line');
    const reticleGeo = this.sharedGeometries.get('xr_reticle_sphere');
    const reticleMat = this.sharedMaterials.get('xr_reticle');

    const rayPool = new ClickerProceduralAssetPool(this.cameraRig, 'xr_ray', {
      poolName: PROCEDURAL_XR_POOL_NAMES.xr_ray,
      poolCategory: 'procedural_xr_input',
      initialSize: 2,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const rayMat = new THREE.LineBasicMaterial({ color: 0xff6fb5, transparent: true, opacity: 0.9 });
        const line = new THREE.Line(rayGeo, rayMat);
        line.name = 'PooledXRRay';
        line.userData.rayMat = rayMat;
        return line;
      },
      resetAssetFn: (line) => {
        if (line.userData && line.userData.rayMat) {
          line.userData.rayMat.color.setHex(0xff6fb5);
        }
      }
    });

    const reticlePool = new ClickerProceduralAssetPool(this.cameraRig, 'xr_reticle', {
      poolName: PROCEDURAL_XR_POOL_NAMES.xr_reticle,
      poolCategory: 'procedural_xr_input',
      initialSize: 2,
      sharedTextures: this.sharedTextures,
      createAssetFn: () => {
        const mesh = new THREE.Mesh(reticleGeo, reticleMat);
        mesh.name = 'PooledXRReticle';
        return mesh;
      }
    });

    this.proceduralXRPools.set('xr_ray', rayPool);
    this.proceduralXRPools.set('xr_reticle', reticlePool);
  }

  // ---- Pool Spawn & Despawn API ----
  spawnEnvironmentAsset(kind, position = null, quaternion = null, scale = null, targetParent = null) {
    const pool = this.environmentPools.get(kind);
    return pool ? pool.spawn(position, quaternion, scale, targetParent || this.environmentGroup) : null;
  }

  spawnSiliconeCase(position = null, quaternion = null, scale = null, targetParent = null) {
    const pool = this.siliconeCasePools.get('pink_silicone_case');
    return pool ? pool.spawn(position, quaternion, scale, targetParent || this.boardAssembly) : null;
  }

  spawnSwitchUnit(row, col, position) {
    const pool = this.proceduralSwitchPools.get(row);
    if (!pool) return null;
    const unit = pool.spawn(position, null, 1.0, this.clickersContainer);
    if (unit && unit.userData) {
      const showTabs = col < NUM_COLS - 1;
      if (unit.userData.tabR) unit.userData.tabR.visible = showTabs;
      if (unit.userData.tabR2) unit.userData.tabR2.visible = showTabs;
    }
    return unit;
  }

  spawnCharacterKeycap(charId, row, targetUnit, restY = 0.72) {
    const pool = this.proceduralKeycapPools.get(charId) || this.proceduralKeycapPools.get(CHARACTER_CATALOG[0].id);
    if (!pool) return null;
    const capPivot = pool.spawn({ x: 0, y: restY, z: 0 }, null, 1.0, targetUnit);
    if (capPivot && capPivot.userData) {
      const rowStemMat = this.sharedMaterials.get(`row_stem_${row}`);
      if (rowStemMat) {
        if (capPivot.userData.stemA) capPivot.userData.stemA.material = rowStemMat;
        if (capPivot.userData.stemB) capPivot.userData.stemB.material = rowStemMat;
      }
    }
    return capPivot;
  }

  spawnParticle(kind, origin, colorHex, scale = 1.0) {
    const resolvedKind = kind === 'heart' ? 'heart' : 'star';
    const pool = this.proceduralParticlePools.get(resolvedKind);
    if (!pool) return null;
    const mesh = pool.spawn(origin, null, scale, this.scene);
    if (mesh && mesh.userData && mesh.userData.mat) {
      mesh.userData.mat.color.setHex(colorHex);
      mesh.userData.mat.opacity = 1.0;
    }
    return mesh;
  }

  despawnParticle(mesh) {
    if (!mesh) return false;
    const kind = (mesh.userData && mesh.userData.particleKind === 'heart') ? 'heart' : 'star';
    const pool = this.proceduralParticlePools.get(kind);
    if (!pool) return false;
    pool.despawn(mesh);
    return true;
  }

  despawnAllParticles() {
    for (const pool of this.proceduralParticlePools.values()) {
      pool.despawnAll();
    }
  }

  spawnXRAsset(kind, targetParent) {
    const pool = this.proceduralXRPools.get(kind);
    return pool ? pool.spawn(null, null, 1.0, targetParent) : null;
  }

  getUniquePools() {
    return Array.from(new Set([
      ...this.environmentPools.values(),
      ...this.siliconeCasePools.values(),
      ...this.proceduralSwitchPools.values(),
      ...this.proceduralKeycapPools.values(),
      ...this.proceduralParticlePools.values(),
      ...this.proceduralXRPools.values()
    ]));
  }

  getPoolStats() {
    const uniquePools = this.getUniquePools();
    let totalInstances = 0;
    let totalActive = 0;
    let totalAvailable = 0;

    const collectCategory = (mapObj) => {
      const out = {};
      const seen = new Set();
      for (const [k, pool] of mapObj.entries()) {
        if (seen.has(pool)) continue;
        seen.add(pool);
        out[pool.poolKey || String(k)] = pool.getStats();
      }
      return out;
    };

    for (const pool of uniquePools) {
      const s = pool.getStats();
      totalInstances += s.total;
      totalActive += s.active;
      totalAvailable += s.available;
    }

    return {
      summary: {
        poolCount: uniquePools.length,
        totalInstances,
        totalActive,
        totalAvailable,
        sharedGeometries: new Set(this.sharedGeometries.values()).size,
        sharedMaterials: new Set(this.sharedMaterials.values()).size,
        sharedTextures: new Set(this.sharedTextures.values()).size
      },
      environment: collectCategory(this.environmentPools),
      siliconeCase: collectCategory(this.siliconeCasePools),
      switches: collectCategory(this.proceduralSwitchPools),
      keycaps: collectCategory(this.proceduralKeycapPools),
      particles: collectCategory(this.proceduralParticlePools),
      xr: collectCategory(this.proceduralXRPools)
    };
  }

  dispose() {
    this._disposed = true;
    for (const pool of this.getUniquePools()) {
      pool.dispose();
    }
    this.environmentPools.clear();
    this.siliconeCasePools.clear();
    this.proceduralSwitchPools.clear();
    this.proceduralKeycapPools.clear();
    this.proceduralParticlePools.clear();
    this.proceduralXRPools.clear();

    for (const geo of this.sharedGeometries.values()) {
      try { geo.dispose(); } catch (_) {}
    }
    for (const mat of this.sharedMaterials.values()) {
      try { mat.dispose(); } catch (_) {}
    }
    for (const tex of this.sharedTextures.values()) {
      try { tex.dispose(); } catch (_) {}
    }
    this.sharedGeometries.clear();
    this.sharedMaterials.clear();
    this.sharedTextures.clear();

    if (typeof window !== 'undefined' && window.clickerGraphicsPool === this) {
      window.clickerGraphicsPool = null;
    }
  }
}

export function createClickerGraphicsPool(scene, containers = {}, options = {}) {
  return new ClickerGameObjectPool(scene, containers, options);
}

// ---------------------------------------------------------------------------
// Main Kawaii 7-Row Mechanical Clicker XR Bootstrapping
// ---------------------------------------------------------------------------
(function initKawaiiClickerBoardXR() {
  'use strict';

  const codeToKeyEntry = new Map();

  // HUD elements
  const canvas = document.getElementById('xr-canvas');
  if (!canvas) return;
  const clicksPill = document.getElementById('clicks-pill');
  const statClicksEl = document.getElementById('stat-clicks');
  const btnSoundMode = document.getElementById('btn-sound-mode');
  const btnWave = document.getElementById('btn-wave');
  const btnEnterVr = document.getElementById('btn-enter-vr');
  const btnEnterAr = document.getElementById('btn-enter-ar');

  const audio = createClickerAudioEngine();

  const state = {
    totalClicks: 0,
    comboCount: 0,
    lastClickTime: 0,
    isInXR: false,
    xrMode: null,
    vrSupported: false,
    arSupported: false,
    webglReady: false,
    poolReady: false,
    paused: false,
    waveActiveCount: 0
  };

  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed.totalClicks) && parsed.totalClicks >= 0) {
        state.totalClicks = Math.floor(parsed.totalClicks);
      }
    } catch (_) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalClicks: state.totalClicks }));
    } catch (_) {}
  }

  function syncHud(pop = false) {
    if (statClicksEl) statClicksEl.textContent = state.totalClicks.toLocaleString('en-US');
    if (pop && clicksPill) {
      clicksPill.classList.remove('is-pop');
      void clicksPill.offsetWidth;
      clicksPill.classList.add('is-pop');
    }
  }

  loadStats();
  syncHud(false);

  // ---------------------------------------------------------------------------
  // WebGL / Three.js + WebXR Renderer Setup
  // ---------------------------------------------------------------------------
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    state.webglReady = true;
  } catch (err) {
    console.warn('[KawaiiClickerXR] WebGL unavailable:', err);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 120);
  camera.position.set(0, 9.6, 9.8);

  const cameraRig = new THREE.Group();
  cameraRig.name = 'XRCameraRig';
  cameraRig.add(camera);
  scene.add(cameraRig);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 5.5;
  controls.maxDistance = 24.0;
  controls.minPolarAngle = Math.PI * 0.06;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 0.2, 0.1);

  // Balanced Toy-Studio Lighting (crisp depth, vivid candy colors & velvety hot-pink silicone!)
  const hemiLight = new THREE.HemisphereLight(0xfff5fb, 0x8b6bb8, 0.68);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf2, 1.25);
  keyLight.position.set(6.0, 14.0, 7.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 32;
  keyLight.shadow.camera.left = -8.5;
  keyLight.shadow.camera.right = 8.5;
  keyLight.shadow.camera.top = 9.5;
  keyLight.shadow.camera.bottom = -9.5;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const pinkFill = new THREE.DirectionalLight(0xff80c8, 0.36);
  pinkFill.position.set(-7.5, 6.5, 4.0);
  scene.add(pinkFill);

  const aquaRim = new THREE.DirectionalLight(0x7dd3fc, 0.38);
  aquaRim.position.set(7.0, 5.5, -6.5);
  scene.add(aquaRim);

  // Scene hierarchy groups
  const environmentGroup = new THREE.Group();
  environmentGroup.name = 'PastelEnvironmentGroup';
  scene.add(environmentGroup);

  const boardAssembly = new THREE.Group();
  boardAssembly.name = 'Kawaii7RowClickerBoard';
  scene.add(boardAssembly);

  const clickersContainer = new THREE.Group();
  clickersContainer.name = 'SevenRowsOfClickers';
  boardAssembly.add(clickersContainer);

  // ---------------------------------------------------------------------------
  // Pre-Allocate Dedicated Procedural Graphics Asset Pools (like warp_origin_pool.js!)
  // ---------------------------------------------------------------------------
  const graphicsPool = createClickerGraphicsPool(
    scene,
    { environmentGroup, boardAssembly, clickersContainer, cameraRig },
    { renderer }
  );
  if (typeof window !== 'undefined') {
    window.clickerGraphicsPool = graphicsPool;
  }

  if (graphicsPool.studioEnvMap) {
    scene.environment = graphicsPool.studioEnvMap;
  }

  const outerW = graphicsPool.outerW;
  const outerD = graphicsPool.outerD;

  // ---------------------------------------------------------------------------
  // Spawn Dreamy Pastel Room Environment from Dedicated Environment Pools
  // ---------------------------------------------------------------------------
  const skyDome = graphicsPool.spawnEnvironmentAsset('sky_dome');
  const skyUniforms = (skyDome && skyDome.userData.skyUniforms) || { uTime: { value: 0 } };

  const deskQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  graphicsPool.spawnEnvironmentAsset('desk_mat', { x: 0, y: -0.58, z: 0 }, deskQuat, 1.0);

  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const rad = 19.5 + (i % 2) * 3.0;
    const baseY = 3.6 + (i % 3) * 1.5;
    const scale = 1.0 + (i % 3) * 0.25;
    const cg = graphicsPool.spawnEnvironmentAsset(
      'pastel_cloud',
      { x: Math.cos(ang) * rad, y: baseY, z: Math.sin(ang) * rad - 3.5 },
      null,
      scale
    );
    if (cg) {
      clouds.push({ group: cg, baseY, phase: i * 0.9 });
    }
  }

  const starPoints = graphicsPool.spawnEnvironmentAsset('ambient_stars');
  const starGeo = starPoints ? starPoints.userData.starGeo : null;
  const starSeed = starPoints ? starPoints.userData.starSeed : null;
  const ambientStarCount = starPoints ? starPoints.userData.ambientStarCount : 0;

  // ---------------------------------------------------------------------------
  // Spawn Thick Pink Silicone Protective Case & Swinging Charm from Case Pool
  // ---------------------------------------------------------------------------
  const siliconeCaseGroup = graphicsPool.spawnSiliconeCase();
  const charmPivot = siliconeCaseGroup ? siliconeCaseGroup.userData.charmPivot : null;

  let charmAngle = 0;
  let charmVel = 0;

  // ---------------------------------------------------------------------------
  // Spawn ALL 7 ROWS x 5 COLUMNS = 35 Mechanical Clickers from Dedicated Pools!
  // ---------------------------------------------------------------------------
  const clickers = [];
  const clickerGrid = Array.from({ length: NUM_ROWS }, () => []);
  const interactiveHitMeshes = [];
  const rowClickedMask = Array.from({ length: NUM_ROWS }, () => new Set());
  const charById = graphicsPool.charById;

  for (let row = 0; row < NUM_ROWS; row++) {
    const rowTheme = ROW_THEMES[row];
    const z = (row - (NUM_ROWS - 1) / 2) * KEY_PITCH;

    for (let col = 0; col < NUM_COLS; col++) {
      const x = (col - (NUM_COLS - 1) / 2) * KEY_PITCH;
      const charId = GRID_CHAR_IDS[row][col];
      const def = charById.get(charId) || CHARACTER_CATALOG[(row * NUM_COLS + col) % CHARACTER_CATALOG.length];

      // 1. Spawn interlocking switch housing from this row's dedicated procedural switch pool
      const unit = graphicsPool.spawnSwitchUnit(row, col, { x, y: 0.04, z });
      const ledMat = unit.userData.ledMat;
      const hitMesh = unit.userData.hitMesh;

      // 2. Spawn sculpted kawaii chibi keycap + 3D topper from this character's dedicated pool
      const restY = 0.72;
      const capPivot = graphicsPool.spawnCharacterKeycap(def.id, row, unit, restY);
      const capMat = capPivot.userData.capMat;

      const entry = {
        index: row * NUM_COLS + col,
        row,
        col,
        def,
        rowTheme,
        unit,
        capPivot,
        capMat,
        ledMat,
        hitMesh,
        restY,
        isHeld: false,
        pressDepth: 0,
        pressVel: 0,
        targetDepth: 0,
        ledGlowEnergy: 0,
        wigglePhase: 0,
        wiggleAmp: 0,
        hovered: false,
        idleSeed: Math.random() * Math.PI * 2,
        waveDelay: -1,
        xrPokeCooldown: 0
      };

      hitMesh.userData.clicker = entry;
      interactiveHitMeshes.push(hitMesh);
      clickers.push(entry);
      clickerGrid[row][col] = entry;

      const keyCode = KEYBOARD_GRID_CODES[row]?.[col];
      if (keyCode) {
        codeToKeyEntry.set(keyCode, entry);
      }
    }
  }

  state.poolReady = true;
  canvas.dataset.poolReady = 'true';

  // ---------------------------------------------------------------------------
  // Pooled 3D Sparkle / Heart / Star Particle Bursts (Zero Runtime Allocations!)
  // ---------------------------------------------------------------------------
  const activeParticles = [];
  const tempBurstOrigin = new THREE.Vector3();

  function spawnClickBurst(entry, count = 7) {
    entry.capPivot.getWorldPosition(tempBurstOrigin);
    tempBurstOrigin.y += 0.36;

    for (let i = 0; i < count; i++) {
      const col = i === 0 ? entry.rowTheme.ledHex : PARTICLE_PALETTE[Math.floor(Math.random() * PARTICLE_PALETTE.length)];
      const kind = i % 2 === 0 ? 'heart' : 'star';
      const initialScale = 0.55 + Math.random() * 0.55;
      const mesh = graphicsPool.spawnParticle(kind, tempBurstOrigin, col, initialScale);
      if (!mesh) continue;

      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = 1.0 + Math.random() * 1.9;
      mesh.userData.vel.set(Math.cos(ang) * spd, 2.2 + Math.random() * 2.2, Math.sin(ang) * spd);
      mesh.userData.spin.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
      mesh.userData.age = 0;
      mesh.userData.maxAge = 0.65 + Math.random() * 0.35;

      activeParticles.push(mesh);
    }
  }

  // ---------------------------------------------------------------------------
  // Procedural Silicone Case Shockwave & Mechanical Key Press / Release Engine!
  // ---------------------------------------------------------------------------
  let caseBounceY = 0;
  let caseBounceVel = 0;
  let caseTiltX = 0;
  let caseTiltZ = 0;

  function triggerRainbowWave(originRow = 3, originCol = 2) {
    audio.unlock();
    audio.playRainbowWaveChime();
    state.waveActiveCount += 1;
    charmVel += 6.5;

    for (let i = 0; i < clickers.length; i++) {
      const k = clickers[i];
      const dist = Math.hypot(k.row - originRow, k.col - originCol);
      k.waveDelay = dist * 0.055;
    }
  }

  function pressClicker(entry, { silentWave = false, hold = true } = {}) {
    if (!entry) return;
    audio.unlock();

    if (hold && entry.isHeld) return;

    if (hold) {
      entry.isHeld = true;
      entry.targetDepth = 0.23;
    } else {
      entry.targetDepth = 0;
    }

    entry.pressDepth = Math.max(entry.pressDepth, 0.14);
    entry.pressVel = 2.6;
    entry.ledGlowEnergy = 1.0;
    entry.wiggleAmp = 0.11;
    entry.wigglePhase = 0;

    audio.playKeyDown(entry.row, entry.col, NUM_COLS, silentWave);

    if (!silentWave && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch (_) {}
    }

    caseBounceVel -= silentWave ? 0.18 : 0.72;
    caseTiltX += ((entry.row - 3) / 3) * (silentWave ? 0.002 : 0.011);
    caseTiltZ -= ((entry.col - 2) / 2) * (silentWave ? 0.002 : 0.011);
    charmVel += (Math.random() > 0.5 ? 1 : -1) * (silentWave ? 0.9 : 3.2);

    const neighbors = [
      [entry.row - 1, entry.col],
      [entry.row + 1, entry.col],
      [entry.row, entry.col - 1],
      [entry.row, entry.col + 1]
    ];
    neighbors.forEach(([nr, nc]) => {
      const nb = clickerGrid[nr]?.[nc];
      if (nb && !nb.isHeld) {
        nb.pressVel += 0.45;
        nb.wiggleAmp = Math.max(nb.wiggleAmp, 0.035);
      }
    });

    spawnClickBurst(entry, silentWave ? 3 : 7);

    if (!silentWave) {
      state.totalClicks += 1;
      const nowMs = performance.now();
      state.comboCount = nowMs - state.lastClickTime < 1500 ? state.comboCount + 1 : 1;
      state.lastClickTime = nowMs;

      saveStats();
      syncHud(true);

      const rowSet = rowClickedMask[entry.row];
      rowSet.add(entry.col);
      if (rowSet.size === NUM_COLS) {
        rowSet.clear();
        triggerRainbowWave(entry.row, entry.col);
      }
    }
  }

  function releaseClicker(entry) {
    if (!entry || !entry.isHeld) return;
    entry.isHeld = false;
    entry.targetDepth = 0;
    entry.pressVel = -2.8;
    audio.playKeyUp(entry.row, entry.col, NUM_COLS);
  }

  // ---------------------------------------------------------------------------
  // Pointer / Multi-Touch Drag-Strumming + OrbitControls Smart Separation!
  // ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const activePointerKeys = new Map();
  let hoveredClicker = null;

  function setPointerNdc(e) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  }

  function pickClickerAtEvent(e) {
    setPointerNdc(e);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
    if (hits.length > 0 && hits[0].object.userData.clicker) {
      return hits[0].object.userData.clicker;
    }
    return null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (state.isInXR) return;
    audio.unlock();
    const hit = pickClickerAtEvent(e);
    if (hit) {
      controls.enabled = false;
      activePointerKeys.set(e.pointerId, hit);
      pressClicker(hit, { hold: true });
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    } else {
      controls.enabled = true;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (state.isInXR) return;
    const hit = pickClickerAtEvent(e);
    canvas.classList.toggle('is-hovering-target', Boolean(hit));

    if (hit !== hoveredClicker) {
      if (hoveredClicker) hoveredClicker.hovered = false;
      hoveredClicker = hit;
      if (hoveredClicker) hoveredClicker.hovered = true;
    }

    if (activePointerKeys.has(e.pointerId)) {
      const prev = activePointerKeys.get(e.pointerId);
      if (hit !== prev) {
        if (prev) releaseClicker(prev);
        activePointerKeys.set(e.pointerId, hit);
        if (hit) pressClicker(hit, { hold: true });
      }
    }
  });

  function endPointer(e) {
    if (activePointerKeys.has(e.pointerId)) {
      const prev = activePointerKeys.get(e.pointerId);
      if (prev) releaseClicker(prev);
      activePointerKeys.delete(e.pointerId);
      if (activePointerKeys.size === 0 && !state.isInXR) {
        controls.enabled = true;
      }
    }
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('lostpointercapture', endPointer);

  // Physical Keyboard Support
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      triggerRainbowWave(3, 2);
      return;
    }
    const entry = codeToKeyEntry.get(e.code);
    if (entry) {
      e.preventDefault();
      pressClicker(entry, { hold: true });
    }
  });

  window.addEventListener('keyup', (e) => {
    const entry = codeToKeyEntry.get(e.code);
    if (entry) {
      releaseClicker(entry);
    }
  });

  // Top Bar Cute Buttons
  if (btnSoundMode) {
    btnSoundMode.addEventListener('click', () => {
      audio.unlock();
      const next = !audio.getMusicalChimes();
      audio.setMusicalChimes(next);
      btnSoundMode.setAttribute('aria-pressed', String(next));
      btnSoundMode.textContent = next ? '🎵' : '⌨️';
      btnSoundMode.title = next ? 'Sparkle Thock Mode' : 'Pure Mechanical Thock Mode';
      audio.playKeyDown(3, 2, NUM_COLS, false);
    });
  }

  if (btnWave) {
    btnWave.addEventListener('click', () => {
      triggerRainbowWave(3, 2);
    });
  }

  // ---------------------------------------------------------------------------
  // Responsive Framing
  // ---------------------------------------------------------------------------
  function updateResponsiveFraming() {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    const aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;

    if (!state.isInXR) {
      boardAssembly.position.set(0, 0, 0);
      boardAssembly.rotation.set(0.22, 0, 0);
      boardAssembly.scale.setScalar(1.0);

      const fovDeg = aspect < 0.75 ? 44 : 42;
      camera.fov = fovDeg;
      const vFovRad = THREE.MathUtils.degToRad(fovDeg);
      const tanHalfV = Math.tan(vFovRad / 2);
      const tanHalfH = tanHalfV * aspect;

      const reqDistH = (outerW * 0.58) / Math.max(tanHalfH, 0.12);
      const reqDistV = (outerD * 0.62) / Math.max(tanHalfV, 0.12);
      const dist = Math.max(reqDistH, reqDistV, 12.2);

      const elevRad = aspect < 0.75 ? 0.96 : 0.86;
      camera.position.set(0, Math.sin(elevRad) * dist, Math.cos(elevRad) * dist);
      controls.target.set(0, 0.12, 0.05);
      camera.updateProjectionMatrix();
      controls.update();
    } else {
      camera.updateProjectionMatrix();
    }
  }

  window.addEventListener('resize', updateResponsiveFraming);
  updateResponsiveFraming();

  // ---------------------------------------------------------------------------
  // WebXR Session Management + Dual Controllers (Pooled Rays/Reticles) + Hand Tracking
  // ---------------------------------------------------------------------------
  const controllerModelFactory = new XRControllerModelFactory();
  const handModelFactory = new XRHandModelFactory();
  const xrControllers = [];
  const xrHands = [];
  const tempMatrix = new THREE.Matrix4();
  const tempFingerPos = new THREE.Vector3();
  const tempKeyPos = new THREE.Vector3();

  function raycastFromXRController(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
    return hits.length > 0 ? hits[0] : null;
  }

  function setupXRInput(slot) {
    const controller = renderer.xr.getController(slot);
    const rayLine = graphicsPool.spawnXRAsset('xr_ray', controller);
    const rayMat = rayLine ? rayLine.userData.rayMat : null;

    const reticle = graphicsPool.spawnXRAsset('xr_reticle', controller);
    if (reticle) reticle.visible = false;

    let heldKey = null;
    controller.addEventListener('selectstart', () => {
      audio.unlock();
      if (rayMat) rayMat.color.setHex(0xffe066);
      const hit = raycastFromXRController(controller);
      if (hit && hit.object.userData.clicker) {
        heldKey = hit.object.userData.clicker;
        pressClicker(heldKey, { hold: true });
      }
    });
    controller.addEventListener('selectend', () => {
      if (rayMat) rayMat.color.setHex(0xff6fb5);
      if (heldKey) {
        releaseClicker(heldKey);
        heldKey = null;
      }
    });

    cameraRig.add(controller);
    const grip = renderer.xr.getControllerGrip(slot);
    grip.add(controllerModelFactory.createControllerModel(grip));
    cameraRig.add(grip);

    const hand = renderer.xr.getHand(slot);
    hand.add(handModelFactory.createHandModel(hand, 'mesh'));
    cameraRig.add(hand);

    xrControllers.push({ controller, reticle });
    xrHands.push(hand);
  }

  setupXRInput(0);
  setupXRInput(1);

  let activeXrSession = null;
  async function startXRSession(mode) {
    if (!navigator.xr) return;
    audio.unlock();
    if (activeXrSession) {
      await activeXrSession.end().catch(() => {});
      return;
    }
    try {
      const session = await navigator.xr.requestSession(mode, {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });
      activeXrSession = session;
      state.isInXR = true;
      state.xrMode = mode === 'immersive-ar' ? 'ar' : 'vr';
      controls.enabled = false;

      if (state.xrMode === 'ar') {
        environmentGroup.visible = false;
        renderer.setClearAlpha(0);
      } else {
        environmentGroup.visible = true;
        renderer.setClearAlpha(1);
      }

      boardAssembly.scale.setScalar(0.085);
      boardAssembly.position.set(0, 1.05, -0.52);
      boardAssembly.rotation.set(0.42, 0, 0);

      session.addEventListener('end', () => {
        activeXrSession = null;
        state.isInXR = false;
        state.xrMode = null;
        controls.enabled = true;
        environmentGroup.visible = true;
        renderer.setClearAlpha(1);
        updateResponsiveFraming();
      });

      await renderer.xr.setSession(session);
    } catch (err) {
      console.warn('[KawaiiClickerXR] XR start error:', err);
    }
  }

  async function detectWebXRSupport() {
    let vrOk = false;
    let arOk = false;
    if (navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
      [vrOk, arOk] = await Promise.all([
        navigator.xr.isSessionSupported('immersive-vr').catch(() => false),
        navigator.xr.isSessionSupported('immersive-ar').catch(() => false)
      ]);
    }
    state.vrSupported = vrOk;
    state.arSupported = arOk;
    if (btnEnterVr) btnEnterVr.hidden = !vrOk;
    if (btnEnterAr) btnEnterAr.hidden = !arOk;
  }

  if (btnEnterVr) btnEnterVr.addEventListener('click', () => startXRSession('immersive-vr'));
  if (btnEnterAr) btnEnterAr.addEventListener('click', () => startXRSession('immersive-ar'));
  detectWebXRSupport();

  // ---------------------------------------------------------------------------
  // Modern Web Guidance: Pause background WebGL loop when tab hidden or skipped
  // ---------------------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    state.paused = document.hidden && !state.isInXR;
  });

  const stageEl = document.querySelector('main.xr-stage');
  if (stageEl) {
    stageEl.addEventListener('contentvisibilityautostatechange', (event) => {
      state.paused = Boolean(event.skipped) && !state.isInXR;
    });
  }

  // Diagnostic handle for verification
  window.CalmChessClickerXR = {
    rows: NUM_ROWS,
    cols: NUM_COLS,
    pool: graphicsPool,
    getPoolStats: () => graphicsPool.getPoolStats(),
    clickKey: (r = 0, c = 0) => {
      const k = clickerGrid[r]?.[c];
      if (!k) return false;
      pressClicker(k, { hold: true });
      setTimeout(() => releaseClicker(k), 120);
      return true;
    },
    triggerWave: () => triggerRainbowWave(3, 2),
    getState: () => ({
      rows: NUM_ROWS,
      cols: NUM_COLS,
      totalClickers: clickers.length,
      totalClicks: state.totalClicks,
      musicalChimes: audio.getMusicalChimes(),
      waveActiveCount: state.waveActiveCount,
      webglReady: state.webglReady,
      poolReady: state.poolReady,
      activeParticles: activeParticles.length,
      poolSummary: graphicsPool.getPoolStats().summary,
      audioState: audio.getContextState(),
      isInXR: state.isInXR
    })
  };

  // ---------------------------------------------------------------------------
  // Master XR Procedural Animation Loop
  // ---------------------------------------------------------------------------
  let simTime = 0;
  let lastTs = 0;
  let nextAutonomousWiggle = 1.8;

  renderer.setAnimationLoop((timestamp) => {
    if (state.paused) {
      lastTs = timestamp;
      return;
    }

    const rawDt = lastTs ? (timestamp - lastTs) * 0.001 : 0.016;
    lastTs = timestamp;
    const dt = Math.min(rawDt, 0.05);
    simTime += dt;

    // 1. Living Pastel Sky, Floating Clouds & Twinkling Stars
    skyUniforms.uTime.value = simTime;
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      cl.group.position.y = cl.baseY + Math.sin(simTime * 0.65 + cl.phase) * 0.28;
    }
    if (starGeo && starSeed) {
      const sArr = starGeo.attributes.position.array;
      for (let i = 0; i < ambientStarCount; i++) {
        sArr[i * 3 + 1] += dt * 0.14;
        sArr[i * 3] += Math.sin(simTime * 0.8 + starSeed[i]) * dt * 0.07;
        if (sArr[i * 3 + 1] > 6.8) sArr[i * 3 + 1] = 0.2;
      }
      starGeo.attributes.position.needsUpdate = true;
    }

    // 2. Soft Pink Silicone Case Procedural Cushion Physics & Swinging Charm!
    const caseForce = -110 * caseBounceY - 12 * caseBounceVel;
    caseBounceVel += caseForce * dt;
    caseBounceY += caseBounceVel * dt;
    caseTiltX += (0 - caseTiltX) * Math.min(1, dt * 10);
    caseTiltZ += (0 - caseTiltZ) * Math.min(1, dt * 10);

    const baseRotX = state.isInXR ? 0.42 : 0.24;
    const idleFloatY = state.isInXR ? 1.05 : 0.0;
    boardAssembly.position.y = idleFloatY + caseBounceY + Math.sin(simTime * 1.4) * (state.isInXR ? 0.005 : 0.04);
    boardAssembly.rotation.x = baseRotX + caseTiltX;
    boardAssembly.rotation.z = caseTiltZ + Math.sin(simTime * 0.9) * 0.008;

    const charmAcc = -28 * charmAngle - 3.6 * charmVel + Math.sin(simTime * 1.8) * 0.35;
    charmVel += charmAcc * dt;
    charmAngle += charmVel * dt;
    if (charmPivot) {
      charmPivot.rotation.y = charmAngle;
      charmPivot.rotation.z = charmAngle * 0.28;
    }

    // 3. Cute Autonomous Toy Wiggle so the 7 rows feel playfully alive!
    nextAutonomousWiggle -= dt;
    if (nextAutonomousWiggle <= 0) {
      nextAutonomousWiggle = 1.6 + Math.random() * 1.8;
      const lucky = clickers[Math.floor(Math.random() * clickers.length)];
      if (lucky && !lucky.isHeld) {
        lucky.wiggleAmp = Math.max(lucky.wiggleAmp, 0.085);
        lucky.ledGlowEnergy = Math.max(lucky.ledGlowEnergy, 0.45);
      }
    }

    // 4. Mechanical Switch Spring-Damper + Cartoon Squash-and-Stretch on All 35 Clickers!
    for (let i = 0; i < clickers.length; i++) {
      const k = clickers[i];

      if (k.waveDelay >= 0) {
        k.waveDelay -= dt;
        if (k.waveDelay < 0) {
          pressClicker(k, { silentWave: true, hold: false });
        }
      }

      if (k.xrPokeCooldown > 0) k.xrPokeCooldown -= dt;

      const stiffness = k.isHeld ? 260 : 210;
      const damping = k.isHeld ? 22 : 14;
      const err = k.pressDepth - k.targetDepth;
      const acc = -stiffness * err - damping * k.pressVel;
      k.pressVel += acc * dt;
      k.pressDepth += k.pressVel * dt;

      const clamped = Math.max(-0.045, Math.min(0.25, k.pressDepth));
      const hoverLift = k.hovered && !k.isHeld ? 0.025 : 0;
      const idleBob = Math.sin(simTime * 2.1 + k.idleSeed) * 0.006;

      k.capPivot.position.y = k.restY - clamped + hoverLift + idleBob;

      const squashXZ = 1.0 + clamped * 0.28;
      const squashY = 1.0 - clamped * 0.24;
      k.capPivot.scale.set(squashXZ, squashY, squashXZ);

      if (k.wiggleAmp > 0.002) {
        k.wigglePhase += dt * 26;
        k.capPivot.rotation.z = Math.sin(k.wigglePhase) * k.wiggleAmp;
        k.capPivot.rotation.x = Math.cos(k.wigglePhase * 0.8) * k.wiggleAmp * 0.45;
        k.wiggleAmp = Math.max(0, k.wiggleAmp - dt * 0.26);
      } else {
        k.capPivot.rotation.z *= 0.85;
        k.capPivot.rotation.x *= 0.85;
      }

      if (k.ledGlowEnergy > 0.005) {
        k.ledGlowEnergy = Math.max(0, k.ledGlowEnergy - dt * 1.9);
      }
      const baseGlow = k.hovered ? 0.42 : 0.18;
      k.ledMat.opacity = Math.min(0.95, baseGlow + k.ledGlowEnergy * 0.78);
      k.capMat.emissiveIntensity = 0.03 + k.ledGlowEnergy * 0.24 + (k.hovered ? 0.06 : 0);
    }

    // 5. Pooled Floating 3D Sparkles & Hearts Particles (despawned back to pool — zero dispose!)
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const mesh = activeParticles[i];
      const ud = mesh.userData;
      ud.age += dt;
      if (ud.age >= ud.maxAge) {
        graphicsPool.despawnParticle(mesh);
        activeParticles.splice(i, 1);
      } else {
        ud.vel.y -= 5.2 * dt;
        mesh.position.addScaledVector(ud.vel, dt);
        mesh.rotation.x += ud.spin.x * dt;
        mesh.rotation.y += ud.spin.y * dt;
        mesh.rotation.z += ud.spin.z * dt;
        const life = 1 - ud.age / ud.maxAge;
        ud.mat.opacity = Math.min(1, life * 1.4);
        mesh.scale.setScalar(Math.max(0.01, life * 0.95));
      }
    }

    // 6. XR Controllers + Hand-Tracking Fingertip Physical Poke Detection!
    if (state.isInXR) {
      for (let i = 0; i < xrControllers.length; i++) {
        const xc = xrControllers[i];
        const hit = raycastFromXRController(xc.controller);
        if (xc.reticle) {
          if (hit) {
            xc.reticle.visible = true;
            xc.reticle.position.set(0, 0, -hit.distance);
          } else {
            xc.reticle.visible = false;
          }
        }
      }

      for (let h = 0; h < xrHands.length; h++) {
        const hand = xrHands[h];
        const indexTip = hand.joints && hand.joints['index-finger-tip'];
        if (indexTip && indexTip.visible) {
          indexTip.getWorldPosition(tempFingerPos);
          for (let k = 0; k < clickers.length; k++) {
            const entry = clickers[k];
            if (entry.xrPokeCooldown > 0) continue;
            entry.capPivot.getWorldPosition(tempKeyPos);
            if (tempFingerPos.distanceTo(tempKeyPos) < 0.055) {
              entry.xrPokeCooldown = 0.28;
              pressClicker(entry, { hold: false });
              setTimeout(() => audio.playKeyUp(entry.row, entry.col, NUM_COLS), 70);
            }
          }
        }
      }
    } else {
      controls.update();
    }

    renderer.render(scene, camera);
  });
})();
