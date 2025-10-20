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

require_login();
header('Content-Type: application/json');

$user = $_SESSION['user'];
$prompt = basename($_GET['prompt'] ?? '');

$GLOBALS['logger']->info('Response upload request.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt]);

if ($prompt === '' || $_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
    http_response_code(400);
    $GLOBALS['logger']->warning('Response upload failed: Invalid request.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt]);
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

$GLOBALS['logger']->info('Response video uploaded.', ['user_id' => $user['id'], 'email' => $user['email'], 'prompt' => $prompt, 'filename' => $filename]);

$pdo = db();

// Get prompt details including owner
$stmt = $pdo->prepare('SELECT p.id, p.user_id, owner.email AS owner_email, owner.username AS owner_username
    FROM prompts p
    JOIN users owner ON p.user_id = owner.id
    WHERE p.filename = ?');
$stmt->execute([$prompt]);
$promptRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$promptRow) {
    http_response_code(404);
    $GLOBALS['logger']->error('Prompt not found in database for response.', ['prompt_filename' => $prompt]);
    echo json_encode(['error' => 'Prompt not found.']);
    exit;
}

$promptId = $promptRow['id'];

// Save the response to the database
$stmt = $pdo->prepare('INSERT INTO responses (prompt_id, user_id, filename, status) VALUES (?, ?, ?, ?)');
$stmt->execute([$promptId, $user['id'], $filename, 'pending']);

$GLOBALS['logger']->info('Response metadata updated in database.', [
    'user_id' => $user['id'],
    'prompt_id' => $promptId,
    'filename' => $filename
]);

// Notify responder that processing has begun
$responderName = $user['username'] ?? $user['email'];
$ownerLabel = $promptRow['owner_username'] ?? $promptRow['owner_email'] ?? 'your friend';
$subject = 'We received your story response';
$textBody = "Hi $responderName,\n\nWe received your story response for $ownerLabel. We'll process it shortly and email them once it's ready to watch.\n\nThanks for sharing,\nThe Stories Team";
$htmlBody = <<<HTML
<p>Hi {$responderName},</p>
<p>We received your story response for <strong>{$ownerLabel}</strong>. We'll process it shortly and email them once it's ready to watch.</p>
<p>Thanks for sharing,<br>The Stories Team</p>
HTML;
send_email($config, $user['email'], $subject, $htmlBody, $textBody);

echo json_encode(['filename' => $filename, 'status' => 'pending']);
