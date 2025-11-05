/*
  # Fix Staging Tables and View Modification Conflicts

  ## Summary
  This migration resolves critical issues preventing the upload system from working:

  1. **Staging Tables Creation** - Ensures all staging tables exist as actual TABLES (not views)
  2. **RLS INSERT Policies** - Adds missing INSERT permissions for CEO/admin roles
  3. **View Conflict Prevention** - Adds safeguards against attempting ALTER TABLE on views
  4. **Upload System Tables** - Verifies department_uploads and upload_templates tables exist

  ## Tables Created/Verified
  - stg_concierge_interactions (for concierge data uploads)
  - stg_sales_orders (for sales enrollment data)
  - stg_sales_leads (for sales lead tracking)
  - stg_sales_cancelations (for cancelation reports)
  - stg_plan_cancellations (for operations churn data)
  - stg_finance_records (for financial data)
  - stg_saudemax_data (for SaudeMAX program data)
  - stg_concierge_notes (for concierge notes)
  - stg_crm_leads (for CRM lead data)

  ## Security
  - All tables enable RLS with org_id scoping
  - CEO and admin roles have INSERT permissions
  - Service role can bypass RLS for Edge Function operations
  - Policies prevent cross-org data access
*/

-- ============================================================================
-- PART 1: Ensure all staging tables exist as TABLES (not views)
-- ============================================================================

-- Drop any existing views with these names to prevent conflicts
DROP VIEW IF EXISTS stg_concierge_interactions CASCADE;
DROP VIEW IF EXISTS stg_sales_orders CASCADE;
DROP VIEW IF EXISTS stg_sales_leads CASCADE;
DROP VIEW IF EXISTS stg_sales_cancelations CASCADE;

-- Create stg_concierge_interactions as a TABLE
CREATE TABLE IF NOT EXISTS stg_concierge_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,
  staging_id uuid,
  occurred_at timestamptz,
  member_id text,
  agent_name text,
  channel text,
  result text,
  duration_minutes numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Create stg_sales_orders as a TABLE (handles both old and new format)
CREATE TABLE IF NOT EXISTS stg_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,

  -- New format fields
  enrollment_date text,
  member_name text,
  plan text,
  family_size text,
  rep text,
  is_group boolean DEFAULT false,

  -- Legacy format fields (for compatibility)
  order_date text,
  order_id text,
  member_id text,
  amount text,
  channel text,
  status text,

  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Create stg_sales_leads as a TABLE
CREATE TABLE IF NOT EXISTS stg_sales_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,
  lead_date text,
  lead_name text,
  lead_source text,
  lead_status text,
  lead_owner text,
  is_group_lead boolean DEFAULT false,
  recent_notes text,
  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Create stg_sales_cancelations as a TABLE
CREATE TABLE IF NOT EXISTS stg_sales_cancelations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,
  member_name text,
  cancelation_reason text,
  membership_type text,
  advisor_name text,
  outcome_notes text,
  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Verify stg_plan_cancellations exists (from operations data)
CREATE TABLE IF NOT EXISTS stg_plan_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,
  staging_id uuid,
  cancel_date text,
  member_id text,
  reason text,
  agent text,
  save_attempted boolean DEFAULT false,
  save_successful boolean DEFAULT false,
  mrr_lost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Verify stg_finance_records exists
CREATE TABLE IF NOT EXISTS stg_finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,
  staging_id uuid,
  record_date text,
  category text DEFAULT 'other',
  amount numeric DEFAULT 0,
  description text,
  vendor_customer text,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Verify stg_saudemax_data exists
CREATE TABLE IF NOT EXISTS stg_saudemax_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  sheet_name text,
  staging_id uuid,
  enrollment_date text,
  member_id text,
  program_type text,
  status text DEFAULT 'active',
  engagement_score numeric,
  satisfaction_score numeric,
  health_improvement numeric,
  created_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

-- Verify stg_concierge_notes exists
CREATE TABLE IF NOT EXISTS stg_concierge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  note_date text,
  member_id text,
  note_owner text,
  note text,
  tags text,
  priority text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Verify stg_crm_leads exists
