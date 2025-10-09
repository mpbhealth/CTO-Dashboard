-- =====================================================
-- Compliance Command Center - Seed Data
-- =====================================================

-- This seed script creates initial data for the HIPAA Compliance system
-- Run this after all migrations have been applied

-- Insert demo user profiles (assumes auth.users already has these users)
-- In production, profiles will be created automatically via trigger

-- Insert demo HIPAA contacts
INSERT INTO hipaa_contacts (name, role, email, phone, is_primary) VALUES
  ('Vinnie R. Tannous', 'Chief Technology Officer / HIPAA Officer', 'vinnie@mpbhealth.com', '555-0100', true),
  ('Jane Smith', 'Privacy Officer', 'privacy@mpbhealth.com', '555-0101', false),
  ('John Doe', 'Security Officer', 'security@mpbhealth.com', '555-0102', false),
  ('Sarah Johnson', 'Legal Counsel', 'legal@mpbhealth.com', '555-0103', false),
  ('Michael Chen', 'Compliance Auditor', 'auditor@mpbhealth.com', '555-0104', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample trainings
INSERT INTO hipaa_trainings (name, description, frequency, duration_minutes, is_required) VALUES
  (
    'HIPAA Fundamentals - Onboarding',
    'Comprehensive introduction to HIPAA Privacy and Security Rules for new employees',
    'onboarding',
    120,
    true
  ),
  (
    'HIPAA Annual Refresher',
    'Annual review of HIPAA requirements, recent changes, and best practices',
    'annual',
    90,
    true
  ),
  (
    'PHI Access and Minimum Necessary',
    'Training on proper PHI access procedures and minimum necessary standard',
    'annual',
    60,
    true
  ),
  (
    'Incident Response and Breach Notification',
    'How to identify, report, and respond to security incidents',
    'annual',
    75,
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample policy documents
INSERT INTO hipaa_docs (section, title, slug, content_md, status, owner, revision) VALUES
  (
    'administration',
    'HIPAA Privacy Officer Designation',
    'privacy-officer-designation',
    '# HIPAA Privacy Officer Designation

## Purpose
This document formally designates the HIPAA Privacy Officer for MPB Health and outlines their responsibilities.

## Designation
Effective as of the date below, **Vinnie R. Tannous** is designated as the HIPAA Privacy Officer for MPB Health.

## Responsibilities
- Develop and implement privacy policies and procedures
- Conduct privacy impact assessments
- Oversee training programs
- Investigate privacy complaints
- Maintain documentation
- Serve as point of contact for privacy matters

## Authority
The Privacy Officer has the authority to take actions necessary to ensure compliance with HIPAA Privacy Rule requirements.

**Effective Date:** January 1, 2025',
    'approved',
    (SELECT id FROM auth.users LIMIT 1),
    1
  ),
  (
    'administration',
    'HIPAA Security Officer Designation',
    'security-officer-designation',
    '# HIPAA Security Officer Designation

## Purpose
This document formally designates the HIPAA Security Officer for MPB Health.

## Designation
**Vinnie R. Tannous** is designated as the HIPAA Security Officer for MPB Health.

## Responsibilities
- Develop and implement security policies
- Conduct risk assessments
- Manage security incidents
- Oversee access controls
- Monitor security measures
- Report security matters to leadership

**Effective Date:** January 1, 2025',
    'approved',
    (SELECT id FROM auth.users LIMIT 1),
    1
  ),
  (
    'technical',
    'Encryption Policy',
    'encryption-policy',
    '# Encryption Policy

## Scope
All electronic Protected Health Information (ePHI) must be encrypted both at rest and in transit.

## Requirements

### Data at Rest
- Database encryption using AES-256
- Full disk encryption on all servers
- Encrypted backups

### Data in Transit
- TLS 1.2 or higher for all web traffic
- VPN for remote access
- Secure file transfer protocols only

### Key Management
- Centralized key management system
- Regular key rotation (minimum annually)
- Secure key storage

## Compliance
Non-compliance will be addressed through corrective action plans.

**Last Updated:** January 1, 2025',
    'approved',
    (SELECT id FROM auth.users LIMIT 1),
    1
  )
ON CONFLICT (slug) DO NOTHING;

-- Link policies to the policy registry
INSERT INTO hipaa_policies (doc_id, policy_number, category, next_review_date, review_frequency_months, owner)
SELECT 
  id,
  'POL-' || LPAD((ROW_NUMBER() OVER ())::text, 3, '0'),
  CASE section
    WHEN 'administration' THEN 'Administrative'
    WHEN 'technical' THEN 'Technical'
    WHEN 'training' THEN 'Organizational'
    ELSE 'Privacy Rule'
  END,
  CURRENT_DATE + INTERVAL '12 months',
  12,
  owner
FROM hipaa_docs
WHERE slug IN ('privacy-officer-designation', 'security-officer-designation', 'encryption-policy')
ON CONFLICT (doc_id) DO NOTHING;

-- Insert sample BAAs
INSERT INTO hipaa_baas (
  vendor, 
  services_provided, 
  effective_date, 
  renewal_date, 
  status,
  contact_email,
  auto_renews
) VALUES
  (
    'AWS (Amazon Web Services)',
    'Cloud hosting and infrastructure services',
    '2024-01-01',
    '2025-12-31',
    'active',
    'aws-compliance@amazon.com',
    true
  ),
  (
    'Supabase',
    'Database and authentication services',
    '2024-06-01',
    '2025-05-31',
    'active',
    'support@supabase.io',
    true
  ),
  (
    'Twilio',
    'SMS and communication services',
    '2024-03-15',
    '2025-03-14',
    'active',
    'compliance@twilio.com',
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample risk register
INSERT INTO hipaa_risks (title, description, likelihood, impact, category, status, target_date) VALUES
  (
    'Unauthorized PHI Access',
    'Risk of unauthorized employees accessing PHI beyond minimum necessary requirements',
    3,
    4,
    'Access Control',
    'mitigating',
    CURRENT_DATE + INTERVAL '90 days'
  ),
  (
    'Data Breach via Third Party',
    'Risk of PHI breach through business associate systems',
    2,
    5,
    'Business Associate',
    'mitigating',
    CURRENT_DATE + INTERVAL '180 days'
  ),
  (
    'Ransomware Attack',
    'Risk of ransomware encrypting ePHI and disrupting operations',
    3,
    5,
    'Cybersecurity',
    'open',
    CURRENT_DATE + INTERVAL '60 days'
  )
ON CONFLICT DO NOTHING;

-- Insert mitigations for risks
INSERT INTO hipaa_mitigations (risk_id, action, due_date, done)
SELECT 
  id,
  'Implement role-based access controls (RBAC)',
  CURRENT_DATE + INTERVAL '30 days',
  false
FROM hipaa_risks
WHERE title = 'Unauthorized PHI Access'
ON CONFLICT DO NOTHING;

INSERT INTO hipaa_mitigations (risk_id, action, due_date, done)
SELECT 
  id,
  'Review and update all business associate agreements',
  CURRENT_DATE + INTERVAL '60 days',
  false
FROM hipaa_risks
WHERE title = 'Data Breach via Third Party'
ON CONFLICT DO NOTHING;

INSERT INTO hipaa_mitigations (risk_id, action, due_date, done)
SELECT 
  id,
  'Deploy endpoint detection and response (EDR) solution',
  CURRENT_DATE + INTERVAL '45 days',
  false
FROM hipaa_risks
WHERE title = 'Ransomware Attack'
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO hipaa_tasks (title, description, section, status, priority, due_date)
VALUES
  (
    'Complete Q1 Risk Assessment',
    'Conduct quarterly risk assessment per HIPAA Security Rule requirements',
    'audits',
    'todo',
    'high',
    CURRENT_DATE + INTERVAL '30 days'
  ),
  (
    'Update Employee Handbook - HIPAA Section',
    'Revise HIPAA policies in employee handbook based on recent guidance',
    'administration',
    'in_progress',
    'medium',
    CURRENT_DATE + INTERVAL '45 days'
  ),
  (
    'Schedule Annual Security Training',
    'Coordinate annual HIPAA security awareness training for all staff',
    'training',
    'todo',
    'high',
    CURRENT_DATE + INTERVAL '60 days'
  ),
  (
    'Review Access Control Lists',
    'Audit current PHI access permissions and update as needed',
    'phi-minimum',
    'todo',
    'medium',
    CURRENT_DATE + INTERVAL '90 days'
  )
ON CONFLICT DO NOTHING;

-- Insert sample audit
INSERT INTO hipaa_audits (kind, title, description, period_start, period_end, status)
VALUES
  (
    'internal',
    '2024 Internal HIPAA Compliance Audit',
    'Comprehensive internal audit of HIPAA Privacy and Security Rule compliance',
    '2024-11-01',
    '2024-12-31',
    'completed'
  ),
  (
    'vulnerability',
    'Q1 2025 Vulnerability Assessment',
    'Quarterly vulnerability scan and penetration testing',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    'in-progress'
  )
ON CONFLICT DO NOTHING;

-- Create initial audit log entry
INSERT INTO hipaa_audit_log (actor, actor_email, action, details)
VALUES
  (NULL, 'system', 'compliance_system_initialized', '{"message": "HIPAA Compliance Command Center initialized with seed data"}')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Compliance Command Center seed data has been successfully inserted!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created:';
  RAISE NOTICE '   - 5 Compliance Contacts';
  RAISE NOTICE '   - 4 Training Programs';
  RAISE NOTICE '   - 3 Policy Documents';
  RAISE NOTICE '   - 3 Business Associate Agreements';
  RAISE NOTICE '   - 3 Risk Register Entries';
  RAISE NOTICE '   - 4 Compliance Tasks';
  RAISE NOTICE '   - 2 Audit Records';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 You can now access the Compliance Command Center!';
END $$;

