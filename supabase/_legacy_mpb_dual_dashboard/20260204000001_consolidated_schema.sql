-- =====================================================
-- CONSOLIDATED SCHEMA FOR CTO/CEO DASHBOARD
-- Generated: 2026-02-04
-- This migration creates all tables, functions, triggers,
-- RLS policies, and storage configurations
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 1: ENUMS (Custom Types)
-- =====================================================

DO $$ BEGIN CREATE TYPE membership_status AS ENUM ('active', 'pending', 'suspended', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE claim_status AS ENUM ('draft', 'submitted', 'under_review', 'pending_info', 'approved', 'partially_approved', 'denied', 'paid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_member', 'waiting_staff', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('info', 'warning', 'alert', 'success', 'announcement'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- SECTION 2: CORE ORGANIZATION & USER TABLES
-- =====================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default organization
INSERT INTO orgs (id, name)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'MPB Health')
ON CONFLICT (id) DO NOTHING;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  display_name text,
  role text DEFAULT 'staff' CHECK (role IN ('ceo', 'cto', 'admin', 'staff')),
  org_id uuid REFERENCES orgs(id) DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roles table (for HIPAA compliance)
CREATE TABLE IF NOT EXISTS roles (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL CHECK (name IN (
    'hipaa_officer', 'privacy_officer', 'security_officer',
    'legal', 'auditor', 'staff', 'admin'
  )),
  description text,
  created_at timestamptz DEFAULT now()
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id int REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Users table (for assignment system)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'user',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system administrator with all permissions'),
  ('hipaa_officer', 'HIPAA Privacy and Security Officer'),
  ('privacy_officer', 'Privacy Officer - manages privacy policies and PHI'),
  ('security_officer', 'Security Officer - manages technical safeguards'),
  ('legal', 'Legal team - reviews and approves compliance documents'),
  ('auditor', 'Auditor - read-only access for compliance audits'),
  ('staff', 'Staff - limited access to training and personal records')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SECTION 3: WORKSPACE & RESOURCE TABLES
-- =====================================================

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('CTO', 'CEO', 'SHARED')),
  owner_profile_id uuid REFERENCES profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, kind)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('file', 'doc', 'kpi', 'campaign', 'note', 'task', 'dashboard')),
  title text,
  meta jsonb DEFAULT '{}'::jsonb,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared_to_cto', 'shared_to_ceo', 'org_public')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resource ACL table
CREATE TABLE IF NOT EXISTS resource_acl (
  id serial PRIMARY KEY,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  grantee_profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, grantee_profile_id)
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  size_bytes bigint,
  mime text,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 4: DASHBOARD TABLES
-- =====================================================

-- KPI Data table
CREATE TABLE IF NOT EXISTS kpi_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  value text NOT NULL,
  change text NOT NULL,
  trend text CHECK (trend IN ('up', 'down', 'stable')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tech Stack table
CREATE TABLE IF NOT EXISTS tech_stack (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  version text NOT NULL,
  owner text NOT NULL,
  status text CHECK (status IN ('Active', 'Experimental', 'Deprecated')) NOT NULL DEFAULT 'Active',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roadmap Items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  quarter text,
  status text CHECK (status IN ('Backlog', 'In Progress', 'Complete', 'planned')) DEFAULT 'Backlog',
  priority text CHECK (priority IN ('Low', 'Medium', 'High', 'low', 'medium', 'high')) DEFAULT 'Medium',
  owner text,
  department text,
  dependencies text[] DEFAULT '{}',
  description text,
  category text,
  start_date date,
  end_date date,
  assigned_to uuid REFERENCES auth.users(id),
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text CHECK (status IN ('Planning', 'Building', 'Live', 'planning')) DEFAULT 'Planning',
  team text[] DEFAULT '{}',
  github_link text DEFAULT '',
  monday_link text DEFAULT '',
  website_url text DEFAULT '',
  progress integer CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  priority text DEFAULT 'medium',
  owner uuid REFERENCES auth.users(id),
  start_date date,
  end_date date,
  budget numeric,
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  cost numeric NOT NULL,
  billing_cycle text CHECK (billing_cycle IN ('Monthly', 'Yearly')) NOT NULL,
  renewal_date date NOT NULL,
  owner text NOT NULL,
  justification text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  status text CHECK (status IN ('Live', 'Inactive')) NOT NULL DEFAULT 'Inactive',
  prompt text NOT NULL,
  dataset_refs text[] DEFAULT '{}',
  environment text NOT NULL DEFAULT 'Staging',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- API Status table
CREATE TABLE IF NOT EXISTS api_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  status text CHECK (status IN ('Healthy', 'Warning', 'Down')) NOT NULL DEFAULT 'Healthy',
  last_checked timestamptz DEFAULT now(),
  response_time integer DEFAULT 0,
  uptime numeric(5,2) DEFAULT 99.9,
  description text,
  endpoint_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API Incidents table
CREATE TABLE IF NOT EXISTS api_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid REFERENCES api_statuses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  severity text CHECK (severity IN ('critical', 'warning', 'info')) NOT NULL DEFAULT 'warning',
  status text CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')) NOT NULL DEFAULT 'investigating',
  started_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  impact text,
  resolution_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deployment Logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project text NOT NULL,
  env text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  status text CHECK (status IN ('Success', 'Failed', 'In Progress')) NOT NULL,
  log text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  team text NOT NULL,
  status text CHECK (status IN ('Available', 'In Meeting', 'Focus Time', 'Away', 'active')) DEFAULT 'Available',
  email text,
  avatar_url text,
  department text NOT NULL,
  hire_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quick Links table
CREATE TABLE IF NOT EXISTS quick_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  category text,
  icon text,
  is_favorite boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- External Project Links table
CREATE TABLE IF NOT EXISTS external_project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  link_type text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 5: NOTES & SHARING TABLES
-- =====================================================

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text NOT NULL,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  is_collaborative boolean DEFAULT false,
  owner_role text CHECK (owner_role IN ('ceo', 'cto')),
  created_for_role text CHECK (created_for_role IN ('ceo', 'cto')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Note Shares table
CREATE TABLE IF NOT EXISTS note_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_role text CHECK (shared_with_role IN ('ceo', 'cto')),
  permission_level text CHECK (permission_level IN ('view', 'edit')) DEFAULT 'view',
  share_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Note Notifications table
CREATE TABLE IF NOT EXISTS note_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('shared', 'edited', 'unshared', 'commented')),
  is_read boolean DEFAULT false,
  sent_via text CHECK (sent_via IN ('in-app', 'email', 'both')) DEFAULT 'in-app',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 6: DEPARTMENT TABLES
-- =====================================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  strategic_purpose text,
  parent_department_id uuid REFERENCES departments(id),
  department_lead_id uuid REFERENCES auth.users(id),
  head_employee_id uuid,
  budget numeric(12,2),
  is_active boolean DEFAULT true,
  headcount integer DEFAULT 0,
  location text,
  contact_email text,
  mission_statement text,
  key_objectives text[],
  tech_stack text[],
  reporting_frequency text DEFAULT 'weekly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Department Uploads table
CREATE TABLE IF NOT EXISTS department_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  org_id uuid REFERENCES orgs(id),
  created_at timestamptz DEFAULT now()
);

-- Department Notes table
CREATE TABLE IF NOT EXISTS department_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'operations', 'finance', 'saudemax')),
  upload_id uuid REFERENCES department_uploads(id) ON DELETE SET NULL,
  note_content text NOT NULL,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee Profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  title text NOT NULL,
  primary_department_id uuid REFERENCES departments(id),
  reports_to_id uuid REFERENCES employee_profiles(id),
  employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave')),
  employment_type text DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  start_date date,
  end_date date,
  salary numeric,
  location text,
  skills text[],
  certifications text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Department Workflows table
CREATE TABLE IF NOT EXISTS department_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  workflow_name text,
  description text,
  workflow_type text DEFAULT 'process' CHECK (workflow_type IN ('process', 'approval', 'communication', 'escalation')),
  is_active boolean DEFAULT true,
  status text DEFAULT 'active',
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  estimated_duration interval,
  complexity_level text DEFAULT 'medium' CHECK (complexity_level IN ('low', 'medium', 'high')),
  automation_level text DEFAULT 'manual' CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated'))
);

-- Workflow Steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES department_workflows(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  name text NOT NULL,
  step_name text,
  description text,
  assigned_role text,
  estimated_time interval,
  dependencies text[],
  required_tools text[],
  success_criteria text,
  failure_actions text,
  automation_script text,
  is_parallel boolean DEFAULT false,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, step_number)
);

-- Department Relationships table
CREATE TABLE IF NOT EXISTS department_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  target_department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id),
  related_department_id uuid REFERENCES departments(id),
  relationship_type text NOT NULL CHECK (relationship_type IN ('reports_to', 'collaborates_with', 'supports', 'depends_on')),
  strength integer DEFAULT 1 CHECK (strength >= 1 AND strength <= 5),
  communication_frequency text DEFAULT 'weekly',
  shared_resources text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Org Chart Positions table
CREATE TABLE IF NOT EXISTS org_chart_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id),
  position_title text,
  parent_position_id uuid REFERENCES org_chart_positions(id),
  level integer DEFAULT 0,
  x_position numeric DEFAULT 0,
  y_position numeric DEFAULT 0,
  width numeric DEFAULT 200,
  height numeric DEFAULT 100,
  layout_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Department Metrics table
CREATE TABLE IF NOT EXISTS department_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_type text CHECK (metric_type IN ('performance', 'financial', 'operational', 'hr')),
  measurement_unit text,
  target_value numeric,
  measurement_date date DEFAULT CURRENT_DATE,
  period_start date,
  period_end date,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 7: COMPLIANCE TABLES (HIPAA)
-- =====================================================

-- HIPAA Evidence table
CREATE TABLE IF NOT EXISTS hipaa_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  file_type text,
  file_size bigint,
  owner uuid NOT NULL REFERENCES auth.users(id),
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Docs table
CREATE TABLE IF NOT EXISTS hipaa_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN (
    'administration', 'training', 'phi-minimum', 'technical',
    'baas', 'incidents', 'audits', 'templates-tools'
  )),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content_md text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'archived')) DEFAULT 'draft',
  owner uuid NOT NULL REFERENCES auth.users(id),
  reviewers uuid[] DEFAULT '{}',
  approver uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  effective_date date,
  revision integer NOT NULL DEFAULT 1,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Doc Versions table
CREATE TABLE IF NOT EXISTS hipaa_doc_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id uuid NOT NULL REFERENCES hipaa_docs(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  content_md text NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  change_summary text,
  changed_at timestamptz DEFAULT now(),
  UNIQUE(doc_id, revision)
);

-- HIPAA Policies table
CREATE TABLE IF NOT EXISTS hipaa_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id uuid UNIQUE REFERENCES hipaa_docs(id) ON DELETE CASCADE,
  policy_number text UNIQUE,
  category text NOT NULL CHECK (category IN (
    'Privacy Rule', 'Security Rule', 'Breach Notification',
    'Administrative', 'Technical', 'Physical', 'Organizational'
  )),
  next_review_date date,
  review_frequency_months integer DEFAULT 12,
  owner uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Risks table
CREATE TABLE IF NOT EXISTS hipaa_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  likelihood integer CHECK (likelihood BETWEEN 1 AND 5),
  impact integer CHECK (impact BETWEEN 1 AND 5),
  risk_score integer GENERATED ALWAYS AS (likelihood * impact) STORED,
  category text,
  owner uuid REFERENCES auth.users(id),
  status text CHECK (status IN ('open', 'mitigating', 'accepted', 'closed')) DEFAULT 'open',
  target_date date,
  residual_risk text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Mitigations table
CREATE TABLE IF NOT EXISTS hipaa_mitigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id uuid NOT NULL REFERENCES hipaa_risks(id) ON DELETE CASCADE,
  action text NOT NULL,
  responsible uuid REFERENCES auth.users(id),
  due_date date,
  done boolean DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Trainings table
CREATE TABLE IF NOT EXISTS hipaa_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  frequency text CHECK (frequency IN ('onboarding', 'annual', 'quarterly', 'ad-hoc')) NOT NULL,
  owner uuid REFERENCES auth.users(id),
  content_url text,
  duration_minutes integer,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Training Attendance table
CREATE TABLE IF NOT EXISTS hipaa_training_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES hipaa_trainings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_email text NOT NULL,
  user_name text,
  completed_at timestamptz,
  score numeric(5,2),
  certificate_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(training_id, user_email, completed_at)
);

-- HIPAA PHI Access table
CREATE TABLE IF NOT EXISTS hipaa_phi_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  accessor uuid REFERENCES auth.users(id),
  accessor_name text,
  purpose text NOT NULL,
  purpose_category text CHECK (purpose_category IN ('Treatment', 'Payment', 'Operations', 'Other')),
  details text,
  system_source text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- HIPAA BAAs table
CREATE TABLE IF NOT EXISTS hipaa_baas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor text NOT NULL,
  vendor_contact_name text,
  contact_email text,
  contact_phone text,
  services_provided text,
  effective_date date NOT NULL,
  renewal_date date NOT NULL,
  auto_renews boolean DEFAULT false,
  status text CHECK (status IN ('active', 'pending', 'expired', 'terminated')) DEFAULT 'active',
  file_url text,
  notes text,
  owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Incidents table
CREATE TABLE IF NOT EXISTS hipaa_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text UNIQUE,
  title text NOT NULL,
  description text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text CHECK (status IN ('new', 'triage', 'investigation', 'rca', 'resolved', 'notified', 'closed')) DEFAULT 'new',
  reported_by uuid REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  occurred_at timestamptz DEFAULT now(),
  discovered_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  is_breach boolean DEFAULT false,
  affected_individuals_count integer,
  phi_types_affected text[],
  rca_md text,
  remediation_md text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Breach Notifications table
CREATE TABLE IF NOT EXISTS hipaa_breach_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid UNIQUE NOT NULL REFERENCES hipaa_incidents(id) ON DELETE CASCADE,
  individual_notice_sent_at timestamptz,
  individual_notice_method text,
  hhs_reported_at timestamptz,
  hhs_confirmation_number text,
  media_notice_sent_at timestamptz,
  media_outlets text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Audits table
CREATE TABLE IF NOT EXISTS hipaa_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text CHECK (kind IN ('internal', 'external', 'vulnerability', 'penetration', 'risk-assessment')) NOT NULL,
  title text NOT NULL,
  description text,
  auditor_name text,
  auditor_org text,
  period_start date,
  period_end date,
  status text CHECK (status IN ('planned', 'in-progress', 'completed', 'archived')) DEFAULT 'planned',
  report_url text,
  findings_summary text,
  cap_md text,
  owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Tasks table
CREATE TABLE IF NOT EXISTS hipaa_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  section text NOT NULL,
  linked_table text,
  linked_id uuid,
  assignee uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  due_date date,
  status text CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')) DEFAULT 'todo',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- HIPAA Audit Log table
CREATE TABLE IF NOT EXISTS hipaa_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid REFERENCES auth.users(id),
  actor_email text,
  action text NOT NULL,
  object_table text,
  object_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- HIPAA Contacts table
CREATE TABLE IF NOT EXISTS hipaa_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  department text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance Settings table
CREATE TABLE IF NOT EXISTS compliance_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 8: ASSIGNMENTS & TASKS
-- =====================================================

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('todo', 'in_progress', 'done', 'pending')),
  priority text DEFAULT 'medium',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 9: INTEGRATIONS TABLES
-- =====================================================

-- Integrations Secrets table
CREATE TABLE IF NOT EXISTS integrations_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  key_name text NOT NULL,
  key_value text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(service, key_name)
);

-- Webhooks Config table
CREATE TABLE IF NOT EXISTS webhooks_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  target_url text NOT NULL,
  secret_token text NOT NULL,
  headers jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- SFTP Configs table
CREATE TABLE IF NOT EXISTS sftp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hostname text NOT NULL,
  port integer DEFAULT 22,
  username text NOT NULL,
  password text NOT NULL,
  folder_path text DEFAULT '/',
  direction text CHECK (direction IN ('import', 'export')) NOT NULL,
  schedule text DEFAULT '0 0 * * *',
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Sync Logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  operation text NOT NULL,
  status text CHECK (status IN ('success', 'failed', 'in_progress')) NOT NULL,
  message text,
  details jsonb DEFAULT '{}',
  duration_ms integer,
  records_processed integer DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Marketing Integrations table
CREATE TABLE IF NOT EXISTS marketing_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_analytics_key text,
  google_analytics_view_id text,
  facebook_pixel_id text,
  gtm_container_id text,
  woocommerce_key text,
  woocommerce_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Monday.com Config table
CREATE TABLE IF NOT EXISTS monday_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  client_secret text NOT NULL,
  signing_secret text NOT NULL,
  app_id text NOT NULL,
  access_token text,
  refresh_token text,
  workspace_id text,
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Monday Tasks table
CREATE TABLE IF NOT EXISTS monday_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monday_item_id text NOT NULL UNIQUE,
  board_id text NOT NULL,
  board_name text NOT NULL,
  group_id text,
  group_name text,
  name text NOT NULL,
  status text,
  priority text,
  assignees text[],
  due_date date,
  description text,
  labels text[],
  project_id uuid REFERENCES projects(id),
  is_imported boolean DEFAULT false,
  raw_data jsonb,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Monday Sync Log table
