/**
 * Calm Chess Games — Addy's Walmart Store Clerk XR (Meshy 3D Edition)
 * Duplicated from addy_models.js and upgraded with 25 Meshy-generated 3D GLB & PBR Texture Assets!
 * All Meshy models & PBR textures live in:
 *   ../meshy_test_0/models/<model_name>/<model_name>.glb
 *   ../meshy_test_0/models/<model_name>/<model_name>_textures/
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MESHY_MODEL_BASE = '../meshy_test_0/models';

export const ITEM_TYPES = {
  NEEDOH: 'needoh',
  SQUISHY: 'squishy',
  CLICKER: 'clicker',
  CUP: 'cup',
  SWEATSHIRT_KIDS: 'sweatshirt_kids',
  SWEATSHIRT_ADULT: 'sweatshirt_adult'
};

export const ITEM_LIST = [
  ITEM_TYPES.NEEDOH,
  ITEM_TYPES.SQUISHY,
  ITEM_TYPES.CLICKER,
  ITEM_TYPES.CUP,
  ITEM_TYPES.SWEATSHIRT_KIDS,
  ITEM_TYPES.SWEATSHIRT_ADULT
];

export const ITEM_META = {
  [ITEM_TYPES.NEEDOH]: {
    label: 'NeeDoh',
    price: 4.97,
    colorHex: 0x38d9c0,
    accentHex: 0xc084fc,
    bayColor: '#0d9488',
    meshyKey: 'addy_needoh'
  },
  [ITEM_TYPES.SQUISHY]: {
    label: 'Squishy',
    price: 7.48,
    colorHex: 0xff7eb6,
    accentHex: 0xffe066,
    bayColor: '#db2777',
    meshyKey: 'addy_squishy'
  },
  [ITEM_TYPES.CLICKER]: {
    label: 'Clicker',
    price: 5.88,
    colorHex: 0xa855f7,
    accentHex: 0x38bdf8,
    bayColor: '#7c3aed',
    meshyKey: 'addy_clicker'
  },
  [ITEM_TYPES.CUP]: {
    label: 'Tumbler Cup',
    price: 16.97,
    colorHex: 0x38bdf8,
    accentHex: 0xf472b6,
    bayColor: '#0284c7',
    meshyKey: 'addy_cup'
  },
  [ITEM_TYPES.SWEATSHIRT_KIDS]: {
    label: 'Kids Sweatshirt',
    price: 14.98,
    colorHex: 0xfb923c,
    accentHex: 0xfef08a,
    bayColor: '#ea580c',
    meshyKey: 'addy_sweatshirt_kids'
  },
  [ITEM_TYPES.SWEATSHIRT_ADULT]: {
    label: 'Adult Sweatshirt',
    price: 22.98,
    colorHex: 0x2563eb,
    accentHex: 0xe2e8f0,
    bayColor: '#1d4ed8',
    meshyKey: 'addy_sweatshirt_adult'
  }
};

export const LOST_KID_NAMES = [
  'Maya', 'Leo', 'Chloe', 'Lucas', 'Zoe', 'Noah',
  'Mia', 'Liam', 'Lily', 'Ethan', 'Ava', 'Oliver',
  'Sofia', 'Mason', 'Harper', 'Jack', 'Bella', 'Owen',
  'Layla', 'Grayson'
];

// 10 Walmart Aisles configuration (5 on Left, 5 on Right)
export const AISLE_CONFIGS = [
  { num: 1, title: 'AISLE 1', subtitle: 'NEEDOHS', side: -1, z: 1.8, types: [ITEM_TYPES.NEEDOH], color: '#0d9488' },
  { num: 2, title: 'AISLE 2', subtitle: 'SQUISHIES', side: -1, z: -2.2, types: [ITEM_TYPES.SQUISHY], color: '#db2777' },
  { num: 3, title: 'AISLE 3', subtitle: 'CLICKERS', side: -1, z: -6.2, types: [ITEM_TYPES.CLICKER], color: '#7c3aed' },
  { num: 4, title: 'AISLE 4', subtitle: 'CUPS', side: -1, z: -10.2, types: [ITEM_TYPES.CUP], color: '#0284c7' },
  { num: 5, title: 'AISLE 5', subtitle: 'KIDS SWEATSHIRTS', side: -1, z: -14.2, types: [ITEM_TYPES.SWEATSHIRT_KIDS], color: '#ea580c' },

  { num: 6, title: 'AISLE 6', subtitle: 'ADULT SWEATSHIRTS', side: 1, z: 1.8, types: [ITEM_TYPES.SWEATSHIRT_ADULT], color: '#1d4ed8' },
  { num: 7, title: 'AISLE 7', subtitle: 'MEGA NEEDOHS', side: 1, z: -2.2, types: [ITEM_TYPES.NEEDOH], color: '#0f766e' },
  { num: 8, title: 'AISLE 8', subtitle: 'JUMBO SQUISHIES', side: 1, z: -6.2, types: [ITEM_TYPES.SQUISHY], color: '#be185d' },
  { num: 9, title: 'AISLE 9', subtitle: 'CLICKERS & CUPS', side: 1, z: -10.2, types: [ITEM_TYPES.CLICKER, ITEM_TYPES.CUP], color: '#0369a1' },
  { num: 10, title: 'AISLE 10', subtitle: 'KIDS & ADULT HOODIES', side: 1, z: -14.2, types: [ITEM_TYPES.SWEATSHIRT_KIDS, ITEM_TYPES.SWEATSHIRT_ADULT], color: '#1e40af' }
];

// ---------------------------------------------------------------------------
// Meshy 3D Asset Manifest & GLTF Preloader / Normalizer
// ---------------------------------------------------------------------------

export const MESHY_ASSET_SPECS = {
  // 6 Stockable Items
  addy_needoh:           { targetHeight: 0.29, maxHorizontal: 0.30 },
  addy_squishy:          { targetHeight: 0.35, maxHorizontal: 0.36 },
  addy_clicker:          { targetHeight: 0.18, maxHorizontal: 0.28 },
  addy_cup:              { targetHeight: 0.40, maxHorizontal: 0.28 },
  addy_sweatshirt_kids:  { targetHeight: 0.24, maxHorizontal: 0.36, alignLongAxis: 'x' },
  addy_sweatshirt_adult: { targetHeight: 0.28, maxHorizontal: 0.44, alignLongAxis: 'x' },
  // 3 Characters
  addy_lost_kid:         { targetHeight: 1.12, maxHorizontal: 0.72 },
  addy_parent:           { targetHeight: 1.70, maxHorizontal: 0.88 },
  addy_shopper:          { targetHeight: 1.66, maxHorizontal: 0.88 },
  // 4 Core Props & Rewards
  addy_free_food_tray:   { targetHeight: 0.24, maxHorizontal: 0.68, alignLongAxis: 'x' },
  addy_tip_100k:         { targetHeight: 0.24, maxHorizontal: 0.34, alignLongAxis: 'x' },
  addy_store_keys:       { targetHeight: 0.22, maxHorizontal: 0.18, centerY: true },
  addy_shopping_bag:     { targetHeight: 0.42, maxHorizontal: 0.36 },
  // 4 Breakroom Lunch Items
  addy_lunch_pizza:      { targetHeight: 0.10, maxHorizontal: 0.36 },
  addy_lunch_boba:       { targetHeight: 0.30, maxHorizontal: 0.20 },
  addy_lunch_donut:      { targetHeight: 0.10, maxHorizontal: 0.24 },
  addy_lunch_burger:     { targetHeight: 0.18, maxHorizontal: 0.24 },
  // 8 Vehicles, Fixtures & Environment Props
  addy_parked_car:       { targetHeight: 1.58, maxHorizontal: 4.15, alignLongAxis: 'z' },
  addy_shopping_cart:    { targetHeight: 1.02, maxHorizontal: 1.02, alignLongAxis: 'z' },
  addy_stock_cart:       { targetHeight: 1.56, maxHorizontal: 1.72, alignLongAxis: 'x' },
  addy_pa_microphone:    { targetHeight: 0.64, maxHorizontal: 0.42 },
  addy_cash_register:    { targetHeight: 0.68, maxHorizontal: 0.72 },
  addy_tree:             { targetHeight: 5.20, maxHorizontal: 3.90 },
  addy_bistro_table:     { targetHeight: 0.90, maxHorizontal: 1.85 },
  addy_bar_stool:        { targetHeight: 0.62, maxHorizontal: 0.56 }
};

const meshyTemplates = new Map();
const meshyLoadStatus = {
  total: Object.keys(MESHY_ASSET_SPECS).length,
  loaded: 0,
  failed: []
};

export function getMeshyModelUrl(key) {
  return `${MESHY_MODEL_BASE}/${key}/${key}.glb`;
}

export function getMeshyTexturesDir(key) {
  return `${MESHY_MODEL_BASE}/${key}/${key}_textures`;
}

const SHADOW_CASTER_KEYS = new Set([
  'addy_lost_kid',
  'addy_parent',
  'addy_shopper',
  'addy_parked_car',
  'addy_shopping_cart',
  'addy_stock_cart',
  'addy_tree',
  'addy_bistro_table',
  'addy_bar_stool'
]);

function normalizeMeshyScene(rawScene, key, spec) {
  rawScene.updateMatrixWorld(true);

  // Auto-align long horizontal axis if requested (prevents sideways cars/carts!)
  if (spec.alignLongAxis === 'x' || spec.alignLongAxis === 'z') {
    const preBox = new THREE.Box3().setFromObject(rawScene);
    const preSize = new THREE.Vector3();
    preBox.getSize(preSize);
    if (spec.alignLongAxis === 'z' && preSize.x > preSize.z * 1.15) {
      rawScene.rotation.y += Math.PI / 2;
      rawScene.updateMatrixWorld(true);
    } else if (spec.alignLongAxis === 'x' && preSize.z > preSize.x * 1.15) {
      rawScene.rotation.y += Math.PI / 2;
      rawScene.updateMatrixWorld(true);
    }
  }

  if (spec.rotY) {
    rawScene.rotation.y += spec.rotY;
    rawScene.updateMatrixWorld(true);
  }

  const box = new THREE.Box3().setFromObject(rawScene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  let scale = spec.targetHeight / Math.max(size.y, 1e-4);
  if (spec.maxHorizontal) {
    const horizMax = Math.max(size.x, size.z, 1e-4);
    scale = Math.min(scale, spec.maxHorizontal / horizMax);
  }

  rawScene.scale.multiplyScalar(scale);
  rawScene.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(rawScene);
  const finalCenter = new THREE.Vector3();
  const finalSize = new THREE.Vector3();
  finalBox.getCenter(finalCenter);
  finalBox.getSize(finalSize);

  rawScene.position.x -= finalCenter.x;
  rawScene.position.z -= finalCenter.z;
  if (spec.centerY) {
    rawScene.position.y -= finalCenter.y;
  } else {
    rawScene.position.y -= finalBox.min.y;
  }

  const texDirRel = `./meshy_test_0/models/${key}/${key}_textures`;
  const shouldCastShadow = SHADOW_CASTER_KEYS.has(key);
  rawScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = shouldCastShadow;
      child.receiveShadow = true;
      child.userData.meshyAsset = key;
      child.userData.meshyTexturesDir = texDirRel;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (!m) continue;
        m.userData = m.userData || {};
        m.userData.meshyAsset = key;
        m.userData.meshyTexturesDir = texDirRel;
        // Ensure vibrant readability under Walmart store lighting + RoomEnvironment
        if (typeof m.envMapIntensity === 'number') {
          m.envMapIntensity = 1.15;
        }
        if (m.map) {
          m.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    }
  });

  const wrapper = new THREE.Group();
  wrapper.name = `meshy_${key}`;
  wrapper.add(rawScene);
  wrapper.userData = {
    meshyAsset: key,
    meshyModelPath: `./meshy_test_0/models/${key}/${key}.glb`,
    meshyTexturesDir: texDirRel,
    normalizedSize: { x: finalSize.x, y: finalSize.y, z: finalSize.z }
  };
  return wrapper;
}

export async function preloadMeshyAssets(onProgress = null) {
  const loader = new GLTFLoader();
  const entries = Object.entries(MESHY_ASSET_SPECS);
  meshyLoadStatus.total = entries.length;
  meshyLoadStatus.loaded = 0;
  meshyLoadStatus.failed = [];

  let completed = 0;
  const loadOne = ([key, spec]) => new Promise((resolve) => {
    const url = getMeshyModelUrl(key);
    loader.load(
      url,
      (gltf) => {
        try {
          const normalized = normalizeMeshyScene(gltf.scene, key, spec);
          meshyTemplates.set(key, normalized);
          meshyLoadStatus.loaded++;
        } catch (err) {
          console.warn(`[Addy2Meshy] Normalization failed for ${key}:`, err);
          meshyLoadStatus.failed.push(key);
        }
        completed++;
        if (onProgress) onProgress(completed, entries.length, key);
        resolve();
      },
      undefined,
      (err) => {
        console.warn(`[Addy2Meshy] Failed to load ${url}:`, err);
        meshyLoadStatus.failed.push(key);
        completed++;
        if (onProgress) onProgress(completed, entries.length, key);
        resolve();
      }
    );
  });

  // Load with concurrency of 6 for crisp parallel HTTP/2 fetching
  const queue = [...entries];
  const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next) await loadOne(next);
    }
  });
  await Promise.all(workers);

  return {
    loadedCount: meshyLoadStatus.loaded,
    totalCount: meshyLoadStatus.total,
    failedKeys: [...meshyLoadStatus.failed],
    keys: Array.from(meshyTemplates.keys())
  };
}

export function getMeshyAssetStatus() {
  return {
    loaded: meshyLoadStatus.loaded,
    total: meshyLoadStatus.total,
    failed: [...meshyLoadStatus.failed],
    templateKeys: Array.from(meshyTemplates.keys())
  };
}

/**
 * Clones a pre-loaded Meshy GLB template while sharing GPU geometries & textures.
 * Optionally applies a gentle color tint (cloning only the material shell, keeping textures shared).
 */
