import { supabase } from './supabase';
import { logger } from './logger';

export type WorkspaceKind = 'CTO' | 'CEO' | 'SHARED';
export type ResourceType = 'file' | 'doc' | 'kpi' | 'campaign' | 'note' | 'task' | 'dashboard';
export type Visibility = 'private' | 'shared_to_cto' | 'shared_to_ceo' | 'org_public';
export type UserRole = 'cto' | 'ceo' | 'admin' | 'staff';

export interface Profile {
  user_id: string;
  org_id: string;
  display_name: string | null;
  role: UserRole;
  email?: string;
  full_name?: string;
}

export interface Workspace {
  id: string;
  org_id: string;
  name: string;
  kind: WorkspaceKind;
  owner_profile_id: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  org_id: string;
  workspace_id: string;
  type: ResourceType;
  title: string | null;
  meta: Record<string, any>;
  visibility: Visibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceACL {
  id: number;
  resource_id: string;
  grantee_profile_id: string;
  can_read: boolean;
  can_write: boolean;
  created_at: string;
}

export interface FileMetadata {
  id: string;
  resource_id: string;
  storage_key: string;
  size_bytes: number | null;
  mime: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  org_id: string;
  actor_profile_id: string | null;
  action: string;
  resource_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    logger.debug('Starting profile fetch');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      logger.error('Auth error in getCurrentProfile', authError);
      return null;
    }

    if (!user) {
      logger.warn('No authenticated user found');
      return null;
    }

    logger.debug('Authenticated user', { id: user.id, email: user.email });

    // Query with simplified field selection - only columns that exist in the table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    logger.debug('Profile query result', { hasData: !!data, hasError: !!error });

    if (error) {
      logger.error('Error fetching profile', error);
      return null;
    }

    if (!data) {
      // If profile doesn't exist, try to create it
      logger.info('No profile found, creating from auth metadata');

      const role = (user.user_metadata?.role || 'staff') as 'cto' | 'ceo' | 'admin' | 'staff';
      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

      logger.debug('Creating profile', { role, displayName, user_id: user.id });

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: displayName,
          display_name: displayName,
          role: role,
          org_id: '00000000-0000-0000-0000-000000000000'
        })
        .select('user_id, email, full_name, display_name, role, org_id')
        .maybeSingle();

      if (insertError) {
        logger.error('Failed to create profile', insertError);
        return null;
      }

      if (!newProfile) {
        logger.error('No profile returned after insert');
        return null;
      }

      logger.info('Profile created successfully', { role: newProfile.role, email: newProfile.email });
      return newProfile;
    }

    logger.info('Profile found successfully', { role: data.role, email: data.email });
    return data;
  } catch (err) {
    logger.error('Unexpected error in getCurrentProfile', err);
    return null;
  }
}

export async function getOrCreateWorkspace(
  orgId: string,
  kind: WorkspaceKind,
  name: string
): Promise<Workspace | null> {
  const { data: existing } = await supabase
    .from('workspaces')
    .select('*')
    .eq('org_id', orgId)
    .eq('kind', kind)
    .maybeSingle();

  if (existing) return existing;

  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      org_id: orgId,
      kind,
      name,
      owner_profile_id: profile.user_id
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating workspace', error);
    return null;
  }

  return data;
}

export async function createResource(params: {
  workspaceId: string;
  type: ResourceType;
  title: string;
  meta?: Record<string, any>;
  visibility?: Visibility;
}): Promise<Resource | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { data, error } = await supabase
    .from('resources')
    .insert({
      org_id: profile.org_id,
      workspace_id: params.workspaceId,
      type: params.type,
      title: params.title,
      meta: params.meta || {},
      visibility: params.visibility || 'private',
      created_by: profile.user_id
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating resource', error);
    return null;
  }

  await logAudit({
    action: 'create',
    resourceId: data.id,
    details: { type: params.type, title: params.title }
  });

  return data;
}

export async function updateResourceVisibility(
  resourceId: string,
  visibility: Visibility
): Promise<boolean> {
  const { error } = await supabase
    .from('resources')
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq('id', resourceId);

  if (error) {
    logger.error('Error updating visibility', error);
    return false;
  }

  await logAudit({
    action: 'update_visibility',
    resourceId,
    details: { visibility }
  });

  return true;
}

export async function grantResourceAccess(
  resourceId: string,
  granteeProfileId: string,
  canRead: boolean = true,
  canWrite: boolean = false
): Promise<boolean> {
  const { error } = await supabase
    .from('resource_acl')
    .insert({
      resource_id: resourceId,
      grantee_profile_id: granteeProfileId,
      can_read: canRead,
      can_write: canWrite
    });

  if (error) {
    logger.error('Error granting access', error);
    return false;
  }

  await logAudit({
    action: 'grant_access',
    resourceId,
    details: { grantee: granteeProfileId, canRead, canWrite }
  });

  return true;
}

