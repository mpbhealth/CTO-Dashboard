# CEO Dashboard - Data Import Quick Start

## Prerequisites

1. Access to Supabase dashboard for your project
2. Your spreadsheet data exported as CSV files
3. CEO user account with proper role assignment

## Step 1: Run the Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20251024180000_create_ceo_reporting_tables.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl/Cmd + Enter`
7. Verify success message appears

### Option B: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset  # This runs all migrations including the new one
```

## Step 2: Prepare Your CSV Files

### Expected Data Structure

Your spreadsheet data should have these approximate structures:

#### Concierge Interactions CSV
```csv
member_id,interaction_date,agent,channel,result,duration_minutes,notes
MEM001,2025-10-15,John Smith,Phone,Resolved,15,Member called about benefits
MEM002,2025-10-16,Sarah Lee,Email,Pending,0,Follow-up required
```

#### Concierge Notes CSV
```csv
note_date,member_id,note_owner,note,tags,priority
2025-10-15,MEM001,John Smith,Called regarding claim status,claims;urgent,high
2025-10-16,MEM002,Sarah Lee,Sent benefits overview,benefits,medium
```

#### Sales Orders CSV
```csv
order_date,order_id,member_id,amount,plan,rep,channel,status
2025-10-01,ORD001,MEM001,299.99,Premium,Mike Johnson,Direct,closed
2025-10-02,ORD002,MEM002,149.99,Basic,Lisa Chen,Referral,closed
```

#### CRM Leads CSV
```csv
lead_date,lead_id,source,status,owner,score
2025-10-01,LEAD001,Google Ads,qualified,Mike Johnson,85
2025-10-02,LEAD002,Referral,contacted,Lisa Chen,70
```

#### Cancellations CSV
```csv
cancel_date,member_id,reason,agent,save_attempted,save_successful,mrr_lost
2025-10-01,MEM100,Price too high,John Smith,true,false,99.99
2025-10-02,MEM101,Switching providers,Sarah Lee,true,true,149.99
```

## Step 3: Import Data via Supabase Dashboard

### For Each Staging Table:

1. **Navigate to Table Editor:**
   - In Supabase dashboard, click **Table Editor**
   - Find your staging table (e.g., `stg_concierge_interactions`)

2. **Import CSV:**
   - Click the **...** menu (three dots) next to the table name
   - Select **Import data from CSV**
   - Click **Choose File** and select your CSV
   - Review the column mapping preview
   - Adjust column mappings if needed
   - Click **Import**

3. **Repeat for Each Table:**
   - `stg_concierge_interactions` ← Your concierge interactions CSV
   - `stg_concierge_notes` ← Your concierge notes CSV
   - `stg_sales_orders` ← Your sales orders CSV
   - `stg_crm_leads` ← Your leads CSV
   - `stg_plan_cancellations` ← Your cancellations CSV

## Step 4: Verify Data Import

Run these queries in the SQL Editor to check your data:

```sql
-- Check concierge interactions
SELECT COUNT(*) as total_interactions FROM stg_concierge_interactions;
SELECT * FROM concierge_interactions LIMIT 5;

-- Check concierge notes
SELECT COUNT(*) as total_notes FROM stg_concierge_notes;
SELECT * FROM concierge_notes LIMIT 5;

-- Check sales orders
SELECT COUNT(*) as total_orders FROM stg_sales_orders;
SELECT * FROM sales_orders LIMIT 5;

-- Check CRM leads
SELECT COUNT(*) as total_leads FROM stg_crm_leads;
SELECT * FROM crm_leads LIMIT 5;

-- Check cancellations
SELECT COUNT(*) as total_cancellations FROM stg_plan_cancellations;
SELECT * FROM plan_cancellations LIMIT 5;
```

## Step 5: Verify Modeled Views

The modeled views automatically transform your staging data. Check that they're working:

```sql
-- Test concierge metrics
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT agent_name) as unique_agents,
  AVG(duration_minutes) as avg_duration
FROM concierge_interactions;

-- Test sales metrics
SELECT
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value
FROM sales_orders;

-- Test cancellation metrics
SELECT
  COUNT(*) as total_cancels,
  SUM(mrr_lost) as total_mrr_lost,
  SUM(CASE WHEN save_successful THEN 1 ELSE 0 END) as saves
