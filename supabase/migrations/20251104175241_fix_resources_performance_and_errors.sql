/*
  # Fix Resources Table Performance and 500 Errors

  ## Changes
  1. Add critical indexes for query performance
  2. Simplify RLS policies to prevent recursion
  3. Add workspace_id validation
  4. Optimize query paths

  ## Performance Improvements
  - Index on (workspace_id, org_id) for fast filtering
  - Index on (created_at DESC) for sorting
  - Index on (created_by) for ownership checks
  - Simplified policies with LIMIT 1 in subqueries

  ## Security
  - Maintains proper org isolation
  - Preserves role-based access control
  - Prevents infinite recursion in policies
*/

-- Add critical indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_resources_workspace_org
  ON resources(workspace_id, org_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resources_created_at
  ON resources(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resources_created_by
  ON resources(created_by);

CREATE INDEX IF NOT EXISTS idx_resources_visibility
  ON resources(visibility);

CREATE INDEX IF NOT EXISTS idx_resources_org_visibility
  ON resources(org_id, visibility);

-- Drop all existing resources policies to start fresh
DROP POLICY IF EXISTS "resources_select_final" ON resources;
DROP POLICY IF EXISTS "resources_insert_final" ON resources;
DROP POLICY IF EXISTS "resources_update_final" ON resources;
DROP POLICY IF EXISTS "resources_delete_final" ON resources;
DROP POLICY IF EXISTS "resources_select_optimized" ON resources;
DROP POLICY IF EXISTS "resources_insert_simple" ON resources;
DROP POLICY IF EXISTS "resources_update_simple" ON resources;
DROP POLICY IF EXISTS "resources_delete_simple" ON resources;

-- Create optimized SELECT policy with no recursion
CREATE POLICY "resources_select_v2"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    -- Fast path: Check if user is in same org (with LIMIT 1)
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.org_id = resources.org_id
      LIMIT 1
    )
    AND (
      -- Own resources
      created_by = auth.uid()

      -- OR org-public visibility
      OR visibility = 'org_public'

      -- OR CEO/admin can see shared_to_ceo
      OR (
        visibility = 'shared_to_ceo'
        AND EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('ceo', 'admin')
          LIMIT 1
        )
      )

      -- OR CTO/admin can see shared_to_cto
      OR (
        visibility = 'shared_to_cto'
        AND EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('cto', 'admin')
          LIMIT 1
        )
      )
    )
  );

-- Create simple INSERT policy
CREATE POLICY "resources_insert_v2"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must set created_by to self
    created_by = auth.uid()

    -- Must be in same org
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );

-- Create simple UPDATE policy
CREATE POLICY "resources_update_v2"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    -- Own resources
    created_by = auth.uid()

    -- OR admin in same org
    OR EXISTS (
      SELECT 1
      FROM profiles
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
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );

-- Create simple DELETE policy
CREATE POLICY "resources_delete_v2"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    -- Own resources
    created_by = auth.uid()

    -- OR admin in same org
    OR EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );

-- Analyze table for query planner
ANALYZE resources;

-- Create a function to validate workspace access
CREATE OR REPLACE FUNCTION can_access_workspace(p_workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM workspaces w
    JOIN profiles p ON p.org_id = w.org_id
    WHERE w.id = p_workspace_id
      AND p.user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION can_access_workspace IS 'Fast check if user can access a workspace';
