# Notepad Not Saving - Troubleshooting Guide

## Issue
The "Save Note" button doesn't save notes to the database.

## Root Cause
The database migration hasn't been applied yet. The note sharing system requires new database columns and tables.

## Solution: Apply Database Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd /path/to/project

# Push migration to database
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Open the migration file: `/tmp/cc-agent/58570646/project/supabase/migrations/20251031000001_create_note_sharing_system.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** button

### Option 3: Manual SQL Execution

1. Connect to your Supabase database
2. Execute the SQL from: `supabase/migrations/20251031000001_create_note_sharing_system.sql`

## What the Migration Does

The migration adds these essential columns to the `notes` table:
- `owner_role` - Identifies which dashboard owns the note (ceo or cto)
- `created_for_role` - Tracks if note was created for another role
- `is_shared` - Boolean flag for shared notes
- `is_collaborative` - Tracks if recipients can edit
- `title` - Optional note title

It also creates three new tables:
- `note_shares` - Tracks who has access to shared notes
- `note_notifications` - In-app notifications for sharing events
- `note_comments` - Future feature for commenting

## Verify Migration Applied

After applying the migration, check if it worked:

### Check in Supabase Dashboard

1. Go to **Table Editor**
2. Select `notes` table
3. Verify these columns exist:
   - owner_role
   - created_for_role
   - is_shared
   - is_collaborative
4. Check that `note_shares`, `note_notifications`, and `note_comments` tables exist

### Check via SQL

Run this query in SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;
```

You should see the new columns listed.

## Testing the Fix

1. **Refresh your browser** after applying the migration
2. Open browser console (F12)
3. Go to CEO or CTO Notepad page
4. Try creating a new note
5. Check console for log messages:
   - Should see: `[NotepadWithSharing] Creating note:`
   - Should see: `[NotepadWithSharing] Note created successfully`
6. The note should appear in the list below

## Still Not Working?

### Check Console for Errors

1. Open browser console (F12)
2. Look for red error messages
3. Common errors:

   **"column does not exist"**
   - Migration not applied
   - Run migration again

   **"Not authenticated"**
   - User not logged in
   - Log in first

   **"Failed to fetch"**
   - Supabase connection issue
   - Check `.env` file has correct credentials

### Verify Environment Variables

Check that these exist in your `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Check RLS Policies

The migration creates RLS policies. Verify they exist:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'notes';
```

You should see policies like:
- "Users can view their own notes"
- "Users can view shared notes"
- "Users can create notes"
- "Users can update their own notes"

## Quick Fix Commands

### Reset and Reapply Migration

If migration partially applied:

```sql
-- Drop columns if they exist
ALTER TABLE notes DROP COLUMN IF EXISTS owner_role;
ALTER TABLE notes DROP COLUMN IF EXISTS created_for_role;
ALTER TABLE notes DROP COLUMN IF EXISTS is_shared;
ALTER TABLE notes DROP COLUMN IF EXISTS is_collaborative;

-- Drop tables if they exist
DROP TABLE IF EXISTS note_comments CASCADE;
DROP TABLE IF EXISTS note_notifications CASCADE;
DROP TABLE IF EXISTS note_shares CASCADE;

-- Now reapply the migration file
```

Then run the migration again.

## For Developers

### Debug Mode

The component now includes console logging. Watch for these messages:

```
[NotepadWithSharing] Creating note:
  dashboardRole: "ceo"
  creationMode: "personal"
  contentLength: 25
  hasTitle: false
```

If you see errors about missing columns, the migration definitely needs to be applied.

### Migration File Location

The migration that needs to be applied:
```
/tmp/cc-agent/58570646/project/supabase/migrations/20251031000001_create_note_sharing_system.sql
```

### Test Both Dashboards

After applying migration:
1. Test creating notes in CEO dashboard
2. Test creating notes in CTO dashboard
3. Test sharing a note from CEO to CTO
4. Test sharing a note from CTO to CEO
5. Verify notifications appear
6. Verify shared notes are visible

## Success Criteria

Notes are working correctly when:
- ✅ Note saves without errors
- ✅ Note appears in the list
- ✅ Success message shows "Success!"
- ✅ Note persists after page refresh
- ✅ No red errors in console
- ✅ Can create notes in both CEO and CTO dashboards
- ✅ Can share notes between dashboards (after migration)

## Need More Help?

1. Check `NOTE_SHARING_IMPLEMENTATION.md` for full technical details
2. Check `NOTEPAD_QUICK_START.md` for usage guide
3. Review Supabase logs for database errors
4. Check browser Network tab for failed API calls
