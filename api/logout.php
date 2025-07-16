<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_https();
start_session();

$log_context = [];
if (isset($_SESSION['user'])) {
    $log_context['user_id'] = $_SESSION['user']['id'];
    $log_context['email'] = $_SESSION['user']['email'];
}

$GLOBALS['logger']->info('User logging out.', $log_context);

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}
session_destroy();
header('Content-Type: application/json');
echo json_encode(['loggedOut' => true]);

