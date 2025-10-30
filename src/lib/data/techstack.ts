import { supabase } from '../supabase';

export interface Technology {
  id: string;
  name: string;
  category: string;
  description?: string;
  version?: string;
  status: 'active' | 'deprecated' | 'planned' | 'evaluating';
  vendor?: string;
  cost?: number;
  license?: string;
  documentation_url?: string;
  owner?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export async function getTechnologies() {
  const { data, error } = await supabase
    .from('technologies')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Technology[];
}

export async function getTechnologyById(id: string) {
  const { data, error } = await supabase
    .from('technologies')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Technology | null;
}

export async function createTechnology(tech: Omit<Technology, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('technologies')
    .insert(tech)
    .select()
    .single();

  if (error) throw error;
  return data as Technology;
}

export async function updateTechnology(id: string, updates: Partial<Technology>) {
  const { data, error } = await supabase
    .from('technologies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Technology;
}

export async function deleteTechnology(id: string) {
  const { error } = await supabase
    .from('technologies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
