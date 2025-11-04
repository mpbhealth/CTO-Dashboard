# Concierge Department Upload System - Implementation Complete

## Executive Summary

Enterprise-grade data extraction and upload system for **three distinct Concierge report types**:

1. **Weekly Performance Metrics** - Multi-agent productivity tracking with dynamic column parsing
2. **Daily Interactions** - Member touchpoint logs with intelligent issue categorization
3. **After Hours Calls** - Emergency and off-hours contact tracking with urgency scoring

This system follows the exact architectural pattern established for Sales, Leads, and Cancelations uploads, providing the same level of precision, validation, and analytics capabilities.

---

## Architecture Overview

### Database Schema (`20251104190000_create_concierge_department_schema.sql`)

**Staging Tables:**
- `stg_concierge_weekly_metrics` - Raw weekly performance data with flexible agent columns
- `stg_concierge_daily_interactions` - Raw daily call logs and member interactions
- `stg_concierge_after_hours` - Raw after-hours call tracking with timestamps

**Lookup Tables:**
- `concierge_issue_categories` - 25+ predefined issue types with priority levels
- `concierge_team_members` - Active concierge team roster (Ace, Adam, Angee, Tupac, Leo, Julia)
- `concierge_request_types` - RX, Imaging, Lab, Appt request classification

**Production Views:**
- `concierge_weekly_metrics` - Normalized metrics with intelligent parsing:
  - Date range parsing: "10.23.25-10.31.25" → start_date, end_date
  - Phone time conversion: "7:30 hours" → 7.5 decimal hours
  - Incomplete task parsing: "11| 30" → 11 incomplete, 30 next week
  - Dynamic metric value calculation based on type

- `concierge_daily_interactions` - Normalized interactions with categorization:
  - Date parsing: "09.18.25" → 2025-09-18
  - Issue categorization via keyword matching
  - Priority level assignment (1-3)
  - "NO CALLS" day detection

- `concierge_after_hours` - Normalized after-hours calls with urgency:
  - Timestamp parsing: "Sep 18, 2025, 8:36:53 pm" → full timestamp
  - Member name extraction from "KASSING EMILY (+16025016607)"
  - Phone number extraction and formatting
  - Urgency scoring (5-10) based on time and day
  - Weekend/late-night detection

---

## Data Transformation Layer

### 1. Weekly Metrics Transformer (`conciergeWeeklyMetricsTransformer.ts`)

**Capabilities:**
- Parses multi-week report structure with dynamic agent columns
- Handles 8 metric types: Members attended, Phone Time, CRM Tasks, Incomplete Tasks, RX/Imaging/Lab/Appt Requests
- Converts time formats: "7:30 hours", "9:23 hours", "0:58 hours" → decimal
- Extracts pipe-separated incomplete tasks: "11| 30" → 11 incomplete, 30 pending
- Preserves notes from 4th and 5th columns
- Validates metrics ranges (hours 0-168, members 0-1000)
- Calculates agent performance scores (0-100)

**Key Functions:**
```typescript
parseDateRange(dateRange: string)           // "10.23.25-10.31.25" → {start, end}
parsePhoneTime(timeStr: string)             // "7:30 hours" → 7.5
parseIncompleteTasksFormat(value: string)   // "11| 30" → {incomplete: 11, nextWeek: 30}
transformWeeklyMetricsFile(data)            // Full file transformation
calculateAgentPerformanceScore(metrics)     // 0-100 scoring
identifyTopPerformers(data)                 // Ranked agent list
```

### 2. Daily Interactions Transformer (`conciergeDailyInteractionsTransformer.ts`)

**Capabilities:**
- Parses date-based interaction logs with sparse data structure
- Handles "NO CALLS" entries
- Extracts and cleans member names (removes "(Contact)", "x 2", "- Zoho CRM")
- Categorizes 20+ issue types via keyword matching
- Detects urgency levels (low/medium/high)
- Analyzes trends by category with increasing/stable/decreasing classification
- Calculates daily volume and common issues

**Key Functions:**
```typescript
parseInteractionDate(dateStr: string)       // "09.18.25" → "09.18.25"
categorizeIssue(issueDescription: string)   // "rx update" → "rx update"
extractMemberName(memberName: string)       // Clean formatting
detectIssueUrgency(issueDescription)        // low/medium/high
transformDailyInteractionsFile(data)        // Full file transformation
analyzeTrendsByCategory(data)               // Trend detection per category
```

### 3. After Hours Transformer (`conciergeAfterHoursTransformer.ts`)

