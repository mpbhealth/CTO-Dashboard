/*
  # Create assignments table

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
    - Add policies for authenticated users to manage their own assignments

  3. Performance
    - Add indexes for efficient querying
    - Add trigger for automatic updated_at handling
*/

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' NOT NULL,
  due_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Add constraint for valid status values
  CONSTRAINT assignments_status_check CHECK (status IN ('todo', 'in_progress', 'done'))
);

-- Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

-- Create RLS policies
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
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = assigned_to);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);

-- Create trigger for automatic updated_at handling
-- Only create if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_assignments_updated_at'
  ) THEN
    CREATE TRIGGER update_assignments_updated_at
      BEFORE UPDATE ON assignments
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;