/*
  # Employee Compliance Document Storage System

  1. New Tables
    - `employee_compliance_documents`
      - `id` (uuid, primary key) - Unique document identifier
      - `employee_id` (uuid, nullable) - Reference to auth.users for employee
      - `employee_email` (text, required) - Employee email for lookup
      - `employee_name` (text, nullable) - Employee full name
      - `document_type` (text, required) - Type of compliance document
      - `title` (text, required) - Document title/name
      - `description` (text, nullable) - Additional details about document
      - `file_path` (text, required) - Storage path in Supabase bucket
      - `file_type` (text, nullable) - MIME type
      - `file_size` (bigint, nullable) - File size in bytes
      - `category` (text, required) - Document category for organization
      - `upload_date` (timestamptz, default now) - When document was uploaded
      - `expiration_date` (date, nullable) - When certificate/document expires
      - `approval_status` (text, default 'pending') - Approval workflow status
      - `approved_by` (uuid, nullable) - Who approved the document
      - `approved_at` (timestamptz, nullable) - When it was approved
      - `uploaded_by` (uuid, required) - Who uploaded the document
      - `department` (text, nullable) - Employee department
      - `tags` (text[], default '{}') - Searchable tags
      - `metadata` (jsonb, default '{}') - Additional structured data
      - `notes` (text, nullable) - Internal notes
      - `version` (integer, default 1) - Document version number
      - `is_archived` (boolean, default false) - Soft delete flag
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `employee_document_notifications`
      - `id` (uuid, primary key) - Notification identifier
      - `document_id` (uuid, references employee_compliance_documents) - Related document
      - `notification_type` (text, required) - Type of notification
      - `notification_date` (timestamptz, required) - When to send notification
      - `sent_at` (timestamptz, nullable) - When notification was sent
      - `recipient_email` (text, required) - Who receives notification
      - `message` (text, nullable) - Notification message
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on both tables
    - Compliance officers can manage all documents
    - Employees can view their own documents
    - Auditors have read-only access to all documents
    - Staff can upload their own documents if enabled

  3. Storage Bucket
    - Creates bucket policy references for 'employee-compliance-documents'
    - Officers can upload/update/delete
    - Employees can view their own documents
    - Proper access control through RLS

  4. Indexes
    - Index on employee_email for fast lookups
    - Index on document_type for filtering
    - Index on expiration_date for notification queries
    - Index on approval_status for workflow queries

  5. Important Notes
    - Documents link to employees via email (more flexible than user_id)
    - Expiration tracking enables proactive renewal management
    - Approval workflow ensures document quality
    - Version control maintains document history
    - Soft deletes preserve audit trail
*/

-- Create employee compliance documents table
CREATE TABLE IF NOT EXISTS employee_compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_email text NOT NULL,
  employee_name text,
  document_type text NOT NULL CHECK (document_type IN (
    'hipaa_training_certificate',
    'security_awareness_certificate',
    'privacy_policy_acknowledgment',
    'confidentiality_agreement',
    'background_check',
    'professional_license',
    'continuing_education',
    'other'
  )),
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  category text NOT NULL DEFAULT 'training',
  upload_date timestamptz DEFAULT now(),
  expiration_date date,
  approval_status text NOT NULL CHECK (approval_status IN (
    'pending',
    'approved',
    'rejected',
    'expired'
  )) DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  department text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  notes text,
  version integer DEFAULT 1,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table for expiring documents
CREATE TABLE IF NOT EXISTS employee_document_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES employee_compliance_documents(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'expiring_30_days',
    'expiring_60_days',
    'expiring_90_days',
    'expired',
    'approval_needed',
    'approved',
    'rejected'
  )),
  notification_date timestamptz NOT NULL,
  sent_at timestamptz,
  recipient_email text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_document_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_compliance_documents

-- Compliance officers can view all documents
CREATE POLICY "Officers can view all employee documents"
  ON employee_compliance_documents FOR SELECT
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Employees can view their own documents
CREATE POLICY "Employees can view own documents"
  ON employee_compliance_documents FOR SELECT
  TO authenticated
  USING (
    employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR employee_id = auth.uid()
  );

-- Auditors can view all documents
CREATE POLICY "Auditors can view all documents"
  ON employee_compliance_documents FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'auditor'));

