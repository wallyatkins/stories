<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_login();
header('Content-Type: application/json');

$user = $_SESSION['user'];
$prompt = basename($_GET['prompt'] ?? '');

$GLOBALS['logger']->info('Listing responses for prompt.', [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'prompt' => $prompt
]);

$metadataDir = __DIR__ . '/../metadata';
$responsesFile = "$metadataDir/$prompt.json";
if ($prompt === '' || !file_exists($responsesFile)) {
    $GLOBALS['logger']->info('No responses found for prompt or prompt not specified.', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'prompt' => $prompt
    ]);
    echo '[]';
    exit;
}
$contents = file_get_contents($responsesFile);
if ($contents === false) {
    $GLOBALS['logger']->error('Failed to read responses file.', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'prompt' => $prompt,
        'file' => $responsesFile
    ]);
    echo '[]';
    exit;
}

$responses = json_decode($contents, true);
$GLOBALS['logger']->info('Successfully retrieved responses for prompt.', [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'prompt' => $prompt,
    'response_count' => count($responses)
]);

echo $contents;

