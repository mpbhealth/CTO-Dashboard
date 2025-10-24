import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentProfile, type UserRole } from '../../lib/dualDashboard';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkRole = async () => {
      const profile = await getCurrentProfile();
      setRole(profile?.role || null);
      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

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
