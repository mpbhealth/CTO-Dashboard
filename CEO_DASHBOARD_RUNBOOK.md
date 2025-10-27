# CEO Dashboard Runbook

## Overview

The CEO Dashboard provides Catherine Okubo with a comprehensive executive view of MPB Health's key business metrics, operations, and strategic initiatives. This runbook covers setup, troubleshooting, and maintenance procedures.

## Architecture

### Routes

The CEO Dashboard uses the new dual dashboard system with dedicated routes:

- `/ceod/home` - Executive overview with all key panels
- `/ceod/marketing` - Marketing suite (campaigns, budget, calendar)
- `/ceod/concierge/tracking` - Member concierge metrics
- `/ceod/concierge/notes` - Concierge activity log
- `/ceod/sales/reports` - Sales pipeline and advisor performance
- `/ceod/operations/overview` - Operations and ticket metrics
- `/ceod/files` - Document management
- `/ceod/data` - Data import tools
- `/ceod/board` - Board packet builder

Legacy CEO routes (`/ceo/*`) are maintained for backward compatibility but use the older CEOApp component.

### Components

#### Layouts
- `CEODashboardLayout` - Main layout with nav, header, and role badge

#### Panels (with Error Boundaries)
- `ExecutiveOverviewPanel` - MRR, new members, churn, claims paid
- `ConciergePanel` - Tickets, SLA metrics, recent activity
- `SalesPanel` - Pipeline stages, top advisors, close rates
- `OperationsPanel` - Open tickets by queue, aging, escalations
- `FinancePanel` - AR/AP, payouts, revenue vs expenses trend
- `CompliancePanel` - HIPAA audits, findings, backup verification

#### Error Handling
- `CEOErrorBoundary` - Comprehensive error boundary with retry logic

### Data Flow

```
CEOHome.tsx
  → useQuery hooks (from @tanstack/react-query)
    → Data loaders in /src/lib/data/ceo/loaders.ts
      → Supabase queries OR mock data fallback
        → Panel components display data
```

## Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required for live data
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Use mock data for development
VITE_USE_MOCK_DATA=false

# Optional: Development mode
VITE_DEVELOPMENT_MODE=true
```

### 2. Database Setup

The CEO dashboard requires the following Supabase tables:

#### Required Tables
- `profiles` - User profiles with role assignment
- `orgs` - Organization data
- `workspaces` - CEO workspace
- `resources` - Files and documents
- `audit_logs` - Activity tracking

#### Optional Tables for Real Data
- `ceo_kpis` - Executive KPI metrics
- `concierge_metrics` - Concierge performance data
- `sales_metrics` - Sales pipeline data
- `operations_metrics` - Operations and ticket data
- `finance_metrics` - Financial data
- `compliance_metrics` - Compliance status

If these tables don't exist, the dashboard will automatically fall back to mock data.

### 3. User Role Setup

Ensure CEO users have the correct role in the `profiles` table:

```sql
-- Set Catherine Okubo as CEO
UPDATE profiles
SET role = 'ceo',
    display_name = 'Catherine Okubo'
WHERE email = 'catherine@mpbhealth.com';
```

### 4. Row Level Security (RLS)

Verify RLS policies allow CEO users to access their dashboard:

```sql
-- Check if CEO can read profiles
SELECT * FROM profiles WHERE role = 'ceo';

