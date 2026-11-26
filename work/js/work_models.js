/**
 * Calm Chess Games — Target Night Shift XR Procedural 3D Models & Textures
 * 100% Procedural Three.js Geometry & Canvas Textures (Zero External Assets!)
 *  - Target Red & White Store Architecture, Bullseye Signs, Starry Night Front Windows & Sliding Exit Doors
 *  - Dynamic 3D Store Wall Clock (8:30 PM -> 3:00 AM) + Addyson's 3D Employee Name Badge
 *  - 5 Themed Restocking Gondola Bays: Jumbo Squishies, NeeDoh Squishies, Clickers, Large VRs, Small VRs
 *  - Rolling Red Target Stock Cart (U-Boat)
 *  - Big Red Phone Pillar with Liftoff Handset, Coiled Cord, Pulsing Red Beacon & Ceiling PA Speakers
 *  - Interactive Breakroom with 9:00 PM Lunch Tray (Pizza, Boba, Donut, Apple) & Time Clock
 *  - Cute Procedural Lost Kids (with Shirt Name Tags) & Reunited Parents + Addyson's Car Outside!
 */

import * as THREE from 'three';

export const ITEM_TYPES = {
  JUMBO_SQUISHY: 'jumbo_squishy',
  NEEDOH: 'needoh',
  CLICKER: 'clicker',
  VR_LARGE: 'vr_large',
  VR_SMALL: 'vr_small'
};

export const ITEM_META = {
  [ITEM_TYPES.JUMBO_SQUISHY]: {
    label: 'Jumbo Squishy',
    colorHex: 0xff7eb6,
    accentHex: 0xffe066,
    bayColor: '#ff5ca8'
  },
  [ITEM_TYPES.NEEDOH]: {
    label: 'NeeDoh Squishy',
    colorHex: 0x38d9c0,
    accentHex: 0xc084fc,
    bayColor: '#14b8a6'
  },
  [ITEM_TYPES.CLICKER]: {
    label: 'Kawaii Clicker',
    colorHex: 0xc084fc,
    accentHex: 0xff85c0,
    bayColor: '#a855f7'
  },
  [ITEM_TYPES.VR_LARGE]: {
    label: 'Large VR',
    colorHex: 0x38bdf8,
    accentHex: 0xf8fafc,
    bayColor: '#0284c7'
  },
  [ITEM_TYPES.VR_SMALL]: {
    label: 'Small VR',
    colorHex: 0xfb923c,
    accentHex: 0xfff7ed,
    bayColor: '#ea580c'
  }
};

export const LOST_KID_NAMES = [
  'Maya', 'Leo', 'Chloe', 'Lucas', 'Zoe', 'Noah',
  'Mia', 'Liam', 'Lily', 'Ethan', 'Ava', 'Oliver',
  'Sofia', 'Mason', 'Harper', 'Jack'
];

// ---------------------------------------------------------------------------
// Procedural Canvas Texture Helpers
// ---------------------------------------------------------------------------

