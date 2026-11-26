/**
 * Calm Chess Games — Addy's Walmart Store Clerk XR Procedural 3D Models & Textures
 * 100% Procedural Three.js Geometry & Canvas Textures (Zero External Assets!)
 *  - Walmart Parking Lot (asphalt, stalls, crosswalk, parked cars + Addy's car, cart corral, lampposts, trees, sky)
 *  - Walmart Storefront Facade (blue/yellow Spark logo, dynamic OPEN 11:30 AM / LOCKED sign, sliding glass doors, exterior key lock cylinder)
 *  - 10 Numbered Walmart Aisles (Aisle 1–10) with hanging overhead signs & restockable shelves
 *  - 6 Procedural Stockable Items: NeeDohs, Squishies, Clickers, Cups, Kids Sweatshirts, Adult Sweatshirts
 *  - Rolling Blue Walmart Stock Carts
 *  - Customer Service PA Microphone Station + Free Food Gift Bar
 *  - Checkout Aisle Lane #1 (animated conveyor belt, red laser scanner, live POS screen, bagging carousel, clerk mat)
 *  - 11:00 PM Employee Breakroom + 3D Wall Clock + Addy's 3D Store Keys Keychain
 *  - Procedural Lost Kids (with Name Tags!), Reunited Parents ($100,000 Tip + Free Food!), and Checkout Shoppers
 */

