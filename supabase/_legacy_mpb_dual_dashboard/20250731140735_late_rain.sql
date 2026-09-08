/*
  # Complete Assignments System Setup

  1. Tables Created
    - `users` - User profiles linked to auth.users
    - `assignments` - Task assignments with full functionality

  2. Security
    - Enable RLS on both tables
    - User-specific access policies
    - Secure foreign key relationships

  3. Performance
    - Optimized indexes for common queries
    - Efficient lookups and sorting

  4. Triggers
    - Auto-update timestamps
    - Data consistency
*/

-- First, create the users table if it doesn't exist
-- This is needed for foreign key references throughout the system
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Create index for users table
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Now create the assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint to ensure valid status values
  CONSTRAINT assignments_status_check CHECK (status IN ('todo', 'in_progress', 'done'))
);

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assignments
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_to IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
CREATE POLICY "Users can update their assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    assigned_to IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;
CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes for assignments table
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);

-- Create or update the trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for assignments table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_assignments_updated_at'
  ) THEN
    CREATE TRIGGER update_assignments_updated_at
      BEFORE UPDATE ON assignments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create trigger for users table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert a default user record for the current auth user (if needed)
-- This ensures there's always a user record for assignments to reference
INSERT INTO users (auth_user_id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.auth_user_id = au.id
)
ON CONFLICT (auth_user_id) DO NOTHING;