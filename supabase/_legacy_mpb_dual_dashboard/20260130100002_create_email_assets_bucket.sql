/*
  # Create Email Assets Storage Bucket

  Creates storage bucket for email-related assets:
  - Signature logos
  - Inline images for emails
  - Temporary attachment storage

  Bucket paths:
  - signatures/{user_id}/{filename} - Signature logos
  - inline/{user_id}/{message_id}/{filename} - Inline images
  - attachments/{user_id}/{draft_id}/{filename} - Temporary attachments
*/

-- Create the email-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  false, -- Private bucket, access via signed URLs or RLS
  26214400, -- 25MB max file size (email attachment limit)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    -- Archives
    'application/zip',
    'application/x-zip-compressed'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets'
  AND (
    -- Signatures folder: signatures/{user_id}/...
    (storage.foldername(name))[1] = 'signatures'
    AND (storage.foldername(name))[2] = auth.uid()::text
  ) OR (
    -- Inline images folder: inline/{user_id}/...
    (storage.foldername(name))[1] = 'inline'
    AND (storage.foldername(name))[2] = auth.uid()::text
  ) OR (
    -- Attachments folder: attachments/{user_id}/...
    (storage.foldername(name))[1] = 'attachments'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Policy: Users can view their own assets
CREATE POLICY "Users can view own email assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'email-assets'
  AND (
    (storage.foldername(name))[1] IN ('signatures', 'inline', 'attachments')
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Policy: Users can update their own assets
CREATE POLICY "Users can update own email assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'email-assets'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'email-assets'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete own email assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-assets'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow public access to signature logos (for email rendering)
-- Signatures need to be publicly accessible when emails are sent
CREATE POLICY "Public can view signature logos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'email-assets'
  AND (storage.foldername(name))[1] = 'signatures'
);
