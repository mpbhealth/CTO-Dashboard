/*
  # Fix team_members RLS policies

  1. Security Updates
    - Drop existing restrictive policies that are causing insert failures
    - Create new policies that properly allow authenticated users to manage team members
    - Ensure both read and write operations work correctly for authenticated users

  2. Policy Changes
    - Remove existing policies that may have conflicting conditions
    - Add comprehensive policies for authenticated users to manage team members
    - Maintain security while allowing proper functionality
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Anonymous users can read team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can delete team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can select team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can update team members" ON team_members;

-- Ensure RLS is enabled
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Authenticated users can read team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete team members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow anonymous users to read team members (as per original schema)
CREATE POLICY "Anonymous users can read team members"
  ON team_members
  FOR SELECT
  TO anon
  USING (true);