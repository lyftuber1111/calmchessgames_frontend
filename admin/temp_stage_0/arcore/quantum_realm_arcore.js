/**
 * Wormhole XR - Stage 4: Quantum Realm [ARCore Profile]
 * Calibrated for WebXR Immersive-AR in Quantum Realm Magenta Passthrough
 * Database Stage Level: 4 | Environment: Quantum Phasor Magenta
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 4,
  stage_name: 'Quantum Realm',
  stage_slug: 'quantum_realm',
  environment_theme: 'Quantum Phasor Magenta',
  device: 'arcore',
  xr_mode: 'mobile-ar',
  events_within_level: 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation',
  end_level_event: 'Quantum Conduit Realignment & Safe Extraction',
  description: 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.',
  par_score: 50000,

  visual: {
    themeName: 'Quantum Phasor Magenta (AR Passthrough)',
    primaryColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    panelBg: 'rgba(28, 4, 20, 0.75)',
    panelBorder: 'rgba(236, 72, 153, 0.50)',
    uniforms: {
      uColorEdge: 0x4a044e,
      uColorCore: 0xf43f5e,
      uColorHot: 0xffe4e6,
      uHaloColor: 0xf43f5e
    },
    lights: {
      ambient: 0x3b0724,
      center: 0xf43f5e
    },
    particles: {
      count: 1800,
      starCount: 600,
      dustCount: 200,
      speed: 1.80
    },
    flight: {
      speed: 55.0,
      boostMultiplier: 2.15,
      pitchSpeed: 0.0026,
      yawSpeed: 0.0026
    },
    arPassthrough: {
      transparentBackground: true,
      surfaceTracking: true,
      highContrastGlow: true
    }
  },

  weapons: {
    initial: {
      id: 'quantum_phaser',
      name: 'Quantum Phaser Cannon',
      icon: '🌟',
      color: '#a855f7',
      damage: 4,
      bullet_speed: 950,
      energy_drain_pct: 15.0,
      can_overheat: 1,
      cooldown_seconds: 6.0,
      description: 'Multi-phase singularity beam emitter. Initial weapon for Stage 4 deep core navigation.'
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
        acquire_event: 'singularity_core_probe'
      }
    ]
  },

  enemies: [
    {
      id: 'quantum_dreadnought',
      name: 'Quantum Omega Dreadnought',
      enemy_class: 'Boss Dreadnought',
      icon: '💀',
      color: '#ef476f',
      hits: 35,
      armor: 90,
      shield: 15,
      speed: 85,
      attack_damage: 60,
      fire_rate: 1.20,
      score: 5000,
      threat: 'Extreme',
      piercing: 'quantum_phaser'
    },
    {
      id: 'void_guardian',
      name: 'Singularity Void Guardian',
      enemy_class: 'Guardian Frigate',
      icon: '👾',
      color: '#a855f7',
      hits: 15,
      armor: 70,
      shield: 6,
      speed: 130,
      attack_damage: 35,
      fire_rate: 2.20,
      score: 1000,
      threat: 'High',
      piercing: 'plasma_torpedo'
    }
  ],

  controls: {
    inputMode: 'arcore_camera_touch',
    showVirtualJoysticks: false,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'ARCore Passthrough: Move camera in space. Tap screen to fire Quantum Phaser beam'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 4: Quantum Realm] Applying ARCore profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 4: QUANTUM REALM [MOBILE AR]');
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
    engineApi.showToast('⚛️ STAGE 4: QUANTUM REALM [ARCORE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
