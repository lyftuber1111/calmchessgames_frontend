/**
 * Procedural Sci-Fi Enemy: Singularity Guardian (Stage 3 - Singularity Core)
 * Ancient anomaly automaton defending the singularity core.
 * Features:
 *  - Heavy dense interlocking ancient armor matrix with procedural PBR textures & etched runes
 *  - Multi-axis counter-rotating astrolabe containment rings & graviton anomaly vortex
 *  - Abyssal GLSL event-horizon singularity core suspended at the exact center (0, 1.90, 0)
 *  - High-energy 28.0m central point singularity laser weapon firing from the core along +Z
 *  - Exact physical bounding dimensions: 3.80m (W) x 3.80m (H) x 3.80m (L)
 *  - Exact oval / circular cross-section circumference: 11.94m (pi * 3.80m = 11.938m)
 *
 * Compatible with meshy_test_0 Procedural JS Loader & Player and Three.js r160+ ES Modules.
 */
import * as THREE from 'three';

export const duration = 6.0; // Seamless 6.0s combat loop
export const preserveScale = true; // Preserve true 1:1 physical meter specs (3.80m cube / 11.94m oval circumference)
export const weaponDecalName = 'Decal_LaserBurn_Central_Weapon'; // Controlled as a decal by meshy_test_0/index.html

const TARGET_SIZE = 3.80;
const HALF_EXTENT = TARGET_SIZE * 0.5; // 1.90m
const LASER_LENGTH = 28.0; // Exact 28.0m central point singularity laser beam along +Z

export const metadata = {
  id: 'singularity_guardian',
  name: 'Singularity Guardian',
  stage: 3,
  stageSlug: 'singularity_core',
  classification: 'Ancient Anomaly Automaton',
  weaponDecalName,
  dimensions: {
    width: 3.80,
    height: 3.80,
    depth: 3.80
  },
  circumferenceOval: 11.94,
  laserOrigin: { x: 0, y: 1.90, z: 0 },
  laserDirection: { x: 0, y: 0, z: 1 },
  laserLength: LASER_LENGTH
};

/**
 * Deterministic PRNG so procedural geometry & textures are 100% reproducible.
 */
function createSeededRandom(seed = 3801194) {
  let s = seed >>> 0;
  return function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Generates procedural PBR CanvasTextures (albedo, bump, roughness, emissive runes)
 * calibrated to read crisply under both studio directional lighting and HDRI environments.
 */
function createArmorTextureSet() {
  if (typeof document === 'undefined') {
    return { albedo: null, bump: null, roughness: null, emissive: null, textures: [] };
  }

  const size = 512;
  const rand = createSeededRandom(90421);

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

  // 1. Base forged titanium-obsidian steel tone (calibrated for directional PBR visibility)
  const baseGrad = aCtx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#3e4259');
  baseGrad.addColorStop(0.5, '#525774');
  baseGrad.addColorStop(1, '#34384e');
  aCtx.fillStyle = baseGrad;
  aCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#848484';
  rCtx.fillRect(0, 0, size, size);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  // 2. Micro brushed-alloy wear striations & forged ancient steel grain
  for (let i = 0; i < 720; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 18 + rand() * 82;
    const alpha = 0.05 + rand() * 0.08;
    aCtx.strokeStyle = rand() > 0.45 ? `rgba(186, 194, 232, ${alpha})` : `rgba(18, 20, 34, ${alpha * 1.3})`;
    aCtx.lineWidth = 1.2;
    aCtx.beginPath();
    aCtx.moveTo(x, y);
    aCtx.lineTo(x + len, y + (rand() - 0.5) * 2.5);
    aCtx.stroke();

    rCtx.strokeStyle = rand() > 0.5 ? `rgba(170, 170, 170, ${alpha * 1.8})` : `rgba(65, 65, 65, ${alpha * 1.8})`;
    rCtx.beginPath();
    rCtx.moveTo(x, y);
    rCtx.lineTo(x + len, y);
    rCtx.stroke();
  }

  // 3. Heavy Dense Armor Matrix Panel Seams (beveled octagonal armor slabs + edge wear highlights)
  const drawArmorCell = (x, y, w, h, bevel = 14) => {
    const traceOct = (ctx, pad) => {
      const px = x + pad;
      const py = y + pad;
      const pw = w - pad * 2;
      const ph = h - pad * 2;
      const bv = Math.max(4, bevel - pad * 0.4);
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

    // Deep recessed armored trench
    traceOct(aCtx, 2);
    aCtx.fillStyle = '#1b1d2c';
    aCtx.fill();

    // Raised dense steel armor tile with metallic specular highlight border
    traceOct(aCtx, 7);
    const baseR = Math.floor(66 + rand() * 20);
    const baseG = Math.floor(70 + rand() * 20);
    const baseB = Math.floor(96 + rand() * 24);
    const cellGrad = aCtx.createLinearGradient(x, y, x + w, y + h);
    cellGrad.addColorStop(0, `rgb(${baseR + 18}, ${baseG + 18}, ${baseB + 22})`);
    cellGrad.addColorStop(0.55, `rgb(${baseR}, ${baseG}, ${baseB})`);
    cellGrad.addColorStop(1, `rgb(${baseR - 14}, ${baseG - 14}, ${baseB - 12})`);
    aCtx.fillStyle = cellGrad;
    aCtx.fill();

    // Crisp worn metallic-bronze chamfer highlight along perimeter
    aCtx.strokeStyle = 'rgba(216, 184, 122, 0.58)';
    aCtx.lineWidth = 2.5;
    aCtx.stroke();

    // Inner step seam
    traceOct(aCtx, 15);
    aCtx.strokeStyle = 'rgba(20, 22, 36, 0.55)';
    aCtx.lineWidth = 1.5;
    aCtx.stroke();

    // Bump map height relief
    traceOct(bCtx, 2);
    bCtx.fillStyle = '#181818';
    bCtx.fill();
    traceOct(bCtx, 8);
    bCtx.fillStyle = '#d4d4d4';
    bCtx.fill();
    bCtx.strokeStyle = '#ffffff';
    bCtx.lineWidth = 2.5;
    bCtx.stroke();

    // Roughness contrast (polished chamfer edges, satin armor face)
    traceOct(rCtx, 8);
    rCtx.fillStyle = '#8e8e8e';
    rCtx.fill();
    rCtx.strokeStyle = '#383838';
    rCtx.lineWidth = 3.5;
    rCtx.stroke();

    // Corner armor bolts / rivets
    const inset = 20;
    const rivets = [
      [x + inset, y + inset],
      [x + w - inset, y + inset],
      [x + inset, y + h - inset],
      [x + w - inset, y + h - inset]
    ];
    for (const [rx, ry] of rivets) {
      aCtx.fillStyle = '#b99c6b';
      aCtx.beginPath();
      aCtx.arc(rx, ry, 3.8, 0, Math.PI * 2);
      aCtx.fill();
      bCtx.fillStyle = '#ffffff';
      bCtx.beginPath();
      bCtx.arc(rx, ry, 3.8, 0, Math.PI * 2);
      bCtx.fill();
    }
  };

  // Symmetrical dense interlocking armor tiles (cleanly maps onto 0..1 plate UVs)
  drawArmorCell(0, 0, 256, 256, 22);
  drawArmorCell(256, 0, 256, 256, 22);
  drawArmorCell(0, 256, 256, 256, 22);
  drawArmorCell(256, 256, 256, 256, 22);

  // Central overlapping keystone reactive plate
  drawArmorCell(156, 156, 200, 200, 24);

  // 4. Ancient Geometric Anomaly Runes & Glowing Singularity Conduit Seams
  const drawAncientGlyph = (cx, cy, r) => {
    eCtx.save();
    eCtx.translate(cx, cy);
    eCtx.strokeStyle = '#a855f7';
    eCtx.lineWidth = 2.8;
    eCtx.shadowColor = '#c084fc';
    eCtx.shadowBlur = 7;

    eCtx.beginPath();
    eCtx.arc(0, 0, r, 0, Math.PI * 2);
    eCtx.stroke();

    eCtx.strokeStyle = '#d8b4fe';
    eCtx.lineWidth = 1.6;
    eCtx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const px = Math.cos(ang) * r * 0.72;
      const py = Math.sin(ang) * r * 0.72;
      if (i === 0) eCtx.moveTo(px, py);
      else eCtx.lineTo(px, py);
    }
    eCtx.closePath();
    eCtx.stroke();

    eCtx.fillStyle = '#38bdf8';
    eCtx.beginPath();
    eCtx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    eCtx.fill();

    // Etch carved groove into bump map
    bCtx.save();
    bCtx.translate(cx, cy);
    bCtx.strokeStyle = '#101010';
    bCtx.lineWidth = 3.2;
    bCtx.beginPath();
    bCtx.arc(0, 0, r, 0, Math.PI * 2);
    bCtx.stroke();
    bCtx.restore();

    eCtx.restore();
  };

  drawAncientGlyph(256, 256, 46);
  drawAncientGlyph(104, 104, 24);
  drawAncientGlyph(408, 104, 24);
  drawAncientGlyph(104, 408, 24);
  drawAncientGlyph(408, 408, 24);

  // Fine recessed glowing energy conduit seams
  eCtx.strokeStyle = 'rgba(168, 85, 247, 0.72)';
  eCtx.lineWidth = 2.5;
  eCtx.beginPath();
  eCtx.moveTo(256, 0);
  eCtx.lineTo(256, 156);
  eCtx.moveTo(256, 356);
  eCtx.lineTo(256, 512);
  eCtx.moveTo(0, 256);
  eCtx.lineTo(156, 256);
  eCtx.moveTo(356, 256);
  eCtx.lineTo(512, 256);
  eCtx.stroke();

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

  const albedo = configureTex(albedoCanvas, 'singularity_guardian_armor_albedo.png', true);
  const bump = configureTex(bumpCanvas, 'singularity_guardian_armor_bump.png', false);
  const roughness = configureTex(roughCanvas, 'singularity_guardian_armor_roughness.png', false);
  const emissive = configureTex(emissiveCanvas, 'singularity_guardian_rune_emissive.png', true);

  return {
    albedo,
    bump,
    roughness,
    emissive,
    textures: [albedo, bump, roughness, emissive]
  };
}

/**
 * Generates a soft radial star-bloom flare CanvasTexture for central laser core & muzzle.
 */
function createStarFlareTexture() {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size * 0.5;
  const cy = size * 0.5;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 195, 248, 0.92)');
  grad.addColorStop(0.42, 'rgba(168, 85, 247, 0.52)');
  grad.addColorStop(0.72, 'rgba(255, 34, 85, 0.16)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI * 0.5);
    const rayGrad = ctx.createLinearGradient(0, 0, cx, 0);
    rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    rayGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.35)');
    rayGrad.addColorStop(1, 'rgba(192, 132, 252, 0.0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(cx, 0);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.name = 'singularity_central_flare.png';
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft glowing orb sprite texture for gravitational vortex particles (no square pixels!).
 */
function createParticleOrbTexture() {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size * 0.5;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.35, 'rgba(235, 210, 255, 0.85)');
  grad.addColorStop(0.70, 'rgba(168, 85, 247, 0.30)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.name = 'singularity_vortex_particle_orb.png';
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Normalizes ExtrudeGeometry UVs onto [0, 1] using XY planar projection so armor tiles & runes align cleanly.
 */
function normalizePlateUVs(geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const dx = Math.max(0.001, bb.max.x - bb.min.x);
  const dy = Math.max(0.001, bb.max.y - bb.min.y);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  if (!pos || !uv) return geo;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - bb.min.x) / dx;
    const v = (pos.getY(i) - bb.min.y) / dy;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Helper to create a beveled octagonal heavy armor slab with clean normalized UVs.
 */
function createBeveledArmorPlateGeometry(width, height, depth, chamfer = 0.12, bevel = 0.032) {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const c = Math.min(chamfer, hw * 0.45, hh * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, -hh);
  shape.lineTo(hw - c, -hh);
  shape.lineTo(hw, -hh + c);
  shape.lineTo(hw, hh - c);
  shape.lineTo(hw - c, hh);
  shape.lineTo(-hw + c, hh);
  shape.lineTo(-hw, hh - c);
  shape.lineTo(-hw, -hh + c);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 2,
    curveSegments: 4
  });
  geo.center();
  return normalizePlateUVs(geo);
}

/**
 * Helper to create a sculpted armored blast-petal mandible framing the central laser iris.
 */
function createApertureMandibleGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.27, 0.0);
  shape.lineTo(0.27, 0.0);
  shape.lineTo(0.20, 0.38);
  shape.lineTo(0.09, 0.56);
  shape.lineTo(-0.09, 0.56);
  shape.lineTo(-0.20, 0.38);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.034,
    bevelSize: 0.028,
    bevelSegments: 2
  });
  geo.translate(0, 0, -0.11);
  return normalizePlateUVs(geo);
}

