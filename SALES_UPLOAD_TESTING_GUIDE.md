# Sales Department - Upload Testing Guide

## Implementation Complete ✅

All three sales report types are now fully operational with database migrations applied and file viewing capabilities added to the CEO dashboard.

## What's Ready to Test

### 1. Database Schema
- ✅ `stg_sales_leads` table created
- ✅ `sales_leads` view with intelligent transformations
- ✅ `stg_sales_cancelations` table created
- ✅ `sales_cancelations` view with churn analysis
- ✅ Migrations applied to Supabase
- ✅ All RLS policies in place

### 2. Upload Portals
Three separate upload URLs are available:

**Sales Orders:**
```
URL: /public/upload/sales
File Format: Date, Name, Plan, Size, Agent, Group?
```

**Leads Reports:**
```
URL: /public/upload/sales-leads
File Format: Date, Name, Source, Status, Lead Owner, Group Lead?, Recent Notes
```

**Cancelation Reports:**
```
URL: /public/upload/sales-cancelations
File Format: Name:, Reason:, Membership:, Advisor:, Outcome:
```

### 3. CEO Dashboard
**URL:** `/ceod/sales/reports`

**Features Available:**
- ✅ Three tabs: Sales Orders | Lead Pipeline | Churn Analysis
- ✅ Unified KPI metrics at top
- ✅ Individual analytics per tab
- ✅ Uploaded files section with cards
- ✅ Click any file card to view data in modal
- ✅ Download button in file viewer
- ✅ Export functionality per tab

## How to Test

### Step 1: Upload Your First File (Leads)

1. Open browser and navigate to:
   ```
   http://localhost:5173/public/upload/sales-leads
   ```

2. You'll see the upload interface with:
   - Green color theme for Leads
   - Field structure showing: Date, Name, Source, Status, Lead Owner, Group Lead?, Recent Notes
   - "Download CSV Template" button

3. Upload your "Leads Reports (1).csv" file:
   - Click upload area or drag & drop
   - System validates the CSV
   - Preview shows first 5 rows
   - Click "Upload Data" button

4. Expected Result:
   - Success message: "Successfully uploaded X rows!"
   - Green checkmark appears
   - Data flows to `stg_sales_leads` table

### Step 2: Upload Cancelation Report

1. Navigate to:
   ```
   http://localhost:5173/public/upload/sales-cancelations
   ```

2. Upload your "Cancelation reports.csv" file

3. Expected Result:
   - File processes with amber/warning color theme
   - Shows number of rows imported
   - Data stored in `stg_sales_cancelations`

### Step 3: View in CEO Dashboard

1. Navigate to:
   ```
   http://localhost:5173/ceod/sales/reports
   ```

2. You should see:
   - **Top KPI Cards:**
     - MTD Sales: Dollar amount
     - Pipeline: Estimated lead value
     - Conversion Rate: Percentage
     - Churn Rate: Percentage

   - **Three Tabs:**
     - Sales Orders (Blue) - Shows existing orders
     - Lead Pipeline (Green) - Shows your uploaded leads
     - Churn Analysis (Amber) - Shows cancelations

3. Click "Lead Pipeline" tab:
   - Should see pie chart of lead sources
   - Bar chart of lead status
   - Table of all leads with Date, Name, Source, Status, Owner

4. Click "Churn Analysis" tab:
   - Should see bar chart of cancelation reasons
   - Advisor retention leaderboard
   - Table of all cancelations

### Step 4: View and Download Files

1. Scroll down on the same dashboard page

2. You should see "Uploaded Files" section with cards showing:
   - File name
   - Upload date
   - Badge showing type (Orders/Leads/Cancelations)
   - Row count
   - Status (completed)
   - "View Data" button

3. Click "View Data" on any file card:
   - Modal opens showing full data table
   - Pagination controls (50 rows per page)
   - Download button at top
   - X button to close

4. Click "Download" button:
   - Downloads CSV file to your computer
   - File contains all rows from that upload

## Troubleshooting

### No Data Showing in Dashboard

**Problem:** Uploaded files but dashboard shows no data

**Solutions:**
1. Check if upload was successful (look for success message)
2. Refresh the dashboard page (F5)
3. Verify date filters aren't excluding your data
4. Check browser console for errors (F12)

**Check Database:**
```sql
-- Verify leads were uploaded
SELECT COUNT(*) FROM stg_sales_leads;

-- Verify view is working
SELECT COUNT(*) FROM sales_leads;

-- Check upload records
SELECT * FROM department_uploads WHERE department IN ('sales-leads', 'sales-cancelations');
```

### Upload Fails

**Problem:** CSV upload shows error

