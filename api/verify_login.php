<?php
require_once __DIR__ . '/../api/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_https();
$prompt = basename($_GET['prompt'] ?? '');
start_session();

$logger->info('Login verification attempt');

$token = $_GET['token'] ?? '';
$tokenFile = __DIR__ . '/../metadata/tokens/' . basename($token) . '.json';
if ($token !== '' && file_exists($tokenFile)) {
    $data = json_decode(file_get_contents($tokenFile), true);
    $email = $data['email'] ?? '';
    $created = $data['ts'] ?? 0;
    $expired = (time() - $created) > 900; // 15 minutes
    unlink($tokenFile);
    if ($expired) {
        $logger->warning('Login verification failed: Expired token', ['email' => $email]);
        header('Content-Type: text/html; charset=UTF-8');
        echo '<!DOCTYPE html><html><body>';
        echo '<p>Login link expired. Request a new link below.</p>';
        echo '<form method="post" action="/api/request_login">';
        echo '<input type="email" name="email" required placeholder="Email" />';
        echo '<button type="submit">Send Login Link</button>';
        echo '</form></body></html>';
        exit;
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, email, username, avatar FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        $logger->warning('Login verification failed: User not found in database', ['email' => $email]);
        http_response_code(400);
        echo 'Invalid user';
        exit;
    }

    $friendStmt = $pdo->prepare('SELECT u.id, u.email, u.username, u.avatar FROM friends f JOIN users u ON f.friend_user_id = u.id WHERE f.user_id = ?');
    $friendStmt->execute([$user['id']]);
    $friends = $friendStmt->fetchAll(PDO::FETCH_ASSOC);

    $_SESSION['user'] = $user;
    $_SESSION['friends'] = $friends;
    $logger->info('Login successful', ['user_id' => $user['id'], 'email' => $user['email']]);
    $redirect = '/prompts';
    if ($prompt !== '') {
        $redirect .= '?prompt=' . rawurlencode($prompt);
    }
    header('Location: ' . $redirect);
    exit;
}

$logger->warning('Login verification failed: Invalid or missing token');
header('Content-Type: text/plain');
http_response_code(400);
echo 'Invalid or expired token';
