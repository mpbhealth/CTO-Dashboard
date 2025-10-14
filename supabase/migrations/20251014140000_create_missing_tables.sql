/*
  # Create Missing Application Tables

  ## New Tables
  
  ### Core Business Tables
  - `team_members` - Team member information
  - `saas_expenses` - SaaS expense tracking
  - `member_enrollments` - Member enrollment records
  - `member_status_updates` - Member status change tracking
  
  ### HR & Performance Tables
  - `departments` - Department information
  - `employee_profiles` - Employee profile data
  - `performance_reviews` - Performance review records
  - `kpi_definitions` - KPI definition metadata
  - `employee_kpis` - Employee KPI tracking
  - `career_development_plans` - Career development planning
  - `learning_activities` - Learning and development activities
  - `feedback_entries` - Continuous feedback system
  
  ### Organizational Structure Tables
  - `department_workflows` - Department workflow definitions
  - `workflow_steps` - Workflow step details
  - `department_relationships` - Cross-department relationships
  - `org_chart_positions` - Organization chart position data
  - `department_metrics` - Department performance metrics
  
  ### Policy Management Tables
  - `policy_documents` - Policy document storage (if not existing)
  - `policy_document_history` - Policy version history
  - `policy_acknowledgements` - Employee policy acknowledgements
  
  ### Assignment System Tables
  - `users` - User account information
  - `assignments` - Task/project assignments
  
  ### Marketing Tables
  - `marketing_properties` - Marketing property tracking
  - `marketing_metrics` - Marketing performance metrics
  
  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated access
*/

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  email text,
  department text,
  hire_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

-- SaaS Expenses
CREATE TABLE IF NOT EXISTS saas_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  category text,
  monthly_cost numeric(10,2) NOT NULL,
  billing_cycle text DEFAULT 'monthly',
  renewal_date date,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saas_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read saas expenses"
  ON saas_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert saas expenses"
  ON saas_expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update saas expenses"
  ON saas_expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete saas expenses"
  ON saas_expenses FOR DELETE
  TO authenticated
  USING (true);

-- Member Enrollments
CREATE TABLE IF NOT EXISTS member_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL,
  member_name text NOT NULL,
  enrollment_date date NOT NULL,
  plan_type text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE member_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read member enrollments"
  ON member_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert member enrollments"
  ON member_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update member enrollments"
  ON member_enrollments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete member enrollments"
  ON member_enrollments FOR DELETE
  TO authenticated
  USING (true);

-- Member Status Updates
CREATE TABLE IF NOT EXISTS member_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL,
  status text NOT NULL,
  update_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE member_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read member status updates"
  ON member_status_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert member status updates"
  ON member_status_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_department_id uuid REFERENCES departments(id),
  head_employee_id uuid,
  budget numeric(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Employee Profiles
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL,
  department_id uuid REFERENCES departments(id),
  position text,
  hire_date date,
  manager_id uuid REFERENCES employee_profiles(id),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employee profiles"
  ON employee_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage employee profiles"
  ON employee_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  reviewer_id uuid REFERENCES employee_profiles(id) NOT NULL,
  review_period_start date NOT NULL,
  review_period_end date NOT NULL,
  overall_rating numeric(3,2),
  strengths text,
  areas_for_improvement text,
  goals text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read performance reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage performance reviews"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- KPI Definitions
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  measurement_unit text,
  target_value numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read kpi definitions"
  ON kpi_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage kpi definitions"
  ON kpi_definitions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Employee KPIs
CREATE TABLE IF NOT EXISTS employee_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  kpi_id uuid REFERENCES kpi_definitions(id) NOT NULL,
  target_value numeric NOT NULL,
  actual_value numeric,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employee kpis"
  ON employee_kpis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage employee kpis"
  ON employee_kpis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Career Development Plans
CREATE TABLE IF NOT EXISTS career_development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  goal text NOT NULL,
  target_date date,
  status text DEFAULT 'active',
  progress_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_development_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read career development plans"
  ON career_development_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage career development plans"
  ON career_development_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Learning Activities
CREATE TABLE IF NOT EXISTS learning_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  activity_name text NOT NULL,
  activity_type text,
  completion_date date,
  status text DEFAULT 'in_progress',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read learning activities"
  ON learning_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage learning activities"
  ON learning_activities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Feedback Entries
CREATE TABLE IF NOT EXISTS feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  giver_id uuid REFERENCES employee_profiles(id) NOT NULL,
  feedback_type text,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feedback entries"
  ON feedback_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert feedback entries"
  ON feedback_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Department Workflows
CREATE TABLE IF NOT EXISTS department_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) NOT NULL,
  workflow_name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE department_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read department workflows"
  ON department_workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage department workflows"
  ON department_workflows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workflow Steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES department_workflows(id) NOT NULL,
  step_number integer NOT NULL,
  step_name text NOT NULL,
  description text,
  assigned_role text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read workflow steps"
  ON workflow_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage workflow steps"
  ON workflow_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Department Relationships
CREATE TABLE IF NOT EXISTS department_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) NOT NULL,
  related_department_id uuid REFERENCES departments(id) NOT NULL,
  relationship_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE department_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read department relationships"
  ON department_relationships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage department relationships"
  ON department_relationships FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Org Chart Positions
CREATE TABLE IF NOT EXISTS org_chart_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id),
  position_title text NOT NULL,
  department_id uuid REFERENCES departments(id),
  parent_position_id uuid REFERENCES org_chart_positions(id),
  level integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_chart_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read org chart positions"
  ON org_chart_positions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage org chart positions"
  ON org_chart_positions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Department Metrics
CREATE TABLE IF NOT EXISTS department_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE department_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read department metrics"
  ON department_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage department metrics"
  ON department_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy Document History
CREATE TABLE IF NOT EXISTS policy_document_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  version integer NOT NULL,
  content text,
  changed_by uuid REFERENCES auth.users(id),
  change_summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE policy_document_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read policy document history"
  ON policy_document_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert policy document history"
  ON policy_document_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy Acknowledgements
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  version integer NOT NULL
);

ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own acknowledgements"
  ON policy_acknowledgements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own acknowledgements"
  ON policy_acknowledgements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users (if not using auth.users directly)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'user',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id),
  assigned_by uuid REFERENCES users(id),
  project_id uuid REFERENCES projects(id),
  due_date date,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketing Properties
CREATE TABLE IF NOT EXISTS marketing_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  property_type text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read marketing properties"
  ON marketing_properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketing properties"
  ON marketing_properties FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketing Metrics
CREATE TABLE IF NOT EXISTS marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES marketing_properties(id),
  metric_date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read marketing metrics"
  ON marketing_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketing metrics"
  ON marketing_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);