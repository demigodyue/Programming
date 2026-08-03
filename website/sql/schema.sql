-- Nepal travel site — MySQL schema.
--
-- Targets MAMP's bundled MySQL (localhost:3306, default user/pass root/root).
-- Import with phpMyAdmin (http://localhost/phpMyAdmin), or from a shell:
--
--   "C:\MAMP\bin\mysql\bin\mysql.exe" -u root -proot < sql/schema.sql
--
-- Safe to re-run: every statement is idempotent.

CREATE DATABASE IF NOT EXISTS nepal_travel
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nepal_travel;

-- Account holders. Passwords are never stored in plain text — only the
-- output of PHP's password_hash() (bcrypt via PASSWORD_DEFAULT) lives here.
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name    VARCHAR(80)  NOT NULL,
    last_name     VARCHAR(80)  NOT NULL,
    -- 190 not 255: utf8mb4's 4 bytes/char pushes a 255-char unique index
    -- past the 767-byte key-length limit on older InnoDB row formats.
    email         VARCHAR(190) NOT NULL,
    country       VARCHAR(80)  NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB;

-- Contact form submissions.
CREATE TABLE IF NOT EXISTS contact_messages (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(80)  NOT NULL,
    last_name   VARCHAR(80)  NOT NULL,
    email       VARCHAR(190) NOT NULL,
    phone       VARCHAR(40)  NOT NULL DEFAULT '',
    interest    VARCHAR(120) NOT NULL DEFAULT '',
    message     TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_contact_created_at (created_at)
) ENGINE=InnoDB;
