import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Environment variables for Supabase connection
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client for use in Server Components
 * 
 * This client is used in:
 * - Server Components
 * - Route Handlers
 * - Server Actions
 * 
 * @returns Supabase server client with cookie handling
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = createClient();
 *   const { data } = await supabase.from('apps').select('*');
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle cookies in read-only contexts (Server Components)
          // This is expected in Server Components that don't have write access
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookies in read-only contexts
        }
      },
    },
  });
}

