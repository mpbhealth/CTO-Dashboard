# Debug: Stuck on Loading Screen

## 🔴 Issue
Site shows "Loading MPB Health Dashboard..." indefinitely - React is not mounting.

## 🔍 Immediate Diagnostics

### Step 1: Open Browser Console (F12)
Press **F12** and check the **Console** tab for errors.

Look for these messages:

#### ✅ Good Signs (React is trying to load):
```
[MPB Health] Initializing React application...
[MPB Health] Production build initialized
[MPB Health] Supabase configured: true/false
```

#### ❌ Bad Signs (Errors preventing load):
```
Failed to load module
Cannot find module
Uncaught SyntaxError
CORS error
Network error
Supabase error
```

### Step 2: Check Network Tab (F12 → Network)
1. Reload the page with Network tab open
2. Check if all files are loading:
   - ✅ `index.html` (200)
   - ✅ `/assets/*.js` files (200)
   - ✅ `/assets/*.css` files (200)
   - ❌ Any 404 or 500 errors?

### Step 3: Common Causes & Quick Fixes

#### Cause 1: JavaScript Not Loading
**Symptoms:** No console messages at all
**Fix:**
```bash
# Clear Netlify cache and redeploy
# In Netlify UI: Deploys → Trigger deploy → Clear cache and deploy site
```

#### Cause 2: Supabase Connection Failing
**Symptoms:** Console shows Supabase errors
**Fix:** Check environment variables are set correctly in Netlify

#### Cause 3: Authentication Loop
**Symptoms:** Loading forever, no errors
**Fix:** Try demo mode:
```
https://your-site.netlify.app/?demo_role=cto
```

#### Cause 4: React Initialization Error
**Symptoms:** Error in console about React or modules
**Fix:** Check build logs for build-time errors

### Step 4: Test Diagnostic Page
Visit: `https://your-site.netlify.app/diagnostics.html`

This bypasses React completely and tests:
- Environment variables
- Browser capabilities
- Supabase connection (click "Test Supabase Connection")

## 🛠️ Quick Fixes to Try

### Fix 1: Add Loading Timeout & Fallback
We can add a timeout that shows an error if loading takes too long.

