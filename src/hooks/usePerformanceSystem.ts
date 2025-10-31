import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_date: string;
  rating: number;
  comments: string;
  goals: string[];
  achievements: string[];
  areas_for_improvement: string[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeFeedback {
  id: string;
  employee_id: string;
  feedback_from: string;
  feedback_date: string;
  feedback_type: string;
  content: string;
  created_at: string;
}

export interface EmployeeKpi {
  id: string;
  employee_id: string;
  kpi_name: string;
  target_value: number;
  actual_value: number;
  measurement_date: string;
  created_at: string;
}

export interface CareerDevelopmentPlan {
  id: string;
  employee_id: string;
  goal: string;
  timeline: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function useEmployeeReviews(employeeId?: string) {
  const [data, setData] = useState<PerformanceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setIsLoading(true);
        let query = supabase.from('performance_reviews').select('*').order('review_period_start', { ascending: false });

        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }

        const { data: reviews, error } = await query;
        if (error) throw error;
        setData(reviews || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, [employeeId]);

  return { data, isLoading };
}

function useEmployeeFeedback(employeeId?: string) {
  const [data, setData] = useState<EmployeeFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setIsLoading(true);
        let query = supabase.from('employee_feedback').select('*').order('feedback_date', { ascending: false });

        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }

        const { data: feedback, error } = await query;
        if (error) throw error;
        setData(feedback || []);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeedback();
  }, [employeeId]);

  return { data, isLoading };
}

function useEmployeeKpis(employeeId?: string) {
  const [data, setData] = useState<EmployeeKpi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchKpis() {
      try {
        setIsLoading(true);
        let query = supabase.from('employee_kpis').select('*').order('period_start', { ascending: false });

        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }

        const { data: kpis, error } = await query;
        if (error) throw error;
        setData(kpis || []);
      } catch (err) {
        console.error('Error fetching KPIs:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchKpis();
  }, [employeeId]);

  return { data, isLoading };
}

function useCareerDevelopmentPlans(employeeId?: string) {
  const [data, setData] = useState<CareerDevelopmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setIsLoading(true);
        let query = supabase.from('career_development_plans').select('*').order('created_at', { ascending: false });

        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }

        const { data: plans, error } = await query;
        if (error) throw error;
        setData(plans || []);
      } catch (err) {
        console.error('Error fetching career plans:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlans();
  }, [employeeId]);

  return { data, isLoading };
}

function useProvideFeedback() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provideFeedback = useCallback(async (feedback: {
    employee_id: string;
    feedback_type: string;
    content: string;
    is_anonymous?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: feedbackError } = await supabase
        .from('employee_feedback')
        .insert([{
          employee_id: feedback.employee_id,
          feedback_from: feedback.is_anonymous ? 'Anonymous' : 'Current User',
          feedback_type: feedback.feedback_type,
          content: feedback.content,
          feedback_date: new Date().toISOString()
        }]);

      if (feedbackError) throw feedbackError;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { provideFeedback, isLoading, error };
}

export function usePerformanceSystem() {
  return {
    useEmployeeReviews,
    useEmployeeFeedback,
    useEmployeeKpis,
    useCareerDevelopmentPlans,
    useProvideFeedback
  };
}
