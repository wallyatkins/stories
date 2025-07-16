-- Migration 003: Safely update the friends table schema non-destructively

-- Add the created_at column with a default value for new rows.
-- Existing rows will be populated with the current timestamp.
ALTER TABLE friends ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add a composite primary key. This assumes no duplicate pairs exist.
ALTER TABLE friends ADD PRIMARY KEY (user_id, friend_user_id);

-- To add ON DELETE CASCADE, we must drop and recreate the foreign key constraints.
-- Note: This assumes the default PostgreSQL constraint names. If your database
-- uses different names, this part of the script may need adjustment.
ALTER TABLE friends DROP CONSTRAINT friends_user_id_fkey,
                      DROP CONSTRAINT friends_friend_user_id_fkey;

ALTER TABLE friends ADD CONSTRAINT friends_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friends ADD CONSTRAINT friends_friend_user_id_fkey
    FOREIGN KEY (friend_user_id) REFERENCES users(id) ON DELETE CASCADE;
