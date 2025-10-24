import { useLocation } from 'react-router-dom';
import { useCurrentProfile } from './useDualDashboard';

export type DashboardType = 'cto' | 'ceo' | 'shared';

export interface DashboardContext {
  dashboardType: DashboardType;
  isCEO: boolean;
  isCTO: boolean;
  isShared: boolean;
  profile: any;
  isLoading: boolean;
}

export function useDashboardContext(): DashboardContext {
  const location = useLocation();
  const { data: profile, isLoading } = useCurrentProfile();

  const dashboardType: DashboardType = location.pathname.startsWith('/ceo')
    ? 'ceo'
    : location.pathname.startsWith('/ceod')
    ? 'ceo'
    : location.pathname.startsWith('/shared')
    ? 'shared'
    : 'cto';

  return {
    dashboardType,
    isCEO: dashboardType === 'ceo',
    isCTO: dashboardType === 'cto',
    isShared: dashboardType === 'shared',
    profile: profile || null,
    isLoading,
  };
}
