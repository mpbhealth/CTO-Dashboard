/*
  # Fix RLS policies for org_chart_positions table

  1. Security
    - Add INSERT policy for authenticated users to create org chart positions
    - Add UPDATE policy for authenticated users to modify org chart positions
    - Add DELETE policy for authenticated users to remove org chart positions
    
  This resolves the RLS policy violation error when trying to save or update
  organizational chart layout positions.
*/

-- Add INSERT policy for org_chart_positions
CREATE POLICY "Authenticated users can insert org chart positions"
  ON org_chart_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add UPDATE policy for org_chart_positions  
CREATE POLICY "Authenticated users can update org chart positions"
  ON org_chart_positions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add DELETE policy for org_chart_positions
CREATE POLICY "Authenticated users can delete org chart positions"
  ON org_chart_positions
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);