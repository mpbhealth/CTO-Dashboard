/**
 * Security Alert Service
 * 
 * Client-side service for security monitoring and alert configuration.
 * Integrates with the security-monitor Edge Function for real-time alerting.
 */

import { supabase, isSupabaseConfigured } from './supabase';

// ============================================
// Types
// ============================================

/**
 * Alert channels for notification delivery
 */
export type AlertChannel = 'slack' | 'pagerduty' | 'email' | 'webhook';

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  event_types: string[];
  threshold?: number;
  time_window_minutes?: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  enabled: boolean;
  channels: AlertChannel[];
}

/**
 * Security monitor status response
 */
export interface SecurityMonitorStatus {
  status: 'healthy' | 'warning' | 'critical';
  rules_active: number;
  last_24h: {
    total: number;
    critical: number;
    warning: number;
  };
}

/**
 * Alert trigger result
 */
export interface AlertTriggerResult {
  rule: string;
  severity: string;
  message: string;
  event_count: number;
}

/**
 * Check result from security monitor
 */
export interface SecurityCheckResult {
  success: boolean;
  checked_rules: number;
  alerts_triggered: number;
  alerts: AlertTriggerResult[];
}

// ============================================
// Default Alert Rules
// ============================================

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'failed-logins',
    name: 'Multiple Failed Login Attempts',
    description: 'Alert when 5+ failed logins occur within 15 minutes',
    event_types: ['LOGIN_FAILED'],
    threshold: 5,
    time_window_minutes: 15,
    severity: 'CRITICAL',
    enabled: true,
    channels: ['slack', 'pagerduty'],
  },
  {
    id: 'phi-bulk-export',
    name: 'PHI Bulk Export',
    description: 'Alert when more than 100 PHI records are exported',
    event_types: ['PHI_EXPORT'],
    threshold: 100,
    time_window_minutes: 60,
    severity: 'WARNING',
    enabled: true,
    channels: ['slack'],
  },
  {
    id: 'after-hours-phi',
    name: 'After-Hours PHI Access',
    description: 'Alert on PHI access outside business hours (6 PM - 8 AM)',
    event_types: ['PHI_VIEW', 'PHI_EXPORT', 'PHI_MODIFY'],
    severity: 'WARNING',
    enabled: true,
    channels: ['slack'],
  },
  {
    id: 'admin-role-change',
    name: 'Administrative Role Change',
    description: 'Alert when admin or security roles are modified',
    event_types: ['ROLE_CHANGE'],
    severity: 'INFO',
    enabled: true,
    channels: ['slack'],
  },
  {
    id: 'emergency-access',
    name: 'Emergency Access Invoked',
    description: 'Alert when break-glass emergency access is used',
    event_types: ['EMERGENCY_ACCESS'],
    severity: 'CRITICAL',
    enabled: true,
    channels: ['slack', 'pagerduty', 'email'],
  },
  {
    id: 'security-alert',
    name: 'Security Alert Triggered',
    description: 'Alert on any security alert event',
    event_types: ['SECURITY_ALERT', 'ACCESS_DENIED'],
    severity: 'CRITICAL',
    enabled: true,
    channels: ['slack', 'pagerduty'],
  },
  {
    id: 'rate-limit',
    name: 'Rate Limit Exceeded',
    description: 'Alert when rate limiting is triggered',
    event_types: ['RATE_LIMIT'],
    severity: 'CRITICAL',
    enabled: true,
    channels: ['slack', 'pagerduty'],
  },
];

// ============================================
// Security Monitor Functions
// ============================================

/**
 * Get the current security monitor status
 */
export async function getSecurityStatus(): Promise<SecurityMonitorStatus | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('security-monitor', {
      body: { action: 'status' },
    });

    if (error) throw error;
    return data as SecurityMonitorStatus;
  } catch (error) {
    console.error('[Security Alert] Failed to get status:', error);
    return null;
  }
}

/**
 * Trigger a manual security check
 */
export async function runSecurityCheck(rules?: AlertRule[]): Promise<SecurityCheckResult | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('security-monitor', {
      body: { action: 'check', rules },
    });

    if (error) throw error;
    return data as SecurityCheckResult;
  } catch (error) {
    console.error('[Security Alert] Failed to run check:', error);
    return null;
  }
}

// ============================================
// Alert Rule Management
// ============================================

/**
 * Get all alert rules from database
 */
export async function getAlertRules(): Promise<AlertRule[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_ALERT_RULES;
  }

  try {
    const { data, error } = await supabase
      .from('security_alert_rules')
      .select('*')
      .order('severity', { ascending: false });

    if (error) throw error;
    return data && data.length > 0 ? data : DEFAULT_ALERT_RULES;
  } catch (error) {
    console.error('[Security Alert] Failed to get rules:', error);
    return DEFAULT_ALERT_RULES;
  }
}

