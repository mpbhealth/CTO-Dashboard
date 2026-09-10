import { createClient } from '@supabase/supabase-js';

// Support both Next.js and Vite environment variables
// Use a function to safely access environment variables
function getSupabaseEnv() {
  let url = '';
  let key = '';

  // Try Next.js environment variables first (works in both client and server)
  if (typeof process !== 'undefined' && process.env) {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  // If not found, try Vite environment variables (client-side only)
  // This is wrapped in try-catch because import.meta may not exist in Node.js
  if (!url || !key) {
    try {
      // @ts-expect-error import.meta.env is Vite-specific and not recognized by TypeScript
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-expect-error import.meta.env.VITE_SUPABASE_URL is Vite-specific
        url = url || import.meta.env.VITE_SUPABASE_URL || '';
        // @ts-expect-error import.meta.env.VITE_SUPABASE_ANON_KEY is Vite-specific
        key = key || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      }
    } catch {
      // import.meta not available
    }
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseEnv();

// Validate that environment variables are properly configured
const isValidUrl = supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('demo.supabase.co') &&
  supabaseUrl.includes('supabase.co');

const isValidKey = supabaseAnonKey &&
  supabaseAnonKey.length > 20 &&
  supabaseAnonKey !== 'demo-key';

// Export configuration status for components to use
export const isSupabaseConfigured = !!(isValidUrl && isValidKey);

// Use dummy values if not configured to prevent API calls
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

// Check environment mode
function getEnvMode() {
  // Try Node.js environment first
  if (typeof process !== 'undefined' && process.env) {
    return {
      isDev: process.env.NODE_ENV === 'development',
      isProd: process.env.NODE_ENV === 'production',
    };
  }

  // Try Vite environment
  try {
    // @ts-expect-error import.meta.env is Vite-specific and not recognized by TypeScript
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return {
        // @ts-expect-error import.meta.env.DEV is Vite-specific
        isDev: !!import.meta.env.DEV,
        // @ts-expect-error import.meta.env.PROD is Vite-specific
        isProd: !!import.meta.env.PROD,
      };
    }
  } catch {
    // import.meta not available
  }

  return { isDev: false, isProd: true };
}

const { isDev, isProd } = getEnvMode();

// Use direct console logging to avoid circular dependencies during module initialization
if (isDev && !isSupabaseConfigured) {
  console.warn('[Supabase] Not configured - using placeholder values');
} else if (isDev && typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
  console.log('[Supabase] Configuration:', {
    configured: isSupabaseConfigured,
    hasUrl: !!supabaseUrl,
    hasValidUrl: isValidUrl,
    hasKey: !!supabaseAnonKey,
    hasValidKey: isValidKey,
    mode: isSupabaseConfigured ? 'production' : 'demo'
  });
}

// Production validation - warn but don't crash
if (isProd && !isSupabaseConfigured) {
  const errorMsg = 'WARNING: Supabase is not configured in production environment';
  console.error('[Supabase]', errorMsg);
  console.error('[Supabase] Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment');
}

// Create client with auth persistence options
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    storageKey: 'mpb-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Email-only remember preference. Must never gate or wipe persistSession / mpb-auth-token.
const REMEMBER_EMAIL_KEY = 'mpb_remembered_email';

export const setRememberMePreference = (rememberMe: boolean) => {
  if (typeof localStorage === 'undefined') return;
  if (!rememberMe) {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
};

export const isRememberMeEnabled = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem(REMEMBER_EMAIL_KEY);
};