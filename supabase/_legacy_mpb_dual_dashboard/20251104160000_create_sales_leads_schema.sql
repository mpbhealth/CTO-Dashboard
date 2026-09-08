/*
  # Sales Leads Report System

  ## Overview
  Creates complete schema for sales leads data uploads including staging tables,
  normalized views, and lead source categorization for CSV format:
  Date, Name, Source, Status, Lead Owner, Group Lead?, Recent Notes

  ## New Tables
  1. `stg_sales_leads` - Staging table for raw leads CSV uploads
     - Supports department-specific fields from Leads Reports
     - Handles multiple date formats: "10/13/2025", "21-Oct"
     - Stores multi-line notes and lead status tracking

  2. `lead_source_categories` - Master list of valid lead sources
     - Provides standardized categorization
     - Tracks source effectiveness metrics

  ## Views
  1. `sales_leads` - Normalized view with transformations
     - Standardizes date formats to YYYY-MM-DD
     - Categorizes lead sources
     - Extracts actionable insights from notes
     - Tracks lead status pipeline

  ## Security
  - RLS enabled on all tables
  - CEO and admin roles have full access
  - Sales team can read and insert leads
*/

-- Create lead source categories lookup table
CREATE TABLE IF NOT EXISTS lead_source_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text UNIQUE NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  effectiveness_score decimal(3, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_source_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view lead sources"
  ON lead_source_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage lead sources"
  ON lead_source_categories FOR ALL
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

-- Insert default lead source categories
INSERT INTO lead_source_categories (source_name, category, effectiveness_score) VALUES
  ('Website Visit', 'Digital', 0.25),
  ('Word Of Mouth', 'Referral', 0.45),
  ('Friend Referral', 'Referral', 0.50),
  ('Referall', 'Referral', 0.45),
  ('Former Member', 'Reactivation', 0.35),
  ('Previous Member', 'Reactivation', 0.35),
  ('Articles', 'Content Marketing', 0.20),
  ('Social Media', 'Digital', 0.22),
  ('N/A', 'Unknown', 0.00)
ON CONFLICT (source_name) DO NOTHING;

-- Create stg_sales_leads staging table
CREATE TABLE IF NOT EXISTS stg_sales_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  uploaded_by text,
  upload_batch_id uuid,
  sheet_name text,

  -- Department-specific fields matching Leads Reports CSV format
  lead_date text,
  lead_name text,
  lead_source text,
  lead_status text,
  lead_owner text,
  is_group_lead boolean DEFAULT false,
  recent_notes text,

  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_sales_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stg_sales_leads
CREATE POLICY "CEO and sales team can read leads staging"
  ON stg_sales_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto', 'sales')
    )
  );

CREATE POLICY "Authenticated users can insert leads staging"
  ON stg_sales_leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create sales_leads view with intelligent transformations
