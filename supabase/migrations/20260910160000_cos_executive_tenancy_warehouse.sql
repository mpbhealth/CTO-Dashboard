-- COS executive analytics: fail-closed multi-tenant identity + aggregate warehouse.
-- Remotes are read-only. This migration only changes the COS database.

set lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

alter table public.profiles
  alter column org_id drop not null;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'admin', 'viewer', 'cos'));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and role in ('owner', 'admin', 'viewer', 'cos')
  );

create table if not exists public.org_memberships (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'viewer', 'cos')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_memberships_user_idx on public.org_memberships (user_id);

create table if not exists public.aryx_identity_map (
  accounts_sub text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  aryx_org_id uuid not null references public.orgs (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cos_org_link (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  accounts_org_id uuid not null unique,
  enrollment_org_id uuid,
  crm_org_id uuid,
  advisoriq_org_id uuid,
  marketflow_team_id uuid,
  ticket_scope text not null default 'none' check (ticket_scope in ('none', 'mpb_pilot', 'mapped')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cos_org_link_set_updated_at on public.cos_org_link;
create trigger cos_org_link_set_updated_at
  before update on public.cos_org_link
  for each row execute function public.set_updated_at();

create or replace function public.member_org_ids()
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  select org_id
  from public.org_memberships
  where user_id = (select auth.uid())
$$;

create or replace function public.is_org_operator(p_org uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.org_memberships
    where user_id = (select auth.uid())
      and org_id = p_org
      and role in ('owner', 'admin', 'cos')
  )
$$;

create or replace function public.set_active_org(p_org uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_org is null then
    raise exception 'org required';
  end if;
  if not exists (
    select 1 from public.org_memberships
    where user_id = auth.uid() and org_id = p_org
  ) then
    raise exception 'not a member of this org';
  end if;
  update public.profiles
    set org_id = p_org
    where user_id = auth.uid();
  return p_org;
end;
$$;

revoke all on function public.set_active_org(uuid) from public, anon;
grant execute on function public.set_active_org(uuid) to authenticated;
grant execute on function public.member_org_ids() to authenticated;
grant execute on function public.is_org_operator(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, org_id, email, display_name, full_name, role)
  values (
    new.id,
    null,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    'viewer'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Existing operators keep the current org; they become owners.
insert into public.org_memberships (org_id, user_id, role)
select org_id, user_id, 'owner'
from public.profiles
where org_id is not null
on conflict (org_id, user_id) do nothing;

do $$
declare r record;
begin
  for r in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'org_id'
      and column_default ilike '%a0000000%'
  loop
    execute format('alter table public.%I alter column org_id drop default', r.table_name);
  end loop;
end $$;

-- MPB pilot bridge (COS org stays EnrollFlow UUID; Accounts/CRM/IQ use the other UUID).
insert into public.cos_org_link (
  org_id, accounts_org_id, enrollment_org_id, crm_org_id, advisoriq_org_id, ticket_scope, is_active
) values (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  'mpb_pilot',
  true
)
on conflict (org_id) do update set
  accounts_org_id = excluded.accounts_org_id,
  enrollment_org_id = excluded.enrollment_org_id,
  crm_org_id = excluded.crm_org_id,
  advisoriq_org_id = excluded.advisoriq_org_id,
  ticket_scope = excluded.ticket_scope,
  is_active = true;

insert into public.orgs (id, name, slug)
values ('b0000000-0000-0000-0000-000000000002', 'Isolation Probe', 'isolation-probe')
on conflict (id) do nothing;

insert into public.cos_org_link (
  org_id, accounts_org_id, ticket_scope, is_active
) values (
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  'none',
  true
)
on conflict (org_id) do nothing;

-- ---------------------------------------------------------------------------
-- Warehouse (aggregates only — no person columns)
-- ---------------------------------------------------------------------------

create table if not exists public.fact_enrollments_daily (
  org_id uuid not null references public.orgs (id) on delete cascade,
  fact_date date not null,
  product_key text not null default '',
  plan_type text not null default '',
  new_count integer not null default 0,
  inactive_count integer not null default 0,
  active_count integer not null default 0,
  mrr numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, fact_date, product_key, plan_type)
);

create table if not exists public.fact_crm_pipeline_daily (
  org_id uuid not null references public.orgs (id) on delete cascade,
  fact_date date not null,
  stage_key text not null,
  lead_count integer not null default 0,
  premium_sum numeric(14, 2) not null default 0,
  deal_count integer not null default 0,
  deal_amount numeric(14, 2) not null default 0,
  weighted_amount numeric(14, 2) not null default 0,
  won_count integer not null default 0,
  lost_count integer not null default 0,
  aging_over_7 integer not null default 0,
  activity_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, fact_date, stage_key)
);

create table if not exists public.fact_tickets_daily (
  org_id uuid not null references public.orgs (id) on delete cascade,
  fact_date date not null,
  created_count integer not null default 0,
  open_count integer not null default 0,
  resolved_count integer not null default 0,
  sla_pct numeric(6, 2),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, fact_date)
);

create table if not exists public.fact_traffic_daily (
  org_id uuid not null references public.orgs (id) on delete cascade,
  fact_date date not null,
  source text not null,
  sessions numeric(14, 2) not null default 0,
  users numeric(14, 2) not null default 0,
  pageviews numeric(14, 2) not null default 0,
  conversions numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, fact_date, source)
);

create table if not exists public.fact_pnl_period (
  org_id uuid not null references public.orgs (id) on delete cascade,
  period_start date not null,
  period_grain text not null check (period_grain in ('month', 'quarter', 'year')),
  collected numeric(14, 2) not null default 0,
  pending numeric(14, 2) not null default 0,
  failed numeric(14, 2) not null default 0,
  vendor_cost numeric(14, 2) not null default 0,
  commissions numeric(14, 2) not null default 0,
  saas_cost numeric(14, 2) not null default 0,
  gross_margin numeric(14, 2) not null default 0,
  net_operating numeric(14, 2) not null default 0,
  enrollment_count integer not null default 0,
  active_members integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, period_start, period_grain)
);

create table if not exists public.fact_vendor_costs_monthly (
  org_id uuid not null references public.orgs (id) on delete cascade,
  period_start date not null,
  product_key text not null default '',
  vendor_cost numeric(14, 2) not null default 0,
  missing_match_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, period_start, product_key)
);

