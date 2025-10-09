// Compliance BAA Renewal Reminders
// Sends reminders for upcoming BAA renewals via webhook (n8n)

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

    // Get webhook URL from settings
    const { data: webhookSettings } = await supabaseClient
      .from('compliance_settings')
      .select('value')
      .eq('key', 'n8n_webhook_baa_reminder')
      .single();

    if (!webhookSettings?.value?.enabled || !webhookSettings?.value?.url) {
      return new Response(
        JSON.stringify({ error: 'BAA reminder webhook not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find BAAs expiring in the next 60 days
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const { data: expiringBAAs, error } = await supabaseClient
      .from('hipaa_baas')
      .select('*')
      .eq('status', 'active')
      .gte('renewal_date', today.toISOString().split('T')[0])
      .lte('renewal_date', sixtyDaysFromNow.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    if (!expiringBAAs || expiringBAAs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No BAAs expiring soon', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send webhook for each expiring BAA
    const results = await Promise.all(
      expiringBAAs.map(async (baa) => {
        const daysUntilRenewal = Math.ceil(
          (new Date(baa.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const payload = {
          vendor: baa.vendor,
          renewal_date: baa.renewal_date,
          days_until_renewal: daysUntilRenewal,
          contact_email: baa.contact_email,
          contact_phone: baa.contact_phone,
          services_provided: baa.services_provided,
        };

        try {
          const response = await fetch(webhookSettings.value.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          return {
            vendor: baa.vendor,
            success: response.ok,
            status: response.status,
          };
        } catch (err) {
          return {
            vendor: baa.vendor,
            success: false,
            error: err.message,
          };
        }
      })
    );

    // Log audit event
    await supabaseClient.from('hipaa_audit_log').insert({
      actor: null,
      actor_email: 'system',
      action: 'baa_reminders_sent',
      object_table: 'hipaa_baas',
      details: {
        count: expiringBAAs.length,
        results,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: expiringBAAs.length,
        results,
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

