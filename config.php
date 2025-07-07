<?php
// Optionally load environment variables from a .env file so server
// configuration can live outside the code base. The path can be
// overridden with the ENV_FILE environment variable.
$envFile = getenv('ENV_FILE') ?: __DIR__ . '/.env';
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (preg_match('/^\s*#/', $line)) continue;
        if (!strpos($line, '=')) continue;
        list($key, $value) = array_map('trim', explode('=', $line, 2));
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

return [
    'email' => [
        'from' => getenv('MAIL_FROM') ?: 'no-reply@example.com',
        'smtp' => [
            'host' => getenv('SMTP_HOST') ?: '',
            'port' => getenv('SMTP_PORT') ?: 587,
            'username' => getenv('SMTP_USER') ?: '',
            'password' => getenv('SMTP_PASS') ?: '',
            'secure' => getenv('SMTP_SECURE') ?: 'tls'
        ]
    ],
    'db' => [
        'dsn' => getenv('DB_DSN') ?: '',
        'user' => getenv('DB_USER') ?: '',
        'pass' => getenv('DB_PASS') ?: '',
        // Options can be overridden via DB_OPTIONS JSON
        'options' => getenv('DB_OPTIONS') ? json_decode(getenv('DB_OPTIONS'), true) : [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    ]
];
