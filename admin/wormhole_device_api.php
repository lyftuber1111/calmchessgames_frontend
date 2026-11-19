<?php
/**
 * Wormhole XR - Device Capability & Telemetry Gateway
 * Validates hardware support for Desktop XR, PCVR, Mobile XR, and Mobile AR (ARCore).
 * Calm Chess Computers (c) 2026
 * Calm Chess Computers 2026. All Rights Reserved.
 */

$corsPaths = [
    __DIR__ . '/cors.php',
    __DIR__ . '/../cors.php',
    __DIR__ . '/../../cors.php',
    dirname(__DIR__) . '/cors.php'
];
foreach ($corsPaths as $cp) {
    if (file_exists($cp)) {
        require_once $cp;
        break;
    }
}

ini_set('display_errors', '0');
error_reporting(E_ALL);

$configPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../config.php',
    __DIR__ . '/../../config.php',
    dirname(__DIR__) . '/config.php'
];
foreach ($configPaths as $cp) {
    if (file_exists($cp)) {
        require_once $cp;
        break;
    }
}

if (file_exists(__DIR__ . '/wormhole_stage_provisioner.php')) {
    require_once __DIR__ . '/wormhole_stage_provisioner.php';
}

header('Content-Type: application/json; charset=utf-8');

function sendDeviceResponse(bool $success, string $message, array $data = [], int $httpCode = 200) {
    if (function_exists('sendJsonResponse')) {
        sendJsonResponse($success, $message, $data, $httpCode);
    } else {
        http_response_code($httpCode);
        echo json_encode(array_merge([
            'success' => $success,
            'message' => $message,
            'timestamp' => date('c')
        ], $data), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (!function_exists('sendJsonResponse')) {
    function sendJsonResponse(bool $success, string $message, array $data = [], int $httpCode = 200) {
        http_response_code($httpCode);
        echo json_encode(array_merge([
            'success' => $success,
            'message' => $message,
            'timestamp' => date('c')
        ], $data), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

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

// Auto-initialize table if needed with unique device constraint
function ensureWormholeTable(PDO $pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `wormhole_devices` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `device_name` VARCHAR(255) NOT NULL,
              `device_type` ENUM('desktop', 'vr_hmd', 'mobile', 'tablet', 'ar_glasses', 'unknown') NOT NULL DEFAULT 'unknown',
              `os_platform` VARCHAR(100) NULL,
              `browser` VARCHAR(100) NULL,
              `gpu_renderer` VARCHAR(255) NULL,
              `supported_modes` VARCHAR(255) NOT NULL DEFAULT 'desktop-xr',
              `is_supported` TINYINT(1) NOT NULL DEFAULT 1,
              `source` ENUM('seeded', 'manual', 'telemetry') NOT NULL DEFAULT 'telemetry',
              `reported_count` INT NOT NULL DEFAULT 1,
              `notes` TEXT NULL,
              `user_agent_hash` VARCHAR(64) NULL,
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY `uq_device_name` (`device_name`),
              INDEX `idx_is_supported` (`is_supported`),
              INDEX `idx_device_type` (`device_type`),
              INDEX `idx_ua_hash` (`user_agent_hash`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Safely add unique constraint if existing table lacked it
        try {
            $pdo->exec("ALTER TABLE `wormhole_devices` ADD UNIQUE KEY `uq_device_name` (`device_name`)");
        } catch (Throwable $ignore) {}

        // Automatic repair for legacy casing/missing _images typos in database
        try {
            $pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_url` = 'mobile/event_horizon_images/red_recon_drone.glb' WHERE `model_3d_url` LIKE '%Event_Horizon%' OR `model_3d_url` = 'mobile/event_horizon/red_recon_drone.glb'");
            $pdo->exec("UPDATE `wormhole_game_environments` SET `model_3d_url` = REPLACE(`model_3d_url`, 'Event_Horizon', 'event_horizon_images') WHERE `model_3d_url` LIKE '%Event_Horizon%'");
            $pdo->exec("UPDATE `wormhole_game_environments` SET `image_asset_url` = REPLACE(`image_asset_url`, 'Event_Horizon', 'event_horizon_images') WHERE `image_asset_url` LIKE '%Event_Horizon%'");
        } catch (Throwable $ignore) {}
    } catch (Throwable $e) {
        error_log('ensureWormholeTable error: ' . $e->getMessage());
    }
}

// Generate descriptive hardware signature from User-Agent and GPU telemetry
function inferDescriptiveDeviceName(string $ua, string $gpu, string $os, string $type): string {
    $model = '';
    
    if (preg_match('/Quest\s*3/i', $ua)) {
        $model = 'Meta Quest 3';
    } elseif (preg_match('/Quest\s*Pro/i', $ua)) {
        $model = 'Meta Quest Pro';
    } elseif (preg_match('/Quest\s*2/i', $ua)) {
        $model = 'Meta Quest 2';
    } elseif (preg_match('/Quest|Oculus/i', $ua)) {
        $model = 'Meta Quest VR Headset';
    } elseif (preg_match('/Vision/i', $ua)) {
        $model = 'Apple Vision Pro';
    } elseif (preg_match('/Pico/i', $ua)) {
        $model = 'Pico VR Headset';
    } elseif (preg_match('/Vive/i', $ua)) {
        $model = 'HTC Vive Headset';
    } elseif (preg_match('/Android/i', $ua)) {
        if (preg_match('/Pixel\s+([0-9a-zA-Z\s]+)/i', $ua, $m)) {
            $model = 'Google Pixel ' . trim($m[1]);
        } elseif (preg_match('/SM-([A-Z0-9]+)/i', $ua, $m)) {
            $model = 'Samsung Galaxy (SM-' . $m[1] . ')';
        } elseif (preg_match('/(Moto[^\s;)]+|Motorola[^\s;)]+)/i', $ua, $m)) {
            $model = trim($m[1]);
        } elseif (preg_match('/(Redmi[^\s;)]+|Xiaomi[^\s;)]+)/i', $ua, $m)) {
            $model = trim($m[1]);
        } elseif (preg_match('/OnePlus[^\s;)]*/i', $ua, $m)) {
            $model = 'OnePlus Device';
        } elseif (preg_match('/Android[^;]+;\s*([^;)]+)\s*(?:Build|\))/i', $ua, $m)) {
            $rawModel = trim($m[1]);
            $model = (!empty($rawModel) && !preg_match('/^K$/i', $rawModel)) ? $rawModel : 'Android Smartphone';
        } else {
            $model = 'Android Smartphone';
        }
    } elseif (preg_match('/iPhone/i', $ua)) {
        $model = 'Apple iPhone';
    } elseif (preg_match('/iPad/i', $ua)) {
        $model = 'Apple iPad';
    } elseif (preg_match('/Windows/i', $ua)) {
        $model = 'Windows PC';
    } elseif (preg_match('/Macintosh|Mac OS X/i', $ua)) {
        $model = 'Apple Mac';
    } elseif (preg_match('/Linux/i', $ua)) {
        $model = 'Linux Desktop';
    } else {
        $model = ($type === 'mobile') ? 'Mobile Device' : 'Desktop Device';
    }

    $details = [];
    if (!empty($os)) $details[] = $os;
    
    if (!empty($gpu)) {
        if (preg_match('/Adreno\s*(?:\(TM\))?\s*([0-9]+)/i', $gpu, $gm)) {
            $details[] = 'Adreno ' . $gm[1];
        } elseif (preg_match('/Mali-([A-Z0-9]+)/i', $gpu, $gm)) {
            $details[] = 'Mali-' . $gm[1];
        } elseif (preg_match('/Apple\s*GPU/i', $gpu)) {
            $details[] = 'Apple GPU';
        } elseif (preg_match('/RTX\s*([0-9]+)/i', $gpu, $gm)) {
            $details[] = 'RTX ' . $gm[1];
        } elseif (preg_match('/GTX\s*([0-9]+)/i', $gpu, $gm)) {
            $details[] = 'GTX ' . $gm[1];
        } elseif (preg_match('/Radeon/i', $gpu)) {
            $details[] = 'AMD Radeon';
        } elseif (preg_match('/Intel/i', $gpu)) {
            $details[] = 'Intel Graphics';
        }
    }

    if (!empty($details)) {
        return $model . ' (' . implode(', ', $details) . ')';
    }
    return $model;
}

// Parse request payload
$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = !empty($rawInput) ? json_decode($rawInput, true) : [];
if (!is_array($input)) $input = [];
if (!empty($_GET)) $input = array_merge($_GET, $input);
if (empty($action) && isset($input['action'])) $action = $input['action'];

try {
    $pdo = getDbConnection();
    ensureWormholeTable($pdo);

    // =========================================================================
    // ACTION: CHECK DEVICE SUPPORT & RECORD TELEMETRY / REPORT UNSUPPORTED
    // =========================================================================
    if ($action === 'check' || $action === 'check_device' || $action === 'report_unsupported') {
        $isExplicitReportUnsupported = ($action === 'report_unsupported');
        $mode = trim($input['mode'] ?? 'desktop-xr');
        $deviceName = trim($input['device_name'] ?? '');
        $deviceType = trim($input['device_type'] ?? 'unknown');
        $osPlatform = trim($input['os_platform'] ?? '');
        $browser = trim($input['browser'] ?? '');
        $gpuRenderer = trim($input['gpu_renderer'] ?? '');
        $immersiveVr = !empty($input['immersive_vr']);
        $immersiveAr = !empty($input['immersive_ar']);
        $hasTouch = !empty($input['has_touch']);
        $hasGamepad = !empty($input['has_gamepad']);
        $clientSupported = isset($input['is_supported']) ? ((int)$input['is_supported'] === 1) : true;
        if ($isExplicitReportUnsupported) {
            $clientSupported = false;
        }
        $clientReason = trim($input['reason'] ?? '');
        $rawUa = $_SERVER['HTTP_USER_AGENT'] ?? '';

        // Infer descriptive hardware name if not provided
        if (empty($deviceName) || $deviceName === 'Unknown Device' || $deviceName === 'Auto-Detected System') {
            $deviceName = inferDescriptiveDeviceName($rawUa, $gpuRenderer, $osPlatform, $deviceType);
        }

        $uaHash = hash('sha256', $rawUa . $deviceName);

        // Sanitize string inputs for security
        $deviceName = htmlspecialchars(substr($deviceName, 0, 250), ENT_QUOTES, 'UTF-8');
        $osPlatform = htmlspecialchars(substr($osPlatform, 0, 95), ENT_QUOTES, 'UTF-8');
        $browser = htmlspecialchars(substr($browser, 0, 95), ENT_QUOTES, 'UTF-8');
        $gpuRenderer = htmlspecialchars(substr($gpuRenderer, 0, 250), ENT_QUOTES, 'UTF-8');

        // Check if device is explicitly listed in database by name
        $stmt = $pdo->prepare('SELECT * FROM `wormhole_devices` WHERE `device_name` = :name LIMIT 1');
        $stmt->execute(['name' => $deviceName]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fallback to UA hash only for unnamed/generic devices
        if (!$existing && ($deviceName === 'Unknown Device' || $deviceName === 'Auto-Detected System') && !empty($uaHash)) {
            $stmt = $pdo->prepare('SELECT * FROM `wormhole_devices` WHERE `user_agent_hash` = :hash LIMIT 1');
            $stmt->execute(['hash' => $uaHash]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        $isSupported = $clientSupported;
        $reason = $clientReason;
        $recommendedMode = 'desktop-xr';

        if ($existing) {
            // Check whitelist / blacklist status in database
            if ((int)$existing['is_supported'] === 0 && ($existing['source'] ?? '') === 'manual') {
                $isSupported = false;
                $reason = !empty($existing['notes']) ? $existing['notes'] : "This device model ({$existing['device_name']}) has been marked as incompatible in the system hardware register.";
            } elseif (!$clientSupported) {
                // Client explicitly reported unsupported (or runtime capability test failed)
                $isSupported = false;
                if (empty($reason)) $reason = "Device flagged as unsupported during runtime diagnostics.";
                
                // Update database record to mark unsupported
                $upStmt = $pdo->prepare('UPDATE `wormhole_devices` SET `is_supported` = 0, `notes` = :notes, `reported_count` = `reported_count` + 1, `updated_at` = NOW() WHERE `id` = :id');
                $upStmt->execute(['notes' => substr($reason, 0, 255), 'id' => $existing['id']]);
            } else {
                // Device is healthy with active WebGL
                $isSupported = true;
                $reason = '';

                // Increment report count & refresh timestamp
                $upStmt = $pdo->prepare('UPDATE `wormhole_devices` SET `is_supported` = 1, `reported_count` = `reported_count` + 1, `updated_at` = NOW() WHERE `id` = :id');
                $upStmt->execute(['id' => $existing['id']]);
            }
        } else {
            // Dynamic capability heuristics for unlisted hardware
            if (!$clientSupported) {
                $isSupported = false;
                if (empty($reason)) $reason = 'Device failed runtime hardware compatibility checks.';
            } elseif ($mode === 'desktop-vr') {
                if (!$immersiveVr) {
                    $isSupported = false;
                    $reason = "WebXR 'immersive-vr' session is not supported on this browser or no VR headset (HMD) is currently connected and active.";
                    $recommendedMode = 'desktop-xr';
                }
            } elseif ($mode === 'mobile-ar') {
                if (!$immersiveAr) {
                    $isSupported = false;
                    $reason = "WebXR 'immersive-ar' camera passthrough is not supported. Google Play Services for AR (ARCore) or browser '#webxr-ar-module' flag may be missing.";
                    $recommendedMode = $hasTouch ? 'mobile-xr' : 'desktop-xr';
                }
            } elseif ($mode === 'mobile-xr') {
                if (!$hasTouch && $deviceType !== 'vr_hmd') {
                    $reason = 'Mobile XR works best with touchscreen or mobile VR viewer. Keyboard/mouse detected; desktop mode recommended.';
                }
            }

            // Secure telemetry auto-registration for both supported and unsupported devices
            try {
                $initialModes = ['desktop-xr'];
                if ($immersiveVr) $initialModes[] = 'desktop-vr';
                if ($hasTouch) $initialModes[] = 'mobile-xr';
                if ($immersiveAr) $initialModes[] = 'mobile-ar';
                $modesStr = implode(',', $initialModes);

                $insStmt = $pdo->prepare("
                    INSERT INTO `wormhole_devices` 
                    (`device_name`, `device_type`, `os_platform`, `browser`, `gpu_renderer`, `supported_modes`, `is_supported`, `source`, `reported_count`, `notes`, `user_agent_hash`)
                    VALUES
                    (:name, :type, :os, :browser, :gpu, :modes, :supported, 'telemetry', 1, :notes, :hash)
                    ON DUPLICATE KEY UPDATE
                      `is_supported` = VALUES(`is_supported`),
                      `notes` = VALUES(`notes`),
                      `reported_count` = `reported_count` + 1,
                      `updated_at` = NOW()
                ");
                $insStmt->execute([
                    'name'      => $deviceName,
                    'type'      => in_array($deviceType, ['desktop','vr_hmd','mobile','tablet','ar_glasses','unknown']) ? $deviceType : 'unknown',
                    'os'        => $osPlatform,
                    'browser'   => $browser,
                    'gpu'       => $gpuRenderer,
                    'modes'     => $modesStr,
                    'supported' => $isSupported ? 1 : 0,
                    'notes'     => !empty($reason) ? substr($reason, 0, 255) : ($isSupported ? 'Auto-detected compatible device via WebXR telemetry.' : 'Flagged via capability test: ' . substr($reason, 0, 200)),
                    'hash'      => $uaHash
                ]);
            } catch (Throwable $e) {
                error_log('Failed to insert telemetry device: ' . $e->getMessage());
            }
        }

        sendDeviceResponse(true, 'Device support analysis complete.', [
            'supported'        => $isSupported,
            'mode'             => $mode,
            'device_name'      => $deviceName,
            'device_type'      => $deviceType,
            'reason'           => $reason,
            'recommended_mode' => $recommendedMode,
            'capabilities'     => [
                'immersive_vr' => $immersiveVr,
                'immersive_ar' => $immersiveAr,
                'has_touch'    => $hasTouch,
                'has_gamepad'  => $hasGamepad
            ]
        ]);
    }

    // =========================================================================
    // ACTION: LOG TELEMETRY
    // =========================================================================
    if ($action === 'log_telemetry') {
        $deviceName = htmlspecialchars(substr(trim($input['device_name'] ?? 'Unknown Device'), 0, 250), ENT_QUOTES, 'UTF-8');
        $isSupported = !empty($input['is_supported']) ? 1 : 0;
        $mode = htmlspecialchars(substr(trim($input['mode'] ?? 'desktop-xr'), 0, 50), ENT_QUOTES, 'UTF-8');
        $uaHash = hash('sha256', ($_SERVER['HTTP_USER_AGENT'] ?? '') . $deviceName);

        $upStmt = $pdo->prepare('UPDATE `wormhole_devices` SET `reported_count` = `reported_count` + 1, `updated_at` = NOW() WHERE `user_agent_hash` = :hash OR `device_name` = :name');
        $upStmt->execute(['hash' => $uaHash, 'name' => $deviceName]);

        sendDeviceResponse(true, 'Telemetry logged successfully.');
    }

    // =========================================================================
    // ACTION: GET WORMHOLE DEVICES (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'get_wormhole_devices') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Accessing Wormhole device registry requires administrative credentials');
        }

        $stmt = $pdo->query("SELECT * FROM `wormhole_devices` ORDER BY `updated_at` DESC, `reported_count` DESC");
        $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalCount = count($devices);
        $supportedCount = 0;
        $unsupportedCount = 0;
        $vrCount = 0;
        $mobileCount = 0;

        foreach ($devices as $d) {
            if ((int)$d['is_supported'] === 1) {
                $supportedCount++;
            } else {
                $unsupportedCount++;
            }
            if ($d['device_type'] === 'vr_hmd') $vrCount++;
            if ($d['device_type'] === 'mobile' || $d['device_type'] === 'tablet') $mobileCount++;
        }

        sendDeviceResponse(true, 'Wormhole devices retrieved successfully', [
            'devices'      => $devices,
            'total'        => $totalCount,
            'supported'    => $supportedCount,
            'unsupported'  => $unsupportedCount,
            'vr_count'     => $vrCount,
            'mobile_count' => $mobileCount
        ]);
    }

    // =========================================================================
    // ACTION: ADD WORMHOLE DEVICE (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'add_wormhole_device') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Adding hardware entries requires administrative credentials');
        }

        $deviceName = htmlspecialchars(trim($input['device_name'] ?? ''), ENT_QUOTES, 'UTF-8');
        $deviceType = trim($input['device_type'] ?? 'unknown');
        $osPlatform = htmlspecialchars(trim($input['os_platform'] ?? ''), ENT_QUOTES, 'UTF-8');
        $browser = htmlspecialchars(trim($input['browser'] ?? ''), ENT_QUOTES, 'UTF-8');
        $gpuRenderer = htmlspecialchars(trim($input['gpu_renderer'] ?? ''), ENT_QUOTES, 'UTF-8');
        $supportedModes = htmlspecialchars(trim($input['supported_modes'] ?? 'desktop-xr'), ENT_QUOTES, 'UTF-8');
        $isSupported = isset($input['is_supported']) && ($input['is_supported'] === 1 || $input['is_supported'] === '1' || $input['is_supported'] === true) ? 1 : 0;
        $notes = htmlspecialchars(trim($input['notes'] ?? ''), ENT_QUOTES, 'UTF-8');

        if (empty($deviceName)) {
            sendDeviceResponse(false, 'Device name / model is required', ['field' => 'device_name'], 400);
        }

        $validTypes = ['desktop', 'vr_hmd', 'mobile', 'tablet', 'ar_glasses', 'unknown'];
        if (!in_array($deviceType, $validTypes, true)) {
            $deviceType = 'unknown';
        }

        $stmt = $pdo->prepare("
            INSERT INTO `wormhole_devices` 
            (`device_name`, `device_type`, `os_platform`, `browser`, `gpu_renderer`, `supported_modes`, `is_supported`, `source`, `reported_count`, `notes`)
            VALUES
            (:name, :type, :os, :browser, :gpu, :modes, :supp, 'manual', 1, :notes)
            ON DUPLICATE KEY UPDATE
              `device_type` = VALUES(`device_type`),
              `os_platform` = VALUES(`os_platform`),
              `browser` = VALUES(`browser`),
              `gpu_renderer` = VALUES(`gpu_renderer`),
              `supported_modes` = VALUES(`supported_modes`),
              `is_supported` = VALUES(`is_supported`),
              `notes` = VALUES(`notes`),
              `source` = 'manual',
              `updated_at` = NOW()
        ");
        $stmt->execute([
            'name'    => $deviceName,
            'type'    => $deviceType,
            'os'      => $osPlatform,
            'browser' => $browser,
            'gpu'     => $gpuRenderer,
            'modes'   => $supportedModes,
            'supp'    => $isSupported,
            'notes'   => $notes
        ]);

        sendDeviceResponse(true, "Device '{$deviceName}' registered successfully into hardware database.", [
            'id' => (int)$pdo->lastInsertId()
        ]);
    }

    // =========================================================================
    // ACTION: UPDATE WORMHOLE DEVICE (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'update_wormhole_device') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Updating hardware status requires administrative credentials');
        }

        $deviceId = intval($input['id'] ?? 0);
        if ($deviceId <= 0) {
            sendDeviceResponse(false, 'Valid device ID is required', ['field' => 'id'], 400);
        }

        $fields = [];
        $params = ['id' => $deviceId];

        if (isset($input['is_supported'])) {
            $fields[] = "`is_supported` = :is_supported";
            $params['is_supported'] = (!empty($input['is_supported']) && $input['is_supported'] != '0') ? 1 : 0;
        }
        if (isset($input['supported_modes'])) {
            $fields[] = "`supported_modes` = :modes";
            $params['modes'] = htmlspecialchars(trim($input['supported_modes']), ENT_QUOTES, 'UTF-8');
        }
        if (isset($input['notes'])) {
            $fields[] = "`notes` = :notes";
            $params['notes'] = htmlspecialchars(trim($input['notes']), ENT_QUOTES, 'UTF-8');
        }

        if (empty($fields)) {
            sendDeviceResponse(false, 'No fields specified for update', [], 400);
        }

        $sql = "UPDATE `wormhole_devices` SET " . implode(', ', $fields) . ", `updated_at` = NOW() WHERE `id` = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendDeviceResponse(true, "Device #{$deviceId} updated successfully");
    }

    // =========================================================================
    // ACTION: DELETE WORMHOLE DEVICE (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'delete_wormhole_device') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Deleting hardware records requires administrative credentials');
        }

        $deviceId = intval($input['id'] ?? 0);
        if ($deviceId <= 0) {
            sendDeviceResponse(false, 'Valid device ID is required', ['field' => 'id'], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM `wormhole_devices` WHERE `id` = :id");
        $stmt->execute(['id' => $deviceId]);

        sendDeviceResponse(true, "Device entry #{$deviceId} deleted successfully", ['id' => $deviceId]);
    }

    // =========================================================================
    // ACTION: SEED WORMHOLE DEVICES (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'seed_wormhole_devices') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Seeding hardware records requires administrative credentials');
        }

        $seedDevices = [
            ['Meta Quest 3', 'vr_hmd', 'Meta Horizon OS', 'OculusBrowser', 'Snapdragon XR2 Gen 2 / Adreno 740', 'desktop-xr,desktop-vr,mobile-xr', 1, 'Certified 6-DOF standalone and PC Link HMD with color passthrough.'],
            ['Meta Quest 2', 'vr_hmd', 'Meta Horizon OS', 'OculusBrowser', 'Snapdragon XR2 Gen 1 / Adreno 650', 'desktop-xr,desktop-vr,mobile-xr', 1, 'Certified 6-DOF standalone and PC Link HMD.'],
            ['Meta Quest Pro', 'vr_hmd', 'Meta Horizon OS', 'OculusBrowser', 'Snapdragon XR2+ / Adreno 650', 'desktop-xr,desktop-vr,mobile-xr', 1, 'Certified 6-DOF standalone and PC Link HMD with eye/face tracking.'],
            ['Apple Vision Pro', 'vr_hmd', 'visionOS 1.2+', 'Safari 17+ (WebXR enabled)', 'Apple M2 Dual-Chip', 'desktop-xr,desktop-vr,mobile-xr', 1, 'Certified spatial computing headset with high-res WebXR.'],
            ['Valve Index', 'vr_hmd', 'SteamVR (Windows/Linux)', 'Chromium / Chrome', 'NVIDIA GeForce / AMD Radeon', 'desktop-xr,desktop-vr', 1, 'Certified PCVR tethered HMD with Knuckles controllers.'],
            ['HTC Vive XR Elite', 'vr_hmd', 'VIVE Wave OS', 'Vive Browser', 'Snapdragon XR2 Gen 1', 'desktop-xr,desktop-vr,mobile-xr', 1, 'Certified standalone & tethered PCVR HMD.'],
            ['Pico 4', 'vr_hmd', 'Pico OS', 'Pico Browser', 'Snapdragon XR2 / Adreno 650', 'desktop-xr,desktop-vr,mobile-xr', 1, 'Certified standalone & PCVR HMD.'],
            ['Google Pixel 8 / 8 Pro', 'mobile', 'Android 14', 'Chrome 120+', 'Google Tensor G3 / Mali-G715', 'desktop-xr,mobile-xr,mobile-ar', 1, 'Google ARCore certified. Full WebXR immersive-ar support.'],
            ['Google Pixel 7 / 7 Pro', 'mobile', 'Android 13/14', 'Chrome 115+', 'Google Tensor G2 / Mali-G710', 'desktop-xr,mobile-xr,mobile-ar', 1, 'Google ARCore certified device.'],
            ['Samsung Galaxy S24 Ultra', 'mobile', 'Android 14', 'Chrome / Samsung Internet', 'Snapdragon 8 Gen 3 / Adreno 750', 'desktop-xr,mobile-xr,mobile-ar', 1, 'Google ARCore certified flagship with WebXR camera passthrough.'],
            ['Samsung Galaxy S23 / S23+', 'mobile', 'Android 13/14', 'Chrome', 'Snapdragon 8 Gen 2 / Adreno 740', 'desktop-xr,mobile-xr,mobile-ar', 1, 'Google ARCore certified flagship.'],
            ['iPhone 15 Pro / Pro Max', 'mobile', 'iOS 17+', 'WebXR Viewer / Safari Experimental', 'Apple A17 Pro', 'desktop-xr,mobile-xr,mobile-ar', 1, 'Apple ARKit device. WebXR requires Mozilla WebXR Viewer or Safari experimental flags.'],
            ['Generic Windows Desktop PC', 'desktop', 'Windows 10/11', 'Chrome / Edge', 'NVIDIA GeForce RTX / GTX / AMD Radeon', 'desktop-xr,desktop-vr', 1, 'Standard PC desktop with 6-DOF keyboard & mouse flight and OpenXR PCVR capability.'],
            ['Legacy Android (Non-ARCore)', 'mobile', 'Android 8.0 or older', 'Legacy Android Browser', 'Adreno 330 / Mali-400', '', 0, 'Blocked / Unsupported. Lacks WebGL2, WebXR Device API, and ARCore services.']
        ];

        $insStmt = $pdo->prepare("
            INSERT INTO `wormhole_devices`
            (`device_name`, `device_type`, `os_platform`, `browser`, `gpu_renderer`, `supported_modes`, `is_supported`, `source`, `reported_count`, `notes`)
            VALUES
            (:name, :type, :os, :browser, :gpu, :modes, :supp, 'seeded', 5, :notes)
            ON DUPLICATE KEY UPDATE `is_supported` = VALUES(`is_supported`), `supported_modes` = VALUES(`supported_modes`)
        ");

        $seededCount = 0;
        foreach ($seedDevices as $sd) {
            $insStmt->execute([
                'name'    => $sd[0],
                'type'    => $sd[1],
                'os'      => $sd[2],
                'browser' => $sd[3],
                'gpu'     => $sd[4],
                'modes'   => $sd[5],
                'supp'    => $sd[6],
                'notes'   => $sd[7]
            ]);
            $seededCount++;
        }

        sendDeviceResponse(true, "Successfully populated {$seededCount} certified Open-Source XR/ARCore devices into registry.", [
            'seeded_count' => $seededCount
        ]);
    }

    // =========================================================================
    // PUBLIC / GAME CLIENT: GET ALL GAME MANAGER DATA (WEAPONS, STAGES, ENEMIES)
    // =========================================================================
    if ($action === 'get_game_manager' || $action === 'get_game_manager_data' || $action === 'get_all_game_manager') {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_weapons` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `weapon_id` VARCHAR(64) NOT NULL UNIQUE,
                  `weapon_name` VARCHAR(100) NOT NULL,
                  `description` VARCHAR(255) NULL,
                  `icon` VARCHAR(32) DEFAULT '⚡',
                  `color_hex` VARCHAR(16) DEFAULT '#ff3344',
                  `stage_level` INT NOT NULL DEFAULT 1,
                  `is_initial_weapon` TINYINT(1) NOT NULL DEFAULT 0,
                  `is_acquirable` TINYINT(1) NOT NULL DEFAULT 1,
                  `acquire_event` VARCHAR(100) NOT NULL DEFAULT 'default_start',
                  `energy_drain_pct` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
                  `can_overheat` TINYINT(1) NOT NULL DEFAULT 1,
                  `cooldown_seconds` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
                  `damage_per_hit` INT NOT NULL DEFAULT 1,
                  `bullet_speed` INT NOT NULL DEFAULT 600,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_is_initial` (`is_initial_weapon`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `can_overheat` TINYINT(1) NOT NULL DEFAULT 1 AFTER `energy_drain_pct`"); } catch (Throwable $ignore) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `cooldown_seconds` DECIMAL(5,2) NOT NULL DEFAULT 5.00 AFTER `can_overheat`"); } catch (Throwable $ignore) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `damage_per_hit` INT NOT NULL DEFAULT 1 AFTER `cooldown_seconds`"); } catch (Throwable $ignore) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `is_acquirable` TINYINT(1) NOT NULL DEFAULT 1 AFTER `is_initial_weapon`"); } catch (Throwable $ignore) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `acquire_event` VARCHAR(100) NOT NULL DEFAULT 'default_start' AFTER `is_acquirable`"); } catch (Throwable $ignore) {}

            $countW = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_weapons`");
            if ((int)$countW->fetchColumn() === 0) {
                $defaultsW = [
                    ['red_laser', 'Red Laser', 'Standard high-cadence plasma emitter with twin focus beams.', '🔴', '#ff2244', 1, 1, 1, 'default_start', 10.00, 1, 5.00, 2, 550],
                    ['blue_laser', 'Blue Laser', 'High-impact coherent photon beam with deep penetration.', '🔵', '#00d4ff', 1, 0, 1, 'default_start', 30.00, 1, 10.00, 1, 700],
                    ['tachyon_lance', 'Tachyon Lance', 'Superluminal phase particle array unlocked after horizon traversal.', '⚡', '#a855f7', 2, 1, 1, 'warp_horizon_jump', 20.00, 1, 7.00, 3, 850],
                    ['plasma_torpedo', 'Plasma Torpedo', 'Heavy magnetic payload causing massive kinetic shockwave without overheating.', '💣', '#f59e0b', 3, 0, 1, 'singularity_core_probe', 40.00, 0, 0.00, 5, 450],
                    ['quantum_phaser', 'Quantum Phaser', 'Sub-atomic pulse rifle optimized for deep singularity warfare.', '✨', '#10b981', 4, 1, 1, 'deep_core_breakthrough', 15.00, 1, 6.00, 4, 950]
                ];
                $insW = $pdo->prepare("
                    INSERT INTO `wormhole_game_weapons`
                    (`weapon_id`, `weapon_name`, `description`, `icon`, `color_hex`, `stage_level`, `is_initial_weapon`, `is_acquirable`, `acquire_event`, `energy_drain_pct`, `can_overheat`, `cooldown_seconds`, `damage_per_hit`, `bullet_speed`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultsW as $d) {
                    $insW->execute($d);
                }
            }

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_stages` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `stage_level` INT NOT NULL UNIQUE,
                  `stage_name` VARCHAR(100) NOT NULL,
                  `environment_theme` VARCHAR(100) DEFAULT 'Warp Cyan Corridor',
                  `events_within_level` TEXT NOT NULL,
                  `end_level_event` VARCHAR(150) NOT NULL,
                  `mission_objectives` TEXT NULL,
                  `required_enemy_kills` INT NOT NULL DEFAULT 10,
                  `warp_target_distance` INT NOT NULL DEFAULT 50000,
                  `description` TEXT NULL,
                  `par_score` INT NOT NULL DEFAULT 5000,
                  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_enabled` (`is_enabled`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Auto-migrate wormhole_game_stages columns if missing
            try {
                $colCheck = $pdo->query("SHOW COLUMNS FROM `wormhole_game_stages` LIKE 'mission_objectives'")->fetch();
                if (!$colCheck) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_stages` ADD COLUMN `mission_objectives` TEXT NULL AFTER `end_level_event`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_stages` ADD COLUMN `required_enemy_kills` INT NOT NULL DEFAULT 10 AFTER `mission_objectives`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_stages` ADD COLUMN `warp_target_distance` INT NOT NULL DEFAULT 50000 AFTER `required_enemy_kills`");
                }
                @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 10 Void Recon Drones and pilot vessel to within < 50,000 KM of singularity core to unlock warp.', `required_enemy_kills` = 10, `warp_target_distance` = 50000 WHERE `stage_level` = 1");
                @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.', `required_enemy_kills` = 15, `warp_target_distance` = 35000 WHERE `stage_level` = 2");
                @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.', `required_enemy_kills` = 20, `warp_target_distance` = 20000 WHERE `stage_level` = 3");
                @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.', `required_enemy_kills` = 25, `warp_target_distance` = 10000 WHERE `stage_level` = 4");
                @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 25 Overlord hostiles including the Singularity Overlord Titan and breach the singularity core < 5,000 KM.', `required_enemy_kills` = 25, `warp_target_distance` = 5000 WHERE `stage_level` = 5");
                @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Neutralize 25 Nebula hostiles and secure orbital relay outpost perimeter.', `required_enemy_kills` = 25, `warp_target_distance` = 5000 WHERE `stage_level` = 6");

                // Ensure Stage 5 & 6 exist
                @$pdo->exec("
                    INSERT INTO `wormhole_game_stages`
                    (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `mission_objectives`, `required_enemy_kills`, `warp_target_distance`, `description`, `par_score`, `is_enabled`)
                    VALUES (5, 'Final Boss Stage', 'Singularity Overlord Crimson', 'Singularity Horizon Collapse, Dreadnought Gravitational Wave, Titan Core Overcharge, Final Singularity Breach', 'Wormhole Singularity Overlord Defeated', 'Destroy 25 Overlord hostiles including the Singularity Overlord Titan and breach the singularity core < 5,000 KM.', 25, 5000, 'The epicenter of the cosmic anomaly where the ancient Singularity Overlord Titan commands relativistic swarm dreadnoughts.', 75000, 1)
                    ON DUPLICATE KEY UPDATE `mission_objectives` = VALUES(`mission_objectives`), `required_enemy_kills` = VALUES(`required_enemy_kills`), `warp_target_distance` = VALUES(`warp_target_distance`)
                ");
                @$pdo->exec("
                    INSERT INTO `wormhole_game_stages`
                    (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `mission_objectives`, `required_enemy_kills`, `warp_target_distance`, `description`, `par_score`, `is_enabled`)
                    VALUES (6, 'Nebula Outpost', 'Ion Nebula Emerald', 'Ion Cloud Density Spike, Nebula Sentry Patrols, Plasma Storm Discharge, Outpost Command Relay Activation', 'Nebula Outpost Relink Established', 'Neutralize 25 Nebula hostiles and secure orbital relay outpost perimeter.', 25, 5000, 'Dense electromagnetic nebula staging perimeter harboring defensive sentry arrays.', 90000, 1)
                    ON DUPLICATE KEY UPDATE `mission_objectives` = VALUES(`mission_objectives`), `required_enemy_kills` = VALUES(`required_enemy_kills`), `warp_target_distance` = VALUES(`warp_target_distance`)
                ");
            } catch (Throwable $eMig) {
                error_log("Stages migration warning: " . $eMig->getMessage());
            }

            $countS = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_stages`");
            if ((int)$countS->fetchColumn() === 0) {
                $defaultsS = [
                    [1, 'Warp Origin', 'Warp Cyan Corridor', 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert', 'Warp Horizon Jump Gate Initialized', 'Destroy 10 Void Recon Drones and pilot vessel to within < 50,000 KM of singularity core to unlock warp.', 10, 50000, 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.', 5000, 1],
                    [2, 'Event Horizon', 'Event Horizon Amber', 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert', 'Singularity Perimeter Breach', 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.', 15, 35000, 'High-velocity relativistic light-horizon boundary with intense magnetic shear.', 12000, 1],
                    [3, 'Singularity Core', 'Singularity Void Violet', 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening', 'Core Collapse Breakthrough', 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.', 20, 20000, 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.', 25000, 1],
                    [4, 'Quantum Realm', 'Quantum Phasor Magenta', 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation', 'Quantum Conduit Realignment & Safe Extraction', 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.', 25, 10000, 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.', 50000, 1],
                    [5, 'Final Boss Stage', 'Singularity Overlord Crimson', 'Singularity Horizon Collapse, Dreadnought Gravitational Wave, Titan Core Overcharge, Final Singularity Breach', 'Wormhole Singularity Overlord Defeated', 'Destroy 25 Overlord hostiles including the Singularity Overlord Titan and breach the singularity core < 5,000 KM.', 25, 5000, 'The epicenter of the cosmic anomaly where the ancient Singularity Overlord Titan commands relativistic swarm dreadnoughts.', 75000, 1],
                    [6, 'Nebula Outpost', 'Ion Nebula Emerald', 'Ion Cloud Density Spike, Nebula Sentry Patrols, Plasma Storm Discharge, Outpost Command Relay Activation', 'Nebula Outpost Relink Established', 'Neutralize 25 Nebula hostiles and secure orbital relay outpost perimeter.', 25, 5000, 'Dense electromagnetic nebula staging perimeter harboring defensive sentry arrays.', 90000, 1]
                ];
                $insS = $pdo->prepare("
                    INSERT INTO `wormhole_game_stages`
                    (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `mission_objectives`, `required_enemy_kills`, `warp_target_distance`, `description`, `par_score`, `is_enabled`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultsS as $s) {
                    $insS->execute($s);
                }
            }

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_enemies` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `enemy_id` VARCHAR(64) NOT NULL,
                  `device_type` VARCHAR(32) NOT NULL DEFAULT 'all',
                  `enemy_name` VARCHAR(100) NOT NULL,
                  `enemy_class` VARCHAR(50) DEFAULT 'Drone',
                  `icon` VARCHAR(32) DEFAULT '🛸',
                  `color_hex` VARCHAR(16) DEFAULT '#ef476f',
                  `stage_level` INT NOT NULL DEFAULT 1,
                  `hits_to_destroy` INT NOT NULL DEFAULT 2,
                  `piercing_weapon_id` VARCHAR(64) NOT NULL DEFAULT 'any',
                  `armor_strength` INT NOT NULL DEFAULT 10,
                  `has_force_field` TINYINT(1) NOT NULL DEFAULT 0,
                  `shield_capacity_hits` INT NOT NULL DEFAULT 0,
                  `movement_speed` INT NOT NULL DEFAULT 250,
                  `attack_damage` INT NOT NULL DEFAULT 5,
                  `weapon_name` VARCHAR(100) NOT NULL DEFAULT 'Plasma Pulse',
                  `weapon_damage` INT NOT NULL DEFAULT 5,
                  `weapon_speed` INT NOT NULL DEFAULT 450,
                  `weapon_color` VARCHAR(16) NOT NULL DEFAULT '#ff2255',
                  `weapons_json` LONGTEXT NULL,
                  `fire_rate_seconds` DECIMAL(5,2) NOT NULL DEFAULT 2.00,
                  `fire_rate_ms` INT NOT NULL DEFAULT 2000,
                  `score_value` INT NOT NULL DEFAULT 100,
                  `threat_level` ENUM('Low', 'Medium', 'High', 'Extreme') NOT NULL DEFAULT 'Low',
                  `description` TEXT NULL,
                  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_device_type` (`device_type`),
                  INDEX `idx_piercing_weapon` (`piercing_weapon_id`),
                  INDEX `idx_threat` (`threat_level`),
                  INDEX `idx_enabled` (`is_enabled`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            try {
                $colDev = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'device_type'")->fetch();
                if (!$colDev) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `device_type` VARCHAR(32) NOT NULL DEFAULT 'all' AFTER `enemy_id`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD INDEX `idx_device_type` (`device_type`)");
                }
                $colCheckWeaponsDev = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'weapons_json'")->fetch();
                if (!$colCheckWeaponsDev) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `weapons_json` LONGTEXT NULL AFTER `weapon_color`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `fire_rate_ms` INT NOT NULL DEFAULT 2000 AFTER `fire_rate_seconds`");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `fire_rate_ms` = ROUND(COALESCE(`fire_rate_seconds`, 2.0) * 1000)");
                }
            } catch (Throwable $ignore) {}
            $countE = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_enemies`");
            if ((int)$countE->fetchColumn() === 0) {
                $defaultsE = [
                    ['void_recon_drone', 'Void Recon Drone', 'Scout Drone', '🛸', '#00f0ff', 1, 2, 'any', 10, 0, 0, 320, 5, 2.50, 100, 'Low', 'Light autonomous scout probe sent to map entry corridor geometry. Vulnerable to all directed weapons.'],
                    ['phase_interceptor', 'Phase Interceptor', 'Fast Interceptor', '🚀', '#38bdf8', 1, 4, 'red_laser', 25, 1, 2, 420, 10, 1.80, 250, 'Medium', 'High-agility corridor skirmisher equipped with a polarized light shield. Armor requires Neon Red Laser piercing focus.'],
                    ['tachyon_cruiser', 'Horizon Tachyon Cruiser', 'Heavy Cruiser', '🛰️', '#ffd166', 2, 8, 'tachyon_lance', 50, 1, 4, 200, 20, 3.00, 500, 'High', 'Reinforced hull traversing relativistic space. Employs reinforced particle shields pierced by Tachyon Lance.'],
                    ['void_guardian', 'Singularity Void Guardian', 'Guardian Frigate', '👾', '#a855f7', 3, 15, 'plasma_torpedo', 70, 1, 6, 150, 35, 2.20, 1000, 'High', 'Ancient anomaly automaton defending the singularity core. Dense armor matrix broken by Quantum Plasma Torpedoes.'],
                    ['quantum_dreadnought', 'Quantum Omega Dreadnought', 'Boss Dreadnought', '💀', '#ef476f', 4, 35, 'quantum_phaser', 90, 1, 15, 90, 60, 1.20, 5000, 'Extreme', 'Colossal multi-phase flagship commanding deep realm forces. Massive energy shields and impervious nanite armor.']
                ];
                $insE = $pdo->prepare("
                    INSERT INTO `wormhole_game_enemies`
                    (`enemy_id`, `enemy_name`, `enemy_class`, `icon`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `fire_rate_seconds`, `score_value`, `threat_level`, `description`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultsE as $e) {
                    $insE->execute($e);
                }
            }

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== '' && $input['stage_level'] !== 'all' 
                ? intval($input['stage_level']) 
                : (isset($_GET['stage_level']) && $_GET['stage_level'] !== '' && $_GET['stage_level'] !== 'all' ? intval($_GET['stage_level']) : null);

            $deviceFilter = isset($input['device_type']) && $input['device_type'] !== '' && $input['device_type'] !== 'all'
                ? strtolower(trim($input['device_type']))
                : (isset($_GET['device_type']) && $_GET['device_type'] !== '' && $_GET['device_type'] !== 'all' ? strtolower(trim($_GET['device_type'])) : null);

            $stmtW = $pdo->query("SELECT * FROM `wormhole_game_weapons` ORDER BY `stage_level` ASC, `is_initial_weapon` DESC, `damage_per_hit` DESC, `id` ASC");
            $weapons = $stmtW->fetchAll(PDO::FETCH_ASSOC);

            $stmtS = $pdo->query("SELECT * FROM `wormhole_game_stages` ORDER BY `stage_level` ASC");
            $stages = $stmtS->fetchAll(PDO::FETCH_ASSOC);

            if ($deviceFilter !== null && $stageFilter !== null) {
                $stmtE = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `stage_level` = :stage AND (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
                $stmtE->execute(['stage' => $stageFilter, 'device' => $deviceFilter]);
            } elseif ($deviceFilter !== null) {
                $stmtE = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
                $stmtE->execute(['device' => $deviceFilter]);
            } elseif ($stageFilter !== null) {
                $stmtE = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `stage_level` = :stage ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
                $stmtE->execute(['stage' => $stageFilter]);
            } else {
                $stmtE = $pdo->query("SELECT * FROM `wormhole_game_enemies` ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
            }
            $enemies = $stmtE->fetchAll(PDO::FETCH_ASSOC);
            foreach ($enemies as &$enRow) {
                $frSec = floatval($enRow['fire_rate_seconds'] ?? 2.0);
                if ($frSec <= 0) $frSec = 2.0;
                $enRow['fire_rate_seconds'] = $frSec;
                $enRow['fire_rate_ms'] = (isset($enRow['fire_rate_ms']) && intval($enRow['fire_rate_ms']) > 0)
                    ? intval($enRow['fire_rate_ms'])
                    : intval(round($frSec * 1000));
                $enRow['fire_rate_times_per_sec'] = round(1000.0 / max(20, $enRow['fire_rate_ms']), 3);

                $wpnsList = [];
                if (!empty($enRow['weapons_json'])) {
                    $decoded = is_string($enRow['weapons_json']) ? json_decode($enRow['weapons_json'], true) : $enRow['weapons_json'];
                    if (is_array($decoded) && count($decoded) > 0) {
                        $wpnsList = $decoded;
                    }
                }
                if (empty($wpnsList)) {
                    $wpnsList = [
                        [
                            'id'                      => 'ew_primary',
                            'name'                    => $enRow['weapon_name'] ?? 'Plasma Pulse',
                            'type'                    => (stripos($enRow['weapon_name'] ?? '', 'missile') !== false || stripos($enRow['weapon_name'] ?? '', 'torpedo') !== false) ? 'missile' : 'beam',
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
                            'fire_rate_times_per_sec' => $enRow['fire_rate_times_per_sec'],
                            'fire_interval_ms'        => $enRow['fire_rate_ms'],
                            'fire_rate_seconds'       => $frSec,
                            'damage'                  => intval($enRow['weapon_damage'] ?? 5),
                            'speed'                   => intval($enRow['weapon_speed'] ?? 450),
                            'color'                   => $enRow['weapon_color'] ?? '#ff0055',
                            'is_enabled'              => 1
                        ]
                    ];
                } else {
                    $wpnsList = array_map(function($w) use ($enRow, $frSec) {
                        return [
                            'id'                      => $w['id'] ?? ('ew_' . uniqid()),
                            'name'                    => $w['name'] ?? ($enRow['weapon_name'] ?? 'Plasma Pulse'),
                            'type'                    => $w['type'] ?? 'beam',
                            'mount'                   => $w['mount'] ?? 'dual_wingtip',
                            'model_url'               => $w['model_url'] ?? '',
                            'model_type'              => $w['model_type'] ?? '',
                            'fire_point_x'            => isset($w['fire_point_x']) ? floatval($w['fire_point_x']) : 0.0,
                            'fire_point_y'            => isset($w['fire_point_y']) ? floatval($w['fire_point_y']) : -0.15,
                            'fire_point_z'            => isset($w['fire_point_z']) ? floatval($w['fire_point_z']) : 1.5,
                            'scale'                   => isset($w['scale']) ? floatval($w['scale']) : 1.0,
                            'size_x'                  => isset($w['size_x']) ? floatval($w['size_x']) : 1.0,
                            'size_y'                  => isset($w['size_y']) ? floatval($w['size_y']) : 1.0,
                            'size_z'                  => isset($w['size_z']) ? floatval($w['size_z']) : 1.0,
                            'fire_rate_times_per_sec' => floatval($w['fire_rate_times_per_sec'] ?? $enRow['fire_rate_times_per_sec'] ?? 2.0),
                            'fire_interval_ms'        => intval($w['fire_interval_ms'] ?? $enRow['fire_rate_ms'] ?? 500),
                            'fire_rate_seconds'       => floatval($w['fire_rate_seconds'] ?? $frSec ?? 0.5),
                            'damage'                  => intval($w['damage'] ?? ($enRow['weapon_damage'] ?? 5)),
                            'speed'                   => intval($w['speed'] ?? ($enRow['weapon_speed'] ?? 450)),
                            'color'                   => $w['color'] ?? ($enRow['weapon_color'] ?? '#ff0055'),
                            'is_enabled'              => isset($w['is_enabled']) ? intval($w['is_enabled']) : 1
                        ];
                    }, $wpnsList);
                }
                $enRow['weapons'] = $wpnsList;
                $enRow['weapons_json'] = json_encode($wpnsList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            }
            unset($enRow);

            // =========================================================================
            // POWER UPS & COMBAT BOOSTS SCHEMA & SEEDING (PROCEDURAL 3D / GLTF / ICONS)
            // =========================================================================
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_powerups` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `powerup_id` VARCHAR(64) NOT NULL,
                  `powerup_name` VARCHAR(100) NOT NULL,
                  `powerup_type` ENUM('health', 'shield') NOT NULL DEFAULT 'health',
                  `restore_both` TINYINT(1) NOT NULL DEFAULT 0,
                  `icon` VARCHAR(32) NOT NULL DEFAULT '💖',
                  `model_3d_type` VARCHAR(64) NOT NULL DEFAULT 'octahedron',
                  `model_3d_url` VARCHAR(255) NOT NULL DEFAULT '',
                  `color_hex` VARCHAR(16) NOT NULL DEFAULT '#00ff88',
                  `scale` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                  `length` DECIMAL(5,2) NOT NULL DEFAULT 2.50,
                  `height` DECIMAL(5,2) NOT NULL DEFAULT 2.50,
                  `depth` DECIMAL(5,2) NOT NULL DEFAULT 2.50,
                  `circumference` DECIMAL(5,2) NOT NULL DEFAULT 6.00,
                  `stage_level` INT NOT NULL DEFAULT 1,
                  `device_type` VARCHAR(64) NOT NULL DEFAULT 'all',
                  `trigger_events` TEXT NOT NULL,
                  `drop_on_enemy_kill` TINYINT(1) NOT NULL DEFAULT 1,
                  `drop_chance_pct` INT NOT NULL DEFAULT 35,
                  `enemy_id` VARCHAR(64) NOT NULL DEFAULT 'all',
                  `boost_percentage` INT NOT NULL DEFAULT 25,
                  `description` TEXT NULL,
                  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_powerup_type` (`powerup_type`),
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_device_type` (`device_type`),
                  INDEX `idx_enemy_id` (`enemy_id`),
                  INDEX `idx_enabled` (`is_enabled`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Robust individual column migration for 3D procedural / GLTF attributes
            $colsToMigrate = [
                'model_3d_type' => "VARCHAR(64) NOT NULL DEFAULT 'octahedron'",
                'model_3d_url' => "VARCHAR(255) NOT NULL DEFAULT ''",
                'scale' => "DECIMAL(5,2) NOT NULL DEFAULT 1.00",
                'length' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'height' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'depth' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'circumference' => "DECIMAL(5,2) NOT NULL DEFAULT 6.00",
                'restore_both' => "TINYINT(1) NOT NULL DEFAULT 0"
            ];
            foreach ($colsToMigrate as $colName => $colDef) {
                try {
                    $checkCols = $pdo->query("SHOW COLUMNS FROM `wormhole_game_powerups` LIKE '{$colName}'")->fetchAll();
                    if (empty($checkCols)) {
                        $pdo->exec("ALTER TABLE `wormhole_game_powerups` ADD COLUMN `{$colName}` {$colDef}");
                    }
                } catch (Throwable $eIgnore) {}
            }

            $countP = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_powerups`");
            if ((int)$countP->fetchColumn() === 0) {
                $defaultsP = [
                    ['health_pack_s1', 'Sub-Space Nanite Repair Kit', 'health', '💖', 'capsule', '', '#00ff88', 1.0, 2.5, 2.5, 2.5, 6.0, 1, 'all', 'Asteroid Debris Belt, Anomaly Alpha Spike', 1, 60, 'void_recon_drone', 25, 'Rapid nano-repair canister synthesized during debris fields and scout incursions. Restores 25% hull integrity.'],
                    ['shield_cell_s1', 'Deflector Shield Overcharger', 'shield', '🛡️', 'octahedron', '', '#00f0ff', 1.0, 2.5, 2.5, 2.5, 6.0, 1, 'all', 'Nav-Beacon Calibration, Plasma Surge Alert', 1, 75, 'all', 30, 'High-frequency deflector charge harmonic. Overcharges magnetic shield buffer by +30%.'],
                    ['health_pack_s2', 'Tachyon Infused Hull Matrix', 'health', '💚', 'dodecahedron', '', '#10b981', 1.0, 2.5, 2.5, 2.5, 6.0, 2, 'all', 'Tachyon Flux Distortions, Interceptor Ambush Wave', 1, 50, 'phase_interceptor', 35, 'Tachyon-stabilized cellular lattice repairing kinetic hull fissures. Restores 35% hull integrity.'],
                    ['shield_cell_s2', 'Ion Shield Harmonizer', 'shield', '🔰', 'torus', '', '#38bdf8', 1.0, 2.8, 2.8, 2.8, 7.0, 2, 'all', 'Ion Cloud Interference, Wormhole Coil Resonance Alert', 1, 70, 'all', 40, 'Re-polarizes phase deflector shields against relativistic radiation. Boosts shield capacity by +40%.'],
                    ['health_pack_s3', 'Graviton Integrity Restorer', 'health', '🧪', 'icosahedron', '', '#a855f7', 1.0, 2.5, 2.5, 2.5, 6.0, 3, 'all', 'Gravitational Tidal Waves, Core Guardian Awakening', 1, 50, 'tachyon_cruiser', 45, 'High-density graviton canister neutralizing gravitational shear. Restores 45% hull armor.'],
                    ['shield_cell_s3', 'Singularity Void Barrier', 'shield', '🔷', 'sphere', '', '#6366f1', 1.0, 3.0, 3.0, 3.0, 7.5, 3, 'all', 'Singularity Probe Deployment, Heavy Antimatter Eruptions', 1, 65, 'void_guardian', 50, 'Generates temporary singularity deflection field. Recharges shields by +50%.'],
                    ['health_pack_s4', 'Quantum Regenerative Core', 'health', '💖', 'icosahedron', '', '#ec4899', 1.1, 2.8, 2.8, 2.8, 7.0, 4, 'all', 'Phase-Shift Anomalies, Quantum Dreadnought Confrontation', 1, 60, 'quantum_dreadnought', 50, 'Sub-atomic phase reconstructor restoring vessel structural integrity by +50%.'],
                    ['shield_cell_s4', 'Omni-Phase Deflector Matrix', 'shield', '🛡️', 'octahedron', '', '#00f0ff', 1.2, 3.2, 3.2, 3.2, 8.0, 4, 'all', 'Multi-Dimensional Phasing, Antimatter Vortex', 1, 80, 'all', 60, 'Multi-frequency quantum deflector battery. Restores +60% deflector shield power.']
                ];
                $insP = $pdo->prepare("
                    INSERT INTO `wormhole_game_powerups`
                    (`powerup_id`, `powerup_name`, `powerup_type`, `icon`, `model_3d_type`, `model_3d_url`, `color_hex`, `scale`, `length`, `height`, `depth`, `circumference`, `stage_level`, `device_type`, `trigger_events`, `drop_on_enemy_kill`, `drop_chance_pct`, `enemy_id`, `boost_percentage`, `description`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultsP as $p) {
                    $insP->execute($p);
                }
            }

            if ($deviceFilter !== null && $stageFilter !== null) {
                $stmtP = $pdo->prepare("SELECT * FROM `wormhole_game_powerups` WHERE (`stage_level` = :stage OR `stage_level` = 0) AND (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `powerup_type` ASC, `id` ASC");
                $stmtP->execute(['stage' => $stageFilter, 'device' => $deviceFilter]);
            } elseif ($deviceFilter !== null) {
                $stmtP = $pdo->prepare("SELECT * FROM `wormhole_game_powerups` WHERE (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `powerup_type` ASC, `id` ASC");
                $stmtP->execute(['device' => $deviceFilter]);
            } elseif ($stageFilter !== null) {
                $stmtP = $pdo->prepare("SELECT * FROM `wormhole_game_powerups` WHERE (`stage_level` = :stage OR `stage_level` = 0) ORDER BY `stage_level` ASC, `powerup_type` ASC, `id` ASC");
                $stmtP->execute(['stage' => $stageFilter]);
            } else {
                $stmtP = $pdo->query("SELECT * FROM `wormhole_game_powerups` ORDER BY `stage_level` ASC, `powerup_type` ASC, `id` ASC");
            }
            $powerups = $stmtP->fetchAll(PDO::FETCH_ASSOC);

            // =========================================================================
            // ENVIRONMENT & COSMIC ASSETS INITIALIZATION & QUERY
            // =========================================================================
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `wormhole_game_environments` (
                      `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                      `env_id` VARCHAR(64) NOT NULL,
                      `env_name` VARCHAR(100) NOT NULL,
                      `env_category` VARCHAR(50) NOT NULL DEFAULT 'wormhole_singularity',
                      `stage_level` INT NOT NULL DEFAULT 1,
                      `device_type` VARCHAR(32) NOT NULL DEFAULT 'all',
                      `model_3d_type` VARCHAR(64) NOT NULL DEFAULT 'procedural_wormhole',
                      `model_3d_url` VARCHAR(255) NULL,
                      `image_asset_url` VARCHAR(255) NULL,
                      `image_asset_type` VARCHAR(50) NOT NULL DEFAULT 'corona_sprite',
                      `scale` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                      `event_horizon_radius` DECIMAL(6,2) NOT NULL DEFAULT 7.50,
                      `accretion_disk_radius` DECIMAL(6,2) NOT NULL DEFAULT 38.00,
                      `length` DECIMAL(6,2) NOT NULL DEFAULT 300.00,
                      `height` DECIMAL(6,2) NOT NULL DEFAULT 80.00,
                      `depth` DECIMAL(6,2) NOT NULL DEFAULT 300.00,
                      `circumference` DECIMAL(6,2) NOT NULL DEFAULT 47.12,
                      `color_primary` VARCHAR(16) NOT NULL DEFAULT '#00f0ff',
                      `color_edge` VARCHAR(16) NOT NULL DEFAULT '#003366',
                      `color_core` VARCHAR(16) NOT NULL DEFAULT '#00f0ff',
                      `color_hot` VARCHAR(16) NOT NULL DEFAULT '#d6ffff',
                      `color_halo` VARCHAR(16) NOT NULL DEFAULT '#00f0ff',
                      `ambient_light` VARCHAR(16) NOT NULL DEFAULT '#002233',
                      `center_light` VARCHAR(16) NOT NULL DEFAULT '#00f0ff',
                      `rotation_speed` DECIMAL(5,3) NOT NULL DEFAULT 0.650,
                      `distortion_intensity` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                      `particle_count` INT NOT NULL DEFAULT 4500,
                      `quick_effect_primary` VARCHAR(64) NOT NULL DEFAULT 'plasma_aura',
                      `quick_effect_secondary` VARCHAR(64) NOT NULL DEFAULT 'sparks_burst',
                      `quick_effect_color` VARCHAR(16) NOT NULL DEFAULT '#00f0ff',
                      `quick_effect_intensity` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
                      `quick_effect_speed` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
                      `description` TEXT NULL,
                      `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      UNIQUE KEY `uq_env_stage_dev` (`env_id`, `stage_level`, `device_type`),
                      INDEX `idx_stage_level` (`stage_level`),
                      INDEX `idx_device_type` (`device_type`),
                      INDEX `idx_category` (`env_category`),
                      INDEX `idx_enabled` (`is_enabled`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ");
                $chkEnv = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_environments`");
                if ((int)$chkEnv->fetchColumn() === 0) {
                    $defaultEnvironments = [
                        ['warp_singularity_s1', 'Warp Cyan Singularity & Inflow Vortex', 'wormhole_singularity', 1, 'all', 'procedural_wormhole', '', 'desktop/warp_origin_images/singularity_corona.png', 'corona_sprite', 1.00, 7.50, 38.00, 300.00, 80.00, 300.00, 47.12, '#00f0ff', '#003366', '#00f0ff', '#d6ffff', '#00f0ff', '#002233', '#00f0ff', 0.650, 1.00, 4500, 'plasma_aura', 'sparks_burst', '#00f0ff', 1.00, 1.00, 'Initial entry vector into unstable hyperspace corridor with plasma aura.', 1],
                        ['event_horizon_singularity_s2', 'Amber Event Horizon Relativistic Singularity', 'wormhole_singularity', 2, 'all', 'procedural_wormhole', '', 'desktop/event_horizon_images/singularity_corona.png', 'corona_sprite', 1.15, 8.20, 42.00, 320.00, 85.00, 320.00, 51.52, '#ffd166', '#663300', '#ff9900', '#fff4d6', '#ffaa00', '#331a00', '#ffaa00', 0.850, 1.35, 5200, 'tachyon_trail', 'plasma_aura', '#ffd166', 1.20, 1.15, 'High-velocity light-horizon boundary enveloped in incandescent amber relativistic shear.', 1],
                        ['singularity_core_s3', 'Void Violet Gravitational Collapse Singularity', 'wormhole_singularity', 3, 'all', 'procedural_wormhole', '', 'desktop/singularity_core_images/singularity_corona.png', 'corona_sprite', 1.30, 9.00, 46.00, 350.00, 90.00, 350.00, 56.55, '#c084fc', '#330066', '#9933ff', '#f5e6ff', '#a855f7', '#1a0033', '#a855f7', 1.100, 1.65, 6000, 'gravitational_vortex', 'arc_lightning', '#c084fc', 1.40, 1.30, 'Extreme gravitational collapse boundary with violent space-time tearing.', 1],
                        ['quantum_singularity_s4', 'Quantum Phasor Magenta Singularity', 'wormhole_singularity', 4, 'all', 'procedural_wormhole', '', 'desktop/quantum_realm_images/singularity_corona.png', 'corona_sprite', 1.45, 10.00, 50.00, 380.00, 100.00, 380.00, 62.83, '#f43f5e', '#660022', '#ff0055', '#ffd6e6', '#ff0066', '#330011', '#ff1166', 1.350, 2.00, 6800, 'quantum_phase_glow', 'energy_shield_pulse', '#f43f5e', 1.60, 1.50, 'Sub-quantum realm boundary with multidimensional reality fractures.', 1]
                    ];
                    $insEnv = $pdo->prepare("
                        INSERT INTO `wormhole_game_environments`
                        (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    foreach ($defaultEnvironments as $de) {
                        $insEnv->execute($de);
                    }
                }
            } catch (Throwable $eEnv) {
                error_log("wormhole_game_environments init error: " . $eEnv->getMessage());
            }

            if ($deviceFilter !== null && $stageFilter !== null) {
                $stmtEnv = $pdo->prepare("SELECT * FROM `wormhole_game_environments` WHERE (`stage_level` = :stage OR `stage_level` = 0) AND (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `id` ASC");
                $stmtEnv->execute(['stage' => $stageFilter, 'device' => $deviceFilter]);
            } elseif ($deviceFilter !== null) {
                $stmtEnv = $pdo->prepare("SELECT * FROM `wormhole_game_environments` WHERE (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `id` ASC");
                $stmtEnv->execute(['device' => $deviceFilter]);
            } elseif ($stageFilter !== null) {
                $stmtEnv = $pdo->prepare("SELECT * FROM `wormhole_game_environments` WHERE (`stage_level` = :stage OR `stage_level` = 0) ORDER BY `stage_level` ASC, `id` ASC");
                $stmtEnv->execute(['stage' => $stageFilter]);
            } else {
                $stmtEnv = $pdo->query("SELECT * FROM `wormhole_game_environments` ORDER BY `stage_level` ASC, `id` ASC");
            }
            $environments = $stmtEnv ? $stmtEnv->fetchAll(PDO::FETCH_ASSOC) : [];

            sendDeviceResponse(true, 'Game manager database values loaded successfully', [
                'stage_level' => $stageFilter,
                'device_type' => $deviceFilter,
                'weapons' => $weapons,
                'stages' => $stages,
                'enemies' => $enemies,
                'powerups' => $powerups,
                'environments' => $environments,
                'total_weapons' => count($weapons),
                'total_stages' => count($stages),
                'total_enemies' => count($enemies),
                'total_powerups' => count($powerups),
                'total_environments' => count($environments)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to fetch game manager data: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // PUBLIC / TELEMETRY: GET GAME WEAPONS ARSENAL
    // =========================================================================
    if ($action === 'get_game_weapons' || $action === 'get_public_game_weapons') {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_weapons` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `weapon_id` VARCHAR(64) NOT NULL UNIQUE,
                  `weapon_name` VARCHAR(100) NOT NULL,
                  `description` VARCHAR(255) NULL,
                  `icon` VARCHAR(32) DEFAULT '⚡',
                  `color_hex` VARCHAR(16) DEFAULT '#ff3344',
                  `stage_level` INT NOT NULL DEFAULT 1,
                  `is_initial_weapon` TINYINT(1) NOT NULL DEFAULT 0,
                  `is_acquirable` TINYINT(1) NOT NULL DEFAULT 1,
                  `acquire_event` VARCHAR(100) NOT NULL DEFAULT 'default_start',
                  `energy_drain_pct` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
                  `can_overheat` TINYINT(1) NOT NULL DEFAULT 1,
                  `cooldown_seconds` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
                  `damage_per_hit` INT NOT NULL DEFAULT 1,
                  `bullet_speed` INT NOT NULL DEFAULT 600,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_is_initial` (`is_initial_weapon`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            $countStmt = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_weapons`");
            if ((int)$countStmt->fetchColumn() === 0) {
                $defaults = [
                    ['red_laser', 'Red Laser', 'Standard high-cadence plasma emitter with twin focus beams.', '🔴', '#ff2244', 1, 1, 1, 'default_start', 10.00, 1, 5.00, 2, 550],
                    ['blue_laser', 'Blue Laser', 'High-impact coherent photon beam with deep penetration.', '🔵', '#00d4ff', 1, 0, 1, 'default_start', 30.00, 1, 10.00, 1, 700],
                    ['tachyon_lance', 'Tachyon Lance', 'Superluminal phase particle array unlocked after horizon traversal.', '⚡', '#a855f7', 2, 1, 1, 'warp_horizon_jump', 20.00, 1, 7.00, 3, 850],
                    ['plasma_torpedo', 'Plasma Torpedo', 'Heavy magnetic payload causing massive kinetic shockwave without overheating.', '💣', '#f59e0b', 3, 0, 1, 'singularity_core_probe', 40.00, 0, 0.00, 5, 450],
                    ['quantum_phaser', 'Quantum Phaser', 'Sub-atomic pulse rifle optimized for deep singularity warfare.', '✨', '#10b981', 4, 1, 1, 'deep_core_breakthrough', 15.00, 1, 6.00, 4, 950]
                ];
                $ins = $pdo->prepare("
                    INSERT INTO `wormhole_game_weapons`
                    (`weapon_id`, `weapon_name`, `description`, `icon`, `color_hex`, `stage_level`, `is_initial_weapon`, `is_acquirable`, `acquire_event`, `energy_drain_pct`, `can_overheat`, `cooldown_seconds`, `damage_per_hit`, `bullet_speed`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaults as $d) {
                    $ins->execute($d);
                }
            }

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== '' ? intval($input['stage_level']) : (isset($_GET['stage_level']) ? intval($_GET['stage_level']) : null);
            if ($stageFilter !== null && $stageFilter > 0) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_weapons` WHERE `stage_level` = :stage ORDER BY `is_initial_weapon` DESC, `damage_per_hit` DESC, `id` ASC");
                $stmt->execute(['stage' => $stageFilter]);
            } else {
                $stmt = $pdo->query("SELECT * FROM `wormhole_game_weapons` ORDER BY `stage_level` ASC, `is_initial_weapon` DESC, `damage_per_hit` DESC, `id` ASC");
            }
            $weapons = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stagesStmt = $pdo->query("SELECT DISTINCT `stage_level` FROM `wormhole_game_weapons` ORDER BY `stage_level` ASC");
            $stages = $stagesStmt->fetchAll(PDO::FETCH_COLUMN);

            sendDeviceResponse(true, 'Game weapons loaded successfully', [
                'weapons' => $weapons,
                'stages'  => $stages,
                'total'   => count($weapons)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to fetch game weapons: ' . $e->getMessage(), [], 500);
        }
    }

        // =========================================================================
    // PUBLIC / TELEMETRY: GET GAME STAGES
    // =========================================================================
    if ($action === 'get_game_stages' || $action === 'get_public_game_stages') {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_stages` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `stage_level` INT NOT NULL UNIQUE,
                  `stage_name` VARCHAR(100) NOT NULL,
                  `environment_theme` VARCHAR(100) DEFAULT 'Warp Cyan Corridor',
                  `events_within_level` TEXT NOT NULL,
                  `end_level_event` VARCHAR(150) NOT NULL,
                  `mission_objectives` TEXT NULL,
                  `required_enemy_kills` INT NOT NULL DEFAULT 10,
                  `warp_target_distance` INT NOT NULL DEFAULT 50000,
                  `description` TEXT NULL,
                  `par_score` INT NOT NULL DEFAULT 5000,
                  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_enabled` (`is_enabled`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Auto-migrate wormhole_game_stages columns if missing
            try {
                $colCheck = $pdo->query("SHOW COLUMNS FROM `wormhole_game_stages` LIKE 'mission_objectives'")->fetch();
                if (!$colCheck) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_stages` ADD COLUMN `mission_objectives` TEXT NULL AFTER `end_level_event`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_stages` ADD COLUMN `required_enemy_kills` INT NOT NULL DEFAULT 10 AFTER `mission_objectives`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_stages` ADD COLUMN `warp_target_distance` INT NOT NULL DEFAULT 50000 AFTER `required_enemy_kills`");
                    @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 10 Void Recon Drones and pilot vessel to within < 50,000 KM of singularity core to unlock warp.', `required_enemy_kills` = 10, `warp_target_distance` = 50000 WHERE `stage_level` = 1");
                    @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.', `required_enemy_kills` = 15, `warp_target_distance` = 35000 WHERE `stage_level` = 2");
                    @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.', `required_enemy_kills` = 20, `warp_target_distance` = 20000 WHERE `stage_level` = 3");
                    @$pdo->exec("UPDATE `wormhole_game_stages` SET `mission_objectives` = 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.', `required_enemy_kills` = 25, `warp_target_distance` = 10000 WHERE `stage_level` = 4");
                }
            } catch (Throwable $eMig) {
                error_log("Stages device migration warning: " . $eMig->getMessage());
            }

            $countStmt = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_stages`");
            if ((int)$countStmt->fetchColumn() === 0) {
                $defaultStages = [
                    [1, 'Warp Origin', 'Warp Cyan Corridor', 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert', 'Warp Horizon Jump Gate Initialized', 'Destroy 10 Void Recon Drones and pilot vessel to within < 50,000 KM of singularity core to unlock warp.', 10, 50000, 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.', 5000, 1],
                    [2, 'Event Horizon', 'Event Horizon Amber', 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert', 'Singularity Perimeter Breach', 'Destroy 15 Tachyon Cruisers & Interceptors and reach distance < 35,000 KM of light horizon.', 15, 35000, 'High-velocity relativistic light-horizon boundary with intense magnetic shear.', 12000, 1],
                    [3, 'Singularity Core', 'Singularity Void Violet', 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening', 'Core Collapse Breakthrough', 'Destroy 20 Gravitational Void Probes and penetrate collapse perimeter < 20,000 KM.', 20, 20000, 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.', 25000, 1],
                    [4, 'Quantum Realm', 'Quantum Phasor Magenta', 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation', 'Quantum Conduit Realignment & Safe Extraction', 'Annihilate 25 Quantum Dreadnoughts and reach quantum extraction conduit < 10,000 KM.', 25, 10000, 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.', 50000, 1]
                ];
                $ins = $pdo->prepare("
                    INSERT INTO `wormhole_game_stages`
                    (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `mission_objectives`, `required_enemy_kills`, `warp_target_distance`, `description`, `par_score`, `is_enabled`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultStages as $s) {
                    $ins->execute($s);
                }
            }

            $stmt = $pdo->query("SELECT * FROM `wormhole_game_stages` ORDER BY `stage_level` ASC");
            $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendDeviceResponse(true, 'Game stages loaded successfully', [
                'stages' => $stages,
                'total'  => count($stages)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to fetch game stages: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // PUBLIC / TELEMETRY: GET GAME ENEMIES
    // =========================================================================
    if ($action === 'get_game_enemies' || $action === 'get_public_game_enemies') {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_enemies` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `enemy_id` VARCHAR(64) NOT NULL UNIQUE,
                  `enemy_name` VARCHAR(100) NOT NULL,
                  `enemy_class` VARCHAR(50) DEFAULT 'Drone',
                  `icon` VARCHAR(32) DEFAULT '🛸',
                  `model_3d_type` VARCHAR(64) NOT NULL DEFAULT 'scout_drone',
                  `model_3d_url` VARCHAR(255) NULL,
                  `scale` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                  `length` DECIMAL(6,2) NOT NULL DEFAULT 3.00,
                  `height` DECIMAL(6,2) NOT NULL DEFAULT 1.50,
                  `depth` DECIMAL(6,2) NOT NULL DEFAULT 3.00,
                  `circumference` DECIMAL(6,2) NOT NULL DEFAULT 6.00,
                  `color_hex` VARCHAR(16) DEFAULT '#ef476f',
                  `stage_level` INT NOT NULL DEFAULT 1,
                  `hits_to_destroy` INT NOT NULL DEFAULT 2,
                  `piercing_weapon_id` VARCHAR(64) NOT NULL DEFAULT 'any',
                  `armor_strength` INT NOT NULL DEFAULT 10,
                  `has_force_field` TINYINT(1) NOT NULL DEFAULT 0,
                  `shield_capacity_hits` INT NOT NULL DEFAULT 0,
                  `movement_speed` INT NOT NULL DEFAULT 250,
                  `attack_damage` INT NOT NULL DEFAULT 5,
                  `weapon_name` VARCHAR(100) NOT NULL DEFAULT 'Plasma Pulse',
                  `weapon_damage` INT NOT NULL DEFAULT 5,
                  `weapon_speed` INT NOT NULL DEFAULT 450,
                  `weapon_color` VARCHAR(16) NOT NULL DEFAULT '#ff2255',
                  `weapons_json` LONGTEXT NULL,
                  `fire_rate_seconds` DECIMAL(5,2) NOT NULL DEFAULT 2.00,
                  `fire_rate_ms` INT NOT NULL DEFAULT 2000,
                  `score_value` INT NOT NULL DEFAULT 100,
                  `threat_level` ENUM('Low', 'Medium', 'High', 'Extreme') NOT NULL DEFAULT 'Low',
                  `description` TEXT NULL,
                  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_piercing_weapon` (`piercing_weapon_id`),
                  INDEX `idx_threat` (`threat_level`),
                  INDEX `idx_enabled` (`is_enabled`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Auto-migrate wormhole_game_enemies columns if missing
            try {
                $colCheckE = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'model_3d_type'")->fetch();
                if (!$colCheckE) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `model_3d_type` VARCHAR(64) NOT NULL DEFAULT 'scout_drone' AFTER `icon`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `model_3d_url` VARCHAR(255) NULL AFTER `model_3d_type`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `weapon_name` VARCHAR(100) NOT NULL DEFAULT 'Plasma Pulse' AFTER `attack_damage`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `weapon_damage` INT NOT NULL DEFAULT 5 AFTER `weapon_name`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `weapon_speed` INT NOT NULL DEFAULT 450 AFTER `weapon_damage`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `weapon_color` VARCHAR(16) NOT NULL DEFAULT '#ff2255' AFTER `weapon_speed`");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_type` = 'scout_drone', `weapon_name` = 'Plasma Pulse', `weapon_damage` = 5, `weapon_speed` = 450, `weapon_color` = '#00f0ff' WHERE `enemy_id` = 'void_recon_drone'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_type` = 'interceptor', `weapon_name` = 'Dual Ion Cannon', `weapon_damage` = 10, `weapon_speed` = 550, `weapon_color` = '#38bdf8' WHERE `enemy_id` = 'phase_interceptor'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_type` = 'cruiser', `weapon_name` = 'Tachyon Beam', `weapon_damage` = 20, `weapon_speed` = 600, `weapon_color` = '#ffd166' WHERE `enemy_id` = 'tachyon_cruiser'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_type` = 'singularity_probe', `weapon_name` = 'Void Disruptor', `weapon_damage` = 35, `weapon_speed` = 400, `weapon_color` = '#a855f7' WHERE `enemy_id` = 'void_guardian'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_type` = 'dreadnought', `weapon_name` = 'Quantum Annihilator', `weapon_damage` = 60, `weapon_speed` = 650, `weapon_color` = '#ef476f' WHERE `enemy_id` = 'quantum_dreadnought'");
                }

                $colCheckScale = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'scale'")->fetch();
                if (!$colCheckScale) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `scale` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `model_3d_url`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `length` DECIMAL(6,2) NOT NULL DEFAULT 3.00 AFTER `scale`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `height` DECIMAL(6,2) NOT NULL DEFAULT 1.50 AFTER `length`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `depth` DECIMAL(6,2) NOT NULL DEFAULT 3.00 AFTER `height`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `circumference` DECIMAL(6,2) NOT NULL DEFAULT 6.00 AFTER `depth`");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `scale` = 1.00, `length` = 2.80, `height` = 2.80, `depth` = 2.80, `circumference` = 8.80 WHERE `enemy_id` = 'void_recon_drone'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `scale` = 1.00, `length` = 4.20, `height` = 1.30, `depth` = 3.40, `circumference` = 5.00 WHERE `enemy_id` = 'phase_interceptor'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `scale` = 1.25, `length` = 3.50, `height` = 2.50, `depth` = 5.50, `circumference` = 10.50 WHERE `enemy_id` = 'tachyon_cruiser'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `scale` = 1.20, `length` = 3.80, `height` = 3.80, `depth` = 3.80, `circumference` = 11.94 WHERE `enemy_id` = 'void_guardian'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `scale` = 1.60, `length` = 7.00, `height` = 3.20, `depth` = 6.00, `circumference` = 15.00 WHERE `enemy_id` = 'quantum_dreadnought'");
                }

                $colCheckWeaponsDev2 = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'weapons_json'")->fetch();
                if (!$colCheckWeaponsDev2) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `weapons_json` LONGTEXT NULL AFTER `weapon_color`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `fire_rate_ms` INT NOT NULL DEFAULT 2000 AFTER `fire_rate_seconds`");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `fire_rate_ms` = ROUND(COALESCE(`fire_rate_seconds`, 2.0) * 1000)");
                }
            } catch (Throwable $eMigE) {
                error_log("Enemies device migration warning: " . $eMigE->getMessage());
            }

            $countStmt = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_enemies`");
            if ((int)$countStmt->fetchColumn() === 0) {
                $defaultEnemies = [
                    ['void_recon_drone', 'Void Recon Drone', 'Scout Drone', '🛸', 'scout_drone', '', 1.00, 2.80, 2.80, 2.80, 8.80, '#00f0ff', 1, 2, 'any', 10, 0, 0, 320, 5, 'Plasma Pulse', 5, 450, '#00f0ff', 2.50, 100, 'Low', 'Light autonomous scout probe sent to map entry corridor geometry. Vulnerable to all directed weapons.'],
                    ['phase_interceptor', 'Phase Interceptor', 'Fast Interceptor', '🚀', 'interceptor', '', 1.00, 4.20, 1.30, 3.40, 5.00, '#38bdf8', 1, 4, 'red_laser', 25, 1, 2, 420, 10, 'Dual Ion Cannon', 10, 550, '#38bdf8', 1.80, 250, 'Medium', 'High-agility corridor skirmisher equipped with a polarized light shield. Armor requires Neon Red Laser piercing focus.'],
                    ['tachyon_cruiser', 'Horizon Tachyon Cruiser', 'Heavy Cruiser', '🛰️', 'cruiser', '', 1.25, 3.50, 2.50, 5.50, 10.50, '#ffd166', 2, 8, 'tachyon_lance', 50, 1, 4, 200, 20, 'Tachyon Beam', 20, 600, '#ffd166', 3.00, 500, 'High', 'Reinforced hull traversing relativistic space. Employs reinforced particle shields pierced by Tachyon Lance.'],
                    ['void_guardian', 'Singularity Void Guardian', 'Guardian Frigate', '👾', 'singularity_probe', '', 1.20, 3.80, 3.80, 3.80, 11.94, '#a855f7', 3, 15, 'plasma_torpedo', 70, 1, 6, 150, 35, 'Void Disruptor', 35, 400, '#a855f7', 2.20, 1000, 'High', 'Ancient anomaly automaton defending the singularity core. Dense armor matrix broken by Quantum Plasma Torpedoes.'],
                    ['quantum_dreadnought', 'Quantum Omega Dreadnought', 'Boss Dreadnought', '💀', 'dreadnought', '', 1.60, 7.00, 3.20, 6.00, 15.00, '#ef476f', 4, 35, 'quantum_phaser', 90, 1, 15, 90, 60, 'Quantum Annihilator', 60, 650, '#ef476f', 1.20, 5000, 'Extreme', 'Colossal multi-phase flagship commanding deep realm forces. Massive energy shields and impervious nanite armor.']
                ];

                $ins = $pdo->prepare("
                    INSERT INTO `wormhole_game_enemies`
                    (`enemy_id`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `fire_rate_seconds`, `score_value`, `threat_level`, `description`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultEnemies as $e) {
                    $ins->execute($e);
                }
            }

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== 'all' && $input['stage_level'] !== '' ? intval($input['stage_level']) : (isset($_GET['stage_level']) && $_GET['stage_level'] !== 'all' && $_GET['stage_level'] !== '' ? intval($_GET['stage_level']) : null);
            $deviceFilter = isset($input['device_type']) && $input['device_type'] !== 'all' && $input['device_type'] !== '' ? strtolower(trim($input['device_type'])) : (isset($_GET['device_type']) && $_GET['device_type'] !== 'all' && $_GET['device_type'] !== '' ? strtolower(trim($_GET['device_type'])) : null);

            if ($stageFilter !== null && $stageFilter > 0 && $deviceFilter !== null) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `stage_level` = :stage AND (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
                $stmt->execute(['stage' => $stageFilter, 'device' => $deviceFilter]);
            } elseif ($stageFilter !== null && $stageFilter > 0) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `stage_level` = :stage ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
                $stmt->execute(['stage' => $stageFilter]);
            } elseif ($deviceFilter !== null) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE (`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '') ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
                $stmt->execute(['device' => $deviceFilter]);
            } else {
                $stmt = $pdo->query("SELECT * FROM `wormhole_game_enemies` ORDER BY `stage_level` ASC, `hits_to_destroy` ASC");
            }
            $enemies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($enemies as &$enRow) {
                $frSec = floatval($enRow['fire_rate_seconds'] ?? 2.0);
                if ($frSec <= 0) $frSec = 2.0;
                $enRow['fire_rate_seconds'] = $frSec;
                $enRow['fire_rate_ms'] = (isset($enRow['fire_rate_ms']) && intval($enRow['fire_rate_ms']) > 0)
                    ? intval($enRow['fire_rate_ms'])
                    : intval(round($frSec * 1000));
                $enRow['fire_rate_times_per_sec'] = round(1000.0 / max(20, $enRow['fire_rate_ms']), 3);

                $wpnsList = [];
                if (!empty($enRow['weapons_json'])) {
                    $decoded = is_string($enRow['weapons_json']) ? json_decode($enRow['weapons_json'], true) : $enRow['weapons_json'];
                    if (is_array($decoded) && count($decoded) > 0) {
                        $wpnsList = $decoded;
                    }
                }
                if (empty($wpnsList)) {
                    $wpnsList = [
                        [
                            'id'                      => 'ew_primary',
                            'name'                    => $enRow['weapon_name'] ?? 'Plasma Pulse',
                            'type'                    => (stripos($enRow['weapon_name'] ?? '', 'missile') !== false || stripos($enRow['weapon_name'] ?? '', 'torpedo') !== false) ? 'missile' : 'beam',
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
                            'fire_rate_times_per_sec' => $enRow['fire_rate_times_per_sec'],
                            'fire_interval_ms'        => $enRow['fire_rate_ms'],
                            'fire_rate_seconds'       => $frSec,
                            'damage'                  => intval($enRow['weapon_damage'] ?? 5),
                            'speed'                   => intval($enRow['weapon_speed'] ?? 450),
                            'color'                   => $enRow['weapon_color'] ?? '#ff0055',
                            'is_enabled'              => 1
                        ]
                    ];
                } else {
                    $wpnsList = array_map(function($w) use ($enRow, $frSec) {
                        return [
                            'id'                      => $w['id'] ?? ('ew_' . uniqid()),
                            'name'                    => $w['name'] ?? ($enRow['weapon_name'] ?? 'Plasma Pulse'),
                            'type'                    => $w['type'] ?? 'beam',
                            'mount'                   => $w['mount'] ?? 'dual_wingtip',
                            'model_url'               => $w['model_url'] ?? '',
                            'model_type'              => $w['model_type'] ?? '',
                            'fire_point_x'            => isset($w['fire_point_x']) ? floatval($w['fire_point_x']) : 0.0,
                            'fire_point_y'            => isset($w['fire_point_y']) ? floatval($w['fire_point_y']) : -0.15,
                            'fire_point_z'            => isset($w['fire_point_z']) ? floatval($w['fire_point_z']) : 1.5,
                            'scale'                   => isset($w['scale']) ? floatval($w['scale']) : 1.0,
                            'size_x'                  => isset($w['size_x']) ? floatval($w['size_x']) : 1.0,
                            'size_y'                  => isset($w['size_y']) ? floatval($w['size_y']) : 1.0,
                            'size_z'                  => isset($w['size_z']) ? floatval($w['size_z']) : 1.0,
                            'fire_rate_times_per_sec' => floatval($w['fire_rate_times_per_sec'] ?? $enRow['fire_rate_times_per_sec'] ?? 2.0),
                            'fire_interval_ms'        => intval($w['fire_interval_ms'] ?? $enRow['fire_rate_ms'] ?? 500),
                            'fire_rate_seconds'       => floatval($w['fire_rate_seconds'] ?? $frSec ?? 0.5),
                            'damage'                  => intval($w['damage'] ?? ($enRow['weapon_damage'] ?? 5)),
                            'speed'                   => intval($w['speed'] ?? ($enRow['weapon_speed'] ?? 450)),
                            'color'                   => $w['color'] ?? ($enRow['weapon_color'] ?? '#ff0055'),
                            'is_enabled'              => isset($w['is_enabled']) ? intval($w['is_enabled']) : 1
                        ];
                    }, $wpnsList);
                }
                $enRow['weapons'] = $wpnsList;
                $enRow['weapons_json'] = json_encode($wpnsList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            }
            unset($enRow);

            sendDeviceResponse(true, 'Game enemies loaded successfully', [
                'stage_level' => $stageFilter,
                'device_type' => $deviceFilter,
                'enemies' => $enemies,
                'total'   => count($enemies)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to fetch game enemies: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // PUBLIC / TELEMETRY: GET GAME POWER UPS
    // =========================================================================
    if ($action === 'get_game_powerups' || $action === 'get_public_game_powerups') {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_powerups` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `powerup_id` VARCHAR(64) NOT NULL,
                  `powerup_name` VARCHAR(100) NOT NULL,
                  `powerup_type` ENUM('health', 'shield') NOT NULL DEFAULT 'health',
                  `restore_both` TINYINT(1) NOT NULL DEFAULT 0,
                  `icon` VARCHAR(32) NOT NULL DEFAULT '💖',
                  `model_3d_type` VARCHAR(64) NOT NULL DEFAULT 'octahedron',
                  `model_3d_url` VARCHAR(255) NOT NULL DEFAULT '',
                  `color_hex` VARCHAR(16) NOT NULL DEFAULT '#00ff88',
                  `scale` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                  `length` DECIMAL(5,2) NOT NULL DEFAULT 2.50,
                  `height` DECIMAL(5,2) NOT NULL DEFAULT 2.50,
                  `depth` DECIMAL(5,2) NOT NULL DEFAULT 2.50,
                  `circumference` DECIMAL(5,2) NOT NULL DEFAULT 6.00,
                  `stage_level` INT NOT NULL DEFAULT 1,
                  `device_type` VARCHAR(64) NOT NULL DEFAULT 'all',
                  `trigger_events` TEXT NOT NULL,
                  `drop_on_enemy_kill` TINYINT(1) NOT NULL DEFAULT 1,
                  `drop_chance_pct` INT NOT NULL DEFAULT 60,
                  `enemy_id` VARCHAR(64) NOT NULL DEFAULT 'all',
                  `boost_percentage` INT NOT NULL DEFAULT 25,
                  `description` TEXT NULL,
                  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX `idx_powerup_type` (`powerup_type`),
                  INDEX `idx_stage_level` (`stage_level`),
                  INDEX `idx_device_type` (`device_type`),
                  INDEX `idx_enemy_id` (`enemy_id`),
                  INDEX `idx_enabled` (`is_enabled`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Robust individual column migration for 3D procedural / GLTF attributes
            $colsToMigrate = [
                'model_3d_type' => "VARCHAR(64) NOT NULL DEFAULT 'octahedron'",
                'model_3d_url' => "VARCHAR(255) NOT NULL DEFAULT ''",
                'scale' => "DECIMAL(5,2) NOT NULL DEFAULT 1.00",
                'length' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'height' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'depth' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'circumference' => "DECIMAL(5,2) NOT NULL DEFAULT 6.00",
                'restore_both' => "TINYINT(1) NOT NULL DEFAULT 0"
            ];
            foreach ($colsToMigrate as $colName => $colDef) {
                try {
                    $checkCols = $pdo->query("SHOW COLUMNS FROM `wormhole_game_powerups` LIKE '{$colName}'")->fetchAll();
                    if (empty($checkCols)) {
                        $pdo->exec("ALTER TABLE `wormhole_game_powerups` ADD COLUMN `{$colName}` {$colDef}");
                    }
                } catch (Throwable $eIgnore) {}
            }

            $countP = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_powerups`");
            if ((int)$countP->fetchColumn() === 0) {
                $defaultsP = [
                    ['health_pack_s1', 'Sub-Space Nanite Repair Kit', 'health', '💖', 'capsule', '', '#00ff88', 1.0, 2.5, 2.5, 2.5, 6.0, 1, 'all', 'Asteroid Debris Belt, Anomaly Alpha Spike', 1, 60, 'void_recon_drone', 25, 'Rapid nano-repair canister synthesized during debris fields and scout incursions. Restores 25% hull integrity.'],
                    ['shield_cell_s1', 'Deflector Shield Overcharger', 'shield', '🛡️', 'octahedron', '', '#00f0ff', 1.0, 2.5, 2.5, 2.5, 6.0, 1, 'all', 'Nav-Beacon Calibration, Plasma Surge Alert', 1, 75, 'all', 30, 'High-frequency deflector charge harmonic. Overcharges magnetic shield buffer by +30%.'],
                    ['health_pack_s2', 'Tachyon Infused Hull Matrix', 'health', '💚', 'dodecahedron', '', '#10b981', 1.0, 2.5, 2.5, 2.5, 6.0, 2, 'all', 'Tachyon Flux Distortions, Interceptor Ambush Wave', 1, 50, 'phase_interceptor', 35, 'Tachyon-stabilized cellular lattice repairing kinetic hull fissures. Restores 35% hull integrity.'],
                    ['shield_cell_s2', 'Ion Shield Harmonizer', 'shield', '🔰', 'torus', '', '#38bdf8', 1.0, 2.8, 2.8, 2.8, 7.0, 2, 'all', 'Ion Cloud Interference, Wormhole Coil Resonance Alert', 1, 70, 'all', 40, 'Re-polarizes phase deflector shields against relativistic radiation. Boosts shield capacity by +40%.'],
                    ['health_pack_s3', 'Graviton Integrity Restorer', 'health', '🧪', 'icosahedron', '', '#a855f7', 1.0, 2.5, 2.5, 2.5, 6.0, 3, 'all', 'Gravitational Tidal Waves, Core Guardian Awakening', 1, 50, 'tachyon_cruiser', 45, 'High-density graviton canister neutralizing gravitational shear. Restores 45% hull armor.'],
                    ['shield_cell_s3', 'Singularity Void Barrier', 'shield', '🔷', 'sphere', '', '#6366f1', 1.0, 3.0, 3.0, 3.0, 7.5, 3, 'all', 'Singularity Probe Deployment, Heavy Antimatter Eruptions', 1, 65, 'void_guardian', 50, 'Generates temporary singularity deflection field. Recharges shields by +50%.'],
                    ['health_pack_s4', 'Quantum Regenerative Core', 'health', '💖', 'icosahedron', '', '#ec4899', 1.1, 2.8, 2.8, 2.8, 7.0, 4, 'all', 'Phase-Shift Anomalies, Quantum Dreadnought Confrontation', 1, 60, 'quantum_dreadnought', 50, 'Sub-atomic phase reconstructor restoring vessel structural integrity by +50%.'],
                    ['shield_cell_s4', 'Omni-Phase Deflector Matrix', 'shield', '🛡️', 'octahedron', '', '#00f0ff', 1.2, 3.2, 3.2, 3.2, 8.0, 4, 'all', 'Multi-Dimensional Phasing, Antimatter Vortex', 1, 80, 'all', 60, 'Multi-frequency quantum deflector battery. Restores +60% deflector shield power.']
                ];
                $insP = $pdo->prepare("
                    INSERT INTO `wormhole_game_powerups`
                    (`powerup_id`, `powerup_name`, `powerup_type`, `icon`, `model_3d_type`, `model_3d_url`, `color_hex`, `scale`, `length`, `height`, `depth`, `circumference`, `stage_level`, `device_type`, `trigger_events`, `drop_on_enemy_kill`, `drop_chance_pct`, `enemy_id`, `boost_percentage`, `description`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($defaultsP as $p) {
                    $insP->execute($p);
                }
            }

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== 'all' && $input['stage_level'] !== '' ? intval($input['stage_level']) : (isset($_GET['stage_level']) && $_GET['stage_level'] !== 'all' && $_GET['stage_level'] !== '' ? intval($_GET['stage_level']) : null);
            $deviceFilter = isset($input['device_type']) && $input['device_type'] !== 'all' && $input['device_type'] !== '' ? strtolower(trim($input['device_type'])) : (isset($_GET['device_type']) && $_GET['device_type'] !== 'all' && $_GET['device_type'] !== '' ? strtolower(trim($_GET['device_type'])) : null);
            $typeFilter = isset($input['powerup_type']) && $input['powerup_type'] !== 'all' && $input['powerup_type'] !== '' ? strtolower(trim($input['powerup_type'])) : (isset($_GET['powerup_type']) && $_GET['powerup_type'] !== 'all' && $_GET['powerup_type'] !== '' ? strtolower(trim($_GET['powerup_type'])) : null);

            $whereClauses = [];
            $params = [];

            if ($stageFilter !== null && $stageFilter > 0) {
                $whereClauses[] = "(`stage_level` = :stage OR `stage_level` = 0)";
                $params['stage'] = $stageFilter;
            }
            if ($deviceFilter !== null) {
                $whereClauses[] = "(`device_type` = :device OR `device_type` = 'all' OR `device_type` IS NULL OR `device_type` = '')";
                $params['device'] = $deviceFilter;
            }
            if ($typeFilter !== null && in_array($typeFilter, ['health', 'shield'], true)) {
                $whereClauses[] = "`powerup_type` = :type";
                $params['type'] = $typeFilter;
            }

            $sql = "SELECT * FROM `wormhole_game_powerups`";
            if (!empty($whereClauses)) {
                $sql .= " WHERE " . implode(" AND ", $whereClauses);
            }
            $sql .= " ORDER BY `stage_level` ASC, `powerup_type` ASC, `id` ASC";

            $stmtP = $pdo->prepare($sql);
            $stmtP->execute($params);
            $powerups = $stmtP->fetchAll(PDO::FETCH_ASSOC);

            sendDeviceResponse(true, 'Game powerups loaded successfully', [
                'stage_level'  => $stageFilter,
                'device_type'  => $deviceFilter,
                'powerup_type' => $typeFilter,
                'powerups'     => $powerups,
                'total'        => count($powerups)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to fetch game powerups: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // SAVE / UPDATE GAME POWER UP
    // =========================================================================
    if ($action === 'save_game_powerup') {
        $id = isset($input['id']) ? intval($input['id']) : 0;
        $powerupId = trim($input['powerup_id'] ?? '');
        $powerupName = trim($input['powerup_name'] ?? '');
        $powerupType = strtolower(trim($input['powerup_type'] ?? 'health'));
        if (!in_array($powerupType, ['health', 'shield'], true)) {
            $powerupType = 'health';
        }
        $icon = trim($input['icon'] ?? ($powerupType === 'shield' ? '🛡️' : '💖'));
        $model3dType = trim($input['model_3d_type'] ?? ($powerupType === 'shield' ? 'octahedron' : 'capsule'));
        $model3dUrl = trim($input['model_3d_url'] ?? '');
        $colorHex = trim($input['color_hex'] ?? ($powerupType === 'shield' ? '#00f0ff' : '#00ff88'));
        $scale = isset($input['scale']) ? max(0.1, min(10.0, floatval($input['scale']))) : 1.00;
        $length = isset($input['length']) ? max(0.2, min(50.0, floatval($input['length']))) : 2.50;
        $height = isset($input['height']) ? max(0.2, min(50.0, floatval($input['height']))) : 2.50;
        $depth = isset($input['depth']) ? max(0.2, min(50.0, floatval($input['depth']))) : 2.50;
        $circumference = isset($input['circumference']) ? max(0.5, min(100.0, floatval($input['circumference']))) : 6.00;
        $stageLevel = isset($input['stage_level']) ? intval($input['stage_level']) : 1;
        $deviceType = strtolower(trim($input['device_type'] ?? 'all'));
        $triggerEvents = trim($input['trigger_events'] ?? '');
        $dropOnEnemyKill = isset($input['drop_on_enemy_kill']) ? intval($input['drop_on_enemy_kill']) : 1;
        $dropChancePct = isset($input['drop_chance_pct']) ? max(0, min(100, intval($input['drop_chance_pct']))) : 65;
        $enemyId = trim($input['enemy_id'] ?? 'all');
        $boostPercentage = isset($input['boost_percentage']) ? max(1, min(1000, intval($input['boost_percentage']))) : 25;
        $description = trim($input['description'] ?? '');
        $isEnabled = isset($input['is_enabled']) ? intval($input['is_enabled']) : 1;
        $restoreBoth = isset($input['restore_both']) ? intval($input['restore_both']) : 0;

        if (empty($powerupId) || empty($powerupName)) {
            sendDeviceResponse(false, 'Power Up ID and Name are required fields.', [], 400);
        }

        try {
            if ($id > 0) {
                $updStmt = $pdo->prepare("
                    UPDATE `wormhole_game_powerups` SET
                      `powerup_id` = :pid,
                      `powerup_name` = :pname,
                      `powerup_type` = :ptype,
                      `restore_both` = :restore_both,
                      `icon` = :icon,
                      `model_3d_type` = :mtype,
                      `model_3d_url` = :murl,
                      `color_hex` = :color,
                      `scale` = :scale,
                      `length` = :len,
                      `height` = :ht,
                      `depth` = :dp,
                      `circumference` = :circ,
                      `stage_level` = :stage,
                      `device_type` = :device,
                      `trigger_events` = :events,
                      `drop_on_enemy_kill` = :drop_kill,
                      `drop_chance_pct` = :drop_pct,
                      `enemy_id` = :enemy,
                      `boost_percentage` = :boost,
                      `description` = :desc,
                      `is_enabled` = :enabled,
                      `updated_at` = NOW()
                    WHERE `id` = :id
                ");
                $updStmt->execute([
                    ':pid'          => $powerupId,
                    ':pname'        => $powerupName,
                    ':ptype'        => $powerupType,
                    ':restore_both' => $restoreBoth,
                    ':icon'         => $icon,
                    ':mtype'        => $model3dType,
                    ':murl'         => $model3dUrl,
                    ':color'        => $colorHex,
                    ':scale'        => $scale,
                    ':len'          => $length,
                    ':ht'           => $height,
                    ':dp'           => $depth,
                    ':circ'         => $circumference,
                    ':stage'        => $stageLevel,
                    ':device'       => $deviceType,
                    ':events'       => $triggerEvents,
                    ':drop_kill'    => $dropOnEnemyKill,
                    ':drop_pct'     => $dropChancePct,
                    ':enemy'        => $enemyId,
                    ':boost'        => $boostPercentage,
                    ':desc'         => $description,
                    ':enabled'      => $isEnabled,
                    ':id'           => $id
                ]);

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio(true);
                }

                sendDeviceResponse(true, "Power Up '{$powerupName}' updated successfully.", ['id' => $id, 'powerup_id' => $powerupId]);
            } else {
                $insStmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_powerups`
                    (`powerup_id`, `powerup_name`, `powerup_type`, `restore_both`, `icon`, `model_3d_type`, `model_3d_url`, `color_hex`, `scale`, `length`, `height`, `depth`, `circumference`, `stage_level`, `device_type`, `trigger_events`, `drop_on_enemy_kill`, `drop_chance_pct`, `enemy_id`, `boost_percentage`, `description`, `is_enabled`)
                    VALUES (:pid, :pname, :ptype, :restore_both, :icon, :mtype, :murl, :color, :scale, :len, :ht, :dp, :circ, :stage, :device, :events, :drop_kill, :drop_pct, :enemy, :boost, :desc, :enabled)
                ");
                $insStmt->execute([
                    ':pid'          => $powerupId,
                    ':pname'        => $powerupName,
                    ':ptype'        => $powerupType,
                    ':restore_both' => $restoreBoth,
                    ':icon'         => $icon,
                    ':mtype'        => $model3dType,
                    ':murl'         => $model3dUrl,
                    ':color'        => $colorHex,
                    ':scale'        => $scale,
                    ':len'          => $length,
                    ':ht'           => $height,
                    ':dp'           => $depth,
                    ':circ'         => $circumference,
                    ':stage'        => $stageLevel,
                    ':device'       => $deviceType,
                    ':events'       => $triggerEvents,
                    ':drop_kill'    => $dropOnEnemyKill,
                    ':drop_pct'     => $dropChancePct,
                    ':enemy'        => $enemyId,
                    ':boost'        => $boostPercentage,
                    ':desc'         => $description,
                    ':enabled'      => $isEnabled
                ]);
                $newId = (int)$pdo->lastInsertId();

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio(true);
                }

                sendDeviceResponse(true, "Power Up '{$powerupName}' added successfully.", ['id' => $newId, 'powerup_id' => $powerupId]);
            }
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to save game powerup: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // DELETE GAME POWER UP
    // =========================================================================
    if ($action === 'delete_game_powerup') {
        $id = isset($input['id']) ? intval($input['id']) : 0;
        $powerupId = trim($input['powerup_id'] ?? '');

        if ($id <= 0 && empty($powerupId)) {
            sendDeviceResponse(false, 'Power Up ID or record ID is required for deletion.', [], 400);
        }

        try {
            if ($id > 0) {
                $del = $pdo->prepare("DELETE FROM `wormhole_game_powerups` WHERE `id` = :id");
                $del->execute([':id' => $id]);
            } else {
                $del = $pdo->prepare("DELETE FROM `wormhole_game_powerups` WHERE `powerup_id` = :pid");
                $del->execute([':pid' => $powerupId]);
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio(true);
            }

            sendDeviceResponse(true, "Power Up deleted successfully.", ['id' => $id, 'powerup_id' => $powerupId]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to delete game powerup: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // SEED DEFAULT GAME POWER UPS
    // =========================================================================
    if ($action === 'seed_default_game_powerups') {
        try {
            $colsToMigrate = [
                'model_3d_type' => "VARCHAR(64) NOT NULL DEFAULT 'octahedron'",
                'model_3d_url' => "VARCHAR(255) NOT NULL DEFAULT ''",
                'scale' => "DECIMAL(5,2) NOT NULL DEFAULT 1.00",
                'length' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'height' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'depth' => "DECIMAL(5,2) NOT NULL DEFAULT 2.50",
                'circumference' => "DECIMAL(5,2) NOT NULL DEFAULT 6.00",
                'restore_both' => "TINYINT(1) NOT NULL DEFAULT 0"
            ];
            foreach ($colsToMigrate as $colName => $colDef) {
                try {
                    $checkCols = $pdo->query("SHOW COLUMNS FROM `wormhole_game_powerups` LIKE '{$colName}'")->fetchAll();
                    if (empty($checkCols)) {
                        $pdo->exec("ALTER TABLE `wormhole_game_powerups` ADD COLUMN `{$colName}` {$colDef}");
                    }
                } catch (Throwable $eIgnore) {}
            }

            $pdo->exec("TRUNCATE TABLE `wormhole_game_powerups`");
            $defaultsP = [
                ['health_pack_s1', 'Sub-Space Nanite Repair Kit', 'health', '💖', 'capsule', '', '#00ff88', 1.0, 2.5, 2.5, 2.5, 6.0, 1, 'all', 'Asteroid Debris Belt, Anomaly Alpha Spike', 1, 60, 'void_recon_drone', 25, 'Rapid nano-repair canister synthesized during debris fields and scout incursions. Restores 25% hull integrity.'],
                ['shield_cell_s1', 'Deflector Shield Overcharger', 'shield', '🛡️', 'octahedron', '', '#00f0ff', 1.0, 2.5, 2.5, 2.5, 6.0, 1, 'all', 'Nav-Beacon Calibration, Plasma Surge Alert', 1, 75, 'all', 30, 'High-frequency deflector charge harmonic. Overcharges magnetic shield buffer by +30%.'],
                ['health_pack_s2', 'Tachyon Infused Hull Matrix', 'health', '💚', 'dodecahedron', '', '#10b981', 1.0, 2.5, 2.5, 2.5, 6.0, 2, 'all', 'Tachyon Flux Distortions, Interceptor Ambush Wave', 1, 50, 'phase_interceptor', 35, 'Tachyon-stabilized cellular lattice repairing kinetic hull fissures. Restores 35% hull integrity.'],
                ['shield_cell_s2', 'Ion Shield Harmonizer', 'shield', '🔰', 'torus', '', '#38bdf8', 1.0, 2.8, 2.8, 2.8, 7.0, 2, 'all', 'Ion Cloud Interference, Wormhole Coil Resonance Alert', 1, 70, 'all', 40, 'Re-polarizes phase deflector shields against relativistic radiation. Boosts shield capacity by +40%.'],
                ['health_pack_s3', 'Graviton Integrity Restorer', 'health', '🧪', 'icosahedron', '', '#a855f7', 1.0, 2.5, 2.5, 2.5, 6.0, 3, 'all', 'Gravitational Tidal Waves, Core Guardian Awakening', 1, 50, 'tachyon_cruiser', 45, 'High-density graviton canister neutralizing gravitational shear. Restores 45% hull armor.'],
                ['shield_cell_s3', 'Singularity Void Barrier', 'shield', '🔷', 'sphere', '', '#6366f1', 1.0, 3.0, 3.0, 3.0, 7.5, 3, 'all', 'Singularity Probe Deployment, Heavy Antimatter Eruptions', 1, 65, 'void_guardian', 50, 'Generates temporary singularity deflection field. Recharges shields by +50%.'],
                ['health_pack_s4', 'Quantum Regenerative Core', 'health', '💖', 'icosahedron', '', '#ec4899', 1.1, 2.8, 2.8, 2.8, 7.0, 4, 'all', 'Phase-Shift Anomalies, Quantum Dreadnought Confrontation', 1, 60, 'quantum_dreadnought', 50, 'Sub-atomic phase reconstructor restoring vessel structural integrity by +50%.'],
                ['shield_cell_s4', 'Omni-Phase Deflector Matrix', 'shield', '🛡️', 'octahedron', '', '#00f0ff', 1.2, 3.2, 3.2, 3.2, 8.0, 4, 'all', 'Multi-Dimensional Phasing, Antimatter Vortex', 1, 80, 'all', 60, 'Multi-frequency quantum deflector battery. Restores +60% deflector shield power.']
            ];
            $insP = $pdo->prepare("
                INSERT INTO `wormhole_game_powerups`
                (`powerup_id`, `powerup_name`, `powerup_type`, `icon`, `model_3d_type`, `model_3d_url`, `color_hex`, `scale`, `length`, `height`, `depth`, `circumference`, `stage_level`, `device_type`, `trigger_events`, `drop_on_enemy_kill`, `drop_chance_pct`, `enemy_id`, `boost_percentage`, `description`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($defaultsP as $p) {
                $insP->execute($p);
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio(true);
            }

            sendDeviceResponse(true, "Default power ups re-seeded successfully.", ['count' => count($defaultsP)]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to seed default powerups: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // PUBLIC / TELEMETRY: GET GAME ENVIRONMENTS
    // =========================================================================
    if ($action === 'get_game_environments' || $action === 'get_public_game_environments') {
        try {
            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== 'all' && $input['stage_level'] !== '' ? intval($input['stage_level']) : (isset($_GET['stage_level']) && $_GET['stage_level'] !== 'all' && $_GET['stage_level'] !== '' ? intval($_GET['stage_level']) : null);
            $deviceFilter = isset($input['device_type']) && $input['device_type'] !== 'all' && $input['device_type'] !== '' ? strtolower(trim($input['device_type'])) : (isset($_GET['device_type']) && $_GET['device_type'] !== 'all' && $_GET['device_type'] !== '' ? strtolower(trim($_GET['device_type'])) : null);

            $sql = "SELECT * FROM `wormhole_game_environments`";
            $where = [];
            $params = [];
            if ($stageFilter !== null && $stageFilter >= 0) {
                $where[] = "(`stage_level` = :stage OR `stage_level` = 0)";
                $params['stage'] = $stageFilter;
            }
            if ($deviceFilter !== null && $deviceFilter !== 'all') {
                $where[] = "(`device_type` = :device OR `device_type` = 'all')";
                $params['device'] = $deviceFilter;
            }
            if (!empty($where)) {
                $sql .= " WHERE " . implode(' AND ', $where);
            }
            $sql .= " ORDER BY `stage_level` ASC, `id` ASC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $environments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendDeviceResponse(true, 'Game environments loaded successfully', [
                'environments' => $environments,
                'total' => count($environments)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to fetch game environments: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SAVE / UPDATE GAME ENEMY (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'save_game_enemy') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $enemyId = trim($input['enemy_id'] ?? '');
        $deviceType = strtolower(trim($input['device_type'] ?? 'desktop'));
        if (!in_array($deviceType, ['all', 'desktop', 'mobile', 'vr', 'arcore'], true)) {
            $deviceType = 'desktop';
        }
        $enemyName = trim($input['enemy_name'] ?? '');
        $enemyClass = trim($input['enemy_class'] ?? 'Scout Drone');
        $icon = trim($input['icon'] ?? '🛸');
        $model3DType = trim($input['model_3d_type'] ?? 'scout_drone');
        $model3DUrl = sanitizeWormholeAssetUrl(trim($input['model_3d_url'] ?? ''));
        if (!empty($model3DUrl) && strpos($model3DType, 'custom') !== 0) {
            $cleanExt = strtolower(pathinfo(parse_url($model3DUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            if ($cleanExt === 'glb') {
                $model3DType = 'custom_glb';
            } elseif ($cleanExt === 'obj') {
                $model3DType = 'custom_obj';
            } elseif ($cleanExt === 'gltf') {
                $model3DType = 'custom_gltf';
            } else {
                $model3DType = 'custom';
            }
        }
        $scale = isset($input['scale']) ? max(0.05, min(20.0, floatval($input['scale']))) : 1.0;
        $length = isset($input['length']) ? max(0.1, min(100.0, floatval($input['length']))) : 3.0;
        $height = isset($input['height']) ? max(0.1, min(100.0, floatval($input['height']))) : 1.5;
        $depth = isset($input['depth']) ? max(0.1, min(100.0, floatval($input['depth']))) : 3.0;
        $circumference = isset($input['circumference']) ? max(0.1, min(200.0, floatval($input['circumference']))) : 6.0;
        $colorHex = trim($input['color_hex'] ?? '#ef476f');
        $stageLevel = isset($input['stage_level']) ? intval($input['stage_level']) : 1;
        $hitsToDestroy = isset($input['hits_to_destroy']) ? intval($input['hits_to_destroy']) : 2;
        $piercingWeapon = trim($input['piercing_weapon_id'] ?? 'any');
        $armorStrength = isset($input['armor_strength']) ? intval($input['armor_strength']) : 10;
        $hasForceField = isset($input['has_force_field']) ? intval($input['has_force_field']) : 0;
        $shieldCapacity = isset($input['shield_capacity_hits']) ? intval($input['shield_capacity_hits']) : 0;
        $movementSpeed = isset($input['movement_speed']) ? intval($input['movement_speed']) : 250;
        $attackDamage = isset($input['attack_damage']) ? intval($input['attack_damage']) : 5;
        $weaponName = trim($input['weapon_name'] ?? 'Plasma Pulse');
        $weaponDamage = isset($input['weapon_damage']) ? intval($input['weapon_damage']) : $attackDamage;
        $weaponSpeed = isset($input['weapon_speed']) ? intval($input['weapon_speed']) : 450;
        $weaponColor = trim($input['weapon_color'] ?? '#ff2255');
        $quickEffectPrimary = trim($input['quick_effect_primary'] ?? 'none');
        $quickEffectSecondary = trim($input['quick_effect_secondary'] ?? 'none');
        $quickEffectColor = trim($input['quick_effect_color'] ?? '#00f0ff');
        $quickEffectIntensity = isset($input['quick_effect_intensity']) ? max(0.1, min(10.0, floatval($input['quick_effect_intensity']))) : 1.00;
        $quickEffectSpeed = isset($input['quick_effect_speed']) ? max(0.1, min(10.0, floatval($input['quick_effect_speed']))) : 1.00;
        $destructionParticleType = trim($input['destruction_particle_type'] ?? 'procedural_sparks_explosion');
        $destructionParticleUrl = sanitizeWormholeAssetUrl(trim($input['destruction_particle_url'] ?? ''));
        $destructionParticleCount = isset($input['destruction_particle_count']) ? max(5, min(500, intval($input['destruction_particle_count']))) : 40;
        $destructionParticleColor = trim($input['destruction_particle_color'] ?? ($colorHex ?: '#ff0055'));
        $destructionParticleScale = isset($input['destruction_particle_scale']) ? max(0.1, min(10.0, floatval($input['destruction_particle_scale']))) : 1.00;
        
        // Multi-weapon array & fire rate parsing (seconds, ms, times per second)
        $fireRateSec = isset($input['fire_rate_seconds']) ? max(0.02, floatval($input['fire_rate_seconds'])) : 2.0;
        $fireRateMs = isset($input['fire_rate_ms']) ? max(20, intval($input['fire_rate_ms'])) : intval(round($fireRateSec * 1000));
        if (isset($input['fire_rate_times_per_sec']) && floatval($input['fire_rate_times_per_sec']) > 0) {
            $timesSec = floatval($input['fire_rate_times_per_sec']);
            $fireRateMs = max(20, intval(round(1000.0 / $timesSec)));
            $fireRateSec = round($fireRateMs / 1000.0, 3);
        } else if (isset($input['fire_rate_ms']) && intval($input['fire_rate_ms']) > 0) {
            $fireRateMs = max(20, intval($input['fire_rate_ms']));
            $fireRateSec = round($fireRateMs / 1000.0, 3);
        } else {
            $fireRateMs = max(20, intval(round($fireRateSec * 1000)));
        }

        $weaponsList = [];
        if (!empty($input['weapons_json'])) {
            $rawWeapons = is_string($input['weapons_json']) ? json_decode($input['weapons_json'], true) : $input['weapons_json'];
            if (is_array($rawWeapons)) {
                $weaponsList = $rawWeapons;
            }
        } elseif (isset($input['weapons']) && is_array($input['weapons'])) {
            $weaponsList = $input['weapons'];
        }

        if (empty($weaponsList)) {
            $weaponsList = [
                [
                    'id' => 'ew_0',
                    'name' => $weaponName ?: 'Plasma Pulse',
                    'type' => (stripos($weaponName, 'missile') !== false || stripos($weaponName, 'torpedo') !== false) ? 'missile' : 'beam',
                    'mount' => 'dual_wingtip',
                    'model_url' => '',
                    'model_type' => '',
                    'fire_point_x' => 0.0,
                    'fire_point_y' => -0.15,
                    'fire_point_z' => 1.5,
                    'scale' => 1.0,
                    'size_x' => 1.0,
                    'size_y' => 1.0,
                    'size_z' => 1.0,
                    'fire_rate_times_per_sec' => round(1000.0 / max(20, $fireRateMs), 3),
                    'fire_interval_ms' => $fireRateMs,
                    'fire_rate_seconds' => $fireRateSec,
                    'damage' => $weaponDamage,
                    'speed' => $weaponSpeed,
                    'color' => $weaponColor,
                    'is_enabled' => 1
                ]
            ];
        } else {
            $sanitizedWpns = [];
            foreach ($weaponsList as $idx => $w) {
                if (!is_array($w)) continue;
                $wName = trim($w['name'] ?? ($weaponName ?: 'Plasma Pulse'));
                $wType = trim($w['type'] ?? 'beam');
                $wMount = trim($w['mount'] ?? 'dual_wingtip');
                $wDmg = isset($w['damage']) ? max(1, intval($w['damage'])) : $weaponDamage;
                $wSpd = isset($w['speed']) ? max(50, intval($w['speed'])) : $weaponSpeed;
                $wCol = trim($w['color'] ?? ($weaponColor ?: '#ff0055'));
                $wEn = isset($w['is_enabled']) ? intval($w['is_enabled']) : 1;

                $wSec = isset($w['fire_rate_seconds']) ? max(0.02, floatval($w['fire_rate_seconds'])) : $fireRateSec;
                $wMs = isset($w['fire_interval_ms']) ? max(20, intval($w['fire_interval_ms'])) : (isset($w['fire_rate_ms']) ? max(20, intval($w['fire_rate_ms'])) : intval(round($wSec * 1000)));
                if (isset($w['fire_rate_times_per_sec']) && floatval($w['fire_rate_times_per_sec']) > 0) {
                    $wTimes = floatval($w['fire_rate_times_per_sec']);
                    $wMs = max(20, intval(round(1000.0 / $wTimes)));
                    $wSec = round($wMs / 1000.0, 3);
                } else {
                    $wTimes = round(1000.0 / max(20, $wMs), 3);
                }

                $wModelUrl = function_exists('sanitizeWormholeAssetUrl') ? sanitizeWormholeAssetUrl(trim($w['model_url'] ?? '')) : trim($w['model_url'] ?? '');
                $wModelType = trim($w['model_type'] ?? '');
                $wScale = isset($w['scale']) ? max(0.01, min(100.0, floatval($w['scale']))) : 1.0;
                $wSizeX = isset($w['size_x']) ? max(0.01, min(100.0, floatval($w['size_x']))) : 1.0;
                $wSizeY = isset($w['size_y']) ? max(0.01, min(100.0, floatval($w['size_y']))) : 1.0;
                $wSizeZ = isset($w['size_z']) ? max(0.01, min(100.0, floatval($w['size_z']))) : 1.0;
                $wFireX = isset($w['fire_point_x']) ? floatval($w['fire_point_x']) : 0.0;
                $wFireY = isset($w['fire_point_y']) ? floatval($w['fire_point_y']) : -0.15;
                $wFireZ = isset($w['fire_point_z']) ? floatval($w['fire_point_z']) : 1.5;

                $sanitizedWpns[] = [
                    'id' => trim($w['id'] ?? ('ew_' . $idx)),
                    'name' => $wName,
                    'type' => $wType,
                    'mount' => $wMount,
                    'model_url' => $wModelUrl,
                    'model_type' => $wModelType,
                    'fire_point_x' => $wFireX,
                    'fire_point_y' => $wFireY,
                    'fire_point_z' => $wFireZ,
                    'scale' => $wScale,
                    'size_x' => $wSizeX,
                    'size_y' => $wSizeY,
                    'size_z' => $wSizeZ,
                    'fire_rate_times_per_sec' => $wTimes,
                    'fire_interval_ms' => $wMs,
                    'fire_rate_seconds' => $wSec,
                    'damage' => $wDmg,
                    'speed' => $wSpd,
                    'color' => $wCol,
                    'is_enabled' => $wEn
                ];
            }
            $weaponsList = $sanitizedWpns;
            if (isset($weaponsList[0])) {
                $weaponName = $weaponsList[0]['name'];
                $weaponDamage = $weaponsList[0]['damage'];
                $weaponSpeed = $weaponsList[0]['speed'];
                $weaponColor = $weaponsList[0]['color'];
                $fireRateSec = $weaponsList[0]['fire_rate_seconds'];
                $fireRateMs = $weaponsList[0]['fire_interval_ms'];
            }
        }
        $weaponsJsonFormatted = json_encode($weaponsList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $scoreValue = isset($input['score_value']) ? intval($input['score_value']) : 100;
        $threatLevel = trim($input['threat_level'] ?? 'Low');
        $description = trim($input['description'] ?? '');
        $isEnabled = isset($input['is_enabled']) ? intval($input['is_enabled']) : 1;

        if (empty($enemyId) || empty($enemyName)) {
            sendDeviceResponse(false, 'Enemy identifier code and name are required', [], 400);
        }

        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("
                    UPDATE `wormhole_game_enemies`
                    SET `enemy_id` = :enemy_id,
                        `device_type` = :device_type,
                        `enemy_name` = :enemy_name,
                        `enemy_class` = :enemy_class,
                        `icon` = :icon,
                        `model_3d_type` = :model_3d,
                        `model_3d_url` = :model_url,
                        `scale` = :scale,
                        `length` = :length,
                        `height` = :height,
                        `depth` = :depth,
                        `circumference` = :circumference,
                        `color_hex` = :color_hex,
                        `stage_level` = :stage_level,
                        `hits_to_destroy` = :hits,
                        `piercing_weapon_id` = :pierce,
                        `armor_strength` = :armor,
                        `has_force_field` = :shield,
                        `shield_capacity_hits` = :shield_cap,
                        `movement_speed` = :speed,
                        `attack_damage` = :damage,
                        `weapon_name` = :weapon_name,
                        `weapon_damage` = :weapon_damage,
                        `weapon_speed` = :weapon_speed,
                        `weapon_color` = :weapon_color,
                        `weapons_json` = :weapons_json,
                        `quick_effect_primary` = :q_eff_prim,
                        `quick_effect_secondary` = :q_eff_sec,
                        `quick_effect_color` = :q_eff_col,
                        `quick_effect_intensity` = :q_eff_int,
                        `quick_effect_speed` = :q_eff_spd,
                        `destruction_particle_type` = :dest_type,
                        `destruction_particle_url` = :dest_url,
                        `destruction_particle_count` = :dest_count,
                        `destruction_particle_color` = :dest_color,
                        `destruction_particle_scale` = :dest_scale,
                        `fire_rate_seconds` = :fire_rate,
                        `fire_rate_ms` = :fire_rate_ms,
                        `score_value` = :score,
                        `threat_level` = :threat,
                        `description` = :desc,
                        `is_enabled` = :is_enabled,
                        `updated_at` = NOW()
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':enemy_id'       => $enemyId,
                    ':device_type'    => $deviceType,
                    ':enemy_name'     => $enemyName,
                    ':enemy_class'    => $enemyClass,
                    ':icon'           => $icon,
                    ':model_3d'       => $model3DType,
                    ':model_url'      => $model3DUrl,
                    ':scale'          => $scale,
                    ':length'         => $length,
                    ':height'         => $height,
                    ':depth'          => $depth,
                    ':circumference'  => $circumference,
                    ':color_hex'      => $colorHex,
                    ':stage_level'    => $stageLevel,
                    ':hits'           => $hitsToDestroy,
                    ':pierce'         => $piercingWeapon,
                    ':armor'          => $armorStrength,
                    ':shield'         => $hasForceField,
                    ':shield_cap'     => $shieldCapacity,
                    ':speed'          => $movementSpeed,
                    ':damage'         => $attackDamage,
                    ':weapon_name'    => $weaponName,
                    ':weapon_damage'  => $weaponDamage,
                    ':weapon_speed'   => $weaponSpeed,
                    ':weapon_color'   => $weaponColor,
                    ':weapons_json'   => $weaponsJsonFormatted,
                    ':q_eff_prim'     => $quickEffectPrimary,
                    ':q_eff_sec'      => $quickEffectSecondary,
                    ':q_eff_col'      => $quickEffectColor,
                    ':q_eff_int'      => $quickEffectIntensity,
                    ':q_eff_spd'      => $quickEffectSpeed,
                    ':dest_type'      => $destructionParticleType,
                    ':dest_url'       => $destructionParticleUrl,
                    ':dest_count'     => $destructionParticleCount,
                    ':dest_color'     => $destructionParticleColor,
                    ':dest_scale'     => $destructionParticleScale,
                    ':fire_rate'      => $fireRateSec,
                    ':fire_rate_ms'   => $fireRateMs,
                    ':score'          => $scoreValue,
                    ':threat'         => $threatLevel,
                    ':desc'           => $description,
                    ':is_enabled'     => $isEnabled,
                    ':id'             => $id
                ]);

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio();
                }

                sendDeviceResponse(true, "Enemy '{$enemyName}' [{$deviceType}] updated successfully", [
                    'id' => $id,
                    'device_type' => $deviceType,
                    'model_3d_url' => $model3DUrl
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_enemies`
                    (`enemy_id`, `device_type`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `weapons_json`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `destruction_particle_type`, `destruction_particle_url`, `destruction_particle_count`, `destruction_particle_color`, `destruction_particle_scale`, `fire_rate_seconds`, `fire_rate_ms`, `score_value`, `threat_level`, `description`, `is_enabled`)
                    VALUES
                    (:enemy_id, :device_type, :enemy_name, :enemy_class, :icon, :model_3d, :model_url, :scale, :length, :height, :depth, :circumference, :color_hex, :stage_level, :hits, :pierce, :armor, :shield, :shield_cap, :speed, :damage, :weapon_name, :weapon_damage, :weapon_speed, :weapon_color, :weapons_json, :q_eff_prim, :q_eff_sec, :q_eff_col, :q_eff_int, :q_eff_spd, :dest_type, :dest_url, :dest_count, :dest_color, :dest_scale, :fire_rate, :fire_rate_ms, :score, :threat, :desc, :is_enabled)
                    ON DUPLICATE KEY UPDATE
                        `device_type` = VALUES(`device_type`),
                        `enemy_name` = VALUES(`enemy_name`),
                        `enemy_class` = VALUES(`enemy_class`),
                        `icon` = VALUES(`icon`),
                        `model_3d_type` = VALUES(`model_3d_type`),
                        `model_3d_url` = VALUES(`model_3d_url`),
                        `scale` = VALUES(`scale`),
                        `length` = VALUES(`length`),
                        `height` = VALUES(`height`),
                        `depth` = VALUES(`depth`),
                        `circumference` = VALUES(`circumference`),
                        `color_hex` = VALUES(`color_hex`),
                        `stage_level` = VALUES(`stage_level`),
                        `hits_to_destroy` = VALUES(`hits_to_destroy`),
                        `piercing_weapon_id` = VALUES(`piercing_weapon_id`),
                        `armor_strength` = VALUES(`armor_strength`),
                        `has_force_field` = VALUES(`has_force_field`),
                        `shield_capacity_hits` = VALUES(`shield_capacity_hits`),
                        `movement_speed` = VALUES(`movement_speed`),
                        `attack_damage` = VALUES(`attack_damage`),
                        `weapon_name` = VALUES(`weapon_name`),
                        `weapon_damage` = VALUES(`weapon_damage`),
                        `weapon_speed` = VALUES(`weapon_speed`),
                        `weapon_color` = VALUES(`weapon_color`),
                        `weapons_json` = VALUES(`weapons_json`),
                        `quick_effect_primary` = VALUES(`quick_effect_primary`),
                        `quick_effect_secondary` = VALUES(`quick_effect_secondary`),
                        `quick_effect_color` = VALUES(`quick_effect_color`),
                        `quick_effect_intensity` = VALUES(`quick_effect_intensity`),
                        `quick_effect_speed` = VALUES(`quick_effect_speed`),
                        `destruction_particle_type` = VALUES(`destruction_particle_type`),
                        `destruction_particle_url` = VALUES(`destruction_particle_url`),
                        `destruction_particle_count` = VALUES(`destruction_particle_count`),
                        `destruction_particle_color` = VALUES(`destruction_particle_color`),
                        `destruction_particle_scale` = VALUES(`destruction_particle_scale`),
                        `fire_rate_seconds` = VALUES(`fire_rate_seconds`),
                        `fire_rate_ms` = VALUES(`fire_rate_ms`),
                        `score_value` = VALUES(`score_value`),
                        `threat_level` = VALUES(`threat_level`),
                        `description` = VALUES(`description`),
                        `is_enabled` = VALUES(`is_enabled`),
                        `updated_at` = NOW()
                ");
                $stmt->execute([
                    ':enemy_id'       => $enemyId,
                    ':device_type'    => $deviceType,
                    ':enemy_name'     => $enemyName,
                    ':enemy_class'    => $enemyClass,
                    ':icon'           => $icon,
                    ':model_3d'       => $model3DType,
                    ':model_url'      => $model3DUrl,
                    ':scale'          => $scale,
                    ':length'         => $length,
                    ':height'         => $height,
                    ':depth'          => $depth,
                    ':circumference'  => $circumference,
                    ':color_hex'      => $colorHex,
                    ':stage_level'    => $stageLevel,
                    ':hits'           => $hitsToDestroy,
                    ':pierce'         => $piercingWeapon,
                    ':armor'          => $armorStrength,
                    ':shield'         => $hasForceField,
                    ':shield_cap'     => $shieldCapacity,
                    ':speed'          => $movementSpeed,
                    ':damage'         => $attackDamage,
                    ':weapon_name'    => $weaponName,
                    ':weapon_damage'  => $weaponDamage,
                    ':weapon_speed'   => $weaponSpeed,
                    ':weapon_color'   => $weaponColor,
                    ':weapons_json'   => $weaponsJsonFormatted,
                    ':q_eff_prim'     => $quickEffectPrimary,
                    ':q_eff_sec'      => $quickEffectSecondary,
                    ':q_eff_col'      => $quickEffectColor,
                    ':q_eff_int'      => $quickEffectIntensity,
                    ':q_eff_spd'      => $quickEffectSpeed,
                    ':dest_type'      => $destructionParticleType,
                    ':dest_url'       => $destructionParticleUrl,
                    ':dest_count'     => $destructionParticleCount,
                    ':dest_color'     => $destructionParticleColor,
                    ':dest_scale'     => $destructionParticleScale,
                    ':fire_rate'      => $fireRateSec,
                    ':fire_rate_ms'   => $fireRateMs,
                    ':score'          => $scoreValue,
                    ':threat'         => $threatLevel,
                    ':desc'           => $description,
                    ':is_enabled'     => $isEnabled
                ]);
                $newId = (int)$pdo->lastInsertId();

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio();
                }

                sendDeviceResponse(true, "Enemy '{$enemyName}' [{$deviceType}] registered successfully", [
                    'id' => $newId,
                    'device_type' => $deviceType,
                    'model_3d_url' => $model3DUrl
                ]);
            }
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to save enemy: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: DELETE GAME ENEMY
    // =========================================================================
    if ($action === 'delete_game_enemy') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $enemyId = trim($input['enemy_id'] ?? '');

        if ($id <= 0 && empty($enemyId)) {
            sendDeviceResponse(false, 'Enemy ID or record ID is required for deletion', [], 400);
        }

        try {
            if ($id > 0) {
                $delStmt = $pdo->prepare("DELETE FROM `wormhole_game_enemies` WHERE `id` = :id LIMIT 1");
                $delStmt->execute([':id' => $id]);
            } else {
                $delStmt = $pdo->prepare("DELETE FROM `wormhole_game_enemies` WHERE `enemy_id` = :enemy_id LIMIT 1");
                $delStmt->execute([':enemy_id' => $enemyId]);
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio();
            }

            sendDeviceResponse(true, 'Enemy threat profile removed successfully');
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to delete enemy: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SAVE / UPDATE GAME ENVIRONMENT (ADMIN CONSOLE)
    // =========================================================================
    if ($action === 'save_game_environment') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $envId = trim($input['env_id'] ?? '');
        $envName = trim($input['env_name'] ?? '');
        $envCategory = trim($input['env_category'] ?? 'wormhole_singularity');
        $stageLevel = isset($input['stage_level']) ? intval($input['stage_level']) : 1;
        $deviceType = strtolower(trim($input['device_type'] ?? 'all'));
        if (!in_array($deviceType, ['all', 'desktop', 'mobile', 'vr', 'arcore'], true)) {
            $deviceType = 'all';
        }
        $model3DType = trim($input['model_3d_type'] ?? 'procedural_wormhole');
        $model3DUrl = sanitizeWormholeAssetUrl(trim($input['model_3d_url'] ?? ''));
        if (!empty($model3DUrl) && strpos($model3DType, 'custom') !== 0) {
            $cleanExt = strtolower(pathinfo(parse_url($model3DUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            if ($cleanExt === 'glb') {
                $model3DType = 'custom_glb';
            } elseif ($cleanExt === 'obj') {
                $model3DType = 'custom_obj';
            } elseif ($cleanExt === 'gltf') {
                $model3DType = 'custom_gltf';
            } else {
                $model3DType = 'custom';
            }
        }
        $imageAssetUrl = sanitizeWormholeAssetUrl(trim($input['image_asset_url'] ?? ''));
        $imageAssetType = trim($input['image_asset_type'] ?? 'corona_sprite');
        $scale = isset($input['scale']) ? max(0.05, min(50.0, floatval($input['scale']))) : 1.00;
        $eventHorizonRadius = isset($input['event_horizon_radius']) ? max(0.5, min(200.0, floatval($input['event_horizon_radius']))) : 7.50;
        $accretionDiskRadius = isset($input['accretion_disk_radius']) ? max(1.0, min(500.0, floatval($input['accretion_disk_radius']))) : 38.00;
        $length = isset($input['length']) ? max(1.0, min(5000.0, floatval($input['length']))) : 300.00;
        $height = isset($input['height']) ? max(1.0, min(5000.0, floatval($input['height']))) : 80.00;
        $depth = isset($input['depth']) ? max(1.0, min(5000.0, floatval($input['depth']))) : 300.00;
        $circumference = isset($input['circumference']) ? max(1.0, min(5000.0, floatval($input['circumference']))) : round(2 * M_PI * $eventHorizonRadius, 2);
        $colorPrimary = trim($input['color_primary'] ?? '#00f0ff');
        $colorEdge = trim($input['color_edge'] ?? '#003366');
        $colorCore = trim($input['color_core'] ?? '#00f0ff');
        $colorHot = trim($input['color_hot'] ?? '#d6ffff');
        $colorHalo = trim($input['color_halo'] ?? '#00f0ff');
        $ambientLight = trim($input['ambient_light'] ?? '#002233');
        $centerLight = trim($input['center_light'] ?? '#00f0ff');
        $rotationSpeed = isset($input['rotation_speed']) ? floatval($input['rotation_speed']) : 0.650;
        $distortionIntensity = isset($input['distortion_intensity']) ? floatval($input['distortion_intensity']) : 1.00;
        $particleCount = isset($input['particle_count']) ? max(100, min(25000, intval($input['particle_count']))) : 4500;
        $quickEffectPrimary = trim($input['quick_effect_primary'] ?? 'none');
        $quickEffectSecondary = trim($input['quick_effect_secondary'] ?? 'none');
        $quickEffectColor = trim($input['quick_effect_color'] ?? '#00f0ff');
        $quickEffectIntensity = isset($input['quick_effect_intensity']) ? max(0.1, min(10.0, floatval($input['quick_effect_intensity']))) : 1.00;
        $quickEffectSpeed = isset($input['quick_effect_speed']) ? max(0.1, min(10.0, floatval($input['quick_effect_speed']))) : 1.00;
        $description = trim($input['description'] ?? '');
        $isEnabled = isset($input['is_enabled']) ? intval($input['is_enabled']) : 1;

        if (empty($envId) || empty($envName)) {
            sendDeviceResponse(false, 'Environment Identifier (Code) and Display Name are required.', [], 400);
        }

        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("
                    UPDATE `wormhole_game_environments`
                    SET `env_id` = :env_id,
                        `env_name` = :env_name,
                        `env_category` = :env_category,
                        `stage_level` = :stage_level,
                        `device_type` = :device_type,
                        `model_3d_type` = :model_3d_type,
                        `model_3d_url` = :model_3d_url,
                        `image_asset_url` = :image_asset_url,
                        `image_asset_type` = :image_asset_type,
                        `scale` = :scale,
                        `event_horizon_radius` = :event_horizon_radius,
                        `accretion_disk_radius` = :accretion_disk_radius,
                        `length` = :length,
                        `height` = :height,
                        `depth` = :depth,
                        `circumference` = :circumference,
                        `color_primary` = :color_primary,
                        `color_edge` = :color_edge,
                        `color_core` = :color_core,
                        `color_hot` = :color_hot,
                        `color_halo` = :color_halo,
                        `ambient_light` = :ambient_light,
                        `center_light` = :center_light,
                        `rotation_speed` = :rotation_speed,
                        `distortion_intensity` = :distortion_intensity,
                        `particle_count` = :particle_count,
                        `quick_effect_primary` = :quick_effect_primary,
                        `quick_effect_secondary` = :quick_effect_secondary,
                        `quick_effect_color` = :quick_effect_color,
                        `quick_effect_intensity` = :quick_effect_intensity,
                        `quick_effect_speed` = :quick_effect_speed,
                        `description` = :description,
                        `is_enabled` = :is_enabled,
                        `updated_at` = NOW()
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':env_id'                => $envId,
                    ':env_name'              => $envName,
                    ':env_category'          => $envCategory,
                    ':stage_level'           => $stageLevel,
                    ':device_type'           => $deviceType,
                    ':model_3d_type'         => $model3DType,
                    ':model_3d_url'          => $model3DUrl,
                    ':image_asset_url'       => $imageAssetUrl,
                    ':image_asset_type'      => $imageAssetType,
                    ':scale'                 => $scale,
                    ':event_horizon_radius'  => $eventHorizonRadius,
                    ':accretion_disk_radius' => $accretionDiskRadius,
                    ':length'                => $length,
                    ':height'                => $height,
                    ':depth'                 => $depth,
                    ':circumference'         => $circumference,
                    ':color_primary'         => $colorPrimary,
                    ':color_edge'            => $colorEdge,
                    ':color_core'            => $colorCore,
                    ':color_hot'             => $colorHot,
                    ':color_halo'            => $colorHalo,
                    ':ambient_light'         => $ambientLight,
                    ':center_light'          => $centerLight,
                    ':rotation_speed'        => $rotationSpeed,
                    ':distortion_intensity'  => $distortionIntensity,
                    ':particle_count'        => $particleCount,
                    ':quick_effect_primary'  => $quickEffectPrimary,
                    ':quick_effect_secondary'=> $quickEffectSecondary,
                    ':quick_effect_color'    => $quickEffectColor,
                    ':quick_effect_intensity'=> $quickEffectIntensity,
                    ':quick_effect_speed'    => $quickEffectSpeed,
                    ':description'           => $description,
                    ':is_enabled'            => $isEnabled,
                    ':id'                    => $id
                ]);

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio(true);
                }

                sendDeviceResponse(true, "Environment asset '{$envName}' updated successfully", [
                    'id' => $id,
                    'env_id' => $envId,
                    'model_3d_url' => $model3DUrl,
                    'image_asset_url' => $imageAssetUrl
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_environments`
                    (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                    VALUES
                    (:env_id, :env_name, :env_category, :stage_level, :device_type, :model_3d_type, :model_3d_url, :image_asset_url, :image_asset_type, :scale, :event_horizon_radius, :accretion_disk_radius, :length, :height, :depth, :circumference, :color_primary, :color_edge, :color_core, :color_hot, :color_halo, :ambient_light, :center_light, :rotation_speed, :distortion_intensity, :particle_count, :quick_effect_primary, :quick_effect_secondary, :quick_effect_color, :quick_effect_intensity, :quick_effect_speed, :description, :is_enabled)
                    ON DUPLICATE KEY UPDATE
                        `env_name` = VALUES(`env_name`),
                        `env_category` = VALUES(`env_category`),
                        `model_3d_type` = VALUES(`model_3d_type`),
                        `model_3d_url` = VALUES(`model_3d_url`),
                        `image_asset_url` = VALUES(`image_asset_url`),
                        `image_asset_type` = VALUES(`image_asset_type`),
                        `scale` = VALUES(`scale`),
                        `event_horizon_radius` = VALUES(`event_horizon_radius`),
                        `accretion_disk_radius` = VALUES(`accretion_disk_radius`),
                        `length` = VALUES(`length`),
                        `height` = VALUES(`height`),
                        `depth` = VALUES(`depth`),
                        `circumference` = VALUES(`circumference`),
                        `color_primary` = VALUES(`color_primary`),
                        `color_edge` = VALUES(`color_edge`),
                        `color_core` = VALUES(`color_core`),
                        `color_hot` = VALUES(`color_hot`),
                        `color_halo` = VALUES(`color_halo`),
                        `ambient_light` = VALUES(`ambient_light`),
                        `center_light` = VALUES(`center_light`),
                        `rotation_speed` = VALUES(`rotation_speed`),
                        `distortion_intensity` = VALUES(`distortion_intensity`),
                        `particle_count` = VALUES(`particle_count`),
                        `quick_effect_primary` = VALUES(`quick_effect_primary`),
                        `quick_effect_secondary` = VALUES(`quick_effect_secondary`),
                        `quick_effect_color` = VALUES(`quick_effect_color`),
                        `quick_effect_intensity` = VALUES(`quick_effect_intensity`),
                        `quick_effect_speed` = VALUES(`quick_effect_speed`),
                        `description` = VALUES(`description`),
                        `is_enabled` = VALUES(`is_enabled`),
                        `updated_at` = NOW()
                ");
                $stmt->execute([
                    ':env_id'                => $envId,
                    ':env_name'              => $envName,
                    ':env_category'          => $envCategory,
                    ':stage_level'           => $stageLevel,
                    ':device_type'           => $deviceType,
                    ':model_3d_type'         => $model3DType,
                    ':model_3d_url'          => $model3DUrl,
                    ':image_asset_url'       => $imageAssetUrl,
                    ':image_asset_type'      => $imageAssetType,
                    ':scale'                 => $scale,
                    ':event_horizon_radius'  => $eventHorizonRadius,
                    ':accretion_disk_radius' => $accretionDiskRadius,
                    ':length'                => $length,
                    ':height'                => $height,
                    ':depth'                 => $depth,
                    ':circumference'         => $circumference,
                    ':color_primary'         => $colorPrimary,
                    ':color_edge'            => $colorEdge,
                    ':color_core'            => $colorCore,
                    ':color_hot'             => $colorHot,
                    ':color_halo'            => $colorHalo,
                    ':ambient_light'         => $ambientLight,
                    ':center_light'          => $centerLight,
                    ':rotation_speed'        => $rotationSpeed,
                    ':distortion_intensity'  => $distortionIntensity,
                    ':particle_count'        => $particleCount,
                    ':quick_effect_primary'  => $quickEffectPrimary,
                    ':quick_effect_secondary'=> $quickEffectSecondary,
                    ':quick_effect_color'    => $quickEffectColor,
                    ':quick_effect_intensity'=> $quickEffectIntensity,
                    ':quick_effect_speed'    => $quickEffectSpeed,
                    ':description'           => $description,
                    ':is_enabled'            => $isEnabled
                ]);
                $newId = (int)$pdo->lastInsertId();

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio(true);
                }

                sendDeviceResponse(true, "Environment asset '{$envName}' created successfully", [
                    'id' => $newId,
                    'env_id' => $envId,
                    'model_3d_url' => $model3DUrl,
                    'image_asset_url' => $imageAssetUrl
                ]);
            }
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to save environment asset: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: DELETE GAME ENVIRONMENT
    // =========================================================================
    if ($action === 'delete_game_environment') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $envId = trim($input['env_id'] ?? '');

        if ($id <= 0 && empty($envId)) {
            sendDeviceResponse(false, 'Environment ID or record ID is required for deletion.', [], 400);
        }

        try {
            if ($id > 0) {
                $delStmt = $pdo->prepare("DELETE FROM `wormhole_game_environments` WHERE `id` = :id LIMIT 1");
                $delStmt->execute([':id' => $id]);
            } else {
                $delStmt = $pdo->prepare("DELETE FROM `wormhole_game_environments` WHERE `env_id` = :env_id LIMIT 1");
                $delStmt->execute([':env_id' => $envId]);
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio(true);
            }

            sendDeviceResponse(true, 'Environment configuration deleted successfully');
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to delete environment: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: CLONE GAME ENVIRONMENT
    // =========================================================================
    if ($action === 'clone_game_environment') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');
        }

        $sourceId = isset($input['source_id']) ? intval($input['source_id']) : 0;
        $targetStage = isset($input['target_stage']) ? intval($input['target_stage']) : 1;
        $targetDevice = strtolower(trim($input['target_device'] ?? 'all'));

        if ($sourceId <= 0) {
            sendDeviceResponse(false, 'Source environment record ID is required for cloning.', [], 400);
        }

        try {
            $srcStmt = $pdo->prepare("SELECT * FROM `wormhole_game_environments` WHERE `id` = :id LIMIT 1");
            $srcStmt->execute([':id' => $sourceId]);
            $src = $srcStmt->fetch(PDO::FETCH_ASSOC);

            if (!$src) {
                sendDeviceResponse(false, "Source environment record #{$sourceId} not found.", [], 404);
            }

            $newEnvId = $src['env_id'] . '_s' . $targetStage . '_' . $targetDevice;
            $newName = $src['env_name'] . " (Stage {$targetStage} " . strtoupper($targetDevice) . ")";

            $insStmt = $pdo->prepare("
                INSERT INTO `wormhole_game_environments`
                (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                VALUES
                (:env_id, :env_name, :env_category, :stage_level, :device_type, :model_3d_type, :model_3d_url, :image_asset_url, :image_asset_type, :scale, :event_horizon_radius, :accretion_disk_radius, :length, :height, :depth, :circumference, :color_primary, :color_edge, :color_core, :color_hot, :color_halo, :ambient_light, :center_light, :rotation_speed, :distortion_intensity, :particle_count, :quick_effect_primary, :quick_effect_secondary, :quick_effect_color, :quick_effect_intensity, :quick_effect_speed, :description, :is_enabled)
                ON DUPLICATE KEY UPDATE
                    `env_name` = VALUES(`env_name`),
                    `stage_level` = VALUES(`stage_level`),
                    `device_type` = VALUES(`device_type`),
                    `updated_at` = NOW()
            ");

            $insStmt->execute([
                ':env_id'                => $newEnvId,
                ':env_name'              => $newName,
                ':env_category'          => $src['env_category'] ?? 'wormhole_singularity',
                ':stage_level'           => $targetStage,
                ':device_type'           => $targetDevice,
                ':model_3d_type'         => $src['model_3d_type'] ?? 'procedural_wormhole',
                ':model_3d_url'          => sanitizeWormholeAssetUrl($src['model_3d_url'] ?? ''),
                ':image_asset_url'       => sanitizeWormholeAssetUrl($src['image_asset_url'] ?? ''),
                ':image_asset_type'      => $src['image_asset_type'] ?? 'corona_sprite',
                ':scale'                 => $src['scale'] ?? 1.0,
                ':event_horizon_radius'  => $src['event_horizon_radius'] ?? 7.5,
                ':accretion_disk_radius' => $src['accretion_disk_radius'] ?? 38.0,
                ':length'                => $src['length'] ?? 300.0,
                ':height'                => $src['height'] ?? 80.0,
                ':depth'                 => $src['depth'] ?? 300.0,
                ':circumference'         => $src['circumference'] ?? 47.12,
                ':color_primary'         => $src['color_primary'] ?? '#00f0ff',
                ':color_edge'            => $src['color_edge'] ?? '#003366',
                ':color_core'            => $src['color_core'] ?? '#00f0ff',
                ':color_hot'             => $src['color_hot'] ?? '#d6ffff',
                ':color_halo'            => $src['color_halo'] ?? '#00f0ff',
                ':ambient_light'         => $src['ambient_light'] ?? '#002233',
                ':center_light'          => $src['center_light'] ?? '#00f0ff',
                ':rotation_speed'        => $src['rotation_speed'] ?? 0.65,
                ':distortion_intensity'  => $src['distortion_intensity'] ?? 1.0,
                ':particle_count'        => $src['particle_count'] ?? 4500,
                ':quick_effect_primary'  => $src['quick_effect_primary'] ?? 'none',
                ':quick_effect_secondary'=> $src['quick_effect_secondary'] ?? 'none',
                ':quick_effect_color'    => $src['quick_effect_color'] ?? '#00f0ff',
                ':quick_effect_intensity'=> $src['quick_effect_intensity'] ?? 1.0,
                ':quick_effect_speed'    => $src['quick_effect_speed'] ?? 1.0,
                ':description'           => $src['description'] ?? '',
                ':is_enabled'            => 1
            ]);
            $cloneId = (int)$pdo->lastInsertId();

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio(true);
            }

            sendDeviceResponse(true, "Environment cloned successfully as '{$newName}'", [
                'id' => $cloneId,
                'env_id' => $newEnvId
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to clone environment: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SEED DEFAULT GAME ENVIRONMENTS
    // =========================================================================
    if ($action === 'seed_default_game_environments') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');
        }

        try {
            $defaultEnvironments = [
                ['env_warp_origin_desktop', 'Warp Origin (Cyan Relativistic Flow)', 'wormhole_singularity', 1, 'desktop', 'procedural_wormhole', '', '', 'corona_sprite', 1.00, 7.50, 38.00, 300.00, 80.00, 300.00, 47.12, '#00f0ff', '#003366', '#00f0ff', '#d6ffff', '#00f0ff', '#002233', '#00f0ff', 0.650, 1.00, 4500, 'none', 'none', '#00f0ff', 1.00, 1.00, 'Hyperspace entry portal with high-cadence relativistic photon framing and intense accretion turbulence.', 1],
                ['env_event_horizon_desktop', 'Event Horizon (Solar Amber Graviton)', 'wormhole_singularity', 2, 'desktop', 'procedural_wormhole', '', '', 'corona_sprite', 1.15, 8.80, 44.00, 350.00, 95.00, 350.00, 55.29, '#ffd166', '#804000', '#ff9900', '#fff3cc', '#ffd166', '#331a00', '#ffd166', 0.850, 1.25, 5500, 'tachyon_trail', 'plasma_aura', '#ffd166', 1.20, 1.10, 'Intense relativistic gravitational boundary with high magnetic shear and golden ion accretion flares.', 1],
                ['env_singularity_core_desktop', 'Singularity Core (Void Violet Compression)', 'wormhole_singularity', 3, 'desktop', 'procedural_wormhole', '', '', 'corona_sprite', 1.30, 10.50, 52.00, 420.00, 110.00, 420.00, 65.97, '#a855f7', '#3b0764', '#7c3aed', '#f3e8ff', '#c084fc', '#2e1065', '#a855f7', 1.100, 1.50, 6500, 'gravitational_vortex', 'arc_lightning', '#a855f7', 1.50, 1.25, 'Collapsed singularity core with extreme spacetime frame-dragging and gravitational redshift.', 1],
                ['env_quantum_realm_desktop', 'Quantum Realm (Phasor Magenta Multiverse)', 'wormhole_singularity', 4, 'desktop', 'procedural_wormhole', '', '', 'corona_sprite', 1.50, 12.00, 60.00, 500.00, 130.00, 500.00, 75.40, '#ec4899', '#831843', '#db2777', '#fdf2f8', '#f472b6', '#500724', '#ec4899', 1.400, 1.85, 8000, 'quantum_phase_glow', 'energy_shield_pulse', '#ec4899', 1.80, 1.40, 'Deep dimensional rift where standard physics fracture into omnipresent quantum foam.', 1],
                ['env_nebula_outpost_desktop', 'Nebula Outpost (Deep Emerald Rift)', 'wormhole_singularity', 5, 'desktop', 'procedural_wormhole', '', '', 'corona_sprite', 1.20, 9.20, 46.00, 360.00, 90.00, 360.00, 57.81, '#10b981', '#064e3b', '#059669', '#ecfdf5', '#34d399', '#022c22', '#10b981', 0.750, 1.15, 5000, 'none', 'none', '#10b981', 1.00, 1.00, 'Dense magnetized interstellar nursery with emerald cosmic dust filtration and stable entry corridor.', 1]
            ];

            $insStmt = $pdo->prepare("
                INSERT INTO `wormhole_game_environments`
                (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `env_name` = VALUES(`env_name`),
                    `env_category` = VALUES(`env_category`),
                    `model_3d_type` = VALUES(`model_3d_type`),
                    `model_3d_url` = VALUES(`model_3d_url`),
                    `image_asset_url` = VALUES(`image_asset_url`),
                    `image_asset_type` = VALUES(`image_asset_type`),
                    `scale` = VALUES(`scale`),
                    `event_horizon_radius` = VALUES(`event_horizon_radius`),
                    `accretion_disk_radius` = VALUES(`accretion_disk_radius`),
                    `length` = VALUES(`length`),
                    `height` = VALUES(`height`),
                    `depth` = VALUES(`depth`),
                    `circumference` = VALUES(`circumference`),
                    `color_primary` = VALUES(`color_primary`),
                    `color_edge` = VALUES(`color_edge`),
                    `color_core` = VALUES(`color_core`),
                    `color_hot` = VALUES(`color_hot`),
                    `color_halo` = VALUES(`color_halo`),
                    `ambient_light` = VALUES(`ambient_light`),
                    `center_light` = VALUES(`center_light`),
                    `rotation_speed` = VALUES(`rotation_speed`),
                    `distortion_intensity` = VALUES(`distortion_intensity`),
                    `particle_count` = VALUES(`particle_count`),
                    `quick_effect_primary` = VALUES(`quick_effect_primary`),
                    `quick_effect_secondary` = VALUES(`quick_effect_secondary`),
                    `quick_effect_color` = VALUES(`quick_effect_color`),
                    `quick_effect_intensity` = VALUES(`quick_effect_intensity`),
                    `quick_effect_speed` = VALUES(`quick_effect_speed`),
                    `description` = VALUES(`description`),
                    `is_enabled` = VALUES(`is_enabled`),
                    `updated_at` = NOW()
            ");

            foreach ($defaultEnvironments as $env) {
                $insStmt->execute($env);
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio(true);
            }

            sendDeviceResponse(true, 'Default stage environments seeded successfully', [
                'seeded_count' => count($defaultEnvironments)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to seed environments: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SAVE / UPDATE GAME STAGE
    // =========================================================================
    if ($action === 'save_game_stage') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');
        }

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $stageLevel = isset($input['stage_level']) ? intval($input['stage_level']) : 1;
        $stageName = trim($input['stage_name'] ?? '');
        $theme = trim($input['environment_theme'] ?? 'Warp Cyan Corridor');
        $eventsWithin = trim($input['events_within_level'] ?? '');
        $endLevelEvent = trim($input['end_level_event'] ?? '');
        $cockpitOverlayAsset = trim($input['cockpit_overlay_asset'] ?? $input['cockpit_overlay_url'] ?? $input['cockpit_asset'] ?? 'mobile/warp_origin_images/cockpit_cracks.glb');
        if (empty($cockpitOverlayAsset)) {
            $cockpitOverlayAsset = 'mobile/warp_origin_images/cockpit_cracks.glb';
        }
        $description = trim($input['description'] ?? '');
        $missionObjectives = trim($input['mission_objectives'] ?? '');
        $requiredEnemyKills = isset($input['required_enemy_kills']) ? max(0, intval($input['required_enemy_kills'])) : 10;
        $warpTargetDistance = isset($input['warp_target_distance']) ? max(1000, intval($input['warp_target_distance'])) : 50000;
        $parScore = isset($input['par_score']) ? intval($input['par_score']) : 5000;
        $isEnabled = isset($input['is_enabled']) ? intval($input['is_enabled']) : 1;

        if ($stageLevel <= 0 || empty($stageName)) {
            sendDeviceResponse(false, 'Stage Level and Name are required fields.', [], 400);
        }

        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("
                    UPDATE `wormhole_game_stages`
                    SET `stage_level` = :stage_level,
                        `stage_name` = :stage_name,
                        `environment_theme` = :theme,
                        `events_within_level` = :events,
                        `end_level_event` = :end_event,
                        `cockpit_overlay_asset` = :cockpit_asset,
                        `mission_objectives` = :objectives,
                        `required_enemy_kills` = :kills,
                        `warp_target_distance` = :warp_dist,
                        `description` = :desc,
                        `par_score` = :par_score,
                        `is_enabled` = :is_enabled,
                        `updated_at` = NOW()
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':stage_level'    => $stageLevel,
                    ':stage_name'     => $stageName,
                    ':theme'          => $theme,
                    ':events'         => $eventsWithin,
                    ':end_event'      => $endLevelEvent,
                    ':cockpit_asset'  => $cockpitOverlayAsset,
                    ':objectives'     => $missionObjectives,
                    ':kills'          => $requiredEnemyKills,
                    ':warp_dist'      => $warpTargetDistance,
                    ':desc'           => $description,
                    ':par_score'      => $parScore,
                    ':is_enabled'     => $isEnabled,
                    ':id'             => $id
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_stages`
                    (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `cockpit_overlay_asset`, `mission_objectives`, `required_enemy_kills`, `warp_target_distance`, `description`, `par_score`, `is_enabled`)
                    VALUES
                    (:stage_level, :stage_name, :theme, :events, :end_event, :cockpit_asset, :objectives, :kills, :warp_dist, :desc, :par_score, :is_enabled)
                    ON DUPLICATE KEY UPDATE
                        `stage_name` = VALUES(`stage_name`),
                        `environment_theme` = VALUES(`environment_theme`),
                        `events_within_level` = VALUES(`events_within_level`),
                        `end_level_event` = VALUES(`end_level_event`),
                        `cockpit_overlay_asset` = VALUES(`cockpit_overlay_asset`),
                        `mission_objectives` = VALUES(`mission_objectives`),
                        `required_enemy_kills` = VALUES(`required_enemy_kills`),
                        `warp_target_distance` = VALUES(`warp_target_distance`),
                        `description` = VALUES(`description`),
                        `par_score` = VALUES(`par_score`),
                        `is_enabled` = VALUES(`is_enabled`),
                        `updated_at` = NOW()
                ");
                $stmt->execute([
                    ':stage_level'    => $stageLevel,
                    ':stage_name'     => $stageName,
                    ':theme'          => $theme,
                    ':events'         => $eventsWithin,
                    ':end_event'      => $endLevelEvent,
                    ':cockpit_asset'  => $cockpitOverlayAsset,
                    ':objectives'     => $missionObjectives,
                    ':kills'          => $requiredEnemyKills,
                    ':warp_dist'      => $warpTargetDistance,
                    ':desc'           => $description,
                    ':par_score'      => $parScore,
                    ':is_enabled'     => $isEnabled
                ]);
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                @provisionAllWormholeStageFilesAndAudio();
            }

            sendDeviceResponse(true, "Stage {$stageLevel} ('{$stageName}') updated successfully", [
                'stage_level' => $stageLevel,
                'stage_name' => $stageName
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to save stage: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SYNCHRONIZE ALL STAGE AND OBJECT POOL FILES
    // =========================================================================
    if ($action === 'sync_all_stage_files') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');
        }
        try {
            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                $results = provisionAllWormholeStageFilesAndAudio();
                $totalFiles = 0;
                $totalAudio = 0;
                foreach ($results as $r) {
                    $totalFiles += count($r['created_files'] ?? []);
                    $totalAudio += count($r['audio_folders'] ?? []);
                }
                sendDeviceResponse(true, "Successfully provisioned all game stages and object pool files across devices", [
                    'results' => $results,
                    'files_count' => $totalFiles,
                    'audio_folders_count' => $totalAudio
                ]);
            } else {
                sendDeviceResponse(false, 'Provisioning engine unavailable', [], 500);
            }
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to synchronize stage files: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SEED DEFAULT GAME STAGES
    // =========================================================================
    if ($action === 'seed_default_game_stages') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');
        }
        try {
            $pdo = getDbConnection();
            $defaultStages = [
                [1, 'Warp Origin', 'Warp Cyan Corridor', 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert', 'Warp Horizon Jump Gate Initialized', 'Initial entry vector into unstable hyperspace corridor. Low grav-shearing and entry reconnaissance.', 5000, 1],
                [2, 'Event Horizon', 'Event Horizon Amber', 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert', 'Singularity Perimeter Breach', 'High-velocity relativistic light-horizon boundary with intense magnetic shear.', 12000, 1],
                [3, 'Singularity Core', 'Singularity Void Violet', 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening', 'Core Collapse Breakthrough', 'Extreme gravitational distortion sector surrounding the black hole collapse boundary. Heavy kinetic resistance.', 25000, 1],
                [4, 'Quantum Realm', 'Quantum Phasor Magenta', 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation', 'Quantum Conduit Realignment & Safe Extraction', 'Deepest reaches beyond physical spacetime. Omnipresent temporal warping and reality fractures.', 50000, 1],
                [5, 'Final Boss Stage', 'Singularity Overlord Crimson', 'Singularity Horizon Collapse, Dreadnought Gravitational Wave, Titan Core Overcharge, Final Singularity Breach', 'Wormhole Singularity Overlord Defeated', 'The epicenter of the cosmic anomaly where the ancient Singularity Overlord Titan commands relativistic swarm dreadnoughts.', 75000, 1]
            ];
            $ins = $pdo->prepare("
                INSERT INTO `wormhole_game_stages`
                (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `description`, `par_score`, `is_enabled`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `stage_name` = VALUES(`stage_name`),
                    `environment_theme` = VALUES(`environment_theme`),
                    `events_within_level` = VALUES(`events_within_level`),
                    `end_level_event` = VALUES(`end_level_event`),
                    `description` = VALUES(`description`),
                    `par_score` = VALUES(`par_score`),
                    `is_enabled` = VALUES(`is_enabled`),
                    `updated_at` = NOW()
            ");

            $count = 0;
            foreach ($defaultStages as $s) {
                $ins->execute($s);
                $count++;
            }

            if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                provisionAllWormholeStageFilesAndAudio(true);
            }

            sendDeviceResponse(true, "Successfully initialized/reset {$count} default game stages into database.", [
                'count' => $count
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to seed stages: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: SAVE / UPDATE GAME WEAPON
    // =========================================================================
    if ($action === 'save_game_weapon') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Modifying game weapons requires administrative credentials');
        }

        $weaponId = trim($input['weapon_id'] ?? '');
        $weaponName = trim($input['weapon_name'] ?? '');
        $stageLevel = max(1, intval($input['stage_level'] ?? 1));
        $isInitial = (!empty($input['is_initial_weapon']) && $input['is_initial_weapon'] != '0') ? 1 : 0;
        $isAcquirable = (!empty($input['is_acquirable']) && $input['is_acquirable'] != '0') ? 1 : 0;
        $acquireEvent = trim($input['acquire_event'] ?? 'default_start');
        $energyDrain = floatval($input['energy_drain_pct'] ?? 10.0);
        $canOverheat = (isset($input['can_overheat']) && ($input['can_overheat'] == '1' || $input['can_overheat'] === true || $input['can_overheat'] === 'true')) ? 1 : 0;
        $cooldownSec = floatval($input['cooldown_seconds'] ?? 5.0);
        $damagePerHit = max(1, intval($input['damage_per_hit'] ?? 1));
        $bulletSpeed = max(100, intval($input['bullet_speed'] ?? 600));
        $icon = trim($input['icon'] ?? '⚡');
        $colorHex = trim($input['color_hex'] ?? '#ff3344');
        $description = trim($input['description'] ?? '');
        $id = intval($input['id'] ?? 0);

        if (empty($weaponId) || empty($weaponName)) {
            sendDeviceResponse(false, 'Weapon ID (code) and Name are required fields.', [], 400);
        }

        $weaponId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', strtolower($weaponId));

        try {
            if ($isInitial === 1) {
                $clearStmt = $pdo->prepare("UPDATE `wormhole_game_weapons` SET `is_initial_weapon` = 0 WHERE `stage_level` = :stage");
                $clearStmt->execute(['stage' => $stageLevel]);
            }

            if ($id > 0) {
                $updStmt = $pdo->prepare("
                    UPDATE `wormhole_game_weapons` SET
                      `weapon_id` = :wid,
                      `weapon_name` = :wname,
                      `description` = :desc,
                      `icon` = :icon,
                      `color_hex` = :color,
                      `stage_level` = :stage,
                      `is_initial_weapon` = :init,
                      `is_acquirable` = :acq,
                      `acquire_event` = :evt,
                      `energy_drain_pct` = :drain,
                      `can_overheat` = :heat,
                      `cooldown_seconds` = :cool,
                      `damage_per_hit` = :dmg,
                      `bullet_speed` = :spd,
                      `updated_at` = NOW()
                    WHERE `id` = :id
                ");
                $updStmt->execute([
                    'wid' => $weaponId,
                    'wname' => $weaponName,
                    'desc' => $description,
                    'icon' => $icon,
                    'color' => $colorHex,
                    'stage' => $stageLevel,
                    'init' => $isInitial,
                    'acq' => $isAcquirable,
                    'evt' => $acquireEvent,
                    'drain' => $energyDrain,
                    'heat' => $canOverheat,
                    'cool' => $cooldownSec,
                    'dmg' => $damagePerHit,
                    'spd' => $bulletSpeed,
                    'id' => $id
                ]);

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio(true);
                }

                sendDeviceResponse(true, "Weapon '{$weaponName}' updated successfully.", ['id' => $id, 'weapon_id' => $weaponId]);
            } else {
                $insStmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_weapons`
                    (`weapon_id`, `weapon_name`, `description`, `icon`, `color_hex`, `stage_level`, `is_initial_weapon`, `is_acquirable`, `acquire_event`, `energy_drain_pct`, `can_overheat`, `cooldown_seconds`, `damage_per_hit`, `bullet_speed`)
                    VALUES
                    (:wid, :wname, :desc, :icon, :color, :stage, :init, :acq, :evt, :drain, :heat, :cool, :dmg, :spd)
                    ON DUPLICATE KEY UPDATE
                      `weapon_name` = VALUES(`weapon_name`),
                      `description` = VALUES(`description`),
                      `icon` = VALUES(`icon`),
                      `color_hex` = VALUES(`color_hex`),
                      `stage_level` = VALUES(`stage_level`),
                      `is_initial_weapon` = VALUES(`is_initial_weapon`),
                      `is_acquirable` = VALUES(`is_acquirable`),
                      `acquire_event` = VALUES(`acquire_event`),
                      `energy_drain_pct` = VALUES(`energy_drain_pct`),
                      `can_overheat` = VALUES(`can_overheat`),
                      `cooldown_seconds` = VALUES(`cooldown_seconds`),
                      `damage_per_hit` = VALUES(`damage_per_hit`),
                      `bullet_speed` = VALUES(`bullet_speed`),
                      `updated_at` = NOW()
                ");
                $insStmt->execute([
                    'wid' => $weaponId,
                    'wname' => $weaponName,
                    'desc' => $description,
                    'icon' => $icon,
                    'color' => $colorHex,
                    'stage' => $stageLevel,
                    'init' => $isInitial,
                    'acq' => $isAcquirable,
                    'evt' => $acquireEvent,
                    'drain' => $energyDrain,
                    'heat' => $canOverheat,
                    'cool' => $cooldownSec,
                    'dmg' => $damagePerHit,
                    'spd' => $bulletSpeed
                ]);
                $newId = (int)$pdo->lastInsertId();

                if (function_exists('provisionAllWormholeStageFilesAndAudio')) {
                    @provisionAllWormholeStageFilesAndAudio(true);
                }

                sendDeviceResponse(true, "Weapon '{$weaponName}' saved successfully.", ['id' => $newId, 'weapon_id' => $weaponId]);
            }
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to save weapon: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: GET AVAILABLE GAME ASSETS (3D MODELS & IMAGES)
    // =========================================================================
    if ($action === 'get_available_game_assets' || $action === 'list_game_assets') {
        try {
            $allowedExts = ['glb', 'gltf', 'obj', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];
            $roots = [
                dirname(__FILE__) . DIRECTORY_SEPARATOR . 'temp_stage_0',
                dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . 'models',
                '/var/www/calmchessgames_front_end/wormhole0',
                '/var/www/calmchessgames_front_end/meshy_test_0/models',
                dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'updated_html_js_0' . DIRECTORY_SEPARATOR . 'calmchessgames_frontend' . DIRECTORY_SEPARATOR . 'wormhole0',
                dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'updated_html_js_0' . DIRECTORY_SEPARATOR . 'calmchessgames_frontend' . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . 'models',
                (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] ? $_SERVER['DOCUMENT_ROOT'] . '/admin/temp_stage_0' : ''),
                (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] ? $_SERVER['DOCUMENT_ROOT'] . '/wormhole0' : '')
            ];

            $assets = [];
            $seen = [];

            foreach ($roots as $root) {
                if (!$root || !is_dir($root)) continue;
                $realRoot = realpath($root);
                if (!$realRoot || !is_dir($realRoot)) continue;

                try {
                    $iterator = new RecursiveIteratorIterator(
                        new RecursiveDirectoryIterator($realRoot, RecursiveDirectoryIterator::SKIP_DOTS),
                        RecursiveIteratorIterator::SELF_FIRST
                    );

                    foreach ($iterator as $item) {
                        if ($item->isDir()) continue;
                        $ext = strtolower($item->getExtension());
                        if (!in_array($ext, $allowedExts, true)) continue;

                        $fullPath = $item->getPathname();
                        if (strpos($fullPath, 'all_baks') !== false || strpos($fullPath, '.git') !== false) {
                            continue;
                        }

                        $filename = $item->getFilename();
                        if ($filename === '.gitkeep') continue;

                        $relFromRoot = str_replace('\\', '/', substr($fullPath, strlen($realRoot)));
                        $relFromRoot = ltrim($relFromRoot, '/');

                        if (strpos($realRoot, 'meshy_test_0') !== false) {
                            $cleanRelPath = 'meshy_test_0/models/' . $filename;
                        } else {
                            $cleanRelPath = $relFromRoot;
                        }

                        if (isset($seen[$cleanRelPath])) continue;
                        $seen[$cleanRelPath] = true;

                        $type = in_array($ext, ['glb', 'gltf', 'obj'], true) ? 'model' : 'image';
                        $sizeBytes = $item->getSize();

                        if ($sizeBytes >= 1048576) {
                            $sizeFormatted = number_format($sizeBytes / 1048576, 2) . ' MB';
                        } elseif ($sizeBytes >= 1024) {
                            $sizeFormatted = number_format($sizeBytes / 1024, 1) . ' KB';
                        } else {
                            $sizeFormatted = $sizeBytes . ' B';
                        }

                        $device = 'all';
                        if (strpos($cleanRelPath, 'desktop/') === 0 || strpos($cleanRelPath, '/desktop/') !== false) $device = 'desktop';
                        elseif (strpos($cleanRelPath, 'mobile/') === 0 || strpos($cleanRelPath, '/mobile/') !== false) $device = 'mobile';
                        elseif (strpos($cleanRelPath, 'vr/') === 0 || strpos($cleanRelPath, '/vr/') !== false) $device = 'vr';
                        elseif (strpos($cleanRelPath, 'arcore/') === 0 || strpos($cleanRelPath, '/arcore/') !== false) $device = 'arcore';

                        $stage = 'global';
                        if (strpos($cleanRelPath, 'warp_origin') !== false) $stage = 'warp_origin';
                        elseif (strpos($cleanRelPath, 'event_horizon') !== false) $stage = 'event_horizon';
                        elseif (strpos($cleanRelPath, 'singularity_core') !== false) $stage = 'singularity_core';
                        elseif (strpos($cleanRelPath, 'quantum_realm') !== false) $stage = 'quantum_realm';
                        elseif (strpos($cleanRelPath, 'final_boss') !== false) $stage = 'final_boss';
                        elseif (strpos($cleanRelPath, 'nebula_outpost') !== false) $stage = 'nebula_outpost';
                        elseif (strpos($cleanRelPath, 'meshy') !== false) $stage = 'meshy_models';

                        $assets[] = [
                            'path' => $cleanRelPath,
                            'filename' => $filename,
                            'type' => $type,
                            'format' => $ext,
                            'folder' => dirname($cleanRelPath),
                            'device' => $device,
                            'stage' => $stage,
                            'size' => $sizeBytes,
                            'size_formatted' => $sizeFormatted,
                            'mtime' => $item->getMTime()
                        ];
                    }
                } catch (Throwable $ignore) {}
            }

            usort($assets, function($a, $b) {
                if ($a['type'] !== $b['type']) {
                    return $a['type'] === 'model' ? -1 : 1;
                }
                return strcasecmp($a['path'], $b['path']);
            });

            sendDeviceResponse(true, 'Game assets retrieved successfully', [
                'assets' => $assets,
                'count' => count($assets)
            ]);
        } catch (Throwable $e) {
            sendDeviceResponse(false, 'Failed to scan game assets: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // ACTION: GET MODEL JSON METADATA (Scale, Size, Dimensions from .json)
    // =========================================================================
    if ($action === 'get_model_json_metadata' || $action === 'get_graphic_object_json') {
        $modelUrl = trim($input['model_url'] ?? $_GET['model_url'] ?? $_POST['model_url'] ?? '');
        $metadata = [
            'found'     => false,
            'scale'     => 1.0,
            'size_x'    => 1.0,
            'size_y'    => 1.0,
            'size_z'    => 1.0,
            'model_url' => $modelUrl,
            'json_file' => null,
            'data'      => null
        ];

        if (!empty($modelUrl)) {
            $cleanUrl = str_replace('\\', '/', $modelUrl);
            $cleanUrl = ltrim($cleanUrl, '/');
            $filename = basename($cleanUrl);
            $baseName = pathinfo($filename, PATHINFO_FILENAME);

            if (preg_match('/(\d+(?:\.\d+)?)\s*m/i', $filename, $mDim)) {
                $dimVal = floatval($mDim[1]);
                $metadata['size_x'] = $dimVal;
                $metadata['size_y'] = $dimVal;
                $metadata['size_z'] = $dimVal;
            }

            $roots = [
                dirname(__FILE__) . DIRECTORY_SEPARATOR . 'temp_stage_0',
                dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . 'models',
                dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'meshy_test_0',
                dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'wormhole0',
                '/var/www/calmchessgames_front_end/wormhole0',
                '/var/www/calmchessgames_front_end/meshy_test_0/models',
                dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'updated_html_js_0' . DIRECTORY_SEPARATOR . 'calmchessgames_frontend' . DIRECTORY_SEPARATOR . 'wormhole0',
                dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'updated_html_js_0' . DIRECTORY_SEPARATOR . 'calmchessgames_frontend' . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . 'models',
                dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'updated_html_js_0' . DIRECTORY_SEPARATOR . 'calmchessgames_frontend' . DIRECTORY_SEPARATOR . 'meshy_test_0',
                (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] ? $_SERVER['DOCUMENT_ROOT'] . '/admin/temp_stage_0' : ''),
                (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] ? $_SERVER['DOCUMENT_ROOT'] . '/wormhole0' : ''),
                (isset($_SERVER['DOCUMENT_ROOT']) && $_SERVER['DOCUMENT_ROOT'] ? $_SERVER['DOCUMENT_ROOT'] . '/meshy_test_0/models' : '')
            ];

            $candidateJsonNames = [
                $baseName . '_materials.json',
                $baseName . '.json',
                'materials.json',
                'final_result.json',
                'preview_result.json'
            ];

            $foundJsonPath = null;
            $foundData = null;

            foreach ($roots as $root) {
                if (!$root || !is_dir($root)) continue;
                $realRoot = realpath($root);
                if (!$realRoot) continue;

                $directDir = dirname($realRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $cleanUrl));
                if (is_dir($directDir)) {
                    foreach ($candidateJsonNames as $cName) {
                        $testFile = $directDir . DIRECTORY_SEPARATOR . $cName;
                        if (file_exists($testFile) && is_readable($testFile)) {
                            $content = file_get_contents($testFile);
                            $json = json_decode($content, true);
                            if ($json && is_array($json)) {
                                $foundJsonPath = $testFile;
                                $foundData = $json;
                                break 2;
                            }
                        }
                    }
                }

                try {
                    $iterator = new RecursiveIteratorIterator(
                        new RecursiveDirectoryIterator($realRoot, RecursiveDirectoryIterator::SKIP_DOTS),
                        RecursiveIteratorIterator::SELF_FIRST
                    );
                    foreach ($iterator as $item) {
                        if ($item->isDir()) continue;
                        $itemFilename = $item->getFilename();
                        if (in_array(strtolower($itemFilename), array_map('strtolower', $candidateJsonNames), true)) {
                            $itemDir = dirname($item->getPathname());
                            if (stripos($itemDir, $baseName) !== false || stripos($itemFilename, $baseName) !== false || stripos($cleanUrl, basename($itemDir)) !== false) {
                                $content = file_get_contents($item->getPathname());
                                $json = json_decode($content, true);
                                if ($json && is_array($json)) {
                                    $foundJsonPath = $item->getPathname();
                                    $foundData = $json;
                                    break 2;
                                }
                            }
                        }
                    }
                } catch (Throwable $e) {}
            }

            if ($foundData) {
                $metadata['found'] = true;
                $metadata['json_file'] = basename($foundJsonPath);
                $metadata['data'] = $foundData;

                if (isset($foundData['scale']) && is_numeric($foundData['scale'])) {
                    $metadata['scale'] = floatval($foundData['scale']);
                } elseif (isset($foundData['scale_applied_to_glb']) && is_numeric($foundData['scale_applied_to_glb'])) {
                    $metadata['scale'] = floatval($foundData['scale_applied_to_glb']);
                }

                $dims = null;
                if (!empty($foundData['reference_dimensions_m_unused']) && is_array($foundData['reference_dimensions_m_unused'])) {
                    $dims = $foundData['reference_dimensions_m_unused'];
                } elseif (!empty($foundData['dimensions']) && is_array($foundData['dimensions'])) {
                    $dims = $foundData['dimensions'];
                } elseif (!empty($foundData['size']) && is_array($foundData['size'])) {
                    $dims = $foundData['size'];
                }

                if ($dims) {
                    if (isset($dims['x']) && is_numeric($dims['x'])) $metadata['size_x'] = floatval($dims['x']);
                    if (isset($dims['y']) && is_numeric($dims['y'])) $metadata['size_y'] = floatval($dims['y']);
                    if (isset($dims['z']) && is_numeric($dims['z'])) $metadata['size_z'] = floatval($dims['z']);
                    if (isset($dims['length']) && is_numeric($dims['length'])) $metadata['size_x'] = floatval($dims['length']);
                    if (isset($dims['height']) && is_numeric($dims['height'])) $metadata['size_y'] = floatval($dims['height']);
                    if (isset($dims['depth']) && is_numeric($dims['depth'])) $metadata['size_z'] = floatval($dims['depth']);
                }
            }
        }

        sendDeviceResponse(true, $metadata['found'] ? 'Model metadata retrieved from .json' : 'Default metadata initialized', $metadata);
    }

    // =========================================================================
    // ACTION: UPLOAD GAME ASSET (.glb, .gltf, .obj, .png, .jpg, .webp, .svg)
    // =========================================================================
    if ($action === 'upload_game_asset') {
        if (function_exists('requireAdminApiToken')) {
            requireAdminApiToken($input, 'Unauthorized: Uploading game assets requires administrative credentials');
        }

        if (empty($_FILES['asset_file'])) {
            sendDeviceResponse(false, 'No file uploaded under asset_file', [], 400);
        }

        $file = $_FILES['asset_file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendDeviceResponse(false, 'File upload error code: ' . $file['error'], [], 400);
        }

        $rawName = basename($file['name']);
        $ext = strtolower(pathinfo($rawName, PATHINFO_EXTENSION));
        $allowedExts = ['glb', 'gltf', 'obj', 'png', 'jpg', 'jpeg', 'webp', 'svg'];
        if (!in_array($ext, $allowedExts, true)) {
            sendDeviceResponse(false, "Unsupported file format '.{$ext}'. Allowed: " . implode(', ', $allowedExts), [], 400);
        }

        $folder = trim($_POST['destination_folder'] ?? $_GET['destination_folder'] ?? 'mobile/event_horizon_images');
        $folder = preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $folder);
        $folder = trim($folder, '/');
        if (empty($folder)) {
            $folder = in_array($ext, ['glb', 'gltf', 'obj'], true) ? 'mobile/event_horizon_images' : 'desktop/event_horizon_images';
        }

        $cleanFilename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $rawName);

        $targetBases = [
            dirname(__FILE__) . DIRECTORY_SEPARATOR . 'temp_stage_0',
            '/var/www/calmchessgames_front_end/wormhole0',
            dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'updated_html_js_0' . DIRECTORY_SEPARATOR . 'calmchessgames_frontend' . DIRECTORY_SEPARATOR . 'wormhole0'
        ];

        $savedPrimary = false;
        $primaryPath = '';
        $filesize = $file['size'];

        foreach ($targetBases as $tb) {
            $destDir = $tb . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $folder);
            if (!is_dir($destDir)) {
                @mkdir($destDir, 0777, true);
            }
            @chmod($destDir, 0777);

            $destFile = $destDir . DIRECTORY_SEPARATOR . $cleanFilename;
            if (!$savedPrimary) {
                if (move_uploaded_file($file['tmp_name'], $destFile)) {
                    @chmod($destFile, 0666);
                    $savedPrimary = true;
                    $primaryPath = $destFile;
                }
            } elseif ($primaryPath && file_exists($primaryPath)) {
                @copy($primaryPath, $destFile);
                @chmod($destFile, 0666);
            }
        }

        if (!$savedPrimary) {
            sendDeviceResponse(false, 'Failed to save uploaded asset file to destination directory', [], 500);
        }

        $relativeUrl = $folder . '/' . $cleanFilename;
        sendDeviceResponse(true, "Asset '{$cleanFilename}' uploaded successfully", [
            'path' => $relativeUrl,
            'filename' => $cleanFilename,
            'format' => $ext,
            'type' => in_array($ext, ['glb', 'gltf', 'obj'], true) ? 'model' : 'image',
            'size' => $filesize
        ]);
    }

sendDeviceResponse(false, "Unrecognized action '{$action}'.", [], 400);

} catch (Throwable $e) {
    error_log('wormhole_device_api.php error: ' . $e->getMessage());
    sendDeviceResponse(false, 'Internal Server Error: ' . $e->getMessage(), [], 500);
}
