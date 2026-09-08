-- =====================================================
-- HIPAA Compliance Command Center
-- Migration 002: Core Compliance Tables
-- =====================================================

-- Evidence repository (file attachments)
create table if not exists hipaa_evidence (
  id uuid primary key default gen_random_uuid(),
  path text not null,              -- storage path in hipaa-evidence bucket
  title text not null,
  category text not null,          -- 'policies', 'training', 'incident', 'baa', 'audit', 'technical', 'other'
  file_type text,                  -- mime type
  file_size bigint,                -- bytes
  owner uuid not null references auth.users(id),
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generic editable compliance documents (markdown-based)
create table if not exists hipaa_docs (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in (
    'administration',
    'training',
    'phi-minimum',
    'technical',
    'baas',
    'incidents',
    'audits',
    'templates-tools'
  )),
  title text not null,
  slug text unique not null,
  content_md text not null default '',
  status text not null check (status in ('draft','in_review','approved','archived')) default 'draft',
  owner uuid not null references auth.users(id),
  reviewers uuid[] default '{}',
  approver uuid references auth.users(id),
  approved_at timestamptz,
  effective_date date,
  revision integer not null default 1,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document version history
create table if not exists hipaa_doc_versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references hipaa_docs(id) on delete cascade,
  revision integer not null,
  content_md text not null,
  changed_by uuid not null references auth.users(id),
  change_summary text,
  changed_at timestamptz default now(),
  unique(doc_id, revision)
);

