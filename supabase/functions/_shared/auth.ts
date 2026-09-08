import { createClient } from 'npm:@supabase/supabase-js';

export function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  return { userClient, authHeader };
}

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}