CREATE OR REPLACE VIEW sales_leads AS
SELECT
  s.id as staging_id,
  s.org_id,
  -- Smart date parsing for multiple formats
  CASE
    -- Format: "10/13/2025" or "10/14/2025"
    WHEN s.lead_date ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
      TO_DATE(s.lead_date, 'MM/DD/YYYY')
    -- Format: "21-Oct" or "22-Oct"
    WHEN s.lead_date ~ '^\d{1,2}-[A-Za-z]{3}' THEN
      TO_DATE('2025-' || SUBSTRING(s.lead_date FROM '\d{1,2}-([A-Za-z]{3})') || '-' ||
              LPAD(SUBSTRING(s.lead_date FROM '(\d{1,2})-'), 2, '0'), 'YYYY-Mon-DD')
    -- Format: "30-Oct" with year context
    WHEN s.lead_date ~ '^[A-Za-z]{3}-\d{1,2}' THEN
      TO_DATE('2025-' || SUBSTRING(s.lead_date FROM '^([A-Za-z]{3})-') || '-' ||
              LPAD(SUBSTRING(s.lead_date FROM '-(\d{1,2})$'), 2, '0'), 'YYYY-Mon-DD')
    -- Standard format: "2025-10-13"
    WHEN s.lead_date ~ '^\d{4}-\d{2}-\d{2}' THEN
      s.lead_date::date
    ELSE NULL
  END as lead_date,
  NULLIF(TRIM(s.lead_name), '') as lead_name,
  -- Normalize lead source
  COALESCE(
    (SELECT lsc.source_name FROM lead_source_categories lsc
     WHERE LOWER(lsc.source_name) = LOWER(TRIM(s.lead_source))
     AND lsc.is_active = true
     LIMIT 1),
    NULLIF(TRIM(s.lead_source), ''),
    'Unknown'
  ) as lead_source,
  -- Get source category
  COALESCE(
    (SELECT lsc.category FROM lead_source_categories lsc
     WHERE LOWER(lsc.source_name) = LOWER(TRIM(s.lead_source))
     AND lsc.is_active = true
     LIMIT 1),
    'Unknown'
  ) as source_category,
  -- Normalize lead status
  CASE
    WHEN LOWER(TRIM(s.lead_status)) IN ('in process', 'in-process') THEN 'In Process'
    WHEN LOWER(TRIM(s.lead_status)) IN ('first attempt', 'first-attempt') THEN 'First Attempt'
    WHEN LOWER(TRIM(s.lead_status)) = 'closed' THEN 'Closed'
    WHEN LOWER(TRIM(s.lead_status)) IN ('n/a', 'na', '') THEN 'Not Contacted'
    WHEN LOWER(TRIM(s.lead_status)) = 'not contacted' THEN 'Not Contacted'
    ELSE NULLIF(TRIM(s.lead_status), '')
  END as lead_status,
  NULLIF(TRIM(s.lead_owner), '') as lead_owner,
  -- Detect if lead was forwarded from notes
  CASE
    WHEN s.recent_notes ~* '(forwarded|fwd|forward) (to|lead to)' THEN true
    ELSE COALESCE(s.is_group_lead, false)
  END as is_group_lead,
  -- Extract forwarded to person from notes
  CASE
    WHEN s.recent_notes ~* 'forward(ed)? (to|lead to) ([A-Za-z ]+)' THEN
      TRIM(SUBSTRING(s.recent_notes FROM 'forward(ed)? (?:to|lead to) ([A-Za-z ]+)'))
    ELSE NULL
  END as forwarded_to,
  NULLIF(TRIM(s.recent_notes), '') as recent_notes,
  -- Classify note sentiment/action
  CASE
    WHEN s.recent_notes ~* '(left vm|voicemail|left message)' THEN 'VM Left'
    WHEN s.recent_notes ~* '(scheduled|appointment|call scheduled)' THEN 'Appointment Set'
    WHEN s.recent_notes ~* '(quote|quoted|presented)' THEN 'Quote Provided'
    WHEN s.recent_notes ~* '(closed|won|enrolled)' THEN 'Won'
    WHEN s.recent_notes ~* '(lost|not interested|declined)' THEN 'Lost'
    WHEN s.recent_notes ~* '(forward|fwd)' THEN 'Forwarded'
    WHEN s.recent_notes ~* '(missed|no show)' THEN 'Missed Contact'
    WHEN s.recent_notes IS NULL OR TRIM(s.recent_notes) = '' THEN 'No Action'
    ELSE 'Other'
  END as note_action_type,
  s.created_at,
  s.imported_at
FROM stg_sales_leads s;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_org_id ON stg_sales_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_batch_id ON stg_sales_leads(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_name ON stg_sales_leads(lead_name);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_source ON stg_sales_leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_status ON stg_sales_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_owner ON stg_sales_leads(lead_owner);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_date ON stg_sales_leads(lead_date);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_is_group ON stg_sales_leads(is_group_lead) WHERE is_group_lead = true;

CREATE INDEX IF NOT EXISTS idx_lead_source_categories_lookup ON lead_source_categories(source_name) WHERE is_active = true;
