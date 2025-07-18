<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
start_session();
header('Content-Type: application/json');

$GLOBALS['logger']->info('Checking login status via API endpoint.');

$authenticated = check_login();
$response = ['authenticated' => $authenticated];
if ($authenticated) {
    $response['user'] = $_SESSION['user'] ?? null;
}

echo json_encode($response);
