-- ============================================================================
-- MPB Health Dashboard - Database Health Check
-- Run this script in Supabase SQL Editor to diagnose issues
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLES WITHOUT RLS ENABLED
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  'RLS DISABLED' as issue
FROM pg_tables t
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = t.tablename 
      AND n.nspname = t.schemaname
      AND c.relrowsecurity = true
  )
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK TABLES WITH ZERO POLICIES
-- ============================================================================
SELECT 
  t.tablename,
  COALESCE(policy_count, 0) as policy_count,
  CASE WHEN COALESCE(policy_count, 0) = 0 THEN 'NO POLICIES' ELSE 'OK' END as status
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND COALESCE(policy_count, 0) = 0
ORDER BY t.tablename;

-- ============================================================================
-- 3. CHECK FOR POLICIES REFERENCING user_metadata (ANTI-PATTERN)
-- ============================================================================
SELECT 
  policyname,
  tablename,
  qual as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ILIKE '%user_metadata%' OR qual ILIKE '%raw_user_meta%')
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. CHECK NOTES TABLE SCHEMA
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notes'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. CHECK QUICK_LINKS TABLE SCHEMA
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'quick_links'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. CHECK PROFILES TABLE SCHEMA
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 7. CHECK FOR MISSING FOREIGN KEY INDEXES
-- ============================================================================
WITH fk_columns AS (
  SELECT
    tc.table_name,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
),
indexed_columns AS (
  SELECT
    t.relname as table_name,
    a.attname as column_name
  FROM pg_class t
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_index ix ON ix.indrelid = t.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE n.nspname = 'public'
)
SELECT 
  fk.table_name,
  fk.column_name,
  'MISSING INDEX ON FK' as issue
FROM fk_columns fk
LEFT JOIN indexed_columns ic 
  ON fk.table_name = ic.table_name 
  AND fk.column_name = ic.column_name
WHERE ic.column_name IS NULL
ORDER BY fk.table_name, fk.column_name;

-- ============================================================================
-- 8. CHECK NOTES-RELATED TABLES EXIST
-- ============================================================================
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('notes', 'note_shares', 'note_notifications') THEN 'REQUIRED'
    ELSE 'OPTIONAL'
  END as importance,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notes', 'note_shares', 'note_notifications')
ORDER BY table_name;

-- ============================================================================
-- 9. CHECK RLS POLICIES ON NOTES TABLE
-- ============================================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || LEFT(qual, 100) || CASE WHEN LENGTH(qual) > 100 THEN '...' ELSE '' END
    ELSE 'NO USING CLAUSE'
  END as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notes'
ORDER BY policyname;

-- ============================================================================
-- 10. CHECK OUTLOOK_CONFIG TABLE EXISTS (for Edge Function)
-- ============================================================================
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'outlook_config';

-- ============================================================================
-- 11. COUNT ROWS IN KEY TABLES
-- ============================================================================
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'quick_links', COUNT(*) FROM quick_links
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
ORDER BY table_name;

-- ============================================================================
-- 12. CHECK FUNCTIONS EXIST
-- ============================================================================
SELECT 
  proname as function_name,
  'EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('share_note_with_role', 'handle_new_user')
ORDER BY proname;

