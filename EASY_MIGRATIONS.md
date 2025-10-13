# 🚀 Easy Migrations - Copy & Paste Method

**Installation issues with Supabase CLI? No problem!**  
Use this simple manual method instead.

---

## ✅ What You Need

- ✅ New database URL (you have it)
- ✅ Anon key (you have it)
- ✅ SQL Editor access
- ⏱️ 15-20 minutes

---

## 📋 Step-by-Step Instructions

### STEP 1: Open SQL Editor

**Click this link:**
```
https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor
```

### STEP 2: Run HIPAA Foundation Migrations (MUST RUN FIRST)

These 4 migrations MUST run before anything else:

#### Migration 1: HIPAA Roles & Profiles
1. Open file: `supabase/migrations/20250109000001_hipaa_roles_profiles.sql`
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into SQL Editor
5. Click **"RUN"** button
6. Wait for ✅ Success message

#### Migration 2: HIPAA Core Tables
1. Open file: `supabase/migrations/20250109000002_hipaa_core_tables.sql`
2. Select ALL, Copy, Paste into SQL Editor
3. Click **"RUN"**
4. Wait for ✅ Success

#### Migration 3: HIPAA RLS Policies
1. Open file: `supabase/migrations/20250109000003_hipaa_rls_policies.sql`
2. Select ALL, Copy, Paste into SQL Editor
3. Click **"RUN"**
4. Wait for ✅ Success

#### Migration 4: HIPAA Settings & Storage
1. Open file: `supabase/migrations/20250109000004_hipaa_settings_storage.sql`
2. Select ALL, Copy, Paste into SQL Editor
3. Click **"RUN"**
4. Wait for ✅ Success

**✅ Foundation complete!** These are the most important ones.

---

### STEP 3: Run Remaining Migrations (Optional - Do if you have time)

The remaining 74 migrations add additional features. You can run them now or later.

**Files to run in order (from `supabase/migrations/` folder):**

```
20250619185038_damp_oasis.sql
20250619190650_curly_prism.sql
20250619190832_navy_recipe.sql
... (and so on, in timestamp order)
```

**For each file:**
1. Open the file
2. Copy all content  
3. Paste into SQL Editor
4. Click RUN
5. Move to next file

**Pro tip:** You can skip any that give "already exists" errors - that's fine!

---

### STEP 4: Verify Migrations

After running the 4 HIPAA migrations, verify in SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see at least:**
- `profiles`
- `roles`
- `user_roles`
- `policy_documents`
- `hipaa_audits`
- And more...

---

### STEP 5: Enable HIPAA Extensions

Run this in SQL Editor:

```sql
-- Enable encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set session timeout (30 minutes for HIPAA)
ALTER ROLE authenticated SET statement_timeout = '30min';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30min';
```

---

## ✅ Test Your Setup

### Test 1: Check Dev Server

Your dev server should already be running at:
- **CTO Dashboard:** http://localhost:5173/
- **CEO Portal:** http://localhost:5173/ceo

### Test 2: Check Browser Console

Open browser console (F12) and look for:
```
✅ Supabase Configuration: { hasUrl: true, hasKey: true, usingFallback: false }
```

### Test 3: Try Creating Data

Try these in your app:
- Create an assignment
- View team members
- Check projects
- Test both portals

---

## 🚨 Common Issues & Fixes

### "relation already exists"
**This is FINE!** The table was already created. Skip to next migration.

### "column does not exist"
**Problem:** Previous migration failed  
**Fix:** Go back and re-run the previous migration

### "permission denied"
**Problem:** Not logged in as admin  
**Fix:** Make sure you're logged into Supabase dashboard

### Connection errors in app
**Problem:** Environment variables not loaded  
**Fix:** Restart dev server (Ctrl+C, then `npm run dev`)

---

## ⏩ Quick Summary

**Minimum Required (10 minutes):**
1. Run 4 HIPAA foundation migrations
2. Enable extensions
3. Test app

**Full Setup (20 minutes):**
1. Run all 78 migrations in order
2. Enable extensions
3. Verify tables
4. Test app

**Either way works!** The 4 HIPAA migrations are the critical ones.

---

## 🎯 Migration Shortcuts

### Just Want It To Work?
**Run these 4 files and you're good to go:**
1. `20250109000001_hipaa_roles_profiles.sql`
2. `20250109000002_hipaa_core_tables.sql`
3. `20250109000003_hipaa_rls_policies.sql`
4. `20250109000004_hipaa_settings_storage.sql`

### Want Everything?
**Run all 78 files in chronological order** (they're already named with timestamps)

### Having Issues?
**Just run the HIPAA ones for now.** You can always run the others later when you need those features.

---

## 📊 Progress Tracker

```
✅ Open SQL Editor
✅ Run HIPAA migration 1
✅ Run HIPAA migration 2
✅ Run HIPAA migration 3
✅ Run HIPAA migration 4
✅ Enable extensions
✅ Test app
✅ DONE!
```

---

## 🔗 Direct Links

- **SQL Editor:** https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor
- **Table Editor:** https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor
- **Local CTO Dashboard:** http://localhost:5173/
- **Local CEO Portal:** http://localhost:5173/ceo

---

## 💡 Pro Tips

1. **Don't worry about "already exists" errors** - they're harmless
2. **You can run migrations in batches** - doesn't have to be all at once
3. **The 4 HIPAA migrations are the critical ones** - everything else is optional
4. **Test after the first 4** - make sure they work before continuing

---

**Ready?** Open the SQL Editor and let's knock out those 4 HIPAA migrations! 🚀

**SQL Editor:** https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor

