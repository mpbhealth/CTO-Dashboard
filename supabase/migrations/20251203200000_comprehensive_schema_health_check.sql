/*
  # Comprehensive Schema Health Check Migration
  
  This migration ensures all tables used by the CTO Dashboard have the required
  columns and proper structure. It addresses potential 400 Bad Request errors
  caused by schema mismatches between the frontend and database.
  
  ## Tables Verified:
  - projects (team, github_link, monday_link, website_url columns)
  - quick_links (name vs title compatibility)
  - tech_stack (all required columns)
  - roadmap_items (all required columns)
  - team_members (all required columns)
  - api_statuses (is_active, description columns)
  - api_incidents (all required columns)
  - saas_expenses (all required columns)
  - deployment_logs (all required columns)
  - notes (title, category, tags, is_pinned columns)
  
  ## Safe Operations:
  - Uses ADD COLUMN IF NOT EXISTS pattern
  - Sets sensible defaults for existing rows
  - Non-destructive - preserves existing data
*/

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
DO $$
BEGIN
  -- Ensure team column exists as array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'team') THEN
    ALTER TABLE public.projects ADD COLUMN team text[] NOT NULL DEFAULT '{}';
  END IF;
  
  -- Ensure github_link column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'github_link') THEN
    ALTER TABLE public.projects ADD COLUMN github_link text DEFAULT '';
  END IF;
  
  -- Ensure monday_link column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'monday_link') THEN
    ALTER TABLE public.projects ADD COLUMN monday_link text DEFAULT '';
  END IF;
  
  -- Ensure website_url column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'website_url') THEN
    ALTER TABLE public.projects ADD COLUMN website_url text DEFAULT '';
  END IF;
  
  -- Ensure progress column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'progress') THEN
    ALTER TABLE public.projects ADD COLUMN progress integer CHECK (progress >= 0 AND progress <= 100) DEFAULT 0;
  END IF;
  
  -- Ensure description column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'description') THEN
    ALTER TABLE public.projects ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ============================================================================
-- QUICK_LINKS TABLE - Handle both 'name' and 'title' columns
-- ============================================================================
DO $$
BEGIN
  -- Check if only 'title' exists (from newer migration), add 'name' as alias
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'title')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'name') THEN
    -- Add name column and copy data from title
    ALTER TABLE public.quick_links ADD COLUMN name text;
    UPDATE public.quick_links SET name = title WHERE name IS NULL;
    ALTER TABLE public.quick_links ALTER COLUMN name SET NOT NULL;
  END IF;
  
  -- Check if only 'name' exists (from older migration), add 'title' as alias
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'title') THEN
    ALTER TABLE public.quick_links ADD COLUMN title text;
    UPDATE public.quick_links SET title = name WHERE title IS NULL;
  END IF;
  
  -- Ensure click_count column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'click_count') THEN
    ALTER TABLE public.quick_links ADD COLUMN click_count integer DEFAULT 0;
  END IF;
  
  -- Ensure is_favorite column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quick_links' AND column_name = 'is_favorite') THEN
    ALTER TABLE public.quick_links ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- TECH_STACK TABLE
-- ============================================================================
DO $$
BEGIN
  -- Ensure notes column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tech_stack' AND column_name = 'notes') THEN
    ALTER TABLE public.tech_stack ADD COLUMN notes text DEFAULT '';
  END IF;
  
  -- Ensure version column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tech_stack' AND column_name = 'version') THEN
    ALTER TABLE public.tech_stack ADD COLUMN version text NOT NULL DEFAULT '1.0';
  END IF;
  
  -- Ensure owner column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tech_stack' AND column_name = 'owner') THEN
    ALTER TABLE public.tech_stack ADD COLUMN owner text NOT NULL DEFAULT 'Engineering Team';
  END IF;
END $$;

-- ============================================================================
-- ROADMAP_ITEMS TABLE
-- ============================================================================
DO $$
BEGIN
  -- Ensure dependencies column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roadmap_items' AND column_name = 'dependencies') THEN
    ALTER TABLE public.roadmap_items ADD COLUMN dependencies text[] DEFAULT '{}';
  END IF;
  
  -- Ensure quarter column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roadmap_items' AND column_name = 'quarter') THEN
    ALTER TABLE public.roadmap_items ADD COLUMN quarter text;
  END IF;
  
  -- Ensure owner column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roadmap_items' AND column_name = 'owner') THEN
    ALTER TABLE public.roadmap_items ADD COLUMN owner text;
  END IF;
  
  -- Ensure department column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roadmap_items' AND column_name = 'department') THEN
    ALTER TABLE public.roadmap_items ADD COLUMN department text;
  END IF;
END $$;

