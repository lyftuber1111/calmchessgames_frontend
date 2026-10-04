<?php
/**
 * Calm Chess Computers - Fetch Ring Navigation Segments & Center Logo URL
 */
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();
    $stmt = $pdo->query("SELECT ring_type, segment_index, title, url, description, is_active FROM ring_segments ORDER BY ring_type, segment_index ASC");
    $segments = $stmt->fetchAll();
    
    // Fetch center logo URL from site_settings or fallback to ring_segments
    $centerLogoUrl = '';
    try {
        $logoStmt = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'center_logo_url' LIMIT 1");
        $logoStmt->execute();
        $row = $logoStmt->fetch();
        if ($row && isset($row['setting_value'])) {
            $centerLogoUrl = $row['setting_value'];
        }
    } catch (Exception $e) {
        // Continue if site_settings is unavailable
    }

    if (empty($centerLogoUrl)) {
        try {
            $centerSegStmt = $pdo->prepare("SELECT url FROM ring_segments WHERE ring_type = 'center' LIMIT 1");
            $centerSegStmt->execute();
            $segRow = $centerSegStmt->fetch();
            if ($segRow && !empty($segRow['url'])) {
                $centerLogoUrl = $segRow['url'];
            }
        } catch (Exception $e) {
            // Ignore if ring_segments does not have 'center'
        }
    }

    sendJsonResponse(true, 'Segments retrieved successfully', [
        'segments' => $segments,
        'center_logo_url' => $centerLogoUrl
    ]);
} catch (Exception $e) {
    sendJsonResponse(false, 'Database error: ' . $e->getMessage(), [], 500);
}
