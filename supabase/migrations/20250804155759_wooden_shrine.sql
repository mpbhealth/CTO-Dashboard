/*
  # Add SaaS Expenses Management

  1. New Tables
    - `saas_expenses` table with all required columns for SaaS spend tracking
    
  2. Security
    - Enable RLS on saas_expenses table
    - Add policies for authenticated users to manage their expenses
    
  3. Performance
    - Add indexes for common query patterns
*/

-- Create saas_expenses table only if it doesn't exist
CREATE TABLE IF NOT EXISTS saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  application text NOT NULL,
  description text,
  cost_monthly numeric NOT NULL DEFAULT 0 CHECK (cost_monthly >= 0),
  cost_annual numeric NOT NULL DEFAULT 0 CHECK (cost_annual >= 0),
  platform text,
  url text,
  renewal_date date,
  notes text,
  source_sheet text DEFAULT 'manual_entry',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage SaaS expenses"
  ON saas_expenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saas_expenses_department ON saas_expenses(department);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date ON saas_expenses(renewal_date);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by ON saas_expenses(created_by);

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_saas_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Safely add the trigger for updated_at
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON saas_expenses;
  
  -- Create the trigger
  CREATE TRIGGER update_saas_expenses_updated_at
    BEFORE UPDATE ON saas_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_saas_expenses_updated_at();
END $$;