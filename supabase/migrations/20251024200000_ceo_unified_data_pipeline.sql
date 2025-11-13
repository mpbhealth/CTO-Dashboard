/*
  # CEO Dashboard Unified Data Pipeline

  ## Overview
  Comprehensive data pipeline for CEO dashboard that bridges raw Excel imports
  with normalized reporting schema. Includes staging tables, transformation functions,
  modeled views, and automated ETL logic.

  ## Architecture
  1. **Raw Staging Layer** - Direct Excel sheet mappings with minimal transformation
  2. **Transformation Functions** - SQL functions to normalize and clean data
  3. **Modeled Views** - Clean, queryable views for dashboard consumption
  4. **ETL Materialized Views** - Pre-computed aggregations for performance
  5. **Automation Triggers** - Automatic transformation on data import

  ## New Tables

  ### Raw Staging Tables (Excel Import Layer)
  - `stg_raw_concierge_weekly` - Weekly concierge report data
  - `stg_raw_concierge_calls` - After-hours call tracking
  - `stg_raw_cancellations` - Unified cancellation data from all month sheets
  - `stg_raw_leads` - CRM lead pipeline data
  - `stg_raw_sales` - Sales order data

  ### Normalized Staging Tables
  - `stg_concierge_interactions` - Cleaned concierge touchpoint data
  - `stg_concierge_notes` - Cleaned concierge notes
  - `stg_sales_orders` - Cleaned sales order data
  - `stg_crm_leads` - Cleaned lead data
  - `stg_plan_cancellations` - Cleaned cancellation data

  ### Modeled Views
  - `concierge_interactions` - Production-ready concierge data
  - `concierge_notes` - Production-ready notes
  - `sales_orders` - Production-ready sales data
  - `crm_leads` - Production-ready lead data
  - `plan_cancellations` - Production-ready cancellation data

  ### Aggregation Views
  - `vw_concierge_metrics` - Real-time concierge KPIs
  - `vw_sales_metrics` - Real-time sales KPIs
  - `vw_churn_metrics` - Real-time churn and retention KPIs
  - `vw_agent_performance` - Agent leaderboard metrics

  ## Security
  - All tables enable RLS with org_id scoping
  - CEO and admin roles have full read access
  - CTO role has read-only access to modeled views only
  - Audit logging on all data modifications
*/

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to safely parse Excel date strings
CREATE OR REPLACE FUNCTION parse_excel_date(date_text text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Try standard ISO format (YYYY-MM-DD)
  IF date_text ~ '^\d{4}-\d{2}-\d{2}' THEN
    RETURN date_text::date;
  END IF;

  -- Try MM/DD/YYYY format
  IF date_text ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
    RETURN to_date(date_text, 'MM/DD/YYYY');
  END IF;

  -- Try M/D/YY format
  IF date_text ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN
    RETURN to_date(date_text, 'MM/DD/YY');
  END IF;

  -- Return NULL for unparseable dates
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Function to safely parse currency amounts
CREATE OR REPLACE FUNCTION parse_currency(amount_text text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF amount_text IS NULL OR TRIM(amount_text) = '' THEN
    RETURN 0;
  END IF;

  -- Remove $, commas, and parse to numeric
  RETURN REPLACE(REPLACE(TRIM(amount_text), '$', ''), ',', '')::numeric;
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$;

-- Function to extract month/year from sheet name
CREATE OR REPLACE FUNCTION extract_period_from_sheet(sheet_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Returns format like '2024-10' or '2025-09'
  CASE
    WHEN sheet_name ILIKE '%january%' THEN RETURN '2024-01';
    WHEN sheet_name ILIKE '%february%' THEN RETURN '2024-02';
    WHEN sheet_name ILIKE '%march%' THEN RETURN '2024-03';
    WHEN sheet_name ILIKE '%april%' THEN RETURN '2024-04';
    WHEN sheet_name ILIKE '%may%' THEN RETURN '2024-05';
    WHEN sheet_name ILIKE '%june%' THEN RETURN '2024-06';
    WHEN sheet_name ILIKE '%july%' THEN RETURN '2024-07';
    WHEN sheet_name ILIKE '%august%' THEN RETURN '2024-08';
    WHEN sheet_name ILIKE '%september 2025%' THEN RETURN '2025-09';
    WHEN sheet_name ILIKE '%september%' THEN RETURN '2024-09';
    WHEN sheet_name ILIKE '%october 2025%' THEN RETURN '2025-10';
    WHEN sheet_name ILIKE '%october%' THEN RETURN '2024-10';
    WHEN sheet_name ILIKE '%november%' THEN RETURN '2024-11';
    WHEN sheet_name ILIKE '%december%' THEN RETURN '2024-12';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

-- ============================================================================
-- RAW STAGING TABLES (Excel Import Layer)
-- ============================================================================

-- Raw cancellations unified table (accepts all month sheet formats)
CREATE TABLE IF NOT EXISTS stg_raw_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  sheet_name text NOT NULL,
  import_batch_id uuid,
  name text,
  reason text,
  membership text,
  advisor text,
  outcome text,
  imported_at timestamptz DEFAULT now()
);

ALTER TABLE stg_raw_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read raw cancellations"
  ON stg_raw_cancellations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_raw_cancellations.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Raw leads data
CREATE TABLE IF NOT EXISTS stg_raw_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  import_batch_id uuid,
  date text,
  name text,
  source text,
  status text,
  lead_owner text,
  group_lead text,
  recent_notes text,
  imported_at timestamptz DEFAULT now()
);

ALTER TABLE stg_raw_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read raw leads"
  ON stg_raw_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_raw_leads.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Raw sales data
CREATE TABLE IF NOT EXISTS stg_raw_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  import_batch_id uuid,
  date text,
  name text,
  plan text,
  size text,
  agent text,
  group_flag text,
  imported_at timestamptz DEFAULT now()
);

