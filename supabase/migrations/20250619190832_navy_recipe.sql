/*
  # Repopulate Dashboard Data

  1. Data Updates
    - Clear existing roadmap, tech stack, and project data
    - Repopulate with original data structure
    - Maintain data integrity and relationships

  2. Changes Made
    - Roadmap items with correct status values
    - Technology stack with proper categorization
    - Projects with accurate progress and team assignments
*/

-- Clear existing data for repopulation
DELETE FROM roadmap_items;
DELETE FROM tech_stack;
DELETE FROM projects;

-- Insert Technology Stack (Enhanced with more technologies)
INSERT INTO tech_stack (name, category, version, owner, status, notes) VALUES
  ('React', 'Frontend', '18.3.1', 'Frontend Team', 'Active', 'Primary UI framework for all web applications'),
  ('TypeScript', 'Frontend', '5.5.3', 'Frontend Team', 'Active', 'Type-safe JavaScript for better development experience'),
  ('Tailwind CSS', 'Frontend', '3.4.1', 'Frontend Team', 'Active', 'Utility-first CSS framework for rapid UI development'),
  ('Vite', 'Frontend', '5.4.2', 'Frontend Team', 'Active', 'Fast build tool and development server'),
  ('Supabase', 'Backend', '2.38.0', 'Backend Team', 'Active', 'Database and authentication provider'),
  ('PostgreSQL', 'Database', '15.0', 'Backend Team', 'Active', 'Primary relational database'),
  ('Node.js', 'Backend', '20.0.0', 'Backend Team', 'Active', 'JavaScript runtime for server-side applications'),
  ('WordPress', 'CMS', '6.4.2', 'Content Team', 'Active', 'Main website and blog platform'),
  ('Pine Script', 'Trading', 'v5', 'Vinnie R. Tannous', 'Active', 'TradingView automation and alerts'),
  ('GitHub Actions', 'DevOps', '4.0', 'DevOps Team', 'Active', 'CI/CD pipeline automation'),
  ('Docker', 'DevOps', '24.0', 'DevOps Team', 'Active', 'Containerization platform'),
  ('Netlify', 'Hosting', '1.0', 'DevOps Team', 'Active', 'Static site hosting and deployment'),
  ('JotForm', 'Forms', '2024.1', 'Operations Team', 'Active', 'Form builder with AI agent integration'),
  ('n8n', 'Automation', '1.0', 'Automation Team', 'Active', 'Workflow automation platform'),
  ('jQuery', 'Frontend', '3.6.0', 'Legacy Team', 'Deprecated', 'Scheduled for removal Q2 2025'),
  ('PHP', 'Backend', '8.2', 'Legacy Team', 'Deprecated', 'Being phased out in favor of Node.js');

-- Insert Roadmap Items (Comprehensive roadmap for MPB Health)
INSERT INTO roadmap_items (title, quarter, status, priority, owner, department, dependencies, description) VALUES
  ('MPB Enroll (E123 Replacement System)', 'Q1 2025', 'In Progress', 'High', 'Development Team', 'Product Engineering', 
   ARRAY['React Full Enrollment System', 'MPB Database Integration', 'Web Version', 'Mobile App', 'AI Agent Integration'], 
   'Complete replacement of legacy E123 system with modern React-based enrollment platform featuring AI-powered member management'),
   
  ('MPB Health APP Suite', 'Q1 2025', 'In Progress', 'High', 'Development Team', 'Product Engineering', 
   ARRAY['Member Portal Framework', 'HealthShare API Integration', 'Telehealth Module', 'HIPAA Compliance Review', 'Mobile Optimization'], 
   'Comprehensive member portal with modular architecture, AI agents for member support, and integrated telehealth capabilities'),
   
  ('SaudeMAX Platform', 'Q2 2025', 'Backlog', 'High', 'Development Team', 'Fintech & International', 
   ARRAY['Multi-language Support', 'Brazilian Payment Integration', 'Agent Affiliate System', 'Analytics Dashboard', 'Compliance Framework'], 
   'International enrollment platform for Brazilian market with agent affiliate system and comprehensive analytics portal'),
   
  ('AI Agent Ecosystem', 'Q1 2025', 'In Progress', 'High', 'AI Team', 'Product Engineering', 
   ARRAY['Claims Processing AI', 'Health Advisor AI', 'Enrollment Assistant', 'Data Pipeline', 'Training Infrastructure'], 
   'Comprehensive AI agent ecosystem for automated claims processing, health recommendations, and enrollment assistance'),
   
  ('HIPAA Compliance Overhaul', 'Q1 2025', 'In Progress', 'High', 'Security Team', 'Compliance & Security', 
   ARRAY['Vendor Security Assessment', 'Data Flow Mapping', 'Access Control Audit', 'Encryption Upgrade', 'Staff Training'], 
   'Complete HIPAA compliance assessment and remediation across all systems and processes'),
   
  ('Crypto Investment Tools', 'Q2 2025', 'Backlog', 'Medium', 'Vinnie R. Tannous', 'Fintech Innovation', 
   ARRAY['TradingView Integration', 'Pine Script Automation', 'Portfolio Management', 'Risk Assessment', 'Alert System'], 
   'Advanced cryptocurrency investment tools with automated trading strategies and risk management'),
   
  ('OwnBite Food Scanner', 'Q3 2025', 'Backlog', 'Medium', 'Product Team', 'Health Technology', 
   ARRAY['AI Image Recognition', 'Nutrition Database', 'Barcode Scanner', 'Meal Planning', 'Health Integration'], 
   'AI-powered food scanning application with comprehensive nutrition tracking and meal planning capabilities'),
   
  ('CarePilot Insurance AI', 'Q2 2025', 'Backlog', 'High', 'AI Team', 'Insurance Technology', 
   ARRAY['Modular Agent Architecture', 'Claims Processing', 'Policy Recommendations', 'Customer Service', 'Integration APIs'], 
   'Modular insurance AI platform with specialized agents for claims, policy management, and customer service'),
   
  ('Legacy System Migration', 'Q3 2025', 'Backlog', 'Medium', 'Engineering Team', 'Infrastructure', 
   ARRAY['Data Migration Strategy', 'API Modernization', 'Security Upgrade', 'Performance Optimization', 'Staff Training'], 
   'Migration of legacy PHP and jQuery systems to modern React and Node.js architecture'),
   
  ('Mobile App Development', 'Q4 2025', 'Backlog', 'Medium', 'Mobile Team', 'Product Engineering', 
   ARRAY['React Native Setup', 'Cross-platform Design', 'Offline Capabilities', 'Push Notifications', 'App Store Deployment'], 
   'Native mobile applications for iOS and Android with offline capabilities and real-time notifications');

