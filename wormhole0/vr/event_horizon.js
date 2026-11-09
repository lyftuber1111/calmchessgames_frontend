/**
 * Wormhole XR - Stage 2: Event Horizon [VR Headset Profile]
 * Calibrated for WebXR Immersive-VR (6-DOF Spatial Motion Controllers, Stereo Rendering)
 * Database Stage Level: 2 | Environment: Event Horizon Amber
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 * Calm Chess Computers 2026
 */

export const stageConfig = {
  stage_level: 2,
  stage_name: 'Event Horizon',
  stage_slug: 'event_horizon',
  environment_theme: 'Event Horizon Amber',
  device: 'vr',
  xr_mode: 'desktop-vr',
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
      count: 3800,
      starCount: 2200,
      dustCount: 500,
      speed: 0.85
    },
    flight: {
      speed: 50,
      boostMultiplier: 2.3,
      pitchSpeed: 0.0024,
      yawSpeed: 0.0024
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
    "scale": 1.4,
    "length": 4,
    "height": 2.8,
    "depth": 6,
    "circumference": 12,
    "icon": "🛰️",
    "color": "#ffd166",
    "hits": 8,
    "armor": 50,
    "shield": 4,
    "speed": 180,
    "attack_damage": 20,
    "weapon_name": "Tachyon Lance Cannon",
    "weapon_damage": 14,
    "weapon_speed": 580,
    "weapon_color": "#ffd166",
    "fire_rate": 3.2,
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
    "scale": 1.15,
    "length": 4.5,
    "height": 1.4,
    "depth": 3.6,
    "circumference": 5.4,
    "icon": "🚀",
    "color": "#f59e0b",
    "hits": 4,
    "armor": 28,
    "shield": 2,
    "speed": 370,
    "attack_damage": 11,
    "weapon_name": "Dual Ion Cannon",
    "weapon_damage": 9,
    "weapon_speed": 530,
    "weapon_color": "#f59e0b",
    "fire_rate": 2,
    "score": 275,
    "threat": "Medium",
    "piercing": "red_laser"
  }
],

  controls: {
    inputMode: '6dof_controllers',
    showVirtualJoysticks: false,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'Dual 6-DOF VR motion controllers, Trigger primary fire, Grip boost thrust'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 2: Event Horizon] Applying VR Headset Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON [VR]');
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
    engineApi.showToast('🚀 STAGE 2: EVENT HORIZON [VR] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