export function createTileFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');

  g.fillStyle = '#f6f3ee';
  g.fillRect(0, 0, 512, 512);

  // Subtle tile grid (4x4 tiles)
  const step = 128;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      g.fillStyle = (x + y) % 2 === 0 ? '#faf8f5' : '#f2efea';
      g.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
      // subtle terrazzo speckles
      for (let s = 0; s < 14; s++) {
        const sx = x * step + 8 + Math.random() * (step - 16);
        const sy = y * step + 8 + Math.random() * (step - 16);
        g.fillStyle = s % 3 === 0 ? 'rgba(204, 0, 0, 0.05)' : 'rgba(120, 125, 138, 0.08)';
        g.fillRect(sx, sy, 3, 3);
      }
    }
  }

  g.strokeStyle = 'rgba(180, 175, 168, 0.42)';
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
  tex.repeat.set(9, 9);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBullseyeTexture(bgColor = '#ffffff', redColor = '#cc0000') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = bgColor;
  g.fillRect(0, 0, 512, 512);

  g.beginPath();
  g.arc(256, 256, 224, 0, Math.PI * 2);
  g.fillStyle = redColor;
  g.fill();

  g.beginPath();
  g.arc(256, 256, 148, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();

  g.beginPath();
  g.arc(256, 256, 76, 0, Math.PI * 2);
  g.fillStyle = redColor;
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSignTexture(title, subtitle = '', bgHex = '#cc0000', textHex = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 256;
  const g = c.getContext('2d');

  // Rounded red banner
  g.fillStyle = bgHex;
  g.fillRect(0, 0, 768, 256);

  // Subtle white frame border
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 10;
  g.strokeRect(12, 12, 744, 232);

  g.fillStyle = textHex;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '900 72px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
  g.fillText(title, 384, subtitle ? 105 : 132);

  if (subtitle) {
    g.font = '700 40px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.fillText(subtitle, 384, 185);
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

  // Glossy white card base
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 640, 400);

  // Iconic Target Red top header
  g.fillStyle = '#cc0000';
  g.fillRect(0, 0, 640, 154);

  // Red bottom stripe
  g.fillStyle = '#cc0000';
  g.fillRect(0, 362, 640, 38);

  // Small bullseye on top-left
  g.beginPath();
  g.arc(76, 77, 46, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();
  g.beginPath();
  g.arc(76, 77, 30, 0, Math.PI * 2);
  g.fillStyle = '#cc0000';
  g.fill();
  g.beginPath();
  g.arc(76, 77, 14, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();

  // "HELLO" + "my name is"
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = '900 64px "Segoe UI", system-ui, sans-serif';
  g.fillText('HELLO', 355, 76);
  g.font = '700 34px "Segoe UI", system-ui, sans-serif';
  g.fillText('my name is', 355, 128);

  // Bold handwritten-style "Addyson"
  g.fillStyle = '#18181b';
  g.font = '900 112px "Comic Sans MS", "Chalkboard SE", "Segoe UI Rounded", cursive, sans-serif';
  g.fillText('Addyson', 320, 278);

  // Outer red border
  g.strokeStyle = '#b91c1c';
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

  // Soft pastel gradient glow
  const grad = g.createRadialGradient(128, 120, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0.06)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);

  // Big glossy anime eyes
  const drawEye = (cx, cy) => {
    g.beginPath();
    g.ellipse(cx, cy, 22, 26, 0, 0, Math.PI * 2);
    g.fillStyle = '#2b1428';
    g.fill();

    // Big starlight highlight
    g.beginPath();
    g.arc(cx - 7, cy - 9, 8.5, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();

    // Secondary sparkle
    g.beginPath();
    g.arc(cx + 8, cy + 7, 4.5, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
  };

  drawEye(82, 124);
  drawEye(174, 124);

  // Rosy cheeks
  g.fillStyle = cheekHex;
  g.globalAlpha = 0.65;
  g.beginPath();
  g.ellipse(54, 152, 20, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(202, 152, 20, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;

  // Cute cat/bear 'w' smile
  g.strokeStyle = '#3b1b36';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  if (style === 'cat') {
    g.arc(118, 152, 10, 0.15 * Math.PI, 0.9 * Math.PI);
    g.stroke();
    g.beginPath();
    g.arc(138, 152, 10, 0.1 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  } else {
    g.arc(128, 146, 17, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNameTagSprite(text, bgColor = '#fff7ed', borderColor = '#cc0000', textColor = '#18181b') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const g = c.getContext('2d');

  // Speech/badge bubble
  g.fillStyle = bgColor;
  g.beginPath();
  g.roundRect(14, 14, 484, 142, 42);
  g.fill();

  g.lineWidth = 10;
  g.strokeStyle = borderColor;
  g.stroke();

  // Pointer triangle
  g.beginPath();
  g.moveTo(232, 154);
  g.lineTo(256, 186);
  g.lineTo(280, 154);
  g.closePath();
  g.fillStyle = borderColor;
  g.fill();

  g.fillStyle = textColor;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '900 66px "Segoe UI Rounded", "Segoe UI", system-ui, sans-serif';
  g.fillText(text, 256, 86);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.1, 0.42, 1);
  return sprite;
}

// ---------------------------------------------------------------------------
// Dynamic 3D Store Digital Wall Clock
// ---------------------------------------------------------------------------
export function createStoreWallClock() {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.15, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35, metalness: 0.15 })
  );
  frame.castShadow = true;
  group.add(frame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.56, 0.92),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  screen.position.z = 0.095;
  group.add(screen);

  function update(timeText, statusTag = 'NIGHT SHIFT', accentColor = '#ff3b3b') {
    ctx.fillStyle = '#11131a';
    ctx.fillRect(0, 0, 640, 256);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 624, 240);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '800 32px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(statusTag, 320, 56);

    ctx.fillStyle = accentColor;
    ctx.font = '900 118px "Consolas", "Courier New", monospace';
    ctx.fillText(timeText, 320, 178);

    tex.needsUpdate = true;
  }

  update('8:30 PM', 'SHIFT 8:30 PM – 3:00 AM', '#ff4444');
  return { group, update };
}

// ---------------------------------------------------------------------------
// 5 Procedural Restockable Item Factories!
// ---------------------------------------------------------------------------

const JUMBO_PALETTES = [
  { name: 'Strawberry Cow', body: '#ff9ec7', hex: 0xff9ec7, ear: '#ff5c93', style: 'happy' },
  { name: 'Peach Kitty', body: '#ffb27d', hex: 0xffb27d, ear: '#ff7a45', style: 'cat' },
  { name: 'Galaxy Bunny', body: '#c496ff', hex: 0xc496ff, ear: '#ff85d0', style: 'happy' },
  { name: 'Mint Bear', body: '#7be8c6', hex: 0x7be8c6, ear: '#34d399', style: 'happy' }
];

export function createJumboSquishy(variantIdx = 0) {
  const pal = JUMBO_PALETTES[variantIdx % JUMBO_PALETTES.length];
  const group = new THREE.Group();

  // Puffy oversized pillowy body
  const bodyGeo = new THREE.SphereGeometry(0.24, 28, 22);
  bodyGeo.scale(1.08, 0.96, 0.92);
  const faceTex = createKawaiiFaceTexture(pal.body, '#ff5c93', pal.style);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.42,
    metalness: 0.04
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.y = -Math.PI / 2;
  body.position.y = 0.23;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Cute ears on top
  const earMat = new THREE.MeshStandardMaterial({ color: pal.ear, roughness: 0.4 });
  const earGeo = pal.name.includes('Bunny')
    ? new THREE.CapsuleGeometry(0.055, 0.14, 8, 12)
    : new THREE.SphereGeometry(0.078, 16, 14);

  [-0.14, 0.14].forEach((ex) => {
    const ear = new THREE.Mesh(earGeo, earMat);
    ear.position.set(ex, pal.name.includes('Bunny') ? 0.49 : 0.43, 0.02);
    ear.rotation.z = ex < 0 ? 0.25 : -0.25;
    ear.castShadow = true;
    group.add(ear);
  });

  // Little squishy paws & belly patch
  const pawMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  [-0.15, 0.15].forEach((px) => {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 12), pawMat);
    paw.position.set(px, 0.12, 0.16);
    paw.scale.set(1, 0.75, 0.8);
    group.add(paw);
  });

  // Little crown/bow accent on top
  const starAccent = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.055, 0),
    new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.25, emissive: 0x332200, emissiveIntensity: 0.25 })
  );
  starAccent.position.set(0, 0.47, 0.06);
  group.add(starAccent);

  group.userData.itemType = ITEM_TYPES.JUMBO_SQUISHY;
  group.userData.label = `Jumbo ${pal.name}`;
  return group;
}

