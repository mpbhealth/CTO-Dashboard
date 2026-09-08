-- COS-owned work and slim HIPAA program tables.
-- org_id defaults to Aryx so existing client inserts that omit it still land in-tenant.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  owner_user_id uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  title text,
  content text not null default '',
  category text,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_shared boolean not null default false,
  is_collaborative boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_org_updated_idx on public.notes (org_id, updated_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  owner_user_id uuid references auth.users (id) on delete set null,
  title text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_org_status_idx on public.tasks (org_id, status, due_at);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  owner_user_id uuid references auth.users (id) on delete set null,
  title text,
  storage_key text not null,
  bucket text not null default 'cos-files',
  mime text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index files_org_idx on public.files (org_id, created_at desc);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  name text not null,
  description text,
  status text not null default 'planning',
  priority text not null default 'medium',
  owner text,
  team_members text[],
  start_date date,
  target_date date,
  completed_date date,
  budget numeric,
  progress numeric,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_org_idx on public.projects (org_id, updated_at desc);

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  title text not null,
  description text,
  status text not null default 'planned',
  priority text not null default 'medium',
  category text,
  start_date date,
  target_date date,
  completed_date date,
  assigned_to text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roadmap_items_org_idx on public.roadmap_items (org_id, target_date);

create table public.tech_stack (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  name text not null,
  category text,
  version text,
  owner text,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quick_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  title text not null,
  url text not null,
  category text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  name text not null,
  category text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saas_expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  vendor_id uuid references public.vendors (id) on delete set null,
  name text not null,
  amount numeric,
  currency text not null default 'USD',
  cadence text,
  renewal_date date,
  owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hipaa_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  title text not null,
  status text not null default 'draft',
  version text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hipaa_baas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  vendor_name text not null,
  status text not null default 'pending',
  executed_on date,
  expires_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hipaa_incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  title text not null,
  severity text,
  status text not null default 'open',
  discovered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hipaa_trainings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  title text not null,
  completed_at timestamptz,
  attendee_count integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hipaa_audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  actor_id uuid,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index hipaa_audit_log_org_idx on public.hipaa_audit_log (org_id, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'notes','tasks','files','projects','roadmap_items','tech_stack','quick_links',
    'vendors','saas_expenses','hipaa_policies','hipaa_baas','hipaa_incidents','hipaa_trainings'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;
