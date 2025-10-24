export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'on_hold' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type StaffActionType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'priority_changed'
  | 'commented'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'transferred';

export interface TicketCache {
  id: string;
  external_ticket_id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  assignee_id?: string;
  assignee_name?: string;
  reporter_id: string;
  reporter_name: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  due_date?: string;
  tags?: string[];
  source_system: string;
  last_synced_at: string;
}

export interface TicketStats {
  open_tickets: number;
  in_progress_tickets: number;
  pending_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  avg_resolution_time_hours: number;
  sla_compliance_percentage: number;
  tickets_by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
    critical: number;
  };
  tickets_by_category: Record<string, number>;
  total_tickets: number;
}

export interface TicketTrendData {
  month: string;
  open: number;
  resolved: number;
  total: number;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: string;
  assignee_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface TicketSortOptions {
  field: 'created_at' | 'updated_at' | 'priority' | 'status' | 'due_date';
  direction: 'asc' | 'desc';
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
}

export interface StaffLog {
  id: string;
  ticket_id: string;
  staff_id: string;
  staff_name: string;
  action_type: StaffActionType;
  action_details: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  synced_count?: number;
  error?: string;
  last_sync?: string;
}
