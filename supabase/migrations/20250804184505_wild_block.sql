/*
  # Create SaaS Expenses Table

  1. New Tables
    - `saas_expenses`
      - `id` (uuid, primary key)
      - `department` (text, required)
      - `application` (text, required) 
      - `description` (text, optional)
      - `cost_monthly` (numeric, required)
      - `cost_annual` (numeric, required)
      - `platform` (text, optional)
      - `url` (text, optional)
      - `renewal_date` (date, optional)
      - `notes` (text, optional)
      - `source_sheet` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `saas_expenses` table
    - Add policies for authenticated users to manage their own expenses
    - Users can view, insert, update, and delete their own SaaS expenses

  3. Performance
    - Add indexes for common queries
    - Auto-updating timestamp trigger
*/

-- Create the saas_expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saas_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  application TEXT NOT NULL,
  description TEXT,
  cost_monthly NUMERIC NOT NULL DEFAULT 0,
  cost_annual NUMERIC NOT NULL DEFAULT 0,
  platform TEXT,
  url TEXT,
  renewal_date DATE,
  notes TEXT,
  source_sheet TEXT NOT NULL DEFAULT 'manual_entry',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_saas_expenses_updated_at ON public.saas_expenses;
CREATE TRIGGER update_saas_expenses_updated_at
    BEFORE UPDATE ON public.saas_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saas_expenses_department ON public.saas_expenses(department);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by ON public.saas_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date ON public.saas_expenses(renewal_date);

-- Enable Row Level Security
ALTER TABLE public.saas_expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view their own SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to insert SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update their own SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Users can view their SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Users can insert SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Users can update SaaS expenses" ON public.saas_expenses;
DROP POLICY IF EXISTS "Users can delete SaaS expenses" ON public.saas_expenses;

-- Create fresh RLS policies
CREATE POLICY "Users can view their SaaS expenses"
ON public.saas_expenses
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert SaaS expenses"
ON public.saas_expenses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their SaaS expenses"
ON public.saas_expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their SaaS expenses"
ON public.saas_expenses
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);