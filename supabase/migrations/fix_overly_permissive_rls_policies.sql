-- ============================================================
-- Migration: fix_overly_permissive_rls_policies
-- ============================================================
-- PROBLEM: 85 RLS policies across 45+ tables use `true` as their
-- USING/WITH CHECK expression, making them fully permissive.
-- 27 tables have BOTH `true` AND auth.uid()-based policies,
-- which means the auth checks are dead code (PERMISSIVE OR logic).
--
-- FIX: Drop all `true`-based policies and replace with proper
-- role-based checks using is_admin_user(auth.uid()).
--
-- ACCESS PATTERNS:
--   A) Admin full access — is_admin_user(auth.uid()) for ALL ops
--   B) Read-all, write-admin — auth check for SELECT, admin for writes
--   C) User-scoped — users access own rows (notifications, profiles)
--   D) Audit logs — any authenticated can INSERT, admin can SELECT
-- ============================================================

-- ============================================================
-- PHASE 1: Drop ALL overly permissive (true) policies
-- ============================================================

-- ai_agents
DROP POLICY IF EXISTS "Users can manage ai agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can read ai agents" ON ai_agents;

-- api_statuses
DROP POLICY IF EXISTS "authenticated_manage_api_statuses" ON api_statuses;

-- app_role_access
DROP POLICY IF EXISTS "Authenticated users can view app role access" ON app_role_access;

-- assignments (contradictory: has auth.uid() UPDATE + true ALL)
DROP POLICY IF EXISTS "Authenticated users can manage assignments" ON assignments;

-- cancelation_reason_categories (contradictory: has admin ALL + true SELECT)
DROP POLICY IF EXISTS "All authenticated users can view cancelation reasons" ON cancelation_reason_categories;

-- career_development_plans
DROP POLICY IF EXISTS "Authenticated users can manage career development plans" ON career_development_plans;

-- change_requests
DROP POLICY IF EXISTS "change_requests_select" ON change_requests;

-- concierge_data_quality_log
DROP POLICY IF EXISTS "quality_log_insert" ON concierge_data_quality_log;
DROP POLICY IF EXISTS "quality_log_select" ON concierge_data_quality_log;

-- concierge_upload_errors
DROP POLICY IF EXISTS "upload_errors_insert" ON concierge_upload_errors;
DROP POLICY IF EXISTS "upload_errors_select" ON concierge_upload_errors;

-- department_metrics
DROP POLICY IF EXISTS "Authenticated users can manage department metrics" ON department_metrics;

-- department_relationships
DROP POLICY IF EXISTS "Authenticated users can manage department relationships" ON department_relationships;

-- department_uploads (contradictory: has user-scoped policies + true policies)
DROP POLICY IF EXISTS "department_uploads_insert_all" ON department_uploads;
DROP POLICY IF EXISTS "department_uploads_select_all" ON department_uploads;
DROP POLICY IF EXISTS "department_uploads_update_all" ON department_uploads;

-- department_workflows
DROP POLICY IF EXISTS "Authenticated users can manage department workflows" ON department_workflows;

-- departments
DROP POLICY IF EXISTS "Authenticated users can manage departments" ON departments;

-- deployment_logs
DROP POLICY IF EXISTS "Users can manage deployment logs" ON deployment_logs;
DROP POLICY IF EXISTS "Users can read deployment logs" ON deployment_logs;

-- employee_kpis
DROP POLICY IF EXISTS "Authenticated users can manage employee kpis" ON employee_kpis;

-- employee_profiles
DROP POLICY IF EXISTS "Authenticated users can manage employee profiles" ON employee_profiles;

-- feedback_entries
DROP POLICY IF EXISTS "Authenticated users can insert feedback entries" ON feedback_entries;
DROP POLICY IF EXISTS "Authenticated users can read feedback entries" ON feedback_entries;

-- hipaa_audit_log
DROP POLICY IF EXISTS "System can insert audit log entries" ON hipaa_audit_log;

-- hipaa_trainings (contradictory: has officer ALL + true SELECT)
DROP POLICY IF EXISTS "All authenticated users can view trainings" ON hipaa_trainings;

