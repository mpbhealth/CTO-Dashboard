import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// =============================================
// Type Definitions
// =============================================

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_cycle: 'quarterly' | 'annual' | 'mid-year';
  period_start: string;
  period_end: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'acknowledged';
  overall_score: number | null;
  final_rating: 'exceeds' | 'meets' | 'partially_meets' | 'does_not_meet' | null;
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
}

export type PerformanceReviewInput = Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'>;

export interface ReviewCriterion {
  id: string;
  name: string;
  category: 'technical' | 'behavioral' | 'leadership' | 'values';
  description: string | null;
  weight: number;
  max_score: number;
}

export interface ReviewScore {
  id: string;
  review_id: string;
  criterion_id: string;
  score: number;
  comments: string | null;
}

export interface KpiDefinition {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  target_value: number;
  min_threshold: number;
  max_threshold: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  applicable_roles: string[] | null;
}

export interface EmployeeKpi {
  id: string;
  employee_id: string;
  kpi_id: string;
  current_value: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  last_updated: string;
  target_date: string | null;
  notes: string | null;
}

export interface CareerDevelopmentPlan {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed';
  start_date: string;
  target_completion_date: string | null;
  completed_date: string | null;
  mentor_id: string | null;
  skills_to_develop: string[] | null;
  resources_needed: string | null;
  success_criteria: string | null;
  progress: number;
}

export interface LearningActivity {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  due_date: string | null;
  completion_date: string | null;
  activity_type: 'course' | 'certification' | 'workshop' | 'project' | 'mentorship' | 'other';
  url: string | null;
  notes: string | null;
}

export interface FeedbackEntry {
  id: string;
  recipient_id: string;
  provider_id: string | null;
  feedback_type: 'praise' | 'criticism' | 'suggestion' | 'question';
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

// =============================================
// API Functions
// =============================================

// Performance Review Functions
async function fetchPerformanceReviews(employeeId?: string): Promise<PerformanceReview[]> {
  let query = supabase.from('performance_reviews').select('*');
  
  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching performance reviews: ${error.message}`);
  }
  
  return data || [];
}

async function fetchReviewById(reviewId: string): Promise<PerformanceReview> {
  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();
  
  if (error) {
    throw new Error(`Error fetching review details: ${error.message}`);
  }
  
  return data;
}

async function createPerformanceReview(review: PerformanceReviewInput): Promise<PerformanceReview> {
  const { data, error } = await supabase
    .from('performance_reviews')
    .insert([review])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating performance review: ${error.message}`);
  }
  
  return data;
}

async function updatePerformanceReview(id: string, updates: Partial<PerformanceReview>): Promise<PerformanceReview> {
  const { data, error } = await supabase
    .from('performance_reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating performance review: ${error.message}`);
  }
  
  return data;
}

async function submitPerformanceReview(id: string): Promise<PerformanceReview> {
  const { data, error } = await supabase
    .from('performance_reviews')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error submitting performance review: ${error.message}`);
  }
  
  return data;
}

// KPI Functions
async function fetchKpiDefinitions(): Promise<KpiDefinition[]> {
  const { data, error } = await supabase
    .from('kpi_definitions')
    .select('*')
    .order('name');
  
  if (error) {
    throw new Error(`Error fetching KPI definitions: ${error.message}`);
  }
  
  return data || [];
}

async function fetchEmployeeKpis(employeeId: string): Promise<EmployeeKpi[]> {
  const { data, error } = await supabase
    .from('employee_kpis')
    .select(`
      *,
      kpi_definitions(*)
    `)
    .eq('employee_id', employeeId);
  
  if (error) {
    throw new Error(`Error fetching employee KPIs: ${error.message}`);
  }
  
  return data || [];
}

async function updateEmployeeKpi(id: string, updates: Partial<EmployeeKpi>): Promise<EmployeeKpi> {
  const { data, error } = await supabase
    .from('employee_kpis')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating employee KPI: ${error.message}`);
  }
  
  return data;
}

// Career Development Functions
async function fetchCareerDevelopmentPlans(employeeId: string): Promise<CareerDevelopmentPlan[]> {
  const { data, error } = await supabase
    .from('career_development_plans')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching career development plans: ${error.message}`);
  }
  
  return data || [];
}

async function fetchLearningActivities(planId: string): Promise<LearningActivity[]> {
  const { data, error } = await supabase
    .from('learning_activities')
    .select('*')
    .eq('plan_id', planId)
    .order('due_date', { ascending: true });
  
  if (error) {
    throw new Error(`Error fetching learning activities: ${error.message}`);
  }
  
  return data || [];
}

async function createCareerDevelopmentPlan(plan: Omit<CareerDevelopmentPlan, 'id' | 'created_at'>): Promise<CareerDevelopmentPlan> {
  const { data, error } = await supabase
    .from('career_development_plans')
    .insert([plan])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating career development plan: ${error.message}`);
  }
  
  return data;
}

async function updateCareerDevelopmentPlan(id: string, updates: Partial<CareerDevelopmentPlan>): Promise<CareerDevelopmentPlan> {
  const { data, error } = await supabase
    .from('career_development_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating career development plan: ${error.message}`);
  }
  
  return data;
}

async function createLearningActivity(activity: Omit<LearningActivity, 'id'>): Promise<LearningActivity> {
  const { data, error } = await supabase
    .from('learning_activities')
    .insert([activity])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating learning activity: ${error.message}`);
  }
  
  return data;
}

// Feedback Functions
async function fetchFeedback(employeeId: string): Promise<FeedbackEntry[]> {
  const { data, error } = await supabase
    .from('feedback_entries')
    .select(`
      *,
      provider:employee_profiles!provider_id(
        first_name,
        last_name,
        title
      )
    `)
    .eq('recipient_id', employeeId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching feedback: ${error.message}`);
  }
  
  return data || [];
}

