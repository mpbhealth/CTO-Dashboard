/*
  # Comprehensive Database Health Check System

  ## Features
  1. Health check function for all critical tables
  2. RLS policy validation
  3. Index performance monitoring
  4. Query execution time tracking
  5. Connection pool monitoring

  ## Usage
  SELECT * FROM check_full_database_health();
  SELECT * FROM database_health_summary;
*/

-- Enhanced health check function
CREATE OR REPLACE FUNCTION check_full_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_report jsonb := '{"status": "healthy", "timestamp": "", "checks": {}}'::jsonb;
  check_result jsonb;
  table_list text[] := ARRAY[
    'profiles', 'orgs', 'workspaces', 'resources', 'department_uploads',
    'department_notes', 'shared_content', 'resource_acl', 'assignments'
  ];
  missing_tables text[] := ARRAY[]::text[];
  table_name text;
  table_count bigint;
  has_rls boolean;
  policy_count int;
BEGIN
  -- Set timestamp
  health_report := jsonb_set(
    health_report,
    '{timestamp}',
    to_jsonb(now())
  );

  -- Check each critical table
  FOREACH table_name IN ARRAY table_list
  LOOP
    -- Check if table exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
      CONTINUE;
    END IF;

    -- Get row count
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_count;

    -- Check RLS status
    SELECT c.relrowsecurity INTO has_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = table_name
      AND n.nspname = 'public';

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_name;

    -- Add table health to report
    health_report := jsonb_set(
      health_report,
      ARRAY['checks', table_name],
      jsonb_build_object(
        'exists', true,
        'row_count', table_count,
        'rls_enabled', COALESCE(has_rls, false),
        'policy_count', policy_count,
        'status', CASE
          WHEN NOT COALESCE(has_rls, false) THEN 'warning'
          WHEN policy_count = 0 THEN 'warning'
          ELSE 'ok'
        END
      )
    );
  END LOOP;

  -- Add missing tables summary
  IF array_length(missing_tables, 1) > 0 THEN
    health_report := jsonb_set(
      health_report,
      '{missing_tables}',
      to_jsonb(missing_tables)
    );
    health_report := jsonb_set(
      health_report,
      '{status}',
      '"unhealthy"'::jsonb
    );
  END IF;

  -- Check indexes on critical tables
  health_report := jsonb_set(
    health_report,
    '{indexes}',
    (
      SELECT jsonb_object_agg(
        tablename,
        jsonb_build_object(
          'count', COUNT(*),
          'indexes', jsonb_agg(indexname)
        )
      )
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ANY(table_list)
      GROUP BY tablename
    )
  );

  -- Add connection info
  health_report := jsonb_set(
    health_report,
    '{connections}',
    (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE state = 'active'),
        'idle', COUNT(*) FILTER (WHERE state = 'idle')
      )
      FROM pg_stat_activity
      WHERE datname = current_database()
    )
  );

  RETURN health_report;
END;
$$;

-- Create a materialized view for health monitoring
CREATE MATERIALIZED VIEW IF NOT EXISTS database_health_summary AS
SELECT
  now() as last_check,
  (SELECT COUNT(*) FROM profiles) as profile_count,
  (SELECT COUNT(*) FROM orgs) as org_count,
  (SELECT COUNT(*) FROM workspaces) as workspace_count,
  (SELECT COUNT(*) FROM resources) as resource_count,
  (SELECT COUNT(*) FROM department_uploads) as upload_count,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) as connection_count,
  (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_summary_check ON database_health_summary(last_check);

-- Function to refresh health summary
CREATE OR REPLACE FUNCTION refresh_health_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY database_health_summary;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_full_database_health() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_health_summary() TO authenticated;
GRANT SELECT ON database_health_summary TO authenticated;

-- Create function to check query performance
CREATE OR REPLACE FUNCTION check_slow_queries()
RETURNS TABLE(
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  max_time double precision
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    max_exec_time as max_time
  FROM pg_stat_statements
  WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
  ORDER BY mean_exec_time DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION check_slow_queries() TO authenticated;

COMMENT ON FUNCTION check_full_database_health() IS 'Comprehensive health check of all critical tables and systems';
COMMENT ON FUNCTION refresh_health_summary() IS 'Refresh the health summary materialized view';
COMMENT ON FUNCTION check_slow_queries() IS 'Check for slow-running queries';
