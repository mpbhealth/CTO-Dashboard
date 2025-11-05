# Concierge Upload System - Quick Start Guide

## 🚀 Immediate Next Steps

### 1. Apply Database Migration
```bash
# In your Supabase dashboard, run this migration:
supabase/migrations/20251105000001_concierge_upload_templates_and_enhancements.sql
```

This creates:
- ✅ Upload templates for all 3 report types
- ✅ Error tracking tables
- ✅ Data quality monitoring
- ✅ Validation functions
- ✅ Analytics summary views

### 2. Test Upload Flow

#### Option A: Use Existing Upload Component
Navigate to: `/ceo/department-upload` and select "Concierge Team"

#### Option B: Use New Dedicated Component
Navigate to: `/ceo/concierge-upload` (recommended)
- Beautiful UI with 3 report type cards
- Template format hints
- Real-time validation feedback
- Upload history tracking

### 3. Upload Your Files

#### 📊 Weekly Metrics Report
- **File**: `Concierge Report.csv` (or similar)
- **Select**: "Weekly Performance Metrics" card
- **What it does**:
  - Parses agent columns (Ace, Adam, Tupac, etc.)
  - Converts "7:30 hours" to decimal
  - Tracks members attended, phone time, tasks, requests
  - Calculates performance scores

#### 📝 Daily Interactions Report
- **File**: `Concierge Report2 copy.csv`
- **Select**: "Daily Member Interactions" card
- **What it does**:
  - Groups by date (MM.DD.YY format)
  - Detects "NO CALLS" days
  - Auto-categorizes issues (telemedicine, medication, etc.)
  - Assigns priority levels

#### 🌙 After-Hours Calls Report
- **File**: `Concierge Report3 copy.csv`
- **Select**: "After-Hours Calls" card
- **What it does**:
  - Parses timestamps ("Sep 18, 2025, 8:36:53 pm")
  - Extracts phone numbers from "+16025016607" format
  - Calculates urgency scores
  - Flags weekend and late-night calls

## 📁 File Structure Reference

### Weekly Metrics Format
```
Date Range           | Ace   | Adam  | Tupac | Notes
10.23.25-10.31.25   |       |       |       |
Members attended to  | 150   | 112   | 15    | ***Note
Phone Time          | 7:30h | 6:45h | 5:01h |
CRM Tasks           | 38    | 26    | N/A   |
```

### Daily Interactions Format
```
09.18.25
         NO CALLS
09.17.25
         Rusty Shelton     telemedicine
         Darin Thomas      medication
```

### After-Hours Format
```
"Sep 18, 2025, 8:36:53 pm",KASSING EMILY (+16025016607),
"Sep 15, 2025, 9:19:24 pm",SAMPLE PETER (+14028436749),
```

## ✅ What Gets Validated

### Automatic Checks
- ✓ Date formats (MM.DD.YY or full timestamps)
- ✓ Agent names match roster
- ✓ Metric values in reasonable ranges
- ✓ Phone numbers have 10+ digits
- ✓ After-hours times (8pm-8am EST)

### What Gets Flagged
- ⚠️ Phone time over 80 hours/week
- ⚠️ Members attended over 500/week
- ⚠️ Unknown agent names
- ⚠️ Uncategorized issues
- ⚠️ Calls during business hours

## 📊 Where to View Data

### CEO Dashboard Routes
1. **Upload Interface**: `/ceo/concierge-upload`
2. **Analytics Dashboard**: `/ceo/concierge-tracking` (or similar)
3. **Team Performance**: `/ceo/department-concierge`

### Database Tables to Query
```sql
-- View weekly summary
SELECT * FROM concierge_weekly_summary ORDER BY week_start_date DESC;

-- View daily interactions
SELECT * FROM concierge_daily_summary ORDER BY interaction_date DESC;

-- View after-hours calls
SELECT * FROM concierge_after_hours_summary ORDER BY call_date DESC;

-- Check recent uploads
SELECT * FROM concierge_data_quality_log
WHERE check_type = 'upload_complete'
ORDER BY created_at DESC;

-- View upload errors
SELECT * FROM concierge_upload_errors
ORDER BY created_at DESC LIMIT 50;
```

## 🔍 Troubleshooting

### Upload Failed - No Data Found
**Fix**: Check that your CSV matches the expected format for the selected report type

### Agent Not Found
**Fix**: Update `concierge_team_members` table with new agent names:
```sql
INSERT INTO concierge_team_members (agent_name, display_name, is_active)
VALUES ('NewAgent', 'New Agent Name', true);
```

### Date Parsing Errors
**Fix**: Ensure dates are in MM.DD.YY format (e.g., "10.23.25" not "10/23/2025")

### Phone Number Invalid
**Fix**: Ensure format is "+16025016607" or similar (10+ digits)

## 🎯 Success Metrics

After successful upload, you should see:
- ✅ "Upload Successful" green banner
- ✅ Rows Processed count
- ✅ Rows Succeeded count (should be high %)
- ✅ Summary data (date ranges, agents, counts)
- ✅ Entry in Recent Uploads history

## 🛠️ Advanced Usage

### Query Analytics Data
```typescript
import {
  getConciergeOverview,
  getWeeklySummary,
  getAgentPerformance,
  getIssueCategoryBreakdown
} from '../lib/conciergeAnalyticsQueries';

// Get high-level overview
const overview = await getConciergeOverview();
console.log('Weekly metrics:', overview.weeklyMetrics);
console.log('Daily metrics:', overview.dailyMetrics);
console.log('After hours:', overview.afterHoursMetrics);

// Get agent rankings
const agents = await getAgentPerformance();
agents.forEach(agent => {
  console.log(`${agent.agentName}: Score ${agent.performanceScore}`);
});
```

### Custom Upload Integration
```typescript
import { uploadConciergeFile } from '../lib/conciergeUploadService';

const result = await uploadConciergeFile(file, {
  subdepartment: 'weekly',
  fileName: file.name,
  orgId: userOrgId,
  uploadedBy: userEmail,
});

if (result.success) {
  console.log(`Uploaded ${result.rowsSucceeded} rows`);
  console.log('Summary:', result.summary);
} else {
  console.error('Upload failed:', result.errors);
}
```

## 📝 File Storage

Your uploaded CSV files are **not stored** permanently. Only the transformed, validated data is stored in the database. This:
- ✓ Saves storage space
- ✓ Ensures data consistency
- ✓ Maintains HIPAA compliance
- ✓ Allows historical analysis

The original file name is tracked in `file_name` column for audit purposes.

## 🔐 Security Notes

- All tables have Row-Level Security (RLS) enabled
- CEO, CTO, and Admin roles have full access
- Concierge role can upload and view own data
- Organization ID scoping prevents cross-tenant access
- No PHI (Protected Health Information) is stored
- Upload history tracked for compliance audit

## 🎉 You're Ready!

1. Apply the migration
2. Upload your first file
3. Check the Recent Uploads panel
4. View analytics in CEO dashboard
5. Celebrate successful integration! 🎊

---

**Need Help?** Check the full documentation in `CONCIERGE_UPLOAD_SYSTEM_COMPLETE.md`