-- kpi_data
DROP POLICY IF EXISTS "Users can manage all dashboard data" ON kpi_data;
DROP POLICY IF EXISTS "Users can read all dashboard data" ON kpi_data;

-- kpi_definitions
DROP POLICY IF EXISTS "Authenticated users can manage kpi definitions" ON kpi_definitions;

-- learning_activities
DROP POLICY IF EXISTS "Authenticated users can manage learning activities" ON learning_activities;

-- marketing_metrics
DROP POLICY IF EXISTS "Authenticated users can manage marketing metrics" ON marketing_metrics;

-- marketing_properties
DROP POLICY IF EXISTS "Authenticated users can manage marketing properties" ON marketing_properties;

-- member_enrollments
DROP POLICY IF EXISTS "Authenticated users can delete member enrollments" ON member_enrollments;
DROP POLICY IF EXISTS "Authenticated users can insert member enrollments" ON member_enrollments;
DROP POLICY IF EXISTS "Authenticated users can read member enrollments" ON member_enrollments;
DROP POLICY IF EXISTS "Authenticated users can update member enrollments" ON member_enrollments;

-- member_status_updates
DROP POLICY IF EXISTS "Authenticated users can insert member status updates" ON member_status_updates;
DROP POLICY IF EXISTS "Authenticated users can read member status updates" ON member_status_updates;

-- note_notifications (contradictory: has auth.uid() UPDATE + true INSERT)
DROP POLICY IF EXISTS "notifications_insert" ON note_notifications;

-- notifications (contradictory: has auth.uid() UPDATE + true INSERT)
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- org_chart_positions
DROP POLICY IF EXISTS "Authenticated users can manage org chart positions" ON org_chart_positions;

-- performance_reviews
DROP POLICY IF EXISTS "Authenticated users can manage performance reviews" ON performance_reviews;

-- policy_document_history
DROP POLICY IF EXISTS "All authenticated users can view policy history" ON policy_document_history;
DROP POLICY IF EXISTS "Authenticated users can create history entries" ON policy_document_history;

-- policy_documents
DROP POLICY IF EXISTS "All authenticated users can read policies" ON policy_documents;

-- profiles (contradictory: has auth.uid() UPDATE + true ALL)
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- projects
DROP POLICY IF EXISTS "Users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can read projects" ON projects;

-- quick_links (contradictory: has created_by=auth.uid() ALL + true ALL)
DROP POLICY IF EXISTS "authenticated_manage_quick_links" ON quick_links;

-- roadmap_items
DROP POLICY IF EXISTS "Users can manage roadmap items" ON roadmap_items;
DROP POLICY IF EXISTS "Users can read roadmap items" ON roadmap_items;

-- roles
DROP POLICY IF EXISTS "All authenticated users can view roles" ON roles;

-- saas_expenses
DROP POLICY IF EXISTS "Authenticated users can delete saas expenses" ON saas_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert saas expenses" ON saas_expenses;
DROP POLICY IF EXISTS "Authenticated users can read saas expenses" ON saas_expenses;
DROP POLICY IF EXISTS "Authenticated users can update saas expenses" ON saas_expenses;

-- security_audit_log
DROP POLICY IF EXISTS "security_audit_log_insert_service" ON security_audit_log;

-- stg_concierge_after_hours
DROP POLICY IF EXISTS "staging_after_hours_insert" ON stg_concierge_after_hours;
DROP POLICY IF EXISTS "staging_after_hours_select" ON stg_concierge_after_hours;

-- stg_concierge_daily_interactions
DROP POLICY IF EXISTS "staging_daily_insert" ON stg_concierge_daily_interactions;
DROP POLICY IF EXISTS "staging_daily_select" ON stg_concierge_daily_interactions;

-- stg_concierge_weekly_metrics
DROP POLICY IF EXISTS "staging_weekly_insert" ON stg_concierge_weekly_metrics;
DROP POLICY IF EXISTS "staging_weekly_select" ON stg_concierge_weekly_metrics;

-- team_members
DROP POLICY IF EXISTS "authenticated_manage_team_members" ON team_members;

-- technologies
DROP POLICY IF EXISTS "All users view technologies" ON technologies;

