import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import ExcelJS from "npm:exceljs@4.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExportRequest {
  format: "csv" | "xlsx";
  data: Record<string, any>[];
  filename?: string;
  sheetName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userRoles } = await supabaseClient
      .from("v_current_roles")
      .select("role")
      .eq("user_id", user.id);

    const allowedRoles = ["admin", "ceo", "hipaa_officer"];
    const hasPermission = userRoles?.some((r: any) => allowedRoles.includes(r.role));

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions to export data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ExportRequest = await req.json();
    const { format, data, filename, sheetName } = body;

    if (!format || !data || !Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: format and data array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data to export" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const defaultFilename = `export_${Date.now()}.${format}`;
    const exportFilename = filename || defaultFilename;

    let buffer: Uint8Array;
    let contentType: string;

    if (format === "csv") {
      const keys = Object.keys(data[0]);
      const header = keys.join(",");
      const rows = data.map((row) =>
        keys.map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";
          const str = String(value);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      );
      const csv = [header, ...rows].join("\n");
      buffer = new TextEncoder().encode("\ufeff" + csv);
      contentType = "text/csv;charset=utf-8";
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName || "Sheet1");

      const keys = Object.keys(data[0]);
      worksheet.addRow(keys);

      data.forEach((row) => {
        const values = keys.map((key) => row[key]);
        worksheet.addRow(values);
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.columns = keys.map((key) => ({
        key,
        width: Math.max(key.length + 5, 15),
      }));

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      buffer = new Uint8Array(arrayBuffer);
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: "data_export",
      resource_type: "export",
      resource_id: exportFilename,
      details: {
        format,
        row_count: data.length,
        filename: exportFilename,
      },
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${exportFilename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Export failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
