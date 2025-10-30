import { supabase } from '../supabase';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  assigned_to?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export async function getRoadmapItems() {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .order('priority', { ascending: false })
    .order('target_date', { ascending: true });

  if (error) throw error;
  return data as RoadmapItem[];
}

export async function getRoadmapItemById(id: string) {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as RoadmapItem | null;
}

export async function createRoadmapItem(item: Omit<RoadmapItem, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('roadmap_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as RoadmapItem;
}

export async function updateRoadmapItem(id: string, updates: Partial<RoadmapItem>) {
  const { data, error } = await supabase
    .from('roadmap_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RoadmapItem;
}

export async function deleteRoadmapItem(id: string) {
  const { error } = await supabase
    .from('roadmap_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
