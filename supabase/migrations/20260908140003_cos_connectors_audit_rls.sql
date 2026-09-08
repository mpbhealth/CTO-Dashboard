-- Connectors, audit, storage, fail-closed RLS.

create table public.integration_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  key text not null,
  kind text not null,
  project_ref text,
  status text not null default 'unconfigured' check (status in ('unconfigured', 'healthy', 'degraded', 'error')),
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, key)
);

insert into public.integration_sources (key, kind, project_ref)
values
  ('aryx_crm', 'crm', 'knelbprqqbjggqfqvfmc'),
  ('aryx_enrollment', 'enrollment', 'ciowhwoapfokiiflubxs'),
  ('mpb_member', 'member_app', 'qfigouszitcddkhssqxr'),
  ('it_ticketing', 'ticketing', 'hhikjgrttgnvojtunmla'),
  ('marketing_suite', 'marketing', 'tzlvhpultquonblkkpqp');

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  source_key text not null,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  metrics jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (org_id, idempotency_key)
);

create index sync_runs_org_idx on public.sync_runs (org_id, created_at desc);

create table public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  source text not null,
  metric_key text not null,
  period_start date not null,
  period_end date,
  value numeric,
  unit text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, source, metric_key, period_start)
);

create index analytics_snapshots_org_idx on public.analytics_snapshots (org_id, source, period_start desc);

create table public.external_record_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  local_entity text,
  local_id uuid,
  remote_system text not null,
  remote_object text not null,
  remote_id text not null,
  href text,
  link_source text not null default 'manual' check (link_source in ('auto_verified', 'auto_heuristic', 'manual', 'rule')),
  confidence numeric,
  verified_by_user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (org_id, remote_system, remote_object, remote_id, local_entity, local_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  actor_id uuid,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_events_org_idx on public.audit_events (org_id, created_at desc);

create table public.phi_access_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  actor_id uuid,
  source text not null,
  object_type text not null,
  object_id text,
  purpose text,
  created_at timestamptz not null default now()
);

create index phi_access_log_org_idx on public.phi_access_log (org_id, created_at desc);

insert into storage.buckets (id, name, public)
values
  ('cos-files', 'cos-files', false),
  ('email-assets', 'email-assets', false)
on conflict (id) do nothing;

-- RLS
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.files enable row level security;
alter table public.projects enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.tech_stack enable row level security;
alter table public.quick_links enable row level security;
alter table public.vendors enable row level security;
alter table public.saas_expenses enable row level security;
alter table public.hipaa_policies enable row level security;
alter table public.hipaa_baas enable row level security;
alter table public.hipaa_incidents enable row level security;
alter table public.hipaa_trainings enable row level security;
alter table public.hipaa_audit_log enable row level security;
alter table public.mail_accounts enable row level security;
alter table public.mail_sync_cursors enable row level security;
alter table public.mail_subscriptions enable row level security;
alter table public.mail_folders enable row level security;
alter table public.mail_threads enable row level security;
alter table public.mail_messages enable row level security;
alter table public.mail_message_folders enable row level security;
alter table public.mail_message_recipients enable row level security;
alter table public.mail_send_intents enable row level security;
alter table public.email_signatures enable row level security;
alter table public.email_drafts enable row level security;
alter table public.integration_sources enable row level security;
alter table public.sync_runs enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.external_record_links enable row level security;
alter table public.audit_events enable row level security;
alter table public.phi_access_log enable row level security;

create policy orgs_select on public.orgs
  for select to authenticated
  using (id = (select public.current_org_id()));

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and role = 'cos');

create policy notes_all on public.notes
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy tasks_all on public.tasks
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy files_all on public.files
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy projects_all on public.projects
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy roadmap_items_all on public.roadmap_items
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy tech_stack_all on public.tech_stack
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy quick_links_all on public.quick_links
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy vendors_all on public.vendors
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy saas_expenses_all on public.saas_expenses
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy hipaa_policies_all on public.hipaa_policies
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy hipaa_baas_all on public.hipaa_baas
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy hipaa_incidents_all on public.hipaa_incidents
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy hipaa_trainings_all on public.hipaa_trainings
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy hipaa_audit_log_select on public.hipaa_audit_log
  for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy mail_accounts_own on public.mail_accounts
  for all to authenticated
  using (owner_user_id = (select auth.uid()) and org_id = (select public.current_org_id()))
  with check (owner_user_id = (select auth.uid()) and org_id = (select public.current_org_id()));

create policy mail_sync_cursors_own on public.mail_sync_cursors
  for all to authenticated
  using (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  );

create policy mail_subscriptions_own on public.mail_subscriptions
  for all to authenticated
  using (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  );

create policy mail_folders_own on public.mail_folders
  for all to authenticated
  using (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  );

create policy mail_threads_own on public.mail_threads
  for all to authenticated
  using (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  );

create policy mail_messages_own on public.mail_messages
  for all to authenticated
  using (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mail_accounts a
      where a.id = mail_account_id and a.owner_user_id = (select auth.uid())
    )
  );

create policy mail_message_folders_own on public.mail_message_folders
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy mail_message_recipients_own on public.mail_message_recipients
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy mail_send_intents_own on public.mail_send_intents
  for all to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy email_signatures_own on public.email_signatures
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy email_drafts_own on public.email_drafts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy integration_sources_select on public.integration_sources
  for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy integration_sources_update on public.integration_sources
  for update to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy sync_runs_select on public.sync_runs
  for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy analytics_snapshots_select on public.analytics_snapshots
  for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy analytics_snapshots_write on public.analytics_snapshots
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy external_record_links_all on public.external_record_links
  for all to authenticated
  using (org_id = (select public.current_org_id()))
  with check (org_id = (select public.current_org_id()));

create policy audit_events_select on public.audit_events
  for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy audit_events_insert on public.audit_events
  for insert to authenticated
  with check (org_id = (select public.current_org_id()) and actor_id = (select auth.uid()));

create policy phi_access_log_select on public.phi_access_log
  for select to authenticated
  using (org_id = (select public.current_org_id()));

create policy phi_access_log_insert on public.phi_access_log
  for insert to authenticated
  with check (org_id = (select public.current_org_id()) and actor_id = (select auth.uid()));

create policy cos_files_select on storage.objects
  for select to authenticated
  using (bucket_id in ('cos-files', 'email-assets') and owner = (select auth.uid()));

create policy cos_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('cos-files', 'email-assets') and owner = (select auth.uid()));

create policy cos_files_update on storage.objects
  for update to authenticated
  using (bucket_id in ('cos-files', 'email-assets') and owner = (select auth.uid()))
  with check (bucket_id in ('cos-files', 'email-assets') and owner = (select auth.uid()));

create policy cos_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('cos-files', 'email-assets') and owner = (select auth.uid()));

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on function public.current_org_id() to authenticated;
