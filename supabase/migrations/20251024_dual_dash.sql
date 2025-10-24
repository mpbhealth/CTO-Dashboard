-- Organizations
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  display_name text,
  role text check (role in ('cto','ceo','admin','staff')) not null,
  created_at timestamptz default now()
);

-- Workspaces
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  kind text check (kind in ('CTO','CEO','SHARED')) not null,
  owner_profile_id uuid references profiles(id),
  created_at timestamptz default now(),
  unique (org_id, kind)
);

-- Resources
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type text check (type in ('file','doc','kpi','campaign','note','task','dashboard')) not null,
  title text,
  meta jsonb default '{}'::jsonb,
  visibility text check (visibility in ('private','shared_to_cto','shared_to_ceo','org_public')) not null default 'private',
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

-- ACL
create table if not exists resource_acl (
  id bigserial primary key,
  resource_id uuid not null references resources(id) on delete cascade,
  grantee_profile_id uuid not null references profiles(id) on delete cascade,
  can_read boolean not null default true,
  can_write boolean not null default false,
  unique(resource_id, grantee_profile_id)
);

-- Files
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  storage_key text not null,
  size_bytes bigint,
  mime text,
  created_at timestamptz default now()
);

-- Audit
create table if not exists audit_logs (
  id bigserial primary key,
  org_id uuid not null references orgs(id) on delete cascade,
  actor_profile_id uuid references profiles(id),
  action text not null,
  resource_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table resources enable row level security;
alter table resource_acl enable row level security;
alter table files enable row level security;
alter table audit_logs enable row level security;

create or replace view me as
  select p.* from profiles p where p.id = auth.uid();

drop policy if exists "profiles self or admin" on profiles;
create policy "profiles self or admin"
on profiles for select using (
  id = auth.uid()
  or exists (select 1 from profiles me where me.id = auth.uid() and me.role = 'admin' and me.org_id = profiles.org_id)
);

drop policy if exists "workspaces same org" on workspaces;
create policy "workspaces same org"
on workspaces for select using (
  exists (select 1 from profiles me where me.id = auth.uid() and me.org_id = workspaces.org_id)
);

drop policy if exists "resources readable by visibility" on resources;
create policy "resources readable by visibility"
on resources for select using (
  exists (select 1 from profiles me where me.id = auth.uid() and me.org_id = resources.org_id)
  and (
    created_by = auth.uid()
    or visibility = 'org_public'
    or (visibility = 'shared_to_cto' and exists (select 1 from profiles me where me.id = auth.uid() and me.role in ('cto','admin')))
    or (visibility = 'shared_to_ceo' and exists (select 1 from profiles me where me.id = auth.uid() and me.role in ('ceo','admin')))
    or exists (select 1 from resource_acl a where a.resource_id = resources.id and a.grantee_profile_id = auth.uid() and a.can_read)
  )
);

drop policy if exists "resources write by owner or ACL" on resources;
create policy "resources write by owner or ACL"
on resources for update using (
  created_by = auth.uid()
  or exists (select 1 from resource_acl a where a.resource_id = resources.id and a.grantee_profile_id = auth.uid() and a.can_write)
);

drop policy if exists "files readable if resource readable" on files;
create policy "files readable if resource readable"
on files for select using (
  exists (
    select 1 from resources r
    where r.id = files.resource_id
      and (
        r.created_by = auth.uid()
        or r.visibility = 'org_public'
        or (r.visibility = 'shared_to_cto' and exists (select 1 from profiles me where me.id = auth.uid() and me.role in ('cto','admin')))
        or (r.visibility = 'shared_to_ceo' and exists (select 1 from profiles me where me.id = auth.uid() and me.role in ('ceo','admin')))
        or exists (select 1 from resource_acl a where a.resource_id = r.id and a.grantee_profile_id = auth.uid() and a.can_read)
      )
  )
);

drop policy if exists "audit same org" on audit_logs;
create policy "audit same org"
on audit_logs for select using (
  exists (select 1 from profiles me where me.id = auth.uid() and me.org_id = audit_logs.org_id)
);
