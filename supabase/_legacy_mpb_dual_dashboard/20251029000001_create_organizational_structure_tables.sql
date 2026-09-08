/*
  # Create Organizational Structure Tables

  Creates tables to support organizational chart functionality with department
  hierarchies and customizable chart positions.

  ## New Tables

  ### `department_relationships`
  Defines parent-child relationships between departments for org chart hierarchy.
  - `id` (uuid, primary key)
  - `parent_department_id` (uuid, references departments)
  - `child_department_id` (uuid, references departments)
  - `relationship_type` (text) - Type of relationship (e.g., 'reports_to', 'supports', 'collaborates')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `org_chart_positions`
  Stores custom positions for departments in the interactive org chart.
  - `id` (uuid, primary key)
  - `department_id` (uuid, unique, references departments)
  - `x_position` (integer) - Horizontal position in chart
  - `y_position` (integer) - Vertical position in chart
  - `layout_version` (text) - Version identifier for saved layouts
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Authenticated users can read all organizational data
  - Only admins and CTOs can modify org structure
*/

-- Create department_relationships table
CREATE TABLE IF NOT EXISTS department_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  child_department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'reports_to',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Prevent department from being its own parent
  CONSTRAINT no_self_reference CHECK (parent_department_id != child_department_id),

  -- Ensure unique parent-child combinations
  CONSTRAINT unique_relationship UNIQUE (parent_department_id, child_department_id)
);

-- Create index for faster hierarchy queries
CREATE INDEX IF NOT EXISTS idx_dept_rel_parent ON department_relationships(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_dept_rel_child ON department_relationships(child_department_id);
CREATE INDEX IF NOT EXISTS idx_dept_rel_type ON department_relationships(relationship_type);

-- Create org_chart_positions table
CREATE TABLE IF NOT EXISTS org_chart_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL UNIQUE REFERENCES departments(id) ON DELETE CASCADE,
  x_position integer NOT NULL DEFAULT 0,
  y_position integer NOT NULL DEFAULT 0,
  layout_version text NOT NULL DEFAULT 'v1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for org chart positions
CREATE INDEX IF NOT EXISTS idx_org_chart_dept ON org_chart_positions(department_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_layout ON org_chart_positions(layout_version);
CREATE INDEX IF NOT EXISTS idx_org_chart_updated ON org_chart_positions(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE department_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_relationships

-- Allow authenticated users to read all department relationships
CREATE POLICY "Authenticated users can view department relationships"
  ON department_relationships
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and CTOs to insert new relationships
CREATE POLICY "Admins and CTOs can create department relationships"
  ON department_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Allow admins and CTOs to update relationships
CREATE POLICY "Admins and CTOs can update department relationships"
  ON department_relationships
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Allow admins and CTOs to delete relationships
CREATE POLICY "Admins and CTOs can delete department relationships"
  ON department_relationships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- RLS Policies for org_chart_positions

-- Allow authenticated users to read all chart positions
CREATE POLICY "Authenticated users can view org chart positions"
  ON org_chart_positions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and CTOs to insert chart positions
CREATE POLICY "Admins and CTOs can create chart positions"
  ON org_chart_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Allow admins and CTOs to update chart positions
CREATE POLICY "Admins and CTOs can update chart positions"
  ON org_chart_positions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Allow admins and CTOs to delete chart positions
CREATE POLICY "Admins and CTOs can delete chart positions"
  ON org_chart_positions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'cto', 'ceo')
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_department_relationships_updated_at ON department_relationships;
CREATE TRIGGER update_department_relationships_updated_at
  BEFORE UPDATE ON department_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_chart_positions_updated_at ON org_chart_positions;
CREATE TRIGGER update_org_chart_positions_updated_at
  BEFORE UPDATE ON org_chart_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to detect circular dependencies in department hierarchy
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER AS $$
DECLARE
  v_depth INTEGER := 0;
  v_current_id uuid := NEW.parent_department_id;
  v_max_depth INTEGER := 100;
BEGIN
  -- Walk up the hierarchy to check for circles
  WHILE v_current_id IS NOT NULL AND v_depth < v_max_depth LOOP
    -- If we find the child department in the ancestors, we have a circle
    IF v_current_id = NEW.child_department_id THEN
      RAISE EXCEPTION 'Circular dependency detected: department cannot be its own ancestor';
    END IF;

    -- Move to the next parent
    SELECT parent_department_id INTO v_current_id
    FROM department_relationships
    WHERE child_department_id = v_current_id
    LIMIT 1;

    v_depth := v_depth + 1;
  END LOOP;

  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'Department hierarchy too deep (max 100 levels)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent circular dependencies
DROP TRIGGER IF EXISTS prevent_circular_dependency ON department_relationships;
CREATE TRIGGER prevent_circular_dependency
  BEFORE INSERT OR UPDATE ON department_relationships
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_dependency();
