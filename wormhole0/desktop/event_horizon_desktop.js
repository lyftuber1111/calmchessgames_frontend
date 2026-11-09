/**
 * Wormhole XR - Stage 2: Event Horizon [Desktop Profile]
 * Calibrated for Desktop PC (6-DOF Flight, Keyboard/Mouse, Full Particle Density)
 * Database Stage Level: 2 | Environment: Event Horizon Amber
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 * Calm Chess Computers 2026
 */

export const stageConfig = {
  stage_level: 2,
  stage_name: 'Event Horizon',
  stage_slug: 'event_horizon',
  environment_theme: 'Event Horizon Amber',
  device: 'desktop',
  xr_mode: 'desktop-xr',
  events_within_level: 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert',
  end_level_event: 'Singularity Perimeter Breach',
  mission_objectives: 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.',
  required_enemy_kills: 15,
  warp_target_distance: 35000,
  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 15,
    "title": "Destroy 15 Threats",
    "description": "Neutralize 15 hostile units traversing the event horizon",
    "requiredForWarp": true
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 35000,
    "title": "Wormhole Proximity < 35,000 KM",
    "description": "Close distance to < 35,000 KM of gravitational threshold",
    "requiredForWarp": true
  }
],
  description: 'High-velocity relativistic light-horizon boundary with intense magnetic shear.',
  par_score: 12000,

  visual: {
    themeName: 'Event Horizon Amber',
    primaryColor: '#ffd166',
    glowColor: 'rgba(255, 209, 102, 0.45)',
    panelBg: 'rgba(24, 14, 2, 0.88)',
    panelBorder: 'rgba(255, 209, 102, 0.40)',
    uniforms: {
      uColorEdge: 0x663300,
      uColorCore: 0xff9900,
      uColorHot: 0xfff4d6,
      uHaloColor: 0xffaa00
    },
    lights: {
      ambient: 0x331a00,
      center: 0xffaa00
    },
    particles: {
      count: 5500,
      starCount: 3000,
      dustCount: 800,
      speed: 0.85
    },
    flight: {
      speed: 45,
      boostMultiplier: 2.2,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
  "initial": {
    "id": "tachyon_lance",
    "name": "Tachyon Lance",
    "icon": "⚡",
    "color": "#ffd166",
    "damage": 3,
    "bullet_speed": 850,
    "energy_drain_pct": 20,
    "can_overheat": 1,
    "cooldown_seconds": 7,
    "acquire_event": "warp_horizon_jump",
    "description": "Superluminal phase particle array unlocked after horizon traversal."
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
      "acquire_event": "default_start"
    }
  ]
},

  enemies: [
  {
    "id": "tachyon_cruiser",
    "name": "Horizon Tachyon Cruiser",
    "enemy_class": "Heavy Cruiser",
    "model_3d_type": "cruiser",
    "model_3d_url": "",
    "scale": 1.25,
    "length": 3.5,
    "height": 2.5,
    "depth": 5.5,
    "circumference": 10.5,
    "icon": "🛰️",
    "color": "#ffd166",
    "hits": 8,
    "armor": 50,
    "shield": 4,
    "speed": 200,
    "attack_damage": 20,
    "weapon_name": "Tachyon Lance Cannon",
    "weapon_damage": 14,
    "weapon_speed": 600,
    "weapon_color": "#ffd166",
    "fire_rate": 3,
    "score": 500,
    "threat": "High",
    "piercing": "tachyon_lance"
  },
  {
    "id": "phase_interceptor",
    "name": "Phase Interceptor",
    "enemy_class": "Fast Interceptor",
    "model_3d_type": "interceptor",
    "model_3d_url": "",
    "scale": 1,
    "length": 4.2,
    "height": 1.3,
    "depth": 3.4,
    "circumference": 5,
    "icon": "🚀",
    "color": "#f59e0b",
    "hits": 4,
    "armor": 30,
    "shield": 2,
    "speed": 430,
    "attack_damage": 12,
    "weapon_name": "Dual Ion Cannon",
    "weapon_damage": 10,
    "weapon_speed": 560,
    "weapon_color": "#f59e0b",
    "fire_rate": 1.8,
    "score": 275,
    "threat": "Medium",
    "piercing": "red_laser"
  }
],

  controls: {
    inputMode: 'keyboard_mouse',
    showVirtualJoysticks: false,
    enablePointerLock: true,
    requireLandscape: false,
    description: 'WASD flight thrust, Mouse aim, Space boost, Tab HUD toggle, Left-Click fire laser'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 2: Event Horizon] Applying Desktop Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON [DESKTOP]');
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
    engineApi.showToast('🚀 STAGE 2: EVENT HORIZON [DESKTOP] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
