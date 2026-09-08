import { Navigate, useLocation } from 'react-router-dom';
import { type UserRole } from '../../lib/dualDashboard';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const location = useLocation();
  const { profile, loading, profileReady } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!profileReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const role = (profile?.role || 'cos') as UserRole;

  if (!allowedRoles.includes(role) && !allowedRoles.includes('cos')) {
    const targetPath = redirectTo || '/home';

    // If we're already on the target path, show a simple access denied instead of rendering protected children
    if (location.pathname === targetPath) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <p className="text-gray-700 font-medium">Access denied.</p>
            <p className="text-gray-500 text-sm">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }

    return <Navigate to={targetPath} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

interface CEOOnlyProps {
  children: React.ReactNode;
}

export function CEOOnly({ children }: CEOOnlyProps) {
  return (
    <RoleGuard allowedRoles={['cos']}>
      {children}
    </RoleGuard>
  );
}

interface CTOOnlyProps {
  children: React.ReactNode;
}

export function CTOOnly({ children }: CTOOnlyProps) {
  return (
    <RoleGuard allowedRoles={['cos']}>
      {children}
    </RoleGuard>
  );
}
