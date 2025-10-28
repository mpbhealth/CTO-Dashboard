import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface MemberStatus {
  id: string;
  member_id: string;
  status: string;
  enrollment_date: string;
  last_activity?: string;
  plan_type?: string;
}

export function useMemberStatusData() {
  return useQuery({
    queryKey: ['memberStatus'],
    queryFn: async (): Promise<MemberStatus[]> => {
      const { data, error } = await supabase.from('member_status').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export default useMemberStatusData;
