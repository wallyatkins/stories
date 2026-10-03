<?php
declare(strict_types=1);

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/WallyAuthClient.php';

start_session();

$state = $_GET['state'] ?? '';
$code = $_GET['code'] ?? '';
$error = $_GET['error'] ?? '';

if ($error !== '') {
    $GLOBALS['logger']->warning('WallyAuth login error returned', ['error' => $error]);
    header('Location: /login?error=' . urlencode($error));
    exit;
}

$savedState = $_SESSION['oauth_state'] ?? '';
$codeVerifier = $_SESSION['oauth_code_verifier'] ?? '';
unset($_SESSION['oauth_state'], $_SESSION['oauth_code_verifier']);

if ($state === '' || $state !== $savedState || $code === '') {
    $GLOBALS['logger']->warning('Invalid OAuth state or missing authorization code');
    header('Location: /login?error=' . urlencode('Invalid authentication state. Please try again.'));
    exit;
}

try {
    $client = new WallyAuthClient();
    $tokens = $client->exchangeCodeForTokens($code, $codeVerifier);
    $userInfo = $client->getUserInfo($tokens['access_token']);

    $sub = (string)($userInfo['sub'] ?? '');
    $rawEmail = (string)($userInfo['email'] ?? '');
    $email = normalize_email($rawEmail);
    $name = (string)($userInfo['name'] ?? $userInfo['preferred_username'] ?? $userInfo['username'] ?? '');
    $picture = (string)($userInfo['picture'] ?? $userInfo['avatar'] ?? $userInfo['avatar_url'] ?? '');

    if ($email === '') {
        throw new \RuntimeException('WallyAuth did not provide a verified email address.');
    }

    $pdo = db();
    
    // Look up by email first, or wallyauth_sub
    $stmt = $pdo->prepare('SELECT id, email, username, avatar, wallyauth_sub FROM users WHERE email = ? OR (wallyauth_sub IS NOT NULL AND wallyauth_sub = ?)');
    $stmt->execute([$email, $sub]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Auto-provision user account from WallyAuth profile
        $username = $name !== '' ? $name : explode('@', $email)[0];
        $avatarVal = $picture !== '' ? $picture : null;
        $insert = $pdo->prepare('INSERT INTO users (email, username, avatar, wallyauth_sub) VALUES (?, ?, ?, ?) RETURNING id, email, username, avatar, wallyauth_sub');
        $insert->execute([$email, $username, $avatarVal, $sub]);
        $user = $insert->fetch(PDO::FETCH_ASSOC);
        $GLOBALS['logger']->info('Provisioned new user via WallyAuth SSO', ['user_id' => $user['id'], 'email' => $email]);
    } else {
        $updates = [];
        $params = [];

        if (empty($user['wallyauth_sub']) && $sub !== '') {
            $updates[] = 'wallyauth_sub = ?';
            $params[] = $sub;
            $user['wallyauth_sub'] = $sub;
        }

        // Sync WallyAuth avatar if provided and currently null or external
        if ($picture !== '' && ($user['avatar'] === null || str_starts_with((string)$user['avatar'], 'http'))) {
            $updates[] = 'avatar = ?';
            $params[] = $picture;
            $user['avatar'] = $picture;
        }

        if (empty($user['username']) && $name !== '') {
            $updates[] = 'username = ?';
            $params[] = $name;
            $user['username'] = $name;
        }

        if (!empty($updates)) {
            $params[] = $user['id'];
            $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $pdo->prepare($sql)->execute($params);
        }
    }

    $_SESSION['user'] = $user;
    if (!empty($tokens['access_token'])) {
        $_SESSION['oauth_access_token'] = $tokens['access_token'];
    }

    $GLOBALS['logger']->info('WallyAuth SSO login successful', ['user_id' => $user['id'], 'email' => $user['email']]);

    $returnTo = $_SESSION['oauth_return_to'] ?? '/contacts';
    unset($_SESSION['oauth_return_to']);

    header('Location: ' . $returnTo);
    exit;
} catch (\Throwable $e) {
    $GLOBALS['logger']->error('WallyAuth callback exception', ['exception' => $e->getMessage()]);
    header('Location: /login?error=' . urlencode('Authentication failed: ' . $e->getMessage()));
    exit;
}
