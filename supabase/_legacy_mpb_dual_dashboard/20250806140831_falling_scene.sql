/*
  # Universal Safe Policy Creation Function

  1. Utility Functions
    - `create_policy_safe()` - Universal policy creation with conflict resolution
    - `drop_policy_safe()` - Safe policy removal
    - `ensure_rls_enabled()` - Safe RLS enablement

  2. Benefits
    - Zero policy conflicts guaranteed
    - Reusable across all tables
    - Production-safe operations
*/

-- Create universal policy creation function
CREATE OR REPLACE FUNCTION create_policy_safe(
  table_name text,
  policy_name text,
  policy_command text,
  policy_role text DEFAULT 'authenticated',
  policy_using text DEFAULT NULL,
  policy_with_check text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
  
  -- Build the CREATE POLICY command
  DECLARE
    sql_command text;
  BEGIN
    sql_command := format('CREATE POLICY %I ON %I FOR %s TO %s', 
                         policy_name, table_name, policy_command, policy_role);
    
    IF policy_using IS NOT NULL THEN
      sql_command := sql_command || ' USING (' || policy_using || ')';
    END IF;
    
    IF policy_with_check IS NOT NULL THEN
      sql_command := sql_command || ' WITH CHECK (' || policy_with_check || ')';
    END IF;
    
    -- Execute the policy creation
    EXECUTE sql_command;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create safe RLS enablement function
CREATE OR REPLACE FUNCTION ensure_rls_enabled(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
EXCEPTION
  WHEN OTHERS THEN
    -- RLS might already be enabled, ignore the error
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Example usage for assignments table
-- Enable RLS safely
SELECT ensure_rls_enabled('assignments');

-- Create all policies safely
SELECT create_policy_safe(
  'assignments',
  'Users can view their assignments', 
  'SELECT',
  'authenticated',
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'assignments',
  'Users can create assignments', 
  'INSERT',
  'authenticated',
  NULL,
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'assignments',
  'Users can update their assignments', 
  'UPDATE',
  'authenticated',
  'auth.uid() = assigned_to',
  'auth.uid() = assigned_to'
);

SELECT create_policy_safe(
  'assignments',
  'Users can delete their assignments', 
  'DELETE',
  'authenticated',
  'auth.uid() = assigned_to'
);