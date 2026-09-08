-- ============================================
-- Emergency Access Log Migration
-- HIPAA Break-Glass Procedure Support
-- ============================================

-- Emergency Access Log Table
CREATE TABLE IF NOT EXISTS emergency_access_log (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_access_log_user_id ON emergency_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_access_log_status ON emergency_access_log(status);
CREATE INDEX IF NOT EXISTS idx_emergency_access_log_expires_at ON emergency_access_log(expires_at);

-- RLS Policies
ALTER TABLE emergency_access_log ENABLE ROW LEVEL SECURITY;

-- Security officers and admins can view all emergency access logs
CREATE POLICY "emergency_access_log_select" ON emergency_access_log
  FOR SELECT TO authenticated
  USING (
    -- User can see their own emergency access
    auth.uid() = user_id
    OR
    -- Security officers can see all
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'ceo', 'hipaa_officer', 'security_officer')
    )
  );

-- Only authenticated users can insert (for their own requests)
CREATE POLICY "emergency_access_log_insert" ON emergency_access_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only security officers can update (to revoke access)
CREATE POLICY "emergency_access_log_update" ON emergency_access_log
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'security_officer')
    )
  );

-- Grant to service role
GRANT ALL ON emergency_access_log TO service_role;

COMMENT ON TABLE emergency_access_log IS 'Break-glass emergency access log for HIPAA compliance';

-- ============================================
-- Function to auto-expire emergency access
-- ============================================

CREATE OR REPLACE FUNCTION expire_emergency_access()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE emergency_access_log
  SET status = 'expired'
  WHERE status = 'active'
  AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function that can be called via pg_cron or manually
COMMENT ON FUNCTION expire_emergency_access IS 'Expires stale emergency access requests';
