/*
  # Create Storage Infrastructure for Dual Dashboard
  
  1. Storage Buckets
    - `ctod` - CTO workspace files
    - `ceod` - CEO workspace files
    - `shared` - Shared org files
  
  2. Storage Policies
    - Path-based access control matching workspace rules
    - RLS enforcement via resource metadata
    - Signed URL generation support
  
  3. Important Notes
    - All buckets are private by default
    - Access controlled via Storage policies that check resources table
    - Folder structure: {bucket}/{workspace_id}/{yyyy-mm}/{filename}
*/

-- Insert storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ctod', 'ctod', false, 52428800, NULL),
  ('ceod', 'ceod', false, 52428800, NULL),
  ('shared', 'shared', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- CTO bucket: CTOs, admins, and users with resource grants can upload
DROP POLICY IF EXISTS "ctod_upload" ON storage.objects;
CREATE POLICY "ctod_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ctod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('cto', 'admin')
  )
);

-- CTO bucket: read access via resource visibility
DROP POLICY IF EXISTS "ctod_read" ON storage.objects;
CREATE POLICY "ctod_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ctod'
  AND (
    -- CTOs and admins can read all
    EXISTS (
      SELECT 1 FROM profiles me
      WHERE me.user_id = auth.uid()
        AND me.role IN ('cto', 'admin')
    )
    -- Others read via resource grants
    OR EXISTS (
      SELECT 1 FROM files f
      JOIN resources r ON r.id = f.resource_id
      WHERE f.storage_key = storage.objects.name
        AND (
          r.created_by = auth.uid()
          OR r.visibility IN ('org_public', 'shared_to_ceo')
          OR EXISTS (
            SELECT 1 FROM resource_acl acl
            WHERE acl.resource_id = r.id
              AND acl.grantee_profile_id = auth.uid()
              AND acl.can_read = true
          )
        )
    )
  )
);

-- CTO bucket: update/delete by owner
DROP POLICY IF EXISTS "ctod_update" ON storage.objects;
CREATE POLICY "ctod_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ctod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('cto', 'admin')
  )
);

DROP POLICY IF EXISTS "ctod_delete" ON storage.objects;
CREATE POLICY "ctod_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ctod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('cto', 'admin')
  )
);

-- CEO bucket: CEOs, admins, and users with resource grants can upload
DROP POLICY IF EXISTS "ceod_upload" ON storage.objects;
CREATE POLICY "ceod_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ceod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('ceo', 'admin')
  )
);

-- CEO bucket: read access via resource visibility
DROP POLICY IF EXISTS "ceod_read" ON storage.objects;
CREATE POLICY "ceod_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ceod'
  AND (
    -- CEOs and admins can read all
    EXISTS (
      SELECT 1 FROM profiles me
      WHERE me.user_id = auth.uid()
        AND me.role IN ('ceo', 'admin')
    )
    -- Others read via resource grants
    OR EXISTS (
      SELECT 1 FROM files f
      JOIN resources r ON r.id = f.resource_id
      WHERE f.storage_key = storage.objects.name
        AND (
          r.created_by = auth.uid()
          OR r.visibility IN ('org_public', 'shared_to_cto')
          OR EXISTS (
            SELECT 1 FROM resource_acl acl
            WHERE acl.resource_id = r.id
              AND acl.grantee_profile_id = auth.uid()
              AND acl.can_read = true
          )
        )
    )
  )
);

-- CEO bucket: update/delete by owner
DROP POLICY IF EXISTS "ceod_update" ON storage.objects;
CREATE POLICY "ceod_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ceod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('ceo', 'admin')
  )
);

DROP POLICY IF EXISTS "ceod_delete" ON storage.objects;
CREATE POLICY "ceod_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ceod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('ceo', 'admin')
  )
);

-- Shared bucket: all org members can upload
DROP POLICY IF EXISTS "shared_upload" ON storage.objects;
CREATE POLICY "shared_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shared'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
  )
);

-- Shared bucket: read by org members with resource visibility
DROP POLICY IF EXISTS "shared_read" ON storage.objects;
CREATE POLICY "shared_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'shared'
  AND EXISTS (
    SELECT 1 FROM files f
    JOIN resources r ON r.id = f.resource_id
    JOIN profiles me ON me.user_id = auth.uid()
    WHERE f.storage_key = storage.objects.name
      AND me.org_id = r.org_id
      AND (
        r.created_by = auth.uid()
        OR r.visibility = 'org_public'
        OR EXISTS (
          SELECT 1 FROM resource_acl acl
          WHERE acl.resource_id = r.id
            AND acl.grantee_profile_id = auth.uid()
            AND acl.can_read = true
        )
      )
  )
);

-- Shared bucket: update/delete by resource owner
DROP POLICY IF EXISTS "shared_update" ON storage.objects;
CREATE POLICY "shared_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shared'
  AND EXISTS (
    SELECT 1 FROM files f
    JOIN resources r ON r.id = f.resource_id
    WHERE f.storage_key = storage.objects.name
      AND r.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "shared_delete" ON storage.objects;
CREATE POLICY "shared_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shared'
  AND EXISTS (
    SELECT 1 FROM files f
    JOIN resources r ON r.id = f.resource_id
    WHERE f.storage_key = storage.objects.name
      AND r.created_by = auth.uid()
  )
);