const NEEDOH_COLORS = [
  { color: 0x38e8d6, name: 'Aqua Nice Cube', cube: true },
  { color: 0xff6bbd, name: 'Pink NeeDoh Ball', cube: false },
  { color: 0xb980ff, name: 'Purple Nice Cube', cube: true },
  { color: 0xffd84d, name: 'Sunny NeeDoh Ball', cube: false },
  { color: 0x60a5fa, name: 'Glacier Nice Cube', cube: true }
];

export function createNeedohSquishy(variantIdx = 0) {
  const pal = NEEDOH_COLORS[variantIdx % NEEDOH_COLORS.length];
  const group = new THREE.Group();

  const mat = new THREE.MeshPhysicalMaterial({
    color: pal.color,
    roughness: 0.16,
    metalness: 0.02,
    transmission: 0.42,
    thickness: 0.35,
    ior: 1.38,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
    emissive: pal.color,
    emissiveIntensity: 0.12
  });

  if (pal.cube) {
    // Rounded gelatin Nice Cube!
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24, 6, 6, 6), mat);
    // Slightly puff vertices to make a soft rounded squishy cube
    const pos = cube.geometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const len = v.length();
      v.multiplyScalar(0.84 + 0.16 * (0.17 / Math.max(0.08, len)));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    cube.geometry.computeVertexNormals();
    cube.position.y = 0.14;
    cube.castShadow = true;
    group.add(cube);

    // Little sparkle core suspended inside the gel cube
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.075, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.45 })
    );
    core.position.y = 0.14;
    group.add(core);
  } else {
    // Classic squishy groovy NeeDoh glob ball with cute NeeDoh logo band
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 18), mat);
    ball.scale.set(1.06, 0.92, 1.06);
    ball.position.y = 0.145;
    ball.castShadow = true;
    group.add(ball);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.014, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.145;
    group.add(ring);
  }

  group.userData.itemType = ITEM_TYPES.NEEDOH;
  group.userData.label = pal.name;
  return group;
}

const CLICKER_THEMES = [
  { caseColor: 0xff85c4, keyColor: '#ffd84d', housing: 0x38bdf8, name: 'Sunny Clicker' },
  { caseColor: 0xc084fc, keyColor: '#ff9ed2', housing: 0xa6e84f, name: 'Pink Kawaii Clicker' },
  { caseColor: 0x6cd8eb, keyColor: '#9ef0c8', housing: 0xff75bc, name: 'Mint Clicker' },
  { caseColor: 0xffa366, keyColor: '#d9b5ff', housing: 0xffd43b, name: 'Lavender Clicker' }
];

export function createClickerToy(variantIdx = 0) {
  const theme = CLICKER_THEMES[variantIdx % CLICKER_THEMES.length];
  const group = new THREE.Group();

  // Soft silicone mini 2x2 fidget case
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.08, 0.28),
    new THREE.MeshStandardMaterial({ color: theme.caseColor, roughness: 0.35 })
  );
  base.position.y = 0.045;
  base.castShadow = true;
  group.add(base);

  const faceTex = createKawaiiFaceTexture(theme.keyColor, '#ff5ca8', 'cat');
  const keyCapMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.28 });
  const switchMat = new THREE.MeshStandardMaterial({
    color: theme.housing,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85
  });

  const keys = [];
  const offsets = [-0.068, 0.068];
  for (const ox of offsets) {
    for (const oz of offsets) {
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.055, 0.105), switchMat);
      housing.position.set(ox, 0.1, oz);
      group.add(housing);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.075, 0.095), keyCapMat);
      cap.position.set(ox, 0.155, oz);
      cap.castShadow = true;
      group.add(cap);
      keys.push(cap);
    }
  }

  // Cute keychain bead ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.009, 8, 18),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.65, roughness: 0.25 })
  );
  ring.position.set(0.16, 0.08, 0);
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  group.userData.itemType = ITEM_TYPES.CLICKER;
  group.userData.label = theme.name;
  group.userData.keys = keys;
  return group;
}

export function createLargeVR(variantIdx = 0) {
  const group = new THREE.Group();
  const accentHex = variantIdx % 2 === 0 ? 0x0ea5e9 : 0x6366f1;

  // Retail white tech display base / cradle
  const boxBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.05, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 })
  );
  boxBase.position.y = 0.025;
  boxBase.castShadow = true;
  group.add(boxBase);

  // Full-size Large VR Headset body (white curved sleek visor)
  const visorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22, metalness: 0.1 });
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.175, 0.17), visorMat);
  visor.position.set(0, 0.155, 0.04);
  visor.castShadow = true;
  group.add(visor);

  // Glossy dark front faceplate
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.33, 0.145, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.65 })
  );
  plate.position.set(0, 0.155, 0.125);
  group.add(plate);

  // 3 iconic front passthrough camera pills + glowing cyan accent strip
  const camMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.08, metalness: 0.8 });
  [-0.095, 0, 0.095].forEach((cx) => {
    const pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.032, 6, 10), camMat);
    pill.position.set(cx, 0.155, 0.14);
    group.add(pill);
  });

  const glowBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.014, 0.01),
    new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 1.1 })
  );
  glowBar.position.set(0, 0.222, 0.138);
  group.add(glowBar);

  // Black cushion & rigid halo headstrap
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.024, 10, 24, Math.PI * 1.2), strapMat);
  strap.rotation.x = Math.PI / 2;
  strap.rotation.z = -Math.PI * 0.1;
  strap.position.set(0, 0.16, -0.05);
  group.add(strap);

  // Dual Touch Controllers resting beside it!
  [-0.17, 0.17].forEach((cx) => {
    const ctrl = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.13, 10), visorMat);
    ctrl.position.set(cx, 0.085, -0.07);
    ctrl.rotation.x = 0.5;
    group.add(ctrl);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 8, 16), visorMat);
    ring.position.set(cx, 0.12, -0.04);
    group.add(ring);
  });

  group.userData.itemType = ITEM_TYPES.VR_LARGE;
  group.userData.label = 'Large VR Headset';
  return group;
}

