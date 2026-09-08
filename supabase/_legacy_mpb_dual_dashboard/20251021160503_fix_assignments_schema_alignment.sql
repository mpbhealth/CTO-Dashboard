/*
  # Fix Assignments Table Schema Alignment
  
  ## Changes Made
  
  1. Schema Updates
    - Update status field to use 'todo' as default instead of 'pending'
    - Add proper CHECK constraint for status values
    - Ensure all columns match application expectations
  
  2. Data Migration
    - Convert existing 'pending' status to 'todo'
    - Preserve all other status values
  
  3. Security
    - Maintain existing RLS policies
    - Ensure authenticated users can access assignments
*/

-- Update existing 'pending' status to 'todo' to match application expectations
UPDATE assignments 
SET status = 'todo' 
WHERE status = 'pending';

-- Drop existing status constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assignments_status_check'
  ) THEN
    ALTER TABLE assignments DROP CONSTRAINT assignments_status_check;
  END IF;
END $$;

-- Add proper CHECK constraint for status values matching the application
ALTER TABLE assignments 
ADD CONSTRAINT assignments_status_check 
CHECK (status IN ('todo', 'in_progress', 'done'));

-- Update the default value for status column
ALTER TABLE assignments 
ALTER COLUMN status SET DEFAULT 'todo';

-- Ensure the assignments table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for updated_at
DROP TRIGGER IF EXISTS update_assignments_updated_at_trigger ON assignments;
CREATE TRIGGER update_assignments_updated_at_trigger
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignments_updated_at();

-- Verify users table has proper structure for assignments
DO $$
BEGIN
  -- Ensure auth_user_id column exists in users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
  END IF;
END $$;
