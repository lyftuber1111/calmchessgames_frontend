/**
 * Procedural WebXR Sci-Fi Enemy: Drone Phase Interceptor Mk.III (Stage 1 - Warp Origin)
 * High-fidelity procedural XR reconstruction & enhancement of drone_phase_interceptor_3.glb.
 *
 * Architectural & Visual Upgrades:
 *  - Crisp multi-station lofted pearl-white ceramic-titanium interceptor fuselage with
 *    procedural PBR CanvasTextures (albedo panel seams, rivets, wear, bump relief,
 *    satin-vs-polished roughness contrast, and micro-telemetry emissive traces)
 *  - Sculpted swept delta lower wings, beveled outboard flanking pontoons with recessed
 *    cyan phase-capacitor cells, and twin rear auxiliary maneuvering nozzles
 *  - Twin elevated upper phase-drive thruster nacelles on dark titanium truss pylons,
 *    featuring rotating 8-blade intake turbines, custom GLSL pulsing cyan side energy
 *    core strips, rear ion-thrust plumes, and upward-canted beveled rear stabilizer fins
 *  - Recessed obsidian stealth optical canopy, ventral chin sensor/cannon pod, and
 *    signature rear vertical-louvered main thrust-vectoring exhaust housing
 *  - Articulated 6-petal forward nose laser aperture at the exact +Z tip
 *  - High-energy RED animated tip-mounted laser weapon (custom GLSL red plasma disruptor
 *    sheath, incandescent core lance, counter-rotating crimson plasma helices, traveling
 *    shockwave rings, muzzle star flare, emitted plasma spark stream, dynamic red light)
 *  - Controlled as a toggleable decal via meshy_test_0/index.html Decals UI & APIs
 *    (Decal_LaserBurn_Tip_Laser_Weapon) — works instantaneously even while paused
 *  - Exact physical bounding dimensions matching the reference GLB display footprint:
 *    2.11m (W) x 0.98m (H) x 2.63m (L), facing +Z forward
 *
 * Compatible with meshy_test_0 Procedural JS Loader & Player, WebXR, and Three.js r160+.
 */
import * as THREE from 'three';

export const duration = 6.0; // Seamless 6.0s combat loop
export const preserveScale = true; // Preserve exact 1:1 physical meter footprint (2.11m x 0.98m x 2.63m)
export const weaponDecalName = 'Decal_LaserBurn_Tip_Laser_Weapon'; // Controlled as a decal by meshy_test_0/index.html

const TARGET_WIDTH = 2.11;
const TARGET_HEIGHT = 0.98;
const TARGET_LENGTH = 2.63;
const BASE_CENTER_Y = TARGET_HEIGHT * 0.5; // 0.49m so ventral keel rests cleanly at y = 0 at t = 0
const LASER_LENGTH = 24.0; // 24.0m red animated laser beam firing straight from the nose tip along +Z

export const metadata = {
  id: 'drone_phase_interceptor_3',
  name: 'Drone Phase Interceptor Mk.III',
  stage: 1,
  stageSlug: 'warp_origin',
  classification: 'Fast Phase Interceptor Drone',
  sourceReference: 'wormhole0/mobile/warp_origin_images/drone_phase_interceptor_3.glb',
  weaponDecalName,
  weaponColor: '#ff1a2b',
  dimensions: {
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    depth: TARGET_LENGTH
  },
  laserDirection: { x: 0, y: 0, z: 1 },
  laserLength: LASER_LENGTH
};

/**
 * Deterministic PRNG for 100% reproducible procedural textures & particle placement.
 */
