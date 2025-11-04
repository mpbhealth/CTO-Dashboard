/*
  # Concierge Department Upload System

  ## Overview
  Creates complete schema for concierge department data uploads including staging tables,
  production views, issue categories, and team member tracking for three distinct report types:
  1. Weekly Performance Metrics - Team productivity and task completion
  2. Daily Interactions - Member touchpoints and issue resolution
  3. After Hours Calls - After-hours and emergency contact tracking

  ## New Tables

  ### Staging Tables
  1. `stg_concierge_weekly_metrics` - Raw weekly performance data with multi-agent columns
  2. `stg_concierge_daily_interactions` - Raw daily call logs and member touchpoints
  3. `stg_concierge_after_hours` - Raw after-hours call tracking with timestamps

  ### Lookup Tables
  1. `concierge_issue_categories` - Standardized issue types and categories
  2. `concierge_team_members` - Active concierge team roster
  3. `concierge_request_types` - Classification for RX, Imaging, Lab, Appt requests

  ## Views
  1. `concierge_weekly_metrics` - Normalized team performance with calculations
  2. `concierge_daily_interactions` - Normalized member interactions with categorization
  3. `concierge_after_hours` - Normalized after-hours calls with urgency scoring

  ## Security
  - RLS enabled on all tables
  - CEO and admin roles have full access
  - Department users can insert their own data
*/

-- Create concierge issue categories lookup table
CREATE TABLE IF NOT EXISTS concierge_issue_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type text UNIQUE NOT NULL,
  category text NOT NULL,
  priority_level int DEFAULT 3,
  avg_resolution_time_minutes int DEFAULT 30,
  requires_followup boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE concierge_issue_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view issue categories"
  ON concierge_issue_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage issue categories"
  ON concierge_issue_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );

-- Insert default issue categories based on actual data patterns
INSERT INTO concierge_issue_categories (issue_type, category, priority_level, avg_resolution_time_minutes, requires_followup) VALUES
  ('telemedicine', 'Clinical Services', 2, 45, true),
  ('medication', 'Pharmacy', 2, 30, true),
  ('rx assistance', 'Pharmacy', 2, 30, true),
  ('rx update', 'Pharmacy', 1, 15, false),
  ('price increase question', 'Billing', 2, 20, false),
  ('plan questions', 'Enrollment', 2, 25, false),
  ('renewal question', 'Enrollment', 2, 20, false),
  ('cancelling', 'Retention', 1, 45, true),
  ('cancel', 'Retention', 1, 45, true),
  ('app login issues', 'Technical Support', 2, 20, false),
  ('health wallet', 'Technical Support', 2, 25, false),
  ('healthwallet is down', 'Technical Support', 1, 30, true),
  ('card', 'Member Services', 3, 10, false),
  ('ID card', 'Member Services', 3, 10, false),
  ('provider look ups', 'Network', 2, 15, false),
  ('sharing request', 'Claims', 2, 30, true),
  ('preventive', 'Benefits', 2, 20, false),
  ('lab bill', 'Billing', 2, 25, true),
  ('billing', 'Billing', 2, 25, true),
  ('er visit', 'Claims', 1, 45, true),
  ('genetic testing', 'Clinical Services', 2, 30, true),
  ('fullscripts', 'Pharmacy', 2, 20, false),
  ('bill submission', 'Claims', 2, 30, true),
  ('mental health', 'Clinical Services', 1, 40, true),
  ('other', 'General', 3, 20, false)
ON CONFLICT (issue_type) DO NOTHING;

-- Create concierge team members lookup table
CREATE TABLE IF NOT EXISTS concierge_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text UNIQUE NOT NULL,
  display_name text,
  role text DEFAULT 'Concierge Specialist',
  is_active boolean DEFAULT true,
  hire_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE concierge_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view team members"
  ON concierge_team_members FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage team members"
  ON concierge_team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );

