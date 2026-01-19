import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  closed_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  sla_compliance_percentage: number;
  tickets_by_priority: {
    critical: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function useTicketStats() {
  const [stats, setStats] = useState<TicketStats>({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    closed_tickets: 0,
    resolved_tickets: 0,
    avg_resolution_time_hours: 0,
    sla_compliance_percentage: 0,
    tickets_by_priority: {
      critical: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: tickets, error: ticketsError } = await supabase.from('tickets_cache').select('*');

        if (ticketsError) throw ticketsError;

        const ticketData = tickets || [];
        const total_tickets = ticketData.length;
        const open_tickets = ticketData.filter(t => t.status === 'open').length;
        const in_progress_tickets = ticketData.filter(t => t.status === 'in_progress').length;
        const closed_tickets = ticketData.filter(t => t.status === 'closed').length;
        const resolved_tickets = ticketData.filter(t => t.status === 'resolved').length;

        const closedTickets = ticketData.filter(t => t.status === 'closed' && t.created_at && t.updated_at);
        const avg_resolution_time_hours = closedTickets.length > 0
          ? closedTickets.reduce((sum, t) => {
              const created = new Date(t.created_at).getTime();
              const updated = new Date(t.updated_at).getTime();
              return sum + (updated - created) / (1000 * 60 * 60);
            }, 0) / closedTickets.length
          : 0;

        // Calculate SLA compliance (assuming 24-hour SLA for now)
        const sla_hours = 24;
        const slaCompliantTickets = closedTickets.filter(t => {
          const created = new Date(t.created_at).getTime();
          const updated = new Date(t.updated_at).getTime();
          const resolutionTimeHours = (updated - created) / (1000 * 60 * 60);
          return resolutionTimeHours <= sla_hours;
        }).length;
        const sla_compliance_percentage = closedTickets.length > 0 
          ? (slaCompliantTickets / closedTickets.length) * 100 
          : 0;

        // Calculate tickets by priority
        const tickets_by_priority = {
          critical: ticketData.filter(t => t.priority === 'critical').length,
          urgent: ticketData.filter(t => t.priority === 'urgent').length,
          high: ticketData.filter(t => t.priority === 'high').length,
          medium: ticketData.filter(t => t.priority === 'medium').length,
          low: ticketData.filter(t => t.priority === 'low').length,
        };

        setStats({ 
          total_tickets, 
          open_tickets, 
          in_progress_tickets, 
          closed_tickets,
          resolved_tickets,
          avg_resolution_time_hours,
          sla_compliance_percentage,
          tickets_by_priority
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading, error };
}

interface TicketTrend {
  date: string;
  created: number;
  closed: number;
}

export function useTicketTrends(days: number = 30) {
  const [trends, setTrends] = useState<TicketTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets_cache')
          .select('*')
          .gte('created_at', daysAgo.toISOString())
          .order('created_at', { ascending: true });

        if (ticketsError) throw ticketsError;

        const ticketsByDay: { [key: string]: { created: number; closed: number } } = {};
        (tickets || []).forEach(ticket => {
          const date = new Date(ticket.created_at).toISOString().split('T')[0];
          if (!ticketsByDay[date]) {
            ticketsByDay[date] = { created: 0, closed: 0 };
          }
          ticketsByDay[date].created++;
          if (ticket.status === 'closed') {
            ticketsByDay[date].closed++;
          }
        });

        const trendsData = Object.entries(ticketsByDay).map(([date, counts]) => ({
          date,
          ...counts,
        }));

        setTrends(trendsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [days]);

  return { trends, loading, error };
}

export function useTickets() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets_cache')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setData(tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTicket = async (ticket: Record<string, unknown>) => {
    try {
      const { error } = await supabase.from('tickets_cache').insert([ticket]);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const updateTicket = async (id: string, updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase.from('tickets_cache').update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      const { error } = await supabase.from('tickets_cache').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return { data, loading, error, refetch: fetchData, addTicket, updateTicket, deleteTicket };
}