-- ticket_assignment_links
DROP POLICY IF EXISTS "Authenticated users can create ticket-assignment links" ON ticket_assignment_links;
DROP POLICY IF EXISTS "Authenticated users can delete ticket-assignment links" ON ticket_assignment_links;
DROP POLICY IF EXISTS "Authenticated users can view ticket-assignment links" ON ticket_assignment_links;

-- ticket_notifications
DROP POLICY IF EXISTS "Service can create notifications" ON ticket_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON ticket_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON ticket_notifications;

-- ticket_project_links
DROP POLICY IF EXISTS "Authenticated users can create ticket-project links" ON ticket_project_links;
DROP POLICY IF EXISTS "Authenticated users can delete ticket-project links" ON ticket_project_links;
DROP POLICY IF EXISTS "Authenticated users can view ticket-project links" ON ticket_project_links;

-- ticket_sync_log
DROP POLICY IF EXISTS "Authenticated users can view sync logs" ON ticket_sync_log;
DROP POLICY IF EXISTS "Service can insert sync logs" ON ticket_sync_log;

-- ticketing_system_config
DROP POLICY IF EXISTS "Authenticated users can manage config" ON ticketing_system_config;
DROP POLICY IF EXISTS "Authenticated users can view config" ON ticketing_system_config;

-- tickets_cache
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON tickets_cache;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON tickets_cache;
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets_cache;

-- users (contradictory: has auth.uid() UPDATE + true SELECT)
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;

-- vendors
DROP POLICY IF EXISTS "Users can manage vendors" ON vendors;
DROP POLICY IF EXISTS "Users can read vendors" ON vendors;

-- workflow_steps
DROP POLICY IF EXISTS "Authenticated users can manage workflow steps" ON workflow_steps;


-- ============================================================
-- PHASE 2: Create proper replacement policies
-- ============================================================

-- -----------------------------------------------
-- PATTERN A: Admin full access (FOR ALL)
-- Tables: dashboard data, HR, staging, config
-- -----------------------------------------------

CREATE POLICY "admin_all_ai_agents"
  ON ai_agents FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_api_statuses"
  ON api_statuses FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_career_development_plans"
  ON career_development_plans FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_department_metrics"
  ON department_metrics FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_department_relationships"
  ON department_relationships FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_department_uploads"
  ON department_uploads FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_department_workflows"
  ON department_workflows FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_departments"
  ON departments FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_deployment_logs"
  ON deployment_logs FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_employee_kpis"
  ON employee_kpis FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_employee_profiles"
  ON employee_profiles FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_kpi_data"
  ON kpi_data FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_kpi_definitions"
  ON kpi_definitions FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_learning_activities"
  ON learning_activities FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_marketing_metrics"
  ON marketing_metrics FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_marketing_properties"
  ON marketing_properties FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_member_enrollments"
  ON member_enrollments FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_member_status_updates"
  ON member_status_updates FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_org_chart_positions"
  ON org_chart_positions FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_performance_reviews"
  ON performance_reviews FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_saas_expenses"
  ON saas_expenses FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_team_members"
  ON team_members FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_ticketing_config"
  ON ticketing_system_config FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_tickets_cache"
  ON tickets_cache FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_vendors"
  ON vendors FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_workflow_steps"
  ON workflow_steps FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_stg_after_hours"
  ON stg_concierge_after_hours FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_stg_daily"
  ON stg_concierge_daily_interactions FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_stg_weekly"
  ON stg_concierge_weekly_metrics FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

-- -----------------------------------------------
-- PATTERN B: Read all authenticated, write admin
-- Tables: reference/lookup data, shared resources
-- -----------------------------------------------

-- app_role_access (read-only reference)
CREATE POLICY "auth_select_app_role_access"
  ON app_role_access FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- cancelation_reason_categories (read for all; existing admin ALL policy handles writes)
CREATE POLICY "auth_select_cancelation_reasons"
  ON cancelation_reason_categories FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- change_requests
CREATE POLICY "auth_select_change_requests"
  ON change_requests FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_change_requests"
  ON change_requests FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_update_change_requests"
  ON change_requests FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_change_requests"
  ON change_requests FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- feedback_entries (anyone can read and submit)
