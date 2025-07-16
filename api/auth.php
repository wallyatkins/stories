<?php
require_once __DIR__ . '/logger.php';

function require_https() {
    if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
        $GLOBALS['logger']->info('Redirecting to HTTPS');
        $url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        header('Location: ' . $url, true, 301);
        exit;
    }
}

function start_session() {
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
?>
