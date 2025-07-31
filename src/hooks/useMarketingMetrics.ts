import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  conversion_type: string | null;
}

export function useMarketingMetrics(
  propertyId: string | null, 
  timeRange: string = '30d',
  filters: { source?: string; conversion?: string } = {}
) {
  const [metrics, setMetrics] = useState<MarketingMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setMetrics([]);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const days = parseInt(timeRange.replace('d', ''), 10);
        const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

        let query = supabase
          .from('marketing_metrics')
          .select('*')
          .eq('property_id', propertyId)
          .gte('date', startDate)
          .order('date', { ascending: true });

        // Apply filters
        if (filters.source) {
          query = query.eq('traffic_source', filters.source);
        }
        if (filters.conversion) {
          query = query.eq('conversion_type', filters.conversion);
        }

        const { data, error } = await query;
        if (error) throw error;
        setMetrics(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching metrics');
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [propertyId, timeRange, filters.source, filters.conversion]);

  // Calculate aggregated KPIs from metrics
  const calculateKPIs = () => {
    if (metrics.length === 0) {
      return {
        totalSessions: '0',
        totalUsers: '0',
        avgBounceRate: '0%',
        totalConversions: '0'
      };
    }

    const totals = metrics.reduce((acc, metric) => {
      acc.sessions += metric.sessions;
      acc.users += metric.users;
      acc.conversions += metric.conversions;
      acc.bounceRateSum += metric.bounce_rate;
      return acc;
    }, { sessions: 0, users: 0, conversions: 0, bounceRateSum: 0 });

    const avgBounceRate = metrics.length > 0 ? totals.bounceRateSum / metrics.length : 0;

    return {
      totalSessions: totals.sessions.toLocaleString(),
      totalUsers: totals.users.toLocaleString(),
      avgBounceRate: `${Math.round(avgBounceRate)}%`,
      totalConversions: totals.conversions.toLocaleString()
    };
  };

  // Get traffic source breakdown
  const getTrafficSources = () => {
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
      percentage: total > 0 ? Math.round((data.sessions / total) * 100) : 0
    }));
  };

  return { 
    metrics, 
    loading, 
    error,
    kpis: calculateKPIs(),
    trafficSources: getTrafficSources()
  };
}