/*
  # Department Notes and Teams Integration Tables

  1. New Tables
    - `department_notes` - CEO notes for department data review
      - `id` (uuid, primary key)
      - `org_id` (uuid, foreign key to organizations)
      - `department` (text: 'concierge', 'sales', 'operations', 'finance', 'saudemax')
      - `upload_id` (uuid, optional foreign key to department_uploads)
      - `note_content` (text, the note content)
      - `is_pinned` (boolean, for important notes)
      - `tags` (text[], array of tags for organization)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `teams_integration_settings` - Microsoft Teams webhook configuration
      - `id` (uuid, primary key)
      - `org_id` (uuid, foreign key to organizations)
      - `department` (text: 'concierge', 'sales', 'operations', 'finance', 'saudemax', 'general')
      - `webhook_url` (text, Teams webhook URL)
      - `channel_name` (text, Teams channel name)
      - `is_active` (boolean)
      - `notify_on_upload` (boolean)
      - `notify_on_failure` (boolean)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for CEO and admin access
    - Restrict note access to CEO and creators
    - Secure Teams settings to admin and CEO only

  3. Indexes
    - Add indexes on department, created_at, and is_pinned for efficient queries
*/

-- Create department_notes table
CREATE TABLE IF NOT EXISTS department_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'operations', 'finance', 'saudemax')),
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
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('concierge', 'sales', 'operations', 'finance', 'saudemax', 'general')),
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
CREATE INDEX IF NOT EXISTS idx_department_notes_department ON department_notes(department);
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
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Users can view their own notes
CREATE POLICY "Users can view their own notes"
  ON department_notes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- CEO and admins can create notes
CREATE POLICY "CEO and admins can create notes"
  ON department_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = department_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes"
  ON department_notes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
  ON department_notes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for teams_integration_settings

-- CEO and admins can view Teams settings
CREATE POLICY "CEO and admins can view Teams settings"
  ON teams_integration_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- CEO and admins can manage Teams settings
CREATE POLICY "CEO and admins can create Teams settings"
  ON teams_integration_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
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
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
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
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = teams_integration_settings.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_department_notes_updated_at
  BEFORE UPDATE ON department_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_settings_updated_at
  BEFORE UPDATE ON teams_integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
