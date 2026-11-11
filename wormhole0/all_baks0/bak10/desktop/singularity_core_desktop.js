/**
 * Wormhole XR - Stage 3: Singularity Core [Desktop Profile]
 * Extreme Gravitational Distortion Void with Deep Violet Spectrum
 * Database Stage Level: 3 | Environment: Singularity Void Violet
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 3,
  stage_name: 'Singularity Core',
  stage_slug: 'singularity_core',
  environment_theme: 'Singularity Void Violet',
  device: 'desktop',
  xr_mode: 'desktop-xr',
  events_within_level: 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening',
  end_level_event: 'Core Collapse Breakthrough',
  description: 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.',
  par_score: 25000,

  visual: {
    themeName: 'Singularity Void Violet',
    primaryColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    panelBg: 'rgba(18, 4, 30, 0.88)',
    panelBorder: 'rgba(168, 85, 247, 0.40)',
    uniforms: {
      uColorEdge: 0x330066,
      uColorCore: 0x9333ea,
      uColorHot: 0xf3e8ff,
      uHaloColor: 0xa855f7
    },
    lights: {
      ambient: 0x220044,
      center: 0xa855f7
    },
    particles: {
      count: 5500,
      starCount: 3000,
      dustCount: 800,
      speed: 1.45
    },
    flight: {
      speed: 70.0,
      boostMultiplier: 2.50,
      pitchSpeed: 0.0026,
      yawSpeed: 0.0026
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
      cooldown_seconds: 7.0
    },
    acquirable: [
      {
        id: 'plasma_torpedo',
        name: 'Quantum Plasma Torpedo',
        icon: '💥',
        color: '#06d6a0',
        damage: 5,
        bullet_speed: 450,
        energy_drain_pct: 40.0,
        can_overheat: 0,
        cooldown_seconds: 0.0,
        acquire_event: 'singularity_core_probe',
        description: 'Heavy matter/antimatter explosive ordinance. Non-overheating heavy weapon.'
      }
    ]
  },

  enemies: [
    {
      id: 'void_guardian',
      name: 'Singularity Void Guardian',
      enemy_class: 'Guardian Frigate',
      icon: '👾',
      color: '#a855f7',
      hits: 15,
      armor: 70,
      shield: 6,
      speed: 150,
      attack_damage: 35,
      fire_rate: 2.20,
      score: 1000,
      threat: 'High',
      piercing: 'plasma_torpedo'
    },
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
    }
  ],

  controls: {
    inputMode: 'keyboard_mouse',
    showVirtualJoysticks: false,
    enablePointerLock: true,
    requireLandscape: false,
    description: 'WASD flight thrust, Mouse aim, Space boost, Tab HUD toggle, Left-Click fire Plasma Torpedo'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 3: Singularity Core] Applying Desktop profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 3: SINGULARITY CORE [DESKTOP XR]');
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
    engineApi.showToast('🕳️ STAGE 3: SINGULARITY CORE [DESKTOP] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
