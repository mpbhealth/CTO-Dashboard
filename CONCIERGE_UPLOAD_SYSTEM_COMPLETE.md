# Concierge Upload System - Complete Implementation Guide

## Overview

The Concierge Upload System is a comprehensive data ingestion, validation, and analytics platform designed to process three distinct types of Concierge reports. The system provides end-to-end functionality from CSV upload through data transformation, database storage, and executive-level analytics.

## System Architecture

### 1. Database Layer

#### Staging Tables
Three staging tables store raw uploaded data:

- **`stg_concierge_weekly_metrics`** - Weekly team performance data
- **`stg_concierge_daily_interactions`** - Daily member touchpoint logs
- **`stg_concierge_after_hours`** - After-hours emergency call tracking

Each staging table includes:
- Upload tracking (batch ID, file name, uploaded by)
- Row-level metadata (row number, processing status)
- Error logging capabilities
- Organization ID for multi-tenant support

#### Lookup Tables
Reference data for validation and categorization:

- **`concierge_team_members`** - Active concierge team roster (Ace, Adam, Angee, Tupac, Leo, Julia)
- **`concierge_issue_categories`** - Issue types with priority levels and resolution times
- **`concierge_request_types`** - Service request classifications (RX, Imaging, Lab, Appt)

#### Transformation Views
Normalized views that parse and transform staging data:

- **`concierge_weekly_metrics`** - Parsed weekly metrics with calculated values
- **`concierge_daily_interactions`** - Categorized interactions with priority levels
- **`concierge_after_hours`** - Timestamped calls with urgency scoring

#### Summary Views
Aggregated analytics views for dashboard consumption:

- **`concierge_weekly_summary`** - Week-over-week performance trends
- **`concierge_daily_summary`** - Daily interaction volume and priorities
- **`concierge_after_hours_summary`** - After-hours call patterns and urgency

#### Support Tables
Error tracking and data quality monitoring:

- **`concierge_upload_templates`** - Template definitions for each report type
- **`concierge_upload_errors`** - Row-level validation failures
- **`concierge_data_quality_log`** - Upload history and quality metrics

### 2. File Structure Mapping

#### Report Type 1: Weekly Performance Metrics
**File Pattern:** `Concierge Report*.csv`
**Subdepartment:** `weekly`

**Structure:**
```
Date Range         | Ace    | Adam   | Tupac  | Notes
10.23.25-10.31.25  |        |        |        |
Members attended   | 150    | 112    | 15     | ***Adam off 10.24
Phone Time         | 7:30 h | 6:45 h | 5:01 h |
CRM Tasks          | 38     | 26     | N/A    |
```

**Key Features:**
- Multi-column format with dynamic agent columns
- Date ranges as row identifiers (MM.DD.YY-MM.DD.YY)
- Metric types in first column
- Agent-specific values in named columns
- Optional notes column for context

**Transformations:**
- Parse date range into start/end dates
- Convert "7:30 hours" to decimal hours (7.5)
- Handle "11| 30" format for incomplete tasks (11 incomplete, 30 next week)
- Filter out "N/A" and "?" values
- Validate agent names against team roster

#### Report Type 2: Daily Member Interactions
**File Pattern:** `Concierge Report2*.csv`
**Subdepartment:** `daily`

**Structure:**
```
09.18.25
         NO CALLS
09.17.25
         Rusty Shelton      telemedicine
         advisor
         Darin Thomas       medication
```

**Key Features:**
- Date-grouped format with dates in first column
- Member names and issues in subsequent columns
- Special "NO CALLS" entries for inactive days
- Multi-line entries (advisor detail on separate row)

**Transformations:**
- Parse MM.DD.YY dates to standard format
- Detect and flag NO CALLS days
- Extract member names (clean "x 2" multipliers)
- Categorize issues using keyword matching
- Assign priority levels (1=high, 2=medium, 3=low)
- Filter out empty or "advisor" rows

#### Report Type 3: After-Hours Call Log
**File Pattern:** `Concierge Report3*.csv`
**Subdepartment:** `after_hours`