CREATE TABLE IF NOT EXISTS monday_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  status text CHECK (status IN ('success', 'failed', 'in_progress')) NOT NULL,
  message text,
  items_processed integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  details jsonb DEFAULT '{}',
  duration_ms integer,
  timestamp timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Teams Integration Settings table
CREATE TABLE IF NOT EXISTS teams_integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'operations', 'finance', 'saudemax', 'general')),
  webhook_url text NOT NULL,
  channel_name text NOT NULL,
  is_active boolean DEFAULT true,
  notify_on_upload boolean DEFAULT true,
  notify_on_failure boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, department)
);

-- =====================================================
-- SECTION 10: SAAS & EXPENSES
-- =====================================================

-- SaaS Expenses table
CREATE TABLE IF NOT EXISTS saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  application text NOT NULL,
  service_name text,
  description text,
  cost_monthly numeric(10,2) DEFAULT 0,
  cost_annual numeric(10,2) DEFAULT 0,
  monthly_cost numeric(10,2),
  billing_cycle text DEFAULT 'monthly',
  platform text,
  url text,
  renewal_date date,
  notes text,
  status text DEFAULT 'active',
  source_sheet text DEFAULT 'manual_entry',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT saas_expenses_cost_monthly_check CHECK (cost_monthly >= 0),
  CONSTRAINT saas_expenses_cost_annual_check CHECK (cost_annual >= 0)
);

-- =====================================================
-- SECTION 11: ADMIN CONTROL CENTER TABLES
-- =====================================================

-- Member Profiles table
CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  date_of_birth date,
  gender varchar(20),
  phone varchar(20),
  email varchar(255),
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state varchar(50),
  zip_code varchar(20),
  country varchar(100) DEFAULT 'USA',
  membership_number varchar(50) UNIQUE NOT NULL,
  membership_status membership_status DEFAULT 'pending',
  membership_start_date date,
  membership_end_date date,
  plan_id varchar(50),
  profile_photo_url text,
  assigned_advisor_id uuid,
  preferred_language varchar(20) DEFAULT 'en',
  communication_preferences jsonb DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
  medical_conditions text[],
  allergies text[],
  medications text[],
  emergency_contact_consent boolean DEFAULT false,
  hipaa_consent boolean DEFAULT false,
  consent_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Member Dependents table
CREATE TABLE IF NOT EXISTS member_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  relationship varchar(50) NOT NULL,
  date_of_birth date,
  gender varchar(20),
  is_covered boolean DEFAULT true,
  coverage_start_date date,
  coverage_end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency Contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  relationship varchar(50),
  phone varchar(20) NOT NULL,
  email varchar(255),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES member_profiles(id) ON DELETE SET NULL,
  claim_number varchar(50) UNIQUE NOT NULL,
  claim_type varchar(50) NOT NULL,
  status claim_status DEFAULT 'submitted',
  provider_name varchar(255),
  provider_id uuid,
  patient_name varchar(200),
  patient_type varchar(20) DEFAULT 'member',
  dependent_id uuid REFERENCES member_dependents(id) ON DELETE SET NULL,
  service_date date NOT NULL,
  diagnosis_codes text[],
  procedure_codes text[],
  description text,
  total_amount decimal(12, 2) NOT NULL,
  eligible_amount decimal(12, 2),
  approved_amount decimal(12, 2),
  paid_amount decimal(12, 2),
  member_responsibility decimal(12, 2),
  denial_reason text,
  processing_notes text,
  priority priority_level DEFAULT 'normal',
  submitted_date timestamptz DEFAULT now(),
  reviewed_date timestamptz,
  approved_date timestamptz,
  paid_date timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Claim Documents table
CREATE TABLE IF NOT EXISTS claim_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  document_type varchar(50) NOT NULL,
  file_name varchar(255) NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type varchar(100),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Claim Notes table
