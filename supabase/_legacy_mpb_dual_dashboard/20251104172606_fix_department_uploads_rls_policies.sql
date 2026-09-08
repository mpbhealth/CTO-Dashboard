/*
  # Fix Department Uploads RLS Policies

  ## Overview
  Fixes the RLS policies on department_uploads table to correctly reference
  the profiles table. The policies were checking profiles.user_id but should
  check profiles.id since that's the primary key linked to auth.uid().

  ## Changes
  1. Drop existing policies
  2. Recreate policies with correct column references
  3. Ensure CEO users can view upload history

  ## Security
  - Users can view their own uploads
  - CEO/CTO/Admin users can view all uploads in their org
  - Only authenticated users can create uploads
*/

-- Drop existing policies
DROP POLICY IF EXISTS "CEO, CTO and admins can view all uploads" ON department_uploads;
DROP POLICY IF EXISTS "Users can view their own uploads" ON department_uploads;
DROP POLICY IF EXISTS "CEO and admins can update upload status" ON department_uploads;
DROP POLICY IF EXISTS "Authenticated users can create uploads" ON department_uploads;

-- Recreate policies with correct references
CREATE POLICY "Users can view their own uploads"
  ON department_uploads FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "CEO, CTO and admins can view all uploads"
  ON department_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );

CREATE POLICY "Authenticated users can create uploads"
  ON department_uploads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "CEO and admins can update upload status"
  ON department_uploads FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_uploads.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );
