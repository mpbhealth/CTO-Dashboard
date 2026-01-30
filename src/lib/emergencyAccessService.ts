/**
 * Emergency Access Service
 * 
 * Break-glass emergency access mechanism for HIPAA compliance.
 * Provides time-limited elevated access with full audit trail.
 * 
 * Features:
 * - Break-glass access mechanism
 * - Automatic notification to security officer
 * - Time-limited elevated access
 * - Full audit trail
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { logEmergencyAccess, logSecurityAlert } from './auditService';

// ============================================
// Types
// ============================================

export interface EmergencyAccessRequest {
  id: string;
  user_id: string;
  user_email: string;
  reason: string;
  resource_type: string;
  resource_id?: string;
  granted_at: string;
  expires_at: string;
  revoked_at?: string;
  revoked_by?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface EmergencyAccessConfig {
  /** Maximum duration of emergency access in minutes (default: 60) */
  maxDurationMinutes: number;
  /** Require reason for access (default: true) */
  requireReason: boolean;
  /** Notify security officer immediately (default: true) */
  notifySecurityOfficer: boolean;
  /** Enable emergency access feature (default: true) */
  enabled: boolean;
}

// Default configuration
const DEFAULT_CONFIG: EmergencyAccessConfig = {
  maxDurationMinutes: 60,
  requireReason: true,
  notifySecurityOfficer: true,
  enabled: true,
};

// ============================================
// Emergency Access Functions
// ============================================

/**
 * Request emergency access (break-glass)
 * 
 * @param reason - Reason for emergency access (required)
 * @param resourceType - Type of resource being accessed
 * @param resourceId - Specific resource ID if applicable
 * @param durationMinutes - Duration of access in minutes (max 60)
 */
export async function requestEmergencyAccess(
  reason: string,
  resourceType: string,
  resourceId?: string,
  durationMinutes: number = 30
): Promise<{ success: boolean; accessRequest?: EmergencyAccessRequest; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Reason must be at least 10 characters' };
  }

  if (durationMinutes > DEFAULT_CONFIG.maxDurationMinutes) {
    durationMinutes = DEFAULT_CONFIG.maxDurationMinutes;
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const grantedAt = new Date();
    const expiresAt = new Date(grantedAt.getTime() + durationMinutes * 60 * 1000);

    // Create emergency access request
    const accessRequest: EmergencyAccessRequest = {
      id: `ea-${Date.now()}`,
      user_id: user.id,
      user_email: user.email || 'unknown',
      reason: reason.trim(),
      resource_type: resourceType,
      resource_id: resourceId,
      granted_at: grantedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
    };

    // Log the emergency access event
    await logEmergencyAccess(reason, resourceId || resourceType, {
      user_id: user.id,
      user_email: user.email,
      resource_type: resourceType,
      duration_minutes: durationMinutes,
      expires_at: expiresAt.toISOString(),
    });

    // Send security alert
    await logSecurityAlert(
      'Emergency Access',
      `Break-glass access invoked by ${user.email}`,
      {
        user_id: user.id,
        user_email: user.email,
        reason,
        resource_type: resourceType,
        resource_id: resourceId,
        expires_at: expiresAt.toISOString(),
      }
    );

    // Try to store in database
    try {
      await supabase.from('emergency_access_log').insert({
        id: accessRequest.id,
        user_id: accessRequest.user_id,
        user_email: accessRequest.user_email,
        reason: accessRequest.reason,
        resource_type: accessRequest.resource_type,
        resource_id: accessRequest.resource_id,
        granted_at: accessRequest.granted_at,
        expires_at: accessRequest.expires_at,
        status: accessRequest.status,
      });
    } catch {
      // Table might not exist yet, that's OK - the audit log captures it
      console.warn('[Emergency Access] Could not store in emergency_access_log table');
    }

    // Notify security officer if configured
    if (DEFAULT_CONFIG.notifySecurityOfficer) {
      await notifySecurityOfficer(accessRequest);
    }

    return { success: true, accessRequest };
  } catch (error) {
    console.error('[Emergency Access] Error requesting access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if emergency access is currently active for a user
 */
export async function checkEmergencyAccessActive(userId: string): Promise<{
  active: boolean;
  request?: EmergencyAccessRequest;
}> {
  if (!isSupabaseConfigured()) {
    return { active: false };
  }

  try {
    const { data } = await supabase
      .from('emergency_access_log')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('granted_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return { active: true, request: data };
    }
  } catch {
    // No active emergency access or table doesn't exist
  }

  return { active: false };
}

/**
 * Revoke emergency access
 */
export async function revokeEmergencyAccess(
  accessId: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('emergency_access_log')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      })
      .eq('id', accessId);

    if (error) throw error;

    // Log the revocation
    await logSecurityAlert(
      'Emergency Access Revoked',
      `Emergency access ${accessId} revoked by ${revokedBy}`,
      { access_id: accessId, revoked_by: revokedBy }
    );

    return { success: true };
  } catch (error) {
    console.error('[Emergency Access] Error revoking access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get emergency access history for a user
 */
export async function getEmergencyAccessHistory(userId: string): Promise<EmergencyAccessRequest[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('emergency_access_log')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Get all active emergency access requests (for security dashboard)
 */
export async function getActiveEmergencyAccess(): Promise<EmergencyAccessRequest[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('emergency_access_log')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('granted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Notify security officer about emergency access
 */
async function notifySecurityOfficer(accessRequest: EmergencyAccessRequest): Promise<void> {
  try {
    // Get security officer email from settings
    const { data: settings } = await supabase
      .from('compliance_settings')
      .select('value')
      .eq('key', 'security_officer_email')
      .single();

    if (!settings?.value) {
      console.log('[Emergency Access] No security officer email configured');
      return;
    }

    // Send notification via Edge Function
    await supabase.functions.invoke('send-note-notification', {
      body: {
        to: settings.value,
        subject: '[CRITICAL] Emergency Access Invoked - Immediate Attention Required',
        body: `
          <h2 style="color: #dc3545;">Emergency Access Alert</h2>
          <p>Break-glass emergency access has been invoked.</p>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>User</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accessRequest.user_email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accessRequest.reason}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Resource</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${accessRequest.resource_type}${accessRequest.resource_id ? ` (${accessRequest.resource_id})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Granted At</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(accessRequest.granted_at).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Expires At</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(accessRequest.expires_at).toLocaleString()}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">
            <strong>Action Required:</strong> Please review this emergency access request immediately.
            If this access was not authorized, revoke it from the Security Dashboard.
          </p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated alert from the CTO Dashboard Security System.
          </p>
        `,
      },
    });

    console.log('[Emergency Access] Security officer notified');
  } catch (error) {
    console.error('[Emergency Access] Failed to notify security officer:', error);
  }
}

/**
 * Expire any stale active emergency access requests
 * This should be called periodically (e.g., by a cron job)
 */
export async function expireStaleEmergencyAccess(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('emergency_access_log')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  } catch {
    return 0;
  }
}
