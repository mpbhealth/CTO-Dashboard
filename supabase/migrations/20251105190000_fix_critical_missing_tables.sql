/*
  # Fix Critical Missing Tables - Resources and Concierge Interactions

  ## Summary
  This migration creates the critical tables that are causing 500/404 errors:
  1. `resources` table - For dual dashboard content management
  2. `concierge_interactions` table - For concierge tracking
  3. `workspaces` table - For multi-workspace support

  ## Tables Created
  - resources (dual dashboard content)
  - concierge_interactions (concierge tracking)
  - workspaces (organizational workspaces)

  ## Security
  - All tables enable RLS with org_id scoping
  - CEO, CTO and admin roles have full access
  - Policies prevent cross-org data access
*/

-- ============================================================================
-- PART 1: Create workspaces table
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  workspace_type text NOT NULL CHECK (workspace_type IN ('CEO', 'CTO', 'CFO', 'CMO', 'Shared')),
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(workspace_type);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;

-- Create policies for workspaces
CREATE POLICY "workspaces_select"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = workspaces.org_id
      LIMIT 1
    )
  );

CREATE POLICY "workspaces_insert"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = workspaces.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
      LIMIT 1
    )
  );

CREATE POLICY "workspaces_update"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = workspaces.org_id
      AND profiles.role IN ('ceo', 'admin', 'cto')
      LIMIT 1
    )
  );

-- ============================================================================
-- PART 2: Create resources table
-- ============================================================================

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  resource_type text NOT NULL CHECK (resource_type IN ('note', 'document', 'report', 'dashboard', 'kpi', 'chart', 'other')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
  target_role text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_workspace ON resources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_resources_org ON resources(org_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON resources(created_by);
CREATE INDEX IF NOT EXISTS idx_resources_updated_at ON resources(updated_at DESC);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "resources_select" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_update" ON resources;
DROP POLICY IF EXISTS "resources_delete" ON resources;

-- Create policies for resources
CREATE POLICY "resources_select"
  ON resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      AND (
        -- User created it
        resources.created_by = auth.uid()
        -- Or it's shared/public
        OR resources.visibility IN ('shared', 'public')
        -- Or user has matching role
        OR (resources.target_role IS NULL OR profiles.role = resources.target_role)
      )
      LIMIT 1
    )
  );

CREATE POLICY "resources_insert"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      LIMIT 1
    )
  );

CREATE POLICY "resources_update"
  ON resources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      AND (
        resources.created_by = auth.uid()
        OR profiles.role IN ('ceo', 'admin', 'cto')
      )
      LIMIT 1
    )
  );

CREATE POLICY "resources_delete"
  ON resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = resources.org_id
      AND (
        resources.created_by = auth.uid()
        OR profiles.role IN ('ceo', 'admin')
      )
      LIMIT 1
    )
  );

-- ============================================================================
-- PART 3: Create concierge_interactions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS concierge_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  member_id text,
  member_name text,
  agent_name text NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('call', 'email', 'chat', 'sms', 'in-person', 'other')),
  channel text,
  duration_minutes numeric DEFAULT 0,
  result text,
  satisfaction_score numeric,
  notes text,
  tags text[],
  follow_up_required boolean DEFAULT false,
  follow_up_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_interactions_org ON concierge_interactions(org_id);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_occurred ON concierge_interactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_member ON concierge_interactions(member_id);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_agent ON concierge_interactions(agent_name);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_type ON concierge_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_follow_up ON concierge_interactions(follow_up_required) WHERE follow_up_required = true;

ALTER TABLE concierge_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "concierge_interactions_select" ON concierge_interactions;
DROP POLICY IF EXISTS "concierge_interactions_insert" ON concierge_interactions;
DROP POLICY IF EXISTS "concierge_interactions_update" ON concierge_interactions;

-- Create policies for concierge_interactions
CREATE POLICY "concierge_interactions_select"
  ON concierge_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = concierge_interactions.org_id
      LIMIT 1
    )
  );

CREATE POLICY "concierge_interactions_insert"
  ON concierge_interactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = concierge_interactions.org_id
      LIMIT 1
    )
  );

CREATE POLICY "concierge_interactions_update"
  ON concierge_interactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = concierge_interactions.org_id
      AND (
        concierge_interactions.created_by = auth.uid()
        OR profiles.role IN ('ceo', 'admin', 'cto')
      )
      LIMIT 1
    )
  );

-- ============================================================================
-- PART 4: Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_concierge_interactions_updated_at ON concierge_interactions;
CREATE TRIGGER update_concierge_interactions_updated_at
  BEFORE UPDATE ON concierge_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: Grant permissions to service role
-- ============================================================================

GRANT ALL ON workspaces TO service_role;
GRANT ALL ON resources TO service_role;
GRANT ALL ON concierge_interactions TO service_role;

-- ============================================================================
-- PART 6: Insert default workspace if none exists
-- ============================================================================

-- This will be handled by the application on first login
-- No default data insertion to avoid org_id conflicts
