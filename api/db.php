<?php
function db() {
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
    }
    return $pdo;
}
?>
