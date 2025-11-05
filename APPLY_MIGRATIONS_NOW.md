# 🚀 Apply Database Migrations - Critical Fix

## Current Status
Your dashboard is experiencing **500/404 errors** because critical database tables are missing. The migrations are ready to deploy!

## What's Wrong?
The console shows:
- ❌ `resources` table missing (causing 500 errors)
- ❌ `concierge_interactions` table missing (causing 404 errors)
- ❌ Missing RLS policies
- ❌ Staging tables not properly configured

## Solution: Apply These 2 Migrations

### Migration 1: Fix Critical Missing Tables
**File**: `supabase/migrations/20251105190000_fix_critical_missing_tables.sql`

**Creates**:
- ✅ `workspaces` table - For multi-workspace support
- ✅ `resources` table - For dual dashboard content
- ✅ `concierge_interactions` table - For concierge tracking
- ✅ Proper RLS policies for all tables
- ✅ Indexes for performance

### Migration 2: Fix Profiles and Auth
**File**: `supabase/migrations/20251105190001_fix_profiles_and_auth.sql`

**Creates**:
- ✅ Complete `profiles` table with all required columns
- ✅ Automatic profile creation trigger
- ✅ Proper authentication flow support
- ✅ Last login tracking
- ✅ Comprehensive RLS policies

## How to Apply (Choose Your Method)

### Method A: Supabase Dashboard (Recommended)

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz

2. **Navigate to**: SQL Editor (left sidebar)

3. **Apply Migration 1**:
   - Copy the entire contents of `supabase/migrations/20251105190000_fix_critical_missing_tables.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for "Success" message

4. **Apply Migration 2**:
   - Copy the entire contents of `supabase/migrations/20251105190001_fix_profiles_and_auth.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for "Success" message

### Method B: Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/project

# Link to your project (if not already done)
supabase link --project-ref xnijhggwgbxrtvlktviz

# Apply migrations
supabase db push

# Or apply individually
psql postgresql://your-connection-string < supabase/migrations/20251105190000_fix_critical_missing_tables.sql
psql postgresql://your-connection-string < supabase/migrations/20251105190001_fix_profiles_and_auth.sql
```

### Method C: Direct SQL Connection

```bash
# Connect to your database
psql "postgresql://postgres.[your-project-ref].supabase.co:5432/postgres"

# Copy-paste each migration file content and execute
\i supabase/migrations/20251105190000_fix_critical_missing_tables.sql
\i supabase/migrations/20251105190001_fix_profiles_and_auth.sql
```

## Verify It Worked

### 1. Check Tables Exist
Run this in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'workspaces',
    'resources',
    'concierge_interactions',
    'profiles'
  )
ORDER BY table_name;
```

**Expected Result**: Should return all 4 table names

### 2. Check RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'workspaces',
    'resources',
    'concierge_interactions',
    'profiles'
  );
```

**Expected Result**: `rowsecurity` should be `true` for all

### 3. Refresh Your Application
```bash
# In your terminal
npm run dev
```

Then visit: http://localhost:5173/ceod/home

**Expected Result**:
- ✅ No more 500/404 errors
- ✅ CEO dashboard loads properly
- ✅ All panels display correctly

## What Gets Fixed

### Before (Current State)
```
❌ 500 Internal Server Error - /rest/v1/resources
❌ 404 Not Found - /rest/v1/concierge_interactions
❌ Dashboard panels showing "No data" or errors
❌ Upload features not working
❌ Concierge tracking broken
```

### After (Fixed State)
```
✅ All database queries work
✅ Dashboard panels load data
✅ Upload system functions
✅ Concierge tracking active
✅ CEO/CTO dashboards fully operational
```

## Additional Migrations (Already Applied Earlier)

If you haven't applied these yet, you should also run:

1. **Staging Tables**: `supabase/migrations/20251105160000_fix_staging_tables_and_view_conflicts.sql`
   - Creates all staging tables for data uploads
   - Fixes sales, concierge, finance staging tables

## Troubleshooting

### Error: "relation already exists"
**Solution**: This is fine! It means the table was created before. The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe.

### Error: "permission denied"
**Solution**: Make sure you're connected with the `postgres` role or have proper admin permissions.

### Error: "role does not exist"
**Solution**: Run this first:
```sql
CREATE ROLE service_role NOLOGIN NOINHERIT;
```

### Still Getting 500/404 Errors?
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check Supabase logs: Dashboard → Logs → Database
4. Verify environment variables in `.env` file
5. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

## Next Steps After Migrations

Once migrations are applied:

1. **Deploy Edge Functions** (currently failing due to 401 errors)
   - These need to be deployed through Supabase dashboard
   - Go to Edge Functions section and deploy each function

2. **Clean Up Console** (already done in code)
   - Console filter updated to suppress temporary errors
   - Debug logging removed from components

3. **Test All Features**
   - CEO Dashboard: http://localhost:5173/ceod/home
   - CTO Dashboard: http://localhost:5173/ctod/home
   - Upload Portal: http://localhost:5173/ceod/upload
   - Concierge Tracking: http://localhost:5173/ceod/concierge

## Support

If you encounter any issues:

1. Check Supabase Dashboard → Logs
2. Check browser console for new errors
3. Verify all tables exist (query above)
4. Check RLS policies are enabled

---

**Built with ❤️ for MPB Health**

Ready to fix your dashboard? Apply those migrations! 🚀
