-- Migration 002: add username and avatar columns
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;
