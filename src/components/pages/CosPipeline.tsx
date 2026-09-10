import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber, money } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';

export function CosPipeline() {
  const { orgId, linked } = useOrg();
  const rows = useQuery({
    queryKey: ['pipeline-facts', orgId],
    enabled: Boolean(orgId) && linked.crm,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_crm_pipeline_daily')
        .select('fact_date, stage_key, lead_count, premium_sum, deal_amount, weighted_amount, won_count, lost_count, aging_over_7, activity_count')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(40);
      if (error) throw error;
      return data || [];
    },
  });

  const latestDate = rows.data?.[0]?.fact_date;
  const latest = (rows.data || []).filter((row) => row.fact_date === latestDate);
  const weighted = latest[0]?.weighted_amount || 0;
  const premium = latest.reduce((s, row) => s + Number(row.premium_sum), 0);

  const scenarios = useMemo(() => ({
    pessimistic: weighted * 0.7,
    base: weighted,
    optimistic: weighted * 1.25 + premium * 0.1,
  }), [premium, weighted]);

  if (!linked.crm) {
    return <Unlinked title="Pipeline" message="CRM is not linked for this organization." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Analytics</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Pipeline</h1>
      <OrgPicker />
      <p className="mt-4 max-w-2xl text-sm text-aryx-muted">
        If-closed scenarios are not collected revenue. Closed-won stays in EnrollFlow billing.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Pessimistic" value={money(scenarios.pessimistic)} />
        <Stat label="Base" value={money(scenarios.base)} />
        <Stat label="Optimistic" value={money(scenarios.optimistic)} />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
            <tr>
              <th className="py-2">Stage</th>
              <th>Leads</th>
              <th>Quoted</th>
              <th>Aging 7d+</th>
              <th>Won / Lost</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((row) => (
              <tr key={row.stage_key} className="border-t border-aryx-line">
                <td className="py-3">{row.stage_key}</td>
                <td>{compactNumber(row.lead_count)}</td>
                <td>{money(row.premium_sum)}</td>
                <td>{row.aging_over_7}</td>
                <td>{row.won_count} / {row.lost_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-aryx-elevated p-5 ring-1 ring-aryx-line">
      <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default CosPipeline;
