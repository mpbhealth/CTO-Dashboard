import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DepartmentData {
  id: string;
  name: string;
  metrics: Record<string, any>;
  data: any[];
}

export function useDepartmentData(departmentName?: string) {
  return useQuery({
    queryKey: ['departmentData', departmentName],
    queryFn: async (): Promise<DepartmentData | null> => {
      if (!departmentName) return null;

      const { data, error} = await supabase
        .from('department_data')
        .select('*')
        .eq('name', departmentName)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!departmentName,
    staleTime: 1000 * 60 * 5,
  });
}

export default useDepartmentData;
