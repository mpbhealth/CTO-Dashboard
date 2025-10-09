# HIPAA Compliance Command Center - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you get the Compliance Command Center up and running quickly.

## Prerequisites

- Supabase project set up
- Node.js and npm installed
- Access to Supabase dashboard

## Step 1: Install Dependencies (2 minutes)

```bash
# Install xlsx for import/export functionality
npm install xlsx

# If not already installed, ensure you have these:
npm install @tanstack/react-query @supabase/supabase-js
```

## Step 2: Run Database Migrations (2 minutes)

```bash
# Navigate to your project root
cd /path/to/CTODashboard_v2

# Apply all compliance migrations
supabase migration up
```

Expected output:
```
✅ Applied migration 20250109000001_hipaa_roles_profiles.sql
✅ Applied migration 20250109000002_hipaa_core_tables.sql
✅ Applied migration 20250109000003_hipaa_rls_policies.sql
✅ Applied migration 20250109000004_hipaa_settings_storage.sql
```

## Step 3: Create Storage Buckets (1 minute)

In your Supabase Dashboard:

1. Go to **Storage** → **Create bucket**
2. Create these three buckets:
   - `hipaa-evidence` (Public: No)
   - `hipaa-templates` (Public: No)
   - `hipaa-exports` (Public: Yes)

3. For each bucket, add storage policies:

**hipaa-evidence**:
```sql
-- SELECT policy
CREATE POLICY "Officers can view evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'hipaa-evidence' AND
  (
    EXISTS (
      SELECT 1 FROM v_current_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin','hipaa_officer','privacy_officer','security_officer','auditor')
    )
  )
);

-- INSERT policy
CREATE POLICY "Officers can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hipaa-evidence' AND
  (
    EXISTS (
      SELECT 1 FROM v_current_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin','hipaa_officer','privacy_officer','security_officer')
    )
  )
);
```

## Step 4: Seed Demo Data (Optional, 1 minute)

```bash
# From your project root
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/seed-compliance.sql
```

Or run directly in Supabase SQL Editor:
1. Go to **SQL Editor** in Supabase Dashboard
2. Open new query
3. Paste contents of `supabase/seed-compliance.sql`
4. Run query

## Step 5: Assign Your First Admin Role (1 minute)

In Supabase SQL Editor:

```sql
-- First, create a profile for your user (if not exists)
INSERT INTO profiles (user_id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id) DO NOTHING;

-- Assign admin and hipaa_officer roles
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'YOUR_EMAIL_HERE'
AND r.name IN ('admin', 'hipaa_officer')
ON CONFLICT DO NOTHING;
```

Replace `YOUR_EMAIL_HERE` with your actual email.

## Step 6: Access the Compliance Command Center

1. Start your development server:
```bash
npm run dev
```

2. Log in to your dashboard

3. In the sidebar, expand **"Compliance Command Center"**

4. Click **"Dashboard"** to view the main compliance dashboard

## 🎉 You're Done!

You should now see:
- ✅ KPI cards with metrics
- ✅ My Queue (your assigned tasks)
- ✅ Recent Activity feed
- ✅ Quick Action buttons
- ✅ Section navigation

## Next Steps

### 1. Explore Key Features

- **Report an Incident**: Click "New Incident" from Quick Actions
- **Log PHI Access**: Click "Log PHI Access" to track PHI viewing
- **Create a Policy**: Navigate to Administration section
- **Add a BAA**: Go to Business Associates section

### 2. Configure Webhooks (Optional)

For automated BAA renewal reminders:

1. Set up an n8n workflow endpoint
2. Update the setting:

```sql
UPDATE compliance_settings
SET value = '{"enabled": true, "url": "https://your-n8n-instance.com/webhook/baa-reminder"}'::jsonb
WHERE key = 'n8n_webhook_baa_reminder';
```

### 3. Deploy Edge Functions (Optional)

For advanced features like certificates and risk scoring:

```bash
supabase functions deploy compliance-audit-log
supabase functions deploy compliance-evidence-upload
supabase functions deploy compliance-training-certificate
supabase functions deploy compliance-baa-reminders
supabase functions deploy compliance-breach-risk-score
```

## Common First-Time Tasks

### Add More Users

```sql
-- Assign roles to existing authenticated users
INSERT INTO user_roles (user_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'newuser@mpbhealth.com'
AND r.name = 'staff'  -- or 'privacy_officer', 'security_officer', etc.
ON CONFLICT DO NOTHING;
```

### Import Training Attendance

1. Go to **Training & Awareness** section
2. Click a training program
3. Click **Import Attendance**
4. Upload CSV with columns: `user_email`, `user_name`, `completed_at`, `score`

### Export a Compliance Report

1. Navigate to any section
2. Look for the **Export** button
3. Choose CSV or XLSX format
4. File downloads automatically

## Troubleshooting

### "Permission Denied" Errors

**Problem**: Can't see compliance data  
**Solution**: Verify you have a role assigned:

```sql
SELECT r.name 
FROM user_roles ur 
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
```

### Storage Upload Fails

**Problem**: Can't upload evidence files  
**Solution**: 
1. Check buckets exist
2. Verify storage RLS policies are applied
3. Confirm you have the right role (officer or admin)

### Sidebar Doesn't Show Compliance

**Problem**: Compliance menu not visible  
**Solution**: 
1. Clear browser cache
2. Verify sidebar.tsx has compliance submenu
3. Check console for JavaScript errors

## Support

For issues or questions:
1. Check `COMPLIANCE_README.md` for detailed documentation
2. Review migration files for schema details
3. Check Supabase logs for RLS policy errors
4. Contact the development team

---

**🎊 Congratulations! Your HIPAA Compliance Command Center is ready to use!**

