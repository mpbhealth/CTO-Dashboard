# 🚀 Quick Start: Migrate to New HIPAA Database

## Your New Database
**Project ID:** `xnijhggwgbxrtvlktviz`  
**URL:** `https://xnijhggwgbxrtvlktviz.supabase.co`

---

## ⚡ 5-Minute Quick Start

### 1️⃣ Get Your API Key (2 min)

**Run this command:**
```powershell
.\scripts\open-new-supabase.ps1
```

**Or open manually:**
```
https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/settings/api
```

**Copy the `anon` / `public` key** (starts with `eyJ...`)

---

### 2️⃣ Create Environment File (1 min)

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (PASTE YOUR KEY)
NODE_ENV=development
```

---

### 3️⃣ Run Migrations (2 min)

**Option A - Using Supabase CLI:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref xnijhggwgbxrtvlktviz
supabase db push
```

**Option B - Manual:**
1. Go to [SQL Editor](https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/editor)
2. Copy/paste each file from `supabase/migrations/` folder
3. Run in chronological order

---

### 4️⃣ Verify & Test

```bash
npm run dev
```

**Open:**
- CTO Dashboard: http://localhost:5173/
- CEO Portal: http://localhost:5173/ceo

**Check console - should see:**
```
✅ Supabase Configuration: { hasUrl: true, hasKey: true }
```

---

## 📚 Detailed Guides

| Guide | Purpose |
|-------|---------|
| `ENV_SETUP_NEW_DATABASE.md` | Environment setup instructions |
| `scripts/migrate-to-new-database.md` | Complete step-by-step migration |
| `scripts/verify-migration.sql` | Verify migrations ran correctly |
| `scripts/export-old-database.sql` | Export data from old database |
| `SUPABASE_MIGRATION_GUIDE.md` | Full enterprise migration guide |

---

## 🎯 Migration Checklist

```
[ ] Get anon key from Supabase
[ ] Create .env.local file
[ ] Run all migrations
[ ] Verify tables exist
[ ] Export old data (if needed)
[ ] Import data to new database
[ ] Test CTO Dashboard
[ ] Test CEO Portal
[ ] Configure HIPAA features
[ ] Deploy to production
```

---

## 🚨 Common Issues & Fixes

### ❌ Can't connect to database
**Fix:** Double-check `.env.local` has correct URL and anon key

### ❌ "relation does not exist"
**Fix:** Migrations didn't run - re-run in SQL Editor

### ❌ "permission denied"
**Fix:** RLS is blocking - check policies in database

### ❌ Console errors after starting dev server
**Fix:** Clear browser cache, restart dev server

---

## 🔐 HIPAA Features to Enable

After basic setup, run these in SQL Editor:

```sql
-- Enable encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable audit logging
CREATE EXTENSION IF NOT EXISTS "pg_audit";

-- Set session timeout (30 minutes)
ALTER ROLE authenticated SET statement_timeout = '30min';
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30min';
```

---

## 🎉 Success Indicators

**You're done when:**
- ✅ Dev server starts without errors
- ✅ Both portals load (CTO & CEO)
- ✅ Can view/create assignments
- ✅ No console errors
- ✅ All pages accessible
- ✅ Data displays correctly

---

## 📞 Need Help?

**Check these files:**
1. `scripts/migrate-to-new-database.md` - Full walkthrough
2. `ENV_SETUP_NEW_DATABASE.md` - Environment setup
3. Browser console (F12) - Error messages
4. [Supabase Logs](https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/logs/explorer)

---

## 🚀 Production Deployment

After testing locally, update your hosting provider:

**Environment Variables:**
```env
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
NODE_ENV=production
```

**Build & Deploy:**
```bash
npm run build
# Then deploy the 'dist' folder
```

---

## ⏱️ Estimated Timeline

| Task | Time |
|------|------|
| Get API key & setup .env | 5 min |
| Run migrations | 10-15 min |
| Test locally | 10 min |
| Export/import data (if needed) | 30-60 min |
| Production deployment | 15 min |
| **TOTAL** | **1-2 hours** |

---

## 🎯 Quick Commands

```powershell
# Open Supabase dashboard
.\scripts\open-new-supabase.ps1

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref xnijhggwgbxrtvlktviz

# Push migrations
supabase db push

# Check status
supabase status
```

---

**Ready? Let's do this! 🚀**

**First step:** Get your API key
```powershell
.\scripts\open-new-supabase.ps1
```

Or open: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/settings/api