export function cloneMeshyTemplate(key, { tintHex = null, tintStrength = 0.0, scaleMultiplier = 1.0 } = {}) {
  const proto = meshyTemplates.get(key);
  if (!proto) {
    // Graceful safety fallback if a single asset failed to download
    const fallback = new THREE.Group();
    const spec = MESHY_ASSET_SPECS[key] || { targetHeight: 0.35 };
    const h = spec.targetHeight || 0.35;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(h * 0.7, h, h * 0.7),
      new THREE.MeshStandardMaterial({ color: tintHex || 0x0071ce, roughness: 0.5 })
    );
    mesh.position.y = spec.centerY ? 0 : h / 2;
    fallback.add(mesh);
    fallback.userData = { meshyAsset: key, isFallback: true };
    return fallback;
  }

  const clone = proto.clone(true);
  clone.userData = {
    ...proto.userData,
    meshyAsset: key,
    isMeshyModel: true
  };

  if (scaleMultiplier !== 1.0) {
    clone.scale.multiplyScalar(scaleMultiplier);
  }

  if (tintHex !== null && tintStrength > 0.001) {
    const tintColor = new THREE.Color(tintHex);
    clone.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const applyTint = (mat) => {
        const m = mat.clone();
        if (m.color) {
          m.color.lerp(tintColor, tintStrength);
        }
        return m;
      };
      child.material = Array.isArray(child.material)
        ? child.material.map(applyTint)
        : applyTint(child.material);
    });
  }

  return clone;
}

