import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/contexts/OrgContext';
import { CosBezel, CosPage, CosPageHero } from '../cos/CosPage';
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
    <CosPage>
      <CosPageHero
        eyebrow="Operations"
        title="Sources."
        lede="Status only. Remote organization maps are server-owned so one tenant cannot point ARYX CEO at another project. ARYX CEO never writes to EnrollFlow, CRM, AdvisorIQ, tickets, or MarketFlow."
        toolbar={<OrgPicker />}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Status className="md:col-span-7" label="MarketFlow / Google Analytics" on={linked.traffic} hint="Feeds fact_traffic_daily" />
        <Status className="md:col-span-5" label="EnrollFlow" on={linked.enrollment} />
        <Status className="md:col-span-4" label="ARYX CRM" on={linked.crm} />
        <Status className="md:col-span-4" label="AdvisorIQ" on={linked.advisoriq} />
        <Status className="md:col-span-4" label="Support tickets" on={linked.tickets} />
      </div>
      <div className="mt-8 grid gap-3">
        {(sources.data || []).map((row) => (
          <CosBezel key={row.key}>
            <p className="text-sm">{row.key} · {row.status}</p>
            <p className="mt-1 text-xs text-aryx-faint">
              {row.last_success_at || 'never synced'}
              {row.last_error ? ` · ${row.last_error}` : ''}
            </p>
          </CosBezel>
        ))}
      </div>
    </CosPage>
  );
}

function Status({
  label,
  on,
  hint,
  className = '',
}: {
  label: string;
  on: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <CosBezel className={className}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-aryx-ink">{label}</p>
          {hint && <p className="mt-1 text-xs text-aryx-faint">{hint}</p>}
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
          {on ? 'linked' : 'not linked'}
        </span>
      </div>
    </CosBezel>
  );
}

export default CosIntegrations;
