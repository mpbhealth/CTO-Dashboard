@@ .. @@

-- Enable Row-Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--- Conditionally create SELECT policy
-DO $$
-BEGIN
-  IF NOT EXISTS (
-    SELECT 1 FROM pg_policies 
-    WHERE policyname = 'Users can view their assignments' AND tablename = 'assignments'
-  ) THEN
-    CREATE POLICY "Users can view their assignments"
-    ON public.assignments
-    FOR SELECT
-    USING (auth.uid() = assigned_to);
-  END IF;
-END$$;
-
--- Optionally allow INSERT
-DO $$
-BEGIN
-  IF NOT EXISTS (
-    SELECT 1 FROM pg_policies 
-    WHERE policyname = 'Users can create their assignments' AND tablename = 'assignments'
-  ) THEN
-    CREATE POLICY "Users can create their assignments"
-    ON public.assignments
-    FOR INSERT
-    WITH CHECK (auth.uid() = assigned_to);
-  END IF;
-END$$;
-
--- Optionally allow UPDATE
-DO $$
-BEGIN
-  IF NOT EXISTS (
-    SELECT 1 FROM pg_policies 
-    WHERE policyname = 'Users can update their assignments' AND tablename = 'assignments'
-  ) THEN
-    CREATE POLICY "Users can update their assignments"
-    ON public.assignments
-    FOR UPDATE
-    USING (auth.uid() = assigned_to);
-  END IF;
-END$$;

+-- ⚠️ POLICIES MOVED TO MIGRATION FILE
+-- This file now only enables RLS, policies are handled by migration 20250804182309_aged_waterfall.sql
+-- This prevents duplicate policy conflicts during Bolt builds