export async function revokeResourceAccess(
  resourceId: string,
  granteeProfileId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('resource_acl')
    .delete()
    .eq('resource_id', resourceId)
    .eq('grantee_profile_id', granteeProfileId);

  if (error) {
    logger.error('Error revoking access', error);
    return false;
  }

  await logAudit({
    action: 'revoke_access',
    resourceId,
    details: { grantee: granteeProfileId }
  });

  return true;
}

export async function getResourceACL(resourceId: string): Promise<ResourceACL[]> {
  const { data, error } = await supabase
    .from('resource_acl')
    .select('*')
    .eq('resource_id', resourceId);

  if (error) {
    logger.error('Error fetching ACL', error);
    return [];
  }

  return data || [];
}

export async function listResources(filters: {
  workspaceId?: string;
  type?: ResourceType;
  visibility?: Visibility;
}): Promise<Resource[]> {
  let query = supabase.from('resources').select('*');

  if (filters.workspaceId) {
    query = query.eq('workspace_id', filters.workspaceId);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.visibility) {
    query = query.eq('visibility', filters.visibility);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Error listing resources', error);
    return [];
  }

  return data || [];
}

export async function uploadFile(
  file: File,
  workspaceKind: WorkspaceKind,
  resourceId?: string
): Promise<{ resource: Resource; fileMetadata: FileMetadata } | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const bucket = workspaceKind === 'CTO' ? 'ctod' : workspaceKind === 'CEO' ? 'ceod' : 'shared';
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${Date.now()}-${file.name}`;
  const storagePath = `${timestamp}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file);

  if (uploadError) {
    logger.error('Error uploading file', uploadError);

    // Provide specific error messages for common issues
    if (uploadError.message?.includes('row-level security')) {
      console.error('[PRODUCTION ERROR] Error uploading file: StorageApiError: new row violates row-level security policy');
      alert('Upload failed: Permission denied. Please contact your administrator if this persists.');
    } else if (uploadError.message?.includes('violates foreign key')) {
      console.error('[PRODUCTION ERROR] Error uploading file: Foreign key constraint violation');
      alert('Upload failed: Invalid configuration. Please refresh the page and try again.');
    } else {
      console.error('[PRODUCTION ERROR] Error uploading file:', uploadError);
      alert(`Upload failed: ${uploadError.message || 'Unknown error'}`);
    }

    return null;
  }

  let resource: Resource | null = null;

  if (resourceId) {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .maybeSingle();
    resource = data;
  } else {
    const workspace = await getOrCreateWorkspace(
      profile.org_id,
      workspaceKind,
      `${workspaceKind} Workspace`
    );

    if (!workspace) {
      await supabase.storage.from(bucket).remove([storagePath]);
      return null;
    }

    resource = await createResource({
      workspaceId: workspace.id,
      type: 'file',
      title: file.name,
      meta: { size: file.size, mime: file.type }
    });
  }

  if (!resource) {
    await supabase.storage.from(bucket).remove([storagePath]);
    return null;
  }

  const { data: fileMetadata, error: fileError } = await supabase
    .from('files')
    .insert({
      resource_id: resource.id,
      storage_key: storagePath,
      size_bytes: file.size,
      mime: file.type
    })
    .select()
    .single();

  if (fileError) {
    logger.error('Error creating file metadata', fileError);
    await supabase.storage.from(bucket).remove([storagePath]);
    return null;
  }

  await logAudit({
    action: 'upload',
    resourceId: resource.id,
    details: { fileName: file.name, size: file.size }
  });

  return { resource, fileMetadata };
}

export async function getSignedUrl(
  storageKey: string,
  bucket: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storageKey, 3600);

  if (error) {
    logger.error('Error creating signed URL', error);
    return null;
  }

  await logAudit({
    action: 'download',
    resourceId: null,
    details: { storageKey, bucket }
  });

  return data.signedUrl;
}

export async function logAudit(params: {
  action: string;
  resourceId?: string | null;
  details?: Record<string, any>;
}): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    actor_profile_id: profile.user_id,
    action: params.action,
    resource_id: params.resourceId || null,
    details: params.details || null
  });
}

export async function getAuditLogs(filters?: {
  resourceId?: string;
  action?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.resourceId) {
    query = query.eq('resource_id', filters.resourceId);
  }
  if (filters?.action) {
    query = query.eq('action', filters.action);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching audit logs', error);
    return [];
  }

  return data || [];
}
