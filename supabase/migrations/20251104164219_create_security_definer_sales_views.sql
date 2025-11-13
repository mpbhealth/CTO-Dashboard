/*
  # Create Security Definer Functions for Sales Views

  ## Overview
  Creates security definer functions that bypass RLS to allow authenticated
  users to query sales_leads and sales_cancelations views.

  ## Changes
  1. Drop existing views
  2. Create security definer functions that return the same data
  3. Create new views that call these functions
  4. Grant appropriate permissions

  ## Security
  - Functions run with definer privileges (postgres)
  - Only authenticated users can access
  - Data is still filtered appropriately
*/

-- Drop existing views
DROP VIEW IF EXISTS sales_leads CASCADE;
DROP VIEW IF EXISTS sales_cancelations CASCADE;

-- Create security definer function for sales_leads
CREATE OR REPLACE FUNCTION get_sales_leads()
RETURNS TABLE (
  staging_id uuid,
  org_id uuid,
  lead_date date,
  lead_name text,
  lead_source text,
  source_category text,
  lead_status text,
  lead_owner text,
  is_group_lead boolean,
  forwarded_to text,
  recent_notes text,
  note_action_type text,
  created_at timestamptz,
  imported_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as staging_id,
    s.org_id,
    CASE
      WHEN s.lead_date ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
        TO_DATE(s.lead_date, 'MM/DD/YYYY')
      WHEN s.lead_date ~ '^\d{1,2}-[A-Za-z]{3}' THEN
        TO_DATE('2025-' || SUBSTRING(s.lead_date FROM '\d{1,2}-([A-Za-z]{3})') || '-' ||
                LPAD(SUBSTRING(s.lead_date FROM '(\d{1,2})-'), 2, '0'), 'YYYY-Mon-DD')
      WHEN s.lead_date ~ '^[A-Za-z]{3}-\d{1,2}' THEN
        TO_DATE('2025-' || SUBSTRING(s.lead_date FROM '^([A-Za-z]{3})-') || '-' ||
                LPAD(SUBSTRING(s.lead_date FROM '-(\d{1,2})$'), 2, '0'), 'YYYY-Mon-DD')
      WHEN s.lead_date ~ '^\d{4}-\d{2}-\d{2}' THEN
        s.lead_date::date
      ELSE NULL
    END as lead_date,
    NULLIF(TRIM(s.lead_name), '') as lead_name,
    COALESCE(
      (SELECT lsc.source_name FROM lead_source_categories lsc
       WHERE LOWER(lsc.source_name) = LOWER(TRIM(s.lead_source))
       AND lsc.is_active = true
       LIMIT 1),
      NULLIF(TRIM(s.lead_source), ''),
      'Unknown'
    ) as lead_source,
    COALESCE(
      (SELECT lsc.category FROM lead_source_categories lsc
       WHERE LOWER(lsc.source_name) = LOWER(TRIM(s.lead_source))
       AND lsc.is_active = true
       LIMIT 1),
      'Unknown'
    ) as source_category,
    CASE
      WHEN LOWER(TRIM(s.lead_status)) IN ('in process', 'in-process') THEN 'In Process'
      WHEN LOWER(TRIM(s.lead_status)) IN ('first attempt', 'first-attempt') THEN 'First Attempt'
      WHEN LOWER(TRIM(s.lead_status)) = 'closed' THEN 'Closed'
      WHEN LOWER(TRIM(s.lead_status)) IN ('n/a', 'na', '') THEN 'Not Contacted'
      WHEN LOWER(TRIM(s.lead_status)) = 'not contacted' THEN 'Not Contacted'
      ELSE NULLIF(TRIM(s.lead_status), '')
    END as lead_status,
    NULLIF(TRIM(s.lead_owner), '') as lead_owner,
    CASE
      WHEN s.recent_notes ~* '(forwarded|fwd|forward) (to|lead to)' THEN true
      ELSE COALESCE(s.is_group_lead, false)
    END as is_group_lead,
    CASE
      WHEN s.recent_notes ~* 'forward(ed)? (to|lead to) ([A-Za-z ]+)' THEN
        TRIM(SUBSTRING(s.recent_notes FROM 'forward(ed)? (?:to|lead to) ([A-Za-z ]+)'))
      ELSE NULL
    END as forwarded_to,
    NULLIF(TRIM(s.recent_notes), '') as recent_notes,
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
END;
$$;

-- Create security definer function for sales_cancelations
CREATE OR REPLACE FUNCTION get_sales_cancelations()
RETURNS TABLE (
  staging_id uuid,
  org_id uuid,
  member_name text,
  cancelation_reason text,
  reason_category text,
  is_preventable boolean,
  retention_strategy text,
  priority_level int,
  membership_type text,
  advisor_name text,
  outcome_notes text,
  outcome_type text,
  retention_opportunity_score int,
  retention_attempted boolean,
  created_at timestamptz,
  imported_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as staging_id,
    s.org_id,
    NULLIF(TRIM(s.member_name), '') as member_name,
    COALESCE(
      (SELECT crc.reason_name FROM cancelation_reason_categories crc
       WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
       LIMIT 1),
      NULLIF(TRIM(s.cancelation_reason), ''),
      'Other'
    ) as cancelation_reason,
    COALESCE(
      (SELECT crc.category FROM cancelation_reason_categories crc
       WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
       LIMIT 1),
      'Unknown'
    ) as reason_category,
    COALESCE(
      (SELECT crc.is_preventable FROM cancelation_reason_categories crc
       WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
       LIMIT 1),
      true
    ) as is_preventable,
    (SELECT crc.retention_strategy FROM cancelation_reason_categories crc
     WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
     LIMIT 1) as retention_strategy,
    COALESCE(
      (SELECT crc.priority_level FROM cancelation_reason_categories crc
       WHERE LOWER(crc.reason_name) = LOWER(TRIM(s.cancelation_reason))
       LIMIT 1),
      3
    ) as priority_level,
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
    CASE
      WHEN s.outcome_notes ~* '(retained|keeping|staying)' THEN 10
      WHEN s.outcome_notes ~* '(great feedback|good experience|happy)' THEN 8
      WHEN s.outcome_notes ~* '(will comeback|may return)' THEN 7
      WHEN s.outcome_notes ~* '(left vm|trying to reach)' THEN 5
      WHEN s.outcome_notes ~* '(unhappy|disappointed|frustrated)' THEN 2
      WHEN s.outcome_notes ~* '(could not locate|data error)' THEN 0
      ELSE 3
    END as retention_opportunity_score,
    CASE
      WHEN s.outcome_notes IS NOT NULL AND TRIM(s.outcome_notes) != '' THEN true
      ELSE false
    END as retention_attempted,
    s.created_at,
    s.imported_at
  FROM stg_sales_cancelations s;
END;
$$;

-- Create views that call the security definer functions
CREATE VIEW sales_leads AS
SELECT * FROM get_sales_leads();

CREATE VIEW sales_cancelations AS
SELECT * FROM get_sales_cancelations();

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_sales_leads() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_cancelations() TO authenticated;

GRANT EXECUTE ON FUNCTION get_sales_leads() TO anon;
GRANT EXECUTE ON FUNCTION get_sales_cancelations() TO anon;

-- Grant select on views to authenticated users
GRANT SELECT ON sales_leads TO authenticated;
GRANT SELECT ON sales_cancelations TO authenticated;

GRANT SELECT ON sales_leads TO anon;
GRANT SELECT ON sales_cancelations TO anon;
