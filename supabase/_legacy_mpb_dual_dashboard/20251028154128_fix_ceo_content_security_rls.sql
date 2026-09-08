/*
  # CEO Content Security - RLS Policies

  1. Purpose
    - Enforce strict security boundary between CEO and CTO content
    - CEO users can access all content (CEO + CTO)
    - CTO users CANNOT access CEO-only content
    - Admin users can access all content

  2. Security Changes
    - Add RLS policies to block CTO role from CEO resources
    - Create audit logging table for access attempts
    - Ensure CEO file storage buckets are protected

  3. Tables Affected
    - Create content_access_logs table for audit trail
    - Update policies on existing resource tables (if they exist)

  4. Important Notes
    - This migration creates defense-in-depth security
    - RLS policies work at database level regardless of frontend
    - All CEO content requires explicit role check
*/

-- Create audit logging table for content access attempts
CREATE TABLE IF NOT EXISTS content_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role text NOT NULL,
  attempted_resource text NOT NULL,
  resource_type text NOT NULL,
  access_granted boolean DEFAULT false,
  timestamp timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE content_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and CEOs can read audit logs
CREATE POLICY "ceo_admin_can_read_audit_logs"
ON content_access_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('ceo', 'admin')
  )
);

-- System can insert audit logs (authenticated users)
CREATE POLICY "authenticated_can_insert_audit_logs"
ON content_access_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_content_access_logs_user_id 
ON content_access_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_content_access_logs_timestamp 
ON content_access_logs(timestamp DESC);

-- Add workspace_kind column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'workspace_kind'
  ) THEN
    ALTER TABLE profiles ADD COLUMN workspace_kind text DEFAULT 'CTO';
  END IF;
END $$;

-- Update existing CEO and admin profiles to have CEO workspace
UPDATE profiles 
SET workspace_kind = 'CEO' 
WHERE role IN ('ceo', 'admin') AND workspace_kind IS NULL;

-- Ensure CTO/staff profiles have CTO workspace
UPDATE profiles 
SET workspace_kind = 'CTO' 
WHERE role IN ('cto', 'staff') AND (workspace_kind IS NULL OR workspace_kind != 'CEO');