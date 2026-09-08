/*
  # Concierge Upload Templates and Schema Enhancements

  ## Summary
  This migration creates upload templates for all three Concierge report types and enhances
  the existing schema to support robust CSV ingestion with validation, error tracking, and
  data quality monitoring.

  ## New Tables
  1. `concierge_upload_templates` - Template definitions for the three report types
  2. `concierge_upload_errors` - Detailed error tracking for failed row imports
  3. `concierge_data_quality_log` - Data quality issues and warnings

  ## Template Definitions
  - **Weekly Metrics Template**: Multi-column format with agent-specific metric values
  - **Daily Interactions Template**: Date-grouped format with member interactions
  - **After Hours Template**: Timestamp-based call log with phone numbers

  ## Enhancements
  - Added upload batch tracking columns to staging tables
  - Created validation functions for each report type
  - Added indexes for performance optimization
  - Enhanced RLS policies for upload error visibility

  ## Security
  - RLS enabled on all new tables
  - CEO, CTO, and Concierge roles have appropriate access
  - Upload errors visible only to authorized users
*/

-- ============================================================================
-- UPLOAD TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS concierge_upload_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  subdepartment text NOT NULL CHECK (subdepartment IN ('weekly', 'daily', 'after_hours')),
  display_name text NOT NULL,
  description text,
  file_name_pattern text,
  expected_columns jsonb NOT NULL,
  validation_rules jsonb,
  transformation_notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE concierge_upload_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view concierge templates"
  ON concierge_upload_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage concierge templates"
  ON concierge_upload_templates FOR ALL
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

-- ============================================================================
-- UPLOAD ERROR TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS concierge_upload_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_batch_id uuid NOT NULL,
  subdepartment text NOT NULL,
  row_number int,
  error_type text NOT NULL,
  error_message text NOT NULL,
  row_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE concierge_upload_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view upload errors"
  ON concierge_upload_errors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'concierge')
    )
  );

CREATE POLICY "System can insert upload errors"
  ON concierge_upload_errors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_concierge_upload_errors_batch ON concierge_upload_errors(upload_batch_id);
CREATE INDEX idx_concierge_upload_errors_subdept ON concierge_upload_errors(subdepartment);

-- ============================================================================
-- DATA QUALITY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS concierge_data_quality_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_batch_id uuid,
  subdepartment text NOT NULL,
  check_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  message text NOT NULL,
  affected_rows int DEFAULT 0,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE concierge_data_quality_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view data quality log"
  ON concierge_data_quality_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'concierge')
    )
  );

CREATE POLICY "System can insert quality checks"
  ON concierge_data_quality_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_concierge_quality_log_batch ON concierge_data_quality_log(upload_batch_id);
CREATE INDEX idx_concierge_quality_log_severity ON concierge_data_quality_log(severity);

-- ============================================================================
-- INSERT UPLOAD TEMPLATES
-- ============================================================================