const SMALL_VR_COLORS = [0xff5c5c, 0xfb923c, 0x34d399, 0xa855f7];

export function createSmallVR(variantIdx = 0) {
  const colorHex = SMALL_VR_COLORS[variantIdx % SMALL_VR_COLORS.length];
  const group = new THREE.Group();

  // Compact cute Mini VR Goggles! (Clearly smaller & colorful vs Large VR!)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.115, 0.11),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.28, metalness: 0.12 })
  );
  body.position.set(0, 0.085, 0.02);
  body.castShadow = true;
  group.add(body);

  // Glossy white front rim & dark twin goggle lens eyes
  const frontGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.195, 0.085, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.7 })
  );
  frontGlass.position.set(0, 0.085, 0.075);
  group.add(frontGlass);

  [-0.048, 0.048].forEach((lx) => {
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.024, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.85 })
    );
    lens.position.set(lx, 0.085, 0.087);
    group.add(lens);
  });

  // Soft elastic mini band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.015, 8, 20, Math.PI * 1.15),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 })
  );
  band.rotation.x = Math.PI / 2;
  band.rotation.z = -Math.PI * 0.07;
  band.position.set(0, 0.085, -0.04);
  group.add(band);

  group.userData.itemType = ITEM_TYPES.VR_SMALL;
  group.userData.label = 'Small VR Goggles';
  return group;
}

export function createRestockItem(itemType, variantIdx = 0) {
  switch (itemType) {
    case ITEM_TYPES.JUMBO_SQUISHY: return createJumboSquishy(variantIdx);
    case ITEM_TYPES.NEEDOH: return createNeedohSquishy(variantIdx);
    case ITEM_TYPES.CLICKER: return createClickerToy(variantIdx);
    case ITEM_TYPES.VR_LARGE: return createLargeVR(variantIdx);
    case ITEM_TYPES.VR_SMALL: return createSmallVR(variantIdx);
    default: return createJumboSquishy(variantIdx);
  }
}

// ---------------------------------------------------------------------------
// Red Target Stock Cart (Rolling U-Boat)
// ---------------------------------------------------------------------------
export function createStockCart() {
  const group = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35, metalness: 0.3 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.3, metalness: 0.7 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });

  // Lower deck & Upper shelf
  const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.82), redMat);
  lowerDeck.position.y = 0.24;
  lowerDeck.castShadow = true;
  lowerDeck.receiveShadow = true;
  group.add(lowerDeck);

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.82), redMat);
  upperDeck.position.y = 0.92;
  upperDeck.castShadow = true;
  upperDeck.receiveShadow = true;
  group.add(upperDeck);

  // Tall red U-boat push handles on both ends
  [-0.84, 0.84].forEach((x) => {
    [-0.36, 0.36].forEach((z) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.32, 10), redMat);
      post.position.set(x, 0.88, z);
      group.add(post);
    });
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.74, 10), steelMat);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(x, 1.52, 0);
    group.add(crossbar);
  });

  // 4 caster wheels
  [-0.68, 0.68].forEach((wx) => {
    [-0.3, 0.3].forEach((wz) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.1, wz);
      group.add(wheel);
    });
  });

  // Decorative cardboard stock boxes on lower deck
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xc89d6c, roughness: 0.85 });
  [-0.45, 0.15, 0.58].forEach((bx, idx) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.56), boxMat);
    box.position.set(bx, 0.47, (idx % 2 === 0 ? -0.04 : 0.05));
    box.rotation.y = (idx - 1) * 0.08;
    box.castShadow = true;
    group.add(box);
  });

  // Addyson's 3D Employee Name Badge clipped neatly on the lower front rail (never blocks cart items!)
  const badgeTex = createNameBadgeTexture();
  const badgeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.26, 0.025),
    [
      redMat, redMat, redMat, redMat,
      new THREE.MeshStandardMaterial({ map: badgeTex, roughness: 0.2 }),
      redMat
    ]
  );
  badgeMesh.position.set(0, 0.78, 0.43);
  badgeMesh.rotation.x = -0.08;
  group.add(badgeMesh);

  // Define 6 neat pickup slots on top of the cart deck
  const slotLocalPositions = [
    new THREE.Vector3(-0.56, 0.96, -0.18),
    new THREE.Vector3(0.0, 0.96, -0.18),
    new THREE.Vector3(0.56, 0.96, -0.18),
    new THREE.Vector3(-0.56, 0.96, 0.18),
    new THREE.Vector3(0.0, 0.96, 0.18),
    new THREE.Vector3(0.56, 0.96, 0.18)
  ];

  return { group, slotLocalPositions };
}

