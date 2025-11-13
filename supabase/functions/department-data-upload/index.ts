import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Public-Upload-Token',
};

interface UploadRequest {
  department: 'concierge' | 'sales' | 'sales-leads' | 'sales-cancelations' | 'operations' | 'finance' | 'saudemax';
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

    let userId = 'anonymous';
    const authHeader2 = req.headers.get('Authorization');

    if (authHeader2) {
      const token2 = authHeader2.replace('Bearer ', '');
      const { data: { user: user2 }, error: authError2 } = await supabase.auth.getUser(token2);
      if (user2 && !authError2) {
        userId = user2.id;
      }
    }

    if (orgId !== 'public-upload' && userId === 'anonymous') {
      throw new Error('Unauthorized - authentication required for non-public uploads');
    }

    if (!department || !data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid request data');
    }

    const batchId = crypto.randomUUID();
    const uploadId = crypto.randomUUID();

    console.log('[UPLOAD] Starting upload for department:', department);
    console.log('[UPLOAD] Metadata:', JSON.stringify(metadata, null, 2));
    console.log('[UPLOAD] Row count:', data.length);
    console.log('[UPLOAD] User ID:', userId);
    console.log('[UPLOAD] Org ID:', orgId);

    const uploadRecord = {
      id: uploadId,
      org_id: orgId,
      uploaded_by: userId,
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
      console.error('Upload record data:', JSON.stringify(uploadRecord, null, 2));
      throw new Error(`Failed to create upload record: ${uploadError.message} (Code: ${uploadError.code})`);
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
          uploaded_by: userId,
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
              id: crypto.randomUUID(),

              enrollment_date: row.Date || row.date || row.enrollment_date || null,
              member_name: row.Name || row.name || row.member_name || null,
              plan: row.Plan || row.plan || null,
              family_size: row.Size || row.size || row.family_size || null,
              rep: row.Agent || row.agent || row.rep || null,
              is_group: (row['Group?'] || row.group || row.is_group) === 'TRUE' ||
                        (row['Group?'] || row.group || row.is_group) === true ||
                        (row['Group?'] || row.group || row.is_group) === 'true',

              order_date: row.order_date || null,
              order_id: row.order_id || null,
              member_id: row.member_id || null,
              amount: row.amount || null,
              channel: row.channel || null,
              status: row.status || null,
            };
            break;

          case 'sales-leads':
            const leadDate = row.Date || row.date || row.lead_date || row['Date'] || null;
            const leadName = row.Name || row.name || row.lead_name || row['Name'] || null;
            const leadSource = row.Source || row.source || row.lead_source || row['Source'] || null;
            const leadStatus = row.Status || row.status || row.lead_status || row['Status'] || null;
            const leadOwner = row['Lead Owner'] || row['lead owner'] || row['Lead owner'] || row.lead_owner || row['LEAD OWNER'] || null;
            const groupLeadValue = row['Group Lead?'] || row['group lead?'] || row['Group lead?'] || row.group_lead || row.is_group_lead || row['GROUP LEAD?'] || 'FALSE';
            const recentNotes = row['Recent Notes'] || row['recent notes'] || row['Recent notes'] || row.recent_notes || row['RECENT NOTES'] || null;

            processedRow = {
              ...processedRow,
              id: crypto.randomUUID(),
              lead_date: leadDate,
              lead_name: leadName,
              lead_source: leadSource,
              lead_status: leadStatus,
              lead_owner: leadOwner,
              is_group_lead: groupLeadValue === 'TRUE' || groupLeadValue === 'true' || groupLeadValue === true || groupLeadValue === 'Yes' || groupLeadValue === 'YES',
              recent_notes: recentNotes,
            };
            break;

          case 'sales-cancelations':
            const memberName = row['Name:'] || row['Name'] || row.Name || row.name || row.member_name || row['MEMBER NAME'] || null;
            const cancelReason = row['Reason:'] || row['Reason'] || row.Reason || row.reason || row.cancelation_reason || row['CANCELATION REASON'] || null;
            const membershipType = row['Membership:'] || row['Membership'] || row.Membership || row.membership || row.membership_type || row['MEMBERSHIP TYPE'] || null;
            const advisorName = row['Advisor:'] || row['Advisor'] || row.Advisor || row.advisor || row.advisor_name || row['ADVISOR NAME'] || null;
            const outcomeNotes = row['Outcome:'] || row['Outcome'] || row.Outcome || row.outcome || row.outcome_notes || row['OUTCOME NOTES'] || null;

            processedRow = {
              ...processedRow,
              id: crypto.randomUUID(),
              member_name: memberName,
              cancelation_reason: cancelReason,
              membership_type: membershipType,
              advisor_name: advisorName,
              outcome_notes: outcomeNotes,
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

          case 'saudemax':
            processedRow = {
              ...processedRow,
              staging_id: crypto.randomUUID(),
              enrollment_date: row.enrollment_date || null,
              member_id: row.member_id || null,
              program_type: row.program_type || null,
              status: row.status || 'active',
              engagement_score: row.engagement_score ? Number(row.engagement_score) : null,
              satisfaction_score: row.satisfaction_score ? Number(row.satisfaction_score) : null,
              health_improvement: row.health_improvement ? Number(row.health_improvement) : null,
            };
            break;

          default:
            throw new Error(`Unknown department: ${department}`);
        }

        processedRecords.push(processedRow);
        rowsImported++;
      } catch (error) {
        rowsFailed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ROW ERROR] Row ${i + 1} failed:`, errorMsg);
        console.error('[ROW DATA]', JSON.stringify(row, null, 2));
        errors.push(`Row ${i + 1}: ${errorMsg}`);
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
        case 'sales-leads':
          tableName = 'stg_sales_leads';
          break;
        case 'sales-cancelations':
          tableName = 'stg_sales_cancelations';
          break;
        case 'operations':
          tableName = 'stg_plan_cancellations';
          break;
        case 'finance':
          tableName = 'stg_finance_records';
          break;
        case 'saudemax':
          tableName = 'stg_saudemax_data';
          break;
      }

      console.log(`[INSERT] Inserting ${processedRecords.length} records into ${tableName}`);
      console.log('[SAMPLE RECORD]', JSON.stringify(processedRecords[0], null, 2));

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(processedRecords);

      if (insertError) {
        console.error('[INSERT ERROR] Error inserting records:', insertError);
        console.error('[INSERT ERROR] Table:', tableName);
        console.error('[INSERT ERROR] Error code:', insertError.code);
        console.error('[INSERT ERROR] Error message:', insertError.message);
        console.error('[INSERT ERROR] Error details:', insertError.details);
        throw new Error(`Failed to insert records: ${insertError.message} (Code: ${insertError.code})`);
      }

      console.log(`[INSERT SUCCESS] Successfully inserted ${processedRecords.length} records`);
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
