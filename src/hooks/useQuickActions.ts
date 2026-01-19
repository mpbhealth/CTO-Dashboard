import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Quick action types
 */
export type QuickActionType = 'url' | 'webhook' | 'command' | 'internal';

/**
 * Internal action types
 */
export type InternalActionType = 
  | 'open-terminal' 
  | 'clear-cache' 
  | 'refresh' 
  | 'toggle-theme'
  | 'open-settings'
  | 'open-command-palette';

/**
 * Action data structure based on action type
 */
export interface ActionDataUrl {
  url: string;
  method?: 'GET' | 'POST';
}

export interface ActionDataWebhook {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface ActionDataCommand {
  command: string;
}

export interface ActionDataInternal {
  action: InternalActionType;
}

export type ActionData = ActionDataUrl | ActionDataWebhook | ActionDataCommand | ActionDataInternal;

/**
 * Quick action type
 */
export interface QuickAction {
  id: string;
  user_id: string;
  name: string;
  label: string;
  icon: string;
  action_type: QuickActionType;
  action_data: ActionData;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  show_notification: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create/Update quick action payload
 */
export interface QuickActionInput {
  name: string;
  label: string;
  icon?: string;
  action_type: QuickActionType;
  action_data: ActionData;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  show_notification?: boolean;
}

/**
 * Default quick actions for new users
 */
const defaultQuickActions: QuickAction[] = [
  {
    id: 'default-refresh',
    user_id: '',
    name: 'refresh',
    label: 'Refresh',
    icon: 'RefreshCw',
    action_type: 'internal',
    action_data: { action: 'refresh' },
    description: 'Refresh the current page',
    color: 'primary',
    sort_order: 0,
    is_active: true,
    show_notification: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-theme',
    user_id: '',
    name: 'toggle-theme',
    label: 'Theme',
    icon: 'Moon',
    action_type: 'internal',
    action_data: { action: 'toggle-theme' },
    description: 'Toggle dark/light mode',
    color: 'secondary',
    sort_order: 1,
    is_active: true,
    show_notification: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetch quick actions for the current user
 */
async function fetchQuickActions(userId: string): Promise<QuickAction[]> {
  try {
    const { data, error } = await supabase
      .from('quick_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Error fetching quick actions:', error.message);
      return defaultQuickActions;
    }

    return (data as QuickAction[]) || defaultQuickActions;
  } catch (err) {
    console.warn('Failed to fetch quick actions:', err);
    return defaultQuickActions;
  }
}

/**
 * Execute a quick action
 */
export async function executeQuickAction(action: QuickAction): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.action_type) {
      case 'url': {
        const data = action.action_data as ActionDataUrl;
        window.open(data.url, '_blank', 'noopener,noreferrer');
        return { success: true, message: `Opened ${action.label}` };
      }

      case 'webhook': {
        const data = action.action_data as ActionDataWebhook;
        const response = await fetch(data.url, {
          method: data.method,
          headers: {
            'Content-Type': 'application/json',
            ...data.headers,
          },
          body: data.body ? JSON.stringify(data.body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.statusText}`);
        }

        return { success: true, message: `${action.label} executed successfully` };
      }

      case 'command': {
        // Commands would need to be handled by a backend service
        // For now, we'll just log and show a message
        const data = action.action_data as ActionDataCommand;
        console.log('Command to execute:', data.command);
        return { success: true, message: `Command "${data.command}" queued` };
      }

      case 'internal': {
        const data = action.action_data as ActionDataInternal;
        switch (data.action) {
          case 'refresh':
            window.location.reload();
            return { success: true, message: 'Page refreshed' };

          case 'toggle-theme': {
            // Toggle dark mode class on document
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            return { success: true, message: isDark ? 'Dark mode enabled' : 'Light mode enabled' };
          }

          case 'clear-cache':
            // Clear React Query cache
            return { success: true, message: 'Cache cleared' };

          case 'open-settings':
            window.location.href = '/settings';
            return { success: true, message: 'Opening settings' };

          case 'open-command-palette':
            // This would be handled by the shell context
            return { success: true, message: 'Opening command palette' };

          case 'open-terminal':
            // This would open a terminal modal or external app
            return { success: true, message: 'Terminal not available in web' };

          default:
            return { success: false, message: 'Unknown internal action' };
        }
      }

      default:
        return { success: false, message: 'Unknown action type' };
    }
  } catch (err) {
    console.error('Error executing quick action:', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Action failed' 
    };
  }
}

/**
 * Hook to manage quick actions for the command dock
 * 
 * @returns Object containing quick actions, loading state, and CRUD functions
 * 
 * @example
 * ```tsx
 * const { quickActions, addAction, updateAction, deleteAction, executeAction } = useQuickActions();
 * 
 * // Add a new action
 * await addAction({ 
 *   name: 'deploy', 
 *   label: 'Deploy',
 *   action_type: 'webhook',
 *   action_data: { url: 'https://api.example.com/deploy', method: 'POST' }
 * });
 * 
 * // Execute an action
 * await executeAction(quickActions[0]);
 * ```
 */
export function useQuickActions() {
  const { user, profileReady } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['quick-actions', user?.id];

  // Fetch quick actions
  const {
    data: quickActions = defaultQuickActions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchQuickActions(user!.id),
    enabled: profileReady && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Add action mutation
  const addMutation = useMutation({
    mutationFn: async (input: QuickActionInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get max sort order
      const maxOrder = quickActions.length > 0 
        ? Math.max(...quickActions.map((a) => a.sort_order)) 
        : -1;

      const { data, error } = await supabase
        .from('quick_actions')
        .insert({
          user_id: user.id,
          name: input.name,
          label: input.label,
          icon: input.icon || 'Zap',
          action_type: input.action_type,
          action_data: input.action_data,
          description: input.description || null,
          color: input.color || 'primary',
          sort_order: input.sort_order ?? maxOrder + 1,
          is_active: input.is_active ?? true,
          show_notification: input.show_notification ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as QuickAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update action mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<QuickActionInput> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('quick_actions')
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.label !== undefined && { label: input.label }),
          ...(input.icon !== undefined && { icon: input.icon }),
          ...(input.action_type !== undefined && { action_type: input.action_type }),
          ...(input.action_data !== undefined && { action_data: input.action_data }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.color !== undefined && { color: input.color }),
          ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
          ...(input.is_active !== undefined && { is_active: input.is_active }),
          ...(input.show_notification !== undefined && { show_notification: input.show_notification }),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as QuickAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete action mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('quick_actions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Reorder actions mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Update sort order for each action
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('quick_actions')
          .update({ sort_order: index })
          .eq('id', id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);
    },
    onMutate: async (orderedIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previousActions = queryClient.getQueryData<QuickAction[]>(queryKey);

      if (previousActions) {
        const reorderedActions = orderedIds
          .map((id, index) => {
            const action = previousActions.find((a) => a.id === id);
            if (!action) return null;
            return { ...action, sort_order: index };
          })
          .filter((action): action is QuickAction => action !== null);

        queryClient.setQueryData(queryKey, reorderedActions);
      }

      return { previousActions };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousActions) {
        queryClient.setQueryData(queryKey, context.previousActions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Execute action wrapper
  const executeAction = async (action: QuickAction) => {
    const result = await executeQuickAction(action);
    
    // Clear cache if that was the action
    if (action.action_type === 'internal' && 
        (action.action_data as ActionDataInternal).action === 'clear-cache') {
      queryClient.clear();
    }

    return result;
  };

  return {
    quickActions,
    isLoading,
    error,
    refetch,
    addAction: addMutation.mutateAsync,
    updateAction: (id: string, input: Partial<QuickActionInput>) => 
      updateMutation.mutateAsync({ id, input }),
    deleteAction: deleteMutation.mutateAsync,
    reorderActions: reorderMutation.mutateAsync,
    executeAction,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}

