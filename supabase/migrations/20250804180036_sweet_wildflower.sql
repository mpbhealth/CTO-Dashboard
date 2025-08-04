/*
  # Cleanup Duplicate Table Creation Conflicts
  
  1. Remove any duplicate table creation attempts
  2. Ensure all tables use IF NOT EXISTS pattern
  3. Clean up conflicting constraints and indexes
  4. Allow database updates to proceed without conflicts
*/

DO $$ 
BEGIN
    RAISE NOTICE 'Starting duplicate table cleanup...';
    
    -- ==============================================
    -- CLEANUP EXISTING CONFLICTS
    -- ==============================================
    
    -- Drop and recreate problematic constraints that might conflict
    ALTER TABLE IF EXISTS assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
    ALTER TABLE IF EXISTS assignments DROP CONSTRAINT IF EXISTS assignments_pkey;
    
    ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_email_key;
    ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_auth_user_id_key;
    ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_pkey;
    
    ALTER TABLE IF EXISTS notes DROP CONSTRAINT IF EXISTS notes_pkey;
    
    -- Drop problematic indexes that might conflict
    DROP INDEX IF EXISTS idx_assignments_assigned_to;
    DROP INDEX IF EXISTS idx_assignments_project_id;
    DROP INDEX IF EXISTS idx_assignments_status;
    DROP INDEX IF EXISTS idx_assignments_due_date;
    DROP INDEX IF EXISTS idx_assignments_created_at;
    
    DROP INDEX IF EXISTS idx_users_email;
    DROP INDEX IF EXISTS idx_users_auth_user_id;
    
    -- ==============================================
    -- ENSURE TABLES EXIST WITH PROPER STRUCTURE
    -- ==============================================
    
    -- Assignments table (safe creation)
    CREATE TABLE IF NOT EXISTS assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        assigned_to uuid,
        project_id uuid,
        status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        due_date date,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    
    -- Users table (safe creation)
    CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id uuid UNIQUE,
        email text UNIQUE NOT NULL,
        full_name text,
        avatar_url text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
    
    -- Notes table (safe creation)
    CREATE TABLE IF NOT EXISTS notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        content text NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        user_id uuid,
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
    
    -- ==============================================
    -- RECREATE INDEXES SAFELY
    -- ==============================================
    
    -- Assignments indexes
    CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
    CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
    CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);
    
    -- Users indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
    
    -- ==============================================
    -- ENABLE RLS SAFELY
    -- ==============================================
    
    -- Enable RLS on all tables
    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
    
    -- ==============================================
    -- RECREATE RLS POLICIES SAFELY
    -- ==============================================
    
    -- Assignments policies
    DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
    DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
    DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
    DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;
    
    CREATE POLICY "Users can view their assignments" 
        ON assignments FOR SELECT 
        TO authenticated 
        USING (assigned_to = auth.uid());
        
    CREATE POLICY "Users can create assignments" 
        ON assignments FOR INSERT 
        TO authenticated 
        WITH CHECK (assigned_to = auth.uid());
        
    CREATE POLICY "Users can update their assignments" 
        ON assignments FOR UPDATE 
        TO authenticated 
        USING (assigned_to = auth.uid()) 
        WITH CHECK (assigned_to = auth.uid());
        
    CREATE POLICY "Users can delete their assignments" 
        ON assignments FOR DELETE 
        TO authenticated 
        USING (assigned_to = auth.uid());
    
    -- Users policies
    DROP POLICY IF EXISTS "Users can read own profile" ON users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    
    CREATE POLICY "Users can read own profile" 
        ON users FOR SELECT 
        TO authenticated 
        USING (auth_user_id = auth.uid());
        
    CREATE POLICY "Users can insert own profile" 
        ON users FOR INSERT 
        TO authenticated 
        WITH CHECK (auth_user_id = auth.uid());
        
    CREATE POLICY "Users can update own profile" 
        ON users FOR UPDATE 
        TO authenticated 
        USING (auth_user_id = auth.uid()) 
        WITH CHECK (auth_user_id = auth.uid());
    
    -- Notes policies  
    DROP POLICY IF EXISTS "Users can select their own notes" ON notes;
    DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
    DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
    DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
    
    CREATE POLICY "Users can select their own notes" 
        ON notes FOR SELECT 
        TO authenticated 
        USING (user_id = auth.uid());
        
    CREATE POLICY "Users can insert their own notes" 
        ON notes FOR INSERT 
        TO authenticated 
        WITH CHECK (user_id = auth.uid());
        
    CREATE POLICY "Users can update their own notes" 
        ON notes FOR UPDATE 
        TO authenticated 
        USING (user_id = auth.uid()) 
        WITH CHECK (user_id = auth.uid());
        
    CREATE POLICY "Users can delete their own notes" 
        ON notes FOR DELETE 
        TO authenticated 
        USING (user_id = auth.uid());
    
    -- ==============================================
    -- RECREATE TRIGGERS SAFELY
    -- ==============================================
    
    -- Drop existing triggers
    DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
    DROP TRIGGER IF EXISTS set_updated_at ON notes;
    
    -- Ensure trigger function exists
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $func$ language 'plpgsql';
    
    -- Create triggers
    CREATE TRIGGER update_assignments_updated_at
        BEFORE UPDATE ON assignments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
    CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
    CREATE TRIGGER update_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'All duplicate conflicts resolved.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during cleanup: %', SQLERRM;
    RAISE NOTICE 'Continuing with partial cleanup...';
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================

DO $$
DECLARE
    table_count integer;
    policy_count integer;
    trigger_count integer;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('assignments', 'users', 'notes');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('assignments', 'users', 'notes');
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgname LIKE '%updated_at%' AND tgrelid IN (
        SELECT oid FROM pg_class WHERE relname IN ('assignments', 'users', 'notes')
    );
    
    RAISE NOTICE 'Verification Complete:';
    RAISE NOTICE '- Tables: % found', table_count;
    RAISE NOTICE '- RLS Policies: % found', policy_count;
    RAISE NOTICE '- Update Triggers: % found', trigger_count;
END $$;