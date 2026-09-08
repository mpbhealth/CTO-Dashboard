/*
  # Create Policy Documents Table with Complete Schema

  1. New Table
    - policy_documents: Complete policy and document management system
      - All fields from the TypeScript interface including:
        - effective_date, compliance_status, is_mandatory
        - approval_workflow, notification_settings

  2. Security
    - Enable RLS on policy_documents table
    - SELECT: All authenticated users can read
    - INSERT: Admins (role_id 1) can create
    - UPDATE: Admins can update, creators can update their own
    - DELETE: Only admins can delete

  3. Indexes
    - Performance indexes for common queries

  Note: Using role_id integer (1=admin, 2=hipaa_officer, etc.) based on roles table
*/

-- Create policy_documents table
CREATE TABLE IF NOT EXISTS policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text CHECK (document_type IN ('policy', 'sop', 'handbook', 'procedure', 'guideline')),
  content text,
  file_url text,
  version text DEFAULT '1.0',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  review_date date,
  effective_date date,
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approval_workflow jsonb,
  notification_settings jsonb,
  compliance_status text CHECK (compliance_status IN ('compliant', 'non_compliant', 'needs_review')),
  is_mandatory boolean DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_documents_department_id ON policy_documents(department_id);
CREATE INDEX IF NOT EXISTS idx_policy_documents_status ON policy_documents(status);
CREATE INDEX IF NOT EXISTS idx_policy_documents_document_type ON policy_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_policy_documents_created_by ON policy_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_policy_documents_updated_at ON policy_documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_documents_compliance_status ON policy_documents(compliance_status);

-- Enable Row Level Security
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: policy_documents (SELECT)
-- =====================================================

CREATE POLICY "All authenticated users can read policies"
  ON policy_documents FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- RLS POLICIES: policy_documents (INSERT)
-- =====================================================

CREATE POLICY "Admins can insert policies"
  ON policy_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
  );

-- =====================================================
-- RLS POLICIES: policy_documents (UPDATE)
-- =====================================================

CREATE POLICY "Admins can update any policy"
  ON policy_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
  );

CREATE POLICY "Policy creators can update their own policies"
  ON policy_documents FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- RLS POLICIES: policy_documents (DELETE)
-- =====================================================

CREATE POLICY "Only admins can delete policies"
  ON policy_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
  );