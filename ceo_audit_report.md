# CEO Dashboard Audit — 2025-10-28T19:50:18.220340Z
**Project root:** `/mnt/data/audit_ceo_project/project`

## Framework Structure
- `app/` present: **False**
- `pages/` present: **False**
- Potential conflict (app + pages): **False**

## Key Files
- package.json: FOUND (/mnt/data/audit_ceo_project/project/package.json)
- next.config.js: MISSING (/mnt/data/audit_ceo_project/project/next.config.js)
- next.config.mjs: MISSING (/mnt/data/audit_ceo_project/project/next.config.mjs)
- tsconfig.json: FOUND (/mnt/data/audit_ceo_project/project/tsconfig.json)
- env.example: FOUND (/mnt/data/audit_ceo_project/project/.env.example)
- env.local: MISSING (/mnt/data/audit_ceo_project/project/.env.local)
- middleware.ts: MISSING (/mnt/data/audit_ceo_project/project/app/middleware.ts)
- middleware.js: MISSING (/mnt/data/audit_ceo_project/project/app/middleware.js)

## package.json Scripts
```json
{
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "transform:build": "npm run build --prefix csv-enrollment-transformer",
  "transform:run": "node csv-enrollment-transformer/dist/transform.js --input csv-enrollment-transformer/input.csv --output csv-enrollment-transformer/output.csv",
  "transform:test": "vitest run",
  "test:e2e": "playwright test",
  "link:check": "node ./scripts/link-check.mjs http://localhost:3000"
}
```

## Dependencies (head)
```
@eslint/js: ^9.9.1
@playwright/test: ^1.56.1
@supabase/auth-helpers-nextjs: ^0.10.0
@supabase/supabase-js: ^2.39.0
@tanstack/react-query: ^5.83.0
@types/crypto-js: ^4.2.2
@types/node: ^22.8.1
@types/papaparse: ^5.3.16
@types/react: ^18.3.5
@types/react-dom: ^18.3.0
@vitejs/plugin-react: ^4.3.1
autoprefixer: ^10.4.18
crypto-js: ^4.2.0
csv-parse: ^5.5.6
csv-stringify: ^6.4.6
dayjs: ^1.11.13
eslint: ^9.9.1
eslint-plugin-react-hooks: ^5.1.0-rc.0
eslint-plugin-react-refresh: ^0.4.11
file-saver: ^2.0.5
framer-motion: ^10.16.16
globals: ^15.9.0
jsdom: ^24.1.3
jspdf: ^3.0.3
jspdf-autotable: ^5.0.2
... (truncated)
```

## Route Tree (app/, depth≤4)
_No app/ directory tree to show._

## CEO Artifacts
- CEO files detected: **0**

## Role Guard Indicators
```
src/lib/exportClient.ts
src/lib/dualDashboard.ts
src/contexts/AuthContext.tsx
src/components/Sidebar.tsx
src/components/FileUpload.tsx
src/components/layouts/CTODashboardLayout.tsx
src/components/modals/AddQuickLinkModal.tsx
src/components/pages/AuthDiagnostics.tsx
src/components/pages/AuthWrapper.tsx
src/components/pages/AuthCallback.tsx
src/components/pages/Login.tsx
src/components/pages/Forbidden.tsx
src/components/pages/ctod/CTOHome.tsx
src/components/pages/ceod/CEODepartmentUpload.tsx
src/components/guards/ProtectedRoute.tsx
src/components/guards/RoleGuard.tsx
src/hooks/useDualDashboard.ts
```

## Duplicate/Conflict Signals
- Provider files: 0
- Layout files under app/: 0

## ErrorBoundary & Suspense Usage
- Files mentioning ErrorBoundary: 3
- Files using <Suspense>: 4
  - src/main.tsx
  - src/components/pages/ceod/CEOHome.tsx
  - src/components/ceo/ErrorBoundary.tsx
  - src/DualDashboardApp.tsx
  - src/App.tsx
  - src/components/pages/OrganizationalStructure.tsx
  - src/components/pages/ceod/CEOHome.tsx

## White Screen Risk Flags
- Missing package.json scripts: start
- No app/middleware file found; role-based route guarding for /ceo may be client-only.

## High-Impact Fix Checklist

- [ ] Ensure server-side role redirect to `/ceo` post-login; add middleware guard for `/ceo/**`.
- [ ] Eliminate duplicate providers/layouts; centralize in `app/providers.tsx`.
- [ ] Add global ErrorBoundary around CEO layout; ensure each panel has loading/error states.
- [ ] Create `.env.example` and validate critical env vars at startup.
- [ ] Convert CEO data fetching to server components or route handlers; add Suspense fallbacks.
- [ ] Verify `pnpm build && pnpm start` succeeds locally; fix type/lint errors.
- [ ] Add tests for redirects, guards, and panel rendering with mocked data.