-- Insert Projects (Current active projects with detailed information)
INSERT INTO projects (name, description, status, team, github_link, jira_link, progress) VALUES
  ('MPB Enroll (E123 Replacement)', 'Modern React-based enrollment system replacing legacy E123 platform with AI-powered features', 'Building', 
   ARRAY['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'Vinnie R. Tannous'], 
   'https://github.com/mpbhealth/mpb-enroll', 'https://mpbhealth.atlassian.net/browse/MPB-E123', 75),
   
  ('MPB Health APP Suite', 'Comprehensive member portal with modular architecture and AI agent integration', 'Building', 
   ARRAY['Emily Rodriguez', 'David Kim', 'Alex Thompson', 'Maria Garcia'], 
   'https://github.com/mpbhealth/app-suite', 'https://mpbhealth.atlassian.net/browse/MPB-APP', 60),
   
  ('SaudeMAX International Platform', 'Brazilian market enrollment system with agent affiliate program and analytics', 'Planning', 
   ARRAY['Michael Chen', 'Carlos Silva', 'Ana Rodriguez', 'Vinnie R. Tannous'], 
   'https://github.com/mpbhealth/saudemax', 'https://mpbhealth.atlassian.net/browse/SMX-001', 25),
   
  ('AI Agents for Advisors', 'Dedicated AI agents optimizing enrollment workflows and advisor productivity', 'Building', 
   ARRAY['Daniel Jimenez', 'Vandana Rathore', 'Sarah Johnson', 'Robert Wilson'], 
   'https://github.com/mpbhealth/ai-advisors', 'https://mpbhealth.atlassian.net/browse/AI-ADV', 55),
   
  ('HIPAA Compliance Audit', 'Comprehensive security assessment and remediation across all systems', 'Building', 
   ARRAY['Robert Wilson', 'David Kim', 'Maria Garcia', 'Legal Team'], 
   'https://github.com/mpbhealth/hipaa-compliance', 'https://mpbhealth.atlassian.net/browse/HIPAA-001', 80),
   
  ('Crypto Optimizer Platform', 'Advanced cryptocurrency investment tools with automated DCA and alerting', 'Planning', 
   ARRAY['Vinnie R. Tannous', 'Michael Chen', 'Trading Team'], 
   'https://github.com/mpbhealth/crypto-optimizer', 'https://mpbhealth.atlassian.net/browse/CRYPTO-001', 15),
   
  ('OwnBite Food Scanner', 'AI-powered nutrition tracking app with barcode scanning and meal planning', 'Planning', 
   ARRAY['Alex Thompson', 'Emily Rodriguez', 'Health Team'], 
   'https://github.com/mpbhealth/ownbite', 'https://mpbhealth.atlassian.net/browse/BITE-001', 10),
   
  ('CarePilot Insurance AI', 'Modular insurance AI platform with specialized agents for various insurance functions', 'Planning', 
   ARRAY['Daniel Jimenez', 'Vandana Rathore', 'Insurance Team'], 
   'https://github.com/mpbhealth/carepilot', 'https://mpbhealth.atlassian.net/browse/CARE-001', 20),
   
  ('Infrastructure Modernization', 'Migration from legacy systems to modern cloud-native architecture', 'Building', 
   ARRAY['David Kim', 'DevOps Team', 'Engineering Team'], 
   'https://github.com/mpbhealth/infrastructure', 'https://mpbhealth.atlassian.net/browse/INFRA-001', 45),
   
  ('Mobile App Development', 'Cross-platform mobile applications for member engagement and health tracking', 'Planning', 
   ARRAY['Mobile Team', 'Emily Rodriguez', 'UX Team'], 
   'https://github.com/mpbhealth/mobile-apps', 'https://mpbhealth.atlassian.net/browse/MOBILE-001', 5);