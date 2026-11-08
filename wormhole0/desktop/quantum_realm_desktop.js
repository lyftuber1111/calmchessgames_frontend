/**
 * Wormhole XR - Stage 4: Quantum Realm [Desktop Profile]
 * Calibrated for Desktop PC (6-DOF Flight, Keyboard/Mouse, Full Particle Density)
 * Database Stage Level: 4 | Environment: Quantum Phasor Magenta
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 4,
  stage_name: 'Quantum Realm',
  stage_slug: 'quantum_realm',
  environment_theme: 'Quantum Phasor Magenta',
  device: 'desktop',
  xr_mode: 'desktop-xr',
  events_within_level: 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation',
  end_level_event: 'Quantum Conduit Realignment & Safe Extraction',
  mission_objectives: 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.',
  required_enemy_kills: 25,
  warp_target_distance: 10000,
  objectives: [
  {
    "id": "kills",
    "type": "kills",
    "target": 25,
    "title": "Destroy 25 Dreadnoughts",
    "description": "Obliterate phased dreadnoughts in the multi-dimensional breach",
    "requiredForWarp": true
  },
  {
    "id": "distance",
    "type": "distance",
    "target": 10000,
    "title": "Quantum Conduit < 10,000 KM",
    "description": "Reach extraction rift within 10,000 KM",
    "requiredForWarp": true
  }
],
  description: 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.',
  par_score: 50000,

  visual: {
    themeName: 'Quantum Phasor Magenta',
    primaryColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    panelBg: 'rgba(26, 4, 12, 0.88)',
    panelBorder: 'rgba(244, 63, 94, 0.40)',
    uniforms: {
      uColorEdge: 0x660022,
      uColorCore: 0xff0055,
      uColorHot: 0xffd6e6,
      uHaloColor: 0xff0066
    },
    lights: {
      ambient: 0x330011,
      center: 0xff1166
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
    "id": "quantum_phaser",
    "name": "Quantum Phaser",
    "icon": "✨",
    "color": "#10b981",
    "damage": 4,
    "bullet_speed": 950,
    "energy_drain_pct": 15,
    "can_overheat": 1,
    "cooldown_seconds": 6,
    "acquire_event": "deep_core_breakthrough",
    "description": "Sub-atomic pulse rifle optimized for deep singularity warfare."
  },
  "acquirable": []
},

  enemies: [
  {
    "id": "quantum_dreadnought",
    "name": "Quantum Phased Dreadnought",
    "enemy_class": "Capital Dreadnought",
    "model_3d_type": "dreadnought",
    "model_3d_url": "",
    "scale": 1.6,
    "length": 7,
    "height": 3.2,
    "depth": 6,
    "circumference": 15,
    "icon": "🌌",
    "color": "#f43f5e",
    "hits": 35,
    "armor": 90,
    "shield": 15,
    "speed": 90,
    "attack_damage": 60,
    "weapon_name": "Quantum Annihilator",
    "weapon_damage": 60,
    "weapon_speed": 650,
    "weapon_color": "#ef476f",
    "fire_rate": 1.2,
    "score": 5000,
    "threat": "Extreme",
    "piercing": "quantum_phaser"
  },
  {
    "id": "phase_interceptor_mk4",
    "name": "Dimensional Phantom Interceptor",
    "enemy_class": "Stealth Interceptor",
    "model_3d_type": "interceptor",
    "model_3d_url": "",
    "scale": 1.05,
    "length": 4.4,
    "height": 1.4,
    "depth": 3.6,
    "circumference": 5.2,
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
    inputMode: 'keyboard_mouse',
    showVirtualJoysticks: false,
    enablePointerLock: true,
    requireLandscape: false,
    description: 'WASD flight thrust, Mouse aim, Space boost, Tab HUD toggle, Left-Click fire laser'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 4: Quantum Realm] Applying Desktop Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 4: QUANTUM REALM [DESKTOP]');
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
    engineApi.showToast('🚀 STAGE 4: QUANTUM REALM [DESKTOP] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
