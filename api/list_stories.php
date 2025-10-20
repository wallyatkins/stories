<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

try {
    require_login();
    header('Content-Type: application/json');

    $user = $_SESSION['user'];
    $GLOBALS['logger']->info('List stories request.', ['user_id' => $user['id']]);

    $pdo = db();

    // Select responses to prompts created by the current user (received stories)
    $stmt_received = $pdo->prepare(
        'SELECT r.filename, r.created_at, r.status, r.processed_manifest, r.processed_at,
                p.filename as prompt_filename, u.username, u.email AS user_email
         FROM responses r
         JOIN prompts p ON r.prompt_id = p.id
         JOIN users u ON r.user_id = u.id
         WHERE p.user_id = ?
           AND r.status = \'processed\'
           AND r.created_at >= NOW() - INTERVAL \'1 week\'
         ORDER BY r.created_at DESC'
    );
    $stmt_received->execute([$user['id']]);
    $received_stories = $stmt_received->fetchAll(PDO::FETCH_ASSOC);

    // Select responses created by the current user (sent stories)
    $stmt_sent = $pdo->prepare(
        'SELECT r.filename, r.created_at, r.status, r.processed_manifest, r.processed_at,
                p.filename as prompt_filename, u.username, u.email AS user_email
         FROM responses r
         JOIN prompts p ON r.prompt_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE r.user_id = ? AND r.created_at >= NOW() - INTERVAL \'1 week\'
         ORDER BY r.created_at DESC'
    );
    $stmt_sent->execute([$user['id']]);
    $sent_stories = $stmt_sent->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['received' => $received_stories, 'sent' => $sent_stories]);

} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in list_stories.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
