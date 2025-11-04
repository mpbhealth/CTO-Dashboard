/*
  # Sales Cancelation Reports System

  ## Overview
  Creates complete schema for sales cancelation data tracking including staging tables,
  normalized views, and cancelation reason categorization for CSV format:
  Name, Reason, Membership, Advisor, Outcome

  ## New Tables
  1. `stg_sales_cancelations` - Staging table for raw cancelation CSV uploads
     - Captures customer churn data
     - Tracks cancelation reasons and advisor retention attempts
     - Stores outcome notes and feedback

  2. `cancelation_reason_categories` - Master list of cancelation reasons
     - Categorizes reasons into strategic buckets
     - Tracks retention strategies and success rates
     - Identifies competitive vs life-event churn

  ## Views
  1. `sales_cancelations` - Normalized view with categorization
     - Groups cancelation reasons into strategic categories
     - Analyzes outcome sentiment
     - Links to membership types for vulnerability analysis
     - Calculates retention opportunity scores

  ## Security
  - RLS enabled on all tables
  - CEO and admin roles have full access
  - Sales and retention teams can read cancelations
*/

-- Create cancelation reason categories lookup table
CREATE TABLE IF NOT EXISTS cancelation_reason_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason_name text UNIQUE NOT NULL,
  category text NOT NULL,
  is_preventable boolean DEFAULT false,
  retention_strategy text,
  priority_level int DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cancelation_reason_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view cancelation reasons"
  ON cancelation_reason_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cancelation reasons"
  ON cancelation_reason_categories FOR ALL
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

-- Insert default cancelation reason categories
INSERT INTO cancelation_reason_categories (reason_name, category, is_preventable, retention_strategy, priority_level) VALUES
  ('Aging into Medicare', 'Life Event', false, 'Offer Medicare supplement products', 5),
  ('Switching to employer-sponsored', 'Competitive Loss', false, 'Exit interview for future reactivation', 4),
  ('Switching to employer-sponsored plan', 'Competitive Loss', false, 'Exit interview for future reactivation', 4),
  ('Found more comprehensive coverage', 'Competitive Loss', true, 'Review coverage gaps and pricing', 1),
  ('Found more compehensive coverage', 'Competitive Loss', true, 'Review coverage gaps and pricing', 1),
  ('Financial Reasons', 'Price Sensitivity', true, 'Offer lower-tier plans or payment options', 2),
  ('Dissatisfied with service', 'Service Issue', true, 'Immediate escalation and resolution', 1),
  ('Other', 'Unknown', true, 'Conduct exit survey', 3)
ON CONFLICT (reason_name) DO NOTHING;

-- Create stg_sales_cancelations staging table
CREATE TABLE IF NOT EXISTS stg_sales_cancelations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  uploaded_by text,
  upload_batch_id uuid,
  sheet_name text,

  -- Department-specific fields matching Cancelation Reports CSV format
  member_name text,
  cancelation_reason text,
  membership_type text,
  advisor_name text,
  outcome_notes text,

  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_sales_cancelations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stg_sales_cancelations
CREATE POLICY "CEO and retention team can read cancelations staging"
  ON stg_sales_cancelations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'sales', 'retention')
    )
  );

CREATE POLICY "Authenticated users can insert cancelations staging"
  ON stg_sales_cancelations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create sales_cancelations view with intelligent transformations
