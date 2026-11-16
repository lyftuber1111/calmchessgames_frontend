<?php
/**
 * Wormhole XR - Stage & Object Pool File Provisioner
 * Synchronizes stage configuration, enemy 3D models (.glb/.gltf/.obj), scaling,
 * dimensions, multiple weapons, fire rates (seconds, ms, times/sec), and stage object pools
 * across Desktop, Mobile, VR, and ARCore device profiles.
 * Calm Chess Games (c) 2026. All Rights Reserved.
 */

if (!function_exists('sanitizeWormholeAssetUrl')) {
    function sanitizeWormholeAssetUrl(?string $url): string {
        if ($url === null) return '';
        $url = trim($url);
        if ($url === '') return '';
        $url = str_replace('\\', '/', $url);

        // Keep full URLs (http, https, //, data:) as-is
        if (preg_match('/^(https?:|\/\/|data:)/i', $url)) {
            return $url;
        }

        // Strip leading ./
        if (strpos($url, './') === 0) {
            $url = substr($url, 2);
        }

        // If starts with meshy_test_0/ without leading slash, add leading slash so it resolves from domain root
        if (strpos($url, 'meshy_test_0/') === 0) {
            return '/' . $url;
        }
        if (strpos($url, '/meshy_test_0/') === 0) {
            return $url;
        }

        // If starts with /wormhole0/, keep as-is
        if (strpos($url, '/wormhole0/') === 0) {
            return $url;
        }
        if (strpos($url, 'wormhole0/') === 0) {
            return '/' . $url;
        }
        if (strpos($url, '/') === 0) {
            return $url;
        }

        // Fix casing and missing _images suffix for stage directories
        $stageFolderMap = [
            'event_horizon'     => 'event_horizon_images',
            'warp_origin'       => 'warp_origin_images',
            'singularity_core'  => 'singularity_core_images',
            'quantum_realm'     => 'quantum_realm_images',
            'final_boss_stage'  => 'final_boss_stage_images',
            'nebula_outpost'    => 'nebula_outpost_images'
        ];

        $workingPath = $url;
        $isMobilePrefix = false;
        if (preg_match('/^mobile\//i', $workingPath)) {
            $isMobilePrefix = true;
            $workingPath = substr($workingPath, 7);
        }

        foreach ($stageFolderMap as $slug => $folderTarget) {
            if (preg_match('/^' . preg_quote($slug, '/') . '(_images)?(\/.*)?$/i', $workingPath, $m)) {
                $sub = $m[2] ?? '';
                return 'mobile/' . $folderTarget . $sub;
            }
        }

        // Bare filenames without directory (e.g. "red_recon_drone.glb" or "recon_drone.glb")
        if (preg_match('/^[a-zA-Z0-9_\-\.]+\.(glb|gltf|obj|png|jpg|jpeg|webp|svg)$/i', $workingPath)) {
            return 'mobile/event_horizon_images/' . $workingPath;
        }

        if ($isMobilePrefix) {
            return 'mobile/' . $workingPath;
        }

        return $url;
    }
}

if (!function_exists('toPascalCaseSlug')) {
    function toPascalCaseSlug(string $slug): string {
        $parts = explode('_', strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $slug)));
        $pascal = '';
        foreach ($parts as $p) {
            $pascal .= ucfirst($p);
        }
        return $pascal ?: 'Stage';
    }
}

