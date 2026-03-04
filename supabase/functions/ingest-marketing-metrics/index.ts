import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface MarketingMetricInput {
  date?: string;
  sessions?: string | number;
  users?: string | number;
  pageviews?: string | number;
  bounce_rate?: string | number;
  conversions?: string | number;
  avg_session_duration?: string | number;
  revenue?: string | number;
  traffic_source?: string | null;
  campaign_name?: string | null;
  conversion_type?: string | null;
}

interface ProcessedMetric {
  property_id: string;
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number;
  conversions: number;
  avg_session_duration: number;
  revenue: number;
  traffic_source: string | null;
  campaign_name: string | null;
  conversion_type: string | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const body = await req.json();
    const { property_id, metrics, source = 'ga4' } = body;

    // Validate required fields
    if (!property_id) {
      return new Response(JSON.stringify({ error: 'Property ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!metrics || !Array.isArray(metrics)) {
      return new Response(JSON.stringify({ error: 'Metrics array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate property exists
    const { data: property, error: propertyError } = await supabase
      .from('marketing_properties')
      .select('id, name')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return new Response(JSON.stringify({ error: 'Property not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process and validate metrics
    const processedMetrics: ProcessedMetric[] = metrics.map((metric: MarketingMetricInput) => {
      // Ensure required fields exist
      const processedMetric: ProcessedMetric = {
        property_id,
        date: metric.date || new Date().toISOString().split('T')[0],
        sessions: parseInt(String(metric.sessions)) || 0,
        users: parseInt(String(metric.users)) || 0,
        pageviews: parseInt(String(metric.pageviews)) || 0,
        bounce_rate: parseFloat(String(metric.bounce_rate)) || 0,
        conversions: parseInt(String(metric.conversions)) || 0,
        avg_session_duration: parseFloat(String(metric.avg_session_duration)) || 0,
        revenue: parseFloat(String(metric.revenue)) || 0,
        traffic_source: metric.traffic_source || null,
        campaign_name: metric.campaign_name || null,
        conversion_type: metric.conversion_type || null
      };

      // Validate bounce rate is between 0 and 1
      if (processedMetric.bounce_rate > 1) {
        processedMetric.bounce_rate = processedMetric.bounce_rate / 100;
      }

      return processedMetric;
    });

    // Insert metrics using upsert to handle duplicates
    const { data, error } = await supabase
      .from('marketing_metrics')
      .upsert(processedMetrics, { 
        onConflict: 'property_id,date,traffic_source',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error inserting metrics:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the ingestion
    await supabase
      .from('sync_logs')
      .insert([{
        service: source,
        operation: 'ingest_metrics',
        status: 'success',
        message: `Ingested ${data?.length || 0} metrics for property ${property.name}`,
        details: { 
          property_id, 
          metrics_count: data?.length || 0,
          source 
        },
        records_processed: data?.length || 0
      }]);

    return new Response(JSON.stringify({ 
      success: true, 
      inserted: data?.length || 0,
      property: property.name 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_logs')
        .insert([{
          service: 'ga4',
          operation: 'ingest_metrics',
          status: 'failed',
          message: errorMessage,
          details: { error: String(error) },
          records_processed: 0
        }]);
    } catch (logError: unknown) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});