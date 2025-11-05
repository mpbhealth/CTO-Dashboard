# Upload System Fix - Complete

**Date:** November 5, 2025
**Status:** ✅ Migration Created - Ready to Apply

## Problem Summary

The upload system was failing with the error:
```
Failed to insert records: Could not find the table 'public.stg_concierge_interactions'
in the schema cache (Code: PGRST205)
```

## Root Causes Identified

### 1. **View vs Table Confusion**
- The data pipeline migration `20251024200000_ceo_unified_data_pipeline.sql` created **views** for some staging tables
- The upload Edge Function attempts to **INSERT** data into these tables
- PostgreSQL views are read-only - you cannot INSERT into a view
- This caused the "table not found" error because PostgREST couldn't find a writable table

### 2. **Missing RLS INSERT Policies**
- Even if tables existed, they lacked INSERT permissions for authenticated users
- Only SELECT policies were defined in most migrations
- Edge Functions running under service role could bypass RLS, but authenticated user uploads failed

### 3. **Migration Conflicts**
- Multiple migrations attempted to ALTER TABLE on objects that might be views
- Migration `20251030190117_create_note_sharing_system.sql` tries to drop columns from `notes`
- If `notes` is a view, this causes Postgres error 42P16

## Solution Implemented

### New Migration Created
**File:** `supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql`

This comprehensive migration:

1. **Drops any existing views** with staging table names to clear conflicts
2. **Creates all staging tables as actual TABLES** (not views):
   - `stg_concierge_interactions`
   - `stg_sales_orders`
   - `stg_sales_leads`
   - `stg_sales_cancelations`
   - `stg_plan_cancellations`
   - `stg_finance_records`
   - `stg_saudemax_data`
   - `stg_concierge_notes`
   - `stg_crm_leads`

3. **Adds performance indexes** on all staging tables for:
   - `org_id` (for RLS filtering)
   - `upload_batch_id` (for tracking uploads)
   - Department-specific fields (e.g., `rep`, `lead_owner`)

4. **Enables Row Level Security (RLS)** on all staging tables

5. **Creates SELECT policies** allowing CEO and admin roles to query data

6. **Creates INSERT policies** allowing CEO and admin roles to upload data

7. **Grants service role permissions** for Edge Functions to bypass RLS

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration
6. Verify success - you should see "Success. No rows returned"

### Option 2: Via Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
```sql
-- Connect to your database and run the migration file directly
\i supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql
```

## Verification Steps

After applying the migration, verify the fix:

### 1. Check Tables Exist
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'stg_%'
ORDER BY tablename;
```

You should see 9 staging tables listed.

### 2. Verify Table Type (Not Views)
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'stg_%';
```

All should show `table_type = 'BASE TABLE'`, not 'VIEW'.

### 3. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'stg_%'
ORDER BY tablename, policyname;
```

Each staging table should have 2 policies:
- `[tablename]_select`
- `[tablename]_insert`

### 4. Test Upload Permission
Log in as a user with CEO or admin role and attempt to upload a file via the CEO Department Upload portal at `/ceod/upload`.

## What This Fixes

✅ **Upload System Errors** - Tables now exist and accept INSERT operations
✅ **Authentication Issues** - Proper RLS policies allow authenticated uploads
✅ **View Alteration Conflicts** - Staging tables are now actual tables, not views
✅ **Service Role Access** - Edge Functions can bypass RLS as needed
✅ **Cross-Org Security** - RLS policies enforce org_id scoping

## What Still Needs Attention

⚠️ **Edge Function Deployment** - The 401 errors for Edge Functions suggest a Supabase connection issue in the Bolt environment. This is separate from the database schema issue.

⚠️ **Resources Table Errors** - The 500 errors on resources table queries may indicate RLS recursion issues. Review the resources table policies if these persist.

⚠️ **Upload Templates** - Verify that `upload_templates` table has sample data for each department.

## Testing the Upload Flow

1. **Login** as Catherine Champion (CEO role)
2. **Navigate** to `/ceod/upload` or use the "Department Upload" menu
3. **Select** a department (e.g., "Concierge Team")
4. **Download** the CSV template
5. **Fill** in sample data
6. **Upload** the completed CSV file
7. **Verify** success message shows "X rows imported successfully"

## Expected Outcome

After applying this migration, uploads should work correctly:

```
✅ Upload Completed
5 rows imported successfully
0 rows failed
```

Instead of the previous error:
```
❌ Upload Failed
Failed to insert records: Could not find the table
'public.stg_concierge_interactions' in the schema cache
```

## Files Modified

- ✅ `/supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql` (CREATED)

## Next Steps

1. **Apply the migration** using one of the methods above
2. **Test the upload system** with sample data
3. **Verify data appears** in the staging tables
4. **Check CEO dashboards** to ensure data flows to reporting views
5. **Monitor for any remaining errors** in the browser console

## Technical Notes

### Why Views Don't Work for Uploads
- Views are virtual tables created by SELECT statements
- They present data from underlying tables but don't store data themselves
- INSERT/UPDATE/DELETE operations require actual tables
- PostgREST (Supabase's API layer) cannot write to views

### RLS Policy Structure
All staging table policies follow this pattern:

**SELECT Policy:**
```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.org_id = staging_table.org_id
    AND profiles.role IN ('ceo', 'admin')
  )
)
```

**INSERT Policy:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.org_id = staging_table.org_id
    AND profiles.role IN ('ceo', 'admin')
  )
)
```

This ensures:
- Only authenticated users can access data
- Users must belong to the same organization
- Only CEO and admin roles can upload data
- Service role can bypass for Edge Functions

---

**Summary:** The upload system failure was caused by attempting to insert data into views instead of tables. The new migration creates proper tables with INSERT permissions, resolving the core issue.
