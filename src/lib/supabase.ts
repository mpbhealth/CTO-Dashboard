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

// Use direct console logging to avoid circular dependencies during module initialization
if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.warn('[Supabase] Not configured - using placeholder values');
} else if (import.meta.env.DEV && typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
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
if (import.meta.env.PROD && !isSupabaseConfigured) {
  const errorMsg = 'WARNING: Supabase is not configured in production environment';
  console.error('[Supabase]', errorMsg);
  console.error('[Supabase] Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment');
}

// Check if user previously selected "remember me"
const shouldPersistSession = typeof localStorage !== 'undefined' 
  ? localStorage.getItem('mpb_remembered_email') !== null 
  : true;

// Create client with auth persistence options
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    storageKey: 'mpb-auth-token',
    storage: shouldPersistSession ? localStorage : sessionStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Helper to update session storage based on "remember me" preference
export const updateSessionStorage = async (rememberMe: boolean) => {
  if (typeof window === 'undefined') return;
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (rememberMe) {
    // Move session to localStorage for persistence
    if (session) {
      localStorage.setItem('mpb-auth-token', JSON.stringify(session));
    }
  } else {
    // Move session to sessionStorage (cleared on browser close)
    if (session) {
      sessionStorage.setItem('mpb-auth-token', JSON.stringify(session));
      localStorage.removeItem('mpb-auth-token');
    }
  }
};