import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SaaSExpense {
  id: string;
  department: string;
  application: string;
  description: string | null;
  cost_monthly: number;
  cost_annual: number;
  platform: string | null;
  url: string | null;
  renewal_date: string | null;
  notes: string | null;
  source_sheet: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SaaSExpenseCreateData {
  department: string;
  application: string;
  description?: string;
  cost_monthly: number;
  cost_annual: number;
  platform?: string;
  url?: string;
  renewal_date?: string;
  notes?: string;
  source_sheet?: string;
}

export type SaaSExpenseUpdateData = Partial<SaaSExpenseCreateData>;

export function useSaaSExpenses() {
  const [data, setData] = useState<SaaSExpense[]>([]);
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

      const { data: expenses, error } = await supabase
        .from('saas_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(expenses || []);
      setError(null);
    } catch (err) {
      console.warn('Error fetching SaaS expenses:', err);
      setData([]);
      setError(err instanceof Error ? err.message : 'Failed to load SaaS expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addExpense = async (expenseData: SaaSExpenseCreateData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saas_expenses')
        .insert([{
          ...expenseData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const updateExpense = async (id: string, updates: SaaSExpenseUpdateData) => {
    try {
      const { data, error } = await supabase
        .from('saas_expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saas_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  const bulkImport = async (expenses: Omit<SaaSExpense, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const expensesWithUser = expenses.map(expense => ({
        ...expense,
        created_by: user.id,
        source_sheet: expense.source_sheet || 'csv_import'
      }));

      const { data, error } = await supabase
        .from('saas_expenses')
        .insert(expensesWithUser)
        .select();

      if (error) throw error;
      await fetchData();
      return { success: true, data, count: data?.length || 0 };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  // Calculate metrics
  const metrics = {
    totalMonthly: data.reduce((sum, expense) => sum + (expense.cost_monthly || 0), 0),
    totalAnnual: data.reduce((sum, expense) => sum + (expense.cost_annual || 0), 0),
    totalTools: data.length,
    totalDepartments: new Set(data.map(expense => expense.department)).size,
    renewingNext30Days: data.filter(expense => {
      if (!expense.renewal_date) return false;
      const renewalDate = new Date(expense.renewal_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return renewalDate >= new Date() && renewalDate <= thirtyDaysFromNow;
    }).length
  };

  return {
    data,
    loading,
    error,
    metrics,
    refetch: fetchData,
    addExpense,
    updateExpense,
    deleteExpense,
    bulkImport
  };
}