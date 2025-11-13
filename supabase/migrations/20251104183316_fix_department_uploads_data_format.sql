/*
  # Fix Department Uploads Data Format

  ## Overview
  Migrates existing department_uploads data to use the new department/subdepartment structure
  before applying constraints.

  ## Changes
  1. Adds subdepartment column if missing
  2. Migrates existing sales-leads and sales-cancelations to use subdepartment
  3. Applies proper constraints after data is migrated
*/

-- Add subdepartment column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'department_uploads'
    AND column_name = 'subdepartment'
  ) THEN
    ALTER TABLE department_uploads
    ADD COLUMN subdepartment text;
  END IF;
END $$;

-- Migrate existing sales-leads data to sales department with leads subdepartment
UPDATE department_uploads
SET 
  department = 'sales',
  subdepartment = 'leads'
WHERE department = 'sales-leads';

-- Migrate existing sales-cancelations data to sales department with cancelations subdepartment
UPDATE department_uploads
SET 
  department = 'sales',
  subdepartment = 'cancelations'
WHERE department = 'sales-cancelations';

-- Migrate any generic sales entries to have orders subdepartment if subdepartment is null
UPDATE department_uploads
SET subdepartment = 'orders'
WHERE department = 'sales' AND subdepartment IS NULL;

-- Drop existing constraints if they exist
ALTER TABLE department_uploads
DROP CONSTRAINT IF EXISTS valid_department;

ALTER TABLE department_uploads
DROP CONSTRAINT IF EXISTS valid_concierge_subdepartment;

ALTER TABLE department_uploads
DROP CONSTRAINT IF EXISTS valid_sales_subdepartment;

-- Add check constraint to department_uploads for valid departments
ALTER TABLE department_uploads
ADD CONSTRAINT valid_department
CHECK (department IN ('sales', 'finance', 'operations', 'concierge', 'saudemax'));

-- Add check constraint for concierge subdepartment validation
ALTER TABLE department_uploads
ADD CONSTRAINT valid_concierge_subdepartment
CHECK (
  (department != 'concierge') OR
  (department = 'concierge' AND subdepartment IN ('weekly', 'daily', 'after_hours'))
);

-- Add check constraint for sales subdepartment validation
ALTER TABLE department_uploads
ADD CONSTRAINT valid_sales_subdepartment
CHECK (
  (department != 'sales') OR
  (department = 'sales' AND subdepartment IN ('orders', 'leads', 'cancelations'))
);

-- Create index on subdepartment for better query performance
CREATE INDEX IF NOT EXISTS idx_department_uploads_subdepartment
ON department_uploads(subdepartment);

-- Create composite index for department + subdepartment lookups
CREATE INDEX IF NOT EXISTS idx_department_uploads_dept_subdept
ON department_uploads(department, subdepartment);
