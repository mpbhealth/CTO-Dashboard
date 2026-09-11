import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber, ITSTS_HREF } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { CommandStat, CommandStrip } from '../cos/CommandStrip';
import { Unlinked } from './CosFinance';
import { CosIslandLink, CosPage, CosPageHero } from '../cos/CosPage';

interface BookTicket {
  ticket_key: string;
  ticket_number: number | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  agent_label: string | null;
  created_at: string | null;
  sla_due_at: string | null;
  href: string | null;
}

function ticketHref(href: string | null, ticketNumber: number | null): string {
  if (href?.startsWith('http')) return href;
  if (href) return `${ITSTS_HREF}${href.startsWith('/') ? href : `/${href}`}`;
  if (ticketNumber != null) return `${ITSTS_HREF}/tickets/${ticketNumber}`;
  return ITSTS_HREF;
}

function isBreached(due: string | null): boolean {
  return Boolean(due && new Date(due).getTime() < Date.now());
}

export function CosTickets() {
  const { orgId, linked } = useOrg();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<'created_at' | 'priority' | 'status'>('created_at');

  const latest = useQuery({
    queryKey: ['tickets-latest', orgId],
    enabled: Boolean(orgId) && linked.tickets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_tickets_daily')
        .select('fact_date, created_count, open_count, resolved_count, pending_count, breached_count, unassigned_count, sla_pct')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const mix = useQuery({
    queryKey: ['tickets-status-mix', orgId],
    enabled: Boolean(orgId) && linked.tickets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_ticket_mix')
        .select('item_key, item_count')
        .eq('org_id', orgId)
        .eq('kind', 'status');
      if (error) throw error;
      return Object.fromEntries((data || []).map((row) => [row.item_key, Number(row.item_count)]));
    },
  });

  const queue = useQuery({
    queryKey: ['book-tickets', orgId],
    enabled: Boolean(orgId) && linked.tickets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_tickets')
        .select('ticket_key, ticket_number, title, status, priority, category, agent_label, created_at, sla_due_at, href')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BookTicket[];
    },
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (queue.data || []).filter((row) => {
      if (!needle) return true;
      return [row.title, row.status, row.priority, row.category, row.agent_label, String(row.ticket_number || '')]
        .some((value) => String(value || '').toLowerCase().includes(needle));
    });
    const rank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    return [...list].sort((a, b) => {
      if (sortKey === 'priority') return (rank[b.priority || ''] || 0) - (rank[a.priority || ''] || 0);
      if (sortKey === 'status') return String(a.status).localeCompare(String(b.status));
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });
  }, [query, queue.data, sortKey]);

  if (!linked.tickets) {
    return <Unlinked title="Support" message="Tickets stay hidden until this org has an explicit ticket scope. ITSTS is company-wide, not tenant-mapped." />;
  }

  const snap = latest.data;
  const status = mix.data || {};

  return (
    <CosPage>
      <CosPageHero
        eyebrow="Support · ITSTS"
        title="Tickets."
        actions={
          <>
            <CosIslandLink to="/tickets/analytics">Analytics</CosIslandLink>
            <CosIslandLink href={ITSTS_HREF}>Open ITSTS</CosIslandLink>
          </>
        }
        toolbar={<OrgPicker />}
      />
      <div className="mt-6">
        <CommandStrip title="Queue" href="/tickets/analytics" warning={Number(snap?.breached_count || 0) > 0 ? `${compactNumber(snap?.breached_count)} open tickets are past SLA.` : null}>
          <CommandStat label="Open now" value={compactNumber(snap?.open_count)} hint="New + open + waiting + hold" />
          <CommandStat label="New" value={compactNumber(status.new)} />
          <CommandStat label="Awaiting / hold" value={compactNumber(snap?.pending_count)} />
          <CommandStat label="Unassigned" value={compactNumber(snap?.unassigned_count)} />
          <CommandStat label="SLA breach" value={compactNumber(snap?.breached_count)} />
          <CommandStat label="Created today" value={compactNumber(snap?.created_count)} />
        </CommandStrip>
      </div>
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tickets"
          className="w-full rounded-full border border-aryx-line bg-aryx-elevated px-4 py-2 text-sm md:max-w-sm"
        />
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
          className="rounded-full border border-aryx-line bg-aryx-elevated px-4 py-2 text-sm"
        >
          <option value="created_at">Sort by newest</option>
          <option value="priority">Sort by priority</option>
          <option value="status">Sort by status</option>
        </select>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">
            <tr>
              <th className="py-2">Ticket</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Assignee</th>
              <th>Age</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.ticket_key} className="border-t border-aryx-line">
                <td className="py-3">
                  <span className="text-aryx-faint">#{row.ticket_number || '—'}</span>
                  <span className="mt-1 block">{row.title || 'Untitled'}</span>
                </td>
                <td>{row.status || '—'}</td>
                <td>{row.priority || '—'}</td>
                <td>{row.category || '—'}</td>
                <td>{row.agent_label || 'Unassigned'}</td>
                <td className={isBreached(row.sla_due_at) ? 'text-amber-700 dark:text-amber-200' : ''}>
                  {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                  {isBreached(row.sla_due_at) ? ' · SLA' : ''}
                </td>
                <td>
                  <a href={ticketHref(row.href, row.ticket_number)} className="text-xs text-aryx-accent" target="_blank" rel="noreferrer">
                    Open in ITSTS
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="mt-6 text-sm text-aryx-muted">No open tickets in the warehouse yet. Refresh sources after ITSTS sync.</p>
        )}
      </div>
    </CosPage>
  );
}

export default CosTickets;
