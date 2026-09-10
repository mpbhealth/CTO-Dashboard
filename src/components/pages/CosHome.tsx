import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { syncConnectors } from '@/lib/connectors';
import { money, compactNumber, periodBounds, grainForPeriod, type PeriodKey } from '@/lib/cos';
import { computeForecast, forecastSentence, preferCompleteMonth } from '@/lib/forecast';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { PeriodToggle } from '../cos/PeriodToggle';
import { CommandStat, CommandStrip } from '../cos/CommandStrip';
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
  failed: number;
  vendor_cost: number;
  commissions: number;
  saas_cost: number;
  net_operating: number;
  metadata?: {
    vendor_coverage_pct?: number;
    commissions_pending?: number;
    missing_vendor_matches?: number;
  };
}

export function CosHome() {
  const queryClient = useQueryClient();
  const { orgId, linked, rollup, memberships, isOperator } = useOrg();
  const [period, setPeriod] = useState<PeriodKey>('mtd');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const bounds = periodBounds(period, customStart, customEnd);
  const grain = grainForPeriod(period);
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
    queryKey: ['fact-pnl', orgIds.join(','), bounds.start, grain],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_pnl_period')
        .select('org_id, period_start, collected, pending, failed, vendor_cost, commissions, saas_cost, net_operating, metadata')
        .in('org_id', orgIds)
        .eq('period_grain', grain)
        .gte('period_start', bounds.start);
      if (error) throw error;
      return (data || []) as PnlRow[];
    },
  });

  const forecastFacts = useQuery({
    queryKey: ['home-forecast-inputs', orgIds.join(',')],
    enabled: orgIds.length > 0 && linked.enrollment,
    queryFn: async () => {
      const [{ data: pnlRows }, { data: enroll }, { data: pipe }] = await Promise.all([
        supabase.from('fact_pnl_period').select('period_start, collected, vendor_cost, commissions, saas_cost, active_members').in('org_id', orgIds).eq('period_grain', 'month').order('period_start', { ascending: false }).limit(4),
        supabase.from('fact_enrollments_daily').select('new_count, inactive_count, mrr').in('org_id', orgIds).order('fact_date', { ascending: false }).limit(90),
        supabase.from('fact_crm_pipeline_daily').select('weighted_amount, premium_sum, aging_over_7, metadata').in('org_id', orgIds).order('fact_date', { ascending: false }).limit(40),
      ]);
      return { pnl: pnlRows || [], enroll: enroll || [], pipe: pipe || [] };
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
      return data || [];
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
    return (pnl.data || []).reduce((acc, row) => ({
      collected: acc.collected + Number(row.collected),
      pending: acc.pending + Number(row.pending),
      failed: acc.failed + Number(row.failed),
      vendor: acc.vendor + Number(row.vendor_cost),
      commissions: acc.commissions + Number(row.commissions),
      saas: acc.saas + Number(row.saas_cost),
      net: acc.net + Number(row.net_operating),
      pendingCommissions: acc.pendingCommissions + Number(row.metadata?.commissions_pending || 0),
      coverage: Number(row.metadata?.vendor_coverage_pct ?? acc.coverage),
    }), { collected: 0, pending: 0, failed: 0, vendor: 0, commissions: 0, saas: 0, net: 0, pendingCommissions: 0, coverage: 100 });
  }, [pnl.data]);

  const forecast = useMemo(() => {
    if (!forecastFacts.data) return null;
    return computeForecast({ ...forecastFacts.data, pnl: preferCompleteMonth(forecastFacts.data.pnl) }, {
      horizonDays: 90,
      weeklyWeeks: 8,
      seasonality: 1,
      monthlyChurn: 0.03,
      winRate: 0.25,
      pessimistic: 0.7,
      optimistic: 1.25,
    });
  }, [forecastFacts.data]);

  const pipeLatest = forecastFacts.data?.pipe?.[0];
  const aging = (forecastFacts.data?.pipe || []).reduce((sum, row) => sum + Number(row.aging_over_7 || 0), 0);
  const ifClosed = Number(pipeLatest?.weighted_amount || latest.get('weighted_forecast')?.value || 0);

  const ticketSpike = useMemo(() => {
    const rows = tickets.data || [];
    if (rows.length < 8) return false;
    const today = rows[0]?.created_count || 0;
    const baseline = rows.slice(1, 8).reduce((s, row) => s + row.created_count, 0) / 7;
    return baseline > 0 && today > baseline * 1.5;
  }, [tickets.data]);

  const riskNotes = [
    ticketSpike ? 'Ticket volume is above the 7-day baseline.' : null,
    linked.enrollment && pnlSum.coverage < 90 ? `Vendor coverage is ${pnlSum.coverage}% — some active plans have no cost row.` : null,
    linked.crm && aging > 0 ? `${aging} CRM records have not moved in 7+ days.` : null,
  ].filter(Boolean) as string[];

  if (!orgId) {
    return (
      <div className="cos-page py-16 text-aryx-muted">
        No organization assigned. Ask an owner to invite you, or open ARYX CEO from Aryx Accounts.
      </div>
    );
  }

  return (
    <div className="relative w-full bg-aryx-bg py-10 text-aryx-ink md:py-16">
      <div className="cos-page w-full">
        <AryxLogo wordmark />
        <p className="mb-4 mt-6 inline-flex rounded-full border border-aryx-line bg-aryx-elevated px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-aryx-muted">
          ARYX CEO
        </p>
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Company, in one view.</h1>
            <p className="mt-4 max-w-xl text-sm text-aryx-muted">
              {forecast
                ? forecastSentence(90, forecast.pnl, money)
                : 'Read-only money, pipeline, people, and traffic. Action stays in the source apps.'}
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

        <div className="space-y-6">
          {linked.enrollment && (
            <CommandStrip
              title="Money"
              href="/finance"
              warning={pnlSum.coverage < 90 ? `Vendor coverage ${pnlSum.coverage}%` : null}
            >
              <CommandStat label="Collected" value={money(pnlSum.collected)} hint="EnrollFlow billing" />
              <CommandStat label="Pending" value={money(pnlSum.pending + pnlSum.pendingCommissions)} hint="AR + unpaid commissions" />
              <CommandStat label="Vendor" value={money(pnlSum.vendor)} />
              <CommandStat label="Commissions" value={money(pnlSum.commissions)} hint="Paid only" />
              <CommandStat label="SaaS" value={money(pnlSum.saas)} />
              <CommandStat label="Net" value={money(pnlSum.net)} hint="Collected − vendor − commissions − SaaS" />
            </CommandStrip>
          )}

          {(linked.crm || linked.enrollment) && (
            <CommandStrip title="Forward" href="/finance/forecast">
              {linked.crm && (
                <CommandStat label="If-closed base" value={money(ifClosed)} hint="Not collected · CRM" />
              )}
              {forecast && (
                <>
                  <CommandStat label="90-day net" value={money(forecast.pnl.base)} hint={`${money(forecast.pnl.pessimistic)}–${money(forecast.pnl.optimistic)}`} />
                  <Link to="/pipeline" className="text-sm text-aryx-accent md:col-span-1">Pipeline aging and stages</Link>
                </>
              )}
            </CommandStrip>
          )}

          <CommandStrip title="Risk" href="/operations/integrations" warning={riskNotes[0] || null}>
            {linked.tickets && (
              <CommandStat label="Open tickets" value={compactNumber(Number(latest.get('open_ticket_count')?.value || 0))} hint={ticketSpike ? 'Spike vs 7-day baseline' : 'Support'} />
            )}
            {linked.enrollment && (
              <CommandStat label="Vendor coverage" value={`${pnlSum.coverage}%`} hint={pnlSum.coverage < 90 ? 'Below 90%' : 'Carrier match'} />
            )}
            {linked.crm && (
              <CommandStat label="CRM aging 7d+" value={compactNumber(aging)} />
            )}
          </CommandStrip>
        </div>

        {!linked.enrollment && !linked.crm && (
          <div className="mt-8 rounded-[2rem] bg-aryx-elevated p-10 text-aryx-muted ring-1 ring-aryx-line">
            Sources are not linked for this organization. Remote maps are server-owned so tenants cannot point ARYX CEO at another project. Home will not invent zeros.
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

export default CosHome;