create table if not exists public.advisor_scorecards (
  org_id uuid not null references public.orgs (id) on delete cascade,
  advisor_key text not null,
  active_members integer not null default 0,
  mrr numeric(14, 2) not null default 0,
  cost numeric(14, 2) not null default 0,
  net_mrr numeric(14, 2) not null default 0,
  retention_pct numeric(6, 2),
  enrollments_30 integer not null default 0,
  margin_pct numeric(6, 2),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, advisor_key)
);

create table if not exists public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  horizon_days integer not null default 90,
  assumptions jsonb not null default '{}',
  outputs jsonb not null default '{}',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Product mix from AdvisorIQ. product_key is a plan label, never a person.
create table if not exists public.fact_product_mix (
  org_id uuid not null references public.orgs (id) on delete cascade,
  product_key text not null,
  active_members integer not null default 0,
  mrr numeric(14, 2) not null default 0,
  cost numeric(14, 2) not null default 0,
  net_mrr numeric(14, 2) not null default 0,
  margin_pct numeric(6, 2),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, product_key)
);

create index if not exists fact_enrollments_daily_org_idx on public.fact_enrollments_daily (org_id, fact_date desc);
create index if not exists fact_crm_pipeline_daily_org_idx on public.fact_crm_pipeline_daily (org_id, fact_date desc);
create index if not exists fact_tickets_daily_org_idx on public.fact_tickets_daily (org_id, fact_date desc);
create index if not exists fact_traffic_daily_org_idx on public.fact_traffic_daily (org_id, fact_date desc);
create index if not exists fact_pnl_period_org_idx on public.fact_pnl_period (org_id, period_start desc);
create index if not exists forecast_runs_org_idx on public.forecast_runs (org_id, created_at desc);

