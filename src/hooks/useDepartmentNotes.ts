import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DepartmentNote {
  id: string;
  department_id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
}

export function useDepartmentNotes(departmentId?: string) {
  return useQuery({
    queryKey: ['departmentNotes', departmentId],
    queryFn: async (): Promise<DepartmentNote[]> => {
      let query = supabase
        .from('department_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!departmentId,
    staleTime: 1000 * 60 * 2,
  });
}

export default useDepartmentNotes;
