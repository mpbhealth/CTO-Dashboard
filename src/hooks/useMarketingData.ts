import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MarketingProperty {
  id: string;
  user_id: string;
  name: string;
  website_url: string | null;
  ga_property_id: string | null;
  ga_measurement_id: string | null;
  ga_connected: boolean;
  fb_pixel_id: string | null;
  fb_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingMetric {
  id: string;
  property_id: string;
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number;
  conversions: number;
  avg_session_duration: number;
  traffic_source: string | null;
  campaign_name: string | null;
  revenue: number;
  created_at: string;
}

export function useMarketingProperties() {
  const [data, setData] = useState<MarketingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: properties, error } = await supabase
        .from('marketing_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(properties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addProperty = async (propertyData: Omit<MarketingProperty, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('marketing_properties')
        .insert([{
          ...propertyData,
          user_id: user.id
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

  const updateProperty = async (id: string, updates: Partial<MarketingProperty>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_properties')
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

  const deleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('marketing_properties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    addProperty,
    updateProperty,
    deleteProperty
  };
}

export function useMarketingMetrics(propertyId: string | null, dateRange: { start: string; end: string }) {
  const [data, setData] = useState<MarketingMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!propertyId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: metrics, error } = await supabase
        .from('marketing_metrics')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: true });

      if (error) throw error;
      setData(metrics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propertyId, dateRange.start, dateRange.end]);

  const addMetrics = async (metricsData: Omit<MarketingMetric, 'id' | 'created_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('marketing_metrics')
        .upsert(metricsData, { onConflict: 'property_id,date,traffic_source' })
        .select();
      
      if (error) throw error;
      await fetchData();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    addMetrics
  };
}

// Helper functions for data aggregation
export const aggregateMetrics = (metrics: MarketingMetric[]) => {
  if (metrics.length === 0) return null;

  const totals = metrics.reduce((acc, metric) => {
    acc.sessions += metric.sessions;
    acc.users += metric.users;
    acc.pageviews += metric.pageviews;
    acc.conversions += metric.conversions;
    acc.revenue += metric.revenue;
    return acc;
  }, { sessions: 0, users: 0, pageviews: 0, conversions: 0, revenue: 0 });

  const avgBounceRate = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.bounce_rate, 0) / metrics.length 
    : 0;

  const avgSessionDuration = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.avg_session_duration, 0) / metrics.length
    : 0;

  return {
    ...totals,
    avgBounceRate: Math.round(avgBounceRate * 100) / 100,
    avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
    conversionRate: totals.sessions > 0 ? (totals.conversions / totals.sessions) * 100 : 0
  };
};

export const getTrafficSourceData = (metrics: MarketingMetric[]) => {
  const sourceMap = new Map<string, { sessions: number; users: number; conversions: number }>();
  
  metrics.forEach(metric => {
    const source = metric.traffic_source || 'Direct';
    const existing = sourceMap.get(source) || { sessions: 0, users: 0, conversions: 0 };
    sourceMap.set(source, {
      sessions: existing.sessions + metric.sessions,
      users: existing.users + metric.users,
      conversions: existing.conversions + metric.conversions
    });
  });

  const total = Array.from(sourceMap.values()).reduce((sum, source) => sum + source.sessions, 0);
  
  return Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    sessions: data.sessions,
    users: data.users,
    conversions: data.conversions,
    percentage: total > 0 ? Math.round((data.sessions / total) * 100) : 0,
    color: getSourceColor(source)
  }));
};

const getSourceColor = (source: string): string => {
  const colors = {
    'Direct': '#3B82F6',
    'Organic Search': '#10B981',
    'Referral': '#F59E0B',
    'Social': '#8B5CF6',
    'Email': '#EC4899',
    'Paid Search': '#EF4444',
    'Other': '#6B7280'
  };
  return colors[source] || '#6B7280';
};