// Compliance Evidence Upload Edge Function
// Generates signed URLs for secure evidence file uploads

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: userRoles } = await supabaseClient
      .from('v_current_roles')
      .select('role')
      .eq('user_id', user.id);

    const allowedRoles = ['admin', 'hipaa_officer', 'privacy_officer', 'security_officer'];
    const hasPermission = userRoles?.some((r: any) => allowedRoles.includes(r.role));

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { filename, category } = await req.json();

    if (!filename || !category) {
      return new Response(
        JSON.stringify({ error: 'Filename and category are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const filePath = `${category}/${user.id}/${timestamp}_${sanitizedFilename}`;

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrl, error } = await supabaseClient.storage
      .from('hipaa-evidence')
      .createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        signedUrl: signedUrl.signedUrl,
        path: filePath,
        token: signedUrl.token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

