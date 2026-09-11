import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { shouldQueryCosTable } from '../lib/schema/cosPublicTables';

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
      if (!shouldQueryCosTable('fact_tickets_daily')) {
        setLoading(false);
        return;
      }
      try {
        const { data: tickets, error: ticketsError } = await supabase
          .from('fact_tickets_daily')
          .select('created_count, open_count, resolved_count, sla_pct')
          .order('fact_date', { ascending: false })
          .limit(30);

        if (ticketsError) throw ticketsError;

        const ticketData = tickets || [];
        const latest = ticketData[0];
        const created = ticketData.reduce((sum, row) => sum + Number(row.created_count || 0), 0);
        const resolved = ticketData.reduce((sum, row) => sum + Number(row.resolved_count || 0), 0);
        setStats({
          total_tickets: created,
          open_tickets: Number(latest?.open_count || 0),
          in_progress_tickets: 0,
          closed_tickets: resolved,
          resolved_tickets: resolved,
          avg_resolution_time_hours: 0,
          sla_compliance_percentage: Number(latest?.sla_pct || 0),
          tickets_by_priority: {
            critical: 0,
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0,
          },
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
      if (!shouldQueryCosTable('fact_tickets_daily')) {
        setLoading(false);
        return;
      }
      try {
        const { data: tickets, error: ticketsError } = await supabase
          .from('fact_tickets_daily')
          .select('fact_date, created_count, resolved_count')
          .order('fact_date', { ascending: true })
          .limit(days);

        if (ticketsError) throw ticketsError;

        setTrends((tickets || []).map((row) => ({
          date: row.fact_date,
          created: Number(row.created_count || 0),
          closed: Number(row.resolved_count || 0),
        })));
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
    if (!shouldQueryCosTable('tickets_cache')) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }
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
