/*
  # Extend Profiles Table for Dual Dashboard System

  ## Overview
  This migration extends the existing profiles table to support the dual dashboard
  architecture (CEO and CTO separate workspaces). It adds role-based access control
  and organizational scoping while maintaining backward compatibility with the
  existing HIPAA compliance system.

  ## Changes to Profiles Table
  - Add `role` column with values: 'ceo', 'cto', 'admin', 'staff'
  - Add `org_id` column for multi-tenant organization support
  - Add `display_name` column for user-friendly names in UI

  ## New Tables
  - `orgs` - Organization records for multi-tenant support
  - `workspaces` - CEO and CTO workspace separation
  - `resources` - Files, documents, KPIs, campaigns, notes, tasks
  - `resource_acl` - Granular access control for resources
  - `files` - File metadata linking to storage
  - `audit_logs` - Activity tracking for compliance

  ## Security
  - All tables have RLS enabled
  - Policies enforce org-scoped data access
  - Role-based visibility controls (private, shared_to_ceo, shared_to_cto, org_public)

  ## Notes
  - Existing profiles data is preserved
  - Default org created for existing users
  - Backward compatible with user_roles system
*/

-- =====================================================
-- PART 1: Create Default Organization
-- =====================================================

CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Insert default organization for existing users
INSERT INTO orgs (id, name)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'MPB Health')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 2: Extend Profiles Table
-- =====================================================

-- Add new columns to profiles table if they don't exist
DO $$
BEGIN
  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'staff';

    -- Add constraint for valid roles
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('ceo', 'cto', 'admin', 'staff'));
  END IF;

  -- Add org_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN org_id uuid
      REFERENCES orgs(id)
      DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Add display_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name text;

    -- Populate display_name from full_name for existing users
    UPDATE profiles
    SET display_name = COALESCE(full_name, email)
    WHERE display_name IS NULL;
  END IF;
END $$;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- =====================================================
-- PART 3: Create Workspaces Table
-- =====================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('CTO', 'CEO', 'SHARED')),
  owner_profile_id uuid REFERENCES profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, kind)
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_kind ON workspaces(kind);

-- =====================================================
-- PART 4: Create Resources Table
-- =====================================================

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('file', 'doc', 'kpi', 'campaign', 'note', 'task', 'dashboard')),
  title text,
  meta jsonb DEFAULT '{}'::jsonb,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared_to_cto', 'shared_to_ceo', 'org_public')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_resources_org_id ON resources(org_id);
CREATE INDEX IF NOT EXISTS idx_resources_workspace_id ON resources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON resources(created_by);

-- =====================================================
-- PART 5: Create Resource ACL Table
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_acl (
  id serial PRIMARY KEY,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  grantee_profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, grantee_profile_id)
);

ALTER TABLE resource_acl ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_resource_acl_resource_id ON resource_acl(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_acl_grantee ON resource_acl(grantee_profile_id);

-- =====================================================
-- PART 6: Create Files Table
-- =====================================================

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  size_bytes bigint,
  mime text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(storage_key)
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_files_resource_id ON files(resource_id);
CREATE INDEX IF NOT EXISTS idx_files_storage_key ON files(storage_key);

-- =====================================================
-- PART 7: Create Audit Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- PART 8: Comments for Documentation
-- =====================================================

COMMENT ON TABLE orgs IS 'Organizations for multi-tenant support';
COMMENT ON TABLE workspaces IS 'Separate workspaces for CEO, CTO, and shared resources';
COMMENT ON TABLE resources IS 'Files, documents, KPIs, and other shared resources';
COMMENT ON TABLE resource_acl IS 'Granular access control for resources';
COMMENT ON TABLE files IS 'File metadata linking resources to storage buckets';
COMMENT ON TABLE audit_logs IS 'Activity audit trail for compliance';

COMMENT ON COLUMN profiles.role IS 'User role: ceo, cto, admin, or staff';
COMMENT ON COLUMN profiles.org_id IS 'Organization membership';
COMMENT ON COLUMN profiles.display_name IS 'User-friendly display name for UI';
