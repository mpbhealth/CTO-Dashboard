/*
  # Fix Department Notes Table Creation
  
  1. New Tables
    - `department_notes` - CEO notes for department data review
      - Uses org_id directly instead of organizations FK (table doesn't exist)
    - `teams_integration_settings` - Microsoft Teams webhook configuration
  
  2. Security
    - Enable RLS on all tables
    - Add policies for CEO and admin access
*/

-- Create department_notes table (without organizations FK)
CREATE TABLE IF NOT EXISTS department_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  department_id text NOT NULL,
  upload_id uuid REFERENCES department_uploads(id) ON DELETE SET NULL,
  note_content text NOT NULL,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams_integration_settings table
CREATE TABLE IF NOT EXISTS teams_integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  department text NOT NULL,
  webhook_url text NOT NULL,
  channel_name text NOT NULL,
  is_active boolean DEFAULT true,
  notify_on_upload boolean DEFAULT true,
  notify_on_failure boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, department)
);

-- Add indexes for department_notes
CREATE INDEX IF NOT EXISTS idx_department_notes_org_id ON department_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_department_notes_department ON department_notes(department_id);
CREATE INDEX IF NOT EXISTS idx_department_notes_upload_id ON department_notes(upload_id);
CREATE INDEX IF NOT EXISTS idx_department_notes_created_at ON department_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_department_notes_is_pinned ON department_notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_department_notes_created_by ON department_notes(created_by);

-- Add indexes for teams_integration_settings
CREATE INDEX IF NOT EXISTS idx_teams_settings_org_id ON teams_integration_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_settings_department ON teams_integration_settings(department);
CREATE INDEX IF NOT EXISTS idx_teams_settings_active ON teams_integration_settings(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE department_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams_integration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_notes

-- CEO and admins can view all notes in their org
CREATE POLICY "CEO and admins can view department notes"
  ON department_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = department_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Users can view their own notes
CREATE POLICY "Users can view their own notes"
  ON department_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = department_notes.created_by
    )
  );

-- CEO and admins can create notes
CREATE POLICY "CEO and admins can create notes"
  ON department_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = department_notes.created_by
      AND profiles.org_id = department_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes"
  ON department_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = department_notes.created_by
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = department_notes.created_by
    )
  );

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
  ON department_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = department_notes.created_by
    )
  );

-- RLS Policies for teams_integration_settings

-- CEO and admins can view Teams settings
CREATE POLICY "CEO and admins can view Teams settings"
  ON teams_integration_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- CEO and admins can manage Teams settings
CREATE POLICY "CEO and admins can create Teams settings"
  ON teams_integration_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = teams_integration_settings.created_by
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admins can update Teams settings"
  ON teams_integration_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admins can delete Teams settings"
  ON teams_integration_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_department_notes_updated_at ON department_notes;
CREATE TRIGGER update_department_notes_updated_at
  BEFORE UPDATE ON department_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_settings_updated_at ON teams_integration_settings;
CREATE TRIGGER update_teams_settings_updated_at
  BEFORE UPDATE ON teams_integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();