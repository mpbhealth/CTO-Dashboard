import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SaaSExpense {
  id: string;
  service_name: string;
  category: string;
  monthly_cost: number;
  billing_cycle: string;
  renewal_date?: string;
  status: string;
}

export function useSaaSExpenses() {
  return useQuery({
    queryKey: ['saasExpenses'],
    queryFn: async (): Promise<SaaSExpense[]> => {
      const { data, error } = await supabase.from('saas_expenses').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export default useSaaSExpenses;
