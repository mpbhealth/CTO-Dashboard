import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { money, periodBounds, type PeriodKey } from '@/lib/cos';
import { downloadCsv } from '@/lib/exportFacts';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { PeriodToggle } from '../cos/PeriodToggle';

interface PnlRow {
  period_start: string;
  period_grain: string;
  collected: number;
  pending: number;
  failed: number;
  vendor_cost: number;
  commissions: number;
  saas_cost: number;
  gross_margin: number;
  net_operating: number;
}

export function CosFinance() {
  const { orgId, linked, rollup, memberships, isOperator } = useOrg();
  const [period, setPeriod] = useState<PeriodKey>('mtd');
  const orgIds = rollup ? memberships.map((row) => row.org_id) : orgId ? [orgId] : [];
  const bounds = periodBounds(period);

  const rows = useQuery({
    queryKey: ['finance-pnl', orgIds.join(','), bounds.start],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_pnl_period')
        .select('*')
        .in('org_id', orgIds)
        .gte('period_start', bounds.start)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return (data || []) as PnlRow[];
    },
  });

  const total = useMemo(() => {
    return (rows.data || []).reduce((acc, row) => ({
      collected: acc.collected + Number(row.collected),
      pending: acc.pending + Number(row.pending),
      failed: acc.failed + Number(row.failed),
      vendor: acc.vendor + Number(row.vendor_cost),
      commissions: acc.commissions + Number(row.commissions),
      saas: acc.saas + Number(row.saas_cost),
      gross: acc.gross + Number(row.gross_margin),
      net: acc.net + Number(row.net_operating),
    }), { collected: 0, pending: 0, failed: 0, vendor: 0, commissions: 0, saas: 0, gross: 0, net: 0 });
  }, [rows.data]);

  if (!linked.enrollment) {
    return <Unlinked title="Profit & Loss" message="EnrollFlow is not linked for this organization." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Finance</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Profit & Loss</h1>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <OrgPicker />
        <div className="flex flex-wrap items-center gap-3">
          <PeriodToggle value={period} onChange={setPeriod} />
          {isOperator && (
            <button
              type="button"
              className="rounded-full border border-aryx-line px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-aryx-muted"
              onClick={() => downloadCsv(`cos-pnl-${bounds.start}.csv`, (rows.data || []) as Array<Record<string, unknown>>)}
            >
              Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Collected" value={money(total.collected)} />
        <Stat label="Vendor cost" value={money(total.vendor)} />
        <Stat label="Commissions" value={money(total.commissions)} />
        <Stat label="Net operating" value={money(total.net)} />
      </div>
      <div className="mt-10 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-aryx-faint">Waterfall</p>
        {[
          ['Collected', total.collected],
          ['− Vendor', -total.vendor],
          ['− Commissions', -total.commissions],
          ['− SaaS', -total.saas],
          ['Net', total.net],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-aryx-elevated px-5 py-3 ring-1 ring-aryx-line">
            <span>{label}</span>
            <span className="font-semibold">{money(Number(value))}</span>
          </div>
        ))}
      </div>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
            <tr>
              <th className="py-2">Period</th>
              <th className="py-2">Collected</th>
              <th className="py-2">Vendor</th>
              <th className="py-2">Commissions</th>
              <th className="py-2">SaaS</th>
              <th className="py-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {(rows.data || []).map((row) => (
              <tr key={`${row.period_start}-${row.period_grain}`} className="border-t border-aryx-line">
                <td className="py-3">{row.period_start}</td>
                <td>{money(row.collected)}</td>
                <td>{money(row.vendor_cost)}</td>
                <td>{money(row.commissions)}</td>
                <td>{money(row.saas_cost)}</td>
                <td>{money(row.net_operating)}</td>
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

export function Unlinked({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <h1 className="mb-4 font-display text-4xl font-semibold">{title}</h1>
      <p className="text-aryx-muted">{message}</p>
    </div>
  );
}

export default CosFinance;
