<?php
require_once __DIR__ . '/auth.php';
require_https();
header('Content-Type: application/json');
echo json_encode(['authenticated' => check_login()]);
