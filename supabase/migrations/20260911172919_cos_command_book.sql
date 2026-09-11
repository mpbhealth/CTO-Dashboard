-- AdvisorIQ Command facts for the CEO desk.
-- fact_* stay aggregates. book_* may hold display_name only (no email/phone/address).
-- Remotes stay GET-only. This migration only changes the COS database.

set lock_timeout = '5s';

alter table public.advisor_scorecards
  add column if not exists display_name text,
  add column if not exists terminating_members integer not null default 0,
  add column if not exists term_soon_90 integer not null default 0,
  add column if not exists on_hold_members integer not null default 0,
  add column if not exists enrollments_90 integer not null default 0,
  add column if not exists mrr_added_90 numeric(14, 2) not null default 0;

create table if not exists public.fact_iq_mrr_monthly (
  org_id uuid not null references public.orgs (id) on delete cascade,
  month date not null,
  enrollments integer not null default 0,
  terminations integer not null default 0,
  mrr_added numeric(14, 2) not null default 0,
  mrr_lost numeric(14, 2) not null default 0,
  net_mrr_change numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, month)
);

create table if not exists public.fact_iq_forward_risk (
  org_id uuid not null references public.orgs (id) on delete cascade,
  bucket text not null,
  members integer not null default 0,
  mrr_at_risk numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, bucket)
);

create table if not exists public.fact_iq_reason_mix (
  org_id uuid not null references public.orgs (id) on delete cascade,
  kind text not null check (kind in ('churn', 'hold')),
  reason text not null,
  item_count integer not null default 0,
  mrr numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, kind, reason)
);

create table if not exists public.fact_iq_cohorts (
  org_id uuid not null references public.orgs (id) on delete cascade,
  cohort_month date not null,
  cohort_size integer not null default 0,
  retained integer not null default 0,
  retention_pct numeric(6, 2),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, cohort_month)
);

create table if not exists public.book_billing_risk (
  org_id uuid not null references public.orgs (id) on delete cascade,
  member_key text not null,
  display_name text,
  advisor_key text,
  advisor_label text,
  product_key text not null default '',
  monthly_fee numeric(14, 2) not null default 0,
  next_billing_date date,
  paid boolean,
  last_payment numeric(14, 2),
  risk_flag text,
  status text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, member_key, product_key)
);

create table if not exists public.book_actions (
  org_id uuid not null references public.orgs (id) on delete cascade,
  action_key text not null,
  kind text,
  title text,
  dollars numeric(14, 2),
  advisor_key text,
  href text,
  status text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, action_key)
);

create index if not exists fact_iq_mrr_monthly_org_idx on public.fact_iq_mrr_monthly (org_id, month desc);
create index if not exists fact_iq_forward_risk_org_idx on public.fact_iq_forward_risk (org_id);
create index if not exists fact_iq_reason_mix_org_idx on public.fact_iq_reason_mix (org_id, kind);
create index if not exists fact_iq_cohorts_org_idx on public.fact_iq_cohorts (org_id, cohort_month desc);
create index if not exists book_billing_risk_org_idx on public.book_billing_risk (org_id, next_billing_date);
create index if not exists book_actions_org_idx on public.book_actions (org_id, kind);

alter table public.fact_iq_mrr_monthly enable row level security;
alter table public.fact_iq_forward_risk enable row level security;
alter table public.fact_iq_reason_mix enable row level security;
alter table public.fact_iq_cohorts enable row level security;
alter table public.book_billing_risk enable row level security;
alter table public.book_actions enable row level security;

drop policy if exists fact_iq_mrr_monthly_select on public.fact_iq_mrr_monthly;
create policy fact_iq_mrr_monthly_select on public.fact_iq_mrr_monthly
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists fact_iq_forward_risk_select on public.fact_iq_forward_risk;
create policy fact_iq_forward_risk_select on public.fact_iq_forward_risk
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists fact_iq_reason_mix_select on public.fact_iq_reason_mix;
create policy fact_iq_reason_mix_select on public.fact_iq_reason_mix
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists fact_iq_cohorts_select on public.fact_iq_cohorts;
create policy fact_iq_cohorts_select on public.fact_iq_cohorts
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists book_billing_risk_select on public.book_billing_risk;
create policy book_billing_risk_select on public.book_billing_risk
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists book_actions_select on public.book_actions;
create policy book_actions_select on public.book_actions
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

revoke all on
  public.fact_iq_mrr_monthly,
  public.fact_iq_forward_risk,
  public.fact_iq_reason_mix,
  public.fact_iq_cohorts,
  public.book_billing_risk,
  public.book_actions
  from anon, public;

revoke insert, update, delete on
  public.fact_iq_mrr_monthly,
  public.fact_iq_forward_risk,
  public.fact_iq_reason_mix,
  public.fact_iq_cohorts,
  public.book_billing_risk,
  public.book_actions
  from authenticated;

grant select on
  public.fact_iq_mrr_monthly,
  public.fact_iq_forward_risk,
  public.fact_iq_reason_mix,
  public.fact_iq_cohorts,
  public.book_billing_risk,
  public.book_actions
  to authenticated;
