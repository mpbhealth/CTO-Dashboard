/*
  # Complete Database Setup for MPB Health CTO Dashboard
  
  This seed file creates all missing tables and RLS policies safely.
  Run this manually in Supabase SQL Editor after Bolt builds to avoid conflicts.
  
  ## What This Creates:
  1. Missing Tables: saas_expenses, users (enhanced), marketing tables
  2. Safe RLS Policies: Conditional creation with conflict prevention
  3. Performance Indexes: Optimized for common queries
  4. Triggers: Auto-updating timestamps
  5. Verification: Logging to confirm successful setup
*/

-- =============================================
-- HELPER FUNCTIONS FOR SAFE POLICY CREATION
-- =============================================

CREATE OR REPLACE FUNCTION create_policy_safe(
  table_name TEXT,
  policy_name TEXT,
  policy_command TEXT,
  policy_role TEXT,
  policy_using TEXT DEFAULT NULL,
  policy_check TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
  
  -- Create new policy
  IF policy_check IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I USING (%s) WITH CHECK (%s)', 
      policy_name, table_name, policy_command, policy_role, policy_using, policy_check);
  ELSIF policy_using IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I USING (%s)', 
      policy_name, table_name, policy_command, policy_role, policy_using);
  ELSE
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I', 
      policy_name, table_name, policy_command, policy_role);
  END IF;
  
  RAISE NOTICE 'Policy "%" created on table "%"', policy_name, table_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MISSING TABLES CREATION
-- =============================================

-- Create saas_expenses table (for SaaS Spend Management)
CREATE TABLE IF NOT EXISTS public.saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  application text NOT NULL,
  description text,
  cost_monthly numeric NOT NULL DEFAULT 0,
  cost_annual numeric NOT NULL DEFAULT 0,
  platform text,
  url text,
  renewal_date date,
  notes text,
  source_sheet text DEFAULT 'manual_entry',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for saas_expenses
CREATE INDEX IF NOT EXISTS idx_saas_expenses_department ON public.saas_expenses(department);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_at ON public.saas_expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date ON public.saas_expenses(renewal_date);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by ON public.saas_expenses(created_by);

-- Enable RLS on saas_expenses
ALTER TABLE public.saas_expenses ENABLE ROW LEVEL SECURITY;

-- Create marketing_properties table (if not exists from schema)
CREATE TABLE IF NOT EXISTS public.marketing_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text,
  ga_property_id text,
  ga_measurement_id text,
  ga_connected boolean DEFAULT false,
  fb_pixel_id text,
  fb_connected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for marketing_properties
CREATE INDEX IF NOT EXISTS idx_marketing_properties_user_id ON public.marketing_properties(user_id);

-- Enable RLS on marketing_properties
ALTER TABLE public.marketing_properties ENABLE ROW LEVEL SECURITY;

-- Create marketing_metrics table (if not exists from schema)
CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.marketing_properties(id) ON DELETE CASCADE,
  date date NOT NULL,
  sessions integer DEFAULT 0,
  users integer DEFAULT 0,
  pageviews integer DEFAULT 0,
  bounce_rate double precision DEFAULT 0,
  conversions integer DEFAULT 0,
  avg_session_duration double precision DEFAULT 0,
  traffic_source text,
  campaign_name text,
  revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  conversion_type text
);

-- Create indexes for marketing_metrics
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_property_id ON public.marketing_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_date ON public.marketing_metrics(date);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_property_date ON public.marketing_metrics(property_id, date);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_traffic_source ON public.marketing_metrics(traffic_source);

-- Create unique constraint for marketing_metrics
CREATE UNIQUE INDEX IF NOT EXISTS marketing_metrics_property_id_date_traffic_source_key 
ON public.marketing_metrics(property_id, date, traffic_source);

-- Enable RLS on marketing_metrics
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;

-- Enhance users table if needed (safely add columns)
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'full_name') THEN
    ALTER TABLE public.users ADD COLUMN full_name text;
  END IF;
  
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;
END $$;

