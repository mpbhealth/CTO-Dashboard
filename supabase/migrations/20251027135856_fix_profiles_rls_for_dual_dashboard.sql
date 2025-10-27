/*
  # Fix Profiles RLS Policies for Dual Dashboard

  1. Changes
    - Drop conflicting RLS policies that may be causing 500 errors
    - Create simplified policies that allow users to read their own profile
    - Ensure CEO and CTO users can access their profiles without complex role checks
    - Add policy for profile insertion during signup

  2. Security
    - Users can only read their own profile
    - Authenticated users can insert their own profile
    - Users can update their own profile
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view all profiles if authenticated with officer role" ON profiles;
DROP POLICY IF EXISTS "Officers and admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Officers and admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;

-- Create simple, reliable policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow service role full access for admin operations
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