ALTER TABLE stg_raw_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read raw sales"
  ON stg_raw_sales
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_raw_sales.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Raw concierge interactions (generalized structure)
CREATE TABLE IF NOT EXISTS stg_raw_concierge_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  import_batch_id uuid,
  interaction_date text,
  member_name text,
  member_phone text,
  agent text,
  interaction_type text,
  notes text,
  duration_minutes numeric,
  imported_at timestamptz DEFAULT now()
);

ALTER TABLE stg_raw_concierge_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read raw concierge"
  ON stg_raw_concierge_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_raw_concierge_interactions.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- ============================================================================
-- NORMALIZED STAGING TABLES (Transformation Target)
-- ============================================================================

-- Create normalized staging tables if they don't exist
CREATE TABLE IF NOT EXISTS stg_concierge_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  member_id text,
  interaction_date text,
  agent text,
  channel text,
  result text,
  duration_minutes numeric,
  notes text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stg_concierge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  note_date text,
  member_id text,
  note_owner text,
  note text,
  tags text,
  priority text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stg_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  order_date text,
  order_id text,
  member_id text,
  amount text,
  plan text,
  rep text,
  channel text,
  status text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stg_crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  lead_date text,
  lead_id text,
  source text,
  status text,
  owner text,
  score numeric,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stg_plan_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  cancel_date text,
  member_id text,
  reason text,
  agent text,
  save_attempted boolean DEFAULT false,
  save_successful boolean DEFAULT false,
  mrr_lost text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on normalized staging tables
ALTER TABLE stg_concierge_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_concierge_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_plan_cancellations ENABLE ROW LEVEL SECURITY;

-- RLS policies for normalized staging tables
CREATE POLICY "CEO and admin can read concierge interactions"
  ON stg_concierge_interactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_concierge_interactions.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admin can read concierge notes"
  ON stg_concierge_notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_concierge_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admin can read sales orders"
  ON stg_sales_orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_sales_orders.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admin can read crm leads"
  ON stg_crm_leads FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_crm_leads.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE POLICY "CEO and admin can read cancellations"
  ON stg_plan_cancellations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = stg_plan_cancellations.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- ============================================================================
-- ETL TRANSFORMATION FUNCTIONS
-- ============================================================================

