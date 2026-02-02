/**
 * Security Audit Edge Function
 * 
 * Comprehensive audit logging for SOC 2 Type II and HIPAA compliance.
 * Features:
 * - Tamper-evident logging with SHA-256 checksums
 * - IP address capture from various proxy headers
 * - Alert triggering for critical events
 * - Rate limiting detection
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security event types
type SecurityEventType =
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'SESSION_EXPIRED'
  | 'PASSWORD_CHANGE' | 'MFA_ENABLED' | 'MFA_DISABLED'
  | 'PHI_VIEW' | 'PHI_EXPORT' | 'PHI_MODIFY' | 'PHI_DELETE'
  | 'DATA_EXPORT' | 'DATA_IMPORT'
  | 'ADMIN_ACTION' | 'ROLE_CHANGE' | 'USER_CREATE' | 'USER_DELETE' | 'USER_SUSPEND'
  | 'CONFIG_CHANGE' | 'SECURITY_ALERT' | 'ACCESS_DENIED' | 'RATE_LIMIT'
  | 'EMERGENCY_ACCESS' | 'KEY_ROTATION' | 'AUDIT_ACCESS';

type SecuritySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface AuditLogRequest {
  event_type: SecurityEventType;
  action: string;
  severity?: SecuritySeverity;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
}

// Get client IP from various proxy headers
function getClientIP(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Generate SHA-256 checksum for tamper detection
async function generateChecksum(data: Record<string, unknown>): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  const dataBuffer = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get default severity for event type
function getDefaultSeverity(eventType: SecurityEventType): SecuritySeverity {
  const criticalEvents: SecurityEventType[] = [
    'LOGIN_FAILED', 'ACCESS_DENIED', 'RATE_LIMIT', 'SECURITY_ALERT',
    'PHI_DELETE', 'EMERGENCY_ACCESS',
  ];
  const warningEvents: SecurityEventType[] = [
    'PHI_EXPORT', 'DATA_EXPORT', 'ROLE_CHANGE', 'USER_DELETE',
    'USER_SUSPEND', 'CONFIG_CHANGE', 'KEY_ROTATION',
  ];
  
  if (criticalEvents.includes(eventType)) return 'CRITICAL';
  if (warningEvents.includes(eventType)) return 'WARNING';
  return 'INFO';
}

// Check if alert should be triggered
async function shouldTriggerAlert(
  supabase: ReturnType<typeof createClient>,
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  _actorId: string | undefined
): Promise<{ trigger: boolean; reason?: string }> {
  // Always alert on critical events
  if (severity === 'CRITICAL') {
    return { trigger: true, reason: 'Critical security event' };
  }

  // Check for repeated failed logins (>5 in 15 minutes)
  if (eventType === 'LOGIN_FAILED') {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('security_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'LOGIN_FAILED')
      .gte('created_at', fifteenMinutesAgo);

    if ((count || 0) >= 5) {
      return { trigger: true, reason: 'Multiple failed login attempts detected' };
    }
  }

  // Check for bulk data export
  if (eventType === 'DATA_EXPORT' || eventType === 'PHI_EXPORT') {
    return { trigger: true, reason: 'Data export event' };
  }

  return { trigger: false };
}

// Send alert to configured webhook
async function sendAlert(
  supabase: ReturnType<typeof createClient>,
  entry: Record<string, unknown>,
  reason: string
): Promise<void> {
  try {
    // Get webhook URL from settings
    const { data: settings } = await supabase
      .from('compliance_settings')
      .select('value')
      .eq('key', 'security_alert_webhook')
      .single();

    const webhookUrl = settings?.value || Deno.env.get('SECURITY_ALERT_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.log('[Security Audit] No webhook configured, skipping alert');
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'security_alert',
        reason,
        event: entry,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[Security Audit] Failed to send alert:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for inserting audit logs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create client with user auth for identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth (optional for some events like failed login)
    const { data: { user } } = await supabaseUser.auth.getUser();

    // Parse request body
    const body: AuditLogRequest = await req.json();
    
    if (!body.event_type || !body.action) {
      return new Response(
        JSON.stringify({ error: 'event_type and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine severity
    const severity = body.severity || getDefaultSeverity(body.event_type);

    // Build audit entry
    const entryData = {
      event_type: body.event_type,
      severity,
      actor_id: user?.id,
      actor_email: user?.email,
      actor_ip: getClientIP(req),
      actor_user_agent: req.headers.get('user-agent') || 'unknown',
      resource_type: body.resource_type,
      resource_id: body.resource_id,
      action: body.action,
      details: body.details || {},
    };

    // Generate checksum for tamper detection
    const checksum = await generateChecksum(entryData);

    // Insert audit log with service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('security_audit_log')
      .insert({
        ...entryData,
        checksum,
      })
      .select()
      .single();

    if (error) {
      console.error('[Security Audit] Database error:', error);
      throw error;
    }

    // Check if we need to trigger an alert
    const alertCheck = await shouldTriggerAlert(
      supabaseAdmin,
      body.event_type,
      severity,
      user?.id
    );

    if (alertCheck.trigger) {
      await sendAlert(supabaseAdmin, data, alertCheck.reason!);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { id: data.id },
        alert_triggered: alertCheck.trigger,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Security Audit] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
