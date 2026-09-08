-- Command Dock Tables Migration
-- Creates tables for external project links, quick actions, and user dock configuration

-- =====================================================
-- Table: external_project_links
-- Stores external project/website shortcuts for the dock
-- =====================================================
CREATE TABLE IF NOT EXISTS external_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Globe',
  description TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_external_project_links_user_id ON external_project_links(user_id);
CREATE INDEX IF NOT EXISTS idx_external_project_links_sort_order ON external_project_links(user_id, sort_order);

-- Enable RLS
ALTER TABLE external_project_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_project_links
CREATE POLICY "Users can view their own external links"
  ON external_project_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own external links"
  ON external_project_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own external links"
  ON external_project_links
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own external links"
  ON external_project_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Table: quick_actions
-- Stores configurable quick action buttons for the dock
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Zap',
  action_type TEXT NOT NULL DEFAULT 'url',
  -- action_type can be: 'url', 'webhook', 'command', 'internal'
  action_data JSONB NOT NULL DEFAULT '{}',
  -- action_data structure depends on action_type:
  -- url: { "url": "https://...", "method": "GET" }
  -- webhook: { "url": "https://...", "method": "POST", "headers": {}, "body": {} }
  -- command: { "command": "npm run build" }
  -- internal: { "action": "open-terminal" | "clear-cache" | "refresh" }
  description TEXT,
  color TEXT DEFAULT 'primary',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_notification BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quick_actions_user_id ON quick_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_sort_order ON quick_actions(user_id, sort_order);

-- Enable RLS
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_actions
CREATE POLICY "Users can view their own quick actions"
  ON quick_actions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quick actions"
  ON quick_actions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick actions"
  ON quick_actions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick actions"
  ON quick_actions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Table: user_dock_config
-- Stores user preferences for dock layout and settings
-- =====================================================
CREATE TABLE IF NOT EXISTS user_dock_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- Dock visibility settings
  show_search BOOLEAN NOT NULL DEFAULT true,
  show_pinned_apps BOOLEAN NOT NULL DEFAULT true,
  show_external_links BOOLEAN NOT NULL DEFAULT true,
  show_quick_actions BOOLEAN NOT NULL DEFAULT true,
  show_galaxy_map BOOLEAN NOT NULL DEFAULT true,
  show_command_palette BOOLEAN NOT NULL DEFAULT true,
  -- Dock appearance
  dock_size TEXT NOT NULL DEFAULT 'medium',
  -- dock_size can be: 'small', 'medium', 'large'
  enable_magnification BOOLEAN NOT NULL DEFAULT true,
  magnification_scale DECIMAL(3, 2) NOT NULL DEFAULT 1.5,
  -- Layout preferences
  section_order JSONB NOT NULL DEFAULT '["search", "pinned", "external", "actions", "utils"]',
  -- Custom settings
  custom_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_dock_config_user_id ON user_dock_config(user_id);

-- Enable RLS
ALTER TABLE user_dock_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_dock_config
CREATE POLICY "Users can view their own dock config"
  ON user_dock_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dock config"
  ON user_dock_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dock config"
  ON user_dock_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dock config"
  ON user_dock_config
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for external_project_links
DROP TRIGGER IF EXISTS update_external_project_links_updated_at ON external_project_links;
CREATE TRIGGER update_external_project_links_updated_at
  BEFORE UPDATE ON external_project_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for quick_actions
DROP TRIGGER IF EXISTS update_quick_actions_updated_at ON quick_actions;
CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_dock_config
DROP TRIGGER IF EXISTS update_user_dock_config_updated_at ON user_dock_config;
CREATE TRIGGER update_user_dock_config_updated_at
  BEFORE UPDATE ON user_dock_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Insert default quick actions for existing users
-- (Optional: can be populated per-user on first load)
-- =====================================================
COMMENT ON TABLE external_project_links IS 'External project/website shortcuts displayed in the command dock';
COMMENT ON TABLE quick_actions IS 'Configurable quick action buttons for the command dock';
COMMENT ON TABLE user_dock_config IS 'User preferences for dock layout, visibility, and appearance';

