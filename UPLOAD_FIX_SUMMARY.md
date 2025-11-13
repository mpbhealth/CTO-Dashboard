# Department Upload System - Issue Resolution Summary

## Problem Identified

The CEO Department Upload feature was failing with the error:
```
Failed to insert records: Could not find the table 'public.stg_concierge_interactions'
in the schema cache (Code: PGRST205)
```

Additionally, the upload_templates table query was returning:
```
Could not find the table 'public.upload_templates' in the schema cache (Code: PGRST205)
```

## Investigation Results

### ✅ Staging Tables Status (VERIFIED WORKING)

All required staging tables **exist and are accessible**:

1. ✅ `stg_concierge_interactions` - 0 rows (ready for data)
2. ✅ `stg_sales_orders` - 0 rows (ready for data)
3. ✅ `stg_sales_leads` - 0 rows (ready for data)
4. ✅ `stg_sales_cancelations` - 0 rows (ready for data)
5. ✅ `department_uploads` - 0 rows (ready for tracking)

### ❌ Missing Table (REQUIRES ACTION)

The `upload_templates` table does not exist and must be created manually.

## Root Cause

The Supabase MCP tools (used for applying migrations) are not functioning in the Stackblitz environment. The tools return:
```
Error: A database is already setup for this project
```

This prevents automatic migration application, requiring manual SQL execution.

## Solution Prepared

### Migration File Created

**Location**: `supabase/migrations/20251105000001_create_upload_templates_table.sql`

**What it does**:
- Creates `upload_templates` table with proper schema
- Enables Row Level Security (RLS)
- Sets up read policies for authenticated users
- Sets up write policies for CEO/admin roles
- Creates performance indexes
- Inserts 7 default department templates with complete definitions

### Templates Included

The migration includes complete template definitions for:

1. **concierge** - Concierge Interactions Upload
2. **sales** - Sales Orders Upload (Date, Name, Plan, Size, Agent, Group?)
3. **sales-leads** - Sales Leads Upload (Date, Name, Source, Status, Lead Owner)
4. **sales-cancelations** - Sales Cancelations Upload (Name, Reason, Membership, Advisor, Outcome)
5. **finance** - Finance Records Upload
6. **operations** - Plan Cancellations Upload
7. **saudemax** - SaudeMAX Program Upload

Each template includes:
- Column schema with types and requirements
- Sample data for reference
- User-friendly instructions
- Active status flag

## Action Required

### Manual Migration Application

You need to manually run the SQL in Supabase:

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/sql/new
   ```

2. **Copy SQL Content**
   - Open: `supabase/migrations/20251105000001_create_upload_templates_table.sql`
   - Copy entire file contents

3. **Execute in SQL Editor**
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - Wait for success confirmation

4. **Verify Success**
   ```bash
   node scripts/apply-upload-templates-migration.mjs
   ```
   Should output: "Found 7 active templates"

## Verification Tools

Three diagnostic scripts have been created:

### 1. Check Staging Tables
```bash
node scripts/fix-staging-tables.mjs
```
Shows which staging tables exist and are accessible.

### 2. Check Upload Templates
```bash
node scripts/apply-upload-templates-migration.mjs
```
Verifies upload_templates table status and template count.

### 3. Create Templates (if table exists)
```bash
node scripts/create-upload-templates.mjs
```
Inserts template data if table exists but is empty.

## Expected Behavior After Fix

### Before Migration
- ❌ Upload templates table query fails (PGRST205)
- ❌ Department dropdown may not populate correctly
- ❌ CSV upload fails immediately with table not found error

### After Migration
- ✅ Upload templates table accessible
- ✅ All 7 departments appear in dropdown
- ✅ Template definitions load for validation
- ✅ CSV parsing validates against template schema
- ✅ Data successfully inserts into staging tables
- ✅ Upload tracking records created in department_uploads
- ✅ Success message with row counts displayed

## Testing After Fix

1. **Refresh Application**
   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

2. **Navigate to Upload Page**
   - CEO Dashboard → Department Upload

3. **Select Department**
   - Choose "Concierge Team" or "Sales Team"

4. **Upload CSV File**
   - Use sample file matching template format
   - Example for sales: Date, Name, Plan, Size, Agent, Group?

5. **Verify Success**
   - Should see: "X rows imported successfully"
   - Check department_uploads table for upload record
   - Check appropriate staging table for data rows

## Sample CSV Formats

### Sales Orders (sales)
```csv
Date,Name,Plan,Size,Agent,Group?
1-Oct,John Doe,Premium HSA,M+S,Sarah Johnson,FALSE
2-Oct,Jane Smith,Secure HSA,MO,Mike Brown,FALSE
```

### Sales Leads (sales-leads)
```csv
Date,Name,Source,Status,Lead Owner,Group Lead?,Recent Notes
10/15/2025,John Smith,Website Visit,In Process,Sarah Johnson,FALSE,Left VM
10/16/2025,Jane Doe,Friend Referral,Closed,Mike Brown,FALSE,Enrolled
```

### Sales Cancelations (sales-cancelations)
```csv
Name:,Reason:,Membership:,Advisor:,Outcome:
John Doe,Financial Reasons,Premium HSA,Emily Rodriguez,Left VM
Jane Smith,Aging into Medicare,Secure HSA,Tom Wilson,Great feedback
```

## Security Considerations

The migration implements proper security:

### Row Level Security (RLS)
- **Enabled**: All tables have RLS active
- **Read Access**: Authenticated users can view active templates
- **Write Access**: Only CEO and admin roles can modify templates
- **Insert Access**: Authenticated users can upload data to staging tables

### Data Isolation
- All staging tables use org_id for multi-tenant separation
- User data isolated by authentication
- Upload tracking includes user_id for audit trail

## Build Status

✅ **Project builds successfully** with no errors:
- Vite build completed
- All TypeScript files compiled
- No missing dependencies
- All imports resolved correctly

## Documentation

Three comprehensive guides created:

1. **DATABASE_FIX_GUIDE.md** - Complete fix instructions
2. **UPLOAD_FIX_SUMMARY.md** - This document
3. Migration comments in SQL file

## Next Steps

1. ✅ **COMPLETED**: Diagnosed issue and verified staging tables exist
2. ✅ **COMPLETED**: Created comprehensive migration with all templates
3. ✅ **COMPLETED**: Built diagnostic and verification scripts
4. ✅ **COMPLETED**: Documented the entire fix process
5. ✅ **COMPLETED**: Verified project builds successfully
6. ⏳ **PENDING**: Manual migration application in Supabase Dashboard
7. ⏳ **PENDING**: Verification that upload functionality works
8. ⏳ **PENDING**: End-to-end testing with real CSV files

## Support Files

All necessary files are in place:

- ✅ `supabase/migrations/20251105000001_create_upload_templates_table.sql`
- ✅ `scripts/fix-staging-tables.mjs`
- ✅ `scripts/apply-upload-templates-migration.mjs`
- ✅ `scripts/create-upload-templates.mjs`
- ✅ `DATABASE_FIX_GUIDE.md`
- ✅ `UPLOAD_FIX_SUMMARY.md`

## Contact Points

If issues persist:
- Check Supabase logs for detailed error messages
- Verify user role is 'ceo' or 'admin' in profiles table
- Confirm org_id is properly set in user profile
- Check browser console for client-side errors
- Review Network tab for API request/response details
