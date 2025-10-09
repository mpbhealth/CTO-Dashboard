import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  HIPAADoc,
  HIPAAEvidence,
  HIPAATask,
  HIPAAIncident,
  HIPAABAA,
  HIPAARisk,
  HIPAATraining,
  HIPAATrainingAttendance,
  HIPAAPHIAccess,
  HIFAAudit,
  AuditStatus,
  HIFAAuditLog,
  HIPAAContact,
  HIPAAPolicy,
  DashboardStats,
  FilterOptions,
} from '../types/compliance';

// =====================================================
// Audit Log Helper
// =====================================================

export const logAuditEvent = async (
  action: string,
  objectTable?: string,
  objectId?: string,
  details?: Record<string, any>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('hipaa_audit_log').insert({
    actor: user.id,
    actor_email: user.email,
    action,
    object_table: objectTable,
    object_id: objectId,
    details,
  });
};

// =====================================================
// Dashboard & Stats
// =====================================================

export const useComplianceDashboard = () => {
  return useQuery({
    queryKey: ['compliance', 'dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch policies stats
      const { data: docs } = await supabase
        .from('hipaa_docs')
        .select('status, section');

      const { data: policies } = await supabase
        .from('hipaa_policies')
        .select('next_review_date');

      // Fetch BAAs stats
      const { data: baas } = await supabase
        .from('hipaa_baas')
        .select('status, renewal_date');

      const now = new Date();
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      // Fetch incidents stats
      const { data: incidents } = await supabase
        .from('hipaa_incidents')
        .select('status, severity');

      // Fetch training stats
      const { data: trainings } = await supabase
        .from('hipaa_trainings')
        .select('id, frequency');

      const { data: attendance } = await supabase
        .from('hipaa_training_attendance')
        .select('training_id, completed_at');

      // Calculate stats
      const policiesApproved = docs?.filter(d => d.status === 'approved').length || 0;
      const policiesInReview = docs?.filter(d => d.status === 'in_review').length || 0;
      const policiesOverdue = policies?.filter(p => 
        p.next_review_date && new Date(p.next_review_date) < now
      ).length || 0;

      const baasActive = baas?.filter(b => b.status === 'active').length || 0;
      const baasExpiringSoon = baas?.filter(b => 
        b.renewal_date && new Date(b.renewal_date) <= sixtyDaysFromNow && new Date(b.renewal_date) > now
      ).length || 0;

      const incidentsOpen = incidents?.filter(i => 
        !['resolved', 'closed'].includes(i.status)
      ).length || 0;

      const incidentsBySeverity = {
        low: incidents?.filter(i => i.severity === 'low').length || 0,
        medium: incidents?.filter(i => i.severity === 'medium').length || 0,
        high: incidents?.filter(i => i.severity === 'high').length || 0,
        critical: incidents?.filter(i => i.severity === 'critical').length || 0,
      };

      const totalTrainings = trainings?.length || 0;
      const completedAttendance = attendance?.filter(a => a.completed_at).length || 0;
      const completionRate = totalTrainings > 0 
        ? Math.round((completedAttendance / totalTrainings) * 100)
        : 0;

      return {
        policies: {
          approved: policiesApproved,
          inReview: policiesInReview,
          overdue: policiesOverdue,
        },
        baas: {
          active: baasActive,
          expiringSoon: baasExpiringSoon,
        },
        incidents: {
          open: incidentsOpen,
          bySeverity: incidentsBySeverity,
        },
        training: {
          completionRate,
          onboardingComplete: 0, // Will calculate separately
          annualComplete: 0, // Will calculate separately
        },
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// =====================================================
// Documents
// =====================================================

export const useComplianceDocs = (filters?: FilterOptions) => {
  return useQuery({
    queryKey: ['compliance', 'docs', filters],
    queryFn: async () => {
      let query = supabase
        .from('hipaa_docs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.section && filters.section.length > 0) {
        query = query.in('section', filters.section);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIPAADoc[];
    },
  });
};

export const useComplianceDoc = (id: string) => {
  return useQuery({
    queryKey: ['compliance', 'docs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hipaa_docs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as HIPAADoc;
    },
    enabled: !!id,
  });
};

export const useCreateDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: Partial<HIPAADoc>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hipaa_docs')
        .insert({ ...doc, owner: user.id })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent('doc_created', 'hipaa_docs', data.id, { title: doc.title });

      return data as HIPAADoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'docs'] });
    },
  });
};

export const useUpdateDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HIPAADoc> }) => {
      const { data, error } = await supabase
        .from('hipaa_docs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent('doc_updated', 'hipaa_docs', id, updates);

      return data as HIPAADoc;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'docs'] });
      queryClient.invalidateQueries({ queryKey: ['compliance', 'docs', variables.id] });
    },
  });
};

export const useDeleteDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hipaa_docs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAuditEvent('doc_deleted', 'hipaa_docs', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'docs'] });
    },
  });
};

// =====================================================
// Tasks
// =====================================================

