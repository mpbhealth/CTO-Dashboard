/*
  # Fix Performance and Security Issues

  ## Changes Made
  
  ### 1. Add Missing Foreign Key Indexes
  - Add indexes for all unindexed foreign keys to improve join performance
  
  ### 2. Optimize RLS Policies
  - Replace `auth.uid()` with `(select auth.uid())` in all policies
  - This prevents re-evaluation of auth functions for each row
  
  ### 3. Fix Function Security
  - Add explicit search_path to security definer functions
  - Prevents search_path manipulation attacks
  
  ### 4. Consolidate Duplicate Policies
  - Remove overlapping permissive policies where possible
  - Keep functionality while reducing policy evaluation overhead
*/

-- =====================================================
-- PART 1: Add Missing Foreign Key Indexes
-- =====================================================

-- compliance_settings
CREATE INDEX IF NOT EXISTS idx_compliance_settings_updated_by ON compliance_settings(updated_by);

-- hipaa_audits
CREATE INDEX IF NOT EXISTS idx_hipaa_audits_owner ON hipaa_audits(owner);

-- hipaa_baas
CREATE INDEX IF NOT EXISTS idx_hipaa_baas_owner ON hipaa_baas(owner);

-- hipaa_doc_versions
CREATE INDEX IF NOT EXISTS idx_hipaa_doc_versions_changed_by ON hipaa_doc_versions(changed_by);

-- hipaa_docs
CREATE INDEX IF NOT EXISTS idx_hipaa_docs_approver ON hipaa_docs(approver);
CREATE INDEX IF NOT EXISTS idx_hipaa_docs_owner ON hipaa_docs(owner);

-- hipaa_incidents
CREATE INDEX IF NOT EXISTS idx_hipaa_incidents_assigned_to ON hipaa_incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_hipaa_incidents_reported_by ON hipaa_incidents(reported_by);

-- hipaa_mitigations
CREATE INDEX IF NOT EXISTS idx_hipaa_mitigations_responsible ON hipaa_mitigations(responsible);
CREATE INDEX IF NOT EXISTS idx_hipaa_mitigations_risk_id ON hipaa_mitigations(risk_id);

-- hipaa_policies
CREATE INDEX IF NOT EXISTS idx_hipaa_policies_owner ON hipaa_policies(owner);

-- hipaa_tasks
CREATE INDEX IF NOT EXISTS idx_hipaa_tasks_created_by ON hipaa_tasks(created_by);

-- hipaa_training_attendance
CREATE INDEX IF NOT EXISTS idx_hipaa_training_attendance_user_id ON hipaa_training_attendance(user_id);

-- hipaa_trainings
CREATE INDEX IF NOT EXISTS idx_hipaa_trainings_owner ON hipaa_trainings(owner);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);

-- =====================================================
-- PART 2: Fix Security Definer Functions
-- =====================================================

-- Update has_role with explicit search_path
CREATE OR REPLACE FUNCTION has_role(u uuid, r text)
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select exists(
    select 1 from v_current_roles
    where user_id = u and role = r
  );
$$;

-- Update has_any_role with explicit search_path
CREATE OR REPLACE FUNCTION has_any_role(u uuid, roles text[])
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select exists(
    select 1 from v_current_roles
    where user_id = u and role = any(roles)
  );
$$;

-- Update current_user_roles with explicit search_path
CREATE OR REPLACE FUNCTION current_user_roles()
RETURNS table(role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select role from v_current_roles where user_id = auth.uid();
$$;

-- Update check_storage_access with explicit search_path (if exists)
CREATE OR REPLACE FUNCTION check_storage_access(bucket_id text, object_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  select has_any_role(auth.uid(), array['admin','hipaa_officer','privacy_officer','security_officer']);
$$;

-- Update log_settings_change with explicit search_path (if exists)
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO hipaa_audit_log (actor, action, object_table, object_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 3: Optimize RLS Policies - profiles table
-- =====================================================

DROP POLICY IF EXISTS "Users can view all profiles if they have officer/admin/legal/au" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Officers and admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Officers and admins can insert profiles" ON profiles;

CREATE POLICY "Users can view all profiles if authenticated with officer role"
  ON profiles FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
    OR user_id = (select auth.uid())
  );

CREATE POLICY "Officers and admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

CREATE POLICY "Officers and admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

-- =====================================================
-- PART 4: Optimize RLS Policies - user_roles table
-- =====================================================

DROP POLICY IF EXISTS "Officers and admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;

CREATE POLICY "Users can view user roles"
  ON user_roles FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
    OR user_id = (select auth.uid())
  );

CREATE POLICY "Only admins can manage user roles"
  ON user_roles FOR ALL
  USING (has_role((select auth.uid()), 'admin'))
  WITH CHECK (has_role((select auth.uid()), 'admin'));

-- =====================================================
-- PART 5: Optimize RLS Policies - hipaa_evidence table
-- =====================================================

DROP POLICY IF EXISTS "Officers, legal, and auditors can view all evidence" ON hipaa_evidence;
DROP POLICY IF EXISTS "Staff can view evidence they own" ON hipaa_evidence;
DROP POLICY IF EXISTS "Officers can insert evidence" ON hipaa_evidence;
DROP POLICY IF EXISTS "Officers and owners can update evidence" ON hipaa_evidence;
DROP POLICY IF EXISTS "Officers and admins can delete evidence" ON hipaa_evidence;

CREATE POLICY "Users can view evidence"
  ON hipaa_evidence FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
    OR owner = (select auth.uid())
  );

CREATE POLICY "Officers can insert evidence"
  ON hipaa_evidence FOR INSERT
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

CREATE POLICY "Officers and owners can update evidence"
  ON hipaa_evidence FOR UPDATE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
    OR owner = (select auth.uid())
  );

CREATE POLICY "Officers and admins can delete evidence"
  ON hipaa_evidence FOR DELETE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

-- =====================================================
-- PART 6: Optimize RLS Policies - hipaa_docs table
-- =====================================================

DROP POLICY IF EXISTS "Officers, legal, and auditors can view all docs" ON hipaa_docs;
DROP POLICY IF EXISTS "Staff can view approved docs in training section" ON hipaa_docs;
DROP POLICY IF EXISTS "Officers can insert docs" ON hipaa_docs;
DROP POLICY IF EXISTS "Officers and owners can update docs" ON hipaa_docs;
DROP POLICY IF EXISTS "Officers can delete docs" ON hipaa_docs;

CREATE POLICY "Users can view docs"
  ON hipaa_docs FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
    OR (section = 'training' AND status = 'approved')
  );

CREATE POLICY "Officers can insert docs"
  ON hipaa_docs FOR INSERT
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

CREATE POLICY "Officers and owners can update docs"
  ON hipaa_docs FOR UPDATE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
    OR owner = (select auth.uid())
  );

CREATE POLICY "Officers can delete docs"
  ON hipaa_docs FOR DELETE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

-- =====================================================
-- PART 7: Optimize RLS Policies - hipaa_doc_versions
-- =====================================================

DROP POLICY IF EXISTS "Officers, legal, and auditors can view version history" ON hipaa_doc_versions;
DROP POLICY IF EXISTS "Officers can insert version history" ON hipaa_doc_versions;

CREATE POLICY "Users can view version history"
  ON hipaa_doc_versions FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

CREATE POLICY "Officers can insert version history"
  ON hipaa_doc_versions FOR INSERT
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

-- =====================================================
-- PART 8: Optimize RLS Policies - hipaa_policies
-- =====================================================

DROP POLICY IF EXISTS "Officers, legal, and auditors can view policies" ON hipaa_policies;
DROP POLICY IF EXISTS "Officers can manage policies" ON hipaa_policies;

CREATE POLICY "Users can view policies"
  ON hipaa_policies FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

CREATE POLICY "Officers can manage policies"
  ON hipaa_policies FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- PART 9: Optimize RLS Policies - hipaa_risks
-- =====================================================

DROP POLICY IF EXISTS "Officers, legal, and auditors can view risks" ON hipaa_risks;
DROP POLICY IF EXISTS "Officers can manage risks" ON hipaa_risks;

CREATE POLICY "Users can view risks"
  ON hipaa_risks FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','legal','auditor'])
  );

CREATE POLICY "Officers can manage risks"
  ON hipaa_risks FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
  );

-- =====================================================
-- PART 10: Optimize RLS Policies - hipaa_mitigations
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view mitigations" ON hipaa_mitigations;
DROP POLICY IF EXISTS "Officers and assignees can manage mitigations" ON hipaa_mitigations;

CREATE POLICY "Users can view mitigations"
  ON hipaa_mitigations FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer','auditor'])
    OR responsible = (select auth.uid())
  );

CREATE POLICY "Officers and assignees can manage mitigations"
  ON hipaa_mitigations FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
    OR responsible = (select auth.uid())
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
    OR responsible = (select auth.uid())
  );

-- =====================================================
-- PART 11: Optimize RLS Policies - hipaa_trainings
-- =====================================================

DROP POLICY IF EXISTS "All authenticated users can view trainings" ON hipaa_trainings;
DROP POLICY IF EXISTS "Officers can manage trainings" ON hipaa_trainings;

CREATE POLICY "All authenticated users can view trainings"
  ON hipaa_trainings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers can manage trainings"
  ON hipaa_trainings FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- PART 12: Optimize RLS Policies - hipaa_training_attendance
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view all attendance" ON hipaa_training_attendance;
DROP POLICY IF EXISTS "Users can view their own attendance by email" ON hipaa_training_attendance;
DROP POLICY IF EXISTS "Officers can record attendance" ON hipaa_training_attendance;
DROP POLICY IF EXISTS "Officers can update attendance" ON hipaa_training_attendance;

CREATE POLICY "Users can view attendance"
  ON hipaa_training_attendance FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','auditor'])
    OR user_id = (select auth.uid())
    OR user_email = (select auth.email())
  );

CREATE POLICY "Officers can manage attendance"
  ON hipaa_training_attendance FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- PART 13: Optimize RLS Policies - hipaa_phi_access
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view all PHI access logs" ON hipaa_phi_access;
DROP POLICY IF EXISTS "Users can view their own PHI access logs" ON hipaa_phi_access;
DROP POLICY IF EXISTS "Authenticated users can log PHI access" ON hipaa_phi_access;
DROP POLICY IF EXISTS "Officers can update PHI access logs" ON hipaa_phi_access;

CREATE POLICY "Users can view PHI access logs"
  ON hipaa_phi_access FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','auditor'])
    OR accessor = (select auth.uid())
  );

CREATE POLICY "Authenticated users can log PHI access"
  ON hipaa_phi_access FOR INSERT
  TO authenticated
  WITH CHECK (accessor = (select auth.uid()));

CREATE POLICY "Officers can update PHI access logs"
  ON hipaa_phi_access FOR UPDATE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- PART 14: Optimize RLS Policies - hipaa_baas
-- =====================================================

DROP POLICY IF EXISTS "Officers, legal, and auditors can view BAAs" ON hipaa_baas;
DROP POLICY IF EXISTS "Officers and legal can manage BAAs" ON hipaa_baas;

CREATE POLICY "Users can view BAAs"
  ON hipaa_baas FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','legal','auditor'])
  );

CREATE POLICY "Officers and legal can manage BAAs"
  ON hipaa_baas FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','legal'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','legal'])
  );

-- =====================================================
-- PART 15: Optimize RLS Policies - hipaa_incidents
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view all incidents" ON hipaa_incidents;
DROP POLICY IF EXISTS "Assigned users can view their incidents" ON hipaa_incidents;
DROP POLICY IF EXISTS "Authenticated users can report incidents" ON hipaa_incidents;
DROP POLICY IF EXISTS "Officers and assignees can update incidents" ON hipaa_incidents;
DROP POLICY IF EXISTS "Officers can delete incidents" ON hipaa_incidents;