// ---------------------------------------------------------------------------
// Target Gondola Restocking Bay (Returns shelf slots!)
// ---------------------------------------------------------------------------
export function createShelfBay(itemType, title, subtitle) {
  const meta = ITEM_META[itemType];
  const group = new THREE.Group();

  const backMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42 });

  // Backboard & side frames
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.35, 0.1), backMat);
  back.position.set(0, 1.18, -0.36);
  back.receiveShadow = true;
  group.add(back);

  [-1.24, 1.24].forEach((sx) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.38, 0.72), redTrimMat);
    pillar.position.set(sx, 1.19, -0.02);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Top Header Sign
  const signTex = createSignTexture(title, subtitle, meta.bayColor, '#ffffff');
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.56, 0.5, 0.12),
    [
      redTrimMat, redTrimMat, redTrimMat, redTrimMat,
      new THREE.MeshBasicMaterial({ map: signTex }),
      redTrimMat
    ]
  );
  signBoard.position.set(0, 2.52, -0.05);
  group.add(signBoard);

  // 2 Shelf Tiers (Middle y=0.72, Upper y=1.42) + Base kickplate
  const kickplate = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.18, 0.7), redTrimMat);
  kickplate.position.set(0, 0.09, 0);
  group.add(kickplate);

  const slots = [];
  const shelfHeights = [0.76, 1.44];
  const colXs = [-0.76, 0, 0.76];

  shelfHeights.forEach((sy) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.06, 0.68), shelfMat);
    plank.position.set(0, sy, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);

    // Red price-tag strip along front edge
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.055, 0.025), redTrimMat);
    strip.position.set(0, sy, 0.345);
    group.add(strip);

    // 3 glowing target placement pads per shelf tier (6 slots per bay!)
    colXs.forEach((cx) => {
      const padGeo = new THREE.RingGeometry(0.14, 0.21, 24);
      const padMat = new THREE.MeshBasicMaterial({
        color: meta.colorHex,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(cx, sy + 0.036, 0.02);
      group.add(pad);

      // Subtle floating silhouette beacon dot
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.11, 20),
        new THREE.MeshBasicMaterial({
          color: meta.accentHex,
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide
        })
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(cx, sy + 0.035, 0.02);
      group.add(dot);

      const anchor = new THREE.Object3D();
      anchor.position.set(cx, sy + 0.035, 0.02);
      group.add(anchor);

      slots.push({
        itemType,
        bayGroup: group,
        anchor,
        pad,
        dot,
        occupied: false,
        itemMesh: null
      });
    });
  });

  return { group, slots };
}

// ---------------------------------------------------------------------------
// THE BIG RED PHONE STATION (Iconic Target Assistance Pillar!)
// ---------------------------------------------------------------------------
export function createBigRedPhoneStation() {
  const group = new THREE.Group();

  const redGlossMat = new THREE.MeshStandardMaterial({ color: 0xdc0000, roughness: 0.22, metalness: 0.18 });
  const brightRedMat = new THREE.MeshStandardMaterial({
    color: 0xff1a1a,
    roughness: 0.18,
    metalness: 0.15,
    emissive: 0x330000,
    emissiveIntensity: 0.25
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  // Sturdy red column
  const column = new THREE.Mesh(new THREE.BoxGeometry(0.66, 2.3, 0.52), redGlossMat);
  column.position.y = 1.15;
  column.castShadow = true;
  column.receiveShadow = true;
  group.add(column);

  // White Target Bullseye medallion on upper front
  const bullseye = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 32),
    new THREE.MeshBasicMaterial({ map: createBullseyeTexture('#ffffff', '#cc0000') })
  );
  bullseye.position.set(0, 1.98, 0.268);
  group.add(bullseye);

  // Top Beacon Light Dome (pulses bright red/gold when a lost kid needs paging!)
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff1111,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    transparent: true,
    opacity: 0.92
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), beaconMat);
  beacon.position.set(0, 2.32, 0);
  group.add(beacon);

  const beaconLight = new THREE.PointLight(0xff2222, 0.5, 6);
  beaconLight.position.set(0, 2.52, 0.15);
  group.add(beaconLight);

  // Oversized BIG RED PHONE box mounted at comfortable height
  const phoneBox = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.18), brightRedMat);
  phoneBox.position.set(0, 1.24, 0.32);
  phoneBox.castShadow = true;
  group.add(phoneBox);

  // Silver speaker grille & metallic dial plate
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.03), darkMat);
  grille.position.set(0, 1.38, 0.41);
  group.add(grille);

  // Glowing PA push button
  const paButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.072, 0.04, 20),
    new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xf59e0b, emissiveIntensity: 0.55, roughness: 0.2 })
  );
  paButton.rotation.x = Math.PI / 2;
  paButton.position.set(0, 1.12, 0.42);
  group.add(paButton);

  // Iconic BIG RED HANDSET (lifts off the cradle during PA announcements!)
  const handset = new THREE.Group();
  const handleBar = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.34, 8, 14), brightRedMat);
  handleBar.castShadow = true;
  handset.add(handleBar);

  const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.075, 0.09, 18), brightRedMat);
  earCup.rotation.x = Math.PI / 2;
  earCup.position.set(0, 0.2, 0.055);
  handset.add(earCup);

  const mouthCup = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.075, 0.09, 18), brightRedMat);
  mouthCup.rotation.x = Math.PI / 2;
  mouthCup.position.set(0, -0.2, 0.055);
  handset.add(mouthCup);

  // Cradle rest position
  const handsetRestPos = new THREE.Vector3(-0.27, 1.28, 0.36);
  handset.position.copy(handsetRestPos);
  handset.rotation.set(0, -0.35, 0.08);
  group.add(handset);

  // Procedural coiled red cord
  const cordGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 12), redGlossMat);
    coil.position.set(-0.22, 0.98 - i * 0.032, 0.36);
    coil.rotation.x = Math.PI / 2;
    cordGroup.add(coil);
  }
  group.add(cordGroup);

  // Animated sound wave rings (visible while paging!)
  const soundRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35 + i * 0.25, 0.02, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 })
    );
    ring.position.set(0, 2.35, 0.22);
    group.add(ring);
    soundRings.push(ring);
  }

  // Invisible generous hit box for easy interaction
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 2.2, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.set(0, 1.2, 0.25);
  hitbox.userData.interactType = 'big_red_phone';
  group.add(hitbox);

  return { group, handset, handsetRestPos, beacon, beaconMat, beaconLight, soundRings, hitbox };
}

