/*
  # Add Sales Sub-Departments to Upload System

  1. Changes
    - Add 'sales-leads' and 'sales-cancelations' to department_uploads department constraint
    - Add 'sales-leads' and 'sales-cancelations' to upload_templates department constraint
    - Insert upload templates for both new departments

  2. Why
    - Edge function supports sales-leads and sales-cancelations departments
    - Database constraint was blocking upload record creation
    - Staging tables (stg_sales_leads, stg_sales_cancelations) already exist
    - Views and RLS policies already configured

  3. Security
    - Maintains all existing RLS policies
    - Sales team members already have access via existing policies
    - No changes to access control
*/

-- Drop existing constraints and recreate with sales sub-departments included
ALTER TABLE department_uploads DROP CONSTRAINT IF EXISTS department_uploads_department_check;
ALTER TABLE department_uploads
  ADD CONSTRAINT department_uploads_department_check
  CHECK (department IN ('concierge', 'sales', 'sales-leads', 'sales-cancelations', 'operations', 'finance', 'saudemax'));

ALTER TABLE upload_templates DROP CONSTRAINT IF EXISTS upload_templates_department_check;
ALTER TABLE upload_templates
  ADD CONSTRAINT upload_templates_department_check
  CHECK (department IN ('concierge', 'sales', 'sales-leads', 'sales-cancelations', 'operations', 'finance', 'saudemax'));

-- Insert sales-leads template
INSERT INTO upload_templates (department, template_name, version, schema_definition, sample_data, instructions, is_active)
VALUES (
  'sales-leads',
  'Sales Leads Upload',
  1,
  '{"columns": [
    {"name": "Date", "type": "text", "required": true, "description": "Lead date in format MM/DD/YYYY or DD-Mon"},
    {"name": "Name", "type": "text", "required": true, "description": "Lead full name"},
    {"name": "Source", "type": "text", "required": false, "description": "Lead source (e.g., Website Visit, Word Of Mouth, Referral)"},
    {"name": "Status", "type": "text", "required": false, "description": "Lead status (e.g., In Process, First Attempt, Closed)"},
    {"name": "Lead Owner", "type": "text", "required": false, "description": "Sales rep assigned to this lead"},
    {"name": "Group Lead?", "type": "text", "required": false, "description": "TRUE if group lead, FALSE otherwise"},
    {"name": "Recent Notes", "type": "text", "required": false, "description": "Latest notes or activity for this lead"}
  ]}'::jsonb,
  '[
    {"Date": "11/4/2025", "Name": "John Smith", "Source": "Website Visit", "Status": "First Attempt", "Lead Owner": "Sarah Johnson", "Group Lead?": "FALSE", "Recent Notes": "Left VM - follow up tomorrow"},
    {"Date": "4-Nov", "Name": "Jane Doe", "Source": "Friend Referral", "Status": "In Process", "Lead Owner": "Mike Chen", "Group Lead?": "TRUE", "Recent Notes": "Quote provided - awaiting response"}
  ]'::jsonb,
  'Upload sales lead tracking data. Supports multiple date formats (MM/DD/YYYY, DD-Mon, Mon-DD). System automatically categorizes lead sources, normalizes status values, and detects forwarding actions in notes. Use "Group Lead?" column to mark group insurance leads.',
  true
)
ON CONFLICT (department, version) DO NOTHING;

-- Insert sales-cancelations template
INSERT INTO upload_templates (department, template_name, version, schema_definition, sample_data, instructions, is_active)
VALUES (
  'sales-cancelations',
  'Sales Cancelations Upload',
  1,
  '{"columns": [
    {"name": "Name:", "type": "text", "required": true, "description": "Member name who canceled"},
    {"name": "Reason:", "type": "text", "required": true, "description": "Reason for cancelation"},
    {"name": "Membership:", "type": "text", "required": false, "description": "Type of membership/plan that was canceled"},
    {"name": "Advisor:", "type": "text", "required": false, "description": "Name of advisor who handled the cancelation"},
    {"name": "Outcome:", "type": "text", "required": false, "description": "Notes about the outcome and any save attempts"}
  ]}'::jsonb,
  '[
    {"Name:": "John Smith", "Reason:": "Cost concerns", "Membership:": "Premium Family Plan", "Advisor:": "Sarah Johnson", "Outcome:": "Save attempted - member decided to proceed with cancelation"},
    {"Name:": "Jane Doe", "Reason:": "Moving out of area", "Membership:": "Individual Plan", "Advisor:": "Mike Chen", "Outcome:": "No save attempt - relocation"}
  ]'::jsonb,
  'Upload member cancelation tracking data. Include member names, cancelation reasons, membership types, and advisor notes. Use the Outcome field to document save attempt results and any relevant context about the cancelation.',
  true
)
ON CONFLICT (department, version) DO NOTHING;