-- Policy registry and tracking
create table if not exists hipaa_policies (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid unique references hipaa_docs(id) on delete cascade,
  policy_number text unique,
  category text not null check (category in (
    'Privacy Rule',
    'Security Rule',
    'Breach Notification',
    'Administrative',
    'Technical',
    'Physical',
    'Organizational'
  )),
  next_review_date date,
  review_frequency_months integer default 12,
  owner uuid not null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Risk register
create table if not exists hipaa_risks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  likelihood integer check (likelihood between 1 and 5),
  impact integer check (impact between 1 and 5),
  risk_score integer generated always as (likelihood * impact) stored,
  category text,
  owner uuid references auth.users(id),
  status text check (status in ('open','mitigating','accepted','closed')) default 'open',
  target_date date,
  residual_risk text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Risk mitigations
create table if not exists hipaa_mitigations (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references hipaa_risks(id) on delete cascade,
  action text not null,
  responsible uuid references auth.users(id),
  due_date date,
  done boolean default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Training programs
create table if not exists hipaa_trainings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  frequency text check (frequency in ('onboarding','annual','quarterly','ad-hoc')) not null,
  owner uuid references auth.users(id),
  content_url text,
  duration_minutes integer,
  is_required boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Training attendance and completion
create table if not exists hipaa_training_attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references hipaa_trainings(id) on delete cascade,
  user_id uuid references auth.users(id),
  user_email text not null,
  user_name text,
  completed_at timestamptz,
  score numeric(5,2),
  certificate_url text,
  notes text,
  created_at timestamptz default now(),
  unique(training_id, user_email, completed_at)
);

-- PHI Access Log (Minimum Necessary tracking)
create table if not exists hipaa_phi_access (
  id uuid primary key default gen_random_uuid(),
  subject text not null,           -- member/patient identifier (external)
  accessor uuid references auth.users(id),
  accessor_name text,
  purpose text not null,           -- TPO category or justification
  purpose_category text check (purpose_category in ('Treatment','Payment','Operations','Other')),
  details text,
  system_source text,              -- which system/app
  occurred_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Business Associate Agreements
create table if not exists hipaa_baas (
  id uuid primary key default gen_random_uuid(),
  vendor text not null,
  vendor_contact_name text,
  contact_email text,
  contact_phone text,
  services_provided text,
  effective_date date not null,
  renewal_date date not null,
  auto_renews boolean default false,
  status text check (status in ('active','pending','expired','terminated')) default 'active',
  file_url text,
  notes text,
  owner uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Security Incidents & Breaches
create table if not exists hipaa_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number text unique,
  title text not null,
  description text,
  severity text check (severity in ('low','medium','high','critical')),
  status text check (status in ('new','triage','investigation','rca','resolved','notified','closed')) default 'new',
  reported_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  occurred_at timestamptz default now(),
  discovered_at timestamptz default now(),
  closed_at timestamptz,
  is_breach boolean default false,
  affected_individuals_count integer,
  phi_types_affected text[],
  rca_md text,                     -- root cause analysis
  remediation_md text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Breach notification tracking
create table if not exists hipaa_breach_notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid unique not null references hipaa_incidents(id) on delete cascade,
  individual_notice_sent_at timestamptz,
  individual_notice_method text,
  hhs_reported_at timestamptz,
  hhs_confirmation_number text,
  media_notice_sent_at timestamptz,
  media_outlets text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audits & Monitoring
create table if not exists hipaa_audits (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('internal','external','vulnerability','penetration','risk-assessment')) not null,
  title text not null,
  description text,
  auditor_name text,
  auditor_org text,
  period_start date,
  period_end date,
  status text check (status in ('planned','in-progress','completed','archived')) default 'planned',
  report_url text,
  findings_summary text,
  cap_md text,                     -- corrective action plan markdown
  owner uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks & Assignments
create table if not exists hipaa_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  section text not null,
  linked_table text,
  linked_id uuid,
  assignee uuid references auth.users(id),
  created_by uuid references auth.users(id),
  due_date date,
  status text check (status in ('todo','in_progress','blocked','done','cancelled')) default 'todo',
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit log (activity tracking)
create table if not exists hipaa_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id),
  actor_email text,
  action text not null,
  object_table text,
  object_id uuid,
  details jsonb default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Compliance contacts roster
create table if not exists hipaa_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  email text,
  phone text,
  department text,
  is_primary boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index idx_hipaa_evidence_category on hipaa_evidence(category);
create index idx_hipaa_evidence_owner on hipaa_evidence(owner);
create index idx_hipaa_docs_section on hipaa_docs(section);
create index idx_hipaa_docs_status on hipaa_docs(status);
create index idx_hipaa_docs_slug on hipaa_docs(slug);
create index idx_hipaa_doc_versions_doc_id on hipaa_doc_versions(doc_id);
create index idx_hipaa_policies_next_review on hipaa_policies(next_review_date);
create index idx_hipaa_risks_status on hipaa_risks(status);
create index idx_hipaa_risks_owner on hipaa_risks(owner);
create index idx_hipaa_trainings_frequency on hipaa_trainings(frequency);
create index idx_hipaa_training_attendance_training on hipaa_training_attendance(training_id);
create index idx_hipaa_training_attendance_email on hipaa_training_attendance(user_email);
create index idx_hipaa_phi_access_subject on hipaa_phi_access(subject);
create index idx_hipaa_phi_access_accessor on hipaa_phi_access(accessor);
create index idx_hipaa_phi_access_occurred on hipaa_phi_access(occurred_at);
create index idx_hipaa_baas_renewal on hipaa_baas(renewal_date);
create index idx_hipaa_baas_status on hipaa_baas(status);
create index idx_hipaa_incidents_status on hipaa_incidents(status);
create index idx_hipaa_incidents_severity on hipaa_incidents(severity);
create index idx_hipaa_incidents_number on hipaa_incidents(incident_number);
create index idx_hipaa_audits_kind on hipaa_audits(kind);
create index idx_hipaa_tasks_assignee on hipaa_tasks(assignee);
create index idx_hipaa_tasks_status on hipaa_tasks(status);
create index idx_hipaa_tasks_due_date on hipaa_tasks(due_date);
create index idx_hipaa_audit_log_actor on hipaa_audit_log(actor);
create index idx_hipaa_audit_log_object on hipaa_audit_log(object_table, object_id);
create index idx_hipaa_audit_log_created on hipaa_audit_log(created_at);

-- Comments for documentation
comment on table hipaa_evidence is 'File attachments and evidence repository';
comment on table hipaa_docs is 'Editable compliance documents with markdown content';
comment on table hipaa_doc_versions is 'Version history for compliance documents';
comment on table hipaa_policies is 'Policy registry with review tracking';
comment on table hipaa_risks is 'Risk register for HIPAA compliance risks';
comment on table hipaa_mitigations is 'Risk mitigation actions and tracking';
comment on table hipaa_trainings is 'Training programs and curricula';
comment on table hipaa_training_attendance is 'Training completion records';
comment on table hipaa_phi_access is 'PHI access log for minimum necessary tracking';
comment on table hipaa_baas is 'Business Associate Agreements registry';
comment on table hipaa_incidents is 'Security incidents and breach tracking';
comment on table hipaa_breach_notifications is 'Breach notification compliance tracking';
comment on table hipaa_audits is 'Audit and assessment registry';
comment on table hipaa_tasks is 'Tasks and assignments for compliance activities';
comment on table hipaa_audit_log is 'Activity audit trail for compliance system';
comment on table hipaa_contacts is 'Compliance team contact roster';

