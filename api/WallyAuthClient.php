<?php
declare(strict_types=1);

class WallyAuthClient
{
    private string $issuerUrl;
    private string $clientId;
    private ?string $clientSecret;
    private string $redirectUri;

    public function __construct(
        ?string $issuerUrl = null,
        ?string $clientId = null,
        ?string $clientSecret = null,
        ?string $redirectUri = null
    ) {
        $config = require __DIR__ . '/../config.php';
        $authConfig = $config['wallyauth'] ?? [];

        $this->issuerUrl = rtrim($issuerUrl ?? ($authConfig['issuer'] ?? getenv('WALLYAUTH_ISSUER') ?: 'https://auth.wallyatkins.com'), '/');
        $this->clientId = $clientId ?? ($authConfig['client_id'] ?? getenv('WALLYAUTH_CLIENT_ID') ?: 'stories');
        $this->clientSecret = $clientSecret ?? ($authConfig['client_secret'] ?? getenv('WALLYAUTH_CLIENT_SECRET') ?: 'ST9vB3kM7rLqP5xW2nZ8yJ1hF4tD0aEc6mX');

        if ($redirectUri) {
            $this->redirectUri = $redirectUri;
        } elseif (!empty($authConfig['redirect_uri'])) {
            $this->redirectUri = $authConfig['redirect_uri'];
        } else {
            $host = $_SERVER['HTTP_HOST'] ?? 'stories.wallyatkins.com';
            $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
                       (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
            $scheme = $isHttps ? 'https' : 'http';
            $this->redirectUri = "{$scheme}://{$host}/api/oauth_callback.php";
        }
    }

    public function getAuthorizationUrl(string $state, string $codeVerifier, string $scope = 'openid profile email'): string
    {
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

        $params = [
            'client_id'             => $this->clientId,
            'redirect_uri'          => $this->redirectUri,
            'response_type'         => 'code',
            'scope'                 => $scope,
            'state'                 => $state,
            'code_challenge'        => $codeChallenge,
            'code_challenge_method' => 'S256',
        ];

        return $this->issuerUrl . '/oauth/authorize?' . http_build_query($params);
    }

    public function exchangeCodeForTokens(string $code, string $codeVerifier): array
    {
        $tokenUrl = $this->issuerUrl . '/oauth/token';

        $params = [
            'grant_type'    => 'authorization_code',
            'client_id'     => $this->clientId,
            'code'          => $code,
            'redirect_uri'  => $this->redirectUri,
            'code_verifier' => $codeVerifier,
        ];

        if ($this->clientSecret) {
            $params['client_secret'] = $this->clientSecret;
        }

        $ch = curl_init($tokenUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT        => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response || $httpCode >= 400) {
            throw new \RuntimeException("Failed to exchange code with WallyAuth (HTTP {$httpCode}): " . ($response ?: 'No response'));
        }

        $data = json_decode((string)$response, true);
        if (!is_array($data) || empty($data['access_token'])) {
            throw new \RuntimeException('Invalid token response from WallyAuth: ' . (string)$response);
        }

        return $data;
    }

    public function getUserInfo(string $accessToken): array
    {
        $userinfoUrl = $this->issuerUrl . '/oauth/userinfo';

        $ch = curl_init($userinfoUrl);
        curl_setopt_array($ch, [
            CURLOPT_HTTPGET        => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$accessToken}",
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT        => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response || $httpCode >= 400) {
            throw new \RuntimeException("Failed to fetch userinfo from WallyAuth (HTTP {$httpCode}): " . ($response ?: 'No response'));
        }

        $data = json_decode((string)$response, true);
        if (!is_array($data)) {
            throw new \RuntimeException('Invalid userinfo response from WallyAuth: ' . (string)$response);
        }

        return $data;
    }
}
