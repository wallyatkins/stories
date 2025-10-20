<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$config = require __DIR__ . '/../config.php';

function respond(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function expect_token(array $config): void
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(?<token>.+)$/i', $authHeader, $matches)) {
        respond(401, ['error' => 'Missing authorization token.']);
    }

    $expected = $config['pipeline']['token'] ?? '';
    if ($expected === '') {
        $GLOBALS['logger']->error('Pipeline token not configured.');
        respond(500, ['error' => 'Pipeline token not configured.']);
    }

    $presented = trim($matches['token']);
    if (!hash_equals($expected, $presented)) {
        $GLOBALS['logger']->warning('Invalid pipeline token presented.');
        respond(403, ['error' => 'Invalid authorization token.']);
    }
}

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
        $GLOBALS['logger']->info('Pipeline email dispatched.', ['to' => $toEmail, 'subject' => $subject]);
    } catch (Exception $e) {
        $GLOBALS['logger']->error('Failed to send pipeline email.', [
            'to' => $toEmail,
            'subject' => $subject,
            'error' => $e->getMessage(),
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed.']);
}

expect_token($config);

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);
if (!is_array($data)) {
    respond(400, ['error' => 'Invalid JSON payload.']);
}

$filename = trim((string)($data['filename'] ?? ''));
$manifestPath = trim((string)($data['manifest_path'] ?? ''));

if ($filename === '' || $manifestPath === '') {
    respond(400, ['error' => 'filename and manifest_path are required.']);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'SELECT p.id, p.user_id, p.friend_id, p.status, p.processed_manifest, p.filename,
                sender.username AS sender_username, sender.email AS sender_email,
                friend.username AS friend_username, friend.email AS friend_email
         FROM prompts p
         JOIN users sender ON p.user_id = sender.id
         JOIN users friend ON p.friend_id = friend.id
         WHERE p.filename = ?
         ORDER BY p.created_at DESC
         LIMIT 1'
    );
    $stmt->execute([$filename]);
    $prompt = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($prompt) {
        if ($prompt['status'] === 'processed' && $prompt['processed_manifest'] === $manifestPath) {
            $pdo->commit();
            respond(200, ['status' => 'ok', 'message' => 'Prompt already processed.']);
        }

        $update = $pdo->prepare('UPDATE prompts SET status = ?, processed_manifest = ?, processed_at = NOW() WHERE id = ?');
        $update->execute(['processed', $manifestPath, $prompt['id']]);
        $pdo->commit();

        $GLOBALS['logger']->info('Prompt marked as processed by pipeline.', [
            'prompt_id' => $prompt['id'],
            'filename' => $filename,
            'manifest' => $manifestPath,
        ]);

        $tokenDir = __DIR__ . '/../metadata/tokens';
        if (!is_dir($tokenDir) && !mkdir($tokenDir, 0777, true)) {
            $GLOBALS['logger']->error('Failed to create token directory.', ['directory' => $tokenDir]);
        }

        $token = bin2hex(random_bytes(16));
        $tokenData = ['email' => $prompt['friend_email'], 'ts' => time()];
        $tokenPath = "$tokenDir/$token.json";
        if (file_put_contents($tokenPath, json_encode($tokenData)) === false) {
            $GLOBALS['logger']->error('Failed to persist login token for prompt.', ['path' => $tokenPath]);
        }

        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        $link = $scheme . $host . '/verify-login/' . $token . '?prompt=' . rawurlencode($prompt['filename']);

        $friendName = $prompt['friend_username'] ?: $prompt['friend_email'];
        $senderName = $prompt['sender_username'] ?: $prompt['sender_email'];
        $subject = 'You have a new story prompt';
        $textBody = "Hi $friendName,\n\n$senderName just shared a story prompt with you. Watch it here: $link\n\nWe can't wait to hear your response!\nThe Stories Team";
        $htmlBody = <<<HTML
<p>Hi {$friendName},</p>
<p><strong>{$senderName}</strong> just shared a story prompt with you. You can watch it now and reply whenever inspiration strikes.</p>
<p><a href="{$link}">Watch the story prompt</a></p>
<p>We can't wait to hear your response!<br>The Stories Team</p>
HTML;
        send_email($config, $prompt['friend_email'], $subject, $htmlBody, $textBody);

        respond(200, ['status' => 'ok']);
    }

    // Try to resolve as a response if no prompt matched
    $stmtResponse = $pdo->prepare(
        'SELECT r.id, r.status, r.processed_manifest, r.filename,
                responder.username AS responder_username, responder.email AS responder_email,
                owner.username AS owner_username, owner.email AS owner_email,
                p.filename AS prompt_filename
         FROM responses r
         JOIN users responder ON r.user_id = responder.id
         JOIN prompts p ON r.prompt_id = p.id
         JOIN users owner ON p.user_id = owner.id
         WHERE r.filename = ?
         ORDER BY r.created_at DESC
         LIMIT 1'
    );
    $stmtResponse->execute([$filename]);
    $response = $stmtResponse->fetch(PDO::FETCH_ASSOC);

    if (!$response) {
        $pdo->rollBack();
        respond(404, ['error' => 'Media not found.']);
    }

    if ($response['status'] === 'processed' && $response['processed_manifest'] === $manifestPath) {
        $pdo->commit();
        respond(200, ['status' => 'ok', 'message' => 'Response already processed.']);
    }

    $update = $pdo->prepare('UPDATE responses SET status = ?, processed_manifest = ?, processed_at = NOW() WHERE id = ?');
    $update->execute(['processed', $manifestPath, $response['id']]);
    $pdo->commit();

    $GLOBALS['logger']->info('Response marked as processed by pipeline.', [
        'response_id' => $response['id'],
        'filename' => $filename,
        'manifest' => $manifestPath,
    ]);

    $tokenDir = __DIR__ . '/../metadata/tokens';
    if (!is_dir($tokenDir) && !mkdir($tokenDir, 0777, true)) {
        $GLOBALS['logger']->error('Failed to create token directory.', ['directory' => $tokenDir]);
    }

    $token = bin2hex(random_bytes(16));
    $tokenData = ['email' => $response['owner_email'], 'ts' => time()];
    $tokenPath = "$tokenDir/$token.json";
    if (file_put_contents($tokenPath, json_encode($tokenData)) === false) {
        $GLOBALS['logger']->error('Failed to persist login token for response.', ['path' => $tokenPath]);
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $link = $scheme . $host . '/verify-login/' . $token . '?response=' . rawurlencode($response['filename']);

    $ownerName = $response['owner_username'] ?: $response['owner_email'];
    $responderName = $response['responder_username'] ?: $response['responder_email'];
    $subject = 'You have a new story response';
    $textBody = "Hi $ownerName,\n\n$responderName just replied to your story prompt. Watch it here: $link\n\nWe hope you enjoy it!\nThe Stories Team";
    $htmlBody = <<<HTML
<p>Hi {$ownerName},</p>
<p><strong>{$responderName}</strong> just replied to your story prompt.</p>
<p><a href="{$link}">Watch the story response</a></p>
<p>We hope you enjoy it!<br>The Stories Team</p>
HTML;
    send_email($config, $response['owner_email'], $subject, $htmlBody, $textBody);

    respond(200, ['status' => 'ok']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $GLOBALS['logger']->critical('Failed to update prompt status.', [
        'error' => $e->getMessage(),
        'filename' => $filename,
    ]);
    respond(500, ['error' => 'Failed to update prompt.']);
}
