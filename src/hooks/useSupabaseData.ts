import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SupabaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface UseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch?: () => Promise<void>;
}

export function useKPIData() {
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const { data: kpis, error: kpiError } = await supabase
          .from('kpis')
          .select('*')
          .order('created_at', { ascending: false });

        if (kpiError) throw kpiError;
        setData(kpis || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchKPIs();
  }, []);

  return { data, loading, error };
}

export function useTeamMembers() {
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (membersError) throw membersError;
      setData(members || []);
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
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setData(projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return { data, loading, error };
}

export function useRoadmapItems() {
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoadmapItems() {
      try {
        const { data: items, error: itemsError } = await supabase
          .from('roadmap_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (itemsError) throw itemsError;
        setData(items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmapItems();
  }, []);

  return { data, loading, error };
}

export function useTechStack() {
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTechStack() {
      try {
        const { data: tech, error: techError } = await supabase
          .from('tech_stack')
          .select('*')
          .order('name', { ascending: true });

        if (techError) throw techError;
        setData(tech || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchTechStack();
  }, []);

  return { data, loading, error };
}

export function useDeploymentLogs() {
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: deployments, error: deploymentsError } = await supabase
        .from('deployment_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (deploymentsError) throw deploymentsError;
      setData(deployments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  return { data, loading, error, refetch: fetchDeployments };
}

export function useAIAgents() {
  const [data, setData] = useState<SupabaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAIAgents() {
      try {
        const { data: agents, error: agentsError } = await supabase
          .from('ai_agents')
          .select('*')
          .order('name', { ascending: true });

        if (agentsError) throw agentsError;
        setData(agents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchAIAgents();
  }, []);

  return { data, loading, error };
}
