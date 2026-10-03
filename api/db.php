<?php
declare(strict_types=1);

function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $config = require __DIR__ . '/../config.php';
        $dsn = $config['db']['dsn'] ?? '';
        if ($dsn === '') {
            throw new RuntimeException('Database DSN not configured');
        }
        $user = $config['db']['user'] ?? '';
        $pass = $config['db']['pass'] ?? '';
        $options = $config['db']['options'] ?? [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ];
        $pdo = new PDO($dsn, $user, $pass, $options);
        ensure_schema($pdo);
    }
    return $pdo;
}

function ensure_schema(PDO $pdo): void {
    static $ensured = false;
    if ($ensured) {
        return;
    }
    try {
        $pdo->exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS wallyauth_sub TEXT;');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_users_wallyauth_sub ON users (wallyauth_sub);');
        $pdo->exec('DROP TABLE IF EXISTS remember_tokens CASCADE;');
        $ensured = true;
    } catch (Throwable $e) {
        // Silently continue if already applied or restricted
    }
}
?>
