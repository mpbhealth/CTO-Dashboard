import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Environment variables for Supabase connection
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client for use in Next.js middleware
 * 
 * This client handles:
 * - Session refresh
 * - Cookie updates
 * - Auth state synchronization
 * 
 * @param request - Next.js request object
 * @returns Object containing Supabase client and response
 */
export async function createMiddlewareClient(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Set cookie on the request for Server Components
        request.cookies.set({
          name,
          value,
          ...options,
        });
        // Set cookie on the response for the browser
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  return { supabase, response };
}

/**
 * Checks if a path is public (doesn't require authentication)
 */
export function isPublicPath(pathname: string): boolean {
  // In development, allow access without auth for demo purposes
  // TODO: Remove this in production
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return true; // Allow all routes in development
  }

  const publicPaths = [
    '/login',
    '/auth/callback',
    '/public',
    '/api/health',
    '/_next',
    '/favicon',
    '/icons',
    '/manifest.json',
  ];

  return publicPaths.some((path) => pathname.startsWith(path));
}

/**
 * Role-based route access mapping
 */
export const roleRouteAccess: Record<string, string[]> = {
  '/ceo': ['ceo', 'cfo', 'cmo', 'admin'],
  '/cto': ['cto', 'admin', 'staff'],
  '/orbit': ['ceo', 'cto', 'admin', 'staff'],
  '/tickets': ['ceo', 'cto', 'admin', 'staff'],
  '/settings': ['ceo', 'cto', 'admin', 'staff'],
  '/admin': ['admin'],
};

/**
 * Check if user's role has access to a path
 */
export function hasRoleAccess(pathname: string, role: string): boolean {
  // Find the matching route prefix
  const matchingRoute = Object.keys(roleRouteAccess).find((route) =>
    pathname.startsWith(route)
  );

  if (!matchingRoute) {
    // No specific access rules, allow by default
    return true;
  }

  const allowedRoles = roleRouteAccess[matchingRoute];
  return allowedRoles.includes(role.toLowerCase());
}

