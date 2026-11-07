/**
 * Wormhole XR - Stage 2: Event Horizon [Mobile Profile]
 * Calibrated for Mobile Touch & Gyroscope with Relativistic Amber Plasma
 * Database Stage Level: 2 | Environment: Event Horizon Amber
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 2,
  stage_name: 'Event Horizon',
  stage_slug: 'event_horizon',
  environment_theme: 'Event Horizon Amber',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert',
  end_level_event: 'Singularity Perimeter Breach',
  description: 'High-velocity relativistic light-horizon boundary with intense magnetic shear.',
  par_score: 12000,

  
  mission_objectives: 'Neutralize 15 advanced interceptors and breach within < 35,000 KM of event horizon boundary.',
  required_enemy_kills: 15,
  warp_target_distance: 35000,
  objectives: [
      {
          "id": "kills",
          "type": "kills",
          "target": 15,
          "title": "Neutralize 15 Interceptors",
          "description": "Eliminate 15 enemy interceptors in the amber corridor",
          "requiredForWarp": true
      },
      {
          "id": "distance",
          "type": "distance",
          "target": 35000,
          "title": "Breach Distance < 35,000 KM",
          "description": "Pilot vessel past the 35,000 KM relativistic shear zone",
          "requiredForWarp": true
      }
  ],
visual: {
    themeName: 'Event Horizon Amber',
    primaryColor: '#ffd166',
    glowColor: 'rgba(255, 209, 102, 0.45)',
    panelBg: 'rgba(24, 14, 2, 0.90)',
    panelBorder: 'rgba(255, 209, 102, 0.35)',
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
      count: 2200,
      starCount: 1200,
      dustCount: 300,
      speed: 1.15
    },
    flight: {
      speed: 52.0,
      boostMultiplier: 2.2,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
    initial: {
      id: 'tachyon_lance',
      name: 'Tachyon Lance',
      icon: '⚡',
      color: '#ffd166',
      damage: 3,
      bullet_speed: 850,
      energy_drain_pct: 20.0,
      can_overheat: 1,
      cooldown_seconds: 7.0,
      description: 'Piercing tachyon singularity lance. Initial weapon for Stage 2.'
    },
    acquirable: [
      {
        id: 'red_laser',
        name: 'Neon Red Laser',
        icon: '🔴',
        color: '#ff0033',
        damage: 2,
        bullet_speed: 550,
        energy_drain_pct: 10.0,
        can_overheat: 1,
        cooldown_seconds: 5.0,
        acquire_event: 'default_start'
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
          "icon": "🚀",
          "color": "#f59e0b",
          "hits": 5,
          "armor": 30,
          "shield": 2,
          "speed": 440,
          "attack_damage": 12,
          "weapon_name": "Amber Pulse Laser",
          "weapon_damage": 10,
          "weapon_speed": 560,
          "weapon_color": "#f59e0b",
          "fire_rate": 1.7,
          "score": 300,
          "threat": "Medium",
          "piercing": "tachyon_lance"
      }
  ],

  controls: {
    inputMode: 'touch_dual_stick',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: true,
    description: 'Left thumb: flight thrusters & cruise throttle. Right thumb: tachyon lance crosshair aim & tap to fire.'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 2: Event Horizon] Applying Mobile profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON [MOBILE TOUCH]');
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
    engineApi.showToast('🌌 STAGE 2: EVENT HORIZON [MOBILE] LOADED');
  }

  // Restore 180 and 360 turn thruster audio for Stage 2
  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
