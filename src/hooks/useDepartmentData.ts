import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DepartmentUpload {
  id: string;
  org_id: string;
  uploaded_by: string;
  department: 'concierge' | 'sales' | 'operations' | 'finance' | 'saudemax';
  file_name: string;
  file_size: number;
  row_count: number;
  rows_imported: number;
  rows_failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
  validation_errors: { errors?: string[] } | null;
  batch_id: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentStats {
  totalUploads: number;
  completedUploads: number;
  failedUploads: number;
  pendingUploads: number;
  totalRowsImported: number;
  totalRowsFailed: number;
  successRate: number;
  recentUploads: DepartmentUpload[];
}

export function useDepartmentData(department?: string) {
  const queryClient = useQueryClient();

  const { data: uploads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['department-uploads', department],
    queryFn: async () => {
      let query = supabase
        .from('department_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DepartmentUpload[];
    },
  });

  const stats: DepartmentStats = {
    totalUploads: uploads.length,
    completedUploads: uploads.filter(u => u.status === 'completed' || u.status === 'approved').length,
    failedUploads: uploads.filter(u => u.status === 'failed').length,
    pendingUploads: uploads.filter(u => u.status === 'pending' || u.status === 'processing').length,
    totalRowsImported: uploads.reduce((sum, u) => sum + (u.rows_imported || 0), 0),
    totalRowsFailed: uploads.reduce((sum, u) => sum + (u.rows_failed || 0), 0),
    successRate: uploads.length > 0
      ? (uploads.filter(u => u.status === 'completed' || u.status === 'approved').length / uploads.length) * 100
      : 0,
    recentUploads: uploads.slice(0, 5),
  };

  const approveUpload = useMutation({
    mutationFn: async (uploadId: string) => {
      const { error } = await supabase
        .from('department_uploads')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', uploadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-uploads'] });
    },
  });

  const rejectUpload = useMutation({
    mutationFn: async ({ uploadId, reason }: { uploadId: string; reason: string }) => {
      const { error } = await supabase
        .from('department_uploads')
        .update({
          status: 'rejected',
          notes: reason,
        })
        .eq('id', uploadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-uploads'] });
    },
  });

  return {
    uploads,
    stats,
    isLoading,
    error,
    refetch,
    approveUpload,
    rejectUpload,
  };
}
