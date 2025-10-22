#!/usr/bin/env php
<?php
require __DIR__ . '/../vendor/autoload.php';

use Minishlink\WebPush\VAPID;

try {
    $keys = VAPID::createVapidKeys();
    echo "VAPID Public Key:\n" . $keys['publicKey'] . "\n\n";
    echo "VAPID Private Key:\n" . $keys['privateKey'] . "\n\n";
    echo "Add these to your environment (.env):\n";
    echo "PUSH_ENABLED=true\n";
    echo "PUSH_VAPID_PUBLIC=" . $keys['publicKey'] . "\n";
    echo "PUSH_VAPID_PRIVATE=" . $keys['privateKey'] . "\n";
    echo "PUSH_VAPID_SUBJECT=mailto:you@example.com\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Failed to generate VAPID keys: " . $e->getMessage() . "\n");
    exit(1);
}
