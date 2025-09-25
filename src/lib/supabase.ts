import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback values for development/demo mode
const defaultUrl = 'https://demo.supabase.co';
const defaultKey = 'demo-key';

// Use environment variables if available, otherwise use demo values
const finalUrl = supabaseUrl || defaultUrl;
const finalKey = supabaseAnonKey || defaultKey;

// Development-only configuration logging
if (import.meta.env.DEV) {
  console.log('Supabase Configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    usingFallback: !supabaseUrl || !supabaseAnonKey
  });
}

export const supabase = createClient<Database>(finalUrl, finalKey);

// Export configuration status for components to use
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);