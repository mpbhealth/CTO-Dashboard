-- ============================================
-- Enable Realtime Subscriptions
-- Adds tables to supabase_realtime publication
-- ============================================

-- First, ensure the realtime publication exists
-- (It should already exist in Supabase)

-- Enable Realtime for api_incidents
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'api_incidents'
  ) THEN
    -- Set replica identity to FULL for UPDATE/DELETE events to include old row
    ALTER TABLE api_incidents REPLICA IDENTITY FULL;
    
    -- Add to realtime publication
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE api_incidents;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Already added
    END;
  END IF;
END $$;

-- Enable Realtime for deployment_logs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'deployment_logs'
  ) THEN
    ALTER TABLE deployment_logs REPLICA IDENTITY FULL;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE deployment_logs;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- Enable Realtime for assignments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'assignments'
  ) THEN
    ALTER TABLE assignments REPLICA IDENTITY FULL;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- Enable Realtime for projects
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects REPLICA IDENTITY FULL;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- Enable Realtime for tickets_cache
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tickets_cache'
  ) THEN
    ALTER TABLE tickets_cache REPLICA IDENTITY FULL;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE tickets_cache;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- Enable Realtime for compliance_tasks (we'll use this instead of compliance_incidents)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'compliance_tasks'
  ) THEN
    ALTER TABLE compliance_tasks REPLICA IDENTITY FULL;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE compliance_tasks;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- Enable Realtime for notes (for note sharing feature)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notes'
  ) THEN
    ALTER TABLE notes REPLICA IDENTITY FULL;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notes;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- Log what was enabled
DO $$
DECLARE
  tables_in_publication TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename::TEXT)
  INTO tables_in_publication
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime';
  
  RAISE NOTICE 'Tables in supabase_realtime publication: %', tables_in_publication;
END $$;
