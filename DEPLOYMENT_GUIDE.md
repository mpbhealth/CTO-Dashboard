# MPB Health Dashboard - Deployment Guide

## White Screen Fix Applied ✅

The white screen issue on deployed sites has been fixed. The application now shows a helpful configuration screen instead of crashing when Supabase credentials are not set.

---

## Quick Setup for Netlify

### 1. Set Environment Variables

In your Netlify dashboard:
1. Go to **Site Settings** → **Environment Variables**
2. Add these required variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Get Supabase Credentials

1. Visit [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`

### 3. Deploy

After adding environment variables:
```bash
# Trigger a new deploy or redeploy
git push origin main
```

Or in Netlify dashboard:
- Go to **Deploys** → **Trigger Deploy** → **Deploy Site**

---

## What Was Fixed

### Issue 1: Production Crash
**Before**: App threw an error and showed white screen when Supabase wasn't configured
```javascript
// Old code - crashed the app
throw new Error('CRITICAL: Supabase is not configured');
```

**After**: App shows helpful configuration screen
```javascript
// New code - warns but doesn't crash
console.error('[Supabase] WARNING: Not configured');
// Shows ConfigurationCheck component with setup instructions
```

### Issue 2: No User Guidance
**Before**: Users saw a white screen with no explanation

**After**: Users see a beautiful configuration screen with:
- Clear explanation of what's needed
- Step-by-step setup instructions
- Direct links to find credentials
- Reload button after adding variables

### Issue 3: TDZ Errors in Global Handler
**Before**: Error logging could trigger "before initialization" errors

**After**:
- Errors filtered to prevent TDZ recursion
- Defensive try-catch around error logging
- Specific check for initialization errors

---

## Deployment Platforms

### Netlify (Recommended)

Already configured in `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Environment Variables**: Site Settings → Environment Variables

### Vercel

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Environment Variables**: Project Settings → Environment Variables

### Generic Static Host

1. Build locally:
```bash
npm run build
```

2. Upload `dist/` folder contents

3. Ensure environment variables are set at build time

---

## Verification Checklist

After deployment:

- [ ] Site loads without white screen
- [ ] If not configured: Shows configuration screen (not error)
- [ ] If configured: Shows login page
- [ ] Can log in with valid credentials
- [ ] Dashboard loads data from Supabase
- [ ] No console errors related to initialization

---

## Troubleshooting

### Still seeing white screen?

1. **Check Browser Console** (F12)
   - Look for any red errors
   - Check Network tab for failed requests

2. **Verify Environment Variables**
   ```bash
   # In Netlify CLI
   netlify env:list
   ```
   - Must start with `VITE_` prefix
   - Must be set before build (not after)

3. **Clear Deployment Cache**
   - Netlify: Site Settings → Build & Deploy → Clear cache and retry deploy
   - Vercel: Deployments → ... → Redeploy

4. **Check Build Logs**
   - Look for build errors
   - Verify variables are available during build

### Configuration screen not showing?

If you see white screen instead of configuration screen:
1. Check browser console for JavaScript errors
2. Verify the build completed successfully
3. Clear browser cache and hard reload (Ctrl+Shift+R)

### Login not working?

1. Verify Supabase credentials are correct
2. Check Supabase dashboard for any service issues
3. Ensure your Supabase project has the correct schema (run migrations)

---

## Architecture Notes

### Error Handling Flow

```
Application Start
    ↓
ConfigurationCheck Component
    ↓
Is Supabase configured? → NO → Show Configuration Screen
    ↓ YES
ErrorBoundary
    ↓
AuthProvider
    ↓
Application Routes
```

### Build Output

Optimized chunks:
- `react-vendor` - React core (225 KB)
- `supabase-client` - Database client (150 KB)
- `charts` - Recharts library (298 KB)
- `vendor` - Other dependencies (1.4 MB)

Total bundle size: ~2 MB (compressed: ~700 KB)

---

## Support

If issues persist:
1. Check build logs in deployment platform
2. Review browser console errors
3. Verify Supabase connection from console:
   ```javascript
   // Test in browser console
   const { data } = await supabase.from('profiles').select('*').limit(1);
   console.log(data);
   ```

---

**Last Updated**: 2025-10-31
**Build Status**: ✅ Passing
**White Screen Fix**: ✅ Applied
