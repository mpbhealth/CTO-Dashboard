import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSupabaseTableOptions<T> {
  table: string;
  select?: string;
  orderBy?: string;
  orderAscending?: boolean;
  filters?: Record<string, unknown>;
  enabled?: boolean;
}

interface UseSupabaseTableResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching data from a Supabase table.
 * Consolidates the common pattern used across multiple hooks.
 * 
 * @example
 * const { data, loading, error, refetch } = useSupabaseTable<MyType>({
 *   table: 'my_table',
 *   orderBy: 'created_at',
 *   orderAscending: false,
 * });
 */
export function useSupabaseTable<T = Record<string, unknown>>({
  table,
  select = '*',
  orderBy = 'created_at',
  orderAscending = false,
  filters = {},
  enabled = true,
}: UseSupabaseTableOptions<T>): UseSupabaseTableResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending: orderAscending });
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData((result as T[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred fetching data';
      setError(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table, select, orderBy, orderAscending, JSON.stringify(filters), enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Pre-configured hooks for common tables (backward compatibility)
export const useKPIs = () => useSupabaseTable({ table: 'kpis' });
export const useTeamMembers = () => useSupabaseTable({ table: 'team_members', orderBy: 'name', orderAscending: true });
export const useProjects = () => useSupabaseTable({ table: 'projects' });
export const useRoadmapItems = () => useSupabaseTable({ table: 'roadmap_items' });
export const useTechStack = () => useSupabaseTable({ table: 'tech_stack', orderBy: 'name', orderAscending: true });
export const useDeploymentLogs = () => useSupabaseTable({ table: 'deployment_logs', orderBy: 'timestamp' });
export const useAIAgents = () => useSupabaseTable({ table: 'ai_agents', orderBy: 'name', orderAscending: true });

// Analytics hooks
export const useEnrollments = () => useSupabaseTable({ table: 'member_enrollments', orderBy: 'created_at' });
export const useMemberStatus = () => useSupabaseTable({ table: 'member_status_updates', orderBy: 'updated_at' });

