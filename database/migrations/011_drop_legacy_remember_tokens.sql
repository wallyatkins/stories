-- Drop legacy remember_tokens table since Stories is now a pure WallyAuth OIDC client
DROP TABLE IF EXISTS remember_tokens CASCADE;