CREATE POLICY "Users can view incidents"
  ON hipaa_incidents FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer','auditor'])
    OR assigned_to = (select auth.uid())
    OR reported_by = (select auth.uid())
  );

CREATE POLICY "Authenticated users can report incidents"
  ON hipaa_incidents FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = (select auth.uid()));

CREATE POLICY "Officers and assignees can update incidents"
  ON hipaa_incidents FOR UPDATE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
    OR assigned_to = (select auth.uid())
  );

CREATE POLICY "Officers can delete incidents"
  ON hipaa_incidents FOR DELETE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

-- =====================================================
-- PART 16: Optimize RLS Policies - hipaa_breach_notifications
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view breach notifications" ON hipaa_breach_notifications;
DROP POLICY IF EXISTS "Officers can manage breach notifications" ON hipaa_breach_notifications;

CREATE POLICY "Users can view breach notifications"
  ON hipaa_breach_notifications FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','auditor'])
  );

CREATE POLICY "Officers can manage breach notifications"
  ON hipaa_breach_notifications FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer'])
  );

-- =====================================================
-- PART 17: Optimize RLS Policies - hipaa_audits
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view audits" ON hipaa_audits;
DROP POLICY IF EXISTS "Officers can manage audits" ON hipaa_audits;

CREATE POLICY "Users can view audits"
  ON hipaa_audits FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer','auditor'])
  );

CREATE POLICY "Officers can manage audits"
  ON hipaa_audits FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','security_officer'])
  );

-- =====================================================
-- PART 18: Optimize RLS Policies - hipaa_tasks
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view all tasks" ON hipaa_tasks;
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON hipaa_tasks;
DROP POLICY IF EXISTS "Officers can create tasks" ON hipaa_tasks;
DROP POLICY IF EXISTS "Officers and assignees can update tasks" ON hipaa_tasks;
DROP POLICY IF EXISTS "Officers can delete tasks" ON hipaa_tasks;

CREATE POLICY "Users can view tasks"
  ON hipaa_tasks FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','auditor'])
    OR assignee = (select auth.uid())
  );

CREATE POLICY "Officers can create tasks"
  ON hipaa_tasks FOR INSERT
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
  );

CREATE POLICY "Officers and assignees can update tasks"
  ON hipaa_tasks FOR UPDATE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer'])
    OR assignee = (select auth.uid())
  );

CREATE POLICY "Officers can delete tasks"
  ON hipaa_tasks FOR DELETE
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

-- =====================================================
-- PART 19: Optimize RLS Policies - hipaa_audit_log
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view audit log" ON hipaa_audit_log;

CREATE POLICY "Officers and auditors can view audit log"
  ON hipaa_audit_log FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','auditor'])
  );

-- =====================================================
-- PART 20: Optimize RLS Policies - hipaa_contacts
-- =====================================================

DROP POLICY IF EXISTS "Officers and auditors can view contacts" ON hipaa_contacts;
DROP POLICY IF EXISTS "Officers can manage contacts" ON hipaa_contacts;

CREATE POLICY "Users can view contacts"
  ON hipaa_contacts FOR SELECT
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer','privacy_officer','security_officer','auditor'])
  );

CREATE POLICY "Officers can manage contacts"
  ON hipaa_contacts FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );

-- =====================================================
-- PART 21: Optimize RLS Policies - compliance_settings
-- =====================================================

DROP POLICY IF EXISTS "Officers can view settings" ON compliance_settings;
DROP POLICY IF EXISTS "Officers can manage settings" ON compliance_settings;

CREATE POLICY "Officers can view and manage settings"
  ON compliance_settings FOR ALL
  USING (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  )
  WITH CHECK (
    has_any_role((select auth.uid()), array['admin','hipaa_officer'])
  );