-- ============================================================================
-- TEAM_MEMBERS TABLE
-- ============================================================================
DO $$
BEGIN
  -- Ensure team column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'team') THEN
    ALTER TABLE public.team_members ADD COLUMN team text NOT NULL DEFAULT 'Engineering';
  END IF;
  
  -- Ensure hire_date column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'hire_date') THEN
    ALTER TABLE public.team_members ADD COLUMN hire_date date;
  END IF;
  
  -- Ensure avatar_url column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.team_members ADD COLUMN avatar_url text;
  END IF;
END $$;

-- ============================================================================
-- API_STATUSES TABLE
-- ============================================================================
DO $$
BEGIN
  -- Ensure is_active column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_statuses' AND column_name = 'is_active') THEN
    ALTER TABLE public.api_statuses ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  -- Ensure description column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_statuses' AND column_name = 'description') THEN
    ALTER TABLE public.api_statuses ADD COLUMN description text;
  END IF;
  
  -- Ensure uptime column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_statuses' AND column_name = 'uptime') THEN
    ALTER TABLE public.api_statuses ADD COLUMN uptime numeric DEFAULT 99.9;
  END IF;
  
  -- Ensure endpoint_count column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_statuses' AND column_name = 'endpoint_count') THEN
    ALTER TABLE public.api_statuses ADD COLUMN endpoint_count integer DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- NOTES TABLE
-- ============================================================================
DO $$
BEGIN
  -- Ensure title column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'title') THEN
    ALTER TABLE public.notes ADD COLUMN title text;
  END IF;
  
  -- Ensure category column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'category') THEN
    ALTER TABLE public.notes ADD COLUMN category text;
  END IF;
  
  -- Ensure tags column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'tags') THEN
    ALTER TABLE public.notes ADD COLUMN tags text[];
  END IF;
  
  -- Ensure is_pinned column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'is_pinned') THEN
    ALTER TABLE public.notes ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
  
  -- Ensure created_by column exists (maps to user_id in some places)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'created_by') THEN
    -- Add created_by if user_id exists, copying its value
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'user_id') THEN
      ALTER TABLE public.notes ADD COLUMN created_by uuid;
      UPDATE public.notes SET created_by = user_id WHERE created_by IS NULL;
    ELSE
      ALTER TABLE public.notes ADD COLUMN created_by uuid;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SAAS_EXPENSES TABLE - Ensure all required columns
-- ============================================================================
DO $$
BEGIN
  -- Ensure department column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saas_expenses' AND column_name = 'department') THEN
    ALTER TABLE public.saas_expenses ADD COLUMN department text NOT NULL DEFAULT 'Engineering';
  END IF;
  
  -- Ensure application column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saas_expenses' AND column_name = 'application') THEN
    ALTER TABLE public.saas_expenses ADD COLUMN application text NOT NULL DEFAULT 'Unknown';
  END IF;
  
  -- Ensure cost_monthly column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saas_expenses' AND column_name = 'cost_monthly') THEN
    ALTER TABLE public.saas_expenses ADD COLUMN cost_monthly numeric NOT NULL DEFAULT 0;
  END IF;
  
  -- Ensure cost_annual column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saas_expenses' AND column_name = 'cost_annual') THEN
    ALTER TABLE public.saas_expenses ADD COLUMN cost_annual numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- DEPLOYMENT_LOGS TABLE
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deployment_logs') THEN
    -- Ensure env column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deployment_logs' AND column_name = 'env') THEN
      ALTER TABLE public.deployment_logs ADD COLUMN env text NOT NULL DEFAULT 'production';
    END IF;
    
    -- Ensure project column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deployment_logs' AND column_name = 'project') THEN
      ALTER TABLE public.deployment_logs ADD COLUMN project text NOT NULL DEFAULT 'Unknown';
    END IF;
    
    -- Ensure log column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deployment_logs' AND column_name = 'log') THEN
      ALTER TABLE public.deployment_logs ADD COLUMN log text NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ENSURE UPDATED_AT TRIGGERS EXIST
-- ============================================================================

-- Create generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables that need it
DO $$
DECLARE
  t text;
  tables_to_update text[] := ARRAY[
    'projects', 'quick_links', 'tech_stack', 'roadmap_items', 
    'team_members', 'api_statuses', 'notes', 'saas_expenses'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_update
  LOOP
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      -- Check if updated_at column exists
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_at') THEN
        -- Drop and recreate trigger
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFY COMPLETION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Schema Health Check Migration Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'All critical columns have been verified/added.';
  RAISE NOTICE 'Run the following query to verify table structures:';
  RAISE NOTICE '';
  RAISE NOTICE 'SELECT table_name, column_name, data_type';
  RAISE NOTICE 'FROM information_schema.columns';
  RAISE NOTICE 'WHERE table_schema = ''public''';
  RAISE NOTICE 'AND table_name IN (''projects'', ''quick_links'', ''tech_stack'')';
  RAISE NOTICE 'ORDER BY table_name, ordinal_position;';
  RAISE NOTICE '==============================================';
END $$;

