import { supabase } from './supabase';
import type {
  TicketCache,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketStats,
  TicketFilters,
  TicketSortOptions,
  StaffLog,
  StaffLogFilters,
  StaffLogStats,
} from '../types/tickets';

const CHAMPIONSHIP_IT_API_BASE = 'https://hhikjgrttgnvojtunmla.supabase.co/functions/v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

class TicketingApiClient {
  private apiKey: string | null = null;
  private lastFetch: number = 0;
  private cachedStats: TicketStats | null = null;

  async initialize() {
    try {
      const { data } = await supabase
        .from('ticketing_system_config')
        .select('api_key_encrypted')
        .eq('is_active', true)
        .maybeSingle();

      if (data?.api_key_encrypted) {
        this.apiKey = data.api_key_encrypted;
      }
    } catch (error) {
      console.error('Failed to initialize ticketing API client:', error);
    }
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<ApiResponse<T>> {
    if (!this.apiKey) {
      await this.initialize();
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey || ''}`,
      ...options.headers,
    };

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${CHAMPIONSHIP_IT_API_BASE}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        if (i === retries - 1) {
          return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    return { data: null, error: 'Max retries exceeded' };
  }

  async getTickets(
    filters?: TicketFilters,
    sort?: TicketSortOptions,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<TicketCache[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.priority) params.append('priority', filters.priority.join(','));
      if (filters.category) params.append('category', filters.category.join(','));
      if (filters.department) params.append('department', filters.department.join(','));
      if (filters.assignee_id) params.append('assignee_id', filters.assignee_id);
      if (filters.search) params.append('search', filters.search);
    }

    if (sort) {
      params.append('sort_by', sort.field);
      params.append('sort_direction', sort.direction);
    }

    return this.fetchWithRetry(`/tickets?${params.toString()}`);
  }

  async getTicketById(ticketId: string): Promise<ApiResponse<TicketCache>> {
    return this.fetchWithRetry(`/tickets/${ticketId}`);
  }

  async createTicket(ticket: CreateTicketRequest): Promise<ApiResponse<TicketCache>> {
    return this.fetchWithRetry('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async updateTicket(
    ticketId: string,
    updates: UpdateTicketRequest
  ): Promise<ApiResponse<TicketCache>> {
    return this.fetchWithRetry(`/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getTicketStats(): Promise<ApiResponse<TicketStats>> {
    const now = Date.now();
    if (this.cachedStats && now - this.lastFetch < CACHE_TTL_MS) {
      return { data: this.cachedStats, error: null };
    }

    const result = await this.fetchWithRetry<TicketStats>('/tickets/stats');
    if (result.data) {
      this.cachedStats = result.data;
      this.lastFetch = now;
    }
    return result;
  }

  async syncTickets(): Promise<{ success: boolean; error?: string }> {
    const syncLog = {
      sync_type: 'manual',
      status: 'in_progress' as const,
      started_at: new Date().toISOString(),
    };

    const { data: logEntry } = await supabase
      .from('ticket_sync_log')
      .insert(syncLog)
      .select()
      .single();

    try {
      const result = await this.getTickets({}, { field: 'updated_at', direction: 'desc' }, 1, 1000);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('No data received from API');
      }

      const tickets = result.data;
      let processed = 0;
      let failed = 0;

      for (const ticket of tickets) {
        const { error } = await supabase
          .from('tickets_cache')
          .upsert(
            {
              external_ticket_id: ticket.external_ticket_id,
              ticket_number: ticket.ticket_number,
              title: ticket.title,
              description: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              category: ticket.category,
              requester_id: ticket.requester_id,
              requester_name: ticket.requester_name,
              requester_email: ticket.requester_email,
              assignee_id: ticket.assignee_id,
              assignee_name: ticket.assignee_name,
              department: ticket.department,
              created_at: ticket.created_at,
              updated_at: ticket.updated_at,
              resolved_at: ticket.resolved_at,
              due_date: ticket.due_date,
              tags: ticket.tags,
              custom_fields: ticket.custom_fields,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: 'external_ticket_id' }
          );

        if (error) {
          failed++;
          console.error('Failed to sync ticket:', ticket.ticket_number, error);
        } else {
          processed++;
        }
      }

      if (logEntry) {
        await supabase
          .from('ticket_sync_log')
          .update({
            status: 'success',
            records_processed: processed,
            records_failed: failed,
            completed_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);

        await supabase
          .from('ticketing_system_config')
          .update({ last_successful_sync: new Date().toISOString() })
          .eq('is_active', true);
      }

      return { success: true };
    } catch (error) {
      if (logEntry) {
        await supabase
          .from('ticket_sync_log')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getLocalTickets(
    filters?: TicketFilters,
    sort?: TicketSortOptions
  ): Promise<TicketCache[]> {
    let query = supabase.from('tickets_cache').select('*');

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }

    if (filters?.category && filters.category.length > 0) {
      query = query.in('category', filters.category);
    }

    if (filters?.department && filters.department.length > 0) {
      query = query.in('department', filters.department);
    }

    if (filters?.assignee_id) {
      query = query.eq('assignee_id', filters.assignee_id);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`
      );
    }

    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch local tickets:', error);
      return [];
    }

    return data || [];
  }

  async getLocalTicketStats(): Promise<TicketStats> {
    const { data: tickets } = await supabase.from('tickets_cache').select('*');

    if (!tickets || tickets.length === 0) {
      return {
        total_tickets: 0,
        open_tickets: 0,
        in_progress_tickets: 0,
        resolved_tickets: 0,
        avg_resolution_time_hours: 0,
        sla_compliance_percentage: 100,
        tickets_by_priority: { low: 0, medium: 0, high: 0, urgent: 0, critical: 0 },
        tickets_by_status: {
          open: 0,
          in_progress: 0,
          pending: 0,
          on_hold: 0,
          resolved: 0,
          closed: 0,
          cancelled: 0,
        },
        tickets_by_category: {},
        tickets_by_department: {},
      };
    }

    const stats: TicketStats = {
      total_tickets: tickets.length,
      open_tickets: tickets.filter(t => t.status === 'open').length,
      in_progress_tickets: tickets.filter(t => t.status === 'in_progress').length,
      resolved_tickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      avg_resolution_time_hours: 0,
      sla_compliance_percentage: 100,
      tickets_by_priority: { low: 0, medium: 0, high: 0, urgent: 0, critical: 0 },
      tickets_by_status: {
        open: 0,
        in_progress: 0,
        pending: 0,
        on_hold: 0,
        resolved: 0,
        closed: 0,
        cancelled: 0,
      },
      tickets_by_category: {},
      tickets_by_department: {},
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let slaCompliant = 0;
    let slaTracked = 0;

    tickets.forEach(ticket => {
      if (ticket.priority in stats.tickets_by_priority) {
        stats.tickets_by_priority[ticket.priority as keyof typeof stats.tickets_by_priority]++;
      }

      if (ticket.status in stats.tickets_by_status) {
        stats.tickets_by_status[ticket.status as keyof typeof stats.tickets_by_status]++;
      }

      if (ticket.category) {
        stats.tickets_by_category[ticket.category] = (stats.tickets_by_category[ticket.category] || 0) + 1;
      }

      if (ticket.department) {
        stats.tickets_by_department[ticket.department] = (stats.tickets_by_department[ticket.department] || 0) + 1;
      }

      if (ticket.resolved_at) {
        const created = new Date(ticket.created_at).getTime();
        const resolved = new Date(ticket.resolved_at).getTime();
        totalResolutionTime += (resolved - created) / (1000 * 60 * 60);
        resolvedCount++;

        if (ticket.due_date) {
          slaTracked++;
          if (resolved <= new Date(ticket.due_date).getTime()) {
            slaCompliant++;
          }
        }
      }
    });

    stats.avg_resolution_time_hours = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
    stats.sla_compliance_percentage = slaTracked > 0 ? (slaCompliant / slaTracked) * 100 : 100;

    return stats;
  }

  async getStaffLogs(
    filters?: StaffLogFilters,
    page = 1,
    limit = 100
  ): Promise<ApiResponse<StaffLog[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.ticket_id) params.append('ticket_id', filters.ticket_id);
      if (filters.staff_id) params.append('staff_id', filters.staff_id);
      if (filters.action_type) params.append('action_type', filters.action_type.join(','));
      if (filters.created_after) params.append('created_after', filters.created_after);
      if (filters.created_before) params.append('created_before', filters.created_before);
    }

    return this.fetchWithRetry(`/tickets/staff-logs?${params.toString()}`);
  }

  async syncStaffLogs(ticketId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filters: StaffLogFilters = ticketId ? { ticket_id: ticketId } : {};
      const result = await this.getStaffLogs(filters, 1, 1000);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('No staff log data received from API');
      }

      const logs = result.data;
      let processed = 0;
      let failed = 0;

      for (const log of logs) {
        const { data: cachedTicket } = await supabase
          .from('tickets_cache')
          .select('id')
          .eq('external_ticket_id', log.external_ticket_id)
          .maybeSingle();

        const { error } = await supabase
          .from('staff_logs_cache')
          .upsert(
            {
              external_log_id: log.external_log_id,
              ticket_id: cachedTicket?.id || null,
              external_ticket_id: log.external_ticket_id,
              staff_id: log.staff_id,
              staff_name: log.staff_name,
              staff_email: log.staff_email,
              action_type: log.action_type,
              action_details: log.action_details,
              previous_value: log.previous_value,
              new_value: log.new_value,
              comment: log.comment,
              time_spent_minutes: log.time_spent_minutes,
              created_at: log.created_at,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: 'external_log_id' }
          );

        if (error) {
          failed++;
          console.error('Failed to sync staff log:', log.external_log_id, error);
        } else {
          processed++;
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getLocalStaffLogs(filters?: StaffLogFilters): Promise<StaffLog[]> {
    let query = supabase.from('staff_logs_cache').select('*');

    if (filters?.ticket_id) {
      query = query.eq('ticket_id', filters.ticket_id);
    }

    if (filters?.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }

    if (filters?.action_type && filters.action_type.length > 0) {
      query = query.in('action_type', filters.action_type);
    }

    if (filters?.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters?.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch local staff logs:', error);
      return [];
    }

    return data || [];
  }

  async getLocalStaffLogStats(ticketId?: string): Promise<StaffLogStats> {
    let query = supabase.from('staff_logs_cache').select('*');

    if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    }

    const { data: logs } = await query;

    if (!logs || logs.length === 0) {
      return {
        total_actions: 0,
        actions_by_type: {} as Record<string, number>,
        actions_by_staff: {},
        total_time_spent_minutes: 0,
        avg_response_time_minutes: 0,
      };
    }

    const stats: StaffLogStats = {
      total_actions: logs.length,
      actions_by_type: {} as Record<string, number>,
      actions_by_staff: {},
      total_time_spent_minutes: 0,
      avg_response_time_minutes: 0,
    };

    logs.forEach(log => {
      stats.actions_by_type[log.action_type] = (stats.actions_by_type[log.action_type] || 0) + 1;
      stats.actions_by_staff[log.staff_name] = (stats.actions_by_staff[log.staff_name] || 0) + 1;
      stats.total_time_spent_minutes += log.time_spent_minutes || 0;
    });

    return stats;
  }
}

export const ticketingApiClient = new TicketingApiClient();