/**
 * Create or update an alert rule
 */
export async function saveAlertRule(rule: AlertRule): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('security_alert_rules')
      .upsert(rule, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Security Alert] Failed to save rule:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('security_alert_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Security Alert] Failed to delete rule:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Toggle alert rule enabled status
 */
export async function toggleAlertRule(ruleId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('security_alert_rules')
      .update({ enabled })
      .eq('id', ruleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Security Alert] Failed to toggle rule:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// Alert Channel Configuration
// ============================================

/**
 * Alert channel configuration
 */
export interface AlertChannelConfig {
  slack_webhook_url?: string;
  pagerduty_routing_key?: string;
  security_officer_email?: string;
  security_alert_webhook?: string;
}

/**
 * Get alert channel configuration
 */
export async function getAlertChannelConfig(): Promise<AlertChannelConfig> {
  if (!isSupabaseConfigured) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('compliance_settings')
      .select('key, value')
      .in('key', [
        'slack_webhook_url',
        'pagerduty_routing_key',
        'security_officer_email',
        'security_alert_webhook',
      ]);

    if (error) throw error;

    const config: AlertChannelConfig = {};
    data?.forEach((item) => {
      (config as Record<string, string>)[item.key] = item.value;
    });
    return config;
  } catch (error) {
    console.error('[Security Alert] Failed to get channel config:', error);
    return {};
  }
}

/**
 * Save alert channel configuration
 */
export async function saveAlertChannelConfig(config: AlertChannelConfig): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const entries = Object.entries(config).filter(([, value]) => value !== undefined);
    
    for (const [key, value] of entries) {
      const { error } = await supabase
        .from('compliance_settings')
        .upsert({ key, value }, { onConflict: 'key' });
      
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[Security Alert] Failed to save channel config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// Threat Level Calculation
// ============================================

/**
 * Threat level assessment
 */
export interface ThreatLevel {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

/**
 * Calculate current threat level based on recent security events
 */
export async function calculateThreatLevel(): Promise<ThreatLevel> {
  if (!isSupabaseConfigured) {
    return {
      level: 'LOW',
      score: 0,
      factors: [],
    };
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get event counts by type
    const [criticalResult, warningResult, failedLoginsResult, phiExportsResult] = await Promise.all([
      supabase
        .from('security_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('severity', 'CRITICAL')
        .gte('created_at', oneDayAgo),
      supabase
        .from('security_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('severity', 'WARNING')
        .gte('created_at', oneDayAgo),
      supabase
        .from('security_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'LOGIN_FAILED')
        .gte('created_at', oneDayAgo),
      supabase
        .from('security_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'PHI_EXPORT')
        .gte('created_at', oneDayAgo),
    ]);

    const criticalCount = criticalResult.count || 0;
    const warningCount = warningResult.count || 0;
    const failedLogins = failedLoginsResult.count || 0;
    const phiExports = phiExportsResult.count || 0;

    // Calculate threat score
    const factors: ThreatLevel['factors'] = [];
    let score = 0;

    if (criticalCount > 0) {
      const impact = Math.min(criticalCount * 15, 40);
      score += impact;
      factors.push({
        name: 'Critical Events',
        impact,
        description: `${criticalCount} critical security event(s) in the last 24 hours`,
      });
    }

    if (warningCount > 5) {
      const impact = Math.min((warningCount - 5) * 3, 20);
      score += impact;
      factors.push({
        name: 'Warning Events',
        impact,
        description: `${warningCount} warning events in the last 24 hours`,
      });
    }

    if (failedLogins > 10) {
      const impact = Math.min((failedLogins - 10) * 2, 25);
      score += impact;
      factors.push({
        name: 'Failed Login Attempts',
        impact,
        description: `${failedLogins} failed login attempts in the last 24 hours`,
      });
    }

    if (phiExports > 5) {
      const impact = Math.min((phiExports - 5) * 3, 15);
      score += impact;
      factors.push({
        name: 'PHI Exports',
        impact,
        description: `${phiExports} PHI export events in the last 24 hours`,
      });
    }

    // Determine threat level
    let level: ThreatLevel['level'];
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 40) level = 'HIGH';
    else if (score >= 20) level = 'MEDIUM';
    else level = 'LOW';

    return { level, score: Math.min(score, 100), factors };
  } catch (error) {
    console.error('[Security Alert] Failed to calculate threat level:', error);
    return {
      level: 'LOW',
      score: 0,
      factors: [],
    };
  }
}
