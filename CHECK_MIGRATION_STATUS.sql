-- ============================================
-- Quick Check: Has Note Sharing Migration Been Applied?
-- ============================================

-- Check 1: Does owner_role column exist in notes table?
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'notes' AND column_name = 'owner_role'
    )
    THEN '✅ owner_role column EXISTS - Migration applied!'
    ELSE '❌ owner_role column MISSING - Migration NOT applied!'
  END as owner_role_status;

-- Check 2: Does note_shares table exist?
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'note_shares'
    )
    THEN '✅ note_shares table EXISTS - Migration applied!'
    ELSE '❌ note_shares table MISSING - Migration NOT applied!'
  END as note_shares_status;

-- Check 3: Does note_notifications table exist?
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'note_notifications'
    )
    THEN '✅ note_notifications table EXISTS - Migration applied!'
    ELSE '❌ note_notifications table MISSING - Migration NOT applied!'
  END as note_notifications_status;

-- Check 4: List ALL columns in notes table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;

-- ============================================
-- HOW TO USE THIS CHECK:
-- ============================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Look for ❌ marks = migration not applied
-- 5. Look for ✅ marks = migration was applied
-- ============================================
