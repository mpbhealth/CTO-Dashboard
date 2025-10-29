import { ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

  const effectiveRole = useMemo(() => profile?.role as 'ceo' | 'cto' | 'admin' | 'staff' | undefined, [profile?.role]);

  if (loading) {
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

  if (!profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    const defaultPath = effectiveRole === 'ceo' ? '/ceod/home' : effectiveRole === 'admin' ? '/ctod/home' : '/ctod/home';
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}
