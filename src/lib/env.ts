/**
 * Environment Utilities
 * 
 * Provides safe access to environment variables that works in both
 * Vite (client-side) and Next.js (server-side) environments.
 */

/**
 * Get environment mode (development/production)
 */
export function getEnvMode(): { isDev: boolean; isProd: boolean } {
  // Try Node.js environment first (Next.js)
  if (typeof process !== 'undefined' && process.env) {
    return {
      isDev: process.env.NODE_ENV === 'development',
      isProd: process.env.NODE_ENV === 'production',
    };
  }

  // Try Vite environment (client-side)
  try {
    // @ts-expect-error - import.meta.env is Vite-specific
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return {
        // @ts-expect-error - import.meta.env is Vite-specific
        isDev: !!import.meta.env.DEV,
        // @ts-expect-error - import.meta.env is Vite-specific
        isProd: !!import.meta.env.PROD,
      };
    }
  } catch {
    // import.meta not available
  }

  // Default to production for safety
  return { isDev: false, isProd: true };
}

/**
 * Get an environment variable
 * Checks both Next.js (process.env) and Vite (import.meta.env) environments
 */
export function getEnvVar(key: string): string | undefined {
  // Try Node.js environment first
  if (typeof process !== 'undefined' && process.env) {
    // Try NEXT_PUBLIC_ prefix
    const nextKey = key.replace('VITE_', 'NEXT_PUBLIC_');
    if (process.env[nextKey]) return process.env[nextKey];
    if (process.env[key]) return process.env[key];
  }

  // Try Vite environment
  try {
    // @ts-expect-error - import.meta.env is Vite-specific
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-expect-error - import.meta.env is Vite-specific
      return import.meta.env[key];
    }
  } catch {
    // import.meta not available
  }

  return undefined;
}

// Export singleton environment mode
export const env = getEnvMode();

// Common environment variables
export const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || '';
export const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || '';

