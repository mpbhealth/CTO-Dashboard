/**
 * Secure Access Gate Service
 *
 * Server-side validated access control replacing hardcoded PIN.
 * Uses Supabase RPC for secure PIN validation with rate limiting.
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import { logSecurityEvent } from '../auditService';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface AccessAttempt {
  timestamp: number;
  success: boolean;
}

// In-memory rate limiting (persists across page loads via sessionStorage)
function getAttempts(): AccessAttempt[] {
  try {
    const stored = sessionStorage.getItem('mpb_access_attempts');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveAttempts(attempts: AccessAttempt[]): void {
  try {
    sessionStorage.setItem('mpb_access_attempts', JSON.stringify(attempts));
  } catch {
    // Ignore storage errors
  }
}

function cleanOldAttempts(attempts: AccessAttempt[]): AccessAttempt[] {
  const cutoff = Date.now() - ATTEMPT_WINDOW_MS;
  return attempts.filter(a => a.timestamp > cutoff);
}

export function isLockedOut(): { locked: boolean; remainingMs: number } {
  const attempts = cleanOldAttempts(getAttempts());
  const failedAttempts = attempts.filter(a => !a.success);

  if (failedAttempts.length >= MAX_ATTEMPTS) {
    const oldestFailed = Math.min(...failedAttempts.map(a => a.timestamp));
    const lockoutEnd = oldestFailed + LOCKOUT_DURATION_MS;
    const remainingMs = lockoutEnd - Date.now();

    if (remainingMs > 0) {
      return { locked: true, remainingMs };
    }
  }

  return { locked: false, remainingMs: 0 };
}

function recordAttempt(success: boolean): void {
  const attempts = cleanOldAttempts(getAttempts());
  attempts.push({ timestamp: Date.now(), success });
  saveAttempts(attempts);
}

/**
 * Validate access PIN against server-side stored value
 * Falls back to environment variable if database not configured
 */
export async function validateAccessPin(pin: string): Promise<{
  valid: boolean;
  error?: string;
  locked?: boolean;
  remainingMs?: number;
}> {
  // Check lockout first
  const lockoutStatus = isLockedOut();
  if (lockoutStatus.locked) {
    await logSecurityEvent('ACCESS_DENIED', 'Access gate locked due to too many attempts', {
      severity: 'CRITICAL',
      details: { remainingMs: lockoutStatus.remainingMs }
    });
    return {
      valid: false,
      locked: true,
      remainingMs: lockoutStatus.remainingMs,
      error: 'Too many failed attempts. Please try again later.'
    };
  }

  // Validate PIN format
  if (!pin || !/^\d{6}$/.test(pin)) {
    recordAttempt(false);
    return { valid: false, error: 'Invalid PIN format' };
  }

  try {
    if (!isSupabaseConfigured) {
      // Fallback to environment variable for development
      const envPin = import.meta.env.VITE_ACCESS_PIN;
      if (envPin && pin === envPin) {
        recordAttempt(true);
        await logSecurityEvent('LOGIN', 'Access gate passed (env fallback)', {
          severity: 'INFO'
        });
        return { valid: true };
      }
      recordAttempt(false);
      await logSecurityEvent('ACCESS_DENIED', 'Invalid access PIN (env fallback)', {
        severity: 'WARNING'
      });
      return { valid: false, error: 'Invalid access code' };
    }

    // Server-side validation via Supabase RPC
    const { data, error } = await supabase.rpc('validate_access_pin', {
      input_pin: pin
    });

    if (error) {
      console.error('[AccessGate] RPC error:', error);
      // Fall back to checking compliance_settings
      const { data: settings } = await supabase
        .from('compliance_settings')
        .select('value')
        .eq('key', 'access_gate_pin_hash')
        .single();

      if (settings?.value) {
        // Compare hashed PIN
        const encoder = new TextEncoder();
        const pinData = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', pinData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (pinHash === settings.value) {
          recordAttempt(true);
          await logSecurityEvent('LOGIN', 'Access gate passed', {
            severity: 'INFO'
          });
          return { valid: true };
        }
      }

      recordAttempt(false);
      await logSecurityEvent('ACCESS_DENIED', 'Invalid access PIN', {
        severity: 'WARNING'
      });
      return { valid: false, error: 'Invalid access code' };
    }

    if (data === true) {
      recordAttempt(true);
      await logSecurityEvent('LOGIN', 'Access gate passed', {
        severity: 'INFO'
      });
      return { valid: true };
    }

    recordAttempt(false);
    await logSecurityEvent('ACCESS_DENIED', 'Invalid access PIN', {
      severity: 'WARNING'
    });
    return { valid: false, error: 'Invalid access code' };

  } catch (err) {
    console.error('[AccessGate] Validation error:', err);
    recordAttempt(false);
    return { valid: false, error: 'Validation failed. Please try again.' };
  }
}

/**
 * Generate a SHA-256 hash of a PIN for secure storage
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', pinData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if access has been verified for this session
 */
export function isAccessVerified(): boolean {
  return sessionStorage.getItem('mpb_access_verified') === 'true';
}

/**
 * Mark access as verified for this session
 */
export function setAccessVerified(): void {
  sessionStorage.setItem('mpb_access_verified', 'true');
}

/**
 * Clear access verification (for logout)
 */
export function clearAccessVerification(): void {
  sessionStorage.removeItem('mpb_access_verified');
  sessionStorage.removeItem('mpb_access_attempts');
}
