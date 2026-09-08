-- Insert KPI Data
INSERT INTO kpi_data (title, value, change, trend) VALUES
  ('MRR', '$487K', '+12.3%', 'up'),
  ('Burn Rate', '$89K/mo', '-5.2%', 'down'),
  ('Active Projects', '14', '+2', 'up'),
  ('System Uptime', '99.97%', '+0.02%', 'up');

-- Insert Tech Stack
INSERT INTO tech_stack (name, category, version, owner, status, notes) VALUES
  ('React', 'Frontend', '18.3.1', 'Frontend Team', 'Active', 'Primary UI framework for all web applications'),
  ('Supabase', 'Backend', '2.38.0', 'Backend Team', 'Active', 'Database and authentication provider'),
  ('WordPress', 'CMS', '6.4.2', 'Content Team', 'Active', 'Main website and blog platform'),
  ('Pine Script', 'Trading', 'v5', 'Vinnie R. Tannous', 'Active', 'TradingView automation and alerts'),
  ('jQuery', 'Frontend', '3.6.0', 'Legacy Team', 'Deprecated', 'Scheduled for removal Q2 2025');

-- Insert Roadmap Items (Fixed status values to match check constraint)
INSERT INTO roadmap_items (title, quarter, status, priority, owner, department, dependencies, description) VALUES
  ('MPB Enroll (E123 Replacement System)', 'Q3 2025', 'In Progress', 'High', 'Development Team', 'Product', 
   ARRAY['React Full Enrollment System', 'MPB Database', 'Web Version', 'Mobile App'], 
   'Member Management System AI powered Enrollment Suite'),
  ('MPB Health APP Suite', 'Q3 2025', 'Complete', 'High', 'Development Team', 'MPB IT', 
   ARRAY['Member Portal Framework', 'HealthShare Access', 'Telehealth', 'Compliance Review'], 
   'Modular Member Portal with AI agents for member support'),
  ('SaudeMAX', 'Q3 2025', 'In Progress', 'High', 'Development Team', 'MPB IT, Fintech', 
   ARRAY['React Full Enrollment System', 'MPB / SaudeMAX Database', 'Web Version', 'Mobile App'], 
   'Enrollment System with Agent Affiliate System and Analytics Portal'),
  ('HIPAA Compliance Audit', 'Q3 2025', 'In Progress', 'High', 'Security Team', 'Compliance', 
   ARRAY['Vendor Assessment', 'Data Flow Mapping'], 
   'Complete HIPAA compliance assessment and remediation');

-- Insert Projects
INSERT INTO projects (name, description, status, team, github_link, jira_link, progress) VALUES
  ('MPB Enroll (E123 Replacement System)', 'Member Management System AI powered Enrollment Suite', 'Building', 
   ARRAY['Development Team', 'MPB IT', 'Product Team'], 
   'https://github.com/mpbhealth/mpb-enroll', 'https://mpbhealth.atlassian.net/browse/MPB-E123', 75),
  ('MPB Health APP Suite', 'Modular Member Portal with AI agents for member support', 'Planning', 
   ARRAY['Development Team', 'MPB IT', 'UX Team'], 
   'https://github.com/mpbhealth/app-suite', 'https://mpbhealth.atlassian.net/browse/MPB-APP', 25),
  ('SaudeMAX', 'Enrollment System with Agent Affiliate System and Analytics Portal', 'Building', 
   ARRAY['Development Team', 'MPB IT', 'Fintech Team'], 
   'https://github.com/mpbhealth/saudemax', 'https://mpbhealth.atlassian.net/browse/SMX-001', 60),
  ('AI Agents for Advisors', 'Dedicated AI Agent For Advisors to Optimize Enrollments and Workflow', 'Building', 
   ARRAY['Daniel Jimenez', 'Vandana Rathore', 'MPB IT'], 
   'https://github.com/mpbhealth/ai-advisors', 'https://mpbhealth.atlassian.net/browse/AI-ADV', 45),
  ('HIPAA Compliance Audit', 'Complete HIPAA compliance assessment and remediation', 'Building', 
   ARRAY['Security Team', 'Compliance Team', 'Legal Team'], 
   'https://github.com/mpbhealth/hipaa-compliance', 'https://mpbhealth.atlassian.net/browse/HIPAA-001', 80);

-- Insert Vendors
INSERT INTO vendors (name, category, cost, billing_cycle, renewal_date, owner, justification) VALUES
  ('Supabase', 'Database', 299, 'Monthly', '2025-02-15', 'Vinnie R. Tannous', 'Primary database and auth provider for all applications'),
  ('GitHub Enterprise', 'DevOps', 2400, 'Yearly', '2025-08-30', 'Engineering Team', 'Code repository and CI/CD pipeline management'),
  ('TradingView', 'Fintech', 59, 'Monthly', '2025-01-20', 'Vinnie R. Tannous', 'Market data and Pine Script automation platform'),
  ('JotForm Enterprise', 'Forms', 199, 'Monthly', '2025-03-10', 'Operations Team', 'Form builder with AI agent integration');

-- Insert AI Agents
INSERT INTO ai_agents (name, role, status, prompt, dataset_refs, environment, last_updated) VALUES
  ('Claims Assistant', 'Insurance Claims Processing', 'Live', 
   'You are a helpful insurance claims assistant. Help members understand their coverage and guide them through the claims process with empathy and accuracy.', 
   ARRAY['insurance_policies', 'claims_history', 'member_data'], 'Production', '2024-12-15'),
  ('Health Advisor', 'Personalized Health Recommendations', 'Live', 
   'You are a certified health advisor AI. Provide personalized health recommendations based on member data while being careful not to provide medical advice.', 
   ARRAY['health_profiles', 'nutrition_data', 'wellness_plans'], 'Production', '2024-12-10'),
  ('Enrollment Bot', 'Member Enrollment Support', 'Inactive', 
   'Help new members complete their enrollment process smoothly. Guide them through plan selection and answer questions about benefits.', 
   ARRAY['plan_details', 'enrollment_flows', 'faq_data'], 'Staging', '2024-11-28');

-- Insert API Statuses
INSERT INTO api_statuses (name, url, status, last_checked, response_time) VALUES
  ('MPB Core API', 'https://api.mpbhealth.com/v1', 'Healthy', '2024-12-20T10:30:00Z', 142),
  ('E123 API', 'https://api.e123.com/v1', 'Healthy', '2024-12-20T10:29:00Z', 89),
  ('MPB Health APP API', 'https://api.mpbhealthapp.com/v1', 'Warning', '2024-12-20T10:28:00Z', 2341),
  ('SaudeMAX System API', 'https://api.saudemax.com/v1', 'Down', '2024-12-20T10:25:00Z', 0);

-- Insert Deployment Logs
INSERT INTO deployment_logs (project, env, timestamp, status, log) VALUES
  ('MPB App', 'Production', '2024-12-20T09:15:00Z', 'Success', 'Deployment completed successfully. All health checks passed.'),
  ('E123', 'Staging', '2024-12-20T08:45:00Z', 'Success', 'Staging deployment completed. Ready for QA testing.'),
  ('MPB Health APP', 'Production', '2024-12-19T16:30:00Z', 'Failed', 'Deployment failed: Database migration timeout. Rolling back changes.'),
  ('Crypto Optimizer', 'Production', '2024-12-19T14:20:00Z', 'Success', 'Hot fix deployed successfully. API performance improved by 34%.');