/**
 * Secondary Supabase client for MPB Health website analytics
 * This connects to the mpb.health database to fetch website analytics data
 */
import { createClient } from '@supabase/supabase-js';

// MPB Health website Supabase configuration
const mpbHealthUrl = import.meta.env.VITE_MPB_HEALTH_SUPABASE_URL;
const mpbHealthServiceKey = import.meta.env.VITE_MPB_HEALTH_SUPABASE_SERVICE_KEY;

// Validate configuration
const isValidUrl = mpbHealthUrl && 
  mpbHealthUrl.startsWith('https://') && 
  mpbHealthUrl.includes('supabase.co');

const isValidKey = mpbHealthServiceKey && 
  mpbHealthServiceKey.length > 20;

export const isMpbHealthConfigured = !!(isValidUrl && isValidKey);

// Log configuration status in development
if (import.meta.env.DEV) {
  if (!isMpbHealthConfigured) {
    console.warn('[MPB Health Supabase] Not configured - website analytics will not be available');
    console.warn('[MPB Health Supabase] Set VITE_MPB_HEALTH_SUPABASE_URL and VITE_MPB_HEALTH_SUPABASE_SERVICE_KEY');
  } else {
    console.log('[MPB Health Supabase] Connected to mpb.health analytics database');
  }
}

// Use placeholder values if not configured to prevent crashes
const finalUrl = isValidUrl ? mpbHealthUrl : 'https://placeholder.supabase.co';
const finalKey = isValidKey ? mpbHealthServiceKey : 'placeholder-key';

// Create the client with service role key (bypasses RLS)
export const mpbHealthSupabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: false, // No need to persist session for service role
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

// Helper to check if we can make API calls
export const canFetchMpbHealthData = (): boolean => {
  return isMpbHealthConfigured;
};
