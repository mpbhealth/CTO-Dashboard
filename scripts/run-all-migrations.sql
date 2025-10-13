-- ============================================
-- RUN ALL MIGRATIONS - COMBINED FILE
-- This file combines all 78 migrations in order
-- Run this in the SQL Editor of your new database
-- ============================================
-- Project: xnijhggwgbxrtvlktviz
-- Database: https://xnijhggwgbxrtvlktviz.supabase.co
-- Date: October 13, 2025
-- ============================================

-- IMPORTANT: This is a REFERENCE file showing migration order
-- For best results, use Supabase CLI: supabase db push
-- Or run each migration file individually in order below

-- ============================================
-- MIGRATION ORDER (78 files total)
-- ============================================

-- Priority 1: HIPAA Foundation (MUST RUN FIRST)
-- 1. supabase/migrations/20250109000001_hipaa_roles_profiles.sql
-- 2. supabase/migrations/20250109000002_hipaa_core_tables.sql
-- 3. supabase/migrations/20250109000003_hipaa_rls_policies.sql
-- 4. supabase/migrations/20250109000004_hipaa_settings_storage.sql

-- Priority 2: Core Schema (June 2025)
-- 5. supabase/migrations/20250619185038_damp_oasis.sql
-- 6. supabase/migrations/20250619190650_curly_prism.sql
-- 7. supabase/migrations/20250619190832_navy_recipe.sql
-- 8. supabase/migrations/20250619191010_broad_breeze.sql
-- 9. supabase/migrations/20250619191145_noisy_snowflake.sql
-- 10. supabase/migrations/20250619191530_summer_king.sql
-- 11. supabase/migrations/20250619192147_jolly_dust.sql
-- 12. supabase/migrations/20250619192311_silver_dune.sql
-- 13. supabase/migrations/20250619192513_fragrant_lagoon.sql
-- 14. supabase/migrations/20250619192629_muddy_river.sql
-- 15. supabase/migrations/20250619192919_sunny_breeze.sql
-- 16. supabase/migrations/20250619205311_twilight_band.sql
-- 17. supabase/migrations/20250620141837_warm_plain.sql
-- 18. supabase/migrations/20250620142201_graceful_stream.sql
-- 19. supabase/migrations/20250620142323_scarlet_fountain.sql
-- 20. supabase/migrations/20250620142849_curly_reef.sql
-- 21. supabase/migrations/20250620143502_dusty_meadow.sql
-- 22. supabase/migrations/20250622180658_super_hill.sql
-- 23. supabase/migrations/20250625192223_dark_art.sql
-- 24. supabase/migrations/20250625192946_wandering_heart.sql

-- Priority 3: Extended Features (July 2025)
-- 25. supabase/migrations/20250712172810_plain_lagoon.sql
-- 26. supabase/migrations/20250712174658_misty_darkness.sql
-- 27. supabase/migrations/20250712175118_green_snowflake.sql
-- 28. supabase/migrations/20250712180731_delicate_disk.sql
-- 29. supabase/migrations/20250712181347_velvet_plain.sql
-- 30. supabase/migrations/20250712182407_old_frost.sql
-- 31. supabase/migrations/20250712183156_fading_pebble.sql
-- 32. supabase/migrations/20250712183213_velvet_shape.sql
-- 33. supabase/migrations/20250712202054_delicate_sea.sql
-- 34. supabase/migrations/20250712224246_divine_wood.sql
-- 35. supabase/migrations/20250712224907_shy_shape.sql
-- 36. supabase/migrations/20250714200834_throbbing_field.sql
-- 37. supabase/migrations/20250714201135_twilight_truth.sql
-- 38. supabase/migrations/20250714205711_pink_delta.sql

