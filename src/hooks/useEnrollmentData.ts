import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EnrollmentData {
  id: string;
  enrollment_id: string;
  member_id: string;
  enrollment_date: string;
  program_name: string;
  enrollment_status: 'active' | 'pending' | 'cancelled' | 'lapsed' | 'completed';
  enrollment_source: string | null;
  premium_amount: number;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useEnrollmentData() {
  const [data, setData] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: enrollmentData, error } = await supabase
        .from('member_enrollments')
        .select('*')
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      setData(enrollmentData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}