CREATE TABLE IF NOT EXISTS claim_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  note text NOT NULL,
  is_internal boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES member_profiles(id) ON DELETE SET NULL,
  ticket_number varchar(50) UNIQUE NOT NULL,
  subject varchar(255) NOT NULL,
  description text NOT NULL,
  category varchar(50) NOT NULL,
  priority priority_level DEFAULT 'normal',
  status ticket_status DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_notes text,
  contact_name varchar(200),
  contact_email varchar(255),
  contact_phone varchar(20),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ticket Replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  is_from_member boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES member_profiles(id) ON DELETE SET NULL,
  reference_number varchar(50) UNIQUE NOT NULL,
  transaction_type varchar(50) NOT NULL,
  status transaction_status DEFAULT 'pending',
  amount decimal(12, 2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  payment_method varchar(50),
  payment_gateway_id varchar(100),
  description text,
  invoice_id uuid,
  claim_id uuid REFERENCES claims(id) ON DELETE SET NULL,
  processed_date timestamptz,
  receipt_url text,
  failure_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blog Articles table
CREATE TABLE IF NOT EXISTS blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  slug varchar(255) UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image_url text,
  category varchar(100),
  tags text[],
  meta_title varchar(100),
  meta_description varchar(200),
  status varchar(20) DEFAULT 'draft',
  is_featured boolean DEFAULT false,
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name varchar(200),
  view_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQ Items table
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  content_html text NOT NULL,
  category varchar(100) NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System Notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  message text NOT NULL,
  notification_type notification_type DEFAULT 'info',
  channel varchar(20) DEFAULT 'in_app',
  audience varchar(50) DEFAULT 'all_members',
  target_user_ids uuid[],
  status varchar(20) DEFAULT 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key varchar(100) UNIQUE NOT NULL,
  setting_value text,
  setting_type varchar(50) DEFAULT 'string',
  category varchar(50) NOT NULL,
  description text,
  is_sensitive boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Actions Log table
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL,
  entity_type varchar(50),
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Security Audit Log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Policy Documents table
CREATE TABLE IF NOT EXISTS policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text CHECK (document_type IN ('policy', 'sop', 'handbook', 'procedure', 'guideline')),
  content text,
  file_url text,
  file_metadata jsonb DEFAULT '[]'::jsonb,
  version text DEFAULT '1.0',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  review_date date,
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 12: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_acl ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_doc_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_phi_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_baas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_breach_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sftp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monday_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monday_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monday_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 13: HELPER FUNCTIONS
-- =====================================================

-- Helper view for current user roles
CREATE OR REPLACE VIEW v_current_roles AS
SELECT
  ur.user_id,
  r.name AS role,
  r.description
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(u uuid, r text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS(
    SELECT 1 FROM v_current_roles
    WHERE user_id = u AND role = r
  );
$$;

-- Helper function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION has_any_role(u uuid, roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS(
    SELECT 1 FROM v_current_roles
    WHERE user_id = u AND role = ANY(roles)
  );
$$;

-- Helper function to get current user roles
CREATE OR REPLACE FUNCTION current_user_roles()
RETURNS TABLE(role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM v_current_roles WHERE user_id = auth.uid();
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profile creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, display_name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff',
    '00000000-0000-0000-0000-000000000000'::uuid
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =====================================================
-- SECTION 14: TRIGGERS
-- =====================================================

-- Profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_incidents_updated_at ON api_incidents;
CREATE TRIGGER update_api_incidents_updated_at BEFORE UPDATE ON api_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 15: RLS POLICIES - CORE TABLES
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "profiles_self_or_admin" ON profiles;
CREATE POLICY "profiles_self_or_admin"
ON profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles admin_check
    WHERE admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'
      AND admin_check.org_id = profiles.org_id
  )
);

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self"
ON profiles FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
WITH CHECK (true);

-- Roles policies
DROP POLICY IF EXISTS "All authenticated users can view roles" ON roles;
CREATE POLICY "All authenticated users can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- User roles policies
DROP POLICY IF EXISTS "Users can read user roles" ON user_roles;
CREATE POLICY "Users can read user roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage user roles" ON user_roles;
CREATE POLICY "Users can manage user roles"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Orgs policies
DROP POLICY IF EXISTS "orgs_select" ON orgs;
CREATE POLICY "orgs_select"
ON orgs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = orgs.id
  )
);

-- =====================================================
-- SECTION 16: RLS POLICIES - DASHBOARD TABLES
-- =====================================================

-- KPI Data policies
DROP POLICY IF EXISTS "Users can read all dashboard data" ON kpi_data;
CREATE POLICY "Users can read all dashboard data"
ON kpi_data FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage all dashboard data" ON kpi_data;
CREATE POLICY "Users can manage all dashboard data"
ON kpi_data FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Tech Stack policies
DROP POLICY IF EXISTS "Authenticated users can manage tech stack" ON tech_stack;
CREATE POLICY "Authenticated users can manage tech stack"
ON tech_stack FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Roadmap policies
DROP POLICY IF EXISTS "Authenticated users can manage roadmap items" ON roadmap_items;
CREATE POLICY "Authenticated users can manage roadmap items"
ON roadmap_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Projects policies
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
CREATE POLICY "Authenticated users can manage projects"
ON projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Vendors policies
DROP POLICY IF EXISTS "Users can manage vendors" ON vendors;
CREATE POLICY "Users can manage vendors"
ON vendors FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- AI Agents policies
DROP POLICY IF EXISTS "Users can manage ai agents" ON ai_agents;
CREATE POLICY "Users can manage ai agents"
ON ai_agents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- API Statuses policies
DROP POLICY IF EXISTS "Users can manage api statuses" ON api_statuses;
CREATE POLICY "Users can manage api statuses"
ON api_statuses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- API Incidents policies
DROP POLICY IF EXISTS "Allow authenticated users to manage incidents" ON api_incidents;
CREATE POLICY "Allow authenticated users to manage incidents"
ON api_incidents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Deployment Logs policies
DROP POLICY IF EXISTS "Users can manage deployment logs" ON deployment_logs;
CREATE POLICY "Users can manage deployment logs"
ON deployment_logs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Team Members policies
DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;
CREATE POLICY "Authenticated users can manage team members"
ON team_members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Quick Links policies
DROP POLICY IF EXISTS "Users manage own quick links" ON quick_links;
CREATE POLICY "Users manage own quick links"
ON quick_links FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- =====================================================
-- SECTION 17: RLS POLICIES - NOTES & SHARING
-- =====================================================

