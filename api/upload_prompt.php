<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
$config = require __DIR__ . '/../config.php';
require_https();
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
$uploadsDir = __DIR__ . '/../uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}
$id = time();
$filename = $id . '-' . basename($_FILES['video']['name']);
move_uploaded_file($_FILES['video']['tmp_name'], "$uploadsDir/$filename");

$GLOBALS['logger']->info('Prompt video uploaded.', ['user_id' => $user['id'], 'email' => $user['email'], 'filename' => $filename]);

$friendId = intval($_POST['friend_id'] ?? 0);
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

echo json_encode(['filename' => $filename]);

