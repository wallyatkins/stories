<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_https();
start_session();
$token = $_GET['token'] ?? '';
$tokenFile = __DIR__ . '/../metadata/tokens/' . basename($token) . '.json';
if ($token !== '' && file_exists($tokenFile)) {
    $data = json_decode(file_get_contents($tokenFile), true);
    unlink($tokenFile);
    $email = $data['email'];

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, email, username, avatar FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(400);
        echo 'Invalid user';
        exit;
    }

    $friendStmt = $pdo->prepare('SELECT u.id, u.email, u.username, u.avatar FROM friends f JOIN users u ON f.friend_user_id = u.id WHERE f.user_id = ?');
    $friendStmt->execute([$user['id']]);
    $friends = $friendStmt->fetchAll(PDO::FETCH_ASSOC);

    $_SESSION['user'] = $user;
    $_SESSION['friends'] = $friends;
    header('Location: /');
    exit;
}
header('Content-Type: text/plain');
http_response_code(400);
echo 'Invalid or expired token';
