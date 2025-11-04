# Sales Department Upload - Quick Start Guide

## Overview
The sales department CSV upload system is now fully operational and ready to process your October 2025 sales data.

## How to Use

### Step 1: Navigate to Upload Portal
```
URL: https://your-domain.com/public/upload/sales
```

### Step 2: Download Template (Optional)
- Click "Download CSV Template" button
- Template format matches your actual sales report structure
- Sample data included for reference

### Step 3: Prepare Your CSV File
Your CSV should have these exact column headers:
```csv
Date,Name,Plan,Size,Agent,Group?
```

**Example Data:**
```csv
Date,Name,Plan,Size,Agent,Group?
10/1/2025,Russell Clark,Secure HSA,M+S,Misty Berryman,FALSE
1-Oct,George J Thibault,Secure HSA,MO,Enrollment Website,FALSE
2-Oct,Aryn e Graham,DIRECT,MO,Jonathan Masters,FALSE
```

### Step 4: Upload Your File
1. Click the upload area or drag & drop your CSV file
2. System validates the file structure
3. Preview shows first 5 rows
4. Click "Upload Data" to process

### Step 5: View Analytics
After successful upload, data appears in:
- CEO Sales Reports: `/ceo/sales-reports`
- Sales Dashboard: `/ceo/sales`
- Department Analytics: `/ceo/departments/sales`

## Supported Data Formats

### Date Formats
All three formats are automatically recognized:
- `10/1/2025` → October 1, 2025
- `1-Oct` → October 1, 2025
- `2025-10-01` → October 1, 2025

### Plan Types
- Secure HSA
- Premium HSA
- Premium Care
- Care Plus
- MEC+ESSENTIALS
- MEC+Essentials
- DIRECT

### Family Sizes
- **MO** = Member Only
- **M+S** = Member + Spouse
- **M+C** = Member + Children
- **M+F** = Member + Family (Full)

### Group Enrollment
- `TRUE` = Group enrollment
- `FALSE` = Individual enrollment
- Case insensitive

## Automatic Calculations

### Order Amounts
The system automatically calculates order amounts based on plan + size:

| Plan | MO | M+S | M+C | M+F |
|------|-----|-----|-----|-----|
| Secure HSA | $199 | $349 | $299 | $449 |
| Premium HSA | $299 | $499 | $399 | $599 |
| Care Plus | $249 | $449 | $349 | $549 |

### Auto-Generated Fields
- **Order ID**: ORD-20251001-{UUID}
- **Channel**: Direct Sales (default)
- **Status**: Completed (default)
- **Member ID**: Uses customer name from CSV

## Validation Rules

### Required Fields
- Date ✓
- Name ✓
- Plan ✓
- Size ✓
- Agent ✓

### Optional Fields
- Group? (defaults to FALSE)

### Field Constraints
- Date must be valid format
- Size must be: MO, M+S, M+C, or M+F
- Plan must match pricing table
- Name cannot be empty

## Expected Results for Your File

### File: Sales Report (1).csv
- **Total Records**: 88
- **Date Range**: October 1-31, 2025
- **Unique Agents**: ~20 (Misty Berryman, Wiley Long, Leonardo Moraes, etc.)
- **Plan Distribution**:
  - Secure HSA: ~60%
  - Care Plus: ~20%
  - Premium HSA: ~15%
  - MEC+ESSENTIALS: ~4%
  - DIRECT: ~1%

### Analytics Impact
After upload, you'll see:
- MTD Sales increase by ~$20,000+
- New orders added to pipeline
- Agent leaderboard updated
- Channel attribution refreshed

## Troubleshooting

### Upload Fails
**Problem**: "Invalid CSV format"
- **Solution**: Ensure headers match exactly: Date,Name,Plan,Size,Agent,Group?

**Problem**: "Missing required fields"
- **Solution**: Check that all rows have Date, Name, Plan, Size, and Agent values

**Problem**: "Invalid Size value"
- **Solution**: Size must be one of: MO, M+S, M+C, M+F (case-sensitive)

### Data Not Showing
**Problem**: Upload succeeded but data not in dashboard
- **Solution**: Refresh the analytics page
- **Solution**: Check date filters (ensure October 2025 is included)
- **Solution**: Verify RLS policies allow your user role to view data

### Amount Shows $0
**Problem**: Order amount calculated as zero
- **Solution**: Plan name might have typo or extra spaces
- **Solution**: Check plan_pricing table for matching entry
- **Solution**: Verify Size field is correct

## Advanced Features

### Bulk Import
- Upload multiple files sequentially
- Each upload creates new batch ID
- Historical uploads tracked in department_uploads table

### Data Validation
- Real-time CSV parsing
- Field-level validation before insert
- Error reporting with row numbers

### Pricing Updates
To update plan pricing:
```sql
UPDATE plan_pricing
SET base_amount = 229.00
WHERE plan_name = 'Secure HSA'
AND family_size = 'MO';
```

### Custom Reports
Query uploaded data directly:
```sql
SELECT
  member_name,
  plan,
  family_size,
  amount,
  order_date
FROM sales_orders
WHERE order_date >= '2025-10-01'
  AND order_date <= '2025-10-31'
ORDER BY order_date DESC;
```

## Next Departments

After confirming sales upload works perfectly, we'll implement:
1. **Concierge Department** (occurred_at, member_id, agent_name, channel, result)
2. **Operations Department** (cancel_date, member_id, reason, agent, save_attempted)
3. **Finance Department** (record_date, category, amount, vendor_customer)
4. **SaudeMAX Department** (enrollment_date, program_type, engagement_score)

Each will follow the same pattern:
- Native CSV format support
- Intelligent field mapping
- Automatic data transformation
- Real-time analytics

## Support Contacts

For technical issues:
- Check SALES_DEPARTMENT_IMPLEMENTATION.md
- Review database migrations in supabase/migrations/
- Test edge function at supabase/functions/department-data-upload/

For pricing questions:
- Update plan_pricing table
- Modify salesDataTransformer.ts constants

## Success Confirmation

Your upload is successful when you see:
1. ✓ "Successfully uploaded 88 rows!"
2. ✓ Green checkmark with row count
3. ✓ Data appears in CEO Sales Reports
4. ✓ Analytics dashboard updates
5. ✓ Agent leaderboard refreshes

**Ready to upload? Go to `/public/upload/sales` and start processing your October sales data!**
