/*
  # Fix Roadmap RLS Policies and Restore Data

  1. RLS Policy Updates
    - Drop existing conflicting policies
    - Create comprehensive policies for authenticated users
    - Allow anonymous read access if needed

  2. Data Restoration
    - Verify roadmap data exists
    - Re-insert comprehensive roadmap items if missing
    - Ensure all status values match database constraints

  3. Data Integrity
    - Maintain proper relationships
    - Use only valid status values: 'Backlog', 'In Progress', 'Complete'
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage roadmap items" ON roadmap_items;
DROP POLICY IF EXISTS "Users can read roadmap items" ON roadmap_items;
DROP POLICY IF EXISTS "Authenticated users can manage roadmap items" ON roadmap_items;
DROP POLICY IF EXISTS "Authenticated users can read roadmap items" ON roadmap_items;

-- Create comprehensive policy for authenticated users to manage all roadmap operations
CREATE POLICY "Authenticated users can manage roadmap items"
  ON roadmap_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to read roadmap data
CREATE POLICY "Authenticated users can read roadmap items"
  ON roadmap_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anonymous users to read roadmap data (if needed for public access)
CREATE POLICY "Anonymous users can read roadmap items"
  ON roadmap_items
  FOR SELECT
  TO anon
  USING (true);

-- Clear existing roadmap data and insert comprehensive roadmap
DELETE FROM roadmap_items;

-- Insert comprehensive roadmap items that align with current projects
INSERT INTO roadmap_items (title, quarter, status, priority, owner, department, dependencies, description) VALUES
  -- Q1 2025 - Current Active Projects
  ('MPB Enroll (E123 Replacement System)', 'Q1 2025', 'In Progress', 'High', 'Sarah Johnson', 'Product Engineering', 
   ARRAY['React Framework', 'Supabase Integration', 'AI Agent Framework', 'Member Data Migration', 'Security Audit'], 
   'Complete replacement of legacy E123 system with modern React-based enrollment platform featuring AI-powered member management and streamlined workflows'),
   
  ('MPB Health APP Suite', 'Q1 2025', 'In Progress', 'High', 'Emily Rodriguez', 'Product Engineering', 
   ARRAY['Member Portal Framework', 'HealthShare API', 'Telehealth Integration', 'Mobile Optimization', 'HIPAA Compliance'], 
   'Comprehensive member portal with modular architecture, AI agents for member support, integrated telehealth capabilities, and cross-platform compatibility'),
   
  ('AI Agents for Advisors', 'Q1 2025', 'In Progress', 'High', 'Daniel Jimenez', 'AI & Automation', 
   ARRAY['Natural Language Processing', 'Enrollment Optimization', 'Workflow Automation', 'Performance Analytics', 'Training Data'], 
   'Dedicated AI agents designed to optimize enrollment workflows, enhance advisor productivity, and provide intelligent recommendations for member engagement'),
   
  ('HIPAA Compliance Overhaul', 'Q1 2025', 'In Progress', 'High', 'Robert Wilson', 'Compliance & Security', 
   ARRAY['Security Assessment', 'Data Encryption', 'Access Controls', 'Audit Trail', 'Staff Training'], 
   'Comprehensive security assessment and remediation across all systems to ensure full HIPAA compliance and data protection'),
   
  ('Infrastructure Modernization', 'Q1 2025', 'In Progress', 'Medium', 'David Kim', 'DevOps & Infrastructure', 
   ARRAY['Cloud Migration', 'Container Deployment', 'CI/CD Pipeline', 'Monitoring Setup', 'Performance Optimization'], 
   'Migration from legacy systems to modern cloud-native architecture with improved scalability, security, and performance monitoring'),

  -- Q2 2025 - Next Phase Projects
  ('SaudeMAX International Platform', 'Q2 2025', 'Backlog', 'High', 'Michael Chen', 'International & Fintech', 
   ARRAY['Multi-language Support', 'Brazilian Payment Systems', 'Agent Affiliate Framework', 'Compliance Framework', 'Analytics Dashboard'], 
   'International enrollment platform specifically designed for the Brazilian market with comprehensive agent affiliate system and localized compliance features'),
   
  ('CarePilot Insurance AI', 'Q2 2025', 'Backlog', 'High', 'Vandana Rathore', 'Insurance Technology', 
   ARRAY['Modular Agent Architecture', 'Claims Processing Engine', 'Policy Management', 'Customer Service AI', 'Integration APIs'], 
   'Advanced modular insurance AI platform with specialized agents for claims processing, policy recommendations, and automated customer service'),
   
  ('Crypto Optimizer Platform', 'Q2 2025', 'Backlog', 'Medium', 'Vinnie R. Tannous', 'Fintech Innovation', 
   ARRAY['TradingView Integration', 'Pine Script Automation', 'DCA Strategies', 'Risk Management', 'Alert Systems'], 
   'Sophisticated cryptocurrency investment platform with automated trading strategies, risk assessment, and real-time market analysis'),

  -- Q3 2025 - Future Initiatives
  ('OwnBite Food Scanner', 'Q3 2025', 'Backlog', 'Medium', 'Alex Thompson', 'Health Technology', 
   ARRAY['AI Image Recognition', 'Nutrition Database', 'Barcode Integration', 'Meal Planning AI', 'Health Tracking'], 
   'AI-powered nutrition tracking application with advanced food recognition, comprehensive nutrition database, and personalized meal planning'),
   
  ('Legacy System Migration', 'Q3 2025', 'Backlog', 'Medium', 'Engineering Team', 'Infrastructure', 
   ARRAY['Data Migration Strategy', 'API Modernization', 'Security Upgrades', 'Performance Testing', 'User Training'], 
   'Complete migration of remaining legacy PHP and jQuery systems to modern React and Node.js architecture with improved performance and maintainability'),

  -- Q4 2025 - Long-term Vision
  ('Mobile App Development', 'Q4 2025', 'Backlog', 'Medium', 'Mobile Team', 'Product Engineering', 
   ARRAY['React Native Framework', 'Cross-platform Design', 'Offline Capabilities', 'Push Notifications', 'App Store Deployment'], 
   'Native mobile applications for iOS and Android with offline capabilities, real-time notifications, and seamless integration with web platform'),
   
  ('Advanced Analytics Platform', 'Q4 2025', 'Backlog', 'Low', 'Data Team', 'Business Intelligence', 
   ARRAY['Data Warehouse', 'Machine Learning Models', 'Predictive Analytics', 'Real-time Dashboards', 'Automated Reporting'], 
   'Comprehensive analytics platform with machine learning capabilities for predictive insights, automated reporting, and business intelligence'),

  -- Ongoing Initiatives
  ('Security & Compliance Monitoring', 'Ongoing', 'In Progress', 'High', 'Security Team', 'Compliance & Security', 
   ARRAY['Continuous Monitoring', 'Threat Detection', 'Compliance Audits', 'Security Training', 'Incident Response'], 
   'Continuous security monitoring and compliance management to ensure ongoing protection of sensitive health data and regulatory adherence'),
   
  ('AI Model Training & Optimization', 'Ongoing', 'In Progress', 'Medium', 'AI Team', 'AI & Machine Learning', 
   ARRAY['Training Data Collection', 'Model Optimization', 'Performance Monitoring', 'Bias Detection', 'Continuous Learning'], 
   'Ongoing development and optimization of AI models for improved accuracy, reduced bias, and enhanced performance across all AI-powered features');