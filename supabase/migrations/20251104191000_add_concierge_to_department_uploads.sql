/*
  # Add Concierge to Department Uploads System

  ## Overview
  Extends the department uploads system to support Concierge department with three subdepartments:
  - weekly: Weekly performance metrics reports
  - daily: Daily interaction and call logs
  - after_hours: After-hours and emergency call tracking

  ## Changes
  - Updates department_uploads table to support concierge department
  - Adds subdepartment validation
  - Ensures RLS policies cover concierge uploads
*/

-- Add check constraint to department_uploads if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_department'
    AND table_name = 'department_uploads'
  ) THEN
    ALTER TABLE department_uploads
    ADD CONSTRAINT valid_department
    CHECK (department IN ('sales', 'finance', 'operations', 'concierge', 'saudemax'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing constraint if it exists and recreate with concierge
DO $$
BEGIN
  ALTER TABLE department_uploads
  DROP CONSTRAINT IF EXISTS valid_department;

  ALTER TABLE department_uploads
  ADD CONSTRAINT valid_department
  CHECK (department IN ('sales', 'finance', 'operations', 'concierge', 'saudemax'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

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

-- Add check constraint for subdepartment validation
DO $$
BEGIN
  ALTER TABLE department_uploads
  DROP CONSTRAINT IF EXISTS valid_concierge_subdepartment;

  ALTER TABLE department_uploads
  ADD CONSTRAINT valid_concierge_subdepartment
  CHECK (
    (department != 'concierge') OR
    (department = 'concierge' AND subdepartment IN ('weekly', 'daily', 'after_hours'))
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add check constraint for sales subdepartment validation
DO $$
BEGIN
  ALTER TABLE department_uploads
  DROP CONSTRAINT IF EXISTS valid_sales_subdepartment;

  ALTER TABLE department_uploads
  ADD CONSTRAINT valid_sales_subdepartment
  CHECK (
    (department != 'sales') OR
    (department = 'sales' AND subdepartment IN ('orders', 'leads', 'cancelations'))
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index on subdepartment for better query performance
CREATE INDEX IF NOT EXISTS idx_department_uploads_subdepartment
ON department_uploads(subdepartment);

-- Create composite index for department + subdepartment lookups
CREATE INDEX IF NOT EXISTS idx_department_uploads_dept_subdept
ON department_uploads(department, subdepartment);
