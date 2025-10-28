/*
  # Enable CTO Access to Operations Data

  ## Overview
  Extends RLS policies on CEO reporting tables to include CTO role for shared operations visibility.
  Both CEO and CTO need access to operational metrics like cancellations, sales, and performance data.

  ## Changes

  ### Updated Policies
  - stg_concierge_interactions: Allow CEO, CTO, and admin to read
  - stg_concierge_notes: Allow CEO, CTO, and admin to read
  - stg_sales_orders: Allow CEO, CTO, and admin to read
  - stg_crm_leads: Allow CEO, CTO, and admin to read
  - stg_plan_cancellations: Allow CEO, CTO, and admin to read

  ## Security
  - Maintains RLS enforcement
  - Both executive roles can view operations data
  - No write access - data remains read-only for reporting
  - Admin retains full access
*/

-- Update policy for concierge interactions to include CTO
DROP POLICY IF EXISTS "CEO and admin can read concierge interactions" ON stg_concierge_interactions;
CREATE POLICY "CEO, CTO, and admin can read concierge interactions"
  ON stg_concierge_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Update policy for concierge notes to include CTO
DROP POLICY IF EXISTS "CEO and admin can read concierge notes" ON stg_concierge_notes;
CREATE POLICY "CEO, CTO, and admin can read concierge notes"
  ON stg_concierge_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Update policy for sales orders to include CTO
DROP POLICY IF EXISTS "CEO and admin can read sales orders" ON stg_sales_orders;
CREATE POLICY "CEO, CTO, and admin can read sales orders"
  ON stg_sales_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Update policy for CRM leads to include CTO
DROP POLICY IF EXISTS "CEO and admin can read CRM leads" ON stg_crm_leads;
CREATE POLICY "CEO, CTO, and admin can read CRM leads"
  ON stg_crm_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Update policy for plan cancellations to include CTO
DROP POLICY IF EXISTS "CEO and admin can read cancellations" ON stg_plan_cancellations;
CREATE POLICY "CEO, CTO, and admin can read cancellations"
  ON stg_plan_cancellations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Grant usage on views to authenticated users (views inherit base table permissions)
GRANT SELECT ON concierge_interactions TO authenticated;
GRANT SELECT ON concierge_notes TO authenticated;
GRANT SELECT ON sales_orders TO authenticated;
GRANT SELECT ON crm_leads TO authenticated;
GRANT SELECT ON plan_cancellations TO authenticated;
