/*
  Force cleanup of ALL storage policies for ctod, ceod, shared buckets.
  This migration drops ANY policy that contains these bucket names and recreates clean ones.
*/

-- Drop ALL existing policies dynamically (catches any naming convention)
DO $$
DECLARE
  pol_name text;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND (
      policyname ILIKE '%ctod%' OR
      policyname ILIKE '%ceod%' OR
      policyname ILIKE '%shared%'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
  END LOOP;
END $$;

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('ctod', 'ctod', false, 52428800),
  ('ceod', 'ceod', false, 52428800),
  ('shared', 'shared', false, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- Create simple authenticated-only policies for CTOD
CREATE POLICY "ctod_auth_insert_v2" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ctod');
CREATE POLICY "ctod_auth_select_v2" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ctod');
CREATE POLICY "ctod_auth_update_v2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ctod') WITH CHECK (bucket_id = 'ctod');
CREATE POLICY "ctod_auth_delete_v2" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ctod');

-- Create simple authenticated-only policies for CEOD
CREATE POLICY "ceod_auth_insert_v2" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ceod');
CREATE POLICY "ceod_auth_select_v2" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ceod');
CREATE POLICY "ceod_auth_update_v2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ceod') WITH CHECK (bucket_id = 'ceod');
CREATE POLICY "ceod_auth_delete_v2" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ceod');

-- Create simple authenticated-only policies for SHARED
CREATE POLICY "shared_auth_insert_v2" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shared');
CREATE POLICY "shared_auth_select_v2" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shared');
CREATE POLICY "shared_auth_update_v2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shared') WITH CHECK (bucket_id = 'shared');
CREATE POLICY "shared_auth_delete_v2" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shared');
