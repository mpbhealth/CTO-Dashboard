import { createClient } from '@supabase/supabase-js';

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

// Log configuration status
if (import.meta.env.DEV || !isSupabaseConfigured) {
  console.log('Supabase Configuration:', {
    configured: isSupabaseConfigured,
    hasUrl: !!supabaseUrl,
    hasValidUrl: isValidUrl,
    hasKey: !!supabaseAnonKey,
    hasValidKey: isValidKey,
    mode: isSupabaseConfigured ? 'production' : 'demo'
  });
}

// Create client without type parameter to avoid import errors
export const supabase = createClient(finalUrl, finalKey);