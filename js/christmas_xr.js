/**
 * Calm Chess Computers & Games — Procedural WebXR Intricate Christmas Wonderland
 * Renders a high-DPI procedural 3D Christmas scene framed specifically in the
 * blank/empty viewport spaces on desktop and mobile, with native WebXR
 * (immersive-vr & immersive-ar) support and interactive 360-degree exploration.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function initChristmasXR() {
  'use strict';

  const canvas = document.getElementById('xrChristmasCanvas');
  const layer = document.getElementById('xrChristmasLayer');
  const dock = document.getElementById('xrChristmasDock');
  const btnDockToggle = document.getElementById('xrDockToggleBtn');
  const btnExplore = document.getElementById('xrExploreBtn');
  const btnExitExplore = document.getElementById('xrExitExploreBtn');
  const btnVr = document.getElementById('xrEnterVrBtn');
  const btnAr = document.getElementById('xrEnterArBtn');
  const btnPause = document.getElementById('xrPauseBtn');
  const btnAudio = document.getElementById('xrAudioBtn');
  const statusPill = document.getElementById('xrStatusBadge');

  if (!canvas || !layer) return;

  // Quick WebGL capability check
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false
    });
  } catch (err) {
    console.warn('[ChristmasXR] WebGL unavailable; keeping standard page styling.', err);
    if (dock) dock.hidden = true;
    return;
  }

  const isMobileViewport = () => window.innerWidth < 820;
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  // Activate translucent blank-space styling only after WebGL context is confirmed live
  document.body.classList.add('xr-scene-active');
  if (dock) dock.hidden = false;

  // ---------------------------------------------------------------------------
  // Scene, Camera, Lighting & Controls
  // ---------------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071022, 0.0155);

  const camera = new THREE.PerspectiveCamera(44, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 180);
  camera.position.set(0, 3.0, 15.2);

  // Camera rig for WebXR positioning
  const cameraRig = new THREE.Group();
  cameraRig.name = 'XRCameraRig';
  cameraRig.add(camera);
  scene.add(cameraRig);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 26;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.target.set(0, 1.4, -1.2);
  controls.enabled = false;

  // Ambient + Twilight Moonlight + Warm Festive Lighting
  const hemiLight = new THREE.HemisphereLight(0x6da8e8, 0x0c172e, 0.58);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight(0xa8d0ff, 0.82);
  moonLight.position.set(14, 22, 12);
  scene.add(moonLight);

  const rimLight = new THREE.DirectionalLight(0x34d399, 0.34);
  rimLight.position.set(-16, 12, -14);
  scene.add(rimLight);

  // ---------------------------------------------------------------------------
  // Procedural Texture Generators (100% self-contained, crisp canvas textures)
  // ---------------------------------------------------------------------------
  function createGlowTexture(innerColor, midColor, outerColor = 'rgba(0,0,0,0)') {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.0, innerColor);
    g.addColorStop(0.28, midColor);
    g.addColorStop(0.68, outerColor);
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createSnowflakeTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.translate(64, 64);

    // Subtle frosty core halo
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 58);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(215,240,255,0.45)');
    g.addColorStop(1, 'rgba(180,225,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.fill();

    // 6-pointed intricate crystalline dendrite arms
    ctx.strokeStyle = 'rgba(255,255,255,0.96)';
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -52);
      ctx.stroke();

      // Secondary crystalline barbs
      const barbs = [
        { y: -18, len: 14, w: 2.4 },
        { y: -32, len: 16, w: 2.2 },
        { y: -43, len: 9, w: 1.8 }
      ];
      barbs.forEach((b) => {
        ctx.lineWidth = b.w;
        ctx.beginPath();
        ctx.moveTo(0, b.y);
        ctx.lineTo(-b.len * 0.78, b.y - b.len * 0.62);
        ctx.moveTo(0, b.y);
        ctx.lineTo(b.len * 0.78, b.y - b.len * 0.62);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Center hexagonal crystal ring
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * 11;
      const py = Math.sin(a) * 11;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createCandyCaneTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 22;
    for (let i = -128; i < 256; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
    // Thin festive green accent pinstripe
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    for (let i = -128; i < 256; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i + 16, 0);
      ctx.lineTo(i + 144, 128);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 5);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createWoodTimberTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5c341d';
    ctx.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) {
      const y = row * 32;
      const shade = 74 + ((row * 17) % 24);
      ctx.fillStyle = `rgb(${shade + 22}, ${Math.floor(shade * 0.62)}, ${Math.floor(shade * 0.34)})`;
      ctx.fillRect(0, y + 1, 256, 29);
      ctx.fillStyle = 'rgba(25, 10, 4, 0.55)';
      ctx.fillRect(0, y, 256, 2);
      // Subtle grain streaks
      ctx.strokeStyle = 'rgba(40, 18, 8, 0.25)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 5 + g * 4);
        ctx.bezierCurveTo(85, y + 3 + g * 4, 170, y + 7 + g * 4, 256, y + 5 + g * 4);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createGiftWrapTexture(styleIndex) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (styleIndex === 0) {
      // Royal Tartan Plaid
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = 'rgba(20, 83, 45, 0.72)';
      ctx.fillRect(0, 20, 128, 22);
      ctx.fillRect(0, 84, 128, 22);
      ctx.fillRect(20, 0, 22, 128);
      ctx.fillRect(84, 0, 22, 128);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      [31, 95].forEach((p) => {
        ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(128, p); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 128); ctx.stroke();
      });
    } else if (styleIndex === 1) {
      // Midnight Navy + Gold Stars
      ctx.fillStyle = '#172554';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#fbbf24';
      for (let y = 16; y < 128; y += 32) {
        for (let x = 16; x < 128; x += 32) {
          const ox = ((y / 32) % 2) * 14;
          ctx.beginPath();
          ctx.arc((x + ox) % 128, y, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (styleIndex === 2) {
      // Emerald + Frost Snowflakes
      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = 'rgba(240, 253, 250, 0.8)';
      ctx.lineWidth = 2;
      for (let y = 24; y < 128; y += 48) {
        for (let x = 24; x < 128; x += 48) {
          for (let a = 0; a < 3; a++) {
            const ang = (a * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(x - Math.cos(ang) * 11, y - Math.sin(ang) * 11);
            ctx.lineTo(x + Math.cos(ang) * 11, y + Math.sin(ang) * 11);
            ctx.stroke();
          }
        }
      }
    } else {
      // Festive Gold & Crimson Diagonal Stripes
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 10;
      for (let i = -128; i < 256; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 128, 128);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createSnowSparkleBump() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3200; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const v = Math.random() > 0.85 ? 255 : 105 + Math.floor(Math.random() * 55);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }

  const glowWarmTex = createGlowTexture('rgba(255,250,220,1)', 'rgba(255,200,80,0.65)', 'rgba(255,140,20,0.12)');
  const glowIceTex = createGlowTexture('rgba(240,250,255,1)', 'rgba(130,210,255,0.55)', 'rgba(56,189,248,0.08)');
  const glowRedTex = createGlowTexture('rgba(255,230,230,1)', 'rgba(255,55,55,0.75)', 'rgba(220,38,38,0.12)');
  const smokeTex = createGlowTexture('rgba(235,244,255,0.55)', 'rgba(200,220,245,0.22)', 'rgba(180,200,230,0)');
  const snowflakeTex = createSnowflakeTexture();
  const candyTex = createCandyCaneTexture();
  const woodTex = createWoodTimberTexture();
  const giftWrapTextures = [0, 1, 2, 3].map(createGiftWrapTexture);
  const snowBumpTex = createSnowSparkleBump();

  // ---------------------------------------------------------------------------
  // Sky Dome, Starfield, Crescent Winter Moon & Procedural GLSL Aurora Borealis
  // ---------------------------------------------------------------------------
  const environmentSkyGroup = new THREE.Group();
  environmentSkyGroup.name = 'SkyAndAurora';
  scene.add(environmentSkyGroup);

  // Midnight Winter Gradient Sky Dome
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(0x030712) },
      uMidColor: { value: new THREE.Color(0x0b1630) },
      uHorizonColor: { value: new THREE.Color(0x132c4a) }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y, -0.2, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(-0.08, 0.28, h));
        col = mix(col, uTopColor, smoothstep(0.24, 0.85, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(95, 32, 24), skyMat);
  environmentSkyGroup.add(skyDome);

  // Custom GLSL Procedural Twinkling Starfield
  const starCount = isMobileViewport() ? 650 : 1250;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starPhases = new Float32Array(starCount);
  const starPalette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xdbeafe),
    new THREE.Color(0xfef3c7),
    new THREE.Color(0xbae6fd),
    new THREE.Color(0xfde68a)
  ];
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.05 + Math.random() * 0.94);
    const r = 68 + Math.random() * 18;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi) - 2.0;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const col = starPalette[i % starPalette.length];
    starColors[i * 3] = col.r;
    starColors[i * 3 + 1] = col.g;
    starColors[i * 3 + 2] = col.b;
    starSizes[i] = 1.6 + Math.random() * 3.4;
    starPhases[i] = Math.random() * Math.PI * 2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

  const starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.4 + mod(aPhase, 2.2)) + aPhase * 6.0);
        vAlpha = twinkle;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (0.75 + 0.45 * twinkle) * (220.0 / max(-mvPos.z, 10.0));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        float glint = pow(core, 2.4);
        gl_FragColor = vec4(vColor, glint * vAlpha);
      }
    `
  });
  const starField = new THREE.Points(starGeo, starMat);
  environmentSkyGroup.add(starField);

  // Procedural Aurora Borealis Curtains (Custom GLSL Shader)
  const auroraUniforms = {
    uTime: { value: 0 }
  };
  const auroraMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: auroraUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float w1 = sin(uv.x * 11.0 + uTime * 0.42) * 1.45;
        float w2 = cos(uv.x * 19.0 - uTime * 0.28) * 0.65;
        pos.z += (w1 + w2) * (0.4 + 0.6 * uv.y);
        pos.y += sin(uv.x * 7.0 + uTime * 0.35) * 0.55;
        vWave = w1 * 0.5 + 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        float edgeFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
        float verticalFade = smoothstep(0.0, 0.22, vUv.y) * pow(1.0 - vUv.y, 1.45);
        float rays = 0.55 + 0.45 * sin(vUv.x * 46.0 + uTime * 0.7 + sin(vUv.x * 13.0 - uTime * 0.35) * 2.5);
        float fineRays = 0.6 + 0.4 * cos(vUv.x * 92.0 - uTime * 1.15);
        float curtain = edgeFade * verticalFade * rays * fineRays;

        vec3 emerald = vec3(0.08, 0.94, 0.62);
        vec3 arcticCyan = vec3(0.22, 0.76, 0.98);
        vec3 festiveViolet = vec3(0.58, 0.32, 0.95);
        vec3 goldHighlight = vec3(1.0, 0.84, 0.35);

        vec3 col = mix(emerald, arcticCyan, smoothstep(0.15, 0.58, vUv.y));
        col = mix(col, festiveViolet, smoothstep(0.52, 0.95, vUv.y) * 0.72);
        col = mix(col, goldHighlight, smoothstep(0.7, 1.0, vWave) * (1.0 - vUv.y) * 0.32);

        gl_FragColor = vec4(col, curtain * 0.62);
      }
    `
  });

  function createAuroraRibbon(radius, yBase, height, arcStart, arcLength, zOffset) {
    const segs = 96;
    const geo = new THREE.PlaneGeometry(arcLength, height, segs, 6);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const t = (px / arcLength) + 0.5;
      const angle = arcStart + t * (Math.PI * 1.15);
      pos.setXYZ(
        i,
        Math.cos(angle) * radius,
        yBase + py + Math.sin(t * Math.PI) * 1.4,
        Math.sin(angle) * radius + zOffset
      );
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, auroraMat);
  }

  environmentSkyGroup.add(createAuroraRibbon(44, 10.2, 8.8, Math.PI * 0.94, 64, 6));
  environmentSkyGroup.add(createAuroraRibbon(36, 7.6, 6.8, Math.PI * 1.05, 52, 10));

  // Glowing Winter Full Moon with Halo
  const moonGroup = new THREE.Group();
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 28, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef9e7 })
  );
  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowIceTex,
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  moonHalo.scale.set(10.5, 10.5, 1);
  moonGroup.add(moonMesh, moonHalo);
  moonGroup.position.set(11.5, 7.6, -28);
  environmentSkyGroup.add(moonGroup);

  // ---------------------------------------------------------------------------
  // Snowy Rolling Alpine Terrain & Distant Pine Forest Silhouette
  // ---------------------------------------------------------------------------
  const groundGroup = new THREE.Group();
  groundGroup.name = 'SnowyTerrain';
  scene.add(groundGroup);

  const terrainGeo = new THREE.PlaneGeometry(86, 68, 72, 56);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const z = tPos.getZ(i);
    const distFromCenter = Math.hypot(x * 0.55, z * 0.85);
    let h = Math.sin(x * 0.16) * Math.cos(z * 0.14) * 0.28;
    h += Math.sin(x * 0.38 + z * 0.24) * 0.10;
    // Gentle rolling snowy foothills in back while keeping starry midnight sky spacious
    if (z < -9) {
      h += Math.pow(Math.min((-z - 9) * 0.055, 1.5), 1.45) * 0.55;
    }
    const flatBlend = THREE.MathUtils.smoothstep(distFromCenter, 3.2, 8.5);
    tPos.setY(i, h * (0.2 + 0.8 * flatBlend));
  }
  terrainGeo.computeVertexNormals();

  const snowGroundMat = new THREE.MeshStandardMaterial({
    color: 0x8fb5e0,
    roughness: 0.68,
    metalness: 0.08,
    bumpMap: snowBumpTex,
    bumpScale: 0.055
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, snowGroundMat);
  terrainMesh.position.y = -2.65;
  groundGroup.add(terrainMesh);

  // Atmospheric twilight-misted distant pine forest flanking the horizon wings
  function buildDistantPine(scale = 1) {
    const g = new THREE.Group();
    const matDark = new THREE.MeshStandardMaterial({ color: 0x0b2620, roughness: 0.94, flatShading: true });
    const matFrostTip = new THREE.MeshStandardMaterial({ color: 0x6285aa, roughness: 0.85, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const r = (1.12 - i * 0.22) * scale;
      const h = (1.35 - i * 0.16) * scale;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), matDark);
      cone.position.y = (0.68 + i * 0.72) * scale;
      cone.rotation.y = i * 0.45;
      g.add(cone);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.68, h * 0.28, 8), matFrostTip);
      cap.position.y = cone.position.y + h * 0.35;
      cap.rotation.y = i * 0.45;
      g.add(cap);
    }
    return g;
  }

  for (let i = 0; i < 20; i++) {
    const angle = -Math.PI * 0.92 + (i / 19) * Math.PI * 0.84;
    // Leave an open scenic sky corridor directly behind the central golden navigation ring
    if (Math.abs(Math.cos(angle)) < 0.26) continue;
    const dist = 18 + (i % 3) * 5.0;
    const pine = buildDistantPine(0.85 + (i % 4) * 0.28);
    pine.position.set(Math.cos(angle) * dist, -2.55 + (i % 3) * 0.15, Math.sin(angle) * dist - 4);
    groundGroup.add(pine);
  }

  // ---------------------------------------------------------------------------
  // Intricate Procedural Christmas Elements Builders
  // ---------------------------------------------------------------------------
  const fairyLights = [];
  const animatedStars = [];
  const fireplaceMaterials = [];
  const chimneyEmitters = [];
  const dynamicPointLights = [];

  // Shared materials
  const matGoldMetallic = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.88,
    roughness: 0.22,
    emissive: 0x3b2600,
    emissiveIntensity: 0.35
  });
  const matCrimsonVelvet = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.65,
    metalness: 0.12
  });
  const matSnowCap = new THREE.MeshStandardMaterial({
    color: 0xf1f7ff,
    roughness: 0.55,
    metalness: 0.08
  });
  const matDarkIron = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35
  });

  // 1. Procedural Multi-Tiered Intricate Christmas Tree
  function createIntricateChristmasTree(options = {}) {
    const {
      height = 5.4,
      baseRadius = 1.85,
      tiers = 8,
      ornamentCount = 46,
      lightCount = 72,
      seed = 1
    } = options;

    const tree = new THREE.Group();

    // Deterministic pseudo-random helper so every tree has handcrafted organic artistry
    let s = seed * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    // Ornate Crimson & Gold Velvet Tree Skirt
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(baseRadius * 0.58, baseRadius * 0.92, 0.14, 28),
      matCrimsonVelvet
    );
    skirt.position.y = 0.07;
    tree.add(skirt);

    const skirtTrim = new THREE.Mesh(
      new THREE.TorusGeometry(baseRadius * 0.91, 0.045, 8, 32),
      matGoldMetallic
    );
    skirtTrim.rotation.x = Math.PI / 2;
    skirtTrim.position.y = 0.05;
    tree.add(skirtTrim);

    // Sculpted Bark Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.24, height * 0.34, 10),
      new THREE.MeshStandardMaterial({ color: 0x452512, roughness: 0.92 })
    );
    trunk.position.y = height * 0.16;
    tree.add(trunk);

    // Sculpted Pine Bough Tiers with Vertex-Colored Evergreen-to-Frost-Snow Tips
    const boughMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.05,
      flatShading: true
    });

    const colorDeep = new THREE.Color(0x093520);
    const colorRich = new THREE.Color(0x136f3e);
    const colorFrost = new THREE.Color(0xe6f3ff);

    for (let t = 0; t < tiers; t++) {
      const frac = t / (tiers - 1);
      const tierY = 0.72 + frac * (height - 1.15);
      const tierRadius = baseRadius * (1.0 - frac * 0.80);
      const tierHeight = (height / tiers) * 1.55;

      // Central sculpted core cone with ruffled silhouette
      const coreGeo = new THREE.ConeGeometry(tierRadius * 0.88, tierHeight, 12, 3);
      const cPos = coreGeo.attributes.position;
      const cols = new Float32Array(cPos.count * 3);
      for (let i = 0; i < cPos.count; i++) {
        const vx = cPos.getX(i);
        const vy = cPos.getY(i);
        const vz = cPos.getZ(i);
        const rad = Math.hypot(vx, vz);
        const angle = Math.atan2(vz, vx);
        const ruffle = 1.0 + Math.sin(angle * 6 + t * 1.3) * 0.14;
        if (rad > 0.02) {
          cPos.setX(i, vx * ruffle);
          cPos.setZ(i, vz * ruffle);
          cPos.setY(i, vy - rad * 0.14);
        }
        const tipFactor = THREE.MathUtils.clamp(rad / Math.max(tierRadius * 0.85, 0.1), 0, 1);
        const topFactor = THREE.MathUtils.clamp((vy + tierHeight * 0.5) / tierHeight, 0, 1);
        const snowAmt = THREE.MathUtils.smoothstep(tipFactor * 0.65 + topFactor * 0.55, 0.66, 0.98);
        const c = colorDeep.clone().lerp(colorRich, tipFactor).lerp(colorFrost, snowAmt * 0.75);
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }
      coreGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      coreGeo.computeVertexNormals();

      const coreMesh = new THREE.Mesh(coreGeo, boughMat);
      coreMesh.position.y = tierY;
      coreMesh.rotation.y = t * 0.52;
      tree.add(coreMesh);

      // Individual Radial Drooping Pine Bough Fronds for lush, intricate silhouette
      const frondCount = Math.max(5, Math.round(11 - frac * 6));
      for (let f = 0; f < frondCount; f++) {
        const ang = (f / frondCount) * Math.PI * 2 + t * 0.4 + (rand() - 0.5) * 0.22;
        const frondLen = tierRadius * (0.62 + rand() * 0.22);
        const frondGeo = new THREE.ConeGeometry(tierRadius * 0.22, frondLen, 5);
        frondGeo.rotateX(Math.PI * 0.5);

        const fPos = frondGeo.attributes.position;
        const fCols = new Float32Array(fPos.count * 3);
        for (let k = 0; k < fPos.count; k++) {
          const zVal = fPos.getZ(k);
          const yVal = fPos.getY(k);
          const outT = THREE.MathUtils.clamp((zVal + frondLen * 0.5) / frondLen, 0, 1);
          const snow = outT > 0.55 && yVal > 0 ? (outT - 0.45) * 1.4 : 0;
          const col = colorDeep.clone().lerp(colorRich, outT).lerp(colorFrost, Math.min(snow, 0.85));
          fCols[k * 3] = col.r;
          fCols[k * 3 + 1] = col.g;
          fCols[k * 3 + 2] = col.b;
        }
        frondGeo.setAttribute('color', new THREE.BufferAttribute(fCols, 3));
        frondGeo.computeVertexNormals();

        const frond = new THREE.Mesh(frondGeo, boughMat);
        frond.position.set(
          Math.cos(ang) * tierRadius * 0.52,
          tierY - tierHeight * 0.22 + (rand() - 0.5) * 0.08,
          Math.sin(ang) * tierRadius * 0.52
        );
        frond.rotation.y = -ang + Math.PI / 2;
        frond.rotation.x = 0.26 + rand() * 0.14;
        tree.add(frond);
      }
    }

    // Spiraling Golden Satin Garland Ribbon (CatmullRomCurve3 helix with festive swag)
    const garlandPts = [];
    const garlandTurns = 5.4;
    const garlandSamples = 95;
    for (let i = 0; i <= garlandSamples; i++) {
      const u = i / garlandSamples;
      const angle = u * Math.PI * 2 * garlandTurns + seed;
      const r = baseRadius * (1.0 - u * 0.86) * 0.94 + 0.08;
      const swag = Math.sin(u * garlandTurns * 6.0 * Math.PI) * 0.075 * (1.0 - u * 0.5);
      const y = 0.65 + u * (height - 1.15) - Math.abs(swag);
      garlandPts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const garlandCurve = new THREE.CatmullRomCurve3(garlandPts);
    const garlandMesh = new THREE.Mesh(
      new THREE.TubeGeometry(garlandCurve, 110, 0.036, 7, false),
      matGoldMetallic
    );
    tree.add(garlandMesh);

    // Reflective Glass Bauble Ornaments with Gold Caps
    const baublePalette = [0xdc2626, 0xfbbf24, 0x10b981, 0x2563eb, 0xf8fafc, 0xe11d48];
    const baubleMats = baublePalette.map(
      (hex) =>
        new THREE.MeshStandardMaterial({
          color: hex,
          metalness: 0.78,
          roughness: 0.16,
          emissive: hex,
          emissiveIntensity: 0.16
        })
    );
    const baubleGeo = new THREE.SphereGeometry(0.115, 14, 12);
    const capGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.045, 8);

    for (let i = 0; i < ornamentCount; i++) {
      const u = 0.05 + (i / ornamentCount) * 0.87;
      const ang = i * 2.39996 + seed * 1.7; // Golden angle distribution
      const r = baseRadius * (1.0 - u * 0.83) * (0.86 + rand() * 0.16);
      const y = 0.62 + u * (height - 1.15) + (rand() - 0.5) * 0.15;

      const bauble = new THREE.Mesh(baubleGeo, baubleMats[i % baubleMats.length]);
      const sc = 0.78 + rand() * 0.45;
      bauble.scale.setScalar(sc);
      bauble.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r);
      tree.add(bauble);

      const cap = new THREE.Mesh(capGeo, matGoldMetallic);
      cap.position.set(bauble.position.x, bauble.position.y + 0.11 * sc, bauble.position.z);
      tree.add(cap);
    }

    // Animated Procedural Twinkling Fairy Lights + Additive Glow Sprites
    const lightColors = [0xffdf7a, 0xff4d6d, 0x34d399, 0x60a5fa, 0xfff7ed, 0xfbbf24];
    const bulbGeo = new THREE.SphereGeometry(0.046, 8, 8);
    for (let i = 0; i < lightCount; i++) {
      const u = 0.04 + (i / lightCount) * 0.90;
      const ang = u * Math.PI * 2 * 6.8 + seed * 2.4 + (i % 2) * 0.35;
      const r = baseRadius * (1.0 - u * 0.84) * 0.96 + 0.06;
      const y = 0.58 + u * (height - 1.05);
      const colHex = lightColors[i % lightColors.length];
      const baseColor = new THREE.Color(colHex);

      const bulbMat = new THREE.MeshBasicMaterial({ color: baseColor.clone() });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r);
      tree.add(bulb);

      const spriteMat = new THREE.SpriteMaterial({
        map: glowWarmTex,
        color: baseColor.clone(),
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const halo = new THREE.Sprite(spriteMat);
      halo.position.copy(bulb.position);
      halo.scale.set(0.42, 0.42, 1);
      tree.add(halo);

      fairyLights.push({
        bulbMat,
        spriteMat,
        halo,
        baseColor,
        phase: u * 10.0 + i * 0.43,
        speed: 2.0 + (i % 5) * 0.45
      });
    }

    // Intricate Rotating 3D Golden 8-Point Bethlehem Star Topper
    const starShape = new THREE.Shape();
    const pts = 8;
    for (let i = 0; i < pts * 2; i++) {
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? (i % 4 === 0 ? 0.44 : 0.30) : 0.12;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    starShape.closePath();

    const starGeo3D = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2
    });
    starGeo3D.center();
    const starMesh = new THREE.Mesh(
      starGeo3D,
      new THREE.MeshStandardMaterial({
        color: 0xffe066,
        emissive: 0xffae00,
        emissiveIntensity: 0.95,
        metalness: 0.85,
        roughness: 0.15
      })
    );
    starMesh.position.y = height + 0.15;
    tree.add(starMesh);

    const starHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowWarmTex,
        color: 0xffe066,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    starHalo.position.copy(starMesh.position);
    starHalo.scale.set(1.9, 1.9, 1);
    tree.add(starHalo);

    animatedStars.push({ mesh: starMesh, halo: starHalo, phase: seed * 1.3 });

    // Warm Tree Point Light
    const treeGlow = new THREE.PointLight(0xffbe55, 2.6, 10, 1.6);
    treeGlow.position.set(0, height * 0.55, 0.9);
    tree.add(treeGlow);
    dynamicPointLights.push({ light: treeGlow, base: 2.6, phase: seed * 1.1 });

    return tree;
  }

  // 2. Procedural Wrapped Gift Box with Crossed Satin Ribbons & 3D Bow Loops
  function createGiftBox(w, h, d, wrapIdx, ribbonHex) {
    const gift = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({
      map: giftWrapTextures[wrapIdx % giftWrapTextures.length],
      roughness: 0.42,
      metalness: 0.12
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMat);
    box.position.y = h * 0.5;
    gift.add(box);

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: ribbonHex,
      metalness: 0.62,
      roughness: 0.28,
      emissive: ribbonHex,
      emissiveIntensity: 0.1
    });
    const bandW = Math.min(w, d) * 0.18;
    const band1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.025, h + 0.025, bandW), ribbonMat);
    band1.position.y = h * 0.5;
    const band2 = new THREE.Mesh(new THREE.BoxGeometry(bandW, h + 0.025, d + 0.025), ribbonMat);
    band2.position.y = h * 0.5;
    gift.add(band1, band2);

    // 4-Loop Satin Bow on Top
    const bowGroup = new THREE.Group();
    bowGroup.position.y = h + 0.05;
    const loopGeo = new THREE.TorusGeometry(bandW * 0.85, bandW * 0.24, 7, 14);
    for (let i = 0; i < 4; i++) {
      const loop = new THREE.Mesh(loopGeo, ribbonMat);
      loop.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
      loop.rotation.x = 0.55;
      loop.position.set(Math.cos(loop.rotation.y) * bandW * 0.55, 0.03, Math.sin(loop.rotation.y) * bandW * 0.55);
      bowGroup.add(loop);
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(bandW * 0.42, 8, 8), ribbonMat);
    bowGroup.add(knot);
    gift.add(bowGroup);

    return gift;
  }

  function addGiftCluster(parent, radiusOffset = 1.05, count = 8, seed = 1) {
    const ribbonColors = [0xffd700, 0xef4444, 0xf8fafc, 0x10b981, 0x38bdf8];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + seed * 0.7;
      const dist = radiusOffset + (i % 3) * 0.28;
      const w = 0.34 + ((i * 7) % 5) * 0.06;
      const h = 0.26 + ((i * 5) % 4) * 0.075;
      const d = 0.32 + ((i * 3) % 5) * 0.055;
      const gift = createGiftBox(w, h, d, i + seed, ribbonColors[i % ribbonColors.length]);
      gift.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
      gift.rotation.y = ang + 0.5;
      parent.add(gift);
    }
  }

  // 3. Cozy Snow-Dusted Alpine Timber Cottage with Fireplace Glow, Icicles, Wreath & Chimney Smoke
  function createAlpineCottage() {
    const cottage = new THREE.Group();

    // Stone Foundation
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(2.65, 0.38, 2.25),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92 })
    );
    foundation.position.y = 0.19;
    cottage.add(foundation);

    // Timber Cabin Body
    const wallMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.82,
      metalness: 0.04
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.55, 2.05), wallMat);
    body.position.y = 1.12;
    cottage.add(body);

    // Gable Front & Back Triangles
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-1.23, 0);
    gableShape.lineTo(1.23, 0);
    gableShape.lineTo(0, 1.12);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 2.05, bevelEnabled: false });
    gableGeo.translate(0, 1.89, -1.025);
    const gable = new THREE.Mesh(gableGeo, wallMat);
    cottage.add(gable);

    // Steep Pitched Roof + Sculpted Thick Snow Blanket
    const roofDarkMat = new THREE.MeshStandardMaterial({ color: 0x3b1f14, roughness: 0.85 });
    const roofLen = 1.88;
    const roofAngle = Math.atan2(1.12, 1.23);

    [-1, 1].forEach((side) => {
      const slope = new THREE.Mesh(new THREE.BoxGeometry(roofLen, 0.12, 2.48), roofDarkMat);
      slope.position.set(side * 0.72, 2.43, 0);
      slope.rotation.z = -side * roofAngle;
      cottage.add(slope);

      const snowBlanket = new THREE.Mesh(new THREE.BoxGeometry(roofLen + 0.08, 0.16, 2.54), matSnowCap);
      snowBlanket.position.set(side * 0.72, 2.54, 0);
      snowBlanket.rotation.z = -side * roofAngle;
      cottage.add(snowBlanket);

      // Crystalline Icicles Hanging Along the Eaves
      const icicleMat = new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.18,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88
      });
      for (let ic = -1.1; ic <= 1.1; ic += 0.24) {
        const len = 0.14 + Math.abs(Math.sin(ic * 9.3 + side)) * 0.16;
        const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.025, len, 5), icicleMat);
        icicle.rotation.x = Math.PI;
        icicle.position.set(side * 1.48, 1.82 - len * 0.5, ic);
        cottage.add(icicle);
      }
    });

    // Warm Flickering Mullioned Windows (Front & Side)
    const hearthMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9f1c,
      emissiveIntensity: 1.55,
      roughness: 0.2
    });
    fireplaceMaterials.push(hearthMat);

    function createWindow(w, h) {
      const win = new THREE.Group();
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), hearthMat);
      win.add(pane);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.8 });
      const barH = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.05, 0.06), frameMat);
      const barV = new THREE.Mesh(new THREE.BoxGeometry(0.05, h + 0.08, 0.06), frameMat);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.08, 0.14), matSnowCap);
      sill.position.set(0, -h * 0.5 - 0.03, 0.05);
      win.add(barH, barV, sill);
      return win;
    }

    const winFrontL = createWindow(0.56, 0.54);
    winFrontL.position.set(-0.68, 1.25, 1.04);
    const winFrontR = createWindow(0.56, 0.54);
    winFrontR.position.set(0.68, 1.25, 1.04);
    const winAttic = createWindow(0.42, 0.42);
    winAttic.position.set(0, 2.35, 1.04);
    const winSide = createWindow(0.66, 0.54);
    winSide.rotation.y = Math.PI / 2;
    winSide.position.set(1.24, 1.25, 0);
    cottage.add(winFrontL, winFrontR, winAttic, winSide);

    // Front Door + Festive Evergreen Wreath with Red Bow
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.98, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x3f1d0e, roughness: 0.78 })
    );
    door.position.set(0, 0.87, 1.03);
    cottage.add(door);

    const wreath = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.045, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 })
    );
    wreath.position.set(0, 1.02, 1.09);
    const wreathBow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), matCrimsonVelvet);
    wreathBow.position.set(0, 0.88, 1.11);
    cottage.add(wreath, wreathBow);

    // Cobblestone Chimney + Procedural Rising Smoke Emitter
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 1.25, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.92 })
    );
    chimney.position.set(0.65, 2.72, -0.35);
    cottage.add(chimney);

    const chimneySnow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.48), matSnowCap);
    chimneySnow.position.set(0.65, 3.36, -0.35);
    cottage.add(chimneySnow);

    const smokePuffs = [];
    for (let i = 0; i < 9; i++) {
      const puffMat = new THREE.SpriteMaterial({
        map: smokeTex,
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      });
      const puff = new THREE.Sprite(puffMat);
      cottage.add(puff);
      smokePuffs.push({
        sprite: puff,
        mat: puffMat,
        life: i / 9,
        driftSeed: i * 1.7
      });
    }
    chimneyEmitters.push({ origin: new THREE.Vector3(0.65, 3.45, -0.35), puffs: smokePuffs });

    // Warm Cottage Hearth Glow Light
    const hearthLight = new THREE.PointLight(0xff9e3d, 2.2, 8.5, 1.6);
    hearthLight.position.set(0, 1.35, 1.75);
    cottage.add(hearthLight);
    dynamicPointLights.push({ light: hearthLight, base: 2.2, phase: 2.9, flicker: true });

    return cottage;
  }

  // 4. Procedural Victorian Wrought-Iron Lamppost
  function createVictorianLamppost() {
    const lamp = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.45, 8), matDarkIron);
    base.position.y = 0.22;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 2.35, 8), matDarkIron);
    pole.position.y = 1.48;
    const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 6), matDarkIron);
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.y = 2.42;

    // Lantern Housing
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.11, 0.34, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe49c })
    );
    lanternGlass.position.y = 2.82;
    const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.22, 6), matDarkIron);
    lanternCap.position.y = 3.09;
    const snowDot = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.11, 6), matSnowCap);
    snowDot.position.y = 3.16;

    // Festive Red Ribbon & Wreath Collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.04, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 2.36;
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), matCrimsonVelvet);
    bow.position.set(0, 2.32, 0.1);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowWarmTex,
        color: 0xffcf70,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    halo.position.y = 2.84;
    halo.scale.set(1.6, 1.6, 1);

    lamp.add(base, pole, crossBar, lanternGlass, lanternCap, snowDot, collar, bow, halo);
    return lamp;
  }

  // 5. Procedural Peppermint Candy Cane
  function createCandyCane(scale = 1) {
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.15, 0),
      new THREE.Vector3(0.05, 1.48, 0),
      new THREE.Vector3(0.24, 1.62, 0),
      new THREE.Vector3(0.44, 1.48, 0),
      new THREE.Vector3(0.46, 1.24, 0)
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.075, 10, false),
      new THREE.MeshStandardMaterial({
        map: candyTex,
        roughness: 0.25,
        metalness: 0.1
      })
    );
    mesh.scale.setScalar(scale);
    return mesh;
  }

  // 6. Animated Chess-Crowned Festive Snowman + Sculpted Frosted Chess Pieces
  let snowmanRig = null;
  function createChessSnowman() {
    const rig = new THREE.Group();
    const snowBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf4f9ff,
      roughness: 0.48,
      metalness: 0.06
    });
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.56, 18, 16), snowBodyMat);
    b1.position.y = 0.48;
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.41, 18, 16), snowBodyMat);
    b2.position.y = 1.22;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 18, 16), snowBodyMat);
    head.position.y = 1.80;

    // Upper sway pivot
    const upper = new THREE.Group();
    upper.position.y = 0.85;
    b2.position.y -= 0.85;
    head.position.y -= 0.85;
    upper.add(b2, head);

    // Coal buttons & eyes
    [0.24, 0.42, 0.56].forEach((y) => {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), coalMat);
      btn.position.set(0, y, 0.39);
      upper.add(btn);
    });
    [-0.1, 0.1].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), coalMat);
      eye.position.set(x, 1.0, 0.25);
      upper.add(eye);
    });

    // Carrot Nose
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.26, 8),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 })
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.93, 0.36);
    upper.add(nose);

    // Festive Crimson Scarf with Fluttering Tail
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.065, 8, 18), matCrimsonVelvet);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.y = 0.72;
    upper.add(scarfCollar);

    const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.045), matCrimsonVelvet);
    scarfTail.position.set(0.18, 0.50, 0.22);
    scarfTail.rotation.z = 0.22;
    upper.add(scarfTail);

    // Velvet Top Hat crowned with a Golden Calm Chess King Diadem!
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 1.18, 0);
    hatGroup.rotation.z = -0.07;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.045, 18), coalMat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.34, 18), coalMat);
    crown.position.y = 0.18;
    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.06, 18), matGoldMetallic);
    hatBand.position.y = 0.06;
    // Mini golden chess cross on top of the hat!
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.045), matGoldMetallic);
    crossV.position.y = 0.44;
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.045), matGoldMetallic);
    crossH.position.y = 0.46;
    hatGroup.add(brim, crown, hatBand, crossV, crossH);
    upper.add(hatGroup);

    // Articulated Twig Arms
    const twigMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.36, 0.46, 0);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.036, 0.62, 6), twigMat);
    armL.rotation.z = 1.1;
    armL.position.set(-0.26, 0.1, 0);
    leftArm.add(armL);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.36, 0.46, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.036, 0.62, 6), twigMat);
    armR.rotation.z = -1.1;
    armR.position.set(0.26, 0.14, 0);
    rightArm.add(armR);

    upper.add(leftArm, rightArm);
    rig.add(b1, upper);

    // Sculpted Glowing Frosted Chess Rook beside the Snowman (Calm Chess signature!)
    const rookPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.20, 0.08),
      new THREE.Vector2(0.14, 0.15),
      new THREE.Vector2(0.11, 0.48),
      new THREE.Vector2(0.16, 0.56),
      new THREE.Vector2(0.16, 0.68),
      new THREE.Vector2(0.0, 0.68)
    ];
    const rook = new THREE.Mesh(
      new THREE.LatheGeometry(rookPts, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0x452d00,
        emissiveIntensity: 0.35
      })
    );
    rook.position.set(-0.72, 0, 0.25);
    rig.add(rook);

    snowmanRig = { rig, upper, leftArm, rightArm, scarfTail };
    return rig;
  }

  // 7. Animated Procedural Miniature Holiday Steam Train & Circular Track
  let trainSystem = null;
  function createHolidayTrain(trackRadius = 1.95) {
    const system = new THREE.Group();

    // Steel Twin Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const outerRail = new THREE.Mesh(new THREE.TorusGeometry(trackRadius + 0.12, 0.022, 6, 64), railMat);
    outerRail.rotation.x = Math.PI / 2;
    outerRail.position.y = 0.05;
    const innerRail = new THREE.Mesh(new THREE.TorusGeometry(trackRadius - 0.12, 0.022, 6, 64), railMat);
    innerRail.rotation.x = Math.PI / 2;
    innerRail.position.y = 0.05;
    system.add(outerRail, innerRail);

    // Wooden Railroad Ties
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x452512, roughness: 0.9 });
    const tieGeo = new THREE.BoxGeometry(0.36, 0.035, 0.08);
    const tieCount = 42;
    for (let i = 0; i < tieCount; i++) {
      const a = (i / tieCount) * Math.PI * 2;
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(Math.cos(a) * trackRadius, 0.02, Math.sin(a) * trackRadius);
      tie.rotation.y = -a;
      system.add(tie);
    }

    // Build Locomotive
    const loco = new THREE.Group();
    const locoRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.45, roughness: 0.32 });
    const locoBlack = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.65, roughness: 0.35 });
    const glowWin = new THREE.MeshBasicMaterial({ color: 0xffe484 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.92), locoBlack);
    chassis.position.y = 0.16;
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.56, 14), locoRed);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 0.34, 0.14);
    const boilerBand = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.04, 14), matGoldMetallic);
    boilerBand.rotation.x = Math.PI / 2;
    boilerBand.position.set(0, 0.34, 0.25);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.34), locoRed);
    cab.position.set(0, 0.40, -0.26);
    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.40), matSnowCap);
    cabRoof.position.set(0, 0.63, -0.26);
    const cabWindow = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.16, 0.18), glowWin);
    cabWindow.position.set(0, 0.44, -0.26);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.048, 0.26, 10), locoBlack);
    stack.position.set(0, 0.56, 0.30);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), matGoldMetallic);
    dome.position.set(0, 0.48, 0.06);
    const cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.20, 4), matGoldMetallic);
    cowcatcher.rotation.x = Math.PI / 2;
    cowcatcher.rotation.z = Math.PI / 4;
    cowcatcher.position.set(0, 0.14, 0.52);

    // Headlamp + Volumetric Cone Beam
    const headlamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), glowWin);
    headlamp.position.set(0, 0.36, 0.44);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.55, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe89e,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.33, 1.22);

    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.04, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    [-0.26, 0.04, 0.30].forEach((wz) => {
      [-0.18, 0.18].forEach((wx) => {
        const w = new THREE.Mesh(wheelGeo, matGoldMetallic);
        w.position.set(wx, 0.12, wz);
        loco.add(w);
        wheels.push(w);
      });
    });

    loco.add(chassis, boiler, boilerBand, cab, cabRoof, cabWindow, stack, dome, cowcatcher, headlamp, beam);
    system.add(loco);

    // Festive Passenger Car + Gift Flatbed Car
    const car1 = new THREE.Group();
    const c1Body = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.34, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35, metalness: 0.25 })
    );
    c1Body.position.y = 0.30;
    const c1Roof = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.07, 0.78), matSnowCap);
    c1Roof.position.y = 0.50;
    const c1Win = new THREE.Mesh(new THREE.BoxGeometry(0.355, 0.14, 0.52), glowWin);
    c1Win.position.y = 0.33;
    const c1Trim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.74), matGoldMetallic);
    c1Trim.position.y = 0.17;
    car1.add(c1Body, c1Roof, c1Win, c1Trim);
    system.add(car1);

    const car2 = new THREE.Group();
    const c2Deck = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.10, 0.68), locoRed);
    c2Deck.position.y = 0.17;
    const miniGift1 = createGiftBox(0.20, 0.20, 0.20, 0, 0xffd700);
    miniGift1.position.set(0, 0.22, 0.14);
    const miniGift2 = createGiftBox(0.18, 0.24, 0.22, 1, 0xef4444);
    miniGift2.position.set(0, 0.22, -0.15);
    car2.add(c2Deck, miniGift1, miniGift2);
    system.add(car2);

    // Steam Puffs emitted from the moving smokestack
    const steamPuffs = [];
    for (let i = 0; i < 10; i++) {
      const sm = new THREE.SpriteMaterial({
        map: smokeTex,
        color: 0xf8fafc,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const sp = new THREE.Sprite(sm);
      system.add(sp);
      steamPuffs.push({ sprite: sp, mat: sm, life: i / 10, origin: new THREE.Vector3() });
    }

    trainSystem = {
      group: system,
      trackRadius,
      cars: [
        { mesh: loco, offset: 0 },
        { mesh: car1, offset: -0.49 },
        { mesh: car2, offset: -0.94 }
      ],
      wheels,
      steamPuffs,
      angle: 0.4
    };
    return system;
  }

  // 8. Animated Santa's Sleigh & Team of 4 Articulated Galloping Reindeer + Stardust Trail
  let sleighSystem = null;
  function createSantaSleighAndReindeer() {
    const root = new THREE.Group();
    const sleighGroup = new THREE.Group();

    // Ornate Gold Runners
    [-0.28, 0.28].forEach((rx) => {
      const rCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx, 0.0, -0.58),
        new THREE.Vector3(rx, 0.0, 0.45),
        new THREE.Vector3(rx, 0.14, 0.72),
        new THREE.Vector3(rx, 0.34, 0.62)
      ]);
      const runner = new THREE.Mesh(new THREE.TubeGeometry(rCurve, 20, 0.025, 6, false), matGoldMetallic);
      sleighGroup.add(runner);
    });

    // Crimson Lacquered Sleigh Body
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.34, 1.02),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.45, roughness: 0.28 })
    );
    hull.position.set(0, 0.28, -0.05);
    const backRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.38, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.4, roughness: 0.3 })
    );
    backRest.position.set(0, 0.44, -0.52);
    backRest.rotation.x = -0.25;
    const goldRail = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.05, 1.06), matGoldMetallic);
    goldRail.position.set(0, 0.44, -0.05);

    // Santa Silhouette + Toy Sack
    const santaCoat = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.44, 10), matCrimsonVelvet);
    santaCoat.position.set(0, 0.56, 0.08);
    const santaHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfde2c4, roughness: 0.6 })
    );
    santaHead.position.set(0, 0.82, 0.08);
    const santaHat = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 8), matCrimsonVelvet);
    santaHat.position.set(0, 0.96, 0.04);
    santaHat.rotation.x = -0.35;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), matSnowCap);
    pom.position.set(0, 1.06, -0.04);

    const sack = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
    );
    sack.scale.set(1.0, 1.15, 0.9);
    sack.position.set(0, 0.56, -0.28);

    // Bow Lantern Glow
    const lanternHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowWarmTex,
        color: 0xffd700,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    lanternHalo.position.set(0, 0.48, 0.56);
    lanternHalo.scale.set(0.95, 0.95, 1);

    sleighGroup.add(hull, backRest, goldRail, santaCoat, santaHead, santaHat, pom, sack, lanternHalo);
    root.add(sleighGroup);

    // 4 Articulated Galloping Reindeer Harnessed Ahead of the Sleigh
    const deerMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.72 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd6bfa2, roughness: 0.8 });
    const reindeerList = [];
    const harnessPositions = [
      { x: -0.24, z: 1.45, lead: false },
      { x: 0.24, z: 1.45, lead: false },
      { x: -0.22, z: 2.38, lead: false },
      { x: 0.22, z: 2.38, lead: true } // Rudolph leads!
    ];

    harnessPositions.forEach((hp, idx) => {
      const deer = new THREE.Group();
      deer.position.set(hp.x, 0.30, hp.z);

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 10), deerMat);
      torso.rotation.x = Math.PI / 2;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.26, 8), deerMat);
      neck.position.set(0, 0.16, 0.20);
      neck.rotation.x = 0.45;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.20), deerMat);
      head.position.set(0, 0.28, 0.30);

      // Branching Procedural Antlers
      [-1, 1].forEach((side) => {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.24, 5), antlerMat);
        ant.position.set(side * 0.06, 0.41, 0.26);
        ant.rotation.z = -side * 0.45;
        ant.rotation.x = -0.25;
        deer.add(ant);
      });

      // Glowing Red Nose for Rudolph!
      if (hp.lead) {
        const nose = new THREE.Mesh(
          new THREE.SphereGeometry(0.042, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff2222 })
        );
        nose.position.set(0, 0.28, 0.42);
        const noseHalo = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowRedTex,
            color: 0xff3b3b,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        noseHalo.position.copy(nose.position);
        noseHalo.scale.set(0.68, 0.68, 1);
        deer.add(nose, noseHalo);
      }

      // 4 Articulated Legs
      const legGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.28, 6);
      legGeo.translate(0, -0.14, 0);
      const legs = [];
      [
        [-0.06, -0.05, 0.16],
        [0.06, -0.05, 0.16],
        [-0.06, -0.05, -0.16],
        [0.06, -0.05, -0.16]
      ].forEach(([lx, ly, lz], li) => {
        const leg = new THREE.Mesh(legGeo, deerMat);
        leg.position.set(lx, ly, lz);
        deer.add(leg);
        legs.push({ mesh: leg, isFront: li < 2, side: li % 2 });
      });

      deer.add(torso, neck, head);
      root.add(deer);
      reindeerList.push({ mesh: deer, legs, phase: idx * 1.15, baseY: 0.30 });
    });

    // Glowing Golden Reins linking Sleigh to Reindeer
    const reinMat = new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.72 });
    [-0.22, 0.22].forEach((rx) => {
      const rGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rx, 0.46, 0.44),
        new THREE.Vector3(rx, 0.34, 1.45),
        new THREE.Vector3(rx, 0.34, 2.38)
      ]);
      root.add(new THREE.Line(rGeo, reinMat));
    });

    // Shimmering Stardust Magic Trail Behind the Sleigh
    const trailCount = 58;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailColors = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.42,
      map: glowWarmTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(trailPoints);

    const trailHistory = Array.from({ length: trailCount }, () => new THREE.Vector3(0, 99, 0));

    root.scale.setScalar(0.88);
    scene.add(root);

    sleighSystem = {
      root,
      reindeerList,
      trailPoints,
      trailGeo,
      trailHistory,
      trailCursor: 0,
      lastTrailSample: 0
    };
  }

  // ---------------------------------------------------------------------------
  // Assemble Left & Right Blank-Space Village Clusters + VR Portal Centerpiece
  // ---------------------------------------------------------------------------
  const leftVillageGroup = new THREE.Group();
  leftVillageGroup.name = 'LeftChristmasVillage';
  scene.add(leftVillageGroup);

  const rightVillageGroup = new THREE.Group();
  rightVillageGroup.name = 'RightChristmasVillage';
  scene.add(rightVillageGroup);

  // Left Wing: Grand Intricate Christmas Tree + Wrapped Presents + Cozy Alpine Cottage + Victorian Lamppost + Candy Canes
  const heroTreeLeft = createIntricateChristmasTree({
    height: 5.5,
    baseRadius: 1.78,
    tiers: 8,
    ornamentCount: 48,
    lightCount: 74,
    seed: 11
  });
  heroTreeLeft.position.set(0.0, 0, 0.1);
  leftVillageGroup.add(heroTreeLeft);
  addGiftCluster(leftVillageGroup, 1.05, 8, 2);

  const cottage = createAlpineCottage();
  cottage.position.set(-1.78, -0.02, -1.85);
  cottage.rotation.y = 0.50;
  leftVillageGroup.add(cottage);

  const lampLeft = createVictorianLamppost();
  lampLeft.position.set(1.52, 0, 1.05);
  leftVillageGroup.add(lampLeft);

  const caneL1 = createCandyCane(0.68);
  caneL1.position.set(-1.35, 0, 1.38);
  caneL1.rotation.y = 0.55;
  caneL1.rotation.z = 0.08;
  leftVillageGroup.add(caneL1);

  // Right Wing: Second Asymmetric Grand Christmas Tree + Animated Steam Train + Chess-Crowned Snowman + Frozen Pond + Lamppost
  const heroTreeRight = createIntricateChristmasTree({
    height: 5.15,
    baseRadius: 1.66,
    tiers: 8,
    ornamentCount: 44,
    lightCount: 68,
    seed: 29
  });
  heroTreeRight.position.set(0.25, 0, -0.15);
  rightVillageGroup.add(heroTreeRight);
  addGiftCluster(rightVillageGroup, 0.95, 7, 5);

  const holidayTrain = createHolidayTrain(1.86);
  holidayTrain.position.set(0.25, 0.01, -0.15);
  rightVillageGroup.add(holidayTrain);

  const chessSnowman = createChessSnowman();
  chessSnowman.position.set(-1.42, 0, 1.48);
  chessSnowman.rotation.y = -0.35;
  rightVillageGroup.add(chessSnowman);

  const lampRight = createVictorianLamppost();
  lampRight.position.set(1.78, 0, 1.25);
  rightVillageGroup.add(lampRight);

  const caneR1 = createCandyCane(0.66);
  caneR1.position.set(-0.62, 0, 1.98);
  caneR1.rotation.y = -0.7;
  caneR1.rotation.z = -0.08;
  rightVillageGroup.add(caneR1);

  // Reflective Frozen Pond in Right Wing
  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 28),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.32,
      metalness: 0.88,
      roughness: 0.08
    })
  );
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(2.35, 0.02, -1.65);
  rightVillageGroup.add(pond);

  // Floating Golden Calm Chess Holiday Ring (Shown in Immersive VR & 360° Explore Mode!)
  const vrCenterpiece = new THREE.Group();
  vrCenterpiece.visible = false;
  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.075, 14, 48), matGoldMetallic);
  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 12, 40), matCrimsonVelvet);
  const crownStar = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowWarmTex,
      color: 0xffd700,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  crownStar.scale.set(2.6, 2.6, 1);
  vrCenterpiece.add(ringOuter, ringInner, crownStar);
  vrCenterpiece.position.set(0, 2.5, -4.6);
  scene.add(vrCenterpiece);

  // Create Flying Santa Sleigh + Reindeer
  createSantaSleighAndReindeer();

  // ---------------------------------------------------------------------------
  // Multi-Layer Custom GLSL 3D Procedural Snowfall
  // ---------------------------------------------------------------------------
  const snowCount = isMobileViewport() ? 920 : 1680;
  const snowPositions = new Float32Array(snowCount * 3);
  const snowSeeds = new Float32Array(snowCount * 3);
  const snowSizes = new Float32Array(snowCount);

  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 34;
    snowPositions[i * 3 + 1] = Math.random() * 18 - 3;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 26 + 2;

    snowSeeds[i * 3] = Math.random() * Math.PI * 2;     // phase
    snowSeeds[i * 3 + 1] = 0.55 + Math.random() * 1.15; // fall speed
    snowSeeds[i * 3 + 2] = 0.35 + Math.random() * 0.9;  // sway amplitude
    snowSizes[i] = 0.22 + Math.random() * 0.34;
  }

  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  snowGeo.setAttribute('aSeed', new THREE.BufferAttribute(snowSeeds, 3));
  snowGeo.setAttribute('aSize', new THREE.BufferAttribute(snowSizes, 1));

  const snowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWindX: { value: 0.22 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uTexture: { value: snowflakeTex }
    },
    vertexShader: `
      attribute vec3 aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uWindX;
      uniform float uPixelRatio;
      varying float vRot;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        float spanY = 18.0;
        p.y = mod(p.y - uTime * aSeed.y + 3.0, spanY) - 3.0;
        p.x = mod(p.x + uTime * uWindX * aSeed.y + sin(uTime * 0.8 + aSeed.x) * aSeed.z + 17.0, 34.0) - 17.0;
        p.z += cos(uTime * 0.65 + aSeed.x * 1.3) * aSeed.z * 0.65;

        vRot = uTime * (0.4 + aSeed.z * 0.6) + aSeed.x;
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        float dist = max(-mvPos.z, 1.2);
        vAlpha = smoothstep(26.0, 12.0, dist) * smoothstep(0.6, 2.5, dist) * smoothstep(-3.0, -1.6, p.y);
        gl_PointSize = aSize * uPixelRatio * (185.0 / dist);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying float vRot;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float c = cos(vRot);
        float s = sin(vRot);
        vec2 ruv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;
        vec4 tex = texture2D(uTexture, ruv);
        if (tex.a < 0.04) discard;
        gl_FragColor = vec4(tex.rgb, tex.a * vAlpha * 0.88);
      }
    `
  });

  const snowField = new THREE.Points(snowGeo, snowMat);
  scene.add(snowField);

  // ---------------------------------------------------------------------------
  // Interactive Procedural Holiday Fireworks (for WebXR Triggers & 360° Clicks)
  // ---------------------------------------------------------------------------
  const activeFireworks = [];
  const fireworkPalette = [0xffd700, 0xff4d6d, 0x34d399, 0x38bdf8, 0xfbbf24, 0xf472b6];

  function launchHolidayFirework(origin) {
    const count = 88;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const baseColor = new THREE.Color(fireworkPalette[Math.floor(Math.random() * fireworkPalette.length)]);
    const altColor = new THREE.Color(fireworkPalette[Math.floor(Math.random() * fireworkPalette.length)]);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const speed = 2.4 + Math.random() * 2.8;
      velocities.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        )
      );

      const c = i % 2 === 0 ? baseColor : altColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.36,
      map: glowWarmTex,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    activeFireworks.push({ points, geo, mat, velocities, age: 0, maxAge: 2.0 });
  }

  // ---------------------------------------------------------------------------
  // WebXR Controllers (Laser Wands + Select-to-Launch Festive Fireworks)
  // ---------------------------------------------------------------------------
  function setupXRController(index) {
    const controller = renderer.xr.getController(index);
    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -6)
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.7 });
    const ray = new THREE.Line(rayGeo, rayMat);
    controller.add(ray);

    controller.addEventListener('selectstart', () => {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(controller.quaternion);
      const burstPos = controller.position.clone().addScaledVector(dir, 7.5);
      burstPos.y = Math.max(burstPos.y, 2.2);
      launchHolidayFirework(burstPos);
    });
    cameraRig.add(controller);
    return controller;
  }
  setupXRController(0);
  setupXRController(1);

  // ---------------------------------------------------------------------------
  // Responsive Blank-Space Framing Engine (Desktop, Tablet, Mobile, Explore, XR)
  // ---------------------------------------------------------------------------
  let isExploreMode = false;
  let isInXR = false;
  let xrModeType = null; // 'vr' | 'ar' | null
  let isPaused = prefersReducedMotion;
  let pointerNdcX = 0;
  let pointerNdcY = 0;
  let scrollProgress = 0;
  let cachedHalfW = 9.8;

  function updateResponsiveFraming() {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    const aspect = w / h;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    starMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
    snowMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);

    if (isInXR) {
      // Cozy 360-degree immersive clearing around the user
      leftVillageGroup.position.set(-3.9, 0, -3.2);
      leftVillageGroup.scale.setScalar(0.82);
      leftVillageGroup.rotation.y = 0.36;

      rightVillageGroup.position.set(3.8, 0, -3.0);
      rightVillageGroup.scale.setScalar(0.80);
      rightVillageGroup.rotation.y = -0.34;

      terrainMesh.position.y = -0.02;
      vrCenterpiece.visible = xrModeType === 'vr';
      return;
    }

    if (isExploreMode) {
      // Full interactive 360 diorama staging
      leftVillageGroup.position.set(-4.1, -2.4, -0.6);
      leftVillageGroup.scale.setScalar(0.95);
      leftVillageGroup.rotation.y = 0.25;

      rightVillageGroup.position.set(4.1, -2.4, -0.5);
      rightVillageGroup.scale.setScalar(0.92);
      rightVillageGroup.rotation.y = -0.25;

      terrainMesh.position.y = -2.45;
      vrCenterpiece.visible = true;
      return;
    }

    // Standard Webpage Mode: Place Christmas Wonderland strictly in Blank/Empty Spaces
    vrCenterpiece.visible = false;
    terrainMesh.position.y = -2.65;

    const camZ = w < 820 ? 15.8 : 15.2;
    const halfH = camZ * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const halfW = halfH * aspect;
    cachedHalfW = halfW;

    if (w >= 820) {
      // Measure actual ring wrapper width so flanking clusters sit cleanly in the blank wings
      const ringEl = document.querySelector('.ring-wrapper');
      const ringW = ringEl ? ringEl.getBoundingClientRect().width : 500;
      const ringHalfFrac = Math.min(0.42, (ringW / w) * 0.5);
      const wingFrac = THREE.MathUtils.clamp((ringHalfFrac + 0.92) * 0.5, 0.56, 0.70);
      const wingX = Math.max(halfW * wingFrac, 4.9);
      const scaleFactor = THREE.MathUtils.clamp(w / 1460, 0.74, 1.04);

      leftVillageGroup.position.set(-wingX, -2.62, 0.2);
      leftVillageGroup.scale.setScalar(scaleFactor);
      leftVillageGroup.rotation.y = 0.24;

      rightVillageGroup.position.set(wingX, -2.62, 0.2);
      rightVillageGroup.scale.setScalar(scaleFactor * 0.96);
      rightVillageGroup.rotation.y = -0.22;
    } else {
      // Mobile Portrait Framing: Hug left/right lower edges & open upper sky cleanly
      const mobileWingX = Math.max(halfW * 0.84, 2.02);
      const mobileScale = THREE.MathUtils.clamp(w / 700, 0.44, 0.62);

      leftVillageGroup.position.set(-mobileWingX, -2.72, -0.6);
      leftVillageGroup.scale.setScalar(mobileScale);
      leftVillageGroup.rotation.y = 0.34;

      rightVillageGroup.position.set(mobileWingX, -2.72, -0.5);
      rightVillageGroup.scale.setScalar(mobileScale * 0.95);
      rightVillageGroup.rotation.y = -0.32;
    }
  }

  function updateScrollProgress() {
    const docEl = document.documentElement;
    const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
    scrollProgress = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
  }

  window.addEventListener('resize', updateResponsiveFraming, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(updateResponsiveFraming, 140), { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateResponsiveFraming, { passive: true });
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener(
    'pointermove',
    (e) => {
      pointerNdcX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerNdcY = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    },
    { passive: true }
  );

  // Interactive Sky Click Fireworks when in 360° Explore Mode
  const raycaster = new THREE.Raycaster();
  let pointerDownPos = { x: 0, y: 0 };
  canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!isExploreMode) return;
    const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (moved > 8) return; // Was an orbit drag, not a tap/click
    const ndc = new THREE.Vector2(
      (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
      -(e.clientY / Math.max(window.innerHeight, 1)) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const targetPt = new THREE.Vector3();
    raycaster.ray.at(13, targetPt);
    targetPt.y = Math.max(targetPt.y, 1.2);
    launchHolidayFirework(targetPt);
  });

  // ---------------------------------------------------------------------------
  // Optional Muted-by-Default Procedural Holiday Music Box Synthesizer
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  let chimeTimer = null;
  let isAudioOn = false;
  const melodyHz = [
    523.25, 659.25, 783.99, 659.25, // C5 E5 G5 E5
    587.33, 698.46, 880.0, 698.46,  // D5 F5 A5 F5
    523.25, 659.25, 783.99, 1046.5, // C5 E5 G5 C6
    987.77, 783.99, 659.25, 587.33  // B5 G5 E5 D5
  ];
  let melodyStep = 0;

  function playMusicBoxNote(freq) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const harm = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    harm.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    harm.frequency.setValueAtTime(freq * 2.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

    const harmGain = audioCtx.createGain();
    harmGain.gain.setValueAtTime(0.014, now);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    harm.start(now);
    osc.stop(now + 1.4);
    harm.stop(now + 0.5);
  }

  function toggleHolidayAudio() {
    isAudioOn = !isAudioOn;
    if (isAudioOn) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playMusicBoxNote(melodyHz[melodyStep++ % melodyHz.length]);
        chimeTimer = setInterval(() => {
          if (!document.hidden && isAudioOn) {
            playMusicBoxNote(melodyHz[melodyStep++ % melodyHz.length]);
          }
        }, 720);
      } catch (e) {
        isAudioOn = false;
      }
    } else if (chimeTimer) {
      clearInterval(chimeTimer);
      chimeTimer = null;
    }
    if (btnAudio) {
      btnAudio.setAttribute('aria-pressed', String(isAudioOn));
      btnAudio.classList.toggle('is-active', isAudioOn);
      btnAudio.title = isAudioOn ? 'Mute Holiday Music Box' : 'Play Calm Holiday Music Box';
    }
  }

  // ---------------------------------------------------------------------------
  // Interactive 360° Exploration Mode & Native WebXR Session Management
  // ---------------------------------------------------------------------------
  function setExploreMode(enabled) {
    isExploreMode = enabled;
    document.body.classList.toggle('xr-explore-mode', enabled);
    controls.enabled = enabled;
    if (enabled) {
      isPaused = false;
      syncPauseUi();
      camera.position.set(0, 2.2, 11.4);
      controls.target.set(0, 0.35, -0.8);
      controls.update();
      // Launch a welcoming festive firework burst
      launchHolidayFirework(new THREE.Vector3(0, 4.4, -3.5));
    }
    if (btnExplore) {
      btnExplore.setAttribute('aria-pressed', String(enabled));
      btnExplore.classList.toggle('is-active', enabled);
    }
    updateResponsiveFraming();
  }

  function syncPauseUi() {
    if (!btnPause) return;
    btnPause.setAttribute('aria-pressed', String(isPaused));
    btnPause.classList.toggle('is-active', isPaused);
    btnPause.textContent = isPaused ? '▶' : '⏸';
    btnPause.title = isPaused ? 'Resume Christmas Animations' : 'Pause Christmas Animations';
    btnPause.setAttribute('aria-label', btnPause.title);
  }

  let activeXrSession = null;
  async function startXRSession(mode) {
    if (!navigator.xr) return;
    if (activeXrSession) {
      await activeXrSession.end().catch(() => {});
      return;
    }
    try {
      const sessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      };
      const session = await navigator.xr.requestSession(mode, sessionInit);
      activeXrSession = session;
      isInXR = true;
      xrModeType = mode === 'immersive-ar' ? 'ar' : 'vr';
      isPaused = false;
      syncPauseUi();

      if (xrModeType === 'ar') {
        environmentSkyGroup.visible = false;
        groundGroup.visible = false;
        scene.fog = null;
        renderer.setClearAlpha(0);
      } else {
        environmentSkyGroup.visible = true;
        groundGroup.visible = true;
        scene.fog = new THREE.FogExp2(0x071022, 0.0155);
      }

      cameraRig.position.set(0, 0, 2.4);
      updateResponsiveFraming();

      session.addEventListener('end', () => {
        activeXrSession = null;
        isInXR = false;
        xrModeType = null;
        environmentSkyGroup.visible = true;
        groundGroup.visible = true;
        scene.fog = new THREE.FogExp2(0x071022, 0.0155);
        cameraRig.position.set(0, 0, 0);
        updateResponsiveFraming();
      });

      await renderer.xr.setSession(session);
    } catch (err) {
      console.warn(`[ChristmasXR] Unable to start ${mode} session:`, err);
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
    if (btnVr) btnVr.hidden = !vrOk;
    if (btnAr) btnAr.hidden = !arOk;
    if (statusPill) {
      statusPill.textContent = vrOk || arOk ? 'WebXR Ready' : '3D WebXR';
    }
  }

  if (btnDockToggle && dock) {
    btnDockToggle.addEventListener('click', () => {
      const expanded = dock.classList.toggle('is-expanded');
      btnDockToggle.setAttribute('aria-expanded', String(expanded));
      btnDockToggle.classList.toggle('is-active', expanded);
    });
  }
  if (btnExplore) {
    btnExplore.addEventListener('click', () => setExploreMode(!isExploreMode));
  }
  if (btnExitExplore) {
    btnExitExplore.addEventListener('click', () => setExploreMode(false));
  }
  if (btnVr) {
    btnVr.addEventListener('click', () => startXRSession('immersive-vr'));
  }
  if (btnAr) {
    btnAr.addEventListener('click', () => startXRSession('immersive-ar'));
  }
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      isPaused = !isPaused;
      syncPauseUi();
    });
  }
  if (btnAudio) {
    btnAudio.addEventListener('click', toggleHolidayAudio);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isExploreMode) setExploreMode(false);
  });

  // WebGL context loss resilience
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    isPaused = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    isPaused = prefersReducedMotion;
    updateResponsiveFraming();
  });

  syncPauseUi();
  detectWebXRSupport();
  updateScrollProgress();
  updateResponsiveFraming();

  // Re-measure ring after js/index.js finishes fetching/rendering segments
  window.addEventListener('load', () => setTimeout(updateResponsiveFraming, 120));

  // ---------------------------------------------------------------------------
  // Master WebXR Procedural Animation Loop (setAnimationLoop)
  // ---------------------------------------------------------------------------
  let simTime = 0;
  let lastTimestamp = 0;

  renderer.setAnimationLoop((timestamp) => {
    if (document.hidden && !isInXR) {
      lastTimestamp = timestamp;
      return;
    }

    const rawDt = lastTimestamp ? (timestamp - lastTimestamp) * 0.001 : 0.016;
    lastTimestamp = timestamp;
    const dt = Math.min(rawDt, 0.05);

    if (!isPaused || isInXR) {
      simTime += dt;
    }

    // 1. Update Aurora, Twinkling Stars & 3D Snowfall Shaders
    auroraUniforms.uTime.value = simTime;
    starMat.uniforms.uTime.value = simTime;
    snowMat.uniforms.uTime.value = simTime;
    snowMat.uniforms.uWindX.value = 0.22 + Math.sin(simTime * 0.25) * 0.14 + pointerNdcX * 0.16;

    // 2. Twinkling Tree Fairy Lights Wave
    for (let i = 0; i < fairyLights.length; i++) {
      const fl = fairyLights[i];
      const pulse = 0.48 + 0.52 * Math.sin(simTime * fl.speed + fl.phase);
      fl.spriteMat.opacity = 0.28 + 0.72 * pulse;
      const haloScale = 0.28 + 0.28 * pulse;
      fl.halo.scale.set(haloScale, haloScale, 1);
      fl.bulbMat.color.copy(fl.baseColor).multiplyScalar(0.55 + 0.65 * pulse);
    }

    // 3. Rotating Bethlehem Star Tree Toppers
    for (let i = 0; i < animatedStars.length; i++) {
      const st = animatedStars[i];
      st.mesh.rotation.y = simTime * 0.75 + st.phase;
      const glowPulse = 1.65 + 0.35 * Math.sin(simTime * 2.4 + st.phase);
      st.halo.scale.set(glowPulse, glowPulse, 1);
    }

    // 4. Warm Hearth & Tree Dynamic Light Flicker
    for (let i = 0; i < fireplaceMaterials.length; i++) {
      const flick = 1.35 + 0.28 * Math.sin(simTime * 6.5) + 0.14 * Math.sin(simTime * 13.7);
      fireplaceMaterials[i].emissiveIntensity = flick;
    }
    for (let i = 0; i < dynamicPointLights.length; i++) {
      const dl = dynamicPointLights[i];
      const mod = dl.flicker
        ? 0.88 + 0.12 * Math.sin(simTime * 7.2 + dl.phase) + 0.06 * Math.cos(simTime * 15.1)
        : 0.90 + 0.10 * Math.sin(simTime * 1.9 + dl.phase);
      dl.light.intensity = dl.base * mod;
    }

    // 5. Rising & Curling Alpine Cottage Chimney Smoke
    for (let e = 0; e < chimneyEmitters.length; e++) {
      const em = chimneyEmitters[e];
      for (let p = 0; p < em.puffs.length; p++) {
        const pf = em.puffs[p];
        if (!isPaused || isInXR) {
          pf.life = (pf.life + dt * 0.24) % 1.0;
        }
        const t = pf.life;
        pf.sprite.position.set(
          em.origin.x + Math.sin(simTime * 1.1 + pf.driftSeed) * 0.25 * t + t * 0.55,
          em.origin.y + t * 2.4,
          em.origin.z + Math.cos(simTime * 0.9 + pf.driftSeed) * 0.20 * t
        );
        const s = 0.28 + t * 0.95;
        pf.sprite.scale.set(s, s, 1);
        pf.mat.opacity = Math.sin(t * Math.PI) * 0.42;
      }
    }

    // 6. Animated Miniature Holiday Steam Train & Steam Rings
    if (trainSystem) {
      if (!isPaused || isInXR) {
        trainSystem.angle += dt * 0.48;
      }
      const r = trainSystem.trackRadius;
      trainSystem.cars.forEach((car) => {
        const a = trainSystem.angle + car.offset;
        const cx = Math.cos(a) * r;
        const cz = Math.sin(a) * r;
        car.mesh.position.set(cx, Math.abs(Math.sin(simTime * 9.0 + car.offset)) * 0.015, cz);
        // Face forward tangent along circular track
        const nextA = a + 0.05;
        car.mesh.lookAt(
          trainSystem.group.localToWorld(new THREE.Vector3(Math.cos(nextA) * r, 0, Math.sin(nextA) * r))
        );
      });
      trainSystem.wheels.forEach((w) => {
        w.rotation.x = simTime * 6.0;
      });

      const locoPos = trainSystem.cars[0].mesh.position;
      trainSystem.steamPuffs.forEach((sp, idx) => {
        if (!isPaused || isInXR) {
          sp.life += dt * 0.72;
          if (sp.life >= 1.0) {
            sp.life -= 1.0;
            sp.origin.set(locoPos.x, locoPos.y + 0.68, locoPos.z);
          }
        }
        const t = sp.life;
        sp.sprite.position.set(
          sp.origin.x + Math.sin(t * 4.0 + idx) * 0.08,
          sp.origin.y + t * 1.05,
          sp.origin.z + Math.cos(t * 3.5 + idx) * 0.08
        );
        const sc = 0.14 + t * 0.42;
        sp.sprite.scale.set(sc, sc, 1);
        sp.mat.opacity = Math.sin(t * Math.PI) * 0.48;
      });
    }

    // 7. Animated Chess-Crowned Snowman Sway & Cheerful Wave
    if (snowmanRig) {
      snowmanRig.upper.rotation.z = Math.sin(simTime * 1.45) * 0.055;
      snowmanRig.rightArm.rotation.z = Math.sin(simTime * 3.4) * 0.28 + 0.15;
      snowmanRig.leftArm.rotation.z = -Math.sin(simTime * 1.8) * 0.10;
      snowmanRig.scarfTail.rotation.x = Math.sin(simTime * 2.8) * 0.14;
    }

    // 8. Animated Santa's Sleigh & 4 Articulated Galloping Reindeer + Stardust Ribbon
    if (sleighSystem) {
      const flyT = simTime * 0.24 + 0.55;
      const spanX = isInXR ? 11.5 : Math.max(cachedHalfW * 1.12, 5.2);
      const skyY = isInXR ? 6.0 : isMobileViewport() ? 3.95 : 3.75;
      const skyZ = isInXR ? -6.5 : -5.6;

      const evalSleighPos = (t) =>
        new THREE.Vector3(
          Math.sin(t) * spanX,
          skyY + Math.sin(t * 2.0) * 0.62 + Math.cos(t * 0.5) * 0.25,
          skyZ + Math.cos(t) * 3.8
        );

      const posNow = evalSleighPos(flyT);
      const posAhead = evalSleighPos(flyT + 0.04);
      sleighSystem.root.position.copy(posNow);
      sleighSystem.root.lookAt(posAhead);
      // Graceful banking tilt into turns
      sleighSystem.root.rotateZ(Math.cos(flyT) * 0.18);

      // Galloping Reindeer Kinematics
      sleighSystem.reindeerList.forEach((rd) => {
        const g = simTime * 8.5 + rd.phase;
        rd.mesh.position.y = rd.baseY + Math.sin(g) * 0.065;
        rd.mesh.rotation.x = Math.cos(g) * 0.09;
        rd.legs.forEach((leg) => {
          const swing = leg.isFront ? Math.sin(g + leg.side * 0.55) : -Math.sin(g + leg.side * 0.55);
          leg.mesh.rotation.x = swing * 0.68;
        });
      });

      // Emit Shimmering Stardust Trail Behind Runners
      if ((!isPaused || isInXR) && simTime - sleighSystem.lastTrailSample > 0.045) {
        sleighSystem.lastTrailSample = simTime;
        const tailWorld = new THREE.Vector3(0, 0.15, -0.65).applyMatrix4(sleighSystem.root.matrixWorld);
        sleighSystem.trailHistory[sleighSystem.trailCursor].copy(tailWorld);
        sleighSystem.trailCursor = (sleighSystem.trailCursor + 1) % sleighSystem.trailHistory.length;
      }

      const tArr = sleighSystem.trailGeo.attributes.position.array;
      const cArr = sleighSystem.trailGeo.attributes.color.array;
      const total = sleighSystem.trailHistory.length;
      for (let i = 0; i < total; i++) {
        const idx = (sleighSystem.trailCursor + i) % total;
        const ageFrac = i / total; // 0 = oldest, 1 = newest
        const pt = sleighSystem.trailHistory[idx];
        tArr[i * 3] = pt.x;
        tArr[i * 3 + 1] = pt.y - (1.0 - ageFrac) * 0.42;
        tArr[i * 3 + 2] = pt.z;

        const sparkle = 0.55 + 0.45 * Math.sin(simTime * 11.0 + i * 1.9);
        const fade = ageFrac * sparkle;
        cArr[i * 3] = 1.0 * fade;
        cArr[i * 3 + 1] = (0.76 + 0.24 * ageFrac) * fade;
        cArr[i * 3 + 2] = (0.28 + 0.65 * (1.0 - ageFrac)) * fade;
      }
      sleighSystem.trailGeo.attributes.position.needsUpdate = true;
      sleighSystem.trailGeo.attributes.color.needsUpdate = true;
    }

    // 9. Floating Calm Chess VR Centerpiece Rotation
    if (vrCenterpiece.visible) {
      ringOuter.rotation.y = simTime * 0.45;
      ringOuter.rotation.x = Math.sin(simTime * 0.6) * 0.18;
      ringInner.rotation.y = -simTime * 0.65;
      ringInner.rotation.z = simTime * 0.3;
    }

    // 10. Active Procedural Fireworks Simulation
    for (let i = activeFireworks.length - 1; i >= 0; i--) {
      const fw = activeFireworks[i];
      fw.age += dt;
      if (fw.age >= fw.maxAge) {
        scene.remove(fw.points);
        fw.geo.dispose();
        fw.mat.dispose();
        activeFireworks.splice(i, 1);
        continue;
      }
      const posAttr = fw.geo.attributes.position;
      for (let k = 0; k < fw.velocities.length; k++) {
        const vel = fw.velocities[k];
        vel.multiplyScalar(0.978);
        vel.y -= 1.65 * dt;
        posAttr.setXYZ(
          k,
          posAttr.getX(k) + vel.x * dt,
          posAttr.getY(k) + vel.y * dt,
          posAttr.getZ(k) + vel.z * dt
        );
      }
      posAttr.needsUpdate = true;
      fw.mat.opacity = Math.max(0, 1.0 - fw.age / fw.maxAge);
    }

    // 11. Smooth Scroll + Pointer Parallax Camera (in Normal Webpage Mode)
    if (!isInXR) {
      if (isExploreMode) {
        controls.update();
      } else {
        const mobile = isMobileViewport();
        const targetX = pointerNdcX * (mobile ? 0.22 : 0.48);
        const targetY = (mobile ? 1.85 : 2.15) - scrollProgress * 1.15 - pointerNdcY * (mobile ? 0.12 : 0.22);
        const targetZ = (mobile ? 15.8 : 15.2) - scrollProgress * 0.85;

        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
        camera.lookAt(0, (mobile ? 1.45 : 1.75) - scrollProgress * 0.95, -0.8);
      }
    }

    renderer.render(scene, camera);
  });

  // Expose clean diagnostic/control handle
  window.CalmChessChristmasXR = {
    setExploreMode,
    launchFirework: () => launchHolidayFirework(new THREE.Vector3((Math.random() - 0.5) * 6, 4.2, -4)),
    updateResponsiveFraming,
    getState: () => ({ isExploreMode, isInXR, xrModeType, isPaused, isAudioOn })
  };
})();
