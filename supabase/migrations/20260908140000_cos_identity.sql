-- ARYX COS identity: single org, single role.
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.orgs (id, name, slug)
values ('a0000000-0000-0000-0000-000000000001', 'Aryx', 'aryx');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.orgs (id),
  email text,
  display_name text,
  full_name text,
  role text not null default 'cos' check (role = 'cos'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_org_id_idx on public.profiles (org_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orgs_set_updated_at
  before update on public.orgs
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.current_org_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select org_id
  from public.profiles
  where user_id = (select auth.uid())
$$;

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
    'a0000000-0000-0000-0000-000000000001',
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    'cos'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
