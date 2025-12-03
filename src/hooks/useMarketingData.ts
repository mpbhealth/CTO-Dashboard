import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MarketingProperty {
  id: string;
  name: string;
  website_url?: string;
  ga_property_id?: string;
  ga_measurement_id?: string;
  ga_connected: boolean;
  fb_pixel_id?: string;
  fb_connected: boolean;
  created_at: string;
  updated_at: string;
}

interface MarketingMetric {
  id: string;
  property_id?: string;
  date: string;
  sessions?: number;
  users?: number;
  pageviews?: number;
  bounce_rate?: number;
  conversions?: number;
  traffic_source?: string;
  created_at: string;
}

export function useMarketingProperties() {
  const [data, setData] = useState<MarketingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: properties, error: propertiesError } = await supabase
        .from('marketing_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;
      setData(properties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (property: Omit<MarketingProperty, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error: insertError } = await supabase
        .from('marketing_properties')
        .insert(property);

      if (insertError) throw insertError;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Insert failed' };
    }
  };

  const updateProperty = async (id: string, updates: Partial<MarketingProperty>) => {
    try {
      const { error: updateError } = await supabase
        .from('marketing_properties')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData, addProperty, updateProperty };
}

export function useMarketingMetrics(
  propertyId: string | null,
  dateRange?: { start: string; end: string }
) {
  const [data, setData] = useState<MarketingMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      if (!propertyId) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let query = supabase
          .from('marketing_metrics')
          .select('*')
          .eq('property_id', propertyId);

        if (dateRange) {
          query = query
            .gte('date', dateRange.start)
            .lte('date', dateRange.end);
        }

        const { data: metrics, error: metricsError } = await query
          .order('date', { ascending: false });

        if (metricsError) throw metricsError;
        setData(metrics || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [propertyId, dateRange?.start, dateRange?.end]);

  return { data, loading, error };
}

export function aggregateMetrics(metrics: MarketingMetric[]) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const sessions = metrics.reduce((sum, m) => sum + (m.sessions || 0), 0);
  const users = metrics.reduce((sum, m) => sum + (m.users || 0), 0);
  const pageviews = metrics.reduce((sum, m) => sum + (m.pageviews || 0), 0);
  const conversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
  const avgBounceRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.bounce_rate || 0), 0) / metrics.length
    : 0;
  const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;

  return {
    sessions,
    users,
    pageviews,
    conversions,
    avgBounceRate,
    conversionRate,
  };
}

const TRAFFIC_SOURCE_COLORS: { [key: string]: string } = {
  'organic': '#10B981',
  'direct': '#3B82F6',
  'referral': '#8B5CF6',
  'social': '#EC4899',
  'paid': '#F59E0B',
  'email': '#14B8A6',
  'other': '#6B7280',
};

export function getTrafficSourceData(metrics: MarketingMetric[]) {
  if (!metrics || metrics.length === 0) {
    return [];
  }

  const sources: { [key: string]: number } = {};
  let totalSessions = 0;

  metrics.forEach(m => {
    const source = (m.traffic_source || 'other').toLowerCase();
    const sessions = m.sessions || 0;
    sources[source] = (sources[source] || 0) + sessions;
    totalSessions += sessions;
  });

  return Object.entries(sources).map(([source, sessions]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    sessions,
    percentage: totalSessions > 0 ? ((sessions / totalSessions) * 100).toFixed(1) : '0',
    color: TRAFFIC_SOURCE_COLORS[source] || TRAFFIC_SOURCE_COLORS['other'],
    value: sessions,
  }));
}
