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
    $_SESSION['oauth_return_to'] = (string)$_GET['return_to'];
} elseif (!empty($_GET['prompt'])) {
    $_SESSION['oauth_return_to'] = '/prompts?prompt=' . rawurlencode($_GET['prompt']);
} elseif (!empty($_GET['response'])) {
    $_SESSION['oauth_return_to'] = '/watch/' . rawurlencode($_GET['response']);
}

$authUrl = $client->getAuthorizationUrl($state, $codeVerifier);
header("Location: {$authUrl}");
exit;
