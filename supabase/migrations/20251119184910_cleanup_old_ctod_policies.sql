/*
  # Cleanup Old Conflicting CTOD Storage Policies

  ## Issue
  - Previous migration created new simplified policies
  - But some old restrictive policies from other migrations still exist
  - These can conflict and cause unpredictable behavior

  ## Solution
  - Drop all old restrictive CTOD policies
  - Keep only the new simplified authenticated policies
*/

-- Drop old restrictive policies that may have been created by other migrations
DROP POLICY IF EXISTS "ctod_upload_with_resource" ON storage.objects;
DROP POLICY IF EXISTS "ctod_select_with_resource" ON storage.objects;
DROP POLICY IF EXISTS "ctod_delete_owner" ON storage.objects;

-- Verify: Only the new _authenticated policies should remain for ctod bucket