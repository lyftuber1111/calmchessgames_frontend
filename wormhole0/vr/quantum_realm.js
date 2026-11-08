/**
 * Wormhole XR - Stage 4: Quantum Realm [VR Headset Profile]
 * Calibrated for WebXR Immersive-VR (6-DOF Spatial Motion Controllers, Stereo Rendering)
 * Database Stage Level: 4 | Environment: Quantum Phasor Magenta
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 4,
  stage_name: 'Quantum Realm',
  stage_slug: 'quantum_realm',
  environment_theme: 'Quantum Phasor Magenta',
  device: 'vr',
  xr_mode: 'desktop-vr',
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
    "scale": 1.8,
    "length": 8,
    "height": 3.8,
    "depth": 7,
    "circumference": 17,
    "icon": "🌌",
    "color": "#f43f5e",
    "hits": 32,
    "armor": 90,
    "shield": 12,
    "speed": 85,
    "attack_damage": 55,
    "weapon_name": "Quantum Annihilator",
    "weapon_damage": 55,
    "weapon_speed": 600,
    "weapon_color": "#ef476f",
    "fire_rate": 1.3,
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
    "scale": 1.2,
    "length": 4.8,
    "height": 1.6,
    "depth": 4,
    "circumference": 5.8,
    "icon": "🚀",
    "color": "#fb7185",
    "hits": 7,
    "armor": 40,
    "shield": 3,
    "speed": 420,
    "attack_damage": 16,
    "weapon_name": "Phasic Burst Array",
    "weapon_damage": 14,
    "weapon_speed": 620,
    "weapon_color": "#fb7185",
    "fire_rate": 1.6,
    "score": 600,
    "threat": "High",
    "piercing": "quantum_phaser"
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
  console.log(`[Stage 4: Quantum Realm] Applying VR Headset Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 4: QUANTUM REALM [VR]');
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
    engineApi.showToast('🚀 STAGE 4: QUANTUM REALM [VR] LOADED');
  }

  if (typeof engineApi.setSpinAudioEnabled === 'function') {
    engineApi.setSpinAudioEnabled(true);
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
