/*
  # Fix Resources RLS Policies (Corrected)
  
  1. Issue
    - Complex RLS policies causing 500 errors
    - Infinite recursion possible with nested EXISTS queries
    - Empty result sets due to overly restrictive policies
  
  2. Solution
    - Drop all existing policies
    - Create simplified, efficient policies
    - Fix created_by to use auth.uid() (user_id from auth schema)
    - Optimize JOIN queries in ACL checks
  
  3. Security  
    - Users can see their own resources
    - Users can see resources shared with their role
    - Users can see org-public resources
    - ACL-based sharing works correctly
*/

-- Drop ALL existing resources policies
DROP POLICY IF EXISTS "resources_delete" ON resources;
DROP POLICY IF EXISTS "resources_delete_owner_or_admin" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_insert_own_workspace" ON resources;
DROP POLICY IF EXISTS "resources_readable_by_visibility" ON resources;
DROP POLICY IF EXISTS "resources_select" ON resources;
DROP POLICY IF EXISTS "resources_select_by_visibility" ON resources;
DROP POLICY IF EXISTS "resources_update" ON resources;
DROP POLICY IF EXISTS "resources_update_owner_or_acl" ON resources;
DROP POLICY IF EXISTS "resources readable by visibility" ON resources;
DROP POLICY IF EXISTS "resources write by owner or ACL" ON resources;
DROP POLICY IF EXISTS "CEO and admins can view department notes" ON resources;

-- Create optimized SELECT policy
CREATE POLICY "resources_select_optimized"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    -- User is in the same org
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
    AND (
      -- User created this resource
      created_by = auth.uid()
      -- OR it's org-public
      OR visibility = 'org_public'
      -- OR user is CEO/admin and it's shared to CEO
      OR (
        visibility = 'shared_to_ceo'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN ('ceo', 'admin')
          LIMIT 1
        )
      )
      -- OR user is CTO/admin and it's shared to CTO
      OR (
        visibility = 'shared_to_cto'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role IN ('cto', 'admin')
          LIMIT 1
        )
      )
      -- OR shared via ACL
      OR EXISTS (
        SELECT 1 FROM resource_acl acl
        INNER JOIN profiles p ON p.id = acl.grantee_profile_id
        WHERE acl.resource_id = resources.id
        AND p.user_id = auth.uid()
        AND acl.can_read = true
        LIMIT 1
      )
    )
  );

-- Create simplified INSERT policy
CREATE POLICY "resources_insert_simple"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be in the same org
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
    -- Must set created_by to own user_id
    AND created_by = auth.uid()
  );

-- Create simplified UPDATE policy
CREATE POLICY "resources_update_simple"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    -- User created this resource
    created_by = auth.uid()
    -- OR user has write access via ACL
    OR EXISTS (
      SELECT 1 FROM resource_acl acl
      INNER JOIN profiles p ON p.id = acl.grantee_profile_id
      WHERE acl.resource_id = resources.id
      AND p.user_id = auth.uid()
      AND acl.can_write = true
      LIMIT 1
    )
    -- OR user is admin in same org
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  )
  WITH CHECK (
    -- Same checks for WITH CHECK
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM resource_acl acl
      INNER JOIN profiles p ON p.id = acl.grantee_profile_id
      WHERE acl.resource_id = resources.id
      AND p.user_id = auth.uid()
      AND acl.can_write = true
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );

-- Create simplified DELETE policy
CREATE POLICY "resources_delete_simple"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    -- User created this resource
    created_by = auth.uid()
    -- OR user is admin in same org
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );