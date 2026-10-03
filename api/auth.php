<?php
declare(strict_types=1);

require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $savePath = __DIR__ . '/../metadata/sessions';
        if (!is_dir($savePath)) {
            mkdir($savePath, 0777, true);
        }
        session_save_path($savePath);
        session_start();
        $GLOBALS['logger']->info('Session started', ['session_id' => session_id(), 'save_path' => $savePath]);
    }
}

function require_login(): void {
    start_session();
    if (!isset($_SESSION['user']) || empty($_SESSION['user']['id'])) {
        $GLOBALS['logger']->notice('Authentication required, but user not logged in.', [
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
        ]);
        http_response_code(401);
        echo json_encode([
            'error' => 'Authentication required',
            'login_url' => '/api/oauth_login.php',
        ]);
        exit;
    }
    $GLOBALS['logger']->info('Login check passed.', [
        'user_id' => $_SESSION['user']['id'],
        'email' => $_SESSION['user']['email'] ?? 'unknown',
    ]);
}

function check_login(): bool {
    start_session();
    $isLoggedIn = isset($_SESSION['user']) && !empty($_SESSION['user']['id']);
    $log_context = ['is_logged_in' => $isLoggedIn];
    if ($isLoggedIn) {
        $log_context['user_id'] = $_SESSION['user']['id'];
        $log_context['email'] = $_SESSION['user']['email'] ?? 'unknown';
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
