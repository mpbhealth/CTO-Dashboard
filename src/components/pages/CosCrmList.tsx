import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface CrmRecord {
  id: string;
  kind: 'lead' | 'contact';
  name: string;
  email: string | null;
  status: string | null;
  updated_at: string | null;
}

export function CosCrmList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['crm-proxy', 'list'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'CRM unavailable');
      return (json.records || []) as CrmRecord[];
    },
  });

  return (
    <div className="w-full px-4 py-10">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">ARYX CRM · read only</p>
      <h1 className="mb-8 text-4xl font-semibold text-white">Relationships</h1>
      {isLoading && <p className="text-white/40">Loading…</p>}
      {error && <p className="text-amber-200/80">{(error as Error).message}</p>}
      {!isLoading && !error && (data || []).length === 0 && (
        <p className="text-white/40">No CRM records returned. Confirm the ARYX CRM connector secrets, then refresh.</p>
      )}
      <div className="space-y-3">
        {(data || []).map((row) => (
          <Link
            key={`${row.kind}-${row.id}`}
            to={`/crm/${row.kind}/${row.id}`}
            className="block rounded-[1.5rem] bg-white/5 p-1.5 ring-1 ring-white/10"
          >
            <div className="rounded-[calc(1.5rem-0.375rem)] bg-[#0a0a0a] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white">{row.name || 'Untitled'}</p>
                  <p className="text-xs text-white/40">{row.email || 'No email'}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white/50">
                  {row.kind} · {row.status || 'open in CRM'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CosCrmList;
