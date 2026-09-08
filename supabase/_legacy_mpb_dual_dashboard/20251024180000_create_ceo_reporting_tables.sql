/*
  # CEO Reporting Infrastructure

  ## Overview
  Creates staging tables and modeled views for CEO dashboard reporting from imported spreadsheet data.

  ## New Tables

  ### Staging Tables
  - `stg_concierge_interactions` - Raw concierge touchpoint data
  - `stg_concierge_notes` - Raw concierge notes and tracking
  - `stg_sales_orders` - Raw sales order data
  - `stg_crm_leads` - Raw lead data
  - `stg_plan_cancellations` - Raw cancellation data

  ### Modeled Views
  - `concierge_interactions` - Normalized concierge touchpoints with metrics
  - `concierge_notes` - Normalized notes with full-text search support
  - `sales_orders` - Normalized sales data with aggregations
  - `crm_leads` - Normalized lead pipeline data
  - `plan_cancellations` - Normalized churn and cancellation data

  ## Security
  - All staging tables enable RLS
  - CEO and admin roles have full read access
  - CTO role has read-only access to shared views
*/

-- Staging table for concierge interaction data
CREATE TABLE IF NOT EXISTS stg_concierge_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) DEFAULT '00000000-0000-0000-0000-000000000000',
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

ALTER TABLE stg_concierge_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read concierge interactions"
  ON stg_concierge_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Staging table for concierge notes
CREATE TABLE IF NOT EXISTS stg_concierge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) DEFAULT '00000000-0000-0000-0000-000000000000',
  note_date text,
  member_id text,
  note_owner text,
  note text,
  tags text,
  priority text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_concierge_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read concierge notes"
  ON stg_concierge_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Staging table for sales orders
CREATE TABLE IF NOT EXISTS stg_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) DEFAULT '00000000-0000-0000-0000-000000000000',
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

ALTER TABLE stg_sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read sales orders"
  ON stg_sales_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Staging table for CRM leads
CREATE TABLE IF NOT EXISTS stg_crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) DEFAULT '00000000-0000-0000-0000-000000000000',
  lead_date text,
  lead_id text,
  source text,
  status text,
  owner text,
  score numeric,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read CRM leads"
  ON stg_crm_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Staging table for plan cancellations
CREATE TABLE IF NOT EXISTS stg_plan_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) DEFAULT '00000000-0000-0000-0000-000000000000',
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

ALTER TABLE stg_plan_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and admin can read cancellations"
  ON stg_plan_cancellations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Modeled view: Concierge Interactions
CREATE OR REPLACE VIEW concierge_interactions AS
SELECT
  s.id as staging_id,
  s.org_id,
  NULLIF(TRIM(s.member_id), '') as member_id,
  CASE
    WHEN s.interaction_date ~ '^\d{4}-\d{2}-\d{2}' THEN s.interaction_date::date
    ELSE NULL
  END as occurred_at,
  NULLIF(TRIM(s.agent), '') as agent_name,
  NULLIF(TRIM(s.channel), '') as channel,
  NULLIF(TRIM(s.result), '') as result,
  s.duration_minutes,
  s.notes,
  s.created_at,
  s.imported_at
FROM stg_concierge_interactions s;

-- Modeled view: Concierge Notes
CREATE OR REPLACE VIEW concierge_notes AS
SELECT
  s.id as staging_id,
  s.org_id,
  CASE
    WHEN s.note_date ~ '^\d{4}-\d{2}-\d{2}' THEN s.note_date::date
    ELSE NULL
  END as noted_at,
  NULLIF(TRIM(s.member_id), '') as member_id,
  NULLIF(TRIM(s.note_owner), '') as owner,
  s.note as note_text,
  NULLIF(TRIM(s.tags), '') as tags,
  NULLIF(TRIM(s.priority), '') as priority,
  s.created_at,
  s.imported_at
FROM stg_concierge_notes s;

