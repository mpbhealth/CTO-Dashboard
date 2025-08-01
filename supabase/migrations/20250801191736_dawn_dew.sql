/*
# Fix Assignments Table RLS Policies

1. Security Updates
  - Ensure proper RLS policies for assignments table
  - Fix any 409 conflicts with user permissions
  - Safe creation using IF NOT EXISTS patterns

2. Tables Affected  
  - assignments - user assignment management
  - users - user profile integration
*/

-- Ensure assignments table exists with proper structure
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure users table exists for proper foreign key relationships
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can insert their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create comprehensive RLS policies for assignments
CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    assigned_to IN (
      SELECT users.id FROM users WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their assignments" 
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_to IN (
      SELECT users.id FROM users WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their assignments"
  ON assignments 
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT users.id FROM users WHERE users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    assigned_to IN (
      SELECT users.id FROM users WHERE users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE  
  TO authenticated
  USING (
    assigned_to IN (
      SELECT users.id FROM users WHERE users.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated  
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Create trigger function safely
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers safely with existence checks
DO $$
BEGIN
  -- Assignments trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_assignments_updated_at' 
    AND tgrelid = 'public.assignments'::regclass
  ) THEN
    CREATE TRIGGER update_assignments_updated_at
      BEFORE UPDATE ON public.assignments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Users trigger  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at' 
    AND tgrelid = 'public.users'::regclass
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  -- Assignments indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_assigned_to'
  ) THEN
    CREATE INDEX idx_assignments_assigned_to ON assignments(assigned_to);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_project_id'  
  ) THEN
    CREATE INDEX idx_assignments_project_id ON assignments(project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_status'
  ) THEN
    CREATE INDEX idx_assignments_status ON assignments(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_due_date'
  ) THEN
    CREATE INDEX idx_assignments_due_date ON assignments(due_date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_created_at'
  ) THEN
    CREATE INDEX idx_assignments_created_at ON assignments(created_at DESC);
  END IF;

  -- Users indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_auth_user_id'
  ) THEN
    CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email'
  ) THEN
    CREATE INDEX idx_users_email ON users(email);
  END IF;
END $$;