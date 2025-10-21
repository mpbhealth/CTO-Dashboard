# IT Support Ticketing System Integration

## Overview

This document describes the integration between the **MPB Health CTO Dashboard** and the **Championship IT Ticketing System**. Both projects are built with Bolt and use separate Supabase instances, connected through a cross-database API integration pattern.

## Architecture

### Projects Configuration

- **CTO Dashboard Supabase**: `https://xnijhggwgbxrtvlktviz.supabase.co`
- **Championship IT Supabase**: `https://hhikjgrttgnvojtunmla.supabase.co`

### Integration Pattern

The integration uses an **API Gateway Pattern** where:
1. Championship IT exposes ticket data via Supabase Edge Functions
2. CTO Dashboard consumes these APIs with a TypeScript client
3. Ticket data is cached locally in the CTO Dashboard for performance
4. Scheduled synchronization keeps data fresh
5. Real-time updates flow through webhooks

## Database Schema

### New Tables in CTO Dashboard

#### `tickets_cache`
Stores synchronized ticket data from Championship IT system.

**Columns:**
- `id` - UUID primary key
- `external_ticket_id` - Unique ticket ID from Championship IT
- `ticket_number` - Human-readable ticket number
- `title` - Ticket title/subject
- `description` - Detailed description
- `status` - Current status (open, in_progress, pending, resolved, closed)
- `priority` - Priority level (low, medium, high, urgent, critical)
- `category` - Ticket category
- `requester_id`, `requester_name`, `requester_email` - Requester information
- `assignee_id`, `assignee_name` - Assigned agent
- `department` - Assigned department
- `created_at`, `updated_at`, `resolved_at` - Timestamps
- `due_date` - SLA due date
- `tags` - Array of tags
- `custom_fields` - JSONB for additional data
- `last_synced_at` - Last synchronization timestamp

#### `ticket_project_links`
Junction table linking tickets to projects.

**Columns:**
- `id` - UUID primary key
- `ticket_id` - Foreign key to tickets_cache
- `project_id` - Foreign key to projects
- `link_type` - Type of relationship (related, blocking, depends_on)
- `created_by` - User who created the link
- `created_at` - Creation timestamp

#### `ticket_assignment_links`
Junction table linking tickets to assignments/tasks.

**Columns:**
- `id` - UUID primary key
- `ticket_id` - Foreign key to tickets_cache
- `assignment_id` - Foreign key to assignments
- `link_type` - Type of relationship
- `created_by` - User who created the link
- `created_at` - Creation timestamp

#### `ticket_sync_log`
Tracks synchronization operations.

**Columns:**
- `id` - UUID primary key
- `sync_type` - Type of sync (manual, scheduled, webhook)
- `status` - Status (success, failed, in_progress)
- `records_processed`, `records_failed` - Counts
- `started_at`, `completed_at` - Timestamps
- `error_message` - Error details if failed
- `details` - JSONB for metadata

#### `ticketing_system_config`
Configuration for Championship IT integration.

**Columns:**
- `id` - UUID primary key
- `api_base_url` - Championship IT API base URL
- `api_key_encrypted` - Encrypted API key
- `sync_enabled` - Whether auto-sync is enabled
- `sync_interval_minutes` - Sync frequency (default: 5)
- `last_successful_sync` - Last successful sync timestamp
- `webhook_secret` - Secret for webhook validation
- `is_active` - Whether integration is active
- `created_at`, `updated_at` - Timestamps

#### `ticket_notifications`
Notification queue for ticket events.

**Columns:**
- `id` - UUID primary key
- `ticket_id` - Foreign key to tickets_cache
- `user_id` - Recipient user ID
- `notification_type` - Type (assignment, status_change, comment, sla_breach)
- `title`, `message` - Notification content
- `is_read` - Whether notification was read
- `read_at` - When notification was read
- `created_at` - Creation timestamp

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Authenticated users can view all tickets
- Authenticated users can create/update tickets
- Configuration access restricted to admins
- Users can only view their own notifications

## TypeScript Types

### Core Types (`src/types/tickets.ts`)

```typescript
export interface TicketCache {
  id: string;
  external_ticket_id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  // ... other fields
}

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'on_hold'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type TicketPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'
  | 'critical';

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  sla_compliance_percentage: number;
  tickets_by_priority: { ... };
  tickets_by_status: { ... };
  tickets_by_category: Record<string, number>;
  tickets_by_department: Record<string, number>;
}
```

## API Client Layer

### `ticketingApiClient` (`src/lib/ticketingApiClient.ts`)

The API client provides methods to interact with Championship IT:

**Methods:**
- `initialize()` - Load configuration and API key
- `getTickets(filters?, sort?, page, limit)` - Fetch tickets from API
- `getTicketById(ticketId)` - Get single ticket details
- `createTicket(ticket)` - Create new ticket
- `updateTicket(ticketId, updates)` - Update existing ticket
- `getTicketStats()` - Get ticket statistics (cached for 5 minutes)
- `syncTickets()` - Manually sync all tickets to local cache
- `getLocalTickets(filters?, sort?)` - Query local cached tickets
- `getLocalTicketStats()` - Calculate stats from local cache

