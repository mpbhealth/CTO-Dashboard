# Upload Test Instructions - READY NOW

## ✅ What Was Just Fixed

**Edge Function Redeployed:**
- Fixed CORS headers for cross-origin requests
- Updated routing for `sales-leads` and `sales-cancelations`
- Function is now live and ready to accept uploads

**Database Ready:**
- ✅ `stg_sales_leads` table exists
- ✅ `sales_leads` view created
- ✅ `stg_sales_cancelations` table exists
- ✅ `sales_cancelations` view created
- ✅ All RLS policies applied

## 🎯 Test Right Now

### Test 1: Upload Leads Report

1. **Navigate to:**
   ```
   https://mpbco.netlify.app/public/upload/sales-leads
   ```

2. **Upload File:**
   - Use your "Leads Reports (1).csv" file
   - Should have columns: Date, Name, Source, Status, Lead Owner, Group Lead?, Recent Notes

3. **Expected Result:**
   - File validates ✓
   - Preview shows data ✓
   - Upload succeeds with "Successfully uploaded X rows!" message ✓
   - No CORS errors ✓

### Test 2: Upload Cancelation Report

1. **Navigate to:**
   ```
   https://mpbco.netlify.app/public/upload/sales-cancelations
   ```

2. **Upload File:**
   - Use your "Cancelation reports.csv" file
   - Should have columns: Name:, Reason:, Membership:, Advisor:, Outcome:

3. **Expected Result:**
   - Upload succeeds ✓
   - Row count matches CSV ✓

### Test 3: View in Dashboard

1. **Navigate to:**
   ```
   https://mpbco.netlify.app/ceod/sales/reports
   ```

2. **Check KPIs (Top Section):**
   - MTD Sales: Should show dollar amount
   - Pipeline: Should show lead count and estimated value
   - Conversion Rate: Should show percentage
   - Churn Rate: Should show percentage

3. **Check Lead Pipeline Tab:**
   - Click "Lead Pipeline" tab (green)
   - Should see pie chart with lead sources
   - Should see bar chart with lead statuses
   - Should see table with all your uploaded leads

4. **Check Churn Analysis Tab:**
   - Click "Churn Analysis" tab (amber)
   - Should see bar chart with cancelation reasons
   - Should see advisor retention leaderboard
   - Should see table with all cancelations

5. **Check Uploaded Files Section:**
   - Scroll to bottom of page
   - Should see "Uploaded Files" heading with file icon
   - Should see cards for each uploaded file
   - Cards show: filename, date, type badge, row count, status
   - Each card has "View Data" button

6. **Test File Viewer:**
   - Click "View Data" on any file card
   - Modal should open showing full data table
   - Should see all columns from that report
   - Should see pagination controls if >50 rows
   - Click "Download" button at top
   - CSV file should download to your computer

## 🔍 What to Look For

### Success Indicators
- ✅ Upload completes without errors
- ✅ Data appears in dashboard immediately (may need refresh)
- ✅ Charts render with actual data (not empty)
- ✅ Tables show your uploaded records
- ✅ File cards appear at bottom
- ✅ Modal opens when clicking "View Data"
- ✅ Download produces valid CSV

### If Something Fails

**CORS Error Again:**
- Check browser console (F12)
- Verify you're on https://mpbco.netlify.app (not localhost)
- Try hard refresh (Ctrl+Shift+R)

**No Data in Dashboard:**
- Verify upload showed success message
- Check row count in success message
- Refresh dashboard page (F5)
- Check if date filters are excluding data

**File Cards Not Showing:**
- Make sure you're viewing the page as CEO role
- Check that upload status was "completed"
- Verify department_uploads table has records:
  ```sql
  SELECT * FROM department_uploads
  WHERE department IN ('sales-leads', 'sales-cancelations')
  ORDER BY created_at DESC;
  ```

**Modal Not Opening:**
- Check browser console for JavaScript errors
- Verify the clicked file's department matches table name
- Try different file card

## 📊 Expected Data After Upload

### Leads Report
- **Rows:** ~29 leads
- **Date Range:** October 2025
- **Sources:** Website Visit, Word Of Mouth, Referall, etc.
- **Owners:** Leonardo Moraes, Tupac Manzanarez, Wendy, etc.
- **Statuses:** In process, First Attempt, Closed, N/a

### Cancelation Report
- **Rows:** ~44 cancelations
- **Reasons:** Aging into Medicare, Switching to employer-sponsored, Found more comprehensive coverage, Financial Reasons, Other
- **Memberships:** Secure HSA, Premium HSA, Care Plus, MEC+Essentials, Direct
- **Advisors:** Wiley Long, Louis Spatafore, Karen Torsoe, Cindy Gordon, etc.
- **Outcomes:** Left VM, Retained, various feedback

## 🎉 Success Criteria

Upload and dashboard integration is successful when:

1. **Upload Portal:**
   - Both file types upload without errors
   - Success messages show correct row counts
   - No CORS or network errors

2. **CEO Dashboard:**
   - All three tabs display correctly
   - KPIs show calculated values
   - Charts render with your data
   - Tables display all uploaded rows
   - File cards appear at bottom

3. **File Viewer:**
   - Modal opens showing full dataset
   - Pagination works for large files
   - Download produces valid CSV
   - Close button returns to dashboard

## 🚀 Ready to Go!

The system is fully deployed and ready for testing. The CORS issue has been resolved and all database tables are in place.

**Start testing now at:**
- Leads Upload: https://mpbco.netlify.app/public/upload/sales-leads
- Cancelations Upload: https://mpbco.netlify.app/public/upload/sales-cancelations
- Dashboard View: https://mpbco.netlify.app/ceod/sales/reports

Report back with results and screenshots if possible!
