# URGENT: Apply Database Migrations

## Critical Issues Fixed

The stabilization work has created migrations to fix these console errors:
- ❌ **500 Internal Server Error** on `/rest/v1/resources`
- ❌ **404 Not Found** on `/rest/v1/concierge_interactions`
- ❌ **Table not found** errors in database queries
- ❌ **RLS policy violations** blocking data access

## What Was Completed

✅ Created migration files to fix missing tables
✅ Optimized React Query configuration
✅ Extended console error filtering
✅ Cleaned up debug logging
✅ Verified production build (42 chunks, 1.4MB)

## What You Need to Do NOW

### Step 1: Apply Migrations (5 minutes)

**Go to:** https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/sql/new

**Run this SQL:**

```sql
-- Migration 1: Create missing tables
-- Copy all content from: supabase/migrations/20251105190000_fix_critical_missing_tables.sql
-- Then click "Run"

-- Migration 2: Fix profiles and auth
-- Copy all content from: supabase/migrations/20251105190001_fix_profiles_and_auth.sql
-- Then click "Run"
```

### Step 2: Verify (1 minute)

```sql
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE columns.table_name = tables.table_name) as columns
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('workspaces', 'resources', 'concierge_interactions', 'profiles')
ORDER BY table_name;
```

**Expected Output:**
```
concierge_interactions | 17
profiles              | 17
resources             | 11
workspaces            | 8
```

### Step 3: Create Default Data (1 minute)

```sql
-- Insert default workspaces for MPB Health
INSERT INTO workspaces (org_id, name, workspace_type, description)
VALUES
  ('861e0357-0572-454f-bdb4-589cbe463534', 'CEO Workspace', 'CEO', 'Executive command center'),
  ('861e0357-0572-454f-bdb4-589cbe463534', 'CTO Workspace', 'CTO', 'Technology operations center')
ON CONFLICT DO NOTHING;

-- Verify
SELECT name, workspace_type FROM workspaces;
```

### Step 4: Test Application (2 minutes)

1. **Clear browser cache:** Ctrl+Shift+Delete → Clear cached images and files
2. **Refresh application:** F5 or Ctrl+R
3. **Check console:** Should see much fewer errors
4. **Test login:** Sign in and verify dashboard loads

## Expected Results

After applying migrations:
- ✅ No 500/404 errors on Supabase endpoints
- ✅ CEO and CTO dashboards load with panels
- ✅ Resources and workspaces fetch correctly
- ✅ Console shows minimal platform noise
- ✅ Navigation works smoothly

## If Something Goes Wrong

### Error: "relation already exists"
This is OK - it means the table was already created. Continue with next migration.

### Error: "permission denied"
Make sure you're running SQL in Supabase Dashboard SQL Editor, not as authenticated user.

### Error: "foreign key violation"
Check that the profiles table exists and has data before creating resources.

### Dashboard still shows errors
1. Check Network tab in DevTools - look for failed requests
2. Verify migrations actually ran: `SELECT * FROM supabase_migrations.schema_migrations ORDER BY executed_at DESC LIMIT 5;`
3. Check if RLS policies are too restrictive by querying as service role

## Quick Troubleshooting Commands

```sql
-- Check if migrations ran
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%20251105%'
ORDER BY executed_at DESC;

-- Check table counts (as service role)
SELECT 'workspaces' as table_name, COUNT(*) FROM workspaces
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

-- Check your profile
SELECT id, email, role, org_id, is_superuser
FROM profiles
WHERE user_id = auth.uid();

-- Test workspace access
SELECT w.name, w.workspace_type, p.role
FROM workspaces w
JOIN profiles p ON p.org_id = w.org_id
WHERE p.user_id = auth.uid();
```

## Next Actions After Migration

Once migrations are applied and verified:

1. **Test department uploads** - Try uploading CSV for concierge data
2. **Test resource sharing** - Create and share a resource between CEO/CTO
3. **Monitor performance** - Check React Query DevTools for optimal caching
4. **Review console** - Should only see minimal, intentional logs

## Timeline

- **Immediate** (now): Apply migrations
- **5 minutes**: Verify tables and test dashboard
- **10 minutes**: Test core features (upload, navigation, sharing)
- **30 minutes**: Monitor console and resolve any remaining issues
- **1 hour**: Move to Phase 2 of stabilization plan

## Support Files

- `MIGRATION_STATUS_AND_NEXT_STEPS.md` - Comprehensive guide with all phases
- `supabase/migrations/20251105190000_fix_critical_missing_tables.sql` - Tables migration
- `supabase/migrations/20251105190001_fix_profiles_and_auth.sql` - Auth migration

## Success Indicators

You'll know it worked when:
1. Console shows < 10 errors on page load (down from 50+)
2. CEO/CTO dashboards show panels with data
3. No red 500/404 errors in Network tab
4. Can navigate between all views smoothly
5. Upload and file operations work

---

**Estimated Time:** 10-15 minutes total
**Priority:** CRITICAL - Blocks all other work
**Risk:** LOW - Migrations use IF NOT EXISTS and won't break existing data
