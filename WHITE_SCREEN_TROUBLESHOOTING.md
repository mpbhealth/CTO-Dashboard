# White Screen Troubleshooting Guide

This guide will help you diagnose and fix white screen issues in the MPB Health Dashboard application.

## Quick Fix (Try This First)

1. **Clear All Caches and Reload**
   - Press `F12` to open browser console
   - Type `clearAllCaches()` and press Enter
   - The page will reload automatically

2. **Check Browser Console**
   - Press `F12` to open Developer Tools
   - Click on the **Console** tab
   - Look for red error messages
   - Take note of any errors you see

## Diagnostic Tools

### Built-in Diagnostic Commands

Open your browser console (F12) and use these commands:

```javascript
// Run comprehensive diagnostics
diagnoseWhiteScreen()

// Clear all caches and service workers
clearAllCaches()

// Clear only authentication cache
clearAuthCache()
```

### Access Diagnostic Dashboard

Visit the diagnostic dashboard in your browser:
- **URL**: `/diagnostics/system`
- **Example**: `http://localhost:5173/diagnostics/system`

This dashboard provides:
- Real-time system health checks
- Environment configuration validation
- Supabase connection status
- Authentication state verification
- Cache and storage analysis
- Visual report of all checks

## Common Issues and Solutions

### 1. White Screen After Login

**Symptoms**: Application loads but shows blank white screen after successful login

**Possible Causes**:
- Missing or invalid user profile
- User role not set in database
- Routing configuration issue

**Solutions**:
1. Open browser console and run: `diagnoseWhiteScreen()`
2. Check the "Authentication" section for failures
3. Verify your user has a role in the profiles table:
   ```sql
   SELECT * FROM profiles WHERE id = 'your-user-id';
   ```
4. If role is missing, update it:
   ```sql
   UPDATE profiles SET role = 'ceo' WHERE id = 'your-user-id';
   ```

### 2. White Screen on Initial Load

**Symptoms**: Nothing appears when visiting the application URL

**Possible Causes**:
- Environment variables not configured
- Supabase connection failure
- Service worker issues
- Build/deployment problems

**Solutions**:
1. Check environment variables:
   - Open `.env` file
   - Verify `VITE_SUPABASE_URL` is set
   - Verify `VITE_SUPABASE_ANON_KEY` is set
   - Ensure URL starts with `https://` and includes `supabase.co`

2. Clear service worker cache:
   ```javascript
   clearAllCaches()
   ```

3. Test in incognito/private mode to bypass cache

4. Check network tab in DevTools for failed requests

### 3. White Screen After Deployment

**Symptoms**: Application works locally but shows white screen when deployed

**Possible Causes**:
- Environment variables not set in deployment
- Asset loading failures
- Incorrect base URL configuration
- CORS issues

**Solutions**:
1. Verify environment variables are set in your deployment platform (Netlify, Vercel, etc.)
2. Check browser console for 404 errors on assets
3. Verify `_redirects` file exists in `public/` folder
4. Check that Supabase project is active and not paused

### 4. White Screen with Console Errors

**Symptoms**: White screen with JavaScript errors in console

**Possible Causes**:
- React component error
- Missing dependencies
- Syntax errors in code
- Network request failures

**Solutions**:
1. Read the error message carefully
2. Check the error stack trace for the failing component
3. Run diagnostics: `diagnoseWhiteScreen()`
4. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Step-by-Step Diagnostic Process

### Step 1: Initial Check
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Note the current URL path

### Step 2: Run Diagnostics
```javascript
diagnoseWhiteScreen()
```

Look for **failed checks** (marked with ❌):
- Environment Configuration
- Supabase Connection
- Authentication
- Browser APIs
- Cache and Storage
- DOM and Assets
- Routing

### Step 3: Identify the Problem Category

#### Environment Issues
- Missing environment variables
- Invalid Supabase URL or key
- Production mode without proper config

**Fix**: Update `.env` file with correct values

#### Authentication Issues
- No active session
- Missing user profile
- Role not set

