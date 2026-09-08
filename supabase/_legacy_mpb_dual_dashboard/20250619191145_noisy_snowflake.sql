/*
  # Revert to Working Roadmap Data

  1. Data Restoration
    - Clear current roadmap data
    - Restore original working roadmap items with correct status values
    - Ensure all status values match database constraints

  2. Status Values
    - Use only valid status values: 'Backlog', 'In Progress', 'Complete'
    - Restore original project data that was working before

  3. Data Integrity
    - Maintain all foreign key relationships
    - Preserve original project structure and dependencies
*/

-- Clear existing roadmap data
DELETE FROM roadmap_items;

-- Insert original working roadmap items with correct status values
INSERT INTO roadmap_items (title, quarter, status, priority, owner, department, dependencies, description) VALUES
  ('MPB Enroll (E123 Replacement System)', 'Q3 2025', 'In Progress', 'High', 'Development Team', 'Product', 
   ARRAY['React Full Enrollment System', 'MPB Database', 'Web Version', 'Mobile App'], 
   'Member Management System AI powered Enrollment Suite'),
   
  ('MPB Health APP Suite', 'Q3 2025', 'Backlog', 'High', 'Development Team', 'MPB IT', 
   ARRAY['Member Portal Framework', 'HealthShare Access', 'Telehealth', 'Compliance Review'], 
   'Modular Member Portal with AI agents for member support'),
   
  ('SaudeMAX', 'Q3 2025', 'In Progress', 'High', 'Development Team', 'MPB IT, Fintech', 
   ARRAY['React Full Enrollment System', 'MPB / SaudeMAX Database', 'Web Version', 'Mobile App'], 
   'Enrollment System with Agent Affiliate System and Analytics Portal'),
   
  ('HIPAA Compliance Audit', 'Q3 2025', 'In Progress', 'High', 'Security Team', 'Compliance', 
   ARRAY['Vendor Assessment', 'Data Flow Mapping'], 
   'Complete HIPAA compliance assessment and remediation');