export const useTasks = (filters?: { assignee?: string; status?: string[] }) => {
  return useQuery({
    queryKey: ['compliance', 'tasks', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('hipaa_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (filters?.assignee) {
        query = query.eq('assignee', filters.assignee);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIPAATask[];
    },
  });
};

export const useMyTasks = () => {
  return useQuery({
    queryKey: ['compliance', 'my-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('hipaa_tasks')
        .select('*')
        .eq('assignee', user.id)
        .in('status', ['todo', 'in_progress', 'blocked'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as HIPAATask[];
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Partial<HIPAATask>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hipaa_tasks')
        .insert({ ...task, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent('task_created', 'hipaa_tasks', data.id, { title: task.title });

      return data as HIPAATask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance', 'my-tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HIPAATask> }) => {
      const { data, error } = await supabase
        .from('hipaa_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent('task_updated', 'hipaa_tasks', id, updates);

      return data as HIPAATask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance', 'my-tasks'] });
    },
  });
};

// =====================================================
// Incidents
// =====================================================

export const useIncidents = (filters?: FilterOptions) => {
  return useQuery({
    queryKey: ['compliance', 'incidents', filters],
    queryFn: async () => {
      let query = supabase
        .from('hipaa_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIPAAIncident[];
    },
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incident: Partial<HIPAAIncident>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate incident number
      const timestamp = Date.now();
      const incident_number = `INC-${timestamp}`;

      const { data, error } = await supabase
        .from('hipaa_incidents')
        .insert({ 
          ...incident, 
          reported_by: user.id,
          incident_number,
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent('incident_created', 'hipaa_incidents', data.id, { 
        title: incident.title,
        severity: incident.severity 
      });

      return data as HIPAAIncident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'incidents'] });
      queryClient.invalidateQueries({ queryKey: ['compliance', 'dashboard'] });
    },
  });
};

// =====================================================
// BAAs
// =====================================================

export const useBAAs = () => {
  return useQuery({
    queryKey: ['compliance', 'baas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hipaa_baas')
        .select('*')
        .order('renewal_date', { ascending: true });

      if (error) throw error;
      return data as HIPAABAA[];
    },
  });
};

export const useCreateBAA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (baa: Partial<HIPAABAA>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hipaa_baas')
        .insert({ ...baa, owner: user.id })
        .select()
        .single();

      if (error) throw error;

      await logAuditEvent('baa_created', 'hipaa_baas', data.id, { vendor: baa.vendor });

      return data as HIPAABAA;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'baas'] });
      queryClient.invalidateQueries({ queryKey: ['compliance', 'dashboard'] });
    },
  });
};

// =====================================================
// Risks
// =====================================================

export const useRisks = () => {
  return useQuery({
    queryKey: ['compliance', 'risks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hipaa_risks')
        .select('*')
        .order('risk_score', { ascending: false });

      if (error) throw error;
      return data as HIPAARisk[];
    },
  });
};

// =====================================================
// Training
// =====================================================

export const useTrainings = () => {
  return useQuery({
    queryKey: ['compliance', 'trainings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hipaa_trainings')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as HIPAATraining[];
    },
  });
};

export const useTrainingAttendance = (trainingId?: string) => {
  return useQuery({
    queryKey: ['compliance', 'training-attendance', trainingId],
    queryFn: async () => {
      let query = supabase
        .from('hipaa_training_attendance')
        .select('*')
        .order('completed_at', { ascending: false });

      if (trainingId) {
        query = query.eq('training_id', trainingId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIPAATrainingAttendance[];
    },
  });
};

// =====================================================
// PHI Access Logs
// =====================================================

export const usePHIAccessLogs = (filters?: FilterOptions) => {
  return useQuery({
    queryKey: ['compliance', 'phi-access', filters],
    queryFn: async () => {
      let query = supabase
        .from('hipaa_phi_access')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(1000);

      if (filters?.dateFrom) {
        query = query.gte('occurred_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('occurred_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIPAAPHIAccess[];
    },
  });
};

export const useLogPHIAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (access: Partial<HIPAAPHIAccess>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hipaa_phi_access')
        .insert({ 
          ...access, 
          accessor: user.id,
          accessor_name: user.email,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HIPAAPHIAccess;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'phi-access'] });
    },
  });
};

// =====================================================
// Audits
// =====================================================

export const useAudits = () => {
  return useQuery({
    queryKey: ['compliance', 'audits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hipaa_audits')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data as HIFAAudit[];
    },
  });
};

// =====================================================
// Audit Log
// =====================================================

export const useAuditLog = (objectTable?: string, objectId?: string) => {
  return useQuery({
    queryKey: ['compliance', 'audit-log', objectTable, objectId],
    queryFn: async () => {
      let query = supabase
        .from('hipaa_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (objectTable && objectId) {
        query = query.eq('object_table', objectTable).eq('object_id', objectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIFAAuditLog[];
    },
  });
};

// =====================================================
// Evidence
// =====================================================

export const useEvidence = (category?: string) => {
  return useQuery({
    queryKey: ['compliance', 'evidence', category],
    queryFn: async () => {
      let query = supabase
        .from('hipaa_evidence')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HIPAAEvidence[];
    },
  });
};

// =====================================================
// Contacts
// =====================================================

export const useContacts = () => {
  return useQuery({
    queryKey: ['compliance', 'contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hipaa_contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as HIPAAContact[];
    },
  });
};

