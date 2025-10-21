import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TicketProjectLink, TicketAssignmentLink } from '../types/tickets';

export function useTicketProjectLinks(ticketId?: string, projectId?: string) {
  const [links, setLinks] = useState<TicketProjectLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!ticketId && !projectId) return;

    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('ticket_project_links').select('*');

      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLinks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  }, [ticketId, projectId]);

  const createLink = useCallback(
    async (newTicketId: string, newProjectId: string, linkType = 'related') => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: insertError } = await supabase
          .from('ticket_project_links')
          .insert({
            ticket_id: newTicketId,
            project_id: newProjectId,
            link_type: linkType,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setLinks(prev => [...prev, data]);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteLink = useCallback(async (linkId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('ticket_project_links')
        .delete()
        .eq('id', linkId);

      if (deleteError) throw deleteError;

      setLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    links,
    loading,
    error,
    fetchLinks,
    createLink,
    deleteLink,
  };
}

export function useTicketAssignmentLinks(ticketId?: string, assignmentId?: string) {
  const [links, setLinks] = useState<TicketAssignmentLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!ticketId && !assignmentId) return;

    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('ticket_assignment_links').select('*');

      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }
      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLinks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  }, [ticketId, assignmentId]);

  const createLink = useCallback(
    async (newTicketId: string, newAssignmentId: string, linkType = 'related') => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: insertError } = await supabase
          .from('ticket_assignment_links')
          .insert({
            ticket_id: newTicketId,
            assignment_id: newAssignmentId,
            link_type: linkType,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setLinks(prev => [...prev, data]);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteLink = useCallback(async (linkId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('ticket_assignment_links')
        .delete()
        .eq('id', linkId);

      if (deleteError) throw deleteError;

      setLinks(prev => prev.filter(link => link.id !== linkId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    links,
    loading,
    error,
    fetchLinks,
    createLink,
    deleteLink,
  };
}
