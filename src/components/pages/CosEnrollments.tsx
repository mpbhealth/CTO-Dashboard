import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber, money, periodBounds, type PeriodKey } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { PeriodToggle } from '../cos/PeriodToggle';
import { Unlinked } from './CosFinance';

export function CosEnrollments() {
  const { orgId, linked, rollup, memberships } = useOrg();
  const [period, setPeriod] = useState<PeriodKey>('mtd');
  const bounds = periodBounds(period);
  const orgIds = rollup ? memberships.map((row) => row.org_id) : orgId ? [orgId] : [];

  const rows = useQuery({
    queryKey: ['enroll-facts', orgIds.join(','), bounds.start],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_enrollments_daily')
        .select('fact_date, product_key, plan_type, new_count, inactive_count, active_count, mrr')
        .in('org_id', orgIds)
        .gte('fact_date', bounds.start)
        .order('fact_date', { ascending: false })
        .limit(90);
      if (error) throw error;
      return data || [];
    },
  });

  if (!linked.enrollment) {
    return <Unlinked title="Enrollments" message="EnrollFlow is not linked for this organization." />;
  }

  const newest = rows.data?.[0];
  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Analytics</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Enrollment</h1>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <OrgPicker />
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Latest active" value={compactNumber(newest?.active_count)} />
        <Stat label="Latest new" value={compactNumber(newest?.new_count)} />
        <Stat label="Latest MRR" value={money(newest?.mrr)} />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
            <tr>
              <th className="py-2">Date</th>
              <th>Product</th>
              <th>Plan</th>
              <th>New</th>
              <th>Inactive</th>
              <th>Active</th>
              <th>MRR</th>
            </tr>
          </thead>
          <tbody>
            {(rows.data || []).map((row) => (
              <tr key={`${row.fact_date}-${row.product_key}-${row.plan_type}`} className="border-t border-aryx-line">
                <td className="py-3">{row.fact_date}</td>
                <td>{row.product_key || '—'}</td>
                <td>{row.plan_type || '—'}</td>
                <td>{row.new_count}</td>
                <td>{row.inactive_count}</td>
                <td>{row.active_count}</td>
                <td>{money(row.mrr)}</td>
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

export default CosEnrollments;
