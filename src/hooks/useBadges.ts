import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Badge count for an app
 */
interface BadgeCount {
  app_key: string;
  count: number;
  updated_at: string;
}

/**
 * Fetch badge counts for the current user
 */
async function fetchBadges(userId: string): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('app_key, count')
      .eq('user_id', userId);

    if (error) {
      console.warn('Error fetching badges:', error.message);
      return new Map();
    }

    const badgeMap = new Map<string, number>();
    (data as BadgeCount[])?.forEach((badge) => {
      if (badge.count > 0) {
        badgeMap.set(badge.app_key, badge.count);
      }
    });

    return badgeMap;
  } catch (err) {
    console.warn('Failed to fetch badges:', err);
    return new Map();
  }
}

/**
 * Hook to get badge counts for the dock
 * 
 * Phase 1 implementation - returns stub data
 * Will be enhanced with realtime subscriptions in Phase 2
 * 
 * @returns Object containing badge counts map and loading state
 * 
 * @example
 * ```tsx
 * const { badges, isLoading } = useBadges();
 * 
 * // Get badge count for an app
 * const ticketCount = badges.get('tickets') || 0;
 * ```
 */
export function useBadges() {
  const { user, profileReady } = useAuth();

  const {
    data: badges = new Map<string, number>(),
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: () => fetchBadges(user!.id),
    enabled: profileReady && !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  return {
    badges,
    isLoading,
    error,
    refetch,
    getBadge: (appKey: string) => badges.get(appKey) || 0,
  };
}

