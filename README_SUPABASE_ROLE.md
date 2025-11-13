# Supabase Auth Role Wiring Pack (Rebuilt)

1) Copy these files into your project (keep paths).
2) Ensure env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
3) After Supabase login, redirect to /api/auth/callback (sets the role cookie & redirects to CEO/CTO home).
4) Middleware gates /ceod/* and /ctod/* based on the cookie. Layout brands header + nav by role.
5) If cookie missing, RoleRefresher calls /api/session/refresh-role to sync it from the session.
