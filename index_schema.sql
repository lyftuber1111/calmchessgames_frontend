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

-- Ensure existing database installations update the column ENUM definition if previously ('inner', 'outer')
ALTER TABLE ring_segments MODIFY COLUMN ring_type ENUM('inner', 'outer', 'center') NOT NULL;

-- Table for admin authentication & settings (stores admin hash, center logo redirect URL, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin password hash (Default password: ChessSecret2026!)
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('admin_password_hash', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Center logo single-click redirect URL (Default: chess.html)
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('center_logo_url', 'chess.html')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Default center logo entry in ring_segments
INSERT INTO ring_segments (ring_type, segment_index, title, url, description, show_text, is_active)
VALUES ('center', 0, 'Center Logo', 'chess.html', 'Center knight logo single-click redirect URL', 0, 1)
ON DUPLICATE KEY UPDATE url = VALUES(url);
