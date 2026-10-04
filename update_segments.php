<?php
/**
 * Calm Chess Computers - Admin Ring Segments & Center Logo URL Updater
 */
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method Not Allowed', [], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['admin_password']) || (!isset($input['segments']) && !isset($input['center_logo_url']))) {
    sendJsonResponse(false, 'Missing required fields', [], 400);
}

try {
    $pdo = getDbConnection();
    
    // Verify Admin Password against database hash or ADMIN_SECRET_KEY constant
    $stmt = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'admin_password_hash'");
    $stmt->execute();
    $row = $stmt->fetch();
    
    $isAuthenticated = false;
    if ($row && password_verify($input['admin_password'], $row['setting_value'])) {
        $isAuthenticated = true;
    } elseif (defined('ADMIN_SECRET_KEY') && $input['admin_password'] === ADMIN_SECRET_KEY) {
        $isAuthenticated = true;
    }

    if (!$isAuthenticated) {
        sendJsonResponse(false, 'Invalid administrative credentials', [], 401);
    }

    // Update segments and center logo URL in a transaction
    $pdo->beginTransaction();

    // 1. Update center logo URL if provided
    if (isset($input['center_logo_url'])) {
        $cleanUrl = filter_var($input['center_logo_url'], FILTER_SANITIZE_URL);

        // Update in site_settings
        $settingStmt = $pdo->prepare("
            INSERT INTO site_settings (setting_key, setting_value) 
            VALUES ('center_logo_url', :val)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        $settingStmt->execute(['val' => $cleanUrl]);

        // Also sync to ring_segments if 'center' ring_type is present
        try {
            $centerSegStmt = $pdo->prepare("
                INSERT INTO ring_segments (ring_type, segment_index, title, url, description, show_text, is_active) 
                VALUES ('center', 0, 'Center Logo', :url, 'Center knight logo single-click redirect URL', 0, 1)
                ON DUPLICATE KEY UPDATE url = VALUES(url)
            ");
            $centerSegStmt->execute(['url' => $cleanUrl]);
        } catch (Exception $e) {
            // Ignore if ring_segments does not have 'center' enum
        }
    }

    // 2. Update segments if provided
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
            // Skip center entry if passed inside segments array to avoid colliding with specific logic
            if (isset($seg['ring_type']) && $seg['ring_type'] === 'center') {
                continue;
            }

            $updateStmt->execute([
                'ring_type'     => filter_var($seg['ring_type'], FILTER_DEFAULT),
                'segment_index' => filter_var($seg['segment_index'], FILTER_VALIDATE_INT),
                'title'         => filter_var($seg['title'], FILTER_DEFAULT),
                'url'           => filter_var($seg['url'], FILTER_SANITIZE_URL),
                'description'   => filter_var($seg['description'] ?? '', FILTER_DEFAULT),
                'is_active'     => filter_var($seg['is_active'] ?? 1, FILTER_VALIDATE_INT)
            ]);
        }
    }

    $pdo->commit();
    sendJsonResponse(true, 'Ring segments and center logo URL successfully updated');

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse(false, 'Error updating settings: ' . $e->getMessage(), [], 500);
}
