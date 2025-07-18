-- Add Wally Atkins as a user for local testing
INSERT INTO users (email, username) VALUES ('wallyatkins@gmail.com', 'Wally Atkins');

-- Make Wally a friend of himself for local testing
DO $$
DECLARE
    wally_id INTEGER;
BEGIN
    -- Get the ID for the user just created
    SELECT id INTO wally_id FROM users WHERE email = 'wallyatkins@gmail.com';

    -- Create the self-friendship record
    INSERT INTO friends (user_id, friend_user_id) VALUES (wally_id, wally_id);
END $$;