FROM plan_cancellations;
```

## Step 6: Access CEO Dashboard

1. Navigate to your application URL
2. Login with CEO credentials (ensure user role is set to 'ceo' in profiles table)
3. You should be redirected to `/ceod/home`
4. Navigate to reporting pages:
   - **Concierge Tracking:** Click "Concierge" in the navigation
   - **Sales Reports:** Click "Sales" in the navigation
   - **Operations:** Click "Operations" in the navigation

## Troubleshooting

### Issue: No data showing in reports

**Check 1:** Verify staging tables have data
```sql
SELECT COUNT(*) FROM stg_concierge_interactions;
```

**Check 2:** Verify modeled views have data
```sql
SELECT COUNT(*) FROM concierge_interactions;
```

**Check 3:** Check for data type mismatches
```sql
-- Look for NULL values in date columns
SELECT * FROM concierge_interactions WHERE occurred_at IS NULL LIMIT 10;
```

**Fix:** If dates aren't parsing, check your CSV date format. Expected format: `YYYY-MM-DD`

### Issue: CSV import fails

**Common causes:**
1. **Column name mismatch:** CSV headers must match staging table column names
2. **Date format issues:** Use ISO format (YYYY-MM-DD) for dates
3. **Special characters:** Ensure CSV is UTF-8 encoded
4. **Large files:** Import in batches of 5000-10000 rows

**Solution:** Clean your CSV data:
```bash
# Remove special characters in Excel/Sheets
# Ensure dates are formatted as: 2025-10-15
# Save as CSV (UTF-8)
```

### Issue: Permission errors

**Check user role:**
```sql
SELECT user_id, email, role FROM profiles WHERE email = 'catherine@mpbhealth.com';
```

**Fix role if needed:**
```sql
UPDATE profiles
SET role = 'ceo'
WHERE email = 'catherine@mpbhealth.com';
```

### Issue: RLS policy blocking access

**Test as specific user:**
```sql
-- Set the user context for testing
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';

-- Now test queries
SELECT * FROM concierge_interactions LIMIT 1;
```

## Data Update Workflow

### Regular Updates (Weekly/Monthly)

1. **Export new data from your systems** to CSV
2. **Option A - Replace all data:**
   ```sql
   TRUNCATE TABLE stg_concierge_interactions;
   -- Then import new CSV via dashboard
   ```

3. **Option B - Append new records:**
   - Just import the new CSV
   - Duplicates won't be created if you have unique IDs

### Incremental Updates

For ongoing updates, consider creating an edge function that accepts CSV uploads and automatically imports to staging tables.

## Advanced: Bulk SQL Import

If you have large datasets, you can use SQL COPY commands:

```sql
-- Example: Import from a URL (if CSV is hosted)
COPY stg_concierge_interactions(member_id, interaction_date, agent, channel, result, duration_minutes, notes)
FROM 'https://your-cdn.com/concierge_data.csv'
WITH (FORMAT csv, HEADER true);
```

## Column Mapping Reference

### Staging Tables → Your CSV Columns

Map your actual CSV column names to these staging table columns:

#### stg_concierge_interactions
- `member_id` ← Your member/customer ID
- `interaction_date` ← Date of interaction (YYYY-MM-DD)
- `agent` ← Agent/rep name
- `channel` ← Communication channel (Phone, Email, Chat, etc.)
- `result` ← Outcome (Resolved, Pending, Escalated, etc.)
- `duration_minutes` ← Length of interaction in minutes
- `notes` ← Free-text notes

#### stg_sales_orders
- `order_date` ← Date order placed
- `order_id` ← Unique order identifier
- `member_id` ← Customer ID
- `amount` ← Order amount (can include $ and commas, will be parsed)
- `plan` ← Plan/product name
- `rep` ← Sales rep name
- `channel` ← Sales channel (Direct, Referral, Online, etc.)
- `status` ← Order status (open, closed, cancelled)

#### stg_plan_cancellations
- `cancel_date` ← Date of cancellation
- `member_id` ← Customer ID
- `reason` ← Cancellation reason
- `agent` ← Agent who processed
- `save_attempted` ← Boolean (true/false or 1/0)
- `save_successful` ← Boolean (true/false or 1/0)
- `mrr_lost` ← Monthly recurring revenue lost

## Security Notes

- All staging tables use RLS (Row Level Security)
- Only users with 'ceo' or 'admin' role can read data
- All imports are logged in audit_logs table
- Data is private by default; sharing must be explicit

## Next Steps After Import

1. **Verify all pages load** with real data
2. **Test filters** on each reporting page
3. **Try exporting** data to CSV/XLSX
4. **Share a file** with CTO to test cross-sharing
5. **Set up recurring imports** (weekly/monthly process)

## Support

If you encounter issues:
1. Check the CEO_DASHBOARD_IMPLEMENTATION.md for architecture details
2. Review Supabase logs in the dashboard
3. Contact: vinnie@mpbhealth.com

---

**Quick Command Reference:**

```sql
-- Check all staging table counts
SELECT
  (SELECT COUNT(*) FROM stg_concierge_interactions) as concierge,
  (SELECT COUNT(*) FROM stg_sales_orders) as sales,
  (SELECT COUNT(*) FROM stg_plan_cancellations) as cancellations;

-- Check all modeled view counts
SELECT
  (SELECT COUNT(*) FROM concierge_interactions) as concierge,
  (SELECT COUNT(*) FROM sales_orders) as sales,
  (SELECT COUNT(*) FROM plan_cancellations) as cancellations;

-- Clear all data (for re-import)
TRUNCATE TABLE stg_concierge_interactions;
TRUNCATE TABLE stg_concierge_notes;
TRUNCATE TABLE stg_sales_orders;
TRUNCATE TABLE stg_crm_leads;
TRUNCATE TABLE stg_plan_cancellations;
```
