import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Assignment, AssignmentCreateData, AssignmentUpdateData } from '../types/Assignment';


export function useAssignments() {
  const [data, setData] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(assignments || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments. Please make sure you\'re connected to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addAssignment = async (assignmentData: AssignmentCreateData) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const updateAssignment = async (id: string, updates: AssignmentUpdateData) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const getAssignmentsByProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentsByProject
  };
}