-- Insert known team members from the data
INSERT INTO concierge_team_members (agent_name, display_name, is_active) VALUES
  ('Ace', 'Acelyn (Ace)', true),
  ('Adam', 'Adam', true),
  ('Angee', 'Angee', true),
  ('Tupac', 'Tupac', true),
  ('Leo', 'Leo', true),
  ('Julia', 'Julia', true)
ON CONFLICT (agent_name) DO NOTHING;

-- Create request types lookup table
CREATE TABLE IF NOT EXISTS concierge_request_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text UNIQUE NOT NULL,
  category text NOT NULL,
  avg_processing_time_minutes int DEFAULT 30,
  requires_external_coordination boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE concierge_request_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view request types"
  ON concierge_request_types FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert standard request types
INSERT INTO concierge_request_types (request_type, category, avg_processing_time_minutes, requires_external_coordination) VALUES
  ('RX Requests', 'Pharmacy', 30, true),
  ('Imaging Requests', 'Diagnostic', 45, true),
  ('Lab Requests', 'Diagnostic', 40, true),
  ('Appt Requests', 'Scheduling', 20, true)
ON CONFLICT (request_type) DO NOTHING;

-- Create stg_concierge_weekly_metrics staging table
CREATE TABLE IF NOT EXISTS stg_concierge_weekly_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  uploaded_by text,
  upload_batch_id uuid,
  sheet_name text,

  -- Week identification
  week_start_date text,
  week_end_date text,
  date_range text,

  -- Agent/metric structure (flexible to handle varying agent columns)
  agent_name text,
  metric_type text,
  metric_value text,

  -- Additional metadata from notes columns
  notes text,

  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_concierge_weekly_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and concierge team can read weekly metrics staging"
  ON stg_concierge_weekly_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'concierge')
    )
  );

CREATE POLICY "Authenticated users can insert weekly metrics staging"
  ON stg_concierge_weekly_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create stg_concierge_daily_interactions staging table
CREATE TABLE IF NOT EXISTS stg_concierge_daily_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  uploaded_by text,
  upload_batch_id uuid,
  sheet_name text,

  interaction_date text,
  member_name text,
  issue_description text,
  notes text,

  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_concierge_daily_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and concierge team can read daily interactions staging"
  ON stg_concierge_daily_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'concierge')
    )
  );

CREATE POLICY "Authenticated users can insert daily interactions staging"
  ON stg_concierge_daily_interactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create stg_concierge_after_hours staging table
CREATE TABLE IF NOT EXISTS stg_concierge_after_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  uploaded_by text,
  upload_batch_id uuid,
  sheet_name text,

  call_timestamp text,
  member_name_with_phone text,
  member_name text,
  phone_number text,
  notes text,

  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_concierge_after_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and concierge team can read after hours staging"
  ON stg_concierge_after_hours FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'concierge')
    )
  );

CREATE POLICY "Authenticated users can insert after hours staging"
  ON stg_concierge_after_hours FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create concierge_weekly_metrics view with intelligent transformations
