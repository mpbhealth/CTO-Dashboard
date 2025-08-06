/*
  # Fix All Policy Conflicts and Missing Tables

  1. Create Missing Tables
    - `saas_expenses` table with proper schema
    - `assignments` table if missing

  2. Security Setup
    - Safe policy creation with existence checks
    - Proper RLS configuration
    - User isolation patterns

  3. Performance
    - Required indexes
    - Trigger functions for auto-timestamps
*/

-- Create utility function for safe policy creation
CREATE OR REPLACE FUNCTION create_policy_safe(
  p_policy_name text,
  p_table_name text,
  p_command text,
  p_role text,
  p_using text DEFAULT NULL,
  p_with_check text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
  
  -- Create the new policy
  IF p_using IS NOT NULL AND p_with_check IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I USING (%s) WITH CHECK (%s)',
                   p_policy_name, p_table_name, p_command, p_role, p_using, p_with_check);
  ELSIF p_using IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I USING (%s)',
                   p_policy_name, p_table_name, p_command, p_role, p_using);
  ELSIF p_with_check IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I WITH CHECK (%s)',
                   p_policy_name, p_table_name, p_command, p_role, p_with_check);
  ELSE
    EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %I',
                   p_policy_name, p_table_name, p_command, p_role);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create saas_expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS saas_expenses (
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

-- Create assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create or replace trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers safely
DO $$
BEGIN
  -- Drop existing triggers first
  DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON saas_expenses;
  DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
  DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
  DROP TRIGGER IF EXISTS set_updated_at ON notes;

  -- Create new triggers
  CREATE TRIGGER update_saas_expenses_updated_at
    BEFORE UPDATE ON saas_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
END $$;

-- Create all policies using the safe function

-- SaaS Expenses Policies (admin-style access)
SELECT create_policy_safe(
  'Users can view saas expenses',
  'saas_expenses', 
  'SELECT',
  'authenticated',
  'true'
);

SELECT create_policy_safe(
  'Users can manage saas expenses',
  'saas_expenses',
  'ALL', 
  'authenticated',
  'true',
  'true'
);

-- Assignments Policies (user isolation)
SELECT create_policy_safe(
  'Users can view their assignments',
  'assignments',
  'SELECT',
  'authenticated', 
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'Users can create assignments',
  'assignments',
  'INSERT',
  'authenticated',
  NULL,
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'Users can update their assignments',
  'assignments',
  'UPDATE',
  'authenticated',
  'auth.uid() = assigned_to',
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'Users can delete their assignments', 
  'assignments',
  'DELETE',
  'authenticated',
  'auth.uid() = assigned_to'
);

-- Notes Policies (user isolation)
SELECT create_policy_safe(
  'Users can view their own notes',
  'notes',
  'SELECT',
  'authenticated',
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'Users can create their own notes',
  'notes', 
  'INSERT',
  'authenticated',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'Users can update their own notes',
  'notes',
  'UPDATE', 
  'authenticated',
  'auth.uid() = user_id',
  'auth.uid() = user_id'
);

SELECT create_policy_safe(
  'Users can delete their own notes',
  'notes',
  'DELETE',
  'authenticated', 
  'auth.uid() = user_id'
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_saas_expenses_department ON saas_expenses(department);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by ON saas_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date ON saas_expenses(renewal_date);

CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);