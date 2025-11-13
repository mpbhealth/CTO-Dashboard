import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SimpleNote {
  id: string;
  title: string | null;
  content: string;
  category: string | null;
  tags: string[] | null;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useSimpleNotes(category?: string) {
  const [notes, setNotes] = useState<SimpleNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      let query = supabase
        .from('notes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setNotes(data || []);
    } catch (err) {
      console.error('[useSimpleNotes] Error fetching notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();

    const subscription = supabase
      .channel('notes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [category]);

  const createNote = async (
    content: string,
    options?: {
      title?: string;
      category?: string;
      tags?: string[];
      is_pinned?: boolean;
    }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('notes')
        .insert([
          {
            content,
            title: options?.title || null,
            category: options?.category || category || null,
            tags: options?.tags || null,
            is_pinned: options?.is_pinned || false,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      console.error('[useSimpleNotes] Error creating note:', err);
      throw err;
    }
  };

  const updateNote = async (
    id: string,
    updates: {
      content?: string;
      title?: string;
      category?: string;
      tags?: string[];
      is_pinned?: boolean;
    }
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return data;
    } catch (err) {
      console.error('[useSimpleNotes] Error updating note:', err);
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('[useSimpleNotes] Error deleting note:', err);
      throw err;
    }
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refresh: fetchNotes,
  };
}
