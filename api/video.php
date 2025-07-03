<?php
require_once __DIR__ . '/auth.php';
require_https();
require_login();
$filename = basename($_GET['file'] ?? '');
$path = __DIR__ . '/../uploads/' . $filename;
if ($filename === '' || !file_exists($path)) {
    http_response_code(404);
    echo 'Not found';
    exit;
}
$mime = mime_content_type($path) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="' . $filename . '"');
readfile($path);

