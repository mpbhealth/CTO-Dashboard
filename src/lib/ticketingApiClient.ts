import type {
  TicketCache,
  TicketStats,
  TicketTrendData,
  TicketFilters,
  TicketSortOptions,
  CreateTicketRequest,
  UpdateTicketRequest,
  SyncResult,
} from '../types/tickets';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignee_id?: string;
  reporter_id: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags?: string[];
}

export interface TicketCreateData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
}

export interface TicketUpdateData {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
}

export interface TicketApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class TicketingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/tickets') {
    this.baseUrl = baseUrl;
  }

  async fetchTickets(): Promise<TicketApiResponse<Ticket[]>> {
    try {
      const mockTickets: Ticket[] = [
        {
          id: '1',
          title: 'Login Issues',
          description: 'Users unable to login to the system',
          status: 'open',
          priority: 'high',
          category: 'authentication',
          reporter_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Performance Optimization',
          description: 'Improve page load times',
          status: 'in_progress',
          priority: 'medium',
          category: 'performance',
          assignee_id: 'dev-1',
          reporter_id: 'user-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        data: mockTickets
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tickets'
      };
    }
  }

  async getLocalTickets(filters?: TicketFilters, sort?: TicketSortOptions): Promise<TicketCache[]> {
    const mockTickets: TicketCache[] = [];
    return mockTickets;
  }

  async getLocalTicketStats(): Promise<TicketStats> {
    return {
      open_tickets: 0,
      in_progress_tickets: 0,
      pending_tickets: 0,
      resolved_tickets: 0,
      closed_tickets: 0,
      avg_resolution_time_hours: 0,
      sla_compliance_percentage: 100,
      tickets_by_priority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
        critical: 0,
      },
      tickets_by_category: {},
      total_tickets: 0,
    };
  }

  async getTicketTrends(months: number = 10): Promise<TicketTrendData[]> {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trends: TicketTrendData[] = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];

      trends.push({
        month: monthName,
        open: Math.floor(Math.random() * 20) + 5,
        resolved: Math.floor(Math.random() * 25) + 10,
        total: Math.floor(Math.random() * 30) + 15,
      });
    }

    return trends;
  }

  async syncTickets(): Promise<SyncResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      synced_count: 0,
      last_sync: new Date().toISOString(),
    };
  }

  async createTicket(ticketData: CreateTicketRequest): Promise<TicketApiResponse<Ticket>> {
    try {
      const newTicket: Ticket = {
        id: Math.random().toString(36).substr(2, 9),
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority as any,
        category: ticketData.category,
        assignee_id: ticketData.assignee_id,
        due_date: ticketData.due_date,
        tags: ticketData.tags,
        status: 'open',
        reporter_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        data: newTicket
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create ticket'
      };
    }
  }

  async updateTicket(id: string, updates: UpdateTicketRequest): Promise<TicketApiResponse<Ticket>> {
    try {
      const updatedTicket: Ticket = {
        id,
        title: updates.title || 'Updated Ticket',
        description: updates.description || 'Updated description',
        status: (updates.status as any) || 'in_progress',
        priority: (updates.priority as any) || 'medium',
        category: updates.category || 'general',
        assignee_id: updates.assignee_id,
        reporter_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: updates.due_date,
        tags: updates.tags,
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        data: updatedTicket
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update ticket'
      };
    }
  }

  async deleteTicket(id: string): Promise<TicketApiResponse<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete ticket'
      };
    }
  }

  async assignTicket(id: string, assigneeId: string): Promise<TicketApiResponse<Ticket>> {
    try {
      return await this.updateTicket(id, { assignee_id: assigneeId });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign ticket'
      };
    }
  }

  async getTicketsByStatus(status: Ticket['status']): Promise<TicketApiResponse<Ticket[]>> {
    try {
      const response = await this.fetchTickets();
      if (!response.success || !response.data) {
        return response;
      }

      const filteredTickets = response.data.filter(ticket => ticket.status === status);
      return {
        success: true,
        data: filteredTickets
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tickets by status'
      };
    }
  }

  async getTicketsByPriority(priority: Ticket['priority']): Promise<TicketApiResponse<Ticket[]>> {
    try {
      const response = await this.fetchTickets();
      if (!response.success || !response.data) {
        return response;
      }

      const filteredTickets = response.data.filter(ticket => ticket.priority === priority);
      return {
        success: true,
        data: filteredTickets
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tickets by priority'
      };
    }
  }
}

export const ticketingApi = new TicketingApiClient();
export const ticketingApiClient = ticketingApi;

export const {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  getTicketsByStatus,
  getTicketsByPriority
} = ticketingApi;