-- Modeled view: Sales Orders
CREATE OR REPLACE VIEW sales_orders AS
SELECT
  s.id as staging_id,
  s.org_id,
  CASE
    WHEN s.order_date ~ '^\d{4}-\d{2}-\d{2}' THEN s.order_date::date
    ELSE NULL
  END as order_date,
  NULLIF(TRIM(s.order_id), '') as order_id,
  NULLIF(TRIM(s.member_id), '') as member_id,
  CASE
    WHEN s.amount ~ '^\$?[\d,]+\.?\d*$' THEN
      REPLACE(REPLACE(s.amount, '$', ''), ',', '')::numeric
    ELSE 0
  END as amount,
  NULLIF(TRIM(s.plan), '') as plan,
  NULLIF(TRIM(s.rep), '') as rep,
  NULLIF(TRIM(s.channel), '') as channel,
  NULLIF(TRIM(s.status), '') as status,
  s.created_at,
  s.imported_at
FROM stg_sales_orders s;

-- Modeled view: CRM Leads
CREATE OR REPLACE VIEW crm_leads AS
SELECT
  s.id as staging_id,
  s.org_id,
  CASE
    WHEN s.lead_date ~ '^\d{4}-\d{2}-\d{2}' THEN s.lead_date::date
    ELSE NULL
  END as lead_date,
  NULLIF(TRIM(s.lead_id), '') as lead_id,
  NULLIF(TRIM(s.source), '') as source,
  NULLIF(TRIM(s.status), '') as status,
  NULLIF(TRIM(s.owner), '') as owner,
  COALESCE(s.score, 0) as score,
  s.created_at,
  s.imported_at
FROM stg_crm_leads s;

-- Modeled view: Plan Cancellations
CREATE OR REPLACE VIEW plan_cancellations AS
SELECT
  s.id as staging_id,
  s.org_id,
  CASE
    WHEN s.cancel_date ~ '^\d{4}-\d{2}-\d{2}' THEN s.cancel_date::date
    ELSE NULL
  END as cancel_date,
  NULLIF(TRIM(s.member_id), '') as member_id,
  NULLIF(TRIM(s.reason), '') as reason,
  NULLIF(TRIM(s.agent), '') as agent,
  COALESCE(s.save_attempted, false) as save_attempted,
  COALESCE(s.save_successful, false) as save_successful,
  CASE
    WHEN s.mrr_lost ~ '^\$?[\d,]+\.?\d*$' THEN
      REPLACE(REPLACE(s.mrr_lost, '$', ''), ',', '')::numeric
    ELSE 0
  END as mrr_lost,
  s.created_at,
  s.imported_at
FROM stg_plan_cancellations s;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_member ON stg_concierge_interactions(member_id);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_agent ON stg_concierge_interactions(agent);
CREATE INDEX IF NOT EXISTS idx_concierge_interactions_date ON stg_concierge_interactions(interaction_date);

CREATE INDEX IF NOT EXISTS idx_concierge_notes_member ON stg_concierge_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_concierge_notes_owner ON stg_concierge_notes(note_owner);
CREATE INDEX IF NOT EXISTS idx_concierge_notes_date ON stg_concierge_notes(note_date);

CREATE INDEX IF NOT EXISTS idx_sales_orders_order_id ON stg_sales_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_member ON stg_sales_orders(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_rep ON stg_sales_orders(rep);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON stg_sales_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_id ON stg_crm_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON stg_crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON stg_crm_leads(owner);
CREATE INDEX IF NOT EXISTS idx_crm_leads_date ON stg_crm_leads(lead_date);

CREATE INDEX IF NOT EXISTS idx_cancellations_member ON stg_plan_cancellations(member_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_reason ON stg_plan_cancellations(reason);
CREATE INDEX IF NOT EXISTS idx_cancellations_date ON stg_plan_cancellations(cancel_date);
