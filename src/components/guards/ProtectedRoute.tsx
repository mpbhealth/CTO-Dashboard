import { ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('cos' | 'ceo' | 'cto' | 'admin' | 'staff')[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, profile, loading, profileReady, isDemoMode } = useAuth();
  const location = useLocation();

  const effectiveRole = useMemo(() => (profile?.role || 'cos') as 'cos' | 'ceo' | 'cto' | 'admin' | 'staff', [profile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aryx-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-aryx-line border-t-aryx-accent mx-auto mb-4"></div>
          <p className="text-aryx-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aryx-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-aryx-line border-t-aryx-accent mx-auto mb-4"></div>
          <p className="text-aryx-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
