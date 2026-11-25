/**
 * Procedural WebXR Sci-Fi Enemy: Void Recon Drone (Stage 1 - Warp Origin)
 * High-fidelity procedural XR reconstruction & enhancement of:
 *   wormhole0/mobile/warp_origin_images/recon_drone_2.8m.glb
 *
 * Architectural & Visual Upgrades:
 *  - Precision spherical-ovoid pearl-white ceramic-titanium armored scout chassis with
 *    1024x1024 procedural PBR CanvasTextures (chamfered panel seams, micro-fasteners,
 *    brushed ceramic-alloy wear, bump relief, satin-vs-gloss roughness contrast, and
 *    recessed crimson energy conduit seams)
 *  - Iconic top zenith armored crown turret housing a glowing crimson-red plasma core
 *    with a counter-rotating 6-petal mechanical white iris emblem
 *  - Four beveled upper-quadrant recessed crimson optical sensor pods, sculpted forehead
 *    armor crest with dual micro-telemetry emitters, and equatorial structural belt
 *  - Signature port-side (-X) oversized concentric crimson bullseye optical scanner dish
 *    with custom GLSL rotating radar pulse + lower ribbed rotating crimson-slotted drum,
 *    balanced with sleek starboard (+X) recessed flank sensor & maneuvering housings
 *  - Large rear (-Z) concave crimson-red main ion thruster bell framed by twin vertical
 *    stabilizer clamp brackets and flanking angled lower-rear red thruster pods
 *  - Four symmetrical angled ventral landing/probe prongs with glowing crimson tips
 *    framing a recessed circular ventral maintenance hatch
 *  - Precision symmetrical TWIN FORWARD MISSILE WEAPON MOUNTS (+Z) with multi-tiered
 *    white ceramic-titanium barrels, exposed crimson-red radiator cooling slots, tactical
 *    sight rails, articulated 6-petal launch irises, and independent launch recoil
 *  - High-detail 3D ANIMATED MISSILES emitting directly from the exact front tips of BOTH
 *    weapon mounts and animating for 28.0 meters along +Z (6 staggered 3D missiles with
 *    ogive crimson seeker warheads, cruciform canards & swept delta tail fins, custom GLSL
 *    supersonic Mach-diamond rocket exhaust plumes, glowing contrail spark wakes, tip
 *    launch flashes, expanding launch shock rings, and 28.0m terminal plasma detonations)
 *  - Controlled via meshy_test_0/index.html Decals Tab & Global Decal APIs using two
 *    targetable Missile Strike decals (Decal_MissileStrike_Port_Weapon and
 *    Decal_MissileStrike_Starboard_Weapon) — supports master All Decals, Missile Strikes
 *    category toggle, individual Port/Starboard weapon toggles, and Opacity slider
 *    instantaneously even while paused
 *  - Exact physical bounding dimensions matching the reference GLB footprint:
 *    2.80m (W) x 2.80m (H) x 2.80m (L), circumference ~8.80m, facing +Z forward
 *
 * Compatible with meshy_test_0 Procedural JS Loader & Player, WebXR, and Three.js r160+.
 */
import * as THREE from 'three';

export const duration = 6.0; // Seamless 6.0s combat loop
export const preserveScale = true; // Preserve exact 1:1 physical meter footprint (2.80m x 2.80m x 2.80m)
export const weaponDecalNames = [
  'Decal_MissileStrike_Port_Weapon',
  'Decal_MissileStrike_Starboard_Weapon'
];
export const weaponDecalName = weaponDecalNames[0];

const TARGET_WIDTH = 2.80;
const TARGET_HEIGHT = 2.80;
const TARGET_LENGTH = 2.80;
const BASE_CENTER_Y = TARGET_HEIGHT * 0.5; // 1.40m so ventral prong tips rest cleanly at y = 0 at t = 0
const MISSILE_RANGE = 28.0; // Exact 28.0m animated missile travel distance from both mount tips along +Z
const MISSILES_PER_MOUNT = 3; // 3 staggered missiles per mount (6 total in flight across 28m corridor)
const FLIGHTS_PER_LOOP = 2; // Exact integer sub-cycles per 6.0s loop for 100% seamless looping

export const metadata = {
  id: 'recon_drone_2.8m',
  name: 'Void Recon Drone (2.8m)',
  stage: 1,
  stageSlug: 'warp_origin',
  classification: 'Armored Scout & Dual-Missile Recon Drone',
  sourceReference: 'wormhole0/mobile/warp_origin_images/recon_drone_2.8m.glb',
  weaponDecalNames: [...weaponDecalNames],
  weaponType: 'twin_missiles',
  weaponColor: '#ff1e2d',
  dimensions: {
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    depth: TARGET_LENGTH
  },
  circumference: Number((Math.PI * TARGET_WIDTH).toFixed(2)),
  missileDirection: { x: 0, y: 0, z: 1 },
  missileRange: MISSILE_RANGE,
  missilesPerMount: MISSILES_PER_MOUNT,
  weaponMountTips: {
    port: { x: -0.45, y: 1.32, z: 1.40 },
    starboard: { x: 0.45, y: 1.32, z: 1.40 }
  }
};

/**
 * Deterministic PRNG so procedural PBR textures and particles are 100% reproducible.
 */
