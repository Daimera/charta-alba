-- Add phone number to profiles for multi-identifier sign-in
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text UNIQUE;