**Structure:**
```
"Sep 18, 2025, 8:36:53 pm",KASSING EMILY (+16025016607),
"Sep 15, 2025, 9:19:24 pm",SAMPLE PETER (+14028436749),
"Sep 15, 2025, 8:07:39 pm",TOMKINSON D. (+13032171888),N/A
```

**Key Features:**
- Timestamp in "Mon DD, YYYY, HH:MI:SS am/pm" format
- Member name with phone number in parentheses
- Optional notes column

**Transformations:**
- Parse complex timestamp format to PostgreSQL timestamptz
- Extract member name from "NAME (+PHONE)" format
- Extract and validate phone numbers
- Calculate urgency score based on time and day
- Determine if weekend call
- Identify late night (10pm-6am) calls
- Filter "N/A" notes

### 3. Validation Rules

#### Weekly Metrics Validation
```typescript
- Date range: Required, format MM.DD.YY-MM.DD.YY
- Agent name: Required, must exist in team roster
- Metric type: Required, must be valid metric
- Metric value: Required, type-specific validation:
  - Members: 0-500 range
  - Phone Time: 0-80 hours/week
  - Tasks: 0-100 range
  - Requests: 0-50 range
```

#### Daily Interactions Validation
```typescript
- Date: Required, format MM.DD.YY
- Member name: Required (allow "NO CALLS")
- Issue description: Optional for NO CALLS, recommended otherwise
- Date must be in past (not future dates)
```

#### After-Hours Validation
```typescript
- Timestamp: Required, valid date/time format
- Must be outside business hours (before 8am or after 8pm)
- Member name: Required
- Phone number: Optional, but if present must be valid (10+ digits)
```

### 4. Upload Flow

#### Step 1: File Selection
1. User selects report type (Weekly/Daily/After Hours)
2. System displays template information and format requirements
3. User uploads CSV file via drag-drop or file browser
4. File extension validation (.csv required)

#### Step 2: Parsing & Transformation
1. Parse CSV file using PapaParse library
2. Apply appropriate transformer based on subdepartment:
   - Weekly: `transformWeeklyMetricsFile()`
   - Daily: `transformDailyInteractionsFile()`
   - After Hours: `transformAfterHoursFile()`
3. Transform returns normalized array of records

#### Step 3: Validation
1. Run validation function on each transformed record
2. Collect errors and warnings separately
3. Log validation failures to `concierge_upload_errors` table
4. Continue processing valid records even if some fail

#### Step 4: Database Insert
1. Generate upload batch ID (UUID)
2. Add metadata to each record:
   - org_id (from user profile)
   - uploaded_by (user email)
   - upload_batch_id
   - file_name
   - row_number
3. Bulk insert valid records to appropriate staging table
4. Mark processing_status as 'pending'

#### Step 5: Results & Logging
1. Count successful and failed rows
2. Generate summary statistics
3. Log upload completion to `concierge_data_quality_log`
4. Return detailed result object to UI
5. Display success/error message with details

### 5. Data Quality Monitoring

#### Automatic Checks
- **Duplicate Detection**: Same batch ID and date range
- **Value Range Validation**: Metrics outside typical ranges flagged
- **Missing Data**: Required fields empty or null
- **Format Inconsistencies**: Date/time parsing failures
- **Referential Integrity**: Agent names not in roster

#### Quality Scoring
Each upload receives quality metrics:
- Total rows processed
- Success rate percentage
- Error count by type
- Warning count by severity
- Processing duration

#### Alert Thresholds
- Warning: Success rate < 95%
- Error: Success rate < 80%
- Critical: Success rate < 50%

### 6. Analytics & Reporting

#### Weekly Performance Metrics
```sql
-- Top performing agents by week
SELECT agent_name,
       SUM(members_attended) as total_members,
       AVG(phone_hours) as avg_hours,
       performance_score
FROM agent_performance_weekly
GROUP BY agent_name
ORDER BY performance_score DESC;
```

#### Daily Interaction Trends
```sql
-- Issue category trends over time
SELECT issue_category,
       COUNT(*) as count,
       AVG(priority_level) as avg_priority,
       trend
FROM concierge_daily_summary
WHERE interaction_date >= NOW() - INTERVAL '30 days'
GROUP BY issue_category, trend
ORDER BY count DESC;
```

