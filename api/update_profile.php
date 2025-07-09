<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_https();
require_login();
start_session();
header('Content-Type: application/json');

$user = $_SESSION['user'];
$pdo = db();

$username = $_POST['username'] ?? null;
$avatarFile = $_FILES['avatar']['tmp_name'] ?? null;
$updates = [];
$params = [];

if ($username !== null) {
    $updates[] = 'username = ?';
    $params[] = $username;
    $_SESSION['user']['username'] = $username;
}

if ($avatarFile) {
    $avatarsDir = __DIR__ . '/../uploads/avatars';
    if (!is_dir($avatarsDir)) {
        mkdir($avatarsDir, 0777, true);
    }
    $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . ($ext ? '.' . $ext : '');
    move_uploaded_file($avatarFile, "$avatarsDir/$filename");
    $updates[] = 'avatar = ?';
    $params[] = $filename;
    $_SESSION['user']['avatar'] = $filename;
}

if ($updates) {
    $params[] = $user['id'];
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
}

echo json_encode(['user' => $_SESSION['user']]);

