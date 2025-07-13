/*
  # Restore Projects Data

  1. Data Restoration
    - Clear any existing project data to avoid conflicts
    - Insert comprehensive project data for MPB Health
    - Include all active projects with proper team assignments and progress

  2. Project Details
    - MPB Enroll (E123 Replacement System)
    - MPB Health APP Suite
    - SaudeMAX International Platform
    - AI Agents for Advisors
    - HIPAA Compliance Audit
    - Crypto Optimizer Platform
    - OwnBite Food Scanner
    - CarePilot Insurance AI
    - Infrastructure Modernization
    - Mobile App Development

  3. Data Integrity
    - Ensure all status values match database constraints
    - Include realistic progress percentages
    - Add proper team member assignments
    - Include GitHub and Jira links
*/

-- Clear existing project data to avoid conflicts
DELETE FROM projects;

-- Insert comprehensive project data
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