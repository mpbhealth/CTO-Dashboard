import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';

export function CosIntegrations() {
  const { orgId, linked } = useOrg();

  const sources = useQuery({
    queryKey: ['integration-sources-detail', orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sources')
        .select('key, status, last_success_at, last_error')
        .eq('org_id', orgId);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Operations</p>
      <h1 className="mb-4 font-display text-4xl font-semibold">Integrations</h1>
      <p className="mb-6 max-w-2xl text-sm text-aryx-muted">
        Status only. Remote organization maps are server-owned so one tenant cannot point COS at another project. COS never writes to EnrollFlow, CRM, AdvisorIQ, tickets, or MarketFlow.
      </p>
      <OrgPicker />
      <div className="mt-8 grid gap-3">
        <Status label="EnrollFlow" on={linked.enrollment} />
        <Status label="ARYX CRM" on={linked.crm} />
        <Status label="AdvisorIQ" on={linked.advisoriq} />
        <Status label="Support tickets" on={linked.tickets} />
        <Status label="MarketFlow" on={linked.traffic} />
      </div>
      <div className="mt-8 grid gap-3">
        {(sources.data || []).map((row) => (
          <div key={row.key} className="rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
            <p className="text-sm">{row.key} · {row.status}</p>
            <p className="text-xs text-aryx-faint">{row.last_success_at || 'never synced'} {row.last_error ? `· ${row.last_error}` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Status({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
      <span>{label}</span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">{on ? 'linked' : 'not linked'}</span>
    </div>
  );
}

export default CosIntegrations;
