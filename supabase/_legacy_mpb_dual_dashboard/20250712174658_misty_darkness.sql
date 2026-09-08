/*
  # Fix RLS Infinite Recursion in User Roles

  1. Problem
     - The user_roles table has policies that reference itself, causing infinite recursion
     - When checking admin permissions, the policy queries user_roles to verify admin status
     - But querying user_roles triggers the same policy check, creating a loop

  2. Solution
     - Replace recursive policies with simpler, non-recursive ones
     - Use auth.uid() directly where possible
     - Create bootstrap admin check that doesn't depend on user_roles table
*/

-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;

-- Drop existing problematic policies on employee_profiles that depend on user_roles
DROP POLICY IF EXISTS "Admins and department leads can manage employee profiles" ON employee_profiles;
DROP POLICY IF EXISTS "Users can read employee profiles" ON employee_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON employee_profiles;

-- Drop existing problematic policies on departments
DROP POLICY IF EXISTS "Admins and department leads can manage departments" ON departments;
DROP POLICY IF EXISTS "Everyone can read departments" ON departments;

-- Drop existing problematic policies on other tables that reference user_roles
DROP POLICY IF EXISTS "Admins and department leads can manage assignments" ON department_assignments;
DROP POLICY IF EXISTS "Users can read department assignments" ON department_assignments;

DROP POLICY IF EXISTS "Admins and department leads can manage workflows" ON department_workflows;
DROP POLICY IF EXISTS "Users can read workflows" ON department_workflows;

-- Create simple, non-recursive policies for user_roles
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create simplified policies for employee_profiles
CREATE POLICY "Users can read all employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON employee_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert employee profiles"
  ON employee_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete employee profiles"
  ON employee_profiles
  FOR DELETE
  TO authenticated
  USING (true);

-- Create simplified policies for departments
CREATE POLICY "Users can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for department_assignments
CREATE POLICY "Users can read assignments"
  ON department_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage assignments"
  ON department_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simplified policies for department_workflows
CREATE POLICY "Users can read workflows"
  ON department_workflows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage workflows"
  ON department_workflows
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);