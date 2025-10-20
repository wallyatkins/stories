<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_login();

$user = $_SESSION['user'];
$requested = $_GET['file'] ?? '';
$clean = trim(str_replace(['\\', '..'], '', (string) $requested), '/');

$baseDir = realpath(__DIR__ . '/../uploads');
$targetPath = $baseDir && $clean !== '' ? realpath($baseDir . '/' . $clean) : false;

if ($baseDir === false || $clean === '' || $targetPath === false || strpos($targetPath, $baseDir) !== 0) {
    http_response_code(404);
    $GLOBALS['logger']->warning('Video not found.', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'file' => $requested,
    ]);
    echo 'Not found';
    exit;
}
$GLOBALS['logger']->info('Video request.', [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'file' => $clean,
]);

$mime = mime_content_type($targetPath) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="' . basename($targetPath) . '"');
readfile($targetPath);
