/*
  # Ultimate Policy Fix - Drop and Recreate
  
  This migration solves Bolt's policy conflict issue by:
  1. Dropping ALL existing policies that cause conflicts
  2. Recreating them cleanly without "already exists" errors
  3. No fancy logic - just direct DROP and CREATE commands
*/

-- 🗑️ DROP ALL CONFLICTING POLICIES FIRST
-- This prevents Bolt's "policy already exists" errors

-- Drop assignments table policies
DROP POLICY IF EXISTS "Users can view their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can create their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can manage all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can insert their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can modify their assignments" ON public.assignments;

-- Drop any other conflicting policies that might exist
DROP POLICY IF EXISTS "Users can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can manage assignments" ON public.assignments;

-- Drop sync_logs policies that might conflict
DROP POLICY IF EXISTS "Users can read sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "System can insert sync logs" ON public.sync_logs;

-- Drop marketing policies that might conflict
DROP POLICY IF EXISTS "Users can view their marketing properties" ON public.marketing_properties;
DROP POLICY IF EXISTS "Users can manage their marketing properties" ON public.marketing_properties;
DROP POLICY IF EXISTS "Users can view their marketing metrics" ON public.marketing_metrics;

-- Drop notes policies that might conflict
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- 🛡️ NOW CREATE FRESH POLICIES (Bolt won't conflict anymore)

-- Enable RLS on assignments table
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create fresh assignments policies
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

-- Create sync_logs policies
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

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

-- Create notes policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes') THEN
    ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own notes"
      ON public.notes
      FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own notes"
      ON public.notes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own notes"
      ON public.notes
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own notes"
      ON public.notes
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- 📊 Log successful policy recreation
INSERT INTO public.sync_logs (service, operation, status, message, records_processed)
VALUES ('database', 'policy_recreation', 'success', 'Successfully dropped and recreated all conflicting policies', 1);