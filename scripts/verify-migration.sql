-- ============================================
-- MIGRATION VERIFICATION SCRIPT
-- Run this in SQL Editor after migrations
-- ============================================

-- Check all expected tables exist
SELECT 
    'TABLES CHECK' as check_type,
    COUNT(*) as total_tables,
    COUNT(CASE WHEN table_name IN (
        'users', 'team_members', 'projects', 'assignments', 'kpi_data',
        'departments', 'employee_profiles', 'quick_links',
        'policy_documents', 'policy_acknowledgments', 'policy_reviews',
        'hipaa_audits', 'hipaa_gap_analysis', 'hipaa_risk_items',
        'hipaa_baa_registry', 'hipaa_training_completions',
        'hipaa_incident_log', 'hipaa_evidence',
        'technologies', 'saas_expenses', 'enrollment_data',
        'api_metrics', 'api_errors', 'api_incidents'
    ) THEN 1 END) as expected_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- List all tables
SELECT 
    '---' as separator,
    'ALL TABLES' as info,
    '---' as separator2;

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check Row Level Security is enabled
SELECT 
    '---' as separator,
    'RLS STATUS' as info,
    '---' as separator2;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check foreign keys
SELECT 
    '---' as separator,
    'FOREIGN KEYS' as info,
    '---' as separator2;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check extensions
SELECT 
    '---' as separator,
    'EXTENSIONS' as info,
    '---' as separator2;

SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_audit', 'pg_stat_statements')
ORDER BY extname;

-- Check policies
SELECT 
    '---' as separator,
    'RLS POLICIES' as info,
    '---' as separator2;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Summary
SELECT 
    '---' as separator,
    'SUMMARY' as info,
    '---' as separator2;

SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Tables with RLS Enabled' as metric,
    COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
    'Total Foreign Keys' as metric,
    COUNT(*)::text as value
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
UNION ALL
SELECT 
    'Total RLS Policies' as metric,
    COUNT(*)::text as value
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
-- Expected Results:
-- - Should see 25+ tables
-- - RLS should be enabled on sensitive tables
-- - Foreign keys should be in place
-- - Extensions should be loaded
-- ============================================
