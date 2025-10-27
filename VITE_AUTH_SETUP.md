# Supabase Role-Based Authentication - Vite Implementation

## Overview
This project now includes a complete Supabase role-based authentication system designed specifically for Vite + React Router applications.

## Architecture

### Core Components

**1. AuthContext** (`src/contexts/AuthContext.tsx`)
- Manages user authentication state and role information
- Automatically syncs role data from Supabase `profiles` table
- Stores role and display_name in cookies for quick access
- Provides `useAuth()` hook for accessing auth state throughout the app

**2. ProtectedRoute** (`src/components/guards/ProtectedRoute.tsx`)
- Wraps routes to enforce authentication and role-based access control
- Redirects unauthenticated users to `/login`
- Redirects users to appropriate dashboards based on their role
- Supports `allowedRoles` prop to restrict access to specific roles

**3. AuthCallback** (`src/components/pages/AuthCallback.tsx`)
- Handles Supabase authentication redirects
- Fetches user profile and role from database
- Sets authentication cookies
- Redirects users to role-appropriate dashboards

## Configuration

### Environment Variables
Ensure these are set in your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

**1. Database Schema**
Your `profiles` table should have:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `role` (text, values: 'ceo', 'cto', 'admin', 'staff')
- `display_name` (text, nullable)
- `org_id` (uuid, nullable)

**2. Authentication Redirect URL**
In your Supabase dashboard, add this redirect URL:
```
http://localhost:5173/auth/callback
https://yourdomain.com/auth/callback
```

**3. Row Level Security (RLS)**
Ensure your `profiles` table has proper RLS policies to allow users to read their own profile data.

## Usage

### Login Flow
1. User authenticates via Supabase (email/password, OAuth, etc.)
2. Supabase redirects to `/auth/callback`
3. AuthCallback component:
   - Fetches user profile and role
   - Sets cookies for role and display_name
   - Redirects to appropriate dashboard:
     - CEO → `/ceod/home`
     - CTO → `/ctod/home`
     - Staff → `/staff/home`

### Accessing Auth State
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, role, loading, signOut, refreshRole } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {profile?.display_name}</p>
      <p>Role: {role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protecting Routes
```typescript
// Protect a route for authenticated users only
<Route
  path="/dashboard/*"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Restrict to specific roles
<Route
  path="/ceod/*"
  element={
    <ProtectedRoute allowedRoles={['ceo', 'admin']}>
      <CEODashboard />
    </ProtectedRoute>
  }
/>
```

## Role-Based Redirects

Users are automatically redirected to their appropriate dashboard:
- **CEO** → `/ceod/home`
- **CTO** → `/ctod/home`
- **Admin** → Can access both CEO and CTO dashboards
- **Staff** → `/staff/home`

If a user tries to access a route they don't have permission for, they're automatically redirected to their default dashboard.

## Cookie Management

The system uses cookies to cache role information:
- `role`: User's role (ceo/cto/admin/staff)
- `display_name`: User's display name
- Cookies expire after 24 hours
- Automatically cleared on sign out

## Current Implementation Status

✅ Authentication context with role management
✅ Protected route components with role guards
✅ Auth callback handler for Supabase redirects
✅ Role-based route protection in main router
✅ Automatic role-based dashboard redirects
✅ Cookie-based role caching
✅ Build verification completed

## Migration Notes

### Removed Components
The following Next.js-specific files were removed as they're incompatible with Vite:
- `app/api/auth/callback/route.ts` → Replaced with `AuthCallback` component
- `app/api/session/refresh-role/route.ts` → Integrated into `AuthContext`
- `middleware.ts` → Replaced with `ProtectedRoute` component guards
- `app/layout.tsx` → Vite uses React Router, not Next.js App Router
- All duplicate "copy" files

### Key Differences from Next.js
- **No API Routes**: Authentication logic runs client-side using Supabase JS client
- **No Middleware**: Route protection handled by React components
- **No Server Components**: Everything is client-side rendered
- **Cookies Set Client-Side**: Using `document.cookie` instead of Next.js Response API

## Security Considerations

1. **RLS Policies**: Ensure proper Row Level Security on all tables
2. **Client-Side Auth**: Auth state is managed client-side but validated against Supabase
3. **Token Security**: Supabase handles JWT token management automatically
4. **HTTPS Required**: Always use HTTPS in production for secure cookie transmission

## Troubleshooting

**Issue: User not redirected after login**
- Check that redirect URL is configured in Supabase dashboard
- Verify `/auth/callback` route is properly registered

**Issue: Role not updating**
- Call `refreshRole()` from `useAuth()` hook
- Check that profiles table has correct `user_id` foreign key

**Issue: Infinite redirect loop**
- Ensure login page doesn't require authentication
- Check that public routes are properly excluded from ProtectedRoute

## Next Steps

1. Implement your login page component
2. Test authentication flow with real Supabase credentials
3. Add role management UI for admins
4. Implement session refresh logic for long-running sessions
5. Add error boundaries for authentication failures
