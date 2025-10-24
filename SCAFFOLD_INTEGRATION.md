# File Upload & Export System Integration Guide

This guide documents the production-ready file upload and export system integrated into the MPB Health CTO Dashboard.

## Architecture Overview

The system uses Supabase Edge Functions (Deno runtime) for serverless processing, Supabase Storage for file management, and role-based access control through existing authentication patterns.

### Components

1. **Supabase Edge Functions**
   - `file-upload` - Handles multipart file uploads with auth
   - `export-data` - Generates CSV/XLSX exports server-side

2. **React Components**
   - `FileUpload` - Reusable upload component with progress tracking
   - Export client utilities with domain-specific helpers

3. **Database Infrastructure**
   - Storage buckets with RLS policies
   - Audit logging for HIPAA compliance

## File Upload System

### Edge Function: `file-upload`

**Location**: `supabase/functions/file-upload/index.ts`

**Features**:
- Multipart form data handling
- Role-based access (admin, ceo, hipaa_officer, privacy_officer, security_officer)
- File size validation (50MB max)
- Automatic audit logging
- Support for multiple storage buckets

**Deployment**:
```bash
# Deploy to Supabase
supabase functions deploy file-upload

# Test locally
supabase functions serve file-upload
```

**API Usage**:
```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("pathPrefix", "compliance");
formData.append("bucket", "uploads");

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/file-upload`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  }
);
```

### React Component: `FileUpload`

**Location**: `src/components/FileUpload.tsx`

**Props**:
- `pathPrefix` - Folder path within bucket (default: "general")
- `bucket` - Storage bucket name (default: "uploads")
- `accept` - File type restrictions (e.g., "image/*,.pdf")
- `label` - Input label text
- `onUploaded` - Callback with upload result

**Usage Example**:
```tsx
import FileUpload from "@/components/FileUpload";

function ComplianceDocumentUpload() {
  return (
    <FileUpload
      pathPrefix="compliance/evidence"
      bucket="uploads"
      accept=".pdf,.doc,.docx"
      label="Upload Evidence Document"
      onUploaded={(result) => {
        console.log("Uploaded:", result.path);
        console.log("Public URL:", result.publicUrl);
      }}
    />
  );
}
```

## Export System

### Edge Function: `export-data`

**Location**: `supabase/functions/export-data/index.ts`

**Features**:
- CSV and XLSX export formats
- Server-side generation using ExcelJS
- Role-based access control
- Automatic audit logging
- Custom sheet names for XLSX

**Deployment**:
```bash
supabase functions deploy export-data
```

**API Usage**:
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/export-data`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      format: "xlsx",
      data: [{ name: "John", score: 95 }],
      filename: "report.xlsx",
      sheetName: "Results",
    }),
  }
);
```

### Export Client Utilities

**Location**: `src/lib/exportClient.ts`

**Domain-Specific Helpers**:
```typescript
// Compliance reports
await exportComplianceReport(auditData, "xlsx");

// Member retention data
await exportMemberData(retentionData, "csv");

// Policy documents
await exportPolicyAudit(policyData, "xlsx");

// Employee performance
await exportEmployeePerformance(performanceData, "xlsx");

// Marketing analytics
await exportMarketingAnalytics(metricsData, "xlsx");
```

**TypeScript Interfaces**:
- `ComplianceAuditData`
- `MemberRetentionData`
- `PolicyDocumentData`
- `EmployeePerformanceData`
- `MarketingMetricsData`

## Storage Infrastructure

### Buckets

**Primary Bucket**: `uploads`
- General purpose file storage
- 50MB file size limit
- Allowed types: images, PDFs, Office documents, CSV, plain text

**Existing Buckets**:
- `hipaa-evidence` - Compliance evidence files
- `employee-documents` - Employee compliance documents

### RLS Policies

**uploads bucket**:
- Admins/officers can upload, read, and delete
- Users can read their own files (path-based)
- All operations logged for audit

**Migration**: `20251024000001_create_uploads_storage_infrastructure.sql`

## Audit Logging

All file operations are logged to the `audit_logs` table:

```typescript
{
  user_id: uuid,
  action: "file_upload" | "data_export",
  resource_type: "storage" | "export",
  resource_id: string,
  details: {
    bucket?: string,
    filename?: string,
    size?: number,
    format?: string,
    row_count?: number
  },
  created_at: timestamp
}
```

**Viewing Audit Logs**:
```sql
SELECT * FROM audit_logs
WHERE action IN ('file_upload', 'data_export')
ORDER BY created_at DESC
LIMIT 100;
```

## Integration Examples

### Example 1: Compliance Evidence Upload

```tsx
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

