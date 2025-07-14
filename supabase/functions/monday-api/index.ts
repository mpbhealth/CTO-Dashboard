import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client using service role (only available in Edge Functions)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Monday.com credentials from the database
    const { data: configs, error: configError } = await supabaseClient
      .from('monday_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !configs || !configs.access_token) {
      throw new Error('Unable to retrieve Monday.com configuration');
    }

    // Get query from request body
    const { query } = await req.json();
    if (!query) {
      throw new Error('No GraphQL query provided');
    }

    // Forward request to Monday.com API
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': configs.access_token,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    // Log to sync table
    await supabaseClient.from('monday_sync_log').insert([{
      operation: 'api_request',
      status: data.errors ? 'failed' : 'success',
      message: data.errors ? JSON.stringify(data.errors) : 'Successfully retrieved data from Monday.com API',
      details: { query },
      duration_ms: 0, // We could calculate this if needed
      items_processed: 0,
      timestamp: new Date().toISOString(),
    }]);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error proxying to Monday.com:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred proxying to Monday.com' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});