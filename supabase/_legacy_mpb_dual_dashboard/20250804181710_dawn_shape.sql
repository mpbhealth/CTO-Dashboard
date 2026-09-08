/*
  # Comprehensive Database Setup - MPB Health CTO Dashboard
  
  This migration consolidates all required database changes:
  
  1. Tables Created/Updated:
     - assignments (task management)
     - saas_expenses (SaaS spend tracking)
     - marketing_properties (marketing analytics)
     - marketing_metrics (analytics data)
     - notes (user notes)
     - users (user profiles)
     
  2. Security:
     - Enable RLS on all tables
     - Create user-isolated policies
     - Proper authentication checks
     
  3. Performance:
     - Indexes for common queries
     - Triggers for auto-updating timestamps
*/

-- ===========================================
-- UTILITY FUNCTIONS
-- ===========================================

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DROP EXISTING POLICIES (AVOID CONFLICTS)
-- ===========================================

-- Drop all existing policies to avoid conflicts
DO $$
BEGIN
  -- Assignments table policies
  DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can create their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can insert their assignments" ON assignments;
  
  -- SaaS expenses policies
  DROP POLICY IF EXISTS "Users can manage their expenses" ON saas_expenses;
  DROP POLICY IF EXISTS "Users can view their expenses" ON saas_expenses;
  DROP POLICY IF EXISTS "Users can insert their expenses" ON saas_expenses;
  DROP POLICY IF EXISTS "Users can update their expenses" ON saas_expenses;
  DROP POLICY IF EXISTS "Users can delete their expenses" ON saas_expenses;
  
  -- Marketing properties policies
  DROP POLICY IF EXISTS "Users can view their marketing properties" ON marketing_properties;
  DROP POLICY IF EXISTS "Users can insert their marketing properties" ON marketing_properties;
  DROP POLICY IF EXISTS "Users can update their marketing properties" ON marketing_properties;
  DROP POLICY IF EXISTS "Users can delete their marketing properties" ON marketing_properties;
  
  -- Marketing metrics policies
  DROP POLICY IF EXISTS "Users can view their marketing metrics" ON marketing_metrics;
  DROP POLICY IF EXISTS "Users can insert marketing metrics" ON marketing_metrics;
  
  -- Notes table policies
  DROP POLICY IF EXISTS "Users can select their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
  
  -- Users table policies
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  
  RAISE NOTICE 'Dropped existing policies to prevent conflicts';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some policies may not have existed: %', SQLERRM;
END $$;

-- ===========================================
-- CREATE TABLES (SAFE WITH IF NOT EXISTS)
-- ===========================================

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saas_expenses table
CREATE TABLE IF NOT EXISTS saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  application text NOT NULL,
  description text,
  cost_monthly numeric(10,2) NOT NULL DEFAULT 0,
  cost_annual numeric(10,2) NOT NULL DEFAULT 0,
  platform text,
  url text,
  renewal_date date,
  notes text,
  source_sheet text DEFAULT 'manual_entry',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Update users table if needed (ensure it has all required columns)
DO $$
BEGIN
  -- Check if users table exists and add missing columns
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Add auth_user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
      ALTER TABLE users ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add unique constraint if it doesn't exist
    BEGIN
      ALTER TABLE users ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);
    EXCEPTION
      WHEN duplicate_table THEN
        RAISE NOTICE 'Unique constraint on users.auth_user_id already exists';
    END;
  ELSE
    -- Create users table if it doesn't exist
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      full_name text,
      avatar_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Update notes table if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes') THEN
    CREATE TABLE notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      content text NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- ===========================================
-- CREATE INDEXES (DROP FIRST TO AVOID CONFLICTS)
-- ===========================================

-- Assignments indexes
DROP INDEX IF EXISTS idx_assignments_assigned_to;
DROP INDEX IF EXISTS idx_assignments_project_id;
DROP INDEX IF EXISTS idx_assignments_status;
DROP INDEX IF EXISTS idx_assignments_due_date;
DROP INDEX IF EXISTS idx_assignments_created_at;

