import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImportRequest {
  data: Array<Record<string, unknown>>;
  targetTable: 'cancellations' | 'leads' | 'sales' | 'concierge';
  sheetName?: string;
  orgId: string;
}

interface ImportResponse {
  success: boolean;
  batchId: string;
  rowsImported: number;
  rowsFailed: number;
  errors?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile || !["ceo", "admin"].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. CEO or admin role required." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody: ImportRequest = await req.json();
    const { data, targetTable, sheetName, orgId } = requestBody;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty data array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (orgId !== profile.org_id) {
      return new Response(
        JSON.stringify({ error: "Organization mismatch" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const batchId = crypto.randomUUID();
    const errors: string[] = [];
    let rowsImported = 0;
    let rowsFailed = 0;

    const rawTableMap = {
      cancellations: "stg_raw_cancellations",
      leads: "stg_raw_leads",
      sales: "stg_raw_sales",
      concierge: "stg_raw_concierge_interactions",
    };

    const normalizedTableMap = {
      cancellations: "stg_plan_cancellations",
      leads: "stg_crm_leads",
      sales: "stg_sales_orders",
      concierge: "stg_concierge_interactions",
    };

    const rawTableName = rawTableMap[targetTable];
    const _normalizedTableName = normalizedTableMap[targetTable];

    await supabase.from("data_import_history").insert({
      org_id: orgId,
      import_batch_id: batchId,
      source_table: rawTableName,
      sheet_name: sheetName || targetTable,
      status: "in_progress",
    });

    for (const row of data) {
      try {
        let transformedRow: Record<string, unknown> = {
          org_id: orgId,
          import_batch_id: batchId,
        };

        if (targetTable === "cancellations") {
          transformedRow = {
            ...transformedRow,
            sheet_name: sheetName || "Unknown",
            name: row.name || row["Name:"] || null,
            reason: row.reason || row["Reason:"] || null,
            membership: row.membership || row["Membership:"] || null,
            advisor: row.advisor || row["Advisor:"] || null,
            outcome: row.outcome || row["Outcome:"] || null,
          };
        } else if (targetTable === "leads") {
          transformedRow = {
            ...transformedRow,
            date: row.date || row["Date"] || null,
            name: row.name || row["Name"] || null,
            source: row.source || row["Source"] || null,
            status: row.status || row["Status"] || null,
            lead_owner: row.lead_owner || row["Lead Owner"] || null,
            group_lead: row.group_lead || row["Group Lead?"] || null,
            recent_notes: row.recent_notes || row["Recent Notes"] || null,
          };
        } else if (targetTable === "sales") {
          transformedRow = {
            ...transformedRow,
            date: row.date || row["Date"] || null,
            name: row.name || row["Name"] || null,
            plan: row.plan || row["Plan"] || null,
            size: row.size || row["Size"] || null,
            agent: row.agent || row["Agent"] || null,
            group_flag: row.group || row["Group?"] || null,
          };
        } else if (targetTable === "concierge") {
          transformedRow = {
            ...transformedRow,
            interaction_date: row.interaction_date || row.date || null,
            member_name: row.member_name || row.name || null,
            member_phone: row.member_phone || row.phone || null,
            agent: row.agent || null,
            interaction_type: row.interaction_type || row.channel || "Phone",
            notes: row.notes || null,
            duration_minutes: row.duration_minutes || row.duration || null,
          };
        }

        const { error: insertError } = await supabase
          .from(rawTableName)
          .insert(transformedRow);

        if (insertError) {
          errors.push(`Row ${rowsImported + rowsFailed + 1}: ${insertError.message}`);
          rowsFailed++;
        } else {
          rowsImported++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Row ${rowsImported + rowsFailed + 1}: ${errorMsg}`);
        rowsFailed++;
      }
    }

    if (rowsImported > 0) {
      try {
        if (targetTable === "cancellations") {
          await supabase.rpc("etl_transform_cancellations");
        } else if (targetTable === "leads") {
          await supabase.rpc("etl_transform_leads");
        } else if (targetTable === "sales") {
          await supabase.rpc("etl_transform_sales");
        } else if (targetTable === "concierge") {
          await supabase.rpc("etl_transform_concierge");
        }
      } catch (etlError) {
        console.error("ETL transformation error:", etlError);
      }
    }

    await supabase
      .from("data_import_history")
      .update({
        rows_imported: rowsImported,
        rows_failed: rowsFailed,
        status: rowsFailed === 0 ? "completed" : "failed",
        error_message: errors.length > 0 ? errors.slice(0, 10).join("; ") : null,
        completed_at: new Date().toISOString(),
      })
      .eq("import_batch_id", batchId);

    const response: ImportResponse = {
      success: rowsImported > 0,
      batchId,
      rowsImported,
      rowsFailed,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: rowsImported > 0 ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
