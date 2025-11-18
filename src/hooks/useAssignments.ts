import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Assignment } from '../types/common';

interface UseAssignmentsReturn {
  data: Assignment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export function useAssignments(): UseAssignmentsReturn {
  const [data, setData] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setData((assignments as Assignment[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addAssignment = async (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('assignments').insert([assignment]);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add assignment';
      throw new Error(errorMessage);
    }
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    try {
      const { error } = await supabase.from('assignments').update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment';
      throw new Error(errorMessage);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete assignment';
      throw new Error(errorMessage);
    }
  };

  return { data, loading, error, refetch: fetchData, addAssignment, updateAssignment, deleteAssignment };
}
