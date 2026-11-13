/**
 * Wormhole XR - Stage 1: Warp Origin [Mobile Profile]
 * Calibrated for Mobile Smartphones & Tablets (Dual Touch Joysticks, Gyroscope, Mobile Shaders)
 * Database Stage Level: 1 | Environment: Warp Cyan Corridor
 * Calm Chess Games / Brian Berry (C) 2026. All Rights Reserved.
 */

export const stageConfig = {
  stage_level: 1,
  stage_name: 'Warp Origin',
  stage_slug: 'warp_origin',
  environment_theme: 'Warp Cyan Corridor',
  device: 'mobile',
  xr_mode: 'mobile-xr',
  events_within_level: 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert',
  end_level_event: 'Warp Horizon Jump Gate Initialized',
  mission_objectives: 'Destroy 10 Void Recon Drones and pilot vessel to within < 50,000 KM of singularity core to unlock warp.',
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
    },
    {
        "id": "scan",
        "type": "scan",
        "target": 1,
        "title": "Resonance Anomaly Scan",
        "description": "Scan singularity anomaly to map gravitational shear",
        "requiredForWarp": false
    },
    {
        "id": "coils",
        "type": "coils",
        "target": 3,
        "title": "Tachyon Warp Coils",
        "description": "Calibrate all 3 coils for hyperspace stability",
        "requiredForWarp": false
    }
],
  description: 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.',
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
      count: 2200,
      starCount: 1200,
      dustCount: 300,
      speed: 0.85
    },
    flight: {
      speed: 42,
      boostMultiplier: 2.2,
      pitchSpeed: 0.0022,
      yawSpeed: 0.0022
    }
  },

  weapons: {
    "initial": {
        "id": "red_laser",
        "name": "Red Laser",
        "icon": "🔴",
        "color": "#ff2244",
        "damage": 2,
        "bullet_speed": 550,
        "energy_drain_pct": 1,
        "can_overheat": 1,
        "cooldown_seconds": 5,
        "acquire_event": "default_start",
        "description": "Standard high-cadence plasma emitter with twin focus beams."
    },
    "acquirable": [
        {
            "id": "blue_laser",
            "name": "Blue Laser",
            "icon": "🔵",
            "color": "#00d4ff",
            "damage": 3,
            "bullet_speed": 700,
            "energy_drain_pct": 5,
            "can_overheat": 1,
            "cooldown_seconds": 10,
            "acquire_event": "default_start",
            "description": "High-impact coherent photon beam with deep penetration."
        }
    ]
},

  enemies: [
    {
        "id": "void_recon_drone_mobile",
        "device_type": "mobile",
        "name": "Void Recon Drone (Mobile)",
        "enemy_class": "Scout Drone",
        "icon": "🛸",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/warp_origin_images/recon_drone_2.8m.glb",
        "scale": 0.75,
        "length": 2.8,
        "height": 2.8,
        "depth": 2.8,
        "circumference": 8.8,
        "color": "#00f0ff",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Plasma Pulse",
        "weapon_damage": 1,
        "weapon_speed": 450,
        "weapon_color": "#00f0ff",
        "fire_rate": 2.5,
        "score": 100,
        "threat": "Low",
        "piercing": "any",
        "quick_effect_primary": "plasma_aura",
        "quick_effect_secondary": "sparks_burst",
        "quick_effect_color": "#00f0ff",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_sparks_explosion",
        "destruction_particle_url": "",
        "destruction_particle_count": 30,
        "destruction_particle_color": "#00f0ff",
        "destruction_particle_scale": 1
    },
    {
        "id": "phase_interceptor_all",
        "device_type": "mobile",
        "name": "Phase Interceptor (Universal)",
        "enemy_class": "Fast Interceptor",
        "icon": "🚀",
        "model_3d_type": "custom_glb",
        "model_3d_url": "mobile/warp_origin_images/drone_phase_interceptor_3.glb",
        "scale": 0.75,
        "length": 4.2,
        "height": 1.3,
        "depth": 3.4,
        "circumference": 5,
        "color": "#38bdf8",
        "hits": 1,
        "armor": 1,
        "shield": 0,
        "speed": 220,
        "attack_damage": 1,
        "weapon_name": "Dual Ion Cannon",
        "weapon_damage": 1,
        "weapon_speed": 550,
        "weapon_color": "#38bdf8",
        "fire_rate": 1.8,
        "score": 250,
        "threat": "Medium",
        "piercing": "red_laser",
        "quick_effect_primary": "engine_ion_thrust",
        "quick_effect_secondary": "plasma_aura",
        "quick_effect_color": "#38bdf8",
        "quick_effect_intensity": 1,
        "quick_effect_speed": 1,
        "destruction_particle_type": "procedural_plasma_shatter",
        "destruction_particle_url": "",
        "destruction_particle_count": 45,
        "destruction_particle_color": "#38bdf8",
        "destruction_particle_scale": 1
    }
],

  controls: {
    inputMode: 'touch_virtual_joysticks',
    showVirtualJoysticks: true,
    enablePointerLock: false,
    requireLandscape: false,
    description: 'Left virtual joystick for pitch/yaw, Right slider for thrust/throttle, On-screen fire button'
  }
};

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage 1: Warp Origin] Applying Mobile Profile configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE 1: WARP ORIGIN [MOBILE]');
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
    engineApi.showToast('🚀 STAGE 1: WARP ORIGIN [MOBILE] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage };