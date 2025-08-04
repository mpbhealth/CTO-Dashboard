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
-- SKIPPED: DROP POLICY IF EXISTS "Users can select their own notes" ON notes;
-- SKIPPED: DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
-- SKIPPED: DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
-- SKIPPED: DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Recreate Notes Policies
-- SKIPPED: CREATE POLICY "Users can select their own notes"
  ON notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- SKIPPED: CREATE POLICY "Users can insert their own notes"
  ON notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SKIPPED: CREATE POLICY "Users can update their own notes"
  ON notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SKIPPED: CREATE POLICY "Users can delete their own notes"
  ON notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- ASSIGNMENTS TABLE POLICIES (SAFE RECREATION)
-- =============================================

-- Drop existing assignment policies if they exist
-- SKIPPED: DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
-- SKIPPED: DROP POLICY IF EXISTS "Users can create assignments" ON assignments;
-- SKIPPED: DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
-- SKIPPED: DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

-- Recreate Assignments Policies with proper user relationship
-- SKIPPED: CREATE POLICY "Users can view their assignments"
  ON assignments
  FOR SELECT
  USING (assigned_to = auth.uid());

-- SKIPPED: CREATE POLICY "Users can create assignments"
  ON assignments
  FOR INSERT
  WITH CHECK (assigned_to = auth.uid());

-- SKIPPED: CREATE POLICY "Users can update their assignments"
  ON assignments
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- SKIPPED: CREATE POLICY "Users can delete their assignments"
  ON assignments
  FOR DELETE
  USING (assigned_to = auth.uid());

-- =============================================
-- SAAS EXPENSES POLICIES (IF TABLE EXISTS)
-- =============================================

-- Only create policies if saas_expenses table exists
-- SKIPPED BLOCK: DO $$
-- SKIPPED BLOCK: BEGIN
-- SKIPPED BLOCK:   IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saas_expenses') THEN
-- SKIPPED BLOCK:     -- Drop existing policies
-- SKIPPED:     DROP POLICY IF EXISTS "Users can manage saas expenses" ON saas_expenses;
-- SKIPPED:     DROP POLICY IF EXISTS "Users can read saas expenses" ON saas_expenses;
-- SKIPPED BLOCK:     
-- SKIPPED BLOCK:     -- Create new policies
-- SKIPPED:     CREATE POLICY "Users can manage saas expenses"
-- SKIPPED BLOCK:       ON saas_expenses
-- SKIPPED BLOCK:       FOR ALL
-- SKIPPED BLOCK:       TO authenticated
-- SKIPPED BLOCK:       USING (true)
-- SKIPPED BLOCK:       WITH CHECK (true);
-- SKIPPED BLOCK:       
-- SKIPPED:     CREATE POLICY "Users can read saas expenses"
-- SKIPPED BLOCK:       ON saas_expenses
-- SKIPPED BLOCK:       FOR SELECT
-- SKIPPED BLOCK:       TO authenticated
-- SKIPPED BLOCK:       USING (true);
-- SKIPPED BLOCK:   END IF;
-- SKIPPED BLOCK: END $$;

-- =============================================
-- MARKETING PROPERTIES POLICIES (IF TABLE EXISTS)
-- =============================================

-- SKIPPED BLOCK: DO $$
-- SKIPPED BLOCK: BEGIN
-- SKIPPED BLOCK:   IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_properties') THEN
-- SKIPPED BLOCK:     -- Drop existing policies
-- SKIPPED:     DROP POLICY IF EXISTS "Users can view their marketing properties" ON marketing_properties;
-- SKIPPED:     DROP POLICY IF EXISTS "Users can insert their marketing properties" ON marketing_properties;
-- SKIPPED:     DROP POLICY IF EXISTS "Users can update their marketing properties" ON marketing_properties;
-- SKIPPED:     DROP POLICY IF EXISTS "Users can delete their marketing properties" ON marketing_properties;
-- SKIPPED BLOCK:     
-- SKIPPED BLOCK:     -- Create new policies
-- SKIPPED:     CREATE POLICY "Users can view their marketing properties"
-- SKIPPED BLOCK:       ON marketing_properties
-- SKIPPED BLOCK:       FOR SELECT
-- SKIPPED BLOCK:       USING (auth.uid() = user_id);
-- SKIPPED BLOCK:       
-- SKIPPED:     CREATE POLICY "Users can insert their marketing properties"
-- SKIPPED BLOCK:       ON marketing_properties
-- SKIPPED BLOCK:       FOR INSERT
-- SKIPPED BLOCK:       WITH CHECK (auth.uid() = user_id);
-- SKIPPED BLOCK:       
-- SKIPPED:     CREATE POLICY "Users can update their marketing properties"
-- SKIPPED BLOCK:       ON marketing_properties
-- SKIPPED BLOCK:       FOR UPDATE
-- SKIPPED BLOCK:       USING (auth.uid() = user_id)
-- SKIPPED BLOCK:       WITH CHECK (auth.uid() = user_id);
-- SKIPPED BLOCK:       
-- SKIPPED:     CREATE POLICY "Users can delete their marketing properties"
-- SKIPPED BLOCK:       ON marketing_properties
-- SKIPPED BLOCK:       FOR DELETE
-- SKIPPED BLOCK:       USING (auth.uid() = user_id);
-- SKIPPED BLOCK:   END IF;
-- SKIPPED BLOCK: END $$;

-- =============================================
-- MARKETING METRICS POLICIES (IF TABLE EXISTS)
-- =============================================

-- SKIPPED BLOCK: DO $$
-- SKIPPED BLOCK: BEGIN
-- SKIPPED BLOCK:   IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketing_metrics') THEN
-- SKIPPED BLOCK:     -- Drop existing policies
-- SKIPPED:     DROP POLICY IF EXISTS "Users can view their marketing metrics" ON marketing_metrics;
-- SKIPPED:     DROP POLICY IF EXISTS "Users can insert marketing metrics" ON marketing_metrics;
-- SKIPPED BLOCK:     
-- SKIPPED BLOCK:     -- Create new policies
-- SKIPPED:     CREATE POLICY "Users can view their marketing metrics"
-- SKIPPED BLOCK:       ON marketing_metrics
-- SKIPPED BLOCK:       FOR SELECT
-- SKIPPED BLOCK:       USING (
-- SKIPPED BLOCK:         auth.uid() IN (
-- SKIPPED BLOCK:           SELECT user_id FROM marketing_properties 
-- SKIPPED BLOCK:           WHERE id = marketing_metrics.property_id
-- SKIPPED BLOCK:         )
-- SKIPPED BLOCK:       );
-- SKIPPED BLOCK:       
-- SKIPPED:     CREATE POLICY "Users can insert marketing metrics"
-- SKIPPED BLOCK:       ON marketing_metrics
-- SKIPPED BLOCK:       FOR INSERT
-- SKIPPED BLOCK:       WITH CHECK (
-- SKIPPED BLOCK:         auth.uid() IN (
-- SKIPPED BLOCK:           SELECT user_id FROM marketing_properties 
-- SKIPPED BLOCK:           WHERE id = marketing_metrics.property_id
-- SKIPPED BLOCK:         )
-- SKIPPED BLOCK:       );
-- SKIPPED BLOCK:   END IF;
-- SKIPPED BLOCK: END $$;