import * as THREE from 'three';

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
    bayColor: '#0d9488'
  },
  [ITEM_TYPES.SQUISHY]: {
    label: 'Squishy',
    price: 7.48,
    colorHex: 0xff7eb6,
    accentHex: 0xffe066,
    bayColor: '#db2777'
  },
  [ITEM_TYPES.CLICKER]: {
    label: 'Clicker',
    price: 5.88,
    colorHex: 0xa855f7,
    accentHex: 0x38bdf8,
    bayColor: '#7c3aed'
  },
  [ITEM_TYPES.CUP]: {
    label: 'Tumbler Cup',
    price: 16.97,
    colorHex: 0x38bdf8,
    accentHex: 0xf472b6,
    bayColor: '#0284c7'
  },
  [ITEM_TYPES.SWEATSHIRT_KIDS]: {
    label: 'Kids Sweatshirt',
    price: 14.98,
    colorHex: 0xfb923c,
    accentHex: 0xfef08a,
    bayColor: '#ea580c'
  },
  [ITEM_TYPES.SWEATSHIRT_ADULT]: {
    label: 'Adult Sweatshirt',
    price: 22.98,
    colorHex: 0x2563eb,
    accentHex: 0xe2e8f0,
    bayColor: '#1d4ed8'
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
// Procedural Canvas Texture Helpers
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

export function createKawaiiFaceTexture(baseHex, cheekHex = '#ff6b9d', style = 'happy') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');

  g.fillStyle = baseHex;
  g.fillRect(0, 0, 256, 256);

  const grad = g.createRadialGradient(128, 120, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0.06)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);

  const drawEye = (cx, cy) => {
    g.beginPath();
    g.ellipse(cx, cy, 20, 24, 0, 0, Math.PI * 2);
    g.fillStyle = '#241428';
    g.fill();

    g.beginPath();
    g.arc(cx - 6, cy - 7, 7, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();

    g.beginPath();
    g.arc(cx + 6, cy + 5, 3.5, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
  };

  drawEye(88, 118);
  drawEye(168, 118);

  g.fillStyle = cheekHex;
  g.globalAlpha = 0.55;
  g.beginPath();
  g.ellipse(60, 146, 20, 11, 0, 0, Math.PI * 2);
  g.ellipse(196, 146, 20, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;

  g.strokeStyle = '#241428';
  g.lineWidth = 8;
  g.lineCap = 'round';
  g.beginPath();
  if (style === 'cat') {
    g.moveTo(108, 148);
    g.quadraticCurveTo(118, 164, 128, 150);
    g.quadraticCurveTo(138, 164, 148, 148);
  } else {
    g.arc(128, 142, 18, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.name = `kawaii_face_${baseHex}_${cheekHex}_${style}`;
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

function createSizeTagTexture(sizeLabel, bgHex) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bgHex;
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 8;
  g.strokeRect(6, 6, 244, 116);
  g.fillStyle = '#ffffff';
  g.font = '900 48px "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(sizeLabel, 128, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.name = `size_tag_${sizeLabel}_${bgHex}`;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Procedural Walmart Parking Lot + Store Architecture + Dynamic Sky
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

  // Action Alley blue/yellow guide strips
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
      if (Math.abs(s) < 3.5) continue; // Keep center crosswalk clear!
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

  // ---- Parked Cars in Walmart Parking Lot (including Addy's Sparkly Car!) ----
  const parkedCars = [];
  const carConfigs = [
    { x: 7.4, z: 22.8, rot: Math.PI, color: 0x0071ce, isAddy: true },   // Addy's Sparkly Blue Car!
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

  // ---- Parking Lot Shopping Cart Corral ----
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
  // 3 nested mini shopping carts inside corral
  for (let c = 0; c < 3; c++) {
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.46, 0.82),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: false, metalness: 0.5, roughness: 0.3 })
    );
    basket.position.set(0, 0.62, -1.1 + c * 0.68);
    corral.add(basket);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.06), railMat);
    handle.position.set(0, 0.92, -0.68 + c * 0.68);
    corral.add(handle);
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

  // ---- Stylized Curbside Trees ----
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });
  [[-18.5, 16.5], [18.5, 16.5], [-20, 26], [20, 26]].forEach(([tx, tz]) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 2.6, 8), trunkMat);
    trunk.position.y = 1.3;
    tree.add(trunk);
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75, 1), leafMat);
    crown.position.y = 3.5;
    tree.add(crown);
    tree.position.set(tx, 0, tz);
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

  // Back wall blue & yellow header stripe
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

  // ---- Front Storefront Wall (z = 12) with Big Glass Windows & Sliding Entrance Doors! ----
  // Left & Right exterior facade segments (leaving 4.0m doorway opening x = -2..2)
  const frontGlassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.3,
    roughness: 0.14,
    metalness: 0.12
  });

  // Exterior Blue Facade Parapet Header across the entire front!
  const facadeTop = new THREE.Mesh(new THREE.BoxGeometry(38.6, 3.2, 0.7), blueBandMat);
  facadeTop.position.set(0, 5.3, 12.1);
  group.add(facadeTop);

  const facadeAccent = new THREE.Mesh(new THREE.BoxGeometry(38.8, 0.28, 0.78), yellowBandMat);
  facadeAccent.position.set(0, 3.72, 12.14);
  group.add(facadeAccent);

  // Huge Glowing Exterior "Walmart ✳" Sign!
  const walmartSign = new THREE.Mesh(
    new THREE.BoxGeometry(11.8, 2.45, 0.24),
    new THREE.MeshBasicMaterial({ map: createWalmartSignTexture() })
  );
  walmartSign.position.set(0, 5.45, 12.55);
  group.add(walmartSign);

  // Dynamic Exterior Status Marquee ("OPEN 11:30 AM" -> "CLOSED • LOCKED BY ADDY")
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

  // Left & Right front glass storefront walls (with solid lower kickplates)
  [-10.5, 10.5].forEach((fx) => {
    const kick = new THREE.Mesh(new THREE.BoxGeometry(17.0, 0.9, 0.35), wallMat);
    kick.position.set(fx, 0.45, 12);
    group.add(kick);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(17.0, 2.75, 0.14), frontGlassMat);
    glass.position.set(fx, 2.28, 12);
    group.add(glass);
  });

  // Door frame posts at x = -2.05 and x = 2.05
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
  [-2.05, 2.05].forEach((dx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.65, 0.36), frameMat);
    post.position.set(dx, 1.82, 12);
    group.add(post);
  });

  // Automatic Sliding Glass Entrance Doors
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

  // Exterior Key Lock Panel (right next to front doors at x=2.25, z=12.26) — Addy locks the doors at 11:46 AM!
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

  // Glowing golden exit floor pad outside doors when 11:46 AM arrives
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
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: isAddy ? 0.55 : 0.35,
    roughness: isAddy ? 0.22 : 0.38
  });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.15 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.68, 4.1), bodyMat);
  chassis.position.y = 0.56;
  chassis.castShadow = true;
  group.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.58, 2.05), bodyMat);
  cabin.position.set(0, 1.12, -0.15);
  cabin.castShadow = true;
  group.add(cabin);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.44, 2.12), glassMat);
  windshield.position.set(0, 1.12, -0.15);
  group.add(windshield);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  [[-0.95, 0.32, 1.25], [0.95, 0.32, 1.25], [-0.95, 0.32, -1.25], [0.95, 0.32, -1.25]].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, wy, wz);
    group.add(w);
  });

  // Headlights
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfef08a,
    emissiveIntensity: isAddy ? 1.1 : 0.2
  });
  [-0.64, 0.64].forEach((hx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.08), headMat);
    hl.position.set(hx, 0.62, 2.06);
    group.add(hl);
  });

  if (isAddy) {
    const tag = createNameTagSprite("Addy's Car", '#0071ce', '#ffc220');
    tag.position.set(0, 2.15, 0);
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
// 6 Procedural Stockable Walmart Items!
// ---------------------------------------------------------------------------

const NEEDOH_COLORS = ['#38d9c0', '#ff6ec7', '#facc15', '#818cf8', '#fb7185', '#4ade80'];
const SQUISHY_COLORS = ['#ff85c0', '#fde047', '#a78bfa', '#67e8f9', '#fda4af', '#86efac'];
const CUP_COLORS = ['#38bdf8', '#f472b6', '#a78bfa', '#34d399', '#fb923c', '#facc15'];
const KIDS_HOODIE_COLORS = [0xff6b9d, 0x38bdf8, 0xfacc15, 0x4ade80, 0xc084fc];
const ADULT_HOODIE_COLORS = [0x1d4ed8, 0x0f766e, 0x475569, 0x7c3aed, 0xb91c1c];

export function createRestockItem(itemType, variantIndex = 0) {
  const group = new THREE.Group();
  group.userData = { itemType };

  if (itemType === ITEM_TYPES.NEEDOH) {
    // NeeDoh — Glossy pastel translucent squishy sphere with kawaii smile & neat box base
    const hex = NEEDOH_COLORS[variantIndex % NEEDOH_COLORS.length];
    const faceTex = createKawaiiFaceTexture(hex, '#ff5ca8', 'happy');
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 18, 14),
      new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.2,
        metalness: 0.05
      })
    );
    ball.scale.set(1.06, 0.92, 1.06);
    ball.position.y = 0.14;
    ball.castShadow = true;
    group.add(ball);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.13, 0.045, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    collar.position.y = 0.024;
    group.add(collar);
  } else if (itemType === ITEM_TYPES.SQUISHY) {
    // Kawaii Jumbo Squishy — Pastel chubby cat/bear squishy with ears & sweet face!
    const hex = SQUISHY_COLORS[variantIndex % SQUISHY_COLORS.length];
    const faceTex = createKawaiiFaceTexture(hex, '#ff4d94', 'cat');
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.175, 22, 18),
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.42 })
    );
    body.scale.set(1.08, 0.95, 0.96);
    body.position.y = 0.17;
    body.castShadow = true;
    group.add(body);

    const earMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.42 });
    const earGeo = new THREE.ConeGeometry(0.055, 0.1, 12);
    [-0.1, 0.1].forEach((ex) => {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(ex, 0.32, 0);
      ear.rotation.z = ex > 0 ? -0.3 : 0.3;
      group.add(ear);
    });
  } else if (itemType === ITEM_TYPES.CLICKER) {
    // Rainbow Mechanical Fidget Clicker (4 animated depressible keycaps!)
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.09, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.32, metalness: 0.15 })
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);

    const keyColors = [0xff6ec7, 0x38bdf8, 0xfacc15, 0x4ade80];
    const keys = [];
    const offsets = [[-0.055, -0.055], [0.055, -0.055], [-0.055, 0.055], [0.055, 0.055]];
    offsets.forEach(([kx, kz], idx) => {
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.088, 0.075, 0.088),
        new THREE.MeshStandardMaterial({
          color: keyColors[(idx + variantIndex) % keyColors.length],
          emissive: keyColors[(idx + variantIndex) % keyColors.length],
          emissiveIntensity: 0.2,
          roughness: 0.22
        })
      );
      key.position.set(kx, 0.125, kz);
      key.castShadow = true;
      group.add(key);
      keys.push(key);
    });
    group.userData.keys = keys;
  } else if (itemType === ITEM_TYPES.CUP) {
    // Insulated Tumbler Cup with Handle, Lid, Stainless Rim & Straw!
    const hex = CUP_COLORS[variantIndex % CUP_COLORS.length];
    const cupMat = new THREE.MeshStandardMaterial({ color: hex, metalness: 0.25, roughness: 0.28 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.06, 0.14, 18), cupMat);
    lower.position.y = 0.07;
    lower.castShadow = true;
    group.add(lower);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.078, 0.17, 18), cupMat);
    upper.position.y = 0.22;
    upper.castShadow = true;
    group.add(upper);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.025, 18), metalMat);
    rim.position.y = 0.305;
    group.add(rim);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.094, 0.094, 0.032, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    lid.position.y = 0.328;
    group.add(lid);

    const straw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.13, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
    );
    straw.position.set(0.015, 0.39, 0);
    straw.rotation.z = -0.14;
    group.add(straw);

    // Side Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 10, 16, Math.PI), cupMat);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.095, 0.2, 0);
    group.add(handle);
  } else if (itemType === ITEM_TYPES.SWEATSHIRT_KIDS || itemType === ITEM_TYPES.SWEATSHIRT_ADULT) {
    // Cozy Folded/Displayed Sweatshirt Hoodie (Kids Size vs Adult Size!)
    const isAdult = itemType === ITEM_TYPES.SWEATSHIRT_ADULT;
    const scale = isAdult ? 1.18 : 0.86;
    const palette = isAdult ? ADULT_HOODIE_COLORS : KIDS_HOODIE_COLORS;
    const clothColor = palette[variantIndex % palette.length];
    const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.86 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28 * scale, 0.12 * scale, 0.24 * scale), clothMat);
    body.position.y = 0.07 * scale;
    body.castShadow = true;
    group.add(body);

    // Folded sleeves on top sides
    [-0.14 * scale, 0.14 * scale].forEach((sx) => {
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.042 * scale, 0.042 * scale, 0.22 * scale, 10), clothMat);
      sleeve.rotation.x = Math.PI / 2;
      sleeve.position.set(sx, 0.07 * scale, 0);
      group.add(sleeve);
    });

    // Cozy hood lump at back-top
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.075 * scale, 12, 10), clothMat);
    hood.scale.set(1.2, 0.65, 0.85);
    hood.position.set(0, 0.135 * scale, -0.06 * scale);
    group.add(hood);

    // Drawstrings
    const strMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    [-0.025 * scale, 0.025 * scale].forEach((dx) => {
      const str = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.008, 0.08 * scale), strMat);
      str.position.set(dx, 0.134 * scale, 0.03 * scale);
      group.add(str);
    });

    // Crisp Size Tag ("KIDS S/M" vs "ADULT L/XL")
    const sizeLabel = isAdult ? 'ADULT' : 'KIDS';
    const tagBg = isAdult ? '#1e3a8a' : '#ea580c';
    const tagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15 * scale, 0.075 * scale),
      new THREE.MeshBasicMaterial({ map: createSizeTagTexture(sizeLabel, tagBg) })
    );
    tagMesh.rotation.x = -Math.PI / 2;
    tagMesh.position.set(0, 0.134 * scale + 0.004, 0.03 * scale);
    group.add(tagMesh);
  }

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

  // Gondola spine & base (length 4.8m along X, depth 0.92m along Z)
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 1.0), trimMat);
  base.position.y = 0.12;
  base.receiveShadow = true;
  group.add(base);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(4.74, 2.1, 0.1), metalMat);
  spine.position.y = 1.22;
  group.add(spine);

  // Top color header strip
  const header = new THREE.Mesh(new THREE.BoxGeometry(4.82, 0.22, 0.22), accentMat);
  header.position.y = 2.32;
  group.add(header);

  // Overhead Hanging Walmart Aisle Number Sign (visible from BOTH directions down Action Alley!)
  const signTex = createSignTexture(config.title, config.subtitle, '#0071ce', '#ffffff', '#ffc220');
  const hangSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.84, 0.12),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  hangSign.position.set(config.side < 0 ? 2.55 : -2.55, 3.65, 0);
  hangSign.rotation.y = config.side < 0 ? Math.PI / 2 : -Math.PI / 2;
  group.add(hangSign);

  // Also a front-facing aisle sign right above the bay
  const bayBanner = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.68, 0.1),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  bayBanner.position.set(0, 2.86, 0);
  group.add(bayBanner);

  // Two metal hanging wires up to the ceiling
  const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 6);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  [-0.9, 0.9].forEach((wx) => {
    const w = new THREE.Mesh(wireGeo, wireMat);
    w.position.set(config.side < 0 ? 2.55 : -2.55, 5.05, wx);
    group.add(w);
  });

  // 3 Shelf Tiers on BOTH front (+Z) and back (-Z) sides of the gondola
  const shelfHeights = [0.68, 1.24, 1.8];
  shelfHeights.forEach((sy) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.76, 0.07, 0.96), metalMat);
    plank.position.y = sy;
    plank.receiveShadow = true;
    group.add(plank);

    // Price channel lip
    [-0.49, 0.49].forEach((sz) => {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(4.76, 0.055, 0.03), trimMat);
      lip.position.set(0, sy - 0.01, sz);
      group.add(lip);
    });
  });

  // Pre-stock decorative items on top & back shelves, and create 4 glowing restockable slots on middle/lower front!
  const slots = [];
  const slotXPositions = [-1.65, -0.55, 0.55, 1.65];

  // Decorative pre-stocked items on top shelf (+Z & -Z) so Walmart looks lush and full!
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

  // 4 Interactive Restock Slots (facing +Z towards the shopper aisle)
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

    // Invisible click/aim hit box around slot for easy XR & Xbox targeting!
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
// Rolling Blue Walmart Stock Cart (Topstock / U-Boat)
// ---------------------------------------------------------------------------

