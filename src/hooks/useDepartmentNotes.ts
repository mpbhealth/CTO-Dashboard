import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DepartmentNote {
  id: string;
  department_id: string;
  title?: string;
  content: string;
  author_id?: string;
  author_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateDepartmentNote {
  department_id: string;
  title?: string;
  content: string;
  author_id?: string;
  author_name?: string;
}

export interface UpdateDepartmentNote {
  title?: string;
  content?: string;
}

export function useDepartmentNotes(departmentId?: string) {
  const [data, setData] = useState<DepartmentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
          // Table doesn't exist or access denied - gracefully handle
          setData([]);
          return;
        }
        throw notesError;
      }

      setData((notes as DepartmentNote[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch department notes';
      console.error('Error fetching department notes:', err);
      setError(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addNote = async (note: CreateDepartmentNote) => {
    const { error } = await supabase.from('department_notes').insert([note]);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  const updateNote = async (id: string, updates: UpdateDepartmentNote) => {
    const { error } = await supabase.from('department_notes').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('department_notes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchData();
  };

  return { data, loading, error, refetch: fetchData, addNote, updateNote, deleteNote };
}
