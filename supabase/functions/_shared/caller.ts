import { requireUser } from './auth.ts';

export function isServiceRole(req: Request): boolean {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return !!token && !!service && token === service;
}

export async function requireCaller(req: Request): Promise<{ userId: string | null; service: boolean }> {
  if (isServiceRole(req)) {
    return { userId: null, service: true };
  }
  const { userClient } = requireUser(req);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return { userId: user.id, service: false };
}