export function createStockCart(cartIndex = 0) {
  const group = new THREE.Group();
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, metalness: 0.35, roughness: 0.35 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.25, roughness: 0.45 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.09, 0.92), deckMat);
  deck.position.y = 0.26;
  deck.castShadow = true;
  group.add(deck);

  const midDeck = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.06, 0.86), deckMat);
  midDeck.position.y = 0.88;
  midDeck.castShadow = true;
  group.add(midDeck);

  // Side push handles
  [-0.84, 0.84].forEach((hx) => {
    [-0.4, 0.4].forEach((hz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.32, 8), blueMat);
      post.position.set(hx, 0.92, hz);
      group.add(post);
    });
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.84, 8), blueMat);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(hx, 1.56, 0);
    group.add(crossbar);
  });

  // Wheels
  const wGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 12);
  wGeo.rotateX(Math.PI / 2);
  [[-0.7, 0.1, -0.34], [0.7, 0.1, -0.34], [-0.7, 0.1, 0.34], [0.7, 0.1, 0.34]].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wGeo, wheelMat);
    w.position.set(wx, wy, wz);
    group.add(w);
  });

  // 6 slot anchor points on the top shelf (holds all 6 item types!)
  const slotPositions = [
    new THREE.Vector3(-0.55, 0.92, -0.22),
    new THREE.Vector3(0.0, 0.92, -0.22),
    new THREE.Vector3(0.55, 0.92, -0.22),
    new THREE.Vector3(-0.55, 0.92, 0.22),
    new THREE.Vector3(0.0, 0.92, 0.22),
    new THREE.Vector3(0.55, 0.92, 0.22)
  ];

  group.userData = { cartIndex };
  return { group, slotPositions };
}

