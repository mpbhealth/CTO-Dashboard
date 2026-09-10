import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { money, compactNumber } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';
import { computeForecast, type ForecastAssumptions } from '@/lib/forecast';

export function CosForecast() {
  const { orgId, linked, isOperator } = useOrg();
  const queryClient = useQueryClient();
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>({
    horizonDays: 90,
    weeklyWeeks: 8,
    seasonality: 1,
    monthlyChurn: 0.03,
    winRate: 0.25,
    pessimistic: 0.7,
    optimistic: 1.25,
  });

  const facts = useQuery({
    queryKey: ['forecast-inputs', orgId],
    enabled: Boolean(orgId) && linked.enrollment,
    queryFn: async () => {
      const [{ data: pnl }, { data: enroll }, { data: pipe }] = await Promise.all([
        supabase.from('fact_pnl_period').select('collected, vendor_cost, commissions, saas_cost, active_members').eq('org_id', orgId).eq('period_grain', 'month').order('period_start', { ascending: false }).limit(4),
        supabase.from('fact_enrollments_daily').select('new_count, inactive_count, mrr, fact_date').eq('org_id', orgId).order('fact_date', { ascending: false }).limit(90),
        supabase.from('fact_crm_pipeline_daily').select('weighted_amount, premium_sum, fact_date').eq('org_id', orgId).order('fact_date', { ascending: false }).limit(30),
      ]);
      return { pnl: pnl || [], enroll: enroll || [], pipe: pipe || [] };
    },
  });

  const lastRun = useQuery({
    queryKey: ['forecast-runs', orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forecast_runs')
        .select('assumptions, outputs, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const computed = useMemo(() => {
    if (!facts.data) return null;
    return computeForecast(facts.data, assumptions);
  }, [facts.data, assumptions]);

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId || !computed) return;
      const { error } = await supabase.from('forecast_runs').insert({
        org_id: orgId,
        horizon_days: assumptions.horizonDays,
        assumptions,
        outputs: computed,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forecast-runs'] }),
  });

  if (!linked.enrollment) {
    return <Unlinked title="Forecasts" message="EnrollFlow must be linked before forecasts can run." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Finance</p>
      <h1 className="mb-2 font-display text-4xl font-semibold">Forecasts</h1>
      <p className="mb-6 max-w-2xl text-sm text-aryx-muted">
        Trailing run-rate × seasonality ± CRM weighted pipeline. Not a guarantee. Confidence band is the pessimistic-to-optimistic spread.
      </p>
      <OrgPicker />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-xs text-aryx-muted">Horizon days
          <input type="number" className="mt-1 w-full rounded-xl border border-aryx-line bg-aryx-elevated px-3 py-2 text-aryx-ink" value={assumptions.horizonDays} onChange={(e) => setAssumptions({ ...assumptions, horizonDays: Number(e.target.value) })} />
        </label>
        <label className="text-xs text-aryx-muted">Seasonality
          <input type="number" step="0.05" className="mt-1 w-full rounded-xl border border-aryx-line bg-aryx-elevated px-3 py-2 text-aryx-ink" value={assumptions.seasonality} onChange={(e) => setAssumptions({ ...assumptions, seasonality: Number(e.target.value) })} />
        </label>
        <label className="text-xs text-aryx-muted">Monthly churn
          <input type="number" step="0.01" className="mt-1 w-full rounded-xl border border-aryx-line bg-aryx-elevated px-3 py-2 text-aryx-ink" value={assumptions.monthlyChurn} onChange={(e) => setAssumptions({ ...assumptions, monthlyChurn: Number(e.target.value) })} />
        </label>
        <label className="text-xs text-aryx-muted">Win rate
          <input type="number" step="0.01" className="mt-1 w-full rounded-xl border border-aryx-line bg-aryx-elevated px-3 py-2 text-aryx-ink" value={assumptions.winRate} onChange={(e) => setAssumptions({ ...assumptions, winRate: Number(e.target.value) })} />
        </label>
      </div>
      {computed && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat label="Members (base)" value={compactNumber(computed.members.base)} />
          <Stat label="Revenue (base)" value={money(computed.revenue.base)} />
          <Stat label="Net P&L (base)" value={money(computed.pnl.base)} />
          <Stat label="Pessimistic revenue" value={money(computed.revenue.pessimistic)} />
          <Stat label="Optimistic revenue" value={money(computed.revenue.optimistic)} />
          <Stat label="Vendor outlay" value={money(computed.vendor.base)} />
        </div>
      )}
      <p className="mt-4 text-xs text-aryx-faint">
        Last calibration: {lastRun.data?.created_at ? new Date(lastRun.data.created_at).toLocaleString() : 'not saved'}
      </p>
      {isOperator && (
        <button type="button" onClick={() => save.mutate()} className="mt-6 rounded-full bg-aryx-accent px-5 py-2 text-sm text-white">
          Save run
        </button>
      )}
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

export default CosForecast;
