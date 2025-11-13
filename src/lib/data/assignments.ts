import { supabase } from '../supabase';

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_date?: string;
  project_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export async function getAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as Assignment[];
}

export async function getAssignmentById(id: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Assignment | null;
}

export async function getAssignmentsByUser(userId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('assigned_to', userId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as Assignment[];
}

export async function createAssignment(assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) throw error;
  return data as Assignment;
}

export async function updateAssignment(id: string, updates: Partial<Assignment>) {
  const { data, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Assignment;
}

export async function deleteAssignment(id: string) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
