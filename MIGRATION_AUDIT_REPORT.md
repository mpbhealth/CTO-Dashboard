# Database Migration Audit Report
**Generated:** December 8, 2025  
**Project:** MPB Health CTO Dashboard  
**Total Migrations:** 161 files

---

## 🚨 CRITICAL ISSUES

### 1. Duplicate Timestamp (MUST FIX)
Two migrations share the exact same timestamp, which will cause Supabase to only apply one:

| File | Timestamp |
|------|-----------|
| `20251105000001_create_upload_templates_table.sql` | 20251105000001 |
| `20251105000001_concierge_upload_templates_and_enhancements.sql` | 20251105000001 |

**Fix:** Rename one file to have a different timestamp (e.g., `20251105000002_...`)

---

## ⚠️ MODERATE ISSUES

### 2. Improperly Named Migration File
The following file doesn't follow the timestamp naming convention and won't be tracked by Supabase:

- `staging_tables.sql`

**Fix:** Rename to `20251001000000_staging_tables.sql` or similar

### 3. Duplicate Schema Definitions
Multiple migrations create the same tables/schemas:

#### Sales Cancelations Schema
- `20251104155518_create_sales_cancelations_schema.sql`
- `20251104161000_create_sales_cancelations_schema.sql`

#### Sales Leads Schema
- `20251104155446_create_sales_leads_schema.sql`
- `20251104160000_create_sales_leads_schema.sql`

#### Note Sharing System
- `20251030190117_create_note_sharing_system.sql`
- `20251031000001_create_note_sharing_system.sql`

#### Roadmap Missing Columns
- `20251030180000_add_roadmap_missing_columns.sql`
- `20251030180904_add_roadmap_missing_columns.sql`

**Note:** If using `CREATE TABLE IF NOT EXISTS` or `DROP IF EXISTS`, these should be safe but add unnecessary clutter.

---

## ℹ️ INFORMATIONAL

### 4. Multiple Profile-related Migrations
The profiles table is touched by 5 different migrations:
- `20250712172810_plain_lagoon.sql`
- `20251014140000_create_missing_tables.sql`
- `20251105190001_fix_profiles_and_auth.sql`
- `20251205000000_profiles_table.sql`
- `20251205000001_admin_control_center_schema.sql`

**Status:** ✅ OK - Uses `CREATE TABLE IF NOT EXISTS`

### 5. Multiple RLS Policy Definitions
Profile policies are defined across 11 different migrations (31 total CREATE POLICY statements).

**Status:** ✅ OK - Latest migration `20251208100000_comprehensive_rls_and_auth_cleanup.sql` properly cleans up with `DROP POLICY IF EXISTS` before creating definitive policies.

### 6. Helper Functions
The `is_admin_user()` function is defined in:
- `20251208000000_fix_profiles_recursive_policy.sql`
- `20251208100000_comprehensive_rls_and_auth_cleanup.sql`

**Status:** ✅ OK - Uses `CREATE OR REPLACE` and the later migration takes precedence.

---

## 📋 RECOMMENDED ACTIONS

### Immediate (Before Next Migration Push)

1. **Fix duplicate timestamp:**
   ```powershell
   # In PowerShell, run:
   Rename-Item "supabase\migrations\20251105000001_concierge_upload_templates_and_enhancements.sql" `
               "20251105000002_concierge_upload_templates_and_enhancements.sql"
   ```

2. **Fix improperly named file:**
   ```powershell
   Rename-Item "supabase\migrations\staging_tables.sql" `
               "20251001000000_staging_tables.sql"
   ```

### Future Cleanup (Optional)

3. Remove duplicate schema migrations (keep the later versions):
   - Delete `20251104155518_create_sales_cancelations_schema.sql`
   - Delete `20251104155446_create_sales_leads_schema.sql`
   - Delete `20251030190117_create_note_sharing_system.sql`
   - Delete `20251030180000_add_roadmap_missing_columns.sql`

   **⚠️ WARNING:** Only do this if these migrations have NOT been applied to your production database.

---

## 🔧 MIGRATION HEALTH CHECK

| Check | Status |
|-------|--------|
| Total migration files | 161 |
| Properly named files | 160/161 |
| Duplicate timestamps | 1 pair found |
| Uses IF NOT EXISTS/IF EXISTS | ✅ Yes |
| RLS properly consolidated | ✅ Yes |
| Profile creation trigger | ✅ Defined |
| Helper functions | ✅ Defined |

---

## 📊 LATEST MIGRATIONS (December 2025)

| File | Purpose |
|------|---------|
| `20251208100000_comprehensive_rls_and_auth_cleanup.sql` | Consolidates all RLS policies and helper functions |
| `20251208000000_fix_profiles_recursive_policy.sql` | Fixes recursive RLS policy on profiles |
| `20251205000001_admin_control_center_schema.sql` | Admin control center schema |
| `20251205000000_profiles_table.sql` | Profiles table definition |
| `20251203210000_rls_policy_verification_diagnostic.sql` | RLS diagnostic views |

---

## ✅ VERIFICATION QUERIES

After pushing migrations, run these queries in Supabase SQL Editor to verify:

```sql
-- Check profiles table policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check helper functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin_user', 'get_user_role', 'is_staff_or_higher');

-- Check for duplicate policies
SELECT tablename, policyname, COUNT(*) 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename, policyname 
HAVING COUNT(*) > 1;

-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
