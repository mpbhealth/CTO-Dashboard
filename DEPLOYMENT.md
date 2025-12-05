# MPB Health CTO Dashboard - Deployment Guide

## 🚀 **Quick Deployment**

### **Option 1: Netlify (Recommended)**

1. **Connect Repository**
   ```bash
   # Push to GitHub/GitLab
   git add .
   git commit -m "Initial dashboard deployment"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Connect your repository to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add Supabase credentials

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### **Option 2: A2 Hosting (cPanel/Apache)**

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Upload to A2 Hosting**
   - Login to cPanel
   - Open File Manager
   - Navigate to `public_html` (or subdomain folder)
   - Upload entire contents of `/dist` folder
   - Make sure `.htaccess` is included (it handles React routing)

3. **Important Files**
   - `.htaccess` - Handles SPA routing, caching, compression, and HTTPS redirect
   - `index.html` - Main entry point
   - `/assets/` - All JS, CSS, and media files

4. **Verify Deployment**
   - Visit your domain
   - Test all routes work (e.g., `/ceo`, `/cto`, `/admin`)
   - Check browser console for errors
   - Verify Supabase connection works

### **Option 3: Vercel**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## 🗄️ **Database Setup**

### **Supabase Configuration**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run Migrations**
   ```sql
   -- Copy and paste each migration file from supabase/migrations/
   -- Run them in order in the Supabase SQL editor
   ```

3. **Enable Row Level Security**
   ```sql
   -- RLS is automatically enabled by migrations
   -- Verify in Supabase dashboard under Authentication > Policies
   ```

4. **Set up Authentication (Optional)**
   ```sql
   -- If you want user authentication
   -- Configure in Supabase dashboard under Authentication
   ```

## 🔧 **Production Configuration**

### **Environment Variables**
```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_APP_NAME=MPB Health CTO Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### **Build Optimization**
```bash
# Production build with optimizations
npm run build

# Analyze bundle size
npm run build -- --analyze

# Preview production build locally
npm run preview
```

## 📊 **Performance Monitoring**

### **Analytics Setup**
```typescript
// Add to main.tsx for production analytics
import { Analytics } from '@vercel/analytics/react';

// Wrap your app
<Analytics />
```

### **Error Monitoring**
```typescript
// Add Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

## 🔒 **Security Checklist**

### **Pre-deployment Security**
- ✅ Environment variables are secure
- ✅ No hardcoded secrets in code
- ✅ RLS policies are properly configured
- ✅ API endpoints are protected
- ✅ CORS is properly configured

### **Post-deployment Security**
- ✅ HTTPS is enabled
- ✅ Security headers are configured
- ✅ Rate limiting is in place
- ✅ Monitoring is active
- ✅ Backup strategy is implemented

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Supabase Connection Issues**
   ```bash
   # Verify environment variables
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

3. **Missing Data**
   ```sql
   -- Check if migrations ran successfully
   SELECT * FROM kpi_data LIMIT 1;
   SELECT * FROM team_members LIMIT 1;
   ```

4. **Permission Errors**
   ```sql
   -- Verify RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'kpi_data';
   ```

### **Performance Issues**

1. **Slow Loading**
   - Check bundle size with `npm run build -- --analyze`
   - Implement code splitting
   - Optimize images and assets

2. **Database Queries**
   - Add indexes for frequently queried columns
   - Optimize Supabase queries
   - Implement caching strategies

## 📈 **Monitoring & Maintenance**

### **Health Checks**
```typescript
// Add health check endpoint
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase
      .from('kpi_data')
      .select('count')
      .limit(1);
    
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error, timestamp: new Date() };
  }
};
```

### **Backup Strategy**
```bash
# Database backups (Supabase handles this automatically)
# Code backups via Git
git push origin main

# Environment variable backups
# Store securely in password manager
```

### **Update Process**
```bash
# 1. Test locally
npm run dev

# 2. Run tests
npm run test

# 3. Build and preview
npm run build
npm run preview

# 4. Deploy to staging
vercel --target staging

# 5. Deploy to production
vercel --prod
```

## 🎯 **Performance Targets**

### **Core Web Vitals**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### **Application Metrics**
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB gzipped
- **API Response Time**: < 200ms
- **Uptime**: > 99.9%

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📞 **Support & Maintenance**

### **Production Support**
- **Monitoring**: 24/7 uptime monitoring
- **Alerts**: Automated error notifications
- **Response Time**: < 1 hour for critical issues
- **Maintenance Window**: Sundays 2-4 AM EST

### **Contact Information**
- **Technical Lead**: Vinnie R. Tannous (vinnie@mpbhealth.com)
- **DevOps Team**: devops@mpbhealth.com
- **Emergency**: +1-XXX-XXX-XXXX

---

**🎉 Your MPB Health CTO Dashboard is now ready for production!**