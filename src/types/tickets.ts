export interface TicketCache {
  id: string;
  external_ticket_id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  requester_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  due_date: string | null;
  tags: string[];
  custom_fields: Record<string, any>;
  last_synced_at: string;
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

export interface TicketProjectLink {
  id: string;
  ticket_id: string;
  project_id: string;
  link_type: string;
  created_by: string | null;
  created_at: string;
}

export interface TicketAssignmentLink {
  id: string;
  ticket_id: string;
  assignment_id: string;
  link_type: string;
  created_by: string | null;
  created_at: string;
}

export interface TicketSyncLog {
  id: string;
  sync_type: string;
  status: 'success' | 'failed' | 'in_progress';
  records_processed: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  details: Record<string, any>;
}

export interface TicketingSystemConfig {
  id: string;
  api_base_url: string;
  api_key_encrypted: string | null;
  sync_enabled: boolean;
  sync_interval_minutes: number;
  last_successful_sync: string | null;
  webhook_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketNotification {
  id: string;
  ticket_id: string | null;
  user_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  sla_compliance_percentage: number;
  tickets_by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
    critical: number;
  };
  tickets_by_status: {
    open: number;
    in_progress: number;
    pending: number;
    on_hold: number;
    resolved: number;
    closed: number;
    cancelled: number;
  };
  tickets_by_category: Record<string, number>;
  tickets_by_department: Record<string, number>;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category?: string;
  department?: string;
  requester_email?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignee_id?: string;
  department?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface TicketWithRelations extends TicketCache {
  linked_projects?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  linked_assignments?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: string[];
  department?: string[];
  assignee_id?: string;
  requester_id?: string;
  created_after?: string;
  created_before?: string;
  search?: string;
}

export interface TicketSortOptions {
  field: 'created_at' | 'updated_at' | 'priority' | 'status' | 'due_date';
  direction: 'asc' | 'desc';
}

export interface StaffLog {
  id: string;
  external_log_id: string;
  ticket_id: string | null;
  external_ticket_id: string;
  staff_id: string;
  staff_name: string;
  staff_email: string | null;
  action_type: StaffActionType;
  action_details: Record<string, any>;
  previous_value: string | null;
  new_value: string | null;
  comment: string | null;
  time_spent_minutes: number;
  created_at: string;
  last_synced_at: string;
}

export type StaffActionType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'priority_changed'
  | 'commented'
  | 'updated'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'tagged'
  | 'linked'
  | 'time_logged'
  | 'file_attached'
  | 'escalated'
  | 'transferred';

export interface StaffLogFilters {
  ticket_id?: string;
  staff_id?: string;
  action_type?: StaffActionType[];
  created_after?: string;
  created_before?: string;
}

export interface StaffLogStats {
  total_actions: number;
  actions_by_type: Record<StaffActionType, number>;
  actions_by_staff: Record<string, number>;
  total_time_spent_minutes: number;
  avg_response_time_minutes: number;
}
