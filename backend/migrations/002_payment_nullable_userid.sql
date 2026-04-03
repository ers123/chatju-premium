-- Allow payments without an authenticated user
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;
