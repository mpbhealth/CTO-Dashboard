/*
  # Add Technology Stack Data

  1. Data Population
    - Add comprehensive technology stack items
    - Include various categories and statuses
    - Represent current MPB Health tech stack

  2. Technologies Added
    - Frontend frameworks and tools
    - Backend services and databases
    - DevOps and infrastructure
    - AI and automation tools
    - Legacy systems marked for deprecation
*/

-- Insert comprehensive technology stack data
INSERT INTO tech_stack (name, category, version, owner, status, notes) VALUES
  -- Frontend Technologies
  ('React', 'Frontend Framework', '18.3.1', 'Frontend Team', 'Active', 'Primary UI framework for all web applications'),
  ('TypeScript', 'Frontend Language', '5.5.3', 'Frontend Team', 'Active', 'Type-safe JavaScript for better development experience'),
  ('Tailwind CSS', 'Frontend Styling', '3.4.1', 'Frontend Team', 'Active', 'Utility-first CSS framework for rapid UI development'),
  ('Vite', 'Frontend Build Tool', '5.4.2', 'Frontend Team', 'Active', 'Fast build tool and development server'),
  ('Next.js', 'Frontend Framework', '14.0.0', 'Frontend Team', 'Experimental', 'React framework for production applications'),
  
  -- Backend Technologies
  ('Supabase', 'Backend as a Service', '2.39.0', 'Backend Team', 'Active', 'Primary database and authentication provider'),
  ('PostgreSQL', 'Database', '15.0', 'Backend Team', 'Active', 'Primary relational database system'),
  ('Node.js', 'Backend Runtime', '20.0.0', 'Backend Team', 'Active', 'JavaScript runtime for server-side applications'),
  ('Express.js', 'Backend Framework', '4.18.2', 'Backend Team', 'Active', 'Web application framework for Node.js'),
  
  -- DevOps & Infrastructure
  ('GitHub Actions', 'CI/CD', '4.0', 'DevOps Team', 'Active', 'Continuous integration and deployment pipeline'),
  ('Docker', 'Containerization', '24.0', 'DevOps Team', 'Active', 'Application containerization platform'),
  ('Netlify', 'Hosting Platform', '1.0', 'DevOps Team', 'Active', 'Static site hosting and deployment'),
  ('Vercel', 'Hosting Platform', '1.0', 'DevOps Team', 'Experimental', 'Edge deployment platform for frontend apps'),
  
  -- Content Management
  ('WordPress', 'CMS', '6.4.2', 'Content Team', 'Active', 'Main website and blog content management'),
  ('Strapi', 'Headless CMS', '4.15.0', 'Content Team', 'Experimental', 'API-first content management system'),
  
  -- AI & Automation
  ('OpenAI API', 'AI Service', '4.0', 'AI Team', 'Active', 'Large language model API for AI agents'),
  ('n8n', 'Workflow Automation', '1.0', 'Automation Team', 'Active', 'Self-hosted workflow automation platform'),
  ('Zapier', 'Automation Platform', '1.0', 'Operations Team', 'Active', 'Cloud-based automation service'),
  
  -- Forms & Data Collection
  ('JotForm', 'Form Builder', '2024.1', 'Operations Team', 'Active', 'Form builder with AI agent integration'),
  ('Typeform', 'Form Platform', '1.0', 'Marketing Team', 'Experimental', 'Interactive form and survey platform'),
  
  -- Financial & Trading
  ('TradingView', 'Trading Platform', 'v5', 'Vinnie R. Tannous', 'Active', 'Market analysis and Pine Script automation'),
  ('Pine Script', 'Trading Language', 'v5', 'Vinnie R. Tannous', 'Active', 'TradingView scripting for automated trading'),
  ('Stripe', 'Payment Processing', '2024.1', 'Finance Team', 'Active', 'Payment processing and subscription management'),
  
  -- Monitoring & Analytics
  ('Google Analytics', 'Web Analytics', '4.0', 'Marketing Team', 'Active', 'Website traffic and user behavior analytics'),
  ('Sentry', 'Error Monitoring', '7.0', 'DevOps Team', 'Active', 'Application error tracking and performance monitoring'),
  ('Uptime Robot', 'Uptime Monitoring', '1.0', 'DevOps Team', 'Active', 'Website and API uptime monitoring'),
  
  -- Communication & Collaboration
  ('Slack', 'Team Communication', '1.0', 'All Teams', 'Active', 'Internal team communication and collaboration'),
  ('Zoom', 'Video Conferencing', '1.0', 'All Teams', 'Active', 'Video meetings and webinars'),
  ('Notion', 'Documentation', '1.0', 'All Teams', 'Active', 'Team documentation and knowledge management'),
  
  -- Legacy Systems (Deprecated)
  ('jQuery', 'Frontend Library', '3.6.0', 'Legacy Team', 'Deprecated', 'Scheduled for removal Q2 2025'),
  ('PHP', 'Backend Language', '8.2', 'Legacy Team', 'Deprecated', 'Being phased out in favor of Node.js'),
  ('MySQL', 'Database', '8.0', 'Legacy Team', 'Deprecated', 'Migrating to PostgreSQL'),
  ('Apache', 'Web Server', '2.4', 'Legacy Team', 'Deprecated', 'Replaced by modern hosting solutions');