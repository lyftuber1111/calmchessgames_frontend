/**
 * Procedural WebXR & SVG Sci-Fi Enemy: Relativistic Enemy Ship (Stage 2 - Event Horizon)
 * High-fidelity XR procedural + SVG JavaScript reconstruction combining:
 *   - meshy_test_0/models/stage2/relativistic_enemy_ship/relativistic_enemy_ship.glb
 *   - meshy_test_0/models/tachyon_lance/tachyon_lance.glb
 *
 * Architectural & Visual Features:
 *  - Authentic SVG-driven geometry & PBR texture pipeline:
 *      * Embedded SVG <path> vector profiles parsed into 3D extruded stealth wings,
 *        beveled upper wing armor carapaces, faceted ventral weapon pod shrouds,
 *        cockpit frame contours, and swept dorsal wingtip stabilizer fins
 *      * Inline 1024x1024 SVG documents (albedo, bump, roughness, emissive,
 *        tachyon lance gold/chrome/magenta coil wrap, and radial plasma flares)
 *        rasterized into crisp Three.js CanvasTextures with instant synchronous
 *        fallback so frame 0 renders cleanly in WebXR & headless viewports
 *  - Sculpted multi-station lofted stealth dagger fuselage (warm ceramic-taupe &
 *    tactical slate-grey armor plating, dark gunmetal mechanical subframe, recessed
 *    chin intake bay, tinted multi-pane armored cockpit canopy, and cyan sensor pips)
 *  - Swept stealth arrow-delta wings with beveled armored wingtip shoulder pods,
 *    twin swept-back dorsal blade fins, and hanging ventral cyan thruster pods
 *  - Massive central rear (-Z) circular relativistic ion engine core with custom
 *    GLSL pulsing cyan plasma shader & armored cross-baffles, flanked by angled
 *    dark aft heat-exhaust housings
 *  - Twin massive underslung ventral armored weapon pods mounted on cyan-lit
 *    mechanical actuator pylons, housing EXACTLY 4 TACHYON LANCE EMITTERS
 *    (Port Upper, Port Lower, Starboard Upper, Starboard Lower) with recoiling
 *    barrels, articulated 4-petal shrouds, and glowing cyan plasma ignition tips
 *  - High-detail 3D procedural + SVG TACHYON LANCE MISSILES faithfully duplicating
 *    tachyon_lance.glb (tapered gold tail cone, protruding chrome-gold flanges,
 *    slotted gold/chrome accelerator barrel, hot-magenta phase coil rings, faceted
 *    magenta crown collar, and custom GLSL swirling crystalline piercing lance tip)
 *    firing 28.0 meters along +Z from ALL 4 emitters with superluminal plumes,
 *    Fresnel volumetric contrails, SVG muzzle flares, ionization spark wakes, and
 *    28.0m terminal shield-piercing detonations
 *  - Controlled via meshy_test_0/index.html Decals Tab & Global Decal APIs using
 *    4 independent targetable Missile Strike decals:
 *      1. Decal_MissileStrike_Port_Upper_TachyonLance
 *      2. Decal_MissileStrike_Port_Lower_TachyonLance
 *      3. Decal_MissileStrike_Starboard_Upper_TachyonLance
 *      4. Decal_MissileStrike_Starboard_Lower_TachyonLance
 *    Supports master All Decals, Missile Strikes category toggle, individual
 *    emitter toggles via UI or window.toggleDecalMesh(name, bool), and Opacity
 *    slider instantaneously even while paused
 *  - Exact physical bounding dimensions matching the reference GLB footprint
 *    (oriented +Z forward, +Y up, -X port / +X starboard for meshy_test_0 & WebXR):
 *      4.64m (W) x 2.52m (H) x 6.00m (L)
 *
 * Compatible with meshy_test_0 Procedural JS Loader & Player, WebXR, and Three.js r160+.
 */
import * as THREE from 'three';

export const duration = 6.0; // Seamless 6.0s combat loop
export const preserveScale = true; // Preserve exact 1:1 physical meter footprint (4.64m W x 2.52m H x 6.00m L)

export const weaponDecalNames = [
  'Decal_MissileStrike_Port_Upper_TachyonLance',
  'Decal_MissileStrike_Port_Lower_TachyonLance',
  'Decal_MissileStrike_Starboard_Upper_TachyonLance',
  'Decal_MissileStrike_Starboard_Lower_TachyonLance'
];
export const weaponDecalName = weaponDecalNames[0];

const TARGET_WIDTH = 4.64;
const TARGET_HEIGHT = 2.52;
const TARGET_LENGTH = 6.00;
const BASE_CENTER_Y = TARGET_HEIGHT * 0.5; // 1.26m so ventral pod keels rest cleanly on y = 0 at t = 0
const MISSILE_RANGE = 28.0; // Exact 28.0m animated Tachyon Lance missile flight distance along +Z
const EMITTER_COUNT = 4; // 4 Tachyon Lance emitters (2 per ventral pod: Port Upper/Lower, Starboard Upper/Lower)
const MISSILES_PER_EMITTER = 3; // 3 staggered Tachyon Lance missiles per emitter (12 total across 4 lanes)
const FLIGHTS_PER_LOOP = 2; // Exact integer cycles per 6.0s loop for 100% seamless looping

// =============================================================================
// AUTHENTIC SVG VECTOR PATH DEFINITIONS (3D Extruded Hull, Wings, Pods & Fins)
// =============================================================================
const SVG_GEOMETRY_PATHS = {
  // Swept stealth delta wing planform (local X = span outward, local Y = fore-aft Z)
  wingPlanform:
    'M 0.42 1.18 L 1.26 0.34 L 2.16 -0.82 L 2.26 -1.58 L 2.12 -2.38 L 1.62 -2.62 L 1.04 -2.28 L 0.56 -1.54 L 0.42 -1.24 Z',

  // Upper stepped stealth wing armor carapace inset
  wingUpperCarapace:
    'M 0.56 0.86 L 1.24 0.12 L 1.98 -0.92 L 2.04 -1.62 L 1.84 -2.22 L 1.48 -2.36 L 0.96 -1.96 L 0.58 -1.26 Z',

  // Outer wingtip heavy beveled nacelle shoulder profile (in X-Z plane)
  wingtipNacelle:
    'M 1.46 -0.86 L 2.16 -1.04 L 2.30 -1.54 L 2.22 -2.36 L 1.84 -2.66 L 1.44 -2.44 L 1.32 -1.70 Z',

  // Swept-back sharp dorsal wingtip stabilizer fin / blade antenna (in Z-Y plane)
  dorsalTailFin:
    'M 0.00 0.00 L 0.56 0.00 L -0.44 0.42 L -0.62 0.38 L -0.18 0.10 Z',

  // Massive underslung ventral weapon pod side profile (in Z-Y plane; +X = forward Z, +Y = up Y)
  ventralPodSideProfile:
    'M -1.62 -0.22 L -1.22 0.32 L 0.88 0.36 L 1.18 0.18 L 1.04 -0.34 L 0.68 -0.52 L -0.78 -0.52 L -1.44 -0.38 Z',

  // Front beveled hexagonal armor cowling plate framing each pod's dual emitters
  ventralPodArmorPlate:
    'M -0.42 0.34 L 0.42 0.34 L 0.52 0.10 L 0.44 -0.36 L 0.22 -0.48 L -0.22 -0.48 L -0.44 -0.36 L -0.52 0.10 Z',

  // Cockpit side armored spine silhouette (in Z-Y plane; deep base skirt seats seamlessly into fuselage)
  cockpitSpineSide:
    'M -1.55 -0.22 L -1.28 0.16 L -0.72 0.56 L 0.28 0.64 L 1.24 0.26 L 1.62 0.02 L 1.56 -0.22 Z',

  // Ventral belly keel armor plate (in X-Z plane)
  ventralKeelPlate:
    'M -0.68 -1.56 L 0.68 -1.56 L 0.74 -0.30 L 0.58 0.96 L 0.26 1.54 L -0.26 1.54 L -0.58 0.96 L -0.74 -0.30 Z'
};

export const metadata = {
  id: 'relativistic_enemy_ship',
  name: 'Relativistic Enemy Ship (Stage 2)',
  stage: 2,
  stageSlug: 'event_horizon',
  classification: 'Quad-Tachyon Lance Relativistic Stealth Gunship',
  sourceReferences: [
    'meshy_test_0/models/stage2/relativistic_enemy_ship/relativistic_enemy_ship.glb',
    'meshy_test_0/models/tachyon_lance/tachyon_lance.glb'
  ],
  weaponDecalNames: [...weaponDecalNames],
  weaponType: 'quad_tachyon_lance_missiles',
  weaponColor: '#ff1ea8',
  emitterGlowColor: '#00f0ff',
  dimensions: {
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    depth: TARGET_LENGTH
  },
  circumference: Number((Math.PI * ((TARGET_WIDTH + TARGET_LENGTH) * 0.5)).toFixed(2)),
  emitterCount: EMITTER_COUNT,
  missileDirection: { x: 0, y: 0, z: 1 },
  missileRange: MISSILE_RANGE,
  missilesPerEmitter: MISSILES_PER_EMITTER,
  emitterTips: {
    portUpper: { x: -1.80, y: 0.68, z: 1.42 },
    portLower: { x: -1.50, y: 0.34, z: 1.38 },
    starboardUpper: { x: 1.80, y: 0.68, z: 1.42 },
    starboardLower: { x: 1.50, y: 0.34, z: 1.38 }
  },
  svgAssets: [
    'relativistic_hull_albedo.svg',
    'relativistic_hull_bump.svg',
    'relativistic_hull_roughness.svg',
    'relativistic_hull_emissive.svg',
    'tachyon_lance_albedo.svg',
    'tachyon_lance_bump.svg',
    'tachyon_lance_emissive.svg',
    'tachyon_flare.svg',
    'tachyon_spark_orb.svg'
  ]
};

/**
 * Deterministic PRNG so all procedural geometry, SVG details, and sparks are 100% reproducible.
 */
function createSeededRandom(seed = 20262804) {
  let s = seed >>> 0;
  return function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Parses an authentic SVG `<path d="...">` string (supporting M/m, L/l, H/h, V/v, Q/q, C/c, Z/z)
 * directly into a `THREE.Shape` for procedural 3D extrusion with zero external CDN dependencies.
 */
function svgPathToShape(T, d, mirrorX = false) {
  const shape = new T.Shape();
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return shape;

  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const mx = mirrorX ? -1 : 1;

  const nextNum = () => parseFloat(tokens[i++]);
  const isCmd = (tok) => /^[a-zA-Z]$/.test(tok);

  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i++];
    }
    switch (cmd) {
      case 'M': {
        cx = nextNum();
        cy = nextNum();
        sx = cx;
        sy = cy;
        shape.moveTo(cx * mx, cy);
        cmd = 'L';
        break;
      }
      case 'm': {
        cx += nextNum();
        cy += nextNum();
        sx = cx;
        sy = cy;
        shape.moveTo(cx * mx, cy);
        cmd = 'l';
        break;
      }
      case 'L': {
        cx = nextNum();
        cy = nextNum();
        shape.lineTo(cx * mx, cy);
        break;
      }
      case 'l': {
        cx += nextNum();
        cy += nextNum();
        shape.lineTo(cx * mx, cy);
        break;
      }
      case 'H': {
        cx = nextNum();
        shape.lineTo(cx * mx, cy);
        break;
      }
      case 'h': {
        cx += nextNum();
        shape.lineTo(cx * mx, cy);
        break;
      }
      case 'V': {
        cy = nextNum();
        shape.lineTo(cx * mx, cy);
        break;
      }
      case 'v': {
        cy += nextNum();
        shape.lineTo(cx * mx, cy);
        break;
      }
      case 'Q': {
        const qx = nextNum();
        const qy = nextNum();
        cx = nextNum();
        cy = nextNum();
        shape.quadraticCurveTo(qx * mx, qy, cx * mx, cy);
        break;
      }
      case 'q': {
        const qx = cx + nextNum();
        const qy = cy + nextNum();
        cx += nextNum();
        cy += nextNum();
        shape.quadraticCurveTo(qx * mx, qy, cx * mx, cy);
        break;
      }
      case 'C': {
        const c1x = nextNum();
        const c1y = nextNum();
        const c2x = nextNum();
        const c2y = nextNum();
        cx = nextNum();
        cy = nextNum();
        shape.bezierCurveTo(c1x * mx, c1y, c2x * mx, c2y, cx * mx, cy);
        break;
      }
      case 'c': {
        const c1x = cx + nextNum();
        const c1y = cy + nextNum();
        const c2x = cx + nextNum();
        const c2y = cy + nextNum();
        cx += nextNum();
        cy += nextNum();
        shape.bezierCurveTo(c1x * mx, c1y, c2x * mx, c2y, cx * mx, cy);
        break;
      }
      case 'Z':
      case 'z': {
        shape.closePath();
        cx = sx;
        cy = sy;
        break;
      }
      default:
        i++;
        break;
    }
  }
  return shape;
}

/**
 * Normalizes geometry UVs cleanly onto [0, 1] so SVG procedural PBR maps tile crisply.
 */
function normalizePlanarUVs(geo, axisU = 'x', axisV = 'z', tileU = 1.0, tileV = 1.0) {
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

  const getCoord = (idx, ax) => (ax === 'x' ? pos.getX(idx) : ax === 'y' ? pos.getY(idx) : pos.getZ(idx));
  for (let i = 0; i < pos.count; i++) {
    const u = ((getCoord(i, axisU) - minMap[axisU]) / spanMap[axisU]) * tileU;
    const v = ((getCoord(i, axisV) - minMap[axisV]) / spanMap[axisV]) * tileV;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Extrudes an SVG `<path>` string into a clean beveled Three.js geometry.
 */
function createExtrudedSvgGeometry(T, svgPathD, options = {}) {
  const {
    depth = 0.24,
    bevelThickness = 0.035,
    bevelSize = 0.03,
    bevelSegments = 2,
    curveSegments = 8,
    mirrorX = false,
    centerZ = true,
    uvAxes = ['x', 'y'],
    uvTile = [1.0, 1.0]
  } = options;

  const shape = svgPathToShape(T, svgPathD, mirrorX);
  const geo = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevelThickness > 0 && bevelSize > 0,
    bevelThickness,
    bevelSize,
    bevelSegments,
    curveSegments
  });
  if (centerZ) {
    geo.translate(0, 0, -depth * 0.5);
  }
  geo.computeVertexNormals();
  return normalizePlanarUVs(geo, uvAxes[0], uvAxes[1], uvTile[0], uvTile[1]);
}

