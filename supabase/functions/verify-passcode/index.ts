const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_PASSCODE = Deno.env.get('VERIFY_PASSCODE');

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
    // Get the passcode from the request body
    const { passcode } = await req.json();
    if (!VALID_PASSCODE) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Passcode validation is not configured.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate the passcode
    const isValid = passcode === VALID_PASSCODE;
    
    // Return the result
    return new Response(
      JSON.stringify({
        valid: isValid,
        message: isValid ? 'Valid passcode' : 'Invalid passcode',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        valid: false,
        message: error.message || 'An error occurred during passcode verification',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});