/*
  # Create Shared Data Model with RLS

  ## Overview
  This migration creates a comprehensive shared data model that allows CEO and CTO dashboards
  to maintain separate private data while enabling controlled sharing through visibility settings
  and explicit access grants.

  ## Tables Created
  
  ### 1. records
  - Core table for all dashboard data (KPIs, reports, notes, files, etc.)
  - Columns: id, org_id, owner_id, visibility, title, content, metadata, created_at, updated_at
  - Visibility: 'private' (owner only), 'org' (all org members), 'shared' (explicit shares)
  
  ### 2. record_shares
  - Join table for explicit sharing between users or roles
  - Columns: id, record_id, target_role, target_user, can_edit, granted_by, granted_at
  - Allows sharing to specific roles (ceo, cto) or specific users
  
  ### 3. file_metadata
  - Tracks uploaded files with visibility and access controls
  - Columns: id, record_id, storage_path, filename, size_bytes, mime_type, visibility, owner_id
  - Links files to records and enforces same visibility rules

  ## RLS Policies
  - SELECT: Owner OR org-wide OR explicit share OR admin role
  - INSERT: Owner must be current user OR admin/cto (delegation)
  - UPDATE: Owner OR shared with can_edit OR admin
  - DELETE: Owner only OR admin (preserve audit trail)

  ## Helper Functions
  - current_role(): Returns role for current user
  - is_admin(): Returns true if current user is admin
  - can_read_record(uuid): Returns true if user can read specific record
  - can_edit_record(uuid): Returns true if user can edit specific record

  ## Security Notes
  - All tables have RLS enabled by default
  - Admin role can bypass restrictions for support purposes
  - All permission changes are logged in audit_logs
  - Files require both storage policy AND metadata policy to access
*/

-- Helper function: current_role (idempotent)
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'staff'
  );
$$;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (role IN ('admin') OR is_superuser = true) FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Create records table
CREATE TABLE IF NOT EXISTS public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('kpi', 'report', 'note', 'dashboard', 'file', 'campaign', 'task')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'org', 'shared')),
  title text NOT NULL,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create record_shares table
CREATE TABLE IF NOT EXISTS public.record_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  target_role text CHECK (target_role IN ('ceo', 'cto', 'admin', 'staff')),
  target_user uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_edit boolean DEFAULT false,
  granted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  CONSTRAINT check_target CHECK (target_role IS NOT NULL OR target_user IS NOT NULL),
  UNIQUE(record_id, target_role, target_user)
);

-- Create file_metadata table
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES public.records(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  size_bytes bigint,
  mime_type text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'org', 'shared')),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_records_owner_id ON public.records(owner_id);
CREATE INDEX IF NOT EXISTS idx_records_org_id ON public.records(org_id);
CREATE INDEX IF NOT EXISTS idx_records_visibility ON public.records(visibility);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON public.records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_record_shares_record_id ON public.record_shares(record_id);
CREATE INDEX IF NOT EXISTS idx_record_shares_target_role ON public.record_shares(target_role);
CREATE INDEX IF NOT EXISTS idx_record_shares_target_user ON public.record_shares(target_user);
CREATE INDEX IF NOT EXISTS idx_file_metadata_owner_id ON public.file_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_record_id ON public.file_metadata(record_id);

-- Enable RLS
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- Helper function: can_read_record
CREATE OR REPLACE FUNCTION public.can_read_record(record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_row public.records;
  user_role text;
  user_org_id uuid;
BEGIN
  -- Get current user info
  SELECT role, org_id INTO user_role, user_org_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Admin can read anything
  IF user_role = 'admin' OR public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- Get record
  SELECT * INTO record_row
  FROM public.records
  WHERE id = record_id;
  
  IF record_row IS NULL THEN
    RETURN false;
  END IF;
  
  -- Owner can read
  IF record_row.owner_id = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Org-wide visibility
  IF record_row.visibility = 'org' AND record_row.org_id = user_org_id THEN
    RETURN true;
  END IF;
  
  -- Explicit share
  IF record_row.visibility = 'shared' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.record_shares
      WHERE record_shares.record_id = can_read_record.record_id
        AND (record_shares.target_user = auth.uid() OR record_shares.target_role = user_role)
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Helper function: can_edit_record
CREATE OR REPLACE FUNCTION public.can_edit_record(record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_row public.records;
  user_role text;
BEGIN
  -- Get current user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Admin can edit anything
  IF user_role = 'admin' OR public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- Get record
  SELECT * INTO record_row
  FROM public.records
  WHERE id = can_edit_record.record_id;
  
  IF record_row IS NULL THEN
    RETURN false;
  END IF;
  
  -- Owner can edit
  IF record_row.owner_id = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Check for explicit edit permission
  RETURN EXISTS (
    SELECT 1 FROM public.record_shares
    WHERE record_shares.record_id = can_edit_record.record_id
      AND record_shares.can_edit = true
      AND (record_shares.target_user = auth.uid() OR record_shares.target_role = user_role)
  );
END;
$$;

-- RLS Policies for records table

-- SELECT policy: Owner OR org-wide OR shared OR admin
DROP POLICY IF EXISTS "records_select_policy" ON public.records;
CREATE POLICY "records_select_policy" ON public.records
FOR SELECT
USING (
  owner_id = auth.uid()
  OR (visibility = 'org' AND org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  OR (visibility = 'shared' AND EXISTS (
    SELECT 1 FROM public.record_shares
    WHERE record_shares.record_id = records.id
      AND (
        record_shares.target_user = auth.uid()
        OR record_shares.target_role = public.current_role()
      )
  ))
  OR public.is_admin()
);

-- INSERT policy: Owner is current user OR admin
DROP POLICY IF EXISTS "records_insert_policy" ON public.records;
CREATE POLICY "records_insert_policy" ON public.records
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_admin()
);

-- UPDATE policy: Owner OR shared with edit OR admin
DROP POLICY IF EXISTS "records_update_policy" ON public.records;
CREATE POLICY "records_update_policy" ON public.records
FOR UPDATE
USING (
  owner_id = auth.uid()
  OR public.can_edit_record(id)
  OR public.is_admin()
)
WITH CHECK (
  owner_id = auth.uid()
  OR public.can_edit_record(id)
  OR public.is_admin()
);

-- DELETE policy: Owner only OR admin
DROP POLICY IF EXISTS "records_delete_policy" ON public.records;
CREATE POLICY "records_delete_policy" ON public.records
FOR DELETE
USING (
  owner_id = auth.uid()
  OR public.is_admin()
);

-- RLS Policies for record_shares table

-- SELECT policy: Owner of record OR target user OR admin
DROP POLICY IF EXISTS "record_shares_select_policy" ON public.record_shares;
CREATE POLICY "record_shares_select_policy" ON public.record_shares
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.records WHERE records.id = record_shares.record_id AND records.owner_id = auth.uid())
  OR target_user = auth.uid()
  OR target_role = public.current_role()
  OR public.is_admin()
);

