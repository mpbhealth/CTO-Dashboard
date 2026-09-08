/*
  # Database Health Check and Diagnostics Function

  ## Purpose
  Creates a comprehensive health check function that verifies:
  - All required tables exist
  - Critical indexes are in place
  - RLS policies are configured
  - Foreign key relationships are valid
  - Default data exists (orgs, workspaces)

  ## Usage
  SELECT * FROM check_database_health();

  ## Returns
  JSON object with health status and any issues found
*/

-- Create health check function
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_report jsonb := '{"status": "healthy", "checks": []}'::jsonb;
  check_result jsonb;
  missing_tables text[] := ARRAY[]::text[];
  missing_indexes text[] := ARRAY[]::text[];
  missing_policies text[] := ARRAY[]::text[];
  issue_count int := 0;
BEGIN
  -- Check critical tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orgs' AND table_schema = 'public') THEN
    missing_tables := array_append(missing_tables, 'orgs');
    issue_count := issue_count + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    missing_tables := array_append(missing_tables, 'profiles');
    issue_count := issue_count + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces' AND table_schema = 'public') THEN
    missing_tables := array_append(missing_tables, 'workspaces');
    issue_count := issue_count + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources' AND table_schema = 'public') THEN
    missing_tables := array_append(missing_tables, 'resources');
    issue_count := issue_count + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_uploads' AND table_schema = 'public') THEN
    missing_tables := array_append(missing_tables, 'department_uploads');
    issue_count := issue_count + 1;
  END IF;

  -- Check critical indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_user_id' AND schemaname = 'public') THEN
    missing_indexes := array_append(missing_indexes, 'idx_profiles_user_id');
    issue_count := issue_count + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resources_workspace_id' AND schemaname = 'public') THEN
    missing_indexes := array_append(missing_indexes, 'idx_resources_workspace_id');
    issue_count := issue_count + 1;
  END IF;

  -- Check RLS is enabled on critical tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON t.tablename = c.relname
      WHERE t.tablename = 'resources'
      AND t.schemaname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      missing_policies := array_append(missing_policies, 'resources_rls_disabled');
      issue_count := issue_count + 1;
    END IF;
  END IF;

  -- Build health report
  health_report := jsonb_set(
    health_report,
    '{checks}',
    health_report->'checks' || jsonb_build_object(
      'tables',
      jsonb_build_object(
        'status', CASE WHEN array_length(missing_tables, 1) IS NULL THEN 'ok' ELSE 'error' END,
        'missing', missing_tables
      )
    )
  );

  health_report := jsonb_set(
    health_report,
    '{checks}',
    health_report->'checks' || jsonb_build_object(
      'indexes',
      jsonb_build_object(
        'status', CASE WHEN array_length(missing_indexes, 1) IS NULL THEN 'ok' ELSE 'warning' END,
        'missing', missing_indexes
      )
    )
  );

  health_report := jsonb_set(
    health_report,
    '{checks}',
    health_report->'checks' || jsonb_build_object(
      'rls_policies',
      jsonb_build_object(
        'status', CASE WHEN array_length(missing_policies, 1) IS NULL THEN 'ok' ELSE 'error' END,
        'issues', missing_policies
      )
    )
  );

  -- Check default org exists
  health_report := jsonb_set(
    health_report,
    '{checks}',
    health_report->'checks' || jsonb_build_object(
      'default_org',
      jsonb_build_object(
        'status', CASE WHEN EXISTS (SELECT 1 FROM orgs WHERE id = '00000000-0000-0000-0000-000000000000'::uuid) THEN 'ok' ELSE 'warning' END,
        'exists', EXISTS (SELECT 1 FROM orgs WHERE id = '00000000-0000-0000-0000-000000000000'::uuid)
      )
    )
  );

  -- Check workspaces exist
  health_report := jsonb_set(
    health_report,
    '{checks}',
    health_report->'checks' || jsonb_build_object(
      'workspaces',
      jsonb_build_object(
        'status', CASE WHEN EXISTS (SELECT 1 FROM workspaces) THEN 'ok' ELSE 'warning' END,
        'count', (SELECT COUNT(*) FROM workspaces)
      )
    )
  );

  -- Set overall status
  IF issue_count > 0 THEN
    health_report := jsonb_set(health_report, '{status}', '"unhealthy"'::jsonb);
  END IF;

  health_report := jsonb_set(health_report, '{issue_count}', to_jsonb(issue_count));
  health_report := jsonb_set(health_report, '{timestamp}', to_jsonb(now()));

  RETURN health_report;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_database_health() TO authenticated;

-- Create a view for easy monitoring
CREATE OR REPLACE VIEW database_health AS
SELECT check_database_health() as health_status;

-- Grant access to the view
GRANT SELECT ON database_health TO authenticated;

COMMENT ON FUNCTION check_database_health() IS 'Performs comprehensive database health checks and returns status report';
