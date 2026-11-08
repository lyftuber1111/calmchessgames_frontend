/**
 * Wormhole XR - Stage 1: Warp Origin [Mobile Profile]
 * Calibrated for Mobile Smartphones & Tablets (Dual Touch Joysticks, Gyroscope, Mobile Shaders)
 * Database Stage Level: 1 | Environment: Warp Cyan Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 1,
  stage_name: 'Warp Origin',
  stage_slug: 'warp_origin',
  environment_theme: 'Warp Cyan Corridor',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert',
  end_level_event: 'Warp Horizon Jump Gate Initialized',
  mission_objectives: 'Destroy 10 hostiles and close within 50,000 KM of wormhole singularity to authorize warp jump.',
  required_enemy_kills: 10,
  warp_target_distance: 50000,
  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 10,
    "title": "Destroy 10 Hostiles",
    "description": "Neutralize 10 hostiles emerging from the wormhole",
    "requiredForWarp": true
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 50000,
    "title": "Wormhole Proximity < 50,000 KM",
    "description": "Approach within 50,000 KM of singularity entry",
    "requiredForWarp": true
  },
  {
    "id": "scan",
    "type": "scan",
    "target": 1,
    "title": "Anomaly Resonance Scan",
    "description": "Calibrate directional sensor on wormhole anomaly",
    "requiredForWarp": false
  },
  {
    "id": "coils",
    "type": "coils",
    "target": 3,
    "title": "Tachyon Warp Coils",
    "description": "Charge all 3 electromagnetic stabilization coils",
    "requiredForWarp": false
  }
],
  description: 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.',
  par_score: 5000,

  visual: {
    themeName: 'Warp Cyan Corridor',
    primaryColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    panelBg: 'rgba(2, 14, 26, 0.88)',
    panelBorder: 'rgba(0, 240, 255, 0.40)',
    uniforms: {
      uColorEdge: 0x003366,
      uColorCore: 0x00f0ff,
      uColorHot: 0xd6ffff,
      uHaloColor: 0x00f0ff
    },
    lights: {
      ambient: 0x002233,
      center: 0x00f0ff
    },
    particles: {
      count: 2200,
      starCount: 1200,
      dustCount: 300,
      speed: 0.85
    },
    flight: {
      speed: 42,
      boostMultiplier: 2.2,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
  "initial": {
    "id": "red_laser",
    "name": "Neon Red Laser",
    "icon": "🔴",
    "color": "#ff0033",
    "damage": 2,
    "bullet_speed": 550,
    "energy_drain_pct": 10,
    "can_overheat": 1,
    "cooldown_seconds": 5,
    "description": "Standard directed neon plasma pulse. Initial weapon for Stage 1."
  },
  "acquirable": [
    {
      "id": "blue_laser",
      "name": "Cobalt Blue Laser",
      "icon": "🔵",
      "color": "#0088ff",
      "damage": 1,
      "bullet_speed": 700,
      "energy_drain_pct": 30,
      "can_overheat": 1,
      "cooldown_seconds": 10,
      "acquire_event": "default_start",
      "description": "High-density quantum particle beam."
    }
  ]
},

  enemies: [
  {
    "id": "void_recon_drone",
    "name": "Void Recon Drone",
    "enemy_class": "Scout Drone",
    "model_3d_type": "scout_drone",
    "model_3d_url": "",
    "scale": 1.1,
    "length": 3,
    "height": 3,
    "depth": 3,
    "circumference": 9.4,
    "icon": "🛸",
    "color": "#00f0ff",
    "hits": 2,
    "armor": 8,
    "shield": 0,
    "speed": 240,
    "attack_damage": 4,
    "weapon_name": "Plasma Pulse",
    "weapon_damage": 4,
    "weapon_speed": 380,
    "weapon_color": "#00f0ff",
    "fire_rate": 2.8,
    "score": 100,
    "threat": "Low",
    "piercing": "any"
  },
  {
    "id": "phase_interceptor",
    "name": "Phase Interceptor",
    "enemy_class": "Fast Interceptor",
    "model_3d_type": "interceptor",
    "model_3d_url": "",
    "scale": 1.05,
    "length": 4.4,
    "height": 1.4,
    "depth": 3.6,
    "circumference": 5.2,
    "icon": "🚀",
    "color": "#38bdf8",
    "hits": 3,
    "armor": 20,
    "shield": 1,
    "speed": 320,
    "attack_damage": 8,
    "weapon_name": "Twin Ion Blasters",
    "weapon_damage": 7,
    "weapon_speed": 460,
    "weapon_color": "#38bdf8",
    "fire_rate": 2.2,
    "score": 250,
    "threat": "Medium",
    "piercing": "red_laser"
  }
],

  controls: {
    inputMode: 'touch_virtual_joysticks',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'Left virtual joystick for pitch/yaw, Right slider for thrust/throttle, On-screen fire button'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 1: Warp Origin] Applying Mobile Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN [MOBILE]');
  }
  if (typeof engineApi.setFlightConfig === 'function') {
    engineApi.setFlightConfig(stageConfig.visual.flight);
  }
  if (typeof engineApi.setWeapons === 'function') {
    engineApi.setWeapons(stageConfig.weapons);
  }
  if (typeof engineApi.setEnemies === 'function') {
    engineApi.setEnemies(stageConfig.enemies);
  }
  if (typeof engineApi.setStageObjectives === 'function') {
    engineApi.setStageObjectives(stageConfig.objectives || []);
  }
  if (typeof engineApi.setDeviceControls === 'function') {
    engineApi.setDeviceControls(stageConfig.controls);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 STAGE 1: WARP ORIGIN [MOBILE] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(false);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