insert into public.integration_sources (org_id, key, kind, project_ref, status)
values
  ('a0000000-0000-0000-0000-000000000001', 'marketflo', 'marketing', 'tzlvhpultquonblkkpqp', 'unconfigured'),
  ('a0000000-0000-0000-0000-000000000001', 'saas_internal', 'saas', null, 'healthy'),
  ('a0000000-0000-0000-0000-000000000001', 'aryx_advisoriq', 'advisoriq', 'nnvqabahcepvitzblkal', 'unconfigured')
on conflict (org_id, key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.org_memberships enable row level security;
alter table public.aryx_identity_map enable row level security;
alter table public.cos_org_link enable row level security;
alter table public.fact_enrollments_daily enable row level security;
alter table public.fact_crm_pipeline_daily enable row level security;
alter table public.fact_tickets_daily enable row level security;
alter table public.fact_traffic_daily enable row level security;
alter table public.fact_pnl_period enable row level security;
alter table public.fact_vendor_costs_monthly enable row level security;
alter table public.advisor_scorecards enable row level security;
alter table public.forecast_runs enable row level security;

drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs
  for select to authenticated
  using (id in (select public.member_org_ids()));

create policy org_memberships_select on public.org_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy aryx_identity_map_select on public.aryx_identity_map
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy cos_org_link_select on public.cos_org_link
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy cos_org_link_update on public.cos_org_link
  for update to authenticated
  using (public.is_org_operator(org_id))
  with check (public.is_org_operator(org_id));

create policy fact_enrollments_daily_select on public.fact_enrollments_daily
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy fact_crm_pipeline_daily_select on public.fact_crm_pipeline_daily
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy fact_tickets_daily_select on public.fact_tickets_daily
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy fact_traffic_daily_select on public.fact_traffic_daily
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy fact_pnl_period_select on public.fact_pnl_period
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy fact_vendor_costs_monthly_select on public.fact_vendor_costs_monthly
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy advisor_scorecards_select on public.advisor_scorecards
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy forecast_runs_select on public.forecast_runs
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create policy forecast_runs_insert on public.forecast_runs
  for insert to authenticated
  with check (public.is_org_operator(org_id) and created_by = (select auth.uid()));

drop policy if exists analytics_snapshots_select on public.analytics_snapshots;
create policy analytics_snapshots_select on public.analytics_snapshots
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

-- Snapshots are extractor-written. Authenticated users must not invent Home numbers.
drop policy if exists analytics_snapshots_write on public.analytics_snapshots;

alter table public.fact_product_mix enable row level security;
create policy fact_product_mix_select on public.fact_product_mix
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists saas_expenses_all on public.saas_expenses;
create policy saas_expenses_select on public.saas_expenses
  for select to authenticated
  using (org_id in (select public.member_org_ids()));
create policy saas_expenses_mutate on public.saas_expenses
  for all to authenticated
  using (public.is_org_operator(org_id))
  with check (public.is_org_operator(org_id));

drop policy if exists integration_sources_select on public.integration_sources;
create policy integration_sources_select on public.integration_sources
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists integration_sources_update on public.integration_sources;
create policy integration_sources_update on public.integration_sources
  for update to authenticated
  using (public.is_org_operator(org_id))
  with check (public.is_org_operator(org_id));

drop policy if exists sync_runs_select on public.sync_runs;
create policy sync_runs_select on public.sync_runs
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

create or replace function public.current_org_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select p.org_id
  from public.profiles p
  where p.user_id = (select auth.uid())
    and exists (
      select 1
      from public.org_memberships m
      where m.user_id = p.user_id
        and m.org_id = p.org_id
    )
$$;

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    new.role := old.role;
    if new.org_id is distinct from old.org_id then
      raise exception 'use set_active_org';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_identity on public.profiles;
create trigger protect_profile_identity
  before update on public.profiles
  for each row execute function public.protect_profile_identity();

grant select on public.org_memberships, public.aryx_identity_map, public.cos_org_link to authenticated;
grant select, update on public.cos_org_link to authenticated;
grant select on public.fact_enrollments_daily, public.fact_crm_pipeline_daily,
  public.fact_tickets_daily, public.fact_traffic_daily, public.fact_pnl_period,
  public.fact_vendor_costs_monthly, public.advisor_scorecards, public.fact_product_mix to authenticated;
grant select, insert on public.forecast_runs to authenticated;
