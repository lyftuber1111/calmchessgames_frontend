/**
 * Wormhole XR - Stage 6: Nebula Outpost [VR Headset Profile]
 * Calibrated for WebXR Immersive-VR (6-DOF Spatial Motion Controllers, Stereo Rendering)
 * Database Stage Level: 6 | Environment: Emerald Nebula Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 6,
  stage_name: 'Nebula Outpost',
  stage_slug: 'nebula_outpost',
  environment_theme: 'Emerald Nebula Corridor',
  device: 'vr',
  xr_mode: 'desktop-vr',
  events_within_level: 'Asteroid Storm, EMP Pulse Drones, Shield Recharge Waves',
  end_level_event: 'Ancient Cyber Dreadnought Gate Collapse',
  description: 'Dense emerald asteroid field guarding the outer sector perimeter.',
  par_score: 7500,

  visual: {
    themeName: 'Emerald Nebula Corridor',
    primaryColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    panelBg: 'rgba(2, 22, 14, 0.88)',
    panelBorder: 'rgba(16, 185, 129, 0.40)',
    uniforms: {
      uColorEdge: 0x004d26,
      uColorCore: 0x10b981,
      uColorHot: 0xd1fae5,
      uHaloColor: 0x10b981
    },
    lights: {
      ambient: 0x002613,
      center: 0x10b981
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
    initial: {
      id: 'red_laser',
      name: 'Neon Red Laser',
      icon: '🔴',
      color: '#ff0033',
      damage: 2,
      bullet_speed: 550,
      energy_drain_pct: 10.0,
      can_overheat: 1,
      cooldown_seconds: 5.0,
      description: 'Standard directed neon plasma pulse. Initial weapon for Stage 6.'
    },
    acquirable: []
  },

  enemies: [
    {
      id: 'void_recon_drone',
      name: 'Void Recon Drone',
      enemy_class: 'Scout Drone',
      icon: '🛸',
      color: '#00f0ff',
      hits: 2,
      armor: 10,
      shield: 0,
      speed: 320,
      attack_damage: 5,
      fire_rate: 2.50,
      score: 100,
      threat: 'Low',
      piercing: 'any'
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
  console.log(`[Stage 6: Nebula Outpost] Applying VR Headset Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 6: NEBULA OUTPOST [VR]');
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
    engineApi.showToast('🚀 STAGE 6: NEBULA OUTPOST [VR] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };