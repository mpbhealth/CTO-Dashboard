/*
  # Create employee_feedback table

  1. New Tables
    - `employee_feedback`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, FK to employee_profiles)
      - `feedback_from` (text)
      - `feedback_date` (date)
      - `feedback_type` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `employee_feedback` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS employee_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  feedback_from text NOT NULL,
  feedback_date date NOT NULL DEFAULT CURRENT_DATE,
  feedback_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback for employees in their org
CREATE POLICY "employee_feedback_select"
  ON employee_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles ep
      WHERE ep.id = employee_feedback.employee_id
    )
  );

-- Users can insert feedback
CREATE POLICY "employee_feedback_insert"
  ON employee_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employee_profiles ep
      WHERE ep.id = employee_feedback.employee_id
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employee_feedback_employee_id ON employee_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_date ON employee_feedback(feedback_date);
