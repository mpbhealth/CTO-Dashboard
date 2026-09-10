import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { money } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';

export function CosVendors() {
  const { orgId, linked, rollup, memberships } = useOrg();
  const orgIds = rollup ? memberships.map((row) => row.org_id) : orgId ? [orgId] : [];

  const vendor = useQuery({
    queryKey: ['vendor-monthly', orgIds.join(',')],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_vendor_costs_monthly')
        .select('period_start, product_key, vendor_cost, missing_match_count')
        .in('org_id', orgIds)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const saas = useQuery({
    queryKey: ['saas-expenses', orgIds.join(',')],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_expenses')
        .select('name, amount, cadence')
        .in('org_id', orgIds);
      if (error) throw error;
      return data || [];
    },
  });

  if (!linked.enrollment) {
    return <Unlinked title="Vendors" message="EnrollFlow is not linked, so carrier costs stay hidden." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Finance</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Vendors</h1>
      <OrgPicker />
      <h2 className="mb-3 mt-8 text-sm uppercase tracking-[0.16em] text-aryx-faint">Carrier / plan costs</h2>
      <div className="space-y-2">
        {(vendor.data || []).map((row) => (
          <div key={`${row.period_start}-${row.product_key}`} className="flex justify-between rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
            <span>{row.period_start} · {row.product_key || 'unmapped'}</span>
            <span>{money(row.vendor_cost)} {row.missing_match_count ? `· ${row.missing_match_count} unmatched` : ''}</span>
          </div>
        ))}
      </div>
      <h2 className="mb-3 mt-10 text-sm uppercase tracking-[0.16em] text-aryx-faint">Corporate SaaS</h2>
      <div className="space-y-2">
        {(saas.data || []).map((row) => (
          <div key={row.name} className="flex justify-between rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
            <span>{row.name} · {row.cadence}</span>
            <span>{money(row.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CosVendors;
