# Netlify Deployment Guide

This document provides instructions for deploying the MPB Health CTO Dashboard to Netlify with proper Supabase configuration.

## Prerequisites

- Netlify account with access to the project
- Supabase project with database configured
- Git repository connected to Netlify

## Environment Variables Setup

### Required Environment Variables

The application requires the following environment variables to be set in Netlify:

1. **VITE_SUPABASE_URL** - Your Supabase project URL
   - Format: `https://[project-id].supabase.co`
   - Example: `https://xnijhggwgbxrtvlktviz.supabase.co`

2. **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous/public key
   - This is a JWT token used for client-side authentication
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### How to Set Environment Variables in Netlify

#### Via Netlify Dashboard (Recommended)

1. Log in to your Netlify dashboard
2. Navigate to your site: **Sites** → **[Your Site Name]**
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add each variable:
   - Key: `VITE_SUPABASE_URL`
   - Value: Your Supabase URL
   - Scopes: Select "All" or "Production"
   - Click **Create variable**
6. Repeat for `VITE_SUPABASE_ANON_KEY`
7. After adding variables, trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

#### Via Netlify CLI

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your project
netlify link

# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"

# Trigger a new build
netlify build --trigger
```

### Finding Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`

## Build Configuration

The project is configured with the following build settings in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

### Build Command

The build process:
1. Runs `vite build` to compile TypeScript and bundle assets
2. Outputs to the `dist` directory
3. Optimizes assets for production
4. Applies environment variables at build time

## Deployment Process

### Automatic Deployment

The site is configured for automatic deployment on:
- Push to main branch (or configured production branch)
- Merge of pull requests
- Manual trigger from Netlify dashboard

### Manual Deployment

To manually deploy:

1. Via Netlify Dashboard:
   - Navigate to **Deploys**
   - Click **Trigger deploy** → **Deploy site**

2. Via Netlify CLI:
   ```bash
   netlify deploy --prod
   ```

## Post-Deployment Verification

After deployment, verify the following:

### 1. Environment Variables Check

Open your deployed site and check the browser console. You should see:

```
Supabase Configuration: {
  configured: true,
  hasUrl: true,
  hasValidUrl: true,
  hasKey: true,
  hasValidKey: true,
  mode: 'production'
}
```

If you see `configured: false` or `mode: 'demo'`, environment variables are not properly set.

### 2. Network Requests

Open DevTools → Network tab and verify:
- No requests to `demo.supabase.co`
- Requests go to your actual Supabase URL
- No CORS errors
- No 401 Unauthorized errors (indicates wrong keys)

### 3. Service Worker

Check Service Worker status:
- Open DevTools → Application → Service Workers
- Should show "Activated and running"
- No errors in console related to cache failures

## Troubleshooting

### Issue: Site Shows Demo Mode

**Symptoms:**
- Console shows `configured: false`
- No real data loads
- Application runs in demo mode

**Solution:**
1. Verify environment variables are set in Netlify dashboard
2. Ensure variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Trigger a new deployment after setting variables
4. Clear browser cache and hard reload

### Issue: Network Errors in Console

**Symptoms:**
- Console shows "Network failed and no cache available"
- Errors fetching from Supabase

**Solution:**
1. Check Supabase project is active and accessible
2. Verify the anon key has proper permissions
3. Check Supabase RLS policies allow anonymous access where needed
4. Ensure your Netlify domain is added to Supabase allowed URLs (if CORS issues persist)

### Issue: Service Worker Errors

**Symptoms:**
- Console shows Service Worker fetch errors
- Uncaught errors about network failures

**Solution:**
1. Clear Service Worker: DevTools → Application → Service Workers → Unregister
2. Clear all caches: DevTools → Application → Cache Storage → Delete all
3. Hard reload the page (Ctrl+Shift+R or Cmd+Shift+R)
4. The updated Service Worker will skip external API caching

### Issue: Build Fails on Netlify

**Symptoms:**
- Build logs show errors
- Deployment fails

**Common Causes and Solutions:**

1. **Missing dependencies:**
   ```bash
   # Ensure package-lock.json is committed
   git add package-lock.json
   git commit -m "Add package lock"
   ```

2. **TypeScript errors:**
   - Check build logs for specific errors
   - Run `npm run build` locally first
   - Fix any TypeScript compilation errors

3. **Environment variable issues during build:**
   - Vite requires `VITE_` prefix for client-side variables
   - Variables are injected at build time, not runtime
   - Changing variables requires a new build

## Performance Optimization

The deployment includes:

1. **Asset Caching:**
   - Assets are cached with immutable headers
   - Cache-Control: `public, max-age=31536000, immutable`

2. **Security Headers:**
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin

3. **SPA Routing:**
   - All routes redirect to index.html
   - Client-side routing handled by React Router

4. **Code Splitting:**
   - Vendor bundle (React, React DOM)
   - Supabase bundle
   - Charts bundle (Recharts)
   - Utils bundle (Framer Motion, Lucide)

## Monitoring

### Netlify Analytics

Enable Netlify Analytics to monitor:
- Page views
- Unique visitors
- Top pages
- Bandwidth usage

### Error Tracking

The application includes:
- Global error boundary
- Console error logging
- Unhandled promise rejection tracking

Check browser console in production for:
```javascript
// Enhanced error capturing
window.addEventListener('error', (e) => { ... });
window.addEventListener('unhandledrejection', (e) => { ... });
```

## Rollback Strategy

If a deployment causes issues:

1. **Via Netlify Dashboard:**
   - Navigate to **Deploys**
   - Find previous working deployment
   - Click **Publish deploy** on that version

2. **Via Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Security Best Practices

1. **Never commit secrets:**
   - `.env` file is in `.gitignore`
   - Use Netlify environment variables only

2. **Rotate keys regularly:**
   - Generate new Supabase keys periodically
   - Update in Netlify and redeploy

3. **Monitor access:**
   - Review Supabase logs regularly
   - Monitor for unauthorized access attempts

4. **RLS Policies:**
   - Ensure Row Level Security is enabled on all tables
   - Test policies thoroughly before production

## Support Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## Quick Reference

### Environment Variables Format
```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Deploy Commands
```bash
# Manual production deploy
netlify deploy --prod

# Preview deploy
netlify deploy

# Check deploy status
netlify status

# View logs
netlify logs:function [function-name]
```

### Debug Commands
```bash
# Test build locally
npm run build

# Preview production build locally
npm run preview

# Check environment variables
netlify env:list
```

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure SSL certificate (automatic with Netlify)
3. Set up deployment notifications
4. Configure branch deploys for staging
5. Enable Netlify Forms if needed
6. Set up Netlify Functions if using serverless features
