/*
  # Fix Team Members RLS Policy

  1. Security Updates
    - Update INSERT policy to properly allow authenticated users to add team members
    - Update WITH CHECK condition to use proper authentication check
    - Ensure policies work correctly for the AddTeamMemberModal component

  2. Changes Made
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy with proper authentication check
    - Update WITH CHECK condition to use auth.uid() IS NOT NULL
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Authenticated users can insert team members" ON team_members;

-- Create a new INSERT policy that properly allows authenticated users
CREATE POLICY "Authenticated users can insert team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the UPDATE policy to use the same pattern for consistency
DROP POLICY IF EXISTS "Authenticated users can update team members" ON team_members;

CREATE POLICY "Authenticated users can update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);