import type { SupabaseClient } from 'npm:@supabase/supabase-js';
import type { CosOrgLink } from './org.ts';
import { countFiltered, restGet, restRpc, type OrgFilter } from './remote.ts';

const OPEN_TICKETS = 'in.(new,open,awaiting_customer,on_hold)';
const RESOLVED_TICKETS = 'in.(resolved,closed)';

export interface ExtractorResult {
  source: string;
  status: 'healthy' | 'skipped' | 'unconfigured' | 'error';
  metrics: Array<{ metric_key: string; value: number }>;
  error?: string;
}

function envPair(urlEnv: string, keyEnv: string): { url: string; key: string } | null {
  const url = Deno.env.get(urlEnv) ?? '';
  const key = Deno.env.get(keyEnv) ?? '';
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

function monthStart(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function upsertSnapshot(
  admin: SupabaseClient,
  orgId: string,
  source: string,
  metricKey: string,
  value: number,
  periodStart: string,
) {
  await admin.from('analytics_snapshots').upsert({
    org_id: orgId,
    source,
    metric_key: metricKey,
    period_start: periodStart,
    value,
    metadata: { auto_generated: true },
  }, { onConflict: 'org_id,source,metric_key,period_start' });
}

export async function extractEnrollment(
  admin: SupabaseClient,
  orgId: string,
  link: CosOrgLink,
): Promise<ExtractorResult> {
  if (!link.enrollment_org_id) return { source: 'aryx_enrollment', status: 'skipped', metrics: [] };
  const creds = envPair('ARYX_ENROLLMENT_URL', 'ARYX_ENROLLMENT_SERVICE_ROLE_KEY');
  if (!creds) return { source: 'aryx_enrollment', status: 'unconfigured', metrics: [] };
  const filter: OrgFilter = { column: 'organization_id', value: link.enrollment_org_id };
  const today = new Date().toISOString().slice(0, 10);
  const start = monthStart();

  const enrollments = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    'enrollments?select=id,status,monthly_cost,enrollment_date,inactive_date,product_id,plan_type,primary_is_smoker&limit=5000',
    filter,
  );
  const billing = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    `billing?select=amount,status,paid_at,due_date,billing_type&or=(paid_at.gte.${start},due_date.gte.${start})&limit=5000`,
    filter,
  );
  const commissions = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    `commissions?select=amount,status,commission_month,commission_type&commission_month=eq.${start.slice(0, 7)}&limit=5000`,
    filter,
  );
  const vendorCosts = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    'vendor_costs?select=product_id,cost,tobacco_surcharge,status&status=eq.Active&limit=5000',
    filter,
  );

  const active = enrollments.filter((row) => ['Active', 'Future Active'].includes(String(row.status)));
  const newThisMonth = enrollments.filter((row) => String(row.enrollment_date || '') >= start);
  const inactiveThisMonth = enrollments.filter((row) => String(row.inactive_date || '') >= start);
  const collected = billing.filter((row) => row.status === 'Paid').reduce((s, row) => s + Number(row.amount || 0), 0);
  const pending = billing.filter((row) => row.status === 'Pending').reduce((s, row) => s + Number(row.amount || 0), 0);
  const failed = billing.filter((row) => row.status === 'Failed').reduce((s, row) => s + Number(row.amount || 0), 0);
  const commissionSum = commissions.reduce((s, row) => s + Number(row.amount || 0), 0);
  const mrr = active.reduce((s, row) => s + Number(row.monthly_cost || 0), 0);

  const vendorByProduct = new Map<string, number>();
  for (const row of vendorCosts) {
    vendorByProduct.set(String(row.product_id), Number(row.cost || 0) + Number(row.tobacco_surcharge || 0));
  }
  let vendorCost = 0;
  let missing = 0;
  const vendorMonthly = new Map<string, { cost: number; missing: number }>();
  for (const row of active) {
    const key = String(row.product_id || '');
    const unit = vendorByProduct.get(key);
    const bucket = vendorMonthly.get(key) || { cost: 0, missing: 0 };
    if (unit == null) {
      missing += 1;
      bucket.missing += 1;
    } else {
      vendorCost += unit;
      bucket.cost += unit;
    }
    vendorMonthly.set(key, bucket);
  }

  const { data: saasRows } = await admin
    .from('saas_expenses')
    .select('amount, cadence')
    .eq('org_id', orgId);
  const saasCost = (saasRows || []).reduce((sum, row) => {
    const amount = Number(row.amount || 0);
    return sum + (row.cadence === 'yearly' ? amount / 12 : amount);
  }, 0);

  const gross = collected - vendorCost - commissionSum;
  const net = gross - saasCost;

  await admin.from('fact_pnl_period').upsert({
    org_id: orgId,
    period_start: start,
    period_grain: 'month',
    collected,
    pending,
    failed,
    vendor_cost: vendorCost,
    commissions: commissionSum,
    saas_cost: saasCost,
    gross_margin: gross,
    net_operating: net,
    enrollment_count: newThisMonth.length,
    active_members: active.length,
    metadata: { missing_vendor_matches: missing },
  }, { onConflict: 'org_id,period_start,period_grain' });

  const byDay = new Map<string, { new_count: number; inactive_count: number; product_key: string; plan_type: string; mrr: number; active_count: number }>();
  for (const row of enrollments) {
    const day = String(row.enrollment_date || today);
    const key = `${day}|${row.product_id || ''}|${row.plan_type || ''}`;
    const cur = byDay.get(key) || {
      new_count: 0,
      inactive_count: 0,
      product_key: String(row.product_id || ''),
      plan_type: String(row.plan_type || ''),
      mrr: 0,
      active_count: 0,
    };
    if (String(row.enrollment_date || '') === day) cur.new_count += 1;
    if (String(row.inactive_date || '') === day) cur.inactive_count += 1;
    if (['Active', 'Future Active'].includes(String(row.status))) {
      cur.active_count += 1;
      cur.mrr += Number(row.monthly_cost || 0);
    }
    byDay.set(key, cur);
  }
  for (const [key, row] of byDay) {
    const factDate = key.split('|')[0];
    await admin.from('fact_enrollments_daily').upsert({
      org_id: orgId,
      fact_date: factDate,
      product_key: row.product_key,
      plan_type: row.plan_type,
      new_count: row.new_count,
      inactive_count: row.inactive_count,
      active_count: row.active_count,
      mrr: row.mrr,
      metadata: {},
    }, { onConflict: 'org_id,fact_date,product_key,plan_type' });
  }

  for (const [productKey, bucket] of vendorMonthly) {
    await admin.from('fact_vendor_costs_monthly').upsert({
      org_id: orgId,
      period_start: start,
      product_key: productKey,
      vendor_cost: bucket.cost,
      missing_match_count: bucket.missing,
      metadata: {},
    }, { onConflict: 'org_id,period_start,product_key' });
  }

  const metrics = [
    { metric_key: 'enrollment_count', value: enrollments.length },
    { metric_key: 'member_count', value: active.length },
    { metric_key: 'collected_revenue', value: collected },
    { metric_key: 'pending_ar', value: pending },
    { metric_key: 'vendor_cost', value: vendorCost },
    { metric_key: 'commissions', value: commissionSum },
    { metric_key: 'gross_margin', value: gross },
    { metric_key: 'mrr', value: mrr },
  ];
  for (const metric of metrics) {
    await upsertSnapshot(admin, orgId, 'aryx_enrollment', metric.metric_key, metric.value, today);
  }
  return { source: 'aryx_enrollment', status: 'healthy', metrics };
}

export async function extractCrm(
  admin: SupabaseClient,
  orgId: string,
  link: CosOrgLink,
): Promise<ExtractorResult> {
  if (!link.crm_org_id) return { source: 'aryx_crm', status: 'skipped', metrics: [] };
  const creds = envPair('ARYX_CRM_URL', 'ARYX_CRM_SERVICE_ROLE_KEY');
  if (!creds) return { source: 'aryx_crm', status: 'unconfigured', metrics: [] };
  const filter: OrgFilter = { column: 'org_id', value: link.crm_org_id };
  const today = new Date().toISOString().slice(0, 10);

  let breakdown: Array<Record<string, unknown>> = [];
  try {
    breakdown = await restRpc<Array<Record<string, unknown>>>(
      creds.url,
      creds.key,
      'crm_pipeline_breakdown',
      { p_org_id: link.crm_org_id },
      'p_org_id',
      link.crm_org_id,
    );
  } catch {
    breakdown = [];
  }

  const leads = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    'lead_submissions?select=id,pipeline_stage,premium_amount,updated_at,created_at&limit=5000',
    filter,
  );
  const deals = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    'crm_deals?select=id,amount,probability,expected_close_date,won_at,lost_at,stage_id&limit=5000',
    filter,
  );
  let activities = 0;
  try {
    activities = await countFiltered(creds.url, creds.key, 'crm_activities', filter);
  } catch {
    activities = 0;
  }

  const byStage = new Map<string, { lead_count: number; premium_sum: number; aging: number }>();
  const weekAgo = daysAgo(7);
  for (const row of leads) {
    const stage = String(row.pipeline_stage || 'unknown');
    const cur = byStage.get(stage) || { lead_count: 0, premium_sum: 0, aging: 0 };
    cur.lead_count += 1;
    cur.premium_sum += Number(row.premium_amount || 0);
    if (String(row.updated_at || '').slice(0, 10) < weekAgo) cur.aging += 1;
    byStage.set(stage, cur);
  }

  const openDeals = deals.filter((row) => !row.won_at && !row.lost_at);
  const dealAmount = openDeals.reduce((s, row) => s + Number(row.amount || 0), 0);
  const weighted = openDeals.reduce((s, row) => s + Number(row.amount || 0) * Number(row.probability || 0) / 100, 0);
  const won = deals.filter((row) => row.won_at).length;
  const lost = deals.filter((row) => row.lost_at).length;

  if (byStage.size === 0 && breakdown.length > 0) {
    for (const row of breakdown) {
      const stage = String(row.name || row.stage || row.display_name || 'unknown');
      byStage.set(stage, {
        lead_count: Number(row.lead_count || row.count || 0),
        premium_sum: Number(row.premium_sum || 0),
        aging: 0,
      });
    }
  }

  for (const [stage, row] of byStage) {
    await admin.from('fact_crm_pipeline_daily').upsert({
      org_id: orgId,
      fact_date: today,
      stage_key: stage,
      lead_count: row.lead_count,
      premium_sum: row.premium_sum,
      deal_count: openDeals.length,
      deal_amount: dealAmount,
      weighted_amount: weighted,
      won_count: won,
      lost_count: lost,
      aging_over_7: row.aging,
      activity_count: activities,
      metadata: {},
    }, { onConflict: 'org_id,fact_date,stage_key' });
  }

  const metrics = [
    { metric_key: 'crm_lead_count', value: leads.length },
    { metric_key: 'crm_contact_count', value: await countFiltered(creds.url, creds.key, 'crm_contacts', filter).catch(() => 0) },
    { metric_key: 'crm_activity_count', value: activities },
    { metric_key: 'pipeline_amount', value: dealAmount },
    { metric_key: 'weighted_forecast', value: weighted },
  ];
  for (const metric of metrics) {
    await upsertSnapshot(admin, orgId, 'aryx_crm', metric.metric_key, metric.value, today);
  }
  return { source: 'aryx_crm', status: 'healthy', metrics };
}

export async function extractAdvisorIq(
  admin: SupabaseClient,
  orgId: string,
  link: CosOrgLink,
): Promise<ExtractorResult> {
  if (!link.advisoriq_org_id) return { source: 'aryx_advisoriq', status: 'skipped', metrics: [] };
  const creds = envPair('ARYX_ADVISORIQ_URL', 'ARYX_ADVISORIQ_SERVICE_ROLE_KEY');
  if (!creds) return { source: 'aryx_advisoriq', status: 'unconfigured', metrics: [] };
  const filter: OrgFilter = { column: 'org_id', value: link.advisoriq_org_id };
  const today = new Date().toISOString().slice(0, 10);

  const stats = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    'stats_overview?select=active_members,mrr,cost,net_mrr,retention_pct,enrollments_30&limit=1',
    filter,
  );
  const intel = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    'advisor_intel?select=advisor_id,active_members,mrr,cost,net_mrr,retention_pct,enrollments_30,margin_pct&limit=500',
    filter,
  );
  let mix: Array<Record<string, unknown>> = [];
  try {
    mix = await restGet<Array<Record<string, unknown>>>(
      creds.url,
      creds.key,
      'product_margin?select=product_label,active_members,mrr,cost,net_mrr&limit=200',
      filter,
    );
  } catch {
    mix = await restGet<Array<Record<string, unknown>>>(
      creds.url,
      creds.key,
      'product_mix?select=product_label,active_members,mrr&limit=200',
      filter,
    ).catch(() => []);
  }

  const overview = stats[0] || {};
  for (const row of intel) {
    const key = String(row.advisor_id || 'unknown');
    await admin.from('advisor_scorecards').upsert({
      org_id: orgId,
      advisor_key: key,
      active_members: Number(row.active_members || 0),
      mrr: Number(row.mrr || 0),
      cost: Number(row.cost || 0),
      net_mrr: Number(row.net_mrr || 0),
      retention_pct: row.retention_pct == null ? null : Number(row.retention_pct),
      enrollments_30: Number(row.enrollments_30 || 0),
      margin_pct: row.margin_pct == null ? null : Number(row.margin_pct),
      metadata: {},
    }, { onConflict: 'org_id,advisor_key' });
  }
  for (const row of mix) {
    const productKey = String(row.product_label || 'unknown');
    const mrr = Number(row.mrr || 0);
    const cost = Number(row.cost || 0);
    const net = row.net_mrr == null ? mrr - cost : Number(row.net_mrr);
    await admin.from('fact_product_mix').upsert({
      org_id: orgId,
      product_key: productKey,
      active_members: Number(row.active_members || 0),
      mrr,
      cost,
      net_mrr: net,
      margin_pct: mrr === 0 ? null : Number(((net / mrr) * 100).toFixed(2)),
      metadata: {},
    }, { onConflict: 'org_id,product_key' });
  }

  const metrics = [
    { metric_key: 'iq_active_members', value: Number(overview.active_members || 0) },
    { metric_key: 'iq_mrr', value: Number(overview.mrr || 0) },
    { metric_key: 'iq_net_mrr', value: Number(overview.net_mrr || 0) },
    { metric_key: 'iq_retention_pct', value: Number(overview.retention_pct || 0) },
  ];
  for (const metric of metrics) {
    await upsertSnapshot(admin, orgId, 'aryx_advisoriq', metric.metric_key, metric.value, today);
  }
  return { source: 'aryx_advisoriq', status: 'healthy', metrics };
}