// ---------------------------------------------------------------------------
// Dynamic Canvas Texture Helpers (Signs, Clocks, Floor, Asphalt, POS, Name Tags)
// ---------------------------------------------------------------------------

export function createStoreFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');

  g.fillStyle = '#eceff3';
  g.fillRect(0, 0, 512, 512);

  const step = 128;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      g.fillStyle = (x + y) % 2 === 0 ? '#f3f5f8' : '#e8ecf1';
      g.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
      for (let s = 0; s < 14; s++) {
        const sx = x * step + 8 + Math.random() * (step - 16);
        const sy = y * step + 8 + Math.random() * (step - 16);
        g.fillStyle = s % 4 === 0 ? 'rgba(0, 113, 206, 0.05)' : 'rgba(100, 116, 139, 0.08)';
        g.fillRect(sx, sy, 3, 3);
      }
    }
  }

  g.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * step);
    g.lineTo(512, i * step);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 12);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');

  g.fillStyle = '#333b47';
  g.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 38 + Math.floor(Math.random() * 38);
    g.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
    g.fillRect(x, y, 2.5, 2.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createConveyorTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');

  g.fillStyle = '#1e293b';
  g.fillRect(0, 0, 256, 256);

  g.fillStyle = '#334155';
  for (let y = 0; y < 256; y += 32) {
    g.fillRect(0, y, 256, 10);
  }
  g.fillStyle = 'rgba(255, 194, 32, 0.35)';
  g.fillRect(10, 0, 8, 256);
  g.fillRect(238, 0, 8, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function drawWalmartSpark(g, cx, cy, r, color = '#ffc220') {
  g.save();
  g.translate(cx, cy);
  g.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i * Math.PI) / 3);
    g.beginPath();
    g.roundRect(-r * 0.14, -r, r * 0.28, r * 0.56, r * 0.14);
    g.fill();
    g.restore();
  }
  g.restore();
}

