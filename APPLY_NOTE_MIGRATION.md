# Quick Guide: Apply Note Sharing Migration

## The Issue

The "Save Note" button doesn't work because the database schema hasn't been updated yet.

## The Fix (3 Simple Steps)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Log in to your account
3. Select your project

### Step 2: Open SQL Editor

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### Step 3: Copy & Run Migration

1. Open this file on your computer:
   ```
   supabase/migrations/20251031000001_create_note_sharing_system.sql
   ```

2. Copy the ENTIRE contents (Ctrl+A, Ctrl+C)

3. Paste into the Supabase SQL Editor (Ctrl+V)

4. Click the **"Run"** button (or press Ctrl+Enter)

5. Wait for "Success" message

### Step 4: Test It

1. Refresh your browser (F5)
2. Go to Notes page in CEO or CTO dashboard
3. Type a note
4. Click "Save Note"
5. Note should appear below ✅

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

That's it! The migration will apply automatically.

## What If It Doesn't Work?

See `NOTEPAD_TROUBLESHOOTING.md` for detailed debugging steps.

## Quick Check: Did It Work?

After applying migration, run this in SQL Editor:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'notes' AND column_name = 'owner_role';
```

If you see a result, it worked! ✅

If you see "no rows", the migration didn't apply. Try again.

## Both Dashboards Work

After migration:
- ✅ CEO dashboard notepad works
- ✅ CTO dashboard notepad works
- ✅ Notes save and appear immediately
- ✅ Notes persist after refresh
- ✅ Can share notes between dashboards

## That's It!

Your notepads should now work perfectly on both dashboards.
