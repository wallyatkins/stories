<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_login();

$user = $_SESSION['user'];
$filename = basename($_GET['file'] ?? '');

$GLOBALS['logger']->info('Video request.', ['user_id' => $user['id'], 'email' => $user['email'], 'filename' => $filename]);

$path = __DIR__ . '/../uploads/' . $filename;
if ($filename === '' || !file_exists($path)) {
    http_response_code(404);
    $GLOBALS['logger']->warning('Video not found.', ['user_id' => $user['id'], 'email' => $user['email'], 'filename' => $filename]);
    echo 'Not found';
    exit;
}
$mime = mime_content_type($path) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="' . $filename . '"');
readfile($path);

