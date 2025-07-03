<?php
require_once __DIR__ . '/auth.php';
require_https();
start_session();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$email = $_POST['email'] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$token = bin2hex(random_bytes(16));
$tokenDir = __DIR__ . '/../metadata/tokens';
if (!is_dir($tokenDir)) {
    mkdir($tokenDir, 0777, true);
}
file_put_contents("$tokenDir/$token.json", json_encode(['email' => $email, 'ts' => time()]));
$link = 'https://' . $_SERVER['HTTP_HOST'] . '/api/verify_login.php?token=' . $token;
@mail($email, 'Your login link', "Click this link to log in: $link");

echo json_encode(['sent' => true]);
