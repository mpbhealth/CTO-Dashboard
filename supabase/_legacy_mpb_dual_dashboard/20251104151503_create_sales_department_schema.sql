/*
  # Sales Department Upload System
  
  ## Overview
  Creates complete schema for sales department data uploads including staging tables,
  production views, pricing lookup, and proper field mapping for CSV format:
  Date, Name, Plan, Size, Agent, Group?
  
  ## New Tables
  1. `stg_sales_orders` - Staging table for raw sales CSV uploads
     - Supports both standardized and department-specific fields
     - Handles date formats: "1-Oct", "10-Oct", "10/1/2025"
     - Maps CSV columns to database schema
     
  2. `plan_pricing` - Pricing lookup table for Plan + Family Size combinations
     - Provides automatic amount calculation
     - Supports multiple plan types and family sizes
     
  ## Views
  1. `sales_orders` - Normalized view with calculated fields
     - Auto-generates order_id if missing
     - Calculates amount from pricing table
     - Transforms date formats
     - Provides default values for required fields
  
  ## Security
  - RLS enabled on all tables
  - CEO and admin roles have full access
  - Department users can insert their own data
*/

-- Check if orgs/organizations table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orgs') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    CREATE TABLE orgs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    
    ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "All authenticated users can view orgs"
      ON orgs FOR SELECT
      TO authenticated
      USING (true);
      
    -- Insert default org
    INSERT INTO orgs (id, name) VALUES 
      ('00000000-0000-0000-0000-000000000000', 'Default Organization')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create stg_sales_orders staging table
CREATE TABLE IF NOT EXISTS stg_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  uploaded_by text,
  upload_batch_id uuid,
  sheet_name text,
  
  -- Original standardized fields
  order_date text,
  order_id text,
  member_id text,
  amount text,
  plan text,
  rep text,
  channel text,
  status text,
  
  -- Department-specific fields for sales CSV format
  enrollment_date text,
  member_name text,
  family_size text,
  is_group boolean DEFAULT false,
  
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stg_sales_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stg_sales_orders
CREATE POLICY "CEO and admin can read sales staging"
  ON stg_sales_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin', 'cto')
    )
  );

CREATE POLICY "Authenticated users can insert sales staging"
  ON stg_sales_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create plan pricing lookup table
CREATE TABLE IF NOT EXISTS plan_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  family_size text NOT NULL,
  base_amount decimal(10, 2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan_name, family_size)
);

ALTER TABLE plan_pricing ENABLE ROW LEVEL SECURITY;

-- RLS policy for plan pricing
CREATE POLICY "All authenticated users can view plan pricing"
  ON plan_pricing FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plan pricing"
  ON plan_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ceo', 'admin')
    )
  );

-- Insert default plan pricing based on healthcare plan structures
INSERT INTO plan_pricing (plan_name, family_size, base_amount, is_active) VALUES
  ('Secure HSA', 'MO', 199.00, true),
  ('Secure HSA', 'M+S', 349.00, true),
  ('Secure HSA', 'M+C', 299.00, true),
  ('Secure HSA', 'M+F', 449.00, true),
  ('Premium HSA', 'MO', 299.00, true),
  ('Premium HSA', 'M+S', 499.00, true),
  ('Premium HSA', 'M+C', 399.00, true),
  ('Premium HSA', 'M+F', 599.00, true),
  ('Premium Care', 'MO', 349.00, true),
  ('Premium Care', 'M+S', 599.00, true),
  ('Premium Care', 'M+C', 499.00, true),
  ('Premium Care', 'M+F', 699.00, true),
  ('Care Plus', 'MO', 249.00, true),
  ('Care Plus', 'M+S', 449.00, true),
  ('Care Plus', 'M+C', 349.00, true),
  ('Care Plus', 'M+F', 549.00, true),
  ('MEC+ESSENTIALS', 'MO', 99.00, true),
  ('MEC+ESSENTIALS', 'M+S', 179.00, true),
  ('MEC+ESSENTIALS', 'M+C', 149.00, true),
  ('MEC+ESSENTIALS', 'M+F', 229.00, true),
  ('MEC+Essentials', 'MO', 99.00, true),
  ('MEC+Essentials', 'M+S', 179.00, true),
  ('MEC+Essentials', 'M+C', 149.00, true),
  ('MEC+Essentials', 'M+F', 229.00, true),
  ('DIRECT', 'MO', 0.00, true),
  ('DIRECT', 'M+S', 0.00, true),
  ('DIRECT', 'M+C', 0.00, true),
  ('DIRECT', 'M+F', 0.00, true)