**Fix**: Login again or update profile in database

#### Cache Issues
- Stale service worker
- Old cached data
- Conflicting localStorage

**Fix**: Run `clearAllCaches()`

#### Database Issues
- Cannot connect to Supabase
- RLS policies blocking access
- Missing tables or columns

**Fix**: Check Supabase dashboard, verify RLS policies

#### Routing Issues
- Unknown route
- Protected route without authentication
- Invalid redirect logic

**Fix**: Navigate to a known route like `/login`

### Step 4: Apply the Fix

Based on the diagnostic results, apply the appropriate solution from above.

### Step 5: Verify the Fix

1. Run diagnostics again: `diagnoseWhiteScreen()`
2. Verify all checks pass (marked with ✅)
3. Test navigation to different pages
4. Check that data loads correctly

## Advanced Troubleshooting

### Check Supabase Connection Manually

```javascript
// In browser console
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('Error:', error);
```

### Inspect Profile Data

```javascript
// In browser console
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', 'YOUR_USER_ID')
  .single();
console.log('Profile:', profile);
console.log('Error:', error);
```

### Check Local Storage

```javascript
// View all localStorage entries
Object.keys(localStorage).forEach(key => {
  console.log(key, ':', localStorage.getItem(key));
});
```

### Verify Environment Variables

```javascript
// In browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Environment Mode:', import.meta.env.MODE);
```

## Browser-Specific Issues

### Chrome/Edge
- Clear site data: DevTools → Application → Clear Storage
- Disable extensions: Try in incognito mode
- Check CORS: Network tab → Failed request → Response headers

### Firefox
- Clear cookies and site data: Settings → Privacy & Security
- Disable tracking protection for the site
- Check console for security warnings

### Safari
- Clear website data: Safari → Preferences → Privacy
- Enable Developer tools: Safari → Preferences → Advanced
- Check for private browsing mode restrictions

## Still Having Issues?

If you've tried all the steps above and still see a white screen:

1. **Check the browser console** and copy any error messages
2. **Run diagnostics** and note which checks failed
3. **Check the network tab** for failed requests (look for 4xx or 5xx errors)
4. **Verify Supabase status**: Check if your Supabase project is active
5. **Try a different browser** to rule out browser-specific issues
6. **Check your internet connection**
7. **Review recent code changes** if this started happening after a deployment

## Diagnostic Report Interpretation

When you run `diagnoseWhiteScreen()`, you'll see output like this:

```
🔍 White Screen Diagnostic Report

📋 Environment Configuration
  ✅ Environment Mode: Running in development mode
  ✅ Supabase Configuration: Supabase is properly configured
  ✅ Base URL: Base URL: /

📋 Supabase Connection
  ✅ Supabase Session Check: Successfully connected to Supabase
  ✅ Profiles Table Access: Profiles table is accessible

📋 Authentication
  ⚠️  Auth Session: No active session (user not logged in)
  ✅ Profile Cache: 1 cached profile(s) found

📊 Summary
  Total checks: 15
  ✅ Passed: 12
  ⚠️  Warnings: 3
  ❌ Failed: 0
```

### What to Look For:
- **❌ Failed checks**: These are critical issues that need immediate attention
- **⚠️  Warnings**: These might cause issues but aren't blocking
- **✅ Passed**: These are working correctly

Focus on fixing failed checks first, then address warnings if problems persist.

## Prevention Tips

To avoid white screen issues in the future:

1. **Always test locally before deploying**
2. **Verify environment variables are set in production**
3. **Test in multiple browsers**
4. **Clear cache after major updates**
5. **Monitor browser console for warnings**
6. **Keep dependencies up to date**
7. **Test with real user accounts, not just admin**
8. **Verify Supabase RLS policies allow data access**

## Getting Help

If you need additional assistance:

1. Copy the diagnostic report from the console
2. Note your browser version and operating system
3. Describe what you were doing when the issue occurred
4. Include any error messages from the console
5. Share screenshots if helpful
