import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useStaffLogs() {
  const [data, setData] = useState<any[]>([]);
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStaffLogs();
  }, []);

  return { data, loading, error };
}
