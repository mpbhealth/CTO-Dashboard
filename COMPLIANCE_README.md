# HIPAA Compliance Command Center

## 🎯 Overview

The **Compliance Command Center** is a comprehensive HIPAA compliance management system integrated into the MPB Health CTO Dashboard. It provides end-to-end management of HIPAA Privacy and Security Rule compliance, including policy management, incident tracking, training administration, risk assessment, and audit trails.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management**: TanStack Query (React Query)
- **File Processing**: xlsx (for CSV/Excel imports and exports)
- **Authentication**: Supabase Auth with JWT
- **Access Control**: Row Level Security (RLS) with role-based permissions

## 📋 Features

### 1. Command Center Dashboard
- **KPI Cards**: Real-time metrics for policies, BAAs, incidents, and training
- **My Queue**: Personal task list with due dates and priorities
- **Recent Activity**: Audit log stream showing system activity
- **Quick Actions**: One-click access to common operations
- **Section Navigation**: Direct links to all compliance modules

### 2. Administration & Governance
- Policy document management with markdown editing
- Version control and approval workflows
- Designation letters and organizational documentation
- Policy review scheduling and tracking

### 3. Training & Awareness
- Training program management (onboarding, annual, quarterly)
- Attendance tracking and CSV import
- Certificate generation
- Completion rate monitoring

### 4. PHI Access & Minimum Necessary
- PHI access logging with purpose categories (TPO)
- Searchable audit ledger
- Export capabilities for compliance audits
- Real-time access tracking

### 5. Technical Safeguards
- Control matrix for security measures
- Encryption policy management
- Access control documentation
- Technical control status tracking

### 6. Business Associate Agreements
- BAA registry with renewal tracking
- Expiration alerts (60-day window)
- Vendor contact management
- Automated renewal reminders via n8n webhooks

### 7. Incidents & Breach Management
- Incident intake and tracking
- Severity classification (low, medium, high, critical)
- Breach determination workflow
- HHS reporting compliance tracking
- Root cause analysis (RCA) documentation
- Breach notification management

### 8. Audits & Monitoring
- Internal and external audit tracking
- Vulnerability assessment logs
- Penetration test results
- Corrective Action Plan (CAP) management
- Audit finding documentation

### 9. Templates & Tools
- Built-in compliance templates
- Evidence repository
- Document cloning functionality
- Template library management

## 🗄️ Database Schema

### Core Tables
```
profiles                  - Extended user profiles
roles                     - System roles (admin, hipaa_officer, etc.)
user_roles               - User-role mappings (many-to-many)
hipaa_evidence           - File attachment repository
hipaa_docs               - Editable compliance documents
hipaa_doc_versions       - Document version history
hipaa_policies           - Policy registry
hipaa_risks              - Risk register
hipaa_mitigations        - Risk mitigation actions
hipaa_trainings          - Training programs
hipaa_training_attendance - Training completion records
hipaa_phi_access         - PHI access logs
hipaa_baas               - Business Associate Agreements
hipaa_incidents          - Security incidents
hipaa_breach_notifications - Breach notification tracking
hipaa_audits             - Audit records
hipaa_tasks              - Task management
hipaa_audit_log          - System activity audit trail
hipaa_contacts           - Compliance team contacts
compliance_settings      - System configuration
```

### Access Control Roles

| Role | Permissions |
|------|-------------|
| **admin** | Full system access |
| **hipaa_officer** | Full compliance management access |
| **privacy_officer** | Privacy-focused management |
| **security_officer** | Security-focused management |
| **legal** | Read access + document approval |
| **auditor** | Read-only access to all records |
| **staff** | Limited access (training, self-tasks) |

## 🚀 Setup Instructions

### 1. Run Database Migrations

```bash
# Run migrations in order
supabase migration up
```

The following migrations will be applied:
- `20250109000001_hipaa_roles_profiles.sql` - Roles and user management
- `20250109000002_hipaa_core_tables.sql` - Core compliance tables
- `20250109000003_hipaa_rls_policies.sql` - Row Level Security
- `20250109000004_hipaa_settings_storage.sql` - Settings and storage

### 2. Create Storage Buckets

In Supabase Dashboard, create the following buckets:

1. **hipaa-evidence** - For evidence files
2. **hipaa-templates** - For document templates
3. **hipaa-exports** - For generated reports

Apply storage RLS policies as documented in migration 004.

### 3. Seed Initial Data

```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/seed-compliance.sql
```

This creates:
- 5 compliance contacts
- 4 training programs
- 3 policy documents
- 3 BAAs
- 3 risks with mitigations
- 4 tasks
- 2 audit records

### 4. Deploy Edge Functions

```bash
# Deploy all compliance edge functions
supabase functions deploy compliance-audit-log
supabase functions deploy compliance-evidence-upload
supabase functions deploy compliance-training-certificate
supabase functions deploy compliance-baa-reminders
supabase functions deploy compliance-breach-risk-score
```

### 5. Assign User Roles

```sql
-- Example: Assign roles to a user
INSERT INTO user_roles (user_id, role_id)
SELECT 
  'USER_UUID_HERE',
  id
FROM roles
WHERE name IN ('admin', 'hipaa_officer');
```

## 📱 UI Components

### Reusable Components

**Chips & Badges**
- `PolicyStatusChip` - Document status indicators
- `SeverityChip` - Incident severity levels
- `TaskStatusChip` - Task status
- `PriorityChip` - Priority levels
- `BAAStatusChip` - BAA status
- `RoleBadge` - User role indicators

