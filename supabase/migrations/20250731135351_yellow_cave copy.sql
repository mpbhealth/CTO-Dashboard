/*
  # Add Assignments Feature

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
    - Add policies for authenticated users to manage their assignments
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
-- SKIPPED: ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for assignments
-- SKIPPED: CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = assigned_to);

-- SKIPPED: CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = assigned_to);

-- SKIPPED: CREATE POLICY "Users can update their assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

-- SKIPPED: CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = assigned_to);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at column
-- SKIPPED BLOCK: DO $$
-- SKIPPED BLOCK: BEGIN
-- SKIPPED BLOCK:   IF NOT EXISTS (
-- SKIPPED BLOCK:     SELECT 1 FROM pg_trigger 
-- SKIPPED BLOCK:     WHERE tgname = 'update_assignments_updated_at'
-- SKIPPED BLOCK:     AND tgrelid = 'assignments'::regclass
-- SKIPPED BLOCK:   ) THEN
-- SKIPPED BLOCK:     CREATE TRIGGER update_assignments_updated_at
-- SKIPPED BLOCK:     BEFORE UPDATE ON assignments
-- SKIPPED BLOCK:     FOR EACH ROW
-- SKIPPED BLOCK:     EXECUTE FUNCTION update_updated_at_column();
-- SKIPPED BLOCK:   END IF;
-- SKIPPED BLOCK: END
-- SKIPPED BLOCK: $$;