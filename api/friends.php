<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

require_https();
require_login();

$user = $_SESSION['user'];
$pdo = db();

header('Content-Type: application/json');

$GLOBALS['logger']->info('Friends API request.', ['user_id' => $user['id'], 'email' => $user['email'], 'method' => $_SERVER['REQUEST_METHOD']]);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $friendEmail = $_POST['email'] ?? '';
        if (!filter_var($friendEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            $GLOBALS['logger']->warning('Invalid email provided to add friend.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_email' => $friendEmail]);
            echo json_encode(['error' => 'Invalid email']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$friendEmail]);
        $friendId = $stmt->fetchColumn();

        if (!$friendId) {
            http_response_code(404);
            $GLOBALS['logger']->warning('Friend not found.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_email' => $friendEmail]);
            echo json_encode(['error' => 'Friend not found']);
            exit;
        }

        if ($friendId === $user['id']) {
            http_response_code(400);
            $GLOBALS['logger']->warning('User tried to add themselves as a friend.', ['user_id' => $user['id'], 'email' => $user['email']]);
            echo json_encode(['error' => 'You cannot add yourself as a friend']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT * FROM friends WHERE user_id = ? AND friend_user_id = ?');
        $stmt->execute([$user['id'], $friendId]);
        if ($stmt->fetch()) {
            http_response_code(409);
            $GLOBALS['logger']->warning('Friend relationship already exists.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_id' => $friendId]);
            echo json_encode(['error' => 'Friend already exists']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO friends (user_id, friend_user_id) VALUES (?, ?)');
        $stmt->execute([$user['id'], $friendId]);

        $GLOBALS['logger']->info('Friend added successfully.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_id' => $friendId]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        parse_str(file_get_contents('php://input'), $_DELETE);
        $friendId = $_DELETE['friend_id'] ?? null;

        if (!$friendId) {
            http_response_code(400);
            $GLOBALS['logger']->warning('Missing friend_id for DELETE request.', ['user_id' => $user['id'], 'email' => $user['email']]);
            echo json_encode(['error' => 'friend_id is required']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM friends WHERE user_id = ? AND friend_user_id = ?');
        $stmt->execute([$user['id'], $friendId]);

        if ($stmt->rowCount() > 0) {
            $GLOBALS['logger']->info('Friend removed successfully.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_id' => $friendId]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404);
            $GLOBALS['logger']->warning('Friend relationship not found for deletion.', ['user_id' => $user['id'], 'email' => $user['email'], 'friend_id' => $friendId]);
            echo json_encode(['error' => 'Friend not found']);
        }
        break;

    default:
        http_response_code(405);
        $GLOBALS['logger']->warning('Invalid method for Friends API.', ['user_id' => $user['id'], 'email' => $user['email'], 'method' => $_SERVER['REQUEST_METHOD']]);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
