/**
 * Wormhole XR - Stage 3: Singularity Core [ARCore Profile]
 * Calibrated for WebXR Immersive-AR in Singularity Void Violet Passthrough
 * Database Stage Level: 3 | Environment: Singularity Void Violet
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 3,
  stage_name: 'Singularity Core',
  stage_slug: 'singularity_core',
  environment_theme: 'Singularity Void Violet',
  device: 'arcore',
  xr_mode: 'mobile-ar',
  events_within_level: 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening',
  end_level_event: 'Core Collapse Breakthrough',
  description: 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.',
  par_score: 25000,

  
  mission_objectives: 'Eliminate 20 heavy void cruisers and penetrate within < 20,000 KM of gravitational core.',
  required_enemy_kills: 20,
  warp_target_distance: 20000,
  objectives: [
      {
          "id": "kills",
          "type": "kills",
          "target": 20,
          "title": "Eliminate 20 Void Cruisers",
          "description": "Destroy 20 heavily armored singularity combatants",
          "requiredForWarp": true
      },
      {
          "id": "distance",
          "type": "distance",
          "target": 20000,
          "title": "Gravitational Core Proximity < 20,000 KM",
          "description": "Penetrate deep gravity well to within < 20,000 KM",
          "requiredForWarp": true
      }
  ],
visual: {
    themeName: 'Singularity Void Violet (AR Passthrough)',
    primaryColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    panelBg: 'rgba(18, 4, 30, 0.75)',
    panelBorder: 'rgba(168, 85, 247, 0.50)',
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
      count: 1800,
      starCount: 600,
      dustCount: 200,
      speed: 1.40
    },
    flight: {
      speed: 46.0,
      boostMultiplier: 2.0,
      pitchSpeed: 0.0024,
      yawSpeed: 0.0024
    },
    arPassthrough: {
      transparentBackground: true,
      surfaceTracking: true,
      highContrastGlow: true
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
          "id": "singularity_probe",
          "name": "Singularity Void Probe",
          "enemy_class": "Probe Sentinel",
          "model_3d_type": "singularity_probe",
          "model_3d_url": "",
          "icon": "👁️",
          "color": "#c084fc",
          "hits": 6,
          "armor": 40,
          "shield": 3,
          "speed": 380,
          "attack_damage": 15,
          "weapon_name": "Graviton Beam",
          "weapon_damage": 12,
          "weapon_speed": 620,
          "weapon_color": "#c084fc",
          "fire_rate": 2,
          "score": 450,
          "threat": "High",
          "piercing": "plasma_torpedo"
      },
      {
          "id": "void_cruiser",
          "name": "Void Battlecruiser",
          "enemy_class": "Heavy Cruiser",
          "model_3d_type": "cruiser",
          "model_3d_url": "",
          "icon": "🛸",
          "color": "#a855f7",
          "hits": 12,
          "armor": 65,
          "shield": 6,
          "speed": 220,
          "attack_damage": 25,
          "weapon_name": "Antimatter Torpedo",
          "weapon_damage": 18,
          "weapon_speed": 640,
          "weapon_color": "#a855f7",
          "fire_rate": 2.8,
          "score": 750,
          "threat": "Extreme",
          "piercing": "plasma_torpedo"
      }
  ],

  controls: {
    inputMode: 'arcore_camera_touch',
    showVirtualJoysticks: false,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'ARCore Passthrough: Move camera in space. Tap screen to launch Plasma Torpedo'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 3: Singularity Core] Applying ARCore profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 3: SINGULARITY CORE [MOBILE AR]');
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
    engineApi.showToast('🕳️ STAGE 3: SINGULARITY CORE [ARCORE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };
