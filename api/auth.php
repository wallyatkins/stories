<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';

const REMEMBER_COOKIE_NAME = 'story_trusted_device';
const REMEMBER_COOKIE_TTL = 60 * 60 * 24 * 30; // 30 days

function start_session() {
    if (session_status() === PHP_SESSION_NONE) {
        $savePath = __DIR__ . '/../metadata/sessions';
        if (!is_dir($savePath)) {
            mkdir($savePath, 0777, true);
        }
        session_save_path($savePath);
        session_start();
        $GLOBALS['logger']->info('Session started', ['session_id' => session_id(), 'save_path' => $savePath]);
        if (!isset($_SESSION['user'])) {
            attempt_trusted_login();
        }
    }
}

function require_login() {
    start_session();
    if (!isset($_SESSION['user'])) {
        $GLOBALS['logger']->warning('Authentication required, but user not logged in.');
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    $GLOBALS['logger']->info('Login check passed.', ['user_id' => $_SESSION['user']['id'], 'email' => $_SESSION['user']['email']]);
}

function check_login() {
    start_session();
    $isLoggedIn = isset($_SESSION['user']);
    $log_context = ['is_logged_in' => $isLoggedIn];
    if ($isLoggedIn) {
        $log_context['user_id'] = $_SESSION['user']['id'];
        $log_context['email'] = $_SESSION['user']['email'];
    }
    $GLOBALS['logger']->info('Checking user login status.', $log_context);
    return $isLoggedIn;
}

function normalize_email(string $email): string {
    $trimmed = trim($email);
    if ($trimmed === '') {
        return '';
    }

    $lower = strtolower($trimmed);
    $parts = explode('@', $lower, 2);
    if (count($parts) !== 2) {
        return $lower;
    }

    [$local, $domain] = $parts;
    if ($domain === 'gmail.com' || $domain === 'googlemail.com') {
        $plusPosition = strpos($local, '+');
        if ($plusPosition !== false) {
            $local = substr($local, 0, $plusPosition);
        }
        $local = str_replace('.', '', $local);
        $domain = 'gmail.com';
    }

    return $local . '@' . $domain;
}

function is_https_request(): bool {
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    return isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https';
}

function set_trusted_device_cookie(array $user): void {
    $selector = bin2hex(random_bytes(9));
    $verifier = bin2hex(random_bytes(32));
    $hash = hash('sha256', $verifier);
    $expiresAt = (new DateTimeImmutable('+30 days'))->format('Y-m-d H:i:s');

    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO remember_tokens (user_id, selector, validator_hash, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $user['id'],
        $selector,
        $hash,
        substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        $_SERVER['REMOTE_ADDR'] ?? null,
        $expiresAt,
    ]);

    prune_old_trusted_tokens($user['id']);

    $cookieValue = $selector . ':' . $verifier;
    $options = [
        'expires' => time() + REMEMBER_COOKIE_TTL,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
    setcookie(REMEMBER_COOKIE_NAME, $cookieValue, $options);
    $GLOBALS['logger']->info('Trusted device cookie issued.', ['user_id' => $user['id']]);
}

function prune_old_trusted_tokens(int $userId): void {
    $pdo = db();
    $pdo->prepare('DELETE FROM remember_tokens WHERE expires_at < NOW()')->execute();

    $stmt = $pdo->prepare('SELECT id FROM remember_tokens WHERE user_id = ? ORDER BY last_used_at DESC');
    $stmt->execute([$userId]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $maxTokens = 5;
    if (count($ids) > $maxTokens) {
        $idsToDelete = array_slice($ids, $maxTokens);
        $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));
        $del = $pdo->prepare("DELETE FROM remember_tokens WHERE id IN ($placeholders)");
        $del->execute($idsToDelete);
    }
}

function clear_trusted_device_cookie(): void {
    if (!isset($_COOKIE[REMEMBER_COOKIE_NAME])) {
        return;
    }
    $cookieValue = $_COOKIE[REMEMBER_COOKIE_NAME];
    unset($_COOKIE[REMEMBER_COOKIE_NAME]);
    $options = [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
    setcookie(REMEMBER_COOKIE_NAME, '', $options);

    $parts = explode(':', $cookieValue, 2);
    if (count($parts) !== 2) {
        return;
    }

    $selector = $parts[0];
    if ($selector === '') {
        return;
    }

    $pdo = db();
    $del = $pdo->prepare('DELETE FROM remember_tokens WHERE selector = ?');
    $del->execute([$selector]);
    $GLOBALS['logger']->info('Trusted device cookie cleared.');
}

function attempt_trusted_login(): void {
    if (!isset($_COOKIE[REMEMBER_COOKIE_NAME])) {
        return;
    }

    $cookieValue = $_COOKIE[REMEMBER_COOKIE_NAME];
    $parts = explode(':', $cookieValue, 2);
    if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
        clear_trusted_device_cookie();
        return;
    }

    [$selector, $verifier] = $parts;
    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM remember_tokens WHERE selector = ? LIMIT 1');
    $stmt->execute([$selector]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$token) {
        clear_trusted_device_cookie();
        return;
    }

    if (strtotime($token['expires_at']) < time()) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE id = ?')->execute([$token['id']]);
        clear_trusted_device_cookie();
        return;
    }

    $expectedHash = $token['validator_hash'];
    $actualHash = hash('sha256', $verifier);
    if (!hash_equals($expectedHash, $actualHash)) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE id = ?')->execute([$token['id']]);
        clear_trusted_device_cookie();
        $GLOBALS['logger']->warning('Trusted device token mismatch detected.', ['selector' => $selector]);
        return;
    }

    $userStmt = $pdo->prepare('SELECT id, email, username, avatar FROM users WHERE id = ?');
    $userStmt->execute([$token['user_id']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE id = ?')->execute([$token['id']]);
        clear_trusted_device_cookie();
        return;
    }

    $_SESSION['user'] = $user;

    $newVerifier = bin2hex(random_bytes(32));
    $newHash = hash('sha256', $newVerifier);
    $newExpires = (new DateTimeImmutable('+30 days'))->format('Y-m-d H:i:s');
    $update = $pdo->prepare('UPDATE remember_tokens SET validator_hash = ?, expires_at = ?, last_used_at = NOW(), user_agent = ?, ip_address = ? WHERE id = ?');
    $update->execute([
        $newHash,
        $newExpires,
        substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        $_SERVER['REMOTE_ADDR'] ?? null,
        $token['id'],
    ]);

    $cookieOptions = [
        'expires' => time() + REMEMBER_COOKIE_TTL,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
    setcookie(REMEMBER_COOKIE_NAME, $selector . ':' . $newVerifier, $cookieOptions);
    $GLOBALS['logger']->info('Trusted device session restored.', ['user_id' => $user['id']]);
}
?>
