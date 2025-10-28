import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrentProfile,
  getOrCreateWorkspace,
  listResources,
  createResource,
  updateResourceVisibility,
  type Profile,
  type Workspace,
  type Resource,
  type ResourceType,
  type Visibility,
} from '../lib/dualDashboard';

/**
 * Hook to get the current user's profile
 */
export function useCurrentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: getCurrentProfile,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get or create a workspace
 */
export function useWorkspace(orgId: string, name: string, displayName: string) {
  return useQuery({
    queryKey: ['workspace', orgId, name],
    queryFn: () => getOrCreateWorkspace(orgId, name, displayName),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to list resources with optional filters
 */
export function useResources(filters?: {
  workspaceId?: string;
  resourceType?: ResourceType;
  visibility?: Visibility;
}) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () => listResources(filters || {}),
    enabled: !!profile,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to create a new resource
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      workspaceId: string;
      resourceType: ResourceType;
      name: string;
      description?: string;
      visibility?: Visibility;
      metadata?: Record<string, any>;
    }) => createResource(params),
    onSuccess: () => {
      // Invalidate resources query to refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

/**
 * Hook to update resource visibility
 */
export function useUpdateResourceVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resourceId,
      visibility,
    }: {
      resourceId: string;
      visibility: Visibility;
    }) => updateResourceVisibility(resourceId, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

/**
 * Hook for role-based redirect logic
 */
export function useRoleBasedRedirect() {
  const { profile, loading } = useAuth();

  let redirectPath: string | null = null;

  if (!loading && profile) {
    const currentPath = window.location.pathname;

    // If on root or login, redirect based on role
    if (currentPath === '/' || currentPath === '/login') {
      redirectPath =
        profile.role === 'ceo' || profile.role === 'admin'
          ? '/ceod/home'
          : '/ctod/home';
    }
  }

  return {
    redirectPath,
    isLoading: loading,
  };
}