// ---------------------------------------------------------------------------
// Lost Kid & Parent Procedural 3D Characters
// ---------------------------------------------------------------------------
const KID_SHIRTS = [0x38bdf8, 0xff75bc, 0xa6e84f, 0xffb24c, 0xc084fc, 0xf87171];
const SKIN_TONES = [0xfcd5b5, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
const HAIR_COLORS = [0x3b2314, 0xfacc15, 0x18181b, 0x9a3412, 0x713f12];

export function createPersonCharacter({ isKid = true, name = 'Maya', seed = 0 } = {}) {
  const group = new THREE.Group();
  const scale = isKid ? 0.68 : 1.06;

  const shirtColor = KID_SHIRTS[seed % KID_SHIRTS.length];
  const skinColor = SKIN_TONES[seed % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[(seed * 3 + 1) % HAIR_COLORS.length];

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.55 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: isKid ? shirtColor : 0x334155, roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: isKid ? 0x2563eb : 0x1e293b, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.1, 0.46, 0);
  const legMeshL = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.3, 6, 10), pantsMat);
  legMeshL.position.y = -0.18;
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), shoeMat);
  shoeL.position.set(0, -0.4, 0.04);
  leftLeg.add(legMeshL, shoeL);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.1, 0.46, 0);
  const legMeshR = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.3, 6, 10), pantsMat);
  legMeshR.position.y = -0.18;
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), shoeMat);
  shoeR.position.set(0, -0.4, 0.04);
  rightLeg.add(legMeshR, shoeR);
  group.add(rightLeg);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.34, 8, 14), shirtMat);
  torso.position.y = 0.78;
  torso.castShadow = true;
  group.add(torso);

  // Backpack for kids!
  if (isKid) {
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.3, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.45 })
    );
    pack.position.set(0, 0.8, -0.2);
    group.add(pack);
  } else {
    // Red Target hand basket for parent!
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.2, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 })
    );
    basket.position.set(0.34, 0.56, 0.16);
    group.add(basket);
  }

  // Arms
  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 6, 10), shirtMat);
  leftArm.position.set(-0.26, 0.8, 0);
  leftArm.rotation.z = 0.25;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 6, 10), shirtMat);
  rightArm.position.set(0.26, 0.8, 0);
  rightArm.rotation.z = -0.25;
  group.add(rightArm);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), skinMat);
  head.position.y = 1.24;
  head.castShadow = true;
  group.add(head);

  // Hair cap
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.232, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hair.position.set(0, 1.26, -0.02);
  group.add(hair);

  // Cute eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  [-0.075, 0.075].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), eyeMat);
    eye.position.set(ex, 1.25, 0.195);
    group.add(eye);
  });

  group.scale.setScalar(scale);

  // Name bubble hovering above kid!
  let nameSprite = null;
  if (isKid) {
    nameSprite = createNameTagSprite(`${name} ?`, '#fffbeb', '#ef4444', '#b91c1c');
    nameSprite.position.set(0, 1.85, 0);
    group.add(nameSprite);
  }

  // Hitbox for easy interaction
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.8, 0.85),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.y = 0.9;
  hitbox.userData.interactType = isKid ? 'lost_kid' : 'parent';
  group.add(hitbox);

  return { group, leftLeg, rightLeg, leftArm, rightArm, nameSprite, hitbox, name };
}

