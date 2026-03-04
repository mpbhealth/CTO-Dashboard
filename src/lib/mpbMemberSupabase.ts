/**
 * Supabase client for MPB Health Member Data
 * Connects to the mpb_health_app project (qfigouszitcddkhssqxr)
 * for querying members, advisors, products, and app users.
 *
 * This is separate from mpbHealthSupabase.ts which handles website analytics.
 * All queries are read-only using the anon key (public SELECT RLS policies).
 */
import { createClient } from '@supabase/supabase-js';

const mpbMemberUrl = import.meta.env.VITE_MPB_MEMBER_SUPABASE_URL || '';
const mpbMemberAnonKey = import.meta.env.VITE_MPB_MEMBER_SUPABASE_ANON_KEY || '';

const isValidUrl = mpbMemberUrl &&
  mpbMemberUrl.startsWith('https://') &&
  mpbMemberUrl.includes('supabase.co');

const isValidKey = mpbMemberAnonKey &&
  mpbMemberAnonKey.length > 20;

export const isMpbMemberConfigured = !!(isValidUrl && isValidKey);

const finalUrl = isMpbMemberConfigured ? mpbMemberUrl : 'https://placeholder.supabase.co';
const finalKey = isMpbMemberConfigured ? mpbMemberAnonKey : 'placeholder-key';

export const mpbMemberSupabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});
