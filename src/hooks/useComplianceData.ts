import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ComplianceDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  version: string;
  effective_date: string;
  review_date?: string;
}

export interface BAA {
  id: string;
  vendor_name: string;
  signed_date: string;
  expiry_date?: string;
  status: string;
  document_url?: string;
}

export interface ComplianceIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reported_date: string;
  resolved_date?: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  upload_date: string;
  file_url?: string;
}

export function useComplianceDocs() {
  return useQuery({
    queryKey: ['complianceDocs'],
    queryFn: async (): Promise<ComplianceDocument[]> => {
      const { data, error } = await supabase.from('compliance_documents').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Partial<ComplianceDocument>) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .insert(doc)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceDocs'] });
    },
  });
}

export function useUpdateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...doc }: Partial<ComplianceDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .update(doc)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceDocs'] });
    },
  });
}

export function useDeleteDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceDocs'] });
    },
  });
}

export function useBAAs() {
  return useQuery({
    queryKey: ['baas'],
    queryFn: async (): Promise<BAA[]> => {
      const { data, error } = await supabase.from('business_associate_agreements').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBAA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (baa: Partial<BAA>) => {
      const { data, error } = await supabase
        .from('business_associate_agreements')
        .insert(baa)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baas'] });
    },
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async (): Promise<ComplianceIncident[]> => {
      const { data, error } = await supabase.from('compliance_incidents').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (incident: Partial<ComplianceIncident>) => {
      const { data, error } = await supabase
        .from('compliance_incidents')
        .insert(incident)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useEmployeeDocuments() {
  return useQuery({
    queryKey: ['employeeDocuments'],
    queryFn: async (): Promise<EmployeeDocument[]> => {
      const { data, error } = await supabase.from('employee_documents').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
