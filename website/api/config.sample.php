<?php
/**
 * Local development credentials.
 *
 * Copy this file to config.php and adjust if your setup differs.
 * config.php is gitignored — it holds credentials and never gets committed.
 *
 * The values below are MAMP's own defaults, so on a fresh MAMP install
 * they work unchanged.
 *
 * ON A SERVER you normally do NOT create config.php at all. bootstrap.php
 * falls back to the environment when the file is absent, so the deploy can
 * export the same five names instead of writing secrets to disk:
 *
 *     DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=nepal_travel \
 *     DB_USER=nepal_app DB_PASS='...'
 *
 * (With php-fpm those go in the pool config as env[DB_USER] = ... ; with
 * mod_php, SetEnv in the vhost.) Whichever is set first wins: a present
 * config.php takes precedence over the environment.
 */

const DB_HOST = 'localhost';
const DB_PORT = '3306';
const DB_NAME = 'nepal_travel';
const DB_USER = 'root';
const DB_PASS = 'root';
