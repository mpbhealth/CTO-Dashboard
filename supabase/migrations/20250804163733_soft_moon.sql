/*
  # Fix RLS Policy Conflicts

  1. Safely drop and recreate conflicting policies
  2. Ensure proper RLS setup for all tables
  3. Use safe DROP IF EXISTS patterns
*/

-- =============================================
-- SAFE POLICY RECREATION PATTERNS
-- =============================================

-- Fix Notes Table Policies
DROP POLICY IF EXISTS "Users can select their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Recreate Notes Policies
CREATE POLICY "Users can select their own notes"
  ON notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- ASSIGNMENTS TABLE POLICIES (SAFE RECREATION)
-- =============================================

-- Drop existing assignment policies if they exist
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

-- Recreate Assignments Policies with proper user relationship
CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can update their assignments"
  ON assignments
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  USING (assigned_to = auth.uid());

-- =============================================
-- SAAS EXPENSES POLICIES (IF TABLE EXISTS)
-- =============================================

-- Only create policies if saas_expenses table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saas_expenses') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can manage saas expenses" ON saas_expenses;
    DROP POLICY IF EXISTS "Users can read saas expenses" ON saas_expenses;
    
    -- Create new policies
    CREATE POLICY "Users can manage saas expenses"
      ON saas_expenses
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
      
    CREATE POLICY "Users can read saas expenses"
      ON saas_expenses
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- MARKETING PROPERTIES POLICIES (IF TABLE EXISTS)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_properties') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their marketing properties" ON marketing_properties;
    DROP POLICY IF EXISTS "Users can insert their marketing properties" ON marketing_properties;
    DROP POLICY IF EXISTS "Users can update their marketing properties" ON marketing_properties;
    DROP POLICY IF EXISTS "Users can delete their marketing properties" ON marketing_properties;
    
    -- Create new policies
    CREATE POLICY "Users can view their marketing properties"
      ON marketing_properties
      FOR SELECT
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert their marketing properties"
      ON marketing_properties
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their marketing properties"
      ON marketing_properties
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their marketing properties"
      ON marketing_properties
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- MARKETING METRICS POLICIES (IF TABLE EXISTS)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_metrics') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their marketing metrics" ON marketing_metrics;
    DROP POLICY IF EXISTS "Users can insert marketing metrics" ON marketing_metrics;
    
    -- Create new policies
    CREATE POLICY "Users can view their marketing metrics"
      ON marketing_metrics
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM marketing_properties 
          WHERE id = marketing_metrics.property_id
        )
      );
      
    CREATE POLICY "Users can insert marketing metrics"
      ON marketing_metrics
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM marketing_properties 
          WHERE id = marketing_metrics.property_id
        )
      );
  END IF;
END $$;