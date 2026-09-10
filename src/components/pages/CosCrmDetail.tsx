import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ARYX_CRM_HREF } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { Unlinked } from './CosFinance';

export function CosCrmDetail() {
  const { kind, id } = useParams<{ kind: string; id: string }>();
  const { orgId, linked } = useOrg();

  const { data, isLoading, error } = useQuery({
    queryKey: ['crm-proxy', 'detail', orgId, kind, id],
    enabled: !!kind && !!id && linked.crm,
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

  if (!linked.crm) {
    return <Unlinked title="CRM record" message="CRM is not linked for this organization." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <Link to="/crm" className="text-xs uppercase tracking-[0.18em] text-aryx-faint">
        Back to CRM
      </Link>
      {isLoading && <p className="mt-6 text-aryx-muted">Loading…</p>}
      {error && <p className="mt-6 text-amber-700 dark:text-amber-200">{(error as Error).message}</p>}
      {data && (
        <div className="mt-6 w-full rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line">
          <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-aryx-faint">{data.kind}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-aryx-ink">{data.name}</h1>
            <p className="mt-2 text-aryx-muted">{data.email || 'No email on file'}</p>
            <p className="mt-6 text-sm text-aryx-faint">Status · {data.status || '—'}</p>
            <a
              href={data.href || `${ARYX_CRM_HREF}/${data.kind}/${data.id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex rounded-full bg-aryx-accent px-5 py-2 text-sm text-white"
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
