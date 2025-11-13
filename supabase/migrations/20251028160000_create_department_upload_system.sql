/*
  # Department Upload System and Finance Tables

  1. New Tables
    - `stg_finance_records` - Staging table for finance data uploads (AR, AP, Payouts)
      - `staging_id` (uuid, primary key)
      - `org_id` (uuid, foreign key to organizations)
      - `uploaded_by` (uuid, foreign key to profiles)
      - `upload_batch_id` (uuid, groups records from same upload)
      - `sheet_name` (text, name of uploaded sheet)
      - `record_date` (date)
      - `category` (text: 'ar', 'ap', 'payout', 'revenue', 'expense')
      - `amount` (decimal)
      - `description` (text)
      - `vendor_customer` (text)
      - `status` (text)
      - `created_at` (timestamptz)

    - `finance_records` - Production finance table
      - Same structure as staging with approval status

    - `department_uploads` - Upload history and metadata
      - `id` (uuid, primary key)
      - `org_id` (uuid, foreign key)
      - `uploaded_by` (uuid, foreign key)
      - `department` (text: 'concierge', 'sales', 'operations', 'finance')
      - `file_name` (text)
      - `file_size` (bigint)
      - `row_count` (integer)
      - `rows_imported` (integer)
      - `rows_failed` (integer)
      - `status` (text: 'pending', 'processing', 'completed', 'failed', 'approved', 'rejected')
      - `validation_errors` (jsonb)
      - `batch_id` (uuid)
      - `approved_by` (uuid)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz)

    - `upload_templates` - Template definitions for each department
      - `id` (uuid, primary key)
      - `department` (text)
      - `template_name` (text)
      - `version` (integer)
      - `schema_definition` (jsonb)
      - `sample_data` (jsonb)
      - `instructions` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for CEO and department users to access their respective data
    - Add policies for upload and approval workflows

  3. Indexes
    - Add indexes on frequently queried columns for performance
*/

-- Create stg_finance_records staging table
CREATE TABLE IF NOT EXISTS stg_finance_records (
  staging_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id),
  upload_batch_id uuid NOT NULL,
  sheet_name text,
  record_date date,
  category text CHECK (category IN ('ar', 'ap', 'payout', 'revenue', 'expense', 'other')),
  amount decimal(12, 2) DEFAULT 0,
  description text,
  vendor_customer text,
  status text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create finance_records production table
CREATE TABLE IF NOT EXISTS finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  upload_batch_id uuid,
  record_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('ar', 'ap', 'payout', 'revenue', 'expense', 'other')),
  amount decimal(12, 2) NOT NULL DEFAULT 0,
  description text,
  vendor_customer text,
  status text DEFAULT 'active',
  notes text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create department_uploads tracking table
CREATE TABLE IF NOT EXISTS department_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id),
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'operations', 'finance')),
  file_name text NOT NULL,
  file_size bigint DEFAULT 0,
  row_count integer DEFAULT 0,
  rows_imported integer DEFAULT 0,
  rows_failed integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'approved', 'rejected')),
  validation_errors jsonb,
  batch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create upload_templates table
CREATE TABLE IF NOT EXISTS upload_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'operations', 'finance')),
  template_name text NOT NULL,
  version integer DEFAULT 1,
  schema_definition jsonb NOT NULL,
  sample_data jsonb,
  instructions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(department, version)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stg_finance_records_org_id ON stg_finance_records(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_finance_records_batch_id ON stg_finance_records(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_finance_records_date ON stg_finance_records(record_date);
CREATE INDEX IF NOT EXISTS idx_stg_finance_records_category ON stg_finance_records(category);

CREATE INDEX IF NOT EXISTS idx_finance_records_org_id ON finance_records(org_id);
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(record_date);
CREATE INDEX IF NOT EXISTS idx_finance_records_category ON finance_records(category);

CREATE INDEX IF NOT EXISTS idx_department_uploads_org_id ON department_uploads(org_id);
CREATE INDEX IF NOT EXISTS idx_department_uploads_department ON department_uploads(department);
CREATE INDEX IF NOT EXISTS idx_department_uploads_status ON department_uploads(status);
CREATE INDEX IF NOT EXISTS idx_department_uploads_batch_id ON department_uploads(batch_id);
CREATE INDEX IF NOT EXISTS idx_department_uploads_created_at ON department_uploads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upload_templates_department ON upload_templates(department);
CREATE INDEX IF NOT EXISTS idx_upload_templates_active ON upload_templates(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE stg_finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stg_finance_records
CREATE POLICY "CEO and admins can view all staging finance records"
  ON stg_finance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "Finance users can view their own uploads"
  ON stg_finance_records FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Finance users can insert staging records"
  ON stg_finance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_finance_records.org_id
    )
  );

-- RLS Policies for finance_records
CREATE POLICY "CEO and admins can view finance records"
  ON finance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admins can insert finance records"
  ON finance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admins can update finance records"
  ON finance_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- RLS Policies for department_uploads
CREATE POLICY "CEO and admins can view all uploads"
  ON department_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );

