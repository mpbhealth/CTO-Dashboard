/*
  # Create Assignments Table with Safe Policy Management

  1. New Tables
    - `assignments`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `assigned_to` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects)
      - `status` (text, with check constraint)
      - `due_date` (date, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `assignments` table
    - Safe policy creation that handles existing policies
    - Add indexes for performance

  3. Triggers
    - Add trigger to automatically update `updated_at` timestamp
*/

-- Create the assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'assignments' 
    AND schemaname = 'public'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Safe policy creation: Drop existing policies first, then recreate
DO $$
BEGIN
  -- Drop all existing assignment policies
  DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;
  
  -- Also drop any variations that might exist
  DROP POLICY IF EXISTS "Users can view assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can create their assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can update assignments" ON assignments;
  DROP POLICY IF EXISTS "Users can delete assignments" ON assignments;
  DROP POLICY IF EXISTS "User view assignments" ON assignments;
  DROP POLICY IF EXISTS "User create assignments" ON assignments;
  DROP POLICY IF EXISTS "User update assignments" ON assignments;
  DROP POLICY IF EXISTS "User delete assignments" ON assignments;
END $$;

-- Create fresh policies
CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = assigned_to);

CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Users can update their assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to);

CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = assigned_to);

-- Create trigger function for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_modified_column'
    AND pg_get_function_result(oid) = 'trigger'
  ) THEN
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger for assignments updated_at (drop first if exists)
DO $$
BEGIN
  -- Drop trigger if it exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_assignments_updated_at'
    AND tgrelid = 'assignments'::regclass
  ) THEN
    DROP TRIGGER update_assignments_updated_at ON assignments;
  END IF;
  
  -- Create the trigger
  CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
END $$;

-- Create indexes for better performance (safe creation)
DO $$
BEGIN
  -- Create indexes only if they don't exist
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
END $$;