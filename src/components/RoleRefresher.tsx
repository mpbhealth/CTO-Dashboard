import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function RoleRefresher() {
  const { user, profile, refreshRole } = useAuth();

  useEffect(() => {
    if (user && !profile) {
      console.log('[RoleRefresher] User exists but no profile, refreshing role');
      refreshRole();
    }
  }, [user, profile, refreshRole]);

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find((s) => s.startsWith('role='));

    if (user && !roleCookie) {
      console.log('[RoleRefresher] User authenticated but no role cookie, refreshing');
      refreshRole();
    }
  }, [user, refreshRole]);

  return null;
}
