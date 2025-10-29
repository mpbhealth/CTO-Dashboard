import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

if (import.meta.env.DEV && !isSupabaseConfigured) {
  logger.warn('Supabase not configured - using placeholder values');
} else if (import.meta.env.DEV && localStorage.getItem('debug') === 'true') {
  logger.debug('Supabase configuration', {
    configured: isSupabaseConfigured,
    hasUrl: !!supabaseUrl,
    hasValidUrl: isValidUrl,
    hasKey: !!supabaseAnonKey,
    hasValidKey: isValidKey,
    mode: isSupabaseConfigured ? 'production' : 'demo'
  });
}

// Production validation - warn if misconfigured but allow demo mode to take over
if (import.meta.env.PROD && !isSupabaseConfigured) {
  const warnMsg = 'WARNING: Supabase is not configured in production environment - running in demo mode';
  logger.warn(warnMsg);
  console.warn(warnMsg);
  // Don't throw - let AuthContext handle demo mode gracefully
}

// Create client without type parameter to avoid import errors
export const supabase = createClient(finalUrl, finalKey);