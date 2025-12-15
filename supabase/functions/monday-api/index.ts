import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests - must return 200 OK for CORS to pass
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    // Create Supabase client using service role (only available in Edge Functions)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if Monday.com configuration exists
    const { data: configs, error: configError } = await supabaseClient
      .from('monday_config')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    // If no config exists, return mock data for demo purposes
    if (configError || !configs || configs.length === 0 || !configs[0]?.access_token) {
      console.log('No Monday.com configuration found, returning demo data');
      
      // Return demo data structure
      const demoData = {
        data: {
          boards: [
            {
              id: '123456789',
              name: 'MPB Health Development',
              description: 'Main development board',
              items_count: 12,
              groups: [
                { id: 'group1', title: 'In Progress' },
                { id: 'group2', title: 'Review' }
              ],
              items_page: {
                items: [
                  {
                    id: 'item1',
                    name: 'Implement user authentication system',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-20T15:30:00Z',
                    creator: {
                      name: 'Vinnie R. Tannous',
                      email: 'vinnie@mpbhealth.com'
                    },
                    column_values: [
                      { id: 'status', text: 'Working on it', value: 'working' },
                      { id: 'person', text: 'Sarah Johnson', value: 'user123' }
                    ]
                  },
                  {
                    id: 'item2', 
                    name: 'Database optimization for member queries',
                    created_at: '2024-01-10T09:00:00Z',
                    updated_at: '2024-01-25T11:15:00Z',
                    creator: {
                      name: 'Michael Chen',
                      email: 'michael@mpbhealth.com'
                    },
                    column_values: [
                      { id: 'status', text: 'Done', value: 'done' },
                      { id: 'person', text: 'David Kim', value: 'user456' }
                    ]
                  },
                  {
                    id: 'item3',
                    name: 'API endpoint security review',
                    created_at: '2024-01-22T14:00:00Z',
                    updated_at: '2024-01-22T14:00:00Z',
                    creator: {
                      name: 'Emily Rodriguez',
                      email: 'emily@mpbhealth.com'
                    },
                    column_values: [
                      { id: 'status', text: 'Stuck', value: 'stuck' },
                      { id: 'person', text: 'Vinnie R. Tannous', value: 'user789' }
                    ]
                  }
                ]
              }
            },
            {
              id: '987654321',
              name: 'SaudeMAX Development',
              description: 'Brazil operations board',
              items_count: 8,
              groups: [
                { id: 'group3', title: 'Backlog' },
                { id: 'group4', title: 'Testing' }
              ],
              items_page: {
                items: [
                  {
                    id: 'item4',
                    name: 'Portuguese language localization',
                    created_at: '2024-01-18T12:00:00Z',
                    updated_at: '2024-01-26T16:45:00Z',
                    creator: {
                      name: 'Carlos Silva',
                      email: 'carlos@saudemax.com'
                    },
                    column_values: [
                      { id: 'status', text: 'Working on it', value: 'working' },
                      { id: 'person', text: 'Ana Rodriguez', value: 'user999' }
                    ]
                  },
                  {
                    id: 'item5',
                    name: 'Payment gateway integration for Brazil',
                    created_at: '2024-01-20T08:30:00Z',
                    updated_at: '2024-01-20T08:30:00Z',
                    creator: {
                      name: 'Maria Garcia',
                      email: 'maria@saudemax.com'
                    },
                    column_values: [
                      { id: 'status', text: 'Backlog', value: 'backlog' },
                      { id: 'person', text: 'Robert Wilson', value: 'user888' }
                    ]
                  }
                ]
              }
            }
          ]
        }
      };

      // Log demo data usage
      await supabaseClient.from('monday_sync_log').insert([{
        operation: 'demo_data',
        status: 'success',
        message: 'Returning demo data - Monday.com not configured',
        details: { demo: true },
        duration_ms: 0,
        items_processed: demoData.data.boards.reduce((acc, board) => acc + board.items_page.items.length, 0),
        timestamp: new Date().toISOString(),
      }]);

      return new Response(JSON.stringify(demoData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = configs[0];

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
        'Authorization': config.access_token,
        'API-Version': '2023-10',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Monday.com API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from Monday.com API');
    }

    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(`Monday.com API errors: ${JSON.stringify(data.errors)}`);
    }

    // Ensure data.data exists
    if (!data.data) {
      throw new Error('No data returned from Monday.com API');
    }
    
    // Log successful API request
    await supabaseClient.from('monday_sync_log').insert([{
      operation: 'api_request',
      status: 'success',
      message: 'Successfully retrieved data from Monday.com API',
      details: { query, response_size: JSON.stringify(data).length },
      duration_ms: 0,
      items_processed: data.data.boards ? data.data.boards.length : 0,
      timestamp: new Date().toISOString(),
    }]);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error proxying to Monday.com:', error);
    
    // Log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient.from('monday_sync_log').insert([{
        operation: 'api_request',
        status: 'failed',
        message: error.message || 'Unknown error occurred',
        details: { error: error.toString() },
        duration_ms: 0,
        items_processed: 0,
        timestamp: new Date().toISOString(),
      }]);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred proxying to Monday.com' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});