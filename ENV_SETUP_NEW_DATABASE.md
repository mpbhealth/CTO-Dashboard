# 🔐 Environment Setup for New HIPAA Database

## Your New Database URL:
```
https://xnijhggwgbxrtvlktviz.supabase.co
```

---

## STEP 1: Get Your Anon Key

1. Go to: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz
2. Click on **Settings** (⚙️) in the left sidebar
3. Click on **API**
4. Copy the **`anon`** / **`public`** key (starts with `eyJ...`)

---

## STEP 2: Create .env.local File

**Create a file named `.env.local` in your project root** with this content:

```env
# NEW HIPAA-COMPLIANT SUPABASE DATABASE
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PASTE_YOUR_ACTUAL_KEY_HERE

# Optional: Teams Integration
VITE_TEAMS_WEBHOOK_URL=

# Environment
NODE_ENV=development
```

**⚠️ IMPORTANT:** Replace `PASTE_YOUR_ACTUAL_KEY_HERE` with your actual anon key from Step 1!

---

## STEP 3: Backup Current Environment (Optional)

If you have an existing `.env.local`:

```bash
# Backup your old .env.local
copy .env.local .env.local.backup
```

---

## STEP 4: Verify Connection

After creating `.env.local`:

```bash
# Start dev server
npm run dev

# Check browser console - should see:
# "Supabase Configuration: { hasUrl: true, hasKey: true, usingFallback: false }"
```

---

## Quick Copy-Paste Template:

```env
VITE_SUPABASE_URL=https://xnijhggwgbxrtvlktviz.supabase.co
VITE_SUPABASE_ANON_KEY=
NODE_ENV=development
```

Just paste your anon key after the `=` sign!

---

## Next Steps After Environment Setup:

1. ✅ Get anon key from Supabase Dashboard
2. ✅ Create/update `.env.local` file
3. ⏭️ Run migrations on new database
4. ⏭️ Export data from old database
5. ⏭️ Import data to new database
6. ⏭️ Test everything!

**Ready?** Let me know when you have your anon key and I'll help with the next steps! 🚀

