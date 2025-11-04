import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDepartmentNotes(departmentId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!departmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: notes, error: notesError } = await supabase
        .from('department_notes')
        .select('*')
        .eq('department_id', departmentId)
        .order('created_at', { ascending: false });

      if (notesError) {
        if (notesError.code === 'PGRST116' || notesError.code === '42P01') {
          console.warn(`Department notes table not accessible: ${notesError.message}`);
          setData([]);
          return;
        }
        throw notesError;
      }

      setData(notes || []);
    } catch (err: any) {
      console.error('Error fetching department notes:', err);
      setError(err.message || 'Failed to fetch department notes');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentId]);

  const addNote = async (note: any) => {
    try {
      const { error } = await supabase.from('department_notes').insert([note]);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateNote = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('department_notes').update(updates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('department_notes').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { data, loading, error, refetch: fetchData, addNote, updateNote, deleteNote };
}
