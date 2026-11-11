/**
 * Wormhole XR - Stage 3: Singularity Core [Desktop Profile]
 * Calibrated for Desktop PC (6-DOF Flight, Keyboard/Mouse, Full Particle Density)
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
  mission_objectives: 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.',
  required_enemy_kills: 20,
  warp_target_distance: 20000,
  objectives: [
    {
        "id": "kills",
        "type": "kills",
        "target": 20,
        "current": 0,
        "title": "Destroy 20 Threats",
        "description": "Destroy 20 hostile 3D units emerging from the wormhole",
        "requiredForWarp": true
    },
    {
        "id": "distance",
        "type": "distance",
        "target": 20000,
        "title": "Wormhole Proximity < 20,000 KM",
        "description": "Navigate vessel to within < 20,000 KM of singularity core",
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
        "description": "Heavy magnetic payload causing massive kinetic shockwave without overheating."
    },
    "acquirable": []
},

  enemies: [
    {
        "id": "void_guardian",
        "device_type": "all",
        "name": "Singularity Void Guardian (Universal)",
        "enemy_class": "Guardian Frigate",
        "icon": "👾",
        "model_3d_type": "singularity_probe",
        "model_3d_url": "",
        "scale": 1.2,
        "length": 3.8,
        "height": 3.8,
        "depth": 3.8,
        "circumference": 11.94,
        "color": "#a855f7",
        "hits": 15,
        "armor": 70,
        "shield": 6,
        "speed": 150,
        "attack_damage": 35,
        "weapon_name": "Void Disruptor",
        "weapon_damage": 35,
        "weapon_speed": 400,
        "weapon_color": "#a855f7",
        "fire_rate": 2.2,
        "score": 1000,
        "threat": "High",
        "piercing": "plasma_torpedo",
        "quick_effect_primary": "gravitational_vortex",
        "quick_effect_secondary": "arc_lightning",
        "quick_effect_color": "#a855f7",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_quantum_implosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 80,
        "destruction_particle_color": "#a855f7",
        "destruction_particle_scale": 1
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
  console.log(`[Stage 3: Singularity Core] Applying Desktop Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 3: SINGULARITY CORE [DESKTOP]');
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
    engineApi.showToast('🚀 STAGE 3: SINGULARITY CORE [DESKTOP] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };