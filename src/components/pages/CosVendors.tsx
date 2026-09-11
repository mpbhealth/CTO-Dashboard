import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { money } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';
import { CosPage, CosPageHero } from '../cos/CosPage';

export function CosVendors() {
  const { orgId, linked, rollup, memberships } = useOrg();
  const orgIds = rollup ? memberships.map((row) => row.org_id) : orgId ? [orgId] : [];

  const vendor = useQuery({
    queryKey: ['vendor-monthly', orgIds.join(',')],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_vendor_costs_monthly')
        .select('period_start, product_key, vendor_cost, missing_match_count, metadata')
        .in('org_id', orgIds)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return (data || []) as Array<{
        period_start: string;
        product_key: string;
        vendor_cost: number;
        missing_match_count: number;
        metadata?: { product_label?: string };
      }>;
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

  const unmatched = (vendor.data || []).reduce((sum, row) => sum + Number(row.missing_match_count || 0), 0);

  return (
    <CosPage>
      <CosPageHero eyebrow="Finance" title="Vendors." toolbar={<OrgPicker />} />
      {unmatched > 0 && (
        <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          {unmatched} active enrollments have no matching vendor cost row.
        </p>
      )}
      <h2 className="mb-3 mt-8 text-sm uppercase tracking-[0.16em] text-aryx-faint">Carrier / plan costs</h2>
      <div className="space-y-2">
        {(vendor.data || []).map((row) => (
          <div key={`${row.period_start}-${row.product_key}`} className="flex justify-between rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
            <span>{row.period_start} · {row.metadata?.product_label || row.product_key || 'unmapped'}</span>
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
    </CosPage>
  );
}

export default CosVendors;
