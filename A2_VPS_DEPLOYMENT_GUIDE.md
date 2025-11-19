# A2 VPS Deployment Guide - MPB Health Dashboard
**Complete Step-by-Step Guide for Deploying to A2 Hosting VPS**

---

## Prerequisites

Before you begin, ensure you have:
- [x] A2 Hosting VPS account with SSH access
- [x] Node.js 18+ installed on your local machine
- [x] Git installed (if deploying from repository)
- [x] Supabase project created with database configured
- [x] Domain name pointed to your A2 VPS IP address

---

## Part 1: Local Build Preparation

### Step 1: Set Environment Variables

Create a `.env` file in your project root (do NOT commit this to Git):

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
VITE_PUBLIC_UPLOAD_TOKEN=your-upload-token
VITE_USE_MOCK_DATA=false
```

**Where to find these values:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon/public** key → `VITE_SUPABASE_ANON_KEY`

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build for Production

```bash
# Clean previous build
rm -rf dist

# Build with environment variables
npm run build
```

**Verify the build:**
- Check that `dist/` folder was created
- Look for files like `dist/index.html` and `dist/assets/`
- Verify environment variables are embedded (not placeholders)

```bash
# Quick check - should show your Supabase URL
grep -r "supabase.co" dist/assets/*.js | head -1
```

---

## Part 2: Determine Your Web Server Type

### Check Which Web Server A2 VPS Uses

SSH into your server and run:

```bash
# Check for Apache
systemctl status apache2
# OR
systemctl status httpd

# Check for Nginx
systemctl status nginx
```

- If you see **Apache/httpd running** → Use Apache instructions (Section 3A)
- If you see **Nginx running** → Use Nginx instructions (Section 3B)
- Most A2 VPS accounts use **Apache** by default

---

## Part 3A: Apache Configuration (Most Common)

### Step 1: Upload Files

Using your preferred method (FTP, SCP, SFTP):

```bash
# Using SCP from your local machine
scp -r dist/* username@your-server-ip:/home/username/public_html/

# OR using rsync (recommended)
rsync -avz --progress dist/ username@your-server-ip:/home/username/public_html/
```

**Important paths:**
- cPanel users: `/home/username/public_html/`
- Non-cPanel: Often `/var/www/html/` or `/var/www/yourdomain.com/`

### Step 2: Set File Permissions

SSH into your server:

```bash
cd /home/username/public_html/

# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;
```

### Step 3: Verify .htaccess File

The build process should have included `.htaccess` in your `dist/` folder. Verify it's present:

```bash
ls -la /home/username/public_html/.htaccess
```

If missing, the `.htaccess` file is in your project's `public/` folder and should be copied to the root of your deployment:

```bash
# Content of .htaccess (already in your project)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Step 4: Enable mod_rewrite (if not already enabled)

```bash
# Check if mod_rewrite is enabled
apachectl -M | grep rewrite

# If not listed, enable it (requires sudo)
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Step 5: Configure Virtual Host (if needed)

If using a subdomain or custom domain, ensure your Apache VirtualHost allows `.htaccess` overrides:

```bash
sudo nano /etc/apache2/sites-available/yourdomain.conf
```

Add or verify:

```apache
<Directory /home/username/public_html>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

Restart Apache:

```bash
sudo systemctl restart apache2
```

---

## Part 3B: Nginx Configuration (Alternative)

### Step 1: Upload Files

```bash
# Upload to your web root
rsync -avz --progress dist/ username@your-server-ip:/var/www/yourdomain.com/
```

### Step 2: Configure Nginx

Edit your site configuration:

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Use the configuration from `nginx.conf.example` in your project root. Key sections:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    root /var/www/yourdomain.com;
    index index.html;

    # SPA routing - send all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}
```

### Step 3: Enable Site and Restart Nginx

```bash
# Create symlink if not exists
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Part 4: SSL/HTTPS Configuration (CRITICAL for Supabase)

**Supabase REQUIRES HTTPS in production.** HTTP will cause authentication failures.

### Option 1: Using Let's Encrypt (Free, Recommended)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-apache  # For Apache
# OR
sudo apt install certbot python3-certbot-nginx   # For Nginx

# Obtain and install certificate
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com  # Apache
# OR
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com   # Nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: A2 Hosting AutoSSL

If your A2 account has AutoSSL enabled (cPanel accounts):
1. Log into cPanel
2. Go to **SSL/TLS Status**
3. Click **Run AutoSSL** for your domain
4. Wait for certificate installation

### Verify HTTPS Works

```bash
# Test from your local machine
curl -I https://yourdomain.com

# Should return:
# HTTP/2 200
# (not HTTP/1.1 301 or errors)
```

---

## Part 5: Supabase Configuration

### Step 1: Add Your Domain to Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Scroll to **API Settings**
5. Add your domain to allowed origins (if there's a CORS section)

### Step 2: Verify RLS Policies

Run these queries in Supabase SQL Editor:

```sql
-- Check if profiles table exists
SELECT * FROM profiles LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- If no policies exist, create them:
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Step 3: Test Database Connection

From your deployed site's browser console (F12):

```javascript
// Should show your Supabase URL
console.log(window.location.origin);

// Check if auth works (look for errors)
// The app will attempt this automatically on load
```

---

## Part 6: Troubleshooting Common Issues

### Issue 1: 404 Errors on Routes

**Symptom:** `/login` or `/ceod/home` shows 404

**Fix for Apache:**
```bash
# Verify .htaccess exists
ls -la /home/username/public_html/.htaccess

# Check mod_rewrite is enabled
apachectl -M | grep rewrite

# Check AllowOverride in VirtualHost
# Must be "AllowOverride All", not "None"
```

**Fix for Nginx:**
```bash
# Verify try_files directive exists
grep "try_files" /etc/nginx/sites-available/yourdomain.com

# Should be:
# try_files $uri $uri/ /index.html;
```

### Issue 2: Supabase 400 Error (Auth Failure)

**Symptom:** `Failed to load resource: status 400` on Supabase endpoints

**Common Causes:**
1. **Wrong environment variables** - Check browser Network tab to see actual URLs
2. **HTTP instead of HTTPS** - Supabase requires SSL
3. **Expired/invalid API keys** - Regenerate in Supabase dashboard
4. **CORS issues** - Add your domain to Supabase allowed origins

**Debug Steps:**
```bash
# Check what's actually in your built files
grep -r "VITE_SUPABASE_URL" dist/assets/*.js

# Should show your actual Supabase URL, not a placeholder
```

### Issue 3: Auth Timeout

**Symptom:** "Auth timeout - check your network connection"

**Fixes:**
1. **Check RLS policies** - Profile table needs SELECT policy
2. **Verify network connectivity** to Supabase from server
3. **Check firewall rules** on A2 VPS
4. **Use demo mode** temporarily: `https://yourdomain.com/?demo_role=cto`

### Issue 4: White Screen / Blank Page

**Debug:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check Network tab for failed requests
4. Visit `/diagnostics.html` for environment check

**Common fixes:**
- Clear browser cache: Ctrl+Shift+Delete
- Clear Service Worker: Application tab → Service Workers → Unregister
- Rebuild with correct environment variables

### Issue 5: Service Worker Issues

**Clear Service Worker cache:**

Browser console:
```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Clear all caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// Then reload
location.reload();
```

---

## Part 7: Verification Checklist

After deployment, verify:

- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Login page accessible: `https://yourdomain.com/login`
- [ ] HTTPS is working (green padlock in browser)
- [ ] No console errors on homepage (F12 → Console tab)
- [ ] Demo mode works: `https://yourdomain.com/?demo_role=cto`
- [ ] Real login works (if you have test credentials)
- [ ] CEO dashboard accessible: `https://yourdomain.com/ceod/home`
- [ ] CTO dashboard accessible: `https://yourdomain.com/ctod/home`
- [ ] Direct URL navigation works (refresh on `/ceod/home` doesn't 404)
- [ ] Service Worker installed (check Application tab in DevTools)

---

## Part 8: Post-Deployment Monitoring

### Check Logs

**Apache logs:**
```bash
# Error log
tail -f /var/log/apache2/error.log

# Access log
tail -f /var/log/apache2/access.log
```

**Nginx logs:**
```bash
# Error log
tail -f /var/log/nginx/error.log

# Access log
tail -f /var/log/nginx/access.log
```

### Browser Console Monitoring

The app includes production logging. Check console for:
```
[MPB Health] Production build initialized
[MPB Health] Supabase configured: true
[MPB Health] Testing Supabase connection...
[MPB Health] Supabase connection test successful
```

If you see errors, they'll be clearly labeled with context.

---

## Part 9: Updating Your Deployment

### Quick Update Process

1. **Make changes locally**
2. **Rebuild:**
   ```bash
   npm run build
   ```

3. **Upload new dist:**
   ```bash
   rsync -avz --delete dist/ username@server:/home/username/public_html/
   ```

4. **Clear browser cache** and test

### Automated Deployment (Optional)

Create a deploy script `deploy.sh`:

```bash
#!/bin/bash
echo "Building application..."
npm run build

echo "Uploading to server..."
rsync -avz --delete \
  --exclude='.htaccess' \
  dist/ username@your-server-ip:/home/username/public_html/

echo "Deployment complete!"
echo "Visit: https://yourdomain.com"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Part 10: Performance Optimization

### Enable Gzip Compression

**Apache** (add to VirtualHost or .htaccess):
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

**Nginx** (should be in server block):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### Set Proper Cache Headers

Already configured in `.htaccess` and `nginx.conf.example`:
- Static assets: 1 year cache
- index.html: no cache
- Service worker: no cache

---

## Quick Reference Commands

### Build
```bash
npm run build
```

### Upload (SCP)
```bash
scp -r dist/* user@server:/path/to/public_html/
```

### Upload (Rsync - Recommended)
```bash
rsync -avz --delete dist/ user@server:/path/to/public_html/
```

### Check Apache Status
```bash
systemctl status apache2
sudo apachectl configtest
```

### Check Nginx Status
```bash
systemctl status nginx
sudo nginx -t
```

### View Logs
```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log
```

### Clear Service Worker (Browser Console)
```javascript
navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
location.reload();
```

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check browser console** (F12) for error messages
2. **Check server logs** for backend errors
3. **Visit `/diagnostics.html`** on your site for environment check
4. **Use demo mode** to isolate Supabase issues: `?demo_role=cto`
5. **Review Supabase logs** in Supabase dashboard
6. **Contact A2 Support** for server-specific issues

---

## Security Reminders

- ✅ Never commit `.env` files to Git
- ✅ Use HTTPS in production (required for Supabase)
- ✅ Keep Supabase API keys secure
- ✅ Regularly update dependencies: `npm audit fix`
- ✅ Monitor access logs for suspicious activity
- ✅ Keep SSL certificates renewed

---

**Your MPB Health Dashboard is now deployed on A2 VPS! 🚀**

For questions or issues, refer to the troubleshooting section or check the application's diagnostic tools at `/diagnostics.html`.
