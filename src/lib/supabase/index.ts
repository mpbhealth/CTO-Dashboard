/**
 * Supabase Client Exports
 * 
 * Provides unified exports for Supabase clients:
 * - Browser client for client components
 * - Server client for server components
 * - Middleware client for Next.js middleware
 */

export { createClient as createBrowserClient, supabaseBrowser, isSupabaseConfigured } from './client';
export { createClient as createServerClient } from './server';
export { createMiddlewareClient, isPublicPath, hasRoleAccess, roleRouteAccess } from './middleware';

// Re-export the existing supabase client for backward compatibility
// This allows existing code to continue using `import { supabase } from '@/lib/supabase'`
import { supabaseBrowser } from './client';
export const supabase = supabaseBrowser;

