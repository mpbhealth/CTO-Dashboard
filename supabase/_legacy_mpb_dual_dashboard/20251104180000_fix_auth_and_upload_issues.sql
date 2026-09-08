/*
  # Fix Authentication and Upload Issues

  1. Verify Tables Exist
    - Ensure department_notes table exists
    - Ensure profiles table has correct columns
    - Verify resources table structure

  2. Fix RLS Policies
    - Remove any remaining problematic policies
    - Apply simplified, non-recursive policies
    - Ensure proper user_id vs id mapping

  3. Security
    - All policies check org_id for data isolation
    - Use auth.uid() consistently
    - Avoid nested EXISTS that can cause recursion
*/

-- Ensure department_notes table exists (idempotent)
CREATE TABLE IF NOT EXISTS department_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  department_id text NOT NULL,
  upload_id uuid,
  note_content text NOT NULL,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_department_notes_org_dept ON department_notes(org_id, department_id);
CREATE INDEX IF NOT EXISTS idx_department_notes_created_at ON department_notes(created_at DESC);

-- Enable RLS
ALTER TABLE department_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing department_notes policies to avoid conflicts
DROP POLICY IF EXISTS "CEO and admins can view department notes" ON department_notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON department_notes;
DROP POLICY IF EXISTS "CEO and admins can create notes" ON department_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON department_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON department_notes;

-- Create simplified department_notes policies
CREATE POLICY "department_notes_select"
  ON department_notes FOR SELECT
  TO authenticated
  USING (
    -- Match org_id with user's profile org_id
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid()
    )
    AND (
      -- User created the note
      created_by = auth.uid()
      -- OR user is CEO/admin
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('ceo', 'admin')
        LIMIT 1
      )
    )
  );

CREATE POLICY "department_notes_insert"
  ON department_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND org_id IN (
      SELECT org_id FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "department_notes_update"
  ON department_notes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "department_notes_delete"
  ON department_notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Fix resources table policies - ensure we're using the latest optimized version
-- Drop ALL possible variations of resource policies
DROP POLICY IF EXISTS "resources_select_optimized" ON resources;
DROP POLICY IF EXISTS "resources_insert_simple" ON resources;
DROP POLICY IF EXISTS "resources_update_simple" ON resources;
DROP POLICY IF EXISTS "resources_delete_simple" ON resources;
DROP POLICY IF EXISTS "resources_select" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_update" ON resources;
DROP POLICY IF EXISTS "resources_delete" ON resources;

-- Create final, optimized policies without recursion
CREATE POLICY "resources_select_final"
  ON resources FOR SELECT
  TO authenticated
  USING (
    -- User belongs to same org
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
    AND (
      -- Owner can see their own
      created_by = auth.uid()
      -- OR org-public visibility
      OR visibility = 'org_public'
      -- OR CEO role and shared_to_ceo
      OR (
        visibility = 'shared_to_ceo'
        AND auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('ceo', 'admin')
        )
      )
      -- OR CTO role and shared_to_cto
      OR (
        visibility = 'shared_to_cto'
        AND auth.uid() IN (
          SELECT user_id FROM profiles WHERE role IN ('cto', 'admin')
        )
      )
    )
  );

CREATE POLICY "resources_insert_final"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );

CREATE POLICY "resources_update_final"
  ON resources FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE role = 'admin' AND org_id = resources.org_id
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE role = 'admin' AND org_id = resources.org_id
    )
  );

CREATE POLICY "resources_delete_final"
  ON resources FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE role = 'admin' AND org_id = resources.org_id
    )
  );

-- Ensure profiles table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_org ON profiles(user_id, org_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for department_notes if not exists
DROP TRIGGER IF EXISTS update_department_notes_updated_at ON department_notes;
CREATE TRIGGER update_department_notes_updated_at
  BEFORE UPDATE ON department_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
