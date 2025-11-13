# Netlify White Screen Fix Guide

## Problem
After deploying to Netlify with environment variables set, the app shows a white screen with no errors in the console.

## Environment Variables (Confirmed Set)
```
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Solutions Applied

### 1. Added `_redirects` File
**File:** `public/_redirects`

This ensures Netlify properly handles client-side routing for the SPA:
```
/assets/*  200
/favicon.svg  200
/manifest.json  200
/robots.txt  200
/sw.js  200
/*  /index.html  200
```

### 2. Added Initial Loading Indicator
**File:** `index.html`

Added a visible loading spinner in the root div that displays before React mounts. This helps identify if:
- The page is loading but React fails to mount
- The page isn't loading at all

### 3. Enhanced Production Logging
**File:** `src/main.tsx`

Added console logging to verify:
- Environment variables are present
- Supabase configuration is valid
- React is initializing

### 4. Node Version Specification
**File:** `netlify.toml`

Specified Node 18 to ensure consistent builds:
```toml
[build.environment]
  NODE_VERSION = "18"
```

### 5. Diagnostic Pages Created
- `/diagnostics.html` - Direct environment check (bypasses React)
- `/health.json` - Simple health check endpoint

## Troubleshooting Steps

### Step 1: Check Build Logs
1. Go to Netlify dashboard
2. Navigate to your site
3. Click on "Deploys"
4. Check the latest deploy log
5. Look for build errors or warnings

**Common Issues:**
- Build command fails
- Missing dependencies
- Environment variables not available during build

### Step 2: Verify Environment Variables
1. Go to Site settings > Environment variables
2. Verify both variables are set
3. Check for extra spaces or quotes
4. Variables must NOT have quotes around values
5. Click "Clear cache and redeploy"

**Correct format:**
```
Key: VITE_SUPABASE_URL
Value: https://xnijhggwgbxrtvlktviz.supabase.co

Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuaWpoZ2d3Z2J4cnR2bGt0dml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODYzNTEsImV4cCI6MjA3NTk2MjM1MX0.A5CrZLud-POLcHolFJkMQ0pePiRReIMuffuHVkO2Y-Y
```

### Step 3: Test Diagnostic Pages
Visit these URLs on your deployed site:

1. **`https://your-site.netlify.app/diagnostics.html`**
   - Tests environment without React
   - Shows browser capabilities
   - Can test Supabase connection

2. **`https://your-site.netlify.app/health.json`**
   - Simple health check
   - If this doesn't load, deployment failed

### Step 4: Check Browser Console
1. Open your deployed site
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for:
   - `[MPB Health] Production build initialized`
   - `[MPB Health] Supabase configured: true`
   - Any error messages

### Step 5: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload the page
4. Check if:
   - index.html loads (200 status)
   - CSS files load
   - JS files load
   - Any 404 or 500 errors

### Step 6: Clear Netlify Cache
Sometimes old builds get cached:

1. Go to Site settings > Build & deploy
2. Scroll to "Build settings"
3. Click "Clear cache"
4. Trigger a new deploy

Or use the CLI:
```bash
netlify deploy --prod --build
```

### Step 7: Check Supabase Connection
Run this in browser console on your site:

```javascript
// Test if env vars are available
console.log('URL available:', !!import.meta.env?.VITE_SUPABASE_URL);
console.log('Key available:', !!import.meta.env?.VITE_SUPABASE_ANON_KEY);

// Test Supabase connection
fetch('https://xnijhggwgbxrtvlktviz.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuaWpoZ2d3Z2J4cnR2bGt0dml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODYzNTEsImV4cCI6MjA3NTk2MjM1MX0.A5CrZLud-POLcHolFJkMQ0pePiRReIMuffuHVkO2Y-Y'
  }
})
.then(r => console.log('Supabase OK:', r.status))
.catch(e => console.error('Supabase Error:', e));
```

## Common Causes & Fixes

### Issue: White Screen with Spinner
**Cause:** React is not mounting or getting stuck in loading state
**Fix:**
- Check console for errors
- Verify environment variables are set correctly
- Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue: 404 on All Routes
**Cause:** SPA redirects not configured
**Fix:**
- Verify `public/_redirects` file exists
- Check netlify.toml has redirect rules
- Redeploy

### Issue: White Screen, No Spinner
**Cause:** Build failed or assets not loading
**Fix:**
- Check Netlify build logs
- Verify all assets deployed to dist/
- Check for missing files

### Issue: "Supabase not configured" Screen
**Cause:** Environment variables not available at runtime
**Fix:**
- Prefix must be `VITE_` for Vite to include them
- Redeploy after setting env vars
- Clear cache and redeploy

### Issue: Infinite Loading
**Cause:** Authentication or routing loop
**Fix:**
- Check AuthContext for infinite loops
- Verify ProtectedRoute logic
- Check for circular redirects

## Deployment Checklist

Before deploying:
- [ ] Environment variables set in Netlify (with VITE_ prefix)
- [ ] Build command is `npm run build`
- [ ] Publish directory is `dist`
- [ ] Node version specified (18 recommended)
- [ ] `_redirects` file in public/ directory
- [ ] No syntax errors (run `npm run lint`)
- [ ] Local build works (`npm run build && npm run preview`)

After deploying:
- [ ] Check build logs for errors
- [ ] Visit site - do you see loading spinner?
- [ ] Open console - any errors?
- [ ] Check Network tab - all assets loading?
- [ ] Visit /diagnostics.html - what does it show?
- [ ] Test authentication flow

## Quick Fix Commands

### Local Test Build
```bash
npm run build
npm run preview
# Visit http://localhost:4173
```

### Netlify CLI Deploy
```bash
npm install -g netlify-cli
netlify login
netlify link
netlify env:set VITE_SUPABASE_URL "https://xnijhggwgbxrtvlktviz.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-key-here"
netlify deploy --prod --build
```

### Clear Everything and Redeploy
```bash
# In Netlify UI:
# 1. Site settings > Build & deploy > Clear cache
# 2. Deploys > Trigger deploy > Clear cache and deploy site
```

## Still Not Working?

1. **Try Demo Mode:**
   Visit: `https://your-site.netlify.app/?demo_role=cto`
   This bypasses Supabase authentication

2. **Check Supabase Status:**
   Visit: https://status.supabase.com
   
3. **Verify Supabase Settings:**
   - Authentication enabled?
   - RLS policies configured?
   - API keys valid?

4. **Contact Support:**
   - Netlify support (for deployment issues)
   - Supabase support (for database/auth issues)

## Files Modified in This Fix

1. `public/_redirects` - NEW: SPA routing
2. `public/diagnostics.html` - NEW: Diagnostic page
3. `public/health.json` - NEW: Health check
4. `index.html` - Added loading spinner
5. `netlify.toml` - Added Node version
6. `src/main.tsx` - Added production logging
7. `NETLIFY_WHITE_SCREEN_FIX.md` - This guide

## Next Steps

After applying these fixes:

1. Commit all changes:
```bash
git add .
git commit -m "fix: netlify white screen - add redirects, diagnostics, and logging"
git push
```

2. Wait for Netlify to auto-deploy OR manually trigger deploy

3. Visit your site and check console for the logging messages

4. If still white screen, visit `/diagnostics.html` to see what's happening

5. Share the console output and diagnostic results if you need further help

