/*
  # Staff Logs Cache for IT Ticketing System

  ## Overview
  Stores staff activity logs from the Championship IT ticketing system, providing
  visibility into what actions support agents take on tickets.

  ## New Tables

  ### `staff_logs_cache`
  Cached staff activity logs from Championship IT system
  - `id` (uuid, primary key) - Unique identifier for cached log entry
  - `external_log_id` (text, unique) - ID from Championship IT system
  - `ticket_id` (uuid) - Reference to tickets_cache
  - `external_ticket_id` (text) - Original ticket ID from external system
  - `staff_id` (text) - ID of staff member who performed action
  - `staff_name` (text) - Name of staff member
  - `staff_email` (text) - Email of staff member
  - `action_type` (text) - Type of action performed
  - `action_details` (jsonb) - Detailed action information
  - `previous_value` (text) - Value before change (for updates)
  - `new_value` (text) - Value after change (for updates)
  - `comment` (text) - Comment or note added by staff
  - `time_spent_minutes` (integer) - Time spent on this action
  - `created_at` (timestamptz) - When action occurred
  - `last_synced_at` (timestamptz) - Last sync timestamp

  ## Security
  - Enable RLS
  - Allow authenticated users to view all staff logs
  - Service can insert/update logs during sync

  ## Indexes
  - Index on ticket_id for fast lookups by ticket
  - Index on staff_id for filtering by staff member
  - Index on action_type for filtering by action
  - Index on created_at for chronological sorting
*/

-- Create staff_logs_cache table
CREATE TABLE IF NOT EXISTS staff_logs_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_log_id text UNIQUE NOT NULL,
  ticket_id uuid REFERENCES tickets_cache(id) ON DELETE CASCADE,
  external_ticket_id text NOT NULL,
  staff_id text NOT NULL,
  staff_name text NOT NULL,
  staff_email text,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  previous_value text,
  new_value text,
  comment text,
  time_spent_minutes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_logs_ticket_id ON staff_logs_cache(ticket_id);
CREATE INDEX IF NOT EXISTS idx_staff_logs_external_ticket_id ON staff_logs_cache(external_ticket_id);
CREATE INDEX IF NOT EXISTS idx_staff_logs_staff_id ON staff_logs_cache(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_logs_action_type ON staff_logs_cache(action_type);
CREATE INDEX IF NOT EXISTS idx_staff_logs_created_at ON staff_logs_cache(created_at DESC);

-- Enable Row Level Security
ALTER TABLE staff_logs_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view staff logs"
  ON staff_logs_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert staff logs"
  ON staff_logs_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update staff logs"
  ON staff_logs_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
