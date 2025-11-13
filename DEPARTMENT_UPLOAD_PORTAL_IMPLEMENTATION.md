# Department Data Upload Portal Implementation

## Overview

A complete public-facing department data upload system has been implemented, allowing non-authenticated users to securely upload data to MPB Health's database through a beautiful, production-ready interface.

## Features Implemented

### 1. Public Landing Page
- **Route**: `/public/upload`
- **Component**: `PublicDepartmentUploadLanding.tsx`
- **Features**:
  - Beautiful gradient design with MPB Health branding
  - Five department selection cards: Concierge, Sales, Operations, Finance, and SaudeMAX
  - Each department card has unique colors, icons, and descriptions
  - Security features highlighted (encryption, fast processing, instant validation)
  - Contact support section with email integration
  - Responsive design for all screen sizes

### 2. Module-Specific Upload Pages
- **Route**: `/public/upload/:department`
- **Component**: `PublicDepartmentUpload.tsx`
- **Supported Departments**:

  **Concierge** (Teal theme):
  - occurred_at, member_id, agent_name, channel, result, duration_minutes, notes

  **Sales** (Blue theme):
  - order_date, order_id, member_id, amount, plan, rep, channel, status

  **Operations** (Orange theme):
  - cancel_date, member_id, reason, agent, save_attempted, save_successful, mrr_lost

  **Finance** (Green theme):
  - record_date, category, amount, description, vendor_customer, status, notes

  **SaudeMAX** (Purple theme):
  - enrollment_date, member_id, program_type, status, engagement_score, satisfaction_score, health_improvement

### 3. Upload Features
- **CSV Template Downloads**: Each department has a downloadable CSV template with sample data
- **Drag-and-Drop Upload**: Modern file upload interface with visual feedback
- **Real-time Validation**: Instant CSV parsing and validation with error reporting
- **Data Preview**: View first 5 rows of uploaded data before submission
- **Progress Tracking**: Visual feedback during upload process
- **Error Handling**: Comprehensive error messages for failed uploads
- **Success Confirmation**: Clear success messages with option to upload more files

### 4. Share Button in Data Management
- **Location**: CEO Data Management page
- **Features**:
  - Teal-themed "Share Upload Portal" button next to the existing upload button
  - One-click copy-to-clipboard functionality
  - Visual confirmation when link is copied
  - Generates public URL: `https://yourdomain.com/public/upload`

### 5. Sidebar Menu Enhancement
- **New Section**: "Department Reporting"
- **Position**: Added above "Development & Planning" section
- **Icon**: FolderUp icon
- **Routing**: Links to `/ceod/data` (Data Management page)
- **Visibility**: Available to authenticated users based on role permissions

## Technical Implementation

### Routing Configuration

**main.tsx**:
- Added public routes that bypass authentication:
  - `/public/upload` - Landing page
  - `/public/upload/:department` - Department-specific upload

**DualDashboardApp.tsx**:
- Added route-to-tab mapping for department reporting
- Configured navigation from sidebar to data management page

**Sidebar.tsx**:
- Added "Department Reporting" menu item in new "reporting" category
- Updated categories object to include reporting section
- Positioned reporting section above development section

### Data Flow

1. User visits `/public/upload` (public landing page)
2. Selects a department (e.g., Sales)
3. Redirected to `/public/upload/sales`
4. Downloads CSV template or prepares their own CSV
5. Uploads CSV file
6. System validates data structure and content
7. Data preview shown for verification
8. User confirms and uploads
9. Data sent to `department-data-upload` Supabase Edge Function
10. Records inserted into appropriate staging tables
11. Upload tracked in `department_uploads` table
12. Administrators see uploads in CEO Data Management page

### Security Considerations

- Public routes intentionally allow unauthenticated access for department uploads
- All data is validated before insertion
- Uploads are tracked with batch IDs for auditing
- Integration with existing RLS policies ensures data isolation
- Edge Function handles authentication for database operations

## Usage Instructions

### For Administrators

1. Navigate to CEO Dashboard > Data Management
2. Click the "Share Upload Portal" button
3. Copy the generated link
4. Share the link with department staff via email or other secure channels
5. Monitor uploads in the "Department Uploads" tab
6. Review and approve completed uploads as needed

### For Department Staff

1. Visit the shared link: `/public/upload`
2. Select your department from the five available options
3. Download the CSV template for reference
4. Prepare your CSV file with the required fields
5. Upload your CSV file
6. Review the data preview
7. Confirm and submit
8. Receive confirmation of successful upload

## Field Requirements by Department

### Required Fields (*)
- All departments require primary date fields (e.g., occurred_at, order_date)
- Sales and Finance require amount fields
- Finance requires category field

### Optional Fields
- Most departments have optional fields for flexibility
- Boolean fields accept true/false values
- Number fields should not include currency symbols or commas
- Date fields should use YYYY-MM-DD format

## Integration Points

- **Supabase Edge Function**: `department-data-upload`
- **Database Tables**:
  - `department_uploads` (tracking)
  - `stg_concierge_interactions`
  - `stg_sales_orders`
  - `stg_plan_cancellations`
  - `stg_finance_records`
  - `stg_saudemax_data`

## Files Modified

1. `/src/components/pages/public/PublicDepartmentUploadLanding.tsx` (NEW)
2. `/src/components/pages/public/PublicDepartmentUpload.tsx` (NEW)
3. `/src/components/pages/ceod/CEODataManagement.tsx` (MODIFIED)
4. `/src/components/Sidebar.tsx` (MODIFIED)
5. `/src/main.tsx` (MODIFIED)
6. `/src/DualDashboardApp.tsx` (MODIFIED)

## Design Highlights

- **Production-Ready**: Professional gradient designs with attention to detail
- **Responsive**: Works seamlessly on mobile, tablet, and desktop
- **Consistent Branding**: Uses MPB Health logo and brand colors
- **Department Theming**: Each department has unique color schemes
- **User-Friendly**: Clear instructions, helpful error messages, and visual feedback
- **Accessible**: Proper ARIA labels and semantic HTML

## Future Enhancements

Potential improvements for future iterations:

1. Email notifications to administrators when new data is uploaded
2. Department-specific authentication with unique access codes
3. Advanced data validation rules per department
4. Bulk upload history for department staff
5. Automated data transformation and cleaning
6. Integration with department-specific dashboards
7. Real-time upload progress bars
8. File size limits and validation
9. Support for Excel (.xlsx) files in addition to CSV
10. Data mapping wizard for custom CSV formats

## Support

For questions or issues with the department upload portal:
- Contact: support@mpbhealth.com
- Documentation: This file
- Technical Support: CTO Dashboard > IT Support Tickets
