import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface TechStackItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress?: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  quarter?: string;
}

export interface KPIData {
  id: string;
  name: string;
  value: number;
  target?: number;
  unit?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export function useTechStack() {
  return useQuery({
    queryKey: ['techStack'],
    queryFn: async (): Promise<TechStackItem[]> => {
      const { data, error } = await supabase.from('tech_stack').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useRoadmapItems() {
  return useQuery({
    queryKey: ['roadmapItems'],
    queryFn: async (): Promise<RoadmapItem[]> => {
      const { data, error } = await supabase.from('roadmap_items').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useKPIData() {
  return useQuery({
    queryKey: ['kpiData'],
    queryFn: async (): Promise<KPIData[]> => {
      const { data, error } = await supabase.from('kpis').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['teamMembers'],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.from('team_members').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
