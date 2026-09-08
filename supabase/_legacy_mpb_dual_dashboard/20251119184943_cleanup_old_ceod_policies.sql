/*
  # Cleanup Old Conflicting CEOD Storage Policies

  ## Issue
  - Multiple CEOD policies exist from different migrations
  - Old policies (ceod_delete, ceod_update, ceod_delete_owner) may conflict
  - Need consistency between CTOD and CEOD buckets

  ## Solution
  - Drop old restrictive CEOD policies
  - Keep only the new simplified _authenticated policies
  - Ensures both buckets have consistent policy structure
*/

-- Drop old restrictive policies that may have been created by other migrations
DROP POLICY IF EXISTS "ceod_delete" ON storage.objects;
DROP POLICY IF EXISTS "ceod_update" ON storage.objects;
DROP POLICY IF EXISTS "ceod_delete_owner" ON storage.objects;

-- Verify: Only the new _authenticated policies should remain for ceod bucket