/**
 * Builds the Singularity Guardian procedural 3D enemy automaton and animation controller.
 */
export function createSingularityGuardian(api = {}) {
  const T = (api && api.THREE) ? api.THREE : THREE;
  const rand = createSeededRandom(380380);

  const trackedTextures = [];
  const texSet = createArmorTextureSet();
  trackedTextures.push(...texSet.textures);
  const flareTex = createStarFlareTexture();
  if (flareTex) trackedTextures.push(flareTex);
  const orbTex = createParticleOrbTexture();
  if (orbTex) trackedTextures.push(orbTex);

  // ===========================================================================
  // PBR & CUSTOM GLSL MATERIALS (Calibrated for rich metallic relief under studio lights)
  // ===========================================================================
  const heavyArmorMat = new T.MeshStandardMaterial({
    name: 'ArmorMatrix_HeavyObsidianSteel',
    color: 0x7b82a6,
    map: texSet.albedo,
    bumpMap: texSet.bump,
    bumpScale: 0.055,
    roughnessMap: texSet.roughness,
    emissive: 0x7c3aed,
    emissiveMap: texSet.emissive,
    emissiveIntensity: 0.72,
    metalness: 0.48,
    roughness: 0.42
  });

  const darkUnderChassisMat = new T.MeshStandardMaterial({
    name: 'ArmorMatrix_AbyssalChassis',
    color: 0x2e3147,
    bumpMap: texSet.bump,
    bumpScale: 0.035,
    metalness: 0.54,
    roughness: 0.48
  });

  const reactivePlateMat = new T.MeshStandardMaterial({
    name: 'ArmorMatrix_ReactiveCarapace',
    color: 0x62698c,
    map: texSet.albedo,
    bumpMap: texSet.bump,
    bumpScale: 0.065,
    emissive: 0x6d28d9,
    emissiveMap: texSet.emissive,
    emissiveIntensity: 0.48,
    metalness: 0.52,
    roughness: 0.36
  });

  const ancientBronzeMat = new T.MeshStandardMaterial({
    name: 'AncientAnomaly_GildedBronze',
    color: 0xd6b16c,
    emissive: 0x3b290c,
    emissiveIntensity: 0.32,
    metalness: 0.62,
    roughness: 0.32
  });

  const violetConduitMat = new T.MeshStandardMaterial({
    name: 'AnomalyConduit_VoidViolet',
    color: 0xd8b4fe,
    emissive: 0xa855f7,
    emissiveIntensity: 1.75,
    metalness: 0.20,
    roughness: 0.16
  });

  const crimsonApertureRailMat = new T.MeshStandardMaterial({
    name: 'CentralEmitter_PlasmaRail',
    color: 0xff70a6,
    emissive: 0xff2255,
    emissiveIntensity: 1.55,
    metalness: 0.25,
    roughness: 0.18
  });

  const prismCrystalMat = new T.MeshStandardMaterial({
    name: 'CentralCollimator_FocusingPrism',
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 1.5,
    metalness: 0.25,
    roughness: 0.12,
    transparent: true,
    opacity: 0.90
  });

  // Custom GLSL Event-Horizon Singularity Core Shader
  const coreUniforms = {
    uTime: { value: 0.0 },
    uCharge: { value: 0.0 },
    uFire: { value: 0.0 }
  };
  const singularityCoreMat = new T.ShaderMaterial({
    name: 'SingularityCore_EventHorizonShader',
    uniforms: coreUniforms,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      uniform float uTime;
      uniform float uCharge;
      uniform float uFire;
      void main() {
        vLocalPos = position;
        float warp = sin(position.x * 12.0 + uTime * 5.0) * cos(position.y * 12.0 - uTime * 4.0) * (0.008 + uCharge * 0.016 + uFire * 0.02);
        vec3 displaced = position + normal * warp;
        vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      uniform float uTime;
      uniform float uCharge;
      uniform float uFire;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main() {
        float ndotv = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float rim = pow(1.0 - ndotv, 2.3);
        float innerRim = pow(1.0 - ndotv, 4.6);

        float swirl = sin(atan(vLocalPos.y, vLocalPos.x) * 6.0 + vLocalPos.z * 14.0 - uTime * 7.0) * 0.5 + 0.5;
        float shimmer = 0.72 + 0.28 * sin(uTime * 16.0 + hash(floor(vLocalPos * 18.0)) * 6.28);

        vec3 voidAbyss = vec3(0.01, 0.004, 0.025);
        vec3 violetCorona = vec3(0.66, 0.33, 0.97);
        vec3 magentaHot = vec3(1.0, 0.15, 0.42);
        vec3 whiteCore = vec3(1.0, 0.94, 1.0);

        // Preserve stark black singularity eye in center, igniting into blazing plasma when firing
        float centerBlackMask = smoothstep(0.55, 0.92, ndotv);
        float ignite = clamp(uCharge * 0.45 + uFire * 1.15, 0.0, 1.0);
        vec3 coreTone = mix(voidAbyss, mix(magentaHot, whiteCore, uFire * 0.85), ignite * 0.82 * (1.0 - centerBlackMask * (1.0 - uFire)));
        vec3 limbTone = mix(violetCorona, magentaHot, clamp(swirl * 0.55 + uCharge * 0.5 + uFire * 0.7, 0.0, 1.0));

        vec3 col = coreTone + limbTone * rim * (1.8 + uCharge * 1.2 + uFire * 1.7) * shimmer;
        col += whiteCore * innerRim * (0.95 + uFire * 1.45);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  // Custom GLSL Central Laser Plasma Disruptor Sheath Shader
  const laserUniforms = {
    uTime: { value: 0.0 },
    uIntensity: { value: 0.0 }
  };
  const laserSheathMat = new T.ShaderMaterial({
    name: 'SingularityLaser_PlasmaSheathShader',
    uniforms: laserUniforms,
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    side: T.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform float uTime;
      uniform float uIntensity;
      void main() {
        vUv = uv;
        float pulse = sin(uv.y * 72.0 - uTime * 36.0) * 0.022 * uIntensity;
        vec3 pos = position + normal * pulse;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
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
        float coreMask = pow(ndotv, 1.4);
        float edgeGlow = pow(1.0 - ndotv, 1.8);

        float helixA = sin(vUv.x * 18.84955 + vUv.y * 104.0 - uTime * 32.0) * 0.5 + 0.5;
        float helixB = sin(-vUv.x * 12.56637 + vUv.y * 156.0 - uTime * 46.0) * 0.5 + 0.5;
        float surge = 0.72 + 0.28 * sin(vUv.y * 60.0 - uTime * 24.0);
        float streaks = pow(helixA * 0.6 + helixB * 0.4, 2.0);

        float tipFade = smoothstep(1.0, 0.94, vUv.y);
        float baseBoost = smoothstep(0.0, 0.03, vUv.y) * 0.35 + 0.65;

        vec3 violet = vec3(0.66, 0.30, 1.0);
        vec3 crimson = vec3(1.0, 0.14, 0.40);
        vec3 cyan = vec3(0.22, 0.82, 1.0);
        vec3 hotWhite = vec3(1.0, 0.96, 1.0);

        vec3 col = mix(violet, crimson, streaks * 0.75 + coreMask * 0.25);
        col = mix(col, cyan, edgeGlow * 0.45 * helixB);
        col += hotWhite * coreMask * (0.55 + streaks * 0.65);
        col *= surge * baseBoost;

        float alpha = clamp((coreMask * 0.82 + streaks * 0.55 + edgeGlow * 0.35) * tipFade * uIntensity, 0.0, 0.96);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  // ===========================================================================
  // ROOT HIERARCHY
  // ===========================================================================
  const rootGroup = new T.Group();
  rootGroup.name = 'SingularityGuardian_Root';

  const bodyGroup = new T.Group();
  bodyGroup.name = 'SingularityGuardian_Body';
  bodyGroup.position.set(0, HALF_EXTENT, 0);
  rootGroup.add(bodyGroup);

  const hullEnvelopeGroup = new T.Group();
  hullEnvelopeGroup.name = 'DenseArmorMatrix_Envelope';
  bodyGroup.add(hullEnvelopeGroup);

  // ===========================================================================
  // 1. INNER HOLLOW ARMORED MANTLE (Curved Spherical Core with +Z Central Bore)
  // ===========================================================================
  const mantleProfile = [
    new T.Vector2(0.42, -1.42),
    new T.Vector2(0.86, -1.24),
    new T.Vector2(1.24, -0.84),
    new T.Vector2(1.42, -0.28),
    new T.Vector2(1.44, 0.28),
    new T.Vector2(1.26, 0.84),
    new T.Vector2(0.92, 1.24),
    new T.Vector2(0.68, 1.38),
    new T.Vector2(0.56, 1.12),
    new T.Vector2(0.76, 0.68),
    new T.Vector2(0.96, 0.00),
    new T.Vector2(0.78, -0.78),
    new T.Vector2(0.42, -1.16),
    new T.Vector2(0.42, -1.42)
  ];
  const mantleGeo = new T.LatheGeometry(mantleProfile, 32);
  mantleGeo.rotateX(Math.PI * 0.5);
  const mantleMesh = new T.Mesh(mantleGeo, darkUnderChassisMat);
  mantleMesh.name = 'InnerArmoredMantle';
  hullEnvelopeGroup.add(mantleMesh);

  // Inner chamber conduit ribs lining the central firing cavity
  const conduitRibGeo = new T.BoxGeometry(0.055, 0.055, 1.12);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rib = new T.Mesh(conduitRibGeo, i % 2 === 0 ? violetConduitMat : ancientBronzeMat);
    rib.name = `InnerChamberRib_${i}`;
    rib.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.42);
    rib.rotation.z = a;
    hullEnvelopeGroup.add(rib);
  }

  // ===========================================================================
  // 2. HEAVY DENSE ARMOR MATRIX (8 Octant Bastions + Layered Reactive Carapace)
  // ===========================================================================
  const octantMainGeo = createBeveledArmorPlateGeometry(1.18, 1.06, 0.20, 0.24, 0.042);
  const octantSubUpperGeo = createBeveledArmorPlateGeometry(0.86, 0.44, 0.14, 0.12, 0.028);
  const octantSubLowerGeo = createBeveledArmorPlateGeometry(0.74, 0.36, 0.12, 0.10, 0.025);
  const octantSpineGeo = createBeveledArmorPlateGeometry(0.18, 0.96, 0.14, 0.05, 0.022);
  const octantRuneSlitGeo = new T.BoxGeometry(0.90, 0.042, 0.06);

  const breathingPlates = [];
  const octantSigns = [
    [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
    [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]
  ];

  octantSigns.forEach(([sx, sy, sz], idx) => {
    const dir = new T.Vector3(sx, sy, sz).normalize();
    const sectorGroup = new T.Group();
    sectorGroup.name = `ArmorBastion_Octant_${idx}`;

    const baseRadius = 1.46;
    sectorGroup.position.copy(dir).multiplyScalar(baseRadius);
    sectorGroup.lookAt(dir.clone().multiplyScalar(baseRadius * 2.5));

    const mainPlate = new T.Mesh(octantMainGeo, heavyArmorMat);
    mainPlate.name = `OctantMainCarapace_${idx}`;
    sectorGroup.add(mainPlate);

    const subTop = new T.Mesh(octantSubUpperGeo, reactivePlateMat);
    subTop.position.set(0, 0.23, 0.12);
    subTop.rotation.x = -0.14;
    sectorGroup.add(subTop);

    const subBot = new T.Mesh(octantSubLowerGeo, reactivePlateMat);
    subBot.position.set(0, -0.26, 0.11);
    subBot.rotation.x = 0.14;
    sectorGroup.add(subBot);

    const spine = new T.Mesh(octantSpineGeo, ancientBronzeMat);
    spine.position.set(0, 0, 0.16);
    sectorGroup.add(spine);

    const slit = new T.Mesh(octantRuneSlitGeo, violetConduitMat);
    slit.position.set(0, -0.02, 0.115);
    sectorGroup.add(slit);

    hullEnvelopeGroup.add(sectorGroup);
    breathingPlates.push({
      group: sectorGroup,
      dir: dir.clone(),
      baseRadius,
      phase: idx * (Math.PI * 0.25),
      amplitude: 0.022
    });
  });

  // ===========================================================================
  // 3. INTERLOCKING MERIDIAN & EQUATORIAL ARMOR MATRIX RIBS
  // ===========================================================================
  const ribStrutGeo = createBeveledArmorPlateGeometry(0.48, 0.74, 0.18, 0.10, 0.028);
  const ribTrimGeo = new T.BoxGeometry(0.10, 0.64, 0.20);
  const midTileGeo = createBeveledArmorPlateGeometry(0.56, 0.44, 0.16, 0.10, 0.026);
  const midCapGeo = createBeveledArmorPlateGeometry(0.34, 0.24, 0.09, 0.06, 0.018);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dx = Math.sin(angle);
    const dz = Math.cos(angle);
    if (dz > 0.82) continue;

    const dir = new T.Vector3(dx, 0, dz).normalize();
    const beltNode = new T.Group();
    beltNode.name = `EquatorialArmorBlock_${i}`;
    const r = 1.54;
    beltNode.position.copy(dir).multiplyScalar(r);
    beltNode.lookAt(dir.clone().multiplyScalar(r * 2.5));

    beltNode.add(new T.Mesh(ribStrutGeo, heavyArmorMat));

    const trim = new T.Mesh(ribTrimGeo, i % 2 === 0 ? ancientBronzeMat : darkUnderChassisMat);
    trim.position.z = 0.04;
    beltNode.add(trim);

    const vent = new T.Mesh(new T.BoxGeometry(0.32, 0.042, 0.19), violetConduitMat);
    vent.position.set(0, 0.18, 0.02);
    beltNode.add(vent);

    const vent2 = new T.Mesh(new T.BoxGeometry(0.32, 0.042, 0.19), violetConduitMat);
    vent2.position.set(0, -0.18, 0.02);
    beltNode.add(vent2);

    hullEnvelopeGroup.add(beltNode);
  }

  const latAngles = [0.62, -0.62];
  latAngles.forEach((lat, bandIdx) => {
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    for (let j = 0; j < 10; j++) {
      const lon = (j / 10) * Math.PI * 2 + (bandIdx === 0 ? 0.15 : -0.15);
      const dx = Math.sin(lon) * cosLat;
      const dy = sinLat;
      const dz = Math.cos(lon) * cosLat;
      if (dz > 0.72) continue;

      const dir = new T.Vector3(dx, dy, dz).normalize();
      const tileGroup = new T.Group();
      tileGroup.name = `ReactiveMatrixTile_B${bandIdx}_${j}`;
      const r = 1.58;
      tileGroup.position.copy(dir).multiplyScalar(r);
      tileGroup.lookAt(dir.clone().multiplyScalar(r * 2.5));

      tileGroup.add(new T.Mesh(midTileGeo, reactivePlateMat));

      const cap = new T.Mesh(midCapGeo, j % 2 === 0 ? heavyArmorMat : ancientBronzeMat);
      cap.position.z = 0.09;
      tileGroup.add(cap);

      hullEnvelopeGroup.add(tileGroup);
      breathingPlates.push({
        group: tileGroup,
        dir: dir.clone(),
        baseRadius: r,
        phase: lon + bandIdx * Math.PI,
        amplitude: 0.016
      });
    }
  });

  // ===========================================================================
  // 4. SIX CARDINAL FORTRESS BULWARKS (Exact +/- 1.90m Envelope Anchors)
  // ===========================================================================
  const flankOuterGeo = createBeveledArmorPlateGeometry(1.16, 1.38, 0.22, 0.28, 0.04);
  const flankMidGeo = createBeveledArmorPlateGeometry(0.84, 1.02, 0.18, 0.20, 0.032);
  const flankFinGeo = createBeveledArmorPlateGeometry(0.28, 0.88, 0.14, 0.08, 0.022);

  [-1, 1].forEach((side) => {
    const flank = new T.Group();
    flank.name = side < 0 ? 'CardinalBulwark_Port_NegX' : 'CardinalBulwark_Starboard_PosX';
    flank.position.set(side * 1.58, 0, 0);
    flank.rotation.y = side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;

    flank.add(new T.Mesh(flankOuterGeo, heavyArmorMat));

    const midShield = new T.Mesh(flankMidGeo, reactivePlateMat);
    midShield.position.z = 0.12;
    flank.add(midShield);

    const outerCrest = new T.Mesh(flankFinGeo, ancientBronzeMat);
    outerCrest.position.z = 0.23;
    flank.add(outerCrest);

    for (let k = -2; k <= 2; k++) {
      const louver = new T.Mesh(new T.BoxGeometry(0.76, 0.055, 0.08), k === 0 ? violetConduitMat : darkUnderChassisMat);
      louver.position.set(0, k * 0.17, 0.18);
      flank.add(louver);
    }

    hullEnvelopeGroup.add(flank);
  });

  const poleBaseGeo = createBeveledArmorPlateGeometry(1.26, 1.26, 0.20, 0.34, 0.04);
  const poleTier2Geo = createBeveledArmorPlateGeometry(0.88, 0.88, 0.18, 0.24, 0.035);
  const poleApexGeo = createBeveledArmorPlateGeometry(0.48, 0.48, 0.14, 0.14, 0.025);

  [-1, 1].forEach((pole) => {
    const cap = new T.Group();
    cap.name = pole > 0 ? 'CardinalBulwark_Crown_PosY' : 'CardinalBulwark_Nadir_NegY';
    cap.position.set(0, pole * 1.52, 0);
    cap.rotation.x = pole > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

    cap.add(new T.Mesh(poleBaseGeo, heavyArmorMat));

    const tier2 = new T.Mesh(poleTier2Geo, reactivePlateMat);
    tier2.position.z = 0.15;
    cap.add(tier2);

    const tier3 = new T.Mesh(poleApexGeo, ancientBronzeMat);
    tier3.position.z = 0.29;
    cap.add(tier3);

    for (let p = 0; p < 4; p++) {
      const ang = (p / 4) * Math.PI * 2 + Math.PI * 0.25;
      const prong = new T.Mesh(new T.BoxGeometry(0.14, 0.42, 0.16), p % 2 === 0 ? ancientBronzeMat : heavyArmorMat);
      prong.position.set(Math.cos(ang) * 0.52, Math.sin(ang) * 0.52, 0.14);
      prong.rotation.z = ang - Math.PI * 0.5;
      cap.add(prong);
    }

    const runeRing = new T.Mesh(new T.TorusGeometry(0.56, 0.026, 10, 32), violetConduitMat);
    runeRing.position.z = 0.16;
    cap.add(runeRing);

    hullEnvelopeGroup.add(cap);
  });

  // Rear (-Z) Singularity Reactor Aegis Shield
  const rearAegis = new T.Group();
  rearAegis.name = 'CardinalBulwark_RearAegis_NegZ';
  rearAegis.position.set(0, 0, -1.52);
  rearAegis.rotation.y = Math.PI;

  rearAegis.add(new T.Mesh(createBeveledArmorPlateGeometry(1.38, 1.38, 0.22, 0.36, 0.042), heavyArmorMat));
  const rearPlate2 = new T.Mesh(createBeveledArmorPlateGeometry(0.94, 0.94, 0.18, 0.26, 0.032), reactivePlateMat);
  rearPlate2.position.z = 0.15;
  rearAegis.add(rearPlate2);
  const rearSpineCap = new T.Mesh(createBeveledArmorPlateGeometry(0.54, 0.54, 0.14, 0.15, 0.025), ancientBronzeMat);
  rearSpineCap.position.z = 0.29;
  rearAegis.add(rearSpineCap);
  const rearVentRing = new T.Mesh(new T.TorusGeometry(0.62, 0.030, 12, 32), violetConduitMat);
  rearVentRing.position.z = 0.13;
  rearAegis.add(rearVentRing);
  hullEnvelopeGroup.add(rearAegis);

  // Forward (+Z) Heavy Armored Laser Aperture Collar & 8 Articulated Blast-Petal Mandibles
  const apertureCollarGroup = new T.Group();
  apertureCollarGroup.name = 'CentralLaserAperture_Collar';
  hullEnvelopeGroup.add(apertureCollarGroup);

  const bezelOuter = new T.Mesh(new T.TorusGeometry(1.06, 0.17, 12, 8), heavyArmorMat);
  bezelOuter.position.z = 1.28;
  bezelOuter.rotation.z = Math.PI / 8;
  apertureCollarGroup.add(bezelOuter);

  const bezelBronzeTrim = new T.Mesh(new T.TorusGeometry(0.87, 0.068, 12, 16), ancientBronzeMat);
  bezelBronzeTrim.position.z = 1.43;
  apertureCollarGroup.add(bezelBronzeTrim);

  // Recessed razor-thin glowing plasma collimator ring inside the bronze rim
  const bezelPlasmaRing = new T.Mesh(new T.TorusGeometry(0.78, 0.022, 12, 40), crimsonApertureRailMat);
  bezelPlasmaRing.position.z = 1.40;
  apertureCollarGroup.add(bezelPlasmaRing);

  // 8 Heavy Sculpted Blast-Petal Mandibles cradling forward around the central laser bore
  const mandibleGeo = createApertureMandibleGeometry();
  const mandibleRailGeo = new T.BoxGeometry(0.055, 0.42, 0.09);
  const mandibleCrestGeo = new T.BoxGeometry(0.11, 0.46, 0.08);
  const fangGeo = createBeveledArmorPlateGeometry(0.20, 0.28, 0.34, 0.05, 0.022);
  const mandibles = [];

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const pivot = new T.Group();
    pivot.name = `ApertureMandiblePivot_${i}`;
    pivot.rotation.z = angle;

    const jaw = new T.Group();
    jaw.name = `ApertureMandibleJaw_${i}`;
    // Positioned cleanly on outer collar, pitched inward toward +Z bore like heavy armored fangs
    jaw.position.set(0, 0.88, 1.38);
    jaw.rotation.x = 0.56; // Tilts tips forward (+Z) and slightly inward to cradle the laser bore

    jaw.add(new T.Mesh(mandibleGeo, i % 2 === 0 ? heavyArmorMat : reactivePlateMat));

    const bronzeCrest = new T.Mesh(mandibleCrestGeo, ancientBronzeMat);
    bronzeCrest.position.set(0, 0.28, 0.14);
    jaw.add(bronzeCrest);

    const plasmaRail = new T.Mesh(mandibleRailGeo, crimsonApertureRailMat);
    plasmaRail.position.set(0, 0.26, -0.13);
    jaw.add(plasmaRail);

    const fang = new T.Mesh(fangGeo, darkUnderChassisMat);
    fang.position.set(0, 0.34, 0.16);
    jaw.add(fang);

    pivot.add(jaw);
    apertureCollarGroup.add(pivot);
    mandibles.push({
      jaw,
      baseY: 0.88,
      baseZ: 1.38,
      baseRotX: 0.56
    });
  }

  // ===========================================================================
  // 5. EXACT ANALYTICAL CALIBRATION -> 3.80m x 3.80m x 3.80m (Oval 11.94m)
  // ===========================================================================
  hullEnvelopeGroup.updateMatrixWorld(true);
  const rawHullBox = new T.Box3().setFromObject(hullEnvelopeGroup);
  const rawHullSize = rawHullBox.getSize(new T.Vector3());
  const rawHullCenter = rawHullBox.getCenter(new T.Vector3());

  const sxCal = rawHullSize.x > 0.001 ? (TARGET_SIZE / rawHullSize.x) : 1.0;
  const syCal = rawHullSize.y > 0.001 ? (TARGET_SIZE / rawHullSize.y) : 1.0;
  const szCal = rawHullSize.z > 0.001 ? (TARGET_SIZE / rawHullSize.z) : 1.0;

  hullEnvelopeGroup.scale.set(sxCal, syCal, szCal);
  hullEnvelopeGroup.position.set(
    -rawHullCenter.x * sxCal,
    -rawHullCenter.y * syCal,
    -rawHullCenter.z * szCal
  );

  // ===========================================================================
  // 6. COUNTER-ROTATING ANCIENT ASTROLABE CONTAINMENT RINGS (Inside r <= 1.25m)
  // ===========================================================================
  const containmentGroup = new T.Group();
  containmentGroup.name = 'AncientAstrolabe_ContainmentRings';
  bodyGroup.add(containmentGroup);

  const buildAstrolabeRing = (radius, tube, notches, mat, accentMat, name) => {
    const g = new T.Group();
    g.name = name;
    g.add(new T.Mesh(new T.TorusGeometry(radius, tube, 12, 48), mat));

    const notchGeo = new T.BoxGeometry(tube * 2.2, tube * 3.1, tube * 2.4);
    for (let i = 0; i < notches; i++) {
      const a = (i / notches) * Math.PI * 2;
      const n = new T.Mesh(notchGeo, i % 2 === 0 ? accentMat : violetConduitMat);
      n.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      n.rotation.z = a;
      g.add(n);
    }
    return g;
  };

  const innerAstrolabe = buildAstrolabeRing(0.60, 0.028, 8, ancientBronzeMat, heavyArmorMat, 'AstrolabeRing_Inner');
  const midAstrolabe = buildAstrolabeRing(0.76, 0.034, 12, heavyArmorMat, ancientBronzeMat, 'AstrolabeRing_Mid');
  const outerAstrolabe = buildAstrolabeRing(0.92, 0.038, 12, darkUnderChassisMat, ancientBronzeMat, 'AstrolabeRing_Outer');
  containmentGroup.add(innerAstrolabe, midAstrolabe, outerAstrolabe);

  // 6 Armored Focusing Emitter Prisms inside the front bore aimed at the central focal point
  const focusPrisms = [];
  const prismCrystalGeo = new T.ConeGeometry(0.068, 0.28, 4);
  prismCrystalGeo.rotateX(Math.PI * 0.5);
  const prismSocketGeo = new T.CylinderGeometry(0.085, 0.105, 0.14, 6);
  prismSocketGeo.rotateX(Math.PI * 0.5);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pGroup = new T.Group();
    pGroup.name = `CentralFocusingPrism_${i}`;
    pGroup.position.set(Math.cos(a) * 0.50, Math.sin(a) * 0.50, 0.78);
    pGroup.lookAt(0, 0, 1.38);
    const socket = new T.Mesh(prismSocketGeo, ancientBronzeMat);
    socket.position.z = -0.10;
    const crystal = new T.Mesh(prismCrystalGeo, prismCrystalMat);
    crystal.position.z = 0.06;
    pGroup.add(socket, crystal);
    containmentGroup.add(pGroup);
    focusPrisms.push({ group: pGroup, angle: a });
  }

  // ===========================================================================
  // 7. THE CENTRAL SINGULARITY CORE (Exact Center: local 0,0,0 -> world 0,1.90,0)
  // ===========================================================================
  const coreGroup = new T.Group();
  coreGroup.name = 'CentralSingularityCore';
  bodyGroup.add(coreGroup);

  const eventHorizonSphere = new T.Mesh(new T.SphereGeometry(0.35, 40, 32), singularityCoreMat);
  eventHorizonSphere.name = 'SingularityEventHorizon';
  eventHorizonSphere.userData.noShadow = true;
  eventHorizonSphere.castShadow = false;
  coreGroup.add(eventHorizonSphere);

  const accretionRingMatA = new T.MeshBasicMaterial({
    name: 'SingularityCorona_Primary',
    color: 0xc084fc,
    transparent: true,
    opacity: 0.85,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const accretionRingA = new T.Mesh(new T.TorusGeometry(0.47, 0.020, 12, 48), accretionRingMatA);
  accretionRingA.userData.noShadow = true;
  accretionRingA.castShadow = false;
  coreGroup.add(accretionRingA);

  const accretionRingMatB = new T.MeshBasicMaterial({
    name: 'SingularityCorona_Crimson',
    color: 0xff2255,
    transparent: true,
    opacity: 0.75,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const accretionRingB = new T.Mesh(new T.TorusGeometry(0.52, 0.015, 10, 48), accretionRingMatB);
  accretionRingB.rotation.x = Math.PI * 0.35;
  accretionRingB.userData.noShadow = true;
  accretionRingB.castShadow = false;
  coreGroup.add(accretionRingB);

  const pilotBeamGeo = new T.CylinderGeometry(0.028, 0.050, 1.15, 16, 1, true);
  pilotBeamGeo.rotateX(Math.PI * 0.5);
  pilotBeamGeo.translate(0, 0, 0.575);
  const pilotBeamMat = new T.MeshBasicMaterial({
    name: 'CentralLaser_InternalPilotConduit',
    color: 0xe879f9,
    transparent: true,
    opacity: 0.52,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const pilotBeamMesh = new T.Mesh(pilotBeamGeo, pilotBeamMat);
  pilotBeamMesh.name = 'InternalLaserPilotConduit';
  pilotBeamMesh.userData.noShadow = true;
  pilotBeamMesh.castShadow = false;

  const coreLight = new T.PointLight(0xa855f7, 3.6, 9.0, 1.5);
  coreLight.position.set(0, 0, 0.30);
  coreGroup.add(coreLight);

  // ===========================================================================
  // 8. GRAVITATIONAL VORTEX PARTICLES & ARC LIGHTNING (Soft Orbs, r <= 1.66m)
  // ===========================================================================
  const particleCount = 320;
  const particleBase = [];
  const pPositions = new Float32Array(particleCount * 3);
  const pColors = new Float32Array(particleCount * 3);
  const tmpColor = new T.Color();

  for (let i = 0; i < particleCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const radius = 0.58 + rand() * 1.04;
    const speed = 0.6 + rand() * 1.2;
    const phase = rand() * Math.PI * 2;
    particleBase.push({ theta, phi, radius, speedInt: Math.round(speed), phase });

    pPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    pPositions[i * 3 + 1] = radius * Math.cos(phi);
    pPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const pick = rand();
    if (pick < 0.55) tmpColor.setHex(0xc084fc);
    else if (pick < 0.80) tmpColor.setHex(0x38bdf8);
    else tmpColor.setHex(0xff3366);

    pColors[i * 3] = tmpColor.r;
    pColors[i * 3 + 1] = tmpColor.g;
    pColors[i * 3 + 2] = tmpColor.b;
  }

  const vortexGeo = new T.BufferGeometry();
  vortexGeo.setAttribute('position', new T.BufferAttribute(pPositions, 3));
  vortexGeo.setAttribute('color', new T.BufferAttribute(pColors, 3));
  const vortexMat = new T.PointsMaterial({
    name: 'GravitationalVortex_Particles',
    size: 0.085,
    map: orbTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.90,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const vortexParticles = new T.Points(vortexGeo, vortexMat);
  vortexParticles.name = 'GravitationalVortexSwarm';
  bodyGroup.add(vortexParticles);

  const arcBolts = [];
  const arcSegments = 10;
  for (let b = 0; b < 6; b++) {
    const arcPos = new Float32Array((arcSegments + 1) * 3);
    const arcGeo = new T.BufferGeometry();
    arcGeo.setAttribute('position', new T.BufferAttribute(arcPos, 3));
    const arcMat = new T.LineBasicMaterial({
      name: `AnomalyArcLightning_${b}`,
      color: b % 2 === 0 ? 0xc084fc : 0x38bdf8,
      transparent: true,
      opacity: 0.78,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const line = new T.Line(arcGeo, arcMat);
    line.name = `ArcLightningBolt_${b}`;
    bodyGroup.add(line);
    arcBolts.push({
      line,
      geo: arcGeo,
      posAttr: arcGeo.attributes.position,
      posArr: arcPos,
      mat: arcMat,
      baseAngle: (b / 6) * Math.PI * 2,
      zBias: (b % 3 - 1) * 0.25
    });
  }

  // ===========================================================================
  // 9. DECAL-CONTROLLED CENTRAL POINT SINGULARITY LASER WEAPON
  //    Toggleable via meshy_test_0/index.html Decals UI & code APIs:
  //      - window.toggleDecalMesh('Decal_LaserBurn_Central_Weapon', true/false)
  //      - window.DECAL_CONFIG.burnsEnabled = true/false; window.applyDecalsVisibility()
  //      - window.DECAL_CONFIG.allEnabled = true/false; window.applyDecalsVisibility()
  //      - window.DECAL_CONFIG.opacity = 0..1; window.applyDecalsVisibility()
  //      - weaponDecalMesh.visible = true/false
  // ===========================================================================
  const weaponDecalControlMat = new T.MeshBasicMaterial({
    name: 'Decal_LaserBurn_Central_Weapon_Mat',
    color: 0xff66aa,
    transparent: true,
    opacity: 1.0,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const weaponDecalMesh = new T.Mesh(new T.SphereGeometry(0.11, 16, 16), weaponDecalControlMat);
  weaponDecalMesh.name = weaponDecalName;
  weaponDecalMesh.position.set(0, 0, 0);
  weaponDecalMesh.userData.noShadow = true;
  weaponDecalMesh.userData.isDecal = true;
  weaponDecalMesh.userData.decalType = 'laser';
  weaponDecalMesh.castShadow = false;
  weaponDecalMesh.receiveShadow = false;
  bodyGroup.add(weaponDecalMesh);

  // Attach internal pilot conduit to the weapon decal mesh so toggling off hides all weapon FX
  weaponDecalMesh.add(pilotBeamMesh);

  const laserAssembly = new T.Group();
  laserAssembly.name = 'CentralSingularityLaser_Assembly';
  laserAssembly.position.set(0, 0, 0);
  // Parked collapsed at scale 0.0001 prior to scanLoadedModelForDecals/update so load-time Box3 is strictly 3.80m cube
  laserAssembly.scale.setScalar(0.0001);
  laserAssembly.visible = false;
  weaponDecalMesh.add(laserAssembly);

  const laserCoreGeo = new T.CylinderGeometry(0.075, 0.095, LASER_LENGTH, 16, 1, true);
  laserCoreGeo.rotateX(Math.PI * 0.5);
  laserCoreGeo.translate(0, 0, LASER_LENGTH * 0.5);
  const laserCoreMat = new T.MeshBasicMaterial({
    name: 'SingularityLaser_IncandescentCore',
    color: 0xfff5fb,
    transparent: true,
    opacity: 0.96,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const laserCoreMesh = new T.Mesh(laserCoreGeo, laserCoreMat);
  laserCoreMesh.name = 'LaserCoreLance';
  laserCoreMesh.userData.noShadow = true;
  laserCoreMesh.castShadow = false;
  laserAssembly.add(laserCoreMesh);

  const laserSheathGeo = new T.CylinderGeometry(0.20, 0.24, LASER_LENGTH, 24, 64, true);
  laserSheathGeo.rotateX(Math.PI * 0.5);
  laserSheathGeo.translate(0, 0, LASER_LENGTH * 0.5);
  const laserSheathMesh = new T.Mesh(laserSheathGeo, laserSheathMat);
  laserSheathMesh.name = 'LaserPlasmaSheath';
  laserSheathMesh.userData.noShadow = true;
  laserSheathMesh.castShadow = false;
  laserAssembly.add(laserSheathMesh);

  const laserAuraGeo = new T.CylinderGeometry(0.34, 0.40, LASER_LENGTH, 18, 1, true);
  laserAuraGeo.rotateX(Math.PI * 0.5);
  laserAuraGeo.translate(0, 0, LASER_LENGTH * 0.5);
  const laserAuraMat = new T.MeshBasicMaterial({
    name: 'SingularityLaser_HarmonicAura',
    color: 0xa855f7,
    transparent: true,
    opacity: 0.28,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const laserAuraMesh = new T.Mesh(laserAuraGeo, laserAuraMat);
  laserAuraMesh.name = 'LaserHarmonicAura';
  laserAuraMesh.userData.noShadow = true;
  laserAuraMesh.castShadow = false;
  laserAssembly.add(laserAuraMesh);

  const buildHelixTube = (phaseOffset, radius, turns, colorHex, name) => {
    const pts = [];
    const steps = 160;
    const spanZ = LASER_LENGTH - 0.15;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const z = f * spanZ;
      const r = radius * (0.45 + 0.55 * Math.sin(Math.min(1, z / 2.4) * Math.PI * 0.5));
      const ang = f * Math.PI * 2 * turns + phaseOffset;
      pts.push(new T.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z));
    }
    const curve = new T.CatmullRomCurve3(pts);
    const geo = new T.TubeGeometry(curve, 160, 0.024, 6, false);
    const mat = new T.MeshBasicMaterial({
      name,
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const m = new T.Mesh(geo, mat);
    m.name = name;
    m.userData.noShadow = true;
    m.castShadow = false;
    return m;
  };

  const helixA = buildHelixTube(0, 0.27, 15.0, 0xff2255, 'LaserHelixArc_Crimson');
  const helixB = buildHelixTube(Math.PI, 0.27, 15.0, 0x38bdf8, 'LaserHelixArc_Cyan');
  laserAssembly.add(helixA, helixB);

  const SHOCK_RING_COUNT = 10;
  const shockRings = [];
  const shockGeo = new T.TorusGeometry(0.32, 0.024, 8, 24);
  for (let s = 0; s < SHOCK_RING_COUNT; s++) {
    const sMat = new T.MeshBasicMaterial({
      name: `LaserShockwaveRing_${s}`,
      color: s % 2 === 0 ? 0xff4488 : 0xc084fc,
      transparent: true,
      opacity: 0.8,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const ring = new T.Mesh(shockGeo, sMat);
    ring.name = `LaserShockRing_${s}`;
    ring.userData.noShadow = true;
    ring.castShadow = false;
    laserAssembly.add(ring);
    shockRings.push({ mesh: ring, mat: sMat, offset: s / SHOCK_RING_COUNT });
  }

  const createFlareCross = (scale, name) => {
    const fg = new T.Group();
    fg.name = name;
    const fMat = new T.MeshBasicMaterial({
      name: `${name}_Mat`,
      map: flareTex,
      color: 0xffd6f6,
      transparent: true,
      opacity: 0.92,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide
    });
    const pGeo = new T.PlaneGeometry(scale, scale);
    const p1 = new T.Mesh(pGeo, fMat);
    const p2 = new T.Mesh(pGeo, fMat);
    p2.rotation.y = Math.PI * 0.5;
    const p3 = new T.Mesh(pGeo, fMat);
    p3.rotation.x = Math.PI * 0.5;
    [p1, p2, p3].forEach((p) => {
      p.userData.noShadow = true;
      p.castShadow = false;
      fg.add(p);
    });
    return { group: fg, mat: fMat };
  };

  const centerFlare = createFlareCross(1.25, 'CentralPointOriginFlare');
  centerFlare.group.position.set(0, 0, 0.08);
  laserAssembly.add(centerFlare.group);

  const muzzleFlare = createFlareCross(1.65, 'ApertureMuzzleFlare');
  muzzleFlare.group.position.set(0, 0, 1.58);
  laserAssembly.add(muzzleFlare.group);

  // ===========================================================================
  // ANIMATION & DECAL-DRIVEN WEAPON CONTROLLER (Seamless 6.0s Loop)
  // ===========================================================================
  let _weaponDecalVisible = true;
  let _weaponOpacity = 1.0;
  let _lastElapsed = 0.0;

  const SHOCK_TRAVEL_SPAN = LASER_LENGTH - 0.45;
  const PI2 = Math.PI * 2;
  const OMEGA = PI2 / duration;
  const pAttr = vortexGeo.attributes.position;
  const pArr = pAttr.array;

  function applyWeaponOpacity(alpha) {
    const a = _weaponDecalVisible ? Math.max(0, Math.min(1, alpha)) : 0.0;
    laserUniforms.uIntensity.value = a;
    laserCoreMat.opacity = Math.min(1.0, a * 0.96);
    laserAuraMat.opacity = 0.30 * a;
    helixA.material.opacity = 0.85 * a;
    helixB.material.opacity = 0.85 * a;
    pilotBeamMat.opacity = 0.72 * a;
    centerFlare.mat.opacity = 0.92 * a;
    muzzleFlare.mat.opacity = 0.95 * a;
    const shockOp = 0.80 * a;
    for (let i = 0; i < shockRings.length; i++) {
      shockRings[i].mat.opacity = shockOp;
    }
  }

  function applyMandiblePose(irisOpen) {
    const dy = irisOpen * 0.12;
    const dz = irisOpen * 0.05;
    const drx = irisOpen * 0.44;
    for (let i = 0; i < mandibles.length; i++) {
      const m = mandibles[i];
      m.jaw.position.y = m.baseY + dy;
      m.jaw.position.z = m.baseZ - dz;
      m.jaw.rotation.x = m.baseRotX - drx;
    }
  }

  function applyEmissiveAndCoreState(chargeLevel, fireLevel) {
    coreUniforms.uCharge.value = chargeLevel;
    coreUniforms.uFire.value = fireLevel;
    heavyArmorMat.emissiveIntensity = 0.65 + chargeLevel * 0.80 + fireLevel * 0.90;
    reactivePlateMat.emissiveIntensity = 0.42 + chargeLevel * 0.60 + fireLevel * 0.72;
    violetConduitMat.emissiveIntensity = 1.55 + chargeLevel * 1.4 + fireLevel * 1.8;
    crimsonApertureRailMat.emissiveIntensity = 1.2 + chargeLevel * 1.8 + fireLevel * 3.0;
    prismCrystalMat.emissiveIntensity = 1.4 + chargeLevel * 1.8 + fireLevel * 2.6;
    coreLight.intensity = 3.2 + chargeLevel * 4.5 + fireLevel * 6.8;
    coreLight.color.setHex(fireLevel > 0.35 ? 0xff3b7d : 0xa855f7);
  }

  function layoutLaserBeamFX(elapsed, fireLevel) {
    const flicker = 0.90 + 0.12 * Math.sin(elapsed * 58.0) + 0.07 * Math.cos(elapsed * 91.0);
    const radialScale = (0.35 + 0.65 * fireLevel) * flicker;
    laserAssembly.scale.set(radialScale, radialScale, 1.0);

    laserCoreMat.opacity = Math.min(1.0, fireLevel * 0.98);
    laserAuraMat.opacity = 0.30 * fireLevel;
    helixA.material.opacity = 0.85 * fireLevel;
    helixB.material.opacity = 0.85 * fireLevel;

    helixA.rotation.z = elapsed * 14.0;
    helixB.rotation.z = -elapsed * 16.0;

    const travelBase = elapsed * 1.45;
    const rotBase = elapsed * 6.0;
    for (let i = 0; i < shockRings.length; i++) {
      const sr = shockRings[i];
      const travel = (travelBase + sr.offset) % 1.0;
      sr.mesh.position.z = 0.22 + travel * SHOCK_TRAVEL_SPAN;
      const ringScale = 0.48 + travel * 1.15;
      sr.mesh.scale.set(ringScale, ringScale, 1.0);
      sr.mesh.rotation.z = rotBase + sr.offset * PI2;
      sr.mat.opacity = Math.sin(travel * Math.PI) * 0.85 * fireLevel;
    }

    centerFlare.group.rotation.z = elapsed * 3.5;
    centerFlare.group.scale.setScalar((0.80 + 0.45 * fireLevel) * flicker);
    centerFlare.mat.opacity = 0.92 * fireLevel;

    muzzleFlare.group.rotation.z = -elapsed * 4.2;
    muzzleFlare.group.scale.setScalar((0.72 + 0.58 * fireLevel) * flicker);
    muzzleFlare.mat.opacity = 0.95 * fireLevel;
  }

  function syncWeaponDecalState(isVisible) {
    const active = Boolean(isVisible) && _weaponOpacity > 0.005;
    const level = active ? _weaponOpacity : 0.0;
    applyMandiblePose(active ? 1.0 : 0.0);
    applyEmissiveAndCoreState(level, level);
    eventHorizonSphere.scale.setScalar(1.0 + level * 0.26);
    accretionRingA.scale.setScalar(1.0 + level * 0.16);
    accretionRingB.scale.setScalar(1.0 + level * 0.22);
    bodyGroup.position.z = -level * 0.065;
    const pilotScale = 0.85 + level * 0.75;
    pilotBeamMesh.scale.set(pilotScale, pilotScale, 1.0);

    if (active) {
      laserAssembly.visible = true;
      pilotBeamMesh.visible = true;
      applyWeaponOpacity(level);
      layoutLaserBeamFX(_lastElapsed, level);
      rootGroup.userData.laserFiring = true;
    } else {
      laserAssembly.visible = false;
      laserAssembly.scale.setScalar(0.0001);
      pilotBeamMesh.visible = false;
      applyWeaponOpacity(0.0);
      rootGroup.userData.laserFiring = false;
    }
  }

  // Intercept direct .visible assignments from meshy_test_0/index.html applyDecalsVisibility() / toggleDecalMesh()
  // so turning the weapon decal ON or OFF works instantaneously even when playback is paused.
  Object.defineProperty(weaponDecalMesh, 'visible', {
    configurable: true,
    enumerable: true,
    get() {
      return _weaponDecalVisible;
    },
    set(val) {
      _weaponDecalVisible = Boolean(val);
      syncWeaponDecalState(_weaponDecalVisible);
    }
  });

  // Intercept material.opacity updates from meshy_test_0/index.html decal-opacity-slider / DECAL_CONFIG.opacity
  Object.defineProperty(weaponDecalControlMat, 'opacity', {
    configurable: true,
    enumerable: true,
    get() {
      return _weaponOpacity;
    },
    set(val) {
      _weaponOpacity = Math.max(0, Math.min(1, Number.isFinite(val) ? val : 1.0));
      syncWeaponDecalState(_weaponDecalVisible);
    }
  });

  function updateArcLightning(elapsed, charge, fire) {
    const activeAmp = 0.08 + charge * 0.12 + fire * 0.18;
    const timeTick = Math.floor(elapsed * 22);
    const boltOpacity = 0.25 + charge * 0.5 + fire * 0.65;
    const invSegments = 1.0 / arcSegments;
    const elapsed8 = elapsed * 8.0;

    for (let bIdx = 0; bIdx < arcBolts.length; bIdx++) {
      const bolt = arcBolts[bIdx];
      const arr = bolt.posArr;
      const a0 = bolt.baseAngle + elapsed * (bIdx % 2 === 0 ? 1.4 : -1.1);
      const rStart = 0.36;
      const rSpan = 0.68; // 1.04 - 0.36
      const bTerm1 = bIdx * 17.3 + timeTick * 13.1;
      const bTerm2 = bIdx * 11.7 - timeTick * 19.3;

      for (let i = 0; i <= arcSegments; i++) {
        const f = i * invSegments;
        const ang = a0 + 1.05 * f;
        const r = rStart + rSpan * f;
        const env = Math.sin(f * Math.PI);
        const jitterAmp = activeAmp * env;
        const jitterSeed = Math.sin((i + 1) * 31.7 + bTerm1);
        const jitterSeed2 = Math.cos((i + 2) * 23.9 + bTerm2);
        const base = i * 3;
        arr[base] = Math.cos(ang) * r + jitterSeed * jitterAmp;
        arr[base + 1] = Math.sin(ang) * r + jitterSeed2 * jitterAmp;
        arr[base + 2] = bolt.zBias * (1.0 - f) + Math.sin(f * PI2 + elapsed8) * 0.16 * env;
      }
      bolt.posAttr.needsUpdate = true;
      bolt.mat.opacity = boltOpacity;
    }
  }

  function update(dt, elapsed = 0) {
    _lastElapsed = elapsed;

    const cycleT = ((elapsed % duration) + duration) % duration;
    const normT = cycleT / duration;
    const cyclePhase = cycleT * OMEGA;
    const cyclePhase2 = cyclePhase * 2.0;

    // Weapon state is driven directly by the Decal toggle (Decal_LaserBurn_Central_Weapon)
    const weaponEnabled = _weaponDecalVisible && _weaponOpacity > 0.005;
    const fireLevel = weaponEnabled ? _weaponOpacity : 0.0;
    const chargeLevel = weaponEnabled ? _weaponOpacity : 0.0;
    const irisOpen = weaponEnabled ? 1.0 : 0.0;

    // 1. Subtle Heavy Automaton Graviton Hover & Recoil (exact 0 displacement at t = 0 when idle)
    const sinPhase = Math.sin(cyclePhase);
    const hoverY = sinPhase * 0.055;
    const recoilZ = -fireLevel * 0.065 + Math.sin(cyclePhase * 18.0) * fireLevel * 0.009;
    bodyGroup.position.set(0, HALF_EXTENT + hoverY, recoilZ);
    bodyGroup.rotation.z = sinPhase * 0.025;

    // 2. Counter-Rotating Ancient Astrolabe Rings (exact integer harmonics -> seamless loop)
    innerAstrolabe.rotation.z = cyclePhase * 3.0;
    innerAstrolabe.rotation.x = Math.sin(cyclePhase2) * 0.45 + 0.35;
    innerAstrolabe.rotation.y = cyclePhase2;

    midAstrolabe.rotation.z = -cyclePhase2;
    midAstrolabe.rotation.y = -cyclePhase;
    midAstrolabe.rotation.x = Math.cos(cyclePhase) * 0.32;

    outerAstrolabe.rotation.z = cyclePhase;
    outerAstrolabe.rotation.x = sinPhase * 0.22;

    // 3. Heavy Armor Matrix Subtle Mechanical Breathing
    const plateAmpScale = 0.45 + chargeLevel * 0.75;
    const plateExpand = chargeLevel * 0.020;
    for (let i = 0; i < breathingPlates.length; i++) {
      const p = breathingPlates[i];
      const rad = p.baseRadius + Math.sin(cyclePhase2 + p.phase) * p.amplitude * plateAmpScale + plateExpand;
      p.group.position.set(p.dir.x * rad, p.dir.y * rad, p.dir.z * rad);
    }

    // Articulated Forward Blast-Petal Mandibles open when weapon decal is ON, lock shut when OFF
    applyMandiblePose(irisOpen);

    // Focusing Prism Crystals brighten & converge toward the central firing axis
    const prismR = 0.50 - chargeLevel * 0.06;
    const prismZ = 0.78 + fireLevel * 0.06;
    for (let i = 0; i < focusPrisms.length; i++) {
      const fp = focusPrisms[i];
      const rot = fp.angle + cyclePhase2;
      fp.group.position.set(Math.cos(rot) * prismR, Math.sin(rot) * prismR, prismZ);
      fp.group.lookAt(0, 0, 1.45);
      fp.group.rotation.z = rot + i;
    }

    // 4. Singularity Core Shaders, Corona & Dynamic Illumination
    coreUniforms.uTime.value = elapsed;
    applyEmissiveAndCoreState(chargeLevel, fireLevel);

    const coreScale = 1.0 + chargeLevel * 0.14 + fireLevel * 0.12 + Math.sin(elapsed * 22.0) * fireLevel * 0.035;
    eventHorizonSphere.scale.setScalar(coreScale);

    accretionRingA.rotation.z = cyclePhase * 4.0;
    accretionRingA.rotation.x = Math.PI * 0.22 + Math.sin(cyclePhase2) * 0.28;
    accretionRingA.scale.setScalar(1.0 + chargeLevel * 0.16);

    accretionRingB.rotation.z = -cyclePhase * 5.0;
    accretionRingB.rotation.y = cyclePhase * 3.0;
    accretionRingB.scale.setScalar(1.0 + fireLevel * 0.22);

    pilotBeamMesh.visible = weaponEnabled;
    pilotBeamMat.opacity = weaponEnabled ? (0.72 * fireLevel) : 0.0;
    const pilotScale = 0.85 + fireLevel * 0.75;
    pilotBeamMesh.scale.set(pilotScale, pilotScale, 1.0);

    // 5. Gravitational Vortex Particle Swarm
    const pullFactor = 1.0 - chargeLevel * 0.28 + fireLevel * 0.12;
    for (let i = 0; i < particleCount; i++) {
      const pb = particleBase[i];
      const theta = pb.theta + cyclePhase * pb.speedInt;
      const rRaw = pb.radius * pullFactor + Math.sin(cyclePhase2 + pb.phase) * 0.06;
      const r = rRaw < 1.66 ? rRaw : 1.66;
      const phi = pb.phi + Math.sin(cyclePhase + pb.phase) * 0.08;
      const rSinPhi = r * Math.sin(phi);
      const idx = i * 3;
      pArr[idx] = rSinPhi * Math.cos(theta);
      pArr[idx + 1] = r * Math.cos(phi);
      pArr[idx + 2] = rSinPhi * Math.sin(theta);
    }
    pAttr.needsUpdate = true;

    // 6. Arc-Lightning Filaments
    updateArcLightning(elapsed, chargeLevel, fireLevel);

    // 7. Central Point Singularity Laser Beam (Active strictly when Weapon Decal is ON)
    laserUniforms.uTime.value = elapsed;
    laserUniforms.uIntensity.value = fireLevel;

    if (weaponEnabled) {
      laserAssembly.visible = true;
      layoutLaserBeamFX(elapsed, fireLevel);
    } else {
      laserAssembly.visible = false;
      laserAssembly.scale.setScalar(0.0001);
    }

    rootGroup.userData.cycleProgress = normT;
    rootGroup.userData.laserFiring = weaponEnabled;
  }

  function reset() {
    bodyGroup.position.set(0, HALF_EXTENT, 0);
    bodyGroup.rotation.set(0, 0, 0);
    syncWeaponDecalState(_weaponDecalVisible);
    update(0, 0);
  }

  function setLaserIntensity(val) {
    if (val === false || val === 0) {
      weaponDecalMesh.visible = false;
      return;
    }
    if (val === true || val === null || val === undefined) {
      _weaponOpacity = 1.0;
      weaponDecalMesh.visible = true;
      return;
    }
    const num = Math.max(0, Math.min(1, Number(val) || 0));
    _weaponOpacity = num;
    weaponDecalMesh.visible = num > 0.005;
  }

  function dispose() {
    trackedTextures.forEach((tex) => {
      try { tex.dispose(); } catch (_) {}
    });
    rootGroup.traverse((child) => {
      if (child.geometry) {
        try { child.geometry.dispose(); } catch (_) {}
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          try { m.dispose(); } catch (_) {}
        });
      }
    });
  }

  rootGroup.userData.decals = {
    laserBurns: [weaponDecalMesh],
    weapon: weaponDecalMesh
  };

  rootGroup.userData.singularityGuardian = {
    metadata,
    weaponDecalName,
    weaponDecalMesh,
    update,
    reset,
    dispose,
    setLaserIntensity,
    laserOrigin: new T.Vector3(0, HALF_EXTENT, 0),
    laserLength: LASER_LENGTH,
    dimensions: { width: TARGET_SIZE, height: TARGET_SIZE, depth: TARGET_SIZE },
    circumferenceOval: 11.94
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
  return createSingularityGuardian(api);
}
