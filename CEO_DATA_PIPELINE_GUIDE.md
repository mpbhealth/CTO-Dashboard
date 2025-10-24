# CEO Dashboard Data Pipeline - Complete Implementation Guide

## Overview

This guide documents the complete CEO dashboard data pipeline implementation that transforms raw Excel spreadsheet data into production-ready analytics views with automated ETL, comprehensive security, and performance optimization.

## Architecture

```
Excel Sheets (CSV Export)
    ↓
Raw Staging Tables (stg_raw_*)
    ↓
ETL Transformation Functions
    ↓
Normalized Staging Tables (stg_*)
    ↓
Modeled Views (concierge_interactions, sales_orders, etc.)
    ↓
CEO Dashboard Pages
```

## Files Created

### Database Migrations

**`supabase/migrations/20251024200000_ceo_unified_data_pipeline.sql`**
- Comprehensive data pipeline infrastructure
- Raw staging tables for direct Excel imports
- Normalized staging tables for cleaned data
- ETL transformation functions
- Modeled production views
- Aggregation views for KPIs
- Performance indexes
- Import history tracking

### Edge Function

**`supabase/functions/ceo-data-import/index.ts`**
- Secure CSV import endpoint
- Role-based access control (CEO/admin only)
- Automatic ETL trigger on successful import
- Batch tracking and error reporting
- Import history logging

### React Components

**`src/hooks/useCEODataImport.ts`**
- React hook for data import operations
- Progress tracking
- Import history retrieval
- Error handling

**`src/components/ui/CEODataImporter.tsx`**
- Drag-and-drop CSV upload interface
- Real-time import progress display
- Success/error feedback
- Per-dataset import instructions

**`src/components/pages/ceod/CEODataManagement.tsx`**
- Complete data management interface
- Dataset selection UI
- Import history viewer
- Tab-based navigation

### Routing Updates

**`src/DualDashboardApp.tsx`**
- Added `/ceod/data` route for CEODataManagement

**`src/components/layouts/CEODashboardLayout.tsx`**
- Added "Data Import" navigation item
- Database icon integration

---

## Database Schema

### Raw Staging Tables (Excel Import Layer)

#### `stg_raw_cancellations`
Direct import from all Cancellation Reports month sheets.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| org_id | uuid | Organization FK |
| sheet_name | text | Source sheet name (e.g., "October 2025") |
| import_batch_id | uuid | Import batch identifier |
| name | text | Member name |
| reason | text | Cancellation reason |
| membership | text | Membership type |
| advisor | text | Advisor name |
| outcome | text | Save attempt outcome |
| imported_at | timestamptz | Import timestamp |

#### `stg_raw_leads`
Direct import from Leads Reports sheets.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| org_id | uuid | Organization FK |
| import_batch_id | uuid | Import batch identifier |
| date | text | Lead date (unparsed) |
| name | text | Lead name |
| source | text | Lead source |
| status | text | Lead status |
| lead_owner | text | Lead owner |
| group_lead | text | Group lead flag |
| recent_notes | text | Recent notes |
| imported_at | timestamptz | Import timestamp |

#### `stg_raw_sales`
Direct import from Sales Report sheets.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| org_id | uuid | Organization FK |
| import_batch_id | uuid | Import batch identifier |
| date | text | Order date (unparsed) |
| name | text | Customer name |
| plan | text | Plan type |
| size | text | Group size |
| agent | text | Sales agent |
| group_flag | text | Group flag |
| imported_at | timestamptz | Import timestamp |

#### `stg_raw_concierge_interactions`
Direct import from Concierge Report sheets.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| org_id | uuid | Organization FK |
| import_batch_id | uuid | Import batch identifier |
| interaction_date | text | Interaction date (unparsed) |
| member_name | text | Member name |
| member_phone | text | Member phone |
| agent | text | Agent name |
| interaction_type | text | Interaction type/channel |
| notes | text | Interaction notes |
| duration_minutes | numeric | Call duration |
| imported_at | timestamptz | Import timestamp |

### Normalized Staging Tables

These tables receive transformed data from ETL functions.

- `stg_concierge_interactions` - Cleaned concierge data
- `stg_concierge_notes` - Cleaned notes data
- `stg_sales_orders` - Cleaned sales data
- `stg_crm_leads` - Cleaned lead data
- `stg_plan_cancellations` - Cleaned cancellation data

### Modeled Views

Production-ready views with full data cleaning and type conversion.

#### `concierge_interactions`
```sql
SELECT
  staging_id,
  org_id,
  member_id,
  occurred_at (parsed date),
  agent_name,
  channel,
  result,
  duration_minutes,
  notes,
  created_at,
  imported_at
FROM stg_concierge_interactions
WHERE occurred_at IS NOT NULL
```

