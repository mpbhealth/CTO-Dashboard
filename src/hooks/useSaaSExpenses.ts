import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

export interface SaaSExpenseRow {
  id: string;
  name?: string;
  application?: string;
  department?: string;
  owner?: string;
  amount?: number;
  cadence?: string;
  cost_monthly: number;
  cost_annual: number;
  description?: string;
  platform?: string;
  url?: string;
  renewal_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface SaaSMetrics {
  totalMonthly: number;
  totalAnnual: number;
  totalTools: number;
  totalDepartments: number;
  renewingNext30Days: number;
}

function monthlyFromRow(row: { amount?: number | null; cadence?: string | null; cost_monthly?: number | null }): number {
  if (row.cost_monthly) return Number(row.cost_monthly);
  const amount = Number(row.amount || 0);
  const cadence = (row.cadence || 'monthly').toLowerCase();
  if (cadence === 'annual' || cadence === 'yearly') return amount / 12;
  if (cadence === 'quarterly') return amount / 3;
  return amount;
}

function mapExpense(row: Record<string, unknown>): SaaSExpenseRow {
  const monthly = monthlyFromRow(row as { amount?: number; cadence?: string; cost_monthly?: number });
  return {
    id: String(row.id),
    name: (row.name as string) || (row.application as string) || '',
    application: (row.name as string) || (row.application as string) || '',
    department: (row.owner as string) || (row.department as string) || '',
    owner: (row.owner as string) || undefined,
    amount: Number(row.amount || monthly),
    cadence: (row.cadence as string) || 'monthly',
    cost_monthly: monthly,
    cost_annual: monthly * 12,
    description: (row.notes as string) || (row.description as string) || '',
    renewal_date: row.renewal_date as string | undefined,
    notes: (row.notes as string) || undefined,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export function useSaaSExpenses() {
  const { orgId } = useOrg();
  const [data, setData] = useState<SaaSExpenseRow[]>([]);
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
    if (!orgId) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data: expenses, error: expensesError } = await supabase
        .from('saas_expenses')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (expensesError) throw expensesError;
      const expenseData = (expenses || []).map((row) => mapExpense(row as Record<string, unknown>));
      setData(expenseData);
      const totalMonthly = expenseData.reduce((sum, row) => sum + row.cost_monthly, 0);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setMetrics({
        totalMonthly,
        totalAnnual: totalMonthly * 12,
        totalTools: expenseData.length,
        totalDepartments: new Set(expenseData.map((row) => row.department).filter(Boolean)).size,
        renewingNext30Days: expenseData.filter((row) => {
          if (!row.renewal_date) return false;
          const renewalDate = new Date(row.renewal_date);
          return renewalDate >= now && renewalDate <= thirtyDaysFromNow;
        }).length,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch SaaS expenses');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addExpense = async (expense: Record<string, unknown>) => {
    try {
      if (!orgId) throw new Error('No active organization');
      const monthly = Number(expense.cost_monthly || expense.amount || 0);
      const { error: insertError } = await supabase.from('saas_expenses').insert({
        org_id: orgId,
        name: expense.application || expense.name || 'Untitled',
        amount: monthly,
        cadence: 'monthly',
        renewal_date: expense.renewal_date || null,
        owner: expense.department || expense.owner || null,
        notes: expense.notes || expense.description || null,
      });
      if (insertError) throw insertError;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add expense' };
    }
  };

  const updateExpense = async (id: string, updates: Record<string, unknown>) => {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.application || updates.name) payload.name = updates.application || updates.name;
      if (updates.cost_monthly != null || updates.amount != null) payload.amount = updates.cost_monthly || updates.amount;
      if (updates.renewal_date !== undefined) payload.renewal_date = updates.renewal_date;
      if (updates.department || updates.owner) payload.owner = updates.department || updates.owner;
      if (updates.notes !== undefined || updates.description !== undefined) payload.notes = updates.notes || updates.description;
      const { error: updateError } = await supabase.from('saas_expenses').update(payload).eq('id', id);
      if (updateError) throw updateError;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update expense' };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('saas_expenses').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete expense' };
    }
  };

  const bulkImport = async (expenses: Record<string, unknown>[]) => {
    for (const expense of expenses) {
      const result = await addExpense(expense);
      if (!result.success) return result;
    }
    return { success: true };
  };

  return { data, metrics, loading, error, refetch: fetchData, addExpense, updateExpense, deleteExpense, bulkImport };
}
