import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { syncConnectors } from '@/lib/connectors';
import { ArrowUpRight, RefreshCw } from 'lucide-react';

interface Snapshot {
  source: string;
  metric_key: string;
  value: number | null;
  period_start: string;
}

const METRIC_LABELS: Record<string, string> = {
  crm_contact_count: 'CRM contacts',
  crm_lead_count: 'Open leads',
  crm_activity_count: 'CRM activities',
  enrollment_count: 'Enrollments',
  member_count: 'Members',
  member_app_count: 'Member app users',
  open_ticket_count: 'Open tickets',
};

export function CosHome() {
  const queryClient = useQueryClient();

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['analytics-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('source, metric_key, value, period_start')
        .order('period_start', { ascending: false });
      if (error) throw error;
      return (data || []) as Snapshot[];
    },
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['integration-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sources')
        .select('key, status, last_success_at');
      if (error) throw error;
      return data || [];
    },
  });

  const refresh = useMutation({
    mutationFn: async () => syncConnectors('all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['integration-sources'] });
    },
  });

  const latestByMetric = new Map<string, Snapshot>();
  for (const row of snapshots) {
    if (!latestByMetric.has(row.metric_key)) {
      latestByMetric.set(row.metric_key, row);
    }
  }

  return (
    <div className="relative w-full px-4 py-10 md:py-16">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/5 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
          Aryx Chief of Staff
        </p>
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Company, in one view.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/50 md:text-base">
              Read-only analytics from CRM, enrollment, and operations. Mail and notes live here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
          >
            <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
            Refresh sources
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {Array.from(latestByMetric.values()).slice(0, 6).map((metric) => (
            <div key={metric.metric_key} className="rounded-[2rem] bg-white/5 p-1.5 ring-1 ring-white/10 md:col-span-4">
              <div className="rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  {METRIC_LABELS[metric.metric_key] || metric.metric_key}
                </p>
                <p className="mt-3 text-4xl font-semibold text-white">
                  {isLoading ? '—' : metric.value ?? '—'}
                </p>
                <p className="mt-2 text-xs text-white/35">{metric.source}</p>
              </div>
            </div>
          ))}

          {latestByMetric.size === 0 && (
            <div className="rounded-[2rem] bg-white/5 p-1.5 ring-1 ring-white/10 md:col-span-12">
              <div className="rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-10 text-white/50">
                No snapshots yet. Refresh sources after connector secrets are set, or open CRM and Inbox to work.
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {['/inbox', '/crm', '/analytics/overview'].map((href, i) => (
            <Link
              key={href}
              to={href}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/80 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10"
            >
              {['Open inbox', 'Open CRM', 'Open analytics'][i]}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {sources.map((source) => (
            <span
              key={source.key}
              className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white/45"
            >
              {source.key} · {source.status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CosHome;
