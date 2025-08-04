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
      - `source_sheet` (text, tracks import source)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saas_expenses` table
    - Add policy for authenticated users to manage their own expenses

  3. Performance
    - Add index on created_at for ordering
    - Add index on department for filtering
    - Add index on created_by for user queries
*/

-- Create the saas_expenses table
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
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saas_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can access their own SaaS expenses"
  ON public.saas_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create policy for reading (if you want broader read access)
CREATE POLICY "Authenticated users can read SaaS expenses"
  ON public.saas_expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_at 
  ON public.saas_expenses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saas_expenses_department 
  ON public.saas_expenses(department);

CREATE INDEX IF NOT EXISTS idx_saas_expenses_created_by 
  ON public.saas_expenses(created_by);

CREATE INDEX IF NOT EXISTS idx_saas_expenses_renewal_date 
  ON public.saas_expenses(renewal_date) 
  WHERE renewal_date IS NOT NULL;