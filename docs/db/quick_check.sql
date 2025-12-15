-- QUICK DATABASE HEALTH CHECK
-- Run this in Supabase SQL Editor

-- 1. Check notes table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notes' 
ORDER BY ordinal_position;

-- 2. Check quick_links table columns (should have 'name' not 'title')
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quick_links' 
ORDER BY ordinal_position;

-- 3. Check if required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notes', 'note_shares', 'note_notifications', 'profiles', 'quick_links')
ORDER BY table_name;

-- 4. Check RLS policies count per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notes', 'note_shares', 'note_notifications', 'quick_links')
GROUP BY tablename
ORDER BY tablename;