async function provideFeedback(feedback: Omit<FeedbackEntry, 'id' | 'created_at'>): Promise<FeedbackEntry> {
  const { data, error } = await supabase
    .from('feedback_entries')
    .insert([feedback])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error providing feedback: ${error.message}`);
  }
  
  return data;
}

// =============================================
// Custom Hook
// =============================================

export function usePerformanceSystem() {
  const queryClient = useQueryClient();
  
  // =========== Performance Reviews ===========
  
  const useEmployeeReviews = (employeeId?: string) => {
    return useQuery({
      queryKey: ['performanceReviews', employeeId],
      queryFn: () => fetchPerformanceReviews(employeeId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
  
  const useReviewDetails = (reviewId: string | undefined) => {
    return useQuery({
      queryKey: ['review', reviewId],
      queryFn: () => (reviewId ? fetchReviewById(reviewId) : Promise.reject('Review ID is required')),
      enabled: !!reviewId,
    });
  };
  
  const useCreateReview = () => {
    return useMutation({
      mutationFn: createPerformanceReview,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['performanceReviews'] });
      },
    });
  };
  
  const useUpdateReview = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<PerformanceReview> }) => 
        updatePerformanceReview(id, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['performanceReviews'] });
        queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      },
    });
  };
  
  const useSubmitReview = () => {
    return useMutation({
      mutationFn: submitPerformanceReview,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['performanceReviews'] });
        queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      },
    });
  };
  
  // =========== KPIs ===========
  
  const useKpiDefinitions = () => {
    return useQuery({
      queryKey: ['kpiDefinitions'],
      queryFn: fetchKpiDefinitions,
      staleTime: 1000 * 60 * 30, // 30 minutes
    });
  };
  
  const useEmployeeKpis = (employeeId: string | undefined) => {
    return useQuery({
      queryKey: ['employeeKpis', employeeId],
      queryFn: () => (employeeId ? fetchEmployeeKpis(employeeId) : Promise.reject('Employee ID is required')),
      enabled: !!employeeId,
    });
  };
  
  const useUpdateKpi = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<EmployeeKpi> }) => 
        updateEmployeeKpi(id, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['employeeKpis'] });
      },
    });
  };
  
  // =========== Career Development ===========
  
  const useCareerDevelopmentPlans = (employeeId: string | undefined) => {
    return useQuery({
      queryKey: ['careerDevelopment', employeeId],
      queryFn: () => (employeeId ? fetchCareerDevelopmentPlans(employeeId) : Promise.reject('Employee ID is required')),
      enabled: !!employeeId,
    });
  };
  
  const useLearningActivities = (planId: string | undefined) => {
    return useQuery({
      queryKey: ['learningActivities', planId],
      queryFn: () => (planId ? fetchLearningActivities(planId) : Promise.reject('Plan ID is required')),
      enabled: !!planId,
    });
  };
  
  const useCreateCareerPlan = () => {
    return useMutation({
      mutationFn: createCareerDevelopmentPlan,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['careerDevelopment', data.employee_id] });
      },
    });
  };
  
  const useUpdateCareerPlan = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<CareerDevelopmentPlan> }) =>
        updateCareerDevelopmentPlan(id, updates),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['careerDevelopment', data.employee_id] });
      },
    });
  };
  
  const useCreateLearningActivity = () => {
    return useMutation({
      mutationFn: createLearningActivity,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['learningActivities', data.plan_id] });
      },
    });
  };
  
  // =========== Feedback ===========
  
  const useEmployeeFeedback = (employeeId: string | undefined) => {
    return useQuery({
      queryKey: ['feedback', employeeId],
      queryFn: () => (employeeId ? fetchFeedback(employeeId) : Promise.reject('Employee ID is required')),
      enabled: !!employeeId,
    });
  };
  
  const useProvideFeedback = () => {
    return useMutation({
      mutationFn: provideFeedback,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['feedback', data.recipient_id] });
      },
    });
  };
  
  // =========== Return All Hooks ===========
  
  return {
    // Performance Reviews
    useEmployeeReviews,
    useReviewDetails,
    useCreateReview,
    useUpdateReview,
    useSubmitReview,
    
    // KPIs
    useKpiDefinitions,
    useEmployeeKpis,
    useUpdateKpi,
    
    // Career Development
    useCareerDevelopmentPlans,
    useLearningActivities,
    useCreateCareerPlan,
    useUpdateCareerPlan,
    useCreateLearningActivity,
    
    // Feedback
    useEmployeeFeedback,
    useProvideFeedback,
  };
}

// =============================================
// Usage Example
// =============================================

/*
import { usePerformanceSystem } from '../../hooks/usePerformanceSystem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

function EmployeePerformance() {
  const { 
    useEmployeeReviews, 
    useKpiDefinitions, 
    useCareerDevelopmentPlans, 
    useEmployeeFeedback 
  } = usePerformanceSystem();
  
  const employeeId = '123'; // Replace with actual employee ID
  
  const { 
    data: reviews, 
    isLoading: reviewsLoading, 
    error: reviewsError 
  } = useEmployeeReviews(employeeId);
  
  const { 
    data: kpiDefinitions, 
    isLoading: kpisLoading 
  } = useKpiDefinitions();
  
  const { 
    data: careerPlans, 
    isLoading: plansLoading 
  } = useCareerDevelopmentPlans(employeeId);
  
  const { 
    data: feedback, 
    isLoading: feedbackLoading 
  } = useEmployeeFeedback(employeeId);
  
  // Render your UI based on the data...
}

// Wrap your app with the provider
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmployeePerformance />
    </QueryClientProvider>
  );
}
*/