-- =============================================
-- SAFE RLS POLICY CREATION FOR ALL TABLES
-- =============================================

-- ASSIGNMENTS TABLE POLICIES
SELECT create_policy_safe(
  'assignments',
  'Users can view their assignments', 
  'SELECT',
  'authenticated',
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'assignments',
  'Users can create their assignments',
  'INSERT', 
  'authenticated',
  NULL,
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'assignments',
  'Users can update their assignments',
  'UPDATE',
  'authenticated', 
  'auth.uid() = assigned_to',
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'assignments',
  'Users can delete their assignments',
  'DELETE',
  'authenticated',
  'auth.uid() = assigned_to'
);

-- SAAS_EXPENSES TABLE POLICIES
SELECT create_policy_safe(
  'saas_expenses',
  'Users can view all expenses',
  'SELECT',
  'authenticated',
  'true'
);

SELECT create_policy_safe(
  'saas_expenses', 
  'Users can create expenses',
  'INSERT',
  'authenticated',
  NULL,
  'auth.uid() = created_by'
);

SELECT create_policy_safe(
  'saas_expenses',
  'Users can update expenses',
  'UPDATE',
  'authenticated',
  'auth.uid() = created_by',
  'auth.uid() = created_by'
);

SELECT create_policy_safe(
  'saas_expenses',
  'Users can delete expenses', 
  'DELETE',
  'authenticated',
  'auth.uid() = created_by'
);

-- MARKETING_PROPERTIES TABLE POLICIES  
SELECT create_policy_safe(
  'marketing_properties',
  'Users can view their properties',
  'SELECT',
  'authenticated',
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'marketing_properties',
  'Users can create their properties',
  'INSERT',
  'authenticated', 
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'marketing_properties',
  'Users can update their properties',
  'UPDATE',
  'authenticated',
  'auth.uid() = user_id',
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'marketing_properties',
  'Users can delete their properties',
  'DELETE', 
  'authenticated',
  'auth.uid() = user_id'
);

-- MARKETING_METRICS TABLE POLICIES
SELECT create_policy_safe(
  'marketing_metrics',
  'Users can view their metrics',
  'SELECT',
  'authenticated',
  'auth.uid() IN (SELECT user_id FROM marketing_properties WHERE marketing_properties.id = marketing_metrics.property_id)'
);

SELECT create_policy_safe(
  'marketing_metrics',
  'Users can insert their metrics',
  'INSERT',
  'authenticated',
  NULL,
  'auth.uid() IN (SELECT user_id FROM marketing_properties WHERE marketing_properties.id = marketing_metrics.property_id)'
);

