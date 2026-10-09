CREATE DATABASE IF NOT EXISTS calmchess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE calmchess;

-- Table to store ring segments (Inner, Outer rings, and optional Center logo)
CREATE TABLE IF NOT EXISTS ring_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ring_type ENUM('inner', 'outer', 'center') NOT NULL,
    segment_index INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    description TEXT,
    show_text TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ring_segment (ring_type, segment_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for admin authentication & settings (stores admin hash, simulation mode, guest allow, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin password hash (Bcrypt hash for: blackjackadmin2026unke531@!)
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('admin_password_hash', '$2y$10$OdBaI3FQBn.jRvzr6z8zouugM0S12TWjNSE/3IGF/vrOCebalz7WO')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Admin authentication API token for VPS/backend direct API calls (High-entropy token)
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('admin_api_token', 'cc_sec_token_8f3d1b9e24a75c601e4a8b2d7f9c3e1a0b5d8e2f4a7c9b1e3d5a7f9b2c4e6a8d')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Admin JWT secret key for HMAC-SHA256 signature signing and verification
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('jwt_secret', 'cc_jwt_sec_8a39d2f01c4b7e8d5f6a9b2c3d4e5f60718293a4b5c6d7e8f90123456789abcd')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Google Service Account JSON configuration for Google Play Developer API verification
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('google_service_account_json', '')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Center logo single-click redirect URL (Default: chess.html)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('center_logo_url', 'chess.html')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Android Blackjack App simulation mode toggle (0: Live Google Play In-App Billing, 1: Simulated Purchases Active)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('android_simulation_mode', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Desktop HTML Blackjack App simulation mode toggle (0: Live PayPal Gateway, 1: Simulated Checkout Active)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('desktop_simulation_mode', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Global / Legacy simulation mode toggle for backward compatibility (0: Live Gateway / Billing Active, 1: Simulation Mode Active)
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('simulation_mode', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Allow guest login toggle (1: Guest play enabled, 0: Guest play disabled)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('allow_guest', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Gemini 3.8 Flash API Key (Optional: Can also be set via GEMINI_API_KEY environment variable)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('gemini_api_key', '')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Gemini Model configuration (Default: gemini-3.8-flash)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('gemini_model', 'gemini-3.8-flash')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Gemini Blackjack Dealer Commentary & Strategy Advisor Toggle (1: Enabled, 0: Disabled)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('gemini_commentary_enabled', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- In-Transit Application Layer & TLS Transport Security Enforcements
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('transit_encryption_enabled', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO site_settings (setting_key, setting_value)
VALUES ('enforce_https', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Table for registered players
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NULL,
    password_hash VARCHAR(255) NOT NULL,
    bank DECIMAL(12, 2) DEFAULT 500.00,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for auditing all bankroll / chip balance adjustments
CREATE TABLE IF NOT EXISTS balance_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    old_balance DECIMAL(12, 2) NOT NULL,
    new_balance DECIMAL(12, 2) NOT NULL,
    adjustment_amount DECIMAL(12, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    admin_identifier VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table to track account & data deletion requests for Google Play / GDPR compliance
CREATE TABLE IF NOT EXISTS account_deletion_requests (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table to track password reset tokens and email verification codes
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    raw_token_preview VARCHAR(16) NULL,
    verification_code VARCHAR(64) NULL,
    status ENUM('PENDING', 'USED', 'EXPIRED', 'CANCELLED') DEFAULT 'PENDING',
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    INDEX idx_reset_token (token_hash),
    INDEX idx_reset_code (verification_code),
    INDEX idx_reset_user (user_id),
    INDEX idx_reset_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for credit purchases & payment ledger (Supports PayPal, Google Play In-App Billing, and Simulated purchases)
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    paypal_order_id VARCHAR(100) NULL,
    order_id VARCHAR(100) NULL,
    product_id VARCHAR(100) NULL,
    purchase_token TEXT NULL,
    payer_email VARCHAR(255) NULL,
    payer_id VARCHAR(100) NULL,
    package_name VARCHAR(100) NULL,
    credits_added INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    payment_method VARCHAR(50) DEFAULT 'PAYPAL',
    raw_response TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_purchases_order (order_id),
    INDEX idx_purchases_user (user_id),
    INDEX idx_purchases_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- IDEMPOTENT MIGRATIONS FOR PRE-EXISTING TABLES
-- Automatically alters existing tables to add columns if they were created before
-- =============================================================================
SET @dbname = DATABASE();

-- 1. Ensure 'is_active' exists in 'users'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt1 FROM @sql;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- 2. Ensure 'username' exists in 'users'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER email', 'SELECT 1');
PREPARE stmt2 FROM @sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Ensure 'order_id' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'order_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN order_id VARCHAR(100) NULL AFTER paypal_order_id', 'SELECT 1');
PREPARE stmt3 FROM @sql;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- 4. Ensure 'product_id' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'product_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN product_id VARCHAR(100) NULL AFTER order_id', 'SELECT 1');
PREPARE stmt4 FROM @sql;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- 5. Ensure 'purchase_token' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'purchase_token');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN purchase_token TEXT NULL AFTER product_id', 'SELECT 1');
PREPARE stmt5 FROM @sql;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- 6. Ensure 'payment_method' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'payment_method');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN payment_method VARCHAR(50) DEFAULT \'PAYPAL\' AFTER status', 'SELECT 1');
PREPARE stmt6 FROM @sql;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

-- =============================================================================
-- 7. DATABASE USER IN-TRANSIT TLS / SSL TRANSPORT SECURITY
-- Mandates encrypted MySQL / MariaDB network connections for the application user
-- Prevents unencrypted database traffic, packet sniffing, and MITM on internal networks
-- =============================================================================
-- Uncomment to enforce SSL on local/socket or TCP user:
-- ALTER USER IF EXISTS 'chessadmin'@'127.0.0.1' REQUIRE SSL;
-- ALTER USER IF EXISTS 'chessadmin'@'localhost' REQUIRE SSL;
-- For remote database host setups:
-- ALTER USER IF EXISTS 'chessadmin'@'%' REQUIRE SSL;

