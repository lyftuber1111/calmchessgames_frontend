/**
 * Wormhole XR - Stage 2: Event Horizon [ARCore Profile]
 * Calibrated for WebXR Immersive-AR in Passthrough Space
 * Database Stage Level: 2 | Environment: Event Horizon Amber
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 2,
  stage_name: 'Event Horizon',
  stage_slug: 'event_horizon',
  environment_theme: 'Event Horizon Amber',
  device: 'arcore',
  xr_mode: 'mobile-ar',
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
        "current": 0,
        "title": "Destroy 15 Threats",
        "description": "Destroy 15 hostile 3D units emerging from the wormhole",
        "requiredForWarp": true
    },
    {
        "id": "distance",
        "type": "distance",
        "target": 35000,
        "title": "Wormhole Proximity < 35,000 KM",
        "description": "Navigate vessel to within < 35,000 KM of singularity core",
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
      count: 1800,
      starCount: 600,
      dustCount: 200,
      speed: 0.85
    },
    flight: {
      speed: 40,
      boostMultiplier: 1.9,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
    "initial": {
        "id": "tachyon_lance",
        "name": "Tachyon Lance",
        "icon": "⚡",
        "color": "#a855f7",
        "damage": 3,
        "bullet_speed": 850,
        "energy_drain_pct": 25,
        "can_overheat": 1,
        "cooldown_seconds": 7,
        "acquire_event": "warp_horizon_jump",
        "description": "Superluminal phase particle array unlocked after horizon traversal."
    },
    "acquirable": []
},

  enemies: [
    {
        "id": "tachyon_cruiser",
        "device_type": "all",
        "name": "Horizon Tachyon Cruiser (Universal)",
        "enemy_class": "Heavy Cruiser",
        "icon": "🛰️",
        "model_3d_type": "cruiser",
        "model_3d_url": "",
        "scale": 1.25,
        "length": 3.5,
        "height": 2.5,
        "depth": 5.5,
        "circumference": 10.5,
        "color": "#ffd166",
        "hits": 8,
        "armor": 50,
        "shield": 4,
        "speed": 200,
        "attack_damage": 20,
        "weapon_name": "Tachyon Beam",
        "weapon_damage": 20,
        "weapon_speed": 600,
        "weapon_color": "#ffd166",
        "fire_rate": 3,
        "score": 500,
        "threat": "High",
        "piercing": "tachyon_lance",
        "quick_effect_primary": "tachyon_trail",
        "quick_effect_secondary": "sparks_burst",
        "quick_effect_color": "#ffd166",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_debris_cloud",
        "destruction_particle_url": "",
        "destruction_particle_count": 60,
        "destruction_particle_color": "#ffd166",
        "destruction_particle_scale": 1
    }
],

  controls: {
    inputMode: 'ar_touch_flight',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: false,
    description: '6-DOF AR device pose tracking, Screen tap targeting, Virtual touch thrust'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 2: Event Horizon] Applying ARCore Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON [ARCORE]');
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
    engineApi.showToast('🚀 STAGE 2: EVENT HORIZON [ARCORE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };