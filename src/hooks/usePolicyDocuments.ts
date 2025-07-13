import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PolicyDocument {
  id: string;
  title: string;
  document_type: 'policy' | 'sop' | 'handbook' | 'procedure' | 'guideline';
  content: string | null;
  file_url: string | null;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived' | 'rejected';
  department_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  review_date: string | null;
  effective_date: string | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  approval_workflow: Record<string, any> | null;
  notification_settings: Record<string, any> | null;
  compliance_status: 'compliant' | 'non_compliant' | 'needs_review' | null;
  is_mandatory: boolean;
}

export function usePolicyDocuments() {
  const [data, setData] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: policies, error } = await supabase
        .from('policy_documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setData(policies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addPolicy = async (policyData: Omit<PolicyDocument, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('policy_documents')
        .insert([policyData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const updatePolicy = async (id: string, updates: Partial<PolicyDocument>) => {
    try {
      const { data, error } = await supabase
        .from('policy_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('policy_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const getPolicyById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('policy_documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  // Get policy history versions
  const getPolicyHistory = async (policyId: string) => {
    try {
      const { data, error } = await supabase
        .from('policy_document_history')
        .select('*')
        .eq('policy_id', policyId)
        .order('modified_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  // Get policy acknowledgements
  const getPolicyAcknowledgements = async (policyId: string) => {
    try {
      const { data, error } = await supabase
        .from('policy_acknowledgements')
        .select('*, employee_profiles!inner(*)')
        .eq('policy_id', policyId)
        .order('acknowledged_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    addPolicy,
    updatePolicy,
    deletePolicy,
    getPolicyById,
    getPolicyHistory,
    getPolicyAcknowledgements
  };
}