INSERT INTO concierge_upload_templates (
  template_name,
  subdepartment,
  display_name,
  description,
  file_name_pattern,
  expected_columns,
  validation_rules,
  transformation_notes
) VALUES
(
  'concierge_weekly_metrics',
  'weekly',
  'Concierge Weekly Performance Metrics',
  'Weekly team performance report with metrics for each agent including members attended, phone time, tasks, and service requests',
  'Concierge Report*.csv',
  '["date_range", "agent_columns", "metric_rows", "notes_column"]'::jsonb,
  '{
    "required_metrics": ["Members attended to", "Phone Time", "CRM Tasks", "RX Requests", "Imaging Requests", "Lab Requests", "Appt Requests"],
    "date_format": "MM.DD.YY-MM.DD.YY",
    "max_phone_hours_per_week": 80,
    "max_members_per_week": 500
  }'::jsonb,
  'Multi-column format with date ranges as first column, metric types in subsequent rows, and agent-specific values in named columns. Supports dynamic agent columns (Ace, Adam, Angee, Tupac, Leo, Julia). Notes column is typically the last unnamed column.'
),
(
  'concierge_daily_interactions',
  'daily',
  'Concierge Daily Member Interactions',
  'Daily interaction log showing member touchpoints, issue descriptions, and resolution notes grouped by date',
  'Concierge Report2*.csv',
  '["date", "member_name", "issue_description", "notes"]'::jsonb,
  '{
    "date_format": "MM.DD.YY",
    "detect_no_calls": true,
    "categorize_issues": true,
    "max_interactions_per_day": 200
  }'::jsonb,
  'Date-grouped format where first column contains dates (MM.DD.YY), followed by member interactions. Detects "NO CALLS" entries for days without activity. Issue descriptions are automatically categorized using keyword matching.'
),
(
  'concierge_after_hours',
  'after_hours',
  'Concierge After-Hours Call Log',
  'After-hours and emergency call tracking with timestamps, member information, and phone numbers for calls received outside business hours (8pm-8am EST)',
  'Concierge Report3*.csv',
  '["timestamp", "member_with_phone", "notes"]'::jsonb,
  '{
    "timestamp_format": "Mon DD, YYYY, HH12:MI:SS am",
    "phone_number_format": "+1XXXXXXXXXX",
    "business_hours_start": 8,
    "business_hours_end": 20,
    "urgency_scoring": true
  }'::jsonb,
  'Timestamp-based format with member names and phone numbers in format "NAME (+PHONENUMBER)". System extracts name and phone separately. Automatically calculates urgency scores based on time of day and day of week. Validates calls are actually after-hours.'
)
ON CONFLICT (template_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  expected_columns = EXCLUDED.expected_columns,
  validation_rules = EXCLUDED.validation_rules,
  transformation_notes = EXCLUDED.transformation_notes,
  updated_at = now();

-- ============================================================================
-- ENHANCE STAGING TABLES WITH METADATA
-- ============================================================================

-- Add metadata columns to weekly metrics staging if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stg_concierge_weekly_metrics'
    AND column_name = 'file_name'
  ) THEN
    ALTER TABLE stg_concierge_weekly_metrics
    ADD COLUMN file_name text,
    ADD COLUMN row_number int,
    ADD COLUMN processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'error')),
    ADD COLUMN error_message text;
  END IF;
END $$;

-- Add metadata columns to daily interactions staging if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stg_concierge_daily_interactions'
    AND column_name = 'file_name'
  ) THEN
    ALTER TABLE stg_concierge_daily_interactions
    ADD COLUMN file_name text,
    ADD COLUMN row_number int,
    ADD COLUMN processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'error')),
    ADD COLUMN error_message text;
  END IF;
END $$;

-- Add metadata columns to after hours staging if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stg_concierge_after_hours'
    AND column_name = 'file_name'
  ) THEN
    ALTER TABLE stg_concierge_after_hours
    ADD COLUMN file_name text,
    ADD COLUMN row_number int,
    ADD COLUMN processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'error')),
    ADD COLUMN error_message text;
  END IF;
END $$;

-- ============================================================================
-- CREATE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate weekly metrics row
CREATE OR REPLACE FUNCTION validate_concierge_weekly_metric(
  p_date_range text,
  p_agent_name text,
  p_metric_type text,
  p_metric_value text
) RETURNS jsonb AS $$
DECLARE
  v_errors text[] := '{}';
  v_warnings text[] := '{}';
  v_parsed_value numeric;
  v_phone_hours numeric;
BEGIN
  -- Validate date range format
  IF p_date_range IS NULL OR p_date_range = '' THEN
    v_errors := array_append(v_errors, 'Date range is required');
  ELSIF NOT p_date_range ~ '^\d{1,2}\.\d{1,2}\.\d{2}-\d{1,2}\.\d{1,2}\.\d{2}$' THEN
    v_errors := array_append(v_errors, 'Invalid date range format. Expected MM.DD.YY-MM.DD.YY');
  END IF;

  -- Validate agent name
  IF p_agent_name IS NULL OR p_agent_name = '' THEN
    v_errors := array_append(v_errors, 'Agent name is required');
  ELSIF NOT EXISTS (SELECT 1 FROM concierge_team_members WHERE agent_name = p_agent_name AND is_active = true) THEN
    v_warnings := array_append(v_warnings, 'Agent not found in team roster: ' || p_agent_name);
  END IF;

  -- Validate metric type
  IF p_metric_type IS NULL OR p_metric_type = '' THEN
    v_errors := array_append(v_errors, 'Metric type is required');
  END IF;

  -- Validate metric value based on type
  IF p_metric_value IS NULL OR p_metric_value = '' THEN
    v_errors := array_append(v_errors, 'Metric value is required');
  ELSE
    CASE
      WHEN p_metric_type = 'Members attended to' THEN
        v_parsed_value := COALESCE(NULLIF(REGEXP_REPLACE(p_metric_value, '[^0-9]', '', 'g'), '')::numeric, 0);
        IF v_parsed_value < 0 OR v_parsed_value > 500 THEN
          v_warnings := array_append(v_warnings, 'Member count outside typical range: ' || p_metric_value);
        END IF;

      WHEN p_metric_type = 'Phone Time' THEN
        -- Parse "7:30 hours" format
        IF p_metric_value ~ '^\d+:\d+\s*hours?' THEN
          v_phone_hours := (SUBSTRING(p_metric_value FROM '^(\d+):')::numeric +
                           SUBSTRING(p_metric_value FROM ':(\d+)')::numeric / 60.0);
        ELSIF p_metric_value ~ '^\d+\.?\d*\s*hours?' THEN
          v_phone_hours := REGEXP_REPLACE(p_metric_value, '[^0-9.]', '', 'g')::numeric;
        ELSE
          v_phone_hours := 0;
        END IF;

        IF v_phone_hours < 0 OR v_phone_hours > 80 THEN
          v_warnings := array_append(v_warnings, 'Phone hours outside typical range: ' || p_metric_value);
        END IF;

      ELSE
        -- Generic numeric validation
        BEGIN
          v_parsed_value := COALESCE(NULLIF(REGEXP_REPLACE(p_metric_value, '[^0-9]', '', 'g'), '')::numeric, 0);
        EXCEPTION WHEN OTHERS THEN
          v_errors := array_append(v_errors, 'Unable to parse metric value: ' || p_metric_value);
        END;
    END CASE;
  END IF;

  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors,
    'warnings', v_warnings
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate daily interaction row
CREATE OR REPLACE FUNCTION validate_concierge_daily_interaction(
  p_interaction_date text,
  p_member_name text,
  p_issue_description text
) RETURNS jsonb AS $$
DECLARE
  v_errors text[] := '{}';
  v_warnings text[] := '{}';
BEGIN
  -- Validate date format
  IF p_interaction_date IS NULL OR p_interaction_date = '' THEN
    v_errors := array_append(v_errors, 'Interaction date is required');
  ELSIF NOT p_interaction_date ~ '^\d{1,2}\.\d{1,2}\.\d{2}$' THEN
    v_errors := array_append(v_errors, 'Invalid date format. Expected MM.DD.YY');
  END IF;

  -- Validate member name (allow NO CALLS)
  IF p_member_name IS NULL OR p_member_name = '' THEN
    v_errors := array_append(v_errors, 'Member name is required');
  END IF;

  -- Check if issue description is provided (not required for NO CALLS days)
  IF p_member_name != 'NO CALLS' AND (p_issue_description IS NULL OR p_issue_description = '') THEN
    v_warnings := array_append(v_warnings, 'Issue description is empty for interaction');
  END IF;

  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors,
    'warnings', v_warnings
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate after-hours call
CREATE OR REPLACE FUNCTION validate_concierge_after_hours_call(
  p_call_timestamp text,
  p_member_name text,
  p_phone_number text
) RETURNS jsonb AS $$
DECLARE
  v_errors text[] := '{}';
  v_warnings text[] := '{}';
  v_parsed_timestamp timestamptz;
  v_hour int;
