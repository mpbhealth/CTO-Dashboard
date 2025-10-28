import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StaffLog {
  id: string;
  staff_id: string;
  action: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function useStaffLogs(staffId?: string) {
  return useQuery({
    queryKey: ['staffLogs', staffId],
    queryFn: async (): Promise<StaffLog[]> => {
      let query = supabase.from('staff_logs').select('*').order('timestamp', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export default useStaffLogs;
