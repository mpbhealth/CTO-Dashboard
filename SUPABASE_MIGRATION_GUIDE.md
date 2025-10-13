# 🔐 Supabase Database Migration Guide
## Moving to HIPAA-Compliant Supabase Instance

**Date**: October 13, 2025  
**From**: Current development database  
**To**: New HIPAA-compliant Supabase project with BAA

---

## 📋 Pre-Migration Checklist

### **What You Need:**
- [ ] New HIPAA-compliant Supabase project URL
- [ ] New Supabase anon/public key
- [ ] New Supabase service role key (for admin tasks)
- [ ] BAA (Business Associate Agreement) signed with Supabase
- [ ] Database backup of current data (we'll create this)

### **Current Setup:**
- ✅ 78 migration files in `/supabase/migrations/`
- ✅ Environment-based configuration in `src/lib/supabase.ts`
- ✅ TypeScript types in `src/types/database.ts`

---

## 🚀 Migration Strategy

We'll use a **4-phase approach**:

### **Phase 1: Preparation** (30 minutes)
- Document current setup
- Export current data
- Create new Supabase project
- Verify BAA is in place

### **Phase 2: Schema Migration** (30 minutes)
- Run all migrations on new database
- Verify schema integrity
- Set up Row Level Security (RLS)

### **Phase 3: Data Migration** (1-2 hours)
- Import data to new database
- Verify data integrity
- Test data relationships

### **Phase 4: Cutover** (30 minutes)
- Update environment variables
- Test all features
- Deploy to production

---

## 📝 Step-by-Step Migration Process

### **PHASE 1: PREPARATION**

#### Step 1.1: Document Current Database
```bash
# Check current Supabase connection
npm run dev

# Note your current database URL (check .env or .env.local)
cat .env.local
```

#### Step 1.2: Export Current Schema
```bash
# If you have Supabase CLI installed
supabase db dump --data-only > current_data_backup.sql

# Or use the Supabase Dashboard:
# 1. Go to Database → Backups
# 2. Click "Export Database"
# 3. Download the SQL file
```

#### Step 1.3: Create Backup of Environment File
```bash
# Backup current .env.local
cp .env.local .env.local.backup

# Save current values
echo "Old Supabase URL:" >> migration_log.txt
grep VITE_SUPABASE_URL .env.local >> migration_log.txt
echo "Migration started: $(date)" >> migration_log.txt
```

#### Step 1.4: Set Up New HIPAA Supabase Project

**In Supabase Dashboard:**
1. Create new project: `mpb-health-hipaa-prod`
2. Choose region: (US region for HIPAA)
3. Set strong database password (save it!)
4. Enable HIPAA compliance features
5. Sign BAA agreement
6. Wait for project to initialize (~2 minutes)

**Copy these values:**
```
Project URL: https://[PROJECT-REF].supabase.co
Anon/Public Key: eyJhbGc...
Service Role Key: eyJhbGc... (KEEP SECRET!)
Database Password: [your-password]
```

---

### **PHASE 2: SCHEMA MIGRATION**

#### Step 2.1: Initialize New Database

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to new project
supabase link --project-ref [YOUR-NEW-PROJECT-REF]

# Push all migrations
supabase db push
```

**Option B: Using SQL Editor (If no CLI)**
```bash
# Run each migration file in order in Supabase SQL Editor
# Start with earliest migration (20250109000001_hipaa_roles_profiles.sql)
# Go through all 78 files in order
```

#### Step 2.2: Verify Schema
```sql
-- Run this in new database SQL Editor
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see all your tables:
-- - users
-- - team_members
-- - kpi_data
-- - tech_stack
-- - projects
-- - assignments
-- - hipaa_audits
-- - etc.
```

#### Step 2.3: Configure Row Level Security (RLS)

**Run this in SQL Editor:**
```sql
-- Verify RLS is enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should show rowsecurity = true

-- If any are false, enable RLS:
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

---

### **PHASE 3: DATA MIGRATION**

#### Step 3.1: Export Data from Old Database

**Using Supabase Dashboard:**
1. Go to old database
2. Table Editor → Select table
3. Export as CSV for each table
4. Save all CSVs to `/migration_data/` folder

**Or use SQL:**
```sql
-- Run in OLD database for each table
COPY users TO STDOUT WITH CSV HEADER;
COPY team_members TO STDOUT WITH CSV HEADER;
COPY kpi_data TO STDOUT WITH CSV HEADER;
-- etc.
```

#### Step 3.2: Import Data to New Database

**Using Supabase Dashboard:**
1. Go to new database
2. Table Editor → Select table
3. Import CSV
4. Repeat for all tables

**Important Order:**
1. `users` (no dependencies)
2. `team_members` (depends on users)
3. `projects` (no dependencies)
4. `assignments` (depends on users & projects)
5. All other tables following their dependencies

#### Step 3.3: Verify Data Integrity

```sql
-- Run in NEW database
-- Check row counts match old database
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments;

-- Verify relationships
SELECT 
  a.id,
  a.title,
  u.email as assigned_to_email
FROM assignments a
LEFT JOIN users u ON u.id = a.assigned_to
LIMIT 5;

-- Should show proper joins, no NULLs where unexpected
```

---

### **PHASE 4: CUTOVER & TESTING**

#### Step 4.1: Update Environment Variables

**Create NEW `.env.local` file:**
```env
# NEW HIPAA-Compliant Supabase
VITE_SUPABASE_URL=https://[NEW-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[NEW-ANON-KEY]

# Optional: Teams Integration
VITE_TEAMS_WEBHOOK_URL=[your-teams-webhook]

# For development
NODE_ENV=development
```

**For Production `.env.production`:**
```env
# Production HIPAA Database
VITE_SUPABASE_URL=https://[NEW-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[NEW-ANON-KEY]
NODE_ENV=production
```

#### Step 4.2: Test Connection

```bash
# Start dev server with new database
npm run dev

# Open browser console
# Should see: "Supabase Configuration: { hasUrl: true, hasKey: true, usingFallback: false }"
```

#### Step 4.3: Test All Features

**Checklist:**
- [ ] Login/Authentication works
- [ ] CTO Dashboard loads (/)
- [ ] CEO Dashboard loads (/ceo)
- [ ] Can view team members
- [ ] Can create/edit/delete assignments
- [ ] Compliance audits page loads
- [ ] Marketing analytics loads
- [ ] All charts display data
- [ ] No console errors

#### Step 4.4: Test CEO Portal Specifically

```bash
# Open CEO portal
http://localhost:5173/ceo

# Verify:
- [ ] KPI cards show data
- [ ] Charts render
- [ ] Sidebar navigation works
- [ ] Can switch between portals
```

---

## 🔐 HIPAA-Specific Configuration

### **Enable Audit Logging**

```sql
-- Run in new database
CREATE EXTENSION IF NOT EXISTS "pg_audit";

-- Configure audit logging for PHI access
ALTER SYSTEM SET pgaudit.log = 'read, write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = off;
ALTER SYSTEM SET pgaudit.log_level = 'notice';
ALTER SYSTEM SET pgaudit.log_parameter = on;
```

### **Set Up Encryption for Sensitive Fields**

```sql
-- Enable pgcrypto for field-level encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Example: Encrypt PHI fields
ALTER TABLE member_enrollments 
ADD COLUMN encrypted_ssn TEXT;

-- Encrypt existing data (if needed)
UPDATE member_enrollments 
SET encrypted_ssn = pgp_sym_encrypt(ssn, 'your-encryption-key')
WHERE ssn IS NOT NULL;
```

### **Configure Session Timeout**

```sql
-- Set session timeout to 30 minutes for HIPAA compliance
ALTER ROLE authenticated SET statement_timeout = '30min';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30min';
```

### **Enable MFA (Multi-Factor Authentication)**

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Enable "Require MFA for admin users"
3. Set up TOTP (Time-based One-Time Password)

---

## 🧪 Testing Checklist

### **Functionality Tests:**
- [ ] User authentication
- [ ] Data CRUD operations
- [ ] Real-time subscriptions (if used)
- [ ] File uploads (if used)
- [ ] Edge functions (if used)

### **Security Tests:**
- [ ] RLS policies block unauthorized access
- [ ] Anonymous users can't see protected data
- [ ] Users can only see their own data
- [ ] Admin roles have proper access

### **Performance Tests:**
- [ ] Page load times acceptable
- [ ] Queries return results quickly
- [ ] Charts render without lag
- [ ] No timeout errors

---

## 🚨 Rollback Plan

**If something goes wrong:**

### **Quick Rollback:**
```bash
# Restore old .env.local
cp .env.local.backup .env.local

# Restart dev server
npm run dev

# You're back to old database
```

### **Keep Both Databases Running:**
```env
# You can keep both active temporarily
# Old database for backup, new for testing

# Switch between them by changing .env.local
```

---

## 📊 Post-Migration Verification

### **Day 1: Monitor Closely**
- Check all features work
- Monitor error logs
- Watch for timeout issues
- Verify data is correct

### **Week 1: Gradual Rollout**
- Keep old database as backup
- Monitor performance
- Gather user feedback
- Watch Supabase metrics

### **Week 2: Full Cutover**
- Decommission old database
- Update all documentation
- Inform team of new setup
- Schedule first HIPAA audit

---

## 🎯 Migration Scripts

I'll create these for you in the next step!

### **Files to Create:**
1. `scripts/export-data.sh` - Export from old database
2. `scripts/import-data.sh` - Import to new database
3. `scripts/verify-migration.sql` - Verification queries
4. `scripts/setup-hipaa-features.sql` - HIPAA configurations

---

## 📞 Need Help?

### **Common Issues:**

**Issue**: "relation does not exist"
- **Fix**: Run migrations in correct order
- Check migration files executed successfully

**Issue**: "permission denied"
- **Fix**: Check RLS policies
- Verify user roles are set up

**Issue**: "connection refused"
- **Fix**: Check environment variables
- Verify Supabase project is active

**Issue**: "slow queries"
- **Fix**: Add indexes
- Check query plans with EXPLAIN

---

## ✅ Migration Complete Checklist

- [ ] New Supabase project created
- [ ] BAA signed
- [ ] All 78 migrations applied
- [ ] Data exported from old database
- [ ] Data imported to new database
- [ ] Row counts verified
- [ ] Relationships tested
- [ ] Environment variables updated
- [ ] Authentication works
- [ ] CTO dashboard works
- [ ] CEO dashboard works
- [ ] All features tested
- [ ] HIPAA audit logging enabled
- [ ] MFA configured
- [ ] Session timeouts set
- [ ] Documentation updated
- [ ] Team notified
- [ ] Old database backed up
- [ ] Old database scheduled for decommission

---

**Ready to start?** Let me know and I'll guide you through each step! 🚀

**Questions before we begin?** I'm here to help!