**Capabilities:**
- Parses full timestamp format with AM/PM
- Extracts member name and phone from combined field
- Formats phone numbers: "+16025016607" → "+1 (602) 501-6607"
- Calculates urgency scores (5-10) based on time and day
- Detects weekend calls, late night (10pm-6am), early morning (1-6am)
- Identifies high-priority callers (repeat after-hours contacts)
- Analyzes response patterns by hour and day of week
- Detects potential duplicates (same member <30 min apart)

**Key Functions:**
```typescript
parseAfterHoursTimestamp(timestamp)         // "Sep 18, 2025, 8:36:53 pm" → Date
extractMemberNameFromPhone(memberWithPhone) // "KASSING EMILY (+16025016607)" → {name, phone}
formatPhoneNumber(phone)                    // "+16025016607" → "+1 (602) 501-6607"
calculateUrgencyScore(date)                 // 5-10 based on time/day
analyzeResponsePatterns(data)               // Hour/day distribution + peak times
identifyHighPriorityCallers(data)           // Repeat callers with avg urgency
```

### 4. Integration Module (`conciergeDataTransformer.ts`)

**Capabilities:**
- Automatic report type detection based on structure
- Unified transformation interface for all three report types
- Validation with detailed error reporting
- Summary generation for upload preview
- Database row formatting with metadata injection

**Key Functions:**
```typescript
detectConciergeReportType(data)             // Auto-detect: weekly/daily/after_hours
transformConciergeData(data, reportType)    // Transform with validation
getConciergeUploadTableName(reportType)     // Get target staging table
formatConciergeRowForInsert(row, type)      // Format for Supabase insert
```

---

## File Structure Analysis

### File 1: Weekly Performance Report
```csv
10.23.25-10.31.25,Ace,Adam,Tupac,,
Members attended to,150,112,15,,
Phone Time,7:30 hours,6:45 hours,5:01 hours,,
CRM Tasks,38,26,N/A,***Adam was off 10.24.25,
Incomplete/Next Week Tasks,11| 30,14 | 16,N/A,***Incomplete tasks are for 10.31,
RX Requests,1,3,N/A,,
```

**Parsing Logic:**
- Row 1: Date range header → current week context
- Row 2+: Metric name in col 1, agent values in cols 2-5, notes in col 6-7
- Each agent-metric combination becomes one database row
- Dynamically handles varying numbers of agents (3-6 agents observed)

### File 2: Daily Interactions
```csv
09.18.25,,,,
,NO CALLS,,,
09.17.25,,,,
,Rusty Shelton,telemedicine,,
,advisor,,,
,Darin Thomas,medication,,
```

**Parsing Logic:**
- Rows with date in col 1 → set current date context
- Rows with blank col 1 → interaction records
- Col 2 = member name, Col 3 = issue, Col 4 = notes
- "NO CALLS" entries tracked separately
- Consecutive rows belong to current date until new date encountered

### File 3: After Hours Calls
```csv
"Sep 18, 2025, 8:36:53 pm",KASSING EMILY (+16025016607),
"Sep 15, 2025, 9:19:24 pm",SAMPLE PETER (+14028436749),
"Sep 15, 2025, 8:07:39 pm",TOMKINSON D. (+13032171888),N/A
```

**Parsing Logic:**
- Col 1: Full timestamp with month name, day, year, time, AM/PM
- Col 2: Member name + phone in format "NAME (+PHONE)"
- Col 3: Notes (optional, may be "N/A")
- Each row is independent (no date context tracking needed)

---

## Database Integration

### Department Uploads Extension (`20251104191000_add_concierge_to_department_uploads.sql`)

**Changes:**
- Added `concierge` to valid department enum
- Added `subdepartment` column to `department_uploads` table
- Created validation constraints:
  - Concierge subdepartments: 'weekly', 'daily', 'after_hours'
  - Sales subdepartments: 'orders', 'leads', 'cancelations'
- Added composite indexes for efficient querying:
  - `idx_department_uploads_subdepartment`
  - `idx_department_uploads_dept_subdept`

### Row Level Security (RLS)

All staging tables have RLS enabled with policies:
- **SELECT**: CEO, admin, CTO, concierge roles can read
- **INSERT**: All authenticated users can insert (for upload functionality)

Views inherit security from underlying staging tables.

---

## Validation Rules

### Weekly Metrics
- ✅ Date range must be valid format: "MM.DD.YY-MM.DD.YY"
- ✅ Agent name must be non-empty and recognized
- ✅ Metric type must match one of 8 predefined types
- ✅ Metric value must be non-empty
- ✅ Phone time must be 0-168 hours per week
- ✅ Member count must be 0-1000

### Daily Interactions
- ✅ Date must be valid format: "MM.DD.YY"
- ✅ Member name must be non-empty (except "NO CALLS")
- ✅ Date must be parseable to valid date object