CREATE INDEX idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX idx_assignments_project_id ON assignments(project_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_created_at ON assignments(created_at DESC);

-- SaaS expenses indexes
DROP INDEX IF EXISTS idx_saas_expenses_department;
DROP INDEX IF EXISTS idx_saas_expenses_renewal_date;
DROP INDEX IF EXISTS idx_saas_expenses_created_at;

CREATE INDEX idx_saas_expenses_department ON saas_expenses(department);
CREATE INDEX idx_saas_expenses_renewal_date ON saas_expenses(renewal_date);
CREATE INDEX idx_saas_expenses_created_at ON saas_expenses(created_at DESC);

-- Users indexes
DROP INDEX IF EXISTS idx_users_auth_user_id;
DROP INDEX IF EXISTS idx_users_email;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===========================================
-- CREATE TRIGGERS (DROP FIRST TO AVOID CONFLICTS)
-- ===========================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON saas_expenses;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_expenses_updated_at 
  BEFORE UPDATE ON saas_expenses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on marketing tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_properties') THEN
    ALTER TABLE marketing_properties ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_metrics') THEN
    ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ===========================================
-- CREATE RLS POLICIES
-- ===========================================

-- ASSIGNMENTS TABLE POLICIES
CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can update their assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (assigned_to = auth.uid());

-- SAAS EXPENSES TABLE POLICIES
CREATE POLICY "Users can view saas expenses"
  ON saas_expenses
  FOR SELECT
  TO authenticated
  USING (true); -- All authenticated users can view for reporting

CREATE POLICY "Users can insert saas expenses"
  ON saas_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update saas expenses"
  ON saas_expenses
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete saas expenses"
  ON saas_expenses
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- NOTES TABLE POLICIES
CREATE POLICY "Users can view their notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- USERS TABLE POLICIES
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ===========================================
-- CREATE MARKETING TABLES IF NEEDED
-- ===========================================

-- Create marketing_properties table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_properties (
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

-- Create marketing_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id) ON DELETE CASCADE,
  date date NOT NULL,
  sessions integer DEFAULT 0,
  users integer DEFAULT 0,
  pageviews integer DEFAULT 0,
  bounce_rate double precision DEFAULT 0,
  conversions integer DEFAULT 0,
  avg_session_duration double precision DEFAULT 0,
  traffic_source text,
  campaign_name text,
  revenue numeric(10,2) DEFAULT 0,
  conversion_type text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, date, traffic_source)
);

-- Marketing table indexes
DROP INDEX IF EXISTS idx_marketing_properties_user_id;
DROP INDEX IF EXISTS idx_marketing_metrics_property_id;
DROP INDEX IF EXISTS idx_marketing_metrics_date;

CREATE INDEX idx_marketing_properties_user_id ON marketing_properties(user_id);
CREATE INDEX idx_marketing_metrics_property_id ON marketing_metrics(property_id);
CREATE INDEX idx_marketing_metrics_date ON marketing_metrics(date);

-- Marketing table policies (if tables were created)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_properties') THEN
    CREATE POLICY "Users can view their marketing properties"
      ON marketing_properties
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "Users can insert their marketing properties"
      ON marketing_properties
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update their marketing properties"
      ON marketing_properties
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can delete their marketing properties"
      ON marketing_properties
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_metrics') THEN
    CREATE POLICY "Users can view their marketing metrics"
      ON marketing_metrics
      FOR SELECT
      TO authenticated
      USING (property_id IN (
        SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      ));

    CREATE POLICY "Users can insert marketing metrics"
      ON marketing_metrics
      FOR INSERT
      TO authenticated
      WITH CHECK (property_id IN (
        SELECT id FROM marketing_properties WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

-- ===========================================
-- VERIFICATION AND LOGGING
-- ===========================================

DO $$
DECLARE
  table_count integer;
  policy_count integer;
  trigger_count integer;
BEGIN
  -- Count created tables
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_name IN ('assignments', 'saas_expenses', 'marketing_properties', 'marketing_metrics', 'notes', 'users')
    AND table_schema = 'public';

  -- Count created policies
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename IN ('assignments', 'saas_expenses', 'marketing_properties', 'marketing_metrics', 'notes', 'users');

  -- Count created triggers
  SELECT COUNT(*) INTO trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_name LIKE '%updated_at%'
    AND event_object_table IN ('assignments', 'saas_expenses', 'notes', 'users');

  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '✅ Tables created/verified: %', table_count;
  RAISE NOTICE '✅ RLS policies created: %', policy_count;
  RAISE NOTICE '✅ Triggers created: %', trigger_count;
  RAISE NOTICE '✅ All database features are now available!';
END $$;