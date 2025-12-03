/*
  # RLS Policy Verification Diagnostic
  
  This migration creates helper functions to verify RLS policies are correctly
  configured for all tables. It helps diagnose permission-related 400/403 errors.
  
  ## Features:
  - Function to list all tables with RLS status
  - Function to list all policies by table
  - Function to verify user access to critical tables
  - Diagnostic views for policy analysis
  
  ## Usage:
  Run these queries to diagnose RLS issues:
  - SELECT * FROM rls_table_status;
  - SELECT * FROM rls_policies_summary;
  - SELECT verify_user_access('your-user-id-here');
*/

-- ============================================================================
-- DROP EXISTING DIAGNOSTIC OBJECTS (to allow re-run)
-- ============================================================================
DROP VIEW IF EXISTS rls_table_status CASCADE;
DROP VIEW IF EXISTS rls_policies_summary CASCADE;
DROP FUNCTION IF EXISTS verify_user_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_accessible_tables(uuid) CASCADE;

-- ============================================================================
-- VIEW: RLS Table Status
-- Shows all public tables and whether RLS is enabled
-- ============================================================================
CREATE OR REPLACE VIEW rls_table_status AS
SELECT 
  t.tablename AS table_name,
  t.rowsecurity AS rls_enabled,
  COALESCE(p.policy_count, 0) AS policy_count,
  CASE 
    WHEN NOT t.rowsecurity THEN 'WARNING: RLS disabled'
    WHEN p.policy_count = 0 THEN 'WARNING: RLS enabled but no policies'
    ELSE 'OK'
  END AS status
