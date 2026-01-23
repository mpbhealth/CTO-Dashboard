/**
 * Secondary Supabase client for MPB Health Backend
 * This connects to the MPB Health production database to fetch real data
 * for members, claims, tickets, transactions, and more.
 *
 * Project ID: dtmnkzllidaiqyheguhl
 * Project URL: https://dtmnkzllidaiqyheguhl.supabase.co
 */
import { createClient } from '@supabase/supabase-js';

// MPB Health Backend Configuration
// Environment variables can override the default credentials
const envUrl = import.meta.env.VITE_MPB_HEALTH_SUPABASE_URL;
const envKey = import.meta.env.VITE_MPB_HEALTH_SUPABASE_SERVICE_KEY;

// Default MPB Health backend credentials
// These connect to the production MPB Health member portal database
const DEFAULT_MPB_HEALTH_URL = 'https://dtmnkzllidaiqyheguhl.supabase.co';
const DEFAULT_MPB_HEALTH_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bW5remxsaWRhaXF5aGVndWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwMjMxMCwiZXhwIjoyMDc1NDc4MzEwfQ.Lt3yzIlbfLAHXge2umBmsZ8oOAK3NXfkhz4RY-N3jmg';

// Use env vars if available, otherwise use defaults
const mpbHealthUrl = envUrl || DEFAULT_MPB_HEALTH_URL;
const mpbHealthServiceKey = envKey || DEFAULT_MPB_HEALTH_SERVICE_KEY;

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
