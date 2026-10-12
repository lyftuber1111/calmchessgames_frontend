-- =============================================================================
-- CalmChess Games - Android Blackjack App Database Mirror Schema
-- File: updated_android_database_1.sql
-- Description: Database schema, tables, indices, and migration statements required
--              for the Android Blackjack App to mirror server database entries.
-- Supported Features:
--   1. Google Play In-App Billing (IAB) purchases & receipt tracking
--   2. In-App Billing Purchase Report JSON persistence for 7-year audit retention
--   3. User registration & authentication (supporting both Email and Username)
--   4. Password reset flow with secondary email binding for username-only accounts
--   5. Account Deletion & GDPR/Google Play Data Safety compliance
--   6. 7-Year Statutory Financial Retention pseudonymization ('[Deleted User - 7-Yr Retained]')
--   7. Server & client simulation mode toggling for offline/sandbox testing
-- =============================================================================

CREATE DATABASE IF NOT EXISTS calmchess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE calmchess;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE (Player Accounts & Chip Balances)
-- Mirrors Android local/remote user profile, authentication, and chips bankroll.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Email is optional if the user signs up with a username only, but unique if present
    email VARCHAR(255) UNIQUE NULL,
    -- Username allows login via username or email across mobile and web clients
    username VARCHAR(100) UNIQUE NULL,
    -- Bcrypt or Argon2 password hash
    password_hash VARCHAR(255) NOT NULL,
    -- Starting chip bankroll balance (Default: 500.00 credits/chips)
    bank DECIMAL(12, 2) DEFAULT 500.00,
    -- Active account status flag (1 = active, 0 = suspended / deactivated)
    is_active TINYINT(1) DEFAULT 1,
    -- Account registration timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 2. PURCHASES TABLE (Google Play In-App Billing & Financial Ledger)
-- Mirrors all in-app store transactions made via Google Play Billing Client.
-- CRITICAL AUDIT RULE:
--   `user_id` is INT NULL. When an account is deleted under GDPR/Google Play
--   Data Safety policy, the purchase row MUST NOT be deleted. Instead:
--     user_id -> NULL
--     payer_email -> '[Deleted User - 7-Yr Retained]'
--   This preserves financial accounting records for statutory 7-year audit.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Foreign key to users.id (NULLABLE to allow GDPR pseudonymization)
    user_id INT NULL,
    -- Legacy PayPal order ID column (kept for unified schema compatibility)
    paypal_order_id VARCHAR(100) NULL,
    -- Google Play Order ID (e.g., GPA.3341-8921-9920-11245) or simulated order ID
    order_id VARCHAR(100) NULL,
    -- Google Play In-App Product ID / SKU (e.g. credits_500, credits_1200, credits_3000, credits_7000)
    product_id VARCHAR(100) NULL,
    -- Google Play Billing Purchase Token returned by BillingClient.getPurchaseToken()
    purchase_token TEXT NULL,
    -- Payer's Google account email, or pseudonymized '[Deleted User - 7-Yr Retained]'
    payer_email VARCHAR(255) NULL,
    -- Google Play account obfuscated ID or buyer identifier
    payer_id VARCHAR(100) NULL,
    -- Android Application Package Name (e.g., com.calmchess.blackjack)
    package_name VARCHAR(100) NULL,
    -- Number of in-game credits/chips awarded to player bankroll
    credits_added INT NOT NULL,
    -- Amount paid in USD or local currency
    amount_paid DECIMAL(10, 2) NOT NULL,
    -- Transaction status: COMPLETED, PENDING, REFUNDED, CANCELLED
    status VARCHAR(50) DEFAULT 'COMPLETED',
    -- Payment gateway method: GOOGLE_PLAY, GOOGLE_PLAY_SIMULATED, PAYPAL
    payment_method VARCHAR(50) DEFAULT 'GOOGLE_PLAY',
    -- Raw JSON receipt payload from Google Play Billing Client / Google Play Developer API
    raw_response TEXT NULL,
    -- Full structured JSON Purchase Report containing:
    --   - report_type: 'GOOGLE_PLAY_IN_APP_BILLING_REPORT'
    --   - audit_compliance: '7_YEAR_STATUTORY_FINANCIAL_RETENTION'
    --   - order_id, product_id, credits_added, amount_paid, package_name
    --   - google_receipt: purchaseToken, orderId, purchaseTime, purchaseState
    --   - client_report: device metadata, app version, client timestamp
    purchase_report LONGTEXT NULL,
    -- Creation timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_purchases_order (order_id),
    INDEX idx_purchases_user (user_id),
    INDEX idx_purchases_method (payment_method),
    INDEX idx_purchases_product (product_id),
    INDEX idx_purchases_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. ACCOUNT DELETION REQUESTS TABLE (GDPR / Google Play Compliance)
