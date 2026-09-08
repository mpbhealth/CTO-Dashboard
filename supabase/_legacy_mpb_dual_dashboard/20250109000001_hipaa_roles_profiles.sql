-- =====================================================
-- HIPAA Compliance Command Center
-- Migration 001: Roles, Profiles, User Roles
-- =====================================================

-- Profiles table (extends auth.users)
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Roles table
create table if not exists roles (
  id serial primary key,
  name text unique not null check (name in (
    'hipaa_officer',
    'privacy_officer',
    'security_officer',
    'legal',
    'auditor',
    'staff',
    'admin'
  )),
  description text,
  created_at timestamptz default now()
);

-- User roles junction table (many-to-many)
create table if not exists user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_id int references roles(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid references auth.users(id),
  primary key (user_id, role_id)
);

-- Helper view for current user roles
create or replace view v_current_roles as
select 
  ur.user_id, 
  r.name as role,
  r.description
from user_roles ur 
join roles r on r.id = ur.role_id;

-- Helper function to check if user has a specific role
create or replace function has_role(u uuid, r text)
returns boolean 
language sql 
stable 
security definer
as $$
  select exists(
    select 1 from v_current_roles
    where user_id = u and role = r
  );
$$;

-- Helper function to check if user has any of multiple roles
create or replace function has_any_role(u uuid, roles text[])
returns boolean 
language sql 
stable 
security definer
as $$
  select exists(
    select 1 from v_current_roles
    where user_id = u and role = any(roles)
  );
$$;

-- Helper function to get current user roles
create or replace function current_user_roles()
returns table(role text)
language sql
stable
security definer
as $$
  select role from v_current_roles where user_id = auth.uid();
$$;

-- Seed initial roles
insert into roles (name, description) values
  ('admin', 'Full system administrator with all permissions'),
  ('hipaa_officer', 'HIPAA Privacy and Security Officer'),
  ('privacy_officer', 'Privacy Officer - manages privacy policies and PHI'),
  ('security_officer', 'Security Officer - manages technical safeguards'),
  ('legal', 'Legal team - reviews and approves compliance documents'),
  ('auditor', 'Auditor - read-only access for compliance audits'),
  ('staff', 'Staff - limited access to training and personal records')
on conflict (name) do nothing;

-- Enable RLS
alter table profiles enable row level security;
alter table roles enable row level security;
alter table user_roles enable row level security;

-- RLS Policies for profiles
create policy "Users can view all profiles if they have officer/admin/legal/auditor role"
  on profiles for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Users can view own profile"
  on profiles for select
  using (user_id = auth.uid());

create policy "Officers and admins can update profiles"
  on profiles for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

create policy "Officers and admins can insert profiles"
  on profiles for insert
  with check (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

-- RLS Policies for roles (read-only for most users)
create policy "All authenticated users can view roles"
  on roles for select
  to authenticated
  using (true);

-- RLS Policies for user_roles
create policy "Officers and admins can view all user roles"
  on user_roles for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

create policy "Users can view their own roles"
  on user_roles for select
  using (user_id = auth.uid());

create policy "Only admins can manage user roles"
  on user_roles for all
  using (has_role(auth.uid(), 'admin'));

-- Indexes for performance
create index idx_user_roles_user_id on user_roles(user_id);
create index idx_user_roles_role_id on user_roles(role_id);
create index idx_profiles_email on profiles(email);

-- Comments for documentation
comment on table profiles is 'Extended user profiles linked to auth.users';
comment on table roles is 'Available roles for HIPAA compliance system';
comment on table user_roles is 'Junction table mapping users to roles';
comment on function has_role is 'Check if a user has a specific role';
comment on function has_any_role is 'Check if a user has any of the specified roles';

