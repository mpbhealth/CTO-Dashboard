import { Navigate, useLocation } from 'react-router-dom';
import { type UserRole } from '../../lib/dualDashboard';
import { useCurrentProfile } from '../../hooks/useDualDashboard';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const location = useLocation();
  const { data: profile, isLoading } = useCurrentProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const role = profile?.role;

  if (!role || !allowedRoles.includes(role)) {
    const defaultRedirect = role === 'ceo' ? '/ceod/home' : '/ctod/home';
    return <Navigate to={redirectTo || defaultRedirect} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

interface CEOOnlyProps {
  children: React.ReactNode;
}

export function CEOOnly({ children }: CEOOnlyProps) {
  return (
    <RoleGuard allowedRoles={['ceo', 'admin']} redirectTo="/ctod/home">
      {children}
    </RoleGuard>
  );
}

interface CTOOnlyProps {
  children: React.ReactNode;
}

export function CTOOnly({ children }: CTOOnlyProps) {
  return (
    <RoleGuard allowedRoles={['cto', 'admin', 'staff']} redirectTo="/ceod/home">
      {children}
    </RoleGuard>
  );
}
