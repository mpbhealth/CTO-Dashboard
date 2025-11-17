import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SaaSExpense } from '../types/common';

interface SaaSMetrics {
  totalMonthly: number;
  totalAnnual: number;
  totalTools: number;
  totalDepartments: number;
  renewingNext30Days: number;
}

export function useSaaSExpenses() {
  const [data, setData] = useState<SaaSExpense[]>([]);
  const [metrics, setMetrics] = useState<SaaSMetrics>({
    totalMonthly: 0,
    totalAnnual: 0,
    totalTools: 0,
    totalDepartments: 0,
    renewingNext30Days: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: expenses, error: expensesError } = await supabase
        .from('saas_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      const expenseData = expenses || [];
      setData(expenseData);

      const totalMonthly = expenseData.reduce((sum, e) => sum + (e.cost_monthly || 0), 0);
      const totalAnnual = expenseData.reduce((sum, e) => sum + (e.cost_annual || 0), 0);
      const totalTools = expenseData.length;
      const departments = new Set(expenseData.map(e => e.department)).size;

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const renewingNext30Days = expenseData.filter(e => {
        if (!e.renewal_date) return false;
        const renewalDate = new Date(e.renewal_date);
        return renewalDate >= now && renewalDate <= thirtyDaysFromNow;
      }).length;

      setMetrics({
        totalMonthly,
        totalAnnual,
        totalTools,
        totalDepartments: departments,
        renewingNext30Days,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch SaaS expenses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addExpense = async (expense: Omit<SaaSExpense, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('saas_expenses').insert([expense]);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add expense';
      throw new Error(errorMessage);
    }
  };

  const updateExpense = async (id: string, updates: Partial<SaaSExpense>) => {
    try {
      const { error } = await supabase
        .from('saas_expenses')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      throw new Error(errorMessage);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('saas_expenses').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      throw new Error(errorMessage);
    }
  };

  const bulkImport = async (expenses: Omit<SaaSExpense, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { error } = await supabase.from('saas_expenses').insert(expenses);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk import expenses';
      throw new Error(errorMessage);
    }
  };

  return {
    data,
    metrics,
    loading,
    error,
    refetch: fetchData,
    addExpense,
    updateExpense,
    deleteExpense,
    bulkImport,
  };
}
