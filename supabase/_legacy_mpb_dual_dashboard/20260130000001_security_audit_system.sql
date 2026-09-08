-- ============================================
-- Security Audit System Migration
-- SOC 2 Type II and HIPAA Compliance
-- ============================================

-- ============================================
-- 1. Security Audit Log Table
-- Tamper-evident logging with checksums
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_ip TEXT,
  actor_user_agent TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_actor_id ON security_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource ON security_audit_log(resource_type, resource_id);

-- RLS Policies for security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins and security officers can view all audit logs
CREATE POLICY "security_audit_log_select_admin" ON security_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'cto', 'hipaa_officer', 'security_officer', 'privacy_officer')
    )
  );

-- Only service role can insert (via Edge Functions)
CREATE POLICY "security_audit_log_insert_service" ON security_audit_log
  FOR INSERT TO service_role
  WITH CHECK (true);

-- No updates or deletes allowed (immutable audit log)
-- This is enforced by not creating UPDATE or DELETE policies

COMMENT ON TABLE security_audit_log IS 'Tamper-evident security audit log for SOC 2 and HIPAA compliance';

-- ============================================
-- 2. Security Alert Rules Table
-- Configurable alerting rules
-- ============================================

CREATE TABLE IF NOT EXISTS security_alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  threshold INTEGER,
  time_window_minutes INTEGER DEFAULT 60,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  enabled BOOLEAN DEFAULT true,
  channels TEXT[] DEFAULT '{"slack"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for security_alert_rules
ALTER TABLE security_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_alert_rules_select" ON security_alert_rules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'cto', 'hipaa_officer', 'security_officer')
    )
  );

CREATE POLICY "security_alert_rules_all" ON security_alert_rules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'security_officer')
    )
  );

-- Insert default alert rules
INSERT INTO security_alert_rules (id, name, description, event_types, threshold, time_window_minutes, severity, channels)
VALUES
  ('failed-logins', 'Multiple Failed Login Attempts', 'Alert when 5+ failed logins occur within 15 minutes', ARRAY['LOGIN_FAILED'], 5, 15, 'CRITICAL', ARRAY['slack', 'pagerduty']),
  ('phi-bulk-export', 'PHI Bulk Export', 'Alert when more than 100 PHI records are exported', ARRAY['PHI_EXPORT'], 100, 60, 'WARNING', ARRAY['slack']),
  ('after-hours-phi', 'After-Hours PHI Access', 'Alert on PHI access outside business hours', ARRAY['PHI_VIEW', 'PHI_EXPORT', 'PHI_MODIFY'], NULL, 60, 'WARNING', ARRAY['slack']),
  ('admin-role-change', 'Administrative Role Change', 'Alert when admin or security roles are modified', ARRAY['ROLE_CHANGE'], NULL, 60, 'INFO', ARRAY['slack']),
  ('emergency-access', 'Emergency Access Invoked', 'Alert when break-glass emergency access is used', ARRAY['EMERGENCY_ACCESS'], NULL, 60, 'CRITICAL', ARRAY['slack', 'pagerduty', 'email']),
  ('security-alert', 'Security Alert Triggered', 'Alert on any security alert event', ARRAY['SECURITY_ALERT', 'ACCESS_DENIED'], NULL, 60, 'CRITICAL', ARRAY['slack', 'pagerduty']),
  ('rate-limit', 'Rate Limit Exceeded', 'Alert when rate limiting is triggered', ARRAY['RATE_LIMIT'], NULL, 60, 'CRITICAL', ARRAY['slack', 'pagerduty'])
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE security_alert_rules IS 'Configurable security alerting rules for real-time monitoring';

-- ============================================
-- 3. Access Reviews Table
-- Quarterly user access audits for SOC 2
-- ============================================

CREATE TABLE IF NOT EXISTS access_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_period TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  total_users INTEGER DEFAULT 0,
  reviewed_users INTEGER DEFAULT 0,
  changes_made INTEGER DEFAULT 0,
  attestation_signature TEXT,
  notes TEXT
);

-- RLS Policies for access_reviews
ALTER TABLE access_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_reviews_select" ON access_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'hipaa_officer', 'security_officer', 'privacy_officer')
    )
  );

CREATE POLICY "access_reviews_all" ON access_reviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'hipaa_officer', 'security_officer')
    )
  );

-- User access review details
CREATE TABLE IF NOT EXISTS access_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES access_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT,
  last_login TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')),
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'modified', 'revoked')) DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_review_items_review_id ON access_review_items(review_id);

ALTER TABLE access_review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_review_items_select" ON access_review_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'hipaa_officer', 'security_officer', 'privacy_officer')
    )
  );

CREATE POLICY "access_review_items_all" ON access_review_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'hipaa_officer', 'security_officer')
    )
  );

COMMENT ON TABLE access_reviews IS 'Quarterly access review records for SOC 2 compliance';
COMMENT ON TABLE access_review_items IS 'Individual user review items within an access review';

