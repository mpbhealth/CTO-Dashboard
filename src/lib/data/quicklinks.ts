import { supabase } from '../supabase';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  icon?: string;
  is_favorite?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export async function getQuickLinks() {
  const { data, error } = await supabase
    .from('quick_links')
    .select('*')
    .order('is_favorite', { ascending: false })
    .order('title', { ascending: true });

  if (error) throw error;
  return data as QuickLink[];
}

export async function getQuickLinkById(id: string) {
  const { data, error } = await supabase
    .from('quick_links')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as QuickLink | null;
}

export async function createQuickLink(link: Omit<QuickLink, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('quick_links')
    .insert(link)
    .select()
    .single();

  if (error) throw error;
  return data as QuickLink;
}

export async function updateQuickLink(id: string, updates: Partial<QuickLink>) {
  const { data, error } = await supabase
    .from('quick_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as QuickLink;
}

export async function deleteQuickLink(id: string) {
  const { error } = await supabase
    .from('quick_links')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
