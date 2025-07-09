<?php
require_once __DIR__ . '/auth.php';
require_https();
start_session();
header('Content-Type: application/json');

$authenticated = check_login();
$response = ['authenticated' => $authenticated];
if ($authenticated) {
    $response['user'] = $_SESSION['user'] ?? null;
}

echo json_encode($response);