**Features:**
- Automatic retry with exponential backoff (3 attempts)
- Response caching for performance
- Local fallback when API unavailable
- Comprehensive error handling
- Sync logging to database

## React Hooks

### `useTickets` (`src/hooks/useTickets.ts`)

Manages ticket data with automatic synchronization.

```typescript
const {
  tickets,       // Array of tickets
  loading,       // Loading state
  error,         // Error message if any
  syncing,       // Sync in progress
  refresh,       // Manually refresh
  syncTickets,   // Trigger sync
} = useTickets(filters?, sort?, autoSync?);
```

**Parameters:**
- `filters` - Optional TicketFilters object
- `sort` - Optional TicketSortOptions
- `autoSync` - Enable auto-sync every 5 minutes (default: true)

### `useTicketStats`

Fetches and refreshes ticket statistics.

```typescript
const {
  stats,    // TicketStats object
  loading,  // Loading state
  error,    // Error message
  refresh,  // Manually refresh
} = useTicketStats();
```

Auto-refreshes every 2 minutes.

### `useTicketActions`

Provides methods for creating and updating tickets.

```typescript
const {
  createTicket,  // (ticket) => Promise<TicketCache>
  updateTicket,  // (id, updates) => Promise<TicketCache>
  loading,       // Loading state
  error,         // Error message
} = useTicketActions();
```

### `useTicketProjectLinks` & `useTicketAssignmentLinks` (`src/hooks/useTicketLinks.ts`)

Manage relationships between tickets and projects/assignments.

```typescript
const {
  links,       // Array of links
  loading,     // Loading state
  error,       // Error message
  fetchLinks,  // Load links
  createLink,  // Create new link
  deleteLink,  // Remove link
} = useTicketProjectLinks(ticketId?, projectId?);
```

## UI Components

### IT Support Page (`src/components/pages/ITSupport.tsx`)

Main ticket management interface with:
- Ticket list with sorting and filtering
- Status and priority filters
- Search by ticket number, title, or description
- Real-time sync with Championship IT
- KPI cards showing key metrics
- Color-coded status and priority badges
- Responsive design for mobile devices

**Features:**
- Filter by status (open, in_progress, pending, resolved, closed)
- Filter by priority (low, medium, high, urgent, critical)
- Search across multiple fields
- Manual sync button
- Create ticket button (ready for modal implementation)
- Ticket detail view (click to open)

### Overview Dashboard Integration

The main Overview page (`src/components/pages/Overview.tsx`) now includes an IT Support Tickets section with 4 KPI cards:

1. **Open Tickets** - Count of open tickets with in-progress count
2. **Avg Resolution** - Average resolution time in hours
3. **SLA Compliance** - Percentage of tickets resolved within SLA
4. **Critical Tickets** - Count of critical and urgent priority tickets

### Sidebar Navigation

Added "IT Support Tickets" menu item under Operations & Management category.

## Features Implemented

### Core Features
- ✅ Database schema with RLS policies
- ✅ TypeScript type definitions
- ✅ API client with retry logic and caching
- ✅ Local ticket caching for offline capability
- ✅ Synchronization with error logging
- ✅ Ticket list page with filtering and search
- ✅ Ticket statistics calculation
- ✅ KPI widgets on overview dashboard
- ✅ Project and assignment linking infrastructure
- ✅ Navigation integration

### Filtering & Search
- ✅ Filter by status
- ✅ Filter by priority
- ✅ Search by ticket number, title, description
- ✅ Sort by created_at, updated_at, priority, status, due_date
- ✅ Multi-select filters

### Data Synchronization
- ✅ Manual sync trigger
- ✅ Automatic sync every 5 minutes (configurable)
- ✅ Sync logging and error tracking
- ✅ Last sync timestamp display
- ✅ Incremental updates based on last_synced_at

## Configuration Setup

### Initial Configuration

To set up the integration, insert a configuration record:

```sql
INSERT INTO ticketing_system_config (
  api_base_url,
  api_key_encrypted,
  sync_enabled,
  sync_interval_minutes,
  is_active
) VALUES (
  'https://hhikjgrttgnvojtunmla.supabase.co/functions/v1',
  'your-encrypted-api-key-here',
  true,
  5,
  true
);
```

### Championship IT API Requirements

The Championship IT system needs to expose these Supabase Edge Functions:

1. **GET `/tickets`** - List tickets with query parameters:
   - `page`, `limit` - Pagination
   - `status`, `priority`, `category`, `department` - Filters
   - `assignee_id`, `search` - Additional filters
   - `sort_by`, `sort_direction` - Sorting

2. **GET `/tickets/:id`** - Get single ticket details

3. **POST `/tickets`** - Create new ticket