function createSeededRandom(seed = 2802801) {
  let s = seed >>> 0;
  return function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Generates crisp 1024x1024 procedural PBR CanvasTextures (albedo, bump, roughness, emissive)
 * for the recon drone's aerospace pearl-white ceramic-titanium armored spherical hull,
 * with precision chamfered seams, maintenance louvers, corner micro-rivets, and subtle
 * recessed crimson-red energy conduit traces.
 */
function createReconArmorTextures() {
  if (typeof document === 'undefined') {
    return { albedo: null, bump: null, roughness: null, emissive: null, textures: [] };
  }

  const size = 1024;
  const rand = createSeededRandom(280917);

  const makeCanvas = () => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    return c;
  };

  const albedoCanvas = makeCanvas();
  const bumpCanvas = makeCanvas();
  const roughCanvas = makeCanvas();
  const emissiveCanvas = makeCanvas();

  const aCtx = albedoCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');
  const rCtx = roughCanvas.getContext('2d');
  const eCtx = emissiveCanvas.getContext('2d');

  // 1. Base bright aerospace pearl-white ceramic composite finish
  const baseGrad = aCtx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0.0, '#fcfdff');
  baseGrad.addColorStop(0.5, '#f2f5fa');
  baseGrad.addColorStop(1.0, '#e5ebf3');
  aCtx.fillStyle = baseGrad;
  aCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#929292';
  bCtx.fillRect(0, 0, size, size);

  // Satin white composite base roughness (~0.36)
  rCtx.fillStyle = '#5e5e5e';
  rCtx.fillRect(0, 0, size, size);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  // 2. Micro-brushed aerospace ceramic-alloy texture grain
  for (let i = 0; i < 1100; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 20 + rand() * 96;
    const alpha = 0.018 + rand() * 0.030;
    aCtx.strokeStyle = rand() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(128, 138, 156, ${alpha})`;
    aCtx.lineWidth = 1.1;
    aCtx.beginPath();
    aCtx.moveTo(x, y);
    aCtx.lineTo(x + len, y + (rand() - 0.5) * 1.4);
    aCtx.stroke();

    rCtx.strokeStyle = rand() > 0.5 ? `rgba(128, 128, 128, ${alpha * 2.0})` : `rgba(52, 52, 52, ${alpha * 2.0})`;
    rCtx.beginPath();
    rCtx.moveTo(x, y);
    rCtx.lineTo(x + len, y);
    rCtx.stroke();
  }

  // 3. Precision Chamfered Spherical Armor Plates (cleanly tiled across latitude/longitude UVs)
  const drawArmorTile = (x, y, w, h, bevel = 18, toneShift = 0, redTrim = false) => {
    const traceChamfer = (ctx, pad) => {
      const px = x + pad;
      const py = y + pad;
      const pw = w - pad * 2;
      const ph = h - pad * 2;
      const bv = Math.max(4, bevel - pad * 0.45);
      ctx.beginPath();
      ctx.moveTo(px + bv, py);
      ctx.lineTo(px + pw - bv, py);
      ctx.lineTo(px + pw, py + bv);
      ctx.lineTo(px + pw, py + ph - bv);
      ctx.lineTo(px + pw - bv, py + ph);
      ctx.lineTo(px + bv, py + ph);
      ctx.lineTo(px, py + ph - bv);
      ctx.lineTo(px, py + bv);
      ctx.closePath();
    };

    // Dark mechanical recessed seam groove
    traceChamfer(aCtx, 1.5);
    aCtx.fillStyle = '#6f798a';
    aCtx.fill();

    // Raised bright white ceramic plate
    traceChamfer(aCtx, 4.5);
    const v = Math.max(226, Math.min(252, 242 + toneShift));
    const grad = aCtx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0.0, `rgb(${Math.min(255, v + 5)}, ${Math.min(255, v + 6)}, ${Math.min(255, v + 8)})`);
    grad.addColorStop(0.55, `rgb(${v}, ${Math.min(255, v + 2)}, ${Math.min(255, v + 4)})`);
    grad.addColorStop(1.0, `rgb(${v - 7}, ${v - 5}, ${v - 2})`);
    aCtx.fillStyle = grad;
    aCtx.fill();

    // Specular beveled edge catchlight
    aCtx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    aCtx.lineWidth = 2.0;
    aCtx.stroke();

    // Subtle stepped interior mechanical access border
    traceChamfer(aCtx, 16);
    aCtx.strokeStyle = 'rgba(130, 142, 162, 0.35)';
    aCtx.lineWidth = 1.4;
    aCtx.stroke();

    // Optional subtle crimson-red tactical telemetry bar
    if (redTrim) {
      aCtx.fillStyle = '#c81628';
      aCtx.fillRect(x + 26, y + h - 28, Math.min(82, w * 0.28), 7);
      eCtx.fillStyle = 'rgba(255, 32, 48, 0.85)';
      eCtx.fillRect(x + 26, y + h - 28, Math.min(82, w * 0.28), 7);
    }

    // Bump height relief
    traceChamfer(bCtx, 1.5);
    bCtx.fillStyle = '#202020';
    bCtx.fill();
    traceChamfer(bCtx, 5.5);
    bCtx.fillStyle = '#d8d8d8';
    bCtx.fill();
    bCtx.strokeStyle = '#ffffff';
    bCtx.lineWidth = 2.2;
    bCtx.stroke();

    // Roughness contrast
    traceChamfer(rCtx, 5.5);
    rCtx.fillStyle = toneShift < 0 ? '#6a6a6a' : '#525252';
    rCtx.fill();
    rCtx.strokeStyle = '#2c2c2c';
    rCtx.lineWidth = 2.6;
    rCtx.stroke();

    // Corner recessed titanium fasteners
    const inset = 18;
    const rivets = [
      [x + inset, y + inset],
      [x + w - inset, y + inset],
      [x + inset, y + h - inset],
      [x + w - inset, y + h - inset]
    ];
    for (const [rx, ry] of rivets) {
      aCtx.fillStyle = '#7b8698';
      aCtx.beginPath();
      aCtx.arc(rx, ry, 2.8, 0, Math.PI * 2);
      aCtx.fill();
      bCtx.fillStyle = '#323232';
      bCtx.beginPath();
      bCtx.arc(rx, ry, 3.0, 0, Math.PI * 2);
      bCtx.fill();
    }
  };

  // Symmetrical multi-band hull armor layout (aligns cleanly with spherical latitude bands)
  const tiles = [
    [0, 0, 256, 256, 18, 4, false],
    [256, 0, 256, 256, 18, -4, false],
    [512, 0, 256, 256, 18, 6, false],
    [768, 0, 256, 256, 18, -5, false],

    [0, 256, 340, 240, 20, -6, true],
    [340, 256, 344, 240, 20, 8, false],
    [684, 256, 340, 240, 20, -4, true],

    [0, 496, 512, 260, 22, 5, false],
    [512, 496, 512, 260, 22, -6, false],

    [0, 756, 256, 268, 18, -3, true],
    [256, 756, 512, 268, 22, 6, false],
    [768, 756, 256, 268, 18, -7, true]
  ];
  for (const t of tiles) {
    drawArmorTile(...t);
  }

  // 4. Equatorial mechanical separation channel & subtle crimson micro-conduit lines
  aCtx.fillStyle = '#485263';
  aCtx.fillRect(0, 492, size, 8);
  bCtx.fillStyle = '#181818';
  bCtx.fillRect(0, 492, size, 8);

  eCtx.strokeStyle = 'rgba(255, 28, 44, 0.55)';
  eCtx.lineWidth = 2.0;
  eCtx.beginPath();
  eCtx.moveTo(64, 496);
  eCtx.lineTo(220, 496);
  eCtx.moveTo(410, 496);
  eCtx.lineTo(614, 496);
  eCtx.moveTo(804, 496);
  eCtx.lineTo(960, 496);
  eCtx.stroke();

  // Subtle recessed heat-vent louver grilles
  const drawLouver = (vx, vy, vw, vh, slits = 5) => {
    aCtx.fillStyle = '#2d3340';
    aCtx.fillRect(vx, vy, vw, vh);
    bCtx.fillStyle = '#161616';
    bCtx.fillRect(vx, vy, vw, vh);
    const step = vh / (slits * 2 + 1);
    for (let i = 0; i < slits; i++) {
      const sy = vy + step * (i * 2 + 1);
      aCtx.fillStyle = '#737f92';
      aCtx.fillRect(vx + 3, sy, vw - 6, step * 0.85);
      bCtx.fillStyle = '#b8b8b8';
      bCtx.fillRect(vx + 3, sy, vw - 6, step * 0.85);
    }
  };
  drawLouver(46, 540, 88, 46, 4);
  drawLouver(890, 540, 88, 46, 4);
  drawLouver(468, 300, 88, 42, 4);

  const configureTex = (canvas, name, isSRGB = false) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.name = name;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    if (isSRGB) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  const albedo = configureTex(albedoCanvas, 'recon_drone_armor_albedo.png', true);
  const bump = configureTex(bumpCanvas, 'recon_drone_armor_bump.png', false);
  const roughness = configureTex(roughCanvas, 'recon_drone_armor_roughness.png', false);
  const emissive = configureTex(emissiveCanvas, 'recon_drone_armor_emissive.png', true);

  return {
    albedo,
    bump,
    roughness,
    emissive,
    textures: [albedo, bump, roughness, emissive]
  };
}

/**
 * Generates a high-intensity crimson-orange star-bloom flare CanvasTexture
 * for missile launch muzzle flashes and 28m terminal detonation flashes.
 */
function createMissileFlareTexture(name = 'recon_missile_launch_flare.png') {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size * 0.5;

  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.16, 'rgba(255, 232, 198, 0.96)');
  grad.addColorStop(0.36, 'rgba(255, 72, 42, 0.78)');
  grad.addColorStop(0.66, 'rgba(215, 16, 28, 0.28)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cx);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    const rayLen = (i % 2 === 0) ? cx : cx * 0.74;
    const halfW = (i % 2 === 0) ? 7.0 : 4.2;
    const rayGrad = ctx.createLinearGradient(0, 0, rayLen, 0);
    rayGrad.addColorStop(0.0, 'rgba(255, 252, 240, 0.96)');
    rayGrad.addColorStop(0.38, 'rgba(255, 86, 42, 0.58)');
    rayGrad.addColorStop(1.0, 'rgba(255, 20, 32, 0.0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(0, -halfW);
    ctx.lineTo(rayLen, 0);
    ctx.lineTo(0, halfW);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.name = name;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft circular glowing radial orb CanvasTexture for particles & trails.
 */
function createGlowingOrbTexture(name, innerRgba, midRgba) {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size * 0.5;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.28, innerRgba);
  grad.addColorStop(0.68, midRgba);
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.name = name;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Normalizes ExtrudeGeometry UVs cleanly onto [0, 1] so armor textures map crisply.
 */
function normalizeExtrudeUVs(geo, axisU = 'x', axisV = 'y', tileU = 1.0, tileV = 1.0) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const minMap = { x: bb.min.x, y: bb.min.y, z: bb.min.z };
  const spanMap = {
    x: Math.max(0.001, bb.max.x - bb.min.x),
    y: Math.max(0.001, bb.max.y - bb.min.y),
    z: Math.max(0.001, bb.max.z - bb.min.z)
  };
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  if (!pos || !uv) return geo;

  const getCoord = (i, ax) => (ax === 'x' ? pos.getX(i) : ax === 'y' ? pos.getY(i) : pos.getZ(i));
  for (let i = 0; i < pos.count; i++) {
    const u = ((getCoord(i, axisU) - minMap[axisU]) / spanMap[axisU]) * tileU;
    const v = ((getCoord(i, axisV) - minMap[axisV]) / spanMap[axisV]) * tileV;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Creates a chamfered octagonal armor block using ExtrudeGeometry.
 */
function createChamferedBlock(T, width, height, depth, chamfer = 0.03, bevel = 0.012) {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const c = Math.min(chamfer, hw * 0.45, hh * 0.45);
  const shape = new T.Shape();
  shape.moveTo(-hw + c, -hh);
  shape.lineTo(hw - c, -hh);
  shape.lineTo(hw, -hh + c);
  shape.lineTo(hw, hh - c);
  shape.lineTo(hw - c, hh);
  shape.lineTo(-hw + c, hh);
  shape.lineTo(-hw, hh - c);
  shape.lineTo(-hw, -hh + c);
  shape.closePath();

  const geo = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 2,
    curveSegments: 4
  });
  geo.center();
  return normalizeExtrudeUVs(geo, 'x', 'y', 1.0, 1.0);
}

/**
 * Builds the Void Recon Drone (2.8m) procedural 3D XR model and 28m dual-missile controller.
 */
export function createReconDrone(api = {}) {
  const T = (api && api.THREE) ? api.THREE : THREE;
  const rand = createSeededRandom(280001);

  const trackedTextures = [];
  const armorTex = createReconArmorTextures();
  trackedTextures.push(...armorTex.textures);

  const launchFlareTex = createMissileFlareTexture('recon_missile_launch_flare.png');
  if (launchFlareTex) trackedTextures.push(launchFlareTex);

  const sparkOrbTex = createGlowingOrbTexture(
    'recon_missile_spark_orb.png',
    'rgba(255, 168, 92, 0.94)',
    'rgba(255, 36, 36, 0.36)'
  );
  if (sparkOrbTex) trackedTextures.push(sparkOrbTex);

  const ambientRedOrbTex = createGlowingOrbTexture(
    'recon_ambient_crimson_orb.png',
    'rgba(255, 84, 96, 0.88)',
    'rgba(210, 12, 32, 0.30)'
  );
  if (ambientRedOrbTex) trackedTextures.push(ambientRedOrbTex);

  // ===========================================================================
  // PBR & CUSTOM GLSL MATERIALS
  // ===========================================================================
  const whiteArmorMat = new T.MeshStandardMaterial({
    name: 'ReconArmor_PearlCeramicWhite',
    color: 0xffffff,
    map: armorTex.albedo,
    bumpMap: armorTex.bump,
    bumpScale: 0.016,
    roughnessMap: armorTex.roughness,
    emissive: 0xff1c30,
    emissiveMap: armorTex.emissive,
    emissiveIntensity: 0.42,
    metalness: 0.14,
    roughness: 0.36
  });

  const secondaryArmorMat = new T.MeshStandardMaterial({
    name: 'ReconArmor_SatinTitaniumSilver',
    color: 0xe8eef6,
    map: armorTex.albedo,
    bumpMap: armorTex.bump,
    bumpScale: 0.014,
    roughnessMap: armorTex.roughness,
    metalness: 0.28,
    roughness: 0.32
  });

  const darkChassisMat = new T.MeshStandardMaterial({
    name: 'ReconChassis_CarbonGunmetal',
    color: 0x262c38,
    bumpMap: armorTex.bump,
    bumpScale: 0.012,
    metalness: 0.72,
    roughness: 0.42
  });

  const deepCavityMat = new T.MeshStandardMaterial({
    name: 'ReconCore_ObsidianBore',
    color: 0x11141c,
    metalness: 0.65,
    roughness: 0.50
  });

  const machinedAlloyMat = new T.MeshStandardMaterial({
    name: 'ReconTrim_BrushedAlloy',
    color: 0x9aa6b8,
    metalness: 0.84,
    roughness: 0.24
  });

  const redNeonGlowMat = new T.MeshStandardMaterial({
    name: 'ReconOptics_CrimsonNeonCore',
    color: 0xcc0414,
    emissive: 0xff0014,
    emissiveIntensity: 1.38,
    metalness: 0.18,
    roughness: 0.12
  });

  const redArmorAccentMat = new T.MeshStandardMaterial({
    name: 'ReconTrim_AnodizedCrimson',
    color: 0xa80a1a,
    emissive: 0x4a0208,
    emissiveIntensity: 0.35,
    metalness: 0.48,
    roughness: 0.26
  });

  // Custom GLSL pulsing crimson reactor / optical lens shader (top crown, side bullseye dish, rear main thruster)
  const coreOpticUniforms = {
    uTime: { value: 0.0 },
    uWeaponLoad: { value: 0.0 }
  };
  const crimsonOpticShaderMat = new T.ShaderMaterial({
    name: 'ReconCore_CrimsonOpticShader',
    uniforms: coreOpticUniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform float uTime;
      uniform float uWeaponLoad;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float ang = atan(p.y, p.x);
        float ndotv = clamp(abs(dot(normalize(vNormal), normalize(vViewDir))), 0.0, 1.0);

        float rings = sin(r * 20.0 - uTime * 7.5) * 0.5 + 0.5;
        float sweep = pow(0.5 + 0.5 * cos(ang * 3.0 - uTime * 3.14159), 2.0);
        float pulse = 0.80 + 0.20 * sin(uTime * 5.23599);

        vec3 deepRuby = vec3(0.42, 0.01, 0.04);
        vec3 vividRed = vec3(1.0, 0.09, 0.14);
        vec3 hotCore = vec3(1.0, 0.72, 0.58);

        vec3 col = mix(deepRuby, vividRed, 0.45 + 0.55 * rings);
        col += vividRed * sweep * 0.35 * (1.0 - smoothstep(0.65, 1.0, r));
        col += hotCore * pow(1.0 - clamp(r, 0.0, 1.0), 2.8) * (0.55 + 0.35 * ndotv);
        col *= pulse * (1.0 + uWeaponLoad * 0.28);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  // Factory for per-mount custom GLSL supersonic rocket exhaust plume shader
  function createRocketPlumeShaderMat(label) {
    const uniforms = {
      uTime: { value: 0.0 },
      uIntensity: { value: 1.0 }
    };
    const mat = new T.ShaderMaterial({
      name: `MissileExhaust_RocketFlameShader_${label}`,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform float uTime;
        void main() {
          vUv = uv;
          float flutter = sin(uv.y * 36.0 - uTime * 56.0 + uv.x * 12.56637) * 0.012 * (1.0 - uv.y);
          vec3 displaced = position + normal * flutter;
          vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform float uTime;
        uniform float uIntensity;
        void main() {
          float ndotv = abs(dot(normalize(vNormal), normalize(vViewDir)));
          float coreMask = pow(ndotv, 1.55);
          // uv.y = 1 near rocket nozzle base, 0 at flame tail tip
          float nozzleHot = smoothstep(0.15, 0.96, vUv.y);
          float tailFade = smoothstep(0.0, 0.30, vUv.y);
          float machDiamonds = pow(0.5 + 0.5 * sin(vUv.y * 32.0 + uTime * 48.0), 2.2);
          float turbulence = 0.78 + 0.22 * sin(vUv.x * 18.84955 + vUv.y * 44.0 + uTime * 62.0);

          vec3 crimsonOuter = vec3(0.95, 0.05, 0.10);
          vec3 amberFlame = vec3(1.0, 0.42, 0.08);
          vec3 whiteHot = vec3(1.0, 0.96, 0.88);

          vec3 col = mix(crimsonOuter, amberFlame, nozzleHot * 0.72 + machDiamonds * 0.28);
          col += whiteHot * coreMask * (0.45 * nozzleHot + 0.40 * machDiamonds);
          col *= turbulence;

          float alpha = clamp((coreMask * 0.85 + 0.25 * machDiamonds) * tailFade * uIntensity, 0.0, 0.98);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
    return { mat, uniforms };
  }

  // Factory for per-mount soft Fresnel-falloff volumetric rocket plasma contrail wake shader (no hard cone edges!)
  function createContrailShaderMat(label, plumeUniforms) {
    return new T.ShaderMaterial({
      name: `MissileExhaust_VolumetricContrail_${label}`,
      uniforms: plumeUniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform float uTime;
        uniform float uIntensity;
        void main() {
          float ndotv = abs(dot(normalize(vNormal), normalize(vViewDir)));
          float softEdge = pow(ndotv, 2.35);
          // Fade smoothly from nozzle (vUv.y = 1) down to wispy dissipation at tail (vUv.y = 0)
          float lengthFade = smoothstep(0.0, 0.72, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
          float wisp = 0.76 + 0.24 * sin(vUv.y * 28.0 + uTime * 34.0 + vUv.x * 12.56637);
          vec3 col = mix(vec3(0.75, 0.05, 0.09), vec3(1.0, 0.38, 0.14), smoothstep(0.2, 0.95, vUv.y));
          float alpha = softEdge * lengthFade * wisp * 0.42 * uIntensity;
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
  }

  // Shared 3D Missile Chassis PBR Materials (crisp dark gunmetal, ceramic white collar, crimson warhead & seeker)
  const missileBodyMat = new T.MeshStandardMaterial({
    name: 'ReconMissile_TitaniumFuselage',
    color: 0x353c4a,
    metalness: 0.76,
    roughness: 0.30
  });
  const missileCollarWhiteMat = new T.MeshStandardMaterial({
    name: 'ReconMissile_CeramicCollar',
    color: 0xf4f7fb,
    metalness: 0.20,
    roughness: 0.32
  });
  const missileWarheadRedMat = new T.MeshStandardMaterial({
    name: 'ReconMissile_CrimsonWarhead',
    color: 0xd9182a,
    emissive: 0x62060e,
    emissiveIntensity: 0.45,
    metalness: 0.42,
    roughness: 0.24
  });
  const missileHazardGoldMat = new T.MeshStandardMaterial({
    name: 'ReconMissile_HazardBand',
    color: 0xf5b324,
    emissive: 0x5c3a04,
    emissiveIntensity: 0.35,
    metalness: 0.55,
    roughness: 0.28
  });
  const missileFinMat = new T.MeshStandardMaterial({
    name: 'ReconMissile_StabilizerFin',
    color: 0x687387,
    metalness: 0.78,
    roughness: 0.28
  });
  const missileSeekerGlowMat = new T.MeshStandardMaterial({
    name: 'ReconMissile_CrimsonSeekerTip',
    color: 0xff9292,
    emissive: 0xff1628,
    emissiveIntensity: 2.8,
    metalness: 0.12,
    roughness: 0.12
  });

  // ===========================================================================
  // ROOT HIERARCHY
  // ===========================================================================
  const rootGroup = new T.Group();
  rootGroup.name = 'ReconDrone28m_Root';

  const bodyGroup = new T.Group();
  bodyGroup.name = 'ReconDrone28m_Body';
  bodyGroup.position.set(0, BASE_CENTER_Y, 0);
  rootGroup.add(bodyGroup);

  // All structural hull & twin weapon mount geometry is authored in native ~2.80m cube proportions
  // (X: ±1.40, Y: ±1.40, Z: ±1.40) and analytically calibrated to exact 2.80m x 2.80m x 2.80m.
  const hullEnvelopeGroup = new T.Group();
  hullEnvelopeGroup.name = 'ReconDroneAirframe_Envelope';
  bodyGroup.add(hullEnvelopeGroup);

  // Sphere hull center sits slightly aft (Z = -0.26) so the twin forward weapon mounts
  // protrude cleanly forward to Z = +1.40 while the rear thruster bell reaches Z = -1.40!
  const SPHERE_CENTER_Y = 0.04;
  const SPHERE_CENTER_Z = -0.26;
  const SPHERE_RX = 1.14;
  const SPHERE_RY = 1.16;
  const SPHERE_RZ = 1.08;

  // ===========================================================================
  // 1. MAIN ARMORED SPHERICAL-OVOID SCOUT CHASSIS
  // ===========================================================================
  const mainHullGroup = new T.Group();
  mainHullGroup.name = 'MainSphericalHull_Group';
  mainHullGroup.position.set(0, SPHERE_CENTER_Y, SPHERE_CENTER_Z);
  hullEnvelopeGroup.add(mainHullGroup);

  // Primary smooth-yet-paneled ceramic-titanium ovoid sphere
  const hullSphereGeo = new T.SphereGeometry(1.0, 56, 40);
  hullSphereGeo.scale(SPHERE_RX, SPHERE_RY, SPHERE_RZ);
  const hullSphereMesh = new T.Mesh(hullSphereGeo, whiteArmorMat);
  hullSphereMesh.name = 'MainSphericalHull_ArmorShell';
  mainHullGroup.add(hullSphereMesh);

  // Equatorial recessed mechanical belt ring & raised collar lip
  const eqChannelGeo = new T.TorusGeometry(1.135, 0.028, 12, 64);
  eqChannelGeo.rotateX(Math.PI * 0.5);
  eqChannelGeo.scale(1.0, 1.0, SPHERE_RZ / SPHERE_RX);
  const eqChannelMesh = new T.Mesh(eqChannelGeo, darkChassisMat);
  eqChannelMesh.name = 'HullEquator_MechanicalSeam';
  eqChannelMesh.position.y = -0.02;
  mainHullGroup.add(eqChannelMesh);

  const eqUpperRimGeo = new T.TorusGeometry(1.142, 0.014, 10, 64);
  eqUpperRimGeo.rotateX(Math.PI * 0.5);
  eqUpperRimGeo.scale(1.0, 1.0, SPHERE_RZ / SPHERE_RX);
  const eqUpperRim = new T.Mesh(eqUpperRimGeo, secondaryArmorMat);
  eqUpperRim.position.y = 0.015;
  mainHullGroup.add(eqUpperRim);

  // Sculpted Front Forehead Tactical Crest Plate (matching the stepped upper-front visor armor & twin red dots!)
  const foreheadCrestGroup = new T.Group();
  foreheadCrestGroup.name = 'ForeheadArmor_CrestAssembly';
  foreheadCrestGroup.position.set(0, 0.82, 0.72);
  foreheadCrestGroup.rotation.x = -0.68;
  mainHullGroup.add(foreheadCrestGroup);

  const foreheadPlate = new T.Mesh(createChamferedBlock(T, 0.62, 0.34, 0.08, 0.06, 0.014), secondaryArmorMat);
  foreheadCrestGroup.add(foreheadPlate);

  const foreheadInset = new T.Mesh(createChamferedBlock(T, 0.34, 0.16, 0.03, 0.03, 0.008), whiteArmorMat);
  foreheadInset.position.set(0, -0.02, 0.042);
  foreheadCrestGroup.add(foreheadInset);

  // Dual signature red micro-telemetry optical dots flanking the forehead crest
  [-1, 1].forEach((side) => {
    const pipBezel = new T.Mesh(new T.CylinderGeometry(0.030, 0.034, 0.025, 14), darkChassisMat);
    pipBezel.rotation.x = Math.PI * 0.5;
    pipBezel.position.set(side * 0.22, -0.10, 0.042);
    foreheadCrestGroup.add(pipBezel);

    const pipLed = new T.Mesh(new T.SphereGeometry(0.021, 12, 10), redNeonGlowMat);
    pipLed.position.set(side * 0.22, -0.10, 0.052);
    foreheadCrestGroup.add(pipLed);
  });

  // Rear Upper Armored Data-Core Plate (matching the broad rear dorsal bevel plate in 02_back_negZ!)
  const rearDorsalPlate = new T.Mesh(createChamferedBlock(T, 0.78, 0.46, 0.09, 0.08, 0.016), secondaryArmorMat);
  rearDorsalPlate.name = 'RearDorsal_ArmorShieldPlate';
  rearDorsalPlate.position.set(0, 0.44, -0.97);
  rearDorsalPlate.rotation.x = 0.38;
  mainHullGroup.add(rearDorsalPlate);

  // ===========================================================================
  // 2. TOP ZENITH CROWN TURRET & 6-PETAL CRIMSON REACTOR IRIS (+Y -> +1.40m)
  // ===========================================================================
  const topCrownGroup = new T.Group();
  topCrownGroup.name = 'ZenithCrown_TurretAssembly';
  topCrownGroup.position.set(0, SPHERE_RY - 0.01, 0);
  mainHullGroup.add(topCrownGroup);

  // Outer ribbed white ceramic crown turret collar (reaches top Y = SPHERE_CENTER_Y + SPHERE_RY + 0.20 = 1.40m!)
  const crownProfile = [
    new T.Vector2(0.46, -0.06),
    new T.Vector2(0.48,  0.04),
    new T.Vector2(0.44,  0.14),
    new T.Vector2(0.42,  0.20),
    new T.Vector2(0.36,  0.20),
    new T.Vector2(0.34,  0.13),
    new T.Vector2(0.32,  0.04)
  ];
  const crownCollarGeo = new T.LatheGeometry(crownProfile, 36);
  const crownCollarMesh = new T.Mesh(crownCollarGeo, whiteArmorMat);
  crownCollarMesh.name = 'ZenithCrown_OuterRing';
  topCrownGroup.add(crownCollarMesh);

  // 16 precision perimeter crown armor gear teeth / radiator lugs
  const crownToothGeo = new T.BoxGeometry(0.036, 0.075, 0.048);
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const tooth = new T.Mesh(crownToothGeo, i % 2 === 0 ? secondaryArmorMat : darkChassisMat);
    tooth.position.set(Math.cos(ang) * 0.435, 0.145, Math.sin(ang) * 0.435);
    tooth.rotation.y = -ang;
    topCrownGroup.add(tooth);
  }

  // Deep crimson glowing circular zenith plasma core dome
  const crownCoreGeo = new T.CircleGeometry(0.35, 36);
  crownCoreGeo.rotateX(-Math.PI * 0.5);
  const crownCoreMesh = new T.Mesh(crownCoreGeo, crimsonOpticShaderMat);
  crownCoreMesh.name = 'ZenithCrown_CrimsonPlasmaCore';
  crownCoreMesh.position.y = 0.142;
  topCrownGroup.add(crownCoreMesh);

  const crownInnerRing = new T.Mesh(new T.TorusGeometry(0.34, 0.018, 10, 36), redNeonGlowMat);
  crownInnerRing.rotation.x = Math.PI * 0.5;
  crownInnerRing.position.y = 0.155;
  topCrownGroup.add(crownInnerRing);

  // Signature Rotating 6-Petal White Mechanical Iris Emblem at the center of the red zenith dome!
  const zenithIrisGroup = new T.Group();
  zenithIrisGroup.name = 'ZenithCrown_SixPetalIris';
  zenithIrisGroup.position.y = 0.156;
  topCrownGroup.add(zenithIrisGroup);

  const irisHub = new T.Mesh(new T.CylinderGeometry(0.028, 0.034, 0.022, 16), whiteArmorMat);
  zenithIrisGroup.add(irisHub);

  const irisPetalGeo = new T.SphereGeometry(0.036, 12, 10);
  irisPetalGeo.scale(0.68, 0.35, 1.48);
  for (let p = 0; p < 6; p++) {
    const pa = (p / 6) * Math.PI * 2;
    const petalPivot = new T.Group();
    petalPivot.rotation.y = pa;
    const lobe = new T.Mesh(irisPetalGeo, whiteArmorMat);
    lobe.position.set(0, 0.004, 0.072);
    petalPivot.add(lobe);
    zenithIrisGroup.add(petalPivot);
  }

  // ===========================================================================
  // 3. FOUR UPPER-QUADRANT RECESSED RED SENSOR OPTICS & LOWER FLANK PORTS
  // ===========================================================================
  const sensorOpticRings = [];

  const mountRecessedOpticPod = (parent, name, dirVec, scale = 1.0, hasSpinRing = true) => {
    const dir = dirVec.clone().normalize();
    const surfPos = new T.Vector3(
      dir.x * SPHERE_RX * 0.965,
      dir.y * SPHERE_RY * 0.965,
      dir.z * SPHERE_RZ * 0.965
    );

    const pod = new T.Group();
    pod.name = name;
    pod.position.copy(surfPos);
    // Align pod local +Z outward along sphere surface normal
    const normal = new T.Vector3(
      dir.x / SPHERE_RX,
      dir.y / SPHERE_RY,
      dir.z / SPHERE_RZ
    ).normalize();
    pod.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), normal);
    pod.scale.setScalar(scale);

    // Beveled octagonal white ceramic housing collar
    const shroud = new T.Mesh(new T.CylinderGeometry(0.145, 0.195, 0.13, 8), whiteArmorMat);
    shroud.rotation.x = Math.PI * 0.5;
    shroud.position.z = 0.03;
    pod.add(shroud);

    // Recessed dark mechanical socket
    const socket = new T.Mesh(new T.CylinderGeometry(0.118, 0.118, 0.08, 18), deepCavityMat);
    socket.rotation.x = Math.PI * 0.5;
    socket.position.z = 0.04;
    pod.add(socket);

    // Glowing crimson optical dome
    const lens = new T.Mesh(new T.SphereGeometry(0.098, 18, 14), redNeonGlowMat);
    lens.scale.set(1.0, 1.0, 0.65);
    lens.position.z = 0.068;
    pod.add(lens);

    if (hasSpinRing) {
      const scanRing = new T.Mesh(new T.TorusGeometry(0.112, 0.012, 8, 20, Math.PI * 1.35), machinedAlloyMat);
      scanRing.position.z = 0.095;
      pod.add(scanRing);
      sensorOpticRings.push({ ring: scanRing, speed: (sensorOpticRings.length % 2 === 0 ? 1 : -1) * 1.0 });
    }

    parent.add(pod);
    return pod;
  };

  // 4 Upper Diagonal Quadrant Red Optical Sensor Pods (exact match to 01_front, 02_back, 05_top)
  mountRecessedOpticPod(mainHullGroup, 'UpperOpticPod_FrontPort', new T.Vector3(-0.56, 0.78, 0.54), 1.05, true);
  mountRecessedOpticPod(mainHullGroup, 'UpperOpticPod_FrontStarboard', new T.Vector3(0.56, 0.78, 0.54), 1.05, true);
  mountRecessedOpticPod(mainHullGroup, 'UpperOpticPod_RearPort', new T.Vector3(-0.52, 0.62, -0.78), 1.00, true);
  mountRecessedOpticPod(mainHullGroup, 'UpperOpticPod_RearStarboard', new T.Vector3(0.52, 0.62, -0.78), 1.00, true);

  // 2 Lower-Forward Cheek Crimson Emitter/Sensor Housings (seen on lower sides in 01_front, 03_right, 04_left)
  mountRecessedOpticPod(mainHullGroup, 'LowerCheekSensor_Port', new T.Vector3(-0.92, -0.36, 0.42), 1.08, false);
  mountRecessedOpticPod(mainHullGroup, 'LowerCheekSensor_Starboard', new T.Vector3(0.92, -0.36, 0.42), 1.08, false);

  // 2 Lower-Rear Beveled Maneuvering Thruster Pods (seen flanking rear thruster in 02_back!)
  mountRecessedOpticPod(mainHullGroup, 'LowerRearThruster_Port', new T.Vector3(-0.78, -0.34, -0.64), 1.24, false);
  mountRecessedOpticPod(mainHullGroup, 'LowerRearThruster_Starboard', new T.Vector3(0.78, -0.34, -0.64), 1.24, false);

  // ===========================================================================
  // 4. LATERAL FLANK ASSEMBLIES (±X -> ±1.40m)
  //    Port (-X): Signature Large Concentric Crimson Bullseye Optical Dish +
  //               Lower Ribbed Rotating Crimson-Slotted Auxiliary Drum
  //    Starboard (+X): Sleek Armored Lateral Telemetry Pod & Recessed Red Slit
  // ===========================================================================
  // 4A. Port (-X) Upper-Mid Iconic Concentric Bullseye Optical Scanner Dish (reaches X = -1.40m)
  const portDishGroup = new T.Group();
  portDishGroup.name = 'PortFlank_ConcentricScannerDish';
  portDishGroup.position.set(-SPHERE_RX + 0.04, 0.24, -0.10);
  portDishGroup.rotation.y = -Math.PI * 0.5;
  mainHullGroup.add(portDishGroup);

  const dishCollarProfile = [
    new T.Vector2(0.46, -0.08),
    new T.Vector2(0.49,  0.04),
    new T.Vector2(0.44,  0.22),
    new T.Vector2(0.41,  0.27),
    new T.Vector2(0.36,  0.27),
    new T.Vector2(0.34,  0.19),
    new T.Vector2(0.30,  0.12)
  ];
  const dishCollarGeo = new T.LatheGeometry(dishCollarProfile, 36);
  dishCollarGeo.rotateX(Math.PI * 0.5);
  portDishGroup.add(new T.Mesh(dishCollarGeo, whiteArmorMat));

  // Outer crimson target ring + white mid ring + glowing crimson center bullseye dome
  const dishOuterRing = new T.Mesh(new T.RingGeometry(0.25, 0.355, 36), crimsonOpticShaderMat);
  dishOuterRing.position.z = 0.225;
  portDishGroup.add(dishOuterRing);

  const dishWhiteRing = new T.Mesh(new T.TorusGeometry(0.242, 0.026, 12, 36), whiteArmorMat);
  dishWhiteRing.position.z = 0.242;
  portDishGroup.add(dishWhiteRing);

  const dishCenterDome = new T.Mesh(new T.SphereGeometry(0.205, 24, 18), crimsonOpticShaderMat);
  dishCenterDome.scale.set(1.0, 1.0, 0.42);
  dishCenterDome.position.z = 0.215;
  portDishGroup.add(dishCenterDome);

  const dishGimbalArc = new T.Mesh(new T.TorusGeometry(0.385, 0.015, 8, 28, Math.PI * 0.85), machinedAlloyMat);
  dishGimbalArc.position.z = 0.265;
  portDishGroup.add(dishGimbalArc);

  // 4B. Port (-X) Lower Ribbed Rotating Crimson-Slotted Auxiliary Stabilizer Drum (seen in 01_front, 04_left, 06_bottom!)
  const portDrumGroup = new T.Group();
  portDrumGroup.name = 'PortFlank_RibbedStabilizerDrum';
  portDrumGroup.position.set(-SPHERE_RX + 0.08, -0.56, -0.18);
  portDrumGroup.rotation.y = -Math.PI * 0.5;
  portDrumGroup.rotation.x = 0.22;
  mainHullGroup.add(portDrumGroup);

  const drumBaseFlange = new T.Mesh(new T.CylinderGeometry(0.24, 0.28, 0.14, 24), whiteArmorMat);
  drumBaseFlange.rotation.x = Math.PI * 0.5;
  portDrumGroup.add(drumBaseFlange);

  const portDrumRotor = new T.Group();
  portDrumRotor.name = 'PortFlank_DrumRotor';
  portDrumRotor.position.z = 0.15;
  portDrumGroup.add(portDrumRotor);

  const drumCoreCyl = new T.Mesh(new T.CylinderGeometry(0.185, 0.185, 0.24, 24), redNeonGlowMat);
  drumCoreCyl.rotation.x = Math.PI * 0.5;
  portDrumRotor.add(drumCoreCyl);

  // Stacked white ceramic cooling rings alternating with glowing crimson gaps
  for (let r = 0; r < 4; r++) {
    const ring = new T.Mesh(new T.TorusGeometry(0.208, 0.022, 10, 28), r % 2 === 0 ? whiteArmorMat : secondaryArmorMat);
    ring.position.z = -0.09 + r * 0.064;
    portDrumRotor.add(ring);
  }
  const drumCap = new T.Mesh(new T.TorusGeometry(0.19, 0.032, 12, 28), whiteArmorMat);
  drumCap.position.z = 0.135;
  portDrumRotor.add(drumCap);

  const drumCapLens = new T.Mesh(new T.CircleGeometry(0.155, 24), crimsonOpticShaderMat);
  drumCapLens.position.z = 0.142;
  portDrumRotor.add(drumCapLens);

  // 4C. Starboard (+X) Sleek Tactical Flank Sensor Housing & Recessed Crimson Visor Slit (reaches X = +1.40m for clean 2.80m balance!)
  const stbdFlankGroup = new T.Group();
  stbdFlankGroup.name = 'StarboardFlank_SensorHousing';
  stbdFlankGroup.position.set(SPHERE_RX - 0.02, 0.02, -0.04);
  stbdFlankGroup.rotation.y = Math.PI * 0.5;
  mainHullGroup.add(stbdFlankGroup);

  const stbdPodHousing = new T.Mesh(createChamferedBlock(T, 0.44, 0.30, 0.24, 0.06, 0.018), whiteArmorMat);
  stbdPodHousing.position.z = 0.12;
  stbdFlankGroup.add(stbdPodHousing);

  const stbdSlitBezel = new T.Mesh(new T.BoxGeometry(0.26, 0.095, 0.06), darkChassisMat);
  stbdSlitBezel.position.set(0, 0.02, 0.242);
  stbdFlankGroup.add(stbdSlitBezel);

  const stbdSlitGlow = new T.Mesh(new T.BoxGeometry(0.20, 0.048, 0.03), redNeonGlowMat);
  stbdSlitGlow.position.set(0, 0.02, 0.262);
  stbdFlankGroup.add(stbdSlitGlow);

  // Starboard vertical access hatch plate below the red slit (seen in 03_right_posX!)
  const stbdLowerHatch = new T.Mesh(createChamferedBlock(T, 0.34, 0.48, 0.06, 0.05, 0.012), secondaryArmorMat);
  stbdLowerHatch.position.set(0, -0.44, 0.03);
  stbdLowerHatch.rotation.x = 0.38;
  stbdFlankGroup.add(stbdLowerHatch);

  // ===========================================================================
  // 5. REAR (-Z) MAIN CONCAVE CRIMSON THRUSTER BELL & TWIN CLAMP BRACKETS (-Z -> -1.40m)
  // ===========================================================================
  const rearThrusterGroup = new T.Group();
  rearThrusterGroup.name = 'RearMainThruster_Assembly';
  rearThrusterGroup.position.set(0, -0.26, -SPHERE_RZ + 0.06);
  rearThrusterGroup.rotation.y = Math.PI;
  mainHullGroup.add(rearThrusterGroup);

  // Heavy circular beveled white ceramic thruster shroud (reaches world Z = -0.26 - 1.02 - 0.12 = -1.40m!)
  const rearBellProfile = [
    new T.Vector2(0.42, -0.10),
    new T.Vector2(0.45,  0.02),
    new T.Vector2(0.39,  0.14),
    new T.Vector2(0.35,  0.14),
    new T.Vector2(0.29,  0.06),
    new T.Vector2(0.24, -0.04)
  ];
  const rearBellGeo = new T.LatheGeometry(rearBellProfile, 32);
  rearBellGeo.rotateX(Math.PI * 0.5);
  rearThrusterGroup.add(new T.Mesh(rearBellGeo, whiteArmorMat));

  // Concave deep crimson plasma thruster core & concentric emitter ring
  const rearCoreDisc = new T.Mesh(new T.SphereGeometry(0.285, 24, 18), crimsonOpticShaderMat);
  rearCoreDisc.scale.set(1.0, 1.0, 0.32);
  rearCoreDisc.position.z = 0.015;
  rearThrusterGroup.add(rearCoreDisc);

  const rearNozzleGlowRing = new T.Mesh(new T.TorusGeometry(0.30, 0.018, 10, 32), redNeonGlowMat);
  rearNozzleGlowRing.position.z = 0.105;
  rearThrusterGroup.add(rearNozzleGlowRing);

  // Compact translucent crimson thruster glow cone (fits cleanly within rear bell without bloating Box3)
  const rearPlumeMat = new T.MeshBasicMaterial({
    name: 'RearMainThruster_CrimsonIonGlow',
    color: 0xff2030,
    transparent: true,
    opacity: 0.44,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const rearPlumeGeo = new T.ConeGeometry(0.24, 0.22, 20, 1, true);
  rearPlumeGeo.rotateX(Math.PI * 0.5);
  rearPlumeGeo.translate(0, 0, 0.08);
  const rearPlumeMesh = new T.Mesh(rearPlumeGeo, rearPlumeMat);
  rearPlumeMesh.name = 'RearMainThruster_IonCone';
  rearPlumeMesh.userData.noShadow = true;
  rearPlumeMesh.castShadow = false;
  rearThrusterGroup.add(rearPlumeMesh);

  // Twin vertical armored stabilizer clamps flanking the rear thruster (seen clearly in 02_back_negZ!)
  [-1, 1].forEach((side) => {
    const clamp = new T.Group();
    clamp.position.set(side * 0.43, -0.14, 0.05);
    const housing = new T.Mesh(createChamferedBlock(T, 0.11, 0.34, 0.14, 0.02, 0.008), whiteArmorMat);
    clamp.add(housing);
    const upperPip = new T.Mesh(new T.BoxGeometry(0.055, 0.045, 0.04), redNeonGlowMat);
    upperPip.position.set(0, 0.04, 0.072);
    clamp.add(upperPip);
    const lowerFoot = new T.Mesh(new T.BoxGeometry(0.085, 0.10, 0.12), redArmorAccentMat);
    lowerFoot.position.set(0, -0.15, -0.01);
    clamp.add(lowerFoot);
    rearThrusterGroup.add(clamp);
  });

  // ===========================================================================
  // 6. VENTRAL RECESSED HATCH & FOUR RED-TIPPED LANDING/PROBE PRONGS (-Y -> -1.40m)
  // ===========================================================================
  // Recessed circular/oval ventral access hatch on the bottom pole (seen in 06_bottom_negY!)
  const ventralHatchRim = new T.Mesh(new T.TorusGeometry(0.42, 0.022, 10, 36), darkChassisMat);
  ventralHatchRim.rotation.x = Math.PI * 0.5;
  ventralHatchRim.scale.set(1.12, 0.90, 1.0);
  ventralHatchRim.position.set(0, -SPHERE_RY + 0.04, 0.0);
  mainHullGroup.add(ventralHatchRim);

  const ventralHatchPlate = new T.Mesh(new T.CylinderGeometry(0.40, 0.40, 0.04, 32), secondaryArmorMat);
  ventralHatchPlate.scale.set(1.10, 1.0, 0.88);
  ventralHatchPlate.position.set(0, -SPHERE_RY + 0.03, 0.0);
  mainHullGroup.add(ventralHatchPlate);

  // Four symmetrical angled ventral landing/sensor prongs with glowing crimson tips (reach Y = -1.40m!)
  const prongSpecs = [
    { name: 'VentralProng_FrontPort', x: -0.34, z: 0.38, rx: 0.24, rz: -0.22 },
    { name: 'VentralProng_FrontStarboard', x: 0.34, z: 0.38, rx: 0.24, rz: 0.22 },
    { name: 'VentralProng_RearPort', x: -0.34, z: -0.44, rx: -0.22, rz: -0.20 },
    { name: 'VentralProng_RearStarboard', x: 0.34, z: -0.44, rx: -0.22, rz: 0.20 }
  ];
  const prongBaseGeo = new T.CylinderGeometry(0.088, 0.135, 0.26, 16);
  const prongRingGeo = new T.TorusGeometry(0.084, 0.014, 8, 20);
  const prongTipProfile = [
    new T.Vector2(0.082, 0.0),
    new T.Vector2(0.076, -0.10),
    new T.Vector2(0.056, -0.22),
    new T.Vector2(0.026, -0.29),
    new T.Vector2(0.001, -0.31)
  ];
  const prongTipGeo = new T.LatheGeometry(prongTipProfile, 16);

  for (const ps of prongSpecs) {
    const prongGroup = new T.Group();
    prongGroup.name = ps.name;
    prongGroup.position.set(ps.x, -0.98, ps.z);
    prongGroup.rotation.set(ps.rx, 0, ps.rz);

    const upperStem = new T.Mesh(prongBaseGeo, whiteArmorMat);
    upperStem.position.y = -0.05;
    prongGroup.add(upperStem);

    const collar = new T.Mesh(prongRingGeo, darkChassisMat);
    collar.rotation.x = Math.PI * 0.5;
    collar.position.y = -0.18;
    prongGroup.add(collar);

    const crimsonTip = new T.Mesh(prongTipGeo, redNeonGlowMat);
    crimsonTip.position.y = -0.18;
    prongGroup.add(crimsonTip);

    mainHullGroup.add(prongGroup);
  }

  // ===========================================================================
  // 7. TWIN FORWARD HEAVY MISSILE WEAPON MOUNTS (+Z -> +1.40m)
  //    Precision-engineered twin cylindrical missile launchers with recessed
  //    crimson cooling fins, symmetrical tactical rails, articulated 6-petal
  //    launch irises, and independent launch recoil animation.
  // ===========================================================================
  const MOUNT_X = 0.455;
  const MOUNT_Y = -0.085;
  const MOUNT_BASE_Z = 0.52;
  const MOUNT_TIP_LOCAL_Z = 0.88; // Exact tip at hullEnvelopeGroup Z = 0.52 + 0.88 = +1.40m!

  const weaponMounts = []; // [portMountData, starboardMountData]

  const buildWeaponMount = (side) => {
    const label = side < 0 ? 'Port' : 'Starboard';
    const mountRoot = new T.Group();
    mountRoot.name = `WeaponMount_${label}_Root`;
    mountRoot.position.set(side * MOUNT_X, MOUNT_Y, MOUNT_BASE_Z);
    hullEnvelopeGroup.add(mountRoot);

    // Fixed hull-socket mounting flange collar
    const socketProfile = [
      new T.Vector2(0.36, -0.16),
      new T.Vector2(0.38,  0.00),
      new T.Vector2(0.35,  0.14),
      new T.Vector2(0.31,  0.18),
      new T.Vector2(0.27,  0.18)
    ];
    const socketGeo = new T.LatheGeometry(socketProfile, 32);
    socketGeo.rotateX(Math.PI * 0.5);
    const socketMesh = new T.Mesh(socketGeo, whiteArmorMat);
    socketMesh.name = `WeaponMount_${label}_HullSocket`;
    mountRoot.add(socketMesh);

    // Recoiling launcher barrel assembly (slides cleanly along -Z upon missile launch!)
    const barrelGroup = new T.Group();
    barrelGroup.name = `WeaponMount_${label}_BarrelAssembly`;
    mountRoot.add(barrelGroup);

    // Mid-section stepped ceramic breech housing (z = 0.14 -> 0.56)
    const breechProfile = [
      new T.Vector2(0.28, 0.14),
      new T.Vector2(0.31, 0.18),
      new T.Vector2(0.31, 0.30),
      new T.Vector2(0.27, 0.34),
      new T.Vector2(0.27, 0.46),
      new T.Vector2(0.32, 0.50),
      new T.Vector2(0.34, 0.56)
    ];
    const breechGeo = new T.LatheGeometry(breechProfile, 32);
    breechGeo.rotateX(Math.PI * 0.5);
    barrelGroup.add(new T.Mesh(breechGeo, secondaryArmorMat));

    // Exposed glowing crimson-red plasma capacitor / cooling core cylinder inside the ribbed muzzle shroud
    const coreRadiatorMat = new T.MeshStandardMaterial({
      name: `WeaponMount_${label}_RadiatorCoreMat`,
      color: 0xcc0414,
      emissive: 0xff0418,
      emissiveIntensity: 1.35,
      metalness: 0.25,
      roughness: 0.20
    });
    const coreRadiator = new T.Mesh(new T.CylinderGeometry(0.285, 0.285, 0.28, 28), coreRadiatorMat);
    coreRadiator.rotation.x = Math.PI * 0.5;
    coreRadiator.position.z = 0.67;
    barrelGroup.add(coreRadiator);

    // 4 Crisp Stacked White Ceramic Radiator Rib Rings around the forward launcher head (exact match to GLB ribbed barrels!)
    for (let r = 0; r < 4; r++) {
      const rz = 0.56 + r * 0.068;
      const ribRad = r === 3 ? 0.318 : 0.338;
      const ribRing = new T.Mesh(new T.TorusGeometry(ribRad, 0.024, 10, 32), whiteArmorMat);
      ribRing.position.z = rz;
      barrelGroup.add(ribRing);
    }

    // Precision Symmetrical Tactical Sight Frame & Clamping Rails (upgraded clean aerospace version of the GLB mount rails!)
    const topRail = new T.Mesh(createChamferedBlock(T, 0.28, 0.072, 0.34, 0.018, 0.008), whiteArmorMat);
    topRail.position.set(0, 0.348, 0.65);
    barrelGroup.add(topRail);

    const topRailLed = new T.Mesh(new T.BoxGeometry(0.085, 0.026, 0.04), coreRadiatorMat);
    topRailLed.position.set(0, 0.365, 0.815);
    barrelGroup.add(topRailLed);

    const botRail = new T.Mesh(createChamferedBlock(T, 0.24, 0.062, 0.32, 0.016, 0.008), secondaryArmorMat);
    botRail.position.set(0, -0.342, 0.65);
    barrelGroup.add(botRail);

    // 4 Cardinal Radial Clamping Lugs with glowing red status tips around the muzzle ring
    for (let l = 0; l < 4; l++) {
      const la = (l / 4) * Math.PI * 2;
      const lugPivot = new T.Group();
      lugPivot.rotation.z = la;
      const lug = new T.Mesh(new T.BoxGeometry(0.068, 0.088, 0.24), whiteArmorMat);
      lug.position.set(0, 0.342, 0.66);
      lugPivot.add(lug);
      const lugLed = new T.Mesh(new T.BoxGeometry(0.036, 0.026, 0.032), coreRadiatorMat);
      lugLed.position.set(0, 0.352, 0.782);
      lugPivot.add(lugLed);
      barrelGroup.add(lugPivot);
    }

    // Forward Muzzle Faceplate Collar & Deep Recessed Missile Launch Tube (exact front tip at z = 0.88!)
    const muzzleFaceProfile = [
      new T.Vector2(0.325, 0.77),
      new T.Vector2(0.310, 0.84),
      new T.Vector2(0.245, 0.875),
      new T.Vector2(0.185, 0.875),
      new T.Vector2(0.165, 0.83),
      new T.Vector2(0.165, 0.56)
    ];
    const muzzleFaceGeo = new T.LatheGeometry(muzzleFaceProfile, 32);
    muzzleFaceGeo.rotateX(Math.PI * 0.5);
    barrelGroup.add(new T.Mesh(muzzleFaceGeo, whiteArmorMat));

    // Deep dark obsidian missile launch tube interior
    const tubeInterior = new T.Mesh(new T.CylinderGeometry(0.162, 0.162, 0.42, 24, 1, true), deepCavityMat);
    tubeInterior.rotation.x = Math.PI * 0.5;
    tubeInterior.position.z = 0.65;
    barrelGroup.add(tubeInterior);

    // Glowing Crimson Muzzle Focus Ring & Recessed Ignition Ring at exact barrel mouth
    const muzzleRingMat = new T.MeshStandardMaterial({
      name: `WeaponMount_${label}_MuzzleGlowRingMat`,
      color: 0xd40616,
      emissive: 0xff0418,
      emissiveIntensity: 1.45,
      metalness: 0.22,
      roughness: 0.14
    });
    const muzzleOuterRing = new T.Mesh(new T.TorusGeometry(0.195, 0.020, 12, 32), muzzleRingMat);
    muzzleOuterRing.position.z = 0.858;
    barrelGroup.add(muzzleOuterRing);

    const muzzleInnerRing = new T.Mesh(new T.TorusGeometry(0.135, 0.014, 10, 28), muzzleRingMat);
    muzzleInnerRing.position.z = 0.835;
    barrelGroup.add(muzzleInnerRing);

    // Recessed launcher ignition core plate (visible inside the muzzle bore when armed)
    const boreCorePlate = new T.Mesh(new T.CircleGeometry(0.145, 24), crimsonOpticShaderMat);
    boreCorePlate.position.z = 0.74;
    barrelGroup.add(boreCorePlate);

    // 6 Articulated Launch Aperture Iris Petals ringing the tip (flare outward when firing!)
    const irisPetals = [];
    const petalPlateGeo = createChamferedBlock(T, 0.072, 0.095, 0.022, 0.014, 0.005);
    const petalTrimGeo = new T.BoxGeometry(0.020, 0.068, 0.012);
    for (let p = 0; p < 6; p++) {
      const pa = (p / 6) * Math.PI * 2 + Math.PI / 6;
      const pPivot = new T.Group();
      pPivot.rotation.z = pa;

      const petal = new T.Group();
      petal.position.set(0, 0.175, 0.855);
      petal.rotation.x = 0.28;

      const plate = new T.Mesh(petalPlateGeo, p % 2 === 0 ? whiteArmorMat : darkChassisMat);
      const trim = new T.Mesh(petalTrimGeo, muzzleRingMat);
      trim.position.set(0, 0.004, -0.014);
      petal.add(plate, trim);
      pPivot.add(petal);
      barrelGroup.add(pPivot);

      irisPetals.push({
        petal,
        baseY: 0.175,
        baseZ: 0.855,
        baseRotX: 0.28
      });
    }

    const mountData = {
      side,
      label,
      mountRoot,
      barrelGroup,
      irisPetals,
      coreRadiatorMat,
      muzzleRingMat,
      rawTipLocal: new T.Vector3(side * MOUNT_X, MOUNT_Y, MOUNT_BASE_Z + MOUNT_TIP_LOCAL_Z)
    };
    weaponMounts.push(mountData);
    return mountData;
  };

  buildWeaponMount(-1); // Index 0: Port (-X) Weapon Mount
  buildWeaponMount(1);  // Index 1: Starboard (+X) Weapon Mount

  // ===========================================================================
  // 8. EXACT ANALYTICAL CALIBRATION -> 2.80m (W) x 2.80m (H) x 2.80m (L)
  // ===========================================================================
  hullEnvelopeGroup.updateMatrixWorld(true);
  const rawHullBox = new T.Box3().setFromObject(hullEnvelopeGroup);
  const rawHullSize = rawHullBox.getSize(new T.Vector3());
  const rawHullCenter = rawHullBox.getCenter(new T.Vector3());

  const sxCal = rawHullSize.x > 0.001 ? (TARGET_WIDTH / rawHullSize.x) : 1.0;
  const syCal = rawHullSize.y > 0.001 ? (TARGET_HEIGHT / rawHullSize.y) : 1.0;
  const szCal = rawHullSize.z > 0.001 ? (TARGET_LENGTH / rawHullSize.z) : 1.0;

  hullEnvelopeGroup.scale.set(sxCal, syCal, szCal);
  hullEnvelopeGroup.position.set(
    -rawHullCenter.x * sxCal,
    -rawHullCenter.y * syCal,
    -rawHullCenter.z * szCal
  );
  hullEnvelopeGroup.updateMatrixWorld(true);

  // Compute exact calibrated front tip positions of BOTH weapon mounts in bodyGroup local space!
  for (let i = 0; i < weaponMounts.length; i++) {
    const m = weaponMounts[i];
    const tipCal = m.rawTipLocal.clone().applyMatrix4(hullEnvelopeGroup.matrix);
    m.tipPos = tipCal;
    const key = m.side < 0 ? 'port' : 'starboard';
    metadata.weaponMountTips[key] = {
      x: Number(tipCal.x.toFixed(4)),
      y: Number((BASE_CENTER_Y + tipCal.y).toFixed(4)),
      z: Number(tipCal.z.toFixed(4))
    };
  }

  // ===========================================================================
  // 9. AMBIENT CRIMSON ION-FIELD MICRO-PARTICLES (Contained Inside 2.80m Hull)
  // ===========================================================================
  const ambientCount = 84;
  const ambientSeeds = [];
  const ambientPositions = new Float32Array(ambientCount * 3);
  const ambientColors = new Float32Array(ambientCount * 3);
  const tmpColor = new T.Color();

  for (let i = 0; i < ambientCount; i++) {
    const u = rand();
    const ang = rand() * Math.PI * 2;
    const rad = 0.08 + rand() * 0.24;
    const lane = i % 3; // 0: rear main thruster, 1: port lower thruster, 2: zenith corona
    ambientSeeds.push({ u, ang, rad, lane, speed: 1.0 + Math.round(rand() * 2.0) });

    ambientPositions[i * 3] = Math.cos(ang) * rad;
    ambientPositions[i * 3 + 1] = -0.22 + Math.sin(ang) * rad;
    ambientPositions[i * 3 + 2] = -0.95;

    tmpColor.setHex(rand() > 0.30 ? 0xff2234 : 0xff8850);
    ambientColors[i * 3] = tmpColor.r;
    ambientColors[i * 3 + 1] = tmpColor.g;
    ambientColors[i * 3 + 2] = tmpColor.b;
  }

  const ambientGeo = new T.BufferGeometry();
  ambientGeo.setAttribute('position', new T.BufferAttribute(ambientPositions, 3));
  ambientGeo.setAttribute('color', new T.BufferAttribute(ambientColors, 3));
  const ambientMat = new T.PointsMaterial({
    name: 'ReconThruster_CrimsonWakeParticles',
    size: 0.068,
    map: ambientRedOrbTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const ambientParticles = new T.Points(ambientGeo, ambientMat);
  ambientParticles.name = 'ReconThruster_WakeSwarm';
  bodyGroup.add(ambientParticles);

  // ===========================================================================
  // 10. SHARED HIGH-DETAIL 3D MISSILE GEOMETRIES (Reused across all 6 missiles)
  // ===========================================================================
  // Missile coordinate convention: local +Z = warhead tip (+0.62m), local -Z = rocket nozzle (-0.54m)
  // Total missile length: ~1.16m, body diameter: ~0.16m (fits cleanly inside 0.32m launcher bore!)
  const missileNoseProfile = [
    new T.Vector2(0.001, 0.30),
    new T.Vector2(0.022, 0.26),
    new T.Vector2(0.048, 0.19),
    new T.Vector2(0.068, 0.10),
    new T.Vector2(0.080, 0.00)
  ];
  const sharedMissileNoseGeo = new T.LatheGeometry(missileNoseProfile, 20);
  sharedMissileNoseGeo.rotateX(Math.PI * 0.5);

  const sharedMissileSeekerGeo = new T.SphereGeometry(0.026, 14, 10);
  const sharedMissileBodyGeo = new T.CylinderGeometry(0.080, 0.082, 0.72, 20);
  sharedMissileBodyGeo.rotateX(Math.PI * 0.5);

  const sharedMissileCollarGeo = new T.CylinderGeometry(0.086, 0.086, 0.11, 20);
  sharedMissileCollarGeo.rotateX(Math.PI * 0.5);

  const sharedMissileHazardGeo = new T.CylinderGeometry(0.084, 0.084, 0.045, 20);
  sharedMissileHazardGeo.rotateX(Math.PI * 0.5);

  const sharedMissileRedBandGeo = new T.CylinderGeometry(0.083, 0.083, 0.14, 20);
  sharedMissileRedBandGeo.rotateX(Math.PI * 0.5);

  const sharedMissileNozzleGeo = new T.CylinderGeometry(0.072, 0.054, 0.14, 18);
  sharedMissileNozzleGeo.rotateX(Math.PI * 0.5);

  const sharedNozzleCoreGeo = new T.CircleGeometry(0.052, 16);
  sharedNozzleCoreGeo.rotateY(Math.PI);

  // Swept Cruciform Aft Delta Tail Fin geometry
  const tailFinShape = new T.Shape();
  tailFinShape.moveTo(0.0,  0.00);
  tailFinShape.lineTo(0.26, 0.00);
  tailFinShape.lineTo(0.06, 0.17);
  tailFinShape.lineTo(-0.04, 0.16);
  tailFinShape.closePath();
  const sharedTailFinGeo = new T.ExtrudeGeometry(tailFinShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 1
  });
  sharedTailFinGeo.translate(0, 0, -0.006);
  // Rotate so shape +X points forward (+Z), +Y points radially outward (+Y), depth along X
  sharedTailFinGeo.rotateY(-Math.PI * 0.5);

  // Forward Canard Guidance Fin geometry
  const canardShape = new T.Shape();
  canardShape.moveTo(0.0,  0.00);
  canardShape.lineTo(0.13, 0.00);
  canardShape.lineTo(0.02, 0.075);
  canardShape.lineTo(-0.02, 0.070);
  canardShape.closePath();
  const sharedCanardGeo = new T.ExtrudeGeometry(canardShape, {
    depth: 0.009,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.002,
    bevelSegments: 1
  });
  sharedCanardGeo.translate(0, 0, -0.0045);
  sharedCanardGeo.rotateY(-Math.PI * 0.5);

  // Supersonic Rocket Exhaust Plume outer cone (tip pointing -Z behind missile, base at z = 0)
  const sharedPlumeOuterGeo = new T.ConeGeometry(0.115, 1.35, 16, 12, true);
  sharedPlumeOuterGeo.rotateX(-Math.PI * 0.5);
  sharedPlumeOuterGeo.translate(0, 0, -0.675);

  // White-hot inner rocket core cone
  const sharedPlumeCoreGeo = new T.ConeGeometry(0.056, 0.72, 12, 1, true);
  sharedPlumeCoreGeo.rotateX(-Math.PI * 0.5);
  sharedPlumeCoreGeo.translate(0, 0, -0.36);

  // Translucent elongated trailing smoke/plasma contrail cone (scaled dynamically so it never pokes behind z=0!)
  const sharedContrailGeo = new T.ConeGeometry(0.16, 1.0, 14, 1, true);
  sharedContrailGeo.rotateX(-Math.PI * 0.5);
  sharedContrailGeo.translate(0, 0, -0.5);

  // Shared Launch/Detonation Ring & Flare Plane Geometries
  const sharedShockRingGeo = new T.TorusGeometry(0.24, 0.015, 10, 32);
  const sharedFlarePlaneGeo = new T.PlaneGeometry(1.05, 1.05);
  const sharedDetSphereGeo = new T.SphereGeometry(0.42, 20, 16);

  /**
   * Constructs one detailed 3D procedural missile mesh group with warhead, body bands,
   * 4 swept tail fins, 4 canard fins, thruster bell, GLSL rocket plume, and contrail wake.
   */
  function createMissileActor(mountLabel, idx, plumeOuterMat, plumeCoreMat, contrailMat) {
    const actor = new T.Group();
    actor.name = `ReconMissile_${mountLabel}_${idx}`;

    // Solid rotating missile airframe (spins gently around Z for gyro stabilization in flight)
    const hull = new T.Group();
    hull.name = `ReconMissileAirframe_${mountLabel}_${idx}`;
    actor.add(hull);

    // Ogive crimson warhead nosecone (+0.34 -> +0.64)
    const nose = new T.Mesh(sharedMissileNoseGeo, missileWarheadRedMat);
    nose.position.z = 0.34;
    nose.frustumCulled = false;
    hull.add(nose);

    // Glowing crimson optical seeker tip (+0.62)
    const seeker = new T.Mesh(sharedMissileSeekerGeo, missileSeekerGlowMat);
    seeker.position.z = 0.62;
    seeker.frustumCulled = false;
    hull.add(seeker);

    // White ceramic guidance collar (+0.29)
    const collar = new T.Mesh(sharedMissileCollarGeo, missileCollarWhiteMat);
    collar.position.z = 0.29;
    collar.frustumCulled = false;
    hull.add(collar);

    // Yellow/gold tactical hazard band (+0.21)
    const hazard = new T.Mesh(sharedMissileHazardGeo, missileHazardGoldMat);
    hazard.position.z = 0.21;
    hazard.frustumCulled = false;
    hull.add(hazard);

    // Main gunmetal-titanium cylindrical fuselage (-0.38 -> +0.34)
    const body = new T.Mesh(sharedMissileBodyGeo, missileBodyMat);
    body.position.z = -0.02;
    body.frustumCulled = false;
    hull.add(body);

    // Mid-body anodized crimson warhead band (-0.06)
    const redBand = new T.Mesh(sharedMissileRedBandGeo, missileWarheadRedMat);
    redBand.position.z = -0.06;
    redBand.frustumCulled = false;
    hull.add(redBand);

    // Rear tapered rocket nozzle bell (-0.45)
    const nozzle = new T.Mesh(sharedMissileNozzleGeo, machinedAlloyMat);
    nozzle.position.z = -0.45;
    nozzle.frustumCulled = false;
    hull.add(nozzle);

    const nozzleThroat = new T.Mesh(sharedNozzleCoreGeo, missileSeekerGlowMat);
    nozzleThroat.position.z = -0.522;
    nozzleThroat.userData.noShadow = true;
    nozzleThroat.castShadow = false;
    nozzleThroat.frustumCulled = false;
    hull.add(nozzleThroat);

    // 4 Cruciform Swept Delta Tail Fins + 4 Forward Canard Fins
    for (let f = 0; f < 4; f++) {
      const ang = (f / 4) * Math.PI * 2 + Math.PI * 0.25;

      const tailPivot = new T.Group();
      tailPivot.rotation.z = ang;
      const tailFin = new T.Mesh(sharedTailFinGeo, missileFinMat);
      tailFin.position.set(0, 0.072, -0.42);
      tailFin.frustumCulled = false;
      tailPivot.add(tailFin);
      hull.add(tailPivot);

      const canardPivot = new T.Group();
      canardPivot.rotation.z = ang;
      const canard = new T.Mesh(sharedCanardGeo, missileCollarWhiteMat);
      canard.position.set(0, 0.074, 0.22);
      canard.frustumCulled = false;
      canardPivot.add(canard);
      hull.add(canardPivot);
    }

    // Animated Rocket Exhaust Plume & Dynamic Contrail attached at rear nozzle (-0.52)
    const exhaustGroup = new T.Group();
    exhaustGroup.name = `ReconMissileExhaust_${mountLabel}_${idx}`;
    exhaustGroup.position.z = -0.52;
    actor.add(exhaustGroup);

    const plumeOuter = new T.Mesh(sharedPlumeOuterGeo, plumeOuterMat);
    plumeOuter.userData.noShadow = true;
    plumeOuter.castShadow = false;
    plumeOuter.frustumCulled = false;
    exhaustGroup.add(plumeOuter);

    const plumeCore = new T.Mesh(sharedPlumeCoreGeo, plumeCoreMat);
    plumeCore.userData.noShadow = true;
    plumeCore.castShadow = false;
    plumeCore.frustumCulled = false;
    exhaustGroup.add(plumeCore);

    const contrail = new T.Mesh(sharedContrailGeo, contrailMat);
    contrail.userData.noShadow = true;
    contrail.castShadow = false;
    contrail.frustumCulled = false;
    exhaustGroup.add(contrail);

    return {
      actor,
      hull,
      exhaustGroup,
      plumeOuter,
      plumeCore,
      contrail
    };
  }

  // ===========================================================================
  // 11. DECAL-CONTROLLED TWIN MISSILE WEAPON SYSTEMS (28.0 METER FLIGHT RANGE)
  //     Controlled via meshy_test_0/index.html Decals Tab & Global Decal APIs:
  //       - Decal_MissileStrike_Port_Weapon       (Left/Port Weapon Mount)
  //       - Decal_MissileStrike_Starboard_Weapon  (Right/Starboard Weapon Mount)
  //     Supports:
  //       - window.toggleDecalMesh('Decal_MissileStrike_Port_Weapon', true/false)
  //       - window.toggleDecalMesh('Decal_MissileStrike_Starboard_Weapon', true/false)
  //       - window.DECAL_CONFIG.strikesEnabled = true/false; window.applyDecalsVisibility()
  //       - window.DECAL_CONFIG.allEnabled = true/false; window.applyDecalsVisibility()
  //       - window.DECAL_CONFIG.opacity = 0..1; window.applyDecalsVisibility()
  //       - decalMesh.visible = true/false
  // ===========================================================================
  const weaponSystems = []; // [portSystem, starboardSystem]
  let _lastElapsed = 0.0;

  const PI2 = Math.PI * 2;
  const OMEGA = PI2 / duration;
  const SPARKS_PER_MOUNT = 90;

  function createWeaponDecalSystem(mountIndex) {
    const mount = weaponMounts[mountIndex];
    const decalName = weaponDecalNames[mountIndex];
    const label = mount.label;

    // Decal control trigger mesh seated cleanly inside the weapon mount muzzle bore
    // (radius 0.042 recessed 0.045m inside tip so initial Box3 stays strictly 2.80m x 2.80m x 2.80m!)
    const decalControlMat = new T.MeshBasicMaterial({
      name: `${decalName}_Mat`,
      color: 0xff2634,
      transparent: true,
      opacity: 1.0,
      blending: T.AdditiveBlending,
      depthWrite: false
    });

    const decalMesh = new T.Mesh(new T.SphereGeometry(0.042, 14, 12), decalControlMat);
    decalMesh.name = decalName;
    decalMesh.position.set(mount.tipPos.x, mount.tipPos.y, mount.tipPos.z - 0.045);
    decalMesh.userData.noShadow = true;
    decalMesh.userData.isDecal = true;
    decalMesh.userData.decalType = 'missile';
    decalMesh.userData.mount = label.toLowerCase();
    decalMesh.castShadow = false;
    decalMesh.receiveShadow = false;
    bodyGroup.add(decalMesh);

    // Dynamic launch flash light seated slightly ahead of the mount tip
    const muzzleLight = new T.PointLight(0xff3824, 0.0, 9.0, 1.5);
    muzzleLight.position.set(mount.tipPos.x, mount.tipPos.y + 0.04, mount.tipPos.z + 0.35);
    bodyGroup.add(muzzleLight);

    // Missile flight assembly: child of decalMesh, origin placed at the EXACT weapon mount front tip (+0.045m)!
    // Parked collapsed at load time so meshy_test_0 Box3 measurement captures ONLY the 2.80m x 2.80m x 2.80m drone!
    const missileAssembly = new T.Group();
    missileAssembly.name = `TwinMissileLauncher_${label}_Assembly`;
    missileAssembly.position.set(0, 0, 0.045);
    missileAssembly.scale.setScalar(0.0001);
    missileAssembly.visible = false;
    decalMesh.add(missileAssembly);

    // Per-mount rocket plume & Fresnel volumetric contrail materials (100% independent Port/Starboard opacity!)
    const { mat: plumeOuterMat, uniforms: plumeUniforms } = createRocketPlumeShaderMat(label);
    const plumeCoreMat = new T.MeshBasicMaterial({
      name: `MissileExhaust_WhiteHotCore_${label}`,
      color: 0xfff0dc,
      transparent: true,
      opacity: 0.96,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide
    });
    const contrailMat = createContrailShaderMat(label, plumeUniforms);

    // 3 Staggered 3D Missiles flying 0.0m -> 28.0m from this mount tip
    const missiles = [];
    for (let k = 0; k < MISSILES_PER_MOUNT; k++) {
      const mActor = createMissileActor(label, k, plumeOuterMat, plumeCoreMat, contrailMat);
      missileAssembly.add(mActor.actor);
      missiles.push({
        ...mActor,
        phaseOffset: k / MISSILES_PER_MOUNT
      });
    }

    // Muzzle Launch Star-Bloom Flash right at the mount tip (z = 0.04)
    const muzzleFlareGroup = new T.Group();
    muzzleFlareGroup.name = `MissileLaunchFlare_${label}`;
    muzzleFlareGroup.position.set(0, 0, 0.04);
    const muzzleFlareMat = new T.MeshBasicMaterial({
      name: `MissileLaunchFlareMat_${label}`,
      map: launchFlareTex,
      color: 0xffd8c8,
      transparent: true,
      opacity: 0.0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide
    });
    const f1 = new T.Mesh(sharedFlarePlaneGeo, muzzleFlareMat);
    const f2 = new T.Mesh(sharedFlarePlaneGeo, muzzleFlareMat);
    f2.rotation.y = Math.PI * 0.5;
    const f3 = new T.Mesh(sharedFlarePlaneGeo, muzzleFlareMat);
    f3.rotation.x = Math.PI * 0.5;
    [f1, f2, f3].forEach((p) => {
      p.userData.noShadow = true;
      p.castShadow = false;
      p.frustumCulled = false;
      muzzleFlareGroup.add(p);
    });
    missileAssembly.add(muzzleFlareGroup);

    // Expanding Muzzle Launch Shockwave Ring shooting forward out of the tip on launch
    const launchRingMat = new T.MeshBasicMaterial({
      name: `MissileLaunchRingMat_${label}`,
      color: 0xff5a30,
      transparent: true,
      opacity: 0.0,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const launchRing = new T.Mesh(sharedShockRingGeo, launchRingMat);
    launchRing.name = `MissileLaunchRing_${label}`;
    launchRing.userData.noShadow = true;
    launchRing.castShadow = false;
    launchRing.frustumCulled = false;
    missileAssembly.add(launchRing);

    // 28.0m Terminal Range Plasma Detonation FX (triggers right at z = MISSILE_RANGE = 28.0m!)
    const detGroup = new T.Group();
    detGroup.name = `MissileTerminalDetonation_${label}`;
    detGroup.position.set(0, 0, MISSILE_RANGE);
    missileAssembly.add(detGroup);

    const detCoreMat = new T.MeshBasicMaterial({
      name: `MissileDetonationCoreMat_${label}`,
      color: 0xff6230,
      transparent: true,
      opacity: 0.0,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const detCore = new T.Mesh(sharedDetSphereGeo, detCoreMat);
    detCore.userData.noShadow = true;
    detCore.castShadow = false;
    detCore.frustumCulled = false;
    detGroup.add(detCore);

    const detRingMat = new T.MeshBasicMaterial({
      name: `MissileDetonationRingMat_${label}`,
      color: 0xff2030,
      transparent: true,
      opacity: 0.0,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const detRing = new T.Mesh(sharedShockRingGeo, detRingMat);
    detRing.userData.noShadow = true;
    detRing.castShadow = false;
    detRing.frustumCulled = false;
    detGroup.add(detRing);

    const detFlareMat = new T.MeshBasicMaterial({
      name: `MissileDetonationFlareMat_${label}`,
      map: launchFlareTex,
      color: 0xffe0c0,
      transparent: true,
      opacity: 0.0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide
    });
    const df1 = new T.Mesh(sharedFlarePlaneGeo, detFlareMat);
    const df2 = new T.Mesh(sharedFlarePlaneGeo, detFlareMat);
    df2.rotation.y = Math.PI * 0.5;
    [df1, df2].forEach((p) => {
      p.userData.noShadow = true;
      p.castShadow = false;
      p.frustumCulled = false;
      detGroup.add(p);
    });

    // Rocket Exhaust Spark & Contrail Ember Particle Stream trailing behind the 3 missiles along 0..28m
    const sparkSeeds = [];
    const sparkPositions = new Float32Array(SPARKS_PER_MOUNT * 3);
    const sparkColors = new Float32Array(SPARKS_PER_MOUNT * 3);
    for (let i = 0; i < SPARKS_PER_MOUNT; i++) {
      const missileIdx = i % MISSILES_PER_MOUNT;
      const trailFrac = rand();
      const ang = rand() * PI2;
      const rad = 0.02 + rand() * 0.14;
      const drift = (rand() - 0.5) * 0.08;
      sparkSeeds.push({ missileIdx, trailFrac, ang, rad, drift });

      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = 0;
      sparkPositions[i * 3 + 2] = 0;

      const pick = rand();
      if (pick < 0.42) tmpColor.setHex(0xff2830);
      else if (pick < 0.78) tmpColor.setHex(0xff7828);
      else tmpColor.setHex(0xffe8c8);
      sparkColors[i * 3] = tmpColor.r;
      sparkColors[i * 3 + 1] = tmpColor.g;
      sparkColors[i * 3 + 2] = tmpColor.b;
    }

    const sparkGeo = new T.BufferGeometry();
    sparkGeo.setAttribute('position', new T.BufferAttribute(sparkPositions, 3));
    sparkGeo.setAttribute('color', new T.BufferAttribute(sparkColors, 3));
    const sparkMat = new T.PointsMaterial({
      name: `MissileExhaustSparksMat_${label}`,
      size: 0.135,
      map: sparkOrbTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.90,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const sparkPoints = new T.Points(sparkGeo, sparkMat);
    sparkPoints.name = `MissileExhaustSparks_${label}`;
    sparkPoints.frustumCulled = false;
    missileAssembly.add(sparkPoints);

    const sys = {
      mountIndex,
      mount,
      decalName,
      decalMesh,
      decalControlMat,
      plumeUniforms,
      plumeOuterMat,
      plumeCoreMat,
      contrailMat,
      muzzleLight,
      missileAssembly,
      missiles,
      muzzleFlareGroup,
      muzzleFlareMat,
      launchRing,
      launchRingMat,
      detGroup,
      detCore,
      detCoreMat,
      detRing,
      detRingMat,
      detFlareMat,
      sparkPoints,
      sparkGeo,
      sparkMat,
      sparkSeeds,
      sparkPosArr: sparkGeo.attributes.position.array,
      sparkPosAttr: sparkGeo.attributes.position,
      staggerOffset: mountIndex === 0 ? 0.0 : (0.5 / MISSILES_PER_MOUNT), // Alternating Port/Starboard launches!
      visible: true,
      opacity: 1.0,
      activeMissileZ: [0, 0, 0]
    };

    // Intercept .visible updates from meshy_test_0/index.html Decals Tab & APIs
    Object.defineProperty(decalMesh, 'visible', {
      configurable: true,
      enumerable: true,
      get() {
        return sys.visible;
      },
      set(val) {
        sys.visible = Boolean(val);
        syncWeaponSystemState(sys, _lastElapsed);
      }
    });

    // Intercept material.opacity updates from meshy_test_0/index.html Decal Opacity slider
    Object.defineProperty(decalControlMat, 'opacity', {
      configurable: true,
      enumerable: true,
      get() {
        return sys.opacity;
      },
      set(val) {
        sys.opacity = Math.max(0, Math.min(1, Number.isFinite(val) ? val : 1.0));
        syncWeaponSystemState(sys, _lastElapsed);
      }
    });

    weaponSystems.push(sys);
    return sys;
  }

  function applyMountAperturePose(mount, openFactor, recoilDist) {
    mount.barrelGroup.position.z = -recoilDist;
    const dy = openFactor * 0.036;
    const dz = openFactor * 0.018;
    const drx = openFactor * 0.42;
    for (let i = 0; i < mount.irisPetals.length; i++) {
      const ip = mount.irisPetals[i];
      ip.petal.position.y = ip.baseY + dy;
      ip.petal.position.z = ip.baseZ + dz;
      ip.petal.rotation.x = ip.baseRotX - drx;
    }
  }

  function layoutMountMissileSalvo(sys, elapsed, fireLevel) {
    const cycleT = ((elapsed % duration) + duration) % duration;
    const normT = cycleT / duration;
    const baseSubPhase = normT * FLIGHTS_PER_LOOP;

    sys.missileAssembly.scale.set(1.0, 1.0, 1.0);
    sys.plumeUniforms.uTime.value = elapsed;
    sys.plumeUniforms.uIntensity.value = fireLevel;
    sys.plumeCoreMat.opacity = 0.96 * fireLevel;

    let peakLaunchPulse = 0.0;
    let bestLaunchU = 1.0;
    let peakDetPulse = 0.0;
    let bestDetProgress = 0.0;

    // Flight occupies u in [0.0, 0.90] (exact 0.0m -> 28.0m travel), terminal detonation flash in [0.90, 1.00]
    const FLIGHT_FRAC = 0.90;

    for (let k = 0; k < MISSILES_PER_MOUNT; k++) {
      const m = sys.missiles[k];
      const u = (baseSubPhase + m.phaseOffset + sys.staggerOffset) % 1.0;

      if (u < FLIGHT_FRAC) {
        const f = u / FLIGHT_FRAC; // 0.0 -> 1.0 across full 28.0m trajectory
        // Smooth rocket acceleration curve: exits tip cleanly & rockets to exact 28.0m!
        const dist = MISSILE_RANGE * (0.36 * f + 0.64 * f * f);
        sys.activeMissileZ[k] = dist;

        m.actor.visible = true;
        // Warhead seeker tip (+0.62m) emerges cleanly right at mount tip and reaches exact 28.00m at f = 1.0
        const zCenter = Math.max(-0.18, dist - 0.62);
        m.actor.position.set(0, 0, zCenter);

        // Smooth scale pop-in during initial 0.04 launch emergence inside barrel throat
        const emergeScale = f < 0.04 ? (0.45 + 0.55 * (f / 0.04)) : 1.0;
        m.actor.scale.setScalar(emergeScale);

        // Gyroscopic roll spin + realistic subtle aerodynamic flutter
        m.hull.rotation.z = elapsed * 9.5 + k * 2.1 + sys.mountIndex * 1.5;

        // Animated supersonic rocket plume flicker (clamped so flame never pokes behind z=0 barrel tip!)
        const flicker = 0.88 + 0.14 * Math.sin(elapsed * 58.0 + k * 2.4) + 0.08 * Math.cos(elapsed * 91.0);
        const availBehind = Math.max(0.04, zCenter - 0.50);
        const plumeLenScale = Math.min(1.0, availBehind / 1.15) * (0.85 + 0.25 * f) * flicker;
        const plumeRadScale = (0.78 + 0.30 * f) * flicker;
        m.plumeOuter.scale.set(plumeRadScale, plumeRadScale, Math.max(0.06, plumeLenScale));
        m.plumeCore.scale.set(plumeRadScale, plumeRadScale, Math.max(0.06, plumeLenScale));

        // Elongated plasma contrail wake behind missile (clamped strictly to z >= 0!)
        const trailLen = Math.min(4.8, Math.max(0.05, availBehind));
        m.contrail.scale.set(0.85 + 0.35 * f, 0.85 + 0.35 * f, trailLen);

        // Track freshest launch pulse (u in [0.0, 0.16]) for muzzle flare, shock ring, and barrel recoil!
        if (u < 0.16) {
          const lp = Math.sin((u / 0.16) * Math.PI);
          if (lp > peakLaunchPulse) {
            peakLaunchPulse = lp;
            bestLaunchU = u / 0.16;
          }
        }
      } else {
        // Terminal 28.0m detonation window (u in [0.90, 1.00])
        m.actor.visible = false;
        sys.activeMissileZ[k] = MISSILE_RANGE;
        const detP = (u - FLIGHT_FRAC) / (1.0 - FLIGHT_FRAC); // 0 -> 1
        const dp = Math.sin(detP * Math.PI);
        if (dp > peakDetPulse) {
          peakDetPulse = dp;
          bestDetProgress = detP;
        }
      }
    }

    // Muzzle Launch Flash & Expanding Shockwave Ring at exact mount tip (z = 0)
    const activeLaunch = peakLaunchPulse * fireLevel;
    sys.muzzleFlareGroup.visible = activeLaunch > 0.01;
    sys.muzzleFlareGroup.rotation.z = elapsed * 7.5 + sys.mountIndex * 1.4;
    sys.muzzleFlareGroup.scale.setScalar(0.55 + 0.95 * peakLaunchPulse);
    sys.muzzleFlareMat.opacity = activeLaunch * 0.96;

    sys.launchRing.visible = activeLaunch > 0.01;
    sys.launchRing.position.z = 0.05 + bestLaunchU * 1.65;
    sys.launchRing.scale.setScalar(0.55 + bestLaunchU * 1.85);
    sys.launchRingMat.opacity = (1.0 - bestLaunchU) * 0.88 * fireLevel;

    // 28.0m Terminal Range Plasma Detonation FX (at exact z = 28.0m)
    const activeDet = peakDetPulse * fireLevel;
    sys.detGroup.visible = activeDet > 0.01;
    if (sys.detGroup.visible) {
      const detScale = 0.45 + bestDetProgress * 2.4;
      sys.detCore.scale.setScalar(detScale * 0.85);
      sys.detCoreMat.opacity = (1.0 - bestDetProgress) * 0.82 * fireLevel;
      sys.detRing.scale.setScalar(0.5 + bestDetProgress * 4.2);
      sys.detRingMat.opacity = (1.0 - bestDetProgress) * 0.90 * fireLevel;
      sys.detFlareMat.opacity = activeDet * 0.95;
      sys.detGroup.rotation.z = elapsed * 5.0;
    }

    // Trailing Rocket Contrail Ember / Spark Particles along each active missile's exhaust wake
    sys.sparkMat.opacity = 0.88 * fireLevel;
    const sparkScroll = elapsed * 3.0;
    for (let i = 0; i < SPARKS_PER_MOUNT; i++) {
      const sp = sys.sparkSeeds[i];
      const mz = sys.activeMissileZ[sp.missileIdx];
      const idx = i * 3;
      if (mz > 0.7 && mz < MISSILE_RANGE - 0.1) {
        const tf = (sp.trailFrac + sparkScroll) % 1.0;
        const maxWake = Math.min(5.2, mz - 0.55);
        const pz = Math.max(0.05, (mz - 0.60) - tf * maxWake);
        const spread = sp.rad * (0.45 + 1.65 * tf);
        const ang = sp.ang + elapsed * 4.0;
        sys.sparkPosArr[idx] = Math.cos(ang) * spread + sp.drift * tf;
        sys.sparkPosArr[idx + 1] = Math.sin(ang) * spread;
        sys.sparkPosArr[idx + 2] = pz;
      } else {
        // Tuck sparks cleanly inside tip nozzle when missile is at terminal detonation
        sys.sparkPosArr[idx] = 0;
        sys.sparkPosArr[idx + 1] = 0;
        sys.sparkPosArr[idx + 2] = 0.02;
      }
    }
    sys.sparkPosAttr.needsUpdate = true;

    // Independent Barrel Recoil, Iris Opening, Muzzle Emissive & Dynamic Point Light
    const recoilDist = peakLaunchPulse * 0.095 * fireLevel;
    const openFactor = (0.35 + 0.65 * peakLaunchPulse) * fireLevel;
    applyMountAperturePose(sys.mount, openFactor, recoilDist);

    sys.mount.coreRadiatorMat.emissiveIntensity = 1.15 + (0.55 + 1.45 * peakLaunchPulse) * fireLevel;
    sys.mount.muzzleRingMat.emissiveIntensity = 1.25 + (0.70 + 1.80 * peakLaunchPulse) * fireLevel;
    sys.muzzleLight.intensity = (1.4 + 5.8 * peakLaunchPulse) * fireLevel;
  }

  function syncWeaponSystemState(sys, elapsed) {
    const active = Boolean(sys.visible) && sys.opacity > 0.005;
    const level = active ? sys.opacity : 0.0;

    if (active) {
      sys.missileAssembly.visible = true;
      layoutMountMissileSalvo(sys, elapsed, level);
    } else {
      sys.missileAssembly.visible = false;
      sys.missileAssembly.scale.setScalar(0.0001);
      sys.plumeUniforms.uIntensity.value = 0.0;
      sys.plumeCoreMat.opacity = 0.0;
      sys.muzzleFlareMat.opacity = 0.0;
      sys.launchRingMat.opacity = 0.0;
      sys.detCoreMat.opacity = 0.0;
      sys.detRingMat.opacity = 0.0;
      sys.detFlareMat.opacity = 0.0;
      sys.sparkMat.opacity = 0.0;
      sys.muzzleLight.intensity = 0.0;
      sys.mount.coreRadiatorMat.emissiveIntensity = 0.85;
      sys.mount.muzzleRingMat.emissiveIntensity = 0.78;
      applyMountAperturePose(sys.mount, 0.0, 0.0);
    }

    const anyActive = weaponSystems.some((w) => w.visible && w.opacity > 0.005);
    rootGroup.userData.missilesFiring = anyActive;
  }

  createWeaponDecalSystem(0); // Port (-X) Weapon Mount Decal & 28m Missile Salvo
  createWeaponDecalSystem(1); // Starboard (+X) Weapon Mount Decal & 28m Missile Salvo

  // ===========================================================================
  // 12. SEAMLESS 6.0s ANIMATION CONTROLLER
  // ===========================================================================
  const ambientPosAttr = ambientGeo.attributes.position;
  const ambientPosArr = ambientPosAttr.array;

  function update(dt, elapsed = 0) {
    _lastElapsed = elapsed;

    const cycleT = ((elapsed % duration) + duration) % duration;
    const normT = cycleT / duration;
    const cyclePhase = cycleT * OMEGA;
    const cyclePhase2 = cyclePhase * 2.0;

    let activeLoad = 0.0;
    for (let i = 0; i < weaponSystems.length; i++) {
      const w = weaponSystems[i];
      if (w.visible && w.opacity > 0.005) activeLoad += w.opacity * 0.5;
    }

    // 1. Zero-G Recon Scout Hover, Scanning Yaw/Roll Sway & Subtle Recoil Feedback
    const hoverY = Math.sin(cyclePhase) * 0.048;
    const swayZ = -activeLoad * 0.028 + Math.sin(cyclePhase * 12.0) * activeLoad * 0.006;
    bodyGroup.position.set(0, BASE_CENTER_Y + hoverY, swayZ);
    bodyGroup.rotation.y = Math.sin(cyclePhase) * 0.024;
    bodyGroup.rotation.z = Math.sin(cyclePhase2) * 0.022;
    bodyGroup.rotation.x = Math.sin(cyclePhase) * 0.016 - activeLoad * 0.010;

    // 2. Rotating Zenith 6-Petal Iris, Lateral Ribbed Drum & Sensor Gimbal Rings
    zenithIrisGroup.rotation.y = cyclePhase * 2.0;
    portDrumRotor.rotation.z = cyclePhase * 4.0;
    dishGimbalArc.rotation.z = Math.sin(cyclePhase) * 0.75;
    for (let i = 0; i < sensorOpticRings.length; i++) {
      sensorOpticRings[i].ring.rotation.z = cyclePhase * 2.0 * sensorOpticRings[i].speed;
    }

    // 3. Pulsing Crimson Optical Shader, Neon Glows & Rear Ion Thruster Cone
    coreOpticUniforms.uTime.value = elapsed;
    coreOpticUniforms.uWeaponLoad.value = activeLoad;
    redNeonGlowMat.emissiveIntensity = 1.25 + 0.35 * Math.sin(cyclePhase * 4.0) + activeLoad * 0.28;
    const rearPulse = 0.86 + 0.16 * Math.sin(cyclePhase * 6.0) + activeLoad * 0.18;
    rearPlumeMat.opacity = 0.36 + 0.14 * Math.sin(cyclePhase * 5.0) + activeLoad * 0.14;
    rearPlumeMesh.scale.set(1.0, 1.0, rearPulse);

    // 4. Ambient Crimson Thruster & Zenith Corona Micro-Particles (stays inside 2.80m footprint)
    for (let i = 0; i < ambientCount; i++) {
      const s = ambientSeeds[i];
      const f = (s.u + normT * s.speed) % 1.0;
      const a = s.ang + cyclePhase * 2.0;
      const idx = i * 3;
      if (s.lane === 0) {
        // Rear main thruster micro-wake
        const r = s.rad * (0.55 + 0.50 * f);
        ambientPosArr[idx] = Math.cos(a) * r;
        ambientPosArr[idx + 1] = -0.22 + Math.sin(a) * r;
        ambientPosArr[idx + 2] = -1.10 - f * 0.28;
      } else if (s.lane === 1) {
        // Port lower ribbed drum micro-glow
        const r = s.rad * 0.7;
        ambientPosArr[idx] = -1.12 - f * 0.22;
        ambientPosArr[idx + 1] = -0.52 + Math.cos(a) * r;
        ambientPosArr[idx + 2] = -0.44 + Math.sin(a) * r;
      } else {
        // Zenith crown corona
        const r = 0.10 + s.rad * 0.9;
        ambientPosArr[idx] = Math.cos(a) * r;
        ambientPosArr[idx + 1] = 1.24 + f * 0.14;
        ambientPosArr[idx + 2] = -0.26 + Math.sin(a) * r;
      }
    }
    ambientPosAttr.needsUpdate = true;

    // 5. Update Both Decal-Controlled 28.0m Twin Missile Weapon Systems
    for (let i = 0; i < weaponSystems.length; i++) {
      syncWeaponSystemState(weaponSystems[i], elapsed);
    }

    rootGroup.userData.cycleProgress = normT;
  }

  function reset() {
    bodyGroup.position.set(0, BASE_CENTER_Y, 0);
    bodyGroup.rotation.set(0, 0, 0);
    for (let i = 0; i < weaponSystems.length; i++) {
      syncWeaponSystemState(weaponSystems[i], 0);
    }
    update(0, 0);
  }

  function setPortWeaponEnabled(enabled) {
    weaponSystems[0].decalMesh.visible = Boolean(enabled);
  }

  function setStarboardWeaponEnabled(enabled) {
    weaponSystems[1].decalMesh.visible = Boolean(enabled);
  }

  function setWeaponsEnabled(enabled) {
    const val = Boolean(enabled);
    weaponSystems[0].decalMesh.visible = val;
    weaponSystems[1].decalMesh.visible = val;
  }

  function dispose() {
    trackedTextures.forEach((tex) => {
      try { tex.dispose(); } catch (_) {}
    });
    const disposedGeos = new Set();
    const disposedMats = new Set();
    rootGroup.traverse((child) => {
      if (child.geometry && !disposedGeos.has(child.geometry)) {
        disposedGeos.add(child.geometry);
        try { child.geometry.dispose(); } catch (_) {}
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m && !disposedMats.has(m)) {
            disposedMats.add(m);
            try { m.dispose(); } catch (_) {}
          }
        });
      }
    });
  }

  rootGroup.userData.decals = {
    missileStrikes: weaponSystems.map((w) => w.decalMesh),
    portWeapon: weaponSystems[0].decalMesh,
    starboardWeapon: weaponSystems[1].decalMesh
  };

  rootGroup.userData.weaponDecalNames = [...weaponDecalNames];
  rootGroup.userData.weaponDecalMeshes = weaponSystems.map((w) => w.decalMesh);

  rootGroup.userData.reconDrone = {
    metadata,
    weaponDecalNames: [...weaponDecalNames],
    weaponDecalMeshes: weaponSystems.map((w) => w.decalMesh),
    update,
    reset,
    dispose,
    setWeaponsEnabled,
    setPortWeaponEnabled,
    setStarboardWeaponEnabled,
    weaponMountTips: {
      port: new T.Vector3(weaponMounts[0].tipPos.x, BASE_CENTER_Y + weaponMounts[0].tipPos.y, weaponMounts[0].tipPos.z),
      starboard: new T.Vector3(weaponMounts[1].tipPos.x, BASE_CENTER_Y + weaponMounts[1].tipPos.y, weaponMounts[1].tipPos.z)
    },
    missileRange: MISSILE_RANGE,
    dimensions: { width: TARGET_WIDTH, height: TARGET_HEIGHT, depth: TARGET_LENGTH }
  };

  return {
    object: rootGroup,
    duration,
    preserveScale,
    metadata,
    update,
    reset,
    dispose
  };
}

export default function createProcedural(api = {}) {
  return createReconDrone(api);
}
