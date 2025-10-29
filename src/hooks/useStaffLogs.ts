import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StaffLog {
  id: string;
  staff_id: string;
  action: string;
  details?: string;
  created_at: string;
}

export function useStaffLogs() {
  const [data, setData] = useState<StaffLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStaffLogs() {
      try {
        const { data: logs, error: logsError } = await supabase
          .from('staff_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;
        setData(logs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchStaffLogs();
  }, []);

  return { data, loading, error };
}