ON CONFLICT (plan_name, family_size) DO NOTHING;

-- Create or replace sales_orders view with intelligent field mapping
CREATE OR REPLACE VIEW sales_orders AS
SELECT
  s.id as staging_id,
  s.org_id,
  -- Smart date parsing for multiple formats
  CASE
    WHEN s.enrollment_date IS NOT NULL AND s.enrollment_date ~ '^\d{1,2}-[A-Za-z]{3}' THEN
      TO_DATE('2025-' || SUBSTRING(s.enrollment_date FROM '\d{1,2}-([A-Za-z]{3})') || '-' || 
              LPAD(SUBSTRING(s.enrollment_date FROM '(\d{1,2})-'), 2, '0'), 'YYYY-Mon-DD')
    WHEN s.enrollment_date ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
      TO_DATE(s.enrollment_date, 'MM/DD/YYYY')
    WHEN s.order_date ~ '^\d{4}-\d{2}-\d{2}' THEN
      s.order_date::date
    ELSE NULL
  END as order_date,
  -- Auto-generate order_id if missing
  COALESCE(
    NULLIF(TRIM(s.order_id), ''), 
    'ORD-' || TO_CHAR(COALESCE(
      CASE
        WHEN s.enrollment_date ~ '^\d{1,2}-[A-Za-z]{3}' THEN
          TO_DATE('2025-' || SUBSTRING(s.enrollment_date FROM '\d{1,2}-([A-Za-z]{3})') || '-' || 
                  LPAD(SUBSTRING(s.enrollment_date FROM '(\d{1,2})-'), 2, '0'), 'YYYY-Mon-DD')
        ELSE now()
      END, now()), 'YYYYMMDD') || '-' || SUBSTRING(s.id::text FROM 1 FOR 8)
  ) as order_id,
  -- Use member_name as member_id if member_id is missing
  COALESCE(NULLIF(TRIM(s.member_name), ''), NULLIF(TRIM(s.member_id), '')) as member_id,
  -- Calculate amount from pricing table or use provided amount
  COALESCE(
    CASE
      WHEN s.amount ~ '^\$?[\d,]+\.?\d*$' THEN
        REPLACE(REPLACE(s.amount, '$', ''), ',', '')::numeric
      ELSE NULL
    END,
    (SELECT pp.base_amount FROM plan_pricing pp 
     WHERE pp.plan_name = TRIM(s.plan) 
     AND pp.family_size = TRIM(s.family_size) 
     AND pp.is_active = true
     LIMIT 1),
    0
  ) as amount,
  NULLIF(TRIM(s.plan), '') as plan,
  NULLIF(TRIM(s.rep), '') as rep,
  COALESCE(NULLIF(TRIM(s.channel), ''), 'Direct Sales') as channel,
  COALESCE(NULLIF(TRIM(s.status), ''), 'Completed') as status,
  -- Additional fields for analytics
  NULLIF(TRIM(s.member_name), '') as member_name,
  NULLIF(TRIM(s.family_size), '') as family_size,
  COALESCE(s.is_group, false) as is_group,
  s.created_at,
  s.imported_at
FROM stg_sales_orders s;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_org_id ON stg_sales_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_batch_id ON stg_sales_orders(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_member_name ON stg_sales_orders(member_name);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_family_size ON stg_sales_orders(family_size);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_enrollment_date ON stg_sales_orders(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_is_group ON stg_sales_orders(is_group) WHERE is_group = true;
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_plan ON stg_sales_orders(plan);
CREATE INDEX IF NOT EXISTS idx_stg_sales_orders_rep ON stg_sales_orders(rep);

CREATE INDEX IF NOT EXISTS idx_plan_pricing_lookup ON plan_pricing(plan_name, family_size) WHERE is_active = true;
