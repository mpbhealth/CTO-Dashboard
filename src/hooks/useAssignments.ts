import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Assignment, AssignmentCreateData, AssignmentUpdateData } from '../types/Assignment';


export function useAssignments() {
  const [data, setData] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; auth_user_id: string; email: string; full_name?: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Ensure user record exists in users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            auth_user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || ''
          }])
          .select('id')
          .single();
        
        if (createError) throw createError;
        setCurrentUser(newUser);
      } else if (userError) {
        throw userError;
      } else {
        setCurrentUser(userRecord);
      }
      
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          projects(name),
          users!assignments_assigned_to_fkey(email, full_name, teams_user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include employee information
      const transformedAssignments = (assignments || []).map((assignment: any) => ({
        ...assignment,
        employee_email: assignment.users?.email,
        employee_name: assignment.users?.full_name,
        teams_user_id: assignment.users?.teams_user_id,
      }));
      
      setData(transformedAssignments);
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
      // Get the user's ID from the users table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (!userRecord) throw new Error('User profile not found');
      
      const { data, error } = await supabase
        .from('assignments')
        .insert([{
          ...assignmentData,
          assigned_to: userRecord.id
        }])
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
    currentUser,
    refetch: fetchData,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentsByProject
  };
}