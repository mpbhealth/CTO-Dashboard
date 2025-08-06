/*
  # Fix All SQL Syntax Errors - Clean Migration
  
  1. Complete Table Creation
    - assignments table with proper foreign keys
    - saas_expenses table for financial tracking
    - Clean RLS policies without syntax errors
    
  2. Security
    - Enable RLS on all tables
    - Create safe policies with proper conditional logic
    - No policy conflicts or duplicate creation
    
  3. Performance
    - Strategic indexes for query optimization
    - Auto-updating timestamps via triggers
*/

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

-- Enable RLS on tables
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;

-- Create universal policy creation function
CREATE OR REPLACE FUNCTION create_policy_safe(
  table_name text,
  policy_name text,
  policy_command text,
  policy_definition text
) RETURNS void AS $$
BEGIN
  -- Drop the policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
  
  -- Create the new policy
  EXECUTE format('CREATE POLICY %I ON %I %s %s', 
    policy_name, table_name, policy_command, policy_definition);
END;
$$ LANGUAGE plpgsql;

-- Create assignments policies safely
SELECT create_policy_safe(
  'assignments',
  'Users can view their assignments', 
  'FOR SELECT',
  'USING (auth.uid() = assigned_to)'
);

SELECT create_policy_safe(
  'assignments',
  'Users can create assignments',
  'FOR INSERT', 
  'WITH CHECK (auth.uid() = assigned_to)'
);

SELECT create_policy_safe(
  'assignments',
  'Users can update their assignments',
  'FOR UPDATE',
  'USING (auth.uid() = assigned_to) WITH CHECK (auth.uid() = assigned_to)'
);

SELECT create_policy_safe(
  'assignments',
  'Users can delete their assignments',
  'FOR DELETE',
  'USING (auth.uid() = assigned_to)'
);

-- Create saas_expenses policies safely
SELECT create_policy_safe(
  'saas_expenses',
  'Users can view saas expenses',
  'FOR SELECT',
  'TO authenticated USING (true)'
);

SELECT create_policy_safe(
  'saas_expenses', 
  'Users can create saas expenses',
  'FOR INSERT',
  'TO authenticated WITH CHECK (auth.uid() = created_by)'
);

SELECT create_policy_safe(
  'saas_expenses',
  'Users can update saas expenses', 
  'FOR UPDATE',
  'TO authenticated USING (auth.uid() = created_by OR auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE ''%@mpbhealth.com''))'
);

SELECT create_policy_safe(
  'saas_expenses',
  'Users can delete saas expenses',
  'FOR DELETE', 
  'TO authenticated USING (auth.uid() = created_by OR auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE ''%@mpbhealth.com''))'
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers safely
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON saas_expenses;
CREATE TRIGGER update_saas_expenses_updated_at
  BEFORE UPDATE ON saas_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saas_expenses_department ON saas_expenses(department);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_application ON saas_expenses(application);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date ON saas_expenses(renewal_date);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by ON saas_expenses(created_by);