FROM pg_tables t
LEFT JOIN (
  SELECT 
    schemaname,
    tablename,
    COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- ============================================================================
-- VIEW: RLS Policies Summary
-- Shows all policies with their details
-- ============================================================================
CREATE OR REPLACE VIEW rls_policies_summary AS
SELECT 
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FUNCTION: Verify User Access
-- Checks if a user has access to critical tables
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_user_access(user_uuid uuid)
RETURNS TABLE(
  table_name text,
  can_select boolean,
  can_insert boolean,
  can_update boolean,
  can_delete boolean,
  notes text
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  critical_tables text[] := ARRAY[
    'profiles', 'projects', 'quick_links', 'tech_stack', 
    'roadmap_items', 'team_members', 'notes', 'assignments',
    'api_statuses', 'deployment_logs', 'saas_expenses'
  ];
  t text;
  profile_role text;
  profile_org_id uuid;
BEGIN
  -- Get user's profile info
  SELECT role, org_id INTO profile_role, profile_org_id
  FROM profiles
  WHERE profiles.user_id = user_uuid;
  
  IF profile_role IS NULL THEN
    RETURN QUERY SELECT 
      'profiles'::text,
      false,
      false,
      false,
      false,
      'User profile not found - user may not have access to any tables'::text;
    RETURN;
  END IF;
  
  -- Return a summary for each critical table
  FOREACH t IN ARRAY critical_tables
  LOOP
    -- This is a simplified check - actual access depends on specific policies
    RETURN QUERY SELECT 
      t,
      CASE 
        WHEN profile_role IN ('ceo', 'cto', 'admin') THEN true
        WHEN t = 'profiles' THEN true -- Users can always see their own profile
        WHEN t IN ('projects', 'quick_links', 'tech_stack', 'roadmap_items', 'team_members') THEN true
        ELSE false
      END,
      CASE 
        WHEN profile_role IN ('cto', 'admin') THEN true
        WHEN t = 'notes' THEN true -- Users can insert their own notes
        WHEN t = 'assignments' THEN true -- Users can create assignments
        ELSE false
      END,
      CASE 
        WHEN profile_role IN ('cto', 'admin') THEN true
        WHEN t = 'profiles' AND profile_role = profile_role THEN true
        WHEN t = 'notes' THEN true
        ELSE false
      END,
      CASE 
        WHEN profile_role IN ('cto', 'admin') THEN true
        WHEN t = 'notes' THEN true
        ELSE false
      END,
      format('Role: %s, Org: %s', profile_role, COALESCE(profile_org_id::text, 'N/A'));
  END LOOP;
END;
$$;

-- ============================================================================
-- FUNCTION: Get User Accessible Tables
-- Returns list of tables a user can access
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_accessible_tables(user_uuid uuid)
RETURNS TABLE(
  table_name text,
  access_level text
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  profile_role text;
BEGIN
  -- Get user's role
  SELECT role INTO profile_role
  FROM profiles
  WHERE profiles.user_id = user_uuid;
  
  IF profile_role IS NULL THEN
    RETURN QUERY SELECT 'No profile found'::text, 'none'::text;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    t.tablename::text,
    CASE 
      WHEN profile_role IN ('admin', 'ceo', 'cto') THEN 'full'
      WHEN profile_role = 'cfo' AND t.tablename IN ('finance_records', 'saas_expenses', 'profiles') THEN 'full'
      WHEN profile_role = 'cmo' AND t.tablename IN ('marketing_properties', 'marketing_utm_campaigns', 'profiles') THEN 'full'
      WHEN t.tablename = 'profiles' THEN 'own_only'
      WHEN t.tablename = 'notes' THEN 'own_only'
      WHEN t.tablename = 'assignments' THEN 'assigned_only'
      WHEN t.tablename IN ('projects', 'quick_links', 'tech_stack', 'roadmap_items', 'team_members') THEN 'read_only'
      ELSE 'none'
    END
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'stg_%'
  ORDER BY t.tablename;
END;
$$;

-- ============================================================================
-- GRANT ACCESS TO DIAGNOSTIC FUNCTIONS
-- ============================================================================
GRANT SELECT ON rls_table_status TO authenticated;
GRANT SELECT ON rls_policies_summary TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_tables(uuid) TO authenticated;

-- ============================================================================
-- ENSURE CRITICAL TABLES HAVE RLS ENABLED
-- ============================================================================
DO $$
DECLARE
  t text;
  critical_tables text[] := ARRAY[
    'profiles', 'projects', 'quick_links', 'tech_stack', 
    'roadmap_items', 'team_members', 'notes', 'assignments',
    'api_statuses', 'deployment_logs', 'saas_expenses',
    'note_shares', 'note_notifications', 'resources', 'files',
    'workspaces', 'departments', 'policy_documents'
  ];
BEGIN
  FOREACH t IN ARRAY critical_tables
  LOOP
    -- Check if table exists before enabling RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS verified/enabled on: %', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- ENSURE BASIC POLICIES EXIST FOR CRITICAL TABLES
-- ============================================================================

-- Projects: Ensure authenticated users can read
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'authenticated_read_projects') THEN
    CREATE POLICY "authenticated_read_projects" ON public.projects
      FOR SELECT TO authenticated USING (true);
    RAISE NOTICE 'Created read policy for projects';
  END IF;
END $$;

-- Quick Links: Ensure authenticated users can read and manage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quick_links' AND policyname = 'authenticated_manage_quick_links') THEN
    CREATE POLICY "authenticated_manage_quick_links" ON public.quick_links
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created manage policy for quick_links';
  END IF;
END $$;

-- Tech Stack: Ensure authenticated users can read and manage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tech_stack' AND policyname = 'authenticated_manage_tech_stack') THEN
    CREATE POLICY "authenticated_manage_tech_stack" ON public.tech_stack
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created manage policy for tech_stack';
  END IF;
END $$;

-- Team Members: Ensure authenticated users can read and manage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'authenticated_manage_team_members') THEN
    CREATE POLICY "authenticated_manage_team_members" ON public.team_members
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created manage policy for team_members';
  END IF;
END $$;

-- API Statuses: Ensure authenticated users can manage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_statuses' AND policyname = 'authenticated_manage_api_statuses') THEN
    CREATE POLICY "authenticated_manage_api_statuses" ON public.api_statuses
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created manage policy for api_statuses';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS Policy Verification Diagnostic Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'To check RLS status, run:';
  RAISE NOTICE '  SELECT * FROM rls_table_status;';
  RAISE NOTICE '';
  RAISE NOTICE 'To see all policies, run:';
  RAISE NOTICE '  SELECT * FROM rls_policies_summary;';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify user access, run:';
  RAISE NOTICE '  SELECT * FROM verify_user_access(''user-uuid-here'');';
  RAISE NOTICE '==============================================';
END $$;

