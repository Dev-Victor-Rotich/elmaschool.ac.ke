-- Step 1: Add email column to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Step 2: Populate existing profiles with emails from auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id AND p.email IS NULL;