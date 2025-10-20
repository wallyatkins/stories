<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

try {
    require_login();
    header('Content-Type: application/json');

    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Prompt ID is required.']);
        exit;
    }

    $prompt_id = $_GET['id'];
    $user = $_SESSION['user'];
    $GLOBALS['logger']->info('Get prompt request.', ['user_id' => $user['id'], 'prompt_id' => $prompt_id]);

    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT p.id, p.filename, p.created_at, p.processed_manifest, p.processed_at, p.status,
                u.username, u.email AS user_email
         FROM prompts p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ? AND p.friend_id = ? AND p.status = \'processed\''
    );
    $stmt->execute([$prompt_id, $user['id']]);
    $prompt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$prompt) {
        http_response_code(404);
        echo json_encode(['error' => 'Prompt not found or not authorized.']);
        exit;
    }

    echo json_encode($prompt);

} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in get_prompt.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