// ---------------------------------------------------------------------------
// 9:00 PM Interactive Breakroom & Lunch Tray
// ---------------------------------------------------------------------------
export function createBreakroomArea() {
  const group = new THREE.Group();

  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.55 });

  // Breakroom rug/zone highlight
  const floorMatMesh = new THREE.Mesh(
    new THREE.CircleGeometry(2.15, 36),
    new THREE.MeshStandardMaterial({ color: 0xfef2f2, roughness: 0.85 })
  );
  floorMatMesh.rotation.x = -Math.PI / 2;
  floorMatMesh.position.y = 0.012;
  group.add(floorMatMesh);

  // Glowing golden lunch ring (pulses brightly at 9:00 PM!)
  const lunchRingMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
  });
  const lunchRing = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.15, 36), lunchRingMat);
  lunchRing.rotation.x = -Math.PI / 2;
  lunchRing.position.y = 0.018;
  group.add(lunchRing);

  // Round bistro table
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.07, 28), woodMat);
  tableTop.position.y = 0.86;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.84, 16), redMat);
  tableLeg.position.y = 0.42;
  group.add(tableLeg);

  const tableFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.05, 20), redMat);
  tableFoot.position.y = 0.025;
  group.add(tableFoot);

  // Two cute red Target breakroom stools
  [-1.08, 1.08].forEach((sx) => {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.07, 18), redMat);
    seat.position.set(sx, 0.54, 0);
    seat.castShadow = true;
    group.add(seat);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.52, 10), whiteMat);
    pole.position.set(sx, 0.26, 0);
    group.add(pole);
  });

  // Overhead Breakroom Sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.52, 0.1),
    [
      redMat, redMat, redMat, redMat,
      new THREE.MeshBasicMaterial({ map: createSignTexture('BREAKROOM', 'LUNCH 9:00 PM', '#cc0000') }),
      redMat
    ]
  );
  sign.position.set(0, 2.75, -1.65);
  group.add(sign);

  // Red Lunch Tray on the table
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.035, 0.62), redMat);
  tray.position.set(0, 0.915, 0);
  group.add(tray);

  // 4 Interactive 3D Lunch Food Items!
  const foodItems = [];

  // 1. Cheesy Pepperoni Pizza Slice
  const pizza = new THREE.Group();
  const crust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 3),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
  );
  crust.scale.set(1.15, 1, 1.25);
  pizza.add(crust);
  const rim = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.028, 0.26, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  rim.rotation.z = Math.PI / 2;
  rim.position.set(0, 0.015, -0.11);
  pizza.add(rim);
  [[-0.04, 0.02], [0.05, 0.0], [0, 0.09]].forEach(([px, pz]) => {
    const pep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.012, 12),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
    );
    pep.position.set(px, 0.024, pz);
    pizza.add(pep);
  });
  pizza.position.set(-0.22, 0.96, 0.06);
  pizza.userData = { interactType: 'lunch_food', isDrink: false, bitesLeft: 3, maxBites: 3 };
  group.add(pizza);
  foodItems.push(pizza);

  // 2. Pink Strawberry Boba Tea Cup!
  const boba = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.065, 0.24, 18),
    new THREE.MeshPhysicalMaterial({ color: 0xff9ed2, roughness: 0.15, transmission: 0.35, clearcoat: 1 })
  );
  cup.position.y = 0.12;
  boba.add(cup);
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.086, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
  );
  lid.position.y = 0.23;
  boba.add(lid);
  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 })
  );
  straw.position.set(0.02, 0.3, 0);
  straw.rotation.z = -0.15;
  boba.add(straw);
  boba.position.set(0.24, 0.935, -0.1);
  boba.userData = { interactType: 'lunch_food', isDrink: true, bitesLeft: 3, maxBites: 3 };
  group.add(boba);
  foodItems.push(boba);

  // 3. Pink Frosted Sprinkle Donut!
  const donut = new THREE.Group();
  const dough = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.042, 12, 22),
    new THREE.MeshStandardMaterial({ color: 0xe6a760, roughness: 0.7 })
  );
  dough.rotation.x = Math.PI / 2;
  donut.add(dough);
  const icing = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.044, 10, 22),
    new THREE.MeshStandardMaterial({ color: 0xff6bbd, roughness: 0.25 })
  );
  icing.rotation.x = Math.PI / 2;
  icing.position.y = 0.014;
  donut.add(icing);
  donut.position.set(0.18, 0.975, 0.14);
  donut.userData = { interactType: 'lunch_food', isDrink: false, bitesLeft: 2, maxBites: 2 };
  group.add(donut);
  foodItems.push(donut);

  // 4. Shiny Red Apple
  const apple = new THREE.Group();
  const appleBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 16, 14),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 })
  );
  appleBody.position.y = 0.075;
  apple.add(appleBody);
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 })
  );
  leaf.scale.set(1.5, 0.3, 0.8);
  leaf.position.set(0.03, 0.16, 0);
  apple.add(leaf);
  apple.position.set(-0.2, 0.935, -0.15);
  apple.userData = { interactType: 'lunch_food', isDrink: false, bitesLeft: 2, maxBites: 2 };
  group.add(apple);
  foodItems.push(apple);

  // Wall Time Clock (interactive to punch back in or punch out!)
  const timeClock = new THREE.Group();
  const tcBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.62, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
  );
  timeClock.add(tcBody);
  const tcGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.24, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.7 })
  );
  tcGlow.position.set(0, 0.1, 0.085);
  timeClock.add(tcGlow);
  timeClock.position.set(1.6, 1.45, -1.6);
  tcBody.userData.interactType = 'time_clock';
  tcGlow.userData.interactType = 'time_clock';
  group.add(timeClock);

  return { group, foodItems, lunchRing, lunchRingMat, timeClock, tcGlow };
}

