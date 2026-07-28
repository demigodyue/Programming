<?php
/**
 * Shared setup for every endpoint in api/: session, JSON helpers, CSRF,
 * a basic per-IP rate limit, and a catch-all error handler so a PHP
 * warning or DB exception never leaks a stack trace to the client.
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

// Never show errors in the response body — always log them instead.
ini_set('display_errors', '0');
error_reporting(E_ALL);

set_exception_handler(function (Throwable $e): void {
    error_log('[nepal-api] ' . $e->getMessage());
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Something went wrong on our end — please try again shortly.']);
    exit;
});

// ---- session ----
// 'secure' only when the request actually arrived over HTTPS — forcing it
// on plain http://localhost would make the browser silently drop the
// cookie and every "signed in" state would break.
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_name('nepal_session');
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/** Lazily-created, reused PDO connection. */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void
{
    respond(['ok' => false, 'error' => $message], $status);
}

/** Decode the JSON request body; always returns an array, never null. */
function body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode((string) $raw, true);
    return is_array($data) ? $data : [];
}

function field(array $data, string $key, string $default = ''): string
{
    $v = $data[$key] ?? $default;
    return is_string($v) ? trim($v) : $default;
}

function isEmail(string $v): bool
{
    return $v !== '' && strlen($v) <= 190 && filter_var($v, FILTER_VALIDATE_EMAIL) !== false;
}

// ---- CSRF ----
// Double-submit pattern: the token lives in the (HttpOnly) session and the
// client must echo it back in a header, which a cross-site request can't
// read. GET /api/csrf.php hands out the current token.
function csrfToken(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function requireCsrf(): void
{
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $known = $_SESSION['csrf'] ?? '';
    if ($known === '' || !hash_equals($known, $sent)) {
        fail('Your session expired — please refresh the page and try again.', 403);
    }
}

// ---- rate limiting ----
// Deliberately IP-keyed rather than session-keyed, so it isn't defeated by
// clearing cookies. A flat file per (bucket, IP) with an exclusive lock —
// fine for a single MAMP instance; a real multi-server deployment would
// want this in Redis or the database instead.
function rateLimit(string $bucket, int $max, int $windowSeconds): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = preg_replace('/[^a-zA-Z0-9_.:-]/', '_', $bucket . '_' . $ip);
    $file = sys_get_temp_dir() . '/nepal_rl_' . $key . '.json';

    $fh = fopen($file, 'c+');
    if ($fh === false) {
        return; // fail open — a broken temp dir shouldn't take the endpoint down
    }

    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    $state = json_decode((string) $raw, true);
    $now = time();

    if (!is_array($state) || $now > ($state['reset'] ?? 0)) {
        $state = ['count' => 0, 'reset' => $now + $windowSeconds];
    }
    $state['count']++;

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($state));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);

    if ($state['count'] > $max) {
        fail('Too many attempts from this connection — please wait a minute and try again.', 429);
    }
}

/**
 * A valid password hash that no real password will ever match, computed
 * once per request. Used so "email not found" takes the same code path
 * (and roughly the same time) as "wrong password" — otherwise a timing
 * difference tells an attacker which emails have accounts.
 */
function dummyHash(): string
{
    static $hash = null;
    if ($hash === null) {
        $hash = password_hash('nepal-timing-safety-filler', PASSWORD_DEFAULT);
    }
    return $hash;
}
