/**
 * Wormhole XR - Stage 5: Final Boss Stage [Desktop Profile]
 * Calibrated for Desktop PC (6-DOF Flight, Keyboard/Mouse, Full Particle Density)
 * Database Stage Level: 5 | Environment: Warp Cyan Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 5,
  stage_name: 'Final Boss Stage',
  stage_slug: 'final_boss_stage',
  environment_theme: 'Warp Cyan Corridor',
  device: 'desktop',
  xr_mode: 'desktop-xr',
  events_within_level: 'Final Boss Appears',
  end_level_event: 'Boss Destroyed',
  mission_objectives: 'Destroy 10 enemies and pilot vessel to within < 50,000 KM of the singularity core before warp jump gate activates.',
  required_enemy_kills: 10,
  warp_target_distance: 50000,
  objectives: [
    {
        "id": "kills",
        "type": "kills",
        "target": 10,
        "current": 0,
        "title": "Destroy 10 Threats",
        "description": "Destroy 10 hostile 3D units emerging from the wormhole",
        "requiredForWarp": true
    },
    {
        "id": "distance",
        "type": "distance",
        "target": 50000,
        "title": "Wormhole Proximity < 50,000 KM",
        "description": "Navigate vessel to within < 50,000 KM of singularity core",
        "requiredForWarp": true
    }
],
  description: '',
  par_score: 5000,

  visual: {
    themeName: 'Warp Cyan Corridor',
    primaryColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    panelBg: 'rgba(2, 14, 26, 0.88)',
    panelBorder: 'rgba(0, 240, 255, 0.40)',
    uniforms: {
      uColorEdge: 0x003366,
      uColorCore: 0x00f0ff,
      uColorHot: 0xd6ffff,
      uHaloColor: 0x00f0ff
    },
    lights: {
      ambient: 0x002233,
      center: 0x00f0ff
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
        "id": "red_laser",
        "name": "Neon Red Laser",
        "icon": "🔴",
        "color": "#ff0033",
        "damage": 2,
        "bullet_speed": 550,
        "energy_drain_pct": 10,
        "can_overheat": 1,
        "cooldown_seconds": 5,
        "description": "Standard directed neon plasma pulse. Initial weapon for Stage 5."
    },
    "acquirable": []
},

  enemies: [
    {
        "id": "void_recon_drone",
        "name": "Void Recon Drone",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "scout_drone",
        "model_3d_url": "",
        "color": "#00f0ff",
        "hits": 2,
        "armor": 10,
        "shield": 0,
        "speed": 320,
        "attack_damage": 5,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 5,
        "weapon_speed": 450,
        "weapon_color": "#00f0ff",
        "fire_rate": 2.5,
        "score": 100,
        "threat": "Low",
        "piercing": "any"
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
  console.log(`[Stage 5: Final Boss Stage] Applying Desktop Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 5: FINAL BOSS STAGE [DESKTOP]');
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
    engineApi.showToast('🚀 STAGE 5: FINAL BOSS STAGE [DESKTOP] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };