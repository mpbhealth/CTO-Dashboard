import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMarketingProperties() {
  const [data, setData] = useState<any[]>([]);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

export function useMarketingMetrics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data: metrics, error: metricsError } = await supabase
          .from('marketing_metrics')
          .select('*')
          .order('date', { ascending: false });

        if (metricsError) throw metricsError;
        setData(metrics || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return { data, loading, error };
}

export function aggregateMetrics(metrics: any[]) {
  const totalVisits = metrics.reduce((sum, m) => sum + (m.visits || 0), 0);
  const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
  const conversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

  return {
    totalVisits,
    totalConversions,
    conversionRate: conversionRate.toFixed(2),
  };
}

export function getTrafficSourceData(metrics: any[]) {
  const sources: { [key: string]: number } = {};
  metrics.forEach(m => {
    const source = m.traffic_source || 'Unknown';
    sources[source] = (sources[source] || 0) + (m.visits || 0);
  });

  return Object.entries(sources).map(([name, value]) => ({ name, value }));
}
