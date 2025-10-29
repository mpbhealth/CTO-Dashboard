import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Record {
  id: string;
  org_id: string | null;
  owner_id: string;
  record_type: 'kpi' | 'report' | 'note' | 'dashboard' | 'file' | 'campaign' | 'task';
  visibility: 'private' | 'org' | 'shared';
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface RecordShare {
  id: string;
  record_id: string;
  target_role?: 'ceo' | 'cto' | 'admin' | 'staff';
  target_user?: string;
  can_edit: boolean;
  granted_by: string;
  granted_at?: string;
}

export function useRecords(filters?: {
  record_type?: string;
  visibility?: string;
  owner_id?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['records', filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.record_type) {
        query = query.eq('record_type', filters.record_type);
      }

      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Record[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecord(recordId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['record', recordId],
    queryFn: async () => {
      if (!user || !recordId) return null;

      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      if (error) throw error;
      return data as Record | null;
    },
    enabled: !!user && !!recordId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (record: Omit<Record, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'org_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('records')
        .insert({
          ...record,
          owner_id: user.id,
          org_id: profile?.org_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Record> }) => {
      const { data, error } = await supabase
        .from('records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Record;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['record', data.id] });
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useRecordShares(recordId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['record_shares', recordId],
    queryFn: async () => {
      if (!user || !recordId) return [];

      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          profiles:target_user (
            id,
            email,
            display_name,
            role
          )
        `)
        .eq('record_id', recordId)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as (RecordShare & { profiles?: { id: string; email: string; display_name?: string; role?: string } })[];
    },
    enabled: !!user && !!recordId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useShareRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (share: {
      record_id: string;
      target_role?: 'ceo' | 'cto' | 'admin' | 'staff';
      target_user?: string;
      can_edit?: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('record_shares')
        .insert({
          ...share,
          can_edit: share.can_edit || false,
          granted_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('records')
        .update({ visibility: 'shared' })
        .eq('id', share.record_id);

      return data as RecordShare;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['record_shares', data.record_id] });
      queryClient.invalidateQueries({ queryKey: ['record', data.record_id] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useUnshareRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, recordId }: { shareId: string; recordId: string }) => {
      const { error } = await supabase
        .from('record_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      const { data: remainingShares } = await supabase
        .from('record_shares')
        .select('id')
        .eq('record_id', recordId);

      if (!remainingShares || remainingShares.length === 0) {
        await supabase
          .from('records')
          .update({ visibility: 'private' })
          .eq('id', recordId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['record_shares', variables.recordId] });
      queryClient.invalidateQueries({ queryKey: ['record', variables.recordId] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useUpdateRecordVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, visibility }: { recordId: string; visibility: 'private' | 'org' | 'shared' }) => {
      const { data, error } = await supabase
        .from('records')
        .update({ visibility })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data as Record;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['record', data.id] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}
