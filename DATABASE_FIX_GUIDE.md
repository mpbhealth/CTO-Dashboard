# Database Schema Fix - Upload Templates Table

## Issue Summary

The department upload system was failing with error:
```
Failed to insert records: Could not find the table 'public.upload_templates' in the schema cache (Code: PGRST205)
```

## Root Cause

The `upload_templates` table does not exist in the Supabase database. This table is required for the CEO Department Upload feature to function properly.

## Status of Staging Tables

✅ **Working Tables** (verified via direct query):
- `stg_concierge_interactions` - Concierge department data
- `stg_sales_orders` - Sales enrollment data
- `stg_sales_leads` - Lead tracking data
- `stg_sales_cancelations` - Cancelation reports
- `department_uploads` - Upload tracking/history

❌ **Missing Table**:
- `upload_templates` - Template definitions for CSV uploads

## Solution

### Manual Fix (Required)

Since the Supabase MCP tools are not working in this environment, you need to manually apply the migration:

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/xnijhggwgbxrtvlktviz/sql/new

2. **Run Migration SQL**
   - Open file: `supabase/migrations/20251105000001_create_upload_templates_table.sql`
   - Copy the entire SQL content
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify Success**
   - Run: `node scripts/apply-upload-templates-migration.mjs`
   - Should show 7 active templates

### What This Creates

The migration creates:

**Table: `upload_templates`**
- Stores CSV upload template definitions for each department
- Includes schema validation rules, sample data, and user instructions
- Has RLS policies for CEO/admin management

**Default Templates** (7 total):
- `concierge` - Concierge Interactions Upload
- `sales` - Sales Orders Upload
- `sales-leads` - Sales Leads Upload
- `sales-cancelations` - Sales Cancelations Upload
- `finance` - Finance Records Upload
- `operations` - Plan Cancellations Upload
- `saudemax` - SaudeMAX Program Upload

### Security

- **RLS Enabled**: Row Level Security is active
- **Read Access**: All authenticated users can view active templates
- **Write Access**: Only CEO and admin roles can manage templates

## Testing After Fix

1. Refresh the application
2. Navigate to CEO Dashboard → Department Upload
3. Select a department (e.g., "Concierge Team")
4. Upload a CSV file matching the template format
5. Verify: Upload completes successfully with row counts displayed

## Scripts Available

- `scripts/fix-staging-tables.mjs` - Check which staging tables exist
- `scripts/apply-upload-templates-migration.mjs` - Verify upload_templates status
- `scripts/create-upload-templates.mjs` - Insert template data (after table exists)

## Migration File Location

The complete SQL migration is saved at:
```
supabase/migrations/20251105000001_create_upload_templates_table.sql
```

This file includes:
- Table creation with proper schema
- RLS policies for security
- Indexes for performance
- All 7 default template definitions with sample data

## Expected Behavior After Fix

Once the migration is applied:

1. **Template Selection**: Department dropdown will show all 7 departments
2. **Template Loading**: System will fetch template definitions from database
3. **Upload Validation**: CSV columns will be validated against template schema
4. **Data Insertion**: Parsed rows will be inserted into correct staging tables
5. **Success Feedback**: Upload UI will show "X rows imported successfully"

## Error Prevention

The migration uses `ON CONFLICT (department, version) DO NOTHING` to:
- Prevent duplicate template entries
- Allow safe re-running of migration
- Preserve existing template customizations

## Next Steps

1. ✅ Apply the migration SQL in Supabase Dashboard
2. ✅ Verify templates exist with the verification script
3. ✅ Test upload functionality with sample CSV
4. ✅ Build project to ensure no compile errors

## Support

If issues persist after applying the migration:

1. Check Supabase logs for RLS policy violations
2. Verify user has CEO or admin role in profiles table
3. Confirm org_id is properly set in user profile
4. Check network tab for 401/403 authentication errors
