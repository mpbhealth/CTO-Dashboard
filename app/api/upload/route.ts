import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const exportSchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv"),
  filename: z.string().optional(),
  // Data should be an array of objects
  data: z.array(z.record(z.any())),
});

export const runtime = "nodejs";

function toCSV(data: any[]): string {
  if (!data.length) return "";
  const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = [
    headers.join(","),
    ...data.map(row => headers.map(h => esc(row[h])).join(","))
  ];
  // Prepend UTF-8 BOM for Excel
  return "\ufeff" + rows.join("\n");
}

async function toXLSXBuffer(data: any[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Export");
  const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
  ws.addRow(headers);
  data.forEach(row => ws.addRow(headers.map(h => row[h])));
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = exportSchema.parse(body);
    const filename = parsed.filename || `export-${Date.now()}.${parsed.format}`;

    if (parsed.format === "csv") {
      const csv = toCSV(parsed.data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store"
        }
      });
    } else {
      const buf = await toXLSXBuffer(parsed.data);
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store"
        }
      });
    }
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json({ error: err.message || "Export failed" }, { status: 400 });
  }
}
