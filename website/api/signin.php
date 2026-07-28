<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

requireCsrf();
rateLimit('signin', 10, 60);

$data = body();
$email    = field($data, 'email');
$password = (string) ($data['password'] ?? '');
$remember = !empty($data['remember']);

if (!isEmail($email)) fail('Enter a valid email address.');
if ($password === '') fail('Enter your password.');

$stmt = db()->prepare('SELECT id, first_name, password_hash FROM users WHERE email = :email LIMIT 1');
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// Always run password_verify(), even when no such user exists — comparing
// against a precomputed dummy hash keeps the "no such email" and "wrong
// password" paths the same shape, so response timing can't be used to
// enumerate which emails have accounts.
$hashToCheck = $user['password_hash'] ?? dummyHash();
$valid = password_verify($password, $hashToCheck);

if ($user === false || !$valid) {
    fail('Email or password is incorrect.', 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['user_name'] = $user['first_name'];

if ($remember) {
    // Re-issue the same session cookie with a 30-day expiry. This changes
    // how long the browser keeps the cookie, not what the session grants —
    // there is no separate long-lived "remember token" to manage or leak.
    $params = session_get_cookie_params();
    setcookie(session_name(), session_id(), [
        'expires'  => time() + 60 * 60 * 24 * 30,
        'path'     => $params['path'],
        'domain'   => $params['domain'],
        'secure'   => $params['secure'],
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

respond([
    'ok' => true,
    'message' => "Namaste! Signed in as {$email}.",
    'user' => ['id' => (int) $user['id'], 'firstName' => $user['first_name'], 'email' => $email],
]);
