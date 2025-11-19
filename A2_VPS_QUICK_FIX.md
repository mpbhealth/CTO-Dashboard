# Quick Fix for A2 VPS Deployment Issues

## Your Specific Errors - Solutions

### Error 1: 404 on `/login` and `/callback`
**Cause:** Apache not configured for SPA routing

**Fix:**
```bash
# Verify .htaccess exists in your deployment root
ls -la /home/username/public_html/.htaccess

# If missing, the file is now in dist/.htaccess after build
# It will be uploaded with your next deployment
```

### Error 2: Supabase 400 Error
**Cause:** Most likely wrong environment variables or HTTP instead of HTTPS

**Fix Steps:**

1. **Verify HTTPS is working:**
   ```bash
   curl -I https://yourdomain.com
   # Should show: HTTP/2 200
   ```

2. **Check environment variables were embedded:**
   ```bash
   # After building, check your dist files contain real values
   grep -r "supabase.co" dist/assets/*.js | head -1
   # Should show: your-project-id.supabase.co
   ```

3. **Rebuild with correct env vars:**
   ```bash
   # Make sure .env exists with correct values
   cat .env

   # Should show:
   # VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
   # VITE_SUPABASE_ANON_KEY=eyJhbGc...

   # Clean build
   rm -rf dist
   npm run build
   ```

### Error 3: Auth Timeout
**Cause:** RLS policies blocking profile access

**Fix - Run in Supabase SQL Editor:**
```sql
-- Check if policy exists
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Create policy if missing
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Alternative: Allow all authenticated users (if needed)
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);
```

---

## Fast Deployment Steps

### 1. Prepare Build Locally

```bash
# Ensure .env has correct Supabase credentials
cat .env

# Install and build
npm install
npm run build

# Verify .htaccess is in dist
ls -la dist/.htaccess
```

### 2. Upload to A2 VPS

```bash
# Using SCP (replace with your details)
scp -r dist/* username@your-server-ip:/home/username/public_html/

# OR using Rsync (recommended)
rsync -avz --delete dist/ username@your-server-ip:/home/username/public_html/
```

### 3. Set Permissions (SSH into server)

```bash
cd /home/username/public_html/

# Fix permissions
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# Verify .htaccess exists and is readable
ls -la .htaccess
```

### 4. Enable mod_rewrite (if needed)

```bash
# Check if mod_rewrite is enabled
apachectl -M | grep rewrite

# If not listed, enable it
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 5. Test

Visit these URLs in your browser:

- `https://yourdomain.com` - Homepage should load
- `https://yourdomain.com/login` - Should show login page, not 404
- `https://yourdomain.com/?demo_role=cto` - Should load CTO dashboard in demo mode

---

## Troubleshooting Commands

### Check if HTTPS is working:
```bash
curl -I https://yourdomain.com
```

### Check Apache logs for errors:
```bash
tail -f /var/log/apache2/error.log
```

### Check what's actually deployed:
```bash
ls -la /home/username/public_html/
cat /home/username/public_html/.htaccess
```

### Clear Service Worker (in browser console):
```javascript
navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
caches.keys().then(k => k.forEach(key => caches.delete(key)));
location.reload();
```

---

## Still Having Issues?

### Check Browser Console

Press F12, look for these specific errors:

1. **"Failed to load resource: 400"** on Supabase URL
   - **Fix:** Rebuild with correct `.env` file
   - Verify HTTPS is working

2. **"Auth timeout"**
   - **Fix:** Check Supabase RLS policies (see SQL above)

3. **"404 Not Found"** on routes
   - **Fix:** Check `.htaccess` exists and mod_rewrite is enabled

### Visit Diagnostics Page

Go to: `https://yourdomain.com/diagnostics.html`

This page will show:
- Supabase configuration status
- Network connectivity
- Service Worker status
- Allows you to test connection

### Use Demo Mode

Bypass Supabase authentication temporarily:
```
https://yourdomain.com/?demo_role=cto
```

If demo mode works but real auth doesn't, the issue is definitely Supabase-related (env vars or RLS policies).

---

## Environment Variables Template

Create `.env` in your project root before building:

```bash
# Get these from: https://supabase.com/dashboard → Your Project → Settings → API

VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
VITE_PUBLIC_UPLOAD_TOKEN=your-token-here
VITE_USE_MOCK_DATA=false
```

**CRITICAL:** These variables MUST be set BEFORE running `npm run build`. They get embedded into the JavaScript files during build time.

---

## Quick Checklist

Before asking for help, verify:

- [ ] HTTPS is working (not HTTP)
- [ ] `.env` file exists with correct Supabase credentials
- [ ] Built with `npm run build` AFTER setting env vars
- [ ] Uploaded entire `dist/` folder to server
- [ ] `.htaccess` file exists in web root
- [ ] mod_rewrite Apache module is enabled
- [ ] File permissions are correct (755 for dirs, 644 for files)
- [ ] Checked browser console for specific error messages
- [ ] Visited `/diagnostics.html` page for status check

---

## Need More Help?

1. Check the comprehensive guide: `A2_VPS_DEPLOYMENT_GUIDE.md`
2. Review Supabase logs in dashboard
3. Check server logs: `tail -f /var/log/apache2/error.log`
4. Contact A2 Support for server-specific issues

**Most common issue:** Environment variables not set before building. Rebuild after creating proper `.env` file!