CREATE OR REPLACE VIEW sales_cancelations AS
SELECT
  s.id as staging_id,
  s.org_id,
  NULLIF(TRIM(s.member_name), '') as member_name,
  -- Normalize cancelation reason
  COALESCE(
    (SELECT crc.reason_name FROM cancelation_reason_categories crc
     WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
     LIMIT 1),
    NULLIF(TRIM(s.cancelation_reason), ''),
    'Other'
  ) as cancelation_reason,
  -- Get reason category
  COALESCE(
    (SELECT crc.category FROM cancelation_reason_categories crc
     WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
     LIMIT 1),
    'Unknown'
  ) as reason_category,
  -- Determine if preventable
  COALESCE(
    (SELECT crc.is_preventable FROM cancelation_reason_categories crc
     WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
     LIMIT 1),
    true
  ) as is_preventable,
  -- Get retention strategy
  (SELECT crc.retention_strategy FROM cancelation_reason_categories crc
   WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
   LIMIT 1) as retention_strategy,
  -- Get priority level
  COALESCE(
    (SELECT crc.priority_level FROM cancelation_reason_categories crc
     WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
     LIMIT 1),
    3
  ) as priority_level,
  -- Normalize membership type
  CASE
    WHEN LOWER(TRIM(s.membership_type)) = 'secure hsa' THEN 'Secure HSA'
    WHEN LOWER(TRIM(s.membership_type)) = 'premium hsa' THEN 'Premium HSA'
    WHEN LOWER(TRIM(s.membership_type)) = 'premium care' THEN 'Premium Care'
    WHEN LOWER(TRIM(s.membership_type)) = 'care plus' THEN 'Care Plus'
    WHEN LOWER(TRIM(s.membership_type)) IN ('mec+essentials', 'mec + eseentials', 'essentials') THEN 'MEC+Essentials'
    WHEN LOWER(TRIM(s.membership_type)) = 'direct' THEN 'Direct'
    WHEN TRIM(s.membership_type) = 'N/A' THEN NULL
    ELSE NULLIF(TRIM(s.membership_type), '')
  END as membership_type,
  NULLIF(TRIM(s.advisor_name), '') as advisor_name,
  NULLIF(TRIM(s.outcome_notes), '') as outcome_notes,
  -- Analyze outcome sentiment
  CASE
    WHEN s.outcome_notes ~* '(left vm|voicemail|left message)' THEN 'VM Left'
    WHEN s.outcome_notes ~* '(retained|keeping|staying)' THEN 'Retained'
    WHEN s.outcome_notes ~* '(great feedback|good experience|happy|satisfied|recommend)' THEN 'Positive Exit'
    WHEN s.outcome_notes ~* '(unhappy|disappointed|frustrated|confused|trouble)' THEN 'Negative Exit'
    WHEN s.outcome_notes ~* '(google review|review|testimonial)' THEN 'Review Requested'
    WHEN s.outcome_notes ~* '(could not locate|not found|not in system)' THEN 'Data Error'
    WHEN s.outcome_notes ~* '(denied|refused|will not)' THEN 'Request Denied'
    WHEN s.outcome_notes ~* '(fwd|forward|forwarded)' THEN 'Forwarded'
    WHEN s.outcome_notes IS NULL OR TRIM(s.outcome_notes) = '' THEN 'No Contact'
    ELSE 'Other'
  END as outcome_type,
  -- Calculate retention opportunity score (1-10)
  CASE
    WHEN s.outcome_notes ~* '(retained|keeping|staying)' THEN 10
    WHEN s.outcome_notes ~* '(great feedback|good experience|happy)' THEN 8
    WHEN s.outcome_notes ~* '(will comeback|may return)' THEN 7
    WHEN s.outcome_notes ~* '(left vm|trying to reach)' THEN 5
    WHEN s.outcome_notes ~* '(unhappy|disappointed|frustrated)' THEN 2
    WHEN s.outcome_notes ~* '(could not locate|data error)' THEN 0
    ELSE 3
  END as retention_opportunity_score,
  -- Check if advisor made retention attempt
  CASE
    WHEN s.outcome_notes IS NOT NULL AND TRIM(s.outcome_notes) != '' THEN true
    ELSE false
  END as retention_attempted,
  s.created_at,
  s.imported_at
FROM stg_sales_cancelations s;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_org_id ON stg_sales_cancelations(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_batch_id ON stg_sales_cancelations(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_member_name ON stg_sales_cancelations(member_name);
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_reason ON stg_sales_cancelations(cancelation_reason);
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_membership ON stg_sales_cancelations(membership_type);
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_advisor ON stg_sales_cancelations(advisor_name);

CREATE INDEX IF NOT EXISTS idx_cancelation_reason_categories_lookup ON cancelation_reason_categories(reason_name);
CREATE INDEX IF NOT EXISTS idx_cancelation_reason_categories_preventable ON cancelation_reason_categories(is_preventable) WHERE is_preventable = true;