// ---------------------------------------------------------------------------
// Customer Service PA Microphone Station + Free Food Snack Bar!
// ---------------------------------------------------------------------------

export function createPaMicStation() {
  const group = new THREE.Group();
  group.position.set(-7.6, 0, 8.0);

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.4 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffc220, roughness: 0.3 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.18 });

  // Service Desk Counter
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.02, 1.15), blueMat);
  desk.position.y = 0.51;
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.1, 1.28), topMat);
  counterTop.position.y = 1.05;
  group.add(counterTop);

  // Front Desk Sign ("PA MIC • FREE FOOD")
  const deskSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 0.72),
    new THREE.MeshBasicMaterial({ map: createSignTexture('PA MICROPHONE', 'LOST KIDS & FREE FOOD', '#004f9a', '#ffffff', '#ffc220') })
  );
  deskSign.position.set(0, 0.56, 0.59);
  group.add(deskSign);

  // Chrome Gooseneck PA Microphone on the Left/Center of the Counter!
  const micAssembly = new THREE.Group();
  micAssembly.position.set(-0.55, 1.1, 0.05);

  const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 18), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
  micBase.position.y = 0.04;
  micAssembly.add(micBase);

  const micButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 })
  );
  micButton.position.set(0, 0.09, 0.09);
  micAssembly.add(micButton);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.52, 10), chromeMat);
  neck.position.set(0, 0.32, -0.02);
  neck.rotation.x = 0.22;
  micAssembly.add(neck);

  const micHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.072, 16, 14),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 })
  );
  micHead.scale.set(0.95, 1.25, 0.95);
  micHead.position.set(0, 0.58, 0.05);
  micAssembly.add(micHead);

  // Expanding Sound-Wave Rings above the PA Microphone!
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

  // Glowing PA Beacon Pole & Overhead Sign
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

  // Free Food Display Tray right on the right side of the desk!
  const foodDisplay = createFreeFoodTray();
  foodDisplay.position.set(0.85, 1.11, 0.02);
  group.add(foodDisplay);

  const freeFoodSign = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.36, 0.05),
    new THREE.MeshBasicMaterial({ map: createSignTexture('FREE FOOD', '', '#16a34a', '#ffffff', '#fef08a') })
  );
  freeFoodSign.position.set(0.85, 1.56, -0.38);
  group.add(freeFoodSign);

  // Generous invisible interactable collider over the entire mic station
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
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.04, 0.46),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 })
  );
  tray.add(base);

  // Mini Pizza Slice
  const crust = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.24, 3),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
  );
  crust.rotation.x = Math.PI / 2;
  crust.position.set(-0.18, 0.05, 0.02);
  tray.add(crust);

  // Mini Burger
  const bunBot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.035, 14),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  bunBot.position.set(0.04, 0.04, 0.04);
  tray.add(bunBot);
  const patty = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.088, 0.03, 14),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  patty.position.set(0.04, 0.072, 0.04);
  tray.add(patty);
  const bunTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.086, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 })
  );
  bunTop.position.set(0.04, 0.086, 0.04);
  tray.add(bunTop);

  // Frosted Drink Cup with Straw
  const drink = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.042, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
  );
  drink.position.set(0.22, 0.1, -0.04);
  tray.add(drink);
  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e })
  );
  straw.position.set(0.22, 0.21, -0.04);
  tray.add(straw);

  return tray;
}