#### `sales_orders`
```sql
SELECT
  staging_id,
  org_id,
  order_date (parsed date),
  order_id,
  member_id,
  amount (parsed numeric),
  plan,
  rep,
  channel,
  status,
  created_at,
  imported_at
FROM stg_sales_orders
WHERE order_date IS NOT NULL
```

#### `plan_cancellations`
```sql
SELECT
  staging_id,
  org_id,
  cancel_date (parsed date),
  member_id,
  reason,
  agent,
  save_attempted (boolean),
  save_successful (boolean),
  mrr_lost (parsed numeric),
  created_at,
  imported_at
FROM stg_plan_cancellations
WHERE cancel_date IS NOT NULL
```

### Aggregation Views

Pre-computed metrics for dashboard performance.

#### `vw_concierge_metrics`
- Total touchpoints by agent and month
- Average duration
- Resolution rates
- Unique member counts

#### `vw_sales_metrics`
- Monthly revenue by channel and rep
- Deal counts and average deal size
- Customer counts

#### `vw_churn_metrics`
- Monthly cancellations by reason
- MRR lost
- Save attempt and success rates

#### `vw_agent_performance`
- Top agents by interaction count
- Resolution rates
- Average durations

---

## Import Process

### 1. Export Excel to CSV

Export each Excel sheet to individual CSV files:
- Cancellation Reports → `cancellations_october_2025.csv`
- Leads Reports → `leads_october_2025.csv`
- Sales Report → `sales_october_2025.csv`
- Concierge Report → `concierge_weekly.csv`

### 2. Access Data Management Page

Navigate to: `/ceod/data`

### 3. Select Dataset Type

Choose from:
- **Cancellation Reports** - Member churn and save attempts
- **Lead Reports** - CRM pipeline data
- **Sales Reports** - Revenue and order data
- **Concierge Reports** - Member touchpoints

### 4. Upload CSV File

- Drag and drop CSV file into upload zone
- Or click to browse and select file
- CSV will be automatically parsed and validated

### 5. Monitor Import Progress

- Real-time progress bar displays import status
- Success/failure notification appears on completion
- Rows imported and failed counts displayed
- Error details shown if any rows fail

### 6. View Import History

Switch to "Import History" tab to see:
- All past imports with timestamps
- Row counts (imported/failed)
- Batch IDs for tracking
- Error messages if applicable
- Source sheet names

---

## ETL Transformation Logic

### Date Parsing

The `parse_excel_date()` function handles multiple Excel date formats:
- ISO format: `YYYY-MM-DD`
- US format: `MM/DD/YYYY`
- Short format: `M/D/YY`
- Returns NULL for unparseable dates

### Currency Parsing

The `parse_currency()` function:
- Removes `$` symbols
- Removes commas
- Converts to numeric
- Returns 0 for invalid values

### Period Extraction

The `extract_period_from_sheet()` function:
- Extracts month/year from sheet names
- Maps "October 2025" → "2025-10"
- Used for cancellation data dating

### Save Attempt Detection

Automatically detects save attempts in cancellation outcomes:
- `save_attempted = true` if outcome contains "attempted"
- `save_successful = true` if outcome contains "saved" or "retained"

---

## Security & Access Control

### Row-Level Security (RLS)

All staging tables enforce RLS policies:

```sql
CREATE POLICY "CEO and admin can read"
  ON stg_raw_cancellations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_raw_cancellations.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );
```

### Edge Function Authorization

The import Edge Function validates:
1. User authentication (JWT token)
2. User profile existence
3. Role requirement (CEO or admin only)
4. Organization membership match

### Audit Logging

All imports are logged in `data_import_history`:
- Batch ID for traceability
- Row counts (success/failure)
- Error messages
- Timestamps (started/completed)
- Import status

---

## Performance Optimization

### Indexes Created

**Raw Staging Tables:**
- `org_id` for RLS filtering
- `import_batch_id` for batch queries
- `sheet_name` for cancellation filtering

**Normalized Staging Tables:**
- `member_id` for member lookups
- `agent` for agent performance queries
- Date columns for time-series filtering
- `org_id` for RLS enforcement

**Full-Text Search:**
- GIN index on `stg_concierge_notes.note` for search

### Query Optimization

- Use modeled views instead of direct table queries
- Aggregation views pre-compute expensive calculations
- Indexes support all common filter patterns
- Date filtering uses parsed date columns with indexes

---

## Dashboard Integration

### Existing Pages Using Data Pipeline

All existing CEO reporting pages are compatible with the new pipeline:

