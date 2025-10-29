import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function useDepartmentData(departmentName?: string) {
  const [data, setData] = useState<Department | null>(null);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchDepartmentData();
  }, [departmentName]);

  return { data, loading, error };
}
