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

require_login();
header('Content-Type: application/json');

$user = $_SESSION['user'];

$promptIdFromPost = isset($_POST['prompt_id']) ? (int)$_POST['prompt_id'] : 0;
$promptFilename = basename($_GET['prompt'] ?? '');

if ($promptIdFromPost > 0) {
    $promptIdentifier = ['type' => 'id', 'value' => $promptIdFromPost];
} elseif ($promptFilename !== '') {
    $promptIdentifier = ['type' => 'filename', 'value' => $promptFilename];
} else {
    $promptIdentifier = null;
}

$GLOBALS['logger']->info('Response upload request.', [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'prompt_identifier' => $promptIdentifier,
]);

if ($promptIdentifier === null || $_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
    http_response_code(400);
    $GLOBALS['logger']->warning('Response upload failed: Invalid request.', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'prompt_identifier' => $promptIdentifier,
    ]);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$uploadsDir = __DIR__ . '/../uploads';
$metadataDir = __DIR__ . '/../metadata';
foreach ([$uploadsDir, $metadataDir] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
}

$filename = time() . '-' . basename($_FILES['video']['name']);
if (!move_uploaded_file($_FILES['video']['tmp_name'], "$uploadsDir/$filename")) {
    http_response_code(500);
    $GLOBALS['logger']->error('Failed to save uploaded response file.', ['user_id' => $user['id'], 'prompt' => $prompt]);
    echo json_encode(['error' => 'Failed to save uploaded file.']);
    exit;
}

$GLOBALS['logger']->info('Response video uploaded.', [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'prompt' => $promptFilename,
    'filename' => $filename,
]);

$pdo = db();

// Get prompt details including owner
$stmt = $pdo->prepare('SELECT p.id, p.user_id, p.filename, owner.email AS owner_email, owner.username AS owner_username
    FROM prompts p
    JOIN users owner ON p.user_id = owner.id
    WHERE ' . ($promptIdentifier['type'] === 'id' ? 'p.id = ?' : 'p.filename = ?'));
$stmt->execute([$promptIdentifier['value']]);
$promptRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$promptRow) {
    http_response_code(404);
    $GLOBALS['logger']->error('Prompt not found in database for response.', [
        'prompt_identifier' => $promptIdentifier,
    ]);
    echo json_encode(['error' => 'Prompt not found.']);
    exit;
}

$promptId = $promptRow['id'];
$promptFilename = $promptRow['filename'];

// Save the response to the database
$stmt = $pdo->prepare('INSERT INTO responses (prompt_id, user_id, filename, status) VALUES (?, ?, ?, ?) RETURNING id');
$stmt->execute([$promptId, $user['id'], $filename, 'ready']);
$responseId = $stmt->fetchColumn();

$GLOBALS['logger']->info('Response saved with ready status.', [
    'user_id' => $user['id'],
    'prompt_id' => $promptId,
    'filename' => $filename,
    'response_id' => $responseId,
]);

$host = $_SERVER['HTTP_HOST'] ?? 'stories.wallyatkins.com';
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'https://';
$watchLink = $scheme . $host . '/api/oauth_login.php?return_to=' . rawurlencode('/watch/' . $filename);

$isSelf = ((int)$promptRow['user_id'] === (int)$user['id']) || ($promptRow['owner_email'] === $user['email']);
$responderName = $user['username'] ?? $user['email'];
$ownerLabel = $promptRow['owner_username'] ?? $promptRow['owner_email'] ?? 'your friend';

if ($isSelf) {
    $subject = 'Your story response is ready';
    $textBody = "Hi $responderName,\n\nYour story response has been recorded and is ready to watch! $watchLink\n\nThanks for capturing your memories,\nThe Stories Team";
    $htmlBody = <<<HTML
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="color:#FF7F50;margin-top:0;">Your story is ready to watch!</h2>
    <p>Hi {$responderName},</p>
    <p>You recorded a response to your story prompt. You can watch it now:</p>
    <p style="margin:28px 0;">
        <a href="{$watchLink}" style="display:inline-block;padding:12px 28px;background:#FF7F50;color:#ffffff;text-decoration:none;border-radius:24px;font-weight:600;font-size:15px;box-shadow:0 2px 6px rgba(255,127,80,0.3);">Watch Your Story</a>
    </p>
    <p style="color:#666;font-size:14px;margin-top:32px;">Thanks for capturing your memories,<br><strong>The Stories Team</strong></p>
</div>
HTML;
    send_email($config, $user['email'], $subject, $htmlBody, $textBody);
} else {
    // Notify prompt owner
    if (!empty($promptRow['owner_email'])) {
        $subject = "$responderName replied to your story prompt!";
        $textBody = "Hi $ownerLabel,\n\n$responderName just replied to your story prompt with a new story video! Watch it here: $watchLink\n\nWe hope you enjoy it!\nThe Stories Team";
        $htmlBody = <<<HTML
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="color:#FF7F50;margin-top:0;">You have a new story response!</h2>
    <p>Hi {$ownerLabel},</p>
    <p><strong>{$responderName}</strong> just replied to your story prompt with a new story video:</p>
    <p style="margin:28px 0;">
        <a href="{$watchLink}" style="display:inline-block;padding:12px 28px;background:#FF7F50;color:#ffffff;text-decoration:none;border-radius:24px;font-weight:600;font-size:15px;box-shadow:0 2px 6px rgba(255,127,80,0.3);">Watch Their Story</a>
    </p>
    <p style="color:#666;font-size:14px;margin-top:32px;">We hope you enjoy it!<br><strong>The Stories Team</strong></p>
</div>
HTML;
        send_email($config, $promptRow['owner_email'], $subject, $htmlBody, $textBody);
    }

    // Notify responder confirmation
    $subject = "Your story response was sent to $ownerLabel";
    $textBody = "Hi $responderName,\n\nYour story response for $ownerLabel has been sent! We notified them via email with a link to watch: $watchLink\n\nThanks for sharing,\nThe Stories Team";
    $htmlBody = <<<HTML
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="color:#FF7F50;margin-top:0;">Story response delivered!</h2>
    <p>Hi {$responderName},</p>
    <p>Your story response for <strong>{$ownerLabel}</strong> has been delivered. We notified them via email so they can watch your story.</p>
    <p style="margin:28px 0;">
        <a href="{$watchLink}" style="display:inline-block;padding:12px 28px;background:#FF7F50;color:#ffffff;text-decoration:none;border-radius:24px;font-weight:600;font-size:15px;box-shadow:0 2px 6px rgba(255,127,80,0.3);">Watch Your Story</a>
    </p>
    <p style="color:#666;font-size:14px;margin-top:32px;">Thanks for sharing,<br><strong>The Stories Team</strong></p>
</div>
HTML;
    send_email($config, $user['email'], $subject, $htmlBody, $textBody);
}

if (push_is_enabled()) {
    push_send_notification((int)$promptRow['user_id'], [
        'title' => 'Your story prompt has a reply',
        'body' => sprintf('%s sent a new story response.', $responderName),
        'url' => sprintf('/watch/%s', $filename),
        'tag' => 'response-' . $responseId,
    ]);
}

echo json_encode(['id' => $responseId, 'filename' => $filename, 'status' => 'ready']);
