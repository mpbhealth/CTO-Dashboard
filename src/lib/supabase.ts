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

// Production validation - warn but don't crash (allows app to render with mock data)
if (import.meta.env.PROD && !isSupabaseConfigured) {
  const errorMsg = 'WARNING: Supabase is not configured - app will run in limited mode';
  logger.warn(errorMsg);

  // Add visual indicator in DOM for debugging
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      const warningDiv = document.createElement('div');
      warningDiv.id = 'supabase-config-warning';
      warningDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #f97316; color: white; padding: 10px 15px; border-radius: 8px; z-index: 9999; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer;';
      warningDiv.innerHTML = '⚠️ Supabase not configured - using mock data';
      warningDiv.onclick = () => warningDiv.remove();
      document.body?.appendChild(warningDiv);
    }, 1000);
  }
}

// Create client without type parameter to avoid import errors
export const supabase = createClient(finalUrl, finalKey);