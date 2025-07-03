<?php
function require_https() {
    if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
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
    }
}

function require_login() {
    start_session();
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
}

function check_login() {
    start_session();
    return isset($_SESSION['user']);
}
?>
