# Dual Executive Dashboard System

## Overview

This system provides isolated, secure workspaces for CTO and CEO with controlled cross-sharing capabilities. Built on Supabase with Row-Level Security (RLS) enforcement and comprehensive audit logging.

## Architecture

### Routes

- **CTO Dashboard**: `/ctod/*`
  - `/ctod/home` - Overview with KPIs and recent activity
  - `/ctod/files` - File management
  - `/ctod/kpis` - Infrastructure and engineering metrics
  - `/ctod/engineering` - Development metrics
  - `/ctod/compliance` - Security and compliance status

- **CEO Dashboard**: `/ceod/*`
  - `/ceod/home` - Executive summary with priorities
  - `/ceod/marketing` - Full marketing suite (campaigns, calendar, budget, assets)
  - `/ceod/files` - Document management
  - `/ceod/board` - Board packet builder
  - `/ceod/initiatives` - Strategic initiatives tracker
  - `/ceod/approvals` - Approval workflows

- **Shared Views**: `/shared/*`
  - `/shared/overview` - Organization-wide and cross-shared resources
  - `/shared/audit` - Comprehensive audit log viewer

### Database Schema

#### Core Tables

1. **orgs** - Organization master table
2. **profiles** - User profiles with role assignment (cto, ceo, admin, staff)
3. **workspaces** - Isolated spaces (CTO, CEO, SHARED per org)
4. **resources** - Unified content table (files, docs, KPIs, campaigns, notes, tasks, dashboards)
5. **resource_acl** - Fine-grained access control list
6. **files** - Storage metadata paired with resources
7. **audit_logs** - Comprehensive activity tracking

#### Visibility Model

- **private** - Only creator and admins can access
- **shared_to_cto** - CTO and admins can view
- **shared_to_ceo** - CEO and admins can view
- **org_public** - All organization members can view

### Storage Buckets

- **ctod** - CTO workspace files
- **ceod** - CEO workspace files
- **shared** - Organization-wide files

All buckets use RLS policies that enforce resource-level visibility rules.

## Key Features

### 1. Share Modal
Located at: `src/components/modals/ShareModal.tsx`

Features:
- Radio button visibility selection (Private, Share with CTO, Share with CEO, Organization)
- Explicit ACL management (grant/revoke specific users read/write access)
- Real-time visibility badge updates
- Audit logging of all share actions

### 2. Visibility Badges
Located at: `src/components/ui/VisibilityBadge.tsx`

Visual indicators on all resources:
- Gray lock icon: Private
- Blue share icon: Shared with CTO
- Purple share icon: Shared with CEO
- Green globe icon: Organization-wide

### 3. CEO Marketing Suite
Located at: `src/components/pages/ceod/CEOMarketingDashboard.tsx`

Tabs:
- **Overview** - Funnel metrics (traffic, CTR, CPL, CAC, MQL→SQL, conversion)
- **Campaigns** - Campaign planner with budgets, timelines, and leads
- **Calendar** - Content calendar for posts, emails, landing pages
- **Budget** - Budget vs actuals by channel with ROI tracking
- **Assets** - Brand asset library with versioning

### 4. Audit Log Viewer
Located at: `src/components/pages/shared/AuditLogViewer.tsx`

Features:
- Filterable by action type
- Configurable entry limit
- CSV export for compliance reporting
- Detailed view of action metadata

## Usage

### Creating Resources

```typescript
import { createResource } from './lib/dualDashboard';

const resource = await createResource({
  workspaceId: workspace.id,
  type: 'file',
  title: 'Q4 Report',
  meta: { department: 'Finance' },
  visibility: 'private'
});
```

### Updating Visibility

```typescript
import { updateResourceVisibility } from './lib/dualDashboard';

await updateResourceVisibility(resourceId, 'shared_to_ceo');
```

### Granting Explicit Access

```typescript
import { grantResourceAccess } from './lib/dualDashboard';

await grantResourceAccess(
  resourceId,
  granteeProfileId,
  true,  // canRead
  false  // canWrite
);
```

### Uploading Files

```typescript
import { uploadFile } from './lib/dualDashboard';

const result = await uploadFile(
  file,
  'CTO',  // workspaceKind
  resourceId  // optional, creates new if omitted
);
```

## React Hooks

Located at: `src/hooks/useDualDashboard.ts`

- `useCurrentProfile()` - Get current user profile
- `useWorkspace(orgId, kind, name)` - Get or create workspace
- `useResources(filters)` - List resources with filters
- `useResourceACL(resourceId)` - Get ACL for resource
- `useAuditLogs(filters)` - Fetch audit logs
- `useCreateResource()` - Mutation for creating resources
- `useUpdateVisibility()` - Mutation for changing visibility
- `useGrantAccess()` - Mutation for granting access
- `useRevokeAccess()` - Mutation for revoking access
- `useUploadFile()` - Mutation for file uploads
- `useRoleBasedRedirect()` - Auto-redirect based on user role

## Security

### Row-Level Security (RLS)

All tables enforce RLS policies:

- **Profiles**: Users see self; admins see org members
- **Workspaces**: Same org only
- **Resources**: Complex visibility logic based on role and sharing
- **Files**: Follow resource visibility rules
- **Audit Logs**: Role-scoped (admin, cto, ceo)

### Audit Trail

Every action is logged:
- `create` - Resource creation
- `update_visibility` - Visibility changes
- `grant_access` - ACL grants
- `revoke_access` - ACL revocations
- `upload` - File uploads
- `download` - File downloads

Logs include:
- Actor profile ID
- Resource ID
- Action timestamp
- Detailed metadata (JSON)

## Role-Based Access

### CTO Role
- Full access to CTO workspace
- Can share resources to CEO
- View shared resources from CEO (if explicitly granted)
- View org-public resources
- Access audit logs

### CEO Role
- Full access to CEO workspace
- Can share resources to CTO
- View shared resources from CTO (if explicitly granted)
- View org-public resources
- Access audit logs

### Admin Role
- Full access to both workspaces
- Can modify all resources
- Full audit log access

## Development

### Adding New Resource Types

1. Update `ResourceType` in `src/lib/dualDashboard.ts`:
```typescript
export type ResourceType = 'file' | 'doc' | 'kpi' | 'campaign' | 'note' | 'task' | 'dashboard' | 'YOUR_NEW_TYPE';
```

2. Add type-specific metadata to `meta` JSONB field
3. Optionally create dedicated UI components

### Extending the Marketing Suite

Add new tabs to `CEOMarketingDashboard.tsx`:
```typescript
const tabs = [
  // ... existing tabs
  { id: 'newtab', label: 'New Tab', icon: YourIcon },
];
```

### Adding Shared Views

Create new components in `src/components/pages/shared/` and add routes to `DualDashboardApp.tsx`.

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

## Testing

Access the dashboards:
1. Navigate to `/ctod/home` for CTO view
2. Navigate to `/ceod/home` for CEO view
3. Navigate to `/shared/overview` for shared resources

Test share functionality:
1. Create a resource
2. Click "Share" button
3. Change visibility level
4. Grant explicit access to specific users
5. Verify badges update in real-time
6. Check audit log at `/shared/audit`

## Deployment

Build command:
```bash
npm run build
```

The system is designed for Netlify/Vercel deployment with proper rewrites for SPA routing.

## Support

For issues or questions, contact:
- Vinnie Champion (CTO) - vinnie@mpbhealth.com
