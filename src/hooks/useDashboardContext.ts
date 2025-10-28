import { useLocation } from 'react-router-dom';
import { useCurrentProfile } from './useDualDashboard';

export type DashboardType = 'cto' | 'ceo' | 'shared';
export type ViewingContext = 'ceo' | 'cto' | 'shared';

export interface DashboardContext {
  dashboardType: DashboardType;
  viewingContext: ViewingContext;
  isCEO: boolean;
  isCTO: boolean;
  isShared: boolean;
  isViewingCrossContent: boolean;
  profile: any;
  isLoading: boolean;
}

export function useDashboardContext(): DashboardContext {
  const location = useLocation();
  const { data: profile, isLoading } = useCurrentProfile();

  const userRole = profile?.role;
  const isCEOUser = userRole === 'ceo' || userRole === 'admin';
  const isCTOUser = userRole === 'cto' || userRole === 'staff';

  const dashboardType: DashboardType = isCEOUser ? 'ceo' : isCTOUser ? 'cto' : 'cto';

  const viewingContext: ViewingContext = location.pathname.startsWith('/ceo')
    ? 'ceo'
    : location.pathname.startsWith('/ceod')
    ? 'ceo'
    : location.pathname.startsWith('/ctod')
    ? 'cto'
    : location.pathname.startsWith('/shared')
    ? 'shared'
    : 'cto';

  const isViewingCrossContent =
    (isCEOUser && viewingContext === 'cto') ||
    (isCTOUser && viewingContext === 'ceo');

  return {
    dashboardType,
    viewingContext,
    isCEO: isCEOUser,
    isCTO: isCTOUser,
    isShared: viewingContext === 'shared',
    isViewingCrossContent,
    profile: profile || null,
    isLoading,
  };
}
