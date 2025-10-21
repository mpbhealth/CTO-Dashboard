import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Interfaces are exported where they are declared below; redundant re-export removed.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      performance_reviews: {
        Row: {
          id: string;
          employee_id: string;
          reviewer_id: string;
          review_cycle: string;
          period_start: string;
          period_end: string;
          status: string;
          overall_score: number | null;
          final_rating: string | null;
          strengths: string | null;
          areas_for_improvement: string | null;
          goals_assessment: string | null;
          performance_summary: string | null;
          submitted_at: string | null;
          approved_at: string | null;
          acknowledged_at: string | null;
          next_review_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          reviewer_id: string;
          review_cycle: string;
          period_start: string;
          period_end: string;
          status: string;
          overall_score?: number | null;
          final_rating?: string | null;
          strengths?: string | null;
          areas_for_improvement?: string | null;
          goals_assessment?: string | null;
          performance_summary?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          acknowledged_at?: string | null;
          next_review_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          reviewer_id?: string;
          review_cycle?: string;
          period_start?: string;
          period_end?: string;
          status?: string;
          overall_score?: number | null;
          final_rating?: string | null;
          strengths?: string | null;
          areas_for_improvement?: string | null;
          goals_assessment?: string | null;
          performance_summary?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          acknowledged_at?: string | null;
          next_review_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      performance_goals: {
        Row: {
          id: string;
          employee_id: string;
          review_id: string | null;
          title: string;
          description: string | null;
          goal_type: string | null;
          status: string;
          due_date: string | null;
          completion_date: string | null;
          progress: number;
          success_criteria: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          review_id?: string | null;
          title: string;
          description?: string | null;
          goal_type?: string | null;
          status?: string;
          due_date?: string | null;
          completion_date?: string | null;
          progress?: number;
          success_criteria?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          review_id?: string | null;
          title?: string;
          description?: string | null;
          goal_type?: string | null;
          status?: string;
          due_date?: string | null;
          completion_date?: string | null;
          progress?: number;
          success_criteria?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    }
  }
}

// Types for organizational data
export interface Department {
  id: string;
  name: string;
  description: string | null;
  strategic_purpose: string | null;
  parent_department_id: string | null;
  department_lead_id: string | null;
  is_active: boolean;
  budget_allocated: number | null;
  headcount: number;
  location: string | null;
  contact_email: string | null;
  mission_statement: string | null;
  key_objectives: string[] | null;
  tech_stack: string[] | null;
  reporting_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProfile {
  id: string;
  user_id: string | null;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string;
  primary_department_id: string | null;
  reports_to_id: string | null;
  employment_status: string;
  employment_type: string;
  start_date: string | null;
  end_date: string | null;
  salary: number | null;
  location: string | null;
  skills: string[] | null;
  certifications: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentWorkflow {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  workflow_type: string;
  is_active: boolean;
  version: number;
  created_by: string | null;
  estimated_duration: string | null;
  complexity_level: string;
  automation_level: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  name: string;
  description: string | null;
  assigned_role: string | null;
  estimated_time: string | null;
  dependencies: string[] | null;
  required_tools: string[] | null;
  success_criteria: string | null;
  failure_actions: string | null;
  automation_script: string | null;
  is_parallel: boolean;
  is_optional: boolean;
  created_at: string;
}

export interface DepartmentRelationship {
  id: string;
  source_department_id: string;
  target_department_id: string;
  relationship_type: string;
  strength: number;
  communication_frequency: string;
  shared_resources: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface OrgChartPosition {
  id: string;
  department_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  layout_version: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyDocument {
  id: string;
  department_id: string;
  title: string;
  document_type: string | null;
  content: string | null;
  file_url: string | null;
  version: string;
  status: string;
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
  compliance_status: string | null;
  is_mandatory: boolean;
}

export interface DepartmentMetric {
  id: string;
  department_id: string;
  metric_name: string;
  metric_value: number;
  metric_type: string | null;
  measurement_unit: string | null;
  target_value: number | null;
  measurement_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Hook for departments
export function useDepartments() {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        setData([]);
        setError(null);
        setLoading(false);
        return;
      }

      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(departments || []);
      setError(null);
    } catch (err) {
      console.warn('Error fetching departments:', err);
      setData([]);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Hook for employee profiles
export function useEmployeeProfiles() {
  const [data, setData] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        setData([]);
        setError(null);
        setLoading(false);
        return;
      }

      const { data: employees, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setData(employees || []);
      setError(null);
    } catch (err) {
      console.warn('Error fetching employee profiles:', err);
      setData([]);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Hook for department workflows
export function useDepartmentWorkflows() {
  const [data, setData] = useState<DepartmentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: workflows, error } = await supabase
        .from('department_workflows')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(workflows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Hook for workflow steps
export function useWorkflowSteps(workflowId?: string) {
  const [data, setData] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('workflow_steps')
        .select('*');

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data: steps, error } = await query.order('step_number', { ascending: true });

      if (error) throw error;
      setData(steps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for department relationships
export function useDepartmentRelationships() {
  const [data, setData] = useState<DepartmentRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: relationships, error } = await supabase
        .from('department_relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(relationships || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Hook for org chart positions
export function useOrgChartPositions() {
  const [data, setData] = useState<OrgChartPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: positions, error } = await supabase
        .from('org_chart_positions')
        .select('*');

      if (error) throw error;
      setData(positions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updatePosition = async (departmentId: string, x: number, y: number) => {
    try {
      // First, check if the position already exists
      const { data: existing } = await supabase
        .from('org_chart_positions')
        .select('id')
        .eq('department_id', departmentId)
        .single();
      
      if (existing) {
        // Update existing position
        const { error } = await supabase
          .from('org_chart_positions')
          .update({
            x_position: x,
            y_position: y,
            updated_at: new Date().toISOString()
          })
          .eq('department_id', departmentId);
        
        if (error) throw error;
      } else {
        // Create new position
        const { error } = await supabase
        .from('org_chart_positions')
        .insert({
          department_id: departmentId,
          x_position: x,
          y_position: y,
          width: 200,
          height: 100,
          layout_version: 1
        });
        
        if (error) throw error;
      }
      
      // Get updated data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update position');
    }
  };

  // Create a snapshot of current positions for layout saving
  const saveLayout = async () => {
    try {
      setIsSaving(true);
      
      // Update the layout_version for all positions
      const newVersion = Math.max(0, ...data.map(p => p.layout_version)) + 1;
      
      // Update all positions with new version
      const { error } = await supabase.rpc('save_org_chart_layout', {
        new_version: newVersion
      });
      
      if (error) throw error;
      
      // Refresh data
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset layout to most recent saved version or default
  const resetLayout = async () => {
    try {
      const { error } = await supabase.rpc('reset_org_chart_layout');
      
      if (error) throw error;
      
      // Refresh data
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset layout');
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { 
    data, 
    loading, 
    error, 
    isSaving, 
    refetch: fetchData, 
    updatePosition,
    saveLayout,
    resetLayout
  };
}

// Hook for policy documents
export function usePolicyDocuments() {
  const [data, setData] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: documents, error } = await supabase
        .from('policy_documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setData(documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// Hook for department metrics
export function useDepartmentMetrics() {
  const [data, setData] = useState<DepartmentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: metrics, error } = await supabase
        .from('department_metrics')
        .select('*')
        .order('measurement_date', { ascending: false });

      if (error) throw error;
      setData(metrics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
