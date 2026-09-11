import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber, ITSTS_HREF } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { CommandStat, CommandStrip } from '../cos/CommandStrip';
import { TrendSpark } from '../cos/TrendSpark';
import { Unlinked } from './CosFinance';
import { CosIslandLink, CosPage, CosPageHero } from '../cos/CosPage';

const AGE_LABELS: Record<string, string> = {
  '0_1': '0–1 day',
  '1_3': '1–3 days',
  '3_7': '3–7 days',
  '7_30': '7–30 days',
  '30_plus': '30+ days',
};

function MixBars({ rows }: { rows: Array<{ key: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{row.key}</span>
            <span className="text-aryx-faint">{compactNumber(row.count)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-aryx-ink/10">
            <div className="h-full rounded-full bg-aryx-accent" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CosTicketAnalytics() {
  const { orgId, linked } = useOrg();

  const book = useQuery({
    queryKey: ['ticket-analytics', orgId],
    enabled: Boolean(orgId) && linked.tickets,
    queryFn: async () => {
      const [daily, mix, aging, agents] = await Promise.all([
        supabase.from('fact_tickets_daily').select('fact_date, created_count, resolved_count, open_count, pending_count, breached_count, unassigned_count, sla_pct, first_response_pct, resolution_pct').eq('org_id', orgId).order('fact_date', { ascending: false }).limit(90),
        supabase.from('fact_ticket_mix').select('kind, item_key, item_count').eq('org_id', orgId),
        supabase.from('fact_ticket_aging').select('bucket, tickets').eq('org_id', orgId),
        supabase.from('fact_ticket_agents').select('agent_key, display_name, open_count, resolved_30, breached_count').eq('org_id', orgId).order('open_count', { ascending: false }).limit(20),
      ]);
      for (const result of [daily, mix, aging, agents]) {
        if (result.error) throw result.error;
      }
      return {
        daily: daily.data || [],
        mix: mix.data || [],
        aging: aging.data || [],
        agents: agents.data || [],
      };
    },
  });

  const latest = book.data?.daily[0];
  const created30 = useMemo(
    () => (book.data?.daily || []).slice(0, 30).reduce((sum, row) => sum + Number(row.created_count || 0), 0),
    [book.data?.daily],
  );
  const spark = useMemo(
    () => [...(book.data?.daily || [])].reverse().map((row) => ({
      date: row.fact_date,
      created: Number(row.created_count || 0),
      resolved: Number(row.resolved_count || 0),
    })),
    [book.data?.daily],
  );
  const mixOf = (kind: string) =>
    (book.data?.mix || [])
      .filter((row) => row.kind === kind)
      .map((row) => ({ key: row.item_key, count: Number(row.item_count) }))
      .sort((a, b) => b.count - a.count);

  if (!linked.tickets) {
    return <Unlinked title="Support analytics" message="Ticket analytics stay hidden until this org has an explicit ticket scope." />;
  }

  return (
    <CosPage>
      <CosPageHero
        eyebrow="Support · ITSTS analytics"
        title="Support analytics."
        actions={
          <>
            <CosIslandLink to="/tickets">Tickets</CosIslandLink>
            <CosIslandLink href={`${ITSTS_HREF}/analytics`}>Open ITSTS</CosIslandLink>
          </>
        }
        toolbar={<OrgPicker />}
      />
      <div className="mt-6 space-y-6">
        <CommandStrip title="Desk" href="/tickets" warning={Number(latest?.breached_count || 0) > 0 ? 'Open SLA breaches need a look in ITSTS.' : null}>
          <CommandStat label="Open" value={compactNumber(latest?.open_count)} />
          <CommandStat label="Pending" value={compactNumber(latest?.pending_count)} />
          <CommandStat label="Breached" value={compactNumber(latest?.breached_count)} />
          <CommandStat label="Unassigned" value={compactNumber(latest?.unassigned_count)} />
          <CommandStat label="Created 30d" value={compactNumber(created30)} />
          <CommandStat label="SLA this month" value={latest?.sla_pct == null ? '—' : `${latest.sla_pct}%`} hint={latest?.first_response_pct == null ? undefined : `First response ${latest.first_response_pct}%`} />
        </CommandStrip>
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Created / resolved</p>
          <TrendSpark data={spark} xKey="date" series={[{ key: 'created', color: '#FF5A1F' }, { key: 'resolved', color: '#2F9E44' }]} />
        </div>
        {(book.data?.aging || []).length > 0 && (
          <CommandStrip title="Open aging">
            {(book.data?.aging || []).map((row) => (
              <CommandStat key={row.bucket} label={AGE_LABELS[row.bucket] || row.bucket} value={compactNumber(row.tickets)} />
            ))}
          </CommandStrip>
        )}
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Status</h2>
            <MixBars rows={mixOf('status')} />
          </div>
          <div>
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Priority</h2>
            <MixBars rows={mixOf('priority')} />
          </div>
          <div>
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Category · 90 days</h2>
            <MixBars rows={mixOf('category').slice(0, 8)} />
          </div>
        </div>
        {(book.data?.agents || []).length > 0 && (
          <div>
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-aryx-faint">Agents</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
                  <tr>
                    <th className="py-2">Agent</th>
                    <th>Open</th>
                    <th>Resolved 30d</th>
                    <th>Breached</th>
                  </tr>
                </thead>
                <tbody>
                  {book.data?.agents.map((row) => (
                    <tr key={row.agent_key} className="border-t border-aryx-line">
                      <td className="py-3">{row.display_name || 'Unassigned'}</td>
                      <td>{compactNumber(row.open_count)}</td>
                      <td>{compactNumber(row.resolved_30)}</td>
                      <td>{compactNumber(row.breached_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CosPage>
  );
}

export default CosTicketAnalytics;
