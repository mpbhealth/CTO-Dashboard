import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  avgResolutionTime: number;
}

export function useTicketStats() {
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    avgResolutionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: tickets, error: ticketsError } = await supabase.from('tickets').select('*');

        if (ticketsError) throw ticketsError;

        const ticketData = tickets || [];
        const total = ticketData.length;
        const open = ticketData.filter(t => t.status === 'open').length;
        const inProgress = ticketData.filter(t => t.status === 'in_progress').length;
        const closed = ticketData.filter(t => t.status === 'closed').length;

        const closedTickets = ticketData.filter(t => t.status === 'closed' && t.created_at && t.updated_at);
        const avgResolutionTime = closedTickets.length > 0
          ? closedTickets.reduce((sum, t) => {
              const created = new Date(t.created_at).getTime();
              const updated = new Date(t.updated_at).getTime();
              return sum + (updated - created) / (1000 * 60 * 60);
            }, 0) / closedTickets.length
          : 0;

        setStats({ total, open, inProgress, closed, avgResolutionTime });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useTicketTrends(days: number = 30) {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [days]);

  return { trends, loading, error };
}

export function useTickets() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setData(tickets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTicket = async (ticket: any) => {
    try {
      const { error } = await supabase.from('tickets').insert([ticket]);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateTicket = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('tickets').update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { data, loading, error, refetch: fetchData, addTicket, updateTicket, deleteTicket };
}