-- Records player account and data deletion requests initiated from Android app.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- User ID if authenticated, NULL if user was already purged
    user_id INT NULL,
    -- Email or Username identifier requested for deletion
    identifier VARCHAR(255) NOT NULL,
    -- Request category: FULL_DELETE, PERSONAL_DATA_ONLY, CCPA_OPT_OUT
    request_type VARCHAR(50) DEFAULT 'FULL_DELETE',
    -- Processing status: PENDING, PROCESSED, COMPLETED, CANCELLED
    status ENUM('PENDING', 'PROCESSED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    -- Client IP address where request originated
    ip_address VARCHAR(45) NULL,
    -- Optional user feedback / reason for account removal
    reason TEXT NULL,
    -- Submission timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Processing timestamp when purge was completed by admin or background worker
    processed_at TIMESTAMP NULL,
    INDEX idx_deletion_identifier (identifier),
    INDEX idx_deletion_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4. PASSWORD RESET TOKENS & VERIFICATION CODES TABLE
-- Handles password recovery workflows for Android app users.
-- Supports 6-digit email codes when user registered with username only.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- User ID associated with reset request
    user_id INT NOT NULL,
    -- Email or Username supplied during reset initiation
    identifier VARCHAR(255) NOT NULL,
    -- SHA-256 hash of secure URL token (for web link resets)
    token_hash VARCHAR(64) NOT NULL,
    -- First few characters of token for admin preview / debugging
    raw_token_preview VARCHAR(16) NULL,
    -- 6-digit numerical OTP / verification code displayed or emailed to player
    verification_code VARCHAR(64) NULL,
    -- Token status
    status ENUM('PENDING', 'USED', 'EXPIRED', 'CANCELLED') DEFAULT 'PENDING',
    -- Expiration timestamp (typically 1 hour from creation)
    expires_at DATETIME NOT NULL,
    -- Client IP address
    ip_address VARCHAR(45) NULL,
    -- Android device user-agent string
    user_agent TEXT NULL,
    -- Creation timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- When the code was redeemed
    used_at DATETIME NULL,
    INDEX idx_reset_token (token_hash),
    INDEX idx_reset_code (verification_code),
    INDEX idx_reset_user (user_id),
    INDEX idx_reset_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 5. BALANCE AUDIT LOG TABLE
-- Logs every bankroll credit/debit transaction (game rounds, in-app purchases, admin gifts).
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 6. SITE SETTINGS TABLE (Android App Configuration & Simulation Toggles)
-- Controls billing mode, developer credentials, and Gemini commentary for Android.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default setting rows required by the Android app:
-- Android simulation mode: '0' = Live Google Play Billing, '1' = Simulated In-App Purchases Active
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('android_simulation_mode', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Allow guest play without mandatory login
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('allow_guest', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Google Play Developer API Service Account JSON (used by backend to verify purchase tokens)
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('google_service_account_json', '')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Gemini Blackjack Dealer Commentary & Strategy Advisor Toggle
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('gemini_commentary_enabled', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- -----------------------------------------------------------------------------
-- 7. IDEMPOTENT MIGRATIONS FOR EXISTING ANDROID-CONNECTED DATABASES
-- Run safely on pre-existing databases without duplicate column errors.
-- -----------------------------------------------------------------------------
SET @dbname = DATABASE();

-- A. Ensure 'purchase_report' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'purchase_report');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN purchase_report LONGTEXT NULL AFTER raw_response', 'SELECT 1');
PREPARE stmt_pr FROM @sql;
EXECUTE stmt_pr;
DEALLOCATE PREPARE stmt_pr;

-- B. Ensure 'order_id' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'order_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN order_id VARCHAR(100) NULL AFTER paypal_order_id', 'SELECT 1');
PREPARE stmt_oid FROM @sql;
EXECUTE stmt_oid;
DEALLOCATE PREPARE stmt_oid;

-- C. Ensure 'product_id' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'product_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN product_id VARCHAR(100) NULL AFTER order_id', 'SELECT 1');
PREPARE stmt_pid FROM @sql;
EXECUTE stmt_pid;
DEALLOCATE PREPARE stmt_pid;

-- D. Ensure 'purchase_token' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'purchase_token');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN purchase_token TEXT NULL AFTER product_id', 'SELECT 1');
PREPARE stmt_ptok FROM @sql;
EXECUTE stmt_ptok;
DEALLOCATE PREPARE stmt_ptok;

