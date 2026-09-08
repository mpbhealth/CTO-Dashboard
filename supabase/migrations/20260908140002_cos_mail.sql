-- Mailbox plane. Provider is authoritative; COS stores an encrypted cache.

create table public.mail_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('outlook', 'gmail')),
  provider_account_id text,
  email_address text not null,
  display_name text,
  account_type text not null default 'personal' check (account_type in ('personal', 'shared', 'delegated')),
  status text not null default 'active' check (status in ('connecting', 'active', 'degraded', 'reauth_required', 'disconnected')),
  granted_scopes text[],
  encrypted_access_token text,
  encrypted_refresh_token text,
  key_version integer not null default 1,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  sync_failure_count integer not null default 0,
  sync_error text,
  refreshing_token boolean not null default false,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider, email_address)
);

create index mail_accounts_owner_idx on public.mail_accounts (org_id, owner_user_id);

create table public.mail_sync_cursors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_account_id uuid not null references public.mail_accounts (id) on delete cascade,
  folder_id text,
  cursor_type text not null check (cursor_type in ('delta', 'history', 'uid')),
  cursor_value text not null,
  last_advanced_at timestamptz,
  consecutive_failures integer not null default 0,
  full_resync_required_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mail_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_account_id uuid not null references public.mail_accounts (id) on delete cascade,
  provider_subscription_id text,
  resource text,
  expires_at timestamptz not null,
  last_renewed_at timestamptz,
  renewal_failure_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_subscriptions_expires_idx on public.mail_subscriptions (expires_at);

create table public.mail_folders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_account_id uuid not null references public.mail_accounts (id) on delete cascade,
  provider_folder_id text not null,
  name text not null,
  kind text,
  parent_provider_folder_id text,
  is_label boolean not null default false,
  unread_count integer not null default 0,
  total_count integer not null default 0,
  sort_order integer not null default 0,
  unique (org_id, mail_account_id, provider_folder_id)
);

create table public.mail_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_account_id uuid not null references public.mail_accounts (id) on delete cascade,
  provider_thread_id text not null,
  normalized_subject text,
  latest_message_at timestamptz,
  message_count integer not null default 0,
  unread_count integer not null default 0,
  has_attachments boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, mail_account_id, provider_thread_id)
);

create table public.mail_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_account_id uuid not null references public.mail_accounts (id) on delete cascade,
  mail_thread_id uuid references public.mail_threads (id) on delete set null,
  provider_message_id text not null,
  internet_message_id text,
  direction text,
  origin_class text not null default 'human' check (origin_class in ('human', 'workflow', 'campaign', 'system')),
  sender_address text,
  sender_name text,
  subject text,
  snippet text,
  body_text text,
  body_html text,
  sent_at timestamptz,
  received_at timestamptz,
  is_read boolean not null default false,
  is_draft boolean not null default false,
  is_flagged boolean not null default false,
  send_status text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, mail_account_id, provider_message_id)
);

create index mail_messages_account_received_idx on public.mail_messages (org_id, mail_account_id, received_at desc);

create table public.mail_message_folders (
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_message_id uuid not null references public.mail_messages (id) on delete cascade,
  mail_folder_id uuid not null references public.mail_folders (id) on delete cascade,
  primary key (mail_message_id, mail_folder_id)
);

create table public.mail_message_recipients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_message_id uuid not null references public.mail_messages (id) on delete cascade,
  recipient_type text not null check (recipient_type in ('to', 'cc', 'bcc', 'reply_to')),
  email_address text not null,
  normalized_email text not null,
  display_name text,
  position integer not null default 0
);

create table public.mail_send_intents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  mail_account_id uuid not null references public.mail_accounts (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mail_account_id, idempotency_key)
);

create table public.email_signatures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  html_content text not null default '',
  plain_text_content text,
  logo_url text,
  logo_width integer default 150,
  logo_height integer,
  include_social_links boolean not null default false,
  social_links jsonb not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default 'a0000000-0000-0000-0000-000000000001' references public.orgs (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.mail_accounts (id) on delete set null,
  to_recipients jsonb not null default '[]',
  cc_recipients jsonb not null default '[]',
  bcc_recipients jsonb not null default '[]',
  subject text,
  body_html text,
  attachments jsonb not null default '[]',
  in_reply_to text,
  reply_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'mail_accounts','mail_sync_cursors','mail_subscriptions','mail_threads',
    'mail_messages','mail_send_intents','email_signatures','email_drafts'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;