**Common Causes:**
1. **Missing Columns:** Ensure CSV has exact column names
   - Leads: `Date,Name,Source,Status,Lead Owner,Group Lead?,Recent Notes`
   - Cancelations: `Name:,Reason:,Membership:,Advisor:,Outcome:`

2. **Empty Rows:** CSV has many blank rows
   - Solution: Clean up CSV, remove empty rows

3. **Invalid Data:** Missing required fields
   - Leads require: Date, Name, Source, Status, Lead Owner
   - Cancelations require: Name, Reason

### File Cards Not Showing

**Problem:** Uploaded successfully but no file cards appear

**Check:**
1. Are you logged in as CEO role?
2. Is `department_uploads` table being populated?
3. Check RLS policies allow your user to read uploads

**SQL Query to Verify:**
```sql
SELECT * FROM department_uploads
WHERE department IN ('sales', 'sales-leads', 'sales-cancelations')
ORDER BY created_at DESC;
```

### Modal Not Opening

**Problem:** Click "View Data" but nothing happens

**Check:**
1. Browser console for JavaScript errors
2. Verify data exists in respective table
3. Check network tab for failed API calls

## Expected Data Flow

```
User Uploads CSV
     ↓
Edge Function: department-data-upload
     ↓
Routes based on department type:
  - sales → stg_sales_orders
  - sales-leads → stg_sales_leads
  - sales-cancelations → stg_sales_cancelations
     ↓
Database Views Transform Data:
  - sales_orders (existing)
  - sales_leads (NEW - date parsing, note analysis)
  - sales_cancelations (NEW - churn categorization)
     ↓
CEO Dashboard Queries Views
     ↓
Displays in Three Tabs + File Cards
     ↓
User Can View/Download via Modal
```

## Verification Checklist

### Pre-Upload Checks
- [ ] Leads CSV has correct format: `Date,Name,Source,Status,Lead Owner,Group Lead?,Recent Notes`
- [ ] Cancelations CSV has correct format: `Name:,Reason:,Membership:,Advisor:,Outcome:`
- [ ] CSV files have data (not just headers)

### Post-Upload Checks
- [ ] Success message appears
- [ ] Row count matches your CSV
- [ ] No errors in browser console
- [ ] Dashboard loads without errors

### Dashboard Verification
- [ ] Top KPIs show numbers (not $0.0K everywhere)
- [ ] Lead Pipeline tab shows your leads
- [ ] Churn Analysis tab shows cancelations
- [ ] Charts render correctly
- [ ] Tables display data
- [ ] File cards appear at bottom
- [ ] Click file card opens modal
- [ ] Download button works

## Sample Data Expectations

### From "Leads Reports (1).csv"
- Total Rows: ~29 (excluding blank rows)
- Date Range: October 13-31, 2025
- Lead Sources: Website Visit, Word Of Mouth, Referall, Former Member, etc.
- Lead Owners: Leonardo Moraes, Tupac Manzanarez, Wendy, Karen Torsoe, Adam Jordano

### From "Cancelation reports.csv"
- Total Rows: ~44
- Reasons: Aging into Medicare, Switching to employer-sponsored, Found more comprehensive coverage
- Membership Types: Secure HSA, Premium HSA, Care Plus, MEC+Essentials, Direct
- Advisors: Wiley Long, Louis Spatafore, Karen Torsoe, Cindy Gordon, etc.

## Success Criteria

✅ **Upload Success:**
- Both CSV files upload without errors
- Correct row counts reported
- Data appears in staging tables

✅ **Dashboard Success:**
- All three tabs display data correctly
- KPIs calculate from uploaded data
- Charts render with proper values
- Tables show all uploaded rows

✅ **File Management Success:**
- File cards appear for all uploads
- Modal opens when clicking "View Data"
- Full table displays in modal
- Download produces valid CSV file

## What to Report Back

When testing, please share:

1. **Upload Results:**
   - Did uploads succeed?
   - Were row counts correct?
   - Any error messages?

2. **Dashboard Display:**
   - Do you see data in all three tabs?
   - Are KPIs showing realistic numbers?
   - Do charts render correctly?

3. **File Cards:**
   - How many file cards appear?
   - Do they show correct metadata?
   - Does clicking open the modal?

4. **Screenshots:**
   - Dashboard with all three tabs
   - File cards section
   - File viewer modal (if working)

## Next Steps After Successful Test

Once confirmed working:
1. ✅ Deploy to production
2. ✅ Train team on upload process
3. ✅ Schedule regular data uploads
4. 🔄 Implement remaining departments (Concierge, Operations, Finance, SaudeMAX)
5. 🔄 Add advanced analytics features (lead scoring, churn prediction)

---

**Ready to Test!** Navigate to the upload portals and start uploading your CSV files. The system is fully functional and waiting for your data.
