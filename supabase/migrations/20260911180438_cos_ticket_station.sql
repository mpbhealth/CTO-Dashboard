-- ITSTS support facts for the CEO tickets station and analytics desk.
-- fact_* stay aggregates. book_tickets may hold title + agent display_name only.
-- Remotes stay GET-only. This migration only changes the COS database.

set lock_timeout = '5s';

alter table public.fact_tickets_daily
  add column if not exists pending_count integer not null default 0,
  add column if not exists breached_count integer not null default 0,
  add column if not exists unassigned_count integer not null default 0,
  add column if not exists first_response_pct numeric(6, 2),
  add column if not exists resolution_pct numeric(6, 2);

create table if not exists public.fact_ticket_mix (
  org_id uuid not null references public.orgs (id) on delete cascade,
  kind text not null check (kind in ('status', 'priority', 'category')),
  item_key text not null,
  item_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, kind, item_key)
);

create table if not exists public.fact_ticket_aging (
  org_id uuid not null references public.orgs (id) on delete cascade,
  bucket text not null,
  tickets integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, bucket)
);

create table if not exists public.fact_ticket_agents (
  org_id uuid not null references public.orgs (id) on delete cascade,
  agent_key text not null,
  display_name text,
  open_count integer not null default 0,
  resolved_30 integer not null default 0,
  breached_count integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, agent_key)
);

create table if not exists public.book_tickets (
  org_id uuid not null references public.orgs (id) on delete cascade,
  ticket_key text not null,
  ticket_number integer,
  title text,
  status text,
  priority text,
  category text,
  agent_label text,
  created_at timestamptz,
  sla_due_at timestamptz,
  href text,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (org_id, ticket_key)
);

create index if not exists fact_ticket_mix_org_idx on public.fact_ticket_mix (org_id, kind);
create index if not exists fact_ticket_aging_org_idx on public.fact_ticket_aging (org_id);
create index if not exists fact_ticket_agents_org_idx on public.fact_ticket_agents (org_id, open_count desc);
create index if not exists book_tickets_org_idx on public.book_tickets (org_id, created_at desc);

alter table public.fact_ticket_mix enable row level security;
alter table public.fact_ticket_aging enable row level security;
alter table public.fact_ticket_agents enable row level security;
alter table public.book_tickets enable row level security;

drop policy if exists fact_ticket_mix_select on public.fact_ticket_mix;
create policy fact_ticket_mix_select on public.fact_ticket_mix
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists fact_ticket_aging_select on public.fact_ticket_aging;
create policy fact_ticket_aging_select on public.fact_ticket_aging
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists fact_ticket_agents_select on public.fact_ticket_agents;
create policy fact_ticket_agents_select on public.fact_ticket_agents
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

drop policy if exists book_tickets_select on public.book_tickets;
create policy book_tickets_select on public.book_tickets
  for select to authenticated
  using (org_id in (select public.member_org_ids()));

revoke all on
  public.fact_ticket_mix,
  public.fact_ticket_aging,
  public.fact_ticket_agents,
  public.book_tickets
  from anon, public;

revoke insert, update, delete on
  public.fact_ticket_mix,
  public.fact_ticket_aging,
  public.fact_ticket_agents,
  public.book_tickets
  from authenticated;

grant select on
  public.fact_ticket_mix,
  public.fact_ticket_aging,
  public.fact_ticket_agents,
  public.book_tickets
  to authenticated;
