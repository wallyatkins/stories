<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
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

// Get prompt ID from the database
$pdo = db();
$stmt = $pdo->prepare('SELECT id FROM prompts WHERE filename = ?');
$stmt->execute([$prompt]);
$promptId = $stmt->fetchColumn();

if (!$promptId) {
    http_response_code(404);
    $GLOBALS['logger']->error('Prompt not found in database for response.', ['prompt_filename' => $prompt]);
    echo json_encode(['error' => 'Prompt not found.']);
    exit;
}

// Save the response to the database
$stmt = $pdo->prepare('INSERT INTO responses (prompt_id, user_id, filename) VALUES (?, ?, ?)');
$stmt->execute([$promptId, $user['id'], $filename]);

$GLOBALS['logger']->info('Response metadata updated in database.', ['user_id' => $user['id'], 'prompt_id' => $promptId, 'filename' => $filename]);

echo json_encode(['filename' => $filename]);

