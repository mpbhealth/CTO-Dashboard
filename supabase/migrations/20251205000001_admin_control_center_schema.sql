-- Admin Control Center Schema for MPB Health
-- Run this in Supabase SQL Editor (CTO Dashboard database)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS (with safe creation)
DO $$ BEGIN CREATE TYPE membership_status AS ENUM ('active', 'pending', 'suspended', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE claim_status AS ENUM ('draft', 'submitted', 'under_review', 'pending_info', 'approved', 'partially_approved', 'denied', 'paid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_member', 'waiting_staff', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('info', 'warning', 'alert', 'success', 'announcement'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- MEMBER PROFILES TABLE
CREATE TABLE IF NOT EXISTS member_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    membership_number VARCHAR(50) UNIQUE NOT NULL,
    membership_status membership_status DEFAULT 'pending',
    membership_start_date DATE,
    membership_end_date DATE,
    plan_id VARCHAR(50),
    profile_photo_url TEXT,
    assigned_advisor_id UUID,
    preferred_language VARCHAR(20) DEFAULT 'en',
    communication_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
    medical_conditions TEXT[],
    allergies TEXT[],
    medications TEXT[],
    emergency_contact_consent BOOLEAN DEFAULT false,
    hipaa_consent BOOLEAN DEFAULT false,
    consent_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_profiles_membership_number ON member_profiles(membership_number);
CREATE INDEX IF NOT EXISTS idx_member_profiles_status ON member_profiles(membership_status);

-- MEMBER DEPENDENTS
CREATE TABLE IF NOT EXISTS member_dependents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    is_covered BOOLEAN DEFAULT true,
    coverage_start_date DATE,
    coverage_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMERGENCY CONTACTS
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLAIMS
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    claim_type VARCHAR(50) NOT NULL,
    status claim_status DEFAULT 'submitted',
    provider_name VARCHAR(255),
    provider_id UUID,
    patient_name VARCHAR(200),
    patient_type VARCHAR(20) DEFAULT 'member',
    dependent_id UUID REFERENCES member_dependents(id) ON DELETE SET NULL,
    service_date DATE NOT NULL,
    diagnosis_codes TEXT[],
    procedure_codes TEXT[],
    description TEXT,
    total_amount DECIMAL(12, 2) NOT NULL,
    eligible_amount DECIMAL(12, 2),
    approved_amount DECIMAL(12, 2),
    paid_amount DECIMAL(12, 2),
    member_responsibility DECIMAL(12, 2),
    denial_reason TEXT,
    processing_notes TEXT,
    priority priority_level DEFAULT 'normal',
    submitted_date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_date TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    paid_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);

-- CLAIM DOCUMENTS
CREATE TABLE IF NOT EXISTS claim_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLAIM NOTES
CREATE TABLE IF NOT EXISTS claim_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority priority_level DEFAULT 'normal',
    status ticket_status DEFAULT 'open',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- TICKET REPLIES
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    is_from_member BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES member_profiles(id) ON DELETE SET NULL,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_gateway_id VARCHAR(100),
    description TEXT,
    invoice_id UUID,
    claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
    processed_date TIMESTAMPTZ,
    receipt_url TEXT,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- BLOG ARTICLES
CREATE TABLE IF NOT EXISTS blog_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    category VARCHAR(100),
    tags TEXT[],
    meta_title VARCHAR(100),
    meta_description VARCHAR(200),
    status VARCHAR(20) DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name VARCHAR(200),
    view_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);

-- FAQ ITEMS
CREATE TABLE IF NOT EXISTS faq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_html TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category);

