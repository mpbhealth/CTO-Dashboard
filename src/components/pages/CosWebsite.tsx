import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { compactNumber } from '@/lib/cos';
import { useOrg } from '@/contexts/OrgContext';
import { OrgPicker } from '../cos/OrgPicker';
import { Unlinked } from './CosFinance';

export function CosWebsite() {
  const { orgId, linked } = useOrg();

  const traffic = useQuery({
    queryKey: ['traffic-facts', orgId],
    enabled: Boolean(orgId) && linked.traffic,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_traffic_daily')
        .select('fact_date, source, sessions, users, pageviews, conversions')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const leads = useQuery({
    queryKey: ['pipeline-leads-funnel', orgId],
    enabled: Boolean(orgId) && linked.crm,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_crm_pipeline_daily')
        .select('fact_date, lead_count')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const enrolls = useQuery({
    queryKey: ['enroll-funnel', orgId],
    enabled: Boolean(orgId) && linked.enrollment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_enrollments_daily')
        .select('fact_date, new_count')
        .eq('org_id', orgId)
        .order('fact_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const funnel = useMemo(() => {
    const visits = (traffic.data || []).reduce((s, row) => s + Number(row.sessions), 0);
    const leadCount = (leads.data || []).reduce((s, row) => s + Number(row.lead_count), 0);
    const enrollCount = (enrolls.data || []).reduce((s, row) => s + Number(row.new_count), 0);
    return { visits, leadCount, enrollCount };
  }, [enrolls.data, leads.data, traffic.data]);

  if (!linked.traffic) {
    return <Unlinked title="Website" message="MarketFlow team is not mapped for this organization." />;
  }

  return (
    <div className="w-full bg-aryx-bg py-10 text-aryx-ink">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-aryx-faint">Analytics · MarketFlow</p>
      <h1 className="mb-6 font-display text-4xl font-semibold">Website</h1>
      <OrgPicker />
      <p className="mt-4 text-sm text-aryx-muted">Visit → lead → enroll uses same-org, same-window aggregates. No email matching.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Sessions" value={compactNumber(funnel.visits)} />
        <Stat label="CRM leads" value={linked.crm ? compactNumber(funnel.leadCount) : '—'} />
        <Stat label="New enrolls" value={linked.enrollment ? compactNumber(funnel.enrollCount) : '—'} />
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

export default CosWebsite;
