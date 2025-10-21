<?php
require_once __DIR__ . '/../api/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
$prompt = basename($_GET['prompt'] ?? '');
$responseFilename = basename($_GET['response'] ?? '');
start_session();

$token = $_GET['token'] ?? '';
$GLOBALS['logger']->info('Login verification attempt.', ['token' => $token]);

$tokenFile = __DIR__ . '/../metadata/tokens/' . basename($token) . '.json';
if ($token !== '' && file_exists($tokenFile)) {
    $data = json_decode(file_get_contents($tokenFile), true);
    $rawEmail = $data['email'] ?? '';
    $email = normalize_email($rawEmail);
    $trustDevice = !empty($data['trust_device']);
    $created = $data['ts'] ?? 0;
    $expired = (time() - $created) > 900; // 15 minutes
    unlink($tokenFile);
    if ($email === '') {
        $GLOBALS['logger']->warning('Login verification failed: Token missing email');
        header('Location: /');
        exit;
    }

    if ($expired) {
        $GLOBALS['logger']->warning('Login verification failed: Expired token', ['email' => $email, 'token_email' => $rawEmail]);
        header('Location: /');
        exit;
    }

    $GLOBALS['logger']->info('Login token validated.', ['email' => $email, 'token_email' => $rawEmail, 'trust_device' => $trustDevice]);

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, email, username, avatar FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        $GLOBALS['logger']->warning('Login verification failed: User not found in database', ['email' => $email]);
        http_response_code(400);
        echo 'Invalid user';
        exit;
    }

    $_SESSION['user'] = $user;
    if ($trustDevice) {
        set_trusted_device_cookie($user);
    } else {
        clear_trusted_device_cookie();
    }
    $GLOBALS['logger']->info('Login successful', ['user_id' => $user['id'], 'email' => $user['email']]);
    $redirect = '/contacts';
    if ($responseFilename !== '') {
        $redirect = '/watch/' . rawurlencode($responseFilename);
    } elseif ($prompt !== '') {
        $redirect = '/prompts?prompt=' . rawurlencode($prompt);
    }
    header('Location: ' . $redirect);
    exit;
}

$GLOBALS['logger']->warning('Login verification failed: Invalid or missing token');
header('Location: /');
exit;
