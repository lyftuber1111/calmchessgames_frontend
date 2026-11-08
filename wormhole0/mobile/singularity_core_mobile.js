/**
 * Wormhole XR - Stage 3: Singularity Core [Mobile Profile]
 * Calibrated for Mobile Smartphones & Tablets (Dual Touch Joysticks, Gyroscope, Mobile Shaders)
 * Database Stage Level: 3 | Environment: Singularity Void Violet
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 3,
  stage_name: 'Singularity Core',
  stage_slug: 'singularity_core',
  environment_theme: 'Singularity Void Violet',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening',
  end_level_event: 'Core Collapse Breakthrough',
  mission_objectives: 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.',
  required_enemy_kills: 20,
  warp_target_distance: 20000,
  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 20,
    "title": "Destroy 20 Void Probes",
    "description": "Eliminate core probes defending the event singularity",
    "requiredForWarp": true
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 20000,
    "title": "Core Penetration < 20,000 KM",
    "description": "Penetrate within 20,000 KM of the collapse boundary",
    "requiredForWarp": true
  }
],
  description: 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.',
  par_score: 25000,

  visual: {
    themeName: 'Singularity Void Violet',
    primaryColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    panelBg: 'rgba(18, 6, 28, 0.88)',
    panelBorder: 'rgba(192, 132, 252, 0.40)',
    uniforms: {
      uColorEdge: 0x330066,
      uColorCore: 0x9933ff,
      uColorHot: 0xf5e6ff,
      uHaloColor: 0xa855f7
    },
    lights: {
      ambient: 0x1a0033,
      center: 0xa855f7
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
    "id": "plasma_torpedo",
    "name": "Plasma Torpedo",
    "icon": "💣",
    "color": "#f59e0b",
    "damage": 5,
    "bullet_speed": 450,
    "energy_drain_pct": 40,
    "can_overheat": 0,
    "cooldown_seconds": 0,
    "acquire_event": "singularity_core_probe",
    "description": "Heavy matter/antimatter explosive ordinance. Non-overheating heavy weapon."
  },
  "acquirable": []
},

  enemies: [
  {
    "id": "singularity_probe",
    "name": "Singularity Void Probe",
    "enemy_class": "Probe Sentinel",
    "model_3d_type": "singularity_probe",
    "model_3d_url": "",
    "scale": 1.25,
    "length": 4,
    "height": 4,
    "depth": 4,
    "circumference": 12.5,
    "icon": "👁️",
    "color": "#c084fc",
    "hits": 5,
    "armor": 35,
    "shield": 2,
    "speed": 290,
    "attack_damage": 12,
    "weapon_name": "Graviton Beam",
    "weapon_damage": 10,
    "weapon_speed": 520,
    "weapon_color": "#c084fc",
    "fire_rate": 2.4,
    "score": 450,
    "threat": "High",
    "piercing": "plasma_torpedo"
  },
  {
    "id": "void_cruiser",
    "name": "Void Battlecruiser",
    "enemy_class": "Heavy Cruiser",
    "model_3d_type": "cruiser",
    "model_3d_url": "",
    "scale": 1.35,
    "length": 4.2,
    "height": 3,
    "depth": 6.2,
    "circumference": 12.5,
    "icon": "🛸",
    "color": "#a855f7",
    "hits": 12,
    "armor": 60,
    "shield": 4,
    "speed": 140,
    "attack_damage": 28,
    "weapon_name": "Antimatter Torpedo",
    "weapon_damage": 20,
    "weapon_speed": 350,
    "weapon_color": "#a855f7",
    "fire_rate": 2.6,
    "score": 1000,
    "threat": "Extreme",
    "piercing": "plasma_torpedo"
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
  console.log(`[Stage 3: Singularity Core] Applying Mobile Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 3: SINGULARITY CORE [MOBILE]');
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
    engineApi.showToast('🚀 STAGE 3: SINGULARITY CORE [MOBILE] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
