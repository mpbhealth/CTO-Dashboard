/*
  # Create Assignments Table for Daily Organizer

  Creates the assignments table for task management in the Daily Organizer.

  1. New Tables
    - `assignments` - Task/assignment records
      - `id` (uuid, primary key)
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `status` (text) - pending, in_progress, completed, blocked
      - `priority` (text) - low, medium, high, urgent
      - `assignee_id` (uuid) - User assigned to the task
      - `due_date` (timestamptz) - Due date
      - `project_id` (uuid) - Optional project reference
      - `tags` (text[]) - Array of tags
      - `created_by` (uuid) - User who created the task
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can view and manage their own assignments
    - CEO/CTO/Admin can view all assignments
*/

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')) DEFAULT 'pending',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date timestamptz,
  project_id uuid,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_assignee ON assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON assignments(priority);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

-- Policy: Users can view their own assignments or if they are CEO/CTO/Admin
CREATE POLICY "Users can view their assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    assignee_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Policy: Authenticated users can create assignments
CREATE POLICY "Users can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Policy: Users can update their own assignments or if they are assigned
CREATE POLICY "Users can update their assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    assignee_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Policy: Users can delete their own assignments
CREATE POLICY "Users can delete their assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignments_updated_at();

-- Add comment for documentation
COMMENT ON TABLE assignments IS 'Task assignments for the Daily Organizer feature';
