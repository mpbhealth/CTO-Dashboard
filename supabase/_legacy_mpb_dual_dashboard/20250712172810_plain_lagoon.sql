/*
  # Comprehensive Organizational Structure Database Schema

  1. New Tables
    - `departments`
      - Complete department information with hierarchy support
      - Policy documentation and strategic purpose
      - Inter-departmental relationships
    - `employee_profiles` 
      - Comprehensive employee information
      - Multiple department assignments
      - Reporting relationships
    - `department_workflows`
      - Step-by-step workflow definitions
      - Task sequences and dependencies
    - `workflow_steps`
      - Individual workflow step details
    - `department_relationships`
      - Inter-departmental collaboration mapping
    - `org_chart_positions`
      - Visual positioning for org chart
    - `policy_documents`
      - Document management for policies/SOPs
    - `department_metrics`
      - Performance tracking and analytics
    - `workflow_instances`
      - Active workflow execution tracking

  2. Security
    - Enable RLS on all tables
    - Role-based access policies (Admin, Department Lead, Viewer)
    - User role management
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'department_lead', 'viewer')),
  department_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Departments table with hierarchy support
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  strategic_purpose text,
  parent_department_id uuid REFERENCES departments(id),
  department_lead_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  budget_allocated numeric,
  headcount integer DEFAULT 0,
  location text,
  contact_email text,
  mission_statement text,
  key_objectives text[],
  tech_stack text[],
  reporting_frequency text DEFAULT 'weekly'
);

-- Employee profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  title text NOT NULL,
  primary_department_id uuid REFERENCES departments(id),
  reports_to_id uuid REFERENCES employee_profiles(id),
  employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave')),
  employment_type text DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  start_date date,
  end_date date,
  salary numeric,
  location text,
  skills text[],
  certifications text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Department assignments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS department_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role_in_department text,
  allocation_percentage integer DEFAULT 100 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, department_id, start_date)
);

-- Department workflows
CREATE TABLE IF NOT EXISTS department_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  workflow_type text DEFAULT 'process' CHECK (workflow_type IN ('process', 'approval', 'communication', 'escalation')),
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  estimated_duration interval,
  complexity_level text DEFAULT 'medium' CHECK (complexity_level IN ('low', 'medium', 'high')),
  automation_level text DEFAULT 'manual' CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated'))
);

-- Workflow steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES department_workflows(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  name text NOT NULL,
  description text,
  assigned_role text,
  estimated_time interval,
  dependencies text[],
  required_tools text[],
  success_criteria text,
  failure_actions text,
  automation_script text,
  is_parallel boolean DEFAULT false,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, step_number)
);

-- Department relationships
CREATE TABLE IF NOT EXISTS department_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  target_department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('reports_to', 'collaborates_with', 'supports', 'depends_on')),
  strength integer DEFAULT 1 CHECK (strength >= 1 AND strength <= 5),
  communication_frequency text DEFAULT 'weekly',
  shared_resources text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(source_department_id, target_department_id, relationship_type)
);

-- Org chart positions for visual layout
CREATE TABLE IF NOT EXISTS org_chart_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE UNIQUE,
  x_position numeric DEFAULT 0,
  y_position numeric DEFAULT 0,
  width numeric DEFAULT 200,
  height numeric DEFAULT 100,
  layout_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Policy documents
CREATE TABLE IF NOT EXISTS policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text CHECK (document_type IN ('policy', 'sop', 'handbook', 'procedure', 'guideline')),
  content text,
  file_url text,
  version text DEFAULT '1.0',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  review_date date,
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Department metrics
CREATE TABLE IF NOT EXISTS department_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_type text CHECK (metric_type IN ('performance', 'financial', 'operational', 'hr')),
  measurement_unit text,
  target_value numeric,
  measurement_date date DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Workflow instances (active executions)
CREATE TABLE IF NOT EXISTS workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES department_workflows(id) ON DELETE CASCADE,
  instance_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  current_step_id uuid REFERENCES workflow_steps(id),
  started_by uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  context_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department ON employee_profiles(primary_department_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_reports_to ON employee_profiles(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_department_assignments_employee ON department_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_department_assignments_department ON department_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_department_relationships_source ON department_relationships(source_department_id);
CREATE INDEX IF NOT EXISTS idx_department_relationships_target ON department_relationships(target_department_id);
CREATE INDEX IF NOT EXISTS idx_policy_documents_department ON policy_documents(department_id);
CREATE INDEX IF NOT EXISTS idx_department_metrics_department ON department_metrics(department_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow ON workflow_instances(workflow_id);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can read their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- RLS Policies for departments
CREATE POLICY "Everyone can read departments" ON departments
  FOR SELECT USING (true);

CREATE POLICY "Admins and department leads can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'admin' OR (ur.role = 'department_lead' AND ur.department_id = id))
    )
  );

-- RLS Policies for employee_profiles
CREATE POLICY "Users can read employee profiles" ON employee_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON employee_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins and department leads can manage employee profiles" ON employee_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'admin' OR ur.role = 'department_lead')
    )
  );

-- RLS Policies for department_assignments
CREATE POLICY "Users can read department assignments" ON department_assignments
  FOR SELECT USING (true);

CREATE POLICY "Admins and department leads can manage assignments" ON department_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'admin' OR ur.role = 'department_lead')
    )
  );

-- RLS Policies for workflows
CREATE POLICY "Users can read workflows" ON department_workflows
  FOR SELECT USING (true);

CREATE POLICY "Admins and department leads can manage workflows" ON department_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND (ur.role = 'admin' OR (ur.role = 'department_lead' AND ur.department_id = department_id))
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Users can read workflow steps" ON workflow_steps FOR SELECT USING (true);
CREATE POLICY "Users can read department relationships" ON department_relationships FOR SELECT USING (true);
CREATE POLICY "Users can read org chart positions" ON org_chart_positions FOR SELECT USING (true);
CREATE POLICY "Users can read policy documents" ON policy_documents FOR SELECT USING (true);
CREATE POLICY "Users can read department metrics" ON department_metrics FOR SELECT USING (true);
CREATE POLICY "Users can read workflow instances" ON workflow_instances FOR SELECT USING (true);

-- Insert sample data
INSERT INTO departments (id, name, description, strategic_purpose) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Executive', 'Executive leadership and strategic direction', 'Set company vision and strategic direction'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Engineering', 'Software development and technical innovation', 'Build and maintain technology solutions'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Product', 'Product strategy and management', 'Define and guide product development'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Operations', 'Business operations and process management', 'Ensure efficient business operations'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Marketing', 'Brand management and customer acquisition', 'Drive growth and brand awareness'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Sales', 'Revenue generation and client relationships', 'Generate revenue and manage client relationships'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Finance', 'Financial planning and management', 'Manage company finances and planning'),
  ('550e8400-e29b-41d4-a716-446655440008', 'HR', 'Human resources and talent management', 'Manage talent and organizational development');

-- Insert department relationships
INSERT INTO department_relationships (source_department_id, target_department_id, relationship_type, strength) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'reports_to', 5),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'reports_to', 5),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'collaborates_with', 4),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'supports', 3),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'supports', 3);

-- Insert org chart positions
INSERT INTO org_chart_positions (department_id, x_position, y_position) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 400, 50),  -- Executive (top center)
  ('550e8400-e29b-41d4-a716-446655440002', 200, 200), -- Engineering
  ('550e8400-e29b-41d4-a716-446655440003', 600, 200), -- Product
  ('550e8400-e29b-41d4-a716-446655440004', 400, 350), -- Operations
  ('550e8400-e29b-41d4-a716-446655440005', 100, 350), -- Marketing
  ('550e8400-e29b-41d4-a716-446655440006', 300, 350), -- Sales
  ('550e8400-e29b-41d4-a716-446655440007', 500, 350), -- Finance
  ('550e8400-e29b-41d4-a716-446655440008', 700, 350); -- HR