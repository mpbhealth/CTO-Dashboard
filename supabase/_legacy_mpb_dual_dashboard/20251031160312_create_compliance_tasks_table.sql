/*
  # Create compliance_tasks table

  1. New Tables
    - `compliance_tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `due_date` (date)
      - `status` (text)
      - `priority` (text)
      - `assigned_to` (uuid, FK to profiles)
      - `created_by` (uuid, FK to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `compliance_tasks` table
    - Add policy for authenticated users to read tasks
    - Add policy for task creators/assignees to manage tasks
*/

CREATE TABLE IF NOT EXISTS compliance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES profiles(id),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  org_id uuid NOT NULL
);

ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks in their org
CREATE POLICY "compliance_tasks_select"
  ON compliance_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = compliance_tasks.org_id
    )
  );

-- Users can create tasks in their org
CREATE POLICY "compliance_tasks_insert"
  ON compliance_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = compliance_tasks.org_id
    )
    AND created_by = auth.uid()
  );

-- Users can update tasks they created or are assigned to
CREATE POLICY "compliance_tasks_update"
  ON compliance_tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
      AND profiles.org_id = compliance_tasks.org_id
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR assigned_to IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
      AND profiles.org_id = compliance_tasks.org_id
    )
  );

-- Users can delete tasks they created or admins can delete
CREATE POLICY "compliance_tasks_delete"
  ON compliance_tasks
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
      AND profiles.org_id = compliance_tasks.org_id
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_org_id ON compliance_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_assigned_to ON compliance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_due_date ON compliance_tasks(due_date);
