<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/push_notifications.php';

header('Content-Type: application/json');

if (!push_is_enabled()) {
    http_response_code(400);
    echo json_encode(['error' => 'Push notifications are not enabled.']);
    return;
}

require_login();

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    return;
}

$endpoint = trim((string)($data['endpoint'] ?? ''));
$keys = $data['keys'] ?? [];
$p256dh = trim((string)($keys['p256dh'] ?? ''));
$auth = trim((string)($keys['auth'] ?? ''));
$expiresAt = isset($data['expirationTime']) && $data['expirationTime'] !== null
    ? date('c', (int)($data['expirationTime'] / 1000))
    : null;

if ($endpoint === '' || $p256dh === '' || $auth === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing subscription fields']);
    return;
}

$user = $_SESSION['user'];
$pdo = db();

$stmt = $pdo->prepare(
    'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, expires_at, last_used_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON CONFLICT (user_id, endpoint)
     DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, expires_at = EXCLUDED.expires_at, last_used_at = NOW()'
);
$stmt->execute([
    $user['id'],
    $endpoint,
    $p256dh,
    $auth,
    $expiresAt,
]);

$GLOBALS['logger']->info('Push subscription saved.', [
    'user_id' => $user['id'],
    'endpoint_hash' => substr(hash('sha1', $endpoint), 0, 10),
]);

echo json_encode(['status' => 'subscribed']);