### After Hours
- ✅ Timestamp must be valid format: "Mon DD, YYYY, HH:MM:SS am/pm"
- ✅ Member name must be extractable from combined field
- ✅ Phone number must be at least 10 digits
- ⚠️ Warning: Calls during business hours (8am-8pm) flagged

---

## Analytics Capabilities

### Weekly Metrics Analytics
- Agent performance scoring (0-100)
- Top performers ranking
- Total members attended across all agents
- Total phone hours and average per member
- Task completion tracking
- Request type distribution (RX, Imaging, Lab, Appt)

### Daily Interactions Analytics
- Issue category distribution (20+ categories)
- Daily volume trends
- Top 10 most common issues
- Urgency level breakdown
- Trend analysis by category (increasing/stable/decreasing)
- "NO CALLS" day tracking

### After Hours Analytics
- Weekend vs weekday call distribution
- Late night calls (10pm-6am)
- Early morning calls (1am-6am)
- Peak hour identification
- Hour-by-hour distribution
- Day of week patterns
- High-priority repeat callers
- Duplicate call detection (<30 min apart)
- Urgency scoring (5-10 scale)

---

## Upload Flow

1. **File Upload** → User uploads CSV via CEO Department Upload Portal
2. **File Detection** → `detectConciergeReportType()` analyzes structure
3. **Transformation** → Appropriate transformer converts raw data to normalized format
4. **Validation** → Each row validated with detailed error reporting
5. **Preview** → User sees summary: total rows, valid rows, errors, statistics
6. **Insert** → Valid rows inserted to staging table with batch ID
7. **View Materialization** → Production views provide clean, queryable data
8. **Analytics** → Dashboard displays KPIs, trends, agent performance

---

## Integration Points

### Existing Components to Update

1. **CEODepartmentUploadPortal.tsx**
   - Add concierge to department dropdown
   - Add subdepartment selector for concierge (weekly/daily/after_hours)
   - Integrate file type auto-detection
   - Display concierge-specific upload preview

2. **CEODepartmentConcierge.tsx**
   - Connect to concierge data views
   - Display weekly metrics summary
   - Show daily interaction trends
   - Highlight after-hours call patterns

3. **ConciergePanel.tsx** (CEO Dashboard)
   - Quick metrics: Total interactions, after-hours calls, team performance
   - Top issues this week
   - Agent leaderboard
   - Upload shortcut

### New Components Needed

1. **ConciergeWeeklyMetricsChart.tsx**
   - Multi-agent performance comparison
   - Metric trends over time
   - Request type distribution

2. **ConciergeDailyInteractionsGrid.tsx**
   - Searchable interaction log
   - Filter by date, member, issue category
   - Urgency indicators

3. **ConciergeAfterHoursCalendar.tsx**
   - Calendar view of after-hours calls
   - Heat map by hour/day
   - High-priority caller alerts

---

## Next Steps

### Phase 1: UI Integration (Next Task)
- [ ] Update CEODepartmentUploadPortal with concierge support
- [ ] Add subdepartment selector
- [ ] Implement file type auto-detection
- [ ] Create upload preview with concierge-specific stats

### Phase 2: Dashboard Integration
- [ ] Update ConciergePanel with live data from views
- [ ] Create weekly metrics visualization component
- [ ] Create daily interactions grid component
- [ ] Create after-hours calendar/heat map component

### Phase 3: Analytics & Reporting
- [ ] Build agent performance reports
- [ ] Create issue trend analysis dashboard
- [ ] Implement after-hours response time tracking
- [ ] Add exportable reports (PDF, Excel)

### Phase 4: Testing & Validation
- [ ] Test upload with all three CSV file types
- [ ] Verify data accuracy in staging tables
- [ ] Validate view transformations
- [ ] Test error handling for malformed files
- [ ] Performance test with large datasets

---

## Technical Notes

### Performance Optimizations
- Composite indexes on staging tables for fast batch queries
- Views use intelligent WHERE clauses to filter during read
- Batch inserts via Supabase client for efficient uploads
- Pagination support for large result sets

### Error Handling
- Row-level validation with detailed error messages
- File structure validation before transformation
- Graceful handling of missing or malformed data
- User-friendly error reporting in upload UI

### Scalability
- Staging table design supports millions of rows
- Partitioning strategy ready for time-based archival
- Views optimized for common query patterns
- Indexes designed for read-heavy analytics workload

---

## Success Metrics

✅ **Database Schema**: 3 staging tables, 3 views, 3 lookup tables created
✅ **Transformers**: 3 specialized transformers + 1 integration module completed
✅ **Validation**: Comprehensive validation for all three report types
✅ **Analytics**: 20+ analytical functions across all transformers
✅ **Documentation**: Complete implementation guide with examples

**Ready for UI integration and end-to-end testing!**
