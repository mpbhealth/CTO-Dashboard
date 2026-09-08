-- Enable Row-Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Conditionally create SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view their assignments' AND tablename = 'assignments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their assignments"
             ON public.assignments
             FOR SELECT
             USING (auth.uid() = assigned_to)';
  END IF;
END$$;

-- Conditionally create INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can create assignments' AND tablename = 'assignments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create assignments"
             ON public.assignments
             FOR INSERT
             WITH CHECK (auth.uid() = assigned_to)';
  END IF;
END$$;

-- Conditionally create UPDATE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can update assignments' AND tablename = 'assignments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update assignments"
             ON public.assignments
             FOR UPDATE
             USING (auth.uid() = assigned_to)';
  END IF;
END$$;

-- Conditionally create DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete assignments' AND tablename = 'assignments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete assignments"
             ON public.assignments
             FOR DELETE
             USING (auth.uid() = assigned_to)';
  END IF;
END$$;