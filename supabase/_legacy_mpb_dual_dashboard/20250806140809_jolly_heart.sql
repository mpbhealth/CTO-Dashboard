/*
  # Create SaaS Expenses Table with Safe Policies

  1. New Tables
    - `saas_expenses`
      - `id` (uuid, primary key)
      - `vendor_name` (text, required)
      - `service_name` (text, required)
      - `description` (text, optional)
      - `amount` (numeric, required)
      - `currency` (text, default 'USD')
      - `billing_cycle` (text, check constraint)
      - `payment_date` (date, required)
      - `next_payment_date` (date, optional)
      - `category` (text, optional)
      - `department_id` (uuid, foreign key to departments)
      - `status` (text, check constraint)
      - `owner_id` (uuid, foreign key to auth.users)
      - `receipt_url` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saas_expenses` table
    - Add safe policies for authenticated users to manage expenses
    - Add policies for viewing expenses across organization

  3. Indexes
    - Performance indexes for common queries
*/

-- Create the saas_expenses table
CREATE TABLE IF NOT EXISTS saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  service_name text NOT NULL,
  description text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual', 'one-time')),
  payment_date date NOT NULL,
  next_payment_date date,
  category text,
  department_id uuid REFERENCES departments(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'pending')),
  owner_id uuid REFERENCES auth.users(id),
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;

-- Conditionally create SELECT policy for viewing expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view saas expenses' AND tablename = 'saas_expenses'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view saas expenses"
             ON public.saas_expenses
             FOR SELECT
             TO authenticated
             USING (true)';
  END IF;
END$$;

-- Conditionally create INSERT policy for creating expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can create saas expenses' AND tablename = 'saas_expenses'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create saas expenses"
             ON public.saas_expenses
             FOR INSERT
             TO authenticated
             WITH CHECK ((auth.uid() = owner_id) OR (EXISTS (
               SELECT 1 FROM user_roles 
               WHERE user_id = auth.uid() AND role = ''admin''
             )))';
  END IF;
END$$;

-- Conditionally create UPDATE policy for modifying expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update saas expenses' AND tablename = 'saas_expenses'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update saas expenses"
             ON public.saas_expenses
             FOR UPDATE
             TO authenticated
             USING ((auth.uid() = owner_id) OR (EXISTS (
               SELECT 1 FROM user_roles 
               WHERE user_id = auth.uid() AND role = ''admin''
             )))
             WITH CHECK ((auth.uid() = owner_id) OR (EXISTS (
               SELECT 1 FROM user_roles 
               WHERE user_id = auth.uid() AND role = ''admin''
             )))';
  END IF;
END$$;

-- Conditionally create DELETE policy for removing expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete saas expenses' AND tablename = 'saas_expenses'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete saas expenses"
             ON public.saas_expenses
             FOR DELETE
             TO authenticated
             USING ((auth.uid() = owner_id) OR (EXISTS (
               SELECT 1 FROM user_roles 
               WHERE user_id = auth.uid() AND role = ''admin''
             )))';
  END IF;
END$$;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Conditionally create trigger for updating updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_saas_expenses_updated_at'
    AND tgrelid = 'saas_expenses'::regclass
  ) THEN
    CREATE TRIGGER update_saas_expenses_updated_at
      BEFORE UPDATE ON saas_expenses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saas_expenses_vendor_name ON saas_expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_department_id ON saas_expenses(department_id);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_owner_id ON saas_expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_payment_date ON saas_expenses(payment_date);
CREATE INDEX IF NOT EXISTS idx_saas_expenses_status ON saas_expenses(status);