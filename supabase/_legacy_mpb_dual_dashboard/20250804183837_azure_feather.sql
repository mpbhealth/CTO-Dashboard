/*
  # Fix RLS Policy Conflicts - Assignments Table
  
  1. Security Changes
    - Drop any existing policies to avoid conflicts
    - Recreate policies with proper user isolation
    - Enable RLS on assignments table
*/

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can create their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can insert their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can modify their assignments" ON public.assignments;

-- Enable RLS if not already enabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "Users can view their assignments"
  ON public.assignments
  FOR SELECT
  USING (auth.uid() = assigned_to);

CREATE POLICY "Users can create their assignments"
  ON public.assignments
  FOR INSERT
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Users can update their assignments"
  ON public.assignments
  FOR UPDATE
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Users can delete their assignments"
  ON public.assignments
  FOR DELETE
  USING (auth.uid() = assigned_to);

-- Fix any other tables with similar issues
DROP POLICY IF EXISTS "Users can read sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "System can insert sync logs" ON public.sync_logs;

CREATE POLICY "Users can read sync logs"
  ON public.sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert sync logs"
  ON public.sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);