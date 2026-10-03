<?php
declare(strict_types=1);

// Legacy token verification endpoint deprecated - redirect to WallyAuth OIDC preserving any prompt/response deep-links
$prompt = basename($_GET['prompt'] ?? '');
$response = basename($_GET['response'] ?? '');
$returnTo = '/contacts';

if ($response !== '') {
    $returnTo = '/watch/' . rawurlencode($response);
} elseif ($prompt !== '') {
    $returnTo = '/prompt/' . rawurlencode($prompt);
}

header('Location: /api/oauth_login.php?return_to=' . urlencode($returnTo), true, 302);
exit;
