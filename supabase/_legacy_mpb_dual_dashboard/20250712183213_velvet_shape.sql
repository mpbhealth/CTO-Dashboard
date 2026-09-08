/*
  # Fix org_chart_positions permissions

  1. Updates RLS policies for org_chart_positions table
  2. Ensures authenticated users can insert, update, and delete position data
*/

-- First, check if RLS is enabled, and if not, enable it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename = 'org_chart_positions'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.org_chart_positions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop any existing policies to recreate them
DO $$
BEGIN
  -- Insert policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_chart_positions' AND policyname = 'Authenticated users can insert org chart positions') THEN
    DROP POLICY "Authenticated users can insert org chart positions" ON public.org_chart_positions;
  END IF;
  
  -- Update policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_chart_positions' AND policyname = 'Authenticated users can update org chart positions') THEN
    DROP POLICY "Authenticated users can update org chart positions" ON public.org_chart_positions;
  END IF;
  
  -- Delete policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_chart_positions' AND policyname = 'Authenticated users can delete org chart positions') THEN
    DROP POLICY "Authenticated users can delete org chart positions" ON public.org_chart_positions;
  END IF;
  
  -- Select policy
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_chart_positions' AND policyname = 'Users can read org chart positions') THEN
    DROP POLICY "Users can read org chart positions" ON public.org_chart_positions;
  END IF;
END $$;

-- Create comprehensive policies
CREATE POLICY "Authenticated users can insert org chart positions"
  ON public.org_chart_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update org chart positions"
  ON public.org_chart_positions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete org chart positions"
  ON public.org_chart_positions
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read org chart positions"
  ON public.org_chart_positions
  FOR SELECT
  TO public
  USING (true);