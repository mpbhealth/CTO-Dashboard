-- =====================================================
-- HIPAA Compliance Command Center
-- Migration 003: Row Level Security Policies
-- =====================================================

-- Enable RLS on all compliance tables
alter table hipaa_evidence enable row level security;
alter table hipaa_docs enable row level security;
alter table hipaa_doc_versions enable row level security;
alter table hipaa_policies enable row level security;
alter table hipaa_risks enable row level security;
alter table hipaa_mitigations enable row level security;
alter table hipaa_trainings enable row level security;
alter table hipaa_training_attendance enable row level security;
alter table hipaa_phi_access enable row level security;
alter table hipaa_baas enable row level security;
alter table hipaa_incidents enable row level security;
alter table hipaa_breach_notifications enable row level security;
alter table hipaa_audits enable row level security;
alter table hipaa_tasks enable row level security;
alter table hipaa_audit_log enable row level security;
alter table hipaa_contacts enable row level security;

-- =====================================================
-- RLS POLICIES: hipaa_evidence
-- =====================================================

create policy "Officers, legal, and auditors can view all evidence"
  on hipaa_evidence for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Staff can view evidence they own"
  on hipaa_evidence for select
  using (owner = auth.uid());

create policy "Officers can insert evidence"
  on hipaa_evidence for insert
  with check (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

create policy "Officers and owners can update evidence"
  on hipaa_evidence for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
    or owner = auth.uid()
  );

create policy "Officers and admins can delete evidence"
  on hipaa_evidence for delete
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_docs
-- =====================================================

create policy "Officers, legal, and auditors can view all docs"
  on hipaa_docs for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Staff can view approved docs in training section"
  on hipaa_docs for select
  using (
    section = 'training' 
    and status = 'approved'
  );

create policy "Officers can insert docs"
  on hipaa_docs for insert
  with check (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

create policy "Officers and owners can update docs"
  on hipaa_docs for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal'])
    or owner = auth.uid()
  );

create policy "Officers can delete docs"
  on hipaa_docs for delete
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_doc_versions
-- =====================================================

create policy "Officers, legal, and auditors can view version history"
  on hipaa_doc_versions for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Officers can insert version history"
  on hipaa_doc_versions for insert
  with check (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_policies
-- =====================================================

create policy "Officers, legal, and auditors can view policies"
  on hipaa_policies for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Officers can manage policies"
  on hipaa_policies for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_risks & hipaa_mitigations
-- =====================================================

create policy "Officers, legal, and auditors can view risks"
  on hipaa_risks for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Officers can manage risks"
  on hipaa_risks for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','security_officer'])
  );

create policy "Officers and auditors can view mitigations"
  on hipaa_mitigations for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Officers and assignees can manage mitigations"
  on hipaa_mitigations for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','security_officer'])
    or responsible = auth.uid()
  );

-- =====================================================
-- RLS POLICIES: hipaa_trainings
-- =====================================================

create policy "All authenticated users can view trainings"
  on hipaa_trainings for select
  to authenticated
  using (true);

create policy "Officers can manage trainings"
  on hipaa_trainings for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_training_attendance
-- =====================================================

create policy "Officers and auditors can view all attendance"
  on hipaa_training_attendance for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','auditor'])
  );

create policy "Users can view their own attendance by email"
  on hipaa_training_attendance for select
  using (
    user_email = (select email from auth.users where id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Officers can record attendance"
  on hipaa_training_attendance for insert
  with check (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer'])
  );

create policy "Officers can update attendance"
  on hipaa_training_attendance for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_phi_access
-- =====================================================

create policy "Officers and auditors can view all PHI access logs"
  on hipaa_phi_access for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','auditor'])
  );

create policy "Users can view their own PHI access logs"
  on hipaa_phi_access for select
  using (accessor = auth.uid());

create policy "Authenticated users can log PHI access"
  on hipaa_phi_access for insert
  to authenticated
  with check (accessor = auth.uid());

create policy "Officers can update PHI access logs"
  on hipaa_phi_access for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_baas
-- =====================================================

create policy "Officers, legal, and auditors can view BAAs"
  on hipaa_baas for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Officers and legal can manage BAAs"
  on hipaa_baas for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','legal'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_incidents
-- =====================================================

create policy "Officers and auditors can view all incidents"
  on hipaa_incidents for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','auditor'])
  );

create policy "Assigned users can view their incidents"
  on hipaa_incidents for select
  using (
    assigned_to = auth.uid() or reported_by = auth.uid()
  );

create policy "Authenticated users can report incidents"
  on hipaa_incidents for insert
  to authenticated
  with check (reported_by = auth.uid());

create policy "Officers and assignees can update incidents"
  on hipaa_incidents for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','security_officer'])
    or assigned_to = auth.uid()
  );

create policy "Officers can delete incidents"
  on hipaa_incidents for delete
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_breach_notifications
-- =====================================================

create policy "Officers and auditors can view breach notifications"
  on hipaa_breach_notifications for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','legal','auditor'])
  );

create policy "Officers can manage breach notifications"
  on hipaa_breach_notifications for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_audits
-- =====================================================

create policy "Officers and auditors can view audits"
  on hipaa_audits for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','auditor'])
  );

create policy "Officers can manage audits"
  on hipaa_audits for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','security_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_tasks
-- =====================================================

create policy "Officers and auditors can view all tasks"
  on hipaa_tasks for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','auditor'])
  );

create policy "Users can view tasks assigned to them"
  on hipaa_tasks for select
  using (
    assignee = auth.uid() or created_by = auth.uid()
  );

create policy "Officers can create tasks"
  on hipaa_tasks for insert
  with check (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

create policy "Officers and assignees can update tasks"
  on hipaa_tasks for update
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer'])
    or assignee = auth.uid()
  );

create policy "Officers can delete tasks"
  on hipaa_tasks for delete
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

-- =====================================================
-- RLS POLICIES: hipaa_audit_log
-- =====================================================

create policy "Officers and auditors can view audit log"
  on hipaa_audit_log for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','auditor'])
  );

create policy "System can insert audit log entries"
  on hipaa_audit_log for insert
  to authenticated
  with check (true);

-- =====================================================
-- RLS POLICIES: hipaa_contacts
-- =====================================================

create policy "Officers and auditors can view contacts"
  on hipaa_contacts for select
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

create policy "Officers can manage contacts"
  on hipaa_contacts for all
  using (
    has_any_role(auth.uid(), array['admin','hipaa_officer'])
  );

