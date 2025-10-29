import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useRoleBasedRedirect() {
  const { profile, loading, profileReady } = useAuth();
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profileReady && profile) {
      const role = profile.role?.toLowerCase();
      const currentPath = location.pathname;

      if (role === 'ceo' && !currentPath.startsWith('/ceod') && !currentPath.startsWith('/shared')) {
        setRedirectPath('/ceod/home');
      } else if (role === 'cto' && !currentPath.startsWith('/ctod') && !currentPath.startsWith('/shared')) {
        setRedirectPath('/ctod/home');
      } else {
        setRedirectPath(null);
      }
    }
  }, [profile, loading, profileReady, location.pathname]);

  return {
    redirectPath,
    isLoading: loading || !profileReady
  };
}

export function useCurrentProfile() {
  const { profile, loading, profileReady } = useAuth();
  return { data: profile, isLoading: loading || !profileReady };
}

export function useResources(filters?: { workspaceId?: string }) {
  return useQuery({
    queryKey: ['resources', filters?.workspaceId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.workspaceId) {
          query = query.eq('workspace_id', filters.workspaceId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !filters?.workspaceId || !!filters.workspaceId,
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

export function useSharedContent(filters?: { visibility?: string; role?: string }) {
  const [content, setContent] = useState<any[]>([]);
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
    } catch (error: any) {
      console.error('Error granting access:', error);
      return { success: false, message: error.message };
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
    } catch (error: any) {
      console.error('Error revoking access:', error);
      return { success: false, message: error.message };
    }
  };
}

export function useResourceACL(resourceId: string) {
  const [acl, setAcl] = useState<any[]>([]);
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
      const updates: any = {
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
    } catch (error: any) {
      console.error('Error updating visibility:', error);
      return { success: false, message: error.message };
    }
  };
}
