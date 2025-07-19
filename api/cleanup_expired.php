<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';

try {
    $GLOBALS['logger']->info('Starting cleanup of expired files.');

    $pdo = db();
    $pdo->beginTransaction();

    // Cleanup expired prompts
    $stmt_prompts = $pdo->prepare(
        'SELECT id, filename FROM prompts WHERE created_at < NOW() - INTERVAL \'1 week\''
    );
    $stmt_prompts->execute();
    $expired_prompts = $stmt_prompts->fetchAll(PDO::FETCH_ASSOC);

    foreach ($expired_prompts as $prompt) {
        $file_path = __DIR__ . '/../uploads/' . $prompt['filename'];
        if (file_exists($file_path)) {
            if (unlink($file_path)) {
                $GLOBALS['logger']->info('Deleted expired prompt file.', ['filename' => $prompt['filename']]);
                $delete_stmt = $pdo->prepare('DELETE FROM prompts WHERE id = ?');
                $delete_stmt->execute([$prompt['id']]);
            } else {
                $GLOBALS['logger']->error('Failed to delete expired prompt file.', ['filename' => $prompt['filename']]);
            }
        } else {
            $GLOBALS['logger']->warning('Expired prompt file not found, deleting record.', ['filename' => $prompt['filename']]);
            $delete_stmt = $pdo->prepare('DELETE FROM prompts WHERE id = ?');
            $delete_stmt->execute([$prompt['id']]);
        }
    }

    // Cleanup expired responses
    $stmt_responses = $pdo->prepare(
        'SELECT id, filename FROM responses WHERE created_at < NOW() - INTERVAL \'1 week\''
    );
    $stmt_responses->execute();
    $expired_responses = $stmt_responses->fetchAll(PDO::FETCH_ASSOC);

    foreach ($expired_responses as $response) {
        $file_path = __DIR__ . '/../uploads/' . $response['filename'];
        if (file_exists($file_path)) {
            if (unlink($file_path)) {
                $GLOBALS['logger']->info('Deleted expired response file.', ['filename' => $response['filename']]);
                $delete_stmt = $pdo->prepare('DELETE FROM responses WHERE id = ?');
                $delete_stmt->execute([$response['id']]);
            } else {
                $GLOBALS['logger']->error('Failed to delete expired response file.', ['filename' => $response['filename']]);
            }
        }
    } else {
            $GLOBALS['logger']->warning('Expired response file not found, deleting record.', ['filename' => $response['filename']]);
            $delete_stmt = $pdo->prepare('DELETE FROM responses WHERE id = ?');
            $delete_stmt->execute([$response['id']]);
        }
    }

    $pdo->commit();
    $GLOBALS['logger']->info('Cleanup of expired files finished.');

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $GLOBALS['logger']->critical('Unhandled exception in cleanup_expired.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo "An error occurred during cleanup.";
}