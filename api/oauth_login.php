<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/WallyAuthClient.php';

start_session();

$client = new WallyAuthClient();
$state = bin2hex(random_bytes(16));
$codeVerifier = bin2hex(random_bytes(32));

$_SESSION['oauth_state'] = $state;
$_SESSION['oauth_code_verifier'] = $codeVerifier;

if (!empty($_GET['return_to'])) {
    $returnTo = (string)$_GET['return_to'];
    // Validate that return_to is a safe relative path
    if (str_starts_with($returnTo, '/') && !str_starts_with($returnTo, '//')) {
        $_SESSION['oauth_return_to'] = $returnTo;
    }
} elseif (!empty($_GET['prompt'])) {
    $_SESSION['oauth_return_to'] = '/prompt/' . rawurlencode((string)$_GET['prompt']);
} elseif (!empty($_GET['response'])) {
    $_SESSION['oauth_return_to'] = '/watch/' . rawurlencode((string)$_GET['response']);
} elseif (!empty($_GET['watch'])) {
    $_SESSION['oauth_return_to'] = '/watch/' . rawurlencode((string)$_GET['watch']);
}

$authUrl = $client->getAuthorizationUrl($state, $codeVerifier);
header("Location: {$authUrl}");
exit;
