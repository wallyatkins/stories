-- Add wallyauth_sub field to link users with WallyAuth OIDC identities
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallyauth_sub TEXT;
CREATE INDEX IF NOT EXISTS idx_users_wallyauth_sub ON users (wallyauth_sub);
