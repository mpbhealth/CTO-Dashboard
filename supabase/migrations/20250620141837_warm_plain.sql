/*
  # Fix Team Members RLS Policies

  1. Security Updates
    - Drop existing conflicting policies
    - Create clear, specific policies for team_members table
    - Ensure authenticated users can perform all CRUD operations
    - Maintain read access for anonymous users

  2. Changes
    - Remove duplicate/conflicting policies
    - Add comprehensive INSERT, UPDATE, DELETE policies
    - Keep SELECT policy for anonymous users
*/

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can manage team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can read team members" ON team_members;
DROP POLICY IF EXISTS "Anonymous users can read team members" ON team_members;

-- Create specific policies for each operation
CREATE POLICY "Authenticated users can insert team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can select team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Keep anonymous read access
CREATE POLICY "Anonymous users can read team members"
  ON team_members
  FOR SELECT
  TO anon
  USING (true);