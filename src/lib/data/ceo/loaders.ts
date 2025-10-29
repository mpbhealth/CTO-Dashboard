import { supabase } from '@/lib/supabase';
import type {
  ExecutiveKPIs,
  ConciergeMetrics,
  SalesMetrics,
  OperationsMetrics,
  FinanceMetrics,
  ComplianceMetrics,
} from './types';
import {
  mockExecutiveKPIs,
  mockConciergeMetrics,
  mockSalesMetrics,
  mockOperationsMetrics,
  mockFinanceMetrics,
  mockComplianceMetrics,
} from './mockData';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export async function loadExecutiveKPIs(): Promise<ExecutiveKPIs> {
  if (USE_MOCK_DATA) {
    return mockExecutiveKPIs;
  }

  try {
    console.log('[CEO Data] Loading executive KPIs...');

    const { data, error } = await supabase
      .from('ceo_kpis')
      .select('*')
      .order('period', { ascending: false })
      .limit(2);

    if (error) {
      console.error('[CEO Data] Error loading KPIs:', error);
      return mockExecutiveKPIs;
    }

    if (!data || data.length === 0) {
      console.warn('[CEO Data] No KPI data found, using mock data');
      return mockExecutiveKPIs;
    }

    const current = data[0];
    const previous = data[1] || data[0];

    return {
      mrr: {
        current: current.mrr || 0,
        previous: previous.mrr || 0,
        change: previous.mrr ? ((current.mrr - previous.mrr) / previous.mrr) * 100 : 0,
      },
      newMembers: {
        current: current.new_members || 0,
        previous: previous.new_members || 0,
        change: previous.new_members
          ? ((current.new_members - previous.new_members) / previous.new_members) * 100
          : 0,
      },
      churn: {
        current: current.churn_rate || 0,
        previous: previous.churn_rate || 0,
        change: previous.churn_rate
          ? ((current.churn_rate - previous.churn_rate) / previous.churn_rate) * 100
          : 0,
      },
      claimsPaid: {
        current: current.claims_paid || 0,
        previous: previous.claims_paid || 0,
        change: previous.claims_paid
          ? ((current.claims_paid - previous.claims_paid) / previous.claims_paid) * 100
          : 0,
      },
    };
  } catch (error) {
    console.error('[CEO Data] Exception loading executive KPIs:', error);
    return mockExecutiveKPIs;
  }
}

export async function loadConciergeMetrics(): Promise<ConciergeMetrics> {
  if (USE_MOCK_DATA) {
    return mockConciergeMetrics;
  }

  try {
    console.log('[CEO Data] Loading concierge metrics...');
    return mockConciergeMetrics;
  } catch (error) {
    console.error('[CEO Data] Exception loading concierge metrics:', error);
    return mockConciergeMetrics;
  }
}

export async function loadSalesMetrics(): Promise<SalesMetrics> {
  if (USE_MOCK_DATA) {
    return mockSalesMetrics;
  }

  try {
    console.log('[CEO Data] Loading sales metrics...');
    return mockSalesMetrics;
  } catch (error) {
    console.error('[CEO Data] Exception loading sales metrics:', error);
    return mockSalesMetrics;
  }
}

export async function loadOperationsMetrics(): Promise<OperationsMetrics> {
  if (USE_MOCK_DATA) {
    return mockOperationsMetrics;
  }

  try {
    console.log('[CEO Data] Loading operations metrics...');
    return mockOperationsMetrics;
  } catch (error) {
    console.error('[CEO Data] Exception loading operations metrics:', error);
    return mockOperationsMetrics;
  }
}

export async function loadFinanceMetrics(): Promise<FinanceMetrics> {
  if (USE_MOCK_DATA) {
    return mockFinanceMetrics;
  }

  try {
    console.log('[CEO Data] Loading finance metrics...');
    return mockFinanceMetrics;
  } catch (error) {
    console.error('[CEO Data] Exception loading finance metrics:', error);
    return mockFinanceMetrics;
  }
}

export async function loadComplianceMetrics(): Promise<ComplianceMetrics> {
  if (USE_MOCK_DATA) {
    return mockComplianceMetrics;
  }

  try {
    console.log('[CEO Data] Loading compliance metrics...');
    return mockComplianceMetrics;
  } catch (error) {
    console.error('[CEO Data] Exception loading compliance metrics:', error);
    return mockComplianceMetrics;
  }
}
