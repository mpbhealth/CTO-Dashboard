import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Department {
  id: string;
  name: string;
  description?: string;
  head_id?: string;
  employee_count?: number;
}

export interface EmployeeProfile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  department_id?: string;
  role: string;
  hire_date?: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  description?: string;
  version: string;
  effective_date: string;
  review_date?: string;
  department_id?: string;
  owner_id?: string;
}

export interface DepartmentMetrics {
  department_id: string;
  metric_name: string;
  value: number;
  period: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmployeeProfiles() {
  return useQuery({
    queryKey: ['employeeProfiles'],
    queryFn: async (): Promise<EmployeeProfile[]> => {
      const { data, error } = await supabase.from('employee_profiles').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePolicyDocuments() {
  return useQuery({
    queryKey: ['policyDocuments'],
    queryFn: async (): Promise<PolicyDocument[]> => {
      const { data, error } = await supabase.from('policy_documents').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDepartmentMetrics() {
  return useQuery({
    queryKey: ['departmentMetrics'],
    queryFn: async (): Promise<DepartmentMetrics[]> => {
      const { data, error } = await supabase.from('department_metrics').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
