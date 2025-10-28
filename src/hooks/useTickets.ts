import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
  reporter?: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
}

export interface TicketTrend {
  date: string;
  count: number;
}

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase.from('tickets').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ['ticketStats'],
    queryFn: async (): Promise<TicketStats> => {
      const { data, error } = await supabase.from('tickets').select('status');
      if (error) throw error;

      const stats: TicketStats = {
        total: data?.length || 0,
        open: data?.filter((t) => t.status === 'open').length || 0,
        in_progress: data?.filter((t) => t.status === 'in_progress').length || 0,
        closed: data?.filter((t) => t.status === 'closed').length || 0,
      };

      return stats;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useTicketTrends() {
  return useQuery({
    queryKey: ['ticketTrends'],
    queryFn: async (): Promise<TicketTrend[]> => {
      // TODO: Implement actual trend data aggregation
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTicketActions() {
  const queryClient = useQueryClient();

  const createTicket = useMutation({
    mutationFn: async (ticket: Partial<Ticket>) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...ticket }: Partial<Ticket> & { id: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update(ticket)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
    },
  });

  return { createTicket, updateTicket };
}
