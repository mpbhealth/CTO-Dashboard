import { useQuery } from '@tanstack/react-query';

export interface EnrollmentData {
  date: string;
  enrollments: number;
  revenue: number;
}

export function useEnrollmentData() {
  return useQuery({
    queryKey: ['enrollmentData'],
    queryFn: async (): Promise<EnrollmentData[]> => {
      // TODO: Implement actual data fetching from Supabase
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export default useEnrollmentData;
