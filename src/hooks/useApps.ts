import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * App type from the apps directory
 */
export interface App {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  href: string;
  kind: 'internal' | 'external' | 'embedded';
  open_mode: 'same_tab' | 'new_tab';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Default apps when database is not available
 */
const defaultApps: App[] = [
  {
    id: 'default-ceo',
    key: 'ceo-home',
    name: 'CEO Dashboard',
    description: 'Executive overview and KPIs',
    category: 'Executive',
    icon: 'LayoutDashboard',
    href: '/ceo',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-cto',
    key: 'cto-home',
    name: 'CTO Dashboard',
    description: 'Technology and engineering metrics',
    category: 'Executive',
    icon: 'Terminal',
    href: '/cto',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-orbit',
    key: 'orbit',
    name: 'MPB Orbit',
    description: 'Task and project management',
    category: 'Operations',
    icon: 'Orbit',
    href: '/orbit',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-tickets',
    key: 'tickets',
    name: 'IT Support',
    description: 'Support ticket management',
    category: 'Operations',
    icon: 'Ticket',
    href: '/tickets',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-analytics',
    key: 'analytics',
    name: 'Analytics',
    description: 'Business intelligence',
    category: 'Analytics',
    icon: 'BarChart3',
    href: '/ceo/analytics',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-compliance',
    key: 'compliance',
    name: 'Compliance',
    description: 'HIPAA compliance dashboard',
    category: 'Compliance',
    icon: 'ShieldCheck',
    href: '/cto/compliance',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-settings',
    key: 'settings',
    name: 'Settings',
    description: 'App preferences',
    category: 'System',
    icon: 'Settings',
    href: '/settings',
    kind: 'internal',
    open_mode: 'same_tab',
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetch accessible apps for the current user
 * Apps are filtered by RLS based on user's role
 */
async function fetchApps(): Promise<App[]> {
  try {
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching apps, using defaults:', error.message);
      return defaultApps;
    }

    return (data as App[]) || defaultApps;
  } catch (err) {
    console.warn('Failed to fetch apps, using defaults:', err);
    return defaultApps;
  }
}

/**
 * Hook to get all accessible apps for the current user
 * 
 * @returns Object containing apps array, loading state, and error
 * 
 * @example
 * ```tsx
 * const { apps, isLoading, error } = useApps();
 * ```
 */
export function useApps() {
  const { user, profileReady } = useAuth();

  const {
    data: apps = defaultApps,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['apps', user?.id],
    queryFn: fetchApps,
    enabled: profileReady,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });

  return {
    apps,
    isLoading,
    error,
    refetch,
  };
}

