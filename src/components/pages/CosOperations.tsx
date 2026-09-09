import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface SourceRow {
  key: string;
  status: string;
  last_success_at: string | null;
}

interface SyncRow {
  source_key: string;
  status: string;
  started_at: string | null;
}

const LINKS = [
  { href: '/operations/compliance', label: 'Compliance' },
  { href: '/operations/saas-spend', label: 'SaaS spend' },
  { href: '/operations/it-support', label: 'IT support' },
  { href: '/operations/integrations', label: 'Integrations' },
  { href: '/operations/policy-manager', label: 'Policy' },
  { href: '/operations/organization', label: 'Organization' },
  { href: '/operations/infrastructure/deployments', label: 'Deployments' },
];

export function CosOperations() {
  const sources = useQuery({
    queryKey: ['operations-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sources')
        .select('key, status, last_success_at')
        .order('key');
      if (error) throw error;
      return (data || []) as SourceRow[];
    },
  });

  const counts = useQuery({
    queryKey: ['operations-counts'],
    queryFn: async () => {
      const [vendors, expenses, incidents, policies, mail] = await Promise.all([
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('saas_expenses').select('id', { count: 'exact', head: true }),
        supabase.from('hipaa_incidents').select('id', { count: 'exact', head: true }),
        supabase.from('hipaa_policies').select('id', { count: 'exact', head: true }),
        supabase.from('mail_accounts').select('id', { count: 'exact', head: true }),
      ]);
      const firstError = [vendors, expenses, incidents, policies, mail].find((result) => result.error);
      if (firstError?.error) throw firstError.error;
      return {
        vendors: vendors.count ?? 0,
        expenses: expenses.count ?? 0,
        incidents: incidents.count ?? 0,
        policies: policies.count ?? 0,
        mail: mail.count ?? 0,
      };
    },
  });

  const syncs = useQuery({
    queryKey: ['operations-syncs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_runs')
        .select('source_key, status, started_at')
        .order('started_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []) as SyncRow[];
    },
  });

  const cards = [
    { label: 'Vendors', value: counts.data?.vendors },
    { label: 'SaaS expenses', value: counts.data?.expenses },
    { label: 'HIPAA policies', value: counts.data?.policies },
    { label: 'Incidents', value: counts.data?.incidents },
    { label: 'Mailboxes', value: counts.data?.mail },
    { label: 'Sources', value: sources.data?.length },
  ];

  return (
    <div className="relative w-full bg-aryx-bg px-4 py-10 text-aryx-ink md:py-16">
      <div className="cos-page w-full">
        <p className="mb-4 inline-flex rounded-full border border-aryx-line bg-aryx-elevated px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-aryx-muted">
          Operations
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-aryx-ink md:text-6xl">
          Company operations.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-aryx-muted md:text-base">
          Live counts from COS tables. Churn analytics stay in enrollment until that connector is configured.
        </p>

        {(counts.isError || sources.isError) && (
          <p className="mt-6 text-sm text-red-600 dark:text-red-300">
            Could not load operations data. Check your session and try again.
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          {cards.map((card) => (
            <div key={card.label} className="rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line md:col-span-4">
              <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-aryx-faint">{card.label}</p>
                <p className="mt-3 text-4xl font-semibold text-aryx-ink">
                  {counts.isLoading || sources.isLoading ? '—' : card.value ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-full border border-aryx-line bg-aryx-elevated px-6 py-4 text-sm text-aryx-ink transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-aryx-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(sources.data || []).map((source) => (
            <span
              key={source.key}
              className="rounded-full border border-aryx-line px-3 py-1 text-[10px] uppercase tracking-wider text-aryx-faint"
            >
              {source.key} · {source.status}
            </span>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line">
          <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-aryx-faint">Recent sync runs</p>
            {syncs.isError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-300">Could not load sync history.</p>
            )}
            {(syncs.data || []).length === 0 && !syncs.isLoading && !syncs.isError && (
              <p className="mt-3 text-sm text-aryx-muted">No sync runs yet.</p>
            )}
            <ul className="mt-4 space-y-2 text-sm text-aryx-ink">
              {(syncs.data || []).map((run, index) => (
                <li key={`${run.source_key}-${run.started_at}-${index}`} className="flex justify-between gap-4">
                  <span>{run.source_key}</span>
                  <span className="text-aryx-faint">
                    {run.status}
                    {run.started_at ? ` · ${new Date(run.started_at).toLocaleString()}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CosOperations;
