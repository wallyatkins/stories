<?php
declare(strict_types=1);

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';

require_login();

$user = $_SESSION['user'];
$requested = $_GET['file'] ?? '';
$clean = trim(str_replace(['\\', '..'], '', (string) $requested), '/');

$baseDir = realpath(__DIR__ . '/../uploads');
$targetPath = $baseDir && $clean !== '' ? realpath($baseDir . '/' . $clean) : false;

if ($baseDir === false || $clean === '' || $targetPath === false || !is_file($targetPath) || strpos($targetPath, $baseDir) !== 0) {
    http_response_code(404);
    $GLOBALS['logger']->warning('File not found in uploads.', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'file' => $requested,
    ]);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Not found';
    exit;
}

$GLOBALS['logger']->info('File request in uploads.', [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'file' => $clean,
]);

// Determine mime type by extension or content
$ext = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
$mime = match ($ext) {
    'mp4' => 'video/mp4',
    'webm' => 'video/webm',
    'mov' => 'video/quicktime',
    'json' => 'application/json',
    'png' => 'image/png',
    'jpg', 'jpeg' => 'image/jpeg',
    default => mime_content_type($targetPath) ?: 'application/octet-stream',
};

$fileSize = filesize($targetPath);
if ($fileSize === false) {
    http_response_code(500);
    exit;
}

header('Content-Disposition: inline; filename="' . basename($targetPath) . '"');
header('Accept-Ranges: bytes');
header('Cross-Origin-Resource-Policy: cross-origin');

$isRangeRequest = isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=\h*(\d*)-(\d*)[\D.*]?/i', $_SERVER['HTTP_RANGE'], $matches);

if ($isRangeRequest) {
    $start = $matches[1] !== '' ? (int)$matches[1] : 0;
    $end = $matches[2] !== '' ? (int)$matches[2] : ($fileSize - 1);

    if ($matches[1] === '' && $matches[2] !== '') {
        // Suffix range: -500 means last 500 bytes
        $suffixLength = (int)$matches[2];
        $start = max(0, $fileSize - $suffixLength);
        $end = $fileSize - 1;
    }

    if ($start > $end || $start >= $fileSize) {
        http_response_code(416);
        header("Content-Range: bytes */{$fileSize}");
        exit;
    }

    $end = min($end, $fileSize - 1);
    $length = $end - $start + 1;

    http_response_code(206);
    header("Content-Type: {$mime}");
    header("Content-Range: bytes {$start}-{$end}/{$fileSize}");
    header("Content-Length: {$length}");

    $fp = fopen($targetPath, 'rb');
    if ($fp === false) {
        http_response_code(500);
        exit;
    }

    fseek($fp, $start);
    $bytesRemaining = $length;
    $chunkSize = 64 * 1024; // 64KB buffer

    while ($bytesRemaining > 0 && !feof($fp) && connection_status() === CONNECTION_NORMAL) {
        $readSize = min($chunkSize, $bytesRemaining);
        $data = fread($fp, $readSize);
        if ($data === false) {
            break;
        }
        echo $data;
        flush();
        $bytesRemaining -= strlen($data);
    }

    fclose($fp);
    exit;
}

// Full file response
header("Content-Type: {$mime}");
header("Content-Length: {$fileSize}");
readfile($targetPath);
exit;
