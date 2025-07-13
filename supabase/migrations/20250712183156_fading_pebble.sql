/*
  # Fix departments table permissions

  1. Adds proper RLS policies for the departments table
  2. Ensures authenticated users can insert, update, and delete departments
*/

-- First, check if RLS is enabled, and if not, enable it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename = 'departments'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop any existing policies to recreate them
DO $$
BEGIN
  -- Insert policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Authenticated users can insert departments') THEN
    DROP POLICY "Authenticated users can insert departments" ON public.departments;
  END IF;
  
  -- Update policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Authenticated users can update departments') THEN
    DROP POLICY "Authenticated users can update departments" ON public.departments;
  END IF;
  
  -- Delete policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Authenticated users can delete departments') THEN
    DROP POLICY "Authenticated users can delete departments" ON public.departments;
  END IF;
  
  -- Select policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Users can read departments') THEN
    DROP POLICY "Users can read departments" ON public.departments;
  END IF;
END $$;

-- Create comprehensive policies
CREATE POLICY "Authenticated users can insert departments"
  ON public.departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update departments"
  ON public.departments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete departments"
  ON public.departments
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read departments"
  ON public.departments
  FOR SELECT
  TO public
  USING (true);