const MPB_COS_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

export async function extractTickets(
  admin: SupabaseClient,
  orgId: string,
  link: CosOrgLink,
): Promise<ExtractorResult> {
  if (link.ticket_scope === 'none') return { source: 'it_ticketing', status: 'skipped', metrics: [] };
  const creds = envPair('IT_TICKETING_URL', 'IT_TICKETING_SERVICE_ROLE_KEY');
  if (!creds) return { source: 'it_ticketing', status: 'unconfigured', metrics: [] };
  if (link.ticket_scope !== 'mpb_pilot' || orgId !== MPB_COS_ORG_ID) {
    return { source: 'it_ticketing', status: 'skipped', metrics: [], error: 'ticket_scope_unmapped' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const openRes = await fetch(`${creds.url}/rest/v1/tickets?select=id&status=${OPEN_TICKETS}&limit=1`, {
    method: 'GET',
    headers: { apikey: creds.key, Authorization: `Bearer ${creds.key}`, Prefer: 'count=exact' },
  });
  const resolvedRes = await fetch(`${creds.url}/rest/v1/tickets?select=id&status=${RESOLVED_TICKETS}&limit=1`, {
    method: 'GET',
    headers: { apikey: creds.key, Authorization: `Bearer ${creds.key}`, Prefer: 'count=exact' },
  });
  if (!openRes.ok || !resolvedRes.ok) throw new Error('ticket_count_failed');
  const open = Number((openRes.headers.get('content-range') || '0-0/0').split('/')[1] || 0);
  const resolved = Number((resolvedRes.headers.get('content-range') || '0-0/0').split('/')[1] || 0);

  const createdTodayRes = await fetch(`${creds.url}/rest/v1/tickets?select=id&created_at=gte.${today}T00:00:00Z&limit=1`, {
    method: 'GET',
    headers: { apikey: creds.key, Authorization: `Bearer ${creds.key}`, Prefer: 'count=exact' },
  });
  const created = Number((createdTodayRes.headers.get('content-range') || '0-0/0').split('/')[1] || 0);

  let slaPct: number | null = null;
  try {
    const sla = await restRpc<Array<Record<string, unknown>>>(
      creds.url,
      creds.key,
      'get_sla_compliance_percentage',
      { start_date: monthStart(), end_date: today },
      'start_date',
      monthStart(),
    );
    slaPct = Number(sla[0]?.overall_percentage ?? sla[0]?.resolution_percentage ?? null);
  } catch {
    slaPct = null;
  }

  await admin.from('fact_tickets_daily').upsert({
    org_id: orgId,
    fact_date: today,
    created_count: created,
    open_count: open,
    resolved_count: resolved,
    sla_pct: slaPct,
    metadata: { scope: 'mpb_pilot' },
  }, { onConflict: 'org_id,fact_date' });

  const metrics = [
    { metric_key: 'open_ticket_count', value: open },
    { metric_key: 'resolved_ticket_count', value: resolved },
  ];
  for (const metric of metrics) {
    await upsertSnapshot(admin, orgId, 'it_ticketing', metric.metric_key, metric.value, today);
  }
  return { source: 'it_ticketing', status: 'healthy', metrics };
}

export async function extractTraffic(
  admin: SupabaseClient,
  orgId: string,
  link: CosOrgLink,
): Promise<ExtractorResult> {
  if (!link.marketflow_team_id) return { source: 'marketflo', status: 'skipped', metrics: [] };
  const creds = envPair('MARKETING_SUITE_URL', 'MARKETING_SUITE_SERVICE_ROLE_KEY');
  if (!creds) return { source: 'marketflo', status: 'unconfigured', metrics: [] };
  const filter: OrgFilter = { column: 'team_id', value: link.marketflow_team_id };
  const today = new Date().toISOString().slice(0, 10);
  const since = daysAgo(30);

  // analytics_metrics is not team-scoped. kpi_metrics already has team_id.
  const rows = await restGet<Array<Record<string, unknown>>>(
    creds.url,
    creds.key,
    `kpi_metrics?select=date,traffic,leads,new_members&date=gte.${since}&limit=5000`,
    filter,
  );

  const byDay = new Map<string, { sessions: number; users: number; pageviews: number; conversions: number }>();
  for (const row of rows) {
    const day = String(row.date || today).slice(0, 10);
    const cur = byDay.get(day) || { sessions: 0, users: 0, pageviews: 0, conversions: 0 };
    cur.sessions += Number(row.traffic || 0);
    cur.conversions += Number(row.leads || 0);
    cur.users += Number(row.new_members || 0);
    byDay.set(day, cur);
  }

  let sessionSum = 0;
  for (const [day, row] of byDay) {
    sessionSum += row.sessions;
    await admin.from('fact_traffic_daily').upsert({
      org_id: orgId,
      fact_date: day,
      source: 'ga4',
      sessions: row.sessions,
      users: row.users,
      pageviews: row.pageviews,
      conversions: row.conversions,
      metadata: {},
    }, { onConflict: 'org_id,fact_date,source' });
  }

  await upsertSnapshot(admin, orgId, 'marketflo', 'sessions', sessionSum, today);
  return { source: 'marketflo', status: 'healthy', metrics: [{ metric_key: 'sessions', value: sessionSum }] };
}

export async function extractSaas(admin: SupabaseClient, orgId: string): Promise<ExtractorResult> {
  const { data } = await admin.from('saas_expenses').select('amount, cadence').eq('org_id', orgId);
  const monthly = (data || []).reduce((sum, row) => {
    const amount = Number(row.amount || 0);
    return sum + (row.cadence === 'yearly' ? amount / 12 : amount);
  }, 0);
  const today = new Date().toISOString().slice(0, 10);
  await upsertSnapshot(admin, orgId, 'saas_internal', 'saas_monthly', monthly, today);
  return { source: 'saas_internal', status: 'healthy', metrics: [{ metric_key: 'saas_monthly', value: monthly }] };
}

export async function extractMemberApp(
  admin: SupabaseClient,
  orgId: string,
  link: CosOrgLink,
): Promise<ExtractorResult> {
  if (!link.enrollment_org_id) return { source: 'mpb_member', status: 'skipped', metrics: [] };
  const creds = envPair('MPB_MEMBER_URL', 'MPB_MEMBER_SERVICE_ROLE_KEY');
  if (!creds) return { source: 'mpb_member', status: 'unconfigured', metrics: [] };
  const filter: OrgFilter = { column: 'organization_id', value: link.enrollment_org_id };
  let count = 0;
  try {
    count = await countFiltered(creds.url, creds.key, 'members', filter);
  } catch {
    return { source: 'mpb_member', status: 'skipped', metrics: [], error: 'member_org_filter_unavailable' };
  }
  const today = new Date().toISOString().slice(0, 10);
  await upsertSnapshot(admin, orgId, 'mpb_member', 'member_app_count', count, today);
  return { source: 'mpb_member', status: 'healthy', metrics: [{ metric_key: 'member_app_count', value: count }] };
}
