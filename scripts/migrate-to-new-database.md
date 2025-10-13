# 🚀 Step-by-Step Migration to New Database

## Your New Database: xnijhggwgbxrtvlktviz

---

## ✅ CHECKLIST

- [ ] **Step 1**: Get anon key from Supabase Dashboard
- [ ] **Step 2**: Create `.env.local` with new credentials
- [ ] **Step 3**: Run all migrations on new database
- [ ] **Step 4**: Export data from old database (if any)
- [ ] **Step 5**: Import data to new database
- [ ] **Step 6**: Test CTO Dashboard
- [ ] **Step 7**: Test CEO Portal
- [ ] **Step 8**: Configure HIPAA features
- [ ] **Step 9**: Deploy to production

---

## 🎯 STEP 1: Get Your Anon Key

**Open this URL:**
```
https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/settings/api
```

**Copy this key:**
- Find the **`anon`** key (also called `public` key)
- It starts with `eyJ...`
- Click the copy button 📋

---

## 🎯 STEP 2: Create Environment File

**Create `.env.local` in your project root:**

```env
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=[PASTE YOUR ANON KEY HERE]
NODE_ENV=development
```

**Test it:**
```bash
npm run dev
# Check console - should connect to new database
```

---

## 🎯 STEP 3: Run Migrations on New Database

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref xnijhggwgbxrtvlktviz

# Push all migrations
supabase db push
```

### Option B: Manual Migration (If CLI doesn't work)

1. Go to: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor
2. Click **SQL Editor**
3. Create new query
4. Copy content from each migration file in order
5. Run each migration

**Migration Order (78 files):**

#### Core HIPAA Setup (Run these first):
```
1. supabase/migrations/20250109000001_hipaa_roles_profiles.sql
2. supabase/migrations/20250109000002_hipaa_core_tables.sql
3. supabase/migrations/20250109000003_hipaa_rls_policies.sql
4. supabase/migrations/20250109000004_hipaa_settings_storage.sql
```

#### Then run all others in chronological order:
```
5. supabase/migrations/20250619185038_damp_oasis.sql
6. supabase/migrations/20250619190650_curly_prism.sql
... (continue through all 78 files)
78. supabase/migrations/20250930000001_api_incidents.sql
```

---

## 🎯 STEP 4: Verify Migrations

**Run verification script:**

1. Go to SQL Editor in new database
2. Copy/paste content from: `scripts/verify-migration.sql`
3. Run it
4. Check that:
   - All tables exist
   - RLS is enabled
   - Foreign keys are valid

---

## 🎯 STEP 5: Export Data from Old Database (If you have data)

### If you have an old database with data:

**Option A: Using Supabase Dashboard**
1. Go to old database
2. **Table Editor** → Select each table
3. Click **Export** → CSV
4. Save all CSVs to a folder

**Option B: Using SQL**
```sql
-- Run in OLD database for each table
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM team_members) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM projects) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM assignments) TO STDOUT WITH CSV HEADER;
-- etc.
```

---

## 🎯 STEP 6: Import Data to New Database

**Using Supabase Dashboard:**

1. Go to new database: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor
2. **Table Editor** → Select table
3. Click **Import** → Upload CSV
4. Match columns
5. Import

**Important: Import in this order to respect foreign keys:**
1. `users` (no dependencies)
2. `departments`
3. `employee_profiles`
4. `team_members`
5. `projects`
6. `kpi_data`
7. `assignments` (depends on users & projects)
8. All compliance tables
9. All other tables

---

## 🎯 STEP 7: Test CTO Dashboard

```bash
npm run dev
```

**Open:** http://localhost:5173/

**Test:**
- [ ] Login works
- [ ] Overview page loads
- [ ] Team members display
- [ ] Projects display
- [ ] Assignments work
- [ ] Compliance pages load
- [ ] No console errors

---

## 🎯 STEP 8: Test CEO Portal

**Open:** http://localhost:5173/ceo

**Test:**
- [ ] Executive Overview loads
- [ ] KPI cards show data (or mock data)
- [ ] Charts render
- [ ] Sidebar navigation works
- [ ] Can switch between portals

---

## 🎯 STEP 9: Configure HIPAA Features

**Run in SQL Editor:**

```sql
-- Enable audit logging
CREATE EXTENSION IF NOT EXISTS "pg_audit";

-- Enable encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_audit', 'pgcrypto', 'uuid-ossp');
```

**Configure Session Timeout:**
```sql
-- 30-minute timeout for HIPAA compliance
ALTER ROLE authenticated SET statement_timeout = '30min';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30min';
```

**Enable MFA:**
1. Go to: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/auth/users
2. Click **Settings**
3. Enable **"Require MFA for new users"**

---

## 🎯 STEP 10: Deploy to Production

### Update Production Environment Variables:

**On Netlify/Vercel/Your hosting:**

```env
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
NODE_ENV=production
```

### Test Production Build:

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test at http://localhost:4173
```

---

## 🚨 Troubleshooting

### Problem: "relation does not exist"
**Solution:** Migrations didn't run completely
- Re-run migrations in order
- Check for SQL errors

### Problem: "permission denied"
**Solution:** RLS blocking access
- Check RLS policies in SQL Editor
- Ensure user authentication works

### Problem: "Invalid API key"
**Solution:** Wrong anon key in .env.local
- Double-check key from Supabase Dashboard
- Restart dev server after changing .env

### Problem: "Can't connect to database"
**Solution:** Check URL and credentials
- Verify project is active on Supabase
- Check .env.local has correct URL

---

## 📊 Migration Status Tracking

**Keep track as you go:**

```
✅ Anon key obtained
✅ .env.local created
⏳ Migrations running...
⏳ Data export...
⏳ Data import...
⏳ Testing...
✅ COMPLETE!
```

---

## 🎉 Success Criteria

**You'll know migration is successful when:**
- ✅ Dev server starts without errors
- ✅ Both dashboards (CTO & CEO) load
- ✅ Can create/edit/delete assignments
- ✅ All pages load without 404s
- ✅ Console has no errors
- ✅ Data displays correctly

---

## 📞 Need Help?

**If you get stuck:**

1. Check browser console (F12) for errors
2. Check Supabase logs:
   - https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/logs/explorer
3. Verify migrations ran successfully
4. Check that tables exist in Table Editor

---

## 🎯 Quick Start Commands

```bash
# 1. Get anon key (open in browser)
start https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/settings/api

# 2. Create .env.local (use your text editor)

# 3. Test connection
npm run dev

# 4. Run migrations (if using CLI)
supabase link --project-ref xnijhggwgbxrtvlktviz
supabase db push

# 5. Verify
npm run dev
start http://localhost:5173
start http://localhost:5173/ceo
```

---

**Ready to start?** Let me know when you have your anon key! 🚀