#### After-Hours Analysis
```sql
-- Peak after-hours call times
SELECT call_hour,
       COUNT(*) as call_count,
       AVG(urgency_score) as avg_urgency
FROM concierge_after_hours
WHERE is_weekend = false
GROUP BY call_hour
ORDER BY call_count DESC;
```

### 7. CEO Dashboard Integration

#### Key Metrics Displayed
1. **Weekly Overview**
   - Total members served
   - Active agents count
   - Average phone time per agent
   - Week-over-week change percentages

2. **Daily Activity**
   - Last 7 days interaction count
   - Average interactions per day
   - Top issue category
   - Priority distribution

3. **After-Hours Coverage**
   - Last 30 days call volume
   - Average urgency score
   - Peak call hour
   - Weekend vs weekday breakdown

4. **Team Performance**
   - Agent rankings with performance scores
   - Productivity metrics comparison
   - Efficiency indicators (time per member)

#### Dashboard Queries
- `getConciergeOverview()` - High-level summary
- `getWeeklySummary()` - Week-by-week trends
- `getAgentPerformance()` - Individual agent metrics
- `getIssueCategoryBreakdown()` - Issue distribution

### 8. Security & Access Control

#### Row-Level Security (RLS)
All tables have RLS enabled with policies:

**Staging Tables:**
- CEO, CTO, Admin: Full access (SELECT, INSERT, UPDATE)
- Concierge role: INSERT own data, SELECT own uploads
- Others: No access

**Lookup Tables:**
- All authenticated: SELECT active records
- CEO, CTO, Admin: Full management (INSERT, UPDATE, DELETE)

**Views:**
- Automatically inherit staging table policies
- No additional RLS needed (secured at source)

**Error & Quality Logs:**
- CEO, CTO, Admin, Concierge: SELECT
- System: INSERT
- No updates or deletes allowed

#### Data Privacy
- All data scoped to organization ID
- User email tracked for audit trail
- No PHI (Protected Health Information) in concierge data
- Member names are non-sensitive contact names only

### 9. Usage Instructions

#### For Concierge Team Members

**Uploading Weekly Metrics:**
1. Navigate to CEO Dashboard → Concierge Upload
2. Select "Weekly Performance Metrics"
3. Drag/drop your `Concierge Report.csv` file
4. Review template format requirements
5. Click "Upload File"
6. Verify success message and check uploaded count

**Uploading Daily Interactions:**
1. Select "Daily Member Interactions"
2. Upload `Concierge Report2.csv`
3. System will detect NO CALLS days automatically
4. Issues will be auto-categorized
5. Review any warnings about uncategorized issues

**Uploading After-Hours Calls:**
1. Select "After-Hours Calls"
2. Upload `Concierge Report3.csv`
3. System validates calls are truly after-hours
4. Urgency scores calculated automatically
5. Weekend calls flagged for visibility

#### For Executives (CEO/CTO)

**Viewing Analytics:**
1. Navigate to CEO Dashboard → Concierge Tracking
2. View weekly performance trends
3. Compare agent productivity
4. Analyze issue categories and priorities
5. Monitor after-hours call patterns

**Exporting Data:**
1. Navigate to desired report view
2. Click "Export" button
3. Select format (CSV, Excel, PDF)
4. Data includes all visible metrics

#### For Administrators

**Managing Templates:**
1. Access concierge_upload_templates table
2. Update validation rules as needed
3. Modify expected columns for format changes
4. Add new issue categories to lookup table

**Monitoring Quality:**
1. Query concierge_data_quality_log
2. Review uploads with warnings or errors
3. Check concierge_upload_errors for details
4. Contact uploaders for data corrections

### 10. Troubleshooting

#### Common Upload Errors

**"Invalid date range format"**
- Ensure dates are in MM.DD.YY-MM.DD.YY format
- Check for extra spaces or special characters
- Verify year is 2-digit format

**"Agent not found in team roster"**
- Verify agent name spelling (Ace, Adam, Angee, Tupac, Leo, Julia)
- Check for extra spaces or capitalization issues
- Update concierge_team_members table if new agent

