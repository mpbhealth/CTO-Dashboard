/*
  Concierge Upload System - Verification Script

  Run this script to verify that all components are properly configured.
  Expected output: All checks should return TRUE or positive counts.
*/

-- Check 1: Verify staging tables exist
SELECT
  'Staging Tables' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'stg_concierge_weekly_metrics',
    'stg_concierge_daily_interactions',
    'stg_concierge_after_hours'
  );

-- Check 2: Verify lookup tables exist and are populated
SELECT
  'Lookup Tables' as check_name,
  (SELECT COUNT(*) FROM concierge_team_members WHERE is_active = true) as team_members,
  (SELECT COUNT(*) FROM concierge_issue_categories WHERE is_active = true) as issue_categories,
  (SELECT COUNT(*) FROM concierge_request_types WHERE is_active = true) as request_types,
  CASE
    WHEN (SELECT COUNT(*) FROM concierge_team_members WHERE is_active = true) >= 6
     AND (SELECT COUNT(*) FROM concierge_issue_categories WHERE is_active = true) >= 20
     AND (SELECT COUNT(*) FROM concierge_request_types WHERE is_active = true) >= 4
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 3: Verify upload templates are configured
SELECT
  'Upload Templates' as check_name,
  COUNT(*) as template_count,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM concierge_upload_templates
WHERE is_active = true
  AND subdepartment IN ('weekly', 'daily', 'after_hours');

-- Check 4: Verify error tracking tables exist
SELECT
  'Error Tracking Tables' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 2 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'concierge_upload_errors',
    'concierge_data_quality_log'
  );

-- Check 5: Verify transformation views exist
SELECT
  'Transformation Views' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'concierge_weekly_metrics',
    'concierge_daily_interactions',
    'concierge_after_hours'
  );

-- Check 6: Verify summary views exist
SELECT
  'Summary Views' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'concierge_weekly_summary',
    'concierge_daily_summary',
    'concierge_after_hours_summary'
  );

-- Check 7: Verify validation functions exist
SELECT
  'Validation Functions' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'validate_concierge_weekly_metric',
    'validate_concierge_daily_interaction',
    'validate_concierge_after_hours_call'
  );

-- Check 8: Verify RLS is enabled on all tables
SELECT
  'Row Level Security' as check_name,
  COUNT(*) as tables_with_rls,
  CASE WHEN COUNT(*) >= 8 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%concierge%'
  AND rowsecurity = true;

-- Check 9: Verify indexes exist for performance
SELECT
  'Performance Indexes' as check_name,
  COUNT(*) as index_count,
  CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '⚠️ CHECK' END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%concierge%';

-- Check 10: List all concierge team members
SELECT
  'Team Member: ' || agent_name as check_name,
  display_name,
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM concierge_team_members
ORDER BY agent_name;

-- Check 11: List all upload templates with details
SELECT
  '📄 ' || subdepartment as check_name,
  display_name,
  file_name_pattern,
  '✅ Ready' as status
FROM concierge_upload_templates
WHERE is_active = true
ORDER BY subdepartment;

-- Check 12: Sample validation function test (Weekly Metric)
SELECT
  'Weekly Metric Validation Test' as check_name,
  validate_concierge_weekly_metric(
    '10.23.25-10.31.25',
    'Ace',
    'Members attended to',
    '150'
  ) as validation_result,
  CASE
    WHEN (validate_concierge_weekly_metric('10.23.25-10.31.25', 'Ace', 'Members attended to', '150'))->>'valid' = 'true'
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 13: Sample validation function test (Daily Interaction)
SELECT
  'Daily Interaction Validation Test' as check_name,
  validate_concierge_daily_interaction(
    '09.18.25',
    'Test Member',
    'telemedicine'
  ) as validation_result,
  CASE
    WHEN (validate_concierge_daily_interaction('09.18.25', 'Test Member', 'telemedicine'))->>'valid' = 'true'
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 14: Sample validation function test (After Hours Call)
SELECT
  'After Hours Validation Test' as check_name,
  validate_concierge_after_hours_call(
    'Sep 18, 2025, 8:36:53 pm',
    'Test Member',
    '16025016607'
  ) as validation_result,
  CASE
    WHEN (validate_concierge_after_hours_call('Sep 18, 2025, 8:36:53 pm', 'Test Member', '16025016607'))->>'valid' = 'true'
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check 15: Department uploads table has concierge support
SELECT
  'Department Uploads Config' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%valid%department%'
      AND check_clause LIKE '%concierge%'
    )
    THEN '✅ PASS - Concierge supported'
    ELSE '⚠️ CHECK - May need update'
  END as status;

-- Final Summary
SELECT
  '=' as divider,
  'VERIFICATION COMPLETE' as summary,
  '=' as divider2;

SELECT
  'ℹ️ Next Steps' as info,
  '1. All checks above should show ✅ PASS' as step1,
  '2. Upload a test file via /ceo/concierge-upload' as step2,
  '3. Verify data appears in staging tables' as step3,
  '4. Check analytics views return data' as step4;

-- Quick data check (will return 0 if no uploads yet)
SELECT
  'Current Upload Status' as status_check,
  (SELECT COUNT(*) FROM stg_concierge_weekly_metrics) as weekly_rows,
  (SELECT COUNT(*) FROM stg_concierge_daily_interactions) as daily_rows,
  (SELECT COUNT(*) FROM stg_concierge_after_hours) as after_hours_rows,
  CASE
    WHEN (SELECT COUNT(*) FROM stg_concierge_weekly_metrics) > 0
      OR (SELECT COUNT(*) FROM stg_concierge_daily_interactions) > 0
      OR (SELECT COUNT(*) FROM stg_concierge_after_hours) > 0
    THEN '📊 Data Found - System Active!'
    ELSE '📭 No Data Yet - Ready for First Upload'
  END as status;
