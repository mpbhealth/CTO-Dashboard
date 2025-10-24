# Role Routing & CEO Branding Fix

## What this does
- Sets and reads a `role` cookie (`ceo` | `cto` | `admin` | `staff`) to route the user to the correct dashboard.
- Middleware enforces access to `/ceod/*` and `/ctod/*` based on the cookie.
- `layout.tsx` sets a `data-role` attribute for CSS theming and updates the header label (e.g., "CEO Dashboard — Catherine Okubo").

## How to use
1. Copy `middleware.ts`, `app/api/session/set-role/route.ts`, and `app/layout.tsx` into your project.
2. After login, call `POST /api/session/set-role` with `{ role: "ceo" }` for Catherine, or `{ role: "cto" }` for you.
   - Or temporarily use `GET /api/auth/callback?uid=...&role=ceo` to set the cookie and redirect.
3. Ensure your login success handler redirects to `/api/auth/callback` (or set the cookie directly).

## Notes
- Replace the placeholder callback with your real Supabase/NextAuth profile lookup and set the cookie accordingly.
- Navigation and pages will pick up the `data-role` to switch theme and labels.
