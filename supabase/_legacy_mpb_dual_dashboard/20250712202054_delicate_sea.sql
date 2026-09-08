/*
# Employee Performance & Evaluation System

1. New Tables
  - `performance_reviews` - For quarterly/annual reviews
  - `review_criteria` - Defines evaluation criteria
  - `review_scores` - Stores individual scores by criteria
  - `kpi_definitions` - Configurable KPI metrics
  - `employee_kpis` - Employee-specific KPI tracking
  - `career_development_plans` - Career growth planning
  - `learning_activities` - Training and learning for career plans
  - `feedback_entries` - 360° feedback system

2. Security
  - Enable RLS on all tables
  - Add policies for proper access control
*/

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES employee_profiles(id),
  review_cycle text NOT NULL CHECK (review_cycle IN ('quarterly', 'annual', 'mid-year')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'acknowledged')),
  overall_score numeric,
  final_rating text CHECK (final_rating IN ('exceeds', 'meets', 'partially_meets', 'does_not_meet')),
  strengths text,
  areas_for_improvement text,
  goals_assessment text,
  performance_summary text,
  submitted_at timestamptz,
  approved_at timestamptz,
  acknowledged_at timestamptz,
  next_review_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_period_check CHECK (period_end >= period_start)
);

-- Review Criteria Table
CREATE TABLE IF NOT EXISTS review_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('technical', 'behavioral', 'leadership', 'values')),
  description text,
  weight numeric NOT NULL DEFAULT 1.0,
  max_score integer NOT NULL DEFAULT 5,
  is_active boolean DEFAULT true,
  department_id uuid REFERENCES departments(id),
  applicable_roles text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Review Scores Table
CREATE TABLE IF NOT EXISTS review_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES review_criteria(id),
  score numeric NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_score CHECK (score >= 0)
);

-- KPI Definitions Table
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  unit text,
  target_value numeric NOT NULL,
  min_threshold numeric,
  max_threshold numeric,
  frequency text CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  applicable_roles text[],
  department_id uuid REFERENCES departments(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee KPIs Table
CREATE TABLE IF NOT EXISTS employee_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  kpi_id uuid NOT NULL REFERENCES kpi_definitions(id),
  current_value numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  last_updated timestamptz DEFAULT now(),
  target_date date,
  notes text,
  
  CONSTRAINT unique_employee_kpi UNIQUE (employee_id, kpi_id)
);

-- Career Development Plans Table
CREATE TABLE IF NOT EXISTS career_development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'completed')),
  start_date date NOT NULL,
  target_completion_date date,
  completed_date date,
  mentor_id uuid REFERENCES employee_profiles(id),
  skills_to_develop text[],
  resources_needed text,
  success_criteria text,
  progress integer DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Learning Activities Table
CREATE TABLE IF NOT EXISTS learning_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES career_development_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  due_date date,
  completion_date date,
  activity_type text CHECK (activity_type IN ('course', 'certification', 'workshop', 'project', 'mentorship', 'other')),
  url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feedback Entries Table
CREATE TABLE IF NOT EXISTS feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES employee_profiles(id),
  feedback_type text NOT NULL CHECK (feedback_type IN ('praise', 'criticism', 'suggestion', 'question')),
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_perf_reviews_employee_id ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_status ON performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_scores_review_id ON review_scores(review_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_employee_id ON employee_kpis(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_plans_employee_id ON career_development_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_plan_id ON learning_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_recipient_id ON feedback_entries(recipient_id);

-- RLS Policies

-- Performance Reviews
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR reviewer_id = auth.uid());

CREATE POLICY "Users can insert their own reviews"
  ON performance_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON performance_reviews FOR UPDATE
  TO authenticated
  USING ((employee_id = auth.uid() AND status IN ('draft', 'acknowledged')) OR 
         (reviewer_id = auth.uid() AND status IN ('draft', 'submitted', 'under_review')));

-- Review Criteria
ALTER TABLE review_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read review criteria"
  ON review_criteria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage review criteria"
  ON review_criteria FOR ALL
  TO authenticated
  USING (true);

-- Review Scores
ALTER TABLE review_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores for their reviews"
  ON review_scores FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM performance_reviews
    WHERE performance_reviews.id = review_scores.review_id
    AND (performance_reviews.employee_id = auth.uid() OR performance_reviews.reviewer_id = auth.uid())
  ));

CREATE POLICY "Reviewers can insert scores"
  ON review_scores FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM performance_reviews
    WHERE performance_reviews.id = review_scores.review_id
    AND performance_reviews.reviewer_id = auth.uid()
  ));

CREATE POLICY "Reviewers can update scores"
  ON review_scores FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM performance_reviews
    WHERE performance_reviews.id = review_scores.review_id
    AND performance_reviews.reviewer_id = auth.uid()
    AND performance_reviews.status IN ('draft', 'under_review')
  ));

-- KPI Definitions
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read KPI definitions"
  ON kpi_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage KPI definitions"
  ON kpi_definitions FOR ALL
  TO authenticated
  USING (true);

-- Employee KPIs
ALTER TABLE employee_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KPIs"
  ON employee_kpis FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.id = employee_kpis.employee_id
    AND employee_profiles.reports_to_id = auth.uid()
  ));

CREATE POLICY "Managers can insert KPIs"
  ON employee_kpis FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.id = employee_kpis.employee_id
    AND (employee_profiles.reports_to_id = auth.uid() OR employee_profiles.id = auth.uid())
  ));

CREATE POLICY "Managers can update KPIs"
  ON employee_kpis FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.id = employee_kpis.employee_id
    AND (employee_profiles.reports_to_id = auth.uid() OR employee_profiles.id = auth.uid())
  ));

-- Career Development Plans
ALTER TABLE career_development_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career plans"
  ON career_development_plans FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR 
         mentor_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM employee_profiles
           WHERE employee_profiles.id = career_development_plans.employee_id
           AND employee_profiles.reports_to_id = auth.uid()
         ));

CREATE POLICY "Users can manage their own career plans"
  ON career_development_plans FOR ALL
  TO authenticated
  USING (employee_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM employee_profiles
           WHERE employee_profiles.id = career_development_plans.employee_id
           AND employee_profiles.reports_to_id = auth.uid()
         ));

-- Learning Activities
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning activities"
  ON learning_activities FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM career_development_plans
    WHERE career_development_plans.id = learning_activities.plan_id
    AND (career_development_plans.employee_id = auth.uid() OR 
         career_development_plans.mentor_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM employee_profiles
           WHERE employee_profiles.id = career_development_plans.employee_id
           AND employee_profiles.reports_to_id = auth.uid()
         ))
  ));

CREATE POLICY "Users can manage their own learning activities"
  ON learning_activities FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM career_development_plans
    WHERE career_development_plans.id = learning_activities.plan_id
    AND (career_development_plans.employee_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM employee_profiles
           WHERE employee_profiles.id = career_development_plans.employee_id
           AND employee_profiles.reports_to_id = auth.uid()
         ))
  ));

-- Feedback Entries
ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read feedback they received"
  ON feedback_entries FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid() OR 
         provider_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM employee_profiles
           WHERE employee_profiles.id = feedback_entries.recipient_id
           AND employee_profiles.reports_to_id = auth.uid()
         ));

CREATE POLICY "Users can provide feedback"
  ON feedback_entries FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid() OR is_anonymous = true);