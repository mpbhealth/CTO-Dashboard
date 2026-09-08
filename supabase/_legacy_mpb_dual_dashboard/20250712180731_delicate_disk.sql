/*
  # Add file upload support to policy documents
  
  1. New Fields
    - Adds file_metadata for tracking uploaded files
    - Adds share_history for tracking policy sharing
    
  2. Security
    - Updates RLS policies to accommodate new fields
*/

-- Enhance policy_documents table with file metadata support
ALTER TABLE policy_documents 
ADD COLUMN IF NOT EXISTS file_metadata jsonb DEFAULT '[]'::jsonb;

-- Create policy_file_uploads table to track uploaded files
CREATE TABLE IF NOT EXISTS policy_file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policy_documents(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Create policy_share_history table
CREATE TABLE IF NOT EXISTS policy_share_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policy_documents(id) ON DELETE CASCADE,
  shared_by uuid REFERENCES auth.users(id),
  shared_at timestamptz DEFAULT now(),
  recipients jsonb NOT NULL,
  message text,
  share_method text NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE policy_file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_share_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for file uploads
CREATE POLICY "Users can view all policy file uploads"
  ON policy_file_uploads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload files to policies they created"
  ON policy_file_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM policy_documents
      WHERE id = policy_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own uploads"
  ON policy_file_uploads
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Add RLS policies for share history
CREATE POLICY "Users can view share history for policies"
  ON policy_share_history
  FOR SELECT
  TO authenticated
  USING (
    shared_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM policy_documents
      WHERE id = policy_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create share records"
  ON policy_share_history
  FOR INSERT
  TO authenticated
  WITH CHECK (shared_by = auth.uid());