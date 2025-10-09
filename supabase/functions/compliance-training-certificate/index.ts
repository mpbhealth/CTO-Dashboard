// Compliance Training Certificate Generator
// Generates PDF certificates for completed HIPAA training

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

    const { attendance_id, user_name, training_name, completion_date } = await req.json();

    if (!attendance_id || !user_name || !training_name || !completion_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate simple HTML certificate (In production, use a proper PDF library)
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Georgia', serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(to bottom, #f8f9fa, #ffffff);
          }
          .certificate {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px;
            border: 10px solid #2563eb;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 {
            font-size: 48px;
            color: #1e40af;
            margin-bottom: 20px;
          }
          h2 {
            font-size: 24px;
            color: #374151;
            margin: 20px 0;
          }
          .name {
            font-size: 36px;
            color: #2563eb;
            font-weight: bold;
            margin: 30px 0;
          }
          .training {
            font-size: 28px;
            color: #1f2937;
            font-style: italic;
            margin: 20px 0;
          }
          .date {
            font-size: 18px;
            color: #6b7280;
            margin-top: 40px;
          }
          .signature {
            margin-top: 60px;
            padding-top: 10px;
            border-top: 2px solid #000;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Certificate of Completion</h1>
          <h2>This certifies that</h2>
          <div class="name">${user_name}</div>
          <h2>has successfully completed</h2>
          <div class="training">${training_name}</div>
          <h2>HIPAA Compliance Training</h2>
          <div class="date">
            Completed on ${new Date(completion_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div class="signature">
            <strong>HIPAA Officer</strong><br/>
            MPB Health
          </div>
        </div>
      </body>
      </html>
    `;

    // For now, return the HTML. In production, convert to PDF using a library like puppeteer
    // and upload to storage
    const certificateFilename = `certificate_${attendance_id}_${Date.now()}.html`;
    const certificatePath = `certificates/${user.id}/${certificateFilename}`;

    // Upload certificate HTML to storage
    const { error: uploadError } = await supabaseClient.storage
      .from('hipaa-exports')
      .upload(certificatePath, certificateHTML, {
        contentType: 'text/html',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('hipaa-exports')
      .getPublicUrl(certificatePath);

    // Update attendance record with certificate URL
    const { error: updateError } = await supabaseClient
      .from('hipaa_training_attendance')
      .update({ certificate_url: urlData.publicUrl })
      .eq('id', attendance_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate_url: urlData.publicUrl,
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

