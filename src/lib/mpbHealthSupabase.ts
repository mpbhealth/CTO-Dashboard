/**
 * Secondary Supabase client for MPB Health Backend
 * This connects to the MPB Health production database to fetch real data
 * for members, claims, tickets, transactions, and more.
 *
 * IMPORTANT: Configure these environment variables in your .env file:
 * - VITE_MPB_HEALTH_SUPABASE_URL
 * - VITE_MPB_HEALTH_SUPABASE_SERVICE_KEY
 */
import { createClient } from '@supabase/supabase-js';

// MPB Health Backend Configuration
// All credentials MUST be provided via environment variables
const mpbHealthUrl = import.meta.env.VITE_MPB_HEALTH_SUPABASE_URL || '';
const mpbHealthServiceKey = import.meta.env.VITE_MPB_HEALTH_SUPABASE_SERVICE_KEY || '';

// Validate configuration
const isValidUrl = mpbHealthUrl &&
  mpbHealthUrl.startsWith('https://') &&
  mpbHealthUrl.includes('supabase.co');

const isValidKey = mpbHealthServiceKey &&
  mpbHealthServiceKey.length > 20;

export const isMpbHealthConfigured = !!(isValidUrl && isValidKey);

// Log configuration status in development
if (import.meta.env.DEV) {
  console.log('[MPB Health Supabase] Connected to MPB Health backend:', {
    url: mpbHealthUrl.substring(0, 45) + '...',
    configured: isMpbHealthConfigured,
  });
}

// Create the client with service role key (bypasses RLS for admin dashboard access)
export const mpbHealthSupabase = createClient(mpbHealthUrl, mpbHealthServiceKey, {
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
