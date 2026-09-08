/*
  # MPB Health CTO Dashboard Database Schema

  1. New Tables
    - `kpi_data` - Key performance indicators with trends
    - `tech_stack` - Technology stack items with versions and ownership
    - `roadmap_items` - Strategic roadmap items with dependencies
    - `projects` - Active projects with progress tracking
    - `vendors` - SaaS vendor management with costs and renewals
    - `ai_agents` - AI agent configurations and prompts
    - `api_statuses` - API health monitoring
    - `deployment_logs` - Deployment history and status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their organization's data
*/

-- KPI Data table
CREATE TABLE IF NOT EXISTS kpi_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  value text NOT NULL,
  change text NOT NULL,
  trend text CHECK (trend IN ('up', 'down', 'stable')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tech Stack table
CREATE TABLE IF NOT EXISTS tech_stack (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  version text NOT NULL,
  owner text NOT NULL,
  status text CHECK (status IN ('Active', 'Experimental', 'Deprecated')) NOT NULL DEFAULT 'Active',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roadmap Items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  quarter text NOT NULL,
  status text CHECK (status IN ('Backlog', 'In Progress', 'Complete')) NOT NULL DEFAULT 'Backlog',
  priority text CHECK (priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
  owner text NOT NULL,
  department text NOT NULL,
  dependencies text[] DEFAULT '{}',
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  status text CHECK (status IN ('Planning', 'Building', 'Live')) NOT NULL DEFAULT 'Planning',
  team text[] NOT NULL DEFAULT '{}',
  github_link text DEFAULT '',
  jira_link text DEFAULT '',
  progress integer CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  cost numeric NOT NULL,
  billing_cycle text CHECK (billing_cycle IN ('Monthly', 'Yearly')) NOT NULL,
  renewal_date date NOT NULL,
  owner text NOT NULL,
  justification text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  status text CHECK (status IN ('Live', 'Inactive')) NOT NULL DEFAULT 'Inactive',
  prompt text NOT NULL,
  dataset_refs text[] DEFAULT '{}',
  environment text NOT NULL DEFAULT 'Staging',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- API Status table
CREATE TABLE IF NOT EXISTS api_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  status text CHECK (status IN ('Healthy', 'Warning', 'Down')) NOT NULL DEFAULT 'Healthy',
  last_checked timestamptz DEFAULT now(),
  response_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deployment Logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project text NOT NULL,
  env text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  status text CHECK (status IN ('Success', 'Failed', 'In Progress')) NOT NULL,
  log text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read all dashboard data"
  ON kpi_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage all dashboard data"
  ON kpi_data FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read tech stack"
  ON tech_stack FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage tech stack"
  ON tech_stack FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read roadmap items"
  ON roadmap_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage roadmap items"
  ON roadmap_items FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read ai agents"
  ON ai_agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage ai agents"
  ON ai_agents FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read api statuses"
  ON api_statuses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage api statuses"
  ON api_statuses FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read deployment logs"
  ON deployment_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage deployment logs"
  ON deployment_logs FOR ALL
  TO authenticated
  USING (true);