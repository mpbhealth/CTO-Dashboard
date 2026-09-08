/*
  # Add RLS Policies for Dual Dashboard System
  
  1. RLS Policies
    - Profiles: users see self or admin sees org
    - Workspaces: same org only
    - Resources: complex visibility model (private, shared_to_cto, shared_to_ceo, org_public)
    - Resource ACL: users see their own grants
    - Files: follow resource visibility
    - Audit logs: org-scoped
  
  2. Helper View
    - Create `me` view for auth.uid() to profile mapping
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS me;

-- Helper view: map auth.uid() to profile (using user_id column)
CREATE OR REPLACE VIEW me AS
  SELECT p.* FROM profiles p WHERE p.user_id = auth.uid();

-- Profiles: user sees self, admins see org members
DROP POLICY IF EXISTS "profiles_self_or_admin" ON profiles;
CREATE POLICY "profiles_self_or_admin"
ON profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles admin_check
    WHERE admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'
      AND admin_check.org_id = profiles.org_id
  )
);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self"
ON profiles FOR UPDATE
USING (user_id = auth.uid());

-- Workspaces: same org only
DROP POLICY IF EXISTS "workspaces_same_org" ON workspaces;
CREATE POLICY "workspaces_same_org"
ON workspaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = workspaces.org_id
  )
);

-- Allow workspace creation by authenticated users
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
CREATE POLICY "workspaces_insert"
ON workspaces FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = workspaces.org_id
      AND me.role IN ('admin', 'cto', 'ceo')
  )
);

-- Resources: complex visibility based on role and sharing
DROP POLICY IF EXISTS "resources_readable_by_visibility" ON resources;
CREATE POLICY "resources_readable_by_visibility"
ON resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = resources.org_id
  )
  AND (
    -- Owner can always see
    created_by = auth.uid()
    -- Org public is visible to all in org
    OR visibility = 'org_public'
    -- Shared to CTO visible to CTOs and admins
    OR (
      visibility = 'shared_to_cto'
      AND EXISTS (
        SELECT 1 FROM profiles me
        WHERE me.user_id = auth.uid()
          AND me.role IN ('cto', 'admin')
      )
    )
    -- Shared to CEO visible to CEOs and admins
    OR (
      visibility = 'shared_to_ceo'
      AND EXISTS (
        SELECT 1 FROM profiles me
        WHERE me.user_id = auth.uid()
          AND me.role IN ('ceo', 'admin')
      )
    )
    -- Explicit ACL grant
    OR EXISTS (
      SELECT 1 FROM resource_acl acl
      WHERE acl.resource_id = resources.id
        AND acl.grantee_profile_id = auth.uid()
        AND acl.can_read = true
    )
  )
);

-- Resources: insert requires org membership
DROP POLICY IF EXISTS "resources_insert" ON resources;
CREATE POLICY "resources_insert"
ON resources FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = resources.org_id
  )
  AND created_by = auth.uid()
);

-- Resources: update by owner or ACL write grant
DROP POLICY IF EXISTS "resources_update" ON resources;
CREATE POLICY "resources_update"
ON resources FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM resource_acl acl
    WHERE acl.resource_id = resources.id
      AND acl.grantee_profile_id = auth.uid()
      AND acl.can_write = true
  )
);

-- Resources: delete by owner only
DROP POLICY IF EXISTS "resources_delete" ON resources;
CREATE POLICY "resources_delete"
ON resources FOR DELETE
USING (created_by = auth.uid());

-- Resource ACL: users see their own grants and resource owners see all grants
DROP POLICY IF EXISTS "resource_acl_select" ON resource_acl;
CREATE POLICY "resource_acl_select"
ON resource_acl FOR SELECT
USING (
  grantee_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = resource_acl.resource_id
      AND r.created_by = auth.uid()
  )
);

-- Resource ACL: only resource owners can manage ACL
DROP POLICY IF EXISTS "resource_acl_insert" ON resource_acl;
CREATE POLICY "resource_acl_insert"
ON resource_acl FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = resource_acl.resource_id
      AND r.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "resource_acl_delete" ON resource_acl;
CREATE POLICY "resource_acl_delete"
ON resource_acl FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = resource_acl.resource_id
      AND r.created_by = auth.uid()
  )
);

-- Files: follow resource visibility
DROP POLICY IF EXISTS "files_readable_if_resource_readable" ON files;
CREATE POLICY "files_readable_if_resource_readable"
ON files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM resources r
    JOIN profiles me ON me.user_id = auth.uid()
    WHERE r.id = files.resource_id
      AND me.org_id = r.org_id
      AND (
        r.created_by = auth.uid()
        OR r.visibility = 'org_public'
        OR (r.visibility = 'shared_to_cto' AND me.role IN ('cto', 'admin'))
        OR (r.visibility = 'shared_to_ceo' AND me.role IN ('ceo', 'admin'))
        OR EXISTS (
          SELECT 1 FROM resource_acl acl
          WHERE acl.resource_id = r.id
            AND acl.grantee_profile_id = auth.uid()
            AND acl.can_read = true
        )
      )
  )
);

-- Files: insert by org members
DROP POLICY IF EXISTS "files_insert" ON files;
CREATE POLICY "files_insert"
ON files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = files.resource_id
      AND r.created_by = auth.uid()
  )
);

-- Audit logs: org-scoped read
DROP POLICY IF EXISTS "audit_logs_org_read" ON audit_logs;
CREATE POLICY "audit_logs_org_read"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = audit_logs.org_id
      AND me.role IN ('admin', 'cto', 'ceo')
  )
);

-- Audit logs: insert by authenticated
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert"
ON audit_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = audit_logs.org_id
  )
);

-- Orgs: users see their own org
DROP POLICY IF EXISTS "orgs_select" ON orgs;
CREATE POLICY "orgs_select"
ON orgs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = orgs.id
  )
);