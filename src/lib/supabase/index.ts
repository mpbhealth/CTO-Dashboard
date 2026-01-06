/**
 * Supabase Client Exports
 * 
 * Provides unified exports for Supabase clients (Vite/React)
 */

export { createClient as createBrowserClient, supabaseBrowser, isSupabaseConfigured } from './client';

// Re-export the existing supabase client for backward compatibility
// This allows existing code to continue using `import { supabase } from '@/lib/supabase'`
import { supabaseBrowser } from './client';
export const supabase = supabaseBrowser;

// Role-based route access mapping (moved from middleware for client-side use)
export const roleRouteAccess: Record<string, string[]> = {
  '/ceo': ['ceo', 'cfo', 'cmo', 'admin'],
  '/cto': ['cto', 'admin', 'staff'],
  '/orbit': ['ceo', 'cto', 'admin', 'staff'],
  '/tickets': ['ceo', 'cto', 'admin', 'staff'],
  '/settings': ['ceo', 'cto', 'admin', 'staff'],
  '/admin': ['admin'],
};

// Check if user's role has access to a path
export function hasRoleAccess(pathname: string, role: string): boolean {
  const matchingRoute = Object.keys(roleRouteAccess).find((route) =>
    pathname.startsWith(route)
  );

  if (!matchingRoute) {
    return true;
  }

  const allowedRoles = roleRouteAccess[matchingRoute];
  return allowedRoles.includes(role.toLowerCase());
}

