-- ============================================
-- DATA EXPORT SCRIPT FOR OLD DATABASE
-- Run this in your OLD database SQL Editor
-- Copy results and save as CSV files
-- ============================================

-- ============================================
-- STEP 1: EXPORT USERS
-- ============================================
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM users
ORDER BY created_at;

-- Save as: users.csv
-- ============================================

-- ============================================
-- STEP 2: EXPORT DEPARTMENTS
-- ============================================
SELECT 
    id,
    name,
    description,
    budget,
    manager_id,
    created_at
FROM departments
ORDER BY name;

-- Save as: departments.csv
-- ============================================

-- ============================================
-- STEP 3: EXPORT EMPLOYEE PROFILES
-- ============================================
SELECT 
    id,
    user_id,
    department_id,
    position,
    start_date,
    employee_number,
    phone,
    office_location,
    created_at
FROM employee_profiles
ORDER BY created_at;

-- Save as: employee_profiles.csv
-- ============================================

-- ============================================
-- STEP 4: EXPORT TEAM MEMBERS
-- ============================================
SELECT 
    id,
    name,
    role,
    email,
    status,
    department,
    avatar_url,
    joined_date,
    skills,
    linkedin,
    github,
    created_at
FROM team_members
ORDER BY created_at;

-- Save as: team_members.csv
-- ============================================

-- ============================================
-- STEP 5: EXPORT PROJECTS
-- ============================================
SELECT 
    id,
    name,
    description,
    status,
    progress,
    start_date,
    end_date,
    budget,
    department_id,
    lead_id,
    priority,
    created_at,
    updated_at
FROM projects
ORDER BY created_at;

-- Save as: projects.csv
-- ============================================

-- ============================================
-- STEP 6: EXPORT ASSIGNMENTS
-- ============================================
SELECT 
    id,
    title,
    description,
    assigned_to,
    project_id,
    status,
    due_date,
    created_at,
    updated_at
FROM assignments
ORDER BY created_at;

-- Save as: assignments.csv
-- ============================================

-- ============================================
-- STEP 7: EXPORT KPI DATA
-- ============================================
SELECT 
    id,
    metric_name,
    current_value,
    previous_value,
    target_value,
    unit,
    category,
    trend,
    date_recorded,
    created_at
FROM kpi_data
ORDER BY date_recorded DESC;

-- Save as: kpi_data.csv
-- ============================================

-- ============================================
-- STEP 8: EXPORT TECHNOLOGIES
-- ============================================
SELECT 
    id,
    name,
    category,
    status,
    version,
    owner_id,
    cost_per_month,
    renewal_date,
    description,
    documentation_url,
    created_at
FROM technologies
ORDER BY name;

-- Save as: technologies.csv
-- ============================================

-- ============================================
-- STEP 9: EXPORT SAAS EXPENSES
-- ============================================
SELECT 
    id,
    tool_name,
    category,
    monthly_cost,
    annual_cost,
    renewal_date,
    department_id,
    owner_id,
    status,
    description,
    created_at
FROM saas_expenses
ORDER BY monthly_cost DESC;

-- Save as: saas_expenses.csv
-- ============================================

-- ============================================
-- STEP 10: EXPORT POLICY DOCUMENTS
-- ============================================
SELECT 
    id,
    title,
    description,
    content,
    category,
    status,
    version,
    effective_date,
    review_date,
    owner_id,
    created_at,
    updated_at
FROM policy_documents
ORDER BY created_at;

-- Save as: policy_documents.csv
-- ============================================

-- ============================================
-- STEP 11: EXPORT HIPAA AUDITS
-- ============================================
SELECT 
    id,
    title,
    kind,
    status,
    period_start,
    period_end,
    auditor_name,
    auditor_org,
    description,
    findings_summary,
    report_url,
    cap_md,
    created_at,
    updated_at
FROM hipaa_audits
ORDER BY period_start DESC;

-- Save as: hipaa_audits.csv
-- ============================================

-- ============================================
-- STEP 12: EXPORT HIPAA BAA REGISTRY
-- ============================================
SELECT 
    id,
    vendor_name,
    contact_email,
    contact_phone,
    service_description,
    baa_signed_date,
    baa_expiration_date,
    baa_document_url,
    status,
    risk_level,
    notes,
    created_at,
    updated_at
FROM hipaa_baa_registry
ORDER BY vendor_name;

-- Save as: hipaa_baa_registry.csv
-- ============================================

-- ============================================
-- STEP 13: EXPORT ENROLLMENT DATA
-- ============================================
SELECT 
    id,
    enrollment_id,
    member_name,
    member_dob,
    enrollment_date,
    plan_type,
    status,
    agent_id,
    monthly_premium,
    commission_amount,
    source,
    notes,
    created_at
FROM enrollment_data
ORDER BY enrollment_date DESC;

-- Save as: enrollment_data.csv
-- ============================================

-- ============================================
-- EXPORT SUMMARY
-- ============================================
SELECT 
    'EXPORT SUMMARY' as info,
    '---' as separator;

SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'employee_profiles', COUNT(*) FROM employee_profiles
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'kpi_data', COUNT(*) FROM kpi_data
UNION ALL
SELECT 'technologies', COUNT(*) FROM technologies
UNION ALL
SELECT 'saas_expenses', COUNT(*) FROM saas_expenses
UNION ALL
SELECT 'policy_documents', COUNT(*) FROM policy_documents
UNION ALL
SELECT 'hipaa_audits', COUNT(*) FROM hipaa_audits
UNION ALL
SELECT 'hipaa_baa_registry', COUNT(*) FROM hipaa_baa_registry
UNION ALL
SELECT 'enrollment_data', COUNT(*) FROM enrollment_data
ORDER BY record_count DESC;

-- ============================================
-- INSTRUCTIONS:
-- 1. Run each SELECT statement separately
-- 2. Export results as CSV
-- 3. Save with the filename indicated
-- 4. Keep all CSVs in a folder called "database-export"
-- 5. Import these CSVs to new database in order
-- ============================================