-- Check workspace access
SELECT * FROM workspaces WHERE kind = 'CEO';
```

## Authentication Flow

1. User logs in at `/login`
2. `AuthContext` loads user profile and role from `profiles` table
3. `AuthWrapper` detects `role === 'ceo'`
4. User is redirected to `/ceod/home`
5. `CEOOnly` guard validates access on all `/ceod/*` routes
6. Non-CEO users attempting to access are redirected to `/ctod/home` or shown 403 page

## Troubleshooting

### White Screen / Blank Dashboard

**Symptoms:** Page loads but shows nothing, or infinite loading spinner

**Causes & Solutions:**

1. **Profile not loaded**
   - Check browser console for `[AuthContext]` logs
   - Verify user exists in `profiles` table
   - Clear cookies and reload: `document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); window.location.reload();`

2. **Supabase connection failure**
   - Verify `.env` variables are correct
   - Check Supabase project status
   - Test connection in browser console: `await supabase.auth.getUser()`
   - Fallback: Set `VITE_USE_MOCK_DATA=true` in `.env`

3. **RLS policy blocking data**
   - Check RLS policies in Supabase dashboard
   - Test query directly: `await supabase.from('profiles').select('*').maybeSingle()`
   - Temporarily disable RLS for debugging (NOT in production)

4. **JavaScript error in panel component**
   - Open browser DevTools Console
   - Look for error stack traces
   - Error boundaries should catch and display errors
   - Check `[CEO Data]` logs for data loading issues

5. **Circular dependency or import issue**
   - Check browser console for import errors
   - Run `npm run build` to see build-time errors
   - Look for circular imports between components

### Panels Show "Unable to load" Error

**Symptoms:** Individual panels display error message instead of data

**Causes & Solutions:**

1. **Data loader exception**
   - Check console for `[CEO Data]` error logs
   - Verify Supabase queries in `/src/lib/data/ceo/loaders.ts`
   - Test queries directly in Supabase SQL editor

2. **Mock data not loading**
   - Verify `/src/lib/data/ceo/mockData.ts` exports correctly
   - Check for TypeScript errors: `npm run build`

3. **Query timeout**
   - Increase staleTime in query config
   - Check Supabase performance and scaling
   - Add indexes to queried tables

### Role-Based Access Issues

**Symptoms:** CEO user redirected away from `/ceod/*` routes

**Causes & Solutions:**

1. **Role not set correctly**
   ```sql
   -- Check user's role
   SELECT user_id, email, role FROM profiles WHERE email = 'user@example.com';

   -- Fix role if incorrect
   UPDATE profiles SET role = 'ceo' WHERE email = 'user@example.com';
   ```

2. **Role cookie not set**
   - Check cookies in DevTools: Look for `role` cookie
   - Force refresh role: `await refreshRole()` in console
   - Clear cookies and re-login

3. **ProtectedRoute guard blocking**
   - Check `allowedRoles` prop in main.tsx
   - Verify `CEOOnly` component allows 'ceo' and 'admin' roles
   - Check console logs: `[RoleGuard]` and `[ProtectedRoute]`

### Performance Issues

**Symptoms:** Dashboard loads slowly or feels sluggish

**Solutions:**

1. **Enable query caching**
   - Verify `staleTime` is set appropriately (5-10 min for most queries)
   - Check React Query devtools for cache hits

2. **Reduce data loaded**
   - Add `limit()` to Supabase queries
   - Implement pagination for large datasets
   - Use `select()` to fetch only needed columns

3. **Optimize chart rendering**
   - Reduce data points in charts (sample or aggregate)
   - Use `ResponsiveContainer` minHeight to prevent layout shifts
   - Lazy load chart libraries

## Monitoring & Logging

### Browser Console Logs

Key log prefixes to monitor:

- `[CEO Data]` - Data loading operations
- `[AuthContext]` - Authentication state changes
- `[RoleGuard]` - Access control decisions
- `[getCurrentProfile]` - Profile fetch operations

### Error Logging

Errors are automatically logged with structured metadata:

```typescript
{
  timestamp: string,
  error: string,
  stack: string,
  url: string,
  userAgent: string,
  role?: string,
}
```

### Audit Logs

All CEO dashboard actions are logged to `audit_logs` table:

```sql
-- View recent CEO activity
SELECT * FROM audit_logs
WHERE actor_profile_id IN (
  SELECT user_id FROM profiles WHERE role = 'ceo'
)
ORDER BY created_at DESC
LIMIT 50;
```

## Maintenance

### Adding New KPIs

1. Add KPI to `ExecutiveKPIs` type in `/src/lib/data/ceo/types.ts`
2. Add mock data in `/src/lib/data/ceo/mockData.ts`
3. Update loader in `/src/lib/data/ceo/loaders.ts` to fetch real data
4. Update `ExecutiveOverviewPanel` to display new KPI

### Adding New Panels

1. Create panel component in `/src/components/ceo/panels/YourPanel.tsx`
2. Add data types to `/src/lib/data/ceo/types.ts`
3. Add mock data to `/src/lib/data/ceo/mockData.ts`
4. Create loader function in `/src/lib/data/ceo/loaders.ts`
5. Import and render in `CEOHome.tsx` with `<CEOErrorBoundary>` and `<Suspense>`

### Updating Mock Data

Mock data is stored in `/src/lib/data/ceo/mockData.ts`. Update values to reflect realistic business metrics for demos and development.

## Testing

### Smoke Tests

```bash
# Run type checking
npm run build

# Check for console errors
# 1. Open browser to http://localhost:5173
# 2. Login as CEO user
# 3. Open DevTools Console
# 4. Navigate to /ceod/home
# 5. Verify no errors in console
# 6. Check all panels load successfully
```

### Role Testing

Test role-based access:

1. Login as CEO user → Should go to `/ceod/home`
2. Try accessing `/ctod/home` as CEO → Should be redirected or see 403
3. Login as CTO user → Should go to `/ctod/home`
4. Try accessing `/ceod/home` as CTO → Should see 403 page

### Data Loading Tests

Test each panel with:

1. Mock data enabled (`VITE_USE_MOCK_DATA=true`)
2. Supabase connection (real data)
3. Supabase connection failure (disconnect network)
4. Empty data (no records in tables)

## Common Tasks

### Reset CEO User Session

```bash
# In browser console
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
window.location.href = '/';
```

### Force Refresh Dashboard Data

```bash
# In browser console (when on /ceod/home)
window.location.reload();

# Or use React Query devtools to invalidate queries
```

### Check Current User Role

```bash
# In browser console
const { data } = await supabase.auth.getUser();
console.log('User:', data.user?.email);

const { data: profile } = await supabase
  .from('profiles')
  .select('role, display_name')
  .eq('user_id', data.user?.id)
  .maybeSingle();
console.log('Profile:', profile);
```

## Emergency Procedures

### Dashboard Completely Down

1. Check Supabase status: https://status.supabase.com
2. Enable mock data mode: Set `VITE_USE_MOCK_DATA=true` in `.env`
3. Restart dev server: `npm run dev`
4. Deploy fallback version without Supabase dependency

### Critical Data Issue

1. Stop any data import operations
2. Check `audit_logs` for recent changes
3. Restore from Supabase backup if needed
4. Document incident in audit log

### Security Incident

1. Immediately revoke affected user access
2. Check `audit_logs` for unauthorized activity
3. Rotate Supabase keys if compromised
4. Update `.env` and redeploy

## Support Contacts

- **Technical Issues:** Vinnie Champion (CTO) - vinnie@mpbhealth.com
- **Supabase Support:** support@supabase.io
- **Emergency:** Follow incident response plan

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Project README](./README.md)
- [Dual Dashboard README](./DUAL_DASHBOARD_README.md)