CREATE POLICY "Users can view their own uploads"
  ON department_uploads FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can create uploads"
  ON department_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
    )
  );

CREATE POLICY "CEO and admins can update upload status"
  ON department_uploads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- RLS Policies for upload_templates
CREATE POLICY "All authenticated users can view active templates"
  ON upload_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON upload_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Insert default upload templates
INSERT INTO upload_templates (department, template_name, version, schema_definition, sample_data, instructions, is_active)
VALUES
(
  'finance',
  'Finance Records Upload',
  1,
  '{"columns": [
    {"name": "record_date", "type": "date", "required": true, "format": "YYYY-MM-DD"},
    {"name": "category", "type": "text", "required": true, "values": ["ar", "ap", "payout", "revenue", "expense"]},
    {"name": "amount", "type": "decimal", "required": true},
    {"name": "description", "type": "text", "required": false},
    {"name": "vendor_customer", "type": "text", "required": false},
    {"name": "status", "type": "text", "required": false}
  ]}'::jsonb,
  '[
    {"record_date": "2025-01-15", "category": "ar", "amount": 50000, "description": "Client Invoice Payment", "vendor_customer": "ABC Corp", "status": "received"},
    {"record_date": "2025-01-20", "category": "ap", "amount": 15000, "description": "Vendor Payment", "vendor_customer": "XYZ Supplies", "status": "paid"}
  ]'::jsonb,
  'Upload finance records including AR, AP, payouts, revenue, and expenses. Ensure dates are in YYYY-MM-DD format and amounts are numeric.',
  true
),
(
  'concierge',
  'Concierge Interactions Upload',
  1,
  '{"columns": [
    {"name": "occurred_at", "type": "timestamp", "required": true, "format": "YYYY-MM-DD HH:MM:SS"},
    {"name": "member_id", "type": "text", "required": false},
    {"name": "agent_name", "type": "text", "required": true},
    {"name": "channel", "type": "text", "required": true},
    {"name": "result", "type": "text", "required": true},
    {"name": "duration_minutes", "type": "integer", "required": false},
    {"name": "notes", "type": "text", "required": false}
  ]}'::jsonb,
  '[
    {"occurred_at": "2025-01-15 10:30:00", "member_id": "M12345", "agent_name": "John Smith", "channel": "Phone", "result": "Resolved", "duration_minutes": 15, "notes": "Billing inquiry"}
  ]'::jsonb,
  'Upload concierge interaction records. Include timestamps, agent names, channels, and outcomes.',
  true
),
(
  'sales',
  'Sales Orders Upload',
  1,
  '{"columns": [
    {"name": "order_date", "type": "date", "required": true, "format": "YYYY-MM-DD"},
    {"name": "order_id", "type": "text", "required": false},
    {"name": "member_id", "type": "text", "required": false},
    {"name": "amount", "type": "decimal", "required": true},
    {"name": "plan", "type": "text", "required": false},
    {"name": "rep", "type": "text", "required": true},
    {"name": "channel", "type": "text", "required": false},
    {"name": "status", "type": "text", "required": false}
  ]}'::jsonb,
  '[
    {"order_date": "2025-01-15", "order_id": "ORD-1001", "member_id": "M12345", "amount": 2500, "plan": "Premium", "rep": "Sarah Johnson", "channel": "Direct", "status": "Closed"}
  ]'::jsonb,
  'Upload sales order records. Include order dates, amounts, sales reps, and deal status.',
  true
),
(
  'operations',
  'Plan Cancellations Upload',
  1,
  '{"columns": [
    {"name": "cancel_date", "type": "date", "required": true, "format": "YYYY-MM-DD"},
    {"name": "member_id", "type": "text", "required": false},
    {"name": "reason", "type": "text", "required": true},
    {"name": "agent", "type": "text", "required": false},
    {"name": "save_attempted", "type": "boolean", "required": false},
    {"name": "save_successful", "type": "boolean", "required": false},
    {"name": "mrr_lost", "type": "decimal", "required": true}
  ]}'::jsonb,
  '[
    {"cancel_date": "2025-01-15", "member_id": "M12345", "reason": "Cost", "agent": "Emily Rodriguez", "save_attempted": true, "save_successful": false, "mrr_lost": 150}
  ]'::jsonb,
  'Upload plan cancellation records. Include cancellation dates, reasons, save attempts, and MRR impact.',
  true
)
ON CONFLICT (department, version) DO NOTHING;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_finance_records_updated_at
  BEFORE UPDATE ON finance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_department_uploads_updated_at
  BEFORE UPDATE ON department_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_templates_updated_at
  BEFORE UPDATE ON upload_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
