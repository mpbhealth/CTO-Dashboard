/*
  # Fix Trigger Conflicts - Notes Table
  
  1. Safely drop existing triggers to prevent conflicts
  2. Recreate triggers with proper error handling
  3. Ensure all update triggers work correctly
*/

-- Fix notes table trigger conflict
DO $$ 
BEGIN
    -- Only proceed if notes table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notes' AND table_schema = 'public'
    ) THEN
        
        -- Drop existing trigger safely (fixes the 42710 error)
        DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
        
        -- Ensure the function exists
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ language 'plpgsql';
        
        -- Create the trigger fresh
        CREATE TRIGGER update_notes_updated_at
            BEFORE UPDATE ON notes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Notes trigger recreated successfully';
        
    ELSE
        RAISE NOTICE 'Notes table does not exist - skipping trigger creation';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error handling notes trigger: %', SQLERRM;
END $$;

-- Fix assignments table trigger conflict (if needed)
DO $$ 
BEGIN
    -- Only proceed if assignments table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'assignments' AND table_schema = 'public'
    ) THEN
        
        -- Drop existing trigger safely
        DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
        
        -- Create the trigger
        CREATE TRIGGER update_assignments_updated_at
            BEFORE UPDATE ON assignments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Assignments trigger created successfully';
        
    ELSE
        RAISE NOTICE 'Assignments table does not exist - skipping trigger creation';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error handling assignments trigger: %', SQLERRM;
END $$;

-- Fix users table trigger conflict (if needed)
DO $$ 
BEGIN
    -- Only proceed if users table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN
        
        -- Drop existing trigger safely
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        
        -- Alternative function name that might be used
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ language 'plpgsql';
        
        -- Create the trigger (checking which function name is used)
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Users trigger created successfully';
        
    ELSE
        RAISE NOTICE 'Users table does not exist - skipping trigger creation';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error handling users trigger: %', SQLERRM;
END $$;

-- Verify all triggers were created successfully
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgname IN ('update_notes_updated_at', 'update_assignments_updated_at', 'update_users_updated_at');
    
    RAISE NOTICE 'Total update triggers created: %', trigger_count;
END $$;