// ---------------------------------------------------------------------------
// Interactive Walmart Checkout Aisle (Lane #1 — Become the Clerk!)
// ---------------------------------------------------------------------------

export function createCheckoutAisle() {
  const group = new THREE.Group();
  group.position.set(6.4, 0, 7.2);

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.42 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.35 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.25 });

  // Main Checkout Counter Body (oriented along Z: length 4.6m, width 1.15m)
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.94, 4.6), blueMat);
  counterBase.position.y = 0.47;
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;
  group.add(counterBase);

  // Animated Conveyor Belt on the front/store-facing half (z: -2.2 .. 0.4)
  const beltTex = createConveyorTexture();
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.06, 2.5),
    new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.78 })
  );
  belt.position.set(0, 0.96, -0.95);
  group.add(belt);

  // Stainless Scanner Bed + Red Laser Window at z = 0.52
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

  // Vertical laser beam flash cone (flashes bright red on every scan!)
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

  // Live Canvas POS Register Screen facing the Clerk side (+X)
  const posCanvas = document.createElement('canvas');
  posCanvas.width = 512;
  posCanvas.height = 320;
  const posCtx = posCanvas.getContext('2d');
  const posTex = new THREE.CanvasTexture(posCanvas);
  posTex.colorSpace = THREE.SRGBColorSpace;

  const posStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 10), darkMetal);
  posStand.position.set(0.32, 1.18, 0.96);
  group.add(posStand);

  const posBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.64), darkMetal);
  posBody.position.set(0.32, 1.44, 0.96);
  posBody.rotation.z = -0.22;
  group.add(posBody);

  const posScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.38),
    new THREE.MeshBasicMaterial({ map: posTex })
  );
  posScreen.position.set(0.375, 1.44, 0.96);
  posScreen.rotation.y = Math.PI / 2;
  posScreen.rotation.z = 0;
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
  cashDrawer.position.set(0.38, 0.84, 0.96);
  group.add(cashDrawer);

  // Bagging Carousel with Blue Walmart Bags (z = 1.65)
  const bagCarousel = new THREE.Group();
  bagCarousel.position.set(0, 0.98, 1.72);
  const carouselPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 10), steelMat);
  carouselPost.position.y = 0.21;
  bagCarousel.add(carouselPost);

  const bagMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.5 });
  for (let b = 0; b < 3; b++) {
    const ang = (b * Math.PI * 2) / 3;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.14), bagMat);
    bag.position.set(Math.cos(ang) * 0.22, 0.2, Math.sin(ang) * 0.22);
    bag.rotation.y = -ang;
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

  // Clerk Standing Floor Mat on the +X side of the checkout counter!
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

  // Generous invisible interactable collider on the scanner/belt for smooth scanning!
  const scanHitBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.6, 3.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  scanHitBox.position.set(0, 1.2, 0.05);
  scanHitBox.userData = { interactable: true, kind: 'checkout_scan' };
  group.add(scanHitBox);

  // World positions for conveyor belt item queue & shopper queue line
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
// Walmart Employee Breakroom (11:00 PM Lunch Break!)
// ---------------------------------------------------------------------------

