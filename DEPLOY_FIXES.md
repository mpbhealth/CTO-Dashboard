# Deploy Role Routing Fixes - Quick Guide

## What Got Fixed

1. **Sidebar flicker eliminated** - Profile loads from cache immediately
2. **Admin role works** - vrt@mympb.com has full access to CEO + CTO dashboards
3. **Auto profile creation** - New users automatically get profiles with correct roles
4. **No more routing loops** - Clean separation of auth/profile loading states

## Deploy Steps (5 Minutes)

### Step 1: Run the Migration

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy the contents of `supabase/migrations/20251029140000_fix_role_routing_and_profile_creation.sql`
3. Paste and click "Run"

**Option B: Via Supabase CLI**
```bash
supabase db push
```

### Step 2: Backfill Existing Users

Run this SQL in Supabase SQL Editor to create profiles for users who don't have them:

```sql
-- Create missing profiles
INSERT INTO public.profiles (id, email, display_name, role, org_id, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as display_name,
  public.infer_role_from_email(email) as role,
  NULL as org_id,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Set superuser flags for admin users
UPDATE public.profiles
SET is_superuser = true
WHERE email LIKE '%@mympb.com'
  AND (email LIKE 'vrt@%' OR email LIKE 'catherine@%' OR email LIKE 'vinnie%@%');
```

### Step 3: Deploy Frontend

**Option A: Netlify (Auto)**
```bash
git add .
git commit -m "Fix role routing and sidebar flicker"
git push origin main
```

**Option B: Manual Build**
```bash
npm run build
# Upload dist/ folder to your hosting
```

### Step 4: Clear User Caches

**For each user currently logged in:**
1. Have them log out
2. Clear browser localStorage
3. Log back in

**Or add this to your Login component temporarily:**
```typescript
// Clear all old profile caches on login
Object.keys(localStorage)
  .filter(key => key.startsWith('mpb_profile_cache'))
  .forEach(key => localStorage.removeItem(key));
```

## Verification Tests

### Test 1: Catherine (CEO)
```
✅ Login → Lands at /ceod/home
✅ CEO sidebar visible
✅ No flicker on page load
✅ Navigate to /ctod/home → Redirected back to /ceod/home
```

### Test 2: Vinnie (Admin)
```
✅ Login → Lands at /ctod/home
✅ CTO sidebar visible
✅ Navigate to /ceod/home → Allowed (admin access)
✅ Navigate to /ctod/home → Allowed (admin access)
✅ profile.is_superuser = true in database
```

### Test 3: New User Signup
```
✅ Sign up with test@example.com
✅ Profile automatically created
✅ Role = 'staff'
✅ No "Loading your profile..." infinite loop
```

### Test 4: Page Reload
```
✅ Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
✅ Correct sidebar renders immediately
✅ No flicker
✅ No wrong dashboard flash
```

## Rollback Plan

If anything breaks:

```sql
-- Drop new trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop new functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.infer_role_from_email(text);
DROP FUNCTION IF EXISTS public.current_role();
DROP FUNCTION IF EXISTS public.is_superuser();

-- Remove column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_superuser;
```

Then redeploy previous frontend version.

## Common Issues

### "Loading your profile..." Never Finishes
**Cause**: User has no profile row
**Fix**: Run the backfill SQL from Step 2

### Admin Can't Access CEO Dashboard
**Cause**: is_superuser not set, or RoleGuard blocking
**Fix**:
```sql
UPDATE public.profiles SET is_superuser = true WHERE email = 'vrt@mympb.com';
```

### Sidebar Still Flickers
**Cause**: Old cached data
**Fix**: Clear localStorage and hard refresh

### Wrong Role After Signup
**Cause**: Email pattern doesn't match inference rules
**Fix**: Manually set role:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
```

## Environment Variables

These should already be set in your `.env`:
```
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Next Login Flow

```
User logs in
   ↓
Supabase auth.getSession()
   ↓
Check localStorage for cached profile (instant)
   ↓
If cached → Render dashboard immediately (no flicker)
If not → Fetch from DB → Cache → Render
   ↓
Correct dashboard renders based on role
```

## Production Checklist

- [ ] Migration ran successfully (check Supabase logs)
- [ ] Backfill completed (verify `SELECT COUNT(*) FROM profiles` matches `SELECT COUNT(*) FROM auth.users`)
- [ ] Superuser flags set for admins
- [ ] Frontend deployed
- [ ] Catherine tested CEO access
- [ ] Vinnie tested admin access to both dashboards
- [ ] New signup tested
- [ ] Hard reload tested (no flicker)
- [ ] Console has no errors

## Support Commands

Check if user has profile:
```sql
SELECT * FROM public.profiles WHERE email = 'user@example.com';
```

Check user's role:
```sql
SELECT current_role() FROM public.profiles WHERE id = auth.uid();
```

Check superuser status:
```sql
SELECT is_superuser FROM public.profiles WHERE email = 'vrt@mympb.com';
```

List all profiles and roles:
```sql
SELECT email, role, is_superuser, created_at FROM public.profiles ORDER BY created_at DESC;
```

## Time Estimate

- Migration: 2 minutes
- Backfill: 1 minute
- Deploy: 2-5 minutes (auto via git push)
- Testing: 5 minutes

**Total: ~10 minutes**

## What to Tell Users

"We've optimized dashboard loading. Please log out, clear your browser cache, and log back in once to see the improvements. After that, the dashboard will load instantly with no flicker."
