import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';

export function CosTickets() {
  const { orgId, linked } = useOrg();
  const rows = useQuery({
    queryKey: ['tickets-facts', orgId],
    enabled: Boolean(orgId) && linked.tickets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_tickets_daily')
        .select('fact_date, created_count, open_count, resolved_count, sla_pct')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const spike = useMemo(() => {
    const list = rows.data || [];
    if (list.length < 8) return false;
    const today = list[0].created_count;
    const baseline = list.slice(1, 8).reduce((s, row) => s + row.created_count, 0) / 7;
    return baseline > 0 && today > baseline * 1.5;
  }, [rows.data]);

  if (!linked.tickets) {
    return <Unlinked title="Support" message="Tickets stay hidden until this org has an explicit ticket scope. ITSTS is not org-scoped." />;
  }

  const latest = rows.data?.[0];
  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Support · MPB pilot</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Tickets</h1>
      <OrgPicker />
      {spike && (
        <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Created volume is above the 7-day baseline.
        </p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label="Open" value={compactNumber(latest?.open_count)} />
        <Stat label="Resolved" value={compactNumber(latest?.resolved_count)} />
        <Stat label="Created today" value={compactNumber(latest?.created_count)} />
        <Stat label="SLA %" value={latest?.sla_pct == null ? '—' : `${latest.sla_pct}%`} />
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

export default CosTickets;
