import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ARYX_CRM_HREF } from '@/lib/cos';

export function CosCrmDetail() {
  const { kind, id } = useParams<{ kind: string; id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['crm-proxy', 'detail', kind, id],
    enabled: !!kind && !!id,
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
        body: JSON.stringify({ action: 'detail', kind, id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'CRM unavailable');
      return json.record as {
        id: string;
        kind: string;
        name: string;
        email: string | null;
        status: string | null;
        updated_at: string | null;
        href?: string;
      };
    },
  });

  return (
    <div className="w-full px-4 py-10">
      <Link to="/crm" className="text-xs uppercase tracking-[0.18em] text-white/40">
        Back to CRM
      </Link>
      {isLoading && <p className="mt-6 text-white/40">Loading…</p>}
      {error && <p className="mt-6 text-amber-200/80">{(error as Error).message}</p>}
      {data && (
        <div className="mt-6 max-w-2xl rounded-[2rem] bg-white/5 p-1.5 ring-1 ring-white/10">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{data.kind}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{data.name}</h1>
            <p className="mt-2 text-white/50">{data.email || 'No email on file'}</p>
            <p className="mt-6 text-sm text-white/40">Status · {data.status || '—'}</p>
            <a
              href={data.href || `${ARYX_CRM_HREF}/${data.kind}/${data.id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex rounded-full bg-white px-5 py-2 text-sm text-black"
            >
              Open in ARYX CRM
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default CosCrmDetail;