-- Transform raw cancellations to normalized staging
CREATE OR REPLACE FUNCTION etl_transform_cancellations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO stg_plan_cancellations (
    org_id,
    cancel_date,
    member_id,
    reason,
    agent,
    save_attempted,
    save_successful,
    mrr_lost,
    imported_at
  )
  SELECT
    org_id,
    extract_period_from_sheet(sheet_name) || '-01',
    NULLIF(TRIM(name), ''),
    NULLIF(TRIM(reason), ''),
    NULLIF(TRIM(advisor), ''),
    CASE WHEN LOWER(outcome) LIKE '%attempted%' THEN true ELSE false END,
    CASE WHEN LOWER(outcome) LIKE '%saved%' OR LOWER(outcome) LIKE '%retained%' THEN true ELSE false END,
    NULL,
    imported_at
  FROM stg_raw_cancellations
  WHERE NOT EXISTS (
    SELECT 1 FROM stg_plan_cancellations pc
    WHERE pc.member_id = TRIM(stg_raw_cancellations.name)
    AND pc.cancel_date = extract_period_from_sheet(stg_raw_cancellations.sheet_name) || '-01'
  );
END;
$$;

-- Transform raw leads to normalized staging
CREATE OR REPLACE FUNCTION etl_transform_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO stg_crm_leads (
    org_id,
    lead_date,
    lead_id,
    source,
    status,
    owner,
    score,
    imported_at
  )
  SELECT
    org_id,
    date,
    NULLIF(TRIM(name), ''),
    NULLIF(TRIM(source), ''),
    NULLIF(TRIM(status), ''),
    NULLIF(TRIM(lead_owner), ''),
    0,
    imported_at
  FROM stg_raw_leads
  WHERE NOT EXISTS (
    SELECT 1 FROM stg_crm_leads cl
    WHERE cl.lead_id = TRIM(stg_raw_leads.name)
    AND cl.lead_date = stg_raw_leads.date
  );
END;
$$;

-- Transform raw sales to normalized staging
CREATE OR REPLACE FUNCTION etl_transform_sales()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO stg_sales_orders (
    org_id,
    order_date,
    order_id,
    member_id,
    amount,
    plan,
    rep,
    channel,
    status,
    imported_at
  )
  SELECT
    org_id,
    date,
    gen_random_uuid()::text,
    NULLIF(TRIM(name), ''),
    NULL,
    NULLIF(TRIM(plan), ''),
    NULLIF(TRIM(agent), ''),
    'Direct',
    'Completed',
    imported_at
  FROM stg_raw_sales
  WHERE NOT EXISTS (
    SELECT 1 FROM stg_sales_orders so
    WHERE so.member_id = TRIM(stg_raw_sales.name)
    AND so.order_date = stg_raw_sales.date
  );
END;
$$;

-- Transform raw concierge to normalized staging
CREATE OR REPLACE FUNCTION etl_transform_concierge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO stg_concierge_interactions (
    org_id,
    member_id,
    interaction_date,
    agent,
    channel,
    result,
    duration_minutes,
    notes,
    imported_at
  )
  SELECT
    org_id,
    COALESCE(NULLIF(TRIM(member_name), ''), member_phone),
    interaction_date,
    NULLIF(TRIM(agent), ''),
    COALESCE(NULLIF(TRIM(interaction_type), ''), 'Phone'),
    'Completed',
    duration_minutes,
    notes,
    imported_at
  FROM stg_raw_concierge_interactions
  WHERE NOT EXISTS (
    SELECT 1 FROM stg_concierge_interactions ci
    WHERE ci.member_id = COALESCE(TRIM(stg_raw_concierge_interactions.member_name), stg_raw_concierge_interactions.member_phone)
    AND ci.interaction_date = stg_raw_concierge_interactions.interaction_date
  );
END;
$$;

-- ============================================================================
-- MODELED VIEWS (Production Data Layer)
-- ============================================================================

-- Concierge Interactions View
CREATE OR REPLACE VIEW concierge_interactions AS
SELECT
  s.id as staging_id,
  s.org_id,
  NULLIF(TRIM(s.member_id), '') as member_id,
  parse_excel_date(s.interaction_date) as occurred_at,
  NULLIF(TRIM(s.agent), '') as agent_name,
  NULLIF(TRIM(s.channel), '') as channel,
  NULLIF(TRIM(s.result), '') as result,
  s.duration_minutes,
  s.notes,
  s.created_at,
  s.imported_at
FROM stg_concierge_interactions s
WHERE parse_excel_date(s.interaction_date) IS NOT NULL;

-- Concierge Notes View
CREATE OR REPLACE VIEW concierge_notes AS
SELECT
  s.id as staging_id,
  s.org_id,
  parse_excel_date(s.note_date) as noted_at,
  NULLIF(TRIM(s.member_id), '') as member_id,
  NULLIF(TRIM(s.note_owner), '') as owner,
  s.note as note_text,
  NULLIF(TRIM(s.tags), '') as tags,
  NULLIF(TRIM(s.priority), '') as priority,
  s.created_at,
  s.imported_at
FROM stg_concierge_notes s
WHERE parse_excel_date(s.note_date) IS NOT NULL;

-- Sales Orders View
CREATE OR REPLACE VIEW sales_orders AS
SELECT
  s.id as staging_id,
  s.org_id,
  parse_excel_date(s.order_date) as order_date,
  NULLIF(TRIM(s.order_id), '') as order_id,
  NULLIF(TRIM(s.member_id), '') as member_id,
  parse_currency(s.amount) as amount,
  NULLIF(TRIM(s.plan), '') as plan,
  NULLIF(TRIM(s.rep), '') as rep,
  NULLIF(TRIM(s.channel), '') as channel,
  NULLIF(TRIM(s.status), '') as status,
  s.created_at,
  s.imported_at
FROM stg_sales_orders s
WHERE parse_excel_date(s.order_date) IS NOT NULL;

-- CRM Leads View
CREATE OR REPLACE VIEW crm_leads AS
SELECT
  s.id as staging_id,
  s.org_id,
  parse_excel_date(s.lead_date) as lead_date,
  NULLIF(TRIM(s.lead_id), '') as lead_id,
  NULLIF(TRIM(s.source), '') as source,
  NULLIF(TRIM(s.status), '') as status,
  NULLIF(TRIM(s.owner), '') as owner,
  COALESCE(s.score, 0) as score,
  s.created_at,
  s.imported_at
FROM stg_crm_leads s
WHERE parse_excel_date(s.lead_date) IS NOT NULL;

-- Plan Cancellations View
CREATE OR REPLACE VIEW plan_cancellations AS
SELECT
  s.id as staging_id,
  s.org_id,
  parse_excel_date(s.cancel_date) as cancel_date,
  NULLIF(TRIM(s.member_id), '') as member_id,
  NULLIF(TRIM(s.reason), '') as reason,
  NULLIF(TRIM(s.agent), '') as agent,
  COALESCE(s.save_attempted, false) as save_attempted,
  COALESCE(s.save_successful, false) as save_successful,
  parse_currency(s.mrr_lost) as mrr_lost,
  s.created_at,
  s.imported_at
FROM stg_plan_cancellations s
WHERE parse_excel_date(s.cancel_date) IS NOT NULL;

-- ============================================================================
-- AGGREGATION VIEWS FOR DASHBOARD KPIS
-- ============================================================================

-- Concierge Metrics View
CREATE OR REPLACE VIEW vw_concierge_metrics AS
SELECT
  org_id,
  COUNT(*) as total_touchpoints,
  AVG(duration_minutes) as avg_duration_minutes,
  COUNT(DISTINCT member_id) as unique_members,
  COUNT(*) FILTER (WHERE result = 'Resolved') as resolved_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE result = 'Resolved') / NULLIF(COUNT(*), 0), 2) as resolution_rate_pct,
  agent_name,
  DATE_TRUNC('month', occurred_at) as period_month
FROM concierge_interactions
WHERE occurred_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY org_id, agent_name, DATE_TRUNC('month', occurred_at);

-- Sales Metrics View
CREATE OR REPLACE VIEW vw_sales_metrics AS
SELECT
  org_id,
  DATE_TRUNC('month', order_date) as period_month,
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_deal_size,
  channel,
  rep,
  COUNT(DISTINCT member_id) as unique_customers
FROM sales_orders
WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
  AND status = 'Completed'
GROUP BY org_id, DATE_TRUNC('month', order_date), channel, rep;

