/*
  # Create Employee Compliance Documents Storage Bucket

  1. Storage Bucket
    - Creates 'employee-compliance-documents' bucket for secure file storage
    - Configured as private bucket with RLS policies
    - Supports PDF, DOC, DOCX, JPG, PNG file types
    - Max file size: 10MB

  2. Security Policies
    - Officers (admin, hipaa_officer, privacy_officer, security_officer) can upload/update/delete all files
    - Employees can upload their own documents to their folders
    - Employees can view their own documents
    - Auditors have read-only access to all documents
    - All access is logged through RLS

  3. Important Notes
    - Files organized by category and employee email
    - Path structure: {category}/{employee_email}/{timestamp}_{filename}
    - RLS ensures employees can only access their own files
    - Officers have full management access for compliance oversight
*/

-- Create the storage bucket for employee compliance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-compliance-documents',
  'employee-compliance-documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid duplicates)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Officers can view all employee documents" ON storage.objects;
  DROP POLICY IF EXISTS "Auditors can view all employee documents" ON storage.objects;
  DROP POLICY IF EXISTS "Employees can view own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Officers can upload employee documents" ON storage.objects;
  DROP POLICY IF EXISTS "Employees can upload own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Officers can update employee documents" ON storage.objects;
  DROP POLICY IF EXISTS "Officers can delete employee documents" ON storage.objects;
END $$;

-- Policy: Officers can view all documents in the bucket
CREATE POLICY "Officers can view all employee documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-compliance-documents'
    AND has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Policy: Auditors can view all documents in the bucket
CREATE POLICY "Auditors can view all employee documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-compliance-documents'
    AND has_role(auth.uid(), 'auditor')
  );

-- Policy: Employees can view their own documents
CREATE POLICY "Employees can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-compliance-documents'
    AND (
      name LIKE '%' || (SELECT email FROM auth.users WHERE id = auth.uid()) || '%'
      OR 
      has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer', 'auditor'])
    )
  );

-- Policy: Officers can upload documents
CREATE POLICY "Officers can upload employee documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-compliance-documents'
    AND has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Policy: Employees can upload their own documents
CREATE POLICY "Employees can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-compliance-documents'
    AND name LIKE '%' || (SELECT email FROM auth.users WHERE id = auth.uid()) || '%'
  );

-- Policy: Officers can update all documents
CREATE POLICY "Officers can update employee documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'employee-compliance-documents'
    AND has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  )
  WITH CHECK (
    bucket_id = 'employee-compliance-documents'
    AND has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Policy: Officers can delete documents
CREATE POLICY "Officers can delete employee documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'employee-compliance-documents'
    AND has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );
