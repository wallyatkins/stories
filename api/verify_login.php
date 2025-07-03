<?php
require_once __DIR__ . '/auth.php';
require_https();
start_session();
$token = $_GET['token'] ?? '';
$tokenFile = __DIR__ . '/../metadata/tokens/' . basename($token) . '.json';
if ($token !== '' && file_exists($tokenFile)) {
    $data = json_decode(file_get_contents($tokenFile), true);
    unlink($tokenFile);
    $_SESSION['user'] = $data['email'];
    header('Location: /');
    exit;
}
header('Content-Type: text/plain');
http_response_code(400);
echo 'Invalid or expired token';
