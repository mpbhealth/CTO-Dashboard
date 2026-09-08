import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { categories, cosNavigationItems } from '@/config/navigation';

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

function navigationApps(): App[] {
  const now = new Date().toISOString();
  const rows: App[] = [];
  let sort_order = 0;

  for (const item of cosNavigationItems) {
    rows.push({
      id: `nav-${item.id}`,
      key: item.id,
      name: item.label,
      description: categories[item.category] || item.label,
      category: categories[item.category] || item.category,
      icon: 'LayoutDashboard',
      href: item.path,
      kind: 'internal',
      open_mode: 'same_tab',
      sort_order: sort_order++,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    item.submenu?.forEach((sub) => {
      rows.push({
        id: `nav-${sub.id}`,
        key: sub.id,
        name: `${item.label} · ${sub.label}`,
        description: sub.label,
        category: categories[item.category] || item.category,
        icon: 'LayoutDashboard',
        href: sub.path,
        kind: 'internal',
        open_mode: 'same_tab',
        sort_order: sort_order++,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    });
  }

  return rows;
}

const defaultApps: App[] = navigationApps();

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