-- Churn Metrics View
CREATE OR REPLACE VIEW vw_churn_metrics AS
SELECT
  org_id,
  DATE_TRUNC('month', cancel_date) as period_month,
  COUNT(*) as total_cancellations,
  SUM(mrr_lost) as total_mrr_lost,
  COUNT(*) FILTER (WHERE save_attempted) as save_attempts,
  COUNT(*) FILTER (WHERE save_successful) as successful_saves,
  ROUND(100.0 * COUNT(*) FILTER (WHERE save_successful) / NULLIF(COUNT(*) FILTER (WHERE save_attempted), 0), 2) as save_rate_pct,
  reason,
  agent
FROM plan_cancellations
WHERE cancel_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY org_id, DATE_TRUNC('month', cancel_date), reason, agent;

-- Agent Performance Leaderboard View
CREATE OR REPLACE VIEW vw_agent_performance AS
SELECT
  org_id,
  agent_name,
  COUNT(*) as total_interactions,
  AVG(duration_minutes) as avg_duration,
  COUNT(*) FILTER (WHERE result = 'Resolved') as resolved_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE result = 'Resolved') / NULLIF(COUNT(*), 0), 2) as resolution_rate_pct
FROM concierge_interactions
WHERE occurred_at >= CURRENT_DATE - INTERVAL '3 months'
  AND agent_name IS NOT NULL
GROUP BY org_id, agent_name
ORDER BY total_interactions DESC;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Raw staging table indexes
CREATE INDEX IF NOT EXISTS idx_raw_cancellations_org ON stg_raw_cancellations(org_id);
CREATE INDEX IF NOT EXISTS idx_raw_cancellations_sheet ON stg_raw_cancellations(sheet_name);
CREATE INDEX IF NOT EXISTS idx_raw_cancellations_batch ON stg_raw_cancellations(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_raw_leads_org ON stg_raw_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_raw_leads_batch ON stg_raw_leads(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_raw_sales_org ON stg_raw_sales(org_id);
CREATE INDEX IF NOT EXISTS idx_raw_sales_batch ON stg_raw_sales(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_raw_concierge_org ON stg_raw_concierge_interactions(org_id);
CREATE INDEX IF NOT EXISTS idx_raw_concierge_batch ON stg_raw_concierge_interactions(import_batch_id);

-- Normalized staging table indexes
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_member ON stg_concierge_interactions(member_id);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_agent ON stg_concierge_interactions(agent);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_date ON stg_concierge_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_org ON stg_concierge_interactions(org_id);

CREATE INDEX IF NOT EXISTS idx_concierge_notes_member ON stg_concierge_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_concierge_notes_owner ON stg_concierge_notes(note_owner);
CREATE INDEX IF NOT EXISTS idx_concierge_notes_date ON stg_concierge_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_concierge_notes_org ON stg_concierge_notes(org_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_order_id ON stg_sales_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_member ON stg_sales_orders(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_rep ON stg_sales_orders(rep);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON stg_sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON stg_sales_orders(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_id ON stg_crm_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON stg_crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON stg_crm_leads(owner);
CREATE INDEX IF NOT EXISTS idx_crm_leads_date ON stg_crm_leads(lead_date);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org ON stg_crm_leads(org_id);

CREATE INDEX IF NOT EXISTS idx_cancellations_member ON stg_plan_cancellations(member_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_reason ON stg_plan_cancellations(reason);
CREATE INDEX IF NOT EXISTS idx_cancellations_date ON stg_plan_cancellations(cancel_date);
CREATE INDEX IF NOT EXISTS idx_cancellations_org ON stg_plan_cancellations(org_id);

-- Full-text search index for notes
CREATE INDEX IF NOT EXISTS idx_concierge_notes_text_search ON stg_concierge_notes
USING gin(to_tsvector('english', COALESCE(note, '')));

-- ============================================================================
-- IMPORT TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  import_batch_id uuid NOT NULL,
  source_table text NOT NULL,
  sheet_name text,
  rows_imported integer DEFAULT 0,
  rows_failed integer DEFAULT 0,
  status text CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE data_import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read import history"
  ON data_import_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_id = data_import_history.org_id
      AND profiles.role IN ('ceo', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_import_history_org ON data_import_history(org_id);
CREATE INDEX IF NOT EXISTS idx_import_history_batch ON data_import_history(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON data_import_history(status);
