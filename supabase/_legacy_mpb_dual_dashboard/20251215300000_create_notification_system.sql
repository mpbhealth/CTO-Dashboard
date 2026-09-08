-- ============================================
-- CTO Dashboard Notification System
-- Migration: Create notifications and preferences tables
-- ============================================

-- 1. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification type toggles
    critical_alerts BOOLEAN NOT NULL DEFAULT true,
    sla_breaches BOOLEAN NOT NULL DEFAULT true,
    system_incidents BOOLEAN NOT NULL DEFAULT true,
    assignments BOOLEAN NOT NULL DEFAULT true,
    project_updates BOOLEAN NOT NULL DEFAULT true,
    compliance_alerts BOOLEAN NOT NULL DEFAULT true,
    deployment_alerts BOOLEAN NOT NULL DEFAULT true,
    
    -- Sound settings
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Do Not Disturb settings
    dnd_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    
    -- Critical alerts can bypass DND
    critical_bypass_dnd BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one preference record per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification content
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'system_incident',
        'deployment_failed',
        'assignment',
        'project_update',
        'compliance_alert',
        'sla_breach',
        'ticket_escalation',
        'general'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (priority IN ('critical', 'high', 'info')),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    
    -- Navigation and action data (JSON)
    data JSONB DEFAULT '{}',
    
    -- Status
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    
    -- Source reference (optional)
    source_table VARCHAR(100),
    source_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 4. Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for notification_preferences
-- Users can read their own preferences
CREATE POLICY "Users can read own notification preferences"
    ON notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
    ON notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policies for notifications
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
    ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System/service role can insert notifications for any user
CREATE POLICY "Service role can insert notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Auto-update timestamp trigger for preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- 8. Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when a new user signs up
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON auth.users;
CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- 9. Function to clean up old notifications (30-day retention, 90 days for critical)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete non-critical notifications older than 30 days
    DELETE FROM notifications
    WHERE created_at < now() - INTERVAL '30 days'
    AND priority != 'critical';
    
    -- Delete critical notifications older than 90 days
    DELETE FROM notifications
    WHERE created_at < now() - INTERVAL '90 days'
    AND priority = 'critical';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;
GRANT INSERT ON notifications TO service_role;

-- 11. Comment documentation
COMMENT ON TABLE notification_preferences IS 'User notification preferences for the CTO/CEO dashboard notification system';
COMMENT ON TABLE notifications IS 'Notification history for dashboard users with support for different priority levels and types';
COMMENT ON COLUMN notifications.data IS 'JSON object containing navigation URL and action-specific data';
COMMENT ON COLUMN notifications.source_table IS 'The source table that triggered this notification (e.g., api_incidents, assignments)';
COMMENT ON COLUMN notifications.source_id IS 'The ID of the record in the source table that triggered this notification';

