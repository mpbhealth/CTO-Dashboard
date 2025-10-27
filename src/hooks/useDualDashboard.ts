import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentProfile,
  getOrCreateWorkspace,
  createResource,
  updateResourceVisibility,
  grantResourceAccess,
  revokeResourceAccess,
  getResourceACL,
  listResources,
  uploadFile,
  getSignedUrl,
  getAuditLogs,
  type Profile,
  type Workspace,
  type Resource,
  type ResourceACL,
  type AuditLog,
  type WorkspaceKind,
  type ResourceType,
  type Visibility,
} from '../lib/dualDashboard';

export function useCurrentProfile() {
  return useQuery({
    queryKey: ['profile', 'current'],
    queryFn: async () => {
      console.log('useCurrentProfile: Starting profile fetch...');
      try {
        const profile = await getCurrentProfile();
        console.log('useCurrentProfile: Profile fetched:', profile);
        return profile;
      } catch (error) {
        console.error('useCurrentProfile: Error fetching profile:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkspace(orgId: string, kind: WorkspaceKind, name: string) {
  return useQuery({
    queryKey: ['workspace', orgId, kind],
    queryFn: () => getOrCreateWorkspace(orgId, kind, name),
    enabled: !!orgId,
  });
}

export function useResources(filters: {
  workspaceId?: string;
  type?: ResourceType;
  visibility?: Visibility;
}) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () => listResources(filters),
  });
}

export function useResourceACL(resourceId: string) {
  return useQuery({
    queryKey: ['resource-acl', resourceId],
    queryFn: () => getResourceACL(resourceId),
    enabled: !!resourceId,
  });
}

export function useAuditLogs(filters?: {
  resourceId?: string;
  action?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceId, visibility }: { resourceId: string; visibility: Visibility }) =>
      updateResourceVisibility(resourceId, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useGrantAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resourceId,
      granteeProfileId,
      canRead,
      canWrite,
    }: {
      resourceId: string;
      granteeProfileId: string;
      canRead?: boolean;
      canWrite?: boolean;
    }) => grantResourceAccess(resourceId, granteeProfileId, canRead, canWrite),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resource-acl', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useRevokeAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceId, granteeProfileId }: { resourceId: string; granteeProfileId: string }) =>
      revokeResourceAccess(resourceId, granteeProfileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resource-acl', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      workspaceKind,
      resourceId,
    }: {
      file: File;
      workspaceKind: WorkspaceKind;
      resourceId?: string;
    }) => uploadFile(file, workspaceKind, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useSignedUrl(storageKey: string | null, bucket: string) {
  return useQuery({
    queryKey: ['signed-url', storageKey, bucket],
    queryFn: () => (storageKey ? getSignedUrl(storageKey, bucket) : null),
    enabled: !!storageKey,
    staleTime: 3000000,
  });
}

export function useRoleBasedRedirect() {
  const { data: profile, isLoading } = useCurrentProfile();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.role === 'ceo') {
        setRedirectPath('/ceod/home');
      } else if (profile.role === 'cto') {
        setRedirectPath('/ctod/home');
      } else if (profile.role === 'admin') {
        setRedirectPath('/ctod/home');
      } else {
        setRedirectPath('/ctod/home');
      }
    }
  }, [profile, isLoading]);

  return { redirectPath, profile, isLoading };
}