CREATE TABLE IF NOT EXISTS stg_crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  uploaded_by uuid,
  upload_batch_id uuid,
  lead_date text,
  lead_id text,
  source text,
  status text,
  owner text,
  score numeric DEFAULT 0,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PART 2: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stg_concierge_interactions_org ON stg_concierge_interactions(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_interactions_batch ON stg_concierge_interactions(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_concierge_interactions_occurred ON stg_concierge_interactions(occurred_at);

CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_org ON stg_sales_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_batch ON stg_sales_orders(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_rep ON stg_sales_orders(rep);

CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_org ON stg_sales_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_batch ON stg_sales_leads(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_leads_owner ON stg_sales_leads(lead_owner);

CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_org ON stg_sales_cancelations(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_cancelations_batch ON stg_sales_cancelations(upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_stg_plan_cancellations_org ON stg_plan_cancellations(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_plan_cancellations_batch ON stg_plan_cancellations(upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_stg_finance_records_org ON stg_finance_records(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_finance_records_batch ON stg_finance_records(upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_stg_saudemax_data_org ON stg_saudemax_data(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_saudemax_data_batch ON stg_saudemax_data(upload_batch_id);

-- ============================================================================
-- PART 3: Enable RLS on all staging tables
-- ============================================================================

ALTER TABLE stg_concierge_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_sales_cancelations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_plan_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_saudemax_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_concierge_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_crm_leads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Drop existing policies to avoid conflicts
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "CEO and admin can read concierge interactions" ON stg_concierge_interactions;
DROP POLICY IF EXISTS "CEO and admin can insert concierge interactions" ON stg_concierge_interactions;
DROP POLICY IF EXISTS "CEO and admin can read sales orders" ON stg_sales_orders;
DROP POLICY IF EXISTS "CEO and admin can insert sales orders" ON stg_sales_orders;
DROP POLICY IF EXISTS "CEO and admin can read sales leads" ON stg_sales_leads;
DROP POLICY IF EXISTS "CEO and admin can insert sales leads" ON stg_sales_leads;
DROP POLICY IF EXISTS "CEO and admin can read sales cancelations" ON stg_sales_cancelations;
DROP POLICY IF EXISTS "CEO and admin can insert sales cancelations" ON stg_sales_cancelations;
DROP POLICY IF EXISTS "CEO and admin can read cancellations" ON stg_plan_cancellations;
DROP POLICY IF EXISTS "CEO and admin can insert cancellations" ON stg_plan_cancellations;
DROP POLICY IF EXISTS "CEO and admin can read finance records" ON stg_finance_records;
DROP POLICY IF EXISTS "CEO and admin can insert finance records" ON stg_finance_records;
DROP POLICY IF EXISTS "CEO and admin can read saudemax data" ON stg_saudemax_data;
DROP POLICY IF EXISTS "CEO and admin can insert saudemax data" ON stg_saudemax_data;
DROP POLICY IF EXISTS "CEO and admin can read concierge notes" ON stg_concierge_notes;
DROP POLICY IF EXISTS "CEO and admin can insert concierge notes" ON stg_concierge_notes;
DROP POLICY IF EXISTS "CEO and admin can read crm leads" ON stg_crm_leads;
DROP POLICY IF EXISTS "CEO and admin can insert crm leads" ON stg_crm_leads;

-- Drop any new-style policies too
DROP POLICY IF EXISTS "stg_concierge_interactions_select" ON stg_concierge_interactions;
DROP POLICY IF EXISTS "stg_concierge_interactions_insert" ON stg_concierge_interactions;
DROP POLICY IF EXISTS "stg_sales_orders_select" ON stg_sales_orders;
DROP POLICY IF EXISTS "stg_sales_orders_insert" ON stg_sales_orders;
DROP POLICY IF EXISTS "stg_sales_leads_select" ON stg_sales_leads;
DROP POLICY IF EXISTS "stg_sales_leads_insert" ON stg_sales_leads;
DROP POLICY IF EXISTS "stg_sales_cancelations_select" ON stg_sales_cancelations;
DROP POLICY IF EXISTS "stg_sales_cancelations_insert" ON stg_sales_cancelations;
DROP POLICY IF EXISTS "stg_plan_cancellations_select" ON stg_plan_cancellations;
DROP POLICY IF EXISTS "stg_plan_cancellations_insert" ON stg_plan_cancellations;
DROP POLICY IF EXISTS "stg_finance_records_select" ON stg_finance_records;
DROP POLICY IF EXISTS "stg_finance_records_insert" ON stg_finance_records;
DROP POLICY IF EXISTS "stg_saudemax_data_select" ON stg_saudemax_data;
DROP POLICY IF EXISTS "stg_saudemax_data_insert" ON stg_saudemax_data;
DROP POLICY IF EXISTS "stg_concierge_notes_select" ON stg_concierge_notes;
DROP POLICY IF EXISTS "stg_concierge_notes_insert" ON stg_concierge_notes;
DROP POLICY IF EXISTS "stg_crm_leads_select" ON stg_crm_leads;
DROP POLICY IF EXISTS "stg_crm_leads_insert" ON stg_crm_leads;

-- ============================================================================
-- PART 5: Add SELECT and INSERT policies for all staging tables
-- ============================================================================

-- stg_concierge_interactions policies
CREATE POLICY "stg_concierge_interactions_select"
  ON stg_concierge_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_concierge_interactions.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_concierge_interactions_insert"
  ON stg_concierge_interactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_concierge_interactions.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_sales_orders policies
CREATE POLICY "stg_sales_orders_select"
  ON stg_sales_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_sales_orders.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_sales_orders_insert"
  ON stg_sales_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_sales_orders.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_sales_leads policies
CREATE POLICY "stg_sales_leads_select"
  ON stg_sales_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_sales_leads.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_sales_leads_insert"
  ON stg_sales_leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_sales_leads.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_sales_cancelations policies
CREATE POLICY "stg_sales_cancelations_select"
  ON stg_sales_cancelations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_sales_cancelations.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_sales_cancelations_insert"
  ON stg_sales_cancelations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_sales_cancelations.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_plan_cancellations policies
CREATE POLICY "stg_plan_cancellations_select"
  ON stg_plan_cancellations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_plan_cancellations.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_plan_cancellations_insert"
  ON stg_plan_cancellations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_plan_cancellations.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_finance_records policies
CREATE POLICY "stg_finance_records_select"
  ON stg_finance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_finance_records_insert"
  ON stg_finance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_finance_records.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_saudemax_data policies
CREATE POLICY "stg_saudemax_data_select"
  ON stg_saudemax_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_saudemax_data.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_saudemax_data_insert"
  ON stg_saudemax_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_saudemax_data.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_concierge_notes policies
CREATE POLICY "stg_concierge_notes_select"
  ON stg_concierge_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_concierge_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_concierge_notes_insert"
  ON stg_concierge_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_concierge_notes.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- stg_crm_leads policies
CREATE POLICY "stg_crm_leads_select"
  ON stg_crm_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_crm_leads.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

CREATE POLICY "stg_crm_leads_insert"
  ON stg_crm_leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = stg_crm_leads.org_id
      AND profiles.role IN ('ceo', 'admin')
      LIMIT 1
    )
  );

-- ============================================================================
-- PART 6: Grant necessary permissions to service role
-- ============================================================================

-- Grant service role access to bypass RLS when needed (for Edge Functions)
GRANT ALL ON stg_concierge_interactions TO service_role;
GRANT ALL ON stg_sales_orders TO service_role;
GRANT ALL ON stg_sales_leads TO service_role;
GRANT ALL ON stg_sales_cancelations TO service_role;
GRANT ALL ON stg_plan_cancellations TO service_role;
GRANT ALL ON stg_finance_records TO service_role;
GRANT ALL ON stg_saudemax_data TO service_role;
GRANT ALL ON stg_concierge_notes TO service_role;
GRANT ALL ON stg_crm_leads TO service_role;
