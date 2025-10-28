import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface TicketProjectLink {
  id: string;
  ticket_id: string;
  project_id: string;
  created_at: string;
}

export function useTicketProjectLinks(ticketId?: string) {
  return useQuery({
    queryKey: ['ticketProjectLinks', ticketId],
    queryFn: async (): Promise<TicketProjectLink[]> => {
      let query = supabase.from('ticket_project_links').select('*');

      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!ticketId,
    staleTime: 1000 * 60 * 5,
  });
}

export default useTicketProjectLinks;