-- NOTES TABLE POLICIES (if notes table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    PERFORM create_policy_safe(
      'notes',
      'Users can view their notes',
      'SELECT', 
      'authenticated',
      'auth.uid() = user_id'
    );
    
    PERFORM create_policy_safe(
      'notes',
      'Users can create their notes',
      'INSERT',
      'authenticated',
      NULL,
      'auth.uid() = user_id'
    );
    
    PERFORM create_policy_safe(
      'notes',
      'Users can update their notes', 
      'UPDATE',
      'authenticated',
      'auth.uid() = user_id',
      'auth.uid() = user_id'
    );
    
    PERFORM create_policy_safe(
      'notes',
      'Users can delete their notes',
      'DELETE',
      'authenticated', 
      'auth.uid() = user_id'
    );
  END IF;
END $$;

-- USERS TABLE POLICIES (enhanced)
SELECT create_policy_safe(
  'users',
  'Users can read own profile',
  'SELECT',
  'authenticated',
  'auth.uid() = auth_user_id'
);

SELECT create_policy_safe(
  'users', 
  'Users can insert own profile',
  'INSERT',
  'authenticated',
  NULL,
  'auth.uid() = auth_user_id'
);

SELECT create_policy_safe(
  'users',
  'Users can update own profile',
  'UPDATE',
  'authenticated',
  'auth.uid() = auth_user_id',
  'auth.uid() = auth_user_id'
);

-- SHARED/READONLY TABLE POLICIES (for dashboard data)
-- Allow authenticated users to read shared dashboard data
DO $$
DECLARE
  shared_table TEXT;
BEGIN
  FOR shared_table IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('kpi_data', 'tech_stack', 'roadmap_items', 'projects', 'vendors', 'ai_agents', 'api_statuses', 'deployment_logs', 'team_members')
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', shared_table);
    
    -- Create read policy for authenticated users
    PERFORM create_policy_safe(
      shared_table,
      'Authenticated users can read data',
      'SELECT',
      'authenticated', 
      'true'
    );
    
    -- Create management policies for authenticated users
    PERFORM create_policy_safe(
      shared_table,
      'Authenticated users can manage data',
      'ALL',
      'authenticated',
      'true',
      'true'
    );
  END LOOP;
END $$;

-- =============================================
-- CREATE MISSING TRIGGERS FOR AUTO-TIMESTAMPS
-- =============================================

-- Create reusable trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to saas_expenses
DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON public.saas_expenses;
CREATE TRIGGER update_saas_expenses_updated_at
  BEFORE UPDATE ON public.saas_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to marketing_properties  
DROP TRIGGER IF EXISTS update_marketing_properties_updated_at ON public.marketing_properties;
CREATE TRIGGER update_marketing_properties_updated_at
  BEFORE UPDATE ON public.marketing_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample SaaS expenses (only if table is empty)
INSERT INTO public.saas_expenses (department, application, description, cost_monthly, cost_annual, platform, url, source_sheet)
SELECT 
  'Engineering', 'Supabase', 'Database and Backend Services', 50, 600, 'Cloud Platform', 'https://supabase.com', 'initial_seed'
WHERE NOT EXISTS (SELECT 1 FROM public.saas_expenses WHERE application = 'Supabase');

INSERT INTO public.saas_expenses (department, application, description, cost_monthly, cost_annual, platform, url, source_sheet)
SELECT 
  'Engineering', 'GitHub Enterprise', 'Code Repository and CI/CD', 21, 252, 'Development Platform', 'https://github.com', 'initial_seed'
WHERE NOT EXISTS (SELECT 1 FROM public.saas_expenses WHERE application = 'GitHub Enterprise');

INSERT INTO public.saas_expenses (department, application, description, cost_monthly, cost_annual, platform, url, source_sheet)
SELECT 
  'Marketing', 'HubSpot', 'CRM and Marketing Automation', 120, 1440, 'Marketing Platform', 'https://hubspot.com', 'initial_seed'
WHERE NOT EXISTS (SELECT 1 FROM public.saas_expenses WHERE application = 'HubSpot');

-- =============================================
-- VERIFICATION AND CLEANUP
-- =============================================

-- Log successful completion
INSERT INTO public.sync_logs (service, operation, status, message, details, records_processed)
VALUES (
  'database_seed',
  'comprehensive_setup', 
  'success',
  'Complete database setup with all tables and RLS policies',
  jsonb_build_object(
    'tables_created', ARRAY['saas_expenses', 'marketing_properties', 'marketing_metrics'],
    'policies_applied', 'all_tables',
    'triggers_created', 'updated_at_triggers',
    'sample_data', 'seeded'
  ),
  (SELECT COUNT(*) FROM public.saas_expenses)
) 
ON CONFLICT DO NOTHING;

-- Clean up helper function (optional - remove if you want to keep it)
-- DROP FUNCTION IF EXISTS create_policy_safe(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Final verification
DO $$
DECLARE
  table_count integer;
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('saas_expenses', 'marketing_properties', 'marketing_metrics', 'assignments', 'notes', 'users');
  
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Database setup complete! Tables: %, Policies: %', table_count, policy_count;
END $$;