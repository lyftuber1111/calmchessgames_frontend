<?php
/**
 * Wormhole XR - Device Capability & Telemetry Gateway
 * Validates hardware support for Desktop XR, PCVR, Mobile XR, and Mobile AR (ARCore).
 * Calm Chess Computers (c) 2026. All Rights Reserved.
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
            if ((int)$existing['is_supported'] === 0) {
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
                // Check if specific requested mode is permitted
                $modesAllowed = array_map('trim', explode(',', strtolower($existing['supported_modes'])));
                if (!in_array(strtolower($mode), $modesAllowed, true)) {
                    $isSupported = false;
                    $reason = "Mode '{$mode}' is not validated for {$existing['device_name']}. Permitted modes: " . implode(', ', $modesAllowed);
                }

                // Increment report count & refresh timestamp
                $upStmt = $pdo->prepare('UPDATE `wormhole_devices` SET `reported_count` = `reported_count` + 1, `updated_at` = NOW() WHERE `id` = :id');
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

    sendDeviceResponse(false, "Unrecognized action '{$action}'.", [], 400);

} catch (Throwable $e) {
    error_log('wormhole_device_api.php error: ' . $e->getMessage());
    sendDeviceResponse(false, 'Internal Server Error: ' . $e->getMessage(), [], 500);
}
