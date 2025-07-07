<?php
require_once __DIR__ . '/auth.php';
require_https();
require_login();
start_session();
header('Content-Type: application/json');
$friends = $_SESSION['friends'] ?? [];
echo json_encode($friends);
?>
