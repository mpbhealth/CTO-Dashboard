import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber, money, ADVISORIQ_HREF } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';

export function CosAdvisors() {
  const { orgId, linked, rollup, memberships } = useOrg();
  const orgIds = rollup ? memberships.map((row) => row.org_id) : orgId ? [orgId] : [];

  const rows = useQuery({
    queryKey: ['advisor-scorecards', orgIds.join(',')],
    enabled: orgIds.length > 0 && linked.advisoriq,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_scorecards')
        .select('org_id, advisor_key, active_members, mrr, cost, net_mrr, retention_pct, enrollments_30, margin_pct')
        .in('org_id', orgIds)
        .order('mrr', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const mix = useQuery({
    queryKey: ['product-mix', orgIds.join(',')],
    enabled: orgIds.length > 0 && linked.advisoriq,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_product_mix')
        .select('product_key, active_members, mrr, net_mrr, margin_pct')
        .in('org_id', orgIds)
        .order('mrr', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (!linked.advisoriq) {
    return <Unlinked title="Advisors" message="AdvisorIQ is not linked. COS will not rebuild book scorecards." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Analytics · AdvisorIQ</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Advisors</h1>
      <OrgPicker />
      <a href={ADVISORIQ_HREF} className="mt-4 inline-block text-sm text-aryx-accent" target="_blank" rel="noreferrer">
        Open AdvisorIQ
      </a>
      {(mix.data || []).length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm uppercase tracking-[0.16em] text-aryx-faint">Product mix</h2>
          <div className="space-y-2">
            {mix.data?.map((row) => (
              <div key={row.product_key} className="flex justify-between rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
                <span>{row.product_key}</span>
                <span>{compactNumber(row.active_members)} · {money(row.mrr)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
            <tr>
              <th className="py-2">Advisor</th>
              <th>Members</th>
              <th>MRR</th>
              <th>Net MRR</th>
              <th>Retention</th>
              <th>Enrolls 30d</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {(rows.data || []).map((row) => (
              <tr key={`${row.org_id}-${row.advisor_key}`} className="border-t border-aryx-line">
                <td className="py-3">{row.advisor_key.slice(0, 8)}</td>
                <td>{compactNumber(row.active_members)}</td>
                <td>{money(row.mrr)}</td>
                <td>{money(row.net_mrr)}</td>
                <td>{row.retention_pct ?? '—'}%</td>
                <td>{row.enrollments_30}</td>
                <td>{row.margin_pct ?? '—'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CosAdvisors;
