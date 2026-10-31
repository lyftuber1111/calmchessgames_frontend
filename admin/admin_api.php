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

sendJsonResponse(false, 'Unknown action', array(), 400);

} catch (Throwable $e) {
    error_log("admin_api.php Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    sendJsonResponse(false, 'Internal Server Error. Please contact system administrator.', array(), 500);
}
