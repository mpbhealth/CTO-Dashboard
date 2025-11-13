# FIX: Notes Not Saving - Step by Step

## What's Wrong

The database migration hasn't been applied. Your console shows:

```
Failed to load resource: the server responded with a status of 400
/rest/v1/notes?select=*&created_by=eq...&owner_role=eq.cto
```

This 400 error means the `owner_role` column doesn't exist yet.

## Fix It In 5 Minutes

### Step 1: Verify Problem

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** (left sidebar)
4. Paste this quick check:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'notes' AND column_name = 'owner_role';
```

5. Click **Run**

**If you see NO RESULTS** = Migration not applied ❌
**If you see a row** = Migration already applied ✅ (problem is elsewhere)

### Step 2: Apply Migration

1. Stay in **SQL Editor**
2. Click **New Query**
3. Go to this file in your project:
   ```
   supabase/migrations/20251031000001_create_note_sharing_system.sql
   ```
4. Open it in a text editor
5. Copy ALL contents (Ctrl+A, Ctrl+C)
6. Paste into Supabase SQL Editor (Ctrl+V)
7. Click **Run** (or Ctrl+Enter)
8. Wait for "Success. No rows returned"

### Step 3: Verify Fix

Run this in SQL Editor:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;
```

You should now see these NEW columns:
- owner_role
- created_for_role
- is_shared
- is_collaborative

### Step 4: Test Notes

1. Go back to your app
2. **Refresh browser** (F5 or Ctrl+R)
3. Go to Notes page (CEO or CTO dashboard)
4. Type a test note: "Testing 123"
5. Click **Save Note**
6. Note should appear immediately ✅

## Alternative: Use CLI

If you have Supabase CLI installed:

```bash
cd /path/to/your/project
supabase db push
```

That's it!

## Still Failing?

### Check for Specific Errors

Open browser console (F12) and look for:

**Error 1: "column owner_role does not exist"**
- Solution: Migration not applied, go back to Step 2

**Error 2: "Not authenticated"**
- Solution: You're not logged in, log in first

**Error 3: "Failed to fetch"**
- Solution: Check .env file has correct Supabase URL and anon key

### Get Detailed Status

Run this complete check in SQL Editor:

```sql
-- Check 1: owner_role column
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'owner_role'
  )
  THEN '✅ Migration applied'
  ELSE '❌ Migration NOT applied'
END;

-- Check 2: note_shares table
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'note_shares'
  )
  THEN '✅ Migration applied'
  ELSE '❌ Migration NOT applied'
END;
```

### Console Should Show

After migration is applied and you try to save a note, console should show:

```
[NotepadWithSharing] Creating note: {dashboardRole: "cto", ...}
[NotepadWithSharing] Note created successfully
```

NOT:

```
[NotepadWithSharing] Error creating note: ...
Supabase request failed
```

## Why This Happened

The new note sharing system requires additional database columns that weren't in the original schema. The migration adds:

- 4 new columns to `notes` table
- 3 new tables (note_shares, note_notifications, note_comments)
- RLS policies for security
- Helper functions

Without these, the app can't save notes because it's trying to write to columns that don't exist.

## Success Checklist

After applying migration, you should have:

- ✅ Can save notes in CEO dashboard
- ✅ Can save notes in CTO dashboard
- ✅ Notes persist after page refresh
- ✅ No 400 errors in console
- ✅ No 404 errors for note_notifications
- ✅ Success message appears after saving

## Need More Help?

1. See full file: `CHECK_MIGRATION_STATUS.sql` - Comprehensive diagnostic
2. See: `NOTEPAD_TROUBLESHOOTING.md` - Detailed troubleshooting
3. See: `APPLY_NOTE_MIGRATION.md` - Alternative instructions

## The Bottom Line

**Your code is correct.** The database schema just needs to be updated. Apply the migration and it will work immediately.
