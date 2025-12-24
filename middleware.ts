import { NextResponse, type NextRequest } from 'next/server';
import {
  createMiddlewareClient,
  isPublicPath,
  hasRoleAccess,
} from '@/lib/supabase/middleware';

/**
 * Next.js Middleware for CommandOS
 * 
 * Handles:
 * - Session refresh on every request
 * - Auth protection for non-public routes
 * - Role-based route access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // Create Supabase client and refresh session
    const { supabase, response } = await createMiddlewareClient(request);

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get user profile for role checking
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const userRole = profile?.role || 'staff';

    // Check role-based access
    if (!hasRoleAccess(pathname, userRole)) {
      // Redirect to appropriate dashboard based on role
      const redirectPath = ['ceo', 'cfo', 'cmo'].includes(userRole.toLowerCase())
        ? '/ceo'
        : '/cto';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request to continue
    // The page itself will handle auth if needed
    return NextResponse.next();
  }
}

/**
 * Matcher configuration
 * Applies middleware to all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

