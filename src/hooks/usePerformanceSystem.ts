import { useState, useEffect } from 'react';
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

export function usePerformanceSystem() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error: reviewError } = await supabase
        .from('performance_reviews')
        .select('*')
        .order('review_date', { ascending: false });

      if (reviewError) throw reviewError;
      setReviews(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const addReview = async (review: Partial<PerformanceReview>) => {
    try {
      const { error } = await supabase.from('performance_reviews').insert([review]);
      if (error) throw error;
      await fetchReviews();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateReview = async (id: string, updates: Partial<PerformanceReview>) => {
    try {
      const { error } = await supabase.from('performance_reviews').update(updates).eq('id', id);
      if (error) throw error;
      await fetchReviews();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from('performance_reviews').delete().eq('id', id);
      if (error) throw error;
      await fetchReviews();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { reviews, loading, error, refetch: fetchReviews, addReview, updateReview, deleteReview };
}
