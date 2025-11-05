# Apply Staging Tables Migration - Quick Guide

## Status: ✅ Migration Ready to Apply

The migration file `20251105160000_fix_staging_tables_and_view_conflicts.sql` has been created and validated. It fixes the upload system errors by ensuring all staging tables exist as actual TABLES (not views).

## What This Migration Fixes

1. **"Could not find the table 'stg_concierge_interactions' in the schema cache (PGRST205)"** - Creates all required staging tables
2. **View/Table conflicts** - Properly handles existing views or tables with conditional DROP logic
3. **Missing INSERT permissions** - Adds RLS policies for CEO/CTO/admin roles to insert data
4. **Upload system infrastructure** - Verifies all 9 staging tables exist with proper security

## How to Apply (Choose One Method)

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of:
   ```
   /tmp/cc-agent/58570646/project/supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql
   ```
6. Paste into the SQL editor
7. Click **Run** button
8. Wait for confirmation message: "Success. No rows returned"

### Method 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql
```

### Method 3: Direct SQL (Advanced)

If you have direct PostgreSQL access:

```bash
psql [your-connection-string] -f supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql
```

## After Migration

### Verify Success

Run this query in Supabase SQL Editor to verify tables were created:

```sql
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'stg_%'
ORDER BY table_name;
```

Expected output: 9 tables including:
- stg_concierge_interactions (TABLE)
- stg_sales_orders (TABLE)
- stg_sales_leads (TABLE)
- stg_sales_cancelations (TABLE)
- stg_plan_cancellations (TABLE)
- stg_finance_records (TABLE)
- stg_saudemax_data (TABLE)
- stg_concierge_notes (TABLE)
- stg_crm_leads (TABLE)

### Test Upload System

1. Navigate to CEO Dashboard → Department Upload Portal
2. Select "Concierge" department
3. Upload a test CSV file
4. Verify upload succeeds without PGRST205 error

## Migration Details

**File**: `supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql`
**Size**: 589 lines
**Safety**: Idempotent (safe to run multiple times)

### What It Creates:

✅ 9 staging tables with org-scoped security
✅ RLS policies for CEO, CTO, admin roles
✅ Performance indexes on org_id and upload_batch_id
✅ Service role permissions for Edge Functions
✅ Conditional DROP logic to prevent conflicts

### Security Features:

- All tables use Row Level Security (RLS)
- Data scoped by org_id to prevent cross-org access
- Only CEO, CTO, and admin roles can INSERT
- Service role can bypass RLS for automated imports
- Composite indexes for fast policy lookups

## Troubleshooting

### If You See: "relation already exists"
- This is normal - the migration uses `CREATE TABLE IF NOT EXISTS`
- The migration is idempotent and safe to re-run

### If You See: "permission denied"
- Ensure you're running as database owner or service_role
- Check that your Supabase user has DDL permissions

### If Upload Still Fails After Migration
1. Verify migration was applied (check tables exist)
2. Check browser console for new error messages
3. Verify your user has CEO, CTO, or admin role in profiles table
4. Check that org_id in profiles matches data being uploaded

## Next Steps After Success

1. ✅ Migration applied successfully
2. ✅ Upload system verified working
3. Consider removing old staging_tables.sql (optional cleanup)
4. Test all department uploads: Concierge, Sales, Finance, SaudeMAX

## Need Help?

If migration fails, check:
- Supabase logs in Dashboard → Logs
- SQL error messages for specific table/constraint conflicts
- Ensure no other migrations are running simultaneously
