/*
  # Create Missing Tables and Fix Policy Conflicts

  This migration creates all missing tables and consolidates RLS policy creation
  to prevent conflicts between multiple migration files.

  ## Tables Created:
  - `saas_expenses` - SaaS spend tracking
  - Enhanced `users` table with missing columns
  
  ## Security:
  - Drops all existing conflicting policies
  - Creates fresh RLS policies using create_policy_safe function
  - User isolation for personal data (expenses, assignments)
*/

-- =======================
-- HELPER FUNCTION for Safe Policy Creation
-- =======================

CREATE OR REPLACE FUNCTION create_policy_safe(
  table_name text,
  policy_name text,
  policy_action text,
  policy_using text DEFAULT NULL,
  policy_check text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
  
  -- Create new policy
  IF policy_check IS NOT NULL THEN
    -- For INSERT policies with WITH CHECK
    EXECUTE format('CREATE POLICY %I ON %I FOR %s WITH CHECK (%s)', 
                   policy_name, table_name, policy_action, policy_check);
  ELSIF policy_using IS NOT NULL THEN
    -- For SELECT/UPDATE/DELETE policies with USING
    EXECUTE format('CREATE POLICY %I ON %I FOR %s USING (%s)', 
                   policy_name, table_name, policy_action, policy_using);
  ELSE
    -- For simple policies
    EXECUTE format('CREATE POLICY %I ON %I FOR %s', 
                   policy_name, table_name, policy_action);
  END IF;
  
  RAISE NOTICE 'Policy % created successfully for table %', policy_name, table_name;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create policy % for table %: %', policy_name, table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- CREATE MISSING TABLES
-- =======================

-- Create SaaS Expenses Table
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

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'full_name' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name text;
  END IF;
  
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;
END $$;

-- =======================
-- CREATE INDEXES
-- =======================

-- SaaS Expenses indexes
CREATE INDEX IF NOT EXISTS idx_saas_expenses_department ON public.saas_expenses(department);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by ON public.saas_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date ON public.saas_expenses(renewal_date);

-- =======================
-- CREATE TRIGGERS
-- =======================

-- Updated timestamp trigger for saas_expenses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON public.saas_expenses;
CREATE TRIGGER update_saas_expenses_updated_at
  BEFORE UPDATE ON public.saas_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ENABLE RLS ON ALL TABLES
-- =======================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- =======================
-- ASSIGNMENTS POLICIES (Consolidated)
-- =======================

-- Users can view their own assignments
SELECT create_policy_safe(
  'assignments',
  'Users can view their assignments', 
  'SELECT',
  'auth.uid() = assigned_to'
);

-- Users can create assignments for themselves
SELECT create_policy_safe(
  'assignments',
  'Users can create assignments',
  'INSERT', 
  NULL,
  'auth.uid() = assigned_to'
);

-- Users can update their own assignments
SELECT create_policy_safe(
  'assignments',
  'Users can update their assignments',
  'UPDATE',
  'auth.uid() = assigned_to'
);

-- Users can delete their own assignments  
SELECT create_policy_safe(
  'assignments',
  'Users can delete their assignments',
  'DELETE',
  'auth.uid() = assigned_to'
);

-- =======================
-- SAAS EXPENSES POLICIES
-- =======================

SELECT create_policy_safe(
  'saas_expenses',
  'Users can view their expenses',
  'SELECT',
  'auth.uid() = created_by'
);

SELECT create_policy_safe(
  'saas_expenses', 
  'Users can create expenses',
  'INSERT',
  NULL,
  'auth.uid() = created_by'
);

SELECT create_policy_safe(
  'saas_expenses',
  'Users can update their expenses', 
  'UPDATE',
  'auth.uid() = created_by'
);

SELECT create_policy_safe(
  'saas_expenses',
  'Users can delete their expenses',
  'DELETE', 
  'auth.uid() = created_by'
);

-- =======================
-- USERS TABLE POLICIES
-- =======================

SELECT create_policy_safe(
  'users',
  'Users can view their own profile',
  'SELECT',
  'auth.uid() = auth_user_id'
);

SELECT create_policy_safe(
  'users',
  'Users can insert their own profile',
  'INSERT',
  NULL,
  'auth.uid() = auth_user_id'
);

SELECT create_policy_safe(
  'users',
  'Users can update their own profile',
  'UPDATE',
  'auth.uid() = auth_user_id'
);

-- =======================
-- NOTES TABLE POLICIES
-- =======================

SELECT create_policy_safe(
  'notes',
  'Users can view their own notes',
  'SELECT', 
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'notes',
  'Users can create their own notes',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'notes',
  'Users can update their own notes',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'notes',
  'Users can delete their own notes', 
  'DELETE',
  'auth.uid() = user_id'
);

-- =======================
-- CLEANUP
-- =======================

-- Drop the helper function after use to keep database clean
DROP FUNCTION IF EXISTS create_policy_safe(text, text, text, text, text);

-- Log successful migration
INSERT INTO public.sync_logs (service, operation, status, message, records_processed)
VALUES (
  'database_migration',
  'create_missing_tables', 
  'success',
  'Successfully created saas_expenses table and fixed all policy conflicts',
  1
);