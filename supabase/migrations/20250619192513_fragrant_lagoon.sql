/*
  # Fix Projects Table RLS Policies

  1. Security Updates
    - Drop existing conflicting policies
    - Create comprehensive policies for authenticated users
    - Ensure proper access to projects data

  2. Policy Structure
    - Allow authenticated users to read all projects
    - Allow authenticated users to manage all projects
    - Ensure policies don't conflict with each other
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can read projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;

-- Create comprehensive policy for authenticated users to manage all project operations
CREATE POLICY "Authenticated users can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to read project data
CREATE POLICY "Authenticated users can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anonymous users to read project data (if needed for public access)
CREATE POLICY "Anonymous users can read projects"
  ON projects
  FOR SELECT
  TO anon
  USING (true);

-- Verify the projects data exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
    -- Re-insert project data if it's missing
    INSERT INTO projects (name, description, status, team, github_link, jira_link, progress) VALUES
      ('MPB Enroll (E123 Replacement)', 'Modern React-based enrollment system replacing legacy E123 platform with AI-powered member management features', 'Building', 
       ARRAY['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'Vinnie R. Tannous'], 
       'https://github.com/mpbhealth/mpb-enroll', 'https://mpbhealth.atlassian.net/browse/MPB-E123', 75),
       
      ('MPB Health APP Suite', 'Comprehensive member portal with modular architecture, AI agents for member support, and integrated telehealth capabilities', 'Building', 
       ARRAY['Emily Rodriguez', 'David Kim', 'Alex Thompson', 'Maria Garcia'], 
       'https://github.com/mpbhealth/app-suite', 'https://mpbhealth.atlassian.net/browse/MPB-APP', 60),
       
      ('SaudeMAX International Platform', 'Brazilian market enrollment system with agent affiliate program, multi-language support, and comprehensive analytics', 'Planning', 
       ARRAY['Michael Chen', 'Carlos Silva', 'Ana Rodriguez', 'Vinnie R. Tannous'], 
       'https://github.com/mpbhealth/saudemax', 'https://mpbhealth.atlassian.net/browse/SMX-001', 25),
       
      ('AI Agents for Advisors', 'Dedicated AI agents designed to optimize enrollment workflows, enhance advisor productivity, and provide intelligent recommendations', 'Building', 
       ARRAY['Daniel Jimenez', 'Vandana Rathore', 'Sarah Johnson', 'Robert Wilson'], 
       'https://github.com/mpbhealth/ai-advisors', 'https://mpbhealth.atlassian.net/browse/AI-ADV', 55),
       
      ('HIPAA Compliance Audit', 'Comprehensive security assessment and remediation across all systems to ensure full HIPAA compliance and data protection', 'Building', 
       ARRAY['Robert Wilson', 'David Kim', 'Maria Garcia', 'Legal Team'], 
       'https://github.com/mpbhealth/hipaa-compliance', 'https://mpbhealth.atlassian.net/browse/HIPAA-001', 80),
       
      ('Crypto Optimizer Platform', 'Advanced cryptocurrency investment tools with automated DCA strategies, Pine Script integration, and real-time market analysis', 'Planning', 
       ARRAY['Vinnie R. Tannous', 'Michael Chen', 'Trading Team'], 
       'https://github.com/mpbhealth/crypto-optimizer', 'https://mpbhealth.atlassian.net/browse/CRYPTO-001', 15),
       
      ('OwnBite Food Scanner', 'AI-powered nutrition tracking application with advanced food recognition, comprehensive nutrition database, and personalized meal planning', 'Planning', 
       ARRAY['Alex Thompson', 'Emily Rodriguez', 'Health Team'], 
       'https://github.com/mpbhealth/ownbite', 'https://mpbhealth.atlassian.net/browse/BITE-001', 10),
       
      ('CarePilot Insurance AI', 'Modular insurance AI platform with specialized agents for claims processing, policy recommendations, and automated customer service', 'Planning', 
       ARRAY['Daniel Jimenez', 'Vandana Rathore', 'Insurance Team'], 
       'https://github.com/mpbhealth/carepilot', 'https://mpbhealth.atlassian.net/browse/CARE-001', 20),
       
      ('Infrastructure Modernization', 'Migration from legacy systems to modern cloud-native architecture with improved scalability, security, and performance monitoring', 'Building', 
       ARRAY['David Kim', 'DevOps Team', 'Engineering Team'], 
       'https://github.com/mpbhealth/infrastructure', 'https://mpbhealth.atlassian.net/browse/INFRA-001', 45),
       
      ('Mobile App Development', 'Cross-platform mobile applications for iOS and Android with offline capabilities, real-time notifications, and seamless web integration', 'Planning', 
       ARRAY['Mobile Team', 'Emily Rodriguez', 'UX Team'], 
       'https://github.com/mpbhealth/mobile-apps', 'https://mpbhealth.atlassian.net/browse/MOBILE-001', 5);
  END IF;
END $$;