export function createBreakroomArea() {
  const group = new THREE.Group();
  group.position.set(-14.6, 0, 7.6);

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.45 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const chairMat = new THREE.MeshStandardMaterial({ color: 0xffc220, roughness: 0.4 });

  // Bistro Table
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.28, 0.84, 14), blueMat);
  leg.position.y = 0.42;
  group.add(leg);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.08, 24), tableMat);
  top.position.y = 0.86;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Two cute yellow stools
  [-1.25, 1.25].forEach((cx) => {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.55, 14), chairMat);
    stool.position.set(cx, 0.28, 0.1);
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

  // Interactive 11:00 PM Lunch Food Items on the Table!
  const foodItems = [];

  // 1. Pizza Slice
  const pizza = new THREE.Group();
  const slice = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.34, 3),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 })
  );
  slice.rotation.x = Math.PI / 2;
  pizza.add(slice);
  for (let p = 0; p < 3; p++) {
    const pep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.012, 10),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    pep.position.set((p - 1) * 0.045, 0.035, -0.02 + (p % 2) * 0.07);
    pizza.add(pep);
  }
  pizza.position.set(-0.34, 0.96, 0.18);
  pizza.userData = { interactable: true, kind: 'lunch_food', isDrink: false, label: 'Pizza' };
  group.add(pizza);
  foodItems.push(pizza);

  // 2. Boba Tea / Soda Cup
  const boba = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.065, 0.24, 16),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.25 })
  );
  cup.position.y = 0.12;
  boba.add(cup);
  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.14, 10),
    new THREE.MeshBasicMaterial({ color: 0x1e293b })
  );
  straw.position.y = 0.28;
  boba.add(straw);
  boba.position.set(0.32, 0.9, -0.15);
  boba.userData = { interactable: true, kind: 'lunch_food', isDrink: true, label: 'Boba' };
  group.add(boba);
  foodItems.push(boba);

  // 3. Pink Frosted Donut
  const donut = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.048, 12, 20),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  donut.add(ring);
  donut.position.set(0.24, 0.96, 0.28);
  donut.userData = { interactable: true, kind: 'lunch_food', isDrink: false, label: 'Donut' };
  group.add(donut);
  foodItems.push(donut);

  // 4. Crispy Burger
  const burger = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
  b1.position.y = 0.02;
  burger.add(b1);
  const pat = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.035, 14), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  pat.position.y = 0.055;
  burger.add(pat);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.112, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
  b2.position.y = 0.072;
  burger.add(b2);
  burger.position.set(-0.22, 0.91, -0.26);
  burger.userData = { interactable: true, kind: 'lunch_food', isDrink: false, label: 'Burger' };
  group.add(burger);
  foodItems.push(burger);

  return { group, foodItems, lunchRingMat };
}

