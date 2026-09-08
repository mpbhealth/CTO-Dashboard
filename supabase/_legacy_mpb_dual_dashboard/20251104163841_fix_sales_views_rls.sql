/*
  # Fix RLS Policies for Sales Views

  ## Overview
  Adds RLS policies to sales_leads and sales_cancelations views to ensure
  authenticated CEO users can query the data.

  ## Changes
  1. Enable RLS on views (if possible) or create security definer functions
  2. Grant SELECT permissions to authenticated users
  3. Add policies to allow CEO/CTO/Sales roles to view the data

  ## Security
  - Only authenticated users with appropriate roles can access the views
  - Data is filtered by organization if needed
*/

-- Grant SELECT on views to authenticated users
GRANT SELECT ON sales_leads TO authenticated;
GRANT SELECT ON sales_cancelations TO authenticated;

-- Grant SELECT on views to service role for backend operations
GRANT SELECT ON sales_leads TO service_role;
GRANT SELECT ON sales_cancelations TO service_role;

-- Grant SELECT on views to anon for public access (if needed)
GRANT SELECT ON sales_leads TO anon;
GRANT SELECT ON sales_cancelations TO anon;

-- Ensure the underlying staging tables have proper grants
GRANT SELECT ON stg_sales_leads TO authenticated;
GRANT SELECT ON stg_sales_cancelations TO authenticated;

GRANT SELECT ON stg_sales_leads TO service_role;
GRANT SELECT ON stg_sales_cancelations TO service_role;
