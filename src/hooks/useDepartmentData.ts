import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DepartmentUpload {
  id: string;
  org_id: string;
  uploaded_by: string;
  department: string;
  file_name: string;
  file_size: number;
  row_count: number;
  rows_imported: number;
  rows_failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
  validation_errors?: any;
  batch_id: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DepartmentStats {
  totalUploads: number;
  completedUploads: number;
  failedUploads: number;
  pendingUploads: number;
  successRate: number;
  totalRowsImported: number;
}

const defaultStats: DepartmentStats = {
  totalUploads: 0,
  completedUploads: 0,
  failedUploads: 0,
  pendingUploads: 0,
  successRate: 0,
  totalRowsImported: 0,
};

export function useDepartmentData(departmentName?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch uploads for the department
  const {
    data: uploads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['department-uploads', departmentName, profile?.org_id],
    queryFn: async () => {
      if (!departmentName || !profile?.org_id) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('department_uploads')
          .select('*')
          .eq('department', departmentName)
          .eq('org_id', profile.org_id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching department uploads:', error);
          return [];
        }

        return (data || []) as DepartmentUpload[];
      } catch (err) {
        console.error('Exception fetching department uploads:', err);
        return [];
      }
    },
    enabled: !!departmentName && !!profile?.org_id,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: 1000,
  });

  // Calculate stats from uploads
  const stats: DepartmentStats = uploads.reduce(
    (acc, upload) => {
      acc.totalUploads++;

      if (upload.status === 'completed' || upload.status === 'approved') {
        acc.completedUploads++;
      } else if (upload.status === 'failed') {
        acc.failedUploads++;
      } else if (upload.status === 'pending' || upload.status === 'processing') {
        acc.pendingUploads++;
      }

      acc.totalRowsImported += upload.rows_imported || 0;

      return acc;
    },
    { ...defaultStats }
  );

  // Calculate success rate
  if (stats.totalUploads > 0) {
    stats.successRate = (stats.completedUploads / stats.totalUploads) * 100;
  }

  // Mutation to approve an upload
  const approveUpload = useMutation({
    mutationFn: async (uploadId: string) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('department_uploads')
        .update({
          status: 'approved',
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', uploadId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['department-uploads'] });
    },
    onError: (error) => {
      console.error('Error approving upload:', error);
    },
  });

  return {
    uploads,
    stats,
    isLoading,
    error,
    refetch,
    approveUpload,
  };
}
