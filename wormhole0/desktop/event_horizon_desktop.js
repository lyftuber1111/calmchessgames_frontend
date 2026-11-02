/**
 * Wormhole XR - Stage 2: Event Horizon [Desktop Profile]
 * Relativistic Light-Horizon Boundary with Amber Color Palette
 * Database Stage Level: 2 | Environment: Event Horizon Amber
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
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
      speed: 1.15
    },
    flight: {
      speed: 58.0,
      boostMultiplier: 2.35,
      pitchSpeed: 0.0024,
      yawSpeed: 0.0024
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
      id: 'tachyon_cruiser',
      name: 'Horizon Tachyon Cruiser',
      enemy_class: 'Heavy Cruiser',
      icon: '🛰️',
      color: '#ffd166',
      hits: 8,
      armor: 50,
      shield: 4,
      speed: 200,
      attack_damage: 20,
      fire_rate: 3.00,
      score: 500,
      threat: 'High',
      piercing: 'tachyon_lance'
    },
    {
      id: 'phase_interceptor',
      name: 'Phase Interceptor',
      enemy_class: 'Fast Interceptor',
      icon: '🚀',
      color: '#38bdf8',
      hits: 4,
      armor: 25,
      shield: 2,
      speed: 420,
      attack_damage: 10,
      fire_rate: 1.80,
      score: 250,
      threat: 'Medium',
      piercing: 'red_laser'
    }
  ],

  controls: {
    inputMode: 'keyboard_mouse',
    showVirtualJoysticks: false,
    enablePointerLock: true,
    requireLandscape: false,
    description: 'WASD flight thrust, Mouse aim, Space boost, Tab HUD toggle, Left-Click fire Tachyon Lance'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 2: Event Horizon] Applying Desktop profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 2: EVENT HORIZON [DESKTOP XR]');
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
  if (typeof engineApi.setDeviceControls === 'function') {
    engineApi.setDeviceControls(stageConfig.controls);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🌌 STAGE 2: EVENT HORIZON [DESKTOP] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
