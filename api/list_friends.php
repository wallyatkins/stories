<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

require_https();
require_login();

$user = $_SESSION['user'];
$pdo = db();

header('Content-Type: application/json');

$GLOBALS['logger']->info('Listing friends for user.', ['user_id' => $user['id'], 'email' => $user['email']]);

$stmt = $pdo->prepare('SELECT u.id, u.email, u.username, u.avatar FROM friends f JOIN users u ON f.friend_user_id = u.id WHERE f.user_id = ?');
$stmt->execute([$user['id']]);
$friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

$GLOBALS['logger']->info('Found friends for user.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_count' => count($friends)]);

echo json_encode($friends);