**Interactive Components**
- `MarkdownEditor` - Rich text editor with preview
- `EvidenceUploader` - File upload with drag-and-drop
- `TasksPanel` - Task management interface
- `ImporterModal` - CSV/XLSX data import

### Page Components

- `ComplianceCommandCenter` - Main dashboard
- `ComplianceIncidents` - Incident management
- `ComplianceBAAs` - BAA tracking
- `CompliancePHIAccess` - PHI access logging

## 🔌 API / Edge Functions

### 1. Audit Log (`compliance-audit-log`)
```typescript
POST /functions/v1/compliance-audit-log
{
  "action": "doc_created",
  "object_table": "hipaa_docs",
  "object_id": "uuid",
  "details": { "title": "Policy Name" }
}
```

### 2. Evidence Upload (`compliance-evidence-upload`)
```typescript
POST /functions/v1/compliance-evidence-upload
{
  "filename": "evidence.pdf",
  "category": "policies"
}
// Returns signed upload URL
```

### 3. Training Certificate (`compliance-training-certificate`)
```typescript
POST /functions/v1/compliance-training-certificate
{
  "attendance_id": "uuid",
  "user_name": "John Doe",
  "training_name": "HIPAA Fundamentals",
  "completion_date": "2025-01-09"
}
// Generates and stores certificate
```

### 4. BAA Reminders (`compliance-baa-reminders`)
```typescript
POST /functions/v1/compliance-baa-reminders
{}
// Checks for BAAs expiring within 60 days
// Sends webhooks for each
```

### 5. Breach Risk Score (`compliance-breach-risk-score`)
```typescript
POST /functions/v1/compliance-breach-risk-score
{
  "affected_individuals": 150,
  "phi_types": ["name", "ssn", "diagnosis"],
  "exposure_duration_days": 7,
  "data_encrypted": false,
  "external_exposure": true,
  "malicious_intent": false
}
// Returns risk score and recommendations
```

## 📊 Data Import/Export

### Import Formats Supported

**Training Attendance** (`ImporterModal`)
```csv
user_email,user_name,completed_at,score
john@example.com,John Doe,2025-01-09,95
jane@example.com,Jane Smith,2025-01-08,100
```

**Risk Register**
```csv
title,description,likelihood,impact,category,status
Risk Title,Description,3,4,Category,open
```

**Contacts Roster**
```csv
name,role,email,phone,department
John Doe,Officer,john@example.com,555-0100,Compliance
```

### Export Functions

```typescript
import {
  exportIncidents,
  exportBAAs,
  exportPHIAccessLogs,
  exportRisks,
  exportTasks,
  exportComplianceReport
} from './utils/complianceExports';

// Export incidents to Excel
exportIncidents(incidents, 'xlsx');

// Export comprehensive report
exportComplianceReport({
  incidents,
  baas,
  phiAccess,
  risks,
  tasks,
  docs,
  audits
});
```

## 🔒 Security Considerations

1. **Row Level Security (RLS)**: All tables enforce role-based access
2. **Audit Logging**: All actions automatically logged
3. **Data Encryption**: PHI encrypted at rest and in transit
4. **Storage Access**: Signed URLs for secure file access
5. **Authentication**: JWT-based with automatic expiration
6. **CORS**: Properly configured for API endpoints

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create new incident report
- [ ] Log PHI access
- [ ] Upload evidence file
- [ ] Create and approve policy document
- [ ] Add BAA and verify expiration alert
- [ ] Import training attendance CSV
- [ ] Export compliance report
- [ ] Verify RLS (test different user roles)
- [ ] Test breach risk calculator
- [ ] Verify audit log entries

## 📈 Future Enhancements

1. **PDF Generation**: Replace HTML certificates with proper PDFs
2. **Email Notifications**: Built-in email for incident alerts
3. **Dashboard Widgets**: Customizable KPI widgets
4. **Mobile App**: React Native companion app
5. **AI-Powered Insights**: Risk prediction and policy recommendations
6. **Integration APIs**: Connect with EHR systems
7. **Automated Reporting**: Scheduled compliance reports
8. **Document Versioning UI**: Visual diff viewer for document changes

## 🆘 Support & Troubleshooting

### Common Issues

**RLS Permission Denied**
- Verify user has been assigned appropriate role in `user_roles`
- Check RLS policies are enabled on all tables

**Storage Upload Fails**
- Verify storage buckets exist with correct names
- Check storage RLS policies are applied
- Confirm file size within limits

**Import Modal Not Working**
- Verify `xlsx` package is installed
- Check CSV format matches expected columns
- Ensure proper column mappings

**Edge Functions Not Responding**
- Check function deployment status
- Verify environment variables are set
- Review function logs in Supabase dashboard

## 📝 License & Compliance

This system is designed to help MPB Health maintain HIPAA compliance. It is not a substitute for legal counsel or professional compliance advice. Always consult with qualified professionals for compliance matters.

## 👨‍💻 Development Team

**Built by**: AI Assistant for Vinnie R. Tannous  
**Organization**: MPB Health  
**Date**: January 2025  
**Version**: 1.0.0

## 🔗 Related Documentation

- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)
- [Supabase Documentation](https://supabase.com/docs)

---

**For additional help or feature requests, contact the CTO Dashboard development team.**

