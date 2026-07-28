<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

requireCsrf();
rateLimit('contact', 8, 60);

$data = body();
$firstName = field($data, 'firstName');
$lastName  = field($data, 'lastName');
$email     = field($data, 'email');
$phone     = field($data, 'phone');
$interest  = field($data, 'interest');
$message   = field($data, 'message');

if ($firstName === '' || mb_strlen($firstName) > 80) {
    fail('Please tell us your first name.');
}
if (!isEmail($email)) {
    fail('That email address does not look right — check for a typo.');
}
if ($message === '' || mb_strlen($message) > 4000) {
    fail('Please add a short message so we know what to quote.');
}
if (mb_strlen($lastName) > 80 || mb_strlen($phone) > 40 || mb_strlen($interest) > 120) {
    fail('One of the fields is too long.');
}

$stmt = db()->prepare(
    'INSERT INTO contact_messages (first_name, last_name, email, phone, interest, message)
     VALUES (:first_name, :last_name, :email, :phone, :interest, :message)'
);
$stmt->execute([
    ':first_name' => $firstName,
    ':last_name'  => $lastName,
    ':email'      => $email,
    ':phone'      => $phone,
    ':interest'   => $interest,
    ':message'    => $message,
]);

respond([
    'ok' => true,
    'message' => "Dhanyabad, {$firstName}! Your message is on its way — we'll reply to {$email} within one working day.",
]);
