import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface MarketingProperty {
  id: string;
  name: string;
  url: string;
  type: string;
  status: string;
}

export interface MarketingMetric {
  id: string;
  property_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export function useMarketingProperties() {
  return useQuery({
    queryKey: ['marketingProperties'],
    queryFn: async (): Promise<MarketingProperty[]> => {
      const { data, error } = await supabase.from('marketing_properties').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMarketingMetrics() {
  return useQuery({
    queryKey: ['marketingMetrics'],
    queryFn: async (): Promise<MarketingMetric[]> => {
      const { data, error } = await supabase.from('marketing_metrics').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function aggregateMetrics(metrics: MarketingMetric[]) {
  return metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + metric.impressions,
      clicks: acc.clicks + metric.clicks,
      conversions: acc.conversions + metric.conversions,
      spend: acc.spend + metric.spend,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );
}

export function getTrafficSourceData(metrics: MarketingMetric[], properties: MarketingProperty[]) {
  const sourceMap = new Map<string, any>();

  metrics.forEach((metric) => {
    const property = properties.find((p) => p.id === metric.property_id);
    if (!property) return;

    const source = property.type;
    if (!sourceMap.has(source)) {
      sourceMap.set(source, {
        source,
        visits: 0,
        conversions: 0,
      });
    }

    const data = sourceMap.get(source);
    data.visits += metric.clicks;
    data.conversions += metric.conversions;
  });

  return Array.from(sourceMap.values());
}