CREATE POLICY "auth_select_feedback"
  ON feedback_entries FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_feedback"
  ON feedback_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- hipaa_trainings (read for all; existing officer ALL policy handles writes)
CREATE POLICY "auth_select_hipaa_trainings"
  ON hipaa_trainings FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- policy_documents
CREATE POLICY "auth_select_policy_docs"
  ON policy_documents FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_policy_docs"
  ON policy_documents FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_update_policy_docs"
  ON policy_documents FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_policy_docs"
  ON policy_documents FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- policy_document_history
CREATE POLICY "auth_select_policy_history"
  ON policy_document_history FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_policy_history"
  ON policy_document_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- roles (read-only lookup)
CREATE POLICY "auth_select_roles"
  ON roles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- technologies (read all, write admin)
CREATE POLICY "auth_select_technologies"
  ON technologies FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_technologies"
  ON technologies FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_update_technologies"
  ON technologies FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_technologies"
  ON technologies FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ticket_assignment_links
CREATE POLICY "auth_select_ticket_assignments"
  ON ticket_assignment_links FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_ticket_assignments"
  ON ticket_assignment_links FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_ticket_assignments"
  ON ticket_assignment_links FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ticket_project_links
CREATE POLICY "auth_select_ticket_projects"
  ON ticket_project_links FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_ticket_projects"
  ON ticket_project_links FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_ticket_projects"
  ON ticket_project_links FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ticket_sync_log
CREATE POLICY "auth_select_sync_log"
  ON ticket_sync_log FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_sync_log"
  ON ticket_sync_log FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- users (read all authenticated; existing auth.uid() UPDATE policy stays)
CREATE POLICY "auth_select_users"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------
-- PATTERN C: User-scoped & special handling
-- -----------------------------------------------

-- assignments: SELECT all (dashboard), INSERT/DELETE admin
-- (existing "Users can update their assignments" auth.uid() UPDATE policy stays)
CREATE POLICY "auth_select_assignments"
  ON assignments FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_assignments"
  ON assignments FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_assignments"
  ON assignments FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- profiles: SELECT all (needed for role lookups), INSERT/DELETE admin
-- (existing "profiles_update_policy" auth.uid()/admin UPDATE policy stays)
CREATE POLICY "auth_select_profiles"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_profiles"
  ON profiles FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- projects: SELECT all, write admin
CREATE POLICY "auth_select_projects"
  ON projects FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_update_projects"
  ON projects FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_projects"
  ON projects FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- quick_links: existing "Users manage own quick links" (created_by=auth.uid())
-- covers ALL ops for own links — no replacement needed

-- roadmap_items: SELECT all, write admin
CREATE POLICY "auth_select_roadmap"
  ON roadmap_items FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_insert_roadmap"
  ON roadmap_items FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_update_roadmap"
  ON roadmap_items FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "admin_delete_roadmap"
  ON roadmap_items FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- notifications: SELECT/UPDATE own (existing UPDATE stays), INSERT admin
-- (service_role bypasses RLS so backend notifications still work)
CREATE POLICY "user_select_own_notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admin_insert_notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- note_notifications: SELECT own, INSERT admin
-- (existing "notifications_update" auth.uid() UPDATE policy stays)
CREATE POLICY "user_select_own_note_notifications"
  ON note_notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());
CREATE POLICY "admin_insert_note_notifications"
  ON note_notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- ticket_notifications: SELECT/UPDATE own, INSERT admin
CREATE POLICY "user_select_own_ticket_notifications"
  ON ticket_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_update_own_ticket_notifications"
  ON ticket_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_insert_ticket_notifications"
  ON ticket_notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- -----------------------------------------------
-- PATTERN D: Audit logs (any auth INSERT, admin SELECT)
-- -----------------------------------------------

CREATE POLICY "auth_insert_hipaa_audit"
  ON hipaa_audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin_select_hipaa_audit"
  ON hipaa_audit_log FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "auth_insert_security_audit"
  ON security_audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin_select_security_audit"
  ON security_audit_log FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_quality_log"
  ON concierge_data_quality_log FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_all_upload_errors"
  ON concierge_upload_errors FOR ALL TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
