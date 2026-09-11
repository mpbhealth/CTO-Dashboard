import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber, money } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { CommandStat, CommandStrip } from '../cos/CommandStrip';
import { Unlinked } from './CosFinance';
import { CosIslandLink, CosPage, CosPageHero } from '../cos/CosPage';

export function CosPipeline() {
  const { orgId, linked } = useOrg();
  const rows = useQuery({
    queryKey: ['pipeline-facts', orgId],
    enabled: Boolean(orgId) && linked.crm,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_crm_pipeline_daily')
        .select('fact_date, stage_key, lead_count, premium_sum, deal_amount, weighted_amount, won_count, lost_count, aging_over_7, activity_count, metadata')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data || []) as Array<{
        fact_date: string;
        stage_key: string;
        lead_count: number;
        premium_sum: number;
        deal_amount: number;
        weighted_amount: number;
        won_count: number;
        lost_count: number;
        aging_over_7: number;
        metadata?: { quoted_open?: number; lead_if_closed?: number; deal_if_closed?: number };
      }>;
    },
  });

  const latestDate = rows.data?.[0]?.fact_date;
  const latest = (rows.data || []).filter((row) => row.fact_date === latestDate);
  const weighted = Number(latest[0]?.weighted_amount || 0);
  const quoted = Number(latest[0]?.metadata?.quoted_open ?? latest.reduce((s, row) => s + Number(row.premium_sum), 0));
  const leadIfClosed = Number(latest[0]?.metadata?.lead_if_closed || 0);
  const dealIfClosed = Number(latest[0]?.metadata?.deal_if_closed || 0);
  const aging = latest.reduce((s, row) => s + Number(row.aging_over_7 || 0), 0);

  const scenarios = useMemo(() => ({
    pessimistic: weighted * 0.7,
    base: weighted,
    optimistic: weighted * 1.25 + quoted * 0.1,
  }), [quoted, weighted]);

  if (!linked.crm) {
    return <Unlinked title="Pipeline" message="CRM is not linked for this organization." />;
  }

  return (
    <CosPage>
      <CosPageHero
        eyebrow="CRM"
        title="Pipeline."
        lede="If-closed scenarios are not collected revenue. Closed-won stays in EnrollFlow billing."
        actions={<CosIslandLink to="/crm">Records</CosIslandLink>}
        toolbar={<OrgPicker />}
      />
      <div className="mt-6 space-y-6">
        <CommandStrip title="Quoted vs if-closed">
          <CommandStat label="Quoted (open)" value={money(quoted)} hint="Not collected" />
          <CommandStat label="Lead if-closed" value={money(leadIfClosed)} hint="Quoted × stage probability" />
          <CommandStat label="Deal if-closed" value={money(dealIfClosed)} hint="Open deals × probability" />
        </CommandStrip>
        <CommandStrip title="Scenarios · not collected">
          <CommandStat label="Pessimistic" value={money(scenarios.pessimistic)} />
          <CommandStat label="Base" value={money(scenarios.base)} />
          <CommandStat label="Optimistic" value={money(scenarios.optimistic)} />
        </CommandStrip>
        <CommandStat label="Aging 7d+" value={compactNumber(aging)} />
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
    </CosPage>
  );
}

export default CosPipeline;