-- Priority 4: Additional Features (July-August 2025)
-- 39. supabase/migrations/20250731032635_tight_palace.sql
-- 40. supabase/migrations/20250731134910_round_leaf.sql
-- 41. supabase/migrations/20250731135351_yellow_cave.sql
-- 42. supabase/migrations/20250731135510_rough_valley.sql
-- 43. supabase/migrations/20250731135647_proud_cave.sql
-- 44. supabase/migrations/20250731135822_flat_lodge.sql
-- 45. supabase/migrations/20250731140008_heavy_wind.sql
-- 46. supabase/migrations/20250731140249_throbbing_bonus.sql
-- 47. supabase/migrations/20250731140735_late_rain.sql
-- 48. supabase/migrations/20250731141206_gentle_bush.sql
-- 49. supabase/migrations/20250731141422_graceful_sea.sql
-- 50. supabase/migrations/20250731152739_muddy_island.sql
-- 51. supabase/migrations/20250731153938_empty_grove.sql
-- 52. supabase/migrations/20250731155331_lucky_pine.sql
-- 53. supabase/migrations/20250801191736_dawn_dew.sql

-- Priority 5: Recent Features (August 2025)
-- 54. supabase/migrations/20250804154011_empty_hat.sql
-- 55. supabase/migrations/20250804154701_super_villa.sql
-- 56. supabase/migrations/20250804154812_long_mouse.sql
-- 57. supabase/migrations/20250804155759_wooden_shrine.sql
-- 58. supabase/migrations/20250804163733_soft_moon.sql
-- 59. supabase/migrations/20250804165144_crimson_heart.sql
-- 60. supabase/migrations/20250804175909_gentle_mountain.sql
-- 61. supabase/migrations/20250804180036_sweet_wildflower.sql
-- 62. supabase/migrations/20250804180855_shy_leaf.sql
-- 63. supabase/migrations/20250804181710_dawn_shape.sql
-- 64. supabase/migrations/20250804182309_aged_waterfall.sql
-- 65. supabase/migrations/20250804183614_ivory_island.sql
-- 66. supabase/migrations/20250804183837_azure_feather.sql
-- 67. supabase/migrations/20250804184130_dusty_haze.sql
-- 68. supabase/migrations/20250804184505_wild_block.sql
-- 69. supabase/migrations/20250804185123_nameless_math.sql
-- 70. supabase/migrations/20250804185130_weathered_ember.sql

-- Priority 6: Latest Features (August-September 2025)
-- 71. supabase/migrations/20250806132836_twilight_resonance.sql
-- 72. supabase/migrations/20250806133527_delicate_hall.sql
-- 73. supabase/migrations/20250806140803_snowy_wildflower.sql
-- 74. supabase/migrations/20250806140809_jolly_heart.sql
-- 75. supabase/migrations/20250806140831_falling_scene.sql
-- 76. supabase/migrations/20250806143442_yellow_bird.sql
-- 77. supabase/migrations/20250806143625_lively_harbor.sql
-- 78. supabase/migrations/20250930000001_api_incidents.sql

-- ============================================
-- RECOMMENDED APPROACH
-- ============================================

-- Option A: Use Supabase CLI (EASIEST)
-- Run these commands in PowerShell:
/*
npm install -g supabase
supabase login
supabase link --project-ref xnijhggwgbxrtvlktviz
supabase db push
*/

-- Option B: Manual Migration (If CLI doesn't work)
-- 1. Open SQL Editor: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor
-- 2. Create a new query for each migration file
-- 3. Copy the content from each file in order above
-- 4. Run each query one at a time
-- 5. Check for errors before proceeding to next

-- ============================================
-- VERIFICATION
-- ============================================

-- After running all migrations, verify with:
-- (Run this in a separate query)

SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Tables with RLS' as metric,
    COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
    'Total Policies' as metric,
    COUNT(*)::text as value
FROM pg_policies
WHERE schemaname = 'public';

-- Expected results:
-- Total Tables: 25+ tables
-- Tables with RLS: Most tables should have RLS enabled
-- Total Policies: Multiple policies per sensitive table

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you get errors:
-- 1. Check which migration failed
-- 2. Read the error message
-- 3. Fix the issue (usually a duplicate table or missing dependency)
-- 4. Continue from that migration

-- Common issues:
-- - "relation already exists" = Table was already created, safe to skip
-- - "column does not exist" = Previous migration may have failed
-- - "permission denied" = RLS policy issue, check admin role

-- ============================================
-- HIPAA EXTENSIONS
-- ============================================

-- After migrations, enable HIPAA extensions:

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_audit";

-- Set session timeouts for HIPAA compliance
ALTER ROLE authenticated SET statement_timeout = '30min';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30min';

-- ============================================
-- COMPLETE!
-- ============================================

