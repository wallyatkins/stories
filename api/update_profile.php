<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
require_login();
start_session();
header('Content-Type: application/json');

$user = $_SESSION['user'];
$GLOBALS['logger']->info('User profile update request.', ['user_id' => $user['id'], 'email' => $user['email']]);

$pdo = db();

$username = $_POST['username'] ?? null;
$avatarFile = $_FILES['avatar']['tmp_name'] ?? null;
$avatarName = $_FILES['avatar']['name'] ?? null;
$updates = [];
$params = [];
$updated_fields = [];
$oldAvatar = $user['avatar'] ?? null;

$deleteAvatar = static function (?string $filename): void {
    if (!$filename) {
        return;
    }
    $paths = [
        __DIR__ . '/../avatars/' . $filename,
        __DIR__ . '/../uploads/avatars/' . $filename,
    ];
    foreach ($paths as $path) {
        if (is_file($path)) {
            @unlink($path);
        }
    }
};

if ($username !== null) {
    $updates[] = 'username = ?';
    $params[] = $username;
    $_SESSION['user']['username'] = $username;
    $updated_fields[] = 'username';
}

if ($avatarFile && $avatarName) {
    $mime = mime_content_type($avatarFile) ?: '';
    if (strpos($mime, 'image/') !== 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid avatar file.']);
        exit;
    }

    $avatarsDir = __DIR__ . '/../avatars';
    if (!is_dir($avatarsDir) && !mkdir($avatarsDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Unable to create avatar directory.']);
        exit;
    }

    $ext = strtolower(pathinfo($avatarName, PATHINFO_EXTENSION));
    if ($ext === '') {
        switch ($mime) {
            case 'image/jpeg':
                $ext = 'jpg';
                break;
            case 'image/png':
                $ext = 'png';
                break;
            case 'image/gif':
                $ext = 'gif';
                break;
            case 'image/webp':
                $ext = 'webp';
                break;
            default:
                $ext = 'img';
                break;
        }
    }
    $filename = uniqid('avatar_', true) . ($ext ? '.' . $ext : '');

    if (!move_uploaded_file($avatarFile, "$avatarsDir/$filename")) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save avatar image.']);
        exit;
    }

    $deleteAvatar($oldAvatar);

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