BEGIN
  -- Validate timestamp format
  IF p_call_timestamp IS NULL OR p_call_timestamp = '' THEN
    v_errors := array_append(v_errors, 'Call timestamp is required');
  ELSE
    BEGIN
      v_parsed_timestamp := TO_TIMESTAMP(p_call_timestamp, 'Mon DD, YYYY, HH12:MI:SS am');
      v_hour := EXTRACT(HOUR FROM v_parsed_timestamp);

      -- Check if truly after hours
      IF v_hour >= 8 AND v_hour < 20 THEN
        v_warnings := array_append(v_warnings, 'Call appears to be during business hours: ' || p_call_timestamp);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 'Invalid timestamp format. Expected "Mon DD, YYYY, HH:MI:SS am/pm"');
    END;
  END IF;

  -- Validate member name
  IF p_member_name IS NULL OR p_member_name = '' THEN
    v_errors := array_append(v_errors, 'Member name is required');
  END IF;

  -- Validate phone number
  IF p_phone_number IS NOT NULL AND p_phone_number != '' THEN
    IF LENGTH(REGEXP_REPLACE(p_phone_number, '[^0-9]', '', 'g')) < 10 THEN
      v_warnings := array_append(v_warnings, 'Phone number appears incomplete: ' || p_phone_number);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors,
    'warnings', v_warnings
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE SUMMARY VIEWS
-- ============================================================================

-- Weekly metrics summary view
CREATE OR REPLACE VIEW concierge_weekly_summary AS
SELECT
  date_range,
  week_start_date,
  week_end_date,
  COUNT(DISTINCT agent_name) as active_agents,
  SUM(CASE WHEN metric_type = 'Members attended to' THEN metric_value ELSE 0 END) as total_members,
  ROUND(AVG(CASE WHEN metric_type = 'Phone Time' THEN metric_value END)::numeric, 2) as avg_phone_hours,
  SUM(CASE WHEN metric_type = 'CRM Tasks' THEN metric_value ELSE 0 END) as total_tasks,
  SUM(CASE WHEN metric_type = 'RX Requests' THEN metric_value ELSE 0 END) as total_rx_requests,
  COUNT(*) as metric_count,
  MAX(imported_at) as last_imported
FROM concierge_weekly_metrics
GROUP BY date_range, week_start_date, week_end_date
ORDER BY week_start_date DESC;

-- Daily interactions summary view
CREATE OR REPLACE VIEW concierge_daily_summary AS
SELECT
  interaction_date,
  COUNT(*) FILTER (WHERE NOT is_no_calls_day) as total_interactions,
  COUNT(DISTINCT member_name) FILTER (WHERE NOT is_no_calls_day) as unique_members,
  COUNT(*) FILTER (WHERE is_no_calls_day) as no_call_days,
  COUNT(*) FILTER (WHERE priority_level = 1) as high_priority,
  COUNT(*) FILTER (WHERE priority_level = 2) as medium_priority,
  COUNT(*) FILTER (WHERE priority_level = 3) as low_priority,
  array_agg(DISTINCT issue_category) FILTER (WHERE issue_category IS NOT NULL) as issue_categories,
  MAX(imported_at) as last_imported
FROM concierge_daily_interactions
GROUP BY interaction_date
ORDER BY interaction_date DESC;

-- After-hours call summary view
CREATE OR REPLACE VIEW concierge_after_hours_summary AS
SELECT
  DATE(call_timestamp) as call_date,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE is_weekend) as weekend_calls,
  COUNT(*) FILTER (WHERE call_hour >= 22 OR call_hour <= 6) as late_night_calls,
  ROUND(AVG(urgency_score)::numeric, 2) as avg_urgency,
  COUNT(DISTINCT member_name) as unique_callers,
  array_agg(DISTINCT call_hour ORDER BY call_hour) as call_hours,
  MAX(imported_at) as last_imported
FROM concierge_after_hours
GROUP BY DATE(call_timestamp)
ORDER BY call_date DESC;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Additional indexes for query performance
CREATE INDEX IF NOT EXISTS idx_stg_weekly_file_batch
ON stg_concierge_weekly_metrics(file_name, upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_stg_daily_file_batch
ON stg_concierge_daily_interactions(file_name, upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_stg_after_hours_file_batch
ON stg_concierge_after_hours(file_name, upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_stg_weekly_status
ON stg_concierge_weekly_metrics(processing_status) WHERE processing_status != 'processed';

CREATE INDEX IF NOT EXISTS idx_stg_daily_status
ON stg_concierge_daily_interactions(processing_status) WHERE processing_status != 'processed';

CREATE INDEX IF NOT EXISTS idx_stg_after_hours_status
ON stg_concierge_after_hours(processing_status) WHERE processing_status != 'processed';
