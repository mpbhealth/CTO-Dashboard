/*
  # Fix Policy Documents RLS to Allow CEO/CTO/Admin Inserts

  The existing RLS policy for INSERT on policy_documents is too restrictive.
  It only allows users with role_id=1 in user_roles table.
  
  This migration:
  1. Drops the existing restrictive INSERT policy
  2. Creates a new INSERT policy that allows:
     - Users with admin role_id in user_roles table
     - Users with ceo/cto/admin role in profiles table
  3. Also makes UPDATE policy more permissive
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert policies" ON policy_documents;
DROP POLICY IF EXISTS "Admins can update any policy" ON policy_documents;
DROP POLICY IF EXISTS "Policy creators can update their own policies" ON policy_documents;
DROP POLICY IF EXISTS "Only admins can delete policies" ON policy_documents;

-- Create new permissive INSERT policy
-- Allows: admins via user_roles OR ceo/cto/admin via profiles table
CREATE POLICY "Authorized users can insert policies"
  ON policy_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check user_roles table for admin role
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
    OR
    -- Check profiles table for ceo/cto/admin role
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ceo', 'cto', 'admin')
    )
  );

-- Create UPDATE policy
CREATE POLICY "Authorized users can update policies"
  ON policy_documents FOR UPDATE
  TO authenticated
  USING (
    -- Admins via user_roles
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
    OR
    -- CEO/CTO/Admin via profiles
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ceo', 'cto', 'admin')
    )
    OR
    -- Creators can update their own
    created_by = auth.uid()
  );

-- Create DELETE policy
CREATE POLICY "Authorized users can delete policies"
  ON policy_documents FOR DELETE
  TO authenticated
  USING (
    -- Admins via user_roles
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = 1
    )
    OR
    -- CEO/CTO/Admin via profiles
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ceo', 'cto', 'admin')
    )
  );
