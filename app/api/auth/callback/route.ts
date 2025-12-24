import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth Callback Route Handler
 * 
 * Handles OAuth callbacks from Supabase authentication:
 * - Exchanges auth code for session
 * - Sets session cookies
 * - Redirects to appropriate dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user profile to determine redirect
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        const role = profile?.role || 'staff';
        const isCEORole = ['ceo', 'cfo', 'cmo', 'admin'].includes(role.toLowerCase());
        const defaultRedirect = isCEORole ? '/ceo' : '/cto';

        return NextResponse.redirect(new URL(next === '/' ? defaultRedirect : next, request.url));
      }
    }
  }

  // Return to login on error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
}

