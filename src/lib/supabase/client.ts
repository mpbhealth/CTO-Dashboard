import { createBrowserClient } from '@supabase/ssr';

/**
 * Environment variables for Supabase connection
 * Supports both Next.js (NEXT_PUBLIC_*) and Vite (VITE_*) formats
 */
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) ||
  '';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  '';

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Creates a Supabase client for use in the browser
 * Uses @supabase/ssr for proper cookie handling in Next.js
 * 
 * @returns Supabase browser client
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * const supabase = createClient();
 * const { data } = await supabase.from('apps').select('*');
 * ```
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Using mock client.');
    // Return a mock client for demo mode
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Pre-configured Supabase client instance for browser use
 * Singleton pattern for consistent client across the app
 */
export const supabaseBrowser = createClient();

