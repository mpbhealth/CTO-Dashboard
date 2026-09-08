/*
  # Create SaudeMAX Analytics Tables

  1. New Tables
    - `stg_saudemax_data` - Staging table for SaudeMAX member data uploads
      - `staging_id` (uuid, primary key)
      - `org_id` (uuid, reference to organization)
      - `uploaded_by` (uuid, reference to user)
      - `upload_batch_id` (uuid, batch identifier)
      - `sheet_name` (text)
      - `enrollment_date` (date)
      - `member_id` (text)
      - `program_type` (text)
      - `status` (text)
      - `engagement_score` (numeric)
      - `satisfaction_score` (numeric)
      - `health_improvement` (numeric)
      - `created_at` (timestamptz)

    - `saudemax_data` - View table for cleaned SaudeMAX data
      - Same columns as staging table
      - Accessible for analytics and reporting

  2. Security
    - Enable RLS on `stg_saudemax_data`
    - Enable RLS on `saudemax_data`
    - Add policies for authenticated users to read their organization's data
    - Add policies for authenticated users to insert data

  3. Upload Templates
    - Add SaudeMAX template to `upload_templates` table
*/

-- Create staging table for SaudeMAX data uploads
CREATE TABLE IF NOT EXISTS stg_saudemax_data (
  staging_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  uploaded_by uuid REFERENCES auth.users(id),
  upload_batch_id uuid,
  sheet_name text,
  enrollment_date date,
  member_id text,
  program_type text,
  status text DEFAULT 'active',
  engagement_score numeric,
  satisfaction_score numeric,
  health_improvement numeric,
  created_at timestamptz DEFAULT now()
);

-- Create view table for SaudeMAX data
CREATE TABLE IF NOT EXISTS saudemax_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  uploaded_by uuid REFERENCES auth.users(id),
  enrollment_date date,
  member_id text,
  program_type text,
  status text DEFAULT 'active',
  engagement_score numeric,
  satisfaction_score numeric,
  health_improvement numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE stg_saudemax_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE saudemax_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stg_saudemax_data
CREATE POLICY "Users can view own org staging saudemax data"
  ON stg_saudemax_data
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert staging saudemax data"
  ON stg_saudemax_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
  );

-- RLS Policies for saudemax_data
CREATE POLICY "Users can view own org saudemax data"
  ON saudemax_data
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert saudemax data"
  ON saudemax_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update own org saudemax data"
  ON saudemax_data
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add upload template for SaudeMAX
INSERT INTO upload_templates (
  department,
  template_name,
  version,
  is_active,
  schema_definition,
  sample_data,
  instructions,
  created_at
)
VALUES (
  'saudemax',
  'SaudeMAX Member Data Upload',
  1,
  true,
  jsonb_build_object(
    'columns', jsonb_build_array(
      jsonb_build_object('name', 'enrollment_date', 'type', 'date', 'required', true),
      jsonb_build_object('name', 'member_id', 'type', 'text', 'required', true),
      jsonb_build_object('name', 'program_type', 'type', 'text', 'required', true),
      jsonb_build_object('name', 'status', 'type', 'text', 'required', false),
      jsonb_build_object('name', 'engagement_score', 'type', 'numeric', 'required', false),
      jsonb_build_object('name', 'satisfaction_score', 'type', 'numeric', 'required', false),
      jsonb_build_object('name', 'health_improvement', 'type', 'numeric', 'required', false)
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'enrollment_date', '2025-01-15',
      'member_id', 'MBR-12345',
      'program_type', 'Wellness Program',
      'status', 'active',
      'engagement_score', 85,
      'satisfaction_score', 9.2,
      'health_improvement', 15.5
    ),
    jsonb_build_object(
      'enrollment_date', '2025-01-20',
      'member_id', 'MBR-67890',
      'program_type', 'Health Coaching',
      'status', 'active',
      'engagement_score', 92,
      'satisfaction_score', 9.5,
      'health_improvement', 22.3
    )
  ),
  'Upload SaudeMAX member enrollment and engagement data. Include enrollment date, member ID, program type, status, engagement score (0-100), satisfaction score (0-10), and health improvement percentage.',
  now()
)
ON CONFLICT (department, version)
DO UPDATE SET
  is_active = EXCLUDED.is_active,
  schema_definition = EXCLUDED.schema_definition,
  sample_data = EXCLUDED.sample_data,
  instructions = EXCLUDED.instructions;
