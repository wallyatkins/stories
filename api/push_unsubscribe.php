<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

require_login();

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    return;
}

$endpoint = trim((string)($data['endpoint'] ?? ''));
if ($endpoint === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing endpoint']);
    return;
}

$user = $_SESSION['user'];
$pdo = db();

$del = $pdo->prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?');
$del->execute([$user['id'], $endpoint]);

$GLOBALS['logger']->info('Push subscription removed.', [
    'user_id' => $user['id'],
    'endpoint_hash' => substr(hash('sha1', $endpoint), 0, 10),
]);

echo json_encode(['status' => 'unsubscribed']);
