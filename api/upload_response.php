<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_https();
require_login();
header('Content-Type: application/json');

$user = $_SESSION['user'];
$prompt = basename($_GET['prompt'] ?? '');

$GLOBALS['logger']->info('Response upload request.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt]);

if ($prompt === '' || $_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
    http_response_code(400);
    $GLOBALS['logger']->warning('Response upload failed: Invalid request.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt]);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}
$uploadsDir = __DIR__ . '/../uploads';
$metadataDir = __DIR__ . '/../metadata';
foreach ([$uploadsDir, $metadataDir] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
}
$filename = time() . '-' . basename($_FILES['video']['name']);
move_uploaded_file($_FILES['video']['tmp_name'], "$uploadsDir/$filename");

$GLOBALS['logger']->info('Response video uploaded.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt, 'filename' => $filename]);

$responsesFile = "$metadataDir/$prompt.json";
$responses = file_exists($responsesFile) ? json_decode(file_get_contents($responsesFile), true) : [];
$responses[] = ['filename' => $filename, 'user' => $user];
file_put_contents($responsesFile, json_encode($responses, JSON_PRETTY_PRINT));

$GLOBALS['logger']->info('Response metadata updated.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt, 'filename' => $filename]);

echo json_encode(['filename' => $filename]);

