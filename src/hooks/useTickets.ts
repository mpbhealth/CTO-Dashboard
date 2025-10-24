import { useState, useEffect, useCallback } from 'react';
import { ticketingApiClient } from '../lib/ticketingApiClient';
import type {
  TicketCache,
  TicketStats,
  TicketFilters,
  TicketSortOptions,
  CreateTicketRequest,
  UpdateTicketRequest,
} from '../types/tickets';

export function useTickets(
  filters?: TicketFilters,
  sort?: TicketSortOptions,
  autoSync = true
) {
  const [tickets, setTickets] = useState<TicketCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localTickets = await ticketingApiClient.getLocalTickets(filters, sort);
      setTickets(localTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  const syncTickets = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await ticketingApiClient.syncTickets();
      if (result.success) {
        await fetchTickets();
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [fetchTickets]);

  useEffect(() => {
    fetchTickets();

    if (autoSync) {
      const interval = setInterval(() => {
        syncTickets();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [fetchTickets, autoSync, syncTickets]);

  const refresh = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    syncing,
    refresh,
    syncTickets,
  };
}

export function useTicketStats() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const localStats = await ticketingApiClient.getLocalTicketStats();
      setStats(localStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

export function useTicketActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTicket = useCallback(async (ticket: CreateTicketRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ticketingApiClient.createTicket(ticket);
      if (result.error) {
        throw new Error(result.error);
      }
      await ticketingApiClient.syncTickets();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ticket';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTicket = useCallback(
    async (ticketId: string, updates: UpdateTicketRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await ticketingApiClient.updateTicket(ticketId, updates);
        if (result.error) {
          throw new Error(result.error);
        }
        await ticketingApiClient.syncTickets();
        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update ticket';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createTicket,
    updateTicket,
    loading,
    error,
  };
}

export function useTicketTrends(months: number = 10) {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trendData = await ticketingApiClient.getTicketTrends(months);
      setTrends(trendData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return {
    trends,
    loading,
    error,
    refresh: fetchTrends,
  };
}
