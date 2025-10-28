import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useRoleBasedRedirect() {
  const { profile, loading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile) {
      const role = profile.role?.toLowerCase();
      const currentPath = window.location.pathname;

      if (role === 'ceo' && !currentPath.startsWith('/ceod') && !currentPath.startsWith('/shared')) {
        setRedirectPath('/ceod/home');
      } else if (role === 'cto' && !currentPath.startsWith('/ctod') && !currentPath.startsWith('/shared')) {
        setRedirectPath('/ctod/home');
      } else {
        setRedirectPath(null);
      }
    }
  }, [profile, loading]);

  return {
    redirectPath,
    isLoading: loading
  };
}

export function useCurrentProfile() {
  const { profile, loading } = useAuth();
  return { profile, loading };
}

export function useResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const { data, error } = await supabase
          .from('shared_resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, []);

  return { resources, loading };
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchWorkspace() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setWorkspace(data);
      } catch (error) {
        console.error('Error fetching workspace:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspace();
  }, [user]);

  return { workspace, loading };
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
