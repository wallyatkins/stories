<?php
require_once __DIR__ . '/auth.php';
require_https();
require_login();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No video uploaded']);
    exit;
}
$uploadsDir = __DIR__ . '/../uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}
$id = time();
$filename = $id . '-' . basename($_FILES['video']['name']);
move_uploaded_file($_FILES['video']['tmp_name'], "$uploadsDir/$filename");
echo json_encode(['filename' => $filename]);
