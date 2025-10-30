import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Note {
  id: string;
  title?: string;
  content: string;
  owner_role: 'ceo' | 'cto';
  created_for_role?: 'ceo' | 'cto' | null;
  is_shared: boolean;
  is_collaborative: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface NoteShare {
  id: string;
  note_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  shared_with_role: 'ceo' | 'cto';
  permission_level: 'view' | 'edit';
  share_message?: string;
  created_at: string;
  shared_by_email?: string;
  shared_by_name?: string;
}

export interface NoteNotification {
  id: string;
  note_id: string;
  recipient_user_id: string;
  notification_type: 'shared' | 'edited' | 'unshared' | 'commented';
  is_read: boolean;
  sent_via: 'in-app' | 'email' | 'both';
  metadata: Record<string, any>;
  created_at: string;
  note?: Note;
}

export interface UseNotesOptions {
  dashboardRole: 'ceo' | 'cto';
  autoRefresh?: boolean;
}

export function useNotes(options: UseNotesOptions) {
  const { dashboardRole, autoRefresh = false } = options;
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<NoteNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('created_by', user.id)
      .eq('owner_role', dashboardRole)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    return data || [];
  };

  const fetchSharedNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: fetchError } = await supabase
      .from('notes')
      .select(`
        *,
        note_shares!inner(
          shared_by_user_id,
          shared_with_user_id,
          permission_level,
          share_message
        )
      `)
      .eq('note_shares.shared_with_user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    return data || [];
  };

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: fetchError } = await supabase
      .from('note_notifications')
      .select(`
        *,
        notes(*)
      `)
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;
    return data || [];
  };

  const fetchAllNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const [myNotesData, sharedNotesData, notificationsData] = await Promise.all([
        fetchMyNotes(),
        fetchSharedNotes(),
        fetchNotifications()
      ]);

      setNotes(myNotesData);
      setSharedNotes(sharedNotesData);
      setNotifications(notificationsData as NoteNotification[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotes();

    if (autoRefresh) {
      const subscription = supabase
        .channel('notes_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notes' },
          () => {
            fetchAllNotes();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'note_shares' },
          () => {
            fetchAllNotes();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'note_notifications' },
          () => {
            fetchAllNotes();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [dashboardRole, autoRefresh]);

  const createNote = async (
    content: string,
    options?: {
      title?: string;
      createdForRole?: 'ceo' | 'cto';
      shareImmediately?: boolean;
      permissionLevel?: 'view' | 'edit';
      shareMessage?: string;
    }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const noteData = {
      content,
      title: options?.title || null,
      owner_role: dashboardRole,
      created_for_role: options?.createdForRole || null,
      created_by: user.id,
      is_shared: options?.shareImmediately || false,
      is_collaborative: options?.permissionLevel === 'edit' || false
    };

    const { data, error: insertError } = await supabase
      .from('notes')
      .insert([noteData])
      .select()
      .single();

    if (insertError) throw insertError;

    if (options?.shareImmediately && options?.createdForRole) {
      await shareNoteWithRole(
        data.id,
        options.createdForRole,
        options.permissionLevel || 'view',
        options.shareMessage
      );
    }

    await fetchAllNotes();
    return data;
  };

  const updateNote = async (id: string, content: string, title?: string) => {
    const { error: updateError } = await supabase
      .from('notes')
      .update({ content, title, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    await fetchAllNotes();
  };

  const deleteNote = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await fetchAllNotes();
  };

  const shareNoteWithRole = async (
    noteId: string,
    targetRole: 'ceo' | 'cto',
    permissionLevel: 'view' | 'edit' = 'view',
    shareMessage?: string
  ) => {
    const { data, error: rpcError } = await supabase.rpc('share_note_with_role', {
      p_note_id: noteId,
      p_target_role: targetRole,
      p_permission_level: permissionLevel,
      p_share_message: shareMessage || null
    });

    if (rpcError) throw rpcError;

    if (!data.success) {
      throw new Error(data.error || 'Failed to share note');
    }

    await fetchAllNotes();
    return data;
  };

  const unshareNote = async (noteId: string, userId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('note_shares')
      .delete()
      .eq('note_id', noteId)
      .eq('shared_by_user_id', user.id);

    if (userId) {
      query = query.eq('shared_with_user_id', userId);
    }

    const { error: deleteError } = await query;
    if (deleteError) throw deleteError;

    const { count } = await supabase
      .from('note_shares')
      .select('*', { count: 'exact', head: true })
      .eq('note_id', noteId);

    if (count === 0) {
      await supabase
        .from('notes')
        .update({ is_shared: false, is_collaborative: false })
        .eq('id', noteId);
    }

    await fetchAllNotes();
  };

  const getNoteShares = async (noteId: string): Promise<NoteShare[]> => {
    const { data, error: fetchError } = await supabase
      .from('note_shares')
      .select(`
        *,
        shared_by:auth.users!note_shares_shared_by_user_id_fkey(email),
        shared_with:auth.users!note_shares_shared_with_user_id_fkey(email)
      `)
      .eq('note_id', noteId);

    if (fetchError) throw fetchError;
    return data || [];
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const { error: updateError } = await supabase
      .from('note_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) throw updateError;

    await fetchAllNotes();
  };

  const markAllNotificationsAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: updateError } = await supabase
      .from('note_notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', user.id)
      .eq('is_read', false);

    if (updateError) throw updateError;

    await fetchAllNotes();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notes,
    sharedNotes,
    notifications,
    unreadCount,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    shareNoteWithRole,
    unshareNote,
    getNoteShares,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refresh: fetchAllNotes
  };
}
