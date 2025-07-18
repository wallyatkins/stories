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
    // Select responses to prompts created by the current user
    $stmt = $pdo->prepare(
        'SELECT r.filename, r.created_at, p.filename as prompt_filename, u.username, u.email AS user_email
         FROM responses r
         JOIN prompts p ON r.prompt_id = p.id
         JOIN users u ON r.user_id = u.id
         WHERE p.user_id = ?
         ORDER BY r.created_at DESC'
    );
    $stmt->execute([$user['id']]);
    $stories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($stories);

} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in list_stories.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
