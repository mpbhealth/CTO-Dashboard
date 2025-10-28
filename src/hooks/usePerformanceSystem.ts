import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  period: string;
  overall_rating: number;
  goals_completed: number;
  feedback: string;
  created_at: string;
}

export interface PerformanceGoal {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: string;
  progress: number;
}

export function usePerformanceReviews(employeeId?: string) {
  return useQuery({
    queryKey: ['performanceReviews', employeeId],
    queryFn: async (): Promise<PerformanceReview[]> => {
      let query = supabase
        .from('performance_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePerformanceGoals(employeeId?: string) {
  return useQuery({
    queryKey: ['performanceGoals', employeeId],
    queryFn: async (): Promise<PerformanceGoal[]> => {
      let query = supabase.from('performance_goals').select('*');

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePerformanceSystem() {
  return {
    reviews: usePerformanceReviews(),
    goals: usePerformanceGoals(),
  };
}

export default usePerformanceSystem;
