/*
  # Fix Resources RLS Infinite Recursion

  1. Issue
    - Infinite recursion in resources table policies
    - Duplicate policies causing conflicts
    - ACL checks using wrong ID field (user_id vs profile.id)

  2. Solution
    - Drop all existing policies
    - Create clean, non-recursive policies
    - Fix ACL to use profiles.id instead of auth.uid()
    
  3. Security
    - Maintains proper access control
    - Users can see their own resources
    - Users can see resources shared with their role
    - Users can see org-public resources
    - ACL-based sharing works correctly
*/

-- Drop all existing resources policies
DROP POLICY IF EXISTS "resources_delete" ON resources;
DROP POLICY IF EXISTS "resources_delete_owner_or_admin" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_insert_own_workspace" ON resources;
DROP POLICY IF EXISTS "resources_readable_by_visibility" ON resources;
DROP POLICY IF EXISTS "resources_select_by_visibility" ON resources;
DROP POLICY IF EXISTS "resources_update" ON resources;
DROP POLICY IF EXISTS "resources_update_owner_or_acl" ON resources;
DROP POLICY IF EXISTS "resources readable by visibility" ON resources;
DROP POLICY IF EXISTS "resources write by owner or ACL" ON resources;

-- Create simple, non-recursive SELECT policy
CREATE POLICY "resources_select"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    -- Same org
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.org_id = resources.org_id
    )
    AND (
      -- Own resources
      created_by = auth.uid()
      -- OR org-public
      OR visibility = 'org_public'
      -- OR shared to CEO (if user is CEO/admin)
      OR (
        visibility = 'shared_to_ceo'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN ('ceo', 'admin')
        )
      )
      -- OR shared to CTO (if user is CTO/admin)
      OR (
        visibility = 'shared_to_cto'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN ('cto', 'admin')
        )
      )
      -- OR shared via ACL (using profile.id)
      OR EXISTS (
        SELECT 1 FROM resource_acl acl
        JOIN profiles p ON p.id = acl.grantee_profile_id
        WHERE acl.resource_id = resources.id
        AND p.user_id = auth.uid()
        AND acl.can_read = true
      )
    )
  );

-- Create simple INSERT policy
CREATE POLICY "resources_insert"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be in same org
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
    )
    -- Must set created_by to self
    AND created_by = auth.uid()
  );

-- Create simple UPDATE policy
CREATE POLICY "resources_update"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    -- Own resources
    created_by = auth.uid()
    -- OR has write access via ACL
    OR EXISTS (
      SELECT 1 FROM resource_acl acl
      JOIN profiles p ON p.id = acl.grantee_profile_id
      WHERE acl.resource_id = resources.id
      AND p.user_id = auth.uid()
      AND acl.can_write = true
    )
    -- OR admin in same org
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.org_id = resources.org_id
    )
  )
  WITH CHECK (
    -- Same checks for WITH CHECK
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM resource_acl acl
      JOIN profiles p ON p.id = acl.grantee_profile_id
      WHERE acl.resource_id = resources.id
      AND p.user_id = auth.uid()
      AND acl.can_write = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.org_id = resources.org_id
    )
  );

-- Create simple DELETE policy
CREATE POLICY "resources_delete"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    -- Own resources
    created_by = auth.uid()
    -- OR admin in same org
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.org_id = resources.org_id
    )
  );
