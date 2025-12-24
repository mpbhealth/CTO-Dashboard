import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useApps, App } from './useApps';

/**
 * User app pin record
 */
interface UserAppPin {
  user_id: string;
  app_id: string;
  sort_order: number;
  is_pinned: boolean;
  created_at: string;
}

/**
 * Pinned app with full app data
 */
export interface PinnedApp extends App {
  pin_sort_order: number;
}

/**
 * Fetch pinned apps for the current user
 */
async function fetchPinnedApps(userId: string): Promise<UserAppPin[]> {
  try {
    const { data, error } = await supabase
      .from('user_app_pins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching pinned apps:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Failed to fetch pinned apps:', err);
    return [];
  }
}

/**
 * Hook to manage user's pinned apps on the dock
 * 
 * @returns Object containing pinned apps, loading state, and pin/unpin functions
 * 
 * @example
 * ```tsx
 * const { pinnedApps, pinApp, unpinApp, reorderPins } = usePinnedApps();
 * 
 * // Pin an app
 * await pinApp('app-id');
 * 
 * // Unpin an app
 * await unpinApp('app-id');
 * 
 * // Reorder pinned apps
 * await reorderPins(['app-1', 'app-2', 'app-3']);
 * ```
 */
export function usePinnedApps() {
  const { user, profileReady } = useAuth();
  const { apps } = useApps();
  const queryClient = useQueryClient();

  const queryKey = ['pinned-apps', user?.id];

  // Fetch pins
  const {
    data: pins = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchPinnedApps(user!.id),
    enabled: profileReady && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Combine pins with app data
  const pinnedApps: PinnedApp[] = pins
    .map((pin) => {
      const app = apps.find((a) => a.id === pin.app_id);
      if (!app) return null;
      return {
        ...app,
        pin_sort_order: pin.sort_order,
      };
    })
    .filter((app): app is PinnedApp => app !== null)
    .sort((a, b) => a.pin_sort_order - b.pin_sort_order);

  // Pin app mutation
  const pinMutation = useMutation({
    mutationFn: async (appId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get max sort order
      const maxOrder = pins.length > 0 ? Math.max(...pins.map((p) => p.sort_order)) : -1;

      const { error } = await supabase.from('user_app_pins').upsert({
        user_id: user.id,
        app_id: appId,
        sort_order: maxOrder + 1,
        is_pinned: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Unpin app mutation
  const unpinMutation = useMutation({
    mutationFn: async (appId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_app_pins')
        .update({ is_pinned: false })
        .eq('user_id', user.id)
        .eq('app_id', appId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Reorder pins mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedAppIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Update sort order for each app
      const updates = orderedAppIds.map((appId, index) => ({
        user_id: user.id,
        app_id: appId,
        sort_order: index,
        is_pinned: true,
      }));

      const { error } = await supabase.from('user_app_pins').upsert(updates);

      if (error) throw error;
    },
    onMutate: async (orderedAppIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previousPins = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        orderedAppIds.map((appId, index) => ({
          user_id: user!.id,
          app_id: appId,
          sort_order: index,
          is_pinned: true,
          created_at: new Date().toISOString(),
        }))
      );

      return { previousPins };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(queryKey, context.previousPins);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    pinnedApps,
    pins,
    isLoading,
    error,
    pinApp: pinMutation.mutateAsync,
    unpinApp: unpinMutation.mutateAsync,
    reorderPins: reorderMutation.mutateAsync,
    isPinning: pinMutation.isPending,
    isUnpinning: unpinMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}