**`CEOConciergeTracking.tsx`**
- Queries: `concierge_interactions` view
- Metrics: Total touchpoints, avg duration, resolution rate
- Filters: Date range, agent, channel

**`CEOConciergeNotes.tsx`**
- Queries: `concierge_notes` view
- Features: Full-text search, priority filtering

**`CEOSalesReports.tsx`**
- Queries: `sales_orders` view
- Metrics: Revenue, deal size, pipeline value
- Charts: Channel attribution, top performers

**`CEOOperations.tsx`**
- Queries: `plan_cancellations` view
- Metrics: Churn count, MRR lost, save rate
- Charts: Trend line, top reasons

---

## Troubleshooting

### Import Fails with "Insufficient Permissions"

**Solution:** Ensure user has CEO or admin role in profiles table.

```sql
UPDATE profiles
SET role = 'ceo'
WHERE id = 'user-uuid';
```

### Dates Not Parsing Correctly

**Solution:** Check Excel date format. Export dates as text in `YYYY-MM-DD` format.

### Import Shows Success but No Data in Views

**Solution:** Check that dates are parseable. Views filter out rows with NULL dates.

```sql
SELECT COUNT(*) FROM stg_plan_cancellations;
SELECT COUNT(*) FROM plan_cancellations;
```

If counts differ, date parsing failed. Re-export with correct format.

### Edge Function Not Found

**Solution:** Deploy the Edge Function:

```bash
# Using Supabase CLI (if available)
supabase functions deploy ceo-data-import

# Or use the Supabase dashboard to manually create the function
```

### ETL Functions Not Running

**Solution:** Check function existence and permissions:

```sql
SELECT * FROM pg_proc WHERE proname LIKE 'etl_transform%';
```

If missing, re-run migration `20251024200000_ceo_unified_data_pipeline.sql`.

---

## Manual ETL Execution

If you need to manually re-run ETL transformations:

```sql
-- Transform cancellations
SELECT etl_transform_cancellations();

-- Transform leads
SELECT etl_transform_leads();

-- Transform sales
SELECT etl_transform_sales();

-- Transform concierge
SELECT etl_transform_concierge();
```

---

## Data Quality Checks

### Check Import Completeness

```sql
SELECT
  source_table,
  sheet_name,
  rows_imported,
  rows_failed,
  status,
  started_at
FROM data_import_history
ORDER BY started_at DESC
LIMIT 10;
```

### Check Modeled View Counts

```sql
SELECT 'concierge_interactions' as view_name, COUNT(*) as row_count FROM concierge_interactions
UNION ALL
SELECT 'sales_orders', COUNT(*) FROM sales_orders
UNION ALL
SELECT 'plan_cancellations', COUNT(*) FROM plan_cancellations
UNION ALL
SELECT 'crm_leads', COUNT(*) FROM crm_leads;
```

### Check Date Parsing Success Rate

```sql
-- Cancellations
SELECT
  COUNT(*) as total_rows,
  COUNT(cancel_date) as parsed_dates,
  ROUND(100.0 * COUNT(cancel_date) / COUNT(*), 2) as parse_success_pct
FROM plan_cancellations;
```

---

## Backup & Recovery

### Backup Raw Data

```sql
-- Export to CSV for archival
COPY stg_raw_cancellations TO '/path/to/backup/cancellations_backup.csv' CSV HEADER;
```

### Clear and Re-import

```sql
-- Clear specific batch
DELETE FROM stg_raw_cancellations WHERE import_batch_id = 'batch-uuid';

-- Clear normalized data (will be regenerated by ETL)
TRUNCATE stg_plan_cancellations;

-- Re-run ETL
SELECT etl_transform_cancellations();
```

---

## Next Steps

### Recommended Enhancements

1. **Scheduled Imports**: Create scheduled Edge Function to auto-import from connected Google Sheets or OneDrive
2. **Data Validation Rules**: Add constraint checks for required fields and value ranges
3. **Change Detection**: Track data changes over time for audit purposes
4. **Automated Alerts**: Notify CEO of anomalies (e.g., spike in cancellations)
5. **Export Functionality**: Add CSV/Excel export from dashboard pages

### Monitoring

Set up monitoring for:
- Import success/failure rates
- Data freshness (time since last import)
- Query performance on modeled views
- Storage usage for staging tables

---

## Support

For issues or questions:
- Check import history at `/ceod/data` → Import History tab
- Review Supabase logs for Edge Function errors
- Verify RLS policies allow data access for your role
- Contact: vinnie@mpbhealth.com

---

**Implementation Date:** October 24, 2025
**Status:** Production Ready
**Migration:** `20251024200000_ceo_unified_data_pipeline.sql`
**Edge Function:** `ceo-data-import`
