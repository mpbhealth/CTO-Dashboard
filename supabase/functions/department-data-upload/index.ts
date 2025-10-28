import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface UploadRequest {
  department: 'concierge' | 'sales' | 'operations' | 'finance';
  data: Array<Record<string, unknown>>;
  metadata: {
    fileName: string;
    fileSize: number;
    rowCount: number;
  };
  orgId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: UploadRequest = await req.json();
    const { department, data, metadata, orgId } = requestData;

    if (!department || !data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid request data');
    }

    const batchId = crypto.randomUUID();
    const uploadId = crypto.randomUUID();

    const uploadRecord = {
      id: uploadId,
      org_id: orgId,
      uploaded_by: user.id,
      department,
      file_name: metadata.fileName,
      file_size: metadata.fileSize,
      row_count: metadata.rowCount,
      rows_imported: 0,
      rows_failed: 0,
      status: 'processing',
      batch_id: batchId,
      validation_errors: null,
      created_at: new Date().toISOString(),
    };

    const { error: uploadError } = await supabase
      .from('department_uploads')
      .insert(uploadRecord);

    if (uploadError) {
      console.error('Error creating upload record:', uploadError);
      throw new Error('Failed to create upload record');
    }

    let rowsImported = 0;
    let rowsFailed = 0;
    const errors: string[] = [];

    const processedRecords = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        let processedRow: Record<string, unknown> = {
          org_id: orgId,
          uploaded_by: user.id,
          upload_batch_id: batchId,
          sheet_name: metadata.fileName.replace(/\.(csv|xlsx)$/i, ''),
          created_at: new Date().toISOString(),
        };

        switch (department) {
          case 'concierge':
            processedRow = {
              ...processedRow,
              staging_id: crypto.randomUUID(),
              occurred_at: row.occurred_at || null,
              member_id: row.member_id || null,
              agent_name: row.agent_name || null,
              channel: row.channel || null,
              result: row.result || null,
              duration_minutes: row.duration_minutes ? Number(row.duration_minutes) : null,
              notes: row.notes || null,
            };
            break;

          case 'sales':
            processedRow = {
              ...processedRow,
              staging_id: crypto.randomUUID(),
              order_date: row.order_date || null,
              order_id: row.order_id || null,
              member_id: row.member_id || null,
              amount: row.amount ? Number(row.amount) : 0,
              plan: row.plan || null,
              rep: row.rep || null,
              channel: row.channel || null,
              status: row.status || null,
            };
            break;

          case 'operations':
            processedRow = {
              ...processedRow,
              staging_id: crypto.randomUUID(),
              cancel_date: row.cancel_date || null,
              member_id: row.member_id || null,
              reason: row.reason || null,
              agent: row.agent || null,
              save_attempted: row.save_attempted === 'true' || row.save_attempted === true || false,
              save_successful: row.save_successful === 'true' || row.save_successful === true || false,
              mrr_lost: row.mrr_lost ? Number(row.mrr_lost) : 0,
            };
            break;

          case 'finance':
            processedRow = {
              ...processedRow,
              staging_id: crypto.randomUUID(),
              record_date: row.record_date || null,
              category: row.category || 'other',
              amount: row.amount ? Number(row.amount) : 0,
              description: row.description || null,
              vendor_customer: row.vendor_customer || null,
              status: row.status || 'active',
              notes: row.notes || null,
            };
            break;

          default:
            throw new Error(`Unknown department: ${department}`);
        }

        processedRecords.push(processedRow);
        rowsImported++;
      } catch (error) {
        rowsFailed++;
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (processedRecords.length > 0) {
      let tableName = '';
      switch (department) {
        case 'concierge':
          tableName = 'stg_concierge_interactions';
          break;
        case 'sales':
          tableName = 'stg_sales_orders';
          break;
        case 'operations':
          tableName = 'stg_plan_cancellations';
          break;
        case 'finance':
          tableName = 'stg_finance_records';
          break;
      }

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(processedRecords);

      if (insertError) {
        console.error('Error inserting records:', insertError);
        throw new Error('Failed to insert records');
      }
    }

    const { error: updateError } = await supabase
      .from('department_uploads')
      .update({
        rows_imported: rowsImported,
        rows_failed: rowsFailed,
        status: rowsFailed === 0 ? 'completed' : 'completed',
        validation_errors: errors.length > 0 ? { errors } : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uploadId);

    if (updateError) {
      console.error('Error updating upload record:', updateError);
    }

    const responseData = {
      success: rowsFailed === 0,
      batchId,
      uploadId,
      rowsImported,
      rowsFailed,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