-- ============================================
-- 4. Change Requests Table
-- Change management tracking
-- ============================================

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'implemented', 'rolled_back')) DEFAULT 'draft',
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  category TEXT DEFAULT 'Feature',
  affected_systems TEXT[] DEFAULT '{}',
  implementation_date TIMESTAMPTZ,
  rollback_plan TEXT,
  testing_notes TEXT,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  implementation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_requester ON change_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_created_at ON change_requests(created_at DESC);

-- RLS Policies for change_requests
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view change requests
CREATE POLICY "change_requests_select" ON change_requests
  FOR SELECT TO authenticated
  USING (true);

-- Users can create their own change requests
CREATE POLICY "change_requests_insert" ON change_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Admins and security officers can update any change request
CREATE POLICY "change_requests_update_admin" ON change_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'cto', 'security_officer')
    )
  );

-- Users can update their own pending/draft change requests
CREATE POLICY "change_requests_update_own" ON change_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = requester_id
    AND status IN ('draft', 'pending')
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_change_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS change_request_update_timestamp ON change_requests;
CREATE TRIGGER change_request_update_timestamp
  BEFORE UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_change_request_timestamp();

COMMENT ON TABLE change_requests IS 'Change request tracking for SOC 2 change management compliance';

-- ============================================
-- 5. Trigger for Sensitive Table Access Logging
-- Automatically log PHI access
-- ============================================

CREATE OR REPLACE FUNCTION log_phi_table_access()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_action TEXT;
BEGIN
  -- Determine event type based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN v_event_type := 'PHI_MODIFY'; v_action := 'PHI record created';
    WHEN 'UPDATE' THEN v_event_type := 'PHI_MODIFY'; v_action := 'PHI record updated';
    WHEN 'DELETE' THEN v_event_type := 'PHI_DELETE'; v_action := 'PHI record deleted';
    ELSE RETURN NULL;
  END CASE;

  -- Insert audit log entry
  INSERT INTO security_audit_log (
    event_type,
    severity,
    actor_id,
    resource_type,
    resource_id,
    action,
    details
  ) VALUES (
    v_event_type,
    CASE WHEN TG_OP = 'DELETE' THEN 'CRITICAL' ELSE 'WARNING' END,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_action,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to PHI-related tables if they exist
DO $$
BEGIN
  -- hipaa_phi_access table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hipaa_phi_access') THEN
    DROP TRIGGER IF EXISTS log_hipaa_phi_access ON hipaa_phi_access;
    CREATE TRIGGER log_hipaa_phi_access
      AFTER INSERT OR UPDATE OR DELETE ON hipaa_phi_access
      FOR EACH ROW
      EXECUTE FUNCTION log_phi_table_access();
  END IF;

  -- member_profiles table (if it contains PHI)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_profiles') THEN
    DROP TRIGGER IF EXISTS log_member_profiles_phi ON member_profiles;
    CREATE TRIGGER log_member_profiles_phi
      AFTER INSERT OR UPDATE OR DELETE ON member_profiles
      FOR EACH ROW
      EXECUTE FUNCTION log_phi_table_access();
  END IF;
END $$;

COMMENT ON FUNCTION log_phi_table_access IS 'Automatically log access to PHI tables for HIPAA compliance';

-- ============================================
-- 6. Compliance Settings Extension
-- Add security-related settings keys
-- ============================================

-- Ensure compliance_settings table exists
-- Insert security-related settings (compliance_settings table already exists from HIPAA migration)
INSERT INTO compliance_settings (key, value, description)
VALUES
  ('slack_webhook_url', '{"enabled": false, "url": ""}'::jsonb, 'Slack webhook URL for security alerts'),
  ('pagerduty_routing_key', '{"enabled": false, "key": ""}'::jsonb, 'PagerDuty routing key for critical alerts'),
  ('security_officer_email', '{"email": ""}'::jsonb, 'Email address for security officer notifications'),
  ('security_alert_webhook', '{"enabled": false, "url": ""}'::jsonb, 'Custom webhook URL for security alerts'),
  ('session_timeout_minutes', '{"value": 15}'::jsonb, 'Default session timeout in minutes (HIPAA compliance)'),
  ('session_warning_seconds', '{"value": 60}'::jsonb, 'Warning before session timeout in seconds'),
  ('phi_encryption_enabled', '{"value": true}'::jsonb, 'Enable PHI field-level encryption')
ON CONFLICT (key) DO NOTHING;

-- RLS for compliance_settings
ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_settings_select" ON compliance_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'hipaa_officer', 'security_officer', 'privacy_officer')
    )
  );

CREATE POLICY "compliance_settings_all" ON compliance_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'security_officer')
    )
  );

-- ============================================
-- Grant permissions to service role
-- ============================================

GRANT ALL ON security_audit_log TO service_role;
GRANT ALL ON security_alert_rules TO service_role;
GRANT ALL ON access_reviews TO service_role;
GRANT ALL ON access_review_items TO service_role;
GRANT ALL ON change_requests TO service_role;
GRANT ALL ON compliance_settings TO service_role;
