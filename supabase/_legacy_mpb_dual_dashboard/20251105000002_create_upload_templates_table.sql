/*
  # Create Upload Templates Table

  ## Overview
  Creates the upload_templates table to store CSV upload template definitions
  for each department (concierge, sales, sales-leads, sales-cancelations, etc.)

  ## New Tables
  1. `upload_templates` - Template definitions for department uploads
     - `id` (uuid, primary key)
     - `department` (text) - Department identifier
     - `template_name` (text) - Human-readable template name
     - `version` (integer) - Template version number
     - `schema_definition` (jsonb) - Column definitions and validation rules
     - `sample_data` (jsonb) - Example data rows
     - `instructions` (text) - User instructions for upload
     - `is_active` (boolean) - Whether template is currently active
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled
  - All authenticated users can read active templates
  - Only CEO and admin roles can manage templates
*/

-- Create upload_templates table
CREATE TABLE IF NOT EXISTS upload_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
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

-- Enable RLS
ALTER TABLE upload_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "All authenticated users can view active templates" ON upload_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON upload_templates;

-- Create policy for authenticated users to read active templates
CREATE POLICY "All authenticated users can view active templates"
  ON upload_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create policy for admins to manage templates
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_templates_department ON upload_templates(department);
CREATE INDEX IF NOT EXISTS idx_upload_templates_active ON upload_templates(is_active) WHERE is_active = true;

-- Insert default upload templates
INSERT INTO upload_templates (department, template_name, version, schema_definition, sample_data, instructions, is_active)
VALUES
(
  'concierge',
  'Concierge Interactions Upload',
  1,
  '{"columns": [
    {"name": "occurred_at", "type": "timestamp", "required": true},
    {"name": "member_id", "type": "text", "required": false},
    {"name": "agent_name", "type": "text", "required": true},
    {"name": "channel", "type": "text", "required": true},
    {"name": "result", "type": "text", "required": true},
    {"name": "duration_minutes", "type": "integer", "required": false},
    {"name": "notes", "type": "text", "required": false}
  ]}'::jsonb,
  '[{"occurred_at": "2025-01-15 10:30:00", "member_id": "M12345", "agent_name": "John Smith", "channel": "Phone", "result": "Resolved", "duration_minutes": 15, "notes": "Billing inquiry"}]'::jsonb,
  'Upload concierge interaction records. Include timestamps, agent names, channels, and outcomes.',
  true
),
(
  'sales',
  'Sales Orders Upload',
  1,
  '{"columns": [
    {"name": "Date", "type": "text", "required": true},
    {"name": "Name", "type": "text", "required": true},
    {"name": "Plan", "type": "text", "required": true},
    {"name": "Size", "type": "text", "required": true},
    {"name": "Agent", "type": "text", "required": true},
    {"name": "Group?", "type": "text", "required": false}
  ]}'::jsonb,
  '[{"Date": "1-Oct", "Name": "John Doe", "Plan": "Premium HSA", "Size": "M+S", "Agent": "Sarah Johnson", "Group?": "FALSE"}]'::jsonb,
  'Upload sales enrollment records. Date format: "1-Oct" or "10/1/2025". Group field should be TRUE/FALSE.',
  true
),
(
  'sales-leads',
  'Sales Leads Upload',
  1,
  '{"columns": [
    {"name": "Date", "type": "text", "required": true},
    {"name": "Name", "type": "text", "required": true},
    {"name": "Source", "type": "text", "required": true},
    {"name": "Status", "type": "text", "required": true},
    {"name": "Lead Owner", "type": "text", "required": true},
    {"name": "Group Lead?", "type": "text", "required": false},
    {"name": "Recent Notes", "type": "text", "required": false}
  ]}'::jsonb,
  '[{"Date": "10/15/2025", "Name": "Jane Smith", "Source": "Website Visit", "Status": "In Process", "Lead Owner": "Mike Brown", "Group Lead?": "FALSE", "Recent Notes": "Left VM"}]'::jsonb,
  'Upload lead tracking data. Date format: "MM/DD/YYYY" or "1-Oct". Status: In Process, First Attempt, Closed, Not Contacted.',
  true
),
(
  'sales-cancelations',
  'Sales Cancelations Upload',
  1,
  '{"columns": [
    {"name": "Name:", "type": "text", "required": true},
    {"name": "Reason:", "type": "text", "required": true},
    {"name": "Membership:", "type": "text", "required": true},
    {"name": "Advisor:", "type": "text", "required": true},
    {"name": "Outcome:", "type": "text", "required": false}
  ]}'::jsonb,
  '[{"Name:": "John Doe", "Reason:": "Financial Reasons", "Membership:": "Premium HSA", "Advisor:": "Emily Rodriguez", "Outcome:": "Left VM, will try again"}]'::jsonb,
  'Upload member cancelation reports. Include name, reason, membership type, advisor, and outcome notes.',
  true
),
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
  '[{"record_date": "2025-01-15", "category": "ar", "amount": 50000, "description": "Client Invoice Payment", "vendor_customer": "ABC Corp", "status": "received"}]'::jsonb,
  'Upload finance records including AR, AP, payouts, revenue, and expenses. Ensure dates are in YYYY-MM-DD format.',
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
  '[{"cancel_date": "2025-01-15", "member_id": "M12345", "reason": "Cost", "agent": "Emily Rodriguez", "save_attempted": true, "save_successful": false, "mrr_lost": 150}]'::jsonb,
  'Upload plan cancellation records. Include cancellation dates, reasons, save attempts, and MRR impact.',
  true
),
(
  'saudemax',
  'SaudeMAX Program Upload',
  1,
  '{"columns": [
    {"name": "enrollment_date", "type": "date", "required": true},
    {"name": "member_id", "type": "text", "required": true},
    {"name": "program_type", "type": "text", "required": true},
    {"name": "status", "type": "text", "required": false},
    {"name": "engagement_score", "type": "integer", "required": false},
    {"name": "satisfaction_score", "type": "integer", "required": false},
    {"name": "health_improvement", "type": "decimal", "required": false}
  ]}'::jsonb,
  '[{"enrollment_date": "2025-01-15", "member_id": "M12345", "program_type": "Wellness Coaching", "status": "active", "engagement_score": 85, "satisfaction_score": 90, "health_improvement": 12.5}]'::jsonb,
  'Upload SaudeMAX program enrollment and outcomes data. Track member engagement and health improvements.',
  true
)
ON CONFLICT (department, version) DO NOTHING;