// ---------------------------------------------------------------------------
// Complete Target Store Environment + 3:00 AM Sliding Exit & Addyson's Car!
// ---------------------------------------------------------------------------
export function createStoreEnvironment() {
  const group = new THREE.Group();

  // Floor
  const floorTex = createTileFloorTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.32, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.isFloor = true;
  group.add(floor);

  // Red Target Aisle Carpet Runner down the main aisle
  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 17.5),
    new THREE.MeshStandardMaterial({ color: 0xfee2e2, roughness: 0.85 })
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.008, 0.2);
  runner.receiveShadow = true;
  runner.userData.isFloor = true;
  group.add(runner);

  // Walls (White upper, iconic Target red stripe)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.72 });
  const redBandMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });

  // Back Wall (z = -9.2)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 5.2, 0.3), wallMat);
  backWall.position.set(0, 2.6, -9.2);
  backWall.receiveShadow = true;
  group.add(backWall);

  const backStripe = new THREE.Mesh(new THREE.BoxGeometry(20, 0.55, 0.34), redBandMat);
  backStripe.position.set(0, 4.4, -9.2);
  group.add(backStripe);

  // Giant Target Bullseye on Back Wall
  const bigBullseye = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 42),
    new THREE.MeshBasicMaterial({ map: createBullseyeTexture('#fafafa', '#cc0000') })
  );
  bigBullseye.position.set(-4.2, 3.05, -9.02);
  group.add(bigBullseye);

  // Big 3D Name Badge Mural on Back Wall ("HELLO my name is Addyson")
  const wallBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.38),
    new THREE.MeshBasicMaterial({ map: createNameBadgeTexture() })
  );
  wallBadge.position.set(4.4, 3.05, -9.02);
  group.add(wallBadge);

  // Left & Right Walls (x = -9.6, x = 9.6)
  [-9.6, 9.6].forEach((wx) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.2, 19.6), wallMat);
    sideWall.position.set(wx, 2.6, 0.4);
    sideWall.receiveShadow = true;
    group.add(sideWall);

    const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.55, 19.6), redBandMat);
    sideStripe.position.set(wx, 4.4, 0.4);
    group.add(sideStripe);
  });

  // Front Storefront Wall with Panoramic Night Windows & Sliding Automatic Glass Doors (z = +9.6)
  [-6.1, 6.1].forEach((fx) => {
    const frontPillar = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.0, 0.3), wallMat);
    frontPillar.position.set(fx, 0.5, 9.6);
    group.add(frontPillar);

    const glassWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(7.0, 3.4),
      new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        roughness: 0.08,
        transparent: true,
        opacity: 0.22
      })
    );
    glassWindow.position.set(fx, 2.7, 9.6);
    group.add(glassWindow);
  });

  const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(20, 1.1, 0.35), redBandMat);
  frontHeader.position.set(0, 4.65, 9.6);
  group.add(frontHeader);

  // Glowing EXIT Sign above front doors
  const exitSign = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.52, 0.14),
    new THREE.MeshBasicMaterial({ map: createSignTexture('EXIT', '3:00 AM HOME', '#16a34a') })
  );
  exitSign.position.set(0, 3.8, 9.35);
  exitSign.rotation.y = Math.PI;
  group.add(exitSign);

  // Sliding Glass Doors (Left & Right halves that slide open at 3:00 AM!)
  const doorMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    roughness: 0.08,
    transparent: true,
    opacity: 0.42
  });
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 });

  const leftDoor = new THREE.Group();
  const ldGlass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 3.1, 0.08), doorMat);
  const ldFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), doorFrameMat);
  ldFrame.position.y = 1.5;
  leftDoor.add(ldGlass, ldFrame);
  leftDoor.position.set(-0.74, 1.55, 9.55);
  group.add(leftDoor);

  const rightDoor = new THREE.Group();
  const rdGlass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 3.1, 0.08), doorMat);
  const rdFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), doorFrameMat);
  rdFrame.position.y = 1.5;
  rightDoor.add(rdGlass, rdFrame);
  rightDoor.position.set(0.74, 1.55, 9.55);
  group.add(rightDoor);

  // Exit Portal Glow Pad (bright golden-green at 3:00 AM!)
  const exitPadMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const exitPad = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), exitPadMat);
  exitPad.rotation.x = -Math.PI / 2;
  exitPad.position.set(0, 0.02, 8.2);
  exitPad.userData.interactType = 'exit_home';
  group.add(exitPad);

  const exitHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.2, 1.8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  exitHitbox.position.set(0, 1.6, 9.1);
  exitHitbox.userData.interactType = 'exit_home';
  group.add(exitHitbox);

  // Outside Starry Night Sky + Parking Lot + Addyson's Waiting Car (visible through front glass!)
  const parkingLot = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 18),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
  );
  parkingLot.rotation.x = -Math.PI / 2;
  parkingLot.position.set(0, -0.02, 18.5);
  group.add(parkingLot);

  // Cute Glowing Car waiting outside for 3:00 AM!
  const car = new THREE.Group();
  const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.72, 4.1),
    new THREE.MeshStandardMaterial({ color: 0xff5ca8, roughness: 0.25, metalness: 0.35 })
  );
  carBody.position.y = 0.56;
  car.add(carBody);
  const carCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.62, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xffe4f2, roughness: 0.2 })
  );
  carCabin.position.set(0, 1.15, -0.15);
  car.add(carCabin);
  [-0.7, 0.7].forEach((hx) => {
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    headlight.position.set(hx, 0.62, -2.06);
    car.add(headlight);
  });
  car.position.set(0, 0, 14.5);
  car.rotation.y = 0.24;
  group.add(car);

  // Starfield outside the front storefront
  const starGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 160; i++) {
    starPositions.push(
      (Math.random() - 0.5) * 38,
      3.5 + Math.random() * 14,
      16 + Math.random() * 18
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.24, transparent: true, opacity: 0.9 })
  );
  group.add(stars);

  // Crescent Moon outside
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
  );
  moon.position.set(-7.5, 9.8, 26);
  group.add(moon);

  // Ceiling & Fluorescent Retail Lights
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 5.15, 0.2);
  group.add(ceiling);

  const lightFixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-4.5, 0, 4.5].forEach((lx) => {
    [-4.5, 0.5, 5.2].forEach((lz) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 2.4), lightFixtureMat);
      strip.position.set(lx, 5.05, lz);
      group.add(strip);
    });
  });

  // Red Target Parking Bollards right outside the glass doors!
  [-2.6, 2.6].forEach((bx) => {
    const bollard = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 18, 16),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 })
    );
    bollard.position.set(bx, 0.42, 10.7);
    group.add(bollard);
  });

  return { group, leftDoor, rightDoor, exitPad, exitPadMat, exitHitbox, car, stars };
}
