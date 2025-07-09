-- Initial schema for Video Stories

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS friends (
  user_id INTEGER NOT NULL REFERENCES users(id),
  friend_user_id INTEGER NOT NULL REFERENCES users(id)
);