-- Notes policies
DROP POLICY IF EXISTS "Users can view own and shared notes" ON notes;
CREATE POLICY "Users can view own and shared notes"
ON notes FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR (user_id IS NOT NULL AND user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM note_shares
    WHERE note_shares.note_id = notes.id
    AND note_shares.shared_with_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert notes" ON notes;
CREATE POLICY "Users can insert notes"
ON notes FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() OR (user_id IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update notes" ON notes;
CREATE POLICY "Users can update notes"
ON notes FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete notes" ON notes;
CREATE POLICY "Users can delete notes"
ON notes FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR (user_id IS NOT NULL AND user_id = auth.uid()));

-- Note Shares policies
DROP POLICY IF EXISTS "Users can view their shares" ON note_shares;
CREATE POLICY "Users can view their shares"
ON note_shares FOR SELECT
TO authenticated
USING (
  shared_by_user_id = auth.uid()
  OR shared_with_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can create shares" ON note_shares;
CREATE POLICY "Users can create shares"
ON note_shares FOR INSERT
TO authenticated
WITH CHECK (shared_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete shares" ON note_shares;
CREATE POLICY "Users can delete shares"
ON note_shares FOR DELETE
TO authenticated
USING (shared_by_user_id = auth.uid());

-- Note Notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON note_notifications;
CREATE POLICY "Users can view their notifications"
ON note_notifications FOR SELECT
TO authenticated
USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert notifications" ON note_notifications;
CREATE POLICY "Users can insert notifications"
ON note_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- SECTION 18: RLS POLICIES - DEPARTMENTS
-- =====================================================

-- Departments policies
DROP POLICY IF EXISTS "Users can read departments" ON departments;
CREATE POLICY "Users can read departments"
ON departments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage departments" ON departments;
CREATE POLICY "Users can manage departments"
ON departments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Employee Profiles policies
DROP POLICY IF EXISTS "Users can read all employee profiles" ON employee_profiles;
CREATE POLICY "Users can read all employee profiles"
ON employee_profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage employee profiles" ON employee_profiles;
CREATE POLICY "Users can manage employee profiles"
ON employee_profiles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Department Workflows policies
DROP POLICY IF EXISTS "Users can read workflows" ON department_workflows;
CREATE POLICY "Users can read workflows"
ON department_workflows FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage workflows" ON department_workflows;
CREATE POLICY "Users can manage workflows"
ON department_workflows FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Workflow Steps policies
DROP POLICY IF EXISTS "Users can read workflow steps" ON workflow_steps;
CREATE POLICY "Users can read workflow steps"
ON workflow_steps FOR SELECT
TO authenticated
USING (true);

-- Department Relationships policies
DROP POLICY IF EXISTS "Users can read department relationships" ON department_relationships;
CREATE POLICY "Users can read department relationships"
ON department_relationships FOR SELECT
TO authenticated
USING (true);

-- Org Chart Positions policies
DROP POLICY IF EXISTS "Users can read org chart positions" ON org_chart_positions;
CREATE POLICY "Users can read org chart positions"
ON org_chart_positions FOR SELECT
TO authenticated
USING (true);

-- Department Metrics policies
DROP POLICY IF EXISTS "Users can read department metrics" ON department_metrics;
CREATE POLICY "Users can read department metrics"
ON department_metrics FOR SELECT
TO authenticated
USING (true);

-- Policy Documents policies
DROP POLICY IF EXISTS "Users can read policy documents" ON policy_documents;
CREATE POLICY "Users can read policy documents"
ON policy_documents FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- SECTION 19: RLS POLICIES - HIPAA COMPLIANCE
-- =====================================================

-- HIPAA Evidence policies
DROP POLICY IF EXISTS "Users can view evidence" ON hipaa_evidence;
CREATE POLICY "Users can view evidence"
ON hipaa_evidence FOR SELECT
USING (
  has_any_role((SELECT auth.uid()), ARRAY['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  OR owner = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Officers can insert evidence" ON hipaa_evidence;
CREATE POLICY "Officers can insert evidence"
ON hipaa_evidence FOR INSERT
WITH CHECK (
  has_any_role((SELECT auth.uid()), ARRAY['admin','hipaa_officer','privacy_officer','security_officer'])
);

-- HIPAA Docs policies
DROP POLICY IF EXISTS "Users can view docs" ON hipaa_docs;
CREATE POLICY "Users can view docs"
ON hipaa_docs FOR SELECT
USING (
  has_any_role((SELECT auth.uid()), ARRAY['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  OR (section = 'training' AND status = 'approved')
);

-- HIPAA Trainings policies
DROP POLICY IF EXISTS "All authenticated users can view trainings" ON hipaa_trainings;
CREATE POLICY "All authenticated users can view trainings"
ON hipaa_trainings FOR SELECT
TO authenticated
USING (true);

-- HIPAA Audit Log policies
DROP POLICY IF EXISTS "System can insert audit log entries" ON hipaa_audit_log;
CREATE POLICY "System can insert audit log entries"
ON hipaa_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Officers and auditors can view audit log" ON hipaa_audit_log;
CREATE POLICY "Officers and auditors can view audit log"
ON hipaa_audit_log FOR SELECT
USING (
  has_any_role((SELECT auth.uid()), ARRAY['admin','hipaa_officer','auditor'])
);

-- Compliance Settings policies
DROP POLICY IF EXISTS "Officers can view and manage settings" ON compliance_settings;
CREATE POLICY "Officers can view and manage settings"
ON compliance_settings FOR ALL
USING (
  has_any_role((SELECT auth.uid()), ARRAY['admin','hipaa_officer'])
)
WITH CHECK (
  has_any_role((SELECT auth.uid()), ARRAY['admin','hipaa_officer'])
);

-- =====================================================
-- SECTION 20: RLS POLICIES - ADMIN CONTROL CENTER
-- =====================================================

-- Member Profiles policies
DROP POLICY IF EXISTS "admin_member_profiles" ON member_profiles;
CREATE POLICY "admin_member_profiles"
ON member_profiles FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- Claims policies
DROP POLICY IF EXISTS "admin_claims" ON claims;
CREATE POLICY "admin_claims"
ON claims FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- Support Tickets policies
DROP POLICY IF EXISTS "admin_support_tickets" ON support_tickets;
CREATE POLICY "admin_support_tickets"
ON support_tickets FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- Transactions policies
DROP POLICY IF EXISTS "admin_transactions" ON transactions;
CREATE POLICY "admin_transactions"
ON transactions FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- Blog Articles policies
DROP POLICY IF EXISTS "public_blog_articles" ON blog_articles;
CREATE POLICY "public_blog_articles"
ON blog_articles FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "admin_blog_articles" ON blog_articles;
CREATE POLICY "admin_blog_articles"
ON blog_articles FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- FAQ Items policies
DROP POLICY IF EXISTS "public_faq_items" ON faq_items;
CREATE POLICY "public_faq_items"
ON faq_items FOR SELECT
USING (is_active = true);

-- System Settings policies
DROP POLICY IF EXISTS "admin_system_settings" ON system_settings;
CREATE POLICY "admin_system_settings"
ON system_settings FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- =====================================================
-- SECTION 21: RLS POLICIES - INTEGRATIONS
-- =====================================================

-- Integrations Secrets policies
DROP POLICY IF EXISTS "Admin users can manage integration secrets" ON integrations_secrets;
CREATE POLICY "Admin users can manage integration secrets"
ON integrations_secrets FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Webhooks Config policies
DROP POLICY IF EXISTS "Admin users can manage webhooks" ON webhooks_config;
CREATE POLICY "Admin users can manage webhooks"
ON webhooks_config FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- SFTP Configs policies
DROP POLICY IF EXISTS "Admin users can manage SFTP configs" ON sftp_configs;
CREATE POLICY "Admin users can manage SFTP configs"
ON sftp_configs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Sync Logs policies
DROP POLICY IF EXISTS "Users can read sync logs" ON sync_logs;
CREATE POLICY "Users can read sync logs"
ON sync_logs FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "System can insert sync logs" ON sync_logs;
CREATE POLICY "System can insert sync logs"
ON sync_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Monday Tasks policies
DROP POLICY IF EXISTS "Users can read Monday tasks" ON monday_tasks;
CREATE POLICY "Users can read Monday tasks"
ON monday_tasks FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage Monday tasks" ON monday_tasks;
CREATE POLICY "Users can manage Monday tasks"
ON monday_tasks FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- SaaS Expenses policies
DROP POLICY IF EXISTS "Users can read SaaS expenses" ON saas_expenses;
CREATE POLICY "Users can read SaaS expenses"
ON saas_expenses FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage SaaS expenses" ON saas_expenses;
CREATE POLICY "Users can manage SaaS expenses"
ON saas_expenses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- SECTION 22: RLS POLICIES - WORKSPACE/RESOURCES
-- =====================================================

-- Workspaces policies
DROP POLICY IF EXISTS "workspaces_same_org" ON workspaces;
CREATE POLICY "workspaces_same_org"
ON workspaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = workspaces.org_id
  )
);

DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
CREATE POLICY "workspaces_insert"
ON workspaces FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = workspaces.org_id
      AND me.role IN ('admin', 'cto', 'ceo')
  )
);

-- Resources policies
DROP POLICY IF EXISTS "resources_readable_by_visibility" ON resources;
CREATE POLICY "resources_readable_by_visibility"
ON resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = resources.org_id
  )
  AND (
    created_by = auth.uid()
    OR visibility = 'org_public'
    OR (
      visibility = 'shared_to_cto'
      AND EXISTS (
        SELECT 1 FROM profiles me
        WHERE me.user_id = auth.uid()
          AND me.role IN ('cto', 'admin')
      )
    )
    OR (
      visibility = 'shared_to_ceo'
      AND EXISTS (
        SELECT 1 FROM profiles me
        WHERE me.user_id = auth.uid()
          AND me.role IN ('ceo', 'admin')
      )
    )
    OR EXISTS (
      SELECT 1 FROM resource_acl acl
      WHERE acl.resource_id = resources.id
        AND acl.grantee_profile_id = auth.uid()
        AND acl.can_read = true
    )
  )
);

DROP POLICY IF EXISTS "resources_insert" ON resources;
CREATE POLICY "resources_insert"
ON resources FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = resources.org_id
  )
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "resources_update" ON resources;
CREATE POLICY "resources_update"
ON resources FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM resource_acl acl
    WHERE acl.resource_id = resources.id
      AND acl.grantee_profile_id = auth.uid()
      AND acl.can_write = true
  )
);

