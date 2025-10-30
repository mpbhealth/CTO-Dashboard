import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAudits() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudits() {
      try {
        const { data: audits, error: auditsError } = await supabase
          .from('compliance_audits')
          .select('*')
          .order('created_at', { ascending: false });

        if (auditsError) throw auditsError;
        setData(audits || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAudits();
  }, []);

  return { data, loading, error };
}

export function useComplianceDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const dashboardData = {
          overallScore: 85,
          tasksCompleted: 42,
          upcomingDeadlines: 3,
          recentActivity: [],
          policies: {
            approved: 12,
            inReview: 3,
            overdue: 1,
            total: 16
          },
          baas: {
            active: 8,
            expiringSoon: 2,
            expired: 0,
            total: 10
          },
          incidents: {
            open: 2,
            closed: 15,
            bySeverity: {
              critical: 0,
              high: 1,
              medium: 1,
              low: 0
            }
          },
          training: {
            completionRate: 87,
            completedModules: 145,
            totalModules: 167,
            overdue: 5
          }
        };
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        setData({
          policies: { approved: 0, inReview: 0, overdue: 0, total: 0 },
          baas: { active: 0, expiringSoon: 0, expired: 0, total: 0 },
          incidents: { open: 0, closed: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } },
          training: { completionRate: 0, completedModules: 0, totalModules: 0, overdue: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return { data, isLoading };
}

export function useTasks() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data: tasks, error } = await supabase
          .from('compliance_tasks')
          .select('*')
          .order('due_date', { ascending: true });

        if (error) throw error;
        setData(tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  return { data, loading };
}

export function useMyTasks() {
  return useTasks();
}

export function useAuditLog() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        const { data: logs, error } = await supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setData(logs || []);
      } catch (error) {
        console.error('Error fetching audit log:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, []);

  return { data, loading };
}

export function useCreateTask() {
  return async (task: any) => {
    const { error } = await supabase.from('compliance_tasks').insert([task]);
    if (error) throw error;
  };
}

export function useUpdateTask() {
  return async (id: string, updates: any) => {
    const { error } = await supabase.from('compliance_tasks').update(updates).eq('id', id);
    if (error) throw error;
  };
}

export function useComplianceDocs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: docs, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, refetch: fetchData };
}

export function useCreateDoc() {
  return async (doc: any) => {
    const { error } = await supabase.from('compliance_documents').insert([doc]);
    if (error) throw error;
  };
}

export function useUpdateDoc() {
  return async (id: string, updates: any) => {
    const { error } = await supabase.from('compliance_documents').update(updates).eq('id', id);
    if (error) throw error;
  };
}

export function useDeleteDoc() {
  return async (id: string) => {
    const { error } = await supabase.from('compliance_documents').delete().eq('id', id);
    if (error) throw error;
  };
}

export function usePHIAccessLogs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data: logs, error } = await supabase
          .from('phi_access_logs')
          .select('*')
          .order('accessed_at', { ascending: false });

        if (error) throw error;
        setData(logs || []);
      } catch (error) {
        console.error('Error fetching PHI access logs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return { data, loading };
}

export function useLogPHIAccess() {
  return async (log: any) => {
    const { error } = await supabase.from('phi_access_logs').insert([log]);
    if (error) throw error;
  };
}

export function useIncidents() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: incidents, error } = await supabase
        .from('compliance_incidents')
        .select('*')
        .order('reported_at', { ascending: false });

      if (error) throw error;
      setData(incidents || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, refetch: fetchData };
}

export function useCreateIncident() {
  return async (incident: any) => {
    const { error } = await supabase.from('compliance_incidents').insert([incident]);
    if (error) throw error;
  };
}

export function useTrainings() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrainings() {
      try {
        const { data: trainings, error } = await supabase
          .from('compliance_trainings')
          .select('*')
          .order('scheduled_date', { ascending: false });

        if (error) throw error;
        setData(trainings || []);
      } catch (error) {
        console.error('Error fetching trainings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrainings();
  }, []);

  return { data, loading };
}

export function useTrainingAttendance() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const { data: attendance, error } = await supabase
          .from('training_attendance')
          .select('*')
          .order('completed_at', { ascending: false });

        if (error) throw error;
        setData(attendance || []);
      } catch (error) {
        console.error('Error fetching training attendance:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  return { data, loading };
}

export function useBAAs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: baas, error } = await supabase
        .from('business_associate_agreements')
        .select('*')
        .order('signed_date', { ascending: false });

      if (error) throw error;
      setData(baas || []);
    } catch (error) {
      console.error('Error fetching BAAs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, refetch: fetchData };
}

export function useCreateBAA() {
  return async (baa: any) => {
    const { error } = await supabase.from('business_associate_agreements').insert([baa]);
    if (error) throw error;
  };
}

export function useEmployeeDocuments() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: docs, error } = await supabase
        .from('employee_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setData(docs || []);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, refetch: fetchData };
}

export function useUploadEmployeeDocument() {
  return async (document: any) => {
    const { error } = await supabase.from('employee_documents').insert([document]);
    if (error) throw error;
  };
}

export function useDeleteEmployeeDocument() {
  return async (id: string) => {
    const { error } = await supabase.from('employee_documents').delete().eq('id', id);
    if (error) throw error;
  };
}

export function useAuditSchedules() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const { data: schedules, error } = await supabase
          .from('audit_schedules')
          .select('*')
          .order('scheduled_date', { ascending: true });

        if (error) throw error;
        setData(schedules || []);
      } catch (error) {
        console.error('Error fetching audit schedules:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  return { data, loading };
}

export function useAuditFindings() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFindings() {
      try {
        const { data: findings, error } = await supabase
          .from('audit_findings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setData(findings || []);
      } catch (error) {
        console.error('Error fetching audit findings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFindings();
  }, []);

  return { data, loading };
}

export function useCreateAudit() {
  return async (audit: any) => {
    const { error } = await supabase.from('compliance_audits').insert([audit]);
    if (error) throw error;
  };
}

export function useUpdateAudit() {
  return async (id: string, updates: any) => {
    const { error } = await supabase.from('compliance_audits').update(updates).eq('id', id);
    if (error) throw error;
  };
}

export function useDeleteAudit() {
  return async (id: string) => {
    const { error } = await supabase.from('compliance_audits').delete().eq('id', id);
    if (error) throw error;
  };
}

export function useExpiringDocuments(daysUntilExpiry: number = 90) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpiringDocs() {
      try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysUntilExpiry);

        const { data: docs, error } = await supabase
          .from('employee_documents')
          .select('*')
          .lte('expiration_date', targetDate.toISOString())
          .order('expiration_date', { ascending: true });

        if (error) throw error;
        setData(docs || []);
      } catch (error) {
        console.error('Error fetching expiring documents:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchExpiringDocs();
  }, [daysUntilExpiry]);

  return { data, loading };
}

export function useUpdateDocumentStatus() {
  return async (id: string, status: string) => {
    const { error } = await supabase
      .from('employee_documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  };
}
