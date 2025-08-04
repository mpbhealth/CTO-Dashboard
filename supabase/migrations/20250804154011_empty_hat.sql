/*
# SaaS Expenses Management System

1. New Tables
  - `saas_expenses` - Complete SaaS expense tracking with department breakdown
    - `id` (uuid, primary key)
    - `department` (text)
    - `application` (text) 
    - `description` (text)
    - `cost_monthly` (numeric)
    - `cost_annual` (numeric)
    - `platform` (text)
    - `url` (text)
    - `renewal_date` (date)
    - `notes` (text)
    - `source_sheet` (text)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
    - `created_by` (uuid, foreign key to auth.users)

2. Security
  - Enable RLS on `saas_expenses` table
  - Add policies for authenticated users to manage their SaaS expenses
  - Add indexes for performance optimization

3. Safety Checks
  - All objects use IF NOT EXISTS patterns
  - Proper foreign key relationships
  - Comprehensive validation constraints
*/

-- Create SaaS expenses table safely
CREATE TABLE IF NOT EXISTS saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  application text NOT NULL,
  description text,
  cost_monthly numeric(10,2) DEFAULT 0,
  cost_annual numeric(10,2) DEFAULT 0,
  platform text,
  url text,
  renewal_date date,
  notes text,
  source_sheet text DEFAULT 'manual_entry',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'saas_expenses' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_saas_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_saas_expenses_updated_at' 
    AND tgrelid = 'public.saas_expenses'::regclass
  ) THEN
    CREATE TRIGGER update_saas_expenses_updated_at
      BEFORE UPDATE ON public.saas_expenses
      FOR EACH ROW EXECUTE FUNCTION update_saas_expenses_updated_at();
  END IF;
END $$;

-- Create indexes safely for performance
DO $$
BEGIN
  -- Index for department filtering
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_saas_expenses_department'
  ) THEN
    CREATE INDEX idx_saas_expenses_department ON saas_expenses(department);
  END IF;

  -- Index for renewal date filtering
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_saas_expenses_renewal_date'
  ) THEN
    CREATE INDEX idx_saas_expenses_renewal_date ON saas_expenses(renewal_date);
  END IF;

  -- Index for application search
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_saas_expenses_application'
  ) THEN
    CREATE INDEX idx_saas_expenses_application ON saas_expenses(application);
  END IF;

  -- Index for created_by for RLS performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_saas_expenses_created_by'
  ) THEN
    CREATE INDEX idx_saas_expenses_created_by ON saas_expenses(created_by);
  END IF;
END $$;

-- Create RLS policies safely
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can manage SaaS expenses" ON saas_expenses;
  DROP POLICY IF EXISTS "Users can read SaaS expenses" ON saas_expenses;
  DROP POLICY IF EXISTS "Admins can manage all SaaS expenses" ON saas_expenses;

  -- Create comprehensive RLS policies
  CREATE POLICY "Users can read SaaS expenses"
    ON saas_expenses
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can insert SaaS expenses"
    ON saas_expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

  CREATE POLICY "Users can update their SaaS expenses"
    ON saas_expenses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

  CREATE POLICY "Users can delete their SaaS expenses"
    ON saas_expenses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
END $$;

-- Add constraints safely
DO $$
BEGIN
  -- Ensure costs are non-negative
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_expenses_cost_monthly_check'
  ) THEN
    ALTER TABLE saas_expenses 
    ADD CONSTRAINT saas_expenses_cost_monthly_check 
    CHECK (cost_monthly >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_expenses_cost_annual_check'
  ) THEN
    ALTER TABLE saas_expenses 
    ADD CONSTRAINT saas_expenses_cost_annual_check 
    CHECK (cost_annual >= 0);
  END IF;

  -- Ensure URL format is valid (basic check)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_expenses_url_format_check'
  ) THEN
    ALTER TABLE saas_expenses 
    ADD CONSTRAINT saas_expenses_url_format_check 
    CHECK (url IS NULL OR url ~ '^https?://');
  END IF;
END $$;