// ---------------------------------------------------------------------------
// Addy's 3D Walmart Store Keys Keychain (shown at 11:46 AM to lock the doors!)
// ---------------------------------------------------------------------------

export function createStoreKeysModel() {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.18, emissive: 0x996515, emissiveIntensity: 0.25 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.88, roughness: 0.2 });
  const fobMat = new THREE.MeshStandardMaterial({ color: 0x0071ce, roughness: 0.35 });

  // Keyring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.008, 10, 20), silverMat);
  group.add(ring);

  // Main Golden Store Key
  const goldKey = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 14), goldMat);
  bow.position.y = -0.055;
  goldKey.add(bow);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.11, 0.006), goldMat);
  blade.position.y = -0.13;
  goldKey.add(blade);
  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.015, 0.006), goldMat);
  tooth1.position.set(0.014, -0.155, 0);
  goldKey.add(tooth1);
  const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.015, 0.006), goldMat);
  tooth2.position.set(0.012, -0.175, 0);
  goldKey.add(tooth2);
  goldKey.rotation.z = -0.2;
  group.add(goldKey);

  // Secondary Silver Key
  const silverKey = new THREE.Group();
  const sBlade = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.095, 0.006), silverMat);
  sBlade.position.y = -0.11;
  silverKey.add(sBlade);
  silverKey.rotation.z = 0.3;
  group.add(silverKey);

  // Blue Walmart Spark Key Fob
  const fob = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.012, 16), fobMat);
  fob.rotation.x = Math.PI / 2;
  fob.position.set(-0.048, -0.075, 0.008);
  group.add(fob);

  return group;
}

// ---------------------------------------------------------------------------
// $100,000.00 Golden Tip Cash Bundle Prop!
// ---------------------------------------------------------------------------