if (!function_exists('provisionWormholeStageFilesAndAudio')) {
    /**
     * Provisions stage files, enemy graphics definitions, and object pools for a stage level.
     */
    function provisionWormholeStageFilesAndAudio(
        $stageLevel,
        $stageName,
        $theme,
        $eventsWithin,
        $endLevelEvent,
        $description,
        $parScore,
        $missionObjectives = '',
        $requiredEnemyKills = 10,
        $warpTargetDistance = 50000
    ) {
        $stageSlug = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '_', trim($stageName))));
        if (empty($stageSlug)) {
            $stageSlug = 'stage_' . intval($stageLevel);
        }
        $pascalSlug = toPascalCaseSlug($stageSlug);
        $stageLevel = intval($stageLevel);
        $requiredEnemyKills = max(0, intval($requiredEnemyKills));
        $warpTargetDistance = max(1000, intval($warpTargetDistance));
        if (empty($missionObjectives)) {
            $missionObjectives = "Destroy {$requiredEnemyKills} enemies and pilot vessel to within < " . number_format($warpTargetDistance) . " KM of the singularity core before warp jump gate activates.";
        }

        $candidateBases = [
            'C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend/wormhole0',
            'C:/Users/lyftu/gemini_3/send_with_git_php_0/calmchessgames_backend_php/wormhole0',
            dirname(dirname(dirname(__DIR__))) . '/updated_html_js_0/calmchessgames_frontend/wormhole0',
            dirname(dirname(dirname(__DIR__))) . '/send_with_git_php_0/calmchessgames_backend_php/wormhole0',
            dirname(dirname(__DIR__)) . '/updated_html_js_0/calmchessgames_frontend/wormhole0',
            dirname(dirname(__DIR__)) . '/send_with_git_php_0/calmchessgames_backend_php/wormhole0',
            dirname(__DIR__) . '/../updated_html_js_0/calmchessgames_frontend/wormhole0',
            dirname(__DIR__) . '/../send_with_git_php_0/calmchessgames_backend_php/wormhole0',
            dirname(__DIR__) . '/wormhole0',
            '/var/www/calmchessgames_frontend/wormhole0',
            '/var/www/calmchessgames_front_end/wormhole0',
            '/var/www/calmchessgames/wormhole0',
            (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] ? $_SERVER['DOCUMENT_ROOT'] . '/wormhole0' : ''),
            '/var/www/html/wormhole0',
            __DIR__ . '/temp_stage_0'
        ];

        $validWormholeDirs = [];
        foreach ($candidateBases as $cand) {
            if (!$cand) continue;
            if (!is_dir($cand)) {
                @mkdir($cand, 0777, true);
                @chmod($cand, 0777);
            }
            if (is_dir($cand)) {
                $real = realpath($cand);
                $pathToAdd = $real ? $real : $cand;
                if (!in_array($pathToAdd, $validWormholeDirs, true)) {
                    $validWormholeDirs[] = $pathToAdd;
                }
            }
        }

        $createdFiles = [];
        $audioFolders = [];
        $imageFolders = [];

        $initialWeapon = null;
        $acquirableWeapons = [];
        $enemiesList = [];

        try {
            $pdo = getDbConnection();

            // 1. Fetch weapons for stage
            $dbWeaponsStmt = $pdo->prepare("SELECT * FROM `wormhole_game_weapons` WHERE `stage_level` = :stage ORDER BY `is_initial_weapon` DESC, `damage_per_hit` DESC, `id` ASC");
            $dbWeaponsStmt->execute(['stage' => $stageLevel]);
            $dbWeapons = $dbWeaponsStmt->fetchAll(PDO::FETCH_ASSOC);

            // If empty weapons for this stage, seed default initial weapon
            if (empty($dbWeapons)) {
                try {
                    $isBoss = ($stageLevel === 5 || stripos($stageName, 'boss') !== false);
                    $defaultWpnId = $isBoss ? 'quantum_disruptor' : "stage_{$stageLevel}_laser";
                    $defaultWpnName = $isBoss ? 'Quantum Disruptor' : "Stage {$stageLevel} Laser";
                    $defaultColor = $isBoss ? '#ff00aa' : '#00f0ff';
                    $defaultDmg = $isBoss ? 5 : 2;
                    $defaultSpd = $isBoss ? 1050 : 600;
                    $defaultDrain = $isBoss ? 18.00 : 10.00;
                    $defaultCool = $isBoss ? 5.50 : 5.00;
                    $defaultDesc = $isBoss ? 'Heavy antimatter pulse array piercing dark matter shields.' : "Standard directed plasma emitter for Stage {$stageLevel}.";

                    $pdo->exec("INSERT INTO `wormhole_game_weapons` (`weapon_id`, `weapon_name`, `description`, `icon`, `color_hex`, `stage_level`, `is_initial_weapon`, `is_acquirable`, `acquire_event`, `energy_drain_pct`, `can_overheat`, `cooldown_seconds`, `damage_per_hit`, `bullet_speed`) VALUES ('{$defaultWpnId}', '{$defaultWpnName}', '{$defaultDesc}', '⚡', '{$defaultColor}', {$stageLevel}, 1, 1, 'default_start', {$defaultDrain}, 1, {$defaultCool}, {$defaultDmg}, {$defaultSpd}) ON DUPLICATE KEY UPDATE `stage_level` = VALUES(`stage_level`)");

                    $dbWeaponsStmt->execute(['stage' => $stageLevel]);
                    $dbWeapons = $dbWeaponsStmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Throwable $eSeedWpn) {
                    error_log("Seed stage {$stageLevel} weapon error: " . $eSeedWpn->getMessage());
                }
            }

            foreach ($dbWeapons as $dw) {
                $wScale = isset($dw['scale']) ? floatval($dw['scale']) : 1.0;
                $wScaleX = isset($dw['scale_x']) ? floatval($dw['scale_x']) : 1.0;
                $wScaleY = isset($dw['scale_y']) ? floatval($dw['scale_y']) : 1.0;
                $wScaleZ = isset($dw['scale_z']) ? floatval($dw['scale_z']) : 1.0;
                $wSizeX = isset($dw['size_x']) ? floatval($dw['size_x']) : 1.0;
                $wSizeY = isset($dw['size_y']) ? floatval($dw['size_y']) : 1.0;
                $wSizeZ = isset($dw['size_z']) ? floatval($dw['size_z']) : 1.0;

                $wObj = [
                    'id' => $dw['weapon_id'],
                    'name' => $dw['weapon_name'],
                    'icon' => $dw['icon'],
                    'color' => $dw['color_hex'],
                    'damage' => intval($dw['damage_per_hit']),
                    'bullet_speed' => intval($dw['bullet_speed']),
                    'energy_drain_pct' => floatval($dw['energy_drain_pct']),
                    'can_overheat' => intval($dw['can_overheat']),
                    'cooldown_seconds' => floatval($dw['cooldown_seconds']),
                    'acquire_event' => $dw['acquire_event'] ?? 'default_start',
                    'description' => $dw['description'] ?? '',
                    'scale' => $wScale,
                    'scale_x' => $wScaleX,
                    'scale_y' => $wScaleY,
                    'scale_z' => $wScaleZ,
                    'size_x' => $wSizeX,
                    'size_y' => $wSizeY,
                    'size_z' => $wSizeZ,
                    'dimensions' => [
                        'x' => $wSizeX,
                        'y' => $wSizeY,
                        'z' => $wSizeZ
                    ],
                    'special_fx' => $dw['special_fx'] ?? 'cockpit_cracks_red_edges',
                    'special_fx_file' => $dw['special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png',
                    'special_fx_type' => $dw['special_fx_type'] ?? 'overlay'
                ];
                if ($initialWeapon === null && (intval($dw['is_initial_weapon']) === 1 || empty($initialWeapon))) {
                    $initialWeapon = $wObj;
                } elseif (intval($dw['is_acquirable']) === 1) {
                    $acquirableWeapons[] = $wObj;
                }
            }

            // 2. Fetch enemies for stage
            $dbEnemiesStmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `stage_level` = :stage ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
            $dbEnemiesStmt->execute(['stage' => $stageLevel]);
            $dbEnemies = $dbEnemiesStmt->fetchAll(PDO::FETCH_ASSOC);

            // If no enemies configured in database for this stage, seed default threats
            if (empty($dbEnemies)) {
                try {
                    if ($stageLevel === 5 || stripos($stageName, 'boss') !== false) {
                        $pdo->exec("INSERT INTO `wormhole_game_enemies` (`enemy_id`, `device_type`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `weapons_json`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `destruction_particle_type`, `destruction_particle_count`, `destruction_particle_color`, `destruction_particle_scale`, `fire_rate_seconds`, `fire_rate_ms`, `score_value`, `threat_level`, `description`, `is_enabled`) VALUES 
                        ('final_boss_titan', 'all', 'Singularity Overlord Titan (Stage 5 Boss)', 'Boss Dreadnought', '💀', 'custom_glb', 'desktop/warp_origin_images/drone_phase_interceptor_3.glb', 2.20, 9.00, 4.80, 9.00, 25.00, '#ef4444', 5, 45, 'quantum_disruptor', 100, 1, 20, 85, 75, 'Overlord Annihilator', 75, 650, '#ef4444', '[{\"id\":\"ew_boss_beam\",\"name\":\"Overlord Annihilator\",\"type\":\"beam\",\"mount\":\"center\",\"model_url\":\"\",\"model_type\":\"\",\"fire_point_x\":0,\"fire_point_y\":-0.2,\"fire_point_z\":2.0,\"scale\":1.5,\"size_x\":1.5,\"size_y\":1.5,\"size_z\":2.0,\"fire_rate_times_per_sec\":0.833,\"fire_interval_ms\":1200,\"fire_rate_seconds\":1.2,\"damage\":75,\"speed\":650,\"color\":\"#ef4444\",\"is_enabled\":1},{\"id\":\"ew_boss_torpedo\",\"name\":\"Gravitational Torpedo\",\"type\":\"missile\",\"mount\":\"dual_wingtip\",\"model_url\":\"\",\"model_type\":\"\",\"fire_point_x\":2.5,\"fire_point_y\":0.0,\"fire_point_z\":1.0,\"scale\":1.2,\"size_x\":1.0,\"size_y\":1.0,\"size_z\":1.8,\"fire_rate_times_per_sec\":0.4,\"fire_interval_ms\":2500,\"fire_rate_seconds\":2.5,\"damage\":50,\"speed\":450,\"color\":\"#ff0055\",\"is_enabled\":1}]', 'gravitational_vortex', 'quantum_phase_glow', '#ef4444', 1.50, 1.20, 'procedural_quantum_implosion', 150, '#ef4444', 2.00, 1.20, 1200, 10000, 'Extreme', 'Colossal multi-phase titan armed with twin Gravitational Torpedo pods and a concentrated Overlord Annihilator beam.', 1),
                        ('boss_escort_fighter', 'all', 'Overlord Heavy Escort Fighter', 'Fast Interceptor', '🚀', 'custom_glb', 'desktop/warp_origin_images/recon_drone_2.8m.glb', 1.25, 4.20, 1.50, 3.50, 9.00, '#f87171', 5, 5, 'any', 25, 1, 5, 220, 15, 'Heavy Plasma Pulse', 15, 550, '#f87171', '[{\"id\":\"ew_escort_pulse\",\"name\":\"Heavy Plasma Pulse\",\"type\":\"beam\",\"mount\":\"center\",\"model_url\":\"\",\"model_type\":\"\",\"fire_point_x\":0,\"fire_point_y\":-0.15,\"fire_point_z\":1.5,\"scale\":1.0,\"size_x\":1.0,\"size_y\":1.0,\"size_z\":1.0,\"fire_rate_times_per_sec\":0.5,\"fire_interval_ms\":2000,\"fire_rate_seconds\":2.0,\"damage\":15,\"speed\":550,\"color\":\"#f87171\",\"is_enabled\":1}]', 'engine_ion_thrust', 'energy_shield_pulse', '#f87171', 1.00, 1.00, 'procedural_plasma_shatter', 50, '#f87171', 1.20, 2.00, 2000, 500, 'High', 'Escort fighter defending the titan flagship.', 1)
                        ON DUPLICATE KEY UPDATE `stage_level` = VALUES(`stage_level`)");
                    } else {
                        $defaultDroneId = "stage_{$stageLevel}_recon_drone";
                        $defaultInterceptorId = "stage_{$stageLevel}_interceptor";
                        $pdo->exec("INSERT INTO `wormhole_game_enemies` (`enemy_id`, `device_type`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `weapons_json`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `destruction_particle_type`, `destruction_particle_count`, `destruction_particle_color`, `destruction_particle_scale`, `fire_rate_seconds`, `fire_rate_ms`, `score_value`, `threat_level`, `description`, `is_enabled`) VALUES 
                        ('{$defaultDroneId}', 'all', 'Sector {$stageLevel} Recon Drone', 'Scout Drone', '🛸', 'custom_glb', 'desktop/warp_origin_images/recon_drone_2.8m.glb', 1.00, 2.80, 2.80, 2.80, 8.80, '#00f0ff', {$stageLevel}, 2, 'any', 10, 0, 0, 220, 5, 'Plasma Pulse', 5, 450, '#00f0ff', '[{\"id\":\"ew_pulse\",\"name\":\"Plasma Pulse\",\"type\":\"beam\",\"mount\":\"center\",\"model_url\":\"\",\"model_type\":\"\",\"fire_point_x\":0,\"fire_point_y\":-0.15,\"fire_point_z\":1.5,\"scale\":1.0,\"size_x\":0.5,\"size_y\":0.5,\"size_z\":1.0,\"fire_rate_times_per_sec\":0.5,\"fire_interval_ms\":2000,\"fire_rate_seconds\":2.0,\"damage\":5,\"speed\":450,\"color\":\"#00f0ff\",\"is_enabled\":1}]', 'plasma_aura', 'sparks_burst', '#00f0ff', 1.00, 1.00, 'procedural_sparks_explosion', 30, '#00f0ff', 1.00, 2.00, 2000, 150, 'Low', 'Autonomous scout probe scanning sector coordinates.', 1),
                        ('{$defaultInterceptorId}', 'all', 'Sector {$stageLevel} Interceptor', 'Fast Interceptor', '🚀', 'custom_glb', 'desktop/warp_origin_images/drone_phase_interceptor_3.glb', 1.10, 4.20, 1.30, 3.40, 5.00, '#38bdf8', {$stageLevel}, 4, 'any', 20, 0, 0, 250, 10, 'Dual Ion Cannon', 10, 550, '#38bdf8', '[{\"id\":\"ew_ion\",\"name\":\"Dual Ion Cannon\",\"type\":\"beam\",\"mount\":\"center\",\"model_url\":\"\",\"model_type\":\"\",\"fire_point_x\":0,\"fire_point_y\":-0.15,\"fire_point_z\":1.5,\"scale\":1.0,\"size_x\":1.0,\"size_y\":1.0,\"size_z\":1.0,\"fire_rate_times_per_sec\":0.4,\"fire_interval_ms\":2500,\"fire_rate_seconds\":2.5,\"damage\":10,\"speed\":550,\"color\":\"#38bdf8\",\"is_enabled\":1}]', 'engine_ion_thrust', 'plasma_aura', '#38bdf8', 1.00, 1.00, 'procedural_plasma_shatter', 45, '#38bdf8', 1.00, 2.50, 2500, 300, 'Medium', 'High-speed combat interceptor deployed in defensive swarms.', 1)
                        ON DUPLICATE KEY UPDATE `stage_level` = VALUES(`stage_level`)");
                    }

                    $dbEnemiesStmt->execute(['stage' => $stageLevel]);
                    $dbEnemies = $dbEnemiesStmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Throwable $eSeed) {
                    error_log("Seed stage {$stageLevel} default enemies error: " . $eSeed->getMessage());
                }
            }

            foreach ($dbEnemies as $de) {
                $frSec = floatval($de['fire_rate_seconds'] ?? 2.0);
                if ($frSec <= 0) $frSec = 2.0;
                $frMs = intval($de['fire_rate_ms'] ?? round($frSec * 1000));
                if ($frMs <= 0) $frMs = 2000;
                $frTimesPerSec = round(1000.0 / max(20, $frMs), 3);

                $wList = [];
                if (!empty($de['weapons_json'])) {
                    $dec = is_string($de['weapons_json']) ? json_decode($de['weapons_json'], true) : $de['weapons_json'];
                    if (is_array($dec) && count($dec) > 0) {
                        $wList = $dec;
                    }
                }
                if (empty($wList)) {
                    $wList = [
                        [
                            'id'                      => 'ew_' . ($de['enemy_id'] ?? 'primary'),
                            'name'                    => $de['weapon_name'] ?? 'Plasma Pulse',
                            'type'                    => (stripos($de['weapon_name'] ?? '', 'missile') !== false || stripos($de['weapon_name'] ?? '', 'torpedo') !== false) ? 'missile' : 'beam',
                            'mount'                   => 'dual_wingtip',
                            'model_url'               => '',
                            'model_type'              => '',
                            'fire_point_x'            => 0.0,
                            'fire_point_y'            => -0.15,
                            'fire_point_z'            => 1.5,
                            'scale'                   => 1.0,
                            'size_x'                  => 1.0,
                            'size_y'                  => 1.0,
                            'size_z'                  => 1.0,
                            'fire_rate_times_per_sec' => $frTimesPerSec,
                            'fire_interval_ms'        => $frMs,
                            'fire_rate_seconds'       => $frSec,
                            'damage'                  => intval($de['weapon_damage'] ?? $de['attack_damage'] ?? 5),
                            'speed'                   => intval($de['weapon_speed'] ?? 450),
                            'color'                   => $de['weapon_color'] ?? '#ff2255',
                            'is_enabled'              => 1
                        ]
                    ];
                } else {
                    $wList = array_map(function($w, $wIdx) use ($de, $frSec, $frMs, $frTimesPerSec) {
                        $wScale = isset($w['scale']) ? floatval($w['scale']) : 1.0;
                        $wScaleX = isset($w['scale_x']) ? floatval($w['scale_x']) : (isset($w['scaleX']) ? floatval($w['scaleX']) : 1.0);
                        $wScaleY = isset($w['scale_y']) ? floatval($w['scale_y']) : (isset($w['scaleY']) ? floatval($w['scaleY']) : 1.0);
                        $wScaleZ = isset($w['scale_z']) ? floatval($w['scale_z']) : (isset($w['scaleZ']) ? floatval($w['scaleZ']) : 1.0);
                        $wSizeX = isset($w['size_x']) ? floatval($w['size_x']) : (isset($w['sizeX']) ? floatval($w['sizeX']) : ((isset($w['dimensions']) && isset($w['dimensions']['x'])) ? floatval($w['dimensions']['x']) : 1.0));
                        $wSizeY = isset($w['size_y']) ? floatval($w['size_y']) : (isset($w['sizeY']) ? floatval($w['sizeY']) : ((isset($w['dimensions']) && isset($w['dimensions']['y'])) ? floatval($w['dimensions']['y']) : 1.0));
                        $wSizeZ = isset($w['size_z']) ? floatval($w['size_z']) : (isset($w['sizeZ']) ? floatval($w['sizeZ']) : ((isset($w['dimensions']) && isset($w['dimensions']['z'])) ? floatval($w['dimensions']['z']) : 1.0));

                        return [
                            'id'                      => $w['id'] ?? ('ew_' . ($de['enemy_id'] ?? 'w') . '_' . $wIdx),
                            'name'                    => $w['name'] ?? ($de['weapon_name'] ?? 'Plasma Pulse'),
                            'type'                    => $w['type'] ?? 'beam',
                            'mount'                   => $w['mount'] ?? 'dual_wingtip',
                            'model_url'               => $w['model_url'] ?? '',
                            'model_type'              => $w['model_type'] ?? '',
                            'fire_point_x'            => isset($w['fire_point_x']) ? floatval($w['fire_point_x']) : 0.0,
                            'fire_point_y'            => isset($w['fire_point_y']) ? floatval($w['fire_point_y']) : -0.15,
                            'fire_point_z'            => isset($w['fire_point_z']) ? floatval($w['fire_point_z']) : 1.5,
                            'scale'                   => $wScale,
                            'scale_x'                 => $wScaleX,
                            'scale_y'                 => $wScaleY,
                            'scale_z'                 => $wScaleZ,
                            'size_x'                  => $wSizeX,
                            'size_y'                  => $wSizeY,
                            'size_z'                  => $wSizeZ,
                            'dimensions'              => [
                                'x' => $wSizeX,
                                'y' => $wSizeY,
                                'z' => $wSizeZ
                            ],
                            'fire_rate_times_per_sec' => floatval($w['fire_rate_times_per_sec'] ?? $frTimesPerSec),
                            'fire_interval_ms'        => intval($w['fire_interval_ms'] ?? $frMs),
                            'fire_rate_seconds'       => floatval($w['fire_rate_seconds'] ?? $frSec),
                            'damage'                  => intval($w['damage'] ?? ($de['weapon_damage'] ?? 5)),
                            'speed'                   => intval($w['speed'] ?? ($de['weapon_speed'] ?? 450)),
                            'color'                   => $w['color'] ?? ($de['weapon_color'] ?? '#ff2255'),
                            'special_fx'              => $w['special_fx'] ?? ($de['weapon_special_fx'] ?? 'cockpit_cracks_red_edges'),
                            'special_fx_file'         => $w['special_fx_file'] ?? ($de['weapon_special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png'),
                            'special_fx_type'         => $w['special_fx_type'] ?? ($de['weapon_special_fx_type'] ?? 'overlay'),
                            'is_enabled'              => isset($w['is_enabled']) ? intval($w['is_enabled']) : 1
                        ];
                    }, $wList, array_keys($wList));
                }

                $isBossClass = (stripos($de['enemy_class'] ?? '', 'boss') !== false || intval($de['hits_to_destroy'] ?? 0) >= 25);
                $primaryW = !empty($wList[0]) ? $wList[0] : null;
                $pScale = $primaryW ? ($primaryW['scale'] ?? 1.0) : 1.0;
                $pScaleX = $primaryW ? ($primaryW['scale_x'] ?? 1.0) : 1.0;
                $pScaleY = $primaryW ? ($primaryW['scale_y'] ?? 1.0) : 1.0;
                $pScaleZ = $primaryW ? ($primaryW['scale_z'] ?? 1.0) : 1.0;
                $pSizeX = $primaryW ? ($primaryW['size_x'] ?? 1.0) : 1.0;
                $pSizeY = $primaryW ? ($primaryW['size_y'] ?? 1.0) : 1.0;
                $pSizeZ = $primaryW ? ($primaryW['size_z'] ?? 1.0) : 1.0;

                $enemiesList[] = [
                    'id'                        => $de['enemy_id'],
                    'enemy_id'                  => $de['enemy_id'],
                    'name'                      => $de['enemy_name'],
                    'enemy_class'               => $de['enemy_class'],
                    'icon'                      => $de['icon'],
                    'model_3d_type'             => $de['model_3d_type'] ?? 'scout_drone',
                    'model_3d_url'              => $de['model_3d_url'] ?? '',
                    'scale'                     => floatval($de['scale'] ?? 1.00),
                    'length'                    => floatval($de['length'] ?? 3.00),
                    'height'                    => floatval($de['height'] ?? 1.50),
                    'depth'                     => floatval($de['depth'] ?? 3.00),
                    'circumference'             => floatval($de['circumference'] ?? 6.00),
                    'color'                     => $de['color_hex'],
                    'hits'                      => intval($de['hits_to_destroy']),
                    'armor'                     => intval($de['armor_strength']),
                    'shield'                    => intval($de['shield_capacity_hits'] ?? 0),
                    'speed'                     => intval($de['movement_speed']),
                    'attack_damage'             => intval($de['attack_damage']),
                    'weapon_name'               => $de['weapon_name'] ?? 'Plasma Pulse',
                    'weapon_damage'             => intval($de['weapon_damage'] ?? $de['attack_damage'] ?? 5),
                    'weapon_speed'              => intval($de['weapon_speed'] ?? 450),
                    'weapon_color'              => $de['weapon_color'] ?? '#ff2255',
                    'weapon_scale'              => floatval($pScale),
                    'weapon_scale_x'            => floatval($pScaleX),
                    'weapon_scale_y'            => floatval($pScaleY),
                    'weapon_scale_z'            => floatval($pScaleZ),
                    'weapon_size_x'             => floatval($pSizeX),
                    'weapon_size_y'             => floatval($pSizeY),
                    'weapon_size_z'             => floatval($pSizeZ),
                    'weapon_dimensions'         => [
                        'x' => floatval($pSizeX),
                        'y' => floatval($pSizeY),
                        'z' => floatval($pSizeZ)
                    ],
                    'weapon_special_fx'         => $de['weapon_special_fx'] ?? ($primaryW['special_fx'] ?? 'cockpit_cracks_red_edges'),
                    'weapon_special_fx_file'    => $de['weapon_special_fx_file'] ?? ($primaryW['special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png'),
                    'weapon_special_fx_type'    => $de['weapon_special_fx_type'] ?? ($primaryW['special_fx_type'] ?? 'overlay'),
                    'fire_rate'                 => $frSec,
                    'fire_rate_seconds'         => $frSec,
                    'fire_rate_ms'              => $frMs,
                    'fire_rate_times_per_sec'   => $frTimesPerSec,
                    'weapons'                   => $wList,
                    'score'                     => intval($de['score_value']),
                    'threat'                    => $de['threat_level'],
                    'piercing'                  => $de['piercing_weapon_id'],
                    'pool_size'                 => $isBossClass ? 100 : 30,
                    'quick_effect_primary'      => $de['quick_effect_primary'] ?? 'none',
                    'quick_effect_secondary'    => $de['quick_effect_secondary'] ?? 'none',
                    'quick_effect_color'        => $de['quick_effect_color'] ?? '#00f0ff',
                    'quick_effect_intensity'    => floatval($de['quick_effect_intensity'] ?? 1.00),
                    'quick_effect_speed'        => floatval($de['quick_effect_speed'] ?? 1.00),
                    'destruction_particle_type' => $de['destruction_particle_type'] ?? 'procedural_sparks_explosion',
                    'destruction_particle_url'  => $de['destruction_particle_url'] ?? '',
                    'destruction_particle_count'=> intval($de['destruction_particle_count'] ?? 40),
                    'destruction_particle_color'=> $de['destruction_particle_color'] ?? ($de['color_hex'] ?? '#ff0055'),
                    'destruction_particle_scale'=> floatval($de['destruction_particle_scale'] ?? 1.00)
                ];
            }
        } catch (Throwable $e) {
            error_log("provisionWormholeStageFilesAndAudio db query error: " . $e->getMessage());
        }

        if ($initialWeapon === null) {
            $initialWeapon = [
                'id' => 'red_laser',
                'name' => 'Neon Red Laser',
                'icon' => '🔴',
                'color' => '#ff0033',
                'damage' => 2,
                'bullet_speed' => 550,
                'energy_drain_pct' => 10.0,
                'can_overheat' => 1,
                'cooldown_seconds' => 5.0,
                'description' => "Standard directed neon plasma pulse. Initial weapon for Stage {$stageLevel}."
            ];
        }

        if (empty($enemiesList)) {
            $enemiesList[] = [
                'id' => 'void_recon_drone',
                'enemy_id' => 'void_recon_drone',
                'name' => 'Void Recon Drone',
                'enemy_class' => 'Scout Drone',
                'icon' => '🛸',
                'model_3d_type' => 'custom_glb',
                'model_3d_url' => 'desktop/warp_origin_images/recon_drone_2.8m.glb',
                'scale' => 1.00,
                'length' => 2.80,
                'height' => 2.80,
                'depth' => 2.80,
                'circumference' => 8.80,
                'color' => '#00f0ff',
                'hits' => 2,
                'armor' => 10,
                'shield' => 0,
                'speed' => 220,
                'attack_damage' => 5,
                'weapon_name' => 'Plasma Pulse',
                'weapon_damage' => 5,
                'weapon_speed' => 450,
                'weapon_color' => '#00f0ff',
                'fire_rate' => 2.00,
                'fire_rate_seconds' => 2.00,
                'fire_rate_ms' => 2000,
                'fire_rate_times_per_sec' => 0.5,
                'weapons' => [
                    [
                        'id' => 'ew_pulse',
                        'name' => 'Plasma Pulse',
                        'type' => 'beam',
                        'mount' => 'center',
                        'fire_point_x' => 0.0,
                        'fire_point_y' => -0.15,
                        'fire_point_z' => 1.5,
                        'scale' => 1.0,
                        'size_x' => 0.5,
                        'size_y' => 0.5,
                        'size_z' => 1.0,
                        'fire_rate_times_per_sec' => 0.5,
                        'fire_interval_ms' => 2000,
                        'fire_rate_seconds' => 2.0,
                        'damage' => 5,
                        'speed' => 450,
                        'color' => '#00f0ff',
                        'is_enabled' => 1
                    ]
                ],
                'score' => 100,
                'threat' => 'Low',
                'piercing' => 'any',
                'pool_size' => 30
            ];
        }

        $weaponsJsonFormatted = json_encode([
            'initial' => $initialWeapon,
            'acquirable' => $acquirableWeapons
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $enemiesJsonFormatted = json_encode($enemiesList, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // Build Stage Objectives Array
        $stageObjectivesArray = [
            [
                'id' => 'kills',
                'type' => 'kills',
                'target' => $requiredEnemyKills,
                'current' => 0,
                'title' => "Destroy {$requiredEnemyKills} Threats",
                'description' => "Destroy {$requiredEnemyKills} hostile 3D units emerging from the wormhole",
                'requiredForWarp' => true
            ],
            [
                'id' => 'distance',
                'type' => 'distance',
                'target' => $warpTargetDistance,
                'title' => "Wormhole Proximity < " . number_format($warpTargetDistance) . " KM",
                'description' => "Navigate vessel to within < " . number_format($warpTargetDistance) . " KM of singularity core",
                'requiredForWarp' => true
            ]
        ];
        if ($stageLevel === 1) {
            $stageObjectivesArray[] = [
                'id' => 'scan',
                'type' => 'scan',
                'target' => 1.0,
                'title' => 'Resonance Anomaly Scan',
                'description' => 'Scan singularity anomaly to map gravitational shear',
                'requiredForWarp' => false
            ];
            $stageObjectivesArray[] = [
                'id' => 'coils',
                'type' => 'coils',
                'target' => 3,
                'title' => 'Tachyon Warp Coils',
                'description' => 'Calibrate all 3 coils for hyperspace stability',
                'requiredForWarp' => false
            ];
        }
        $objectivesJsonFormatted = json_encode($stageObjectivesArray, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // Device target profiles: mobile, desktop, arcore, and vr
        $deviceProfiles = [
            'desktop' => [
                'device' => 'desktop',
                'xr_mode' => 'desktop-xr',
                'title' => 'Desktop Profile',
                'desc' => 'Calibrated for Desktop PC (6-DOF Flight, Keyboard/Mouse, Full Particle Density)',
                'particles' => ['count' => 5500, 'starCount' => 3000, 'dustCount' => 800, 'speed' => 0.85],
                'flight' => ['speed' => 45.0, 'boostMultiplier' => 2.2, 'pitchSpeed' => 0.0022, 'yawSpeed' => 0.0022],
                'controls' => [
                    'inputMode' => 'keyboard_mouse',
                    'showVirtualJoysticks' => 'false',
                    'enablePointerLock' => 'true',
                    'description' => 'WASD flight thrust, Mouse aim, Space boost, Tab HUD toggle, Left-Click fire laser'
                ]
            ],
            'mobile' => [
                'device' => 'mobile',
                'xr_mode' => 'mobile-xr',
                'title' => 'Mobile Profile',
                'desc' => 'Calibrated for Mobile Smartphones & Tablets (Dual Touch Joysticks, Gyroscope, Mobile Shaders)',
                'particles' => ['count' => 2200, 'starCount' => 1200, 'dustCount' => 300, 'speed' => 0.85],
                'flight' => ['speed' => 42.0, 'boostMultiplier' => 2.2, 'pitchSpeed' => 0.0022, 'yawSpeed' => 0.0022],
                'controls' => [
                    'inputMode' => 'touch_virtual_joysticks',
                    'showVirtualJoysticks' => 'true',
                    'enablePointerLock' => 'false',
                    'description' => 'Left virtual joystick for pitch/yaw, Right slider for thrust/throttle, On-screen fire button'
                ]
            ],
            'arcore' => [
                'device' => 'arcore',
                'xr_mode' => 'mobile-ar',
                'title' => 'ARCore Profile',
                'desc' => 'Calibrated for WebXR Immersive-AR in Passthrough Space',
                'particles' => ['count' => 1800, 'starCount' => 600, 'dustCount' => 200, 'speed' => 0.85],
                'flight' => ['speed' => 40.0, 'boostMultiplier' => 1.9, 'pitchSpeed' => 0.0022, 'yawSpeed' => 0.0022],
                'controls' => [
                    'inputMode' => 'ar_touch_flight',
                    'showVirtualJoysticks' => 'true',
                    'enablePointerLock' => 'false',
                    'description' => '6-DOF AR device pose tracking, Screen tap targeting, Virtual touch thrust'
                ]
            ],
            'vr' => [
                'device' => 'vr',
                'xr_mode' => 'desktop-vr',
                'title' => 'VR Headset Profile',
                'desc' => 'Calibrated for WebXR Immersive-VR (6-DOF Spatial Motion Controllers, Stereo Rendering)',
                'particles' => ['count' => 3800, 'starCount' => 2200, 'dustCount' => 500, 'speed' => 0.85],
                'flight' => ['speed' => 50.0, 'boostMultiplier' => 2.3, 'pitchSpeed' => 0.0024, 'yawSpeed' => 0.0024],
                'controls' => [
                    'inputMode' => '6dof_controllers',
                    'showVirtualJoysticks' => 'false',
                    'enablePointerLock' => 'false',
                    'description' => 'Dual 6-DOF VR motion controllers, Trigger primary fire, Grip boost thrust'
                ]
            ]
        ];

        $themeLower = strtolower($theme);
        $primaryColor = '#00f0ff';
        $glowColor = 'rgba(0, 240, 255, 0.45)';
        $panelBg = 'rgba(2, 14, 26, 0.88)';
        $panelBorder = 'rgba(0, 240, 255, 0.40)';
        $uColorEdge = '0x003366';
        $uColorCore = '0x00f0ff';
        $uColorHot = '0xd6ffff';
        $uHaloColor = '0x00f0ff';
        $ambientLight = '0x002233';
        $centerLight = '0x00f0ff';

        if (strpos($themeLower, 'amber') !== false || strpos($themeLower, 'gold') !== false || strpos($themeLower, 'orange') !== false) {
            $primaryColor = '#ffd166';
            $glowColor = 'rgba(255, 209, 102, 0.45)';
            $panelBg = 'rgba(24, 14, 2, 0.88)';
            $panelBorder = 'rgba(255, 209, 102, 0.40)';
            $uColorEdge = '0x663300';
            $uColorCore = '0xff9900';
            $uColorHot = '0xfff4d6';
            $uHaloColor = '0xffaa00';
            $ambientLight = '0x331a00';
            $centerLight = '0xffaa00';
        } elseif (strpos($themeLower, 'violet') !== false || strpos($themeLower, 'purple') !== false || strpos($themeLower, 'singularity') !== false) {
            $primaryColor = '#c084fc';
            $glowColor = 'rgba(192, 132, 252, 0.45)';
            $panelBg = 'rgba(18, 6, 28, 0.88)';
            $panelBorder = 'rgba(192, 132, 252, 0.40)';
            $uColorEdge = '0x330066';
            $uColorCore = '0x9933ff';
            $uColorHot = '0xf5e6ff';
            $uHaloColor = '0xa855f7';
            $ambientLight = '0x1a0033';
            $centerLight = '0xa855f7';
        } elseif (strpos($themeLower, 'magenta') !== false || strpos($themeLower, 'pink') !== false || strpos($themeLower, 'crimson') !== false || strpos($themeLower, 'quantum') !== false || strpos($themeLower, 'overlord') !== false) {
            $primaryColor = '#f43f5e';
            $glowColor = 'rgba(244, 63, 94, 0.45)';
            $panelBg = 'rgba(28, 4, 12, 0.88)';
            $panelBorder = 'rgba(244, 63, 94, 0.40)';
            $uColorEdge = '0x66001a';
            $uColorCore = '0xff0055';
            $uColorHot = '0xffe6ee';
            $uHaloColor = '0xf43f5e';
            $ambientLight = '0x330011';
            $centerLight = '0xf43f5e';
        } elseif (strpos($themeLower, 'green') !== false || strpos($themeLower, 'emerald') !== false) {
            $primaryColor = '#10b981';
            $glowColor = 'rgba(16, 185, 129, 0.45)';
            $panelBg = 'rgba(2, 24, 16, 0.88)';
            $panelBorder = 'rgba(16, 185, 129, 0.40)';
            $uColorEdge = '0x003322';
            $uColorCore = '0x00ff88';
            $uColorHot = '0xd6fff0';
            $uHaloColor = '0x10b981';
            $ambientLight = '0x002211';
            $centerLight = '0x10b981';
        }

        $cleanStageName = addslashes($stageName);
        $upperStageName = strtoupper($stageName);
        $cleanDesc = addslashes($description);
        $cleanTheme = addslashes($theme);
        $cleanEventsWithin = addslashes($eventsWithin);
        $cleanEndLevelEvent = addslashes($endLevelEvent);

        // Split eventsWithin by commas into JSON array
        $eventsList = array_values(array_filter(array_map('trim', explode(',', $eventsWithin))));
        if (!in_array($endLevelEvent, $eventsList, true) && !empty($endLevelEvent)) {
            $eventsList[] = trim($endLevelEvent);
        }
        $eventsJsonFormatted = json_encode($eventsList, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        foreach ($validWormholeDirs as $wormholeDir) {
            // Ensure audio directory for this stage
            $stageAudioDir = $wormholeDir . DIRECTORY_SEPARATOR . 'audio' . DIRECTORY_SEPARATOR . $stageSlug;
            if (!is_dir($stageAudioDir)) {
                @mkdir($stageAudioDir, 0777, true);
                @chmod($stageAudioDir, 0777);
            }
            if (is_dir($stageAudioDir)) {
                $audioFolders[] = $stageAudioDir;
            }

            // Ensure images directory for this stage
            $stageImageDir = $wormholeDir . DIRECTORY_SEPARATOR . "{$stageSlug}_images";
            if (!is_dir($stageImageDir)) {
                @mkdir($stageImageDir, 0777, true);
                @chmod($stageImageDir, 0777);
            }
            if (is_dir($stageImageDir)) {
                $imageFolders[] = $stageImageDir;
            }

            // Ensure js directory exists
            $jsDir = $wormholeDir . DIRECTORY_SEPARATOR . 'js';
            if (!is_dir($jsDir)) {
                @mkdir($jsDir, 0777, true);
                @chmod($jsDir, 0777);
            }

            // -----------------------------------------------------------------
            // 1. GENERATE CANONICAL STAGE OBJECT POOL SCRIPT in js/{$stageSlug}_pool.js
            // -----------------------------------------------------------------
            $canonicalPoolJs = $jsDir . DIRECTORY_SEPARATOR . "{$stageSlug}_pool.js";
            $poolJsCode = <<<JS
import * as THREE from 'three';
import { MeshPool, StageObjectPool } from './object_pool.js';

/**
 * Wormhole XR - Stage {$stageLevel}: {$cleanStageName} Object Pool
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 *
 * Pre-allocates enemies and weapons graphic objects.
 * Sets 3D graphic models, scales, physical dimensions, and weapons attributes
 * pulled dynamically from the Game Manager admin database.
 */

export class {$pascalSlug}ObjectPool extends StageObjectPool {
  constructor(scene, stageConfig = {}, options = {}) {
    const configWithDefaults = {
      stage_level: {$stageLevel},
      stage_name: '{$cleanStageName}',
      stage_slug: '{$stageSlug}',
      environment_theme: '{$cleanTheme}',
      initial_weapon_pool_size: 300,
      initial_enemy_pool_size: 100,
      waves: [
        {
          wave_number: 1,
          enemy_count: 5,
          interval_seconds: 0,
          delay_ms: 0,
          description: 'Wave 1: Recon Vanguard (5 Enemies)'
        },
        {
          wave_number: 2,
          enemy_count: 10,
          interval_seconds: 15,
          delay_ms: 15000,
          description: 'Wave 2: Full Assault Swarm (10 Enemies)'
        }
      ],
      total_waves: 2,
      wave_interval_seconds: 15,
      weapons: {$weaponsJsonFormatted},
      enemies: {$enemiesJsonFormatted},
      ...stageConfig
    };

    super(scene, configWithDefaults, options);
    console.log(`[{$pascalSlug}ObjectPool] Pre-allocated graphics object pool for Stage {$stageLevel}: {$cleanStageName}`);
  }
}

export function createStagePool(scene, stageConfig = {}, options = {}) {
  return new {$pascalSlug}ObjectPool(scene, stageConfig, options);
}

export default createStagePool;
export { MeshPool };
JS;

            if (@file_put_contents($canonicalPoolJs, $poolJsCode) !== false) {
                @chmod($canonicalPoolJs, 0666);
                $createdFiles[] = $canonicalPoolJs;
            } else {
                error_log("provisionWormholeStageFilesAndAudio: Failed to write " . $canonicalPoolJs);
            }

            // -----------------------------------------------------------------
            // 2. GENERATE DEVICE-SPECIFIC MODULES
            // -----------------------------------------------------------------
            foreach ($deviceProfiles as $targetFolder => $prof) {
                $deviceDir = $wormholeDir . DIRECTORY_SEPARATOR . $targetFolder;
                if (!is_dir($deviceDir)) {
                    @mkdir($deviceDir, 0777, true);
                    @chmod($deviceDir, 0777);
                }

                $deviceAudioDir = $deviceDir . DIRECTORY_SEPARATOR . 'audio' . DIRECTORY_SEPARATOR . $stageSlug;
                if (!is_dir($deviceAudioDir)) {
                    @mkdir($deviceAudioDir, 0777, true);
                    @chmod($deviceAudioDir, 0777);
                }
                if (is_dir($deviceAudioDir)) {
                    $audioFolders[] = $deviceAudioDir;
                }

                $deviceImageDir = $deviceDir . DIRECTORY_SEPARATOR . "{$stageSlug}_images";
                if (!is_dir($deviceImageDir)) {
                    @mkdir($deviceImageDir, 0777, true);
                    @chmod($deviceImageDir, 0777);
                }
                if (is_dir($deviceImageDir)) {
                    $imageFolders[] = $deviceImageDir;
                }

                $upperDevice = strtoupper($prof['device']);
                $particlesJson = json_encode($prof['particles'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                $flightJson = json_encode($prof['flight'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                $controlsJson = json_encode($prof['controls'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

                $jsCode = <<<JS
import * as THREE from 'three';

/**
 * Wormhole XR - Stage {$stageLevel}: {$cleanStageName} [{$prof['title']}]
 * Auto-generated by Calm Chess Games Game Manager Provisioner.
 * Calm Chess Games / Wormhole XR (c) 2026. All Rights Reserved.
 */

export const stageConfig = {
  meta: {
    level: {$stageLevel},
    name: '{$cleanStageName}',
    slug: '{$stageSlug}',
    theme: '{$cleanTheme}',
    device: '{$prof['device']}',
    xrMode: '{$prof['xr_mode']}',
    description: '{$cleanDesc}',
    parScore: {$parScore},
    requiredKills: {$requiredEnemyKills},
    warpTargetDistance: {$warpTargetDistance},
    eventsWithin: '{$cleanEventsWithin}',
    endLevelEvent: '{$cleanEndLevelEvent}'
  },
  visual: {
    themeName: '{$cleanTheme}',
    colors: {
      primary: '{$primaryColor}',
      glow: '{$glowColor}',
      panelBg: '{$panelBg}',
      panelBorder: '{$panelBorder}'
    },
    shaderUniforms: {
      uColorEdge: new THREE.Color({$uColorEdge}),
      uColorCore: new THREE.Color({$uColorCore}),
      uColorHot: new THREE.Color({$uColorHot}),
      uHaloColor: new THREE.Color({$uHaloColor})
    },
    lighting: {
      ambient: {$ambientLight},
      center: {$centerLight}
    },
    particles: {$particlesJson},
    flight: {$flightJson}
  },
  weapons: {$weaponsJsonFormatted},
  enemies: {$enemiesJsonFormatted},
  objectives: {$objectivesJsonFormatted},
  controls: {$controlsJson}
};

export const stageEvents = {$eventsJsonFormatted};

export function fireEnemyWeapon(enemy, playerPos, activeEnemyBolts, scene) {
  if (!enemy || !enemy.mesh || !activeEnemyBolts || !scene) return false;

  const enemyBolts = activeEnemyBolts();
  if (enemyBolts.length > 80) return false;

  const primaryW = (enemy.weapons && enemy.weapons[0]) || {};
  const wScale = Number(enemy.weapon_scale ?? primaryW.scale ?? 1.0);
  const wScaleX = Number(enemy.weapon_scale_x ?? primaryW.scale_x ?? 1.0);
  const wScaleY = Number(enemy.weapon_scale_y ?? primaryW.scale_y ?? 1.0);
  const wScaleZ = Number(enemy.weapon_scale_z ?? primaryW.scale_z ?? 1.0);
  const wSizeX = Number(enemy.weapon_size_x ?? primaryW.size_x ?? (primaryW.dimensions && primaryW.dimensions.x) ?? 1.0);
  const wSizeY = Number(enemy.weapon_size_y ?? primaryW.size_y ?? (primaryW.dimensions && primaryW.dimensions.y) ?? 1.0);
  const wSizeZ = Number(enemy.weapon_size_z ?? primaryW.size_z ?? (primaryW.dimensions && primaryW.dimensions.z) ?? 1.0);

  const wSpecialFx = primaryW.special_fx || enemy.weapon_special_fx || 'cockpit_cracks_red_edges';
  const wSpecialFxFile = primaryW.special_fx_file || enemy.weapon_special_fx_file || 'desktop/warp_origin_images/cockpit_cracks_overlay.png';
  const wSpecialFxType = primaryW.special_fx_type || enemy.weapon_special_fx_type || 'overlay';
  const wColor = enemy.weaponColor || enemy.weapon_color || primaryW.color || '{$primaryColor}';
  const wName = primaryW.name || enemy.weapon_name || 'Enemy Laser';
  const wId = primaryW.id || enemy.weapon_id || 'enemy_laser';

  let mesh = null;
  let fromPool = false;
  let geometryList = [];
  let materialList = [];

  const target = (playerPos && playerPos.isVector3) ? playerPos : new THREE.Vector3(0, 0, 220);
  const direction = new THREE.Vector3().subVectors(target, enemy.mesh.position).normalize();
  const boltQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

  if (window.stageObjectPool && typeof window.stageObjectPool.spawnEnemyWeapon === 'function') {
    mesh = window.stageObjectPool.spawnEnemyWeapon(primaryW, enemy, enemy.mesh.position, boltQuat, isMissile ? 'missile' : 'beam');
    if (mesh) fromPool = true;
  }

  if (!mesh) {
    const boltGeom = new THREE.CylinderGeometry(0.08 * wSizeX, 0.08 * wSizeY, 1.6 * wSizeZ, 6);
    boltGeom.rotateX(Math.PI / 2);
    const boltMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(wColor),
      wireframe: false
    });

    mesh = new THREE.Mesh(boltGeom, boltMat);
    mesh.scale.set(wScale * wScaleX, wScale * wScaleY, wScale * wScaleZ);
    mesh.position.copy(enemy.mesh.position);
    mesh.quaternion.copy(boltQuat);

    geometryList = [boltGeom];
    materialList = [boltMat];
    scene.add(mesh);
  } else {
    mesh.position.copy(enemy.mesh.position);
    mesh.quaternion.copy(boltQuat);
  }

  const isMissile = (enemy.weaponType === 'missile' || (enemy.weaponName && enemy.weaponName.toLowerCase().includes('missile')));
  const boltSpeed = enemy.weaponSpeed || enemy.weapon_speed || 420;
  const boltDamage = enemy.weaponDamage || enemy.weapon_damage || 5;

  enemyBolts.push({
    mesh,
    fromPool,
    geometryList,
    materialList,
    direction,
    speed: boltSpeed,
    damage: boltDamage,
    weaponId: wId,
    weaponName: wName,
    weaponColor: wColor,
    specialFx: wSpecialFx,
    specialFxFile: wSpecialFxFile,
    specialFxType: wSpecialFxType,
    scale: wScale,
    scale_x: wScaleX,
    scale_y: wScaleY,
    scale_z: wScaleZ,
    size_x: wSizeX,
    size_y: wSizeY,
    size_z: wSizeZ,
    dimensions: { x: wSizeX, y: wSizeY, z: wSizeZ },
    type: isMissile ? 'missile' : 'beam',
    spiralTime: Math.random() * Math.PI * 2,
    spawnTime: performance.now(),
    lifetime: 4.8
  });

  return true;
}

export function updateEnemyMovement(enemy, delta, playerPos, scene) {
  if (!enemy || !enemy.mesh) return;
  // Default forward intercept trajectory
  if (typeof enemy.speed === 'number' && enemy.speed > 0) {
    const dir = new THREE.Vector3().subVectors(playerPos, enemy.mesh.position).normalize();
    enemy.mesh.position.addScaledVector(dir, enemy.speed * delta * 0.1);
  }
}

export function updateStageWaves(pool, activeEnemies, stageKills, scene) {
  if (!pool) return;
  // Waves boilerplate handler
  if (typeof pool.getPoolStats === 'function') {
    return pool.getPoolStats();
  }
}

export function handleStageEvent(eventName, payload, engineApi) {
  console.log(`[Stage {$stageLevel}: {$cleanStageName}] Event received: \${eventName}`, payload);
  if (eventName === '{$cleanEndLevelEvent}') {
    if (engineApi && typeof engineApi.showToast === 'function') {
      engineApi.showToast('🏆 STAGE {$stageLevel} OBJECTIVE COMPLETE: {$cleanEndLevelEvent}');
    }
  }
}

export function applyStage(engineApi) {
  if (!engineApi) return stageConfig;
  console.log(`[Stage {$stageLevel}: {$cleanStageName}] Applying {$prof['title']} configuration...`);

  if (typeof engineApi.setThemeColors === 'function') {
    engineApi.setThemeColors(stageConfig.visual);
  }
  if (typeof engineApi.setHudStatus === 'function') {
    engineApi.setHudStatus('STAGE {$stageLevel}: {$upperStageName} [{$upperDevice}]');
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
  if (typeof engineApi.setEnemyWeaponHandler === 'function') {
    engineApi.setEnemyWeaponHandler(fireEnemyWeapon);
  }
  if (typeof engineApi.showToast === 'function') {
    engineApi.showToast('🚀 STAGE {$stageLevel}: {$upperStageName} [{$upperDevice}] LOADED');
  }

  return stageConfig;
}

export default { stageConfig, applyStage, fireEnemyWeapon, updateEnemyMovement, updateStageWaves, handleStageEvent, stageEvents };
JS;

                $primaryJs = $deviceDir . DIRECTORY_SEPARATOR . "{$stageSlug}_{$targetFolder}.js";
                if (@file_put_contents($primaryJs, $jsCode) !== false) {
                    @chmod($primaryJs, 0666);
                    $createdFiles[] = $primaryJs;
                } else {
                    error_log("provisionWormholeStageFilesAndAudio: Failed to write " . $primaryJs);
                }

                $genericJs = $deviceDir . DIRECTORY_SEPARATOR . "{$stageSlug}.js";
                if (@file_put_contents($genericJs, $jsCode) !== false) {
                    @chmod($genericJs, 0666);
                    $createdFiles[] = $genericJs;
                } else {
                    error_log("provisionWormholeStageFilesAndAudio: Failed to write " . $genericJs);
                }
            }
        }

        return [
            'stage_slug' => $stageSlug,
            'created_files' => array_values(array_unique($createdFiles)),
            'audio_folders' => array_values(array_unique($audioFolders)),
            'image_folders' => array_values(array_unique($imageFolders))
        ];
    }
}

if (!function_exists('provisionAllWormholeStageFilesAndAudio')) {
    function provisionAllWormholeStageFilesAndAudio() {
        $results = [];
        try {
            $pdo = getDbConnection();
            $stagesStmt = $pdo->query("SELECT * FROM `wormhole_game_stages` ORDER BY `stage_level` ASC");
            $stages = $stagesStmt ? $stagesStmt->fetchAll(PDO::FETCH_ASSOC) : [];
            if (empty($stages)) {
                $stages = [
                    ['stage_level' => 1, 'stage_name' => 'Warp Origin', 'environment_theme' => 'Warp Cyan Corridor', 'events_within_level' => 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert', 'end_level_event' => 'Warp Horizon Jump Gate Initialized', 'description' => 'Initial entry vector into unstable hyperspace corridor.', 'par_score' => 5000, 'mission_objectives' => 'Destroy 10 hostiles and close within 50,000 KM of wormhole singularity to authorize warp jump.', 'required_enemy_kills' => 10, 'warp_target_distance' => 50000],
                    ['stage_level' => 2, 'stage_name' => 'Event Horizon', 'environment_theme' => 'Event Horizon Amber', 'events_within_level' => 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert', 'end_level_event' => 'Singularity Perimeter Breach', 'description' => 'High-velocity relativistic light-horizon boundary with intense magnetic shear.', 'par_score' => 12000, 'mission_objectives' => 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.', 'required_enemy_kills' => 15, 'warp_target_distance' => 35000],
                    ['stage_level' => 3, 'stage_name' => 'Singularity Core', 'environment_theme' => 'Singularity Void Violet', 'events_within_level' => 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening', 'end_level_event' => 'Core Collapse Breakthrough', 'description' => 'Extreme gravitational distortion sector surrounding the black hole collapse boundary.', 'par_score' => 25000, 'mission_objectives' => 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.', 'required_enemy_kills' => 20, 'warp_target_distance' => 20000],
                    ['stage_level' => 4, 'stage_name' => 'Quantum Realm', 'environment_theme' => 'Quantum Phasor Magenta', 'events_within_level' => 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation', 'end_level_event' => 'Quantum Conduit Realignment & Safe Extraction', 'description' => 'Deepest reaches beyond physical spacetime.', 'par_score' => 50000, 'mission_objectives' => 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.', 'required_enemy_kills' => 25, 'warp_target_distance' => 10000],
                    ['stage_level' => 5, 'stage_name' => 'Final Boss Stage', 'environment_theme' => 'Singularity Overlord Crimson', 'events_within_level' => 'Singularity Horizon Collapse, Dreadnought Gravitational Wave, Titan Core Overcharge, Final Singularity Breach', 'end_level_event' => 'Wormhole Singularity Overlord Defeated', 'description' => 'The epicenter of the cosmic anomaly where the ancient Singularity Overlord Titan commands relativistic swarm dreadnoughts.', 'par_score' => 75000, 'mission_objectives' => 'Destroy 25 Overlord hostiles including the Singularity Overlord Titan and breach the singularity core < 5,000 KM.', 'required_enemy_kills' => 25, 'warp_target_distance' => 5000],
                    ['stage_level' => 6, 'stage_name' => 'Nebula Outpost', 'environment_theme' => 'Ion Nebula Emerald', 'events_within_level' => 'Ion Cloud Density Spike, Nebula Sentry Patrols, Plasma Storm Discharge, Outpost Command Relay Activation', 'end_level_event' => 'Nebula Outpost Relink Established', 'description' => 'Dense electromagnetic nebula staging perimeter harboring defensive sentry arrays.', 'par_score' => 90000, 'mission_objectives' => 'Neutralize 25 Nebula hostiles and secure orbital relay outpost perimeter.', 'required_enemy_kills' => 25, 'warp_target_distance' => 5000]
                ];
            }
            foreach ($stages as $s) {
                $results[] = provisionWormholeStageFilesAndAudio(
                    intval($s['stage_level']),
                    $s['stage_name'],
                    $s['environment_theme'] ?? 'Warp Cyan Corridor',
                    $s['events_within_level'] ?? '',
                    $s['end_level_event'] ?? '',
                    $s['description'] ?? '',
                    intval($s['par_score'] ?? 5000),
                    $s['mission_objectives'] ?? '',
                    intval($s['required_enemy_kills'] ?? 10),
                    intval($s['warp_target_distance'] ?? 50000)
                );
            }
        } catch (Throwable $e) {
            error_log("provisionAllWormholeStageFilesAndAudio error: " . $e->getMessage());
        }
        return $results;
    }
}
