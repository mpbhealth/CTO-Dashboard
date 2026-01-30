/**
 * Security Monitor Edge Function
 * 
 * Real-time security monitoring and alerting for SOC 2 Type II and HIPAA compliance.
 * 
 * Features:
 * - Monitor security audit logs for anomalies
 * - Trigger alerts based on configurable rules
 * - Send notifications to multiple channels (Slack, PagerDuty, email, webhook)
 * - Rate limiting detection
 * - After-hours access monitoring
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alert rule types
interface AlertRule {
  id: string;
  name: string;
  description: string;
  event_types: string[];
  threshold?: number;
  time_window_minutes?: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  enabled: boolean;
  channels: ('slack' | 'pagerduty' | 'email' | 'webhook')[];
}

// Default alert rules
const DEFAULT_ALERT_RULES: AlertRule[] = [
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

// Check if current time is after hours (6 PM - 8 AM local time)
function isAfterHours(): boolean {
  const hour = new Date().getUTCHours();
  // Assuming UTC-5 (EST), after hours is 23:00-13:00 UTC
  // Adjust based on your timezone
  return hour < 13 || hour >= 23;
}

// Send Slack notification
async function sendSlackAlert(
  webhookUrl: string,
  alert: { rule: AlertRule; events: unknown[]; message: string }
): Promise<void> {
  const color = alert.rule.severity === 'CRITICAL' ? '#dc3545' : 
                alert.rule.severity === 'WARNING' ? '#ffc107' : '#17a2b8';
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `Security Alert: ${alert.rule.name}`,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.rule.severity, short: true },
          { title: 'Event Count', value: String(alert.events.length), short: true },
        ],
        footer: 'CTO Dashboard Security Monitor',
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });
}

// Send PagerDuty notification
async function sendPagerDutyAlert(
  apiKey: string,
  alert: { rule: AlertRule; events: unknown[]; message: string }
): Promise<void> {
  const severity = alert.rule.severity === 'CRITICAL' ? 'critical' : 
                   alert.rule.severity === 'WARNING' ? 'warning' : 'info';
  
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: apiKey,
      event_action: 'trigger',
      payload: {
        summary: `${alert.rule.name}: ${alert.message}`,
        severity,
        source: 'cto-dashboard-security-monitor',
        component: 'security-audit',
        group: 'compliance',
        custom_details: {
          rule_id: alert.rule.id,
          event_count: alert.events.length,
        },
      },
    }),
  });
}

// Send email notification (via configured email service)
async function sendEmailAlert(
  supabase: ReturnType<typeof createClient>,
  alert: { rule: AlertRule; events: unknown[]; message: string }
): Promise<void> {
  // Get security officer email from settings
  const { data: settings } = await supabase
    .from('compliance_settings')
    .select('value')
    .eq('key', 'security_officer_email')
    .single();

  if (!settings?.value) {
    console.log('[Security Monitor] No security officer email configured');
    return;
  }

  // Use the send-note-notification function for email
  await supabase.functions.invoke('send-note-notification', {
    body: {
      to: settings.value,
      subject: `[SECURITY ALERT] ${alert.rule.name}`,
      body: `
        <h2>Security Alert: ${alert.rule.name}</h2>
        <p><strong>Severity:</strong> ${alert.rule.severity}</p>
        <p><strong>Description:</strong> ${alert.rule.description}</p>
        <p>${alert.message}</p>
        <p><strong>Event Count:</strong> ${alert.events.length}</p>
        <hr>
        <p>This is an automated alert from the CTO Dashboard Security Monitor.</p>
      `,
    },
  });
}

// Send to custom webhook
async function sendWebhookAlert(
  webhookUrl: string,
  alert: { rule: AlertRule; events: unknown[]; message: string }
): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'security_alert',
      rule: {
        id: alert.rule.id,
        name: alert.rule.name,
        severity: alert.rule.severity,
      },
      message: alert.message,
      event_count: alert.events.length,
      events: alert.events.slice(0, 10), // Limit events in webhook
      timestamp: new Date().toISOString(),
    }),
  });
}

// Dispatch alert to configured channels
async function dispatchAlert(
  supabase: ReturnType<typeof createClient>,
  alert: { rule: AlertRule; events: unknown[]; message: string }
): Promise<void> {
  // Get channel configurations
  const { data: settings } = await supabase
    .from('compliance_settings')
    .select('key, value')
    .in('key', [
      'slack_webhook_url',
      'pagerduty_routing_key',
      'security_alert_webhook',
    ]);

  const config: Record<string, string> = {};
  settings?.forEach((s) => {
    config[s.key] = s.value;
  });

  // Also check environment variables
  const slackUrl = config.slack_webhook_url || Deno.env.get('SLACK_WEBHOOK_URL');
  const pagerdutyKey = config.pagerduty_routing_key || Deno.env.get('PAGERDUTY_ROUTING_KEY');
  const webhookUrl = config.security_alert_webhook || Deno.env.get('SECURITY_ALERT_WEBHOOK_URL');

  const promises: Promise<void>[] = [];

  for (const channel of alert.rule.channels) {
    switch (channel) {
      case 'slack':
        if (slackUrl) promises.push(sendSlackAlert(slackUrl, alert));
        break;
      case 'pagerduty':
        if (pagerdutyKey) promises.push(sendPagerDutyAlert(pagerdutyKey, alert));
        break;
      case 'email':
        promises.push(sendEmailAlert(supabase, alert));
        break;
      case 'webhook':
        if (webhookUrl) promises.push(sendWebhookAlert(webhookUrl, alert));
        break;
    }
  }

  await Promise.allSettled(promises);
}

// Check events against alert rules
async function checkAlertRules(
  supabase: ReturnType<typeof createClient>,
  rules: AlertRule[]
): Promise<{ rule: AlertRule; events: unknown[]; message: string }[]> {
  const triggeredAlerts: { rule: AlertRule; events: unknown[]; message: string }[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const timeWindow = rule.time_window_minutes || 60;
    const since = new Date(Date.now() - timeWindow * 60 * 1000).toISOString();

    // Query events matching this rule
    let query = supabase
      .from('security_audit_log')
      .select('*')
      .in('event_type', rule.event_types)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    const { data: events, error } = await query;

    if (error) {
      console.error(`[Security Monitor] Error checking rule ${rule.id}:`, error);
      continue;
    }

    // Special handling for after-hours rule
    if (rule.id === 'after-hours-phi' && isAfterHours() && events && events.length > 0) {
      triggeredAlerts.push({
        rule,
        events,
        message: `${events.length} PHI access event(s) detected outside business hours`,
      });
      continue;
    }

    // Check threshold-based rules
    if (rule.threshold && events && events.length >= rule.threshold) {
      triggeredAlerts.push({
        rule,
        events: events.slice(0, rule.threshold),
        message: `Threshold exceeded: ${events.length} events in the last ${timeWindow} minutes (threshold: ${rule.threshold})`,
      });
    }

    // Check immediate trigger rules (no threshold)
    if (!rule.threshold && events && events.length > 0) {
      // For immediate trigger rules, only alert on new events (within last minute)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const recentEvents = events.filter((e: { created_at: string }) => e.created_at >= oneMinuteAgo);
      
      if (recentEvents.length > 0) {
        triggeredAlerts.push({
          rule,
          events: recentEvents,
          message: `${recentEvents.length} ${rule.event_types.join('/')} event(s) detected`,
        });
      }
    }
  }

  return triggeredAlerts;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request for optional configuration
    let customRules: AlertRule[] | undefined;
    let action = 'check'; // 'check' | 'configure' | 'status'

    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action || 'check';
      customRules = body.rules;
    }

    // Get alert rules (custom or from DB or default)
    let rules = customRules;
    
    if (!rules) {
      // Try to get rules from database
      const { data: dbRules } = await supabase
        .from('security_alert_rules')
        .select('*')
        .eq('enabled', true);

      rules = (dbRules && dbRules.length > 0) ? dbRules : DEFAULT_ALERT_RULES;
    }

    if (action === 'status') {
      // Return current monitoring status
      const { data: recentEvents } = await supabase
        .from('security_audit_log')
        .select('event_type, severity, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      const criticalCount = recentEvents?.filter((e: { severity: string }) => e.severity === 'CRITICAL').length || 0;
      const warningCount = recentEvents?.filter((e: { severity: string }) => e.severity === 'WARNING').length || 0;

      return new Response(
        JSON.stringify({
          status: criticalCount > 0 ? 'critical' : warningCount > 5 ? 'warning' : 'healthy',
          rules_active: rules.filter(r => r.enabled).length,
          last_24h: {
            total: recentEvents?.length || 0,
            critical: criticalCount,
            warning: warningCount,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check alert rules
    const triggeredAlerts = await checkAlertRules(supabase, rules);

    // Dispatch alerts
    for (const alert of triggeredAlerts) {
      await dispatchAlert(supabase, alert);
      
      // Log that we sent an alert
      await supabase.from('security_audit_log').insert({
        event_type: 'SECURITY_ALERT',
        severity: alert.rule.severity,
        action: `Alert triggered: ${alert.rule.name}`,
        details: {
          rule_id: alert.rule.id,
          message: alert.message,
          event_count: alert.events.length,
          channels: alert.rule.channels,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked_rules: rules.length,
        alerts_triggered: triggeredAlerts.length,
        alerts: triggeredAlerts.map(a => ({
          rule: a.rule.name,
          severity: a.rule.severity,
          message: a.message,
          event_count: a.events.length,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Security Monitor] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
