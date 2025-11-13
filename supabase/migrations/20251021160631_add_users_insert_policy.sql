/*
  # Add INSERT Policy for Users Table
  
  ## Changes Made
  
  1. Security Policy
    - Add INSERT policy to allow authenticated users to create their own profile
    - This enables auto-creation of user records when they first authenticate
  
  2. Purpose
    - Allows the application to automatically create user records in the users table
    - Links auth.users to public.users via auth_user_id
    - Required for assignments and other features that reference users table
*/

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create INSERT policy for users table
-- Allow authenticated users to create their own profile record
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Also ensure users can read all user records (needed for assignment lookups)
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
CREATE POLICY "Authenticated users can read users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);