CREATE OR REPLACE VIEW concierge_weekly_metrics AS
SELECT
  s.id as staging_id,
  s.org_id,
  -- Parse date range into start and end dates
  CASE
    WHEN s.week_start_date ~ '^\d{1,2}\.\d{1,2}\.\d{2}' THEN
      TO_DATE('20' || SUBSTRING(s.week_start_date FROM '\d{1,2}\.\d{1,2}\.(\d{2})$') || '-' ||
              SUBSTRING(s.week_start_date FROM '^(\d{1,2})\.') || '-' ||
              SUBSTRING(s.week_start_date FROM '^\d{1,2}\.(\d{1,2})\.'), 'YYYY-MM-DD')
    ELSE NULL
  END as week_start_date,
  CASE
    WHEN s.week_end_date ~ '^\d{1,2}\.\d{1,2}\.\d{2}' THEN
      TO_DATE('20' || SUBSTRING(s.week_end_date FROM '\d{1,2}\.\d{1,2}\.(\d{2})$') || '-' ||
              SUBSTRING(s.week_end_date FROM '^(\d{1,2})\.') || '-' ||
              SUBSTRING(s.week_end_date FROM '^\d{1,2}\.(\d{1,2})\.'), 'YYYY-MM-DD')
    ELSE NULL
  END as week_end_date,
  NULLIF(TRIM(s.date_range), '') as date_range,
  NULLIF(TRIM(s.agent_name), '') as agent_name,
  NULLIF(TRIM(s.metric_type), '') as metric_type,
  -- Parse metric values intelligently based on type
  CASE
    WHEN s.metric_type = 'Members attended to' THEN
      COALESCE(NULLIF(REGEXP_REPLACE(s.metric_value, '[^0-9]', '', 'g'), '')::numeric, 0)
    WHEN s.metric_type = 'Phone Time' THEN
      -- Convert "7:30 hours" to decimal hours
      CASE
        WHEN s.metric_value ~ '^\d+:\d+ hours' THEN
          (SUBSTRING(s.metric_value FROM '^(\d+):')::numeric +
           SUBSTRING(s.metric_value FROM ':(\d+)')::numeric / 60.0)
        WHEN s.metric_value ~ '^\d+\.\d+ hours' THEN
          REGEXP_REPLACE(s.metric_value, '[^0-9.]', '', 'g')::numeric
        ELSE 0
      END
    WHEN s.metric_type IN ('CRM Tasks', 'RX Requests', 'Imaging Requests', 'Lab Requests', 'Appt Requests') THEN
      COALESCE(NULLIF(REGEXP_REPLACE(s.metric_value, '[^0-9]', '', 'g'), '')::numeric, 0)
    WHEN s.metric_type = 'Incomplete/Next Week Tasks' THEN
      -- Parse "11| 30" format - take the first number as incomplete
      COALESCE(NULLIF(REGEXP_REPLACE(SPLIT_PART(s.metric_value, '|', 1), '[^0-9]', '', 'g'), '')::numeric, 0)
    ELSE
      COALESCE(NULLIF(REGEXP_REPLACE(s.metric_value, '[^0-9]', '', 'g'), '')::numeric, 0)
  END as metric_value,
  s.metric_value as raw_metric_value,
  NULLIF(TRIM(s.notes), '') as notes,
  s.created_at,
  s.imported_at
FROM stg_concierge_weekly_metrics s;

-- Create concierge_daily_interactions view with intelligent transformations
CREATE OR REPLACE VIEW concierge_daily_interactions AS
SELECT
  s.id as staging_id,
  s.org_id,
  -- Parse various date formats: "09.18.25", "09.17.25"
  CASE
    WHEN s.interaction_date ~ '^\d{1,2}\.\d{1,2}\.\d{2}' THEN
      TO_DATE('20' || SUBSTRING(s.interaction_date FROM '\d{1,2}\.\d{1,2}\.(\d{2})$') || '-' ||
              SUBSTRING(s.interaction_date FROM '^(\d{1,2})\.') || '-' ||
              SUBSTRING(s.interaction_date FROM '^\d{1,2}\.(\d{1,2})\.'), 'YYYY-MM-DD')
    WHEN s.interaction_date ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
      TO_DATE(s.interaction_date, 'MM/DD/YYYY')
    ELSE NULL
  END as interaction_date,
  NULLIF(TRIM(s.member_name), '') as member_name,
  NULLIF(TRIM(s.issue_description), '') as issue_description,
  -- Categorize issue based on keywords
  COALESCE(
    (SELECT ic.category FROM concierge_issue_categories ic
     WHERE LOWER(TRIM(s.issue_description)) LIKE '%' || LOWER(ic.issue_type) || '%'
     AND ic.is_active = true
     ORDER BY LENGTH(ic.issue_type) DESC
     LIMIT 1),
    'General'
  ) as issue_category,
  COALESCE(
    (SELECT ic.priority_level FROM concierge_issue_categories ic
     WHERE LOWER(TRIM(s.issue_description)) LIKE '%' || LOWER(ic.issue_type) || '%'
     AND ic.is_active = true
     ORDER BY LENGTH(ic.issue_type) DESC
     LIMIT 1),
    3
  ) as priority_level,
  -- Detect if this is a "NO CALLS" entry
  CASE
    WHEN UPPER(TRIM(s.member_name)) = 'NO CALLS' THEN true
    ELSE false
  END as is_no_calls_day,
  NULLIF(TRIM(s.notes), '') as notes,
  s.created_at,
  s.imported_at
