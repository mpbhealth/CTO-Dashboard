/**
 * Secondary Supabase client for MPB Health Backend
 * This connects to the MPB Health production database to fetch real data
 * for members, claims, tickets, transactions, and more.
 *
 * IMPORTANT: Configure these environment variables in your .env file:
 * - VITE_MPB_HEALTH_SUPABASE_URL  (safe for client-side, uses VITE_ prefix)
 * - MPB_HEALTH_SUPABASE_SERVICE_KEY  (server-side only, NO VITE_ prefix)
 *
 * SECURITY NOTE:
 * The service role key (MPB_HEALTH_SUPABASE_SERVICE_KEY) does NOT have a VITE_
 * prefix, which means Vite will NOT bundle it into client-side JavaScript.
 * This is intentional — service role keys bypass Row Level Security and must
 * never be exposed in the browser. All operations requiring the service key
 * should go through Supabase Edge Functions or a server-side API route.
 *
 * This client-side module uses the anon key as a fallback so that RLS-safe
 * queries still work. For admin/service-role operations, call an Edge Function.
 */
import { createClient } from '@supabase/supabase-js';

// MPB Health Backend Configuration
const mpbHealthUrl = import.meta.env.VITE_MPB_HEALTH_SUPABASE_URL || '';

// SECURITY: The service role key is NOT available client-side (no VITE_ prefix).
// We use the anon key here so RLS-protected queries still work in the browser.
// For operations that need elevated access, use a Supabase Edge Function instead.
const mpbHealthAnonKey = import.meta.env.VITE_MPB_HEALTH_SUPABASE_ANON_KEY || '';

// Validate configuration
const isValidUrl = mpbHealthUrl &&
  mpbHealthUrl.startsWith('https://') &&
  mpbHealthUrl.includes('supabase.co');

const isValidKey = mpbHealthAnonKey &&
  mpbHealthAnonKey.length > 20;

export const isMpbHealthConfigured = !!(isValidUrl && isValidKey);

// Create the client with the anon key (respects RLS).
// For admin operations that bypass RLS, use a Supabase Edge Function with
// Deno.env.get('MPB_HEALTH_SUPABASE_SERVICE_KEY') instead.
export const mpbHealthSupabase = createClient(mpbHealthUrl, mpbHealthAnonKey, {
  auth: {
    persistSession: false,
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
