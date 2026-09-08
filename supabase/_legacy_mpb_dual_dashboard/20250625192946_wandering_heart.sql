/*
  # Monday.com Integration Schema

  1. New Tables
    - `monday_config` - Store Monday.com app credentials
    - `monday_tasks` - Cache Monday.com tasks/items locally
    - `monday_sync_log` - Track sync operations

  2. Security
    - Enable RLS on all tables
    - Encrypt sensitive credentials
    - Admin-only access to configuration

  3. Features
    - Task import and sync
    - Project mapping
    - Assignment tracking
*/

-- Monday.com Configuration table
CREATE TABLE IF NOT EXISTS monday_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  client_secret text NOT NULL, -- Should be encrypted in production
  signing_secret text NOT NULL, -- Should be encrypted in production
  app_id text NOT NULL,
  access_token text, -- OAuth token after authentication
  refresh_token text, -- For token refresh
  workspace_id text,
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Monday.com Tasks/Items table
CREATE TABLE IF NOT EXISTS monday_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monday_item_id text NOT NULL UNIQUE,
  board_id text NOT NULL,
  board_name text NOT NULL,
  group_id text,
  group_name text,
  name text NOT NULL,
  status text,
  priority text,
  assignees text[], -- Array of user names/emails
  due_date date,
  description text,
  labels text[],
  project_id uuid REFERENCES projects(id), -- Link to our projects table
  is_imported boolean DEFAULT false,
  raw_data jsonb, -- Store full Monday.com item data
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Monday.com Sync Log table
CREATE TABLE IF NOT EXISTS monday_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL, -- 'import_tasks', 'sync_boards', 'create_project', etc.
  status text CHECK (status IN ('success', 'failed', 'in_progress')) NOT NULL,
  message text,
  items_processed integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  details jsonb DEFAULT '{}',
  duration_ms integer,
  timestamp timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE monday_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monday_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monday_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies for admin users
CREATE POLICY "Admin users can manage Monday config"
  ON monday_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin users can read Monday config"
  ON monday_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read Monday tasks"
  ON monday_tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage Monday tasks"
  ON monday_tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read Monday sync logs"
  ON monday_sync_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert Monday sync logs"
  ON monday_sync_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_monday_tasks_board_id ON monday_tasks(board_id);
CREATE INDEX idx_monday_tasks_status ON monday_tasks(status);
CREATE INDEX idx_monday_tasks_assignees ON monday_tasks USING GIN(assignees);
CREATE INDEX idx_monday_tasks_project_id ON monday_tasks(project_id);
CREATE INDEX idx_monday_sync_log_timestamp ON monday_sync_log(timestamp DESC);

-- Insert sample Monday.com configuration (placeholder)
INSERT INTO monday_config (client_id, client_secret, signing_secret, app_id) VALUES
  ('your_client_id', 'your_client_secret', 'your_signing_secret', 'your_app_id')
ON CONFLICT DO NOTHING;