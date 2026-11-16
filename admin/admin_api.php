<?php
/**
 * Calm Chess Computers - Admin API & Management Gateway
 * (c) 2026 Calm Chess Computers. All Rights Reserved.
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

$action = isset($_GET['action']) ? $_GET['action'] : '';
$input = function_exists('getJsonInput') ? getJsonInput() : (json_decode(file_get_contents('php://input'), true) ?? []);
if (!is_array($input)) {
    $input = array();
}
if (!empty($_GET)) {
    $input = array_merge($_GET, $input);
}
if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

if (!function_exists('checkAdminKey')) {
    function checkAdminKey(array $input) {
        return validateAdminApiToken($input);
    }
}

// Caller IP resolution helper
if (!function_exists('getAdminApiCallerIp')) {
    function getAdminApiCallerIp(): string {
        $ip = '';
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $ip = trim($_SERVER['HTTP_CF_CONNECTING_IP']);
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = trim($_SERVER['HTTP_X_REAL_IP']);
        } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = trim($_SERVER['HTTP_CLIENT_IP']);
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($parts[0]);
        } else {
            $ip = trim($_SERVER['REMOTE_ADDR'] ?? '');
        }

        // Strip IPv6-mapped IPv4 prefix (::ffff:50.96.3.12 -> 50.96.3.12)
        if (strpos($ip, '::ffff:') === 0) {
            $ip = substr($ip, 7);
        }
        return $ip;
    }
}

// IP Authorization check helper against database site_settings
if (!function_exists('isAdminApiIpAuthorized')) {
    function isAdminApiIpAuthorized(PDO $pdo, string $clientIp): bool {
        // Localhost requests are always permitted (CLI/cron/local proxies)
        if ($clientIp === '127.0.0.1' || $clientIp === '::1' || $clientIp === 'localhost') {
            return true;
        }

        $allowed = '50.96.3.12';
        try {
            $stmt = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'admin_allowed_ip' LIMIT 1");
            $stmt->execute();
            $val = $stmt->fetchColumn();
            if ($val !== false && trim((string)$val) !== '') {
                $allowed = trim((string)$val);
            }
        } catch (Throwable $e) {}

        if ($allowed === '*' || empty($allowed)) {
            return true;
        }

        $allowedEntries = array_filter(array_map('trim', explode(',', $allowed)));
        foreach ($allowedEntries as $entry) {
            $entry = trim($entry, "\"'");
            if ($entry === '*' || $entry === $clientIp) {
                return true;
            }

            // Wildcard prefix matching (e.g. 50.96.* or 50.96.3.*)
            if (strpos($entry, '*') !== false) {
                $prefix = rtrim(str_replace('*', '', $entry), '.');
                if ($prefix !== '' && strpos($clientIp, $prefix) === 0) {
                    return true;
                }
            }

            // CIDR subnet matching (e.g. 50.96.3.0/24)
            if (strpos($entry, '/') !== false) {
                $parts = explode('/', $entry, 2);
                $subnet = $parts[0] ?? '';
                $bits = (int)($parts[1] ?? 0);
                if ($bits >= 0 && $bits <= 32 && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && filter_var($clientIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    $subnetLong = ip2long($subnet);
                    $clientLong = ip2long($clientIp);
                    $mask = -1 << (32 - $bits);
                    if (($subnetLong & $mask) === ($clientLong & $mask)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

if (file_exists(__DIR__ . '/wormhole_stage_provisioner.php')) {
    require_once __DIR__ . '/wormhole_stage_provisioner.php';
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

try {
    $pdo = getDbConnection();

    // Enforce IP Access Restriction for all administrative endpoints
    $publicActions = array('get_mode', 'sync_bank', 'buy_credits', 'simulated_purchase', 'get_simulated_credits');
    if (!in_array($action, $publicActions, true)) {
        $callerIp = getAdminApiCallerIp();
        if (!isAdminApiIpAuthorized($pdo, $callerIp)) {
            http_response_code(403);
            sendJsonResponse(false, 'Access Denied: Your IP address (' . htmlspecialchars($callerIp) . ') is not authorized to access administrative operations.', array(
                'client_ip'  => $callerIp,
                'authorized' => false
            ), 403);
        }
    }

    // Ensure purchases table cascade constraint is removed so 7-year statutory financial audit records are never destroyed on user purge
    try {
        $pdo->exec("ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_ibfk_1`");
    } catch (Throwable $e) {}
    try {
        $pdo->exec("ALTER TABLE `purchases` MODIFY `user_id` INT NULL DEFAULT NULL");
    } catch (Throwable $e) {}
    try {
        $pdo->exec("ALTER TABLE `purchases` ADD COLUMN `is_simulated` TINYINT(1) DEFAULT 0 AFTER `payment_method`");
    } catch (Throwable $e) {}

    // 1. VERIFY AUTH & ISSUE CRYPTOGRAPHIC ADMIN JWT
    if ($action === 'verify_auth') {
        $submittedPassword = trim((string)($input['password'] ?? $input['admin_password'] ?? $input['admin_key'] ?? ''));
        $isAuthenticated = false;

        // Fetch admin password hash from database site_settings
        $hash = null;
        try {
            $stmt = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'admin_password_hash' LIMIT 1");
            $stmt->execute();
            $hash = $stmt->fetchColumn();
        } catch (Throwable $e) {}

        if (!empty($hash) && !empty($submittedPassword)) {
            if (password_verify($submittedPassword, $hash)) {
                $isAuthenticated = true;
            }
        }

        // Also check if valid existing JWT was provided
        if (!$isAuthenticated && validateAdminApiToken($input)) {
            $isAuthenticated = true;
        }

        if ($isAuthenticated) {
            if (session_status() === PHP_SESSION_NONE) {
                @session_start();
            }
            session_regenerate_id(true);
            $_SESSION['is_admin'] = true;

            $jwt = generateJwt([
                'role'     => 'admin',
                'username' => 'admin',
                'sub'      => 'admin',
                'aud'      => 'calmchess_admin'
            ], null, 7200); // 2 hour validity

            sendJsonResponse(true, 'Authentication successful', array(
                'authenticated' => true,
                'token_type'    => 'Bearer',
                'token'         => $jwt,
                'api_token'     => $jwt,
                'expires_in'    => 7200
            ));
        } else {
            sendJsonResponse(false, 'Unauthorized: Invalid administrative credentials', array(), 401);
        }
    }

    // 2. GET CURRENT MODE & SETTINGS (Public endpoint for App and Web)
    if ($action === 'get_mode') {
        $desktopSim = false;
        $androidSim = false;
        $allowGuest = true;
        $geminiEnabled = true;
        $geminiConfigured = false;
        $adminAllowedIp = '50.96.3.12';
        $guestLoginsTotal = 0;
        $guestLoginsToday = 0;
        $guestLoginsLastAt = null;
        $guestActive24h = 0;
        $guestDbCount = 0;
        try {
            $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('simulation_mode', 'desktop_simulation_mode', 'android_simulation_mode', 'allow_guest', 'gemini_commentary_enabled', 'gemini_api_key', 'admin_allowed_ip', 'guest_logins_total', 'guest_logins_today', 'guest_logins_today_date', 'guest_logins_last_at')");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            if (isset($rows['desktop_simulation_mode'])) {
                $desktopSim = ($rows['desktop_simulation_mode'] === '1' || strtolower($rows['desktop_simulation_mode']) === 'true');
            } elseif (isset($rows['simulation_mode'])) {
                $desktopSim = ($rows['simulation_mode'] === '1' || strtolower($rows['simulation_mode']) === 'true');
            }

            if (isset($rows['android_simulation_mode'])) {
                $androidSim = ($rows['android_simulation_mode'] === '1' || strtolower($rows['android_simulation_mode']) === 'true');
            } else {
                $androidSim = $desktopSim;
            }

            if (isset($rows['allow_guest'])) {
                $allowGuest = ($rows['allow_guest'] === '1' || strtolower($rows['allow_guest']) === 'true');
            }

            if (isset($rows['gemini_commentary_enabled'])) {
                $geminiEnabled = ($rows['gemini_commentary_enabled'] === '1' || strtolower($rows['gemini_commentary_enabled']) === 'true');
            }
            if (!empty($rows['gemini_api_key']) || !empty(getenv('GEMINI_API_KEY'))) {
                $geminiConfigured = true;
            }
            if (isset($rows['admin_allowed_ip']) && trim((string)$rows['admin_allowed_ip']) !== '') {
                $adminAllowedIp = trim((string)$rows['admin_allowed_ip']);
            }
            $guestLoginsTotal = isset($rows['guest_logins_total']) ? (int)$rows['guest_logins_total'] : 0;
            $savedDate = $rows['guest_logins_today_date'] ?? '';
            $guestLoginsToday = ($savedDate === date('Y-m-d') && isset($rows['guest_logins_today'])) ? (int)$rows['guest_logins_today'] : 0;
            $guestLoginsLastAt = $rows['guest_logins_last_at'] ?? null;
        } catch (Exception $e) {}

        try {
            $gStmt = $pdo->query("SELECT COUNT(DISTINCT session_id) FROM guest_login_events WHERE logged_in_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            if ($gStmt) $guestActive24h = (int)$gStmt->fetchColumn();
        } catch (Throwable $e) {}

        try {
            $uTable = 'users';
            try { $pdo->query("SELECT 1 FROM users LIMIT 1"); } catch (Throwable $te) { $uTable = 'blackjack_users'; }
            $uStmt = $pdo->query("SELECT COUNT(*) FROM `{$uTable}` WHERE is_guest = 1");
            if ($uStmt) $guestDbCount = (int)$uStmt->fetchColumn();
        } catch (Throwable $e) {}

            $paypalEnv = defined('PAYPAL_ENV') ? PAYPAL_ENV : 'sandbox';
            sendJsonResponse(true, 'Mode retrieved', array(
                'simulation_mode'           => $desktopSim,
                'desktop_simulation_mode'   => $desktopSim,
                'android_simulation_mode'   => $androidSim,
                'allow_guest'               => $allowGuest,
                'android_billing_mode'      => $androidSim ? 'SIMULATED' : 'GOOGLE_PLAY',
                'desktop_billing_mode'      => $desktopSim ? 'SIMULATED' : ($paypalEnv === 'sandbox' ? 'PAYPAL_SANDBOX' : 'PAYPAL'),
                'paypal_env'                => $paypalEnv,
                'paypal_client_id'          => defined('PAYPAL_CLIENT_ID') ? PAYPAL_CLIENT_ID : '',
                'guest_logins_total'        => $guestLoginsTotal,
                'guest_logins_today'        => $guestLoginsToday,
                'guest_logins_last_at'      => $guestLoginsLastAt,
                'guest_active_24h'          => $guestActive24h,
                'guest_db_count'            => $guestDbCount,
                'gemini_model'              => 'gemini-3.8-flash',
                'gemini_commentary_enabled' => $geminiEnabled,
                'gemini_configured'         => $geminiConfigured,
                'admin_allowed_ip'          => $adminAllowedIp,
                'client_ip'                 => getAdminApiCallerIp()
            ));
    }

    // 3. SET MODE & SYSTEM SETTINGS (Admin protected feature toggle)
    if ($action === 'set_mode') {
        requireAdminApiToken($input, 'Unauthorized: Feature toggles require a valid authentication API token');

        $androidSim = null;
        if (isset($input['android_simulation_mode'])) {
            $androidSim = (!empty($input['android_simulation_mode']) && $input['android_simulation_mode'] !== 'false') ? '1' : '0';
        } elseif (isset($input['enable_android_simulation'])) {
            $androidSim = (!empty($input['enable_android_simulation']) && $input['enable_android_simulation'] !== 'false') ? '1' : '0';
        }

        $desktopSim = null;
        if (isset($input['desktop_simulation_mode'])) {
            $desktopSim = (!empty($input['desktop_simulation_mode']) && $input['desktop_simulation_mode'] !== 'false') ? '1' : '0';
        } elseif (isset($input['enable_desktop_simulation'])) {
            $desktopSim = (!empty($input['enable_desktop_simulation']) && $input['enable_desktop_simulation'] !== 'false') ? '1' : '0';
        } elseif (isset($input['simulation_mode'])) {
            $desktopSim = (!empty($input['simulation_mode']) && $input['simulation_mode'] !== 'false') ? '1' : '0';
        } elseif (isset($input['enable_simulation'])) {
            $desktopSim = (!empty($input['enable_simulation']) && $input['enable_simulation'] !== 'false') ? '1' : '0';
        }

        $allowGuest = null;
        if (isset($input['allow_guest'])) {
            $allowGuest = (!empty($input['allow_guest']) && $input['allow_guest'] !== 'false') ? '1' : '0';
        } elseif (isset($input['enable_guest'])) {
            $allowGuest = (!empty($input['enable_guest']) && $input['enable_guest'] !== 'false') ? '1' : '0';
        }

        $geminiEnabled = null;
        if (isset($input['gemini_commentary_enabled'])) {
            $geminiEnabled = (!empty($input['gemini_commentary_enabled']) && $input['gemini_commentary_enabled'] !== 'false') ? '1' : '0';
        }

        $geminiApiKey = null;
        if (isset($input['gemini_api_key'])) {
            $geminiApiKey = trim((string)$input['gemini_api_key']);
        }

        $newAllowedIp = null;
        if (isset($input['admin_allowed_ip'])) {
            $newAllowedIp = trim((string)$input['admin_allowed_ip']);
        }

        try {
            if ($androidSim !== null) {
                $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('android_simulation_mode', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt->execute(array(':val' => $androidSim, ':val2' => $androidSim));
            }
            if ($desktopSim !== null) {
                $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('desktop_simulation_mode', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt->execute(array(':val' => $desktopSim, ':val2' => $desktopSim));

                // Synchronize legacy simulation_mode for backwards compatibility
                $stmt2 = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('simulation_mode', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt2->execute(array(':val' => $desktopSim, ':val2' => $desktopSim));
            }
            if ($allowGuest !== null) {
                $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('allow_guest', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt->execute(array(':val' => $allowGuest, ':val2' => $allowGuest));
            }
            if ($geminiEnabled !== null) {
                $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('gemini_commentary_enabled', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt->execute(array(':val' => $geminiEnabled, ':val2' => $geminiEnabled));
            }
            if ($geminiApiKey !== null) {
                $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('gemini_api_key', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt->execute(array(':val' => $geminiApiKey, ':val2' => $geminiApiKey));
            }
            if ($newAllowedIp !== null && $newAllowedIp !== '') {
                $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('admin_allowed_ip', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                $stmt->execute(array(':val' => $newAllowedIp, ':val2' => $newAllowedIp));
            }
        } catch (Exception $e) {}

        // Read back persisted state
        $curDesktopSim = ($desktopSim !== null) ? ($desktopSim === '1') : false;
        $curAndroidSim = ($androidSim !== null) ? ($androidSim === '1') : false;
        $curGuest = ($allowGuest !== null) ? ($allowGuest === '1') : true;
        $curGemini = ($geminiEnabled !== null) ? ($geminiEnabled === '1') : true;
        $curGeminiConfigured = false;
        $curAllowedIp = '50.96.3.12';

        try {
            $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('simulation_mode', 'desktop_simulation_mode', 'android_simulation_mode', 'allow_guest', 'gemini_commentary_enabled', 'gemini_api_key', 'admin_allowed_ip')");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            if (isset($rows['desktop_simulation_mode'])) {
                $curDesktopSim = ($rows['desktop_simulation_mode'] === '1' || strtolower($rows['desktop_simulation_mode']) === 'true');
            } elseif (isset($rows['simulation_mode'])) {
                $curDesktopSim = ($rows['simulation_mode'] === '1' || strtolower($rows['simulation_mode']) === 'true');
            }
            if (isset($rows['android_simulation_mode'])) {
                $curAndroidSim = ($rows['android_simulation_mode'] === '1' || strtolower($rows['android_simulation_mode']) === 'true');
            }
            if (isset($rows['allow_guest'])) {
                $curGuest = ($rows['allow_guest'] === '1' || strtolower($rows['allow_guest']) === 'true');
            }
            if (isset($rows['gemini_commentary_enabled'])) {
                $curGemini = ($rows['gemini_commentary_enabled'] === '1' || strtolower($rows['gemini_commentary_enabled']) === 'true');
            }
            if (!empty($rows['gemini_api_key']) || !empty(getenv('GEMINI_API_KEY'))) {
                $curGeminiConfigured = true;
            }
            if (isset($rows['admin_allowed_ip']) && trim((string)$rows['admin_allowed_ip']) !== '') {
                $curAllowedIp = trim((string)$rows['admin_allowed_ip']);
            }
        } catch (Exception $e) {}

        sendJsonResponse(true, 'Database configuration updated successfully', array(
            'simulation_mode'           => $curDesktopSim,
            'desktop_simulation_mode'   => $curDesktopSim,
            'android_simulation_mode'   => $curAndroidSim,
            'allow_guest'               => $curGuest,
            'android_billing_mode'      => $curAndroidSim ? 'SIMULATED' : 'GOOGLE_PLAY',
            'desktop_billing_mode'      => $curDesktopSim ? 'SIMULATED' : 'PAYPAL',
            'gemini_model'              => 'gemini-3.8-flash',
            'gemini_commentary_enabled' => $curGemini,
            'gemini_configured'         => $curGeminiConfigured,
            'admin_allowed_ip'          => $curAllowedIp,
            'client_ip'                 => getAdminApiCallerIp()
        ));
    }

    // 3b. UPDATE ADMIN ALLOWED IP WHITELIST
    if ($action === 'update_allowed_ip') {
        requireAdminApiToken($input, 'Unauthorized: Updating administrative IP whitelist requires a valid authentication API token');
        $newIp = trim((string)($input['admin_allowed_ip'] ?? $input['allowed_ip'] ?? ''));
        if ($newIp === '') {
            sendJsonResponse(false, 'Allowed IP address cannot be empty. Use * to allow all IPs.');
        }
        $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('admin_allowed_ip', :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
        $stmt->execute(array(':val' => $newIp, ':val2' => $newIp));
        sendJsonResponse(true, 'Admin allowed IP address updated successfully to: ' . $newIp, array(
            'admin_allowed_ip' => $newIp,
            'client_ip'        => getAdminApiCallerIp()
        ));
    }

    // 3c. UPDATE RING SEGMENTS & CENTER KNIGHT LOGO URL
    if ($action === 'update_segments' || $action === 'save_segments') {
        requireAdminApiToken($input, 'Unauthorized: Ring configuration requires a valid administrative token');

        $centerLogoUrl = trim((string)($input['center_logo_url'] ?? ''));
        if ($centerLogoUrl === '' && !empty($input['segments']) && is_array($input['segments'])) {
            foreach ($input['segments'] as $seg) {
                if (isset($seg['ring_type']) && $seg['ring_type'] === 'center' && !empty($seg['url'])) {
                    $centerLogoUrl = trim((string)$seg['url']);
                    break;
                }
            }
        }

        if ($centerLogoUrl === '') {
            sendJsonResponse(false, 'Center knight logo URL is required to save ring configurations.', [
                'field' => 'center_logo_url'
            ], 400);
        }

        $cleanCenterUrl = trim($centerLogoUrl);
        if (preg_match('/^(javascript|data|vbscript):/i', $cleanCenterUrl) || preg_match('/[\x00-\x1f\x7f]/', $cleanCenterUrl)) {
            $cleanCenterUrl = '#';
        } else {
            $cleanCenterUrl = strip_tags($cleanCenterUrl);
        }

        try {
            $pdo->beginTransaction();

            $settingStmt = $pdo->prepare("
                INSERT INTO site_settings (setting_key, setting_value) 
                VALUES ('center_logo_url', :val)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            $settingStmt->execute(['val' => $cleanCenterUrl]);

            try {
                $centerSegStmt = $pdo->prepare("
                    INSERT INTO ring_segments (ring_type, segment_index, title, url, description, show_text, is_active) 
                    VALUES ('center', 0, 'Center Logo', :url, 'Center knight logo single-click redirect URL', 0, 1)
                    ON DUPLICATE KEY UPDATE url = VALUES(url)
                ");
                $centerSegStmt->execute(['url' => $cleanCenterUrl]);
            } catch (Throwable $e) {}

            if (isset($input['segments']) && is_array($input['segments'])) {
                $updateStmt = $pdo->prepare("
                    INSERT INTO ring_segments (ring_type, segment_index, title, url, description, is_active) 
                    VALUES (:ring_type, :segment_index, :title, :url, :description, :is_active)
                    ON DUPLICATE KEY UPDATE 
                        title = VALUES(title),
                        url = VALUES(url),
                        description = VALUES(description),
                        is_active = VALUES(is_active)
                ");

                foreach ($input['segments'] as $seg) {
                    if (isset($seg['ring_type']) && $seg['ring_type'] === 'center') {
                        continue;
                    }
                    $ringType = strip_tags((string)($seg['ring_type'] ?? 'inner'));
                    if ($ringType !== 'inner' && $ringType !== 'outer') {
                        $ringType = 'inner';
                    }
                    $segIdx = filter_var($seg['segment_index'] ?? 0, FILTER_VALIDATE_INT);
                    if ($segIdx === false) $segIdx = 0;

                    $title = strip_tags(trim((string)($seg['title'] ?? '')));
                    $u = trim((string)($seg['url'] ?? ''));
                    if (preg_match('/^(javascript|data|vbscript):/i', $u) || preg_match('/[\x00-\x1f\x7f]/', $u)) {
                        $u = '#';
                    } else {
                        $u = strip_tags($u);
                    }
                    $desc = strip_tags(trim((string)($seg['description'] ?? '')));
                    $isActive = (isset($seg['is_active']) && ($seg['is_active'] === 0 || $seg['is_active'] === '0')) ? 0 : 1;

                    $updateStmt->execute([
                        'ring_type'     => $ringType,
                        'segment_index' => $segIdx,
                        'title'         => $title,
                        'url'           => $u,
                        'description'   => $desc,
                        'is_active'     => $isActive
                    ]);
                }
            }

            $pdo->commit();
            sendJsonResponse(true, 'Ring segments and center logo URL successfully updated', [
                'center_logo_url' => $cleanCenterUrl
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            sendJsonResponse(false, 'Error updating ring settings: ' . $e->getMessage(), [], 500);
        }
    }

    // 4. GET COMPLETE DASHBOARD DATA (For HTML Admin Console)
    if ($action === 'get_dashboard_data') {
        requireAdminApiToken($input, 'Unauthorized: Administrative dashboard requires a valid authentication API token');

        // Get site settings
        $desktopSim = false;
        $androidSim = false;
        $allowGuest = true;
        $geminiEnabled = true;
        $geminiConfigured = false;
        $adminAllowedIp = '50.96.3.12';
        try {
            $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('simulation_mode', 'desktop_simulation_mode', 'android_simulation_mode', 'allow_guest', 'gemini_commentary_enabled', 'gemini_api_key', 'admin_allowed_ip', 'guest_logins_total', 'guest_logins_today', 'guest_logins_today_date', 'guest_logins_last_at')");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            if (isset($rows['desktop_simulation_mode'])) {
                $desktopSim = ($rows['desktop_simulation_mode'] === '1' || strtolower($rows['desktop_simulation_mode']) === 'true');
            } elseif (isset($rows['simulation_mode'])) {
                $desktopSim = ($rows['simulation_mode'] === '1' || strtolower($rows['simulation_mode']) === 'true');
            }
            if (isset($rows['android_simulation_mode'])) {
                $androidSim = ($rows['android_simulation_mode'] === '1' || strtolower($rows['android_simulation_mode']) === 'true');
            }
            if (isset($rows['allow_guest'])) {
                $allowGuest = ($rows['allow_guest'] === '1' || strtolower($rows['allow_guest']) === 'true');
            }
            if (isset($rows['gemini_commentary_enabled'])) {
                $geminiEnabled = ($rows['gemini_commentary_enabled'] === '1' || strtolower($rows['gemini_commentary_enabled']) === 'true');
            }
            if (!empty($rows['gemini_api_key']) || !empty(getenv('GEMINI_API_KEY'))) {
                $geminiConfigured = true;
            }
            if (isset($rows['admin_allowed_ip']) && trim((string)$rows['admin_allowed_ip']) !== '') {
                $adminAllowedIp = trim((string)$rows['admin_allowed_ip']);
            }
        } catch (Exception $e) {}

        $guestLoginsTotal = isset($rows['guest_logins_total']) ? (int)$rows['guest_logins_total'] : 0;
        $guestLoginsToday = isset($rows['guest_logins_today']) ? (int)$rows['guest_logins_today'] : 0;
        $guestLoginsLastAt = $rows['guest_logins_last_at'] ?? null;
        $guestActive24h = 0;
        $guestDbCount = 0;
        try {
            $gStmt = $pdo->query("SELECT COUNT(DISTINCT session_id) FROM guest_login_events WHERE logged_in_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            if ($gStmt) $guestActive24h = (int)$gStmt->fetchColumn();
        } catch (Throwable $e) {}

        // Get users list
        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        $users = array();
        try {
            $colsStmt = $pdo->query("DESCRIBE `{$userTable}`");
            $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);

            $hasIsActive  = in_array('is_active', $existingCols, true);
            $hasCreatedAt = in_array('created_at', $existingCols, true);
            $hasBank      = in_array('bank', $existingCols, true);
            $hasEmail     = in_array('email', $existingCols, true);
            $hasUsername  = in_array('username', $existingCols, true);
            $hasIsGuest   = in_array('is_guest', $existingCols, true);

            $selectFields = array("id");
            $selectFields[] = $hasEmail ? "email" : ($hasUsername ? "username AS email" : "'' AS email");
            $selectFields[] = $hasBank ? "bank" : "500.00 AS bank";
            $selectFields[] = $hasIsActive ? "is_active" : "1 AS is_active";
            $selectFields[] = $hasIsGuest ? "is_guest" : "0 AS is_guest";
            $selectFields[] = $hasCreatedAt ? "created_at" : "NOW() AS created_at";

            $sql = "SELECT " . implode(", ", $selectFields) . " FROM `{$userTable}` ORDER BY id DESC";
            $stmt = $pdo->query($sql);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($hasIsGuest) {
                try {
                    // Auto-purge temporary guest rows from users table to maintain pure stateless guest architecture
                    $pdo->exec("DELETE FROM `{$userTable}` WHERE is_guest = 1");
                    $guestDbCount = 0;
                } catch (Throwable $e) {}
            }
        } catch (Exception $e) {}

        // Get purchase ledger
        $purchases = array();
        try {
            $hasPurchases = false;
            try {
                $pdo->query("SELECT 1 FROM purchases LIMIT 1");
                $hasPurchases = true;
            } catch (Exception $e) {}

            if ($hasPurchases) {
                // Auto-migrate any missing columns in purchases table
                try {
                    $pColsExisting = $pdo->query("DESCRIBE purchases")->fetchAll(PDO::FETCH_COLUMN);
                    if (!in_array('order_id', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN order_id VARCHAR(100) NULL AFTER paypal_order_id");
                    }
                    if (!in_array('product_id', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN product_id VARCHAR(100) NULL AFTER order_id");
                    }
                    if (!in_array('purchase_token', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN purchase_token TEXT NULL AFTER product_id");
                    }
                    if (!in_array('payer_email', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN payer_email VARCHAR(255) NULL AFTER purchase_token");
                    }
                    if (!in_array('payer_id', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN payer_id VARCHAR(100) NULL AFTER payer_email");
                    }
                    if (!in_array('package_name', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN package_name VARCHAR(100) NULL AFTER payer_id");
                    }
                    if (!in_array('payment_method', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN payment_method VARCHAR(50) DEFAULT 'PAYPAL' AFTER status");
                    }
                    if (!in_array('raw_response', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN raw_response TEXT NULL AFTER payment_method");
                    }
                    if (!in_array('purchase_report', $pColsExisting, true)) {
                        $pdo->exec("ALTER TABLE purchases ADD COLUMN purchase_report LONGTEXT NULL AFTER raw_response");
                    }
                } catch (Exception $e) {}

                $pCols = $pdo->query("DESCRIBE purchases")->fetchAll(PDO::FETCH_COLUMN);
                $hasOrderId = in_array('order_id', $pCols, true) ? 'p.order_id' : "'' AS order_id";
                $hasPaypalOrderId = in_array('paypal_order_id', $pCols, true) ? 'p.paypal_order_id' : "'' AS paypal_order_id";
                $hasProductId = in_array('product_id', $pCols, true) ? 'p.product_id' : "'' AS product_id";
                $hasPurchaseToken = in_array('purchase_token', $pCols, true) ? 'p.purchase_token' : "'' AS purchase_token";
                $hasPayerEmail = in_array('payer_email', $pCols, true) ? 'p.payer_email' : "'' AS payer_email";
                $hasPayerId = in_array('payer_id', $pCols, true) ? 'p.payer_id' : "'' AS payer_id";
                $hasPackageName = in_array('package_name', $pCols, true) ? 'p.package_name' : "'' AS package_name";
                $hasRawResponse = in_array('raw_response', $pCols, true) ? 'p.raw_response' : "'' AS raw_response";
                $hasPurchaseReport = in_array('purchase_report', $pCols, true) ? 'p.purchase_report' : "'' AS purchase_report";
                $hasMethod  = in_array('payment_method', $pCols, true) ? 'p.payment_method' : "'PAYPAL' AS payment_method";

                $pSql = "SELECT p.id, p.user_id, 
                                CASE 
                                    WHEN p.user_id IS NULL OR p.user_id = 0 THEN 
                                        CASE 
                                            WHEN p.payer_email LIKE 'guest_%' OR p.purchase_report LIKE '%guest%' OR p.raw_response LIKE '%guest%' THEN '[Guest Player - 7-Yr Retained]'
                                            ELSE '[Deleted User - 7-Yr Retained]'
                                        END
                                    ELSE COALESCE(u.email, u.username, CONCAT('User #', p.user_id))
                                END AS email, 
                                CASE
                                    WHEN COALESCE(u.is_guest, 0) = 1 THEN 1
                                    WHEN p.payer_email LIKE 'guest_%' OR p.purchase_report LIKE '%guest%' OR p.raw_response LIKE '%guest%' THEN 1
                                    ELSE 0
                                END AS is_guest,
                                {$hasOrderId}, {$hasPaypalOrderId}, {$hasProductId}, {$hasPurchaseToken},
                                {$hasPayerEmail}, {$hasPayerId}, {$hasPackageName}, {$hasRawResponse}, {$hasPurchaseReport},
                                {$hasMethod}, p.credits_added, p.amount_paid, p.status, p.created_at 
                         FROM purchases p 
                         LEFT JOIN `{$userTable}` u ON p.user_id = u.id 
                         ORDER BY p.id DESC LIMIT 150";
                $pStmt = $pdo->query($pSql);
                $purchases = $pStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($purchases as &$p) {
                    $p['is_guest'] = !empty($p['is_guest']) ? 1 : 0;
                    if (empty($p['user_id']) || $p['user_id'] === 0 || empty($p['email']) || $p['email'] === 'User #' || $p['email'] === 'User #null') {
                        if ($p['is_guest'] === 1 || strpos($p['email'], 'Guest') !== false) {
                            $p['email'] = '[Guest Player - 7-Yr Retained]';
                            $p['is_guest'] = 1;
                        } else {
                            $p['email'] = '[Deleted User - 7-Yr Retained]';
                        }
                    }
                    if (empty($p['order_id']) && !empty($p['paypal_order_id'])) {
                        $p['order_id'] = $p['paypal_order_id'];
                    } elseif (empty($p['paypal_order_id']) && !empty($p['order_id'])) {
                        $p['paypal_order_id'] = $p['order_id'];
                    }
                    if (empty($p['product_id']) && !empty($p['credits_added'])) {
                        $p['product_id'] = 'credits_' . $p['credits_added'];
                    }
                    if (empty($p['payer_email']) && !empty($p['email'])) {
                        $p['payer_email'] = $p['email'];
                    }
                }
                unset($p);
            }
        } catch (Exception $e) {}

        // Get account deletion requests for Google Play / Privacy tab
        $deletionRequests = [];
        $pendingDeletions = 0;
        try {
            // Ensure account_deletion_requests table exists
            $pdo->exec("CREATE TABLE IF NOT EXISTS `account_deletion_requests` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                identifier VARCHAR(255) NOT NULL,
                request_type VARCHAR(50) DEFAULT 'FULL_DELETE',
                status ENUM('PENDING', 'PROCESSED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
                ip_address VARCHAR(45) NULL,
                reason TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                INDEX idx_deletion_identifier (identifier),
                INDEX idx_deletion_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            $delStmt = $pdo->query("SELECT id, user_id, identifier, request_type, status, ip_address, reason, created_at, processed_at FROM account_deletion_requests ORDER BY created_at DESC LIMIT 150");
            if ($delStmt) {
                $deletionRequests = $delStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($deletionRequests as $dr) {
                    if (($dr['status'] ?? '') === 'PENDING') $pendingDeletions++;
                }
            }
        } catch (Exception $e) {}

        // Get password reset requests for Admin Console
        $passwordResets = [];
        $pendingResets = 0;
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                identifier VARCHAR(255) NOT NULL,
                token_hash VARCHAR(64) NOT NULL,
                raw_token_preview VARCHAR(16) NULL,
                status ENUM('PENDING', 'USED', 'EXPIRED', 'CANCELLED') DEFAULT 'PENDING',
                expires_at DATETIME NOT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at DATETIME NULL,
                INDEX idx_reset_token (token_hash),
                INDEX idx_reset_user (user_id),
                INDEX idx_reset_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            $rstStmt = $pdo->query("SELECT id, user_id, identifier, raw_token_preview, status, expires_at, ip_address, created_at, used_at FROM password_reset_tokens ORDER BY id DESC LIMIT 150");
            if ($rstStmt) {
                $passwordResets = $rstStmt->fetchAll(PDO::FETCH_ASSOC);
                $now = time();
                foreach ($passwordResets as $pr) {
                    if (($pr['status'] ?? '') === 'PENDING' && strtotime($pr['expires_at'] ?? '1970-01-01') > $now) {
                        $pendingResets++;
                    }
                }
            }
        } catch (Exception $e) {}

        // Correlate users with pending account deletion requests
        $pendingMapByUid = array();
        $pendingMapByIdent = array();
        foreach ($deletionRequests as $dr) {
            if (($dr['status'] ?? '') === 'PENDING') {
                if (!empty($dr['user_id'])) {
                    $pendingMapByUid[intval($dr['user_id'])] = $dr;
                }
                if (!empty($dr['identifier'])) {
                    $pendingMapByIdent[strtolower(trim($dr['identifier']))] = $dr;
                }
            }
        }

        // Correlate users with pending password reset requests
        $resetMapByUid = array();
        $resetMapByIdent = array();
        $now = time();
        foreach ($passwordResets as $pr) {
            if (($pr['status'] ?? '') === 'PENDING' && strtotime($pr['expires_at'] ?? '1970-01-01') > $now) {
                if (!empty($pr['user_id'])) {
                    $resetMapByUid[intval($pr['user_id'])] = $pr;
                }
                if (!empty($pr['identifier'])) {
                    $resetMapByIdent[strtolower(trim($pr['identifier']))] = $pr;
                }
            }
        }

        foreach ($users as &$u) {
            $uid = intval($u['id']);
            $uEmail = !empty($u['email']) ? strtolower(trim($u['email'])) : '';

            // Deletion request correlation
            if (isset($pendingMapByUid[$uid])) {
                $req = $pendingMapByUid[$uid];
                $u['deletion_requested'] = 1;
                $u['deletion_request_id'] = intval($req['id']);
                $u['deletion_reason'] = $req['reason'] ?? '';
                $u['deletion_requested_at'] = $req['created_at'] ?? '';
            } elseif ($uEmail && isset($pendingMapByIdent[$uEmail])) {
                $req = $pendingMapByIdent[$uEmail];
                $u['deletion_requested'] = 1;
                $u['deletion_request_id'] = intval($req['id']);
                $u['deletion_reason'] = $req['reason'] ?? '';
                $u['deletion_requested_at'] = $req['created_at'] ?? '';
            } else {
                $u['deletion_requested'] = 0;
                $u['deletion_request_id'] = null;
                $u['deletion_reason'] = null;
                $u['deletion_requested_at'] = null;
            }

            // Password reset request correlation
            if (isset($resetMapByUid[$uid])) {
                $rst = $resetMapByUid[$uid];
                $u['reset_requested'] = 1;
                $u['reset_request_id'] = intval($rst['id']);
                $u['reset_expires_at'] = $rst['expires_at'] ?? '';
            } elseif ($uEmail && isset($resetMapByIdent[$uEmail])) {
                $rst = $resetMapByIdent[$uEmail];
                $u['reset_requested'] = 1;
                $u['reset_request_id'] = intval($rst['id']);
                $u['reset_expires_at'] = $rst['expires_at'] ?? '';
            } else {
                $u['reset_requested'] = 0;
                $u['reset_request_id'] = null;
                $u['reset_expires_at'] = null;
            }
        }
        unset($u);

        $paypalEnv = defined('PAYPAL_ENV') ? PAYPAL_ENV : 'sandbox';
        sendJsonResponse(true, 'Dashboard data loaded', array(
            'simulation_mode'           => $desktopSim,
            'desktop_simulation_mode'   => $desktopSim,
            'android_simulation_mode'   => $androidSim,
            'allow_guest'               => $allowGuest,
            'android_billing_mode'      => $androidSim ? 'SIMULATED' : 'GOOGLE_PLAY',
            'desktop_billing_mode'      => $desktopSim ? 'SIMULATED' : ($paypalEnv === 'sandbox' ? 'PAYPAL_SANDBOX' : 'PAYPAL'),
            'paypal_env'                => $paypalEnv,
            'paypal_client_id'          => defined('PAYPAL_CLIENT_ID') ? PAYPAL_CLIENT_ID : '',
            'guest_logins_total'        => $guestLoginsTotal,
            'guest_logins_today'        => $guestLoginsToday,
            'guest_logins_last_at'      => $guestLoginsLastAt,
            'guest_active_24h'          => $guestActive24h,
            'guest_db_count'            => $guestDbCount,
            'gemini_model'              => 'gemini-3.8-flash',
            'gemini_commentary_enabled' => $geminiEnabled,
            'gemini_configured'         => $geminiConfigured,
            'admin_allowed_ip'          => $adminAllowedIp,
            'client_ip'                 => getAdminApiCallerIp(),
            'users'                     => $users,
            'purchases'                 => $purchases,
            'deletion_requests'         => $deletionRequests,
            'pending_deletion_count'    => $pendingDeletions,
            'password_resets'           => $passwordResets,
            'pending_reset_count'       => $pendingResets
        ));
    }

    // 5. ADJUST USER BANK (Admin manual credit adjustment with immutable audit trail)
    if ($action === 'adjust_user_bank') {
        requireAdminApiToken($input, 'Unauthorized: Chip balance adjustments require a valid administrative JWT or API token');

        $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $newBank = null;
        if (isset($input['new_bank'])) {
            $newBank = max(0, floatval($input['new_bank']));
        } elseif (isset($input['bank'])) {
            $newBank = max(0, floatval($input['bank']));
        }
        $reason = isset($input['reason']) ? trim((string)$input['reason']) : 'Admin Console Adjustment';

        if ($userId <= 0 || $newBank === null) {
            sendJsonResponse(false, 'Valid user_id and new_bank amount are required', array(), 400);
        }

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        // Fetch previous balance for audit logging
        $prevBank = 0.0;
        try {
            $prevStmt = $pdo->prepare("SELECT bank FROM `{$userTable}` WHERE id = :id");
            $prevStmt->execute(array(':id' => $userId));
            $prevBank = floatval($prevStmt->fetchColumn() ?: 0.0);
        } catch (Throwable $e) {}

        $stmt = $pdo->prepare("UPDATE `{$userTable}` SET bank = :bank WHERE id = :id");
        $stmt->execute(array(':bank' => $newBank, ':id' => $userId));

        // Record to balance_audit_log
        logBalanceAdjustment('admin', $userId, $prevBank, $newBank, $reason);

        sendJsonResponse(true, "User #{$userId} bank balance adjusted to $" . number_format($newBank, 2), array(
            'user_id'          => $userId,
            'previous_balance' => $prevBank,
            'new_bank'         => $newBank
        ));
    }

    // 5.5. GET SIMULATED CREDITS STATUS (Enforces cumulative 6,000 credits limit)
    if ($action === 'get_simulated_credits') {
        $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $userEmail = isset($input['email']) ? trim((string)$input['email']) : '';
        $guestSessionId = isset($input['guest_session_id']) ? trim((string)$input['guest_session_id']) : '';
        $clientBank = isset($input['bank']) ? floatval($input['bank']) : 0.0;

        $totalSim = 0;
        try {
            $userTable = 'users';
            try { $pdo->query("SELECT 1 FROM users LIMIT 1"); } catch (Throwable $e) { $userTable = 'blackjack_users'; }
            if ($userId <= 0 && !empty($guestSessionId)) {
                $gStmt = $pdo->prepare("SELECT id, bank FROM `{$userTable}` WHERE is_guest = 1 AND guest_session_id = :sess LIMIT 1");
                $gStmt->execute(array(':sess' => $guestSessionId));
                $gRow = $gStmt->fetch();
                if ($gRow) {
                    $userId = intval($gRow['id']);
                    $gBank = floatval($gRow['bank'] ?? 0);
                    if ($gBank >= 6000) {
                        $totalSim = max($totalSim, (int)$gBank);
                    }
                }
            }
            if ($userId <= 0 && !empty($guestSessionId)) {
                try {
                    $gsStmt = $pdo->prepare("SELECT user_id, bank FROM guest_sessions WHERE session_id = :sess LIMIT 1");
                    $gsStmt->execute(array(':sess' => $guestSessionId));
                    $gsRow = $gsStmt->fetch();
                    if ($gsRow) {
                        if (!empty($gsRow['user_id'])) $userId = intval($gsRow['user_id']);
                        $gsBank = floatval($gsRow['bank'] ?? 0);
                        if ($gsBank >= 6000) {
                            $totalSim = max($totalSim, (int)$gsBank);
                        }
                    }
                } catch (Throwable $e) {}
            }
            if ($userId <= 0 && !empty($userEmail)) {
                $uStmt = $pdo->prepare("SELECT id, bank FROM `{$userTable}` WHERE email = :em OR username = :em2 LIMIT 1");
                $uStmt->execute(array(':em' => $userEmail, ':em2' => $userEmail));
                $uRow = $uStmt->fetch();
                if ($uRow) {
                    $userId = intval($uRow['id']);
                    $uBank = floatval($uRow['bank'] ?? 0);
                    if ($uBank >= 6000) {
                        $totalSim = max($totalSim, (int)$uBank);
                    }
                }
            }
            if ($userId > 0 && $totalSim < 6000) {
                try {
                    $bStmt = $pdo->prepare("SELECT bank FROM `{$userTable}` WHERE id = :uid");
                    $bStmt->execute(array(':uid' => $userId));
                    $curBank = floatval($bStmt->fetchColumn() ?? 0);
                    if ($curBank >= 6000) {
                        $totalSim = max($totalSim, (int)$curBank);
                    }
                } catch (Throwable $e) {}
            }
            if ($clientBank >= 6000 && $totalSim < 6000) {
                $totalSim = max($totalSim, (int)$clientBank);
            }

            $pCols = array();
            try {
                $pCols = $pdo->query("DESCRIBE purchases")->fetchAll(PDO::FETCH_COLUMN);
            } catch (Throwable $e) {}
            $hasIsSim = in_array('is_simulated', $pCols, true);
            $simCond = $hasIsSim ? "(is_simulated = 1 OR payment_method LIKE '%SIMULATED%')" : "payment_method LIKE '%SIMULATED%'";

            $whereParts = array();
            $params = array();
            if ($userId > 0) {
                $whereParts[] = "user_id = :uid";
                $params[':uid'] = $userId;
            }
            if (!empty($userEmail)) {
                $whereParts[] = "payer_email = :em";
                $params[':em'] = $userEmail;
            }
            if (!empty($guestSessionId)) {
                $whereParts[] = "raw_response LIKE :sess_like";
                $params[':sess_like'] = '%' . $guestSessionId . '%';
            }
            if (!empty($whereParts)) {
                $sql = "SELECT COALESCE(SUM(credits_added), 0) FROM purchases WHERE (" . implode(' OR ', $whereParts) . ") AND " . $simCond;
                $sStmt = $pdo->prepare($sql);
                $sStmt->execute($params);
                $dbSim = (int)$sStmt->fetchColumn();
                $totalSim = max($totalSim, $dbSim);
            }
        } catch (Throwable $e) {}

        sendJsonResponse(true, 'Simulated credit status retrieved', array(
            'simulated_credits_total' => $totalSim,
            'max_simulated_credits'   => 6000,
            'remaining_allowance'     => max(0, 6000 - $totalSim),
            'limit_reached'           => ($totalSim >= 6000)
        ));
    }

    // 6. BUY CREDITS / SIMULATED PURCHASE (Locked down: Gated by active simulation mode and capped at 6,000 credits)
    if ($action === 'buy_credits' || $action === 'simulated_purchase') {
        // Enforce Server-Side Simulation Mode Gate:
        $isSimActive = false;
        try {
            $simStmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('simulation_mode', 'desktop_simulation_mode')");
            $simStmt->execute();
            $simRows = $simStmt->fetchAll(PDO::FETCH_KEY_PAIR);
            if (isset($simRows['desktop_simulation_mode'])) {
                $isSimActive = ($simRows['desktop_simulation_mode'] === '1' || strtolower((string)$simRows['desktop_simulation_mode']) === 'true');
            } elseif (isset($simRows['simulation_mode'])) {
                $isSimActive = ($simRows['simulation_mode'] === '1' || strtolower((string)$simRows['simulation_mode']) === 'true');
            }
        } catch (Throwable $e) {}

        if (!$isSimActive) {
            sendJsonResponse(false, 'Forbidden: Simulated purchases are disabled in production live mode. Live credits must be purchased via verified PayPal gateway.', array(
                'error' => 'SIMULATION_MODE_DISABLED'
            ), 403);
        }

        // Must have authenticated player session or guest session or admin token
        $hasAuth = false;
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }
        $isGuest = !empty($input['is_guest']) || !empty($_SESSION['is_guest']);
        $guestSessionId = isset($input['guest_session_id']) ? trim((string)$input['guest_session_id']) : ($_SESSION['guest_session_id'] ?? '');

        if (!empty($_SESSION['user_id']) || validateAdminApiToken($input) || ($isGuest && !empty($guestSessionId))) {
            $hasAuth = true;
        }

        if (!$hasAuth && empty($input['email'])) {
            sendJsonResponse(false, 'Unauthorized: Player must be signed in or playing in guest mode to purchase credits', array(), 401);
        }

        $package = isset($input['package']) ? intval($input['package']) : (isset($input['credits']) ? intval($input['credits']) : 1000);
        if ($package <= 0) $package = 1000;

        $packageMap = array(
            1000 => '4.99',
            2500 => '9.99',
            6000 => '19.99'
        );
        $amount = isset($packageMap[$package]) ? $packageMap[$package] : '4.99';

        $platform = isset($input['platform']) ? strtolower(trim($input['platform'])) : 'desktop';
        $paymentMethod = ($platform === 'android') ? 'GOOGLE_PLAY_SIMULATED' : 'PAYPAL_SIMULATED';

        $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $userEmail = isset($input['email']) ? trim($input['email']) : '';

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        // Pure stateless guest handling (Option 1: 0 database rows in users)
        if ($isGuest) {
            $userId = null;
            if (empty($userEmail)) {
                $userEmail = !empty($guestSessionId) ? ('guest_' . substr($guestSessionId, 0, 8) . '@guest.calmchessgames.com') : 'guest_player@calmchessgames.com';
            }
        } elseif ($userId <= 0 && !empty($userEmail)) {
            try {
                $uStmt = $pdo->prepare("SELECT id FROM `{$userTable}` WHERE email = :em OR username = :em2 LIMIT 1");
                $uStmt->execute(array(':em' => $userEmail, ':em2' => $userEmail));
                $uRow = $uStmt->fetch();
                if ($uRow) $userId = intval($uRow['id']);
            } catch (Exception $e) {}
        }

        if (!$isGuest && $userId <= 0) {
            $latest = $pdo->query("SELECT id FROM `{$userTable}` ORDER BY id DESC LIMIT 1")->fetch();
            $userId = $latest ? intval($latest['id']) : 1;
        }

        // Enforce $6,000 worth of simulated credits ceiling per player/guest
        $simTotal = 0;
        try {
            $whereParts = array();
            $params = array();
            if ($userId > 0) {
                $whereParts[] = "user_id = :uid";
                $params[':uid'] = $userId;
            }
            if (!empty($userEmail)) {
                $whereParts[] = "payer_email = :em";
                $params[':em'] = $userEmail;
            }
            if (!empty($guestSessionId)) {
                $whereParts[] = "raw_response LIKE :sess_like";
                $params[':sess_like'] = '%' . $guestSessionId . '%';
            }
            $pCols = array();
            try {
                $pCols = $pdo->query("DESCRIBE purchases")->fetchAll(PDO::FETCH_COLUMN);
            } catch (Throwable $e) {}
            $hasIsSim = in_array('is_simulated', $pCols, true);
            $simCond = $hasIsSim ? "(is_simulated = 1 OR payment_method LIKE '%SIMULATED%')" : "payment_method LIKE '%SIMULATED%'";

            if (!empty($whereParts)) {
                $sql = "SELECT COALESCE(SUM(credits_added), 0) FROM purchases WHERE (" . implode(' OR ', $whereParts) . ") AND " . $simCond;
                $sStmt = $pdo->prepare($sql);
                $sStmt->execute($params);
                $simTotal = (int)$sStmt->fetchColumn();
            }
        } catch (Throwable $e) {}

        if ($simTotal + $package > 6000) {
            sendJsonResponse(false, "Simulated credit limit reached: You can only purchase up to 6,000 simulated credits (Current: " . number_format($simTotal) . " / 6,000). Please toggle off simulation mode to purchase live credits.", array(
                'limit_reached'           => true,
                'simulated_credits_total' => $simTotal,
                'package_requested'       => $package,
                'max_simulated_credits'   => 6000,
                'remaining_allowance'     => max(0, 6000 - $simTotal)
            ), 400);
        }

        if ($userId && $userId > 0) {
            // Add credits to registered user bank
            $stmt = $pdo->prepare("UPDATE `{$userTable}` SET bank = bank + :credits WHERE id = :uid");
            $stmt->execute(array(':credits' => $package, ':uid' => $userId));
            $bStmt = $pdo->prepare("SELECT bank FROM `{$userTable}` WHERE id = :uid");
            $bStmt->execute(array(':uid' => $userId));
            $newBank = floatval($bStmt->fetchColumn());
        } else {
            // Stateless guest player: update bankroll in guest_sessions without creating a user row
            $currentBank = 500.00;
            if (!empty($guestSessionId)) {
                try {
                    $gStmt = $pdo->prepare("SELECT bank FROM guest_sessions WHERE session_id = :sess LIMIT 1");
                    $gStmt->execute(array(':sess' => $guestSessionId));
                    $gBank = $gStmt->fetchColumn();
                    if ($gBank !== false) $currentBank = (float)$gBank;
                } catch (Throwable $e) {}
            }
            $newBank = $currentBank + (float)$package;
            if (!empty($guestSessionId)) {
                try {
                    $pdo->prepare("INSERT INTO guest_sessions (session_id, bank, expires_at) VALUES (:sess, :b, DATE_ADD(NOW(), INTERVAL 30 DAY)) ON DUPLICATE KEY UPDATE bank = :b2, last_active_at = NOW()")
                        ->execute(array(':sess' => $guestSessionId, ':b' => $newBank, ':b2' => $newBank));
                } catch (Throwable $ge) {}
            }
        }

        // Insert into purchases ledger
        try {
            $orderId = ($platform === 'android') ? ('GPA.SIM_' . strtoupper(bin2hex(random_bytes(6)))) : ('SIM_' . strtoupper(bin2hex(random_bytes(6))));
            $productId = 'credits_' . $package;
            $purchaseToken = 'SIM_TOKEN_' . bin2hex(random_bytes(16));

            $packageName = ($platform === 'android') ? 'com.calmchess.blackjack' : 'calmchess.web.blackjack';
            $rawResponse = json_encode(array(
                'order_id'       => $orderId,
                'product_id'     => $productId,
                'purchase_token' => $purchaseToken,
                'package_name'   => $packageName,
                'credits'        => $package,
                'amount'         => $amount,
                'payment_method' => $paymentMethod,
                'is_simulated'   => true,
                'timestamp'      => date('Y-m-d H:i:s')
            ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            $purchaseReport = json_encode(array(
                'report_type'      => 'ADMIN_SIMULATED_PURCHASE_REPORT',
                'version'          => '1.0',
                'order_id'         => $orderId,
                'product_id'       => $productId,
                'credits_added'    => (int)$package,
                'amount_paid'      => (float)$amount,
                'currency'         => 'USD',
                'status'           => 'COMPLETED',
                'payment_method'   => $paymentMethod,
                'payer_email'      => $userEmail,
                'payer_id'         => ($isGuest ? ('GUEST_' . substr($guestSessionId ?: bin2hex(random_bytes(4)), 0, 8)) : ('SIM_USER_' . $userId)),
                'purchase_token'   => $purchaseToken,
                'is_simulated'     => true,
                'audit_compliance' => '7_YEAR_STATUTORY_FINANCIAL_RETENTION',
                'timestamp'        => date('Y-m-d H:i:s')
            ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            $pCols = $pdo->query("DESCRIBE purchases")->fetchAll(PDO::FETCH_COLUMN);
            $hasMethod = in_array('payment_method', $pCols, true);
            $hasOrderId = in_array('order_id', $pCols, true);
            $hasPaypalOrderId = in_array('paypal_order_id', $pCols, true);
            $hasProductId = in_array('product_id', $pCols, true);
            $hasPurchaseToken = in_array('purchase_token', $pCols, true);
            $hasPayerEmail = in_array('payer_email', $pCols, true);
            $hasPackageName = in_array('package_name', $pCols, true);
            $hasRawResponse = in_array('raw_response', $pCols, true);
            $hasPurchaseReport = in_array('purchase_report', $pCols, true);

            $insCols = array('user_id', 'credits_added', 'amount_paid', 'status');
            $insVals = array(':uid', ':cr', ':amt', "'COMPLETED'");
            $params = array(':uid' => $userId, ':cr' => $package, ':amt' => $amount);

            if ($hasOrderId) {
                $insCols[] = 'order_id';
                $insVals[] = ':oid_val';
                $params[':oid_val'] = $orderId;
            }
            if ($hasPaypalOrderId) {
                $insCols[] = 'paypal_order_id';
                $insVals[] = ':p_oid_val';
                $params[':p_oid_val'] = $orderId;
            }
            if ($hasProductId) {
                $insCols[] = 'product_id';
                $insVals[] = ':pid_val';
                $params[':pid_val'] = $productId;
            }
            if ($hasPurchaseToken) {
                $insCols[] = 'purchase_token';
                $insVals[] = ':ptok';
                $params[':ptok'] = $purchaseToken;
            }
            if ($hasPayerEmail && !empty($userEmail)) {
                $insCols[] = 'payer_email';
                $insVals[] = ':pemail';
                $params[':pemail'] = $userEmail;
            }
            if ($hasPackageName) {
                $insCols[] = 'package_name';
                $insVals[] = ':pkg_name';
                $params[':pkg_name'] = $packageName;
            }
            if ($hasMethod) {
                $insCols[] = 'payment_method';
                $insVals[] = ':pm';
                $params[':pm'] = $paymentMethod;
            }
            if ($hasRawResponse) {
                $insCols[] = 'raw_response';
                $insVals[] = ':raw_resp';
                $params[':raw_resp'] = $rawResponse;
            }
            if ($hasPurchaseReport) {
                $insCols[] = 'purchase_report';
                $insVals[] = ':p_report';
                $params[':p_report'] = $purchaseReport;
            }
            if ($hasIsSim) {
                $insCols[] = 'is_simulated';
                $insVals[] = ':is_sim';
                $params[':is_sim'] = 1;
            }

            $sql = "INSERT INTO purchases (" . implode(', ', $insCols) . ") VALUES (" . implode(', ', $insVals) . ")";
            $pStmt = $pdo->prepare($sql);
            $pStmt->execute($params);
        } catch (Exception $e) {}

        $newSimTotal = $simTotal + $package;
        $simResp = array(
            'new_bank'                => $newBank,
            'credits_added'           => $package,
            'amount_paid'             => $amount,
            'payment_method'          => $paymentMethod,
            'total_simulated_credits' => $newSimTotal,
            'simulated_limit_reached' => ($newSimTotal >= 6000),
            'remaining_allowance'     => max(0, 6000 - $newSimTotal)
        );

        if ($isGuest) {
            $_SESSION['is_guest'] = true;
            $_SESSION['bank'] = $newBank;
            $_SESSION['guest_bank'] = $newBank;
            if (!empty($guestSessionId)) $_SESSION['guest_session_id'] = $guestSessionId;
            if (function_exists('generateGuestToken')) {
                $sessId = $guestSessionId ?: bin2hex(random_bytes(16));
                $newToken = generateGuestToken([
                    'session_id' => $sessId,
                    'bank'       => $newBank,
                    'is_guest'   => true,
                    'created_at' => time(),
                    'stateless'  => true
                ], 30 * 86400);
                $_SESSION['guest_token'] = $newToken;
                $simResp['guest_token'] = $newToken;
                $simResp['guest_session_id'] = $sessId;
                $cookieDomain = function_exists('getCalmChessCookieDomain') ? getCalmChessCookieDomain() : '';
                @setcookie('cc_guest_token', $newToken, [
                    'expires'  => time() + (30 * 86400),
                    'path'     => '/',
                    'domain'   => $cookieDomain,
                    'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);
            }
        }

        sendJsonResponse(true, "+{$package} credits added to your bankroll (Simulated Purchase)!", $simResp);
    }

    // 7. SYNC BANK (Allows client to sync current in-game bankroll or admin balance adjustment)
    if ($action === 'sync_bank') {
        $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $userEmail = isset($input['email']) ? trim($input['email']) : '';
        $bank = isset($input['bank']) ? max(0, floatval($input['bank'])) : null;

        // Security check: Must have valid administrative token OR be the authenticated player
        $hasAdminToken = validateAdminApiToken($input);
        $hasValidSession = false;
        if (session_status() === PHP_SESSION_NONE) {
            if (function_exists('startCalmChessSession')) {
                startCalmChessSession();
            } else {
                @session_start();
            }
        }
        if (!empty($_SESSION['user_id'])) {
            $sessUid = (int)$_SESSION['user_id'];
            if ($sessUid === $userId || ($userId <= 0 && !empty($_SESSION['email']) && $_SESSION['email'] === $userEmail)) {
                $hasValidSession = true;
                if ($userId <= 0) $userId = $sessUid;
            }
        } elseif (!empty($_SESSION['is_guest'])) {
            $hasValidSession = true;
        }

        if (!$hasAdminToken && !$hasValidSession) {
            requireAdminApiToken($input, 'Unauthorized: Balance synchronization requires an authenticated player session or valid administrative API token');
        }

        if ($bank !== null) {
            $userTable = 'users';
            try { $pdo->query("SELECT 1 FROM users LIMIT 1"); } catch (Exception $e) { $userTable = 'blackjack_users'; }

            // Check if user is an expired guest - reset to $500 if expired
            $isExpiredGuest = false;
            try {
                if ($userId > 0) {
                    $gCheck = $pdo->prepare("SELECT id, is_guest, guest_expires_at FROM `{$userTable}` WHERE id = :id LIMIT 1");
                    $gCheck->execute(array(':id' => $userId));
                    $gRow = $gCheck->fetch();
                    if ($gRow && !empty($gRow['is_guest']) && !empty($gRow['guest_expires_at'])) {
                        if (strtotime($gRow['guest_expires_at']) < time()) {
                            $isExpiredGuest = true;
                            $bank = 500.00; // Reset expired guest to $500 starting bankroll
                        }
                    }
                }
            } catch (Throwable $e) {}

            if ($userId > 0) {
                $stmt = $pdo->prepare("UPDATE `{$userTable}` SET bank = :bank WHERE id = :id");
                $stmt->execute(array(':bank' => $bank, ':id' => $userId));
                try {
                    $pdo->prepare("UPDATE guest_sessions SET bank = :bank, last_active_at = NOW() WHERE user_id = :id")
                        ->execute(array(':bank' => $bank, ':id' => $userId));
                } catch (Throwable $e) {}
            } elseif (!empty($userEmail)) {
                $stmt = $pdo->prepare("UPDATE `{$userTable}` SET bank = :bank WHERE email = :email OR username = :email2");
                $stmt->execute(array(':bank' => $bank, ':email' => $userEmail, ':email2' => $userEmail));
            } elseif (!empty($_SESSION['guest_session_id'])) {
                $gsId = $_SESSION['guest_session_id'];
                $_SESSION['bank'] = $bank;
                $_SESSION['guest_bank'] = $bank;
                try {
                    $pdo->prepare("UPDATE guest_sessions SET bank = :bank, last_active_at = NOW() WHERE session_id = :sid")
                        ->execute(array(':bank' => $bank, ':sid' => $gsId));
                } catch (Throwable $e) {}
            }
            sendJsonResponse(true, 'Bank synchronized', array('bank' => $bank, 'user_id' => $userId, 'expired_reset' => $isExpiredGuest));
        }
        sendJsonResponse(false, 'Missing bank amount', array(), 400);
    }

    // 8. GET USERS
    if ($action === 'get_users') {
        requireAdminApiToken($input, 'Unauthorized: User management requires a valid authentication API token');

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        $colsStmt = $pdo->query("DESCRIBE `{$userTable}`");
        $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);

        $hasIsActive  = in_array('is_active', $existingCols, true);
        $hasCreatedAt = in_array('created_at', $existingCols, true);
        $hasBank      = in_array('bank', $existingCols, true);
        $hasEmail     = in_array('email', $existingCols, true);
        $hasUsername  = in_array('username', $existingCols, true);
        $hasIsGuest   = in_array('is_guest', $existingCols, true);

        $selectFields = array("id");
        $selectFields[] = $hasEmail ? "email" : ($hasUsername ? "username AS email" : "'' AS email");
        $selectFields[] = $hasBank ? "bank" : "500 AS bank";
        $selectFields[] = $hasIsActive ? "is_active" : "1 AS is_active";
        $selectFields[] = $hasIsGuest ? "is_guest" : "0 AS is_guest";
        $selectFields[] = $hasCreatedAt ? "created_at" : "NOW() AS created_at";

        $sql = "SELECT " . implode(", ", $selectFields) . " FROM `{$userTable}` ORDER BY id DESC";
        $stmt = $pdo->query($sql);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch deletion requests for correlation
        $deletionRequests = [];
        $pendingDeletions = 0;
        try {
            $delStmt = $pdo->query("SELECT id, user_id, identifier, request_type, status, ip_address, reason, created_at, processed_at FROM account_deletion_requests ORDER BY created_at DESC LIMIT 150");
            if ($delStmt) {
                $deletionRequests = $delStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($deletionRequests as $dr) {
                    if (($dr['status'] ?? '') === 'PENDING') $pendingDeletions++;
                }
            }
        } catch (Exception $e) {}

        // Fetch password reset requests for correlation
        $passwordResets = [];
        $pendingResets = 0;
        try {
            $rstStmt = $pdo->query("SELECT id, user_id, identifier, raw_token_preview, status, expires_at, ip_address, created_at, used_at FROM password_reset_tokens ORDER BY id DESC LIMIT 150");
            if ($rstStmt) {
                $passwordResets = $rstStmt->fetchAll(PDO::FETCH_ASSOC);
                $now = time();
                foreach ($passwordResets as $pr) {
                    if (($pr['status'] ?? '') === 'PENDING' && strtotime($pr['expires_at'] ?? '1970-01-01') > $now) {
                        $pendingResets++;
                    }
                }
            }
        } catch (Exception $e) {}

        // Correlate users with deletion requests
        $delMapByUid = [];
        $delMapByIdent = [];
        foreach ($deletionRequests as $dr) {
            if (($dr['status'] ?? '') === 'PENDING') {
                if (!empty($dr['user_id'])) $delMapByUid[intval($dr['user_id'])] = $dr;
                if (!empty($dr['identifier'])) $delMapByIdent[strtolower(trim($dr['identifier']))] = $dr;
            }
        }

        // Correlate users with password reset requests
        $rstMapByUid = [];
        $rstMapByIdent = [];
        $now = time();
        foreach ($passwordResets as $pr) {
            if (($pr['status'] ?? '') === 'PENDING' && strtotime($pr['expires_at'] ?? '1970-01-01') > $now) {
                if (!empty($pr['user_id'])) $rstMapByUid[intval($pr['user_id'])] = $pr;
                if (!empty($pr['identifier'])) $rstMapByIdent[strtolower(trim($pr['identifier']))] = $pr;
            }
        }

        foreach ($users as &$u) {
            $uid = intval($u['id']);
            $uEmail = !empty($u['email']) ? strtolower(trim($u['email'])) : '';

            // Deletion request
            if (isset($delMapByUid[$uid])) {
                $u['deletion_requested'] = 1;
                $u['deletion_request_id'] = intval($delMapByUid[$uid]['id']);
                $u['deletion_reason'] = $delMapByUid[$uid]['reason'] ?? '';
                $u['deletion_requested_at'] = $delMapByUid[$uid]['created_at'] ?? '';
            } elseif ($uEmail && isset($delMapByIdent[$uEmail])) {
                $u['deletion_requested'] = 1;
                $u['deletion_request_id'] = intval($delMapByIdent[$uEmail]['id']);
                $u['deletion_reason'] = $delMapByIdent[$uEmail]['reason'] ?? '';
                $u['deletion_requested_at'] = $delMapByIdent[$uEmail]['created_at'] ?? '';
            } else {
                $u['deletion_requested'] = 0;
                $u['deletion_request_id'] = null;
                $u['deletion_reason'] = null;
                $u['deletion_requested_at'] = null;
            }

            // Password reset
            if (isset($rstMapByUid[$uid])) {
                $u['reset_requested'] = 1;
                $u['reset_request_id'] = intval($rstMapByUid[$uid]['id']);
                $u['reset_expires_at'] = $rstMapByUid[$uid]['expires_at'] ?? '';
            } elseif ($uEmail && isset($rstMapByIdent[$uEmail])) {
                $u['reset_requested'] = 1;
                $u['reset_request_id'] = intval($rstMapByIdent[$uEmail]['id']);
                $u['reset_expires_at'] = $rstMapByIdent[$uEmail]['expires_at'] ?? '';
            } else {
                $u['reset_requested'] = 0;
                $u['reset_request_id'] = null;
                $u['reset_expires_at'] = null;
            }
        }
        unset($u);

        $guestLoginsTotal = 0;
        $guestLoginsToday = 0;
        $guestActive24h = 0;
        $guestDbCount = 0;
        try {
            $sStmt = $pdo->query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('guest_logins_total', 'guest_logins_today')");
            if ($sStmt) {
                $sRows = $sStmt->fetchAll(PDO::FETCH_KEY_PAIR);
                $guestLoginsTotal = (int)($sRows['guest_logins_total'] ?? 0);
                $guestLoginsToday = (int)($sRows['guest_logins_today'] ?? 0);
            }
        } catch (Throwable $e) {}
        try {
            $gStmt = $pdo->query("SELECT COUNT(DISTINCT session_id) FROM guest_login_events WHERE logged_in_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            if ($gStmt) $guestActive24h = (int)$gStmt->fetchColumn();
        } catch (Throwable $e) {}
        try {
            if ($hasIsGuest) {
                // Auto-purge temporary guest rows from users table to maintain pure stateless guest architecture
                $pdo->exec("DELETE FROM `{$userTable}` WHERE is_guest = 1");
                $guestDbCount = 0;
            }
        } catch (Throwable $e) {}

        sendJsonResponse(true, 'Users retrieved successfully', array(
            'users'                  => $users,
            'deletion_requests'      => $deletionRequests,
            'pending_deletion_count' => $pendingDeletions,
            'password_resets'        => $passwordResets,
            'pending_reset_count'    => $pendingResets,
            'guest_logins_total'     => $guestLoginsTotal,
            'guest_logins_today'     => $guestLoginsToday,
            'guest_active_24h'       => $guestActive24h,
            'guest_db_count'         => $guestDbCount
        ));
    }

    // 8b. RESET GUEST LOGINS COUNT
    if ($action === 'reset_guest_logins' || $action === 'reset_guest_count') {
        requireAdminApiToken($input, 'Unauthorized: Resetting guest login count requires a valid authentication API token');
        try {
            $pdo->exec("INSERT INTO site_settings (setting_key, setting_value) 
                        VALUES ('guest_logins_total', '0') 
                        ON DUPLICATE KEY UPDATE setting_value = '0'");
            $pdo->exec("INSERT INTO site_settings (setting_key, setting_value) 
                        VALUES ('guest_logins_today', '0') 
                        ON DUPLICATE KEY UPDATE setting_value = '0'");
            $pdo->exec("INSERT INTO site_settings (setting_key, setting_value) 
                        VALUES ('guest_logins_today_date', '" . date('Y-m-d') . "') 
                        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
            $pdo->exec("INSERT INTO site_settings (setting_key, setting_value) 
                        VALUES ('guest_logins_last_at', NOW()) 
                        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

            // Delete guest login events so active 24h count is also cleared
            try {
                $pdo->exec("DELETE FROM guest_login_events");
            } catch (Throwable $e) {}

            sendJsonResponse(true, 'Guest login counts have been reset to zero.', array(
                'guest_logins_total' => 0,
                'guest_logins_today' => 0,
                'guest_active_24h'   => 0,
                'guest_db_count'     => 0
            ));
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to reset guest login counts: ' . $e->getMessage(), array(), 500);
        }
    }

    // 9. CREATE USER
    if ($action === 'create_user') {
        requireAdminApiToken($input, 'Unauthorized: User creation requires a valid authentication API token');
        $email = isset($input['email']) ? trim($input['email']) : '';
        $pwd = isset($input['password']) ? $input['password'] : '';
        $bank = isset($input['bank']) ? max(0, floatval($input['bank'])) : 500;
        $isActive = isset($input['is_active']) ? intval($input['is_active']) : 1;

        if (empty($email) || empty($pwd)) {
            sendJsonResponse(false, 'Email/Username and Password are required', array(), 400);
        }

        $hash = password_hash($pwd, PASSWORD_BCRYPT);

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        $colsStmt = $pdo->query("DESCRIBE `{$userTable}`");
        $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);

        $emailCol       = in_array('email', $existingCols, true) ? 'email' : 'username';
        $hasUsernameCol = in_array('username', $existingCols, true);
        $hasActiveCol   = in_array('is_active', $existingCols, true);
        $hasCreatedCol  = in_array('created_at', $existingCols, true);

        $insertCols = array($emailCol, 'password_hash', 'bank');
        $insertVals = array(':email', ':hash', ':bank');
        $params     = array(':email' => $email, ':hash' => $hash, ':bank' => $bank);

        if ($hasUsernameCol) {
            $derivedUser = explode('@', $email)[0];
            $insertCols[] = 'username';
            $insertVals[] = ':username';
            $params[':username'] = $derivedUser;
        }

        if ($hasActiveCol) {
            $insertCols[] = 'is_active';
            $insertVals[] = ':active';
            $params[':active'] = $isActive;
        }
        if ($hasCreatedCol) {
            $insertCols[] = 'created_at';
            $insertVals[] = 'NOW()';
        }

        $sql = "INSERT INTO `{$userTable}` (" . implode(',', $insertCols) . ") VALUES (" . implode(',', $insertVals) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendJsonResponse(true, 'User created successfully', array('user_id' => $pdo->lastInsertId()));
    }

    // 10. UPDATE USER
    if ($action === 'update_user') {
        requireAdminApiToken($input, 'Unauthorized: Chip balance and user adjustments require a valid authentication API token');
        $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $email  = isset($input['email']) ? trim($input['email']) : '';
        $bank   = isset($input['bank']) ? max(0, floatval($input['bank'])) : 0;
        $newPwd = isset($input['password']) ? $input['password'] : '';

        if ($userId <= 0 || empty($email)) {
            sendJsonResponse(false, 'User ID and email are required', array(), 400);
        }

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        $colsStmt = $pdo->query("DESCRIBE `{$userTable}`");
        $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
        $emailCol = in_array('email', $existingCols, true) ? 'email' : 'username';
        $hasUsernameCol = in_array('username', $existingCols, true);
        $derivedUser = explode('@', $email)[0];

        if (!empty($newPwd)) {
            $hash = password_hash($newPwd, PASSWORD_BCRYPT);
            if ($hasUsernameCol) {
                $stmt = $pdo->prepare("UPDATE `{$userTable}` SET `{$emailCol}` = :email, username = :username, bank = :bank, password_hash = :hash WHERE id = :id");
                $stmt->execute(array('email' => $email, 'username' => $derivedUser, 'bank' => $bank, 'hash' => $hash, 'id' => $userId));
            } else {
                $stmt = $pdo->prepare("UPDATE `{$userTable}` SET `{$emailCol}` = :email, bank = :bank, password_hash = :hash WHERE id = :id");
                $stmt->execute(array('email' => $email, 'bank' => $bank, 'hash' => $hash, 'id' => $userId));
            }
        } else {
            if ($hasUsernameCol) {
                $stmt = $pdo->prepare("UPDATE `{$userTable}` SET `{$emailCol}` = :email, username = :username, bank = :bank WHERE id = :id");
                $stmt->execute(array('email' => $email, 'username' => $derivedUser, 'bank' => $bank, 'id' => $userId));
            } else {
                $stmt = $pdo->prepare("UPDATE `{$userTable}` SET `{$emailCol}` = :email, bank = :bank WHERE id = :id");
                $stmt->execute(array('email' => $email, 'bank' => $bank, 'id' => $userId));
            }
        }
        sendJsonResponse(true, 'User updated successfully');
    }

    // 11. TOGGLE BAN USER (Admin feature toggle)
    if ($action === 'toggle_ban_user' || $action === 'toggle_ban') {
        requireAdminApiToken($input, 'Unauthorized: User status and feature toggles require a valid authentication API token');
        $userId   = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $isActive = isset($input['is_active']) ? intval($input['is_active']) : 1;

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Exception $e) {
            $userTable = 'blackjack_users';
        }

        $colsStmt = $pdo->query("DESCRIBE `{$userTable}`");
        $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);

        if (!in_array('is_active', $existingCols, true)) {
            try {
                $pdo->exec("ALTER TABLE `{$userTable}` ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
                $existingCols[] = 'is_active';
            } catch (Throwable $e) {}
        }

        if (in_array('is_active', $existingCols, true)) {
            $stmt = $pdo->prepare("UPDATE `{$userTable}` SET is_active = :active WHERE id = :id");
            $stmt->execute(array('active' => $isActive, 'id' => $userId));
        } elseif (in_array('is_banned', $existingCols, true)) {
            $stmt = $pdo->prepare("UPDATE `{$userTable}` SET is_banned = :banned WHERE id = :id");
            $stmt->execute(array('banned' => ($isActive === 1 ? 0 : 1), 'id' => $userId));
        }

        sendJsonResponse(true, $isActive ? 'User unbanned' : 'User banned');
    }

    // HELPER: COMPLETE USER DATA PURGE (Erases personal data across all tables; retains financial transaction ledger for 7-year statutory audit)
    if (!function_exists('purgeAccountCompletely')) {
        function purgeAccountCompletely(PDO $pdo, ?int $userId, string $identifier, ?int $requestId = null): void {
            $userTable = 'users';
            try {
                $pdo->query("SELECT 1 FROM users LIMIT 1");
            } catch (Throwable $e) {
                $userTable = 'blackjack_users';
            }

            // Resolve userId if not provided
            if (!$userId && !empty($identifier)) {
                try {
                    $uStmt = $pdo->prepare("SELECT id FROM `{$userTable}` WHERE email = :idnt1 OR username = :idnt2 LIMIT 1");
                    $uStmt->execute(['idnt1' => $identifier, 'idnt2' => $identifier]);
                    $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
                    if ($uRow) {
                        $userId = (int)$uRow['id'];
                    }
                } catch (Throwable $e) {}
            }

            // 1. Detach & pseudonymize financial transaction records for 7-year statutory audit
            // Retains order_id, paypal_order_id, product_id, credits_added, amount_paid, payment_method, status, created_at
            // Completely removes user_id, payer_email, payer_id, and personal data
            try {
                if ($userId) {
                    $anon = $pdo->prepare("UPDATE `purchases` 
                        SET user_id = NULL,
                            payer_email = '[Deleted User - 7-Yr Retained]',
                            payer_id = 'PURGED_USER',
                            raw_response = CONCAT(IFNULL(raw_response,''), ' [USER_PURGED_7YR_AUDIT_RETENTION]'),
                            purchase_report = CONCAT(IFNULL(purchase_report,''), ' [USER_PURGED_7YR_AUDIT_RETENTION]')
                        WHERE user_id = :uid");
                    $anon->execute(['uid' => $userId]);
                }
                if (!empty($identifier)) {
                    $anon2 = $pdo->prepare("UPDATE `purchases` 
                        SET user_id = NULL,
                            payer_email = '[Deleted User - 7-Yr Retained]',
                            payer_id = 'PURGED_USER',
                            raw_response = CONCAT(IFNULL(raw_response,''), ' [USER_PURGED_7YR_AUDIT_RETENTION]'),
                            purchase_report = CONCAT(IFNULL(purchase_report,''), ' [USER_PURGED_7YR_AUDIT_RETENTION]')
                        WHERE payer_email = :em");
                    $anon2->execute(['em' => $identifier]);
                }
            } catch (Throwable $e) {
                error_log("Purge purchases error: " . $e->getMessage());
            }

            // 2. Eradicate all password reset tokens and requests
            try {
                if ($userId) {
                    $pdo->prepare("DELETE FROM `password_reset_tokens` WHERE user_id = :uid")->execute(['uid' => $userId]);
                    $pdo->prepare("DELETE FROM `password_reset_requests` WHERE user_id = :uid")->execute(['uid' => $userId]);
                }
                if (!empty($identifier)) {
                    $pdo->prepare("DELETE FROM `password_reset_tokens` WHERE identifier = :idnt")->execute(['idnt' => $identifier]);
                    $pdo->prepare("DELETE FROM `password_reset_requests` WHERE identifier = :idnt OR email = :idnt2")->execute(['idnt' => $identifier, 'idnt2' => $identifier]);
                }
            } catch (Throwable $e) {
                error_log("Purge password resets error: " . $e->getMessage());
            }

            // 3. Eradicate audit logs containing user identifiers
            try {
                if ($userId) {
                    $pdo->prepare("DELETE FROM `balance_audit_log` WHERE user_id = :uid")->execute(['uid' => $userId]);
                }
                if (!empty($identifier)) {
                    $pdo->prepare("DELETE FROM `balance_audit_log` WHERE reason LIKE :rsn")->execute(['rsn' => '%' . $identifier . '%']);
                }
            } catch (Throwable $e) {
                error_log("Purge audit logs error: " . $e->getMessage());
            }

            // 4. Eradicate game scores
            try {
                if (!empty($identifier)) {
                    $pdo->prepare("DELETE FROM `game_scores` WHERE player_name = :pname")->execute(['pname' => $identifier]);
                }
            } catch (Throwable $e) {}

            // 5. Eradicate user account from users table
            try {
                if ($userId) {
                    $delStmt = $pdo->prepare("DELETE FROM `{$userTable}` WHERE id = :uid");
                    $delStmt->execute(['uid' => $userId]);
                }
                if (!empty($identifier)) {
                    $delStmt = $pdo->prepare("DELETE FROM `{$userTable}` WHERE email = :idnt1 OR username = :idnt2");
                    $delStmt->execute(['idnt1' => $identifier, 'idnt2' => $identifier]);
                }
            } catch (Throwable $e) {
                error_log("Purge user delete error: " . $e->getMessage());
            }

            // 6. Completely eradicate account deletion request records from account_deletion_requests
            // No personal info or completed rows left sitting in database or admin console!
            try {
                if ($requestId) {
                    $pdo->prepare("DELETE FROM `account_deletion_requests` WHERE id = :id")->execute(['id' => $requestId]);
                }
                if (!empty($identifier)) {
                    $pdo->prepare("DELETE FROM `account_deletion_requests` WHERE identifier = :idnt")->execute(['idnt' => $identifier]);
                }
                if ($userId) {
                    $pdo->prepare("DELETE FROM `account_deletion_requests` WHERE user_id = :uid")->execute(['uid' => $userId]);
                }
            } catch (Throwable $e) {
                error_log("Purge deletion requests error: " . $e->getMessage());
            }
        }
    }

    // 12. DELETE USER (Enhanced with GDPR/Google Play compliance & 7-Year Statutory Financial Retention)
    if ($action === 'delete_user') {
        requireAdminApiToken($input, 'Unauthorized: User deletion requires a valid authentication API token');
        $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;

        $userTable = 'users';
        try {
            $pdo->query("SELECT 1 FROM users LIMIT 1");
        } catch (Throwable $e) {
            $userTable = 'blackjack_users';
        }

        $userIdentifier = '';
        try {
            $uStmt = $pdo->prepare("SELECT email, username FROM `{$userTable}` WHERE id = :id LIMIT 1");
            $uStmt->execute(['id' => $userId]);
            $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
            if ($uRow) {
                $userIdentifier = $uRow['email'] ?: $uRow['username'] ?: "user#{$userId}";
            }
        } catch (Throwable $e) {}

        purgeAccountCompletely($pdo, $userId, $userIdentifier);

        sendJsonResponse(true, 'User account and personal credentials completely purged from database. Financial transaction records in purchases ledger retained for 7-year statutory audit compliance.');
    }

    // 13. GET ACCOUNT DELETION REQUESTS (Google Play & Privacy Compliance)
    if ($action === 'get_deletion_requests') {
        requireAdminApiToken($input, 'Unauthorized: Accessing deletion requests requires a valid authentication API token');

        // Automatically clean up any leftover completed rows so they don't linger
        try {
            $pdo->exec("DELETE FROM account_deletion_requests WHERE status = 'COMPLETED'");
        } catch (Throwable $e) {}

        $requests = [];
        $pendingCount = 0;
        try {
            // Ensure table exists
            $pdo->exec("CREATE TABLE IF NOT EXISTS `account_deletion_requests` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                identifier VARCHAR(255) NOT NULL,
                request_type VARCHAR(50) DEFAULT 'FULL_DELETE',
                status ENUM('PENDING', 'PROCESSED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
                ip_address VARCHAR(45) NULL,
                reason TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                INDEX idx_deletion_identifier (identifier),
                INDEX idx_deletion_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            $stmt = $pdo->query("SELECT id, user_id, identifier, request_type, status, ip_address, reason, created_at, processed_at FROM account_deletion_requests ORDER BY created_at DESC LIMIT 150");
            if ($stmt) {
                $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($requests as $r) {
                    if (($r['status'] ?? '') === 'PENDING') $pendingCount++;
                }
            }
        } catch (Throwable $e) {}

        sendJsonResponse(true, 'Account deletion requests retrieved', [
            'requests'               => $requests,
            'deletion_requests'      => $requests,
            'pending_count'          => $pendingCount,
            'pending_deletion_count' => $pendingCount,
            'data'                   => [
                'requests'               => $requests,
                'deletion_requests'      => $requests,
                'pending_count'          => $pendingCount,
                'pending_deletion_count' => $pendingCount
            ]
        ]);
    }

    // 14. PROCESS ACCOUNT DELETION REQUEST (Approve & Purge User or Cancel)
    if ($action === 'process_deletion_request') {
        requireAdminApiToken($input, 'Unauthorized: Processing deletion requests requires a valid authentication API token');

        $requestId = isset($input['request_id']) ? intval($input['request_id']) : 0;
        $subaction = isset($input['subaction']) ? strtolower(trim($input['subaction'])) : (isset($input['decision']) ? strtolower(trim($input['decision'])) : 'purge');

        if ($requestId <= 0) {
            sendJsonResponse(false, 'Invalid request ID provided', [], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM account_deletion_requests WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $requestId]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$req) {
            sendJsonResponse(false, 'Deletion request not found', [], 404);
        }

        if ($subaction === 'cancel' || $subaction === 'dismiss' || $subaction === 'reject') {
            $del = $pdo->prepare("DELETE FROM account_deletion_requests WHERE id = :id");
            $del->execute(['id' => $requestId]);
            sendJsonResponse(true, 'Account deletion request dismissed and removed');
        }

        // Default: Purge user personal data permanently across all tables while preserving transaction records for 7 years
        $identifier = $req['identifier'];
        $userId = $req['user_id'] ? intval($req['user_id']) : null;

        purgeAccountCompletely($pdo, $userId, $identifier, $requestId);

        sendJsonResponse(true, 'User account and personal data permanently purged from server. Financial transaction records in purchases ledger retained for 7-year statutory compliance.');
    }

    // 14b. BULK PURGE ALL PENDING ACCOUNT DELETION REQUESTS (Google Play & Privacy Compliance)
    if ($action === 'purge_all_pending') {
        requireAdminApiToken($input, 'Unauthorized: Bulk purge requires a valid authentication API token');

        $stmt = $pdo->query("SELECT id, user_id, identifier FROM account_deletion_requests");
        $pending = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        $purgedCount = 0;

        foreach ($pending as $req) {
            $reqId = (int)$req['id'];
            $uid = !empty($req['user_id']) ? (int)$req['user_id'] : null;
            $ident = trim($req['identifier'] ?? '');

            purgeAccountCompletely($pdo, $uid, $ident, $reqId);
            $purgedCount++;
        }

        // Clean up any remaining records from account_deletion_requests
        try {
            $pdo->exec("DELETE FROM account_deletion_requests");
        } catch (Throwable $e) {}

        sendJsonResponse(true, "Successfully purged {$purgedCount} pending account(s). All user data permanently removed from server. Financial transaction records in purchases ledger retained for 7-year statutory compliance.", [
            'purged_count' => $purgedCount
        ]);
    }

    // 14c. QUICK PURGE ACCOUNT BY IDENTIFIER
    if ($action === 'quick_purge_account') {
        requireAdminApiToken($input, 'Unauthorized: Quick purge requires a valid authentication API token');

        $identifier = trim((string)($input['identifier'] ?? ''));
        if (empty($identifier)) {
            sendJsonResponse(false, 'Account email or username is required for purge', [], 400);
        }

        purgeAccountCompletely($pdo, null, $identifier);

        sendJsonResponse(true, "Account '{$identifier}' completely purged from server. Financial transaction records in purchases ledger retained for 7-year statutory compliance.");
    }

    // 15. GET PASSWORD RESET REQUESTS (Admin Console Tab 5 & Notification Badge)
    if ($action === 'get_password_resets') {
        requireAdminApiToken($input, 'Unauthorized: Accessing password reset requests requires a valid authentication API token');

        $resets = [];
        $pendingCount = 0;
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                identifier VARCHAR(255) NOT NULL,
                token_hash VARCHAR(64) NOT NULL,
                raw_token_preview VARCHAR(16) NULL,
                status ENUM('PENDING', 'USED', 'EXPIRED', 'CANCELLED') DEFAULT 'PENDING',
                expires_at DATETIME NOT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at DATETIME NULL,
                INDEX idx_reset_token (token_hash),
                INDEX idx_reset_user (user_id),
                INDEX idx_reset_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            $stmt = $pdo->query("SELECT id, user_id, identifier, raw_token_preview, status, expires_at, ip_address, created_at, used_at FROM password_reset_tokens ORDER BY id DESC LIMIT 150");
            if ($stmt) {
                $resets = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $now = time();
                foreach ($resets as $r) {
                    if (($r['status'] ?? '') === 'PENDING' && strtotime($r['expires_at'] ?? '1970-01-01') > $now) {
                        $pendingCount++;
                    }
                }
            }
        } catch (Throwable $e) {}

        sendJsonResponse(true, 'Password reset requests retrieved', [
            'resets'        => $resets,
            'pending_count' => $pendingCount
        ]);
    }

    // 16. CANCEL PASSWORD RESET TOKEN
    if ($action === 'cancel_password_reset') {
        requireAdminApiToken($input, 'Unauthorized: Cancelling password reset tokens requires a valid authentication API token');

        $tokenId = isset($input['token_id']) ? intval($input['token_id']) : 0;
        if ($tokenId <= 0) {
            sendJsonResponse(false, 'Invalid token ID provided', [], 400);
        }

        try {
            $upd = $pdo->prepare("UPDATE password_reset_tokens SET status = 'CANCELLED' WHERE id = :id");
            $upd->execute(['id' => $tokenId]);
            sendJsonResponse(true, 'Password reset token marked as CANCELLED');
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Database error cancelling password reset token', [], 500);
        }
    }

    // =========================================================================
    // 17. GET APPOINTMENTS & CONSULTATION BOOKINGS
    // =========================================================================
    if ($action === 'get_appointments') {
        requireAdminApiToken($input, 'Unauthorized: Accessing appointment bookings requires administrative credentials');

        try {
            $statusFilter = trim((string)($input['status'] ?? $_GET['status'] ?? ''));
            $dateFilter   = trim((string)($input['date'] ?? $_GET['date'] ?? ''));
            $searchQuery  = trim((string)($input['search'] ?? $_GET['search'] ?? ''));

            $sql = "SELECT id, attendee_name, attendee_email, attendee_phone, appointment_date, appointment_time, timezone, topic, notes, email_reminder, status, created_at, updated_at FROM consultation_appointments WHERE 1=1";
            $params = [];

            if ($statusFilter !== '' && $statusFilter !== 'all') {
                $sql .= " AND status = :status";
                $params['status'] = $statusFilter;
            }

            if ($dateFilter === 'today') {
                $sql .= " AND appointment_date = CURDATE()";
            } elseif ($dateFilter === 'upcoming') {
                $sql .= " AND appointment_date >= CURDATE()";
            } elseif ($dateFilter === 'past') {
                $sql .= " AND appointment_date < CURDATE()";
            } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFilter)) {
                $sql .= " AND appointment_date = :app_date";
                $params['app_date'] = $dateFilter;
            }

            if ($searchQuery !== '') {
                $sql .= " AND (attendee_name LIKE :search OR attendee_email LIKE :search OR topic LIKE :search OR notes LIKE :search)";
                $params['search'] = '%' . $searchQuery . '%';
            }

            $sql .= " ORDER BY appointment_date DESC, appointment_time ASC LIMIT 200";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

            // Compute statistics
            $statsStmt = $pdo->query("
                SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
                    SUM(CASE WHEN appointment_date = CURDATE() AND status != 'cancelled' THEN 1 ELSE 0 END) as today_count
                FROM consultation_appointments
            ");
            $stats = $statsStmt ? $statsStmt->fetch(PDO::FETCH_ASSOC) : [
                'total_count' => 0, 'confirmed_count' => 0, 'pending_count' => 0, 'completed_count' => 0, 'cancelled_count' => 0, 'today_count' => 0
            ];

            $statsResponse = [
                'total'           => (int)($stats['total_count'] ?? count($appointments)),
                'total_count'     => (int)($stats['total_count'] ?? count($appointments)),
                'confirmed'       => (int)($stats['confirmed_count'] ?? 0),
                'confirmed_count' => (int)($stats['confirmed_count'] ?? 0),
                'pending'         => (int)($stats['pending_count'] ?? 0),
                'pending_count'   => (int)($stats['pending_count'] ?? 0),
                'completed'       => (int)($stats['completed_count'] ?? 0),
                'completed_count' => (int)($stats['completed_count'] ?? 0),
                'cancelled'       => (int)($stats['cancelled_count'] ?? 0),
                'cancelled_count' => (int)($stats['cancelled_count'] ?? 0),
                'today'           => (int)($stats['today_count'] ?? 0),
                'today_count'     => (int)($stats['today_count'] ?? 0),
            ];

            // Fetch recent contact messages
            $msgStmt = $pdo->query("SELECT id, sender_name, sender_email, subject, message, status, created_at FROM contact_messages ORDER BY id DESC LIMIT 50");
            $messages = $msgStmt ? $msgStmt->fetchAll(PDO::FETCH_ASSOC) : [];

            $unreadMsgCount = 0;
            foreach ($messages as $m) {
                if (($m['status'] ?? '') === 'unread') {
                    $unreadMsgCount++;
                }
            }

            $payloadData = [
                'appointments'      => $appointments,
                'contact_messages'  => $messages,
                'messages'          => $messages,
                'stats'             => $statsResponse,
                'unread_messages'   => $unreadMsgCount,
                'appointment_count' => count($appointments)
            ];

            sendJsonResponse(true, 'Appointments retrieved successfully', array_merge($payloadData, [
                'data' => $payloadData
            ]));

        } catch (Throwable $e) {
            sendJsonResponse(false, 'Database error retrieving appointments: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 18. UPDATE APPOINTMENT STATUS / DETAILS
    // =========================================================================
    if ($action === 'update_appointment') {
        requireAdminApiToken($input, 'Unauthorized: Updating appointments requires administrative credentials');

        $appointmentId = intval($input['id'] ?? $input['appointment_id'] ?? 0);
        if ($appointmentId <= 0) {
            sendJsonResponse(false, 'Valid appointment ID is required', ['field' => 'id'], 400);
        }

        $newStatus = trim((string)($input['status'] ?? ''));
        $notes     = isset($input['notes']) ? trim((string)$input['notes']) : null;
        $appDate   = isset($input['appointment_date']) ? trim((string)$input['appointment_date']) : null;
        $appTime   = isset($input['appointment_time']) ? trim((string)$input['appointment_time']) : null;

        $validStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];
        if ($newStatus !== '' && !in_array($newStatus, $validStatuses, true)) {
            sendJsonResponse(false, 'Invalid appointment status value', ['allowed' => $validStatuses], 400);
        }

        try {
            $updates = [];
            $params = ['id' => $appointmentId];

            if ($newStatus !== '') {
                $updates[] = "status = :status";
                $params['status'] = $newStatus;
            }
            if ($notes !== null) {
                $updates[] = "notes = :notes";
                $params['notes'] = $notes;
            }
            if (!empty($appDate)) {
                $updates[] = "appointment_date = :app_date";
                $params['app_date'] = $appDate;
            }
            if (!empty($appTime)) {
                $updates[] = "appointment_time = :app_time";
                $params['app_time'] = $appTime;
            }

            if (empty($updates)) {
                sendJsonResponse(false, 'No fields specified to update', [], 400);
            }

            $sql = "UPDATE consultation_appointments SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            sendJsonResponse(true, 'Appointment successfully updated', [
                'appointment_id' => $appointmentId,
                'status'         => $newStatus
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to update appointment: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 19. DELETE APPOINTMENT
    // =========================================================================
    if ($action === 'delete_appointment') {
        requireAdminApiToken($input, 'Unauthorized: Deleting appointments requires administrative credentials');

        $appointmentId = intval($input['id'] ?? $input['appointment_id'] ?? 0);
        if ($appointmentId <= 0) {
            sendJsonResponse(false, 'Valid appointment ID is required', ['field' => 'id'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM consultation_appointments WHERE id = :id");
            $stmt->execute(['id' => $appointmentId]);

            sendJsonResponse(true, 'Appointment record permanently deleted', [
                'appointment_id' => $appointmentId
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete appointment: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 20. CREATE / MANUALLY SCHEDULE APPOINTMENT
    // =========================================================================
    if ($action === 'create_appointment') {
        requireAdminApiToken($input, 'Unauthorized: Manually creating appointments requires administrative credentials');

        $name     = trim(strip_tags((string)($input['name'] ?? $input['attendee_name'] ?? '')));
        $email    = trim(filter_var((string)($input['email'] ?? $input['attendee_email'] ?? ''), FILTER_SANITIZE_EMAIL));
        $phone    = trim(strip_tags((string)($input['phone'] ?? $input['attendee_phone'] ?? '')));
        $date     = trim((string)($input['appointment_date'] ?? $input['date'] ?? ''));
        $time     = trim((string)($input['appointment_time'] ?? $input['time'] ?? ''));
        $timezone = trim(strip_tags((string)($input['timezone'] ?? 'America/New_York (EST)')));
        $topic    = trim(strip_tags((string)($input['topic'] ?? 'Consultation Appointment')));
        $notes    = trim(strip_tags((string)($input['notes'] ?? '')));
        $status   = trim((string)($input['status'] ?? 'confirmed'));

        if ($name === '') {
            sendJsonResponse(false, 'Attendee name is required', ['field' => 'name'], 400);
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJsonResponse(false, 'Valid attendee email is required', ['field' => 'email'], 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            sendJsonResponse(false, 'Valid appointment date (YYYY-MM-DD) is required', ['field' => 'date'], 400);
        }
        if ($time === '') {
            sendJsonResponse(false, 'Appointment time slot is required', ['field' => 'time'], 400);
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO consultation_appointments 
                    (attendee_name, attendee_email, attendee_phone, appointment_date, appointment_time, timezone, topic, notes, email_reminder, status)
                VALUES 
                    (:name, :email, :phone, :app_date, :app_time, :tz, :topic, :notes, 1, :status)
            ");
            $stmt->execute([
                'name'     => $name,
                'email'    => $email,
                'phone'    => $phone ?: null,
                'app_date' => $date,
                'app_time' => $time,
                'tz'       => $timezone,
                'topic'    => $topic,
                'notes'    => $notes ?: null,
                'status'   => $status
            ]);
            $newId = (int)$pdo->lastInsertId();

            sendJsonResponse(true, 'Appointment successfully scheduled', [
                'appointment_id' => $newId,
                'attendee_name'  => $name,
                'date'           => $date,
                'time'           => $time
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to schedule appointment: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 21. UPDATE CONTACT MESSAGE STATUS
    // =========================================================================
    if ($action === 'update_contact_message') {
        requireAdminApiToken($input, 'Unauthorized: Updating contact messages requires administrative credentials');

        $msgId = intval($input['id'] ?? $input['message_id'] ?? 0);
        $newStatus = trim((string)($input['status'] ?? ''));

        if ($msgId <= 0) {
            sendJsonResponse(false, 'Valid message ID is required', ['field' => 'id'], 400);
        }

        $validStatuses = ['unread', 'read', 'archived', 'replied'];
        if (!in_array($newStatus, $validStatuses, true)) {
            sendJsonResponse(false, 'Invalid message status', ['allowed' => $validStatuses], 400);
        }

        try {
            $stmt = $pdo->prepare("UPDATE contact_messages SET status = :status WHERE id = :id");
            $stmt->execute(['status' => $newStatus, 'id' => $msgId]);

            sendJsonResponse(true, 'Message status updated', ['message_id' => $msgId, 'status' => $newStatus]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to update message: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 22. DELETE CONTACT MESSAGE(S)
    // =========================================================================
    if ($action === 'delete_contact_message' || $action === 'delete_contact_messages') {
        requireAdminApiToken($input, 'Unauthorized: Deleting contact messages requires administrative credentials');

        $ids = [];
        if (isset($input['ids']) && is_array($input['ids'])) {
            foreach ($input['ids'] as $idVal) {
                $intId = intval($idVal);
                if ($intId > 0) {
                    $ids[] = $intId;
                }
            }
        } elseif (isset($input['id']) || isset($input['message_id'])) {
            $singleId = intval($input['id'] ?? $input['message_id'] ?? 0);
            if ($singleId > 0) {
                $ids[] = $singleId;
            }
        }

        if (empty($ids)) {
            sendJsonResponse(false, 'At least one valid message ID is required for deletion', [], 400);
        }

        try {
            $ids = array_values(array_unique($ids));
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM contact_messages WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            $deletedCount = $stmt->rowCount();

            sendJsonResponse(true, 'Contact message(s) deleted successfully', [
                'deleted_count' => $deletedCount,
                'deleted_ids' => $ids
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete message(s): ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 23. MODIFY CONTACT MESSAGE (FULL EDIT)
    // =========================================================================
    if ($action === 'modify_contact_message') {
        requireAdminApiToken($input, 'Unauthorized: Modifying contact messages requires administrative credentials');

        $msgId = intval($input['id'] ?? $input['message_id'] ?? 0);
        if ($msgId <= 0) {
            sendJsonResponse(false, 'Valid message ID is required', ['field' => 'id'], 400);
        }

        $senderName  = trim(strip_tags((string)($input['sender_name'] ?? $input['name'] ?? '')));
        $senderEmail = trim(filter_var((string)($input['sender_email'] ?? $input['email'] ?? ''), FILTER_SANITIZE_EMAIL));
        $subject     = trim(strip_tags((string)($input['subject'] ?? '')));
        $message     = trim(strip_tags((string)($input['message'] ?? '')));
        $status      = trim(strip_tags((string)($input['status'] ?? 'unread')));

        if ($senderName === '') {
            sendJsonResponse(false, 'Sender name cannot be empty', ['field' => 'sender_name'], 400);
        }
        if ($senderEmail === '' || !filter_var($senderEmail, FILTER_VALIDATE_EMAIL)) {
            sendJsonResponse(false, 'A valid sender email address is required', ['field' => 'sender_email'], 400);
        }
        if ($message === '') {
            sendJsonResponse(false, 'Message content cannot be empty', ['field' => 'message'], 400);
        }

        $validStatuses = ['unread', 'read', 'archived', 'replied'];
        if (!in_array($status, $validStatuses, true)) {
            $status = 'unread';
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE contact_messages 
                SET sender_name = :name, sender_email = :email, subject = :subj, message = :msg, status = :status
                WHERE id = :id
            ");
            $stmt->execute([
                'name'   => $senderName,
                'email'  => $senderEmail,
                'subj'   => $subject,
                'msg'    => $message,
                'status' => $status,
                'id'     => $msgId
            ]);

            sendJsonResponse(true, 'Contact message successfully updated', [
                'id'           => $msgId,
                'sender_name'  => $senderName,
                'sender_email' => $senderEmail,
                'subject'      => $subject,
                'message'      => $message,
                'status'       => $status
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to update contact message: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 24. SEND EMAIL NOTIFICATION OF MESSAGE TO bberry@calmchessgames.com
    // =========================================================================
    if ($action === 'send_contact_notification') {
        requireAdminApiToken($input, 'Unauthorized: Sending notifications requires administrative credentials');

        $msgId = intval($input['id'] ?? $input['message_id'] ?? 0);
        if ($msgId <= 0) {
            sendJsonResponse(false, 'Valid message ID is required', ['field' => 'id'], 400);
        }

        try {
            $stmt = $pdo->prepare("SELECT id, sender_name, sender_email, subject, message, status, ip_address, created_at FROM contact_messages WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $msgId]);
            $msg = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$msg) {
                sendJsonResponse(false, 'Contact message not found', [], 404);
            }

            $senderName  = $msg['sender_name'];
            $senderEmail = $msg['sender_email'];
            $subject     = $msg['subject'];
            $bodyMsg     = $msg['message'];
            $clientIp    = $msg['ip_address'] ?? 'N/A';
            $dateCreated = $msg['created_at'];

            $notifySubject = "Notification of Message #{$msgId} from {$senderName}: {$subject}";
            $notifyText = "Hello Brian,\n\nHere is the notification for contact message #{$msgId}:\n\n"
                . "From: {$senderName} <{$senderEmail}>\n"
                . "Subject: {$subject}\n"
                . "IP Address: {$clientIp}\n"
                . "Received: {$dateCreated}\n"
                . "Status: {$msg['status']}\n\n"
                . "Message Content:\n"
                . "--------------------------------------------------\n"
                . "{$bodyMsg}\n"
                . "--------------------------------------------------\n\n"
                . "--\nCalm Chess Games Admin Notification\nhttps://calmchessgames.com";

            $notifyHtml = "
            <div style=\"font-family: Arial, sans-serif; background: #0b0f19; color: #f8fafc; padding: 26px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #ffd700;\">
                <h2 style=\"color: #ffd700; text-align: center; margin: 0 0 16px 0;\">Contact Message Notification #{$msgId}</h2>
                <div style=\"background: #131b2e; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #ffd700; margin-bottom: 18px;\">
                    <p style=\"margin: 6px 0;\"><strong>From:</strong> " . htmlspecialchars($senderName) . "</p>
                    <p style=\"margin: 6px 0;\"><strong>Email:</strong> <a href=\"mailto:" . htmlspecialchars($senderEmail) . "\" style=\"color: #ffd700;\">" . htmlspecialchars($senderEmail) . "</a></p>
                    <p style=\"margin: 6px 0;\"><strong>Subject:</strong> " . htmlspecialchars($subject) . "</p>
                    <p style=\"margin: 6px 0;\"><strong>Received:</strong> {$dateCreated}</p>
                    <p style=\"margin: 6px 0;\"><strong>IP Address:</strong> {$clientIp}</p>
                    <p style=\"margin: 6px 0;\"><strong>Current Status:</strong> <span style=\"text-transform: uppercase; color: #10b981; font-weight: bold;\">{$msg['status']}</span></p>
                </div>
                <div style=\"background: #0f172a; padding: 16px 20px; border-radius: 6px; border: 1px solid #334155;\">
                    <p style=\"font-weight: bold; color: #ffd700; margin: 0 0 8px 0;\">Message Content:</p>
                    <p style=\"white-space: pre-wrap; line-height: 1.6; margin: 0; color: #e2e8f0;\">" . htmlspecialchars($bodyMsg) . "</p>
                </div>
                <div style=\"text-align: center; margin-top: 22px;\">
                    <a href=\"mailto:{$senderEmail}?subject=Re:%20" . rawurlencode($subject) . "\" style=\"display: inline-block; background: #ffd700; color: #000; font-weight: bold; text-decoration: none; padding: 10px 22px; border-radius: 6px;\">Reply to {$senderName}</a>
                </div>
            </div>";

            $sendResult = sendSendGridEmailHttps(
                'bberry@calmchessgames.com',
                $notifySubject,
                $notifyHtml,
                $notifyText,
                'bberry@calmchessgames.com',
                'Calm Chess Message Logger'
            );

            sendJsonResponse(true, 'Notification successfully sent to bberry@calmchessgames.com', [
                'id'           => $msgId,
                'email_result' => $sendResult
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to send notification: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 25. REPLY TO CONTACT MESSAGE
    // =========================================================================
    if ($action === 'reply_contact_message') {
        requireAdminApiToken($input, 'Unauthorized: Replying to messages requires administrative credentials');

        $msgId = intval($input['id'] ?? $input['message_id'] ?? 0);
        if ($msgId <= 0) {
            sendJsonResponse(false, 'Valid message ID is required', ['field' => 'id'], 400);
        }

        $replyBody = trim((string)($input['reply'] ?? $input['reply_message'] ?? ''));
        if ($replyBody === '') {
            sendJsonResponse(false, 'Reply message cannot be empty', ['field' => 'reply'], 400);
        }

        try {
            $stmt = $pdo->prepare("SELECT id, sender_name, sender_email, subject, message FROM contact_messages WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $msgId]);
            $msg = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$msg) {
                sendJsonResponse(false, 'Contact message not found', [], 404);
            }

            $recipientEmail = $msg['sender_email'];
            $recipientName  = $msg['sender_name'];
            $origSubject    = $msg['subject'];
            $replySubject   = "Re: " . (str_starts_with($origSubject, 'Re:') ? substr($origSubject, 3) : $origSubject);

            $replyHtml = "
            <div style=\"font-family: Arial, sans-serif; background: #0b0f19; color: #f8fafc; padding: 26px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #ffd700;\">
                <div style=\"text-align: center; margin-bottom: 20px;\">
                    <h2 style=\"color: #ffd700; margin: 0 0 6px 0;\">Calm Chess Games</h2>
                    <span style=\"color: #94a3b8; font-size: 0.9rem;\">Response from Brian Berry (bberry@calmchessgames.com)</span>
                </div>
                <p style=\"font-size: 1rem; color: #e2e8f0;\">Hello <strong>" . htmlspecialchars($recipientName) . "</strong>,</p>
                <div style=\"background: #131b2e; padding: 18px 22px; border-radius: 8px; border-left: 4px solid #ffd700; margin: 18px 0;\">
                    <p style=\"white-space: pre-wrap; line-height: 1.6; margin: 0; color: #f8fafc;\">" . htmlspecialchars($replyBody) . "</p>
                </div>
                <div style=\"background: #0f172a; padding: 14px 18px; border-radius: 6px; border: 1px solid #334155; margin-top: 20px;\">
                    <p style=\"font-size: 0.82rem; color: #94a3b8; margin: 0 0 6px 0; font-weight: bold;\">--- Your Original Message ---</p>
                    <p style=\"font-size: 0.85rem; color: #cbd5e1; white-space: pre-wrap; margin: 0;\">" . htmlspecialchars($msg['message']) . "</p>
                </div>
                <p style=\"font-size: 0.85rem; color: #94a3b8; text-align: center; margin-top: 24px;\">
                    Warm regards,<br>
                    <strong>Brian Berry</strong><br>
                    Calm Chess Games &bull; <a href=\"https://calmchessgames.com\" style=\"color: #ffd700;\">calmchessgames.com</a>
                </p>
            </div>";

            $replyText = "Hello {$recipientName},\n\n{$replyBody}\n\n"
                . "--- Your Original Message ---\n"
                . "{$msg['message']}\n\n"
                . "--\nBrian Berry\nCalm Chess Games\nbberry@calmchessgames.com\nhttps://calmchessgames.com";

            // Send to recipient
            $sendRes = sendSendGridEmailHttps(
                $recipientEmail,
                $replySubject,
                $replyHtml,
                $replyText,
                'bberry@calmchessgames.com',
                'Brian Berry - Calm Chess Games'
            );

            // Also send copy to bberry@calmchessgames.com
            $copySubject = "[Copy of Sent Reply] " . $replySubject . " to " . $recipientName;
            sendSendGridEmailHttps(
                'bberry@calmchessgames.com',
                $copySubject,
                $replyHtml,
                $replyText,
                'bberry@calmchessgames.com',
                'Calm Chess Message Logger'
            );

            // Update status in database to 'replied'
            $upStmt = $pdo->prepare("UPDATE contact_messages SET status = 'replied' WHERE id = :id");
            $upStmt->execute(['id' => $msgId]);

            sendJsonResponse(true, "Reply sent successfully to {$recipientEmail} and copy delivered to bberry@calmchessgames.com", [
                'id'       => $msgId,
                'status'   => 'replied',
                'send_res' => $sendRes
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to send reply: ' . $e->getMessage(), [], 500);
        }
    }

        // =========================================================================
    // 26. WORMHOLE XR DEVICES - LIST TELEMETRY & REGISTERED HARDWARE
    // =========================================================================
    if ($action === 'get_wormhole_devices') {
        requireAdminApiToken($input, 'Unauthorized: Accessing Wormhole device registry requires administrative credentials');

        try {
            $pdo = getDbConnection();
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
                  INDEX `idx_device_type` (`device_type`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            try { $pdo->exec("ALTER TABLE `wormhole_devices` ADD UNIQUE KEY `uq_device_name` (`device_name`)"); } catch (Throwable $ignore) {}

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

            sendJsonResponse(true, 'Wormhole devices retrieved successfully', [
                'devices'      => $devices,
                'total'        => $totalCount,
                'supported'    => $supportedCount,
                'unsupported'  => $unsupportedCount,
                'vr_count'     => $vrCount,
                'mobile_count' => $mobileCount
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to fetch wormhole devices: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 27. WORMHOLE XR DEVICES - MANUALLY ADD DEVICE
    // =========================================================================
    if ($action === 'add_wormhole_device') {
        requireAdminApiToken($input, 'Unauthorized: Adding hardware entries requires administrative credentials');

        $deviceName = htmlspecialchars(trim($input['device_name'] ?? ''), ENT_QUOTES, 'UTF-8');
        $deviceType = trim($input['device_type'] ?? 'unknown');
        $osPlatform = htmlspecialchars(trim($input['os_platform'] ?? ''), ENT_QUOTES, 'UTF-8');
        $browser = htmlspecialchars(trim($input['browser'] ?? ''), ENT_QUOTES, 'UTF-8');
        $gpuRenderer = htmlspecialchars(trim($input['gpu_renderer'] ?? ''), ENT_QUOTES, 'UTF-8');
        $supportedModes = htmlspecialchars(trim($input['supported_modes'] ?? 'desktop-xr'), ENT_QUOTES, 'UTF-8');
        $isSupported = isset($input['is_supported']) && ($input['is_supported'] === 1 || $input['is_supported'] === '1' || $input['is_supported'] === true) ? 1 : 0;
        $notes = htmlspecialchars(trim($input['notes'] ?? ''), ENT_QUOTES, 'UTF-8');

        if (empty($deviceName)) {
            sendJsonResponse(false, 'Device name / model is required', ['field' => 'device_name'], 400);
        }

        $validTypes = ['desktop', 'vr_hmd', 'mobile', 'tablet', 'ar_glasses', 'unknown'];
        if (!in_array($deviceType, $validTypes, true)) {
            $deviceType = 'unknown';
        }

        try {
            $pdo = getDbConnection();
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

            sendJsonResponse(true, "Device '{$deviceName}' registered successfully into hardware database.", [
                'id' => (int)$pdo->lastInsertId()
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to add device: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 28. WORMHOLE XR DEVICES - TOGGLE OR UPDATE SUPPORT STATUS
    // =========================================================================
    if ($action === 'update_wormhole_device') {
        requireAdminApiToken($input, 'Unauthorized: Updating hardware status requires administrative credentials');

        $deviceId = intval($input['id'] ?? 0);
        if ($deviceId <= 0) {
            sendJsonResponse(false, 'Valid device ID is required', ['field' => 'id'], 400);
        }

        try {
            $pdo = getDbConnection();
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
                sendJsonResponse(false, 'No fields specified for update', [], 400);
            }

            $sql = "UPDATE `wormhole_devices` SET " . implode(', ', $fields) . ", `updated_at` = NOW() WHERE `id` = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            sendJsonResponse(true, "Device #{$deviceId} updated successfully");
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to update device: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 29. WORMHOLE XR DEVICES - DELETE DEVICE RECORD
    // =========================================================================
    if ($action === 'delete_wormhole_device') {
        requireAdminApiToken($input, 'Unauthorized: Deleting hardware records requires administrative credentials');

        $deviceId = intval($input['id'] ?? 0);
        if ($deviceId <= 0) {
            sendJsonResponse(false, 'Valid device ID is required', ['field' => 'id'], 400);
        }

        try {
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("DELETE FROM `wormhole_devices` WHERE `id` = :id");
            $stmt->execute(['id' => $deviceId]);

            sendJsonResponse(true, "Device entry #{$deviceId} deleted successfully", ['id' => $deviceId]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete device: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 30. WORMHOLE XR DEVICES - SEED OPEN-SOURCE CERTIFIED XR DEVICES
    // =========================================================================
    if ($action === 'seed_wormhole_devices') {
        requireAdminApiToken($input, 'Unauthorized: Seeding hardware records requires administrative credentials');

        try {
            $pdo = getDbConnection();
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

            sendJsonResponse(true, "Successfully populated {$seededCount} certified Open-Source XR/ARCore devices into registry.", [
                'seeded_count' => $seededCount
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to seed devices: ' . $e->getMessage(), [], 500);
        }
    }

// =========================================================================
    // 30. WORMHOLE GAME WEAPONS & STAGE ARSENAL MANAGER
    // =========================================================================
    if ($action === 'get_game_weapons') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager weapons requires administrative credentials');

        try {
            $pdo = getDbConnection();
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

            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `scale` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `bullet_speed`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `scale_x` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `scale`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `scale_y` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `scale_x`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `scale_z` DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `scale_y`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `size_x` DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER `scale_z`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `size_y` DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER `size_x`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `size_z` DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER `size_y`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `special_fx` VARCHAR(64) NOT NULL DEFAULT 'cockpit_cracks_red_edges' AFTER `size_z`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `special_fx_file` VARCHAR(255) NOT NULL DEFAULT 'desktop/warp_origin_images/cockpit_cracks_overlay.png' AFTER `special_fx`"); } catch (Throwable $e) {}
            try { $pdo->exec("ALTER TABLE `wormhole_game_weapons` ADD COLUMN `special_fx_type` VARCHAR(32) NOT NULL DEFAULT 'overlay' AFTER `special_fx_file`"); } catch (Throwable $e) {}

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

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== '' ? intval($input['stage_level']) : null;
            if ($stageFilter !== null && $stageFilter > 0) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_weapons` WHERE `stage_level` = :stage ORDER BY `is_initial_weapon` DESC, `damage_per_hit` DESC, `id` ASC");
                $stmt->execute(['stage' => $stageFilter]);
            } else {
                $stmt = $pdo->query("SELECT * FROM `wormhole_game_weapons` ORDER BY `stage_level` ASC, `is_initial_weapon` DESC, `damage_per_hit` DESC, `id` ASC");
            }
            $weapons = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stagesStmt = $pdo->query("SELECT DISTINCT `stage_level` FROM `wormhole_game_weapons` ORDER BY `stage_level` ASC");
            $stages = $stagesStmt->fetchAll(PDO::FETCH_COLUMN);

            sendJsonResponse(true, 'Game weapons loaded successfully', [
                'weapons' => $weapons,
                'stages'  => $stages,
                'total'   => count($weapons)
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to fetch game weapons: ' . $e->getMessage(), [], 500);
        }
    }

    // SAVE / EDIT WEAPON
    if ($action === 'save_game_weapon') {
        requireAdminApiToken($input, 'Unauthorized: Modifying game weapons requires administrative credentials');

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
        $scale = isset($input['scale']) ? max(0.01, min(50.0, floatval($input['scale']))) : 1.0;
        $scaleX = isset($input['scale_x']) ? max(0.01, min(50.0, floatval($input['scale_x']))) : 1.0;
        $scaleY = isset($input['scale_y']) ? max(0.01, min(50.0, floatval($input['scale_y']))) : 1.0;
        $scaleZ = isset($input['scale_z']) ? max(0.01, min(50.0, floatval($input['scale_z']))) : 1.0;
        $sizeX = isset($input['size_x']) ? max(0.01, min(50.0, floatval($input['size_x']))) : 1.0;
        $sizeY = isset($input['size_y']) ? max(0.01, min(50.0, floatval($input['size_y']))) : 1.0;
        $sizeZ = isset($input['size_z']) ? max(0.01, min(50.0, floatval($input['size_z']))) : 1.0;
        $specialFx = trim($input['special_fx'] ?? 'cockpit_cracks_red_edges');
        $specialFxFile = trim($input['special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png');
        $specialFxType = trim($input['special_fx_type'] ?? 'overlay');
        $icon = trim($input['icon'] ?? '⚡');
        $colorHex = trim($input['color_hex'] ?? '#ff3344');
        $description = trim($input['description'] ?? '');
        $id = intval($input['id'] ?? 0);

        if (empty($weaponId) || empty($weaponName)) {
            sendJsonResponse(false, 'Weapon ID (code) and Name are required fields.', ['fields' => ['weapon_id', 'weapon_name']], 400);
        }

        $weaponId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', strtolower($weaponId));

        try {
            $pdo = getDbConnection();

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
                      `scale` = :scale,
                      `scale_x` = :scale_x,
                      `scale_y` = :scale_y,
                      `scale_z` = :scale_z,
                      `size_x` = :size_x,
                      `size_y` = :size_y,
                      `size_z` = :size_z,
                      `special_fx` = :special_fx,
                      `special_fx_file` = :special_fx_file,
                      `special_fx_type` = :special_fx_type,
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
                    'scale' => $scale,
                    'scale_x' => $scaleX,
                    'scale_y' => $scaleY,
                    'scale_z' => $scaleZ,
                    'size_x' => $sizeX,
                    'size_y' => $sizeY,
                    'size_z' => $sizeZ,
                    'special_fx' => $specialFx,
                    'special_fx_file' => $specialFxFile,
                    'special_fx_type' => $specialFxType,
                    'id' => $id
                ]);
                $provResults = provisionAllWormholeStageFilesAndAudio();
                sendJsonResponse(true, "Weapon '{$weaponName}' updated successfully and stage JS files synchronized.", ['id' => $id, 'weapon_id' => $weaponId, 'provision_results' => $provResults]);
            } else {
                $insStmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_weapons`
                    (`weapon_id`, `weapon_name`, `description`, `icon`, `color_hex`, `stage_level`, `is_initial_weapon`, `is_acquirable`, `acquire_event`, `energy_drain_pct`, `can_overheat`, `cooldown_seconds`, `damage_per_hit`, `bullet_speed`, `scale`, `scale_x`, `scale_y`, `scale_z`, `size_x`, `size_y`, `size_z`, `special_fx`, `special_fx_file`, `special_fx_type`)
                    VALUES (:wid, :wname, :desc, :icon, :color, :stage, :init, :acq, :evt, :drain, :heat, :cool, :dmg, :spd, :scale, :scale_x, :scale_y, :scale_z, :size_x, :size_y, :size_z, :special_fx, :special_fx_file, :special_fx_type)
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
                      `scale` = VALUES(`scale`),
                      `scale_x` = VALUES(`scale_x`),
                      `scale_y` = VALUES(`scale_y`),
                      `scale_z` = VALUES(`scale_z`),
                      `size_x` = VALUES(`size_x`),
                      `size_y` = VALUES(`size_y`),
                      `size_z` = VALUES(`size_z`),
                      `special_fx` = VALUES(`special_fx`),
                      `special_fx_file` = VALUES(`special_fx_file`),
                      `special_fx_type` = VALUES(`special_fx_type`),
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
                    'spd' => $bulletSpeed,
                    'scale' => $scale,
                    'scale_x' => $scaleX,
                    'scale_y' => $scaleY,
                    'scale_z' => $scaleZ,
                    'size_x' => $sizeX,
                    'size_y' => $sizeY,
                    'size_z' => $sizeZ,
                    'special_fx' => $specialFx,
                    'special_fx_file' => $specialFxFile,
                    'special_fx_type' => $specialFxType
                ]);
                $newId = (int)$pdo->lastInsertId();
                $provResults = provisionAllWormholeStageFilesAndAudio();
                sendJsonResponse(true, "Weapon '{$weaponName}' added successfully and stage JS files synchronized.", ['id' => $newId, 'weapon_id' => $weaponId, 'provision_results' => $provResults]);
            }
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to save game weapon: ' . $e->getMessage(), [], 500);
        }
    }

    // DELETE WEAPON
    if ($action === 'delete_game_weapon') {
        requireAdminApiToken($input, 'Unauthorized: Deleting game weapons requires administrative credentials');

        $weaponId = trim($input['weapon_id'] ?? '');
        $id = intval($input['id'] ?? 0);

        if ($id <= 0 && empty($weaponId)) {
            sendJsonResponse(false, 'Weapon ID or numeric record ID is required', [], 400);
        }

        try {
            $pdo = getDbConnection();
            if ($id > 0) {
                $stmt = $pdo->prepare("DELETE FROM `wormhole_game_weapons` WHERE `id` = :id");
                $stmt->execute(['id' => $id]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM `wormhole_game_weapons` WHERE `weapon_id` = :wid");
                $stmt->execute(['wid' => $weaponId]);
            }
            sendJsonResponse(true, 'Weapon deleted successfully');
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete weapon: ' . $e->getMessage(), [], 500);
        }
    }

    // TOGGLE OVERHEAT
    if ($action === 'toggle_game_weapon_overheat') {
        requireAdminApiToken($input, 'Unauthorized: Toggling weapon overheat requires administrative credentials');

        $id = intval($input['id'] ?? 0);
        if ($id <= 0) {
            sendJsonResponse(false, 'Valid weapon record ID is required', [], 400);
        }

        try {
            $pdo = getDbConnection();
            $checkStmt = $pdo->prepare("SELECT `can_overheat` FROM `wormhole_game_weapons` WHERE `id` = :id");
            $checkStmt->execute(['id' => $id]);
            $current = $checkStmt->fetchColumn();
            if ($current === false) {
                sendJsonResponse(false, 'Weapon not found', [], 404);
            }

            $newVal = ((int)$current === 1) ? 0 : 1;
            if (isset($input['can_overheat'])) {
                $newVal = (!empty($input['can_overheat']) && $input['can_overheat'] != '0') ? 1 : 0;
            }

            $upd = $pdo->prepare("UPDATE `wormhole_game_weapons` SET `can_overheat` = :val, `updated_at` = NOW() WHERE `id` = :id");
            $upd->execute(['val' => $newVal, 'id' => $id]);

            sendJsonResponse(true, "Weapon overheat status updated to " . ($newVal ? 'ENABLED' : 'DISABLED'), [
                'id' => $id,
                'can_overheat' => $newVal
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to toggle weapon overheat: ' . $e->getMessage(), [], 500);
        }
    }

    // TOGGLE INITIAL WEAPON FOR STAGE
    if ($action === 'toggle_game_weapon_initial') {
        requireAdminApiToken($input, 'Unauthorized: Changing stage initial weapon requires administrative credentials');

        $id = intval($input['id'] ?? 0);
        if ($id <= 0) {
            sendJsonResponse(false, 'Valid weapon record ID is required', [], 400);
        }

        try {
            $pdo = getDbConnection();
            $selStmt = $pdo->prepare("SELECT `id`, `stage_level`, `is_initial_weapon`, `weapon_name` FROM `wormhole_game_weapons` WHERE `id` = :id");
            $selStmt->execute(['id' => $id]);
            $weapon = $selStmt->fetch(PDO::FETCH_ASSOC);
            if (!$weapon) {
                sendJsonResponse(false, 'Weapon not found', [], 404);
            }

            $stage = (int)$weapon['stage_level'];
            $currentInit = (int)$weapon['is_initial_weapon'];
            $newInit = ($currentInit === 1) ? 0 : 1;

            if ($newInit === 1) {
                $clearStmt = $pdo->prepare("UPDATE `wormhole_game_weapons` SET `is_initial_weapon` = 0 WHERE `stage_level` = :stage");
                $clearStmt->execute(['stage' => $stage]);
            }

            $updStmt = $pdo->prepare("UPDATE `wormhole_game_weapons` SET `is_initial_weapon` = :init, `updated_at` = NOW() WHERE `id` = :id");
            $updStmt->execute(['init' => $newInit, 'id' => $id]);

            sendJsonResponse(true, "'{$weapon['weapon_name']}' is " . ($newInit ? "now the INITIAL weapon for Stage {$stage}." : "no longer initial weapon for Stage {$stage}."), [
                'id' => $id,
                'stage_level' => $stage,
                'is_initial_weapon' => $newInit
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to update initial weapon: ' . $e->getMessage(), [], 500);
        }
    }

    // RE-SEED DEFAULT WEAPONS
    if ($action === 'seed_game_weapons') {
        requireAdminApiToken($input, 'Unauthorized: Seeding default weapons requires administrative credentials');

        try {
            $pdo = getDbConnection();
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

            $count = 0;
            foreach ($defaults as $d) {
                $ins->execute($d);
                $count++;
            }

            sendJsonResponse(true, "Successfully initialized/reset {$count} default stage weapons into database.", [
                'count' => $count
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to seed weapons: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 31. WORMHOLE GAME STAGES & LEVEL PROGRESSION MANAGER
    // =========================================================================
    if ($action === 'get_game_stages') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');

        try {
            $pdo = getDbConnection();
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
                error_log("Stages migration warning: " . $eMig->getMessage());
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

            sendJsonResponse(true, 'Game stages loaded successfully', [
                'stages' => $stages,
                'total'  => count($stages)
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to fetch game stages: ' . $e->getMessage(), [], 500);
        }
    }

        /**
     * Provisions stage JavaScript files and stage object pools across
     * wormhole0 directories: js, mobile, desktop, arcore, and vr.
     * Uses canonical provisioner in wormhole_stage_provisioner.php.
     */
    require_once __DIR__ . '/wormhole_stage_provisioner.php';

    if ($action === 'save_game_stage') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $stageLevel = isset($input['stage_level']) ? intval($input['stage_level']) : 1;
        $stageName = trim($input['stage_name'] ?? '');
        $theme = trim($input['environment_theme'] ?? 'Warp Cyan Corridor');
        $eventsWithin = trim($input['events_within_level'] ?? '');
        $endLevelEvent = trim($input['end_level_event'] ?? '');
        $description = trim($input['description'] ?? '');
        $missionObjectives = trim($input['mission_objectives'] ?? '');
        $requiredEnemyKills = isset($input['required_enemy_kills']) ? max(0, intval($input['required_enemy_kills'])) : 10;
        $warpTargetDistance = isset($input['warp_target_distance']) ? max(1000, intval($input['warp_target_distance'])) : 50000;
        $parScore = isset($input['par_score']) ? intval($input['par_score']) : 5000;
        $isEnabled = isset($input['is_enabled']) ? intval($input['is_enabled']) : 1;

        if ($stageLevel <= 0) {
            sendJsonResponse(false, 'Stage Level must be a positive integer', [], 400);
        }
        if (empty($stageName)) {
            sendJsonResponse(false, 'Stage / Level Name is required', [], 400);
        }
        if (empty($eventsWithin)) {
            sendJsonResponse(false, 'Events within the level are required', [], 400);
        }
        if (empty($endLevelEvent)) {
            sendJsonResponse(false, 'Event that ends the level is required', [], 400);
        }

        try {
            $pdo = getDbConnection();
            $provisionResult = provisionWormholeStageFilesAndAudio($stageLevel, $stageName, $theme, $eventsWithin, $endLevelEvent, $description, $parScore, $missionObjectives, $requiredEnemyKills, $warpTargetDistance);

            if ($id > 0) {
                $stmt = $pdo->prepare("
                    UPDATE `wormhole_game_stages`
                    SET `stage_level` = :stage_level,
                        `stage_name` = :stage_name,
                        `environment_theme` = :theme,
                        `events_within_level` = :events,
                        `end_level_event` = :end_event,
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
                    ':stage_level' => $stageLevel,
                    ':stage_name'  => $stageName,
                    ':theme'       => $theme,
                    ':events'      => $eventsWithin,
                    ':end_event'   => $endLevelEvent,
                    ':objectives'  => $missionObjectives,
                    ':kills'       => $requiredEnemyKills,
                    ':warp_dist'   => $warpTargetDistance,
                    ':desc'        => $description,
                    ':par_score'   => $parScore,
                    ':is_enabled'  => $isEnabled,
                    ':id'          => $id
                ]);
                sendJsonResponse(true, "Stage '{$stageName}' updated successfully", [
                    'id' => $id,
                    'stage_slug' => $provisionResult['stage_slug'],
                    'created_files' => $provisionResult['created_files'],
                    'audio_folders' => $provisionResult['audio_folders'],
                    'image_folders' => $provisionResult['image_folders']
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_stages`
                    (`stage_level`, `stage_name`, `environment_theme`, `events_within_level`, `end_level_event`, `mission_objectives`, `required_enemy_kills`, `warp_target_distance`, `description`, `par_score`, `is_enabled`)
                    VALUES
                    (:stage_level, :stage_name, :theme, :events, :end_event, :objectives, :kills, :warp_dist, :desc, :par_score, :is_enabled)
                    ON DUPLICATE KEY UPDATE
                        `stage_name` = VALUES(`stage_name`),
                        `environment_theme` = VALUES(`environment_theme`),
                        `events_within_level` = VALUES(`events_within_level`),
                        `end_level_event` = VALUES(`end_level_event`),
                        `mission_objectives` = VALUES(`mission_objectives`),
                        `required_enemy_kills` = VALUES(`required_enemy_kills`),
                        `warp_target_distance` = VALUES(`warp_target_distance`),
                        `description` = VALUES(`description`),
                        `par_score` = VALUES(`par_score`),
                        `is_enabled` = VALUES(`is_enabled`),
                        `updated_at` = NOW()
                ");
                $stmt->execute([
                    ':stage_level' => $stageLevel,
                    ':stage_name'  => $stageName,
                    ':theme'       => $theme,
                    ':events'      => $eventsWithin,
                    ':end_event'   => $endLevelEvent,
                    ':objectives'  => $missionObjectives,
                    ':kills'       => $requiredEnemyKills,
                    ':warp_dist'   => $warpTargetDistance,
                    ':desc'        => $description,
                    ':par_score'   => $parScore,
                    ':is_enabled'  => $isEnabled
                ]);
                $newId = (int)$pdo->lastInsertId();
                sendJsonResponse(true, "Stage '{$stageName}' created successfully", [
                    'id' => $newId,
                    'stage_slug' => $provisionResult['stage_slug'],
                    'created_files' => $provisionResult['created_files'],
                    'audio_folders' => $provisionResult['audio_folders'],
                    'image_folders' => $provisionResult['image_folders']
                ]);
            }
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to save game stage: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'delete_game_stage') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        if ($id <= 0) {
            sendJsonResponse(false, 'Invalid stage ID', [], 400);
        }

        try {
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("DELETE FROM `wormhole_game_stages` WHERE `id` = :id");
            $stmt->execute(['id' => $id]);
            sendJsonResponse(true, 'Stage deleted successfully', ['id' => $id]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete stage: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'seed_game_stages') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');

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
                provisionWormholeStageFilesAndAudio($s[0], $s[1], $s[2], $s[3], $s[4], $s[5], $s[6]);
                $count++;
            }

            sendJsonResponse(true, "Successfully initialized/reset {$count} default game stages into database.", [
                'count' => $count
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to seed stages: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'sync_all_stage_files') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager stages requires administrative credentials');

        try {
            $pdo = getDbConnection();
            $stmt = $pdo->query("SELECT * FROM `wormhole_game_stages` ORDER BY `stage_level` ASC");
            $stages = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

            if (empty($stages)) {
                $defaultStages = [
                    [1, 'Warp Origin', 'Warp Cyan Corridor', 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert', 'Warp Horizon Jump Gate Initialized', 'Initial entry vector into unstable hyperspace corridor.', 5000],
                    [2, 'Event Horizon', 'Event Horizon Amber', 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert', 'Singularity Perimeter Breach', 'High-velocity relativistic light-horizon boundary with intense magnetic shear.', 12000],
                    [3, 'Singularity Core', 'Singularity Void Violet', 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening', 'Core Collapse Breakthrough', 'Extreme gravitational distortion sector.', 25000],
                    [4, 'Quantum Realm', 'Quantum Phasor Magenta', 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation', 'Quantum Conduit Realignment & Safe Extraction', 'Deepest reaches beyond physical spacetime.', 50000],
                    [5, 'Final Boss Stage', 'Singularity Overlord Crimson', 'Singularity Horizon Collapse, Dreadnought Gravitational Wave, Titan Core Overcharge, Final Singularity Breach', 'Wormhole Singularity Overlord Defeated', 'The epicenter of the cosmic anomaly where the ancient Singularity Overlord Titan commands relativistic swarm dreadnoughts.', 75000]
                ];
                foreach ($defaultStages as $s) {
                    $stages[] = [
                        'stage_level' => $s[0],
                        'stage_name' => $s[1],
                        'environment_theme' => $s[2],
                        'events_within_level' => $s[3],
                        'end_level_event' => $s[4],
                        'description' => $s[5],
                        'par_score' => $s[6]
                    ];
                }
            }

            $allCreatedFiles = [];
            $allAudioFolders = [];

            foreach ($stages as $s) {
                $res = provisionWormholeStageFilesAndAudio(
                    $s['stage_level'],
                    $s['stage_name'],
                    $s['environment_theme'] ?? 'Warp Cyan Corridor',
                    $s['events_within_level'] ?? '',
                    $s['end_level_event'] ?? '',
                    $s['description'] ?? '',
                    $s['par_score'] ?? 5000,
                    $s['mission_objectives'] ?? '',
                    $s['required_enemy_kills'] ?? 10,
                    $s['warp_target_distance'] ?? 50000
                );
                $allCreatedFiles = array_merge($allCreatedFiles, $res['created_files']);
                $allAudioFolders = array_merge($allAudioFolders, $res['audio_folders']);
            }

            $allCreatedFiles = array_values(array_unique($allCreatedFiles));
            $allAudioFolders = array_values(array_unique($allAudioFolders));

            sendJsonResponse(true, "Successfully synchronized " . count($stages) . " stages into admin/temp_stage_0 and wormhole0 directories (mobile, desktop, vr, arcore) with empty audio folders.", [
                'total_stages' => count($stages),
                'files_count' => count($allCreatedFiles),
                'audio_folders_count' => count($allAudioFolders),
                'files' => $allCreatedFiles,
                'audio_folders' => $allAudioFolders
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to sync stage files: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 32. WORMHOLE GAME ENEMIES & THREAT REGISTRY MANAGER
    // =========================================================================
    if ($action === 'get_game_enemies') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

        try {
            $pdo = getDbConnection();
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_enemies` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `enemy_id` VARCHAR(64) NOT NULL,
                  `device_type` VARCHAR(32) NOT NULL DEFAULT 'all',
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
                  `quick_effect_primary` VARCHAR(64) NOT NULL DEFAULT 'none',
                  `quick_effect_secondary` VARCHAR(64) NOT NULL DEFAULT 'none',
                  `quick_effect_color` VARCHAR(16) NOT NULL DEFAULT '#00f0ff',
                  `quick_effect_intensity` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
                  `quick_effect_speed` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
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

            // Auto-migrate wormhole_game_enemies columns & composite unique index if missing
            try {
                $colDev = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'device_type'")->fetch();
                if (!$colDev) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `device_type` VARCHAR(32) NOT NULL DEFAULT 'all' AFTER `enemy_id`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD INDEX `idx_device_type` (`device_type`)");
                }
                // Try dropping old single enemy_id unique key if it exists
                try {
                    $pdo->exec("ALTER TABLE `wormhole_game_enemies` DROP INDEX `enemy_id`");
                } catch (Throwable $ignore) {}
                try {
                    $pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD UNIQUE KEY `uq_enemy_device_stage` (`enemy_id`, `device_type`, `stage_level`)");
                } catch (Throwable $ignore) {}

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

                $colCheckEff = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'quick_effect_primary'")->fetch();
                if (!$colCheckEff) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `quick_effect_primary` VARCHAR(64) NOT NULL DEFAULT 'none' AFTER `weapon_color`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `quick_effect_secondary` VARCHAR(64) NOT NULL DEFAULT 'none' AFTER `quick_effect_primary`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `quick_effect_color` VARCHAR(16) NOT NULL DEFAULT '#00f0ff' AFTER `quick_effect_secondary`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `quick_effect_intensity` DECIMAL(4,2) NOT NULL DEFAULT 1.00 AFTER `quick_effect_color`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `quick_effect_speed` DECIMAL(4,2) NOT NULL DEFAULT 1.00 AFTER `quick_effect_intensity`");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `quick_effect_primary` = 'plasma_aura', `quick_effect_secondary` = 'sparks_burst', `quick_effect_color` = '#00f0ff' WHERE `enemy_id` LIKE '%scout%' OR `enemy_id` LIKE '%void_recon%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `quick_effect_primary` = 'engine_ion_thrust', `quick_effect_secondary` = 'plasma_aura', `quick_effect_color` = '#38bdf8' WHERE `enemy_id` LIKE '%interceptor%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `quick_effect_primary` = 'tachyon_trail', `quick_effect_secondary` = 'sparks_burst', `quick_effect_color` = '#ffd166' WHERE `enemy_id` LIKE '%cruiser%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `quick_effect_primary` = 'gravitational_vortex', `quick_effect_secondary` = 'arc_lightning', `quick_effect_color` = '#a855f7' WHERE `enemy_id` LIKE '%guardian%' OR `enemy_id` LIKE '%probe%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `quick_effect_primary` = 'quantum_phase_glow', `quick_effect_secondary` = 'energy_shield_pulse', `quick_effect_color` = '#ef476f' WHERE `enemy_id` LIKE '%dreadnought%'");
                }

                $colCheckDest = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE 'destruction_particle_type'")->fetch();
                if (!$colCheckDest) {
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `destruction_particle_type` VARCHAR(64) NOT NULL DEFAULT 'procedural_sparks_explosion' AFTER `quick_effect_speed`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `destruction_particle_url` VARCHAR(255) NULL AFTER `destruction_particle_type`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `destruction_particle_count` INT NOT NULL DEFAULT 40 AFTER `destruction_particle_url`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `destruction_particle_color` VARCHAR(16) NOT NULL DEFAULT '#ff0055' AFTER `destruction_particle_count`");
                    @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `destruction_particle_scale` DECIMAL(4,2) NOT NULL DEFAULT 1.00 AFTER `destruction_particle_color`");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `destruction_particle_type` = 'procedural_sparks_explosion', `destruction_particle_count` = 30, `destruction_particle_color` = '#00f0ff' WHERE `enemy_id` LIKE '%scout%' OR `enemy_id` LIKE '%void_recon%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `destruction_particle_type` = 'procedural_plasma_shatter', `destruction_particle_count` = 45, `destruction_particle_color` = '#38bdf8' WHERE `enemy_id` LIKE '%interceptor%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `destruction_particle_type` = 'procedural_debris_cloud', `destruction_particle_count` = 60, `destruction_particle_color` = '#ffd166' WHERE `enemy_id` LIKE '%cruiser%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `destruction_particle_type` = 'procedural_quantum_implosion', `destruction_particle_count` = 80, `destruction_particle_color` = '#a855f7' WHERE `enemy_id` LIKE '%guardian%' OR `enemy_id` LIKE '%probe%'");
                    @$pdo->exec("UPDATE `wormhole_game_enemies` SET `destruction_particle_type` = 'procedural_plasma_shatter', `destruction_particle_count` = 120, `destruction_particle_color` = '#ef476f' WHERE `enemy_id` LIKE '%dreadnought%'");
                }

                $enemyCols = [
                    'weapons_json'   => "LONGTEXT NULL AFTER `weapon_color`",
                    'weapon_scale'   => "DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `weapon_color`",
                    'weapon_scale_x' => "DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `weapon_scale`",
                    'weapon_scale_y' => "DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `weapon_scale_x`",
                    'weapon_scale_z' => "DECIMAL(5,2) NOT NULL DEFAULT 1.00 AFTER `weapon_scale_y`",
                    'weapon_size_x'  => "DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER `weapon_scale_z`",
                    'weapon_size_y'  => "DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER `weapon_size_x`",
                    'weapon_size_z'  => "DECIMAL(6,2) NOT NULL DEFAULT 1.00 AFTER `weapon_size_y`",
                    'weapon_special_fx' => "VARCHAR(64) NOT NULL DEFAULT 'cockpit_cracks_red_edges' AFTER `weapon_size_z`",
                    'weapon_special_fx_file' => "VARCHAR(255) NOT NULL DEFAULT 'desktop/warp_origin_images/cockpit_cracks_overlay.png' AFTER `weapon_special_fx`",
                    'weapon_special_fx_type' => "VARCHAR(32) NOT NULL DEFAULT 'overlay' AFTER `weapon_special_fx_file`",
                    'fire_rate_ms'   => "INT NOT NULL DEFAULT 2000 AFTER `fire_rate_seconds`"
                ];
                foreach ($enemyCols as $colName => $colDef) {
                    try {
                        $chk = $pdo->query("SHOW COLUMNS FROM `wormhole_game_enemies` LIKE '{$colName}'")->fetch();
                        if (!$chk) {
                            @$pdo->exec("ALTER TABLE `wormhole_game_enemies` ADD COLUMN `{$colName}` {$colDef}");
                        }
                    } catch (Throwable $eCol) {}
                }
                @$pdo->exec("UPDATE `wormhole_game_enemies` SET `fire_rate_ms` = ROUND(COALESCE(`fire_rate_seconds`, 2.0) * 1000) WHERE `fire_rate_ms` IS NULL OR `fire_rate_ms` <= 0");
            } catch (Throwable $eMigE) {
                error_log("Enemies migration warning: " . $eMigE->getMessage());
            }

            // Automatic repair for legacy casing/missing _images typos in database
            try {
                $pdo->exec("UPDATE `wormhole_game_enemies` SET `model_3d_url` = 'mobile/event_horizon_images/red_recon_drone.glb' WHERE `model_3d_url` LIKE '%Event_Horizon%' OR `model_3d_url` = 'mobile/event_horizon/red_recon_drone.glb'");
                $pdo->exec("UPDATE `wormhole_game_environments` SET `model_3d_url` = REPLACE(`model_3d_url`, 'Event_Horizon', 'event_horizon_images') WHERE `model_3d_url` LIKE '%Event_Horizon%'");
                $pdo->exec("UPDATE `wormhole_game_environments` SET `image_asset_url` = REPLACE(`image_asset_url`, 'Event_Horizon', 'event_horizon_images') WHERE `image_asset_url` LIKE '%Event_Horizon%'");
            } catch (Throwable $ignore) {}

            try {
                $pdo->exec("
                    UPDATE `wormhole_game_enemies`
                    SET `enemy_name` = REPLACE(`enemy_name`, '(Copy)', CONCAT('(', CASE 
                        WHEN `device_type` = 'desktop' THEN 'Desktop'
                        WHEN `device_type` = 'mobile' THEN 'Mobile'
                        WHEN `device_type` = 'vr' THEN 'VR Headset'
                        WHEN `device_type` = 'arcore' THEN 'ARCore'
                        ELSE 'Universal'
                    END, ')'))
                    WHERE `enemy_name` LIKE '%(Copy)%'
                ");
                $pdo->exec("
                    UPDATE `wormhole_game_enemies`
                    SET `enemy_id` = REPLACE(`enemy_id`, '_copy', CONCAT('_', `device_type`))
                    WHERE `enemy_id` LIKE '%_copy%'
                ");
                $pdo->exec("
                    UPDATE `wormhole_game_enemies`
                    SET `enemy_name` = CONCAT(TRIM(`enemy_name`), ' (', CASE 
                        WHEN `device_type` = 'desktop' THEN 'Desktop'
                        WHEN `device_type` = 'mobile' THEN 'Mobile'
                        WHEN `device_type` = 'vr' THEN 'VR Headset'
                        WHEN `device_type` = 'arcore' THEN 'ARCore'
                        ELSE 'Universal'
                    END, ')')
                    WHERE `enemy_name` NOT LIKE '%(Desktop)%'
                      AND `enemy_name` NOT LIKE '%(Mobile)%'
                      AND `enemy_name` NOT LIKE '%(VR Headset)%'
                      AND `enemy_name` NOT LIKE '%(ARCore)%'
                      AND `enemy_name` NOT LIKE '%(Universal)%'
                ");
            } catch (Throwable $eClean) {}

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== 'all' && $input['stage_level'] !== '' ? intval($input['stage_level']) : null;
            $deviceFilter = isset($input['device_type']) && $input['device_type'] !== 'all' && $input['device_type'] !== '' ? strtolower(trim($input['device_type'])) : null;

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

            // Ensure multiple weapons structure and millisecond firing rate are formatted for every enemy
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
                        $wpnsList = array_map(function($wItem, $wIdx) use ($enRow, $frSec) {
                            $wScale = isset($wItem['scale']) ? floatval($wItem['scale']) : floatval($enRow['weapon_scale'] ?? 1.0);
                            $wScaleX = isset($wItem['scale_x']) ? floatval($wItem['scale_x']) : (isset($wItem['scaleX']) ? floatval($wItem['scaleX']) : floatval($enRow['weapon_scale_x'] ?? 1.0));
                            $wScaleY = isset($wItem['scale_y']) ? floatval($wItem['scale_y']) : (isset($wItem['scaleY']) ? floatval($wItem['scaleY']) : floatval($enRow['weapon_scale_y'] ?? 1.0));
                            $wScaleZ = isset($wItem['scale_z']) ? floatval($wItem['scale_z']) : (isset($wItem['scaleZ']) ? floatval($wItem['scaleZ']) : floatval($enRow['weapon_scale_z'] ?? 1.0));
                            $wSizeX = isset($wItem['size_x']) ? floatval($wItem['size_x']) : (isset($wItem['sizeX']) ? floatval($wItem['sizeX']) : ((isset($wItem['dimensions']) && isset($wItem['dimensions']['x'])) ? floatval($wItem['dimensions']['x']) : floatval($enRow['weapon_size_x'] ?? 1.0)));
                            $wSizeY = isset($wItem['size_y']) ? floatval($wItem['size_y']) : (isset($wItem['sizeY']) ? floatval($wItem['sizeY']) : ((isset($wItem['dimensions']) && isset($wItem['dimensions']['y'])) ? floatval($wItem['dimensions']['y']) : floatval($enRow['weapon_size_y'] ?? 1.0)));
                            $wSizeZ = isset($wItem['size_z']) ? floatval($wItem['size_z']) : (isset($wItem['sizeZ']) ? floatval($wItem['sizeZ']) : ((isset($wItem['dimensions']) && isset($wItem['dimensions']['z'])) ? floatval($wItem['dimensions']['z']) : floatval($enRow['weapon_size_z'] ?? 1.0)));

                            return array_merge([
                                'id' => 'ew_' . ($enRow['enemy_id'] ?? 'w') . '_' . $wIdx,
                                'name' => $enRow['weapon_name'] ?? 'Plasma Pulse',
                                'type' => 'beam',
                                'mount' => 'dual_wingtip',
                                'model_url' => '',
                                'model_type' => '',
                                'fire_point_x' => 0.0,
                                'fire_point_y' => -0.15,
                                'fire_point_z' => 1.5,
                                'scale' => $wScale,
                                'scale_x' => $wScaleX,
                                'scale_y' => $wScaleY,
                                'scale_z' => $wScaleZ,
                                'size_x' => $wSizeX,
                                'size_y' => $wSizeY,
                                'size_z' => $wSizeZ,
                                'dimensions' => ['x' => $wSizeX, 'y' => $wSizeY, 'z' => $wSizeZ],
                                'fire_rate_times_per_sec' => $enRow['fire_rate_times_per_sec'],
                                'fire_interval_ms' => $enRow['fire_rate_ms'],
                                'fire_rate_seconds' => $frSec,
                                'damage' => intval($enRow['weapon_damage'] ?? 5),
                                'speed' => intval($enRow['weapon_speed'] ?? 450),
                                'color' => $enRow['weapon_color'] ?? '#ff0055',
                                'is_enabled' => 1
                            ], $wItem, [
                                'scale' => $wScale,
                                'scale_x' => $wScaleX,
                                'scale_y' => $wScaleY,
                                'scale_z' => $wScaleZ,
                                'size_x' => $wSizeX,
                                'size_y' => $wSizeY,
                                'size_z' => $wSizeZ,
                                'dimensions' => ['x' => $wSizeX, 'y' => $wSizeY, 'z' => $wSizeZ]
                            ]);
                        }, $decoded, array_keys($decoded));
                    }
                }
                if (empty($wpnsList)) {
                    $pScale = floatval($enRow['weapon_scale'] ?? 1.0);
                    $pScaleX = floatval($enRow['weapon_scale_x'] ?? 1.0);
                    $pScaleY = floatval($enRow['weapon_scale_y'] ?? 1.0);
                    $pScaleZ = floatval($enRow['weapon_scale_z'] ?? 1.0);
                    $pSizeX = floatval($enRow['weapon_size_x'] ?? 1.0);
                    $pSizeY = floatval($enRow['weapon_size_y'] ?? 1.0);
                    $pSizeZ = floatval($enRow['weapon_size_z'] ?? 1.0);

                    $wpnsList = [
                        [
                            'id' => 'ew_' . ($enRow['enemy_id'] ?? 'primary'),
                            'name' => $enRow['weapon_name'] ?? 'Plasma Pulse',
                            'type' => (stripos($enRow['weapon_name'] ?? '', 'missile') !== false || stripos($enRow['weapon_name'] ?? '', 'torpedo') !== false) ? 'missile' : 'beam',
                            'mount' => 'dual_wingtip',
                            'model_url' => '',
                            'model_type' => '',
                            'fire_point_x' => 0.0,
                            'fire_point_y' => -0.15,
                            'fire_point_z' => 1.5,
                            'scale' => $pScale,
                            'scale_x' => $pScaleX,
                            'scale_y' => $pScaleY,
                            'scale_z' => $pScaleZ,
                            'size_x' => $pSizeX,
                            'size_y' => $pSizeY,
                            'size_z' => $pSizeZ,
                            'dimensions' => ['x' => $pSizeX, 'y' => $pSizeY, 'z' => $pSizeZ],
                            'fire_rate_times_per_sec' => $enRow['fire_rate_times_per_sec'],
                            'fire_interval_ms' => $enRow['fire_rate_ms'],
                            'fire_rate_seconds' => $frSec,
                            'damage' => intval($enRow['weapon_damage'] ?? 5),
                            'speed' => intval($enRow['weapon_speed'] ?? 450),
                            'color' => $enRow['weapon_color'] ?? '#ff0055',
                            'is_enabled' => 1
                        ]
                    ];
                }
                $enRow['weapons'] = $wpnsList;
                $enRow['weapons_json'] = json_encode($wpnsList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            }
            unset($enRow);

            sendJsonResponse(true, 'Game enemies loaded successfully', [
                'stage_level' => $stageFilter,
                'device_type' => $deviceFilter,
                'enemies' => $enemies,
                'total'   => count($enemies)
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to fetch game enemies: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'save_game_enemy') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

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
        
        // Multi-Weapon & Cadence Processing: Support times per second, milliseconds, and multiple weapons
        $weaponsJsonRaw = $input['weapons_json'] ?? '';
        $weaponsList = [];
        if (!empty($weaponsJsonRaw)) {
            $parsedWpns = is_string($weaponsJsonRaw) ? json_decode($weaponsJsonRaw, true) : $weaponsJsonRaw;
            if (is_array($parsedWpns) && count($parsedWpns) > 0) {
                $weaponsList = $parsedWpns;
            }
        }

        $fireRateMs = isset($input['fire_rate_ms']) ? intval($input['fire_rate_ms']) : 0;
        $fireRateSec = isset($input['fire_rate_seconds']) ? floatval($input['fire_rate_seconds']) : 0.0;
        $fireRateTimesPerSec = isset($input['fire_rate_times_per_sec']) ? floatval($input['fire_rate_times_per_sec']) : 0.0;

        if ($fireRateMs <= 0 && $fireRateSec > 0) {
            $fireRateMs = intval(round($fireRateSec * 1000));
        } elseif ($fireRateMs <= 0 && $fireRateTimesPerSec > 0) {
            $fireRateMs = intval(round(1000.0 / $fireRateTimesPerSec));
        }
        if ($fireRateMs <= 0) $fireRateMs = 2000;
        $fireRateSec = round($fireRateMs / 1000.0, 3);

        if (empty($weaponsList)) {
            $weaponsList = [
                [
                    'id' => 'ew_0',
                    'name' => $weaponName,
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
                $wName = trim($w['name'] ?? ('Weapon ' . ($idx + 1)));
                $wType = trim($w['type'] ?? 'beam');
                $wMount = trim($w['mount'] ?? 'dual_wingtip');
                $wMs = isset($w['fire_interval_ms']) ? intval($w['fire_interval_ms']) : (isset($w['fire_rate_seconds']) ? intval(round(floatval($w['fire_rate_seconds']) * 1000)) : 2000);
                if ($wMs <= 0 && isset($w['fire_rate_times_per_sec']) && floatval($w['fire_rate_times_per_sec']) > 0) {
                    $wMs = intval(round(1000.0 / floatval($w['fire_rate_times_per_sec'])));
                }
                if ($wMs <= 0) $wMs = 2000;
                $wSec = round($wMs / 1000.0, 3);
                $wTimes = round(1000.0 / max(20, $wMs), 3);
                $wDmg = isset($w['damage']) ? max(1, intval($w['damage'])) : 5;
                $wSpd = isset($w['speed']) ? max(50, intval($w['speed'])) : 450;
                $wCol = trim($w['color'] ?? '#ff0055');
                $wEn = (isset($w['is_enabled']) && ($w['is_enabled'] === 0 || $w['is_enabled'] === false || $w['is_enabled'] === '0')) ? 0 : 1;

                $wModelUrl = sanitizeWormholeAssetUrl(trim($w['model_url'] ?? ''));
                $wModelType = trim($w['model_type'] ?? '');
                $wScale = isset($w['scale']) ? max(0.01, min(100.0, floatval($w['scale']))) : 1.0;
                $wScaleX = isset($w['scale_x']) ? max(0.01, min(100.0, floatval($w['scale_x']))) : (isset($w['scaleX']) ? floatval($w['scaleX']) : 1.0);
                $wScaleY = isset($w['scale_y']) ? max(0.01, min(100.0, floatval($w['scale_y']))) : (isset($w['scaleY']) ? floatval($w['scaleY']) : 1.0);
                $wScaleZ = isset($w['scale_z']) ? max(0.01, min(100.0, floatval($w['scale_z']))) : (isset($w['scaleZ']) ? floatval($w['scaleZ']) : 1.0);
                $wSizeX = isset($w['size_x']) ? max(0.01, min(100.0, floatval($w['size_x']))) : (isset($w['sizeX']) ? floatval($w['sizeX']) : ((isset($w['dimensions']) && isset($w['dimensions']['x'])) ? floatval($w['dimensions']['x']) : 1.0));
                $wSizeY = isset($w['size_y']) ? max(0.01, min(100.0, floatval($w['size_y']))) : (isset($w['sizeY']) ? floatval($w['sizeY']) : ((isset($w['dimensions']) && isset($w['dimensions']['y'])) ? floatval($w['dimensions']['y']) : 1.0));
                $wSizeZ = isset($w['size_z']) ? max(0.01, min(100.0, floatval($w['size_z']))) : (isset($w['sizeZ']) ? floatval($w['sizeZ']) : ((isset($w['dimensions']) && isset($w['dimensions']['z'])) ? floatval($w['dimensions']['z']) : 1.0));
                $wFireX = isset($w['fire_point_x']) ? floatval($w['fire_point_x']) : 0.0;
                $wFireY = isset($w['fire_point_y']) ? floatval($w['fire_point_y']) : -0.15;
                $wFireZ = isset($w['fire_point_z']) ? floatval($w['fire_point_z']) : 1.5;
                $wSpecialFx = trim($w['special_fx'] ?? ($input['weapon_special_fx'] ?? 'cockpit_cracks_red_edges'));
                $wSpecialFxFile = trim($w['special_fx_file'] ?? ($input['weapon_special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png'));
                $wSpecialFxType = trim($w['special_fx_type'] ?? ($input['weapon_special_fx_type'] ?? 'overlay'));

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
                    'special_fx' => $wSpecialFx,
                    'special_fx_file' => $wSpecialFxFile,
                    'special_fx_type' => $wSpecialFxType,
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
            sendJsonResponse(false, 'Enemy identifier code and name are required', [], 400);
        }
        if ($hitsToDestroy <= 0) {
            sendJsonResponse(false, 'Hits to destroy must be at least 1', [], 400);
        }
        if ($stageLevel <= 0) {
            sendJsonResponse(false, 'Stage Level must be a positive integer', [], 400);
        }

        try {
            $pdo = getDbConnection();

            $primaryW = !empty($weaponsList[0]) ? $weaponsList[0] : null;
            $pWScale = $primaryW ? floatval($primaryW['scale'] ?? 1.0) : 1.0;
            $pWScaleX = $primaryW ? floatval($primaryW['scale_x'] ?? 1.0) : 1.0;
            $pWScaleY = $primaryW ? floatval($primaryW['scale_y'] ?? 1.0) : 1.0;
            $pWScaleZ = $primaryW ? floatval($primaryW['scale_z'] ?? 1.0) : 1.0;
            $pWSizeX = $primaryW ? floatval($primaryW['size_x'] ?? 1.0) : 1.0;
            $pWSizeY = $primaryW ? floatval($primaryW['size_y'] ?? 1.0) : 1.0;
            $pWSizeZ = $primaryW ? floatval($primaryW['size_z'] ?? 1.0) : 1.0;
            $pWSpecialFx = $primaryW ? trim($primaryW['special_fx'] ?? ($input['weapon_special_fx'] ?? 'cockpit_cracks_red_edges')) : 'cockpit_cracks_red_edges';
            $pWSpecialFxFile = $primaryW ? trim($primaryW['special_fx_file'] ?? ($input['weapon_special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png')) : 'desktop/warp_origin_images/cockpit_cracks_overlay.png';
            $pWSpecialFxType = $primaryW ? trim($primaryW['special_fx_type'] ?? ($input['weapon_special_fx_type'] ?? 'overlay')) : 'overlay';

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
                        `weapon_scale` = :w_scale,
                        `weapon_scale_x` = :w_scale_x,
                        `weapon_scale_y` = :w_scale_y,
                        `weapon_scale_z` = :w_scale_z,
                        `weapon_size_x` = :w_size_x,
                        `weapon_size_y` = :w_size_y,
                        `weapon_size_z` = :w_size_z,
                        `weapon_special_fx` = :w_special_fx,
                        `weapon_special_fx_file` = :w_special_fx_file,
                        `weapon_special_fx_type` = :w_special_fx_type,
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
                    ':w_scale'        => $pWScale,
                    ':w_scale_x'      => $pWScaleX,
                    ':w_scale_y'      => $pWScaleY,
                    ':w_scale_z'      => $pWScaleZ,
                    ':w_size_x'       => $pWSizeX,
                    ':w_size_y'       => $pWSizeY,
                    ':w_size_z'       => $pWSizeZ,
                    ':w_special_fx'   => $pWSpecialFx,
                    ':w_special_fx_file' => $pWSpecialFxFile,
                    ':w_special_fx_type' => $pWSpecialFxType,
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

                $provResults = provisionAllWormholeStageFilesAndAudio();

                sendJsonResponse(true, "Enemy '{$enemyName}' [{$deviceType}] updated successfully and stage JS files re-synchronized", [
                    'id' => $id,
                    'device_type' => $deviceType,
                    'provision_results' => $provResults
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_enemies`
                    (`enemy_id`, `device_type`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `weapons_json`, `weapon_scale`, `weapon_scale_x`, `weapon_scale_y`, `weapon_scale_z`, `weapon_size_x`, `weapon_size_y`, `weapon_size_z`, `weapon_special_fx`, `weapon_special_fx_file`, `weapon_special_fx_type`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `destruction_particle_type`, `destruction_particle_url`, `destruction_particle_count`, `destruction_particle_color`, `destruction_particle_scale`, `fire_rate_seconds`, `fire_rate_ms`, `score_value`, `threat_level`, `description`, `is_enabled`)
                    VALUES
                    (:enemy_id, :device_type, :enemy_name, :enemy_class, :icon, :model_3d, :model_url, :scale, :length, :height, :depth, :circumference, :color_hex, :stage_level, :hits, :pierce, :armor, :shield, :shield_cap, :speed, :damage, :weapon_name, :weapon_damage, :weapon_speed, :weapon_color, :weapons_json, :w_scale, :w_scale_x, :w_scale_y, :w_scale_z, :w_size_x, :w_size_y, :w_size_z, :w_special_fx, :w_special_fx_file, :w_special_fx_type, :q_eff_prim, :q_eff_sec, :q_eff_col, :q_eff_int, :q_eff_spd, :dest_type, :dest_url, :dest_count, :dest_color, :dest_scale, :fire_rate, :fire_rate_ms, :score, :threat, :desc, :is_enabled)
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
                        `weapon_scale` = VALUES(`weapon_scale`),
                        `weapon_scale_x` = VALUES(`weapon_scale_x`),
                        `weapon_scale_y` = VALUES(`weapon_scale_y`),
                        `weapon_scale_z` = VALUES(`weapon_scale_z`),
                        `weapon_size_x` = VALUES(`weapon_size_x`),
                        `weapon_size_y` = VALUES(`weapon_size_y`),
                        `weapon_size_z` = VALUES(`weapon_size_z`),
                        `weapon_special_fx` = VALUES(`weapon_special_fx`),
                        `weapon_special_fx_file` = VALUES(`weapon_special_fx_file`),
                        `weapon_special_fx_type` = VALUES(`weapon_special_fx_type`),
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
                    ':w_scale'        => $pWScale,
                    ':w_scale_x'      => $pWScaleX,
                    ':w_scale_y'      => $pWScaleY,
                    ':w_scale_z'      => $pWScaleZ,
                    ':w_size_x'       => $pWSizeX,
                    ':w_size_y'       => $pWSizeY,
                    ':w_size_z'       => $pWSizeZ,
                    ':w_special_fx'   => $pWSpecialFx,
                    ':w_special_fx_file' => $pWSpecialFxFile,
                    ':w_special_fx_type' => $pWSpecialFxType,
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

                $provResults = provisionAllWormholeStageFilesAndAudio();

                sendJsonResponse(true, "Enemy '{$enemyName}' [{$deviceType}] registered successfully and stage JS files synchronized", [
                    'id' => $newId,
                    'device_type' => $deviceType,
                    'provision_results' => $provResults
                ]);
            }
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to save game enemy: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'clone_game_enemy') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

        $sourceId = isset($input['source_id']) ? intval($input['source_id']) : 0;
        $sourceEnemyInput = isset($input['source_enemy']) && is_array($input['source_enemy']) ? $input['source_enemy'] : null;

        if ($sourceId <= 0 && empty($sourceEnemyInput)) {
            sendJsonResponse(false, 'Invalid source enemy for cloning', [], 400);
        }

        try {
            $pdo = getDbConnection();
            $source = null;
            if ($sourceId > 0) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `id` = :id LIMIT 1");
                $stmt->execute(['id' => $sourceId]);
                $source = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            if (!$source && $sourceEnemyInput) {
                $source = [
                    'enemy_id'             => trim($sourceEnemyInput['enemy_id'] ?? 'cloned_enemy'),
                    'device_type'          => trim($sourceEnemyInput['device_type'] ?? 'desktop'),
                    'enemy_name'           => trim($sourceEnemyInput['enemy_name'] ?? 'Cloned Enemy'),
                    'enemy_class'          => trim($sourceEnemyInput['enemy_class'] ?? 'Scout Drone'),
                    'icon'                 => trim($sourceEnemyInput['icon'] ?? '🛸'),
                    'model_3d_type'        => trim($sourceEnemyInput['model_3d_type'] ?? 'scout_drone'),
                    'model_3d_url'         => trim($sourceEnemyInput['model_3d_url'] ?? ''),
                    'scale'                => floatval($sourceEnemyInput['scale'] ?? 1.0),
                    'length'               => floatval($sourceEnemyInput['length'] ?? 3.0),
                    'height'               => floatval($sourceEnemyInput['height'] ?? 1.5),
                    'depth'                => floatval($sourceEnemyInput['depth'] ?? 3.0),
                    'circumference'        => floatval($sourceEnemyInput['circumference'] ?? 6.0),
                    'color_hex'            => trim($sourceEnemyInput['color_hex'] ?? '#ef476f'),
                    'stage_level'          => intval($sourceEnemyInput['stage_level'] ?? 1),
                    'hits_to_destroy'      => intval($sourceEnemyInput['hits_to_destroy'] ?? 2),
                    'piercing_weapon_id'   => trim($sourceEnemyInput['piercing_weapon_id'] ?? 'any'),
                    'armor_strength'       => intval($sourceEnemyInput['armor_strength'] ?? 10),
                    'has_force_field'      => intval($sourceEnemyInput['has_force_field'] ?? 0),
                    'shield_capacity_hits' => intval($sourceEnemyInput['shield_capacity_hits'] ?? 0),
                    'movement_speed'       => intval($sourceEnemyInput['movement_speed'] ?? 250),
                    'attack_damage'        => intval($sourceEnemyInput['attack_damage'] ?? 5),
                    'weapon_name'          => trim($sourceEnemyInput['weapon_name'] ?? 'Plasma Pulse'),
                    'weapon_damage'        => intval($sourceEnemyInput['weapon_damage'] ?? 5),
                    'weapon_speed'         => intval($sourceEnemyInput['weapon_speed'] ?? 450),
                    'weapon_color'         => trim($sourceEnemyInput['weapon_color'] ?? '#ff2255'),
                    'quick_effect_primary'   => trim($sourceEnemyInput['quick_effect_primary'] ?? 'none'),
                    'quick_effect_secondary' => trim($sourceEnemyInput['quick_effect_secondary'] ?? 'none'),
                    'quick_effect_color'     => trim($sourceEnemyInput['quick_effect_color'] ?? '#00f0ff'),
                    'quick_effect_intensity' => floatval($sourceEnemyInput['quick_effect_intensity'] ?? 1.00),
                    'quick_effect_speed'     => floatval($sourceEnemyInput['quick_effect_speed'] ?? 1.00),
                    'fire_rate_seconds'    => floatval($sourceEnemyInput['fire_rate_seconds'] ?? 2.0),
                    'score_value'          => intval($sourceEnemyInput['score_value'] ?? 100),
                    'threat_level'         => trim($sourceEnemyInput['threat_level'] ?? 'Low'),
                    'description'          => trim($sourceEnemyInput['description'] ?? ''),
                    'is_enabled'           => intval($sourceEnemyInput['is_enabled'] ?? 1)
                ];
            }

            if (!$source) {
                sendJsonResponse(false, 'Source enemy could not be located for cloning', [], 404);
            }

            // Generate unique enemy_id and unique enemy_name with device listing type instead of copy
            $baseEnemyId = $source['enemy_id'];
            $baseEnemyName = $source['enemy_name'];
            $deviceType = strtolower($source['device_type'] ?? 'desktop');
            $stageLevel = intval($source['stage_level'] ?? 1);

            $deviceTypeLabels = [
                'desktop' => 'Desktop',
                'mobile'  => 'Mobile',
                'vr'      => 'VR Headset',
                'arcore'  => 'ARCore',
                'all'     => 'Universal'
            ];
            $devListingType = $deviceTypeLabels[$deviceType] ?? ucfirst($deviceType);

            // Strip any existing trailing (Copy) or device label from base name
            $cleanBaseName = preg_replace('/\s*\((?:Copy|\b(?:Desktop|Mobile|VR Headset|VR|ARCore|Universal)\b)(?:\s+\d+)?\)\s*$/i', '', $baseEnemyName);
            if (empty($cleanBaseName)) {
                $cleanBaseName = $baseEnemyName;
            }

            // Strip any existing trailing _copy or _<device> from base code
            $cleanBaseId = preg_replace('/_(?:copy|desktop|mobile|vr|arcore|all)(?:_\d+)?$/i', '', $baseEnemyId);
            if (empty($cleanBaseId)) {
                $cleanBaseId = $baseEnemyId;
            }

            $counter = 1;
            do {
                $idSuffix = ($counter === 1) ? "_{$deviceType}" : "_{$deviceType}_{$counter}";
                $newEnemyId = $cleanBaseId . $idSuffix;
                if (strlen($newEnemyId) > 64) {
                    $newEnemyId = substr($cleanBaseId, 0, 64 - strlen($idSuffix)) . $idSuffix;
                }

                $chk = $pdo->prepare("SELECT COUNT(*) FROM `wormhole_game_enemies` WHERE `enemy_id` = :enemy_id AND `device_type` = :device_type AND `stage_level` = :stage_level");
                $chk->execute([
                    ':enemy_id' => $newEnemyId,
                    ':device_type' => $deviceType,
                    ':stage_level' => $stageLevel
                ]);
                $exists = (int)$chk->fetchColumn() > 0;
                if ($exists) {
                    $counter++;
                }
            } while ($exists && $counter < 100);

            $nameSuffix = ($counter === 1) ? " ({$devListingType})" : " ({$devListingType} {$counter})";
            $newEnemyName = $cleanBaseName . $nameSuffix;
            if (strlen($newEnemyName) > 100) {
                $newEnemyName = substr($cleanBaseName, 0, 100 - strlen($nameSuffix)) . $nameSuffix;
            }

            $insertStmt = $pdo->prepare("
                INSERT INTO `wormhole_game_enemies`
                (`enemy_id`, `device_type`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `weapons_json`, `weapon_scale`, `weapon_scale_x`, `weapon_scale_y`, `weapon_scale_z`, `weapon_size_x`, `weapon_size_y`, `weapon_size_z`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `destruction_particle_type`, `destruction_particle_url`, `destruction_particle_count`, `destruction_particle_color`, `destruction_particle_scale`, `fire_rate_seconds`, `fire_rate_ms`, `score_value`, `threat_level`, `description`, `is_enabled`)
                VALUES
                (:enemy_id, :device_type, :enemy_name, :enemy_class, :icon, :model_3d, :model_url, :scale, :length, :height, :depth, :circumference, :color_hex, :stage_level, :hits, :pierce, :armor, :shield, :shield_cap, :speed, :damage, :weapon_name, :weapon_damage, :weapon_speed, :weapon_color, :weapons_json, :w_scale, :w_scale_x, :w_scale_y, :w_scale_z, :w_size_x, :w_size_y, :w_size_z, :q_eff_prim, :q_eff_sec, :q_eff_col, :q_eff_int, :q_eff_spd, :dest_type, :dest_url, :dest_count, :dest_color, :dest_scale, :fire_rate, :fire_rate_ms, :score, :threat, :desc, :is_enabled)
            ");
            $insertStmt->execute([
                ':enemy_id'       => $newEnemyId,
                ':device_type'    => $deviceType,
                ':enemy_name'     => $newEnemyName,
                ':enemy_class'    => $source['enemy_class'] ?? 'Scout Drone',
                ':icon'           => $source['icon'] ?? '🛸',
                ':model_3d'       => $source['model_3d_type'] ?? 'scout_drone',
                ':model_url'      => $source['model_3d_url'] ?? '',
                ':scale'          => floatval($source['scale'] ?? 1.0),
                ':length'         => floatval($source['length'] ?? 3.0),
                ':height'         => floatval($source['height'] ?? 1.5),
                ':depth'          => floatval($source['depth'] ?? 3.0),
                ':circumference'  => floatval($source['circumference'] ?? 6.0),
                ':color_hex'      => $source['color_hex'] ?? '#ef476f',
                ':stage_level'    => $stageLevel,
                ':hits'           => intval($source['hits_to_destroy'] ?? 2),
                ':pierce'         => $source['piercing_weapon_id'] ?? 'any',
                ':armor'          => intval($source['armor_strength'] ?? 10),
                ':shield'         => intval($source['has_force_field'] ?? 0),
                ':shield_cap'     => intval($source['shield_capacity_hits'] ?? 0),
                ':speed'          => intval($source['movement_speed'] ?? 250),
                ':damage'         => intval($source['attack_damage'] ?? 5),
                ':weapon_name'    => $source['weapon_name'] ?? 'Plasma Pulse',
                ':weapon_damage'  => intval($source['weapon_damage'] ?? 5),
                ':weapon_speed'   => intval($source['weapon_speed'] ?? 450),
                ':weapon_color'   => $source['weapon_color'] ?? '#ff2255',
                ':weapons_json'   => $source['weapons_json'] ?? null,
                ':w_scale'        => floatval($source['weapon_scale'] ?? 1.0),
                ':w_scale_x'      => floatval($source['weapon_scale_x'] ?? 1.0),
                ':w_scale_y'      => floatval($source['weapon_scale_y'] ?? 1.0),
                ':w_scale_z'      => floatval($source['weapon_scale_z'] ?? 1.0),
                ':w_size_x'       => floatval($source['weapon_size_x'] ?? 0.6),
                ':w_size_y'       => floatval($source['weapon_size_y'] ?? 0.6),
                ':w_size_z'       => floatval($source['weapon_size_z'] ?? 2.8),
                ':q_eff_prim'     => $source['quick_effect_primary'] ?? 'none',
                ':q_eff_sec'      => $source['quick_effect_secondary'] ?? 'none',
                ':q_eff_col'      => $source['quick_effect_color'] ?? '#00f0ff',
                ':q_eff_int'      => floatval($source['quick_effect_intensity'] ?? 1.00),
                ':q_eff_spd'      => floatval($source['quick_effect_speed'] ?? 1.00),
                ':dest_type'      => $source['destruction_particle_type'] ?? 'procedural_sparks_explosion',
                ':dest_url'       => $source['destruction_particle_url'] ?? '',
                ':dest_count'     => intval($source['destruction_particle_count'] ?? 40),
                ':dest_color'     => $source['destruction_particle_color'] ?? ($source['color_hex'] ?? '#ff0055'),
                ':dest_scale'     => floatval($source['destruction_particle_scale'] ?? 1.00),
                ':fire_rate'      => floatval($source['fire_rate_seconds'] ?? 2.0),
                ':fire_rate_ms'   => intval($source['fire_rate_ms'] ?? 2000),
                ':score'          => intval($source['score_value'] ?? 100),
                ':threat'         => $source['threat_level'] ?? 'Low',
                ':desc'           => $source['description'] ?? '',
                ':is_enabled'     => intval($source['is_enabled'] ?? 1)
            ]);

            $newId = (int)$pdo->lastInsertId();

            $provResults = provisionAllWormholeStageFilesAndAudio();

            sendJsonResponse(true, "Enemy threat '{$newEnemyName}' cloned successfully", [
                'id' => $newId,
                'enemy_id' => $newEnemyId,
                'enemy_name' => $newEnemyName,
                'provision_results' => $provResults
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to clone enemy: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'delete_game_enemy') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        if ($id <= 0) {
            sendJsonResponse(false, 'Invalid enemy ID', [], 400);
        }

        try {
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("DELETE FROM `wormhole_game_enemies` WHERE `id` = :id");
            $stmt->execute(['id' => $id]);

            // Re-sync stage files after deletion
            $provResults = provisionAllWormholeStageFilesAndAudio();

            sendJsonResponse(true, 'Enemy deleted successfully and stage JS files synchronized', [
                'id' => $id,
                'provision_results' => $provResults
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete enemy: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'toggle_game_enemy_field') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $field = trim($input['field'] ?? 'has_force_field');
        if ($id <= 0) {
            sendJsonResponse(false, 'Invalid enemy ID', [], 400);
        }

        try {
            $pdo = getDbConnection();
            if ($field === 'has_force_field') {
                $stmt = $pdo->prepare("UPDATE `wormhole_game_enemies` SET `has_force_field` = IF(`has_force_field` = 1, 0, 1), `updated_at` = NOW() WHERE `id` = :id");
            } else {
                $stmt = $pdo->prepare("UPDATE `wormhole_game_enemies` SET `is_enabled` = IF(`is_enabled` = 1, 0, 1), `updated_at` = NOW() WHERE `id` = :id");
            }
            $stmt->execute(['id' => $id]);

            $provResults = provisionAllWormholeStageFilesAndAudio();

            sendJsonResponse(true, 'Enemy field toggled successfully and stage JS files synchronized', [
                'id' => $id,
                'field' => $field,
                'provision_results' => $provResults
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to toggle enemy field: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'save_enemy_weapon_dimensions') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $enemyId = trim($input['enemy_id'] ?? '');
        $deviceType = trim($input['device_type'] ?? '');

        if ($id <= 0 && empty($enemyId)) {
            sendJsonResponse(false, 'Missing enemy identifier (id or enemy_id required)', [], 400);
        }

        try {
            $pdo = getDbConnection();

            // Locate target row(s)
            if ($id > 0) {
                $checkStmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `id` = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
            } elseif (!empty($deviceType)) {
                $checkStmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `enemy_id` = :enemy_id AND `device_type` = :device_type LIMIT 1");
                $checkStmt->execute([':enemy_id' => $enemyId, ':device_type' => $deviceType]);
            } else {
                $checkStmt = $pdo->prepare("SELECT * FROM `wormhole_game_enemies` WHERE `enemy_id` = :enemy_id LIMIT 1");
                $checkStmt->execute([':enemy_id' => $enemyId]);
            }
            $targetEnemy = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$targetEnemy) {
                sendJsonResponse(false, 'Target enemy not found', [], 404);
            }

            $targetId = (int)$targetEnemy['id'];

            $weaponScale = isset($input['weapon_scale']) ? floatval($input['weapon_scale']) : (isset($input['scale']) ? floatval($input['scale']) : floatval($targetEnemy['weapon_scale'] ?? 1.0));
            $weaponScaleX = isset($input['weapon_scale_x']) ? floatval($input['weapon_scale_x']) : (isset($input['scale_x']) ? floatval($input['scale_x']) : floatval($targetEnemy['weapon_scale_x'] ?? 1.0));
            $weaponScaleY = isset($input['weapon_scale_y']) ? floatval($input['weapon_scale_y']) : (isset($input['scale_y']) ? floatval($input['scale_y']) : floatval($targetEnemy['weapon_scale_y'] ?? 1.0));
            $weaponScaleZ = isset($input['weapon_scale_z']) ? floatval($input['weapon_scale_z']) : (isset($input['scale_z']) ? floatval($input['scale_z']) : floatval($targetEnemy['weapon_scale_z'] ?? 1.0));

            $weaponSizeX = isset($input['weapon_size_x']) ? floatval($input['weapon_size_x']) : (isset($input['size_x']) ? floatval($input['size_x']) : floatval($targetEnemy['weapon_size_x'] ?? 0.6));
            $weaponSizeY = isset($input['weapon_size_y']) ? floatval($input['weapon_size_y']) : (isset($input['size_y']) ? floatval($input['size_y']) : floatval($targetEnemy['weapon_size_y'] ?? 0.6));
            $weaponSizeZ = isset($input['weapon_size_z']) ? floatval($input['weapon_size_z']) : (isset($input['size_z']) ? floatval($input['size_z']) : floatval($targetEnemy['weapon_size_z'] ?? 2.8));

            $weaponSpecialFx = isset($input['weapon_special_fx']) ? trim($input['weapon_special_fx']) : trim($targetEnemy['weapon_special_fx'] ?? 'cockpit_cracks_red_edges');
            $weaponSpecialFxFile = isset($input['weapon_special_fx_file']) ? trim($input['weapon_special_fx_file']) : trim($targetEnemy['weapon_special_fx_file'] ?? 'desktop/warp_origin_images/cockpit_cracks_overlay.png');
            $weaponSpecialFxType = isset($input['weapon_special_fx_type']) ? trim($input['weapon_special_fx_type']) : trim($targetEnemy['weapon_special_fx_type'] ?? 'overlay');

            // Also check weapons_json and sync the primary/active weapon dimensions inside it
            $existingWeaponsJson = $targetEnemy['weapons_json'] ?? '';
            $weaponsArr = [];
            if (!empty($existingWeaponsJson)) {
                $parsed = is_string($existingWeaponsJson) ? json_decode($existingWeaponsJson, true) : $existingWeaponsJson;
                if (is_array($parsed)) {
                    $weaponsArr = $parsed;
                }
            }
            if (!empty($weaponsArr)) {
                foreach ($weaponsArr as &$wRef) {
                    if (is_array($wRef)) {
                        $wRef['scale'] = $weaponScale;
                        $wRef['scale_x'] = $weaponScaleX;
                        $wRef['scale_y'] = $weaponScaleY;
                        $wRef['scale_z'] = $weaponScaleZ;
                        $wRef['size_x'] = $weaponSizeX;
                        $wRef['size_y'] = $weaponSizeY;
                        $wRef['size_z'] = $weaponSizeZ;
                        $wRef['special_fx'] = $weaponSpecialFx;
                        $wRef['special_fx_file'] = $weaponSpecialFxFile;
                        $wRef['special_fx_type'] = $weaponSpecialFxType;
                    }
                }
                unset($wRef);
            }
            $updatedWeaponsJson = !empty($weaponsArr) ? json_encode($weaponsArr, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : $targetEnemy['weapons_json'];

            $updateStmt = $pdo->prepare("
                UPDATE `wormhole_game_enemies`
                SET `weapon_scale` = :w_scale,
                    `weapon_scale_x` = :w_scale_x,
                    `weapon_scale_y` = :w_scale_y,
                    `weapon_scale_z` = :w_scale_z,
                    `weapon_size_x` = :w_size_x,
                    `weapon_size_y` = :w_size_y,
                    `weapon_size_z` = :w_size_z,
                    `weapon_special_fx` = :w_special_fx,
                    `weapon_special_fx_file` = :w_special_fx_file,
                    `weapon_special_fx_type` = :w_special_fx_type,
                    `weapons_json` = :weapons_json,
                    `updated_at` = NOW()
                WHERE `id` = :id
            ");
            $updateStmt->execute([
                ':w_scale'      => $weaponScale,
                ':w_scale_x'    => $weaponScaleX,
                ':w_scale_y'    => $weaponScaleY,
                ':w_scale_z'    => $weaponScaleZ,
                ':w_size_x'     => $weaponSizeX,
                ':w_size_y'     => $weaponSizeY,
                ':w_size_z'     => $weaponSizeZ,
                ':w_special_fx' => $weaponSpecialFx,
                ':w_special_fx_file' => $weaponSpecialFxFile,
                ':w_special_fx_type' => $weaponSpecialFxType,
                ':weapons_json' => $updatedWeaponsJson,
                ':id'           => $targetId
            ]);

            // Synchronize all stage JS files across frontend and backend
            $provResults = provisionAllWormholeStageFilesAndAudio();

            sendJsonResponse(true, "Enemy weapon dimensions updated successfully and stage JS files synchronized", [
                'id' => $targetId,
                'enemy_id' => $targetEnemy['enemy_id'],
                'weapon_scale' => $weaponScale,
                'weapon_scale_x' => $weaponScaleX,
                'weapon_scale_y' => $weaponScaleY,
                'weapon_scale_z' => $weaponScaleZ,
                'weapon_size_x' => $weaponSizeX,
                'weapon_size_y' => $weaponSizeY,
                'weapon_size_z' => $weaponSizeZ,
                'provision_results' => $provResults
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to update enemy weapon dimensions: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'seed_game_enemies') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager enemies requires administrative credentials');

        try {
            $pdo = getDbConnection();

            // Default enemies with separated calibrated values for Desktop, Mobile, VR, and ARCore
            $defaultEnemies = [
                // DESKTOP: Fast pace, standard keyboard & mouse aiming
                ['void_recon_drone', 'desktop', 'Void Recon Drone (Desktop)', 'Scout Drone', '🛸', 'scout_drone', '', 1.00, 2.80, 2.80, 2.80, 8.80, '#00f0ff', 1, 2, 'any', 10, 0, 0, 320, 5, 'Plasma Pulse', 5, 450, '#00f0ff', 2.50, 100, 'Low', 'Light autonomous scout probe sent to map entry corridor geometry. Vulnerable to all directed weapons.'],
                ['phase_interceptor', 'desktop', 'Phase Interceptor (Desktop)', 'Fast Interceptor', '🚀', 'interceptor', '', 1.00, 4.20, 1.30, 3.40, 5.00, '#38bdf8', 1, 4, 'red_laser', 25, 1, 2, 420, 10, 'Dual Ion Cannon', 10, 550, '#38bdf8', 1.80, 250, 'Medium', 'High-agility corridor skirmisher equipped with a polarized light shield. Armor requires Neon Red Laser piercing focus.'],
                ['tachyon_cruiser', 'desktop', 'Horizon Tachyon Cruiser (Desktop)', 'Heavy Cruiser', '🛰️', 'cruiser', '', 1.25, 3.50, 2.50, 5.50, 10.50, '#ffd166', 2, 8, 'tachyon_lance', 50, 1, 4, 200, 20, 'Tachyon Beam', 20, 600, '#ffd166', 3.00, 500, 'High', 'Reinforced hull traversing relativistic space. Employs reinforced particle shields pierced by Tachyon Lance.'],
                ['void_guardian', 'desktop', 'Singularity Void Guardian (Desktop)', 'Guardian Frigate', '👾', 'singularity_probe', '', 1.20, 3.80, 3.80, 3.80, 11.94, '#a855f7', 3, 15, 'plasma_torpedo', 70, 1, 6, 150, 35, 'Void Disruptor', 35, 400, '#a855f7', 2.20, 1000, 'High', 'Ancient anomaly automaton defending the singularity core. Dense armor matrix broken by Quantum Plasma Torpedoes.'],
                ['quantum_dreadnought', 'desktop', 'Quantum Omega Dreadnought (Desktop)', 'Boss Dreadnought', '💀', 'dreadnought', '', 1.60, 7.00, 3.20, 6.00, 15.00, '#ef476f', 4, 35, 'quantum_phaser', 90, 1, 15, 90, 60, 'Quantum Annihilator', 60, 650, '#ef476f', 1.20, 5000, 'Extreme', 'Colossal multi-phase flagship commanding deep realm forces. Massive energy shields and impervious nanite armor.'],

                // MOBILE: Tuned for touchscreen joysticks, slightly lower speed and accessible hit boxes
                ['void_recon_drone', 'mobile', 'Void Recon Drone (Mobile)', 'Scout Drone', '🛸', 'scout_drone', '', 1.10, 3.00, 3.00, 3.00, 9.40, '#00f0ff', 1, 2, 'any', 8, 0, 0, 240, 4, 'Plasma Pulse', 4, 380, '#00f0ff', 2.80, 100, 'Low', 'Mobile-calibrated scout probe with accessible speed for touch tracking.'],
                ['phase_interceptor', 'mobile', 'Phase Interceptor (Mobile)', 'Fast Interceptor', '🚀', 'interceptor', '', 1.05, 4.40, 1.40, 3.60, 5.20, '#38bdf8', 1, 3, 'red_laser', 20, 1, 1, 320, 8, 'Dual Ion Cannon', 8, 460, '#38bdf8', 2.20, 250, 'Medium', 'Touch-tuned interceptor. Armor requires Neon Red Laser focus.'],
                ['tachyon_cruiser', 'mobile', 'Horizon Tachyon Cruiser (Mobile)', 'Heavy Cruiser', '🛰️', 'cruiser', '', 1.30, 3.80, 2.70, 5.80, 11.20, '#ffd166', 2, 6, 'tachyon_lance', 45, 1, 3, 160, 16, 'Tachyon Beam', 16, 500, '#ffd166', 3.40, 500, 'High', 'Mobile-calibrated battlecruiser with balanced damage for phone screens.'],
                ['void_guardian', 'mobile', 'Singularity Void Guardian (Mobile)', 'Guardian Frigate', '👾', 'singularity_probe', '', 1.25, 4.00, 4.00, 4.00, 12.50, '#a855f7', 3, 12, 'plasma_torpedo', 60, 1, 4, 120, 28, 'Void Disruptor', 28, 350, '#a855f7', 2.60, 1000, 'High', 'Defensive singularity core guardian calibrated for mobile flight.'],
                ['quantum_dreadnought', 'mobile', 'Quantum Omega Dreadnought (Mobile)', 'Boss Dreadnought', '💀', 'dreadnought', '', 1.65, 7.20, 3.40, 6.20, 15.50, '#ef476f', 4, 28, 'quantum_phaser', 80, 1, 10, 75, 45, 'Quantum Annihilator', 45, 520, '#ef476f', 1.50, 5000, 'Extreme', 'Boss flagship with balanced hit points for mobile touchscreen sessions.'],

                // VR: Calibrated for 6-DOF motion controller pointing, full 3D spatial depth
                ['void_recon_drone', 'vr', 'Void Recon Drone (VR Headset)', 'Scout Drone', '🛸', 'scout_drone', '', 1.20, 3.20, 3.20, 3.20, 10.00, '#00f0ff', 1, 2, 'any', 10, 0, 0, 280, 5, 'Plasma Pulse', 5, 420, '#00f0ff', 2.60, 100, 'Low', 'VR 6-DOF calibrated scout probe with high-visibility holographic mesh.'],
                ['phase_interceptor', 'vr', 'Phase Interceptor (VR Headset)', 'Fast Interceptor', '🚀', 'interceptor', '', 1.15, 4.50, 1.40, 3.60, 5.40, '#38bdf8', 1, 4, 'red_laser', 25, 1, 2, 360, 10, 'Dual Ion Cannon', 10, 520, '#38bdf8', 2.00, 250, 'Medium', 'VR spatial fighter with agile bank maneuvers.'],
                ['tachyon_cruiser', 'vr', 'Horizon Tachyon Cruiser (VR Headset)', 'Heavy Cruiser', '🛰️', 'cruiser', '', 1.40, 4.00, 2.80, 6.00, 12.00, '#ffd166', 2, 8, 'tachyon_lance', 50, 1, 4, 180, 20, 'Tachyon Beam', 20, 580, '#ffd166', 3.20, 500, 'High', 'Massive VR cruiser commanding peripheral stereoscopic field of view.'],
                ['void_guardian', 'vr', 'Singularity Void Guardian (VR Headset)', 'Guardian Frigate', '👾', 'singularity_probe', '', 1.35, 4.20, 4.20, 4.20, 13.00, '#a855f7', 3, 14, 'plasma_torpedo', 70, 1, 5, 140, 32, 'Void Disruptor', 32, 380, '#a855f7', 2.40, 1000, 'High', 'Imposing void entity tuned for VR head tracking depth perception.'],
                ['quantum_dreadnought', 'vr', 'Quantum Omega Dreadnought (VR Headset)', 'Boss Dreadnought', '💀', 'dreadnought', '', 1.80, 8.00, 3.80, 7.00, 17.00, '#ef476f', 4, 32, 'quantum_phaser', 90, 1, 12, 85, 55, 'Quantum Annihilator', 55, 600, '#ef476f', 1.30, 5000, 'Extreme', 'Immersive VR flagship dreadnought spanning the entire visual horizon.'],

                // ARCORE: Calibrated for camera passthrough, table/room scale bounds
                ['void_recon_drone', 'arcore', 'Void Recon Drone (ARCore)', 'Scout Drone', '🛸', 'scout_drone', '', 0.85, 2.40, 2.40, 2.40, 7.50, '#00f0ff', 1, 1, 'any', 8, 0, 0, 210, 4, 'Plasma Pulse', 4, 360, '#00f0ff', 3.00, 100, 'Low', 'ARCore room-scale scout drone sized for passthrough camera space.'],
                ['phase_interceptor', 'arcore', 'Phase Interceptor (ARCore)', 'Fast Interceptor', '🚀', 'interceptor', '', 0.90, 3.60, 1.10, 2.90, 4.40, '#38bdf8', 1, 3, 'red_laser', 18, 1, 1, 270, 8, 'Dual Ion Cannon', 8, 430, '#38bdf8', 2.40, 250, 'Medium', 'ARCore passthrough interceptor with smooth local trajectory.'],
                ['tachyon_cruiser', 'arcore', 'Horizon Tachyon Cruiser (ARCore)', 'Heavy Cruiser', '🛰️', 'cruiser', '', 1.05, 3.00, 2.10, 4.60, 9.00, '#ffd166', 2, 6, 'tachyon_lance', 40, 1, 2, 150, 15, 'Tachyon Beam', 15, 480, '#ffd166', 3.60, 500, 'High', 'ARCore room-calibrated battlecruiser hovering over surface anchors.'],
                ['void_guardian', 'arcore', 'Singularity Void Guardian (ARCore)', 'Guardian Frigate', '👾', 'singularity_probe', '', 1.00, 3.20, 3.20, 3.20, 10.00, '#a855f7', 3, 10, 'plasma_torpedo', 55, 1, 3, 110, 25, 'Void Disruptor', 25, 340, '#a855f7', 2.80, 1000, 'High', 'ARCore singularity probe hovering in physical room volume.'],
                ['quantum_dreadnought', 'arcore', 'Quantum Omega Dreadnought (ARCore)', 'Boss Dreadnought', '💀', 'dreadnought', '', 1.30, 5.80, 2.70, 5.00, 12.50, '#ef476f', 4, 22, 'quantum_phaser', 75, 1, 8, 70, 40, 'Quantum Annihilator', 40, 490, '#ef476f', 1.60, 5000, 'Extreme', 'ARCore boss dreadnought sized for mixed-reality passthrough battle.']
            ];

            $ins = $pdo->prepare("
                INSERT INTO `wormhole_game_enemies`
                (`enemy_id`, `device_type`, `enemy_name`, `enemy_class`, `icon`, `model_3d_type`, `model_3d_url`, `scale`, `length`, `height`, `depth`, `circumference`, `color_hex`, `stage_level`, `hits_to_destroy`, `piercing_weapon_id`, `armor_strength`, `has_force_field`, `shield_capacity_hits`, `movement_speed`, `attack_damage`, `weapon_name`, `weapon_damage`, `weapon_speed`, `weapon_color`, `fire_rate_seconds`, `score_value`, `threat_level`, `description`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    `fire_rate_seconds` = VALUES(`fire_rate_seconds`),
                    `score_value` = VALUES(`score_value`),
                    `threat_level` = VALUES(`threat_level`),
                    `description` = VALUES(`description`),
                    `updated_at` = NOW()
            ");

            $count = 0;
            foreach ($defaultEnemies as $e) {
                $ins->execute($e);
                $count++;
            }

            // Immediately regenerate all stage JS files for all devices
            $provResults = provisionAllWormholeStageFilesAndAudio();

            sendJsonResponse(true, "Successfully initialized/reset {$count} device-separated enemies (Desktop, Mobile, VR, ARCore) and updated stage JS files.", [
                'count' => $count,
                'provision_results' => $provResults
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to seed enemies: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 33. WORMHOLE GAME POWER UPS & COMBAT BOOSTS MANAGER
    // =========================================================================
    if ($action === 'get_game_powerups') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager power ups requires administrative credentials');

        try {
            $pdo = getDbConnection();
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `wormhole_game_powerups` (
                  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  `powerup_id` VARCHAR(64) NOT NULL,
                  `powerup_name` VARCHAR(100) NOT NULL,
                  `powerup_type` ENUM('health', 'shield') NOT NULL DEFAULT 'health',
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
                'circumference' => "DECIMAL(5,2) NOT NULL DEFAULT 6.00"
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

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== 'all' && $input['stage_level'] !== '' ? intval($input['stage_level']) : null;
            $deviceFilter = isset($input['device_type']) && $input['device_type'] !== 'all' && $input['device_type'] !== '' ? strtolower(trim($input['device_type'])) : null;
            $typeFilter = isset($input['powerup_type']) && $input['powerup_type'] !== 'all' && $input['powerup_type'] !== '' ? strtolower(trim($input['powerup_type'])) : null;

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

            sendJsonResponse(true, 'Game powerups loaded successfully', [
                'stage_level'  => $stageFilter,
                'device_type'  => $deviceFilter,
                'powerup_type' => $typeFilter,
                'powerups'     => $powerups,
                'total'        => count($powerups)
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to fetch game powerups: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'save_game_powerup') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager power ups requires administrative credentials');

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
        if (!empty($model3dUrl) && strpos($model3dType, 'custom') !== 0) {
            $cleanExt = strtolower(pathinfo(parse_url($model3dUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));
            if ($cleanExt === 'glb') {
                $model3dType = 'custom_glb';
            } elseif ($cleanExt === 'obj') {
                $model3dType = 'custom_obj';
            } elseif ($cleanExt === 'gltf') {
                $model3dType = 'custom_gltf';
            } else {
                $model3dType = 'custom';
            }
        }
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

        if (empty($powerupId) || empty($powerupName)) {
            sendJsonResponse(false, 'Power Up ID (code) and Name are required fields.', [], 400);
        }

        try {
            $pdo = getDbConnection();
            if ($id > 0) {
                $updStmt = $pdo->prepare("
                    UPDATE `wormhole_game_powerups` SET
                      `powerup_id` = :pid,
                      `powerup_name` = :pname,
                      `powerup_type` = :ptype,
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
                    ':pid'       => $powerupId,
                    ':pname'     => $powerupName,
                    ':ptype'     => $powerupType,
                    ':icon'      => $icon,
                    ':mtype'     => $model3dType,
                    ':murl'      => $model3dUrl,
                    ':color'     => $colorHex,
                    ':scale'     => $scale,
                    ':len'       => $length,
                    ':ht'        => $height,
                    ':dp'        => $depth,
                    ':circ'      => $circumference,
                    ':stage'     => $stageLevel,
                    ':device'    => $deviceType,
                    ':events'    => $triggerEvents,
                    ':drop_kill' => $dropOnEnemyKill,
                    ':drop_pct'  => $dropChancePct,
                    ':enemy'     => $enemyId,
                    ':boost'     => $boostPercentage,
                    ':desc'      => $description,
                    ':enabled'   => $isEnabled,
                    ':id'        => $id
                ]);
                sendJsonResponse(true, "Power Up '{$powerupName}' updated successfully.", ['id' => $id, 'powerup_id' => $powerupId]);
            } else {
                $insStmt = $pdo->prepare("
                    INSERT INTO `wormhole_game_powerups`
                    (`powerup_id`, `powerup_name`, `powerup_type`, `icon`, `model_3d_type`, `model_3d_url`, `color_hex`, `scale`, `length`, `height`, `depth`, `circumference`, `stage_level`, `device_type`, `trigger_events`, `drop_on_enemy_kill`, `drop_chance_pct`, `enemy_id`, `boost_percentage`, `description`, `is_enabled`)
                    VALUES (:pid, :pname, :ptype, :icon, :mtype, :murl, :color, :scale, :len, :ht, :dp, :circ, :stage, :device, :events, :drop_kill, :drop_pct, :enemy, :boost, :desc, :enabled)
                ");
                $insStmt->execute([
                    ':pid'       => $powerupId,
                    ':pname'     => $powerupName,
                    ':ptype'     => $powerupType,
                    ':icon'      => $icon,
                    ':mtype'     => $model3dType,
                    ':murl'      => $model3dUrl,
                    ':color'     => $colorHex,
                    ':scale'     => $scale,
                    ':len'       => $length,
                    ':ht'        => $height,
                    ':dp'        => $depth,
                    ':circ'      => $circumference,
                    ':stage'     => $stageLevel,
                    ':device'    => $deviceType,
                    ':events'    => $triggerEvents,
                    ':drop_kill' => $dropOnEnemyKill,
                    ':drop_pct'  => $dropChancePct,
                    ':enemy'     => $enemyId,
                    ':boost'     => $boostPercentage,
                    ':desc'      => $description,
                    ':enabled'   => $isEnabled
                ]);
                $newId = (int)$pdo->lastInsertId();
                sendJsonResponse(true, "Power Up '{$powerupName}' added successfully.", ['id' => $newId, 'powerup_id' => $powerupId]);
            }
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to save game powerup: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'delete_game_powerup') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager power ups requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $powerupId = trim($input['powerup_id'] ?? '');

        if ($id <= 0 && empty($powerupId)) {
            sendJsonResponse(false, 'Power Up ID or record ID is required for deletion.', [], 400);
        }

        try {
            $pdo = getDbConnection();
            if ($id > 0) {
                $del = $pdo->prepare("DELETE FROM `wormhole_game_powerups` WHERE `id` = :id");
                $del->execute([':id' => $id]);
            } else {
                $del = $pdo->prepare("DELETE FROM `wormhole_game_powerups` WHERE `powerup_id` = :pid");
                $del->execute([':pid' => $powerupId]);
            }
            sendJsonResponse(true, "Power Up deleted successfully.", ['id' => $id, 'powerup_id' => $powerupId]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete game powerup: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'toggle_game_powerup_field') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager power ups requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $field = trim($input['field'] ?? 'is_enabled');
        if ($id <= 0) {
            sendJsonResponse(false, 'Invalid powerup ID', [], 400);
        }

        try {
            $pdo = getDbConnection();
            if ($field === 'drop_on_enemy_kill') {
                $stmt = $pdo->prepare("UPDATE `wormhole_game_powerups` SET `drop_on_enemy_kill` = IF(`drop_on_enemy_kill` = 1, 0, 1), `updated_at` = NOW() WHERE `id` = :id");
            } else {
                $stmt = $pdo->prepare("UPDATE `wormhole_game_powerups` SET `is_enabled` = IF(`is_enabled` = 1, 0, 1), `updated_at` = NOW() WHERE `id` = :id");
            }
            $stmt->execute(['id' => $id]);

            sendJsonResponse(true, 'Powerup field toggled successfully', [
                'id' => $id,
                'field' => $field
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to toggle powerup field: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'seed_game_powerups') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager power ups requires administrative credentials');

        try {
            $pdo = getDbConnection();
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

            sendJsonResponse(true, "Default power ups initialized successfully.", ['count' => count($defaultsP)]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to seed power ups: ' . $e->getMessage(), [], 500);
        }
    }

    // =========================================================================
    // 35. WORMHOLE GAME ENVIRONMENT & COSMIC ASSETS MANAGER
    // =========================================================================
    function ensureWormholeEnvironmentsTable(PDO $pdo) {
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
        } catch (Throwable $e) {
            error_log('ensureWormholeEnvironmentsTable error: ' . $e->getMessage());
        }
    }

    if ($action === 'get_game_environments' || $action === 'get_environments') {
        try {
            $pdo = getDbConnection();
            ensureWormholeEnvironmentsTable($pdo);

            $stageFilter = isset($input['stage_level']) && $input['stage_level'] !== '' ? intval($input['stage_level']) : null;
            $deviceFilter = strtolower(trim($input['device_type'] ?? ''));

            $whereClauses = [];
            $params = [];

            if ($stageFilter !== null && $stageFilter >= 0) {
                $whereClauses[] = "(`stage_level` = :stage OR `stage_level` = 0)";
                $params['stage'] = $stageFilter;
            }
            if (!empty($deviceFilter) && $deviceFilter !== 'all') {
                $whereClauses[] = "(`device_type` = :device OR `device_type` = 'all')";
                $params['device'] = $deviceFilter;
            }

            $sql = "SELECT * FROM `wormhole_game_environments`";
            if (!empty($whereClauses)) {
                $sql .= " WHERE " . implode(' AND ', $whereClauses);
            }
            $sql .= " ORDER BY `stage_level` ASC, `id` ASC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $environments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Auto-seed default environment records if table is empty
            if (empty($environments)) {
                $countStmt = $pdo->query("SELECT COUNT(*) FROM `wormhole_game_environments`");
                if ((int)$countStmt->fetchColumn() === 0) {
                    $defaultEnvironments = [
                        [
                            'env_id' => 'warp_singularity_s1',
                            'env_name' => 'Warp Cyan Singularity & Inflow Vortex',
                            'env_category' => 'wormhole_singularity',
                            'stage_level' => 1,
                            'device_type' => 'all',
                            'model_3d_type' => 'procedural_wormhole',
                            'model_3d_url' => '',
                            'image_asset_url' => 'desktop/warp_origin_images/singularity_corona.png',
                            'image_asset_type' => 'corona_sprite',
                            'scale' => 1.00,
                            'event_horizon_radius' => 7.50,
                            'accretion_disk_radius' => 38.00,
                            'length' => 300.00,
                            'height' => 80.00,
                            'depth' => 300.00,
                            'circumference' => 47.12,
                            'color_primary' => '#00f0ff',
                            'color_edge' => '#003366',
                            'color_core' => '#00f0ff',
                            'color_hot' => '#d6ffff',
                            'color_halo' => '#00f0ff',
                            'ambient_light' => '#002233',
                            'center_light' => '#00f0ff',
                            'rotation_speed' => 0.650,
                            'distortion_intensity' => 1.00,
                            'particle_count' => 4500,
                            'quick_effect_primary' => 'plasma_aura',
                            'quick_effect_secondary' => 'sparks_burst',
                            'quick_effect_color' => '#00f0ff',
                            'quick_effect_intensity' => 1.00,
                            'quick_effect_speed' => 1.00,
                            'description' => 'Initial unstable hyperspace entry vector with intense ionized neon cyan relativistic accretion disk and active plasma aura.',
                            'is_enabled' => 1
                        ],
                        [
                            'env_id' => 'event_horizon_singularity_s2',
                            'env_name' => 'Amber Event Horizon Relativistic Singularity',
                            'env_category' => 'wormhole_singularity',
                            'stage_level' => 2,
                            'device_type' => 'all',
                            'model_3d_type' => 'procedural_wormhole',
                            'model_3d_url' => '',
                            'image_asset_url' => 'desktop/event_horizon_images/singularity_corona.png',
                            'image_asset_type' => 'corona_sprite',
                            'scale' => 1.15,
                            'event_horizon_radius' => 8.20,
                            'accretion_disk_radius' => 42.00,
                            'length' => 320.00,
                            'height' => 85.00,
                            'depth' => 320.00,
                            'circumference' => 51.52,
                            'color_primary' => '#ffd166',
                            'color_edge' => '#663300',
                            'color_core' => '#ff9900',
                            'color_hot' => '#fff4d6',
                            'color_halo' => '#ffaa00',
                            'ambient_light' => '#331a00',
                            'center_light' => '#ffaa00',
                            'rotation_speed' => 0.850,
                            'distortion_intensity' => 1.35,
                            'particle_count' => 5200,
                            'quick_effect_primary' => 'tachyon_trail',
                            'quick_effect_secondary' => 'plasma_aura',
                            'quick_effect_color' => '#ffd166',
                            'quick_effect_intensity' => 1.20,
                            'quick_effect_speed' => 1.15,
                            'description' => 'High-velocity light-horizon boundary enveloped in incandescent amber relativistic shear and tachyon streaming emission.',
                            'is_enabled' => 1
                        ],
                        [
                            'env_id' => 'singularity_core_s3',
                            'env_name' => 'Void Violet Gravitational Collapse Singularity',
                            'env_category' => 'wormhole_singularity',
                            'stage_level' => 3,
                            'device_type' => 'all',
                            'model_3d_type' => 'procedural_wormhole',
                            'model_3d_url' => '',
                            'image_asset_url' => 'desktop/singularity_core_images/singularity_corona.png',
                            'image_asset_type' => 'corona_sprite',
                            'scale' => 1.30,
                            'event_horizon_radius' => 9.00,
                            'accretion_disk_radius' => 46.00,
                            'length' => 350.00,
                            'height' => 90.00,
                            'depth' => 350.00,
                            'circumference' => 56.55,
                            'color_primary' => '#c084fc',
                            'color_edge' => '#330066',
                            'color_core' => '#9933ff',
                            'color_hot' => '#f5e6ff',
                            'color_halo' => '#a855f7',
                            'ambient_light' => '#1a0033',
                            'center_light' => '#a855f7',
                            'rotation_speed' => 1.100,
                            'distortion_intensity' => 1.65,
                            'particle_count' => 6000,
                            'quick_effect_primary' => 'gravitational_vortex',
                            'quick_effect_secondary' => 'arc_lightning',
                            'quick_effect_color' => '#c084fc',
                            'quick_effect_intensity' => 1.40,
                            'quick_effect_speed' => 1.30,
                            'description' => 'Extreme gravitational collapse boundary with violent space-time tearing, dark void violet accretion flow, and deep gravitational vortex.',
                            'is_enabled' => 1
                        ],
                        [
                            'env_id' => 'quantum_singularity_s4',
                            'env_name' => 'Quantum Phasor Magenta Singularity',
                            'env_category' => 'wormhole_singularity',
                            'stage_level' => 4,
                            'device_type' => 'all',
                            'model_3d_type' => 'procedural_wormhole',
                            'model_3d_url' => '',
                            'image_asset_url' => 'desktop/quantum_realm_images/singularity_corona.png',
                            'image_asset_type' => 'corona_sprite',
                            'scale' => 1.45,
                            'event_horizon_radius' => 10.00,
                            'accretion_disk_radius' => 50.00,
                            'length' => 380.00,
                            'height' => 100.00,
                            'depth' => 380.00,
                            'circumference' => 62.83,
                            'color_primary' => '#f43f5e',
                            'color_edge' => '#660022',
                            'color_core' => '#ff0055',
                            'color_hot' => '#ffd6e6',
                            'color_halo' => '#ff0066',
                            'ambient_light' => '#330011',
                            'center_light' => '#ff1166',
                            'rotation_speed' => 1.350,
                            'distortion_intensity' => 2.00,
                            'particle_count' => 6800,
                            'quick_effect_primary' => 'quantum_phase_glow',
                            'quick_effect_secondary' => 'energy_shield_pulse',
                            'quick_effect_color' => '#f43f5e',
                            'quick_effect_intensity' => 1.60,
                            'quick_effect_speed' => 1.50,
                            'description' => 'Sub-quantum realm boundary with multidimensional reality fractures, energetic magenta plasma bursts, and quantum phase oscillations.',
                            'is_enabled' => 1
                        ]
                    ];

                    $insEnv = $pdo->prepare("
                        INSERT INTO `wormhole_game_environments`
                        (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                        VALUES
                        (:env_id, :env_name, :env_category, :stage_level, :device_type, :model_3d_type, :model_3d_url, :image_asset_url, :image_asset_type, :scale, :event_horizon_radius, :accretion_disk_radius, :length, :height, :depth, :circumference, :color_primary, :color_edge, :color_core, :color_hot, :color_halo, :ambient_light, :center_light, :rotation_speed, :distortion_intensity, :particle_count, :quick_effect_primary, :quick_effect_secondary, :quick_effect_color, :quick_effect_intensity, :quick_effect_speed, :description, :is_enabled)
                    ");
                    foreach ($defaultEnvironments as $de) {
                        $insEnv->execute($de);
                    }

                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $environments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }

            sendJsonResponse(true, 'Environment assets retrieved successfully', [
                'environments' => $environments,
                'count'        => count($environments)
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to fetch game environments: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'save_game_environment') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');

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
            sendJsonResponse(false, 'Environment Identifier (Code) and Display Name are required.', [], 400);
        }

        try {
            $pdo = getDbConnection();
            ensureWormholeEnvironmentsTable($pdo);

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

                sendJsonResponse(true, "Environment asset '{$envName}' updated successfully", [
                    'id' => $id,
                    'env_id' => $envId
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

                sendJsonResponse(true, "Environment asset '{$envName}' created successfully", [
                    'id' => $newId,
                    'env_id' => $envId
                ]);
            }
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to save environment asset: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'delete_game_environment') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');

        $id = isset($input['id']) ? intval($input['id']) : 0;
        $envId = trim($input['env_id'] ?? '');

        if ($id <= 0 && empty($envId)) {
            sendJsonResponse(false, 'Environment ID or record ID is required for deletion.', [], 400);
        }

        try {
            $pdo = getDbConnection();
            if ($id > 0) {
                $del = $pdo->prepare("DELETE FROM `wormhole_game_environments` WHERE `id` = :id");
                $del->execute([':id' => $id]);
            } else {
                $del = $pdo->prepare("DELETE FROM `wormhole_game_environments` WHERE `env_id` = :eid");
                $del->execute([':eid' => $envId]);
            }
            sendJsonResponse(true, "Environment asset deleted successfully.", ['id' => $id, 'env_id' => $envId]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to delete environment asset: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'clone_game_environment') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');

        $sourceId = isset($input['source_id']) ? intval($input['source_id']) : 0;
        $sourceEnvId = trim($input['source_env_id'] ?? '');

        try {
            $pdo = getDbConnection();
            ensureWormholeEnvironmentsTable($pdo);

            $source = null;
            if ($sourceId > 0) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_environments` WHERE `id` = :id LIMIT 1");
                $stmt->execute([':id' => $sourceId]);
                $source = $stmt->fetch(PDO::FETCH_ASSOC);
            } elseif (!empty($sourceEnvId)) {
                $stmt = $pdo->prepare("SELECT * FROM `wormhole_game_environments` WHERE `env_id` = :eid LIMIT 1");
                $stmt->execute([':eid' => $sourceEnvId]);
                $source = $stmt->fetch(PDO::FETCH_ASSOC);
            }

            if (!$source) {
                sendJsonResponse(false, 'Source environment asset could not be located for cloning', [], 404);
            }

            $baseEnvId = $source['env_id'];
            $baseEnvName = $source['env_name'];
            $counter = 1;
            do {
                $newEnvId = $baseEnvId . "_copy_{$counter}";
                $chk = $pdo->prepare("SELECT COUNT(*) FROM `wormhole_game_environments` WHERE `env_id` = :eid");
                $chk->execute([':eid' => $newEnvId]);
                $exists = (int)$chk->fetchColumn() > 0;
                if ($exists) $counter++;
            } while ($exists && $counter < 100);

            $newEnvName = $baseEnvName . " (Copy {$counter})";

            $insStmt = $pdo->prepare("
                INSERT INTO `wormhole_game_environments`
                (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                VALUES
                (:env_id, :env_name, :env_category, :stage_level, :device_type, :model_3d_type, :model_3d_url, :image_asset_url, :image_asset_type, :scale, :event_horizon_radius, :accretion_disk_radius, :length, :height, :depth, :circumference, :color_primary, :color_edge, :color_core, :color_hot, :color_halo, :ambient_light, :center_light, :rotation_speed, :distortion_intensity, :particle_count, :quick_effect_primary, :quick_effect_secondary, :quick_effect_color, :quick_effect_intensity, :quick_effect_speed, :description, :is_enabled)
            ");
            $insStmt->execute([
                ':env_id'                => $newEnvId,
                ':env_name'              => $newEnvName,
                ':env_category'          => $source['env_category'] ?? 'wormhole_singularity',
                ':stage_level'           => intval($source['stage_level'] ?? 1),
                ':device_type'           => $source['device_type'] ?? 'all',
                ':model_3d_type'         => $source['model_3d_type'] ?? 'procedural_wormhole',
                ':model_3d_url'          => $source['model_3d_url'] ?? '',
                ':image_asset_url'       => $source['image_asset_url'] ?? '',
                ':image_asset_type'      => $source['image_asset_type'] ?? 'corona_sprite',
                ':scale'                 => floatval($source['scale'] ?? 1.00),
                ':event_horizon_radius'  => floatval($source['event_horizon_radius'] ?? 7.50),
                ':accretion_disk_radius' => floatval($source['accretion_disk_radius'] ?? 38.00),
                ':length'                => floatval($source['length'] ?? 300.00),
                ':height'                => floatval($source['height'] ?? 80.00),
                ':depth'                 => floatval($source['depth'] ?? 300.00),
                ':circumference'         => floatval($source['circumference'] ?? 47.12),
                ':color_primary'         => $source['color_primary'] ?? '#00f0ff',
                ':color_edge'            => $source['color_edge'] ?? '#003366',
                ':color_core'            => $source['color_core'] ?? '#00f0ff',
                ':color_hot'             => $source['color_hot'] ?? '#d6ffff',
                ':color_halo'            => $source['color_halo'] ?? '#00f0ff',
                ':ambient_light'         => $source['ambient_light'] ?? '#002233',
                ':center_light'          => $source['center_light'] ?? '#00f0ff',
                ':rotation_speed'        => floatval($source['rotation_speed'] ?? 0.650),
                ':distortion_intensity'  => floatval($source['distortion_intensity'] ?? 1.00),
                ':particle_count'        => intval($source['particle_count'] ?? 4500),
                ':quick_effect_primary'  => $source['quick_effect_primary'] ?? 'none',
                ':quick_effect_secondary'=> $source['quick_effect_secondary'] ?? 'none',
                ':quick_effect_color'    => $source['quick_effect_color'] ?? '#00f0ff',
                ':quick_effect_intensity'=> floatval($source['quick_effect_intensity'] ?? 1.00),
                ':quick_effect_speed'    => floatval($source['quick_effect_speed'] ?? 1.00),
                ':description'           => $source['description'] ?? '',
                ':is_enabled'            => intval($source['is_enabled'] ?? 1)
            ]);

            $newId = (int)$pdo->lastInsertId();
            sendJsonResponse(true, "Environment asset '{$newEnvName}' cloned successfully", [
                'id' => $newId,
                'env_id' => $newEnvId
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to clone environment asset: ' . $e->getMessage(), [], 500);
        }
    }

    if ($action === 'seed_default_game_environments' || $action === 'seed_game_environments') {
        requireAdminApiToken($input, 'Unauthorized: Access to Game Manager environment requires administrative credentials');

        try {
            $pdo = getDbConnection();
            ensureWormholeEnvironmentsTable($pdo);
            $pdo->exec("TRUNCATE TABLE `wormhole_game_environments`");

            $defaultEnvironments = [
                [
                    'env_id' => 'warp_singularity_s1',
                    'env_name' => 'Warp Cyan Singularity & Inflow Vortex',
                    'env_category' => 'wormhole_singularity',
                    'stage_level' => 1,
                    'device_type' => 'all',
                    'model_3d_type' => 'procedural_wormhole',
                    'model_3d_url' => '',
                    'image_asset_url' => 'desktop/warp_origin_images/singularity_corona.png',
                    'image_asset_type' => 'corona_sprite',
                    'scale' => 1.00,
                    'event_horizon_radius' => 7.50,
                    'accretion_disk_radius' => 38.00,
                    'length' => 300.00,
                    'height' => 80.00,
                    'depth' => 300.00,
                    'circumference' => 47.12,
                    'color_primary' => '#00f0ff',
                    'color_edge' => '#003366',
                    'color_core' => '#00f0ff',
                    'color_hot' => '#d6ffff',
                    'color_halo' => '#00f0ff',
                    'ambient_light' => '#002233',
                    'center_light' => '#00f0ff',
                    'rotation_speed' => 0.650,
                    'distortion_intensity' => 1.00,
                    'particle_count' => 4500,
                    'quick_effect_primary' => 'plasma_aura',
                    'quick_effect_secondary' => 'sparks_burst',
                    'quick_effect_color' => '#00f0ff',
                    'quick_effect_intensity' => 1.00,
                    'quick_effect_speed' => 1.00,
                    'description' => 'Initial unstable hyperspace entry vector with intense ionized neon cyan relativistic accretion disk and active plasma aura.',
                    'is_enabled' => 1
                ],
                [
                    'env_id' => 'event_horizon_singularity_s2',
                    'env_name' => 'Amber Event Horizon Relativistic Singularity',
                    'env_category' => 'wormhole_singularity',
                    'stage_level' => 2,
                    'device_type' => 'all',
                    'model_3d_type' => 'procedural_wormhole',
                    'model_3d_url' => '',
                    'image_asset_url' => 'desktop/event_horizon_images/singularity_corona.png',
                    'image_asset_type' => 'corona_sprite',
                    'scale' => 1.15,
                    'event_horizon_radius' => 8.20,
                    'accretion_disk_radius' => 42.00,
                    'length' => 320.00,
                    'height' => 85.00,
                    'depth' => 320.00,
                    'circumference' => 51.52,
                    'color_primary' => '#ffd166',
                    'color_edge' => '#663300',
                    'color_core' => '#ff9900',
                    'color_hot' => '#fff4d6',
                    'color_halo' => '#ffaa00',
                    'ambient_light' => '#331a00',
                    'center_light' => '#ffaa00',
                    'rotation_speed' => 0.850,
                    'distortion_intensity' => 1.35,
                    'particle_count' => 5200,
                    'quick_effect_primary' => 'tachyon_trail',
                    'quick_effect_secondary' => 'plasma_aura',
                    'quick_effect_color' => '#ffd166',
                    'quick_effect_intensity' => 1.20,
                    'quick_effect_speed' => 1.15,
                    'description' => 'High-velocity light-horizon boundary enveloped in incandescent amber relativistic shear and tachyon streaming emission.',
                    'is_enabled' => 1
                ],
                [
                    'env_id' => 'singularity_core_s3',
                    'env_name' => 'Void Violet Gravitational Collapse Singularity',
                    'env_category' => 'wormhole_singularity',
                    'stage_level' => 3,
                    'device_type' => 'all',
                    'model_3d_type' => 'procedural_wormhole',
                    'model_3d_url' => '',
                    'image_asset_url' => 'desktop/singularity_core_images/singularity_corona.png',
                    'image_asset_type' => 'corona_sprite',
                    'scale' => 1.30,
                    'event_horizon_radius' => 9.00,
                    'accretion_disk_radius' => 46.00,
                    'length' => 350.00,
                    'height' => 90.00,
                    'depth' => 350.00,
                    'circumference' => 56.55,
                    'color_primary' => '#c084fc',
                    'color_edge' => '#330066',
                    'color_core' => '#9933ff',
                    'color_hot' => '#f5e6ff',
                    'color_halo' => '#a855f7',
                    'ambient_light' => '#1a0033',
                    'center_light' => '#a855f7',
                    'rotation_speed' => 1.100,
                    'distortion_intensity' => 1.65,
                    'particle_count' => 6000,
                    'quick_effect_primary' => 'gravitational_vortex',
                    'quick_effect_secondary' => 'arc_lightning',
                    'quick_effect_color' => '#c084fc',
                    'quick_effect_intensity' => 1.40,
                    'quick_effect_speed' => 1.30,
                    'description' => 'Extreme gravitational collapse boundary with violent space-time tearing, dark void violet accretion flow, and deep gravitational vortex.',
                    'is_enabled' => 1
                ],
                [
                    'env_id' => 'quantum_singularity_s4',
                    'env_name' => 'Quantum Phasor Magenta Singularity',
                    'env_category' => 'wormhole_singularity',
                    'stage_level' => 4,
                    'device_type' => 'all',
                    'model_3d_type' => 'procedural_wormhole',
                    'model_3d_url' => '',
                    'image_asset_url' => 'desktop/quantum_realm_images/singularity_corona.png',
                    'image_asset_type' => 'corona_sprite',
                    'scale' => 1.45,
                    'event_horizon_radius' => 10.00,
                    'accretion_disk_radius' => 50.00,
                    'length' => 380.00,
                    'height' => 100.00,
                    'depth' => 380.00,
                    'circumference' => 62.83,
                    'color_primary' => '#f43f5e',
                    'color_edge' => '#660022',
                    'color_core' => '#ff0055',
                    'color_hot' => '#ffd6e6',
                    'color_halo' => '#ff0066',
                    'ambient_light' => '#330011',
                    'center_light' => '#ff1166',
                    'rotation_speed' => 1.350,
                    'distortion_intensity' => 2.00,
                    'particle_count' => 6800,
                    'quick_effect_primary' => 'quantum_phase_glow',
                    'quick_effect_secondary' => 'energy_shield_pulse',
                    'quick_effect_color' => '#f43f5e',
                    'quick_effect_intensity' => 1.60,
                    'quick_effect_speed' => 1.50,
                    'description' => 'Sub-quantum realm boundary with multidimensional reality fractures, energetic magenta plasma bursts, and quantum phase oscillations.',
                    'is_enabled' => 1
                ]
            ];

            $insEnv = $pdo->prepare("
                INSERT INTO `wormhole_game_environments`
                (`env_id`, `env_name`, `env_category`, `stage_level`, `device_type`, `model_3d_type`, `model_3d_url`, `image_asset_url`, `image_asset_type`, `scale`, `event_horizon_radius`, `accretion_disk_radius`, `length`, `height`, `depth`, `circumference`, `color_primary`, `color_edge`, `color_core`, `color_hot`, `color_halo`, `ambient_light`, `center_light`, `rotation_speed`, `distortion_intensity`, `particle_count`, `quick_effect_primary`, `quick_effect_secondary`, `quick_effect_color`, `quick_effect_intensity`, `quick_effect_speed`, `description`, `is_enabled`)
                VALUES
                (:env_id, :env_name, :env_category, :stage_level, :device_type, :model_3d_type, :model_3d_url, :image_asset_url, :image_asset_type, :scale, :event_horizon_radius, :accretion_disk_radius, :length, :height, :depth, :circumference, :color_primary, :color_edge, :color_core, :color_hot, :color_halo, :ambient_light, :center_light, :rotation_speed, :distortion_intensity, :particle_count, :quick_effect_primary, :quick_effect_secondary, :quick_effect_color, :quick_effect_intensity, :quick_effect_speed, :description, :is_enabled)
            ");
            foreach ($defaultEnvironments as $de) {
                $insEnv->execute($de);
            }

            sendJsonResponse(true, "Default environment assets initialized successfully.", ['count' => count($defaultEnvironments)]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to seed default environments: ' . $e->getMessage(), [], 500);
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

            sendJsonResponse(true, 'Game assets retrieved successfully', [
                'assets' => $assets,
                'count' => count($assets)
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(false, 'Failed to scan game assets: ' . $e->getMessage(), [], 500);
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

        sendJsonResponse(true, $metadata['found'] ? 'Model metadata retrieved from .json' : 'Default metadata initialized', $metadata);
    }

    // =========================================================================
    // ACTION: UPLOAD GAME ASSET (.glb, .gltf, .obj, .png, .jpg, .webp, .svg)
    // =========================================================================
    if ($action === 'upload_game_asset') {
        requireAdminApiToken($input, 'Unauthorized: Uploading game assets requires administrative credentials');

        if (empty($_FILES['asset_file'])) {
            sendJsonResponse(false, 'No file uploaded under asset_file', [], 400);
        }

        $file = $_FILES['asset_file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendJsonResponse(false, 'File upload error code: ' . $file['error'], [], 400);
        }

        $rawName = basename($file['name']);
        $ext = strtolower(pathinfo($rawName, PATHINFO_EXTENSION));
        $allowedExts = ['glb', 'gltf', 'obj', 'png', 'jpg', 'jpeg', 'webp', 'svg'];
        if (!in_array($ext, $allowedExts, true)) {
            sendJsonResponse(false, "Unsupported file format '.{$ext}'. Allowed: " . implode(', ', $allowedExts), [], 400);
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
            sendJsonResponse(false, 'Failed to save uploaded asset file to destination directory', [], 500);
        }

        $relativeUrl = $folder . '/' . $cleanFilename;
        sendJsonResponse(true, "Asset '{$cleanFilename}' uploaded successfully", [
            'path' => $relativeUrl,
            'filename' => $cleanFilename,
            'format' => $ext,
            'type' => in_array($ext, ['glb', 'gltf', 'obj'], true) ? 'model' : 'image',
            'size' => $filesize
        ]);
    }

sendJsonResponse(false, 'Unknown action', array(), 400);

} catch (Throwable $e) {
    error_log("admin_api.php Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    sendJsonResponse(false, 'Internal Server Error. Please contact system administrator.', array(), 500);
}
