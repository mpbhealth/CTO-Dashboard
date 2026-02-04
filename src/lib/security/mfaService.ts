/**
 * Multi-Factor Authentication Service
 *
 * Implements TOTP-based MFA using Supabase Auth.
 * Required for admin and officer roles per HIPAA compliance.
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import { logSecurityEvent } from '../auditService';

export interface MFAFactor {
  id: string;
  type: 'totp';
  friendly_name?: string;
  created_at: string;
  updated_at: string;
  status: 'verified' | 'unverified';
}

export interface MFAChallenge {
  id: string;
  type: 'totp';
  expires_at: number;
}

// Roles that require MFA
const MFA_REQUIRED_ROLES = ['admin', 'hipaa_officer', 'privacy_officer', 'security_officer', 'ceo', 'cto'];

/**
 * Check if MFA is required for a user based on their role
 */
export function isMFARequired(userRole?: string | null): boolean {
  if (!userRole) return false;
  return MFA_REQUIRED_ROLES.includes(userRole.toLowerCase());
}

/**
 * Get all enrolled MFA factors for current user
 */
export async function getMFAFactors(): Promise<MFAFactor[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      console.error('[MFA] Error listing factors:', error);
      return [];
    }

    return data?.totp || [];
  } catch (err) {
    console.error('[MFA] Error:', err);
    return [];
  }
}

/**
 * Check if user has MFA enabled
 */
export async function hasMFAEnabled(): Promise<boolean> {
  const factors = await getMFAFactors();
  return factors.some(f => f.status === 'verified');
}

/**
 * Enroll a new TOTP factor
 * Returns the QR code URI for the authenticator app
 */
export async function enrollMFA(friendlyName?: string): Promise<{
  success: boolean;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName || 'Authenticator App',
    });

    if (error) {
      console.error('[MFA] Enroll error:', error);
      return { success: false, error: error.message };
    }

    await logSecurityEvent('MFA_ENABLED', 'MFA enrollment initiated', {
      severity: 'INFO',
      details: { factorId: data.id }
    });

    return {
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    };
  } catch (err) {
    console.error('[MFA] Enroll error:', err);
    return { success: false, error: 'Failed to enroll MFA' };
  }
}

/**
 * Verify and activate a TOTP factor
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // First create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      console.error('[MFA] Challenge error:', challengeError);
      return { success: false, error: challengeError.message };
    }

    // Then verify with the code
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      console.error('[MFA] Verify error:', verifyError);
      await logSecurityEvent('MFA_ENABLED', 'MFA verification failed', {
        severity: 'WARNING',
        details: { factorId, error: verifyError.message }
      });
      return { success: false, error: 'Invalid verification code' };
    }

    await logSecurityEvent('MFA_ENABLED', 'MFA successfully enabled', {
      severity: 'INFO',
      details: { factorId }
    });

    return { success: true };
  } catch (err) {
    console.error('[MFA] Verify error:', err);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Create an MFA challenge for login
 */
export async function createMFAChallenge(factorId: string): Promise<{
  success: boolean;
  challengeId?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (error) {
      console.error('[MFA] Challenge error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, challengeId: data.id };
  } catch (err) {
    console.error('[MFA] Challenge error:', err);
    return { success: false, error: 'Failed to create challenge' };
  }
}

/**
 * Verify MFA code during login
 */
export async function verifyMFACode(
  factorId: string,
  challengeId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error('[MFA] Verify error:', error);
      await logSecurityEvent('LOGIN_FAILED', 'MFA verification failed during login', {
        severity: 'CRITICAL',
        details: { factorId }
      });
      return { success: false, error: 'Invalid verification code' };
    }

    await logSecurityEvent('LOGIN', 'MFA verification successful', {
      severity: 'INFO',
      details: { factorId }
    });

    return { success: true };
  } catch (err) {
    console.error('[MFA] Verify error:', err);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Unenroll (disable) an MFA factor
 */
export async function unenrollMFA(factorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      console.error('[MFA] Unenroll error:', error);
      return { success: false, error: error.message };
    }

    await logSecurityEvent('MFA_DISABLED', 'MFA factor removed', {
      severity: 'WARNING',
      details: { factorId }
    });

    return { success: true };
  } catch (err) {
    console.error('[MFA] Unenroll error:', err);
    return { success: false, error: 'Failed to disable MFA' };
  }
}

/**
 * Get the current MFA authentication level
 * Returns 'aal1' (password only) or 'aal2' (password + MFA)
 */
export async function getMFAAuthLevel(): Promise<'aal1' | 'aal2' | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      console.error('[MFA] Get AAL error:', error);
      return null;
    }

    return data.currentLevel;
  } catch (err) {
    console.error('[MFA] Get AAL error:', err);
    return null;
  }
}

/**
 * Check if user needs to complete MFA challenge
 */
export async function needsMFAVerification(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      return false;
    }

    // User has MFA set up but hasn't verified this session
    return data.currentLevel === 'aal1' && data.nextLevel === 'aal2';
  } catch {
    return false;
  }
}
