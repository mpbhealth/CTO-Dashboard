import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { syncConnectors } from '@/lib/connectors';
import { money, compactNumber, periodBounds, type PeriodKey } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { PeriodToggle } from '../cos/PeriodToggle';
import { AryxLogo } from '../brand/AryxLogo';

interface Snapshot {
  source: string;
  metric_key: string;
  value: number | null;
  period_start: string;
  org_id: string;
}

interface PnlRow {
  org_id: string;
  period_start: string;
  collected: number;
  pending: number;
  vendor_cost: number;
  commissions: number;
  saas_cost: number;
  gross_margin: number;
  net_operating: number;
}

interface TicketRow {
  fact_date: string;
  open_count: number;
  created_count: number;
}

export function CosHome() {
  const queryClient = useQueryClient();
  const { orgId, linked, rollup, memberships, isOperator } = useOrg();
  const [period, setPeriod] = useState<PeriodKey>('mtd');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const bounds = periodBounds(period, customStart, customEnd);
  const orgIds = rollup ? memberships.map((row) => row.org_id) : orgId ? [orgId] : [];

  const snapshots = useQuery({
    queryKey: ['analytics-snapshots', orgIds.join(',')],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('source, metric_key, value, period_start, org_id')
        .in('org_id', orgIds)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return (data || []) as Snapshot[];
    },
  });

  const pnl = useQuery({
    queryKey: ['fact-pnl', orgIds.join(','), bounds.start],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_pnl_period')
        .select('org_id, period_start, collected, pending, vendor_cost, commissions, saas_cost, gross_margin, net_operating')
        .in('org_id', orgIds)
        .eq('period_grain', 'month')
        .gte('period_start', bounds.start.slice(0, 7) + '-01');
      if (error) throw error;
      return (data || []) as PnlRow[];
    },
  });

  const tickets = useQuery({
    queryKey: ['fact-tickets', orgIds.join(',')],
    enabled: orgIds.length > 0 && linked.tickets,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_tickets_daily')
        .select('fact_date, open_count, created_count')
        .in('org_id', orgIds)
        .order('fact_date', { ascending: false })
        .limit(14);
      if (error) throw error;
      return (data || []) as TicketRow[];
    },
  });

  const sources = useQuery({
    queryKey: ['integration-sources', orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sources')
        .select('key, status, last_success_at, last_error')
        .eq('org_id', orgId);
      if (error) throw error;
      return data || [];
    },
  });

  const refresh = useMutation({
    mutationFn: async () => syncConnectors('all'),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const latest = useMemo(() => {
    const map = new Map<string, Snapshot>();
    for (const row of snapshots.data || []) {
      if (!map.has(row.metric_key)) map.set(row.metric_key, row);
    }
    return map;
  }, [snapshots.data]);

  const pnlSum = useMemo(() => {
    const rows = pnl.data || [];
    return rows.reduce((acc, row) => ({
      collected: acc.collected + Number(row.collected),
      pending: acc.pending + Number(row.pending),
      vendor: acc.vendor + Number(row.vendor_cost),
      commissions: acc.commissions + Number(row.commissions),
      saas: acc.saas + Number(row.saas_cost),
      gross: acc.gross + Number(row.gross_margin),
      net: acc.net + Number(row.net_operating),
    }), { collected: 0, pending: 0, vendor: 0, commissions: 0, saas: 0, gross: 0, net: 0 });
  }, [pnl.data]);

  const ticketSpike = useMemo(() => {
    const rows = tickets.data || [];
    if (rows.length < 8) return false;
    const today = rows[0]?.created_count || 0;
    const baseline = rows.slice(1, 8).reduce((s, row) => s + row.created_count, 0) / 7;
    return baseline > 0 && today > baseline * 1.5;
  }, [tickets.data]);

  if (!orgId) {
    return (
      <div className="cos-page py-16 text-aryx-muted">
        No organization assigned. Ask an owner to invite you, or open COS from Aryx Accounts.
      </div>
    );
  }

  return (
    <div className="relative w-full bg-aryx-bg py-10 text-aryx-ink md:py-16">
      <div className="cos-page w-full">
        <AryxLogo wordmark />
        <p className="mb-4 mt-6 inline-flex rounded-full border border-aryx-line bg-aryx-elevated px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-aryx-muted">
          Aryx Chief of Staff
        </p>
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Company, in one view.</h1>
            <p className="mt-4 max-w-xl text-sm text-aryx-muted">
              Read-only money, pipeline, people, and traffic. Action stays in the source apps.
            </p>
          </div>
          {isOperator && (
            <button
              type="button"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              className="inline-flex items-center gap-3 rounded-full bg-aryx-accent px-6 py-3 text-sm font-medium text-white"
            >
              <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
              Refresh sources
            </button>
          )}
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <OrgPicker />
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            customStart={customStart}
            customEnd={customEnd}
            onCustom={(start, end) => {
              setCustomStart(start);
              setCustomEnd(end);
            }}
          />
        </div>

        {ticketSpike && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Ticket volume is above the 7-day baseline.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {linked.enrollment && (
            <>
              <HomeTile href="/finance" label="Collected" value={money(pnlSum.collected)} source="EnrollFlow" span={4} />
              <HomeTile href="/finance" label="Pending AR" value={money(pnlSum.pending)} source="EnrollFlow" span={4} />
              <HomeTile href="/finance" label="Contribution" value={money(pnlSum.net)} source="Rev − vendor − commissions − SaaS" span={4} />
            </>
          )}
          {linked.crm && (
            <HomeTile
              href="/pipeline"
              label="Weighted if-closed"
              value={money(Number(latest.get('weighted_forecast')?.value || 0))}
              source="ARYX CRM"
              span={4}
            />
          )}
          {linked.enrollment && (
            <HomeTile
              href="/enrollments"
              label="Active members"
              value={compactNumber(Number(latest.get('member_count')?.value || 0))}
              source="EnrollFlow"
              span={4}
            />
          )}
          {linked.advisoriq && (
            <>
              <HomeTile
                href="/advisors"
                label="AdvisorIQ MRR"
                value={money(Number(latest.get('iq_mrr')?.value || 0))}
                source="AdvisorIQ"
                span={4}
              />
              <HomeTile
                href="/advisors"
                label="AdvisorIQ retention"
                value={latest.get('iq_retention_pct')?.value == null ? '—' : `${Number(latest.get('iq_retention_pct')?.value)}%`}
                source="AdvisorIQ"
                span={4}
              />
            </>
          )}
          {linked.tickets && (
            <HomeTile
              href="/tickets"
              label="Open tickets"
              value={compactNumber(Number(latest.get('open_ticket_count')?.value || 0))}
              source="Support"
              span={4}
            />
          )}
          {linked.traffic && (
            <HomeTile
              href="/analytics/website"
              label="Sessions"
              value={compactNumber(Number(latest.get('sessions')?.value || 0))}
              source="MarketFlow"
              span={4}
            />
          )}
        </div>

        {!linked.enrollment && !linked.crm && (
          <div className="mt-8 rounded-[2rem] bg-aryx-elevated p-10 text-aryx-muted ring-1 ring-aryx-line">
            Sources are not linked for this organization. Remote maps are server-owned so tenants cannot point COS at another project. Home will not invent zeros.
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {(sources.data || []).map((source) => (
            <span key={source.key} className="rounded-full border border-aryx-line px-3 py-1 text-[10px] uppercase tracking-wider text-aryx-faint">
              {source.key} · {source.status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeTile({
  href,
  label,
  value,
  source,
  span: _span,
}: {
  href: string;
  label: string;
  value: string;
  source: string;
  span: number;
}) {
  return (
    <Link to={href} className="rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line md:col-span-4">
      <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-aryx-faint">{label}</p>
        <p className="mt-3 text-4xl font-semibold">{value}</p>
        <p className="mt-2 text-xs text-aryx-faint">{source}</p>
      </div>
    </Link>
  );
}

export default CosHome;
