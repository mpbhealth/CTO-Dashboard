# Quick Fix Guide - Upload System

**Status:** ✅ Ready to Apply
**Time to Fix:** 2-3 minutes

## The Problem

Upload system shows error:
```
Failed to insert records: Could not find the table
'public.stg_concierge_interactions' in the schema cache
```

## The Solution

Apply the migration that creates staging tables as actual tables (not views).

## Steps to Fix (Choose One Method)

### Method 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Open the file `supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql`
5. Copy all contents
6. Paste into the SQL Editor
7. Click **Run** (bottom right)
8. Wait for "Success. No rows returned"
9. Done! ✅

### Method 2: Direct Database Connection

If you have a SQL client connected to your database:

```bash
# Run the migration file
psql <your-connection-string> -f supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql
```

### Method 3: Supabase CLI (If Installed)

```bash
supabase db push
```

## Verify It Worked

1. **Login to your app** as Catherine Champion (CEO)
2. **Navigate to** `/ceod/upload` or click "Department Upload" in menu
3. **Select** "Concierge Team"
4. **Try uploading** a CSV file
5. **Look for success message**: "X rows imported successfully"

If you see the success message, the fix worked! 🎉

## What Was Fixed?

- ✅ Created 9 staging tables as actual TABLES (were views before)
- ✅ Added INSERT permissions for CEO and admin roles
- ✅ Added SELECT permissions for data retrieval
- ✅ Enabled Row Level Security with org_id scoping
- ✅ Added performance indexes on all tables
- ✅ Granted service role permissions for Edge Functions

## Staging Tables Created

1. `stg_concierge_interactions` - Concierge data
2. `stg_sales_orders` - Sales enrollment data
3. `stg_sales_leads` - Lead tracking
4. `stg_sales_cancelations` - Cancelation reports
5. `stg_plan_cancellations` - Operations churn data
6. `stg_finance_records` - Financial data
7. `stg_saudemax_data` - SaudeMAX program data
8. `stg_concierge_notes` - Concierge notes
9. `stg_crm_leads` - CRM lead data

## Troubleshooting

### If upload still fails:

**Check 1: Is user a CEO or admin?**
```sql
SELECT user_id, email, role, org_id
FROM profiles
WHERE user_id = auth.uid();
```
Role must be 'ceo' or 'admin'.

**Check 2: Are tables created?**
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'stg_%'
ORDER BY tablename;
```
Should show 9 tables.

**Check 3: Are policies active?**
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'stg_%'
ORDER BY tablename;
```
Each table should have `_select` and `_insert` policies.

### Still having issues?

Check the full documentation in `UPLOAD_SYSTEM_FIX_COMPLETE.md`.

## Key Points

- **Migration is idempotent** - Safe to run multiple times
- **No data loss** - Only creates tables, doesn't modify existing data
- **Backwards compatible** - Supports both old and new data formats
- **Secure by default** - RLS policies enforce org-level isolation

---

**Time Required:** 2-3 minutes
**Difficulty:** Easy
**Risk Level:** Low (idempotent, no destructive operations)
