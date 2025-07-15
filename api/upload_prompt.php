<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
$config = require __DIR__ . '/../config.php';
require_https();
require_login();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
    http_response_code(400);
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

$friendId = intval($_POST['friend_id'] ?? 0);
if ($friendId > 0) {
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
            @mail($friendEmail, $subject, $message, $headers);
        }
    }
}

echo json_encode(['filename' => $filename]);

