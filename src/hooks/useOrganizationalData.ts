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
  const [data, setData] = useState<Department[]>([]);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  return { data, loading, error };
}

export function useEmployeeProfiles() {
  const [data, setData] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const { data: employees, error: empError } = await supabase
          .from('employee_profiles')
          .select('*')
          .order('last_name', { ascending: true });

        if (empError) throw empError;
        setData(employees || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  return { data, loading, error };
}

interface DepartmentMetric {
  id: string;
  department_id: string;
  metric_name: string;
  metric_value: number;
  created_at: string;
}

export function useDepartmentMetrics() {
  const [data, setData] = useState<DepartmentMetric[]>([]);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return { data, loading, error };
}

interface PolicyDocument {
  id: string;
  title: string;
  content?: string;
  version: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function usePolicyDocuments() {
  const [data, setData] = useState<PolicyDocument[]>([]);
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
    } catch (err) {
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

export interface DepartmentRelationship {
  id: string;
  parent_department_id: string;
  child_department_id: string;
  relationship_type: string;
  created_at: string;
}

export function useDepartmentRelationships() {
  const [data, setData] = useState<DepartmentRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelationships() {
      try {
        const { data: relationships, error: relError } = await supabase
          .from('department_relationships')
          .select('*')
          .order('created_at', { ascending: false });

        if (relError) throw relError;
        setData(relationships || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchRelationships();
  }, []);

  return { data, loading, error };
}

export interface OrgChartPosition {
  id: string;
  department_id: string;
  x_position: number;
  y_position: number;
  layout_version: string;
  created_at: string;
  updated_at: string;
}

export function useOrgChartPositions() {
  const [data, setData] = useState<OrgChartPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPositions() {
      try {
        const { data: positions, error: posError } = await supabase
          .from('org_chart_positions')
          .select('*')
          .order('updated_at', { ascending: false });

        if (posError) throw posError;
        setData(positions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchPositions();
  }, []);

  const updatePosition = async (departmentId: string, x: number, y: number) => {
    try {
      const { error: updateError } = await supabase
        .from('org_chart_positions')
        .upsert({
          department_id: departmentId,
          x_position: x,
          y_position: y,
          layout_version: 'v1',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'department_id'
        });

      if (updateError) throw updateError;

      setData(prev => {
        const existingIndex = prev.findIndex(p => p.department_id === departmentId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], x_position: x, y_position: y, updated_at: new Date().toISOString() };
          return updated;
        }
        return prev;
      });
    } catch (err) {
      console.error('Error updating position:', err);
      throw err;
    }
  };

  const saveLayout = async () => {
    try {
      const timestamp = new Date().toISOString();
      const updates = data.map(pos => ({
        ...pos,
        layout_version: `saved_${timestamp}`,
        updated_at: timestamp
      }));

      const { error: saveError } = await supabase
        .from('org_chart_positions')
        .upsert(updates);

      if (saveError) throw saveError;
    } catch (err) {
      console.error('Error saving layout:', err);
      throw err;
    }
  };

  const resetLayout = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('org_chart_positions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;
      setData([]);
    } catch (err) {
      console.error('Error resetting layout:', err);
      throw err;
    }
  };

  return { data, loading, error, updatePosition, saveLayout, resetLayout };
}