-- SYSTEM NOTIFICATIONS
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type DEFAULT 'info',
    channel VARCHAR(20) DEFAULT 'in_app',
    audience VARCHAR(50) DEFAULT 'all_members',
    target_user_ids UUID[],
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN ACTIONS LOG
CREATE TABLE IF NOT EXISTS admin_actions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES IF THEY EXIST, THEN CREATE NEW ONES
DROP POLICY IF EXISTS "admin_member_profiles" ON member_profiles;
DROP POLICY IF EXISTS "admin_member_dependents" ON member_dependents;
DROP POLICY IF EXISTS "admin_emergency_contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "admin_claims" ON claims;
DROP POLICY IF EXISTS "admin_claim_documents" ON claim_documents;
DROP POLICY IF EXISTS "admin_claim_notes" ON claim_notes;
DROP POLICY IF EXISTS "admin_support_tickets" ON support_tickets;
DROP POLICY IF EXISTS "admin_ticket_replies" ON ticket_replies;
DROP POLICY IF EXISTS "admin_transactions" ON transactions;
DROP POLICY IF EXISTS "admin_blog_articles" ON blog_articles;
DROP POLICY IF EXISTS "admin_faq_items" ON faq_items;
DROP POLICY IF EXISTS "admin_system_notifications" ON system_notifications;
DROP POLICY IF EXISTS "admin_system_settings" ON system_settings;
DROP POLICY IF EXISTS "admin_actions_log_policy" ON admin_actions_log;
DROP POLICY IF EXISTS "public_blog_articles" ON blog_articles;
DROP POLICY IF EXISTS "public_faq_items" ON faq_items;

-- RLS POLICIES (Admin/Staff access)
CREATE POLICY "admin_member_profiles" ON member_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_member_dependents" ON member_dependents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_emergency_contacts" ON emergency_contacts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_claims" ON claims FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_claim_documents" ON claim_documents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_claim_notes" ON claim_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_support_tickets" ON support_tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_ticket_replies" ON ticket_replies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_transactions" ON transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_blog_articles" ON blog_articles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_faq_items" ON faq_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_system_notifications" ON system_notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_system_settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);
CREATE POLICY "admin_actions_log_policy" ON admin_actions_log FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin', 'ceo', 'cto', 'staff'))
);

-- Public read for published content
CREATE POLICY "public_blog_articles" ON blog_articles FOR SELECT USING (status = 'published');
CREATE POLICY "public_faq_items" ON faq_items FOR SELECT USING (is_active = true);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first, then create
DROP TRIGGER IF EXISTS update_member_profiles_updated_at ON member_profiles;
DROP TRIGGER IF EXISTS update_member_dependents_updated_at ON member_dependents;
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON emergency_contacts;
DROP TRIGGER IF EXISTS update_claims_updated_at ON claims;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_blog_articles_updated_at ON blog_articles;
DROP TRIGGER IF EXISTS update_faq_items_updated_at ON faq_items;
DROP TRIGGER IF EXISTS update_system_notifications_updated_at ON system_notifications;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

CREATE TRIGGER update_member_profiles_updated_at BEFORE UPDATE ON member_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_dependents_updated_at BEFORE UPDATE ON member_dependents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_articles_updated_at BEFORE UPDATE ON blog_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_notifications_updated_at BEFORE UPDATE ON system_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEQUENCES FOR AUTO-NUMBERING
CREATE SEQUENCE IF NOT EXISTS claim_number_seq START 10001;
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 10001;

-- Claim number generator
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.claim_number IS NULL THEN
        NEW.claim_number := 'CLM-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('claim_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_claim_number ON claims;
CREATE TRIGGER set_claim_number BEFORE INSERT ON claims FOR EACH ROW EXECUTE FUNCTION generate_claim_number();

-- Ticket number generator
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number BEFORE INSERT ON support_tickets FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- SEED DEFAULT SETTINGS
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES 
    ('site_name', 'MPB Health', 'string', 'general', 'The name of the site'),
    ('site_description', 'Health sharing made simple', 'string', 'general', 'Site description'),
    ('support_email', 'support@mpb.health', 'string', 'general', 'Support email'),
    ('support_phone', '1-800-MPB-CARE', 'string', 'general', 'Support phone'),
    ('timezone', 'America/New_York', 'string', 'general', 'Default timezone'),
    ('maintenance_mode', 'false', 'boolean', 'general', 'Maintenance mode'),
    ('session_timeout', '3600', 'number', 'security', 'Session timeout'),
    ('max_login_attempts', '5', 'number', 'security', 'Max login attempts'),
    ('require_mfa', 'false', 'boolean', 'security', 'Require MFA'),
    ('primary_color', '#3b82f6', 'string', 'appearance', 'Primary color'),
    ('dark_mode_enabled', 'true', 'boolean', 'appearance', 'Dark mode')
ON CONFLICT (setting_key) DO NOTHING;

-- GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
