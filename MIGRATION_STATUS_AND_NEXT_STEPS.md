# Migration Status and Next Steps

## Current Status

The stabilization plan has completed Phase 1 (Database Schema Fixes) with the following migrations created:

### Critical Migrations Ready to Apply

1. **20251105190000_fix_critical_missing_tables.sql** - Creates missing core tables
   - `workspaces` - Multi-workspace support for CEO/CTO dashboards
   - `resources` - Dual dashboard content management
   - `concierge_interactions` - Concierge tracking system
   - Comprehensive RLS policies with org_id scoping
   - Indexed for performance

2. **20251105190001_fix_profiles_and_auth.sql** - Authentication infrastructure
   - Ensures `profiles` table has all required columns
   - Automatic profile creation trigger on user signup
   - Role-based access control policies
   - Last login tracking

### Code Optimizations Completed

- Console error filtering extended to suppress Supabase platform noise
- React Query configuration optimized with intelligent retry logic
- Debug logging cleaned up from production code
- Build system verified working (42 chunks, 1.4MB total)

## Next Steps to Complete Stabilization

### Step 1: Apply Database Migrations (URGENT)

These migrations fix the critical 500/404 errors shown in console logs.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/sql/new
2. Copy contents of `supabase/migrations/20251105190000_fix_critical_missing_tables.sql`
3. Paste into SQL editor and click "Run"
4. Repeat with `supabase/migrations/20251105190001_fix_profiles_and_auth.sql`
5. Verify with:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('workspaces', 'resources', 'concierge_interactions', 'profiles')
   ORDER BY table_name;
   ```

**Option B: Using Supabase CLI**

```bash
cd /tmp/cc-agent/58570646/project
npx supabase db push
```

**Option C: Direct SQL Connection**

Use a PostgreSQL client to connect and run the migration files directly.

### Step 2: Verify Tables and Policies

After applying migrations, run this verification query:

```sql
-- Check tables exist
SELECT
  t.table_name,
  COUNT(c.column_name) as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN ('workspaces', 'resources', 'concierge_interactions', 'profiles')
GROUP BY t.table_name
ORDER BY t.table_name;
```

Expected results:
- `workspaces` - 8 columns, 3 policies
- `resources` - 11 columns, 4 policies
- `concierge_interactions` - 17 columns, 3 policies
- `profiles` - 17 columns, 3 policies

### Step 3: Create Default Data

After migrations are applied, create default workspace and test data:

```sql
-- Insert default MPB Health org workspace
INSERT INTO workspaces (org_id, name, workspace_type, description)
VALUES
  ('861e0357-0572-454f-bdb4-589cbe463534', 'CEO Workspace', 'CEO', 'Executive command center for CEO dashboard'),
  ('861e0357-0572-454f-bdb4-589cbe463534', 'CTO Workspace', 'CTO', 'Technology operations center for CTO dashboard')
ON CONFLICT DO NOTHING;
```

### Step 4: Test Authentication Flow

1. Clear browser cache and cookies
2. Navigate to the login page
3. Sign up with a new account or sign in with existing credentials
4. Verify automatic profile creation
5. Check that role-based dashboard routing works

### Step 5: Deploy Edge Functions (If Needed)

The following edge functions may need deployment:
- `department-data-upload` - For CSV upload processing
- `file-upload` - For file storage operations
- `export-data` - For data export functionality

Deploy using Supabase Dashboard or CLI.

### Step 6: Monitor Console Errors

After migrations are applied:
1. Refresh the application
2. Open browser DevTools console
3. Verify the following errors are resolved:
   - ❌ 500 errors on `/rest/v1/resources`
   - ❌ 404 errors on `/rest/v1/concierge_interactions`
   - ❌ "Supabase request failed" errors
   - ❌ "Failed to fetch" errors on Supabase endpoints

### Step 7: Test Core Features

Verify these features work correctly:
- [ ] Login/signup flow
- [ ] CEO dashboard loads without errors
- [ ] CTO dashboard loads without errors
- [ ] Department data upload
- [ ] File management
- [ ] Resource sharing between roles
- [ ] Navigation between views

## Remaining Work (Phase 2-12)

After database is stabilized, continue with:

**Phase 2**: Authentication & Profile Management
- Test multi-user scenarios
- Verify role-based access control
- Test profile updates and preferences

**Phase 3**: API Integration Layer
- Configure Monday.com integration
- Set up Microsoft Teams webhooks
- Test ticketing system integration

**Phase 4**: Performance Optimization
- Implement React Query optimizations
- Add loading skeletons
- Optimize bundle size

**Phase 5-12**: Testing, deployment pipeline, monitoring, documentation, etc.

## Troubleshooting

### If tables still don't exist after migration:

```sql
-- Check if migrations were applied
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 10;
```

### If RLS policies are blocking access:

```sql
-- Temporarily check if data exists (as service role)
SELECT COUNT(*) as workspace_count FROM workspaces;
SELECT COUNT(*) as profile_count FROM profiles;
```

### If console errors persist:

1. Check browser Network tab for failed requests
2. Verify Supabase project URL and anon key in `.env`
3. Check Supabase Dashboard > Logs for server-side errors
4. Verify user has proper profile with org_id set

## Success Criteria

You'll know the migrations were successful when:
1. ✅ No 500/404 errors in console
2. ✅ Both CEO and CTO dashboards load data
3. ✅ User can navigate between all views
4. ✅ Upload functionality works
5. ✅ Resource sharing works between roles
6. ✅ Console only shows intentional log messages

## Support

If you encounter issues:
1. Check the verification queries above
2. Review Supabase Dashboard logs
3. Check browser console for specific error messages
4. Verify `.env` configuration matches Supabase project
