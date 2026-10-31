<?php
/**
 * Wormhole XR - Device Capability & Telemetry Gateway
 * Validates hardware support for Desktop XR, PCVR, Mobile XR, and Mobile AR (ARCore).
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 */

if (file_exists(__DIR__ . '/cors.php')) {
    require_once __DIR__ . '/cors.php';
} elseif (file_exists(__DIR__ . '/../cors.php')) {
    require_once __DIR__ . '/../cors.php';
}

ini_set('display_errors', '0');
error_reporting(E_ALL);

if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} elseif (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
}

header('Content-Type: application/json; charset=utf-8');

function sendDeviceResponse(bool $success, string $message, array $data = [], int $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c')
    ], $data), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// Auto-initialize table if needed
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
              INDEX `idx_device_name` (`device_name`),
              INDEX `idx_is_supported` (`is_supported`),
              INDEX `idx_device_type` (`device_type`),
              INDEX `idx_ua_hash` (`user_agent_hash`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } catch (Throwable $e) {
        error_log("ensureWormholeTable error: " . $e->getMessage());
    }
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
    // ACTION: CHECK DEVICE SUPPORT
    // =========================================================================
    if ($action === 'check' || $action === 'check_device') {
        $mode = trim($input['mode'] ?? 'desktop-xr');
        $deviceName = trim($input['device_name'] ?? 'Unknown Device');
        $deviceType = trim($input['device_type'] ?? 'unknown');
        $osPlatform = trim($input['os_platform'] ?? '');
        $browser = trim($input['browser'] ?? '');
        $gpuRenderer = trim($input['gpu_renderer'] ?? '');
        $immersiveVr = !empty($input['immersive_vr']);
        $immersiveAr = !empty($input['immersive_ar']);
        $hasTouch = !empty($input['has_touch']);
        $hasGamepad = !empty($input['has_gamepad']);
        $rawUa = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $uaHash = hash('sha256', $rawUa . $deviceName);

        // Sanitize string inputs
        $deviceName = htmlspecialchars(substr($deviceName, 0, 250), ENT_QUOTES, 'UTF-8');
        $osPlatform = htmlspecialchars(substr($osPlatform, 0, 95), ENT_QUOTES, 'UTF-8');
        $browser = htmlspecialchars(substr($browser, 0, 95), ENT_QUOTES, 'UTF-8');
        $gpuRenderer = htmlspecialchars(substr($gpuRenderer, 0, 250), ENT_QUOTES, 'UTF-8');

        // Check if device is explicitly listed in database
        $stmt = $pdo->prepare("SELECT * FROM `wormhole_devices` WHERE `device_name` = :name OR `user_agent_hash` = :hash LIMIT 1");
        $stmt->execute(['name' => $deviceName, 'hash' => $uaHash]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $isSupported = true;
        $reason = '';
        $recommendedMode = 'desktop-xr';

        if ($existing) {
            // Check whitelist / blacklist status
            if ((int)$existing['is_supported'] === 0) {
                $isSupported = false;
                $reason = "This device model ({$existing['device_name']}) has been marked as incompatible in the system hardware register.";
            } else {
                // Check if specific requested mode is permitted
                $modesAllowed = array_map('trim', explode(',', strtolower($existing['supported_modes'])));
                if (!in_array(strtolower($mode), $modesAllowed, true)) {
                    $isSupported = false;
                    $reason = "Mode '{$mode}' is not validated for {$existing['device_name']}. Permitted modes: " . implode(', ', $modesAllowed);
                }
            }

            // Increment report count
            $upStmt = $pdo->prepare("UPDATE `wormhole_devices` SET `reported_count` = `reported_count` + 1, `updated_at` = NOW() WHERE `id` = :id");
            $upStmt->execute(['id' => $existing['id']]);
        } else {
            // Dynamic capability heuristics for unlisted hardware
            if ($mode === 'desktop-vr') {
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
                    $reason = "Mobile XR works best with touchscreen or mobile VR viewer. Keyboard/mouse detected; desktop mode recommended.";
                }
            }

            // Secure telemetry auto-registration
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
                ");
                $insStmt->execute([
                    'name'      => $deviceName,
                    'type'      => in_array($deviceType, ['desktop','vr_hmd','mobile','tablet','ar_glasses','unknown']) ? $deviceType : 'unknown',
                    'os'        => $osPlatform,
                    'browser'   => $browser,
                    'gpu'       => $gpuRenderer,
                    'modes'     => $modesStr,
                    'supported' => $isSupported ? 1 : 0,
                    'notes'     => $isSupported ? "Auto-detected compatible device via WebXR telemetry." : "Flagged via capability test: " . substr($reason, 0, 200),
                    'hash'      => $uaHash
                ]);
            } catch (Throwable $e) {
                error_log("Failed to insert telemetry device: " . $e->getMessage());
            }
        }

        sendDeviceResponse(true, "Device support analysis complete.", [
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

        $upStmt = $pdo->prepare("UPDATE `wormhole_devices` SET `reported_count` = `reported_count` + 1 WHERE `user_agent_hash` = :hash OR `device_name` = :name");
        $upStmt->execute(['hash' => $uaHash, 'name' => $deviceName]);

        sendDeviceResponse(true, "Telemetry logged successfully.");
    }

    sendDeviceResponse(false, "Unrecognized action '{$action}'.", [], 400);

} catch (Throwable $e) {
    error_log("wormhole_device_api.php error: " . $e->getMessage());
    sendDeviceResponse(false, "Internal Server Error: " . $e->getMessage(), [], 500);
}
