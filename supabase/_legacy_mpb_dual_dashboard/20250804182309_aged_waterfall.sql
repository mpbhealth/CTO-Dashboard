/*
  # Manual RLS Policy Setup - Post-Bolt Migration
  
  Run this file AFTER Bolt builds complete to safely set all RLS policies.
  This avoids Bolt's automatic policy recreation conflicts.
  
  Usage:
  1. Let Bolt create the tables without policies
  2. Run this file manually in Supabase SQL Editor
  3. All policies will be created safely with proper error handling
*/

-- =============================================
-- SAFE POLICY RECREATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION create_policy_safe(
    policy_name text,
    table_name text,
    policy_command text,
    policy_using text DEFAULT NULL,
    policy_check text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    -- Drop existing policy if it exists
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    
    -- Create the new policy
    IF policy_check IS NOT NULL THEN
        EXECUTE format('CREATE POLICY %I ON %I %s USING (%s) WITH CHECK (%s)', 
                      policy_name, table_name, policy_command, policy_using, policy_check);
    ELSE
        EXECUTE format('CREATE POLICY %I ON %I %s USING (%s)', 
                      policy_name, table_name, policy_command, policy_using);
    END IF;
    
    RAISE NOTICE 'Policy % created successfully on table %', policy_name, table_name;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create policy % on table %: %', policy_name, table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

DO $$
DECLARE
    table_name text;
    tables_to_enable text[] := ARRAY[
        'assignments', 'users', 'notes', 'saas_expenses', 
        'marketing_properties', 'marketing_metrics',
        'kpi_data', 'tech_stack', 'roadmap_items', 'projects',
        'vendors', 'ai_agents', 'api_statuses', 'deployment_logs',
        'team_members', 'quick_links'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_enable
    LOOP
        -- Check if table exists before enabling RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS enabled on table: %', table_name;
        ELSE
            RAISE NOTICE 'Table % does not exist - skipping RLS', table_name;
        END IF;
    END LOOP;
END $$;

-- =============================================
-- ASSIGNMENTS TABLE POLICIES
-- =============================================

SELECT create_policy_safe(
    'Users can view their own assignments',
    'assignments',
    'FOR SELECT TO authenticated',
    'assigned_to = auth.uid()'
);

SELECT create_policy_safe(
    'Users can create assignments',
    'assignments', 
    'FOR INSERT TO authenticated',
    NULL,
    'assigned_to = auth.uid()'
);

SELECT create_policy_safe(
    'Users can update their own assignments',
    'assignments',
    'FOR UPDATE TO authenticated',
    'assigned_to = auth.uid()',
    'assigned_to = auth.uid()'
);

SELECT create_policy_safe(
    'Users can delete their own assignments',
    'assignments',
    'FOR DELETE TO authenticated',
    'assigned_to = auth.uid()'
);

-- =============================================
-- USERS TABLE POLICIES  
-- =============================================

SELECT create_policy_safe(
    'Users can read own profile',
    'users',
    'FOR SELECT TO authenticated',
    'auth_user_id = auth.uid()'
);

SELECT create_policy_safe(
    'Users can insert own profile',
    'users',
    'FOR INSERT TO authenticated',
    NULL,
    'auth_user_id = auth.uid()'
);

SELECT create_policy_safe(
    'Users can update own profile',
    'users',
    'FOR UPDATE TO authenticated', 
    'auth_user_id = auth.uid()',
    'auth_user_id = auth.uid()'
);

-- =============================================
-- NOTES TABLE POLICIES
-- =============================================

SELECT create_policy_safe(
    'Users can access their own notes',
    'notes',
    'FOR ALL TO authenticated',
    'user_id = auth.uid()',
    'user_id = auth.uid()'
);

-- =============================================
-- SAAS EXPENSES TABLE POLICIES
-- =============================================

SELECT create_policy_safe(
    'Users can view all expenses',
    'saas_expenses',
    'FOR SELECT TO authenticated',
    'true'
);

SELECT create_policy_safe(
    'Users can create expenses',
    'saas_expenses',
    'FOR INSERT TO authenticated',
    NULL,
    'created_by = auth.uid()'
);

SELECT create_policy_safe(
    'Users can update expenses',
    'saas_expenses',
    'FOR UPDATE TO authenticated',
    'created_by = auth.uid()',
    'created_by = auth.uid()'
);

SELECT create_policy_safe(
    'Users can delete expenses',
    'saas_expenses',
    'FOR DELETE TO authenticated',
    'created_by = auth.uid()'
);

-- =============================================
-- MARKETING PROPERTIES POLICIES
-- =============================================

SELECT create_policy_safe(
    'Users can view their properties',
    'marketing_properties',
    'FOR SELECT TO authenticated',
    'user_id = auth.uid()'
);

SELECT create_policy_safe(
    'Users can manage their properties',
    'marketing_properties',
    'FOR ALL TO authenticated',
    'user_id = auth.uid()',
    'user_id = auth.uid()'
);

-- =============================================
-- MARKETING METRICS POLICIES
-- =============================================

SELECT create_policy_safe(
    'Users can view metrics for their properties',
    'marketing_metrics',
    'FOR SELECT TO authenticated',
    'property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())'
);

SELECT create_policy_safe(
    'Users can insert metrics for their properties',
    'marketing_metrics',
    'FOR INSERT TO authenticated',
    NULL,
    'property_id IN (SELECT id FROM marketing_properties WHERE user_id = auth.uid())'
);

-- =============================================
-- SHARED DATA POLICIES (Read-Only for All Users)
-- =============================================

-- KPI Data
SELECT create_policy_safe(
    'Users can read KPI data',
    'kpi_data',
    'FOR SELECT TO authenticated',
    'true'
);

-- Tech Stack
SELECT create_policy_safe(
    'Users can read tech stack',
    'tech_stack',
    'FOR SELECT TO authenticated', 
    'true'
);

-- Roadmap Items
SELECT create_policy_safe(
    'Users can read roadmap items',
    'roadmap_items',
    'FOR SELECT TO authenticated',
    'true'
);

-- Projects
SELECT create_policy_safe(
    'Users can read projects',
    'projects',
    'FOR SELECT TO authenticated',
    'true'
);

-- Vendors
SELECT create_policy_safe(
    'Users can read vendors',
    'vendors', 
    'FOR SELECT TO authenticated',
    'true'
);

-- AI Agents
SELECT create_policy_safe(
    'Users can read AI agents',
    'ai_agents',
    'FOR SELECT TO authenticated',
    'true'
);

-- API Statuses
SELECT create_policy_safe(
    'Users can read API statuses',
    'api_statuses',
    'FOR SELECT TO authenticated',
    'true'
);

-- Deployment Logs
SELECT create_policy_safe(
    'Users can read deployment logs',
    'deployment_logs',
    'FOR SELECT TO authenticated',
    'true'
);

-- Team Members
SELECT create_policy_safe(
    'Users can read team members',
    'team_members',
    'FOR SELECT TO authenticated',
    'true'
);

-- Quick Links
SELECT create_policy_safe(
    'Users can view all quick links',
    'quick_links',
    'FOR SELECT TO authenticated',
    'true'
);

SELECT create_policy_safe(
    'Users can manage their own quick links',
    'quick_links',
    'FOR ALL TO authenticated',
    'created_by = auth.uid()',
    'created_by = auth.uid()'
);

-- =============================================
-- CLEANUP FUNCTION
-- =============================================

DROP FUNCTION IF EXISTS create_policy_safe(text, text, text, text, text);

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
    policy_count integer;
    table_count integer;
BEGIN
    -- Count policies created
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO table_count 
    FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = true;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS SETUP COMPLETE!';
    RAISE NOTICE 'Tables with RLS enabled: %', table_count;
    RAISE NOTICE 'Total policies created: %', policy_count;
    RAISE NOTICE '========================================';
END $$;