/**
 * Creates a crisp chamfered stealth armor block using ExtrudeGeometry.
 */
function createChamferedBlock(T, width, height, depth, chamfer = 0.04, bevel = 0.015) {
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
  return normalizePlanarUVs(geo, 'x', 'y', 1.0, 1.0);
}

/**
 * Builds a multi-station lofted stealth dagger fuselage BufferGeometry (+Z nose -> -Z stern)
 * with faceted octagonal cross-sections so the central hull matches relativistic_enemy_ship.glb.
 */
function createLoftedStealthFuselage(T) {
  // Each station: { z, wMid, wTop, wBot, yTop, yShoulder, yChine, yBot }
  const stations = [
    { z:  3.00, wMid: 0.035, wTop: 0.018, wBot: 0.020, yTop: 0.14, yShoulder: 0.11, yChine: 0.04, yBot: 0.00 },
    { z:  2.62, wMid: 0.24,  wTop: 0.11,  wBot: 0.14,  yTop: 0.30, yShoulder: 0.22, yChine: 0.06, yBot: -0.05 },
    { z:  2.05, wMid: 0.46,  wTop: 0.24,  wBot: 0.28,  yTop: 0.52, yShoulder: 0.35, yChine: 0.08, yBot: -0.10 },
    { z:  1.45, wMid: 0.68,  wTop: 0.36,  wBot: 0.44,  yTop: 0.72, yShoulder: 0.46, yChine: 0.10, yBot: -0.22 },
    { z:  0.75, wMid: 0.86,  wTop: 0.44,  wBot: 0.62,  yTop: 0.96, yShoulder: 0.56, yChine: 0.06, yBot: -0.34 },
    { z:  0.00, wMid: 0.96,  wTop: 0.46,  wBot: 0.70,  yTop: 1.04, yShoulder: 0.62, yChine: 0.02, yBot: -0.40 },
    { z: -0.85, wMid: 0.92,  wTop: 0.44,  wBot: 0.66,  yTop: 0.94, yShoulder: 0.56, yChine: 0.02, yBot: -0.38 },
    { z: -1.55, wMid: 0.76,  wTop: 0.38,  wBot: 0.54,  yTop: 0.74, yShoulder: 0.48, yChine: 0.06, yBot: -0.30 },
    { z: -2.08, wMid: 0.54,  wTop: 0.30,  wBot: 0.40,  yTop: 0.56, yShoulder: 0.40, yChine: 0.08, yBot: -0.20 }
  ];

  // 8-point symmetric stealth ring (clockwise when viewed from +Z so outward normals face out)
  const ringPts = (st) => [
    [ 0.0,       st.yTop      ], // 0: dorsal ridge center
    [ st.wTop,   st.yShoulder ], // 1: starboard upper shoulder
    [ st.wMid,   st.yChine    ], // 2: starboard chine edge
    [ st.wBot,   st.yBot      ], // 3: starboard belly chine
    [ 0.0,       st.yBot - 0.03 ], // 4: ventral keel center
    [-st.wBot,   st.yBot      ], // 5: port belly chine
    [-st.wMid,   st.yChine    ], // 6: port chine edge
    [-st.wTop,   st.yShoulder ]  // 7: port upper shoulder
  ];

  const ringCount = 8;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let s = 0; s < stations.length; s++) {
    const st = stations[s];
    const pts = ringPts(st);
    const vCoord = s / (stations.length - 1);
    for (let r = 0; r <= ringCount; r++) {
      const p = pts[r % ringCount];
      positions.push(p[0], p[1], st.z);
      uvs.push(r / ringCount, vCoord * 1.6);
    }
  }

  const stride = ringCount + 1;
  for (let s = 0; s < stations.length - 1; s++) {
    for (let r = 0; r < ringCount; r++) {
      const a = s * stride + r;
      const b = s * stride + r + 1;
      const c = (s + 1) * stride + r;
      const d = (s + 1) * stride + r + 1;
      // Outward-facing CCW winding (ring progresses clockwise viewed from +Z, s progresses toward -Z)
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Cap nose tip (s = 0, facing +Z)
  const noseCenterIdx = positions.length / 3;
  const st0 = stations[0];
  positions.push(0, (st0.yTop + st0.yBot) * 0.5, st0.z + 0.03);
  uvs.push(0.5, 0.0);
  for (let r = 0; r < ringCount; r++) {
    indices.push(noseCenterIdx, r + 1, r);
  }

  // Cap stern face (s = last, facing -Z)
  const lastOffset = (stations.length - 1) * stride;
  const sternCenterIdx = positions.length / 3;
  const stL = stations[stations.length - 1];
  positions.push(0, (stL.yTop + stL.yBot) * 0.5, stL.z - 0.02);
  uvs.push(0.5, 1.0);
  for (let r = 0; r < ringCount; r++) {
    indices.push(sternCenterIdx, lastOffset + r, lastOffset + r + 1);
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Rasterizes an inline SVG document onto an HTMLCanvasElement wrapped in a Three.js CanvasTexture.
 * Paints a synchronous fallback layer immediately so frame 0 is never black, then composites the
 * crisp SVG vector render asynchronously as soon as Image decode completes (typically < 3ms).
 */
function createSvgCanvasTexture(T, {
  name,
  width = 1024,
  height = 1024,
  svgMarkup,
  drawSyncFallback,
  isSRGB = true,
  repeat = true,
  trackedTextures = null,
  trackedSvgStrings = null
}) {
  if (trackedSvgStrings) {
    trackedSvgStrings[name] = svgMarkup;
  }
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Synchronous baseline paint for zero-flicker frame 0 rendering
  if (typeof drawSyncFallback === 'function') {
    drawSyncFallback(ctx, width, height);
  }

  const tex = new T.CanvasTexture(canvas);
  tex.name = name;
  tex.wrapS = repeat ? T.RepeatWrapping : T.ClampToEdgeWrapping;
  tex.wrapT = repeat ? T.RepeatWrapping : T.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  if (isSRGB) tex.colorSpace = T.SRGBColorSpace;
  tex.needsUpdate = true;

  // Rasterize crisp vector SVG onto the same canvas & flag GPU re-upload
  if (svgMarkup && typeof Image !== 'undefined') {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        try {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          tex.needsUpdate = true;
        } catch (_) {}
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    } catch (_) {}
  }

  if (trackedTextures) trackedTextures.push(tex);
  return tex;
}

/**
 * Generates SVG-authored 1024x1024 PBR textures (albedo, bump, roughness, emissive)
 * matching relativistic_enemy_ship.glb's warm ceramic-taupe & slate-grey stealth plating,
 * panel seams, mechanical louvers, rivets, and glowing cyan relativistic conduit traces.
 */
function createRelativisticShipSvgTextures(T, trackedTextures, svgRegistry) {
  const rand = createSeededRandom(204901);

  // Build deterministic SVG armor panel fragments shared across albedo, bump, roughness, emissive
  const panels = [
    { x: 16,  y: 16,  w: 310, h: 228, fill: '#cfc6ba', bump: '#d6d6d6', rough: '#727272', cyanBar: false },
    { x: 344, y: 16,  w: 336, h: 228, fill: '#c4bbb0', bump: '#cccccc', rough: '#7a7a7a', cyanBar: true  },
    { x: 698, y: 16,  w: 310, h: 228, fill: '#d3cabf', bump: '#dadada', rough: '#6e6e6e', cyanBar: false },

    { x: 16,  y: 264, w: 236, h: 244, fill: '#8e96a1', bump: '#c2c2c2', rough: '#626262', cyanBar: true  },
    { x: 270, y: 264, w: 484, h: 244, fill: '#cbc2b6', bump: '#dedede', rough: '#747474', cyanBar: false },
    { x: 772, y: 264, w: 236, h: 244, fill: '#8e96a1', bump: '#c2c2c2', rough: '#626262', cyanBar: true  },

    { x: 16,  y: 528, w: 482, h: 232, fill: '#c6bdb1', bump: '#d4d4d4', rough: '#787878', cyanBar: false },
    { x: 516, y: 528, w: 492, h: 232, fill: '#d0c8bc', bump: '#d8d8d8', rough: '#707070', cyanBar: true  },

    { x: 16,  y: 780, w: 300, h: 228, fill: '#bfb6aa', bump: '#cecece', rough: '#7c7c7c', cyanBar: true  },
    { x: 334, y: 780, w: 356, h: 228, fill: '#929aa4', bump: '#c4c4c4', rough: '#666666', cyanBar: false },
    { x: 708, y: 780, w: 300, h: 228, fill: '#c9c0b4', bump: '#d6d6d6', rough: '#747474', cyanBar: true  }
  ];

  const chamferPoly = (x, y, w, h, bv = 18) =>
    `${x + bv},${y} ${x + w - bv},${y} ${x + w},${y + bv} ${x + w},${y + h - bv} ` +
    `${x + w - bv},${y + h} ${x + bv},${y + h} ${x},${y + h - bv} ${x},${y + bv}`;

  let albedoParts = '';
  let bumpParts = '';
  let roughParts = '';
  let emissiveParts = '';

  for (const p of panels) {
    const outerPts = chamferPoly(p.x, p.y, p.w, p.h, 20);
    const innerPts = chamferPoly(p.x + 14, p.y + 14, p.w - 28, p.h - 28, 12);

    albedoParts += `
      <polygon points="${outerPts}" fill="${p.fill}" stroke="#3e4652" stroke-width="4.5" />
      <polygon points="${innerPts}" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2" />
      <circle cx="${p.x + 24}" cy="${p.y + 24}" r="3.2" fill="#4f5866" />
      <circle cx="${p.x + p.w - 24}" cy="${p.y + 24}" r="3.2" fill="#4f5866" />
      <circle cx="${p.x + 24}" cy="${p.y + p.h - 24}" r="3.2" fill="#4f5866" />
      <circle cx="${p.x + p.w - 24}" cy="${p.y + p.h - 24}" r="3.2" fill="#4f5866" />
    `;
    bumpParts += `
      <polygon points="${outerPts}" fill="${p.bump}" stroke="#1c1c1c" stroke-width="6" />
      <polygon points="${innerPts}" fill="none" stroke="#ffffff" stroke-width="2.5" />
    `;
    roughParts += `
      <polygon points="${outerPts}" fill="${p.rough}" stroke="#2e2e2e" stroke-width="5" />
    `;

    if (p.cyanBar) {
      const cx = p.x + 28;
      const cy = p.y + p.h - 32;
      const cw = Math.min(92, p.w * 0.32);
      albedoParts += `<rect x="${cx}" y="${cy}" width="${cw}" height="8" rx="3" fill="#00e8ff" />`;
      emissiveParts += `<rect x="${cx}" y="${cy}" width="${cw}" height="8" rx="3" fill="#00f2ff" />`;
    }
  }

  // Brushed stealth weathering strokes & louvered vents in SVG
  let weatherStrokes = '';
  for (let i = 0; i < 90; i++) {
    const x1 = (rand() * 1000).toFixed(1);
    const y1 = (rand() * 1000).toFixed(1);
    const len = (24 + rand() * 88).toFixed(1);
    const col = rand() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(42,48,58,0.12)';
    weatherStrokes += `<line x1="${x1}" y1="${y1}" x2="${(parseFloat(x1) + parseFloat(len)).toFixed(1)}" y2="${y1}" stroke="${col}" stroke-width="1.5" />`;
  }

  // Louver vents & Stage-2 relativistic tactical chevron markings
  const louversSvg = `
    <g fill="#262c36" stroke="#5a6474" stroke-width="2">
      <rect x="304" y="348" width="122" height="58" rx="4" />
      <rect x="610" y="348" width="122" height="58" rx="4" />
      <rect x="60"  y="596" width="112" height="54" rx="4" />
      <rect x="852" y="596" width="112" height="54" rx="4" />
    </g>
    <g fill="#7c8594">
      ${[0, 1, 2, 3].map((k) => `
        <rect x="312" y="${356 + k * 12}" width="106" height="5" />
        <rect x="618" y="${356 + k * 12}" width="106" height="5" />
        <rect x="68"  y="${604 + k * 11}" width="96"  height="5" />
        <rect x="860" y="${604 + k * 11}" width="96"  height="5" />
      `).join('')}
    </g>
    <path d="M 480 448 L 512 418 L 544 448 L 534 456 L 512 435 L 490 456 Z" fill="#4b5563" opacity="0.7" />
    <path d="M 480 468 L 512 438 L 544 468 L 534 476 L 512 455 L 490 476 Z" fill="#00e5ff" opacity="0.82" />
  `;

  const albedoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <linearGradient id="shipBaseGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c2b9ac" />
        <stop offset="50%" stop-color="#afa79b" />
        <stop offset="100%" stop-color="#8c929c" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#shipBaseGrad)" />
    <rect x="0" y="514" width="1024" height="10" fill="#2e3540" />
    ${albedoParts}
    ${louversSvg}
    ${weatherStrokes}
  </svg>`;

  const bumpSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#686868" />
    <rect x="0" y="514" width="1024" height="10" fill="#181818" />
    ${bumpParts}
  </svg>`;

  const roughSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#7c7c7c" />
    ${roughParts}
  </svg>`;

  const emissiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#000000" />
    <line x1="48" y1="519" x2="260" y2="519" stroke="#00f0ff" stroke-width="3" opacity="0.72" />
    <line x1="764" y1="519" x2="976" y2="519" stroke="#00f0ff" stroke-width="3" opacity="0.72" />
    <path d="M 480 468 L 512 438 L 544 468 L 534 476 L 512 455 L 490 476 Z" fill="#00f0ff" />
    ${emissiveParts}
  </svg>`;

  const drawFallback = (baseHex, accentHex, strokeHex) => (ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = strokeHex;
    ctx.lineWidth = 4;
    for (const p of panels) {
      ctx.fillStyle = accentHex ? p.fill : baseHex;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  };

  const albedo = createSvgCanvasTexture(T, {
    name: 'relativistic_hull_albedo.svg',
    svgMarkup: albedoSvg,
    drawSyncFallback: drawFallback('#b8b0a4', true, '#3e4652'),
    isSRGB: true,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });
  const bump = createSvgCanvasTexture(T, {
    name: 'relativistic_hull_bump.svg',
    svgMarkup: bumpSvg,
    drawSyncFallback: drawFallback('#888888', false, '#202020'),
    isSRGB: false,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });
  const roughness = createSvgCanvasTexture(T, {
    name: 'relativistic_hull_roughness.svg',
    svgMarkup: roughSvg,
    drawSyncFallback: drawFallback('#747474', false, '#323232'),
    isSRGB: false,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });
  const emissive = createSvgCanvasTexture(T, {
    name: 'relativistic_hull_emissive.svg',
    svgMarkup: emissiveSvg,
    drawSyncFallback: (ctx, w, h) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#00f0ff';
      for (const p of panels) {
        if (p.cyanBar) ctx.fillRect(p.x + 28, p.y + p.h - 32, 76, 8);
      }
    },
    isSRGB: true,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });

  return { albedo, bump, roughness, emissive };
}

/**
 * Generates SVG-authored PBR textures faithfully duplicating tachyon_lance.glb's
 * polished metallic gold & chrome-steel slotted barrel with glowing magenta/ultraviolet coils.
 */
function createTachyonLanceSvgTextures(T, trackedTextures, svgRegistry) {
  let slotRectsAlbedo = '';
  let slotRectsBump = '';
  let slotRectsEmissive = '';
  for (let i = 0; i < 8; i++) {
    const x = 32 + i * 124;
    slotRectsAlbedo += `
      <rect x="${x}" y="356" width="68" height="310" rx="18" fill="#3a1632" stroke="#241c10" stroke-width="5" />
      <rect x="${x + 14}" y="376" width="40" height="270" rx="10" fill="#ff1eb4" />
      <rect x="${x + 26}" y="392" width="16" height="238" rx="6" fill="#ffd6f6" />
    `;
    slotRectsBump += `<rect x="${x}" y="356" width="68" height="310" rx="18" fill="#181818" />`;
    slotRectsEmissive += `
      <rect x="${x + 12}" y="372" width="44" height="278" rx="10" fill="#ff1ca8" />
      <rect x="${x + 24}" y="390" width="20" height="242" rx="6" fill="#ffe0fa" />
    `;
  }

  const albedoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <linearGradient id="goldAlloy" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#9e7426" />
        <stop offset="25%" stop-color="#e8bd54" />
        <stop offset="50%" stop-color="#f7dc84" />
        <stop offset="75%" stop-color="#c99634" />
        <stop offset="100%" stop-color="#9e7426" />
      </linearGradient>
      <linearGradient id="chromeBand" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#484b58" />
        <stop offset="35%" stop-color="#9aa2b4" />
        <stop offset="55%" stop-color="#d2d8e4" />
        <stop offset="100%" stop-color="#484b58" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#goldAlloy)" />
    <rect x="0" y="0"   width="1024" height="150" fill="url(#chromeBand)" />
    <rect x="0" y="150" width="1024" height="44"  fill="#e6149c" />
    <rect x="0" y="294" width="1024" height="36"  fill="#ff18a8" />
    <rect x="0" y="694" width="1024" height="36"  fill="#ff18a8" />
    <rect x="0" y="838" width="1024" height="186" fill="url(#chromeBand)" />
    <g stroke="#2a2112" stroke-width="5">
      <line x1="0" y1="150" x2="1024" y2="150" />
      <line x1="0" y1="194" x2="1024" y2="194" />
      <line x1="0" y1="294" x2="1024" y2="294" />
      <line x1="0" y1="330" x2="1024" y2="330" />
      <line x1="0" y1="694" x2="1024" y2="694" />
      <line x1="0" y1="730" x2="1024" y2="730" />
      <line x1="0" y1="838" x2="1024" y2="838" />
    </g>
    ${slotRectsAlbedo}
  </svg>`;

  const bumpSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#c8c8c8" />
    <rect x="0" y="148" width="1024" height="48" fill="#3a3a3a" />
    <rect x="0" y="292" width="1024" height="40" fill="#323232" />
    <rect x="0" y="692" width="1024" height="40" fill="#323232" />
    ${slotRectsBump}
  </svg>`;

  const emissiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#000000" />
    <rect x="0" y="154" width="1024" height="36" fill="#e6149c" />
    <rect x="0" y="298" width="1024" height="28" fill="#ff1eb4" />
    <rect x="0" y="698" width="1024" height="28" fill="#ff1eb4" />
    ${slotRectsEmissive}
  </svg>`;

  const albedo = createSvgCanvasTexture(T, {
    name: 'tachyon_lance_albedo.svg',
    svgMarkup: albedoSvg,
    drawSyncFallback: (ctx, w, h) => {
      ctx.fillStyle = '#d4a23c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#80889a';
      ctx.fillRect(0, 0, w, 150);
      ctx.fillRect(0, 838, w, 186);
      ctx.fillStyle = '#ff18a8';
      ctx.fillRect(0, 294, w, 36);
      ctx.fillRect(0, 694, w, 36);
    },
    isSRGB: true,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });

  const bump = createSvgCanvasTexture(T, {
    name: 'tachyon_lance_bump.svg',
    svgMarkup: bumpSvg,
    drawSyncFallback: (ctx, w, h) => {
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(0, 0, w, h);
    },
    isSRGB: false,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });

  const emissive = createSvgCanvasTexture(T, {
    name: 'tachyon_lance_emissive.svg',
    svgMarkup: emissiveSvg,
    drawSyncFallback: (ctx, w, h) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff1eb4';
      ctx.fillRect(0, 298, w, 28);
      ctx.fillRect(0, 698, w, 28);
    },
    isSRGB: true,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });

  return { albedo, bump, emissive };
}

/**
 * Generates crisp SVG radial star-flare & ionization spark orb textures for muzzle launches & 28m hits.
 */
function createTachyonFxSvgTextures(T, trackedTextures, svgRegistry) {
  const flareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <defs>
      <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="18%" stop-color="#d8fcff" stop-opacity="0.96" />
        <stop offset="40%" stop-color="#ff2ec4" stop-opacity="0.72" />
        <stop offset="70%" stop-color="#00d8ff" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <circle cx="128" cy="128" r="126" fill="url(#coreGlow)" />
    <g transform="translate(128 128)" opacity="0.94">
      <polygon points="0,-124 8,-10 124,0 8,10 0,124 -8,10 -124,0 -8,-10" fill="#ffffff" />
      <polygon points="0,-96 6,-8 96,0 6,8 0,96 -6,8 -96,0 -6,-8" transform="rotate(45)" fill="#ff52dc" opacity="0.82" />
      <circle cx="0" cy="0" r="24" fill="#ffffff" />
    </g>
  </svg>`;

  const sparkOrbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <defs>
      <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="30%" stop-color="#ff7ee8" stop-opacity="0.92" />
        <stop offset="68%" stop-color="#00e8ff" stop-opacity="0.40" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="32" fill="url(#orbGrad)" />
  </svg>`;

  const flareTex = createSvgCanvasTexture(T, {
    name: 'tachyon_flare.svg',
    width: 256,
    height: 256,
    svgMarkup: flareSvg,
    repeat: false,
    drawSyncFallback: (ctx, w, h) => {
      const cx = w * 0.5;
      const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
      g.addColorStop(0.0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,90,220,0.85)');
      g.addColorStop(0.65, 'rgba(0,224,255,0.30)');
      g.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    isSRGB: true,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });

  const sparkTex = createSvgCanvasTexture(T, {
    name: 'tachyon_spark_orb.svg',
    width: 64,
    height: 64,
    svgMarkup: sparkOrbSvg,
    repeat: false,
    drawSyncFallback: (ctx, w, h) => {
      const cx = w * 0.5;
      const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
      g.addColorStop(0.0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,112,232,0.9)');
      g.addColorStop(0.75, 'rgba(0,232,255,0.35)');
      g.addColorStop(1.0, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    isSRGB: true,
    trackedTextures,
    trackedSvgStrings: svgRegistry
  });

  return { flareTex, sparkTex };
}

/**
 * Builds the Stage 2 Relativistic Enemy Ship procedural XR + SVG 3D model
 * with 4 ventral Tachyon Lance emitters firing 28m Tachyon Lance missiles controlled via decals.
 */
export function createRelativisticEnemyShip(api = {}) {
  const T = (api && api.THREE) ? api.THREE : THREE;
  const rand = createSeededRandom(20261125);

  const trackedTextures = [];
  const svgRegistry = {};

  const shipTex = createRelativisticShipSvgTextures(T, trackedTextures, svgRegistry);
  const lanceTex = createTachyonLanceSvgTextures(T, trackedTextures, svgRegistry);
  const fxTex = createTachyonFxSvgTextures(T, trackedTextures, svgRegistry);

  // ===========================================================================
  // PBR & CUSTOM GLSL SHADER MATERIALS
  // ===========================================================================
  const hullCeramicMat = new T.MeshStandardMaterial({
    name: 'RelativisticArmor_CeramicTaupe',
    color: 0xffffff,
    map: shipTex.albedo,
    bumpMap: shipTex.bump,
    bumpScale: 0.022,
    roughnessMap: shipTex.roughness,
    emissive: 0x00eeff,
    emissiveMap: shipTex.emissive,
    emissiveIntensity: 0.42,
    metalness: 0.24,
    roughness: 0.46
  });

  const secondaryArmorMat = new T.MeshStandardMaterial({
    name: 'RelativisticArmor_TacticalSlate',
    color: 0x9aa3ae,
    map: shipTex.albedo,
    bumpMap: shipTex.bump,
    bumpScale: 0.018,
    roughnessMap: shipTex.roughness,
    metalness: 0.44,
    roughness: 0.38
  });

  const darkFrameMat = new T.MeshStandardMaterial({
    name: 'RelativisticSubframe_GunmetalCarbon',
    color: 0x2f3744,
    bumpMap: shipTex.bump,
    bumpScale: 0.014,
    metalness: 0.56,
    roughness: 0.48
  });

  const deepCavityMat = new T.MeshStandardMaterial({
    name: 'RelativisticCore_ObsidianRecess',
    color: 0x12161f,
    metalness: 0.55,
    roughness: 0.56
  });

  const machinedAlloyMat = new T.MeshStandardMaterial({
    name: 'RelativisticTrim_BrushedAlloy',
    color: 0x8a96a8,
    metalness: 0.80,
    roughness: 0.28
  });

  const canopyGlassMat = new T.MeshStandardMaterial({
    name: 'RelativisticCockpit_SmokedCanopy',
    color: 0x1a2634,
    emissive: 0x0a3244,
    emissiveIntensity: 0.42,
    metalness: 0.88,
    roughness: 0.14
  });

  const cyanGlowMat = new T.MeshStandardMaterial({
    name: 'RelativisticPlasma_CyanEmitterCore',
    color: 0x42f8ff,
    emissive: 0x00f4ff,
    emissiveIntensity: 2.35,
    metalness: 0.10,
    roughness: 0.12
  });

  // Custom GLSL Pulsing Relativistic Main Ion Engine Core Shader (-Z Stern)
  const engineUniforms = {
    uTime: { value: 0.0 },
    uWeaponLoad: { value: 0.0 }
  };
  const cyanEngineShaderMat = new T.ShaderMaterial({
    name: 'RelativisticEngine_CyanPlasmaCoreShader',
    uniforms: engineUniforms,
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

        float wave = sin(r * 18.0 - uTime * 8.4) * 0.5 + 0.5;
        float turbine = pow(0.5 + 0.5 * cos(ang * 4.0 + uTime * 3.14159), 2.0);
        float pulse = 0.84 + 0.16 * sin(uTime * 6.28318);

        vec3 deepCyan = vec3(0.02, 0.35, 0.62);
        vec3 vividCyan = vec3(0.05, 0.94, 1.0);
        vec3 whiteHot = vec3(0.86, 0.99, 1.0);

        vec3 col = mix(deepCyan, vividCyan, 0.50 + 0.50 * wave);
        col += vividCyan * turbine * 0.32 * (1.0 - smoothstep(0.62, 1.0, r));
        col += whiteHot * pow(1.0 - clamp(r, 0.0, 1.0), 2.4) * (0.55 + 0.45 * ndotv);
        col *= pulse * (1.0 + uWeaponLoad * 0.25);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  // Shared Tachyon Lance Missile PBR & Custom GLSL Materials (faithful to tachyon_lance.glb)
  const lanceGoldBarrelMat = new T.MeshStandardMaterial({
    name: 'TachyonLance_GoldChromeBarrel',
    color: 0xffffff,
    map: lanceTex.albedo,
    bumpMap: lanceTex.bump,
    bumpScale: 0.014,
    emissive: 0xff1eb4,
    emissiveMap: lanceTex.emissive,
    emissiveIntensity: 1.15,
    metalness: 0.84,
    roughness: 0.22
  });

  const lancePolishedGoldMat = new T.MeshStandardMaterial({
    name: 'TachyonLance_PolishedGoldAlloy',
    color: 0xe6b84c,
    emissive: 0x382204,
    emissiveIntensity: 0.24,
    metalness: 0.88,
    roughness: 0.20
  });

  const lanceChromeMat = new T.MeshStandardMaterial({
    name: 'TachyonLance_ChromeSteelFlange',
    color: 0x9fa8ba,
    metalness: 0.90,
    roughness: 0.18
  });

  const lanceMagentaCollarMat = new T.MeshStandardMaterial({
    name: 'TachyonLance_MagentaPhaseCollar',
    color: 0xe8169e,
    emissive: 0xff14b0,
    emissiveIntensity: 1.55,
    metalness: 0.42,
    roughness: 0.20
  });

  // Custom GLSL Swirling Crystalline Hot-Magenta / White Piercing Tachyon Lance Tip Shader
  const lanceTipUniforms = {
    uTime: { value: 0.0 }
  };
  const lancePiercingTipShaderMat = new T.ShaderMaterial({
    name: 'TachyonLance_SwirlingPiercingTipShader',
    uniforms: lanceTipUniforms,
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
      void main() {
        float ndotv = abs(dot(normalize(vNormal), normalize(vViewDir)));
        float swirl = sin(vUv.x * 18.84955 + vUv.y * 24.0 - uTime * 22.0) * 0.5 + 0.5;
        float band = pow(swirl, 1.8);
        vec3 magenta = vec3(1.0, 0.08, 0.68);
        vec3 violet  = vec3(0.68, 0.16, 1.0);
        vec3 crystal = vec3(1.0, 0.92, 1.0);

        vec3 col = mix(violet, magenta, 0.45 + 0.55 * vUv.y);
        col = mix(col, crystal, band * 0.68 + pow(1.0 - ndotv, 2.2) * 0.45);
        col += crystal * smoothstep(0.68, 1.0, vUv.y) * 0.55;
        gl_FragColor = vec4(col * 1.25, 1.0);
      }
    `
  });

  // Factory for per-emitter custom GLSL superluminal Tachyon exhaust plume shader
  function createTachyonPlumeShaderMat(label) {
    const uniforms = {
      uTime: { value: 0.0 },
      uIntensity: { value: 1.0 }
    };
    const mat = new T.ShaderMaterial({
      name: `TachyonMissile_SuperluminalPlume_${label}`,
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
          float pulse = sin(uv.y * 34.0 - uTime * 64.0 + uv.x * 12.56637) * 0.011 * (1.0 - uv.y);
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
          float coreMask = pow(ndotv, 1.5);
          float nozzleHot = smoothstep(0.16, 0.96, vUv.y);
          float tailFade = smoothstep(0.0, 0.30, vUv.y);
          float phaseDiamonds = pow(0.5 + 0.5 * sin(vUv.y * 36.0 + uTime * 54.0), 2.2);
          float shimmer = 0.80 + 0.20 * sin(vUv.x * 18.84955 + vUv.y * 42.0 + uTime * 66.0);

          vec3 ultraViolet = vec3(0.58, 0.08, 1.0);
          vec3 hotMagenta  = vec3(1.0, 0.14, 0.78);
          vec3 cyanCore    = vec3(0.25, 0.96, 1.0);
          vec3 whiteHot    = vec3(1.0, 0.96, 1.0);

          vec3 col = mix(ultraViolet, hotMagenta, nozzleHot * 0.65 + phaseDiamonds * 0.35);
          col = mix(col, cyanCore, coreMask * 0.42 * nozzleHot);
          col += whiteHot * coreMask * (0.42 * nozzleHot + 0.36 * phaseDiamonds);
          col *= shimmer;

          float alpha = clamp((coreMask * 0.86 + 0.24 * phaseDiamonds) * tailFade * uIntensity, 0.0, 0.98);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
    return { mat, uniforms };
  }

  // Factory for per-emitter soft Fresnel-falloff volumetric tachyon wake contrail shader
  function createTachyonContrailShaderMat(label, plumeUniforms) {
    return new T.ShaderMaterial({
      name: `TachyonMissile_VolumetricContrail_${label}`,
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
          float lengthFade = smoothstep(0.0, 0.72, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
          float wisp = 0.76 + 0.24 * sin(vUv.y * 30.0 + uTime * 38.0 + vUv.x * 12.56637);
          vec3 col = mix(vec3(0.06, 0.78, 1.0), vec3(1.0, 0.18, 0.80), smoothstep(0.18, 0.94, vUv.y));
          float alpha = softEdge * lengthFade * wisp * 0.44 * uIntensity;
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
  }

  // ===========================================================================
  // ROOT HIERARCHY
  // ===========================================================================
  const rootGroup = new T.Group();
  rootGroup.name = 'RelativisticEnemyShip_Root';

  const bodyGroup = new T.Group();
  bodyGroup.name = 'RelativisticEnemyShip_Body';
  bodyGroup.position.set(0, BASE_CENTER_Y, 0);
  rootGroup.add(bodyGroup);

  // All structural airframe geometry is authored in native meter proportions
  // (+Z forward, +Y up, ±X wings) and analytically calibrated to exact 4.64m W x 2.52m H x 6.00m L.
  const hullEnvelopeGroup = new T.Group();
  hullEnvelopeGroup.name = 'RelativisticAirframe_Envelope';
  bodyGroup.add(hullEnvelopeGroup);

  // ===========================================================================
  // 1. CENTRAL LOFTED STEALTH DAGGER FUSELAGE, CHIN INTAKE & BELLY KEEL
  // ===========================================================================
  const fuselageGroup = new T.Group();
  fuselageGroup.name = 'CentralStealthFuselage_Group';
  hullEnvelopeGroup.add(fuselageGroup);

  const fuselageMesh = new T.Mesh(createLoftedStealthFuselage(T), hullCeramicMat);
  fuselageMesh.name = 'CentralStealthFuselage_LoftedHull';
  fuselageGroup.add(fuselageMesh);

  // Forward sharp armored dorsal nose fairing & telemetry slit (sits flush on sloped upper prow)
  const noseSpine = new T.Mesh(createChamferedBlock(T, 0.24, 0.12, 1.24, 0.05, 0.012), secondaryArmorMat);
  noseSpine.name = 'ForwardNose_DorsalChine';
  noseSpine.position.set(0, 0.42, 1.98);
  noseSpine.rotation.x = 0.26;
  fuselageGroup.add(noseSpine);

  const noseSensorRecess = new T.Mesh(new T.BoxGeometry(0.14, 0.055, 0.26), darkFrameMat);
  noseSensorRecess.position.set(0, 0.58, 1.54);
  noseSensorRecess.rotation.x = 0.28;
  fuselageGroup.add(noseSensorRecess);

  const noseSensorPip = new T.Mesh(new T.BoxGeometry(0.085, 0.024, 0.14), cyanGlowMat);
  noseSensorPip.position.set(0, 0.595, 1.56);
  noseSensorPip.rotation.x = 0.28;
  fuselageGroup.add(noseSensorPip);

  // Recessed dark mechanical front chin intake bay beneath the sharp prow (matches 01_front & 08_iso!)
  const chinIntakeGroup = new T.Group();
  chinIntakeGroup.name = 'ForwardChinIntake_Assembly';
  chinIntakeGroup.position.set(0, -0.22, 0.96);
  fuselageGroup.add(chinIntakeGroup);

  const chinFrame = new T.Mesh(createChamferedBlock(T, 1.18, 0.42, 0.98, 0.06, 0.018), darkFrameMat);
  chinIntakeGroup.add(chinFrame);

  const chinBore = new T.Mesh(new T.BoxGeometry(0.96, 0.26, 0.18), deepCavityMat);
  chinBore.position.set(0, -0.02, 0.44);
  chinIntakeGroup.add(chinBore);

  // Horizontal splitter vane & twin vertical mechanical ribs inside chin intake
  const chinSplitter = new T.Mesh(new T.BoxGeometry(0.92, 0.036, 0.24), secondaryArmorMat);
  chinSplitter.position.set(0, -0.02, 0.46);
  chinIntakeGroup.add(chinSplitter);

  [-0.24, 0.24].forEach((rx) => {
    const rib = new T.Mesh(new T.BoxGeometry(0.045, 0.25, 0.22), machinedAlloyMat);
    rib.position.set(rx, -0.02, 0.46);
    chinIntakeGroup.add(rib);
  });

  // Subtle cyan optical chin telemetry sensor beneath prow tip
  const prowChinSensor = new T.Mesh(new T.BoxGeometry(0.11, 0.048, 0.12), cyanGlowMat);
  prowChinSensor.position.set(0, -0.07, 2.26);
  fuselageGroup.add(prowChinSensor);

  // Flat beveled SVG-extruded ventral armored belly keel plate (matches 06_bottom!)
  const bellyKeelGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.ventralKeelPlate, {
    depth: 0.14,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 1,
    uvAxes: ['x', 'y'],
    uvTile: [1.0, 1.2]
  });
  bellyKeelGeo.rotateX(Math.PI * 0.5);
  const bellyKeelMesh = new T.Mesh(bellyKeelGeo, secondaryArmorMat);
  bellyKeelMesh.name = 'VentralBelly_ArmoredKeelPlate';
  bellyKeelMesh.position.set(0, -0.44, -0.08);
  fuselageGroup.add(bellyKeelMesh);

  // ===========================================================================
  // 2. ELEVATED ARMORED COCKPIT CANOPY & DORSAL TACTICAL RIDGE (+Y -> +1.26m)
  // ===========================================================================
  const cockpitGroup = new T.Group();
  cockpitGroup.name = 'ArmoredCockpit_CanopyAssembly';
  cockpitGroup.position.set(0, 0.62, 0.02);
  fuselageGroup.add(cockpitGroup);

  // SVG-extruded central dorsal armored ridge housing (deep skirt seats flush into fuselage!)
  const cockpitSpineGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.cockpitSpineSide, {
    depth: 0.72,
    bevelThickness: 0.048,
    bevelSize: 0.038,
    bevelSegments: 1,
    uvAxes: ['x', 'y'],
    uvTile: [1.2, 0.8]
  });
  // Rotate so SVG +X aligns with +Z (forward), SVG +Y stays +Y (up), extrusion depth spans X (width)
  cockpitSpineGeo.rotateY(-Math.PI * 0.5);
  const cockpitSpineMesh = new T.Mesh(cockpitSpineGeo, hullCeramicMat);
  cockpitSpineMesh.name = 'ArmoredCockpit_DorsalRidge';
  cockpitGroup.add(cockpitSpineMesh);

  // Raked Smoked Forward Windshield Canopy (trapezoidal twin-pane cockpit glass)
  const windshieldPivot = new T.Group();
  windshieldPivot.position.set(0, 0.42, 0.80);
  windshieldPivot.rotation.x = 0.40;
  cockpitGroup.add(windshieldPivot);

  const windshieldFrame = new T.Mesh(createChamferedBlock(T, 0.66, 0.095, 1.02, 0.06, 0.012), darkFrameMat);
  windshieldPivot.add(windshieldFrame);

  const windshieldGlass = new T.Mesh(new T.BoxGeometry(0.54, 0.072, 0.88), canopyGlassMat);
  windshieldGlass.position.set(0, 0.030, 0.01);
  windshieldPivot.add(windshieldGlass);

  // Center armored cockpit windshield mullion strut
  const centerMullion = new T.Mesh(new T.BoxGeometry(0.062, 0.088, 0.94), secondaryArmorMat);
  centerMullion.position.set(0, 0.040, 0.01);
  windshieldPivot.add(centerMullion);

  // Twin Recessed Square Lateral Cockpit Windows (matches 03_right & 07_iso!)
  [-1, 1].forEach((side) => {
    const sideWinGroup = new T.Group();
    sideWinGroup.position.set(side * 0.40, 0.42, 0.08);
    sideWinGroup.rotation.z = -side * 0.16;
    const frame = new T.Mesh(new T.BoxGeometry(0.055, 0.24, 0.34), darkFrameMat);
    const pane = new T.Mesh(new T.BoxGeometry(0.04, 0.18, 0.26), canopyGlassMat);
    pane.position.x = side * 0.018;
    sideWinGroup.add(frame, pane);
    cockpitGroup.add(sideWinGroup);

    // Side forward cheek micro-sensor pips on upper prow
    const cheekSensor = new T.Mesh(new T.BoxGeometry(0.05, 0.036, 0.09), cyanGlowMat);
    cheekSensor.position.set(side * 0.39, 0.06, 1.28);
    cockpitGroup.add(cheekSensor);
  });

  // Recessed Dorsal Roof Hatch & Aft Spine Armor Crest (reaches Y = +1.26m)
  const roofHatchFrame = new T.Mesh(createChamferedBlock(T, 0.48, 0.072, 0.46, 0.04, 0.010), darkFrameMat);
  roofHatchFrame.position.set(0, 0.62, -0.02);
  cockpitGroup.add(roofHatchFrame);

  const roofHatchGlass = new T.Mesh(new T.BoxGeometry(0.36, 0.045, 0.34), canopyGlassMat);
  roofHatchGlass.position.set(0, 0.642, -0.02);
  cockpitGroup.add(roofHatchGlass);

  // ===========================================================================
  // 3. SWEPT STEALTH ARROW-DELTA WINGS, WINGTIP NACELLES & DORSAL TAIL FINS (±X -> ±2.32m)
  // ===========================================================================
  const buildStealthWing = (side) => {
    const label = side < 0 ? 'Port' : 'Starboard';
    const mirror = side < 0;
    const wingGroup = new T.Group();
    wingGroup.name = `StealthDeltaWing_${label}`;
    hullEnvelopeGroup.add(wingGroup);

    // Primary SVG-extruded swept stealth delta wing body
    // rotateX(+PI/2) maps (x, y, z) -> (x, -z, +y), so SVG +Y (+1.18) points FORWARD (+Z)
    // and SVG -Y (-2.62) sweeps cleanly BACKWARD (-Z) into the outer wingtip nacelles!
    const wingGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.wingPlanform, {
      depth: 0.22,
      bevelThickness: 0.042,
      bevelSize: 0.038,
      bevelSegments: 1,
      mirrorX: mirror,
      uvAxes: ['x', 'y'],
      uvTile: [1.3, 1.5]
    });
    wingGeo.rotateX(Math.PI * 0.5);
    const wingMain = new T.Mesh(wingGeo, hullCeramicMat);
    wingMain.name = `StealthDeltaWing_${label}_MainSlab`;
    wingMain.position.set(0, 0.24, 0);
    wingGroup.add(wingMain);

    // Layered beveled upper stealth armor carapace (SVG-extruded)
    const carapaceGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.wingUpperCarapace, {
      depth: 0.11,
      bevelThickness: 0.030,
      bevelSize: 0.028,
      bevelSegments: 1,
      mirrorX: mirror,
      uvAxes: ['x', 'y'],
      uvTile: [1.1, 1.2]
    });
    carapaceGeo.rotateX(Math.PI * 0.5);
    const carapaceMesh = new T.Mesh(carapaceGeo, secondaryArmorMat);
    carapaceMesh.position.set(0, 0.38, 0);
    wingGroup.add(carapaceMesh);

    // Dark mechanical leading-edge armor trim flush along the swept-back wing leading edge!
    const leadingEdgeTrim = new T.Mesh(createChamferedBlock(T, 0.18, 0.15, 1.82, 0.03, 0.012), darkFrameMat);
    leadingEdgeTrim.position.set(side * 1.32, 0.22, -0.02);
    leadingEdgeTrim.rotation.y = -side * 0.71;
    wingGroup.add(leadingEdgeTrim);

    const wingTrench = new T.Mesh(new T.BoxGeometry(0.18, 0.08, 0.96), deepCavityMat);
    wingTrench.position.set(side * 1.12, 0.44, -0.78);
    wingTrench.rotation.y = -side * 0.22;
    wingGroup.add(wingTrench);

    const wingConduitGlow = new T.Mesh(new T.BoxGeometry(0.045, 0.035, 0.46), cyanGlowMat);
    wingConduitGlow.position.set(side * 1.12, 0.44, -0.78);
    wingConduitGlow.rotation.y = -side * 0.22;
    wingGroup.add(wingConduitGlow);

    // Heavy Sculpted Outer Wingtip Armored Shoulder Nacelle (SVG-extruded, reaches ±2.32m at aft wingtip!)
    const tipNacelleGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.wingtipNacelle, {
      depth: 0.34,
      bevelThickness: 0.052,
      bevelSize: 0.042,
      bevelSegments: 1,
      mirrorX: mirror,
      uvAxes: ['x', 'y'],
      uvTile: [0.9, 1.1]
    });
    tipNacelleGeo.rotateX(Math.PI * 0.5);
    const tipNacelleMesh = new T.Mesh(tipNacelleGeo, hullCeramicMat);
    tipNacelleMesh.name = `WingtipNacelle_${label}_ArmorHousing`;
    tipNacelleMesh.position.set(0, 0.24, 0);
    wingGroup.add(tipNacelleMesh);

    // Outer wingtip rear beveled slate armor shroud & exhaust vent
    const tipAftCap = new T.Mesh(createChamferedBlock(T, 0.52, 0.30, 0.44, 0.05, 0.014), secondaryArmorMat);
    tipAftCap.position.set(side * 1.92, 0.24, -2.38);
    tipAftCap.rotation.y = side * 0.20;
    wingGroup.add(tipAftCap);

    const tipAftVent = new T.Mesh(new T.BoxGeometry(0.28, 0.14, 0.12), deepCavityMat);
    tipAftVent.position.set(side * 1.94, 0.24, -2.58);
    tipAftVent.rotation.y = side * 0.20;
    wingGroup.add(tipAftVent);

    // Swept-Back Sharp Dorsal Wingtip Blade Fin / Antenna (SVG-extruded, reaches Z = -3.00m!)
    const finGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.dorsalTailFin, {
      depth: 0.048,
      bevelThickness: 0.010,
      bevelSize: 0.008,
      bevelSegments: 1,
      uvAxes: ['x', 'y'],
      uvTile: [1.0, 1.0]
    });
    finGeo.rotateY(-Math.PI * 0.5);
    const dorsalFinMesh = new T.Mesh(finGeo, secondaryArmorMat);
    dorsalFinMesh.name = `WingtipDorsalFin_${label}`;
    dorsalFinMesh.position.set(side * 1.72, 0.44, -2.36);
    dorsalFinMesh.rotation.z = -side * 0.26;
    wingGroup.add(dorsalFinMesh);

    // Under-Wingtip Hanging Cyan Maneuvering Thruster / Nav Pod (exact match to 01_front, 02_back, 03_right!)
    const navPodGroup = new T.Group();
    navPodGroup.name = `WingtipCyanPod_${label}`;
    navPodGroup.position.set(side * 2.04, -0.02, -1.78);
    wingGroup.add(navPodGroup);

    const navHousing = new T.Mesh(createChamferedBlock(T, 0.24, 0.26, 0.38, 0.04, 0.012), darkFrameMat);
    navPodGroup.add(navHousing);

    const navCyanLens = new T.Mesh(new T.SphereGeometry(0.115, 14, 10), cyanGlowMat);
    navCyanLens.scale.set(0.85, 1.12, 0.92);
    navCyanLens.position.set(side * 0.05, -0.04, -0.04);
    navPodGroup.add(navCyanLens);
  };

  buildStealthWing(-1); // Port (-X) Wing
  buildStealthWing(1);  // Starboard (+X) Wing

  // ===========================================================================
  // 4. REAR (-Z) CENTRAL RELATIVISTIC CYAN ION ENGINE & AFT EXHAUST SHROUDS
  // ===========================================================================
  const rearEngineGroup = new T.Group();
  rearEngineGroup.name = 'RearRelativisticEngine_Assembly';
  rearEngineGroup.position.set(0, 0.16, -2.06);
  rearEngineGroup.rotation.y = Math.PI;
  hullEnvelopeGroup.add(rearEngineGroup);

  // Heavy circular beveled rear engine cowling shroud (exact match to 02_back_negX.png!)
  const engineBellProfile = [
    new T.Vector2(0.56, -0.26),
    new T.Vector2(0.58, -0.04),
    new T.Vector2(0.53,  0.18),
    new T.Vector2(0.46,  0.22),
    new T.Vector2(0.42,  0.14),
    new T.Vector2(0.39, -0.08)
  ];
  const engineBellGeo = new T.LatheGeometry(engineBellProfile, 32);
  engineBellGeo.rotateX(Math.PI * 0.5);
  rearEngineGroup.add(new T.Mesh(engineBellGeo, darkFrameMat));

  // Blazing custom GLSL pulsing cyan relativistic plasma thruster core
  const engineCoreMesh = new T.Mesh(new T.CircleGeometry(0.41, 32), cyanEngineShaderMat);
  engineCoreMesh.name = 'RearMainEngine_CyanPlasmaCore';
  engineCoreMesh.position.z = 0.08;
  rearEngineGroup.add(engineCoreMesh);

  // Signature armored cross-baffle bars across the circular cyan engine aperture (visible in 02_back_negX.png!)
  const baffleRing = new T.Mesh(new T.TorusGeometry(0.42, 0.024, 10, 32), machinedAlloyMat);
  baffleRing.position.z = 0.14;
  rearEngineGroup.add(baffleRing);

  for (let b = 0; b < 4; b++) {
    const ba = (b / 4) * Math.PI * 2;
    const lug = new T.Mesh(new T.BoxGeometry(0.085, 0.13, 0.07), darkFrameMat);
    lug.position.set(Math.cos(ba) * 0.37, Math.sin(ba) * 0.37, 0.14);
    lug.rotation.z = ba;
    rearEngineGroup.add(lug);
  }

  // Translucent cyan ion thrust glow cone (fits cleanly inside Z >= -3.00 envelope)
  const rearPlumeMat = new T.MeshBasicMaterial({
    name: 'RearMainEngine_CyanIonPlume',
    color: 0x00eeff,
    transparent: true,
    opacity: 0.42,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide
  });
  const rearPlumeGeo = new T.ConeGeometry(0.34, 0.68, 24, 1, true);
  rearPlumeGeo.rotateX(Math.PI * 0.5);
  rearPlumeGeo.translate(0, 0, 0.36);
  const rearPlumeMesh = new T.Mesh(rearPlumeGeo, rearPlumeMat);
  rearPlumeMesh.name = 'RearMainEngine_IonCone';
  rearPlumeMesh.userData.noShadow = true;
  rearPlumeMesh.castShadow = false;
  rearEngineGroup.add(rearPlumeMesh);

  // Flanking Twin Angled Dark Trapezoidal Rear Exhaust Shrouds above the ventral pods (02_back_negX.png!)
  [-1, 1].forEach((side) => {
    const aftVentGroup = new T.Group();
    aftVentGroup.position.set(side * 1.18, -0.22, -1.68);
    aftVentGroup.rotation.z = -side * 0.42;
    hullEnvelopeGroup.add(aftVentGroup);

    const ventBox = new T.Mesh(createChamferedBlock(T, 0.58, 0.36, 0.52, 0.04, 0.015), darkFrameMat);
    aftVentGroup.add(ventBox);

    const ventRecess = new T.Mesh(new T.BoxGeometry(0.44, 0.22, 0.14), deepCavityMat);
    ventRecess.position.z = -0.22;
    aftVentGroup.add(ventRecess);

    const ventCyanSlit = new T.Mesh(new T.BoxGeometry(0.34, 0.036, 0.04), cyanGlowMat);
    ventCyanSlit.position.set(0, 0.04, -0.26);
    aftVentGroup.add(ventCyanSlit);
  });

  // ===========================================================================
  // 5. TWIN HEAVY UNDERSLUNG VENTRAL WEAPON PODS & 4 TACHYON LANCE EMITTERS
  //    Each pod mounts 2 stacked forward-pointing Tachyon Lance Emitters:
  //      - Index 0: Port Upper     (x = -1.80, y = -0.58, z_tip = +1.42)
  //      - Index 1: Port Lower     (x = -1.50, y = -0.92, z_tip = +1.38)
  //      - Index 2: Starboard Upper(x = +1.80, y = -0.58, z_tip = +1.42)
  //      - Index 3: Starboard Lower(x = +1.50, y = -0.92, z_tip = +1.38)
  // ===========================================================================
  const emitters = []; // Array of 4 emitter descriptors matching weaponDecalNames order

  const buildEmitterBarrel = (podGroup, spec) => {
    const emitterRoot = new T.Group();
    emitterRoot.name = `TachyonLanceEmitter_${spec.label}_Root`;
    emitterRoot.position.set(spec.localX, spec.localY, spec.baseZ);
    podGroup.add(emitterRoot);

    // Fixed dark pod bay socket collar
    const socketGeo = new T.CylinderGeometry(0.185, 0.215, 0.24, 24);
    socketGeo.rotateX(Math.PI * 0.5);
    emitterRoot.add(new T.Mesh(socketGeo, darkFrameMat));

    // Recoiling accelerator barrel assembly (slides cleanly along -Z when launching!)
    const barrelGroup = new T.Group();
    barrelGroup.name = `TachyonLanceEmitter_${spec.label}_Barrel`;
    emitterRoot.add(barrelGroup);

    // Multi-tiered metallic gunmetal & alloy accelerator shroud (z = 0.08 -> 0.58)
    const barrelProfile = [
      new T.Vector2(0.165, 0.08),
      new T.Vector2(0.175, 0.16),
      new T.Vector2(0.155, 0.22),
      new T.Vector2(0.155, 0.36),
      new T.Vector2(0.172, 0.40),
      new T.Vector2(0.162, 0.52),
      new T.Vector2(0.132, 0.58),
      new T.Vector2(0.102, 0.58),
      new T.Vector2(0.095, 0.42)
    ];
    const barrelGeo = new T.LatheGeometry(barrelProfile, 24);
    barrelGeo.rotateX(Math.PI * 0.5);
    barrelGroup.add(new T.Mesh(barrelGeo, darkFrameMat));

    // Brushed alloy cooling fins along emitter barrel
    for (let r = 0; r < 3; r++) {
      const fin = new T.Mesh(new T.TorusGeometry(0.168, 0.014, 8, 24), machinedAlloyMat);
      fin.position.z = 0.22 + r * 0.095;
      barrelGroup.add(fin);
    }

    // Independent per-emitter glowing electric-cyan muzzle focus ring & phase bore
    const muzzleGlowMat = new T.MeshStandardMaterial({
      name: `TachyonEmitter_${spec.label}_CyanGlowMat`,
      color: 0x2ef6ff,
      emissive: 0x00f6ff,
      emissiveIntensity: 2.35,
      metalness: 0.10,
      roughness: 0.12
    });

    const muzzleOuterRing = new T.Mesh(new T.TorusGeometry(0.126, 0.018, 10, 24), muzzleGlowMat);
    muzzleOuterRing.position.z = 0.565;
    barrelGroup.add(muzzleOuterRing);

    const boreInnerRing = new T.Mesh(new T.TorusGeometry(0.082, 0.012, 8, 20), muzzleGlowMat);
    boreInnerRing.position.z = 0.54;
    barrelGroup.add(boreInnerRing);

    // Deep obsidian accelerator bore interior
    const boreTube = new T.Mesh(new T.CylinderGeometry(0.094, 0.094, 0.36, 18, 1, true), deepCavityMat);
    boreTube.rotation.x = Math.PI * 0.5;
    boreTube.position.z = 0.38;
    barrelGroup.add(boreTube);

    // Signature protruding glowing cyan plasma ignition prongs/needle tips (visible in 01_front, 03_right, 08_iso!)
    const prongGeo = new T.ConeGeometry(0.022, 0.19, 10);
    prongGeo.rotateX(Math.PI * 0.5);
    [-1, 1].forEach((ps) => {
      const prong = new T.Mesh(prongGeo, muzzleGlowMat);
      prong.position.set(ps * 0.058, 0.0, 0.64);
      barrelGroup.add(prong);
    });

    // 4 Articulated Recoil Accelerator Petals around muzzle (flare outward on missile launch!)
    const irisPetals = [];
    const petalGeo = createChamferedBlock(T, 0.056, 0.072, 0.12, 0.012, 0.005);
    for (let p = 0; p < 4; p++) {
      const pa = (p / 4) * Math.PI * 2 + Math.PI * 0.25;
      const pPivot = new T.Group();
      pPivot.rotation.z = pa;

      const petal = new T.Group();
      petal.position.set(0, 0.142, 0.52);
      petal.rotation.x = 0.18;

      const plate = new T.Mesh(petalGeo, p % 2 === 0 ? secondaryArmorMat : darkFrameMat);
      const tipStrip = new T.Mesh(new T.BoxGeometry(0.022, 0.022, 0.05), muzzleGlowMat);
      tipStrip.position.set(0, -0.018, 0.052);
      petal.add(plate, tipStrip);
      pPivot.add(petal);
      barrelGroup.add(pPivot);

      irisPetals.push({
        petal,
        baseY: 0.142,
        baseZ: 0.52,
        baseRotX: 0.18
      });
    }

    const emitterData = {
      index: spec.index,
      id: spec.id,
      label: spec.label,
      side: spec.side,
      tier: spec.tier,
      decalName: weaponDecalNames[spec.index],
      emitterRoot,
      barrelGroup,
      muzzleGlowMat,
      irisPetals,
      rawTipLocal: new T.Vector3(
        spec.podX + spec.localX,
        spec.podY + spec.localY,
        spec.podZ + spec.baseZ + spec.tipOffsetZ
      )
    };
    emitters.push(emitterData);
    return emitterData;
  };

  const buildVentralWeaponPod = (side, startIndex) => {
    const sideLabel = side < 0 ? 'Port' : 'Starboard';
    const podX = side * 1.56;
    const podY = -0.74;
    const podZ = -0.18;

    const podGroup = new T.Group();
    podGroup.name = `VentralWeaponPod_${sideLabel}`;
    podGroup.position.set(podX, podY, podZ);
    hullEnvelopeGroup.add(podGroup);

    // 1. Heavy Under-Wing Mechanical Actuator Truss Pylon + Glowing Cyan Side Reactor Cell (03_right, 07_iso!)
    const pylonGroup = new T.Group();
    pylonGroup.name = `WeaponPodPylon_${sideLabel}`;
    pylonGroup.position.set(-side * 0.16, 0.56, -0.26);
    podGroup.add(pylonGroup);

    const pylonMain = new T.Mesh(createChamferedBlock(T, 0.56, 0.44, 1.58, 0.06, 0.018), darkFrameMat);
    pylonGroup.add(pylonMain);

    const pylonFrontCell = new T.Mesh(new T.BoxGeometry(0.32, 0.18, 0.14), cyanGlowMat);
    pylonFrontCell.position.set(side * 0.12, 0.02, 0.80);
    pylonGroup.add(pylonFrontCell);

    const pylonSideCell = new T.Mesh(new T.BoxGeometry(0.14, 0.20, 0.30), cyanGlowMat);
    pylonSideCell.position.set(side * 0.30, -0.02, -0.10);
    pylonGroup.add(pylonSideCell);

    // 2. Massive Faceted Stealth Armored Ventral Pod Hull (SVG-extruded side profile -> 03_right & 08_iso!)
    const podHullGeo = createExtrudedSvgGeometry(T, SVG_GEOMETRY_PATHS.ventralPodSideProfile, {
      depth: 0.86,
      bevelThickness: 0.08,
      bevelSize: 0.07,
      bevelSegments: 2,
      uvAxes: ['x', 'y'],
      uvTile: [1.4, 1.0]
    });
    // Rotate so SVG +X = +Z (forward), SVG +Y = +Y (up), extrusion spans X (width)
    podHullGeo.rotateY(-Math.PI * 0.5);
    const podHullMesh = new T.Mesh(podHullGeo, hullCeramicMat);
    podHullMesh.name = `VentralWeaponPod_${sideLabel}_MainArmor`;
    podGroup.add(podHullMesh);

    // Stepped forward seam rib collar wrapping the outer pod armor (clearly visible vertical seam in 03_right!)
    const podSeamBand = new T.Mesh(createChamferedBlock(T, 1.04, 0.84, 0.10, 0.14, 0.015), darkFrameMat);
    podSeamBand.position.set(0, -0.05, 0.30);
    podGroup.add(podSeamBand);

    // Sculpted outboard beveled ceramic armor cheek fairing (matches warm taupe stealth side armor!)
    const outerPlate = new T.Mesh(createChamferedBlock(T, 0.16, 0.62, 1.78, 0.08, 0.02), hullCeramicMat);
    outerPlate.position.set(side * 0.46, -0.06, -0.22);
    podGroup.add(outerPlate);

    // Ventral skid keel plate on pod bottom (reaches Y = -1.26m!)
    const podSkid = new T.Mesh(createChamferedBlock(T, 0.54, 0.10, 1.56, 0.06, 0.015), darkFrameMat);
    podSkid.position.set(0, -0.50, -0.08);
    podGroup.add(podSkid);

    // Forward open-front deep armored emitter bay hood (SVG chamfered frame surrounding the 2 stacked emitters!)
    const bayHoodOuter = new T.Mesh(createChamferedBlock(T, 0.96, 0.82, 0.42, 0.14, 0.022), darkFrameMat);
    bayHoodOuter.position.set(0, -0.04, 0.96);
    podGroup.add(bayHoodOuter);

    const bayRecess = new T.Mesh(new T.BoxGeometry(0.76, 0.64, 0.34), deepCavityMat);
    bayRecess.position.set(0, -0.04, 1.04);
    podGroup.add(bayRecess);

    // Diagonal Twin-Stacked Tachyon Lance Emitters inside this pod (exact match to 01_front_posX.png!)
    // Upper emitter sits slightly outboard; Lower emitter sits slightly inboard & lower!
    buildEmitterBarrel(podGroup, {
      index: startIndex,
      id: side < 0 ? 'port_upper' : 'starboard_upper',
      label: `${sideLabel}_Upper`,
      side,
      tier: 'upper',
      podX,
      podY,
      podZ,
      localX: side * 0.21,
      localY: 0.15,
      baseZ: 0.96,
      tipOffsetZ: 0.64 // world z = -0.18 + 0.96 + 0.64 = +1.42m!
    });

    buildEmitterBarrel(podGroup, {
      index: startIndex + 1,
      id: side < 0 ? 'port_lower' : 'starboard_lower',
      label: `${sideLabel}_Lower`,
      side,
      tier: 'lower',
      podX,
      podY,
      podZ,
      localX: -side * 0.06,
      localY: -0.18,
      baseZ: 0.92,
      tipOffsetZ: 0.64 // world z = -0.18 + 0.92 + 0.64 = +1.38m!
    });
  };

  buildVentralWeaponPod(-1, 0); // Emitters 0 (Port Upper) & 1 (Port Lower)
  buildVentralWeaponPod(1, 2);  // Emitters 2 (Starboard Upper) & 3 (Starboard Lower)

  // ===========================================================================
  // 6. EXACT ANALYTICAL CALIBRATION -> 4.64m (W) x 2.52m (H) x 6.00m (L)
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

  const metaTipKeys = ['portUpper', 'portLower', 'starboardUpper', 'starboardLower'];
  for (let i = 0; i < emitters.length; i++) {
    const em = emitters[i];
    const tipCal = em.rawTipLocal.clone().applyMatrix4(hullEnvelopeGroup.matrix);
    em.tipPos = tipCal;
    metadata.emitterTips[metaTipKeys[i]] = {
      x: Number(tipCal.x.toFixed(4)),
      y: Number((BASE_CENTER_Y + tipCal.y).toFixed(4)),
      z: Number(tipCal.z.toFixed(4))
    };
  }

  // ===========================================================================
  // 7. AMBIENT CYAN RELATIVISTIC ENGINE WAKE PARTICLES (Contained Inside 6.00m Hull)
  // ===========================================================================
  const ambientCount = 96;
  const ambientSeeds = [];
  const ambientPositions = new Float32Array(ambientCount * 3);
  const ambientColors = new Float32Array(ambientCount * 3);
  const tmpColor = new T.Color();

  for (let i = 0; i < ambientCount; i++) {
    const u = rand();
    const ang = rand() * Math.PI * 2;
    const rad = 0.06 + rand() * 0.30;
    const lane = i % 3; // 0: main stern cyan engine, 1: port wingtip pod, 2: starboard wingtip pod
    ambientSeeds.push({ u, ang, rad, lane, speed: 1.0 + Math.round(rand() * 2.0) });

    ambientPositions[i * 3] = 0;
    ambientPositions[i * 3 + 1] = 0.16;
    ambientPositions[i * 3 + 2] = -2.35;

    tmpColor.setHex(rand() > 0.25 ? 0x00f2ff : 0xa8f8ff);
    ambientColors[i * 3] = tmpColor.r;
    ambientColors[i * 3 + 1] = tmpColor.g;
    ambientColors[i * 3 + 2] = tmpColor.b;
  }

  const ambientGeo = new T.BufferGeometry();
  ambientGeo.setAttribute('position', new T.BufferAttribute(ambientPositions, 3));
  ambientGeo.setAttribute('color', new T.BufferAttribute(ambientColors, 3));
  const ambientMat = new T.PointsMaterial({
    name: 'RelativisticEngine_CyanWakeParticles',
    size: 0.085,
    map: fxTex.sparkTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    blending: T.AdditiveBlending,
    depthWrite: false
  });
  const ambientParticles = new T.Points(ambientGeo, ambientMat);
  ambientParticles.name = 'RelativisticEngine_CyanWakeSwarm';
  bodyGroup.add(ambientParticles);

  // ===========================================================================
  // 8. SHARED HIGH-DETAIL 3D TACHYON LANCE MISSILE GEOMETRIES
  //    Faithfully duplicates meshy_test_0/models/tachyon_lance/tachyon_lance.glb:
  //    Local +Z = glowing magenta crystalline lance tip (+0.80m)
  //    Local -Z = tapered metallic gold tail cone (-0.76m)
  //    Total length: 1.56m, flange outer diameter: 0.30m (fits 0.34m emitter bore!)
  // ===========================================================================
  // 8A. Aft Tapered Gold Cone (-0.76 -> -0.34)
  const lanceAftConeProfile = [
    new T.Vector2(0.002, -0.76),
    new T.Vector2(0.036, -0.66),
    new T.Vector2(0.070, -0.55),
    new T.Vector2(0.098, -0.44),
    new T.Vector2(0.114, -0.34)
  ];
  const sharedLanceAftConeGeo = new T.LatheGeometry(lanceAftConeProfile, 14);
  sharedLanceAftConeGeo.rotateX(Math.PI * 0.5);

  // 8B. Protruding Stepped Chrome-Gold Stabilizer Flanges (aft at z=-0.32 & forward at z=+0.34)
  const lanceFlangeProfile = [
    new T.Vector2(0.116, -0.035),
    new T.Vector2(0.148, -0.022),
    new T.Vector2(0.150,  0.000),
    new T.Vector2(0.148,  0.022),
    new T.Vector2(0.116,  0.035)
  ];
  const sharedLanceFlangeGeo = new T.LatheGeometry(lanceFlangeProfile, 16);
  sharedLanceFlangeGeo.rotateX(Math.PI * 0.5);

  // 8C. Main SVG-Textured Slotted Gold/Chrome Accelerator Barrel (-0.30 -> +0.34)
  const sharedLanceBarrelGeo = new T.CylinderGeometry(0.116, 0.116, 0.64, 16, 1);
  sharedLanceBarrelGeo.rotateX(Math.PI * 0.5);

  // 8D. Glowing Hot-Magenta Phase Coil Rings along the Tachyon Lance
  const sharedLancePhaseRingGeo = new T.TorusGeometry(0.118, 0.014, 7, 16);
  const sharedLanceSmallPhaseRingGeo = new T.TorusGeometry(0.076, 0.011, 6, 14);
  const sharedLanceTinyPhaseRingGeo = new T.TorusGeometry(0.045, 0.009, 6, 12);

  // 8E. Forward Stepped Chrome & Gold Breech Collar (+0.34 -> +0.52)
  const lanceForeBreechProfile = [
    new T.Vector2(0.128, 0.34),
    new T.Vector2(0.132, 0.42),
    new T.Vector2(0.122, 0.45),
    new T.Vector2(0.132, 0.48),
    new T.Vector2(0.128, 0.54)
  ];
  const sharedLanceForeBreechGeo = new T.LatheGeometry(lanceForeBreechProfile, 16);
  sharedLanceForeBreechGeo.rotateX(Math.PI * 0.5);

  // 8F. Faceted Hot-Magenta Warhead Crown Collar (+0.54 -> +0.66)
  const lanceCrownProfile = [
    new T.Vector2(0.128, 0.54),
    new T.Vector2(0.118, 0.60),
    new T.Vector2(0.082, 0.65),
    new T.Vector2(0.056, 0.66)
  ];
  const sharedLanceCrownGeo = new T.LatheGeometry(lanceCrownProfile, 10);
  sharedLanceCrownGeo.rotateX(Math.PI * 0.5);

  // 8G. Signature Swirling Crystalline Piercing Lance Spire Tip (+0.64 -> +0.86)
  const sharedLanceSpireGeo = new T.ConeGeometry(0.052, 0.22, 12, 4);
  sharedLanceSpireGeo.rotateX(Math.PI * 0.5);

  // 8H. Recessed Longitudinal Gold Strut Ribs around the slotted mid-barrel
  const sharedLanceRibGeo = new T.BoxGeometry(0.018, 0.022, 0.28);

  // 8I. Superluminal Exhaust Plume & Dynamic Contrail Geometries (tip pointing -Z behind tail)
  const sharedPlumeOuterGeo = new T.ConeGeometry(0.11, 1.55, 12, 6, true);
  sharedPlumeOuterGeo.rotateX(-Math.PI * 0.5);
  sharedPlumeOuterGeo.translate(0, 0, -0.775);

  const sharedPlumeCoreGeo = new T.ConeGeometry(0.052, 0.85, 10, 1, true);
  sharedPlumeCoreGeo.rotateX(-Math.PI * 0.5);
  sharedPlumeCoreGeo.translate(0, 0, -0.425);

  const sharedContrailGeo = new T.ConeGeometry(0.155, 1.0, 10, 1, true);
  sharedContrailGeo.rotateX(-Math.PI * 0.5);
  sharedContrailGeo.translate(0, 0, -0.5);

  // Shared Muzzle Launch & 28.0m Terminal Shield-Pierce Detonation Geometries
  const sharedShockRingGeo = new T.TorusGeometry(0.22, 0.015, 8, 24);
  const sharedFlarePlaneGeo = new T.PlaneGeometry(1.05, 1.05);
  const sharedDetSphereGeo = new T.SphereGeometry(0.42, 14, 10);

  /**
   * Constructs one high-detail procedural + SVG 3D Tachyon Lance missile actor
   * duplicating meshy_test_0/models/tachyon_lance/tachyon_lance.glb.
   */
  function createTachyonLanceActor(emitterLabel, idx, plumeOuterMat, plumeCoreMat, contrailMat) {
    const actor = new T.Group();
    actor.name = `TachyonLanceMissile_${emitterLabel}_${idx}`;

    // Gyro-stabilized rotating Tachyon Lance projectile hull
    const hull = new T.Group();
    hull.name = `TachyonLanceHull_${emitterLabel}_${idx}`;
    actor.add(hull);

    // 1. Aft tapered gold cone with twin recessed magenta phase rings
    const aftCone = new T.Mesh(sharedLanceAftConeGeo, lancePolishedGoldMat);
    aftCone.frustumCulled = false;
    hull.add(aftCone);

    const aftRing1 = new T.Mesh(sharedLanceTinyPhaseRingGeo, lanceMagentaCollarMat);
    aftRing1.position.z = -0.62;
    aftRing1.frustumCulled = false;
    hull.add(aftRing1);

    const aftRing2 = new T.Mesh(sharedLanceSmallPhaseRingGeo, lanceMagentaCollarMat);
    aftRing2.position.z = -0.50;
    aftRing2.frustumCulled = false;
    hull.add(aftRing2);

    // 2. Aft protruding stepped chrome-gold flange collar
    const aftFlange = new T.Mesh(sharedLanceFlangeGeo, lanceChromeMat);
    aftFlange.position.z = -0.32;
    aftFlange.frustumCulled = false;
    hull.add(aftFlange);

    // 3. Central SVG-textured slotted gold/chrome accelerator barrel
    const barrel = new T.Mesh(sharedLanceBarrelGeo, lanceGoldBarrelMat);
    barrel.position.z = 0.02;
    barrel.frustumCulled = false;
    hull.add(barrel);

    // Physical glowing magenta phase coil rings bracketing the slotted core
    const midRingAft = new T.Mesh(sharedLancePhaseRingGeo, lanceMagentaCollarMat);
    midRingAft.position.z = -0.18;
    midRingAft.frustumCulled = false;
    hull.add(midRingAft);

    const midRingFore = new T.Mesh(sharedLancePhaseRingGeo, lanceMagentaCollarMat);
    midRingFore.position.z = 0.14;
    midRingFore.frustumCulled = false;
    hull.add(midRingFore);

    // 6 Longitudinal armored gold accelerator rails around the mid-barrel
    for (let r = 0; r < 6; r++) {
      const ra = (r / 6) * Math.PI * 2;
      const rail = new T.Mesh(sharedLanceRibGeo, r % 2 === 0 ? lancePolishedGoldMat : lanceChromeMat);
      rail.position.set(Math.cos(ra) * 0.118, Math.sin(ra) * 0.118, -0.02);
      rail.rotation.z = ra;
      rail.frustumCulled = false;
      hull.add(rail);
    }

    // 4. Forward protruding stepped chrome-gold flange & breech collar
    const foreFlange = new T.Mesh(sharedLanceFlangeGeo, lanceChromeMat);
    foreFlange.position.z = 0.34;
    foreFlange.frustumCulled = false;
    hull.add(foreFlange);

    const foreBreech = new T.Mesh(sharedLanceForeBreechGeo, lancePolishedGoldMat);
    foreBreech.frustumCulled = false;
    hull.add(foreBreech);

    // 5. Faceted hot-magenta warhead crown collar with dark chrome radial ribs
    const crown = new T.Mesh(sharedLanceCrownGeo, lanceMagentaCollarMat);
    crown.frustumCulled = false;
    hull.add(crown);

    const crownFocusRing = new T.Mesh(sharedLanceSmallPhaseRingGeo, lanceChromeMat);
    crownFocusRing.position.z = 0.64;
    crownFocusRing.frustumCulled = false;
    hull.add(crownFocusRing);

    // 6. Swirling crystalline hot-magenta piercing Tachyon Lance spire tip (+0.75, apex at +0.86)
    const spire = new T.Mesh(sharedLanceSpireGeo, lancePiercingTipShaderMat);
    spire.position.z = 0.75;
    spire.userData.noShadow = true;
    spire.castShadow = false;
    spire.frustumCulled = false;
    hull.add(spire);

    // 7. Superluminal Tachyon Exhaust Plume & Dynamic Contrail attached at aft tail (-0.74)
    const exhaustGroup = new T.Group();
    exhaustGroup.name = `TachyonLanceExhaust_${emitterLabel}_${idx}`;
    exhaustGroup.position.z = -0.74;
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
  // 9. DECAL-CONTROLLED QUAD TACHYON LANCE WEAPON SYSTEMS (28.0m FLIGHT RANGE)
  //    Controlled via meshy_test_0/index.html Decals Tab & Global Decal APIs:
  //      - Decal_MissileStrike_Port_Upper_TachyonLance
  //      - Decal_MissileStrike_Port_Lower_TachyonLance
  //      - Decal_MissileStrike_Starboard_Upper_TachyonLance
  //      - Decal_MissileStrike_Starboard_Lower_TachyonLance
  //    Supports:
  //      - window.toggleDecalMesh(name, true/false)
  //      - window.DECAL_CONFIG.strikesEnabled = true/false; window.applyDecalsVisibility()
  //      - window.DECAL_CONFIG.allEnabled = true/false; window.applyDecalsVisibility()
  //      - window.DECAL_CONFIG.opacity = 0..1; window.applyDecalsVisibility()
  //      - decalMesh.visible = true/false
  // ===========================================================================
  const weaponSystems = [];
  let _lastElapsed = 0.0;

  const PI2 = Math.PI * 2;
  const OMEGA = PI2 / duration;
  const SPARKS_PER_EMITTER = 60; // 240 total across 4 emitters for silky WebXR mobile performance

  // 2 shared pod dynamic PointLights (Port Pod + Starboard Pod) for crisp WebXR muzzle lighting without shader bloat
  const portPodLight = new T.PointLight(0x40f0ff, 0.0, 11.0, 1.5);
  portPodLight.position.set(
    (emitters[0].tipPos.x + emitters[1].tipPos.x) * 0.5,
    (emitters[0].tipPos.y + emitters[1].tipPos.y) * 0.5,
    emitters[0].tipPos.z + 0.45
  );
  bodyGroup.add(portPodLight);

  const stbdPodLight = new T.PointLight(0x40f0ff, 0.0, 11.0, 1.5);
  stbdPodLight.position.set(
    (emitters[2].tipPos.x + emitters[3].tipPos.x) * 0.5,
    (emitters[2].tipPos.y + emitters[3].tipPos.y) * 0.5,
    emitters[2].tipPos.z + 0.45
  );
  bodyGroup.add(stbdPodLight);

  // Stagger offsets across the 4 emitters for alternating quad-barrel superluminal cadence:
  // Port Upper -> Starboard Lower -> Port Lower -> Starboard Upper
  const EMITTER_STAGGER = [
    0.0,
    0.50 / MISSILES_PER_EMITTER,
    0.75 / MISSILES_PER_EMITTER,
    0.25 / MISSILES_PER_EMITTER
  ];

  function createEmitterDecalSystem(emitterIndex) {
    const em = emitters[emitterIndex];
    const decalName = em.decalName;
    const label = em.label;

    // Decal trigger mesh seated cleanly inside the emitter muzzle bore
    // (radius 0.036 recessed 0.04m inside tip so initial Box3 stays strictly 4.64m W x 2.52m H x 6.00m L!)
    const decalControlMat = new T.MeshBasicMaterial({
      name: `${decalName}_Mat`,
      color: 0x00f2ff,
      transparent: true,
      opacity: 1.0,
      blending: T.AdditiveBlending,
      depthWrite: false
    });

    const decalMesh = new T.Mesh(new T.SphereGeometry(0.036, 12, 10), decalControlMat);
    decalMesh.name = decalName;
    decalMesh.position.set(em.tipPos.x, em.tipPos.y, em.tipPos.z - 0.04);
    decalMesh.userData.noShadow = true;
    decalMesh.userData.isDecal = true;
    decalMesh.userData.decalType = 'missile';
    decalMesh.userData.emitterId = em.id;
    decalMesh.userData.emitterIndex = emitterIndex;
    decalMesh.castShadow = false;
    decalMesh.receiveShadow = false;
    bodyGroup.add(decalMesh);

    // Missile flight assembly: child of decalMesh, origin at the EXACT emitter front tip (+0.04m)!
    // Parked collapsed at creation so meshy_test_0 Box3 measures ONLY the 4.64m x 2.52m x 6.00m ship!
    const missileAssembly = new T.Group();
    missileAssembly.name = `TachyonLanceLauncher_${label}_Assembly`;
    missileAssembly.position.set(0, 0, 0.04);
    missileAssembly.scale.setScalar(0.0001);
    missileAssembly.visible = false;
    decalMesh.add(missileAssembly);

    // Independent per-emitter plume & contrail materials so each decal fades/toggles independently
    const { mat: plumeOuterMat, uniforms: plumeUniforms } = createTachyonPlumeShaderMat(label);
    const plumeCoreMat = new T.MeshBasicMaterial({
      name: `TachyonMissile_CyanWhiteCore_${label}`,
      color: 0xe8fdff,
      transparent: true,
      opacity: 0.96,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide
    });
    const contrailMat = createTachyonContrailShaderMat(label, plumeUniforms);

    // 3 Staggered 3D Tachyon Lance Missiles flying 0.0m -> 28.0m from this emitter tip
    const missiles = [];
    for (let k = 0; k < MISSILES_PER_EMITTER; k++) {
      const mActor = createTachyonLanceActor(label, k, plumeOuterMat, plumeCoreMat, contrailMat);
      missileAssembly.add(mActor.actor);
      missiles.push({
        ...mActor,
        phaseOffset: k / MISSILES_PER_EMITTER
      });
    }

    // Muzzle Launch SVG Star-Bloom Flash right at the emitter tip (z = 0.04)
    const muzzleFlareGroup = new T.Group();
    muzzleFlareGroup.name = `TachyonLaunchFlare_${label}`;
    muzzleFlareGroup.position.set(0, 0, 0.04);
    const muzzleFlareMat = new T.MeshBasicMaterial({
      name: `TachyonLaunchFlareMat_${label}`,
      map: fxTex.flareTex,
      color: 0xffffff,
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

    // Expanding Cyan-Magenta Muzzle Launch Shockwave Ring
    const launchRingMat = new T.MeshBasicMaterial({
      name: `TachyonLaunchRingMat_${label}`,
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.0,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const launchRing = new T.Mesh(sharedShockRingGeo, launchRingMat);
    launchRing.name = `TachyonLaunchRing_${label}`;
    launchRing.userData.noShadow = true;
    launchRing.castShadow = false;
    launchRing.frustumCulled = false;
    missileAssembly.add(launchRing);

    // Exact 28.0m Terminal Shield-Piercing Tachyon Detonation FX (triggers right at z = 28.0m!)
    const detGroup = new T.Group();
    detGroup.name = `TachyonTerminalDetonation_${label}`;
    detGroup.position.set(0, 0, MISSILE_RANGE);
    missileAssembly.add(detGroup);

    const detCoreMat = new T.MeshBasicMaterial({
      name: `TachyonDetonationCoreMat_${label}`,
      color: 0xff28bc,
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
      name: `TachyonDetonationRingMat_${label}`,
      color: 0x00f0ff,
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
      name: `TachyonDetonationFlareMat_${label}`,
      map: fxTex.flareTex,
      color: 0xffd6fb,
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

    // Trailing Superluminal Tachyon Ionization Spark Particles along 0..28m corridor
    const sparkSeeds = [];
    const sparkPositions = new Float32Array(SPARKS_PER_EMITTER * 3);
    const sparkColors = new Float32Array(SPARKS_PER_EMITTER * 3);
    for (let i = 0; i < SPARKS_PER_EMITTER; i++) {
      const missileIdx = i % MISSILES_PER_EMITTER;
      const trailFrac = rand();
      const ang = rand() * PI2;
      const rad = 0.02 + rand() * 0.14;
      const drift = (rand() - 0.5) * 0.08;
      sparkSeeds.push({ missileIdx, trailFrac, ang, rad, drift });

      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = 0;
      sparkPositions[i * 3 + 2] = 0;

      const pick = rand();
      if (pick < 0.42) tmpColor.setHex(0xff20b8);
      else if (pick < 0.78) tmpColor.setHex(0x00f0ff);
      else tmpColor.setHex(0xffe08a);
      sparkColors[i * 3] = tmpColor.r;
      sparkColors[i * 3 + 1] = tmpColor.g;
      sparkColors[i * 3 + 2] = tmpColor.b;
    }

    const sparkGeo = new T.BufferGeometry();
    sparkGeo.setAttribute('position', new T.BufferAttribute(sparkPositions, 3));
    sparkGeo.setAttribute('color', new T.BufferAttribute(sparkColors, 3));
    const sparkMat = new T.PointsMaterial({
      name: `TachyonExhaustSparksMat_${label}`,
      size: 0.145,
      map: fxTex.sparkTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.90,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
    const sparkPoints = new T.Points(sparkGeo, sparkMat);
    sparkPoints.name = `TachyonExhaustSparks_${label}`;
    sparkPoints.frustumCulled = false;
    missileAssembly.add(sparkPoints);

    const sys = {
      emitterIndex,
      emitter: em,
      decalName,
      decalMesh,
      decalControlMat,
      plumeUniforms,
      plumeOuterMat,
      plumeCoreMat,
      contrailMat,
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
      staggerOffset: EMITTER_STAGGER[emitterIndex],
      visible: true,
      opacity: 1.0,
      lastLaunchPulse: 0.0,
      activeMissileZ: [0, 0, 0]
    };

    // Intercept .visible updates from meshy_test_0/index.html Decals Tab & Global Decal APIs
    Object.defineProperty(decalMesh, 'visible', {
      configurable: true,
      enumerable: true,
      get() {
        return sys.visible;
      },
      set(val) {
        sys.visible = Boolean(val);
        syncEmitterWeaponState(sys, _lastElapsed);
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
        syncEmitterWeaponState(sys, _lastElapsed);
      }
    });

    weaponSystems.push(sys);
    return sys;
  }

  function applyEmitterAperturePose(em, openFactor, recoilDist) {
    em.barrelGroup.position.z = -recoilDist;
    const dy = openFactor * 0.028;
    const dz = openFactor * 0.014;
    const drx = openFactor * 0.36;
    for (let i = 0; i < em.irisPetals.length; i++) {
      const ip = em.irisPetals[i];
      ip.petal.position.y = ip.baseY + dy;
      ip.petal.position.z = ip.baseZ + dz;
      ip.petal.rotation.x = ip.baseRotX - drx;
    }
  }

  function layoutEmitterMissileSalvo(sys, elapsed, fireLevel) {
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

    // Flight occupies u in [0.0, 0.90] (exact 0.0m -> 28.0m travel), terminal detonation in [0.90, 1.00]
    const FLIGHT_FRAC = 0.90;
    const LANCE_TIP_OFFSET = 0.86; // Exact local +Z of crystalline piercing tip

    for (let k = 0; k < MISSILES_PER_EMITTER; k++) {
      const m = sys.missiles[k];
      const u = (baseSubPhase + m.phaseOffset + sys.staggerOffset) % 1.0;

      if (u < FLIGHT_FRAC) {
        const f = u / FLIGHT_FRAC;
        // Superluminal Tachyon Lance acceleration curve reaching exact 28.00m at f = 1.0!
        const dist = MISSILE_RANGE * (0.34 * f + 0.66 * f * f);
        sys.activeMissileZ[k] = dist;

        m.actor.visible = true;
        // Piercing lance tip (+0.86m) emerges right from the emitter tip and reaches exact 28.00m at f = 1.0
        const zCenter = Math.max(-0.22, dist - LANCE_TIP_OFFSET);
        m.actor.position.set(0, 0, zCenter);

        const emergeScale = f < 0.045 ? (0.42 + 0.58 * (f / 0.045)) : 1.0;
        m.actor.scale.setScalar(emergeScale);

        // Gyroscopic high-speed spin around Z
        m.hull.rotation.z = elapsed * 11.5 + k * 2.1 + sys.emitterIndex * 1.4;

        // Animated superluminal plume (strictly clamped so exhaust never pokes behind z = 0!)
        const flicker = 0.88 + 0.14 * Math.sin(elapsed * 62.0 + k * 2.6) + 0.08 * Math.cos(elapsed * 94.0);
        const availBehind = Math.max(0.04, zCenter - 0.72);
        const plumeLenScale = Math.min(1.0, availBehind / 1.35) * (0.85 + 0.25 * f) * flicker;
        const plumeRadScale = (0.78 + 0.30 * f) * flicker;
        m.plumeOuter.scale.set(plumeRadScale, plumeRadScale, Math.max(0.05, plumeLenScale));
        m.plumeCore.scale.set(plumeRadScale, plumeRadScale, Math.max(0.05, plumeLenScale));

        // Elongated volumetric cyan-magenta tachyon contrail wake (clamped strictly to z >= 0!)
        const trailLen = Math.min(5.2, Math.max(0.05, availBehind));
        m.contrail.scale.set(0.84 + 0.36 * f, 0.84 + 0.36 * f, trailLen);

        if (u < 0.16) {
          const lp = Math.sin((u / 0.16) * Math.PI);
          if (lp > peakLaunchPulse) {
            peakLaunchPulse = lp;
            bestLaunchU = u / 0.16;
          }
        }
      } else {
        // Exact 28.0m terminal shield-piercing detonation window
        m.actor.visible = false;
        sys.activeMissileZ[k] = MISSILE_RANGE;
        const detP = (u - FLIGHT_FRAC) / (1.0 - FLIGHT_FRAC);
        const dp = Math.sin(detP * Math.PI);
        if (dp > peakDetPulse) {
          peakDetPulse = dp;
          bestDetProgress = detP;
        }
      }
    }

    sys.lastLaunchPulse = peakLaunchPulse * fireLevel;

    // Muzzle Launch SVG Star-Flare & Expanding Shockwave Ring at exact emitter tip (z = 0)
    const activeLaunch = peakLaunchPulse * fireLevel;
    sys.muzzleFlareGroup.visible = activeLaunch > 0.01;
    sys.muzzleFlareGroup.rotation.z = elapsed * 8.0 + sys.emitterIndex * 1.2;
    sys.muzzleFlareGroup.scale.setScalar(0.50 + 0.90 * peakLaunchPulse);
    sys.muzzleFlareMat.opacity = activeLaunch * 0.96;

    sys.launchRing.visible = activeLaunch > 0.01;
    sys.launchRing.position.z = 0.04 + bestLaunchU * 1.75;
    sys.launchRing.scale.setScalar(0.50 + bestLaunchU * 1.85);
    sys.launchRingMat.opacity = (1.0 - bestLaunchU) * 0.88 * fireLevel;

    // Exact 28.0m Terminal Tachyon Breach Detonation FX
    const activeDet = peakDetPulse * fireLevel;
    sys.detGroup.visible = activeDet > 0.01;
    if (sys.detGroup.visible) {
      const detScale = 0.45 + bestDetProgress * 2.4;
      sys.detCore.scale.setScalar(detScale * 0.82);
      sys.detCoreMat.opacity = (1.0 - bestDetProgress) * 0.84 * fireLevel;
      sys.detRing.scale.setScalar(0.55 + bestDetProgress * 4.4);
      sys.detRingMat.opacity = (1.0 - bestDetProgress) * 0.92 * fireLevel;
      sys.detFlareMat.opacity = activeDet * 0.96;
      sys.detGroup.rotation.z = elapsed * 5.5;
    }

    // Trailing Tachyon Ionization Spark Particles along each active missile's wake
    sys.sparkMat.opacity = 0.88 * fireLevel;
    const sparkScroll = elapsed * 3.2;
    for (let i = 0; i < SPARKS_PER_EMITTER; i++) {
      const sp = sys.sparkSeeds[i];
      const mz = sys.activeMissileZ[sp.missileIdx];
      const idx = i * 3;
      if (mz > 0.9 && mz < MISSILE_RANGE - 0.1) {
        const tf = (sp.trailFrac + sparkScroll) % 1.0;
        const maxWake = Math.min(5.4, mz - 0.80);
        const pz = Math.max(0.05, (mz - 0.84) - tf * maxWake);
        const spread = sp.rad * (0.42 + 1.65 * tf);
        const ang = sp.ang + elapsed * 4.2;
        sys.sparkPosArr[idx] = Math.cos(ang) * spread + sp.drift * tf;
        sys.sparkPosArr[idx + 1] = Math.sin(ang) * spread;
        sys.sparkPosArr[idx + 2] = pz;
      } else {
        sys.sparkPosArr[idx] = 0;
        sys.sparkPosArr[idx + 1] = 0;
        sys.sparkPosArr[idx + 2] = 0.02;
      }
    }
    sys.sparkPosAttr.needsUpdate = true;

    // Independent Barrel Recoil, Petal Flare & Cyan Emitter Emissive Surge
    const recoilDist = peakLaunchPulse * 0.085 * fireLevel;
    const openFactor = (0.30 + 0.70 * peakLaunchPulse) * fireLevel;
    applyEmitterAperturePose(sys.emitter, openFactor, recoilDist);
    sys.emitter.muzzleGlowMat.emissiveIntensity = 1.95 + (0.95 + 2.25 * peakLaunchPulse) * fireLevel;
  }

  function refreshPodDynamicLights() {
    if (weaponSystems.length < 4) return;
    const portPeak = Math.max(weaponSystems[0].lastLaunchPulse, weaponSystems[1].lastLaunchPulse);
    const portActive = (weaponSystems[0].visible && weaponSystems[0].opacity > 0.005 ? weaponSystems[0].opacity : 0) +
                       (weaponSystems[1].visible && weaponSystems[1].opacity > 0.005 ? weaponSystems[1].opacity : 0);
    portPodLight.intensity = portActive > 0.005 ? (0.9 * portActive + 5.2 * portPeak) : 0.0;

    const stbdPeak = Math.max(weaponSystems[2].lastLaunchPulse, weaponSystems[3].lastLaunchPulse);
    const stbdActive = (weaponSystems[2].visible && weaponSystems[2].opacity > 0.005 ? weaponSystems[2].opacity : 0) +
                       (weaponSystems[3].visible && weaponSystems[3].opacity > 0.005 ? weaponSystems[3].opacity : 0);
    stbdPodLight.intensity = stbdActive > 0.005 ? (0.9 * stbdActive + 5.2 * stbdPeak) : 0.0;
  }

  function syncEmitterWeaponState(sys, elapsed) {
    const active = Boolean(sys.visible) && sys.opacity > 0.005;
    const level = active ? sys.opacity : 0.0;

    if (active) {
      sys.missileAssembly.visible = true;
      layoutEmitterMissileSalvo(sys, elapsed, level);
    } else {
      sys.missileAssembly.visible = false;
      sys.missileAssembly.scale.setScalar(0.0001);
      sys.lastLaunchPulse = 0.0;
      sys.plumeUniforms.uIntensity.value = 0.0;
      sys.plumeCoreMat.opacity = 0.0;
      sys.muzzleFlareMat.opacity = 0.0;
      sys.launchRingMat.opacity = 0.0;
      sys.detCoreMat.opacity = 0.0;
      sys.detRingMat.opacity = 0.0;
      sys.detFlareMat.opacity = 0.0;
      sys.sparkMat.opacity = 0.0;
      sys.emitter.muzzleGlowMat.emissiveIntensity = 1.65;
      applyEmitterAperturePose(sys.emitter, 0.0, 0.0);
    }

    refreshPodDynamicLights();
    rootGroup.userData.missilesFiring = weaponSystems.some((w) => w.visible && w.opacity > 0.005);
  }

  for (let i = 0; i < EMITTER_COUNT; i++) {
    createEmitterDecalSystem(i);
  }

  // ===========================================================================
  // 10. SEAMLESS 6.0s ANIMATION CONTROLLER
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
      if (w.visible && w.opacity > 0.005) activeLoad += w.opacity * 0.25;
    }

    // 1. Relativistic Stealth Gunship Zero-G Hover, Subtle Banking & Firing Recoil Feedback
    const hoverY = Math.sin(cyclePhase) * 0.055;
    const recoilZ = -activeLoad * 0.032 + Math.sin(cyclePhase * 12.0) * activeLoad * 0.006;
    bodyGroup.position.set(0, BASE_CENTER_Y + hoverY, recoilZ);
    bodyGroup.rotation.y = Math.sin(cyclePhase) * 0.020;
    bodyGroup.rotation.z = Math.sin(cyclePhase2) * 0.026;
    bodyGroup.rotation.x = Math.sin(cyclePhase) * 0.014 - activeLoad * 0.008;

    // 2. Pulsing Cyan Main Ion Engine Core, Swirling Magenta Lance Tip Shader & Glows
    engineUniforms.uTime.value = elapsed;
    engineUniforms.uWeaponLoad.value = activeLoad;
    lanceTipUniforms.uTime.value = elapsed;

    cyanGlowMat.emissiveIntensity = 1.55 + 0.35 * Math.sin(cyclePhase * 4.0) + activeLoad * 0.25;
    const rearPulse = 0.86 + 0.16 * Math.sin(cyclePhase * 6.0) + activeLoad * 0.20;
    rearPlumeMat.opacity = 0.34 + 0.14 * Math.sin(cyclePhase * 5.0) + activeLoad * 0.16;
    rearPlumeMesh.scale.set(1.0, 1.0, rearPulse);

    // 3. Ambient Cyan Engine & Wingtip Thruster Micro-Particles (contained within 6.00m envelope)
    for (let i = 0; i < ambientCount; i++) {
      const s = ambientSeeds[i];
      const f = (s.u + normT * s.speed) % 1.0;
      const a = s.ang + cyclePhase * 2.0;
      const idx = i * 3;
      if (s.lane === 0) {
        const r = s.rad * (0.50 + 0.55 * f);
        ambientPosArr[idx] = Math.cos(a) * r;
        ambientPosArr[idx + 1] = 0.16 + Math.sin(a) * r;
        ambientPosArr[idx + 2] = -2.18 - f * 0.72;
      } else {
        const wingSide = s.lane === 1 ? -1 : 1;
        const r = s.rad * 0.38;
        ambientPosArr[idx] = wingSide * 2.08 + Math.cos(a) * r;
        ambientPosArr[idx + 1] = -0.02 + Math.sin(a) * r;
        ambientPosArr[idx + 2] = -1.96 - f * 0.65;
      }
    }
    ambientPosAttr.needsUpdate = true;

    // 4. Update All 4 Decal-Controlled 28.0m Tachyon Lance Missile Emitters
    for (let i = 0; i < weaponSystems.length; i++) {
      syncEmitterWeaponState(weaponSystems[i], elapsed);
    }

    rootGroup.userData.cycleProgress = normT;
  }

  function reset() {
    bodyGroup.position.set(0, BASE_CENTER_Y, 0);
    bodyGroup.rotation.set(0, 0, 0);
    for (let i = 0; i < weaponSystems.length; i++) {
      syncEmitterWeaponState(weaponSystems[i], 0);
    }
    update(0, 0);
  }

  function resolveEmitterIndex(indexOrId) {
    if (typeof indexOrId === 'number' && indexOrId >= 0 && indexOrId < weaponSystems.length) {
      return indexOrId;
    }
    const key = String(indexOrId || '').toLowerCase();
    const map = {
      port_upper: 0,
      portupper: 0,
      decal_missilestrike_port_upper_tachyonlance: 0,
      port_lower: 1,
      portlower: 1,
      decal_missilestrike_port_lower_tachyonlance: 1,
      starboard_upper: 2,
      starboardupper: 2,
      decal_missilestrike_starboard_upper_tachyonlance: 2,
      starboard_lower: 3,
      starboardlower: 3,
      decal_missilestrike_starboard_lower_tachyonlance: 3
    };
    return key in map ? map[key] : -1;
  }

  function setEmitterEnabled(indexOrId, enabled) {
    const idx = resolveEmitterIndex(indexOrId);
    if (idx >= 0) {
      weaponSystems[idx].decalMesh.visible = Boolean(enabled);
    }
  }

  function setPortWeaponsEnabled(enabled) {
    const val = Boolean(enabled);
    weaponSystems[0].decalMesh.visible = val;
    weaponSystems[1].decalMesh.visible = val;
  }

  function setStarboardWeaponsEnabled(enabled) {
    const val = Boolean(enabled);
    weaponSystems[2].decalMesh.visible = val;
    weaponSystems[3].decalMesh.visible = val;
  }

  function setWeaponsEnabled(enabled) {
    const val = Boolean(enabled);
    for (let i = 0; i < weaponSystems.length; i++) {
      weaponSystems[i].decalMesh.visible = val;
    }
  }

  function setDecalOpacity(opacity) {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(opacity) ? opacity : 1.0));
    for (let i = 0; i < weaponSystems.length; i++) {
      weaponSystems[i].decalControlMat.opacity = clamped;
    }
  }

  function getDecalState() {
    return weaponSystems.map((w) => ({
      index: w.emitterIndex,
      id: w.emitter.id,
      decalName: w.decalName,
      visible: w.visible,
      opacity: w.opacity
    }));
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

  // Expose structured decal & controller handles matching meshy_test_0 & wormhole0 conventions
  rootGroup.userData.decals = {
    missileStrikes: weaponSystems.map((w) => w.decalMesh),
    portUpper: weaponSystems[0].decalMesh,
    portLower: weaponSystems[1].decalMesh,
    starboardUpper: weaponSystems[2].decalMesh,
    starboardLower: weaponSystems[3].decalMesh
  };

  rootGroup.userData.weaponDecalNames = [...weaponDecalNames];
  rootGroup.userData.weaponDecalMeshes = weaponSystems.map((w) => w.decalMesh);
  rootGroup.userData.svgAssets = {
    geometryPaths: { ...SVG_GEOMETRY_PATHS },
    textures: svgRegistry
  };

  rootGroup.userData.relativisticShip = {
    metadata,
    weaponDecalNames: [...weaponDecalNames],
    weaponDecalMeshes: weaponSystems.map((w) => w.decalMesh),
    update,
    reset,
    dispose,
    setWeaponsEnabled,
    setEmitterEnabled,
    setPortWeaponsEnabled,
    setStarboardWeaponsEnabled,
    setDecalOpacity,
    getDecalState,
    emitterTips: {
      portUpper: new T.Vector3(emitters[0].tipPos.x, BASE_CENTER_Y + emitters[0].tipPos.y, emitters[0].tipPos.z),
      portLower: new T.Vector3(emitters[1].tipPos.x, BASE_CENTER_Y + emitters[1].tipPos.y, emitters[1].tipPos.z),
      starboardUpper: new T.Vector3(emitters[2].tipPos.x, BASE_CENTER_Y + emitters[2].tipPos.y, emitters[2].tipPos.z),
      starboardLower: new T.Vector3(emitters[3].tipPos.x, BASE_CENTER_Y + emitters[3].tipPos.y, emitters[3].tipPos.z)
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
    dispose,
    setWeaponsEnabled,
    setEmitterEnabled,
    setPortWeaponsEnabled,
    setStarboardWeaponsEnabled,
    setDecalOpacity,
    getDecalState
  };
}

export default function createProcedural(api = {}) {
  return createRelativisticEnemyShip(api);
}
