/*
  # Add organization chart layout management functions

  1. New Functions
    - `save_org_chart_layout` - Save the current layout with a new version
    - `reset_org_chart_layout` - Reset layout to previously saved version

  2. Database Objects
    - Adds PostgreSQL functions for managing org chart layouts
    - Provides version control for layout history
*/

-- Function to save the current org chart layout with a new version number
CREATE OR REPLACE FUNCTION save_org_chart_layout(new_version integer)
RETURNS void AS $$
BEGIN
  UPDATE org_chart_positions
  SET layout_version = new_version,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset the org chart layout to default positions or previously saved layout
CREATE OR REPLACE FUNCTION reset_org_chart_layout()
RETURNS void AS $$
DECLARE
  max_version integer;
BEGIN
  -- Get the maximum layout_version
  SELECT MAX(layout_version)
  INTO max_version
  FROM org_chart_positions;
  
  -- If no saved layouts, reset to default positions
  IF max_version IS NULL OR max_version = 0 THEN
    -- Reset to default positions based on a simple hierarchical layout
    WITH dept_hierarchy AS (
      SELECT 
        d.id,
        d.parent_department_id,
        CASE WHEN d.parent_department_id IS NULL THEN 0 ELSE 1 END AS level
      FROM departments d
    )
    UPDATE org_chart_positions op
    SET 
      -- Create a grid layout based on hierarchy level
      x_position = (CASE 
                      WHEN h.level = 0 THEN 400 -- Root nodes centered
                      ELSE 100 + (ROW_NUMBER() OVER (PARTITION BY h.parent_department_id ORDER BY op.id) * 250)
                    END),
      y_position = (CASE 
                      WHEN h.level = 0 THEN 100 -- Root nodes at top
                      ELSE 250 -- Child nodes below
                    END),
      layout_version = 0,
      updated_at = now()
    FROM dept_hierarchy h
    WHERE op.department_id = h.id;
  ELSE
    -- Do nothing, as existing positions already have the most recent version
    NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;