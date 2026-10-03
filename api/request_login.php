<?php
declare(strict_types=1);

// Legacy passwordless/OTP request endpoint deprecated - redirect to WallyAuth OIDC
header('Location: /api/oauth_login.php', true, 302);
exit;
