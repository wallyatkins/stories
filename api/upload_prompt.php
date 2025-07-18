<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

$config = require __DIR__ . '/../config.php';

try {
    require_login();
    header('Content-Type: application/json');

    $user = $_SESSION['user'];
    $GLOBALS['logger']->info('Prompt upload request.', ['user_id' => $user['id'], 'email' => $user['email']]);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
        http_response_code(400);
        $GLOBALS['logger']->warning('Prompt upload failed: Not a POST request or no video uploaded.', ['user_id' => $user['id'], 'email' => $user['email']]);
        echo json_encode(['error' => 'No video uploaded']);
        exit;
    }

    $videoFile = $_FILES['video'];
    $GLOBALS['logger']->info('Video file details', ['file' => $videoFile]);

    if ($videoFile['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $GLOBALS['logger']->error('Video upload error', ['error_code' => $videoFile['error']]);
        echo json_encode(['error' => 'Video upload failed with error code: ' . $videoFile['error']]);
        exit;
    }

    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) {
        $GLOBALS['logger']->info('Uploads directory does not exist, creating it.', ['directory' => $uploadsDir]);
        if (!mkdir($uploadsDir, 0777, true)) {
            $GLOBALS['logger']->error('Failed to create uploads directory.', ['directory' => $uploadsDir]);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create uploads directory.']);
            exit;
        }
    }

    $id = time();
    $filename = $id . '-' . basename($videoFile['name']);
    $destination = "$uploadsDir/$filename";

    $GLOBALS['logger']->info('Moving uploaded file.', ['from' => $videoFile['tmp_name'], 'to' => $destination]);
    if (!move_uploaded_file($videoFile['tmp_name'], $destination)) {
        $GLOBALS['logger']->error('Failed to move uploaded file.');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save uploaded file.']);
        exit;
    }

    $friendId = intval($_POST['friend_id'] ?? 0);

    // Add prompt to the database
    $pdo = db();
    $stmt = $pdo->prepare('INSERT INTO prompts (user_id, friend_id, filename) VALUES (?, ?, ?)');
    $stmt->execute([$user['id'], $friendId, $filename]);
    $GLOBALS['logger']->info('Prompt saved to database.', ['user_id' => $user['id'], 'friend_id' => $friendId, 'filename' => $filename]);

    if ($friendId > 0) {
        $GLOBALS['logger']->info('Sending prompt to friend.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_id' => $friendId]);
        $pdo = db();
        $stmt = $pdo->prepare('SELECT email FROM users WHERE id = ?');
        $stmt->execute([$friendId]);
        $friendEmail = $stmt->fetchColumn();
        if ($friendEmail) {
            $token = bin2hex(random_bytes(16));
            $tokenDir = __DIR__ . '/../metadata/tokens';
            if (!is_dir($tokenDir)) {
                mkdir($tokenDir, 0777, true);
            }
            $tokenData = ['email' => $friendEmail, 'ts' => time()];
            file_put_contents("$tokenDir/$token.json", json_encode($tokenData));
            $link = 'https://' . $_SERVER['HTTP_HOST'] . '/verify-login/' . $token . '?prompt=' . rawurlencode($filename);

            require_once __DIR__ . '/../vendor/autoload.php';
            $subject = 'New video prompt';
            $message = "You have a new video prompt. View it here: $link";

            try {
                if (!empty($config['email']['smtp']['host'])) {
                    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
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
                    $mail->addAddress($friendEmail);
                    $mail->Subject = $subject;
                    $mail->Body = $message;
                    $mail->send();
                } else {
                    $headers = 'From: ' . $config['email']['from'] . "\r\n";
                    if (!@mail($friendEmail, $subject, $message, $headers)) {
                        throw new Exception('mail() function failed');
                    }
                }
                $GLOBALS['logger']->info('Prompt email sent successfully.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_email' => $friendEmail]);
            } catch (Exception $e) {
                $GLOBALS['logger']->error('Failed to send prompt email.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_email' => $friendEmail, 'error' => $e->getMessage()]);
            }
        } else {
            $GLOBALS['logger']->warning('Friend not found for prompt email.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_id' => $friendId]);
        }
    }

    $GLOBALS['logger']->info('Sending successful JSON response.', ['filename' => $filename]);
    echo json_encode(['filename' => $filename]);
} catch (Throwable $e) {
    $GLOBALS['logger']->critical('Unhandled exception in upload_prompt.php', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}

