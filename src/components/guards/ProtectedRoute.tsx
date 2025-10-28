import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('ceo' | 'cto' | 'admin' | 'staff')[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, profile, loading, profileReady } = useAuth();
  const location = useLocation();
  const cookieRole = getCookie('role') as 'ceo' | 'cto' | 'admin' | 'staff' | null;

  const effectiveRole = profile?.role || cookieRole;

  if (loading || !profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    const defaultPath = effectiveRole === 'ceo' || effectiveRole === 'admin' ? '/ceod/home' : '/ctod/home';
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}
