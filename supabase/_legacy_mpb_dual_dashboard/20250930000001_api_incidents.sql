/*
  # API Incidents Management
  
  1. New Table
    - `api_incidents` - Track API incidents, outages, and resolutions
    
  2. Extended API Statuses
    - Add uptime percentage
    - Add endpoint count
    - Add description field
*/

-- Create API Incidents table
CREATE TABLE IF NOT EXISTS api_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid REFERENCES api_statuses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  severity text CHECK (severity IN ('critical', 'warning', 'info')) NOT NULL DEFAULT 'warning',
  status text CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')) NOT NULL DEFAULT 'investigating',
  started_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  impact text,
  resolution_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add additional columns to api_statuses if they don't exist
DO $$ 
BEGIN
  -- Add uptime column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_statuses' AND column_name = 'uptime'
  ) THEN
    ALTER TABLE api_statuses ADD COLUMN uptime numeric(5,2) DEFAULT 99.9;
  END IF;

  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_statuses' AND column_name = 'description'
  ) THEN
    ALTER TABLE api_statuses ADD COLUMN description text;
  END IF;

  -- Add endpoint_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_statuses' AND column_name = 'endpoint_count'
  ) THEN
    ALTER TABLE api_statuses ADD COLUMN endpoint_count integer DEFAULT 0;
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_statuses' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE api_statuses ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE api_incidents ENABLE ROW LEVEL SECURITY;

-- Create policies for api_incidents
CREATE POLICY "Allow authenticated users to read incidents"
  ON api_incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert incidents"
  ON api_incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update incidents"
  ON api_incidents FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete incidents"
  ON api_incidents FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_incidents_api_id ON api_incidents(api_id);
CREATE INDEX IF NOT EXISTS idx_api_incidents_status ON api_incidents(status);
CREATE INDEX IF NOT EXISTS idx_api_incidents_severity ON api_incidents(severity);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_incidents_updated_at ON api_incidents;
CREATE TRIGGER api_incidents_updated_at
  BEFORE UPDATE ON api_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_api_incidents_updated_at();