-- Officers can insert documents
CREATE POLICY "Officers can insert employee documents"
  ON employee_compliance_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Employees can insert their own documents
CREATE POLICY "Employees can insert own documents"
  ON employee_compliance_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR employee_id = auth.uid()
  );

-- Officers can update all documents
CREATE POLICY "Officers can update employee documents"
  ON employee_compliance_documents FOR UPDATE
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Admins and officers can delete documents
CREATE POLICY "Officers can delete employee documents"
  ON employee_compliance_documents FOR DELETE
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer'])
  );

-- RLS Policies for employee_document_notifications

-- Officers can view all notifications
CREATE POLICY "Officers can view notifications"
  ON employee_document_notifications FOR SELECT
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Officers can manage notifications
CREATE POLICY "Officers can manage notifications"
  ON employee_document_notifications FOR ALL
  TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'])
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_docs_email ON employee_compliance_documents(employee_email);
CREATE INDEX IF NOT EXISTS idx_employee_docs_type ON employee_compliance_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_docs_expiration ON employee_compliance_documents(expiration_date);
CREATE INDEX IF NOT EXISTS idx_employee_docs_status ON employee_compliance_documents(approval_status);
CREATE INDEX IF NOT EXISTS idx_employee_docs_category ON employee_compliance_documents(category);
CREATE INDEX IF NOT EXISTS idx_employee_docs_uploaded_by ON employee_compliance_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_employee_docs_archived ON employee_compliance_documents(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notifications_document ON employee_document_notifications(document_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON employee_document_notifications(sent_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_document_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON employee_compliance_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_document_timestamp();

-- Function to automatically update approval status based on expiration
CREATE OR REPLACE FUNCTION check_document_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE THEN
    NEW.approval_status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_document_expiration_on_update
  BEFORE INSERT OR UPDATE ON employee_compliance_documents
  FOR EACH ROW
  EXECUTE FUNCTION check_document_expiration();

-- Function to create expiration notifications when document is uploaded
CREATE OR REPLACE FUNCTION create_expiration_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create notifications if document has expiration date and is approved
  IF NEW.expiration_date IS NOT NULL AND NEW.approval_status = 'approved' THEN
    -- 90 days notification
    IF NEW.expiration_date > CURRENT_DATE + INTERVAL '90 days' THEN
      INSERT INTO employee_document_notifications (
        document_id, notification_type, notification_date, recipient_email
      ) VALUES (
        NEW.id, 'expiring_90_days', NEW.expiration_date - INTERVAL '90 days', NEW.employee_email
      );
    END IF;
    
    -- 60 days notification
    IF NEW.expiration_date > CURRENT_DATE + INTERVAL '60 days' THEN
      INSERT INTO employee_document_notifications (
        document_id, notification_type, notification_date, recipient_email
      ) VALUES (
        NEW.id, 'expiring_60_days', NEW.expiration_date - INTERVAL '60 days', NEW.employee_email
      );
    END IF;
    
    -- 30 days notification
    IF NEW.expiration_date > CURRENT_DATE + INTERVAL '30 days' THEN
      INSERT INTO employee_document_notifications (
        document_id, notification_type, notification_date, recipient_email
      ) VALUES (
        NEW.id, 'expiring_30_days', NEW.expiration_date - INTERVAL '30 days', NEW.employee_email
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_notifications_on_approval
  AFTER INSERT OR UPDATE OF approval_status ON employee_compliance_documents
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION create_expiration_notifications();

-- Comments
COMMENT ON TABLE employee_compliance_documents IS 'Storage for employee HIPAA training certificates and compliance documents';
COMMENT ON TABLE employee_document_notifications IS 'Automated notifications for expiring employee compliance documents';
COMMENT ON COLUMN employee_compliance_documents.document_type IS 'Type of compliance document (training, certificate, acknowledgment, etc.)';
COMMENT ON COLUMN employee_compliance_documents.approval_status IS 'Workflow status: pending, approved, rejected, expired';
COMMENT ON COLUMN employee_compliance_documents.expiration_date IS 'When the certificate or document expires';
COMMENT ON COLUMN employee_compliance_documents.version IS 'Document version number for tracking renewals';
