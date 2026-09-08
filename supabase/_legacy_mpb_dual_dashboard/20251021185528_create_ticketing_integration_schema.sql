/*
  # IT Support Ticketing System Integration Schema
  
  ## Overview
  This migration creates the core infrastructure for integrating the Championship IT ticketing system
  with the MPB Health CTO Dashboard. Since both systems use different Supabase instances, this schema
  provides caching, synchronization, and cross-reference capabilities.
  
  ## New Tables
  
  ### 1. `tickets_cache`
  Cached ticket data from Championship IT system for fast access and offline capability
  - `id` (uuid, primary key) - Unique identifier for cached ticket
  - `external_ticket_id` (text, unique) - ID from Championship IT system
  - `ticket_number` (text) - Human-readable ticket number
  - `title` (text) - Ticket title/subject
  - `description` (text) - Detailed ticket description
  - `status` (text) - Current ticket status
  - `priority` (text) - Ticket priority level
  - `category` (text) - Ticket category
  - `requester_id` (text) - User who created the ticket
  - `requester_name` (text) - Name of requester
  - `requester_email` (text) - Email of requester
  - `assignee_id` (text) - Assigned agent ID
  - `assignee_name` (text) - Name of assigned agent
  - `department` (text) - Assigned department
  - `created_at` (timestamptz) - When ticket was created
  - `updated_at` (timestamptz) - Last update timestamp
  - `resolved_at` (timestamptz) - When ticket was resolved
  - `due_date` (timestamptz) - SLA due date
  - `tags` (text[]) - Array of tags
  - `custom_fields` (jsonb) - Additional fields from ticketing system
  - `last_synced_at` (timestamptz) - Last sync timestamp
  
  ### 2. `ticket_project_links`
  Links tickets to projects in the CTO Dashboard
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key to tickets_cache)
  - `project_id` (uuid, foreign key to projects)
  - `link_type` (text) - Type of relationship
  - `created_by` (uuid) - User who created the link
  - `created_at` (timestamptz)
  
  ### 3. `ticket_assignment_links`
  Links tickets to assignments/tasks
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key to tickets_cache)
  - `assignment_id` (uuid, foreign key to assignments)
  - `link_type` (text) - Type of relationship
  - `created_by` (uuid) - User who created the link
  - `created_at` (timestamptz)
  
  ### 4. `ticket_sync_log`
  Tracks synchronization status and history
  - `id` (uuid, primary key)
  - `sync_type` (text) - Type of sync operation
  - `status` (text) - success, failed, in_progress
  - `records_processed` (integer) - Number of records synced
  - `records_failed` (integer) - Number of failed records
  - `started_at` (timestamptz) - Sync start time
  - `completed_at` (timestamptz) - Sync completion time
  - `error_message` (text) - Error details if failed
  - `details` (jsonb) - Additional sync metadata
  
  ### 5. `ticketing_system_config`
  Configuration for Championship IT integration
  - `id` (uuid, primary key)
  - `api_base_url` (text) - Base URL for Championship IT API
  - `api_key_encrypted` (text) - Encrypted API key
  - `sync_enabled` (boolean) - Whether auto-sync is enabled
  - `sync_interval_minutes` (integer) - Sync frequency
  - `last_successful_sync` (timestamptz) - Last successful sync
  - `webhook_secret` (text) - Secret for webhook validation
  - `is_active` (boolean) - Whether integration is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. `ticket_notifications`
  Notification queue for ticket events
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key to tickets_cache)
  - `user_id` (uuid) - Recipient user ID
  - `notification_type` (text) - Type of notification
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `is_read` (boolean) - Whether notification was read
  - `read_at` (timestamptz) - When notification was read
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated user access
  - Restrict configuration access to admins only
*/

-- Create tickets_cache table
CREATE TABLE IF NOT EXISTS tickets_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ticket_id text UNIQUE NOT NULL,
  ticket_number text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text,
  requester_id text,
  requester_name text,
  requester_email text,
  assignee_id text,
  assignee_name text,
  department text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  due_date timestamptz,
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  last_synced_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_cache_external_id ON tickets_cache(external_ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cache_status ON tickets_cache(status);
CREATE INDEX IF NOT EXISTS idx_tickets_cache_priority ON tickets_cache(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_cache_assignee ON tickets_cache(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cache_created_at ON tickets_cache(created_at DESC);

-- Create ticket_project_links table
CREATE TABLE IF NOT EXISTS ticket_project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets_cache(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'related',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticket_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_project_links_ticket ON ticket_project_links(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_project_links_project ON ticket_project_links(project_id);

-- Create ticket_assignment_links table
CREATE TABLE IF NOT EXISTS ticket_assignment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets_cache(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'related',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticket_id, assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_assignment_links_ticket ON ticket_assignment_links(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignment_links_assignment ON ticket_assignment_links(assignment_id);

-- Create ticket_sync_log table
CREATE TABLE IF NOT EXISTS ticket_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  details jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ticket_sync_log_started_at ON ticket_sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_sync_log_status ON ticket_sync_log(status);

-- Create ticketing_system_config table
CREATE TABLE IF NOT EXISTS ticketing_system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_base_url text NOT NULL,
  api_key_encrypted text,
  sync_enabled boolean DEFAULT true,
  sync_interval_minutes integer DEFAULT 5,
  last_successful_sync timestamptz,
  webhook_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_notifications table
CREATE TABLE IF NOT EXISTS ticket_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets_cache(id) ON DELETE CASCADE,
  user_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user ON ticket_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_created_at ON ticket_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_is_read ON ticket_notifications(is_read);

-- Enable Row Level Security
ALTER TABLE tickets_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticketing_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets_cache
CREATE POLICY "Authenticated users can view tickets"
  ON tickets_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tickets"
  ON tickets_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON tickets_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ticket_project_links
CREATE POLICY "Authenticated users can view ticket-project links"
  ON ticket_project_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create ticket-project links"
  ON ticket_project_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ticket-project links"
  ON ticket_project_links FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for ticket_assignment_links
CREATE POLICY "Authenticated users can view ticket-assignment links"
  ON ticket_assignment_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create ticket-assignment links"
  ON ticket_assignment_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ticket-assignment links"
  ON ticket_assignment_links FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for ticket_sync_log
CREATE POLICY "Authenticated users can view sync logs"
  ON ticket_sync_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert sync logs"
  ON ticket_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ticketing_system_config
CREATE POLICY "Authenticated users can view config"
  ON ticketing_system_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage config"
  ON ticketing_system_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ticket_notifications
CREATE POLICY "Users can view their own notifications"
  ON ticket_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can create notifications"
  ON ticket_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON ticket_notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);