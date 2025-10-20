<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$config = require __DIR__ . '/../config.php';

function send_email(array $config, string $toEmail, string $subject, string $htmlBody, string $textBody): void
{
    if ($toEmail === '') {
        return;
    }

    try {
        if (!empty($config['email']['smtp']['host'])) {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $config['email']['smtp']['host'];
            $mail->Port = $config['email']['smtp']['port'];
            if (!empty($config['email']['smtp']['username'])) {
                $mail->SMTPAuth = true;
                $mail->Username = $config['email']['smtp']['username'];
                $mail->Password = $config['email']['smtp']['password'];
            }
            if (!empty($config['email']['smtp']['secure'])) {
                $mail->SMTPSecure = $config['email']['smtp']['secure'];
            }
            $mail->setFrom($config['email']['from']);
            $mail->addAddress($toEmail);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = $textBody;
            $mail->send();
        } else {
            $headers = 'From: ' . $config['email']['from'] . "\r\n" . 'Content-Type: text/plain; charset=UTF-8';
            if (!@mail($toEmail, $subject, $textBody, $headers)) {
                throw new Exception('mail() function failed');
            }
        }
        $GLOBALS['logger']->info('Email dispatched.', ['to' => $toEmail, 'subject' => $subject]);
    } catch (Exception $e) {
        $GLOBALS['logger']->error('Failed to send email.', [
            'to' => $toEmail,
            'subject' => $subject,
            'error' => $e->getMessage(),
        ]);
    }
}

try {
    require_login();
    header('Content-Type: application/json');

    $user = $_SESSION['user'];
    $GLOBALS['logger']->info('Prompt upload request.', ['user_id' => $user['id'], 'email' => $user['email']]);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
        http_response_code(400);
        $GLOBALS['logger']->warning('Prompt upload failed: Invalid request.', ['user_id' => $user['id'], 'email' => $user['email']]);
        echo json_encode(['error' => 'No video uploaded']);
        exit;
    }

    $videoFile = $_FILES['video'];
    if ($videoFile['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $GLOBALS['logger']->error('Video upload error.', ['error_code' => $videoFile['error']]);
        echo json_encode(['error' => 'Video upload failed with error code: ' . $videoFile['error']]);
        exit;
    }

    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir) && !mkdir($uploadsDir, 0777, true)) {
        $GLOBALS['logger']->error('Failed to create uploads directory.', ['directory' => $uploadsDir]);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create uploads directory.']);
        exit;
    }

    $pdo = db();
    $friendId = intval($_POST['friend_id'] ?? 0);
    $friend = null;
    if ($friendId > 0) {
        $stmt = $pdo->prepare('SELECT id, email, username FROM users WHERE id = ?');
        $stmt->execute([$friendId]);
        $friend = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if (!$friend) {
            $GLOBALS['logger']->warning('Friend not found for prompt.', ['friend_id' => $friendId, 'user_id' => $user['id']]);
        }
    }

    $id = time();
    $filename = $id . '-' . basename($videoFile['name']);
    $destination = "$uploadsDir/$filename";
    if (!move_uploaded_file($videoFile['tmp_name'], $destination)) {
        $GLOBALS['logger']->error('Failed to move uploaded file.', ['destination' => $destination]);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save uploaded file.']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO prompts (user_id, friend_id, filename, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([$user['id'], $friendId, $filename, 'pending']);
    $promptId = $pdo->lastInsertId();
    $GLOBALS['logger']->info('Prompt saved to database with pending status.', [
        'user_id' => $user['id'],
        'friend_id' => $friendId,
        'filename' => $filename,
        'prompt_id' => $promptId,
    ]);

    $friendLabel = $friend['username'] ?? $friend['email'] ?? 'your friend';
    $recipientName = $user['username'] ?? $user['email'];
    $subject = 'We received your story prompt';
    $textBody = "Hi $recipientName,\n\nWe received your story prompt for $friendLabel. We'll process it shortly and email them once it's ready to watch.\n\nThanks for sharing,\nThe Stories Team";
    $htmlBody = <<<HTML
<p>Hi {$recipientName},</p>
<p>We received your story prompt for <strong>{$friendLabel}</strong>. We'll process it shortly and email them once it's ready to watch.</p>
<p>Thanks for sharing,<br>The Stories Team</p>
HTML;
    send_email($config, $user['email'], $subject, $htmlBody, $textBody);

    echo json_encode([
        'id' => $promptId,
        'filename' => $filename,
        'status' => 'pending',
    ]);

} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in upload_prompt.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
