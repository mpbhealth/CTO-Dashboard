import { useState, useEffect, useCallback } from 'react';
import { ticketingApiClient } from '../lib/ticketingApiClient';
import type { StaffLog, StaffLogFilters, StaffLogStats } from '../types/tickets';

export function useStaffLogs(filters?: StaffLogFilters, autoSync = false) {
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketingApiClient.getLocalStaffLogs(filters);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const syncLogs = useCallback(async (ticketId?: string) => {
    setSyncing(true);
    setError(null);
    try {
      const result = await ticketingApiClient.syncStaffLogs(ticketId);
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync staff logs');
    } finally {
      setSyncing(false);
    }
  }, [fetchLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoSync) {
      const interval = setInterval(() => {
        syncLogs();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoSync, syncLogs]);

  return {
    logs,
    loading,
    error,
    syncing,
    refresh: fetchLogs,
    syncLogs,
  };
}

export function useStaffLogStats(ticketId?: string) {
  const [stats, setStats] = useState<StaffLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketingApiClient.getLocalStaffLogStats(ticketId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff log stats');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
