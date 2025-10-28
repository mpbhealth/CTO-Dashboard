import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DepartmentNote {
  id: string;
  org_id: string;
  department: 'concierge' | 'sales' | 'operations' | 'finance' | 'saudemax';
  upload_id: string | null;
  note_content: string;
  is_pinned: boolean;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    display_name: string;
    full_name: string;
    role: string;
  };
}

export interface CreateNoteInput {
  department: 'concierge' | 'sales' | 'operations' | 'finance' | 'saudemax';
  upload_id?: string;
  note_content: string;
  is_pinned?: boolean;
  tags?: string[];
}

export interface UpdateNoteInput {
  id: string;
  note_content?: string;
  is_pinned?: boolean;
  tags?: string[];
}

export function useDepartmentNotes(department?: string, uploadId?: string) {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['department-notes', department, uploadId],
    queryFn: async () => {
      let query = supabase
        .from('department_notes')
        .select(`
          *,
          creator:created_by(display_name, full_name, role)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (department) {
        query = query.eq('department', department);
      }

      if (uploadId) {
        query = query.eq('upload_id', uploadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DepartmentNote[];
    },
  });

  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const profile = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.data.user.id)
        .single();

      if (!profile.data) throw new Error('Profile not found');

      const { error } = await supabase
        .from('department_notes')
        .insert({
          org_id: profile.data.org_id,
          department: input.department,
          upload_id: input.upload_id || null,
          note_content: input.note_content,
          is_pinned: input.is_pinned || false,
          tags: input.tags || [],
          created_by: user.data.user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-notes'] });
    },
  });

  const updateNote = useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      const updateData: any = {};

      if (input.note_content !== undefined) updateData.note_content = input.note_content;
      if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
      if (input.tags !== undefined) updateData.tags = input.tags;

      const { error } = await supabase
        .from('department_notes')
        .update(updateData)
        .eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-notes'] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('department_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-notes'] });
    },
  });

  const togglePin = useMutation({
    mutationFn: async (noteId: string) => {
      const note = notes.find(n => n.id === noteId);
      if (!note) throw new Error('Note not found');

      const { error } = await supabase
        .from('department_notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-notes'] });
    },
  });

  return {
    notes,
    isLoading,
    error,
    refetch,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  };
}
