/*
  # Create saudemax_data table

  1. New Tables
    - `saudemax_data`
      - `id` (uuid, primary key)
      - `report_date` (date)
      - `metric_name` (text)
      - `metric_value` (numeric)
      - `category` (text)
      - `notes` (text, nullable)
      - `created_by` (uuid, FK to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `org_id` (uuid)

  2. Security
    - Enable RLS on `saudemax_data` table
    - Add policy for authenticated users to read data in their org
    - Add policy for authorized users to manage data
*/

CREATE TABLE IF NOT EXISTS saudemax_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  notes text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  org_id uuid NOT NULL
);

ALTER TABLE saudemax_data ENABLE ROW LEVEL SECURITY;

-- Users can view data in their org
CREATE POLICY "saudemax_data_select"
  ON saudemax_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = saudemax_data.org_id
    )
  );

-- CEO, CTO, admin, and authorized users can insert data
CREATE POLICY "saudemax_data_insert"
  ON saudemax_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = saudemax_data.org_id
      AND profiles.role IN ('ceo', 'cto', 'admin', 'staff')
    )
    AND created_by = auth.uid()
  );

-- Users can update data they created or admins can update
CREATE POLICY "saudemax_data_update"
  ON saudemax_data
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
      AND profiles.org_id = saudemax_data.org_id
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
      AND profiles.org_id = saudemax_data.org_id
    )
  );

-- Only admins and executives can delete data
CREATE POLICY "saudemax_data_delete"
  ON saudemax_data
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
      AND profiles.org_id = saudemax_data.org_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saudemax_data_org_id ON saudemax_data(org_id);
CREATE INDEX IF NOT EXISTS idx_saudemax_data_report_date ON saudemax_data(report_date);
CREATE INDEX IF NOT EXISTS idx_saudemax_data_category ON saudemax_data(category);
CREATE INDEX IF NOT EXISTS idx_saudemax_data_metric_name ON saudemax_data(metric_name);
