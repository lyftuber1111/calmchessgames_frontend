/**
 * Wormhole XR - Stage 4: Quantum Realm [Mobile Profile]
 * Calibrated for Mobile Touch & Gyroscope in Deep Quantum Hyperspace Magenta
 * Database Stage Level: 4 | Environment: Quantum Phasor Magenta
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 4,
  stage_name: 'Quantum Realm',
  stage_slug: 'quantum_realm',
  environment_theme: 'Quantum Phasor Magenta',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation',
  end_level_event: 'Quantum Conduit Realignment & Safe Extraction',
  description: 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.',
  par_score: 50000,

  
  mission_objectives: 'Decimate 25 quantum dreadnoughts and stabilize within < 10,000 KM of quantum extraction portal.',
  required_enemy_kills: 25,
  warp_target_distance: 10000,
  objectives: [
      {
          "id": "kills",
          "type": "kills",
          "target": 25,
          "title": "Decimate 25 Quantum Dreadnoughts",
          "description": "Annihilate 25 dimensional dreadnoughts",
          "requiredForWarp": true
      },
      {
          "id": "distance",
          "type": "distance",
          "target": 10000,
          "title": "Extraction Singularity < 10,000 KM",
          "description": "Reach the quantum extraction gateway coordinates",
          "requiredForWarp": true
      }
  ],
visual: {
    themeName: 'Quantum Phasor Magenta',
    primaryColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    panelBg: 'rgba(28, 4, 20, 0.90)',
    panelBorder: 'rgba(236, 72, 153, 0.35)',
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
      count: 2200,
      starCount: 1200,
      dustCount: 300,
      speed: 1.75
    },
    flight: {
      speed: 72.0,
      boostMultiplier: 2.45,
      pitchSpeed: 0.0026,
      yawSpeed: 0.0026
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
          "id": "quantum_dreadnought",
          "name": "Quantum Phased Dreadnought",
          "enemy_class": "Capital Dreadnought",
          "model_3d_type": "dreadnought",
          "model_3d_url": "",
          "icon": "🌌",
          "color": "#f43f5e",
          "hits": 16,
          "armor": 75,
          "shield": 8,
          "speed": 260,
          "attack_damage": 35,
          "weapon_name": "Quantum Disruption Cannon",
          "weapon_damage": 22,
          "weapon_speed": 700,
          "weapon_color": "#f43f5e",
          "fire_rate": 2.4,
          "score": 1200,
          "threat": "Boss",
          "piercing": "quantum_phaser"
      },
      {
          "id": "phase_interceptor_mk4",
          "name": "Dimensional Phantom Interceptor",
          "enemy_class": "Stealth Interceptor",
          "model_3d_type": "interceptor",
          "model_3d_url": "",
          "icon": "🚀",
          "color": "#fb7185",
          "hits": 8,
          "armor": 45,
          "shield": 4,
          "speed": 480,
          "attack_damage": 18,
          "weapon_name": "Phasic Burst Array",
          "weapon_damage": 15,
          "weapon_speed": 680,
          "weapon_color": "#fb7185",
          "fire_rate": 1.5,
          "score": 600,
          "threat": "High",
          "piercing": "quantum_phaser"
      }
  ],

  controls: {
    inputMode: 'touch_dual_stick',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: true,
    description: 'Left thumb: flight thrusters & quantum slipstream navigation. Right thumb: quantum phaser rapid pulse.'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 4: Quantum Realm] Applying Mobile profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 4: QUANTUM REALM [MOBILE TOUCH]');
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
    engineApi.showToast('⚛️ STAGE 4: QUANTUM REALM [MOBILE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