FROM stg_concierge_daily_interactions s;

-- Create concierge_after_hours view with intelligent transformations
CREATE OR REPLACE VIEW concierge_after_hours AS
SELECT
  s.id as staging_id,
  s.org_id,
  -- Parse timestamp: "Sep 18, 2025, 8:36:53 pm"
  CASE
    WHEN s.call_timestamp ~ '^[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [ap]m' THEN
      TO_TIMESTAMP(s.call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am')
    ELSE NULL
  END as call_timestamp,
  -- Extract member name from "KASSING EMILY (+16025016607)" format
  COALESCE(
    NULLIF(TRIM(s.member_name), ''),
    TRIM(REGEXP_REPLACE(s.member_name_with_phone, '\s*\(\+\d+\).*$', '', 'g'))
  ) as member_name,
  -- Extract phone number
  COALESCE(
    NULLIF(TRIM(s.phone_number), ''),
    TRIM(REGEXP_REPLACE(
      SUBSTRING(s.member_name_with_phone FROM '\(\+(\d+)\)'),
      '[^0-9]', '', 'g'
    ))
  ) as phone_number,
  CASE
    WHEN s.notes IS NULL OR UPPER(TRIM(s.notes)) = 'N/A' THEN NULL
    ELSE TRIM(s.notes)
  END as notes,
  -- Calculate hour of day for analysis
  CASE
    WHEN s.call_timestamp ~ '^[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [ap]m' THEN
      EXTRACT(HOUR FROM TO_TIMESTAMP(s.call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am'))
    ELSE NULL
  END as call_hour,
  -- Determine if weekend
  CASE
    WHEN s.call_timestamp ~ '^[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [ap]m' THEN
      EXTRACT(DOW FROM TO_TIMESTAMP(s.call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am')) IN (0, 6)
    ELSE false
  END as is_weekend,
  -- Urgency score based on time and day
  CASE
    WHEN EXTRACT(DOW FROM TO_TIMESTAMP(s.call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am')) IN (0, 6) THEN 8
    WHEN EXTRACT(HOUR FROM TO_TIMESTAMP(s.call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am')) >= 22 THEN 7
    WHEN EXTRACT(HOUR FROM TO_TIMESTAMP(s.call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am')) <= 6 THEN 7
    ELSE 5
  END as urgency_score,
  s.created_at,
  s.imported_at
FROM stg_concierge_after_hours s;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stg_concierge_weekly_org_id ON stg_concierge_weekly_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_weekly_batch_id ON stg_concierge_weekly_metrics(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_weekly_agent ON stg_concierge_weekly_metrics(agent_name);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_weekly_metric_type ON stg_concierge_weekly_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_weekly_date_range ON stg_concierge_weekly_metrics(date_range);

CREATE INDEX IF NOT EXISTS idx_stg_concierge_daily_org_id ON stg_concierge_daily_interactions(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_daily_batch_id ON stg_concierge_daily_interactions(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_daily_member ON stg_concierge_daily_interactions(member_name);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_daily_date ON stg_concierge_daily_interactions(interaction_date);

CREATE INDEX IF NOT EXISTS idx_stg_concierge_after_hours_org_id ON stg_concierge_after_hours(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_after_hours_batch_id ON stg_concierge_after_hours(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_after_hours_member ON stg_concierge_after_hours(member_name);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_after_hours_timestamp ON stg_concierge_after_hours(call_timestamp);

CREATE INDEX IF NOT EXISTS idx_concierge_issue_categories_type ON concierge_issue_categories(issue_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_concierge_team_members_name ON concierge_team_members(agent_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_concierge_request_types_type ON concierge_request_types(request_type) WHERE is_active = true;
