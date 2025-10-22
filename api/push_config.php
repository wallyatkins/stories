<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/push_notifications.php';

header('Content-Type: application/json');

if (!push_is_enabled()) {
    echo json_encode(['enabled' => false]);
    return;
}

$config = push_config();

echo json_encode([
    'enabled' => true,
    'vapidPublicKey' => $config['vapid']['public'],
]);