function ComplianceEvidenceUploader() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upload Evidence</h2>

      <FileUpload
        pathPrefix="compliance/evidence"
        bucket="uploads"
        accept=".pdf,.jpg,.png"
        label="Evidence Document"
        onUploaded={(result) => {
          setUploadedFiles((prev) => [...prev, result]);
        }}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Uploaded Files</h3>
        {uploadedFiles.map((file) => (
          <div key={file.path} className="text-sm text-gray-600">
            {file.path}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Member Retention Export

```tsx
import { exportMemberData } from "@/lib/exportClient";
import { Download } from "lucide-react";

function MemberRetentionPage() {
  const { data: members } = useMemberData();

  async function handleExport() {
    try {
      await exportMemberData(members, "xlsx");
    } catch (error) {
      console.error("Export failed:", error);
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
      >
        <Download className="w-4 h-4" />
        Export to Excel
      </button>
    </div>
  );
}
```

### Example 3: Policy Document Management

```tsx
import FileUpload from "@/components/FileUpload";
import { exportPolicyAudit } from "@/lib/exportClient";

function PolicyManagementPage() {
  const { data: policies } = usePolicyDocuments();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold mb-4">Upload Policy</h2>
        <FileUpload
          pathPrefix="policies"
          bucket="uploads"
          accept=".pdf,.docx"
          label="Policy Document"
        />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Export Policies</h2>
        <button
          onClick={() => exportPolicyAudit(policies, "xlsx")}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg"
        >
          Export Policy Audit
        </button>
      </section>
    </div>
  );
}
```

## Testing

### Playwright Tests

**Location**: `src/test/smoke.spec.ts`

**Run Tests**:
```bash
npm run test:e2e
```

**Available Tests**:
- Homepage load and navigation
- Export endpoint authentication
- Upload endpoint authentication

### Link Checking

**Script**: `scripts/link-check.mjs`

**Run Link Check**:
```bash
npm run link:check
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid Supabase session
2. **Role-Based Access**: Uploads/exports restricted to authorized roles
3. **File Size Limits**: 50MB maximum to prevent abuse
4. **Audit Logging**: All operations tracked for compliance
5. **RLS Policies**: Database-level access control on storage objects
6. **MIME Type Validation**: Server-side validation of file types

## Environment Variables

Required in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Edge Functions automatically receive:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Troubleshooting

### Upload Fails with 401
- Check user is authenticated
- Verify session token is valid
- Confirm user has required role

### Upload Fails with 403
- User lacks permission (not admin/officer)
- Check `v_current_roles` view includes user

### Export Returns Empty File
- Verify data array is not empty
- Check data contains valid properties
- Ensure format is "csv" or "xlsx"

### File Not Appearing in Storage
- Check bucket name is correct
- Verify RLS policies allow access
- Confirm file path structure

## Migration Checklist

- [ ] Deploy Edge Functions to Supabase
- [ ] Run storage infrastructure migration
- [ ] Verify storage buckets created
- [ ] Test RLS policies with different roles
- [ ] Install Playwright dependencies
- [ ] Run E2E tests
- [ ] Update documentation with production URLs
- [ ] Configure monitoring/alerts for failed uploads

## Support

For issues or questions:
1. Check Supabase function logs
2. Review audit logs for error details
3. Verify environment variables are set
4. Test with curl/Postman for API issues
5. Check browser console for client-side errors

## Next Steps

Potential enhancements:
- Bulk file upload support
- File preview/thumbnail generation
- Advanced filtering in audit logs
- Scheduled export jobs
- Integration with external storage (S3, etc.)
- File versioning and history