function createSeededRandom(seed = 103263) {
  let s = seed >>> 0;
  return function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Generates crisp procedural PBR CanvasTextures (albedo, bump, roughness, emissive)
 * for aerospace pearl-white ceramic-titanium armor plating with panel seams, rivets,
 * micro-brushed alloy grain, and subtle cyan telemetry accents.
 */
function createInterceptorArmorTextures() {
  if (typeof document === 'undefined') {
    return { albedo: null, bump: null, roughness: null, emissive: null, textures: [] };
  }

  const size = 1024;
  const rand = createSeededRandom(314159);

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

  // 1. Base aerospace pearl-white composite ceramic-titanium gradient (bright crisp aerospace white)
  const baseGrad = aCtx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0.0, '#fbfdff');
  baseGrad.addColorStop(0.45, '#f2f6fb');
  baseGrad.addColorStop(1.0, '#e6edf5');
  aCtx.fillStyle = baseGrad;
  aCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#909090';
  bCtx.fillRect(0, 0, size, size);

  // Satin white composite default roughness (~0.38)
  rCtx.fillStyle = '#666666';
  rCtx.fillRect(0, 0, size, size);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  // 2. Fine directional aerospace brushed-alloy & ceramic micro-grain
  for (let i = 0; i < 1200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 24 + rand() * 110;
    const alpha = 0.02 + rand() * 0.035;
    aCtx.strokeStyle = rand() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(130, 146, 168, ${alpha})`;
    aCtx.lineWidth = 1.1;
    aCtx.beginPath();
    aCtx.moveTo(x, y);
    aCtx.lineTo(x + len, y + (rand() - 0.5) * 1.6);
    aCtx.stroke();

    rCtx.strokeStyle = rand() > 0.5 ? `rgba(135, 135, 135, ${alpha * 2.2})` : `rgba(55, 55, 55, ${alpha * 2.2})`;
    rCtx.beginPath();
    rCtx.moveTo(x, y);
    rCtx.lineTo(x + len, y);
    rCtx.stroke();
  }

  // 3. Precision Chamfered Aerospace Hull Panel Grid & Subtle Tonal Plate Variation
  const drawArmorPanel = (x, y, w, h, bevel = 16, toneShift = 0, accentStripe = false) => {
    const traceChamfer = (ctx, pad) => {
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

    // Crisp precision dark panel seam line
    traceChamfer(aCtx, 1);
    aCtx.fillStyle = '#6c7788';
    aCtx.fill();

    // Raised bright matte-satin ceramic white armor tile
    traceChamfer(aCtx, 3.5);
    const vBase = Math.max(222, Math.min(250, 240 + toneShift));
    const pGrad = aCtx.createLinearGradient(x, y, x + w, y + h);
    pGrad.addColorStop(0.0, `rgb(${Math.min(255, vBase + 6)}, ${Math.min(255, vBase + 8)}, ${Math.min(255, vBase + 10)})`);
    pGrad.addColorStop(0.6, `rgb(${vBase}, ${Math.min(255, vBase + 2)}, ${Math.min(255, vBase + 5)})`);
    pGrad.addColorStop(1.0, `rgb(${vBase - 8}, ${vBase - 5}, ${vBase - 1})`);
    aCtx.fillStyle = pGrad;
    aCtx.fill();

    // Crisp specular edge chamfer highlight
    aCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    aCtx.lineWidth = 2.0;
    aCtx.stroke();

    // Optional subtle tactical slate-silver inset band
    if (accentStripe) {
      aCtx.fillStyle = 'rgba(132, 146, 166, 0.28)';
      aCtx.fillRect(x + 22, y + h * 0.42, w - 44, 14);
      rCtx.fillStyle = '#484848';
      rCtx.fillRect(x + 22, y + h * 0.42, w - 44, 14);
    }

    // Bump relief
    traceChamfer(bCtx, 1);
    bCtx.fillStyle = '#242424';
    bCtx.fill();
    traceChamfer(bCtx, 5);
    bCtx.fillStyle = '#d6d6d6';
    bCtx.fill();
    bCtx.strokeStyle = '#ffffff';
    bCtx.lineWidth = 2.0;
    bCtx.stroke();

    // Roughness map contrast (satin plate, glossy chamfer seam lip)
    traceChamfer(rCtx, 5);
    rCtx.fillStyle = toneShift < 0 ? '#727272' : '#585858';
    rCtx.fill();
    rCtx.strokeStyle = '#303030';
    rCtx.lineWidth = 2.5;
    rCtx.stroke();

    // Recessed micro-fasteners at panel corners
    const inset = 18;
    const rivets = [
      [x + inset, y + inset],
      [x + w - inset, y + inset],
      [x + inset, y + h - inset],
      [x + w - inset, y + h - inset]
    ];
    for (const [rx, ry] of rivets) {
      aCtx.fillStyle = '#7c8799';
      aCtx.beginPath();
      aCtx.arc(rx, ry, 3.0, 0, Math.PI * 2);
      aCtx.fill();
      bCtx.fillStyle = '#383838';
      bCtx.beginPath();
      bCtx.arc(rx, ry, 3.2, 0, Math.PI * 2);
      bCtx.fill();
    }
  };

  // Multi-scale aerospace panel layout (cleanly tiles across lofted wings & fuselage)
  const layout = [
    [0, 0, 512, 256, 22, 6, true],
    [512, 0, 512, 256, 22, -4, false],
    [0, 256, 340, 256, 18, -8, false],
    [340, 256, 344, 256, 18, 10, true],
    [684, 256, 340, 256, 18, -5, false],
    [0, 512, 512, 256, 22, 4, false],
    [512, 512, 512, 256, 22, -6, true],
    [0, 768, 256, 256, 16, -2, false],
    [256, 768, 512, 256, 20, 8, false],
    [768, 768, 256, 256, 16, -9, false]
  ];
  for (const p of layout) {
    drawArmorPanel(...p);
  }

  // 4. Precision Maintenance Louver Vents & Subtle Cyan Micro-Conduit Traces
  const drawVentGrille = (vx, vy, vw, vh, slits = 5) => {
    aCtx.fillStyle = '#2d3544';
    aCtx.fillRect(vx, vy, vw, vh);
    bCtx.fillStyle = '#181818';
    bCtx.fillRect(vx, vy, vw, vh);
    const step = vh / (slits * 2 + 1);
    for (let i = 0; i < slits; i++) {
      const sy = vy + step * (i * 2 + 1);
      aCtx.fillStyle = '#6c788b';
      aCtx.fillRect(vx + 3, sy, vw - 6, step * 0.85);
      bCtx.fillStyle = '#b4b4b4';
      bCtx.fillRect(vx + 3, sy, vw - 6, step * 0.85);
    }
  };

  drawVentGrille(48, 300, 96, 52, 5);
  drawVentGrille(880, 300, 96, 52, 5);
  drawVentGrille(460, 816, 104, 46, 4);

  // Micro cyan telemetry seam traces (subtle, crisp sci-fi enhancement)
  eCtx.strokeStyle = 'rgba(0, 232, 255, 0.72)';
  eCtx.lineWidth = 2.4;
  eCtx.beginPath();
  eCtx.moveTo(340, 290);
  eCtx.lineTo(340, 478);
  eCtx.moveTo(684, 290);
  eCtx.lineTo(684, 478);
  eCtx.moveTo(110, 512);
  eCtx.lineTo(290, 512);
  eCtx.moveTo(734, 512);
  eCtx.lineTo(914, 512);
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

  const albedo = configureTex(albedoCanvas, 'interceptor_armor_albedo.png', true);
  const bump = configureTex(bumpCanvas, 'interceptor_armor_bump.png', false);
  const roughness = configureTex(roughCanvas, 'interceptor_armor_roughness.png', false);
  const emissive = configureTex(emissiveCanvas, 'interceptor_armor_emissive.png', true);

  return {
    albedo,
    bump,
    roughness,
    emissive,
    textures: [albedo, bump, roughness, emissive]
  };
}

/**
 * Generates a high-intensity crimson-red radial star-bloom flare CanvasTexture
 * for the tip-mounted red laser muzzle.
 */
function createRedLaserFlareTexture() {
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
  grad.addColorStop(0.14, 'rgba(255, 224, 220, 0.96)');
  grad.addColorStop(0.32, 'rgba(255, 42, 52, 0.78)');
  grad.addColorStop(0.62, 'rgba(205, 8, 22, 0.28)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Anamorphic & 6-point laser star rays
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    const rayLen = (i % 3 === 0) ? cx : cx * 0.78;
    const halfW = (i % 3 === 0) ? 6.5 : 4.0;
    const rayGrad = ctx.createLinearGradient(0, 0, rayLen, 0);
    rayGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    rayGrad.addColorStop(0.35, 'rgba(255, 46, 56, 0.55)');
    rayGrad.addColorStop(1.0, 'rgba(255, 18, 28, 0.0)');
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
  tex.name = 'interceptor_red_laser_flare.png';
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft glowing radial particle orb CanvasTexture (eliminates hard square quads).
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
  grad.addColorStop(0.30, innerRgba);
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
 * Normalizes ExtrudeGeometry UVs cleanly onto [0, 1] using planar projection
 * so procedural armor panel seams map without distortion.
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
 * Builds a closed, faceted-aerospace lofted BufferGeometry from cross-section stations along Z.
 * Each station is `{ z, points: [[x, y], ...] }` ordered CCW when viewed from +Z.
 * Supports smooth or sharp chamfered aerospace creases and clean cylindrical/planar UVs.
 */
function createLoftedSectionGeometry(T, stations, options = {}) {
  const { capStart = true, capEnd = true, uvRepeatU = 1.0, uvRepeatV = 1.0, hardFacets = false } = options;
  const ringCount = stations.length;
  const segCount = stations[0].points.length;

  const positions = [];
  const uvs = [];
  const indices = [];

  const zMin = stations[0].z;
  const zMax = stations[ringCount - 1].z;
  const zSpan = Math.max(0.001, Math.abs(zMax - zMin));

  if (!hardFacets) {
    // Indexed smooth/creased skin along station rings
    for (let r = 0; r < ringCount; r++) {
      const st = stations[r];
      const vCoord = (Math.abs(st.z - zMin) / zSpan) * uvRepeatV;
      for (let s = 0; s <= segCount; s++) {
        const pt = st.points[s % segCount];
        positions.push(pt[0], pt[1], st.z);
        uvs.push((s / segCount) * uvRepeatU, vCoord);
      }
    }
    const stride = segCount + 1;
    for (let r = 0; r < ringCount - 1; r++) {
      for (let s = 0; s < segCount; s++) {
        const a = r * stride + s;
        const b = r * stride + s + 1;
        const c = (r + 1) * stride + s + 1;
        const d = (r + 1) * stride + s;
        // Outward winding: stations increase from -Z to +Z and points are CCW in XY -> (a, b, c) & (a, c, d) face outward!
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }
  } else {
    // Crisp hard-edge faceted aerospace quads (each quad has dedicated outward normal!)
    let vIdx = 0;
    for (let r = 0; r < ringCount - 1; r++) {
      const st0 = stations[r];
      const st1 = stations[r + 1];
      const v0 = (Math.abs(st0.z - zMin) / zSpan) * uvRepeatV;
      const v1 = (Math.abs(st1.z - zMin) / zSpan) * uvRepeatV;
      for (let s = 0; s < segCount; s++) {
        const sNext = (s + 1) % segCount;
        const p00 = st0.points[s];
        const p01 = st0.points[sNext];
        const p11 = st1.points[sNext];
        const p10 = st1.points[s];
        const u0 = (s / segCount) * uvRepeatU;
        const u1 = ((s + 1) / segCount) * uvRepeatU;

        positions.push(
          p00[0], p00[1], st0.z,
          p01[0], p01[1], st0.z,
          p11[0], p11[1], st1.z,
          p10[0], p10[1], st1.z
        );
        uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
        indices.push(vIdx, vIdx + 1, vIdx + 2);
        indices.push(vIdx, vIdx + 2, vIdx + 3);
        vIdx += 4;
      }
    }
  }

  const addCap = (station, flipWinding) => {
    let cx = 0;
    let cy = 0;
    for (let s = 0; s < segCount; s++) {
      cx += station.points[s][0];
      cy += station.points[s][1];
    }
    cx /= segCount;
    cy /= segCount;

    const centerIndex = positions.length / 3;
    positions.push(cx, cy, station.z);
    uvs.push(0.5, 0.5);

    const ringStart = positions.length / 3;
    for (let s = 0; s < segCount; s++) {
      const pt = station.points[s];
      positions.push(pt[0], pt[1], station.z);
      uvs.push(0.5 + pt[0] * 1.2, 0.5 + pt[1] * 1.2);
    }

    for (let s = 0; s < segCount; s++) {
      const a = ringStart + s;
      const b = ringStart + ((s + 1) % segCount);
      if (flipWinding) {
        indices.push(centerIndex, b, a);
      } else {
        indices.push(centerIndex, a, b);
      }
    }
  };

  if (capStart) addCap(stations[0], true);
  if (capEnd) addCap(stations[ringCount - 1], false);

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a chamfered octagonal cross-section ring (CCW in XY when viewed from +Z).
 */
function makeOctagonProfile(halfW, topY, botY, topChamferW, botChamferW, topBevelH, botBevelH, xOffset = 0) {
  return [
    [xOffset - botChamferW, botY],
    [xOffset + botChamferW, botY],
    [xOffset + halfW, botY + botBevelH],
    [xOffset + halfW, topY - topBevelH],
    [xOffset + topChamferW, topY],
    [xOffset - topChamferW, topY],
    [xOffset - halfW, topY - topBevelH],
    [xOffset - halfW, botY + botBevelH]
  ];
}

/**
 * Helper for a beveled octagonal armor plate / nacelle block.
 */
function createBeveledPlate(T, width, height, depth, chamfer = 0.04, bevel = 0.014) {
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
 * Builds the Drone Phase Interceptor Mk.III procedural 3D model and animation controller.
 */
export function createDronePhaseInterceptor3(api = {}) {
  const T = (api && api.THREE) ? api.THREE : THREE;
  const rand = createSeededRandom(103003);

  const trackedTextures = [];
  const armorTex = createInterceptorArmorTextures();
  trackedTextures.push(...armorTex.textures);

  const redFlareTex = createRedLaserFlareTexture();
  if (redFlareTex) trackedTextures.push(redFlareTex);

  const redSparkTex = createGlowingOrbTexture(
    'interceptor_red_spark_orb.png',
    'rgba(255, 110, 110, 0.90)',
    'rgba(255, 20, 32, 0.36)'
  );
  if (redSparkTex) trackedTextures.push(redSparkTex);

  const cyanIonTex = createGlowingOrbTexture(
    'interceptor_cyan_ion_orb.png',
    'rgba(120, 245, 255, 0.88)',
    'rgba(0, 196, 255, 0.30)'
  );
  if (cyanIonTex) trackedTextures.push(cyanIonTex);

  // ===========================================================================
  // PBR & CUSTOM GLSL MATERIALS
  // ===========================================================================
  const whiteArmorMat = new T.MeshStandardMaterial({
    name: 'InterceptorArmor_PearlCeramicWhite',
    color: 0xffffff,
    map: armorTex.albedo,
    bumpMap: armorTex.bump,
    bumpScale: 0.015,
    roughnessMap: armorTex.roughness,
    emissive: 0x00d8ff,
    emissiveMap: armorTex.emissive,
    emissiveIntensity: 0.35,
    metalness: 0.16,
    roughness: 0.38
  });

  const secondaryArmorMat = new T.MeshStandardMaterial({
    name: 'InterceptorArmor_SatinTitaniumSilver',
    color: 0xe6edf5,
    map: armorTex.albedo,
    bumpMap: armorTex.bump,
    bumpScale: 0.014,
    roughnessMap: armorTex.roughness,
    metalness: 0.30,
    roughness: 0.35
  });

  const darkChassisMat = new T.MeshStandardMaterial({
    name: 'InterceptorChassis_CarbonGunmetal',
    color: 0x262d3a,
    bumpMap: armorTex.bump,
    bumpScale: 0.012,
    metalness: 0.70,
    roughness: 0.42
  });

  const deepCavityMat = new T.MeshStandardMaterial({
    name: 'InterceptorCore_ObsidianMechanical',
    color: 0x12161f,
    metalness: 0.62,
    roughness: 0.50
  });

  const machinedAlloyMat = new T.MeshStandardMaterial({
    name: 'InterceptorTrim_BrushedTitanium',
    color: 0x8d99ac,
    metalness: 0.82,
    roughness: 0.26
  });

  const canopyGlassMat = new T.MeshStandardMaterial({
    name: 'DroneOptics_ObsidianCanopy',
    color: 0x0b1220,
    emissive: 0x08283e,
    emissiveIntensity: 0.45,
    metalness: 0.88,
    roughness: 0.12
  });

  const cyanGlowMat = new T.MeshStandardMaterial({
    name: 'PhaseDrive_CyanEnergyCore',
    color: 0x80f8ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 2.1,
    metalness: 0.15,
    roughness: 0.14
  });

  // Custom GLSL pulsing phase-capacitor energy strip shader for the signature nacelle windows
  const phaseCellUniforms = {
    uTime: { value: 0.0 },
    uWeaponLoad: { value: 0.0 }
  };
  const phaseCellShaderMat = new T.ShaderMaterial({
    name: 'PhaseNacelle_EnergyWindowShader',
    uniforms: phaseCellUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uWeaponLoad;
      void main() {
        float scan = sin(vUv.x * 26.0 - uTime * 9.0) * 0.5 + 0.5;
        float fineGrid = step(0.10, fract(vUv.x * 12.0)) * step(0.12, fract(vUv.y * 4.0));
        float edgeV = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.84, vUv.y);
        float edgeU = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        float pulse = 0.78 + 0.22 * sin(uTime * 5.2 + vUv.x * 6.2831);

        vec3 deepCyan = vec3(0.0, 0.58, 0.82);
        vec3 brightCyan = vec3(0.22, 0.96, 1.0);
        vec3 hotWhite = vec3(0.88, 1.0, 1.0);

        vec3 col = mix(deepCyan, brightCyan, 0.45 + 0.55 * scan);
        col += hotWhite * pow(scan, 4.0) * 0.45 * edgeV;
        col *= (0.72 + 0.28 * fineGrid) * (0.45 + 0.55 * edgeU * edgeV) * pulse;
        col *= (1.05 + uWeaponLoad * 0.25);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  // Nose aperture internal rail & iris materials (shift from subtle dark-cyan standby to blazing RED when firing!)
  const noseEmitterRailMat = new T.MeshStandardMaterial({
    name: 'NoseTipEmitter_FocusRail',
    color: 0xff5a68,
    emissive: 0xff1424,
    emissiveIntensity: 0.35,
    metalness: 0.35,
    roughness: 0.22
  });

  const noseTipLensMat = new T.MeshStandardMaterial({
    name: 'NoseTipEmitter_FocusLens',
    color: 0x38d8ff,
    emissive: 0x00d8ff,
    emissiveIntensity: 1.2,
    metalness: 0.20,
    roughness: 0.12
  });

  const tacticalRedTrimMat = new T.MeshStandardMaterial({
    name: 'InterceptorTrim_CrimsonMarking',
    color: 0xc81e30,
    emissive: 0x4a050c,
    emissiveIntensity: 0.25,
    metalness: 0.35,
    roughness: 0.35
  });

  // Custom GLSL RED Animated Laser Disruptor Plasma Sheath Shader
  const redLaserUniforms = {
    uTime: { value: 0.0 },
    uIntensity: { value: 0.0 }
  };
  const redLaserSheathMat = new T.ShaderMaterial({
    name: 'RedTipLaser_PlasmaSheathShader',
    uniforms: redLaserUniforms,
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
        float waveA = sin(uv.y * 88.0 - uTime * 48.0);
        float waveB = cos(uv.y * 140.0 - uTime * 72.0 + uv.x * 12.56637);
        float pulse = (waveA * 0.65 + waveB * 0.35) * 0.015 * uIntensity;
        vec3 displaced = position + normal * pulse;
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
        float coreMask = pow(ndotv, 1.35);
        float rimGlow = pow(1.0 - ndotv, 1.85);

        // High-speed helical red plasma currents racing forward from the tip along +Z
        float helixA = sin(vUv.x * 18.84955 + vUv.y * 116.0 - uTime * 42.0) * 0.5 + 0.5;
        float helixB = sin(-vUv.x * 12.56637 + vUv.y * 172.0 - uTime * 62.0) * 0.5 + 0.5;
        float surge = 0.74 + 0.26 * sin(vUv.y * 64.0 - uTime * 34.0);
        float plasmaStreaks = pow(helixA * 0.58 + helixB * 0.42, 1.85);

        float farFade = smoothstep(1.0, 0.93, vUv.y);
        float muzzleBoost = 1.0 + smoothstep(0.08, 0.0, vUv.y) * 0.65;

        vec3 deepCrimson = vec3(0.78, 0.02, 0.07);
        vec3 vividRed = vec3(1.0, 0.11, 0.16);
        vec3 fieryOrangeRed = vec3(1.0, 0.34, 0.12);
        vec3 whiteHotCore = vec3(1.0, 0.93, 0.90);

        vec3 col = mix(deepCrimson, vividRed, 0.45 + 0.55 * plasmaStreaks);
        col = mix(col, fieryOrangeRed, rimGlow * 0.42 * helixB);
        col += whiteHotCore * coreMask * (0.48 + plasmaStreaks * 0.62);
        col *= surge * muzzleBoost;

        float alpha = clamp((coreMask * 0.84 + plasmaStreaks * 0.56 + rimGlow * 0.32) * farFade * uIntensity, 0.0, 0.98);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  // ===========================================================================
  // ROOT HIERARCHY
  // ===========================================================================
  const rootGroup = new T.Group();
  rootGroup.name = 'DronePhaseInterceptor3_Root';

  const bodyGroup = new T.Group();
  bodyGroup.name = 'DronePhaseInterceptor3_Body';
  bodyGroup.position.set(0, BASE_CENTER_Y, 0);
  rootGroup.add(bodyGroup);

  // All structural airframe geometry is authored inside hullEnvelopeGroup in native GLB proportions
  // (X: ±0.766, Y: ±0.354, Z: ±0.951), then analytically calibrated to exact 2.11m x 0.98m x 2.63m.
  const hullEnvelopeGroup = new T.Group();
  hullEnvelopeGroup.name = 'InterceptorAirframe_Envelope';
  bodyGroup.add(hullEnvelopeGroup);

  // ===========================================================================
  // 1. CENTRAL FUSELAGE & SLOPED NOSE COWLING (+Z forward, -Z rear)
  // ===========================================================================
  const fuselageStations = [
    { z: -0.74, points: makeOctagonProfile(0.155, 0.145, -0.235, 0.105, 0.095, 0.045, 0.045) },
    { z: -0.56, points: makeOctagonProfile(0.220, 0.195, -0.255, 0.150, 0.135, 0.062, 0.055) },
    { z: -0.24, points: makeOctagonProfile(0.235, 0.228, -0.248, 0.155, 0.145, 0.068, 0.055) },
    { z:  0.10, points: makeOctagonProfile(0.215, 0.215, -0.225, 0.140, 0.135, 0.062, 0.052) },
    { z:  0.42, points: makeOctagonProfile(0.180, 0.135, -0.205, 0.115, 0.115, 0.052, 0.046) },
    { z:  0.72, points: makeOctagonProfile(0.132, 0.048, -0.192, 0.082, 0.088, 0.040, 0.040) },
    { z:  0.88, points: makeOctagonProfile(0.100, -0.008, -0.184, 0.056, 0.060, 0.036, 0.036) }
  ];
  const fuselageGeo = createLoftedSectionGeometry(T, fuselageStations, {
    capStart: true,
    capEnd: true,
    uvRepeatU: 2.0,
    uvRepeatV: 2.2,
    hardFacets: true
  });
  const fuselageMesh = new T.Mesh(fuselageGeo, whiteArmorMat);
  fuselageMesh.name = 'CentralFuselage_MainHull';
  hullEnvelopeGroup.add(fuselageMesh);

  // Dorsal raised armored spine ridge running behind the optical canopy
  const dorsalSpineStations = [
    { z: -0.71, points: makeOctagonProfile(0.120, 0.195, 0.110, 0.085, 0.105, 0.025, 0.020) },
    { z: -0.45, points: makeOctagonProfile(0.142, 0.242, 0.135, 0.102, 0.125, 0.030, 0.022) },
    { z: -0.05, points: makeOctagonProfile(0.138, 0.246, 0.140, 0.098, 0.122, 0.030, 0.022) },
    { z:  0.14, points: makeOctagonProfile(0.125, 0.218, 0.130, 0.088, 0.110, 0.026, 0.020) }
  ];
  const dorsalSpineMesh = new T.Mesh(
    createLoftedSectionGeometry(T, dorsalSpineStations, { hardFacets: true, uvRepeatU: 1.0, uvRepeatV: 1.5 }),
    whiteArmorMat
  );
  dorsalSpineMesh.name = 'DorsalArmorSpine_Ridge';
  hullEnvelopeGroup.add(dorsalSpineMesh);

  // Recessed dorsal spine cooling vents & subtle glowing cyan core strip
  for (let i = 0; i < 4; i++) {
    const vz = -0.54 + i * 0.145;
    const louver = new T.Mesh(new T.BoxGeometry(0.14, 0.018, 0.055), darkChassisMat);
    louver.position.set(0, 0.244, vz);
    louver.rotation.x = 0.18;
    hullEnvelopeGroup.add(louver);
  }
  const dorsalTelemetryStrip = new T.Mesh(new T.BoxGeometry(0.032, 0.014, 0.34), cyanGlowMat);
  dorsalTelemetryStrip.name = 'DorsalTelemetryConduit';
  dorsalTelemetryStrip.position.set(0, 0.247, -0.26);
  hullEnvelopeGroup.add(dorsalTelemetryStrip);

  // Recessed Obsidian Stealth Drone Optical Canopy (flush beveled wedge inlaid into sloped forward deck)
  const canopyStations = [
    { z: 0.06, points: makeOctagonProfile(0.118, 0.228, 0.155, 0.072, 0.105, 0.022, 0.012) },
    { z: 0.24, points: makeOctagonProfile(0.108, 0.194, 0.125, 0.064, 0.095, 0.022, 0.012) },
    { z: 0.46, points: makeOctagonProfile(0.072, 0.132, 0.082, 0.042, 0.064, 0.016, 0.010) }
  ];
  const canopyMesh = new T.Mesh(
    createLoftedSectionGeometry(T, canopyStations, { hardFacets: true }),
    canopyGlassMat
  );
  canopyMesh.name = 'DroneOptics_StealthCanopy';
  hullEnvelopeGroup.add(canopyMesh);

  // Subtle glowing cyan drone optical visor slit inlaid across the stealth canopy
  const opticSlit = new T.Mesh(new T.BoxGeometry(0.115, 0.012, 0.036), cyanGlowMat);
  opticSlit.name = 'DroneOptics_TelemetrySlit';
  opticSlit.position.set(0, 0.172, 0.31);
  opticSlit.rotation.x = 0.26;
  hullEnvelopeGroup.add(opticSlit);

  // Flush canopy cheek fairings, lateral forward intake vents, and crimson tactical accent stripes
  [-1, 1].forEach((side) => {
    const rail = new T.Mesh(new T.BoxGeometry(0.028, 0.026, 0.36), whiteArmorMat);
    rail.position.set(side * 0.114, 0.158, 0.24);
    rail.rotation.x = 0.265;
    rail.rotation.y = -side * 0.105;
    hullEnvelopeGroup.add(rail);

    // Lateral forward nose intake vents (matching dark recessed side slots in thumbnail/GLB)
    const cheekVentHousing = new T.Mesh(new T.BoxGeometry(0.024, 0.044, 0.20), darkChassisMat);
    cheekVentHousing.position.set(side * 0.148, -0.048, 0.56);
    cheekVentHousing.rotation.y = -side * 0.155;
    hullEnvelopeGroup.add(cheekVentHousing);

    const cheekGlow = new T.Mesh(new T.BoxGeometry(0.012, 0.012, 0.14), cyanGlowMat);
    cheekGlow.position.set(side * 0.156, -0.048, 0.56);
    cheekGlow.rotation.y = -side * 0.155;
    hullEnvelopeGroup.add(cheekGlow);

    // Flush subtle red interceptor trim chevron along upper nose shoulder
    const chevron = new T.Mesh(new T.BoxGeometry(0.020, 0.010, 0.24), tacticalRedTrimMat);
    chevron.position.set(side * 0.104, 0.070, 0.58);
    chevron.rotation.x = 0.285;
    chevron.rotation.y = -side * 0.14;
    hullEnvelopeGroup.add(chevron);
  });

  // Forward Nose Laser Cannon Barrel Shroud & Articulated 6-Petal Aperture (Exact +Z Tip)
  const NOSE_TIP_Y = -0.096;
  const NOSE_TIP_Z = 0.942;

  const noseTipGroup = new T.Group();
  noseTipGroup.name = 'NoseTip_LaserCannonHousing';
  noseTipGroup.position.set(0, NOSE_TIP_Y, 0.875);
  hullEnvelopeGroup.add(noseTipGroup);

  // Outer beveled white ceramic cannon shroud collar
  const barrelShroudProfile = [
    new T.Vector2(0.072, -0.055),
    new T.Vector2(0.104, -0.032),
    new T.Vector2(0.100,  0.042),
    new T.Vector2(0.088,  0.066),
    new T.Vector2(0.068,  0.066),
    new T.Vector2(0.058,  0.045),
    new T.Vector2(0.058, -0.045)
  ];
  const barrelShroudGeo = new T.LatheGeometry(barrelShroudProfile, 16);
  barrelShroudGeo.rotateX(Math.PI * 0.5);
  const barrelShroudMesh = new T.Mesh(barrelShroudGeo, whiteArmorMat);
  barrelShroudMesh.name = 'NoseTip_CeramicShroud';
  noseTipGroup.add(barrelShroudMesh);

  // Dark gunmetal inner laser collimator bore
  const boreCylinderGeo = new T.CylinderGeometry(0.056, 0.062, 0.12, 20, 1, true);
  boreCylinderGeo.rotateX(Math.PI * 0.5);
  const boreMesh = new T.Mesh(boreCylinderGeo, deepCavityMat);
  boreMesh.position.z = 0.015;
  noseTipGroup.add(boreMesh);

  // Glowing inner collimator ring right inside the nose tip
  const boreGlowRing = new T.Mesh(new T.TorusGeometry(0.055, 0.008, 10, 28), noseTipLensMat);
  boreGlowRing.name = 'NoseTip_CollimatorRing';
  boreGlowRing.position.z = 0.058;
  noseTipGroup.add(boreGlowRing);

  // Recessed central focusing emitter crystal lens
  const emitterLens = new T.Mesh(new T.SphereGeometry(0.042, 18, 14), noseTipLensMat);
  emitterLens.name = 'NoseTip_FocusingLens';
  emitterLens.scale.set(1.0, 1.0, 0.45);
  emitterLens.position.z = 0.038;
  noseTipGroup.add(emitterLens);

  // 6 Articulated Micro-Aperture Focus Petals ringing the nose tip
  const nosePetals = [];
  const petalOuterGeo = createBeveledPlate(T, 0.042, 0.058, 0.016, 0.009, 0.004);
  const petalRailGeo = new T.BoxGeometry(0.012, 0.046, 0.010);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const pPivot = new T.Group();
    pPivot.name = `NoseAperturePetalPivot_${i}`;
    pPivot.rotation.z = ang;

    const petal = new T.Group();
    petal.name = `NoseAperturePetal_${i}`;
    petal.position.set(0, 0.072, 0.052);
    petal.rotation.x = 0.34;

    const plate = new T.Mesh(petalOuterGeo, i % 2 === 0 ? secondaryArmorMat : darkChassisMat);
    const rail = new T.Mesh(petalRailGeo, noseEmitterRailMat);
    rail.position.set(0, 0.002, -0.010);
    petal.add(plate, rail);
    pPivot.add(petal);
    noseTipGroup.add(pPivot);

    nosePetals.push({
      petal,
      baseY: 0.072,
      baseZ: 0.052,
      baseRotX: 0.34
    });
  }

  // Ventral Chin Auxiliary Barrel / Targeting Sensor Pod (directly underneath the nose tip)
  const chinPodGroup = new T.Group();
  chinPodGroup.name = 'VentralChin_SensorPod';
  chinPodGroup.position.set(0, -0.238, 0.62);
  hullEnvelopeGroup.add(chinPodGroup);

  const chinBodyGeo = new T.CylinderGeometry(0.050, 0.068, 0.44, 12);
  chinBodyGeo.rotateX(Math.PI * 0.5);
  chinPodGroup.add(new T.Mesh(chinBodyGeo, secondaryArmorMat));

  const chinMuzzleCollar = new T.Mesh(new T.CylinderGeometry(0.054, 0.054, 0.06, 12), darkChassisMat);
  chinMuzzleCollar.rotation.x = Math.PI * 0.5;
  chinMuzzleCollar.position.z = 0.21;
  chinPodGroup.add(chinMuzzleCollar);

  const chinLens = new T.Mesh(new T.CylinderGeometry(0.036, 0.036, 0.02, 16), cyanGlowMat);
  chinLens.rotation.x = Math.PI * 0.5;
  chinLens.position.z = 0.24;
  chinPodGroup.add(chinLens);

  // Ventral Keel Underbelly Armor Spine & Heat-Sink Ribs
  const keelMesh = new T.Mesh(createBeveledPlate(T, 0.22, 0.11, 1.18, 0.04, 0.016), darkChassisMat);
  keelMesh.name = 'VentralKeel_StructuralSpine';
  keelMesh.position.set(0, -0.275, -0.04);
  hullEnvelopeGroup.add(keelMesh);

  for (let k = 0; k < 6; k++) {
    const rib = new T.Mesh(new T.BoxGeometry(0.25, 0.022, 0.036), machinedAlloyMat);
    rib.position.set(0, -0.322, -0.45 + k * 0.16);
    hullEnvelopeGroup.add(rib);
  }

  // Rear Vertical Louvered Main Exhaust Housing (-Z, matching iconic GLB rear slats!)
  const rearExhaustGroup = new T.Group();
  rearExhaustGroup.name = 'RearMainThruster_LouveredHousing';
  rearExhaustGroup.position.set(0, -0.045, -0.745);
  hullEnvelopeGroup.add(rearExhaustGroup);

  // Beveled rectangular white outer exhaust collar
  const collarShape = new T.Shape();
  collarShape.moveTo(-0.11, -0.185);
  collarShape.lineTo( 0.11, -0.185);
  collarShape.lineTo( 0.155, -0.135);
  collarShape.lineTo( 0.155,  0.135);
  collarShape.lineTo( 0.11,  0.185);
  collarShape.lineTo(-0.11,  0.185);
  collarShape.lineTo(-0.155,  0.135);
  collarShape.lineTo(-0.155, -0.135);
  collarShape.closePath();

  const holePath = new T.Path();
  holePath.moveTo(-0.088, -0.148);
  holePath.lineTo(-0.118, -0.108);
  holePath.lineTo(-0.118,  0.108);
  holePath.lineTo(-0.088,  0.148);
  holePath.lineTo( 0.088,  0.148);
  holePath.lineTo( 0.118,  0.108);
  holePath.lineTo( 0.118, -0.108);
  holePath.lineTo( 0.088, -0.148);
  holePath.closePath();
  collarShape.holes.push(holePath);

  const collarGeo = new T.ExtrudeGeometry(collarShape, {
    depth: 0.095,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 2
  });
  collarGeo.center();
  rearExhaustGroup.add(new T.Mesh(normalizeExtrudeUVs(collarGeo), whiteArmorMat));

  // Deep dark thruster chamber backing
  const chamberBack = new T.Mesh(new T.BoxGeometry(0.22, 0.28, 0.03), deepCavityMat);
  chamberBack.position.z = 0.03;
  rearExhaustGroup.add(chamberBack);

  // Inner cyan reactor glow plate behind the vertical louvers
  const mainReactorGlowMat = new T.MeshBasicMaterial({
    name: 'RearMainThruster_ReactorGlow',
    color: 0x00d8ff,
    transparent: true,
    opacity: 0.58
  });
  const reactorGlowPlate = new T.Mesh(new T.PlaneGeometry(0.20, 0.25), mainReactorGlowMat);
  reactorGlowPlate.position.z = 0.012;
  reactorGlowPlate.rotation.y = Math.PI;
  rearExhaustGroup.add(reactorGlowPlate);

  // 7 crisp vertical thrust-vectoring metallic louvers (exact match to GLB rear!)
  const louverGeo = new T.BoxGeometry(0.013, 0.285, 0.075);
  for (let i = -3; i <= 3; i++) {
    const slat = new T.Mesh(louverGeo, i % 2 === 0 ? machinedAlloyMat : darkChassisMat);
    slat.position.set(i * 0.030, 0, -0.012);
    rearExhaustGroup.add(slat);
  }

  // ===========================================================================
  // 2. SWEPT DELTA LOWER WINGS & OUTBOARD BEVELED WING-POD PONTOONS (±X)
  // ===========================================================================
  const buildWingSide = (side) => {
    const wingGroup = new T.Group();
    wingGroup.name = side > 0 ? 'WingAssembly_Starboard' : 'WingAssembly_Port';

    // Inner swept delta wing deck (Extruded in XZ plane by building in XY then rotating X)
    const wingShape = new T.Shape();
    // Note: rotateX(-PI/2) maps shape (x, y) -> (x, 0, -y), so shapeY = -Z!
    wingShape.moveTo(side * 0.14, -0.64);   // Front inner root (Z = +0.64)
    wingShape.lineTo(side * 0.58, -0.14);   // Swept leading edge shoulder (Z = +0.14)
    wingShape.lineTo(side * 0.62,  0.46);   // Outer aft shoulder (Z = -0.46)
    wingShape.lineTo(side * 0.44,  0.62);   // Aft pod root (Z = -0.62)
    wingShape.lineTo(side * 0.24,  0.54);   // Inner aft cutout (Z = -0.54)
    wingShape.lineTo(side * 0.17,  0.42);   // Fuselage rear join (Z = -0.42)
    wingShape.closePath();

    const wingDeckGeo = new T.ExtrudeGeometry(wingShape, {
      depth: 0.072,
      bevelEnabled: true,
      bevelThickness: 0.026,
      bevelSize: 0.022,
      bevelSegments: 2
    });
    wingDeckGeo.rotateX(-Math.PI * 0.5);
    normalizeExtrudeUVs(wingDeckGeo, 'x', 'z', 1.4, 1.6);

    const wingDeckMesh = new T.Mesh(wingDeckGeo, whiteArmorMat);
    wingDeckMesh.name = side > 0 ? 'DeltaWingDeck_Starboard' : 'DeltaWingDeck_Port';
    wingDeckMesh.position.y = -0.215;
    wingGroup.add(wingDeckMesh);

    // Upper armored wing strake plate (stepped relief detail)
    const strakeShape = new T.Shape();
    strakeShape.moveTo(side * 0.21, -0.44);
    strakeShape.lineTo(side * 0.48, -0.06);
    strakeShape.lineTo(side * 0.48,  0.34);
    strakeShape.lineTo(side * 0.24,  0.32);
    strakeShape.closePath();
    const strakeGeo = new T.ExtrudeGeometry(strakeShape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelThickness: 0.010,
      bevelSize: 0.010,
      bevelSegments: 1
    });
    strakeGeo.rotateX(-Math.PI * 0.5);
    normalizeExtrudeUVs(strakeGeo, 'x', 'z', 1.0, 1.0);
    const strakeMesh = new T.Mesh(strakeGeo, secondaryArmorMat);
    strakeMesh.position.y = -0.125;
    wingGroup.add(strakeMesh);

    // Subtle crimson tactical interceptor stripe on inner delta wing surface
    const wingStripe = new T.Mesh(new T.BoxGeometry(0.028, 0.008, 0.44), tacticalRedTrimMat);
    wingStripe.position.set(side * 0.34, -0.090, 0.02);
    wingStripe.rotation.y = side * 0.42;
    wingGroup.add(wingStripe);

    // Recessed dark mechanical bay & cyan wing-deck capacitor strip
    const deckGlowBezel = new T.Mesh(new T.BoxGeometry(0.095, 0.018, 0.19), darkChassisMat);
    deckGlowBezel.position.set(side * 0.44, -0.105, -0.06);
    deckGlowBezel.rotation.y = side * 0.08;
    wingGroup.add(deckGlowBezel);

    const deckGlow = new T.Mesh(new T.BoxGeometry(0.065, 0.014, 0.145), cyanGlowMat);
    deckGlow.position.set(side * 0.44, -0.097, -0.06);
    deckGlow.rotation.y = side * 0.08;
    wingGroup.add(deckGlow);

    // Heavy Outboard Beveled Flanking Wing-Pod Pontoon (reaching full ±0.766m span!)
    const podStations = [
      { z: -0.64, points: makeOctagonProfile(0.090, -0.088, -0.268, 0.056, 0.056, 0.032, 0.032, side * 0.545) },
      { z: -0.44, points: makeOctagonProfile(0.145, -0.072, -0.292, 0.098, 0.098, 0.044, 0.044, side * 0.605) },
      { z: -0.14, points: makeOctagonProfile(0.156, -0.070, -0.296, 0.108, 0.108, 0.046, 0.046, side * 0.610) },
      { z:  0.18, points: makeOctagonProfile(0.138, -0.082, -0.288, 0.092, 0.092, 0.042, 0.042, side * 0.568) },
      { z:  0.46, points: makeOctagonProfile(0.088, -0.118, -0.272, 0.052, 0.052, 0.032, 0.032, side * 0.445) },
      { z:  0.64, points: makeOctagonProfile(0.040, -0.156, -0.242, 0.022, 0.022, 0.018, 0.018, side * 0.285) }
    ];
    const podMesh = new T.Mesh(
      createLoftedSectionGeometry(T, podStations, { hardFacets: true, uvRepeatU: 1.4, uvRepeatV: 1.8 }),
      whiteArmorMat
    );
    podMesh.name = side > 0 ? 'OutboardWingPod_Starboard' : 'OutboardWingPod_Port';
    wingGroup.add(podMesh);

    // Recessed cyan phase-cell on top/outer shoulder of outboard wing pod (seen in thumbnail.png!)
    const podCellBezel = new T.Mesh(new T.BoxGeometry(0.095, 0.024, 0.20), darkChassisMat);
    podCellBezel.position.set(side * 0.612, -0.074, -0.04);
    wingGroup.add(podCellBezel);

    const podCellGlow = new T.Mesh(new T.BoxGeometry(0.072, 0.016, 0.155), phaseCellShaderMat);
    podCellGlow.position.set(side * 0.612, -0.064, -0.04);
    wingGroup.add(podCellGlow);

    // Outer wingtip side dark trim groove & forward LED wingtip strobe
    const sideGroove = new T.Mesh(new T.BoxGeometry(0.022, 0.038, 0.56), darkChassisMat);
    sideGroove.position.set(side * 0.758, -0.184, -0.16);
    wingGroup.add(sideGroove);

    const tipGlow = new T.Mesh(new T.BoxGeometry(0.016, 0.016, 0.22), cyanGlowMat);
    tipGlow.position.set(side * 0.764, -0.184, -0.10);
    wingGroup.add(tipGlow);

    // Rear Auxiliary Circular Maneuvering Nozzle on each wing pod (visible in REAR_3Q!)
    const auxNozzle = new T.Group();
    auxNozzle.name = side > 0 ? 'AuxWingThruster_Starboard' : 'AuxWingThruster_Port';
    auxNozzle.position.set(side * 0.545, -0.178, -0.652);

    const auxLip = new T.Mesh(new T.CylinderGeometry(0.068, 0.078, 0.06, 18, 1, true), machinedAlloyMat);
    auxLip.rotation.x = Math.PI * 0.5;
    auxNozzle.add(auxLip);

    const auxInner = new T.Mesh(new T.CylinderGeometry(0.056, 0.056, 0.05, 16), deepCavityMat);
    auxInner.rotation.x = Math.PI * 0.5;
    auxInner.position.z = 0.015;
    auxNozzle.add(auxInner);

    const auxRing = new T.Mesh(new T.TorusGeometry(0.048, 0.008, 8, 20), cyanGlowMat);
    auxRing.position.z = -0.018;
    auxNozzle.add(auxRing);

    wingGroup.add(auxNozzle);

    // Ventral under-wing structural dark rib & stabilizer strake
    const ventralRib = new T.Mesh(new T.BoxGeometry(0.065, 0.042, 0.72), darkChassisMat);
    ventralRib.position.set(side * 0.39, -0.278, -0.08);
    ventralRib.rotation.y = side * 0.14;
    wingGroup.add(ventralRib);

    return wingGroup;
  };

  hullEnvelopeGroup.add(buildWingSide(1), buildWingSide(-1));

  // ===========================================================================
  // 3. DARK MECHANICAL INTER-STAGE CORE & NACELLE PYLON STRUTS
  // ===========================================================================
  const mechCoreBlock = new T.Mesh(new T.BoxGeometry(0.76, 0.16, 0.62), darkChassisMat);
  mechCoreBlock.name = 'MidChassis_DarkMechanicalCore';
  mechCoreBlock.position.set(0, -0.02, -0.22);
  hullEnvelopeGroup.add(mechCoreBlock);

  // Exposed titanium power conduits bridging fuselage to upper nacelles
  [-1, 1].forEach((side) => {
    const pylonMain = new T.Mesh(createBeveledPlate(T, 0.34, 0.088, 0.36, 0.025, 0.010), darkChassisMat);
    pylonMain.name = side > 0 ? 'NacellePylon_Starboard' : 'NacellePylon_Port';
    pylonMain.position.set(side * 0.30, 0.075, -0.24);
    pylonMain.rotation.z = side * 0.36;
    hullEnvelopeGroup.add(pylonMain);

    const pylonArmorCap = new T.Mesh(createBeveledPlate(T, 0.24, 0.036, 0.26, 0.016, 0.007), secondaryArmorMat);
    pylonArmorCap.position.set(side * 0.29, 0.118, -0.24);
    pylonArmorCap.rotation.z = side * 0.36;
    hullEnvelopeGroup.add(pylonArmorCap);

    // Dual cylindrical hydraulic/coolant transfer pipes underneath each pylon
    for (let c = 0; c < 2; c++) {
      const pipe = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.30, 10), machinedAlloyMat);
      pipe.position.set(side * 0.31, 0.018, -0.34 + c * 0.16);
      pipe.rotation.z = side * 1.18;
      hullEnvelopeGroup.add(pipe);
    }
  });

  // ===========================================================================
  // 4. TWIN ELEVATED UPPER PHASE-DRIVE NACELLES & CANTED REAR TAIL FINS
  // ===========================================================================
  const intakeTurbines = [];
  const ionPlumes = [];

  const ionPlumeMat = new T.MeshBasicMaterial({
    name: 'PhaseDrive_IonThrustPlume',
    color: 0x00e8ff,
    transparent: true,
    opacity: 0.44,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });

  const buildUpperNacelle = (side) => {
    const nacGroup = new T.Group();
    nacGroup.name = side > 0 ? 'UpperPhaseNacelle_Starboard' : 'UpperPhaseNacelle_Port';
    nacGroup.position.set(side * 0.472, 0.162, -0.22);

    // Sculpted beveled octagonal nacelle cowling (Z local: -0.44 rear .. +0.40 front intake)
    const nacStations = [
      { z: -0.43, points: makeOctagonProfile(0.112, 0.105, -0.105, 0.068, 0.068, 0.042, 0.042) },
      { z: -0.30, points: makeOctagonProfile(0.148, 0.130, -0.122, 0.095, 0.095, 0.048, 0.048) },
      { z:  0.16, points: makeOctagonProfile(0.150, 0.132, -0.122, 0.098, 0.098, 0.048, 0.048) },
      { z:  0.34, points: makeOctagonProfile(0.138, 0.125, -0.118, 0.085, 0.085, 0.046, 0.046) },
      { z:  0.41, points: makeOctagonProfile(0.122, 0.114, -0.110, 0.072, 0.072, 0.044, 0.044) }
    ];
    const nacBody = new T.Mesh(
      createLoftedSectionGeometry(T, nacStations, { hardFacets: true, uvRepeatU: 1.4, uvRepeatV: 1.6 }),
      whiteArmorMat
    );
    nacBody.name = side > 0 ? 'NacelleCowling_Starboard' : 'NacelleCowling_Port';
    nacGroup.add(nacBody);

    // Top nacelle dorsal armor cap & cooling louvers
    const topCap = new T.Mesh(createBeveledPlate(T, 0.16, 0.028, 0.56, 0.030, 0.008), secondaryArmorMat);
    topCap.position.set(0, 0.136, -0.05);
    nacGroup.add(topCap);

    // Signature OUTER FLANK Glowing Cyan Phase-Capacitor Window + Rear Square Vent (clearly recessed in bezel!)
    const windowBezelBack = new T.Mesh(new T.BoxGeometry(0.020, 0.104, 0.46), darkChassisMat);
    windowBezelBack.position.set(side * 0.142, 0.006, -0.02);
    nacGroup.add(windowBezelBack);

    // Top & bottom beveled bezel framing rails around the bright cyan energy core strip
    [-1, 1].forEach((vDir) => {
      const rail = new T.Mesh(new T.BoxGeometry(0.028, 0.016, 0.45), darkChassisMat);
      rail.position.set(side * 0.152, 0.006 + vDir * 0.044, -0.02);
      nacGroup.add(rail);
    });
    const midDivider = new T.Mesh(new T.BoxGeometry(0.028, 0.098, 0.022), secondaryArmorMat);
    midDivider.position.set(side * 0.152, 0.006, -0.145);
    nacGroup.add(midDivider);

    // Unobstructed glowing cyan GLSL energy cell strip proud of dark backing!
    const energyWindow = new T.Mesh(new T.BoxGeometry(0.016, 0.072, 0.34), phaseCellShaderMat);
    energyWindow.name = side > 0 ? 'NacelleEnergyWindow_Starboard' : 'NacelleEnergyWindow_Port';
    energyWindow.position.set(side * 0.154, 0.006, 0.035);
    nacGroup.add(energyWindow);

    // Secondary aft sensor/vent pocket right behind the main cyan strip
    const aftPocket = new T.Mesh(new T.BoxGeometry(0.022, 0.070, 0.088), machinedAlloyMat);
    aftPocket.position.set(side * 0.150, 0.006, -0.20);
    nacGroup.add(aftPocket);

    const aftPocketCore = new T.Mesh(new T.BoxGeometry(0.016, 0.044, 0.056), cyanGlowMat);
    aftPocketCore.position.set(side * 0.158, 0.006, -0.20);
    nacGroup.add(aftPocketCore);

    // FRONT Circular Phase-Drive Intake Ring & Spinning 8-Blade Turbine (Z = +0.41)
    const intakeGroup = new T.Group();
    intakeGroup.name = side > 0 ? 'NacelleIntake_Starboard' : 'NacelleIntake_Port';
    intakeGroup.position.set(0, 0.002, 0.405);
    nacGroup.add(intakeGroup);

    const intakeOuterRing = new T.Mesh(new T.TorusGeometry(0.105, 0.022, 12, 28), whiteArmorMat);
    intakeGroup.add(intakeOuterRing);

    const intakeInnerCavity = new T.Mesh(new T.CylinderGeometry(0.092, 0.085, 0.11, 24), deepCavityMat);
    intakeInnerCavity.rotation.x = Math.PI * 0.5;
    intakeInnerCavity.position.z = -0.05;
    intakeGroup.add(intakeInnerCavity);

    const intakeGlowRing = new T.Mesh(new T.TorusGeometry(0.084, 0.010, 10, 28), cyanGlowMat);
    intakeGlowRing.position.z = 0.004;
    intakeGroup.add(intakeGlowRing);

    // Spinning 8-blade compressor/phase-turbine rotor inside the intake
    const turbineRotor = new T.Group();
    turbineRotor.name = side > 0 ? 'IntakeTurbineRotor_Starboard' : 'IntakeTurbineRotor_Port';
    turbineRotor.position.z = -0.015;
    const hubCone = new T.Mesh(new T.ConeGeometry(0.028, 0.068, 12), machinedAlloyMat);
    hubCone.rotation.x = Math.PI * 0.5;
    hubCone.position.z = 0.018;
    turbineRotor.add(hubCone);

    const bladeGeo = new T.BoxGeometry(0.018, 0.072, 0.006);
    for (let b = 0; b < 8; b++) {
      const ba = (b / 8) * Math.PI * 2;
      const blade = new T.Mesh(bladeGeo, b % 2 === 0 ? machinedAlloyMat : darkChassisMat);
      blade.position.set(Math.cos(ba) * 0.044, Math.sin(ba) * 0.044, 0);
      blade.rotation.z = ba - Math.PI * 0.5;
      blade.rotation.y = side * 0.42;
      turbineRotor.add(blade);
    }
    intakeGroup.add(turbineRotor);
    intakeTurbines.push({ rotor: turbineRotor, dir: side });

    // REAR Circular Nacelle Ion Thruster Nozzle & Animated Ion Plume (Z = -0.44)
    const rearNozzle = new T.Group();
    rearNozzle.position.set(0, 0, -0.435);
    nacGroup.add(rearNozzle);

    const nozzleRing = new T.Mesh(new T.CylinderGeometry(0.086, 0.098, 0.075, 20, 1, true), darkChassisMat);
    nozzleRing.rotation.x = Math.PI * 0.5;
    rearNozzle.add(nozzleRing);

    const nozzleGlow = new T.Mesh(new T.TorusGeometry(0.068, 0.010, 10, 24), cyanGlowMat);
    nozzleGlow.position.z = -0.022;
    rearNozzle.add(nozzleGlow);

    const nozzleCore = new T.Mesh(new T.CircleGeometry(0.064, 20), cyanGlowMat);
    nozzleCore.rotation.y = Math.PI;
    nozzleCore.position.z = 0.005;
    rearNozzle.add(nozzleCore);

    // Subtle animated translucent cyan ion exhaust plume (kept compact inside tail envelope!)
    const plumeGeo = new T.ConeGeometry(0.058, 0.24, 16, 1, true);
    plumeGeo.rotateX(-Math.PI * 0.5);
    plumeGeo.translate(0, 0, -0.12);
    const plumeMesh = new T.Mesh(plumeGeo, ionPlumeMat);
    plumeMesh.name = side > 0 ? 'IonExhaustPlume_Starboard' : 'IonExhaustPlume_Port';
    plumeMesh.position.z = -0.01;
    plumeMesh.userData.noShadow = true;
    plumeMesh.castShadow = false;
    rearNozzle.add(plumeMesh);
    ionPlumes.push(plumeMesh);

    // UPWARD-CANTED REAR STABILIZER TAIL FIN / WINGLET (extending to Z = -0.95, Y = +0.35!)
    const finGroup = new T.Group();
    finGroup.name = side > 0 ? 'RearTailStabilizer_Starboard' : 'RearTailStabilizer_Port';
    finGroup.position.set(side * 0.025, 0.048, -0.35);
    // Sweep backward (-Z) and tilt upward (~28 deg pitch) with slight outward cant
    finGroup.rotation.order = 'YXZ';
    finGroup.rotation.x = 0.46;
    finGroup.rotation.z = -side * 0.14;

    const finShape = new T.Shape();
    finShape.moveTo(0.0,  0.00);
    finShape.lineTo(0.0,  0.14);
    finShape.lineTo(-0.42, 0.105);
    finShape.lineTo(-0.46, 0.035);
    finShape.lineTo(-0.34, -0.02);
    finShape.lineTo(0.0, -0.04);
    finShape.closePath();

    const finGeo = new T.ExtrudeGeometry(finShape, {
      depth: 0.044,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 2
    });
    finGeo.translate(0, 0, -0.022);
    // Rotate so fin shape -X points along -Z (rearward) and thickness lies along X
    finGeo.rotateY(-Math.PI * 0.5);
    normalizeExtrudeUVs(finGeo, 'z', 'y', 1.2, 1.0);

    const finMesh = new T.Mesh(finGeo, whiteArmorMat);
    finGroup.add(finMesh);

    // Fin leading-edge dark carbon trim & glowing cyan tip marker
    const finTrim = new T.Mesh(new T.BoxGeometry(0.056, 0.022, 0.34), darkChassisMat);
    finTrim.position.set(0, 0.128, -0.22);
    finTrim.rotation.x = -0.08;
    finGroup.add(finTrim);

    const finStrobe = new T.Mesh(new T.BoxGeometry(0.046, 0.028, 0.032), cyanGlowMat);
    finStrobe.position.set(0, 0.072, -0.455);
    finGroup.add(finStrobe);

    nacGroup.add(finGroup);
    return nacGroup;
  };

  hullEnvelopeGroup.add(buildUpperNacelle(1), buildUpperNacelle(-1));

  // ===========================================================================
  // 5. EXACT ANALYTICAL CALIBRATION -> 2.11m (W) x 0.98m (H) x 2.63m (L)
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

  // Compute exact calibrated nose tip laser origin in bodyGroup local coordinates
  const tipOriginLocal = new T.Vector3(0, NOSE_TIP_Y, NOSE_TIP_Z);
  tipOriginLocal.applyMatrix4(hullEnvelopeGroup.matrix);
  const calibratedTipX = tipOriginLocal.x;
  const calibratedTipY = tipOriginLocal.y;
  const calibratedTipZ = tipOriginLocal.z;

  metadata.laserOrigin = {
    x: Number(calibratedTipX.toFixed(4)),
    y: Number((BASE_CENTER_Y + calibratedTipY).toFixed(4)),
    z: Number(calibratedTipZ.toFixed(4))
  };

  // ===========================================================================
  // 6. AMBIENT PHASE-DRIVE MICRO-ION PARTICLES (Contained Inside Hull Bounds)
  // ===========================================================================
  const ionParticleCount = 96;
  const ionSeeds = [];
  const ionPositions = new Float32Array(ionParticleCount * 3);
  const ionColors = new Float32Array(ionParticleCount * 3);
  const tmpColor = new T.Color();

  for (let i = 0; i < ionParticleCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const u = rand();
    const ang = rand() * Math.PI * 2;
    const rad = 0.04 + rand() * 0.14;
    const baseZ = -0.35 - rand() * 0.72;
    ionSeeds.push({ side, u, ang, rad, baseZ, speed: 1.0 + Math.round(rand() * 2.0) });

    ionPositions[i * 3] = side * 0.65 + Math.cos(ang) * rad;
    ionPositions[i * 3 + 1] = 0.22 + Math.sin(ang) * rad;
    ionPositions[i * 3 + 2] = baseZ;

    tmpColor.setHex(rand() > 0.25 ? 0x22e8ff : 0x93f5ff);
    ionColors[i * 3] = tmpColor.r;
    ionColors[i * 3 + 1] = tmpColor.g;
    ionColors[i * 3 + 2] = tmpColor.b;
  }

  const ionPointsGeo = new T.BufferGeometry();
  ionPointsGeo.setAttribute('position', new T.BufferAttribute(ionPositions, 3));
  ionPointsGeo.setAttribute('color', new T.BufferAttribute(ionColors, 3));
  const ionPointsMat = new T.PointsMaterial({
    name: 'PhaseDrive_WakeParticles',
    size: 0.055,
    map: cyanIonTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const ionParticles = new T.Points(ionPointsGeo, ionPointsMat);
  ionParticles.name = 'PhaseDrive_WakeSwarm';
  bodyGroup.add(ionParticles);

  // ===========================================================================
  // 7. DECAL-CONTROLLED RED ANIMATED TIP LASER WEAPON
  //    Controlled via meshy_test_0/index.html Decals Tab & Global Decal APIs:
  //      - window.toggleDecalMesh('Decal_LaserBurn_Tip_Laser_Weapon', true/false)
  //      - window.DECAL_CONFIG.burnsEnabled = true/false; window.applyDecalsVisibility()
  //      - window.DECAL_CONFIG.allEnabled = true/false; window.applyDecalsVisibility()
  //      - window.DECAL_CONFIG.opacity = 0..1; window.applyDecalsVisibility()
  //      - weaponDecalMesh.visible = true/false
  // ===========================================================================
  const weaponDecalControlMat = new T.MeshBasicMaterial({
    name: 'Decal_LaserBurn_Tip_Laser_Weapon_Mat',
    color: 0xff2233,
    transparent: true,
    opacity: 1.0,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  // Seated cleanly at the exact nose emitter mouth (radius 0.032 inside tip so Box3 stays exact 2.63m!)
  const weaponDecalMesh = new T.Mesh(new T.SphereGeometry(0.032, 16, 14), weaponDecalControlMat);
  weaponDecalMesh.name = weaponDecalName;
  weaponDecalMesh.position.set(calibratedTipX, calibratedTipY, calibratedTipZ - 0.025);
  weaponDecalMesh.userData.noShadow = true;
  weaponDecalMesh.userData.isDecal = true;
  weaponDecalMesh.userData.decalType = 'laser';
  weaponDecalMesh.castShadow = false;
  weaponDecalMesh.receiveShadow = false;
  bodyGroup.add(weaponDecalMesh);

  // Dynamic crimson weapon point light at the nose tip (casts red weapon glow on white nose armor)
  const muzzleLight = new T.PointLight(0xff1e2d, 0.0, 7.5, 1.5);
  muzzleLight.position.set(calibratedTipX, calibratedTipY + 0.03, calibratedTipZ + 0.24);
  bodyGroup.add(muzzleLight);

  // Main RED animated laser beam assembly (child of weaponDecalMesh; parked collapsed at load time
  // so meshy_test_0 Box3 measurement captures strictly the 2.11m x 0.98m x 2.63m drone airframe!)
  const laserAssembly = new T.Group();
  laserAssembly.name = 'TipRedLaserWeapon_Assembly';
  laserAssembly.position.set(0, 0, 0.025);
  laserAssembly.scale.setScalar(0.0001);
  laserAssembly.visible = false;
  weaponDecalMesh.add(laserAssembly);

  // Layer 1: Incandescent White-Red Core Lance emitting from exact tip (z = 0 -> +LASER_LENGTH)
  const coreGeo = new T.CylinderGeometry(0.032, 0.046, LASER_LENGTH, 16, 1, true);
  coreGeo.rotateX(Math.PI * 0.5);
  coreGeo.translate(0, 0, LASER_LENGTH * 0.5);
  const coreMat = new T.MeshBasicMaterial({
    name: 'RedTipLaser_IncandescentCore',
    color: 0xffe8e6,
    transparent: true,
    opacity: 0.98,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const coreMesh = new T.Mesh(coreGeo, coreMat);
  coreMesh.name = 'RedLaser_CoreLance';
  coreMesh.userData.noShadow = true;
  coreMesh.castShadow = false;
  coreMesh.frustumCulled = false;
  laserAssembly.add(coreMesh);

  // Layer 2: Custom GLSL Crimson-Red Plasma Disruptor Sheath
  const sheathGeo = new T.CylinderGeometry(0.095, 0.125, LASER_LENGTH, 24, 64, true);
  sheathGeo.rotateX(Math.PI * 0.5);
  sheathGeo.translate(0, 0, LASER_LENGTH * 0.5);
  const sheathMesh = new T.Mesh(sheathGeo, redLaserSheathMat);
  sheathMesh.name = 'RedLaser_PlasmaSheath';
  sheathMesh.userData.noShadow = true;
  sheathMesh.castShadow = false;
  sheathMesh.frustumCulled = false;
  laserAssembly.add(sheathMesh);

  // Layer 3: Soft Fresnel-Falloff Outer Crimson Volumetric Glow Halo (no hard cylinder edge!)
  const auraGeo = new T.CylinderGeometry(0.24, 0.30, LASER_LENGTH, 24, 1, true);
  auraGeo.rotateX(Math.PI * 0.5);
  auraGeo.translate(0, 0, LASER_LENGTH * 0.5);
  const auraMat = new T.ShaderMaterial({
    name: 'RedTipLaser_VolumetricAura',
    uniforms: redLaserUniforms,
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
        float softFalloff = pow(ndotv, 2.6);
        float pulse = 0.82 + 0.18 * sin(vUv.y * 42.0 - uTime * 28.0);
        float farFade = smoothstep(1.0, 0.88, vUv.y);
        vec3 col = mix(vec3(0.85, 0.02, 0.08), vec3(1.0, 0.22, 0.14), softFalloff);
        float alpha = softFalloff * 0.52 * pulse * farFade * uIntensity;
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
  const auraMesh = new T.Mesh(auraGeo, auraMat);
  auraMesh.name = 'RedLaser_CrimsonAura';
  auraMesh.userData.noShadow = true;
  auraMesh.castShadow = false;
  auraMesh.frustumCulled = false;
  laserAssembly.add(auraMesh);

  // Layer 4: Twin Counter-Rotating Red Plasma Energy Helices spiraling from the nose tip
  const buildRedHelix = (phaseOffset, radius, turns, colorHex, name) => {
    const pts = [];
    const steps = 150;
    const spanZ = LASER_LENGTH - 0.12;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const z = f * spanZ;
      const envelope = 0.28 + 0.72 * Math.sin(Math.min(1, z / 1.4) * Math.PI * 0.5);
      const r = radius * envelope;
      const ang = f * Math.PI * 2 * turns + phaseOffset;
      pts.push(new T.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z));
    }
    const curve = new T.CatmullRomCurve3(pts);
    const geo = new T.TubeGeometry(curve, 150, 0.015, 6, false);
    const mat = new T.MeshBasicMaterial({
      name,
      color: colorHex,
      transparent: true,
      opacity: 0.88,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const m = new T.Mesh(geo, mat);
    m.name = name;
    m.userData.noShadow = true;
    m.castShadow = false;
    m.frustumCulled = false;
    return m;
  };

  const helixA = buildRedHelix(0, 0.145, 16.0, 0xff1122, 'RedLaser_HelixPrimary');
  const helixB = buildRedHelix(Math.PI, 0.145, 16.0, 0xff5a2a, 'RedLaser_HelixSecondary');
  laserAssembly.add(helixA, helixB);

  // Layer 5: 12 Animated Traveling Crimson Shockwave / Collimator Rings shooting forward from tip
  const RING_COUNT = 12;
  const pulseRings = [];
  const ringGeo = new T.TorusGeometry(0.165, 0.015, 8, 24);
  for (let i = 0; i < RING_COUNT; i++) {
    const rMat = new T.MeshBasicMaterial({
      name: `RedLaser_PulseRingMat_${i}`,
      color: i % 2 === 0 ? 0xff1e2d : 0xff6240,
      transparent: true,
      opacity: 0.85,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const ring = new T.Mesh(ringGeo, rMat);
    ring.name = `RedLaser_PulseRing_${i}`;
    ring.userData.noShadow = true;
    ring.castShadow = false;
    ring.frustumCulled = false;
    laserAssembly.add(ring);
    pulseRings.push({ mesh: ring, mat: rMat, offset: i / RING_COUNT });
  }

  // Layer 6: Rotating Red Tip Muzzle Star-Bloom Cross Flare right at the emitter tip
  const muzzleFlareGroup = new T.Group();
  muzzleFlareGroup.name = 'RedLaser_TipMuzzleFlare';
  muzzleFlareGroup.position.set(0, 0, 0.03);
  const muzzleFlareMat = new T.MeshBasicMaterial({
    name: 'RedLaser_TipMuzzleFlareMat',
    map: redFlareTex,
    color: 0xffd2d6,
    transparent: true,
    opacity: 0.96,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const flarePlaneGeo = new T.PlaneGeometry(0.86, 0.86);
  const fp1 = new T.Mesh(flarePlaneGeo, muzzleFlareMat);
  const fp2 = new T.Mesh(flarePlaneGeo, muzzleFlareMat);
  fp2.rotation.y = Math.PI * 0.5;
  const fp3 = new T.Mesh(flarePlaneGeo, muzzleFlareMat);
  fp3.rotation.x = Math.PI * 0.5;
  [fp1, fp2, fp3].forEach((p) => {
    p.userData.noShadow = true;
    p.castShadow = false;
    muzzleFlareGroup.add(p);
  });
  laserAssembly.add(muzzleFlareGroup);

  // Layer 7: High-Speed Emitted Red Plasma Spark Stream racing forward along the laser
  const SPARK_COUNT = 120;
  const sparkSeeds = [];
  const sparkPositions = new Float32Array(SPARK_COUNT * 3);
  const sparkColors = new Float32Array(SPARK_COUNT * 3);
  for (let i = 0; i < SPARK_COUNT; i++) {
    const offset = rand();
    const ang = rand() * Math.PI * 2;
    const rad = 0.04 + rand() * 0.16;
    const spin = (rand() > 0.5 ? 1 : -1) * (2.0 + rand() * 4.5);
    sparkSeeds.push({ offset, ang, rad, spin });

    sparkPositions[i * 3] = Math.cos(ang) * rad;
    sparkPositions[i * 3 + 1] = Math.sin(ang) * rad;
    sparkPositions[i * 3 + 2] = offset * LASER_LENGTH;

    const cPick = rand();
    if (cPick < 0.5) tmpColor.setHex(0xff2030);
    else if (cPick < 0.82) tmpColor.setHex(0xff6638);
    else tmpColor.setHex(0xffe0d8);
    sparkColors[i * 3] = tmpColor.r;
    sparkColors[i * 3 + 1] = tmpColor.g;
    sparkColors[i * 3 + 2] = tmpColor.b;
  }

  const sparkGeo = new T.BufferGeometry();
  sparkGeo.setAttribute('position', new T.BufferAttribute(sparkPositions, 3));
  sparkGeo.setAttribute('color', new T.BufferAttribute(sparkColors, 3));
  const sparkMat = new T.PointsMaterial({
    name: 'RedLaser_PlasmaSparks',
    size: 0.095,
    map: redSparkTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.90,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const laserSparks = new T.Points(sparkGeo, sparkMat);
  laserSparks.name = 'RedLaser_SparkStream';
  laserSparks.frustumCulled = false;
  laserAssembly.add(laserSparks);

  // ===========================================================================
  // ANIMATION & DECAL-DRIVEN WEAPON CONTROLLER (Seamless 6.0s Loop)
  // ===========================================================================
  let _weaponDecalVisible = true;
  let _weaponOpacity = 1.0;
  let _lastElapsed = 0.0;

  const PI2 = Math.PI * 2;
  const OMEGA = PI2 / duration;
  const RING_TRAVEL_SPAN = LASER_LENGTH - 0.35;
  const ionPosAttr = ionPointsGeo.attributes.position;
  const ionPosArr = ionPosAttr.array;
  const sparkPosAttr = sparkGeo.attributes.position;
  const sparkPosArr = sparkPosAttr.array;

  function applyNoseAperturePose(openFactor) {
    const dy = openFactor * 0.022;
    const dz = openFactor * 0.012;
    const drx = openFactor * 0.32;
    for (let i = 0; i < nosePetals.length; i++) {
      const np = nosePetals[i];
      np.petal.position.y = np.baseY + dy;
      np.petal.position.z = np.baseZ + dz;
      np.petal.rotation.x = np.baseRotX - drx;
    }
  }

  function applyWeaponVisualState(fireLevel) {
    phaseCellUniforms.uWeaponLoad.value = fireLevel;
    noseEmitterRailMat.emissiveIntensity = 0.25 + fireLevel * 3.2;

    if (fireLevel > 0.005) {
      noseTipLensMat.color.setHex(0xff5260);
      noseTipLensMat.emissive.setHex(0xff1424);
      noseTipLensMat.emissiveIntensity = 1.4 + fireLevel * 3.0;
      muzzleLight.intensity = 5.4 * fireLevel;
    } else {
      noseTipLensMat.color.setHex(0x38d8ff);
      noseTipLensMat.emissive.setHex(0x00d8ff);
      noseTipLensMat.emissiveIntensity = 1.1;
      muzzleLight.intensity = 0.0;
    }
  }

  function layoutRedLaserFX(elapsed, fireLevel) {
    const flicker = 0.91 + 0.10 * Math.sin(elapsed * 64.0) + 0.06 * Math.cos(elapsed * 103.0);
    const radialScale = (0.38 + 0.62 * fireLevel) * flicker;
    laserAssembly.scale.set(radialScale, radialScale, 1.0);

    redLaserUniforms.uTime.value = elapsed;
    redLaserUniforms.uIntensity.value = fireLevel;

    coreMat.opacity = Math.min(1.0, fireLevel * 0.98);
    helixA.material.opacity = 0.88 * fireLevel;
    helixB.material.opacity = 0.88 * fireLevel;
    sparkMat.opacity = 0.90 * fireLevel;

    helixA.rotation.z = elapsed * 16.0;
    helixB.rotation.z = -elapsed * 19.0;

    // Traveling crimson shockwave rings shooting out from the tip
    const travelBase = elapsed * 1.65;
    const rotBase = elapsed * 7.5;
    for (let i = 0; i < pulseRings.length; i++) {
      const pr = pulseRings[i];
      const travel = (travelBase + pr.offset) % 1.0;
      pr.mesh.position.z = 0.14 + travel * RING_TRAVEL_SPAN;
      const rScale = 0.44 + travel * 1.08;
      pr.mesh.scale.set(rScale, rScale, 1.0);
      pr.mesh.rotation.z = rotBase + pr.offset * PI2;
      pr.mat.opacity = Math.sin(travel * Math.PI) * 0.88 * fireLevel;
    }

    // Muzzle star-bloom flare spinning right at the tip
    muzzleFlareGroup.rotation.z = elapsed * 4.8;
    muzzleFlareGroup.scale.setScalar((0.72 + 0.56 * fireLevel) * flicker);
    muzzleFlareMat.opacity = 0.96 * fireLevel;

    // High-velocity red plasma sparks streaking along the beam
    const sparkScroll = elapsed * 2.2;
    for (let i = 0; i < SPARK_COUNT; i++) {
      const sp = sparkSeeds[i];
      const f = (sp.offset + sparkScroll) % 1.0;
      const z = 0.06 + f * (LASER_LENGTH - 0.15);
      const a = sp.ang + elapsed * sp.spin;
      const r = sp.rad * (0.45 + 0.85 * Math.sin(f * Math.PI));
      const idx = i * 3;
      sparkPosArr[idx] = Math.cos(a) * r;
      sparkPosArr[idx + 1] = Math.sin(a) * r;
      sparkPosArr[idx + 2] = z;
    }
    sparkPosAttr.needsUpdate = true;
  }

  function syncWeaponDecalState(isVisible) {
    const active = Boolean(isVisible) && _weaponOpacity > 0.005;
    const level = active ? _weaponOpacity : 0.0;

    applyNoseAperturePose(active ? 1.0 : 0.0);
    applyWeaponVisualState(level);

    if (active) {
      laserAssembly.visible = true;
      layoutRedLaserFX(_lastElapsed, level);
      rootGroup.userData.laserFiring = true;
    } else {
      laserAssembly.visible = false;
      laserAssembly.scale.setScalar(0.0001);
      redLaserUniforms.uIntensity.value = 0.0;
      coreMat.opacity = 0.0;
      muzzleFlareMat.opacity = 0.0;
      sparkMat.opacity = 0.0;
      rootGroup.userData.laserFiring = false;
    }
  }

  // Intercept direct .visible updates from meshy_test_0/index.html Decals Tab & APIs
  // so turning the red tip laser weapon ON or OFF works instantaneously even when paused.
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

  // Intercept material.opacity updates from meshy_test_0/index.html Decal Opacity slider
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

  function update(dt, elapsed = 0) {
    _lastElapsed = elapsed;

    const cycleT = ((elapsed % duration) + duration) % duration;
    const normT = cycleT / duration;
    const cyclePhase = cycleT * OMEGA;
    const cyclePhase2 = cyclePhase * 2.0;

    // Weapon state driven strictly by Decal_LaserBurn_Tip_Laser_Weapon visibility & opacity
    const weaponEnabled = _weaponDecalVisible && _weaponOpacity > 0.005;
    const fireLevel = weaponEnabled ? _weaponOpacity : 0.0;

    // 1. Sleek Interceptor Zero-G Hover, Subtle Banking & Firing Micro-Recoil
    const sinPhase = Math.sin(cyclePhase);
    const hoverY = sinPhase * 0.038;
    const recoilZ = -fireLevel * 0.032 + Math.sin(cyclePhase * 24.0) * fireLevel * 0.005;
    bodyGroup.position.set(0, BASE_CENTER_Y + hoverY, recoilZ);
    bodyGroup.rotation.z = Math.sin(cyclePhase) * 0.032;
    bodyGroup.rotation.x = Math.sin(cyclePhase2) * 0.014 - fireLevel * 0.012;

    // 2. Counter-Rotating Upper Nacelle Phase-Drive Intake Turbines
    for (let i = 0; i < intakeTurbines.length; i++) {
      intakeTurbines[i].rotor.rotation.z = cyclePhase * 8.0 * intakeTurbines[i].dir;
    }

    // 3. Pulsing Cyan Phase-Drive Energy Windows, Thruster Plumes & Rear Reactor
    phaseCellUniforms.uTime.value = elapsed;
    const thrustPulse = 0.84 + 0.16 * Math.sin(cyclePhase * 6.0) + fireLevel * 0.22;
    cyanGlowMat.emissiveIntensity = 1.85 + 0.45 * Math.sin(cyclePhase * 4.0) + fireLevel * 0.35;
    mainReactorGlowMat.opacity = 0.50 + 0.18 * Math.sin(cyclePhase * 5.0) + fireLevel * 0.16;
    ionPlumeMat.opacity = 0.36 + 0.16 * Math.sin(cyclePhase * 6.0) + fireLevel * 0.14;
    for (let i = 0; i < ionPlumes.length; i++) {
      ionPlumes[i].scale.set(1.0, 1.0, thrustPulse);
    }

    // 4. Ambient Phase-Drive Ion Wake Particles behind the twin nacelles
    for (let i = 0; i < ionParticleCount; i++) {
      const s = ionSeeds[i];
      const f = (s.u + normT * s.speed) % 1.0;
      const a = s.ang + cyclePhase * 2.0 * s.side;
      const r = s.rad * (0.65 + 0.55 * f);
      const idx = i * 3;
      ionPosArr[idx] = s.side * 0.64 + Math.cos(a) * r;
      ionPosArr[idx + 1] = 0.22 + Math.sin(a) * r;
      ionPosArr[idx + 2] = -0.58 - f * 0.58;
    }
    ionPosAttr.needsUpdate = true;

    // 5. Articulated Nose Aperture & RED Animated Tip Laser Weapon
    applyNoseAperturePose(weaponEnabled ? 1.0 : 0.0);
    applyWeaponVisualState(fireLevel);

    if (weaponEnabled) {
      laserAssembly.visible = true;
      layoutRedLaserFX(elapsed, fireLevel);
    } else {
      laserAssembly.visible = false;
      laserAssembly.scale.setScalar(0.0001);
      redLaserUniforms.uIntensity.value = 0.0;
    }

    rootGroup.userData.cycleProgress = normT;
    rootGroup.userData.laserFiring = weaponEnabled;
  }

  function reset() {
    bodyGroup.position.set(0, BASE_CENTER_Y, 0);
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

  rootGroup.userData.weaponDecalName = weaponDecalName;
  rootGroup.userData.weaponDecalMesh = weaponDecalMesh;

  rootGroup.userData.dronePhaseInterceptor3 = {
    metadata,
    weaponDecalName,
    weaponDecalMesh,
    update,
    reset,
    dispose,
    setLaserIntensity,
    laserOrigin: new T.Vector3(calibratedTipX, BASE_CENTER_Y + calibratedTipY, calibratedTipZ),
    laserLength: LASER_LENGTH,
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
  return createDronePhaseInterceptor3(api);
}