export function createHundredKTipModel() {
  const group = new THREE.Group();
  const billMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 0.35,
    roughness: 0.35
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xeab308,
    emissiveIntensity: 0.45,
    metalness: 0.7,
    roughness: 0.2
  });

  // Stack of bills
  for (let i = 0; i < 3; i++) {
    const stack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.14), billMat);
    stack.position.y = i * 0.082;
    stack.rotation.y = (i - 1) * 0.12;
    group.add(stack);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.086, 0.146), bandMat);
    band.position.y = i * 0.082;
    band.rotation.y = (i - 1) * 0.12;
    group.add(band);
  }

  const label = createNameTagSprite('$100,000.00!', '#15803d', '#fef08a');
  label.position.set(0, 0.44, 0);
  label.scale.set(1.25, 0.38, 1);
  group.add(label);

  return group;
}

// ---------------------------------------------------------------------------
// Procedural Animated 3D Characters (Lost Kids with Names, Parents & Shoppers!)
// ---------------------------------------------------------------------------

const SKIN_TONES = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
const SHIRT_COLORS = [0xef4444, 0x3b82f6, 0x10b981, 0xa855f7, 0xf59e0b, 0xec4899, 0x06b6d4];
const HAIR_COLORS = [0x1e293b, 0x78350f, 0xd97706, 0xf59e0b, 0x451a03];

export function createPersonCharacter({ isKid = false, name = '', seed = 0, isParent = false } = {}) {
  const group = new THREE.Group();
  const s = isKid ? 0.64 : 1.0;

  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const shirt = SHIRT_COLORS[(seed * 3 + (isParent ? 2 : 0)) % SHIRT_COLORS.length];
  const hair = HAIR_COLORS[(seed * 2) % HAIR_COLORS.length];

  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: isKid ? 0x1d4ed8 : 0x334155, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.75 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });

  // Legs (pivoted at hip for smooth walking animation!)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11 * s, 0.68 * s, 0);
  const lLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08 * s, 0.44 * s, 6, 10), pantsMat);
  lLegMesh.position.y = -0.32 * s;
  lLegMesh.castShadow = true;
  leftLeg.add(lLegMesh);
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, 0.09 * s, 0.22 * s), shoeMat);
  lShoe.position.set(0, -0.62 * s, 0.04 * s);
  leftLeg.add(lShoe);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11 * s, 0.68 * s, 0);
  const rLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08 * s, 0.44 * s, 6, 10), pantsMat);
  rLegMesh.position.y = -0.32 * s;
  rLegMesh.castShadow = true;
  rightLeg.add(rLegMesh);
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, 0.09 * s, 0.22 * s), shoeMat);
  rShoe.position.set(0, -0.62 * s, 0.04 * s);
  rightLeg.add(rShoe);
  group.add(rightLeg);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19 * s, 0.34 * s, 8, 12), shirtMat);
  torso.position.y = 1.02 * s;
  torso.castShadow = true;
  group.add(torso);

  // Arms (pivoted at shoulders for waving & carrying bags/free food!)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.25 * s, 1.2 * s, 0);
  const lArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.062 * s, 0.36 * s, 6, 10), shirtMat);
  lArmMesh.position.y = -0.22 * s;
  leftArm.add(lArmMesh);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.25 * s, 1.2 * s, 0);
  const rArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.062 * s, 0.36 * s, 6, 10), shirtMat);
  rArmMesh.position.y = -0.22 * s;
  rightArm.add(rArmMesh);
  group.add(rightArm);

  // Head + Cute Eyes + Hair Cap
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19 * s, 18, 16), skinMat);
  head.position.y = 1.48 * s;
  head.castShadow = true;
  group.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.2 * s, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairCap.position.y = 1.51 * s;
  group.add(hairCap);

  // Eyes facing +Z (standard lookAt direction)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  [-0.065 * s, 0.065 * s].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 8, 8), eyeMat);
    eye.position.set(ex, 1.5 * s, 0.175 * s);
    group.add(eye);
  });

  // Hand Carry Anchor (for shopping bag, $100,000 tip, or Free Food tray!)
  const handAnchor = new THREE.Group();
  handAnchor.position.set(0, 0.96 * s, 0.42 * s);
  group.add(handAnchor);

  // Name Tag floating cleanly over head (for Lost Kids and Parents!)
  let nameSprite = null;
  if (name) {
    nameSprite = createNameTagSprite(name, isKid ? '#ffc220' : '#0071ce', isKid ? '#0f172a' : '#ffffff');
    nameSprite.position.set(0, (isKid ? 2.08 : 2.1) * s, 0);
    group.add(nameSprite);
  }

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    handAnchor,
    nameSprite
  };
}
