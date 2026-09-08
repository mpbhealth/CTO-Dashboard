/*
  # CommandOS Apps Directory Schema

  Creates the foundation for the dynamic app ecosystem:
  
  1. Tables
    - `apps` - All available apps/modules in the system
    - `app_role_access` - Maps which roles can access which apps
    - `user_app_pins` - User's pinned apps for the dock
    - `user_badges` - Notification counts per app per user
  
  2. RLS Policies
    - Apps readable based on role access
    - Pins and badges scoped to authenticated user
  
  3. Seed Data
    - Initial set of core apps (CEO, CTO, Orbit, etc.)
    - Role access mappings for ceo, cto, admin roles
*/

-- =====================================================
-- PART 1: Create Tables
-- =====================================================

-- Apps table: defines all available apps/modules
CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  icon text,
  href text NOT NULL,
  kind text NOT NULL DEFAULT 'internal',
  open_mode text NOT NULL DEFAULT 'same_tab',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT apps_kind_check CHECK (kind IN ('internal', 'external', 'embedded')),
  CONSTRAINT apps_open_mode_check CHECK (open_mode IN ('same_tab', 'new_tab'))
);

-- App role access: which roles can see which apps
CREATE TABLE IF NOT EXISTS app_role_access (
  app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (app_id, role)
);

-- User pinned apps: personalized dock
CREATE TABLE IF NOT EXISTS user_app_pins (
  user_id uuid NOT NULL,
  app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  is_pinned boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (user_id, app_id)
);

-- User badges: realtime notification counts
CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid NOT NULL,
  app_key text NOT NULL,
  count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (user_id, app_key)
);

-- =====================================================
-- PART 2: Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_is_active ON apps(is_active);
CREATE INDEX IF NOT EXISTS idx_apps_sort_order ON apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_app_role_access_role ON app_role_access(role);
CREATE INDEX IF NOT EXISTS idx_user_app_pins_user_id ON user_app_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_pins_is_pinned ON user_app_pins(is_pinned);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- =====================================================
-- PART 3: Enable RLS
-- =====================================================

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_role_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 4: RLS Policies
-- =====================================================

-- Helper function to get current user's role
-- Uses id = auth.uid() pattern which works when profiles.id references auth.users(id)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1),
    'staff'
  );
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid()
    AND (role = 'admin' OR is_superuser = true)
  );
$$;

-- Apps: readable if user has role access OR if app is marked for all
DROP POLICY IF EXISTS "Users can view apps they have access to" ON apps;
CREATE POLICY "Users can view apps they have access to" ON apps
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND (
      -- User has role access
      EXISTS (
        SELECT 1 FROM app_role_access ara
        WHERE ara.app_id = apps.id 
        AND (ara.role = 'all' OR ara.role = get_user_role())
      )
      -- Or user is admin/superuser
      OR is_admin_user()
    )
  );

-- App role access: readable by authenticated users (needed for joins)
DROP POLICY IF EXISTS "Authenticated users can view app role access" ON app_role_access;
CREATE POLICY "Authenticated users can view app role access" ON app_role_access
  FOR SELECT TO authenticated
  USING (true);

-- User pins: users manage their own
DROP POLICY IF EXISTS "Users can view their own pins" ON user_app_pins;
CREATE POLICY "Users can view their own pins" ON user_app_pins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own pins" ON user_app_pins;
CREATE POLICY "Users can insert their own pins" ON user_app_pins
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own pins" ON user_app_pins;
CREATE POLICY "Users can update their own pins" ON user_app_pins
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own pins" ON user_app_pins;
CREATE POLICY "Users can delete their own pins" ON user_app_pins
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- User badges: users see their own
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- System can update badges (via triggers/functions)
DROP POLICY IF EXISTS "System can manage badges" ON user_badges;
CREATE POLICY "System can manage badges" ON user_badges
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PART 5: Seed Initial Apps
-- =====================================================

-- Insert apps only if they don't exist
INSERT INTO apps (key, name, description, category, icon, href, kind, sort_order) VALUES
  ('ceo-home', 'CEO Dashboard', 'Executive overview and KPIs', 'Executive', 'LayoutDashboard', '/ceo', 'internal', 0),
  ('cto-home', 'CTO Dashboard', 'Technology and engineering metrics', 'Executive', 'Terminal', '/cto', 'internal', 1),
  ('orbit', 'MPB Orbit', 'Task and project management', 'Operations', 'Orbit', '/orbit', 'internal', 2),
  ('tickets', 'IT Support', 'Support ticket management', 'Operations', 'Ticket', '/tickets', 'internal', 3),
  ('analytics', 'Analytics', 'Business intelligence and reporting', 'Analytics', 'BarChart3', '/ceo/analytics', 'internal', 4),
  ('compliance', 'Compliance', 'HIPAA compliance dashboard', 'Compliance', 'ShieldCheck', '/cto/compliance', 'internal', 5),
  ('marketing', 'Marketing', 'Marketing campaigns and content', 'Operations', 'TrendingUp', '/ceo/marketing', 'internal', 6),
  ('development', 'Development', 'Tech stack and projects', 'Engineering', 'Code', '/cto/development', 'internal', 7),
  ('settings', 'Settings', 'App preferences and configuration', 'System', 'Settings', '/settings', 'internal', 99)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- PART 6: Seed Role Access
-- =====================================================

-- CEO role access
INSERT INTO app_role_access (app_id, role)
SELECT id, 'ceo' FROM apps WHERE key IN ('ceo-home', 'analytics', 'orbit', 'tickets', 'marketing', 'settings')
ON CONFLICT (app_id, role) DO NOTHING;

-- CTO role access
INSERT INTO app_role_access (app_id, role)
SELECT id, 'cto' FROM apps WHERE key IN ('cto-home', 'compliance', 'orbit', 'tickets', 'development', 'settings')
ON CONFLICT (app_id, role) DO NOTHING;

-- Admin role access (all apps)
INSERT INTO app_role_access (app_id, role)
SELECT id, 'admin' FROM apps
ON CONFLICT (app_id, role) DO NOTHING;

-- Staff role access (limited)
INSERT INTO app_role_access (app_id, role)
SELECT id, 'staff' FROM apps WHERE key IN ('orbit', 'tickets', 'settings')
ON CONFLICT (app_id, role) DO NOTHING;

-- =====================================================
-- PART 7: Update Timestamp Trigger
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for apps table
DROP TRIGGER IF EXISTS apps_updated_at ON apps;
CREATE TRIGGER apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_apps_updated_at();

-- Trigger for user_app_pins table
DROP TRIGGER IF EXISTS user_app_pins_updated_at ON user_app_pins;
CREATE TRIGGER user_app_pins_updated_at
  BEFORE UPDATE ON user_app_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_apps_updated_at();