export function createWalmartSignTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d');

  g.fillStyle = '#0071ce';
  g.fillRect(0, 0, 1024, 256);

  g.strokeStyle = '#ffc220';
  g.lineWidth = 10;
  g.strokeRect(10, 10, 1004, 236);

  g.fillStyle = '#ffffff';
  g.font = '900 132px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('Walmart', 415, 134);

  drawWalmartSpark(g, 825, 128, 76, '#ffc220');

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSignTexture(title, subtitle = '', bgHex = '#0071ce', textHex = '#ffffff', accentHex = '#ffc220') {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 256;
  const g = c.getContext('2d');

  g.fillStyle = bgHex;
  g.fillRect(0, 0, 768, 256);

  g.strokeStyle = accentHex;
  g.lineWidth = 12;
  g.strokeRect(10, 10, 748, 236);

  g.fillStyle = textHex;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '900 72px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
  g.fillText(title, 384, subtitle ? 98 : 132);

  if (subtitle) {
    g.font = '800 44px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
    g.fillStyle = accentHex;
    g.fillText(subtitle, 384, 184);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNameBadgeTexture() {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 400;
  const g = c.getContext('2d');

  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 640, 400);

  g.fillStyle = '#0071ce';
  g.fillRect(0, 0, 640, 154);

  g.fillStyle = '#ffc220';
  g.fillRect(0, 358, 640, 42);

  drawWalmartSpark(g, 84, 78, 44, '#ffc220');

  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = '900 66px "Segoe UI", system-ui, sans-serif';
  g.fillText('HELLO', 360, 76);
  g.font = '700 34px "Segoe UI", system-ui, sans-serif';
  g.fillText('my name is', 360, 128);

  g.fillStyle = '#0f172a';
  g.font = '900 132px "Comic Sans MS", "Chalkboard SE", "Segoe UI Rounded", cursive, sans-serif';
  g.fillText('Addy', 320, 282);

  g.strokeStyle = '#004f9a';
  g.lineWidth = 14;
  g.strokeRect(7, 7, 626, 386);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function updateNameTagSprite(sprite, name, bgHex = '#ffc220', textHex = '#0f172a') {
  if (!sprite || !sprite.material) return;
  let canvas = sprite.userData && sprite.userData._canvas;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    sprite.userData = sprite.userData || {};
    sprite.userData._canvas = canvas;
  }
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 512, 160);
  g.fillStyle = bgHex;
  g.beginPath();
  g.roundRect(14, 18, 484, 124, 48);
  g.fill();
  g.strokeStyle = '#ffffff';
  g.lineWidth = 10;
  g.stroke();

  g.fillStyle = textHex;
  const fontSize = name.length > 14 ? 44 : (name.length > 10 ? 54 : 68);
  g.font = `900 ${fontSize}px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, 256, 82, 444);

  if (sprite.material.map && sprite.material.map.image === canvas) {
    sprite.material.map.needsUpdate = true;
  } else {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    sprite.material.map = tex;
    sprite.material.needsUpdate = true;
  }
}

export function createNameTagSprite(name, bgHex = '#ffc220', textHex = '#0f172a') {
  const mat = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.15, 0.36, 1);
  updateNameTagSprite(sprite, name, bgHex, textHex);
  return sprite;
}

// ---------------------------------------------------------------------------
// Walmart Parking Lot + Store Architecture + Meshy Cars, Carts & Trees!
// ---------------------------------------------------------------------------

export function createWalmartEnvironment() {
  const group = new THREE.Group();

  // ---- Dynamic Sky Dome, Sun, Moon & Stars ----
  const skyGroup = new THREE.Group();
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3a1 })
  );
  sunMesh.position.set(18, 28, 36);
  skyGroup.add(sunMesh);

  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
  );
  moonMesh.position.set(-18, -10, 36);
  skyGroup.add(moonMesh);

  // Fluffy daytime clouds
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Group();
    const cx = -32 + i * 9.5 + (i % 2) * 3;
    const cy = 17 + (i % 3) * 3.5;
    const cz = 26 + (i % 4) * 7;
    for (let p = 0; p < 3; p++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.9 + (p === 1 ? 0.7 : 0), 12, 10), cloudMat);
      puff.position.set((p - 1) * 1.8, p === 1 ? 0.5 : 0, 0);
      puff.scale.set(1.2, 0.7, 0.9);
      cloud.add(puff);
    }
    cloud.position.set(cx, cy, cz);
    cloudGroup.add(cloud);
  }
  skyGroup.add(cloudGroup);

  // Starfield (fades in at night!)
  const starGeo = new THREE.BufferGeometry();
  const starPts = [];
  for (let i = 0; i < 180; i++) {
    const sx = (Math.random() - 0.5) * 90;
    const sy = 12 + Math.random() * 28;
    const sz = 18 + Math.random() * 40;
    starPts.push(sx, sy, sz);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0 });
  const stars = new THREE.Points(starGeo, starMat);
  skyGroup.add(stars);
  group.add(skyGroup);

  // ---- Walmart Interior Floor (x: -19..19, z: -18..12) ----
  const floorTex = createStoreFloorTexture();
  const interiorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 30),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.32, metalness: 0.05 })
  );
  interiorFloor.rotation.x = -Math.PI / 2;
  interiorFloor.position.set(0, 0, -3);
  interiorFloor.receiveShadow = true;
  interiorFloor.userData = { isFloor: true };
  group.add(interiorFloor);

  // Action Alley blue guide strips
  const alleyStripMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.4 });
  [-2.6, 2.6].forEach((sx) => {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 24), alleyStripMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(sx, 0.004, -4);
    group.add(strip);
  });

  // ---- Outside Parking Lot Asphalt (x: -36..36, z: 12..40) ----
  const asphaltTex = createAsphaltTexture();
  const parkingLot = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 30),
    new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.92, metalness: 0.02 })
  );
  parkingLot.rotation.x = -Math.PI / 2;
  parkingLot.position.set(0, -0.01, 27);
  parkingLot.receiveShadow = true;
  parkingLot.userData = { isFloor: true };
  group.add(parkingLot);

  // Concrete Sidewalk Apron right outside front doors (z: 12..15.2)
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.08, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.78 })
  );
  sidewalk.position.set(0, 0.02, 13.6);
  sidewalk.receiveShadow = true;
  sidewalk.userData = { isFloor: true };
  group.add(sidewalk);

  // Yellow Curb edge
  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.1, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.65 })
  );
  curb.position.set(0, 0.03, 15.16);
  group.add(curb);

  // White Zebra Crosswalk straight to Walmart front doors
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  for (let i = 0; i < 6; i++) {
    const zStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 3.8), stripeMat);
    zStripe.rotation.x = -Math.PI / 2;
    zStripe.position.set(-2.2 + i * 0.88, 0.015, 17.5);
    group.add(zStripe);
  }

  // Painted Parking Stall Lines
  for (let row = 0; row < 2; row++) {
    const rz = row === 0 ? 22.8 : 30.2;
    for (let s = -16; s <= 16; s += 3.4) {
      if (Math.abs(s) < 3.5) continue;
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 4.8), stripeMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(s, 0.012, rz);
      group.add(line);
    }
  }

  // Blue & Yellow Safety Bollards flanking entrance
  const bollardGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.0, 12);
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.35 });
  const bollardCapMat = new THREE.MeshStandardMaterial({ color: 0xffc220, roughness: 0.3 });
  [-3.8, -2.5, 2.5, 3.8, -7.2, 7.2].forEach((bx) => {
    const b = new THREE.Mesh(bollardGeo, bollardMat);
    b.position.set(bx, 0.52, 14.85);
    b.castShadow = true;
    group.add(b);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 8), bollardCapMat);
    cap.position.set(bx, 1.02, 14.85);
    group.add(cap);
  });

  // ---- Meshy 3D Parked Cars in Walmart Parking Lot (including Addy's Sparkly Car!) ----
  const parkedCars = [];
  const carConfigs = [
    { x: 7.4, z: 22.8, rot: Math.PI, color: 0x0071ce, isAddy: true },
    { x: -7.4, z: 22.8, rot: Math.PI, color: 0xef4444, isAddy: false },
    { x: -10.8, z: 22.8, rot: Math.PI, color: 0xf8fafc, isAddy: false },
    { x: 10.8, z: 22.8, rot: Math.PI, color: 0x22c55e, isAddy: false },
    { x: 14.2, z: 22.8, rot: Math.PI, color: 0xf59e0b, isAddy: false },
    { x: -14.2, z: 22.8, rot: Math.PI, color: 0x8b5cf6, isAddy: false },
    { x: -7.4, z: 30.2, rot: 0, color: 0x0ea5e9, isAddy: false },
    { x: 10.8, z: 30.2, rot: 0, color: 0xec4899, isAddy: false }
  ];

  let addyCar = null;
  for (const cfg of carConfigs) {
    const car = createParkedCar(cfg.color, cfg.isAddy);
    car.group.position.set(cfg.x, 0, cfg.z);
    car.group.rotation.y = cfg.rot;
    group.add(car.group);
    parkedCars.push(car);
    if (cfg.isAddy) addyCar = car;
  }

  // ---- Parking Lot Shopping Cart Corral (with Meshy 3D Shopping Carts!) ----
  const corral = new THREE.Group();
  corral.position.set(-4.2, 0, 22.8);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, metalness: 0.4, roughness: 0.35 });
  [-0.85, 0.85].forEach((rx) => {
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.2), railMat);
    topRail.position.set(rx, 0.95, 0);
    corral.add(topRail);
    [-1.9, 0, 1.9].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 8), railMat);
      post.position.set(rx, 0.48, pz);
      corral.add(post);
    });
  });
  const corralSign = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.55, 0.08),
    new THREE.MeshBasicMaterial({ map: createSignTexture('CARTS', '', '#0071ce', '#ffffff', '#ffc220') })
  );
  corralSign.position.set(0, 1.45, -2.0);
  corral.add(corralSign);

  // 3 Meshy 3D Shopping Carts lined inside the corral!
  for (let c = 0; c < 3; c++) {
    const cartModel = cloneMeshyTemplate('addy_shopping_cart');
    cartModel.position.set(0, 0, -1.15 + c * 0.82);
    corral.add(cartModel);
  }
  group.add(corral);

  // ---- Parking Lot Streetlamps (glow warmly at night!) ----
  const streetLampBulbs = [];
  const streetLampLights = [];
  [[-12, 18.5], [12, 18.5], [-12, 27.5], [12, 27.5]].forEach(([lx, lz]) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 6.8, 10),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.45 })
    );
    pole.position.set(lx, 3.4, lz);
    group.add(pole);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.15
    });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.45), bulbMat);
    head.position.set(lx, 6.75, lz);
    group.add(head);
    streetLampBulbs.push(bulbMat);

    if (lz < 22) {
      const pl = new THREE.PointLight(0xfff1c1, 0.0, 22);
      pl.position.set(lx, 6.2, lz);
      group.add(pl);
      streetLampLights.push(pl);
    }
  });

  // ---- Meshy 3D Curbside Trees ----
  [[-18.5, 16.5], [18.5, 16.5], [-20, 26], [20, 26]].forEach(([tx, tz], idx) => {
    const tree = cloneMeshyTemplate('addy_tree', {
      scaleMultiplier: 0.92 + (idx % 2) * 0.16
    });
    tree.position.set(tx, 0, tz);
    tree.rotation.y = idx * 1.4;
    group.add(tree);
  });

  // ---- Walmart Building Walls & Ceiling ----
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
  const blueBandMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.45 });
  const yellowBandMat = new THREE.MeshStandardMaterial({ color: 0xffc220, roughness: 0.35 });

  // Back wall (z = -18)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(38, 6.4, 0.5), wallMat);
  backWall.position.set(0, 3.2, -18);
  group.add(backWall);

  const backStripe = new THREE.Mesh(new THREE.BoxGeometry(37.6, 0.85, 0.12), blueBandMat);
  backStripe.position.set(0, 5.4, -17.7);
  group.add(backStripe);
  const backYellow = new THREE.Mesh(new THREE.BoxGeometry(37.6, 0.16, 0.14), yellowBandMat);
  backYellow.position.set(0, 4.92, -17.68);
  group.add(backYellow);

  // Left & Right side walls (x = -19, x = 19)
  [-19, 19].forEach((wx) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.4, 30.4), wallMat);
    sideWall.position.set(wx, 3.2, -3);
    group.add(sideWall);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 29.8), blueBandMat);
    stripe.position.set(wx > 0 ? wx - 0.28 : wx + 0.28, 5.4, -3);
    group.add(stripe);
  });

  // Ceiling & Bright LED Light Strips
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 30),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.3, -3);
  group.add(ceiling);

  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let lz = -15; lz <= 9; lz += 6) {
    for (let lx = -12; lx <= 12; lx += 8) {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.36), ledMat);
      fixture.position.set(lx, 6.18, lz);
      group.add(fixture);
    }
  }

  // ---- Front Storefront Wall (z = 12) with Big Glass Windows & Sliding Entrance Doors ----
  const frontGlassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.3,
    roughness: 0.14,
    metalness: 0.12
  });

  const facadeTop = new THREE.Mesh(new THREE.BoxGeometry(38.6, 3.2, 0.7), blueBandMat);
  facadeTop.position.set(0, 5.3, 12.1);
  group.add(facadeTop);

  const facadeAccent = new THREE.Mesh(new THREE.BoxGeometry(38.8, 0.28, 0.78), yellowBandMat);
  facadeAccent.position.set(0, 3.72, 12.14);
  group.add(facadeAccent);

  const walmartSign = new THREE.Mesh(
    new THREE.BoxGeometry(11.8, 2.45, 0.24),
    new THREE.MeshBasicMaterial({ map: createWalmartSignTexture() })
  );
  walmartSign.position.set(0, 5.45, 12.55);
  group.add(walmartSign);

  // Dynamic Exterior Status Marquee
  const marqueeCanvas = document.createElement('canvas');
  marqueeCanvas.width = 768;
  marqueeCanvas.height = 160;
  const marqueeCtx = marqueeCanvas.getContext('2d');
  const marqueeTex = new THREE.CanvasTexture(marqueeCanvas);
  marqueeTex.colorSpace = THREE.SRGBColorSpace;
  const marqueeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.88, 0.14),
    new THREE.MeshBasicMaterial({ map: marqueeTex })
  );
  marqueeMesh.position.set(0, 3.18, 12.48);
  group.add(marqueeMesh);

  function updateStoreMarquee(text, bgHex = '#15803d', accentHex = '#fef08a') {
    marqueeCtx.fillStyle = bgHex;
    marqueeCtx.fillRect(0, 0, 768, 160);
    marqueeCtx.strokeStyle = accentHex;
    marqueeCtx.lineWidth = 10;
    marqueeCtx.strokeRect(8, 8, 752, 144);
    marqueeCtx.fillStyle = '#ffffff';
    marqueeCtx.font = '900 46px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
    marqueeCtx.textAlign = 'center';
    marqueeCtx.textBaseline = 'middle';
    marqueeCtx.fillText(text, 384, 84, 700);
    marqueeTex.needsUpdate = true;
  }
  updateStoreMarquee('OPEN 11:30 AM • WELCOME!', '#15803d', '#fef08a');

  [-10.5, 10.5].forEach((fx) => {
    const kick = new THREE.Mesh(new THREE.BoxGeometry(17.0, 0.9, 0.35), wallMat);
    kick.position.set(fx, 0.45, 12);
    group.add(kick);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(17.0, 2.75, 0.14), frontGlassMat);
    glass.position.set(fx, 2.28, 12);
    group.add(glass);
  });

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
  [-2.05, 2.05].forEach((dx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.65, 0.36), frameMat);
    post.position.set(dx, 1.82, 12);
    group.add(post);
  });

  const doorGlassMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.38,
    roughness: 0.12,
    metalness: 0.12
  });
  function buildSlidingDoor(xPos) {
    const dGroup = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.BoxGeometry(1.92, 3.2, 0.08), doorGlassMat);
    pane.position.y = 1.65;
    dGroup.add(pane);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.12, 0.12), frameMat);
    frameTop.position.y = 3.22;
    dGroup.add(frameTop);
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.22, 0.12), frameMat);
    frameBot.position.y = 0.11;
    dGroup.add(frameBot);
    const yellowStripe = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 0.1), yellowBandMat);
    yellowStripe.position.y = 1.25;
    dGroup.add(yellowStripe);
    dGroup.position.set(xPos, 0, 12);
    return dGroup;
  }
  const leftDoor = buildSlidingDoor(-0.98);
  const rightDoor = buildSlidingDoor(0.98);
  group.add(leftDoor, rightDoor);

  // Exterior Key Lock Panel (right next to front doors at x=2.26, z=12.24)
  const doorLockGroup = new THREE.Group();
  doorLockGroup.position.set(2.26, 1.35, 12.24);
  const lockPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.56, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 })
  );
  doorLockGroup.add(lockPlate);

  const lockCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
  );
  lockCylinder.rotation.x = Math.PI / 2;
  lockCylinder.position.z = 0.06;
  doorLockGroup.add(lockCylinder);

  const keySlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.09, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  keySlot.position.z = 0.125;
  doorLockGroup.add(keySlot);

  const lockIndicatorMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.8
  });
  const lockIndicator = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), lockIndicatorMat);
  lockIndicator.position.set(0, 0.18, 0.08);
  doorLockGroup.add(lockIndicator);

  const lockRingMat = new THREE.MeshBasicMaterial({
    color: 0xffc220,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const lockGlowRing = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.38, 28), lockRingMat);
  lockGlowRing.position.z = 0.09;
  doorLockGroup.add(lockGlowRing);

  doorLockGroup.userData = { interactable: true, kind: 'door_lock' };
  group.add(doorLockGroup);

  const exitPadMat = new THREE.MeshBasicMaterial({
    color: 0xffc220,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const exitPad = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.35, 32), exitPadMat);
  exitPad.rotation.x = -Math.PI / 2;
  exitPad.position.set(2.1, 0.07, 13.6);
  group.add(exitPad);

  return {
    group,
    leftDoor,
    rightDoor,
    doorLockGroup,
    lockCylinder,
    lockIndicatorMat,
    lockRingMat,
    exitPadMat,
    updateStoreMarquee,
    sunMesh,
    moonMesh,
    cloudGroup,
    starMat,
    streetLampBulbs,
    streetLampLights,
    addyCar
  };
}

function createParkedCar(colorHex, isAddy = false) {
  const group = new THREE.Group();
  const carMesh = cloneMeshyTemplate('addy_parked_car', {
    tintHex: colorHex,
    tintStrength: isAddy ? 0.52 : 0.42
  });
  group.add(carMesh);

  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfef08a,
    emissiveIntensity: isAddy ? 1.1 : 0.2
  });

  if (isAddy) {
    const tag = createNameTagSprite("Addy's Car", '#0071ce', '#ffc220');
    tag.position.set(0, 2.25, 0);
    tag.scale.set(1.5, 0.45, 1);
    group.add(tag);
  }

  return { group, headMat };
}

// ---------------------------------------------------------------------------
// 3D Store Digital Wall Clock
// ---------------------------------------------------------------------------

export function createStoreWallClock() {
  const group = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 256;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 1.5, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x004f9a, roughness: 0.4 })
  );
  group.add(frame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(4.1, 1.24),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  screen.position.z = 0.12;
  group.add(screen);

  function update(timeText, subText = 'WALMART • 11:30 AM – 11:46 AM', accentHex = '#ffc220') {
    g.fillStyle = '#07142b';
    g.fillRect(0, 0, 768, 256);
    g.strokeStyle = accentHex;
    g.lineWidth = 10;
    g.strokeRect(8, 8, 752, 240);

    g.fillStyle = accentHex;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 108px "Segoe UI", system-ui, sans-serif';
    g.fillText(timeText, 384, 108);

    g.fillStyle = '#e2e8f0';
    g.font = '800 34px "Segoe UI", system-ui, sans-serif';
    g.fillText(subText, 384, 204);
    tex.needsUpdate = true;
  }

  update('11:30 AM');
  return { group, update };
}

// ---------------------------------------------------------------------------
// 6 Meshy 3D Stockable Walmart Items!
// ---------------------------------------------------------------------------

const NEEDOH_TINTS = [0x38d9c0, 0xff6ec7, 0xfacc15, 0x818cf8, 0xfb7185, 0x4ade80];
const SQUISHY_TINTS = [0xff85c0, 0xfde047, 0xa78bfa, 0x67e8f9, 0xfda4af, 0x86efac];
const CUP_TINTS = [0x38bdf8, 0xf472b6, 0xa78bfa, 0x34d399, 0xfb923c, 0xfacc15];
const KIDS_HOODIE_TINTS = [0xff6b9d, 0x38bdf8, 0xfacc15, 0x4ade80, 0xc084fc];
const ADULT_HOODIE_TINTS = [0x1d4ed8, 0x0f766e, 0x475569, 0x7c3aed, 0xb91c1c];

export function createRestockItem(itemType, variantIndex = 0) {
  const group = new THREE.Group();
  const meta = ITEM_META[itemType];
  const meshyKey = meta ? meta.meshyKey : 'addy_needoh';

  let tintHex = null;
  let tintStrength = 0;

  if (itemType === ITEM_TYPES.NEEDOH && variantIndex % NEEDOH_TINTS.length !== 0) {
    tintHex = NEEDOH_TINTS[variantIndex % NEEDOH_TINTS.length];
    tintStrength = 0.28;
  } else if (itemType === ITEM_TYPES.SQUISHY && variantIndex % SQUISHY_TINTS.length !== 0) {
    tintHex = SQUISHY_TINTS[variantIndex % SQUISHY_TINTS.length];
    tintStrength = 0.24;
  } else if (itemType === ITEM_TYPES.CUP && variantIndex % CUP_TINTS.length !== 0) {
    tintHex = CUP_TINTS[variantIndex % CUP_TINTS.length];
    tintStrength = 0.28;
  } else if (itemType === ITEM_TYPES.SWEATSHIRT_KIDS && variantIndex % KIDS_HOODIE_TINTS.length !== 0) {
    tintHex = KIDS_HOODIE_TINTS[variantIndex % KIDS_HOODIE_TINTS.length];
    tintStrength = 0.30;
  } else if (itemType === ITEM_TYPES.SWEATSHIRT_ADULT && variantIndex % ADULT_HOODIE_TINTS.length !== 0) {
    tintHex = ADULT_HOODIE_TINTS[variantIndex % ADULT_HOODIE_TINTS.length];
    tintStrength = 0.26;
  }

  const model = cloneMeshyTemplate(meshyKey, { tintHex, tintStrength });
  group.add(model);

  group.userData = {
    itemType,
    meshyAsset: meshyKey,
    meshyTexturesDir: `./meshy_test_0/models/${meshyKey}/${meshyKey}_textures`,
    isMeshyModel: true,
    modelRoot: model
  };
  return group;
}

// ---------------------------------------------------------------------------
// 10 Numbered Walmart Aisles (Gondola Bays + Overhead Hanging Aisle Signs)
// ---------------------------------------------------------------------------

export function createWalmartAisleBay(config) {
  const group = new THREE.Group();
  const xPos = config.side < 0 ? -8.6 : 8.6;
  group.position.set(xPos, 0, config.z);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.18 });
  const accentMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.4 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.4 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 1.0), trimMat);
  base.position.y = 0.12;
  base.receiveShadow = true;
  group.add(base);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(4.74, 2.1, 0.1), metalMat);
  spine.position.y = 1.22;
  group.add(spine);

  const header = new THREE.Mesh(new THREE.BoxGeometry(4.82, 0.22, 0.22), accentMat);
  header.position.y = 2.32;
  group.add(header);

  const signTex = createSignTexture(config.title, config.subtitle, '#0071ce', '#ffffff', '#ffc220');
  const hangSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.84, 0.12),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  hangSign.position.set(config.side < 0 ? 2.55 : -2.55, 3.65, 0);
  hangSign.rotation.y = config.side < 0 ? Math.PI / 2 : -Math.PI / 2;
  group.add(hangSign);

  const bayBanner = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.68, 0.1),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  bayBanner.position.set(0, 2.86, 0);
  group.add(bayBanner);

  const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 6);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  [-0.9, 0.9].forEach((wx) => {
    const w = new THREE.Mesh(wireGeo, wireMat);
    w.position.set(config.side < 0 ? 2.55 : -2.55, 5.05, wx);
    group.add(w);
  });

  const shelfHeights = [0.68, 1.24, 1.8];
  shelfHeights.forEach((sy) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.76, 0.07, 0.96), metalMat);
    plank.position.y = sy;
    plank.receiveShadow = true;
    group.add(plank);

    [-0.49, 0.49].forEach((sz) => {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(4.76, 0.055, 0.03), trimMat);
      lip.position.set(0, sy - 0.01, sz);
      group.add(lip);
    });
  });

  const slots = [];
  const slotXPositions = [-1.65, -0.55, 0.55, 1.65];

  // Decorative pre-stocked Meshy items on top & back shelves
  slotXPositions.forEach((sx, idx) => {
    const type = config.types[idx % config.types.length];
    const decoFront = createRestockItem(type, idx + config.num);
    decoFront.position.set(sx, 1.84, 0.28);
    group.add(decoFront);

    const decoBack = createRestockItem(type, idx + config.num + 2);
    decoBack.position.set(sx, 1.28, -0.28);
    decoBack.rotation.y = Math.PI;
    group.add(decoBack);
  });

  // 4 Interactive Restock Slots (facing +Z towards shopper aisle)
  slotXPositions.forEach((sx, idx) => {
    const itemType = config.types[idx % config.types.length];
    const sy = idx % 2 === 0 ? 1.28 : 0.72;
    const sz = 0.28;

    const padMat = new THREE.MeshBasicMaterial({
      color: ITEM_META[itemType].colorHex,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const pad = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.21, 22), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(sx, sy + 0.005, sz);
    group.add(pad);

    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffc220,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide
    });
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), dotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(sx, sy + 0.004, sz);
    group.add(dot);

    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.5, 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(sx, sy + 0.22, sz);
    group.add(hitBox);

    const slotObj = {
      aisleNum: config.num,
      itemType,
      localPos: new THREE.Vector3(sx, sy, sz),
      pad,
      dot,
      hitBox,
      occupied: false,
      itemMesh: null,
      parentBay: group
    };
    hitBox.userData = { interactable: true, kind: 'shelf_slot', slot: slotObj };
    slots.push(slotObj);
  });

  return { group, config, slots };
}

// ---------------------------------------------------------------------------
// Rolling Blue Walmart Stock Cart (Meshy 3D Model!)
// ---------------------------------------------------------------------------

export function createStockCart(cartIndex = 0) {
  const group = new THREE.Group();
  const cartModel = cloneMeshyTemplate('addy_stock_cart');
  group.add(cartModel);

  // Flatbed metallic deck surface of the Meshy U-boat stock cart sits cleanly at y=0.50
  const trayHeight = 0.50;
  const slotPositions = [
    new THREE.Vector3(-0.52, trayHeight, -0.20),
    new THREE.Vector3(0.0, trayHeight, -0.20),
    new THREE.Vector3(0.52, trayHeight, -0.20),
    new THREE.Vector3(-0.52, trayHeight, 0.20),
    new THREE.Vector3(0.0, trayHeight, 0.20),
    new THREE.Vector3(0.52, trayHeight, 0.20)
  ];

  group.userData = { cartIndex, meshyAsset: 'addy_stock_cart' };
  return { group, slotPositions };
}

// ---------------------------------------------------------------------------
// Customer Service PA Microphone Station + Free Food Snack Bar (Meshy 3D!)
// ---------------------------------------------------------------------------

export function createPaMicStation() {
  const group = new THREE.Group();
  group.position.set(-7.6, 0, 8.0);

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.4 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.18 });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.02, 1.15), blueMat);
  desk.position.y = 0.51;
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.1, 1.28), topMat);
  counterTop.position.y = 1.05;
  group.add(counterTop);

  const deskSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 0.72),
    new THREE.MeshBasicMaterial({ map: createSignTexture('PA MICROPHONE', 'LOST KIDS & FREE FOOD', '#004f9a', '#ffffff', '#ffc220') })
  );
  deskSign.position.set(0, 0.56, 0.59);
  group.add(deskSign);

  // Meshy 3D Gooseneck PA Microphone!
  const micAssembly = new THREE.Group();
  micAssembly.position.set(-0.55, 1.10, 0.05);
  const micModel = cloneMeshyTemplate('addy_pa_microphone');
  micAssembly.add(micModel);

  const soundRings = [];
  for (let i = 0; i < 3; i++) {
    const rMat = new THREE.MeshBasicMaterial({
      color: 0xffc220,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.2, 24), rMat);
    ring.position.set(0, 0.65, 0.08);
    micAssembly.add(ring);
    soundRings.push(ring);
  }
  group.add(micAssembly);

  // Glowing PA Beacon Pole & Overhead Beacon
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 10), chromeMat);
  pole.position.set(-1.45, 2.15, -0.35);
  group.add(pole);

  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xffc220,
    emissive: 0xffc220,
    emissiveIntensity: 0.35
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), beaconMat);
  beacon.position.set(-1.45, 3.3, -0.35);
  group.add(beacon);

  const beaconLight = new THREE.PointLight(0xffc220, 0.4, 8);
  beaconLight.position.set(-1.45, 3.35, -0.2);
  group.add(beaconLight);

  // Meshy 3D Free Food Display Tray!
  const foodDisplay = createFreeFoodTray();
  foodDisplay.position.set(0.85, 1.10, 0.02);
  group.add(foodDisplay);

  const freeFoodSign = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.36, 0.05),
    new THREE.MeshBasicMaterial({ map: createSignTexture('FREE FOOD', '', '#16a34a', '#ffffff', '#fef08a') })
  );
  freeFoodSign.position.set(0.85, 1.56, -0.38);
  group.add(freeFoodSign);

  const hitBox = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 2.4, 1.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.set(0, 1.2, 0);
  hitBox.userData = { interactable: true, kind: 'pa_mic' };
  group.add(hitBox);

  return {
    group,
    micAssembly,
    soundRings,
    beaconMat,
    beaconLight,
    foodDisplay
  };
}

export function createFreeFoodTray() {
  const tray = new THREE.Group();
  const model = cloneMeshyTemplate('addy_free_food_tray');
  tray.add(model);
  tray.userData = { meshyAsset: 'addy_free_food_tray', isMeshyModel: true };
  return tray;
}

export function createShoppingBagModel() {
  const bag = new THREE.Group();
  const model = cloneMeshyTemplate('addy_shopping_bag');
  bag.add(model);
  bag.userData = { meshyAsset: 'addy_shopping_bag', isMeshyModel: true };
  return bag;
}

// ---------------------------------------------------------------------------
// Interactive Walmart Checkout Aisle (Lane #1 — Meshy POS & Shopping Bags!)
// ---------------------------------------------------------------------------

export function createCheckoutAisle() {
  const group = new THREE.Group();
  group.position.set(6.4, 0, 7.2);

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.42 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.35 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.25 });

  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.94, 4.6), blueMat);
  counterBase.position.y = 0.47;
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;
  group.add(counterBase);

  const beltTex = createConveyorTexture();
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.06, 2.5),
    new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.78 })
  );
  belt.position.set(0, 0.96, -0.95);
  group.add(belt);

  const scannerDeck = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.07, 0.62), steelMat);
  scannerDeck.position.set(0, 0.96, 0.55);
  group.add(scannerDeck);

  const laserGlassMat = new THREE.MeshStandardMaterial({
    color: 0xff2244,
    emissive: 0xff1133,
    emissiveIntensity: 0.85,
    roughness: 0.15
  });
  const laserWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), laserGlassMat);
  laserWindow.rotation.x = -Math.PI / 2;
  laserWindow.position.set(0, 1.002, 0.55);
  group.add(laserWindow);

  const laserBeamMat = new THREE.MeshBasicMaterial({
    color: 0xff1133,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const laserBeam = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 4), laserBeamMat);
  laserBeam.rotation.x = Math.PI;
  laserBeam.position.set(0, 1.27, 0.55);
  group.add(laserBeam);

  // Meshy 3D POS Cash Register Terminal facing Clerk side (+X)
  const registerModel = cloneMeshyTemplate('addy_cash_register');
  registerModel.position.set(0.24, 0.96, 1.02);
  registerModel.rotation.y = Math.PI / 2;
  group.add(registerModel);

  // Live Canvas POS Readout Panel cleanly mounted above the Meshy POS Register facing +X
  const posCanvas = document.createElement('canvas');
  posCanvas.width = 512;
  posCanvas.height = 320;
  const posCtx = posCanvas.getContext('2d');
  const posTex = new THREE.CanvasTexture(posCanvas);
  posTex.colorSpace = THREE.SRGBColorSpace;

  const posScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.36),
    new THREE.MeshBasicMaterial({ map: posTex })
  );
  posScreen.position.set(0.42, 1.48, 1.02);
  posScreen.rotation.y = Math.PI / 2;
  group.add(posScreen);

  function updatePosScreen(itemName, priceText, totalText, statusText = 'READY TO SCAN') {
    posCtx.fillStyle = '#07142b';
    posCtx.fillRect(0, 0, 512, 320);
    posCtx.fillStyle = '#0071ce';
    posCtx.fillRect(0, 0, 512, 64);
    posCtx.fillStyle = '#ffffff';
    posCtx.font = '900 32px "Segoe UI", system-ui, sans-serif';
    posCtx.textAlign = 'left';
    posCtx.fillText('WALMART LANE #1', 20, 44);

    posCtx.fillStyle = '#ffc220';
    posCtx.font = '800 28px "Segoe UI", system-ui, sans-serif';
    posCtx.fillText(statusText, 20, 114);

    posCtx.fillStyle = '#e2e8f0';
    posCtx.font = '700 32px "Segoe UI", system-ui, sans-serif';
    posCtx.fillText(itemName, 20, 174);
    posCtx.textAlign = 'right';
    posCtx.fillText(priceText, 492, 174);

    posCtx.strokeStyle = '#334155';
    posCtx.lineWidth = 3;
    posCtx.beginPath();
    posCtx.moveTo(20, 212);
    posCtx.lineTo(492, 212);
    posCtx.stroke();

    posCtx.fillStyle = '#4ade80';
    posCtx.font = '900 48px "Segoe UI", system-ui, sans-serif';
    posCtx.textAlign = 'left';
    posCtx.fillText('TOTAL', 20, 278);
    posCtx.textAlign = 'right';
    posCtx.fillText(totalText, 492, 278);
    posTex.needsUpdate = true;
  }
  updatePosScreen('Walmart Register', '', '$0.00', 'CLERK: ADDY');

  // Cash Drawer (pops out briefly on KA-CHING!)
  const cashDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.56), darkMetal);
  cashDrawer.position.set(0.38, 0.84, 1.02);
  group.add(cashDrawer);

  // Bagging Carousel with 3 Meshy 3D Blue Walmart Shopping Bags!
  const bagCarousel = new THREE.Group();
  bagCarousel.position.set(0, 0.98, 1.72);
  const carouselPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 10), steelMat);
  carouselPost.position.y = 0.21;
  bagCarousel.add(carouselPost);

  for (let b = 0; b < 3; b++) {
    const ang = (b * Math.PI * 2) / 3;
    const bag = createShoppingBagModel();
    bag.position.set(Math.cos(ang) * 0.24, 0.04, Math.sin(ang) * 0.24);
    bag.rotation.y = -ang;
    bag.scale.setScalar(0.85);
    bagCarousel.add(bag);
  }
  group.add(bagCarousel);

  // Overhead Glowing "LANE 1" Pole & Light Box
  const lanePole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.3, 10), steelMat);
  lanePole.position.set(0, 2.05, 1.85);
  group.add(lanePole);

  const laneBoxMat = new THREE.MeshStandardMaterial({
    color: 0xffc220,
    emissive: 0xffc220,
    emissiveIntensity: 0.75
  });
  const laneBox = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.54), laneBoxMat);
  laneBox.position.set(0, 3.25, 1.85);
  group.add(laneBox);

  const laneNumSprite = createNameTagSprite('LANE 1 • CHECKOUT', '#0071ce', '#ffc220');
  laneNumSprite.position.set(0, 3.82, 1.85);
  laneNumSprite.scale.set(2.1, 0.62, 1);
  group.add(laneNumSprite);

  const clerkMatMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.025, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
  );
  clerkMatMesh.position.set(1.22, 0.015, 0.55);
  clerkMatMesh.userData = { isFloor: true };
  group.add(clerkMatMesh);

  const clerkRingMat = new THREE.MeshBasicMaterial({
    color: 0xffc220,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const clerkRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 28), clerkRingMat);
  clerkRing.rotation.x = -Math.PI / 2;
  clerkRing.position.set(1.22, 0.032, 0.55);
  group.add(clerkRing);

  const scanHitBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.6, 3.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  scanHitBox.position.set(0, 1.2, 0.05);
  scanHitBox.userData = { interactable: true, kind: 'checkout_scan' };
  group.add(scanHitBox);

  const beltStartLocal = new THREE.Vector3(0, 1.0, -1.9);
  const scannerLocal = new THREE.Vector3(0, 1.02, 0.55);
  const bagLocal = new THREE.Vector3(0, 1.15, 1.72);

  return {
    group,
    beltTex,
    laserGlassMat,
    laserBeamMat,
    cashDrawer,
    bagCarousel,
    laneBoxMat,
    clerkRingMat,
    updatePosScreen,
    beltStartLocal,
    scannerLocal,
    bagLocal
  };
}

// ---------------------------------------------------------------------------
// Walmart Employee Breakroom (11:00 PM Lunch Break — Meshy Furniture & Food!)
// ---------------------------------------------------------------------------

export function createBreakroomArea() {
  const group = new THREE.Group();
  group.position.set(-14.6, 0, 7.6);

  // Meshy 3D Bistro Table!
  const bistroTable = cloneMeshyTemplate('addy_bistro_table');
  group.add(bistroTable);

  // Two Meshy 3D Yellow Bar Stools!
  [-1.25, 1.25].forEach((cx) => {
    const stool = cloneMeshyTemplate('addy_bar_stool');
    stool.position.set(cx, 0, 0.1);
    group.add(stool);
  });

  // Glowing Lunch Floor Ring
  const lunchRingMat = new THREE.MeshBasicMaterial({
    color: 0xffc220,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  });
  const lunchRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 32), lunchRingMat);
  lunchRing.rotation.x = -Math.PI / 2;
  lunchRing.position.y = 0.015;
  group.add(lunchRing);

  // Breakroom Sign & "Employee of the Day: Addy" Wall Plaque on Left Wall
  const brSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.86, 0.12),
    new THREE.MeshBasicMaterial({ map: createSignTexture("ADDY'S BREAKROOM", '11:00 PM LUNCH BREAK', '#0071ce', '#ffffff', '#ffc220') })
  );
  brSign.position.set(-4.0, 3.1, 0);
  brSign.rotation.y = Math.PI / 2;
  group.add(brSign);

  const badgePlaque = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.94, 0.08),
    new THREE.MeshBasicMaterial({ map: createNameBadgeTexture() })
  );
  badgePlaque.position.set(-4.0, 1.8, 0);
  badgePlaque.rotation.y = Math.PI / 2;
  group.add(badgePlaque);

  // 4 Interactive Meshy 3D 11:00 PM Lunch Food Items on the Table!
  const foodItems = [];
  const lunchSpecs = [
    { key: 'addy_lunch_pizza',  pos: [-0.34, 0.91, 0.18],  isDrink: false, label: 'Pizza' },
    { key: 'addy_lunch_boba',   pos: [0.32, 0.91, -0.15],  isDrink: true,  label: 'Boba' },
    { key: 'addy_lunch_donut',  pos: [0.24, 0.91, 0.28],   isDrink: false, label: 'Donut' },
    { key: 'addy_lunch_burger', pos: [-0.22, 0.91, -0.26], isDrink: false, label: 'Burger' }
  ];

  for (const item of lunchSpecs) {
    const foodGroup = new THREE.Group();
    const model = cloneMeshyTemplate(item.key);
    foodGroup.add(model);
    foodGroup.position.set(item.pos[0], item.pos[1], item.pos[2]);
    foodGroup.userData = {
      interactable: true,
      kind: 'lunch_food',
      isDrink: item.isDrink,
      label: item.label,
      meshyAsset: item.key
    };
    group.add(foodGroup);
    foodItems.push(foodGroup);
  }

  return { group, foodItems, lunchRingMat };
}

// ---------------------------------------------------------------------------
// Addy's 3D Walmart Store Keys Keychain (Meshy 3D!)
// ---------------------------------------------------------------------------

export function createStoreKeysModel() {
  const group = new THREE.Group();
  const model = cloneMeshyTemplate('addy_store_keys');
  group.add(model);
  group.userData = { meshyAsset: 'addy_store_keys', isMeshyModel: true };
  return group;
}

// ---------------------------------------------------------------------------
// $100,000.00 Golden Tip Cash Bundle Prop (Meshy 3D!)
// ---------------------------------------------------------------------------

export function createHundredKTipModel() {
  const group = new THREE.Group();
  const model = cloneMeshyTemplate('addy_tip_100k');
  group.add(model);

  const label = createNameTagSprite('$100,000.00!', '#15803d', '#fef08a');
  label.position.set(0, 0.44, 0);
  label.scale.set(1.25, 0.38, 1);
  group.add(label);

  group.userData = { meshyAsset: 'addy_tip_100k', isMeshyModel: true };
  return group;
}

// ---------------------------------------------------------------------------
// Meshy 3D Characters (Lost Kids with Names, Parents & Checkout Shoppers!)
// ---------------------------------------------------------------------------

const CHARACTER_TINTS = [null, 0xfef08a, 0xbae6fd, 0xfbcfe8, 0xc7d2fe, 0xbbf7d0];

export function createPersonCharacter({ isKid = false, name = '', seed = 0, isParent = false } = {}) {
  const group = new THREE.Group();
  const meshyKey = isKid ? 'addy_lost_kid' : (isParent ? 'addy_parent' : 'addy_shopper');
  const tintHex = CHARACTER_TINTS[seed % CHARACTER_TINTS.length];
  const modelRoot = cloneMeshyTemplate(meshyKey, {
    tintHex,
    tintStrength: tintHex ? 0.14 : 0
  });
  group.add(modelRoot);

  const s = isKid ? 0.64 : 1.0;

  // Safe limb pivot stubs (keeps pool/game API compatible while modelRoot drives smooth bounce/sway animation)
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  group.add(leftLeg, rightLeg, leftArm, rightArm);

  // Hand Carry Anchor (for shopping bag, $100,000 tip, or Free Food tray!)
  const handAnchor = new THREE.Group();
  handAnchor.position.set(0, 0.96 * s, 0.45 * s);
  group.add(handAnchor);

  // Name Tag floating cleanly over head (for Lost Kids and Parents!)
  let nameSprite = null;
  if (name) {
    nameSprite = createNameTagSprite(name, isKid ? '#ffc220' : '#0071ce', isKid ? '#0f172a' : '#ffffff');
    nameSprite.position.set(0, isKid ? 1.48 : 2.12, 0);
    group.add(nameSprite);
  }

  group.userData = {
    meshyAsset: meshyKey,
    isMeshyModel: true,
    isKid,
    isParent
  };

  return {
    group,
    modelRoot,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    handAnchor,
    nameSprite
  };
}
