/*
  # Add Assignments Feature

  1. New Tables
    - `assignments`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, optional)
      - `assigned_to` (uuid, references users)
      - `project_id` (uuid, references projects)
      - `status` (text, default 'todo')
      - `due_date` (date, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `assignments` table
    - Add policies for authenticated users to manage their assignments
  
  3. Functions
    - Create trigger function for updated_at timestamp
*/

-- Create the assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
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
  ) THEN
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- Create trigger for assignments updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_assignments_updated_at'
    AND tgrelid = 'assignments'::regclass
  ) THEN
    CREATE TRIGGER update_assignments_updated_at
      BEFORE UPDATE ON assignments
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);