**"No valid data found in file"**
- Ensure CSV has correct structure for report type
- Check that header row is present (for Weekly)
- Verify file is not empty or corrupted

**"Phone time hours out of valid range"**
- Check for typos in hour values
- Ensure format is "7:30 hours" or "7.5 hours"
- Maximum 80 hours per week (warning threshold)

#### Data Quality Issues

**High Warning Count:**
- Review warnings in upload result
- Common causes: unexpected values, missing categories
- Warnings don't block import but should be reviewed

**Low Success Rate:**
- Check file format matches template exactly
- Verify no structural changes to CSV layout
- Review first failed row for clues to systematic issues

**Missing Data in Dashboard:**
- Ensure upload completed successfully
- Check that dates fall within dashboard filter range
- Verify organization ID matches user profile

### 11. File Examples

#### Example 1: Weekly Metrics (Concierge Report.csv)
```csv
10.23.25-10.31.25,Ace,Adam,Tupac,,
Members attended to,150,112,15,,
Phone Time,7:30 hours,6:45 hours,5:01 hours,,
CRM Tasks,38,26,N/A,***Adam was off 10.24.25,
RX Requests,1,3,N/A,,
Imaging Requests,0,0,N/A,,
Lab Requests,1,1,N/A,,
Appt Requests,0,1,N/A,,
```

#### Example 2: Daily Interactions (Concierge Report2.csv)
```csv
09.18.25,,,,
,NO CALLS,,,
09.17.25,,,,
,Rusty Shelton,telemedicine,,
,advisor,,,
,Darin Thomas,medication,,
09.16.25,,,,
,Daniel Gutierrez,price increase question,,
,Shaunt Hartounian,plan questions,,
```

#### Example 3: After-Hours Calls (Concierge Report3.csv)
```csv
"Sep 18, 2025, 8:36:53 pm",KASSING EMILY (+16025016607),
"Sep 15, 2025, 9:19:24 pm",SAMPLE PETER (+14028436749),
"Sep 15, 2025, 8:07:39 pm",TOMKINSON D. (+13032171888),N/A
```

## Deployment Checklist

### Database Migration
- [ ] Run migration `20251105000001_concierge_upload_templates_and_enhancements.sql`
- [ ] Verify all tables created successfully
- [ ] Check RLS policies are enabled
- [ ] Confirm lookup tables are populated

### Frontend Integration
- [ ] Deploy `conciergeUploadService.ts` to production
- [ ] Deploy `conciergeAnalyticsQueries.ts` to production
- [ ] Deploy `CEOConciergeUpload.tsx` component
- [ ] Add route to CEO dashboard navigation
- [ ] Test file upload from production environment

### Testing
- [ ] Upload all three report types
- [ ] Verify data appears in staging tables
- [ ] Check transformation views show parsed data
- [ ] Confirm analytics queries return results
- [ ] Test error handling with invalid files
- [ ] Validate RLS policies work correctly

### Documentation
- [ ] Share this guide with Concierge team
- [ ] Train users on upload process
- [ ] Document any custom validation rules
- [ ] Create backup/recovery procedures

## Support & Maintenance

### Monitoring
- Check `concierge_data_quality_log` daily for upload failures
- Review `concierge_upload_errors` for patterns in validation issues
- Monitor dashboard query performance (add indexes if slow)
- Track storage growth of staging tables (archive old data quarterly)

### Maintenance Tasks
- **Weekly**: Review upload error patterns, update issue categories
- **Monthly**: Archive processed staging data older than 90 days
- **Quarterly**: Review agent roster, update validation rules
- **Annually**: Performance optimization, schema review

### Enhancement Opportunities
1. **Automated Categorization**: Machine learning for issue classification
2. **Predictive Analytics**: Forecast call volumes and staffing needs
3. **Real-Time Alerts**: Slack/email notifications for urgent patterns
4. **Mobile Upload**: Allow uploads from mobile devices
5. **API Integration**: Direct integration with CRM systems

---

**Last Updated:** November 5, 2025
**Version:** 1.0
**Maintained By:** Vinnie Champion, CTO
