<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_https();
require_login();
start_session();
header('Content-Type: application/json');

$user = $_SESSION['user'];
$GLOBALS['logger']->info('User profile update request.', ['user_id' => $user['id'], 'email' => $user['email']]);

$pdo = db();

$username = $_POST['username'] ?? null;
$avatarFile = $_FILES['avatar']['tmp_name'] ?? null;
$updates = [];
$params = [];
$updated_fields = [];

if ($username !== null) {
    $updates[] = 'username = ?';
    $params[] = $username;
    $_SESSION['user']['username'] = $username;
    $updated_fields[] = 'username';
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
    $updated_fields[] = 'avatar';
}

if ($updates) {
    $params[] = $user['id'];
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $GLOBALS['logger']->info('User profile updated successfully.', [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'updated_fields' => $updated_fields
    ]);
} else {
    $GLOBALS['logger']->info('No fields to update for user.', ['user_id' => $user['id'], 'email' => $user['email']]);
}

echo json_encode(['user' => $_SESSION['user']]);

