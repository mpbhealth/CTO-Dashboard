/*
  # Fix RLS Policy Conflicts
  
  1. Safely recreate RLS policies for assignments table
  2. Handle existing policy conflicts using DROP IF EXISTS
  3. Ensure proper access control for authenticated users
*/

DO $$ 
BEGIN
    -- Ensure assignments table exists before creating policies
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'assignments' AND table_schema = 'public'
    ) THEN
        
        -- Enable RLS on assignments table
        ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies safely to avoid conflicts
        DROP POLICY IF EXISTS "Users can view their assignments" ON public.assignments;
        DROP POLICY IF EXISTS "Users can create assignments" ON public.assignments;
        DROP POLICY IF EXISTS "Users can update their assignments" ON public.assignments;
        DROP POLICY IF EXISTS "Users can delete their assignments" ON public.assignments;
        
        -- Create SELECT policy - users can view their own assignments
        CREATE POLICY "Users can view their assignments"
        ON public.assignments
        FOR SELECT
        TO authenticated
        USING (assigned_to = auth.uid());
        
        -- Create INSERT policy - users can create assignments for themselves
        CREATE POLICY "Users can create assignments"
        ON public.assignments
        FOR INSERT
        TO authenticated
        WITH CHECK (assigned_to = auth.uid());
        
        -- Create UPDATE policy - users can update their own assignments
        CREATE POLICY "Users can update their assignments"
        ON public.assignments
        FOR UPDATE
        TO authenticated
        USING (assigned_to = auth.uid())
        WITH CHECK (assigned_to = auth.uid());
        
        -- Create DELETE policy - users can delete their own assignments
        CREATE POLICY "Users can delete their assignments"
        ON public.assignments
        FOR DELETE
        TO authenticated
        USING (assigned_to = auth.uid());
        
        RAISE NOTICE 'Assignment RLS policies created successfully';
        
    ELSE
        RAISE NOTICE 'Assignments table does not exist - skipping policy creation';
    END IF;
    
    -- Also fix other tables with similar issues
    
    -- Fix users table policies
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN
        
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies safely
        DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        
        -- Recreate user policies
        CREATE POLICY "Users can read own profile"
        ON public.users
        FOR SELECT
        TO authenticated
        USING (auth_user_id = auth.uid());
        
        CREATE POLICY "Users can insert own profile"
        ON public.users
        FOR INSERT
        TO authenticated
        WITH CHECK (auth_user_id = auth.uid());
        
        CREATE POLICY "Users can update own profile"
        ON public.users
        FOR UPDATE
        TO authenticated
        USING (auth_user_id = auth.uid())
        WITH CHECK (auth_user_id = auth.uid());
        
        RAISE NOTICE 'User RLS policies created successfully';
    END IF;
    
    -- Fix notes table policies
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notes' AND table_schema = 'public'
    ) THEN
        
        ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies safely
        DROP POLICY IF EXISTS "Users can select their own notes" ON public.notes;
        DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
        DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
        DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
        
        -- Recreate notes policies
        CREATE POLICY "Users can select their own notes"
        ON public.notes
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
        
        CREATE POLICY "Users can insert their own notes"
        ON public.notes
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
        
        CREATE POLICY "Users can update their own notes"
        ON public.notes
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
        
        CREATE POLICY "Users can delete their own notes"
        ON public.notes
        FOR DELETE
        TO authenticated
        USING (user_id = auth.uid());
        
        RAISE NOTICE 'Notes RLS policies created successfully';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating RLS policies: %', SQLERRM;
END $$;

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('assignments', 'users', 'notes')
ORDER BY tablename, policyname;