DROP POLICY IF EXISTS "resources_delete" ON resources;
CREATE POLICY "resources_delete"
ON resources FOR DELETE
USING (created_by = auth.uid());

-- Files policies
DROP POLICY IF EXISTS "files_readable_if_resource_readable" ON files;
CREATE POLICY "files_readable_if_resource_readable"
ON files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM resources r
    JOIN profiles me ON me.user_id = auth.uid()
    WHERE r.id = files.resource_id
      AND me.org_id = r.org_id
      AND (
        r.created_by = auth.uid()
        OR r.visibility = 'org_public'
        OR (r.visibility = 'shared_to_cto' AND me.role IN ('cto', 'admin'))
        OR (r.visibility = 'shared_to_ceo' AND me.role IN ('ceo', 'admin'))
        OR EXISTS (
          SELECT 1 FROM resource_acl acl
          WHERE acl.resource_id = r.id
            AND acl.grantee_profile_id = auth.uid()
            AND acl.can_read = true
        )
      )
  )
);

-- Audit Logs policies
DROP POLICY IF EXISTS "audit_logs_org_read" ON audit_logs;
CREATE POLICY "audit_logs_org_read"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = audit_logs.org_id
      AND me.role IN ('admin', 'cto', 'ceo')
  )
);

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert"
ON audit_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.org_id = audit_logs.org_id
  )
);

