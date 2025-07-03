<?php
require_once __DIR__ . '/auth.php';
$config = require __DIR__ . '/../config.php';
require_https();
start_session();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$email = $_POST['email'] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$token = bin2hex(random_bytes(16));
$tokenDir = __DIR__ . '/../metadata/tokens';
if (!is_dir($tokenDir)) {
    mkdir($tokenDir, 0777, true);
}
file_put_contents("$tokenDir/$token.json", json_encode(['email' => $email, 'ts' => time()]));
$link = 'https://' . $_SERVER['HTTP_HOST'] . '/api/verify_login.php?token=' . $token;
// send email using config
require_once '/usr/share/php/libphp-phpmailer/autoload.php';

$subject = 'Your login link';
$message = "Click this link to log in: $link";

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
    $mail->addAddress($email);
    $mail->Subject = $subject;
    $mail->Body = $message;
    $mail->send();
} else {
    $headers = 'From: ' . $config['email']['from'] . "\r\n";
    @mail($email, $subject, $message, $headers);
}

echo json_encode(['sent' => true]);
