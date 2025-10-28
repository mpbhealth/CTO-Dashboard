import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDepartmentData(departmentName?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentName) {
      setLoading(false);
      return;
    }

    async function fetchDepartmentData() {
      try {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .eq('name', departmentName)
          .maybeSingle();

        if (deptError) throw deptError;
        setData(deptData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDepartmentData();
  }, [departmentName]);

  return { data, loading, error };
}
