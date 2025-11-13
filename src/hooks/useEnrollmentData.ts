import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useEnrollmentData() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*')
          .order('created_at', { ascending: false });

        if (enrollmentsError) throw enrollmentsError;
        setData(enrollments || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, []);

  return { data, loading, error };
}
