<?php
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

function push_config(): array
{
    static $config;
    if ($config === null) {
        $config = require __DIR__ . '/../config.php';
    }
    return $config['push'] ?? ['enabled' => false, 'vapid' => []];
}

function push_is_enabled(): bool
{
    $config = push_config();
    return !empty($config['enabled'])
        && !empty($config['vapid']['public'])
        && !empty($config['vapid']['private'])
        && !empty($config['vapid']['subject']);
}

function push_webpush(): ?WebPush
{
    static $webPush = null;
    if ($webPush !== null) {
        return $webPush;
    }
    if (!push_is_enabled()) {
        return null;
    }

    $config = push_config();
    $webPush = new WebPush([
        'VAPID' => [
            'subject' => $config['vapid']['subject'],
            'publicKey' => $config['vapid']['public'],
            'privateKey' => $config['vapid']['private'],
        ],
    ]);
    $webPush->setDefaultOptions(['TTL' => 3600]);
    return $webPush;
}

function push_send_notification(int $userId, array $payload): void
{
    if (!push_is_enabled()) {
        return;
    }

    $webPush = push_webpush();
    if (!$webPush) {
        return;
    }

    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?');
    $stmt->execute([$userId]);
    $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$subscriptions) {
        return;
    }

    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    foreach ($subscriptions as $subscriptionRow) {
        $subscription = Subscription::create([
            'endpoint' => $subscriptionRow['endpoint'],
            'publicKey' => $subscriptionRow['p256dh'],
            'authToken' => $subscriptionRow['auth'],
        ]);

        $report = $webPush->sendOneNotification($subscription, $payloadJson);

        if ($report->isSubscriptionExpired() || $report->getResponse()?->getStatusCode() === 410) {
            $del = $pdo->prepare('DELETE FROM push_subscriptions WHERE id = ?');
            $del->execute([$subscriptionRow['id']]);
            $GLOBALS['logger']->info('Removed expired push subscription.', ['subscription_id' => $subscriptionRow['id']]);
            continue;
        }

        if (!$report->isSuccess()) {
            $GLOBALS['logger']->warning('Push notification failed to deliver.', [
                'subscription_id' => $subscriptionRow['id'],
                'reason' => $report->getReason(),
                'status_code' => $report->getResponse()?->getStatusCode(),
            ]);
        } else {
            $update = $pdo->prepare('UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = ?');
            $update->execute([$subscriptionRow['id']]);
        }
    }
}