-- =====================================================
-- SECTION 23: INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Workspace indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_kind ON workspaces(kind);
CREATE INDEX IF NOT EXISTS idx_resources_org_id ON resources(org_id);
CREATE INDEX IF NOT EXISTS idx_resources_workspace_id ON resources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON resources(created_by);
CREATE INDEX IF NOT EXISTS idx_resource_acl_resource_id ON resource_acl(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_acl_grantee ON resource_acl(grantee_profile_id);
CREATE INDEX IF NOT EXISTS idx_files_resource_id ON files(resource_id);
CREATE INDEX IF NOT EXISTS idx_files_storage_key ON files(storage_key);

-- Dashboard indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_api_incidents_api_id ON api_incidents(api_id);
CREATE INDEX IF NOT EXISTS idx_api_incidents_status ON api_incidents(status);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_owner_role ON notes(owner_role);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_is_shared ON notes(is_shared);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with ON note_shares(shared_with_user_id);

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department ON employee_profiles(primary_department_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_reports_to ON employee_profiles(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_department_notes_org_id ON department_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_department_notes_department ON department_notes(department);

-- HIPAA indexes
CREATE INDEX IF NOT EXISTS idx_hipaa_evidence_category ON hipaa_evidence(category);
CREATE INDEX IF NOT EXISTS idx_hipaa_evidence_owner ON hipaa_evidence(owner);
CREATE INDEX IF NOT EXISTS idx_hipaa_docs_section ON hipaa_docs(section);
CREATE INDEX IF NOT EXISTS idx_hipaa_docs_status ON hipaa_docs(status);
CREATE INDEX IF NOT EXISTS idx_hipaa_risks_status ON hipaa_risks(status);
CREATE INDEX IF NOT EXISTS idx_hipaa_incidents_status ON hipaa_incidents(status);
CREATE INDEX IF NOT EXISTS idx_hipaa_tasks_status ON hipaa_tasks(status);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_created ON hipaa_audit_log(created_at);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_secrets_service ON integrations_secrets(service);
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monday_tasks_board_id ON monday_tasks(board_id);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_member_profiles_membership_number ON member_profiles(membership_number);
CREATE INDEX IF NOT EXISTS idx_member_profiles_status ON member_profiles(membership_status);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- SECTION 24: STORAGE BUCKETS
-- =====================================================

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ctod', 'ctod', false, 52428800, NULL),
  ('ceod', 'ceod', false, 52428800, NULL),
  ('shared', 'shared', false, 52428800, NULL),
  ('hipaa-evidence', 'hipaa-evidence', false, 52428800, NULL),
  ('hipaa-templates', 'hipaa-templates', false, 52428800, NULL),
  ('hipaa-exports', 'hipaa-exports', false, 52428800, NULL),
  ('employee-documents', 'employee-documents', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ctod bucket
DROP POLICY IF EXISTS "ctod_upload" ON storage.objects;
CREATE POLICY "ctod_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ctod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('cto', 'admin')
  )
);

DROP POLICY IF EXISTS "ctod_read" ON storage.objects;
CREATE POLICY "ctod_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ctod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('cto', 'admin')
  )
);

-- Storage policies for ceod bucket
DROP POLICY IF EXISTS "ceod_upload" ON storage.objects;
CREATE POLICY "ceod_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ceod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('ceo', 'admin')
  )
);

DROP POLICY IF EXISTS "ceod_read" ON storage.objects;
CREATE POLICY "ceod_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ceod'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
      AND me.role IN ('ceo', 'admin')
  )
);

-- Storage policies for shared bucket
DROP POLICY IF EXISTS "shared_upload" ON storage.objects;
CREATE POLICY "shared_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shared'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "shared_read" ON storage.objects;
CREATE POLICY "shared_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'shared'
  AND EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.user_id = auth.uid()
  )
);

-- =====================================================
-- SECTION 25: SEQUENCES FOR AUTO-NUMBERING
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS claim_number_seq START 10001;
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 10001;

-- Claim number generator function
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claim_number IS NULL THEN
    NEW.claim_number := 'CLM-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('claim_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_claim_number ON claims;
CREATE TRIGGER set_claim_number
BEFORE INSERT ON claims
FOR EACH ROW
EXECUTE FUNCTION generate_claim_number();

-- Ticket number generator function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- =====================================================
-- SECTION 26: SEED DEFAULT DATA
-- =====================================================

-- Seed compliance settings
INSERT INTO compliance_settings (key, value, description) VALUES
  ('n8n_webhook_baa_reminder', '{"enabled": false, "url": ""}'::jsonb, 'Webhook URL for BAA renewal reminders'),
  ('n8n_webhook_incident_alert', '{"enabled": false, "url": ""}'::jsonb, 'Webhook URL for critical incident alerts'),
  ('training_certificate_template', '{"template_id": "default", "signature_name": "HIPAA Officer"}'::jsonb, 'Training certificate template configuration'),
  ('breach_risk_thresholds', '{"low": 25, "medium": 50, "high": 100, "critical": 500}'::jsonb, 'Breach risk scoring thresholds'),
  ('default_reviewers', '{"reviewer_ids": []}'::jsonb, 'Default document reviewers'),
  ('notification_email', '{"from": "compliance@mpbhealth.com", "cc": []}'::jsonb, 'Email configuration for notifications'),
  ('policy_review_frequency_months', '{"default": 12, "critical": 6}'::jsonb, 'Default policy review frequency'),
  ('incident_auto_assignment', '{"enabled": false, "officer_id": null}'::jsonb, 'Auto-assign incidents to HIPAA officer'),
  ('phi_access_retention_days', '{"value": 2555}'::jsonb, 'PHI access log retention period (7 years)'),
  ('audit_log_retention_days', '{"value": 2555}'::jsonb, 'Audit log retention period (7 years)')
ON CONFLICT (key) DO NOTHING;

-- Seed system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('site_name', 'MPB Health', 'string', 'general', 'The name of the site'),
  ('site_description', 'Health sharing made simple', 'string', 'general', 'Site description'),
  ('support_email', 'support@mpb.health', 'string', 'general', 'Support email'),
  ('support_phone', '1-800-MPB-CARE', 'string', 'general', 'Support phone'),
  ('timezone', 'America/New_York', 'string', 'general', 'Default timezone'),
  ('maintenance_mode', 'false', 'boolean', 'general', 'Maintenance mode'),
  ('session_timeout', '3600', 'number', 'security', 'Session timeout'),
  ('max_login_attempts', '5', 'number', 'security', 'Max login attempts'),
  ('require_mfa', 'false', 'boolean', 'security', 'Require MFA'),
  ('primary_color', '#3b82f6', 'string', 'appearance', 'Primary color'),
  ('dark_mode_enabled', 'true', 'boolean', 'appearance', 'Dark mode')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- SECTION 27: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF CONSOLIDATED MIGRATION
-- =====================================================
