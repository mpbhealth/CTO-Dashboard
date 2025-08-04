/*
# Complete Database Setup - MPB Health CTO Dashboard

1. New Tables
  - `saas_expenses` - SaaS spend tracking and management
  - Proper triggers and RLS policies for all tables

2. Security
  - Enable RLS on all tables
  - Create comprehensive policies for data access
  - Fix existing policy issues

3. Performance
  - Add proper indexes for fast queries
  - Optimize foreign key relationships

4. Triggers
  - Safe trigger creation with existence checks
  - Auto-update timestamps where needed
*/

-- Create trigger functions if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create SaaS Expenses table
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

-- Add indexes for performance
DO $$
BEGIN
  -- SaaS expenses indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_expenses_department') THEN
    CREATE INDEX idx_saas_expenses_department ON saas_expenses(department);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_expenses_renewal_date') THEN
    CREATE INDEX idx_saas_expenses_renewal_date ON saas_expenses(renewal_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_expenses_created_by') THEN
    CREATE INDEX idx_saas_expenses_created_by ON saas_expenses(created_by);
  END IF;

  -- Assignments indexes (if they don't exist)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_assigned_to') THEN
    CREATE INDEX idx_assignments_assigned_to ON assignments(assigned_to);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_project_id') THEN
    CREATE INDEX idx_assignments_project_id ON assignments(project_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_status') THEN
    CREATE INDEX idx_assignments_status ON assignments(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_due_date') THEN
    CREATE INDEX idx_assignments_due_date ON assignments(due_date);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;

-- Safely drop and recreate RLS policies for SaaS expenses
DROP POLICY IF EXISTS "Users can manage their saas expenses" ON saas_expenses;
DROP POLICY IF EXISTS "Users can read their saas expenses" ON saas_expenses;

CREATE POLICY "Users can manage their saas expenses"
  ON saas_expenses
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can read their saas expenses"
  ON saas_expenses
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Fix assignments RLS policies if they need updating
DROP POLICY IF EXISTS "Users can manage their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can read their assignments" ON assignments;

CREATE POLICY "Users can manage their assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can read their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Safely create or recreate triggers
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON saas_expenses;
  DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
  DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
  
  -- Create triggers fresh
  CREATE TRIGGER update_saas_expenses_updated_at
    BEFORE UPDATE ON saas_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
  -- Only create notes trigger if notes table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
  
  -- Only create assignments trigger if assignments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') THEN
    CREATE TRIGGER update_assignments_updated_at
      BEFORE UPDATE ON assignments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add constraints for data validation
DO $$
BEGIN
  -- SaaS expenses constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_expenses_cost_positive' 
    AND table_name = 'saas_expenses'
  ) THEN
    ALTER TABLE saas_expenses 
    ADD CONSTRAINT saas_expenses_cost_positive 
    CHECK (cost_monthly >= 0 AND cost_annual >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_expenses_url_format' 
    AND table_name = 'saas_expenses'
  ) THEN
    ALTER TABLE saas_expenses 
    ADD CONSTRAINT saas_expenses_url_format 
    CHECK (url IS NULL OR url ~* '^https?://');
  END IF;
END $$;