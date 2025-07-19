<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    require_login();
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['prompt_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Prompt ID is required.']);
        exit;
    }

    $prompt_id = $data['prompt_id'];
    $user = $_SESSION['user'];
    $GLOBALS['logger']->info('Decline prompt request.', ['user_id' => $user['id'], 'prompt_id' => $prompt_id]);

    $pdo = db();

    // Get prompt details to notify the sender
    $stmt = $pdo->prepare(
        'SELECT p.user_id, u.email AS sender_email, u.username AS sender_username
         FROM prompts p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = ? AND p.friend_id = ?'
    );
    $stmt->execute([$prompt_id, $user['id']]);
    $prompt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$prompt) {
        http_response_code(404);
        echo json_encode(['error' => 'Prompt not found or not authorized.']);
        exit;
    }

    // Delete the prompt
    $stmt = $pdo->prepare('DELETE FROM prompts WHERE id = ?');
    $stmt->execute([$prompt_id]);

    // Send email notification
    $mail = new PHPMailer(true);
    try {
        //Server settings
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST'];
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'];
        $mail->Password = $_ENV['SMTP_PASS'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $_ENV['SMTP_PORT'];

        //Recipients
        $mail->setFrom($_ENV['EMAIL_FROM'], 'Stories');
        $mail->addAddress($prompt['sender_email'], $prompt['sender_username']);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Your prompt was declined';
        $mail->Body    = "Hi {$prompt['sender_username']},<br><br>Your prompt to {$user['username']} was declined.<br><br>Thanks,<br>The Stories Team";
        $mail->AltBody = "Hi {$prompt['sender_username']},\n\nYour prompt to {$user['username']} was declined.\n\nThanks,\nThe Stories Team";

        $mail->send();
        $GLOBALS['logger']->info('Sent prompt declined email.', ['recipient' => $prompt['sender_email']]);
    } catch (Exception $e) {
        $GLOBALS['logger']->error('Failed to send prompt declined email.', ['error' => $mail->ErrorInfo]);
    }


    echo json_encode(['success' => true]);

} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in decline_prompt.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}