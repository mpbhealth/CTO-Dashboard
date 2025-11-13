import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMemberStatusData() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemberStatus() {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('member_status')
          .select('*')
          .order('created_at', { ascending: false });

        if (memberError) throw memberError;
        setData(memberData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMemberStatus();
  }, []);

  return { data, loading, error };
}
