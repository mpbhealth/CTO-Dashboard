import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Department {
  id: string;
  name: string;
  is_active: boolean;
  budget_allocated?: number;
  headcount?: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hire_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useDepartments() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .order('name', { ascending: true });

        if (deptError) throw deptError;
        setData(departments || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  return { data, loading, error };
}

export function useEmployeeProfiles() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const { data: employees, error: empError } = await supabase
          .from('employee_profiles')
          .select('*')
          .order('name', { ascending: true });

        if (empError) throw empError;
        setData(employees || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  return { data, loading, error };
}

export function useDepartmentMetrics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data: metrics, error: metricsError } = await supabase
          .from('department_metrics')
          .select('*')
          .order('created_at', { ascending: false });

        if (metricsError) throw metricsError;
        setData(metrics || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return { data, loading, error };
}

export function usePolicyDocuments() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('policy_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;
      setData(policies || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