4. **PATCH `/tickets/:id`** - Update ticket

5. **GET `/tickets/stats`** - Get ticket statistics

6. **POST `/webhook/ticket-update`** - Webhook for real-time updates

### Authentication

Service-to-service authentication uses:
- Bearer token in Authorization header
- API key stored encrypted in `ticketing_system_config`
- Request signing for enhanced security (optional)

## Usage Examples

### Basic Ticket List

```typescript
import { useTickets } from '../../hooks/useTickets';

function MyComponent() {
  const { tickets, loading, syncTickets } = useTickets();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={syncTickets}>Sync</button>
      {tickets.map(ticket => (
        <div key={ticket.id}>{ticket.title}</div>
      ))}
    </div>
  );
}
```

### Filtered Tickets

```typescript
const filters = {
  status: ['open', 'in_progress'],
  priority: ['high', 'critical'],
  department: ['Engineering'],
};

const sort = {
  field: 'created_at',
  direction: 'desc',
};

const { tickets } = useTickets(filters, sort);
```

### Create Ticket

```typescript
import { useTicketActions } from '../../hooks/useTickets';

function CreateTicketForm() {
  const { createTicket, loading } = useTicketActions();

  const handleSubmit = async (data) => {
    try {
      const ticket = await createTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
      });
      console.log('Created:', ticket);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  // ... rest of component
}
```

### Link Ticket to Project

```typescript
import { useTicketProjectLinks } from '../../hooks/useTicketLinks';

function ProjectTickets({ projectId }) {
  const { links, createLink, deleteLink } = useTicketProjectLinks(undefined, projectId);

  const handleLink = async (ticketId) => {
    await createLink(ticketId, projectId, 'blocking');
  };

  // ... rest of component
}
```

## Future Enhancements

### Planned Features
- Real-time notifications via webhooks
- Advanced analytics dashboard
- Ticket detail modal with full history
- Comment system
- File attachments
- Email integration
- SLA rule configuration
- Automated escalation workflows
- Custom ticket templates
- Bulk operations
- Export to CSV/PDF
- Mobile app
- AI-powered categorization
- Predictive SLA alerts

### Integration Opportunities
- Link tickets to API incidents automatically
- Create tickets from deployment failures
- Associate tickets with compliance incidents
- Integrate with Monday.com for project management
- Connect to Slack for notifications
- Sync with calendar for SLA tracking

## Security Considerations

### Data Protection
- API keys encrypted at rest
- RLS policies enforce access control
- Webhook signatures validate incoming requests
- Sensitive data masked in logs
- HIPAA compliance for PHI-related tickets

### Authentication & Authorization
- Service role keys for API communication
- User-level permissions for ticket access
- Admin-only configuration management
- Audit logging for all operations

### Network Security
- HTTPS only for all API calls
- IP allowlisting (optional)
- Rate limiting on API endpoints
- Request timeout configuration

## Troubleshooting

### Tickets Not Syncing

1. Check configuration is active:
```sql
SELECT * FROM ticketing_system_config WHERE is_active = true;
```

2. Check sync logs for errors:
```sql
SELECT * FROM ticket_sync_log ORDER BY started_at DESC LIMIT 10;
```

3. Verify API connectivity:
```typescript
await ticketingApiClient.getTickets();
```

### Missing API Key

Initialize the configuration with a valid API key from Championship IT system.

### Stale Data

Force a manual sync:
```typescript
const { syncTickets } = useTickets();
await syncTickets();
```

### Performance Issues

- Check sync interval (default 5 min may be too frequent)
- Review local cache size in tickets_cache table
- Consider implementing pagination for large datasets
- Enable response caching with longer TTL

## Maintenance

### Database Maintenance

Clean up old sync logs:
```sql
DELETE FROM ticket_sync_log
WHERE started_at < NOW() - INTERVAL '30 days';
```

Refresh stale cached tickets:
```sql
UPDATE tickets_cache
SET last_synced_at = NULL
WHERE last_synced_at < NOW() - INTERVAL '1 day';
```

### Monitoring

Key metrics to monitor:
- Sync success rate
- Average sync duration
- API response times
- Error rates
- Cache hit rates
- Ticket volume trends

### Backup

Ensure regular backups of:
- `tickets_cache` table
- `ticket_project_links` and `ticket_assignment_links`
- `ticketing_system_config`
- `ticket_sync_log` (for audit trail)

## Support

For questions or issues with the integration:
1. Check sync logs in `ticket_sync_log`
2. Review API client error messages
3. Verify Championship IT API is accessible
4. Check Supabase RLS policies
5. Consult this documentation

## Changelog

### v1.0.0 (Initial Release)
- Database schema with 6 new tables
- API client with retry logic
- React hooks for tickets, stats, and links
- IT Support page with filtering and search
- Overview dashboard integration
- Sidebar navigation entry
- TypeScript types and interfaces
- RLS policies for all tables
- Sync logging and error tracking
