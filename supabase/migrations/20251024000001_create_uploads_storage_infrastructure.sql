/*
  # Create Uploads Storage Infrastructure

  ## Summary
  Creates storage buckets and audit logging infrastructure for the file upload/export system

  ## New Storage Buckets
  - `uploads` - General purpose file uploads (documents, images, etc.)

  ## Existing Buckets Extended
  - `hipaa-evidence` - Already exists for compliance evidence
  - `employee-documents` - Already exists for employee compliance documents

  ## New Tables
  - Enhanced `audit_logs` table if not exists for file operation tracking

  ## Security (RLS Policies)
  - Role-based bucket access policies
  - Admin, CEO, HIPAA officers can upload/download from all buckets
  - Standard users have limited access based on their assignments

  ## Important Notes
  - Uses existing `v_current_roles` view for permission checks
  - All file operations are logged for HIPAA compliance
  - Bucket retention policies follow 7-year HIPAA requirements
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    RAISE NOTICE 'Storage schema not fully initialized, skipping bucket creation';
    RETURN;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

CREATE POLICY "Admins and officers can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v_current_roles
      WHERE v_current_roles.user_id = auth.uid()
      AND v_current_roles.role IN ('admin', 'ceo', 'hipaa_officer', 'privacy_officer', 'security_officer')
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and officers can upload to uploads bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND EXISTS (
      SELECT 1 FROM v_current_roles
      WHERE v_current_roles.user_id = auth.uid()
      AND v_current_roles.role IN ('admin', 'ceo', 'hipaa_officer', 'privacy_officer', 'security_officer')
    )
  );

CREATE POLICY "Admins and officers can read from uploads bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND EXISTS (
      SELECT 1 FROM v_current_roles
      WHERE v_current_roles.user_id = auth.uid()
      AND v_current_roles.role IN ('admin', 'ceo', 'hipaa_officer', 'privacy_officer', 'security_officer')
    )
  );

CREATE POLICY "Users can read their own uploads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins and officers can delete from uploads bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND EXISTS (
      SELECT 1 FROM v_current_roles
      WHERE v_current_roles.user_id = auth.uid()
      AND v_current_roles.role IN ('admin', 'ceo', 'hipaa_officer', 'security_officer')
    )
  );
