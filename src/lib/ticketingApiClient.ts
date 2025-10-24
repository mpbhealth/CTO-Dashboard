// Ticketing API Client for handling support tickets and service requests

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
      // Mock implementation - replace with actual API call
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

      // Simulate API delay
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

  async createTicket(ticketData: TicketCreateData): Promise<TicketApiResponse<Ticket>> {
    try {
      // Mock implementation - replace with actual API call
      const newTicket: Ticket = {
        id: Math.random().toString(36).substr(2, 9),
        ...ticketData,
        status: 'open',
        reporter_id: 'current-user', // Would get from auth context
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simulate API delay
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

  async updateTicket(id: string, updates: TicketUpdateData): Promise<TicketApiResponse<Ticket>> {
    try {
      // Mock implementation - replace with actual API call
      const updatedTicket: Ticket = {
        id,
        title: 'Updated Ticket',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'medium',
        category: 'general',
        reporter_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates
      };

      // Simulate API delay
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
      // Mock implementation - replace with actual API call
      // Simulate API delay
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

// Export a singleton instance
export const ticketingApi = new TicketingApiClient();
export const ticketingApiClient = ticketingApi;

// Named exports for convenience
export const {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  getTicketsByStatus,
  getTicketsByPriority
} = ticketingApi;