-- Company ops tables for Files/Assignments/Policy/Organization/Deployments.
-- These are COS-owned, org-scoped, and not HIPAA program tables.

alter table public.tasks
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists tasks_org_project_idx on public.tasks (org_id, project_id);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  name text not null,
  description text,
  code text,
  parent_department_id uuid references public.departments (id) on delete set null,
  department_lead_id uuid,
  budget_allocated numeric,
  headcount integer,
  location text,
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_org_idx on public.departments (org_id, name);

create table if not exists public.employee_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  employee_id text,
  title text,
  primary_department_id uuid references public.departments (id) on delete set null,
  reports_to_id uuid references public.employee_profiles (id) on delete set null,
  employment_status text not null default 'active',
  employment_type text,
  location text,
  start_date date,
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_profiles_org_idx on public.employee_profiles (org_id, last_name, first_name);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  title text not null,
  body text,
  status text not null default 'draft',
  version text,
  document_type text,
  department_id uuid references public.departments (id) on delete set null,
  tags text[] not null default '{}',
  review_date date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists policies_org_idx on public.policies (org_id, updated_at desc);

create table if not exists public.deployment_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  project text not null,
  env text not null default 'Production',
  status text not null default 'In Progress',
  log text,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists deployment_logs_org_idx on public.deployment_logs (org_id, timestamp desc);

do $$
declare
  t text;
begin
  foreach t in array array['departments', 'employee_profiles', 'policies']
  loop
    execute format(
      'drop trigger if exists %I_set_updated_at on public.%I',
      t, t
    );
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

alter table public.departments enable row level security;
alter table public.employee_profiles enable row level security;
alter table public.policies enable row level security;
alter table public.deployment_logs enable row level security;

drop policy if exists departments_all on public.departments;
create policy departments_all on public.departments
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

drop policy if exists employee_profiles_all on public.employee_profiles;
create policy employee_profiles_all on public.employee_profiles
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

drop policy if exists policies_all on public.policies;
create policy policies_all on public.policies
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

drop policy if exists deployment_logs_all on public.deployment_logs;
create policy deployment_logs_all on public.deployment_logs
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.employee_profiles to authenticated;
grant select, insert, update, delete on public.policies to authenticated;
grant select, insert, update, delete on public.deployment_logs to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.files to authenticated;
