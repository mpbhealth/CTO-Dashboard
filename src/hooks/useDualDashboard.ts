import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useRoleBasedRedirect() {
  const { profile, loading, profileReady } = useAuth();
  const location = useLocation();

  const result = useMemo(() => {
    // Still loading auth state
    if (loading || !profileReady) {
      return {
        redirectPath: null,
        isLoading: true
      };
    }

    // Profile ready but null/no profile - treat as staff/CTO by default, don't keep loading
    const role = profile?.role?.toLowerCase() || 'staff';
    const currentPath = location.pathname;

    // Define allowed paths that don't require role-based redirect
    const isPublicPath = currentPath.startsWith('/login') || 
                         currentPath.startsWith('/auth/') ||
                         currentPath.startsWith('/public/') ||
                         currentPath.startsWith('/diagnostics');
    
    const isSharedPath = currentPath.startsWith('/shared') || 
                         currentPath.startsWith('/admin');

    // Don't redirect from public or shared paths
    if (isPublicPath || isSharedPath) {
      return { redirectPath: null, isLoading: false };
    }

    let redirectPath: string | null = null;

    // Handle root path
    const isCEORole = ['ceo', 'cfo', 'cmo', 'admin'].includes(role);
    const isCTORole = ['cto', 'manager', 'staff', 'member'].includes(role);

    if (currentPath === '/' || currentPath === '') {
      redirectPath = isCEORole ? '/ceod/home' : '/ctod/home';
    }
    // CEO-ish roles on CTO routes should redirect to CEO dashboard
    // Admin is excluded to allow access to both dashboards
    else if (isCEORole && role !== 'admin' && currentPath.startsWith('/ctod')) {
      redirectPath = '/ceod/home';
    }
    // CTO-ish roles on CEO routes should redirect to CTO dashboard
    else if (isCTORole && currentPath.startsWith('/ceod')) {
      redirectPath = '/ctod/home';
    }
    // Admin can access both dashboards - no redirect needed

    return {
      redirectPath,
      isLoading: false
    };
  }, [profile, profileReady, loading, location.pathname]);

  return result;
}

export function useCurrentProfile() {
  const { profile, loading, profileReady } = useAuth();
  return { data: profile, isLoading: loading || !profileReady };
}

export function useResources(filters?: { workspaceId?: string }) {
  return useQuery({
    queryKey: ['resources', filters?.workspaceId],
    queryFn: async () => {
      if (!filters?.workspaceId) {
        return [];
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let query = supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
          .abortSignal(controller.signal);

        if (filters.workspaceId) {
          query = query.eq('workspace_id', filters.workspaceId);
        }

        const { data, error } = await query;

        clearTimeout(timeoutId);

        if (error) {
          if (error.code === 'PGRST116' || error.code === '42P01') {
            return [];
          }
          if (error.code === 'PGRST301') {
            return [];
          }
          if (error.code === '500' || error.message?.includes('500')) {
            return [];
          }
          return [];
        }
        return data || [];
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return [];
        }
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!filters?.workspaceId,
    retry: 1,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useWorkspace(orgId?: string, kind?: string, name?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workspace', orgId, kind],
    queryFn: async () => {
      if (!orgId || !kind) return null;

      try {
        // Try to find existing workspace
        const { data: existing, error: fetchError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('org_id', orgId)
          .eq('kind', kind)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (existing) return existing;

        // Create workspace if it doesn't exist and name is provided
        if (name && user) {
          const { data: newWorkspace, error: createError } = await supabase
            .from('workspaces')
            .insert({
              org_id: orgId,
              kind,
              name,
              owner_profile_id: user.id
            })
            .select()
            .maybeSingle();

          if (createError) throw createError;
          return newWorkspace;
        }

        return null;
      } catch (error) {
        console.error('Error with workspace:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!orgId && !!kind,
  });
}

interface SharedContent {
  id: string;
  title: string;
  content?: string;
  visibility: string;
  target_role?: string;
  created_at: string;
  updated_at: string;
}

export function useSharedContent(filters?: { visibility?: string; role?: string }) {
  const [content, setContent] = useState<SharedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        let query = supabase.from('shared_content').select('*');

        if (filters?.visibility) {
          query = query.eq('visibility', filters.visibility);
        }

        if (filters?.role) {
          query = query.eq('target_role', filters.role);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setContent(data || []);
      } catch (error) {
        console.error('Error fetching shared content:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [filters?.visibility, filters?.role]);

  return { content, loading };
}

export function useGrantAccess() {
  return async (resourceId: string, userId: string, accessLevel: string) => {
    try {
      const { error } = await supabase
        .from('resource_access')
        .insert([{
          resource_id: resourceId,
          user_id: userId,
          access_level: accessLevel,
          granted_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, message: 'Access granted successfully' };
    } catch (error) {
      console.error('Error granting access:', error);
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred' };
    }
  };
}

export function useRevokeAccess() {
  return async (resourceId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('resource_access')
        .delete()
        .eq('resource_id', resourceId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, message: 'Access revoked successfully' };
    } catch (error) {
      console.error('Error revoking access:', error);
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred' };
    }
  };
}

interface ResourceACL {
  id: string;
  resource_id: string;
  user_id: string;
  access_level: string;
  granted_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
}

export function useResourceACL(resourceId: string) {
  const [acl, setAcl] = useState<ResourceACL[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchACL() {
      if (!resourceId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('resource_access')
          .select(`
            *,
            profiles:user_id (
              id,
              email,
              full_name,
              role
            )
          `)
          .eq('resource_id', resourceId)
          .order('granted_at', { ascending: false});

        if (error) throw error;
        setAcl(data || []);
      } catch (error) {
        console.error('Error fetching resource ACL:', error);
        setAcl([]);
      } finally {
        setLoading(false);
      }
    }
    fetchACL();
  }, [resourceId]);

  return { acl, loading };
}

export function useUpdateVisibility() {
  return async (resourceId: string, visibility: string, targetRole?: string) => {
    try {
      const updates: Record<string, string> = {
        visibility,
        updated_at: new Date().toISOString()
      };

      if (targetRole) {
        updates.target_role = targetRole;
      }

      const { error } = await supabase
        .from('shared_content')
        .update(updates)
        .eq('id', resourceId);

      if (error) throw error;
      return { success: true, message: 'Visibility updated successfully' };
    } catch (error) {
      console.error('Error updating visibility:', error);
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred' };
    }
  };
}
