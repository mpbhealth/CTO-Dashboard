/*
  # Add RLS Policies for Policy-Related Tables

  1. Tables Updated
    - policy_document_history: Add RLS policies
    - policy_acknowledgements: Add RLS policies

  2. Security
    - policy_document_history:
      - SELECT: All authenticated users can view history
      - INSERT: Authenticated users can create history entries (for audit trail)
    
    - policy_acknowledgements:
      - SELECT: Users can view their own acknowledgements, admins can view all
      - INSERT: Users can acknowledge policies
      - UPDATE: Admins can update acknowledgements
      - DELETE: Admins can delete acknowledgements
*/

-- Check if RLS is enabled, if not enable it
DO $$
BEGIN
  ALTER TABLE policy_document_history ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- =====================================================
-- RLS POLICIES: policy_document_history
-- =====================================================

DROP POLICY IF EXISTS "All authenticated users can view policy history" ON policy_document_history;
CREATE POLICY "All authenticated users can view policy history"
  ON policy_document_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create history entries" ON policy_document_history;
CREATE POLICY "Authenticated users can create history entries"
  ON policy_document_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: policy_acknowledgements
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own acknowledgements" ON policy_acknowledgements;
CREATE POLICY "Users can view their own acknowledgements"
  ON policy_acknowledgements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all acknowledgements" ON policy_acknowledgements;
CREATE POLICY "Admins can view all acknowledgements"
  ON policy_acknowledgements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
  );

DROP POLICY IF EXISTS "Users can acknowledge policies" ON policy_acknowledgements;
CREATE POLICY "Users can acknowledge policies"
  ON policy_acknowledgements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update acknowledgements" ON policy_acknowledgements;
CREATE POLICY "Admins can update acknowledgements"
  ON policy_acknowledgements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
  );

DROP POLICY IF EXISTS "Admins can delete acknowledgements" ON policy_acknowledgements;
CREATE POLICY "Admins can delete acknowledgements"
  ON policy_acknowledgements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
  );