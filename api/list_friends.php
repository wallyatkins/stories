<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

require_login();

$user = $_SESSION['user'];
$pdo = db();

header('Content-Type: application/json');

$GLOBALS['logger']->info('Listing friends for user.', ['user_id' => $user['id'], 'email' => $user['email']]);

// Return all registered users in the stories family circle with activity metrics
$stmt = $pdo->prepare(
    'SELECT u.id,
            u.email,
            u.username,
            u.avatar,
            COALESCE((SELECT COUNT(*) FROM prompts p WHERE p.user_id = ? AND p.friend_id = u.id), 0) AS prompts_sent,
            COALESCE((SELECT COUNT(*) FROM prompts p WHERE p.user_id = u.id AND p.friend_id = ?), 0) AS prompts_received
     FROM users u
     WHERE u.id != ?
     ORDER BY COALESCE(NULLIF(u.username, \'\'), u.email) ASC'
);
$stmt->execute([$user['id'], $user['id'], $user['id']]);
$friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

$GLOBALS['logger']->info('Found contacts for user.', ['user_id' => $user['id'], 'email' => $user['email'], 'contact_count' => count($friends)]);

echo json_encode($friends);