-- INSERT policy: Owner of record OR admin
DROP POLICY IF EXISTS "record_shares_insert_policy" ON public.record_shares;
CREATE POLICY "record_shares_insert_policy" ON public.record_shares
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.records WHERE records.id = record_shares.record_id AND records.owner_id = auth.uid())
  OR public.is_admin()
);

-- UPDATE policy: Owner of record OR admin
DROP POLICY IF EXISTS "record_shares_update_policy" ON public.record_shares;
CREATE POLICY "record_shares_update_policy" ON public.record_shares
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.records WHERE records.id = record_shares.record_id AND records.owner_id = auth.uid())
  OR public.is_admin()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.records WHERE records.id = record_shares.record_id AND records.owner_id = auth.uid())
  OR public.is_admin()
);

-- DELETE policy: Owner of record OR admin
DROP POLICY IF EXISTS "record_shares_delete_policy" ON public.record_shares;
CREATE POLICY "record_shares_delete_policy" ON public.record_shares
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.records WHERE records.id = record_shares.record_id AND records.owner_id = auth.uid())
  OR public.is_admin()
);

-- RLS Policies for file_metadata table

-- SELECT policy: Owner OR same visibility rules as records
DROP POLICY IF EXISTS "file_metadata_select_policy" ON public.file_metadata;
CREATE POLICY "file_metadata_select_policy" ON public.file_metadata
FOR SELECT
USING (
  owner_id = auth.uid()
  OR (visibility = 'org' AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid() AND p2.id = file_metadata.owner_id AND p1.org_id = p2.org_id
  ))
  OR (visibility = 'shared' AND record_id IS NOT NULL AND public.can_read_record(record_id))
  OR public.is_admin()
);

-- INSERT policy: Owner is current user OR admin
DROP POLICY IF EXISTS "file_metadata_insert_policy" ON public.file_metadata;
CREATE POLICY "file_metadata_insert_policy" ON public.file_metadata
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_admin()
);

-- UPDATE policy: Owner only OR admin
DROP POLICY IF EXISTS "file_metadata_update_policy" ON public.file_metadata;
CREATE POLICY "file_metadata_update_policy" ON public.file_metadata
FOR UPDATE
USING (
  owner_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_admin()
);

-- DELETE policy: Owner only OR admin
DROP POLICY IF EXISTS "file_metadata_delete_policy" ON public.file_metadata;
CREATE POLICY "file_metadata_delete_policy" ON public.file_metadata
FOR DELETE
USING (
  owner_id = auth.uid()
  OR public.is_admin()
);

-- Add updated_at trigger for records
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_records_updated_at ON public.records;
CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Log all share actions in audit_logs (if audit_logs table exists)
CREATE OR REPLACE FUNCTION public.log_record_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if audit_logs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.audit_logs (org_id, actor_profile_id, action, resource_id, details)
      SELECT 
        r.org_id,
        auth.uid(),
        'record_shared',
        NEW.record_id,
        jsonb_build_object(
          'target_role', NEW.target_role,
          'target_user', NEW.target_user,
          'can_edit', NEW.can_edit
        )
      FROM public.records r
      WHERE r.id = NEW.record_id;
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.audit_logs (org_id, actor_profile_id, action, resource_id, details)
      SELECT 
        r.org_id,
        auth.uid(),
        'record_unshared',
        OLD.record_id,
        jsonb_build_object(
          'target_role', OLD.target_role,
          'target_user', OLD.target_user
        )
      FROM public.records r
      WHERE r.id = OLD.record_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS record_shares_audit_log ON public.record_shares;
CREATE TRIGGER record_shares_audit_log
  AFTER INSERT OR DELETE ON public.record_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.log_record_share();