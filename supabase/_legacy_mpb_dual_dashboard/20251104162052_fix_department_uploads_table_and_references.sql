/*
  # Fix Department Uploads Table and Foreign Key References

  ## Issues Fixed
  1. department_uploads table references non-existent 'organizations' table
  2. Should reference 'orgs' table instead
  3. RLS policies use profiles.id but should use profiles.user_id for auth comparison
  4. Need to update department constraints to include new subdepartments

  ## Changes
  - Drop and recreate department_uploads with correct foreign keys
  - Update all related staging tables to use orgs instead of organizations
  - Fix RLS policies to use correct profile references
  - Add new department values for sales subdepartments

  ## Security
  - RLS policies maintained and corrected
  - Proper org scoping enforced
*/

-- Drop existing department_uploads table if it exists
DROP TABLE IF EXISTS department_uploads CASCADE;

-- Recreate department_uploads with correct foreign keys
CREATE TABLE department_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'sales-leads', 'sales-cancelations', 'operations', 'finance', 'saudemax')),
  file_name text NOT NULL,
  file_size bigint DEFAULT 0,
  row_count integer DEFAULT 0,
  rows_imported integer DEFAULT 0,
  rows_failed integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'approved', 'rejected')),
  validation_errors jsonb,
  batch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_department_uploads_org_id ON department_uploads(org_id);
CREATE INDEX idx_department_uploads_uploaded_by ON department_uploads(uploaded_by);
CREATE INDEX idx_department_uploads_department ON department_uploads(department);
CREATE INDEX idx_department_uploads_status ON department_uploads(status);
CREATE INDEX idx_department_uploads_batch_id ON department_uploads(batch_id);
CREATE INDEX idx_department_uploads_created_at ON department_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE department_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies with corrected references
CREATE POLICY "CEO, CTO and admins can view all uploads"
  ON department_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
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
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
    )
  );

CREATE POLICY "CEO and admins can update upload status"
  ON department_uploads FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );

-- Fix stg_finance_records table reference
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stg_finance_records') THEN
    -- Drop and recreate with correct FK
    ALTER TABLE stg_finance_records DROP CONSTRAINT IF EXISTS stg_finance_records_org_id_fkey;
    ALTER TABLE stg_finance_records DROP CONSTRAINT IF EXISTS stg_finance_records_uploaded_by_fkey;
    
    ALTER TABLE stg_finance_records 
      ADD CONSTRAINT stg_finance_records_org_id_fkey 
      FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE;
    
    ALTER TABLE stg_finance_records 
      ADD CONSTRAINT stg_finance_records_uploaded_by_fkey 
      FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix finance_records table reference
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_records') THEN
    ALTER TABLE finance_records DROP CONSTRAINT IF EXISTS finance_records_org_id_fkey;
    ALTER TABLE finance_records DROP CONSTRAINT IF EXISTS finance_records_uploaded_by_fkey;
    ALTER TABLE finance_records DROP CONSTRAINT IF EXISTS finance_records_approved_by_fkey;
    
    ALTER TABLE finance_records 
      ADD CONSTRAINT finance_records_org_id_fkey 
      FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE;
    
    ALTER TABLE finance_records 
      ADD CONSTRAINT finance_records_uploaded_by_fkey 
      FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;
      
    ALTER TABLE finance_records 
      ADD CONSTRAINT finance_records_approved_by_fkey 
      FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update upload_templates to include new departments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'upload_templates') THEN
    ALTER TABLE upload_templates DROP CONSTRAINT IF EXISTS upload_templates_department_check;
    ALTER TABLE upload_templates 
      ADD CONSTRAINT upload_templates_department_check 
      CHECK (department IN ('concierge', 'sales', 'sales-leads', 'sales-cancelations', 'operations', 'finance', 'saudemax'));
  END IF;
END $$;

-- Add trigger for updated_at
CREATE TRIGGER update_department_uploads_updated_at
  BEFORE UPDATE ON department_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
