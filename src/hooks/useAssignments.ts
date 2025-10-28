import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAssignments() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setData(assignments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addAssignment = async (assignment: any) => {
    try {
      const { error } = await supabase.from('assignments').insert([assignment]);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateAssignment = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('assignments').update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { data, loading, error, refetch: fetchData, addAssignment, updateAssignment, deleteAssignment };
}
