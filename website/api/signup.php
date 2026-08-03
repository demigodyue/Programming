<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

requireCsrf();
rateLimit('signup', 6, 60);

$data = body();
$firstName = field($data, 'firstName');
$lastName  = field($data, 'lastName');
$email     = field($data, 'email');
$country   = field($data, 'country');
$password  = (string) ($data['password'] ?? '');
$confirm   = (string) ($data['confirm'] ?? '');

if ($firstName === '' || mb_strlen($firstName) > 80) fail('Please enter your first name.');
if ($lastName === ''  || mb_strlen($lastName)  > 80) fail('Please enter your last name.');
if (!isEmail($email)) fail('Enter a valid email address.');
if (mb_strlen($password) < 8) fail('Password must be at least 8 characters.');
if ($password !== $confirm) fail('The two passwords do not match.');
if (empty($data['terms'])) fail('Please accept the terms of booking.');

$pdo = db();

$existing = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
$existing->execute([':email' => $email]);
if ($existing->fetch() !== false) {
    fail('An account with that email already exists — try signing in instead.', 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$insert = $pdo->prepare(
    'INSERT INTO users (first_name, last_name, email, country, password_hash)
     VALUES (:first_name, :last_name, :email, :country, :password_hash)'
);
$insert->execute([
    ':first_name'    => $firstName,
    ':last_name'     => $lastName,
    ':email'         => $email,
    ':country'       => $country,
    ':password_hash' => $hash,
]);

$userId = (int) $pdo->lastInsertId();

session_regenerate_id(true);
$_SESSION['user_id'] = $userId;
$_SESSION['user_name'] = $firstName;

respond([
    'ok' => true,
    'message' => "Welcome, {$firstName}! Your account is ready.",
    'user' => ['id' => $userId, 'firstName' => $firstName, 'email' => $email],
]);