-- E. Ensure 'package_name' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'package_name');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN package_name VARCHAR(100) NULL AFTER payer_id', 'SELECT 1');
PREPARE stmt_pkg FROM @sql;
EXECUTE stmt_pkg;
DEALLOCATE PREPARE stmt_pkg;

-- F. Ensure 'payment_method' exists in 'purchases'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'payment_method');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE purchases ADD COLUMN payment_method VARCHAR(50) DEFAULT \'GOOGLE_PLAY\' AFTER status', 'SELECT 1');
PREPARE stmt_pm FROM @sql;
EXECUTE stmt_pm;
DEALLOCATE PREPARE stmt_pm;

-- G. Allow 'user_id' in 'purchases' to be NULL for 7-year statutory financial retention
ALTER TABLE purchases MODIFY COLUMN user_id INT NULL;

-- H. Ensure 'username' exists in 'users'
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER email', 'SELECT 1');
PREPARE stmt_un FROM @sql;
EXECUTE stmt_un;
DEALLOCATE PREPARE stmt_un;

-- I. Allow 'email' in 'users' to be NULL for username-only accounts
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;

-- =============================================================================
-- ANDROID APP CLIENT INTEGRATION NOTES & CONTRACT SPECIFICATION:
-- =============================================================================
-- 1. In-App Purchase Payload Format (POST to /google_play_billing_api.php?action=verify):
--    {
--      "purchase_token": "<BillingClient PurchaseToken>",
--      "product_id": "credits_1200",
--      "order_id": "GPA.3341-8921-9920-11245",
--      "package_name": "com.calmchess.blackjack",
--      "credits": 1200,
--      "amount": 9.99,
--      "currency": "USD",
--      "is_simulated": false,
--      "client_report": {
--        "device_model": "Pixel 8 Pro",
--        "android_version": "14",
--        "app_version": "1.0.4",
--        "billing_client_version": "7.0.0",
--        "timestamp": "2026-10-12T01:30:00Z"
--      }
--    }
--
-- 2. Server Purchase Report Saved in `purchases.purchase_report`:
--    {
--      "report_type": "GOOGLE_PLAY_IN_APP_BILLING_REPORT",
--      "version": "1.0",
--      "order_id": "GPA.3341-8921-9920-11245",
--      "product_id": "credits_1200",
--      "credits_added": 1200,
--      "amount_paid": "9.99",
--      "currency": "USD",
--      "status": "COMPLETED",
--      "payment_method": "GOOGLE_PLAY",
--      "package_name": "com.calmchess.blackjack",
--      "purchase_token": "...",
--      "payer_email": "player@example.com",
--      "payer_id": "GPA.3341-8921-9920-11245",
--      "is_simulated": false,
--      "client_report": { ... },
--      "google_receipt": { ... },
--      "audit_compliance": "7_YEAR_STATUTORY_FINANCIAL_RETENTION",
--      "timestamp": "2026-10-12 01:30:00"
--    }
--
-- 3. Account Deletion & 7-Year Statutory Financial Retention:
--    When the user requests account deletion via /account_deletion_api.php:
--    - The user row is purged from `users` (or anonymized).
--    - All purchases linked to `user_id` are updated:
--        UPDATE purchases SET user_id = NULL, payer_email = '[Deleted User - 7-Yr Retained]' WHERE user_id = :id;
--    - The purchase ledger records remain intact with full financial amounts,
--      order_id, and purchase_report for IRS / 7-year audit compliance.
-- =============================================================================
