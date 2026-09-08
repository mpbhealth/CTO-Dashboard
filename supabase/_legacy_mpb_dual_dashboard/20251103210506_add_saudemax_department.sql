/*
  # Add SaudeMAX Department Support

  1. Changes
    - Add 'saudemax' to department_uploads department constraint
    - Add 'saudemax' to upload_templates department constraint

  2. Why
    - The UI references saudemax department but it's not in the allowed list
    - This was causing validation errors when trying to upload saudemax data

  3. Security
    - Maintains all existing RLS policies
    - No changes to access control
*/

-- Drop existing constraints and recreate with saudemax included
ALTER TABLE department_uploads DROP CONSTRAINT IF EXISTS department_uploads_department_check;
ALTER TABLE department_uploads
  ADD CONSTRAINT department_uploads_department_check
  CHECK (department IN ('concierge', 'sales', 'operations', 'finance', 'saudemax'));

ALTER TABLE upload_templates DROP CONSTRAINT IF EXISTS upload_templates_department_check;
ALTER TABLE upload_templates
  ADD CONSTRAINT upload_templates_department_check
  CHECK (department IN ('concierge', 'sales', 'operations', 'finance', 'saudemax'));

-- Add saudemax template if it doesn't exist
INSERT INTO upload_templates (department, template_name, version, schema_definition, sample_data, instructions, is_active)
VALUES (
  'saudemax',
  'SaudeMAX Member Data Upload',
  1,
  '{"columns": [
    {"name": "member_id", "type": "text", "required": true},
    {"name": "enrollment_date", "type": "date", "required": true, "format": "YYYY-MM-DD"},
    {"name": "plan_type", "type": "text", "required": true},
    {"name": "status", "type": "text", "required": true},
    {"name": "monthly_premium", "type": "decimal", "required": false},
    {"name": "notes", "type": "text", "required": false}
  ]}'::jsonb,
  '[
    {"member_id": "SM12345", "enrollment_date": "2025-01-15", "plan_type": "Premium", "status": "active", "monthly_premium": 299.99, "notes": "New enrollment"}
  ]'::jsonb,
  'Upload SaudeMAX member enrollment and status data. Include member IDs, enrollment dates, plan types, and current status.',
  true
)
ON CONFLICT (department, version) DO NOTHING;
