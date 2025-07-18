<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

try {
    require_login();
    header('Content-Type: application/json');

    $user = $_SESSION['user'];
    $GLOBALS['logger']->info('List prompts request.', ['user_id' => $user['id']]);

    $pdo = db();
    // Select prompts sent to the current user and join to get the sender's info
    $stmt = $pdo->prepare(
        'SELECT p.filename, p.created_at, u.username, u.email AS user_email
         FROM prompts p
         JOIN users u ON p.user_id = u.id
         WHERE p.friend_id = ?
         ORDER BY p.created_at DESC'
    );
    $stmt->execute([$user['id']]);
    $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($prompts);

} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in list_prompts.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
