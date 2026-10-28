<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/push_notifications.php';

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

    $stmt = $pdo->prepare('INSERT INTO prompts (user_id, friend_id, filename, status) VALUES (?, ?, ?, ?) RETURNING id');
    $stmt->execute([$user['id'], $friendId, $filename, 'ready']);
    $promptId = $stmt->fetchColumn();
    $GLOBALS['logger']->info('Prompt saved to database with ready status.', [
        'user_id' => $user['id'],
        'friend_id' => $friendId,
        'filename' => $filename,
        'prompt_id' => $promptId,
    ]);

    $host = $_SERVER['HTTP_HOST'] ?? 'stories.wallyatkins.com';
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'https://';
    $promptLink = $scheme . $host . '/api/oauth_login.php?return_to=' . rawurlencode('/prompt/' . $promptId);

    $isSelf = ($friendId === (int)$user['id']) || ($friend && $friend['email'] === $user['email']);
    $senderName = $user['username'] ?? $user['email'];
    $friendLabel = $friend['username'] ?? $friend['email'] ?? 'your friend';

    if ($isSelf) {
        $subject = 'Your story prompt is ready';
        $textBody = "Hi $senderName,\n\nYou created a story prompt for yourself! You can watch it and record your response whenever inspiration strikes: $promptLink\n\nKeep capturing those stories,\nThe Stories Team";
        $htmlBody = <<<HTML
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="color:#008080;margin-top:0;">Your story prompt is ready!</h2>
    <p>Hi {$senderName},</p>
    <p>You recorded a story prompt for yourself. Watch it now and reply whenever inspiration strikes:</p>
    <p style="margin:28px 0;">
        <a href="{$promptLink}" style="display:inline-block;padding:12px 28px;background:#008080;color:#ffffff;text-decoration:none;border-radius:24px;font-weight:600;font-size:15px;box-shadow:0 2px 6px rgba(0,128,128,0.3);">Watch &amp; Record Story</a>
    </p>
    <p style="color:#666;font-size:14px;margin-top:32px;">Keep capturing those memories,<br><strong>The Stories Team</strong></p>
</div>
HTML;
        send_email($config, $user['email'], $subject, $htmlBody, $textBody);
    } else {
        // Notify recipient
        if ($friend && !empty($friend['email'])) {
            $subject = "$senderName sent you a story prompt";
            $textBody = "Hi $friendLabel,\n\n$senderName just shared a story prompt with you! Watch it and record your response: $promptLink\n\nWe can't wait to hear your story,\nThe Stories Team";
            $htmlBody = <<<HTML
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="color:#008080;margin-top:0;">You have a new story prompt!</h2>
    <p>Hi {$friendLabel},</p>
    <p><strong>{$senderName}</strong> just sent you a video story prompt. Watch it now and reply whenever inspiration strikes:</p>
    <p style="margin:28px 0;">
        <a href="{$promptLink}" style="display:inline-block;padding:12px 28px;background:#008080;color:#ffffff;text-decoration:none;border-radius:24px;font-weight:600;font-size:15px;box-shadow:0 2px 6px rgba(0,128,128,0.3);">Watch the Story Prompt</a>
    </p>
    <p style="color:#666;font-size:14px;margin-top:32px;">We can't wait to hear your response!<br><strong>The Stories Team</strong></p>
</div>
HTML;
            send_email($config, $friend['email'], $subject, $htmlBody, $textBody);
        }

        // Notify sender confirmation
        $subject = "Your story prompt to $friendLabel was delivered";
        $textBody = "Hi $senderName,\n\nYour story prompt for $friendLabel has been sent! We notified them via email so they can watch and reply.\n\nThanks for sharing,\nThe Stories Team";
        $htmlBody = <<<HTML
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="color:#008080;margin-top:0;">Prompt delivered!</h2>
    <p>Hi {$senderName},</p>
    <p>Your story prompt for <strong>{$friendLabel}</strong> has been sent! We notified them via email with a direct link to watch and record their reply.</p>
    <p style="color:#666;font-size:14px;margin-top:32px;">Thanks for sharing,<br><strong>The Stories Team</strong></p>
</div>
HTML;
        send_email($config, $user['email'], $subject, $htmlBody, $textBody);
    }

    if ($friend && push_is_enabled()) {
        push_send_notification((int)$friend['id'], [
            'title' => 'New story prompt awaits',
            'body' => sprintf('%s sent you a new prompt to explore.', $senderName),
            'url' => sprintf('/prompt/%s', $promptId),
            'tag' => 'prompt-' . $promptId,
        ]);
    }

    echo json_encode([
        'id' => $promptId,
        'filename' => $filename,
        'status' => 'ready',
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
