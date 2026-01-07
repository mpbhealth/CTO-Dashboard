import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Dashboard context for filtering links
 */
export type DashboardContext = 'ceo' | 'cto' | 'global';

/**
 * External project link type
 */
export interface ExternalLink {
  id: string;
  user_id: string;
  name: string;
  url: string;
  icon: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  dashboard_context: DashboardContext;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create/Update external link payload
 */
export interface ExternalLinkInput {
  name: string;
  url: string;
  icon?: string;
  description?: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
  open_in_new_tab?: boolean;
  dashboard_context?: DashboardContext;
  thumbnail_url?: string;
}

/**
 * Default external links for new users
 */
const defaultExternalLinks: ExternalLink[] = [];

/**
 * Fetch external links for the current user, optionally filtered by dashboard context
 */
async function fetchExternalLinks(
  userId: string, 
  dashboardContext?: DashboardContext
): Promise<ExternalLink[]> {
  try {
    // First try with dashboard_context filter (if column exists)
    let query = supabase
      .from('external_project_links')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    // Filter by dashboard context if provided
    if (dashboardContext) {
      // Include links for the specific dashboard OR global links
      query = query.or(`dashboard_context.eq.${dashboardContext},dashboard_context.eq.global,dashboard_context.is.null`);
    }
    
    let { data, error } = await query.order('sort_order', { ascending: true });

    // If error mentions dashboard_context column, retry without the filter
    // This handles cases where the migration hasn't been applied yet
    if (error && error.message?.includes('dashboard_context')) {
      console.warn('dashboard_context column not found, fetching all links');
      const fallbackQuery = supabase
        .from('external_project_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      const fallbackResult = await fallbackQuery.order('sort_order', { ascending: true });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.warn('Error fetching external links:', error.message);
      return defaultExternalLinks;
    }

    // Ensure dashboard_context has a default value for older records
    const normalizedData = (data || []).map(link => ({
      ...link,
      dashboard_context: link.dashboard_context || 'global',
      thumbnail_url: link.thumbnail_url || null,
    }));

    return normalizedData as ExternalLink[];
  } catch (err) {
    console.warn('Failed to fetch external links:', err);
    return defaultExternalLinks;
  }
}

/**
 * Hook to manage external project links for the command dock and Command Center
 * 
 * @param dashboardContext - Optional filter for CEO/CTO specific links
 * @returns Object containing external links, loading state, and CRUD functions
 * 
 * @example
 * ```tsx
 * // Get all links (for dock)
 * const { externalLinks } = useExternalLinks();
 * 
 * // Get CEO-specific links (for Command Center)
 * const { externalLinks } = useExternalLinks('ceo');
 * 
 * // Add a new link
 * await addLink({ name: 'GitHub', url: 'https://github.com', icon: 'Github', dashboard_context: 'cto' });
 * 
 * // Update a link
 * await updateLink('link-id', { name: 'New Name' });
 * 
 * // Delete a link
 * await deleteLink('link-id');
 * 
 * // Reorder links
 * await reorderLinks(['link-1', 'link-2', 'link-3']);
 * ```
 */
export function useExternalLinks(dashboardContext?: DashboardContext) {
  const { user, profileReady } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['external-links', user?.id, dashboardContext];

  // Fetch external links
  const {
    data: externalLinks = defaultExternalLinks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchExternalLinks(user!.id, dashboardContext),
    enabled: profileReady && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Add link mutation
  const addMutation = useMutation({
    mutationFn: async (input: ExternalLinkInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get max sort order
      const maxOrder = externalLinks.length > 0 
        ? Math.max(...externalLinks.map((l) => l.sort_order)) 
        : -1;

      // Try with new columns first
      let { data, error } = await supabase
        .from('external_project_links')
        .insert({
          user_id: user.id,
          name: input.name,
          url: input.url,
          icon: input.icon || 'Globe',
          description: input.description || null,
          category: input.category || 'general',
          sort_order: input.sort_order ?? maxOrder + 1,
          is_active: input.is_active ?? true,
          open_in_new_tab: input.open_in_new_tab ?? true,
          dashboard_context: input.dashboard_context || dashboardContext || 'global',
          thumbnail_url: input.thumbnail_url || null,
        })
        .select()
        .single();

      // Retry without new columns if they don't exist yet
      if (error && (error.message?.includes('dashboard_context') || error.message?.includes('thumbnail_url'))) {
        console.warn('New columns not found, inserting without them');
        const fallbackResult = await supabase
          .from('external_project_links')
          .insert({
            user_id: user.id,
            name: input.name,
            url: input.url,
            icon: input.icon || 'Globe',
            description: input.description || null,
            category: input.category || 'general',
            sort_order: input.sort_order ?? maxOrder + 1,
            is_active: input.is_active ?? true,
            open_in_new_tab: input.open_in_new_tab ?? true,
          })
          .select()
          .single();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;
      return data as ExternalLink;
    },
    onSuccess: () => {
      // Invalidate all external links queries to refresh everywhere
      queryClient.invalidateQueries({ queryKey: ['external-links'] });
    },
  });

  // Update link mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ExternalLinkInput> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Build update object with new columns
      const updateData = {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.url !== undefined && { url: input.url }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
        ...(input.open_in_new_tab !== undefined && { open_in_new_tab: input.open_in_new_tab }),
        ...(input.dashboard_context !== undefined && { dashboard_context: input.dashboard_context }),
        ...(input.thumbnail_url !== undefined && { thumbnail_url: input.thumbnail_url }),
      };

      let { data, error } = await supabase
        .from('external_project_links')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      // Retry without new columns if they don't exist yet
      if (error && (error.message?.includes('dashboard_context') || error.message?.includes('thumbnail_url'))) {
        console.warn('New columns not found, updating without them');
        const fallbackData = {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.url !== undefined && { url: input.url }),
          ...(input.icon !== undefined && { icon: input.icon }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
          ...(input.is_active !== undefined && { is_active: input.is_active }),
          ...(input.open_in_new_tab !== undefined && { open_in_new_tab: input.open_in_new_tab }),
        };
        const fallbackResult = await supabase
          .from('external_project_links')
          .update(fallbackData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;
      return data as ExternalLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-links'] });
    },
  });

  // Delete link mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('external_project_links')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-links'] });
    },
  });

  // Reorder links mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Update sort order for each link
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('external_project_links')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);
    },
    onMutate: async (orderedIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previousLinks = queryClient.getQueryData<ExternalLink[]>(queryKey);

      if (previousLinks) {
        const reorderedLinks = orderedIds
          .map((id, index) => {
            const link = previousLinks.find((l) => l.id === id);
            if (!link) return null;
            return { ...link, sort_order: index };
          })
          .filter((link): link is ExternalLink => link !== null);

        queryClient.setQueryData(queryKey, reorderedLinks);
      }

      return { previousLinks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(queryKey, context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['external-links'] });
    },
  });

  return {
    externalLinks,
    isLoading,
    error,
    refetch,
    addLink: addMutation.mutateAsync,
    updateLink: (id: string, input: Partial<ExternalLinkInput>) => 
      updateMutation.mutateAsync({ id, input }),
    deleteLink: deleteMutation.mutateAsync,
    reorderLinks: reorderMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
