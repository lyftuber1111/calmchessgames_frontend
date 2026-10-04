<?php
/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Database, API, & Game Server Configuration
 */

// Database Configuration
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'calmchess');
define('DB_USER', 'chessadmin');
define('DB_PASS', 'ChessSecret2026!');

define('ADMIN_SECRET_KEY', 'blackjackadmin2026unke531@!');

// PayPal Configuration (LIVE PRODUCTION MODE)
define('PAYPAL_ENV', 'live'); // Set to 'live' for production
define('PAYPAL_CLIENT_ID', 'BAAuKf0Nq7Efp5iRVohnfhwwFHNoFKbRevrp6Np3I2aiizyou8EuXZ3rKTeAxdi0JtAUvW4iY8eHP4U-XM');
define('PAYPAL_CLIENT_SECRET', 'EKdmy1ELRj5iO3ZpBRklg7mvuW_F-7yEOYqi61BYDnzAB8V840U1QHiYcggFjmczLqQRFK_av3F0huEB');
define('PAYPAL_BASE_URL', PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
);

/**
 * Get PDO Database Connection
 */
function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

// Alias in case any script calls getDb() instead
if (!function_exists('getDb')) {
    function getDb(): PDO {
        return getDbConnection();
    }
}

/**
 * Standardized JSON Response Helper
 */
function sendJsonResponse(bool $success, string $message = '', array $extra = [], int $httpStatus = 200): void {
    http_response_code($httpStatus);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $extra));
    exit;
}
