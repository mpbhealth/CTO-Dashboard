import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
}

/**
 * Default external links for new users
 */
const defaultExternalLinks: ExternalLink[] = [];

/**
 * Fetch external links for the current user
 */
async function fetchExternalLinks(userId: string): Promise<ExternalLink[]> {
  try {
    const { data, error } = await supabase
      .from('external_project_links')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching external links:', error.message);
      return defaultExternalLinks;
    }

    return (data as ExternalLink[]) || defaultExternalLinks;
  } catch (err) {
    console.warn('Failed to fetch external links:', err);
    return defaultExternalLinks;
  }
}

/**
 * Hook to manage external project links for the command dock
 * 
 * @returns Object containing external links, loading state, and CRUD functions
 * 
 * @example
 * ```tsx
 * const { externalLinks, addLink, updateLink, deleteLink, reorderLinks } = useExternalLinks();
 * 
 * // Add a new link
 * await addLink({ name: 'GitHub', url: 'https://github.com', icon: 'Github' });
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
export function useExternalLinks() {
  const { user, profileReady } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['external-links', user?.id];

  // Fetch external links
  const {
    data: externalLinks = defaultExternalLinks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchExternalLinks(user!.id),
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

      const { data, error } = await supabase
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

      if (error) throw error;
      return data as ExternalLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update link mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ExternalLinkInput> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('external_project_links')
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.url !== undefined && { url: input.url }),
          ...(input.icon !== undefined && { icon: input.icon }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
          ...(input.is_active !== undefined && { is_active: input.is_active }),
          ...(input.open_in_new_tab !== undefined && { open_in_new_tab: input.open_in_new_tab }),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as ExternalLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
      queryClient.invalidateQueries({ queryKey });
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
      queryClient.invalidateQueries({ queryKey });
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

