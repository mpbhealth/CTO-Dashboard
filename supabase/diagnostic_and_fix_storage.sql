-- =====================================================
-- DIAGNOSTIC AND FIX SCRIPT FOR CTOD STORAGE UPLOAD
-- Run this in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Check if bucket exists
SELECT '=== BUCKET CHECK ===' as section;
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
WHERE id IN ('ctod', 'ceod', 'shared');

-- STEP 2: Check current policies on storage.objects
SELECT '=== CURRENT STORAGE POLICIES ===' as section;
SELECT 
  policyname,
  cmd,
  roles::text,
  permissive,
  SUBSTRING(qual::text, 1, 200) as using_clause,
  SUBSTRING(with_check::text, 1, 200) as with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- STEP 3: Check if RLS is enabled on storage.objects
SELECT '=== RLS STATUS ===' as section;
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- =====================================================
-- FIX: Drop ALL storage policies and recreate clean ones
-- =====================================================

-- Drop ALL existing policies on storage.objects for our buckets
DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND (policyname LIKE '%ctod%' OR policyname LIKE '%ceod%' OR policyname LIKE '%shared%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
    RAISE NOTICE 'Dropped policy: %', pol_name;
  END LOOP;
END $$;

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('ctod', 'ctod', false, 52428800),
  ('ceod', 'ceod', false, 52428800),
  ('shared', 'shared', false, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Create SIMPLE policies that ONLY check bucket_id
-- No subqueries, no joins, no profile checks

-- CTOD INSERT
CREATE POLICY "ctod_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ctod');

-- CTOD SELECT
CREATE POLICY "ctod_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ctod');

-- CTOD UPDATE
CREATE POLICY "ctod_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ctod')
WITH CHECK (bucket_id = 'ctod');

-- CTOD DELETE
CREATE POLICY "ctod_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ctod');

-- CEOD INSERT
CREATE POLICY "ceod_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ceod');

-- CEOD SELECT
CREATE POLICY "ceod_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ceod');

-- CEOD UPDATE
CREATE POLICY "ceod_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ceod')
WITH CHECK (bucket_id = 'ceod');

-- CEOD DELETE
CREATE POLICY "ceod_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ceod');

-- SHARED INSERT
CREATE POLICY "shared_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared');

-- SHARED SELECT
CREATE POLICY "shared_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'shared');

-- SHARED UPDATE
CREATE POLICY "shared_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shared')
WITH CHECK (bucket_id = 'shared');

-- SHARED DELETE
CREATE POLICY "shared_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shared');

-- =====================================================
-- VERIFY: Check policies after fix
-- =====================================================

SELECT '=== POLICIES AFTER FIX ===' as section;
SELECT 
  policyname,
  cmd,
  roles::text,
  permissive
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND (policyname LIKE '%ctod%' OR policyname LIKE '%ceod%' OR policyname LIKE '%shared%')
ORDER BY policyname;

SELECT '=== DONE ===' as section;
SELECT 'Storage policies have been reset. Try uploading a file now.' as message;
