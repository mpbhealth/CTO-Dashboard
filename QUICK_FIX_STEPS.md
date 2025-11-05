# Quick Fix Steps - Department Upload System

## Issue
Upload fails with error: "Could not find the table 'public.upload_templates'"

## Root Cause
The `upload_templates` table doesn't exist in the database.

## Fix (3 Simple Steps)

### Step 1: Open Supabase SQL Editor
Navigate to:
```
https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/sql/new
```

### Step 2: Run Migration SQL
Copy and paste the entire contents of this file:
```
supabase/migrations/20251105000001_create_upload_templates_table.sql
```

Click "Run" in the SQL Editor.

### Step 3: Verify Success
Run this command in terminal:
```bash
node scripts/apply-upload-templates-migration.mjs
```

Expected output: `✅ Found 7 active templates`

## Done!
Refresh your browser and try uploading a CSV file again.

---

## Need Help?

**Check staging tables:**
```bash
node scripts/fix-staging-tables.mjs
```

**Read full documentation:**
- `DATABASE_FIX_GUIDE.md` - Detailed fix guide
- `UPLOAD_FIX_SUMMARY.md` - Complete investigation summary

**Test with sample CSV:**

Sales format (save as `test-sales.csv`):
```csv
Date,Name,Plan,Size,Agent,Group?
1-Oct,John Doe,Premium HSA,M+S,Sarah Johnson,FALSE
```

Upload at: CEO Dashboard → Department Upload → Select "Sales Team"

---

## Summary
✅ All staging tables verified working
✅ Migration SQL created and ready to apply
✅ Verification scripts created
✅ Project builds successfully
⏳ Manual SQL execution required in Supabase Dashboard
