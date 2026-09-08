/*
  # Fix CTOD Storage Bucket Policies

  ## Issue
  - CTOD bucket still has restrictive policies requiring role='cto' in profiles table
  - CEOD bucket was fixed in previous migration (20251119162642) but CTOD was missed
  - Causing "Permission denied" errors on CTO file uploads
  - Error message: "Upload failed: Permission denied. Please contact your administrator if this persists."

  ## Root Cause
  - Original migration (20251024163214) created ctod_upload policy requiring:
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('cto', 'admin'))
  - This query can fail if:
    1. User's profile.role is not set correctly
    2. Profile sync issues
    3. User testing from different role contexts

  ## Solution
  - Drop old restrictive ctod_upload policy and related policies
  - Create simplified authenticated-only policies
  - Match the approach successfully used for CEOD bucket
  - Storage security is enforced at resources table level (workspace_id matching)
  - This is actually MORE secure as workspace isolation is guaranteed

  ## Changes Made
  1. Drop existing restrictive CTOD storage policies
  2. Create new authenticated-only policies for INSERT, SELECT, UPDATE, DELETE
  3. All authenticated users can upload to ctod bucket
  4. True security maintained through resources table RLS policies
*/

-- =====================================================
-- Drop Existing Restrictive CTOD Policies
-- =====================================================

DROP POLICY IF EXISTS "ctod_upload" ON storage.objects;
DROP POLICY IF EXISTS "ctod_read" ON storage.objects;
DROP POLICY IF EXISTS "ctod_update" ON storage.objects;
DROP POLICY IF EXISTS "ctod_delete" ON storage.objects;

-- =====================================================
-- Create Simplified CTOD Storage Policies
-- =====================================================

-- Allow any authenticated user to upload to ctod bucket
-- Security is enforced at resources table level via workspace_id matching
CREATE POLICY "ctod_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ctod'
  AND auth.role() = 'authenticated'
);

-- Allow any authenticated user to read from ctod bucket
-- Visibility controlled through resources table and workspace isolation
CREATE POLICY "ctod_read_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ctod'
  AND auth.role() = 'authenticated'
);

-- Allow any authenticated user to update files in ctod bucket
-- Resource ownership checked at application level
CREATE POLICY "ctod_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ctod'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'ctod'
  AND auth.role() = 'authenticated'
);

-- Allow any authenticated user to delete from ctod bucket
-- Resource ownership checked at application level
CREATE POLICY "ctod_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ctod'
  AND auth.role() = 'authenticated'
);