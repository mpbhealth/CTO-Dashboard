import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../types/database';

type Tables = Database['public']['Tables'];

export function useKPIData() {
  const [data, setData] = useState<Tables['kpi_data']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured - returning mock KPI data');
        setData([
          { id: '1', title: 'Daily Active Users', value: '4,827', change: '+8.3%', trend: 'up', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', title: 'Monthly Revenue', value: '$487,250', change: '+12.3%', trend: 'up', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', title: 'Customer Satisfaction', value: '4.7/5', change: '+0.3', trend: 'up', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '4', title: 'User Retention', value: '89.4%', change: '+2.1%', trend: 'up', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]);
        return;
      }
      
      const { data: kpiData, error } = await supabase
        .from('kpi_data')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setData(kpiData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

export function useTechStack() {
  const [data, setData] = useState<Tables['tech_stack']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured - returning mock tech stack data');
        setData([
          { id: '1', name: 'React', category: 'Frontend', version: '18.3.0', owner: 'CTO Team', status: 'Active', notes: 'UI Library', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', name: 'TypeScript', category: 'Language', version: '5.6.3', owner: 'CTO Team', status: 'Active', notes: 'Type-safe JavaScript', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', name: 'Vite', category: 'Build Tool', version: '7.1.7', owner: 'CTO Team', status: 'Active', notes: 'Fast build tool', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '4', name: 'Supabase', category: 'Database', version: '2.39.0', owner: 'CTO Team', status: 'Active', notes: 'Backend as a Service', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]);
        return;
      }
      
      const { data: techData, error } = await supabase
        .from('tech_stack')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(techData || []);
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

export function useRoadmapItems() {
  const [data, setData] = useState<Tables['roadmap_items']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured - returning mock roadmap data');
        setData([
          { id: '1', title: 'Phase 1: Foundation', quarter: 'Q1 2024', status: 'Complete', priority: 'High', owner: 'CTO Team', department: 'Engineering', dependencies: [], description: 'Set up core infrastructure and security', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', title: 'Phase 2: Enhancement', quarter: 'Q2 2024', status: 'In Progress', priority: 'High', owner: 'CTO Team', department: 'Engineering', dependencies: ['1'], description: 'Improve user experience and performance', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', title: 'Phase 3: Expansion', quarter: 'Q3 2024', status: 'Backlog', priority: 'Medium', owner: 'CTO Team', department: 'Engineering', dependencies: ['2'], description: 'Add new features and integrations', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]);
        return;
      }
      
      const { data: roadmapData, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(roadmapData || []);
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

export function useProjects() {
  const [data, setData] = useState<Tables['projects']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured - returning mock projects data');
        setData([
          { id: '1', name: 'CTO Dashboard v2', description: 'Executive dashboard for technology oversight', status: 'Building', start_date: '2024-01-01', end_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', name: 'CSV Enrollment Transformer', description: 'Data transformation utility for MPB Health', status: 'Live', start_date: '2024-09-20', end_date: '2024-09-25', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', name: 'Security Audit 2024', description: 'Comprehensive security review and improvements', status: 'Live', start_date: '2024-08-01', end_date: '2024-09-15', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]);
        return;
      }
      
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(projectData || []);
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

export function useVendors() {
  const [data, setData] = useState<Tables['vendors']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(vendorData || []);
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

export function useAIAgents() {
  const [data, setData] = useState<Tables['ai_agents']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: agentData, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(agentData || []);
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

export function useAPIStatuses() {
  const [data, setData] = useState<Tables['api_statuses']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: apiData, error } = await supabase
        .from('api_statuses')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(apiData || []);
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

export function useDeploymentLogs() {
  const [data, setData] = useState<Tables['deployment_logs']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: deploymentData, error } = await supabase
        .from('deployment_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setData(deploymentData || []);
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

export function useTeamMembers() {
  const [data, setData] = useState<Tables['team_members']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: teamData, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setData(teamData || []);
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