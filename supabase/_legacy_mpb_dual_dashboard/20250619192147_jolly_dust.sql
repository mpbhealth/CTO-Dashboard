/*
  # Fix Tech Stack RLS Policy

  1. Security Updates
    - Drop existing policies that may be conflicting
    - Create new comprehensive policies for tech_stack table
    - Allow authenticated users to perform all CRUD operations
    - Ensure INSERT operations are properly allowed

  2. Changes
    - Remove existing policies on tech_stack table
    - Add new policy for authenticated users to manage tech stack data
    - Add new policy for authenticated users to read tech stack data
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage tech stack" ON tech_stack;
DROP POLICY IF EXISTS "Users can read tech stack" ON tech_stack;

-- Create comprehensive policy for authenticated users to manage all tech stack operations
CREATE POLICY "Authenticated users can manage tech stack"
  ON tech_stack
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to read tech stack data
CREATE POLICY "Authenticated users can read tech stack"
  ON tech_stack
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anonymous users to read tech stack data (if needed for public access)
CREATE POLICY "Anonymous users can read tech stack"
  ON tech_stack
  FOR SELECT
  TO anon
  USING (true);